<script setup lang="ts">
import CircleRing from './base/CircleRing.vue'

// 天干组件内部起始度数设置
const startDegree = 0  // 天干起始度数

// 十天干，每个36度，甲从0度开始
const heavenlyStems = [
  { label: '甲', color: '#2ECC71', startAngle: -18, endAngle: 18 },      // 木，绿色
  { label: '乙', color: '#28B463', startAngle: 18, endAngle: 54 },        // 木，深绿
  { label: '丙', color: '#E74C3C', startAngle: 54, endAngle: 90 },       // 火，红色
  { label: '丁', color: '#C0392B', startAngle: 90, endAngle: 126 },      // 火，深红
  { label: '戊', color: '#D35400', startAngle: 126, endAngle: 162 },     // 土，橙色
  { label: '己', color: '#F39C12', startAngle: 162, endAngle: 198 },     // 土，黄橙
  { label: '庚', color: '#F1C40F', startAngle: 198, endAngle: 234 },     // 金，金色/黄色
  { label: '辛', color: '#BDC3C7', startAngle: 234, endAngle: 270 },     // 金，银灰色
  { label: '壬', color: '#3498DB', startAngle: 270, endAngle: 306 },     // 水，蓝色
  { label: '癸', color: '#2980B9', startAngle: 306, endAngle: 342 }      // 水，深蓝
]
</script>

<template>
  <CircleRing
    :radius="340"
    :inner-radius="310"
    :items="heavenlyStems"
    :show-ticks="true"
    :tick-width="0.6"
    :show-circle="true"
    :circle-width="1"
    circle-color="#888888"
    tick-color="#666666"
    :label-position="0.5"
    :enable-animation="false"
    :animation-speed="0.5"
    :start-degree="startDegree"
  />
</template>