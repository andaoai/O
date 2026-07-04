<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import PolarCanvas from '../base/PolarCanvas.vue'
import { radialTextRotation } from '@/utils/geometry'
import { usePolar } from '@/composables/useRingBase'
import { getYaoIndexInJingFangYear } from '@/utils/jingFangYao'
import { JING_FANG_SIXTY_GUA, JING_FANG_GUA_STEP } from '@/data/rings/jingFangSixtyGua'
import { najiaOfLine } from '@/utils/najia'

/**
 * 京房卦气 60 卦「纳甲环」
 *
 * 🔵 类型：专用 SVG 组件（非 CircleRing 管线，因需在同一扇区内径向排 6 个爻位标签）
 *
 * 【设计要点】
 *   - 与外层 JingFangGuaRing 严格同构：60 卦顺时针铺满 360°，每卦 6°
 *   - 每卦 6 爻在**径向**上由内向外堆叠（i=0 初爻最内、i=5 上爻最外）
 *   - 每爻渲染为一个 <text>，两字并排横写（如 '甲子'、'壬午'）
 *   - 常规爻白色；当前爻（含当前卦当前爻）字号放大 + 金色高亮
 *
 * 【纳甲规则】
 *   完整规则见 [[najia]]。核心：内卦纳干 + 外卦纳干（宏观标签），阴阳卦
 *   顺逆行地支配爻（微观刻度）。
 *
 * 【时间→爻位算法】
 *   完全复用 JingFangGuaRing 的算法，保证纳甲环高亮爻位与卦爻线闪动位置严格重合。
 *
 * @example
 * ```vue
 * <NajiaRing :time="controlledTime" :radius="435" :inner-radius="355" />
 * ```
 */
interface Props {
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  startDegree?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
  /** 常规爻字号（px） */
  fontSize?: number
  /** 当前爻字号（px） */
  currentFontSize?: number
  /** 常规爻文字颜色（黑底白字） */
  textColor?: string
  /** 当前爻文字颜色 */
  currentTextColor?: string
  /** 圆环边线颜色 */
  circleColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  // 【几何】默认 435 → 355（thickness=80），由 RingStack 通过 thickness 接管
  radius: 435,
  innerRadius: 355,

  // 【定位】0 = 冬至锚在 SVG 正右方，与 JingFangGuaRing 完全一致
  startDegree: 0,

  // 【方向】顺时针，与全盘统一
  rotationDirection: 'clockwise',

  // 【字号】6 爻均分 80px 径向 → 每层约 13px 高；两字并排横写约 24px 宽。
  //   在半径 ~395 处每卦 6° 弧长约 41px，字号 11 时两字总宽约 22px，切向留白充足。
  fontSize: 11,

  // 【字号·高亮】略放大 + 加粗突出，与卦名高亮呼应。
  currentFontSize: 13,

  // 【配色】常规爻使用中灰色，视觉上"退到背景层"，让当前爻高亮与外环更突出。
  //   #888 在黑底上清晰可读但不刺眼，避免 360 个白字抢焦点。
  textColor: '#888888',

  // 【配色·高亮】金色，与 JingFangGuaRing 当前卦名色一致
  currentTextColor: '#FFD700',

  // 【边线】暗灰细边，仅作分隔
  circleColor: '#333333'
})

// ⚠️ 时间驱动范式：MaybeRef → computed timeRef
const timeRef = computed(() => unref(props.time) ?? new Date())

/** 极坐标 → 笛卡尔（走 useRingBase.usePolar，随 startDegree/rotationDirection 处理） */
const polarToCartesian = usePolar(
  () => props.startDegree,
  () => props.rotationDirection
)

/**
 * 当前爻位索引 0-359（收敛于 utils/jingFangYao：
 *   daysSinceWinterSolstice / 365.25 × 360 = currentYaoIndex）
 */
const currentYaoIndex = computed(() => getYaoIndexInJingFangYear(timeRef.value))

/** 当前卦序 0-59 */
const currentGuaIndex = computed(() => Math.floor(currentYaoIndex.value / 6))
/** 当前爻在卦内位置 0-5（0=初爻/最内） */
const currentYaoInGua = computed(() => currentYaoIndex.value % 6)

/** 环径向厚度与六爻分层步长 */
const band = computed(() => props.radius - props.innerRadius)
/** 6 爻径向堆叠区：预留上下各 6% 边距，避免贴到内外圆边线 */
const yaoBandInner = computed(() => props.innerRadius + band.value * 0.06)
const yaoBandOuter = computed(() => props.radius - band.value * 0.06)
const yaoStep = computed(() => (yaoBandOuter.value - yaoBandInner.value) / 6)

/**
 * 60 卦 × 6 爻 = 360 个干支标签
 * 每卦切向中心角度 + 每爻径向位置 → 一个 <text>
 */
interface NajiaLabel {
  key: string
  text: string
  x: number
  y: number
  rot: number
  isCurrent: boolean
}

const labels = computed<NajiaLabel[]>(() => {
  const curGua = currentGuaIndex.value
  const curYao = currentYaoInGua.value
  const out: NajiaLabel[] = []

  for (const gua of JING_FANG_SIXTY_GUA) {
    // 卦切向中心：第 i 卦跨 [i*6, (i+1)*6]，中心 = i*6 + 3
    const centerAngle = gua.index * JING_FANG_GUA_STEP + JING_FANG_GUA_STEP / 2
    const rot = radialTextRotation(
      (centerAngle + props.startDegree) % 360,
      props.rotationDirection
    )

    for (let i = 0; i < 6; i++) {
      const r = yaoBandInner.value + yaoStep.value * (i + 0.5)
      const p = polarToCartesian(centerAngle, r)
      out.push({
        key: `${gua.index}-${i}`,
        text: najiaOfLine(gua.value, i),
        x: p.x,
        y: p.y,
        rot,
        isCurrent: gua.index === curGua && i === curYao
      })
    }
  }
  return out
})
</script>

<template>
  <PolarCanvas :center-x="0" :center-y="0" :rotation-direction="rotationDirection">
    <template #default>
      <g class="najia-ring">
        <!-- 内外圆边线（细暗灰，仅分隔） -->
        <circle :cx="0" :cy="0" :r="radius" fill="none" :stroke="circleColor" :stroke-width="0.5" />
        <circle :cx="0" :cy="0" :r="innerRadius" fill="none" :stroke="circleColor" :stroke-width="0.5" />

        <!-- 360 个干支两字标签 -->
        <text
          v-for="lbl in labels"
          :key="lbl.key"
          :x="lbl.x"
          :y="lbl.y"
          :fill="lbl.isCurrent ? currentTextColor : textColor"
          :font-size="lbl.isCurrent ? currentFontSize : fontSize"
          :font-weight="lbl.isCurrent ? 'bold' : 'normal'"
          text-anchor="middle"
          dominant-baseline="central"
          :transform="`rotate(${lbl.rot} ${lbl.x} ${lbl.y})`"
          :class="{ 'current-najia': lbl.isCurrent }"
        >
          {{ lbl.text }}
        </text>
      </g>
    </template>
  </PolarCanvas>
</template>

<style scoped>
.najia-ring {
  transform-origin: center;
  will-change: transform;
  backface-visibility: hidden;
}

/* 当前爻纳甲金色微光晕（不闪烁，避免抢外环红爻焦点） */
.current-najia {
  filter: drop-shadow(0 0 2px #FFD700);
}
</style>
