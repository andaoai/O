import type { RingData } from './types'
import { MANSION_COLORS } from '../lunarMansions'

/**
 * 二十八星宿赤道宿度
 *
 * 数据基于《汉书·律历志》汉代标准赤道宿度。传统以 365.25 度为周天，
 * 角度已按 现代度数 = 古度 × (360/365.25) 转换，注释标注原始古度。
 * 从"角"宿（对应春分点）起，按东青龙→北玄武→西白虎→南朱雀顺序排列。
 */
export const twentyEightConstellations: RingData = {
  startDegree: 210,
  radius: 420,
  innerRadius: 390,
  circleColor: '#666666',
  circleWidth: 1.2,
  tickColor: '#444444',
  tickWidth: 1,
  fontSize: 12,
  items: [
    // 东方青龙七宿 (0° → 73.922°)
    { label: '角', color: MANSION_COLORS['角']!, startAngle: 0, endAngle: 11.828 },       // 12古度
    { label: '亢', color: MANSION_COLORS['亢']!, startAngle: 11.828, endAngle: 20.699 },  // 9古度
    { label: '氐', color: MANSION_COLORS['氐']!, startAngle: 20.699, endAngle: 35.483 },  // 15古度
    { label: '房', color: MANSION_COLORS['房']!, startAngle: 35.483, endAngle: 40.411 },  // 5古度
    { label: '心', color: MANSION_COLORS['心']!, startAngle: 40.411, endAngle: 45.339 },  // 5古度
    { label: '尾', color: MANSION_COLORS['尾']!, startAngle: 45.339, endAngle: 63.080 },  // 18古度
    { label: '箕', color: MANSION_COLORS['箕']!, startAngle: 63.080, endAngle: 73.922 },  // 11古度

    // 北方玄武七宿 (73.922° → 170.514°)
    { label: '斗', color: MANSION_COLORS['斗']!, startAngle: 73.922, endAngle: 99.548 },   // 26古度
    { label: '牛', color: MANSION_COLORS['牛']!, startAngle: 99.548, endAngle: 107.433 },  // 8古度
    { label: '女', color: MANSION_COLORS['女']!, startAngle: 107.433, endAngle: 119.261 }, // 12古度
    { label: '虚', color: MANSION_COLORS['虚']!, startAngle: 119.261, endAngle: 129.117 }, // 10古度
    { label: '危', color: MANSION_COLORS['危']!, startAngle: 129.117, endAngle: 145.873 }, // 17古度
    { label: '室', color: MANSION_COLORS['室']!, startAngle: 145.873, endAngle: 161.643 }, // 16古度
    { label: '壁', color: MANSION_COLORS['壁']!, startAngle: 161.643, endAngle: 170.514 }, // 9古度

    // 西方白虎七宿 (170.514° → 249.365°)
    { label: '奎', color: MANSION_COLORS['奎']!, startAngle: 170.514, endAngle: 186.284 }, // 16古度
    { label: '娄', color: MANSION_COLORS['娄']!, startAngle: 186.284, endAngle: 198.112 }, // 12古度
    { label: '胃', color: MANSION_COLORS['胃']!, startAngle: 198.112, endAngle: 211.911 }, // 14古度
    { label: '昴', color: MANSION_COLORS['昴']!, startAngle: 211.911, endAngle: 222.753 }, // 11古度
    { label: '毕', color: MANSION_COLORS['毕']!, startAngle: 222.753, endAngle: 238.523 }, // 16古度
    { label: '觜', color: MANSION_COLORS['觜']!, startAngle: 238.523, endAngle: 240.494 }, // 2古度（最小）
    { label: '参', color: MANSION_COLORS['参']!, startAngle: 240.494, endAngle: 249.365 }, // 9古度

    // 南方朱雀七宿 (249.365° → 360°)
    { label: '井', color: MANSION_COLORS['井']!, startAngle: 249.365, endAngle: 281.891 }, // 33古度（最大）
    { label: '鬼', color: MANSION_COLORS['鬼']!, startAngle: 281.891, endAngle: 285.834 }, // 4古度
    { label: '柳', color: MANSION_COLORS['柳']!, startAngle: 285.834, endAngle: 300.618 }, // 15古度
    { label: '星', color: MANSION_COLORS['星']!, startAngle: 300.618, endAngle: 307.517 }, // 7古度
    { label: '张', color: MANSION_COLORS['张']!, startAngle: 307.517, endAngle: 325.258 }, // 18古度
    { label: '翼', color: MANSION_COLORS['翼']!, startAngle: 325.258, endAngle: 342.999 }, // 18古度
    { label: '轸', color: MANSION_COLORS['轸']!, startAngle: 342.999, endAngle: 360 }      // 17古度
  ]
}
