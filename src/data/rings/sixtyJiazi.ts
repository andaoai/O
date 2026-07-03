import type { RingData, RingItem } from './types'
import { STEMS, BRANCHES } from '@/utils/constants/ganzhi'

/** 五行配色（六个深浅档），用于六十甲子按五行着色 */
const elementColors: string[][] = [
  ['#2ECC71', '#27AE60', '#229954', '#1E8449', '#1ABC9C', '#16A085'], // 木（甲乙）
  ['#E74C3C', '#EC7063', '#E74C3C', '#CB4335', '#AF601A', '#935116'], // 火（丙丁）
  ['#F39C12', '#F7DC6F', '#F8C471', '#F5B041', '#EB984E', '#DC7633'], // 土（戊己）
  ['#F1C40F', '#F4D03F', '#F7DC6F', '#F9E79F', '#FCF3CF', '#FAE5D3'], // 金（庚辛）
  ['#3498DB', '#5DADE2', '#85C1E2', '#AED6F1', '#D6EAF8', '#EBF5FB']  // 水（壬癸）
]

/** 生成 60 个甲子，每个 6 度，按天干五行着色 */
function buildSixtyJiazi(): RingItem[] {
  const items: RingItem[] = []
  for (let i = 0; i < 60; i++) {
    const stemIndex = i % 10
    const branchIndex = i % 12
    const elementIndex = Math.floor(stemIndex / 2) // 0-4 对应五行
    const colorGroup = elementColors[elementIndex]!
    items.push({
      label: STEMS[stemIndex]! + BRANCHES[branchIndex]!,
      color: colorGroup[i % colorGroup.length]!,
      startAngle: i * 6,
      endAngle: i * 6 + 6
    })
  }
  return items
}

/** 六十甲子：60 格，每格 6 度 */
export const sixtyJiazi: RingData = {
  startDegree: 0,
  radius: 380,
  innerRadius: 350,
  circleColor: '#888888',
  tickColor: '#666666',
  tickWidth: 0.5,
  fontSize: 11,
  items: buildSixtyJiazi()
}
