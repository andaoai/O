import { ref, type Ref } from 'vue'

/**
 * 罗盘视口状态 composable
 *
 * ════════════════════════════════════════════════════════════════
 *  把 zoom / offset / rotation 三块 SVG 视口状态从 5 个 ref 折叠成一个对象，
 *  同时导出所有变换动作（缩放、平移、旋转），供 Control 面板和键盘快捷键调用。
 *
 *  View 侧用法：
 *    const viewport = useViewport()
 *    // 模板里直接：viewport.zoom / viewport.offsetX / viewport.rotationAngle
 *
 *  设计要点：
 *    · 状态用 ref 暴露，模板自动解包
 *    · 所有 action 就地修改 ref，不 emit —— Control 接到 viewport 后可以直接用
 *    · zoom clamp 在 [0.1, 3]，rotationAngle 归一到 [0, 360)
 * ════════════════════════════════════════════════════════════════
 */

export type RotationDirection = 'clockwise' | 'counterclockwise'

export interface ViewportInitial {
  zoom?: number
  offsetX?: number
  offsetY?: number
  rotationDirection?: RotationDirection
  rotationAngle?: number
}

export interface UseViewportReturn {
  // ─── 状态 ───
  zoom: Ref<number>
  offsetX: Ref<number>
  offsetY: Ref<number>
  rotationDirection: Ref<RotationDirection>
  rotationAngle: Ref<number>

  // ─── 缩放 ───
  updateZoom: (z: number) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  setZoom: (z: number) => void

  // ─── 平移 ───
  updateOffset: (x: number, y: number) => void
  moveLeft: () => void
  moveRight: () => void
  moveUp: () => void
  moveDown: () => void
  resetOffset: () => void

  // ─── 旋转方向 ───
  setRotationDirection: (d: RotationDirection) => void
  toggleRotationDirection: () => void

  // ─── 旋转角度 ───
  updateRotationAngle: (angle: number) => void
  rotateLeft: () => void
  rotateRight: () => void
  resetRotationAngle: () => void
}

const ZOOM_MIN = 0.1
const ZOOM_MAX = 3
const ZOOM_STEP = 0.1
const OFFSET_STEP = 50
const ROTATE_STEP = 90

const clampZoom = (z: number) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z))
const normalizeAngle = (a: number) => ((a % 360) + 360) % 360

export function useViewport(initial: ViewportInitial = {}): UseViewportReturn {
  const zoom = ref<number>(initial.zoom ?? 1)
  const offsetX = ref<number>(initial.offsetX ?? 0)
  const offsetY = ref<number>(initial.offsetY ?? 0)
  const rotationDirection = ref<RotationDirection>(initial.rotationDirection ?? 'clockwise')
  const rotationAngle = ref<number>(normalizeAngle(initial.rotationAngle ?? 0))

  // ─── 缩放 ──────────────────────────────────────────────
  const updateZoom = (z: number) => {
    zoom.value = clampZoom(z)
  }
  const zoomIn = () => updateZoom(zoom.value + ZOOM_STEP)
  const zoomOut = () => updateZoom(zoom.value - ZOOM_STEP)
  const resetZoom = () => updateZoom(1)
  const setZoom = (z: number) => updateZoom(z)

  // ─── 平移 ──────────────────────────────────────────────
  const updateOffset = (x: number, y: number) => {
    offsetX.value = x
    offsetY.value = y
  }
  const moveLeft = () => updateOffset(offsetX.value - OFFSET_STEP, offsetY.value)
  const moveRight = () => updateOffset(offsetX.value + OFFSET_STEP, offsetY.value)
  const moveUp = () => updateOffset(offsetX.value, offsetY.value - OFFSET_STEP)
  const moveDown = () => updateOffset(offsetX.value, offsetY.value + OFFSET_STEP)
  const resetOffset = () => updateOffset(0, 0)

  // ─── 旋转方向 ──────────────────────────────────────────
  const setRotationDirection = (d: RotationDirection) => {
    rotationDirection.value = d
  }
  const toggleRotationDirection = () => {
    rotationDirection.value =
      rotationDirection.value === 'clockwise' ? 'counterclockwise' : 'clockwise'
  }

  // ─── 旋转角度 ──────────────────────────────────────────
  const updateRotationAngle = (angle: number) => {
    rotationAngle.value = normalizeAngle(angle)
  }
  const rotateLeft = () => updateRotationAngle(rotationAngle.value - ROTATE_STEP)
  const rotateRight = () => updateRotationAngle(rotationAngle.value + ROTATE_STEP)
  const resetRotationAngle = () => updateRotationAngle(0)

  return {
    zoom,
    offsetX,
    offsetY,
    rotationDirection,
    rotationAngle,
    updateZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,
    updateOffset,
    moveLeft,
    moveRight,
    moveUp,
    moveDown,
    resetOffset,
    setRotationDirection,
    toggleRotationDirection,
    updateRotationAngle,
    rotateLeft,
    rotateRight,
    resetRotationAngle
  }
}
