<script setup lang="ts">
import { computed } from 'vue'
import PolarCanvas from './PolarCanvas.vue'

/**
 * 圆环组件
 *
 * 通用的圆环显示组件，用于在极坐标系统中展示环形分布的项目。
 * 适用于显示各种环形列表，如地支、天干、星宿等。
 *
 * 组件特点：
 * - 支持自定义项目数组
 * - 自动计算每个项目的角度分布
 * - 支持双字符标签垂直排列（如十二长生）
 * - 灵活的样式控制
 * - 动画支持
 *
 * @example
 * ```vue
 * <!-- 十二地支 -->
 * <CircleRing
 *   :radius="200"
 *   :items="[
 *     { label: '子', color: '#ff6b6b' },
 *     { label: '丑', color: '#4ecdc4' },
 *     ...
 *   ]"
 * />
 *
 * <!-- 二十八星宿 -->
 * <CircleRing
 *   :radius="200"
 *   :inner-radius="180"
 *   :items="constellations"
 *   :show-sectors="true"
 *   sector-opacity="0.3"
 * />
 *
 * <!-- 十二长生（双字符垂直排列） -->
 * <CircleRing
 *   :radius="200"
 *   :items="longevity"
 *   :vertical-two-char="true"
 * />
 * ```
 */

/**
 * 圆环项目接口
 * 定义每个环上项目的数据结构
 */
interface RingItem {
  /** 标签文字 */
  label: string
  /** 自定义颜色（可选） */
  color?: string
  /** 字体大小（像素，可选） */
  fontSize?: number
  /** 自定义起始角度（0-360度，可选） */
  startAngle?: number
  /** 自定义结束角度（0-360度，可选） */
  endAngle?: number
}

/**
 * 组件属性接口定义
 */
interface Props {
  /** 圆环外半径（像素） */
  radius: number
  /** 圆环内半径（像素），默认为0（实心圆） */
  innerRadius?: number
  /** 环上的项目数组 */
  items: RingItem[]
  /** 是否显示标签文字 */
  showLabels?: boolean
  /** 标签默认颜色 */
  labelColor?: string
  /** 文字位置半径比例 (0-1, 0为内圆边缘，1为外圆边缘) */
  labelPosition?: number
  /** 是否显示刻度线 */
  showTicks?: boolean
  /** 刻度线长度（像素） */
  tickLength?: number
  /** 刻度线宽度（像素） */
  tickWidth?: number
  /** 刻度线颜色 */
  tickColor?: string
  /** 是否显示圆环边线 */
  showCircle?: boolean
  /** 圆环边线宽度（像素） */
  circleWidth?: number
  /** 圆环边线颜色 */
  circleColor?: string
  /** 是否显示扇形区域 */
  showSectors?: boolean
  /** 整体旋转角度（度数） */
  rotation?: number
  /** 是否启用自动旋转动画 */
  enableAnimation?: boolean
  /** 动画旋转速度（度/帧），正数为顺时针，负数为逆时针 */
  animationSpeed?: number
  /** 起始度数偏移（0-360度） */
  startDegree?: number
  /** 是否对双字符标签进行垂直排列（用于十二长生等） */
  verticalTwoChar?: boolean
  /** 旋转方向 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

/**
 * 组件默认属性值
 */
const props = withDefaults(defineProps<Props>(), {
  innerRadius: 0,          // 默认为实心圆
  showLabels: true,        // 显示标签
  labelColor: 'white',     // 白色文字
  labelPosition: 0.7,      // 文字偏向外圆
  showTicks: true,         // 显示刻度线
  tickLength: 10,          // 刻度线长度
  tickWidth: 0.5,          // 细刻度线
  tickColor: 'white',      // 白色刻度线
  showCircle: true,        // 显示圆环边线
  circleWidth: 1,          // 细边线
  circleColor: 'white',    // 白色边线
  showSectors: false,      // 默认不显示扇形
  rotation: 0,             // 无额外旋转
  enableAnimation: false,  // 默认不启用动画
  animationSpeed: 0.5,     // 缓慢旋转速度
  startDegree: 0,          // 从正右方开始
  verticalTwoChar: false,  // 默认水平排列
  rotationDirection: 'clockwise'  // 默认顺时针
})

/**
 * 计算每个项目的角度范围
 * 将360度平均分配给所有项目
 */
const angleStep = computed(() => 360 / props.items.length)

/**
 * 生成扇形区域数据
 * 为每个项目生成对应的扇形区域（如果启用）
 *
 * @param getMidAngle - 从 PolarCanvas 传入的角度计算函数
 * @param generateArcPath - 从 PolarCanvas 传入的弧形路径生成函数
 * @param totalRotation - 总旋转角度（已包含在参数中，此处不重复使用）
 * @returns 扇形区域数组
 */
const generateSectors = (getMidAngle: Function, generateArcPath: Function, totalRotation: number) => {
  return props.items.map((item, index) => {
    // 使用自定义角度或平均分配的角度
    const baseStartAngle = item.startAngle !== undefined ? item.startAngle : index * angleStep.value
    const baseEndAngle = item.endAngle !== undefined ? item.endAngle : (index + 1) * angleStep.value

    // 应用起始度数偏移
    // 注意：PolarCanvas 已经处理了 rotation，这里只需要处理 startDegree
    const startAngle = (baseStartAngle + props.startDegree) % 360
    const endAngle = (baseEndAngle + props.startDegree) % 360

    return {
      startAngle,  // 扇形起始角度
      endAngle,    // 扇形结束角度
      item,        // 关联的项目数据
      path: generateArcPath(0, 0, props.radius, startAngle, endAngle, props.innerRadius)
    }
  })
}

/**
 * 生成刻度线数据
 * 为每个项目生成起始位置的刻度线
 * 注意：只生成起始线，不生成结束线，这是与 DegreeScale 的区别
 *
 * @param polarToCartesian - 从 PolarCanvas 传入的极坐标转换函数
 * @param totalRotation - 总旋转角度（已包含在参数中，此处不重复使用）
 * @returns 刻度线数组
 */
const generateTicks = (polarToCartesian: Function, totalRotation: number) => {
  const allTicks: Array<{
    x1: number
    y1: number
    x2: number
    y2: number
    angle: number
    item: RingItem
  }> = []

  props.items.forEach((item, index) => {
    // 计算起始角度
    const baseStartAngle = item.startAngle !== undefined ? item.startAngle : index * angleStep.value
    const startAngle = (baseStartAngle + props.startDegree) % 360

    // 生成从内圆到外圆的刻度线
    const startInner = polarToCartesian(startAngle, props.innerRadius)
    const startOuter = polarToCartesian(startAngle, props.radius)

    allTicks.push({
      x1: startInner.x,
      y1: startInner.y,
      x2: startOuter.x,
      y2: startOuter.y,
      angle: startAngle,
      item
    })
  })

  return allTicks
}

/**
 * 生成标签位置数据
 * 计算每个项目标签的显示位置和旋转角度
 *
 * @param getMidAngle - 从 PolarCanvas 传入的角度计算函数
 * @param polarToCartesian - 从 PolarCanvas 传入的极坐标转换函数
 * @param totalRotation - 总旋转角度（已包含在参数中，此处不重复使用）
 * @returns 标签数组
 */
const generateLabels = (getMidAngle: Function, polarToCartesian: Function, totalRotation: number) => {
  return props.items.map((item, index) => {
    // 计算角度范围
    const baseStartAngle = item.startAngle !== undefined ? item.startAngle : index * angleStep.value
    const baseEndAngle = item.endAngle !== undefined ? item.endAngle : (index + 1) * angleStep.value

    // 应用起始度数偏移
    const startAngle = (baseStartAngle + props.startDegree) % 360
    const endAngle = (baseEndAngle + props.startDegree) % 360

    // 计算中点角度（标签显示位置）
    const midAngle = getMidAngle(startAngle, endAngle)

    // 计算文字的径向位置
    const textRadius = props.innerRadius + (props.radius - props.innerRadius) * props.labelPosition
    const position = polarToCartesian(midAngle, textRadius)

    // 计算文字旋转角度（文字顶部指向圆心）
    // 注意：PolarCanvas 在 counterclockwise 模式下会将角度取反进行坐标转换
    // 但 getMidAngle 返回的仍是原始角度值，所以需要相应调整
    const textRotation = props.rotationDirection === 'counterclockwise'
      ? -midAngle + 90  // 逆时针体系：角度取反后再加90度
      : midAngle + 90   // 顺时针体系：直接加90度

    // 检查是否为双字符标签且启用垂直排列
    // 主要用于十二长生（长生、沐浴、冠带、临官等）
    const isTwoCharacter = item.label.length === 2 && props.verticalTwoChar

    return {
      x: position.x,
      y: position.y,
      item,
      angle: midAngle,
      textRotation,
      isTwoCharacter
    }
  })
}
</script>

<template>
  <!--
    使用 PolarCanvas 作为基础画布
    提供极坐标系统和动画支持
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
        所有圆环元素都在这个组内
      -->
      <g class="circle-ring">

        <!--
          外圆边线
          描绘圆环的外边界
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
          描绘圆环的内边界，形成环形效果
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
          每个项目对应一个扇形
          用于提供视觉上的分区效果
        -->
        <g v-if="showSectors" v-for="sector in generateSectors(slotProps.getMidAngle, slotProps.generateArcPath, slotProps.totalRotation)" :key="sector.startAngle">
          <path
            :d="sector.path"
            :fill="sector.item.color || '#ffffff'"
            opacity="0.3"
          />
        </g>

        <!--
          分隔线（刻度线）
          从内圆到外圆的分隔线
          标记每个项目的边界
        -->
        <g v-if="showTicks" v-for="tick in generateTicks(slotProps.polarToCartesian, slotProps.totalRotation)" :key="tick.angle">
          <line
            :x1="tick.x1"
            :y1="tick.y1"
            :x2="tick.x2"
            :y2="tick.y2"
            :stroke="tickColor"
            :stroke-width="tickWidth"
          />
        </g>

        <!--
          标签文字
          显示在环的内部，每个扇形的中央位置
          支持单字符和双字符两种显示方式
        -->
        <g v-if="showLabels" v-for="label in generateLabels(slotProps.getMidAngle, slotProps.polarToCartesian, slotProps.totalRotation)" :key="label.angle">
          <!--
            单字符或四象标签（水平显示）
            适用于天干、地支、四象等单字标签
          -->
          <text
            v-if="!label.isTwoCharacter"
            :x="label.x"
            :y="label.y"
            :fill="label.item.color || labelColor"
            :font-size="label.item.fontSize || 14"
            text-anchor="middle"
            dominant-baseline="central"
            font-weight="bold"
            :transform="`rotate(${label.textRotation} ${label.x} ${label.y})`"
          >
            {{ label.item.label }}
          </text>

          <!--
            双字符标签垂直排列
            适用于十二长生等双字标签
            上下两个字分别显示
          -->
          <g v-else :transform="`rotate(${label.textRotation} ${label.x} ${label.y})`">
            <!-- 上面的字 -->
            <text
              :x="label.x"
              :y="label.y - 6"
              :fill="label.item.color || labelColor"
              :font-size="label.item.fontSize || 14"
              text-anchor="middle"
              dominant-baseline="central"
              font-weight="bold"
            >
              {{ label.item.label[0] }}
            </text>
            <!-- 下面的字 -->
            <text
              :x="label.x"
              :y="label.y + 6"
              :fill="label.item.color || labelColor"
              :font-size="label.item.fontSize || 14"
              text-anchor="middle"
              dominant-baseline="central"
              font-weight="bold"
            >
              {{ label.item.label[1] }}
            </text>
          </g>
        </g>

      </g>
    </template>
  </PolarCanvas>
</template>

<style scoped>
.circle-ring {
  /*
    圆环组件样式
    主要依靠属性控制外观，此处保留基础样式定义
  */

  /* 确保所有子元素继承transform */
  transform-origin: center;

  /* 优化渲染性能 */
  will-change: transform;

  /* 防止动画时的样式闪烁 */
  backface-visibility: hidden;

  /* 移除 transition 避免与 JavaScript 动画冲突 */
  /* 动画完全由 useAnimation composable 控制 */
}
</style>