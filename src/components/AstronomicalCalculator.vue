<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import * as Astronomy from 'astronomy-engine'
import type { AstroTime } from 'astronomy-engine'

// 当前时间和位置
const currentTime = ref(new Date())
const observer = new Astronomy.Observer(
  39.9042,  // latitude: 北京纬度
  116.4074, // longitude: 北京经度
  43.5      // height: 北京海拔（米）
)

// 天文数据接口
interface SunData {
  rightAscension: number
  declination: number
  azimuth: number
  altitude: number
  sunrise: AstroTime | null
  sunset: AstroTime | null
  distance: number
  eclipticLongitude: number
}

interface MoonData {
  rightAscension: number
  declination: number
  azimuth: number
  altitude: number
  phase: number
  phaseName: string
  distance: number
  eclipticLongitude: number
}

interface PlanetData {
  name: string
  rightAscension: number
  declination: number
  eclipticLongitude: number
  distance: number
  magnitude: number
}

const sunData = ref<SunData | null>(null)
const moonData = ref<MoonData | null>(null)
const planetsData = ref<PlanetData[]>([])
const currentSeason = ref<string>('春分')
const lunarPhase = ref<string>('')

// 更新间隔（毫秒）
const UPDATE_INTERVAL = 60000 // 每分钟更新一次

// 计算太阳数据
const calculateSunData = () => {
  const date = Astronomy.MakeTime(currentTime.value)

  // 计算太阳位置向量
  const sunVector = Astronomy.GeoVector(Astronomy.Body.Sun, date, false)

  // 计算太阳赤道坐标
  const eq = Astronomy.Equator(Astronomy.Body.Sun, date, observer, false, false)

  // 计算太阳地平坐标
  const horizon = Astronomy.Horizon(date, observer, eq.ra, eq.dec)

  // 计算日出日落
  const sunrise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, date, 0.0)
  const sunset = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, date, 0.0)

  // 计算黄经
  const ecliptic = Astronomy.Ecliptic(sunVector)

  sunData.value = {
    rightAscension: eq.ra,    // 赤经
    declination: eq.dec,      // 赤纬
    azimuth: horizon.azimuth, // 方位角
    altitude: horizon.altitude, // 高度角
    sunrise: sunrise,
    sunset: sunset,
    distance: sunVector.Length(),
    eclipticLongitude: ecliptic.elon // 黄经
  }
}

// 计算月球数据
const calculateMoonData = () => {
  const date = Astronomy.MakeTime(currentTime.value)

  // 计算月球位置向量
  const moonVector = Astronomy.GeoMoon(date)

  // 计算月球赤道坐标
  const eq = Astronomy.Equator(Astronomy.Body.Moon, date, observer, false, false)

  // 计算月球地平坐标
  const horizon = Astronomy.Horizon(date, observer, eq.ra, eq.dec)

  // 计算月相 (返回0-360度)
  const moonPhaseAngle = Astronomy.MoonPhase(date)
  // 将角度转换为月相百分比 (0-100%)
  const phasePercent = Math.round((1 + Math.cos(moonPhaseAngle * Math.PI / 180)) * 50)

  // 计算黄经
  const ecliptic = Astronomy.Ecliptic(moonVector)

  moonData.value = {
    rightAscension: eq.ra,
    declination: eq.dec,
    azimuth: horizon.azimuth,
    altitude: horizon.altitude,
    phase: phasePercent,
    phaseName: getMoonPhaseName(phasePercent),
    distance: moonVector.Length(),
    eclipticLongitude: ecliptic.elon
  }
}

// 计算行星数据
const calculatePlanetsData = () => {
  const date = Astronomy.MakeTime(currentTime.value)
  const planets = [
    { name: 'mercury', body: Astronomy.Body.Mercury, chineseName: '水星' },
    { name: 'venus', body: Astronomy.Body.Venus, chineseName: '金星' },
    { name: 'mars', body: Astronomy.Body.Mars, chineseName: '火星' },
    { name: 'jupiter', body: Astronomy.Body.Jupiter, chineseName: '木星' },
    { name: 'saturn', body: Astronomy.Body.Saturn, chineseName: '土星' }
  ]

  planetsData.value = planets.map(planet => {
    // 计算行星位置向量
    const planetVector = Astronomy.GeoVector(planet.body, date, false)

    // 计算行星赤道坐标
    const eq = Astronomy.Equator(planet.body, date, observer, false, false)

    // 计算黄经
    const ecliptic = Astronomy.Ecliptic(planetVector)

    // 计算亮度
    const illumination = Astronomy.Illumination(planet.body, date)

    return {
      name: planet.chineseName,
      rightAscension: eq.ra,
      declination: eq.dec,
      eclipticLongitude: ecliptic.elon,
      distance: planetVector.Length(),
      magnitude: illumination.mag
    }
  })
}

// 计算当前节气
const calculateSeason = () => {
  const date = Astronomy.MakeTime(currentTime.value)
  const sunVector = Astronomy.GeoVector(Astronomy.Body.Sun, date, false)
  const sunLongitude = Astronomy.Ecliptic(sunVector).elon

  // 二十四节气对应黄经
  const solarTerms = [
    { name: '春分', longitude: 0 },
    { name: '清明', longitude: 15 },
    { name: '谷雨', longitude: 30 },
    { name: '立夏', longitude: 45 },
    { name: '小满', longitude: 60 },
    { name: '芒种', longitude: 75 },
    { name: '夏至', longitude: 90 },
    { name: '小暑', longitude: 105 },
    { name: '大暑', longitude: 120 },
    { name: '立秋', longitude: 135 },
    { name: '处暑', longitude: 150 },
    { name: '白露', longitude: 165 },
    { name: '秋分', longitude: 180 },
    { name: '寒露', longitude: 195 },
    { name: '霜降', longitude: 210 },
    { name: '立冬', longitude: 225 },
    { name: '小雪', longitude: 240 },
    { name: '大雪', longitude: 255 },
    { name: '冬至', longitude: 270 },
    { name: '小寒', longitude: 285 },
    { name: '大寒', longitude: 300 },
    { name: '立春', longitude: 315 },
    { name: '雨水', longitude: 330 },
    { name: '惊蛰', longitude: 345 }
  ]

  // 找到当前最接近的节气
  if (solarTerms.length === 0) {
    currentSeason.value = '春分'
    return
  }

  let closestTerm = solarTerms[0]!
  let minDiff = Math.abs(sunLongitude - closestTerm.longitude)

  for (const term of solarTerms) {
    let diff = Math.abs(sunLongitude - term.longitude)
    if (diff > 180) diff = 360 - diff // 处理跨越0度的情况
    if (diff < minDiff) {
      minDiff = diff
      closestTerm = term
    }
  }

  currentSeason.value = closestTerm.name
}

// 获取月相名称
const getMoonPhaseName = (phase: number): string => {
  if (phase < 10) return '新月'
  if (phase < 35) return '蛾眉月'
  if (phase < 65) return '上弦月'
  if (phase < 85) return '盈凸月'
  if (phase < 95) return '满月'
  if (phase < 115) return '亏凸月'
  if (phase < 145) return '下弦月'
  if (phase < 175) return '残月'
  return '新月'
}

// 更新所有天文数据
const updateAstronomicalData = () => {
  try {
    currentTime.value = new Date()
    calculateSunData()
    calculateMoonData()
    calculatePlanetsData()
    calculateSeason()
  } catch (error) {
    console.error('天文计算错误:', error)
    // 如果计算失败，设置默认值
    if (!sunData.value) {
      sunData.value = {
        rightAscension: 0,
        declination: 0,
        azimuth: 0,
        altitude: 0,
        sunrise: null,
        sunset: null,
        distance: 1,
        eclipticLongitude: 0
      }
    }
    if (!moonData.value) {
      moonData.value = {
        rightAscension: 0,
        declination: 0,
        azimuth: 0,
        altitude: 0,
        phase: 50,
        phaseName: '满月',
        distance: 0.00257,
        eclipticLongitude: 0
      }
    }
    if (!planetsData.value || planetsData.value.length === 0) {
      planetsData.value = []
    }
    if (!currentSeason.value) {
      currentSeason.value = '春分'
    }
  }
}

// 格式化时间
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 计算天体对应的二十八星宿
const getConstellationFromLongitude = (longitude: number): string => {
  const constellations = [
    '角', '亢', '氐', '房', '心', '尾', '箕',  // 东方青龙
    '斗', '牛', '女', '虚', '危', '室', '壁',  // 北方玄武
    '奎', '娄', '胃', '昴', '毕', '觜', '参',  // 西方白虎
    '井', '鬼', '柳', '星', '张', '翼', '轸'   // 南方朱雀
  ]

  // 每个星宿占据12.86度
  const index = Math.floor(longitude / 12.86) % 28
  return constellations[index]!
}

let updateInterval: number

onMounted(() => {
  updateAstronomicalData()
  updateInterval = setInterval(updateAstronomicalData, UPDATE_INTERVAL)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})

// 暴露给模板的数据
const sunConstellation = computed(() =>
  sunData.value ? getConstellationFromLongitude(sunData.value.eclipticLongitude) : ''
)

const moonConstellation = computed(() =>
  moonData.value ? getConstellationFromLongitude(moonData.value.eclipticLongitude) : ''
)
</script>

<template>
  <div class="astronomical-calculator">
    <div class="current-time">
      <h3>🌍 当前时间</h3>
      <p>{{ formatDate(currentTime) }} {{ formatTime(currentTime) }}</p>
      <p class="season">🌸 当前节气: {{ currentSeason }}</p>
    </div>

    <div class="celestial-bodies" v-if="sunData && moonData">
      <!-- 太阳数据 -->
      <div class="sun-data">
        <h4>☀️ 太阳</h4>
        <p>黄经: {{ Math.round(sunData.eclipticLongitude) }}°</p>
        <p>所在星宿: {{ sunConstellation }}</p>
        <p>距离: {{ sunData.distance.toFixed(3) }} AU</p>
        <p v-if="sunData.sunrise">日出: {{ sunData.sunrise.date.toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'}) }}</p>
        <p v-if="sunData.sunset">日落: {{ sunData.sunset.date.toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'}) }}</p>
      </div>

      <!-- 月球数据 -->
      <div class="moon-data">
        <h4>🌙 月亮</h4>
        <p>月相: {{ moonData.phaseName }} ({{ moonData.phase }}%)</p>
        <p>黄经: {{ Math.round(moonData.eclipticLongitude) }}°</p>
        <p>所在星宿: {{ moonConstellation }}</p>
        <p>距离: {{ moonData.distance.toFixed(3) }} AU</p>
      </div>
    </div>

    <!-- 行星数据 -->
    <div class="planets-data" v-if="planetsData">
      <h4>🪐 五大行星</h4>
      <div class="planet" v-for="planet in planetsData" :key="planet.name">
        <span class="planet-name">{{ planet.name }}</span>
        <span>黄经: {{ Math.round(planet.eclipticLongitude) }}°</span>
        <span>星宿: {{ getConstellationFromLongitude(planet.eclipticLongitude) }}</span>
        <span>视星等: {{ planet.magnitude.toFixed(2) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.astronomical-calculator {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid #333;
  border-radius: 8px;
  padding: 15px;
  color: white;
  font-size: 12px;
  max-width: 300px;
  backdrop-filter: blur(10px);
}

.current-time {
  margin-bottom: 15px;
  border-bottom: 1px solid #444;
  padding-bottom: 10px;
}

.current-time h3 {
  margin: 0 0 5px 0;
  color: #4ECDC4;
}

.season {
  color: #FFEAA7;
  font-weight: bold;
}

.celestial-bodies {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.sun-data, .moon-data {
  flex: 1;
}

.sun-data h4, .moon-data h4 {
  margin: 0 0 5px 0;
  color: #FFD700;
}

.moon-data h4 {
  color: #87CEEB;
}

.sun-data p, .moon-data p {
  margin: 2px 0;
  font-size: 11px;
}

.planets-data h4 {
  margin: 0 0 8px 0;
  color: #98FB98;
}

.planet {
  display: flex;
  justify-content: space-between;
  margin: 3px 0;
  font-size: 11px;
  padding: 2px 0;
  border-bottom: 1px solid #333;
}

.planet-name {
  font-weight: bold;
  color: #DDA0DD;
}

.planet:last-child {
  border-bottom: none;
}
</style>