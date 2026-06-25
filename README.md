# 🧭 中华传统罗盘可视化平台 - Chinese Traditional Compass Platform

一个基于 Vue 3 + TypeScript 的多页面交互式中华传统文化罗盘可视化平台。首页列出所有「罗盘」，每个罗盘是一张全屏的极坐标 SVG 可视化盘面，由可叠加的同心圆环组成。

## ✨ 现有罗盘

### 🌌 中华天文圆环（astronomy）

一张完整的天文盘面，由外到内叠加多层同心圆环：

- **📏 360 度刻度尺** — 可配置间隔的角度刻度（DegreeScale）
- **🌱 二十四节气** — 二十四节气分布
- **⭐ 二十八星宿** — 四象七宿：东方青龙、北方玄武、西方白虎、南方朱雀
- **🀄 六十甲子** — 干支纪元
- **🌊 五行纳音** — 与六十甲子同源同转，紧贴其内侧
- **🌿 十天干** — 甲乙丙丁戊己庚辛壬癸
- **🕳️ 天干空亡** — 旬空标记
- **♻️ 十二长生** — 长生、沐浴、冠带、临官、帝旺、衰、病、死、墓、绝、胎、养
- **🐲 十二地支** — 子丑寅卯辰巳午未申酉戌亥
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
- **🌱 二十四节气**外环（点导向圆环，精确黄经点）
- **📏 360° 赤经刻度**
- **四象动态合并**按二十八宿赤经范围自动合并定位（commit 2ce7ff1）
- 所有天体跟随时间动态更新位置，实时显示当前入宿

### 🔯 先天六十四卦盘（sixty-four-gua）

伏羲/邵雍先天圆图：

- **二进制位反转排列**，符合先天方位
- **乾南坤北，两仪对称**，遵先天八卦方位
- 显示**卦符**、**卦名**与**六爻爻象**三层信息
- 64 卦分六段圆环由外到内层层排列

## 🏗️ 架构

本项目从早期「每个圆环一个 .vue 组件」的写法，重构为 **数据驱动 + 多页面路由** 架构，再演进为**段导向 + 点导向**双类型基础。理解这几个关键支点：

### 1. 罗盘注册表 → 路由（多页面）

`src/compasses/index.ts` 是唯一的注册表。首页网格和路由都从这个数组读取：

- `src/views/HomeView.vue` 为每个注册项渲染一张卡片。
- `src/router/index.ts` 据此生成 `/compass/:id` 路由，`/` 为首页，并有兜底重定向。

> **新增一个罗盘 = 新建 `src/views/XxxView.vue` + 在 `compasses` 数组加一项。** 无需改动路由。

### 2. 两种圆环类型：段导向（CircleRing）vs 点导向（PointRing）

有两种根本不同的圆环类型，各有数据模型和渲染器：

| 类型 | 用途 | 数据模型 | 组件 |
|------|------|----------|------|
| **段导向** | 每个条目占角度区间（如六十甲子、十二地支） | `RingData` → `RingItem[]` | `CircleRing` |
| **点导向** | 每个条目在精确角度上（如二十四节气、七曜） | `PointRingData` → `PointItem[]` | `PointRing` |

两种类型共享 `useRingBase` composable 的基础逻辑。

### 3. 数据驱动圆环（DataRing + DataPointRing）

传统圆环不再是各自独立的组件：

- `src/data/rings/*.ts` — 每个文件导出对应数据对象（`items` + 样式默认值）。
- `src/components/rings/DataRing.vue` — 通用段导向组件，接收 `RingData` 后通过 `CircleRing` 渲染。
- `src/components/rings/DataPointRing.vue` — 通用点导向组件，接收 `PointRingData` 后通过 `PointRing` 渲染。
- `src/components/base/CircleRing.vue` / `PointRing.vue` — 真正的 SVG 圆环渲染器。

这套机制取代了过去的 `EarthlyBranches.vue`、`SiXiang.vue`、`SixtyJiazi.vue` 等组件——这些组件文件已不存在，其内容现在以数据形式存放在 `src/data/rings/`。

### 4. 同心圆环自动布局（RingStack）

`src/components/base/RingStack.vue` 让调用方只声明 `outerRadius` 和每个环的「径向厚度」`thickness`，容器从外向内自动累加分配各环的 `radius` / `innerRadius`，叠加时永不重叠，并统一注入旋转方向。支持两种类型的圆环。

### 5. 控制面板重构（三个可复用 composable）

`Control.vue` 已拆分为三个可复用 composable（commit c33f550）：

- `useTimePlayback` — 时间播放控制：播放/暂停、倍速、步进、重置到现在
- `usePanelDrag` — 面板拖拽 + localStorage 位置记忆
- `useKeyboardShortcuts` — 全局键盘快捷键，输入框聚焦时自动忽略

控制面板新增功能：
- 可折叠模块，折叠状态持久化
- **三条时间线**：公历 → 朝代 → 干支，完整展示时间信息
- 农历日期和节气显示
- 支持公元前年份输入

## 🎮 盘面层次结构

```
📐 中华天文圆环（由外到内）：

┌────────────────────────────────────────────┐
│ 📏 360 度刻度尺           DegreeScale         │
│ 🌱 二十四节气             DataPointRing      │
│ ⭐ 二十八星宿             DataRing            │
│ 🀄 六十甲子               DataRing            │
│ 🌊 五行纳音               DataRing（紧贴甲子）│
│ 🌿 十天干                 DataRing            │
│ 🕳️ 天干空亡               DataRing            │
│ ♻️ 十二长生               DataRing            │
│ 🐲 十二地支               DataRing            │
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

## 🛠️ 技术栈

- **Vue 3.5** — Composition API（`<script setup>`）
- **TypeScript** — 全程类型安全
- **Vite 7** — 构建工具
- **Vue Router 4** — 多页面路由
- **Pinia 3** — 已安装注册（当前暂无 store，状态以视图内 `ref` + `v-model` 管理）
- **astronomy-engine 2.1** — 高精度天文计算
- **tyme4ts 1.3** — 中华传统历法 / 干支计算
- **SVG + CSS3** — 矢量绘制与动画

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

## 📦 项目结构

```
src/
├── compasses/index.ts             # 罗盘注册表（驱动首页 + 路由）
├── views/
│   ├── HomeView.vue               # 首页：罗盘卡片网格
│   ├── AstronomyView.vue          # 中华天文圆环
│   ├── LiushiJiaziView.vue        # 六十甲子六环
│   ├── PlanetMansionView.vue      # 七曜入宿天象盘
│   └── SixtyFourGuaView.vue       # 先天六十四卦盘
├── components/
│   ├── base/
│   │   ├── PolarCanvas.vue         # 极坐标画布基础组件
│   │   ├── CircleRing.vue          # 通用段导向 SVG 圆环渲染器
│   │   ├── PointRing.vue           # 通用点导向 SVG 圆环渲染器
│   │   └── RingStack.vue           # 同心圆环自动布局容器
│   ├── rings/
│   │   ├── DataRing.vue            # 数据驱动段圆环（RingData → CircleRing）
│   │   ├── DataPointRing.vue       # 数据驱动点圆环（PointRingData → PointRing）
│   │   ├── DegreeScale.vue         # 度数刻度环（按间隔生成）
│   │   ├── GuaRing.vue             # 六十四卦特殊圆环
│   │   └── PlanetDegreeRing.vue   # 七曜度数环
│   ├── celestial/                  # 天体可视化组件
│   │   ├── BodyMarker.vue          # 天体标记
│   │   ├── CelestialBody.vue       # 天体容器
│   │   ├── EclipticCircle.vue      # 黄道圈
│   │   └── LunarOrbit.vue          # 白道轨道
│   ├── HelioOrbits.vue             # 日行轨道
│   ├── SkyChart.vue                # 全天投影图
│   ├── SolarEcliptic.vue          # 太阳黄道（astronomy-engine）
│   ├── TaiChi.vue                 # 时间驱动的太极图
│   └── Control.vue                # 统一控制面板
├── data/rings/                    # 圆环数据（每个文件一个环）
│   ├── types.ts                   # 类型系统：
│   │                              #  RingItemBase → RingItem / PointItem
│   │                              #  RingDataBase → RingData / PointRingData
│   ├── index.ts                   # 统一导出
│   ├── twentyFourSolarTerms.ts    # 二十四节气（点导向）
│   ├── twentyEightConstellations.ts # 二十八星宿
│   ├── sixtyJiazi.ts              # 六十甲子
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
│   ├── useAnimation.ts            # 动画控制 composable
│   ├── useRingBase.ts             # 所有圆环共享基础逻辑
│   ├── useTimePlayback.ts         # 时间播放（从 Control 抽出）
│   ├── usePanelDrag.ts            # 面板拖拽（从 Control 抽出）
│   └── useKeyboardShortcuts.ts    # 键盘快捷键（从 Control 抽出）
├── utils/
│   ├── chineseCalendar.ts         # 农历工具（tyme4ts）
│   ├── liushiJiazi.ts             # 六柱六十甲子序号计算（tyme4ts）
│   ├── celestial.ts               # 天体坐标计算
│   ├── eraCalendar.ts             # 朝代纪年转换 + 跨全时域干支
│   ├── geometry.ts               # 极坐标几何工具
│   ├── planetMansion.ts           # 七曜入宿计算
│   ├── skyEvents.ts              # 天体会合事件计算
│   └── skyProjection.ts          # 天球坐标投影
├── router/index.ts                # 由注册表生成的路由
├── App.vue                        # 外壳：仅 <RouterView />
└── main.ts                        # 入口（Vue + Pinia + Router）
```

## 🧩 如何扩展

### 新增一个罗盘

1. 新建 `src/views/XxxView.vue`，参考 `AstronomyView.vue` / `LiushiJiaziView.vue`：`.container` 包一个 `<svg>`，其中 `<g transform>` 应用平移/缩放/旋转，附带返回首页链接和 `Control` 面板。
2. 在 `src/compasses/index.ts` 的 `compasses` 数组追加一项（唯一 `id`、`name`、`description`、`category`、懒加载 `component`）。
3. 首页卡片与 `/compass/:id` 路由自动出现。

### 新增一个段导向数据驱动圆环

1. 新建 `src/data/rings/myRing.ts` 导出 `RingData`（必填 `items`，样式字段可选），并在 `src/data/rings/index.ts` 中重新导出。
2. 在视图的 `RingStack` 配置里加一项：`{ component: markRaw(DataRing), thickness: N, props: { data: myRing } }`。

### 新增一个点导向数据驱动圆环

1. 新建 `src/data/rings/myRing.ts` 导出 `PointRingData`（必填 `items`，每个点要有 `angle`，样式字段可选），并在 `src/data/rings/index.ts` 中重新导出。
2. 在视图的 `RingStack` 配置里加一项：`{ component: markRaw(DataPointRing), thickness: N, props: { data: myRing } }`。

详细组件 API 见 [COMPONENT_DOCUMENTATION.md](COMPONENT_DOCUMENTATION.md)。

## 🧪 测试与质量

```sh
npm run type-check   # vue-tsc 类型检查
npm run lint         # ESLint 自动修复
npm run format       # Prettier 格式化
npm run test:unit    # Vitest 单元测试
npm run test:e2e     # Playwright 端到端测试
```

E2E 相关：

```sh
npx playwright install                       # 首次安装浏览器
npm run test:e2e -- --project=chromium       # 指定浏览器
npm run test:e2e -- tests/example.spec.ts    # 指定文件
npm run test:e2e -- --debug                  # 调试模式
```

## 🚢 部署

GitHub Pages：

```sh
npm run deploy   # 构建并发布 dist/ 到 gh-pages 分支
```

该命令执行生产构建，再将 `dist/` 推送到 `gh-pages` 分支，由 GitHub Actions（`.github/workflows/`）自动部署。

## 🌍 浏览器支持

- Chrome / Edge ≥ 88
- Firefox ≥ 85
- Safari ≥ 14

## 🤝 贡献

欢迎提交 Issue 和 Pull Request。

## 📄 许可证

MIT License

---

## 推荐开发环境

[VS Code](https://code.visualstudio.com/) + [Vue (Official) / Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)（请禁用 Vetur）。

> TypeScript 默认无法处理 `.vue` 导入的类型，本项目用 `vue-tsc` 替代 `tsc` 做类型检查，编辑器中需 Volar 提供 `.vue` 类型支持。

构建配置参考 [Vite 配置文档](https://vite.dev/config/)。
