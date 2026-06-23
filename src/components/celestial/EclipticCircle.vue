<script setup lang="ts">
import PolarCanvas from '../base/PolarCanvas.vue'

/**
 * 黄道圆环组件
 *
 * 画一圈黄道圆 + 春分点（0 度）标记。自带 PolarCanvas，可单独使用。
 */
interface Props {
  /** 黄道半径 */
  radius?: number
  /** 圆环颜色 */
  color?: string
  /** 是否显示春分点标记 */
  showVernalEquinox?: boolean
  /** 旋转方向 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

withDefaults(defineProps<Props>(), {
  radius: 200,
  color: '#ffdd00',
  showVernalEquinox: true,
  rotationDirection: 'clockwise'
})
</script>

<template>
  <PolarCanvas
    :enable-animation="false"
    :rotation-direction="rotationDirection"
    :center-x="0"
    :center-y="0"
  >
    <template #default="slotProps">
      <g class="ecliptic-circle">
        <!-- 黄道圆圈 -->
        <circle
          :cx="slotProps.centerX"
          :cy="slotProps.centerY"
          :r="radius"
          fill="none"
          :stroke="color"
          stroke-width="2"
          opacity="0.8"
        />

        <!-- 春分点标记（0 度） -->
        <g v-if="showVernalEquinox" class="vernal-equinox">
          <line
            :x1="slotProps.centerX + radius * 0.9"
            :y1="slotProps.centerY"
            :x2="slotProps.centerX + radius * 1.1"
            :y2="slotProps.centerY"
            stroke="#00ff88"
            stroke-width="2"
            opacity="0.8"
          />
        </g>
      </g>
    </template>
  </PolarCanvas>
</template>

<style scoped>
.ecliptic-circle {
  transition: all 0.3s ease;
}

.vernal-equinox {
  transition: all 0.3s ease;
}

.vernal-equinox:hover {
  filter: brightness(1.3);
}
</style>
