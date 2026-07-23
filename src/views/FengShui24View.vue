<script setup lang="ts">
/**
 * 二十四山风水盘 — 主视图
 *
 * ═══════════════════════════════════════════════════════════════
 *  手机端风水罗盘，核心交互：
 *    1. 利用 DeviceOrientation API 获取手机磁北朝向
 *    2. 利用 useGeolocation 获取 GPS 定位（watchPosition 持续追踪）
 *    3.   permissions API 智能检测权限状态，自动/手动触发
 *    4. WMM 地磁模型自动校正磁偏角→得到真北朝向
 *    5. 整盘跟随手机旋转，方位始终正确
 *
 *  ⚠️ 定位与传感器授权分离
 *     · 定位权限通过独立"需要位置"遮罩引导用户点击授权
 *     · 传感器（DeviceOrientation）权限通过独立"授权使用传感器"按钮
 *     · 两者互不依赖，任一失败不影响对方功能
 *
 *  五层架构映射：
 *    Layer 2: 本视图 — 组合编排层
 *    Layer 3: TwentyFourMountainsRing
 *    Layer 4: DataRing / RingStack
 *    Layer 5: geometry.ts
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
import TwentyFourMountainsRing from '@/components/rings/fengshui24/TwentyFourMountainsRing.vue'
import { normalizeAngle } from '@/utils/geometry'

// ─── 时间源 ─────────────────────────────────────────────
const { controlledTime } = useUrlTime()

// ─── 地理位置（watchPosition 持续追踪） ──────────────────
const geo = useGeolocation({
  lat: 34.65,
  lon: 112.45,
  watch: true,                  // 持续追踪，用户走动时自动更新
  enableHighAccuracy: true,      // 罗盘需要高精度
  throttleMs: 2000,              // 2 秒节流，平衡精度与省电
})
const { latitude, longitude, accuracy, status: geoStatus, error: geoError,
        permissionState: geoPermission, needsPermission: geoNeedsPermission,
        isFallback: geoIsFallback, request: geoRequest, reposition: geoReposition } = geo

// ─── 手机朝向传感器 ─────────────────────────────────────
const phoneOri = usePhoneOrientation()

// ─── 磁偏角 ─────────────────────────────────────────────
const magDecl = useMagneticDeclination({
  latitude,
  longitude,
  time: controlledTime
})

/** 真北朝向 = 屏幕校正磁北朝向 + 磁偏角 */
const trueHeading = computed(() =>
  normalizeAngle(phoneOri.alpha.value + magDecl.declination.value)
)

// ─── 视口 ────────────────────────────────────────────────
const viewport = useViewport({ rotationAngle: 0 })
const { zoom, offsetX, offsetY, rotationAngle } = viewport

/**
 * 自动旋转：手机朝向变化 → 盘面跟随
 *
 * 公式：rotationAngle = (360 - trueHeading) % 360（经 ROTATION_SMOOTH 平滑）
 *
 * 原理：
 *   二十四山数据已通过 startDegree: -90 让子(北)对齐 SVG 正上（12 点）。
 *   盘面 rotate(θ) 顺时针旋转 θ 度后，屏幕正上方指向的方位 = (360 - θ)°。
 *   因此要使屏幕正上方 = 手机朝向，需要 360 - rotationAngle = trueHeading，
 *   即 rotationAngle = 360 - trueHeading。
 *
 *   效果：
 *   · 手机朝北（trueHeading=0）  → rotationAngle ≈ 0   → 顶部指向 0°（北）✓
 *   · 手机朝东（trueHeading=90） → rotationAngle ≈ 270 → 顶部指向 90°（东）✓
 *   · 手机朝南（trueHeading=180）→ rotationAngle ≈ 180 → 顶部指向 180°（南）✓
 *   · 手机朝西（trueHeading=270）→ rotationAngle ≈ 90  → 顶部指向 270°（西）✓
 *
 * 平滑系数 ROTATION_SMOOTH=0.7 避免角度硬跳（梯度平滑，非均值滤波）。
 * 仅在手机水平时更新，防止倾斜时的 alpha 读数漂移。
 */
const ROTATION_SMOOTH = 0.7
watch(trueHeading, (heading) => {
  // 仅在手机水平时追迹，防止倾斜时的读数漂移
  if (phoneOri.isLevel.value) {
    // 屏幕正上方指向手机真北朝向：rotationAngle = 360 - trueHeading
    // 因为 SVG 中 rotate(θ) 顺时针旋转盘面，当 θ=0 时子(北)在顶部，
    // 盘面旋转 θ 度后，顶部对应方位 = (360 - θ)，需要等于 trueHeading
    const target = (360 - heading) % 360
    const current = rotationAngle.value
    let diff = target - current
    if (diff > 180) diff -= 360
    else if (diff < -180) diff += 360
    viewport.updateRotationAngle(current + diff * ROTATION_SMOOTH)
  }
})

// ─── 环配置（外→内） ─────────────────────────────────
const rings = computed(() => [
  {
    component: markRaw(TwentyFourMountainsRing),
    thickness: 60,
    props: {},
  },
])

// ─── CompassContext（供 Sidebar 读取） ────────────────
provideCompassContext({ time: controlledTime, viewport })

// ─── SVG ref ────────────────────────────────────────────
const svgRef = ref<SVGSVGElement | null>(null)

/**
 * 圆心显示角度 = 屏幕正上方指向的地理方位
 *
 * 盘面每顺时针旋转 θ 度，顶部展示的方位 = (360 - θ)°。
 * 因为 rotationAngle = (360 - trueHeading) % 360，
 * 所以 displayHeading = normalizeAngle(360 - rotationAngle) = trueHeading。
 *
 * 示例：
 *   trueHeading=0（手机朝北）→ rotationAngle=0 → displayHeading=0 → 圆心显示 "0° 北" ✓
 *   trueHeading=90（手机朝东）→ rotationAngle=270 → displayHeading=90 → 圆心显示 "90° 东" ✓
 */
const displayHeading = computed(() => normalizeAngle(360 - rotationAngle.value))

/** 当前朝向中文名 */
const directionLabel = computed(() => headingToChinese(displayHeading.value))

// ─── 水平气泡偏差（beta 取最接近的"水平"基准） ─────────
/**
 * 计算手机前后倾斜 (beta) 距离最近水平基准（0°/90°/180°/270°）的偏差。
 *
 * 不同设备和浏览器上"水平"时的 beta 值不同：
 *   · Chrome Android:  水平时 beta ≈ 0°
 *   · iOS Safari:      水平时 beta ≈ 90°（屏幕朝上平躺）
 *   · 部分设备:        beta ≈ -90°（即 270°）
 *   · 倒置:            beta ≈ 180°
 *
 * 算法：
 *   1. 将 beta 归一化到 [0, 360)
 *   2. 计算到 4 个候选基准（0/90/180/270）的距离
 *   3. 取最近基准的差值（带符号，显示用户需倾斜多少度才能水平）
 *
 * 用于水平校准 overlay 中的气泡位置和"前后 X°"提示。
 */
const betaDeviation = computed(() => {
  const b = phoneOri.beta.value
  const bn = ((b % 360) + 360) % 360
  const devs = [bn, Math.abs(bn - 90), Math.abs(bn - 180), Math.abs(bn - 270)]
  const minDev = Math.min(...devs)
  const idx = devs.indexOf(minDev)
  const base = [0, 90, 180, 270][idx]!
  return b - base
})

// ─── 定位标签（兼顾超长精度值） ─────────────────────────
const geoLabel = computed(() => {
  switch (geoStatus.value) {
    case 'pending': return { text: '定位中…', icon: '📡' }
    case 'success': {
      const acc = accuracy.value
      const accText = acc !== null && acc < 1000
        ? ` ±${acc.toFixed(0)}m`
        : acc !== null
          ? ` ±${(acc / 1000).toFixed(1)}km`
          : ''
      return {
        text: `${latitude.value.toFixed(4)}°N, ${longitude.value.toFixed(4)}°E${accText}`,
        icon: '📍'
      }
    }
    case 'denied':  return { text: '位置未获取', icon: '🚫' }
    default:        return { text: '等待定位…', icon: '📍' }
  }
})

/** 定位是否就绪（success 状态） */
const geoReady = computed(() => geoStatus.value === 'success')

// ─── 遮罩优先级（互斥，高→低） ──────────────────────────
/**
 * 遮罩优先级体系（高→低，一个遮罩显示时排他隐藏低优先级）：
 *
 * 1. 🖥️ 桌面端不支持传感器
 *    显示器/笔记本没有 DeviceOrientation 硬件，不显示本页内容。
 *
 * 2. 📱 iOS 传感器授权（needsPermission = true）
 *    iOS 13+ 需要用户手势调用 DeviceOrientationEvent.requestPermission()
 *    才能接收 alpha/beta/gamma 数据。
 *
 * 3. 📐 水平校准（isLevel = false）
 *    传感器已工作，但手机倾斜过大时 alpha 读数不可靠，
 *    要求用户将手机平放后再使用。
 *
 * 4. 📍 定位权限（geoNeedsPermission = true）
 *    最低优先级——即使用户没授权定位，盘面仍可旋转，
 *    磁偏角计算回退到 fallback 默认位置坐标（洛阳附近）。
 *    此遮罩使用半透明背景（overlay--transparent），盘面可见。
 */
const showDesktopUnsupported = computed(() => !phoneOri.isSupported.value)
const showOrientationPermission = computed(() =>
  phoneOri.isSupported.value
  && phoneOri.needsPermission.value
  && phoneOri.permissionStatus.value === 'unknown'
)
const showLevelCalibration = computed(() =>
  phoneOri.isSupported.value
  && !phoneOri.isLevel.value
  && phoneOri.permissionStatus.value === 'granted'
  && !showOrientationPermission.value
)
/** 用户跳过了定位授权 */
const geoPermissionSkipped = ref(false)

const showGeoPermission = computed(() =>
  phoneOri.isSupported.value
  && geoNeedsPermission.value
  && geoStatus.value !== 'pending'
  && !showOrientationPermission.value
  && !showDesktopUnsupported.value
  && !geoPermissionSkipped.value
)
</script>

<template>
  <div class="fengshui-container">
    <!--
      ═══ 手机朝向信息：Teleport 到 Sidebar 视图选项 ═══
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
            {{ phoneOri.isLevel.value ? '✅ 已校准' : '⚠️ 请水平放置' }}
          </span>
        </div>

        <!-- 磁偏角 -->
        <div class="info-row" v-if="magDecl.isReady.value">
          <span class="info-label">磁偏角</span>
          <span class="info-value">
            {{ magDecl.declination.value >= 0 ? '+' : '' }}{{ magDecl.declination.value.toFixed(1) }}°
            <small>真北 {{ magDecl.declination.value > 0 ? '偏东' : '偏西' }}</small>
          </span>
        </div>

        <!-- 定位信息 -->
        <div class="info-row">
          <span class="info-label">定位</span>
          <span class="info-value">
            <template v-if="geoReady">
              <span class="geo-ok">{{ geoLabel.icon }}</span>
              {{ geoLabel.text }}
            </template>
            <template v-else-if="geoStatus === 'pending'">
              📡 定位中…
            </template>
            <template v-else>
              <span class="geo-warn">🚫</span>
              {{ geoLabel.text }}
            </template>
          </span>
        </div>

        <!-- 重新定位按钮（失败/fallback 时显示） -->
        <button
          v-if="geoIsFallback && geoStatus !== 'pending'"
          class="retry-btn"
          @click="geoReposition()"
        >
          🔄 重新定位
        </button>
      </div>
    </Teleport>

    <!-- ═══════════════════════════════════════════════════
         ═══  叠加层（按优先级从高到低）  ═══
         ═══════════════════════════════════════════════════ -->

    <!-- 1. 桌面端不支持 -->
    <div
      v-if="showDesktopUnsupported"
      class="overlay"
    >
      <div class="overlay-card">
        <div class="overlay-icon">🖥️</div>
        <h3>请在手机上使用</h3>
        <p>二十四山风水盘需要手机磁力计传感器<br>才能自动感知方向</p>
        <p class="hint">您也可以使用侧栏手动旋转盘面</p>
      </div>
    </div>

    <!-- 2. iOS 传感器授权 -->
    <div
      v-else-if="showOrientationPermission"
      class="overlay"
    >
      <div class="overlay-card">
        <div class="overlay-icon">🧭</div>
        <h3>使用方向传感器</h3>
        <p>此罗盘需要访问您的设备方向传感器<br>以显示正确方位</p>
        <button
          class="action-btn action-btn--primary"
          @click="phoneOri.requestPermission()"
        >
          授权使用
        </button>
      </div>
    </div>

    <!-- 3. 水平校准 -->
    <div
      v-else-if="showLevelCalibration"
      class="overlay"
    >
      <div class="overlay-card">
        <div class="overlay-icon">📐</div>
        <h3>请将手机水平放置</h3>
        <p>前后 {{ betaDeviation.toFixed(0) }}° &nbsp; 左右 {{ phoneOri.gamma.value.toFixed(0) }}°</p>
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
              :style="{ top: `${Math.max(0, Math.min(100, (betaDeviation / -30 * 50 + 50)))}%` }"
            />
          </div>
        </div>
        <p class="hint">水平后自动关闭</p>
      </div>
    </div>

    <!-- 4. 定位权限授权（最低优先级，允许穿透看到盘面） -->
    <div
      v-if="showGeoPermission"
      class="overlay overlay--transparent"
    >
      <div class="overlay-card overlay-card--compact">
        <div class="overlay-icon">📍</div>
        <h3>获取您的位置</h3>
        <p class="desc">用于计算磁偏角修正和太阳精确方位</p>

        <!-- 显示之前被拒绝的历史 -->
        <p v-if="geoPermission === 'denied'" class="geo-denied-hint">
          ⚠️ 定位权限已被拒绝，请在浏览器地址栏左侧<br>重新允许「位置」访问
        </p>

        <button
          class="action-btn action-btn--primary"
          @click="geoRequest()"
        >
          允许获取位置
        </button>
        <button
          class="action-btn action-btn--ghost"
          @click="geoPermissionSkipped = true"
        >
          跳过，使用默认位置
        </button>
      </div>
    </div>

    <!-- ═══ 位置状态浮动指示器（不遮挡罗盘） ═══ -->
    <div
      v-if="phoneOri.isSupported.value && !showOrientationPermission && !showDesktopUnsupported"
      class="geo-badge"
      :class="{ 'geo-badge--ready': geoReady, 'geo-badge--pending': geoStatus === 'pending' }"
    >
      <span class="geo-badge-icon">{{ geoLabel.icon }}</span>
      <span class="geo-badge-text">{{ geoLabel.text }}</span>
      <!-- 定位成功后显示磁偏角摘要 -->
      <span v-if="geoReady && magDecl.isReady.value" class="geo-badge-decl">
        · 磁偏 {{ magDecl.declination.value.toFixed(1) }}°
      </span>
      <!-- pending 时的小动画 -->
      <span v-if="geoStatus === 'pending'" class="geo-badge-spinner"></span>
    </div>

    <!--
      ═══ SVG 罗盘 ═══

      坐标映射说明：
      · SVG viewBox 1200×1200，中心在 (600, 600)
      · SVG 坐标系：0° = 正右（3 点钟），顺时针递增（y 轴向下）
      · 二十四山数据中 子=0°=正北，通过 startDegree: -90 映射到 SVG 270°（正上）
      · 整个盘面组由 rotationAngle 旋转：盘面旋转 theta° = 屏幕正上方位角 θ
        （因为旋转了盘面，屏幕顶部就指向了 θ 度方向）
      · #center 组的指示器反旋（-rotationAngle）保持文字正立

      注意：定位权限遮罩是 overlay--transparent，盘面在定位提示下仍可见
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
            <!-- 圆心区域：方向指示器（反旋保持屏幕正立） -->
            <g class="center-indicator" :transform="`rotate(${-rotationAngle})`">
              <circle cx="0" cy="0" :r="innerRadius * 0.85" fill="none" stroke="#444" stroke-width="0.5" />
              <line x1="0" :y1="-innerRadius * 0.7" x2="0" :y2="innerRadius * 0.7" stroke="#555" stroke-width="0.5" />
              <line :x1="-innerRadius * 0.7" y1="0" :x2="innerRadius * 0.7" y2="0" stroke="#555" stroke-width="0.5" />
              <circle cx="0" cy="0" r="6" fill="#C62828" />
              <text
                x="0"
                y="14"
                fill="#ccc"
                font-size="16"
                text-anchor="middle"
                dominant-baseline="middle"
                font-family="monospace"
              >
                {{ displayHeading.toFixed(0) }}°
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

/* ═══════════════════════════════════════════════════════
   ═══  覆盖层体系  ═══
   ═══════════════════════════════════════════════════════ */
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.65);
  z-index: 100;
  backdrop-filter: blur(4px);
}

/** 半透明层：定位授权遮罩使用，盘面仍然可见 */
.overlay--transparent {
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(2px);
}

.overlay-card {
  text-align: center;
  padding: 32px 24px;
  border-radius: 16px;
  max-width: 320px;
}

.overlay-card--compact {
  padding: 24px 20px;
}

.overlay-card h3 {
  margin: 12px 0 8px;
  font-size: 18px;
  color: #e0d5c0;
}

.overlay-card p {
  margin: 4px 0;
  font-size: 14px;
  color: #a09080;
}

.overlay-card .desc {
  margin-bottom: 16px;
  line-height: 1.5;
}

.overlay-icon {
  font-size: 48px;
}

.geo-denied-hint {
  font-size: 12px !important;
  color: #FF9800 !important;
  margin-bottom: 12px !important;
  line-height: 1.5;
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

/* ═══ 通用按钮 ═══ */
.action-btn {
  display: block;
  width: 100%;
  margin-top: 10px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s;
}
.action-btn:hover {
  opacity: 0.85;
}

.action-btn--primary {
  background: linear-gradient(135deg, #7c4dff, #651fff);
  color: #fff;
}

.action-btn--ghost {
  background: transparent;
  color: #888;
  font-size: 12px;
}
.action-btn--ghost:hover {
  color: #ccc;
}

.hint {
  font-size: 12px !important;
  opacity: 0.5;
  margin-top: 12px !important;
}

/* ═══ 浮动定位状态指示器 ═══
     置于屏幕左上角，不遮挡罗盘盘面 */
.geo-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  font-size: 11px;
  color: #999;
  z-index: 50;
  pointer-events: none;
  user-select: none;
  white-space: nowrap;
  transition: color 0.3s, background 0.3s;
}

.geo-badge--ready {
  color: #81C784;
  background: rgba(0, 0, 0, 0.5);
}

.geo-badge--pending {
  color: #FFD54A;
}

.geo-badge-icon {
  font-size: 13px;
}

.geo-badge-decl {
  color: #888;
  font-size: 10px;
}

/* 定位中的小旋转动画 */
.geo-badge-spinner {
  display: inline-block;
  width: 10px;
  height: 10px;
  border: 2px solid transparent;
  border-top-color: #FFD54A;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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
  overflow: hidden;
  text-overflow: ellipsis;
}

:global(.info-value small) {
  font-size: 11px;
  opacity: 0.6;
  margin-left: 4px;
}

:global(.level-ok) { color: #4CAF50; }
:global(.level-warn) { color: #FF9800; }
:global(.geo-ok) { font-size: 12px; }
:global(.geo-warn) { font-size: 12px; }

/* 重新定位按钮 */
:global(.retry-btn) {
  display: block;
  width: 100%;
  margin-top: 8px;
  padding: 6px 12px;
  border: 1px solid #444;
  border-radius: 6px;
  background: transparent;
  color: #aaa;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
:global(.retry-btn:hover) {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}
</style>
