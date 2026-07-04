<script setup lang="ts">
import { computed, unref, type MaybeRef } from 'vue'
import DataPointRing from './DataPointRing.vue'
import { sunLongitude } from '@/utils/celestial'
import { eclipticPointToScreenAngle } from '@/utils/jianJiang'
import { normalizeAngle } from '@/utils/geometry'
import {
  SOLAR_TERMS_LICHUN_ORDER,
  SOLAR_TERM_CARDINALS,
  currentLichunIndex,
  isJieqi
} from '@/utils/constants/solarTerms'

/**
 * 建将盘专用二十四节气环（点环 · 时间驱动）
 *
 * ⚠️ 五层架构：接受 MaybeRef<Date>，内部统一为 timeRef computed。
 *
 * 🧭 方位约定：与建将盘其他环一致，「面朝北仰望」坐标系。
 *   - 使用 `eclipticPointToScreenAngle(lon)` 派生角度（无偏移，天文准确）：
 *     春分点（黄经 0°）  → 屏幕 SVG 0°（正东·右）
 *     夏至点（黄经 90°） → 屏幕 SVG 270°（正南·上）
 *     秋分点（黄经 180°）→ 屏幕 SVG 180°（正西·左）
 *     冬至点（黄经 270°）→ 屏幕 SVG 90°（正北·下）
 *   - ⚠️ 与月将环（十二次）刻意错开 15°：
 *     月将环用 `sunLongitudeToScreenAngle`（-15° 偏移，格中心对齐月建）
 *     节气环用 `eclipticPointToScreenAngle`（无偏移，天文准确）
 *     两者呈现半格错位，正是"月建用节 / 月将用中气"的固有相位差。
 *
 * 🎯 本环在建将盘中的价值：
 *   月建（月柱）用「节」分月：立春 → 惊蛰 → 清明……
 *   月将（十二次）用「中气」分次：雨水（娵訾）→ 春分（降娄）……
 *   两套系统永远错开半格（约 15°）。
 *   本环把 24 节气原原本本刻在盘上，让"月建亮卯 + 月将仍亮娵訾"
 *   这种"节气尚未过中气"的天文事实直接可读。
 *
 * 📅 分色约定：
 *   - 节（奇数节气：立春/惊蛰/清明/立夏/芒种…）→ 冷蓝，标记月建切换
 *   - 中气（偶数节气：雨水/春分/谷雨/小满/夏至…）→ 暖金，标记月将切换
 *   - 二分二至（春分/夏至/秋分/冬至）→ 强调金色 + 加大字号
 *   - 当前太阳所在节气 → 高亮呼吸
 */

interface Props {
  /** 时间源（支持 ref 或 plain value） */
  time?: MaybeRef<Date>
  /** 环外半径 */
  radius?: number
  /** 环内半径 */
  innerRadius?: number
  /** 旋转方向 */
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 200,
  innerRadius: 180,
  rotationDirection: 'clockwise'
})

/** ⚠️ 五层架构范式：统一响应式 timeRef */
const timeRef = computed(() => unref(props.time) ?? new Date())

const ringData = computed(() => {
  const sunLon = sunLongitude(timeRef.value)
  /** 当前太阳所在节气索引：立春 315° 起、每 15° 一气（收敛于 utils/constants/solarTerms.ts） */
  const currentIndex = currentLichunIndex(sunLon)

  return {
    startDegree: 0,
    labelOffset: -14,
    labelAngleOffset: 0,
    pointSymbol: 'tick' as const,
    circleColor: '#5a5a5a',
    circleWidth: 0.6,
    tickInnerRatio: 0.68,
    tickOuterRatio: 1.0,
    items: SOLAR_TERMS_LICHUN_ORDER.map((label, i) => {
      const eclLon = normalizeAngle(315 + i * 15) // 该节气精确黄经
      const isCardinal = SOLAR_TERM_CARDINALS.has(label)
      const isJie = isJieqi(i) // 偶数索引 = 节（立春/惊蛰…），奇数 = 中气（雨水/春分…）
      const isActive = i === currentIndex

      /** 节 vs 中气：色系区分月建/月将切换语义 */
      const baseColor = isCardinal
        ? '#FFD54A'
        : (isJie ? '#88C4E8' : '#E8B368')

      return {
        label,
        angle: eclipticPointToScreenAngle(eclLon),
        fontSize: isCardinal ? 12 : 10,
        pointSize: isCardinal ? 11 : 8,
        pointColor: baseColor,
        color: baseColor,
        highlight: isActive,
        highlightLevel: (isActive ? 3 : (isCardinal ? 1 : 0)) as 0 | 1 | 2 | 3
      }
    })
  }
})
</script>

<template>
  <DataPointRing
    :data="ringData"
    :radius="radius"
    :inner-radius="innerRadius"
    :rotation-direction="rotationDirection"
  />
</template>
