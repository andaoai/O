/**
 * 反向地理编码 · 离线最近邻查找
 *
 * 输入经纬度,找到 CITIES 表中距离最近的一条,按距离分级返回可读地名:
 *
 *   距离 < 30 km        → 「上海」          (就在城内)
 *   距离 30 ~ 200 km    → 「上海附近」       (城郊周边)
 *   距离 200 ~ 500 km   → 「上海一带」       (省域内更粗略,同省不同市)
 *   距离 > 500 km       → 「日本」          (太远,退回国家名)
 *
 * 算法:Haversine 球面距离,O(n) 线性扫描 CITIES(n≈150,耗时 <0.05ms)。
 *
 * ⚠️ 五层架构:纯函数工具,无副作用,可独立单元测试。
 */

import { CITIES, type CityRecord } from '@/data/cities'

const R2D = 180 / Math.PI
const D2R = Math.PI / 180
const EARTH_RADIUS_KM = 6371

/**
 * Haversine 大圆距离(km),给定两点经纬度(度)
 */
const haversineKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const dLat = (lat2 - lat1) * D2R
  const dLon = (lon2 - lon1) * D2R
  const phi1 = lat1 * D2R
  const phi2 = lat2 * D2R
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)))
}

/** 反向地理编码结果 */
export interface ReverseGeocodeResult {
  /** 找到的最近城市记录(无匹配时为 null) */
  nearest: CityRecord | null
  /** 距离(km) */
  distanceKm: number
  /** 面向用户的中文显示名 */
  label: string
}

/**
 * 找到给定经纬度最近的城市,并按距离生成可读地名。
 *
 * @param lat 纬度(度,北正南负)
 * @param lon 经度(度,东正西负)
 */
export const reverseGeocode = (lat: number, lon: number): ReverseGeocodeResult => {
  let nearest: CityRecord | null = null
  let minDist = Infinity

  for (const city of CITIES) {
    const d = haversineKm(lat, lon, city.lat, city.lon)
    if (d < minDist) {
      minDist = d
      nearest = city
    }
  }

  if (!nearest) {
    return { nearest: null, distanceKm: Infinity, label: '未知位置' }
  }

  // 按距离分级生成 label
  let label: string
  if (minDist < 30) {
    label = nearest.name
  } else if (minDist < 200) {
    label = `${nearest.name}附近`
  } else if (minDist < 500) {
    label = `${nearest.name}一带`
  } else {
    // 远距离退回国家名(如南极科考站,或者跨洋定位失误)
    label = nearest.country
  }

  return { nearest, distanceKm: minDist, label }
}
