<script setup lang="ts">
import { computed } from 'vue'
import CircleRing from './base/CircleRing.vue'

/**
 * 二十四节气组件
 *
 * 显示中国传统的二十四节气，每个节气占15度（360/24=15度）。
 * 二十四节气是根据太阳在黄道上的位置来划分的，
 * 反映了季节变化和农耕节奏。
 *
 * 节气顺序：
 * 1. 立春 (Beginning of Spring)
 * 2. 雨水 (Rain Water)
 * 3. 惊蛰 (Awakening of Insects)
 * 4. 春分 (Spring Equinox)
 * 5. 清明 (Clear and Bright)
 * 6. 谷雨 (Grain Rain)
 * 7. 立夏 (Beginning of Summer)
 * 8. 小满 (Lesser Fullness of Grain)
 * 9. 芒种 (Grain in Ear)
 * 10. 夏至 (Summer Solstice)
 * 11. 小暑 (Lesser Heat)
 * 12. 大暑 (Greater Heat)
 * 13. 立秋 (Beginning of Autumn)
 * 14. 处暑 (End of Heat)
 * 15. 白露 (White Dew)
 * 16. 秋分 (Autumn Equinox)
 * 17. 寒露 (Cold Dew)
 * 18. 霜降 (Frost's Descent)
 * 19. 立冬 (Beginning of Winter)
 * 20. 小雪 (Lesser Snow)
 * 21. 大雪 (Greater Snow)
 * 22. 冬至 (Winter Solstice)
 * 23. 小寒 (Lesser Cold)
 * 24. 大寒 (Greater Cold)
 */

/**
 * 组件属性接口定义
 */
interface Props {
  /** 圆环外半径（像素） */
  radius?: number
  /** 圆环内半径（像素） */
  innerRadius?: number
  /** 起始度数偏移（0-360度），默认从立春开始 */
  startDegree?: number
  /** 是否显示标签文字 */
  showLabels?: boolean
  /** 是否显示扇形区域 */
  showSectors?: boolean
  /** 扇形透明度 */
  sectorOpacity?: number
  /** 旋转方向 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
  /** 整体旋转角度 */
  rotation?: number
  /** 是否启用动画 */
  enableAnimation?: boolean
  /** 动画速度 */
  animationSpeed?: number
}

/**
 * 组件默认属性值
 */
const props = withDefaults(defineProps<Props>(), {
  radius: 400,              // 适合作为外层圆环
  innerRadius: 420,         // 形成适中的环宽
  startDegree: -7.5 - 45,          // 立春在15度位置
  showLabels: true,
  showSectors: true,
  sectorOpacity: 0.2,
  rotationDirection: 'clockwise',
  rotation: 0,
  enableAnimation: false,
  animationSpeed: 0.5
})

/**
 * 二十四节气数据
 * 每个节气包含名称和对应的季节色彩
 */
const solarTerms = computed(() => [
  { label: '立春' },
  { label: '雨水' },
  { label: '惊蛰' },
  { label: '春分' },
  { label: '清明' },
  { label: '谷雨' },
  { label: '立夏' },
  { label: '小满' },
  { label: '芒种' },
  { label: '夏至' },
  { label: '小暑' },
  { label: '大暑' },
  { label: '立秋' },
  { label: '处暑' },
  { label: '白露' },
  { label: '秋分' },
  { label: '寒露' },
  { label: '霜降' },
  { label: '立冬' },
  { label: '小雪' },
  { label: '大雪' },
  { label: '冬至' },
  { label: '小寒' },
  { label: '大寒' }
])

/**
 * 计算每个节气的角度范围
 * 二十四节气平均分配360度，每个占15度
 */
const angleStep = computed(() => 360 / solarTerms.value.length)

/**
 * 生成带自定义角度的项目数据
 * 每个节气占据15度
 */
const ringItems = computed(() =>
  solarTerms.value.map((term, index) => ({
    label: term.label,
    startAngle: index * angleStep.value,
    endAngle: (index + 1) * angleStep.value,
    fontSize: 12
  }))
)
</script>

<template>
  <CircleRing
    :radius="radius"
    :inner-radius="innerRadius"
    :items="ringItems"
    :show-labels="showLabels"
    :show-sectors="showSectors"
    :show-ticks="true"
    :tick-length="8"
    :tick-width="0.5"
    :tick-color="'#888888'"
    :show-circle="true"
    :circle-width="0.5"
    :circle-color="'#666666'"
    :start-degree="startDegree"
    :rotation="rotation"
    :rotation-direction="rotationDirection"
    :enable-animation="enableAnimation"
    :animation-speed="animationSpeed"
    :label-position="0.5"
    :label-color="'white'"
  />
</template>

<style scoped>
/* 二十四节气组件样式 */
</style>