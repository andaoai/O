<script setup lang="ts">
import CircleRing from './CircleRing.vue'

interface Props {
  startDegree?: number  // 起始度数
}

const props = withDefaults(defineProps<Props>(), {
  startDegree: 0
})

// 28星宿，分为4个方位（青龙、白虎、朱雀、玄武），每个7个星宿
// 每个星宿约12.86度 (360/28)
// 东方青龙七宿：角、亢、氐、房、心、尾、箕
// 西方白虎七宿：奎、娄、胃、昴、毕、觜、参
// 南方朱雀七宿：井、鬼、柳、星、张、翼、轸
// 北方玄武七宿：斗、牛、女、虚、危、室、壁

const twentyEightConstellations = [
  // 东方青龙七宿 (0-90度)
  { label: '角', color: '#2ECC71', startAngle: 0, endAngle: 12.86 },
  { label: '亢', color: '#27AE60', startAngle: 12.86, endAngle: 25.72 },
  { label: '氐', color: '#229954', startAngle: 25.72, endAngle: 38.58 },
  { label: '房', color: '#1D8348', startAngle: 38.58, endAngle: 51.44 },
  { label: '心', color: '#196F3D', startAngle: 51.44, endAngle: 64.3 },
  { label: '尾', color: '#145A32', startAngle: 64.3, endAngle: 77.16 },
  { label: '箕', color: '#0E6251', startAngle: 77.16, endAngle: 90 },

  // 北方玄武七宿 (90-180度)
  { label: '斗', color: '#5DADE2', startAngle: 90, endAngle: 102.86 },
  { label: '牛', color: '#3498DB', startAngle: 102.86, endAngle: 115.72 },
  { label: '女', color: '#2874A6', startAngle: 115.72, endAngle: 128.58 },
  { label: '虚', color: '#1B4F72', startAngle: 128.58, endAngle: 141.44 },
  { label: '危', color: '#154360', startAngle: 141.44, endAngle: 154.3 },
  { label: '室', color: '#0B5345', startAngle: 154.3, endAngle: 167.16 },
  { label: '壁', color: '#0B5345', startAngle: 167.16, endAngle: 180 },

  // 西方白虎七宿 (180-270度)
  { label: '奎', color: '#D4AF37', startAngle: 180, endAngle: 192.86 },  // 更改为金色
  { label: '娄', color: '#BCC6CC', startAngle: 192.86, endAngle: 205.72 }, // 更改为银色
  { label: '胃', color: '#AEB6BF', startAngle: 205.72, endAngle: 218.58 }, // 更改为浅灰色
  { label: '昴', color: '#829AE3', startAngle: 218.58, endAngle: 231.44 }, // 更改以增加色彩变化
  { label: '毕', color: '#566573', startAngle: 231.44, endAngle: 244.3 },  // 深灰色
  { label: '觜', color: '#2C3E50', startAngle: 244.3, endAngle: 257.16 },  // 深邃蓝灰
  { label: '参', color: '#1C2833', startAngle: 257.16, endAngle: 270 },    // 最深的色调

  // 南方朱雀七宿 (270-360度)
  { label: '井', color: '#F5B7B1', startAngle: 270, endAngle: 282.86 },
  { label: '鬼', color: '#F1948A', startAngle: 282.86, endAngle: 295.72 },
  { label: '柳', color: '#EC7063', startAngle: 295.72, endAngle: 308.58 },
  { label: '星', color: '#E74C3C', startAngle: 308.58, endAngle: 321.44 },
  { label: '张', color: '#DC7633', startAngle: 321.44, endAngle: 334.3 },
  { label: '翼', color: '#CA6F1E', startAngle: 334.3, endAngle: 347.16 },
  { label: '轸', color: '#BA4A00', startAngle: 347.16, endAngle: 360 }
]
</script>

<template>
  <CircleRing
    :radius="280"
    :inner-radius="250"
    :items="twentyEightConstellations"
    :show-ticks="true"
    :tick-width="1"
    :show-circle="true"
    :circle-width="1.2"
    circle-color="#666666"
    tick-color="#444444"
    :label-position="0.5"
    :enable-animation="true"
    :animation-speed="0.2"
    :start-degree="startDegree"
    :font-size="12"
  />
</template>