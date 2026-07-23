# Astronomy Engine 使用指南

[Astronomy Engine](https://github.com/cosinekitty/astronomy) 是一个高精度的天文计算 JavaScript 库，支持浏览器和 Node.js 环境。本文档记录**乙巳观**（道由天观）中它的使用方式。

## 📦 项目集成信息

### 当前版本
- **astronomy-engine**: `^2.1.19`（见 [package.json](https://github.com/andaoai/O/blob/main/package.json)）
- **集成状态**: ✅ 已深度集成到多环、多工具
- **覆盖范围**:
  - 圆心组件：[`centers/BeidouCenter.vue`](https://github.com/andaoai/O/blob/main/src/components/centers/BeidouCenter.vue)、[`centers/SuzhouSkyMap.vue`](https://github.com/andaoai/O/blob/main/src/components/centers/SuzhouSkyMap.vue)、[`centers/HelioOrbits.vue`](https://github.com/andaoai/O/blob/main/src/components/centers/HelioOrbits.vue)
  - 圆环组件：[`rings/SevenLuminariesRing.vue`](https://github.com/andaoai/O/blob/main/src/components/rings/SevenLuminariesRing.vue)、[`rings/planet-mansion/SkyChart.vue`](https://github.com/andaoai/O/blob/main/src/components/rings/planet-mansion/SkyChart.vue)、[`rings/tropical-year/MoonPhaseRing.vue`](https://github.com/andaoai/O/blob/main/src/components/rings/tropical-year/MoonPhaseRing.vue)、[`rings/guan-dou/SunDiurnalRing.vue`](https://github.com/andaoai/O/blob/main/src/components/rings/guan-dou/SunDiurnalRing.vue)、[`rings/guan-dou/MonthEstablishRing.vue`](https://github.com/andaoai/O/blob/main/src/components/rings/guan-dou/MonthEstablishRing.vue)、[`rings/guan-dou/MonthGeneralRing.vue`](https://github.com/andaoai/O/blob/main/src/components/rings/guan-dou/MonthGeneralRing.vue)、[`rings/guan-dou/SolarTermsRing.vue`](https://github.com/andaoai/O/blob/main/src/components/rings/guan-dou/SolarTermsRing.vue)
  - Composable：[`composables/useSevenLuminaries.ts`](https://github.com/andaoai/O/blob/main/src/composables/useSevenLuminaries.ts)
  - 工具层：[`utils/celestial.ts`](https://github.com/andaoai/O/blob/main/src/utils/celestial.ts)、[`utils/planetMansion.ts`](https://github.com/andaoai/O/blob/main/src/utils/planetMansion.ts)、[`utils/skyProjection.ts`](https://github.com/andaoai/O/blob/main/src/utils/skyProjection.ts)、[`utils/skyEvents.ts`](https://github.com/andaoai/O/blob/main/src/utils/skyEvents.ts)、[`utils/beidou.ts`](https://github.com/andaoai/O/blob/main/src/utils/beidou.ts)、[`utils/ziwei.ts`](https://github.com/andaoai/O/blob/main/src/utils/ziwei.ts)、[`utils/jianJiang.ts`](https://github.com/andaoai/O/blob/main/src/utils/jianJiang.ts)

## 🚀 项目中的实际应用

### utils/celestial.ts 天体坐标层

项目中所有天体位置计算集中在 `utils/celestial.ts`，astronomy-engine 在此完成从 JavaScript `Date` 到黄经/赤经/距离的精确换算：

```typescript
// src/utils/celestial.ts 中的典型使用
import { AstroTime, SunPosition, MakeTime } from 'astronomy-engine'

/**
 * 太阳真实黄经（度）
 * 春分点 0°、夏至 90°、秋分 180°、冬至 270°
 */
export const sunLongitude = (time: Date): number => {
  try {
    const astroTime = MakeTime(time)
    const sunEcliptic = SunPosition(astroTime)
    return sunEcliptic.elon
  } catch (error) {
    console.warn('计算太阳位置失败，回退到简单公式:', error)
    // 简单近似（每日 ~0.9856°，冬至偏移 ~280°）
    const yearStart = new Date(time.getFullYear(), 0, 1)
    const dayOfYear = Math.floor((time.getTime() - yearStart.getTime()) / 86_400_000)
    return (dayOfYear * 360 / 365.25 + 280) % 360
  }
}
```

上层组件（如 `SevenLuminariesRing`、`MoonPhaseRing`、`BeidouCenter`）只调用 `utils/celestial.ts` 与 `utils/planetMansion.ts` 暴露的纯函数，不直接接触 astronomy-engine，从而保证时间驱动的响应式链完整、组件层保持纯渲染。

## 🎯 核心功能实现

### 1. 太阳黄经计算

项目主要使用 `SunPosition` 函数计算太阳的黄道坐标：

```typescript
const sunEcliptic = SunPosition(astroTime)
const longitude = sunEcliptic.elon  // 黄经，单位：度数
```

**特点：**
- 返回度数而非弧度，便于直接使用
- 高精度计算，误差极小
- 自动处理时间转换

### 2. 时间处理

使用 `MakeTime` 函数将 JavaScript Date 转换为天文时间：

```typescript
// 转换JavaScript Date为Astronomy Time
const astroTime = MakeTime(new Date())

// 或者使用AstroTime构造函数
const astroTime2 = new AstroTime(new Date())
```

### 3. 实时更新机制

Vue 响应式 + `time` prop 的组合是全项目统一范式。举例——七曜环：

```vue
<template>
  <SevenLuminariesRing
    :radius="380"
    :inner-radius="340"
    :time="controlledTime"
  />
</template>

<script setup>
import { ref, computed, unref } from 'vue'

// 响应式时间变量
const controlledTime = ref(new Date())

// SevenLuminariesRing 内部：所有位置派生自 timeRef computed
// const timeRef = computed(() => unref(props.time) ?? new Date())
// const positions = computed(() => planetPositions(timeRef.value))
</script>
```

## 🌍 项目特色功能

### 1. 七曜入宿实时计算

`utils/planetMansion.ts` 把太阳、月亮、水金火木土五星的赤经映射到二十八宿区间，配合 `useSevenLuminaries` composable 在 `SevenLuminariesRing`、`SkyChart` 中实时点亮当日入宿。

### 2. 岁差修正的北斗指向

`utils/beidou.ts` 用 astronomy-engine 计算北斗七星在指定时刻的真实赤经赤纬（含 J2000 岁差修正），`BeidouCenter` 与 `SuzhouSkyMap` 都从这里取数，让斗柄随本地恒星时旋转，正确指向所值宿。

### 3. 月相几何绘制

`utils/moonPhase.ts` 把 astronomy-engine 计算的月相角转成 SVG 弧段参数，`MoonPhaseRing` 直接消费——当日月相形状、明暗方向都由时间派生。

### 4. 与极坐标系统的集成

所有位置都用统一的极坐标工具 `utils/geometry.ts` → `polarToCartesian` 转换，避免各组件重复写三角函数：

```typescript
import { polarToCartesian } from '@/utils/geometry'

// 把赤经 ra 映射为盘面角度（天星版约定：angle = 360 - ra）
const { x, y } = polarToCartesian(radius, 360 - ra)
```

## 🎮 与 Sidebar 面板的集成

天体环通过 `time` prop 与视图内的 `controlledTime` 挂钩，Sidebar 面板通过 `useCompassContext` 统一读写这份时间：

```vue
<!-- View 侧 -->
<script setup lang="ts">
import { useUrlTime } from '@/composables/useUrlTime'
import { useViewport } from '@/composables/useViewport'
import { provideCompassContext } from '@/composables/useCompassContext'
import SevenLuminariesRing from '@/components/rings/SevenLuminariesRing.vue'

const { controlledTime, clearUrlTime } = useUrlTime()
const viewport = useViewport()

provideCompassContext({
  time: controlledTime,
  viewport,
  onUserTimeChange: () => clearUrlTime()
})
</script>

<template>
  <SevenLuminariesRing
    :radius="380"
    :inner-radius="340"
    :time="controlledTime"
  />
</template>
```

Sidebar（`CompassSidebar.vue`，由 `CompassLayout` 单点挂载）内部通过 `useCompassContext()` 读取当前 View 的 time / viewport，用户可以：
- 调整时间查看天体位置变化（TimePanel）
- 播放动画观察天体运动（`useTimeController` + Space 快捷键）
- 调整播放速度
- 使用键盘快捷键控制（`useTimeShortcuts` / `useViewportShortcuts`）

## 🔧 安装和配置

### 当前项目配置

项目已正确配置 astronomy-engine：

```json
// package.json
{
  "dependencies": {
    "astronomy-engine": "^2.1.19"
  }
}
```

### VitePress SSR 内联

astronomy-engine 是 CJS 模块，SSR 阶段需要交给 Vite 内联，避免 dev/build 边界问题：

```ts
// docs/.vitepress/config.ts
vite: {
  ssr: {
    noExternal: ['astronomy-engine', 'tyme4ts'],
  },
}
```

### TypeScript 配置

项目使用 TypeScript，类型定义已自动包含。

## 📚 扩展使用建议

### 1. 月球位置

```typescript
import { MoonPosition, MakeTime } from 'astronomy-engine'

export const moonPosition = (time: Date) => {
  const astroTime = MakeTime(time)
  const moon = MoonPosition(astroTime)
  return {
    longitude: moon.geo_eclip_lon,
    latitude: moon.geo_eclip_lat,
    distance: moon.distance_au
  }
}
```

### 2. 行星位置

```typescript
import { Body, GeoVector, Ecliptic } from 'astronomy-engine'

export const planetPosition = (planet: Body, time: Date) => {
  const vec = GeoVector(planet, time, true)
  const ecl = Ecliptic(vec)
  return {
    longitude: ecl.elon,
    latitude: ecl.elat,
    distance: Math.hypot(vec.x, vec.y, vec.z)
  }
}
```

### 3. 日月食预测

```typescript
import { SearchLunarEclipse, SearchGlobalSolarEclipse } from 'astronomy-engine'

export const findNextEclipse = (startDate: Date) => {
  return {
    lunar: SearchLunarEclipse(startDate),
    solar: SearchGlobalSolarEclipse(startDate)
  }
}
```

## 🐛 错误处理和后备方案

项目在 `utils/celestial.ts` 层统一处理 try-catch，业务组件不用重复：

```typescript
export const sunLongitude = (time: Date): number => {
  try {
    return SunPosition(MakeTime(time)).elon
  } catch (error) {
    console.warn('计算太阳位置失败，回退到简单公式:', error)
    // 使用简单近似作为后备
    const yearStart = new Date(time.getFullYear(), 0, 1)
    const dayOfYear = Math.floor((time.getTime() - yearStart.getTime()) / 86_400_000)
    return (dayOfYear * 360 / 365.25 + 280) % 360
  }
}
```

## 📈 性能优化

### 1. computed 派生代替 watch

组件内一律 `computed(() => transform(timeRef.value))`，依赖追踪自动化，无需手动 watch + 缓存变量：

```typescript
const timeRef = computed(() => unref(props.time) ?? new Date())
const sunLon = computed(() => sunLongitude(timeRef.value))
```

### 2. Composable 层聚合

`useSevenLuminaries.ts` 把太阳/月亮/五星一次算完，多个环共享同一个 computed 结果，避免同一时刻反复调用 astronomy-engine。

## 🔗 相关组件与工具

**圆环 / 圆心**
- [`centers/BeidouCenter.vue`](https://github.com/andaoai/O/blob/main/src/components/centers/BeidouCenter.vue)：北斗圆心（岁差修正）+ 紫微垣 + 地平圈
- [`centers/SuzhouSkyMap.vue`](https://github.com/andaoai/O/blob/main/src/components/centers/SuzhouSkyMap.vue)：苏州石刻天文图圆心
- [`centers/HelioOrbits.vue`](https://github.com/andaoai/O/blob/main/src/components/centers/HelioOrbits.vue)：日心行星轨道
- [`rings/SevenLuminariesRing.vue`](https://github.com/andaoai/O/blob/main/src/components/rings/SevenLuminariesRing.vue)：七曜赤经定位
- [`rings/SkyChart.vue`](https://github.com/andaoai/O/blob/main/src/components/rings/SkyChart.vue)：全天投影图
- [`rings/MoonPhaseRing.vue`](https://github.com/andaoai/O/blob/main/src/components/rings/MoonPhaseRing.vue)：当日月相
- [`rings/SunDiurnalRing.vue`](https://github.com/andaoai/O/blob/main/src/components/rings/SunDiurnalRing.vue)：日周白昼-曙暮-夜三层弧

**基础与控制**
- `PolarCanvas`：提供极坐标系统基础
- `CompassSidebar`：左侧嵌入式 Sidebar（时间/视口/View 专属工具位）
- `DegreeScale`：显示度数刻度
- `tyme4ts`：中华传统历法计算（与 astronomy-engine 配合）

**Composable / 工具**
- [`composables/useSevenLuminaries.ts`](https://github.com/andaoai/O/blob/main/src/composables/useSevenLuminaries.ts)：七曜统一计算
- [`composables/useTimeController.ts`](https://github.com/andaoai/O/blob/main/src/composables/useTimeController.ts)：受控时间控制（播放/步进/输入）
- [`composables/useCompassContext.ts`](https://github.com/andaoai/O/blob/main/src/composables/useCompassContext.ts)：View → Sidebar 跨层状态桥
- [`utils/celestial.ts`](https://github.com/andaoai/O/blob/main/src/utils/celestial.ts)：黄经/赤经坐标转换
- [`utils/planetMansion.ts`](https://github.com/andaoai/O/blob/main/src/utils/planetMansion.ts)：七曜入宿判定
- [`utils/skyProjection.ts`](https://github.com/andaoai/O/blob/main/src/utils/skyProjection.ts)：赤道/黄道/白道投影
- [`utils/skyEvents.ts`](https://github.com/andaoai/O/blob/main/src/utils/skyEvents.ts)：合冲聚事件分级
- [`utils/beidou.ts`](https://github.com/andaoai/O/blob/main/src/utils/beidou.ts)：北斗七星赤经赤纬（岁差修正）+ 斗柄指向
- [`utils/ziwei.ts`](https://github.com/andaoai/O/blob/main/src/utils/ziwei.ts)：紫微垣东西两藩恒星
- [`utils/jianJiang.ts`](https://github.com/andaoai/O/blob/main/src/utils/jianJiang.ts)：斗建 / 月将 / 太阳所在 宫位换算

## 📖 更多资源

- [官方文档](https://github.com/cosinekitty/astronomy)
- [API 参考](https://cosinekitty.github.io/astronomy/source/js/)

## 🎯 最佳实践

1. **在 utils 层集中调用 astronomy-engine** —— 组件层只消费纯函数结果
2. **一律 try-catch + 后备近似** —— 避免极端时间导致渲染中断
3. **computed 派生代替 watch** —— 依赖追踪自动化，保持响应式链完整
4. **通过 Composable 复用计算** —— 同一时刻多环共享一次天文计算
5. **结合 CompassSidebar** —— 让用户拖时间条即时看到天体变化

这个库在**乙巳观**中发挥了关键作用，为七曜入宿天象盘、回归年闰月盘、观斗盘、苏州石刻天文图等罗盘提供了精确的天文计算基础。
