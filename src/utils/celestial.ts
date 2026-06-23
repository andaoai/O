/**
 * 天体黄道位置计算工具
 *
 * 集中所有 astronomy-engine 调用，提供纯函数式的天体位置计算：
 * - 太阳黄经
 * - 五星（水金火木土）黄经 / 黄纬
 * - 月亮黄经 / 黄纬 / 距离
 * - 白道轨道参数（升/降交点）
 * - 白道轨迹采样点
 *
 * 渲染层（components/celestial/*）只消费这里返回的"度数"，不再自行调用 astronomy-engine。
 */

import {
  AstroTime,
  MakeTime,
  SunPosition,
  GeoVector,
  Ecliptic,
  EclipticGeoMoon,
  SearchMoonNode,
  NextMoonNode,
  NodeEventKind,
  Body,
  type NodeEventInfo
} from 'astronomy-engine'

/** 五星键名 */
export type PlanetKey = 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn'

/** 单个五星的展示与天文配置 */
export interface PlanetConfig {
  /** 行星中文名 */
  name: string
  /** 单字符号（水/金/火/木/土） */
  symbol: string
  /** 颜色 */
  color: string
  /** 渲染尺寸 */
  size: number
  /** astronomy-engine 天体常量 */
  body: Body
}

/**
 * 五星配置（水金火木土）
 *
 * 颜色与尺寸沿用原 SolarEcliptic 的视觉设定。
 */
export const PLANETS_CONFIG: Record<PlanetKey, PlanetConfig> = {
  mercury: { name: '水星', symbol: '水', color: '#8C8C8C', size: 8, body: Body.Mercury },
  venus: { name: '金星', symbol: '金', color: '#FFC649', size: 14, body: Body.Venus },
  mars: { name: '火星', symbol: '火', color: '#CD5C5C', size: 10, body: Body.Mars },
  jupiter: { name: '木星', symbol: '木', color: '#DAA520', size: 18, body: Body.Jupiter },
  saturn: { name: '土星', symbol: '土', color: '#F4E7D7', size: 16, body: Body.Saturn }
} as const

/** 行星黄道位置 */
export interface PlanetEclipticPosition {
  /** 黄经（0-360 度） */
  longitude: number
  /** 黄纬（度，黄道面偏移） */
  latitude: number
}

/** 月亮黄道位置 */
export interface MoonEclipticPosition {
  /** 黄经（0-360 度） */
  longitude: number
  /** 黄纬（度） */
  latitude: number
  /** 距地距离（千米） */
  distance: number
}

/** 白道轨道参数 */
export interface LunarOrbitInfo {
  /** 轨道倾角（黄白交角，度） */
  inclination: number
  /** 升交点黄经（度） */
  ascendingNodeLongitude: number
  /** 降交点黄经（度） */
  descendingNodeLongitude: number
}

/** 把任意度数归一化到 [0, 360) */
export const normalizeDegree = (deg: number): number => ((deg % 360) + 360) % 360

/**
 * 计算太阳的真实黄经
 */
export const sunLongitude = (time: Date): number => {
  const astroTime = MakeTime(time)
  return normalizeDegree(SunPosition(astroTime).elon)
}

/**
 * 计算单个行星的黄道位置（黄经 + 黄纬）
 */
export const planetPosition = (time: Date, key: PlanetKey): PlanetEclipticPosition => {
  const config = PLANETS_CONFIG[key]
  const astroTime = new AstroTime(time)

  // 地心向量（已考虑光行差）→ 黄道坐标
  const geoVector = GeoVector(config.body, astroTime, true)
  const eclipticCoords = Ecliptic(geoVector)

  return {
    longitude: normalizeDegree(eclipticCoords.elon),
    latitude: eclipticCoords.elat
  }
}

/**
 * 计算月亮的黄道位置（黄经 + 黄纬 + 距离）
 */
export const moonPosition = (time: Date): MoonEclipticPosition => {
  const astroTime = MakeTime(time)
  const moonEcliptic = EclipticGeoMoon(astroTime)

  return {
    longitude: normalizeDegree(moonEcliptic.lon),
    latitude: moonEcliptic.lat,
    distance: moonEcliptic.dist
  }
}

/**
 * 计算白道轨道参数（升/降交点黄经）
 */
export const lunarOrbit = (time: Date): LunarOrbitInfo => {
  const astroTime = MakeTime(time)

  // 搜索最近的两个节点，区分升/降交点
  const firstNode = SearchMoonNode(astroTime)
  const secondNode = NextMoonNode(firstNode)

  let ascendingNode: NodeEventInfo
  let descendingNode: NodeEventInfo
  if (firstNode.kind === NodeEventKind.Ascending) {
    ascendingNode = firstNode
    descendingNode = secondNode
  } else {
    ascendingNode = secondNode
    descendingNode = firstNode
  }

  const ascendingLongitude = normalizeDegree(EclipticGeoMoon(ascendingNode.time).lon)
  const descendingLongitude = normalizeDegree(EclipticGeoMoon(descendingNode.time).lon)

  return {
    inclination: 5.145, // 黄白交角
    ascendingNodeLongitude: ascendingLongitude,
    descendingNodeLongitude: descendingLongitude
  }
}

/** 白道轨迹采样点（黄道坐标） */
export interface MoonOrbitSample {
  longitude: number
  latitude: number
}

/**
 * 生成白道轨迹采样点（基于月亮一个完整轨道周期的黄经/黄纬序列）
 *
 * 返回纯天文数据，坐标转换交给渲染层。
 * @param time 起始时刻
 * @param steps 采样步数（默认 40）
 */
export const moonOrbitPath = (time: Date, steps = 40): MoonOrbitSample[] => {
  const samples: MoonOrbitSample[] = []
  const baseTime = time.getTime()

  // 少生成两个点，避免路径首尾闭合
  for (let i = 0; i < steps - 2; i++) {
    const daysOffset = (i / steps) * 29.53 // 月球轨道周期约 29.53 天
    const orbitTime = new Date(baseTime + daysOffset * 24 * 60 * 60 * 1000)
    const pos = moonPosition(orbitTime)
    samples.push({ longitude: pos.longitude, latitude: pos.latitude })
  }

  return samples
}
