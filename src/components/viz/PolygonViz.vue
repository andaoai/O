<template>
  <div class="viz-card">
    <div class="viz-display">
      <canvas ref="canvas" width="500" height="500" class="viz-canvas"></canvas>
      <p class="viz-legend">
        ◇ 紫辉半径线 = n 次切割 · 金弧 = 中心角 · 等分数 = 进制数
        <span v-if="nVal > 60"><br>n > 60 时不绘制半径线，多边形趋近于圆</span>
        <span v-if="nVal === 360"><br>✦ 正三百六十边形 ≈ 圆 —— 360 进制就是罗盘的盘面</span>
      </p>
    </div>

    <div class="viz-controls">
      <div class="ctrl-row">
        <div class="ctrl-group">
          <label>边数 n</label>
          <input type="range" v-model.number="nVal" min="1" max="360" step="1" class="slider" />
          <span class="badge">{{ nVal }}</span>
        </div>
        <div class="ctrl-group">
          <label>中心角</label>
          <span class="badge gold">{{ centerAngle }}</span>
        </div>
        <div class="ctrl-group">
          <label>360° 整除</label>
          <span class="badge" :class="isDiv ? 'glow' : 'mute'">
            {{ isDiv ? '✅ ' + (360/nVal) + '°' : '❌' }}
          </span>
        </div>
      </div>
      <div class="ctrl-row">
        <div class="presets">
          <span class="preset-label">跳转</span>
          <button
            v-for="v in presets"
            :key="v"
            class="preset-btn"
            :class="{ active: nVal === v }"
            @click="nVal = v"
          >{{ v }}</button>
          <span class="divisor-info" v-if="nVal === 360">360 有 24 个因子 · 可容纳 3/4/5/6/8/9/10/12…</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import './viz-theme.css'

const canvas = ref<HTMLCanvasElement>()
const nVal = ref(10)

const centerAngle = computed(() => {
  const v = 360 / nVal.value
  return Number.isInteger(v) ? v + '°' : v.toFixed(4) + '°'
})
const isDiv = computed(() => 360 % nVal.value === 0)
const presets = [3, 4, 5, 6, 8, 9, 10, 12, 24, 60, 360]

function draw(n: number) {
  const cvs = canvas.value
  if (!cvs) return
  const ctx = cvs.getContext('2d')
  if (!ctx) return
  const W = 500, H = 500, cx = 250, cy = 250, R = 200

  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#100822'
  ctx.fillRect(0, 0, W, H)

  // 外圆
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, 2 * Math.PI)
  ctx.strokeStyle = '#4a2c7a'
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 6])
  ctx.stroke()
  ctx.setLineDash([])

  const angle = (2 * Math.PI) / n
  const start = -Math.PI / 2
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < n; i++) {
    pts.push({
      x: cx + R * Math.cos(start + i * angle),
      y: cy + R * Math.sin(start + i * angle),
    })
  }

  // 半径线
  if (n <= 60) {
    for (let i = 0; i < n; i++) {
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(pts[i].x, pts[i].y)
      ctx.strokeStyle = 'rgba(200, 162, 232, 0.25)'
      ctx.lineWidth = 1.2
      ctx.stroke()
    }
  }

  // 多边形
  if (n === 1) {
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(pts[0].x, pts[0].y)
    ctx.strokeStyle = '#c8a2e8'
    ctx.lineWidth = 3
    ctx.stroke()
  } else if (n === 2) {
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    ctx.lineTo(pts[1].x, pts[1].y)
    ctx.strokeStyle = '#c8a2e8'
    ctx.lineWidth = 3
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < n; i++) ctx.lineTo(pts[i].x, pts[i].y)
    ctx.closePath()
    ctx.strokeStyle = '#c8a2e8'
    ctx.lineWidth = 3
    ctx.stroke()
  }

  // 中心角弧线
  if (n > 1) {
    const arcR = 30
    ctx.beginPath()
    ctx.arc(cx, cy, arcR, start, start + angle)
    ctx.strokeStyle = '#d7b872'
    ctx.lineWidth = 2.5
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.arc(cx, cy, 30, 0, 2 * Math.PI)
    ctx.strokeStyle = '#d7b872'
    ctx.lineWidth = 2.5
    ctx.stroke()
    ctx.font = '14px "Segoe UI", sans-serif'
    ctx.fillStyle = '#d7b872'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('360°', cx, cy - 50)
  }

  // 大 n 时画参考轴线
  if (n > 60) {
    const axes = [0, 90, 180, 270]
    for (const deg of axes) {
      const rad = (deg - 90) * Math.PI / 180
      ctx.beginPath()
      ctx.moveTo(cx + R * 0.15 * Math.cos(rad), cy + R * 0.15 * Math.sin(rad))
      ctx.lineTo(cx + R * Math.cos(rad), cy + R * Math.sin(rad))
      ctx.strokeStyle = 'rgba(200, 162, 232, 0.35)'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  }

  // 中心点
  ctx.beginPath()
  ctx.arc(cx, cy, 3, 0, 2 * Math.PI)
  ctx.fillStyle = '#c8a2e8'
  ctx.fill()

  // 顶点
  const maxDots = Math.min(n, 60)
  for (let i = 0; i < maxDots; i++) {
    ctx.beginPath()
    ctx.arc(pts[i].x, pts[i].y, 2.5, 0, 2 * Math.PI)
    ctx.fillStyle = '#c8a2e8'
    ctx.fill()
  }

  // n=360 时标注关键因子刻度
  if (n === 360) {
    const factors = [3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36, 40, 45, 60, 72, 90, 120, 180]
    ctx.font = '9px "Segoe UI", sans-serif'
    ctx.fillStyle = 'rgba(200, 162, 232, 0.5)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (const f of factors) {
      const tick = 360 / f
      for (let k = 0; k < f; k++) {
        const rad = start + k * tick * Math.PI / 180
        const inner = R - 4
        ctx.beginPath()
        ctx.moveTo(cx + inner * Math.cos(rad), cy + inner * Math.sin(rad))
        ctx.lineTo(cx + R * Math.cos(rad), cy + R * Math.sin(rad))
        ctx.strokeStyle = 'rgba(215, 184, 114, 0.3)'
        ctx.lineWidth = 0.8
        ctx.stroke()
      }
    }
    ctx.font = '11px "Segoe UI", sans-serif'
    ctx.fillStyle = 'rgba(215, 184, 114, 0.6)'
    ctx.fillText('↕ 360 的因子刻度（3/4/5/6/8/9/10/12…）', cx, cy + 40)
  }

  // 标注
  ctx.font = '13px "Segoe UI", sans-serif'
  ctx.fillStyle = '#d9ceaf'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'bottom'
  ctx.fillText('正 ' + n + ' 边形  |  中心角 ' + centerAngle.value, 15, 488)

  // 大 n 时标注 ≈ 圆
  if (n >= 120) {
    ctx.font = 'bold 14px "Segoe UI", sans-serif'
    ctx.fillStyle = '#d7b872'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('正' + n + '边形 ≈ 圆', cx, cy + R + 50)
  }

  ctx.font = 'bold 15px "Segoe UI", sans-serif'
  ctx.fillStyle = '#c8a2e8'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('← 正' + n + '边形 = ' + n + ' 进制 →', cx, cy + R + 20)
}

watch(nVal, (v) => draw(v))
onMounted(() => draw(nVal.value))
</script>

<style scoped>
.viz-display {
  padding-bottom: 0.75rem;
}
</style>
