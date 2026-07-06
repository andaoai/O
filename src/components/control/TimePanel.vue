<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getChineseCalendarInfo, getSolarTermDescription } from '@/utils/chineseCalendar'
import {
  formatEraDate,
  getDynastyInfo,
  getUniversalGanzhi
} from '@/utils/eraCalendar'
import { useTimeController } from '@/composables/useTimeController'
import { useTimeShortcuts } from '@/composables/useTimeShortcuts'
import PanelSection from './PanelSection.vue'
import ControlButton from './ControlButton.vue'

/**
 * 时间控制面板：信息 / 播放 / 步进 / 输入选择
 *
 * ════════════════════════════════════════════════════════════════
 *  受控组件：time 由父组件（Control → View）拥有，通过 v-model 双向绑定。
 *  内部不再有 currentTime 副本 —— 修复旧 Control.vue "v-model 断链" bug。
 *
 *  子模块（4 个折叠区）：
 *    · time       时间信息（公历 / 朝代 / 干支 / 农历节气）
 *    · playback   播放控制（播放/暂停/回到当下 + 速度）
 *    · step       时间步进（±秒/分/时/日/月/年）
 *    · input      日期时间输入
 * ════════════════════════════════════════════════════════════════
 */

interface Props {
  time: Date
  /** 折叠状态由外部（useControlPanel）统一管理 */
  collapsed: Record<'time' | 'playback' | 'step' | 'input', boolean>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:time': [value: Date]
  'user-time-change': [value: Date]
  'toggle-section': [key: 'time' | 'playback' | 'step' | 'input']
}>()

// ─── 受控时间 ref：内部包装以便直接被 useTimeController 修改 ───────
// 用 computed { get/set } 桥接 props.time ↔ emit('update:time')
const timeRef = computed<Date>({
  get: () => props.time,
  set: (v) => emit('update:time', v)
})

const notifyUserChange = () => emit('user-time-change', timeRef.value)

const {
  isPlaying,
  playSpeed,
  togglePlayPause,
  resetToNow,
  updatePlaySpeed,
  stepTime,
  stepMonth,
  stepYear,
  applyTime
} = useTimeController(timeRef, { onUserChange: notifyUserChange })

// ─── 时间快捷键 ────────────────────────────────────────────────
useTimeShortcuts({
  togglePlayPause,
  resetToNow,
  stepYear,
  stepMonth,
  stepTime
})

// ─── 时间信息派生 ──────────────────────────────────────────────
const chineseCalendar = computed(() => getChineseCalendarInfo(props.time))
const dynastyInfo = computed(() => getDynastyInfo(props.time))
const universalGanzhi = computed(() => getUniversalGanzhi(props.time))
const eraDate = computed(() => formatEraDate(props.time))

// ─── 日期/时间输入框：本地字符串状态，随 props.time 更新 ────────
const dateInput = ref('')
const timeInput = ref('')

const syncInputs = (d: Date) => {
  const jsYear = d.getFullYear()
  const displayYear = jsYear > 0 ? jsYear : jsYear - 1
  const pad = (n: number) => String(n).padStart(2, '0')
  const yStr = displayYear < 0 ? '-' + pad(Math.abs(displayYear)) : String(displayYear).padStart(4, '0')
  dateInput.value = `${yStr}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  timeInput.value = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

watch(() => props.time, syncInputs, { immediate: true })

const applyInputTime = () => {
  if (!dateInput.value || !timeInput.value) return
  const dateParts = dateInput.value.split('-').map(Number)
  const timeParts = timeInput.value.split(':').map(Number)
  // 支持 "-221-05-01"：分离前导负号
  let inputYear: number
  if (dateInput.value.startsWith('-')) {
    // 形如 "-221-05-01" → dateParts = [NaN, 221, ..., ..] 取巧不可靠，改手动切
    const m = dateInput.value.match(/^(-?\d+)-(\d+)-(\d+)$/)
    if (!m) return
    inputYear = Number(m[1])
    dateParts[0] = inputYear
    dateParts[1] = Number(m[2])
    dateParts[2] = Number(m[3])
  } else {
    if (dateParts.length !== 3 || dateParts.some(isNaN)) return
    inputYear = dateParts[0]!
  }
  if (timeParts.length !== 3 || timeParts.some(isNaN)) return

  const jsYear = inputYear > 0 ? inputYear : inputYear + 1
  const newTime = new Date()
  newTime.setFullYear(jsYear, dateParts[1]! - 1, dateParts[2]!)
  newTime.setHours(timeParts[0]!, timeParts[1]!, timeParts[2]!, 0)

  if (!isNaN(newTime.getTime())) applyTime(newTime)
}
</script>

<template>
  <!-- ═══════ 时间信息 ═══════ -->
  <PanelSection
    title="时间信息"
    :collapsed="collapsed.time"
    @toggle="emit('toggle-section', 'time')"
  >
    <div class="time-display">
      <div class="era-date">{{ eraDate }}</div>

      <div v-if="dynastyInfo" class="dynasty-display">
        <span class="dynasty-name" :style="{ color: dynastyInfo.color }">{{ dynastyInfo.name }}</span>
        <span class="dynasty-range">（{{ dynastyInfo.rangeText }}）</span>
      </div>

      <div class="ganzhi-display">
        <span class="gz-year" :title="universalGanzhi.year.element + '·' + universalGanzhi.year.animal">
          {{ universalGanzhi.year.full }}年
        </span>
        <span class="gz-month">{{ universalGanzhi.month.full }}月</span>
        <span class="gz-day">{{ universalGanzhi.day.full }}日</span>
        <span class="gz-hour">{{ universalGanzhi.hour.full }}时</span>
      </div>

      <div v-if="!universalGanzhi.isApproximate" class="lunar-info">
        <div class="lunar-date">{{ chineseCalendar.lunarDate }}</div>
        <div v-if="chineseCalendar.solarTerm" class="solar-term-text">
          {{ getSolarTermDescription(chineseCalendar.solarTerm) }}
        </div>
      </div>
      <div v-else class="lunar-unavailable">农历 / 节气：历不可考</div>
    </div>
  </PanelSection>

  <!-- ═══════ 播放控制 ═══════ -->
  <PanelSection
    title="播放控制"
    :collapsed="collapsed.playback"
    @toggle="emit('toggle-section', 'playback')"
  >
    <div class="row row--center">
      <ControlButton
        size="md"
        :active="isPlaying"
        key-hint="空格"
        title="空格键"
        @click="togglePlayPause"
      >
        {{ isPlaying ? '⏸ 暂停' : '▶ 播放' }}
      </ControlButton>
      <ControlButton size="md" key-hint="R" title="R 键" @click="resetToNow">
        ⟲ 现在
      </ControlButton>
    </div>
    <div class="speed-select">
      <select v-model="playSpeed" @change="updatePlaySpeed()">
        <option :value="1">1x</option>
        <option :value="60">1分钟/秒</option>
        <option :value="3600">1小时/秒</option>
        <option :value="86400">1天/秒</option>
        <option :value="1296000">15天/秒</option>
        <option :value="2592000">1个月/秒</option>
      </select>
    </div>
  </PanelSection>

  <!-- ═══════ 时间步进 ═══════ -->
  <PanelSection
    title="时间步进"
    :collapsed="collapsed.step"
    @toggle="emit('toggle-section', 'step')"
  >
    <div class="step-grid">
      <ControlButton variant="accent" key-hint="⇧Y" title="Shift+Y" @click="stepYear(-1)">-1年</ControlButton>
      <ControlButton variant="negative" key-hint="⇧M" title="Shift+M" @click="stepMonth(-1)">-1月</ControlButton>
      <ControlButton key-hint="⇧D" title="Shift+D" @click="stepTime(-86400)">-1天</ControlButton>
      <ControlButton key-hint="⇧H" title="Shift+H" @click="stepTime(-3600)">-1时</ControlButton>
      <ControlButton variant="negative" key-hint="⇧N" title="Shift+N" @click="stepTime(-60)">-1分</ControlButton>
      <ControlButton variant="negative" key-hint="⇧S" title="Shift+S" @click="stepTime(-1)">-1秒</ControlButton>
      <ControlButton key-hint="S" title="S 键" @click="stepTime(1)">+1秒</ControlButton>
      <ControlButton key-hint="N" title="N 键" @click="stepTime(60)">+1分</ControlButton>
      <ControlButton key-hint="H" title="H 键" @click="stepTime(3600)">+1时</ControlButton>
      <ControlButton key-hint="D" title="D 键" @click="stepTime(86400)">+1天</ControlButton>
      <ControlButton key-hint="M" title="M 键" @click="stepMonth(1)">+1月</ControlButton>
      <ControlButton variant="accent" key-hint="Y" title="Y 键" @click="stepYear(1)">+1年</ControlButton>
    </div>
  </PanelSection>

  <!-- ═══════ 时间选择 ═══════ -->
  <PanelSection
    title="时间选择"
    :collapsed="collapsed.input"
    @toggle="emit('toggle-section', 'input')"
  >
    <div class="time-inputs">
      <div class="input-group">
        <label>日期</label>
        <input
          v-model="dateInput"
          type="text"
          placeholder="YYYY-MM-DD"
          class="time-input"
          @change="applyInputTime"
          @blur="applyInputTime"
        />
      </div>
      <div class="input-group">
        <label>时间</label>
        <input
          v-model="timeInput"
          type="text"
          placeholder="HH:MM:SS"
          class="time-input"
          @change="applyInputTime"
          @blur="applyInputTime"
        />
      </div>
    </div>
  </PanelSection>

  <!-- 顶部折叠态时用来展示的短日期串（Control 直接读，通过 defineExpose 暴露） -->
</template>

<style scoped>
.time-display {
  text-align: center;
}

.era-date {
  font-size: 13px;
  font-weight: bold;
  color: #00ff00;
  margin-bottom: 5px;
  font-family: 'Courier New', monospace;
  line-height: 1.4;
}

.dynasty-display {
  margin-bottom: 5px;
  font-size: 11px;
}
.dynasty-name {
  font-weight: bold;
  margin-right: 2px;
}
.dynasty-range {
  color: #888;
  font-size: 9px;
}

.ganzhi-display {
  margin-bottom: 5px;
  padding: 4px 0;
  border-top: 1px solid #222;
  border-bottom: 1px solid #222;
  font-size: 11px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
}
.gz-year { color: #ffcc00; font-weight: bold; cursor: help; }
.gz-month { color: #ccaa88; }
.gz-day { color: #99cc99; }
.gz-hour { color: #88bbcc; }

.lunar-info { margin-top: 3px; }
.lunar-date {
  font-size: 10px;
  color: #ff9900;
  font-weight: bold;
  margin-bottom: 2px;
}
.solar-term-text {
  font-size: 9px;
  color: #66ccff;
  font-weight: bold;
}
.lunar-unavailable {
  font-size: 9px;
  color: #666;
  font-style: italic;
}

/* 播放控制 */
.row {
  display: flex;
  gap: 6px;
}
.row--center {
  justify-content: center;
}

.speed-select {
  margin-top: 6px;
}
.speed-select select {
  width: 100%;
  padding: 4px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  color: #fff;
  font-size: 11px;
  font-family: inherit;
}

/* 步进网格 */
.step-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 3px;
}

/* 时间输入 */
.time-inputs {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.input-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.input-group label {
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
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}
.time-input:focus {
  outline: none;
  border-color: #ffcc00;
  background: #2a2a2a;
  box-shadow: 0 0 4px rgba(255, 204, 0, 0.3);
}
</style>
