<script setup lang="ts">
import CircleRing from './base/CircleRing.vue'

// 地支组件内部起始度数设置
const startDegree = 0  // 地支起始度数

// 十天干+空亡，每个30度，甲从345度开始
const earthlyBranches = [
  { label: '甲', color: '#2E7D32', startAngle: 345, endAngle: 15 },    // 阳木，深绿
  { label: '乙', color: '#66BB6A', startAngle: 15, endAngle: 45 },      // 阴木，浅绿
  { label: '丙', color: '#FF9800', startAngle: 45, endAngle: 75 },      // 阳火，橙色
  { label: '丁', color: '#FF5722', startAngle: 75, endAngle: 105 },     // 阴火，深橙
  { label: '戊', color: '#795548', startAngle: 105, endAngle: 135 },    // 阳土，棕色
  { label: '己', color: '#8D6E63', startAngle: 135, endAngle: 165 },    // 阴土，浅棕
  { label: '庚', color: '#FFEB3B', startAngle: 165, endAngle: 195 },    // 阳金，金色
  { label: '辛', color: '#FFC107', startAngle: 195, endAngle: 225 },    // 阴金，淡金
  { label: '壬', color: '#03A9F4', startAngle: 225, endAngle: 255 },    // 阳水，蓝色
  { label: '癸', color: '#00BCD4', startAngle: 255, endAngle: 285 },    // 阴水，青蓝
  { label: '空', color: '#9E9E9E', startAngle: 285, endAngle: 315 },    // 空亡，灰色
  { label: '亡', color: '#607D8B', startAngle: 315, endAngle: 345 }     // 空亡，蓝灰
]
</script>

<template>
  <CircleRing
    :radius="310"
    :inner-radius="280"
    :items="earthlyBranches"
    :show-ticks="true"
    :tick-width="0.8"
    :show-circle="true"
    :circle-width="1"
    circle-color="#888888"
    tick-color="#666666"
    :label-position="0.5"
    :enable-animation="false"
    :animation-speed="-0.3"
    :start-degree="startDegree"
  />
</template>