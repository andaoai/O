/**
 * useGeolocation —— 浏览器地理定位 composable
 *
 * ⚠️ 五层架构：Composable 层（薄壳），把 `navigator.geolocation` 包装成响应式 ref。
 *
 * 用法：
 * ```ts
 * const { latitude, longitude, status, error, request } = useGeolocation({
 *   lat: 34.65,   // 洛阳（fallback，永不为 null）
 *   lon: 112.45
 * })
 * ```
 *
 * 语义与设计取舍：
 *   1. **永不为 null**：`latitude`/`longitude` 一开始就用 fallback 填充，
 *      避免下游组件写一堆 `?? DEFAULT` 或 `v-if`。用户没授权时，
 *      整盘直接用 fallback 渲染，视觉一致。
 *   2. **默认不自动请求**：SSR 安全（VitePress 是 SSG，服务端没 navigator）
 *      + 一进页面就弹权限框会打扰。onMounted 里主动调 `request()` 才发起。
 *      如果需要"自动请求"，在业务侧显式加即可。
 *   3. **status 四态**：`'idle' | 'pending' | 'success' | 'denied'`
 *      让 UI 能显示"正在定位…"或"已使用默认位置（洛阳）"提示。
 *   4. **watchOnce**：授权成功后不再 watch，一次即终；一次授权 = 一次读数。
 *      要"跟随定位"用 `watchPosition()`，此处不用。
 */

import { ref, readonly, onMounted, type Ref, type DeepReadonly } from 'vue'

/** 地理定位状态机 */
export type GeolocationStatus = 'idle' | 'pending' | 'success' | 'denied'

/** 单次配置 */
export interface UseGeolocationOptions {
  /** fallback 纬度（度，北正南负）——用户拒绝或不支持时使用 */
  lat: number
  /** fallback 经度（度，东正西负）——用户拒绝或不支持时使用 */
  lon: number
  /** 组件挂载后是否自动请求（默认 true） */
  autoRequest?: boolean
  /** 地理位置精度要求（默认 false，省电优先） */
  enableHighAccuracy?: boolean
  /** 单次请求超时（毫秒，默认 8000） */
  timeoutMs?: number
  /** 缓存最大寿命（毫秒，默认 5 分钟） */
  maximumAgeMs?: number
}

export interface UseGeolocationReturn {
  /** 当前纬度（度） · 一开始就是 fallback，永不为 null */
  latitude: DeepReadonly<Ref<number>>
  /** 当前经度（度） */
  longitude: DeepReadonly<Ref<number>>
  /** 状态机 */
  status: DeepReadonly<Ref<GeolocationStatus>>
  /** 是否使用了 fallback 位置（未授权或失败） */
  isFallback: DeepReadonly<Ref<boolean>>
  /** 失败/拒绝时的错误消息（供 UI 提示） */
  error: DeepReadonly<Ref<string | null>>
  /** 主动重试一次（例如点"重新定位"按钮） */
  request: () => void
}

/**
 * 请求浏览器地理定位，成功后更新 latitude/longitude。
 *
 * SSR 安全：`navigator` 不存在时直接落入 fallback，不抛错。
 */
export const useGeolocation = (options: UseGeolocationOptions): UseGeolocationReturn => {
  const {
    lat: fallbackLat,
    lon: fallbackLon,
    autoRequest = true,
    enableHighAccuracy = false,
    timeoutMs = 8000,
    maximumAgeMs = 5 * 60 * 1000
  } = options

  const latitude = ref<number>(fallbackLat)
  const longitude = ref<number>(fallbackLon)
  const status = ref<GeolocationStatus>('idle')
  const isFallback = ref<boolean>(true)
  const error = ref<string | null>(null)

  const request = () => {
    // SSR / 老浏览器安全兜底
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      status.value = 'denied'
      error.value = '当前环境不支持地理定位'
      return
    }

    status.value = 'pending'
    error.value = null

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        latitude.value = pos.coords.latitude
        longitude.value = pos.coords.longitude
        status.value = 'success'
        isFallback.value = false
        error.value = null
      },
      (err) => {
        status.value = 'denied'
        isFallback.value = true
        // 用中文说明，避免暴露浏览器原生英文
        switch (err.code) {
          case err.PERMISSION_DENIED:
            error.value = '已拒绝定位权限，使用默认位置（洛阳）'
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
      },
      {
        enableHighAccuracy,
        timeout: timeoutMs,
        maximumAge: maximumAgeMs
      }
    )
  }

  if (autoRequest) {
    onMounted(() => request())
  }

  return {
    latitude: readonly(latitude),
    longitude: readonly(longitude),
    status: readonly(status),
    isFallback: readonly(isFallback),
    error: readonly(error),
    request
  }
}
