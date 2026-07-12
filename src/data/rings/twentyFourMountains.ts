/**
 * 二十四山（地盘正针）静态数据
 *
 * ═══════════════════════════════════════════════════════════════
 *  二十四山是风水罗盘最基本的方位划分，每山 15°，
 *  由十二地支、八天干、四维卦组成。
 *
 *  📜 传统渊源：
 *    二十四山源于唐代杨筠松（杨公）所立"地盘正针"系统。
 *    罗盘三针中：地盘正针（杨公）勘定方位、人盘中针（赖公）消砂、
 *    天盘缝针（杨公）纳水。本盘使用地盘正针，为定向之本。
 *
 *    三合理论中二十四山分属 12 个双山（每山两两一组），
 *    分别对应五行四局（金/木/水/火），用于长生十二宫推算。
 *
 *  顺序（顺时针，子=0°）——杨公正针标准次序：
 *    子癸丑艮寅甲卯乙辰巽巳丙午丁未坤申庚酉辛戌乾亥壬
 *
 *  传统分类与配色（四色分际，一眼可辨方位属性）：
 *    · 四正（子午卯酉）= #C62828 赤红 —— 正北/正南/正东/正西，四正向
 *    · 四维（乾坤艮巽）= #F9A825 金黄 —— 四隅（天门/地户/人门/鬼门）
 *    · 八干（甲乙丙丁庚辛壬癸）= #E8D5B7 牙白 —— 天干配十二支补足 24 位
 *    · 十二支（丑寅辰巳未申戌亥）= #A0947C 褐灰 —— 地支占 12 正位
 *
 *  角度约定（地理 → SVG 坐标系映射）：
 *    · 地理 0° = 子 = 正北
 *    · 地理顺时针递增，每山 15°
 *    · startDegree: -90 将地理 0° 映射到 SVG 270°（正上 12 点钟方向）
 *      因为 SVG 坐标系中 0° = 正右（3 点钟），角度顺时针递增
 *      （y 轴向下），所以地理北对应 SVG -90° ≡ 270°
 *    · 段环渲染：svgAngle = (mountainCenter + startDegree) % 360
 *      → 子(0°) + (-90°) = 270° = SVG 正上 ✓
 * ═══════════════════════════════════════════════════════════════
 */

import type { RingData } from './types'

/** 二十四山名称（顺时针，子=0°） */
export const MOUNTAIN_NAMES: readonly string[] = [
  '子', '癸', '丑', '艮', '寅', '甲',
  '卯', '乙', '辰', '巽', '巳', '丙',
  '午', '丁', '未', '坤', '申', '庚',
  '酉', '辛', '戌', '乾', '亥', '壬'
] as const

/** 二十四山中心角度（子=0°，顺时针递增 15°） */
export const MOUNTAIN_CENTERS: readonly number[] = [
  0, 15, 30, 45, 60, 75,
  90, 105, 120, 135, 150, 165,
  180, 195, 210, 225, 240, 255,
  270, 285, 300, 315, 330, 345
] as const

/** 二十四山传统配色 */
const MOUNTAIN_COLORS: Record<string, string> = {
  // 四正（子午卯酉）· 赤红
  '子': '#C62828',
  '午': '#C62828',
  '卯': '#C62828',
  '酉': '#C62828',
  // 四维（乾坤艮巽）· 金黄
  '乾': '#F9A825',
  '坤': '#F9A825',
  '艮': '#F9A825',
  '巽': '#F9A825',
  // 八干（甲乙丙丁庚辛壬癸）· 牙白
  '甲': '#E8D5B7',
  '乙': '#E8D5B7',
  '丙': '#E8D5B7',
  '丁': '#E8D5B7',
  '庚': '#E8D5B7',
  '辛': '#E8D5B7',
  '壬': '#E8D5B7',
  '癸': '#E8D5B7',
  // 十二支（丑寅辰巳未申戌亥）· 褐灰
  '丑': '#A0947C',
  '寅': '#A0947C',
  '辰': '#A0947C',
  '巳': '#A0947C',
  '未': '#A0947C',
  '申': '#A0947C',
  '戌': '#A0947C',
  '亥': '#A0947C',
}

/** 由山名取传统配色（四正赤红/四维金黄/八干牙白/十二支褐灰） */
export function colorOfMountain(name: string): string {
  return MOUNTAIN_COLORS[name] ?? '#888888'
}

/**
 * 二十四山 RingData（段环）
 *
 * 段环 (Segment Ring)：每个山渲染为一个扇形 + 刻度 + 标签。
 * startDegree: -90 使子(0°) 映射到 SVG 正上（270°）。
 * 每山跨度 15°，从 center-7.5 到 center+7.5。
 *
 * 使用示例：
 *   <DataRing :data="twentyFourMountains" />
 *   或由 TwentyFourMountainsRing 时间驱动叠加高亮后传入。
 */
export const twentyFourMountains: RingData = {
  startDegree: -90,
  circleColor: '#666666',
  tickColor: '#888888',
  tickWidth: 1,
  fontSize: 14,
  showSectors: true,
  labelPosition: 0.5,
  verticalTwoChar: false,
  items: MOUNTAIN_NAMES.map((name, i) => {
    const center = MOUNTAIN_CENTERS[i]!
    return {
      label: name,
      color: colorOfMountain(name),
      startAngle: ((center - 7.5) % 360 + 360) % 360,
      endAngle: center + 7.5
    }
  })
}
