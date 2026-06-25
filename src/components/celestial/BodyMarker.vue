<script setup lang="ts">
/**
 * 通用天体标记（坐标无关）
 *
 * 把「光晕圈 + 本体圆 + 居中符号」这一在 SkyChart / HelioOrbits / CelestialBody 各写一遍
 * 的天体绘制收口为一个纯展示组件。本组件**不做任何坐标计算**——调用方按自己的坐标系
 * （黄经极坐标 / 天极投影 / 日心盘）算好屏幕 (x,y) 传进来即可，故三套坐标体系都能复用。
 *
 * 逆行环、黄纬指示线等特例装饰仍由各组件自行叠加，不进本组件。
 */
interface Halo {
  /** 光晕半径（px，绝对值） */
  radius: number
  /** 透明度 */
  opacity: number
}

interface Props {
  /** 本体中心屏幕坐标 */
  x: number
  y: number
  /** 本体半径（px） */
  radius: number
  /** 本体颜色 */
  color?: string
  /** 光晕圈（外→内，可 0~N 个）。缺省无光晕。 */
  halos?: Halo[]
  /** 光晕颜色（缺省同 color） */
  haloColor?: string
  /** 单字符号（缺省不画） */
  symbol?: string
  /** 符号颜色 */
  symbolColor?: string
  /** 符号字号（缺省按本体半径估算） */
  symbolFontSize?: number
  /** 符号旋转角（度，缺省 0 即水平；CelestialBody 用它让符号沿径向竖立） */
  symbolRotation?: number
}

withDefaults(defineProps<Props>(), {
  color: '#ffdd00',
  halos: () => [],
  haloColor: '',
  symbol: '',
  symbolColor: '#fff',
  symbolFontSize: 0,
  symbolRotation: 0
})
</script>

<template>
  <g class="body-marker">
    <!-- 光晕（外→内） -->
    <circle
      v-for="(h, i) in halos"
      :key="`halo-${i}`"
      :cx="x"
      :cy="y"
      :r="h.radius"
      :fill="haloColor || color"
      :opacity="h.opacity"
    />
    <!-- 本体 -->
    <circle :cx="x" :cy="y" :r="radius" :fill="color" />
    <!-- 符号 -->
    <text
      v-if="symbol"
      :x="x"
      :y="y"
      :fill="symbolColor"
      :font-size="symbolFontSize || Math.max(8, radius * 0.9)"
      font-weight="bold"
      text-anchor="middle"
      dominant-baseline="middle"
      :transform="symbolRotation ? `rotate(${symbolRotation} ${x} ${y})` : undefined"
    >{{ symbol }}</text>
  </g>
</template>

<style scoped>
.body-marker text {
  font-family: 'Microsoft YaHei', sans-serif;
  pointer-events: none;
}
</style>
