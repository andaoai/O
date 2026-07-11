/**
 * useGeolocation —— 浏览器地理定位 composable
 *
 * ═══════════════════════════════════════════════════════════════
 *  封装 navigator.geolocation，提供响应式位置状态。
 *
 *  核心设计：
 *    1. **永不为 null**：latitude/longitude 一开始就用 fallback 填充，
 *       避免下游组件写一堆 ?? DEFAULT。用户没授权时，整盘直接用 fallback 渲染。
 *    2. **watchPosition 模式**：业界通常使用持续追踪（而非单次 getCurrentPosition），
 *       这样用户走动时磁偏角和太阳位置都能自动更新。
 *    3. **权限感知**：通过 navigator.permissions.query 检测权限状态，
 *       支持 iOS/Android 上"已拒绝"状态的检测。
 *    4. **SSR 安全**：typeof navigator guard，不会在构建时崩溃。
 *    5. **显式授权**：不自动弹出权限框——由业务层在合适的时机
 *       （用户点击"授权位置"按钮后）调用 request/reposition。
 *       这与 iOS DeviceOrientation 授权模式保持一致。
 * ═══════════════════════════════════════════════════════════════
 */

import { ref, computed, readonly, watch, type Ref, type DeepReadonly } from 'vue'

/** 地理定位状态机 */
export type GeolocationStatus = 'idle' | 'pending' | 'success' | 'denied'

/** 权限状态（扩展：支持浏览器 permissions API 检测） */
export type GeolocationPermissionState = 'unknown' | 'granted' | 'denied' | 'unsupported'

/** 位置坐标 */
export interface Position {
  latitude: number
  longitude: number
  accuracy: number        /** 精度（米），watchPosition 每次更新都会带 */
  altitude: number | null
  altitudeAccuracy: number | null
  heading: number | null  /** 设备移动方向（度），与罗盘 alpha 不同 */
  speed: number | null
}

/** 单次配置 */
export interface UseGeolocationOptions {
  /** fallback 纬度（度，北正南负）——用户拒绝或不支持时使用 */
  lat: number
  /** fallback 经度（度，东正西负）——用户拒绝或不支持时使用 */
  lon: number
  /**
   * 是否使用 watchPosition 持续追踪位置（默认 true）。
   * true  → watchPosition：用户走动时自动更新，适合导航/罗盘
   * false → getCurrentPosition：单次获取，适合静态页
   */
  watch?: boolean
  /** 位置更新最小间隔（毫秒，默认 1000） */
  throttleMs?: number
  /** 地理位置精度（默认 false，省电优先） */
  enableHighAccuracy?: boolean
  /** 超时（毫秒，默认 10000） */
  timeoutMs?: number
  /** 缓存最大寿命（毫秒，默认 0 = 不使用缓存，保证每次都是最新位置） */
  maximumAgeMs?: number
}

export interface UseGeolocationReturn {
  /** 当前纬度（度） · 一开始就是 fallback，永不为 null */
  latitude: DeepReadonly<Ref<number>>
  /** 当前经度（度） */
  longitude: DeepReadonly<Ref<number>>
  /** 完整位置信息（含精度/航向等），仅在 success 时有意义 */
  position: DeepReadonly<Ref<Position | null>>
  /** 状态机 */
  status: DeepReadonly<Ref<GeolocationStatus>>
  /** 权限状态（通过 permissions API 查询） */
  permissionState: DeepReadonly<Ref<GeolocationPermissionState>>
  /** 是否需要请求权限（iOS 上需要用户手势） */
  needsPermission: DeepReadonly<Ref<boolean>>
  /** 是否使用了 fallback 位置（未授权或失败） */
  isFallback: DeepReadonly<Ref<boolean>>
  /** 定位精度（米） */
  accuracy: DeepReadonly<Ref<number | null>>
  /** 失败/拒绝时的错误消息 */
  error: DeepReadonly<Ref<string | null>>
  /** 请求定位——用户手势触发（类似 iOS DeviceOrientation requestPermission） */
  request: () => void
  /** 重新定位（已授权状态下重新获取一次位置） */
  reposition: () => void
  /** 停止持续追踪（watchPosition 模式下） */
  stop: () => void
}

/**
 * 检测浏览器是否支持 navigator.permissions 查询地理定位
 */
function permissionsQuerySupported(): boolean {
  if (typeof navigator === 'undefined') return false
  return typeof navigator.permissions?.query === 'function'
}

/**
 * 查询当前地理定位权限状态
 */
async function queryPermissionState(): Promise<GeolocationPermissionState> {
  if (typeof navigator === 'undefined') return 'unsupported'
  if (!navigator.permissions?.query) return 'unsupported'
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' })
    switch (result.state) {
      case 'granted':  return 'granted'
      case 'denied':   return 'denied'
      default:         return 'unknown'   // 'prompt'
    }
  } catch {
    return 'unsupported'
  }
}

export const useGeolocation = (options: UseGeolocationOptions): UseGeolocationReturn => {
  const {
    lat: fallbackLat,
    lon: fallbackLon,
    watch: useWatch = true,
    throttleMs = 1000,
    enableHighAccuracy = false,
    timeoutMs = 10000,
    maximumAgeMs = 0
  } = options

  // ─── 核心状态 ─────────────────────────────────────────────
  const latitude = ref<number>(fallbackLat)
  const longitude = ref<number>(fallbackLon)
  const position = ref<Position | null>(null)
  const status = ref<GeolocationStatus>('idle')
  const permissionState = ref<GeolocationPermissionState>('unknown')
  const isFallback = ref<boolean>(true)
  const error = ref<string | null>(null)

  // ─── watchPosition 内部状态 ───────────────────────────────
  let watchId: number | null = null
  let lastUpdateTime = 0

  /** 更新位置 & 状态 */
  function updatePosition(pos: GeolocationPosition): void {
    const now = Date.now()
    if (now - lastUpdateTime < throttleMs) return  // 节流
    lastUpdateTime = now

    latitude.value = pos.coords.latitude
    longitude.value = pos.coords.longitude
    position.value = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      altitude: pos.coords.altitude,
      altitudeAccuracy: pos.coords.altitudeAccuracy,
      heading: pos.coords.heading,
      speed: pos.coords.speed,
    }
    status.value = 'success'
    isFallback.value = false
    permissionState.value = 'granted'
    error.value = null
  }

  function handleError(err: GeolocationPositionError): void {
    status.value = 'denied'
    isFallback.value = true
    switch (err.code) {
      case err.PERMISSION_DENIED:
        permissionState.value = 'denied'
        error.value = '已拒绝定位权限\n请在浏览器设置中允许位置访问后重试'
        break
      case err.POSITION_UNAVAILABLE:
        error.value = '暂时无法获取位置，使用默认位置'
        break
      case err.TIMEOUT:
        error.value = '定位超时，使用默认位置'
        break
      default:
        error.value = '定位失败，使用默认位置'
    }
  }

  // ─── 请求定位（可被用户手势触发） ─────────────────────────
  const request = () => {
    // SSR / 老浏览器安全兜底
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      status.value = 'denied'
      permissionState.value = 'unsupported'
      error.value = '当前环境不支持地理定位'
      return
    }

    // 先移除旧的 watch（如果有）
    stop()

    status.value = 'pending'
    error.value = null

    if (useWatch) {
      // ─── 业界标准：watchPosition 持续追踪 ──────────────
      watchId = navigator.geolocation.watchPosition(
        updatePosition,
        handleError,
        {
          enableHighAccuracy,
          timeout: timeoutMs,
          maximumAge: maximumAgeMs
        }
      )
    } else {
      // ─── 单次获取 ───────────────────────────────────────
      navigator.geolocation.getCurrentPosition(
        updatePosition,
        handleError,
        {
          enableHighAccuracy,
          timeout: timeoutMs,
          maximumAge: maximumAgeMs
        }
      )
    }
  }

  /** 重新定位（重置状态后重新请求） */
  const reposition = () => {
    // 如果之前是单次模式，重新发起一次 getCurrentPosition
    if (!useWatch) {
      navigator.geolocation.getCurrentPosition(
        updatePosition,
        handleError,
        { enableHighAccuracy, timeout: timeoutMs, maximumAge: maximumAgeMs }
      )
      return
    }
    // watchPosition 模式下：重新启动 watch
    request()
  }

  /** 停止持续追踪 */
  const stop = () => {
    if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId)
      watchId = null
    }
  }

  // ─── 自动查询权限状态（不弹框） ───────────────────────────
  if (permissionsQuerySupported()) {
    queryPermissionState().then(state => {
      permissionState.value = state
      // 如果已经授权且状态为 idle，自动发起定位
      if (state === 'granted' && status.value === 'idle') {
        request()
      }
    })
  }

  // ─── 精度可读 ref ────────────────────────────────────────
  const accuracy = computed(() => position.value?.accuracy ?? null)

  // ─── 是否需要权限请求（iOS 或权限未决） ──────────────────
  const needsPermission = computed(() =>
    permissionState.value === 'unknown' || permissionState.value === 'denied'
  )

  return {
    latitude: readonly(latitude),
    longitude: readonly(longitude),
    position: readonly(position),
    status: readonly(status),
    permissionState: readonly(permissionState),
    needsPermission: readonly(needsPermission),
    isFallback: readonly(isFallback),
    accuracy: readonly(accuracy),
    error: readonly(error),
    request,
    reposition,
    stop
  }
}
