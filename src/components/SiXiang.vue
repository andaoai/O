<script setup lang="ts">
import CircleRing from './base/CircleRing.vue'

// 四象组件内部起始度数设置
const startDegree = 0  // 四象起始度数

// 四象，每个90度，按照传统方位分布
const fourSymbols = [
  {
    label: '青龙',
    color: '#00C853',      // 青绿色
    startAngle: 315,      // 东方（左）
    endAngle: 45,
    element: '木',
    season: '春'
  },
  {
    label: '朱雀',
    color: '#FF5722',      // 朱红色
    startAngle: 45,        // 南方（上）
    endAngle: 135,
    element: '火',
    season: '夏'
  },
  {
    label: '白虎',
    color: '#F5F5F5',      // 白色
    startAngle: 135,       // 西方（右）
    endAngle: 225,
    element: '金',
    season: '秋'
  },
  {
    label: '玄武',
    color: '#1565C0',      // 玄蓝色
    startAngle: 225,      // 北方（下）
    endAngle: 315,
    element: '水',
    season: '冬'
  }
]
</script>

<template>
  <CircleRing
    :radius="200"
    :inner-radius="230"
    :items="fourSymbols"
    :show-ticks="true"
    :tick-width="1"
    :show-circle="true"
    :circle-width="2"
    circle-color="#888888"
    tick-color="#666666"
    :label-position="0.5"
    :enable-animation="false"
    :animation-speed="0"
    :start-degree="startDegree"
    font-size="16"
  />
</template>