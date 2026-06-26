---
name: generate-ring
description: 按照罗盘平台统一时间驱动架构规范，智能生成新环组件（段环/点环/体环/静态环），包含架构分析、代码模板化生成、25项架构合规检查
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# 新环生成器 (generate-ring)

按照罗盘平台统一时间驱动架构规范，生成符合架构理念的新环组件。

## 🔹 使用场景
当用户需要：
- 创建新的罗盘环组件
- 添加新的二十八宿相关环
- 添加二十四节气相关环
- 添加干支/五行/纳音相关环
- 添加其他时间驱动的可视化环

## 🔹 环类型判定矩阵

| 特征 | 段环 (Segment) | 点环 (Point) | 体环 (Body) | 静态环 (Static) |
|-----|---------------|-------------|------------|-----------------|
| 数据形式 | 角度范围 `[start, end]` | 精确角度 `angle` | 动态天体标记 | 固定角度数据 |
| 渲染器 | DataRing → CircleRing | DataPointRing → PointRing | BodyMarker | DataRing 直连 |
| 典型用例 | 十二地支、六十甲子、二十八宿 | 二十四节气、星点标记 | 七曜、行星、恒星 | 五行纳音、八门、长生 |
| 时间依赖 | ✅ 动态计算 | ✅ 动态计算 | ✅ 实时位置 | ❌ 固定不变 |

## 🔹 代码模板规范

### 模板一：段环 · 时间驱动版

```typescript
<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import DataRing from '@/components/rings/DataRing.vue'
import { 计算函数名 } from '@/utils/你的工具文件'

/**
 * {{环名称}}组件（段环 · 时间驱动）
 *
 * ⚠️ 时间驱动架构：接受 time ref，内部统一使用 unref()
 *
 * {{环功能说明}}
 *
 * 坐标系对齐：赤经 ra → DataRing 顺时针角度 = 360° - ra
 */
interface Props {
  /** 时间源（支持 ref 或 plain value） */
  time?: MaybeRef<Date>
  /** 环外半径 */
  radius?: number
  /** 环内半径 */
  innerRadius?: number
  /** 起始度数偏移（RingStack 注入可覆盖） */
  startDegree?: number
  /** 旋转方向（RingStack 注入） */
  rotationDirection?: 'clockwise' | 'counterclockwise'
  // 业务属性
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200,
  innerRadius: 180,
  startDegree: 0,
  rotationDirection: 'clockwise'
  // 默认值
})

/** ⚠️ 时间驱动统一范式：确保 time 始终是响应式的 */
const timeRef = computed(() => unref(props.time) ?? new Date())

/** 角度归一化到 [0, 360) */
const norm = (a: number) => ((a % 360) + 360) % 360

/**
 * 环数据计算
 * 所有动态属性均派生自 timeRef.value
 */
const ringData = computed(() => {
  const time = timeRef.value
  // 你的计算逻辑

  return {
    startDegree: 0,
    circleColor: '#555555',
    circleWidth: 1,
    fontSize: 12,
    items: [
      // { label, color, startAngle, endAngle, highlightLevel }
    ]
  }
})
</script>

<template>
  <DataRing
    :data="ringData"
    :radius="radius"
    :inner-radius="innerRadius"
    :start-degree="startDegree"
    :rotation-direction="rotationDirection"
  />
</template>
```

### 模板二：点环 · 时间驱动版

```typescript
<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import DataPointRing from '@/components/rings/DataPointRing.vue'
import { 计算函数名 } from '@/utils/你的工具文件'

/**
 * {{环名称}}组件（点环 · 时间驱动）
 *
 * ⚠️ 时间驱动架构：接受 time ref，内部统一使用 unref()
 *
 * {{环功能说明}}
 *
 * 点符号类型：circle 圆点 / diamond 钻石 / tick 刻度线
 */
interface Props {
  /** 时间源（支持 ref 或 plain value） */
  time?: MaybeRef<Date>
  /** 环外半径 */
  radius?: number
  /** 环内半径 */
  innerRadius?: number
  /** 起始度数偏移 */
  startDegree?: number
  /** 旋转方向（RingStack 注入） */
  rotationDirection?: 'clockwise' | 'counterclockwise'
  // 业务属性
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200,
  innerRadius: 180,
  startDegree: 0,
  rotationDirection: 'clockwise'
  // 默认值
})

/** ⚠️ 时间驱动统一范式：确保 time 始终是响应式的 */
const timeRef = computed(() => unref(props.time) ?? new Date())

/** 角度归一化到 [0, 360) */
const norm = (a: number) => ((a % 360) + 360) % 360

/**
 * 环数据计算
 */
const ringData = computed(() => {
  const time = timeRef.value
  // 你的计算逻辑

  return {
    pointSymbol: 'tick' as const, // circle / diamond / tick
    labelOffset: -15,             // 标签偏移（负向内，正向外）
    pointSize: 8,
    pointColor: '#88ccff',
    items: [
      // { label, angle, color, pointColor, pointSize, highlightLevel }
    ]
  }
})
</script>

<template>
  <DataPointRing
    :data="ringData"
    :radius="radius"
    :inner-radius="innerRadius"
    :start-degree="startDegree"
    :rotation-direction="rotationDirection"
  />
</template>
```

### 模板三：体环 · 天体标记版

```typescript
<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import { polarToCartesian, radialTextRotation } from '@/utils/geometry'
import { useSevenLuminaries } from '@/composables/useSevenLuminaries'
import type { LuminaryKey } from '@/data/rings/types'

/**
 * {{环名称}}组件（体环 · 天体标记）
 *
 * ⚠️ 时间驱动架构：接受 time ref，内部统一使用 unref()
 *
 * {{环功能说明}}
 *
 * 可直接放入 RingStack，与其他环配对使用。
 */
interface Props {
  /** 时间源（支持 ref 或 plain value） */
  time?: MaybeRef<Date>
  /** 环外半径（体标记半径） */
  radius?: number
  /** 环内半径（刻度线起点） */
  innerRadius?: number
  /** 旋转方向 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
  /** 仅显示指定天体（默认全部显示） */
  only?: LuminaryKey[]
  // 业务属性
}

const props = withDefaults(defineProps<Props>(), {
  radius: 230,
  innerRadius: 200,
  rotationDirection: 'clockwise'
  // 默认值
})

/** ⚠️ 时间驱动统一范式：确保 time 始终是响应式的 */
const timeRef = computed(() => unref(props.time) ?? new Date())

/** 调用统一的七曜计算 composable（如非七曜则替换为你的计算） */
const { all, raToScreenAngle } = useSevenLuminaries(timeRef)

/**
 * 体标记列表（随时间自动更新）
 * 每个标记包含：位置、角度、颜色、符号
 */
const markers = computed(() => {
  return unref(all).map((luminary) => {
    const angle = raToScreenAngle(luminary.equatorial.ra)
    const pos = polarToCartesian(angle, props.radius, props.rotationDirection)

    return {
      key: luminary.key,
      symbol: luminary.symbol,
      color: luminary.color,
      angle,
      pos,
      textRotation: radialTextRotation(angle, props.rotationDirection)
      // 你的额外属性
    }
  })
})
</script>

<template>
  <g class="{{你的环-class-name}}">
    <!-- 你的渲染逻辑：径向线、符号、数值标签等 -->
    <g v-for="m in markers" :key="m.key">
      <!-- <line ... /> -->
      <!-- <text ... /> -->
    </g>
  </g>
</template>

<style scoped>
/* 你的局部样式 */
</style>
```

### 模板四：静态数据环

```typescript
// src/data/rings/{{你的环数据文件名}}.ts
import type { RingData } from './types'

/**
 * {{环名称}}静态数据定义
 *
 * {{环功能说明}}
 *
 * 注意：此为数据驱动环，角度固定，不随时间变化。
 * 如需动态高亮，请在父组件或专用 Ring 组件中注入。
 */
export const {{你的环常量名}}: RingData = {
  radius: 200,
  innerRadius: 180,
  circleColor: '#555555',
  circleWidth: 1,
  fontSize: 12,
  items: [
    // { label, color, startAngle, endAngle }
    // 你的项目列表
  ]
}
```

## 🔹 架构合规检查清单（25 项）

| # | 检查项 | 段环 | 点环 | 体环 | 静态环 |
|---|-------|-----|-----|------|-------|
| 1 | 组件命名以 `Ring` 结尾 | ✅ 必选 | ✅ 必选 | ✅ 必选 | ✅ 必选 |
| 2 | 必须有中文 JSDoc 说明用途 | ✅ 必选 | ✅ 必选 | ✅ 必选 | ✅ 必选 |
| 3 | Props 声明完整 radius/innerRadius/rotationDirection | ✅ 必选 | ✅ 必选 | ✅ 必选 | ➖ N/A |
| 4 | 时间驱动必须声明 `time?: MaybeRef<Date>` | ✅ 必选 | ✅ 必选 | ✅ 必选 | ❌ 禁止 |
| 5 | 必须有 `timeRef = computed(() => unref(props.time) ?? new Date())` | ✅ 必选 | ✅ 必选 | ✅ 必选 | ❌ 禁止 |
| 6 | 所有业务计算均在内部 computed 中完成 | ✅ 必选 | ✅ 必选 | ✅ 必选 | ❌ 禁止 |
| 7 | 不使用 `props.time?.value` 直接解包 | ✅ 必选 | ✅ 必选 | ✅ 必选 | ➖ N/A |
| 8 | 不向父组件 emit 任何数据（单向数据流） | ✅ 必选 | ✅ 必选 | ✅ 必选 | ➖ N/A |
| 9 | 不使用全局状态（唯一真理源原则） | ✅ 必选 | ✅ 必选 | ✅ 必选 | ✅ 必选 |
| 10 | 纯函数逻辑优先抽取到 utils/ 层 | ✅ 必选 | ✅ 必选 | ✅ 必选 | ✅ 必选 |
| 11 | 所有 computed 均派生自 timeRef | ✅ 必选 | ✅ 必选 | ✅ 必选 | ➖ N/A |
| 12 | 不使用 watch 监听 time（直接用 computed 派生） | ✅ 必选 | ✅ 必选 | ✅ 必选 | ➖ N/A |
| 13 | 必须支持 rotationDirection 属性并透传给渲染器 | ✅ 必选 | ✅ 必选 | ✅ 必选 | ➖ N/A |
| 14 | TypeScript 严格模式下无类型错误 | ✅ 必选 | ✅ 必选 | ✅ 必选 | ✅ 必选 |
| 15 | 不使用 any 类型（必要时用 unknown + 类型守卫） | ✅ 必选 | ✅ 必选 | ✅ 必选 | ✅ 必选 |
| 16 | 高亮逻辑必须使用 highlightLevel 三级体系 | ✅ 必选 | ✅ 必选 | ➖ 可选 | ➖ 可选 |
| 17 | 颜色体系必须与全盘五行配色保持一致 | ✅ 必选 | ✅ 必选 | ✅ 必选 | ✅ 必选 |
| 18 | 角度计算必须使用 utils/geometry 的统一函数 | ✅ 必选 | ✅ 必选 | ✅ 必选 | ✅ 必选 |
| 19 | 天星版赤经约定：`angle = 360 - ra` | ✅ 必选 | ✅ 必选 | ✅ 必选 | ➖ N/A |
| 20 | 段环必须使用 DataRing 渲染器 | ✅ 必选 | ❌ 禁止 | ❌ 禁止 | ✅ 必选 |
| 21 | 点环必须使用 DataPointRing 渲染器 | ❌ 禁止 | ✅ 必选 | ❌ 禁止 | ❌ 禁止 |
| 22 | 点环必须明确指定 pointSymbol 类型 | ❌ 禁止 | ✅ 必选 | ❌ 禁止 | ❌ 禁止 |
| 23 | 体环必须使用 polarToCartesian 坐标转换 | ➖ 可选 | ➖ 可选 | ✅ 必选 | ❌ 禁止 |
| 24 | 静态数据必须放在 src/data/rings/ 目录下 | ➖ 可选 | ➖ 可选 | ❌ 禁止 | ✅ 必选 |
| 25 | 静态数据必须导出 RingData / PointRingData 类型 | ❌ 禁止 | ❌ 禁止 | ❌ 禁止 | ✅ 必选 |

## 🔹 执行流程

每次调用将自动完成：

### 阶段 1：架构分析
1. 根据用户需求自动判定环类型（段环/点环/体环/静态环）
2. 判定驱动模式（时间驱动/数据驱动）
3. 规划依赖关系与推荐放置位置
4. 输出架构分析报告

### 阶段 2：代码生成
1. 根据类型自动选择对应模板
2. 自动注入依赖 import
3. 自动生成 JSDoc 注释
4. 填充基础业务逻辑骨架
5. 输出完整代码文件

### 阶段 3：合规检查
1. 执行 25 项架构规范逐项验证
2. 标记不符合项并给出修改建议
3. 输出合规检查报告

### 阶段 4：集成建议
1. RingStack 厚度推荐值
2. 外环/内环位置建议
3. 与现有环的视觉协调建议
4. 推荐放入哪个视图（AstronomyView / PlanetMansionView / LiushiJiaziView）

## 🔹 输出格式

```
📐 架构分析报告
├── 环类型：段环/点环/体环/静态环
├── 驱动模式：时间驱动/数据驱动
├── 推荐位置：xxxView.vue
└── 依赖关系：utils/xxx.ts

📝 代码生成
[完整组件代码]

✅ 合规检查报告
├── 通过：XX 项
├── 警告：XX 项
└── 未通过：XX 项 → 修改建议

💡 集成建议
├── RingStack 厚度：XX px
├── 推荐位置：外环/中环/内环
└── 视觉协调：与 XX 环相邻
```
