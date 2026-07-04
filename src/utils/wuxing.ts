/**
 * 五行配色 · 单一真理源 (Single Source of Truth for Wuxing Colors)
 *
 * ═══════════════════════════════════════════════════════════════
 *  历史上 WUXING_COLORS / STEM_ELEMENTS / BRANCH_ELEMENTS 散落在
 *  多个环组件里（SixtyJiaziRing / BranchesRing / StemsRing /
 *  HourShichenRing / MonthEstablishRing），一份配色多份抄本，
 *  这里统一收敛为纯常量 + 纯派生函数，其他模块 re-import。
 *
 *  纯常量 + 纯函数、零依赖、可安全跨 Layer 5 使用。
 *
 *  设计约定：
 *   - 全盘所有"按五行配色"的环 (段环 · 点环 · 体环) 必须消费本模块
 *     而非本地复制。避免调色板漂移。
 *   - 若需要单独定制颜色，组件仍可通过 `highlightColor` prop 覆盖，
 *     本模块只负责"默认自动配色"路径。
 * ═══════════════════════════════════════════════════════════════
 */

/** 五行类型 */
export type WuxingElement = '木' | '火' | '土' | '金' | '水'

/** 五行主配色（与纳音环 / 甲子环 / 地支环全盘一致） */
export const WUXING_COLORS: Readonly<Record<WuxingElement, string>> = {
  木: '#2ECC71',
  火: '#E74C3C',
  土: '#D35400',
  金: '#F1C40F',
  水: '#3498DB'
} as const

/**
 * 十天干五行：甲乙木、丙丁火、戊己土、庚辛金、壬癸水
 * 下标 = 天干序号 (甲=0 …癸=9)
 */
export const STEM_ELEMENTS: readonly WuxingElement[] = [
  '木', '木', '火', '火', '土', '土', '金', '金', '水', '水'
] as const

/**
 * 十二地支五行：子水丑土寅木卯木辰土巳火午火未土申金酉金戌土亥水
 * 下标 = 地支序号 (子=0 …亥=11)
 */
export const BRANCH_ELEMENTS: readonly WuxingElement[] = [
  '水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水'
] as const

/** 天干序号 (0-9) → 主配色 */
export const colorOfStem = (stemIndex: number): string =>
  WUXING_COLORS[STEM_ELEMENTS[((stemIndex % 10) + 10) % 10]!]

/** 地支序号 (0-11) → 主配色 */
export const colorOfBranch = (branchIndex: number): string =>
  WUXING_COLORS[BRANCH_ELEMENTS[((branchIndex % 12) + 12) % 12]!]
