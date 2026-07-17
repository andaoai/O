import { computed, ref, onMounted, onUnmounted } from 'vue'
import { compasses, type CompassMeta } from '@/compasses'

/**
 * 从当前 URL 匹配罗盘元数据
 *
 * 站点 base 是 /O/，罗盘路径形如 /O/compass/liushi-jiazi/。
 * 提取 id 段并查 compasses[] 得到 CompassMeta。
 *
 * SSR 阶段返回 null，客户端 onMounted 后立即读一次并同步。
 */
export function useCompassMeta() {
  const currentId = ref<string | null>(null)

  function readIdFromLocation(): string | null {
    if (typeof window === 'undefined') return null
    const path = window.location.pathname
    // 匹配 .../compass/<id>/ 或 .../compass/<id>
    const m = path.match(/\/compass\/([^/]+)\/?$/)
    if (!m) return null
    const id = m[1]!
    return compasses.some((c) => c.id === id) ? id : null
  }

  const meta = computed<CompassMeta | null>(() => {
    if (!currentId.value) return null
    return compasses.find((c) => c.id === currentId.value) ?? null
  })

  const onPopState = () => {
    currentId.value = readIdFromLocation()
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    currentId.value = readIdFromLocation()
    window.addEventListener('popstate', onPopState)
  })
  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('popstate', onPopState)
    }
  })

  return { meta, currentId }
}
