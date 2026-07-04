<script setup lang="ts">
import { ref, computed, markRaw } from 'vue'
import { withBase } from 'vitepress'
import Control from '../components/Control.vue'
import RingStack from '../components/base/RingStack.vue'
import MonthEstablishRing from '../components/rings/MonthEstablishRing.vue'
import HourShichenRing from '../components/rings/HourShichenRing.vue'
import MonthGeneralRing from '../components/rings/MonthGeneralRing.vue'
import GuanDouSolarTermsRing from '../components/rings/GuanDouSolarTermsRing.vue'
import SevenLuminariesRing from '../components/rings/SevenLuminariesRing.vue'
import BeidouCenter from '../components/centers/BeidouCenter.vue'
import { useUrlTime } from '@/composables/useUrlTime'
import { useLiveClock } from '@/composables/useLiveClock'
import { useGeolocation } from '@/composables/useGeolocation'

/**
 * 观斗盘（GuanDou · Watching the Big Dipper）
 *
 * ═══════════════════════════════════════════════════════════════
 *  模拟古人观察北斗——所有环都是"读北斗方位"的辅助刻度盘。
 *  由外向内：先看太阳在哪里（黄道），再看北斗指到哪里（赤道），
 *  最后落到圆心真实的北斗七星本体。
 *  ─────────────────────────────────────────────────────────────
 *
 *  🧭 盘面方位约定：面朝北仰望星空
 *     ┌──────────────────────────────┐
 *     │           午（南·上）           │
 *     │                                │
 *     │  酉（西·左）    卯（东·右）      │  ← 面朝北，头顶朝南
 *     │                                │  ← 地支呈"逆时针"排列
 *     │           子（北·下）           │  ← 与地图"上北"约定相反
 *     └──────────────────────────────┘
 *
 *  ─────────────────────────────────────────────────────────────
 *  环序：外圈黄道（看太阳） → 内圈赤道（看北斗） → 圆心北斗本体
 *
 *   最外 · 24 节气环   ┃ 【黄道】太阳黄经每 15° 一气
 *                       高亮 = 当前太阳所在节气
 *                       · 节（立春/惊蛰/清明…）冷蓝：月建切换点
 *                       · 中气（雨水/春分/谷雨…）暖金：月将切换点
 *                       把"月建用节、月将用中气"的 15° 相位差直接可视化。
 *
 *   ✨ 七曜环          ┃ 【黄道】日月五星按黄经排布
 *                       · 太阳符号永远精确落在当日节气刻度点上，
 *                         同时压在当前月将高亮格中央 → 三重锁定
 *                       · 月亮沿黄道每天推进约 13°，一月绕盘一圈
 *                       · 五星按黄经排布，逆行/迟守以运动状态环显示
 *
 *   中 · 月将环        ┃ 【黄道】十二次（太阳所在星次）
 *                       太阳在黄道十二星次中的位置，一年转一圈。
 *                       每格与其对应月建地支同轴（娵訾↔寅、降娄↔卯…）。
 *                       高亮 = 当前太阳所在星次（sunLongitude）。
 *
 *  ─────────────── 黄道 ↑ 转赤道 ↓ ───────────────
 *
 *   中 · 时辰环        ┃ 【赤道】十二辰 · 北斗斗柄"一日转一圈"
 *                       高亮 = 当前时柱地支。
 *                       正是本环让"初昏观察"成立：戌时锁定观测点，
 *                       斗柄的"时辰指向"才被折算成"月建（季节）"。
 *
 *   最内 · 月建环      ┃ 【赤道】十二辰 · 北斗斗柄"一年转一圈"
 *                       高亮 = 当前月柱地支（tyme4ts 按节气分月）。
 *                       古人「初昏斗柄所指」= 月建 = 季节。
 *
 *   圆心 · 北斗七星    ┃ 【赤道】天极等距方位投影
 *                       · J2000 星表 + 岁差 + 恒星时实时驱动
 *                       · 紫微垣东西两藩 + 勾陈一（北极星）
 *                       · 地平圈（浏览器定位得到观测者纬度）
 *                       · 内接/外接赤纬圈揭示投影本质
 *                       斗柄物理指向自然落在时辰环 / 月建环高亮格。
 *
 *  ─────────────────────────────────────────────────────────────
 *   为什么这样分层？
 *     · 越靠圆心 = 越接近"观测对象本身"（北斗七星实体）
 *     · 赤道环紧贴北斗（月建/时辰都是斗柄在赤道天球上的指向）
 *     · 黄道环远离北斗（太阳的位置是另一套天球坐标）
 *     · 二者在同一月序上对偶（斗柄指寅 ⇄ 日在娵訾），
 *       但分属"赤道视角"与"黄道视角"两套天球坐标。
 *
 *  ─────────────────────────────────────────────────────────────
 *   ✨ 纯实时驱动：controlledTime 每秒推进
 *      · 斗柄一小时转 15°（每 2 小时沿时辰环推进一格）
 *      · 太阳每天推进约 1°（数天滑入下一月将）
 *      · 千年尺度：岁差让北斗形状可见变化
 * ═══════════════════════════════════════════════════════════════
 */

// 唯一时间源（与 URL ?t=... 双向绑定）
const { controlledTime, hasUrlTime } = useUrlTime()

// 实时时钟：每秒推进 controlledTime
const { onUserTimeChange } = useLiveClock(controlledTime, { paused: hasUrlTime })

/**
 * 观测者位置：优先用浏览器 geolocation，回退到洛阳（乙巳观默认锚点）。
 *
 * · 首次挂载时自动向浏览器请求一次定位（会弹权限框）
 * · 用户拒绝 / 无 GPS / 超时 ⇒ 继续用洛阳 34.65°N / 112.45°E
 * · 授权成功后 latitude/longitude 会响应式更新，地平圈自动偏心到新位置，
 *   斗柄相位（LST）也跟着换算——罗盘瞬间"锚到你脚下"
 *
 * ⚠️ 只影响：
 *   1. BeidouCenter 的地平圈形状与四方位标注
 *   2. 北斗七星与紫微垣的旋转相位（换个经度 = 换个时区的观星视角）
 * 不影响月建/月将/节气/七曜——这些是天球本身的定义，与观测点无关。
 */
const { latitude, longitude, status: geoStatus } = useGeolocation({
  lat: 34.65,      // 洛阳
  lon: 112.45,
  autoRequest: true
})

/** 观测点显示名：授权成功显示"当前位置"，否则显示"洛阳（默认）" */
const locationLabel = computed(() =>
  geoStatus.value === 'success' ? '当前位置' : '洛阳（默认）'
)

// 视图控制
const zoomLevel = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const rotationDirection = ref<'clockwise' | 'counterclockwise'>('clockwise')
const rotationAngle = ref(0)

const OUTER_RADIUS = 480

/**
 * 同心环配置（由外到内 —— 越靠圆心越接近北斗本体）
 *
 * 节气 26 → 七曜 32 → 月将 50 → 时辰 40 → 月建 50；圆心区约 260px 容纳七星
 *
 * 分层意图：
 *   · 最外三环（节气/七曜/月将）都是【黄道】视角 —— 看太阳系在哪
 *   · 内两环（时辰/月建）是【赤道】视角 —— 看北斗指向哪
 *   · 圆心是【北斗本体】—— 观测对象
 * 视线由外向内 = 由天到地 = 由太阳到北斗，正是古人读盘的路径。
 *
 * ⚠️ 七曜与月将/节气三环协同：
 *   月将环高亮格中心 ↔ 七曜环太阳符号 ↔ 节气环当前节气刻度点
 *   三者必须精确对齐（黄道 × 面朝北仰望 × (360-lon) 转换）。
 *   SevenLuminariesRing 必须传 coordinate-system="ecliptic-facing-north"
 *   否则太阳会与月将/节气错位（默认 equatorial 使用赤经，与黄道体系不同）。
 */
const rings = [
  {
    component: markRaw(GuanDouSolarTermsRing),
    thickness: 26,
    props: { time: controlledTime }
  },
  {
    component: markRaw(SevenLuminariesRing),
    thickness: 32,
    props: {
      time: controlledTime,
      coordinateSystem: 'ecliptic-facing-north',
      showLatitudeLine: false,
      showRetrogradeRing: true
    }
  },
  {
    component: markRaw(MonthGeneralRing),
    thickness: 50,
    props: { time: controlledTime }
  },
  {
    component: markRaw(HourShichenRing),
    thickness: 40,
    props: { time: controlledTime }
  },
  {
    component: markRaw(MonthEstablishRing),
    thickness: 50,
    props: { time: controlledTime }
  }
]
</script>

<template>
  <div class="container">
    <a :href="withBase('/compass/')" class="back-link">← 罗盘列表</a>

    <svg
      class="compass-svg"
      viewBox="0 0 1200 1200"
      preserveAspectRatio="xMidYMid meet"
    >
      <g :transform="`translate(${600 + offsetX}, ${600 + offsetY}) scale(${zoomLevel}) rotate(${rotationAngle})`">
        <RingStack
          :outer-radius="OUTER_RADIUS"
          :gap="4"
          :rings="rings"
          :rotation-direction="rotationDirection"
        >
          <!-- 圆心区：北斗七星（斗柄物理指向自然读出，不画辅助射线）
               观测点跟随浏览器定位，未授权时回退到洛阳 -->
          <template #center="{ innerRadius }">
            <BeidouCenter
              :radius="innerRadius"
              :time="controlledTime"
              :rotation-direction="rotationDirection"
              :observer-lat="latitude"
              :observer-lon="longitude"
              :location-label="locationLabel"
            />
          </template>
        </RingStack>
      </g>
    </svg>

    <Control
      v-model="controlledTime"
      @time-change="onUserTimeChange"
      v-model:zoom="zoomLevel"
      v-model:offsetX="offsetX"
      v-model:offsetY="offsetY"
      v-model:rotation-direction="rotationDirection"
      v-model:rotation-angle="rotationAngle"
    />
  </div>
</template>

<style scoped>
.container {
  width: 100vw;
  height: 100vh;
  background-color: black;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

svg {
  display: block;
}

.compass-svg {
  width: min(100vw, 100vh);
  height: min(100vw, 100vh);
}

.back-link {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
  color: #aaa;
  text-decoration: none;
  font-size: 14px;
  padding: 6px 12px;
  border: 1px solid #444;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.5);
}

.back-link:hover {
  color: #fff;
  border-color: #888;
}
</style>
