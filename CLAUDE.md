# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **乙巳观 (Yisiguan)** — 道由天观 — a personal Vue 3 + TypeScript project born from an observation of the sky in the Yisi (乙巳) year. It is used to visualize various ancient Chinese algorithms as full-screen, polar-coordinate SVG "compasses" (罗盘). The site is a **VitePress-hosted knowledge hub**: a documentation stack for classical astronomy notes plus a set of full-screen interactive compass pages, sharing one build and one deploy.

Compasses currently shipped:

- **六十甲子六环 (liushi-jiazi)** — six concentric 60-jiazi rings (year/month/day/hour/minute/second pillars) that track real time and highlight the current ganzhi cell on each ring.
- **先天六十四卦盘 (sixty-four-gua)** — Fu Xi/Shao Yong's先天 circular diagram: 64 hexagrams arranged by binary bit-reversal order, Qian south Kun north, displaying hexagram symbols, names and six lines.
- **京房六日七分纳甲盘 (jingfang)** — Jing Fang's gua-qi (卦气) system centered on the "six-days-seven-fen" (六日七分) rule: 24 solar terms + 365-day ganzhi scale on the outside, 360 yao-position fine ticks (每爻 1°), the 60-gua yao-line ring, and the Huntian najia (浑天纳甲) ring — real-time highlight of the current gua and yao. 60 gua × 6 yao = 360 positions load the 365.25-day tropical year (≈ 6.0875 d/gua, ≈ 1.0146 d/yao).
- **七曜入宿天象盘 (planet-mansion)** — celestial sky projection with polar equator, ecliptic and lunar orbit obliquity, sun/moon/five planets real-time positioning into 28 mansions, featuring point-based 24 solar terms outer ring.
- **回归年闰月盘 (tropical-year)** — 365-day tropical year vs 360-degree jiazi year comparison, jie/zhongqi distinction of 24 solar terms, lunar months with leap-month highlight, real-time moon phase, illustrating the "no-zhongqi ⇒ leap month" rule.
- **观斗盘 (guan-dou)** — simulates the ancient observation of the Big Dipper: real Beidou seven-star pattern at the center (with precession correction) + Ziwei enclosure east/west walls + Gouchen-1 + local horizon circle (browser geolocation), wrapped by concentric rings of yue-jian / shichen equatorial ring, yue-jiang / seven-luminaries / solar-terms ecliptic ring. Reads the dipper handle's direction into hour, season and year.
- **卦关系盘 (gua-relation)** — Jing Fang's eight-palace 64-hexagram fei-fu (飞伏) relations: fei is manifest, fu is hidden, yin and yang are each other's dwelling. Outer ring is Jing Fang's eight palaces; 64 directed arrows radiate inward from every hexagram to its 8 pure-palace host, forming a radial convergence.
- **苏州石刻天文图 (suzhou-stellar-map)** — digital reconstruction of the celestial map inscribed by Wang Zhiyuan at the Suzhou Prefectural School in 1247 (Southern Song, Chunyou 7th year): three regulator circles (inner δ+55° / equator / outer δ−55°) + 28 mansions as unequal-width radial spokes + Beidou at the polar center. The dipper handle rotates with local sidereal time and auto-labels the mansion it points to (east=Jiao, south=Xin, west=Niu, north=Kui). An optional world-map base-layer (Natural Earth 110m coastlines, azimuthal equidistant projection) sits under the sky, locked to LST so ground longitude and celestial RA are pixel-aligned — 「地面 ↔ 天球」直接对读.

Core libraries: **astronomy-engine** for precise solar position, **tyme4ts** for traditional calendar / ganzhi calculations. Hosting: **VitePress 1.6** (no Vue Router, no SPA entry). Compass pages live as `docs/compass/*.md` with a custom `layout: compass` that full-screen-renders `src/views/*.vue`. See §"VitePress ↔ src/ 融合关系" below.

## Architecture

The project evolved from a "one .vue component per ring" design → **data-driven multi-page** architecture → **hybrid static data + time-driven dedicated components** architecture → **"Center → Rings" unified layered 5-layer time-driven architecture**.

---

## 🏗️ 五层架构分层 (5-Layer Architecture)

### 核心设计原则：单一数据源 + 单向数据流 + 关注点分离

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: State Layer (状态层)                                │
│  └─ controlledTime = ref<Date>() — 唯一真理源                 │
└────────────────────────────────────┬────────────────────────┘
                                     │
┌────────────────────────────────────┴────────────────────────┐
│  Layer 2: Composition Layer (组合层)                          │
│  └─ Views: 持有状态，编排组件，通过 RingStack 统一布局         │
│     LiushiJiaziView, SixtyFourGuaView, JingFangView,          │
│     PlanetMansionView, TropicalYearView, GuanDouView,         │
│     GuaRelationView, SuzhouStellarMapView,                     │
│     FengShui24View, QiMenDunJiaView                            │
│     🔹 RingStack: 「圆心 → 圆环」统一分层布局容器              │
└────────────────────────────────────┬────────────────────────┘
                                     │
┌────────────────────────────────────┴────────────────────────┐
│  Layer 3: Domain Component Layer (领域组件层)                 │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  ⚫ 圆心区 (centers/)：圆心组件                           ││
│  │     HelioOrbits, LeapInfoCenter, BeidouCenter,            ││
│  │     SuzhouSkyMap, WorldMapCenter, GuaRelationCenter        ││
│  └───────────────────────────┬─────────────────────────────┘│
│                              │ 自动注入 innerRadius          │
│  ┌───────────────────────────▼─────────────────────────────┐│
│  │  🔵 圆环区 (rings/)：22+ 个同心环组件                     ││
│  │     SixtyJiaziRing, BranchesRing, ConstellationsRing,    ││
│  │     JingFangGuaRing, NajiaRing, ShiYingRing,             ││
│  │     LunarMonthsRing, MoonPhaseRing, SkyChart, ...        ││
│  └─────────────────────────────────────────────────────────┘│
└────────────────────────────────────┬────────────────────────┘
                                     │
┌────────────────────────────────────┴────────────────────────┐
│  Layer 4: Base Render Layer (基础渲染层)                      │
│  ├─ Data Wrappers: DataRing, DataPointRing, DataBodyRing    │
│  ├─ Base Renderers: CircleRing, PointRing                    │
│  ├─ Layout Container: RingStack, PolarCanvas                 │
│  └─ Base Center: BaseCenter — 圆心组件统一容器                │
└────────────────────────────────────┬────────────────────────┘
                                     │
┌────────────────────────────────────┴────────────────────────┐
│  Layer 5: Utility Layer (工具层)                              │
│  └─ Pure Functions: liushiJiazi, celestial, geometry,        │
│     planetMansion, skyProjection, skyEvents, eraCalendar     │
└──────────────────────────────────────────────────────────────┘
```

---

### Layer 1: State Layer (状态层)
**位置**: `src/views/*.vue` 内的 `ref` 定义

**核心原则：唯一真理源 (Single Source of Truth)**
- 整个系统只有一个 `controlledTime = ref<Date>()` 作为时间状态
- 所有时间驱动组件均派生自此单一数据源
- 无全局状态管理（未使用 Pinia / Vuex，状态在视图内局部持有）
- `Control` 面板通过 `v-model` 双向绑定修改状态

**实现：**
```typescript
// 唯一时间状态
const controlledTime = ref(new Date())

// 视口状态（各视图独立）
const zoomLevel = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const rotationDirection = ref<'clockwise' | 'counterclockwise'>('clockwise')
const rotationAngle = ref(0)
```

---

### Layer 2: Composition Layer (组合层)
**位置**: `src/views/*.vue`

**核心原则：纯组合编排，无业务逻辑**
- 仅负责状态持有与组件编排
- 通过 `RingStack` 进行同心环自动布局
- 将 `time` ref 向下传递给所有子组件
- 不进行任何数据转换或计算
- **通过 `provideCompassContext` 把 time/viewport 注册为跨 Layout 单例，供 Sidebar 消费**

**关键特性：**
1. **RingStack 自动布局**: 从外向内自动分配 `radius`/`innerRadius`，永不重叠
2. **🔹 #center slot 机制**: 最内环渲染完成后，自动暴露 `innerRadius` 给圆心组件
3. **统一注入**: `rotationDirection` 统一注入所有子环和圆心组件
4. **实时时钟**: `LiushiJiaziView` / `PlanetMansionView` 通过 `useLiveClock` composable 内置 1Hz 实时时钟
5. **Alt + 拖拽/滚轮**: 通过 `useAltDragPan` composable 统一接管平移/缩放交互
6. **无计算**: 所有 `computed` 仅用于布局参数，不涉及领域逻辑

**架构正确性检查：**
- ✅ View 层没有任何 `ringData` computed
- ✅ View 层只传 `time: controlledTime`，不解构 `.value`
- ✅ 所有计算逻辑下沉到 Layer 3 或 Layer 5

---

### Layer 3: Domain Component Layer (领域组件层)
**位置**: `src/components/rings/*.vue` (专用环组件)

**核心原则：时间驱动统一范式**

所有时间驱动环严格遵循以下三行代码范式：

```typescript
// 1. Props 声明 MaybeRef<Date>，支持 ref 和 plain value
interface Props { time?: MaybeRef<Date>, /* ... */ }

// 2. 统一转换为 computed timeRef，保证响应式链完整
const timeRef = computed(() => unref(props.time) ?? new Date())

// 3. 所有业务逻辑 100% 派生自 timeRef
const ringData = computed(() => transform(timeRef.value))
```

**范式设计意图：**
- ✅ **响应式链完整**: 无论父组件传 `ref` 还是 plain value，子组件始终响应式
- ✅ **单向数据流**: 数据自上而下流动，无 `emit` 回传
- ✅ **依赖追踪自动化**: `computed` 自动追踪依赖，无需 `watch`
- ✅ **可测试性**: 组件纯函数式，输入 time → 输出 ringData

**现有领域组件：**

| 组件 | 类型 | 领域 | 核心逻辑 |
|------|------|------|---------|
| `SixtyJiaziRing.vue` | Segment | 六十甲子 | 六柱干支序号计算 + 五行配色 |
| `BranchesRing.vue` | Segment | 十二地支 | 地支五行配色 + 所在柱高亮 |
| `StemsRing.vue` | Segment | 天干空亡 | 旬空计算 + 天干五行高亮 |
| `ConstellationsRing.vue` | Segment | 二十八宿 | 岁差赤经动态计算 + 天象事件分级 |
| `SiXiangRing.vue` | Segment | 四象 | 按宿赤经动态合并区间 |
| `SolarTermsRing.vue` | Point | 二十四节气 | 传统罗盘固定角度 + 当前节气高亮 |
| `SolarTermsSkyRing.vue` | Point | 天星节气 | 黄经→赤经动态转换对齐星图 |
| `SevenLuminariesRing.vue` | Body | 七曜 | 行星赤经计算 + 入宿定位 |
| `MansionDegreeRing.vue` | Body | 入宿度标记 | 七曜入宿度数径向标记 |
| `SinglePlanetRing.vue` | Body | 单行星 | 单行星深度研究模式 |
| `JingFangGuaRing.vue` | Segment | 京房六日七分 | 60 卦六日七分角度分配 + 当日值卦高亮 |
| `JingFangEightPalaceRing.vue` | Segment | 京房八宫 | 八宫卦所属排列 + 世应位标记 |
| `NajiaRing.vue` | Segment | 浑天纳甲 | 六爻天干配纳 + 五行配色 |
| `ShiYingRing.vue` | Segment | 世应爻位 | 世爻应爻位置标记 |
| `LiuRiQiFenScaleRing.vue` | Point | 六日七分刻度 | 365.25 天精细刻度 |
| `DayScaleRing.vue` | Point | 日刻度 + 日干支 | 一日一格刻度 + 甲子锚点 + 当日高亮 |
| `LunarMonthsRing.vue` | Segment | 农历月份 | 农历十二月分布 + 闰月特殊高亮 |
| `MoonPhaseRing.vue` | Body | 月相 | 当日月相实时绘制 |
| `SolarTermsPointRing.vue` | Point | 节气节/中气 | 二十四节气按节/中气分色标记 |
| `GuaRing.vue` | Segment | 先天六十四卦 | 64 卦按位序展开 + 卦符 + 六爻横线（无 time 依赖，静态图形） |
| `DegreeScale.vue` | Point | 赤经刻度 | 360° 刻度 + 5° 数字标签（静态） |
| `MonthEstablishRing.vue` | Segment | 斗建（月建） | 12 地支合月建 + 冬至→子月锚点 |
| `MonthGeneralRing.vue` | Segment | 月将 | 12 月将（大吉/功曹…）+ 太阳所在宫锚定 |
| `HourShichenRing.vue` | Segment | 时辰 | 12 时辰赤道环 + 当前时辰高亮 |
| `SunDiurnalRing.vue` | Segment | 日周 | 白昼-曙暮-夜三层弧背景 + 地轴倾斜驱动 |
| `GuanDouSolarTermsRing.vue` | Point | 观斗节气 | 太阳黄经→赤道环节气刻度 |

---

### Layer 4: Base Render Layer (基础渲染层)
**位置**: `src/components/base/*.vue` + `src/components/rings/Data*.vue`

**核心原则：纯渲染，无业务逻辑**

**四层渲染管道：**
```
RingData ──► DataRing ──► CircleRing ──► PolarCanvas
PointRingData ──► DataPointRing ──► PointRing ──► PolarCanvas
BodyRingData ──► DataBodyRing ──► BodyMarker ──► PolarCanvas
```

**基础组件：**

| 组件 | 职责 |
|------|------|
| `PolarCanvas.vue` | 极坐标画布基础，提供动画和坐标系统 |
| `CircleRing.vue` | 段导向 SVG 渲染：扇形、刻度、标签、高亮呼吸动画 |
| `PointRing.vue` | 点导向 SVG 渲染：三种符号（circle/diamond/tick） |
| `RingStack.vue` | 同心环自动布局容器，唯一状态来源的分发枢纽 |
| `DataRing.vue` | 数据→渲染桥梁：`RingData` → `CircleRing` |
| `DataPointRing.vue` | 数据→渲染桥梁：`PointRingData` → `PointRing` |
| `DataBodyRing.vue` | 数据→渲染桥梁：`BodyRingData` → `BodyMarker` |

**共享基础能力：**
- `useRingBase.ts` — 所有环的通用逻辑（半径解析、高亮层级、字体大小、角度计算）
- `useHighlight.ts` — 三级高亮体系（微亮=1 / 中亮=2 / 强亮=3）

---

### Layer 5: Utility Layer (工具层)
**位置**: `src/utils/*.ts`

**核心原则：纯函数，无副作用，独立可测试**

所有工具函数满足：
- ✅ 相同输入始终产生相同输出
- ✅ 不依赖外部状态
- ✅ 不修改输入参数
- ✅ 可独立单元测试

**工具库清单：**

| 工具 | 职责 | 核心算法 |
|------|------|---------|
| `constants/ganzhi.ts` | 干支常量单一真理源 | 十天干 / 十二地支 / 五鼠遁 / 干支命名 |
| `liushiJiazi.ts` | 六柱六十甲子序号计算 | tyme4ts 节气干支映射 |
| `celestial.ts` | 天体坐标计算 | astronomy-engine 黄经赤经转换 |
| `geometry.ts` | 极坐标几何工具 | 角度归一化、坐标转换、SVG 路径生成 |
| `planetMansion.ts` | 七曜入宿计算 | 赤经→宿索引映射、合冲判断 |
| `skyProjection.ts` | 天球坐标投影 | 赤道/黄道/白道投影变换 |
| `geoProjection.ts` | 地面极方位等距投影 | 经纬度 → 极坐标平面（与天球投影同构，LST 锁定） |
| `skyEvents.ts` | 天象事件分级 | 会合/冲/三星聚/四星聚/五星聚 |
| `eraCalendar.ts` | 朝代纪年转换 | 历史年号→公历映射 |
| `chineseCalendar.ts` | 农历工具 | tyme4ts 节气/月相计算 |
| `moonPhase.ts` | 月相计算 | 朔望月相位角/百分比/几何绘制参数 |
| `najia.ts` | 京房纳甲工具 | 六爻天干配纳 + 五行 |
| `guaInfo.ts` | 卦属性派生 | 纳甲 + 本宫五行 → 六亲 + 当位 + 卦五行 + 卦阴阳 + 体性 |
| `wuxing.ts` | 五行工具 | 五行相生相克 + 配色 |
| `beidou.ts` | 北斗计算 | 北斗七星赤经/赤纬（岁差修正）+ 斗柄指向 |
| `ziwei.ts` | 紫微垣 | 紫微垣东西两藩恒星（勾陈一、天皇大帝等） |
| `jianJiang.ts` | 建将映射 | 斗建 / 月将 / 太阳所在 宫位换算 |
| `jingFangYao.ts` | 京房爻辞 | 京房八宫飞伏关系 + 爻辞查询 |
| `guaRelationArrows.ts` | 飞伏关系 | 京房八宫 64 卦飞伏（fei / fu）方向 |

---

## 🏗️ 「圆心 → 圆环」统一分层规划

### 设计哲学：从内到外的完整布局体系

整个罗盘盘面是一个从内到外的完整分层布局，由 RingStack 进行统一管理。圆心是最内层的实心圆区域，圆环是向外层层叠加的环形区域，两者共享同一套时间状态和旋转方向。

---

### 🔵 圆环层 (Ring Layer) - `src/components/rings/`

**统一 Props 接口：**
```typescript
interface RingProps {
  radius: number          // 外半径（必填或可选）
  innerRadius?: number   // 内半径（必有！）
  rotationDirection?: 'clockwise' | 'counterclockwise'
  time?: MaybeRef<Date>  // 时间驱动环必选
}
```

**核心特征：**
- ✅ **内外双径**：所有圆环同时具有 radius 和 innerRadius
- ✅ **径向厚度**：由 RingStack 根据 thickness 自动计算
- ✅ **同心布局**：所有圆环共享同一圆心，永不重叠
- ✅ **完整包围**：360° 完整的环形区域

**圆环三态分类：**

| 维度 | 段环 (Segment) | 点环 (Point) | 体环 (Body) |
|------|---------------|-------------|------------|
| 数据特征 | 角度范围 `[start, end]` | 精确角度 `angle` | 动态天体属性 |
| 渲染方式 | 扇形填充 + 边界刻度 | 点符号 + 径向短线 | 光晕 + 符号 + 标记 |
| 典型用例 | 六十甲子、十二地支、二十八宿 | 二十四节气、赤经刻度 | 日月五星、恒星 |
| 数据模型 | `RingItem[]` | `PointItem[]` | `BodyItem[]` |
| 高亮体系 | 三级呼吸高亮 | 三级高亮 | 事件驱动高亮 |

---

### ⚫ 圆心层 (Center Layer) - `src/components/centers/`

**统一 Props 接口：**
```typescript
interface CenterProps {
  radius?: number        // 仅需 radius（无 innerRadius！）
  rotationDirection?: 'clockwise' | 'counterclockwise'
  time?: MaybeRef<Date> // 时间驱动圆心组件必选
}
```

**核心特征：**
- ✅ **单径原则**：仅有 radius，无 innerRadius（实心圆区域）
- ✅ **自动适配**：通过 RingStack #center slot 接收 `innerRadius` 自动缩放
- ✅ **安全边距**：自动计算内外留白，不与外环碰撞
- ✅ **多层嵌套**：支持多个圆心组件叠加（如 SuzhouSkyMap 叠 WorldMapCenter）

**现有圆心组件：**

| 组件 | 领域 | 典型使用场景 |
|------|------|------------|
| `HelioOrbits.vue` | 日心轨道 | SkyChart 内嵌的日心行星轨道 |
| `LeapInfoCenter.vue` | 闰月信息 | TropicalYearView 盘心，展示当前闰月/月相状态 |
| `BeidouCenter.vue` | 北斗圆心 | GuanDouView 盘心，北斗七星 + 紫微垣 + 勾陈一 + 地平圈 |
| `SuzhouSkyMap.vue` | 苏州星图 | SuzhouStellarMapView 圆心：拱极北斗 + 岁差修正 |
| `WorldMapCenter.vue` | 世界地图 | SuzhouStellarMapView 底层：极方位等距投影海岸线，与 SuzhouSkyMap 共享投影管道，跟随 LST 旋转 |
| `GuaRelationCenter.vue` | 卦关系 | GuaRelationView 中央：64 条飞伏箭头收敛 |

**BaseCenter 基础容器：**
- 可选的辅助容器，用于复杂插槽分发
- 自动计算 `actualRadius = radius × scale`
- 统一透传 timeRef 和 rotationDirection

---

### 🔗 统一布局流程

```
「圆心 → 圆环」统一渲染流程：

┌───────────────────────────────────────────────────────────┐
│  🔵 最外环 (thickness: 22)                                 │
│  🔵 外环 2 (thickness: 28)                                 │
│  ...                                                       │
│  🔵 最内环 (thickness: 自动填充剩余空间)                   │
└───────────────────────────────────────┬───────────────────┘
                                        │
                                        ▼
                              #center slot 暴露 innerRadius
                                        │
                                        ▼
                              ┌───────────────────────┐
                              │  ⚫ 圆心区             │
                              │  BeidouCenter /       │
                              │  HelioOrbits /        │
                              │  SuzhouSkyMap …       │
                              └───────────────────────┘
```

---

## 🧩 开发模式

### 新增一个时间驱动环（推荐用 `/generate-ring` 技能）

1. **选择类型**: Segment / Point / Body
2. **创建组件**: `src/components/rings/XxxRing.vue`，遵循统一范式
3. **提取工具逻辑**: 复杂计算下沉到 `utils/xxx.ts` 纯函数
4. **集成到视图**: 在 RingStack 配置中加入，只传 `time: controlledTime`

**标准骨架：**
```typescript
<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import DataRing from './DataRing.vue'
import { normalizeAngle } from '@/utils/geometry'

/**
 * 环功能说明
 * ⚠️ 时间驱动架构：接受 MaybeRef<Date>，内部统一为 timeRef computed
 */
interface Props {
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  startDegree?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200,
  innerRadius: 180,
  startDegree: 0,
  rotationDirection: 'clockwise'
})

// ⚠️ 范式第一行：统一转换为响应式 timeRef
const timeRef = computed(() => unref(props.time) ?? new Date())

// ⚠️ 范式第二行：所有逻辑派生自 timeRef
const ringData = computed(() => {
  const time = timeRef.value
  // ... 你的计算逻辑
  return { items: [] }
})
</script>

<template>
  <DataRing
    :data="ringData"
    :radius="radius"
    :inner-radius="innerRadius"
    :start-degree="startDegree"
    :rotation-direction="rotationDirection"
  />
</template>
```

### 新增一个静态数据驱动环

```typescript
// src/data/rings/myRing.ts
export const myRing: RingData = {
  radius: 400,
  innerRadius: 380,
  items: [{ label: 'Item 1', startAngle: 0, endAngle: 30 }]
}

// 在视图中集成
{ component: markRaw(DataRing), thickness: 20, props: { data: myRing } }
```

### 新增一个罗盘

1. 创建 `src/views/XxxView.vue`
2. 在 `src/compasses/index.ts` 注册
3. 路由自动生成

---

## 🔧 开发技能 (Claude Code Skills)

项目已内置技能，可直接调用：

| 技能 | 用途 |
|------|------|
| `/generate-ring` | 按五层架构规范生成新环组件，自动合规检查 |

---

## Project Structure

项目由两个顶层目录组成：**docs/** 是 VitePress 站点根，**src/** 是罗盘组件库（被 VitePress 通过 `@` alias 消费）。

```
docs/                              # VitePress 站点根
├── .vitepress/
│   ├── config.ts                  # 站点配置（base='/O/'、outDir='../dist'、nav、sidebar、alias @→src/）
│   └── theme/
│       ├── index.ts               # 主题入口：Layout 分派 + 全局注册 View/环组件
│       ├── tokens.css             # 紫金 design tokens
│       ├── layouts/
│       │   └── CompassLayout.vue  # 全屏罗盘 layout（隐藏 nav/sidebar/aside）
│       └── components/
│           └── CompassFigure.vue  # md 内嵌罗盘插图外壳
├── index.md                       # 站点首页
├── books/                         # 古籍笔记
│   ├── yisizhan/                  # 乙巳占（唐·李淳风）
│   └── 京氏易傳/                   # 京氏易传（汉·京房）— 每卦一页，页内嵌 <SingleGuaChart>
├── concepts/                      # 通用概念索引（岁差 / 纳甲 / 卦气 / 世应 / 七曜 ……）
├── dev/                           # 站内开发文档（components / astronomy-engine）
└── compass/                       # 罗盘页 + 一览页（全部 layout: compass）
    ├── index.md                   # 罗盘一览（<HomeView />）
    ├── liushi-jiazi.md            # <LiushiJiaziView />
    ├── sixty-four-gua.md          # <SixtyFourGuaView />
    ├── jingfang.md                # <JingFangView />
    ├── planet-mansion.md          # <PlanetMansionView />
    ├── tropical-year.md           # <TropicalYearView />
    ├── guan-dou.md                # <GuanDouView />
    ├── gua-relation.md                   # <GuaRelationView />
    └── suzhou-stellar-map.md      # <SuzhouStellarMapView />

src/                               # 组件库（无 main.ts / App.vue / router）
├── compasses/
│   └── index.ts                   # 罗盘注册表（元数据，驱动 HomeView 卡片列表）
├── views/                         # Layer 2: Composition Layer
│   ├── HomeView.vue               # 罗盘一览：卡片式导航
│   ├── LiushiJiaziView.vue        # 六十甲子六环 compass
│   ├── SixtyFourGuaView.vue       # 先天六十四卦盘 compass
│   ├── JingFangView.vue           # 京房六日七分纳甲盘 compass
│   ├── PlanetMansionView.vue      # 七曜入宿天象盘 compass
│   ├── TropicalYearView.vue       # 回归年闰月盘 compass
│   ├── GuanDouView.vue            # 观斗盘 compass
│   ├── GuaRelationView.vue              # 飞伏图盘 compass
│   └── SuzhouStellarMapView.vue   # 苏州石刻天文图 compass
├── components/
│   ├── base/                       # Layer 4: Base Render Layer
│   │   ├── PolarCanvas.vue         # Base polar coordinate canvas
│   │   ├── CircleRing.vue          # Segment-oriented ring renderer
│   │   ├── PointRing.vue           # Point-oriented ring renderer (3 symbol types)
│   │   ├── RingStack.vue           # Concentric auto-layout container
│   │   └── BaseCenter.vue          # Center component base container
│   ├── rings/                       # Layer 3: Ring Domain Components + Data Wrappers
│   │   ├── DataRing.vue            # Data Wrapper: RingData → CircleRing
│   │   ├── DataPointRing.vue       # Data Wrapper: PointRingData → PointRing
│   │   ├── DataBodyRing.vue        # Data Wrapper: BodyRingData → BodyMarker
│   │   ├── DegreeScale.vue         # Specialty: degree-tick ring
│   │   ├── GuaRing.vue             # Specialty: 64 hexagrams
│   │   ├── MansionDegreeRing.vue   # Domain: planet mansion degree marker
│   │   ├── SixtyJiaziRing.vue      # Domain: 60 jiazi time-driven
│   │   ├── BranchesRing.vue        # Domain: 12 branches time-driven
│   │   ├── StemsRing.vue           # Domain: tiangan kongwang time-driven
│   │   ├── ConstellationsRing.vue  # Domain: 28 mansions dynamic RA
│   │   ├── SiXiangRing.vue         # Domain: 4 symbols dynamic RA spans
│   │   ├── SolarTermsRing.vue      # Domain: 24 solar terms (traditional)
│   │   ├── SolarTermsSkyRing.vue   # Domain: 24 solar terms (sky chart)
│   │   ├── SolarTermsPointRing.vue # Domain: 24 solar terms jie/zhongqi color-coded
│   │   ├── SevenLuminariesRing.vue # Domain: 7 planets positioning
│   │   ├── SinglePlanetRing.vue    # Domain: single planet deep study
│   │   ├── SkyChart.vue            # Sky chart projection ring (most inner)
│   │   ├── JingFangGuaRing.vue     # Domain: Jing Fang 60-gua six-days-seven-fen
│   │   ├── JingFangEightPalaceRing.vue # Domain: Jing Fang eight-palace layout
│   │   ├── NajiaRing.vue           # Domain: Huntian najia (纳甲) six-line stems
│   │   ├── ShiYingRing.vue         # Domain: shi-ying (世应) line positions
│   │   ├── LiuRiQiFenScaleRing.vue # Domain: 365.25-day fine scale ring
│   │   ├── DayScaleRing.vue        # Domain: per-day scale + day ganzhi anchor
│   │   ├── LunarMonthsRing.vue     # Domain: lunar months with leap-month highlight
│   │   ├── MoonPhaseRing.vue       # Domain: current-day moon phase
│   │   ├── MonthEstablishRing.vue  # Domain: 斗建（月建） equatorial ring
│   │   ├── MonthGeneralRing.vue    # Domain: 月将（大吉/功曹…） ring
│   │   ├── HourShichenRing.vue     # Domain: 12 时辰 real-time hour ring
│   │   ├── SunDiurnalRing.vue      # Domain: 日周（白昼-曙暮-夜三层） arcs
│   │   └── GuanDouSolarTermsRing.vue # Domain: 观斗节气 (ecliptic → equator)
│   ├── centers/                     # Layer 3: Center Domain Components
│   │   ├── HelioOrbits.vue         # Heliocentric orbits (planet-mansion)
│   │   ├── LeapInfoCenter.vue      # Leap-month / moon-phase info center (tropical-year)
│   │   ├── BeidouCenter.vue        # Beidou + Ziwei enclosure + horizon (guan-dou)
│   │   ├── SuzhouSkyMap.vue        # Suzhou stellar map center
│   │   └── WorldMapCenter.vue      # World map coastline (Natural Earth 110m, LST-locked)
│   ├── sidebar/                     # 罗盘左侧嵌入式 Sidebar（取代旧 Control 面板）
│   │   ├── CompassSidebar.vue      # Sidebar 外壳（挂在 CompassLayout，单点挂载）
│   │   ├── SidebarHeader.vue       # 顶部：返回罗盘列表 + 当前罗盘名 + 折叠按钮
│   │   ├── SidebarToggleHandle.vue # 折叠态的左中悬浮把手（40×80）
│   │   ├── SidebarSection.vue      # 可折叠 section 通用外壳
│   │   ├── SidebarButton.vue       # 侧栏按钮统一样式
│   │   ├── TimePanel.vue           # 时间信息 / 播放 / 步进 / 输入面板
│   │   └── ViewportPanel.vue       # 缩放 / 平移 / 旋转面板
│   ├── gua/                         # 单卦属性图（古籍笔记专用，非罗盘环组件）
│   │   └── SingleGuaChart.vue      # 爻位/爻辞/卦五行/卦阴阳/爻线/当位/纳甲/五行/六亲
│   └── celestial/                   # Celestial visualization
│       ├── BodyMarker.vue          # Celestial body with halos + symbol
│       └── PlanetSvg.vue           # Reusable per-planet SVG glyphs
├── data/                            # 顶层静态数据（跨领域引用）
│   ├── sixtyFourGua.ts             # 先天六十四卦定义（GuaRing / JingFangEightPalaceRing 消费）
│   ├── lunarMansions.ts            # 二十八宿基础表
│   ├── dynasties.ts                # 朝代表（eraCalendar 消费）
│   ├── worldCoastline.ts           # Natural Earth 110m 海岸线数据（WorldMapCenter 消费）
│   └── rings/                      # Static ring DATA
│       ├── types.ts                # Type hierarchy (RingItem/PointItem/BodyItem)
│       ├── index.ts                # Barrel re-export
│       ├── twentyFourSolarTerms.ts # 二十四节气 (static version)
│       ├── twentyEightConstellations.ts # 二十八星宿 (traditional fixed RA)
│       ├── sixtyJiazi.ts           # 六十甲子 (static version)
│       ├── sixtyJiaziNayin.ts      # 五行纳音
│       ├── heavenlyStems.ts        # 十天干
│       ├── tianganKongwang.ts      # 天干空亡
│       ├── twelveLongevity.ts      # 十二长生
│       ├── eightGates.ts           # 八门
│       ├── siXiang.ts              # 四象
│       ├── twelveShichen.ts        # 十二时辰
│       ├── sevenLuminaries.ts      # 七曜 helper functions
│       ├── jingFangSixtyGua.ts     # 京房六十卦定义
│       └── jingFangEightPalaces.ts # 京房八宫六十四卦定义
├── composables/
│   ├── useAnimation.ts             # Animation control
│   ├── useRingBase.ts              # Layer 4 foundation: all ring shared logic + usePolar
│   ├── useSevenLuminaries.ts       # Seven luminaries unified calculation
│   ├── useTimeController.ts        # 受控时间：播放/步进/输入解析（time ref 由 View 提供）
│   ├── useTimeShortcuts.ts         # 时间快捷键（Space/R/Y/M/D/H/N/S）
│   ├── useViewport.ts              # 视口状态 composable（zoom/offset/rotation 统一）
│   ├── useViewportShortcuts.ts     # 视口快捷键（0-9/±/方向键/QWE/C）
│   ├── useSidebarLayout.ts         # 侧栏折叠 + section 状态 + localStorage 持久化
│   ├── useCompassContext.ts        # 跨 Layout/View 单例：View → Sidebar 状态桥
│   ├── useCompassMeta.ts           # 从当前 URL 匹配 compasses[] 元数据
│   ├── useAltDragPan.ts            # Alt + 拖拽平移 / Alt + 滚轮缩放
│   ├── useGeolocation.ts           # 浏览器定位（观斗盘地平圈使用）
│   ├── useLiveClock.ts             # 1Hz 实时时钟 composable（Liushi/PlanetMansion View）
│   └── useUrlTime.ts               # URL ↔ controlledTime 双向绑定（History API 实现）
└── utils/                          # Layer 5: Utility Layer (Pure Functions)
    ├── constants/
    │   └── ganzhi.ts               # 干支常量的单一真理源
    ├── chineseCalendar.ts          # Chinese calendar helpers (tyme4ts)
    ├── liushiJiazi.ts              # Six-pillar 60-jiazi index calc
    ├── celestial.ts                # Celestial coordinate calculations
    ├── eraCalendar.ts              # Dynasty era conversion
    ├── geometry.ts                 # Polar geometry utilities
    ├── planetMansion.ts            # Planet mansion calculations
    ├── skyEvents.ts                # Celestial event calculations
    ├── skyProjection.ts            # Sky coordinate projection
    ├── geoProjection.ts             # Ground lon/lat → azimuthal equidistant plane (LST-locked)
    ├── moonPhase.ts                # Moon-phase geometry (SVG 绘制参数)
    ├── najia.ts                    # 京房纳甲工具
    ├── guaInfo.ts                   # 卦属性派生：纳甲/六亲/当位/卦五行/卦阴阳/体性
    ├── wuxing.ts                   # 五行相生相克 + 配色
    ├── beidou.ts                   # 北斗七星赤经赤纬（岁差修正）+ 斗柄指向
    ├── ziwei.ts                    # 紫微垣东西两藩恒星
    ├── jianJiang.ts                # 斗建 / 月将 / 太阳所在 宫位换算
    ├── jingFangYao.ts              # 京房爻辞 + 飞伏查询
    └── feifu.ts                    # 京房八宫 64 卦飞伏方向
```

---

## 🔗 VitePress ↔ src/ 融合关系

项目**没有 SPA 入口**——`main.ts` / `App.vue` / `src/router/` / 根级 `vite.config.ts` 都已删除。所有页面（含罗盘）都由 VitePress 生成，src/ 只作为组件库被消费。

### 1. VitePress 如何找到 src/

`docs/.vitepress/config.ts` 里给 VitePress 内嵌的 Vite 加了别名：

```ts
vite: {
  resolve: {
    alias: { '@': fileURLToPath(new URL('../../src', import.meta.url)) }
  },
  ssr: { noExternal: ['astronomy-engine', 'tyme4ts'] }, // 让这两个 CJS 库能 SSR 内联
}
```

于是 `docs/.vitepress/theme/index.ts` 可以：

```ts
import LiushiJiaziView from '@/views/LiushiJiaziView.vue'
import ConstellationsRing from '@/components/rings/ConstellationsRing.vue'
```

### 2. 罗盘页三件套

每个罗盘由三个部分构成：

| 位置 | 内容 |
|------|------|
| `src/compasses/index.ts` 一项 | 元数据：id / name / description / category |
| `src/views/XxxView.vue` | Layer 2 View：持 `controlledTime`，编排 rings |
| `docs/compass/xxx.md` | 极简 md：仅 frontmatter + `<ClientOnly><XxxView /></ClientOnly>` |

md 页面靠 `layout: compass` 触发 `CompassLayout` 全屏渲染，隐藏 VitePress 默认的 nav/sidebar/aside。

### 3. Layout 分派机制

`docs/.vitepress/theme/index.ts` 里根据 frontmatter 决定 Layout：

```ts
Layout: () => {
  const { frontmatter } = useData()
  if (frontmatter.value.layout === 'compass') return h(CompassLayout)
  return h(DefaultTheme.Layout)
}
```

普通文档页走 `DefaultTheme.Layout`，罗盘页走 `CompassLayout`。

### 4. 时间与 URL 联动

罗盘页支持 URL 参数 `?t=YYYY-MM-DDTHH:MM` 精确定位。因为项目不使用 vue-router，`useUrlTime.ts` 直接用 `window.location` + `window.history.replaceState` + `popstate` 实现双向绑定：

```ts
// src/composables/useUrlTime.ts
export function useUrlTime(paramName = 't') {
  const controlledTime = ref<Date>(parseFromQuery() ?? new Date())
  watch(controlledTime, t => writeQuery(paramName, formatTime(t)))
  window.addEventListener('popstate', () => { /* 重读 */ })
  return { controlledTime }
}
```

### 5. Sidebar 单点挂载与跨 Layout 状态桥

罗盘控制面板由 `CompassLayout` 单点挂载（`<CompassSidebar>` 一份供 9 个 View 共享），不是每个 View 各自持有。这就带来一个 Vue 树的现实问题：

- `<CompassSidebar>` 挂在 Layout 里，是 `<Content />`（也就是 View）的**兄弟节点**
- View 里的 `provide()` 只向下传递，Sidebar 收不到
- 但 Sidebar 又必须读到 View 的 `controlledTime` / `viewport`

方案是 **模块级单例 `shallowRef`**：

```ts
// src/composables/useCompassContext.ts —— 模块级共享状态
const currentContext = shallowRef<CompassContext | null>(null)

// View 侧：onMounted 注册、onUnmounted 清空
export function provideCompassContext(ctx: CompassContext) {
  onMounted(() => { currentContext.value = ctx })
  onUnmounted(() => { if (currentContext.value === ctx) currentContext.value = null })
}

// Sidebar 侧：直接读全局单例
export function useCompassContext(): Ref<CompassContext | null> {
  return currentContext
}
```

为什么单例是安全的？**罗盘页任意时刻只有一个 View 存活**（VitePress 切换页面时 `<Content />` 会重新挂载），多 View 不共存，onUnmounted 保证清空。

**View 专属工具位** 走另一条路：`<Teleport to="#sidebar-view-tools">` 把 View 自己的控件（如 `SuzhouStellarMapView` 的朝向切换、`GuaRelationView` 的三条筛选栏）投递到 Sidebar 常驻的挂载点。空 Teleport 目标由 CSS `:has(:empty)` 自动隐藏，无需 JS 观察。

### 6. md 中内嵌罗盘（插图模式）

古籍笔记 md 里可以直接引用环组件作为插图，与全屏罗盘共用同一份代码：

```md
<CompassFigure caption="四象方位">
  <SiXiangRing :radius="240" />
</CompassFigure>
```

需要的环组件已在 `theme/index.ts` 里全局注册。

除环组件外，`SingleGuaChart` 也在此处全局注册，供古籍笔记（如 `docs/books/京氏易傳/*.md`）直接内嵌单卦属性图：

```md
<SingleGuaChart :value="63" :yao-text="['潜龙勿用', '见龙在田', ...]" />
```

它是**非环组件**、完全静态（无 time / 无 ClientOnly），单纯派生自 `utils/guaInfo.ts`。属于「盘面之外的书籍插图」这一类：与罗盘共用配色与数据源，但独立于五层架构，故放在 `src/components/gua/` 而非 `rings/` 或 `centers/`。

### 7. 构建产物

- `npm run build` → `vitepress build docs` → 产物直接落在项目根 `dist/`（由 `outDir: '../dist'` 指定）
- GitHub Actions 上传 `./dist` 到 GitHub Pages
- 所有页面共用一个 base `/O/`

## Development Commands

```bash
npm run dev          # VitePress dev server（含文档 + 罗盘），默认 http://localhost:5173/O/
npm run build        # vitepress build docs → dist/
npm run preview      # 预览生产产物
npm run type-check   # vue-tsc --build --noEmit（覆盖 src/ 与 docs/.vitepress/theme/）
npm run lint         # ESLint --fix
npm run format       # Prettier on src/ + docs/.vitepress/
npm run test:unit    # Vitest（jsdom 环境）
npm run test:e2e     # Playwright e2e
npm run deploy       # build + gh-pages -d dist（也可交给 GitHub Actions）
```

## Architecture Compliance Checklist (30 Items)

开发新组件时请确认：

### 所有组件通用

| # | 检查项 | 必须通过 |
|---|--------|---------|
| 1 | 命名规范：圆环以 `Ring` 结尾，圆心以语义化命名 | ✅ |
| 2 | 必须有中文 JSDoc 说明用途 | ✅ |
| 3 | 时间驱动必须声明 `time?: MaybeRef<Date>` | ✅ |
| 4 | 必须有 `timeRef = computed(() => unref(props.time) ?? new Date())` | ✅ |
| 5 | 所有业务计算均在内部 computed 中完成 | ✅ |
| 6 | 不使用 `props.time?.value` 直接解包（破坏响应式链） | ✅ |
| 7 | 不向父组件 emit 任何数据（单向数据流） | ✅ |
| 8 | 不使用全局状态 | ✅ |
| 9 | 纯函数逻辑优先抽取到 utils/ 层 | ✅ |
| 10 | 所有 computed 均派生自 timeRef | ✅ |
| 11 | 不使用 watch 监听 time（直接用 computed 派生） | ✅ |
| 12 | TypeScript 严格模式下无类型错误 | ✅ |
| 13 | 不使用 any 类型（必要时用 unknown + 类型守卫） | ✅ |
| 14 | 颜色体系必须与全盘五行配色保持一致 | ✅ |

### 🔵 圆环组件专用

| # | 检查项 | 必须通过 |
|---|--------|---------|
| 15 | Props 声明完整 radius/innerRadius/rotationDirection | ✅ |
| 16 | 必须支持 rotationDirection 属性并透传给渲染器 | ✅ |
| 17 | 高亮逻辑必须使用 highlightLevel 三级体系 | ✅ |
| 18 | 角度计算必须使用 utils/geometry 的统一函数 | ✅ |
| 19 | 天星版赤经约定：赤经 angle = 360 - ra | ✅ |
| 20 | 段环必须使用 DataRing 渲染器 | ✅ |
| 21 | 点环必须使用 DataPointRing 渲染器 | ✅ |
| 22 | 点环必须明确指定 pointSymbol 类型 | ✅ |
| 23 | 体环必须使用 polarToCartesian 坐标转换 | ✅ |
| 24 | 静态数据必须放在 src/data/rings/ 目录下 | ✅ |
| 25 | 静态数据必须导出 RingData / PointRingData 类型 | ✅ |

### ⚫ 圆心组件专用

| # | 检查项 | 必须通过 |
|---|--------|---------|
| 26 | **禁止声明 innerRadius**（圆心只有 radius） | ✅ |
| 27 | 必须声明 radius 和 rotationDirection 属性 | ✅ |
| 28 | 必须放在 `src/components/centers/` 目录下 | ✅ |
| 29 | 只能通过 RingStack #center slot 注入使用 | ✅ |
| 30 | 多层嵌套时需正确计算各自的缩放系数 | ✅ |

---

## Key Files for Understanding

- `src/composables/useRingBase.ts` — **架构基础**：所有环类型的共享逻辑
- `src/views/PlanetMansionView.vue` — **架构参考**：最完整的段+点+体混合布局
- `src/components/rings/SixtyJiaziRing.vue` — **范式参考**：标准时间驱动组件骨架
- `src/utils/liushiJiazi.ts` — **工具层参考**：纯函数领域计算范例
- `src/components/base/RingStack.vue` — **布局中枢**：唯一状态源的分发枢纽
- `src/components/gua/SingleGuaChart.vue` — **书籍插图范式**：非环、静态、纯派生 utils 的组件写法
