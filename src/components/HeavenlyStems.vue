<script setup lang="ts">
import { ref } from 'vue'
import CircleRing from './CircleRing.vue'

// 天干旋转角度（向右旋转，顺时针）
const heavenlyRotation = ref(0)

// 动态更新旋转角度
let animationId: number
const rotateHeavenlyStems = () => {
  heavenlyRotation.value = (heavenlyRotation.value + 0.001) % 360 // 每帧旋转0.5度
  animationId = requestAnimationFrame(rotateHeavenlyStems)
}

// 启动旋转动画
rotateHeavenlyStems()

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
    :radius="240"
    :inner-radius="190"
    :items="heavenlyStems"
    :show-ticks="true"
    :tick-width="0.6"
    :show-circle="true"
    :circle-width="1"
    circle-color="#888888"
    tick-color="#666666"
    :label-position="0.5"
    :rotation="heavenlyRotation"
  />
</template>