import * as Astronomy from 'astronomy-engine'
import { ref, readonly } from 'vue'

/**
 * 计算太阳时角，使用真实的天文计算
 * 基于天文引擎的精确计算，考虑地球自转和太阳位置
 *
 * @param date 日期时间，默认为当前时间
 * @param observer 观测者位置，默认为北京
 * @returns 太阳角度 (0-360度)
 */
export function calculateSolarHourAngle(date: Date = new Date(), observer?: Astronomy.Observer): number {
  try {
    // 默认观测者位置（北京）
    const defaultObserver = new Astronomy.Observer(39.9042, 116.4074, 0)
    const obs = observer || defaultObserver

    // 创建天文时间对象
    const astroTime = new Astronomy.AstroTime(date)

    // 计算太阳的赤道坐标
    const sunEquator = Astronomy.Equator(Astronomy.Body.Sun, astroTime, obs, true, false)

    // 计算太阳的地平坐标
    const sunHorizon = Astronomy.Horizon(astroTime, obs, sunEquator.ra, sunEquator.dec, 'normal')

    // 将方位角转换为0-360度范围
    // 方位角：0°=正北，90°=正东，180°=正南，270°=正西
    // 我们需要调整为：0°=正东（日出方向），顺时针增加
    let azimuth = sunHorizon.azimuth * Astronomy.RAD2DEG
    if (azimuth < 0) azimuth += 360

    // 调整方位角：将正北(0°)映射到正东(90°)，保持顺时针方向
    const adjustedAzimuth = (azimuth + 90) % 360

    // 计算时角（基于太阳的高度角）
    // 时角 = 当地恒星时 - 太阳赤经
    const localSiderealTime = Astronomy.SiderealTime(astroTime)
    const hourAngleRad = localSiderealTime - sunEquator.ra
    let hourAngleDeg = hourAngleRad * Astronomy.RAD2DEG

    // 将时角标准化到0-360度范围
    hourAngleDeg = hourAngleDeg % 360
    if (hourAngleDeg < 0) hourAngleDeg += 360

    return hourAngleDeg
  } catch (error) {
    console.error('计算太阳时角失败:', error)
    return 0
  }
}

/**
 * 根据当前时间计算太阳在圆形轨道上的角度
 * 使用真实的天文计算，基于太阳的实际位置
 *
 * @param baseAngle 基准角度，用于校准
 * @param date 日期时间
 * @param observer 观测者位置
 * @returns 太阳在轨道上的角度 (0-360度)
 */
export function calculateSolarOrbitAngle(baseAngle: number = 0, date: Date = new Date(), observer?: Astronomy.Observer): number {
  // 获取太阳时角
  const hourAngle = calculateSolarHourAngle(date, observer)

  // 将时角映射到轨道角度
  const orbitAngle = (baseAngle + hourAngle) % 360

  return orbitAngle
}

/**
 * 创建一个响应式的太阳角度计算器
 * 用于Vue组件中实时更新太阳位置
 *
 * @param baseAngle 基准角度
 * @param updateInterval 更新间隔（毫秒）
 * @param observer 观测者位置
 */
export function createSolarAngleCalculator(baseAngle: number = 0, updateInterval: number = 1000, observer?: Astronomy.Observer) {
  let intervalId: ReturnType<typeof setInterval> | null = null
  const currentAngle = ref(baseAngle)

  const start = () => {
    if (intervalId) return

    intervalId = setInterval(() => {
      currentAngle.value = calculateSolarOrbitAngle(baseAngle, new Date(), observer)
    }, updateInterval)
  }

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  // 立即计算一次
  currentAngle.value = calculateSolarOrbitAngle(baseAngle, new Date(), observer)

  return {
    currentAngle: readonly(currentAngle),
    start,
    stop
  }
}

/**
 * 计算月亮时角，使用真实的天文计算
 * 基于天文引擎的精确计算，考虑月球轨道和地球自转
 *
 * @param date 日期时间，默认为当前时间
 * @param observer 观测者位置，默认为北京
 * @returns 月亮角度 (0-360度)
 */
export function calculateLunarHourAngle(date: Date = new Date(), observer?: Astronomy.Observer): number {
  try {
    // 默认观测者位置（北京）
    const defaultObserver = new Astronomy.Observer(39.9042, 116.4074, 0)
    const obs = observer || defaultObserver

    // 创建天文时间对象
    const astroTime = new Astronomy.AstroTime(date)

    // 计算月球的赤道坐标
    const moonEquator = Astronomy.Equator(Astronomy.Body.Moon, astroTime, obs, true, false)

    // 计算月球的地平坐标
    const moonHorizon = Astronomy.Horizon(astroTime, obs, moonEquator.ra, moonEquator.dec, 'normal')

    // 将方位角转换为0-360度范围
    // 方位角：0°=正北，90°=正东，180°=正南，270°=正西
    let azimuth = moonHorizon.azimuth * Astronomy.RAD2DEG
    if (azimuth < 0) azimuth += 360

    // 调整方位角：将正北(0°)映射到正东(90°)，保持顺时针方向
    const adjustedAzimuth = (azimuth + 90) % 360

    // 计算时角（基于月球的位置）
    // 时角 = 当地恒星时 - 月球赤经
    const localSiderealTime = Astronomy.SiderealTime(astroTime)
    const hourAngleRad = localSiderealTime - moonEquator.ra
    let hourAngleDeg = hourAngleRad * Astronomy.RAD2DEG

    // 将时角标准化到0-360度范围
    hourAngleDeg = hourAngleDeg % 360
    if (hourAngleDeg < 0) hourAngleDeg += 360

    return hourAngleDeg
  } catch (error) {
    console.error('计算月亮时角失败:', error)
    return 180 // 默认返回东方位置
  }
}

/**
 * 根据当前时间计算月亮在圆形轨道上的角度
 * 使用真实的天文计算，基于月球的实际位置
 *
 * @param baseAngle 基准角度，用于校准
 * @param date 日期时间
 * @param observer 观测者位置
 * @returns 月亮在轨道上的角度 (0-360度)
 */
export function calculateLunarOrbitAngle(baseAngle: number = 0, date: Date = new Date(), observer?: Astronomy.Observer): number {
  // 获取月亮时角
  const hourAngle = calculateLunarHourAngle(date, observer)

  // 将时角映射到轨道角度
  const orbitAngle = (baseAngle + hourAngle) % 360

  return orbitAngle
}

/**
 * 创建一个响应式的月亮角度计算器
 * 用于Vue组件中实时更新月亮位置
 *
 * @param baseAngle 基准角度
 * @param updateInterval 更新间隔（毫秒）
 * @param observer 观测者位置
 */
export function createLunarAngleCalculator(baseAngle: number = 0, updateInterval: number = 1000, observer?: Astronomy.Observer) {
  let intervalId: ReturnType<typeof setInterval> | null = null
  const currentAngle = ref(baseAngle)

  const start = () => {
    if (intervalId) return

    intervalId = setInterval(() => {
      currentAngle.value = calculateLunarOrbitAngle(baseAngle, new Date(), observer)
    }, updateInterval)
  }

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  // 立即计算一次
  currentAngle.value = calculateLunarOrbitAngle(baseAngle, new Date(), observer)

  return {
    currentAngle: readonly(currentAngle),
    start,
    stop
  }
}

// ========== 天文数据辅助函数 ==========

/**
 * 获取太阳的详细信息
 * @param date 日期时间
 * @param observer 观测者位置
 * @returns 太阳的详细天文数据
 */
export function getSolarInfo(date: Date = new Date(), observer?: Astronomy.Observer) {
  const defaultObserver = new Astronomy.Observer(39.9042, 116.4074, 0)
  const obs = observer || defaultObserver
  const astroTime = new Astronomy.AstroTime(date)

  // 计算太阳位置
  const sunEquator = Astronomy.Equator(Astronomy.Body.Sun, astroTime, obs, true, false)
  const sunHorizon = Astronomy.Horizon(astroTime, obs, sunEquator.ra, sunEquator.dec, 'normal')
  const sunVector = Astronomy.GeoVector(Astronomy.Body.Sun, astroTime, true)

  // 计算日出日落
  const sunrise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, obs, +1, astroTime, 1)
  const sunset = Astronomy.SearchRiseSet(Astronomy.Body.Sun, obs, -1, astroTime, 1)

  return {
    altitude: sunHorizon.altitude * Astronomy.RAD2DEG,        // 高度角
    azimuth: sunHorizon.azimuth * Astronomy.RAD2DEG,          // 方位角
    rightAscension: sunEquator.ra * Astronomy.RAD2DEG,         // 赤经
    declination: sunEquator.dec * Astronomy.RAD2DEG,          // 赤纬
    distance: sunVector.Length(),                              // 距离（天文单位）
    hourAngle: calculateSolarHourAngle(date, observer),        // 时角
    orbitAngle: calculateSolarOrbitAngle(0, date, observer),   // 轨道角度
    sunrise: sunrise || null,               // 日出时间
    sunset: sunset || null,                  // 日落时间
    illumination: 1.0                                         // 太阳总是满圆照亮
  }
}

/**
 * 获取月亮的详细信息
 * @param date 日期时间
 * @param observer 观测者位置
 * @returns 月亮的详细天文数据
 */
export function getLunarInfo(date: Date = new Date(), observer?: Astronomy.Observer) {
  const defaultObserver = new Astronomy.Observer(39.9042, 116.4074, 0)
  const obs = observer || defaultObserver
  const astroTime = new Astronomy.AstroTime(date)

  // 计算月亮位置
  const moonEquator = Astronomy.Equator(Astronomy.Body.Moon, astroTime, obs, true, false)
  const moonHorizon = Astronomy.Horizon(astroTime, obs, moonEquator.ra, moonEquator.dec, 'normal')
  const moonVector = Astronomy.GeoVector(Astronomy.Body.Moon, astroTime, true)

  // 计算月出月落
  const moonrise = Astronomy.SearchRiseSet(Astronomy.Body.Moon, obs, +1, astroTime, 1)
  const moonset = Astronomy.SearchRiseSet(Astronomy.Body.Moon, obs, -1, astroTime, 1)

  return {
    altitude: moonHorizon.altitude * Astronomy.RAD2DEG,        // 高度角
    azimuth: moonHorizon.azimuth * Astronomy.RAD2DEG,          // 方位角
    rightAscension: moonEquator.ra * Astronomy.RAD2DEG,         // 赤经
    declination: moonEquator.dec * Astronomy.RAD2DEG,          // 赤纬
    distance: moonVector.Length(),                              // 距离（天文单位）
    hourAngle: calculateLunarHourAngle(date, observer),        // 时角
    orbitAngle: calculateLunarOrbitAngle(0, date, observer),   // 轨道角度
    moonrise: moonrise || null,            // 月出时间
    moonset: moonset || null,               // 月落时间
    phase: 0,                                                 // 月相 (0-1) - 暂时设为默认值
    illuminatedFraction: 0                                   // 照亮比例 (0-1) - 暂时设为默认值
  }
}

/**
 * 获取月相描述
 * @param phase 月相值 (0-1)
 * @returns 月相的中文名称
 */
export function getMoonPhaseName(phase: number): string {
  if (phase < 0.03 || phase > 0.97) return '新月'
  if (phase < 0.22) return '娥眉月'
  if (phase < 0.28) return '上弦月'
  if (phase < 0.47) return '盈凸月'
  if (phase < 0.53) return '满月'
  if (phase < 0.72) return '亏凸月'
  if (phase < 0.78) return '下弦月'
  return '残月'
}

/**
 * 获取月相对应的emoji
 * @param phase 月相值 (0-1)
 * @returns 月相emoji
 */
export function getMoonPhaseEmoji(phase: number): string {
  if (phase < 0.03 || phase > 0.97) return '🌑'
  if (phase < 0.22) return '🌒'
  if (phase < 0.28) return '🌓'
  if (phase < 0.47) return '🌔'
  if (phase < 0.53) return '🌕'
  if (phase < 0.72) return '🌖'
  if (phase < 0.78) return '🌗'
  return '🌘'
}

/**
 * 创建观测者对象
 * @param latitude 纬度（度）
 * @param longitude 经度（度）
 * @param elevation 海拔高度（米）
 * @returns 观测者对象
 */
export function createObserver(latitude: number, longitude: number, elevation: number = 0): Astronomy.Observer {
  return new Astronomy.Observer(latitude, longitude, elevation)
}

// 常用观测者位置
export const OBSERVERS = {
  BEIJING: createObserver(39.9042, 116.4074, 0),
  SHANGHAI: createObserver(31.2304, 121.4737, 0),
  GUANGZHOU: createObserver(23.1291, 113.2644, 0),
  SHENZHEN: createObserver(22.5431, 114.0579, 0),
  HANGZHOU: createObserver(30.2741, 120.1551, 0),
  NANJING: createObserver(32.0603, 118.7969, 0),
  CHENGDU: createObserver(30.5728, 104.0668, 0),
  XIAN: createObserver(34.3416, 108.9398, 0),
  WUHAN: createObserver(30.5928, 114.3055, 0),
  CHONGQING: createObserver(29.5630, 106.5516, 0)
} as const