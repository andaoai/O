<template>
  <div class="control">
    <h3 class="title">控制面板</h3>

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

    <!-- 缩放控制 -->
    <div class="zoom-control">
      <label>缩放控制:</label>
      <div class="zoom-display">
        {{ internalZoom ? Math.round(internalZoom * 100) + '%' : '100%' }}
      </div>
      <div class="zoom-buttons">
        <button
          class="zoom-btn"
          @click="zoomOut"
        >
          -
        </button>
        <button
          class="zoom-btn"
          @click="resetZoom"
        >
          重置
        </button>
        <button
          class="zoom-btn"
          @click="zoomIn"
        >
          +
        </button>
      </div>
      <div class="zoom-presets">
        <button
          class="preset-btn"
          @click="setZoom(0.5)"
        >
          50%
        </button>
        <button
          class="preset-btn"
          @click="setZoom(0.75)"
        >
          75%
        </button>
        <button
          class="preset-btn"
          @click="setZoom(1)"
        >
          100%
        </button>
        <button
          class="preset-btn"
          @click="setZoom(1.25)"
        >
          125%
        </button>
        <button
          class="preset-btn"
          @click="setZoom(1.5)"
        >
          150%
        </button>
      </div>
    </div>

    <!-- 平移控制 -->
    <div class="offset-control">
      <label>平移控制:</label>
      <div class="offset-display">
        X: {{ internalOffsetX }} Y: {{ internalOffsetY }}
      </div>
      <div class="offset-controls">
        <div class="offset-row">
          <button
            class="offset-btn"
            @click="moveUp"
          >
            ↑
          </button>
        </div>
        <div class="offset-row">
          <button
            class="offset-btn"
            @click="moveLeft"
          >
            ←
          </button>
          <button
            class="offset-btn"
            @click="resetOffset"
          >
            重置
          </button>
          <button
            class="offset-btn"
            @click="moveRight"
          >
            →
          </button>
        </div>
        <div class="offset-row">
          <button
            class="offset-btn"
            @click="moveDown"
          >
            ↓
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

interface Props {
  modelValue?: Date
  zoom?: number
  offsetX?: number
  offsetY?: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: Date]
  'timeChange': [value: Date]
  'update:zoom': [value: number]
  'zoomChange': [value: number]
  'update:offsetX': [value: number]
  'update:offsetY': [value: number]
  'offsetChange': [value: { x: number, y: number }]
}>()

// 响应式数据
const currentTime = ref(new Date())
const isPlaying = ref(false)
const playSpeed = ref(60) // 默认1分钟/秒
const internalZoom = ref(1) // 内部缩放状态，默认为1
const internalOffsetX = ref(0) // 内部X轴偏移，默认为0
const internalOffsetY = ref(0) // 内部Y轴偏移，默认为0
let animationId: number | null = null

// 监听 props.zoom 的变化
watch(() => props.zoom, (newZoom) => {
  if (newZoom !== undefined && newZoom !== null) {
    internalZoom.value = newZoom
  }
}, { immediate: true })

// 监听 props.offsetX 的变化
watch(() => props.offsetX, (newOffsetX) => {
  if (newOffsetX !== undefined && newOffsetX !== null) {
    internalOffsetX.value = newOffsetX
  }
}, { immediate: true })

// 监听 props.offsetY 的变化
watch(() => props.offsetY, (newOffsetY) => {
  if (newOffsetY !== undefined && newOffsetY !== null) {
    internalOffsetY.value = newOffsetY
  }
}, { immediate: true })

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

// 缩放功能
const updateZoom = (newZoom: number) => {
  const clampedZoom = Math.max(0.1, Math.min(3, newZoom)) // 限制在 0.1 到 3 之间
  internalZoom.value = clampedZoom
  emit('update:zoom', clampedZoom)
  emit('zoomChange', clampedZoom)
}

const zoomIn = () => {
  updateZoom(internalZoom.value + 0.1)
}

const zoomOut = () => {
  updateZoom(internalZoom.value - 0.1)
}

const resetZoom = () => {
  updateZoom(1)
}

const setZoom = (zoom: number) => {
  updateZoom(zoom)
}

// 平移功能
const updateOffset = (newOffsetX: number, newOffsetY: number) => {
  internalOffsetX.value = newOffsetX
  internalOffsetY.value = newOffsetY
  emit('update:offsetX', newOffsetX)
  emit('update:offsetY', newOffsetY)
  emit('offsetChange', { x: newOffsetX, y: newOffsetY })
}

const moveLeft = () => {
  updateOffset(internalOffsetX.value - 50, internalOffsetY.value)
}

const moveRight = () => {
  updateOffset(internalOffsetX.value + 50, internalOffsetY.value)
}

const moveUp = () => {
  updateOffset(internalOffsetX.value, internalOffsetY.value - 50)
}

const moveDown = () => {
  updateOffset(internalOffsetX.value, internalOffsetY.value + 50)
}

const resetOffset = () => {
  updateOffset(0, 0)
}

// 清理
onUnmounted(() => {
  pause()
})
</script>

<style scoped>
.control {
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

.zoom-control {
  text-align: center;
  border-top: 1px solid #444;
  padding-top: 16px;
  margin-top: 16px;
}

.zoom-control label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  color: #ccc;
}

.zoom-display {
  font-size: 18px;
  font-weight: bold;
  color: #00ff00;
  margin-bottom: 8px;
  font-family: 'Courier New', monospace;
}

.zoom-buttons {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
  justify-content: center;
}

.zoom-btn {
  width: 40px;
  padding: 6px;
  background: #333;
  border: 1px solid #555;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.2s;
}

.zoom-btn:hover {
  background: #444;
  border-color: #666;
}

.zoom-btn:active {
  background: #555;
}

.zoom-presets {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  gap: 2px;
}

.preset-btn {
  padding: 4px 2px;
  background: #222;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  font-size: 9px;
  transition: all 0.2s;
}

.preset-btn:hover {
  background: #333;
  border-color: #555;
}

.preset-btn:active {
  background: #444;
}

.offset-control {
  text-align: center;
  border-top: 1px solid #444;
  padding-top: 16px;
  margin-top: 16px;
}

.offset-control label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  color: #ccc;
}

.offset-display {
  font-size: 14px;
  font-weight: bold;
  color: #00ff00;
  margin-bottom: 8px;
  font-family: 'Courier New', monospace;
}

.offset-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.offset-row {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.offset-btn {
  width: 40px;
  height: 30px;
  padding: 4px;
  background: #333;
  border: 1px solid #555;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.offset-btn:hover {
  background: #444;
  border-color: #666;
}

.offset-btn:active {
  background: #555;
}

.offset-btn:nth-child(2) {
  width: 50px; /* 重置按钮稍微宽一些 */
}
</style>