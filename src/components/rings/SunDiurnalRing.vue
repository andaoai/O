<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import DataBodyRing from './DataBodyRing.vue'
import { sunDiurnal, moonDiurnal, dayNightArc } from '@/utils/celestial'
import { arcPath } from '@/utils/geometry'
import type { BodyRingData } from '@/data/rings/types'

/**
 * 日周方位环（Body 环 · 时间驱动）
 *
 * ═══════════════════════════════════════════════════════════════
 *  这个环表达的是"太阳/月亮相对观测者头顶的方位"—— 一天转一圈。
 *  与 SevenLuminariesRing 完全正交：
 *    · SevenLuminaries = 太阳在黄道十二次的位置（一年一圈，恒星背景）
 *    · SunDiurnal      = 太阳相对头顶的方向（一天一圈，观测者本地）
 *
 *  🎯 在观斗盘中的角色 —— 「初昏」概念的直接可视化：
 *    · 卯时（东方地平）☉ → 屏幕正右（东）
 *    · 午时（正南上中天）☉ → 屏幕正上（南）
 *    · 酉时（西方地平）☉ → 屏幕正左（西） ← 初昏时刻，日落
 *    · 子时（下中天）  ☉ → 屏幕正下（北，地下不见）
 *
 *  🎨 昼夜弧背景（本环最关键的可视化）：
 *    · 金黄弧带：白昼区间（LHA ∈ [-H₀, +H₀]），中心朝上=南=正午
 *    · 橙红弧带：民用曙暮光（[-H₆, -H₀] 晨、[+H₀, +H₆] 昏 · 初昏 ★）
 *    · 深蓝弧带：夜（其余）
 *    · 弧长随太阳赤纬 δ 与观测者纬度 φ 变化：
 *        春/秋分 δ=0 → 昼弧 180°（正半圆）
 *        夏至 δ=+23° → 昼弧 214°（洛阳白昼 14.3h，弧带向"东/西低角度"扩张）
 *        冬至 δ=-23° → 昼弧 146°（洛阳白昼 9.7h，弧带向"正南"收缩）
 *    · 直接把"冬短夏长"的地轴倾斜后果可视化，无需读时间也能一眼分辨季节
 *
 *  古人观测流程一目了然：
 *    ① 看太阳日周环 → ☉ 从金黄弧滑入橙红弧（初昏）
 *    ② 此刻锁定观测点，看北斗斗柄指向 → 落到月建环某支
 *    ③ 月建 = 当月节气
 *
 *  ─── 视觉编码 ───────────────────────────────────
 *    · alt > 0（白昼在天上）        → ☉ 饱满、光晕强
 *    · -6° < alt < 0（民用曙暮光）  → ☉ 半透明、光晕弱（关键：初昏时段）
 *    · alt < -6°（夜晚在地下）      → ☉ 灰色、无光晕
 *
 *  ⚠️ 五层架构：接受 MaybeRef<Date>，内部统一为 timeRef computed。
 *  ⚠️ 面朝北仰望约定：与 HourShichenRing / MonthEstablishRing 同轴对齐
 *      — 高亮时辰格 = ☉ 符号所在格。
 *  ⚠️ 坐标推导（LHA → 屏幕 SVG 角度）：
 *      屏幕 SVG 角度 = (270 - LHA + 360) mod 360
 *        LHA =  0    → SVG 270°（上·南·正午）
 *        LHA = +H₀   → SVG 270-H₀（左偏上·日落·西）
 *        LHA = -H₀   → SVG 270+H₀（右偏上·日出·东）
 *      故昼弧 startAngle = 270 - H₀，endAngle = 270 + H₀（未 mod，保留跨界大弧）
 * ═══════════════════════════════════════════════════════════════
 */

interface Props {
  /** 时间源（支持 ref 或 plain value） */
  time?: MaybeRef<Date>
  /** 环外半径（RingStack 自动注入） */
  radius?: number
  /** 环内半径（RingStack 自动注入） */
  innerRadius?: number
  /** 观测者经度（度，东经为正） */
  observerLon?: number
  /** 观测者纬度（度，北纬为正） */
  observerLat?: number
  /** 是否显示月亮（默认 false，本环强调"太阳-北斗夹角"，不放月亮） */
  showMoon?: boolean
  /** 是否显示昼夜弧背景（默认 true） */
  showDayNightArc?: boolean
  /** 旋转方向 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200,
  innerRadius: 180,
  observerLon: 112.45, // 洛阳
  observerLat: 34.65,
  showMoon: false,
  showDayNightArc: true,
  rotationDirection: 'clockwise'
})

/** ⚠️ 五层架构范式：确保 time 始终是响应式的 */
const timeRef = computed(() => unref(props.time) ?? new Date())

/**
 * 根据地平高度角映射高亮层级与不透明度
 *
 * · alt > 10°     强光晕 (level 3) —— 明亮白昼
 * · 0 < alt ≤ 10°  中光晕 (level 2) —— 低地平（日出/日落前后）
 * · -6° ≤ alt ≤ 0 弱光晕 (level 1) —— 民用曙暮光（初昏关键窗口）
 * · alt < -6°     无光晕 (level 0) —— 天文夜（地下）
 */
const levelByAltitude = (alt: number): 0 | 1 | 2 | 3 => {
  if (alt > 10) return 3
  if (alt > 0) return 2
  if (alt > -6) return 1
  return 0
}

/** 高度角 → 中文描述（用于标签） */
const phraseByAltitude = (alt: number, isSun: boolean): string => {
  if (isSun) {
    if (alt > 10) return '☀ 昼'
    if (alt > 0) return '☀ 曙／昃'
    if (alt > -6) return '☀ 初昏'
    if (alt > -18) return '☀ 夜'
    return '☀ 地下'
  }
  if (alt > 0) return '☾ 见'
  if (alt > -6) return '☾ 出／没'
  return '☾ 地下'
}

// ─────────────────────────────────────────────────────
// 昼夜弧背景：三重同心弧（夜/曙暮/白昼）
// ─────────────────────────────────────────────────────

/** 当日昼夜结构（由太阳赤纬 + 观测者纬度决定） */
const arcInfo = computed(() => dayNightArc(timeRef.value, props.observerLat))

/**
 * 昼夜弧带 SVG 路径生成
 *
 * 坐标转换：LHA=0 (正午·南) → SVG 270°（上）
 *   昼弧 (LHA ∈ [-H₀, +H₀])          → SVG [270-H₀, 270+H₀]
 *   曙暮弧 (LHA ∈ [-H₆, +H₆])        → SVG [270-H₆, 270+H₆]
 *
 * ⚠️ 不对 startAngle mod 360，保留跨界大弧（如夏至 startAngle=163°, endAngle=377°）
 *    arcPath 会按 endAngle-startAngle > 180 生效 largeArcFlag。
 */
const dayArcPath = computed(() => {
  const H0 = arcInfo.value.sunriseHourAngle
  if (H0 <= 0) return null // 极夜：无昼弧
  if (H0 >= 180) {
    // 极昼：整圈全是昼弧，直接画完整环带（用两个半圆拼接）
    return arcPath(props.radius, 0, 359.999, props.innerRadius, props.rotationDirection)
  }
  const startAngle = 270 - H0
  const endAngle = 270 + H0
  return arcPath(props.radius, startAngle, endAngle, props.innerRadius, props.rotationDirection)
})

/**
 * 曙暮光完整弧带（含白昼）路径 —— 后续视觉上叠在夜色下方，被"更亮的昼弧"覆盖中央部分
 * 呈现出"夜 → 曙暮 → 昼 → 曙暮 → 夜"的四层过渡带。
 */
const twilightArcPath = computed(() => {
  const H6 = arcInfo.value.civilTwilightHourAngle
  if (H6 <= 0) return null
  if (H6 >= 180) {
    return arcPath(props.radius, 0, 359.999, props.innerRadius, props.rotationDirection)
  }
  const startAngle = 270 - H6
  const endAngle = 270 + H6
  return arcPath(props.radius, startAngle, endAngle, props.innerRadius, props.rotationDirection)
})

/** 底色（夜）：整个环带 */
const nightArcPath = computed(() =>
  arcPath(props.radius, 0, 359.999, props.innerRadius, props.rotationDirection)
)

/** 季节标签：夏至/冬至/春分/秋分附近打个显眼的中文标签 */
const seasonLabel = computed(() => {
  const δ = arcInfo.value.dec
  if (arcInfo.value.polarDay) return '极昼'
  if (arcInfo.value.polarNight) return '极夜'
  if (δ > 20) return '近夏至·昼长'
  if (δ < -20) return '近冬至·昼短'
  if (Math.abs(δ) < 3) return δ >= 0 ? '近春分·昼夜均' : '近秋分·昼夜均'
  return δ > 0 ? '北半 · 昼渐长' : '北半 · 昼渐短'
})

// ─────────────────────────────────────────────────────
// 太阳/月亮天体标记
// ─────────────────────────────────────────────────────

/**
 * 日周环数据（面朝北仰望约定）
 *
 * 屏幕角度直接来自 sunDiurnal / moonDiurnal 计算，无需额外坐标转换。
 */
const bodyRingData = computed<BodyRingData>(() => {
  const t = timeRef.value
  const sun = sunDiurnal(t, props.observerLon, props.observerLat)

  const items: BodyRingData['items'] = [
    {
      label: phraseByAltitude(sun.alt, true),
      symbol: '☀',
      color: sun.alt > 0 ? '#FFD54A' : '#7A6F42',
      symbolColor: '#fff',
      kind: 'sun',
      angle: sun.screenAngle,
      size: 8,
      highlightLevel: levelByAltitude(sun.alt),
      haloLevel: levelByAltitude(sun.alt)
    }
  ]

  if (props.showMoon) {
    const moon = moonDiurnal(t, props.observerLon, props.observerLat)
    items.push({
      label: phraseByAltitude(moon.alt, false),
      symbol: '☾',
      color: moon.alt > 0 ? '#DDE5FF' : '#5A5F70',
      symbolColor: '#fff',
      kind: 'moon',
      angle: moon.screenAngle,
      size: 7,
      highlightLevel: levelByAltitude(moon.alt),
      haloLevel: levelByAltitude(moon.alt)
    })
  }

  return {
    // 圈边隐藏（昼夜弧本身已经画出环带边界）
    circleColor: undefined,
    showLatLine: false,
    showRetrogradeRing: false,
    items
  }
})
</script>

<template>
  <g class="sun-diurnal-ring">
    <!--
      ═══════ 三层昼夜弧背景（由深到浅，后画的盖前画的）═══════
      · 底层：夜弧 → 覆盖整圈（深藏青）
      · 中层：曙暮弧 → 覆盖 [-H₆, +H₆]（暖橙半透明）
      · 顶层：白昼弧 → 覆盖 [-H₀, +H₀]（明黄半透明）
      三层叠加自然过渡：
        整圈藏青 → [-H₆,-H₀]∪[H₀,H₆] 被橙覆盖成"曙暮" → [-H₀,H₀] 再被黄覆盖成"昼"
    -->
    <g v-if="showDayNightArc">
      <!-- 夜色底 -->
      <path
        v-if="nightArcPath"
        :d="nightArcPath"
        fill="#0D1830"
        opacity="0.55"
      />
      <!-- 曙暮光带（非极昼/极夜时才绘制） -->
      <path
        v-if="twilightArcPath && !arcInfo.polarDay && !arcInfo.polarNight"
        :d="twilightArcPath"
        fill="#8A5A3C"
        opacity="0.18"
      />
      <!-- 白昼带（低亮度金褐，够区分昼夜但不喧宾夺主） -->
      <path
        v-if="dayArcPath && !arcInfo.polarNight"
        :d="dayArcPath"
        fill="#9C8040"
        opacity="0.22"
      />
      <!-- 极夜特殊：整环再压一层深色 -->
      <path
        v-if="arcInfo.polarNight && nightArcPath"
        :d="nightArcPath"
        fill="#0A0F1F"
        opacity="0.45"
      />

      <!-- 昼/夜分界线：日出/日落 —— 在两条边界上打细金线，让"白天从这里开始/结束"可读 -->
      <g v-if="!arcInfo.polarDay && !arcInfo.polarNight && dayArcPath">
        <line
          v-for="(sign, i) in [-1, 1]"
          :key="i"
          :x1="Math.cos((270 + sign * arcInfo.sunriseHourAngle) * Math.PI / 180) * innerRadius"
          :y1="Math.sin((270 + sign * arcInfo.sunriseHourAngle) * Math.PI / 180) * innerRadius"
          :x2="Math.cos((270 + sign * arcInfo.sunriseHourAngle) * Math.PI / 180) * radius"
          :y2="Math.sin((270 + sign * arcInfo.sunriseHourAngle) * Math.PI / 180) * radius"
          stroke="#C99A3A"
          stroke-width="0.6"
          opacity="0.55"
        />
      </g>

      <!-- 季节 + 昼长中文说明（放在环的南天正中，即屏幕上方偏内） -->
      <text
        :x="0"
        :y="-(radius + innerRadius) / 2"
        fill="#B89A6A"
        font-size="9"
        text-anchor="middle"
        dominant-baseline="middle"
        opacity="0.7"
      >
        {{ seasonLabel }} · 昼 {{ arcInfo.dayLengthHours.toFixed(1) }}h
      </text>
    </g>

    <!-- ═══════ 太阳（可选月亮）符号 —— 覆盖在昼夜弧之上 ═══════ -->
    <DataBodyRing
      :data="bodyRingData"
      :radius="radius"
      :inner-radius="innerRadius"
      :rotation-direction="rotationDirection"
      :show-motion-arrow="false"
      :show-motion-label="false"
    />
  </g>
</template>

<style scoped>
.sun-diurnal-ring {
  pointer-events: none;
}
</style>
