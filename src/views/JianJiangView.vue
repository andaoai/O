<script setup lang="ts">
import { ref, computed, markRaw } from 'vue'
import { withBase } from 'vitepress'
import Control from '../components/Control.vue'
import RingStack from '../components/base/RingStack.vue'
import MonthEstablishRing from '../components/rings/MonthEstablishRing.vue'
import HourShichenRing from '../components/rings/HourShichenRing.vue'
import MonthGeneralRing from '../components/rings/MonthGeneralRing.vue'
import JianJiangSolarTermsRing from '../components/rings/JianJiangSolarTermsRing.vue'
import SevenLuminariesRing from '../components/rings/SevenLuminariesRing.vue'
import BeidouCenter from '../components/centers/BeidouCenter.vue'
import { useUrlTime } from '@/composables/useUrlTime'
import { useLiveClock } from '@/composables/useLiveClock'
import { useGeolocation } from '@/composables/useGeolocation'

/**
 * 建将盘（斗建 × 月将 × 时辰）
 *
 * ═══════════════════════════════════════════════════════════════
 *  「建月」看北斗（赤道视角）、「月将」看太阳（黄道视角）
 *  两套坐标系一北一南共同标记月序；「时辰」看斗柄实时物理指向
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
 *   外环 · 月建环   ┃ 【赤道】十二辰
 *                    北斗七星斗柄在赤道天球上的指向，一年转一圈。
 *                    高亮 = 当前月柱地支（tyme4ts 按节气分月）。
 *                    古人「初昏斗柄所指」= 月建 = 季节。
 *
 *   中环 · 时辰环   ┃ 【赤道】十二辰（与月建环同构对齐）
 *                    北斗七星斗柄的实时物理指向，一日转一圈。
 *                    高亮 = 当前时柱地支。
 *                    正是本环让"初昏观察"成立：戌时锁定观测点，
 *                    斗柄的"时辰指向"才被折算成"月建（季节）"。
 *
 *   内环 · 月将环   ┃ 【黄道】十二次
 *                    太阳在黄道十二星次中的位置，一年转一圈。
 *                    每格与其对应月建地支同轴（娵訾↔寅、降娄↔卯…）。
 *                    高亮 = 当前太阳所在星次（sunLongitude）。
 *
 *   最内 · 节气环   ┃ 【黄道】24 节气刻度
 *                    太阳黄经每 15° 一气，刻在盘上。
 *                    高亮 = 当前太阳所在节气。
 *                    · 节（立春/惊蛰/清明…）冷蓝：月建切换点
 *                    · 中气（雨水/春分/谷雨…）暖金：月将切换点
 *                    这一环把"月建用节、月将用中气"的固有 15° 错位
 *                    直接可视化——同一时刻可见斗柄和日缠的相位差。
 *
 *   ✨ 七曜环       ┃ 【黄道】日月五星，压在月将环与节气环之间
 *                    面朝北仰望约定的黄经→屏幕角（春分点在右）。
 *                    · 太阳符号永远精确落在当日节气刻度点上，
 *                      同时压在当前月将高亮格中央 → 三重锁定。
 *                    · 月亮沿黄道每天推进约 13°，一月绕盘一圈，
 *                      从其相对太阳的角距可读朔望。
 *                    · 五星按黄经排布，逆行/迟守以运动状态环显示，
 *                      与月将（日缠）体系直接呼应。
 *
 *   圆心 · 北斗七星 ┃ 【赤道】天极等距方位投影
 *                    J2000 星表 + 岁差 + 恒星时实时驱动，
 *                    斗柄一日绕天极旋转 360°，
 *                    斗柄物理指向自然落在时辰环 / 月建环高亮格。
 *
 *  ─────────────────────────────────────────────────────────────
 *   赤道 vs 黄道 —— 为什么外/中环是赤道、内环是黄道？
 *     · 斗建是"北斗斗柄指向"：北斗是拱极星（绕天极转），
 *       其运动由地球自转决定 → 赤道坐标系。
 *     · 月将是"太阳位置"：太阳在恒星背景下的年周运动是黄道，
 *       黄道与赤道交角 23.44° → 黄道坐标系。
 *     · 二者在同一月序上对偶（斗柄指寅 ⇄ 日在娵訾），
 *       但它们分属"赤道视角"与"黄道视角"两套天球坐标。
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
 * 同心环配置（由外到内）
 * 月建 50 → 时辰 40 → 月将 50 → 七曜 32 → 节气 26；圆心区约 260px 容纳七星
 *
 * ⚠️ 七曜与月将/节气三环协同：
 *   月将环高亮格中心 ↔ 七曜环太阳符号 ↔ 节气环当前节气刻度点
 *   三者必须精确对齐（黄道 × 面朝北仰望 × (360-lon) 转换）。
 *   SevenLuminariesRing 必须传 coordinate-system="ecliptic-facing-north"
 *   否则太阳会与月将/节气错位（默认 equatorial 使用赤经，与黄道体系不同）。
 */
const rings = [
  {
    component: markRaw(MonthEstablishRing),
    thickness: 50,
    props: { time: controlledTime }
  },
  {
    component: markRaw(HourShichenRing),
    thickness: 40,
    props: { time: controlledTime }
  },
  {
    component: markRaw(MonthGeneralRing),
    thickness: 50,
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
    component: markRaw(JianJiangSolarTermsRing),
    thickness: 26,
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
