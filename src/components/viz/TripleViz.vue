<template>
  <div class="viz-card">
    <canvas ref="canvas" width="500" height="500" class="viz-canvas"></canvas>
    <div class="color-legend">
      <span style="color:#8ab8d4;">申子辰·合水</span>
      <span style="color:#7cbf8a;">亥卯未·合木</span>
      <span style="color:#d48a8a;">寅午戌·合火</span>
      <span style="color:#d4a868;">巳酉丑·合金</span>
    </div>
    <p class="viz-footnote">
      正十二边形中的四个三合局：相隔 4 段取顶点构成正三角形
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import './viz-theme.css'

const canvas = ref<HTMLCanvasElement>()

const triples = [
  { idx: [8, 0, 4], stroke: '#8ab8d4', fill: 'rgba(138,184,212,0.15)', name: '水' },  // 申(8)→子(0)→辰(4)
  { idx: [11, 3, 7], stroke: '#7cbf8a', fill: 'rgba(124,191,138,0.15)', name: '木' }, // 亥(11)→卯(3)→未(7)
  { idx: [2, 6, 10], stroke: '#d48a8a', fill: 'rgba(212,138,138,0.15)', name: '火' }, // 寅(2)→午(6)→戌(10)
  { idx: [5, 9, 1], stroke: '#d4a868', fill: 'rgba(212,168,104,0.15)', name: '金' },  // 巳(5)→酉(9)→丑(1)
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
  ctx.moveTo(pts[0]!.x, pts[0]!.y)
  for (let i = 1; i < n; i++) ctx.lineTo(pts[i]!.x, pts[i]!.y)
  ctx.closePath()
  ctx.strokeStyle = 'rgba(200,162,232,0.15)'
  ctx.lineWidth = 1
  ctx.stroke()

  // 三合三角形
  for (const t of triples) {
    ctx.beginPath()
    ctx.moveTo(pts[t.idx[0]!]!.x, pts[t.idx[0]!]!.y)
    ctx.lineTo(pts[t.idx[1]!]!.x, pts[t.idx[1]!]!.y)
    ctx.lineTo(pts[t.idx[2]!]!.x, pts[t.idx[2]!]!.y)
    ctx.closePath()
    ctx.fillStyle = t.fill
    ctx.fill()
    ctx.strokeStyle = t.stroke
    ctx.lineWidth = 2.5
    ctx.stroke()
  }

  // 地支文字
  ctx.font = 'bold 16px "Segoe UI", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let i = 0; i < n; i++) {
    const lr = R - 30
    const lx = cx + lr * Math.cos(start + i * angle)
    const ly = cy + lr * Math.sin(start + i * angle)

    let inTriple = false
    for (const t of triples) {
      if (t.idx.includes(i)) {
        ctx.fillStyle = t.stroke
        inTriple = true
        break
      }
    }
    if (!inTriple) ctx.fillStyle = '#4a2c7a'
    ctx.fillText(diZhi[i]!, lx, ly)
  }

  // 顶点
  for (let i = 0; i < n; i++) {
    let color = '#4a2c7a'
    for (const t of triples) {
      if (t.idx.includes(i)) { color = t.stroke; break }
    }
    ctx.beginPath()
    ctx.arc(pts[i]!.x, pts[i]!.y, 3, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.fill()
  }

  // 中心点
  ctx.beginPath()
  ctx.arc(cx, cy, 3, 0, 2 * Math.PI)
  ctx.fillStyle = '#c8a2e8'
  ctx.fill()
}

onMounted(() => draw())
</script>
