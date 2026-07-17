<script setup lang="ts">
/**
 * 后天八卦环（奇门遁甲）
 *
 * ⚠️ 时间驱动架构：接受 time ref，内部统一为 timeRef computed
 *
 * 【关键设计】以「上元甲子日 = 0°」为坐标基准，段边界跟随节气段（每 3 节气 = 1 卦）。
 * 每卦覆盖 3 个节气的实际角度范围（约 45~48°，与真实节气日期不平均一致）。
 *
 * 每 3 节气对应 1 卦。当前节气所在卦位高亮。
 * label 显示"卦名+卦符"（两字竖排：如"坎☵"）。
 */
import { computed, unref, type MaybeRef } from 'vue'
import DataRing from './DataRing.vue'
import type { RingData } from '@/data/rings/types'
import {
  getSolarTermIndex, getBaguaIndex, HOU_TIAN_BAGUA,
  getSolarTermAnglesFromUpperYuan
} from '@/utils/qimenDunJia'

interface Props {
  time?: MaybeRef<Date>
  radius?: number
  innerRadius?: number
  startDegree?: number
  rotationDirection?: 'clockwise' | 'counterclockwise'
}

const props = withDefaults(defineProps<Props>(), {
  radius: 428,
  innerRadius: 396,
  startDegree: -90,
  rotationDirection: 'clockwise'
})

const timeRef = computed(() => unref(props.time) ?? new Date())

const currentIdx = computed(() => getBaguaIndex(getSolarTermIndex(timeRef.value)))

const BAGUA_COLORS: Record<string, string> = {
  坎: '#3498DB', 艮: '#8B7355', 震: '#2ECC71', 巽: '#27AE60',
  离: '#E74C3C', 坤: '#A0522D', 兑: '#F1C40F', 乾: '#F5F5F5'
}

const ringData = computed<RingData>(() => {
  const termAngles = getSolarTermAnglesFromUpperYuan(timeRef.value)

  // 8 卦 = 24 节气 / 3。每卦起点角 = 第 (卦索引*3) 个节气的 angle
  const items = HOU_TIAN_BAGUA.map((b, i) => {
    const startTerm = termAngles.find(t => t.termIndex === i * 3)
    const endTermIdx = (i + 1) * 3
    const endTerm = termAngles.find(t => t.termIndex === endTermIdx)
    const startAngle = startTerm?.angle ?? i * 45
    const endAngle = endTerm?.angle ?? (startAngle + 45)
    const isCurrent = i === currentIdx.value
    const baseBg = BAGUA_COLORS[b.name] ?? '#999999'
    return {
      label: b.name + b.symbol,
      bgColor: isCurrent ? '#FFD700' : baseBg,
      color: isCurrent ? '#1a1a1a' : '#DDDDDD',
      startAngle,
      endAngle: endAngle > startAngle ? endAngle : endAngle + 360,
      highlight: isCurrent,
      highlightLevel: (isCurrent ? 3 : 0) as 0 | 1 | 2 | 3,
      fontSize: isCurrent ? 14 : 11
    }
  })

  return {
    items,
    showSectors: true,
    labelPosition: 0.55,
    labelColor: '#DDDDDD',
    circleColor: '#666666',
    circleWidth: 1,
    verticalTwoChar: true
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

