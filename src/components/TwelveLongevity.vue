<script setup lang="ts">
import CircleRing from './base/CircleRing.vue'

// 十二长生组件内部起始度数设置
const startDegree = 0  // 十二长生起始度数

// 五组十二长生，每组60个格子（12个长生×5个组），每个格子6度
const longevityStates = []
const elementColors = [
  ['#FF6B6B', '#FF8A8A', '#FFA9A9'],  // 第一组 - 红色系
  ['#4ECDC4', '#6FE0DC', '#90E2DE'],  // 第二组 - 青色系
  ['#45B7D1', '#66C6DD', '#87D5E9'],  // 第三组 - 蓝色系
  ['#96CEB4', '#A7D9C5', '#B8E4D6'],  // 第四组 - 绿色系
  ['#FFEAA7', '#FFEDBB', '#FFF0CF']   // 第五组 - 黄色系
]

const longevityNames = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养']

// 生成5组×12个格子，每个格子6度
for (let group = 0; group < 5; group++) {
  for (let i = 0; i < 12; i++) {
    const startAngle = (group * 72) + (i * 6)  // 每组72度，每格6度
    const endAngle = startAngle + 6

    longevityStates.push({
      label: longevityNames[i]!,
      color: elementColors[group]![i % 3],
      startAngle: startAngle,
      endAngle: endAngle
    })
  }
}
</script>

<template>
  <CircleRing
    :radius="310"
    :inner-radius="280"
    :items="longevityStates"
    :show-ticks="true"
    :tick-width="0.6"
    :show-circle="true"
    :circle-width="1"
    circle-color="#888888"
    tick-color="#666666"
    :label-position="0.5"
    :enable-animation="false"
    :animation-speed="0.1"
    :start-degree="startDegree"
    font-size="13"
  />
</template>