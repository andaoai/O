<script setup lang="ts">
import CircleRing from './base/CircleRing.vue'

// 八门组件内部起始度数设置
const startDegree = 0  // 八门起始度数

// 八门，每个45度，从0度开始按顺时针排列
const eightGates = [
  { label: '开', color: '#FF6B6B', startAngle: 0, endAngle: 45 },        // 开门，红色
  { label: '休', color: '#4ECDC4', startAngle: 45, endAngle: 90 },       // 休门，青色
  { label: '生', color: '#45B7D1', startAngle: 90, endAngle: 135 },       // 生门，蓝色
  { label: '伤', color: '#96CEB4', startAngle: 135, endAngle: 180 },      // 伤门，绿色
  { label: '杜', color: '#FFEAA7', startAngle: 180, endAngle: 225 },      // 杜门，黄色
  { label: '景', color: '#DDA0DD', startAngle: 225, endAngle: 270 },      // 景门，紫色
  { label: '死', color: '#708090', startAngle: 270, endAngle: 315 },      // 死门，灰色
  { label: '惊', color: '#FFB6C1', startAngle: 315, endAngle: 360 }       // 惊门，粉色
]
</script>

<template>
  <CircleRing
    :radius="220"
    :inner-radius="190"
    :items="eightGates"
    :show-ticks="true"
    :tick-width="0.8"
    :show-circle="true"
    :circle-width="1"
    circle-color="#888888"
    tick-color="#666666"
    :label-position="0.5"
    :enable-animation="false"
    :animation-speed="0.1"
    :start-degree="startDegree"
    font-size="14"
  />
</template>