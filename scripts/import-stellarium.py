#!/usr/bin/env python3
"""
从 Stellarium 官方中国星官数据 + SIMBAD 生成 mansionStars.ts

═══════════════════════════════════════════════════════════════
 数据源:
  1. Stellarium chinese sky culture (GitHub)
     https://github.com/Stellarium/stellarium-skycultures/tree/master/chinese
     · index.json: 星官 lines 拓扑(用 HIP 编号)
     · common_names: 特殊星的额外名字
  2. SIMBAD ICRS J2000 批量查询
     · sim-script API 一次拿 160 颗 HIP 的坐标+星等

 生成流程:
  1. 下载 index.json
  2. 从 constellations 段筛出 28 宿相关的 34 个 star officials
  3. 收集所有 HIP,批量向 SIMBAD 查坐标
  4. 生成 TS 数据文件

 使用方式:
  cd scripts/
  python import-stellarium.py > ../src/data/mansionStars.ts
═══════════════════════════════════════════════════════════════
"""

import json
import io
import os
import re
import sys
import urllib.request
import urllib.parse
from pathlib import Path

# ── 目录:脚本相对路径 ──
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / 'stellarium-data'
DATA_DIR.mkdir(exist_ok=True)

INDEX_URL = 'https://raw.githubusercontent.com/Stellarium/stellarium-skycultures/master/chinese/index.json'
SIMBAD_URL = 'https://simbad.cds.unistra.fr/simbad/sim-script'

# ── 常量 ──
MANSIONS_ORDER = [
    '角','亢','氐','房','心','尾','箕',       # 东青龙
    '斗','牛','女','虚','危','室','壁',       # 北玄武
    '奎','娄','胃','昴','毕','觜','参',       # 西白虎
    '井','鬼','柳','星','张','翼','轸',       # 南朱雀
]

MANSION_ENG_MAP = {
    'Horn': '角', 'Neck': '亢', 'Root': '氐', 'Room': '房',
    'Heart': '心', 'Tail': '尾', 'Winnowing Basket': '箕',
    'Dipper': '斗', 'Ox': '牛', 'Girl': '女', 'Emptiness': '虚',
    'Rooftop': '危', 'Encampment': '室', 'Wall': '壁',
    'Legs': '奎', 'Bond': '娄', 'Stomach': '胃', 'Hairy Head': '昴',
    'Net': '毕', 'Turtle Beak': '觜', 'Three Stars': '参',
    'Well': '井', 'Ghosts': '鬼', 'Willow': '柳', 'Star': '星',
    'Extended Net': '张', 'Wings': '翼', 'Chariot': '轸',
}

QUADRANT = {
    '角':'东青龙','亢':'东青龙','氐':'东青龙','房':'东青龙','心':'东青龙','尾':'东青龙','箕':'东青龙',
    '斗':'北玄武','牛':'北玄武','女':'北玄武','虚':'北玄武','危':'北玄武','室':'北玄武','壁':'北玄武',
    '奎':'西白虎','娄':'西白虎','胃':'西白虎','昴':'西白虎','毕':'西白虎','觜':'西白虎','参':'西白虎',
    '井':'南朱雀','鬼':'南朱雀','柳':'南朱雀','星':'南朱雀','张':'南朱雀','翼':'南朱雀','轸':'南朱雀',
}

COLORS = {
    '角':'#2ECC71','亢':'#27AE60','氐':'#229954','房':'#1D8348','心':'#196F3D','尾':'#145A32','箕':'#0E6251',
    '斗':'#5DADE2','牛':'#3498DB','女':'#2874A6','虚':'#1B4F72','危':'#154360','室':'#0B5345','壁':'#0E6251',
    '奎':'#D4AF37','娄':'#BCC6CC','胃':'#AEB6BF','昴':'#829AE3','毕':'#566573','觜':'#2C3E50','参':'#1C2833',
    '井':'#F5B7B1','鬼':'#F1948A','柳':'#EC7063','星':'#E74C3C','张':'#DC7633','翼':'#CA6F1E','轸':'#BA4A00',
}

NUMERALS = ['一','二','三','四','五','六','七','八','九','十',
            '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
            '二十一','二十二','二十三','二十四']


def download_stellarium_index():
    """下载 Stellarium 中国星官 index.json"""
    cache = DATA_DIR / 'stellarium-chinese-index.json'
    if cache.exists():
        print(f'[cache] {cache}', file=sys.stderr)
        return json.load(io.open(cache, encoding='utf-8'))
    print(f'[fetch] {INDEX_URL}', file=sys.stderr)
    with urllib.request.urlopen(INDEX_URL) as resp:
        data = json.loads(resp.read().decode('utf-8'))
    with open(cache, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return data


def extract_mansion_hips(index_data):
    """从 index.json 提取 28 宿的 HIP 序列 + 连线"""
    by_eng = {c['common_name']['english']: c
              for c in index_data['constellations'] if 'common_name' in c}
    mansions = {}
    for eng, cn in MANSION_ENG_MAP.items():
        if eng not in by_eng:
            raise ValueError(f'Mansion {eng} ({cn}) not found in Stellarium data')
        c = by_eng[eng]
        lines = c.get('lines', [])
        seen = set()
        hips_in_order = []
        for line in lines:
            for hip in line:
                if hip not in seen:
                    seen.add(hip)
                    hips_in_order.append(hip)
        mansions[cn] = {'english': eng, 'hips': hips_in_order, 'lines': lines}
    return mansions


def query_simbad(hips):
    """SIMBAD 批量查询 HIP 坐标+V"""
    cache = DATA_DIR / 'coords_simbad.json'
    if cache.exists():
        cached = json.load(open(cache))
        # 已缓存的 HIP
        if set(int(h) for h in cached.keys()) >= set(hips):
            print(f'[cache] {cache}', file=sys.stderr)
            return {int(h): v for h, v in cached.items()}

    script_lines = [
        'format object f1 "%IDLIST(HIP)|%COO(d;A D)|%FLUXLIST(V;F)"',
        'format display f1',
    ]
    for hip in sorted(hips):
        script_lines.append(f'query id HIP {hip}')
    script_text = '\n'.join(script_lines)

    print(f'[fetch] SIMBAD batch query for {len(hips)} stars...', file=sys.stderr)
    data = urllib.parse.urlencode({
        'submit': 'submit script',
        'script': script_text
    }).encode('utf-8')
    req = urllib.request.Request(SIMBAD_URL, data=data)
    with urllib.request.urlopen(req) as resp:
        text = resp.read().decode('utf-8')

    coords = {}
    for line in text.splitlines():
        m = re.match(r'^HIP (\d+)\|(\S+) ([+-]\S+)\|(\S*)$', line.strip())
        if m:
            hip = int(m.group(1))
            ra = float(m.group(2))
            dec = float(m.group(3))
            vs = m.group(4)
            v = float(vs) if vs else None
            coords[hip] = {'ra': ra, 'dec': dec, 'v': v}
    with open(cache, 'w') as f:
        json.dump({str(k): v for k, v in coords.items()}, f, indent=2)
    return coords


def generate_ts(mansions, coords):
    """生成 mansionStars.ts 文本"""
    parts = []
    parts.append('''/**
 * 二十八宿完整星表 · Stellarium 权威版
 *
 * ═══════════════════════════════════════════════════════════════
 *  数据来源:
 *   · Stellarium Chinese Sky Culture (GitHub 开源,经中国天文史学界校对):
 *     https://github.com/Stellarium/stellarium-skycultures/tree/master/chinese
 *   · 恒星坐标 + V 星等:SIMBAD ICRS J2000,通过 HIP 编号批量查询
 *   · 连线拓扑:Stellarium 原生 lines 定义(每宿的星官连线)
 *
 *  ⚠️ 本文件由脚本自动生成,勿手动编辑
 *     生成源: scripts/import-stellarium.py
 * ═══════════════════════════════════════════════════════════════
 */

export interface MansionAsterismStar {
  /** 中文星名(如"角宿一"、"参宿四") */
  cnName: string
  /** HIP 编号 */
  bayer: string
  /** J2000 赤经(度) */
  raJ2000: number
  /** J2000 赤纬(度) */
  decJ2000: number
  /** V-band 视星等 */
  mag: number
}

export interface MansionAsterism {
  /** 宿名 */
  label: string
  /** 四象归属 */
  quadrant: '东青龙' | '北玄武' | '西白虎' | '南朱雀'
  /** 四象配色 */
  color: string
  /** 星官内所有星,第一颗为距星 */
  stars: readonly MansionAsterismStar[]
  /** 星官内连线(索引对,指向 stars[]) */
  connections: readonly (readonly [number, number])[]
}
''')

    for label in MANSIONS_ORDER:
        m = mansions[label]
        hips = m['hips']
        lines = m['lines']
        hip_to_idx = {h: i for i, h in enumerate(hips)}

        star_rows = []
        for i, hip in enumerate(hips):
            c = coords.get(hip)
            if not c:
                print(f'[warn] HIP {hip} ({label}宿{NUMERALS[i]}) missing coords', file=sys.stderr)
                continue
            v = c['v'] if c['v'] is not None else 5.5
            num = NUMERALS[i] if i < len(NUMERALS) else str(i + 1)
            star_rows.append(
                f"    {{ cnName: '{label}宿{num}', bayer: 'HIP {hip}', "
                f"raJ2000: {c['ra']:.4f}, decJ2000: {c['dec']:.4f}, mag: {v} }}"
            )

        conn_pairs = []
        for line in lines:
            for k in range(len(line) - 1):
                a = hip_to_idx.get(line[k])
                b = hip_to_idx.get(line[k + 1])
                if a is not None and b is not None:
                    conn_pairs.append(f'[{a}, {b}]')

        parts.append(f'''const {label}: MansionAsterism = {{
  label: '{label}',
  quadrant: '{QUADRANT[label]}',
  color: '{COLORS[label]}',
  stars: [
{',\n'.join(star_rows)}
  ],
  connections: [{', '.join(conn_pairs)}]
}}
''')

    parts.append(f'''/* ═══════════════════════════════════════════════════════════════
 *  统一导出(按赤经环绕顺序:东青龙→北玄武→西白虎→南朱雀)
 * ═══════════════════════════════════════════════════════════════ */

export const MANSION_ASTERISMS: readonly MansionAsterism[] = [
  {', '.join(MANSIONS_ORDER)}
] as const
''')

    return '\n'.join(parts)


def main():
    print('=== Stellarium → mansionStars.ts generator ===', file=sys.stderr)

    idx = download_stellarium_index()
    print(f'[info] Loaded {len(idx["constellations"])} constellations', file=sys.stderr)

    mansions = extract_mansion_hips(idx)
    all_hips = sorted({h for m in mansions.values() for h in m['hips']})
    print(f'[info] {len(mansions)} mansions, {len(all_hips)} unique HIPs', file=sys.stderr)

    with open(DATA_DIR / 'mansions_hip.json', 'w', encoding='utf-8') as f:
        json.dump(mansions, f, ensure_ascii=False, indent=2)

    coords = query_simbad(all_hips)
    missing = [h for h in all_hips if h not in coords]
    if missing:
        print(f'[warn] {len(missing)} HIPs missing from SIMBAD: {missing}', file=sys.stderr)

    ts = generate_ts(mansions, coords)

    # 用二进制方式写 UTF-8,避免 Windows GBK 干扰
    out_path = SCRIPT_DIR.parent / 'src' / 'data' / 'mansionStars.ts'
    with open(out_path, 'wb') as f:
        f.write(ts.encode('utf-8'))

    total = sum(len(m['hips']) for m in mansions.values())
    print(f'[done] Wrote {out_path} ({total} stars total)', file=sys.stderr)
    for label in MANSIONS_ORDER:
        n_stars = len(mansions[label]['hips'])
        n_lines = sum(len(l) - 1 for l in mansions[label]['lines'])
        print(f'   {label}: {n_stars} stars, {n_lines} line-segments', file=sys.stderr)


if __name__ == '__main__':
    main()
