<script setup lang="ts">
/**
 * 行星 SVG 渲染组件
 *
 * 使用内联 SVG 数据渲染七曜天体，提供更丰富的视觉效果
 * 支持：日/月/水/金/火/木/土/地
 *
 * 每个天体都有独特的视觉特征：
 *   - 太阳：金色渐变 + 光晕 + 表面纹理
 *   - 月亮：银白渐变 + 月海暗斑
 *   - 地球：蓝洋绿陆 + 云层
 *   - 水星：深灰陨石坑
 *   - 金星：米金云层
 *   - 火星：赤红沙地
 *   - 木星：条纹带 + 大红斑
 *   - 土星：土黄 + 光环
 */
import { computed } from 'vue'
import type { LuminaryKey } from '@/data/rings/types'

type PlanetSvgKey = LuminaryKey | 'earth'

interface Props {
  /** 天体类型 */
  kind: PlanetSvgKey
  /** 中心坐标 */
  x: number
  y: number
  /** 缩放比例 */
  scale?: number
  /** 光晕（可选，叠加在 SVG 外围） */
  halos?: { radius: number; opacity: number }[]
  /** 光晕颜色 */
  haloColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  scale: 1,
  halos: () => [],
  haloColor: ''
})

// SVG 内联数据，避免异步加载问题
const svgData: Record<PlanetSvgKey, { path: string; color: string; baseSize: number }> = {
  earth: { color: '#3498db', baseSize: 22, path: '' },
  sun: {
    color: '#ffd700',
    baseSize: 24,
    path: ''
  },
  moon: {
    color: '#e8e8f0',
    baseSize: 22,
    path: ''
  },
  mercury: {
    color: '#3498db',
    baseSize: 22,
    path: ''
  },
  venus: {
    color: '#f5b041',
    baseSize: 24,
    path: ''
  },
  mars: {
    color: '#e74c3c',
    baseSize: 23,
    path: ''
  },
  jupiter: {
    color: '#4aaa7a',
    baseSize: 25,
    path: ''
  },
  saturn: {
    color: '#f39c12',
    baseSize: 22,
    path: ''
  }
}

const actualSize = computed(() => svgData[props.kind].baseSize * props.scale)
const actualColor = computed(() => props.haloColor || svgData[props.kind].color)
</script>

<template>
  <g class="planet-svg" :transform="`translate(${x}, ${y})`">
    <!-- 光晕层 -->
    <circle
      v-for="(h, i) in halos"
      :key="`halo-${i}`"
      cx="0"
      cy="0"
      :r="h.radius"
      :fill="actualColor"
      :opacity="h.opacity"
    />

    <!-- 太阳 -->
    <g v-if="kind === 'sun'" :transform="`scale(${scale})`">
      <circle cx="0" cy="0" r="32" fill="#ffd700" opacity="0.15"/>
      <circle cx="0" cy="0" r="28" fill="#ffd700" opacity="0.2"/>
      <defs>
        <radialGradient id="sun-grad" cx="30%" cy="30%">
          <stop offset="0%" stop-color="#fff5d0"/>
          <stop offset="50%" stop-color="#ffd700"/>
          <stop offset="100%" stop-color="#ff8c00"/>
        </radialGradient>
      </defs>
      <circle cx="0" cy="0" r="24" fill="url(#sun-grad)"/>
      <ellipse cx="-6" cy="-8" rx="4" ry="3" fill="#fff" opacity="0.3"/>
      <ellipse cx="5" cy="4" rx="3" ry="2" fill="#fff5d0" opacity="0.4"/>
      <circle cx="-3" cy="6" r="2" fill="#ffb800" opacity="0.3"/>
    </g>

    <!-- 月亮 -->
    <g v-else-if="kind === 'moon'" :transform="`scale(${scale})`">
      <defs>
        <radialGradient id="moon-grad" cx="30%" cy="30%">
          <stop offset="0%" stop-color="#f8f8ff"/>
          <stop offset="50%" stop-color="#e8e8f0"/>
          <stop offset="100%" stop-color="#a0a0b0"/>
        </radialGradient>
      </defs>
      <circle cx="0" cy="0" r="22" fill="url(#moon-grad)"/>
      <ellipse cx="-6" cy="-4" rx="5" ry="4" fill="#9090a0" opacity="0.4"/>
      <ellipse cx="5" cy="6" rx="4" ry="3" fill="#888898" opacity="0.35"/>
      <ellipse cx="-4" cy="8" rx="3" ry="2.5" fill="#9090a0" opacity="0.3"/>
      <circle cx="6" cy="-6" r="2.5" fill="#a0a0b0" opacity="0.3"/>
      <ellipse cx="-7" cy="-9" rx="3.5" ry="2.5" fill="#fff" opacity="0.25"/>
    </g>

    <!-- 水星 -->
    <g v-else-if="kind === 'mercury'" :transform="`scale(${scale})`">
      <circle cx="0" cy="0" r="22" fill="#0a1628" stroke="#3498db" stroke-width="2"/>
      <circle cx="-8" cy="-6" r="2" fill="#3498db" opacity="0.5"/>
      <circle cx="6" cy="8" r="1.5" fill="#5dade2" opacity="0.4"/>
    </g>

    <!-- 金星 -->
    <g v-else-if="kind === 'venus'" :transform="`scale(${scale})`">
      <circle cx="0" cy="0" r="24" fill="#f4e4c1" stroke="#f5b041" stroke-width="2"/>
      <circle cx="-7" cy="-8" r="3" fill="#fff" opacity="0.6"/>
      <circle cx="8" cy="5" r="2" fill="#fad7a0" opacity="0.5"/>
    </g>

    <!-- 火星 -->
    <g v-else-if="kind === 'mars'" :transform="`scale(${scale})`">
      <circle cx="0" cy="0" r="23" fill="#641e16" stroke="#e74c3c" stroke-width="2"/>
      <circle cx="-6" cy="-7" r="3" fill="#f1948a" opacity="0.5"/>
      <circle cx="7" cy="4" r="2" fill="#c0392b" opacity="0.4"/>
    </g>

    <!-- 木星 -->
    <g v-else-if="kind === 'jupiter'" :transform="`scale(${scale})`">
      <circle cx="0" cy="0" r="25" fill="#2a6a52" stroke="#4aaa7a" stroke-width="2"/>
      <ellipse cx="0" cy="-16" rx="22" ry="2" fill="#5ab88a" opacity="0.5"/>
      <ellipse cx="0" cy="-10" rx="23" ry="2.5" fill="#3a7a62" opacity="0.55"/>
      <ellipse cx="0" cy="-3" rx="22" ry="2.5" fill="#4a9a72" opacity="0.5"/>
      <ellipse cx="0" cy="4" rx="23" ry="2.5" fill="#2a6a52" opacity="0.55"/>
      <ellipse cx="0" cy="11" rx="22" ry="2.5" fill="#4a8a6a" opacity="0.5"/>
      <ellipse cx="0" cy="17" rx="20" ry="2" fill="#3a7a62" opacity="0.45"/>
      <ellipse cx="10" cy="2" rx="4.5" ry="2.8" fill="#b05040" opacity="0.7"/>
      <ellipse cx="10" cy="1.5" rx="3" ry="1.8" fill="#d07060" opacity="0.5"/>
    </g>

    <!-- 土星 -->
    <g v-else-if="kind === 'saturn'" :transform="`scale(${scale})`">
      <circle cx="0" cy="0" r="22" fill="#5d4e37" stroke="#f39c12" stroke-width="2"/>
      <ellipse cx="0" cy="0" rx="32" ry="7" fill="none" stroke="#f39c12" stroke-width="2" opacity="0.6"/>
      <ellipse cx="0" cy="0" rx="29" ry="5" fill="none" stroke="#e67e22" stroke-width="1" opacity="0.4"/>
    </g>

    <!-- 地球 -->
    <g v-else-if="kind === 'earth'" :transform="`scale(${scale})`">
      <circle cx="0" cy="0" r="22" fill="#1a5276" stroke="#3498db" stroke-width="2"/>
      <!-- 陆地 -->
      <ellipse cx="-4" cy="-3" rx="5" ry="4" fill="#27ae60" opacity="0.7"/>
      <ellipse cx="6" cy="5" rx="4" ry="3" fill="#27ae60" opacity="0.6"/>
      <ellipse cx="-7" cy="6" rx="3" ry="2.5" fill="#2ecc71" opacity="0.5"/>
      <!-- 云层 -->
      <ellipse cx="3" cy="-8" rx="4" ry="2" fill="#fff" opacity="0.25"/>
      <ellipse cx="-5" cy="3" rx="3" ry="1.5" fill="#fff" opacity="0.2"/>
    </g>
  </g>
</template>

<style scoped>
.planet-svg {
  pointer-events: none;
}
</style>
