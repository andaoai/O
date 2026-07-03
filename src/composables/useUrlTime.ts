import { ref, watch, onMounted, onUnmounted, type Ref } from 'vue'

/**
 * 乙巳观 · URL 时间入参 composable
 *
 * ════════════════════════════════════════════════════════════════
 *  功能：把罗盘的 controlledTime 与 URL 的 ?t=... 双向绑定
 *
 *  ▶ 首次挂载：若 URL 带 t 参数则解析并作为初始时间；否则用 initialTime
 *  ▶ 用户改时间：写回 URL（防抖 500ms），使用 history.replaceState 避免历史栈污染
 *  ▶ 外部改 URL：监听 popstate + 定期比对，同步到 controlledTime
 *
 *  URL 格式约定：
 *    - 主格式：YYYY-MM-DDTHH:mm  （本地时间，精度到分钟）
 *    - 兼容格式：完整 ISO / YYYY-MM-DD / 数字时间戳
 *    - 精度设定为分钟是刻意的：让每秒推进的实时时钟不会污染 URL
 *
 *  古代日期（如 665 年）：
 *    - JS `new Date('0665-01-15')` 会严格按 ISO 解析为公元 665
 *    - 要求 URL 里的年份必须四位（前导 0）
 *
 *  🔑 VitePress 融合版：脱离 vue-router，直接用浏览器 History API
 *     这样罗盘可以作为 VitePress 页面运行，也不再依赖 SPA router
 * ════════════════════════════════════════════════════════════════
 */

export interface UseUrlTimeOptions {
  /** URL 参数名，默认 't' */
  paramName?: string
  /** 无 URL 参数时的初始时间，默认 new Date() */
  initialTime?: Date
  /** 写 URL 的防抖延迟（ms），默认 500 */
  debounceMs?: number
}

export interface UseUrlTimeReturn {
  /** 唯一时间源 —— View 层直接绑给 Control 的 v-model */
  controlledTime: Ref<Date>
  /** URL 是否携带 t 参数（用户明确指定过时间）—— 供实时时钟 View 判断 */
  hasUrlTime: Ref<boolean>
  /** 手动清除 URL 中的 t 参数（例如"回到实时"按钮） */
  clearUrlTime: () => void
}

/**
 * 把 Date 格式化为 URL 用的短 ISO 字符串（本地时间，精度到分钟）
 * 例：2026-07-03T09:30
 * 古代日期年份自动前导 0 补齐到 4 位
 */
function formatUrlTime(d: Date): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0')
  const y = d.getFullYear()
  const yStr = y < 0
    ? '-' + pad(-y, 4)
    : pad(y, 4)
  return `${yStr}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * 解析 URL 时间参数
 * 接受：ISO / YYYY-MM-DD / YYYY-MM-DDTHH:mm / 数字时间戳
 * 返回：Date 或 null（无效则退回默认）
 */
function parseUrlTime(s: string): Date | null {
  if (!s) return null

  // 数字时间戳（毫秒或秒）
  if (/^-?\d+$/.test(s)) {
    const n = Number(s)
    // 小于 1e12 认为是秒
    const ms = n < 1e12 ? n * 1000 : n
    const d = new Date(ms)
    return Number.isNaN(d.getTime()) ? null : d
  }

  // 字符串日期：new Date 能解析大部分 ISO 变体
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

/** 从当前 URL 读取指定 query 参数 */
function readQuery(paramName: string): string | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  return params.get(paramName)
}

/**
 * 用 replaceState 写回 URL 里的 query 参数
 * 直接操作 window.history，不依赖任何 router
 */
function writeQuery(paramName: string, value: string | null) {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (value === null || value === '') {
    url.searchParams.delete(paramName)
  } else {
    url.searchParams.set(paramName, value)
  }
  // 保留 pathname + hash，仅改 query
  const next = `${url.pathname}${url.search}${url.hash}`
  window.history.replaceState(window.history.state, '', next)
}

export function useUrlTime(options: UseUrlTimeOptions = {}): UseUrlTimeReturn {
  const {
    paramName = 't',
    initialTime,
    debounceMs = 500,
  } = options

  // ─── 首次读取：URL 参数优先，其次 initialTime，最后 new Date() ───
  const initialParam = readQuery(paramName)
  const parsedFromUrl = initialParam ? parseUrlTime(initialParam) : null

  const controlledTime = ref<Date>(parsedFromUrl ?? initialTime ?? new Date())
  const hasUrlTime = ref<boolean>(parsedFromUrl !== null)

  // ─── watch controlledTime → 防抖写回 URL ───
  // 用防抖是因为实时时钟 View 每秒都在改 controlledTime；
  // 但格式化后是分钟精度，实际上分钟未变时就不会写。
  let debounceTimer: number | null = null
  const stopWatchTime = watch(
    controlledTime,
    (newTime) => {
      if (debounceTimer !== null) window.clearTimeout(debounceTimer)
      debounceTimer = window.setTimeout(() => {
        const formatted = formatUrlTime(newTime)
        const current = readQuery(paramName)
        if (current === formatted) return  // URL 未变，不写
        writeQuery(paramName, formatted)
        hasUrlTime.value = true
      }, debounceMs)
    },
    { flush: 'post' }
  )

  // ─── 监听浏览器前进后退（popstate）→ 反向同步 controlledTime ───
  const onPopState = () => {
    const s = readQuery(paramName)
    if (!s) {
      hasUrlTime.value = false
      return
    }
    const parsed = parseUrlTime(s)
    if (!parsed) return
    // 若新值与当前时间相同（分钟精度），不动 —— 避免自循环
    if (formatUrlTime(controlledTime.value) === s) {
      hasUrlTime.value = true
      return
    }
    controlledTime.value = parsed
    hasUrlTime.value = true
  }

  const clearUrlTime = () => {
    writeQuery(paramName, null)
    hasUrlTime.value = false
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    window.addEventListener('popstate', onPopState)
    // 挂载后若 URL 已带 t，也 replace 一次把它标准化（如 "0665-01-15" → "0665-01-15T00:00"）
    if (hasUrlTime.value) {
      const formatted = formatUrlTime(controlledTime.value)
      if (readQuery(paramName) !== formatted) {
        writeQuery(paramName, formatted)
      }
    }
  })

  onUnmounted(() => {
    if (debounceTimer !== null) window.clearTimeout(debounceTimer)
    if (typeof window !== 'undefined') {
      window.removeEventListener('popstate', onPopState)
    }
    stopWatchTime()
  })

  return { controlledTime, hasUrlTime, clearUrlTime }
}
