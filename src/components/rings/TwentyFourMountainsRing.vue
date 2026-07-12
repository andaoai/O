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
 *
 *  🎯 高亮体系（三级，在静态数据上叠加）：
 *    · highlightMountain（level=3 🔴）: 手机当前朝向所指之山
 *       由 FengShui24View 传入 trueHeading 转换后的山名，
 *       强呼吸 + 大字醒目。
 *    · highlightAngle（level=2 🟡）: 太阳方位角自动匹配之山
 *       天文计算所得太阳 azimuth → angleToMountain() 查找命中，
 *       中呼吸高亮，次级标识。
 *    · 其余山（level=0）: 仅显示传统配色，不高亮。
 *
 *  数据来源：data/rings/twentyFourMountains.ts
 *  使用场景：FengShui24View.vue（手机罗盘）、AstronomyView.vue（天文盘）
 *
 *  ⚠️ 五层架构：Layer 3 Domain Component
 *     接受 MaybeRef<Date>（太阳位置用），FengShui24View 中可不传 time
 *     （太阳高亮非必需，仅手机朝向高亮亦可）。
 * ═══════════════════════════════════════════════════════════════
 */

interface Props {
  /** 时间源（支持 ref 或 plain value，用于太阳位置 → highlightAngle 计算链） */
  time?: MaybeRef<Date>
  /** 环外半径（RingStack 自动注入） */
  radius?: number
  /** 环内半径（RingStack 自动注入） */
  innerRadius?: number
  /** 起始角度偏移（默认 -90 = 子对齐 SVG 正上） */
  startDegree?: number
  /** 旋转方向 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
  /**
   * 🎯 高亮山名（level=3）
   * 手机 GPS/传感器 当前指向的山。由外框 view 计算方位后传入。
   * 适用于：deviceOrientation trueHeading → angleToMountain() → 经 15° bin
   */
  highlightMountain?: string
  /**
   * 🎯 高亮角度（level=2）
   * 太阳或其他天体方位角（0-360，0=北）。自动匹配对应山，
   * 用于显示"太阳现在位于某山"。
   */
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

/**
 * 角度 → 山名查找（15° 区间二分查找）
 *
 * 每个山占据其 center ± 7.5° 的区间（共 15°）。
 * 遍历 24 山找到角度落入的区间返回对应山名。
 * 处理跨越 360° 边界的情况（如 352°-8° 的跨度）。
 *
 * @param angle - 方位角（0-360，0=北），如太阳方位角
 * @returns 匹配的山名，或 null（角度超出范围）
 */
function angleToMountain(angle: number): string | null {
  const normalized = ((angle % 360) + 360) % 360
  for (let i = 0; i < MOUNTAIN_CENTERS.length; i++) {
    const center = MOUNTAIN_CENTERS[i]!
    const start = ((center - 7.5) % 360 + 360) % 360
    const end = center + 7.5
    // 处理跨越 360° 的情况（如壬 345° ± 7.5° → [337.5°, 352.5°]）
    if (start > end) {
      if (normalized >= start || normalized <= end) return MOUNTAIN_NAMES[i]!
    } else {
      if (normalized >= start && normalized <= end) return MOUNTAIN_NAMES[i]!
    }
  }
  return null
}

/**
 * 响应式数据：在 twentyFourMountains 静态数据上叠加高亮
 *
 * 高亮优先级：
 *   1. highlightMountain（手机指向，level=3）→ 覆盖以下
 *   2. highlightAngle（太阳方位，level=2）→ 仅当未命中 level=3
 *   3. 默认（无高亮，level=0）
 *
 * 注意：高亮不叠加——手机指向的山和太阳所在的山可能是不同的山，
 * 但这里只给最高的那个 level（手机优先）。
 */
const ringData = computed<RingData>(() => {
  const sunMountain = props.highlightAngle !== undefined
    ? angleToMountain(props.highlightAngle)
    : null

  return {
    ...twentyFourMountains,
    items: twentyFourMountains.items.map(item => {
      let highlightLevel: 0 | 1 | 2 | 3 = 0
      if (item.label === props.highlightMountain) {
        highlightLevel = 3 // 🔴 手机当前指向
      } else if (item.label === sunMountain) {
        highlightLevel = 2 // 🟡 太阳所在（如果与手机指向不同）
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
