<template>
  <div
    class="control"
    :class="{
      'dragging': isDragging
    }"
    :style="panelStyle"
    @mousedown="handleMouseDown"
  >
    <!-- 标题栏：可拖拽 -->
    <div class="control-header" :class="{ 'minimal': allCollapsed }">
      <h3 v-if="!allCollapsed" class="title">控制面板</h3>
      <div v-else class="minimal-time">{{ formatDateTime(currentTime) }}</div>
      <div class="header-controls">
        <button
          class="header-btn"
          @click="toggleAllModules"
          :title="allCollapsed ? '展开所有' : '折叠所有'"
        >
          {{ allCollapsed ? '⊕' : '⊖' }}
        </button>
      </div>
    </div>

    <!-- 时间显示模块 -->
    <div class="module" :class="{ collapsed: modules.time.collapsed }">
      <div class="module-header" @click="toggleModule('time')">
        <span class="module-title">时间信息</span>
        <span class="module-toggle">{{ modules.time.collapsed ? '▶' : '▼' }}</span>
      </div>
      <div v-if="!modules.time.collapsed" class="module-content">
        <div class="time-display">
          <div class="current-time">{{ formatTime(currentTime) }}</div>
          <div class="date-display">{{ formatDate(currentTime) }}</div>
          <div class="lunar-display">
            <div class="lunar-date">{{ chineseCalendar.lunarDate }}</div>
            <div class="ganzhi-year">{{ chineseCalendar.ganzhi.year.full }}年 {{ chineseCalendar.ganzhi.year.animal }}</div>
          </div>
          <div v-if="chineseCalendar.solarTerm" class="solar-term-display">
            <div class="solar-term-text">
              {{ getSolarTermDescription(chineseCalendar.solarTerm) }}
            </div>
          </div>
          <div class="daily-ganzhi">
            {{ chineseCalendar.ganzhi.day.full }}日 {{ chineseCalendar.ganzhi.hour.full }}时
          </div>
        </div>
      </div>
    </div>

    <!-- 播放控制模块 -->
    <div class="module" :class="{ collapsed: modules.playback.collapsed }">
      <div class="module-header" @click="toggleModule('playback')">
        <span class="module-title">播放控制</span>
        <span class="module-toggle">{{ modules.playback.collapsed ? '▶' : '▼' }}</span>
      </div>
      <div v-if="!modules.playback.collapsed" class="module-content">
        <div class="control-buttons">
          <button
            class="control-btn"
            @click="togglePlayPause"
            :class="{ active: isPlaying }"
            title="空格键"
          >
            {{ isPlaying ? '⏸ 暂停' : '▶ 播放' }}
            <span class="key-hint">空格</span>
          </button>
          <button
            class="control-btn"
            @click="resetToNow"
            title="R键"
          >
            ⟲ 现在
            <span class="key-hint">R</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 播放速度模块 -->
    <div class="module" :class="{ collapsed: modules.speed.collapsed }">
      <div class="module-header" @click="toggleModule('speed')">
        <span class="module-title">播放速度</span>
        <span class="module-toggle">{{ modules.speed.collapsed ? '▶' : '▼' }}</span>
      </div>
      <div v-if="!modules.speed.collapsed" class="module-content">
        <div class="speed-control">
          <select v-model="playSpeed" @change="updatePlaySpeed">
            <option value="1">1x</option>
            <option value="60">1分钟/秒</option>
            <option value="3600">1小时/秒</option>
            <option value="86400">1天/秒</option>
            <option value="1296000">15天/秒</option>
            <option value="2592000">1个月/秒</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 时间调节模块 -->
    <div class="module" :class="{ collapsed: modules.adjustment.collapsed }">
      <div class="module-header" @click="toggleModule('adjustment')">
        <span class="module-title">时间调节</span>
        <span class="module-toggle">{{ modules.adjustment.collapsed ? '▶' : '▼' }}</span>
      </div>
      <div v-if="!modules.adjustment.collapsed" class="module-content">
        <div class="manual-controls">
          <button class="step-btn year-btn negative" @click="stepYear(-1)" title="Shift+Y">
            -1年
            <span class="key-hint">⇧Y</span>
          </button>
          <button class="step-btn month-btn negative" @click="stepMonth(-1)" title="Shift+M">
            -1月
            <span class="key-hint">⇧M</span>
          </button>
          <button class="step-btn" @click="stepTime(-86400)" title="Shift+D">
            -1天
            <span class="key-hint">⇧D</span>
          </button>
          <button class="step-btn" @click="stepTime(-3600)" title="Shift+H">
            -1小时
            <span class="key-hint">⇧H</span>
          </button>
          <button class="step-btn negative" @click="stepTime(-60)" title="Shift+N">
            -1分
            <span class="key-hint">⇧N</span>
          </button>
          <button class="step-btn negative" @click="stepTime(-1)" title="Shift+S">
            -1秒
            <span class="key-hint">⇧S</span>
          </button>
          <button class="step-btn" @click="stepTime(1)" title="S">
            +1秒
            <span class="key-hint">S</span>
          </button>
          <button class="step-btn" @click="stepTime(60)" title="N">
            +1分
            <span class="key-hint">N</span>
          </button>
          <button class="step-btn" @click="stepTime(3600)" title="H">
            +1小时
            <span class="key-hint">H</span>
          </button>
          <button class="step-btn" @click="stepTime(86400)" title="D">
            +1天
            <span class="key-hint">D</span>
          </button>
          <button class="step-btn month-btn" @click="stepMonth(1)" title="M">
            +1月
            <span class="key-hint">M</span>
          </button>
          <button class="step-btn year-btn" @click="stepYear(1)" title="Y">
            +1年
            <span class="key-hint">Y</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 时间选择模块 -->
    <div class="module" :class="{ collapsed: modules.selector.collapsed }">
      <div class="module-header" @click="toggleModule('selector')">
        <span class="module-title">时间选择</span>
        <span class="module-toggle">{{ modules.selector.collapsed ? '▶' : '▼' }}</span>
      </div>
      <div v-if="!modules.selector.collapsed" class="module-content">
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
    </div>

    <!-- 缩放控制模块 -->
    <div class="module" :class="{ collapsed: modules.zoom.collapsed }">
      <div class="module-header" @click="toggleModule('zoom')">
        <span class="module-title">缩放控制</span>
        <span class="module-toggle">{{ modules.zoom.collapsed ? '▶' : '▼' }}</span>
      </div>
      <div v-if="!modules.zoom.collapsed" class="module-content">
        <div class="zoom-display">
          {{ internalZoom ? Math.round(internalZoom * 100) + '%' : '100%' }}
        </div>
        <div class="zoom-buttons">
          <button class="zoom-btn" @click="zoomOut" title="-键">
            -
            <span class="key-hint">-</span>
          </button>
          <button class="zoom-btn" @click="resetZoom" title="0键">
            重置
            <span class="key-hint">0</span>
          </button>
          <button class="zoom-btn" @click="zoomIn" title="+键">
            +
            <span class="key-hint">+</span>
          </button>
        </div>
        <div class="zoom-presets">
          <button class="preset-btn" @click="setZoom(0.5)">50%</button>
          <button class="preset-btn" @click="setZoom(0.75)">75%</button>
          <button class="preset-btn" @click="setZoom(1)">100%</button>
          <button class="preset-btn" @click="setZoom(1.25)">125%</button>
          <button class="preset-btn" @click="setZoom(1.5)">150%</button>
        </div>
      </div>
    </div>

    <!-- 平移控制模块 -->
    <div class="module" :class="{ collapsed: modules.offset.collapsed }">
      <div class="module-header" @click="toggleModule('offset')">
        <span class="module-title">平移控制</span>
        <span class="module-toggle">{{ modules.offset.collapsed ? '▶' : '▼' }}</span>
      </div>
      <div v-if="!modules.offset.collapsed" class="module-content">
        <div class="offset-display">
          X: {{ internalOffsetX }} Y: {{ internalOffsetY }}
        </div>
        <div class="offset-controls">
          <div class="offset-row">
            <button class="offset-btn" @click="moveUp" title="方向键↑">
              ↑
              <span class="key-hint">↑</span>
            </button>
          </div>
          <div class="offset-row">
            <button class="offset-btn" @click="moveLeft" title="方向键←">
              ←
              <span class="key-hint">←</span>
            </button>
            <button class="offset-btn" @click="resetOffset" title="Delete/Backspace">
              重置
              <span class="key-hint">Del</span>
            </button>
            <button class="offset-btn" @click="moveRight" title="方向键→">
              →
              <span class="key-hint">→</span>
            </button>
          </div>
          <div class="offset-row">
            <button class="offset-btn" @click="moveDown" title="方向键↓">
              ↓
              <span class="key-hint">↓</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 旋转方向控制模块 -->
    <div class="module" :class="{ collapsed: modules.rotation.collapsed }">
      <div class="module-header" @click="toggleModule('rotation')">
        <span class="module-title">旋转方向</span>
        <span class="module-toggle">{{ modules.rotation.collapsed ? '▶' : '▼' }}</span>
      </div>
      <div v-if="!modules.rotation.collapsed" class="module-content">
        <div class="rotation-control">
          <div class="rotation-display">
            当前: {{ internalRotationDirection === 'clockwise' ? '顺时针' : '逆时针' }}
          </div>
          <div class="rotation-buttons">
            <button
              class="rotation-btn"
              @click="updateRotationDirection('clockwise')"
              :class="{ active: internalRotationDirection === 'clockwise' }"
              title="顺时针旋转"
            >
              顺时针
              <span class="rotation-icon">↻</span>
            </button>
            <button
              class="rotation-btn"
              @click="updateRotationDirection('counterclockwise')"
              :class="{ active: internalRotationDirection === 'counterclockwise' }"
              title="逆时针旋转"
            >
              逆时针
              <span class="rotation-icon">↺</span>
            </button>
          </div>
          <div class="rotation-hint">
            快捷键: C
          </div>
        </div>
      </div>
    </div>

    <!-- 旋转角度控制模块 -->
    <div class="module" :class="{ collapsed: modules.rotationAngle.collapsed }">
      <div class="module-header" @click="toggleModule('rotationAngle')">
        <span class="module-title">旋转角度</span>
        <span class="module-toggle">{{ modules.rotationAngle.collapsed ? '▶' : '▼' }}</span>
      </div>
      <div v-if="!modules.rotationAngle.collapsed" class="module-content">
        <div class="rotation-angle-control">
          <div class="rotation-angle-display">
            当前: {{ rotationAngle }}°
          </div>
          <div class="rotation-angle-buttons">
            <button
              class="rotation-angle-btn"
              @click="rotateLeft"
              title="向左旋转90度"
            >
              ↺ 左转90°
              <span class="key-hint">Q</span>
            </button>
            <button
              class="rotation-angle-btn"
              @click="resetRotationAngle"
              title="重置旋转角度"
            >
              ⟲ 重置
              <span class="key-hint">W</span>
            </button>
            <button
              class="rotation-angle-btn"
              @click="rotateRight"
              title="向右旋转90度"
            >
              ↻ 右转90°
              <span class="key-hint">E</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { getChineseCalendarInfo, getSolarTermDescription } from '@/utils/chineseCalendar'
import { useTimePlayback } from '@/composables/useTimePlayback'
import { usePanelDrag } from '@/composables/usePanelDrag'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'

interface Props {
  modelValue?: Date
  zoom?: number
  offsetX?: number
  offsetY?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
  rotationAngle?: number
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
  'update:rotationDirection': [value: 'clockwise' | 'counterclockwise']
  'rotationDirectionChange': [value: 'clockwise' | 'counterclockwise']
  'update:rotationAngle': [value: number]
  'rotationAngleChange': [value: number]
}>()

// 定义模块键类型以支持类型安全的索引访问
type ModuleKey = 'time' | 'playback' | 'speed' | 'adjustment' | 'selector' | 'zoom' | 'offset' | 'rotation' | 'rotationAngle'

// ── 时间播放（composable）──
const {
  currentTime,
  isPlaying,
  playSpeed,
  updateTime,
  pause,
  togglePlayPause,
  resetToNow,
  updatePlaySpeed,
  stepTime,
  stepMonth,
  stepYear
} = useTimePlayback((t) => {
  emit('update:modelValue', t)
  emit('timeChange', t)
})

// ── 面板拖拽（composable）──
const {
  isDragging,
  panelPositionX,
  panelPositionY,
  handleMouseDown,
  handleResize,
  clampPanelPosition
} = usePanelDrag()

// 视口控制状态
const internalZoom = ref(1)
const internalOffsetX = ref(0)
const internalOffsetY = ref(0)
const internalRotationDirection = ref<'clockwise' | 'counterclockwise'>('clockwise')
const rotationAngle = ref(0)

// 模块折叠状态
const modules = ref({
  time: { collapsed: false },
  playback: { collapsed: false },
  speed: { collapsed: false },
  adjustment: { collapsed: false },
  selector: { collapsed: false },
  zoom: { collapsed: false },
  offset: { collapsed: false },
  rotation: { collapsed: false },
  rotationAngle: { collapsed: false }
})

// 从localStorage恢复模块折叠状态
const savedState = localStorage.getItem('control-panel-modules-state')
if (savedState) {
  try {
    const state = JSON.parse(savedState)
    const validKeys: ModuleKey[] = ['time', 'playback', 'speed', 'adjustment', 'selector', 'zoom', 'offset', 'rotation', 'rotationAngle']
    validKeys.forEach(key => {
      if (state[key] && modules.value[key]) {
        modules.value[key].collapsed = state[key].collapsed
      }
    })
  } catch (e) {
    console.error('Failed to load panel state:', e)
  }
}

// 时间选择器的响应式数据
const dateInput = ref('')
const timeInput = ref('')

// 中国历法信息
const chineseCalendar = computed(() => getChineseCalendarInfo(currentTime.value))

// 计算面板样式
const panelStyle = computed(() => {
  const basePosition = {
    right: `${20 - panelPositionX.value}px`,
    top: `${20 + panelPositionY.value}px`
  }

  // 计算展开的模块数量
  const expandedCount = Object.values(modules.value).filter(m => !m.collapsed).length

  if (expandedCount === 0) {
    // 所有模块都折叠，只显示标题栏和「年月日 时分秒」
    return {
      ...basePosition,
      width: '230px',
      height: '44px',
      overflow: 'hidden'
    }
  }

  // 根据展开的模块数量调整高度
  const minHeight = 60 + expandedCount * 40 // 标题栏 + 每个模块最小高度
  const availableHeight = window.innerHeight - (20 + panelPositionY.value) // 从面板顶部到网页底部的可用空间
  const height = Math.max(minHeight, availableHeight) // 使用最大高度，让面板可以延伸到网页底部

  return {
    ...basePosition,
    width: '260px',
    maxHeight: `${height}px`,
    overflowY: 'auto' as const
  }
})

// 计算是否所有模块都折叠了
const allCollapsed = computed(() => {
  return Object.values(modules.value).every(m => m.collapsed)
})

// 切换模块折叠状态
const toggleModule = (moduleName: ModuleKey) => {
  modules.value[moduleName].collapsed = !modules.value[moduleName].collapsed
  saveModuleState()
}

// 切换所有模块
const toggleAllModules = () => {
  const shouldCollapse = !allCollapsed.value
  const validKeys: ModuleKey[] = ['time', 'playback', 'speed', 'adjustment', 'selector', 'zoom', 'offset', 'rotation', 'rotationAngle']
  validKeys.forEach(key => {
    modules.value[key].collapsed = shouldCollapse
  })
  saveModuleState()
}

// 保存模块状态
const saveModuleState = () => {
  localStorage.setItem('control-panel-modules-state', JSON.stringify(modules.value))
}

// 监听 props 的变化
watch(() => props.zoom, (newZoom) => {
  if (newZoom !== undefined && newZoom !== null) {
    internalZoom.value = newZoom
  }
}, { immediate: true })

watch(() => props.offsetX, (newOffsetX) => {
  if (newOffsetX !== undefined && newOffsetX !== null) {
    internalOffsetX.value = newOffsetX
  }
}, { immediate: true })

watch(() => props.offsetY, (newOffsetY) => {
  if (newOffsetY !== undefined && newOffsetY !== null) {
    internalOffsetY.value = newOffsetY
  }
}, { immediate: true })

watch(() => props.rotationDirection, (newDirection) => {
  if (newDirection) {
    internalRotationDirection.value = newDirection
  }
}, { immediate: true })

watch(() => props.rotationAngle, (newAngle) => {
  if (newAngle !== undefined && newAngle !== null) {
    rotationAngle.value = newAngle
  }
}, { immediate: true })

// 更新时间选择器的值
const updateDateTimeInputs = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  dateInput.value = `${year}-${month}-${day}`

  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  timeInput.value = `${hours}:${minutes}:${seconds}`
}

// 监听时间变化，同步输入框
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

// 格式化「年月日 时分秒」（折叠态标题栏用）
const formatDateTime = (date: Date): string => {
  return `${formatDate(date)} ${formatTime(date)}`
}

// 从输入框解析时间（日期/时间输入共用）：手动改时间先暂停播放，再覆盖为解析值
const applyInputTime = () => {
  if (!dateInput.value || !timeInput.value) return
  const dateParts = dateInput.value.split('-').map(Number)
  const timeParts = timeInput.value.split(':').map(Number)
  if (dateParts.length !== 3 || timeParts.length !== 3) return
  if (dateParts.some(isNaN) || timeParts.some(isNaN)) return

  const newTime = new Date(
    dateParts[0]!, dateParts[1]! - 1, dateParts[2]!,
    timeParts[0]!, timeParts[1]!, timeParts[2]!
  )
  if (!isNaN(newTime.getTime())) {
    pause()
    updateTime(newTime)
  }
}

const onDateChange = applyInputTime
const onTimeChange = applyInputTime

// ── 缩放 ──
const updateZoom = (newZoom: number) => {
  const clampedZoom = Math.max(0.1, Math.min(3, newZoom))
  internalZoom.value = clampedZoom
  emit('update:zoom', clampedZoom)
  emit('zoomChange', clampedZoom)
}
const zoomIn = () => updateZoom(internalZoom.value + 0.1)
const zoomOut = () => updateZoom(internalZoom.value - 0.1)
const resetZoom = () => updateZoom(1)
const setZoom = (zoom: number) => updateZoom(zoom)

// ── 平移 ──
const updateOffset = (newOffsetX: number, newOffsetY: number) => {
  internalOffsetX.value = newOffsetX
  internalOffsetY.value = newOffsetY
  emit('update:offsetX', newOffsetX)
  emit('update:offsetY', newOffsetY)
  emit('offsetChange', { x: newOffsetX, y: newOffsetY })
}
const moveLeft = () => updateOffset(internalOffsetX.value - 50, internalOffsetY.value)
const moveRight = () => updateOffset(internalOffsetX.value + 50, internalOffsetY.value)
const moveUp = () => updateOffset(internalOffsetX.value, internalOffsetY.value - 50)
const moveDown = () => updateOffset(internalOffsetX.value, internalOffsetY.value + 50)
const resetOffset = () => updateOffset(0, 0)

// ── 旋转方向 ──
const updateRotationDirection = (direction: 'clockwise' | 'counterclockwise') => {
  internalRotationDirection.value = direction
  emit('update:rotationDirection', direction)
  emit('rotationDirectionChange', direction)
}
const toggleRotationDirection = () => {
  updateRotationDirection(internalRotationDirection.value === 'clockwise' ? 'counterclockwise' : 'clockwise')
}

// ── 旋转角度 ──
const updateRotationAngle = (angle: number) => {
  const normalizedAngle = ((angle % 360) + 360) % 360
  rotationAngle.value = normalizedAngle
  emit('update:rotationAngle', normalizedAngle)
  emit('rotationAngleChange', normalizedAngle)
}
const rotateLeft = () => updateRotationAngle(rotationAngle.value - 90)
const rotateRight = () => updateRotationAngle(rotationAngle.value + 90)
const resetRotationAngle = () => updateRotationAngle(0)

// ── 键盘快捷键（composable）──
useKeyboardShortcuts({
  togglePlayPause,
  resetToNow,
  stepYear,
  stepMonth,
  stepTime,
  zoomIn,
  zoomOut,
  resetZoom,
  setZoom,
  moveUp,
  moveDown,
  moveLeft,
  moveRight,
  resetOffset,
  toggleRotationDirection,
  rotateLeft,
  rotateRight,
  resetRotationAngle
})

// 窗口大小变化 → 夹取面板位置
onMounted(() => {
  window.addEventListener('resize', handleResize)
  clampPanelPosition()
})
onUnmounted(() => window.removeEventListener('resize', handleResize))
</script>

<style scoped>
.control {
  position: fixed;
  background: #000000;
  border: 1px solid #333;
  border-radius: 8px;
  color: #fff;
  font-family: 'Arial', sans-serif;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
  z-index: 1000;
  transition: transform 0.1s ease;
  user-select: none;
  overflow: hidden;
}

.control.dragging {
  transform: scale(1.02);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.7);
  cursor: move;
}

/* 标题栏样式 */
.control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #000000;
  border-bottom: 1px solid #333;
  cursor: move;
  transition: all 0.3s ease;
}

.control-header.minimal {
  background: #000000;
}

.control-header .title {
  margin: 0;
  font-size: 14px;
  font-weight: bold;
  color: #ffcc00;
}

.minimal-time {
  font-size: 16px;
  font-weight: bold;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  flex: 1;
  text-align: center;
}

.header-controls {
  display: flex;
  gap: 4px;
}

.header-btn {
  width: 24px;
  height: 24px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  color: #aaa;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.header-btn:hover {
  background: #2a2a2a;
  border-color: #444;
  color: #fff;
}

/* 模块样式 */
.module {
  border-bottom: 1px solid #222;
  transition: all 0.3s ease;
}

.module:last-child {
  border-bottom: none;
}

.module.collapsed {
  background: #0a0a0a;
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease;
}

.module-header:hover {
  background: rgba(255, 255, 255, 0.05);
}

.module-title {
  font-size: 12px;
  color: #ccc;
  font-weight: bold;
}

.module-toggle {
  font-size: 10px;
  color: #888;
  transition: transform 0.2s ease;
}

.module-content {
  padding: 8px 12px;
  border-top: 1px solid #222;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 时间显示 */
.time-display {
  text-align: center;
  margin-bottom: 8px;
}

.current-time {
  font-size: 16px;
  font-weight: bold;
  color: #00ff00;
  margin-bottom: 4px;
  font-family: 'Courier New', monospace;
}

.date-display {
  font-size: 11px;
  color: #888;
  margin-bottom: 4px;
}

.lunar-display {
  margin-bottom: 4px;
  padding: 3px 0;
  border-top: 1px solid #222;
  border-bottom: 1px solid #222;
}

.lunar-date {
  font-size: 10px;
  color: #ff9900;
  font-weight: bold;
  margin-bottom: 1px;
}

.ganzhi-year {
  font-size: 9px;
  color: #ccaa00;
}

.solar-term-display {
  margin-bottom: 3px;
}

.solar-term-text {
  font-size: 9px;
  color: #66ccff;
  font-weight: bold;
}

.daily-ganzhi {
  font-size: 9px;
  color: #99cc99;
  font-style: italic;
}

/* 控制按钮 */
.control-buttons {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.control-btn {
  padding: 6px 10px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.control-btn:hover {
  background: #2a2a2a;
  border-color: #444;
}

.control-btn.active {
  background: #ffcc00;
  color: #000;
  border-color: #ffcc00;
}

/* 速度控制 */
.speed-control select {
  width: 100%;
  padding: 4px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  color: #fff;
  font-size: 11px;
}

/* 手动控制 */
.manual-controls {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 3px;
}

.step-btn {
  padding: 4px 3px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  font-size: 9px;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.step-btn:hover {
  background: #2a2a2a;
  border-color: #444;
}

.month-btn {
  background: #1f1f1f;
  border-color: #3a3a3a;
}

.year-btn {
  background: #2a2a2a;
  border-color: #444;
  color: #ffcc00;
}

.negative {
  color: #ff6666;
}

/* 时间输入 */
.time-inputs {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.date-input-group, .clock-input-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.date-input-group label, .clock-input-group label {
  font-size: 10px;
  color: #aaa;
}

.time-input {
  width: 100%;
  padding: 4px 6px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  color: #fff;
  font-size: 11px;
  font-family: 'Courier New', monospace;
  transition: all 0.2s;
}

.time-input:focus {
  outline: none;
  border-color: #ffcc00;
  background: #2a2a2a;
  box-shadow: 0 0 4px rgba(255, 204, 0, 0.3);
}

/* 缩放控制 */
.zoom-display {
  font-size: 14px;
  font-weight: bold;
  color: #00ff00;
  margin-bottom: 6px;
  text-align: center;
  font-family: 'Courier New', monospace;
}

.zoom-buttons {
  display: flex;
  gap: 3px;
  margin-bottom: 6px;
  justify-content: center;
}

.zoom-btn {
  width: 32px;
  padding: 4px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.zoom-btn:hover {
  background: #2a2a2a;
  border-color: #444;
}

.zoom-presets {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  gap: 2px;
}

.preset-btn {
  padding: 3px 2px;
  background: #151515;
  border: 1px solid #2a2a2a;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  font-size: 8px;
  transition: all 0.2s;
}

.preset-btn:hover {
  background: #1f1f1f;
  border-color: #3a3a3a;
}

/* 平移控制 */
.offset-display {
  font-size: 11px;
  font-weight: bold;
  color: #00ff00;
  margin-bottom: 6px;
  text-align: center;
  font-family: 'Courier New', monospace;
}

.offset-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.offset-row {
  display: flex;
  gap: 3px;
  justify-content: center;
}

.offset-btn {
  width: 32px;
  height: 26px;
  padding: 3px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
}

.offset-btn:hover {
  background: #2a2a2a;
  border-color: #444;
}

.offset-btn:nth-child(2) {
  width: 40px;
}

/* 快捷键提示 */
.key-hint {
  font-size: 7px;
  color: #ffcc00;
  font-weight: bold;
  background: #1a1a1a;
  padding: 1px 2px;
  border-radius: 2px;
  margin-top: 1px;
}

/* 旋转方向控制 */
.rotation-control {
  text-align: center;
}

.rotation-display {
  font-size: 12px;
  color: #00ff00;
  margin-bottom: 8px;
  font-family: 'Courier New', monospace;
}

.rotation-buttons {
  display: flex;
  gap: 4px;
  margin-bottom: 6px;
}

.rotation-btn {
  flex: 1;
  padding: 6px 8px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  font-size: 10px;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.rotation-btn:hover {
  background: #2a2a2a;
  border-color: #444;
}

.rotation-btn.active {
  background: #ffcc00;
  color: #000;
  border-color: #ffcc00;
}

.rotation-icon {
  font-size: 14px;
  font-weight: bold;
}

.rotation-hint {
  font-size: 9px;
  color: #888;
  font-style: italic;
}

/* 旋转角度控制 */
.rotation-angle-control {
  text-align: center;
}

.rotation-angle-display {
  font-size: 12px;
  color: #00ff00;
  margin-bottom: 8px;
  font-family: 'Courier New', monospace;
}

.rotation-angle-buttons {
  display: flex;
  gap: 3px;
  margin-bottom: 6px;
}

.rotation-angle-btn {
  flex: 1;
  padding: 6px 6px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  font-size: 9px;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.rotation-angle-btn:hover {
  background: #2a2a2a;
  border-color: #444;
}

.rotation-angle-btn:nth-child(2) {
  background: #1f1f1f;
  border-color: #3a3a3a;
  color: #ffcc00;
}

/* 隐藏滚动条但保持滚动功能 */
.control::-webkit-scrollbar {
  display: none;
}

.control {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

/* 响应式设计 */
@media (max-width: 768px) {
  .control {
    width: 220px !important;
    max-width: 90vw;
    right: 10px;
    top: 10px;
  }

  .current-time {
    font-size: 14px;
  }

  .manual-controls {
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 2px;
  }

  .zoom-presets {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

@media (max-width: 480px) {
  .control {
    width: 200px !important;
    right: 5px;
    top: 5px;
  }

  .control-header {
    padding: 8px 10px;
  }

  .module-header {
    padding: 6px 10px;
  }

  .current-time {
    font-size: 12px;
  }

  .control-btn {
    padding: 4px 6px;
    font-size: 10px;
  }

  .header-btn {
    width: 20px;
    height: 20px;
    font-size: 10px;
  }
}
</style>