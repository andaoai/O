<script setup lang="ts">
import { computed } from 'vue'
import PolarCanvas from '../base/PolarCanvas.vue'
import BodyMarker from '../celestial/BodyMarker.vue'
import PlanetSvg from '../celestial/PlanetSvg.vue'
import { radialTextRotation, polarToCartesian, normalizeAngle } from '@/utils/geometry'
import { MOTION_VISUAL_CONFIG, type PlanetMotion, type MotionState } from '@/utils/celestial'
import type { BodyRingData, Halo, BodyState, LuminaryKey } from '@/data/rings/types'

/**
 * 数据驱动天体圆环（BodyRing）
 *
 * 第三类圆环：段导向（CircleRing）/ 点导向（PointRing）/ 体导向（BodyRing）
 *
 * 把七曜等天体统一纳入 RingStack 布局体系：
 * - 接收 BodyRingData 数据（含角度、类型、状态、光晕等）
 * - 渲染：光晕 + 本体 + 符号 + 逆行环 + 黄纬指示线
 * - 由 RingStack 注入 radius/innerRadius/rotationDirection
 * - 与 DataRing / DataPointRing 平级，可任意混用堆叠
 *
 * 典型用法：
 *   - 单行星研究盘：仅含一个 BodyItem
 *   - 双行星合冲对照：含两个 BodyItem
 *   - 七曜全图盘：含 7 个 BodyItem
 *   - 五星聚可视化：分级高亮聚合度
 */
interface Props {
  /** 天体环数据 */
  data: BodyRingData
  /** 环的外半径（由 RingStack 注入） */
  radius?: number
  /** 环的内半径（由 RingStack 注入） */
  innerRadius?: number
  /** 旋转方向 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
  /** 环带中线偏移（默认 0 = 正中间，正值向外） */
  bandOffset?: number
  /** 是否显示运动状态箭头 */
  showMotionArrow?: boolean
  /** 是否显示运动状态标签 */
  showMotionLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200,
  innerRadius: 140,
  rotationDirection: 'clockwise',
  bandOffset: 0,
  showMotionArrow: true,
  showMotionLabel: false
})

/** 环带中线半径（天体基准位置） */
const bandMidRadius = computed(() => {
  const mid = (props.radius + props.innerRadius) / 2
  return mid + props.bandOffset
})

// ─── 运动状态视觉常量 ──────────────────────────────────────────────
/** 箭头尺寸按运动状态映射：越快箭头越大 */
const ARROW_SIZE_MAP: Record<MotionState, number> = {
  fast: 8,
  normal: 7,
  slow: 5,
  stationary: 7,
  retrograde: 7
}
/** 虚线标记环的半径偏移（与 getMotionRingConfig 保持一致） */
const MOTION_RING_RADIUS_OFFSET = 5
/** 箭头与虚线环的额外间距（确保在虚线环外侧） */
const ARROW_EXTRA_SPACING = 8
/** 角度转弧度常量 */
const DEG_TO_RAD = Math.PI / 180

/** 默认光晕配置（按 haloLevel 映射） */
const getDefaultHalos = (level: number): Halo[] => {
  switch (level) {
    case 1: return [{ radius: 8, opacity: 0.2 }]
    case 2: return [{ radius: 12, opacity: 0.2 }, { radius: 8, opacity: 0.4 }]
    case 3: return [{ radius: 16, opacity: 0.3 }, { radius: 12, opacity: 0.5 }, { radius: 8, opacity: 0.7 }]
    default: return []
  }
}

/** 处理后的天体列表（合并默认值） */
const processedItems = computed(() => {
  return props.data.items.map((item) => {
    // 光晕来源：item.haloLevel > item.highlightLevel > 默认 2
    const hl = item.haloLevel ?? (item.highlightLevel || (item.highlight ? 2 : 0))
    // 默认尺寸：14px
    const size = item.size ?? 14
    // 光晕配置：data.defaultHalos 优先，否则按 haloLevel 生成
    const halos = props.data.defaultHalos ?? getDefaultHalos(hl)

    return {
      ...item,
      angle: normalizeAngle(item.angle),
      size,
      halos,
      symbolColor: item.symbolColor ?? '#fff'
    }
  })
})

/**
 * 运动状态标记环配置
 */
interface MotionRingConfig {
  radiusOffset: number
  strokeWidth: number
  color: string
  dashArray: string
  animationDur: string
  direction: number
}

/**
 * 生成运动状态标记环的渲染配置
 *
 * 通过虚线旋转速度和方向直观表示行星运动状态，
 * 使用统一的 MOTION_VISUAL_CONFIG 确保全项目颜色一致。
 *
 * @param motion 行星运动状态对象
 * @param mansionEvent 守宿事件信息（预留）
 * @returns 标记环配置对象，normal 状态返回 null 不渲染
 */
const getMotionRingConfig = (
  motion: PlanetMotion | undefined,
  mansionEvent: BodyState['mansionEvent']
): MotionRingConfig | null => {
  if (!motion || motion.state === 'normal') {
    // 正常顺行不显示额外标记环，保持界面简洁
    return null
  }

  // 守宿事件：外层加粗实线环（预留功能）
  if (mansionEvent?.type === 'stationing') {
    return {
      radiusOffset: 7,
      strokeWidth: 3,
      color: '#AA44FF',
      dashArray: 'none',
      animationDur: 'none',
      direction: 0
    }
  }

  // 各运动状态的动画配置
  const baseConfig = {
    radiusOffset: MOTION_RING_RADIUS_OFFSET,
    strokeWidth: 2,
    color: MOTION_VISUAL_CONFIG[motion.state].color,
    dashArray: '4,2'
  }

  switch (motion.state) {
    case 'fast':
      return { ...baseConfig, animationDur: '0.5s', direction: -1 }
    case 'slow':
      return { ...baseConfig, animationDur: '2s', direction: -1 }
    case 'retrograde':
      return { ...baseConfig, animationDur: '1s', direction: 1 }
    case 'stationary':
      return { ...baseConfig, animationDur: 'none', direction: 0 }
    default:
      return null
  }
}

/**
 * 箭头位置与旋转参数
 */
interface ArrowPosition {
  pos: { x: number; y: number }
  rotation: number
  path: string
  color: string
}

/**
 * 运动状态箭头完整配置
 */
interface ArrowParams {
  front: ArrowPosition
  back: ArrowPosition | null
  isStationary: boolean
  size: number
}

/**
 * 计算运动状态箭头的渲染参数
 *
 * 设计原则：箭头放置于【运动方向前方】，尖端沿切线指向运动方向。
 * 使用统一的 MOTION_VISUAL_CONFIG 确保全项目视觉一致性。
 *
 * 核心几何计算（顺时针坐标系）：
 *   右侧行星（0°）示例：
 *     顺行逆时针 → 切线向上 = 270° = 0° - 90°
 *     逆行顺时针 → 切线向下 = 90° = 0° + 90°
 *
 * @param item 天体数据项（含角度、尺寸等）
 * @param baseCoord 天体的绝对坐标（x, y）
 * @param motion 行星运动状态对象
 * @returns 箭头渲染参数对象，normal 状态返回 null
 */
const getArrowParams = (
  item: BodyRingData['items'][0],
  baseCoord: { x: number; y: number },
  motion: PlanetMotion | undefined
): ArrowParams | null => {
  if (!motion || motion.state === 'normal' || motion.arrowDirection === 'none') {
    return null
  }

  const config = MOTION_VISUAL_CONFIG[motion.state]
  const arrowSize = ARROW_SIZE_MAP[motion.state]
  const isStationary = motion.state === 'stationary'

  // SVG 箭头路径定义：箭尾在原点 (0,0)，尖端朝左（180° 方向）
  const arrowPath = `M 0,0 L ${-arrowSize},${-arrowSize * 0.6} L ${-arrowSize * 0.4},0 L ${-arrowSize},${arrowSize * 0.6} Z`

  // 箭头总间距：天体尺寸 + 虚线环偏移 + 额外间距（确保在虚线环外侧）
  const arrowSpacing = (item.size ?? 14) + MOTION_RING_RADIUS_OFFSET + ARROW_EXTRA_SPACING

  const isCCW = props.rotationDirection === 'counterclockwise'

  // 计算运动方向的切线角度（右侧行星0°：顺行向上=270°，逆行向下=90°）
  const forwardDirection = motion.state === 'retrograde' ? item.angle + 90 : item.angle - 90
  const tangentAngle = isCCW ? -forwardDirection : forwardDirection

  // 切线方向单位向量（箭头沿切线方向偏移，而非径向
  const tangentRad = tangentAngle * DEG_TO_RAD
  const tangentX = Math.cos(tangentRad)
  const tangentY = Math.sin(tangentRad)

  // 箭头旋转角度：使朝左的箭头旋转到切线方向
  const arrowRotation = isCCW ? -forwardDirection : forwardDirection

  // 构建前向箭头位置
  const frontOffset = { x: tangentX * arrowSpacing, y: tangentY * arrowSpacing }

  const front: ArrowPosition = {
    pos: { x: baseCoord.x + frontOffset.x, y: baseCoord.y + frontOffset.y },
    rotation: arrowRotation,
    path: arrowPath,
    color: config.color
  }

  // 留守状态：切线反方向也放置标记
  const back = isStationary
    ? {
        pos: { x: baseCoord.x - frontOffset.x, y: baseCoord.y - frontOffset.y },
        rotation: arrowRotation + 180,
        path: arrowPath,
        color: config.color
      }
    : null

  return { front, back, isStationary, size: arrowSize }
}

/** 计算天体实际坐标（含黄纬偏移） */
const getBodyCoordinates = (longitude: number, latitude: number | undefined, latScale: number | undefined) => {
  const base = polarToCartesian(longitude, bandMidRadius.value, props.rotationDirection)
  if (!latScale || !latitude || Math.abs(latitude) < 0.5) {
    return { base, actual: base, hasOffset: false }
  }

  // 沿径向方向偏移
  const perpX = base.x / bandMidRadius.value
  const perpY = base.y / bandMidRadius.value
  const offset = Math.sin((latitude * Math.PI) / 180) * latScale

  // 约束到环带内
  const haloMargin = 16
  const minR = props.innerRadius + haloMargin
  const maxR = props.radius - haloMargin
  const targetR = Math.min(Math.max(bandMidRadius.value + offset, minR), maxR)
  const actualOffset = targetR - bandMidRadius.value

  return {
    base,
    actual: {
      x: base.x + perpX * actualOffset,
      y: base.y + perpY * actualOffset
    },
    hasOffset: true
  }
}
</script>

<template>
  <PolarCanvas
    :enable-animation="false"
    :rotation-direction="rotationDirection"
    :center-x="0"
    :center-y="0"
  >
    <template #default="slotProps">
      <g class="data-body-ring">
        <!-- 环带边界（可选，辅助调试） -->
        <circle
          v-if="data.circleColor"
          :cx="slotProps.centerX"
          :cy="slotProps.centerY"
          :r="radius"
          fill="none"
          :stroke="data.circleColor"
          :stroke-width="data.circleWidth || 1"
          opacity="0.3"
        />
        <circle
          v-if="data.circleColor"
          :cx="slotProps.centerX"
          :cy="slotProps.centerY"
          :r="innerRadius"
          fill="none"
          :stroke="data.circleColor"
          :stroke-width="data.circleWidth || 1"
          opacity="0.3"
        />

        <!-- 逐个渲染天体 -->
        <g
          v-for="(item, i) in processedItems"
          :key="i"
          class="body-item"
          :class="{ retrograde: item.state?.retrograde }"
        >
          <!-- 坐标计算 -->
          <template v-for="coord in [getBodyCoordinates(item.angle, item.state?.latitude, data.latScale)]" :key="'coord'">
            <!-- 黄纬偏移指示线 -->
            <line
              v-if="data.showLatLine && coord.hasOffset"
              :x1="slotProps.centerX + coord.base.x"
              :y1="slotProps.centerY + coord.base.y"
              :x2="slotProps.centerX + coord.actual.x"
              :y2="slotProps.centerY + coord.actual.y"
              :stroke="item.color"
              stroke-width="1"
              opacity="0.3"
              stroke-dasharray="2,2"
            />

            <!-- 运动状态动态标记环：虚线旋转动画直观表现速度与方向 -->
            <template v-for="ringConfig in [getMotionRingConfig(item.state?.motion, item.state?.mansionEvent)]" :key="'ring'">
              <circle
                v-if="ringConfig"
                :cx="slotProps.centerX + coord.actual.x"
                :cy="slotProps.centerY + coord.actual.y"
                :r="(item.size ?? 14) + ringConfig.radiusOffset"
                fill="none"
                :stroke="ringConfig.color"
                :stroke-width="ringConfig.strokeWidth"
                :stroke-dasharray="ringConfig.dashArray !== 'none' ? ringConfig.dashArray : undefined"
                opacity="0.8"
              >
                <!-- 虚线流动动画：通过 stroke-dashoffset 变化创造视觉运动感 -->
                <animate
                  v-if="ringConfig.animationDur !== 'none'"
                  attributeName="stroke-dashoffset"
                  :values="ringConfig.direction > 0 ? '0;6' : '6;0'"
                  :dur="ringConfig.animationDur"
                  repeatCount="indefinite"
                />
              </circle>
            </template>

            <!-- 运动方向箭头：单箭头仅放置于运动方向前方 -->
            <template v-for="arrowParams in [props.showMotionArrow && getArrowParams(item, coord.actual, item.state?.motion)]" :key="'arrows'">
              <!-- 非留守状态：单箭头指示运动方向 -->
              <template v-if="arrowParams && !arrowParams.isStationary">
                <path
                  :d="arrowParams.front.path"
                  :fill="arrowParams.front.color"
                  :transform="`translate(${slotProps.centerX + arrowParams.front.pos.x}, ${slotProps.centerY + arrowParams.front.pos.y}) rotate(${arrowParams.front.rotation})`"
                  opacity="0.9"
                />
              </template>
              <!-- 留守状态：切线两侧双竖线，表示"停留不动" -->
              <template v-else-if="arrowParams && arrowParams.isStationary">
                <!-- 前方双竖线标记 -->
                <g :transform="`translate(${slotProps.centerX + arrowParams.front.pos.x}, ${slotProps.centerY + arrowParams.front.pos.y}) rotate(${arrowParams.front.rotation})`">
                  <line x1="-3" y1="0" x2="-3" :y2="arrowParams.size" stroke="#00CCFF" stroke-width="2" />
                  <line x1="3" y1="0" x2="3" :y2="arrowParams.size" stroke="#00CCFF" stroke-width="2" />
                </g>
                <!-- 后方双竖线标记（对称呈现） -->
                <g v-if="arrowParams.back" :transform="`translate(${slotProps.centerX + arrowParams.back.pos.x}, ${slotProps.centerY + arrowParams.back.pos.y}) rotate(${arrowParams.back.rotation})`">
                  <line x1="-3" y1="0" x2="-3" :y2="arrowParams.size" stroke="#00CCFF" stroke-width="2" />
                  <line x1="3" y1="0" x2="3" :y2="arrowParams.size" stroke="#00CCFF" stroke-width="2" />
                </g>
              </template>
            </template>

            <!-- 运动状态文字标签（可选）：显示疾/迟/守/逆单字 -->
            <text
              v-if="props.showMotionLabel && item.state?.motion && item.state.motion.state !== 'normal'"
              :x="slotProps.centerX + coord.actual.x"
              :y="slotProps.centerY + coord.actual.y"
              :fill="MOTION_VISUAL_CONFIG[item.state.motion.state].color"
              font-size="9"
              font-weight="bold"
              text-anchor="middle"
              dominant-baseline="middle"
              :transform="`translate(${-(item.size ?? 14) - 12}, 0)`"
            >{{ item.state.motion.character }}</text>

            <!-- 天体本体：使用 SVG 渲染七曜，回退到基础渲染 -->
            <template v-if="item.kind && ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'].includes(item.kind)">
              <PlanetSvg
                :x="slotProps.centerX + coord.actual.x"
                :y="slotProps.centerY + coord.actual.y"
                :kind="item.kind as LuminaryKey"
                :scale="(item.size ?? 14) / 22"
                :halos="item.halos"
                :halo-color="item.color"
              />
            </template>
            <template v-else>
              <BodyMarker
                :x="slotProps.centerX + coord.actual.x"
                :y="slotProps.centerY + coord.actual.y"
                :radius="item.size"
                :color="item.color"
                :halos="item.halos"
                :symbol="item.symbol"
                :symbol-color="item.symbolColor"
                :symbol-font-size="item.fontSize || data.fontSize || Math.max(10, item.size * 0.8)"
                :symbol-rotation="radialTextRotation(item.angle, rotationDirection)"
              />
            </template>

            <!-- 标签（可选，通常用于标注入宿度等） -->
            <text
              v-if="item.label && data.labelOffset !== undefined"
              :x="slotProps.centerX + coord.actual.x"
              :y="slotProps.centerY + coord.actual.y"
              :fill="item.color || data.labelColor || '#ffffff'"
              :font-size="item.fontSize || data.fontSize || 10"
              font-weight="bold"
              text-anchor="middle"
              dominant-baseline="middle"
              :transform="`translate(0, ${data.labelOffset}) rotate(${radialTextRotation(item.angle, rotationDirection)} ${slotProps.centerX + coord.actual.x} ${slotProps.centerY + coord.actual.y})`"
            >{{ item.label }}</text>
          </template>
        </g>
      </g>
    </template>
  </PolarCanvas>
</template>

<style scoped>
.data-body-ring {
  pointer-events: none;
}

.body-item {
  transition: all 0.3s ease;
}

.body-item:hover {
  filter: brightness(1.2);
}
</style>
