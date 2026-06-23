# 组件文档 - Component Documentation

本文档说明中华传统罗盘平台中各组件的功能、API 和用法。整体架构（多页面路由、数据驱动圆环、同心自动布局）见 [README.md](README.md) 与 [CLAUDE.md](CLAUDE.md)。

## 📚 目录

- [数据层](#数据层)
  - [RingData / RingItem](#ringdata--ringitem-圆环数据契约)
- [基础组件](#基础组件)
  - [PolarCanvas](#polarcanvas-极坐标画布组件)
  - [CircleRing](#circlering-通用圆环渲染器)
  - [RingStack](#ringstack-同心圆环自动布局)
- [圆环组件](#圆环组件)
  - [DataRing](#dataring-数据驱动圆环)
  - [DegreeScale](#degreescale-度数刻度环)
- [天文组件](#天文组件)
  - [SolarEcliptic](#solarecliptic-黄道天体组件)
  - [TaiChi](#taichi-太极图组件)
- [控制组件](#控制组件)
  - [Control](#control-统一控制面板)
- [平台层](#平台层)
  - [罗盘注册表与路由](#罗盘注册表与路由)
- [开发指南](#开发指南)

---

## 数据层

### RingData / RingItem 圆环数据契约

定义于 `src/data/rings/types.ts`。把「画什么」（数据）与「怎么画」（`DataRing`/`CircleRing`）、「画在哪」（`RingStack`）解耦。每个传统圆环只需提供一个 `RingData` 对象，不再各自编写近乎重复的 `.vue` 组件。

#### RingItem（单个分格）

| 字段 | 类型 | 说明 |
|------|------|------|
| `label` | string | 标签文字 |
| `color` | string? | 自定义颜色（缺省用 `RingData.labelColor`） |
| `fontSize` | number? | 自定义字号 |
| `startAngle` | number? | 自定义起始角度（缺省按 `items` 均分 360°） |
| `endAngle` | number? | 自定义结束角度 |
| `highlight` | boolean? | 高亮当前格：呼吸扇形背景 + 文字脉动（默认 false） |

#### RingData（一个环）

| 字段 | 类型 | 说明 |
|------|------|------|
| `items` | RingItem[] | 该环的分格数据（必填） |
| `startDegree` | number? | 默认起始度数偏移（可被注入覆盖） |
| `radius` | number? | 默认外半径（单独使用时的回退值；`RingStack` 下由布局接管） |
| `innerRadius` | number? | 默认内半径 |
| `labelColor` | string? | 标签默认颜色 |
| `labelPosition` | number? | 标签径向位置比例（0-1） |
| `fontSize` | number? | 统一字号（`item.fontSize` 优先） |
| `tickWidth` / `tickColor` | number? / string? | 刻度线宽 / 色 |
| `circleColor` / `circleWidth` | string? / number? | 圆环边线色 / 宽 |
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

现有数据文件：`twentyFourSolarTerms`、`twentyEightConstellations`、`sixtyJiazi`、`sixtyJiaziNayin`、`heavenlyStems`、`tianganKongwang`、`twelveLongevity`、`earthlyBranches`、`eightGates`、`siXiang`，统一从 `src/data/rings/index.ts` 导出。

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

### CircleRing 通用圆环渲染器

真正负责绘制一个圆环的组件（扇形、刻度线、标签、高亮呼吸动画），构建于 `PolarCanvas` 之上。通常不直接使用，而是经由 `DataRing` 驱动。

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

### RingStack 同心圆环自动布局

解决「半径手动写死、叠加易重叠」的问题。声明 `outerRadius` 和每个环的径向厚度 `thickness`，容器从外向内自动累加分配 `radius` / `innerRadius`，并统一注入旋转方向。本组件输出一个 `<g>`，沿用项目约定由父级 `<g transform>` 定位。

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
import DataRing from '@/components/DataRing.vue'
import DegreeScale from '@/components/DegreeScale.vue'
import { twentyFourSolarTerms, sixtyJiazi, sixtyJiaziNayin } from '@/data/rings'

const DataRingComp = markRaw(DataRing)
const rings = [
  { component: markRaw(DegreeScale), thickness: 20, props: { scaleInterval: 6, showSectors: true } },
  { component: DataRingComp, thickness: 24, props: { data: twentyFourSolarTerms } },
  { component: DataRingComp, thickness: 30, props: { data: sixtyJiazi } },
  // 纳音紧贴六十甲子内侧
  { component: DataRingComp, thickness: 26, gapBefore: 0, props: { data: sixtyJiaziNayin } },
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

### DataRing 数据驱动圆环

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
| 30 | 12 | 十二地支 / 时辰 |
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

#### Props（均通过 v-model 绑定）

| 属性 | 类型 | 说明 |
|------|------|------|
| `modelValue` | Date | 当前时间（`v-model`） |
| `zoom` | number | 缩放级别（`v-model:zoom`） |
| `offsetX` / `offsetY` | number | 平移偏移（`v-model:offsetX` / `offsetY`） |
| `rotationDirection` | 'clockwise' \| 'counterclockwise' | 旋转方向（`v-model:rotation-direction`） |
| `rotationAngle` | number | 旋转角度（`v-model:rotation-angle`） |

#### Events

除各 `update:*`（支撑 v-model）外，还额外抛出便于监听的事件：`timeChange`、`zoomChange`、`offsetChange({ x, y })`、`rotationDirectionChange`、`rotationAngleChange`。

#### 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `空格` | 播放 / 暂停 |
| `R` | 重置到当前时间 |
| `H` / `⇧H` | +1 / -1 小时 |
| `D` / `⇧D` | +1 / -1 天 |
| `M` / `⇧M` | +1 / -1 月 |
| `Y` / `⇧Y` | +1 / -1 年 |
| `+` / `-` / `0` | 放大 / 缩小 / 重置缩放 |
| `方向键` | 平移视图 |
| `Delete` | 重置平移 |

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

### 新增一个数据驱动圆环

1. 在 `src/data/rings/myRing.ts` 导出 `RingData`（必填 `items`，样式字段可选）。
2. 在 `src/data/rings/index.ts` 重新导出。
3. 在视图的 `RingStack` 配置加一项：`{ component: markRaw(DataRing), thickness: N, props: { data: myRing } }`。

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
