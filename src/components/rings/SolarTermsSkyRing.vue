<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import DataPointRing from './DataPointRing.vue'
import { sunLongitude } from '@/utils/celestial'
import { eclipticToEquatorial } from '@/utils/skyProjection'
import { normalizeAngle } from '@/utils/geometry'

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

/** 角度归一化到 [0,360) */
const norm = normalizeAngle
/** 赤经 → DataPointRing 顺时针角度 */
const raToAngle = (ra: number) => norm(360 - ra)

/** 二十四节气标签 */
const SOLAR_TERMS = [
  '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
  '立夏', '小满', '芒种', '夏至', '小暑', '大暑',
  '立秋', '处暑', '白露', '秋分', '寒露', '霜降',
  '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'
]

/** 二十四节气环数据（随时间动态变化） */
const ringData = computed(() => {
  // 当前太阳所在节气（黄经从立春 315° 起、每 15° 一气）用于高亮
  const sunLon = sunLongitude(timeRef.value)
  const currentIndex = Math.floor(norm(sunLon - 315) / 15)

  return {
    startDegree: 0,
    labelOffset: -16,       // 标签向环内偏移，避开刻度区
    labelAngleOffset: 0,    // 文字与刻度线同径向对齐
    pointSize: 8,           // 细小刻度：stroke-width = 8/10 = 0.8px
    pointColor: '#66aadd',  // 更柔和的蓝色
    pointSymbol: 'tick' as const,
    circleColor: '#444444',
    circleWidth: 0.5,
    items: SOLAR_TERMS.map((label, i) => {
      // 二分二至特殊高亮
      const isSpecial = label === '春分' || label === '夏至' || label === '秋分' || label === '冬至'
      const eclLon = norm(315 + i * 15) // 每个节气的精确黄经
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
