<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import BaseCenter from '@/components/base/BaseCenter.vue'
import { localSiderealTimeDeg } from '@/utils/beidou'
import { geoToPlane } from '@/utils/geoProjection'
import { COASTLINES } from '@/data/worldCoastline'

/**
 * ⚫ 世界地图圆心组件（三视角天地对偶旋转 · 极方位等距投影）
 *
 * ⚠️ 五层架构规范：圆心组件
 *   - 只有 radius,无 innerRadius（圆心组件禁止声明 innerRadius）
 *   - 通过 RingStack #center slot 使用
 *   - 时间驱动统一范式：MaybeRef<Date> + timeRef computed
 *
 * ═══════════════════════════════════════════════════════════════
 *  为苏图石刻天文图提供地面参照
 * ═══════════════════════════════════════════════════════════════
 *
 * 关键设计:与 SuzhouSkyMap 共享 makeToSvg 管道,「地面 ↔ 天球」在盘面上像素级对齐。
 *
 * ─────────────────────────────────────────────────────────────
 *  天地对偶旋转(与之前版本的关键区别)
 * ─────────────────────────────────────────────────────────────
 *
 * 地面基公式(不含 LST): projAngle_ground = observerLon − λ + 90°
 *   → 观测者所在经度恒在盘顶,地面本身是静态基。
 *
 * 相对旋转由 orientOffset(与 SuzhouSkyMap 完全一致) 统一提供:
 *
 *   · fixed-ground     : orientOffset = 0
 *       → 地面静止,天球随 LST 旋转 —— 观测者视角(头顶朝上,星宿走)
 *   · fixed-sky-coord  : orientOffset = LST
 *       → 天球静止(春分点在顶),地面绕天极旋转 —— 惯性系(一恒星日一周)
 *   · fixed-sky-suzhou : orientOffset = LST − SUZHOU_TOP_RA
 *       → 天球静止(心宿二在顶),地面旋转 —— 苏图约定
 *
 * 天地在所有视角下都保持精确对齐:惯性系下星 X 的天顶下方经度
 * λ = observerLon + (RA_X − LST),两公式代入产生相同 projAngle,像素重合。
 *
 * ─────────────────────────────────────────────────────────────
 *  几何映射(纬度 → 极径,以赤道半径 R 为单位)
 * ─────────────────────────────────────────────────────────────
 *
 *   北极 φ=+90° → r=0             盘心
 *   φ=+55°     → r=0.389 ≈ 内规   (φ_obs=35° 时)
 *   赤道  φ=0°  → r=1.0            天中规
 *   φ=−55°     → r=1.611 ≈ 外规
 *   南极 φ=−90° → r=2.0            超出外规,clipPath 裁剪
 *
 * 数据源:Natural Earth 110m 海岸线(public domain),134 条线,5121 个点。
 */
interface Props {
  /** 圆心区半径(RingStack #center slot 提供的 innerRadius) */
  radius?: number
  /** 星图缩放系数(与 SuzhouSkyMap 保持一致,默认 0.98) */
  scale?: number
  /** 时间源 */
  time?: MaybeRef<Date>
  /** 旋转方向 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
  /** 观测者经度(度,东正西负,默认汴京 λ=116.4°) */
  observerLon?: number
  /** 观测者纬度(仅用于观测者点标记显示,默认汴京 φ=35°) */
  observerLat?: number
  /** 盘面朝向(与 SuzhouSkyMap 保持一致) */
  orientation?: 'fixed-ground' | 'fixed-sky-coord' | 'fixed-sky-suzhou'
  /** 显示观测者点标记 */
  showObserver?: boolean
  /** 显示子午线(观测者所在经度的极方位投影 —— 天球子午圈) */
  showMeridian?: boolean
  /** 陆地填充色 */
  landFill?: string
  /** 海岸线颜色 */
  coastStroke?: string
}

const props = withDefaults(defineProps<Props>(), {
  radius: 300,
  scale: 0.98,
  rotationDirection: 'clockwise',
  observerLon: 116.4,
  observerLat: 35,
  orientation: 'fixed-ground',
  showObserver: true,
  showMeridian: true,
  landFill: '#3a2e1e',
  coastStroke: '#6b5335'
})

/** ⚠️ 五层架构范式:确保 time 始终是响应式的 */
const timeRef = computed(() => unref(props.time) ?? new Date())

/**
 * 苏图石刻"顶部"对应的赤经(度) —— 必须与 SuzhouSkyMap 保持一致。
 * 心宿二(大火,α Sco)方位约定,经用户实测调整。
 */
const SUZHOU_TOP_RA = -25

/**
 * 盘面朝向偏移量(度) —— 与 SuzhouSkyMap 逻辑完全一致。
 *
 * 关键:fixed-sky-* 模式下 orientOffset 含 LST,这就是"惯性系下地面旋转"
 * 的相对运动来源。地面基公式本身不含 LST,所以旋转全靠这里注入。
 */
const orientOffset = computed(() => {
  if (props.orientation === 'fixed-ground') return 0
  const lst = localSiderealTimeDeg(timeRef.value, props.observerLon)
  if (props.orientation === 'fixed-sky-suzhou') return lst - SUZHOU_TOP_RA
  return lst // fixed-sky-coord
})

/**
 * dirSign 与 SuzhouSkyMap 完全一致的翻转控制。
 */
const dirSign = computed(() =>
  props.rotationDirection === 'counterclockwise' ? -1 : 1
)

/**
 * 投影平面 → SVG 缩放系数:与 SuzhouSkyMap projectionScale 完全一致。
 * 让赤道(φ=0)落在 actualRadius × 0.6 处,与三规圆的赤道规精确对齐。
 */
const projectionScale = (actualRadius: number): number => actualRadius * 0.6

/**
 * 数学平面 → SVG 坐标 —— 与 SuzhouSkyMap makeToSvg 逐行一致。
 * orientOffset 保证地面在三视角下的正确旋转行为。
 */
const makeToSvg = (scale: number) => {
  const theta = (orientOffset.value * Math.PI) / 180
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)
  return (p: { x: number; y: number }) => {
    const xr = p.x * cos + p.y * sin
    const yr = -p.x * sin + p.y * cos
    return {
      x: xr * scale,
      y: -yr * scale * dirSign.value
    }
  }
}

/**
 * 海岸线 → SVG 路径数据。
 *
 * 每条线单独生成一条 <polyline points="..."> 字符串;不做闭合成 polygon
 * (Natural Earth coastline 本身是开放线)。第一版只画海岸线描边,
 * 视觉上就是"世界地图轮廓",与苏图"三规圆 + 星宿"的线条美学一致。
 */
const computePaths = (actualRadius: number): string[] => {
  const scale = projectionScale(actualRadius)
  const toSvg = makeToSvg(scale)
  const obsLon = props.observerLon

  return COASTLINES.map((line) => {
    return line
      .map(([lon, lat]) => {
        // 跳过南极点附近(φ<-88°):投影极径过大,压到画布边界外容易造成
        // 长线穿过盘面产生视觉污染
        if (lat < -88) return null
        const plane = geoToPlane(lon, lat, obsLon)
        const svg = toSvg(plane)
        return `${svg.x.toFixed(1)},${svg.y.toFixed(1)}`
      })
      .filter((s): s is string => s !== null)
      .join(' ')
  })
}

/** 观测者位置在盘面上的 SVG 坐标 —— 红色小十字标记"我在这里" */
const observerPoint = (actualRadius: number) => {
  const scale = projectionScale(actualRadius)
  const toSvg = makeToSvg(scale)
  const plane = geoToPlane(props.observerLon, props.observerLat, props.observerLon)
  return toSvg(plane)
}

/**
 * 子午线(观测者所在经度的极方位投影)
 *
 * 在极方位等距投影下,子午圈是一条**直线**,通过天极(盘心),两端指向:
 *   · 上端(λ = observerLon): 观测者所在经线,穿过南中天(午)/天顶/北极/北地平
 *   · 下端(λ = observerLon+180°): 对跖经线,穿过下中天/天底
 *
 * 关键:因为这里的 x 就是数学平面(未 orient 旋转),所以子午圈永远是竖直的
 * (上下两根线段) —— 但 makeToSvg 已包含 orientOffset 旋转,fixed-sky-* 视角
 * 下子午线会随时间旋转,fixed-ground 视角下静止竖直。
 *
 * 用两段线段而不是一条穿越盘心的线:
 *   ① observer 端: 从盘心 (0,0) → 外规 (0, -R_outer)     ← "午" 方向
 *   ② 对跖端    : 从盘心 (0,0) → 外规 (0, +R_outer)     ← "子" 方向
 *
 * 长度到外规而不是 actualRadius:与三规圆同规格,视觉一致。
 */
const computeMeridian = (actualRadius: number) => {
  const scale = projectionScale(actualRadius)
  const toSvg = makeToSvg(scale)
  // 外规极径(纬度 -90+observerLat 对应极径 (180-observerLat)/90)
  // 与 SuzhouSkyMap 的外规完全一致
  const outerR = (180 - props.observerLat) / 90

  // 子午线在**未 orient 旋转的数学平面**里的两个端点:
  // observer 端在 (0, +outerR)  ← geoToPlane(observerLon, -90+observerLat, observerLon)
  //   → projAngle = observerLon − observerLon + 90 = 90°(正上方,cos90=0, sin90=1)
  //   → 平面坐标 (r·cos90, r·sin90) = (0, r)
  // 对跖端在   (0, -outerR)
  const observerEnd = toSvg({ x: 0, y: outerR })
  const antipodeEnd = toSvg({ x: 0, y: -outerR })
  return { observerEnd, antipodeEnd }
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
      <g class="world-map-center">
        <!-- clipPath:限制地图在圆心可视范围内(与 SuzhouSkyMap 独立) -->
        <defs>
          <clipPath :id="`world-map-clip-${(radius as number).toFixed(0)}`">
            <circle cx="0" cy="0" :r="actualRadius" />
          </clipPath>
        </defs>

        <!-- 陆地颜色底(极浅的一层,让海岸线内区域微微浮起) -->
        <circle
          cx="0"
          cy="0"
          :r="actualRadius"
          :fill="landFill"
          opacity="0.06"
        />

        <!-- ═════════════════════════════════════════════════════
             海岸线 —— Natural Earth 110m,共 134 条线
             ═════════════════════════════════════════════════════ -->
        <g :clip-path="`url(#world-map-clip-${(radius as number).toFixed(0)})`">
          <polyline
            v-for="(path, i) in computePaths(actualRadius)"
            :key="'coast-' + i"
            :points="path"
            fill="none"
            :stroke="coastStroke"
            stroke-width="0.7"
            stroke-linejoin="round"
            stroke-linecap="round"
            opacity="0.85"
          />
        </g>

        <!-- ═════════════════════════════════════════════════════
             子午线 —— 观测者所在经度的极方位投影,横穿盘面的直线
             ═════════════════════════════════════════════════════
             一条完整直线从"子"(下端外规) → 天极 → "午"(上端外规):
               · 上端 = 观测者经线,指向南中天(午)
               · 下端 = 对跖经线,指向下中天(子)
             fixed-ground 视角下静止竖直,fixed-sky-* 视角下随观测者绕极旋转
        -->
        <template v-if="showMeridian">
          <g
            v-for="mer in [computeMeridian(actualRadius)]"
            :key="'meridian'"
            class="meridian"
          >
            <!-- 完整的子午线:从对跖端穿过天极到 observer 端 -->
            <line
              :x1="mer.antipodeEnd.x"
              :y1="mer.antipodeEnd.y"
              :x2="mer.observerEnd.x"
              :y2="mer.observerEnd.y"
              stroke="#E85D3C"
              stroke-width="0.9"
              stroke-dasharray="4,3"
              opacity="0.55"
            />
            <!-- 「午」标签 - 观测者端外沿 -->
            <text
              :x="mer.observerEnd.x"
              :y="mer.observerEnd.y - 6"
              fill="#E85D3C"
              font-size="12"
              font-weight="600"
              text-anchor="middle"
              paint-order="stroke"
              stroke="#000"
              stroke-width="2.2"
              opacity="0.9"
            >午</text>
            <!-- 「子」标签 - 对跖端外沿 -->
            <text
              :x="mer.antipodeEnd.x"
              :y="mer.antipodeEnd.y + 14"
              fill="#E85D3C"
              font-size="12"
              font-weight="600"
              text-anchor="middle"
              paint-order="stroke"
              stroke="#000"
              stroke-width="2.2"
              opacity="0.9"
            >子</text>
          </g>
        </template>

        <!-- ═════════════════════════════════════════════════════
             观测者位置标记(朱红小十字 + 名字)
             ═════════════════════════════════════════════════════ -->
        <template v-if="showObserver">
          <g
            v-for="p in [observerPoint(actualRadius)]"
            :key="'observer'"
            class="observer-marker"
          >
            <!-- 淡光晕 -->
            <circle :cx="p.x" :cy="p.y" :r="6" fill="#E85D3C" opacity="0.20" />
            <!-- 十字 -->
            <line
              :x1="p.x - 4"
              :y1="p.y"
              :x2="p.x + 4"
              :y2="p.y"
              stroke="#E85D3C"
              stroke-width="1.1"
            />
            <line
              :x1="p.x"
              :y1="p.y - 4"
              :x2="p.x"
              :y2="p.y + 4"
              stroke="#E85D3C"
              stroke-width="1.1"
            />
            <!-- 圆点 -->
            <circle :cx="p.x" :cy="p.y" :r="1.2" fill="#E85D3C" />
          </g>
        </template>
      </g>
    </template>
  </BaseCenter>
</template>

<style scoped>
.world-map-center {
  pointer-events: none;
}
</style>
