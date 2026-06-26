/**
 * 圆环数据层类型定义
 *
 * 把"画什么"（数据）与"怎么画"（DataRing 渲染）、"画在哪"（RingStack 布局）解耦。
 * 每个传统圆环（地支、天干、纳音……）只需提供一个 RingData 对象，
 * 不再各自编写近乎重复的 .vue 组件。
 *
 * 类型继承关系（三级统一体系）：
 *   RingItemBase          PointItemBase         BodyItemBase
 *        ↓                      ↓                      ↓
 *    RingItem              PointItem              BodyItem
 *        ↓                      ↓                      ↓
 *    RingData              PointRingData          BodyRingData
 *
 * 三种圆环类型：
 *   - CircleRing (段导向)：扇形区间，如十二地支、六十甲子
 *   - PointRing  (点导向)：精确角度点，如二十四节气刻度
 *   - BodyRing   (体导向)：发光天体，如七曜、恒星（新增）
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
  /** tick 刻度线内侧起始比例（0=从内圆开始，1=从外圆开始）
   *  用于主副刻度区分：主刻度 0, 副刻度 0.3
   */
  tickInnerRatio?: number
  /** tick 刻度线外侧结束比例（0=从内圆开始，1=从外圆开始）
   *  默认 1.0 = 画到外圆。标准罗盘刻度：从外圆向内画，tickOuterRatio 控制起始点
   */
  tickOuterRatio?: number
  /** tick 刻度线宽度（像素） */
  tickWidth?: number
  /** 点/刻度的透明度（0-1） */
  opacity?: number
}

/** 点导向圆环的数据与样式 */
export interface PointRingData extends RingDataBase {
  /** 该环的点数据 */
  items: PointItem[]
  /** 标签径向偏移：正数向外，负数向内 */
  labelOffset?: number
  /** 标签半径计算基准：'outer' 相对于外半径（点符号），'inner' 相对于内半径（刻度线） */
  labelOffsetBase?: 'outer' | 'inner'
  /** 标签角度偏移（度）：相对于点偏移一定角度，避免与刻度线重叠 */
  labelAngleOffset?: number
  /** 默认点大小 */
  pointSize?: number
  /** 默认点颜色 */
  pointColor?: string
  /** 默认点符号 */
  pointSymbol?: 'circle' | 'diamond' | 'tick'
  /** tick 刻度线内侧起始比例（0=从内圆开始，1=从外圆开始） */
  tickInnerRatio?: number
  /** tick 刻度线外侧结束比例（0=从内圆开始，1=从外圆开始） */
  tickOuterRatio?: number
  /** tick 刻度线默认宽度 */
  tickWidth?: number
}

/* ──────────────────────────────────────────────
   BodyRing: 天体导向圆环（单角度发光体）
   用于七曜、恒星等单个天体在圆环上的定位与可视化
   ────────────────────────────────────────────── */

/** 参与相位检测的天体键名（日月五星） */
export type LuminaryKey = 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn'

/** 天体类型：日月五星 + 通用恒星 */
export type BodyKind = LuminaryKey | 'star'

import type { PlanetMotion } from '@/utils/celestial'

/**
 * 天体特殊状态集合
 *
 * 包含七曜（日月五星）的各类动态状态，
 * 供 DataBodyRing 渲染不同视觉效果使用。
 * 所有字段均为可选，不存在的状态不渲染。
 */
export interface BodyState {
  /** 是否逆行（仅五星，日月恒为 false） */
  retrograde?: boolean
  /** 黄道纬度（度），用于天体径向偏移渲染 */
  latitude?: number
  /** 相位事件类型：合 / 冲 */
  aspect?: 'conjunction' | 'opposition'
  /** 入宿信息：宿名 + 度数 */
  mansion?: { label: string; degree: number }
  /** 上下合类型（仅内行星：水星、金星） */
  conjunctionKind?: 'inferior' | 'superior'
  /** 五星运动状态（疾/顺/迟/守/逆），日月无此字段 */
  motion?: PlanetMotion
  /** 守宿事件信息（预留字段，暂未实现自动检测） */
  mansionEvent?: { label: string; type: 'stationing' | 'conjunction' }
}

/** 光晕配置 */
export interface Halo {
  /** 光晕半径（px，绝对值） */
  radius: number
  /** 透明度 */
  opacity: number
}

/** 天体导向圆环：单个体的数据 */
export interface BodyItem extends RingItemBase {
  /** 天体精确角度（度） */
  angle: number
  /** 天体类型 */
  kind: BodyKind
  /** 光晕层数映射：0=无光晕，1=弱，2=中，3=强（优先于 highlightLevel） */
  haloLevel?: 0 | 1 | 2 | 3
  /** 天体特殊状态 */
  state?: BodyState
  /** 单字符号（复写基类，必选） */
  symbol: string
  /** 颜色（复写基类，必选） */
  color: string
  /** 本体半径（px） */
  size?: number
  /** 符号颜色 */
  symbolColor?: string
}

/** 天体导向圆环的数据与样式 */
export interface BodyRingData extends RingDataBase {
  /** 该环的天体数据（1~N 个） */
  items: BodyItem[]
  /** 默认光晕配置（外→内） */
  defaultHalos?: Halo[]
  /** 黄纬偏移缩放因子（像素/sin纬） */
  latScale?: number
  /** 是否显示黄纬偏移指示线 */
  showLatLine?: boolean
  /** 是否显示逆行标记环 */
  showRetrogradeRing?: boolean
  /** 标签径向偏移：正数向外，负数向内 */
  labelOffset?: number
}
