#!/usr/bin/env node

/**
 * 导入全部 283 中国星官（318 Stellarium entries）→ chineseStarCatalog.ts
 *
 * ═══════════════════════════════════════════════════════════════
 *  数据源:
 *    1. Stellarium Chinese Sky Culture index.json（已缓存的）
 *    2. SIMBAD ICRS J2000 批量查询（HIP 编号→坐标+星等）
 *
 *  输出: src/data/chineseStarCatalog.ts
 *    包含全部 318 星官条目, 约 1385 唯一 HIP 星, 约 1464 星实例。
 *
 *  用法:
 *    node scripts/import-full-catalog.mjs
 * ═══════════════════════════════════════════════════════════════
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import https from 'https'
import querystring from 'querystring'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCRIPT_DIR = __dirname
const DATA_DIR = path.join(SCRIPT_DIR, 'stellarium-data')
const CACHE_FILE = path.join(DATA_DIR, 'coords_full.json')
const INDEX_FILE = path.join(DATA_DIR, 'stellarium-chinese-index.json')
const OUTPUT_FILE = path.join(SCRIPT_DIR, '..', 'src', 'data', 'chineseStarCatalog.ts')

// ── 二十八宿按赤经顺序（与 mansionStars.ts 对齐） ──
const MANSIONS_ORDER = [
  '角', '亢', '氐', '房', '心', '尾', '箕',
  '斗', '牛', '女', '虚', '危', '室', '壁',
  '奎', '娄', '胃', '昴', '毕', '觜', '参',
  '井', '鬼', '柳', '星', '张', '翼', '轸',
]

const QUADRANT = {
  '角': '东青龙', '亢': '东青龙', '氐': '东青龙', '房': '东青龙',
  '心': '东青龙', '尾': '东青龙', '箕': '东青龙',
  '斗': '北玄武', '牛': '北玄武', '女': '北玄武', '虚': '北玄武',
  '危': '北玄武', '室': '北玄武', '壁': '北玄武',
  '奎': '西白虎', '娄': '西白虎', '胃': '西白虎', '昴': '西白虎',
  '毕': '西白虎', '觜': '西白虎', '参': '西白虎',
  '井': '南朱雀', '鬼': '南朱雀', '柳': '南朱雀', '星': '南朱雀',
  '张': '南朱雀', '翼': '南朱雀', '轸': '南朱雀',
}

const COLORS = {
  '角': '#2ECC71', '亢': '#27AE60', '氐': '#229954', '房': '#1D8348',
  '心': '#196F3D', '尾': '#145A32', '箕': '#0E6251',
  '斗': '#5DADE2', '牛': '#3498DB', '女': '#2874A6', '虚': '#1B4F72',
  '危': '#154360', '室': '#0B5345', '壁': '#0E6251',
  '奎': '#D4AF37', '娄': '#BCC6CC', '胃': '#AEB6BF', '昴': '#829AE3',
  '毕': '#566573', '觜': '#2C3E50', '参': '#1C2833',
  '井': '#F5B7B1', '鬼': '#F1948A', '柳': '#EC7063', '星': '#E74C3C',
  '张': '#DC7633', '翼': '#CA6F1E', '轸': '#BA4A00',
}

// 二十八宿英文名→中文名映射（补充 Stellarium 数据中缺失的 native 字段）
const MANSION_ENGLISH_TO_CHINESE = {
  'Horn': '角宿', 'Neck': '亢宿', 'Root': '氐宿', 'Room': '房宿',
  'Heart': '心宿', 'Tail': '尾宿', 'Winnowing Basket': '箕宿',
  'Dipper': '斗宿', 'Ox': '牛宿', 'Girl': '女宿', 'Emptiness': '虚宿',
  'Rooftop': '危宿', 'Encampment': '室宿', 'Wall': '壁宿',
  'Legs': '奎宿', 'Bond': '娄宿', 'Stomach': '胃宿', 'Hairy Head': '昴宿',
  'Net': '毕宿', 'Turtle Beak': '觜宿', 'Three Stars': '参宿',
  'Well': '井宿', 'Ghosts': '鬼宿', 'Willow': '柳宿', 'Star': '星宿',
  'Extended Net': '张宿', 'Wings': '翼宿', 'Chariot': '轸宿',
}

/** 解析星官 native 字段 → 纯宿名（去掉后缀"宿"/"垣"） */
function mansionNameFromNative(native, english) {
  if (!native) {
    // 查英文名映射
    const cn = MANSION_ENGLISH_TO_CHINESE[english]
    if (cn) return cn.replace('宿', '')
    return null
  }
  // 宿星官："毕宿" → "毕"
  let m = native.match(/^(.+)宿$/)
  if (m) return m[1]
  // 垣墙："紫微右垣" → 非宿，返回 null
  return null
}

/** 获取星官的中文展示名 */
function asterismNativeName(native, english) {
  if (native) return native
  // 查英文名→中文名映射
  const cn = MANSION_ENGLISH_TO_CHINESE[english]
  if (cn) return cn
  return english
}

// ── 1. 读取 Stellarium index.json ──
function loadIndex() {
  const raw = fs.readFileSync(INDEX_FILE, 'utf-8')
  return JSON.parse(raw)
}

// ── 2. 收集所有唯一 HIP ──
function collectHips(data) {
  const hips = new Set()
  for (const con of data.constellations || []) {
    for (const line of con.lines || []) {
      for (const hip of line) {
        hips.add(hip)
      }
    }
  }
  return [...hips].sort((a, b) => a - b)
}

// ── 3. SIMBAD 批量查询（带缓存） ──
function querySimbadBatch(hips, batchSize = 200) {
  const allResults = {}

  // 优先加载缓存
  if (fs.existsSync(CACHE_FILE)) {
    const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'))
    for (const [k, v] of Object.entries(cached)) {
      allResults[parseInt(k)] = v
    }
    console.log(`[cache] loaded ${Object.keys(cached).length} cached coordinates`)
  }

  const needed = hips.filter(h => !allResults[h])
  if (needed.length === 0) {
    console.log('[cache] all HIPs already cached, skipping SIMBAD query')
    return allResults
  }
  console.log(`[fetch] need ${needed.length} HIPs from SIMBAD (${hips.length - needed.length} cached)`)

  // 分批查询
  const promisify = (batchHips) => {
    return new Promise((resolve, reject) => {
      const lines = [
        'format object f1 "%IDLIST(HIP)|%COO(d;A D)|%FLUXLIST(V;F)"',
        'format display f1',
      ]
      for (const h of batchHips) lines.push(`query id HIP ${h}`)
      const script = lines.join('\n')
      const postData = querystring.stringify({ submit: 'submit script', script })

      const options = {
        hostname: 'simbad.cds.unistra.fr',
        path: '/simbad/sim-script',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }

      const req = https.request(options, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          const re = /^HIP (\d+)\|(\S+) ([+-]\S+)\|(\S*)$/gm
          let m
          while ((m = re.exec(data)) !== null) {
            const hip = parseInt(m[1])
            allResults[hip] = {
              ra: parseFloat(m[2]),
              dec: parseFloat(m[3]),
              v: m[4] ? parseFloat(m[4]) : null,
            }
          }
          resolve()
        })
      })
      req.on('error', reject)
      req.write(postData)
      req.end()
    })
  }

  // 顺序执行批次
  return (async () => {
    for (let i = 0; i < needed.length; i += batchSize) {
      const batch = needed.slice(i, i + batchSize)
      process.stderr.write(`\r[fetch] SIMBAD batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(needed.length / batchSize)} (${batch.length} HIPs)...`)
      await promisify(batch)
      // 每批保存缓存
      fs.writeFileSync(CACHE_FILE, JSON.stringify(allResults, null, 2))
    }
    console.log(`\n[fetch] done, total ${Object.keys(allResults).length} HIPs`)
    return allResults
  })()
}

// ── 4. 计算二十八宿赤经区间（使用距星边界） ──
//
// 传统方法：每宿的"距星"（首星）定义该宿的起始赤经。
// 宿 N 的范围 = [距星_RA_N, 距星_RA_{N+1})
// 最后一个宿（轸）的范围 = [距星_RA_轸, 距星_RA_角 + 360)
//
// 距星 = 每宿第一条 line 的第一个 HIP（Stellarium 约定）

function computeMansionRanges(data, coordMap) {
  // 收集每宿的距星 RA
  const distStarRa = {}
  for (const con of data.constellations || []) {
    const native = con.common_name?.native || ''
    const english = con.common_name?.english || ''
    const mName = mansionNameFromNative(native, english)
    if (mName && MANSIONS_ORDER.includes(mName) && con.lines && con.lines.length > 0) {
      const firstHip = con.lines[0][0]
      const c = coordMap[firstHip]
      if (c) distStarRa[mName] = c.ra
    }
  }

  // 按距星 RA 排序,建区间
  const sorted = MANSIONS_ORDER.filter(m => distStarRa[m] !== undefined)
    .sort((a, b) => distStarRa[a] - distStarRa[b])
  // 取排序后的索引：实际上是按 RA 顺序重排后的 MANSIONS_ORDER
  const ranges = []
  for (let i = 0; i < MANSIONS_ORDER.length; i++) {
    const mansion = MANSIONS_ORDER[i]
    const ra = distStarRa[mansion]
    if (ra === undefined) {
      // 距星缺失时用 centroid 替代
      const stars = buildMansionStarsMap(data, coordMap)[mansion]
      const centroid = stars ? stars.reduce((s, x) => s + x.ra, 0) / stars.length : 0
      ranges.push({ mansion, minRa: centroid, maxRa: centroid, centroidRa: centroid })
      continue
    }
    // 宿 N 的终点 = 宿 N+1 的距星 RA
    const nextMansion = MANSIONS_ORDER[(i + 1) % MANSIONS_ORDER.length]
    const nextRa = distStarRa[nextMansion]
    let maxRa
    if (nextRa !== undefined) {
      maxRa = nextRa > ra ? nextRa : nextRa + 360
    } else {
      maxRa = ra + 30 // 回退：30° 宽
    }
    ranges.push({ mansion, minRa: ra, maxRa, centroidRa: (ra + maxRa) / 2 })
  }

  return ranges
}

// ── 5. 分配星官到宿 ──
function assignMansion(asterism, mansionRanges, mansionStarsMap) {
  const native = asterism.common_name?.native || ''
  const english = asterism.common_name?.english || ''

  // 检查是否是宿星官
  const mName = mansionNameFromNative(native, english)
  if (mName && MANSIONS_ORDER.includes(mName)) {
    const idx = MANSIONS_ORDER.indexOf(mName)
    return { mansionIndex: idx, mansionLabel: mName, type: 'mansion', enclosure: null, quadrant: QUADRANT[mName], color: COLORS[mName] }
  }

  // 检查是否是三垣墙（精确白名单）
  const ENCLOSURE_WALLS = ['Purple Forbidden Left Wall', 'Purple Forbidden Right Wall',
    'Supreme Palace Left Wall', 'Supreme Palace Right Wall',
    'Heavenly Market Left Wall', 'Heavenly Market Right Wall']
  if (ENCLOSURE_WALLS.includes(english)) {
    let enclosure = '紫微垣'
    if (english.includes('Supreme Palace')) enclosure = '太微垣'
    if (english.includes('Heavenly Market')) enclosure = '天市垣'
    const ra = asterismStarsCentroid(asterism, mansionStarsMap)
    const idx = findMansionByRa(ra, mansionRanges)
    return { mansionIndex: idx, mansionLabel: idx >= 0 ? MANSIONS_ORDER[idx] : null, type: 'enclosure', enclosure, quadrant: idx >= 0 ? QUADRANT[MANSIONS_ORDER[idx]] : null, color: '#9370DB' }
  }

  // 检查是否是三垣内的附属星官（名字带"垣"但不是墙本身）
  // 如"从官(太微垣)"、"三公(紫微垣)" → 按普通星官处理

  // 检查特殊星官
  if (english === 'Northern Dipper') {
    return { mansionIndex: -1, mansionLabel: null, type: 'special', note: '北斗', color: '#FFFFFF' }
  }
  if (english === 'Northern Pole') {
    return { mansionIndex: -1, mansionLabel: null, type: 'special', note: '北极', color: '#F4D580' }
  }

  // 普通星官：按赤经分配
  const ra = asterismStarsCentroid(asterism, mansionStarsMap)
  const idx = findMansionByRa(ra, mansionRanges)
  const label = idx >= 0 ? MANSIONS_ORDER[idx] : null
  return { mansionIndex: idx, mansionLabel: label, type: 'sub', quadrant: idx >= 0 ? QUADRANT[label] : null, color: idx >= 0 ? COLORS[label] : '#888888' }
}

function asterismStarsCentroid(asterism, coordMap) {
  let sum = 0, count = 0
  for (const line of asterism.lines || []) {
    for (const hip of line) {
      const c = coordMap[hip]
      if (c) { sum += c.ra; count++ }
    }
  }
  return count > 0 ? sum / count : 0
}

function findMansionByRa(ra, mansionRanges) {
  let raNorm = ra
  for (let i = 0; i < mansionRanges.length; i++) {
    const r = mansionRanges[i]
    let minRa = r.minRa, maxRa = r.maxRa
    // 处理跨 0° 宿
    if (minRa > maxRa) maxRa += 360
    let testRa = raNorm
    if (raNorm < minRa && maxRa > 360) testRa += 360
    if (testRa >= minRa && testRa <= maxRa) return i
    // 边界检查（对于距星边界）
  }
  // 容错：找最近的
  let bestIdx = 0, bestDist = Infinity
  for (let i = 0; i < mansionRanges.length; i++) {
    const dist = Math.abs(ra - mansionRanges[i].centroidRa)
    if (dist < bestDist) { bestDist = dist; bestIdx = i }
  }
  return bestIdx
}

// 收集宿星官的所有星坐标（用于计算区间）
function buildMansionStarsMap(data, coordMap) {
  const byMansion = {}
  for (const con of data.constellations || []) {
    const native = con.common_name?.native || ''
    const english = con.common_name?.english || ''
    const mName = mansionNameFromNative(native, english)
    if (mName && MANSIONS_ORDER.includes(mName)) {
      const stars = []
      const seenHips = new Set()
      for (const line of con.lines || []) {
        for (const hip of line) {
          if (!seenHips.has(hip) && coordMap[hip]) {
            seenHips.add(hip)
            stars.push(coordMap[hip])
          }
        }
      }
      if (stars.length > 0) byMansion[mName] = stars
    }
  }
  return byMansion
}

// ── 6. 生成 TypeScript 文件 ──
function generateTs(data, coordMap, classified) {
  const NUMERALS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '二十一', '二十二', '二十三', '二十四', '二十五', '二十六', '二十七', '二十八', '二十九', '三十']

  // 单引号转义（用于 TS 字符串字面量）
  const esc = (s) => (s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")

  // 统计各类型
  const stats = { mansion: 0, sub: 0, enclosure: 0, special: 0 }
  for (const c of classified) { stats[c.type]++ }

  const lines = []
  lines.push(`/**
 * 苏州石刻天文图 · 全星官数据
 *
 * ═══════════════════════════════════════════════════════════════
 *  数据来源:
 *   · Stellarium Chinese Sky Culture (GitHub 开源,经中国天文史学界校对)
 *   · 恒星坐标 + V 星等:SIMBAD ICRS J2000,通过 HIP 编号批量查询
 *   · 连线拓扑:Stellarium 原生 lines 定义
 *
 *  ⚠️ 本文件由 scripts/import-full-catalog.mjs 自动生成
 *     勿手动编辑
 *
 *  统计数据:
 *    星官总数: ${classified.length}
 *      宿星官: ${stats.mansion}
 *      附属星官: ${stats.sub}
 *      三垣/墙: ${stats.enclosure}
 *      特殊星官: ${stats.special}
 *    唯一 HIP 星: ${Object.keys(coordMap).length}
 * ═══════════════════════════════════════════════════════════════
 */

// ── 类型定义 ──

/** 单颗星 */
export interface ChineseStar {
  cnName: string
  hip: number
  raJ2000: number
  decJ2000: number
  mag: number | null
}

/** 星官类型 */
export type AsterismType = 'mansion' | 'sub' | 'enclosure' | 'special'

/** 单个星官 */
export interface ChineseAsterism {
  /** 星官中文名（如"角"、"平道"、"左枢"） */
  label: string
  /** Stellarium 英文名 */
  english: string
  /** 星官类型 */
  type: AsterismType
  /** 所属宿索引 (0-27), -1 表示无归属 */
  mansionIndex: number
  /** 所属宿名 */
  mansionLabel: string | null
  /** 三垣归属（如果有） */
  enclosure: string | null
  /** 颜色 */
  color: string
  /** 四象（如果有） */
  quadrant: string | null
  /** 本星官内所有星 */
  stars: ChineseStar[]
  /** 连线索引对（指向 stars 数组） */
  connections: readonly (readonly [number, number])[]
}

// ── 数据 ──
`)

  // 生成每个星官
  const varNames = []
  for (let i = 0; i < data.constellations.length; i++) {
    const con = data.constellations[i]
    const cls = classified[i]
    const native = con.common_name?.native || cls.english || 'unknown'
    const english = con.common_name?.english || ''
    const pronounce = con.common_name?.pronounce || ''

    // 变量名：用英文名转驼峰
    const varName = 'asterism_' + english.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
    varNames.push(varName)

    // 提取星
    const starList = []
    const hipToIdx = new Map()
    for (const line of con.lines || []) {
      for (const hip of line) {
        if (!hipToIdx.has(hip)) {
          hipToIdx.set(hip, starList.length)
          const c = coordMap[hip]
          starList.push({
            index: starList.length,
            hip,
            cnName: (() => {
            // 星名优先级: common_names 中文名 > 星官名+数字 > 英文名
            if (data.common_names && data.common_names[`HIP ${hip}`]) {
              const names = data.common_names[`HIP ${hip}`]
              const cn = names.find(n => n.chinese)
              if (cn && cn.chinese) return cn.chinese
            }
            const nativeLabel = asterismNativeName(native, english)
            return nativeLabel + (NUMERALS[starList.length] || (starList.length + 1))
          })(),
            raJ2000: c ? c.ra : 0,
            decJ2000: c ? c.dec : 0,
            mag: c ? c.v : null,
          })
        }
      }
    }

    // 提取连线
    const connSet = new Set()
    const connections = []
    for (const line of con.lines || []) {
      for (let k = 0; k < line.length - 1; k++) {
        const a = hipToIdx.get(line[k])
        const b = hipToIdx.get(line[k + 1])
        if (a !== undefined && b !== undefined) {
          const key = Math.min(a, b) + '-' + Math.max(a, b)
          if (!connSet.has(key)) {
            connSet.add(key)
            connections.push([a, b])
          }
        }
      }
    }

    lines.push(`const ${varName}: ChineseAsterism = {`)
    lines.push(`  label: '${esc(native)}',`)
    lines.push(`  english: '${esc(english)}',`)
    lines.push(`  type: '${cls.type}',`)
    lines.push(`  mansionIndex: ${cls.mansionIndex},`)
    lines.push(`  mansionLabel: ${cls.mansionLabel ? `'${esc(cls.mansionLabel)}'` : null},`)
    lines.push(`  enclosure: ${cls.enclosure ? `'${esc(cls.enclosure)}'` : null},`)
    lines.push(`  color: '${cls.color}',`)
    lines.push(`  quadrant: ${cls.quadrant ? `'${esc(cls.quadrant)}'` : null},`)
    lines.push(`  stars: [`)
    for (const s of starList) {
      const magStr = s.mag !== null ? s.mag.toFixed(3) : 'null'
      lines.push(`    { cnName: '${esc(s.cnName)}', hip: ${s.hip}, raJ2000: ${s.raJ2000.toFixed(4)}, decJ2000: ${s.decJ2000.toFixed(4)}, mag: ${magStr} },`)
    }
    lines.push(`  ],`)
    lines.push(`  connections: [`)
    for (const [a, b] of connections) {
      lines.push(`    [${a}, ${b}],`)
    }
    lines.push(`  ] as const,`)
    lines.push(`}`)
    lines.push(``)
  }

  // 导出
  lines.push(`export const CHINESE_ASTERISMS: readonly ChineseAsterism[] = [`)
  for (const vn of varNames) {
    lines.push(`  ${vn},`)
  }
  lines.push(`] as const`)
  lines.push(``)
  lines.push(`/** 二十八宿英文名→索引映射 */`)
  lines.push(`export const MANSION_ENGLISH_NAMES: Record<string, number> = {`)
  for (let i = 0; i < data.constellations.length; i++) {
    const con = data.constellations[i]
    const cls = classified[i]
    if (cls.type === 'mansion') {
      lines.push(`  '${esc(con.common_name?.english || '')}': ${cls.mansionIndex},`)
    }
  }
  lines.push(`}`)
  lines.push(``)
  lines.push(`/** 按宿索引分组的星官 */`)
  lines.push(`export const ASTERISMS_BY_MANSION: ChineseAsterism[][] = (() => {`)
  lines.push(`  const groups: ChineseAsterism[][] = Array.from({ length: 28 }, () => [])`)
  lines.push(`  for (const a of CHINESE_ASTERISMS) {`)
  lines.push(`    if (a.mansionIndex >= 0 && a.mansionIndex < 28) groups[a.mansionIndex]!.push(a)`)
  lines.push(`  }`)
  lines.push(`  return groups`)
  lines.push(`})()`)

  return lines.join('\n')
}

// 获取星名
function getStarName(asterismEnglish, hip, data) {
  // 先检查 common_names 区
  if (data.common_names && data.common_names[`HIP ${hip}`]) {
    const names = data.common_names[`HIP ${hip}`]
    const cn = names.find(n => n.chinese)
    if (cn && cn.chinese) return cn.chinese
    if (names.length > 0 && names[0].english) return names[0].english
  }
  // 退回到 "asterism+编号"
  return `${asterismEnglish}_HIP${hip}`
}

// ── 主流程 ──
async function main() {
  console.log('=== Full Chinese Star Catalog Import ===')
  console.log()

  // 1. 加载 Stellarium 数据
  console.log('[1/5] Loading Stellarium index.json...')
  const data = loadIndex()
  console.log(`  ${(data.constellations || []).length} constellation entries`)

  // 2. 收集 HIP
  console.log('[2/5] Collecting HIP IDs...')
  const allHips = collectHips(data)
  console.log(`  ${allHips.length} unique HIPs`)

  // 3. 查询 SIMBAD（带缓存）
  console.log('[3/5] Querying SIMBAD...')
  const coordMap = await querySimbadBatch(allHips)
  const found = allHips.filter(h => coordMap[h]).length
  console.log(`  ${found}/${allHips.length} HIPs resolved`)

  // 4. 计算宿区间并分类
  console.log('[4/5] Classifying asterisms...')
  const mansionRanges = computeMansionRanges(data, coordMap)
  console.log('  Mansion RA ranges (距星边界):')
  for (const mr of mansionRanges) {
    console.log(`    ${mr.mansion}: RA [${mr.minRa.toFixed(1)}°-${mr.maxRa.toFixed(1)}°] centroid ${mr.centroidRa.toFixed(1)}°`)
  }

  const classified = (data.constellations || []).map(con => assignMansion(con, mansionRanges, coordMap))
  const byType = {}
  for (const c of classified) { byType[c.type] = (byType[c.type] || 0) + 1 }
  console.log('  Classification:', byType)

  // 5. 生成输出
  console.log('[5/5] Generating chineseStarCatalog.ts...')
  const ts = generateTs(data, coordMap, classified)
  fs.writeFileSync(OUTPUT_FILE, ts, 'utf-8')
  const size = fs.statSync(OUTPUT_FILE).size
  console.log(`  Written ${(size / 1024).toFixed(0)} KB to ${OUTPUT_FILE}`)

  console.log()
  console.log('=== Done ===')
}

main().catch(e => {
  console.error('Error:', e)
  process.exit(1)
})
