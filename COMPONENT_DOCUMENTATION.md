# 组件文档 - Component Documentation

本文档说明中华传统罗盘平台中各组件的功能、API 和用法。整体架构（多页面路由、数据驱动圆环、同心自动布局）见 [README.md](README.md) 与 [CLAUDE.md](CLAUDE.md)。

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
- [控制组件](#控制组件)
  - [Control](#control-统一控制面板)
- [可复用 Composable](#可复用-composable)
  - [useTimePlayback](#usetimeplayback-时间播放控制)
  - [usePanelDrag](#usepaneldrag-面板拖拽)
  - [useKeyboardShortcuts](#usekeyboardshortcuts-键盘快捷键)
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

#### 示例（`src/data/rings/earthlyBranches.ts` 节选）

```typescript
import type { RingData } from './types'

export const earthlyBranches: RingData = {
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

现有数据文件：`twentyFourSolarTerms`、`twentyEightConstellations`、`sixtyJiazi`、`sixtyJiaziNayin`、`heavenlyStems`、`tianganKongwang`、`twelveLongevity`、`earthlyBranches`、`eightGates`、`siXiang`、`seventyTwoHou`、`twelveShichen`、`sevenLuminaries`，统一从 `src/data/rings/index.ts` 导出。

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
<DataRing :data="earthlyBranches" :radius="280" :inner-radius="252" />
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

## 控制组件

### Control 统一控制面板

集成时间、缩放、平移、旋转控制，提供键盘快捷键。所有状态通过 `v-model` 与视图双向绑定。

**最近更新**（commit 9e53e8f / c33f550）：
- 新增**三条时间线显示**：公历日期 → 朝代信息 → 干支年月日时
- 支持显示农历和节气
- 支持公元前年份输入
- 可折叠模块，状态持久化到 localStorage
- 面板可拖拽，位置记忆
- 核心逻辑抽取为三个可复用 composable

#### Props（均通过 v-model 绑定）

| 属性 | 类型 | 说明 |
|------|------|------|
| `modelValue` | Date | 当前时间（`v-model`） |
| `zoom` | number | 缩放级别（`v-model:zoom`） |
| `offsetX` / `offsetY` | number | 平移偏移（`v-model:offsetX` / `v-model:offsetY`） |
| `rotationDirection` | 'clockwise' \| 'counterclockwise' | 旋转方向（`v-model:rotation-direction`） |
| `rotationAngle` | number | 旋转角度（`v-model:rotation-angle`） |

#### Events

除各 `update:*`（支撑 v-model）外，还额外抛出便于监听的事件：`timeChange`、`zoomChange`、`offsetChange({ x, y })`、`rotationDirectionChange`、`rotationAngleChange`。

#### 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `空格` | 播放 / 暂停 |
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

#### 使用示例

```vue
<script setup lang="ts">
import { ref } from 'vue'
import Control from '@/components/Control.vue'

const controlledTime = ref(new Date())
const zoomLevel = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const rotationDirection = ref<'clockwise' | 'counterclockwise'>('clockwise')
const rotationAngle = ref(0)
</script>

<template>
  <svg width="1200" height="1200" viewBox="0 0 1200 1200">
    <g :transform="`translate(${600 + offsetX}, ${600 + offsetY}) scale(${zoomLevel}) rotate(${rotationAngle})`">
      <!-- 盘面内容 -->
    </g>
  </svg>

  <Control
    v-model="controlledTime"
    v-model:zoom="zoomLevel"
    v-model:offsetX="offsetX"
    v-model:offsetY="offsetY"
    v-model:rotation-direction="rotationDirection"
    v-model:rotation-angle="rotationAngle"
  />
</template>
```

---

## 可复用 Composable

### useTimePlayback 时间播放控制

从 `Control.vue` 抽出的可复用时间播放逻辑：当前时间状态、播放/暂停、倍速推进、步进、重置到现在。

```typescript
import { useTimePlayback } from '@/composables/useTimePlayback'

const {
  currentTime,       // 当前时间 ref
  isPlaying,         // 是否播放 ref
  playSpeed,         // 播放速度 ref
  updateTime,        // 更新时间函数
  play,              // 开始播放
  pause,             // 暂停
  togglePlayPause,   // 切换播放/暂停
  resetToNow,        // 重置到当前时间
  updatePlaySpeed,   // 更新播放速度（重启动画）
  stepTime,          // 步进指定秒数
  stepMonth,         // 步进指定月份
  stepYear           // 步进指定年份
} = useTimePlayback((t: Date) => {
  // 时间变化回调
  console.log('Time changed:', t)
})
```

### usePanelDrag 面板拖拽

从 `Control.vue` 抽出的面板拖拽逻辑：支持标题栏拖拽、边界约束（面板保持在视口内）、位置持久化到 localStorage。

```typescript
import { usePanelDrag } from '@/composables/usePanelDrag'

const {
  isDragging,        // 是否正在拖拽
  panelPositionX,    // 面板 X 偏移（right = 20 - X）
  panelPositionY,    // 面板 Y 偏移（top = 20 + Y）
  handleMouseDown,   // mousedown 事件处理
  handleResize,      // 窗口 resize 处理
  clampPanelPosition // 重新约束面板位置到视口内
} = usePanelDrag()
```

### useKeyboardShortcuts 键盘快捷键

从 `Control.vue` 抽出的全局键盘快捷键绑定：自动忽略输入框聚焦时的按键。

```typescript
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'

useKeyboardShortcuts({
  togglePlayPause,
  resetToNow,
  stepYear,
  stepMonth,
  stepTime,
  zoomIn,
  zoomOut,
  resetZoom,
  setZoom,
  moveUp,
  moveDown,
  moveLeft,
  moveRight,
  resetOffset,
  toggleRotationDirection,
  rotateLeft,
  rotateRight,
  resetRotationAngle
})
```

---

## 平台层

### 罗盘注册表与路由

`src/compasses/index.ts` 是平台的单一注册表。首页网格（`HomeView.vue`）和路由（`router/index.ts`）都从中读取。

#### CompassMeta

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 路由片段，`'astronomy'` → `/compass/astronomy` |
| `name` | string | 显示名（首页卡片标题、路由名） |
| `description` | string | 首页卡片描述 |
| `category` | string? | 分类（天文 / 干支历……），用于首页分组或筛选 |
| `component` | () => Promise<Component> | 懒加载的页面视图组件 |

```typescript
export const compasses: CompassMeta[] = [
  {
    id: 'astronomy',
    name: '中华天文圆环',
    description: '360 度刻度、二十四节气、二十八星宿……日月五星黄道与太极',
    category: '天文',
    component: () => import('@/views/AstronomyView.vue')
  },
  // …新增罗盘在此追加
]
```

路由由注册表动态生成：`/` 为首页，`/compass/:id` 为各罗盘（懒加载），未匹配路径重定向回首页。

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
