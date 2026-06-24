/**
 * 天极投影（等距方位投影 azimuthal equidistant，即中国盖天图画法）
 *
 * 让赤道、黄道、白道都投影成「会在正确位置相交」的曲线：
 * - 黄道与赤道相交于春分点/秋分点
 * - 白道与黄道相交于升/降交点
 *
 * 每个天体待在自己的圈上：太阳五星在黄道、月球在白道、二十八宿在赤道。
 * 投影公式（以北天极为心，极径正比于北极距）：极径 r = (90° − δ)/90°，极角 = 赤经。
 *   北天极 δ=90° → r=0；赤道 δ=0° → r=1；南天 δ<0 → r>1。
 * 相比极球面投影，三圈大小更接近、圆心更近（黄道偏心约 0.26R、最大鼓出约 1.26R），
 * 便于外接套环；代价是黄道/白道为极轻微的卵形而非正圆，但春秋分、升降交点依旧精确相交。
 * 输出为数学坐标（x 右、y 上，赤道半径=1），渲染层乘 R 并把 y 取反。
 */

const D2R = Math.PI / 180
const R2D = 180 / Math.PI

/** 黄赤交角（度） */
export const OBLIQUITY = 23.4392811
/** 黄白交角（度） */
export const LUNAR_INCLINATION = 5.145

export interface PlanePoint {
  x: number
  y: number
}

/**
 * 等距方位投影：赤经赤纬 → 单位平面坐标（天极=原点，赤道半径=1）
 * 极径正比于北极距：r = (90° − δ)/90°
 */
export const project = (raDeg: number, decDeg: number): PlanePoint => {
  const r = (90 - decDeg) / 90
  const a = raDeg * D2R
  return { x: r * Math.cos(a), y: r * Math.sin(a) }
}

/**
 * 黄道坐标 → 赤道坐标
 */
export const eclipticToEquatorial = (
  lonDeg: number,
  latDeg = 0
): { ra: number; dec: number } => {
  const l = lonDeg * D2R
  const b = latDeg * D2R
  const e = OBLIQUITY * D2R
  const dec = Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l))
  const ra = Math.atan2(
    Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e),
    Math.cos(l)
  )
  return { ra: ((ra * R2D) % 360 + 360) % 360, dec: dec * R2D }
}

/**
 * 白道上某点（自升交点起 u 度）→ 赤道坐标
 *
 * @param uDeg 沿白道的角度（从升交点起）
 * @param ascendingNodeLon 升交点黄经
 * @param inclination 黄白交角
 */
export const moonPointToEquatorial = (
  uDeg: number,
  ascendingNodeLon: number,
  inclination = LUNAR_INCLINATION
): { ra: number; dec: number } => {
  const u = uDeg * D2R
  const i = inclination * D2R
  const dLon = Math.atan2(Math.cos(i) * Math.sin(u), Math.cos(u)) * R2D
  const beta = Math.asin(Math.sin(i) * Math.sin(u)) * R2D
  return eclipticToEquatorial(ascendingNodeLon + dLon, beta)
}

/* ── 圆心（几何中心）──
 * 等距投影下黄道/白道是极轻微卵形，无唯一圆心；
 * 取曲线赤纬最高点与最低点投影后的中点作为其几何中心——
 * 这两点落在卵形对称轴的两端（赤纬极值方向 = 偏心方向），故对黄道/白道通用。
 */

/** 扫描一条轨道曲线，返回赤纬最高/最低两点投影的中点 */
const curveCenter = (
  toEq: (deg: number) => { ra: number; dec: number },
  step = 1
): PlanePoint => {
  let north = toEq(0)
  let south = north
  for (let d = step; d < 360; d += step) {
    const eq = toEq(d)
    if (eq.dec > north.dec) north = eq
    if (eq.dec < south.dec) south = eq
  }
  const pn = project(north.ra, north.dec)
  const ps = project(south.ra, south.dec)
  return { x: (pn.x + ps.x) / 2, y: (pn.y + ps.y) / 2 }
}

/** 黄道几何中心（卵形对称轴上的偏心位置） */
export const eclipticCenter = (): PlanePoint =>
  curveCenter((lon) => eclipticToEquatorial(lon))

/** 白道几何中心 */
export const whiteWayCenter = (
  ascendingNodeLon: number,
  inclination = LUNAR_INCLINATION
): PlanePoint => curveCenter((u) => moonPointToEquatorial(u, ascendingNodeLon, inclination))
