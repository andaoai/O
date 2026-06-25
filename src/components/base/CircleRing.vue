<script setup lang="ts">
import { computed } from 'vue'
import PolarCanvas from './PolarCanvas.vue'
import { polarToCartesian as polar, getMidAngle, arcPath, radialTextRotation } from '@/utils/geometry'
import type { RingItem } from '@/data/rings/types'

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
 * 统一使用数据层 RingItem（见 @/data/rings/types），不再本地另定义，避免类型漂移。
 */

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
 * 极坐标转笛卡尔坐标（统一走 geometry，按 rotationDirection 处理顺/逆时针）
 */
const polarToCartesian = (angle: number, radius: number) =>
  polar(angle, radius, props.rotationDirection)

/**
 * 生成环弧形 path（统一走 geometry）
 */
const generateArcPath = (radius: number, startAngle: number, endAngle: number, innerRadius: number): string =>
  arcPath(radius, startAngle, endAngle, innerRadius, props.rotationDirection)

/**
 * 扇形区域（仅依赖 items/radius/innerRadius/startDegree，与动画帧无关）
 */
const sectors = computed(() =>
  props.items.map((item, index) => {
    const baseStartAngle = item.startAngle !== undefined ? item.startAngle : index * angleStep.value
    const baseEndAngle = item.endAngle !== undefined ? item.endAngle : (index + 1) * angleStep.value
    const startAngle = (baseStartAngle + props.startDegree) % 360
    const endAngle = (baseEndAngle + props.startDegree) % 360
    return {
      startAngle,
      endAngle,
      item,
      path: generateArcPath(props.radius, startAngle, endAngle, props.innerRadius)
    }
  })
)

/**
 * 取 item 的高亮级别：highlightLevel 优先，回退到布尔 highlight（true=2）。
 * 0 不亮，1 微亮（仅文字），2 中亮（呼吸扇形），3 强亮（强呼吸+大字）。
 */
const levelOf = (item: RingItem): number => item.highlightLevel ?? (item.highlight ? 2 : 0)

/**
 * 高亮扇形：仅级别 ≥ 2 的 item 渲染呼吸背景（微亮级别 1 只上色文字，不画扇形）。
 * 复用 sectors 的路径，不论 showSectors 是否开启都会出现。
 */
const highlightSectors = computed(() =>
  sectors.value.filter(s => levelOf(s.item) >= 2)
)

/**
 * 刻度线（每个 item 起始位置一条，从内圆到外圆）
 */
const ticks = computed(() =>
  props.items.map((item, index) => {
    const baseStartAngle = item.startAngle !== undefined ? item.startAngle : index * angleStep.value
    const startAngle = (baseStartAngle + props.startDegree) % 360
    const startInner = polarToCartesian(startAngle, props.innerRadius)
    const startOuter = polarToCartesian(startAngle, props.radius)
    return {
      x1: startInner.x,
      y1: startInner.y,
      x2: startOuter.x,
      y2: startOuter.y,
      angle: startAngle,
      item
    }
  })
)

/**
 * 标签位置与旋转（文字顶部指向圆心）
 */
const labels = computed(() =>
  props.items.map((item, index) => {
    const baseStartAngle = item.startAngle !== undefined ? item.startAngle : index * angleStep.value
    const baseEndAngle = item.endAngle !== undefined ? item.endAngle : (index + 1) * angleStep.value
    const startAngle = (baseStartAngle + props.startDegree) % 360
    const endAngle = (baseEndAngle + props.startDegree) % 360
    const midAngle = getMidAngle(startAngle, endAngle)
    const textRadius = props.innerRadius + (props.radius - props.innerRadius) * props.labelPosition
    const position = polarToCartesian(midAngle, textRadius)
    // 文字顶部指向圆心（统一走 geometry，按 rotationDirection 处理）
    const textRotation = radialTextRotation(midAngle, props.rotationDirection)
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
)
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
    <template #default>
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
          :cx="0"
          :cy="0"
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
          :cx="0"
          :cy="0"
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
        <g v-if="showSectors">
          <path
            v-for="sector in sectors"
            :key="sector.startAngle"
            :d="sector.path"
            :fill="sector.item.color || '#ffffff'"
            opacity="0.3"
          />
        </g>

        <!--
          高亮扇形（呼吸背景）
          仅 highlight 标记的格，独立于 showSectors，做缓慢明暗脉动
          以可视化「当前时间点正落在此格」
        -->
        <path
          v-for="hs in highlightSectors"
          :key="`hl-${hs.startAngle}`"
          :class="levelOf(hs.item) >= 3 ? 'highlight-sector-strong' : 'highlight-sector'"
          :d="hs.path"
          :fill="hs.item.color || '#ffffff'"
        />

        <!--
          分隔线（刻度线）
          从内圆到外圆的分隔线
          标记每个项目的边界
        -->
        <g v-if="showTicks">
          <line
            v-for="tick in ticks"
            :key="tick.angle"
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
        <g v-if="showLabels">
          <g v-for="label in labels" :key="label.angle">
            <!--
              单字符或四象标签（水平显示）
              适用于天干、地支、四象等单字标签
            -->
            <text
              v-if="!label.isTwoCharacter"
              :x="label.x"
              :y="label.y"
              :class="{ 'highlight-label': levelOf(label.item) >= 2, 'highlight-label-strong': levelOf(label.item) >= 3 }"
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

/* 高亮扇形：缓慢明暗呼吸，标识当前时间点所在格 */
.highlight-sector {
  animation: highlight-breathe 1.6s ease-in-out infinite;
  pointer-events: none;
}

@keyframes highlight-breathe {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 0.55; }
}

/* 强亮扇形（四/五星聚）：更强呼吸幅度 */
.highlight-sector-strong {
  animation: highlight-breathe-strong 1.2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes highlight-breathe-strong {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.85; }
}

/* 高亮文字：同步脉动 + 轻微发光 */
.highlight-label {
  animation: highlight-pulse 1.6s ease-in-out infinite;
}

@keyframes highlight-pulse {
  0%, 100% {
    opacity: 0.75;
    filter: drop-shadow(0 0 1px currentColor);
  }
  50% {
    opacity: 1;
    filter: drop-shadow(0 0 4px currentColor);
  }
}

/* 强亮文字（四/五星聚）：更强发光 */
.highlight-label-strong {
  animation: highlight-pulse-strong 1.2s ease-in-out infinite;
}

@keyframes highlight-pulse-strong {
  0%, 100% {
    opacity: 0.85;
    filter: drop-shadow(0 0 2px currentColor);
  }
  50% {
    opacity: 1;
    filter: drop-shadow(0 0 7px currentColor);
  }
}
</style>