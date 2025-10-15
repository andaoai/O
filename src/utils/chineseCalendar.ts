/**
 * 节气信息接口
 */
export interface SolarTermInfo {
  name: string        // 节气名称
  index: number       // 节气索引 (0-23)
  isStart: boolean    // 是否是节气开始
  nextTermName: string // 下一个节气名称
  daysToNext: number  // 距离下一个节气的天数
}

/**
 * 干支历信息接口
 */
export interface GanzhiInfo {
  year: {         // 年干支
    stem: string      // 天干
    branch: string    // 地支
    full: string      // 完整干支
    element: string   // 五行
    animal: string    // 生肖
  }
  month: {        // 月干支
    stem: string
    branch: string
    full: string
  }
  day: {          // 日干支
    stem: string
    branch: string
    full: string
    element: string
  }
  hour: {         // 时干支
    stem: string
    branch: string
    full: string
  }
}

/**
 * 中国历法信息
 */
export interface ChineseCalendarInfo {
  solarDate: string         // 公历日期
  lunarDate: string         // 农历日期
  solarTerm?: SolarTermInfo // 节气信息
  ganzhi: GanzhiInfo         // 干支信息
}

// 24节气名称
const SOLAR_TERMS = [
  '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
  '立夏', '小满', '芒种', '夏至', '小暑', '大暑',
  '立秋', '处暑', '白露', '秋分', '寒露', '霜降',
  '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'
]

// 天干
const HEAVEN_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']

// 地支
const EARTH_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

// 生肖
const ANIMALS = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']

// 五行
const ELEMENTS = ['木', '火', '土', '金', '水']

/**
 * 获取当前时间的节气信息
 *
 * @param date 日期
 * @returns 节气信息
 */
export function getSolarTermInfo(date: Date): SolarTermInfo | undefined {
  try {
    // 简化的节气计算（基于月份的近似计算）
    const month = date.getMonth() + 1 // 1-12月
    const day = date.getDate()

    // 每个节气大约间隔15天
    const termIndex = Math.floor((month - 1) * 2 + (day >= 15 ? 1 : 0))

    if (termIndex >= 0 && termIndex < 24) {
      const termName = SOLAR_TERMS[termIndex] || '立春'
      const nextIndex = (termIndex + 1) % 24
      const nextTermName = SOLAR_TERMS[nextIndex] || '立春'

      // 简化计算：下一个节气在下个月的同一天左右
      const daysToNext = termIndex % 2 === 1 ? 15 : 15

      return {
        name: termName,
        index: termIndex,
        isStart: day >= 15,
        nextTermName: nextTermName,
        daysToNext: daysToNext
      }
    }

    return undefined
  } catch (error) {
    console.error('获取节气信息失败:', error)
    return undefined
  }
}

/**
 * 获取当前时间的干支信息
 *
 * @param date 日期
 * @returns 干支信息
 */
export function getGanzhiInfo(date: Date): GanzhiInfo {
  try {
    // 年干支计算（基于公历年份的简化计算）
    const year = date.getFullYear()
    const yearStemIndex = Math.abs((year - 4) % 10)
    const yearBranchIndex = Math.abs((year - 4) % 12)
    const yearStem = HEAVEN_STEMS[yearStemIndex] || '甲'
    const yearBranch = EARTH_BRANCHES[yearBranchIndex] || '子'
    const yearGanzhi = yearStem + yearBranch

    // 月干支（简化计算）
    const month = date.getMonth() + 1
    const monthStemIndex = Math.abs((yearStemIndex * 2 + month - 2) % 10)
    const monthBranchIndex = Math.abs((month - 1) % 12)
    const monthStem = HEAVEN_STEMS[monthStemIndex] || '甲'
    const monthBranch = EARTH_BRANCHES[monthBranchIndex] || '子'
    const monthGanzhi = monthStem + monthBranch

    // 日干支（基于1900年1月1日为庚子日的简化计算）
    const baseDate = new Date(1900, 0, 1) // 1900年1月1日，庚子日
    const daysDiff = Math.floor((date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24))
    const dayGanzhiIndex = Math.abs(daysDiff % 60)
    const dayStem = HEAVEN_STEMS[dayGanzhiIndex % 10] || '甲'
    const dayBranch = EARTH_BRANCHES[dayGanzhiIndex % 12] || '子'
    const dayGanzhi = dayStem + dayBranch

    // 时干支
    const hour = date.getHours()
    const hourBranchIndex = Math.abs(Math.floor((hour + 1) / 2) % 12)
    const hourStemIndex = Math.abs((dayGanzhiIndex * 2 + hourBranchIndex) % 10)
    const hourStem = HEAVEN_STEMS[hourStemIndex] || '甲'
    const hourBranch = EARTH_BRANCHES[hourBranchIndex] || '子'
    const hourGanzhi = hourStem + hourBranch

    return {
      year: {
        stem: yearStem,
        branch: yearBranch,
        full: yearGanzhi,
        element: ELEMENTS[Math.floor(yearStemIndex / 2)] || '木',
        animal: ANIMALS[yearBranchIndex] || '鼠'
      },
      month: {
        stem: monthStem,
        branch: monthBranch,
        full: monthGanzhi
      },
      day: {
        stem: dayStem,
        branch: dayBranch,
        full: dayGanzhi,
        element: ELEMENTS[Math.floor((dayGanzhiIndex % 10) / 2)] || '木'
      },
      hour: {
        stem: hourStem,
        branch: hourBranch,
        full: hourGanzhi
      }
    }
  } catch (error) {
    console.error('获取干支信息失败:', error)
    // 返回默认值
    return {
      year: { stem: '甲', branch: '子', full: '甲子', element: '木', animal: '鼠' },
      month: { stem: '甲', branch: '子', full: '甲子' },
      day: { stem: '甲', branch: '子', full: '甲子', element: '木' },
      hour: { stem: '甲', branch: '子', full: '甲子' }
    }
  }
}

/**
 * 获取完整的中国历法信息
 *
 * @param date 日期
 * @returns 中国历法信息
 */
export function getChineseCalendarInfo(date: Date): ChineseCalendarInfo {
  try {
    // 格式化公历日期
    const solarDate = date.toLocaleDateString('zh-CN')

    // 简化农历日期计算
    const lunarDate = getLunarDate(date)

    // 获取节气信息
    const solarTerm = getSolarTermInfo(date)

    // 获取干支信息
    const ganzhi = getGanzhiInfo(date)

    return {
      solarDate,
      lunarDate,
      solarTerm,
      ganzhi
    }
  } catch (error) {
    console.error('获取中国历法信息失败:', error)
    return {
      solarDate: date.toLocaleDateString('zh-CN'),
      lunarDate: '农历信息获取失败',
      ganzhi: getGanzhiInfo(date)
    }
  }
}

/**
 * 简化农历日期计算
 *
 * @param date 公历日期
 * @returns 农历日期字符串
 */
function getLunarDate(date: Date): string {
  try {
    // 简化的农历计算（仅供参考）
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    // 简化映射表（实际应该使用复杂的天文计算）
    const lunarMonths = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月']
    const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
                      '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                      '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']

    const lunarMonth = lunarMonths[(month - 1) % 12]
    const lunarDay = lunarDays[Math.min(day - 1, 29)]

    return `${lunarMonth}${lunarDay}`
  } catch (error) {
    console.error('计算农历日期失败:', error)
    return '农历日期计算失败'
  }
}

/**
 * 获取节气的简单描述
 *
 * @param term 节气信息
 * @returns 节气描述
 */
export function getSolarTermDescription(term: SolarTermInfo): string {
  if (term.isStart) {
    return `今日${term.name}`
  } else {
    return `距离${term.nextTermName}还有${term.daysToNext}天`
  }
}