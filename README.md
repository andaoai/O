# 🧭 中华传统罗盘可视化平台 - Chinese Traditional Compass Platform

一个基于 Vue 3 + TypeScript 的多页面交互式中华传统文化罗盘可视化平台。首页列出所有「罗盘」，每个罗盘是一张全屏的极坐标 SVG 可视化盘面，由可叠加的同心圆环组成。

## ✨ 现有罗盘

### 🌌 中华天文圆环（astronomy）

一张完整的天文盘面，由外到内叠加多层同心圆环：

- **📏 360 度刻度尺** — 可配置间隔的角度刻度（DegreeScale）
- **🌱 二十四节气** — 二十四节气分布（时间驱动高亮）
- **⭐ 二十八星宿** — 四象七宿：东方青龙、北方玄武、西方白虎、南方朱雀
- **🀄 六十甲子** — 干支纪元（时间驱动年柱高亮 + 五行配色）
- **🌊 五行纳音** — 与六十甲子同源同转，紧贴其内侧
- **🌿 十天干** — 甲乙丙丁戊己庚辛壬癸
- **🕳️ 天干空亡** — 旬空标记
- **♻️ 十二长生** — 长生、沐浴、冠带、临官、帝旺、衰、病、死、墓、绝、胎、养
- **🐲 十二地支** — 子丑寅卯辰巳午未申酉戌亥（时间驱动年支高亮）
- **🚪 八门** — 奇门八门
- **🐉 四象** — 青龙、朱雀、白虎、玄武
- **☀️ 太阳黄道** — 基于 astronomy-engine 的精确太阳位置（中心区）
- **☯️ 太极图** — 随时间动态旋转的阴阳鱼（盘心）

### 🀄 六十甲子六环（liushi-jiazi）

年柱、月柱、日柱、时柱、分柱、秒柱六环同心同步显示，实时跟随真实时间，当前干支所在格高亮放大。年月日时四柱由 tyme4ts 严格按节气历法推算，分柱 / 秒柱直接以分钟数 / 秒数（0-59）映射六十甲子。

### 🌠 七曜入宿天象盘（planet-mansion）

天极投影盖天图，赤道·黄道·白道三道斜交，日月五星各居其道并实时入二十八宿：

- **🌞 太阳**沿黄道运行，**🌝 月亮**沿白道运行
- **⭐ 五星**（金木水火土）各自按轨道运行
- **🌱 二十四节气**外环（点导向圆环，精确黄经→赤经动态转换）
- **📏 360° 赤经刻度**
- **四象动态合并**按二十八宿赤经范围自动合并定位
- **七曜入宿度标记**实时显示每曜所在宿及度数
- 所有天体跟随时间动态更新位置，实时显示当前入宿

### 🔯 先天六十四卦盘（sixty-four-gua）

伏羲/邵雍先天圆图：

- **二进制位反转排列**，符合先天方位
- **乾南坤北，两仪对称**，遵先天八卦方位
- 显示**卦符**、**卦名**与**六爻爻象**三层信息
- 64 卦分六段圆环由外到内层层排列

---

## 🏗️ 五层架构设计

### 核心设计原则：单一数据源 + 单向数据流 + 关注点分离

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: State Layer (状态层)                                │
│  └─ controlledTime = ref<Date>() — 整个系统唯一真理源         │
└────────────────────────────────────┬────────────────────────┘
                                     │
┌────────────────────────────────────┴────────────────────────┐
│  Layer 2: Composition Layer (组合层)                          │
│  └─ Views: 持有状态，编排组件，通过 RingStack 统一布局     │
│     AstronomyView, LiushiJiaziView, PlanetMansionView        │
│     🔹 RingStack: 「圆心 → 圆环」统一分层布局容器          │
└────────────────────────────────────┬────────────────────────┘
                                     │
┌────────────────────────────────────┴────────────────────────┐
│  Layer 3: Domain Component Layer (领域组件层)                 │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  ⚫ 圆心区 (centers/)：3 个圆心组件                       ││
│  │     TaiChi, HelioOrbits, SolarEcliptic                   ││
│  └───────────────────────────┬─────────────────────────────┘│
│                              │ 自动注入 innerRadius          │
│  ┌───────────────────────────▼─────────────────────────────┐│
│  │  🔵 圆环区 (rings/)：16 个同心环组件                      ││
│  │     SixtyJiaziRing, BranchesRing, ConstellationsRing,    ││
│  │     SolarTermsSkyRing, SiXiangRing, SevenLuminariesRing, ││
│  │     MansionDegreeRing, SinglePlanetRing, SkyChart, ...   ││
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
**核心原则：唯一真理源 (Single Source of Truth)**

整个系统只有一个 `controlledTime = ref<Date>()` 作为时间状态，所有时间驱动组件均派生自此。无全局状态管理（Pinia 已安装但未使用），状态在视图内局部持有，`Control` 面板通过 `v-model` 双向绑定修改。

### Layer 2: Composition Layer (组合层)
**核心原则：纯组合编排，无业务逻辑**

View 层只负责：
- 持有状态（controlledTime, zoom, offset, rotation）
- 通过 RingStack 进行同心环自动布局
- 将 `time` ref 向下传递给所有子组件
- 不进行任何数据转换或计算

**架构正确性：**
- ✅ View 层没有任何 `ringData` computed
- ✅ View 层只传 `time: controlledTime`，不解构 `.value`
- ✅ 所有计算逻辑下沉到 Layer 3 或 Layer 5

### Layer 3: Domain Component Layer (领域组件层)
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
- ✅ **响应式链完整**：无论父组件传 ref 还是 plain value，子组件始终响应式
- ✅ **单向数据流**：数据自上而下流动，无 emit 回传
- ✅ **依赖追踪自动化**：computed 自动追踪依赖，无需 watch
- ✅ **可测试性**：组件纯函数式，输入 time → 输出 ringData

### Layer 4: Base Render Layer (基础渲染层)
**核心原则：纯渲染，无业务逻辑**

**四层渲染管道：**
```
RingData ──► DataRing ──► CircleRing ──► PolarCanvas
PointRingData ──► DataPointRing ──► PointRing ──► PolarCanvas
BodyRingData ──► DataBodyRing ──► BodyMarker ──► PolarCanvas
```

### Layer 5: Utility Layer (工具层)
**核心原则：纯函数，无副作用，独立可测试**

所有工具函数满足：相同输入始终产生相同输出，不依赖外部状态，不修改输入参数，可独立单元测试。

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
- ✅ **多层嵌套**：支持多个圆心组件叠加（如 SolarEcliptic 包裹 TaiChi）

**现有圆心组件：**

| 组件 | 领域 | 典型使用场景 |
|------|------|------------|
| `TaiChi.vue` | 太极阴阳 | AstronomyView 盘心 |
| `HelioOrbits.vue` | 日心轨道 | SkyChart 内嵌的日心行星轨道 |
| `SolarEcliptic.vue` | 黄道编排 | AstronomyView 中心黄道环 |

---

## 🎮 盘面层次结构

```
📐 中华天文圆环（由外到内）：

┌────────────────────────────────────────────┐
│ 📏 360 度刻度尺           DegreeScale         │
│ 🌱 二十四节气             SolarTermsRing      │
│ ⭐ 二十八星宿             DataRing            │
│ 🀄 六十甲子               SixtyJiaziRing      │
│ 🌊 五行纳音               DataRing（紧贴甲子）│
│ 🌿 十天干                 DataRing            │
│ 🕳️ 天干空亡               DataRing            │
│ ♻️ 十二长生               DataRing            │
│ 🐲 十二地支               BranchesRing        │
│ 🚪 八门                   DataRing            │
│ 🐉 四象                   DataRing            │
│ ☀️ 太阳黄道（中心区）     SolarEcliptic       │
│ ☯️ 太极图（盘心）         TaiChi              │
└────────────────────────────────────────────┘

⏰ 控制面板 - Control 组件（右侧可拖拽）
├── 📅 时间信息：公历 / 朝代 / 干支 三条时间线
├── 🕐 播放控制：播放/暂停、速度、时间选择
├── ⏱️ 时间调节：按秒/分/时/日/月/年步进
├── 🔍 缩放控制：放大/缩小/预置/重置
├── 🎯 平移控制：方向键移动、重置
├── 🔄 旋转控制：旋转方向、旋转角度
└── ⌨️ 键盘快捷键
```

> 注：`SolarEcliptic` 与 `TaiChi` 的位置由 `time` 驱动（天文/时钟），天文盘面刻意不对它们施加整体旋转动画——否则按时间定位的天体会绕中心乱转。

---

## 🛠️ 技术栈

- **Vue 3.5** — Composition API（`<script setup>`）
- **TypeScript** — 全程类型安全
- **Vite 7** — 构建工具
- **Vue Router 4** — 多页面路由
- **Pinia 3** — 已安装注册（当前暂无 store，状态以视图内 `ref` + `v-model` 管理）
- **astronomy-engine 2.1** — 高精度天文计算
- **tyme4ts 1.3** — 中华传统历法 / 干支计算
- **SVG + CSS3** — 矢量绘制与动画

---

## 🚀 快速开始

### 环境要求

- Node.js `^20.19.0 || >=22.12.0`

### 安装与运行

```sh
npm install      # 安装依赖
npm run dev      # 开发服务器
npm run build    # 生产构建（含类型检查）
npm run preview  # 预览构建产物
```

---

## 📦 项目结构

```
src/
├── compasses/index.ts             # 罗盘注册表（驱动首页 + 路由）
├── views/                         # Layer 2: Composition Layer
│   ├── HomeView.vue               # 首页：罗盘卡片网格
│   ├── AstronomyView.vue          # 中华天文圆环
│   ├── LiushiJiaziView.vue        # 六十甲子六环
│   ├── PlanetMansionView.vue      # 七曜入宿天象盘
│   └── SixtyFourGuaView.vue       # 先天六十四卦盘
├── components/
│   ├── base/                       # Layer 4: Base Render Layer
│   │   ├── PolarCanvas.vue         # 极坐标画布基础组件
│   │   ├── CircleRing.vue          # 通用段导向 SVG 圆环渲染器
│   │   ├── PointRing.vue           # 通用点导向 SVG 圆环渲染器
│   │   └── RingStack.vue           # 同心圆环自动布局容器
│   ├── rings/                       # Layer 3: Domain Component Layer
│   │   ├── DataRing.vue            # Data Wrapper: RingData → CircleRing
│   │   ├── DataPointRing.vue       # Data Wrapper: PointRingData → PointRing
│   │   ├── DataBodyRing.vue        # Data Wrapper: BodyRingData → BodyMarker
│   │   ├── DegreeScale.vue         # 度数刻度环（按间隔生成）
│   │   ├── GuaRing.vue             # 六十四卦特殊圆环
│   │   ├── MansionDegreeRing.vue   # 七曜入宿度标记环
│   │   ├── SixtyJiaziRing.vue      # 六十甲子时间驱动
│   │   ├── BranchesRing.vue        # 十二地支时间驱动
│   │   ├── StemsRing.vue           # 天干空亡时间驱动
│   │   ├── ConstellationsRing.vue  # 二十八宿动态赤经
│   │   ├── SiXiangRing.vue         # 四象动态赤经合并
│   │   ├── SolarTermsRing.vue      # 二十四节气传统罗盘版
│   │   ├── SolarTermsSkyRing.vue   # 二十四节气天星赤经版
│   │   └── SevenLuminariesRing.vue # 七曜天体位置计算
│   ├── celestial/                  # 天体可视化组件
│   │   ├── BodyMarker.vue          # 天体标记（光晕 + 符号 + 逆行指示）
│   │   ├── CelestialBody.vue       # 天体容器
│   │   ├── EclipticCircle.vue      # 黄道圈
│   │   └── LunarOrbit.vue          # 白道轨道
│   ├── HelioOrbits.vue             # 日行轨道（日心视角）
│   ├── SkyChart.vue                # 全天投影图（赤道+黄道+白道+七曜）
│   ├── SolarEcliptic.vue          # 太阳黄道位置
│   ├── TaiChi.vue                 # 时间驱动的太极阴阳鱼
│   └── Control.vue                # 统一控制面板
├── data/rings/                    # 静态圆环数据
│   ├── types.ts                   # 类型系统：
│   │                              #  RingItemBase → RingItem / PointItem
│   │                              #  RingDataBase → RingData / PointRingData
│   ├── index.ts                   # 统一导出
│   ├── twentyFourSolarTerms.ts    # 二十四节气（点导向）
│   ├── twentyEightConstellations.ts # 二十八星宿数据
│   ├── sixtyJiazi.ts              # 六十甲子基础数据
│   ├── sixtyJiaziNayin.ts         # 五行纳音
│   ├── heavenlyStems.ts           # 十天干
│   ├── tianganKongwang.ts         # 天干空亡
│   ├── twelveLongevity.ts         # 十二长生
│   ├── earthlyBranches.ts         # 十二地支
│   ├── eightGates.ts              # 八门
│   ├── siXiang.ts                 # 四象
│   ├── seventyTwoHou.ts          # 七十二候
│   └── twelveShichen.ts           # 十二时辰
├── composables/
│   ├── useAnimation.ts            # 动画控制
│   ├── useRingBase.ts             # Layer 4 基础：所有圆环共享逻辑
│   ├── useSevenLuminaries.ts      # 七曜统一计算
│   ├── useTimePlayback.ts         # 时间播放控制（从 Control 抽出）
│   ├── usePanelDrag.ts            # 面板拖拽（从 Control 抽出）
│   └── useKeyboardShortcuts.ts    # 键盘快捷键（从 Control 抽出）
├── utils/                          # Layer 5: Utility Layer（纯函数）
│   ├── chineseCalendar.ts         # 农历工具（tyme4ts）
│   ├── liushiJiazi.ts             # 六柱六十甲子序号计算
│   ├── celestial.ts               # 天体坐标计算
│   ├── eraCalendar.ts             # 朝代纪年转换 + 跨全时域干支
│   ├── geometry.ts               # 极坐标几何工具
│   ├── planetMansion.ts           # 七曜入宿计算
│   ├── skyEvents.ts              # 天体会合事件分级计算
│   └── skyProjection.ts          # 天球坐标投影
├── router/index.ts                # 由注册表生成的路由
├── App.vue                        # 外壳：仅 <RouterView />
└── main.ts                        # 入口（Vue + Pinia + Router）
```

---

## 🧩 如何扩展

### 新增一个罗盘

1. 新建 `src/views/XxxView.vue`，参考 `AstronomyView.vue` / `LiushiJiaziView.vue`：`.container` 包一个 `<svg>`，其中 `<g transform>` 应用平移/缩放/旋转，附带返回首页链接和 `Control` 面板。
2. 在 `src/compasses/index.ts` 的 `compasses` 数组追加一项（唯一 `id`、`name`、`description`、`category`、懒加载 `component`）。
3. 首页卡片与 `/compass/:id` 路由自动出现。

### 新增一个时间驱动环（推荐用 `/generate-ring` 技能）

1. **选择类型**: Segment / Point / Body
2. **创建组件**: `src/components/rings/XxxRing.vue`，遵循「三行范式」
3. **提取工具逻辑**: 复杂计算下沉到 `utils/xxx.ts` 纯函数
4. **集成到视图**: 在 RingStack 配置中加入，只传 `time: controlledTime`

**标准骨架：**
```typescript
<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import DataRing from './DataRing.vue'

interface Props {
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  startDegree?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200, innerRadius: 180, startDegree: 0, rotationDirection: 'clockwise'
})

// ⚠️ 范式：统一转换为响应式 timeRef
const timeRef = computed(() => unref(props.time) ?? new Date())

// ⚠️ 范式：所有逻辑派生自 timeRef
const ringData = computed(() => {
  const time = timeRef.value
  // ... 你的计算逻辑
  return { items: [] }
})
</script>
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

详细组件 API 见 [COMPONENT_DOCUMENTATION.md](COMPONENT_DOCUMENTATION.md)。

---

## 🧪 测试与质量

```sh
npm run type-check   # vue-tsc 类型检查
npm run lint         # ESLint 自动修复
npm run format       # Prettier 格式化
npm run test:unit    # Vitest 单元测试
npm run test:e2e     # Playwright 端到端测试
```

---

## 🚢 部署

GitHub Pages：

```sh
npm run deploy   # 构建并发布 dist/ 到 gh-pages 分支
```

该命令执行生产构建，再将 `dist/` 推送到 `gh-pages` 分支，由 GitHub Actions 自动部署。

---

## 🌍 浏览器支持

- Chrome / Edge ≥ 88
- Firefox ≥ 85
- Safari ≥ 14

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request。

---

## 📄 许可证

MIT License

---

## 推荐开发环境

[VS Code](https://code.visualstudio.com/) + [Vue (Official) / Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)（请禁用 Vetur）。

> TypeScript 默认无法处理 `.vue` 导入的类型，本项目用 `vue-tsc` 替代 `tsc` 做类型检查，编辑器中需 Volar 提供 `.vue` 类型支持。

构建配置参考 [Vite 配置文档](https://vite.dev/config/)。
