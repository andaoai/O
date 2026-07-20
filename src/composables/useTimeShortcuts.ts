import { onMounted, onUnmounted } from 'vue'

/**
 * 判断当前事件是否发生在需要屏蔽快捷键的目标上：
 *   · 表单输入（input / textarea / select）
 *   · contenteditable 元素
 *   · IME 组合输入中（如中文输入法在打字）
 *   · 携带 Ctrl / Meta 修饰键（让浏览器/系统快捷键透传）
 *
 * 抽到公共文件，让 useTimeShortcuts / useViewportShortcuts 共用。
 */
export function shouldIgnoreShortcut(event: KeyboardEvent): boolean {
  if (event.isComposing) return true
  if (event.ctrlKey || event.metaKey) return true

  const target = event.target as HTMLElement | null
  if (!target) return false
  if (target instanceof HTMLInputElement) return true
  if (target instanceof HTMLTextAreaElement) return true
  if (target instanceof HTMLSelectElement) return true
  if (target.isContentEditable) return true
  return false
}

export interface TimeShortcutActions {
  togglePlayPause: () => void
  resetToNow: () => void
  stepYear: (n: number) => void
  stepMonth: (n: number) => void
  stepTime: (seconds: number) => void
  stepSui: (n: number) => void
}

/**
 * 时间控制快捷键
 *   Space / R          播放暂停 / 回到当下
 *   Y / M / D / H / N / S   前进；+Shift 后退
 *   G                  前进 1 岁（360 天）；+Shift 后退
 */
export function useTimeShortcuts(actions: TimeShortcutActions) {
  const onKeyDown = (e: KeyboardEvent) => {
    if (shouldIgnoreShortcut(e)) return

    switch (e.key) {
      case ' ':
      case 'Spacebar':
      case 'Space':
        e.preventDefault()
        actions.togglePlayPause()
        break
      case 'r':
      case 'R':
        e.preventDefault()
        actions.resetToNow()
        break
      case 'y':
      case 'Y':
        e.preventDefault()
        actions.stepYear(e.shiftKey ? -1 : 1)
        break
      case 'm':
      case 'M':
        e.preventDefault()
        actions.stepMonth(e.shiftKey ? -1 : 1)
        break
      case 'd':
      case 'D':
        e.preventDefault()
        actions.stepTime(e.shiftKey ? -86400 : 86400)
        break
      case 'h':
      case 'H':
        e.preventDefault()
        actions.stepTime(e.shiftKey ? -3600 : 3600)
        break
      case 'n':
      case 'N':
        e.preventDefault()
        actions.stepTime(e.shiftKey ? -60 : 60)
        break
      case 's':
      case 'S':
        e.preventDefault()
        actions.stepTime(e.shiftKey ? -1 : 1)
        break
      case 'g':
      case 'G':
        e.preventDefault()
        actions.stepSui(e.shiftKey ? -1 : 1)
        break
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeyDown))
  onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
}
