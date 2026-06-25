import { ref, onUnmounted } from 'vue'

/**
 * 控制面板拖拽 + 位置持久化
 *
 * 从 Control.vue 抽出：标题栏拖拽移动、夹取在视口内、localStorage 记忆位置。
 * 面板用 right:(20−X)、top:(20+Y) 定位（见 Control.vue panelStyle），故这里维护 X/Y 偏移。
 */
const STORAGE_KEY = 'control-panel-position'
const HEADER_KEEP = 44 // 标题栏高度，保证拖到底部时仍可抓取

export function usePanelDrag() {
  const isDragging = ref(false)
  const dragStartX = ref(0)
  const dragStartY = ref(0)
  const panelPositionX = ref(0)
  const panelPositionY = ref(0)

  // 从 localStorage 恢复位置
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const pos = JSON.parse(saved)
      panelPositionX.value = pos.x || 0
      panelPositionY.value = pos.y || 0
    } catch {
      /* 忽略损坏的本地数据 */
    }
  }

  /**
   * 夹取面板位置，保证面板始终留在视口内且标题栏可抓取。
   *   - X 越大越往左；上限 20 使其不越出右边界，下限 −(视口宽−留白) 让它能拖到最左。
   *   - Y 越大越往下；上限留出一个标题栏高度，使面板可一直拖到贴近底部仍能抓住标题栏。
   */
  const clampPanelPosition = () => {
    const maxLeft = window.innerWidth - 100
    panelPositionX.value = Math.max(-maxLeft, Math.min(20, panelPositionX.value))
    const maxY = window.innerHeight - HEADER_KEEP - 20
    panelPositionY.value = Math.max(-20, Math.min(maxY, panelPositionY.value))
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return
    panelPositionX.value += e.clientX - dragStartX.value
    panelPositionY.value += e.clientY - dragStartY.value
    clampPanelPosition()
    dragStartX.value = e.clientX
    dragStartY.value = e.clientY
  }

  const handleMouseUp = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ x: panelPositionX.value, y: panelPositionY.value })
    )
  }

  /** 标题栏 mousedown 起拖（仅当点中 .control-header 区域） */
  const handleMouseDown = (e: MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.control-header')) return
    isDragging.value = true
    dragStartX.value = e.clientX
    dragStartY.value = e.clientY
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    e.preventDefault()
  }

  const handleResize = () => clampPanelPosition()

  onUnmounted(() => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  })

  return {
    isDragging,
    panelPositionX,
    panelPositionY,
    handleMouseDown,
    handleResize,
    clampPanelPosition
  }
}
