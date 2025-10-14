import { ref, computed, onUnmounted } from 'vue'

/**
 * 动画类型枚举
 */
export enum AnimationType {
  ROTATION = 'rotation',      // 旋转动画
  ORBITAL = 'orbital',        // 轨道动画
  TWINKLE = 'twinkle',        // 闪烁动画
  PULSE = 'pulse'            // 脉冲动画
}

/**
 * 动画状态接口
 */
export interface AnimationState {
  id: string
  type: AnimationType
  enabled: boolean
  speed: number
  value: number
  startTime: number
  lastUpdate: number
  onUpdate?: (value: number, deltaTime: number) => void
}

/**
 * 全局动画管理器
 * 统一管理所有组件的动画，避免多个requestAnimationFrame冲突
 */
class AnimationManager {
  private animations = new Map<string, AnimationState>()
  private animationId: number | null = null
  private isRunning = false
  private lastTime = 0
  private globalTime = ref(0)

  /**
   * 注册动画
   */
  register(config: {
    id: string
    type: AnimationType
    enabled?: boolean
    speed?: number
    onUpdate?: (value: number, deltaTime: number) => void
  }): void {
    const animation: AnimationState = {
      id: config.id,
      type: config.type,
      enabled: config.enabled ?? false,
      speed: config.speed ?? 1,
      value: 0,
      startTime: 0,
      lastUpdate: 0,
      onUpdate: config.onUpdate
    }

    this.animations.set(config.id, animation)
  }

  /**
   * 启动动画
   */
  start(id: string): void {
    const animation = this.animations.get(id)
    if (animation) {
      animation.enabled = true
      animation.startTime = performance.now()
      animation.lastUpdate = animation.startTime

      if (!this.isRunning) {
        this.startGlobalAnimation()
      }
    }
  }

  /**
   * 停止动画
   */
  stop(id: string): void {
    const animation = this.animations.get(id)
    if (animation) {
      animation.enabled = false
    }
  }

  /**
   * 设置动画速度
   */
  setSpeed(id: string, speed: number): void {
    const animation = this.animations.get(id)
    if (animation) {
      animation.speed = speed
    }
  }

  /**
   * 获取动画值
   */
  getValue(id: string): number {
    const animation = this.animations.get(id)
    return animation?.value ?? 0
  }

  /**
   * 设置动画值
   */
  setValue(id: string, value: number): void {
    const animation = this.animations.get(id)
    if (animation) {
      animation.value = value
    }
  }

  /**
   * 重置动画
   */
  reset(id: string): void {
    const animation = this.animations.get(id)
    if (animation) {
      animation.value = 0
      animation.startTime = performance.now()
      animation.lastUpdate = animation.startTime
    }
  }

  /**
   * 获取全局动画时间（响应式）
   */
  getGlobalTime() {
    return computed(() => this.globalTime.value)
  }

  /**
   * 启动全局动画循环
   */
  private startGlobalAnimation(): void {
    if (this.isRunning) return

    this.isRunning = true
    this.lastTime = performance.now()

    const animate = (currentTime: number) => {
      if (!this.isRunning) return

      const deltaTime = (currentTime - this.lastTime) / 1000 // 转换为秒
      this.lastTime = currentTime

      // 更新全局时间
      this.globalTime.value = currentTime

      // 更新所有启用的动画
      this.animations.forEach((animation) => {
        if (animation.enabled) {
          this.updateAnimation(animation, deltaTime)
        }
      })

      this.animationId = requestAnimationFrame(animate)
    }

    this.animationId = requestAnimationFrame(animate)
  }

  /**
   * 停止全局动画循环
   */
  private stopGlobalAnimation(): void {
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  /**
   * 更新单个动画
   */
  private updateAnimation(animation: AnimationState, deltaTime: number): void {
    switch (animation.type) {
      case AnimationType.ROTATION:
        // 旋转动画：角度累加
        animation.value = (animation.value + animation.speed * deltaTime * 60) % 360
        break

      case AnimationType.ORBITAL:
        // 轨道动画：时间累加
        animation.value += animation.speed * deltaTime
        break

      case AnimationType.TWINKLE:
        // 闪烁动画：正弦波
        animation.value = (Math.sin(animation.value * animation.speed) + 1) / 2
        break

      case AnimationType.PULSE:
        // 脉冲动画：余弦波
        animation.value = (Math.cos(animation.value * animation.speed) + 1) / 2
        break
    }

    // 调用更新回调
    if (animation.onUpdate) {
      animation.onUpdate(animation.value, deltaTime)
    }
  }

  /**
   * 清理动画
   */
  dispose(): void {
    this.stopGlobalAnimation()
    this.animations.clear()
  }

  /**
   * 获取所有动画状态
   */
  getAnimations(): Map<string, AnimationState> {
    return new Map(this.animations)
  }

  /**
   * 检查是否有动画在运行
   */
  hasActiveAnimations(): boolean {
    for (const animation of this.animations.values()) {
      if (animation.enabled) return true
    }
    return false
  }
}

// 全局单例实例
export const globalAnimationManager = new AnimationManager()

/**
 * Vue composable for animation management
 */
export function useAnimation(id: string, type: AnimationType, options: {
  enabled?: boolean
  speed?: number
  onUpdate?: (value: number, deltaTime: number) => void
} = {}) {
  // 注册动画
  globalAnimationManager.register({
    id,
    type,
    enabled: options.enabled,
    speed: options.speed,
    onUpdate: options.onUpdate
  })

  // 启动动画
  const start = () => globalAnimationManager.start(id)

  // 停止动画
  const stop = () => globalAnimationManager.stop(id)

  // 设置速度
  const setSpeed = (speed: number) => globalAnimationManager.setSpeed(id, speed)

  // 获取值
  const getValue = () => globalAnimationManager.getValue(id)

  // 设置值
  const setValue = (value: number) => globalAnimationManager.setValue(id, value)

  // 重置
  const reset = () => globalAnimationManager.reset(id)

  // 组件卸载时清理
  onUnmounted(() => {
    // 注意：不要在这里直接dispose，因为可能有其他组件在使用
    // 只停止当前动画
    stop()
  })

  return {
    start,
    stop,
    setSpeed,
    getValue,
    setValue,
    reset,
    globalTime: globalAnimationManager.getGlobalTime()
  }
}