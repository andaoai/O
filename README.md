# 🌟 中华天文圆环 - Chinese Astronomical Rings

一个基于 Vue 3 和 TypeScript 的交互式中华传统文化天文圆环可视化系统，展示完整的中华传统文化宇宙观体系。

## ✨ 特性

- **📏 360度刻度尺** - 精确的角度刻度标记和度数显示
- **⭐ 二十八星宿圆环** - 四象七宿，东方青龙、北方玄武、西方白虎、南方朱雀
- **📅 六十甲子圆环** - 天干地支组合，完整的六十甲子纪年体系
- **🏮 十天干圆环** - 甲乙丙丁戊己庚辛壬癸
- **🐲 十二地支圆环** - 子丑寅卯辰巳午未申酉戌亥
- **🚪 八门圆环** - 开休生伤杜景死惊
- **♻️ 十二长生圆环** - 长生、沐浴、冠带、临官、帝旺、衰、病、死、墓、绝、胎、养
- **🐉 四象圆环** - 青龙、朱雀、白虎、玄武，五行四方位
- **☀️ 太阳系天体轨道** - 太阳、木星、月亮的实时轨道运动
- **☯️ 太极图** - 中心太极，指向太阳方位
- **⏰ 时间控制系统** - 支持实时时间控制和动画播放
- **🎨 智能文字定向** - 文字始终指向圆心，支持双字符垂直排列
- **📱 响应式设计** - 支持不同屏幕尺寸
- **🎯 精确角度控制** - 支持自定义起始和结束角度

## 🎮 组件结构

```
📐 完整的中华传统文化宇宙观层次结构：

┌─────────────────────────────────────────────────┐
│ 📏 360度刻度尺 (480-460) - 角度标记和度数显示      │
├─────────────────────────────────────────────────┤
│ ⭐ 二十八星宿 (420-390) - 四象七宿               │
│   ├── 东方青龙: 角、亢、氐、房、心、尾、箕       │
│   ├── 北方玄武: 斗、牛、女、虚、危、室、壁       │
│   ├── 西方白虎: 奎、娄、胃、昴、毕、觜、参       │
│   └── 南方朱雀: 井、鬼、柳、星、张、翼、轸       │
├─────────────────────────────────────────────────┤
│ 📅 六十甲子 (380-350) - 天干地支组合，60个甲子    │
│   ├── 甲子、乙丑、丙寅...丁亥、戊子...癸亥       │
│   └── 五行配色: 木(绿)、火(红)、土(黄)、金(金)、水(蓝)│
├─────────────────────────────────────────────────┤
│ 🏮 十天干 (340-310) - 甲乙丙丁戊己庚辛壬癸        │
├─────────────────────────────────────────────────┤
│ ♻️ 十二长生 (310-280) - 双字符垂直排列           │
│   └── 长生、沐浴、冠带、临官、帝旺、衰、病、死、墓、绝、胎、养 │
├─────────────────────────────────────────────────┤
│ 🐲 十二地支 (280-250) - 子丑寅卯辰巳午未申酉戌亥   │
├─────────────────────────────────────────────────┤
│ 🚪 八门 (220-190) - 开休生伤杜景死惊            │
├─────────────────────────────────────────────────┤
│ 🐉 四象 (180-150) - 青龙、朱雀、白虎、玄武      │
│   ├── 青龙 (东) - 木属性，青绿色               │
│   ├── 朱雀 (南) - 火属性，朱红色               │
│   ├── 白虎 (西) - 金属性，白色                 │
│   └── 玄武 (北) - 水属性，玄蓝色               │
├─────────────────────────────────────────────────┤
│ ☀️ 太阳系天体 (90-30) - 实时轨道运动             │
│   ├── 太阳 (轨道半径 80) - 基于真实时间位置      │
│   ├── 木星 (轨道半径 60) - 45秒旋转周期         │
│   └── 月亮 (轨道半径 40) - 基于真实时间位置      │
├─────────────────────────────────────────────────┤
│ ☯️ 太极图 (中心，25px) - 指向太阳方位           │
└─────────────────────────────────────────────────┘

⏰ 时间控制面板 - 支持实时时间控制、播放、快进等操作
```

## 🛠️ 技术栈

- **Vue 3** - 渐进式 JavaScript 框架，Composition API
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite** - 现代化前端构建工具
- **SVG** - 可缩放矢量图形
- **CSS3** - 现代 CSS 特性和动画

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
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
│   │   ├── CircleRing.vue          # 通用圆环组件
│   │   ├── CircleScale.vue         # 刻度尺组件
│   │   ├── PolarCanvas.vue         # 极坐标画布组件
│   │   └── StarOrbit.vue          # 天体轨道组件
│   ├── HeavenlyStems.vue           # 十天干组件
│   ├── EarthlyBranches.vue         # 十二地支组件
│   ├── TwentyEightConstellations.vue # 二十八星宿组件
│   ├── SixtyJiazi.vue             # 六十甲子组件
│   ├── EightGates.vue             # 八门组件
│   ├── TwelveLongevity.vue        # 十二长生组件
│   ├── SiXiang.vue                # 四象组件
│   ├── Taiji.vue                  # 太极图组件
│   └── TimeControl.vue            # 时间控制组件
├── utils/
│   └── solarTime.ts               # 太阳时计算工具
├── App.vue                         # 主应用组件
└── main.ts                         # 应用入口
```

## 🎯 组件功能

### CircleRing 通用圆环组件

通用圆环组件，支持以下配置：

- **radius** - 外圆半径
- **innerRadius** - 内圆半径
- **items** - 圆环项目数组
- **rotation** - 旋转角度
- **showLabels** - 是否显示标签
- **showTicks** - 是否显示刻度
- **showCircle** - 是否显示圆环边框
- **labelPosition** - 标签位置 (0-1)
- **verticalTwoChar** - 双字符标签是否垂直排列
- **startDegree** - 起始度数
- **enableAnimation** - 是否启用自动旋转动画
- **自定义颜色** - 支持自定义各元素颜色

### 太极图组件 (Taiji)

- **size** - 太极图尺寸
- **auto-rotate** - 是否自动旋转
- **point-to-sun** - 是否指向太阳
- **sun-angle** - 太阳角度

### 时间控制组件 (TimeControl)

- **实时时间显示** - 当前时间和日期
- **播放控制** - 播放/暂停动画
- **时间调节** - 快进、快退分钟和小时
- **快速跳转** - 跳转到00:00、06:00、12:00、18:00
- **播放速度** - 1x、1分钟/秒、1小时/秒、1天/秒

### 太阳系天体轨道 (StarOrbit)

- **太阳** - 基于真实时间计算位置
- **木星** - 45秒旋转周期的动画
- **月亮** - 基于真实时间计算位置

### 特殊功能

- **双字符垂直排列** - 十二长生支持垂直文字显示
- **智能文字定向** - 文字始终指向圆心
- **五行配色系统** - 根据属性分配对应颜色
- **实时天体运动** - 太阳和月亮基于真实时间位置

## 🎨 自定义主题

项目支持自定义颜色主题，每个组件都可以独立配置：

```vue
<!-- 自定义圆环组件 -->
<CircleRing
  :radius="200"
  :inner-radius="150"
  :items="customItems"
  circle-color="#666666"
  tick-color="#444444"
  label-color="white"
  :vertical-two-char="false"
/>

<!-- 自定义太极图 -->
<Taiji
  :x="0"
  :y="0"
  :size="40"
  :auto-rotate="false"
  :point-to-sun="true"
/>

<!-- 自定义时间控制 -->
<TimeControl
  v-model="currentTime"
  @time-change="handleTimeChange"
/>
```

## 📚 文化背景

本项目展示了完整的中华传统文化宇宙观体系，包含了古代中国天文历法的核心元素：

### 天干地支系统
- **十天干**：甲乙丙丁戊己庚辛壬癸，代表五行相生相克
- **十二地支**：子丑寅卯辰巳午未申酉戌亥，对应十二时辰和方位
- **六十甲子**：天干地支组合，构成完整的干支纪年体系

### 四象二十八宿
- **四象**：青龙、朱雀、白虎、玄武，代表四个方位和季节
- **二十八宿**：分布在四象中的星宿，用于天文观测和占星

### 传统术数元素
- **八门**：开休生伤杜景死惊，源于奇门遁甲
- **十二长生**：描述生命周期的十二个阶段
- **四象**：象征五行和方位的神兽

### 天文观测
- **太阳运动**：基于真实时间的太阳位置计算
- **月亮周期**：月相变化和轨道运动
- **行星运行**：展示传统行星的运动轨迹

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
