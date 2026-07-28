/**
 * useGuaRelationLayout — 卦关系盘环配置与面板汇总
 *
 * 从 GuaRelationView 提取的领域逻辑：
 *   · makeRingGroup() — 文字环组配置构建
 *   · rings — 推衍/全局模式环配置
 *   · hoveredPair — 全局模式悬停配对
 *   · hoveredRelationMeta — 当前关系元信息
 *   · focusSummary — 聚焦模式焦点卦汇总
 *   · focusedGuaLabel — 聚焦卦显示名
 */
import { computed, markRaw, type Ref } from 'vue'
import GuaRelationTextRing from '@/components/rings/GuaRelationTextRing.vue'
import DeriveStatRing from '@/components/rings/gua-relation/DeriveStatRing.vue'
import type { GuaRelationTextLayer } from '@/components/rings/GuaRelationTextRing.vue'
import type { GuaRelationMode } from '@/composables/useGuaRelationInteraction'
import {
  RELATION_METAS,
  type FocusRelationEntry,
  type GuaRelationEntry,
  type GuaRelationType,
  type GuaLayout,
} from '@/utils/guaRelations'
import { computeDeriveChain } from '@/utils/guaDeriveChain'
import { WENWANG_GUA_BY_VALUE, getUnicodeHexagram } from '@/data/sixtyFourGua'

/** 六爻位标签：0=初爻，5=上爻 */
export const YAO_LABELS = ['初', '二', '三', '四', '五', '上'] as const

/** 环间间隙 */
const GAP = 1
/** 推衍层间距（组与组之间明显留白） */
const GROUP_GAP = 8

/**
 * 每层文本环的固定径向厚度（px）
 *
 * 以 OUTER_RADIUS 为外边界，由外向内累加环厚，
 * 余下的自然成为圆心空间。隐藏的环不占空间，圆心自动扩大。
 *   卦名(name): 22px — 2 字卦名 + 内边距
 *   五行(element): 16px — 2 字五行 + 内边距
 *   卦符(unicode): 30px — 魁字卦符 + 内边距
 *   内卦五行(innerElement): 14px — 1 字五行 + 内边距
 *   外卦五行(outerElement): 14px — 1 字五行 + 内边距
 *   二进制(binary): 16px — 6 位 0/1 + 内边距
 *   十进制(decimal): 14px — 1~2 位数字 + 内边距
 *   阴阳(yinYang): 18px — 3 字体性 + 内边距
 */
const LAYER_THICKNESS: Record<GuaRelationTextLayer, number> = {
  name: 22,
  element: 16,
  unicode: 30,
  innerElement: 14,
  outerElement: 14,
  binary: 16,
  decimal: 14,
}

export interface RingVisibility {
  element: boolean
  innerElement: boolean
  outerElement: boolean
  binary: boolean
  decimal: boolean
}

type RingLayerConfig = {
  key: keyof RingVisibility | 'always'
  layer: GuaRelationTextLayer
  always: boolean
}

/** 各文本环层级定义（由外到内，RingStack 反向累加） */
const RING_LAYERS: readonly RingLayerConfig[] = [
  { key: 'decimal',       layer: 'decimal',       always: false },
  { key: 'binary',        layer: 'binary',        always: false },
  { key: 'outerElement',  layer: 'outerElement',  always: false },
  { key: 'innerElement',  layer: 'innerElement',  always: false },
  { key: 'always',        layer: 'unicode',       always: true  },
  { key: 'element',       layer: 'element',       always: false },
  { key: 'always',        layer: 'name',          always: true  },
] as const

type RingGroupItem = {
  component: ReturnType<typeof markRaw>
  thickness: number
  gapBefore: number
  props: Record<string, unknown>
}

interface GuaRelationLayoutOptions {
  mode: Ref<GuaRelationMode>
  relationType: Ref<GuaRelationType>
  deriveDepth: Ref<number>
  movingLines: Ref<Set<number>>
  ringVisibility: Ref<RingVisibility>
  layout: Ref<GuaLayout>
  focusedValue: Ref<number | null>
  hoveredValue: Ref<number | null>
  relationTable: Ref<readonly GuaRelationEntry[]>
  effectiveFocusedValue: Ref<number | null>
}

/**
 * 卦关系盘环配置与面板汇总
 *
 * @returns rings / hoveredPair / hoveredRelationMeta / focusSummary / focusedGuaLabel
 */
export function useGuaRelationLayout(options: GuaRelationLayoutOptions) {
  const {
    mode,
    relationType,
    deriveDepth,
    movingLines,
    ringVisibility,
    layout,
    focusedValue,
    hoveredValue,
    relationTable,
    effectiveFocusedValue,
  } = options

  /** 聚焦卦的显示名 */
  const focusedGuaLabel = computed(() => {
    if (focusedValue.value === null) return null
    const meta = WENWANG_GUA_BY_VALUE[focusedValue.value]
    if (!meta) return null
    return { unicode: getUnicodeHexagram(meta.wenwangOrder), name: meta.name }
  })

  // ─── 详情面板派生（HTML 浮层用） ───

  /**
   * 全局模式悬停配对：hoveredValue 找到 relationTable 中第一条匹配 entry
   * 聚焦模式此值为 null（改由 focusSummary 展示）
   */
  const hoveredPair = computed<GuaRelationEntry | null>(() => {
    if (mode.value !== 'global') return null
    if (hoveredValue.value === null) return null
    return relationTable.value.find(
      e => e.sourceValue === hoveredValue.value || e.targetValue === hoveredValue.value,
    ) as GuaRelationEntry | null ?? null
  })

  /** 全局模式当前关系元信息 */
  const hoveredRelationMeta = computed(() => RELATION_METAS[relationType.value])

  /** 聚焦模式：焦点卦 + 所有目标卦汇总（hover 预览时使用 effectiveFocusedValue） */
  const focusSummary = computed(() => {
    if (mode.value !== 'focus') return null
    if (effectiveFocusedValue.value === null) return null
    const items = relationTable.value.filter(
      e => 'type' in e,
    ) as FocusRelationEntry[]
    if (items.length === 0) return null
    const source = items[0]!
    const movingList = Array.from(movingLines.value).sort((a, b) => a - b)
    const movingText = movingList.length === 0 ? '无' : movingList.map(i => YAO_LABELS[i]).join('、')
    return {
      sourceUnicode: source.sourceUnicode,
      sourceName: source.sourceName,
      sourcePalace: source.palace,
      sourceColor: source.color,
      sourceShiying: source.shiyingType,
      movingText,
      items,
      /** 是否为固定焦点（true）还是 hover 预览（false） */
      isPinned: focusedValue.value !== null,
    }
  })

  // ─── RingStack 环配置 ───

  /**
   * 生成一组文字环配置（外→内 5 或 7 层，取决于图层显隐）
   *
   * @param derivedValues  可选的派生卦映射：未传 → 第 0 层源卦；传入 → 内层派生卦
   * @param firstGap       该组第一环相对上一组的间隙（组间留白）
   */
  function makeRingGroup(
    derivedValues: readonly number[] | undefined,
    firstGap: number,
  ): RingGroupItem[] {
    const visible = RING_LAYERS.filter(
      r => r.always || ringVisibility.value[r.key as keyof RingVisibility]
    )
    return visible.map((r, idx) => ({
      component: markRaw(GuaRelationTextRing),
      thickness: LAYER_THICKNESS[r.layer],
      // 组内第一环用组间距 firstGap；组内其余环用默认小间距 GAP
      gapBefore: idx === 0 ? firstGap : GAP,
      props: {
        layer: r.layer,
        layout: layout.value,
        relationType: relationType.value,
        startDegree: 0,
        // 五行环隐藏时，name/unicode 回退到宫色补偿
        usePaletteColorFallback: (r.layer === 'name' || r.layer === 'unicode') && !ringVisibility.value.element,
        // 推衍层的派生卦映射（第 0 层源卦不传）
        derivedValues,
      }
    }))
  }

  const rings = computed(() => {
    if (mode.value === 'derive') {
      // 推衍模式：外圈起，第 0 层源卦 + 第 1..deriveDepth 层链式派生卦
      const chain = computeDeriveChain(
        relationType.value,
        deriveDepth.value,
        Array.from(movingLines.value),
      )
      const groups: RingGroupItem[] = []
      for (let k = 0; k < chain.length; k++) {
        const values = chain[k]!
        // 每层文字环组的正外侧插一层独立的发光统计环，
        // 环厚 14px，独占空间，数字标签落在环带正中央，永不与相邻卦名/卦符重叠
        groups.push({
          component: markRaw(DeriveStatRing),
          thickness: 14,
          // 第 0 层不留组间距；第 k>0 层用 GROUP_GAP 拉开与上一组的距离
          gapBefore: k === 0 ? GAP : GROUP_GAP,
          props: {
            derivedValues: values,
            layerIndex: k,
            startDegree: 0,
          },
        })
        // 该层文字环组紧接统计环之后，无额外间距（组内 GAP）
        groups.push(...makeRingGroup(values, GAP))
      }
      return groups
    }
    return makeRingGroup(undefined, GAP)
  })

  return {
    rings,
    hoveredPair,
    hoveredRelationMeta,
    focusSummary,
    focusedGuaLabel,
  }
}
