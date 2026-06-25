/**
 * 中国主要朝代表
 *
 * 年份采用 JS Date 约定：
 *   year = 1   → 公元1年
 *   year = 0   → 公元前1年
 *   year = -1  → 公元前2年
 *   year = -220 → 公元前221年
 * （没有公元0年，故公元前N年对应 jsYear = 1-N）
 *
 * 夏商周年份取学界近似值（夏商周断代工程），注释标注"约"。
 * 秦汉以后年份相对精确。
 */

export interface Dynasty {
  /** 朝代名 */
  name: string
  /** 起始年（JS year） */
  startYear: number
  /** 结束年（JS year，含该年） */
  endYear: number
  /** 代表色（UI 提示用） */
  color: string
}

/** 主要朝代（夏商周至清） */
export const DYNASTIES: Dynasty[] = [
  // 上古三代（年份为学界近似）
  { name: '夏', startYear: -2069, endYear: -1599, color: '#8B4513' },     // 约前2070—约前1600
  { name: '商', startYear: -1599, endYear: -1045, color: '#CD853F' },     // 约前1600—前1046
  { name: '周', startYear: -1045, endYear: -255, color: '#556B2F' },      // 前1046—前256（含西周、东周/春秋战国）

  // 帝制时代
  { name: '秦', startYear: -220, endYear: -206, color: '#8B0000' },       // 前221—前207
  { name: '西汉', startYear: -205, endYear: 7, color: '#B22222' },        // 前206—公元8
  { name: '新', startYear: 8, endYear: 22, color: '#A0522D' },            // 8—23（王莽）
  { name: '东汉', startYear: 23, endYear: 219, color: '#DC143C' },        // 25—220（注：23年起算含更始等过渡）
  { name: '三国', startYear: 220, endYear: 279, color: '#4169E1' },       // 220—280（魏蜀吴并立）
  { name: '晋', startYear: 280, endYear: 419, color: '#4682B4' },         // 265—420（西晋统一至东晋亡）
  { name: '南北朝', startYear: 420, endYear: 588, color: '#6A5ACD' },     // 420—589（南北分治）
  { name: '隋', startYear: 589, endYear: 617, color: '#708090' },         // 581—618
  { name: '唐', startYear: 618, endYear: 906, color: '#FF6347' },         // 618—907
  { name: '五代十国', startYear: 907, endYear: 959, color: '#9370DB' },   // 907—960
  { name: '宋', startYear: 960, endYear: 1278, color: '#32CD32' },        // 960—1279（北宋+南宋）
  { name: '元', startYear: 1279, endYear: 1367, color: '#20B2AA' },       // 1271—1368（取统一时间 1279 起）
  { name: '明', startYear: 1368, endYear: 1643, color: '#FF4500' },       // 1368—1644
  { name: '清', startYear: 1644, endYear: 1911, color: '#FFD700' }        // 1644—1912（宣统退位）
]

/** 查询某 JS year 所属的朝代 */
export function findDynasty(jsYear: number): Dynasty | null {
  for (const d of DYNASTIES) {
    if (jsYear >= d.startYear && jsYear <= d.endYear) {
      return d
    }
  }
  return null
}

/** 将 JS year 转为人类可读的年份文字 */
export function formatYear(jsYear: number): string {
  if (jsYear > 0) return `公元${jsYear}年`
  if (jsYear === 0) return '公元前1年'
  return `公元前${1 - jsYear}年`
}

/** 将 JS year 转为简写（如"前221"、"2024"） */
export function formatYearShort(jsYear: number): string {
  if (jsYear > 0) return `${jsYear}`
  if (jsYear === 0) return '前1'
  return `前${1 - jsYear}`
}
