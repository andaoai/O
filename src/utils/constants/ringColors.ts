/**
 * 圆环默认配色 · 单一真理源
 *
 * ═══════════════════════════════════════════════════════════════
 *  历史遗留：非当前格灰色在 5 个环里以 3 种色阶散落：
 *    - `#555`：BranchesRing / SixtyJiaziRing / StemsRing
 *    - `#666`：HourShichenRing / MonthEstablishRing
 *    - `#888`：MonthGeneralRing
 *  这些差异不是设计意图而是自然漂移。此处统一到 `#555`。
 *
 *  圈边 `#555555` 与刻度 `#666666` 也频繁散落于多个数据文件与
 *  组件默认值中，一并收敛。
 *
 *  ⚠️ 组件仍可通过 props 覆盖默认色（如 MonthEstablishRing 用
 *   金色 `#9C6B22`），本模块只负责"缺省灰"路径。
 * ═══════════════════════════════════════════════════════════════
 */

/** 非当前格 / 未选中态灰色 */
export const INACTIVE_GREY = '#555'

/** 圈边默认色（CircleRing / DataRing 默认值） */
export const RING_CIRCLE_DEFAULT_COLOR = '#555555'

/** 刻度默认色（PointRing / DataPointRing 默认值） */
export const RING_TICK_DEFAULT_COLOR = '#666666'
