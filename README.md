# 🌟 中华天文圆环 - Chinese Astronomical Rings

一个基于 Vue 3 和 TypeScript 的交互式中华传统文化天文圆环可视化系统，展示十天干、十二地支和二十八星宿的动态旋转效果。

## ✨ 特性

- **🏮 十天干圆环** - 甲乙丙丁戊己庚辛壬癸，顺时针旋转
- **🐲 十二地支圆环** - 子丑寅卯辰巳午未申酉戌亥，逆时针旋转
- **⭐ 二十八星宿圆环** - 四象七宿，顺时针旋转
- **🎨 动态旋转动画** - 不同速度和方向的独立旋转
- **🧭 智能文字定向** - 文字始终指向圆心
- **📱 响应式设计** - 支持不同屏幕尺寸
- **🎯 精确角度控制** - 支持自定义起始和结束角度

## 🎮 组件结构

```
├── 最外层: 二十八星宿 (半径 280)
│   ├── 东方青龙七宿: 角、亢、氐、房、心、尾、箕
│   ├── 北方玄武七宿: 斗、牛、女、虚、危、室、壁
│   ├── 西方白虎七宿: 奎、娄、胃、昴、毕、觜、参
│   └── 南方朱雀七宿: 井、鬼、柳、星、张、翼、轸
├── 中间层: 十二地支 (半径 200)
└── 最内层: 十天干 (半径 120)
```

## 🛠️ 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 现代化前端构建工具
- **SVG** - 可缩放矢量图形

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
│   ├── CircleRing.vue              # 通用圆环组件
│   ├── HeavenlyStems.vue           # 十天干组件
│   ├── EarthlyBranches.vue         # 十二地支组件
│   └── TwentyEightConstellations.vue # 二十八星宿组件
├── App.vue                         # 主应用组件
└── main.ts                         # 应用入口
```

## 🎯 组件功能

### CircleRing 组件

通用圆环组件，支持以下配置：

- **radius** - 外圆半径
- **innerRadius** - 内圆半径
- **items** - 圆环项目数组
- **rotation** - 旋转角度
- **showLabels** - 是否显示标签
- **showTicks** - 是否显示刻度
- **showCircle** - 是否显示圆环边框
- **labelPosition** - 标签位置 (0-1)
- **自定义颜色** - 支持自定义各元素颜色

### 旋转速度配置

- **十天干**: 0.05°/帧 (顺时针)
- **十二地支**: 0.03°/帧 (逆时针)
- **二十八星宿**: 0.002°/帧 (顺时针)

## 🎨 自定义主题

项目支持自定义颜色主题，每个组件都可以独立配置：

```vue
<CircleRing
  :radius="200"
  :inner-radius="150"
  :items="customItems"
  circle-color="#666666"
  tick-color="#444444"
  label-color="white"
/>
```

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
