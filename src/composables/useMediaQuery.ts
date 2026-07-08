import { onMounted, onUnmounted, ref, type Ref } from 'vue'

/**
 * 响应式媒体查询 composable
 *
 * ════════════════════════════════════════════════════════════════
 *  SSR 安全：window.matchMedia 在 onMounted 里初始化，SSR 首帧一律返回 false，
 *  hydration 后再根据实际视口更新。视图切换 / resize 都会通过 change 事件推动 ref。
 * ════════════════════════════════════════════════════════════════
 */
export function useMediaQuery(query: string): Ref<boolean> {
  const matches = ref(false)
  let mql: MediaQueryList | null = null
  const update = (e: MediaQueryListEvent | MediaQueryList) => {
    matches.value = e.matches
  }

  onMounted(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    mql = window.matchMedia(query)
    matches.value = mql.matches
    mql.addEventListener('change', update)
  })
  onUnmounted(() => {
    if (mql) mql.removeEventListener('change', update)
  })

  return matches
}

/**
 * 手机 / 窄屏断点：宽度 ≤ 768px 视为移动端。
 * 与 CompassSidebar / SidebarToggleHandle 的 @media (max-width: 768px) 保持一致 —— 修改需三处同步。
 */
export const MOBILE_MEDIA = '(max-width: 768px)'

/** 便捷封装：当前视口是否是手机 / 窄屏（≤ 768px） */
export function useIsMobile(): Ref<boolean> {
  return useMediaQuery(MOBILE_MEDIA)
}
