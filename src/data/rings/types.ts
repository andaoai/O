/**
 * 圆环数据层类型定义
 *
 * 把"画什么"（数据）与"怎么画"（DataRing 渲染）、"画在哪"（RingStack 布局）解耦。
 * 每个传统圆环（地支、天干、纳音……）只需提供一个 RingData 对象，
 * 不再各自编写近乎重复的 .vue 组件。
 */

/** 圆环上单个分格的数据 */
export interface RingItem {
  /** 标签文字 */
  label: string
  /** 自定义颜色（可选，缺省用 style.labelColor） */
  color?: string
  /** 自定义字号（可选） */
  fontSize?: number
  /** 自定义起始角度（可选，缺省按 items 均分 360°） */
  startAngle?: number
  /** 自定义结束角度（可选） */
  endAngle?: number
  /** 高亮当前格：呼吸扇形背景 + 文字脉动（可选，默认 false） */
  highlight?: boolean
  /**
   * 分级高亮（可选，优先于 highlight）：
   *   0/缺省 不亮，1 微亮（仅文字，不画扇形），2 中亮（呼吸扇形），3 强亮（强呼吸+大字）
   */
  highlightLevel?: 0 | 1 | 2 | 3
}

/** 圆环的样式与默认布局，描述这个环"长什么样" */
export interface RingData {
  /** 该环的分格数据 */
  items: RingItem[]
  /** 默认起始度数偏移（可被 App 配置覆盖） */
  startDegree?: number
  /** 默认外半径（单独使用时的回退值，RingStack 下由布局接管） */
  radius?: number
  /** 默认内半径 */
  innerRadius?: number
  /** 标签默认颜色 */
  labelColor?: string
  /** 标签径向位置比例 (0-1) */
  labelPosition?: number
  /** 统一字号（item.fontSize 优先） */
  fontSize?: number
  /** 刻度线宽 */
  tickWidth?: number
  /** 刻度线颜色 */
  tickColor?: string
  /** 圆环边线颜色 */
  circleColor?: string
  /** 圆环边线宽 */
  circleWidth?: number
  /** 是否显示扇形背景 */
  showSectors?: boolean
  /** 双字标签是否竖排 */
  verticalTwoChar?: boolean
}

/* ──────────────────────────────────────────────
   PointRing: 点导向圆环（PointRing）
   ────────────────────────────────────────────── */

/** 点圆环上单个点的数据 */
export interface PointItem {
  /** 标签文字 */
  label: string
  /** 自定义颜色（同时影响点和标签，缺省用 style 默认） */
  color?: string
  /** 自定义字号 */
  fontSize?: number
  /** 点的精确角度（必填，不填则均分） */
  angle?: number
  /** 点的大小（像素） */
  pointSize?: number
  /** 点的颜色（独立于标签颜色） */
  pointColor?: string
  /** 点的符号形状 */
  pointSymbol?: 'circle' | 'diamond' | 'tick'
  /** 高亮当前点：呼吸发光 + 文字脉动 */
  highlight?: boolean
  /** 分级高亮（优先于 highlight）：0/缺省 不亮，1 微亮，2 中亮，3 强亮 */
  highlightLevel?: 0 | 1 | 2 | 3
}

/** 点圆环的样式与默认布局 */
export interface PointRingData {
  /** 该环的点数据 */
  items: PointItem[]
  /** 默认起始度数偏移 */
  startDegree?: number
  /** 默认半径（点所在位置） */
  radius?: number
  /** 默认内半径（用于画内边界圆，0=不画） */
  innerRadius?: number
  /** 标签默认颜色 */
  labelColor?: string
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
  /** 圆环边线颜色 */
  circleColor?: string
  /** 圆环边线宽 */
  circleWidth?: number
  /** 统一字号（item.fontSize 优先） */
  fontSize?: number
}
