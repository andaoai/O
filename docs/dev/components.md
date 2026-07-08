# 组件文档 - Component Documentation

本文档说明**乙巳观**（道由天观）中各组件的功能、API 和用法。整体架构（VitePress 单栈、数据驱动圆环、同心自动布局）见仓库根的 [README.md](https://github.com/andaoai/O/blob/main/README.md) 与 [CLAUDE.md](https://github.com/andaoai/O/blob/main/CLAUDE.md)。

## 📚 目录

- [数据层](#数据层)
  - [类型继承体系](#类型继承体系)
  - [RingData / RingItem](#ringdata--ringitem-段导向圆环数据契约)
  - [PointRingData / PointItem](#pointringdata--pointitem-点导向圆环数据契约)
- [基础组件](#基础组件)
  - [PolarCanvas](#polarcanvas-极坐标画布组件)
  - [CircleRing](#circlering-通用段导向圆环渲染器)
  - [PointRing](#pointring-通用点导向圆环渲染器)
  - [RingStack](#ringstack-同心圆环自动布局)
- [圆环组件](#圆环组件)
  - [DataRing](#dataring-数据驱动段圆环)
  - [DataPointRing](#datapointring-数据驱动点圆环)
  - [DegreeScale](#degreescale-度数刻度环)
- [天文组件](#天文组件)
  - [SolarEcliptic](#solarecliptic-黄道天体组件)
  - [TaiChi](#taichi-太极图组件)
- [控制面板 · Sidebar](#控制面板--sidebar)
  - [CompassSidebar](#compasssidebar-罗盘左侧嵌入式-sidebar)
  - [View 专属工具位（Teleport）](#view-专属工具位teleport)
- [可复用 Composable](#可复用-composable)
  - [useTimeController](#usetimecontroller-受控时间控制器)
  - [useViewport](#useviewport-视口状态)
  - [useTimeShortcuts / useViewportShortcuts](#usetimeshortcuts--useviewportshortcuts-快捷键)
  - [useAltDragPan](#usealtdragpan-alt--拖拽平移--滚轮缩放)
  - [useCompassContext](#usecompasscontext-跨-layoutview-状态桥)
  - [useSidebarLayout](#usesidebarlayout-侧栏折叠状态)
  - [useUrlTime](#useurltime-url--受控时间双向绑定)
  - [useLiveClock](#useliveclock-1hz-实时时钟)
- [平台层](#平台层)
  - [罗盘注册表与路由](#罗盘注册表与路由)
- [开发指南](#开发指南)

---

## 数据层

### 类型继承体系

定义于 `src/data/rings/types.ts`。项目使用类型继承消除重复代码：

```
RingItemBase (所有 item 通用)
  ├─ RingItem (段导向分格)
  └─ PointItem (点导向点)

RingDataBase (所有环通用)
  ├─ RingData (段导向环)
  └─ PointRingData (点导向环)
```

**基础公共字段**（`RingItemBase`）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `label` | string | 标签文字 |
| `color` | string? | 自定义颜色（缺省用环默认） |
| `fontSize` | number? | 自定义字号 |
| `highlight` | boolean? | 高亮（兼容旧数据） |
| `highlightLevel` | 0 \| 1 \| 2 \| 3? | 分级高亮：0无/1弱/2中/3强（优先于 highlight） |

**基础公共字段**（`RingDataBase`）：
| 字段 | 类型 | 说明 |
|------|------|------|
| `startDegree` | number? | 默认起始度数偏移 |
| `radius` | number? | 默认外半径 |
| `innerRadius` | number? | 默认内半径 |
| `labelColor` | string? | 标签默认颜色 |
| `fontSize` | number? | 统一字号（item.fontSize 优先） |
| `circleColor` | string? | 圆环边线颜色 |
| `circleWidth` | number? | 圆环边线宽度 |

---

### RingData / RingItem（段导向圆环数据契约）

段导向：每个条目占据一个角度区间 `[startAngle, endAngle]`。

#### RingItem（单个分格）

| 字段 | 类型 | 说明 |
|------|------|------|
| `startAngle` | number? | 自定义起始角度（缺省按 items 均分 360°） |
| `endAngle` | number? | 自定义结束角度 |

#### RingData（一个段导向环）

| 字段 | 类型 | 说明 |
|------|------|------|
| `items` | RingItem[] | 该环的分格数据（必填） |
| `labelPosition` | number? | 标签径向位置比例 (0-1) |
| `tickWidth` | number? | 刻度线宽 |
| `tickColor` | string? | 刻度线颜色 |
| `showSectors` | boolean? | 是否显示扇形背景 |
| `verticalTwoChar` | boolean? | 双字标签是否竖排 |

#### 示例（`src/data/rings/twelveShichen.ts` 节选）

```typescript
import type { RingData } from './types'

export const twelveShichen: RingData = {
  startDegree: -90,
  radius: 280,
  innerRadius: 250,
  circleColor: '#888888',
  tickColor: '#666666',
  tickWidth: 0.8,
  items: [
    { label: '子', color: '#0D47A1', startAngle: 345, endAngle: 15 },
    { label: '丑', color: '#795548', startAngle: 15, endAngle: 45 },
    // …其余地支
  ]
}
```

---

### PointRingData / PointItem（点导向圆环数据契约）

点导向：每个条目落在**精确角度**上（如二十四节气按黄经精确到度）。

#### PointItem（单个点）

| 字段 | 类型 | 说明 |
|------|------|------|
| `angle` | number? | 点的精确角度（缺省按 items 均分 360°） |
| `pointSize` | number? | 点的大小（像素） |
| `pointColor` | string? | 点的颜色（独立于标签） |
| `pointSymbol` | `'circle' \| 'diamond' \| 'tick'`? | 点的符号形状 |

#### PointRingData（一个点导向环）

| 字段 | 类型 | 说明 |
|------|------|------|
| `items` | PointItem[] | 该环的点数据（必填） |
| `labelOffset` | number? | 标签径向偏移：正数向外，负数向内（相对于点位置） |
| `labelAngleOffset` | number? | 标签角度偏移（度）：避免与刻度线重叠 |
| `pointSize` | number? | 默认点大小 |
| `pointColor` | string? | 默认点颜色 |
| `pointSymbol` | `'circle' \| 'diamond' \| 'tick'`? | 默认点符号 |

**符号类型**：
| 符号 | 用途 | 说明 |
|------|------|------|
| `tick` | 二十四节气、度数标记 | 径向短线，从外圆向内占 25% 环厚 |
| `circle` | 行星、标记 | 实心圆在点半径上 |
| `diamond` | 特殊点（二分二至） | 菱形在点半径上 |

#### 示例（`src/data/rings/twentyFourSolarTerms.ts` 节选）

```typescript
import type { PointRingData } from './types'

export const twentyFourSolarTerms: PointRingData = {
  radius: 460,
  innerRadius: 440,
  pointSymbol: 'tick',
  labelOffset: -15,
  labelAngleOffset: 2.5,
  items: [
    { label: '春分', angle: 0, pointColor: '#00ff88', highlightLevel: 3 },
    { label: '清明', angle: 15, pointColor: '#88ddaa' },
    // …其余节气
  ]
}
```

---

### BodyRingData / BodyItem（天体导向圆环数据契约）*NEW!*

天体导向：每个条目是一个在精确角度上的发光天体（太阳、月亮、五星、恒星等），带光晕、逆行标记、黄纬偏移等特殊状态。

#### BodyState（天体特殊状态）

| 字段 | 类型 | 说明 |
|------|------|------|
| `retrograde` | boolean? | 是否逆行（触发逆行虚线环） |
| `latitude` | number? | 黄纬（度），用于径向偏移 |
| `aspect` | `'conjunction' \| 'opposition'`? | 相位事件：合 / 冲 |
| `mansion` | `{ label: string; degree: number }`? | 入宿信息 |
| `conjunctionKind` | `'inferior' \| 'superior'`? | 上下合类型（仅内行星） |

#### BodyItem（单个天体）

继承自 `RingItemBase`，所有基础字段（`label`、`color`、`fontSize`、`highlightLevel`）均可用。

| 字段 | 类型 | 说明 |
|------|------|------|
| `angle` | number | 天体精确角度（度，必填） |
| `kind` | `BodyKind` | 天体类型：`'sun' \| 'moon' \| 'mercury' \| 'venus' \| 'mars' \| 'jupiter' \| 'saturn' \| 'star'` |
| `haloLevel` | 0 \| 1 \| 2 \| 3? | 光晕层数（优先于 `highlightLevel`） |
| `state` | BodyState? | 天体特殊状态 |
| `symbol` | string | 单字符号（必填） |
| `size` | number? | 本体半径（px，默认 14） |
| `symbolColor` | string? | 符号颜色（默认白色） |

#### BodyRingData（一个天体导向环）

继承自 `RingDataBase`，所有基础字段均可用。

| 字段 | 类型 | 说明 |
|------|------|------|
| `items` | BodyItem[] | 该环的天体数据（1~N 个，必填） |
| `defaultHalos` | Halo[]? | 默认光晕配置（外→内，每个 Halo = `{ radius, opacity }`） |
| `latScale` | number? | 黄纬偏移缩放因子（像素/sin纬） |
| `showLatLine` | boolean? | 是否显示黄纬偏移指示线 |
| `showRetrogradeRing` | boolean? | 是否显示逆行标记环 |
| `labelOffset` | number? | 标签径向偏移：正数向外，负数向内 |

#### 便捷构造函数（`src/data/rings/sevenLuminaries.ts`）

| 函数 | 用途 |
|------|------|
| `singlePlanetBody(key, angle, options)` | 单行星研究盘（最常用） |
| `twoPlanetsBody(key1, angle1, key2, angle2, options)` | 双行星合冲对照 |
| `sevenLuminariesBody(angles, states)` | 七曜全图盘 |
| `emptyBodyRing()` | 空天体环（用于动态添加） |

#### 示例：单木星研究盘

```typescript
import { singlePlanetBody } from '@/data/rings/sevenLuminaries'

// 木星在黄经 120 度，逆行，带 2.5 度黄纬偏移
const jupiterRing = singlePlanetBody('jupiter', 120, {
  retrograde: true,
  latitude: 2.5,
  highlightLevel: 3,
  mansion: { label: '井', degree: 12.5 }
})
```

现有数据文件：`twentyFourSolarTerms`、`twentyEightConstellations`、`sixtyJiazi`、`sixtyJiaziNayin`、`heavenlyStems`、`tianganKongwang`、`twelveLongevity`、`eightGates`、`siXiang`、`twelveShichen`、`sevenLuminaries`、`jingFangSixtyGua`、`jingFangEightPalaces`，统一从 `src/data/rings/index.ts` 导出。

---

## 基础组件

### PolarCanvas 极坐标画布组件

所有极坐标组件的基础画布，提供统一坐标系与动画。

#### 特性
- **标准极坐标系** — 0 度在正右方（3 点钟方向），顺时针增加
- **统一动画管理** — 通过 `useAnimation` composable
- **坐标转换工具** — 极坐标 ↔ 笛卡尔坐标
- **路径生成** — 圆弧、扇形路径

#### Slot 工具函数

```vue
<PolarCanvas>
  <template #default="slotProps">
    <!-- slotProps.centerX / centerY        圆心坐标 -->
    <!-- slotProps.totalRotation            总旋转角度 -->
    <!-- slotProps.polarToCartesian(angle, radius)        极坐标→笛卡尔 -->
    <!-- slotProps.getMidAngle(start, end)                角度中点 -->
    <!-- slotProps.generateArcPath(cx, cy, r, start, end) 圆弧/扇形路径 -->
  </template>
</PolarCanvas>
```

---

### CircleRing 通用段导向圆环渲染器

真正负责绘制一个段导向圆环（扇形、刻度线、标签、高亮呼吸动画），构建于 `PolarCanvas` 之上。通常不直接使用，而是经由 `DataRing` 驱动。

#### Props（节选）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `radius` | number | — | 外半径（必填） |
| `innerRadius` | number | 0 | 内半径（>0 为环形） |
| `items` | RingItem[] | — | 分格数据 |
| `showLabels` | boolean | true | 显示标签文字 |
| `labelColor` | string | 'white' | 标签默认色 |
| `labelPosition` | number | 0.7 | 文字径向位置比例（0-1） |
| `showTicks` | boolean | true | 显示刻度线 |
| `tickWidth` / `tickColor` | number / string | 0.5 / 'white' | 刻度线宽 / 色 |
| `showCircle` | boolean | true | 显示圆环边线 |
| `circleWidth` / `circleColor` | number / string | 1 / 'white' | 边线宽 / 色 |
| `showSectors` | boolean | false | 显示扇形区域 |
| `rotation` | number | 0 | 整体旋转角度 |
| `enableAnimation` | boolean | false | 自动旋转动画 |
| `animationSpeed` | number | 0.5 | 动画速度（度/帧，负数逆时针） |
| `startDegree` | number | 0 | 起始度数偏移 |
| `verticalTwoChar` | boolean | false | 双字标签竖排 |
| `rotationDirection` | 'clockwise' \| 'counterclockwise' | 'clockwise' | 旋转方向 |

---

### PointRing 通用点导向圆环渲染器

负责绘制一个点导向圆环（点标记、标签、高亮呼吸动画），构建于 `PolarCanvas` 之上。通常不直接使用，而是经由 `DataPointRing` 驱动。

点导向适用于：**二十四节气（精确黄经点）**、**二十八宿距星（精确赤经点）**、**七曜（日月五星）** 等本质是点而非区间的数据。

#### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `radius` | number | — | 点所在半径（必填） |
| `innerRadius` | number | 0 | 内半径（用于画内边界圆，0=不画） |
| `items` | PointItem[] | — | 点数据 |
| `showLabels` | boolean | true | 显示标签文字 |
| `labelColor` | string | 'white' | 标签默认色 |
| `labelOffset` | number | 15 | 标签径向偏移：+向外 / -向内 |
| `labelAngleOffset` | number | 0 | 标签角度偏移（度），避免与刻度重叠 |
| `showPoints` | boolean | true | 显示点标记 |
| `pointSize` | number | 4 | 默认点大小 |
| `pointColor` | string | '#ffffff' | 默认点颜色 |
| `pointSymbol` | 'circle' \| 'diamond' \| 'tick' | 'circle' | 默认点符号 |
| `showCircle` | boolean | true | 显示圆环边线 |
| `circleWidth` | number | 1 | 圆环边线宽 |
| `circleColor` | string | '#888888' | 圆环边线颜色 |
| `rotation` | number | 0 | 整体旋转角度 |
| `enableAnimation` | boolean | false | 自动旋转动画 |
| `animationSpeed` | number | 0.5 | 动画速度 |
| `startDegree` | number | 0 | 起始度数偏移 |
| `rotationDirection` | 'clockwise' \| 'counterclockwise' | 'clockwise' | 旋转方向 |

#### 高亮

分级高亮对应不同呼吸动画强度：
- `highlightLevel >= 2` → 呼吸动画
- `highlightLevel >= 3` → 更快更强的呼吸动画

---

### RingStack 同心圆环自动布局

解决「半径手动写死、叠加易重叠」的问题。声明 `outerRadius` 和每个环的径向厚度 `thickness`，容器从外向内自动累加分配 `radius` / `innerRadius`，并统一注入旋转方向。本组件输出一个 `<g>`，沿用项目约定由父级 `<g transform>` 定位。

支持**段导向**和**点导向**两种圆环。

#### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `outerRadius` | number | — | 最外环的外缘半径（必填） |
| `gap` | number | 2 | 环间默认间隙 |
| `rings` | RingConfig[] | — | 由外到内的环配置列表 |
| `rotationDirection` | 'clockwise' \| 'counterclockwise' | 'clockwise' | 统一注入所有环 |

#### RingConfig

| 字段 | 类型 | 说明 |
|------|------|------|
| `component` | Component | 环组件（建议用 `markRaw` 包裹，避免响应式代理） |
| `thickness` | number | 该环径向厚度（外半径 - 内半径） |
| `gapBefore` | number? | 与外侧相邻环的间隙，覆盖默认 `gap`（`0` 表示紧贴） |
| `props` | Record<string, unknown>? | 透传给该环的额外 props（如 `data`、`scaleInterval`） |

#### 使用示例

```vue
<script setup lang="ts">
import { markRaw } from 'vue'
import RingStack from '@/components/base/RingStack.vue'
import DataRing from '@/components/rings/DataRing'
import DataPointRing from '@/components/rings/DataPointRing'
import DegreeScale from '@/components/rings/DegreeScale'
import { twentyFourSolarTerms, sixtyJiazi, sixtyJiaziNayin } from '@/data/rings'

const rings = [
  { component: markRaw(DegreeScale), thickness: 20, props: { scaleInterval: 6, showSectors: true } },
  { component: markRaw(DataPointRing), thickness: 20, props: { data: twentyFourSolarTerms } },
  { component: markRaw(DataRing), thickness: 30, props: { data: sixtyJiazi } },
  // 纳音紧贴六十甲子内侧
  { component: markRaw(DataRing), thickness: 26, gapBefore: 0, props: { data: sixtyJiaziNayin } },
]
</script>

<template>
  <svg width="1200" height="1200" viewBox="0 0 1200 1200">
    <g transform="translate(600, 600)">
      <RingStack :outer-radius="480" :gap="2" :rings="rings" rotation-direction="clockwise" />
    </g>
  </svg>
</template>
```

---

## 圆环组件

### DataRing 数据驱动段圆环

接收一个 `RingData`，通过 `CircleRing` 渲染。取代了过去十余个近乎重复的传统圆环组件。布局参数由 `RingStack` 注入并覆盖数据中的默认值。

#### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `data` | RingData | — | 圆环数据（必填） |
| `radius` | number? | `data.radius ?? 200` | 外半径（`RingStack` 注入） |
| `innerRadius` | number? | `data.innerRadius ?? 0` | 内半径（`RingStack` 注入） |
| `startDegree` | number? | `data.startDegree ?? 0` | 起始度数 |
| `rotationDirection` | 'clockwise' \| 'counterclockwise' | 'clockwise' | 旋转方向（`RingStack` 注入） |

```vue
<DataRing :data="twelveShichen" :radius="280" :inner-radius="252" />
```

---

### DataPointRing 数据驱动点圆环

接收一个 `PointRingData`，通过 `PointRing` 渲染。使用 `useRingBase` 与 `DataRing` 共享基础逻辑，消除重复代码。

#### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `data` | PointRingData | — | 点圆环数据（必填） |
| `radius` | number? | `data.radius ?? 200` | 外半径（`RingStack` 注入） |
| `innerRadius` | number? | `data.innerRadius ?? 0` | 内半径（`RingStack` 注入） |
| `startDegree` | number? | `data.startDegree ?? 0` | 起始度数 |
| `rotationDirection` | 'clockwise' \| 'counterclockwise' | 'clockwise' | 旋转方向（`RingStack` 注入） |

```vue
<DataPointRing :data="twentyFourSolarTerms" :radius="460" :inner-radius="440" />
```

---

### DataBodyRing 数据驱动天体圆环 *NEW!*

接收一个 `BodyRingData`，通过复用 `BodyMarker` 渲染天体（光晕 + 本体 + 符号）。支持黄纬偏移、逆行标记、入宿标注等天文特性。与 `DataRing`、`DataPointRing` 平级，可任意混用堆叠。

**典型场景**：
- 单行星深度研究盘（多层信息叠加）
- 双行星合冲对照盘（实时追踪距离变化）
- 五星聚可视化（分级高亮聚合度）
- 七曜全图盘

#### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `data` | BodyRingData | — | 天体环数据（必填） |
| `radius` | number? | 200 | 外半径（`RingStack` 注入） |
| `innerRadius` | number? | 140 | 内半径（`RingStack` 注入） |
| `rotationDirection` | 'clockwise' \| 'counterclockwise' | 'clockwise' | 旋转方向（`RingStack` 注入） |
| `bandOffset` | number? | 0 | 环带中线偏移（默认正中间，正值向外） |

#### 使用示例（单行星研究）

```vue
<script setup lang="ts">
import { markRaw, computed } from 'vue'
import RingStack from '@/components/base/RingStack.vue'
import DataBodyRing from '@/components/rings/DataBodyRing.vue'
import { singlePlanetBody } from '@/data/rings/sevenLuminaries'

const controlledTime = ref(new Date())

// 单木星天体环（角度由天文计算而来）
const jupiterRing = computed(() => 
  singlePlanetBody('jupiter', jupiterLongitude.value, {
    retrograde: isJupiterRetrograde.value,
    latitude: jupiterLatitude.value,
    highlightLevel: 3
  })
)

const rings = [
  // 其他外环...
  { component: markRaw(DataBodyRing), thickness: 60, props: { data: jupiterRing } }
]
</script>
```

#### 使用示例（七曜全图）

```vue
<script setup lang="ts">
import { sevenLuminariesBody } from '@/data/rings/sevenLuminaries'

const allPlanetsRing = computed(() => 
  sevenLuminariesBody(
    // 七曜各自行星的角度（黄经或赤经）
    {
      sun: sunLongitude.value,
      moon: moonLongitude.value,
      mercury: mercuryLongitude.value,
      venus: venusLongitude.value,
      mars: marsLongitude.value,
      jupiter: jupiterLongitude.value,
      saturn: saturnLongitude.value
    },
    // 行星状态（逆行、黄纬）
    {
      mercury: { retrograde: mercuryRetro.value, latitude: mercuryLat.value },
      // ...其他行星
    }
  )
)
</script>
```

---

### DegreeScale 度数刻度环

按 `scaleInterval` 生成度数刻度的环组件（**非**数据驱动，刻度由间隔计算而来），构建于 `PolarCanvas`。

#### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `radius` | number | — | 外半径（必填） |
| `innerRadius` | number | 0 | 内半径（>0 为环形） |
| `scaleInterval` | number | 5 | 刻度间隔（度数，建议为 360 的约数） |
| `startDegree` | number | 0 | 起始度数偏移 |
| `rotation` | number | 0 | 整体旋转角度 |
| `enableAnimation` | boolean | false | 自动旋转动画 |
| `animationSpeed` | number | 0.5 | 动画速度 |
| `showLabels` | boolean | true | 显示度数标签 |
| `labelColor` | string | '#ffffff' | 标签颜色 |
| `labelPosition` | number | 0.5 | 文字径向位置比例 |
| `showCircle` | boolean | true | 显示圆环边线 |
| `circleWidth` / `circleColor` | number / string | 1 / '#ffffff' | 边线宽 / 色 |
| `showSectors` | boolean | true | 显示扇形区域 |
| `sectorColor` | string | '#ffffff' | 扇形填充色 |
| `sectorOpacity` | number | 0.1 | 扇形透明度 |

```vue
<!-- 六十甲子：6 度间隔（60 格） -->
<DegreeScale :radius="200" :scale-interval="6" />
<!-- 十二地支：12 度（30 格） / 二十四节气：15 度（24 格） -->
<DegreeScale :radius="200" :scale-interval="15" :label-position="0.8" />
```

#### 常用刻度间隔参考

| 间隔 | 刻度数 | 体系 |
|------|--------|------|
| 90 | 4 | 四象 |
| 45 | 8 | 八卦 |
| 36 | 10 | 十天干 |
| 30 | 12 | 十二地支 / 十二时辰 |
| 15 | 24 | 二十四节气 |
| 6 | 60 | 六十甲子 |
| 5 | 72 | 七十二候 |
| 1 | 360 | 最高精度 |

---

## 天文组件

### SolarEcliptic 黄道天体组件

基于 astronomy-engine，按 `time` 计算并显示黄道上的天体——不仅太阳，还包含月亮、白道、五星与轨道交点（均可分别开关）。

#### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `radius` | number | 200 | 黄道半径 |
| `time` | Date | new Date() | 观测时间 |
| `sunPosition` | SunPosition? | — | 自定义太阳位置（不提供则按时间计算） |
| `enableAnimation` | boolean | true | 启用动画 |
| `animationSpeed` | number | 0.5 | 动画速度 |
| `rotation` | number | 0 | 整体旋转角度 |
| `showSunLabel` | boolean | true | 显示太阳标签 |
| `showPlanets` | boolean | true | 显示五星 |
| `showPlanetLabels` | boolean | true | 显示行星标签 |
| `showMoon` | boolean | true | 显示月亮 |
| `showWhiteWay` | boolean | true | 显示白道 |
| `showMoonLabel` | boolean | true | 显示月亮标签 |
| `showOrbitalNodes` | boolean | true | 显示轨道交点 |
| `rotationDirection` | 'clockwise' \| 'counterclockwise' | 'clockwise' | 旋转方向 |

```vue
<SolarEcliptic
  :radius="150"
  :time="controlledTime"
  :enable-animation="false"
  :show-sun-label="true"
  :rotation-direction="rotationDirection"
/>
```

> ⚠️ 天体位置由 `time` 驱动，因此在天文盘面中**不应**对包裹它的 `<g>` 施加整体旋转动画——否则天体会绕中心乱转。`AstronomyView` 对该组件单独保留、不参与整盘旋转。

---

### TaiChi 太极图组件

随时间动态旋转的阴阳鱼太极图，反映天地阴阳消长。独立 SVG 绘制（不基于 `PolarCanvas`）。

#### 特性
- **时间驱动旋转** — 24 小时旋转 360 度（一天一圈）
- **历史日期支持** — 可追溯至公元 1 年，角度连续累加不重置，避免旋转反转
- **毫秒级精度** — 实时响应时间变化

#### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `radius` | number | 80 | 半径 |
| `time` | Date | new Date() | 观测时间（决定旋转角度） |
| `yinColor` / `yangColor` | string | '#000000' / '#FFFFFF' | 阴 / 阳色 |
| `yinEyeColor` / `yangEyeColor` | string | '#FFFFFF' / '#000000' | 阴眼 / 阳眼色 |
| `strokeColor` | string | '#666666' | 边框色 |
| `strokeWidth` | number | 2 | 边框宽 |
| `rotationDirection` | 'clockwise' \| 'counterclockwise' | 'clockwise' | 旋转方向 |

```vue
<TaiChi :radius="80" :time="controlledTime" :rotation-direction="rotationDirection" />
```

---

## 控制面板 · Sidebar

罗盘的时间 / 缩放 / 平移 / 旋转控制由左侧嵌入式 **Sidebar** 承载（曾经的 `Control.vue` 已下线）。核心变化：

- **单点挂载**：`<CompassSidebar>` 挂在 `docs/.vitepress/theme/layouts/CompassLayout.vue` 里，9 个罗盘 View 共享一份 Sidebar
- **状态解耦**：不再走 `v-model` 五联 —— View 只负责 `provideCompassContext({ time, viewport, onUserTimeChange })`
- **View 专属工具位**：通过 `<Teleport to="#sidebar-view-tools">` 把 View 自己的控件塞进 Sidebar 的「视图选项」区块
- **折叠形态**：展开态左侧 260px；折叠态整体 `translateX(-100%)`，屏幕左中悬浮一个 40×80 把手可再打开
- **返回入口**：Sidebar 顶部统一提供「← 罗盘列表」链接，替代 9 个 View 各自复制的 `.back-link`

### CompassSidebar 罗盘左侧嵌入式 Sidebar

**位置**：`src/components/sidebar/CompassSidebar.vue`

结构：
```
┌─────────────────────┐
│ SidebarHeader       │  ← 罗盘列表 · 罗盘名 · 折叠按钮
├─────────────────────┤
│ 视图选项 [Teleport] │  ← 空则自动隐藏（CSS :has(:empty)）
├─────────────────────┤
│ TimePanel           │  ← 时间信息 / 播放 / 步进 / 输入
├─────────────────────┤
│ ViewportPanel       │  ← 缩放 / 平移 / 旋转方向 / 旋转角度
└─────────────────────┘
```

组件树：
| 子组件 | 职责 |
|--------|------|
| `SidebarHeader.vue` | 顶部品牌区：返回链接 + 当前罗盘中文名 + 折叠按钮 |
| `SidebarToggleHandle.vue` | 折叠态的左中悬浮把手（`position: fixed; top: 50%`） |
| `SidebarSection.vue` | 通用可折叠 section 外壳（标题 + 内容 + ▸/▾ 指示） |
| `SidebarButton.vue` | 侧栏按钮统一样式（取代旧 `ControlButton`） |
| `TimePanel.vue` | 时间面板：三条时间线（公历/朝代/干支）+ 播放/步进/输入 |
| `ViewportPanel.vue` | 视口面板：缩放滑条 + 平移四向 + 旋转方向切换 + 旋转角度输入 |

**Props**：无。Sidebar 通过 `useCompassContext()` 读取当前 View 注册的上下文，View 未挂载时时间/视口面板降级隐藏、返回入口仍可用。

**View 侧的四行接入**：
```typescript
import { useUrlTime } from '@/composables/useUrlTime'
import { useViewport } from '@/composables/useViewport'
import { provideCompassContext } from '@/composables/useCompassContext'

const { controlledTime, clearUrlTime } = useUrlTime()
const viewport = useViewport()
provideCompassContext({
  time: controlledTime,
  viewport,
  onUserTimeChange: () => { /* 用户改时间时退出 liveMode */ }
})
```

### View 专属工具位（Teleport）

Sidebar 的「视图选项」区块本质是一个常驻的挂载点：

```vue
<!-- CompassSidebar.vue —— 简化 -->
<div id="sidebar-view-tools" class="view-tools-slot"></div>
```

**空态自动隐藏**（无需 JS 观察）：
```css
.section--auto-hide:has(.view-tools-slot:empty) { display: none; }
```

**View 侧投递**（示例：`SuzhouStellarMapView` 的三档朝向切换）：
```vue
<template>
  <div class="container">
    <svg ...>...</svg>

    <Teleport to="#sidebar-view-tools">
      <div class="orientation-toggle">
        <button v-for="opt in orientations" @click="orient = opt.key">
          {{ opt.label }}
        </button>
      </div>
    </Teleport>
  </div>
</template>
```

**优点**：
- 无侵入 —— Sidebar 不需要知道每个 View 有什么工具
- 生命周期跟随 View —— View 卸载则 Teleport 内容自动清空 → CSS 自动隐藏 section
- 样式作用域独立 —— 每个 View 用自己的 scoped CSS，不污染 Sidebar

---

## 可复用 Composable

### useTimeController 受控时间控制器

**位置**：`src/composables/useTimeController.ts`

替代旧 `useTimePlayback`。核心区别：
- ✅ 接收外部 `time: Ref<Date>` 作为唯一真理源，内部不再有 currentTime 副本
- ✅ 播放采用 wall-clock 增量差分 + `visibilitychange` 重置 —— 修复"切 tab 后瞬跳几十天"的 bug
- ✅ 单帧 dt 上限 100ms —— 抑制 tab 冻结/长掉帧导致的瞬跳

```typescript
import { useUrlTime } from '@/composables/useUrlTime'
import { useTimeController } from '@/composables/useTimeController'

const { controlledTime, clearUrlTime } = useUrlTime()
const time = useTimeController(controlledTime, {
  onUserChange: () => clearUrlTime()  // 用户任何主动操作 → 通知
})
// time.isPlaying / playSpeed / togglePlayPause / stepTime / stepMonth / stepYear / applyTime ...
```

### useViewport 视口状态

**位置**：`src/composables/useViewport.ts`

把 `zoom` / `offsetX` / `offsetY` / `rotationDirection` / `rotationAngle` 五个 ref 折叠成一个对象，同时暴露所有变换动作。

```typescript
const viewport = useViewport()
// 模板：
// <g :transform="`translate(${600 + viewport.offsetX} ${600 + viewport.offsetY})
//                 scale(${viewport.zoom})
//                 rotate(${viewport.rotationDirection === 'clockwise'
//                   ? viewport.rotationAngle
//                   : -viewport.rotationAngle})`" />

viewport.zoomIn()
viewport.moveLeft()
viewport.toggleRotationDirection()
viewport.rotateLeft()  // -90°
viewport.resetZoom()
viewport.resetOffset()
viewport.resetRotationAngle()
```

**边界**：zoom clamp 在 `[0.1, 3]`；rotationAngle 归一到 `[0, 360)`。

### useTimeShortcuts / useViewportShortcuts 快捷键

**位置**：`src/composables/useTimeShortcuts.ts` / `useViewportShortcuts.ts`

分离时间和视口两组快捷键。共享 `shouldIgnoreShortcut(e)` 屏蔽输入框 / contenteditable / IME 组合中的按键。

| 快捷键 | 功能 |
|--------|------|
| `Space` | 播放 / 暂停 |
| `R` | 重置到当前时间 |
| `Y` / `⇧Y` | +1 / -1 年 |
| `M` / `⇧M` | +1 / -1 月 |
| `D` / `⇧D` | +1 / -1 天 |
| `H` / `⇧H` | +1 / -1 小时 |
| `N` / `⇧N` | +1 / -1 分 |
| `S` / `⇧S` | +1 / -1 秒 |
| `+` / `-` / `0` | 放大 / 缩小 / 重置缩放 |
| `5`/`6`/`7`/`8`/`9` | 缩放到 50%/75%/100%/125%/150% |
| `方向键` | 平移视图 |
| `Delete` / `Backspace` | 重置平移 |
| `C` | 切换旋转方向 |
| `Q` / `E` | 左转 90° / 右转 90° |
| `W` | 重置旋转角度 |

```typescript
useTimeShortcuts({
  togglePlayPause: time.togglePlayPause,
  resetToNow: time.resetToNow,
  stepYear: time.stepYear,
  stepMonth: time.stepMonth,
  stepTime: time.stepTime
})

useViewportShortcuts({
  zoomIn: viewport.zoomIn,
  zoomOut: viewport.zoomOut,
  resetZoom: viewport.resetZoom,
  setZoom: viewport.setZoom,
  moveUp: viewport.moveUp,
  moveDown: viewport.moveDown,
  moveLeft: viewport.moveLeft,
  moveRight: viewport.moveRight,
  resetOffset: viewport.resetOffset,
  toggleRotationDirection: viewport.toggleRotationDirection,
  rotateLeft: viewport.rotateLeft,
  rotateRight: viewport.rotateRight,
  resetRotationAngle: viewport.resetRotationAngle
})
```

### useAltDragPan Alt + 拖拽平移 / 滚轮缩放

**位置**：`src/composables/useAltDragPan.ts`

- **Alt + 鼠标左键拖拽** → 平移画布（更新 `offsetX` / `offsetY`）
- **Alt + 滚轮** → 缩放（滚上放大，滚下缩小，`Ctrl` 无关，避免与浏览器缩放冲突）

屏幕像素通过 SVG `preserveAspectRatio="xMidYMid meet"` 的短边比例换算为 viewBox 单位，与当前 zoom 独立。

```typescript
import { useAltDragPan } from '@/composables/useAltDragPan'

const svgRef = ref<SVGSVGElement | null>(null)
const viewport = useViewport()
const { isDragging, isAltPressed } = useAltDragPan({ svgRef, viewport })
```

`isAltPressed` 可用于切换 cursor 视觉反馈（`grab` / `grabbing`）。

### useCompassContext 跨 Layout/View 状态桥

**位置**：`src/composables/useCompassContext.ts`

因为 `<CompassSidebar>`（在 Layout）与 View（在 `<Content />`）是兄弟节点，`provide/inject` 传不过去。方案是模块级 `shallowRef` 单例。

```typescript
// View 侧
provideCompassContext({ time: controlledTime, viewport, onUserTimeChange })

// Sidebar 侧
const ctx = useCompassContext()  // Ref<CompassContext | null>
// ctx.value?.time.value, ctx.value?.viewport.zoom.value ...
```

**为什么安全**：罗盘页任意时刻只有一个 View 存活，切页面时 `onUnmounted` 清空。

### useSidebarLayout 侧栏折叠状态

**位置**：`src/composables/useSidebarLayout.ts`

管理 Sidebar 的展开/折叠 + 内部各 section 的折叠状态，全部持久化到 `localStorage`（`yisiguan:sidebar:*`，schema v2）。

```typescript
const { expanded, toggleExpanded, expand, collapse,
        collapsed, toggleSection } = useSidebarLayout({
  sectionKeys: ['view-tools', 'time', 'playback', 'step', 'input', 'viewport', 'rotation']
})
```

- `Esc` 键收起侧栏（焦点在输入元素时不触发）
- 客户端 hydration 完成后再读 localStorage，避免 SSR 与首屏不一致

### useUrlTime URL ↔ 受控时间双向绑定

**位置**：`src/composables/useUrlTime.ts`

- 首次挂载：URL `?t=YYYY-MM-DDTHH:mm` 优先，其次 initialTime，最后 `new Date()`
- 用户改时间：防抖 500ms 写回 URL（`history.replaceState`，不污染历史栈）
- 精度到分钟：让每秒推进的实时时钟不会污染 URL
- 支持古代日期（如 `0665-01-15T12:00`）—— 年份四位前导 0

```typescript
const { controlledTime, hasUrlTime, clearUrlTime } = useUrlTime()
```

### useLiveClock 1Hz 实时时钟

**位置**：`src/composables/useLiveClock.ts`

给 `LiushiJiaziView` / `PlanetMansionView` 提供每秒推进的实时时钟。用户主动改时间（或 URL 携带 `?t=`）时自动退出 liveMode。

---

## 平台层

### 罗盘注册表

`src/compasses/index.ts` 是平台的单一注册表，仅承载元数据（**不再挂载路由 / 懒加载组件**）。它驱动 `HomeView.vue` 的卡片列表；具体的罗盘 View 通过 `docs/.vitepress/theme/index.ts` 全局注册。

#### CompassMeta

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 页面 slug，`'astronomy'` → `/O/compass/astronomy` |
| `name` | string | 显示名（首页卡片标题） |
| `description` | string | 首页卡片描述 |
| `category` | string? | 分类（天文 / 干支历 / 易学……），用于首页分组或筛选 |

```typescript
// src/compasses/index.ts —— 纯元数据，无 component 字段
export const compasses: CompassMeta[] = [
  { id: 'astronomy',           name: '中华天文圆环',       description: '360 度刻度、二十四节气……',      category: '天文' },
  { id: 'liushi-jiazi',        name: '六十甲子六环',       description: '年月日时分秒六柱……',            category: '干支历' },
  { id: 'sixty-four-gua',      name: '先天六十四卦盘',     description: '伏羲/邵雍先天圆图……',           category: '易学' },
  { id: 'jingfang',            name: '京房十二消息卦盘',   description: '365 天刻度 + 60 卦六日七分……',  category: '易学' },
  { id: 'planet-mansion',      name: '七曜入宿天象盘',     description: '天极投影盖天图……',              category: '天文' },
  { id: 'tropical-year',       name: '回归年闰月盘',       description: '365 天回归年 vs 360 度甲子……', category: '天文' },
  { id: 'guan-dou',            name: '观斗盘',             description: '圆心真实北斗 + 紫微垣 + 地平圈……', category: '天文' },
  { id: 'feifu',               name: '飞伏图盘',           description: '京房八宫 64 卦飞伏方向……',      category: '易学' },
  { id: 'suzhou-stellar-map',  name: '苏州石刻天文图',     description: '南宋 1247 年苏州府学石刻复原……', category: '天文' },
]
```

### 页面生成机制（VitePress-driven，无 Vue Router）

项目**没有** SPA 入口或 vue-router。每个罗盘对应三个部分：

1. **`src/compasses/index.ts` 中的一项元数据**（上表）
2. **`src/views/XxxView.vue`**——Layer 2 View，持有 `controlledTime` 与 UI 状态
3. **`docs/compass/xxx.md`**——极简 md：

   ```md
   ---
   layout: compass
   title: 中华天文圆环
   ---

   <ClientOnly>
     <AstronomyView />
   </ClientOnly>
   ```

`docs/.vitepress/theme/index.ts` 的 `enhanceApp` 里把 9 个 View + `HomeView` 全局注册；Layout 分派根据 `frontmatter.layout === 'compass'` 切换到 `CompassLayout`（全屏、隐藏 nav/sidebar/aside）。

### URL 时间参数

罗盘页支持 `?t=YYYY-MM-DDTHH:MM` 精确定位。因为不使用 vue-router，`src/composables/useUrlTime.ts` 使用纯 `window.location` + `history.replaceState` + `popstate` 事件实现 URL ↔ `controlledTime` 双向绑定。View 只需：

```ts
const { controlledTime } = useUrlTime()
```

### 新增罗盘的完整步骤

1. `src/views/NewView.vue` —— 用五层架构范式实现
2. `src/compasses/index.ts` —— 追加一项元数据
3. `docs/compass/new.md` —— 极简 md（frontmatter + `<ClientOnly><NewView /></ClientOnly>`）
4. `docs/.vitepress/theme/index.ts` —— `import NewView from '@/views/NewView.vue'` 并全局注册

---

## 新增的领域圆环组件（补录）

以下环随观斗盘 / 飞伏图盘 / 苏州石刻天文图三个罗盘一并加入。它们均遵循「时间驱动统一范式」（`time?: MaybeRef<Date>` + 内部 `timeRef = computed(() => unref(props.time) ?? new Date())`）。

| 组件 | 类型 | 领域 |
|------|------|------|
| `MonthEstablishRing.vue` | Segment | 斗建（月建）：12 地支合月建，冬至→子月锚点 |
| `MonthGeneralRing.vue` | Segment | 月将（大吉/功曹…）：太阳所在宫锚定 |
| `HourShichenRing.vue` | Segment | 12 时辰赤道环，当前时辰高亮 |
| `SunDiurnalRing.vue` | Segment | 日周：白昼-曙暮-夜三层弧背景，地轴倾斜驱动 |
| `GuanDouSolarTermsRing.vue` | Point | 观斗盘节气刻度（黄经→赤道映射） |

新增圆心组件：

| 组件 | 领域 |
|------|------|
| `BeidouCenter.vue` | 北斗七星（岁差修正）+ 紫微垣东西两藩 + 勾陈一 + 地平圈（浏览器定位） |
| `SuzhouSkyMap.vue` | 苏州石刻天文图圆心：拱极北斗 + 斗柄随本地恒星时旋转 + 自动标注所指之宿 |

新增工具函数（Layer 5）：

| 工具 | 职责 |
|------|------|
| `beidou.ts` | 北斗七星赤经/赤纬（岁差修正）+ 斗柄指向 |
| `ziwei.ts` | 紫微垣东西两藩恒星（勾陈一、天皇大帝等） |
| `jianJiang.ts` | 斗建 / 月将 / 太阳所在 宫位换算 |
| `jingFangYao.ts` | 京房爻辞 + 飞伏查询 |
| `feifu.ts` | 京房八宫 64 卦飞伏方向 |
| `wuxing.ts` | 五行相生相克 + 配色 |

---


## 开发指南

### 新增一个段导向数据驱动圆环

1. 在 `src/data/rings/myRing.ts` 导出 `RingData`（必填 `items`，样式字段可选）。
2. 在 `src/data/rings/index.ts` 重新导出。
3. 在视图的 `RingStack` 配置加一项：`{ component: markRaw(DataRing), thickness: N, props: { data: myRing } }`。

### 新增一个点导向数据驱动圆环

1. 在 `src/data/rings/myRing.ts` 导出 `PointRingData`（必填 `items`，每个点指定 `angle`，样式字段可选）。
2. 在 `src/data/rings/index.ts` 重新导出。
3. 在视图的 `RingStack` 配置加一项：`{ component: markRaw(DataPointRing), thickness: N, props: { data: myRing } }`。

### 新增一个罗盘页面

1. 新建 `src/views/XxxView.vue`，参考 `AstronomyView.vue` / `LiushiJiaziView.vue`。
2. 在 `src/compasses/index.ts` 的 `compasses` 数组追加一项。
3. 首页卡片与路由自动生成。

### 性能建议

1. 用 `computed` 缓存昂贵计算（如 `RingStack` 的环数组、当前甲子序号）。
2. 避免在模板里逐帧重建 `rings` 数组（见 `LiushiJiaziView` 的 `computed`）。
3. 传入 `RingStack` 的组件用 `markRaw` 包裹，避免被响应式代理。
4. 尽量减少 SVG DOM 节点；频繁切换用 `v-show` 而非 `v-if`。

### 调试技巧

1. 使用 Vue DevTools 检查组件状态。
2. 注意角度单位（度数 vs 弧度）与坐标系方向（0° 在右、顺时针）。
3. 天体不在预期位置时，先确认是否误对其包裹层施加了整体旋转。

---

*本文档随项目更新维护，如有问题欢迎提交 Issue 或 PR。*
