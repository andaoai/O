/**
 * useFeifuInteraction — 卦关系图盘跨组件交互状态
 *
 * 提供（FeifuView） + 注入（FeifuCenter / FeifuTextRing）模式，
 * 共享 hover / 筛选状态。
 *
 * 设计原则：
 * - FeifuView 调用 useFeifuInteraction(options) 创建状态实例
 * - FeifuCenter 和 FeifuTextRing 通过 inject(FEIFU_KEY) 获取共享状态
 * - 所有筛选逻辑集中于此，子组件只消费不计算
 * - 支持动态切换关系类型（飞伏/互卦/对卦/综卦/交卦）
 */
import { ref, computed, type Ref, type InjectionKey, type ComputedRef } from 'vue'
import { FEIFU_TABLE, type FeifuEntry } from '@/utils/feifu'
import {
  computeRelationTable,
  PURE_GUA_VALUES,
  type GuaRelationType,
  type GuaRelationEntry,
} from '@/utils/guaRelations'
import type { ShiyingType } from '@/data/rings/jingFangEightPalaces'

// ─── 依赖注入 Key ───

export type FeifuInteraction = ReturnType<typeof useFeifuInteraction>
export const FEIFU_KEY: InjectionKey<FeifuInteraction> = Symbol('feifu')

// ─── 输入参数 ───

export interface FeifuInteractionOptions {
  shiyingFilter: Ref<ShiyingType[]>
  palaceFilter: Ref<string[]>
  /** 当前关系类型（可选，默认为 'feifu'） */
  relationType?: Ref<GuaRelationType>
}

// ─── 状态工厂 ───

export function useFeifuInteraction(options?: FeifuInteractionOptions) {
  // 悬停状态（所有组件读写）
  const hoveredValue = ref<number | null>(null)
  const isHovered: ComputedRef<boolean> = computed(() => hoveredValue.value !== null)

  function setHovered(value: number | null) {
    hoveredValue.value = value
  }

  // ─── 当前关系表（动态切换） ───

  const relationTable: ComputedRef<readonly GuaRelationEntry[]> = computed(() => {
    const type = options?.relationType?.value
    if (type && type !== 'feifu') {
      return computeRelationTable(type)
    }
    // feifu 类型（或未指定）：使用现有的 FEIFU_TABLE
    return FEIFU_TABLE.map(e => ({
      sourceValue: e.feiValue,
      targetValue: e.fuValue,
      sourceName: e.feiName,
      targetName: e.fuName,
      sourceUnicode: e.feiUnicode,
      targetUnicode: e.fuUnicode,
      palace: e.palace,
      color: e.color,
      shiyingType: e.shiyingType,
    }))
  })

  // ─── 筛选后的条目 ───

  const filteredEntries: ComputedRef<readonly GuaRelationEntry[]> = computed(() => {
    if (!options) return relationTable.value
    const shiying = options.shiyingFilter.value
    const palace = options.palaceFilter.value
    if (shiying.length === 0 && palace.length === 0) return relationTable.value
    return relationTable.value.filter(entry => {
      // 世位筛选：源卦或目标卦的世位匹配即可
      if (shiying.length > 0) {
        const shiyingMatches = [
          entry.shiyingType,
          entry.targetShiyingType,
        ].some(s => s && shiying.includes(s as ShiyingType))
        if (!shiyingMatches) return false
      }
      // 八宫筛选：源卦或目标卦的宫匹配即可
      if (palace.length > 0) {
        const palaceMatches = [
          entry.palace,
          entry.targetPalace,
        ].some(p => p && palace.includes(p))
        if (!palaceMatches) return false
      }
      return true
    })
  })

  // ─── 筛选可见的卦值集合 ───

  const activeFeiValues: ComputedRef<Set<number> | null> = computed(() => {
    const entries = filteredEntries.value
    if (!options) return null
    const shiying = options.shiyingFilter.value
    const palace = options.palaceFilter.value
    if (shiying.length === 0 && palace.length === 0) return null
    const set = new Set<number>()
    for (const e of entries) {
      set.add(e.sourceValue)
      set.add(e.targetValue)
    }
    return set
  })

  // ─── 条目级筛选判定 ───

  /** 筛选通过条目的 "source,target" 码集，O(1) 查表用 */
  const filteredEntryKeys: ComputedRef<Set<string> | null> = computed(() => {
    if (activeFeiValues.value === null) return null
    const set = new Set<string>()
    for (const e of filteredEntries.value) {
      set.add(`${e.sourceValue},${e.targetValue}`)
    }
    return set
  })

  /** 某条 source→target 箭头是否通过当前筛选 */
  function isEntryFiltered(sourceValue: number, targetValue: number): boolean {
    const keys = filteredEntryKeys.value
    if (keys === null) return true // 无筛选 → 全部通过
    return keys.has(`${sourceValue},${targetValue}`)
  }

  // ─── 节点匹配判断 ───

  /** 某值是否与当前悬停节点通过箭头关联 */
  function isNodeMatch(value: number): boolean {
    if (hoveredValue.value === null) return true
    if (value === hoveredValue.value) return true
    return filteredEntries.value.some(
      e =>
        (e.sourceValue === hoveredValue.value && e.targetValue === value) ||
        (e.targetValue === hoveredValue.value && e.sourceValue === value),
    )
  }

  /** 某值是否在筛选范围内 */
  function isNodeActive(value: number): boolean {
    const set = activeFeiValues.value
    return set === null || set.has(value)
  }

  /** 是否为纯卦（仅 feifu 关系有意义，非 feifu 返回 false） */
  function isPureGua(value: number): boolean {
    const type = options?.relationType?.value
    if (type && type !== 'feifu') return false
    return PURE_GUA_VALUES.includes(value)
  }

  /** 某条箭头的 entry 是否包含当前悬停的卦值（用于箭头层高亮） */
  function isArrowMatch(entry: GuaRelationEntry): boolean {
    if (hoveredValue.value === null) return true
    return entry.sourceValue === hoveredValue.value || entry.targetValue === hoveredValue.value
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
    isArrowMatch,
    isEntryFiltered,
  }
}
