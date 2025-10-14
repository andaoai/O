import * as Astronomy from 'astronomy-engine'

/**
 * 月球数据接口
 */
export interface MoonData {
  name: string
  chineseName: string
  color: string
  magnitude: number
  // 黄道位置（0-360度）
  eclipticLongitude: number
  // 黄道纬度（度）
  eclipticLatitude: number
  // 距离地球的距离（公里）
  distanceFromEarth: number
  // 月相（0-1，0为新月，0.5为满月）
  phase: number
  // 月龄（天，从新月开始计算）
  age: number
}

/**
 * 获取月球的黄道位置
 * 使用astronomy-engine计算月球在黄道上的位置（地心坐标）
 *
 * @param date 日期时间，默认为当前时间
 * @returns 月球的黄道数据
 */
export function getMoonEclipticPosition(date: Date = new Date()): {
  longitude: number
  latitude: number
  distance: number
} {
  try {
    const astroTime = new Astronomy.AstroTime(date)

    // 计算月球的地心坐标
    const moonVector = Astronomy.GeoVector(Astronomy.Body.Moon, astroTime, true)

    // 将地心向量转换为黄道坐标
    const ecliptic = Astronomy.Ecliptic(moonVector)

    return {
      longitude: ecliptic.elon, // 黄道经度
      latitude: ecliptic.elat,  // 黄道纬度
      distance: moonVector.Length() // 距离地球的距离（AU）
    }
  } catch (error) {
    console.error('计算月球黄道位置失败:', error)
    return {
      longitude: 0,
      latitude: 0,
      distance: 0.00257 // 月球平均距离
    }
  }
}

/**
 * 计算月相
 * 返回月相比例（0-1）和月龄
 *
 * @param date 日期时间，默认为当前时间
 * @returns 月相数据
 */
export function getMoonPhase(date: Date = new Date()): {
  phase: number    // 0-1，0为新月，0.5为满月，1为下一个月的新月
  age: number     // 月龄（天）
  illumination: number // 照亮比例（0-1）
} {
  try {
    const astroTime = new Astronomy.AstroTime(date)

    // 使用astronomy-engine计算月相
    const moonPhase = Astronomy.MoonPhase(astroTime)

    // moonPhase返回的是从上次新月开始的相位角度（0-360度）
    const phaseAngle = moonPhase
    const phase = phaseAngle / 360 // 转换为0-1的比例

    // 计算月龄（一个朔望月约29.53天）
    const synodicMonth = 29.53059 // 天
    const age = phase * synodicMonth

    // 计算照亮比例
    const illumination = (1 - Math.cos(phaseAngle * Math.PI / 180)) / 2

    return {
      phase,
      age,
      illumination
    }
  } catch (error) {
    console.error('计算月相失败:', error)
    return {
      phase: 0,
      age: 0,
      illumination: 0
    }
  }
}

/**
 * 获取月球的完整数据
 * 包括位置、月相等信息
 *
 * @param date 日期时间，默认为当前时间
 * @returns 月球数据
 */
export function getMoonData(date: Date = new Date()): MoonData {
  // 获取月球位置
  const position = getMoonEclipticPosition(date)

  // 获取月相
  const phase = getMoonPhase(date)

  // 基础月球数据
  return {
    name: 'Moon',
    chineseName: '月球',
    color: '#F0F0F0',
    magnitude: -12.6, // 满月时的视星等
    eclipticLongitude: position.longitude,
    eclipticLatitude: position.latitude,
    distanceFromEarth: position.distance * 149597870.7, // AU转换为公里
    phase: phase.phase,
    age: phase.age
  }
}

/**
 * 计算白道参数
 * 白道是月球绕地球运行的轨道平面，与黄道面有约5度的夹角
 *
 * @param date 日期时间
 * @returns 白道参数
 */
export function getWhitePathParameters(date: Date = new Date()): {
  inclination: number    // 白道对黄道的倾角（约5度）
  ascendingNode: number  // 升交点黄经
  offsetDistance: number // 白道中心偏离黄道中心的距离（像素）
  offsetAngle: number    // 白道中心偏离的角度
} {
  try {
    const astroTime = new Astronomy.AstroTime(date)

    // 获取月球轨道的升交点黄经
    // 这里使用简化的计算，实际需要更复杂的轨道力学计算
    const moonPosition = Astronomy.GeoVector(Astronomy.Body.Moon, astroTime, true)
    const ecliptic = Astronomy.Ecliptic(moonPosition)

    // 白道对黄道的平均倾角约为5.145度
    const inclination = 5.145

    // 计算升交点的近似位置（简化计算）
    const ascendingNode = (ecliptic.elon - 90) % 360

    // 根据月球位置计算白道中心的偏移
    // 这里使用简化的可视化偏移，实际偏移需要根据具体观测需求调整
    const offsetDistance = 30 // 像素距离
    const offsetAngle = (ascendingNode + 180) % 360 // 白道中心偏离的方向

    return {
      inclination,
      ascendingNode,
      offsetDistance,
      offsetAngle
    }
  } catch (error) {
    console.error('计算白道参数失败:', error)
    return {
      inclination: 5.145,
      ascendingNode: 0,
      offsetDistance: 30,
      offsetAngle: 0
    }
  }
}

/**
 * 将黄道坐标转换为白道坐标
 * 用于在白道上显示月球的相对位置
 *
 * @param eclipticLongitude 黄道经度
 * @param eclipticLatitude 黄道纬度
 * @param inclination 白道倾角
 * @param ascendingNode 升交点黄经
 * @returns 白道坐标
 */
export function convertEclipticToWhitePath(
  eclipticLongitude: number,
  eclipticLatitude: number,
  inclination: number,
  ascendingNode: number
): {
  longitude: number
  latitude: number
} {
  // 将黄道坐标转换为白道坐标
  // 这里使用简化的坐标转换，实际转换需要更复杂的数学计算

  const lonRad = (eclipticLongitude - ascendingNode) * Math.PI / 180
  const latRad = eclipticLatitude * Math.PI / 180
  const incRad = inclination * Math.PI / 180

  // 简化的坐标转换公式
  const whitePathLon = Math.atan2(
    Math.sin(lonRad) * Math.cos(incRad) - Math.tan(latRad) * Math.sin(incRad),
    Math.cos(lonRad)
  ) * 180 / Math.PI + ascendingNode

  const whitePathLat = Math.asin(
    Math.sin(latRad) * Math.cos(incRad) + Math.cos(latRad) * Math.sin(incRad) * Math.sin(lonRad)
  ) * 180 / Math.PI

  return {
    longitude: (whitePathLon + 360) % 360,
    latitude: whitePathLat
  }
}

/**
 * 获取月球的视位置
 * 考虑了观测者的地理位置
 *
 * @param date 日期时间
 * @param observer 观测者位置
 * @returns 月球视位置数据
 */
export function getMoonApparentPosition(
  date: Date = new Date(),
  observer?: Astronomy.Observer
): {
  altitude: number    // 地平高度角
  azimuth: number     // 方位角
  distance: number    // 距离（公里）
  phase: number       // 月相
  illumination: number // 照亮比例
} {
  try {
    const defaultObserver = new Astronomy.Observer(39.9042, 116.4074, 0) // 北京
    const obs = observer || defaultObserver
    const astroTime = new Astronomy.AstroTime(date)

    // 计算月球的赤道坐标
    const equator = Astronomy.Equator(Astronomy.Body.Moon, astroTime, obs, true, false)

    // 转换为地平坐标
    const horizon = Astronomy.Horizon(astroTime, obs, equator.ra, equator.dec, 'normal')

    // 获取月相
    const phase = getMoonPhase(date)

    // 获取距离
    const moonVector = Astronomy.GeoVector(Astronomy.Body.Moon, astroTime, true)
    const distance = moonVector.Length() * 149597870.7 // AU转换为公里

    return {
      altitude: horizon.altitude * Astronomy.RAD2DEG,
      azimuth: horizon.azimuth * Astronomy.RAD2DEG,
      distance,
      phase: phase.phase,
      illumination: phase.illumination
    }
  } catch (error) {
    console.error('计算月球视位置失败:', error)
    return {
      altitude: 0,
      azimuth: 0,
      distance: 384400, // 月球平均距离
      phase: 0,
      illumination: 0
    }
  }
}

/**
 * 根据月相获取月球的中文名称
 *
 * @param phase 月相（0-1）
 * @returns 月相中文名称
 */
export function getMoonPhaseChineseName(phase: number): string {
  const phaseAngle = phase * 360

  if (phaseAngle < 1.8 || phaseAngle > 358.2) {
    return '朔（新月）'
  } else if (phaseAngle < 44.1) {
    return '蛾眉月'
  } else if (phaseAngle < 90) {
    return '上弦月'
  } else if (phaseAngle < 135.9) {
    return '盈凸月'
  } else if (phaseAngle < 180.1) {
    return '望（满月）'
  } else if (phaseAngle < 225.9) {
    return '亏凸月'
  } else if (phaseAngle < 270) {
    return '下弦月'
  } else if (phaseAngle < 315.9) {
    return '残月'
  } else {
    return '蛾眉月'
  }
}