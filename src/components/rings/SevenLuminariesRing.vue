<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import DataBodyRing from './DataBodyRing.vue'
import { useSevenLuminaries } from '@/composables/useSevenLuminaries'
import type { BodyRingData, LuminaryKey } from '@/data/rings/types'

/**
 * 七曜天体环组件
 *
 * ⚠️ 使用统一架构：内部调用 useSevenLuminaries composable
 * 自动计算日月五星的位置、逆行、黄纬偏移、入宿等状态
 *
 * 两种坐标体系：
 *   - equatorial: 赤道坐标（赤经，与二十八宿对齐，与 RingStack 对齐）
 *   - ecliptic: 黄道坐标（黄经）
 *
 * 可直接放入 RingStack，与 DataRing / DataPointRing 平级混用。
 */
type CoordinateSystem = 'ecliptic' | 'equatorial'

interface Props {
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
  /** 坐标体系 */
  coordinateSystem?: CoordinateSystem
  /** 是否显示黄纬偏移指示线 */
  showLatitudeLine?: boolean
  /** 是否显示逆行标记环 */
  showRetrogradeRing?: boolean
  /** 仅显示指定天体（默认全部显示） */
  only?: LuminaryKey[]
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200,
  innerRadius: 140,
  rotationDirection: 'clockwise',
  coordinateSystem: 'equatorial',
  showLatitudeLine: true,
  showRetrogradeRing: true
})

/** 确保时间参数始终是响应式的（与 SkyChart/HelioOrbits 保持一致的模式） */
const timeRef = computed(() => unref(props.time) ?? new Date())

/** 调用统一的七曜计算 composable */
const { all, raToScreenAngle } = useSevenLuminaries(timeRef)

/** 天体环数据（随时间自动更新） */
const bodyRingData = computed<BodyRingData>(() => {
  const filterKeys = props.only || unref(all).map(x => x.key)

  return {
    circleColor: '#444444',
    circleWidth: 0.5,
    latScale: 40,
    showLatLine: props.showLatitudeLine,
    showRetrogradeRing: props.showRetrogradeRing,

    items: unref(all)
      .filter(x => filterKeys.includes(x.key))
      .map((luminary) => {
        // 根据坐标体系选择角度
        const angle = props.coordinateSystem === 'equatorial'
          ? raToScreenAngle(luminary.equatorial.ra)
          : luminary.ecliptic.longitude

        // 高亮等级：逆行 = 3，普通 = 2
        const hl: 0 | 1 | 2 | 3 = luminary.retrograde ? 3 : 2

        return {
          label: luminary.mansion
            ? `${luminary.symbol}${luminary.mansion.degreeInMansion.toFixed(0)}°`
            : luminary.symbol,
          symbol: luminary.symbol,
          color: luminary.color,
          kind: luminary.key,
          angle,
          size: luminary.size,
          highlightLevel: hl,
          haloLevel: hl,
          state: {
            retrograde: luminary.retrograde,
            latitude: luminary.ecliptic.latitude,
            mansion: luminary.mansion
              ? { label: luminary.mansion.label, degree: luminary.mansion.degreeInMansion }
              : undefined
          }
        }
      })
  }
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
