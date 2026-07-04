<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import BaseCenter from '@/components/base/BaseCenter.vue'
import { beidouPositions, magnitudeToRadius } from '@/utils/beidou'

/**
 * ⚫ 北斗七星圆心组件（时间驱动）
 *
 * ⚠️ 五层架构规范：标准圆心组件接口
 *   - 仅接受 radius（由 RingStack #center slot 注入）
 *   - 支持 MaybeRef<Date> 时间驱动
 *   - 支持 rotationDirection 统一注入
 *
 * 绘制内容（自外向内叠层）：
 *   1. 圆心边界（虚线圆，标识"这里是一个圆心区"的视觉边界）
 *   2. 北斗七星连线（勺+柄），基于岁差修正的当前历元赤道坐标
 *   3. 七颗星本体 + 中文名（天枢/天璇/天玑/天权/玉衡/开阳/摇光）
 *   4. 天极中心十字标记
 *
 * 天文原理：
 *   - 恒星位置：J2000 星表 (Hipparcos) → `fixedStarEquatorial` 加入岁差 →
 *     用「本地恒星时 − 赤经」得到时角 → `project(HA, dec)` 天极等距方位投影 →
 *     数学平面 (y 上) → SVG (y 取反)。
 *   - 斗柄的"物理指向"随地球自转一日 360°，直接肉眼读取即可，
 *     无需辅助射线（辅助线反而稀释"看真斗柄"的观测原初体验）。
 *
 * 使用方式：
 *   <template #center="{ innerRadius }">
 *     <BeidouCenter :radius="innerRadius" :time="controlledTime" />
 *   </template>
 */
interface Props {
  /** 圆心区半径（RingStack #center slot 提供的 innerRadius，等于月将环内边） */
  radius?: number
  /** 星图缩放系数 (0.1~1.0) */
  scale?: number
  /** 时间源 */
  time?: MaybeRef<Date>
  /** 统一旋转方向控制 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
  /** 是否显示星名中文标签 */
  showLabels?: boolean
  /** 是否显示天极十字 */
  showPole?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200,
  scale: 0.85,
  rotationDirection: 'clockwise',
  showLabels: true,
  showPole: true
})

/** ⚠️ 五层架构范式：确保 time 始终是响应式的 */
const timeRef = computed(() => unref(props.time) ?? new Date())

/** 七星当前历元位置（含岁差） */
const stars = computed(() => beidouPositions(timeRef.value))

/**
 * 投影平面 → SVG 坐标缩放系数（工厂函数）
 *
 * 七星在投影平面上的极径 (90-δ)/90 约 0.31 ~ 0.45（赤纬 49°–62°）。
 * 让最远的一颗（摇光，δ≈49°）落在 actualRadius 的 60% 处，星图整体
 * 视觉舒适、且中心留出足够空间显示天极标记。
 *
 * ⚠️ 由于 BeidouCenter 通过 BaseCenter `#default="{ actualRadius }"` 拿到
 * 已缩放的半径（消除重复 clamp），此函数需接收 actualRadius 参数。
 */
const computeProjectionScale = (actualRadius: number): number => {
  const rs = stars.value.map((s) => Math.hypot(s.plane.x, s.plane.y))
  const maxR = Math.max(...rs)
  return (actualRadius * 0.6) / maxR
}

/**
 * 与环 `polarToCartesian` 保持"同一根镜像轴"。
 *
 * `polarToCartesian(angle, r, 'counterclockwise')` 对角度取反 →
 * 等价于对最终 SVG y 分量取反（垂直翻转，子↔午上下对调）。
 *
 * 因此当 rotationDirection = 'counterclockwise' 时，
 * BeidouCenter 也必须**垂直**翻转（把额外的 −1 应用到 y），
 * 而非水平翻转（错误地应用到 x）——否则子/午上下翻、七星左右翻，
 * 斗柄不再对齐外环高亮格。
 */
const dirSign = computed(() => (props.rotationDirection === 'counterclockwise' ? -1 : 1))

/**
 * 数学平面 → SVG 坐标（工厂函数：绑定当前 projectionScale + dirSign）
 *   - clockwise（面朝北仰望，默认）：y 取反（math y↑ → svg y↓）
 *   - counterclockwise（地图约定）：再取一次反 → 相当于不翻转，
 *     整幅星图相对 clockwise 视图垂直镜像，与外环子↔午对调同步。
 */
const makeToSvg = (projectionScale: number) => (p: { x: number; y: number }) => ({
  x: p.x * projectionScale,
  y: -p.y * projectionScale * dirSign.value
})

/**
 * 七星 SVG 坐标（渲染用）· 需要 BaseCenter #default slot 提供的 actualRadius。
 *
 * 通过工厂函数动态生成 starPoints：给定 actualRadius → 计算 projectionScale →
 * 绑定 toSvg → 派生七星坐标。这样 BeidouCenter 不再重复 clamp。
 */
const computeStarPoints = (actualRadius: number) => {
  const projectionScale = computeProjectionScale(actualRadius)
  const toSvg = makeToSvg(projectionScale)
  return stars.value.map((s) => ({
    ...s,
    ...toSvg(s.plane),
    r: magnitudeToRadius(s.mag, 3.2)
  }))
}

/** polyline points 字符串工厂 */
const computePolyPoints = (starPoints: ReturnType<typeof computeStarPoints>): string =>
  starPoints.map((p) => `${p.x},${p.y}`).join(' ')
</script>

<template>
  <BaseCenter
    :radius="radius"
    :scale="scale"
    :time="timeRef"
    :rotation-direction="rotationDirection"
  >
    <template #default="{ actualRadius }">
      <g class="beidou-center">
        <!-- 圆心边界虚线圆（视觉标识：这里是圆心区） -->
        <circle
          cx="0"
          cy="0"
          :r="radius"
          fill="none"
          stroke="#5A6B7C"
          stroke-width="0.8"
          stroke-dasharray="3,4"
          opacity="0.5"
        />

        <!-- 七星坐标（一次派生，模板内多处消费） -->
        <template v-for="starPoints in [computeStarPoints(actualRadius)]" :key="'star-points'">
          <!-- 北斗七星连线 -->
          <polyline
            :points="computePolyPoints(starPoints)"
            fill="none"
            stroke="#EAEAEA"
            stroke-width="1.4"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.85"
          />

          <!-- 天极中心十字 -->
          <g v-if="showPole" class="pole" opacity="0.55">
            <line x1="-6" y1="0" x2="6" y2="0" stroke="#888" stroke-width="0.8" />
            <line x1="0" y1="-6" x2="0" y2="6" stroke="#888" stroke-width="0.8" />
            <circle cx="0" cy="0" r="2" fill="none" stroke="#888" stroke-width="0.6" />
          </g>

          <!-- 七颗星本体 + 中文名 -->
          <g v-for="s in starPoints" :key="s.key" class="star">
            <!-- 星芒光晕 -->
            <circle
              :cx="s.x"
              :cy="s.y"
              :r="s.r + 3"
              fill="#FFFFFF"
              opacity="0.15"
            />
            <!-- 星体 -->
            <circle
              :cx="s.x"
              :cy="s.y"
              :r="s.r"
              fill="#FFFFFF"
            />
            <!-- 星名（贴星旁小字） -->
            <text
              v-if="showLabels"
              :x="s.x"
              :y="s.y - s.r - 6"
              fill="#DDDDDD"
              font-size="11"
              text-anchor="middle"
              dominant-baseline="baseline"
              paint-order="stroke"
              stroke="#000"
              stroke-width="2"
            >{{ s.cnName }}</text>
          </g>
        </template>
      </g>
    </template>
  </BaseCenter>
</template>

<style scoped>
.beidou-center text {
  font-family: 'Microsoft YaHei', 'STHeiti', sans-serif;
  pointer-events: none;
}
</style>
