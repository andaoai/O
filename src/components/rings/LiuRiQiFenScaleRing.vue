<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import DataPointRing from './DataPointRing.vue'
import { getYaoIndexInJingFangYear } from '@/utils/jingFangYao'
import type { PointRingData } from '@/data/rings/types'

/**
 * 六日七分法 360 爻位刻度环（点环）
 *
 * 🔵 类型：点环 → DataPointRing → PointRing → PolarCanvas
 *
 * 京房卦气体系核心原理：
 *   60 卦 × 6 爻 = 360 爻位，装载一回归年 365.25 天
 *   每爻 ≈ 1.0145833 天（比真实太阳日略长）
 *
 * ⚠️ 重要区别：
 *   - 外层 DayScaleRing：365 条刻度 = 真实公历日（24 小时 = 12 时辰）
 *   - 本环 360 条刻度 = 六日七分法的"爻位日"（约 24 小时 21 分钟）
 *   360 爻 × 1.0146 天 = 365.25 天 完整回归年
 *
 * 四级刻度体系（从外缘向内画）：
 *   外缘 ─┬─ 爻刻度(短, 0.3px, 暗色)  ─── 360 条精细纹理
 *         ├─ 卦刻度(中, 0.8px, 灰)     ─── 60 条（每 6 爻一条）
 *         ├─ 四正卦刻度(长, 1.5px, 金)  ─── 4 条（坎/震/离/兑）
 *   内缘 ─┴─ 当日刻度(最长, 2.5px, 红呼吸) ─── 1 条高亮
 *
 * @example
 * ```vue
 * <LiuRiQiFenScaleRing :time="controlledTime" :radius="430" :inner-radius="410" />
 * ```
 */
interface Props {
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  startDegree?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 430,
  innerRadius: 410,
  startDegree: 0,
  rotationDirection: 'clockwise'
})

const timeRef = computed(() => unref(props.time) ?? new Date())

const ringData = computed((): PointRingData => {
  // 🔑 当日在六日七分 360 爻位中的位置（收敛于 utils/jingFangYao）
  const currentYaoIndex = getYaoIndexInJingFangYear(timeRef.value)

  const ringWidth = props.radius - props.innerRadius

  // 刻度长度（从外缘向内延伸的像素）
  const yaoLen = ringWidth * 0.25       // 爻刻度：基础纹理
  const guaLen = ringWidth * 0.50       // 卦刻度：带数字标签
  const cardinalLen = ringWidth * 0.70  // 四正卦刻度：最长
  const todayLen = ringWidth * 0.90     // 当日刻度：超出内缘醒目

  const items: PointRingData['items'] = []

  // 360 爻位刻度
  for (let yao = 0; yao < 360; yao++) {
    const angle = yao * 1 // 每爻 1°，均匀分布 360°

    const isToday = yao === currentYaoIndex // 当日爻位高亮
    const isCardinal = yao % 90 === 0       // 四正卦位置：0°(坎冬), 90°(震春), 180°(离夏), 270°(兑秋)
    const isGuaStart = yao % 6 === 0         // 每卦起始（6 爻一卦）
    const guaIndex = Math.floor(yao / 6)     // 卦序号 0-59

    let tickInnerRatio: number
    let tickWidth: number
    let pointColor: string
    let label: string
    let fontSize: number
    let highlightLevel: 0 | 1 | 2 | 3

    if (isToday) {
      // 🔴 当日在六日七分法中的爻位 - 红色高亮呼吸
      tickInnerRatio = 1 - todayLen / ringWidth
      tickWidth = 3.0
      pointColor = '#FF4444'
      label = '今'
      fontSize = 8
      highlightLevel = 3
    } else if (isCardinal) {
      // 🟡 四正刻度（0°/90°/180°/270°）- 纯数学刻度
      tickInnerRatio = 1 - cardinalLen / ringWidth
      tickWidth = 2.0
      pointColor = '#FFD700'
      label = ''
      fontSize = 0
      highlightLevel = 2
    } else if (isGuaStart) {
      // ⚪ 卦起始刻度（每 6 爻一条）
      tickInnerRatio = 1 - guaLen / ringWidth
      tickWidth = 1.2
      pointColor = '#AAAAAA'
      label = ''
      fontSize = 0
      highlightLevel = 1
    } else {
      // ⚫ 普通爻刻度
      tickInnerRatio = 1 - yaoLen / ringWidth
      tickWidth = 0.5
      pointColor = '#555555'
      label = ''
      fontSize = 0
      highlightLevel = 0
    }

    items.push({
      angle,
      label,
      pointSymbol: 'tick' as const,
      pointColor,
      fontSize,
      tickInnerRatio: Math.max(0.2, tickInnerRatio),
      tickOuterRatio: 1.0,
      tickWidth,
      highlightLevel
    })
  }

  // 标签放在内缘外侧
  const labelOffset = Math.max(2, ringWidth * 0.1)

  return {
    radius: props.radius,
    innerRadius: props.innerRadius,
    startDegree: props.startDegree,
    labelColor: '#FFD700',
    labelOffset,
    labelOffsetBase: 'inner',
    circleColor: '#555555',
    circleWidth: 0.5,
    pointSymbol: 'tick',
    items
  }
})
</script>

<template>
  <DataPointRing
    :data="ringData"
    :radius="radius"
    :inner-radius="innerRadius"
    :start-degree="startDegree"
    :rotation-direction="rotationDirection"
  />
</template>
