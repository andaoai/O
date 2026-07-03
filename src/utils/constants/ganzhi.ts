/**
 * 干支常量的单一真理源 (Single Source of Truth for Ganzhi Constants)
 *
 * ═══════════════════════════════════════════════════════════════
 *  历史上项目里散落着多处 STEMS / BRANCHES / HOUR_START_STEM
 *  的独立定义（liushiJiazi.ts, eraCalendar.ts, chineseCalendar.ts,
 *  data/rings/sixtyJiazi.ts, data/rings/twelveShichen.ts …），
 *  这里统一收敛为一份纯常量文件，其他模块 re-import。
 *
 *  纯常量、零依赖、可安全跨 Layer 5 使用。
 * ═══════════════════════════════════════════════════════════════
 */

/** 十天干（甲乙丙丁戊己庚辛壬癸） */
export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const

/** 十二地支（子丑寅卯辰巳午未申酉戌亥） */
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const

export type Stem = (typeof STEMS)[number]
export type Branch = (typeof BRANCHES)[number]

/**
 * 日干 → 子时时干起始（五鼠遁）
 *   甲己起甲(0)、乙庚起丙(2)、丙辛起戊(4)、丁壬起庚(6)、戊癸起壬(8)
 * 下标为日干序号(0-9)，值为该日子时的时干序号(0-9)
 */
export const HOUR_START_STEM: readonly number[] = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8] as const

/**
 * 由六十甲子序号(0-59) 得干支名，如 0 → 甲子
 * 收敛于此，避免各处重复实现（原 utils/liushiJiazi.ts#ganzhiName / chineseCalendar.ts#getJiaziName）
 */
export function ganzhiName(index: number): string {
  const i = ((index % 60) + 60) % 60
  return STEMS[i % 10]! + BRANCHES[i % 12]!
}
