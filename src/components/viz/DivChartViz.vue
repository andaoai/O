<template>
  <div class="viz-card">
    <canvas ref="canvas" width="500" height="300" class="viz-canvas" style="aspect-ratio:500/300;"></canvas>
    <p class="viz-footnote">
      ◆ 亮紫 = 可以整除 360° · ◇ 暗紫 = 不能整除 360°
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import './viz-theme.css'

const canvas = ref<HTMLCanvasElement>()

function draw() {
  const cvs = canvas.value
  if (!cvs) return
  const ctx = cvs.getContext('2d')
  if (!ctx) return
  const W = 500, H = 300, cx = 250, cy = 150, R = 120
  const maxN = 20

  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#100822'
  ctx.fillRect(0, 0, W, H)

  const angleStep = (2 * Math.PI) / maxN
  const start = -Math.PI / 2
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < maxN; i++) {
    pts.push({
      x: cx + R * Math.cos(start + i * angleStep),
      y: cy + R * Math.sin(start + i * angleStep),
    })
  }

  // 连接线
  for (let i = 0; i < maxN; i++) {
    const nn = i + 1
    const yes = 360 % nn === 0
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(pts[i]!.x, pts[i]!.y)
    ctx.strokeStyle = yes ? 'rgba(200, 162, 232, 0.5)' : 'rgba(74, 44, 122, 0.5)'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  // 点 + 标签
  for (let i = 0; i < maxN; i++) {
    const nn = i + 1
    const yes = 360 % nn === 0
    ctx.beginPath()
    ctx.arc(pts[i]!.x, pts[i]!.y, 4, 0, 2 * Math.PI)
    ctx.fillStyle = yes ? '#c8a2e8' : '#4a2c7a'
    ctx.fill()

    ctx.font = '11px "Segoe UI", sans-serif'
    ctx.fillStyle = yes ? '#c8a2e8' : '#4a2c7a'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const lr = R + 20
    const lx = cx + lr * Math.cos(start + i * angleStep)
    const ly = cy + lr * Math.sin(start + i * angleStep)
    ctx.fillText('n=' + nn, lx, ly)
  }

  // 中心点
  ctx.beginPath()
  ctx.arc(cx, cy, 3, 0, 2 * Math.PI)
  ctx.fillStyle = '#c8a2e8'
  ctx.fill()

  // 外圆
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, 2 * Math.PI)
  ctx.strokeStyle = '#4a2c7a'
  ctx.lineWidth = 1
  ctx.setLineDash([3, 5])
  ctx.stroke()
  ctx.setLineDash([])

  // 脚注
  ctx.font = '13px "Segoe UI", sans-serif'
  ctx.fillStyle = '#d9ceaf'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillText('n=1~20: 哪些正多边形可以整除 360° ?', cx, 290)
}

onMounted(() => draw())
</script>

<style scoped>
.viz-card {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
