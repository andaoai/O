/**
 * 把 Natural Earth 110m coastline GeoJSON 转成紧凑的 TS 数据模块。
 *
 * 输入：/tmp/coastline.geojson  (Feature Collection with LineString geometries)
 * 输出：src/data/worldCoastline.ts
 *
 * 数据结构：
 *   COASTLINES: number[][][]  ← 每条线 = 数组 of [lon, lat]，用数字数组比对象数组小
 *   坐标精度保留 1 位小数（约 11km，够用）
 *
 * 运行：node scripts/convertCoastline.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'

const INPUT = 'C:/Users/andao/AppData/Local/Temp/coastline.geojson'
const OUTPUT = 'src/data/worldCoastline.ts'

const raw = JSON.parse(readFileSync(INPUT, 'utf8'))
const lines = []

for (const feature of raw.features) {
  const geom = feature.geometry
  if (!geom) continue
  if (geom.type === 'LineString') {
    lines.push(compact(geom.coordinates))
  } else if (geom.type === 'MultiLineString') {
    for (const line of geom.coordinates) {
      lines.push(compact(line))
    }
  }
}

function compact(coords) {
  // 保留 1 位小数，节省一半以上体积；去重相邻重复点
  const out = []
  let last = null
  for (const [lon, lat] of coords) {
    const rlon = Math.round(lon * 10) / 10
    const rlat = Math.round(lat * 10) / 10
    if (last && last[0] === rlon && last[1] === rlat) continue
    out.push([rlon, rlat])
    last = [rlon, rlat]
  }
  return out
}

const totalPoints = lines.reduce((s, l) => s + l.length, 0)

const body = `/**
 * Natural Earth 110m 世界海岸线数据 (public domain)
 *
 * 数据源: https://www.naturalearthdata.com/downloads/110m-physical-vectors/
 *         → ne_110m_coastline.geojson (martynafford/natural-earth-geojson mirror)
 *
 * 结构: number[][][]
 *   [ line0, line1, ... ]
 *   line = [ [lon, lat], [lon, lat], ... ]
 *
 * 精度: 经纬度保留 1 位小数 (~11 km),对于极方位等距投影下的
 *       圆盘绘制完全够用,压缩后 <100 KB。
 *
 * 数量: ${lines.length} 条线,共 ${totalPoints} 个点
 *
 * 生成: scripts/convertCoastline.mjs (勿手动编辑)
 */

export type LonLat = [number, number]
export type CoastlinePath = LonLat[]

export const COASTLINES: CoastlinePath[] = ${JSON.stringify(lines)}
`

writeFileSync(OUTPUT, body)
console.log(`✔ 生成 ${OUTPUT}`)
console.log(`  ${lines.length} 条线, ${totalPoints} 个点`)
console.log(`  文件大小: ${(body.length / 1024).toFixed(1)} KB`)
