# 🧭 乙巳观 (Yisiguan)

> 一个个人项目：乙巳年，观天那一瞬来了感觉，于是有了这里。

用来把各种古代的算法画成可以看、可以转、可以随时间演化的**罗盘**。主要为我自己服务 —— 解决那些从史料里翻出来、纸上难以想象、代码里跑起来又极想亲眼看看的可视化问题。

技术栈：Vue 3 + TypeScript + SVG。

## ✨ 罗盘清单

- **中华天文圆环** — 二十四节气、二十八宿、六十甲子、五行纳音、天干地支、八门四象、太阳黄道，一盘看尽中华天文全景。
- **六十甲子六环** — 年月日时分秒六柱同心环，实时跟踪当下干支，柱格高亮。
- **先天六十四卦盘** — 伏羲/邵雍先天圆图，六十四卦按二进制位反转排列，乾南坤北。
- **京房十二消息卦盘** — 京房卦气：60 卦六日七分 + 四正卦 + 十二消息卦 + 八宫世应 + 浑天纳甲 + 日干支值日环。
- **七曜入宿天象盘** — 盖天投影，赤道·黄道·白道三道斜交，日月五星实时入二十八宿。
- **回归年闰月盘** — 365 天回归年对 360 度甲子纪年，节气节/中气区分，农历闰月与月相实时可视化。

## 🛠️ 技术栈

Vue 3.5 · TypeScript · Vite 7 · Vue Router 4 · [astronomy-engine](https://github.com/cosinekitty/astronomy)（天文计算） · [tyme4ts](https://github.com/6tail/tyme4ts)（历法/干支）

## 🚀 快速开始

Node.js `^20.19.0 || >=22.12.0`：

```sh
npm install      # 安装依赖
npm run dev      # 开发服务器
npm run build    # 生产构建（含类型检查）
```

## 📦 项目结构

```
src/
├── compasses/         # 罗盘注册表（驱动首页 + 路由）
├── views/             # 各罗盘视图（Layer 2 组合层）
├── components/
│   ├── base/          # 基础渲染层（PolarCanvas / CircleRing / PointRing / RingStack）
│   ├── rings/         # 领域圆环组件
│   ├── centers/       # 领域圆心组件（TaiChi / SolarEcliptic / …）
│   └── celestial/     # 天体可视化（BodyMarker / EclipticCircle / LunarOrbit）
├── data/rings/        # 静态圆环数据
├── composables/       # useRingBase / useTimePlayback / …
├── utils/             # 纯函数工具（celestial / geometry / liushiJiazi / …）
└── router/            # 由注册表自动生成
```

## 📚 深入了解

- 五层架构、开发范式、30 项合规检查：见 [CLAUDE.md](CLAUDE.md)
- 组件 API 与类型契约：见 [COMPONENT_DOCUMENTATION.md](COMPONENT_DOCUMENTATION.md)
- astronomy-engine 集成手册：见 [astronomy-engine-usage.md](astronomy-engine-usage.md)

## 🚢 部署

```sh
npm run deploy   # 构建并发布 dist/ 到 gh-pages 分支
```

## 📄 许可证

MIT
