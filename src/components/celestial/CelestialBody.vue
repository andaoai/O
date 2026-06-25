<script setup lang="ts">
import PolarCanvas from '../base/PolarCanvas.vue'
import { radialTextRotation } from '@/utils/geometry'

/**
 * 通用单天体组件
 *
 * 把太阳、月亮、五星统一抽象为"一个在黄道上的发光体"：
 * 光晕 + 本体 + 单字符号（+ 可选黄纬偏移指示线）。
 * 位置由黄经 longitude 决定，黄纬 latitude 产生垂直于黄道面的偏移。
 *
 * 自带 PolarCanvas，可单独丢进任意 svg 使用。
 */
interface Props {
  /** 黄经（度） */
  longitude: number
  /** 黄纬（度，默认 0 即贴合黄道） */
  latitude?: number
  /** 黄道基准半径 */
  radius?: number
  /** 单字符号（日/月/水/金/火/木/土） */
  symbol?: string
  /** 颜色 */
  color?: string
  /** 本体半径 */
  size?: number
  /** 符号字号（缺省按 size 估算） */
  symbolFontSize?: number
  /** 黄纬偏移缩放因子（像素/sin纬） */
  latScale?: number
  /** 轨道环带内边界（提供后，天体含光晕被收在带内，不外溢） */
  clampInner?: number
  /** 轨道环带外边界 */
  clampOuter?: number
  /** 是否绘制黄纬偏移指示线（从黄道点指向天体实际点） */
  showLatLine?: boolean
  /** 符号文字颜色 */
  symbolColor?: string
  /** 旋转方向 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  latitude: 0,
  radius: 200,
  symbol: '',
  color: '#ffdd00',
  size: 14,
  symbolFontSize: 0,
  latScale: 0,
  clampInner: 0,
  clampOuter: 0,
  showLatLine: false,
  symbolColor: '#333',
  rotationDirection: 'clockwise'
})

/**
 * 黄道基础点坐标（仅黄经，忽略黄纬）
 */
const baseCoordinates = (polarToCartesian: Function) => {
  return polarToCartesian(props.longitude, props.radius, 0, 0)
}

/**
 * 天体实际坐标（含黄纬偏移）
 *
 * 沿"从中心向外"的径向方向，按 sin(黄纬) * latScale 偏移。
 * 若提供了 clampInner/clampOuter，则把天体（含光晕外缘）约束在轨道环带内，
 * 使其不侵入相邻环带（如二十八宿环）。
 */
const bodyCoordinates = (polarToCartesian: Function) => {
  const base = baseCoordinates(polarToCartesian)
  const perpX = base.x / props.radius
  const perpY = base.y / props.radius

  // 黄纬偏移后的目标半径
  let targetRadius = props.radius
  if (props.latScale && props.latitude) {
    targetRadius += Math.sin((props.latitude * Math.PI) / 180) * props.latScale
  }

  // 约束到轨道环带内：留出光晕外缘（size + 10）余量，避免边缘溢出
  if (props.clampInner && props.clampOuter) {
    const halo = props.size + 10
    const lo = props.clampInner + halo
    const hi = props.clampOuter - halo
    if (lo <= hi) {
      targetRadius = Math.min(Math.max(targetRadius, lo), hi)
    } else {
      // 环带太窄容不下光晕，退回带中线
      targetRadius = (props.clampInner + props.clampOuter) / 2
    }
  }

  const offset = targetRadius - props.radius
  return {
    x: base.x + perpX * offset,
    y: base.y + perpY * offset
  }
}

/** 符号旋转角，使文字始终正立（统一走 geometry，按 longitude 作径向角） */
const symbolRotation = (cx: number, cy: number): string => {
  const angle = radialTextRotation(props.longitude, props.rotationDirection)
  return `rotate(${angle}, ${cx}, ${cy})`
}
</script>

<template>
  <PolarCanvas
    :enable-animation="false"
    :rotation-direction="rotationDirection"
    :center-x="0"
    :center-y="0"
  >
    <template #default="slotProps">
      <g class="celestial-body">
        <!-- 黄纬偏移指示线 -->
        <line
          v-if="showLatLine && Math.abs(latitude) > 0.5"
          :x1="slotProps.centerX + baseCoordinates(slotProps.polarToCartesian).x"
          :y1="slotProps.centerY + baseCoordinates(slotProps.polarToCartesian).y"
          :x2="slotProps.centerX + bodyCoordinates(slotProps.polarToCartesian).x"
          :y2="slotProps.centerY + bodyCoordinates(slotProps.polarToCartesian).y"
          :stroke="color"
          stroke-width="1"
          opacity="0.3"
          stroke-dasharray="2,2"
        />

        <!-- 光晕 -->
        <circle
          :cx="slotProps.centerX + bodyCoordinates(slotProps.polarToCartesian).x"
          :cy="slotProps.centerY + bodyCoordinates(slotProps.polarToCartesian).y"
          :r="size + 10"
          :fill="color"
          opacity="0.2"
        />
        <circle
          :cx="slotProps.centerX + bodyCoordinates(slotProps.polarToCartesian).x"
          :cy="slotProps.centerY + bodyCoordinates(slotProps.polarToCartesian).y"
          :r="size + 5"
          :fill="color"
          opacity="0.4"
        />

        <!-- 本体 -->
        <circle
          :cx="slotProps.centerX + bodyCoordinates(slotProps.polarToCartesian).x"
          :cy="slotProps.centerY + bodyCoordinates(slotProps.polarToCartesian).y"
          :r="size"
          :fill="color"
        />

        <!-- 符号 -->
        <text
          v-if="symbol"
          :x="slotProps.centerX + bodyCoordinates(slotProps.polarToCartesian).x"
          :y="slotProps.centerY + bodyCoordinates(slotProps.polarToCartesian).y"
          :fill="symbolColor"
          :font-size="symbolFontSize || Math.max(10, size * 0.8)"
          font-weight="bold"
          text-anchor="middle"
          dominant-baseline="middle"
          :transform="
            symbolRotation(
              slotProps.centerX + bodyCoordinates(slotProps.polarToCartesian).x,
              slotProps.centerY + bodyCoordinates(slotProps.polarToCartesian).y
            )
          "
        >
          {{ symbol }}
        </text>
      </g>
    </template>
  </PolarCanvas>
</template>

<style scoped>
.celestial-body {
  transition: all 0.3s ease;
  cursor: pointer;
}

.celestial-body:hover {
  filter: brightness(1.3) drop-shadow(0 0 8px currentColor);
}
</style>
