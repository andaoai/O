<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import EclipticCircle from './celestial/EclipticCircle.vue'
import CelestialBody from './celestial/CelestialBody.vue'
import LunarOrbit from './celestial/LunarOrbit.vue'
import {
  PLANETS_CONFIG,
  sunLongitude,
  planetPosition,
  moonPosition,
  type PlanetKey
} from '@/utils/celestial'

/**
 * 太阳黄道编排层
 *
 * ⚠️ 时间驱动架构：接受 time ref，内部统一使用 unref()
 *
 * 把黄道圆、太阳、五星、月亮、白道编排在一起。位置计算全部走 utils/celestial，
 * 渲染交给 celestial/ 下职责单一的子组件。本组件只负责"放什么、放哪"。
 *
 * 保留原有 props 接口，向后兼容 AstronomyView 的调用。
 */
interface Props {
  /** 黄道半径 */
  radius?: number
  /** 观测时间（支持 ref 或 plain value） */
  time?: MaybeRef<Date>
  /** 整体旋转角度（透传，当前未使用动画） */
  rotation?: number
  /** 是否启用动画（保留以兼容旧调用，子组件均不开动画） */
  enableAnimation?: boolean
  /** 动画速度（保留以兼容旧调用） */
  animationSpeed?: number
  /** 是否显示太阳文字标签（保留以兼容旧调用） */
  showSunLabel?: boolean
  /** 是否显示五星 */
  showPlanets?: boolean
  /** 是否显示月亮 */
  showMoon?: boolean
  /** 是否显示白道 */
  showWhiteWay?: boolean
  /** 是否显示轨道交点 */
  showOrbitalNodes?: boolean
  /** 是否显示黄道圆与春分点标记 */
  showEcliptic?: boolean
  /** 七曜轨道环带内边界（提供后天体被收在带内，并绘制边界圆，不侵入相邻环） */
  bandInner?: number
  /** 七曜轨道环带外边界 */
  bandOuter?: number
  /** 旋转方向 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200,
  enableAnimation: false,
  animationSpeed: 0.5,
  rotation: 0,
  showSunLabel: true,
  showPlanets: true,
  showMoon: true,
  showWhiteWay: true,
  showOrbitalNodes: true,
  showEcliptic: true,
  bandInner: 0,
  bandOuter: 0,
  rotationDirection: 'clockwise'
})

/** ⚠️ 时间驱动统一范式：确保 time 始终是响应式的 */
const timeRef = computed(() => unref(props.time) ?? new Date())

/** 是否启用环带约束（内外边界都提供时） */
const hasBand = computed(() => props.bandInner > 0 && props.bandOuter > 0)

/** 当前时间 */
const currentTime = timeRef

/** 太阳黄经 */
const sunLon = computed(() => sunLongitude(currentTime.value))

/** 五星位置（按配置顺序） */
const planets = computed(() =>
  (Object.keys(PLANETS_CONFIG) as PlanetKey[]).map((key) => {
    const config = PLANETS_CONFIG[key]
    const pos = planetPosition(currentTime.value, key)
    return {
      key,
      longitude: pos.longitude,
      latitude: pos.latitude,
      symbol: config.symbol,
      color: config.color,
      size: config.size
    }
  })
)

/** 月亮位置 */
const moon = computed(() => moonPosition(currentTime.value))
</script>

<template>
  <g class="solar-ecliptic">
    <!-- 七曜轨道环带边界（提供 band 时绘制，天体收于其间不外溢） -->
    <template v-if="hasBand">
      <circle cx="0" cy="0" :r="bandInner" fill="none" stroke="#555" stroke-width="1" opacity="0.5" />
      <circle cx="0" cy="0" :r="bandOuter" fill="none" stroke="#555" stroke-width="1" opacity="0.5" />
    </template>

    <!-- 黄道圆 + 春分点 -->
    <EclipticCircle v-if="showEcliptic" :radius="radius" :rotation-direction="rotationDirection" />

    <!-- 白道（月球轨道） -->
    <LunarOrbit
      v-if="showWhiteWay"
      :radius="radius"
      :time="currentTime"
      :show-orbital-nodes="showOrbitalNodes"
      :rotation-direction="rotationDirection"
    />

    <!-- 太阳 -->
    <CelestialBody
      :longitude="sunLon"
      :radius="radius"
      symbol="日"
      color="#ffdd00"
      :size="20"
      :symbol-font-size="14"
      :clamp-inner="bandInner"
      :clamp-outer="bandOuter"
      :rotation-direction="rotationDirection"
    />

    <!-- 月亮 -->
    <CelestialBody
      v-if="showMoon"
      :longitude="moon.longitude"
      :latitude="moon.latitude"
      :radius="radius"
      symbol="月"
      color="#c0c0c0"
      :size="12"
      :symbol-font-size="12"
      :lat-scale="300"
      :clamp-inner="bandInner"
      :clamp-outer="bandOuter"
      :rotation-direction="rotationDirection"
    />

    <!-- 五星 -->
    <template v-if="showPlanets">
      <CelestialBody
        v-for="planet in planets"
        :key="planet.key"
        :longitude="planet.longitude"
        :latitude="planet.latitude"
        :radius="radius"
        :symbol="planet.symbol"
        :color="planet.color"
        :size="planet.size"
        :symbol-font-size="11"
        symbol-color="#fff"
        :lat-scale="200"
        :clamp-inner="bandInner"
        :clamp-outer="bandOuter"
        :show-lat-line="true"
        :rotation-direction="rotationDirection"
      />
    </template>
  </g>
</template>

<style scoped>
.solar-ecliptic {
  transform-origin: center;
  transition: all 0.3s ease;
}
</style>
