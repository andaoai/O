# Astronomy Engine 使用指南

[Astronomy Engine](https://github.com/cosinekitty/astronomy) 是一个高精度的天文计算 JavaScript 库，支持浏览器和 Node.js 环境。本文档记录**乙巳观**（道由天观）中它的使用方式。

## 📦 项目集成信息

### 当前版本
- **astronomy-engine**: `^2.1.19`（见 [package.json](https://github.com/andaoai/O/blob/main/package.json)）
- **集成状态**: ✅ 已深度集成到多环、多工具
- **覆盖范围**:
  - 圆心组件：[`centers/SolarEcliptic.vue`](https://github.com/andaoai/O/blob/main/src/components/centers/SolarEcliptic.vue)
  - 圆环组件：[`rings/SevenLuminariesRing.vue`](https://github.com/andaoai/O/blob/main/src/components/rings/SevenLuminariesRing.vue)、[`rings/SkyChart.vue`](https://github.com/andaoai/O/blob/main/src/components/rings/SkyChart.vue)、[`rings/MoonPhaseRing.vue`](https://github.com/andaoai/O/blob/main/src/components/rings/MoonPhaseRing.vue)
  - Composable：[`composables/useSevenLuminaries.ts`](https://github.com/andaoai/O/blob/main/src/composables/useSevenLuminaries.ts)
  - 工具层：[`utils/celestial.ts`](https://github.com/andaoai/O/blob/main/src/utils/celestial.ts)、[`utils/planetMansion.ts`](https://github.com/andaoai/O/blob/main/src/utils/planetMansion.ts)、[`utils/skyProjection.ts`](https://github.com/andaoai/O/blob/main/src/utils/skyProjection.ts)、[`utils/skyEvents.ts`](https://github.com/andaoai/O/blob/main/src/utils/skyEvents.ts)

## 🚀 项目中的实际应用

### SolarEcliptic 组件集成

本项目最早在 `centers/SolarEcliptic.vue` 组件中引入 astronomy-engine，用于精确的太阳位置计算：

```typescript
// src/components/centers/SolarEcliptic.vue 中的实际使用
import { AstroTime, SunPosition, MakeTime } from 'astronomy-engine'

/**
 * 使用 astronomy-engine 计算太阳的真实黄经位置
 */
const calculateSunPosition = (time: Date): SunPosition => {
  try {
    // 将 JavaScript Date 转换为 astronomy-engine 的 AstroTime
    const astroTime = MakeTime(time)

    // 使用 SunPosition 函数计算太阳的黄道坐标
    const sunEcliptic = SunPosition(astroTime)

    if (sunEcliptic) {
      // 获取黄经（度数）， astronomy-engine 已经返回度数
      const longitude = sunEcliptic.elon

      // 根据黄经确定太阳颜色（季节性变化）
      let color = '#ffdd00'
      if (longitude >= 80 && longitude < 100) {
        color = '#ff6666' // 夏至 - 偏红
      } else if (longitude >= 170 && longitude < 190) {
        color = '#ff8844' // 秋分 - 偏橙
      } else if (longitude >= 260 && longitude < 280) {
        color = '#6666ff' // 冬至 - 偏蓝
      } else if (longitude >= 350 || longitude < 10) {
        color = '#00ff88' // 春分 - 偏绿
      }

      return {
        longitude,
        symbol: '☉',
        color,
        size: 20
      }
    }
  } catch (error) {
    console.warn('计算太阳位置失败，使用简单计算:', error)
  }

  // 如果天文计算失败，使用简单计算作为后备
  const yearStart = new Date(time.getFullYear(), 0, 1)
  const dayOfYear = Math.floor((time.getTime() - yearStart.getTime()) / (24 * 60 * 60 * 1000))
  // 添加280度偏移以大致匹配春分点（3月21日左右在0度）
  const longitude = (dayOfYear * 360 / 365.25 + 280) % 360

  return {
    longitude,
    symbol: '☉',
    color: '#ffdd00',
    size: 20
  }
}
```

## 🎯 核心功能实现

### 1. 太阳黄经计算

项目中主要使用 `SunPosition` 函数计算太阳的黄道坐标：

```typescript
// 计算太阳的黄经位置
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

通过 Vue 的响应式系统实现实时更新：

```vue
<template>
  <SolarEcliptic
    :radius="160"
    :time="controlledTime"
    :enable-animation="true"
    :show-sun-label="true"
  />
</template>

<script setup>
import { ref } from 'vue'

// 响应式时间变量
const controlledTime = ref(new Date())

// 时间变化时自动重新计算太阳位置
watch(() => props.time, (newTime) => {
  if (newTime && !props.sunPosition) {
    cachedSunPosition.value = calculateSunPosition(newTime)
  }
}, { immediate: true })
</script>
```

## 🌍 项目特色功能

### 1. 季节性颜色变化

根据太阳黄经动态变化太阳颜色：

```typescript
// 根据黄经确定太阳颜色（季节性变化）
let color = '#ffdd00'
if (longitude >= 80 && longitude < 100) {
  color = '#ff6666' // 夏至 - 偏红
} else if (longitude >= 170 && longitude < 190) {
  color = '#ff8844' // 秋分 - 偏橙
} else if (longitude >= 260 && longitude < 280) {
  color = '#6666ff' // 冬至 - 偏蓝
} else if (longitude >= 350 || longitude < 10) {
  color = '#00ff88' // 春分 - 偏绿
}
```

### 2. 春分点标记

在黄道0度位置显示春分点标记：

```vue
<!-- 春分点标记（0度） -->
<g class="vernal-equinox">
  <line
    :x1="slotProps.centerX + radius * 0.9"
    :y1="slotProps.centerY"
    :x2="slotProps.centerX + radius * 1.1"
    :y2="slotProps.centerY"
    stroke="#00ff88"
    stroke-width="2"
    opacity="0.8"
  />
  <text
    :x="slotProps.centerX + radius * 1.25"
    :y="slotProps.centerY"
    fill="#00ff88"
    font-size="12"
    text-anchor="start"
    dominant-baseline="middle"
  >
    春分
  </text>
</g>
```

### 3. 坐标系统集成

与项目的极坐标系统完美集成：

```typescript
/**
 * 获取太阳在黄道上的坐标
 */
const getSunCoordinates = (longitude: number) => {
  const rad = longitude * Math.PI / 180
  return {
    x: Math.cos(rad) * props.radius,
    y: Math.sin(rad) * props.radius
  }
}
```

## 🎮 与控制面板的集成

SolarEcliptic 组件与 Control 组件无缝集成：

```vue
<!-- App.vue 中的使用 -->
<template>
  <SolarEcliptic
    :radius="160"
    :time="controlledTime"
    :enable-animation="true"
    :animation-speed="0.1"
    :show-sun-label="true"
  />

  <Control
    v-model="controlledTime"
    @time-change="handleTimeChange"
  />
</template>
```

用户可以通过控制面板：
- 调整时间查看太阳位置变化
- 播放动画观察太阳运动
- 调整播放速度
- 使用键盘快捷键控制

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

### TypeScript 配置

项目使用 TypeScript，类型定义已自动包含：

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "types": ["node"]
  }
}
```

## 📚 扩展使用建议

### 1. 添加月球计算

可以扩展 SolarEcliptic 组件支持月球：

```typescript
import { MoonPosition } from 'astronomy-engine'

const calculateMoonPosition = (time: Date) => {
  const astroTime = MakeTime(time)
  const moonEcliptic = MoonPosition(astroTime)

  return {
    longitude: moonEcliptic.elon,
    latitude: moonEcliptic.elat,
    distance: moonEcliptic.dist
  }
}
```

### 2. 行星位置计算

添加其他行星的位置计算：

```typescript
import { Mercury, Venus, Mars, Jupiter, Saturn } from 'astronomy-engine'

const calculatePlanetPosition = (planet: Body, time: Date) => {
  const astroTime = MakeTime(time)
  const planetEcliptic = PlanetPosition(planet, astroTime)

  return {
    longitude: planetEcliptic.elon,
    latitude: planetEcliptic.elat,
    distance: planetEcliptic.dist
  }
}
```

### 3. 日月食计算

添加日月食预测功能：

```typescript
import { SearchLunarEclipse, SearchSolarEclipse } from 'astronomy-engine'

const findNextEclipse = (startDate: Date) => {
  const startTime = MakeTime(startDate)

  // 查找下一次月食
  const lunarEclipse = SearchLunarEclipse(startTime)

  // 查找下一次日食
  const solarEclipse = SearchSolarEclipse(startTime)

  return { lunarEclipse, solarEclipse }
}
```

## 🐛 错误处理和后备方案

项目实现了完善的错误处理机制：

```typescript
const calculateSunPosition = (time: Date): SunPosition => {
  try {
    // 尝试使用 astronomy-engine 精确计算
    const astroTime = MakeTime(time)
    const sunEcliptic = SunPosition(astroTime)
    // ... 精确计算逻辑
  } catch (error) {
    console.warn('计算太阳位置失败，使用简单计算:', error)

    // 使用简单的近似计算作为后备
    const yearStart = new Date(time.getFullYear(), 0, 1)
    const dayOfYear = Math.floor((time.getTime() - yearStart.getTime()) / (24 * 60 * 60 * 1000))
    const longitude = (dayOfYear * 360 / 365.25 + 280) % 360

    return {
      longitude,
      symbol: '☉',
      color: '#ffdd00',
      size: 20
    }
  }
}
```

## 📈 性能优化

### 1. 计算结果缓存

```typescript
// 缓存太阳位置计算结果
const cachedSunPosition = ref<SunPosition>({
  longitude: 0,
  symbol: '☉',
  color: '#ffdd00',
  size: 20
})

// 只在时间变化时重新计算
watch(() => props.time, (newTime) => {
  if (newTime && !props.sunPosition) {
    cachedSunPosition.value = calculateSunPosition(newTime)
  }
}, { immediate: true })
```

### 2. 防抖处理

```typescript
// 对于频繁的时间变化，可以使用防抖
import { debounce } from 'lodash-es'

const debouncedCalculateSunPosition = debounce(calculateSunPosition, 100)
```

## 🔗 相关组件与工具

**圆环 / 圆心**
- [`centers/SolarEcliptic.vue`](https://github.com/andaoai/O/blob/main/src/components/centers/SolarEcliptic.vue)：太阳黄道位置
- [`rings/SevenLuminariesRing.vue`](https://github.com/andaoai/O/blob/main/src/components/rings/SevenLuminariesRing.vue)：七曜赤经定位
- [`rings/SkyChart.vue`](https://github.com/andaoai/O/blob/main/src/components/rings/SkyChart.vue)：全天投影图
- [`rings/MoonPhaseRing.vue`](https://github.com/andaoai/O/blob/main/src/components/rings/MoonPhaseRing.vue)：当日月相

**基础与控制**
- `PolarCanvas`：提供极坐标系统基础
- `Control`：时间控制和动画播放
- `DegreeScale`：显示度数刻度
- `tyme4ts`：中华传统历法计算（与 astronomy-engine 配合）

**Composable / 工具**
- [`composables/useSevenLuminaries.ts`](https://github.com/andaoai/O/blob/main/src/composables/useSevenLuminaries.ts)：七曜统一计算
- [`utils/celestial.ts`](https://github.com/andaoai/O/blob/main/src/utils/celestial.ts)：黄经/赤经坐标转换
- [`utils/planetMansion.ts`](https://github.com/andaoai/O/blob/main/src/utils/planetMansion.ts)：七曜入宿判定
- [`utils/skyProjection.ts`](https://github.com/andaoai/O/blob/main/src/utils/skyProjection.ts)：赤道/黄道/白道投影
- [`utils/skyEvents.ts`](https://github.com/andaoai/O/blob/main/src/utils/skyEvents.ts)：合冲聚事件分级

## 📖 更多资源

- [官方文档](https://github.com/cosinekitty/astronomy)
- [API 参考](https://astronomy.io/api/)
- [在线演示](https://astronomy.io/demo/)
- [Astronomy Engine vs 其他天文库](https://astronomy.io/compare/)

## 🎯 最佳实践

1. **始终使用 try-catch** - 天文计算可能因为时间范围或其他原因失败
2. **提供后备方案** - 当精确计算失败时，使用近似计算
3. **缓存计算结果** - 避免重复计算相同时间的位置
4. **使用 TypeScript** - 获得完整的类型支持和智能提示
5. **结合动画系统** - 利用项目的动画框架展示天体运动

这个库在**乙巳观**中发挥了重要作用，为中华天文圆环、七曜入宿天象盘、回归年闰月盘等罗盘提供了精确的天文计算基础。