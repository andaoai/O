import { ref, onMounted, onUnmounted, type Ref } from 'vue'

/**
 * 乙巳观 · 实时时钟 composable
 *
 * ════════════════════════════════════════════════════════════════
 *  目的：把 View 里重复的 setInterval 1Hz 时钟推进逻辑收敛为单点。
 *
 *  职责：
 *    · 每秒把外部传入的 time ref 推进到当前系统时刻（liveMode = true 时）
 *    · 用户交互（Control 面板改时间/播放/拖动）后自动退出 liveMode
 *    · URL 已经带 t 参数时默认不进入 liveMode（尊重用户指定时刻）
 *
 *  使用方式：
 *    const { controlledTime, hasUrlTime } = useUrlTime()
 *    const { onUserTimeChange } = useLiveClock(controlledTime, { paused: hasUrlTime })
 *
 *  设计意图：
 *    · 让 Layer 2 (Composition Layer) 保持纯组合、无副作用
 *    · 「时钟驱动」是横切能力，理应下沉到 composable 层
 *    · LiushiJiaziView / PlanetMansionView 之前各有一份几乎相同的实现
 * ════════════════════════════════════════════════════════════════
 */

export interface UseLiveClockOptions {
  /** 若为 true，初始就不进入 live 模式（例如 URL 已指定 t） */
  paused?: Ref<boolean> | boolean
  /** tick 间隔，默认 1000ms */
  intervalMs?: number
}

export interface UseLiveClockReturn {
  /** 当前是否处于 live 模式（每秒自动推进） */
  liveMode: Ref<boolean>
  /** Control 面板 @time-change 事件回调：用户接管 → 停掉实时跟随 */
  onUserTimeChange: () => void
  /** 手动重新进入实时模式 */
  resume: () => void
  /** 手动停止实时模式 */
  pause: () => void
}

export function useLiveClock(
  time: Ref<Date>,
  options: UseLiveClockOptions = {}
): UseLiveClockReturn {
  const { paused, intervalMs = 1000 } = options

  // paused 可以是 ref 或 plain boolean，统一取当前值决定初始 liveMode
  const initialPaused =
    typeof paused === 'boolean' ? paused : paused?.value ?? false
  const liveMode = ref<boolean>(!initialPaused)

  let tickTimer: number | null = null

  function start() {
    if (tickTimer !== null) return
    tickTimer = window.setInterval(() => {
      time.value = new Date()
    }, intervalMs)
  }

  function stop() {
    if (tickTimer !== null) {
      clearInterval(tickTimer)
      tickTimer = null
    }
  }

  /** 用户接管：退出 live 模式 */
  function onUserTimeChange() {
    if (liveMode.value) {
      liveMode.value = false
      stop()
    }
  }

  function resume() {
    liveMode.value = true
    start()
  }

  function pause() {
    liveMode.value = false
    stop()
  }

  onMounted(() => {
    if (liveMode.value) start()
  })
  onUnmounted(stop)

  return { liveMode, onUserTimeChange, resume, pause }
}
