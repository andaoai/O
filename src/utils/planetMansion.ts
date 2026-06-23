/**
 * 五星入宿计算
 *
 * 判断五星（水金火木土）当前黄经落在二十八星宿的哪个宿。
 *
 * 二十八宿环数据（twentyEightConstellations）中，每个宿是一段 base 区间
 * [startAngle, endAngle)，绘制时整体加 startDegree 偏移。因此"某黄经落在哪个宿"
 * 等价于：把黄经减去 startDegree 偏移后，落入哪个 item 的 base 区间。
 * 该口径与天文盘画布上的可视叠加一致（非严格岁差/距星校正，沿用项目既有约定）。
 */

import { twentyEightConstellations } from '@/data/rings/twentyEightConstellations'
import {
  PLANETS_CONFIG,
  planetPosition,
  moonPosition,
  normalizeDegree,
  type PlanetKey
} from './celestial'

/** 命中的宿信息 */
export interface MansionHit {
  /** 宿名（角/亢/氐……） */
  label: string
  /** 宿的颜色（取自宿环数据） */
  color: string
  /** 在该宿内的度数（base - startAngle） */
  degreeInMansion: number
}

/** 单颗天体的落宿结果（五星或月亮） */
export interface PlanetMansion {
  /** 键名（五星键名或 'moon'） */
  key: PlanetKey | 'moon'
  /** 中文名 */
  name: string
  /** 符号 */
  symbol: string
  /** 颜色 */
  color: string
  /** 黄经（0-360 度） */
  longitude: number
  /** 命中的宿（理论上一定命中，区间覆盖 0-360） */
  mansion: MansionHit | null
}

/** 宿环的 startDegree 偏移（缺省 0） */
const MANSION_START_DEGREE = twentyEightConstellations.startDegree ?? 0

/**
 * 判断某黄经落在二十八宿的哪个宿
 *
 * @param longitude 黄经（度）
 * @returns 命中的宿；理论上区间覆盖整圈，正常不会返回 null
 */
export const findMansion = (longitude: number): MansionHit | null => {
  // 把黄经换算回宿环的 base 坐标
  const base = normalizeDegree(longitude - MANSION_START_DEGREE)

  for (const item of twentyEightConstellations.items) {
    const start = item.startAngle ?? 0
    const end = item.endAngle ?? 360
    if (base >= start && base < end) {
      return {
        label: item.label,
        color: item.color ?? '#ffffff',
        degreeInMansion: base - start
      }
    }
  }

  return null
}

/**
 * 计算五星 + 月亮当前各自落在哪个宿
 *
 * @param time 观测时刻
 */
export const getPlanetMansions = (time: Date): PlanetMansion[] => {
  const result: PlanetMansion[] = (Object.keys(PLANETS_CONFIG) as PlanetKey[]).map((key) => {
    const config = PLANETS_CONFIG[key]
    const { longitude } = planetPosition(time, key)
    return {
      key,
      name: config.name,
      symbol: config.symbol,
      color: config.color,
      longitude,
      mansion: findMansion(longitude)
    }
  })

  // 追加月亮
  const moon = moonPosition(time)
  result.push({
    key: 'moon',
    name: '月亮',
    symbol: '月',
    color: '#c0c0c0',
    longitude: moon.longitude,
    mansion: findMansion(moon.longitude)
  })

  return result
}
