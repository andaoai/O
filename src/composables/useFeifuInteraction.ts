/**
 * useFeifuInteraction — 飞伏图盘跨组件交互状态
 *
 * 提供（FeifuView） + 注入（FeifuCenter / FeifuTextRing）模式，
 * 共享 hover / 筛选状态。
 *
 * 设计原则：
 * - FeifuView 调用 useFeifuInteraction(options) 创建状态实例
 * - FeifuCenter 和 FeifuTextRing 通过 inject(FEIFU_KEY) 获取共享状态
 * - 所有筛选逻辑集中于此，子组件只消费不计算
 */
import { ref, computed, type Ref, type InjectionKey, type ComputedRef } from 'vue'
import { FEIFU_TABLE, PURE_GUA_VALUES, type FeifuEntry, type FeifuLayout } from '@/utils/feifu'
import type { ShiyingType } from '@/data/rings/jingFangEightPalaces'

// ─── 依赖注入 Key ───

export type FeifuInteraction = ReturnType<typeof useFeifuInteraction>
export const FEIFU_KEY: InjectionKey<FeifuInteraction> = Symbol('feifu')

// ─── 输入参数 ───

export interface FeifuInteractionOptions {
  shiyingFilter: Ref<ShiyingType[]>
  palaceFilter: Ref<string[]>
}

// ─── 状态工厂 ───

export function useFeifuInteraction(options?: FeifuInteractionOptions) {
  // 悬停状态（所有组件读写）
  const hoveredValue = ref<number | null>(null)
  const isHovered: ComputedRef<boolean> = computed(() => hoveredValue.value !== null)

  function setHovered(value: number | null) {
    hoveredValue.value = value
  }

  // ─── 筛选后的条目 ───

  const filteredEntries: ComputedRef<readonly FeifuEntry[]> = computed(() => {
    if (!options) return FEIFU_TABLE
    const shiying = options.shiyingFilter.value
    const palace = options.palaceFilter.value
    if (shiying.length === 0 && palace.length === 0) return FEIFU_TABLE
    return FEIFU_TABLE.filter(entry => {
      if (shiying.length > 0 && !shiying.includes(entry.shiyingType)) return false
      if (palace.length > 0 && !palace.includes(entry.palace)) return false
      return true
    })
  })

  // ─── 筛选可见的卦值集合 ───

  const activeFeiValues: ComputedRef<Set<number> | null> = computed(() => {
    const entries = filteredEntries.value
    if (!options) return null // 无筛选 → 全部可见
    const shiying = options.shiyingFilter.value
    const palace = options.palaceFilter.value
    if (shiying.length === 0 && palace.length === 0) return null
    const set = new Set<number>()
    for (const e of entries) {
      set.add(e.feiValue)
      set.add(e.fuValue)
    }
    return set
  })

  // ─── 节点匹配判断 ───

  /** 某值是否与当前悬停节点通过箭头关联 */
  function isNodeMatch(value: number): boolean {
    if (hoveredValue.value === null) return true
    if (value === hoveredValue.value) return true
    return filteredEntries.value.some(
      e =>
        (e.feiValue === hoveredValue.value && e.fuValue === value) ||
        (e.fuValue === hoveredValue.value && e.feiValue === value)
    )
  }

  /** 某值是否在筛选范围内 */
  function isNodeActive(value: number): boolean {
    const set = activeFeiValues.value
    return set === null || set.has(value)
  }

  /** 是否为纯卦 */
  function isPureGua(value: number): boolean {
    return PURE_GUA_VALUES.includes(value)
  }

  /** 某条箭头的 entry 是否包含当前悬停的卦值（用于箭头层高亮） */
  function isArrowMatch(entry: FeifuEntry): boolean {
    if (hoveredValue.value === null) return true
    return entry.feiValue === hoveredValue.value || entry.fuValue === hoveredValue.value
  }

  return {
    hoveredValue,
    isHovered,
    setHovered,
    filteredEntries,
    activeFeiValues,
    isNodeMatch,
    isNodeActive,
    isPureGua,
    isArrowMatch
  }
}
