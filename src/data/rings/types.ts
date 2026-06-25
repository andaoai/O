/**
 * 圆环数据层类型定义
 *
 * 把"画什么"（数据）与"怎么画"（DataRing 渲染）、"画在哪"（RingStack 布局）解耦。
 * 每个传统圆环（地支、天干、纳音……）只需提供一个 RingData 对象，
 * 不再各自编写近乎重复的 .vue 组件。
 *
 * 类型继承关系：
 *   RingItemBase          PointItemBase
 *        ↓                      ↓
 *    RingItem              PointItem
 *        ↓                      ↓
 *    RingData              PointRingData
 */

/* ──────────────────────────────────────────────
   基础类型（所有圆环通用）
   ────────────────────────────────────────────── */

/** 所有圆环 item 的共同基础字段 */
export interface RingItemBase {
  /** 标签文字 */
  label: string
  /** 自定义颜色（同时影响点和标签，缺省用 style 默认） */
  color?: string
  /** 自定义字号 */
  fontSize?: number
  /** 高亮：呼吸发光 + 文字脉动 */
  highlight?: boolean
  /** 分级高亮（优先于 highlight）：0/缺省 不亮，1 微亮，2 中亮，3 强亮 */
  highlightLevel?: 0 | 1 | 2 | 3
}

/** 所有圆环 data 的共同基础字段 */
export interface RingDataBase {
  /** 默认起始度数偏移 */
  startDegree?: number
  /** 默认半径 */
  radius?: number
  /** 默认内半径 */
  innerRadius?: number
  /** 标签默认颜色 */
  labelColor?: string
  /** 统一字号（item.fontSize 优先） */
  fontSize?: number
  /** 圆环边线颜色 */
  circleColor?: string
  /** 圆环边线宽 */
  circleWidth?: number
}

/* ──────────────────────────────────────────────
   CircleRing: 段导向圆环（扇形区间）
   ────────────────────────────────────────────── */

/** 段导向圆环：单个分格的数据 */
export interface RingItem extends RingItemBase {
  /** 自定义起始角度（可选，缺省按 items 均分 360°） */
  startAngle?: number
  /** 自定义结束角度（可选） */
  endAngle?: number
}

/** 段导向圆环的数据与样式 */
export interface RingData extends RingDataBase {
  /** 该环的分格数据 */
  items: RingItem[]
  /** 标签径向位置比例 (0-1) */
  labelPosition?: number
  /** 刻度线宽 */
  tickWidth?: number
  /** 刻度线颜色 */
  tickColor?: string
  /** 是否显示扇形背景 */
  showSectors?: boolean
  /** 双字标签是否竖排 */
  verticalTwoChar?: boolean
}

/* ──────────────────────────────────────────────
   PointRing: 点导向圆环（精确角度点）
   ────────────────────────────────────────────── */

/** 点导向圆环：单个点的数据 */
export interface PointItem extends RingItemBase {
  /** 点的精确角度（可选，缺省按 items 均分） */
  angle?: number
  /** 点的大小（像素） */
  pointSize?: number
  /** 点的颜色（独立于标签颜色） */
  pointColor?: string
  /** 点的符号形状 */
  pointSymbol?: 'circle' | 'diamond' | 'tick'
}

/** 点导向圆环的数据与样式 */
export interface PointRingData extends RingDataBase {
  /** 该环的点数据 */
  items: PointItem[]
  /** 标签径向偏移：正数向外，负数向内 */
  labelOffset?: number
  /** 标签角度偏移（度）：相对于点偏移一定角度，避免与刻度线重叠 */
  labelAngleOffset?: number
  /** 默认点大小 */
  pointSize?: number
  /** 默认点颜色 */
  pointColor?: string
  /** 默认点符号 */
  pointSymbol?: 'circle' | 'diamond' | 'tick'
}
