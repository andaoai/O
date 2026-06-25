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
  HelioVector,
  Ecliptic,
  EclipticGeoMoon,
  SearchMoonNode,
  NextMoonNode,
  NodeEventKind,
  Equator,
  Observer,
  DefineStar,
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
 * 判断行星此刻是否逆行（地心黄经向西退行）
 *
 * 逆行 = 地心黄经随时间减小。用中心差分取瞬时黄经变化率：
 * 比较 time±halfSpan 两时刻的黄经，归一化到 (-180, 180]，
 * 负值即逆行。日月不会逆行，故只对五星调用。
 *
 * @param time 观测时刻
 * @param key 行星键名
 * @param halfSpanDays 中心差分半步长（天，默认 0.5 天）
 */
export const planetRetrograde = (time: Date, key: PlanetKey, halfSpanDays = 0.5): boolean => {
  const ms = halfSpanDays * 24 * 60 * 60 * 1000
  const before = planetPosition(new Date(time.getTime() - ms), key).longitude
  const after = planetPosition(new Date(time.getTime() + ms), key).longitude
  // 黄经差归一化到 (-180, 180]，避免 360°→0° 跨越误判
  const delta = ((after - before) % 360 + 540) % 360 - 180
  return delta < 0
}

/* ────────────────────────────────────────────────────────────
 * 日心坐标（供日心轨道盘使用）
 *
 * 以太阳为中心，画出地球与五星的公转轨道。上合/下合一目了然：
 * 内行星（水金）落在「地球—太阳」连线靠地球侧 = 下合，靠太阳背侧 = 上合。
 * ──────────────────────────────────────────────────────────── */

/** 天体日心黄道位置（以太阳为原点） */
export interface HeliocentricPosition {
  /** 日心黄经（0-360 度） */
  longitude: number
  /** 日心黄纬（度） */
  latitude: number
  /** 与太阳的距离（AU） */
  distance: number
}

/**
 * 五星真实日心轨道半长轴（AU），用于确定轨道内外顺序。
 * 地球 1.0 作为内外行星分界。
 */
export const PLANET_SEMI_MAJOR_AU: Record<PlanetKey, number> = {
  mercury: 0.387,
  venus: 0.723,
  mars: 1.524,
  jupiter: 5.203,
  saturn: 9.537
} as const

/** 地球日心黄道位置（用于「地球—太阳」基准线与上下合判定） */
export const earthHeliocentric = (time: Date): HeliocentricPosition => {
  const vec = HelioVector(Body.Earth, new AstroTime(time))
  const ecl = Ecliptic(vec)
  return {
    longitude: normalizeDegree(ecl.elon),
    latitude: ecl.elat,
    distance: Math.hypot(vec.x, vec.y, vec.z)
  }
}

/** 单个行星的日心黄道位置 */
export const planetHeliocentric = (time: Date, key: PlanetKey): HeliocentricPosition => {
  const vec = HelioVector(PLANETS_CONFIG[key].body, new AstroTime(time))
  const ecl = Ecliptic(vec)
  return {
    longitude: normalizeDegree(ecl.elon),
    latitude: ecl.elat,
    distance: Math.hypot(vec.x, vec.y, vec.z)
  }
}

/**
 * 判断内行星（水/金）此刻处于上合还是下合（外行星返回 null）
 *
 * 几何判据：比较「行星到地球的距离」与「行星到太阳的距离 + 地球到太阳的距离」。
 * 下合 = 行星在地球与太阳之间，离地最近；上合 = 行星在太阳背后，离地最远。
 * 仅当行星与太阳的「地心黄经」接近（合日，差值 < tolDeg）时才判定，否则返回 null。
 *
 * @param time 观测时刻
 * @param key 行星键名
 * @param tolDeg 合日容差（度，默认 8°）
 */
export const inferiorConjunctionKind = (
  time: Date,
  key: PlanetKey,
  tolDeg = 8
): 'inferior' | 'superior' | null => {
  if (PLANET_SEMI_MAJOR_AU[key] >= 1) return null // 仅内行星有上下合
  // 合日判定：行星地心黄经 ≈ 太阳地心黄经
  const planetGeoLon = planetPosition(time, key).longitude
  const sunLon = sunLongitude(time)
  const sep = ((planetGeoLon - sunLon) % 360 + 540) % 360 - 180
  if (Math.abs(sep) > tolDeg) return null
  // 离地近 → 下合，离地远 → 上合
  const planet = planetHeliocentric(time, key)
  const earth = earthHeliocentric(time)
  // 行星与地球的日心黄经差，判断在太阳同侧还是异侧
  const lonDiff = ((planet.longitude - earth.longitude) % 360 + 540) % 360 - 180
  // |lonDiff| 小 → 行星与地球同方向（同侧）→ 下合；接近 180° → 异侧 → 上合
  return Math.abs(lonDiff) < 90 ? 'inferior' : 'superior'
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

/* ────────────────────────────────────────────────────────────
 * 赤道坐标（供天极投影星图使用）
 * 赤经按当前历元（ofdate，含岁差章动），与二十八宿距星同口径
 * ──────────────────────────────────────────────────────────── */

/** 天体赤道位置 */
export interface EquatorialPosition {
  /** 赤经（0-360 度，当前历元 ofdate） */
  ra: number
  /** 赤纬（度） */
  dec: number
}

/** 地心观测者（赤经赤纬以地心为准，位置无关） */
const GEOCENTRIC = new Observer(0, 0, 0)

/** astronomy-engine 自定义恒星槽位（Star1~Star8 共 8 个，循环复用） */
const STAR_SLOTS = [
  Body.Star1, Body.Star2, Body.Star3, Body.Star4,
  Body.Star5, Body.Star6, Body.Star7, Body.Star8
] as const

/**
 * 计算行星的赤道坐标（当前历元）
 */
export const planetEquatorial = (time: Date, key: PlanetKey): EquatorialPosition => {
  const eq = Equator(PLANETS_CONFIG[key].body, new AstroTime(time), GEOCENTRIC, true, true)
  return { ra: normalizeDegree(eq.ra * 15), dec: eq.dec }
}

/**
 * 计算太阳的赤道坐标（当前历元）
 */
export const sunEquatorial = (time: Date): EquatorialPosition => {
  const eq = Equator(Body.Sun, new AstroTime(time), GEOCENTRIC, true, true)
  return { ra: normalizeDegree(eq.ra * 15), dec: eq.dec }
}

/**
 * 计算月亮的赤道坐标（当前历元）
 */
export const moonEquatorial = (time: Date): EquatorialPosition => {
  const eq = Equator(Body.Moon, new AstroTime(time), GEOCENTRIC, true, true)
  return { ra: normalizeDegree(eq.ra * 15), dec: eq.dec }
}

/**
 * 计算距星（自定义恒星）的赤道坐标（当前历元，含岁差）
 *
 * @param time 观测时刻
 * @param raJ2000 J2000 赤经（度）
 * @param decJ2000 J2000 赤纬（度）
 * @param distanceLy 距离（光年）
 * @param slot 槽位索引（0-27，内部对 8 取模复用 Star1~8）
 */
export const fixedStarEquatorial = (
  time: Date,
  raJ2000: number,
  decJ2000: number,
  distanceLy: number,
  slot: number
): EquatorialPosition => {
  const body = STAR_SLOTS[slot % STAR_SLOTS.length]!
  DefineStar(body, raJ2000 / 15, decJ2000, distanceLy)
  const eq = Equator(body, new AstroTime(time), GEOCENTRIC, true, true)
  return { ra: normalizeDegree(eq.ra * 15), dec: eq.dec }
}

/* ────────────────────────────────────────────────────────────
 * 七曜相位（合 / 冲）
 *
 * 合（conjunction）= 两天体地心黄经夹角 ≈ 0°
 *   —— 朔（日月合）、五星互合、行星合月/合日，任意两天体皆可成合。
 * 冲（opposition）= 与太阳地心黄经相差 ≈ 180°
 *   —— 望（日月冲）、外行星冲日。冲的另一端恒为太阳：此时地球夹在正中，
 *      行星离地最近、最亮、整夜可见，是地球参与且有观测回报的天象。
 *      两颗行星之间的 180° 古代天文无此概念（地球不在排列中），不判为冲。
 * ──────────────────────────────────────────────────────────── */

/** 参与相位检测的天体键名（日月五星） */
export type LuminaryKey = 'sun' | 'moon' | PlanetKey

/** 七曜地心黄经（度），供相位检测与连线定位共用 */
export const luminaryLongitude = (time: Date, key: LuminaryKey): number => {
  if (key === 'sun') return sunLongitude(time)
  if (key === 'moon') return moonPosition(time).longitude
  return planetPosition(time, key).longitude
}

/** 七曜显示名（用于相位事件文案） */
export const LUMINARY_NAME: Record<LuminaryKey, string> = {
  sun: '日',
  moon: '月',
  mercury: '水',
  venus: '金',
  mars: '火',
  jupiter: '木',
  saturn: '土'
} as const

/** 相位类型 */
export type AspectKind = 'conjunction' | 'opposition'

/** 一次相位事件 */
export interface AspectEvent {
  a: LuminaryKey
  b: LuminaryKey
  kind: AspectKind
  /** 两天体黄经夹角（0-180 度） */
  separation: number
}

/** 两黄经夹角，归一化到 [0,180] */
const angularSeparation = (lonA: number, lonB: number): number => {
  const d = Math.abs(normalizeDegree(lonA - lonB))
  return d > 180 ? 360 - d : d
}

/**
 * 检测当前时刻七曜之间的合 / 冲相位
 *
 * 合：任意两天体黄经夹角 < tol（两两检测，符合古人「某星合某星」）。
 * 冲：仅在「另一端是太阳」时成立——即日月相望（望）与外行星冲日。
 *   两颗行星之间的 180° 古代天文无此概念（地球不在排列中、无观测回报），故不判冲。
 *   内行星（水/金）离日永不及 180°，天文上自动不会触发冲日。
 *
 * @param time 观测时刻
 * @param tolDeg 容差（度）：夹角 < tol 记为合，|夹角−180| < tol 记为冲
 */
export const detectAspects = (time: Date, tolDeg = 6): AspectEvent[] => {
  const keys: LuminaryKey[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn']
  const lons = new Map<LuminaryKey, number>()
  for (const k of keys) lons.set(k, luminaryLongitude(time, k))

  const events: AspectEvent[] = []
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const a = keys[i]!
      const b = keys[j]!
      const separation = angularSeparation(lons.get(a)!, lons.get(b)!)
      if (separation < tolDeg) {
        events.push({ a, b, kind: 'conjunction', separation })
      } else if (Math.abs(separation - 180) < tolDeg && (a === 'sun' || b === 'sun')) {
        // 冲只在「与太阳相对」时成立：望（日月冲）、外行星冲日。两行星互冲不计。
        events.push({ a, b, kind: 'opposition', separation })
      }
    }
  }
  return events
}

/** 把相位事件格式化为中文文案，如「日☌月（朔）」「木☍月」 */
export const formatAspect = (e: AspectEvent): string => {
  const glyph = e.kind === 'conjunction' ? '☌' : '☍'
  const base = `${LUMINARY_NAME[e.a]}${glyph}${LUMINARY_NAME[e.b]}`
  // 日月合冲的传统名：朔 / 望
  if ((e.a === 'sun' && e.b === 'moon') || (e.a === 'moon' && e.b === 'sun')) {
    return `${base}（${e.kind === 'conjunction' ? '朔' : '望'}）`
  }
  return base
}
