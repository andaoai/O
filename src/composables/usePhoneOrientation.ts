/**
 * usePhoneOrientation —— 手机朝向传感器 composable
 *
 * ═══════════════════════════════════════════════════════════════
 *  封装 DeviceOrientation API + ScreenOrientation API，
 *  提供响应式手机方位（alpha）、倾斜角（beta/gamma）、
 *  水平校准状态、iOS 权限管理、屏幕方向校正。
 *
 *  参考实现：https://github.com/injec/onlineCompass.me
 *
 *  关键改进（参考该项目的设计）：
 *    1. 非 iOS 优先使用 deviceorientationabsolute（保证绝对朝向）
 *    2. 添加屏幕方向校正（横竖屏自动补偿）
 *    3. 检查 event.absolute 标记，防止用相对值替代绝对值
 *    4. iOS webkitCompassAccuracy=0 时不回退到 event.alpha
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
  /** 磁北朝向（0-360，0=北，已考虑屏幕方向校正） */
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

/**
 * 检测当前屏幕方向角（相对于设备物理方向）
 *
 * 标准：screen.orientation.angle（CW 旋转量，从自然方向起算）
 *   0   = 竖屏（默认）
 *   90  = 横屏 CW 旋转 90° = Home 键在右
 *   180 = 倒竖屏
 *   270 = 横屏 CW 旋转 270° = Home 键在左
 *
 * 回退：window.orientation（旧 iOS/Android，convention 相反）
 *   window.orientation:  90 = Home 左 → angle 270
 *   window.orientation: -90 = Home 右 → angle 90
 */
function getScreenOrientationAngle(): number {
  if (typeof window === 'undefined') return 0
  // 优先使用标准 Screen Orientation API
  const screenOri = (screen as any).orientation
  if (screenOri?.angle !== undefined) {
    return screenOri.angle
  }
  // 回退到旧的 window.orientation（iOS ≤ 12 / 旧 Android）
  // window.orientation: 90=home左, -90=home右 → screen.orientation.angle: 90=home右, 270=home左
  if (typeof (window as any).orientation === 'number') {
    const o = (window as any).orientation
    return o === 90 ? 270 : o === -90 ? 90 : o === 180 ? 180 : 0
  }
  return 0
}

/**
 * 简易 iOS 检测（用于决定用 deviceorientation 还是 deviceorientationabsolute）
 *
 * 注意：`navigator.platform` 在 iPadOS 13+ 上返回 "MacIntel"，
 * 需额外检查 `maxTouchPoints > 1` 来识别 iPad。
 */
function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const p = navigator.platform
  return /iPad|iPhone|iPod/.test(p) ||
    (p === 'MacIntel' && navigator.maxTouchPoints > 1)
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

  /**
   * 事件处理器引用 —— 保持引用一致，确保 addEventListener / removeEventListener 匹配
   * 可以监听 deviceorientation 或 deviceorientationabsolute
   */
  let orientationHandler: ((event: DeviceOrientationEvent) => void) | null = null

  // ────────────────────────────────────────────────────────────────
  //  Heading 计算核心
  // ────────────────────────────────────────────────────────────────

  /**
   * 从原始事件计算磁北朝向（设备物理方向，未校正屏幕旋转）
   *
   * 不同平台差异：
   *   · iOS Safari:      event.webkitCompassHeading 直接给出磁北朝向（0=北 CW）
   *                      （已考虑设备三维姿态，最精确）
   *   · 非 iOS:          event.alpha 是 CCW 正方向（alpha = 360 - compass_heading）
   *                      需转换：magneticHeading = (360 - alpha) % 360
   *   · deviceorientationabsolute: 与 deviceorientation 的 alpha 格式相同
   *
   * @param event DeviceOrientation 事件（普通版或 absolute 版均可）
   * @param isIOSEvent 是否来自 iOS Safari 的 deviceorientation 事件
   * @returns 磁北朝向（0-360，0=北，CW 正方向），或 null（无有效数据）
   */
  function computeMagneticHeading(
    event: DeviceOrientationEvent,
    isIOSEvent: boolean
  ): number | null {
    const evt = event as DeviceOrientationEventIOS

    // ═══ ① iOS: webkitCompassHeading 最精确 ═══
    if (evt.webkitCompassHeading !== undefined && evt.webkitCompassHeading !== null) {
      // webkitCompassAccuracy 可选；存在且 <= 0 时数据不可靠
      if (evt.webkitCompassAccuracy !== undefined && evt.webkitCompassAccuracy <= 0) {
        return null
      }
      return evt.webkitCompassHeading
    }

    // ═══ ② 非 iOS: 从 alpha 转换 ═══
    if (event.alpha === null || event.alpha === undefined) {
      return null
    }

    // 检查 absolute 标记
    // deviceorientationabsolute 事件的 absolute 始终为 true，无需检查
    // deviceorientation 事件需要检查：absolute === false 表示 alpha 不是相对于磁北的
    if (!isIOSEvent && (event as any).type === 'deviceorientation' && event.absolute === false) {
      return null
    }

    // alpha 是逆时针（CCW: 0=北, 90=西, 180=南, 270=东）→ 转为顺时针（CW）
    return ((360 - event.alpha) % 360 + 360) % 360
  }

  /**
   * 校正屏幕方向：传感器 alpha 是相对于设备物理顶部，
   * 需减去屏幕旋转角得到屏幕顶部朝向。
   *
   * 例：
   *   竖屏（angle=0）： heading 不变
   *   横屏（angle=90）：heading -= 90（屏幕顶部 = 设备左侧）
   */
  function applyScreenOrientation(heading: number): number {
    const screenAngle = getScreenOrientationAngle()
    if (screenAngle === 0) return heading
    return ((heading - screenAngle) % 360 + 360) % 360
  }

  // ────────────────────────────────────────────────────────────────
  //  事件处理
  // ────────────────────────────────────────────────────────────────

  /** 创建统一事件处理器（闭包持有 isIOSEvent 标记） */
  function createHandler(isIOSEvent: boolean): (event: DeviceOrientationEvent) => void {
    return (event: DeviceOrientationEvent) => {
      // 1. 计算设备物理磁北朝向
      const magneticHeading = computeMagneticHeading(event, isIOSEvent)

      if (magneticHeading !== null) {
        // 2. 校正屏幕方向
        const correctedHeading = applyScreenOrientation(magneticHeading)

        // 3. 低通滤波器 + 0/360 边界处理
        if (!hasFirstValue) {
          smoothedAlpha = correctedHeading
          hasFirstValue = true
        } else {
          let diff = correctedHeading - smoothedAlpha
          if (diff > 180) diff -= 360
          else if (diff < -180) diff += 360
          smoothedAlpha = (smoothedAlpha + diff * smoothFactor + 360) % 360
        }
        alpha.value = smoothedAlpha
      }

      // 始终更新 beta/gamma（即使 alpha 无效）
      if (event.beta !== null) {
        beta.value = event.beta
      }
      if (event.gamma !== null) {
        gamma.value = event.gamma
      }
    }
  }

  /** 添加事件监听 */
  function addOrientationListener(): void {
    if (orientationHandler) return // 不重复添加

    const iOS = isIOS()

    if (iOS) {
      // iOS: 用 deviceorientation 获取 webkitCompassHeading
      orientationHandler = createHandler(true)
      window.addEventListener('deviceorientation', orientationHandler)
    } else {
      // 非 iOS: 优先用 deviceorientationabsolute（保证绝对朝向）
      // 注意：'ondeviceorientationabsolute' in window 在 TS DOM lib 中可能未定义，
      // 因此用类型守卫绕过——先赋值再添加监听
      orientationHandler = createHandler(false)
      const useAbsolute = typeof (window as any).ondeviceorientationabsolute !== 'undefined'
      const eventType = useAbsolute ? 'deviceorientationabsolute' : 'deviceorientation'
      window.addEventListener(eventType, orientationHandler)
    }
  }

  /** 移除监听 */
  function removeOrientationListener(): void {
    if (orientationHandler) {
      window.removeEventListener('deviceorientation', orientationHandler)
      window.removeEventListener('deviceorientationabsolute', orientationHandler)
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

  // ─── isLevel computed ─────────────────────────────────────

  const isLevel = computed<boolean>(() => {
    if (!isSupported.value) return false
    if (Math.abs(gamma.value) >= gammaThreshold) return false
    const b = ((beta.value % 360) + 360) % 360
    const betaFromLevel = Math.min(
      Math.min(b, 360 - b),
      Math.abs(b - 90),
      Math.abs(b - 180),
      Math.abs(b - 270),
    )
    return betaFromLevel < betaThreshold
  })

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

export default usePhoneOrientation
