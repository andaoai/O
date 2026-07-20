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
import SidebarSection from './SidebarSection.vue'
import SidebarButton from './SidebarButton.vue'

/**
 * 时间控制面板（Sidebar 版）
 *
 * 受控组件：time 由父组件（Sidebar → View）拥有，v-model 双向绑定。
 * 4 个折叠 section：信息 / 播放 / 步进 / 输入。
 */

interface Props {
  time: Date
  collapsed: Record<'time' | 'playback' | 'step' | 'input', boolean>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:time': [value: Date]
  'user-time-change': [value: Date]
  'toggle-section': [key: 'time' | 'playback' | 'step' | 'input']
}>()

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
  stepSui,
  applyTime
} = useTimeController(timeRef, { onUserChange: notifyUserChange })

useTimeShortcuts({ togglePlayPause, resetToNow, stepYear, stepMonth, stepTime, stepSui })

const chineseCalendar = computed(() => getChineseCalendarInfo(props.time))
const dynastyInfo = computed(() => getDynastyInfo(props.time))
const universalGanzhi = computed(() => getUniversalGanzhi(props.time))
const eraDate = computed(() => formatEraDate(props.time))

const dateInput = ref('')
const timeInput = ref('')

const syncInputs = (d: Date) => {
  const jsYear = d.getFullYear()
  const displayYear = jsYear > 0 ? jsYear : jsYear - 1
  const pad = (n: number) => String(n).padStart(2, '0')
  const yStr =
    displayYear < 0 ? '-' + pad(Math.abs(displayYear)) : String(displayYear).padStart(4, '0')
  dateInput.value = `${yStr}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  timeInput.value = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

watch(() => props.time, syncInputs, { immediate: true })

const applyInputTime = () => {
  if (!dateInput.value || !timeInput.value) return
  const dateParts = dateInput.value.split('-').map(Number)
  const timeParts = timeInput.value.split(':').map(Number)
  let inputYear: number
  if (dateInput.value.startsWith('-')) {
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
  <SidebarSection
    title="时间信息"
    :collapsed="collapsed.time"
    @toggle="emit('toggle-section', 'time')"
  >
    <div class="time-display">
      <div class="era-date">{{ eraDate }}</div>

      <div v-if="dynastyInfo" class="dynasty">
        <span class="dynasty__name" :style="{ color: dynastyInfo.color }">
          {{ dynastyInfo.name }}
        </span>
        <span class="dynasty__range">（{{ dynastyInfo.rangeText }}）</span>
      </div>

      <div class="ganzhi">
        <span
          class="gz-year"
          :title="universalGanzhi.year.element + '·' + universalGanzhi.year.animal"
        >
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
  </SidebarSection>

  <!-- ═══════ 播放控制 ═══════ -->
  <SidebarSection
    title="播放控制"
    :collapsed="collapsed.playback"
    @toggle="emit('toggle-section', 'playback')"
  >
    <div class="row-center">
      <SidebarButton
        size="md"
        :active="isPlaying"
        key-hint="空格"
        title="空格键"
        @click="togglePlayPause"
      >
        {{ isPlaying ? '⏸ 暂停' : '▶ 播放' }}
      </SidebarButton>
      <SidebarButton size="md" key-hint="R" title="R 键" @click="resetToNow">
        ⟲ 现在
      </SidebarButton>
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
  </SidebarSection>

  <!-- ═══════ 时间步进 ═══════ -->
  <SidebarSection
    title="时间步进"
    :collapsed="collapsed.step"
    @toggle="emit('toggle-section', 'step')"
  >
    <div class="sui-row">
      <SidebarButton variant="accent" key-hint="⇧G" title="Shift+G · 一岁 = 360 天" @click="stepSui(-1)">
        -1岁
      </SidebarButton>
      <SidebarButton variant="accent" key-hint="G" title="G 键 · 一岁 = 360 天" @click="stepSui(1)">
        +1岁
      </SidebarButton>
    </div>
    <div class="step-grid">
      <SidebarButton variant="accent" key-hint="⇧Y" title="Shift+Y" @click="stepYear(-1)">
        -1年
      </SidebarButton>
      <SidebarButton variant="negative" key-hint="⇧M" title="Shift+M" @click="stepMonth(-1)">
        -1月
      </SidebarButton>
      <SidebarButton key-hint="⇧D" title="Shift+D" @click="stepTime(-86400)">-1天</SidebarButton>
      <SidebarButton key-hint="⇧H" title="Shift+H" @click="stepTime(-3600)">-1时</SidebarButton>
      <SidebarButton variant="negative" key-hint="⇧N" title="Shift+N" @click="stepTime(-60)">
        -1分
      </SidebarButton>
      <SidebarButton variant="negative" key-hint="⇧S" title="Shift+S" @click="stepTime(-1)">
        -1秒
      </SidebarButton>
      <SidebarButton key-hint="S" title="S 键" @click="stepTime(1)">+1秒</SidebarButton>
      <SidebarButton key-hint="N" title="N 键" @click="stepTime(60)">+1分</SidebarButton>
      <SidebarButton key-hint="H" title="H 键" @click="stepTime(3600)">+1时</SidebarButton>
      <SidebarButton key-hint="D" title="D 键" @click="stepTime(86400)">+1天</SidebarButton>
      <SidebarButton key-hint="M" title="M 键" @click="stepMonth(1)">+1月</SidebarButton>
      <SidebarButton variant="accent" key-hint="Y" title="Y 键" @click="stepYear(1)">
        +1年
      </SidebarButton>
    </div>
  </SidebarSection>

  <!-- ═══════ 时间选择 ═══════ -->
  <SidebarSection
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
  </SidebarSection>
</template>

<style scoped>
.time-display {
  text-align: center;
}

.era-date {
  font-size: 13px;
  font-weight: bold;
  color: #00ff88;
  margin-bottom: 5px;
  font-family: 'Courier New', monospace;
  line-height: 1.4;
}

.dynasty {
  margin-bottom: 5px;
  font-size: 11px;
}
.dynasty__name {
  font-weight: bold;
  margin-right: 2px;
}
.dynasty__range {
  color: #888;
  font-size: 9px;
}

.ganzhi {
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

.row-center {
  display: flex;
  gap: 6px;
  justify-content: center;
}
.row-center > * {
  flex: 1;
}

.speed-select {
  margin-top: 6px;
}
.speed-select select {
  width: 100%;
  padding: 5px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  color: #fff;
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
}

.step-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 3px;
}

.sui-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px;
  margin-bottom: 6px;
}

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
  padding: 5px 8px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  color: #fff;
  font-size: 11px;
  font-family: 'Courier New', monospace;
  transition: border-color 0.15s, background 0.15s;
  box-sizing: border-box;
}
.time-input:focus {
  outline: none;
  border-color: #ffcc00;
  background: #2a2a2a;
}
</style>
