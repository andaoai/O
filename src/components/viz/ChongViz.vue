<template>
  <div class="viz-card">
    <canvas ref="canvas" width="500" height="500" class="viz-canvas"></canvas>
    <div class="color-legend">
      <span style="color:#c8a2e8;">子↔午</span>
      <span style="color:#d7b872;">丑↔未</span>
      <span style="color:#8ab8d4;">寅↔申</span>
      <span style="color:#7cbf8a;">卯↔酉</span>
      <span style="color:#d48a8a;">辰↔戌</span>
      <span style="color:#d4a868;">巳↔亥</span>
    </div>
    <p class="viz-footnote">
      六冲：十二地支中相距 6 段的对位组合，每对相隔 180°（正十二边形的直径）
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import './viz-theme.css'

const canvas = ref<HTMLCanvasElement>()

const pairs = [
  { a: 0, b: 6, color: '#c8a2e8', label: '子↔午' },
  { a: 1, b: 7, color: '#d7b872', label: '丑↔未' },
  { a: 2, b: 8, color: '#8ab8d4', label: '寅↔申' },
  { a: 3, b: 9, color: '#7cbf8a', label: '卯↔酉' },
  { a: 4, b: 10, color: '#d48a8a', label: '辰↔戌' },
  { a: 5, b: 11, color: '#d4a868', label: '巳↔亥' },
]

function draw() {
  const cvs = canvas.value
  if (!cvs) return
  const ctx = cvs.getContext('2d')
  if (!ctx) return
  const W = 500, H = 500, cx = 250, cy = 250, R = 200

  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#100822'
  ctx.fillRect(0, 0, W, H)

  const n = 12
  const angle = (2 * Math.PI) / n
  const start = -Math.PI / 2
  const diZhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < n; i++) {
    pts.push({
      x: cx + R * Math.cos(start + i * angle),
      y: cy + R * Math.sin(start + i * angle),
    })
  }

  // 外圆
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, 2 * Math.PI)
  ctx.strokeStyle = '#4a2c7a'
  ctx.lineWidth = 1
  ctx.setLineDash([3, 5])
  ctx.stroke()
  ctx.setLineDash([])

  // 十二边形淡线
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < n; i++) ctx.lineTo(pts[i].x, pts[i].y)
  ctx.closePath()
  ctx.strokeStyle = 'rgba(200,162,232,0.12)'
  ctx.lineWidth = 1
  ctx.stroke()

  // 六冲直径线
  for (const p of pairs) {
    ctx.beginPath()
    ctx.moveTo(pts[p.a].x, pts[p.a].y)
    ctx.lineTo(pts[p.b].x, pts[p.b].y)
    ctx.strokeStyle = p.color
    ctx.lineWidth = 2.5
    ctx.stroke()

    // 光晕
    ctx.beginPath()
    ctx.moveTo(pts[p.a].x, pts[p.a].y)
    ctx.lineTo(pts[p.b].x, pts[p.b].y)
    ctx.strokeStyle = p.color + '33'
    ctx.lineWidth = 8
    ctx.stroke()

    // 端点高亮
    for (const idx of [p.a, p.b]) {
      ctx.beginPath()
      ctx.arc(pts[idx].x, pts[idx].y, 5, 0, 2 * Math.PI)
      ctx.fillStyle = p.color
      ctx.fill()
      ctx.beginPath()
      ctx.arc(pts[idx].x, pts[idx].y, 8, 0, 2 * Math.PI)
      ctx.fillStyle = p.color + '44'
      ctx.fill()
    }
  }

  // 地支文字
  ctx.font = 'bold 17px "Segoe UI", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let i = 0; i < n; i++) {
    let color = '#4a2c7a'
    for (const p of pairs) {
      if (p.a === i || p.b === i) { color = p.color; break }
    }
    ctx.fillStyle = color
    const lr = R - 34
    const lx = cx + lr * Math.cos(start + i * angle)
    const ly = cy + lr * Math.sin(start + i * angle)
    ctx.fillText(diZhi[i], lx, ly)
  }

  // 中心点
  ctx.beginPath()
  ctx.arc(cx, cy, 3, 0, 2 * Math.PI)
  ctx.fillStyle = '#c8a2e8'
  ctx.fill()

  // 180° 弧
  ctx.beginPath()
  ctx.arc(cx, cy, 22, start, start + Math.PI)
  ctx.strokeStyle = 'rgba(215,184,114,0.5)'
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.font = '12px "Segoe UI", sans-serif'
  ctx.fillStyle = 'rgba(215,184,114,0.6)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('180°', cx, cy + 30)
}

onMounted(() => draw())
</script>
