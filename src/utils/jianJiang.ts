/**
 * 斗建 · 月将 12 宫定义（观斗盘赤道十二辰 / 黄道十二次单一真理源）
 *
 * 「建月」（斗建）与「月将」（日缠）是古代天文中的一对时空标尺：
 *   · 建月：北斗七星斗柄的赤道十二辰指向，一年转一圈。
 *           斗柄指寅=正月建寅、指卯=二月建卯……
 *   · 月将：太阳所在的黄道十二次，一年转一圈。
 *           正月太阳在娵訾、二月在降娄……
 *
 * 两者一北一南（北斗看极地、太阳看黄道），在同一月序上对偶：
 *   正月：斗柄指寅、日在娵訾（黄经 330°~360°）
 *   二月：斗柄指卯、日在降娄（黄经 0°~30°）
 *   ……
 *
 * 依据：《汉书·律历志》、《淮南子·天文训》。
 * 本表用「日缠」定义月将（即太阳当月所在星次），非命理「特神」体系。
 *
 * ⚠️ 五层架构：纯常量 + 纯函数，无副作用。
 */

import { sunLongitude } from './celestial'
import { normalizeAngle } from './geometry'

/** 十二次名（黄道星次） */
export type GeneralName =
  | '娵訾' | '降娄' | '大梁' | '实沈'
  | '鹑首' | '鹑火' | '鹑尾' | '寿星'
  | '大火' | '析木' | '星纪' | '玄枵'

/** 斗建 · 月将 12 宫单项 */
export interface MonthEstablishItem {
  /** 月序：1=正月，12=腊月 */
  month: number
  /** 月建地支（寅起） */
  branch: string
  /** 地支索引（子=0…亥=11） */
  branchIndex: number
  /** 月将（十二次名） */
  general: GeneralName
  /** 太阳黄经区间起（度，含） */
  sunLonStart: number
  /** 太阳黄经区间止（度，不含）。跨 360° 时 end < start（如娵訾 330→0） */
  sunLonEnd: number
}

/**
 * 斗建 · 月将 12 宫表：以「正月建寅、日在娵訾」为起点。
 *
 * 太阳黄经区间以春分点（黄经 0°）为参考：
 *   - 春分（黄经 0°）→ 太阳入降娄 → 对应二月建卯
 *   - 娵訾覆盖 330°~360°（相当于双鱼座后半段），对应正月太阳位
 *
 * 数组顺序按月序 1→12（寅→卯→…→丑），
 * 便于视图直接 `.map()` 生成月建环 items（items[0]=寅=正月）。
 */
export const MONTH_ESTABLISH: readonly MonthEstablishItem[] = [
  { month: 1,  branch: '寅', branchIndex: 2,  general: '娵訾', sunLonStart: 330, sunLonEnd: 360 },
  { month: 2,  branch: '卯', branchIndex: 3,  general: '降娄', sunLonStart: 0,   sunLonEnd: 30  },
  { month: 3,  branch: '辰', branchIndex: 4,  general: '大梁', sunLonStart: 30,  sunLonEnd: 60  },
  { month: 4,  branch: '巳', branchIndex: 5,  general: '实沈', sunLonStart: 60,  sunLonEnd: 90  },
  { month: 5,  branch: '午', branchIndex: 6,  general: '鹑首', sunLonStart: 90,  sunLonEnd: 120 },
  { month: 6,  branch: '未', branchIndex: 7,  general: '鹑火', sunLonStart: 120, sunLonEnd: 150 },
  { month: 7,  branch: '申', branchIndex: 8,  general: '鹑尾', sunLonStart: 150, sunLonEnd: 180 },
  { month: 8,  branch: '酉', branchIndex: 9,  general: '寿星', sunLonStart: 180, sunLonEnd: 210 },
  { month: 9,  branch: '戌', branchIndex: 10, general: '大火', sunLonStart: 210, sunLonEnd: 240 },
  { month: 10, branch: '亥', branchIndex: 11, general: '析木', sunLonStart: 240, sunLonEnd: 270 },
  { month: 11, branch: '子', branchIndex: 0,  general: '星纪', sunLonStart: 270, sunLonEnd: 300 },
  { month: 12, branch: '丑', branchIndex: 1,  general: '玄枵', sunLonStart: 300, sunLonEnd: 330 }
] as const

/**
 * 由太阳黄经找到对应的月将（十二次索引，0=娵訾…11=玄枵）。
 *
 * 娵訾跨 360° → 需特殊处理：sunLon ≥ 330 或 sunLon < 0 都归娵訾。
 * 本函数已把 sunLon 归一化到 [0, 360)。
 */
export const findGeneralIndexBySunLon = (sunLon: number): number => {
  const lon = normalizeAngle(sunLon)
  // 娵訾特殊：330–360
  if (lon >= 330) return 0
  // 其余 items[1..11]：起于降娄 (0–30)，每 30° 一格
  return Math.floor(lon / 30) + 1
}

/**
 * 由时间取当前月将索引（0-11，索引对应 MONTH_ESTABLISH 数组下标）。
 *
 * @param time 观测时刻
 */
export const getCurrentGeneralIndex = (time: Date): number => {
  return findGeneralIndexBySunLon(sunLongitude(time))
}

/* ══════════════════════════════════════════════════════════════
 *  面朝北仰望方位映射（Facing-North-Looking-Up Coordinate）
 *
 *  古人观星以"面朝北抬头"为标准姿势：右手东、左手西、头顶南、脚下北。
 *  斗柄绕北极星逆时针旋转，指向"右手边（东）"就是春。
 *
 *  本盘（观斗盘）三个环 + 斗柄射线 + 太阳射线，一律遵循此约定：
 *    子（北） → SVG 中心 90°（下）
 *    卯（东） → SVG 中心 0°（右）
 *    午（南） → SVG 中心 270°（上）
 *    酉（西） → SVG 中心 180°（左）
 *  地支顺序（子→丑→寅→卯）在盘上呈现为逆时针（下→右下→右）。
 *
 *  ⚠️ 这与项目其他盘（六十甲子六环等，用"上北下南"地图约定）方向不同。
 *  单一真理源统一在此文件，所有本盘组件从这里派生角度。
 * ══════════════════════════════════════════════════════════════ */

/**
 * 地支索引（子=0…亥=11）→ 屏幕 SVG 中心角度（度）。
 *
 * 公式：SVG = (90 − i × 30 + 360) mod 360
 *   子 (i=0) → 90°（下）
 *   卯 (i=3) → 0°（右）
 *   午 (i=6) → 270°（上）
 *   酉 (i=9) → 180°（左）
 */
export const branchIndexToScreenCenter = (i: number): number =>
  ((90 - i * 30) % 360 + 360) % 360

/**
 * 月将索引（0=娵訾…11=玄枵）→ 屏幕 SVG 中心角度。
 *
 * 与其对应月建地支同轴：娵訾↔寅、降娄↔卯、…、玄枵↔丑。
 * 保证"月建/月将"每对在盘上呈同一辐射方向，符合古人"斗建—日缠"对偶。
 */
export const generalIndexToScreenCenter = (i: number): number =>
  branchIndexToScreenCenter(MONTH_ESTABLISH[i]!.branchIndex)

/**
 * 太阳黄经 → 屏幕 SVG 角度（用于月将格中心对偶，含 -15° 偏移）。
 *
 * ⚠️ 这个函数带**格中心对齐偏移**，仅用于月将环及其配套（如日缠射线）。
 *   若你需要"精确黄经点"（如 24 节气），请用 `eclipticPointToScreenAngle`。
 *
 * 保持"每 30° 黄经对应一个月将格"的对应关系，同时格内按 sunLon 均分角度。
 *
 * 推导：
 *   娵訾中央黄经 345° 需映射到 SVG 30°（娵訾格中心 = 寅格中心）
 *   降娄中央黄经 15°  需映射到 SVG 0°  （降娄格中心 = 卯格中心）
 *   → SVG = (15 − sunLon + 360) mod 360
 */
export const sunLongitudeToScreenAngle = (lon: number): number =>
  ((15 - lon) % 360 + 360) % 360

/**
 * 黄经精确点 → 屏幕 SVG 角度（天文准确，无偏移）。
 *
 * 用于 24 节气等"精确黄经点"标记：
 *   春分（黄经 0°）→ 正东（SVG 0°）
 *   夏至（黄经 90°）→ 正南（SVG 270°，屏幕上方）
 *   秋分（黄经 180°）→ 正西（SVG 180°）
 *   冬至（黄经 270°）→ 正北（SVG 90°，屏幕下方）
 *
 * 与 `sunLongitudeToScreenAngle` 的差别：
 *   本函数无 -15° 偏移，节气点位置严格按天文黄经对应到方位角。
 *   两函数并存于同一盘时，会呈现**半格 15° 视觉错位**，正是
 *   "月建用节 / 月将用中气"这一固有相位差的直接可视化。
 */
export const eclipticPointToScreenAngle = (lon: number): number =>
  ((360 - lon) % 360 + 360) % 360

/**
 * 生成"环 items 的 [startAngle, endAngle]"帮助工具，
 * 让 CircleRing 每格宽度 30°、居中在给定 SVG 中心角。
 *
 * 跨界情况（如卯 SVG 中心 0°，跨 [345°, 15°)）用 endAngle = startAngle + 30
 * 表达为 [345°, 375°]，与 twelveShichen 处理跨界"子"的做法一致，
 * CircleRing 内部按小弧渲染无问题。
 */
export const centerToArcSpan = (centerDeg: number): { startAngle: number; endAngle: number } => {
  const startAngle = ((centerDeg - 15) % 360 + 360) % 360
  return { startAngle, endAngle: startAngle + 30 }
}
