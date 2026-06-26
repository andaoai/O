# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Chinese traditional compass visualization platform** (中华传统罗盘可视化平台) built with Vue 3 + TypeScript. It is a multi-page app: a home page lists available "compasses" (罗盘), and each compass is a full-screen, polar-coordinate SVG visualization of traditional Chinese cosmological elements.

Four compasses currently ship:

- **中华天文圆环 (astronomy)** — a full astronomical disk stacking many concentric rings: 360-degree degree scale, 24 solar terms (二十四节气), 28 constellations (二十八星宿), 60 jiazi (六十甲子) with five-element nayin (五行纳音), 10 heavenly stems (十天干) with void positions (天干空亡), 12 longevity stages (十二长生), 12 earthly branches (十二地支), 8 gates (八门), four celestial symbols (四象), plus a solar ecliptic and a Taiji (太极) at the center.
- **六十甲子六环 (liushi-jiazi)** — six concentric 60-jiazi rings (year/month/day/hour/minute/second pillars) that track real time and highlight the current ganzhi cell on each ring.
- **七曜入宿天象盘 (planet-mansion)** — celestial sky projection with polar equator, ecliptic and lunar orbit obliquity, sun/moon/five planets real-time positioning into 28 mansions, featuring point-based 24 solar terms outer ring.
- **先天六十四卦盘 (sixty-four-gua)** — Fu Xi/Shao Yong's先天 circular diagram: 64 hexagrams arranged by binary bit-reversal order, Qian south Kun north, displaying hexagram symbols, names and six lines.

Core libraries: **astronomy-engine** for precise solar position, **tyme4ts** for traditional calendar / ganzhi calculations, **vue-router** for the multi-page structure.

## Architecture

The project evolved from a "one .vue component per ring" design → **data-driven multi-page** architecture → **hybrid static data + time-driven dedicated components** architecture → **finalized 5-layer unified time-driven architecture**.

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
│  └─ Views: 持有状态，编排组件，通过 RingStack 布局             │
│     AstronomyView, LiushiJiaziView, PlanetMansionView        │
└────────────────────────────────────┬────────────────────────┘
                                     │
┌────────────────────────────────────┴────────────────────────┐
│  Layer 3: Domain Component Layer (领域组件层)                 │
│  └─ 时间驱动专用环：SixtyJiaziRing, BranchesRing,             │
│     ConstellationsRing, SolarTermsSkyRing, SiXiangRing,      │
│     SevenLuminariesRing, MansionDegreeRing, SinglePlanetRing │
└────────────────────────────────────┬────────────────────────┘
                                     │
┌────────────────────────────────────┴────────────────────────┐
│  Layer 4: Base Render Layer (基础渲染层)                      │
│  ├─ Data Wrappers: DataRing, DataPointRing, DataBodyRing    │
│  ├─ Base Renderers: CircleRing, PointRing                    │
│  └─ Layout Container: RingStack, PolarCanvas                 │
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
- 无全局状态管理（Pinia 已安装但未使用，状态在视图内局部持有）
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

**关键特性：**
1. **RingStack 自动布局**: 从外向内自动分配 `radius`/`innerRadius`，永不重叠
2. **统一注入**: `rotationDirection` 统一注入所有子环
3. **实时时钟**: `LiushiJiaziView` / `PlanetMansionView` 内置 1Hz 实时时钟
4. **无计算**: 所有 `computed` 仅用于布局参数，不涉及领域逻辑

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
| `liushiJiazi.ts` | 六柱六十甲子序号计算 | tyme4ts 节气干支映射 |
| `celestial.ts` | 天体坐标计算 | astronomy-engine 黄经赤经转换 |
| `geometry.ts` | 极坐标几何工具 | 角度归一化、坐标转换、SVG 路径生成 |
| `planetMansion.ts` | 七曜入宿计算 | 赤经→宿索引映射、合冲判断 |
| `skyProjection.ts` | 天球坐标投影 | 赤道/黄道/白道投影变换 |
| `skyEvents.ts` | 天象事件分级 | 会合/冲/三星聚/四星聚/五星聚 |
| `eraCalendar.ts` | 朝代纪年转换 | 历史年号→公历映射 |
| `chineseCalendar.ts` | 农历工具 | tyme4ts 节气/月相计算 |

---

## 三态圆环分类系统

| 维度 | 段环 (Segment) | 点环 (Point) | 体环 (Body) |
|------|---------------|-------------|------------|
| 数据特征 | 角度范围 `[start, end]` | 精确角度 `angle` | 动态天体属性 |
| 渲染方式 | 扇形填充 + 边界刻度 | 点符号 + 径向短线 | 光晕 + 符号 + 标记 |
| 典型用例 | 六十甲子、十二地支、二十八宿 | 二十四节气、赤经刻度 | 日月五星、恒星 |
| 数据模型 | `RingItem[]` | `PointItem[]` | `BodyItem[]` |
| 高亮体系 | 三级呼吸高亮 | 三级高亮 | 事件驱动高亮 |

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

```
src/
├── compasses/
│   └── index.ts                   # Compass registry (drives home grid + routes)
├── views/                         # Layer 2: Composition Layer
│   ├── HomeView.vue               # Home page: grid of compass cards
│   ├── AstronomyView.vue          # 中华天文圆环 compass
│   ├── LiushiJiaziView.vue        # 六十甲子六环 compass
│   ├── PlanetMansionView.vue      # 七曜入宿天象盘 compass
│   └── SixtyFourGuaView.vue       # 先天六十四卦盘 compass
├── components/
│   ├── base/                       # Layer 4: Base Render Layer
│   │   ├── PolarCanvas.vue         # Base polar coordinate canvas
│   │   ├── CircleRing.vue          # Segment-oriented ring renderer
│   │   ├── PointRing.vue           # Point-oriented ring renderer (3 symbol types)
│   │   └── RingStack.vue           # Concentric auto-layout container
│   ├── rings/                       # Layer 3: Domain Component Layer + Data Wrappers
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
│   │   ├── SevenLuminariesRing.vue # Domain: 7 planets positioning
│   │   └── SinglePlanetRing.vue    # Domain: single planet deep study
│   ├── celestial/                   # Celestial visualization
│   │   ├── BodyMarker.vue          # Celestial body with halos + symbol
│   │   ├── CelestialBody.vue       # Celestial body container
│   │   ├── EclipticCircle.vue      # Ecliptic circle rendering
│   │   └── LunarOrbit.vue          # Lunar orbit rendering
│   ├── HelioOrbits.vue             # Heliocentric orbits (planet-mansion)
│   ├── SkyChart.vue                # Complete sky chart projection
│   ├── SolarEcliptic.vue           # Solar ecliptic via astronomy-engine
│   ├── TaiChi.vue                  # Time-driven Taiji disk
│   └── Control.vue                 # Unified time / zoom / pan / rotation panel
├── data/rings/                     # Static ring DATA
│   ├── types.ts                    # Type hierarchy (RingItem/PointItem/BodyItem)
│   ├── index.ts                    # Barrel re-export
│   ├── twentyFourSolarTerms.ts     # 二十四节气 (static version)
│   ├── twentyEightConstellations.ts # 二十八星宿 (traditional fixed RA)
│   ├── sixtyJiazi.ts               # 六十甲子 (static version)
│   ├── sixtyJiaziNayin.ts          # 五行纳音
│   ├── heavenlyStems.ts            # 十天干
│   ├── tianganKongwang.ts          # 天干空亡
│   ├── twelveLongevity.ts          # 十二长生
│   ├── earthlyBranches.ts          # 十二地支
│   ├── eightGates.ts               # 八门
│   ├── siXiang.ts                  # 四象
│   ├── seventyTwoHou.ts            # 七十二候
│   ├── twelveShichen.ts            # 十二时辰
│   └── sevenLuminaries.ts          # 七曜 helper functions
├── composables/
│   ├── useAnimation.ts             # Animation control
│   ├── useRingBase.ts              # Layer 4 foundation: all ring shared logic
│   ├── useSevenLuminaries.ts       # Seven luminaries unified calculation
│   ├── useTimePlayback.ts          # Time playback control (from Control)
│   ├── usePanelDrag.ts             # Panel dragging (from Control)
│   └── useKeyboardShortcuts.ts     # Keyboard shortcuts (from Control)
├── utils/                          # Layer 5: Utility Layer (Pure Functions)
│   ├── chineseCalendar.ts          # Chinese calendar helpers (tyme4ts)
│   ├── liushiJiazi.ts              # Six-pillar 60-jiazi index calc
│   ├── celestial.ts                # Celestial coordinate calculations
│   ├── eraCalendar.ts              # Dynasty era conversion
│   ├── geometry.ts                 # Polar geometry utilities
│   ├── planetMansion.ts            # Planet mansion calculations
│   ├── skyEvents.ts                # Celestial event calculations
│   └── skyProjection.ts            # Sky coordinate projection
├── router/index.ts                 # Routes generated from compass registry
├── App.vue                         # Shell: just <RouterView />
└── main.ts                         # App entry (Vue + Pinia + Router)
```

## Development Commands

```bash
npm run dev          # Development server (Vite)
npm run build        # Type-check + production build
npm run preview      # Preview production build
npm run type-check   # vue-tsc type checking
npm run lint         # ESLint with auto-fix
npm run format       # Prettier on src/
npm run test:unit    # Vitest unit tests
npm run test:e2e     # Playwright e2e tests
npm run deploy       # Build + publish dist/ to gh-pages
```

## Architecture Compliance Checklist (25 Items)

开发新环时请确认：

| # | 检查项 | 必须通过 |
|---|--------|---------|
| 1 | 组件命名以 `Ring` 结尾 | ✅ |
| 2 | 必须有中文 JSDoc 说明用途 | ✅ |
| 3 | Props 声明完整 radius/innerRadius/rotationDirection | ✅ |
| 4 | 时间驱动必须声明 `time?: MaybeRef<Date>` | ✅ |
| 5 | 必须有 `timeRef = computed(() => unref(props.time) ?? new Date())` | ✅ |
| 6 | 所有业务计算均在内部 computed 中完成 | ✅ |
| 7 | 不使用 `props.time?.value` 直接解包（破坏响应式链） | ✅ |
| 8 | 不向父组件 emit 任何数据（单向数据流） | ✅ |
| 9 | 不使用全局状态 | ✅ |
| 10 | 纯函数逻辑优先抽取到 utils/ 层 | ✅ |
| 11 | 所有 computed 均派生自 timeRef | ✅ |
| 12 | 不使用 watch 监听 time（直接用 computed 派生） | ✅ |
| 13 | 必须支持 rotationDirection 属性并透传给渲染器 | ✅ |
| 14 | TypeScript 严格模式下无类型错误 | ✅ |
| 15 | 不使用 any 类型（必要时用 unknown + 类型守卫） | ✅ |
| 16 | 高亮逻辑必须使用 highlightLevel 三级体系 | ✅ |
| 17 | 颜色体系必须与全盘五行配色保持一致 | ✅ |
| 18 | 角度计算必须使用 utils/geometry 的统一函数 | ✅ |
|
19 |天星版赤经约定：赤经 angle = 360 - ra | ✅ | ✅ |
| 20 | 段环必须使用 DataRing 渲染器 | ✅ |
| 21 | 点环必须使用 DataPointRing 渲染器 | ✅ |
| 22 | 点环必须明确指定 pointSymbol 类型 | ✅ |
|
23 | 体环必须使用 polarToCartesian 坐标转换 | ✅ |
| 24 |静态数据必须放在 src/data/rings/ 目录下 | ✅ |
| 25 |静态数据必须导出 RingData / PointRingData 类型 | ✅ |

---

## Key Files for Understanding

- `src/composables/useRingBase.ts` — **架构基础**：所有环类型的共享逻辑
- `src/views/PlanetMansionView.vue` — **架构参考**：最完整的段+点+体混合布局
- `src/components/rings/SixtyJiaziRing.vue` — **范式参考**：标准时间驱动组件骨架
- `src/utils/liushiJiazi.ts` — **工具层参考**：纯函数领域计算范例
- `src/components/base/RingStack.vue` — **布局中枢**：唯一状态源的分发枢纽
