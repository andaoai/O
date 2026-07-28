<script setup lang="ts">
import { computed } from 'vue'
import PolarCanvas from '../base/PolarCanvas.vue'
import BodyMarker from '../celestial/BodyMarker.vue'
import PlanetSvg from '../celestial/PlanetSvg.vue'
import { radialTextRotation } from '@/utils/geometry'
import { MOTION_VISUAL_CONFIG } from '@/utils/celestial'
import {
  processBodyItems,
  getMotionRingConfig,
  getArrowParams,
  getBodyCoordinates
} from '@/utils/bodyRing'
import type { BodyRingData, LuminaryKey } from '@/data/rings/types'

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

/** 处理后的天体列表（委托 bodyRing 纯函数标准化） */
const processedItems = computed(() => processBodyItems(props.data.items, props.data.defaultHalos))
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
          <template v-for="(coord, cIdx) in [getBodyCoordinates(item.angle, item.state?.latitude, data.latScale, bandMidRadius, props.innerRadius, props.radius, props.rotationDirection)]" :key="'coord-' + cIdx">
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
            <template v-for="(ringConfig, rIdx) in [getMotionRingConfig(item.state?.motion, item.state?.mansionEvent)]" :key="'ring-' + rIdx">
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
            <template v-for="(arrowParams, aIdx) in [props.showMotionArrow && getArrowParams(item.angle, item.size ?? 14, coord.actual, item.state?.motion, props.rotationDirection)]" :key="'arrows-' + aIdx">
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
