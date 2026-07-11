<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import DataRing from './DataRing.vue'
import { twentyFourMountains, MOUNTAIN_CENTERS, MOUNTAIN_NAMES } from '@/data/rings/twentyFourMountains'
import type { RingData } from '@/data/rings/types'

/**
 * 二十四山段环
 *
 * ═══════════════════════════════════════════════════════════════
 *  风水罗盘核心环：24 个 15° 扇区，显示二十四山方位。
 *  可在非时间驱动模式下静态使用（仅传 radius/innerRadius），
 *  也可传入当前朝向角度实现动态高亮。
 *
 *  🎯 高亮体系：
 *    · highlightMountain：指定山名→highlightLevel=3（手机当前指向）
 *    · highlightAngle：指定角度→匹配对应山 highlightLevel=2（太阳位置）
 *
 *  ⚠️ 五层架构：Base Render 层 / Domain 边界组件
 *     数据来自 data/rings/twentyFourMountains.ts
 * ═══════════════════════════════════════════════════════════════
 */

interface Props {
  /** 时间源（支持 ref 或 plain value，用于太阳位置） */
  time?: MaybeRef<Date>
  /** 环外半径（RingStack 自动注入） */
  radius?: number
  /** 环内半径（RingStack 自动注入） */
  innerRadius?: number
  /** 起始角度偏移 */
  startDegree?: number
  /** 旋转方向 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
  /** 高亮的山名（当前手机朝向，level=3） */
  highlightMountain?: string
  /** 高亮角度（太阳方位角，自动匹配对应山，level=2） */
  highlightAngle?: number
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200,
  innerRadius: 140,
  startDegree: -90,
  rotationDirection: 'clockwise',
  highlightMountain: '',
  highlightAngle: undefined
})

/** 由角度(0-360, 0=北) → 山名 */
function angleToMountain(angle: number): string | null {
  const normalized = ((angle % 360) + 360) % 360
  for (let i = 0; i < MOUNTAIN_CENTERS.length; i++) {
    const center = MOUNTAIN_CENTERS[i]!
    const start = ((center - 7.5) % 360 + 360) % 360
    const end = center + 7.5
    // 处理跨越 360° 的情况
    if (start > end) {
      if (normalized >= start || normalized <= end) return MOUNTAIN_NAMES[i]!
    } else {
      if (normalized >= start && normalized <= end) return MOUNTAIN_NAMES[i]!
    }
  }
  return null
}

/** 响应式数据：在静态数据上叠加高亮 */
const ringData = computed<RingData>(() => {
  const sunMountain = props.highlightAngle !== undefined
    ? angleToMountain(props.highlightAngle)
    : null

  return {
    ...twentyFourMountains,
    items: twentyFourMountains.items.map(item => {
      let highlightLevel: 0 | 1 | 2 | 3 = 0
      if (item.label === props.highlightMountain) {
        highlightLevel = 3
      } else if (item.label === sunMountain) {
        highlightLevel = 2
      }
      return highlightLevel ? { ...item, highlightLevel } : item
    })
  }
})
</script>

<template>
  <DataRing
    :data="ringData"
    :radius="radius"
    :inner-radius="innerRadius"
    :start-degree="startDegree"
    :rotation-direction="rotationDirection"
  />
</template>
