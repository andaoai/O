import { computed, ref, onMounted, onUnmounted, type Ref } from 'vue'

/**
 * 罗盘侧栏布局状态：折叠 / 展开 + localStorage 持久化 + 逐 section 折叠
 *
 * ════════════════════════════════════════════════════════════════
 *  与旧 useControlPanel 的区别：
 *    ✅ 不再做浮动拖拽 —— 侧栏固定在左侧
 *    ✅ 折叠是"完全隐蔽"（translateX(-100%)），不再压缩为标题栏
 *    ✅ localStorage schema v2，与旧 v1 数据无冲突
 * ════════════════════════════════════════════════════════════════
 */

const STORAGE_PREFIX = 'yisiguan:sidebar'
const EXPANDED_KEY = `${STORAGE_PREFIX}:expanded`
const SECTIONS_KEY = `${STORAGE_PREFIX}:sections`
const SCHEMA_VERSION = 2

export interface UseSidebarLayoutOptions<K extends string> {
  /** 面板内所有可折叠 section 的 key */
  sectionKeys: readonly K[]
  /** 各 section 的初始 collapsed 状态 */
  defaultCollapsed?: Partial<Record<K, boolean>>
  /** 侧栏是否默认展开，默认 true */
  defaultExpanded?: boolean
}

export function useSidebarLayout<K extends string>(opts: UseSidebarLayoutOptions<K>) {
  const { sectionKeys, defaultCollapsed = {}, defaultExpanded = true } = opts

  // ─── 展开/折叠 ─────────────────────────────────────────────
  const expanded = ref<boolean>(defaultExpanded)

  function loadExpanded() {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(EXPANDED_KEY)
      if (raw === null) return
      const parsed = JSON.parse(raw)
      if (parsed?.v !== SCHEMA_VERSION) return
      if (typeof parsed.expanded === 'boolean') expanded.value = parsed.expanded
    } catch {
      /* ignore */
    }
  }
  function saveExpanded() {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(
        EXPANDED_KEY,
        JSON.stringify({ v: SCHEMA_VERSION, expanded: expanded.value })
      )
    } catch {
      /* ignore */
    }
  }

  const toggleExpanded = () => {
    expanded.value = !expanded.value
    saveExpanded()
  }
  const expand = () => {
    expanded.value = true
    saveExpanded()
  }
  const collapse = () => {
    expanded.value = false
    saveExpanded()
  }

  // ─── 各 section 折叠状态 ──────────────────────────────────
  const defaultsMap = defaultCollapsed as Record<K, boolean | undefined>
  const initialCollapsed = Object.fromEntries(
    sectionKeys.map((k) => [k, defaultsMap[k] ?? false])
  ) as Record<K, boolean>
  const collapsed: Ref<Record<K, boolean>> = ref(initialCollapsed) as Ref<Record<K, boolean>>

  function loadSections() {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(SECTIONS_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed?.v !== SCHEMA_VERSION || typeof parsed.data !== 'object') return
      sectionKeys.forEach((k) => {
        if (typeof parsed.data[k] === 'boolean') collapsed.value[k] = parsed.data[k]
      })
    } catch {
      /* ignore */
    }
  }
  function saveSections() {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(
        SECTIONS_KEY,
        JSON.stringify({ v: SCHEMA_VERSION, data: collapsed.value })
      )
    } catch {
      /* ignore */
    }
  }

  const toggleSection = (key: K) => {
    collapsed.value[key] = !collapsed.value[key]
    saveSections()
  }

  // ─── 键盘快捷键：Esc 收起侧栏 ─────────────────────────────
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && expanded.value) {
      const target = e.target as HTMLElement | null
      // 焦点在输入元素时不收侧栏
      if (target instanceof HTMLInputElement) return
      if (target instanceof HTMLTextAreaElement) return
      if (target?.isContentEditable) return
      collapse()
    }
  }
  onMounted(() => {
    // 客户端 hydration 完成后再读 localStorage，避免 SSR 与首屏不一致
    loadExpanded()
    loadSections()
    window.addEventListener('keydown', onKeyDown)
  })
  onUnmounted(() => window.removeEventListener('keydown', onKeyDown))

  return {
    expanded: computed(() => expanded.value),
    toggleExpanded,
    expand,
    collapse,
    collapsed,
    toggleSection
  }
}
