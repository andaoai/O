<script setup lang="ts">
import CircleRing from './CircleRing.vue'

// 十二地支，每个30度，子从345度开始
const earthlyBranches = [
  { label: '子', color: '#E74C3C', startAngle: 345, endAngle: 15 },    // 345-15度
  { label: '丑', color: '#E67E22', startAngle: 15, endAngle: 45 },      // 15-45度
  { label: '寅', color: '#F39C12', startAngle: 45, endAngle: 75 },      // 45-75度
  { label: '卯', color: '#27AE60', startAngle: 75, endAngle: 105 },     // 75-105度
  { label: '辰', color: '#2ECC71', startAngle: 105, endAngle: 135 },    // 105-135度
  { label: '巳', color: '#3498DB', startAngle: 135, endAngle: 165 },    // 135-165度
  { label: '午', color: '#9B59B6', startAngle: 165, endAngle: 195 },    // 165-195度
  { label: '未', color: '#E91E63', startAngle: 195, endAngle: 225 },    // 195-225度
  { label: '申', color: '#00BCD4', startAngle: 225, endAngle: 255 },    // 225-255度
  { label: '酉', color: '#795548', startAngle: 255, endAngle: 285 },    // 255-285度
  { label: '戌', color: '#607D8B', startAngle: 285, endAngle: 315 },    // 285-315度
  { label: '亥', color: '#9E9E9E', startAngle: 315, endAngle: 345 }     // 315-345度
]
</script>

<template>
  <CircleRing
    :radius="200"
    :inner-radius="140"
    :items="earthlyBranches"
    :show-ticks="true"
    :tick-width="0.8"
    :show-circle="true"
    :circle-width="1"
    circle-color="#888888"
    tick-color="#666666"
    label-position="0.5"
  />
</template>