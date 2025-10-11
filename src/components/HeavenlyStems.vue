<script setup lang="ts">
import { ref } from 'vue'
import CircleRing from './CircleRing.vue'

// 天干旋转角度（向右旋转，顺时针）
const heavenlyRotation = ref(0)

// 动态更新旋转角度
let animationId: number
const rotateHeavenlyStems = () => {
  heavenlyRotation.value = (heavenlyRotation.value + 0.05) % 360 // 每帧旋转0.5度
  animationId = requestAnimationFrame(rotateHeavenlyStems)
}

// 启动旋转动画
rotateHeavenlyStems()

// 十天干，每个36度，甲从0度开始
const heavenlyStems = [
  { label: '甲', color: '#FF6B6B', startAngle: 0, endAngle: 36 },      // 0-36度
  { label: '乙', color: '#4ECDC4', startAngle: 36, endAngle: 72 },     // 36-72度
  { label: '丙', color: '#45B7D1', startAngle: 72, endAngle: 108 },    // 72-108度
  { label: '丁', color: '#96CEB4', startAngle: 108, endAngle: 144 },   // 108-144度
  { label: '戊', color: '#FFEAA7', startAngle: 144, endAngle: 180 },   // 144-180度
  { label: '己', color: '#DDA0DD', startAngle: 180, endAngle: 216 },   // 180-216度
  { label: '庚', color: '#98D8C8', startAngle: 216, endAngle: 252 },   // 216-252度
  { label: '辛', color: '#F7DC6F', startAngle: 252, endAngle: 288 },   // 252-288度
  { label: '壬', color: '#BB8FCE', startAngle: 288, endAngle: 324 },   // 288-324度
  { label: '癸', color: '#85C1E2', startAngle: 324, endAngle: 360 }    // 324-360度
]
</script>

<template>
  <CircleRing
    :radius="120"
    :inner-radius="60"
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