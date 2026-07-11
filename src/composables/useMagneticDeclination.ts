/**
 * useMagneticDeclination —— 磁偏角计算 composable
 *
 * ═══════════════════════════════════════════════════════════════
 *  封装 geomagnetism（WMM 世界地磁模型），根据观测者经纬度和时间，
 *  计算当地的磁偏角（真北与磁北的夹角）。
 *
 *  用途：
 *    · 风水罗盘：DeviceOrientation API 获取的是磁北朝向（alpha），
 *      加上磁偏角得到真北朝向 → trueHeading = (alpha + declination) % 360
 *
 *  设计：
 *    · computed 响应式链：latitude/longitude/time 变化时自动重算
 *    · allowOutOfBoundsModel: true → 超出模型有效期仍返回近似值
 *    · SSR 安全：typeof window guard
 * ═══════════════════════════════════════════════════════════════
 */

import { computed, unref, type MaybeRef, type ComputedRef } from 'vue'
import geomagnetism from 'geomagnetism'

/** 配置选项 */
export interface UseMagneticDeclinationOptions {
  /** 观测者纬度（度，北正南负） */
  latitude: MaybeRef<number>
  /** 观测者经度（度，东正西负） */
  longitude: MaybeRef<number>
  /** 观测时间 */
  time: MaybeRef<Date>
  /** 海拔（公里，默认 0 = 海平面） */
  altitudeKm?: number
}

export interface UseMagneticDeclinationReturn {
  /** 磁偏角（度，东偏为正）；正数 = 磁北偏东 = 真北在磁北更西侧 */
  declination: ComputedRef<number>
  /** 是否已成功计算出磁偏角 */
  isReady: ComputedRef<boolean>
  /** 计算是否因为 SSR/环境限制而不可用 */
  isAvailable: ComputedRef<boolean>
  /** 错误信息 */
  error: ComputedRef<string | null>
}

export const useMagneticDeclination = (
  options: UseMagneticDeclinationOptions
): UseMagneticDeclinationReturn => {
  const { latitude, longitude, time, altitudeKm = 0 } = options

  const declination = computed(() => {
    const lat = unref(latitude)
    const lon = unref(longitude)
    const t = unref(time)

    // SSR 环境跳过
    if (typeof window === 'undefined') return 0

    try {
      const model = geomagnetism.model(t, { allowOutOfBoundsModel: true })
      const result = model.point([lat, lon, altitudeKm])
      return result.decl ?? 0
    } catch {
      return 0
    }
  })

  const isReady = computed(() => {
    // SSR 下 declination 始终返回 0, isReady 为 false
    if (typeof window === 'undefined') return false
    try {
      geomagnetism.model(new Date(), { allowOutOfBoundsModel: true })
      return true
    } catch {
      return false
    }
  })

  return {
    declination,
    isReady,
    isAvailable: computed(() => typeof window !== 'undefined'),
    error: computed<string | null>(() => null)
  }
}

/**
 * 获取 16 方位中文名
 *
 * 将方位角度（0-360，0=北）转换为中文名称。
 * 用于 Sidebar 显示"当前朝向：235°（西南）"
 */
export function headingToChinese(degrees: number): string {
  const directions = [
    '北', '北东北', '东北', '东东北',
    '东', '东东南', '东南', '南东南',
    '南', '南西南', '西南', '西西南',
    '西', '西西北', '西北', '北西北'
  ]
  const index = Math.round(degrees / 22.5) % 16
  return directions[index] ?? '北'
}
