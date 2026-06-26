/**
 * 七曜统一计算 Composable
 *
 * ⚠️ 【唯一计算入口】
 * 所有需要七曜（日月五星）位置/状态的组件都应该使用此 composable，
 * 而不是直接调用 celestial.ts 中的底层函数。
 *
 * 功能：
 *   - 统一计算黄道坐标（黄经/黄纬）
 *   - 统一计算赤道坐标（赤经/赤纬）
 *   - 统一计算日心坐标（日心黄经）
 *   - 统一计算逆行状态
 *   - 统一计算入宿信息
 *   - 统一计算上下合状态
 *
 * 用法：
 *   const { all, sun, moon, planets, getByKey } = useSevenLuminaries(time)
 *
 *   // all.value 包含完整的七曜数组
 *   // sun.value / moon.value / planets.value 便捷访问器
 *   // getByKey('jupiter') 获取指定天体
 */

import { computed, unref, type MaybeRef } from 'vue'
import type { LuminaryKey } from '@/data/rings/types'
import {
  LUMINARY_KEYS,
  LUMINARY_CONFIG,
  getLuminarySize,
  getLuminaryHalos,
  type LuminaryVisualConfig
} from '@/data/rings/sevenLuminaries'
import {
  sunLongitude,
  planetPosition,
  planetRetrograde,
  moonPosition,
  planetHeliocentric,
  earthHeliocentric,
  inferiorConjunctionKind,
  type PlanetEclipticPosition
} from '@/utils/celestial'
import { eclipticToEquatorial } from '@/utils/skyProjection'
import { getMansionSpans, findMansion, type MansionHit } from '@/utils/planetMansion'

/**
 * 单个七曜的完整计算结果
 * 包含视觉配置 + 三套坐标 + 各种状态
 */
export interface LuminaryData extends LuminaryVisualConfig {
  key: LuminaryKey
  /** 黄道坐标 */
  ecliptic: PlanetEclipticPosition
  /** 赤道坐标（赤经/赤纬） */
  equatorial: { ra: number; dec: number }
  /** 日心坐标（仅五星+地球有效） */
  heliocentric?: { longitude: number; latitude: number; distance: number }
  /** 是否逆行（日月恒为 false） */
  retrograde: boolean
  /** 入宿信息 */
  mansion?: MansionHit
  /** 上下合类型（仅内行星有效） */
  conjunctionKind?: 'inferior' | 'superior'
}

/**
 * 七曜统一计算 composable
 * @param time 观测时间（ref 或 普通值）
 */
export function useSevenLuminaries(time: MaybeRef<Date>) {
  /** 观测时间 */
  const t = computed(() => unref(time))

  /**
   * 完整的七曜数据数组（按 LUMINARY_KEYS 顺序）
   * 单次计算，包含所有天体的所有状态信息
   */
  const all = computed<LuminaryData[]>(() => {
    const spans = getMansionSpans(t.value)

    return LUMINARY_KEYS.map((key): LuminaryData => {
      const base = LUMINARY_CONFIG[key]

      // 黄道坐标
      let ecliptic: PlanetEclipticPosition
      if (key === 'sun') {
        ecliptic = { longitude: sunLongitude(t.value), latitude: 0 }
      } else if (key === 'moon') {
        ecliptic = moonPosition(t.value)
      } else {
        ecliptic = planetPosition(t.value, key)
      }

      // 赤道坐标
      const eq = eclipticToEquatorial(ecliptic.longitude, ecliptic.latitude)

      // 逆行状态（日月不逆行）
      const retrograde = key !== 'sun' && key !== 'moon'
        ? planetRetrograde(t.value, key)
        : false

      // 入宿信息
      const mansionHit = findMansion(eq.ra, spans)
      const mansion = mansionHit || undefined

      // 日心坐标（仅五星+地球）
      let heliocentric: LuminaryData['heliocentric']
      if (key !== 'sun' && key !== 'moon') {
        heliocentric = planetHeliocentric(t.value, key)
      }

      // 上下合（仅内行星）
      let conjunctionKind: 'inferior' | 'superior' | undefined
      if (key === 'mercury' || key === 'venus') {
        conjunctionKind = inferiorConjunctionKind(t.value, key) || undefined
      }

      return {
        ...base,
        key,
        ecliptic,
        equatorial: eq,
        heliocentric,
        retrograde,
        mansion,
        conjunctionKind
      }
    })
  })

  /** 便捷访问：太阳 */
  const sun = computed(() => all.value.find(x => x.key === 'sun')!)

  /** 便捷访问：月亮 */
  const moon = computed(() => all.value.find(x => x.key === 'moon')!)

  /** 便捷访问：五星（不含日月） */
  const planets = computed(() => all.value.filter(x => x.key !== 'sun' && x.key !== 'moon'))

  /**
   * 根据 key 获取指定天体
   */
  const getByKey = (key: LuminaryKey): LuminaryData | undefined => {
    return all.value.find(x => x.key === key)
  }

  /**
   * 赤经 → 屏幕角度转换（顺时针，0°在右）
   * 与 DataRing / RingStack 对齐
   */
  const raToScreenAngle = (ra: number): number => {
    return ((360 - ra) % 360 + 360) % 360
  }

  return {
    /** 完整七曜数组 */
    all,
    /** 太阳（快捷访问） */
    sun,
    /** 月亮（快捷访问） */
    moon,
    /** 五星（快捷访问，不含日月） */
    planets,
    /** 根据 key 获取单个天体 */
    getByKey,
    /** 赤经 → 屏幕角度转换（与圆环系统对齐） */
    raToScreenAngle,
    /** 七曜 key 列表 */
    keys: LUMINARY_KEYS,
    /** 统一视觉配置引用 */
    config: LUMINARY_CONFIG,
    /** 尺寸计算辅助函数 */
    getSize: getLuminarySize,
    /** 光晕计算辅助函数 */
    getHalos: getLuminaryHalos
  }
}

/**
 * 地球日心位置（用于日心轨道盘）
 * 独立函数，避免混入七曜主数据
 */
export function useEarthHeliocentric(time: MaybeRef<Date>) {
  return computed(() => earthHeliocentric(unref(time)))
}

/**
 * 从 data/rings/sevenLuminaries 重新导出，方便统一从 composables 导入
 */
export { getLuminarySize, getLuminaryHalos } from '@/data/rings/sevenLuminaries'
