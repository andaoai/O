import { ref, onUnmounted } from 'vue'

/**
 * 控制面板时间播放 / 步进
 *
 * 从 Control.vue 抽出：当前时间、播放/暂停（按 playSpeed 倍速推进）、按秒/月/年步进、
 * 重置到此刻。时间变化通过 onTimeChange 回调上抛给宿主组件（再 emit 给父级）。
 */
export function useTimePlayback(onTimeChange: (t: Date) => void) {
  const currentTime = ref(new Date())
  const isPlaying = ref(false)
  const playSpeed = ref(1)
  let animationId: number | null = null

  const updateTime = (newTime: Date) => {
    currentTime.value = newTime
    onTimeChange(newTime)
  }

  const pause = () => {
    isPlaying.value = false
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  }

  const play = () => {
    if (animationId) return
    isPlaying.value = true
    const startTime = Date.now()
    const startModelTime = currentTime.value.getTime()

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000
      const timeDelta = elapsed * playSpeed.value * 1000
      updateTime(new Date(startModelTime + timeDelta))
      animationId = requestAnimationFrame(animate)
    }
    animate()
  }

  const togglePlayPause = () => {
    if (isPlaying.value) pause()
    else play()
  }

  const resetToNow = () => {
    pause()
    updateTime(new Date())
  }

  /** 切速时若在播放，重启动画以应用新速度 */
  const updatePlaySpeed = () => {
    // select option value 为字符串，确保转为数字
    if (typeof playSpeed.value === 'string') {
      playSpeed.value = Number(playSpeed.value)
    }
    if (isPlaying.value) {
      pause()
      play()
    }
  }

  /** 步进秒数（负为后退） */
  const stepTime = (seconds: number) => {
    pause()
    updateTime(new Date(currentTime.value.getTime() + seconds * 1000))
  }

  /** 步进月份（处理跨年，日期溢出时取新月份最后一天） */
  const stepMonth = (months: number) => {
    pause()
    const newTime = new Date(currentTime.value)
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
    // 防止日期溢出：1月31日 → +1月 → 2月28/29日（而非3月2日）
    const originalDate = newTime.getDate()
    const lastDayOfNewMonth = new Date(newYear, newMonth + 1, 0).getDate()
    newTime.setFullYear(newYear, newMonth, Math.min(originalDate, lastDayOfNewMonth))
    updateTime(newTime)
  }

  /** 步进年份（2月29日跨非闰年时取该月最后一天） */
  const stepYear = (years: number) => {
    pause()
    const newTime = new Date(currentTime.value)
    const originalMonth = newTime.getMonth()
    const originalDate = newTime.getDate()
    newTime.setFullYear(newTime.getFullYear() + years)
    // 如果月份变了（2月29日 → 3月1日），回退到原月份的最后一天
    if (newTime.getMonth() !== originalMonth) {
      // setMonth(month+1, 0) = 下个月第0天 = 原月份最后一天
      newTime.setMonth(originalMonth + 1, 0)
    }
    updateTime(newTime)
  }

  onUnmounted(pause)

  return {
    currentTime,
    isPlaying,
    playSpeed,
    updateTime,
    play,
    pause,
    togglePlayPause,
    resetToNow,
    updatePlaySpeed,
    stepTime,
    stepMonth,
    stepYear
  }
}
