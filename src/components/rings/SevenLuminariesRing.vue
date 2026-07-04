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
 * 三种坐标体系：
 *   - equatorial: 赤道坐标（赤经 → 面朝北仰望屏幕角，与二十八宿对齐）
 *   - ecliptic: 黄道坐标（黄经直接作为屏幕角，SkyChart 内部专用）
 *   - ecliptic-facing-north: 黄道坐标 × 面朝北仰望约定
 *     公式 `(360 - lon) % 360`：春分点在右、夏至点在上、秋分点在左、冬至点在下
 *     ⚠️ 与观斗盘的月将环 / 24 节气环同用此约定，太阳符号会精确落在
 *     当前节气刻度点上、月将格中央上，形成"三重锁定"。
 *
 * 可直接放入 RingStack，与 DataRing / DataPointRing 平级混用。
 */
type CoordinateSystem = 'ecliptic' | 'ecliptic-facing-north' | 'equatorial'

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
        const lon = luminary.ecliptic.longitude
        const angle =
          props.coordinateSystem === 'equatorial'
            ? raToScreenAngle(luminary.equatorial.ra)
            : props.coordinateSystem === 'ecliptic-facing-north'
              ? ((360 - lon) % 360 + 360) % 360
              : lon

        // 高亮等级按运动状态分级，提供更细腻的视觉反馈
        // 逆行/留守 = 3，疾行/迟行 = 2，正常顺行 = 1
        const getHighlightLevel = (): 0 | 1 | 2 | 3 => {
          if (luminary.motion?.isRetrograde || luminary.motion?.isStationary) {
            return 3
          }
          if (luminary.motion?.state === 'fast' || luminary.motion?.state === 'slow') {
            return 2
          }
          return 1
        }

        const hl = getHighlightLevel()

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
              : undefined,
            // 五星运动状态（疾/顺/迟/守/逆），日月恒为正常顺行故不传
            motion: luminary.motion
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
