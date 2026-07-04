---
name: add-concept
description: 按照 docs/concepts/ 通用概念页统一写作规范，半自动模板填空生成新的概念页；自动登记 index.md，允许 TODO 模式（未上线罗盘组件占位）。
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, AskUserQuestion
---

# 通用概念页生成器 (add-concept)

按照 [docs/concepts/](docs/concepts/) 已建立的写作规范，为「乙巳观」站点新增一条概念页。概念页是术语字典层，既服务古籍笔记的交叉引用（用标准 Markdown 相对链接 `[标题](./slug)`），又作为可观察当下的迷你罗盘（用 `<CompassFigure>` 嵌活的环组件）。

> ⚠️ **不要使用 `[[wikilink]]` 语法**——VitePress 原生不解析，会渲染成纯文本。一律用标准 Markdown 相对链接 `[标题](./slug)`。

## 🔹 使用场景

当用户需要：
- 新增一条古籍概念术语（如：五行、八卦、三垣、黄道赤道白道、十二消息卦……）
- 补齐 [index.md](docs/concepts/index.md) 里带 `⏳ 待录入组件` 标记的 TODO 条目
- 为已有罗盘功能追加术语字典入口

## 🔹 概念页统一 8 段结构

现有 12 条概念页共享的写作范式（**每次生成必须命中全部 8 段**）：

| # | 段落 | 必需 | 规范 |
|---|------|------|------|
| 1 | frontmatter | ✅ | 仅 `title` 字段，格式 `<主名> · <副名>`（副名可省） |
| 2 | `# H1 标题` | ✅ | 与 frontmatter title 完全一致 |
| 3 | 定义段 | ✅ | 一段话定义术语，`**加粗**` 关键词 |
| 4 | 要点列表 / 表格 | 可选 | 展开子结构：分类列表 / 配伍表格 |
| 5 | 引出插图的过渡句 | ✅ | 以冒号结尾，如"下环……"、"下方……" |
| 6 | `<CompassFigure>` 活图 | ✅ (TODO 模式除外) | 用 1~3 个环组件叠合，必带 `caption`，可选 `time` |
| 7 | `- 参见 [标题](./slug)` 列表 | ✅ | 标准 Markdown 相对链接到相关概念，附 `—— 关联意义`。**禁止使用 `[[wikilink]]`**。 |
| 8 | `::: tip 联动罗盘 :::` | 视情况 | 仅当该概念对应某个 `/compass/*` 全屏罗盘时出现 |

**判定规则**：段 8 是否出现，等价于「该概念是否有对应的全屏罗盘」。见下节。

## 🔹 联动罗盘映射表

skill 内置的「概念 → 对应罗盘」映射，供判定段 8 是否需要，以及生成 tip 链接：

| 概念主题 | 对应罗盘路径 | 罗盘全称 |
|---------|-------------|---------|
| 六十甲子 / 干支纪时 | `/compass/liushi-jiazi` | 六十甲子六环 |
| 天文全盘 / 五行纳音 / 天干空亡 / 十二长生 / 八门 | `/compass/astronomy` | 中华天文圆环 |
| 先天六十四卦 | `/compass/sixty-four-gua` | 先天六十四卦盘 |
| 京房卦气 / 八宫 / 纳甲 / 世应 / 十二消息 | `/compass/jingfang` | 京房十二消息卦盘 |
| 二十八宿 / 四象 / 七曜 / 岁差（星宿视角） | `/compass/planet-mansion` | 七曜入宿天象盘 |
| 二十四节气（置闰视角）/ 闰月 / 农历月份 / 月相 | `/compass/tropical-year` | 回归年闰月盘 |
| 二十四节气（六日七分视角） | `/compass/jingfang` | 京房十二消息卦盘 |

若概念不在上表 → 该页不加段 8，只留段 7 的 `参见 [标题](./slug)`（参考 [shichen.md](docs/concepts/shichen.md)、[si-xiang.md](docs/concepts/si-xiang.md)、[najia.md](docs/concepts/najia.md)、[shi-ying.md](docs/concepts/shi-ying.md)）。

## 🔹 可嵌入环组件清单

**这份清单必须与 [`docs/.vitepress/theme/index.ts`](docs/.vitepress/theme/index.ts) 里全局注册的组件保持一致。执行 skill 时先 Read 该文件核对，若发现新注册组件请一并候选。**

段环 (Segment) —— 展开面式概念（干支、地支、卦、纳甲……）：

| 组件 | 用途 | 常用 props |
|------|------|-----------|
| `SixtyJiaziRing` | 六十甲子 | `pillar-id="year\|month\|day\|hour"` |
| `BranchesRing` | 十二地支 | `pillar-id="..."` |
| `StemsRing` | 天干空亡 | `pillar-id="..."` |
| `ConstellationsRing` | 二十八宿（岁差动态） | `time="..."` |
| `SiXiangRing` | 四象 | — |
| `JingFangGuaRing` | 京房六十卦 · 六日七分 | — |
| `JingFangEightPalaceRing` | 京房八宫 六十四卦 | — |
| `NajiaRing` | 六爻纳甲 | — |
| `ShiYingRing` | 世应爻位 | — |
| `LunarMonthsRing` | 农历月份 + 闰月 | `time="..."` |
| `GuaRing` | 先天六十四卦（静态） | 仅 `radius` |

点环 (Point) —— 精确角度标记（节气、刻度……）：

| 组件 | 用途 | 常用 props |
|------|------|-----------|
| `SolarTermsRing` | 二十四节气 · 传统固定 | — |
| `SolarTermsSkyRing` | 二十四节气 · 天星版 | — |
| `SolarTermsPointRing` | 节气 / 中气分色 | `origin-mode="jan1\|winterSolstice"` |
| `DegreeScale` | 360° 刻度 | `scale-interval` `label-interval` |
| `LiuRiQiFenScaleRing` | 365.25 天精细刻度 | — |
| `DayScaleRing` | 日刻度 + 干支 | — |

体环 (Body) —— 动态天体：

| 组件 | 用途 |
|------|------|
| `SevenLuminariesRing` | 七曜 |
| `MansionDegreeRing` | 入宿度标记 |
| `SinglePlanetRing` | 单行星深度 |
| `MoonPhaseRing` | 当日月相 |

半径规范（现有页面统计）：**外环 `radius` 240–270、`inner-radius` 逐层内缩 25–45**；相邻两环 `inner-radius` = 下一层的 `radius`；单环用 `radius=240, inner-radius=180~200`。

## 🔹 index.md 登记规范

每次生成必须**同时**在 [docs/concepts/index.md](docs/concepts/index.md) 追加一行到对应分类下：

- **时间与历法**：干支、节气、时辰、闰月、岁差 — 与时间轴相关
- **空间与星辰**：宿、四象、三垣、七曜、坐标系 — 与天球空间相关
- **象数与义理**：五行、八卦、六十四卦、消息卦、八宫 — 卦爻符号体系
- **占验方法**：卦气、纳甲、世应 — 术法算式

登记行格式：

```md
- [<title>](/concepts/<slug>) —— <一句钩子>
```

TODO 模式（无可嵌图）：

```md
- <title> <span class="concept-todo">⏳ 待录入组件</span>
```

## 🔹 执行流程

### 第 1 步：收集参数

从用户输入解析：`概念主题、slug、分类`。若缺失则用 AskUserQuestion 补齐。

- **slug 规则**：kebab-case、全英文、与其它页不冲突；先 `Glob docs/concepts/*.md` 检查是否已存在。
- **分类**：必须是四选一（时间与历法 / 空间与星辰 / 象数与义理 / 占验方法）。
- **title**：`<主名> · <副名>`，副名可省（如 `纳甲`、`世应爻位`）。

### 第 2 步：判定模式

先 `Grep` 目标概念相关关键词，判断三条走向：

1. **图模式（默认）**：确定至少一个可嵌入环组件 → 走 6 + 8 全段。
2. **对照图模式**：若概念本身描述时间维度差异（如岁差、置闰实例）→ 生成两枚 `<CompassFigure>`，其中一枚带 `time="..."` 锁定历史时刻。参考 [precession.md](docs/concepts/precession.md)。
3. **TODO 模式**：无法确定可嵌入环组件 / 用户明确说"暂无组件" → 省略段 6，在段 5 位置改写为「⏳ 该概念对应的活罗盘组件尚未上线」的一行说明，index.md 用 `concept-todo` 占位。

### 第 3 步：确认罗盘联动

按上文「联动罗盘映射表」判定段 8 是否需要。若命中，用对应 `/compass/*` 生成 tip；若不命中，仅保留段 7 的相对链接。

### 第 4 步：写「参见」相对链接

段 7 的 `参见 [标题](./slug)` 必须指向已存在的 slug。执行前用 `Glob docs/concepts/*.md` 列出所有 slug，从中挑选真正相关的 2~4 条。**链接文字用目标页 frontmatter 的 title**（可取主名简称，与侧栏一致），破折号 `——` 后写一句关联意义（不要写空的 `参见 [xxx](./xxx)`）。

⚠️ **严格禁止 `[[wikilink]]`**——VitePress 原生不解析该语法。所有跨页引用一律用相对链接 `[显示文字](./目标-slug)`（省略 `.md` 后缀，VitePress 会自动补齐）。

### 第 5 步：生成 md

按下面「模板骨架」填空，一次性 Write 到 `docs/concepts/<slug>.md`。

### 第 6 步：追加 index.md

Read [docs/concepts/index.md](docs/concepts/index.md) → 在对应分类的最后一项（TODO 占位行之前）Edit 追加新行 → 若替换的是原有 TODO 占位，直接改写那一行。

### 第 7 步：合规校验

生成后逐项检查（若有偏差则回过头修正）：

- [ ] frontmatter 只有 `title` 字段，无多余键
- [ ] title 与 H1 完全一致
- [ ] 首段有定义 + 加粗关键词
- [ ] `<CompassFigure>` 有 `caption`，环组件全部来自「可嵌入清单」
- [ ] 半径链条正确（外环 radius = 内环 inner-radius 或有留白）
- [ ] `参见 [标题](./slug)` 的 slug 全部真实存在，且**不使用 `[[wikilink]]` 语法**
- [ ] 是否需要 tip 与「联动罗盘映射表」一致
- [ ] index.md 已追加/替换对应行
- [ ] 文件名 kebab-case、无空格无中文

## 🔹 模板骨架

### 标准模板（含活图 + tip）

```md
---
title: {{title}}
---

# {{title}}

{{一段话定义，**关键术语**加粗，突出该概念的字符集/范畴/来源}}。

- **{{子项 1}}**：{{解释}}；
- **{{子项 2}}**：{{解释}}；
- **{{子项 3}}**：{{解释}}。

{{引出插图的过渡句}}：

<CompassFigure caption="{{插图标题 · 一句概括}}">
  <{{RingComponent}} :radius="{{240}}" :inner-radius="{{200}}" />
</CompassFigure>

- 参见 [{{related-title-1}}](./{{related-slug-1}})——{{关联意义}}；
- 参见 [{{related-title-2}}](./{{related-slug-2}})——{{关联意义}}。

::: tip 联动罗盘
{{补充说明}}，完整交互版见 [{{罗盘全称}}](/compass/{{compass-slug}})。
:::
```

### 对照图模板（时间维度差异，如岁差）

```md
---
title: {{title}}
---

# {{title}}

{{定义段}}

{{过渡句，说明将并置两张图}}：

<CompassFigure caption="{{历史时刻 · 说明}}" time="{{ISO}}">
  <DegreeScale :radius="270" :inner-radius="245" :scale-interval="5" :label-interval="30" />
  <{{RingComponent}} :radius="240" :inner-radius="200" :time="new Date('{{ISO}}')" />
</CompassFigure>

<CompassFigure caption="当代 · {{说明}}">
  <DegreeScale :radius="270" :inner-radius="245" :scale-interval="5" :label-interval="30" />
  <{{RingComponent}} :radius="240" :inner-radius="200" />
</CompassFigure>

{{一段话解读差异}}

- 参见 [{{related-title-1}}](./{{related-slug-1}})——{{关联意义}}；
- 参见 [{{related-title-2}}](./{{related-slug-2}})——{{关联意义}}。
```

### 多环叠合模板（配伍关系，如八宫 + 世应）

```md
---
title: {{title}}
---

# {{title}}

{{定义段}}

- **{{要点 1}}**；
- **{{要点 2}}**；
- **{{要点 3}}**。

{{过渡句}}：

<CompassFigure caption="{{说明 · 两层叠合}}">
  <{{OuterRing}} :radius="240" :inner-radius="195" />
  <{{InnerRing}} :radius="195" :inner-radius="160" />
</CompassFigure>

- 参见 [{{related-title-1}}](./{{related-slug-1}})——{{关联意义}}；
- 参见 [{{related-title-2}}](./{{related-slug-2}})——{{关联意义}}。

::: tip 联动罗盘
{{补充}} 见 [{{罗盘全称}}](/compass/{{compass-slug}})。
:::
```

### TODO 模板（无可嵌图）

```md
---
title: {{title}}
---

# {{title}}

{{定义段}}

- **{{子项 1}}**：{{解释}}；
- **{{子项 2}}**：{{解释}}。

::: warning 待录入组件
本概念对应的活罗盘组件尚未上线，插图暂缺。可参考相关概念的活图理解。
:::

- 参见 [{{related-title-1}}](./{{related-slug-1}})——{{关联意义}}；
- 参见 [{{related-title-2}}](./{{related-slug-2}})——{{关联意义}}。
```

## 🔹 index.md 追加规范（细节）

Read [docs/concepts/index.md](docs/concepts/index.md) 后判断插入位置：

1. **若同分类下已有相同主题的 TODO 占位**（如 `三垣 · 紫微太微天市 <span class="concept-todo">⏳ 待录入组件</span>`）→ 用 `Edit` 直接替换那一行为正式链接。
2. **若为全新条目** → 在分类块的**最后一个真链接**之后（TODO 占位之前）插入新行；保持每个分类内"已上线在前、TODO 在后"的顺序。
3. **一句钩子**要简短（10~20 字），说明该概念的独到之处或子结构关键词。

## 🔹 反面样式（不要生成）

- ❌ frontmatter 含 `layout`、`sidebar`、`aside` 等其它字段（那是罗盘页 `docs/compass/*.md` 的做法）
- ❌ 使用 H2 (`##`) 分割正文（现有 12 页几乎不用 H2，只用列表 / 表格 / 引用块组织）
- ❌ 在概念页里内嵌整个 `<XxxView />`（View 只属于 `docs/compass/*.md`）
- ❌ `<CompassFigure>` 不带 `caption`
- ❌ **使用 `[[wikilink]]` 语法**（Obsidian 风格，VitePress 不解析，会渲染成纯文本；一律用 `[标题](./slug)`）
- ❌ `参见 [xxx](./xxx)` 中 slug 指向不存在的页面
- ❌ `- [名](/concepts/slug)` 中链接不带前导 `/`（VitePress base 会失效）
- ❌ 直接写英文标题（title 一律中文，副名用 `·` 分隔）

## 🔹 参考页示例

- **单环 · 标准**：[constellations.md](docs/concepts/constellations.md)
- **多环叠合**：[ganzhi.md](docs/concepts/ganzhi.md)（3 层）、[eight-palace.md](docs/concepts/eight-palace.md)（2 层）
- **对照图 · 时间差**：[precession.md](docs/concepts/precession.md)
- **强调口诀 · 引用块**：[solar-terms.md](docs/concepts/solar-terms.md)、[leap-month.md](docs/concepts/leap-month.md)
- **表格配伍**：[najia.md](docs/concepts/najia.md)
- **无 tip 版**：[shichen.md](docs/concepts/shichen.md)、[si-xiang.md](docs/concepts/si-xiang.md)、[najia.md](docs/concepts/najia.md)、[shi-ying.md](docs/concepts/shi-ying.md)
