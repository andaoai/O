<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import BaseCenter from '@/components/base/BaseCenter.vue'
import {
  beidouPositions,
  magnitudeToRadius,
  localSiderealTimeDeg
} from '@/utils/beidou'
import {
  ziweiPositions,
  ZIWEI_EAST_WALL,
  ZIWEI_WEST_WALL,
  POLARIS
} from '@/utils/ziwei'
import { MANSION_ASTERISMS } from '@/data/mansionStars'
import { CHINESE_ASTERISMS, type ChineseAsterism } from '@/data/chineseStarCatalog'
import { getMansionSpans } from '@/utils/planetMansion'
import {
  project,
  eclipticToEquatorial,
  moonPointToEquatorial
} from '@/utils/skyProjection'
import {
  fixedStarEquatorial,
  sunEquatorial,
  moonEquatorial,
  planetEquatorial,
  lunarOrbit,
  PLANETS_CONFIG,
  type PlanetKey
} from '@/utils/celestial'
import { normalizeAngle } from '@/utils/geometry'

/**
 * ⚫ 苏州石刻天文图 · 圆心星图主体（时间驱动）
 *
 * ⚠️ 五层架构规范：圆心组件
 *   - 只有 radius,无 innerRadius（圆心组件禁止声明 innerRadius）
 *   - 通过 RingStack #center slot 使用
 *   - 时间驱动统一范式：MaybeRef<Date> + timeRef computed
 *
 * ═══════════════════════════════════════════════════════════════
 *  苏图灵魂 = 三个同心圆 + 二十八根不等宽径向辐条 + 中央拱极北斗
 * ═══════════════════════════════════════════════════════════════
 *
 * 本组件在 BeidouCenter 的基础上扩展 3 层新元素：
 *
 *   ① 三规圆（观测点 φ=35° 汴京,苏图底本）
 *      · 内规 δ=+55° → r=φ/90=0.389 （恒显圈,拱极星永不落下）
 *      · 赤道 δ=0°   → r=1           （天中规）
 *      · 外规 δ=−55° → r=(180-φ)/90=1.611 （恒隐圈,永不升起,超出可视需 clipPath 裁剪）
 *
 *   ② 二十八根不等宽径向辐条 —— 每宿距星处从北极辐射到外规
 *      井 33° / 觜 2° 宽窄悬殊,是苏图最鲜明的视觉特征
 *
 *   ③ 二十八宿完整星官 —— 165 颗星 + 星官连线拓扑
 *      数据源:Stellarium 官方 Chinese Sky Culture
 *      坐标: SIMBAD ICRS J2000（通过 HIP 编号批量查询）
 *      运行时用 astronomy-engine `Equator(ofdate=true)` 做岁差修正
 *
 * 保留 BeidouCenter 现有能力：
 *   · 北斗七星连线 + 星名
 *   · 紫微垣东西两藩连线 + 星名
 *   · 北极星（勾陈一）四芒标记
 *   · 天极中心十字
 *
 * 投影口径：BeidouCenter 口径 `projAngle = LST − RA + 90°`（面朝北仰望）
 *   与紫微垣、北斗七星共享同一投影管道,确保内外几何完全对齐。
 */
interface Props {
  /** 圆心区半径(RingStack #center slot 提供的 innerRadius) */
  radius?: number
  /** 星图缩放系数 */
  scale?: number
  /** 时间源 */
  time?: MaybeRef<Date>
  /** 旋转方向 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
  /** 观测者纬度(度,苏图底本汴京 φ=35°) */
  observerLat?: number
  /** 观测者经度(度,东正西负,苏图底本汴京 λ=116.4°) */
  observerLon?: number
  /** 显示中文标签 */
  showLabels?: boolean
  /** 显示三规圆 */
  showThreeRegulae?: boolean
  /** 显示 28 宿径向辐条 */
  showMansionSpokes?: boolean
  /** 显示 28 宿完整星官 */
  showMansionStars?: boolean
  /** 显示紫微垣两藩 */
  showZiwei?: boolean
  /** 显示北斗七星 */
  showBeidou?: boolean
  /** 显示天极十字 */
  showPole?: boolean
  /** 显示黄道 */
  showEcliptic?: boolean
  /** 显示白道 */
  showWhiteWay?: boolean
  /** 显示地平线 */
  showHorizon?: boolean
  /** 显示太阳 */
  showSun?: boolean
  /** 显示月亮 */
  showMoon?: boolean
  /** 显示五星（水金火木土） */
  showPlanets?: boolean
  /**
   * 盘面朝向模式:
   *   · 'fixed-ground'      观测者视角:头顶固定朝上,星宿随时间旋转,地平线不动
   *   · 'fixed-sky-coord'   坐标视角:春分点(RA=0)固定朝上,星宿静止,地平线绕极旋转
   *   · 'fixed-sky-suzhou'  苏图视角:井宿朝上 + 东西镜像,复原南宋石刻实物布局
   */
  orientation?: 'fixed-ground' | 'fixed-sky-coord' | 'fixed-sky-suzhou'
  /**
   * 星官显示模式：
   *   · 'classic' 经典版：仅 28 宿主星官（当前默认）
   *   · 'full'    全星官版：28 宿 + 附属星官 + 三垣墙
   */
  detailMode?: 'classic' | 'full'
  /** 显示附属星官（仅 full 模式有效） */
  showSubAsterisms?: boolean
  /** 显示三垣墙（仅 full 模式有效） */
  showEnclosures?: boolean
  /**
   * 画布缩放倍数（由 View 层传入，全星官模式为 3）。
   * computeFullAsterismPoints 用此值等比放大星点半径和线宽，
   * 保证不同 viewBox 下视觉效果一致。
   */
  canvasScale?: number
}

const props = withDefaults(defineProps<Props>(), {
  radius: 300,
  scale: 0.98,
  rotationDirection: 'clockwise',
  observerLat: 35,           // 苏图底本汴京(北宋首都)
  observerLon: 116.4,        // 苏图底本汴京
  showLabels: true,
  showThreeRegulae: true,
  showMansionSpokes: true,
  showMansionStars: true,
  showZiwei: true,
  showBeidou: true,
  showPole: true,
  showEcliptic: true,
  showWhiteWay: true,
  showHorizon: true,
  showSun: true,
  showMoon: true,
  showPlanets: true,
  orientation: 'fixed-ground',
  detailMode: 'classic',
  showSubAsterisms: true,
  showEnclosures: true,
  canvasScale: 1
})

/** ⚠️ 五层架构范式:确保 time 始终是响应式的 */
const timeRef = computed(() => unref(props.time) ?? new Date())

/**
 * 盘面朝向偏移量(度)。
 *
 * 关键机制:所有天体的 projAngle 统一 `减去 orientOffset` 完成整盘旋转。
 * 由于 LST 是自转周期的相位,把它减掉即等价于"以某个赤经为方位角零点"。
 *
 *   · fixed-ground     : offset = 0
 *       → projAngle = LST − RA + 90        → 观测者视角:头顶朝上,星宿旋转
 *   · fixed-sky-coord  : offset = LST
 *       → projAngle = −RA + 90              → 现代星图:春分点(RA=0)朝上
 *   · fixed-sky-suzhou : offset = LST − SUZHOU_TOP_RA
 *       → projAngle = SUZHOU_TOP_RA − RA + 90 → 苏图起点:心宿二(大火)朝上
 *
 * 两个"固定赤道"模式只差一个常量旋转;方向都是东在右、西在左(观测者视角),
 * 不做镜像 —— 单纯把"朝上的赤经零点"从春分点换成苏图约定的南中天。
 *
 * 地平线原公式为 (HA + 90),减去 offset 后:
 *   · fixed-ground     : HA + 90                       → 静止(仅依赖 φ 与 A)
 *   · fixed-sky-coord  : HA + 90 − LST                 → 绕极旋转
 *   · fixed-sky-suzhou : HA + 90 − LST + TOP_RA        → 绕极旋转(相位差 95°)
 */

/**
 * 苏图石刻"顶部"对应的赤经(度)。
 *
 * 定位基准:心宿二(大火,α Sco / Antares) —— 中国古代夏至南中天的标志。
 *   《尚书·尧典》「日永星火,以正仲夏」即以"火"(心宿二)昏中定夏至,
 *   《诗·豳风》「七月流火,九月授衣」亦以此星每岁的南中偏移作农时刻度。
 *   苏图以此为图顶,把大火星心作为南方朱雀方位的锚,对应 SVG 顶部。
 *
 * ⚠️ 数值经用户实测调整为 −25°(≡ 335°):该值使心宿二实际落到盘面顶部,
 *    与心宿二当前历元赤经的原始值不同 —— 差值来自"图顶对应昏中时角相位"
 *    这一约定(非天极子午圈,而是黄昏正南),另含苏图石刻自身的相位偏置。
 */
const SUZHOU_TOP_RA = -25

const orientOffset = computed(() => {
  if (props.orientation === 'fixed-ground') return 0
  const lst = localSiderealTimeDeg(timeRef.value, props.observerLon)
  if (props.orientation === 'fixed-sky-suzhou') return lst - SUZHOU_TOP_RA
  return lst // fixed-sky-coord
})

/* ═══════════════════════════════════════════════════════════════
 *  数据层:所有派生自 timeRef
 * ═══════════════════════════════════════════════════════════════ */

/** 北斗七星当前历元位置(含岁差 + LST) */
const beidou = computed(() => beidouPositions(timeRef.value, props.observerLon))

/** 紫微垣两藩 + 北极星(与北斗共享投影) */
const ziwei = computed(() => ({
  east: ziweiPositions(ZIWEI_EAST_WALL, timeRef.value, 8, props.observerLon),
  west: ziweiPositions(ZIWEI_WEST_WALL, timeRef.value, 16, props.observerLon),
  polaris: ziweiPositions([POLARIS], timeRef.value, 24, props.observerLon)[0]!
}))

/**
 * 28 宿完整星官投影（数据来自 Stellarium 官方 Chinese Sky Culture）。
 *
 * 复用与 BeidouCenter / 紫微 完全相同的投影管道：
 *   projAngle = LST − RA + 90°   （面朝北仰望约定）
 *   plane     = project(projAngle, dec)
 *
 * 结构：MANSION_ASTERISMS[i] = { label, quadrant, color, stars[], connections[] }
 *   → 派生出 mansionAsterisms[i] = { ..., stars: [ 每颗星带 plane 坐标 ] }
 *
 * ⚠️ STAR_SLOTS 长度为 8,fixedStarEquatorial 内部串行调用 slot % 8 → 覆盖安全。
 *    slot 从 32 起,避开北斗（0-6）与紫微垣（8-24）的占用范围。
 *
 * 岁差：astronomy-engine `Equator(ofdate=true)` 自动包含岁差章动 ——
 *      苏图 1247 年星位可通过 URL `?t=1247-01-01T20:00` 直接可视化。
 */
const mansionAsterisms = computed(() => {
  const lst = localSiderealTimeDeg(timeRef.value, props.observerLon)
  let slotCursor = 32 // 避开北斗（0-6）、紫微（8-24）
  return MANSION_ASTERISMS.map((asterism) => ({
    ...asterism,
    stars: asterism.stars.map((s) => {
      const slot = slotCursor++
      const eq = fixedStarEquatorial(timeRef.value, s.raJ2000, s.decJ2000, 200, slot)
      const projAngle = normalizeAngle(lst - eq.ra + 90)
      return {
        ...s,
        ra: eq.ra,
        dec: eq.dec,
        plane: project(projAngle, eq.dec)
      }
    })
  }))
})

/**
 * 全星官模式下的所有星官（从 chineseStarCatalog 读取）。
 *
 * 只在 detailMode === 'full' 时激活，避免不必要的计算。
 * 处理所有 318 个星官条目（宿、附属星官、三垣墙）通过投影管道。
 *
 * ⚠️ slotCursor 从 1000 起步，避开北斗（0-6）与紫微（8-24）的占用范围。
 */
const fullAsterisms = computed(() => {
  if (props.detailMode !== 'full') return []
  const lst = localSiderealTimeDeg(timeRef.value, props.observerLon)
  let slotCursor = 1000
  return CHINESE_ASTERISMS.map((asterism: ChineseAsterism) => ({
    ...asterism,
    stars: asterism.stars.map((s) => {
      const slot = slotCursor++
      const eq = fixedStarEquatorial(timeRef.value, s.raJ2000, s.decJ2000, 200, slot)
      const projAngle = normalizeAngle(lst - eq.ra + 90)
      return {
        ...s,
        ra: eq.ra,
        dec: eq.dec,
        plane: project(projAngle, eq.dec)
      }
    })
  }))
})

/** 28 宿区间(用于辐条位置:距星赤经边界) */
const spans = computed(() => getMansionSpans(timeRef.value))

/**
 * 黄道采样点（黄经 0-360°,每 3° 一点,共 120 点）
 * 用 eclipticToEquatorial 转赤道,再走统一投影管道
 */
const eclipticSamples = computed(() => {
  const lst = localSiderealTimeDeg(timeRef.value, props.observerLon)
  const out: { ra: number; dec: number }[] = []
  for (let lon = 0; lon <= 360; lon += 3) {
    const eq = eclipticToEquatorial(lon, 0)
    out.push({ ra: normalizeAngle(lst - eq.ra + 90), dec: eq.dec })
  }
  return out
})

/**
 * 白道采样点（沿升交点起 u ∈ [0,360),每 3°）
 * lunarOrbit 提供当前时刻升交点黄经 + 交角
 */
const whiteWaySamples = computed(() => {
  const orbit = lunarOrbit(timeRef.value)
  const lst = localSiderealTimeDeg(timeRef.value, props.observerLon)
  const out: { ra: number; dec: number }[] = []
  for (let u = 0; u <= 360; u += 3) {
    const eq = moonPointToEquatorial(u, orbit.ascendingNodeLongitude, orbit.inclination)
    out.push({ ra: normalizeAngle(lst - eq.ra + 90), dec: eq.dec })
  }
  return out
})

/** 太阳赤道 + 投影角 */
const sunProj = computed(() => {
  const lst = localSiderealTimeDeg(timeRef.value, props.observerLon)
  const eq = sunEquatorial(timeRef.value)
  return { ra: eq.ra, dec: eq.dec, projAngle: normalizeAngle(lst - eq.ra + 90) }
})

/** 月亮赤道 + 投影角 */
const moonProj = computed(() => {
  const lst = localSiderealTimeDeg(timeRef.value, props.observerLon)
  const eq = moonEquatorial(timeRef.value)
  return { ra: eq.ra, dec: eq.dec, projAngle: normalizeAngle(lst - eq.ra + 90) }
})

/** 五星（水金火木土）赤道 + 投影角 */
const planetsProj = computed(() => {
  const lst = localSiderealTimeDeg(timeRef.value, props.observerLon)
  const keys: PlanetKey[] = ['mercury', 'venus', 'mars', 'jupiter', 'saturn']
  return keys.map((key) => {
    const eq = planetEquatorial(timeRef.value, key)
    const cfg = PLANETS_CONFIG[key]
    return {
      key,
      name: cfg.name,
      symbol: cfg.symbol,
      color: cfg.color,
      ra: eq.ra,
      dec: eq.dec,
      projAngle: normalizeAngle(lst - eq.ra + 90)
    }
  })
})

/**
 * 地平线采样点（观测者固定曲线,不随时间旋转）
 *
 * 在"面朝北仰望"投影下,地平线相对 SVG 坐标是静态的（仅依赖 φ）。
 * 参数化：方位角 A ∈ [0°=北, 90°=东, 180°=南, 270°=西],每 2° 一采样。
 *
 * 天文公式：
 *   δ   = asin(cos φ · cos A)                       // alt=0 时的赤纬
 *   |H| = acos(−tan φ · tan δ)                      // alt=0 时的时角绝对值
 *   H   = −|H|（东侧 sin A>0,未过中天） / +|H|（西侧,已过中天）
 *
 * projAngle = H + 90° 因为 projAngle = LST − RA + 90 且 H = LST − RA。
 * 关键节点：A=0(北) → δ=+55° H=+180° → 内规下方
 *          A=180(南) → δ=−55° H=0° → 外规上方
 */
const horizonSamples = computed(() => {
  const phi = (props.observerLat * Math.PI) / 180
  const out: { ra: number; dec: number }[] = []
  for (let A = 0; A <= 360; A += 2) {
    const a = (A * Math.PI) / 180
    const cosDec = Math.cos(phi) * Math.cos(a)
    const dec = Math.asin(Math.max(-1, Math.min(1, cosDec)))
    let cosH = -Math.tan(phi) * Math.tan(dec)
    cosH = Math.max(-1, Math.min(1, cosH))
    let H = Math.acos(cosH)
    // 东半(sin A > 0)时角 H<0（未过中天）,西半 H>0
    if (Math.sin(a) > 0) H = -H
    const decDeg = (dec * 180) / Math.PI
    const projAngle = normalizeAngle((H * 180) / Math.PI + 90)
    out.push({ ra: projAngle, dec: decDeg })
  }
  return out
})

/* ═══════════════════════════════════════════════════════════════
 *  投影→SVG 坐标(与 BeidouCenter 完全一致的口径)
 * ═══════════════════════════════════════════════════════════════ */

/**
 * dirSign：垂直翻转控制（与 BeidouCenter 同源,配合外环 polarToCartesian 的
 * counterclockwise 取反,保证内外几何一致）
 */
const dirSign = computed(() =>
  props.rotationDirection === 'counterclockwise' ? -1 : 1
)

/**
 * 七曜闪烁次序延迟映射表。
 *
 * 传统七曜序（自《尚书·尧典》《史记·天官书》以来的一贯顺序）：
 *   日 → 月 → 火 → 水 → 木 → 金 → 土
 * 每曜间隔 0.6s，总周期 4.2s，与 body-twinkle 动画 5s 周期配合形成连续波。
 */
const QIYAO_DELAY: Record<string, string> = {
  sun: '0s',
  moon: '0.6s',
  mars: '1.2s',
  mercury: '1.8s',
  jupiter: '2.4s',
  venus: '3.0s',
  saturn: '3.6s'
}

/**
 * 投影平面 → SVG 缩放系数工厂
 *
 * 让"赤道 δ=0°"（极径=1）落在 actualRadius 的 60% 处,这样：
 *   · 外规（极径 1.611） ≈ actualRadius 内侧
 *   · 内规（极径 0.389） ≈ actualRadius × 0.23
 * 三圆比例视觉平衡,外规超出的部分由 clipPath 裁剪。
 */
const projectionScale = (actualRadius: number): number => actualRadius * 0.6

/**
 * 数学平面 → SVG 坐标
 *
 * 中间插入 orientOffset 的旋转变换：把整盘绕天极转 −orientOffset,
 * 使 fixed-sky-* 模式下把指定 RA 转到盘面顶部。
 * fixed-ground 模式 orientOffset=0,退化为纯 y 取反。
 *
 * 三档模式全部保持"东在右、西在左"的观测者视角,不做镜像。
 */
const makeToSvg = (scale: number) => {
  const theta = (orientOffset.value * Math.PI) / 180
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)
  return (p: { x: number; y: number }) => {
    // 数学平面旋转 −θ:x' = x cos θ + y sin θ,y' = −x sin θ + y cos θ
    const xr = p.x * cos + p.y * sin
    const yr = -p.x * sin + p.y * cos
    return {
      x: xr * scale,
      y: -yr * scale * dirSign.value
    }
  }
}

/* ═══════════════════════════════════════════════════════════════
 *  派生视图数据(接收 actualRadius 参数,由 BaseCenter slot 提供)
 * ═══════════════════════════════════════════════════════════════ */

/**
 * 三规圆半径（观测者纬度 φ 唯一决定）：
 *   · 内规 恒显圈  δ=+(90−φ) → r = scale × φ/90       （拱极星永不落下）
 *   · 赤道 天中规  δ=0       → r = scale               （赤道半径基准）
 *   · 外规 恒隐圈  δ=−(90−φ) → r = scale × (180−φ)/90 （永不升起,通常超出 clip 边界）
 */
const computeRegulae = (actualRadius: number) => {
  const scale = projectionScale(actualRadius)
  const phi = props.observerLat
  return {
    inner: (scale * phi) / 90,
    equator: scale,
    outer: (scale * (180 - phi)) / 90
  }
}

/**
 * 28 宿径向辐条 —— 每宿距星起始赤经处从北极辐射到外规。
 * 井 33° / 觜 2° 宽窄悬殊,是苏图最鲜明的视觉特征。
 */
const computeSpokes = (actualRadius: number) => {
  const scale = projectionScale(actualRadius)
  const lst = localSiderealTimeDeg(timeRef.value, props.observerLon)
  const toSvg = makeToSvg(1) // 单位平面,后面自己乘 outerR
  // 外规半径 (δ=−(90−φ)) —— 辐条从北极画到这里(乘 scale 前)
  const outerR = (scale * (180 - props.observerLat)) / 90
  return spans.value.map((s) => {
    const projAngle = normalizeAngle(lst - s.startRa + 90)
    const rad = (projAngle * Math.PI) / 180
    // 单位方向向量 → 经 makeToSvg 旋转 → 乘 outerR
    const dir = toSvg({ x: Math.cos(rad), y: Math.sin(rad) })
    return {
      label: s.label,
      x: dir.x * outerR,
      y: dir.y * outerR
    }
  })
}

/**
 * 28 宿完整星官 SVG 坐标（每宿的所有星 + 星官连线端点）。
 *
 * 返回结构：
 *   [{
 *     label, color,
 *     stars: [{ cnName, bayer, mag, x, y, r }, ...],   // 已投影到 SVG
 *     lines: [{ x1, y1, x2, y2 }, ...],                // 每对连线的端点
 *     distStar: stars[0]                                // 距星,宿名标签锚点
 *   }, ...]
 */
const computeMansionAsterismPoints = (actualRadius: number) => {
  const scale = projectionScale(actualRadius)
  const toSvg = makeToSvg(scale)
  return mansionAsterisms.value.map((a) => {
    const stars = a.stars.map((s) => ({
      cnName: s.cnName,
      bayer: s.bayer,
      mag: s.mag,
      ...toSvg(s.plane),
      // 星等→半径:base=3.0 比北斗（4.6）略小,避免暗星喧宾夺主
      r: magnitudeToRadius(s.mag, 3.0)
    }))
    const lines = a.connections.map(([i, j]) => ({
      x1: stars[i]?.x ?? 0,
      y1: stars[i]?.y ?? 0,
      x2: stars[j]?.x ?? 0,
      y2: stars[j]?.y ?? 0
    }))
    return {
      label: a.label,
      color: a.color,
      stars,
      lines,
      distStar: stars[0]
    }
  })
}

/**
 * 全星官模式 SVG 坐标。
 *
 * 对五种类型的星官分别控制渲染参数：
 *   · mansion  : base=3.0 × canvasScale, 连线宽 0.9 × canvasScale, 不透明度 0.6
 *   · sub      : base=1.2 × canvasScale, 连线宽 0.4 × canvasScale, 不透明度 0.35
 *   · enclosure: base=2.0 × canvasScale, 连线宽 0.7 × canvasScale, 不透明度 0.45
 *   · special  : 跳过（北斗、北极在别处渲染）
 *   · cluster  : 星团/云气标记，不渲染星点连线，渲染芒尖虚线圆
 *     angularSizePx 为固定图标大小（8 × canvasScale），非实际角直径缩放，
 *     因为全天下 M44 1.6° 的实际角直径在投影中仅 ~1.6px（1200 viewBox），不可见。
 *
 * canvasScale 由 View 层传入，全星官模式为 3（3600×3600 viewBox），
 * 乘以 canvasScale 保证星点/连线在屏幕上的视觉大小与经典模式（1200×1200）一致。
 */
const computeFullAsterismPoints = (actualRadius: number) => {
  const scale = projectionScale(actualRadius)
  const toSvg = makeToSvg(scale)
  const vbScale = props.canvasScale ?? 1
  return fullAsterisms.value
    .filter((a) => {
      if (a.type === 'special') return false
      if (a.type === 'cluster') return true // always show clusters
      if (a.type === 'sub' && !props.showSubAsterisms) return false
      if (a.type === 'enclosure' && !props.showEnclosures) return false
      return true
    })
    .map((a) => {
      // ── cluster 类型：芒尖虚线圆标记 ──
      if (a.type === 'cluster') {
        const center = a.stars[0]
        if (!center) return null
        const svg = toSvg(center.plane)
        const clusterR = 8 * vbScale // 固定图标大小，非实际角直径
        const spikes: { x1: number; y1: number; x2: number; y2: number }[] = []
        const spikeDirs: [number, number][] = [[0, -1], [0, 1], [-1, 0], [1, 0]]
        for (const [dx, dy] of spikeDirs) {
          const inner = clusterR + 2 * vbScale
          const outer = inner + 5 * vbScale
          spikes.push({
            x1: svg.x + dx * inner,
            y1: svg.y + dy * inner,
            x2: svg.x + dx * outer,
            y2: svg.y + dy * outer
          })
        }
        return {
          label: a.label,
          english: a.english,
          color: a.color,
          type: 'cluster' as const,
          cx: svg.x,
          cy: svg.y,
          radiusPx: clusterR,
          lineWidth: 1.2 * vbScale,
          spikes,
          // 为兼容模板，提供空的 stars/lines
          stars: [],
          lines: [],
          distStar: null
        }
      }

      // ── 常规类型（mansion / sub / enclosure）──
      const isSub = a.type === 'sub'
      const isEnc = a.type === 'enclosure'
      const baseR = (isSub ? 1.2 : isEnc ? 2.0 : 3.0) * vbScale
      const lineW = (isSub ? 0.4 : isEnc ? 0.7 : 0.9) * vbScale
      const lineOpacity = isSub ? 0.35 : isEnc ? 0.45 : 0.6
      const starOpacity = isSub ? 0.75 : isEnc ? 0.85 : 1.0

      const stars = a.stars.map((s) => ({
        cnName: s.cnName,
        mag: s.mag,
        ...toSvg(s.plane),
        r: magnitudeToRadius(s.mag ?? 5, baseR),
        opacity: starOpacity
      }))
      const lines = a.connections.map(([i, j]) => ({
        x1: stars[i]?.x ?? 0,
        y1: stars[i]?.y ?? 0,
        x2: stars[j]?.x ?? 0,
        y2: stars[j]?.y ?? 0
      }))
      return {
        label: a.label,
        english: a.english,
        color: a.color,
        type: a.type,
        stars,
        lines,
        lineWidth: lineW,
        lineOpacity,
        distStar: stars[0]
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
}

/**
 * 为带有 angularSizeDeg 的常规星官（如昴宿、积尸）生成星团虚线外圈。
 *
 * 在 full 模式下，遍历所有星官数据，找到 type !== 'cluster' 且 angularSizeDeg 有值的星官，
 * 计算其星点的投影包围圆，在 SVG 中画一个淡虚线圈。
 *
 * 半径策略：
 *   - 多颗星（如昴宿 7 星）→ 从几何中心到最远星点的距离 + 边距
 *   - 单颗星（如积尸 1 星）→ angularSizeDeg 换算 + 最小可见半径
 * 这样可以保证圈的大小始终与实际星点分布成比例。
 */
const computeAngularSizeOverlays = (actualRadius: number) => {
  if (props.detailMode !== 'full') return []
  const scale = projectionScale(actualRadius)
  const toSvg = makeToSvg(scale)
  const lst = localSiderealTimeDeg(timeRef.value, props.observerLon)
  let slotCursor = 1000
  const vbScale = props.canvasScale ?? 1
  const result: {
    label: string
    english: string
    color: string
    cx: number
    cy: number
    radiusPx: number
    lineWidth: number
  }[] = []

  for (const asterism of CHINESE_ASTERISMS) {
    if (asterism.type === 'special' || asterism.type === 'cluster') continue
    if (!asterism.angularSizeDeg || asterism.stars.length === 0) continue
    if (asterism.type === 'sub' && !props.showSubAsterisms) continue
    if (asterism.type === 'enclosure' && !props.showEnclosures) continue

    // 投影所有星点
    const projected = asterism.stars.map((s) => {
      const slot = slotCursor++
      const eq = fixedStarEquatorial(timeRef.value, s.raJ2000, s.decJ2000, 200, slot)
      const projAngle = normalizeAngle(lst - eq.ra + 90)
      return toSvg(project(projAngle, eq.dec))
    })

    // 计算几何中心
    const cx = projected.reduce((s, p) => s + p.x, 0) / projected.length
    const cy = projected.reduce((s, p) => s + p.y, 0) / projected.length

    let radiusPx: number

    if (projected.length >= 2) {
      // 多星：从几何中心到最远星点的距离 + 4px 边距
      const maxDist = Math.max(...projected.map((p) => Math.hypot(p.x - cx, p.y - cy)))
      radiusPx = maxDist + 4 * vbScale
    } else {
      // 单星：用 angularSizeDeg 换算（等距投影：1° = 1/90 平面单位）
      const radiusSvg = (asterism.angularSizeDeg / 2) * (1 / 90) * scale
      // 最小可见半径
      const minR = 6 * vbScale
      radiusPx = Math.max(radiusSvg, minR)
    }

    result.push({
      label: asterism.label,
      english: asterism.english,
      color: asterism.color,
      cx, cy, radiusPx,
      lineWidth: 0.6 * vbScale
    })
  }
  return result
}

/** 北斗七星 SVG 坐标（与 BeidouCenter 同一投影管道） */
const computeBeidouPoints = (actualRadius: number) => {
  const scale = projectionScale(actualRadius)
  const toSvg = makeToSvg(scale)
  return beidou.value.map((s) => ({
    ...s,
    ...toSvg(s.plane),
    r: magnitudeToRadius(s.mag, 4.6)
  }))
}

/** 紫微墙星 SVG 坐标 */
const computeZiweiPoint = (
  actualRadius: number,
  z: ReturnType<typeof ziweiPositions>[number]
) => {
  const scale = projectionScale(actualRadius)
  const toSvg = makeToSvg(scale)
  return { ...z, ...toSvg(z.plane), r: magnitudeToRadius(z.mag, 3.4) }
}

const computeZiweiWall = (
  actualRadius: number,
  stars: ReturnType<typeof ziweiPositions>
) => stars.map((z) => computeZiweiPoint(actualRadius, z))

/** 折线 points 字符串工厂 */
const polyPoints = (pts: { x: number; y: number }[]): string =>
  pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')

/** 采样点 ({ projAngle, dec }) → SVG 路径 d 字符串 */
const curvePathD = (
  samples: { ra: number; dec: number }[],
  scale: number,
  _dir: number
): string => {
  const toSvg = makeToSvg(scale)
  return samples
    .map((s) => {
      const p = toSvg(project(s.ra, s.dec))
      return `${p.x.toFixed(2)},${p.y.toFixed(2)}`
    })
    .join(' ')
}

/** 黄道 SVG 坐标 */
const computeEclipticPath = (actualRadius: number) => {
  const scale = projectionScale(actualRadius)
  return curvePathD(eclipticSamples.value, scale, dirSign.value)
}
/** 白道 SVG 坐标 */
const computeWhiteWayPath = (actualRadius: number) => {
  const scale = projectionScale(actualRadius)
  return curvePathD(whiteWaySamples.value, scale, dirSign.value)
}
/** 地平线 SVG 坐标 */
const computeHorizonPath = (actualRadius: number) => {
  const scale = projectionScale(actualRadius)
  return curvePathD(horizonSamples.value, scale, dirSign.value)
}

/** 单个天体的 SVG 坐标:投影平面 → (x,y) */
const bodySvg = (
  projAngle: number,
  dec: number,
  scale: number,
  _dir: number
): { x: number; y: number } => {
  const toSvg = makeToSvg(scale)
  return toSvg(project(projAngle, dec))
}

/** 天极十字大小 —— 与三规圆同尺度,标识几何天极 */
const poleCrossSize = 6

/**
 * 地平线四方位标注(东南西北)
 *
 * 与 horizonSamples 同源,只取四个特殊方位角:
 *   · 北 A=0°   → δ=+(90−φ) H=180° → projAngle=270° → 内规内侧
 *   · 南 A=180° → δ=−(90−φ) H=0°   → projAngle=90°  → 外规外侧
 *   · 东 A=90°  → δ=0       H=−90° → projAngle=0°   → 赤道右
 *   · 西 A=270° → δ=0       H=+90° → projAngle=180° → 赤道左
 *
 * 由于 orientOffset 已经在 makeToSvg 里生效,fixed-ground 视角下四个字静止,
 * fixed-sky-* 视角下会绕天极转 —— 因为地平线本身在惯性系里就是绕极转的。
 *
 * 每个方位标签外推 offset 像素,避免和地平线本身重叠。
 */
const CARDINAL_DIRS = [
  { key: 'N', label: '北', A: 0 },
  { key: 'E', label: '东', A: 90 },
  { key: 'S', label: '南', A: 180 },
  { key: 'W', label: '西', A: 270 }
] as const

const computeCardinals = (actualRadius: number) => {
  const scale = projectionScale(actualRadius)
  const phi = (props.observerLat * Math.PI) / 180
  return CARDINAL_DIRS.map((d) => {
    const a = (d.A * Math.PI) / 180
    // 与 horizonSamples 完全同源:重新算出这个方位在天球的赤经赤纬
    const cosDec = Math.cos(phi) * Math.cos(a)
    const dec = Math.asin(Math.max(-1, Math.min(1, cosDec)))
    let cosH = -Math.tan(phi) * Math.tan(dec)
    cosH = Math.max(-1, Math.min(1, cosH))
    let H = Math.acos(cosH)
    if (Math.sin(a) > 0) H = -H
    const decDeg = (dec * 180) / Math.PI
    const projAngle = normalizeAngle((H * 180) / Math.PI + 90)

    // 落到 SVG 的锚点
    const anchor = bodySvg(projAngle, decDeg, scale, dirSign.value)

    // 沿盘心 → anchor 方向再外推 14px,让文字浮在地平线圈外
    const len = Math.hypot(anchor.x, anchor.y) || 1
    const push = 14
    const x = anchor.x + (anchor.x / len) * push
    const y = anchor.y + (anchor.y / len) * push
    return { ...d, x, y }
  })
}
</script>

<template>
  <BaseCenter
    :radius="radius"
    :scale="scale"
    :time="timeRef"
    :rotation-direction="rotationDirection"
  >
    <template #default="{ actualRadius }">
      <g class="suzhou-sky-map">
        <!-- clipPath:限制外规裁到圆心可视范围内 -->
        <defs>
          <clipPath :id="`suzhou-visible-${(radius as number).toFixed(0)}`">
            <circle cx="0" cy="0" :r="actualRadius" />
          </clipPath>
        </defs>

        <!-- 圆心边界虚线圆(视觉标识) -->
        <circle
          cx="0"
          cy="0"
          :r="radius"
          fill="none"
          stroke="#5A6B7C"
          stroke-width="0.8"
          stroke-dasharray="3,4"
          opacity="0.4"
        />

        <!-- ═════════════════════════════════════════════════════
             ① 三规圆(苏图骨架:内规/赤道/外规)
             ═════════════════════════════════════════════════════
             每规独立 group,包含:实线圆 + 透明厚 stroke(hit area) + text
             hover 命中 hit area 时 text 才亮 -->
        <template
          v-if="showThreeRegulae"
          v-for="reg in [computeRegulae(actualRadius)]"
          :key="'regulae'"
        >
          <!-- 内规(恒显圈,金色细实线) -->
          <g class="regula">
            <circle
              cx="0"
              cy="0"
              :r="reg.inner"
              fill="none"
              stroke="#D4AF37"
              stroke-width="0.8"
              opacity="0.5"
            />
            <circle
              cx="0"
              cy="0"
              :r="reg.inner"
              fill="none"
              stroke="transparent"
              stroke-width="12"
              pointer-events="stroke"
            />
            <text
              v-if="showLabels"
              :x="0"
              :y="-reg.inner - 4"
              fill="#D4AF37"
              font-size="9"
              text-anchor="middle"
              paint-order="stroke"
              stroke="#000"
              stroke-width="1.6"
            >内规 δ+{{ (90 - observerLat).toFixed(0) }}°</text>
          </g>

          <!-- 赤道(天中规,白色细实线) -->
          <g class="regula">
            <circle
              cx="0"
              cy="0"
              :r="reg.equator"
              fill="none"
              stroke="#EAEAEA"
              stroke-width="0.9"
              opacity="0.5"
            />
            <circle
              cx="0"
              cy="0"
              :r="reg.equator"
              fill="none"
              stroke="transparent"
              stroke-width="12"
              pointer-events="stroke"
            />
            <text
              v-if="showLabels"
              :x="0"
              :y="-reg.equator - 4"
              fill="#EAEAEA"
              font-size="9"
              text-anchor="middle"
              paint-order="stroke"
              stroke="#000"
              stroke-width="1.6"
            >赤道 δ0°</text>
          </g>

          <!-- 外规(恒隐圈,金色细实线) -->
          <g class="regula">
            <circle
              cx="0"
              cy="0"
              :r="reg.outer"
              fill="none"
              stroke="#D4AF37"
              stroke-width="0.8"
              opacity="0.5"
            />
            <circle
              cx="0"
              cy="0"
              :r="reg.outer"
              fill="none"
              stroke="transparent"
              stroke-width="12"
              pointer-events="stroke"
            />
            <text
              v-if="showLabels"
              :x="0"
              :y="-reg.outer - 4"
              fill="#D4AF37"
              font-size="9"
              text-anchor="middle"
              paint-order="stroke"
              stroke="#000"
              stroke-width="1.6"
            >外规 δ−{{ (90 - observerLat).toFixed(0) }}°</text>
          </g>
        </template>

        <!-- ═════════════════════════════════════════════════════
             ② 28 宿径向辐条(从北极辐射到外规,每宿距星处一根)
             ═════════════════════════════════════════════════════ -->
        <g
          v-if="showMansionSpokes"
          :clip-path="`url(#suzhou-visible-${(radius as number).toFixed(0)})`"
        >
          <line
            v-for="spoke in computeSpokes(actualRadius)"
            :key="'spoke-' + spoke.label"
            x1="0"
            y1="0"
            :x2="spoke.x"
            :y2="spoke.y"
            stroke="#8a7a4a"
            stroke-width="0.6"
            stroke-dasharray="2,3"
            opacity="0.55"
          />
        </g>

        <!-- ═════════════════════════════════════════════════════
             ③ 28 宿完整星官 + 星官连线(四象色系)
             ═════════════════════════════════════════════════════ -->
        <g
          v-if="showMansionStars && detailMode !== 'full'"
          :clip-path="`url(#suzhou-visible-${(radius as number).toFixed(0)})`"
        >
          <g
            v-for="(asterism, idx) in computeMansionAsterismPoints(actualRadius)"
            :key="'as-' + asterism.label"
            class="mansion-asterism"
            :style="{ '--twinkle-delay': `${(0.37 * (idx % 28)).toFixed(2)}s` }"
          >
            <!-- 星官内连线(轻描,让"图形"浮现) -->
            <line
              v-for="(ln, i) in asterism.lines"
              :key="'ln-' + asterism.label + '-' + i"
              :x1="ln.x1"
              :y1="ln.y1"
              :x2="ln.x2"
              :y2="ln.y2"
              :stroke="asterism.color"
              stroke-width="0.9"
              opacity="0.6"
              stroke-linecap="round"
            />

            <!-- 每颗星:星等控制大小,四象色系上色,hover 亮出"XX宿几" -->
            <g v-for="(s, i) in asterism.stars" :key="'st-' + asterism.label + '-' + i" class="star star-twinkle">
              <!-- 淡光晕 -->
              <circle :cx="s.x" :cy="s.y" :r="s.r + 2" :fill="asterism.color" opacity="0.22" />
              <!-- 星体 -->
              <circle :cx="s.x" :cy="s.y" :r="s.r" :fill="asterism.color" />
              <!-- hit area:透明大圆便于 hover 命中 -->
              <circle
                :cx="s.x"
                :cy="s.y"
                :r="Math.max(s.r + 4, 6)"
                fill="transparent"
                pointer-events="all"
              />
              <!-- 具体星名(如"角宿一"),默认隐藏,hover 亮出 -->
              <text
                v-if="showLabels"
                :x="s.x + s.r + 4"
                :y="s.y - s.r - 2"
                :fill="asterism.color"
                font-size="12"
                font-weight="600"
                text-anchor="start"
                paint-order="stroke"
                stroke="#000"
                stroke-width="2.2"
              >{{ s.cnName }}</text>
            </g>
          </g>
        </g>

        <!-- ═════════════════════════════════════════════════════
             ③a 全星官模式：附属星官 + 三垣墙
             ═════════════════════════════════════════════════════ -->
        <g
          v-if="detailMode === 'full'"
          :clip-path="`url(#suzhou-visible-${(radius as number).toFixed(0)})`"
        >
          <g
            v-for="(asterism, idx) in computeFullAsterismPoints(actualRadius)"
            :key="'fa-' + asterism.english"
            class="full-asterism"
            :class="[asterism.type, { 'has-twinkle': asterism.type === 'mansion' }]"
            :style="asterism.type === 'mansion' ? { '--twinkle-delay': `${(0.37 * (idx % 28)).toFixed(2)}s` } : undefined"
          >
            <!-- ── cluster 类型：星团/云气芒尖虚线圆 ── -->
            <template v-if="asterism.type === 'cluster'">
              <!-- 前光晕 -->
              <circle
                :cx="asterism.cx" :cy="asterism.cy"
                :r="asterism.radiusPx + 4"
                :fill="asterism.color"
                opacity="0.10"
              />
              <!-- 芒尖圆主体：虚线圆 -->
              <circle
                :cx="asterism.cx" :cy="asterism.cy"
                :r="asterism.radiusPx"
                fill="none"
                :stroke="asterism.color"
                :stroke-width="asterism.lineWidth"
                stroke-dasharray="4,3"
                opacity="0.75"
              />
              <!-- 四方向芒尖 -->
              <line
                v-for="(sp, i) in asterism.spikes"
                :key="'sp-' + i"
                :x1="sp.x1" :y1="sp.y1"
                :x2="sp.x2" :y2="sp.y2"
                :stroke="asterism.color"
                :stroke-width="asterism.lineWidth"
                stroke-linecap="round"
                opacity="0.75"
              />
              <!-- 中心标签 -->
              <text
                v-if="showLabels"
                :x="asterism.cx"
                :y="asterism.cy + 4"
                :fill="asterism.color"
                font-size="11"
                font-weight="700"
                text-anchor="middle"
                dominant-baseline="middle"
                paint-order="stroke"
                stroke="#000"
                stroke-width="2.2"
                opacity="0.95"
                style="pointer-events: none;"
              >{{ asterism.label }}</text>
            </template>

            <!-- ── 常规类型：连线 ── -->
            <line
              v-for="(ln, i) in asterism.lines"
              :key="'fl-' + i"
              :x1="ln.x1" :y1="ln.y1" :x2="ln.x2" :y2="ln.y2"
              :stroke="asterism.color"
              :stroke-width="asterism.lineWidth"
              :opacity="asterism.lineOpacity"
              stroke-linecap="round"
            />

            <!-- 星官名标签（hover 整组时显示，cluster 不在此渲染） -->
            <text
              v-if="showLabels && asterism.distStar"
              class="asterism-label"
              :x="asterism.distStar.x"
              :y="asterism.distStar.y - 10"
              :fill="asterism.color"
              font-size="13"
              font-weight="700"
              text-anchor="middle"
              paint-order="stroke"
              stroke="#000"
              stroke-width="2.2"
              opacity="0.9"
            >{{ asterism.label }}</text>

            <!-- ── 常规类型：星点 ── -->
            <template v-if="asterism.type !== 'cluster'">
              <g
                v-for="(s, j) in asterism.stars"
                :key="'fs-' + j"
                class="star-group"
                :class="{ 'star-twinkle': asterism.type === 'mansion' }"
              >
              <!-- 淡光晕 -->
              <circle :cx="s.x" :cy="s.y" :r="s.r + 1" :fill="asterism.color" :opacity="s.opacity * 0.15" />
              <!-- 星体 -->
              <circle :cx="s.x" :cy="s.y" :r="s.r" :fill="asterism.color" :opacity="s.opacity" />
              <!-- hit area（16px 确保鼠标易命中） -->
              <circle
                :cx="s.x" :cy="s.y"
                :r="Math.max(s.r + 4, 16)"
                fill="transparent"
                pointer-events="all"
              >
                <!-- 原生浏览器 tooltip：星官名 · 星名 -->
                <title>{{ asterism.label }} · {{ s.cnName }}</title>
              </circle>
              <!-- 星名（所有类型均渲染，CSS 控制 hover 显隐） -->
              <text
                class="star-label"
                :x="s.x + s.r + 4"
                :y="s.y + 4"
                :fill="asterism.color"
                font-size="9"
                text-anchor="start"
                paint-order="stroke"
                stroke="#000"
                stroke-width="1.6"
                opacity="0.95"
              >{{ s.cnName }}</text>
            </g>
          </template>
          </g>

          <!-- angularSize 星团外圈 overlay -->
          <g
            v-for="overlay in computeAngularSizeOverlays(actualRadius)"
            :key="'ao-' + overlay.english"
            class="angular-size-overlay"
            opacity="0.4"
          >
            <circle
              :cx="overlay.cx" :cy="overlay.cy"
              :r="overlay.radiusPx"
              fill="none"
              :stroke="overlay.color"
              :stroke-width="overlay.lineWidth"
              stroke-dasharray="3,4"
            />
          </g>
        </g>

        <!-- ═════════════════════════════════════════════════════
             ③b 黄道 + 白道(与三规同 clip,外规裁剪)
             ═════════════════════════════════════════════════════ -->
        <g :clip-path="`url(#suzhou-visible-${(radius as number).toFixed(0)})`">
          <!-- 黄道(赭黄色,细虚线) -->
          <polyline
            v-if="showEcliptic"
            class="ecliptic"
            :points="computeEclipticPath(actualRadius)"
            fill="none"
            stroke="#E9B949"
            stroke-width="0.9"
            stroke-dasharray="2,6"
            opacity="0.5"
          />
          <!-- 白道(月银色,细虚线) -->
          <polyline
            v-if="showWhiteWay"
            class="white-way"
            :points="computeWhiteWayPath(actualRadius)"
            fill="none"
            stroke="#BFD5E8"
            stroke-width="0.8"
            stroke-dasharray="1.5,6"
            opacity="0.45"
          />
          <!-- 地平线(青灰色,实线,只依赖 φ,不随时间旋转) -->
          <polyline
            v-if="showHorizon"
            class="horizon"
            :points="computeHorizonPath(actualRadius)"
            fill="none"
            stroke="#7EA8B8"
            stroke-width="1.0"
            opacity="0.55"
          />
          <!-- 地平线四方位标注:东南西北(与地平线同显隐) -->
          <template v-if="showHorizon">
            <g
              v-for="dir in computeCardinals(actualRadius)"
              :key="'cardinal-' + dir.key"
              class="cardinal"
            >
              <text
                :x="dir.x"
                :y="dir.y"
                fill="#7EA8B8"
                font-size="14"
                font-weight="700"
                text-anchor="middle"
                dominant-baseline="middle"
                paint-order="stroke"
                stroke="#000"
                stroke-width="2.6"
                opacity="0.95"
              >{{ dir.label }}</text>
            </g>
          </template>
        </g>

        <!-- ═════════════════════════════════════════════════════
             ③c 太阳 · 月亮 · 五星(hover 亮出名字)
             ═════════════════════════════════════════════════════ -->
        <g :clip-path="`url(#suzhou-visible-${(radius as number).toFixed(0)})`">
          <!-- 太阳:金色实心 + 光芒环 -->
          <template
            v-if="showSun"
            v-for="sun in [bodySvg(sunProj.projAngle, sunProj.dec, projectionScale(actualRadius), dirSign)]"
            :key="'sun'"
          >
            <g class="body sun" :style="{ '--twinkle-delay': QIYAO_DELAY.sun }">
              <circle :cx="sun.x" :cy="sun.y" :r="16" fill="#FFB84D" class="body-halo" />
              <circle :cx="sun.x" :cy="sun.y" :r="8" fill="#FFC94A" class="body-core" />
              <circle :cx="sun.x" :cy="sun.y" :r="4" fill="#FFF3B0" />
              <circle
                :cx="sun.x"
                :cy="sun.y"
                :r="30"
                fill="transparent"
                pointer-events="all"
              >
                <title>☉ 日 · 太阳</title>
              </circle>
              <text
                v-if="showLabels"
                :x="sun.x + 10"
                :y="sun.y - 8"
                fill="#FFC94A"
                font-size="12"
                font-weight="600"
                text-anchor="start"
                paint-order="stroke"
                stroke="#000"
                stroke-width="2.2"
              >☉ 日</text>
            </g>
          </template>

          <!-- 月亮:银白色 + 光晕 -->
          <template
            v-if="showMoon"
            v-for="moon in [bodySvg(moonProj.projAngle, moonProj.dec, projectionScale(actualRadius), dirSign)]"
            :key="'moon'"
          >
            <g class="body moon" :style="{ '--twinkle-delay': QIYAO_DELAY.moon }">
              <circle :cx="moon.x" :cy="moon.y" :r="14" fill="#DCE6F0" class="body-halo" />
              <circle :cx="moon.x" :cy="moon.y" :r="7" fill="#EAF0F5" class="body-core" />
              <circle :cx="moon.x" :cy="moon.y" :r="3.5" fill="#B7C4D0" />
              <circle
                :cx="moon.x"
                :cy="moon.y"
                :r="25"
                fill="transparent"
                pointer-events="all"
              >
                <title>☽ 月 · 月亮</title>
              </circle>
              <text
                v-if="showLabels"
                :x="moon.x + 8"
                :y="moon.y - 6"
                fill="#DCE6F0"
                font-size="12"
                font-weight="600"
                text-anchor="start"
                paint-order="stroke"
                stroke="#000"
                stroke-width="2.2"
              >☽ 月</text>
            </g>
          </template>

          <!-- 五星（水金火木土） -->
          <template v-if="showPlanets">
            <g
              v-for="planet in planetsProj"
              :key="'p-' + planet.key"
              class="body planet"
              :style="{ '--twinkle-delay': (QIYAO_DELAY[planet.key] ?? '0s') }"
            >
              <template
                v-for="p in [bodySvg(planet.projAngle, planet.dec, projectionScale(actualRadius), dirSign)]"
                :key="planet.key"
              >
                <circle :cx="p.x" :cy="p.y" :r="8" :fill="planet.color" class="body-halo" />
                <circle :cx="p.x" :cy="p.y" :r="4" :fill="planet.color" class="body-core" />
                <circle
                  :cx="p.x"
                  :cy="p.y"
                  :r="20"
                  fill="transparent"
                  pointer-events="all"
                >
                  <title>{{ planet.symbol }} {{ planet.name }}</title>
                </circle>
                <text
                  v-if="showLabels"
                  :x="p.x + 6"
                  :y="p.y - 4"
                  :fill="planet.color"
                  font-size="12"
                  font-weight="600"
                  text-anchor="start"
                  paint-order="stroke"
                  stroke="#000"
                  stroke-width="2.2"
                >{{ planet.symbol }} {{ planet.name }}</text>
              </template>
            </g>
          </template>
        </g>

        <!-- ═════════════════════════════════════════════════════
             ④ 紫微垣东西两藩 + 勾陈一
             ═════════════════════════════════════════════════════ -->
        <template
          v-if="showZiwei"
          v-for="zw in [{
            east: computeZiweiWall(actualRadius, ziwei.east),
            west: computeZiweiWall(actualRadius, ziwei.west),
            polaris: computeZiweiPoint(actualRadius, ziwei.polaris)
          }]"
          :key="'ziwei'"
        >
          <!-- 东藩连线 -->
          <polyline
            :points="polyPoints(zw.east)"
            fill="none"
            stroke="#B48EDB"
            stroke-width="1.1"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.7"
          />
          <!-- 西藩连线 -->
          <polyline
            :points="polyPoints(zw.west)"
            fill="none"
            stroke="#8FA5DB"
            stroke-width="1.1"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.7"
          />

          <!-- 东藩星点 -->
          <g v-for="s in zw.east" :key="'ze-' + s.bayer" class="ziwei-star east">
            <circle :cx="s.x" :cy="s.y" :r="s.r + 2" fill="#B48EDB" opacity="0.18" />
            <circle :cx="s.x" :cy="s.y" :r="s.r" fill="#D9C2EF" />
            <text
              v-if="showLabels"
              :x="s.x + s.r + 3"
              :y="s.y + 3"
              fill="#C8AEE6"
              font-size="11"
              text-anchor="start"
              paint-order="stroke"
              stroke="#000"
              stroke-width="1.8"
            >{{ s.cnName }}</text>
          </g>

          <!-- 西藩星点 -->
          <g v-for="s in zw.west" :key="'zw-' + s.bayer" class="ziwei-star west">
            <circle :cx="s.x" :cy="s.y" :r="s.r + 2" fill="#8FA5DB" opacity="0.18" />
            <circle :cx="s.x" :cy="s.y" :r="s.r" fill="#B7C6EA" />
            <text
              v-if="showLabels"
              :x="s.x - s.r - 3"
              :y="s.y + 3"
              fill="#A6BADD"
              font-size="11"
              text-anchor="end"
              paint-order="stroke"
              stroke="#000"
              stroke-width="1.8"
            >{{ s.cnName }}</text>
          </g>

          <!-- 北极星(勾陈一):金色四芒 + 光晕 -->
          <g class="polaris">
            <circle
              :cx="zw.polaris.x"
              :cy="zw.polaris.y"
              :r="zw.polaris.r + 5"
              fill="#F4C560"
              opacity="0.18"
            />
            <line
              :x1="zw.polaris.x - zw.polaris.r - 4"
              :y1="zw.polaris.y"
              :x2="zw.polaris.x + zw.polaris.r + 4"
              :y2="zw.polaris.y"
              stroke="#F4C560"
              stroke-width="0.9"
              opacity="0.85"
            />
            <line
              :x1="zw.polaris.x"
              :y1="zw.polaris.y - zw.polaris.r - 4"
              :x2="zw.polaris.x"
              :y2="zw.polaris.y + zw.polaris.r + 4"
              stroke="#F4C560"
              stroke-width="0.9"
              opacity="0.85"
            />
            <circle
              :cx="zw.polaris.x"
              :cy="zw.polaris.y"
              :r="zw.polaris.r + 0.6"
              fill="#FFE9A8"
            />
            <text
              v-if="showLabels"
              :x="zw.polaris.x + zw.polaris.r + 6"
              :y="zw.polaris.y - zw.polaris.r - 2"
              fill="#F4D580"
              font-size="12"
              text-anchor="start"
              paint-order="stroke"
              stroke="#000"
              stroke-width="2.2"
            >勾陈一</text>
          </g>
        </template>

        <!-- ═════════════════════════════════════════════════════
             ⑤ 北斗七星连线 + 星名 + 天极中心十字
             ═════════════════════════════════════════════════════ -->
        <template
          v-if="showBeidou"
          v-for="beidouPts in [computeBeidouPoints(actualRadius)]"
          :key="'beidou'"
        >
          <!-- 连线(勺+柄) -->
          <polyline
            :points="polyPoints(beidouPts)"
            fill="none"
            stroke="#FFFFFF"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.9"
          />

          <!-- 天极中心十字 -->
          <g v-if="showPole" class="pole" opacity="0.55">
            <line :x1="-poleCrossSize" y1="0" :x2="poleCrossSize" y2="0" stroke="#888" stroke-width="0.8" />
            <line x1="0" :y1="-poleCrossSize" x2="0" :y2="poleCrossSize" stroke="#888" stroke-width="0.8" />
            <circle cx="0" cy="0" r="2" fill="none" stroke="#888" stroke-width="0.6" />
          </g>

          <!-- 七星本体 + 中文名 -->
          <g v-for="s in beidouPts" :key="s.key" class="beidou-star">
            <circle
              :cx="s.x"
              :cy="s.y"
              :r="s.r + 3"
              fill="#FFFFFF"
              opacity="0.18"
            />
            <circle
              :cx="s.x"
              :cy="s.y"
              :r="s.r"
              fill="#FFFFFF"
            />
            <text
              v-if="showLabels"
              :x="s.x"
              :y="s.y - s.r - 6"
              fill="#DDDDDD"
              font-size="13"
              text-anchor="middle"
              dominant-baseline="baseline"
              paint-order="stroke"
              stroke="#000"
              stroke-width="2.2"
            >{{ s.cnName }}</text>
          </g>
        </template>
      </g>
    </template>
  </BaseCenter>
</template>

<style scoped>
.suzhou-sky-map text {
  font-family: 'Microsoft YaHei', 'STHeiti', sans-serif;
  pointer-events: none;
  user-select: none;
}

/* 默认隐藏所有可 hover 标签,鼠标悬停时淡入 */
.suzhou-sky-map .regula text,
.suzhou-sky-map .mansion-asterism .star text,
.suzhou-sky-map .ziwei-star text,
.suzhou-sky-map .polaris text,
.suzhou-sky-map .beidou-star text,
.suzhou-sky-map .body text {
  opacity: 0;
  transition: opacity 0.18s ease-out;
}

.suzhou-sky-map .regula:hover text,
.suzhou-sky-map .mansion-asterism .star:hover text,
.suzhou-sky-map .ziwei-star:hover text,
.suzhou-sky-map .polaris:hover text,
.suzhou-sky-map .beidou-star:hover text,
.suzhou-sky-map .body:hover text {
  opacity: 1;
}

/* ─── 全星官模式：星官名 + 星名双层 hover ─── */
/* 星官名：hover 星官内任意区域时显示 */
.suzhou-sky-map .full-asterism .asterism-label {
  opacity: 0;
  transition: opacity 0.18s ease-out;
  pointer-events: none;
}
.suzhou-sky-map .full-asterism:hover .asterism-label {
  opacity: 1;
}

/* 星名：hover 具体星点时显示 */
.suzhou-sky-map .full-asterism .star-group .star-label {
  opacity: 0;
  transition: opacity 0.18s ease-out;
  pointer-events: none;
}
.suzhou-sky-map .full-asterism .star-group:hover .star-label {
  opacity: 1;
}

/* ─── 28 宿星点闪烁动画 ─── */
@keyframes twinkle {
  0%, 100% { opacity: 1; }
  15% { opacity: 0.45; }
  35% { opacity: 0.9; }
  55% { opacity: 0.3; }
  75% { opacity: 0.85; }
}
@keyframes twinkle-halo {
  0%, 100% { opacity: 0.22; }
  15% { opacity: 0.08; }
  35% { opacity: 0.18; }
  55% { opacity: 0.05; }
  75% { opacity: 0.16; }
}

/* 经典模式 28 宿星点闪烁 */
.suzhou-sky-map .mansion-asterism .star-twinkle > circle:nth-child(1) {
  animation: twinkle-halo 3.7s ease-in-out infinite;
  animation-delay: var(--twinkle-delay, 0s);
}
.suzhou-sky-map .mansion-asterism .star-twinkle > circle:nth-child(2) {
  animation: twinkle 3.7s ease-in-out infinite;
  animation-delay: var(--twinkle-delay, 0s);
}

/* 全星官模式 28 宿星点闪烁（仅 mansion 类型） */
.suzhou-sky-map .full-asterism.has-twinkle .star-twinkle > circle:nth-child(1) {
  animation: twinkle-halo 3.7s ease-in-out infinite;
  animation-delay: var(--twinkle-delay, 0s);
}
.suzhou-sky-map .full-asterism.has-twinkle .star-twinkle > circle:nth-child(2) {
  animation: twinkle 3.7s ease-in-out infinite;
  animation-delay: var(--twinkle-delay, 0s);
}

/* ─── 七曜（日月五星）波序闪烁动画 ─── *
 * 日→月→火→水→木→金→土 依次亮起，形成亮度波沿七曜序传播的效果。
 * body-halo 与此同步，让光晕随之呼吸。
 */
@keyframes body-twinkle {
  0%, 100% { opacity: 0.85; }
  10% { opacity: 1; }
  25% { opacity: 0.6; }
  40% { opacity: 1; }
  55% { opacity: 0.5; }
  70% { opacity: 1; }
  85% { opacity: 0.7; }
}
@keyframes body-halo {
  0%, 100% { opacity: 0.35; }
  10% { opacity: 0.55; }
  25% { opacity: 0.2; }
  40% { opacity: 0.5; }
  55% { opacity: 0.15; }
  70% { opacity: 0.55; }
  85% { opacity: 0.25; }
}

.suzhou-sky-map .body .body-halo {
  animation: body-halo 2.5s ease-in-out infinite;
  animation-delay: var(--twinkle-delay, 0s);
}
.suzhou-sky-map .body .body-core {
  animation: body-twinkle 2.5s ease-in-out infinite;
  animation-delay: var(--twinkle-delay, 0s);
}
</style>
