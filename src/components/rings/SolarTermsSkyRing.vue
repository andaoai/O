<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import DataPointRing from './DataPointRing.vue'
import { sunLongitude } from '@/utils/celestial'
import { eclipticToEquatorial } from '@/utils/skyProjection'
import { normalizeAngle } from '@/utils/geometry'
import {
  SOLAR_TERMS_LICHUN_ORDER,
  SOLAR_TERM_CARDINALS,
  currentLichunIndex
} from '@/utils/constants/solarTerms'

/**
 * 二十四节气环组件（天星盘版本 · 时间驱动）
 *
 * ⚠️ 时间驱动架构：接受 time ref，内部统一使用 unref()
 *
 * 按黄经定位（春分=黄经0），点导向，径向短线刻度表示节气点。
 * 自动计算当前太阳所在节气并高亮。二分二至（春分/夏至/秋分/冬至）
 * 有特殊高亮样式。
 *
 * 坐标系对齐：黄经 → 赤道赤经 → DataPointRing 顺时针角度 = 360° - ra
 * 这样外圈节气环与内部 SkyChart 的赤经坐标系完全对齐。
 */
interface Props {
  /** 时间源（支持 ref 或 plain value） */
  time?: MaybeRef<Date>
  /** 环外半径 */
  radius?: number
  /** 环内半径 */
  innerRadius?: number
  /** 旋转方向 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200,
  innerRadius: 180,
  rotationDirection: 'clockwise'
})

/** ⚠️ 时间驱动统一范式：确保 time 始终是响应式的 */
const timeRef = computed(() => unref(props.time) ?? new Date())

/** 赤经 → DataPointRing 顺时针角度 */
const raToAngle = (ra: number) => normalizeAngle(360 - ra)

/** 二十四节气环数据（随时间动态变化） */
const ringData = computed(() => {
  // 当前太阳所在节气（收敛于 constants/solarTerms）
  const currentIndex = currentLichunIndex(sunLongitude(timeRef.value))

  return {
    startDegree: 0,
    labelOffset: -16,       // 标签向环内偏移，避开刻度区
    labelAngleOffset: 0,    // 文字与刻度线同径向对齐
    pointSize: 8,           // 细小刻度：stroke-width = 8/10 = 0.8px
    pointColor: '#66aadd',  // 更柔和的蓝色
    pointSymbol: 'tick' as const,
    circleColor: '#444444',
    circleWidth: 0.5,
    items: SOLAR_TERMS_LICHUN_ORDER.map((label, i) => {
      // 二分二至特殊高亮
      const isSpecial = SOLAR_TERM_CARDINALS.has(label)
      const eclLon = normalizeAngle(315 + i * 15) // 每个节气的精确黄经
      const ra = eclipticToEquatorial(eclLon).ra
      return {
        label,
        angle: raToAngle(ra),
        fontSize: isSpecial ? 12 : 10,
        pointSize: isSpecial ? 12 : 10,
        pointColor: isSpecial ? '#ffdd00' : '#88ccff',
        color: isSpecial ? '#ffdd00' : '#ffffff',
        highlight: i === currentIndex,
        highlightLevel: (i === currentIndex ? 2 : 0) as 0 | 1 | 2 | 3
      }
    })
  }
})
</script>

<template>
  <DataPointRing
    :data="ringData"
    :radius="radius"
    :inner-radius="innerRadius"
    :rotation-direction="rotationDirection"
  />
</template>
