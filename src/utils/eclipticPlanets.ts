import * as Astronomy from 'astronomy-engine'
import { ref, readonly } from 'vue'

/**
 * 行星数据接口
 */
export interface PlanetData {
  name: string
  chineseName: string
  body: Astronomy.Body
  color: string
  magnitude: number
  // 黄道位置（0-360度）
  eclipticLongitude: number
  // 距离太阳的距离（AU）
  distanceFromSun: number
  // 黄道纬度（度）
  eclipticLatitude: number
}

/**
 * 获取行星的黄道位置
 * 使用astronomy-engine计算行星在黄道上的位置（地心坐标）
 *
 * @param body 天体对象
 * @param date 日期时间，默认为当前时间
 * @returns 行星的黄道数据
 */
export function getPlanetEclipticPosition(body: Astronomy.Body, date: Date = new Date()): {
  longitude: number
  latitude: number
  distance: number
} {
  try {
    const astroTime = new Astronomy.AstroTime(date)

    // 计算行星的地心坐标（从地球看的位置）
    const geoVector = Astronomy.GeoVector(body, astroTime, true)

    // 将地心向量转换为黄道坐标
    const ecliptic = Astronomy.Ecliptic(geoVector)

    return {
      longitude: ecliptic.elon, // 黄道经度
      latitude: ecliptic.elat,  // 黄道纬度
      distance: geoVector.Length() // 距离地球的距离（AU）
    }
  } catch (error) {
    console.error(`计算${body}黄道位置失败:`, error)
    return {
      longitude: 0,
      latitude: 0,
      distance: 1
    }
  }
}

/**
 * 获取所有行星的黄道位置
 * 包括太阳、水星、金星、火星、木星、土星
 *
 * @param date 日期时间，默认为当前时间
 * @returns 行星数据数组
 */
export function getAllPlanetsEclipticPositions(date: Date = new Date()): PlanetData[] {
  const planets: PlanetData[] = [
    {
      name: 'Sun',
      chineseName: '太阳',
      body: Astronomy.Body.Sun,
      color: '#ffcc00',
      magnitude: -26.7,
      eclipticLongitude: 0,
      distanceFromSun: 0,
      eclipticLatitude: 0
    },
    {
      name: 'Mercury',
      chineseName: '水星',
      body: Astronomy.Body.Mercury,
      color: '#8C7853',
      magnitude: -0.5,
      eclipticLongitude: 0,
      distanceFromSun: 0.39,
      eclipticLatitude: 0
    },
    {
      name: 'Venus',
      chineseName: '金星',
      body: Astronomy.Body.Venus,
      color: '#FFC649',
      magnitude: -4.4,
      eclipticLongitude: 0,
      distanceFromSun: 0.72,
      eclipticLatitude: 0
    },
    {
      name: 'Mars',
      chineseName: '火星',
      body: Astronomy.Body.Mars,
      color: '#CD5C5C',
      magnitude: -0.8,
      eclipticLongitude: 0,
      distanceFromSun: 1.52,
      eclipticLatitude: 0
    },
    {
      name: 'Jupiter',
      chineseName: '木星',
      body: Astronomy.Body.Jupiter,
      color: '#d4a373',
      magnitude: -2.5,
      eclipticLongitude: 0,
      distanceFromSun: 5.20,
      eclipticLatitude: 0
    },
    {
      name: 'Saturn',
      chineseName: '土星',
      body: Astronomy.Body.Saturn,
      color: '#FAD5A5',
      magnitude: -0.3,
      eclipticLongitude: 0,
      distanceFromSun: 9.54,
      eclipticLatitude: 0
    }
  ]

  // 计算每个行星的黄道位置
  return planets.map(planet => {
    if (planet.name === 'Sun') {
      // 对于太阳，我们使用地心坐标，此时太阳总是在黄道坐标系的原点附近
      // 但为了显示效果，我们可以使用太阳的视黄道经度
      const astroTime = new Astronomy.AstroTime(date)
      const sunEcliptic = Astronomy.Ecliptic(Astronomy.GeoVector(Astronomy.Body.Sun, astroTime, true))
      return {
        ...planet,
        eclipticLongitude: sunEcliptic.elon,
        eclipticLatitude: sunEcliptic.elat,
        distanceFromSun: 0 // 太阳距离自己为0
      }
    }

    const position = getPlanetEclipticPosition(planet.body, date)
    return {
      ...planet,
      eclipticLongitude: position.longitude,
      eclipticLatitude: position.latitude,
      distanceFromSun: position.distance
    }
  })
}

/**
 * 创建响应式的行星位置计算器
 * 用于Vue组件中实时更新行星位置
 *
 * @param updateInterval 更新间隔（毫秒）
 */
export function createPlanetPositionCalculator(updateInterval: number = 60000) {
  let intervalId: ReturnType<typeof setInterval> | null = null
  const currentPlanets = ref<PlanetData[]>(getAllPlanetsEclipticPositions())

  const updatePositions = () => {
    currentPlanets.value = getAllPlanetsEclipticPositions()
  }

  const start = () => {
    if (intervalId) return
    intervalId = setInterval(updatePositions, updateInterval)
  }

  const stop = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  // 手动更新位置
  const update = (date?: Date) => {
    currentPlanets.value = getAllPlanetsEclipticPositions(date)
  }

  return {
    currentPlanets: readonly(currentPlanets),
    start,
    stop,
    update
  }
}

/**
 * 将黄道经度转换为显示角度
 * 黄道经度0度对应春分点，我们需要调整到合适的显示角度
 *
 * @param eclipticLongitude 黄道经度（0-360度）
 * @param baseAngle 基准角度偏移
 * @returns 显示角度（0-360度）
 */
export function convertEclipticToDisplayAngle(eclipticLongitude: number, baseAngle: number = 0): number {
  // 将黄道经度转换为显示角度，可以添加偏移来调整起始位置
  return (eclipticLongitude + baseAngle) % 360
}

/**
 * 根据行星距离计算显示半径
 * 使用对数缩放来合理显示行星距离
 *
 * @param distanceFromSun 距离太阳的距离（AU）
 * @param minRadius 最小显示半径
 * @param maxRadius 最大显示半径
 * @returns 显示半径
 */
export function calculateDisplayRadius(
  distanceFromSun: number,
  minRadius: number = 30,
  maxRadius: number = 85
): number {
  if (distanceFromSun === 0) return minRadius // 太阳的位置

  // 使用对数缩放
  const logDistance = Math.log10(distanceFromSun + 0.1)
  const minLog = Math.log10(0.1)
  const maxLog = Math.log10(10) // 土星距离约9.5AU

  const normalized = (logDistance - minLog) / (maxLog - minLog)
  return minRadius + normalized * (maxRadius - minRadius)
}

/**
 * 获取行星的详细信息
 * 包括当前位置、亮度等信息
 *
 * @param body 天体对象
 * @param date 日期时间
 * @param observer 观测者位置
 * @returns 行星详细信息
 */




/**
 * 获取行星的详细信息
 * 包括当前位置、亮度等信息
 *
 * @param body 天体对象
 * @param date 日期时间
 * @param observer 观测者位置
 * @returns 行星详细信息
 */
export function getPlanetInfo(
  body: Astronomy.Body,
  date: Date = new Date(),
  observer?: Astronomy.Observer
) {
  const defaultObserver = new Astronomy.Observer(39.9042, 116.4074, 0)
  const obs = observer || defaultObserver
  const astroTime = new Astronomy.AstroTime(date)

  // 计算行星位置
  const geoVector = Astronomy.GeoVector(body, astroTime, true)
  const equator = Astronomy.Equator(body, astroTime, obs, true, false)
  const horizon = Astronomy.Horizon(astroTime, obs, equator.ra, equator.dec, 'normal')

  // 计算黄道位置
  const heliocentricPosition = Astronomy.HelioVector(body, astroTime)
  const ecliptic = Astronomy.Ecliptic(heliocentricPosition)

  return {
    // 地心坐标
    distance: geoVector.Length(),
    rightAscension: equator.ra * Astronomy.RAD2DEG,
    declination: equator.dec * Astronomy.RAD2DEG,
    altitude: horizon.altitude * Astronomy.RAD2DEG,
    azimuth: horizon.azimuth * Astronomy.RAD2DEG,

    // 日心黄道坐标
    heliocentricDistance: heliocentricPosition.Length(),
    eclipticLongitude: ecliptic.elon,
    eclipticLatitude: ecliptic.elat,

    // 视星等
    magnitude: 0, // 可以通过illumination函数计算
    illumination: 0 // 照亮比例
  }
}