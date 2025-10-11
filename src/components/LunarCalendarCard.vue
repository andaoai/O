<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { SolarTime } from 'tyme4ts'

// 当前时间
const currentTime = ref(new Date())
const UPDATE_INTERVAL = 60000 // 每分钟更新一次

// 农历数据接口
interface LunarCalendarData {
  solarDate: string
  lunarDate: string
  zodiac: string
  stemBranchYear: string
  stemBranchMonth: string
  stemBranchDay: string
  stemBranchHour: string
}

const lunarData = ref<LunarCalendarData | null>(null)

// 获取干支年月日时
const getStemBranch = (date: Date) => {
  try {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()

    const solarTime = SolarTime.fromYmdHms(year, month, day, hour, minute, second)
    const sixtyCycleHour = solarTime.getSixtyCycleHour()
    const sixtyCycleDay = sixtyCycleHour.getSixtyCycleDay()
    const sixtyCycleMonth = sixtyCycleDay.getSixtyCycleMonth()
    const sixtyCycleYear = sixtyCycleMonth.getSixtyCycleYear()

    return {
      year: sixtyCycleYear.getSixtyCycle().getName(),
      month: sixtyCycleMonth.getSixtyCycle().getName(),
      day: sixtyCycleDay.getSixtyCycle().getName(),
      hour: sixtyCycleHour.getSixtyCycle().getName()
    }
  } catch {
    return {
      year: '甲子',
      month: '丙寅',
      day: '庚戌',
      hour: '丙子'
    }
  }
}

// 获取生肖
const getZodiac = (year: number): string => {
  const zodiacs = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
  const index = ((year - 4) % 12 + 12) % 12
  return zodiacs[index] || '龙'
}

// 格式化日期
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 计算数据
const calculateData = () => {
  try {
    currentTime.value = new Date()
    const now = currentTime.value

    // 简化的农历显示
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()

    const lunarMonths = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月']
    const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
                      '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                      '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']

    const stemBranch = getStemBranch(now)

    lunarData.value = {
      solarDate: formatDate(now),
      lunarDate: `${year}年 ${lunarMonths[month - 1] || '正月'}${lunarDays[day - 1] || '初一'}`,
      zodiac: getZodiac(year),
      stemBranchYear: stemBranch.year,
      stemBranchMonth: stemBranch.month,
      stemBranchDay: stemBranch.day,
      stemBranchHour: stemBranch.hour
    }
  } catch (error) {
    console.error('计算错误:', error)
    const defaultStemBranch = getStemBranch(currentTime.value)
    lunarData.value = {
      solarDate: formatDate(currentTime.value),
      lunarDate: '甲辰年 正月初一',
      zodiac: '龙',
      stemBranchYear: defaultStemBranch.year,
      stemBranchMonth: defaultStemBranch.month,
      stemBranchDay: defaultStemBranch.day,
      stemBranchHour: defaultStemBranch.hour
    }
  }
}

let updateInterval: ReturnType<typeof setInterval>

onMounted(() => {
  calculateData()
  updateInterval = setInterval(calculateData, UPDATE_INTERVAL)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<template>
  <div class="lunar-calendar-card">
    <div class="card-content" v-if="lunarData">
      <!-- 公历日期 -->
      <div class="date-section">
        <div class="solar-date">📅 {{ lunarData.solarDate }}</div>
      </div>

      <!-- 农历日期 -->
      <div class="date-section">
        <div class="lunar-date">🏮 {{ lunarData.lunarDate }}</div>
        <div class="zodiac">🐲 {{ lunarData.zodiac }}</div>
      </div>

      <!-- 干支年月日时 -->
      <div class="section">
        <div class="section-title">📜 干支</div>
        <div class="stem-branch-info">
          <div>年：{{ lunarData.stemBranchYear }}</div>
          <div>月：{{ lunarData.stemBranchMonth }}</div>
          <div>日：{{ lunarData.stemBranchDay }}</div>
          <div>时：{{ lunarData.stemBranchHour }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lunar-calendar-card {
  background: linear-gradient(135deg, rgba(20, 20, 40, 0.95), rgba(40, 20, 60, 0.95));
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  padding: 20px;
  color: white;
  font-size: 13px;
  max-width: 320px;
  backdrop-filter: blur(15px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: absolute;
  top: 420px;
  right: 20px;
  overflow: hidden;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.date-section {
  text-align: center;
  margin-bottom: 5px;
}

.solar-date {
  font-size: 14px;
  color: #98FB98;
  margin-bottom: 3px;
}

.lunar-date {
  font-size: 18px;
  font-weight: bold;
  color: #FFD700;
  margin-bottom: 3px;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
}

.zodiac {
  font-size: 12px;
  color: #FF69B4;
}

.section {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  padding: 8px 12px;
  border-left: 3px solid #FFD700;
}

.section-title {
  font-size: 11px;
  color: #DDA0DD;
  margin-bottom: 4px;
  font-weight: bold;
}

.stem-branch-info {
  font-size: 12px;
  color: #F0E68C;
  font-family: 'SimSun', '宋体', serif;
  line-height: 1.6;
}

.stem-branch-info div {
  margin: 2px 0;
  padding: 2px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stem-branch-info div::after {
  content: '';
  display: block;
  height: 1px;
  background: linear-gradient(90deg, rgba(255, 215, 0, 0.3), transparent);
  flex: 1;
  margin-left: 10px;
}
</style>