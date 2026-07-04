<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import PolarCanvas from '../base/PolarCanvas.vue'
import { radialTextRotation } from '@/utils/geometry'
import { usePolar } from '@/composables/useRingBase'
import { getYaoIndexInJingFangYear } from '@/utils/jingFangYao'
import { JING_FANG_SIXTY_GUA, JING_FANG_GUA_STEP } from '@/data/rings/jingFangSixtyGua'

/**
 * 京房卦气 60 卦爻线环（专用图形环）
 *
 * 🔵 类型：专用 SVG 组件（非 PointRing/CircleRing 管线，因为要画阴阳爻切向弧段）
 *
 * 【设计要点】
 *   - 60 卦顺时针铺满 360°，每卦切向宽度 = 6°
 *   - 每卦 6 爻在**径向**上从内到外堆叠（i=0 初爻最内、i=5 上爻最外）
 *   - 阳爻画一整段切向弧线；阴爻画左右两段，中间断开
 *   - 中孚（index=0）占据 0°-6°，其初九爻切向左端对齐 0°（冬至锚点）
 *   - 当前时刻对应的那一条爻用红色 #FF4444，其余全部白色 #FFFFFF
 *
 * 【时间→爻位算法】完全对齐 LiuRiQiFenScaleRing，保证两环高亮位重合：
 *   daysSinceWinterSolstice / 365.25 × 360 = currentYaoIndex (0-359)
 *   currentGuaIndex = ⌊currentYaoIndex / 6⌋
 *   currentYaoInGua = currentYaoIndex % 6
 *
 * @example
 * ```vue
 * <JingFangGuaRing :time="controlledTime" :radius="360" :inner-radius="300" />
 * ```
 */
interface Props {
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  startDegree?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
  /** 爻线切向宽度占卦格比例 (0-1)，默认 0.85 —— 卦与卦之间留少许缝 */
  lineWidthRatio?: number
  /** 阴爻中间缺口占半爻宽的比例 (0-1)，默认 0.3 */
  yinGapRatio?: number
  /** 常规爻线粗细 */
  lineStrokeWidth?: number
  /** 当前爻线粗细（红色高亮） */
  currentLineStrokeWidth?: number
  /** 常规爻线颜色 */
  lineColor?: string
  /** 当前爻线颜色 */
  currentLineColor?: string
  /** 圆环边线颜色 */
  circleColor?: string
  /** 卦名字号（px），0 = 不显示卦名 */
  nameFontSize?: number
  /** 卦名常规颜色 */
  nameColor?: string
  /** 当前卦（含当前爻的那一卦）卦名颜色 */
  currentNameColor?: string
  /** 内/外卦八经卦名字号（px），0 = 不显示。默认 = nameFontSize × 0.65 */
  baguaFontSize?: number
  /** 内/外卦标签常规颜色 */
  baguaColor?: string
  /** 当前卦的内/外卦标签颜色 */
  currentBaguaColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  // 【几何】外/内半径。60px 环带足够容纳 6 层爻线 + 上下留白，
  // 实际使用时由 RingStack 通过 thickness 自动接管，这里的默认仅作单独调试兜底。
  radius: 380,
  innerRadius: 320,

  // 【定位】起始角度偏移。0 = 冬至锚在 SVG 正右方（3 点钟方向）。
  startDegree: 0,

  // 【方向】顺时针，与 LiuRiQiFenScaleRing 及全盘统一。
  rotationDirection: 'clockwise',

  // 【爻宽】爻线切向长度占卦格 6° 的比例。
  //   1.0 → 爻线贴到相邻卦边界（无缝）；
  //   0.85 → 卦与卦之间留 15% 空白，视觉上易区分卦格；
  //   过小则爻线太短，阴阳断口不明显。
  lineWidthRatio: 0.85,

  // 【阴爻】阴爻中央缺口占半爻宽的比例。
  //   0.3 = 缺口宽度 ≈ 爻线总长的 30%（左右两段各 35%），传统罗盘常见比例。
  yinGapRatio: 0.30,

  // 【线宽】常规爻线粗细（px）。太细在缩放下会模糊，太粗会盖住阴爻断口。
  lineStrokeWidth: 2.7,

  // 【线宽·高亮】当前爻线粗细（px），约为常规的 2 倍，配合红色 + 呼吸滤镜突出。
  currentLineStrokeWidth: 2.5,

  // 【配色】非当前爻统一白色，避免抢当日红爻的视觉焦点。
  lineColor: '#FFFFFF',

  // 【配色·高亮】当前爻红色，与外环 LiuRiQiFenScaleRing/DayScaleRing 的当日红一致。
  currentLineColor: '#FF4444',

  // 【边线】环带内/外圆边线颜色，暗灰仅作分隔提示，不喧宾夺主。
  circleColor: '#333333',

  // 【卦名】字号（px），0 = 不显示卦名。默认 18px：60 卦每卦仅 6°，
  // 在半径 300+ 处切向弧长约 30-35px，18px 显眼可读；因文字沿切向排列且
  // 卦名多为 1-2 字，字宽不受切向弧长严格限制，径向由卦名区留白容纳。
  nameFontSize: 18,

  // 【卦名·配色】非当前卦柔和暖色，介于爻线白与背景之间，可见但不抢焦。
  nameColor: '#C8B88A',

  // 【卦名·高亮】当前卦（含当前爻）卦名亮金，与红爻形成主次呼应。
  currentNameColor: '#FFD700',

  // 【内/外卦】小字标签字号（px）。默认 0 → 走 nameFontSize × 0.65 派生（在下方 computed 处理）。
  // 之所以取 0 而非直接算，是为了让父组件仅覆盖 nameFontSize 时，本字号能自动跟随缩放。
  baguaFontSize: 0,

  // 【内/外卦·配色】常规态用比卦名更暗一档的褐色，视觉主次：卦名 > 内外卦 > 爻线断口。
  baguaColor: '#8A7A54',

  // 【内/外卦·高亮】当前卦对应的内外卦标签，用比 currentNameColor 更暗一档的金铜色，
  // 保持金色系呼应又不与主卦名平级。
  currentBaguaColor: '#D4A94A'
})

// ⚠️ 时间驱动范式：MaybeRef → computed timeRef
const timeRef = computed(() => unref(props.time) ?? new Date())

/** 极坐标 → 笛卡尔（统一走 useRingBase.usePolar，按 startDegree / rotationDirection 处理） */
const polarToCartesian = usePolar(
  () => props.startDegree,
  () => props.rotationDirection
)

/** 当前爻位索引 0-359（收敛于 utils/jingFangYao） */
const currentYaoIndex = computed(() => getYaoIndexInJingFangYear(timeRef.value))

/** 当前卦序 0-59 */
const currentGuaIndex = computed(() => Math.floor(currentYaoIndex.value / 6))
/** 当前爻在卦内位置 0-5（0=初爻/最内） */
const currentYaoInGua = computed(() => currentYaoIndex.value % 6)

/** 环径向厚度 */
const band = computed(() => props.radius - props.innerRadius)
/**
 * 径向分区（自内向外，比例基于当前 band=thickness）：
 *
 *   卦象可视化区（6 条爻线）保持在环的**外侧一半**，与 thickness=80 时的绝对位置一致；
 *   加宽 thickness 时，多出来的空间**全部**下沉给内侧文字区，用来拉开卦名与内/外卦标签，
 *   避免字号 18px + 12px 上下叠字。
 *
 *   ┌────────────── radius（外圆）
 *   │  外缘留白 6%
 *   ├──── lineBandOuter  = radius - band*0.06     ← 6 爻堆叠区外缘
 *   │  6 条爻线均匀分布（占 48% 径向）
 *   ├──── lineBandInner  = innerR + band*0.49     ← 6 爻堆叠区内缘
 *   │  分隔缓冲
 *   ├──── nameRadius     = innerR + band*0.27     ← 卦名（大字 18px）
 *   │  分隔缓冲（band=110 时 ~22px，足够容纳两行文字）
 *   ├──── baguaRadius    = innerR + band*0.075    ← 内/外卦（小字 ~12px）
 *   │  内缘留白 ~5%
 *   └────────────── innerRadius（内圆）
 *
 *   关键约束（不叠字的必要条件）：
 *     (nameRadius - baguaRadius) ≥ (nameFontSize + baguaFontSize) / 2
 *     (0.27 - 0.075) * band ≥ (18 + 12) / 2
 *     0.195 * band ≥ 15  →  band ≥ 77
 *   thickness=110 时 0.195*110 ≈ 21.5px，径向净间距约 7px，充分。
 */
const lineBandInner = computed(() => props.innerRadius + band.value * 0.49)
const lineBandOuter = computed(() => props.radius - band.value * 0.06)
const nameRadius = computed(() => props.innerRadius + band.value * 0.27)
const baguaRadius = computed(() => props.innerRadius + band.value * 0.075)

/** 内/外卦标签字号：默认 = nameFontSize × 0.65，允许父组件通过 baguaFontSize 覆盖 */
const effectiveBaguaFontSize = computed(() =>
  props.baguaFontSize > 0 ? props.baguaFontSize : Math.max(1, Math.round(props.nameFontSize * 0.65))
)

/**
 * 60 卦 × 6 爻的所有 SVG 线段
 * 阳爻 1 段、阴爻 2 段；自下(内)而上(外)。
 */
interface Segment {
  key: string
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  width: number
  isCurrent: boolean
}

const segments = computed<Segment[]>(() => {
  const lineGap = (lineBandOuter.value - lineBandInner.value) / 6
  const halfAngle = (JING_FANG_GUA_STEP / 2) * props.lineWidthRatio
  const gapHalf = halfAngle * props.yinGapRatio

  const segs: Segment[] = []
  const curGua = currentGuaIndex.value
  const curYao = currentYaoInGua.value

  for (const gua of JING_FANG_SIXTY_GUA) {
    // 卦切向中心：第 i 卦跨 [i*6, (i+1)*6]，中心 = i*6 + 3
    const centerAngle = gua.index * JING_FANG_GUA_STEP + JING_FANG_GUA_STEP / 2

    for (let i = 0; i < 6; i++) {
      const r = lineBandInner.value + lineGap * (i + 0.5)
      const yang = gua.lines[i]!
      const isCurrent = gua.index === curGua && i === curYao
      const color = isCurrent ? props.currentLineColor : props.lineColor
      const width = isCurrent ? props.currentLineStrokeWidth : props.lineStrokeWidth

      if (yang) {
        // 阳爻：一整条切向弧段
        const a = polarToCartesian(centerAngle - halfAngle, r)
        const b = polarToCartesian(centerAngle + halfAngle, r)
        segs.push({
          key: `${gua.index}-${i}`,
          x1: a.x, y1: a.y, x2: b.x, y2: b.y,
          color, width, isCurrent
        })
      } else {
        // 阴爻：左右两段
        const l1 = polarToCartesian(centerAngle - halfAngle, r)
        const l2 = polarToCartesian(centerAngle - gapHalf, r)
        const r1 = polarToCartesian(centerAngle + gapHalf, r)
        const r2 = polarToCartesian(centerAngle + halfAngle, r)
        segs.push({
          key: `${gua.index}-${i}-l`,
          x1: l1.x, y1: l1.y, x2: l2.x, y2: l2.y,
          color, width, isCurrent
        })
        segs.push({
          key: `${gua.index}-${i}-r`,
          x1: r1.x, y1: r1.y, x2: r2.x, y2: r2.y,
          color, width, isCurrent
        })
      }
    }
  }
  return segs
})

/**
 * 60 个卦名标签数据
 * 位于爻线堆叠区之内、内圆边线之外，切向居中于卦格。
 * 文字朝向：顶部指向圆心（radialTextRotation），随圆环切向排列。
 */
interface NameLabel {
  key: number
  name: string
  x: number
  y: number
  rot: number
  isCurrent: boolean
}

const nameLabels = computed<NameLabel[]>(() => {
  if (props.nameFontSize <= 0) return []
  const curGua = currentGuaIndex.value
  return JING_FANG_SIXTY_GUA.map(gua => {
    const centerAngle = gua.index * JING_FANG_GUA_STEP + JING_FANG_GUA_STEP / 2
    const p = polarToCartesian(centerAngle, nameRadius.value)
    return {
      key: gua.index,
      name: gua.name,
      x: p.x,
      y: p.y,
      rot: radialTextRotation((centerAngle + props.startDegree) % 360, props.rotationDirection),
      isCurrent: gua.index === curGua
    }
  })
})

/**
 * 60 个内/外卦八经卦名标签
 *
 * 【格式约定】"内卦/外卦"（如 中孚 = 兑/巽 → "兑/巽"），
 * 顺序刻意采用「先下后上」，与本组件径向堆叠一致（内=下=初二三爻在内）：
 *   看到「兑/巽」= 下卦兑、上卦巽，正是中孚 ䷼ 的经卦分解。
 *
 * 位置在卦名下方（更靠近内圆），字号约为卦名的 65%。
 */
interface BaguaLabel {
  key: number
  text: string
  x: number
  y: number
  rot: number
  isCurrent: boolean
}

const baguaLabels = computed<BaguaLabel[]>(() => {
  if (effectiveBaguaFontSize.value <= 0) return []
  const curGua = currentGuaIndex.value
  return JING_FANG_SIXTY_GUA.map(gua => {
    const centerAngle = gua.index * JING_FANG_GUA_STEP + JING_FANG_GUA_STEP / 2
    const p = polarToCartesian(centerAngle, baguaRadius.value)
    return {
      key: gua.index,
      text: `${gua.innerGua}/${gua.outerGua}`,
      x: p.x,
      y: p.y,
      rot: radialTextRotation((centerAngle + props.startDegree) % 360, props.rotationDirection),
      isCurrent: gua.index === curGua
    }
  })
})
</script>

<template>
  <PolarCanvas :center-x="0" :center-y="0" :rotation-direction="rotationDirection">
    <template #default>
      <g class="jingfang-gua-ring">
        <!-- 内外圆边线 -->
        <circle :cx="0" :cy="0" :r="radius" fill="none" :stroke="circleColor" :stroke-width="0.5" />
        <circle :cx="0" :cy="0" :r="innerRadius" fill="none" :stroke="circleColor" :stroke-width="0.5" />

        <!-- 360 条爻线段 -->
        <line
          v-for="seg in segments"
          :key="`yao-${seg.key}`"
          :x1="seg.x1"
          :y1="seg.y1"
          :x2="seg.x2"
          :y2="seg.y2"
          :stroke="seg.color"
          :stroke-width="seg.width"
          stroke-linecap="round"
          :class="{ 'current-yao': seg.isCurrent }"
        />

        <!-- 60 个卦名标签（位于爻线之下、内圆边线之外） -->
        <text
          v-for="lbl in nameLabels"
          :key="`name-${lbl.key}`"
          :x="lbl.x"
          :y="lbl.y"
          :fill="lbl.isCurrent ? currentNameColor : nameColor"
          :font-size="nameFontSize"
          :font-weight="lbl.isCurrent ? 'bold' : 'normal'"
          text-anchor="middle"
          dominant-baseline="central"
          :transform="`rotate(${lbl.rot} ${lbl.x} ${lbl.y})`"
          :class="{ 'current-name': lbl.isCurrent }"
        >
          {{ lbl.name }}
        </text>

        <!-- 60 个「内卦/外卦」小标签（卦名下方，先内后外） -->
        <text
          v-for="lbl in baguaLabels"
          :key="`bagua-${lbl.key}`"
          :x="lbl.x"
          :y="lbl.y"
          :fill="lbl.isCurrent ? currentBaguaColor : baguaColor"
          :font-size="effectiveBaguaFontSize"
          text-anchor="middle"
          dominant-baseline="central"
          :transform="`rotate(${lbl.rot} ${lbl.x} ${lbl.y})`"
        >
          {{ lbl.text }}
        </text>
      </g>
    </template>
  </PolarCanvas>
</template>

<style scoped>
.jingfang-gua-ring {
  transform-origin: center;
  will-change: transform;
  backface-visibility: hidden;
}

/* 当前爻呼吸动画（红色高亮） */
.current-yao {
  filter: drop-shadow(0 0 3px #FF4444);
  animation: current-yao-breath 1.6s ease-in-out infinite;
}

@keyframes current-yao-breath {
  0%, 100% {
    opacity: 1;
    filter: drop-shadow(0 0 3px #FF4444);
  }
  50% {
    opacity: 0.7;
    filter: drop-shadow(0 0 6px #FF6666);
  }
}

/* 当前卦名微光晕 —— 不做闪烁，避免抢红爻焦点 */
.current-name {
  filter: drop-shadow(0 0 2px #FFD700);
}
</style>
