<script setup lang="ts">
/**
 * 二十四山风水盘 — 主视图
 *
 * ═══════════════════════════════════════════════════════════════
 *  手机端风水罗盘，核心交互：
 *    1. 利用 DeviceOrientation API 获取手机磁北朝向
 *    2. 利用 useGeolocation 获取 GPS 定位
 *    3. WMM 地磁模型自动校正磁偏角→得到真北朝向
 *    4. 整盘跟随手机旋转，方位始终正确
 *    5. DataBodyRing 叠加太阳当前方位标记
 *
 *  五层架构映射：
 *    Layer 2: 本视图 — 组合编排层
 *    Layer 3: TwentyFourMountainsRing / DataBodyRing
 *    Layer 4: DataRing / DataBodyRing / RingStack
 *    Layer 5: celestial.ts / geometry.ts
 * ═══════════════════════════════════════════════════════════════
 */

import { ref, computed, watch, markRaw } from 'vue'
import { useUrlTime } from '@/composables/useUrlTime'
import { useGeolocation } from '@/composables/useGeolocation'
import { usePhoneOrientation } from '@/composables/usePhoneOrientation'
import { useMagneticDeclination, headingToChinese } from '@/composables/useMagneticDeclination'
import { useViewport } from '@/composables/useViewport'
import { provideCompassContext } from '@/composables/useCompassContext'
import RingStack from '@/components/base/RingStack.vue'
import TwentyFourMountainsRing from '@/components/rings/TwentyFourMountainsRing.vue'
import DataBodyRing from '@/components/rings/DataBodyRing.vue'
import { sunDiurnal } from '@/utils/celestial'
import { normalizeAngle } from '@/utils/geometry'
import type { BodyRingData } from '@/data/rings/types'

// ─── 时间源 ─────────────────────────────────────────────
const { controlledTime } = useUrlTime()

// ─── 地理位置（默认洛阳） ───────────────────────────────
const { latitude, longitude, status: geoStatus } = useGeolocation({
  lat: 34.65,
  lon: 112.45,
  autoRequest: true
})

// ─── 手机朝向传感器 ─────────────────────────────────────
const phoneOri = usePhoneOrientation()

// ─── 磁偏角 ─────────────────────────────────────────────
const magDecl = useMagneticDeclination({
  latitude,
  longitude,
  time: controlledTime
})

/** 真北朝向 = 磁北朝向 + 磁偏角 */
const trueHeading = computed(() =>
  normalizeAngle(phoneOri.alpha.value + magDecl.declination.value)
)

// ─── 视口 ────────────────────────────────────────────────
const viewport = useViewport({ rotationAngle: 0 })
const { zoom, offsetX, offsetY, rotationAngle } = viewport

/**
 * 自动旋转：手机朝向变化 → 盘面跟随
 *
 * 公式：rotationAngle = -trueHeading
 *   · 手机朝北（trueHeading=0） → rotationAngle=0 → 子(北)在屏幕顶部 ✓
 *   · 手机朝东（trueHeading=90）→ rotationAngle=-90 → 卯(东)在顶部 ✓
 *
 * 平滑系数 ROTATION_SMOOTH=0.7 避免角度硬跳
 */
const ROTATION_SMOOTH = 0.7
watch(trueHeading, (heading) => {
  // 仅在手机水平时追迹，防止倾斜时的读数漂移
  if (phoneOri.isLevel.value) {
    const target = -heading
    const current = rotationAngle.value
    let diff = target - current
    if (diff > 180) diff -= 360
    else if (diff < -180) diff += 360
    viewport.updateRotationAngle(current + diff * ROTATION_SMOOTH)
  }
})

// ─── 太阳位置 ──────────────────────────────────────────
const sunPos = computed(() =>
  sunDiurnal(controlledTime.value, longitude.value, latitude.value)
)

/**
 * screenAngle → SVG 角度
 *
 * screenAngle 是"面朝北仰望"坐标系：
 *   0=右/东, 90=下/北, 180=左/西, 270=上/南
 *
 * SVG 坐标系：
 *   0=右/东（0°=正右=3点钟方向）, 顺时针增加
 *
 * 映射公式：svgAngle = (360 - screenAngle) % 360
 *   验证：screenAngle=0(东)→svgAngle=0(SVG右=东) ✓
 *         screenAngle=90(北)→svgAngle=270(SVG上=北) ✓
 */
const sunSvgAngle = computed(() => (360 - sunPos.value.screenAngle + 360) % 360)

/** 太阳 Body 环数据 */
const sunBodyData = computed<BodyRingData>(() => ({
  items: [
    {
      kind: 'sun',
      symbol: '☀',
      angle: sunSvgAngle.value,
      label: sunPos.value.alt > 0
        ? `太阳 ${sunPos.value.alt.toFixed(0)}° 高`
        : `太阳 ${sunPos.value.alt.toFixed(0)}° 低`,
      color: sunPos.value.alt > 0 ? '#FFD54A' : '#7A6F42',
      symbolColor: '#fff',
      size: 10,
      highlightLevel: sunPos.value.alt > 0 ? 3 : 0,
      haloLevel: sunPos.value.alt > 0 ? 3 : 0,
    }
  ]
}))

// ─── 环配置（外→内） ─────────────────────────────────
const rings = computed(() => [
  {
    component: markRaw(TwentyFourMountainsRing),
    thickness: 60,
    props: {
      // 传入太阳角度→自动高亮对应山
      highlightAngle: sunSvgAngle.value,
    }
  },
  {
    component: markRaw(DataBodyRing),
    thickness: 30,
    props: {
      data: sunBodyData.value,
      showMotionArrow: false,
      showMotionLabel: false,
    }
  }
])

// ─── CompassContext（供 Sidebar 读取） ────────────────
provideCompassContext({ time: controlledTime, viewport })

// ─── SVG ref ────────────────────────────────────────────
const svgRef = ref<SVGSVGElement | null>(null)

/** 当前朝向中文名 */
const directionLabel = computed(() => headingToChinese(trueHeading.value))

/** 定位状态文本 */
const geoLabel = computed(() => {
  switch (geoStatus.value) {
    case 'pending': return '定位中…'
    case 'success': return `📍 ${latitude.value.toFixed(1)}°N, ${longitude.value.toFixed(1)}°E`
    case 'denied': return '📍 默认位置（洛阳）'
    default: return '📍 等待定位…'
  }
})
</script>

<template>
  <div class="fengshui-container">
    <!--
      ═══ 手机朝向集成：Teleport 到 Sidebar 的 view-tools 插槽 ═══
    -->
    <Teleport to="#sidebar-view-tools">
      <div class="orientation-panel">
        <!-- 手机朝向 -->
        <div class="info-row">
          <span class="info-label">朝向</span>
          <span class="info-value">
            {{ trueHeading.toFixed(0) }}° <small>{{ directionLabel }}</small>
          </span>
        </div>

        <!-- 水平校准状态 -->
        <div class="info-row">
          <span class="info-label">水平</span>
          <span :class="['info-value', phoneOri.isLevel.value ? 'level-ok' : 'level-warn']">
            {{ phoneOri.isLevel.value ? '✅ 已校准' : '⚠️ 请水平放置手机' }}
          </span>
        </div>

        <!-- 磁偏角 -->
        <div class="info-row" v-if="magDecl.isReady.value">
          <span class="info-label">磁偏角</span>
          <span class="info-value">
            {{ magDecl.declination.value >= 0 ? '+' : '' }}{{ magDecl.declination.value.toFixed(1) }}°
          </span>
        </div>

        <!-- 太阳方位 -->
        <div class="info-row">
          <span class="info-label">太阳</span>
          <span class="info-value">
            {{ sunSvgAngle.toFixed(0) }}°
            <small>{{ sunPos.alt > 0 ? `${sunPos.alt.toFixed(0)}°高` : `${sunPos.alt.toFixed(0)}°低` }}</small>
          </span>
        </div>

        <!-- 定位 -->
        <div class="info-row">
          <span class="info-value" style="grid-column: span 2; font-size: 11px; opacity: 0.6;">
            {{ geoLabel }}
          </span>
        </div>

        <!-- iOS 授权按钮 -->
        <button
          v-if="phoneOri.needsPermission.value && phoneOri.permissionStatus.value === 'unknown'"
          class="auth-btn"
          @click="phoneOri.requestPermission()"
        >
          📱 授权使用传感器
        </button>
      </div>
    </Teleport>

    <!--
      ═══ 水平校准覆盖层 ═══
      只在需要时显示：设备支持、未水平、且已授权
    -->
    <div
      v-if="phoneOri.isSupported.value
        && !phoneOri.isLevel.value
        && phoneOri.permissionStatus.value === 'granted'"
      class="level-overlay"
    >
      <div class="level-card">
        <div class="level-icon">📐</div>
        <h3>请将手机水平放置</h3>
        <p>前后 {{ (phoneOri.beta.value - 90).toFixed(0) }}°</p>
        <p>左右 {{ phoneOri.gamma.value.toFixed(0) }}°</p>
        <div class="level-bubble-container">
          <div class="bubble-track track-x">
            <div
              class="bubble"
              :style="{ left: `${Math.max(0, Math.min(100, (phoneOri.gamma.value / 30 * 50 + 50)))}%` }"
            />
          </div>
          <div class="bubble-track track-y">
            <div
              class="bubble"
              :style="{ top: `${Math.max(0, Math.min(100, ((phoneOri.beta.value - 90) / 30 * -50 + 50)))}%` }"
            />
          </div>
        </div>
      </div>
    </div>

    <!--
      ═══ iOS 授权遮罩 ═══
    -->
    <div
      v-if="phoneOri.needsPermission.value && phoneOri.permissionStatus.value === 'unknown'"
      class="permission-overlay"
    >
      <div class="permission-card">
        <div class="permission-icon">🧭</div>
        <h3>使用传感器</h3>
        <p>此罗盘需要访问您的设备方向传感器<br>以显示正确方位</p>
        <button
          class="auth-btn auth-btn--large"
          @click="phoneOri.requestPermission()"
        >
          授权使用
        </button>
      </div>
    </div>

    <!--
      ═══ 桌面端不支持提示 ═══
    -->
    <div
      v-if="!phoneOri.isSupported.value"
      class="unsupported-overlay"
    >
      <div class="permission-card">
        <div class="permission-icon">🖥️</div>
        <h3>请在手机上使用</h3>
        <p>二十四山风水盘需要手机磁力计传感器<br>才能自动感知方向</p>
        <p class="hint">您也可以使用侧栏手动旋转盘面</p>
      </div>
    </div>

    <!--
      ═══ SVG 罗盘 ═══
    -->
    <svg
      ref="svgRef"
      class="compass-svg"
      viewBox="0 0 1200 1200"
      preserveAspectRatio="xMidYMid meet"
    >
      <g
        :transform="`translate(${600 + offsetX}, ${600 + offsetY}) scale(${zoom}) rotate(${rotationAngle})`"
      >
        <RingStack
          :outer-radius="280"
          :gap="4"
          :rings="rings"
          rotation-direction="clockwise"
        >
          <template #center="{ innerRadius }">
            <!-- 圆心区域：方向指示器 -->
            <g class="center-indicator">
              <!-- 内圆 -->
              <circle cx="0" cy="0" :r="innerRadius * 0.85" fill="none" stroke="#444" stroke-width="0.5" />
              <!-- 十字线 -->
              <line x1="0" :y1="-innerRadius * 0.7" x2="0" :y2="innerRadius * 0.7" stroke="#555" stroke-width="0.5" />
              <line :x1="-innerRadius * 0.7" y1="0" :x2="innerRadius * 0.7" y2="0" stroke="#555" stroke-width="0.5" />
              <!-- 中心点 -->
              <circle cx="0" cy="0" r="6" fill="#C62828" />
              <!-- 当前朝向度数 -->
              <text
                x="0"
                y="14"
                fill="#ccc"
                font-size="16"
                text-anchor="middle"
                dominant-baseline="middle"
                font-family="monospace"
              >
                {{ trueHeading.toFixed(0) }}°
              </text>
              <text
                x="0"
                y="-14"
                fill="#888"
                font-size="12"
                text-anchor="middle"
                dominant-baseline="middle"
              >
                {{ directionLabel }}
              </text>
            </g>
          </template>
        </RingStack>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.fengshui-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.compass-svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* ═══ 覆盖层 —— 居中遮罩 ═══ */
.level-overlay,
.permission-overlay,
.unsupported-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.65);
  z-index: 100;
  backdrop-filter: blur(4px);
}

.level-card,
.permission-card {
  text-align: center;
  padding: 32px 24px;
  border-radius: 16px;
}

.level-card h3,
.permission-card h3 {
  margin: 12px 0 8px;
  font-size: 18px;
  color: #e0d5c0;
}

.level-card p,
.permission-card p {
  margin: 4px 0;
  font-size: 14px;
  color: #a09080;
}

.level-icon,
.permission-icon {
  font-size: 48px;
}

/* ═══ 气泡水平仪 ═══ */
.level-bubble-container {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 16px auto 0;
}

.bubble-track {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.track-x {
  top: 50%;
  left: 0;
  right: 0;
  height: 6px;
  transform: translateY(-50%);
}

.track-y {
  left: 50%;
  top: 0;
  bottom: 0;
  width: 6px;
  transform: translateX(-50%);
}

.bubble {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #F9A825;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: left 0.15s ease, top 0.15s ease;
}

/* ═══ iOS 授权按钮 ═══ */
.auth-btn {
  display: block;
  width: 100%;
  margin-top: 12px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #7c4dff, #651fff);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.auth-btn:hover {
  opacity: 0.85;
}

.auth-btn--large {
  margin-top: 20px;
  padding: 14px 32px;
  font-size: 16px;
  border-radius: 12px;
}

.hint {
  font-size: 12px !important;
  opacity: 0.5;
  margin-top: 12px !important;
}

/* ═══ Sidebar Teleport 面板 ═══ */
:global(.orientation-panel) {
  padding: 12px 8px;
  font-size: 13px;
}

:global(.info-row) {
  display: grid;
  grid-template-columns: 48px 1fr;
  gap: 4px;
  margin-bottom: 6px;
}

:global(.info-label) {
  color: #888;
  font-size: 12px;
}

:global(.info-value) {
  color: #ccc;
  font-size: 13px;
}

:global(.info-value small) {
  font-size: 11px;
  opacity: 0.6;
  margin-left: 4px;
}

:global(.level-ok) {
  color: #4CAF50;
}

:global(.level-warn) {
  color: #FF9800;
}
</style>
