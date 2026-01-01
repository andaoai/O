<script setup lang="ts">
import CircleRing from './base/CircleRing.vue'

/**
 * 二十八星宿赤道宿度数据
 *
 * 【历史来源】
 * 本数据基于《汉书·律历志》记载的汉代标准赤道宿度。
 * 中国传统天文学以365.25度为周天（回归年长度），与现代360度制不同。
 *
 * 【度数转换】
 * 角度已按公式转换：现代度数 = 古度 × (360 / 365.25)
 * 下方代码中注释的"X古度"表示传统宿度，startAngle/endAngle为转换后的现代度数。
 *
 * 【起始点】
 * 从"角"宿开始（0°），对应春分点。
 *
 * 【星宿顺序】
 * 按照中国传统观测顺序，从角宿开始顺时针排列：
 * - 东方青龙七宿（春季星空）
 * - 北方玄武七宿（冬季星空）
 * - 西方白虎七宿（秋季星空）
 * - 南方朱雀七宿（夏季星空）
 */

const twentyEightConstellations = [
  // 东方青龙七宿 (0° → 73.922°)
  { label: '角', color: '#2ECC71', startAngle: 0, endAngle: 11.828 },      // 12古度
  { label: '亢', color: '#27AE60', startAngle: 11.828, endAngle: 20.699 },  // 9古度
  { label: '氐', color: '#229954', startAngle: 20.699, endAngle: 35.483 },  // 15古度
  { label: '房', color: '#1D8348', startAngle: 35.483, endAngle: 40.411 },  // 5古度
  { label: '心', color: '#196F3D', startAngle: 40.411, endAngle: 45.339 },  // 5古度
  { label: '尾', color: '#145A32', startAngle: 45.339, endAngle: 63.080 },  // 18古度
  { label: '箕', color: '#0E6251', startAngle: 63.080, endAngle: 73.922 },  // 11古度

  // 北方玄武七宿 (73.922° → 170.514°)
  { label: '斗', color: '#5DADE2', startAngle: 73.922, endAngle: 99.548 },  // 26古度
  { label: '牛', color: '#3498DB', startAngle: 99.548, endAngle: 107.433 }, // 8古度
  { label: '女', color: '#2874A6', startAngle: 107.433, endAngle: 119.261 }, // 12古度
  { label: '虚', color: '#1B4F72', startAngle: 119.261, endAngle: 129.117 }, // 10古度
  { label: '危', color: '#154360', startAngle: 129.117, endAngle: 145.873 }, // 17古度
  { label: '室', color: '#0B5345', startAngle: 145.873, endAngle: 161.643 }, // 16古度
  { label: '壁', color: '#0E6251', startAngle: 161.643, endAngle: 170.514 }, // 9古度

  // 西方白虎七宿 (170.514° → 249.365°)
  { label: '奎', color: '#D4AF37', startAngle: 170.514, endAngle: 186.284 }, // 16古度
  { label: '娄', color: '#BCC6CC', startAngle: 186.284, endAngle: 198.112 }, // 12古度
  { label: '胃', color: '#AEB6BF', startAngle: 198.112, endAngle: 211.911 }, // 14古度
  { label: '昴', color: '#829AE3', startAngle: 211.911, endAngle: 222.753 }, // 11古度
  { label: '毕', color: '#566573', startAngle: 222.753, endAngle: 238.523 }, // 16古度
  { label: '觜', color: '#2C3E50', startAngle: 238.523, endAngle: 240.494 }, // 2古度（最小）
  { label: '参', color: '#1C2833', startAngle: 240.494, endAngle: 249.365 }, // 9古度

  // 南方朱雀七宿 (249.365° → 360°)
  { label: '井', color: '#F5B7B1', startAngle: 249.365, endAngle: 281.891 }, // 33古度（最大）
  { label: '鬼', color: '#F1948A', startAngle: 281.891, endAngle: 285.834 }, // 4古度
  { label: '柳', color: '#EC7063', startAngle: 285.834, endAngle: 300.618 }, // 15古度
  { label: '星', color: '#E74C3C', startAngle: 300.618, endAngle: 307.517 }, // 7古度
  { label: '张', color: '#DC7633', startAngle: 307.517, endAngle: 325.258 }, // 18古度
  { label: '翼', color: '#CA6F1E', startAngle: 325.258, endAngle: 342.999 }, // 18古度
  { label: '轸', color: '#BA4A00', startAngle: 342.999, endAngle: 360 }       // 17古度
]
</script>

<template>
  <CircleRing
    :radius="420"
    :inner-radius="390"
    :items="twentyEightConstellations"
    :show-ticks="true"
    :tick-width="1"
    :show-circle="true"
    :circle-width="1.2"
    circle-color="#666666"
    tick-color="#444444"
    :label-position="0.5"
    :enable-animation="false"
    :animation-speed="0.2"
    :font-size="12"
  />
</template>