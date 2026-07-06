<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import BaseCenter from '@/components/base/BaseCenter.vue'
import {
  beidouPositions,
  magnitudeToRadius,
  localSiderealTimeDeg
} from '@/utils/beidou'
import {
  ziweiPositions,
  ZIWEI_EAST_WALL,
  ZIWEI_WEST_WALL,
  POLARIS
} from '@/utils/ziwei'
import { MANSION_ASTERISMS } from '@/data/mansionStars'
import { getMansionSpans } from '@/utils/planetMansion'
import { project } from '@/utils/skyProjection'
import { fixedStarEquatorial } from '@/utils/celestial'
import { normalizeAngle } from '@/utils/geometry'

/**
 * ⚫ 苏州石刻天文图 · 圆心星图主体（时间驱动）
 *
 * ⚠️ 五层架构规范：圆心组件
 *   - 只有 radius,无 innerRadius（圆心组件禁止声明 innerRadius）
 *   - 通过 RingStack #center slot 使用
 *   - 时间驱动统一范式：MaybeRef<Date> + timeRef computed
 *
 * ═══════════════════════════════════════════════════════════════
 *  苏图灵魂 = 三个同心圆 + 二十八根不等宽径向辐条 + 中央拱极北斗
 * ═══════════════════════════════════════════════════════════════
 *
 * 本组件在 BeidouCenter 的基础上扩展 3 层新元素：
 *
 *   ① 三规圆（观测点 φ=35° 汴京,苏图底本）
 *      · 内规 δ=+55° → r=φ/90=0.389 （恒显圈,拱极星永不落下）
 *      · 赤道 δ=0°   → r=1           （天中规）
 *      · 外规 δ=−55° → r=(180-φ)/90=1.611 （恒隐圈,永不升起,超出可视需 clipPath 裁剪）
 *
 *   ② 二十八根不等宽径向辐条 —— 每宿距星处从北极辐射到外规
 *      井 33° / 觜 2° 宽窄悬殊,是苏图最鲜明的视觉特征
 *
 *   ③ 二十八宿完整星官 —— 165 颗星 + 星官连线拓扑
 *      数据源:Stellarium 官方 Chinese Sky Culture
 *      坐标: SIMBAD ICRS J2000（通过 HIP 编号批量查询）
 *      运行时用 astronomy-engine `Equator(ofdate=true)` 做岁差修正
 *
 * 保留 BeidouCenter 现有能力：
 *   · 北斗七星连线 + 星名
 *   · 紫微垣东西两藩连线 + 星名
 *   · 北极星（勾陈一）四芒标记
 *   · 天极中心十字
 *
 * 投影口径：BeidouCenter 口径 `projAngle = LST − RA + 90°`（面朝北仰望）
 *   与紫微垣、北斗七星共享同一投影管道,确保内外几何完全对齐。
 */
interface Props {
  /** 圆心区半径(RingStack #center slot 提供的 innerRadius) */
  radius?: number
  /** 星图缩放系数 */
  scale?: number
  /** 时间源 */
  time?: MaybeRef<Date>
  /** 旋转方向 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
  /** 观测者纬度(度,苏图底本汴京 φ=35°) */
  observerLat?: number
  /** 观测者经度(度,东正西负,苏图底本汴京 λ=116.4°) */
  observerLon?: number
  /** 显示中文标签 */
  showLabels?: boolean
  /** 显示三规圆 */
  showThreeRegulae?: boolean
  /** 显示 28 宿径向辐条 */
  showMansionSpokes?: boolean
  /** 显示 28 宿完整星官 */
  showMansionStars?: boolean
  /** 显示紫微垣两藩 */
  showZiwei?: boolean
  /** 显示北斗七星 */
  showBeidou?: boolean
  /** 显示天极十字 */
  showPole?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  radius: 300,
  scale: 0.98,
  rotationDirection: 'clockwise',
  observerLat: 35,           // 苏图底本汴京(北宋首都)
  observerLon: 116.4,        // 苏图底本汴京
  showLabels: true,
  showThreeRegulae: true,
  showMansionSpokes: true,
  showMansionStars: true,
  showZiwei: true,
  showBeidou: true,
  showPole: true
})

/** ⚠️ 五层架构范式:确保 time 始终是响应式的 */
const timeRef = computed(() => unref(props.time) ?? new Date())

/* ═══════════════════════════════════════════════════════════════
 *  数据层:所有派生自 timeRef
 * ═══════════════════════════════════════════════════════════════ */

/** 北斗七星当前历元位置(含岁差 + LST) */
const beidou = computed(() => beidouPositions(timeRef.value, props.observerLon))

/** 紫微垣两藩 + 北极星(与北斗共享投影) */
const ziwei = computed(() => ({
  east: ziweiPositions(ZIWEI_EAST_WALL, timeRef.value, 8, props.observerLon),
  west: ziweiPositions(ZIWEI_WEST_WALL, timeRef.value, 16, props.observerLon),
  polaris: ziweiPositions([POLARIS], timeRef.value, 24, props.observerLon)[0]!
}))

/**
 * 28 宿完整星官投影（数据来自 Stellarium 官方 Chinese Sky Culture）。
 *
 * 复用与 BeidouCenter / 紫微 完全相同的投影管道：
 *   projAngle = LST − RA + 90°   （面朝北仰望约定）
 *   plane     = project(projAngle, dec)
 *
 * 结构：MANSION_ASTERISMS[i] = { label, quadrant, color, stars[], connections[] }
 *   → 派生出 mansionAsterisms[i] = { ..., stars: [ 每颗星带 plane 坐标 ] }
 *
 * ⚠️ STAR_SLOTS 长度为 8,fixedStarEquatorial 内部串行调用 slot % 8 → 覆盖安全。
 *    slot 从 32 起,避开北斗（0-6）与紫微垣（8-24）的占用范围。
 *
 * 岁差：astronomy-engine `Equator(ofdate=true)` 自动包含岁差章动 ——
 *      苏图 1247 年星位可通过 URL `?t=1247-01-01T20:00` 直接可视化。
 */
const mansionAsterisms = computed(() => {
  const lst = localSiderealTimeDeg(timeRef.value, props.observerLon)
  let slotCursor = 32 // 避开北斗（0-6）、紫微（8-24）
  return MANSION_ASTERISMS.map((asterism) => ({
    ...asterism,
    stars: asterism.stars.map((s) => {
      const slot = slotCursor++
      const eq = fixedStarEquatorial(timeRef.value, s.raJ2000, s.decJ2000, 200, slot)
      const projAngle = normalizeAngle(lst - eq.ra + 90)
      return {
        ...s,
        ra: eq.ra,
        dec: eq.dec,
        plane: project(projAngle, eq.dec)
      }
    })
  }))
})

/** 28 宿区间(用于辐条位置:距星赤经边界) */
const spans = computed(() => getMansionSpans(timeRef.value))

/* ═══════════════════════════════════════════════════════════════
 *  投影→SVG 坐标(与 BeidouCenter 完全一致的口径)
 * ═══════════════════════════════════════════════════════════════ */

/**
 * dirSign：垂直翻转控制（与 BeidouCenter 同源,配合外环 polarToCartesian 的
 * counterclockwise 取反,保证内外几何一致）
 */
const dirSign = computed(() =>
  props.rotationDirection === 'counterclockwise' ? -1 : 1
)

/**
 * 投影平面 → SVG 缩放系数工厂
 *
 * 让"赤道 δ=0°"（极径=1）落在 actualRadius 的 60% 处,这样：
 *   · 外规（极径 1.611） ≈ actualRadius 内侧
 *   · 内规（极径 0.389） ≈ actualRadius × 0.23
 * 三圆比例视觉平衡,外规超出的部分由 clipPath 裁剪。
 */
const projectionScale = (actualRadius: number): number => actualRadius * 0.6

/** 数学平面 → SVG 坐标 */
const makeToSvg = (scale: number) => (p: { x: number; y: number }) => ({
  x: p.x * scale,
  y: -p.y * scale * dirSign.value
})

/* ═══════════════════════════════════════════════════════════════
 *  派生视图数据(接收 actualRadius 参数,由 BaseCenter slot 提供)
 * ═══════════════════════════════════════════════════════════════ */

/**
 * 三规圆半径（观测者纬度 φ 唯一决定）：
 *   · 内规 恒显圈  δ=+(90−φ) → r = scale × φ/90       （拱极星永不落下）
 *   · 赤道 天中规  δ=0       → r = scale               （赤道半径基准）
 *   · 外规 恒隐圈  δ=−(90−φ) → r = scale × (180−φ)/90 （永不升起,通常超出 clip 边界）
 */
const computeRegulae = (actualRadius: number) => {
  const scale = projectionScale(actualRadius)
  const phi = props.observerLat
  return {
    inner: (scale * phi) / 90,
    equator: scale,
    outer: (scale * (180 - phi)) / 90
  }
}

/**
 * 28 宿径向辐条 —— 每宿距星起始赤经处从北极辐射到外规。
 * 井 33° / 觜 2° 宽窄悬殊,是苏图最鲜明的视觉特征。
 */
const computeSpokes = (actualRadius: number) => {
  const scale = projectionScale(actualRadius)
  const lst = localSiderealTimeDeg(timeRef.value, props.observerLon)
  // 外规半径 (δ=−(90−φ)) —— 辐条从北极画到这里
  const outerR = (scale * (180 - props.observerLat)) / 90
  return spans.value.map((s) => {
    const projAngle = normalizeAngle(lst - s.startRa + 90)
    // 数学平面 (cos·r, sin·r) → SVG y 取反 × dirSign
    const rad = (projAngle * Math.PI) / 180
    return {
      label: s.label,
      x: Math.cos(rad) * outerR,
      y: -Math.sin(rad) * outerR * dirSign.value
    }
  })
}

/**
 * 28 宿完整星官 SVG 坐标（每宿的所有星 + 星官连线端点）。
 *
 * 返回结构：
 *   [{
 *     label, color,
 *     stars: [{ cnName, bayer, mag, x, y, r }, ...],   // 已投影到 SVG
 *     lines: [{ x1, y1, x2, y2 }, ...],                // 每对连线的端点
 *     distStar: stars[0]                                // 距星,宿名标签锚点
 *   }, ...]
 */
const computeMansionAsterismPoints = (actualRadius: number) => {
  const scale = projectionScale(actualRadius)
  const toSvg = makeToSvg(scale)
  return mansionAsterisms.value.map((a) => {
    const stars = a.stars.map((s) => ({
      cnName: s.cnName,
      bayer: s.bayer,
      mag: s.mag,
      ...toSvg(s.plane),
      // 星等→半径:base=3.0 比北斗（4.6）略小,避免暗星喧宾夺主
      r: magnitudeToRadius(s.mag, 3.0)
    }))
    const lines = a.connections.map(([i, j]) => ({
      x1: stars[i]?.x ?? 0,
      y1: stars[i]?.y ?? 0,
      x2: stars[j]?.x ?? 0,
      y2: stars[j]?.y ?? 0
    }))
    return {
      label: a.label,
      color: a.color,
      stars,
      lines,
      distStar: stars[0]
    }
  })
}

/** 北斗七星 SVG 坐标（与 BeidouCenter 同一投影管道） */
const computeBeidouPoints = (actualRadius: number) => {
  const scale = projectionScale(actualRadius)
  const toSvg = makeToSvg(scale)
  return beidou.value.map((s) => ({
    ...s,
    ...toSvg(s.plane),
    r: magnitudeToRadius(s.mag, 4.6)
  }))
}

/** 紫微墙星 SVG 坐标 */
const computeZiweiPoint = (
  actualRadius: number,
  z: ReturnType<typeof ziweiPositions>[number]
) => {
  const scale = projectionScale(actualRadius)
  const toSvg = makeToSvg(scale)
  return { ...z, ...toSvg(z.plane), r: magnitudeToRadius(z.mag, 3.4) }
}

const computeZiweiWall = (
  actualRadius: number,
  stars: ReturnType<typeof ziweiPositions>
) => stars.map((z) => computeZiweiPoint(actualRadius, z))

/** 折线 points 字符串工厂 */
const polyPoints = (pts: { x: number; y: number }[]): string =>
  pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')

/** 天极十字大小 —— 与三规圆同尺度,标识几何天极 */
const poleCrossSize = 6
</script>

<template>
  <BaseCenter
    :radius="radius"
    :scale="scale"
    :time="timeRef"
    :rotation-direction="rotationDirection"
  >
    <template #default="{ actualRadius }">
      <g class="suzhou-sky-map">
        <!-- clipPath:限制外规裁到圆心可视范围内 -->
        <defs>
          <clipPath :id="`suzhou-visible-${(radius as number).toFixed(0)}`">
            <circle cx="0" cy="0" :r="actualRadius" />
          </clipPath>
        </defs>

        <!-- 圆心边界虚线圆(视觉标识) -->
        <circle
          cx="0"
          cy="0"
          :r="radius"
          fill="none"
          stroke="#5A6B7C"
          stroke-width="0.8"
          stroke-dasharray="3,4"
          opacity="0.4"
        />

        <!-- ═════════════════════════════════════════════════════
             ① 三规圆(苏图骨架:内规/赤道/外规)
             ═════════════════════════════════════════════════════ -->
        <template
          v-if="showThreeRegulae"
          v-for="reg in [computeRegulae(actualRadius)]"
          :key="'regulae'"
        >
          <g :clip-path="`url(#suzhou-visible-${(radius as number).toFixed(0)})`">
            <!-- 内规(恒显圈,金色实线) -->
            <circle
              cx="0"
              cy="0"
              :r="reg.inner"
              fill="none"
              stroke="#D4AF37"
              stroke-width="1.2"
              opacity="0.85"
            />
            <!-- 赤道(天中规,白色粗实线) -->
            <circle
              cx="0"
              cy="0"
              :r="reg.equator"
              fill="none"
              stroke="#EAEAEA"
              stroke-width="1.8"
              opacity="0.9"
            />
            <!-- 外规(恒隐圈,金色细线,通常超出可视被裁剪) -->
            <circle
              cx="0"
              cy="0"
              :r="reg.outer"
              fill="none"
              stroke="#D4AF37"
              stroke-width="1.0"
              opacity="0.7"
            />
          </g>

          <!-- 三规标签(小字在顶端) -->
          <g v-if="showLabels" class="regulae-labels">
            <text
              :x="0"
              :y="-reg.inner - 4"
              fill="#D4AF37"
              font-size="9"
              text-anchor="middle"
              opacity="0.85"
              paint-order="stroke"
              stroke="#000"
              stroke-width="1.6"
            >内规 δ+{{ (90 - observerLat).toFixed(0) }}°</text>
            <text
              :x="0"
              :y="-reg.equator - 4"
              fill="#EAEAEA"
              font-size="9"
              text-anchor="middle"
              opacity="0.85"
              paint-order="stroke"
              stroke="#000"
              stroke-width="1.6"
            >赤道 δ0°</text>
          </g>
        </template>

        <!-- ═════════════════════════════════════════════════════
             ② 28 宿径向辐条(从北极辐射到外规,每宿距星处一根)
             ═════════════════════════════════════════════════════ -->
        <g
          v-if="showMansionSpokes"
          :clip-path="`url(#suzhou-visible-${(radius as number).toFixed(0)})`"
        >
          <line
            v-for="spoke in computeSpokes(actualRadius)"
            :key="'spoke-' + spoke.label"
            x1="0"
            y1="0"
            :x2="spoke.x"
            :y2="spoke.y"
            stroke="#8a7a4a"
            stroke-width="0.6"
            stroke-dasharray="2,3"
            opacity="0.55"
          />
        </g>

        <!-- ═════════════════════════════════════════════════════
             ③ 28 宿完整星官 + 星官连线(四象色系)
             ═════════════════════════════════════════════════════ -->
        <g
          v-if="showMansionStars"
          :clip-path="`url(#suzhou-visible-${(radius as number).toFixed(0)})`"
        >
          <g
            v-for="asterism in computeMansionAsterismPoints(actualRadius)"
            :key="'as-' + asterism.label"
            class="mansion-asterism"
          >
            <!-- 星官内连线(轻描,让"图形"浮现) -->
            <line
              v-for="(ln, i) in asterism.lines"
              :key="'ln-' + asterism.label + '-' + i"
              :x1="ln.x1"
              :y1="ln.y1"
              :x2="ln.x2"
              :y2="ln.y2"
              :stroke="asterism.color"
              stroke-width="0.9"
              opacity="0.6"
              stroke-linecap="round"
            />

            <!-- 每颗星:星等控制大小,四象色系上色 -->
            <g v-for="(s, i) in asterism.stars" :key="'st-' + asterism.label + '-' + i" class="star">
              <!-- 淡光晕 -->
              <circle :cx="s.x" :cy="s.y" :r="s.r + 2" :fill="asterism.color" opacity="0.22" />
              <!-- 星体 -->
              <circle :cx="s.x" :cy="s.y" :r="s.r" :fill="asterism.color" />
              <!-- 距星(每宿第一颗)加白圈突显 -->
              <circle
                v-if="i === 0"
                :cx="s.x"
                :cy="s.y"
                :r="s.r + 1.4"
                fill="none"
                stroke="#FFFFFF"
                stroke-width="0.6"
                opacity="0.85"
              />
            </g>

            <!-- 宿名(标在距星旁,大字醒目) -->
            <text
              v-if="showLabels && asterism.distStar"
              :x="asterism.distStar.x + asterism.distStar.r + 4"
              :y="asterism.distStar.y - asterism.distStar.r - 2"
              :fill="asterism.color"
              font-size="14"
              font-weight="600"
              text-anchor="start"
              paint-order="stroke"
              stroke="#000"
              stroke-width="2.2"
            >{{ asterism.label }}</text>
          </g>
        </g>

        <!-- ═════════════════════════════════════════════════════
             ④ 紫微垣东西两藩 + 勾陈一
             ═════════════════════════════════════════════════════ -->
        <template
          v-if="showZiwei"
          v-for="zw in [{
            east: computeZiweiWall(actualRadius, ziwei.east),
            west: computeZiweiWall(actualRadius, ziwei.west),
            polaris: computeZiweiPoint(actualRadius, ziwei.polaris)
          }]"
          :key="'ziwei'"
        >
          <!-- 东藩连线 -->
          <polyline
            :points="polyPoints(zw.east)"
            fill="none"
            stroke="#B48EDB"
            stroke-width="1.1"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.7"
          />
          <!-- 西藩连线 -->
          <polyline
            :points="polyPoints(zw.west)"
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
              font-size="11"
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
              font-size="11"
              text-anchor="end"
              paint-order="stroke"
              stroke="#000"
              stroke-width="1.8"
            >{{ s.cnName }}</text>
          </g>

          <!-- 北极星(勾陈一):金色四芒 + 光晕 -->
          <g class="polaris">
            <circle
              :cx="zw.polaris.x"
              :cy="zw.polaris.y"
              :r="zw.polaris.r + 5"
              fill="#F4C560"
              opacity="0.18"
            />
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
            <circle
              :cx="zw.polaris.x"
              :cy="zw.polaris.y"
              :r="zw.polaris.r + 0.6"
              fill="#FFE9A8"
            />
            <text
              v-if="showLabels"
              :x="zw.polaris.x + zw.polaris.r + 6"
              :y="zw.polaris.y - zw.polaris.r - 2"
              fill="#F4D580"
              font-size="12"
              text-anchor="start"
              paint-order="stroke"
              stroke="#000"
              stroke-width="2.2"
            >勾陈一</text>
          </g>
        </template>

        <!-- ═════════════════════════════════════════════════════
             ⑤ 北斗七星连线 + 星名 + 天极中心十字
             ═════════════════════════════════════════════════════ -->
        <template
          v-if="showBeidou"
          v-for="beidouPts in [computeBeidouPoints(actualRadius)]"
          :key="'beidou'"
        >
          <!-- 连线(勺+柄) -->
          <polyline
            :points="polyPoints(beidouPts)"
            fill="none"
            stroke="#FFFFFF"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.9"
          />

          <!-- 天极中心十字 -->
          <g v-if="showPole" class="pole" opacity="0.55">
            <line :x1="-poleCrossSize" y1="0" :x2="poleCrossSize" y2="0" stroke="#888" stroke-width="0.8" />
            <line x1="0" :y1="-poleCrossSize" x2="0" :y2="poleCrossSize" stroke="#888" stroke-width="0.8" />
            <circle cx="0" cy="0" r="2" fill="none" stroke="#888" stroke-width="0.6" />
          </g>

          <!-- 七星本体 + 中文名 -->
          <g v-for="s in beidouPts" :key="s.key" class="star">
            <circle
              :cx="s.x"
              :cy="s.y"
              :r="s.r + 3"
              fill="#FFFFFF"
              opacity="0.18"
            />
            <circle
              :cx="s.x"
              :cy="s.y"
              :r="s.r"
              fill="#FFFFFF"
            />
            <text
              v-if="showLabels"
              :x="s.x"
              :y="s.y - s.r - 6"
              fill="#DDDDDD"
              font-size="13"
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
.suzhou-sky-map text {
  font-family: 'Microsoft YaHei', 'STHeiti', sans-serif;
  pointer-events: none;
  user-select: none;
}
</style>
