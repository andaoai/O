<script setup lang="ts">
import { computed } from 'vue'
import PolarCanvas from '../base/PolarCanvas.vue'
import { arcPath as arcPathUtil, radialTextRotation } from '@/utils/geometry'
import { usePolar } from '@/composables/useRingBase'
import { XIANTIAN_64_GUA, GUA_STEP, type XiantianGuaItem } from '@/data/sixtyFourGua'

/**
 * 先天六十四卦图形环
 *
 * 区别于通用文字环 CircleRing：每个卦格要画出「卦象」——Unicode 卦符 + 六爻横线
 * （阳爻整条、阴爻断为两段）+ 卦名小字。属于特殊视觉环，故独立成组件
 * （与 TaiChi / SolarEcliptic 同例），不污染 CircleRing。
 *
 * 数据全部来自 @/data/sixtyFourGua 的 XIANTIAN_64_GUA：每卦的圆周位置 pos、
 * SVG 空间圆心角、六爻数组、卦符、卦名均已算好，本组件只负责把它们画到极坐标上。
 *
 * 径向分区（外→内）：卦符区 → 卦名区 → 六爻线区。
 */

interface Props {
  /** 外半径 */
  radius: number
  /** 内半径（可选）。缺省时按字号 / 是否显示爻线自动算出环带宽度，铺满刚好够用，不留多余空白。 */
  innerRadius?: number
  /** 旋转方向（RingStack / 视图注入） */
  rotationDirection?: 'clockwise' | 'counterclockwise'
  /** 是否显示卦符 */
  showUnicode?: boolean
  /** 是否显示六爻线 */
  showLines?: boolean
  /** 是否显示卦名 */
  showNames?: boolean
  /** 是否显示阴阳两仪淡背景 */
  showYinYang?: boolean
  /** 阳爻颜色 */
  yangLineColor?: string
  /** 阴爻颜色 */
  yinLineColor?: string
  /** 圆环边线 / 刻度颜色 */
  circleColor?: string
  /** 卦符颜色 */
  unicodeColor?: string
  /** 卦名颜色 */
  nameColor?: string
  /** 阳仪背景色 */
  yangTint?: string
  /** 阴仪背景色 */
  yinTint?: string
  /** 卦符字号 */
  unicodeFontSize?: number
  /** 卦名字号 */
  nameFontSize?: number
  /** 爻线占卦格角宽的比例 (0-1) */
  lineWidthRatio?: number
  /** 阴爻中间缺口占半宽的比例 (0-1) */
  yinGapRatio?: number
  /** 爻线粗细 */
  lineStrokeWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  rotationDirection: 'clockwise',
  showUnicode: true,
  showLines: true,
  showNames: true,
  showYinYang: true,
  yangLineColor: '#E8D9A0',
  yinLineColor: '#9FB8C8',
  circleColor: '#888888',
  unicodeColor: '#F5E8C8',
  nameColor: '#C8B88A',
  yangTint: '#3A2E1A',
  yinTint: '#1A2A36',
  unicodeFontSize: 20,
  nameFontSize: 9,
  lineWidthRatio: 0.62,
  yinGapRatio: 0.3,
  lineStrokeWidth: 2
})

/** 极坐标 → 笛卡尔（统一走 useRingBase.usePolar，按 rotationDirection 处理顺/逆时针），中心 0,0 */
const polarToCartesian = usePolar(
  () => 0,
  () => props.rotationDirection
)

/** 环形扇形 path（内外两弧），用于阴阳两仪背景 */
const arcPath = (rOuter: number, rInner: number, startAngle: number, endAngle: number): string =>
  arcPathUtil(rOuter, startAngle, endAngle, rInner, props.rotationDirection)

/** 实际内半径：视图传入则用之；否则按内容自动算环带宽度（铺满够用即可，不留多余空白）。
 *  - 显示爻线：需容纳 6 爻 + 卦符 + 卦名，环带较宽；
 *  - 仅卦符 + 卦名：两行文字高度即可。 */
const resolvedInnerRadius = computed(() => {
  if (props.innerRadius !== undefined) return props.innerRadius
  const u = props.showUnicode ? props.unicodeFontSize : 0
  const n = props.showNames ? props.nameFontSize : 0
  const pad = 14 // 内外留白
  const bandWidth = props.showLines
    ? Math.max(70, u + n + props.lineStrokeWidth * 6 * 2 + pad) // 爻线区 6 爻 + 文字
    : u + n + pad // 仅卦符 + 卦名两行
  return props.radius - bandWidth
})

/** 环径向厚度 */
const band = computed(() => props.radius - resolvedInnerRadius.value)

/** 环带径向中线 */
const midRadius = computed(() => (props.radius + resolvedInnerRadius.value) / 2)

/** 卦符 / 卦名 的径向位置。
 *  - 显示爻线时：沿用原比例（爻线区在内、文字在外）。
 *  - 隐藏爻线时：卦符(外)+卦名(内)作为一组**几何居中**于环带中线，
 *    两者中心间距按各自字号一半之和算，字号不同也上下对称、不偏。 */
const TEXT_GAP = 4 // 卦符与卦名之间的径向间隙
const unicodeRadius = computed(() => {
  if (props.showLines) return resolvedInnerRadius.value + band.value * 0.87
  if (!props.showNames) return midRadius.value // 只有卦符 → 居中
  const u = props.unicodeFontSize
  const n = props.nameFontSize
  const d = (u + n) / 2 + TEXT_GAP // 两文字中心间距
  return midRadius.value + (n - u) / 4 + d / 2
})
const nameRadius = computed(() => {
  if (props.showLines) return resolvedInnerRadius.value + band.value * 0.7
  if (!props.showUnicode) return midRadius.value // 只有卦名 → 居中
  const u = props.unicodeFontSize
  const n = props.nameFontSize
  const d = (u + n) / 2 + TEXT_GAP
  return midRadius.value + (n - u) / 4 - d / 2
})
const lineBandInner = computed(() => resolvedInnerRadius.value + band.value * 0.08)
const lineBandOuter = computed(() => resolvedInnerRadius.value + band.value * 0.62)

/** 文字旋转：顶部指向圆心（统一走 geometry） */
const textRotationOf = (midAngle: number) => radialTextRotation(midAngle, props.rotationDirection)

/** 阴阳两仪背景扇形：阳仪 pos>=32，阴仪 pos<32 */
const yinYangSectors = computed(() => {
  if (!props.showYinYang) return []
  return XIANTIAN_64_GUA.map(g => ({
    key: g.value,
    fill: g.pos >= 32 ? props.yangTint : props.yinTint,
    path: arcPath(props.radius, resolvedInnerRadius.value, g.startAngle, g.endAngle)
  }))
})

/** 64 条分隔刻度线（每卦起始边，从内圆到外圆） */
const ticks = computed(() =>
  XIANTIAN_64_GUA.map(g => {
    const i = polarToCartesian(g.startAngle, resolvedInnerRadius.value)
    const o = polarToCartesian(g.startAngle, props.radius)
    return { key: g.value, x1: i.x, y1: i.y, x2: o.x, y2: o.y }
  })
)

/** 每卦六爻线段：阳爻 1 段、阴爻 2 段；自下(内)而上(外) */
const guaLineSegments = computed(() => {
  const lineGap = (lineBandOuter.value - lineBandInner.value) / 6
  const halfAngle = (GUA_STEP / 2) * props.lineWidthRatio
  const gapHalf = halfAngle * props.yinGapRatio
  const segs: { key: string; x1: number; y1: number; x2: number; y2: number; yang: boolean }[] = []
  for (const g of XIANTIAN_64_GUA) {
    for (let i = 0; i < 6; i++) {
      const r = lineBandInner.value + lineGap * (i + 0.5)
      const yang = g.lines[i]!
      if (yang) {
        const a = polarToCartesian(g.centerAngle - halfAngle, r)
        const b = polarToCartesian(g.centerAngle + halfAngle, r)
        segs.push({ key: `${g.value}-${i}`, x1: a.x, y1: a.y, x2: b.x, y2: b.y, yang: true })
      } else {
        const l1 = polarToCartesian(g.centerAngle - halfAngle, r)
        const l2 = polarToCartesian(g.centerAngle - gapHalf, r)
        const r1 = polarToCartesian(g.centerAngle + gapHalf, r)
        const r2 = polarToCartesian(g.centerAngle + halfAngle, r)
        segs.push({ key: `${g.value}-${i}-l`, x1: l1.x, y1: l1.y, x2: l2.x, y2: l2.y, yang: false })
        segs.push({ key: `${g.value}-${i}-r`, x1: r1.x, y1: r1.y, x2: r2.x, y2: r2.y, yang: false })
      }
    }
  }
  return segs
})

/** 卦符标签 */
const unicodeLabels = computed(() =>
  XIANTIAN_64_GUA.map(g => {
    const p = polarToCartesian(g.centerAngle, unicodeRadius.value)
    return { key: g.value, char: g.unicode, x: p.x, y: p.y, rot: textRotationOf(g.centerAngle) }
  })
)

/** 卦名标签 */
const nameLabels = computed(() =>
  XIANTIAN_64_GUA.map((g: XiantianGuaItem) => {
    const p = polarToCartesian(g.centerAngle, nameRadius.value)
    return { key: g.value, name: g.name, x: p.x, y: p.y, rot: textRotationOf(g.centerAngle) }
  })
)
</script>

<template>
  <PolarCanvas :center-x="0" :center-y="0" :rotation-direction="rotationDirection">
    <template #default>
      <g class="gua-ring">
        <!-- 阴阳两仪淡背景（showYinYang 关时 yinYangSectors 为空，无需 v-if） -->
        <path
          v-for="s in yinYangSectors"
          :key="`yy-${s.key}`"
          :d="s.path"
          :fill="s.fill"
          opacity="0.55"
        />

        <!-- 内外圆边线 -->
        <circle :cx="0" :cy="0" :r="radius" fill="none" :stroke="circleColor" :stroke-width="1" />
        <circle :cx="0" :cy="0" :r="resolvedInnerRadius" fill="none" :stroke="circleColor" :stroke-width="1" />

        <!-- 64 条分隔刻度 -->
        <line
          v-for="t in ticks"
          :key="`tick-${t.key}`"
          :x1="t.x1"
          :y1="t.y1"
          :x2="t.x2"
          :y2="t.y2"
          :stroke="circleColor"
          :stroke-width="0.5"
        />

        <!-- 六爻线 -->
        <g v-if="showLines">
          <line
            v-for="seg in guaLineSegments"
            :key="`yao-${seg.key}`"
            :x1="seg.x1"
            :y1="seg.y1"
            :x2="seg.x2"
            :y2="seg.y2"
            :stroke="seg.yang ? yangLineColor : yinLineColor"
            :stroke-width="lineStrokeWidth"
            stroke-linecap="round"
          />
        </g>

        <!-- 卦符 -->
        <g v-if="showUnicode">
          <text
            v-for="u in unicodeLabels"
            :key="`uni-${u.key}`"
            :x="u.x"
            :y="u.y"
            :fill="unicodeColor"
            :font-size="unicodeFontSize"
            text-anchor="middle"
            dominant-baseline="central"
            :transform="`rotate(${u.rot} ${u.x} ${u.y})`"
          >
            {{ u.char }}
          </text>
        </g>

        <!-- 卦名 -->
        <g v-if="showNames">
          <text
            v-for="n in nameLabels"
            :key="`name-${n.key}`"
            :x="n.x"
            :y="n.y"
            :fill="nameColor"
            :font-size="nameFontSize"
            text-anchor="middle"
            dominant-baseline="central"
            font-weight="bold"
            :transform="`rotate(${n.rot} ${n.x} ${n.y})`"
          >
            {{ n.name }}
          </text>
        </g>
      </g>
    </template>
  </PolarCanvas>
</template>

<style scoped>
.gua-ring {
  transform-origin: center;
  will-change: transform;
  backface-visibility: hidden;
}
</style>
