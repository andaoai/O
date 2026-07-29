---
title: 架构审视报告
created: 2026-07-28
---

# 架构审视报告

> 本报告基于 2026-07-28 对乙巳观项目全量代码的自动化审视，覆盖组件层、工具层、数据层、类型系统、文档架构五个维度。共扫描 271 个源文件、53,288 行代码。

## 一、项目概览

| 维度 | 数量 |
|------|------|
| 源文件（`.ts` + `.vue`） | 160 |
| 文档文件（`.md` + `.ts` + `.css`） | 111 |
| 总代码行数 | 53,288 |
| 罗盘盘面 | 12 |
| 圆环组件 | 40+ |
| 圆心组件 | 10 |
| Composables | 21 |
| 工具函数 | 28 |
| Git 提交（2025 年至今） | 326 |

## 二、架构现状：五层分层执行评估

### 2.1 分层概览

```
Layer 1  State        → 12 个 View 中的 ref 定义
Layer 2  Composition  → 12 个 View + RingStack 编排
Layer 3  Domain       → 40+ 环组件 + 10 圆心组件 + 21 composable
Layer 4  Base Render  → 5 个基础渲染组件 + 3 个数据桥接组件
Layer 5  Utility      → 28 个纯函数工具
```

### 2.2 时间驱动范式合规

**检查对象**：所有声明了 `time?: MaybeRef<Date>` 的环组件。

| 检查项 | 结果 |
|--------|------|
| `timeRef = computed(() => unref(props.time) ?? new Date())` 三行范式 | ✅ 23/23 全部合规 |
| 无 `watch` 监听 time（使用 computed 派生） | ✅ |
| 不解构 `props.time.value` | ✅ |
| 无 emit 回传 | ✅ |
| 无全局状态依赖 | ✅ |

**结论**：时间驱动范式是项目中执行最彻底的约定，无任何违规。

### 2.3 圆心组件规范合规

| 检查项 | 结果 |
|--------|------|
| 禁止声明 `innerRadius` prop | ✅ 全部合规 |
| 通过 RingStack `#center` slot 接收 `innerRadius` | ✅ |
| 包含 `radius` 和 `rotationDirection` | ✅ |
| 放置在 `centers/` 目录 | ✅ |

**备注**：`HelioOrbits.vue` 内部 computed 了一个 `innerRadius` 局部变量（用于轨道布局计算），这是内部实现细节，不违反 prop 规则。

### 2.4 工具层一致性

| 检查项 | 结果 |
|--------|------|
| 零 `export default` | ✅ 28/28 全部命名导出 |
| 纯函数无副作用 | ✅ |
| 无循环依赖 | ✅ data→utils 4 处，utils→data 13 处，依赖流为 DAG |
| constants/ 零外部依赖 | ⚠️ `solarTerms.ts` 依赖 `geometry.ts`（详见 §四） |

### 2.5 渲染层正确性

| 检查项 | 结果 |
|--------|------|
| 段环使用 `DataRing` | ✅ |
| 点环使用 `DataPointRing` | ✅ |
| 体环使用 `DataBodyRing` + `polarToCartesian` | ✅ |
| 三级高亮体系 | ✅ |
| 角度计算统一使用 `utils/geometry` | ✅ |

## 三、VitePress 集成评估

### 3.1 Layout 分派

12 个罗盘页均使用 `layout: compass` 前端数据，触发 `CompassLayout` 全屏渲染。1 个首页使用 `layout: page`。分派逻辑正确无误。

### 3.2 组件注册完整性

| 类别 | 全局注册数 | 文件系统数 | 匹配 |
|------|-----------|-----------|------|
| Views（罗盘页） | 13 | 13 | ✅ |
| 共享环组件 | 17 | 17 | ✅ |
| 文档可视化组件 | 5 | 5 | ✅ |
| 圆心组件 | 1（GuaRelationCenter） | 1（根目录） | ✅ |
| 专用环组件（子目录） | 不注册 | 21 | ✅ 仅被各自 View 消费 |

### 3.3 罗盘注册表

`compasses/index.ts` 中 12 条注册与 12 个 View 文件、12 个 `.md` 页面完全一一对应，无断裂。

### 3.4 文档结构一致性

| 文档区域 | 文件数 | 模式 | 一致性 |
|----------|--------|------|--------|
| `compass/` | 12 + 1 index | `layout: compass` + `<ClientOnly>` | ✅ 完全一致 |
| `concepts/` | 15 + 1 index | `<CompassFigure>` 内嵌环组件 | ✅ |
| `books/` | 66 + 2 index | 丰富 frontmatter + `<SingleGuaViz>` | ✅ |
| `dev/` | 3 | 开发者文档 | ✅ |

## 四、发现的问题

### P0：类型安全缺口

| 编号 | 问题 | 位置 | 影响 |
|------|------|------|------|
| 1 | `RingDataBase.items` 类型不安全 | `src/data/rings/types.ts:60` | 基类 `items?: readonly { fontSize?: number }[]` 与子类 `RingItem[]` / `PointItem[]` 不兼容 |
| 2 | `types.ts` 反向依赖 `utils/celestial.ts` | `src/data/rings/types.ts:154` | 核心数据类型引用工具层类型（`PlanetMotion`） |

**修复建议**：
- 将 `PlanetMotion` 类型提取到 `types.ts` 或独立 `types/` 目录
- 将 `RingDataBase.items` 改为泛型或移除（基类不需要定义 items）

### P1：数据与算法混合

`data/` 层部分文件同时包含数据定义和计算函数：

| 文件 | 混合的计算函数 |
|------|---------------|
| `dynasties.ts` | `findDynasty()`、`formatYear()`、`formatYearShort()` |
| `sixtyFourGua.ts` | `bitReverse6()`、`getGuaLines()`、`getXiantianPos()` |
| `sevenLuminaries.ts` | `singlePlanetBody()`、`twoPlanetsBody()` 等工厂函数 |

**修复建议**：纯计算函数迁移到 `utils/`，`data/` 只保留数据定义和类型。

### P2：GuaRelationView.vue 复杂度

951 行，显著超出 12 个 View 的均值（327 行），包含五种卦关系模式的渲染逻辑。

**修复建议**：拆分为子组件，每种关系模式一个组件，主视图只负责模式切换和共享状态。

### ~~P3：constants 目录纯度~~ ✅ 已修复

~~`solarTerms.ts` 中 `isJieqi()`、`isZhongqi()`、`currentLichunIndex()` 依赖 `utils/geometry.ts`，违反 constants 的零依赖原则。~~

**修复**：3 个纯函数迁移至 `src/utils/solarTerms.ts`，constants 文件仅保留 re-export。

### ~~P4：命名一致性~~ ✅ 已修复

| 问题 | 状态 |
|------|------|
| ~~同名组件 3 份~~ | ✅ guan-dou/ → `GuanDouSolarTermsRing.vue`，qi-men-dun-jia/ → `QiMenSolarTermsRing.vue` |
| ~~viz/ 命名混用~~ | ✅ 已统一为 `*Viz` 后缀（`SingleGuaChart` → `SingleGuaViz`） |
| ~~默认导出孤例~~ | ✅ `usePhoneOrientation` 默认导出已移除 |
| ~~导出风格分裂~~ | ✅ 已统一为 `export function` |
| ~~celestial/ 过薄~~ | ✅ `BodyMarker.vue` + `PlanetSvg.vue` 合并入 `base/`，`celestial/` 目录已删除 |

### P5：文档同步

CLAUDE.md 中 `ssr.noExternal` 列表缺少 `geomagnetism`（代码正确，文档过时）。

## 五、架构健康度总评

### 做得好的方面

| 维度 | 评价 |
|------|------|
| 五层分离 | ⭐⭐⭐⭐⭐ 执行到位，范式一致 |
| 时间驱动范式 | ⭐⭐⭐⭐⭐ 23 个组件 100% 合规 |
| 工具层质量 | ⭐⭐⭐⭐⭐ 零 default 导出、无循环依赖 |
| VitePress 集成 | ⭐⭐⭐⭐⭐ 注册完整、配置一致 |
| 文档体系 | ⭐⭐⭐⭐ 古籍笔记元数据丰富，概念页有活交互 |
| 渲染层抽象 | ⭐⭐⭐⭐ DataRing / DataPointRing / DataBodyRing 三管道清晰 |

### 需要改进的方面

| 维度 | 评价 |
|------|------|
| 类型系统 | ⭐⭐⭐ 存在基类类型缺口和反向依赖 |
| 数据层纯度 | ⭐⭐⭐ 部分文件数据与算法混合 |
| View 复杂度控制 | ⭐⭐⭐ GuaRelationView 超过 900 行 |
| 命名一致性 | ⭐⭐⭐☆ 存在同名组件和风格分裂 |

### 总结

项目处于**成熟期**，五层架构执行到位，核心范式（时间驱动、圆心规范）100% 合规。不需要推倒重来的大重构。当前的改进点均为渐进式优化，按优先级排序为：

1. **类型系统加固**（P0）— 提取共享类型、修复基类缺口
2. **数据层纯化**（P1）— 计算函数从 data/ 迁到 utils/
3. **高复杂度视图拆分**（P2）— GuaRelationView 五模式组件化
4. **命名规范化**（P4）— 消除同名组件、统一导出风格

P3 和 P5 为锦上添花，可按需处理。
