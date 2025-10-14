<script setup lang="ts">
import CircleRing from './base/CircleRing.vue'

// 六十甲子组件内部起始度数设置
const startDegree = 0  // 六十甲子起始度数

// 六十甲子：由十天干和十二地支组合而成，共60个
const heavenlyStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const earthlyBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

// 定义六十甲子项的类型
interface SixtyJiaziItem {
  label: string
  color: string
  startAngle: number
  endAngle: number
  element: string
  stem: string
  branch: string
}

// 生成60个甲子组合，每个6度（360° ÷ 60 = 6°）
const sixtyJiazi: SixtyJiaziItem[] = []
const elementColors: string[][] = [
  // 木属性（甲乙）
  ['#2ECC71', '#27AE60', '#229954', '#1E8449', '#1ABC9C', '#16A085'],
  // 火属性（丙丁）
  ['#E74C3C', '#EC7063', '#E74C3C', '#CB4335', '#AF601A', '#935116'],
  // 土属性（戊己）
  ['#F39C12', '#F7DC6F', '#F8C471', '#F5B041', '#EB984E', '#DC7633'],
  // 金属性（庚辛）
  ['#F1C40F', '#F4D03F', '#F7DC6F', '#F9E79F', '#FCF3CF', '#FAE5D3'],
  // 水属性（壬癸）
  ['#3498DB', '#5DADE2', '#85C1E2', '#AED6F1', '#D6EAF8', '#EBF5FB']
]

const elements = ['木', '火', '土', '金', '水']

for (let i = 0; i < 60; i++) {
  const stemIndex = i % 10
  const branchIndex = i % 12
  const elementIndex = Math.floor(stemIndex / 2) // 0-4对应五行

  const startAngle = i * 6  // 每个甲子6度
  const endAngle = startAngle + 6

  // 根据五行属性选择颜色，添加类型安全检查
  const colorGroup = elementColors[elementIndex]
  if (!colorGroup) {
    throw new Error(`Color group not found for element index: ${elementIndex}`)
  }

  const colorIndex = i % colorGroup.length
  const color = colorGroup[colorIndex]
  if (!color) {
    throw new Error(`Color not found for index: ${colorIndex} in element: ${elementIndex}`)
  }

  const element = elements[elementIndex]
  if (!element) {
    throw new Error(`Element not found for index: ${elementIndex}`)
  }

  const stem = heavenlyStems[stemIndex]
  const branch = earthlyBranches[branchIndex]
  if (!stem || !branch) {
    throw new Error(`Stem or branch not found for indices: stem=${stemIndex}, branch=${branchIndex}`)
  }

  sixtyJiazi.push({
    label: stem + branch,
    color: color,
    startAngle: startAngle,
    endAngle: endAngle,
    element: element,
    stem: stem,
    branch: branch
  })
}
</script>

<template>
  <CircleRing
    :radius="380"
    :inner-radius="350"
    :items="sixtyJiazi"
    :show-ticks="true"
    :tick-width="0.5"
    :show-circle="true"
    :circle-width="1"
    circle-color="#888888"
    tick-color="#666666"
    :label-position="0.5"
    :enable-animation="false"
    :animation-speed="0"
    :start-degree="startDegree"
    font-size="11"
  />
</template>