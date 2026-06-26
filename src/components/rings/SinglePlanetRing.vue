<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import DataBodyRing from './DataBodyRing.vue'
import { useSevenLuminaries } from '@/composables/useSevenLuminaries'
import type { BodyRingData, LuminaryKey } from '@/data/rings/types'

/**
 * 单行星深度研究环组件
 *
 * ⚠️ 使用统一架构：内部调用 useSevenLuminaries composable
 * 专注于单个行星的多维度信息展示：
 *   - 入宿度（赤经定位）
 *   - 逆行状态与逆行标记环
 *   - 黄纬偏移指示线
 *   - 相位关系（合/冲）
 *   - 上下合标记（内行星）
 *
 * 专为单行星研究罗盘设计，可多层叠加展示不同维度。
 */
type DisplayMode = 'position' | 'retrograde' | 'aspect' | 'mansion' | 'all'

interface Props {
  /** 目标天体 */
  planet: LuminaryKey
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
  /** 显示模式 */
  mode?: DisplayMode
  /** 是否突出显示（增大光晕） */
  highlight?: boolean
  /** 黄纬偏移缩放因子 */
  latScale?: number
}

const props = withDefaults(defineProps<Props>(), {
  planet: 'jupiter',
  radius: 200,
  innerRadius: 140,
  rotationDirection: 'clockwise',
  mode: 'all',
  highlight: false,
  latScale: 40
})

/** 确保时间参数始终是响应式的（与其他组件保持一致的模式） */
const timeRef = computed(() => unref(props.time) ?? new Date())

/** 调用统一的七曜计算 composable */
const { getByKey, raToScreenAngle } = useSevenLuminaries(timeRef)

/** 目标行星的完整数据 */
const planet = computed(() => getByKey(props.planet))

/** 单行星环数据 */
const bodyRingData = computed<BodyRingData>(() => {
  const data = planet.value
  if (!data) {
    return {
      items: [],
      circleColor: '#444444',
      circleWidth: 0.5
    }
  }

  const baseHalo = props.highlight ? 3 : 2
  const hl = data.retrograde ? 3 : baseHalo as 0 | 1 | 2 | 3

  // 标签内容（按模式决定）
  let label = data.symbol
  if (props.mode === 'mansion' && data.mansion) {
    label = `${data.symbol}入${data.mansion.label}${data.mansion.degreeInMansion.toFixed(1)}°`
  } else if (props.mode === 'retrograde' && data.retrograde) {
    label = `${data.symbol}逆`
  } else if (data.mansion) {
    label = `${data.symbol}${data.mansion.degreeInMansion.toFixed(0)}°`
  }

  return {
    circleColor: props.highlight ? '#886600' : '#444444',
    circleWidth: props.highlight ? 1.5 : 0.5,
    latScale: props.latScale,
    showLatLine: props.mode === 'all' || props.mode === 'position',
    showRetrogradeRing: props.mode === 'all' || props.mode === 'retrograde',

    items: [
      {
        label,
        symbol: data.symbol,
        color: data.color,
        kind: data.key,
        angle: raToScreenAngle(data.equatorial.ra),
        size: props.highlight ? Math.round(data.size * 1.3) : data.size,
        highlightLevel: hl,
        haloLevel: hl,
        state: {
          retrograde: data.retrograde,
          latitude: data.ecliptic.latitude,
          mansion: data.mansion
            ? { label: data.mansion.label, degree: data.mansion.degreeInMansion }
            : undefined,
          conjunctionKind: data.conjunctionKind
        }
      }
    ]
  }
})

/** 导出计算结果供外部使用 */
defineExpose({
  planet
})
</script>

<template>
  <DataBodyRing
    :data="bodyRingData"
    :radius="radius"
    :inner-radius="innerRadius"
    :rotation-direction="rotationDirection"
  />
</template>
