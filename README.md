# 🌟 中华天文圆环 - Chinese Astronomical Rings

一个基于 Vue 3 和 TypeScript 的交互式中华传统文化天文圆环可视化系统，展示完整的中华传统文化宇宙观体系。

## ✨ 特性

- **📏 360度刻度尺** - 精确的角度刻度标记和度数显示，支持自定义间隔
- **☀️ 太阳黄道系统** - 基于astronomy-engine的精确太阳位置计算和实时显示
- **⭐ 二十八星宿圆环** - 四象七宿，东方青龙、北方玄武、西方白虎、南方朱雀
- **🐲 十二地支圆环** - 子丑寅卯辰巳午未申酉戌亥
- **🐉 四象圆环** - 青龙、朱雀、白虎、玄武，五行四方位
- **⏰ 智能时间控制系统** - 支持实时时间控制、动画播放、缩放和平移
- **🎨 智能文字定向** - 文字始终指向圆心，支持双字符垂直排列
- **📱 响应式设计** - 支持不同屏幕尺寸
- **🎯 精确角度控制** - 支持自定义起始和结束角度
- **🎮 键盘快捷键** - 完整的键盘控制支持
- **🌍 农历显示** - 集成tyme4ts库，显示农历、干支、节气信息

## 🎮 组件结构

```
📐 重构后的中华传统文化宇宙观层次结构：

┌─────────────────────────────────────────────────┐
│ 📏 360度刻度尺 (480-460) - DegreeScale组件       │
│   ✅ 支持自定义刻度间隔 (1-360度)                 │
│   ✅ 扇形区域可视化                              │
│   ✅ 智能文字定位和旋转                          │
├─────────────────────────────────────────────────┤
│ ☀️ 太阳黄道系统 (420-390) - SolarEcliptic组件    │
│   ✅ 基于astronomy-engine的精确计算              │
│   ✅ 实时太阳位置显示                            │
│   ✅ 春分点标记                                  │
│   ✅ 季节性颜色变化                              │
├─────────────────────────────────────────────────┤
│ ⭐ 二十八星宿 (380-350) - TwentyEightConstellations │
│   ├── 东方青龙: 角、亢、氐、房、心、尾、箕       │
│   ├── 北方玄武: 斗、牛、女、虚、危、室、壁       │
│   ├── 西方白虎: 奎、娄、胃、昴、毕、觜、参       │
│   └── 南方朱雀: 井、鬼、柳、星、张、翼、轸       │
├─────────────────────────────────────────────────┤
│ 🐲 十二地支 (280-250) - EarthlyBranches         │
│   └── 子丑寅卯辰巳午未申酉戌亥                   │
├─────────────────────────────────────────────────┤
│ 🐉 四象 (180-150) - SiXiang                     │
│   ├── 青龙 (东) - 木属性，青绿色               │
│   ├── 朱雀 (南) - 火属性，朱红色               │
│   ├── 白虎 (西) - 金属性，白色                 │
│   └── 玄武 (北) - 水属性，玄蓝色               │
└─────────────────────────────────────────────────┘

⏰ 控制面板 - Control组件 (右侧固定面板)
├── 🕐 时间控制: 播放/暂停、速度调节、时间选择
├── 🔍 缩放控制: 放大/缩小/重置、预设缩放
├── 🎯 平移控制: 方向键移动、重置位置
├── 📅 农历信息: 农历日期、干支纪年、节气显示
└── ⌨️ 键盘快捷键: 完整的键盘操作支持
```

### 🚧 重构说明

当前项目处于"重构天文体系"阶段，以下组件已重构完成：
- ✅ **DegreeScale** - 新的通用度数刻度组件，替代CircleScale
- ✅ **SolarEcliptic** - 新的太阳黄道组件，使用astronomy-engine
- ✅ **PolarCanvas** - 新的极坐标画布基础组件
- ✅ **Control** - 统一的控制面板，集成时间、缩放、平移控制

暂时注释的组件（待重构）：
- 🔄 **SixtyJiazi** - 六十甲子组件
- 🔄 **HeavenlyStems** - 十天干组件
- 🔄 **EightGates** - 八门组件
- 🔄 **TwelveLongevity** - 十二长生组件

## 🛠️ 技术栈

- **Vue 3.5.22** - 渐进式 JavaScript 框架，Composition API
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite 7.1.7** - 现代化前端构建工具
- **astronomy-engine 2.1.19** - 高精度天文计算库
- **tyme4ts 1.3.7** - 中华传统历法计算库
- **Pinia 3.0.3** - Vue 状态管理
- **SVG** - 可缩放矢量图形
- **CSS3** - 现代 CSS 特性和动画

## 🚀 快速开始

### 环境要求

- Node.js >= 20.19.0 || >= 22.12.0
- npm >= 8.0.0

### 安装依赖

```sh
npm install
```

### 开发运行

```sh
npm run dev
```

### 生产构建

```sh
npm run build
```

## 📦 项目结构

```
src/
├── components/
│   ├── base/                       # 基础组件目录
│   │   ├── PolarCanvas.vue         # 🆕 极坐标画布组件
│   │   ├── OrbitSystem.vue         # 🆕 轨道系统组件
│   │   └── CircleRing.vue          # 通用圆环组件 (遗留)
│   ├── DegreeScale.vue             # 🆕 通用度数刻度组件
│   ├── SolarEcliptic.vue           # 🆕 太阳黄道组件
│   ├── TwentyEightConstellations.vue # 二十八星宿组件
│   ├── EarthlyBranches.vue         # 十二地支组件
│   ├── SiXiang.vue                 # 四象组件
│   ├── SixtyJiazi.vue             # 六十甲子组件 (🔄注释中)
│   ├── HeavenlyStems.vue           # 十天干组件 (🔄注释中)
│   ├── EightGates.vue             # 八门组件 (🔄注释中)
│   ├── TwelveLongevity.vue        # 十二长生组件 (🔄注释中)
│   └── Control.vue                # 🆕 统一控制面板
├── composables/
│   └── useAnimation.ts            # 🆕 动画控制composable
├── utils/
│   └── chineseCalendar.ts         # 🆕 中国历法工具
├── types/                         # TypeScript类型定义
├── stores/                        # Pinia状态管理
├── router/                        # Vue Router路由
├── views/                         # 页面视图组件
├── App.vue                        # 主应用组件
└── main.ts                        # 应用入口
```

## 🎯 核心组件功能

### 🆕 PolarCanvas 极坐标画布组件

作为所有极坐标组件的基础画布，提供统一的坐标系统和动画支持：

- **标准极坐标系统** - 0度在正右方，顺时针增加
- **统一动画管理** - 通过useAnimation composable
- **坐标转换工具** - 极坐标与笛卡尔坐标转换
- **角度计算函数** - 中点角度、角度跨度等
- **SVG路径生成** - 圆弧和扇形路径生成

### 🆕 DegreeScale 通用度数刻度组件

高度灵活的极坐标刻度环组件：

- **自定义刻度间隔** - 支持1-360度任意间隔
- **智能刻度生成** - 自动生成完整的刻度线网格
- **扇形区域可视化** - 每个刻度间隔的扇形背景
- **文字智能定位** - 文字始终指向圆心
- **动画支持** - 集成PolarCanvas的动画系统

**常用配置示例：**
```vue
<!-- 六十甲子体系：6度间隔 -->
<DegreeScale :radius="200" :scale-interval="6" />

<!-- 十二地支体系：12度间隔 -->
<DegreeScale :radius="200" :scale-interval="12" />

<!-- 二十四节气体系：15度间隔 -->
<DegreeScale :radius="200" :scale-interval="15" />
```

### 🆕 SolarEcliptic 太阳黄道组件

基于astronomy-engine的精确太阳位置计算：

- **精确太阳位置** - 使用astronomy-engine计算黄经
- **实时更新** - 支持时间控制和动画
- **春分点标记** - 显示0度参考点
- **季节性颜色** - 根据黄经变化太阳颜色
- **春分夏至秋分冬至** - 重要节气点的视觉标识

```vue
<SolarEcliptic
  :radius="160"
  :time="controlledTime"
  :enable-animation="true"
  :show-sun-label="true"
/>
```

### 🆕 Control 统一控制面板

集成时间、缩放、平移的完整控制系统：

- **时间控制** - 播放/暂停、速度调节、时间选择
- **缩放控制** - 放大/缩小、重置、预设缩放(50%-150%)
- **平移控制** - 方向键移动、重置位置
- **农历显示** - 显示农历日期、干支纪年、节气信息
- **键盘快捷键** - 完整的键盘操作支持

**键盘快捷键：**
- `空格` - 播放/暂停
- `R` - 重置到当前时间
- `H/⇧H` - +1小时/-1小时
- `D/⇧D` - +1天/-1天
- `M/⇧M` - +1月/-1月
- `Y/⇧Y` - +1年/-1年
- `+/-/0` - 缩放控制
- `方向键` - 平移控制
- `Delete` - 重置平移

## 🎨 架构设计

### 基础组件架构

```
PolarCanvas (基础画布)
├── 提供极坐标系统
├── 统一动画管理
├── 坐标转换工具
└── 通过slot传递工具函数

DegreeScale (刻度组件)
├── 继承PolarCanvas
├── 生成刻度线和扇形
└── 智能文字定位

SolarEcliptic (太阳组件)
├── 继承PolarCanvas
├── 集成astronomy-engine
└── 实时位置计算

其他传统组件
├── 可选择性继承PolarCanvas
├── 保持原有功能
└── 逐步迁移到新架构
```

### 状态管理

使用Pinia进行状态管理，支持：
- 时间状态同步
- 缩放和偏移状态
- 动画状态管理
- 组件间通信

### 工具库集成

- **astronomy-engine** - 高精度天文计算
- **tyme4ts** - 中华传统历法
- **自定义工具函数** - 坐标转换、角度计算等

## 📚 API 参考

### PolarCanvas Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `width` | number | 800 | 画布宽度 |
| `height` | number | 600 | 画布高度 |
| `centerX` | number | 400 | 圆心X坐标 |
| `centerY` | number | 300 | 圆心Y坐标 |
| `rotation` | number | 0 | 手动旋转角度 |
| `enableAnimation` | boolean | false | 启用动画 |
| `animationSpeed` | number | 0.5 | 动画速度 |

### DegreeScale Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `radius` | number | - | 外半径 (必填) |
| `innerRadius` | number | 0 | 内半径 |
| `scaleInterval` | number | 5 | 刻度间隔 (度数) |
| `startDegree` | number | 0 | 起始度数偏移 |
| `showLabels` | boolean | true | 显示度数标签 |
| `showSectors` | boolean | true | 显示扇形区域 |
| `sectorColor` | string | '#ffffff' | 扇形颜色 |
| `sectorOpacity` | number | 0.1 | 扇形透明度 |

### SolarEcliptic Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `radius` | number | 200 | 黄道半径 |
| `time` | Date | new Date() | 观测时间 |
| `sunPosition` | SunPosition | - | 自定义太阳位置 |
| `enableAnimation` | boolean | true | 启用动画 |
| `showSunLabel` | boolean | true | 显示太阳标签 |

## 🌍 浏览器支持

- Chrome/Edge >= 88
- Firefox >= 85
- Safari >= 14

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
npm run build

# Runs the end-to-end tests
npm run test:e2e
# Runs the tests only on Chromium
npm run test:e2e -- --project=chromium
# Runs the tests of a specific file
npm run test:e2e -- tests/example.spec.ts
# Runs the tests in debug mode
npm run test:e2e -- --debug
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```