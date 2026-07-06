import { onMounted, onUnmounted, shallowRef, type Ref } from 'vue'
import type { UseViewportReturn } from './useViewport'

/**
 * 罗盘全局上下文（模块级共享状态）
 *
 * ════════════════════════════════════════════════════════════════
 *  为什么不用 provide/inject？
 *    VitePress 的组件树：Layout → <Content /> → View。
 *    Sidebar 挂在 Layout 里，是 <Content> 的兄弟节点，
 *    View 里的 provide() 只向下传递，Sidebar 收不到。
 *
 *  为什么是安全的？
 *    罗盘页任意时刻只有一个 View 存活；切换页面时 onUnmounted 清空。
 *    多个 View 不共存，所以模块级单例不会串。
 * ════════════════════════════════════════════════════════════════
 */

export interface CompassContext {
  time: Ref<Date>
  /** 用户主动改时间的回调（供 View 侧退出 liveMode） */
  onUserTimeChange?: (t: Date) => void
  viewport: UseViewportReturn
}

// 全局单例：当前活跃 View 注册进来，Sidebar 读它
const currentContext = shallowRef<CompassContext | null>(null)

/**
 * View 侧调用：把自己的 time / viewport 注册为当前罗盘上下文
 * onMounted 注册、onUnmounted 清空 —— 保证不同 View 之间不串。
 */
export function provideCompassContext(ctx: CompassContext) {
  onMounted(() => {
    currentContext.value = ctx
  })
  onUnmounted(() => {
    if (currentContext.value === ctx) {
      currentContext.value = null
    }
  })
}

/**
 * Sidebar 侧调用：读取当前活跃 View 的上下文。
 * 返回响应式 ref —— 未挂载时是 null，View 挂载完毕后自动生效。
 */
export function useCompassContext(): Ref<CompassContext | null> {
  return currentContext
}
