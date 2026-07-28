/**
 * useTrueHeading — 真北朝向计算 + 自动旋转追踪
 *
 * 将手机传感器原始数据（alpha/beta/gamma）与磁偏角结合，
 * 计算真北朝向，并驱动盘面梯度平滑跟随手机旋转。
 *
 * 从 FengShui24View 提取的领域逻辑：
 *   · trueHeading = normalizeAngle(alpha + declination)
 *   · 梯度平滑追踪 rotationAngle
 *   · displayHeading / directionLabel
 *   · betaDeviation — 手机倾斜偏差
 */
import { computed, watch, type MaybeRef, unref } from 'vue'
import { normalizeAngle } from '@/utils/geometry'
import { headingToChinese } from '@/composables/useMagneticDeclination'

/** 梯度平滑系数（0~1，越大追迹越快） */
const ROTATION_SMOOTH = 0.7

interface PhoneOrientation {
  alpha: MaybeRef<number>
  beta: MaybeRef<number>
  gamma: MaybeRef<number>
  isLevel: MaybeRef<boolean>
}

interface MagneticDeclination {
  declination: MaybeRef<number>
}

interface Viewport {
  rotationAngle: MaybeRef<number>
  updateRotationAngle: (angle: number) => void
}

/**
 * 真北朝向 + 自动旋转追踪
 *
 * @param phoneOri  — 手机朝向传感器
 * @param magDecl   — 磁偏角
 * @param viewport  — 视口状态（需可写 rotationAngle）
 * @returns trueHeading / displayHeading / directionLabel / betaDeviation
 */
export function useTrueHeading(
  phoneOri: PhoneOrientation,
  magDecl: MagneticDeclination,
  viewport: Viewport,
) {
  /** 真北朝向 = 屏幕校正磁北朝向 + 磁偏角 */
  const trueHeading = computed(() =>
    normalizeAngle(unref(phoneOri.alpha) + unref(magDecl.declination)),
  )

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
  watch(trueHeading, (heading) => {
    if (unref(phoneOri.isLevel)) {
      const target = (360 - heading) % 360
      const current = unref(viewport.rotationAngle)
      let diff = target - current
      if (diff > 180) diff -= 360
      else if (diff < -180) diff += 360
      viewport.updateRotationAngle(current + diff * ROTATION_SMOOTH)
    }
  })

  /**
   * 圆心显示角度 = 屏幕正上方指向的地理方位
   *
   * 盘面每顺时针旋转 θ 度，顶部展示的方位 = (360 - θ)°。
   * 因为 rotationAngle = (360 - trueHeading) % 360，
   * 所以 displayHeading = normalizeAngle(360 - rotationAngle) = trueHeading。
   */
  const displayHeading = computed(() => normalizeAngle(360 - unref(viewport.rotationAngle)))

  /** 当前朝向中文名 */
  const directionLabel = computed(() => headingToChinese(displayHeading.value))

  /**
   * 计算手机前后倾斜 (beta) 距离最近水平基准（0°/90°/180°/270°）的偏差。
   *
   * 不同设备和浏览器上"水平"时的 beta 值不同：
   *   · Chrome Android:  水平时 beta ≈ 0°
   *   · iOS Safari:      水平时 beta ≈ 90°（屏幕朝上平躺）
   *   · 部分设备:        beta ≈ -90°（即 270°）
   *   · 倒置:            beta ≈ 180°
   *
   * 用于水平校准 overlay 中的气泡位置和"前后 X°"提示。
   */
  const betaDeviation = computed(() => {
    const b = unref(phoneOri.beta)
    const bn = ((b % 360) + 360) % 360
    const devs = [bn, Math.abs(bn - 90), Math.abs(bn - 180), Math.abs(bn - 270)]
    const minDev = Math.min(...devs)
    const idx = devs.indexOf(minDev)
    const base = [0, 90, 180, 270][idx]!
    return b - base
  })

  return {
    trueHeading,
    displayHeading,
    directionLabel,
    betaDeviation,
  }
}
