<script setup lang="ts">
import CircleRing from './base/CircleRing.vue'

/**
 * 六十甲子纳音五行
 *
 * 纳音与六十甲子同源同转：每两个相邻甲子（如甲子+乙丑）共配一个纳音，
 * 共 30 个，每个跨 12 度（六十甲子每格 6 度 × 2）。起点、旋转方向与
 * 六十甲子一致（由 RingStack 统一注入 rotationDirection 与 startDegree）。
 */

// 布局相关 props（与六十甲子保持一致的接口，便于对齐）
interface Props {
  radius?: number
  innerRadius?: number
  startDegree?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

withDefaults(defineProps<Props>(), {
  radius: 350,
  innerRadius: 322,
  startDegree: 0,
  rotationDirection: 'clockwise'
})

// 三十纳音，按六十甲子顺序排列（甲子乙丑 → 壬戌癸亥）
const nayinNames = [
  '海中金', '炉中火', '大林木', '路旁土', '剑锋金',
  '山头火', '涧下水', '城头土', '白蜡金', '杨柳木',
  '泉中水', '屋上土', '霹雳火', '松柏木', '长流水',
  '沙中金', '山下火', '平地木', '壁上土', '金箔金',
  '覆灯火', '天河水', '大驿土', '钗钏金', '桑柘木',
  '大溪水', '沙中土', '天上火', '石榴木', '大海水'
]

// 五行配色，与六十甲子五行色系保持视觉同源
const elementColor: Record<string, string> = {
  金: '#F1C40F',
  木: '#2ECC71',
  水: '#3498DB',
  火: '#E74C3C',
  土: '#D35400'
}

interface NayinItem {
  label: string
  color: string
  startAngle: number
  endAngle: number
  element: string
}

// 每个纳音跨 12 度（对应两个甲子）
const nayinList: NayinItem[] = nayinNames.map((name, i) => {
  const element = name[name.length - 1]!  // 末字为五行
  const color = elementColor[element]
  if (!color) {
    throw new Error(`Unknown element "${element}" in nayin "${name}"`)
  }
  return {
    label: name,
    color,
    startAngle: i * 12,
    endAngle: i * 12 + 12,
    element
  }
})
</script>

<template>
  <CircleRing
    :radius="radius"
    :inner-radius="innerRadius"
    :items="nayinList"
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
    :rotation-direction="rotationDirection"
    font-size="9"
  />
</template>
