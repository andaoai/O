<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import DataRing from './DataRing.vue'
import { twentyEightConstellations } from '@/data/rings/twentyEightConstellations'
import { getMansionSpans } from '@/utils/planetMansion'
import { getPlanetMansions } from '@/utils/planetMansion'
import { getMansionEvents } from '@/utils/skyEvents'
import { normalizeAngle } from '@/utils/geometry'

/**
 * 二十八宿环组件（时间驱动）
 *
 * ⚠️ 时间驱动架构：接受 time ref，内部统一使用 unref()
 *
 * 根据传入时间自动计算：
 *   - 各宿的赤经区间（随岁差/时间动态变化）
 *   - 各宿的天象事件分级（合/冲/聚 → 高亮等级）
 *   - 单曜路过的宿（微亮），合冲三星聚（中亮），四星五星聚（强亮）
 *
 * 坐标系约定（通过 raDirection 入参选择）：
 *
 *   · 'counterclockwise'（默认）：
 *       raToAngle = 360 − ra，RA=0 在 SVG 正右，RA 增大逆时针旋转。
 *       匹配 SkyChart 的 project(ra,0)→toCanvas（即 y-flip），
 *       用于 PlanetMansionView 等基于天球投影的视图。
 *
 *   · 'clockwise'：
 *       raToAngle = ra，RA=0 在 SVG 正右，RA 增大顺时针旋转。
 *       匹配 SuzhouSkyMap 的 projAngle = LST − RA + 90 投影路径，
 *       用于 SuzhouStellarMapView 等面北仰望的极方位投影视图。
 *
 * 再通过 startDegree 外部注入 LST 相位补偿完成最终对齐。
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
  /**
   * 起始相位偏移（度），覆盖默认的 0。
   * 用于与外层坐标系（如苏州星图的 LST 投影）对齐，使环的宿段与中心辐条一致。
   */
  startDegree?: number
  /**
   * 赤经角度映射方向：
   *   'clockwise'        — raToAngle = ra，段从 startRa 到 endRa（正向）
   *   'counterclockwise' — raToAngle = 360 − ra，段从 endRa 到 startRa（反向，默认）
   * 默认 'counterclockwise' 以保持与 SkyChart（PlanetMansionView）的向后兼容。
   */
  raDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200,
  innerRadius: 180,
  rotationDirection: 'clockwise',
  raDirection: 'counterclockwise'
})

/** ⚠️ 时间驱动统一范式：确保 time 始终是响应式的 */
const timeRef = computed(() => unref(props.time) ?? new Date())

/** 角度归一化到 [0,360) */
const norm = normalizeAngle

/**
 * raToAngle 工厂：根据 raDirection 选择赤经→SVG 角度映射。
 * - 'clockwise'        : raToAngle = norm(ra)，RA 增大顺时针旋转
 * - 'counterclockwise' : raToAngle = norm(360 - ra)，RA 增大逆时针旋转
 */
const raToAngle = (ra: number) =>
  props.raDirection === 'clockwise' ? norm(ra) : norm(360 - ra)

/** 当前七曜落宿 */
const planetMansions = computed(() => getPlanetMansions(timeRef.value))

/** 当前各宿的天象事件（合/冲/聚 → 落宿分级） */
const mansionEvents = computed(() => getMansionEvents(timeRef.value))

/** 二十八宿环数据（随时间动态变化） */
const ringData = computed(() => {
  const spans = getMansionSpans(timeRef.value)
  // 单曜路过的宿（常态，仅给微亮）
  const litLabels = new Set(
    planetMansions.value.map((pm) => pm.mansion?.label).filter(Boolean) as string[]
  )
  const events = mansionEvents.value
  return {
    ...twentyEightConstellations,
    startDegree: props.startDegree ?? 0,
    items: spans.map((s) => {
      const evt = events.get(s.label)
      const level = evt ? evt.level : litLabels.has(s.label) ? 1 : 0
      return {
        label: s.label,
        // 不亮=灰白；微亮及以上=宿本色
        color: level >= 1 ? s.color : '#cccccc',
        // 'clockwise': 段从 startRa 到 endRa（赤经递增方向）
        // 'counterclockwise': 段从 endRa 到 startRa（赤经递减，与 SkyChart 一致）
        startAngle: props.raDirection === 'clockwise'
          ? raToAngle(s.startRa)
          : raToAngle(s.endRa),
        endAngle: props.raDirection === 'clockwise'
          ? raToAngle(s.endRa)
          : raToAngle(s.startRa),
        highlightLevel: level as 0 | 1 | 2 | 3
      }
    })
  }
})
</script>

<template>
  <DataRing
    :data="ringData"
    :radius="radius"
    :inner-radius="innerRadius"
    :rotation-direction="rotationDirection"
  />
</template>
