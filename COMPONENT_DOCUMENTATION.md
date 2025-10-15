# 组件文档 - Component Documentation

本文档详细说明中华天文圆环项目中各个组件的功能、API和使用方法。

## 📚 目录

- [基础组件](#基础组件)
  - [PolarCanvas](#polarcanvas-极坐标画布组件)
  - [DegreeScale](#degreescale-通用度数刻度组件)
  - [SolarEcliptic](#solarecliptic-太阳黄道组件)
  - [Control](#control-统一控制面板)
- [传统组件](#传统组件)
- [架构设计](#架构设计)
- [开发指南](#开发指南)

## 基础组件

### PolarCanvas 极坐标画布组件

作为所有极坐标组件的基础画布，提供统一的坐标系统和动画支持。

#### 特性
- **标准极坐标系统** - 0度在正右方（3点钟方向），顺时针增加
- **统一动画管理** - 通过useAnimation composable实现
- **坐标转换工具** - 极坐标与笛卡尔坐标转换
- **角度计算函数** - 中点角度、角度跨度等
- **SVG路径生成** - 圆弧和扇形路径生成

#### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `width` | number | 800 | 画布宽度（像素） |
| `height` | number | 600 | 画布高度（像素） |
| `centerX` | number | 400 | 圆心X坐标（像素） |
| `centerY` | number | 300 | 圆心Y坐标（像素） |
| `rotation` | number | 0 | 手动旋转角度（度数） |
| `enableAnimation` | boolean | false | 是否启用自动旋转动画 |
| `animationSpeed` | number | 0.5 | 动画旋转速度（度/帧） |
| `maxRadius` | number | 280 | 最大半径限制（像素） |
| `minRadius` | number | 0 | 最小半径限制（像素） |

#### Slots

```vue
<PolarCanvas>
  <template #default="slotProps">
    <!-- slotProps 包含以下工具函数 -->
    <!-- slotProps.centerX, slotProps.centerY - 圆心坐标 -->
    <!-- slotProps.totalRotation - 总旋转角度 -->
    <!-- slotProps.polarToCartesian - 极坐标转换函数 -->
    <!-- slotProps.getMidAngle - 计算中点角度 -->
    <!-- slotProps.generateArcPath - 生成圆弧路径 -->
  </template>
</PolarCanvas>
```

#### 工具函数

**polarToCartesian(angle, radius, centerX?, centerY?)**
将极坐标转换为笛卡尔坐标。

```typescript
const point = polarToCartesian(45, 100) // 45度，半径100
// 返回: { x: 707.1, y: 707.1 }
```

**getMidAngle(startAngle, endAngle)**
计算两个角度之间的中点角度。

```typescript
const midAngle = getMidAngle(0, 90) // 返回: 45
```

**generateArcPath(centerX, centerY, radius, startAngle, endAngle, innerRadius?)**
生成SVG圆弧路径。

```typescript
const path = generateArcPath(0, 0, 100, 0, 90) // 生成90度扇形
```

#### 使用示例

```vue
<template>
  <PolarCanvas
    :enable-animation="true"
    :animation-speed="0.5"
    :rotation="45"
  >
    <template #default="slotProps">
      <!-- 绘制一个简单的扇形 -->
      <path
        :d="slotProps.generateArcPath(
          slotProps.centerX,
          slotProps.centerY,
          100,
          0,
          90
        )"
        fill="#ff0000"
        opacity="0.5"
      />

      <!-- 在45度位置绘制一个点 -->
      <circle
        :cx="slotProps.polarToCartesian(45, 100, slotProps.centerX, slotProps.centerY).x"
        :cy="slotProps.polarToCartesian(45, 100, slotProps.centerX, slotProps.centerY).y"
        r="5"
        fill="#ffffff"
      />
    </template>
  </PolarCanvas>
</template>
```

---

### DegreeScale 通用度数刻度组件

高度灵活的极坐标刻度环组件，支持任意度数间隔和丰富的自定义选项。

#### 特性
- **自定义刻度间隔** - 支持1-360度任意间隔
- **智能刻度生成** - 自动生成完整的刻度线网格
- **扇形区域可视化** - 每个刻度间隔的扇形背景
- **文字智能定位** - 文字始终指向圆心
- **动画支持** - 集成PolarCanvas的动画系统

#### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `radius` | number | - | 外半径（必填，像素） |
| `innerRadius` | number | 0 | 内半径（像素，>0时创建环形） |
| `scaleInterval` | number | 5 | 刻度间隔（度数，必须是360的约数） |
| `startDegree` | number | 0 | 起始度数偏移（0-360度） |
| `rotation` | number | 0 | 整体旋转角度（度数） |
| `enableAnimation` | boolean | false | 是否启用自动旋转动画 |
| `animationSpeed` | number | 0.5 | 动画旋转速度（度/帧） |
| `showLabels` | boolean | true | 是否显示度数标签文字 |
| `labelColor` | string | '#ffffff' | 标签文字颜色 |
| `labelPosition` | number | 0.5 | 文字位置半径比例（0-1） |
| `showCircle` | boolean | true | 是否显示圆环边线 |
| `circleWidth` | number | 1 | 圆环边线宽度（像素） |
| `circleColor` | string | '#ffffff' | 圆环边线颜色 |
| `showSectors` | boolean | true | 是否显示扇形区域 |
| `sectorColor` | string | '#ffffff' | 扇形区域的填充颜色 |
| `sectorOpacity` | number | 0.1 | 扇形区域透明度（0-1） |

#### 常用配置示例

**六十甲子体系：6度间隔**
```vue
<DegreeScale
  :radius="200"
  :inner-radius="180"
  :scale-interval="6"
  label-color="gold"
  sector-color="rgba(255,215,0,0.1)"
/>
```

**十二地支体系：12度间隔**
```vue
<DegreeScale
  :radius="200"
  :scale-interval="12"
  :show-sectors="true"
  sector-color="rgba(255,255,255,0.2)"
  label-color="#ffffff"
/>
```

**二十四节气体系：15度间隔**
```vue
<DegreeScale
  :radius="200"
  :scale-interval="15"
  :show-labels="true"
  :label-position="0.8"
  sector-color="rgba(0,255,0,0.1)"
/>
```

**精细刻度：3度间隔**
```vue
<DegreeScale
  :radius="200"
  :scale-interval="3"
  :show-labels="false"
  :show-sectors="true"
  sector-opacity="0.05"
/>
```

#### 常用刻度间隔参考

| 间隔度数 | 刻度数量 | 对应体系 | 用途 |
|---------|---------|---------|------|
| 180 | 2 | 阴阳 | 基础二元划分 |
| 120 | 3 | 三才 | 天地人三才 |
| 90 | 4 | 四象 | 四方神兽 |
| 60 | 6 | 六爻 | 六爻卦象 |
| 45 | 8 | 八卦 | 八个方位 |
| 36 | 10 | 十天干 | 天干基础 |
| 30 | 12 | 十二地支 | 地支、时辰 |
| 24 | 15 | 二十四节气 | 节气划分 |
| 15 | 24 | 二十四节气 | 节气精确划分 |
| 12 | 30 | 五行六候 | 详细节气 |
| 10 | 36 | 七十二候 | 物候变化 |
| 6 | 60 | 六十甲子 | 干支纪年 |
| 5 | 72 | 七十二候 | 物候详细 |
| 3 | 120 | 细分刻度 | 精确测量 |
| 1 | 360 | 精确刻度 | 最高精度 |

---

### SolarEcliptic 太阳黄道组件

基于astronomy-engine的精确太阳位置计算组件，显示太阳在黄道上的实时位置。

#### 特性
- **精确太阳位置** - 使用astronomy-engine计算黄经
- **实时更新** - 支持时间控制和动画
- **春分点标记** - 显示0度参考点
- **季节性颜色** - 根据黄经变化太阳颜色
- **春分夏至秋分冬至** - 重要节气点的视觉标识

#### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `radius` | number | 200 | 黄道半径（像素） |
| `sunPosition` | SunPosition | - | 自定义太阳位置（可选） |
| `time` | Date | new Date() | 观测时间（用于计算太阳位置） |
| `enableAnimation` | boolean | true | 是否启用动画 |
| `animationSpeed` | number | 0.5 | 动画速度 |
| `rotation` | number | 0 | 整体旋转角度 |
| `showSunLabel` | boolean | true | 是否显示太阳文字标签 |

#### SunPosition 接口

```typescript
interface SunPosition {
  longitude: number     // 当前黄经度数
  symbol?: string       // 太阳符号（默认'☉'）
  color?: string        // 太阳颜色（根据季节自动调整）
  size?: number         // 太阳大小（像素）
}
```

#### 季节性颜色系统

组件根据太阳黄经自动调整颜色：

| 黄经范围 | 季节 | 颜色 | 说明 |
|---------|------|------|------|
| 350°-10° | 春分 | #00ff88 | 绿色，万物复苏 |
| 80°-100° | 夏至 | #ff6666 | 红色，阳气最盛 |
| 170°-190° | 秋分 | #ff8844 | 橙色，收获季节 |
| 260°-280° | 冬至 | #6666ff | 蓝色，阴气最盛 |
| 其他 | 平常 | #ffdd00 | 金色，标准太阳色 |

#### 使用示例

**基础用法**
```vue
<SolarEcliptic
  :radius="160"
  :time="controlledTime"
  :enable-animation="true"
  :show-sun-label="true"
/>
```

**自定义太阳位置**
```vue
<SolarEcliptic
  :radius="160"
  :sun-position="{
    longitude: 90,
    symbol: '☀️',
    color: '#ff9900',
    size: 25
  }"
/>
```

**与时间控制集成**
```vue
<template>
  <div>
    <SolarEcliptic
      :radius="160"
      :time="currentTime"
      :enable-animation="isPlaying"
      :animation-speed="0.1"
      :show-sun-label="true"
    />

    <Control v-model="currentTime" />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const currentTime = ref(new Date())
const isPlaying = ref(false)
</script>
```

---

### Control 统一控制面板

集成时间、缩放、平移的完整控制系统，提供直观的用户界面和键盘快捷键支持。

#### 特性
- **时间控制** - 播放/暂停、速度调节、时间选择
- **缩放控制** - 放大/缩小、重置、预设缩放(50%-150%)
- **平移控制** - 方向键移动、重置位置
- **农历显示** - 显示农历日期、干支纪年、节气信息
- **键盘快捷键** - 完整的键盘操作支持

#### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | Date | new Date() | 当前时间（v-model） |
| `zoom` | number | 1 | 当前缩放级别（v-model:zoom） |
| `offsetX` | number | 0 | X轴偏移（v-model:offsetX） |
| `offsetY` | number | 0 | Y轴偏移（v-model:offsetY） |

#### Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | (value: Date) | 时间变化 |
| `timeChange` | (value: Date) | 时间变化事件 |
| `update:zoom` | (value: number) | 缩放变化 |
| `zoomChange` | (value: number) | 缩放变化事件 |
| `update:offsetX` | (value: number) | X偏移变化 |
| `update:offsetY` | (value: number) | Y偏移变化 |
| `offsetChange` | (value: {x: number, y: number}) | 偏移变化事件 |

#### 键盘快捷键

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `空格` | 播放/暂停 | 切换动画播放状态 |
| `R` | 重置到当前时间 | 将时间重置为系统当前时间 |
| `H/⇧H` | +1小时/-1小时 | 快速调节时间 |
| `D/⇧D` | +1天/-1天 | 按天调节时间 |
| `M/⇧M` | +1月/-1月 | 按月调节时间 |
| `Y/⇧Y` | +1年/-1年 | 按年调节时间 |
| `+/-` | 放大/缩小 | 调整缩放级别 |
| `0` | 重置缩放 | 缩放级别重置为100% |
| `5-9` | 预设缩放 | 50%-150%快速预设 |
| `方向键` | 平移 | 上下左右移动视图 |
| `Delete` | 重置平移 | 平移位置重置为原点 |

#### 使用示例

**基础用法**
```vue
<template>
  <div>
    <!-- 主要内容区域 -->
    <svg>
      <!-- 使用控制的时间、缩放、偏移 -->
      <g :transform="`translate(${600 + offsetX}, ${600 + offsetY}) scale(${zoomLevel})`">
        <!-- 你的内容 -->
      </g>
    </svg>

    <!-- 控制面板 -->
    <Control
      v-model="controlledTime"
      v-model:zoom="zoomLevel"
      v-model:offsetX="offsetX"
      v-model:offsetY="offsetY"
      @time-change="handleTimeChange"
      @zoom-change="handleZoomChange"
      @offset-change="handleOffsetChange"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const controlledTime = ref(new Date())
const zoomLevel = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)

const handleTimeChange = (newTime: Date) => {
  console.log('时间变化:', newTime)
}

const handleZoomChange = (newZoom: number) => {
  console.log('缩放变化:', newZoom)
}

const handleOffsetChange = (newOffset: {x: number, y: number}) => {
  console.log('偏移变化:', newOffset)
}
</script>
```

**自定义样式**
```vue
<style>
/* 控制面板默认固定在右上角 */
.control {
  position: fixed;
  right: 20px;
  top: 20px;
  /* 可以通过CSS变量自定义颜色 */
  --control-bg: rgba(0, 0, 0, 0.9);
  --control-border: #444;
  --control-text: #fff;
  --control-accent: #ffcc00;
}
</style>
```

## 传统组件

以下组件是项目中传统的中华天文元素，目前部分组件在重构过程中被暂时注释：

### 已重构组件

#### TwentyEightConstellations 二十八星宿
显示二十八星宿分布，按四象七宿分组。

#### EarthlyBranches 十二地支
显示十二地支：子丑寅卯辰巳午未申酉戌亥。

#### SiXiang 四象
显示四象：青龙、朱雀、白虎、玄武。

### 待重构组件（暂时注释）

#### SixtyJiazi 六十甲子
六十甲子干支纪年系统。

#### HeavenlyStems 十天干
十天干：甲乙丙丁戊己庚辛壬癸。

#### EightGates 八门
奇门遁甲八门：开休生伤杜景死惊。

#### TwelveLongevity 十二长生
十二长生阶段：长生、沐浴、冠带、临官、帝旺、衰、病、死、墓、绝、胎、养。

## 架构设计

### 组件继承关系

```
PolarCanvas (基础画布)
├── 提供极坐标系统
├── 统一动画管理
├── 坐标转换工具
└── 通过slot传递工具函数

DegreeScale (刻度组件)
├── 继承PolarCanvas
├── 生成刻度线和扇形
└── 智能文字定位

SolarEcliptic (太阳组件)
├── 继承PolarCanvas
├── 集成astronomy-engine
└── 实时位置计算

传统组件
├── 可选择性继承PolarCanvas
├── 保持原有功能
└── 逐步迁移到新架构
```

### 状态管理

使用Pinia进行状态管理，支持：
- 时间状态同步
- 缩放和偏移状态
- 动画状态管理
- 组件间通信

### 工具库集成

- **astronomy-engine** - 高精度天文计算
- **tyme4ts** - 中华传统历法
- **自定义工具函数** - 坐标转换、角度计算等

## 开发指南

### 创建新的极坐标组件

1. **继承PolarCanvas**
```vue
<template>
  <PolarCanvas
    :enable-animation="enableAnimation"
    :animation-speed="animationSpeed"
    :rotation="rotation"
  >
    <template #default="slotProps">
      <!-- 使用slotProps中的工具函数 -->
      <g class="my-component">
        <!-- 你的内容 -->
      </g>
    </template>
  </PolarCanvas>
</template>
```

2. **使用工具函数**
```typescript
// 转换坐标
const point = slotProps.polarToCartesian(angle, radius)

// 生成路径
const path = slotProps.generateArcPath(centerX, centerY, radius, startAngle, endAngle)

// 计算角度
const midAngle = slotProps.getMidAngle(startAngle, endAngle)
```

3. **添加动画支持**
```typescript
// 监听动画变化
watch(() => slotProps.totalRotation, (newRotation) => {
  // 响应动画变化
})
```

### 性能优化建议

1. **使用计算属性缓存结果**
2. **避免在template中进行复杂计算**
3. **合理使用v-show vs v-if**
4. **优化SVG渲染性能**
5. **使用debounce处理频繁更新**

### 测试指南

1. **单元测试** - 测试工具函数和计算逻辑
2. **组件测试** - 测试组件渲染和交互
3. **集成测试** - 测试组件间协作
4. **端到端测试** - 测试完整用户流程

## 故障排除

### 常见问题

1. **组件不显示**
   - 检查props是否正确传递
   - 确认SVG viewBox设置
   - 检查CSS样式

2. **动画不流畅**
   - 检查动画速度设置
   - 优化渲染性能
   - 减少不必要的重绘

3. **计算错误**
   - 检查角度单位（度数vs弧度）
   - 确认坐标系统一致性
   - 验证数学计算

### 调试技巧

1. **使用Vue DevTools**
2. **添加console.log调试**
3. **使用SVG检查工具**
4. **检查浏览器控制台错误**

---

*此文档随项目更新而持续维护，如有问题请提交Issue或PR。*