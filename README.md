# 🧭 乙巳观 (Yisiguan)

> 道由天观。乙巳年，观天那一瞬来了感觉，于是有了这里。

一个把古代中华算法画成**可以看、可以转、可以随时间演化**的罗盘的项目——集**古籍笔记 · 通用概念 · 罗盘可视化**三位一体的知识站。

主要为我自己服务，解决那些从史料里翻出来、纸上难以想象、代码里跑起来又极想亲眼看看的可视化问题。

技术栈：**VitePress 1.6** 单栈 · Vue 3.5 · TypeScript · SVG。

## ✨ 罗盘清单

- **中华天文圆环** — 二十四节气、二十八宿、六十甲子、五行纳音、天干地支、八门四象、太阳黄道，一盘看尽中华天文全景。
- **六十甲子六环** — 年月日时分秒六柱同心环，实时跟踪当下干支，柱格高亮。
- **先天六十四卦盘** — 伏羲/邵雍先天圆图，六十四卦按二进制位反转排列，乾南坤北。
- **京房十二消息卦盘** — 京房卦气：60 卦六日七分 + 四正卦 + 十二消息卦 + 八宫世应 + 浑天纳甲 + 日干支值日环。
- **七曜入宿天象盘** — 盖天投影，赤道·黄道·白道三道斜交，日月五星实时入二十八宿。
- **回归年闰月盘** — 365 天回归年对 360 度甲子纪年，节气节/中气区分，农历闰月与月相实时可视化。

访问：<https://andaoai.github.io/O/>

## 🛠️ 技术栈

- **VitePress 1.6** — 文档站与罗盘页共用同一构建产物。
- **Vue 3.5** — 罗盘组件宿主。
- **[astronomy-engine](https://github.com/cosinekitty/astronomy)** — 天文计算。
- **[tyme4ts](https://github.com/6tail/tyme4ts)** — 历法/干支。

**关键设计**：项目**不使用** Vue Router 也**不再是 SPA**。所有罗盘都以 `docs/compass/*.md` 的 VitePress 页面形式存在，通过自定义 `layout: compass` 全屏渲染 `src/views/*.vue`。src/ 是纯组件库，靠 `@` alias 被 VitePress 消费。

## 🚀 快速开始

Node.js `^20.19.0 || >=22.12.0`：

```sh
npm install         # 安装依赖
npm run dev         # 启动 VitePress dev（含文档 + 罗盘）
npm run type-check  # vue-tsc 类型检查
npm run build       # 生产构建 → dist/
npm run preview     # 预览生产产物
```

开发服务器默认在 <http://localhost:5173/O/>：
- `/O/` — 文档首页
- `/O/compass/` — 罗盘一览
- `/O/compass/astronomy` — 中华天文圆环（可加 `?t=2026-01-01T00:00` 精确定位时间）

## 📦 项目结构

```
├─ docs/                          # VitePress 站点根
│  ├─ .vitepress/
│  │  ├─ config.ts                # 站点配置（base='/O/'、nav、sidebar、alias）
│  │  └─ theme/
│  │     ├─ index.ts              # 主题入口：注册 6 个 View 与环组件、layout 分派
│  │     ├─ tokens.css            # 紫金 design tokens
│  │     ├─ layouts/
│  │     │  └─ CompassLayout.vue  # 全屏罗盘 layout（隐藏 nav/sidebar/aside）
│  │     └─ components/
│  │        └─ CompassFigure.vue  # md 内嵌罗盘插图外壳
│  ├─ index.md                    # 站点首页
│  ├─ books/                      # 古籍笔记（示例：乙巳占·卷一·天说）
│  ├─ concepts/                   # 通用概念索引
│  └─ compass/                    # 六个罗盘页 + 一览页（layout: compass）
│
└─ src/                           # 组件库（被 VitePress 通过 @ alias 消费）
   ├─ compasses/index.ts          # 罗盘注册表（元数据，驱动一览页）
   ├─ views/                      # Layer 2 组合层：6 个罗盘 View + HomeView
   ├─ components/
   │  ├─ base/                    # Layer 4 基础渲染层（PolarCanvas/CircleRing/PointRing/RingStack）
   │  ├─ rings/                   # 领域圆环组件（26 个）
   │  ├─ centers/                 # 领域圆心组件（4 个）
   │  └─ celestial/               # 天体可视化
   ├─ data/rings/                 # 静态圆环数据 + 类型契约
   ├─ composables/                # useRingBase / useUrlTime / useTimePlayback / …
   └─ utils/                      # Layer 5 纯函数（celestial / geometry / liushiJiazi / …）
```

## 📚 深入了解

- 五层架构、开发范式、30 项合规检查：见 [CLAUDE.md](CLAUDE.md)
- 组件 API 与类型契约、Astronomy Engine 集成指南：作为**开发文档**收录进站内 [docs/dev/](docs/dev/)，运行 `npm run dev` 后可在 <http://localhost:5173/O/dev/> 阅读。

## 🚢 部署

推送到 `main` 分支后 GitHub Actions 自动构建并部署到 GitHub Pages（见 [.github/workflows/deploy.yml](.github/workflows/deploy.yml)）。

也可本地手动发布：

```sh
npm run deploy   # 构建并 push dist/ 到 gh-pages 分支
```

## 📄 许可证

MIT
