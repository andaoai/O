<script setup lang="ts">
import { computed } from 'vue'
import PolarCanvas from './base/PolarCanvas.vue'

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
  scaleInterval: 5         // 默认5度间隔（72个刻度）
})

/**
 * 计算刻度总数
 * 根据360度总圆周和刻度间隔计算需要显示的刻度数量
 * 使用 Math.floor 确保整数结果
 */
const scaleCount = computed(() => Math.floor(360 / props.scaleInterval))

/**
 * 生成扇形区域数据
 * 每个刻度间隔对应一个扇形区域，用于视觉上的分区
 *
 * @param getMidAngle - 从 PolarCanvas 传入的角度计算函数
 * @param generateArcPath - 从 PolarCanvas 传入的弧形路径生成函数
 * @param totalRotation - 总旋转角度（已包含在参数中，此处不重复使用）
 * @returns 扇形区域数组，每个元素包含起始角度、结束角度和SVG路径
 */
const generateSectors = (getMidAngle: Function, generateArcPath: Function, totalRotation: number) => {
  const sectors = []

  // 遍历每个刻度间隔
  for (let i = 0; i < scaleCount.value; i++) {
    // 计算当前刻度的度数值（5, 10, 15, ...）
    const degree = props.scaleInterval + i * props.scaleInterval

    // 计算扇形的起始和结束角度
    // 起始角度 = 当前度数 - 间隔
    const startAngle = (degree - props.scaleInterval + props.startDegree) % 360
    // 结束角度 = 当前度数
    const endAngle = (degree + props.startDegree) % 360

    // 生成扇形路径（使用极坐标转SVG路径）
    sectors.push({
      startAngle,  // 扇形起始角度
      endAngle,    // 扇形结束角度
      path: generateArcPath(0, 0, props.radius, startAngle, endAngle, props.innerRadius)
    })
  }

  return sectors
}

/**
 * 生成所有刻度线数据
 * 包括每个刻度的边界线，确保文字之间有清晰的分隔
 * 这是组件的核心功能之一，保证了刻度的完整性
 *
 * @param polarToCartesian - 从 PolarCanvas 传入的极坐标转换函数
 * @param totalRotation - 总旋转角度（已包含在参数中，此处不重复使用）
 * @returns 刻度线数组，每个元素包含线的起点和终点坐标
 */
const generateAllTicks = (polarToCartesian: Function, totalRotation: number) => {
  const ticks = []

  // 生成所有刻度线（从0度到360度）
  // 重要：使用 <= scaleCount 确保生成360度的闭合线
  // 这样可以保证最后一个刻度也有边界线，形成完整的闭环
  for (let i = 0; i <= scaleCount.value; i++) {
    // 计算当前刻度线的角度
    const angle = (i * props.scaleInterval + props.startDegree) % 360

    // 将极坐标转换为笛卡尔坐标
    // 内圆端点
    const inner = polarToCartesian(angle, props.innerRadius)
    // 外圆端点
    const outer = polarToCartesian(angle, props.radius)

    // 存储刻度线数据
    ticks.push({
      x1: inner.x,      // 起点X坐标
      y1: inner.y,      // 起点Y坐标
      x2: outer.x,      // 终点X坐标
      y2: outer.y,      // 终点Y坐标
      angle            // 当前角度（用于key值）
    })
  }

  return ticks
}

/**
 * 生成标签文字位置数据
 * 标签位于每个扇形区域的中央，确保文字清晰可读
 *
 * @param getMidAngle - 从 PolarCanvas 传入的角度计算函数
 * @param polarToCartesian - 从 PolarCanvas 传入的极坐标转换函数
 * @param totalRotation - 总旋转角度（已包含在参数中，此处不重复使用）
 * @returns 标签数组，每个元素包含位置坐标、文字内容和旋转角度
 */
const generateLabels = (getMidAngle: Function, polarToCartesian: Function, totalRotation: number) => {
  const labels = []

  // 遍历每个刻度
  for (let i = 0; i < scaleCount.value; i++) {
    // 计算当前刻度的度数值
    const degree = props.scaleInterval + i * props.scaleInterval

    // 计算扇形的起始和结束角度
    const startAngle = (degree - props.scaleInterval + props.startDegree) % 360
    const endAngle = (degree + props.startDegree) % 360

    // 使用工具函数计算扇形的中点角度
    // 这是标签显示的理想位置
    const midAngle = getMidAngle(startAngle, endAngle)

    // 计算文字的径向位置
    // 在内圆和外圆之间，根据 labelPosition 调整
    const textRadius = props.innerRadius + (props.radius - props.innerRadius) * props.labelPosition
    const position = polarToCartesian(midAngle, textRadius)

    // 计算文字的旋转角度
    // 文字应该始终"站立"，底部指向圆心
    // SVG中文字默认从左到右，所以需要 +90 度
    const textRotation = midAngle + 90

    // 存储标签数据
    labels.push({
      x: position.x,        // 标签X坐标
      y: position.y,        // 标签Y坐标
      text: degree.toString(), // 显示的度数文字
      textRotation         // 文字旋转角度
    })
  }

  return labels
}
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
    :center-x="0"
    :center-y="0"
  >
    <template #default="slotProps">
      <!--
        根容器组
        所有图形元素都放在这个组内，便于统一管理
      -->
      <g class="degree-scale">

        <!--
          外圆边线
          当 showCircle 为 true 时显示
          使用 slotProps.centerX/Y 确保圆心对齐
        -->
        <circle
          v-if="showCircle"
          :cx="slotProps.centerX"
          :cy="slotProps.centerY"
          :r="radius"
          fill="none"
          :stroke="circleColor"
          :stroke-width="circleWidth"
        />

        <!--
          内圆边线
          仅当 innerRadius > 0 时显示
          创建环形效果的内边界
        -->
        <circle
          v-if="innerRadius > 0"
          :cx="slotProps.centerX"
          :cy="slotProps.centerY"
          :r="innerRadius"
          fill="none"
          :stroke="circleColor"
          :stroke-width="circleWidth"
        />

        <!--
          扇形区域（背景）
          每个刻度间隔显示为一个扇形
          用于提供视觉上的分区效果
        -->
        <g v-if="showSectors" v-for="sector in generateSectors(slotProps.getMidAngle, slotProps.generateArcPath, slotProps.totalRotation)" :key="sector.startAngle">
          <path
            :d="sector.path"
            :fill="sectorColor"
            :opacity="sectorOpacity"
          />
        </g>

        <!--
          刻度线
          这是最重要的元素之一
          包括所有刻度的边界线，形成完整的网格
          确保每个区域都有清晰的边界
        -->
        <g v-for="tick in generateAllTicks(slotProps.polarToCartesian, slotProps.totalRotation)" :key="tick.angle">
          <line
            :x1="tick.x1"
            :y1="tick.y1"
            :x2="tick.x2"
            :y2="tick.y2"
            :stroke="circleColor"
            :stroke-width="1"
            opacity="0.6"
          />
        </g>

        <!--
          度数标签
          显示在每个扇形的中央
          文字会自动旋转，始终保持"站立"姿态
        -->
        <g v-if="showLabels" v-for="label in generateLabels(slotProps.getMidAngle, slotProps.polarToCartesian, slotProps.totalRotation)" :key="label.text">
          <text
            :x="label.x"
            :y="label.y"
            :fill="labelColor"
            font-size="12"
            text-anchor="middle"        <!-- 水平居中 -->
            dominant-baseline="central" <!-- 垂直居中 -->
            font-weight="bold"
            :transform="`rotate(${label.textRotation} ${label.x} ${label.y})`"
          >
            <!-- 显示度数并添加度符号 -->
            {{ label.text }}°
          </text>
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