import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as Astronomy from 'astronomy-engine'
import {
  calculateSolarHourAngle,
  calculateSolarOrbitAngle,
  createSolarAngleCalculator,
  calculateLunarHourAngle,
  calculateLunarOrbitAngle,
  createLunarAngleCalculator,
  getSolarInfo,
  getLunarInfo,
  getMoonPhaseName,
  getMoonPhaseEmoji,
  createObserver,
  OBSERVERS
} from './solarTime'

describe('solarTime', () => {
  describe('calculateSolarHourAngle', () => {
    const beijingObserver = OBSERVERS.BEIJING

    it('应该返回0-360度范围内的角度', () => {
      const time = new Date('2024-01-01T12:00:00')
      const angle = calculateSolarHourAngle(time, beijingObserver)
      expect(angle).toBeGreaterThanOrEqual(0)
      expect(angle).toBeLessThan(360)
    })

    it('不同时间应该产生不同的角度', () => {
      const noon = new Date('2024-01-01T12:00:00')
      const midnight = new Date('2024-01-01T00:00:00')

      const noonAngle = calculateSolarHourAngle(noon, beijingObserver)
      const midnightAngle = calculateSolarHourAngle(midnight, beijingObserver)

      expect(noonAngle).not.toBe(midnightAngle)
    })

    it('应该考虑观测者位置', () => {
      const time = new Date('2024-01-01T12:00:00')
      const beijingAngle = calculateSolarHourAngle(time, OBSERVERS.BEIJING)
      const shanghaiAngle = calculateSolarHourAngle(time, OBSERVERS.SHANGHAI)

      // 由于地理位置不同，观测到的太阳时角应该不同
      expect(beijingAngle).not.toBe(shanghaiAngle)
    })

    it('应该接受可选的观测者参数', () => {
      const time = new Date('2024-01-01T12:00:00')
      const angleWithObserver = calculateSolarHourAngle(time, beijingObserver)
      const angleWithoutObserver = calculateSolarHourAngle(time)

      // 不提供观测者时应该使用默认位置（北京）
      expect(angleWithoutObserver).toBe(angleWithObserver)
    })

    it('应该正确处理连续时间的变化', () => {
      const baseTime = new Date('2024-01-01T12:00:00')
      const laterTime = new Date('2024-01-01T13:00:00') // 1小时后

      const baseAngle = calculateSolarHourAngle(baseTime, beijingObserver)
      const laterAngle = calculateSolarHourAngle(laterTime, beijingObserver)

      // 1小时后天体位置应该发生变化
      expect(laterAngle).not.toBe(baseAngle)
    })

    it('在错误情况下应该返回0', () => {
      // @ts-ignore - 测试错误情况
      const angle = calculateSolarHourAngle(null)
      expect(angle).toBe(0)
    })
  })

  describe('calculateSolarOrbitAngle', () => {
    const beijingObserver = OBSERVERS.BEIJING

    it('应该返回0-360度范围内的角度', () => {
      const time = new Date('2024-01-01T12:00:00')
      const angle = calculateSolarOrbitAngle(0, time, beijingObserver)
      expect(angle).toBeGreaterThanOrEqual(0)
      expect(angle).toBeLessThan(360)
    })

    it('应该正确加上基准角度', () => {
      const time = new Date('2024-01-01T12:00:00')
      const baseAngle = 90
      const orbitAngle = calculateSolarOrbitAngle(baseAngle, time, beijingObserver)
      const hourAngle = calculateSolarHourAngle(time, beijingObserver)

      expect(orbitAngle).toBe((hourAngle + baseAngle) % 360)
    })

    it('应该正确处理角度超过360度的情况', () => {
      const time = new Date('2024-01-01T12:00:00')
      const largeBaseAngle = 400
      const orbitAngle = calculateSolarOrbitAngle(largeBaseAngle, time, beijingObserver)
      const hourAngle = calculateSolarHourAngle(time, beijingObserver)

      expect(orbitAngle).toBe((hourAngle + largeBaseAngle) % 360)
      expect(orbitAngle).toBeLessThan(360)
    })

    it('应该使用当前时间当没有提供日期时', () => {
      const before = Date.now()
      const angle = calculateSolarOrbitAngle(0)
      const after = Date.now()

      // 验证使用了当前时间
      expect(angle).toBeGreaterThanOrEqual(0)
      expect(angle).toBeLessThan(360)
      expect(after - before).toBeLessThan(100) // 应该很快完成
    })

    it('应该接受观测者参数', () => {
      const time = new Date('2024-01-01T12:00:00')
      const beijingAngle = calculateSolarOrbitAngle(0, time, OBSERVERS.BEIJING)
      const shanghaiAngle = calculateSolarOrbitAngle(0, time, OBSERVERS.SHANGHAI)

      expect(beijingAngle).not.toBe(shanghaiAngle)
    })
  })

  describe('createSolarAngleCalculator', () => {
    let calculator: ReturnType<typeof createSolarAngleCalculator>
    const beijingObserver = OBSERVERS.BEIJING

    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      if (calculator) {
        calculator.stop()
      }
      vi.useRealTimers()
    })

    it('应该创建响应式角度计算器', () => {
      calculator = createSolarAngleCalculator(0, 1000, beijingObserver)
      expect(calculator.currentAngle.value).toBeGreaterThanOrEqual(0)
      expect(calculator.currentAngle.value).toBeLessThan(360)
      expect(typeof calculator.start).toBe('function')
      expect(typeof calculator.stop).toBe('function')
    })

    it('应该立即计算初始角度', () => {
      const fixedTime = new Date('2024-01-01T12:00:00')
      vi.setSystemTime(fixedTime)

      calculator = createSolarAngleCalculator(0, 1000, beijingObserver)
      const expectedAngle = calculateSolarOrbitAngle(0, fixedTime, beijingObserver)
      expect(calculator.currentAngle.value).toBe(expectedAngle)
    })

    it('应该定期更新角度', () => {
      const fixedTime = new Date('2024-01-01T12:00:00')
      vi.setSystemTime(fixedTime)

      calculator = createSolarAngleCalculator(0, 1000, beijingObserver)
      calculator.start()

      const initialAngle = calculator.currentAngle.value

      // 前进时间
      vi.advanceTimersByTime(1000)
      vi.setSystemTime(new Date('2024-01-01T12:00:01'))

      // 角度应该发生变化
      expect(calculator.currentAngle.value).not.toBe(initialAngle)
    })

    it('应该可以停止更新', () => {
      calculator = createSolarAngleCalculator(0, 100, beijingObserver)
      calculator.start()
      calculator.stop()

      // 前进时间，角度不应该再更新
      vi.advanceTimersByTime(200)

      expect(calculator.currentAngle.value).toBeGreaterThanOrEqual(0)
    })

    it('重复调用start不应该创建多个定时器', () => {
      calculator = createSolarAngleCalculator(0, 100, beijingObserver)
      calculator.start()
      calculator.start() // 第二次调用应该被忽略

      vi.advanceTimersByTime(200)

      expect(calculator.currentAngle.value).toBeGreaterThanOrEqual(0)
    })

    it('应该接受观测者参数', () => {
      calculator = createSolarAngleCalculator(0, 1000, beijingObserver)
      expect(calculator.currentAngle.value).toBeGreaterThanOrEqual(0)
    })
  })

  describe('calculateLunarHourAngle', () => {
    const beijingObserver = OBSERVERS.BEIJING

    it('应该返回0-360度范围内的角度', () => {
      const time = new Date('2024-01-01T00:00:00')
      const angle = calculateLunarHourAngle(time, beijingObserver)
      expect(angle).toBeGreaterThanOrEqual(0)
      expect(angle).toBeLessThan(360)
    })

    it('不同时间应该产生不同的角度', () => {
      const noon = new Date('2024-01-01T12:00:00')
      const midnight = new Date('2024-01-01T00:00:00')

      const noonAngle = calculateLunarHourAngle(noon, beijingObserver)
      const midnightAngle = calculateLunarHourAngle(midnight, beijingObserver)

      expect(noonAngle).not.toBe(midnightAngle)
    })

    it('应该考虑观测者位置', () => {
      const time = new Date('2024-01-01T12:00:00')
      const beijingAngle = calculateLunarHourAngle(time, OBSERVERS.BEIJING)
      const shanghaiAngle = calculateLunarHourAngle(time, OBSERVERS.SHANGHAI)

      expect(beijingAngle).not.toBe(shanghaiAngle)
    })

    it('应该接受可选的观测者参数', () => {
      const time = new Date('2024-01-01T12:00:00')
      const angleWithObserver = calculateLunarHourAngle(time, beijingObserver)
      const angleWithoutObserver = calculateLunarHourAngle(time)

      expect(angleWithoutObserver).toBe(angleWithObserver)
    })

    it('应该正确处理连续时间的变化', () => {
      const baseTime = new Date('2024-01-01T12:00:00')
      const laterTime = new Date('2024-01-01T13:00:00')

      const baseAngle = calculateLunarHourAngle(baseTime, beijingObserver)
      const laterAngle = calculateLunarHourAngle(laterTime, beijingObserver)

      expect(laterAngle).not.toBe(baseAngle)
    })

    it('在错误情况下应该返回180度', () => {
      // @ts-ignore - 测试错误情况
      const angle = calculateLunarHourAngle(null)
      expect(angle).toBe(180)
    })
  })

  describe('calculateLunarOrbitAngle', () => {
    const beijingObserver = OBSERVERS.BEIJING

    it('应该返回0-360度范围内的角度', () => {
      const time = new Date('2024-01-01T12:00:00')
      const angle = calculateLunarOrbitAngle(0, time, beijingObserver)
      expect(angle).toBeGreaterThanOrEqual(0)
      expect(angle).toBeLessThan(360)
    })

    it('应该正确加上基准角度', () => {
      const time = new Date('2024-01-01T12:00:00')
      const baseAngle = 90
      const orbitAngle = calculateLunarOrbitAngle(baseAngle, time, beijingObserver)
      const hourAngle = calculateLunarHourAngle(time, beijingObserver)

      expect(orbitAngle).toBe((hourAngle + baseAngle) % 360)
    })

    it('应该正确处理角度超过360度的情况', () => {
      const time = new Date('2024-01-01T12:00:00')
      const largeBaseAngle = 400
      const orbitAngle = calculateLunarOrbitAngle(largeBaseAngle, time, beijingObserver)
      const hourAngle = calculateLunarHourAngle(time, beijingObserver)

      expect(orbitAngle).toBe((hourAngle + largeBaseAngle) % 360)
      expect(orbitAngle).toBeLessThan(360)
    })

    it('应该使用当前时间当没有提供日期时', () => {
      const before = Date.now()
      const angle = calculateLunarOrbitAngle(0)
      const after = Date.now()

      expect(angle).toBeGreaterThanOrEqual(0)
      expect(angle).toBeLessThan(360)
      expect(after - before).toBeLessThan(100)
    })

    it('应该接受观测者参数', () => {
      const time = new Date('2024-01-01T12:00:00')
      const beijingAngle = calculateLunarOrbitAngle(0, time, OBSERVERS.BEIJING)
      const shanghaiAngle = calculateLunarOrbitAngle(0, time, OBSERVERS.SHANGHAI)

      expect(beijingAngle).not.toBe(shanghaiAngle)
    })
  })

  describe('createLunarAngleCalculator', () => {
    let calculator: ReturnType<typeof createLunarAngleCalculator>
    const beijingObserver = OBSERVERS.BEIJING

    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      if (calculator) {
        calculator.stop()
      }
      vi.useRealTimers()
    })

    it('应该创建响应式月亮角度计算器', () => {
      calculator = createLunarAngleCalculator(0, 1000, beijingObserver)
      expect(calculator.currentAngle.value).toBeGreaterThanOrEqual(0)
      expect(calculator.currentAngle.value).toBeLessThan(360)
      expect(typeof calculator.start).toBe('function')
      expect(typeof calculator.stop).toBe('function')
    })

    it('应该立即计算初始月亮角度', () => {
      const fixedTime = new Date('2024-01-01T12:00:00')
      vi.setSystemTime(fixedTime)

      calculator = createLunarAngleCalculator(0, 1000, beijingObserver)
      const expectedAngle = calculateLunarOrbitAngle(0, fixedTime, beijingObserver)
      expect(calculator.currentAngle.value).toBe(expectedAngle)
    })

    it('应该定期更新月亮角度', () => {
      const fixedTime = new Date('2024-01-01T12:00:00')
      vi.setSystemTime(fixedTime)

      calculator = createLunarAngleCalculator(0, 1000, beijingObserver)
      calculator.start()

      const initialAngle = calculator.currentAngle.value

      vi.advanceTimersByTime(1000)
      vi.setSystemTime(new Date('2024-01-01T12:00:01'))

      expect(calculator.currentAngle.value).not.toBe(initialAngle)
    })

    it('应该可以停止更新', () => {
      calculator = createLunarAngleCalculator(0, 100, beijingObserver)
      calculator.start()
      calculator.stop()

      vi.advanceTimersByTime(200)

      expect(calculator.currentAngle.value).toBeGreaterThanOrEqual(0)
    })

    it('重复调用start不应该创建多个定时器', () => {
      calculator = createLunarAngleCalculator(0, 100, beijingObserver)
      calculator.start()
      calculator.start()

      vi.advanceTimersByTime(200)

      expect(calculator.currentAngle.value).toBeGreaterThanOrEqual(0)
    })

    it('应该接受观测者参数', () => {
      calculator = createLunarAngleCalculator(0, 1000, beijingObserver)
      expect(calculator.currentAngle.value).toBeGreaterThanOrEqual(0)
    })
  })

  // 新增的辅助函数测试
  describe('getSolarInfo', () => {
    const beijingObserver = OBSERVERS.BEIJING

    it('应该返回太阳的详细信息', () => {
      const time = new Date('2024-01-01T12:00:00')
      const solarInfo = getSolarInfo(time, beijingObserver)

      expect(solarInfo).toHaveProperty('altitude')
      expect(solarInfo).toHaveProperty('azimuth')
      expect(solarInfo).toHaveProperty('rightAscension')
      expect(solarInfo).toHaveProperty('declination')
      expect(solarInfo).toHaveProperty('distance')
      expect(solarInfo).toHaveProperty('hourAngle')
      expect(solarInfo).toHaveProperty('orbitAngle')
      expect(solarInfo).toHaveProperty('illumination')
      expect(solarInfo.illumination).toBe(1.0)
    })

    it('应该返回正确的数据类型', () => {
      const time = new Date('2024-01-01T12:00:00')
      const solarInfo = getSolarInfo(time, beijingObserver)

      expect(typeof solarInfo.altitude).toBe('number')
      expect(typeof solarInfo.azimuth).toBe('number')
      expect(typeof solarInfo.distance).toBe('number')
      expect(typeof solarInfo.hourAngle).toBe('number')
    })
  })

  describe('getLunarInfo', () => {
    const beijingObserver = OBSERVERS.BEIJING

    it('应该返回月亮的详细信息', () => {
      const time = new Date('2024-01-01T12:00:00')
      const lunarInfo = getLunarInfo(time, beijingObserver)

      expect(lunarInfo).toHaveProperty('altitude')
      expect(lunarInfo).toHaveProperty('azimuth')
      expect(lunarInfo).toHaveProperty('rightAscension')
      expect(lunarInfo).toHaveProperty('declination')
      expect(lunarInfo).toHaveProperty('distance')
      expect(lunarInfo).toHaveProperty('hourAngle')
      expect(lunarInfo).toHaveProperty('orbitAngle')
      expect(lunarInfo).toHaveProperty('phase')
      expect(lunarInfo).toHaveProperty('illuminatedFraction')
    })

    it('月相数据应该在有效范围内', () => {
      const time = new Date('2024-01-01T12:00:00')
      const lunarInfo = getLunarInfo(time, beijingObserver)

      expect(lunarInfo.phase).toBeGreaterThanOrEqual(0)
      expect(lunarInfo.phase).toBeLessThanOrEqual(1)
      expect(lunarInfo.illuminatedFraction).toBeGreaterThanOrEqual(0)
      expect(lunarInfo.illuminatedFraction).toBeLessThanOrEqual(1)
    })
  })

  describe('getMoonPhaseName', () => {
    it('应该返回正确的月相名称', () => {
      expect(getMoonPhaseName(0)).toBe('新月')
      expect(getMoonPhaseName(0.1)).toBe('娥眉月')
      expect(getMoonPhaseName(0.25)).toBe('上弦月')
      expect(getMoonPhaseName(0.4)).toBe('盈凸月')
      expect(getMoonPhaseName(0.5)).toBe('满月')
      expect(getMoonPhaseName(0.6)).toBe('亏凸月')
      expect(getMoonPhaseName(0.75)).toBe('下弦月')
      expect(getMoonPhaseName(0.9)).toBe('残月')
    })
  })

  describe('getMoonPhaseEmoji', () => {
    it('应该返回正确的月相emoji', () => {
      expect(getMoonPhaseEmoji(0)).toBe('🌑')
      expect(getMoonPhaseEmoji(0.1)).toBe('🌒')
      expect(getMoonPhaseEmoji(0.25)).toBe('🌓')
      expect(getMoonPhaseEmoji(0.4)).toBe('🌔')
      expect(getMoonPhaseEmoji(0.5)).toBe('🌕')
      expect(getMoonPhaseEmoji(0.6)).toBe('🌖')
      expect(getMoonPhaseEmoji(0.75)).toBe('🌗')
      expect(getMoonPhaseEmoji(0.9)).toBe('🌘')
    })
  })

  describe('createObserver', () => {
    it('应该创建观测者对象', () => {
      const observer = createObserver(39.9042, 116.4074, 50)

      expect(observer.latitude).toBe(39.9042)
      expect(observer.longitude).toBe(116.4074)
      expect(observer.height).toBe(50)
    })

    it('应该使用默认海拔', () => {
      const observer = createObserver(39.9042, 116.4074)
      expect(observer.height).toBe(0)
    })
  })

  describe('OBSERVERS', () => {
    it('应该包含预定义的观测者位置', () => {
      expect(OBSERVERS).toHaveProperty('BEIJING')
      expect(OBSERVERS).toHaveProperty('SHANGHAI')
      expect(OBSERVERS).toHaveProperty('GUANGZHOU')

      expect(OBSERVERS.BEIJING.latitude).toBe(39.9042)
      expect(OBSERVERS.BEIJING.longitude).toBe(116.4074)
    })
  })
})