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
          class="step-btn year-btn negative"
          @click="stepYear(-1)"
        >
          -1年
        </button>
        <button
          class="step-btn month-btn negative"
          @click="stepMonth(-1)"
        >
          -1月
        </button>
        <button
          class="step-btn"
          @click="stepTime(-86400)"
        >
          -1天
        </button>
        <button
          class="step-btn"
          @click="stepTime(-3600)"
        >
          -1小时
        </button>
        <button
          class="step-btn"
          @click="stepTime(3600)"
        >
          +1小时
        </button>
        <button
          class="step-btn"
          @click="stepTime(86400)"
        >
          +1天
        </button>
        <button
          class="step-btn month-btn"
          @click="stepMonth(1)"
        >
          +1月
        </button>
        <button
          class="step-btn year-btn"
          @click="stepYear(1)"
        >
          +1年
        </button>
      </div>
    </div>

    <!-- 时间选择器 -->
    <div class="time-selector">
      <label>时间选择:</label>
      <div class="time-inputs">
        <div class="date-input-group">
          <label>日期:</label>
          <input
            type="text"
            v-model="dateInput"
            @change="onDateChange"
            @blur="onDateChange"
            placeholder="YYYY-MM-DD"
            class="time-input"
          />
        </div>
        <div class="clock-input-group">
          <label>时间:</label>
          <input
            type="text"
            v-model="timeInput"
            @change="onTimeChange"
            @blur="onTimeChange"
            placeholder="HH:MM:SS"
            class="time-input"
          />
        </div>
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

    <!-- 快捷键提示 -->
    <div class="shortcuts-hint">
      <div class="hint-title">快捷键</div>
      <div class="shortcuts-grid">
        <div class="shortcut-item">
          <span class="key">空格</span>
          <span class="desc">播放/暂停</span>
        </div>
        <div class="shortcut-item">
          <span class="key">R</span>
          <span class="desc">重置时间</span>
        </div>
        <div class="shortcut-item">
          <span class="key">Y/Shift+Y</span>
          <span class="desc">±1年</span>
        </div>
        <div class="shortcut-item">
          <span class="key">M/Shift+M</span>
          <span class="desc">±1月</span>
        </div>
        <div class="shortcut-item">
          <span class="key">D/Shift+D</span>
          <span class="desc">±1天</span>
        </div>
        <div class="shortcut-item">
          <span class="key">H/Shift+H</span>
          <span class="desc">±1小时</span>
        </div>
        <div class="shortcut-item">
          <span class="key">1-4</span>
          <span class="desc">跳转时段</span>
        </div>
        <div class="shortcut-item">
          <span class="key">+/-</span>
          <span class="desc">缩放</span>
        </div>
        <div class="shortcut-item">
          <span class="key">方向键</span>
          <span class="desc">平移</span>
        </div>
        <div class="shortcut-item">
          <span class="key">0</span>
          <span class="desc">重置缩放</span>
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

// 时间选择器的响应式数据
const dateInput = ref('')
const timeInput = ref('')

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

// 更新时间选择器的值
const updateDateTimeInputs = (date: Date) => {
  // 格式化日期为 YYYY-MM-DD
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  dateInput.value = `${year}-${month}-${day}`

  // 格式化时间为 HH:MM:SS
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  timeInput.value = `${hours}:${minutes}:${seconds}`
}

// 计算属性
const formattedTime = computed(() => formatTime(currentTime.value))

// 监听时间变化，更新时间选择器的值
watch(() => currentTime.value, (newTime) => {
  updateDateTimeInputs(newTime)
}, { immediate: true })

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

// 处理日期变化
const onDateChange = () => {
  if (!dateInput.value || !timeInput.value) return

  pause()
  const dateParts = dateInput.value.split('-').map(Number)
  const timeParts = timeInput.value.split(':').map(Number)

  // 验证解析的数字是否有效
  if (dateParts.length !== 3 || timeParts.length !== 3) return
  if (dateParts.some(isNaN) || timeParts.some(isNaN)) return

  const year = dateParts[0]!
  const month = dateParts[1]!
  const day = dateParts[2]!
  const hours = timeParts[0]!
  const minutes = timeParts[1]!
  const seconds = timeParts[2]!

  const newTime = new Date(year, month - 1, day, hours, minutes, seconds)
  if (!isNaN(newTime.getTime())) {
    updateTime(newTime)
  }
}

// 处理时间变化
const onTimeChange = () => {
  if (!dateInput.value || !timeInput.value) return

  pause()
  const dateParts = dateInput.value.split('-').map(Number)
  const timeParts = timeInput.value.split(':').map(Number)

  // 验证解析的数字是否有效
  if (dateParts.length !== 3 || timeParts.length !== 3) return
  if (dateParts.some(isNaN) || timeParts.some(isNaN)) return

  const year = dateParts[0]!
  const month = dateParts[1]!
  const day = dateParts[2]!
  const hours = timeParts[0]!
  const minutes = timeParts[1]!
  const seconds = timeParts[2]!

  const newTime = new Date(year, month - 1, day, hours, minutes, seconds)
  if (!isNaN(newTime.getTime())) {
    updateTime(newTime)
  }
}

// 步进时间
const stepTime = (seconds: number) => {
  pause()
  const newTime = new Date(currentTime.value.getTime() + seconds * 1000)
  updateTime(newTime)
}

// 步进月份
const stepMonth = (months: number) => {
  pause()
  const newTime = new Date(currentTime.value)
  const currentMonth = newTime.getMonth()
  const currentYear = newTime.getFullYear()

  // 计算新的年份和月份
  let newMonth = currentMonth + months
  let newYear = currentYear

  if (newMonth > 11) {
    newYear += Math.floor(newMonth / 12)
    newMonth = newMonth % 12
  } else if (newMonth < 0) {
    newYear += Math.floor(newMonth / 12)
    newMonth = (newMonth % 12 + 12) % 12
  }

  newTime.setFullYear(newYear, newMonth, newTime.getDate())
  updateTime(newTime)
}

// 步进年份
const stepYear = (years: number) => {
  pause()
  const newTime = new Date(currentTime.value)
  newTime.setFullYear(newTime.getFullYear() + years)
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

// 键盘快捷键处理
const handleKeyDown = (event: KeyboardEvent) => {
  // 防止在输入框中触发快捷键
  if (event.target instanceof HTMLInputElement) {
    return
  }

  switch (event.key) {
    // 播放/暂停
    case ' ':
    case 'Space':
      event.preventDefault()
      togglePlayPause()
      break

    // 重置到当前时间
    case 'r':
    case 'R':
      event.preventDefault()
      resetToNow()
      break

    // 时间调节 - 年
    case 'Y':
    case 'y':
      if (event.shiftKey) {
        event.preventDefault()
        stepYear(-1) // Shift+Y = -1年
      } else {
        event.preventDefault()
        stepYear(1)  // Y = +1年
      }
      break

    // 时间调节 - 月
    case 'M':
    case 'm':
      if (event.shiftKey) {
        event.preventDefault()
        stepMonth(-1) // Shift+M = -1月
      } else {
        event.preventDefault()
        stepMonth(1)  // M = +1月
      }
      break

    // 时间调节 - 天
    case 'D':
    case 'd':
      if (event.shiftKey) {
        event.preventDefault()
        stepTime(-86400) // Shift+D = -1天
      } else {
        event.preventDefault()
        stepTime(86400)   // D = +1天
      }
      break

    // 时间调节 - 小时
    case 'H':
    case 'h':
      if (event.shiftKey) {
        event.preventDefault()
        stepTime(-3600) // Shift+H = -1小时
      } else {
        event.preventDefault()
        stepTime(3600)  // H = +1小时
      }
      break

    // 快速跳转
    case '1':
      event.preventDefault()
      setTimeOfDay(0, 0)   // 00:00
      break
    case '2':
      event.preventDefault()
      setTimeOfDay(6, 0)   // 06:00
      break
    case '3':
      event.preventDefault()
      setTimeOfDay(12, 0)  // 12:00
      break
    case '4':
      event.preventDefault()
      setTimeOfDay(18, 0)  // 18:00
      break

    // 缩放控制
    case '+':
    case '=':
      event.preventDefault()
      zoomIn()
      break
    case '-':
    case '_':
      event.preventDefault()
      zoomOut()
      break
    case '0':
      event.preventDefault()
      resetZoom()
      break

    // 预设缩放
    case '5':
      event.preventDefault()
      setZoom(0.5)   // 50%
      break
    case '6':
      event.preventDefault()
      setZoom(0.75)  // 75%
      break
    case '7':
      event.preventDefault()
      setZoom(1)     // 100%
      break
    case '8':
      event.preventDefault()
      setZoom(1.25)  // 125%
      break
    case '9':
      event.preventDefault()
      setZoom(1.5)   // 150%
      break

    // 平移控制
    case 'ArrowUp':
      event.preventDefault()
      moveUp()
      break
    case 'ArrowDown':
      event.preventDefault()
      moveDown()
      break
    case 'ArrowLeft':
      event.preventDefault()
      moveLeft()
      break
    case 'ArrowRight':
      event.preventDefault()
      moveRight()
      break

    // 重置平移
    case 'Delete':
    case 'Backspace':
      event.preventDefault()
      resetOffset()
      break
  }
}

// 生命周期钩子
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  pause()
  window.removeEventListener('keydown', handleKeyDown)
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

.time-selector {
  text-align: center;
  margin-bottom: 16px;
}

.time-selector label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  color: #ccc;
}

.time-inputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.date-input-group, .clock-input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-input-group label, .clock-input-group label {
  font-size: 11px;
  color: #aaa;
  margin-bottom: 2px;
}

.time-input {
  width: 100%;
  padding: 6px 8px;
  background: #333;
  border: 1px solid #555;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  font-family: 'Courier New', monospace;
  transition: all 0.2s;
}

.time-input:focus {
  outline: none;
  border-color: #ffcc00;
  background: #444;
  box-shadow: 0 0 4px rgba(255, 204, 0, 0.3);
}

.time-input:hover {
  border-color: #666;
  background: #3a3a3a;
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
  grid-template-columns: 1fr 1fr 1fr 1fr;
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

.month-btn {
  background: #444;
  border-color: #666;
}

.month-btn:hover {
  background: #555;
  border-color: #777;
}

.year-btn {
  background: #555;
  border-color: #777;
  color: #ffcc00;
}

.year-btn:hover {
  background: #666;
  border-color: #888;
}

.negative {
  background: #444;
  border-color: #666;
  color: #ff6666;
}

.month-btn.negative:hover {
  background: #555;
  border-color: #777;
}

.year-btn.negative:hover {
  background: #555;
  border-color: #777;
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

.shortcuts-hint {
  border-top: 1px solid #444;
  padding-top: 16px;
  margin-top: 16px;
}

.hint-title {
  font-size: 12px;
  font-weight: bold;
  color: #ffcc00;
  margin-bottom: 8px;
  text-align: center;
}

.shortcuts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 6px;
  background: #222;
  border: 1px solid #444;
  border-radius: 3px;
  font-size: 10px;
}

.key {
  background: #333;
  color: #ffcc00;
  padding: 2px 4px;
  border-radius: 2px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  font-size: 9px;
}

.desc {
  color: #ccc;
  font-size: 9px;
}
</style>