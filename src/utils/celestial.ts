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
  SiderealTime,
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

/**
 * 把任意度数归一化到 [0, 360)。
 *
 * ⚠️ 历史别名：此函数与 `utils/geometry.ts::normalizeAngle` 是同一个公式，
 * 保留 `normalizeDegree` 名称以兼容既有 import 路径，实现直接 re-export。
 * 新代码请直接消费 `normalizeAngle`。
 */
import { normalizeAngle } from './geometry'
export const normalizeDegree = normalizeAngle

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
 * 行星运动状态枚举（源自《史记·天官书》五星运动分类）
 *
 * 古代天文术语与现代天文对应关系：
 * - fast     疾：快速顺行（日运动 > 1.2°）
 * - normal   顺：正常顺行（日运动 0.5°~1.2°）
 * - slow     迟：慢速顺行（日运动 0°~0.5°）
 * - stationary 守/留：静止（日运动 |v| < 0.05°，顺逆转换点）
 * - retrograde 逆/退：向西退行（日运动 < 0°）
 *
 * 五星平均日运动参考：水星~1.5°、金星~1.2°、火星~0.5°、木星~0.08°、土星~0.03°
 */
export type MotionState = 'fast' | 'normal' | 'slow' | 'stationary' | 'retrograde'

/**
 * 行星运动完整信息结构
 *
 * 包含运动分类、速度、渲染样式三部分信息，
 * 供 DataBodyRing / MansionDegreeRing 渲染运动状态标记使用。
 */
export interface PlanetMotion {
  /** 运动状态分类（疾/顺/迟/守/逆） */
  state: MotionState
  /** 地心黄经日变化率（度/天，正值=顺行向东） */
  speed: number
  /** 是否处于逆行状态 */
  isRetrograde: boolean
  /** 是否处于留守静止状态 */
  isStationary: boolean
  /** 刻线渲染样式：实线/虚线/淡线 */
  lineStyle: 'solid' | 'dashed' | 'faint'
  /** 运动方向箭头指示：顺行沿盘面逆时针，逆行沿顺时针 */
  arrowDirection: 'clockwise' | 'counterclockwise' | 'none'
  /** 古代天文术语单字（用于标签显示：疾/顺/迟/守/逆） */
  character: string
}

/**
 * 运动状态视觉配置常量
 *
 * 统一定义五种运动状态的颜色、虚线样式、透明度等视觉属性，
 * 确保 DataBodyRing（天体标记环）和 MansionDegreeRing（入宿度刻线）
 * 在视觉表现上保持一致。
 */
export const MOTION_VISUAL_CONFIG: Record<MotionState, {
  color: string
  dashArray: string
  opacity: number
  label: string
}> = {
  fast: {
    color: '#4488FF',      // 疾行：动态蓝
    dashArray: 'none',
    opacity: 0.85,
    label: '疾'
  },
  normal: {
    color: '#FFFFFF',      // 正常：白色（天体本色）
    dashArray: 'none',
    opacity: 0.85,
    label: '顺'
  },
  slow: {
    color: '#888888',      // 迟行：中性灰
    dashArray: '4,2',
    opacity: 0.6,
    label: '迟'
  },
  stationary: {
    color: '#00CCFF',      // 留守：信息青
    dashArray: '4,2',
    opacity: 0.85,
    label: '守'
  },
  retrograde: {
    color: '#FF4444',      // 逆行：警示红
    dashArray: '4,2',
    opacity: 0.85,
    label: '逆'
  }
} as const

/**
 * 计算行星当前运动状态与日速度
 *
 * 基于中心差分法计算地心黄经瞬时变化率，按古代天文五态分类。
 * 算法：
 *   1. 取前后各 halfSpanDays 时刻的黄经位置
 *   2. 计算黄经差并归一化到 (-180, 180]，避免 360° 跨越误判
 *   3. 转换为日速度并按阈值分类
 *
 * @param time 观测时刻
 * @param key 行星键名（水金火木土）
 * @param halfSpanDays 中心差分半步长（天，默认 0.5 天）
 * @returns 完整运动状态信息
 */
export const planetMotion = (
  time: Date,
  key: PlanetKey,
  halfSpanDays = 0.5
): PlanetMotion => {
  const ms = halfSpanDays * 24 * 60 * 60 * 1000
  const before = planetPosition(new Date(time.getTime() - ms), key).longitude
  const after = planetPosition(new Date(time.getTime() + ms), key).longitude

  // 黄经差归一化到 (-180, 180]，避免 360°→0° 跨越误判
  const delta = ((after - before) % 360 + 540) % 360 - 180
  const speed = delta / (2 * halfSpanDays) // 度/天

  const isStationary = Math.abs(speed) < 0.05
  const isRetrograde = speed < 0

  let state: MotionState
  if (isStationary) {
    state = 'stationary'
  } else if (isRetrograde) {
    state = 'retrograde'
  } else if (speed > 1.2) {
    state = 'fast'
  } else if (speed < 0.5) {
    state = 'slow'
  } else {
    state = 'normal'
  }

  const characterMap: Record<MotionState, string> = {
    fast: '疾',
    normal: '顺',
    slow: '迟',
    stationary: '守',
    retrograde: '逆'
  }

  return {
    state,
    speed,
    isRetrograde,
    isStationary,
    lineStyle: state === 'stationary' ? 'dashed' : state === 'slow' ? 'faint' : 'solid',
    arrowDirection: state === 'stationary' ? 'none' : isRetrograde ? 'counterclockwise' : 'clockwise',
    character: characterMap[state]
  }
}

/**
 * 判断行星此刻是否逆行（地心黄经向西退行）
 *
 * 便捷函数，内部调用 planetMotion 后提取 isRetrograde 字段。
 * 日月不会逆行，故仅对五星调用此函数。
 *
 * @param time 观测时刻
 * @param key 行星键名
 * @param halfSpanDays 中心差分半步长（天，默认 0.5 天）
 * @returns true 表示逆行，false 表示顺行
 */
export const planetRetrograde = (time: Date, key: PlanetKey, halfSpanDays = 0.5): boolean => {
  return planetMotion(time, key, halfSpanDays).isRetrograde
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

/* ────────────────────────────────────────────────────────────
 * 日周运动（地球自转视角 · 观测者本地时角）
 *
 * ⚠️ 与"黄道 / 赤道位置"完全正交的另一维度：
 *   · 黄道/赤道 = 天体在恒星背景中的位置（年尺度慢变）
 *   · 日周 = 天体相对观测者头顶的方向（日尺度快变，一天转 360°）
 *
 * 核心公式：
 *   LST (本地恒星时) = GST (格林尼治恒星时) + 观测者经度
 *   LHA (地方时角)  = LST - RA (天体赤经)
 *     · LHA = 0    → 天体在正南（上中天）
 *     · LHA = 90°  → 天体在西方地平
 *     · LHA = 180° → 天体在正北（下中天，若北半球高纬则不落）
 *     · LHA = 270° → 天体在东方地平（即将升起）
 *
 * 「面朝北仰望」坐标下的屏幕角度约定：
 *   午（南、上）    → SVG 270°
 *   酉（西、左）    → SVG 180°
 *   子（北、下）    → SVG 90°
 *   卯（东、右）    → SVG 0°
 *
 * 太阳时角 → 屏幕角度：
 *   sunScreen = (270 - LHA + 360) % 360
 *   · 正午 LHA=0    → SVG 270°（正上、南）
 *   · 酉时 LHA=90°  → SVG 180°（正左、西）✓ 日落
 *   · 子夜 LHA=180° → SVG 90°（正下、北）
 *   · 卯时 LHA=-90° → SVG 0°  （正右、东）✓ 日出
 * ──────────────────────────────────────────────────────────── */

/**
 * 计算天体的地方时角 LHA（Local Hour Angle，度）
 *
 * @param time 观测时刻
 * @param raDeg 天体赤经（度，当前历元 ofdate）
 * @param observerLon 观测者经度（度，东经为正、西经为负）
 * @returns LHA ∈ [-180, 180]：0=上中天南，正=向西已过中天，负=向东尚未中天
 */
export const localHourAngle = (time: Date, raDeg: number, observerLon: number): number => {
  // SiderealTime 返回格林尼治视恒星时（GAST，单位小时），× 15 转成度
  const gastDeg = SiderealTime(new AstroTime(time)) * 15
  const lstDeg = normalizeDegree(gastDeg + observerLon)
  // 归一化到 (-180, 180]，让南天正上 LHA=0，向西为正、向东为负更直观
  return ((lstDeg - raDeg) % 360 + 540) % 360 - 180
}

/**
 * 计算天体的地平高度角 alt（度）
 *
 * alt > 0 = 地平线以上（可见），alt < 0 = 地平线以下（在地下、被大地遮挡）。
 * 用于判定日出日落、可见性。
 *
 * @param decDeg 天体赤纬（度）
 * @param lhaDeg 天体地方时角（度，见 localHourAngle）
 * @param observerLat 观测者纬度（度，北纬为正）
 */
export const altitude = (decDeg: number, lhaDeg: number, observerLat: number): number => {
  const φ = observerLat * Math.PI / 180
  const δ = decDeg * Math.PI / 180
  const H = lhaDeg * Math.PI / 180
  const sinAlt = Math.sin(φ) * Math.sin(δ) + Math.cos(φ) * Math.cos(δ) * Math.cos(H)
  return Math.asin(Math.min(1, Math.max(-1, sinAlt))) * 180 / Math.PI
}

/**
 * 太阳的日周方位（LHA + alt + 屏幕角度）
 *
 * 一站式输出"太阳当下相对观测者头顶的位置"，供 SunDiurnalRing 直接消费。
 * 地球自转视角，一天转 360°；不同于 sunLongitude 的"太阳在黄道恒星背景中的位置（一年）"。
 *
 * @param time 观测时刻
 * @param observerLon 观测者经度
 * @param observerLat 观测者纬度
 */
export interface SunDiurnalPosition {
  /** 太阳赤经（度，当前历元） */
  ra: number
  /** 太阳赤纬（度） */
  dec: number
  /** 太阳地方时角（度）；0=正南上中天，90=西地平，-90=东地平 */
  lha: number
  /** 太阳地平高度角（度）；正=白昼，负=夜晚 */
  alt: number
  /** 面朝北仰望坐标下的屏幕角度（0=右/东，90=下/北，180=左/西，270=上/南） */
  screenAngle: number
}

export const sunDiurnal = (
  time: Date,
  observerLon: number,
  observerLat: number
): SunDiurnalPosition => {
  const { ra, dec } = sunEquatorial(time)
  const lha = localHourAngle(time, ra, observerLon)
  const alt = altitude(dec, lha, observerLat)
  // 面朝北仰望：LHA=0 (南)→上=SVG 270°；LHA=90 (西)→左=SVG 180°
  const screenAngle = ((270 - lha) % 360 + 360) % 360
  return { ra, dec, lha, alt, screenAngle }
}

/**
 * 月亮的日周方位（同 sunDiurnal，但取月亮赤经赤纬）
 *
 * 月亮日周方位与太阳的相对差 ≈ 农历相位：
 *   · 朔 → 月亮 LHA ≈ 太阳 LHA（同起同落）
 *   · 望 → 月亮 LHA ≈ 太阳 LHA + 180°（日落时月出）
 *   · 上弦 → 月亮比太阳晚 6 小时（正午月出，午夜月落）
 * 供 SunDiurnalRing 同时渲染日/月，一眼看出日月相位。
 */
export const moonDiurnal = (
  time: Date,
  observerLon: number,
  observerLat: number
): SunDiurnalPosition => {
  const { ra, dec } = moonEquatorial(time)
  const lha = localHourAngle(time, ra, observerLon)
  const alt = altitude(dec, lha, observerLat)
  const screenAngle = ((270 - lha) % 360 + 360) % 360
  return { ra, dec, lha, alt, screenAngle }
}

/* ────────────────────────────────────────────────────────────
 * 昼夜弧长（季节性可视化）
 *
 * 由太阳赤纬 δ 与观测者纬度 φ 联合决定当日昼夜比例：
 *   · 春/秋分 δ=0    → 昼夜各半（12h/12h）
 *   · 夏至    δ=+23° → 北半球白昼长（洛阳约 14.3h）
 *   · 冬至    δ=-23° → 北半球白昼短（洛阳约 9.7h）
 *
 * 核心公式（球面三角）：
 *   日出/日落时角:   cos H₀ = -tan φ × tan δ
 *   民用曙暮光时角:  cos H₆ = (sin(-6°) - sin φ sin δ) / (cos φ cos δ)
 *
 * H₀ 定义了「太阳高度 = 0」的时角边界：
 *   LHA ∈ [-H₀, +H₀]  → 白昼（太阳在地平线以上）
 *   LHA ∈ [-H₆, -H₀]  → 民用晨光（曙）
 *   LHA ∈ [+H₀, +H₆]  → 民用昏光（暮·初昏 ★）
 *   其余               → 夜
 *
 * 极端情况：
 *   |tan φ × tan δ| > 1 时:
 *     RHS <-1 → 极昼（H₀ = 180°，整日不落）
 *     RHS >+1 → 极夜（H₀ = 0°，整日不升）
 * ──────────────────────────────────────────────────────────── */

/** 当日昼夜弧长信息 */
export interface DayNightArc {
  /** 太阳赤纬（度，± 23.44 范围内摆动） */
  dec: number
  /** 日出/日落地方时角（度，正值）；`LHA ∈ [-H₀,+H₀]` 为白昼 */
  sunriseHourAngle: number
  /** 民用晨/昏地方时角（度，正值 ≥ H₀）；`LHA ∈ [-H₆,+H₆]` 为白昼+曙暮 */
  civilTwilightHourAngle: number
  /** 白昼时长（小时，= 2 × H₀ / 15） */
  dayLengthHours: number
  /** 极昼：整日太阳不落（高纬夏日） */
  polarDay: boolean
  /** 极夜：整日太阳不升（高纬冬日） */
  polarNight: boolean
}

/**
 * 计算当日昼夜弧长
 *
 * ⚠️ 只需要观测者纬度 φ；不需要经度（经度只决定"哪一刻是正午"，
 *    不影响"白昼总长"）。故仅接收 observerLat 一个参数。
 *
 * @param time 观测时刻（取当日太阳赤纬）
 * @param observerLat 观测者纬度（度，北纬为正）
 */
export const dayNightArc = (time: Date, observerLat: number): DayNightArc => {
  const { dec } = sunEquatorial(time)
  const φ = observerLat * Math.PI / 180
  const δ = dec * Math.PI / 180

  // 日出/日落时角
  const cosH0 = -Math.tan(φ) * Math.tan(δ)
  let polarDay = false
  let polarNight = false
  let h0Deg: number
  if (cosH0 <= -1) { polarDay = true; h0Deg = 180 }
  else if (cosH0 >= 1) { polarNight = true; h0Deg = 0 }
  else { h0Deg = Math.acos(cosH0) * 180 / Math.PI }

  // 民用曙暮光时角（alt = -6°）
  const civilAltSin = Math.sin(-6 * Math.PI / 180)
  const cosH6 = (civilAltSin - Math.sin(φ) * Math.sin(δ)) / (Math.cos(φ) * Math.cos(δ))
  let h6Deg: number
  if (cosH6 <= -1) h6Deg = 180
  else if (cosH6 >= 1) h6Deg = 0
  else h6Deg = Math.acos(cosH6) * 180 / Math.PI

  // 曙暮时角必须 ≥ 日出时角（极端边界处理）
  const h6Final = Math.max(h6Deg, h0Deg)

  return {
    dec,
    sunriseHourAngle: h0Deg,
    civilTwilightHourAngle: h6Final,
    dayLengthHours: (2 * h0Deg) / 15,
    polarDay,
    polarNight
  }
}
