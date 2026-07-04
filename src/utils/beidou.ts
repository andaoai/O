/**
 * 北斗七星工具
 *
 * 提供北斗七星 J2000 星表与实时赤道位置计算，
 * 供 BeidouCenter 圆心组件绘制真实北斗与斗柄指向。
 *
 * ⚠️ 五层架构：纯函数工具，无副作用。
 *
 * 天文约定：
 *   - J2000 星表数据来自 Hipparcos，度制。
 *   - `fixedStarEquatorial` 内部使用 astronomy-engine `Equator(ofdate=true)`，
 *     自动包含岁差修正 → 输出当前历元赤经赤纬。
 *   - `project(ra, dec)` 天极等距方位投影，输出单位平面（赤道半径=1，y 向上）。
 *
 * 斗柄指向：
 *   斗柄 = 天权(δ) → 摇光(η) 方向。将其在投影平面上外延，即古人「斗柄所指」，
 *   与外圈月建地支自然对齐（子在正上、卯在正右、午在正下、酉在正左）。
 */

import { fixedStarEquatorial } from './celestial'
import { project, type PlanePoint } from './skyProjection'
import { normalizeAngle } from './geometry'
import { SiderealTime } from 'astronomy-engine'

/** 北斗七星键名（按物理连线顺序：勺斗 → 斗柄） */
export type BeidouKey =
  | 'dubhe'   // 天枢 α UMa
  | 'merak'   // 天璇 β UMa
  | 'phecda'  // 天玑 γ UMa
  | 'megrez'  // 天权 δ UMa
  | 'alioth'  // 玉衡 ε UMa
  | 'mizar'   // 开阳 ζ UMa
  | 'alkaid'  // 摇光 η UMa

/** 单颗北斗星的静态属性（J2000 历元） */
export interface BeidouStar {
  key: BeidouKey
  /** 中文名（天枢/天璇/…） */
  cnName: string
  /** 拜耳命名（α UMa 等） */
  bayer: string
  /** J2000 赤经（度） */
  raJ2000: number
  /** J2000 赤纬（度） */
  decJ2000: number
  /** 视星等（越小越亮） */
  mag: number
}

/**
 * 北斗七星 J2000 星表（Hipparcos，度制）。
 *
 * 数组顺序与 <polyline> 连线顺序一致：勺斗四星（枢→璇→玑→权）+ 斗柄三星（衡→阳→光）。
 * 天权(megrez) 是勺与柄的连接节点：既是勺斗底、又是斗柄起点。
 */
export const BEIDOU_STARS: readonly BeidouStar[] = [
  { key: 'dubhe',  cnName: '天枢', bayer: 'α UMa', raJ2000: 165.9319, decJ2000: 61.7511, mag: 1.79 },
  { key: 'merak',  cnName: '天璇', bayer: 'β UMa', raJ2000: 165.4603, decJ2000: 56.3824, mag: 2.37 },
  { key: 'phecda', cnName: '天玑', bayer: 'γ UMa', raJ2000: 178.4577, decJ2000: 53.6948, mag: 2.44 },
  { key: 'megrez', cnName: '天权', bayer: 'δ UMa', raJ2000: 183.8565, decJ2000: 57.0326, mag: 3.31 },
  { key: 'alioth', cnName: '玉衡', bayer: 'ε UMa', raJ2000: 193.5073, decJ2000: 55.9598, mag: 1.77 },
  { key: 'mizar',  cnName: '开阳', bayer: 'ζ UMa', raJ2000: 200.9814, decJ2000: 54.9254, mag: 2.27 },
  { key: 'alkaid', cnName: '摇光', bayer: 'η UMa', raJ2000: 206.8852, decJ2000: 49.3133, mag: 1.86 }
] as const

/** 已计算的北斗七星（含当前历元赤道坐标 + 天极投影平面坐标） */
export interface BeidouPosition extends BeidouStar {
  /** 当前历元赤经（度，含岁差） */
  ra: number
  /** 当前历元赤纬（度，含岁差） */
  dec: number
  /**
   * 天极投影平面坐标（数学坐标：x 右、y 上，赤道半径=1）
   *
   * 注意：SVG 渲染时需把 y 取反。参见 skyProjection.ts 文件头注释。
   */
  plane: PlanePoint
}

/**
 * 默认观测地经度（洛阳，东经 112.45°）。
 *
 * 用于把恒星赤经转成本地时角，从而让北斗一日绕天极转一圈（自转周期）。
 * 观测者位置只影响时角零点在盘上的旋转相位，不改变七星相对形状。
 * 取洛阳作为古代中原观测的经典锚点。
 */
export const DEFAULT_OBSERVER_LON = 112.45

/**
 * 默认观测地纬度（洛阳，北纬 34.65°）。
 *
 * 用于地平圈计算：天极在地平线上的高度 = 观测者纬度 φ。
 * 洛阳 φ≈34.65° → 天极在正北地平上 34.65° 高。
 * 地平圈上一切点满足 alt = 0，赤纬范围 [-（90-φ）, +（90-φ)]，
 * 极端点：正北 dec = +(90-φ)（靠近天极）、正南 dec = -(90-φ)（远离天极）。
 */
export const DEFAULT_OBSERVER_LAT = 34.65

/**
 * 计算某时刻本地恒星时（LST）—— 单位：度（0–360）。
 *
 * 恒星时 = 天极上"春分点"当前的时角 + 观测地经度修正。
 * astronomy-engine `SiderealTime()` 返回 Greenwich Mean Sidereal Time (小时)。
 *
 * @param time 观测时刻
 * @param observerLon 观测地经度（东正西负，度），默认洛阳
 */
export const localSiderealTimeDeg = (time: Date, observerLon = DEFAULT_OBSERVER_LON): number => {
  const gmstDeg = SiderealTime(time) * 15
  return ((gmstDeg + observerLon) % 360 + 360) % 360
}

/**
 * 计算某时刻北斗七星各星的赤道坐标与天极投影坐标。
 *
 * 关键：让北斗随地球自转（一日一周），并按「面朝北仰望」的方位约定绘制。
 *
 *   时角 HA = 本地恒星时 LST − 赤经 RA
 *   投影极角 projAngle = HA + 90°（下详）
 *   极径 = (90° − δ)/90°
 *
 * 「面朝北仰望」方位约定：观测者面朝正北抬头看天，视野内——
 *   头顶（盘上）= 南天，右手（盘右）= 东，左手（盘左）= 西，脚下（盘下）= 北
 *
 * 推导 projAngle 公式：
 *   目标：斗柄物理指东时（HA≈-90°），射线朝盘右（SVG 0°）；指南时（HA=0），朝盘上（SVG 270°）
 *   → SVG_angle = 270° − HA
 *   而 project() 输出经 y 取反变 SVG 后，等效于 SVG_angle = −projAngle
 *   → projAngle = HA + 90° = (LST − RA) + 90°
 *
 * 时间随行为：
 *   - 拖一小时 → 斗柄「逆时针」（面朝北视角）旋转 15°；一天转 360°
 *   - 从春→夏→秋→冬，斗柄依次东→南（顶）→西→北，即在盘上从右→上→左→下逆时针转一圈
 *   - 数千年跨度，岁差 + 自行让七星形状缓慢改变
 *
 * ⚠️ 遗留细节：斗柄与"从北极星指向摇光"方向本身有约 48° 的物理夹角
 *   （因为斗柄天权→摇光并非从天极出发的辐射线），所以斗柄粗指东时并非
 *   精准 SVG 0°，会略微偏北。古人说「斗柄东指」本就是宽泛描述，不是几何精确。
 *
 * @param time 观测时刻
 * @param observerLon 观测地经度（度，默认洛阳）
 * @returns 七颗星，按 BEIDOU_STARS 中定义的连线顺序
 */
export const beidouPositions = (
  time: Date,
  observerLon = DEFAULT_OBSERVER_LON
): BeidouPosition[] => {
  const lst = localSiderealTimeDeg(time, observerLon)
  return BEIDOU_STARS.map((star, slot) => {
    const eq = fixedStarEquatorial(time, star.raJ2000, star.decJ2000, 100, slot)
    // 面朝北仰望方位映射：projAngle = HA + 90°
    const projAngle = ((lst - eq.ra + 90) % 360 + 360) % 360
    return {
      ...star,
      ra: eq.ra,
      dec: eq.dec,
      plane: project(projAngle, eq.dec)
    }
  })
}

/**
 * 计算斗柄在 SVG 平面上的方位角（度）。
 *
 * 斗柄方向 = 天权 (δ UMa, megrez) → 摇光 (η UMa, alkaid) 的射线方向。
 * 返回值遵循 SVG 坐标约定（y 向下）：0° = 正右，顺时针递增，与
 * `polarToCartesian(angle, r, 'clockwise')` 直接对齐。
 *
 * 用法：
 *   const rayEnd = polarToCartesian(dipperHandleAngle(positions), innerRadius, 'clockwise')
 *
 * @param positions beidouPositions() 的输出
 * @returns SVG 平面上的方位角（度，[0, 360)）
 */
export const dipperHandleAngle = (positions: BeidouPosition[]): number => {
  const megrez = positions.find((p) => p.key === 'megrez')!
  const alkaid = positions.find((p) => p.key === 'alkaid')!
  // 数学坐标 → SVG 坐标：y 取反
  const dx = alkaid.plane.x - megrez.plane.x
  const dySvg = -(alkaid.plane.y - megrez.plane.y)
  const deg = (Math.atan2(dySvg, dx) * 180) / Math.PI
  return normalizeAngle(deg)
}

/**
 * 由视星等映射星点绘制大小（像素半径）。
 *
 * 星等每差 1 等，亮度约差 2.512 倍；此处用简单线性映射，
 * 使全盘七星大小差异视觉可辨（1.77 ~ 3.31 → 大约 3.5 ~ 1.5 px）。
 *
 * @param mag 视星等
 * @param baseRadius 基准半径（对应 mag=2 的星，默认 3px）
 */
export const magnitudeToRadius = (mag: number, baseRadius = 3): number => {
  // mag 越小越亮 → 半径越大
  const r = baseRadius * (1 - (mag - 2) * 0.35)
  return Math.max(1, r)
}

/* ═══════════════════════════════════════════════════════════════
 *  地平圈（Horizon Circle） · 时间无关，仅取决于观测者纬度
 * ═══════════════════════════════════════════════════════════════
 *
 * 天球观星几何：
 *   观测者纬度 φ ⇒ 天极在正北地平上高度 = φ
 *   地平圈上一切点 alt = 0，由 (alt, az) → (HA, δ) 转换公式：
 *     sin(δ)  =  cos(φ) · cos(A)               ← A: 方位角 (0=北, 90=东, 180=南, 270=西)
 *     cos(HA) = −tan(φ) · tan(δ)
 *     sin(HA) = −sin(A) / cos(δ)
 *   δ 范围: [−(90°−φ), +(90°−φ)]
 *
 * 在天极等距投影盘上（本项目采用「面朝北仰望」约定：南=盘上、北=盘下）：
 *   北点 A=0   : δ=+(90−φ), HA=180° → 盘下方（近极） r=(90−δ)/90 较小
 *   东点 A=90  : δ=0,       HA=−90° → 盘右方 r=1（赤道）
 *   南点 A=180 : δ=−(90−φ), HA=0°   → 盘上方 r=(90+90−φ)/90>1（通常出盘外）
 *   西点 A=270 : δ=0,       HA=90°  → 盘左方 r=1（赤道）
 *
 * 结果是一条偏心的封闭曲线，"重心"偏向天极南侧：
 *   北段贴极最近、南段离极最远、东西段跨赤道；用户旋转日期时地平圈**不动**，
 *   而北斗/紫微/北极星绕极旋转——这正是"地球自转、地平不动"的直观演示。
 */

/**
 * 地平圈采样点数组（math 平面，赤道半径=1，y 向上）。
 *
 * ⚠️ 与恒星不同：地平圈不随时间旋转，仅由 φ 决定。
 *
 * 极端纬度：
 *   · φ→90°（极点） : 地平圈退化为赤道（r=1 圆）
 *   · φ→0°（赤道）  : 地平圈通过两极，成为一条经线
 *
 * @param observerLat 观测者纬度（度，北正南负）
 * @param samples 采样点数（默认 180，约每 2° 一段，足够平滑）
 * @returns 首尾闭合的曲线点数组（长度 samples+1）
 */
export const horizonCurve = (
  observerLat = DEFAULT_OBSERVER_LAT,
  samples = 180
): PlanePoint[] => {
  const phi = (observerLat * Math.PI) / 180
  const points: PlanePoint[] = []
  for (let i = 0; i <= samples; i++) {
    const A = (i / samples) * 360
    const Arad = (A * Math.PI) / 180
    const sinDelta = Math.cos(phi) * Math.cos(Arad)
    const decRad = Math.asin(sinDelta)
    const dec = (decRad * 180) / Math.PI
    const cosDelta = Math.cos(decRad) || 1e-12
    const cosHA = -Math.tan(phi) * (sinDelta / cosDelta)
    const sinHA = -Math.sin(Arad) / cosDelta
    const HA = (Math.atan2(sinHA, cosHA) * 180) / Math.PI
    const projAngle = normalizeAngle(HA + 90)
    points.push(project(projAngle, dec))
  }
  return points
}

/** 地平四方位（北/东/南/西）投影点 —— 用于图上标注 */
export interface HorizonCardinal {
  /** 方位中文名 */
  label: '北' | '东' | '南' | '西'
  /** 方位角（度，北=0 东=90 南=180 西=270） */
  azimuth: number
  /** 该方位在地平圈上的赤纬（度） */
  dec: number
  /** math 平面坐标 */
  plane: PlanePoint
}

/**
 * 计算北/东/南/西四个方位在地平圈上的投影点。
 * 用于在盘上标注四方位（Cardinal Points）。
 */
export const horizonCardinals = (observerLat = DEFAULT_OBSERVER_LAT): HorizonCardinal[] => {
  const dirs: { label: HorizonCardinal['label']; azimuth: number }[] = [
    { label: '北', azimuth: 0 },
    { label: '东', azimuth: 90 },
    { label: '南', azimuth: 180 },
    { label: '西', azimuth: 270 }
  ]
  const phi = (observerLat * Math.PI) / 180
  return dirs.map(({ label, azimuth }) => {
    const Arad = (azimuth * Math.PI) / 180
    const sinDelta = Math.cos(phi) * Math.cos(Arad)
    const decRad = Math.asin(sinDelta)
    const dec = (decRad * 180) / Math.PI
    const cosDelta = Math.cos(decRad) || 1e-12
    const cosHA = -Math.tan(phi) * (sinDelta / cosDelta)
    const sinHA = -Math.sin(Arad) / cosDelta
    const HA = (Math.atan2(sinHA, cosHA) * 180) / Math.PI
    const projAngle = normalizeAngle(HA + 90)
    return { label, azimuth, dec, plane: project(projAngle, dec) }
  })
}
