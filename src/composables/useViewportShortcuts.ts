import { onMounted, onUnmounted } from 'vue'
import { shouldIgnoreShortcut } from './useTimeShortcuts'

/**
 * 视口控制快捷键
 *   数字 0/5/6/7/8/9    缩放 100%/50%/75%/100%/125%/150%
 *   +/- / _/=          缩放增减
 *   方向键              平移
 *   Delete / Backspace 平移重置
 *   C                  旋转方向切换
 *   Q / W / E          旋转 -90°/重置/+90°
 */

export interface ViewportShortcutActions {
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

export function useViewportShortcuts(actions: ViewportShortcutActions) {
  const onKeyDown = (e: KeyboardEvent) => {
    if (shouldIgnoreShortcut(e)) return

    switch (e.key) {
      case '+':
      case '=':
        e.preventDefault()
        actions.zoomIn()
        break
      case '-':
      case '_':
        e.preventDefault()
        actions.zoomOut()
        break
      case '0':
        e.preventDefault()
        actions.resetZoom()
        break
      case '5':
        e.preventDefault()
        actions.setZoom(0.5)
        break
      case '6':
        e.preventDefault()
        actions.setZoom(0.75)
        break
      case '7':
        e.preventDefault()
        actions.setZoom(1)
        break
      case '8':
        e.preventDefault()
        actions.setZoom(1.25)
        break
      case '9':
        e.preventDefault()
        actions.setZoom(1.5)
        break
      case 'ArrowUp':
        e.preventDefault()
        actions.moveUp()
        break
      case 'ArrowDown':
        e.preventDefault()
        actions.moveDown()
        break
      case 'ArrowLeft':
        e.preventDefault()
        actions.moveLeft()
        break
      case 'ArrowRight':
        e.preventDefault()
        actions.moveRight()
        break
      case 'Delete':
      case 'Backspace':
        e.preventDefault()
        actions.resetOffset()
        break
      case 'c':
      case 'C':
        e.preventDefault()
        actions.toggleRotationDirection()
        break
      case 'q':
      case 'Q':
        e.preventDefault()
        actions.rotateLeft()
        break
      case 'w':
      case 'W':
        e.preventDefault()
        actions.resetRotationAngle()
        break
      case 'e':
      case 'E':
        e.preventDefault()
        actions.rotateRight()
        break
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeyDown))
  onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
}
