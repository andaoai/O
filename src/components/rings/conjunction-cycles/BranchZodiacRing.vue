<script setup lang="ts">
import { computed } from 'vue'
import DataRing from '@/components/rings/DataRing.vue'
import { BRANCHES } from '@/utils/constants/ganzhi'
import { colorOfBranch } from '@/utils/wuxing'
import { eclipticToEquatorial } from '@/utils/skyProjection'
import { normalizeAngle } from '@/utils/geometry'
import type { RingData } from '@/data/rings/types'

/**
 * 会合周期盘专用 · 十二地支宫格环（按黄经/赤经对齐）
 *
 * 十二地支宫与二十四节气的传统对应（每宫 30°，节气「节-节」跨度）：
 *
 *   宫  | 节气跨度        | 起点黄经 | 终点黄经  | 宫中心黄经
 *   ---|---------------|--------|--------|---------
 *   丑  | 小寒→立春       |  285°  |  315°  |  300°
 *   寅  | 立春→惊蛰       |  315°  |  345°  |  330°
 *   卯  | 惊蛰→清明       |  345°  |   15°  |    0°（春分居中）
 *   辰  | 清明→立夏       |   15°  |   45°  |   30°
 *   巳  | 立夏→芒种       |   45°  |   75°  |   60°
 *   午  | 芒种→小暑       |   75°  |  105°  |   90°（夏至居中）
 *   未  | 小暑→立秋       |  105°  |  135°  |  120°
 *   申  | 立秋→白露       |  135°  |  165°  |  150°
 *   酉  | 白露→寒露       |  165°  |  195°  |  180°（秋分居中）
 *   戌  | 寒露→立冬       |  195°  |  225°  |  210°
 *   亥  | 立冬→大雪       |  225°  |  255°  |  240°
 *   子  | 大雪→小寒       |  255°  |  285°  |  270°（冬至居中）
 *
 * 屏幕角约定：`screenAngle = 360 − RA`（与 SolarTermsSkyRing / MansionDegreeRing 一致）
 * 此约定下，春分（RA=0）在屏幕 0°（正右），冬至（RA=270）在屏幕 90°（正下）。
 *
 * 因此本环使用 raDirection = 'counterclockwise'（RA 增大 → 屏幕逆时针）。
 * 宫格排布为 counterclockwise，Data 中 startAngle/endAngle 直接用「宫起点/终点的屏幕角」。
 */

interface Props {
  radius?: number
  innerRadius?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
  /** 宫格背景色（缺省半透明五行色） */
  fillOpacity?: number
}

const props = withDefaults(defineProps<Props>(), {
  radius: 480,
  innerRadius: 456,
  rotationDirection: 'clockwise',
  fillOpacity: 0.06
})

/**
 * 12 宫定义：BRANCHES[0]=子, [1]=丑, ..., [11]=亥
 * 各宫「起点黄经」按上表；宽度 30°。
 */
const BRANCH_START_ECL: Record<number, number> = {
  0: 255,   // 子（大雪起）
  1: 285,   // 丑（小寒起）
  2: 315,   // 寅（立春起）
  3: 345,   // 卯（惊蛰起）
  4: 15,    // 辰（清明起）
  5: 45,    // 巳（立夏起）
  6: 75,    // 午（芒种起）
  7: 105,   // 未（小暑起）
  8: 135,   // 申（立秋起）
  9: 165,   // 酉（白露起）
  10: 195,  // 戌（寒露起）
  11: 225   // 亥（立冬起）
}

/** 黄经 → 屏幕角度：先转赤经，再取 360-ra */
const eclToScreen = (eclLon: number): number => {
  const ra = eclipticToEquatorial(normalizeAngle(eclLon)).ra
  return normalizeAngle(360 - ra)
}

const ringData = computed<RingData>(() => ({
  circleColor: '#555555',
  circleWidth: 1,
  fontSize: 13,
  items: BRANCHES.map((b, i) => {
    const eclStart = BRANCH_START_ECL[i]!
    const eclEnd = normalizeAngle(eclStart + 30)
    // screenAngle 与 RA 反向，所以「宫起点黄经」→ 屏幕角作为 endAngle
    // （黄经增加 → 屏幕角减小）
    const screenEnd = eclToScreen(eclStart)
    const screenStart = eclToScreen(eclEnd)
    return {
      label: b,
      startAngle: screenStart,
      endAngle: screenEnd,
      color: colorOfBranch(i),
      bgColor: colorOfBranch(i)
    }
  })
}))
</script>

<template>
  <DataRing
    :data="ringData"
    :radius="radius"
    :inner-radius="innerRadius"
    :rotation-direction="rotationDirection"
  />
</template>
