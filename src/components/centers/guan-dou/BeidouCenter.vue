<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import BaseCenter from '@/components/base/BaseCenter.vue'
import {
  beidouPositions,
  magnitudeToRadius,
  horizonCurve,
  horizonCardinals,
  DEFAULT_OBSERVER_LAT,
  DEFAULT_OBSERVER_LON
} from '@/utils/beidou'
import {
  ziweiPositions,
  ZIWEI_EAST_WALL,
  ZIWEI_WEST_WALL,
  POLARIS
} from '@/utils/ziwei'

/**
 * ⚫ 北斗 + 紫微垣 圆心组件（时间驱动）
 *
 * ⚠️ 五层架构规范：标准圆心组件接口
 *   - 仅接受 radius（由 RingStack #center slot 注入）
 *   - 支持 MaybeRef<Date> 时间驱动
 *   - 支持 rotationDirection 统一注入
 *
 * 绘制内容（自外向内叠层）：
 *   1. 圆心边界（虚线圆，标识"这里是一个圆心区"的视觉边界）
 *   2. 外接/内接赤纬圈（当前纬线 & 内纬线）—— 揭示"天极等距方位投影"本质
 *   3. 紫微垣东西两藩（拱极天区宫墙，紫色系线）
 *   4. 北极星（勾陈一 α UMi，金色十字光芒标记）
 *   5. 北斗七星连线（勺+柄），基于岁差修正的当前历元赤道坐标
 *   6. 七颗星本体 + 中文名（天枢/天璇/天玑/天权/玉衡/开阳/摇光）
 *   7. 天极中心十字标记（几何天极，与勾陈一分离约 0.75°）
 *
 * 天文原理：
 *   - 恒星位置：J2000 星表 (Hipparcos) → `fixedStarEquatorial` 加入岁差 →
 *     用「本地恒星时 − 赤经」得到时角 → `project(HA, dec)` 天极等距方位投影 →
 *     数学平面 (y 上) → SVG (y 取反)。
 *   - 北斗、紫微墙、勾陈一三者共享同一投影，几何自洽。
 *   - 岁差可视化：拖到公元前 3000 年，会看到"右枢（Thuban）"逼近天极——
 *     这就是紫微右枢命名的物理由来。
 */
interface Props {
  /** 圆心区半径（RingStack #center slot 提供的 innerRadius，等于月将环内边） */
  radius?: number
  /** 星图缩放系数 (0.1~1.0) */
  scale?: number
  /** 时间源 */
  time?: MaybeRef<Date>
  /** 统一旋转方向控制 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
  /** 是否显示星名中文标签 */
  showLabels?: boolean
  /** 是否显示天极十字 */
  showPole?: boolean
  /** 是否显示外接/内接赤纬圈（揭示天极等距投影原理） */
  showDeclinationBounds?: boolean
  /** 是否显示紫微垣东西两藩 + 北极星 */
  showZiwei?: boolean
  /** 是否显示地平圈（观测者视界，仅依赖纬度） */
  showHorizon?: boolean
  /** 观测者纬度（度，北正南负，默认洛阳 34.65°） */
  observerLat?: number
  /** 观测者经度（度，东正西负，默认洛阳 112.45°） · 影响斗柄相位 */
  observerLon?: number
  /**
   * 观测点显示名（用于地平线副标题）。
   * 例："洛阳（默认）" / "当前位置" / "北京 39.9°N"
   */
  locationLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200,
  scale: 0.98,
  rotationDirection: 'clockwise',
  showLabels: true,
  showPole: true,
  showDeclinationBounds: true,
  showZiwei: true,
  showHorizon: true,
  observerLat: DEFAULT_OBSERVER_LAT,
  observerLon: DEFAULT_OBSERVER_LON,
  locationLabel: '洛阳（默认）'
})

/** ⚠️ 五层架构范式：确保 time 始终是响应式的 */
const timeRef = computed(() => unref(props.time) ?? new Date())

/** 七星当前历元位置（含岁差 + 观测经度） */
const stars = computed(() => beidouPositions(timeRef.value, props.observerLon))

/**
 * 紫微垣东西两藩位置 + 北极星位置（含岁差 + 观测经度）。
 *
 * 复用 `ziweiPositions()`（同一天极等距投影公式），槽位与北斗错开：
 *   北斗占 0-6，紫微东藩占 8-15（mod 8 后与 0-7 复用，但 STAR_SLOTS 长度为 8，
 *   `fixedStarEquatorial` 内部会 mod，串行调用不冲突）
 */
const ziwei = computed(() => ({
  east: ziweiPositions(ZIWEI_EAST_WALL, timeRef.value, 8, props.observerLon),
  west: ziweiPositions(ZIWEI_WEST_WALL, timeRef.value, 16, props.observerLon),
  polaris: ziweiPositions([POLARIS], timeRef.value, 24, props.observerLon)[0]!
}))

/**
 * 投影平面 → SVG 坐标缩放系数（工厂函数）
 *
 * 七星在投影平面上的极径 (90-δ)/90 约 0.31 ~ 0.45（赤纬 49°–62°）。
 * 让最远的一颗（摇光，δ≈49°）落在 actualRadius 的 85% 处，
 * 星图充分利用圆心区，同时留一小圈给最外那颗星的中文标签不被裁掉。
 *
 * ⚠️ 由于 BeidouCenter 通过 BaseCenter `#default="{ actualRadius }"` 拿到
 * 已缩放的半径（消除重复 clamp），此函数需接收 actualRadius 参数。
 */
const computeProjectionScale = (actualRadius: number): number => {
  const rs = stars.value.map((s) => Math.hypot(s.plane.x, s.plane.y))
  const maxR = Math.max(...rs)
  return (actualRadius * 0.85) / maxR
}

/**
 * 与环 `polarToCartesian` 保持"同一根镜像轴"。
 *
 * `polarToCartesian(angle, r, 'counterclockwise')` 对角度取反 →
 * 等价于对最终 SVG y 分量取反（垂直翻转，子↔午上下对调）。
 *
 * 因此当 rotationDirection = 'counterclockwise' 时，
 * BeidouCenter 也必须**垂直**翻转（把额外的 −1 应用到 y），
 * 而非水平翻转（错误地应用到 x）——否则子/午上下翻、七星左右翻，
 * 斗柄不再对齐外环高亮格。
 */
const dirSign = computed(() => (props.rotationDirection === 'counterclockwise' ? -1 : 1))

/**
 * 数学平面 → SVG 坐标（工厂函数：绑定当前 projectionScale + dirSign）
 *   - clockwise（面朝北仰望，默认）：y 取反（math y↑ → svg y↓）
 *   - counterclockwise（地图约定）：再取一次反 → 相当于不翻转，
 *     整幅星图相对 clockwise 视图垂直镜像，与外环子↔午对调同步。
 */
const makeToSvg = (projectionScale: number) => (p: { x: number; y: number }) => ({
  x: p.x * projectionScale,
  y: -p.y * projectionScale * dirSign.value
})

/**
 * 七星 SVG 坐标（渲染用）· 需要 BaseCenter #default slot 提供的 actualRadius。
 *
 * 通过工厂函数动态生成 starPoints：给定 actualRadius → 计算 projectionScale →
 * 绑定 toSvg → 派生七星坐标。这样 BeidouCenter 不再重复 clamp。
 */
const computeStarPoints = (actualRadius: number) => {
  const projectionScale = computeProjectionScale(actualRadius)
  const toSvg = makeToSvg(projectionScale)
  return stars.value.map((s) => ({
    ...s,
    ...toSvg(s.plane),
    r: magnitudeToRadius(s.mag, 4.6)
  }))
}

/** polyline points 字符串工厂 */
const computePolyPoints = (starPoints: ReturnType<typeof computeStarPoints>): string =>
  starPoints.map((p) => `${p.x},${p.y}`).join(' ')

/**
 * 紫微垣墙星投影坐标（复用北斗的 projectionScale + toSvg，保持几何统一）。
 *
 * 紫微墙星赤纬多在 +58°~+78°，投影极径 (90-δ)/90 ≈ 0.13~0.36，
 * 一定在北斗最远星（摇光，极径≈0.45）之内，无需单独缩放。
 */
const computeZiweiPoint = (
  actualRadius: number,
  z: ReturnType<typeof ziweiPositions>[number]
) => {
  const projectionScale = computeProjectionScale(actualRadius)
  const toSvg = makeToSvg(projectionScale)
  return { ...z, ...toSvg(z.plane), r: magnitudeToRadius(z.mag, 3.4) }
}

const computeZiweiWall = (
  actualRadius: number,
  stars: ReturnType<typeof ziweiPositions>
) => stars.map((z) => computeZiweiPoint(actualRadius, z))

const computeWallPoints = (wall: ReturnType<typeof computeZiweiWall>): string =>
  wall.map((p) => `${p.x},${p.y}`).join(' ')

/**
 * 赤纬圈边界（当前历元）· 揭示北斗盘=天极等距投影的物理源头。
 *
 * 天极等距方位投影下：极径 = (90° − δ)/90°，赤纬圈是同心圆。
 * 取七星中离极最近（赤纬最高）与最远（赤纬最低）两颗，画出对应的
 * 赤纬圈，观者立刻知道：
 *   · 圆心 = 天北极
 *   · 每颗星在环上的位置 = 该星的时角（HA = LST − RA）
 *   · 内圈→外圈之间的径向宽度 = 北斗七星的赤纬跨度（约 12°）
 *
 * 内圈：离极最近的星（当代玉衡 δ≈+55.96°）
 * 外圈：离极最远的星（当代摇光 δ≈+49.31°）
 * 数千年时间尺度上，随岁差这两条线的赤纬值会缓慢改变，肉眼可见。
 */
const computeDeclinationBounds = (actualRadius: number) => {
  const projectionScale = computeProjectionScale(actualRadius)
  const decs = stars.value.map((s) => s.dec)
  const decMin = Math.min(...decs) // 离极最远 → 外圈
  const decMax = Math.max(...decs) // 离极最近 → 内圈
  return {
    outer: {
      dec: decMin,
      radius: (projectionScale * (90 - decMin)) / 90
    },
    inner: {
      dec: decMax,
      radius: (projectionScale * (90 - decMax)) / 90
    }
  }
}

/** 赤纬格式化：+55.96° / −49.31° */
const formatDec = (dec: number): string => {
  const sign = dec >= 0 ? '+' : '−'
  return `${sign}${Math.abs(dec).toFixed(2)}°`
}

/**
 * 地平圈曲线（时间无关，仅依赖观测者纬度）。
 *
 * 在天极等距投影盘上，地平圈是一条偏心闭合曲线：
 *   · 北点 → 靠近天极（盘下方）
 *   · 南点 → 离极最远（盘上方），洛阳 φ=34.65° 时 r≈1.61，可能超出可视范围
 *   · 东西点 → 落在赤道圆上（r=1）
 *
 * 显示方式：把超出可视半径的部分裁掉（clip 到 actualRadius 内），
 * 用户看到"从天极往南延伸的一段弧线"——极北的地平线。
 *
 * 时间演进时地平圈**不动**，而恒星绕极旋转，这就是"地球自转"的直观演示。
 */
const computeHorizonPath = (actualRadius: number): string => {
  const projectionScale = computeProjectionScale(actualRadius)
  const toSvg = makeToSvg(projectionScale)
  const pts = horizonCurve(props.observerLat, 180)
  const svgPts = pts.map((p) => toSvg(p))
  // SVG 路径：起点 M，之后 L 连线；用 L 而非 A（我们本来就是折线采样）
  const [first, ...rest] = svgPts
  if (!first) return ''
  const parts = [`M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`]
  for (const p of rest) parts.push(`L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
  parts.push('Z')
  return parts.join(' ')
}

/** 地平四方位点（北/东/南/西）投影 */
const computeHorizonCardinals = (actualRadius: number) => {
  const projectionScale = computeProjectionScale(actualRadius)
  const toSvg = makeToSvg(projectionScale)
  return horizonCardinals(props.observerLat).map((c) => ({
    ...c,
    ...toSvg(c.plane)
  }))
}
</script>

<template>
  <BaseCenter
    :radius="radius"
    :scale="scale"
    :time="timeRef"
    :rotation-direction="rotationDirection"
  >
    <template #default="{ actualRadius }">
      <g class="beidou-center">
        <!-- clipPath：把地平圈裁到圆心可视范围内 -->
        <defs>
          <clipPath :id="`beidou-visible-${(radius as number).toFixed(0)}`">
            <circle cx="0" cy="0" :r="actualRadius" />
          </clipPath>
        </defs>

        <!-- 圆心边界虚线圆（视觉标识：这里是圆心区） -->
        <circle
          cx="0"
          cy="0"
          :r="radius"
          fill="none"
          stroke="#5A6B7C"
          stroke-width="0.8"
          stroke-dasharray="3,4"
          opacity="0.5"
        />

        <!-- 外接/内接赤纬圈（揭示天极等距投影的物理源头） -->
        <template
          v-if="showDeclinationBounds"
          v-for="bounds in [computeDeclinationBounds(actualRadius)]"
          :key="'dec-bounds'"
        >
          <!-- 外圈：离极最远的星所在赤纬 -->
          <circle
            cx="0"
            cy="0"
            :r="bounds.outer.radius"
            fill="none"
            stroke="#7A8CA0"
            stroke-width="0.7"
            stroke-dasharray="2,3"
            opacity="0.55"
          />
          <text
            :x="0"
            :y="-bounds.outer.radius - 4"
            fill="#8FA3B8"
            font-size="9"
            text-anchor="middle"
            dominant-baseline="baseline"
            opacity="0.75"
          >δ {{ formatDec(bounds.outer.dec) }}</text>

          <!-- 内圈：离极最近的星所在赤纬 -->
          <circle
            cx="0"
            cy="0"
            :r="bounds.inner.radius"
            fill="none"
            stroke="#7A8CA0"
            stroke-width="0.7"
            stroke-dasharray="2,3"
            opacity="0.55"
          />
          <text
            :x="0"
            :y="-bounds.inner.radius - 4"
            fill="#8FA3B8"
            font-size="9"
            text-anchor="middle"
            dominant-baseline="baseline"
            opacity="0.75"
          >δ {{ formatDec(bounds.inner.dec) }}</text>
        </template>

        <!-- 地平圈（观测者视界，仅由纬度决定 —— 时间演进时不动）
             用洛阳 φ=34.65° 时，"北点"在盘下靠极，"南点"在盘上远离天极。
             这条线把可视天区分为"永不落下的拱极星"与"会升起落下的普通星"。 -->
        <template
          v-if="showHorizon"
          v-for="hz in [{
            path: computeHorizonPath(actualRadius),
            cardinals: computeHorizonCardinals(actualRadius)
          }]"
          :key="'horizon'"
        >
          <g :clip-path="`url(#beidou-visible-${(radius as number).toFixed(0)})`">
            <!-- 地平圈曲线（青绿色系，象征"地"与"天"的分界） -->
            <path
              :d="hz.path"
              fill="#3D9970"
              fill-opacity="0.04"
              stroke="#5FC49B"
              stroke-width="1.2"
              stroke-dasharray="6,3"
              opacity="0.75"
            />
          </g>

          <!-- 四方位标记（北/东/南/西），也裁到可视范围内 -->
          <g :clip-path="`url(#beidou-visible-${(radius as number).toFixed(0)})`">
            <g v-for="c in hz.cardinals" :key="'hzc-' + c.label">
              <circle :cx="c.x" :cy="c.y" :r="2.4" fill="#5FC49B" opacity="0.9" />
              <text
                v-if="showLabels"
                :x="c.x"
                :y="c.y - 6"
                fill="#7FD9B0"
                font-size="10"
                text-anchor="middle"
                paint-order="stroke"
                stroke="#000"
                stroke-width="1.8"
              >{{ c.label }}</text>
            </g>
          </g>

          <!-- "地平线"文字标注：贴在北点旁边 —— 北点是地平圈上离天极最近的点，
                屏幕下方稳定可见；副标题写出观测者纬度，说明这条线由 φ 唯一决定。 -->
          <template
            v-if="showLabels"
            v-for="north in [hz.cardinals.find((c) => c.label === '北')]"
            :key="'horizon-label'"
          >
            <g v-if="north">
              <text
                :x="north.x + 14"
                :y="north.y + 4"
                fill="#7FD9B0"
                font-size="11"
                font-weight="600"
                text-anchor="start"
                paint-order="stroke"
                stroke="#000"
                stroke-width="2"
              >地 平 线</text>
              <text
                :x="north.x + 14"
                :y="north.y + 16"
                fill="#5FC49B"
                font-size="8"
                text-anchor="start"
                opacity="0.85"
                paint-order="stroke"
                stroke="#000"
                stroke-width="1.6"
              >{{ locationLabel }} · φ={{ observerLat.toFixed(2) }}° λ={{ observerLon.toFixed(2) }}°</text>
            </g>
          </template>
        </template>

        <!-- 紫微垣：东西两藩 + 北极星（拱极天区宫墙，与北斗共享投影） -->
        <template
          v-if="showZiwei"
          v-for="zw in [{
            east: computeZiweiWall(actualRadius, ziwei.east),
            west: computeZiweiWall(actualRadius, ziwei.west),
            polaris: computeZiweiPoint(actualRadius, ziwei.polaris)
          }]"
          :key="'ziwei'"
        >
          <!-- 东藩连线（紫红色系，象征帝居东墙） -->
          <polyline
            :points="computeWallPoints(zw.east)"
            fill="none"
            stroke="#B48EDB"
            stroke-width="1.1"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.7"
          />
          <!-- 西藩连线（紫蓝色系，象征帝居西墙） -->
          <polyline
            :points="computeWallPoints(zw.west)"
            fill="none"
            stroke="#8FA5DB"
            stroke-width="1.1"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.7"
          />

          <!-- 东藩星点 -->
          <g v-for="s in zw.east" :key="'ze-' + s.bayer" class="ziwei-star east">
            <circle :cx="s.x" :cy="s.y" :r="s.r + 2" fill="#B48EDB" opacity="0.18" />
            <circle :cx="s.x" :cy="s.y" :r="s.r" fill="#D9C2EF" />
            <text
              v-if="showLabels"
              :x="s.x + s.r + 3"
              :y="s.y + 3"
              fill="#C8AEE6"
              font-size="12"
              text-anchor="start"
              paint-order="stroke"
              stroke="#000"
              stroke-width="1.8"
            >{{ s.cnName }}</text>
          </g>

          <!-- 西藩星点 -->
          <g v-for="s in zw.west" :key="'zw-' + s.bayer" class="ziwei-star west">
            <circle :cx="s.x" :cy="s.y" :r="s.r + 2" fill="#8FA5DB" opacity="0.18" />
            <circle :cx="s.x" :cy="s.y" :r="s.r" fill="#B7C6EA" />
            <text
              v-if="showLabels"
              :x="s.x - s.r - 3"
              :y="s.y + 3"
              fill="#A6BADD"
              font-size="12"
              text-anchor="end"
              paint-order="stroke"
              stroke="#000"
              stroke-width="1.8"
            >{{ s.cnName }}</text>
          </g>

          <!-- 北极星（勾陈一 α UMi）：金色四芒 + 光晕，与几何天极十字并存 -->
          <g class="polaris">
            <!-- 外层光晕 -->
            <circle
              :cx="zw.polaris.x"
              :cy="zw.polaris.y"
              :r="zw.polaris.r + 5"
              fill="#F4C560"
              opacity="0.18"
            />
            <!-- 四芒（十字光刺，标识"星北极"） -->
            <line
              :x1="zw.polaris.x - zw.polaris.r - 4"
              :y1="zw.polaris.y"
              :x2="zw.polaris.x + zw.polaris.r + 4"
              :y2="zw.polaris.y"
              stroke="#F4C560"
              stroke-width="0.9"
              opacity="0.85"
            />
            <line
              :x1="zw.polaris.x"
              :y1="zw.polaris.y - zw.polaris.r - 4"
              :x2="zw.polaris.x"
              :y2="zw.polaris.y + zw.polaris.r + 4"
              stroke="#F4C560"
              stroke-width="0.9"
              opacity="0.85"
            />
            <!-- 星体 -->
            <circle
              :cx="zw.polaris.x"
              :cy="zw.polaris.y"
              :r="zw.polaris.r + 0.6"
              fill="#FFE9A8"
            />
            <!-- 标签 -->
            <text
              v-if="showLabels"
              :x="zw.polaris.x + zw.polaris.r + 6"
              :y="zw.polaris.y - zw.polaris.r - 2"
              fill="#F4D580"
              font-size="13"
              text-anchor="start"
              paint-order="stroke"
              stroke="#000"
              stroke-width="2.2"
            >勾陈一</text>
          </g>
        </template>

        <!-- 七星坐标（一次派生，模板内多处消费） -->
        <template v-for="starPoints in [computeStarPoints(actualRadius)]" :key="'star-points'">
          <!-- 北斗七星连线 -->
          <polyline
            :points="computePolyPoints(starPoints)"
            fill="none"
            stroke="#EAEAEA"
            stroke-width="1.4"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.85"
          />

          <!-- 天极中心十字 -->
          <g v-if="showPole" class="pole" opacity="0.55">
            <line x1="-6" y1="0" x2="6" y2="0" stroke="#888" stroke-width="0.8" />
            <line x1="0" y1="-6" x2="0" y2="6" stroke="#888" stroke-width="0.8" />
            <circle cx="0" cy="0" r="2" fill="none" stroke="#888" stroke-width="0.6" />
          </g>

          <!-- 七颗星本体 + 中文名 -->
          <g v-for="s in starPoints" :key="s.key" class="star">
            <!-- 星芒光晕 -->
            <circle
              :cx="s.x"
              :cy="s.y"
              :r="s.r + 3"
              fill="#FFFFFF"
              opacity="0.15"
            />
            <!-- 星体 -->
            <circle
              :cx="s.x"
              :cy="s.y"
              :r="s.r"
              fill="#FFFFFF"
            />
            <!-- 星名（贴星旁小字） -->
            <text
              v-if="showLabels"
              :x="s.x"
              :y="s.y - s.r - 6"
              fill="#DDDDDD"
              font-size="14"
              text-anchor="middle"
              dominant-baseline="baseline"
              paint-order="stroke"
              stroke="#000"
              stroke-width="2.2"
            >{{ s.cnName }}</text>
          </g>
        </template>
      </g>
    </template>
  </BaseCenter>
</template>

<style scoped>
.beidou-center text {
  font-family: 'Microsoft YaHei', 'STHeiti', sans-serif;
  pointer-events: none;
}
.beidou-center .ziwei-star text,
.beidou-center .polaris text {
  font-family: 'Microsoft YaHei', 'STHeiti', sans-serif;
  pointer-events: none;
}
</style>
