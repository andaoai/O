<template>
  <div class="time-control">
    <h3 class="title">时间控制</h3>

    <!-- 时间显示 -->
    <div class="time-display">
      <div class="current-time">
        {{ formatTime(currentTime) }}
      </div>
      <div class="date-display">
        {{ formatDate(currentTime) }}
      </div>
    </div>

    <!-- 控制按钮 -->
    <div class="control-buttons">
      <button
        class="control-btn"
        @click="togglePlayPause"
        :class="{ active: isPlaying }"
      >
        {{ isPlaying ? '⏸ 暂停' : '▶ 播放' }}
      </button>

      <button
        class="control-btn"
        @click="resetToNow"
      >
        ⟲ 现在
      </button>
    </div>

    <!-- 时间调节 -->
    <div class="time-adjustment">
      <div class="speed-control">
        <label>播放速度:</label>
        <select v-model="playSpeed" @change="updatePlaySpeed">
          <option value="1">1x</option>
          <option value="60">1分钟/秒</option>
          <option value="3600">1小时/秒</option>
          <option value="86400">1天/秒</option>
        </select>
      </div>

      <div class="manual-controls">
        <button
          class="step-btn"
          @click="stepTime(-3600)"
        >
          -1小时
        </button>
        <button
          class="step-btn"
          @click="stepTime(-60)"
        >
          -1分钟
        </button>
        <button
          class="step-btn"
          @click="stepTime(60)"
        >
          +1分钟
        </button>
        <button
          class="step-btn"
          @click="stepTime(3600)"
        >
          +1小时
        </button>
      </div>
    </div>

    <!-- 快速跳转 -->
    <div class="quick-jump">
      <label>快速跳转:</label>
      <div class="jump-buttons">
        <button
          class="jump-btn"
          @click="setTimeOfDay(0, 0)"
        >
          00:00
        </button>
        <button
          class="jump-btn"
          @click="setTimeOfDay(6, 0)"
        >
          06:00
        </button>
        <button
          class="jump-btn"
          @click="setTimeOfDay(12, 0)"
        >
          12:00
        </button>
        <button
          class="jump-btn"
          @click="setTimeOfDay(18, 0)"
        >
          18:00
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  modelValue?: Date
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: Date]
  'timeChange': [value: Date]
}>()

// 响应式数据
const currentTime = ref(new Date())
const isPlaying = ref(false)
const playSpeed = ref(60) // 默认1分钟/秒
let animationId: number | null = null

// 计算属性
const formattedTime = computed(() => formatTime(currentTime.value))

// 格式化时间
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 格式化日期
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 更新时间
const updateTime = (newTime: Date) => {
  currentTime.value = newTime
  emit('update:modelValue', newTime)
  emit('timeChange', newTime)
}

// 播放/暂停
const togglePlayPause = () => {
  if (isPlaying.value) {
    pause()
  } else {
    play()
  }
}

// 开始播放
const play = () => {
  if (animationId) return

  isPlaying.value = true
  const startTime = Date.now()
  const startModelTime = currentTime.value.getTime()

  const animate = () => {
    const elapsed = (Date.now() - startTime) / 1000 // 秒
    const timeDelta = elapsed * playSpeed.value * 1000 // 毫秒

    const newTime = new Date(startModelTime + timeDelta)
    updateTime(newTime)

    animationId = requestAnimationFrame(animate)
  }

  animate()
}

// 暂停播放
const pause = () => {
  isPlaying.value = false
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

// 重置到当前时间
const resetToNow = () => {
  pause()
  updateTime(new Date())
}

// 步进时间
const stepTime = (seconds: number) => {
  pause()
  const newTime = new Date(currentTime.value.getTime() + seconds * 1000)
  updateTime(newTime)
}

// 设置一天中的特定时间
const setTimeOfDay = (hours: number, minutes: number) => {
  pause()
  const newTime = new Date(currentTime.value)
  newTime.setHours(hours, minutes, 0, 0)
  updateTime(newTime)
}

// 更新播放速度
const updatePlaySpeed = () => {
  if (isPlaying.value) {
    pause()
    play()
  }
}

// 清理
onUnmounted(() => {
  pause()
})
</script>

<style scoped>
.time-control {
  position: fixed;
  right: 20px;
  top: 20px;
  width: 280px;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid #444;
  border-radius: 8px;
  padding: 16px;
  color: #fff;
  font-family: 'Arial', sans-serif;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  color: #ffcc00;
  border-bottom: 1px solid #444;
  padding-bottom: 8px;
}

.time-display {
  text-align: center;
  margin-bottom: 16px;
}

.current-time {
  font-size: 20px;
  font-weight: bold;
  color: #00ff00;
  margin-bottom: 4px;
  font-family: 'Courier New', monospace;
}

.date-display {
  font-size: 12px;
  color: #888;
}

.control-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  justify-content: center;
}

.control-btn {
  padding: 8px 12px;
  background: #333;
  border: 1px solid #555;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.control-btn:hover {
  background: #444;
  border-color: #666;
}

.control-btn.active {
  background: #ffcc00;
  color: #000;
  border-color: #ffcc00;
}

.time-adjustment {
  margin-bottom: 16px;
}

.speed-control {
  margin-bottom: 12px;
  text-align: center;
}

.speed-control label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: #ccc;
}

.speed-control select {
  width: 100%;
  padding: 4px;
  background: #333;
  border: 1px solid #555;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
}

.manual-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.step-btn {
  padding: 6px 8px;
  background: #333;
  border: 1px solid #555;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s;
}

.step-btn:hover {
  background: #444;
  border-color: #666;
}

.step-btn:active {
  background: #555;
}

.quick-jump {
  text-align: center;
}

.quick-jump label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  color: #ccc;
}

.jump-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 4px;
}

.jump-btn {
  padding: 6px 4px;
  background: #222;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  font-size: 10px;
  transition: all 0.2s;
}

.jump-btn:hover {
  background: #333;
  border-color: #555;
}

.jump-btn:active {
  background: #444;
}
</style>