<script setup lang="ts">
import { ref, computed } from 'vue'
import CircleRing from './CircleRing.vue'

interface Props {
  startDegree?: number  // 起始度数
}

const props = withDefaults(defineProps<Props>(), {
  startDegree: 0
})

// 地支旋转角度（向左旋转，逆时针）
const earthlyRotation = ref(0)

// 动态更新旋转角度
let animationId: number
const rotateEarthlyBranches = () => {
  earthlyRotation.value = (earthlyRotation.value - 0.3 + 360) % 360 // 每帧逆时针旋转0.3度
  animationId = requestAnimationFrame(rotateEarthlyBranches)
}

// 启动旋转动画
rotateEarthlyBranches()

// 计算总的旋转角度 = 起始度数 + 动画旋转
const totalRotation = computed(() => (props.startDegree + earthlyRotation.value) % 360)

// 十二地支，每个30度，子从345度开始
const earthlyBranches = [
  { label: '子', color: '#0D47A1', startAngle: 345, endAngle: 15 },    // 水，深蓝
  { label: '丑', color: '#795548', startAngle: 15, endAngle: 45 },      // 土，棕
  { label: '寅', color: '#2E7D32', startAngle: 45, endAngle: 75 },      // 木，绿
  { label: '卯', color: '#388E3C', startAngle: 75, endAngle: 105 },     // 木，绿
  { label: '辰', color: '#F57C00', startAngle: 105, endAngle: 135 },    // 土，橙黄
  { label: '巳', color: '#D32F2F', startAngle: 135, endAngle: 165 },    // 火，红
  { label: '午', color: '#C62828', startAngle: 165, endAngle: 195 },    // 火，深红
  { label: '未', color: '#EF6C00', startAngle: 195, endAngle: 225 },    // 土，橙
  { label: '申', color: '#FFEB3B', startAngle: 225, endAngle: 255 },    // 金，黄白
  { label: '酉', color: '#FFF176', startAngle: 255, endAngle: 285 },    // 金，浅黄
  { label: '戌', color: '#F9A825', startAngle: 285, endAngle: 315 },    // 土，淡黄
  { label: '亥', color: '#0288D1', startAngle: 315, endAngle: 345 }     // 水，天蓝
]
</script>

<template>
  <CircleRing
    :radius="195"
    :inner-radius="170"
    :items="earthlyBranches"
    :show-ticks="true"
    :tick-width="0.8"
    :show-circle="true"
    :circle-width="1"
    circle-color="#888888"
    tick-color="#666666"
    :label-position="0.5"
    :rotation="totalRotation"
  />
</template>