import { computed, ref, onMounted, onUnmounted, type CSSProperties, type Ref } from 'vue'

/**
 * Control 面板外壳 · 拖拽 / 折叠 / 位置持久化 / resize 响应
 *
 * ════════════════════════════════════════════════════════════════
 *  与旧 usePanelDrag 的区别：
 *    ✅ 折叠状态与位置状态放在一起管理，两块 localStorage 统一命名空间
 *    ✅ 面板尺寸 computed 依赖响应式的 winHeight ref
 *       → 修复"窗口 resize 后面板高度不重算"的 bug
 *    ✅ SectionKey 由调用者决定，不再写死 9 个模块
 *
 *  面板 CSS 定位：right:(20−X) / top:(20+Y)（沿用旧约定，模板不变）
 * ════════════════════════════════════════════════════════════════
 */

const STORAGE_PREFIX = 'yisiguan:control-panel'
const POSITION_KEY = `${STORAGE_PREFIX}:position`
const SECTIONS_KEY = `${STORAGE_PREFIX}:sections`
const SCHEMA_VERSION = 1
const HEADER_KEEP = 44 // 标题栏高度：拖到底部仍要能抓到

export interface UseControlPanelOptions<K extends string> {
  /** 面板内所有可折叠区块的 key */
  sectionKeys: readonly K[]
  /** 折叠区块的初始 collapsed 状态 */
  defaultCollapsed?: Partial<Record<K, boolean>>
  /** 计算展开态面板宽度，默认 260 */
  expandedWidth?: number
  /** 全部折叠时的面板宽度，默认 230 */
  collapsedWidth?: number
  /** 全部折叠时的面板高度，默认 44 */
  collapsedHeight?: number
}

export function useControlPanel<K extends string>(opts: UseControlPanelOptions<K>) {
  const {
    sectionKeys,
    defaultCollapsed = {},
    expandedWidth = 260,
    collapsedWidth = 230,
    collapsedHeight = 44
  } = opts

  // ─── 折叠状态 ─────────────────────────────────────────────
  const defaultsMap = defaultCollapsed as Record<K, boolean | undefined>
  const initialCollapsed = Object.fromEntries(
    sectionKeys.map((k) => [k, defaultsMap[k] ?? false])
  ) as Record<K, boolean>
  const collapsed: Ref<Record<K, boolean>> = ref(initialCollapsed) as Ref<Record<K, boolean>>
  loadSections()

  const allCollapsed = computed(() => sectionKeys.every((k) => collapsed.value[k]))

  const toggleSection = (key: K) => {
    collapsed.value[key] = !collapsed.value[key]
    saveSections()
  }
  const toggleAll = () => {
    const target = !allCollapsed.value
    sectionKeys.forEach((k) => {
      collapsed.value[k] = target
    })
    saveSections()
  }

  function saveSections() {
    try {
      localStorage.setItem(
        SECTIONS_KEY,
        JSON.stringify({ v: SCHEMA_VERSION, data: collapsed.value })
      )
    } catch {
      /* localStorage 不可用则默默忽略 */
    }
  }
  function loadSections() {
    try {
      const raw = localStorage.getItem(SECTIONS_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed?.v !== SCHEMA_VERSION || typeof parsed.data !== 'object') return
      sectionKeys.forEach((k) => {
        if (typeof parsed.data[k] === 'boolean') collapsed.value[k] = parsed.data[k]
      })
    } catch {
      /* 忽略损坏数据 */
    }
  }

  // ─── 拖拽状态 ─────────────────────────────────────────────
  const isDragging = ref(false)
  const panelPositionX = ref(0)
  const panelPositionY = ref(0)
  let dragStartX = 0
  let dragStartY = 0

  loadPosition()

  function loadPosition() {
    try {
      const raw = localStorage.getItem(POSITION_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed?.v !== SCHEMA_VERSION) return
      panelPositionX.value = Number(parsed.x) || 0
      panelPositionY.value = Number(parsed.y) || 0
    } catch {
      /* 忽略损坏数据 */
    }
  }
  function savePosition() {
    try {
      localStorage.setItem(
        POSITION_KEY,
        JSON.stringify({ v: SCHEMA_VERSION, x: panelPositionX.value, y: panelPositionY.value })
      )
    } catch {
      /* 忽略 */
    }
  }

  /** 夹取面板位置：保证标题栏一直可抓、面板不越视口 */
  const clampPanelPosition = () => {
    const maxLeft = winWidth.value - 100
    panelPositionX.value = Math.max(-maxLeft, Math.min(20, panelPositionX.value))
    const maxY = winHeight.value - HEADER_KEEP - 20
    panelPositionY.value = Math.max(-20, Math.min(maxY, panelPositionY.value))
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return
    panelPositionX.value += e.clientX - dragStartX
    panelPositionY.value += e.clientY - dragStartY
    clampPanelPosition()
    dragStartX = e.clientX
    dragStartY = e.clientY
  }

  const handleMouseUp = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    savePosition()
  }

  /** 挂到标题栏的 mousedown：只在点中 .control-header 时起拖 */
  const handleMouseDown = (e: MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.control-header')) return
    isDragging.value = true
    dragStartX = e.clientX
    dragStartY = e.clientY
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    e.preventDefault()
  }

  // ─── 响应式视口尺寸（修 bug #3） ──────────────────────────
  const winWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 0)
  const winHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 0)
  const handleResize = () => {
    winWidth.value = window.innerWidth
    winHeight.value = window.innerHeight
    clampPanelPosition()
  }

  // ─── 面板样式 computed ───────────────────────────────────
  const panelStyle = computed<CSSProperties>(() => {
    const base: CSSProperties = {
      right: `${20 - panelPositionX.value}px`,
      top: `${20 + panelPositionY.value}px`
    }

    if (allCollapsed.value) {
      return {
        ...base,
        width: `${collapsedWidth}px`,
        height: `${collapsedHeight}px`,
        overflow: 'hidden'
      }
    }

    const expandedCount = sectionKeys.filter((k) => !collapsed.value[k]).length
    const minHeight = 60 + expandedCount * 40
    const availableHeight = winHeight.value - (20 + panelPositionY.value)
    const height = Math.max(minHeight, availableHeight)

    return {
      ...base,
      width: `${expandedWidth}px`,
      maxHeight: `${height}px`,
      overflowY: 'auto'
    }
  })

  onMounted(() => {
    window.addEventListener('resize', handleResize)
    clampPanelPosition()
  })
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  })

  return {
    // 折叠
    collapsed,
    allCollapsed,
    toggleSection,
    toggleAll,
    // 拖拽
    isDragging,
    handleMouseDown,
    // 样式
    panelStyle
  }
}
