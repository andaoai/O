/**
 * 极坐标几何工具（单一来源）
 *
 * 此前 polarToCartesian / 角度归一化 / 文字径向旋转 / 环弧 path 在 PolarCanvas、
 * CircleRing、GuaRing、PlanetDegreeRing、DegreeScale 等多个组件里各写一遍，口径还
 * 不完全一致（有的支持 counterclockwise，有的写死 clockwise）。这里收口为一组纯函数，
 * 所有环类组件统一调用，改坐标约定只改这一处。
 *
 * 统一坐标约定（与历史 SVG 渲染一致，勿改）：
 *   - 中心在 (0,0)，0° 在正右（3 点钟），clockwise 时角度顺时针增大（y 轴向下的 SVG 里
 *     sin 为正即向下）。
 *   - counterclockwise 通过对角度取反实现。
 *   - 注意：天极投影星图（SkyChart）/ 日心盘（HelioOrbits）是另一套「y 取反」投影坐标，
 *     不走本模块，勿强行套用。
 */

export type RotationDirection = 'clockwise' | 'counterclockwise'

const D2R = Math.PI / 180

/** 角度归一化到 [0, 360) —— 负数也能正确回卷（JS 原生 % 对负数会出负值） */
export const normalizeAngle = (angle: number): number => ((angle % 360) + 360) % 360

/**
 * 极坐标 → 笛卡尔（相对中心 0,0）
 * counterclockwise 时对角度取反，与历史各组件实现一致。
 */
export const polarToCartesian = (
  angle: number,
  radius: number,
  direction: RotationDirection = 'clockwise'
): { x: number; y: number } => {
  const adjusted = direction === 'counterclockwise' ? -angle : angle
  const rad = adjusted * D2R
  return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius }
}

/**
 * 径向文字旋转角：使文字「顶部指向圆心」沿径向竖立。
 * clockwise → angle + 90；counterclockwise → -angle + 90。
 */
export const radialTextRotation = (
  angle: number,
  direction: RotationDirection = 'clockwise'
): number => (direction === 'counterclockwise' ? -angle + 90 : angle + 90)

/**
 * 角度区间中点（处理跨 0°）。
 * 如 345°→15° 返回 0°。
 */
export const getMidAngle = (startAngle: number, endAngle: number): number => {
  if (startAngle > endAngle) {
    const span = 360 - startAngle + endAngle
    return (startAngle + span / 2 + 360) % 360
  }
  return (startAngle + endAngle) / 2
}

/**
 * 生成环弧 / 扇形 SVG path。
 *   innerRadius === 0 → 扇形（从圆心出发）；> 0 → 环带（内外两弧）。
 * direction 透传给 polarToCartesian，使逆时针环的路径方向正确。
 */
export const arcPath = (
  radius: number,
  startAngle: number,
  endAngle: number,
  innerRadius = 0,
  direction: RotationDirection = 'clockwise'
): string => {
  const start = polarToCartesian(startAngle, radius, direction)
  const end = polarToCartesian(endAngle, radius, direction)
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0
  // 🔑 逆时针时 sweep-flag 取 0（SVG 逆时针），与 polarToCartesian 的取反坐标一致
  const sweep = direction === 'counterclockwise' ? 0 : 1
  if (innerRadius === 0) {
    return `M 0,0 L ${start.x},${start.y} A ${radius},${radius} 0 ${largeArcFlag},${sweep} ${end.x},${end.y} Z`
  }
  const startInner = polarToCartesian(startAngle, innerRadius, direction)
  const endInner = polarToCartesian(endAngle, innerRadius, direction)
  return `M ${start.x},${start.y} A ${radius},${radius} 0 ${largeArcFlag},${sweep} ${end.x},${end.y} L ${endInner.x},${endInner.y} A ${innerRadius},${innerRadius} 0 ${largeArcFlag},${1 - sweep} ${startInner.x},${startInner.y} Z`
}
