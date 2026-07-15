import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import type { UseViewportReturn } from './useViewport'

/**
 * Alt + 鼠标拖拽平移
 *
 * 按住 Alt 键 + 鼠标左键在 SVG 上拖拽 → 平移画布（更新 offsetX / offsetY）
 * 屏幕像素通过 SVG 的显示比例换算为 viewBox 单位，与当前 zoomLevel 独立
 * （因为在 View 模板中，translate 位于 scale 之外，offset 使用 viewBox 单位）
 *
 * 用法（新，推荐）：
 * ```ts
 * const viewport = useViewport()
 * const { isDragging, isAltPressed } = useAltDragPan({ svgRef, viewport })
 * ```
 *
 * 兼容旧签名（散 ref）：
 * ```ts
 * useAltDragPan({ svgRef, offsetX, offsetY, zoomLevel })
 * ```
 */
export interface AltDragPanOptions {
  /** SVG 元素 ref */
  svgRef: Ref<SVGSVGElement | null>
  /** 首选：整套视口状态（useViewport 返回值） */
  viewport?: UseViewportReturn
  /** 兼容：单独的平移 X 状态（viewBox 单位） */
  offsetX?: Ref<number>
  /** 兼容：单独的平移 Y 状态（viewBox 单位） */
  offsetY?: Ref<number>
  /** 兼容：缩放级别（可选：传入后即启用 Alt + 滚轮缩放） */
  zoomLevel?: Ref<number>
  /** SVG viewBox 正方形边长（默认 1200，与所有罗盘 View 一致） */
  viewBoxSize?: number
  /** 缩放最小值，默认 0.1 */
  zoomMin?: number
  /** 缩放最大值，默认 3 */
  zoomMax?: number
  /** 滚轮单次步进（滚一格增减的 zoom 量），默认 0.1 */
  zoomStep?: number
}

export function useAltDragPan(opts: AltDragPanOptions) {
  const {
    svgRef,
    viewport,
    viewBoxSize = 1200,
    zoomMin = 0.1,
    zoomMax = 3,
    zoomStep = 0.1
  } = opts

  // 兼容层：viewport 优先，回退到旧散 ref 参数
  const offsetX = viewport?.offsetX ?? opts.offsetX
  const offsetY = viewport?.offsetY ?? opts.offsetY
  const zoomLevel = viewport?.zoom ?? opts.zoomLevel
  if (!offsetX || !offsetY) {
    throw new Error('useAltDragPan: must supply either viewport or {offsetX, offsetY}')
  }

  const isDragging = ref(false)
  const isAltPressed = ref(false)

  let startClientX = 0
  let startClientY = 0
  let startOffsetX = 0
  let startOffsetY = 0
  let activePointerId: number | null = null

  /** 屏幕像素 → viewBox 单位换算系数 */
  const clientToViewBoxScale = (): number => {
    const svg = svgRef.value
    if (!svg) return 1
    const rect = svg.getBoundingClientRect()
    const shortSide = Math.min(rect.width, rect.height)
    if (shortSide === 0) return 1
    // 优先从 SVG viewBox 属性动态读取（支持 viewBox 变化，如全星官模式 3600×3600）
    const vb = svg.getAttribute('viewBox')
    if (vb) {
      const parts = vb.split(/[\s,]+/).map(Number)
      if (parts.length >= 3 && parts[2] !== undefined && parts[2] > 0) return parts[2] / shortSide
    }
    // preserveAspectRatio="xMidYMid meet"：短边等于 viewBox 边长的映射
    return viewBoxSize / shortSide
  }

  const onPointerDown = (e: PointerEvent) => {
    // 只在按住 Alt + 左键（button 0）时触发
    if (!e.altKey || e.button !== 0) return
    const svg = svgRef.value
    if (!svg) return

    e.preventDefault()
    isDragging.value = true
    startClientX = e.clientX
    startClientY = e.clientY
    startOffsetX = offsetX.value
    startOffsetY = offsetY.value
    activePointerId = e.pointerId

    // 用 SVG 元素作为 pointer capture 目标，保证 move / up 都能收到
    try {
      svg.setPointerCapture(e.pointerId)
    } catch {
      // 某些环境不支持 pointer capture，忽略即可（fallback 到 window 监听）
    }
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!isDragging.value) return
    if (activePointerId !== null && e.pointerId !== activePointerId) return

    const scale = clientToViewBoxScale()
    const dx = (e.clientX - startClientX) * scale
    const dy = (e.clientY - startClientY) * scale
    offsetX.value = startOffsetX + dx
    offsetY.value = startOffsetY + dy
  }

  const endDrag = (e?: PointerEvent) => {
    if (!isDragging.value) return
    isDragging.value = false
    const svg = svgRef.value
    if (svg && activePointerId !== null) {
      try {
        svg.releasePointerCapture(activePointerId)
      } catch {
        // ignore
      }
    }
    activePointerId = null
    void e
  }

  /** Alt + 滚轮 → 缩放（滚上放大，滚下缩小） */
  const onWheel = (e: WheelEvent) => {
    if (!zoomLevel || !e.altKey) return
    // 阻止 Alt+滚轮触发浏览器 / VitePress 页面滚动，让缩放独享
    e.preventDefault()
    const dir = Math.sign(e.deltaY)
    if (dir === 0) return
    const next = zoomLevel.value + (dir < 0 ? zoomStep : -zoomStep)
    zoomLevel.value = Math.max(zoomMin, Math.min(zoomMax, Number(next.toFixed(4))))
  }

  // Alt 键按下 / 松开 → 控制 cursor 视觉反馈
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Alt' || e.altKey) isAltPressed.value = true
  }
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Alt' || !e.altKey) isAltPressed.value = false
  }
  // 窗口失焦 → 清除 Alt 状态，避免 cursor 卡在 grab
  const onBlur = () => {
    isAltPressed.value = false
    endDrag()
  }

  const attach = (svg: SVGSVGElement) => {
    svg.addEventListener('pointerdown', onPointerDown)
    svg.addEventListener('pointermove', onPointerMove)
    svg.addEventListener('pointerup', endDrag)
    svg.addEventListener('pointercancel', endDrag)
    // wheel 必须 passive:false 才能 preventDefault 拦截页面滚动
    svg.addEventListener('wheel', onWheel, { passive: false })
  }

  const detach = (svg: SVGSVGElement) => {
    svg.removeEventListener('pointerdown', onPointerDown)
    svg.removeEventListener('pointermove', onPointerMove)
    svg.removeEventListener('pointerup', endDrag)
    svg.removeEventListener('pointercancel', endDrag)
    svg.removeEventListener('wheel', onWheel)
  }

  onMounted(() => {
    if (svgRef.value) attach(svgRef.value)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
  })

  // svgRef 后挂载（ClientOnly / 异步渲染）也能生效
  watch(svgRef, (svg, prev) => {
    if (prev) detach(prev)
    if (svg) attach(svg)
  })

  onBeforeUnmount(() => {
    if (svgRef.value) detach(svgRef.value)
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    window.removeEventListener('blur', onBlur)
  })

  return { isDragging, isAltPressed }
}
