export type {
  RingData,
  RingItem,
  PointRingData,
  PointItem,
  BodyRingData,
  BodyItem,
  BodyKind,
  LuminaryKey,
  BodyState,
  Halo
} from './types'

export { twentyFourSolarTerms } from './twentyFourSolarTerms'
export { twentyEightConstellations } from './twentyEightConstellations'
export { sixtyJiazi } from './sixtyJiazi'
export { sixtyJiaziNayin } from './sixtyJiaziNayin'
export { heavenlyStems } from './heavenlyStems'
export { tianganKongwang } from './tianganKongwang'
export { twelveLongevity } from './twelveLongevity'
export { eightGates } from './eightGates'
export { siXiang } from './siXiang'
export { twelveShichen } from './twelveShichen'
export { twentyFourMountains, MOUNTAIN_NAMES, MOUNTAIN_CENTERS, colorOfMountain } from './twentyFourMountains'

// ⚠️ 天体环统一架构
// 七曜配置的【唯一真相源】，所有组件必须从这里导入
export {
  LUMINARY_KEYS,
  LUMINARY_CONFIG,
  getLuminarySize,
  getLuminaryHalos,
  type LuminaryVisualConfig
} from './sevenLuminaries'

// 天体环数据构造器
export {
  singlePlanetBody,
  twoPlanetsBody,
  sevenLuminariesBody,
  emptyBodyRing
} from './sevenLuminaries'

// 配套渲染组件（src/components/rings/）：
//   SevenLuminariesRing.vue - 七曜全图天体环
//   SinglePlanetRing.vue - 单行星深度研究环
//   MansionDegreeRing.vue - 入宿度标记环
//   DataBodyRing.vue - 底层数据驱动天体环

// 配套 Composable（src/composables/）：
//   useSevenLuminaries.ts - 统一的七曜位置/状态计算
