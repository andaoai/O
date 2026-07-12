/**
 * usePhoneOrientation —— 手机朝向传感器 composable
 *
 * ═══════════════════════════════════════════════════════════════
 *  封装 DeviceOrientation API，提供手机方位（alpha）、倾斜角（beta/gamma）、
 *  水平校准状态、iOS 权限管理。风水平盘专用，要求手机水平放置时方向最准。
 *
 *  设计取舍：
 *    1. **永不为 NaN**：SSR / 不支持设备上所有值回退到 0，isSupported 为 false
 *    2. **低通滤波器**：alpha 原始数据抖动可达 ±10°，用 IIR 一阶滤波平滑
 *    3. **iOS 13+ 权限**：需用户手势触发 `requestPermission()`，返回 'granted'/'denied'
 *    4. **水平检测**：|beta-90| < threshold && |gamma| < threshold 判定"已水平"
 *    5. **SSR 安全**：typeof window guard，不会在构建时崩溃
 * ═══════════════════════════════════════════════════════════════
 */

import { ref, computed, readonly, onMounted, onUnmounted, type Ref, type DeepReadonly } from 'vue'

/**
 * iOS Safari 非标准扩展属性
 * webkitCompassHeading: 磁北朝向（0=北，CW 正方向），比 event.alpha 精确
 * webkitCompassAccuracy: 精度（度），> 0 表示数据有效
 */
interface DeviceOrientationEventIOS extends DeviceOrientationEvent {
  webkitCompassHeading?: number
  webkitCompassAccuracy?: number
}

/** 权限状态 */
export type PermissionStatus = 'unknown' | 'granted' | 'denied' | 'unsupported'

/** 配置选项 */
export interface UsePhoneOrientationOptions {
  /** 水平判定的前后倾斜容差（度），默认 15 */
  betaThreshold?: number
  /** 水平判定的左右倾斜容差（度），默认 15 */
  gammaThreshold?: number
  /** 低通滤波器系数（0-1），越大越平滑但响应越慢，默认 0.3 */
  smoothFactor?: number
  /** 组件挂载后是否自动开始监听（默认 true） */
  autoStart?: boolean
}

export interface UsePhoneOrientationReturn {
  /** 磁北朝向（0-360，0=北，磁偏角未修正） */
  alpha: DeepReadonly<Ref<number>>
  /** 前后倾斜（度），水平=90。范围 -180~180 */
  beta: DeepReadonly<Ref<number>>
  /** 左右倾斜（度），水平=0。范围 -90~90 */
  gamma: DeepReadonly<Ref<number>>
  /** 是否水平（|beta-90| < threshold && |gamma| < threshold） */
  isLevel: DeepReadonly<Ref<boolean>>
  /** 设备是否支持 DeviceOrientation API */
  isSupported: DeepReadonly<Ref<boolean>>
  /** iOS 13+ 是否需要权限请求 */
  needsPermission: DeepReadonly<Ref<boolean>>
  /** 权限状态 */
  permissionStatus: DeepReadonly<Ref<PermissionStatus>>
  /** 请求权限（iOS 13+ 需用户手势触发） */
  requestPermission: () => Promise<void>
  /** 开始监听传感器 */
  start: () => void
  /** 停止监听传感器 */
  stop: () => void
}

/** 检测 DeviceOrientationEvent 是否需要 requestPermission（iOS 13+） */
function deviceNeedsPermission(): boolean {
  if (typeof window === 'undefined') return false
  const api = (window as any).DeviceOrientationEvent
  return typeof api?.requestPermission === 'function'
}

/** 检测设备是否支持 DeviceOrientation */
function deviceIsSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'DeviceOrientationEvent' in window
}

export const usePhoneOrientation = (
  options: UsePhoneOrientationOptions = {}
): UsePhoneOrientationReturn => {
  const {
    betaThreshold = 15,
    gammaThreshold = 15,
    smoothFactor = 0.3,
    autoStart = true
  } = options

  const alpha = ref<number>(0)
  const beta = ref<number>(90)
  const gamma = ref<number>(0)
  const isSupported = ref<boolean>(deviceIsSupported())
  const needsPermission = ref<boolean>(deviceNeedsPermission())
  const permissionStatus = ref<PermissionStatus>(
    needsPermission.value ? 'unknown' : 'granted'
  )

  /** 低通滤波器：上次平滑值 */
  let smoothedAlpha = 0
  let hasFirstValue = false

  /** DeviceOrientation 事件处理器 */
  let orientationHandler: ((event: DeviceOrientationEvent) => void) | null = null

  const isLevel = computed<boolean>(() => {
    if (!isSupported.value) return false
    // 左右倾斜(gamma)必须接近0°——所有设备通用
    if (Math.abs(gamma.value) >= gammaThreshold) return false

    // 前后倾斜(beta)在不同设备/浏览器上水平时的值不同：
    //   · Chrome Android:  水平 ≈ 0°
    //   · iOS Safari:      水平 ≈ 90°
    //   · 部分设备:        水平 ≈ -90°（即 270°）
    //   · 倒置时:          水平 ≈ 180°（极少见）
    //
    // 算法：归一化 beta 到 [0, 360)，分别计算到 4 个候选基准
    // （0°/90°/180°/270°）的最短距离，取最小值与阈值比较。
    // 这比假设单一"水平值"（如 90°）更通用。
    const b = ((beta.value % 360) + 360) % 360
    const betaFromLevel = Math.min(
      Math.min(b, 360 - b),  // 到 0°（圆周最短距离）
      Math.abs(b - 90),      // 到 90°
      Math.abs(b - 180),     // 到 180°
      Math.abs(b - 270),     // 到 270°（≡ -90°）
    )
    return betaFromLevel < betaThreshold
  })

  /**
   * 将原始传感器事件中的 alpha 转换为磁北朝向
   *
   * 不同平台差异：
   *   · iOS Safari:      event.webkitCompassHeading 直接给出磁北朝向（0=北 CW）
   *                      原生 event.alpha 是 game-relative，不可用作方向
   *   · Chrome Android:  event.alpha 是 CCW 正方向（alpha = 360 - compass_heading）
   *                      需要转换：magneticHeading = (360 - alpha) % 360
   *   · Firefox Android: 同上
   *
   * @returns 磁北朝向（0-360，0=北，CW 正方向），或 null（无数据）
   */
  function rawAlphaToMagnetic(event: DeviceOrientationEvent): number | null {
    // iOS 非标准扩展
    const evt = event as DeviceOrientationEventIOS

    // ① iOS: webkitCompassHeading 最精确
    if (evt.webkitCompassHeading !== undefined && evt.webkitCompassHeading !== null) {
      // webkitCompassAccuracy 可选，存在时要求 > 0
      if (evt.webkitCompassAccuracy === undefined || evt.webkitCompassAccuracy > 0) {
        return evt.webkitCompassHeading
      }
    }

    // ② Android / 其他: raw alpha 是 CCW 方向，需转换
    if (event.alpha !== null) {
      return ((360 - event.alpha) % 360 + 360) % 360
    }

    return null
  }

  /** 监听 DeviceOrientation */
  function addOrientationListener(): void {
    if (orientationHandler) return // 不重复添加

    orientationHandler = (event: DeviceOrientationEvent) => {
      // alpha: 0=北, 90=东, 180=南, 270=西
      const magneticHeading = rawAlphaToMagnetic(event)
      if (magneticHeading !== null) {
        if (!hasFirstValue) {
          smoothedAlpha = magneticHeading
          hasFirstValue = true
        } else {
          // 低通滤波器：一阶 IIR（指数移动平均）
          // 处理 360°→0° 跨越：用 diff 的最短路径（而非 raw 差值）
          // 如 355°→5°，raw diff = -350°，最短路径 = +10°
          let diff = magneticHeading - smoothedAlpha
          if (diff > 180) diff -= 360
          else if (diff < -180) diff += 360
          // 平滑：new_value = prev + diff × smoothFactor，再归一化
          smoothedAlpha = (smoothedAlpha + diff * smoothFactor + 360) % 360
        }
        alpha.value = smoothedAlpha
      }
      if (event.beta !== null) {
        beta.value = event.beta
      }
      if (event.gamma !== null) {
        gamma.value = event.gamma
      }
    }

    window.addEventListener('deviceorientation', orientationHandler)
  }

  /** 移除监听 */
  function removeOrientationListener(): void {
    if (orientationHandler) {
      window.removeEventListener('deviceorientation', orientationHandler)
      orientationHandler = null
    }
    hasFirstValue = false
  }

  /** 开始监听 */
  function start(): void {
    if (!isSupported.value) return
    addOrientationListener()
  }

  /** 停止监听 */
  function stop(): void {
    removeOrientationListener()
  }

  /** iOS 13+ 请求权限 */
  async function requestPermission(): Promise<void> {
    if (typeof window === 'undefined') return
    const api = (window as any).DeviceOrientationEvent
    if (typeof api?.requestPermission !== 'function') {
      permissionStatus.value = 'granted'
      start()
      return
    }

    try {
      const result = await api.requestPermission()
      if (result === 'granted') {
        permissionStatus.value = 'granted'
        start()
      } else {
        permissionStatus.value = 'denied'
      }
    } catch {
      permissionStatus.value = 'denied'
    }
  }

  // SSR 安全：onMounted 中启动
  onMounted(() => {
    isSupported.value = deviceIsSupported()
    needsPermission.value = deviceNeedsPermission()
    permissionStatus.value = needsPermission.value ? 'unknown' : 'granted'

    if (autoStart && isSupported.value && !needsPermission.value) {
      start()
    }
  })

  onUnmounted(() => {
    stop()
  })

  return {
    alpha: readonly(alpha),
    beta: readonly(beta),
    gamma: readonly(gamma),
    isLevel: readonly(isLevel),
    isSupported: readonly(isSupported),
    needsPermission: readonly(needsPermission),
    permissionStatus: readonly(permissionStatus),
    requestPermission,
    start,
    stop
  }
}
