import { onMounted, onUnmounted } from 'vue'

/** 控制面板快捷键绑定的动作集合 */
export interface ShortcutActions {
  togglePlayPause: () => void
  resetToNow: () => void
  stepYear: (n: number) => void
  stepMonth: (n: number) => void
  stepTime: (seconds: number) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void
  setZoom: (z: number) => void
  moveUp: () => void
  moveDown: () => void
  moveLeft: () => void
  moveRight: () => void
  resetOffset: () => void
  toggleRotationDirection: () => void
  rotateLeft: () => void
  rotateRight: () => void
  resetRotationAngle: () => void
}

/**
 * 控制面板全局键盘快捷键
 *
 * 从 Control.vue 抽出：window keydown → 调用对应动作。输入框聚焦时忽略，避免抢键。
 * 快捷键映射与原 Control.vue 完全一致。
 */
export function useKeyboardShortcuts(actions: ShortcutActions) {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.target instanceof HTMLInputElement) return

    switch (event.key) {
      case ' ':
      case 'Space':
        event.preventDefault()
        actions.togglePlayPause()
        break
      case 'r':
      case 'R':
        event.preventDefault()
        actions.resetToNow()
        break
      case 'Y':
      case 'y':
        event.preventDefault()
        actions.stepYear(event.shiftKey ? -1 : 1)
        break
      case 'M':
      case 'm':
        event.preventDefault()
        actions.stepMonth(event.shiftKey ? -1 : 1)
        break
      case 'D':
      case 'd':
        event.preventDefault()
        actions.stepTime(event.shiftKey ? -86400 : 86400)
        break
      case 'H':
      case 'h':
        event.preventDefault()
        actions.stepTime(event.shiftKey ? -3600 : 3600)
        break
      case 'N':
      case 'n':
        event.preventDefault()
        actions.stepTime(event.shiftKey ? -60 : 60)
        break
      case 'S':
      case 's':
        event.preventDefault()
        actions.stepTime(event.shiftKey ? -1 : 1)
        break
      case '+':
      case '=':
        event.preventDefault()
        actions.zoomIn()
        break
      case '-':
      case '_':
        event.preventDefault()
        actions.zoomOut()
        break
      case '0':
        event.preventDefault()
        actions.resetZoom()
        break
      case '5':
        event.preventDefault()
        actions.setZoom(0.5)
        break
      case '6':
        event.preventDefault()
        actions.setZoom(0.75)
        break
      case '7':
        event.preventDefault()
        actions.setZoom(1)
        break
      case '8':
        event.preventDefault()
        actions.setZoom(1.25)
        break
      case '9':
        event.preventDefault()
        actions.setZoom(1.5)
        break
      case 'ArrowUp':
        event.preventDefault()
        actions.moveUp()
        break
      case 'ArrowDown':
        event.preventDefault()
        actions.moveDown()
        break
      case 'ArrowLeft':
        event.preventDefault()
        actions.moveLeft()
        break
      case 'ArrowRight':
        event.preventDefault()
        actions.moveRight()
        break
      case 'Delete':
      case 'Backspace':
        event.preventDefault()
        actions.resetOffset()
        break
      case 'c':
      case 'C':
        event.preventDefault()
        actions.toggleRotationDirection()
        break
      case 'q':
      case 'Q':
        event.preventDefault()
        actions.rotateLeft()
        break
      case 'e':
      case 'E':
        event.preventDefault()
        actions.rotateRight()
        break
      case 'w':
      case 'W':
        event.preventDefault()
        actions.resetRotationAngle()
        break
    }
  }

  onMounted(() => window.addEventListener('keydown', handleKeyDown))
  onUnmounted(() => window.removeEventListener('keydown', handleKeyDown))
}
