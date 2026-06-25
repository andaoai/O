<script setup lang="ts">
import { computed } from 'vue'
import PolarCanvas from '../base/PolarCanvas.vue'
import { normalizeAngle, radialTextRotation, polarToCartesian, getMidAngle, arcPath } from '@/utils/geometry'

/**
 * 通用度数刻度环组件
 *
 * 这是一个高度灵活的极坐标刻度环组件，专门用于显示度数刻度系统。
 * 组件继承自 PolarCanvas，支持自定义刻度间隔，可适应不同的传统文化体系需求。
 *
 * 组件特点：
 * - 支持任意度数间隔（1-360度）
 * - 自动生成完整的刻度线（包括所有边界线）
 * - 智能文字定位和旋转
 * - 扇形区域可视化
 * - 动画支持
 *
 * @author Generated with Claude Code
 * @since 2025-10-15
 *
 * @example
 * ```vue
 * <!-- 基础用法：5度间隔（72个刻度） -->
 * <DegreeScale :radius="200" :scale-interval="5" />
 *
 * <!-- 六十甲子体系：6度间隔（60个刻度） -->
 * <DegreeScale
 *   :radius="200"
 *   :scale-interval="6"
 *   :inner-radius="180"
 *   label-color="#gold"
 * />
 *
 * <!-- 十二地支体系：12度间隔（30个刻度） -->
 * <DegreeScale
 *   :radius="200"
 *   :scale-interval="12"
 *   show-sectors="true"
 *   sector-color="rgba(255,255,255,0.2)"
 * />
 *
 * <!-- 二十四节气体系：15度间隔（24个刻度） -->
 * <DegreeScale
 *   :radius="200"
 *   :scale-interval="15"
 *   :show-labels="true"
 *   label-position="0.8"
 * />
 *
 * <!-- 带动画的刻度环 -->
 * <DegreeScale
 *   :radius="200"
 *   :scale-interval="10"
 *   :enable-animation="true"
 *   :animation-speed="0.1"
 *   :rotation="45"
 * />
 * ```
 */

/**
 * 组件属性接口定义
 */
interface Props {
  /**
   * 圆环外半径（像素）
   * 必填参数，决定刻度环的整体大小
   */
  radius: number

  /**
   * 圆环内半径（像素）
   * 可选，默认为0（实心圆）
   * 设置值大于0时创建环形效果，内圆到外圆之间的区域用于显示刻度
   */
  innerRadius?: number

  /**
   * 起始度数偏移（0-360度）
   * 默认0度从正右方（3点钟方向）开始
   * 用于调整整个刻度环的起始位置
   *
   * 示例：
   * - 0: 从正右方开始
   * - 90: 从正下方开始
   * - 180: 从正左方开始
   * - 270: 从正上方开始
   */
  startDegree?: number

  /**
   * 整体旋转角度（度数）
   * 用于旋转整个刻度环
   * 正值为顺时针旋转，负值为逆时针旋转
   */
  rotation?: number

  /**
   * 是否启用自动旋转动画
   * 开启后刻度环会按照 animationSpeed 持续旋转
   */
  enableAnimation?: boolean

  /**
   * 动画旋转速度（度/帧）
   * 正数表示顺时针旋转，负数表示逆时针旋转
   *
   * 示例：
   * - 0.1: 缓慢顺时针旋转
   * - -0.5: 较快逆时针旋转
   * - 1: 快速顺时针旋转
   */
  animationSpeed?: number

  /**
   * 是否显示度数标签文字
   * 控制是否在每个刻度中央显示度数
   */
  showLabels?: boolean

  /**
   * 标签文字颜色
   * 支持任何有效的CSS颜色值
   *
   * 示例：
   * - '#ffffff': 白色
   * - 'gold': 金色
   * - 'rgba(255,255,255,0.8)': 半透明白色
   */
  labelColor?: string

  /**
   * 文字位置半径比例（0-1）
   * 控制标签在内圆和外圆之间的位置
   *
   * 示例：
   * - 0: 紧贴内圆边缘
   * - 0.5: 内外圆正中间（默认）
   * - 1: 紧贴外圆边缘
   * - 0.7: 偏向外圆（常用于环形较宽的情况）
   */
  labelPosition?: number

  /**
   * 是否显示圆环边线
   * 控制是否绘制内圆和外圆的轮廓线
   */
  showCircle?: boolean

  /**
   * 圆环边线宽度（像素）
   * 边线的粗细程度
   */
  circleWidth?: number

  /**
   * 圆环边线颜色
   * 与 labelColor 参数格式相同
   */
  circleColor?: string

  /**
   * 是否显示扇形区域
   * 开启后每个刻度间隔会显示为一个扇形区域
   * 用于增强视觉效果，便于区分不同的刻度区域
   */
  showSectors?: boolean

  /**
   * 扇形区域的填充颜色
   * 支持任何有效的CSS颜色值
   */
  sectorColor?: string

  /**
   * 扇形区域透明度（0-1）
   * 0为完全透明，1为完全不透明
   *
   * 示例：
   * - 0.05: 极淡的背景（推荐）
   * - 0.1: 淡淡的背景（默认）
   * - 0.3: 较明显的背景
   */
  sectorOpacity?: number

  /**
   * 刻度间隔（度数）
   * 核心参数，决定刻度的密度和数量
   * 必须是360的约数，以确保均匀分布
   *
   * 常用值及其对应体系：
   *
   * 传统文化体系：
   * - 6: 60个刻度（六十甲子、六十纳音）
   * - 12: 30个刻度（十二地支、十二宫）
   * - 15: 24个刻度（二十四节气）
   * - 30: 12个刻度（十二时辰）
   *
   * 细分刻度：
   * - 3: 120个刻度
   * - 4: 90个刻度
   * - 5: 72个刻度（常用）
   * - 10: 36个刻度
   *
   * 粗略刻度：
   * - 24: 15个刻度
   * - 36: 10个刻度
   * - 45: 8个刻度（八卦方位）
   * - 60: 6个刻度（六爻）
   * - 90: 4个刻度（四象方位）
   * - 120: 3个刻度（三才）
   * - 180: 2个刻度（阴阳）
   * - 360: 1个刻度
   */
  scaleInterval?: number

  /**
   * 旋转方向
   * 控制整个刻度环的旋转方向
   * 影响文字的旋转方向以确保文字始终指向圆心
   */
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

/**
 * 组件默认属性值
 */
const props = withDefaults(defineProps<Props>(), {
  innerRadius: 0,          // 默认为实心圆
  startDegree: 0,          // 从正右方开始
  rotation: 0,             // 无额外旋转
  enableAnimation: false,  // 默认不启用动画
  animationSpeed: 0.5,     // 缓慢旋转速度
  showLabels: true,        // 显示度数标签
  labelColor: '#ffffff',   // 白色文字
  labelPosition: 0.5,      // 文字居中
  showCircle: true,        // 显示圆环边线
  circleWidth: 1,          // 细边线
  circleColor: '#ffffff',  // 白色边线
  showSectors: true,       // 显示扇形区域
  sectorColor: '#ffffff',  // 白色扇形
  sectorOpacity: 0.1,      // 淡淡的扇形背景
  scaleInterval: 5,        // 默认5度间隔（72个刻度）
  rotationDirection: 'clockwise'  // 默认顺时针
})

/**
 * 计算刻度总数
 * 根据360度总圆周和刻度间隔计算需要显示的刻度数量
 * 使用 Math.floor 确保整数结果
 */
const scaleCount = computed(() => Math.floor(360 / props.scaleInterval))

/** 旋转方向（供 geometry 统一坐标/路径/文字朝向） */
const dir = computed(() => props.rotationDirection)

/**
 * 扇形区域数据（computed，直接走 geometry，不再依赖 PolarCanvas slot 函数）
 */
const sectors = computed(() => {
  const out: { startAngle: number; endAngle: number; path: string }[] = []
  for (let i = 0; i < scaleCount.value; i++) {
    const degree = props.scaleInterval + i * props.scaleInterval
    const startAngle = normalizeAngle(degree - props.scaleInterval + props.startDegree)
    const endAngle = normalizeAngle(degree + props.startDegree)
    out.push({
      startAngle,
      endAngle,
      path: arcPath(props.radius, startAngle, endAngle, props.innerRadius, dir.value)
    })
  }
  return out
})

/**
 * 所有刻度线（含 360° 闭合线，故用 <= scaleCount）
 */
const ticks = computed(() => {
  const out: { x1: number; y1: number; x2: number; y2: number; angle: number }[] = []
  for (let i = 0; i <= scaleCount.value; i++) {
    const angle = normalizeAngle(i * props.scaleInterval + props.startDegree)
    const inner = polarToCartesian(angle, props.innerRadius, dir.value)
    const outer = polarToCartesian(angle, props.radius, dir.value)
    out.push({ x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y, angle })
  }
  return out
})

/**
 * 度数标签（位置 + 文字 + 径向旋转）
 */
const labels = computed(() => {
  const out: { x: number; y: number; text: string; textRotation: number }[] = []
  for (let i = 0; i < scaleCount.value; i++) {
    const degree = props.scaleInterval + i * props.scaleInterval
    const startAngle = normalizeAngle(degree - props.scaleInterval + props.startDegree)
    const endAngle = normalizeAngle(degree + props.startDegree)
    const midAngle = getMidAngle(startAngle, endAngle)
    const textRadius = props.innerRadius + (props.radius - props.innerRadius) * props.labelPosition
    const position = polarToCartesian(midAngle, textRadius, dir.value)
    out.push({
      x: position.x,
      y: position.y,
      text: degree.toString(),
      textRotation: radialTextRotation(midAngle, dir.value)
    })
  }
  return out
})
</script>

<template>
  <!--
    使用 PolarCanvas 作为基础画布
    PolarCanvas 提供了极坐标系统、动画支持和其他基础功能
  -->
  <PolarCanvas
    :enable-animation="enableAnimation"
    :animation-speed="animationSpeed"
    :rotation="rotation"
    :rotation-direction="rotationDirection"
    :center-x="0"
    :center-y="0"
  >
    <template #default="slotProps">
      <!--
        根容器组
        所有图形元素都放在这个组内，便于统一管理
      -->
      <g class="degree-scale">

        <!-- 外圆边线 -->
        <circle
          v-if="showCircle"
          :cx="slotProps.centerX"
          :cy="slotProps.centerY"
          :r="radius"
          fill="none"
          :stroke="circleColor"
          :stroke-width="circleWidth"
        />

        <!-- 内圆边线（仅 innerRadius > 0 时） -->
        <circle
          v-if="innerRadius > 0"
          :cx="slotProps.centerX"
          :cy="slotProps.centerY"
          :r="innerRadius"
          fill="none"
          :stroke="circleColor"
          :stroke-width="circleWidth"
        />

        <!-- 扇形区域（背景） -->
        <g v-if="showSectors">
          <path
            v-for="sector in sectors"
            :key="sector.startAngle"
            :d="sector.path"
            :fill="sectorColor"
            :opacity="sectorOpacity"
          />
        </g>

        <!-- 刻度线（含 360° 闭合线） -->
        <line
          v-for="tick in ticks"
          :key="tick.angle"
          :x1="tick.x1"
          :y1="tick.y1"
          :x2="tick.x2"
          :y2="tick.y2"
          :stroke="circleColor"
          :stroke-width="1"
          opacity="0.6"
        />

        <!-- 度数标签 -->
        <g v-if="showLabels">
          <text
            v-for="label in labels"
            :key="label.text"
            :x="label.x"
            :y="label.y"
            :fill="labelColor"
            font-size="12"
            text-anchor="middle"
            dominant-baseline="central"
            font-weight="bold"
            :transform="`rotate(${label.textRotation} ${label.x} ${label.y})`"
          >{{ label.text }}°</text>
        </g>

      </g>
    </template>
  </PolarCanvas>
</template>

<style scoped>
.degree-scale {
  /*
    通用度数刻度环组件样式
    组件主要依靠属性控制外观，此处保留样式定义以便后续扩展
  */

  /* 确保所有子元素继承transform */
  transform-origin: center;

  /* 优化渲染性能 */
  will-change: transform;

  /* 防止文字模糊 */
  text-rendering: optimizeLegibility;

  /* 确保线条清晰 */
  shape-rendering: crispEdges;
}
</style>