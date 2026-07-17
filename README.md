# 🧭 乙巳观 (Yisiguan)

> 道由天观。乙巳年，观天那一瞬来了感觉，于是有了这里。

一个把古代中华算法画成**可以看、可以转、可以随时间演化**的罗盘的项目——集**古籍笔记 · 通用概念 · 罗盘可视化**三位一体的知识站。

主要为我自己服务，解决那些从史料里翻出来、纸上难以想象、代码里跑起来又极想亲眼看看的可视化问题。

技术栈：**VitePress 1.6** 单栈 · Vue 3.5 · TypeScript · SVG。

## ✨ 罗盘清单

- **六十甲子六环** — 年月日时分秒六柱同心环，实时跟踪当下干支，柱格高亮。
- **先天六十四卦盘** — 伏羲/邵雍先天圆图，六十四卦按二进制位反转排列，乾南坤北。
- **京房六日七分纳甲盘** — 京房卦气以六日七分法为核心：60 卦 × 6 爻 = 360 爻位承载 365.25 天。外圈 24 节气 + 365 天日干支刻度，中层 360 爻精细刻度，主体 60 卦爻线环与浑天纳甲干支环，当日值卦、值爻实时高亮。
- **七曜入宿天象盘** — 盖天投影，赤道·黄道·白道三道斜交，日月五星实时入二十八宿。
- **回归年闰月盘** — 365 天回归年对 360 度甲子纪年，节气节/中气区分，农历闰月与月相实时可视化。
- **观斗盘** — 圆心真实北斗七星（岁差修正）+ 紫微垣东西两藩 + 勾陈一 + 地平圈（浏览器定位），外裹月建/时辰赤道环、月将/七曜/节气黄道环——把北斗的方位读成时辰、季节与年岁。
- **卦关系盘** — 京房八宫六十四卦飞伏关系，外圈京房八宫环，中央 64 条有向箭头从各卦指向 8 个纯卦，呈放射状收敛。
- **苏州石刻天文图** — 南宋淳祐七年（1247）王致远勒石于苏州府学的天文图数字复原：三规圆 + 二十八宿不等宽径向辐条 + 中央拱极北斗，斗柄随本地恒星时旋转。

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
- `/O/compass/liushi-jiazi` — 六十甲子六环（可加 `?t=2026-01-01T00:00` 精确定位时间）

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
│  ├─ books/                      # 古籍笔记
│  │  ├─ yisizhan/                # 乙巳占（唐·李淳风）
│  │  └─ 京氏易傳/                # 京氏易传（汉·京房）— 每卦一页，配 SingleGuaChart
│  ├─ concepts/                   # 通用概念索引（岁差、纳甲、卦气、世应、七曜……）
│  ├─ dev/                        # 站内开发文档（组件 API / astronomy-engine 集成）
│  └─ compass/                    # 九个罗盘页 + 一览页（layout: compass）
│
└─ src/                           # 组件库（被 VitePress 通过 @ alias 消费）
   ├─ compasses/index.ts          # 罗盘注册表（元数据，驱动一览页）
   ├─ views/                      # Layer 2 组合层：9 个罗盘 View + HomeView
   ├─ components/
   │  ├─ base/                    # Layer 4 基础渲染层（PolarCanvas/CircleRing/PointRing/RingStack/BaseCenter）
   │  ├─ rings/                   # 领域圆环组件（27 个）+ 3 个 Data* 数据包装器
   │  ├─ centers/                 # 领域圆心组件（6 个）
   │  ├─ sidebar/                 # 罗盘左侧嵌入式 Sidebar（时间/视口/View 专属工具位）
   │  ├─ gua-relation/                   # 飞伏图盘专用（64 条飞伏箭头径向叠加）
   │  ├─ gua/                     # 单卦静态图（SingleGuaChart，供古籍笔记内嵌）
   │  └─ celestial/               # 天体可视化
   ├─ data/rings/                 # 静态圆环数据 + 类型契约
   ├─ composables/                # useRingBase / useUrlTime / useTimeController / useViewport / useLiveClock / useAltDragPan / useCompassContext / useSidebarLayout / …
   └─ utils/                      # Layer 5 纯函数（celestial / geometry / liushiJiazi / najia / guaInfo / beidou / ziwei / jianJiang / guaRelationArrows / …）
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
