/**
 * useGuaRelationInteraction — 卦关系图盘跨组件交互状态
 *
 * 提供（GuaRelationView） + 注入（GuaRelationCenter / GuaRelationTextRing）模式，
 * 共享 hover / 筛选 / 聚焦 状态。
 *
 * 设计原则：
 * - GuaRelationView 调用 useGuaRelationInteraction(options) 创建状态实例
 * - GuaRelationCenter 和 GuaRelationTextRing 通过 inject(GUA_RELATION_KEY) 获取共享状态
 * - 所有筛选逻辑集中于此，子组件只消费不计算
 * - 支持两种模式：
 *     global — 单选一种关系，全 64 条箭头（原有行为）
 *     focus  — 选中单卦，同时显示多种关系箭头（互/综/错/变…）
 * - 支持动态切换关系类型（飞伏/互卦/对卦/综卦/交卦/变卦）
 */
import { ref, computed, type Ref, type InjectionKey, type ComputedRef } from 'vue'
import { FEIFU_TABLE } from '@/utils/guaRelationArrows'
import {
  computeRelationTable,
  computeFocusRelations,
  RELATION_METAS,
  PURE_GUA_VALUES,
  type GuaRelationType,
  type GuaRelationEntry,
  type FocusRelationEntry,
} from '@/utils/guaRelations'
import type { ShiyingType } from '@/data/rings/jingFangEightPalaces'

// ─── 依赖注入 Key ───

export type GuaRelationInteraction = ReturnType<typeof useGuaRelationInteraction>
export const GUA_RELATION_KEY: InjectionKey<GuaRelationInteraction> = Symbol('gua-relation')

// ─── 模式类型 ───

export type GuaRelationMode = 'global' | 'focus'

// ─── 输入参数 ───

export interface GuaRelationInteractionOptions {
  shiyingFilter: Ref<ShiyingType[]>
  palaceFilter: Ref<string[]>
  /** 当前关系类型（全局模式生效，默认为 'feifu'） */
  relationType?: Ref<GuaRelationType>
  /** 显示模式（默认 'global'） */
  mode?: Ref<GuaRelationMode>
  /** 聚焦卦值（focus 模式下必填） */
  focusedValue?: Ref<number | null>
  /** 聚焦模式下要展示的关系类型集合 */
  focusRelationTypes?: Ref<Set<GuaRelationType>>
  /** 动爻位（变卦用），元素范围 0..5 */
  movingLines?: Ref<Set<number>>
}

// ─── 状态工厂 ───

export function useGuaRelationInteraction(options?: GuaRelationInteractionOptions) {
  // 悬停状态（所有组件读写）
  const hoveredValue = ref<number | null>(null)
  const isHovered: ComputedRef<boolean> = computed(() => hoveredValue.value !== null)

  function setHovered(value: number | null) {
    hoveredValue.value = value
  }

  // ─── 模式 & 聚焦 ───

  const mode: ComputedRef<GuaRelationMode> = computed(() => options?.mode?.value ?? 'global')
  const focusedValue: ComputedRef<number | null> = computed(() => options?.focusedValue?.value ?? null)

  /**
   * 聚焦模式下"实际显示"的焦点卦：
   *   focusedValue（已点击固定）优先，为空时降级到 hoveredValue（hover 预览）
   *   全局模式下始终为 null
   *
   * 用于渲染箭头 / 汇总面板 / 文字环高亮。
   */
  const effectiveFocusedValue: ComputedRef<number | null> = computed(() => {
    if (mode.value !== 'focus') return null
    return focusedValue.value ?? hoveredValue.value
  })

  function setFocused(value: number | null) {
    if (!options?.focusedValue) return
    options.focusedValue.value = value
  }

  /** 切换某个卦的聚焦状态：未选 → 选中该卦；已选中同一卦 → 取消聚焦 */
  function toggleFocused(value: number) {
    if (!options?.focusedValue) return
    options.focusedValue.value = options.focusedValue.value === value ? null : value
  }

  // ─── 当前关系表（依模式派生） ───

  /**
   * 聚焦模式下，从 effectiveFocusedValue 出发对 focusRelationTypes 中每种关系产出一条 entry。
   * effectiveFocusedValue 优先取 focusedValue（固定），退化到 hoveredValue（hover 预览）。
   * 全局模式下沿用 computeRelationTable。
   */
  const relationTable: ComputedRef<readonly GuaRelationEntry[]> = computed(() => {
    if (mode.value === 'focus') {
      const source = effectiveFocusedValue.value
      if (source === null) return []
      const types = Array.from(options?.focusRelationTypes?.value ?? new Set<GuaRelationType>())
      if (types.length === 0) return []
      const moving = Array.from(options?.movingLines?.value ?? new Set<number>())
      return computeFocusRelations(source, types, moving)
    }
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

  /**
   * 筛选策略（依关系类型元数据）：
   *
   * 全局模式：
   *   非 feifu 关系（互卦/对卦/综卦/交卦/变卦）：
   *     filterSourceOnly=true → 只检查源卦的宫/世位。
   *   feifu 关系：
   *     filterSourceOnly=false → 同时匹配源卦和目标卦（64→8 收敛可视化）。
   *
   * 聚焦模式：
   *   关系条目已由 focusedValue 单点派生，筛选无意义 → 直接返回全部。
   */
  const filteredEntries: ComputedRef<readonly GuaRelationEntry[]> = computed(() => {
    if (!options) return relationTable.value
    if (mode.value === 'focus') return relationTable.value

    const shiying = options.shiyingFilter.value
    const palace = options.palaceFilter.value
    if (shiying.length === 0 && palace.length === 0) return relationTable.value

    const type = options.relationType?.value ?? 'feifu'
    const meta = RELATION_METAS[type]
    const sourceOnly = meta.filterSourceOnly

    return relationTable.value.filter(entry => {
      // 世位筛选
      if (shiying.length > 0) {
        const candidates = [entry.shiyingType]
        // feifu 关系额外检查目标卦的世位（收敛视图）
        if (!sourceOnly) candidates.push(entry.targetShiyingType)
        if (!candidates.some(s => s && shiying.includes(s as ShiyingType))) return false
      }
      // 八宫筛选
      if (palace.length > 0) {
        const candidates = [entry.palace]
        // feifu 关系额外检查目标卦的宫（收敛视图）
        if (!sourceOnly) candidates.push(entry.targetPalace)
        if (!candidates.some(p => p && palace.includes(p))) return false
      }
      return true
    })
  })

  // ─── 筛选可见的卦值集合 ───

  const activeFeiValues: ComputedRef<Set<number> | null> = computed(() => {
    const entries = filteredEntries.value
    // 聚焦模式：
    //   有 effectiveFocusedValue（含 hover 预览） → 收敛到焦点 + N 个目标卦
    //   否则 → 全部卦保持可见（可选卦）
    if (mode.value === 'focus') {
      const source = effectiveFocusedValue.value
      if (source === null) return null
      const set = new Set<number>([source])
      for (const e of entries) set.add(e.targetValue)
      return set
    }
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
    // 聚焦模式下：由 activeFeiValues 直接控制可见集，不再按 hover 做二次过滤
    // （否则会与"hover 预览"逻辑冲突，让固定焦点被误 dim）
    if (mode.value === 'focus') return true
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
    if (mode.value === 'focus') return false
    const type = options?.relationType?.value
    if (type && type !== 'feifu') return false
    return PURE_GUA_VALUES.includes(value)
  }

  /** 某条箭头的 entry 是否包含当前悬停的卦值（用于箭头层高亮） */
  function isArrowMatch(entry: GuaRelationEntry): boolean {
    // 聚焦模式：箭头全部来自当前焦点，不做 hover 二次筛选
    if (mode.value === 'focus') return true
    if (hoveredValue.value === null) return true
    return entry.sourceValue === hoveredValue.value || entry.targetValue === hoveredValue.value
  }

  /** 是否为"实际的"焦点卦（固定 focusedValue 或 hover 预览，用于文字环高亮） */
  function isFocused(value: number): boolean {
    return mode.value === 'focus' && effectiveFocusedValue.value === value
  }

  return {
    // hover
    hoveredValue,
    isHovered,
    setHovered,
    // focus
    mode,
    focusedValue,
    effectiveFocusedValue,
    setFocused,
    toggleFocused,
    isFocused,
    // 关系条目
    relationTable: relationTable as ComputedRef<readonly (GuaRelationEntry | FocusRelationEntry)[]>,
    filteredEntries: filteredEntries as ComputedRef<readonly (GuaRelationEntry | FocusRelationEntry)[]>,
    activeFeiValues,
    // 节点判定
    isNodeMatch,
    isNodeActive,
    isPureGua,
    isArrowMatch,
    isEntryFiltered,
  }
}
