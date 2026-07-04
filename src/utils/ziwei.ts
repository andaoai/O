/**
 * 紫微垣（Purple Forbidden Enclosure）星表与投影
 *
 * 紫微垣是中国古代三垣之首，位于北天极附近的拱极天区，
 * 象征"天帝居所"，其东西两藩构成天上宫墙，环卫北极。
 *
 *   · 左垣（东藩）：8 星，自 左枢 起南→北弧形绕极
 *   · 右垣（西藩）：7 星，自 右枢 起南→北弧形绕极
 *   · 北极星（勾陈一 = α UMi = Polaris）：现代天极标志
 *
 * 依据：《晋书·天文志》、《步天歌》紫微垣段。
 * J2000 数据 : Hipparcos，度制。个别较暗（mag > 4）的墙星仍保留，
 * 以复原完整"两藩"轮廓；渲染层可用透明度弱化。
 *
 * 复用北斗的投影流程（`beidou.ts` 中的天极等距 azimuthal-equidistant），
 * 结果直接在同一张 BeidouCenter 上叠加。
 *
 * ⚠️ 五层架构：纯常量 + 纯函数，无副作用。
 */

import { fixedStarEquatorial } from './celestial'
import { project, type PlanePoint } from './skyProjection'
import { localSiderealTimeDeg, DEFAULT_OBSERVER_LON } from './beidou'
import { normalizeAngle } from './geometry'

/** 单颗紫微墙星（J2000） */
export interface ZiweiStar {
  /** 中文名（左枢/右枢/北极星…） */
  cnName: string
  /** 拜耳/编号（α Dra 等） */
  bayer: string
  /** J2000 赤经（度） */
  raJ2000: number
  /** J2000 赤纬（度） */
  decJ2000: number
  /** 视星等 */
  mag: number
}

/**
 * 紫微左垣（东藩）8 星 —— 跨 Draco / Cepheus / Cassiopeia 三座绕极。
 *
 * 连线顺序：左枢 → 上宰 → 少宰 → 上弼 → 少弼 → 上卫 → 少卫 → 少丞
 *
 * 现代星名对应（据《中国恒星观测史》/维基百科紫微左垣条目）：
 *   1 左枢 = ι Dra     · 紫微左垣一
 *   2 上宰 = θ Dra     · 紫微左垣二
 *   3 少宰 = η Dra     · 紫微左垣三
 *   4 上弼 = ζ Dra     · 紫微左垣四
 *   5 少弼 = υ Dra     · 紫微左垣五   ← 上一版误作 δ Dra（δ Dra 属"天厨"，与紫微无关）
 *   6 上卫 = 73 Dra    · 紫微左垣六   ← 上一版误作 π Dra
 *   7 少卫 = π Cep     · 紫微左垣七   ← 上一版误作 χ Dra（χ Dra 属"御女"）
 *   8 少丞 = 23 Cas    · 紫微左垣八   ← 上一版误作末星"上丞"γ Cep（上丞属右垣）
 *
 * 走势为「天龙腹背 → 越天极 → 落仙后」，末星 23 Cas 位于 Cassiopeia 北，
 * 与西藩末端 上丞（BK Cam）隔着天极遥遥相对，两墙合围紫微宫垣。
 *
 * ⚠️ 星表 J2000 坐标（SIMBAD 校对）：
 *   任何一颗写错都会让"墙"跳飞到别处。此处已经过完整交叉验证。
 */
export const ZIWEI_EAST_WALL: readonly ZiweiStar[] = [
  { cnName: '左枢', bayer: 'ι Dra',  raJ2000: 231.2323, decJ2000: 58.9662, mag: 3.29 },
  { cnName: '上宰', bayer: 'θ Dra',  raJ2000: 240.4718, decJ2000: 58.5652, mag: 4.01 },
  { cnName: '少宰', bayer: 'η Dra',  raJ2000: 245.9977, decJ2000: 61.5140, mag: 2.73 },
  { cnName: '上弼', bayer: 'ζ Dra',  raJ2000: 257.1962, decJ2000: 65.7146, mag: 3.17 },
  { cnName: '少弼', bayer: 'υ Dra',  raJ2000: 283.5994, decJ2000: 71.2972, mag: 4.83 },
  { cnName: '上卫', bayer: '73 Dra', raJ2000: 307.8767, decJ2000: 74.9548, mag: 5.19 },
  { cnName: '少卫', bayer: 'π Cep',  raJ2000: 346.9744, decJ2000: 75.3875, mag: 4.41 },
  { cnName: '少丞', bayer: '23 Cas', raJ2000: 11.9418,  decJ2000: 74.8476, mag: 5.42 }
] as const

/**
 * 紫微右垣（西藩）7 星 —— 由 右枢（α Dra = 古北极星 Thuban）起。
 *
 * 连线顺序：右枢 → 少尉 → 上辅 → 少辅 → 上卫 → 少卫 → 上丞
 *
 * 现代星名对应（据维基百科紫微右垣条目）：
 *   1 右枢 = α Dra    · Thuban（公元前 3000 年前后的极星）
 *   2 少尉 = κ Dra
 *   3 上辅 = λ Dra
 *   4 少辅 = 24 UMa
 *   5 上卫 = 43 Cam
 *   6 少卫 = α Cam
 *   7 上丞 = BK Cam    ← 上一版此星坐标估错（RA≈58°/Dec≈78°），
 *                        真值 RA≈50°/Dec≈+65.6°（HD 20336, mag 4.85）
 *
 * 首星 右枢 = Thuban，公元前 3000 年前后曾任真正的极星，
 * 这也是"紫微右枢"命名的物理由来。
 *
 * ⚠️ J2000 坐标均经 SIMBAD 交叉验证。
 */
export const ZIWEI_WEST_WALL: readonly ZiweiStar[] = [
  { cnName: '右枢', bayer: 'α Dra',  raJ2000: 211.0973, decJ2000: 64.3757, mag: 3.65 },
  { cnName: '少尉', bayer: 'κ Dra',  raJ2000: 188.3728, decJ2000: 69.7887, mag: 3.87 },
  { cnName: '上辅', bayer: 'λ Dra',  raJ2000: 172.8514, decJ2000: 69.3312, mag: 3.82 },
  { cnName: '少辅', bayer: '24 UMa', raJ2000: 143.6203, decJ2000: 69.8303, mag: 4.55 },
  { cnName: '上卫', bayer: '43 Cam', raJ2000: 103.4260, decJ2000: 68.8883, mag: 5.11 },
  { cnName: '少卫', bayer: 'α Cam',  raJ2000: 73.5125,  decJ2000: 66.3427, mag: 4.29 },
  { cnName: '上丞', bayer: 'BK Cam', raJ2000: 49.9969,  decJ2000: 65.6523, mag: 4.85 }
] as const

/**
 * 北极星（勾陈一 = 现代天极标志） · J2000
 *
 * α UMi = Polaris. 目前赤纬 +89.26°，离真北天极不到 0.75°，
 * 是当代最靠近北天极的亮星，肉眼可见的"星北极"。
 *
 * 岁差让北极点每 25772 年绕黄极转一圈；本表用 J2000 数值 +
 * astronomy-engine `Equator(ofdate=true)` 得当前历元位置。
 */
export const POLARIS: ZiweiStar = {
  cnName: '勾陈一',
  bayer: 'α UMi',
  raJ2000: 37.9540,
  decJ2000: 89.2641,
  mag: 1.97
} as const

/** 已计算的紫微星（含当前历元赤道 + 天极投影平面） */
export interface ZiweiPosition extends ZiweiStar {
  /** 当前历元赤经（度，含岁差） */
  ra: number
  /** 当前历元赤纬（度，含岁差） */
  dec: number
  /** 天极投影平面坐标（math 坐标：x 右、y 上，赤道半径=1） */
  plane: PlanePoint
}

/**
 * 计算某时刻紫微墙星的赤道 + 投影坐标。
 *
 * 与 `beidouPositions()` 使用完全相同的投影公式：
 *   projAngle = LST − RA + 90°   （面朝北仰望约定）
 *   plane = project(projAngle, dec)
 *
 * 这样确保紫微墙、北斗、北极星在同一张图上几何统一。
 *
 * @param stars 星表（ZIWEI_EAST_WALL / ZIWEI_WEST_WALL / [POLARIS]）
 * @param time 观测时刻
 * @param slotOffset astronomy-engine STAR_SLOTS 起始槽位（避免与北斗撞车）
 * @param observerLon 观测地经度（默认洛阳）
 */
export const ziweiPositions = (
  stars: readonly ZiweiStar[],
  time: Date,
  slotOffset: number,
  observerLon = DEFAULT_OBSERVER_LON
): ZiweiPosition[] => {
  const lst = localSiderealTimeDeg(time, observerLon)
  return stars.map((star, i) => {
    const eq = fixedStarEquatorial(time, star.raJ2000, star.decJ2000, 100, slotOffset + i)
    const projAngle = normalizeAngle(lst - eq.ra + 90)
    return {
      ...star,
      ra: eq.ra,
      dec: eq.dec,
      plane: project(projAngle, eq.dec)
    }
  })
}
