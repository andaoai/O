import { ref, onUnmounted, type Ref } from 'vue'

/**
 * 受控时间控制器 · 播放 / 步进 / 输入解析
 *
 * ════════════════════════════════════════════════════════════════
 *  与旧 useTimePlayback 的核心区别：
 *    ✅ 接收外部 time ref 作为唯一真理源，内部不再有 currentTime 副本
 *       → 修复"Control 与 useUrlTime / useLiveClock 时间源分裂"的 bug
 *    ✅ 播放采用 wall-clock 增量差分 + visibilitychange 重置
 *       → 修复"切 tab 后回来时间瞬跳几十天"的 bug
 *
 *  职责：
 *    · isPlaying / playSpeed 状态
 *    · togglePlayPause / resetToNow
 *    · stepTime / stepMonth / stepYear（暂停并推进 time.value）
 *    · onUserTimeChange 回调触发点：用户任何主动操作都会调用
 * ════════════════════════════════════════════════════════════════
 */

export interface UseTimeControllerOptions {
  /** 用户主动改时间时的回调（供 View 侧退出 liveMode） */
  onUserChange?: (t: Date) => void
}

export interface UseTimeControllerReturn {
  isPlaying: Ref<boolean>
  playSpeed: Ref<number>
  togglePlayPause: () => void
  pause: () => void
  resetToNow: () => void
  updatePlaySpeed: (speed?: number | string) => void
  stepTime: (seconds: number) => void
  stepMonth: (months: number) => void
  stepYear: (years: number) => void
  /** 步进「岁」（干支纪年周天）：每岁固定 360 天，与公历年 ≈365.25 天区分 */
  stepSui: (sui: number) => void
  /** 直接设置时间（例如输入框解析出新时间后调用） */
  applyTime: (t: Date) => void
}

const MAX_FRAME_DT_MS = 100 // 单帧增量上限：抑制 tab 冻结/长掉帧导致的瞬跳
const SUI_DAYS = 360 // 一岁 = 360 天（干支纪年周天，六十甲子 × 6 循环）
const MS_PER_DAY = 86400 * 1000

export function useTimeController(
  time: Ref<Date>,
  options: UseTimeControllerOptions = {}
): UseTimeControllerReturn {
  const isPlaying = ref(false)
  const playSpeed = ref(1)
  let rafId: number | null = null
  let lastFrameAt = 0

  const notify = () => options.onUserChange?.(time.value)

  const applyTime = (t: Date) => {
    time.value = t
    notify()
  }

  const pause = () => {
    if (!isPlaying.value && rafId === null) return
    isPlaying.value = false
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  const play = () => {
    if (rafId !== null) return
    isPlaying.value = true
    lastFrameAt = performance.now()

    const tick = (now: number) => {
      // 增量截断：tab 冻结/长掉帧时不会一次性推进几百帧
      const dt = Math.min(now - lastFrameAt, MAX_FRAME_DT_MS)
      lastFrameAt = now
      time.value = new Date(time.value.getTime() + dt * playSpeed.value)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
  }

  const togglePlayPause = () => {
    if (isPlaying.value) pause()
    else play()
  }

  const resetToNow = () => {
    pause()
    applyTime(new Date())
  }

  const updatePlaySpeed = (speed?: number | string) => {
    if (speed !== undefined) {
      playSpeed.value = typeof speed === 'string' ? Number(speed) : speed
    } else if (typeof playSpeed.value === 'string') {
      // <select> v-model 可能给出字符串
      playSpeed.value = Number(playSpeed.value)
    }
    // 播放中变速不需重启动画：tick 每帧读 playSpeed.value 即时生效
  }

  const stepTime = (seconds: number) => {
    pause()
    applyTime(new Date(time.value.getTime() + seconds * 1000))
  }

  /** 步进月份（防日期溢出：1月31日 → +1月 → 2月28/29日） */
  const stepMonth = (months: number) => {
    pause()
    const newTime = new Date(time.value)
    const currentMonth = newTime.getMonth()
    const currentYear = newTime.getFullYear()
    let newMonth = currentMonth + months
    let newYear = currentYear
    if (newMonth > 11) {
      newYear += Math.floor(newMonth / 12)
      newMonth = newMonth % 12
    } else if (newMonth < 0) {
      newYear += Math.floor(newMonth / 12)
      newMonth = ((newMonth % 12) + 12) % 12
    }
    const originalDate = newTime.getDate()
    const lastDayOfNewMonth = new Date(newYear, newMonth + 1, 0).getDate()
    newTime.setFullYear(newYear, newMonth, Math.min(originalDate, lastDayOfNewMonth))
    applyTime(newTime)
  }

  /** 步进年份（2月29日跨非闰年时取该月最后一天） */
  const stepYear = (years: number) => {
    pause()
    const newTime = new Date(time.value)
    const originalMonth = newTime.getMonth()
    newTime.setFullYear(newTime.getFullYear() + years)
    if (newTime.getMonth() !== originalMonth) {
      // setMonth(month+1, 0) = 下个月第 0 天 = 原月份最后一天
      newTime.setMonth(originalMonth + 1, 0)
    }
    applyTime(newTime)
  }

  /**
   * 步进「岁」：每岁 360 天，直接在毫秒级增量。
   * 与 stepYear（公历年 ≈365.25 天）区分——本项目里干支纪年周天为 360 天，
   * 六十甲子 × 6 = 360 日 / 岁，恰对应「一岁一周天」的古法。
   */
  const stepSui = (sui: number) => {
    pause()
    applyTime(new Date(time.value.getTime() + sui * SUI_DAYS * MS_PER_DAY))
  }

  // ─── tab 隐藏/显示：重置 lastFrameAt 避免瞬跳 ──────────
  const onVisibilityChange = () => {
    if (document.hidden) return
    if (isPlaying.value) lastFrameAt = performance.now()
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange)
  }

  onUnmounted(() => {
    pause()
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  })

  return {
    isPlaying,
    playSpeed,
    togglePlayPause,
    pause,
    resetToNow,
    updatePlaySpeed,
    stepTime,
    stepMonth,
    stepYear,
    stepSui,
    applyTime
  }
}
