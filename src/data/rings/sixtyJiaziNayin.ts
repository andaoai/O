import type { RingData, RingItem } from './types'

/** 三十纳音，按六十甲子顺序（甲子乙丑 → 壬戌癸亥） */
const nayinNames = [
  '海中金', '炉中火', '大林木', '路旁土', '剑锋金',
  '山头火', '涧下水', '城头土', '白蜡金', '杨柳木',
  '泉中水', '屋上土', '霹雳火', '松柏木', '长流水',
  '沙中金', '山下火', '平地木', '壁上土', '金箔金',
  '覆灯火', '天河水', '大驿土', '钗钏金', '桑柘木',
  '大溪水', '沙中土', '天上火', '石榴木', '大海水'
]

/** 五行配色，与六十甲子色系呼应 */
const elementColor: Record<string, string> = {
  金: '#F1C40F',
  木: '#2ECC71',
  水: '#3498DB',
  火: '#E74C3C',
  土: '#D35400'
}

/** 每个纳音跨 12 度（对应两个甲子） */
function buildNayin(): RingItem[] {
  return nayinNames.map((name, i) => {
    const element = name[name.length - 1]!
    return {
      label: name,
      color: elementColor[element]!,
      startAngle: i * 12,
      endAngle: i * 12 + 12
    }
  })
}

/** 六十甲子五行纳音：30 格，每格 12 度，与六十甲子同源同转 */
export const sixtyJiaziNayin: RingData = {
  startDegree: 0,
  radius: 350,
  innerRadius: 322,
  circleColor: '#888888',
  tickColor: '#666666',
  tickWidth: 0.5,
  fontSize: 9,
  items: buildNayin()
}
