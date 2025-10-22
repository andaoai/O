<script setup lang="ts">
import { computed, watch } from 'vue'
import { useAnimation, AnimationType } from '@/composables/useAnimation'

/**
 * 极坐标画布组件
 *
 * 这是一个基础的极坐标系统画布组件，为所有极坐标相关的子组件提供统一的坐标系统、
 * 动画支持和工具函数。作为 CircleRing、DegreeScale 等组件的基础画布。
 *
 * 核心功能：
 * 1. 提供标准的极坐标系统（0度在正右方，顺时针增加）
 * 2. 统一的动画管理和控制
 * 3. 极坐标与笛卡尔坐标转换
 * 4. 角度计算工具函数
 * 5. SVG路径生成工具
 *
 * 坐标系统说明：
 * - 角度0度：正右方（3点钟方向）
 * - 角度90度：正上方（12点钟方向）
 * - 角度180度：正左方（9点钟方向）
 * - 角度270度：正下方（6点钟方向）
 * - 角度增加方向：顺时针
 *
 * @author Generated with Claude Code
 * @since 2025-10-15
 *
 * @example
 * ```vue
 * <!-- 基础用法 -->
 * <PolarCanvas>
 *   <template #default="{ polarToCartesian, generateArcPath }">
 *     <!-- 使用极坐标绘制内容 -->
 *   </template>
 * </PolarCanvas>
 *
 * <!-- 带动画的画布 -->
 * <PolarCanvas
 *   :enable-animation="true"
 *   :animation-speed="0.5"
 *   :rotation="45"
 * >
 *   <template #default="{ totalRotation }">
 *     <!-- totalRotation 包含动画值和手动旋转值 -->
 *   </template>
 * </PolarCanvas>
 * ```
 */

/**
 * 基础点坐标接口
 * 定义二维平面上的点
 */
interface Point {
  /** X坐标 */
  x: number
  /** Y坐标 */
  y: number
}

/**
 * 角度范围接口
 * 定义一个角度区间
 */
interface AngleRange {
  /** 起始角度（度数） */
  startAngle: number
  /** 结束角度（度数） */
  endAngle: number
}

/**
 * 组件属性接口定义
 */
interface Props {
  /** 画布宽度（像素） */
  width?: number
  /** 画布高度（像素） */
  height?: number
  /** 圆心X坐标（像素） */
  centerX?: number
  /** 圆心Y坐标（像素） */
  centerY?: number
  /** 手动旋转角度（度数） */
  rotation?: number
  /** 是否启用自动旋转动画 */
  enableAnimation?: boolean
  /** 动画旋转速度（度/帧），正数为顺时针，负数为逆时针 */
  animationSpeed?: number
  /** 最大半径（像素），用于限制绘制范围 */
  maxRadius?: number
  /** 最小半径（像素），用于限制绘制范围 */
  minRadius?: number
  /** 旋转方向 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

/**
 * 组件默认属性值
 */
const props = withDefaults(defineProps<Props>(), {
  width: 800,            // 默认画布宽度
  height: 600,           // 默认画布高度
  centerX: 400,          // 默认圆心X（画布中心）
  centerY: 300,          // 默认圆心Y（画布中心）
  rotation: 0,            // 无手动旋转
  enableAnimation: false, // 默认不启用动画
  animationSpeed: 0.5,    // 缓慢旋转速度
  maxRadius: 280,        // 默认最大半径
  minRadius: 0,           // 默认最小半径
  rotationDirection: 'clockwise'  // 默认顺时针
})

// 使用统一的动画系统
// 生成唯一的动画ID，确保多个组件实例不会冲突
const animationId = `polar-canvas-${Date.now()}-${Math.random()}`

// 根据旋转方向调整动画速度
const adjustedAnimationSpeed = computed(() => {
  return props.rotationDirection === 'counterclockwise'
    ? -props.animationSpeed
    : props.animationSpeed
})

const { start, stop, setSpeed, getValue, setValue } = useAnimation(
  animationId,
  AnimationType.ROTATION,
  {
    enabled: props.enableAnimation,
    speed: adjustedAnimationSpeed.value
  }
)

/**
 * 监听动画开关状态
 * 当 enableAnimation 变化时，启动或停止动画
 */
watch(() => props.enableAnimation, (enabled) => {
  if (enabled) {
    // 启动动画
    start()
  } else {
    // 停止动画并重置值为0
    stop()
    setValue(0)
  }
}, { immediate: true })

/**
 * 监听动画速度变化
 * 动态调整动画速度
 */
watch(() => props.animationSpeed, () => {
  setSpeed(adjustedAnimationSpeed.value)
})

/**
 * 监听旋转方向变化
 * 动态调整动画方向
 */
watch(() => props.rotationDirection, () => {
  setSpeed(adjustedAnimationSpeed.value)
})

/**
 * 计算总的旋转角度
 * 包含动画值和手动旋转值
 * 使用模运算确保角度在0-360度范围内
 */
const totalRotation = computed(() => {
  return (getValue() + props.rotation) % 360
})

/**
 * 极坐标转换为笛卡尔坐标
 *
 * 将极坐标（角度、半径）转换为二维笛卡尔坐标（x, y）
 * 使用标准的数学转换公式
 *
 * @param angle - 角度（度数）
 * @param radius - 半径（像素）
 * @param centerX - 圆心X坐标（可选，默认使用props.centerX）
 * @param centerY - 圆心Y坐标（可选，默认使用props.centerY）
 * @returns 笛卡尔坐标点
 */
const polarToCartesian = (
  angle: number,
  radius: number,
  centerX: number = props.centerX,
  centerY: number = props.centerY
): Point => {
  // 根据旋转方向调整角度
  const adjustedAngle = props.rotationDirection === 'counterclockwise'
    ? -angle
    : angle

  // 将角度转换为弧度（JavaScript的Math函数使用弧度）
  const angleRad = (adjustedAngle * Math.PI) / 180
  return {
    x: centerX + Math.cos(angleRad) * radius,
    y: centerY + Math.sin(angleRad) * radius
  }
}

/**
 * 计算角度范围的中点
 *
 * 计算两个角度之间的中间角度，处理跨越0度的特殊情况
 *
 * @param startAngle - 起始角度（度数）
 * @param endAngle - 结束角度（度数）
 * @returns 中间角度（度数）
 */
const getMidAngle = (startAngle: number, endAngle: number): number => {
  // 处理跨越0度的情况
  // 例如：从345度到15度
  if (startAngle > endAngle) {
    // 计算跨越0度的角度跨度
    const span = (360 - startAngle) + endAngle
    // 中点角度 = 起始角度 + 跨度的一半
    return (startAngle + span / 2 + 360) % 360
  } else {
    // 正常情况，直接取平均值
    return (startAngle + endAngle) / 2
  }
}

/**
 * 计算两个角度之间的跨度
 *
 * 计算从起始角度到结束角度的角度差，处理跨越0度的情况
 *
 * @param startAngle - 起始角度（度数）
 * @param endAngle - 结束角度（度数）
 * @returns 角度跨度（度数）
 */
const getAngleSpan = (startAngle: number, endAngle: number): number => {
  if (startAngle > endAngle) {
    // 跨越0度
    return (360 - startAngle) + endAngle
  } else {
    // 正常情况
    return endAngle - startAngle
  }
}

/**
 * 标准化角度到0-360范围
 *
 * 将任意角度转换到0-360度范围内
 * 处理负角度和大于360度的角度
 *
 * @param angle - 输入角度（度数）
 * @returns 标准化后的角度（0-360度）
 */
const normalizeAngle = (angle: number): number => {
  return ((angle % 360) + 360) % 360
}

/**
 * 生成等分角度
 *
 * 将360度平均分割为指定数量的角度区间
 * 常用于生成均匀分布的扇形
 *
 * @param count - 分割数量
 * @param startAngle - 起始角度偏移（可选，默认0度）
 * @returns 角度区间数组
 */
const generateEqualAngles = (count: number, startAngle: number = 0): AngleRange[] => {
  const step = 360 / count
  return Array.from({ length: count }, (_, i) => ({
    startAngle: startAngle + i * step,
    endAngle: startAngle + (i + 1) * step
  }))
}

/**
 * 生成圆弧路径
 *
 * 生成SVG的path路径字符串，用于绘制扇形或环形
 * 支持扇形（有中心点）和环形（无中心点）两种模式
 *
 * @param centerX - 圆心X坐标
 * @param centerY - 圆心Y坐标
 * @param radius - 外半径
 * @param startAngle - 起始角度（度数）
 * @param endAngle - 结束角度（度数）
 * @param innerRadius - 内半径（可选，默认0，表示扇形）
 * @returns SVG path字符串
 */
const generateArcPath = (
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  innerRadius: number = 0
): string => {
  // 计算外圆弧的起点和终点
  const start = polarToCartesian(startAngle, radius, centerX, centerY)
  const end = polarToCartesian(endAngle, radius, centerX, centerY)

  if (innerRadius === 0) {
    // 绘制扇形（从圆心到外圆）
    // 判断是否为大弧（大于180度）
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0

    // SVG路径：
    // M - 移动到圆心
    // L - 画线到起点
    // A - 画圆弧到终点
    // Z - 闭合路径
    return `M ${centerX},${centerY} L ${start.x},${start.y} A ${radius},${radius} 0 ${largeArcFlag},1 ${end.x},${end.y} Z`
  } else {
    // 绘制环形（内外两个圆弧）
    const startInner = polarToCartesian(startAngle, innerRadius, centerX, centerY)
    const endInner = polarToCartesian(endAngle, innerRadius, centerX, centerY)
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0

    // SVG路径：
    // M - 移动到外圆起点
    // A - 画外圆弧到终点
    // L - 画线到内圆终点
    // A - 画内圆弧到起点
    // Z - 闭合路径
    return `M ${start.x},${start.y} A ${radius},${radius} 0 ${largeArcFlag},1 ${end.x},${end.y} L ${endInner.x},${endInner.y} A ${innerRadius},${innerRadius} 0 ${largeArcFlag},0 ${startInner.x},${startInner.y} Z`
  }
}

// 暴露给父组件的工具函数和状态
// 这些函数会通过 slot 传递给子组件使用
defineExpose({
  polarToCartesian,        // 极坐标转换
  getMidAngle,            // 计算中点角度
  getAngleSpan,           // 计算角度跨度
  normalizeAngle,         // 标准化角度
  generateEqualAngles,    // 生成等分角度
  generateArcPath,        // 生成圆弧路径
  totalRotation,          // 总旋转角度
  animationRotation: getValue,  // 动画当前值
  startAnimation: start,   // 启动动画
  stopAnimation: stop,     // 停止动画
  setAnimationSpeed: setSpeed  // 设置动画速度
})
</script>

<template>
  <!--
    极坐标画布容器
    应用总旋转角度，包括动画和手动旋转
  -->
  <g class="polar-canvas" :transform="`rotate(${totalRotation} ${centerX} ${centerY})`">
    <!--
      通过 slot 传递工具函数给子组件
      子组件可以使用这些函数进行极坐标计算
    -->
    <slot
      :center-x="centerX"
      :center-y="centerY"
      :total-rotation="totalRotation"
      :polar-to-cartesian="polarToCartesian"
      :get-mid-angle="getMidAngle"
      :get-angle-span="getAngleSpan"
      :normalize-angle="normalizeAngle"
      :generate-equal-angles="generateEqualAngles"
      :generate-arc-path="generateArcPath"
    />
  </g>
</template>

<style scoped>
.polar-canvas {
  /*
    极坐标画布基础样式
    作为容器组件，样式主要在子组件中定义
  */

  /* 设置变换原点为中心点 */
  transform-origin: center;

  /* 优化动画性能 */
  will-change: transform;

  /* 防止子元素继承不必要的样式 */
  /* 所有样式通过 slot 内容组件自行控制 */
}
</style>