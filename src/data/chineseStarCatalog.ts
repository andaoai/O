/**
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
 *    星官总数: 317
 *      宿星官: 28
 *      附属星官: 281
 *      三垣/墙: 6
 *      特殊星官: 2
 *    唯一 HIP 星: 1385
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
export type AsterismType = 'mansion' | 'sub' | 'enclosure' | 'special' | 'cluster'

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
  /** 角直径（度），仅 'cluster' 类型使用，如 M44 积尸气 = 1.6° */
  angularSizeDeg?: number
  /** 形状，仅 'cluster' 类型使用，默认 'circle' */
  shape?: 'circle' | 'ellipse'
}

// ── 数据 ──

const asterism_Net: ChineseAsterism = {
  label: '毕宿',
  english: 'Net',
  type: 'mansion',
  mansionIndex: 18,
  mansionLabel: '毕',
  enclosure: null,
  color: '#566573',
  quadrant: '西白虎',
  stars: [
    { cnName: '毕宿一', hip: 20889, raJ2000: 67.1542, decJ2000: 19.1804, mag: 3.530 },
    { cnName: '毕宿二', hip: 20648, raJ2000: 66.3724, decJ2000: 17.9279, mag: 4.298 },
    { cnName: '毕宿三', hip: 20455, raJ2000: 65.7337, decJ2000: 17.5425, mag: 3.760 },
    { cnName: '毕宿四', hip: 20205, raJ2000: 64.9483, decJ2000: 15.6276, mag: 3.650 },
    { cnName: '毕宿五', hip: 21421, raJ2000: 68.9802, decJ2000: 16.5093, mag: 0.860 },
    { cnName: '毕宿六', hip: 20885, raJ2000: 67.1437, decJ2000: 15.9623, mag: 3.840 },
    { cnName: '毕宿七', hip: 20713, raJ2000: 66.5865, decJ2000: 15.6183, mag: 4.480 },
    { cnName: '毕宿八', hip: 18724, raJ2000: 60.1701, decJ2000: 12.4903, mag: 3.410 },
    { cnName: '毕宿九', hip: 21683, raJ2000: 69.8188, decJ2000: 15.9180, mag: 4.665 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [4, 5],
    [5, 6],
    [6, 3],
    [3, 7],
    [4, 8],
  ] as const,
}

const asterism_Wall: ChineseAsterism = {
  label: '壁宿',
  english: 'Wall',
  type: 'mansion',
  mansionIndex: 13,
  mansionLabel: '壁',
  enclosure: null,
  color: '#0E6251',
  quadrant: '北玄武',
  stars: [
    { cnName: '壁宿一', hip: 1067, raJ2000: 3.3090, decJ2000: 15.1836, mag: 2.840 },
    { cnName: '壁宿二', hip: 677, raJ2000: 2.0969, decJ2000: 29.0904, mag: 2.060 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Three_Stars: ChineseAsterism = {
  label: '参宿',
  english: 'Three Stars',
  type: 'mansion',
  mansionIndex: 20,
  mansionLabel: '参',
  enclosure: null,
  color: '#1C2833',
  quadrant: '西白虎',
  stars: [
    { cnName: '参宿一', hip: 27989, raJ2000: 88.7929, decJ2000: 7.4071, mag: 0.420 },
    { cnName: '参宿二', hip: 26727, raJ2000: 85.1897, decJ2000: -1.9426, mag: 1.770 },
    { cnName: '参宿三', hip: 26311, raJ2000: 84.0534, decJ2000: -1.2019, mag: 1.690 },
    { cnName: '参宿四', hip: 25930, raJ2000: 83.0017, decJ2000: -0.2991, mag: 2.410 },
    { cnName: '参宿五', hip: 24436, raJ2000: 78.6345, decJ2000: -8.2016, mag: 0.130 },
    { cnName: '参宿六', hip: 25336, raJ2000: 81.2828, decJ2000: 6.3497, mag: 1.640 },
    { cnName: '参宿七', hip: 27366, raJ2000: 86.9391, decJ2000: -9.6696, mag: 2.060 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [3, 5],
    [1, 6],
  ] as const,
}

const asterism_Root: ChineseAsterism = {
  label: '氐宿',
  english: 'Root',
  type: 'mansion',
  mansionIndex: 2,
  mansionLabel: '氐',
  enclosure: null,
  color: '#229954',
  quadrant: '东青龙',
  stars: [
    { cnName: '氐宿一', hip: 72622, raJ2000: 222.7196, decJ2000: -16.0418, mag: 2.750 },
    { cnName: '氐宿二', hip: 74392, raJ2000: 228.0554, decJ2000: -19.7917, mag: 4.540 },
    { cnName: '氐宿三', hip: 76333, raJ2000: 233.8816, decJ2000: -14.7895, mag: 3.910 },
    { cnName: '氐宿四', hip: 74785, raJ2000: 229.2517, decJ2000: -9.3829, mag: 2.620 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Dipper: ChineseAsterism = {
  label: '斗宿',
  english: 'Dipper',
  type: 'mansion',
  mansionIndex: 7,
  mansionLabel: '斗',
  enclosure: null,
  color: '#5DADE2',
  quadrant: '北玄武',
  stars: [
    { cnName: '斗宿一', hip: 89341, raJ2000: 273.4409, decJ2000: -21.0588, mag: 3.850 },
    { cnName: '斗宿二', hip: 90496, raJ2000: 276.9927, decJ2000: -25.4217, mag: 2.810 },
    { cnName: '斗宿三', hip: 92041, raJ2000: 281.4141, decJ2000: -26.9908, mag: 3.140 },
    { cnName: '斗宿四', hip: 92855, raJ2000: 283.8164, decJ2000: -26.2967, mag: 2.067 },
    { cnName: '斗宿五', hip: 93864, raJ2000: 286.7350, decJ2000: -27.6704, mag: 3.310 },
    { cnName: '斗宿六', hip: 93506, raJ2000: 285.6530, decJ2000: -29.8801, mag: 2.590 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
  ] as const,
}

const asterism_Room: ChineseAsterism = {
  label: '房宿',
  english: 'Room',
  type: 'mansion',
  mansionIndex: 3,
  mansionLabel: '房',
  enclosure: null,
  color: '#1D8348',
  quadrant: '东青龙',
  stars: [
    { cnName: '房宿一', hip: 78820, raJ2000: 241.3593, decJ2000: -19.8055, mag: 2.620 },
    { cnName: '房宿二', hip: 78401, raJ2000: 240.0834, decJ2000: -22.6217, mag: 2.320 },
    { cnName: '房宿三', hip: 78265, raJ2000: 239.7130, decJ2000: -26.1141, mag: 2.910 },
    { cnName: '房宿四', hip: 78104, raJ2000: 239.2212, decJ2000: -29.2141, mag: 3.860 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Ghosts: ChineseAsterism = {
  label: '鬼宿',
  english: 'Ghosts',
  type: 'mansion',
  mansionIndex: 22,
  mansionLabel: '鬼',
  enclosure: null,
  color: '#F1948A',
  quadrant: '南朱雀',
  stars: [
    { cnName: '鬼宿一', hip: 41822, raJ2000: 127.8989, decJ2000: 18.0944, mag: 5.337 },
    { cnName: '鬼宿二', hip: 41909, raJ2000: 128.1771, decJ2000: 20.4412, mag: 5.325 },
    { cnName: '鬼宿三', hip: 42806, raJ2000: 130.8214, decJ2000: 21.4685, mag: 4.652 },
    { cnName: '鬼宿四', hip: 42911, raJ2000: 131.1712, decJ2000: 18.1543, mag: 3.940 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Winnowing_Basket: ChineseAsterism = {
  label: '箕宿',
  english: 'Winnowing Basket',
  type: 'mansion',
  mansionIndex: 6,
  mansionLabel: '箕',
  enclosure: null,
  color: '#0E6251',
  quadrant: '东青龙',
  stars: [
    { cnName: '箕宿一', hip: 88635, raJ2000: 271.4520, decJ2000: -30.4241, mag: 2.990 },
    { cnName: '箕宿二', hip: 89931, raJ2000: 275.2485, decJ2000: -29.8281, mag: 2.668 },
    { cnName: '箕宿三', hip: 90185, raJ2000: 276.0430, decJ2000: -34.3846, mag: 1.810 },
    { cnName: '箕宿四', hip: 89642, raJ2000: 274.4068, decJ2000: -36.7617, mag: 3.110 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Horn: ChineseAsterism = {
  label: '角宿',
  english: 'Horn',
  type: 'mansion',
  mansionIndex: 0,
  mansionLabel: '角',
  enclosure: null,
  color: '#2ECC71',
  quadrant: '东青龙',
  stars: [
    { cnName: '角宿一', hip: 65474, raJ2000: 201.2982, decJ2000: -11.1613, mag: 0.970 },
    { cnName: '角宿二', hip: 66249, raJ2000: 203.6733, decJ2000: -0.5958, mag: 3.380 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Well: ChineseAsterism = {
  label: '井宿',
  english: 'Well',
  type: 'mansion',
  mansionIndex: 21,
  mansionLabel: '井',
  enclosure: null,
  color: '#F5B7B1',
  quadrant: '南朱雀',
  stars: [
    { cnName: '井宿一', hip: 35350, raJ2000: 109.5232, decJ2000: 16.5404, mag: 3.559 },
    { cnName: '井宿二', hip: 34088, raJ2000: 106.0272, decJ2000: 20.5703, mag: 3.790 },
    { cnName: '井宿三', hip: 32921, raJ2000: 102.8877, decJ2000: 21.7611, mag: 5.259 },
    { cnName: '井宿四', hip: 32246, raJ2000: 100.9830, decJ2000: 25.1311, mag: 2.980 },
    { cnName: '井宿五', hip: 30883, raJ2000: 97.2408, decJ2000: 20.2121, mag: 4.140 },
    { cnName: '井宿六', hip: 30343, raJ2000: 95.7401, decJ2000: 22.5136, mag: 2.870 },
    { cnName: '井宿七', hip: 31681, raJ2000: 99.4280, decJ2000: 16.3993, mag: 1.920 },
    { cnName: '井宿八', hip: 32362, raJ2000: 101.3224, decJ2000: 12.8956, mag: 3.360 },
    { cnName: '井宿九', hip: 29655, raJ2000: 93.7194, decJ2000: 22.5068, mag: 3.280 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [2, 4],
    [4, 5],
    [4, 6],
    [6, 1],
    [6, 7],
    [5, 8],
  ] as const,
}

const asterism_Neck: ChineseAsterism = {
  label: '亢宿',
  english: 'Neck',
  type: 'mansion',
  mansionIndex: 1,
  mansionLabel: '亢',
  enclosure: null,
  color: '#27AE60',
  quadrant: '东青龙',
  stars: [
    { cnName: '亢宿一', hip: 69427, raJ2000: 213.2239, decJ2000: -10.2737, mag: 4.210 },
    { cnName: '亢宿二', hip: 69701, raJ2000: 214.0036, decJ2000: -6.0005, mag: 4.080 },
    { cnName: '亢宿三', hip: 70755, raJ2000: 217.0506, decJ2000: -2.2280, mag: 4.840 },
    { cnName: '亢宿四', hip: 69974, raJ2000: 214.7775, decJ2000: -13.3711, mag: 4.520 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [0, 3],
  ] as const,
}

const asterism_Legs: ChineseAsterism = {
  label: '奎宿',
  english: 'Legs',
  type: 'mansion',
  mansionIndex: 14,
  mansionLabel: '奎',
  enclosure: null,
  color: '#D4AF37',
  quadrant: '西白虎',
  stars: [
    { cnName: '奎宿一', hip: 4463, raJ2000: 14.3017, decJ2000: 23.4177, mag: 4.420 },
    { cnName: '奎宿二', hip: 3693, raJ2000: 11.8347, decJ2000: 24.2672, mag: 4.060 },
    { cnName: '奎宿三', hip: 3885, raJ2000: 12.4715, decJ2000: 27.7103, mag: null },
    { cnName: '奎宿四', hip: 3031, raJ2000: 9.6389, decJ2000: 29.3118, mag: 4.380 },
    { cnName: '奎宿五', hip: 3092, raJ2000: 9.8317, decJ2000: 30.8610, mag: 3.280 },
    { cnName: '奎宿六', hip: 2912, raJ2000: 9.2202, decJ2000: 33.7193, mag: 4.360 },
    { cnName: '奎宿七', hip: 3881, raJ2000: 12.4535, decJ2000: 41.0789, mag: 4.530 },
    { cnName: '奎宿八', hip: 4436, raJ2000: 14.1884, decJ2000: 38.4993, mag: 3.870 },
    { cnName: '奎宿九', hip: 5447, raJ2000: 17.4330, decJ2000: 35.6206, mag: 2.050 },
    { cnName: '奎宿十', hip: 5175, raJ2000: 16.5467, decJ2000: 32.1815, mag: 6.260 },
    { cnName: '奎宿十一', hip: 5586, raJ2000: 17.9151, decJ2000: 30.0896, mag: 4.511 },
    { cnName: '奎宿十二', hip: 6315, raJ2000: 20.2807, decJ2000: 28.7382, mag: 5.223 },
    { cnName: '奎宿十三', hip: 6193, raJ2000: 19.8666, decJ2000: 27.2641, mag: 4.748 },
    { cnName: '奎宿十四', hip: 5742, raJ2000: 18.4373, decJ2000: 24.5837, mag: 4.660 },
    { cnName: '奎宿十五', hip: 5571, raJ2000: 17.8634, decJ2000: 21.0346, mag: 4.658 },
    { cnName: '奎宿十六', hip: 5131, raJ2000: 16.4206, decJ2000: 21.4732, mag: 5.273 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    [8, 9],
    [9, 10],
    [10, 11],
    [11, 12],
    [12, 13],
    [13, 14],
    [14, 15],
    [15, 0],
  ] as const,
}

const asterism_Willow: ChineseAsterism = {
  label: '柳宿',
  english: 'Willow',
  type: 'mansion',
  mansionIndex: 23,
  mansionLabel: '柳',
  enclosure: null,
  color: '#EC7063',
  quadrant: '南朱雀',
  stars: [
    { cnName: '柳宿一', hip: 42402, raJ2000: 129.6893, decJ2000: 3.3414, mag: 4.430 },
    { cnName: '柳宿二', hip: 42799, raJ2000: 130.8061, decJ2000: 3.3987, mag: 4.300 },
    { cnName: '柳宿三', hip: 43234, raJ2000: 132.1082, decJ2000: 5.8378, mag: 4.337 },
    { cnName: '柳宿四', hip: 43109, raJ2000: 131.6938, decJ2000: 6.4188, mag: 3.380 },
    { cnName: '柳宿五', hip: 42313, raJ2000: 129.4140, decJ2000: 5.7038, mag: 4.131 },
    { cnName: '柳宿六', hip: 43813, raJ2000: 133.8484, decJ2000: 5.9456, mag: 3.100 },
    { cnName: '柳宿七', hip: 44659, raJ2000: 136.4932, decJ2000: 5.0923, mag: 4.981 },
    { cnName: '柳宿八', hip: 45336, raJ2000: 138.5911, decJ2000: 2.3143, mag: null },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [4, 3],
    [2, 5],
    [5, 6],
    [6, 7],
  ] as const,
}

const asterism_Bond: ChineseAsterism = {
  label: '娄宿',
  english: 'Bond',
  type: 'mansion',
  mansionIndex: 15,
  mansionLabel: '娄',
  enclosure: null,
  color: '#BCC6CC',
  quadrant: '西白虎',
  stars: [
    { cnName: '娄宿一', hip: 9884, raJ2000: 31.7934, decJ2000: 23.4624, mag: 2.010 },
    { cnName: '娄宿二', hip: 8903, raJ2000: 28.6600, decJ2000: 20.8080, mag: 2.650 },
    { cnName: '娄宿三', hip: 8832, raJ2000: 28.3826, decJ2000: 19.2939, mag: null },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Hairy_Head: ChineseAsterism = {
  label: '昴宿',
  english: 'Hairy Head',
  type: 'mansion',
  mansionIndex: 17,
  mansionLabel: '昴',
  enclosure: null,
  color: '#829AE3',
  quadrant: '西白虎',
  stars: [
    { cnName: '昴宿一', hip: 17499, raJ2000: 56.2189, decJ2000: 24.1133, mag: 3.700 },
    { cnName: '昴宿二', hip: 17531, raJ2000: 56.3021, decJ2000: 24.4673, mag: 4.300 },
    { cnName: '昴宿三', hip: 17579, raJ2000: 56.4770, decJ2000: 24.5545, mag: 5.760 },
    { cnName: '昴宿四', hip: 17573, raJ2000: 56.4567, decJ2000: 24.3677, mag: 3.870 },
    { cnName: '昴宿五', hip: 17608, raJ2000: 56.5816, decJ2000: 23.9484, mag: 4.180 },
    { cnName: '昴宿六', hip: 17702, raJ2000: 56.8712, decJ2000: 24.1051, mag: 2.870 },
    { cnName: '昴宿七', hip: 17847, raJ2000: 57.2906, decJ2000: 24.0534, mag: 3.630 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [0, 4],
    [4, 5],
    [5, 6],
  ] as const,
  /** 昴星团 (M45/Pleiades) 角直径约 110' ≈ 1.8° */
  angularSizeDeg: 1.8,
}

const asterism_Ox: ChineseAsterism = {
  label: '牛宿',
  english: 'Ox',
  type: 'mansion',
  mansionIndex: 8,
  mansionLabel: '牛',
  enclosure: null,
  color: '#3498DB',
  quadrant: '北玄武',
  stars: [
    { cnName: '牛宿一', hip: 100345, raJ2000: 305.2528, decJ2000: -14.7814, mag: 3.080 },
    { cnName: '牛宿二', hip: 100064, raJ2000: 304.5136, decJ2000: -12.5449, mag: 3.580 },
    { cnName: '牛宿三', hip: 99572, raJ2000: 303.1078, decJ2000: -12.6175, mag: 5.850 },
    { cnName: '牛宿四', hip: 100881, raJ2000: 306.8300, decJ2000: -18.2117, mag: 5.140 },
    { cnName: '牛宿五', hip: 101123, raJ2000: 307.4746, decJ2000: -18.5832, mag: 5.897 },
    { cnName: '牛宿六', hip: 101027, raJ2000: 307.2151, decJ2000: -17.8137, mag: null },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [0, 3],
    [3, 4],
    [4, 5],
    [3, 5],
  ] as const,
}

const asterism_Girl: ChineseAsterism = {
  label: '女宿',
  english: 'Girl',
  type: 'mansion',
  mansionIndex: 9,
  mansionLabel: '女',
  enclosure: null,
  color: '#2874A6',
  quadrant: '北玄武',
  stars: [
    { cnName: '女宿一', hip: 102618, raJ2000: 311.9190, decJ2000: -9.4958, mag: 3.770 },
    { cnName: '女宿二', hip: 103045, raJ2000: 313.1635, decJ2000: -8.9833, mag: 4.720 },
    { cnName: '女宿三', hip: 102945, raJ2000: 312.8573, decJ2000: -5.6266, mag: 6.070 },
    { cnName: '女宿四', hip: 102624, raJ2000: 311.9343, decJ2000: -5.0277, mag: 4.440 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Encampment: ChineseAsterism = {
  label: '室宿',
  english: 'Encampment',
  type: 'mansion',
  mansionIndex: 12,
  mansionLabel: '室',
  enclosure: null,
  color: '#0B5345',
  quadrant: '北玄武',
  stars: [
    { cnName: '室宿一', hip: 113963, raJ2000: 346.1902, decJ2000: 15.2053, mag: 2.480 },
    { cnName: '室宿二', hip: 113881, raJ2000: 345.9436, decJ2000: 28.0828, mag: 2.420 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Supreme_Palace_Right_Wall: ChineseAsterism = {
  label: '太微右垣',
  english: 'Supreme Palace Right Wall',
  type: 'enclosure',
  mansionIndex: 26,
  mansionLabel: '翼',
  enclosure: '太微垣',
  color: '#9370DB',
  quadrant: '南朱雀',
  stars: [
    { cnName: '太微右垣一', hip: 57757, raJ2000: 177.6738, decJ2000: 1.7647, mag: 3.600 },
    { cnName: '太微右垣二', hip: 55434, raJ2000: 170.2841, decJ2000: 6.0293, mag: 4.040 },
    { cnName: '太微右垣三', hip: 55642, raJ2000: 170.9811, decJ2000: 10.5295, mag: 4.010 },
    { cnName: '太微右垣四', hip: 54879, raJ2000: 168.5600, decJ2000: 15.4296, mag: 3.350 },
    { cnName: '太微右垣五', hip: 54872, raJ2000: 168.5271, decJ2000: 20.5237, mag: 2.530 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
  ] as const,
}

const asterism_Supreme_Palace_Left_Wall: ChineseAsterism = {
  label: '太微左垣',
  english: 'Supreme Palace Left Wall',
  type: 'enclosure',
  mansionIndex: 27,
  mansionLabel: '轸',
  enclosure: '太微垣',
  color: '#9370DB',
  quadrant: '南朱雀',
  stars: [
    { cnName: '太微左垣一', hip: 60129, raJ2000: 184.9764, decJ2000: -0.6668, mag: 3.900 },
    { cnName: '太微左垣二', hip: 61941, raJ2000: 190.4151, decJ2000: -1.4494, mag: 2.740 },
    { cnName: '太微左垣三', hip: 63090, raJ2000: 193.9009, decJ2000: 3.3975, mag: 3.380 },
    { cnName: '太微左垣四', hip: 63608, raJ2000: 195.5442, decJ2000: 10.9591, mag: 2.790 },
    { cnName: '太微左垣五', hip: 64241, raJ2000: 197.4970, decJ2000: 17.5295, mag: 4.320 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
  ] as const,
}

const asterism_Heavenly_Market_Right_Wall: ChineseAsterism = {
  label: '天市右垣',
  english: 'Heavenly Market Right Wall',
  type: 'enclosure',
  mansionIndex: 3,
  mansionLabel: '房',
  enclosure: '天市垣',
  color: '#9370DB',
  quadrant: '东青龙',
  stars: [
    { cnName: '天市右垣一', hip: 80816, raJ2000: 247.5550, decJ2000: 21.4896, mag: 2.770 },
    { cnName: '天市右垣二', hip: 80170, raJ2000: 245.4801, decJ2000: 19.1531, mag: 3.760 },
    { cnName: '天市右垣三', hip: 79043, raJ2000: 242.0189, decJ2000: 17.0470, mag: 4.994 },
    { cnName: '天市右垣四', hip: 78072, raJ2000: 239.1133, decJ2000: 15.6616, mag: 3.840 },
    { cnName: '天市右垣五', hip: 77233, raJ2000: 236.5469, decJ2000: 15.4218, mag: 3.670 },
    { cnName: '天市右垣六', hip: 76276, raJ2000: 233.7006, decJ2000: 10.5389, mag: null },
    { cnName: '天市右垣七', hip: 77070, raJ2000: 236.0670, decJ2000: 6.4256, mag: 2.630 },
    { cnName: '天市右垣八', hip: 77622, raJ2000: 237.7040, decJ2000: 4.4777, mag: 3.693 },
    { cnName: '天市右垣九', hip: 79593, raJ2000: 243.5864, decJ2000: -3.6943, mag: 2.750 },
    { cnName: '天市右垣十', hip: 79882, raJ2000: 244.5804, decJ2000: -4.6925, mag: 3.230 },
    { cnName: '天市右垣十一', hip: 81377, raJ2000: 249.2898, decJ2000: -10.5671, mag: 2.560 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    [8, 9],
    [9, 10],
  ] as const,
}

const asterism_Heavenly_Market_Left_Wall: ChineseAsterism = {
  label: '天市左垣',
  english: 'Heavenly Market Left Wall',
  type: 'enclosure',
  mansionIndex: 5,
  mansionLabel: '尾',
  enclosure: '天市垣',
  color: '#9370DB',
  quadrant: '东青龙',
  stars: [
    { cnName: '天市左垣一', hip: 84379, raJ2000: 258.7580, decJ2000: 24.8392, mag: 3.130 },
    { cnName: '天市左垣二', hip: 85693, raJ2000: 262.6846, decJ2000: 26.1106, mag: 4.410 },
    { cnName: '天市左垣三', hip: 86974, raJ2000: 266.6148, decJ2000: 27.7207, mag: 3.420 },
    { cnName: '天市左垣四', hip: 88794, raJ2000: 271.8856, decJ2000: 28.7625, mag: 3.827 },
    { cnName: '天市左垣五', hip: 92614, raJ2000: 283.0684, decJ2000: 21.4251, mag: 5.393 },
    { cnName: '天市左垣六', hip: 93747, raJ2000: 286.3525, decJ2000: 13.8635, mag: 2.990 },
    { cnName: '天市左垣七', hip: 92946, raJ2000: 284.0549, decJ2000: 4.2036, mag: 4.570 },
    { cnName: '天市左垣八', hip: 89962, raJ2000: 275.3275, decJ2000: -2.8988, mag: 3.250 },
    { cnName: '天市左垣九', hip: 88048, raJ2000: 269.7566, decJ2000: -9.7736, mag: 3.340 },
    { cnName: '天市左垣十', hip: 86263, raJ2000: 264.3967, decJ2000: -15.3986, mag: 3.519 },
    { cnName: '天市左垣十一', hip: 84012, raJ2000: 257.5945, decJ2000: -15.7249, mag: 2.420 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    [8, 9],
    [9, 10],
  ] as const,
}

const asterism_Rooftop: ChineseAsterism = {
  label: '危宿',
  english: 'Rooftop',
  type: 'mansion',
  mansionIndex: 11,
  mansionLabel: '危',
  enclosure: null,
  color: '#154360',
  quadrant: '北玄武',
  stars: [
    { cnName: '危宿一', hip: 109074, raJ2000: 331.4460, decJ2000: -0.3199, mag: 2.940 },
    { cnName: '危宿二', hip: 109427, raJ2000: 332.5500, decJ2000: 6.1979, mag: 3.550 },
    { cnName: '危宿三', hip: 107315, raJ2000: 326.0465, decJ2000: 9.8750, mag: 2.390 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Tail: ChineseAsterism = {
  label: '尾宿',
  english: 'Tail',
  type: 'mansion',
  mansionIndex: 5,
  mansionLabel: '尾',
  enclosure: null,
  color: '#145A32',
  quadrant: '东青龙',
  stars: [
    { cnName: '尾宿一', hip: 82396, raJ2000: 252.5409, decJ2000: -34.2932, mag: 2.290 },
    { cnName: '尾宿二', hip: 82514, raJ2000: 252.9676, decJ2000: -38.0474, mag: 2.980 },
    { cnName: '尾宿三', hip: 82671, raJ2000: 253.4989, decJ2000: -42.3620, mag: 4.790 },
    { cnName: '尾宿四', hip: 84143, raJ2000: 258.0383, decJ2000: -43.2392, mag: 3.330 },
    { cnName: '尾宿五', hip: 86228, raJ2000: 264.3297, decJ2000: -42.9978, mag: 1.850 },
    { cnName: '尾宿六', hip: 87073, raJ2000: 266.8962, decJ2000: -40.1270, mag: 2.992 },
    { cnName: '尾宿七', hip: 86670, raJ2000: 265.6220, decJ2000: -39.0300, mag: 2.386 },
    { cnName: '尾宿八', hip: 85927, raJ2000: 263.4022, decJ2000: -37.1038, mag: 1.630 },
    { cnName: '尾宿九', hip: 85696, raJ2000: 262.6910, decJ2000: -37.2958, mag: 2.650 },
    { cnName: '尾宿十', hip: 82545, raJ2000: 253.0839, decJ2000: -38.0175, mag: 3.542 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    [1, 9],
  ] as const,
}

const asterism_Stomach: ChineseAsterism = {
  label: '胃宿',
  english: 'Stomach',
  type: 'mansion',
  mansionIndex: 16,
  mansionLabel: '胃',
  enclosure: null,
  color: '#AEB6BF',
  quadrant: '西白虎',
  stars: [
    { cnName: '胃宿一', hip: 12719, raJ2000: 40.8630, decJ2000: 27.7071, mag: 4.670 },
    { cnName: '胃宿二', hip: 13061, raJ2000: 41.9773, decJ2000: 29.2471, mag: 4.510 },
    { cnName: '胃宿三', hip: 13209, raJ2000: 42.4960, decJ2000: 27.2605, mag: 3.594 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Heart: ChineseAsterism = {
  label: '心宿',
  english: 'Heart',
  type: 'mansion',
  mansionIndex: 4,
  mansionLabel: '心',
  enclosure: null,
  color: '#196F3D',
  quadrant: '东青龙',
  stars: [
    { cnName: '心宿一', hip: 80112, raJ2000: 245.2971, decJ2000: -25.5928, mag: 2.890 },
    { cnName: '心宿二', hip: 80763, raJ2000: 247.3519, decJ2000: -26.4320, mag: 0.910 },
    { cnName: '心宿三', hip: 81266, raJ2000: 248.9706, decJ2000: -28.2160, mag: 2.810 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Star: ChineseAsterism = {
  label: 'unknown',
  english: 'Star',
  type: 'mansion',
  mansionIndex: 24,
  mansionLabel: '星',
  enclosure: null,
  color: '#E74C3C',
  quadrant: '南朱雀',
  stars: [
    { cnName: 'unknown一', hip: 46390, raJ2000: 141.8968, decJ2000: -8.6586, mag: 1.970 },
    { cnName: 'unknown二', hip: 46509, raJ2000: 142.2872, decJ2000: -2.7689, mag: 4.600 },
    { cnName: 'unknown三', hip: 46776, raJ2000: 142.9955, decJ2000: -1.1847, mag: 4.548 },
    { cnName: 'unknown四', hip: 47431, raJ2000: 144.9640, decJ2000: -1.1428, mag: 3.910 },
    { cnName: 'unknown五', hip: 45811, raJ2000: 140.1209, decJ2000: -9.5557, mag: 4.811 },
    { cnName: 'unknown六', hip: 45751, raJ2000: 139.9433, decJ2000: -11.9749, mag: 4.770 },
    { cnName: 'unknown七', hip: 46744, raJ2000: 142.9124, decJ2000: -10.5520, mag: 6.123 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [0, 4],
    [4, 5],
    [5, 6],
    [0, 6],
  ] as const,
}

const asterism_Emptiness: ChineseAsterism = {
  label: '虚宿',
  english: 'Emptiness',
  type: 'mansion',
  mansionIndex: 10,
  mansionLabel: '虚',
  enclosure: null,
  color: '#1B4F72',
  quadrant: '北玄武',
  stars: [
    { cnName: '虚宿一', hip: 106278, raJ2000: 322.8897, decJ2000: -5.5712, mag: 2.890 },
    { cnName: '虚宿二', hip: 104987, raJ2000: 318.9560, decJ2000: 5.2479, mag: 3.933 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Wings: ChineseAsterism = {
  label: '翼宿',
  english: 'Wings',
  type: 'mansion',
  mansionIndex: 26,
  mansionLabel: '翼',
  enclosure: null,
  color: '#CA6F1E',
  quadrant: '南朱雀',
  stars: [
    { cnName: '翼宿一', hip: 53740, raJ2000: 164.9436, decJ2000: -18.2988, mag: 4.070 },
    { cnName: '翼宿二', hip: 55705, raJ2000: 171.2205, decJ2000: -17.6840, mag: 4.060 },
    { cnName: '翼宿三', hip: 55598, raJ2000: 170.8412, decJ2000: -18.7800, mag: 5.090 },
    { cnName: '翼宿四', hip: 52943, raJ2000: 162.4062, decJ2000: -16.1936, mag: 3.110 },
    { cnName: '翼宿五', hip: 57283, raJ2000: 176.1907, decJ2000: -18.3507, mag: 4.706 },
    { cnName: '翼宿六', hip: 58188, raJ2000: 179.0040, decJ2000: -17.1508, mag: 5.160 },
    { cnName: '翼宿七', hip: 55282, raJ2000: 169.8352, decJ2000: -14.7785, mag: 3.560 },
    { cnName: '翼宿八', hip: 56802, raJ2000: 174.6667, decJ2000: -13.2019, mag: 5.480 },
    { cnName: '翼宿九', hip: 55874, raJ2000: 171.7896, decJ2000: -12.3567, mag: 5.923 },
    { cnName: '翼宿十', hip: 55687, raJ2000: 171.1525, decJ2000: -10.8593, mag: 4.802 },
    { cnName: '翼宿十一', hip: 53975, raJ2000: 165.6302, decJ2000: -9.9949, mag: 7.320 },
    { cnName: '翼宿十二', hip: 56633, raJ2000: 174.1705, decJ2000: -9.8022, mag: 4.673 },
    { cnName: '翼宿十三', hip: 57587, raJ2000: 177.0979, decJ2000: -10.3131, mag: 6.226 },
    { cnName: '翼宿十四', hip: 54682, raJ2000: 167.9145, decJ2000: -22.8258, mag: 4.449 },
    { cnName: '翼宿十五', hip: 54204, raJ2000: 166.3329, decJ2000: -27.2936, mag: 4.912 },
  ],
  connections: [
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 4],
    [4, 2],
    [4, 5],
    [1, 6],
    [6, 7],
    [7, 8],
    [8, 9],
    [9, 10],
    [9, 11],
    [11, 12],
    [2, 13],
    [13, 14],
  ] as const,
}

const asterism_Extended_Net: ChineseAsterism = {
  label: '张宿',
  english: 'Extended Net',
  type: 'mansion',
  mansionIndex: 25,
  mansionLabel: '张',
  enclosure: null,
  color: '#DC7633',
  quadrant: '南朱雀',
  stars: [
    { cnName: '张宿一', hip: 48356, raJ2000: 147.8695, decJ2000: -14.8466, mag: 4.110 },
    { cnName: '张宿二', hip: 49841, raJ2000: 152.6470, decJ2000: -12.3541, mag: 3.610 },
    { cnName: '张宿三', hip: 51069, raJ2000: 156.5226, decJ2000: -16.8363, mag: 3.810 },
    { cnName: '张宿四', hip: 49321, raJ2000: 151.0117, decJ2000: -18.1014, mag: 6.228 },
    { cnName: '张宿五', hip: 47452, raJ2000: 145.0765, decJ2000: -14.3323, mag: 5.052 },
    { cnName: '张宿六', hip: 52085, raJ2000: 159.6456, decJ2000: -16.8766, mag: 4.903 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [0, 3],
    [0, 4],
    [2, 5],
  ] as const,
}

const asterism_Chariot: ChineseAsterism = {
  label: '轸宿',
  english: 'Chariot',
  type: 'mansion',
  mansionIndex: 27,
  mansionLabel: '轸',
  enclosure: null,
  color: '#BA4A00',
  quadrant: '南朱雀',
  stars: [
    { cnName: '轸宿一', hip: 61359, raJ2000: 188.5968, decJ2000: -23.3968, mag: 2.640 },
    { cnName: '轸宿二', hip: 60965, raJ2000: 187.4661, decJ2000: -16.5154, mag: 2.940 },
    { cnName: '轸宿三', hip: 59803, raJ2000: 183.9515, decJ2000: -17.5419, mag: 2.580 },
    { cnName: '轸宿四', hip: 59316, raJ2000: 182.5312, decJ2000: -22.6198, mag: 2.980 },
    { cnName: '轸宿五', hip: 60189, raJ2000: 185.1402, decJ2000: -22.2159, mag: 5.210 },
    { cnName: '轸宿六', hip: 61174, raJ2000: 188.0176, decJ2000: -16.1960, mag: 4.294 },
    { cnName: '轸宿七', hip: 59199, raJ2000: 182.1034, decJ2000: -24.7289, mag: 4.010 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [2, 4],
    [1, 5],
    [3, 6],
  ] as const,
}

const asterism_Purple_Forbidden_Right_Wall: ChineseAsterism = {
  label: '紫微右垣',
  english: 'Purple Forbidden Right Wall',
  type: 'enclosure',
  mansionIndex: 23,
  mansionLabel: '柳',
  enclosure: '紫微垣',
  color: '#9370DB',
  quadrant: '南朱雀',
  stars: [
    { cnName: '紫微右垣一', hip: 68756, raJ2000: 211.0973, decJ2000: 64.3759, mag: 3.680 },
    { cnName: '紫微右垣二', hip: 61281, raJ2000: 188.3706, decJ2000: 69.7882, mag: 3.890 },
    { cnName: '紫微右垣三', hip: 56211, raJ2000: 172.8509, decJ2000: 69.3311, mag: 3.850 },
    { cnName: '紫微右垣四', hip: 46977, raJ2000: 143.6202, decJ2000: 69.8303, mag: 4.570 },
    { cnName: '紫微右垣五', hip: 33104, raJ2000: 103.4260, decJ2000: 68.8883, mag: 5.096 },
    { cnName: '紫微右垣六', hip: 22783, raJ2000: 73.5125, decJ2000: 66.3427, mag: 4.290 },
    { cnName: '紫微右垣七', hip: 15520, raJ2000: 49.9970, decJ2000: 65.6523, mag: 4.850 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
  ] as const,
}

const asterism_Purple_Forbidden_Left_Wall: ChineseAsterism = {
  label: '紫微左垣',
  english: 'Purple Forbidden Left Wall',
  type: 'enclosure',
  mansionIndex: 2,
  mansionLabel: '氐',
  enclosure: '紫微垣',
  color: '#9370DB',
  quadrant: '东青龙',
  stars: [
    { cnName: '紫微左垣一', hip: 75458, raJ2000: 231.2324, decJ2000: 58.9661, mag: 3.290 },
    { cnName: '紫微左垣二', hip: 78527, raJ2000: 240.4723, decJ2000: 58.5653, mag: 4.000 },
    { cnName: '紫微左垣三', hip: 80331, raJ2000: 245.9979, decJ2000: 61.5142, mag: 2.740 },
    { cnName: '紫微左垣四', hip: 83895, raJ2000: 257.1966, decJ2000: 65.7146, mag: 3.170 },
    { cnName: '紫微左垣五', hip: 92782, raJ2000: 283.5994, decJ2000: 71.2972, mag: 4.814 },
    { cnName: '紫微左垣六', hip: 101260, raJ2000: 307.8767, decJ2000: 74.9546, mag: 5.185 },
    { cnName: '紫微左垣七', hip: 114222, raJ2000: 346.9744, decJ2000: 75.3875, mag: 4.410 },
    { cnName: '紫微左垣八', hip: 3721, raJ2000: 11.9419, decJ2000: 74.8476, mag: 5.413 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
  ] as const,
}

const asterism_Turtle_Beak: ChineseAsterism = {
  label: '觜宿',
  english: 'Turtle Beak',
  type: 'mansion',
  mansionIndex: 19,
  mansionLabel: '觜',
  enclosure: null,
  color: '#2C3E50',
  quadrant: '西白虎',
  stars: [
    { cnName: '觜宿一', hip: 26207, raJ2000: 83.7845, decJ2000: 9.9342, mag: 3.660 },
    { cnName: '觜宿二', hip: 26176, raJ2000: 83.7052, decJ2000: 9.4896, mag: 4.410 },
    { cnName: '觜宿三', hip: 26366, raJ2000: 84.2266, decJ2000: 9.2907, mag: 4.090 },
  ],
  connections: [
    [0, 1],
    [0, 2],
  ] as const,
}

const asterism_Eight_Kinds_of_Crops: ChineseAsterism = {
  label: '八谷',
  english: 'Eight Kinds of Crops',
  type: 'sub',
  mansionIndex: 18,
  mansionLabel: '毕',
  enclosure: null,
  color: '#566573',
  quadrant: '西白虎',
  stars: [
    { cnName: '八谷一', hip: 28358, raJ2000: 89.8817, decJ2000: 54.2847, mag: 3.720 },
    { cnName: '八谷二', hip: 27949, raJ2000: 88.7115, decJ2000: 55.7070, mag: 4.960 },
    { cnName: '八谷三', hip: 27249, raJ2000: 86.6266, decJ2000: 56.1156, mag: 5.927 },
    { cnName: '八谷四', hip: 24348, raJ2000: 78.3802, decJ2000: 62.6911, mag: 6.477 },
    { cnName: '八谷五', hip: 23040, raJ2000: 74.3217, decJ2000: 53.7521, mag: 4.433 },
    { cnName: '八谷六', hip: 23783, raJ2000: 76.6693, decJ2000: 51.5977, mag: null },
    { cnName: '八谷七', hip: 23734, raJ2000: 76.5352, decJ2000: 58.9724, mag: 5.080 },
    { cnName: '八谷八', hip: 27971, raJ2000: 88.7409, decJ2000: 59.8884, mag: 5.200 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [2, 4],
    [5, 6],
    [6, 7],
  ] as const,
}

const asterism_Net_for_Catching_Birds: ChineseAsterism = {
  label: '八魁',
  english: 'Net for Catching Birds',
  type: 'sub',
  mansionIndex: 16,
  mansionLabel: '胃',
  enclosure: null,
  color: '#AEB6BF',
  quadrant: '西白虎',
  stars: [
    { cnName: '八魁一', hip: 910, raJ2000: 2.8161, decJ2000: -15.4680, mag: 4.890 },
    { cnName: '八魁二', hip: 301, raJ2000: 0.9349, decJ2000: -17.3360, mag: 4.536 },
    { cnName: '八魁三', hip: 118178, raJ2000: 359.5884, decJ2000: -15.8475, mag: 6.276 },
    { cnName: '八魁四', hip: 355, raJ2000: 1.1255, decJ2000: -10.5095, mag: 4.924 },
    { cnName: '八魁五', hip: 1803, raJ2000: 5.7158, decJ2000: -12.2094, mag: 6.390 },
    { cnName: '八魁六', hip: 1170, raJ2000: 3.6601, decJ2000: -18.9329, mag: 4.460 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [0, 3],
    [0, 4],
    [0, 5],
  ] as const,
}

const asterism_Rotten_Gourd: ChineseAsterism = {
  label: '败瓜',
  english: 'Rotten Gourd',
  type: 'sub',
  mansionIndex: 8,
  mansionLabel: '牛',
  enclosure: null,
  color: '#3498DB',
  quadrant: '北玄武',
  stars: [
    { cnName: '败瓜一', hip: 101421, raJ2000: 308.3032, decJ2000: 11.3033, mag: 4.030 },
    { cnName: '败瓜二', hip: 101483, raJ2000: 308.4877, decJ2000: 13.0272, mag: 5.380 },
    { cnName: '败瓜三', hip: 101882, raJ2000: 309.6833, decJ2000: 13.3151, mag: 5.710 },
    { cnName: '败瓜四', hip: 101800, raJ2000: 309.4547, decJ2000: 11.3777, mag: 5.418 },
    { cnName: '败瓜五', hip: 101916, raJ2000: 309.7824, decJ2000: 10.0862, mag: null },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
  ] as const,
}

const asterism_Decayed_Mortar: ChineseAsterism = {
  label: '败臼',
  english: 'Decayed Mortar',
  type: 'sub',
  mansionIndex: 11,
  mansionLabel: '危',
  enclosure: null,
  color: '#154360',
  quadrant: '北玄武',
  stars: [
    { cnName: '败臼一', hip: 108085, raJ2000: 328.4822, decJ2000: -37.3649, mag: 3.010 },
    { cnName: '败臼二', hip: 109111, raJ2000: 331.5287, decJ2000: -39.5434, mag: 4.458 },
    { cnName: '败臼三', hip: 112948, raJ2000: 343.1314, decJ2000: -32.8755, mag: 4.510 },
    { cnName: '败臼四', hip: 112102, raJ2000: 340.5920, decJ2000: -29.3610, mag: 6.168 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Northern_Dipper: ChineseAsterism = {
  label: '北斗',
  english: 'Northern Dipper',
  type: 'special',
  mansionIndex: -1,
  mansionLabel: null,
  enclosure: null,
  color: '#FFFFFF',
  quadrant: null,
  stars: [
    { cnName: '北斗一', hip: 54061, raJ2000: 165.9320, decJ2000: 61.7510, mag: 1.790 },
    { cnName: '北斗二', hip: 53910, raJ2000: 165.4603, decJ2000: 56.3824, mag: 2.370 },
    { cnName: '北斗三', hip: 58001, raJ2000: 178.4577, decJ2000: 53.6948, mag: 2.440 },
    { cnName: '北斗四', hip: 59774, raJ2000: 183.8565, decJ2000: 57.0326, mag: 3.320 },
    { cnName: '北斗五', hip: 62956, raJ2000: 193.5073, decJ2000: 55.9598, mag: 1.770 },
    { cnName: '北斗六', hip: 65378, raJ2000: 200.9814, decJ2000: 54.9254, mag: null },
    { cnName: '北斗七', hip: 67301, raJ2000: 206.8852, decJ2000: 49.3133, mag: 1.860 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
  ] as const,
}

const asterism_North_River: ChineseAsterism = {
  label: '北河',
  english: 'North River',
  type: 'sub',
  mansionIndex: 21,
  mansionLabel: '井',
  enclosure: null,
  color: '#F5B7B1',
  quadrant: '南朱雀',
  stars: [
    { cnName: '北河一', hip: 37826, raJ2000: 116.3290, decJ2000: 28.0262, mag: 1.140 },
    { cnName: '北河二', hip: 36850, raJ2000: 113.6495, decJ2000: 31.8883, mag: 1.580 },
    { cnName: '北河三', hip: 36366, raJ2000: 112.2780, decJ2000: 31.7845, mag: 4.180 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Northern_Pole: ChineseAsterism = {
  label: '北极',
  english: 'Northern Pole',
  type: 'special',
  mansionIndex: -1,
  mansionLabel: null,
  enclosure: null,
  color: '#F4D580',
  quadrant: null,
  stars: [
    { cnName: '北极一', hip: 75097, raJ2000: 230.1821, decJ2000: 71.8340, mag: 3.002 },
    { cnName: '北极二', hip: 72607, raJ2000: 222.6764, decJ2000: 74.1555, mag: 2.080 },
    { cnName: '北极三', hip: 70692, raJ2000: 216.8814, decJ2000: 75.6960, mag: 4.235 },
    { cnName: '北极四', hip: 69112, raJ2000: 212.2122, decJ2000: 77.5475, mag: 4.805 },
    { cnName: '北极五', hip: 62572, raJ2000: 192.3072, decJ2000: 83.4129, mag: 5.350 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
  ] as const,
}

const asterism_North_Gate_of_the_Military_Camp: ChineseAsterism = {
  label: '北落师门',
  english: 'North Gate of the Military Camp',
  type: 'sub',
  mansionIndex: 11,
  mansionLabel: '危',
  enclosure: null,
  color: '#154360',
  quadrant: '北玄武',
  stars: [
    { cnName: '北落师门一', hip: 113368, raJ2000: 344.4127, decJ2000: -29.6222, mag: 1.160 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_River_Turtle: ChineseAsterism = {
  label: '鳖',
  english: 'River Turtle',
  type: 'sub',
  mansionIndex: 7,
  mansionLabel: '斗',
  enclosure: null,
  color: '#5DADE2',
  quadrant: '北玄武',
  stars: [
    { cnName: '鳖一', hip: 90422, raJ2000: 276.7434, decJ2000: -45.9685, mag: 3.463 },
    { cnName: '鳖二', hip: 92308, raJ2000: 282.2104, decJ2000: -43.6800, mag: 5.456 },
    { cnName: '鳖三', hip: 93542, raJ2000: 285.7787, decJ2000: -42.0951, mag: 4.725 },
    { cnName: '鳖四', hip: 94005, raJ2000: 287.0874, decJ2000: -40.4967, mag: 4.571 },
    { cnName: '鳖五', hip: 94160, raJ2000: 287.5073, decJ2000: -39.3408, mag: 4.095 },
    { cnName: '鳖六', hip: 94114, raJ2000: 287.3681, decJ2000: -37.9045, mag: 4.087 },
    { cnName: '鳖七', hip: 93825, raJ2000: 286.6046, decJ2000: -37.0634, mag: 4.210 },
    { cnName: '鳖八', hip: 93174, raJ2000: 284.6808, decJ2000: -37.1073, mag: 4.850 },
    { cnName: '鳖九', hip: 92989, raJ2000: 284.1687, decJ2000: -37.3433, mag: 5.380 },
    { cnName: '鳖十', hip: 90968, raJ2000: 278.3464, decJ2000: -38.7260, mag: 5.590 },
    { cnName: '鳖十一', hip: 90982, raJ2000: 278.3758, decJ2000: -42.3125, mag: 4.614 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    [8, 9],
    [9, 10],
    [10, 0],
  ] as const,
}

const asterism_Persia: ChineseAsterism = {
  label: '波斯',
  english: 'Persia',
  type: 'sub',
  mansionIndex: 8,
  mansionLabel: '牛',
  enclosure: null,
  color: '#3498DB',
  quadrant: '北玄武',
  stars: [
    { cnName: '波斯一', hip: 101772, raJ2000: 309.3918, decJ2000: -47.2915, mag: 3.110 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Textile_Ruler: ChineseAsterism = {
  label: '帛度',
  english: 'Textile Ruler',
  type: 'sub',
  mansionIndex: 5,
  mansionLabel: '尾',
  enclosure: null,
  color: '#145A32',
  quadrant: '东青龙',
  stars: [
    { cnName: '帛度一', hip: 88267, raJ2000: 270.3767, decJ2000: 21.5958, mag: null },
    { cnName: '帛度二', hip: 88886, raJ2000: 272.1895, decJ2000: 20.8146, mag: 4.347 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Banner_of_Three_Stars: ChineseAsterism = {
  label: '参旗',
  english: 'Banner of Three Stars',
  type: 'sub',
  mansionIndex: 18,
  mansionLabel: '毕',
  enclosure: null,
  color: '#566573',
  quadrant: '西白虎',
  stars: [
    { cnName: '参旗一', hip: 22667, raJ2000: 73.1332, decJ2000: 14.2506, mag: 4.721 },
    { cnName: '参旗二', hip: 22957, raJ2000: 74.0928, decJ2000: 13.5145, mag: 4.060 },
    { cnName: '参旗三', hip: 22833, raJ2000: 73.6954, decJ2000: 11.4260, mag: 5.184 },
    { cnName: '参旗四', hip: 22845, raJ2000: 73.7239, decJ2000: 10.1508, mag: 4.648 },
    { cnName: '参旗五', hip: 22509, raJ2000: 72.6530, decJ2000: 8.9002, mag: 4.350 },
    { cnName: '参旗六', hip: 22449, raJ2000: 72.4600, decJ2000: 6.9613, mag: 3.190 },
    { cnName: '参旗七', hip: 22549, raJ2000: 72.8015, decJ2000: 5.6051, mag: 3.680 },
    { cnName: '参旗八', hip: 22797, raJ2000: 73.5629, decJ2000: 2.4407, mag: 3.730 },
    { cnName: '参旗九', hip: 23123, raJ2000: 74.6371, decJ2000: 1.7140, mag: 4.459 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
  ] as const,
}

const asterism_Toilet: ChineseAsterism = {
  label: '厕',
  english: 'Toilet',
  type: 'sub',
  mansionIndex: 19,
  mansionLabel: '觜',
  enclosure: null,
  color: '#2C3E50',
  quadrant: '西白虎',
  stars: [
    { cnName: '厕一', hip: 25985, raJ2000: 83.1826, decJ2000: -17.8223, mag: 2.570 },
    { cnName: '厕二', hip: 25606, raJ2000: 82.0613, decJ2000: -20.7594, mag: 2.840 },
    { cnName: '厕三', hip: 27072, raJ2000: 86.1158, decJ2000: -22.4484, mag: 3.600 },
    { cnName: '厕四', hip: 27654, raJ2000: 87.8304, decJ2000: -20.8791, mag: 3.850 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Whip: ChineseAsterism = {
  label: '策',
  english: 'Whip',
  type: 'sub',
  mansionIndex: 13,
  mansionLabel: '壁',
  enclosure: null,
  color: '#0E6251',
  quadrant: '北玄武',
  stars: [
    { cnName: '策一', hip: 4427, raJ2000: 14.1772, decJ2000: 60.7167, mag: 2.390 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Royal_Guards: ChineseAsterism = {
  label: '常陈',
  english: 'Royal Guards',
  type: 'sub',
  mansionIndex: 26,
  mansionLabel: '翼',
  enclosure: null,
  color: '#CA6F1E',
  quadrant: '南朱雀',
  stars: [
    { cnName: '常陈一', hip: 63125, raJ2000: 194.0069, decJ2000: 38.3184, mag: 2.880 },
    { cnName: '常陈二', hip: 62207, raJ2000: 191.2475, decJ2000: 39.2789, mag: 5.950 },
    { cnName: '常陈三', hip: 61692, raJ2000: 189.6928, decJ2000: 40.8747, mag: 6.352 },
    { cnName: '常陈四', hip: 61317, raJ2000: 188.4356, decJ2000: 41.3575, mag: 4.250 },
    { cnName: '常陈五', hip: 60646, raJ2000: 186.4622, decJ2000: 39.0186, mag: 5.010 },
    { cnName: '常陈六', hip: 59831, raJ2000: 184.0315, decJ2000: 40.6602, mag: 5.660 },
    { cnName: '常陈七', hip: 58684, raJ2000: 180.5282, decJ2000: 43.0456, mag: null },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
  ] as const,
}

const asterism_Big_Yard_for_Chariots: ChineseAsterism = {
  label: '车府',
  english: 'Big Yard for Chariots',
  type: 'sub',
  mansionIndex: 10,
  mansionLabel: '虚',
  enclosure: null,
  color: '#1B4F72',
  quadrant: '北玄武',
  stars: [
    { cnName: '车府一', hip: 112917, raJ2000: 343.0085, decJ2000: 43.3124, mag: 4.938 },
    { cnName: '车府二', hip: 111944, raJ2000: 340.1286, decJ2000: 44.2763, mag: 4.460 },
    { cnName: '车府三', hip: 110351, raJ2000: 335.2564, decJ2000: 46.5366, mag: 4.540 },
    { cnName: '车府四', hip: 106481, raJ2000: 323.4952, decJ2000: 45.5918, mag: 4.020 },
    { cnName: '车府五', hip: 103632, raJ2000: 314.9565, decJ2000: 47.5209, mag: 4.750 },
    { cnName: '车府六', hip: 104060, raJ2000: 316.2327, decJ2000: 43.9279, mag: 3.730 },
    { cnName: '车府七', hip: 106711, raJ2000: 324.2374, decJ2000: 40.4135, mag: 5.035 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
  ] as const,
}

const asterism_Chariots_and_Cavalry: ChineseAsterism = {
  label: '车骑',
  english: 'Chariots and Cavalry',
  type: 'sub',
  mansionIndex: 1,
  mansionLabel: '亢',
  enclosure: null,
  color: '#27AE60',
  quadrant: '东青龙',
  stars: [
    { cnName: '车骑一', hip: 74395, raJ2000: 228.0712, decJ2000: -52.0992, mag: 3.410 },
    { cnName: '车骑二', hip: 71536, raJ2000: 219.4718, decJ2000: -49.4258, mag: 4.050 },
    { cnName: '车骑三', hip: 71121, raJ2000: 218.1544, decJ2000: -50.4571, mag: 4.423 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Commodity_Market: ChineseAsterism = {
  label: '车肆',
  english: 'Commodity Market',
  type: 'sub',
  mansionIndex: 4,
  mansionLabel: '心',
  enclosure: null,
  color: '#196F3D',
  quadrant: '东青龙',
  stars: [
    { cnName: '车肆一', hip: 80628, raJ2000: 246.9507, decJ2000: -8.3718, mag: 4.630 },
    { cnName: '车肆二', hip: 82369, raJ2000: 252.4584, decJ2000: -10.7831, mag: 4.632 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Hay: ChineseAsterism = {
  label: '刍藁',
  english: 'Hay',
  type: 'sub',
  mansionIndex: 15,
  mansionLabel: '娄',
  enclosure: null,
  color: '#BCC6CC',
  quadrant: '西白虎',
  stars: [
    { cnName: '刍藁一', hip: 11345, raJ2000: 36.4875, decJ2000: -12.2905, mag: 4.866 },
    { cnName: '刍藁二', hip: 12002, raJ2000: 38.6776, decJ2000: -7.8594, mag: 5.731 },
    { cnName: '刍藁三', hip: 10642, raJ2000: 34.2460, decJ2000: -6.4221, mag: 5.499 },
    { cnName: '刍藁四', hip: 11261, raJ2000: 36.2433, decJ2000: -2.7800, mag: 6.335 },
    { cnName: '刍藁五', hip: 11029, raJ2000: 35.5064, decJ2000: -10.7775, mag: 5.421 },
    { cnName: '刍藁六', hip: 12390, raJ2000: 39.8908, decJ2000: -11.8721, mag: 4.870 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [3, 4],
    [4, 5],
  ] as const,
}

const asterism_Pestle_In_Winnowing_Basket_Mansion: ChineseAsterism = {
  label: '杵 (箕宿)',
  english: 'Pestle (In Winnowing Basket Mansion)',
  type: 'sub',
  mansionIndex: 5,
  mansionLabel: '尾',
  enclosure: null,
  color: '#145A32',
  quadrant: '东青龙',
  stars: [
    { cnName: '杵 (箕宿)一', hip: 86092, raJ2000: 263.9150, decJ2000: -46.5057, mag: 4.590 },
    { cnName: '杵 (箕宿)二', hip: 85792, raJ2000: 262.9604, decJ2000: -49.8761, mag: 2.950 },
    { cnName: '杵 (箕宿)三', hip: 85258, raJ2000: 261.3249, decJ2000: -55.5299, mag: 2.850 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Pestle_In_Rooftop_Mansion: ChineseAsterism = {
  label: '杵 (危宿)',
  english: 'Pestle (In Rooftop Mansion)',
  type: 'sub',
  mansionIndex: 11,
  mansionLabel: '危',
  enclosure: null,
  color: '#154360',
  quadrant: '北玄武',
  stars: [
    { cnName: '杵 (危宿)一', hip: 109937, raJ2000: 333.9924, decJ2000: 37.7487, mag: 4.150 },
    { cnName: '杵 (危宿)二', hip: 109410, raJ2000: 332.4968, decJ2000: 33.1782, mag: 4.290 },
    { cnName: '杵 (危宿)三', hip: 109056, raJ2000: 331.3945, decJ2000: 28.9640, mag: 5.700 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Changsha_Vassal_of_Chariot: ChineseAsterism = {
  label: '长沙 (附轸宿)',
  english: 'Changsha (Vassal of Chariot)',
  type: 'sub',
  mansionIndex: 26,
  mansionLabel: '翼',
  enclosure: null,
  color: '#CA6F1E',
  quadrant: '南朱雀',
  stars: [
    { cnName: '长沙 (附轸宿)一', hip: 60189, raJ2000: 185.1402, decJ2000: -22.2159, mag: 5.210 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Guest_House: ChineseAsterism = {
  label: '传舍',
  english: 'Guest House',
  type: 'sub',
  mansionIndex: 18,
  mansionLabel: '毕',
  enclosure: null,
  color: '#566573',
  quadrant: '西白虎',
  stars: [
    { cnName: '传舍一', hip: 117371, raJ2000: 356.9782, decJ2000: 67.8068, mag: 5.044 },
    { cnName: '传舍二', hip: 2707, raJ2000: 8.6038, decJ2000: 66.7503, mag: 6.473 },
    { cnName: '传舍三', hip: 4714, raJ2000: 15.1374, decJ2000: 65.1151, mag: 8.370 },
    { cnName: '传舍四', hip: 5589, raJ2000: 17.9225, decJ2000: 65.0189, mag: 5.564 },
    { cnName: '传舍五', hip: 10438, raJ2000: 33.6212, decJ2000: 66.5244, mag: 6.070 },
    { cnName: '传舍六', hip: 13665, raJ2000: 43.9872, decJ2000: 61.5211, mag: 5.584 },
    { cnName: '传舍七', hip: 16228, raJ2000: 52.2672, decJ2000: 59.9403, mag: 4.220 },
    { cnName: '传舍八', hip: 16281, raJ2000: 52.4781, decJ2000: 58.8787, mag: 4.540 },
    { cnName: '传舍九', hip: 16292, raJ2000: 52.5008, decJ2000: 55.4518, mag: 5.090 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
  ] as const,
}

const asterism_Retinue_In_Room_Mansion: ChineseAsterism = {
  label: '从官 (房宿)',
  english: 'Retinue (In Room Mansion)',
  type: 'sub',
  mansionIndex: 2,
  mansionLabel: '氐',
  enclosure: null,
  color: '#229954',
  quadrant: '东青龙',
  stars: [
    { cnName: '从官 (房宿)一', hip: 77634, raJ2000: 237.7398, decJ2000: -33.6271, mag: 3.946 },
    { cnName: '从官 (房宿)二', hip: 76945, raJ2000: 235.6709, decJ2000: -34.7104, mag: 4.721 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Retinue_In_Supreme_Palace_Enclosure: ChineseAsterism = {
  label: '从官 (太微垣)',
  english: 'Retinue (In Supreme Palace Enclosure)',
  type: 'sub',
  mansionIndex: 26,
  mansionLabel: '翼',
  enclosure: null,
  color: '#CA6F1E',
  quadrant: '南朱雀',
  stars: [
    { cnName: '从官 (太微垣)一', hip: 56975, raJ2000: 175.1961, decJ2000: 21.3527, mag: 5.255 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Great_Horn: ChineseAsterism = {
  label: '大角',
  english: 'Great Horn',
  type: 'sub',
  mansionIndex: 1,
  mansionLabel: '亢',
  enclosure: null,
  color: '#27AE60',
  quadrant: '东青龙',
  stars: [
    { cnName: '大角一', hip: 69673, raJ2000: 213.9153, decJ2000: 19.1824, mag: -0.050 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Chief_Judge: ChineseAsterism = {
  label: '大理',
  english: 'Chief Judge',
  type: 'sub',
  mansionIndex: 26,
  mansionLabel: '翼',
  enclosure: null,
  color: '#CA6F1E',
  quadrant: '南朱雀',
  stars: [
    { cnName: '大理一', hip: 59504, raJ2000: 183.0498, decJ2000: 77.6162, mag: 5.137 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Mausoleum: ChineseAsterism = {
  label: '大陵',
  english: 'Mausoleum',
  type: 'sub',
  mansionIndex: 16,
  mansionLabel: '胃',
  enclosure: null,
  color: '#AEB6BF',
  quadrant: '西白虎',
  stars: [
    { cnName: '大陵一', hip: 11060, raJ2000: 35.5893, decJ2000: 55.8457, mag: 5.170 },
    { cnName: '大陵二', hip: 13531, raJ2000: 43.5645, decJ2000: 52.7625, mag: 3.960 },
    { cnName: '大陵三', hip: 14632, raJ2000: 47.2667, decJ2000: 49.6133, mag: null },
    { cnName: '大陵四', hip: 14668, raJ2000: 47.3742, decJ2000: 44.8575, mag: 3.810 },
    { cnName: '大陵五', hip: 14576, raJ2000: 47.0422, decJ2000: 40.9556, mag: 2.120 },
    { cnName: '大陵六', hip: 14354, raJ2000: 46.2941, decJ2000: 38.8403, mag: 3.390 },
    { cnName: '大陵七', hip: 13254, raJ2000: 42.6461, decJ2000: 38.3186, mag: null },
    { cnName: '大陵八', hip: 12623, raJ2000: 40.5621, decJ2000: 40.1940, mag: 4.920 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
  ] as const,
}

const asterism_Celestial_Temple: ChineseAsterism = {
  label: '天庙',
  english: 'Celestial Temple',
  type: 'sub',
  mansionIndex: 12,
  mansionLabel: '室',
  enclosure: null,
  color: '#0B5345',
  quadrant: '北玄武',
  stars: [
  ],
  connections: [
  ] as const,
}

const asterism_Mattress_of_the_Emperor: ChineseAsterism = {
  label: '帝席',
  english: 'Mattress of the Emperor',
  type: 'sub',
  mansionIndex: 0,
  mansionLabel: '角',
  enclosure: null,
  color: '#2ECC71',
  quadrant: '东青龙',
  stars: [
    { cnName: '帝席一', hip: 69226, raJ2000: 212.5997, decJ2000: 25.0917, mag: 4.830 },
    { cnName: '帝席二', hip: 68478, raJ2000: 210.2937, decJ2000: 27.3866, mag: 6.221 },
    { cnName: '帝席三', hip: 68103, raJ2000: 209.1424, decJ2000: 27.4921, mag: 5.000 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Emperor_s_Seat: ChineseAsterism = {
  label: '帝座',
  english: 'Emperor\'s Seat',
  type: 'sub',
  mansionIndex: 5,
  mansionLabel: '尾',
  enclosure: null,
  color: '#145A32',
  quadrant: '东青龙',
  stars: [
    { cnName: '帝座一', hip: 84345, raJ2000: 258.6619, decJ2000: 14.3903, mag: null },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Eastern_Door: ChineseAsterism = {
  label: '东咸',
  english: 'Eastern Door',
  type: 'sub',
  mansionIndex: 4,
  mansionLabel: '心',
  enclosure: null,
  color: '#196F3D',
  quadrant: '东青龙',
  stars: [
    { cnName: '东咸一', hip: 80894, raJ2000: 247.7849, decJ2000: -16.6127, mag: 4.270 },
    { cnName: '东咸二', hip: 80569, raJ2000: 246.7560, decJ2000: -18.4562, mag: 4.430 },
    { cnName: '东咸三', hip: 80343, raJ2000: 246.0257, decJ2000: -20.0373, mag: 4.500 },
    { cnName: '东咸四', hip: 80975, raJ2000: 248.0342, decJ2000: -21.4664, mag: 4.450 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Dipper_for_Liquids: ChineseAsterism = {
  label: '斗',
  english: 'Dipper for Liquids',
  type: 'sub',
  mansionIndex: 4,
  mansionLabel: '心',
  enclosure: null,
  color: '#196F3D',
  quadrant: '东青龙',
  stars: [
    { cnName: '斗一', hip: 80463, raJ2000: 246.3540, decJ2000: 14.0333, mag: 4.580 },
    { cnName: '斗二', hip: 79492, raJ2000: 243.3269, decJ2000: 13.5269, mag: null },
    { cnName: '斗三', hip: 79634, raJ2000: 243.7553, decJ2000: 11.4900, mag: 7.540 },
    { cnName: '斗四', hip: 81008, raJ2000: 248.1512, decJ2000: 11.4880, mag: 4.850 },
    { cnName: '斗五', hip: 81354, raJ2000: 249.2152, decJ2000: 7.1072, mag: 7.280 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
  ] as const,
}

const asterism_Trials: ChineseAsterism = {
  label: '顿顽',
  english: 'Trials',
  type: 'sub',
  mansionIndex: 2,
  mansionLabel: '氐',
  enclosure: null,
  color: '#229954',
  quadrant: '东青龙',
  stars: [
    { cnName: '顿顽一', hip: 74604, raJ2000: 228.6555, decJ2000: -31.5191, mag: 4.918 },
    { cnName: '顿顽二', hip: 75177, raJ2000: 230.4515, decJ2000: -36.2614, mag: 3.546 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Send_Armed_Forces_To_Suppress_Vassal_of_Three_Stars: ChineseAsterism = {
  label: '伐 (附参宿)',
  english: 'Send Armed Forces To Suppress (Vassal of Three Stars)',
  type: 'sub',
  mansionIndex: 19,
  mansionLabel: '觜',
  enclosure: null,
  color: '#2C3E50',
  quadrant: '西白虎',
  stars: [
    { cnName: '伐 (附参宿)一', hip: 26237, raJ2000: 83.8465, decJ2000: -4.8383, mag: 4.590 },
    { cnName: '伐 (附参宿)二', hip: 26235, raJ2000: 83.8454, decJ2000: -5.4161, mag: 6.390 },
    { cnName: '伐 (附参宿)三', hip: 26241, raJ2000: 83.8583, decJ2000: -5.9099, mag: 2.770 },
    { cnName: '伐 (附参宿)四', hip: 26311, raJ2000: 84.0534, decJ2000: -1.2019, mag: 1.690 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [0, 3],
  ] as const,
}

const asterism_Punishment: ChineseAsterism = {
  label: '罚',
  english: 'Punishment',
  type: 'sub',
  mansionIndex: 3,
  mansionLabel: '房',
  enclosure: null,
  color: '#1D8348',
  quadrant: '东青龙',
  stars: [
    { cnName: '罚一', hip: 79672, raJ2000: 243.9053, decJ2000: -8.3694, mag: 5.500 },
    { cnName: '罚二', hip: 79005, raJ2000: 241.9017, decJ2000: -12.7454, mag: 5.770 },
    { cnName: '罚三', hip: 78400, raJ2000: 240.0818, decJ2000: -16.5334, mag: 5.450 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Flying_Fish: ChineseAsterism = {
  label: '飞鱼',
  english: 'Flying Fish',
  type: 'sub',
  mansionIndex: 21,
  mansionLabel: '井',
  enclosure: null,
  color: '#F5B7B1',
  quadrant: '南朱雀',
  stars: [
    { cnName: '飞鱼一', hip: 44382, raJ2000: 135.6117, decJ2000: -66.3961, mag: 3.990 },
    { cnName: '飞鱼二', hip: 34481, raJ2000: 107.1869, decJ2000: -70.4989, mag: 3.746 },
    { cnName: '飞鱼三', hip: 41312, raJ2000: 126.4341, decJ2000: -66.1369, mag: 3.759 },
    { cnName: '飞鱼四', hip: 40817, raJ2000: 124.9540, decJ2000: -71.5149, mag: 5.318 },
    { cnName: '飞鱼五', hip: 35228, raJ2000: 109.2076, decJ2000: -67.9572, mag: 3.990 },
    { cnName: '飞鱼六', hip: 37504, raJ2000: 115.4552, decJ2000: -72.6061, mag: 3.944 },
  ],
  connections: [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [0, 5],
  ] as const,
}

const asterism_Tomb_Vassal_of_Rooftop: ChineseAsterism = {
  label: '坟墓 (附危宿)',
  english: 'Tomb (Vassal of Rooftop)',
  type: 'sub',
  mansionIndex: 11,
  mansionLabel: '危',
  enclosure: null,
  color: '#154360',
  quadrant: '北玄武',
  stars: [
    { cnName: '坟墓 (附危宿)一', hip: 110960, raJ2000: 337.2079, decJ2000: -0.0199, mag: 3.650 },
    { cnName: '坟墓 (附危宿)二', hip: 110395, raJ2000: 335.4140, decJ2000: -1.3873, mag: 3.834 },
    { cnName: '坟墓 (附危宿)三', hip: 111497, raJ2000: 338.8391, decJ2000: -0.1175, mag: 4.030 },
    { cnName: '坟墓 (附危宿)四', hip: 110672, raJ2000: 336.3193, decJ2000: 1.3774, mag: 4.640 },
    { cnName: '坟墓 (附危宿)五', hip: 109074, raJ2000: 331.4460, decJ2000: -0.3199, mag: 2.940 },
  ],
  connections: [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
  ] as const,
}

const asterism_Axe: ChineseAsterism = {
  label: '鈇钺',
  english: 'Axe',
  type: 'sub',
  mansionIndex: 12,
  mansionLabel: '室',
  enclosure: null,
  color: '#0B5345',
  quadrant: '北玄武',
  stars: [
    { cnName: '鈇钺一', hip: 116889, raJ2000: 355.3937, decJ2000: -18.0271, mag: 5.344 },
    { cnName: '鈇钺二', hip: 117089, raJ2000: 356.0503, decJ2000: -18.2769, mag: 5.239 },
    { cnName: '鈇钺三', hip: 117629, raJ2000: 357.8389, decJ2000: -18.9092, mag: 5.180 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Sickle: ChineseAsterism = {
  label: '鈇锧',
  english: 'Sickle',
  type: 'sub',
  mansionIndex: 14,
  mansionLabel: '奎',
  enclosure: null,
  color: '#D4AF37',
  quadrant: '西白虎',
  stars: [
    { cnName: '鈇锧一', hip: 6960, raJ2000: 22.4006, decJ2000: -21.6293, mag: 5.104 },
    { cnName: '鈇锧二', hip: 9347, raJ2000: 30.0013, decJ2000: -21.0778, mag: 4.020 },
    { cnName: '鈇锧三', hip: 9061, raJ2000: 29.1675, decJ2000: -22.5268, mag: 4.850 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Basket_for_Mulberry_Leaves: ChineseAsterism = {
  label: '扶筐',
  english: 'Basket for Mulberry Leaves',
  type: 'sub',
  mansionIndex: 7,
  mansionLabel: '斗',
  enclosure: null,
  color: '#5DADE2',
  quadrant: '北玄武',
  stars: [
    { cnName: '扶筐一', hip: 91755, raJ2000: 280.6582, decJ2000: 55.5394, mag: 5.020 },
    { cnName: '扶筐二', hip: 90905, raJ2000: 278.1438, decJ2000: 57.0456, mag: 4.761 },
    { cnName: '扶筐三', hip: 90156, raJ2000: 275.9775, decJ2000: 58.8007, mag: null },
    { cnName: '扶筐四', hip: 92512, raJ2000: 282.8004, decJ2000: 59.3884, mag: 4.636 },
    { cnName: '扶筐五', hip: 92997, raJ2000: 284.1876, decJ2000: 57.8148, mag: 5.663 },
    { cnName: '扶筐六', hip: 93340, raJ2000: 285.1811, decJ2000: 55.6583, mag: 5.513 },
    { cnName: '扶筐七', hip: 93713, raJ2000: 286.2299, decJ2000: 53.3967, mag: 5.380 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
  ] as const,
}

const asterism_White_Patched_Nearby: ChineseAsterism = {
  label: '附白',
  english: 'White Patched Nearby',
  type: 'sub',
  mansionIndex: 16,
  mansionLabel: '胃',
  enclosure: null,
  color: '#AEB6BF',
  quadrant: '西白虎',
  stars: [
    { cnName: '附白一', hip: 17678, raJ2000: 56.8098, decJ2000: -74.2390, mag: 3.260 },
    { cnName: '附白二', hip: 13244, raJ2000: 42.6186, decJ2000: -75.0669, mag: 4.742 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Auxiliary_Road: ChineseAsterism = {
  label: '附路',
  english: 'Auxiliary Road',
  type: 'sub',
  mansionIndex: 13,
  mansionLabel: '壁',
  enclosure: null,
  color: '#0E6251',
  quadrant: '北玄武',
  stars: [
    { cnName: '附路一', hip: 2920, raJ2000: 9.2429, decJ2000: 53.8969, mag: 3.660 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Fu_Yue: ChineseAsterism = {
  label: '傅说',
  english: 'Fu Yue',
  type: 'sub',
  mansionIndex: 5,
  mansionLabel: '尾',
  enclosure: null,
  color: '#145A32',
  quadrant: '东青龙',
  stars: [
    { cnName: '傅说一', hip: 87261, raJ2000: 267.4645, decJ2000: -37.0433, mag: 3.210 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Roofing: ChineseAsterism = {
  label: '盖屋',
  english: 'Roofing',
  type: 'sub',
  mansionIndex: 10,
  mansionLabel: '虚',
  enclosure: null,
  color: '#1B4F72',
  quadrant: '北玄武',
  stars: [
    { cnName: '盖屋一', hip: 108874, raJ2000: 330.8285, decJ2000: -2.1554, mag: 4.690 },
    { cnName: '盖屋二', hip: 108991, raJ2000: 331.1976, decJ2000: -0.9063, mag: 5.271 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Canopy_Support_Vassal_of_Canopy_of_the_Emperor: ChineseAsterism = {
  label: '杠 (附华盖)',
  english: 'Canopy Support (Vassal of Canopy of the Emperor)',
  type: 'sub',
  mansionIndex: 15,
  mansionLabel: '娄',
  enclosure: null,
  color: '#BCC6CC',
  quadrant: '西白虎',
  stars: [
    { cnName: '杠 (附华盖)一', hip: 17959, raJ2000: 57.5896, decJ2000: 71.3323, mag: 4.604 },
    { cnName: '杠 (附华盖)二', hip: 14862, raJ2000: 47.9845, decJ2000: 74.3937, mag: 4.834 },
    { cnName: '杠 (附华盖)三', hip: 9763, raJ2000: 31.3815, decJ2000: 76.1151, mag: 5.220 },
    { cnName: '杠 (附华盖)四', hip: 9802, raJ2000: 31.5110, decJ2000: 74.5837, mag: 7.490 },
    { cnName: '杠 (附华盖)五', hip: 9598, raJ2000: 30.8588, decJ2000: 72.4213, mag: 3.938 },
    { cnName: '杠 (附华盖)六', hip: 10031, raJ2000: 32.2844, decJ2000: 71.5520, mag: null },
    { cnName: '杠 (附华盖)七', hip: 9480, raJ2000: 30.4896, decJ2000: 70.9070, mag: 4.540 },
    { cnName: '杠 (附华盖)八', hip: 8016, raJ2000: 25.7328, decJ2000: 70.6225, mag: 5.174 },
    { cnName: '杠 (附华盖)九', hip: 7078, raJ2000: 22.8073, decJ2000: 70.2646, mag: null },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
  ] as const,
}

const asterism_Flying_Corridor: ChineseAsterism = {
  label: '阁道',
  english: 'Flying Corridor',
  type: 'sub',
  mansionIndex: 14,
  mansionLabel: '奎',
  enclosure: null,
  color: '#D4AF37',
  quadrant: '西白虎',
  stars: [
    { cnName: '阁道一', hip: 11569, raJ2000: 37.2664, decJ2000: 67.4025, mag: null },
    { cnName: '阁道二', hip: 8886, raJ2000: 28.5989, decJ2000: 63.6701, mag: 3.370 },
    { cnName: '阁道三', hip: 6686, raJ2000: 21.4540, decJ2000: 60.2353, mag: 2.680 },
    { cnName: '阁道四', hip: 5542, raJ2000: 17.7757, decJ2000: 55.1499, mag: 4.330 },
    { cnName: '阁道五', hip: 3801, raJ2000: 12.2084, decJ2000: 50.9682, mag: 4.891 },
    { cnName: '阁道六', hip: 3504, raJ2000: 11.1813, decJ2000: 48.2844, mag: 4.500 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
  ] as const,
}

const asterism_Celestial_Lance: ChineseAsterism = {
  label: '梗河',
  english: 'Celestial Lance',
  type: 'sub',
  mansionIndex: 1,
  mansionLabel: '亢',
  enclosure: null,
  color: '#27AE60',
  quadrant: '东青龙',
  stars: [
    { cnName: '梗河一', hip: 72105, raJ2000: 221.2467, decJ2000: 27.0742, mag: 2.450 },
    { cnName: '梗河二', hip: 71284, raJ2000: 218.6701, decJ2000: 29.7451, mag: 4.470 },
    { cnName: '梗河三', hip: 71053, raJ2000: 217.9575, decJ2000: 30.3714, mag: 3.590 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Curved_Array: ChineseAsterism = {
  label: '勾陈',
  english: 'Curved Array',
  type: 'sub',
  mansionIndex: 27,
  mansionLabel: '轸',
  enclosure: null,
  color: '#BA4A00',
  quadrant: '南朱雀',
  stars: [
    { cnName: '勾陈一', hip: 113116, raJ2000: 343.6040, decJ2000: 84.3462, mag: 4.684 },
    { cnName: '勾陈二', hip: 5372, raJ2000: 17.1870, decJ2000: 86.2571, mag: 4.225 },
    { cnName: '勾陈三', hip: 11767, raJ2000: 37.9546, decJ2000: 89.2641, mag: 2.020 },
    { cnName: '勾陈四', hip: 85822, raJ2000: 263.0542, decJ2000: 86.5865, mag: 4.336 },
    { cnName: '勾陈五', hip: 82080, raJ2000: 251.4927, decJ2000: 82.0373, mag: 4.212 },
    { cnName: '勾陈六', hip: 77055, raJ2000: 236.0147, decJ2000: 77.7945, mag: 4.274 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
  ] as const,
}

const asterism_Lock_Vassal_of_Room: ChineseAsterism = {
  label: '钩钤 (附房宿)',
  english: 'Lock (Vassal of Room)',
  type: 'sub',
  mansionIndex: 3,
  mansionLabel: '房',
  enclosure: null,
  color: '#1D8348',
  quadrant: '东青龙',
  stars: [
    { cnName: '钩钤 (附房宿)一', hip: 78933, raJ2000: 241.7018, decJ2000: -20.6692, mag: 3.970 },
    { cnName: '钩钤 (附房宿)二', hip: 78990, raJ2000: 241.8514, decJ2000: -20.8688, mag: 4.330 },
    { cnName: '钩钤 (附房宿)三', hip: 78820, raJ2000: 241.3593, decJ2000: -19.8055, mag: 2.620 },
  ],
  connections: [
    [0, 1],
    [0, 2],
  ] as const,
}

const asterism_Dog: ChineseAsterism = {
  label: '狗',
  english: 'Dog',
  type: 'sub',
  mansionIndex: 7,
  mansionLabel: '斗',
  enclosure: null,
  color: '#5DADE2',
  quadrant: '北玄武',
  stars: [
    { cnName: '狗一', hip: 96465, raJ2000: 294.1768, decJ2000: -24.8836, mag: 4.598 },
    { cnName: '狗二', hip: 95477, raJ2000: 291.3187, decJ2000: -24.5086, mag: 5.009 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Territory_of_Dog: ChineseAsterism = {
  label: '狗国',
  english: 'Territory of Dog',
  type: 'sub',
  mansionIndex: 7,
  mansionLabel: '斗',
  enclosure: null,
  color: '#5DADE2',
  quadrant: '北玄武',
  stars: [
    { cnName: '狗国一', hip: 98066, raJ2000: 298.9598, decJ2000: -26.2994, mag: 4.700 },
    { cnName: '狗国二', hip: 98353, raJ2000: 299.7383, decJ2000: -26.1958, mag: 4.846 },
    { cnName: '狗国三', hip: 98688, raJ2000: 300.6645, decJ2000: -27.7098, mag: 4.580 },
    { cnName: '狗国四', hip: 98162, raJ2000: 299.2368, decJ2000: -27.1699, mag: 4.528 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
  ] as const,
}

const asterism_Coiled_Thong: ChineseAsterism = {
  label: '贯索',
  english: 'Coiled Thong',
  type: 'sub',
  mansionIndex: 2,
  mansionLabel: '氐',
  enclosure: null,
  color: '#229954',
  quadrant: '东青龙',
  stars: [
    { cnName: '贯索一', hip: 77048, raJ2000: 235.9971, decJ2000: 32.5158, mag: 5.575 },
    { cnName: '贯索二', hip: 76127, raJ2000: 233.2324, decJ2000: 31.3591, mag: 4.130 },
    { cnName: '贯索三', hip: 75695, raJ2000: 231.9573, decJ2000: 29.1057, mag: 3.680 },
    { cnName: '贯索四', hip: 76267, raJ2000: 233.6720, decJ2000: 26.7147, mag: 2.240 },
    { cnName: '贯索五', hip: 76952, raJ2000: 235.6857, decJ2000: 26.2956, mag: null },
    { cnName: '贯索六', hip: 77512, raJ2000: 237.3985, decJ2000: 26.0684, mag: 4.630 },
    { cnName: '贯索七', hip: 78159, raJ2000: 239.3969, decJ2000: 26.8779, mag: 4.130 },
    { cnName: '贯索八', hip: 78493, raJ2000: 240.3607, decJ2000: 29.8511, mag: 4.971 },
    { cnName: '贯索九', hip: 78459, raJ2000: 240.2611, decJ2000: 33.3035, mag: null },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
  ] as const,
}

const asterism_Beacon_Fire: ChineseAsterism = {
  label: '爟',
  english: 'Beacon Fire',
  type: 'sub',
  mansionIndex: 21,
  mansionLabel: '井',
  enclosure: null,
  color: '#F5B7B1',
  quadrant: '南朱雀',
  stars: [
    { cnName: '爟一', hip: 40023, raJ2000: 122.6133, decJ2000: 25.5073, mag: null },
    { cnName: '爟二', hip: 40881, raJ2000: 125.1339, decJ2000: 24.0223, mag: 5.930 },
    { cnName: '爟三', hip: 41377, raJ2000: 126.6154, decJ2000: 27.8936, mag: 5.570 },
    { cnName: '爟四', hip: 40240, raJ2000: 123.2870, decJ2000: 29.6565, mag: 5.605 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Tortoise: ChineseAsterism = {
  label: 'unknown',
  english: 'Tortoise',
  type: 'sub',
  mansionIndex: 5,
  mansionLabel: '尾',
  enclosure: null,
  color: '#145A32',
  quadrant: '东青龙',
  stars: [
    { cnName: 'unknown一', hip: 83153, raJ2000: 254.8960, decJ2000: -53.1604, mag: 4.050 },
    { cnName: 'unknown二', hip: 85267, raJ2000: 261.3486, decJ2000: -56.3777, mag: 3.340 },
    { cnName: 'unknown三', hip: 85727, raJ2000: 262.7746, decJ2000: -60.6838, mag: 3.620 },
    { cnName: 'unknown四', hip: 82363, raJ2000: 252.4465, decJ2000: -59.0414, mag: 3.744 },
    { cnName: 'unknown五', hip: 83081, raJ2000: 254.6551, decJ2000: -55.9901, mag: 3.076 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
  ] as const,
}

const asterism_Sea_and_Mountain: ChineseAsterism = {
  label: '海山',
  english: 'Sea and Mountain',
  type: 'sub',
  mansionIndex: 26,
  mansionLabel: '翼',
  enclosure: null,
  color: '#CA6F1E',
  quadrant: '南朱雀',
  stars: [
    { cnName: '海山一', hip: 51232, raJ2000: 156.9697, decJ2000: -58.7394, mag: 3.810 },
    { cnName: '海山二', hip: 52558, raJ2000: 161.1876, decJ2000: -59.5652, mag: 7.500 },
    { cnName: '海山三', hip: 56561, raJ2000: 173.9453, decJ2000: -63.0198, mag: 3.140 },
    { cnName: '海山四', hip: 57363, raJ2000: 176.4017, decJ2000: -66.7288, mag: 3.650 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Sea_Rock: ChineseAsterism = {
  label: '海石',
  english: 'Sea Rock',
  type: 'sub',
  mansionIndex: 23,
  mansionLabel: '柳',
  enclosure: null,
  color: '#EC7063',
  quadrant: '南朱雀',
  stars: [
    { cnName: '海石一', hip: 41037, raJ2000: 125.6285, decJ2000: -59.5095, mag: 1.860 },
    { cnName: '海石二', hip: 45556, raJ2000: 139.2725, decJ2000: -59.2752, mag: 2.260 },
    { cnName: '海石三', hip: 46974, raJ2000: 143.6110, decJ2000: -59.2298, mag: 4.090 },
    { cnName: '海石四', hip: 47854, raJ2000: 146.3117, decJ2000: -62.5079, mag: 3.750 },
    { cnName: '海石五', hip: 48002, raJ2000: 146.7755, decJ2000: -65.0720, mag: 2.990 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
  ] as const,
}

const asterism_Military_Gate: ChineseAsterism = {
  label: '军门',
  english: 'Military Gate',
  type: 'sub',
  mansionIndex: 12,
  mansionLabel: '室',
  enclosure: null,
  color: '#0B5345',
  quadrant: '北玄武',
  stars: [
  ],
  connections: [
  ] as const,
}

const asterism_Drum_at_the_River: ChineseAsterism = {
  label: '河鼓',
  english: 'Drum at the River',
  type: 'sub',
  mansionIndex: 7,
  mansionLabel: '斗',
  enclosure: null,
  color: '#5DADE2',
  quadrant: '北玄武',
  stars: [
    { cnName: '河鼓一', hip: 98036, raJ2000: 298.8283, decJ2000: 6.4068, mag: 3.710 },
    { cnName: '河鼓二', hip: 97649, raJ2000: 297.6958, decJ2000: 8.8683, mag: 0.760 },
    { cnName: '河鼓三', hip: 97278, raJ2000: 296.5649, decJ2000: 10.6133, mag: 2.720 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Crane: ChineseAsterism = {
  label: '鹤',
  english: 'Crane',
  type: 'sub',
  mansionIndex: 11,
  mansionLabel: '危',
  enclosure: null,
  color: '#154360',
  quadrant: '北玄武',
  stars: [
    { cnName: '鹤一', hip: 109268, raJ2000: 332.0583, decJ2000: -46.9610, mag: 1.710 },
    { cnName: '鹤二', hip: 112122, raJ2000: 340.6669, decJ2000: -46.8846, mag: 2.110 },
    { cnName: '鹤三', hip: 112623, raJ2000: 342.1387, decJ2000: -51.3169, mag: 3.466 },
    { cnName: '鹤四', hip: 112374, raJ2000: 341.4078, decJ2000: -53.5001, mag: 4.846 },
    { cnName: '鹤五', hip: 114996, raJ2000: 349.3573, decJ2000: -58.2357, mag: 3.980 },
    { cnName: '鹤六', hip: 113638, raJ2000: 345.2200, decJ2000: -52.7541, mag: 4.115 },
    { cnName: '鹤七', hip: 114421, raJ2000: 347.5897, decJ2000: -45.2467, mag: 3.877 },
    { cnName: '鹤八', hip: 114131, raJ2000: 346.7197, decJ2000: -43.5204, mag: 4.332 },
    { cnName: '鹤九', hip: 112203, raJ2000: 340.8749, decJ2000: -41.4143, mag: 4.835 },
    { cnName: '鹤十', hip: 110936, raJ2000: 337.1634, decJ2000: -39.1318, mag: 5.473 },
    { cnName: '鹤十一', hip: 111043, raJ2000: 337.4393, decJ2000: -43.7492, mag: 4.110 },
    { cnName: '鹤十二', hip: 109908, raJ2000: 333.9038, decJ2000: -41.3468, mag: 4.798 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 1],
    [1, 6],
    [1, 7],
    [1, 8],
    [8, 9],
    [1, 10],
    [10, 11],
  ] as const,
}

const asterism_Railings: ChineseAsterism = {
  label: '衡',
  english: 'Railings',
  type: 'sub',
  mansionIndex: 0,
  mansionLabel: '角',
  enclosure: null,
  color: '#2ECC71',
  quadrant: '东青龙',
  stars: [
    { cnName: '衡一', hip: 67464, raJ2000: 207.3762, decJ2000: -41.6877, mag: 3.386 },
    { cnName: '衡二', hip: 67472, raJ2000: 207.4041, decJ2000: -42.4737, mag: 3.430 },
    { cnName: '衡三', hip: 68245, raJ2000: 209.5678, decJ2000: -42.1008, mag: 3.802 },
    { cnName: '衡四', hip: 68862, raJ2000: 211.5115, decJ2000: -41.1796, mag: 4.343 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Astrologer: ChineseAsterism = {
  label: '候',
  english: 'Astrologer',
  type: 'sub',
  mansionIndex: 5,
  mansionLabel: '尾',
  enclosure: null,
  color: '#145A32',
  quadrant: '东青龙',
  stars: [
    { cnName: '候一', hip: 86032, raJ2000: 263.7336, decJ2000: 12.5600, mag: 2.070 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Bow_and_Arrow: ChineseAsterism = {
  label: '弧矢',
  english: 'Bow and Arrow',
  type: 'sub',
  mansionIndex: 21,
  mansionLabel: '井',
  enclosure: null,
  color: '#F5B7B1',
  quadrant: '南朱雀',
  stars: [
    { cnName: '弧矢一', hip: 34444, raJ2000: 107.0979, decJ2000: -26.3932, mag: 1.840 },
    { cnName: '弧矢二', hip: 35904, raJ2000: 111.0238, decJ2000: -29.3031, mag: 2.450 },
    { cnName: '弧矢三', hip: 37819, raJ2000: 116.3137, decJ2000: -37.9686, mag: 3.610 },
    { cnName: '弧矢四', hip: 38901, raJ2000: 119.4171, decJ2000: -30.3346, mag: 4.790 },
    { cnName: '弧矢五', hip: 38070, raJ2000: 117.0215, decJ2000: -25.9372, mag: 4.490 },
    { cnName: '弧矢六', hip: 37229, raJ2000: 114.7078, decJ2000: -26.8038, mag: null },
    { cnName: '弧矢七', hip: 33579, raJ2000: 104.6565, decJ2000: -28.9721, mag: 1.500 },
    { cnName: '弧矢八', hip: 32759, raJ2000: 102.4602, decJ2000: -32.5085, mag: 3.890 },
    { cnName: '弧矢九', hip: 35264, raJ2000: 109.2857, decJ2000: -37.0975, mag: 2.700 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 1],
    [1, 6],
    [6, 7],
    [7, 8],
    [8, 2],
  ] as const,
}

const asterism_Dipper_for_Solids: ChineseAsterism = {
  label: '斛',
  english: 'Dipper for Solids',
  type: 'sub',
  mansionIndex: 5,
  mansionLabel: '尾',
  enclosure: null,
  color: '#145A32',
  quadrant: '东青龙',
  stars: [
    { cnName: '斛一', hip: 82673, raJ2000: 253.5020, decJ2000: 10.1654, mag: 4.380 },
    { cnName: '斛二', hip: 83000, raJ2000: 254.4171, decJ2000: 9.3750, mag: 3.200 },
    { cnName: '斛三', hip: 82402, raJ2000: 252.5808, decJ2000: 7.2477, mag: 5.469 },
    { cnName: '斛四', hip: 82073, raJ2000: 251.4579, decJ2000: 8.5826, mag: 5.150 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Emperor_s_Bodyguard: ChineseAsterism = {
  label: '虎贲',
  english: 'Emperor\'s Bodyguard',
  type: 'sub',
  mansionIndex: 26,
  mansionLabel: '翼',
  enclosure: null,
  color: '#CA6F1E',
  quadrant: '南朱雀',
  stars: [
    { cnName: '虎贲一', hip: 54951, raJ2000: 168.8010, decJ2000: 23.0955, mag: 4.630 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Good_Gourd: ChineseAsterism = {
  label: '瓠瓜',
  english: 'Good Gourd',
  type: 'sub',
  mansionIndex: 8,
  mansionLabel: '牛',
  enclosure: null,
  color: '#3498DB',
  quadrant: '北玄武',
  stars: [
    { cnName: '瓠瓜一', hip: 102532, raJ2000: 311.6646, decJ2000: 16.1243, mag: 4.250 },
    { cnName: '瓠瓜二', hip: 101958, raJ2000: 309.9095, decJ2000: 15.9122, mag: 3.800 },
    { cnName: '瓠瓜三', hip: 101769, raJ2000: 309.3873, decJ2000: 14.5951, mag: 3.630 },
    { cnName: '瓠瓜四', hip: 102281, raJ2000: 310.8647, decJ2000: 15.0746, mag: 4.417 },
    { cnName: '瓠瓜五', hip: 101589, raJ2000: 308.8272, decJ2000: 14.6742, mag: 4.647 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [2, 4],
  ] as const,
}

const asterism_Canopy_of_the_Emperor: ChineseAsterism = {
  label: '华盖',
  english: 'Canopy of the Emperor',
  type: 'sub',
  mansionIndex: 14,
  mansionLabel: '奎',
  enclosure: null,
  color: '#D4AF37',
  quadrant: '西白虎',
  stars: [
    { cnName: '华盖一', hip: 7078, raJ2000: 22.8073, decJ2000: 70.2646, mag: null },
    { cnName: '华盖二', hip: 7650, raJ2000: 24.6288, decJ2000: 73.0400, mag: 5.281 },
    { cnName: '华盖三', hip: 5926, raJ2000: 19.0496, decJ2000: 71.7438, mag: 5.860 },
    { cnName: '华盖四', hip: 5518, raJ2000: 17.6638, decJ2000: 68.7786, mag: 5.309 },
    { cnName: '华盖五', hip: 6692, raJ2000: 21.4834, decJ2000: 68.1300, mag: 4.727 },
    { cnName: '华盖六', hip: 7965, raJ2000: 25.5855, decJ2000: 68.0430, mag: 5.590 },
    { cnName: '华盖七', hip: 9009, raJ2000: 29.0001, decJ2000: 68.6852, mag: 4.968 },
  ],
  connections: [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [0, 5],
    [0, 6],
  ] as const,
}

const asterism_Eunuch_Official: ChineseAsterism = {
  label: '宦者',
  english: 'Eunuch Official',
  type: 'sub',
  mansionIndex: 5,
  mansionLabel: '尾',
  enclosure: null,
  color: '#145A32',
  quadrant: '东青龙',
  stars: [
    { cnName: '宦者一', hip: 83430, raJ2000: 255.7828, decJ2000: 14.0919, mag: 4.980 },
    { cnName: '宦者二', hip: 83478, raJ2000: 255.9138, decJ2000: 13.6053, mag: 5.908 },
    { cnName: '宦者三', hip: 83613, raJ2000: 256.3445, decJ2000: 12.7408, mag: 4.871 },
    { cnName: '宦者四', hip: 84177, raJ2000: 258.1159, decJ2000: 10.5852, mag: 5.340 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Firebird: ChineseAsterism = {
  label: '火鸟',
  english: 'Firebird',
  type: 'sub',
  mansionIndex: 21,
  mansionLabel: '井',
  enclosure: null,
  color: '#F5B7B1',
  quadrant: '南朱雀',
  stars: [
    { cnName: '火鸟一', hip: 116231, raJ2000: 353.2428, decJ2000: -37.8183, mag: 4.370 },
    { cnName: '火鸟二', hip: 116389, raJ2000: 353.7690, decJ2000: -42.6151, mag: 4.710 },
    { cnName: '火鸟三', hip: 116602, raJ2000: 354.4625, decJ2000: -45.4924, mag: 4.740 },
    { cnName: '火鸟四', hip: 765, raJ2000: 2.3527, decJ2000: -45.7474, mag: 3.870 },
    { cnName: '火鸟五', hip: 2072, raJ2000: 6.5508, decJ2000: -43.6798, mag: 3.940 },
    { cnName: '火鸟六', hip: 2081, raJ2000: 6.5710, decJ2000: -42.3060, mag: 2.380 },
    { cnName: '火鸟七', hip: 3245, raJ2000: 10.3315, decJ2000: -46.0850, mag: 4.590 },
    { cnName: '火鸟八', hip: 2472, raJ2000: 7.8541, decJ2000: -48.8035, mag: 4.770 },
    { cnName: '火鸟九', hip: 5165, raJ2000: 16.5210, decJ2000: -46.7184, mag: 3.300 },
    { cnName: '火鸟十', hip: 6867, raJ2000: 22.0914, decJ2000: -43.3182, mag: 3.420 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    [8, 9],
  ] as const,
}

/**
 * 积尸气 (Cumulative Corpses Vapor) = M44 / Beehive Cluster / NGC 2632。
 *
 * 步天歌:「四星册方似木柜，中央白者积尸气」—— 鬼宿四颗方星中央的白色气团。
 * 中国古代称其为"气"而非"星"，全星官模式下通过 angularSizeDeg 绘制虚线外圈提示。
 */
const asterism_Cumulative_Corpses: ChineseAsterism = {
  label: '积尸',
  english: 'Cumulative Corpses',
  type: 'sub',
  mansionIndex: 23,
  mansionLabel: '柳',
  enclosure: null,
  color: '#EC7063',
  quadrant: '南朱雀',
  stars: [
    { cnName: '积尸', hip: 42673, raJ2000: 130.4587, decJ2000: 19.8742, mag: 6.920 },
  ],
  connections: [] as const,
  angularSizeDeg: 1.6,
}

const asterism_Stored_water: ChineseAsterism = {
  label: '积水',
  english: 'Stored water',
  type: 'sub',
  mansionIndex: 17,
  mansionLabel: '昴',
  enclosure: null,
  color: '#829AE3',
  quadrant: '西白虎',
  stars: [
    { cnName: '积水一', hip: 19167, raJ2000: 61.6460, decJ2000: 50.3513, mag: 4.290 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Pile_of_Firewood: ChineseAsterism = {
  label: '积薪',
  english: 'Pile of Firewood',
  type: 'sub',
  mansionIndex: 21,
  mansionLabel: '井',
  enclosure: null,
  color: '#F5B7B1',
  quadrant: '南朱雀',
  stars: [
    { cnName: '积薪一', hip: 37740, raJ2000: 116.1118, decJ2000: 24.3980, mag: 3.570 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Group_of_Soldiers: ChineseAsterism = {
  label: '积卒',
  english: 'Group of Soldiers',
  type: 'sub',
  mansionIndex: 2,
  mansionLabel: '氐',
  enclosure: null,
  color: '#229954',
  quadrant: '东青龙',
  stars: [
    { cnName: '积卒一', hip: 78918, raJ2000: 241.6481, decJ2000: -36.8023, mag: 4.201 },
    { cnName: '积卒二', hip: 78384, raJ2000: 240.0305, decJ2000: -38.3967, mag: 3.410 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_White_Patches_Attached: ChineseAsterism = {
  label: '夹白',
  english: 'White Patches Attached',
  type: 'sub',
  mansionIndex: 18,
  mansionLabel: '毕',
  enclosure: null,
  color: '#566573',
  quadrant: '西白虎',
  stars: [
    { cnName: '夹白一', hip: 24372, raJ2000: 78.4394, decJ2000: -67.1853, mag: 4.801 },
    { cnName: '夹白二', hip: 19780, raJ2000: 63.6061, decJ2000: -62.4738, mag: 3.360 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Establishment: ChineseAsterism = {
  label: '建',
  english: 'Establishment',
  type: 'sub',
  mansionIndex: 7,
  mansionLabel: '斗',
  enclosure: null,
  color: '#5DADE2',
  quadrant: '北玄武',
  stars: [
    { cnName: '建一', hip: 93085, raJ2000: 284.4325, decJ2000: -21.1067, mag: 3.510 },
    { cnName: '建二', hip: 93683, raJ2000: 286.1708, decJ2000: -21.7415, mag: 3.770 },
    { cnName: '建三', hip: 94141, raJ2000: 287.4410, decJ2000: -21.0236, mag: 2.880 },
    { cnName: '建四', hip: 94820, raJ2000: 289.4087, decJ2000: -18.9529, mag: 4.878 },
    { cnName: '建五', hip: 95168, raJ2000: 290.4182, decJ2000: -17.8472, mag: 3.930 },
    { cnName: '建六', hip: 95176, raJ2000: 290.4318, decJ2000: -15.9550, mag: 4.610 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
  ] as const,
}

const asterism_Clepsydra_Terrace: ChineseAsterism = {
  label: '渐台',
  english: 'Clepsydra Terrace',
  type: 'sub',
  mansionIndex: 7,
  mansionLabel: '斗',
  enclosure: null,
  color: '#5DADE2',
  quadrant: '北玄武',
  stars: [
    { cnName: '渐台一', hip: 92791, raJ2000: 283.6262, decJ2000: 36.8986, mag: 4.300 },
    { cnName: '渐台二', hip: 92420, raJ2000: 282.5200, decJ2000: 33.3627, mag: 3.420 },
    { cnName: '渐台三', hip: 93194, raJ2000: 284.7359, decJ2000: 32.6896, mag: 3.250 },
    { cnName: '渐台四', hip: 93903, raJ2000: 286.8256, decJ2000: 36.1002, mag: 5.253 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Door_Bolt: ChineseAsterism = {
  label: '键闭',
  english: 'Door Bolt',
  type: 'sub',
  mansionIndex: 3,
  mansionLabel: '房',
  enclosure: null,
  color: '#1D8348',
  quadrant: '东青龙',
  stars: [
    { cnName: '键闭一', hip: 79374, raJ2000: 242.9989, decJ2000: -19.4607, mag: 4.000 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Goldfish: ChineseAsterism = {
  label: '金鱼',
  english: 'Goldfish',
  type: 'sub',
  mansionIndex: 18,
  mansionLabel: '毕',
  enclosure: null,
  color: '#566573',
  quadrant: '西白虎',
  stars: [
    { cnName: '金鱼一', hip: 19893, raJ2000: 64.0066, decJ2000: -51.4866, mag: 4.200 },
    { cnName: '金鱼二', hip: 21281, raJ2000: 68.4991, decJ2000: -55.0450, mag: 3.280 },
    { cnName: '金鱼三', hip: 26069, raJ2000: 83.4063, decJ2000: -62.4898, mag: 3.760 },
    { cnName: '金鱼四', hip: 27100, raJ2000: 86.1932, decJ2000: -65.7355, mag: 4.360 },
    { cnName: '金鱼五', hip: 29134, raJ2000: 92.1844, decJ2000: -68.8434, mag: 5.038 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
  ] as const,
}

const asterism_Recommending_Virtuous_Men: ChineseAsterism = {
  label: '进贤',
  english: 'Recommending Virtuous Men',
  type: 'sub',
  mansionIndex: 27,
  mansionLabel: '轸',
  enclosure: null,
  color: '#BA4A00',
  quadrant: '南朱雀',
  stars: [
    { cnName: '进贤一', hip: 63414, raJ2000: 194.9147, decJ2000: -3.8119, mag: 5.791 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Accumulated_Water: ChineseAsterism = {
  label: '积水',
  english: 'Accumulated Water',
  type: 'sub',
  mansionIndex: 21,
  mansionLabel: '井',
  enclosure: null,
  color: '#F5B7B1',
  quadrant: '南朱雀',
  stars: [
    { cnName: '积水一', hip: 35710, raJ2000: 110.5109, decJ2000: 36.7606, mag: 5.120 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Nine_Water_Wells: ChineseAsterism = {
  label: '九坎',
  english: 'Nine Water Wells',
  type: 'sub',
  mansionIndex: 9,
  mansionLabel: '女',
  enclosure: null,
  color: '#2874A6',
  quadrant: '北玄武',
  stars: [
    { cnName: '九坎一', hip: 104680, raJ2000: 318.0571, decJ2000: -40.2694, mag: 5.830 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Nine_Senior_Officers: ChineseAsterism = {
  label: '九卿',
  english: 'Nine Senior Officers',
  type: 'sub',
  mansionIndex: 27,
  mansionLabel: '轸',
  enclosure: null,
  color: '#BA4A00',
  quadrant: '南朱雀',
  stars: [
    { cnName: '九卿一', hip: 61960, raJ2000: 190.4711, decJ2000: 10.2356, mag: 4.880 },
    { cnName: '九卿二', hip: 62267, raJ2000: 191.4044, decJ2000: 7.6733, mag: 5.207 },
    { cnName: '九卿三', hip: 61579, raJ2000: 189.2817, decJ2000: 8.7969, mag: 6.598 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Imperial_Military_Flag: ChineseAsterism = {
  label: '九斿',
  english: 'Imperial Military Flag',
  type: 'sub',
  mansionIndex: 18,
  mansionLabel: '毕',
  enclosure: null,
  color: '#566573',
  quadrant: '西白虎',
  stars: [
    { cnName: '九斿一', hip: 21515, raJ2000: 69.3070, decJ2000: 0.9983, mag: 5.315 },
    { cnName: '九斿二', hip: 22109, raJ2000: 71.3756, decJ2000: -3.2547, mag: 4.000 },
    { cnName: '九斿三', hip: 22701, raJ2000: 73.2236, decJ2000: -5.4527, mag: 4.400 },
    { cnName: '九斿四', hip: 23221, raJ2000: 74.9602, decJ2000: -10.2633, mag: 5.390 },
    { cnName: '九斿五', hip: 23231, raJ2000: 74.9822, decJ2000: -12.5374, mag: 4.770 },
    { cnName: '九斿六', hip: 22479, raJ2000: 72.5484, decJ2000: -16.2172, mag: 5.028 },
    { cnName: '九斿七', hip: 22263, raJ2000: 71.9012, decJ2000: -16.9345, mag: 5.500 },
    { cnName: '九斿八', hip: 21763, raJ2000: 70.1105, decJ2000: -19.6715, mag: 4.300 },
    { cnName: '九斿九', hip: 23474, raJ2000: 75.6874, decJ2000: -22.7951, mag: 5.738 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
  ] as const,
}

const asterism_Interpreters_of_Nine_Dialects: ChineseAsterism = {
  label: '九州殊口',
  english: 'Interpreters of Nine Dialects',
  type: 'sub',
  mansionIndex: 18,
  mansionLabel: '毕',
  enclosure: null,
  color: '#566573',
  quadrant: '西白虎',
  stars: [
    { cnName: '九州殊口一', hip: 19777, raJ2000: 63.5987, decJ2000: -10.2563, mag: 4.900 },
    { cnName: '九州殊口二', hip: 19587, raJ2000: 62.9664, decJ2000: -6.8376, mag: 4.026 },
    { cnName: '九州殊口三', hip: 20507, raJ2000: 65.9202, decJ2000: -3.7455, mag: 5.165 },
    { cnName: '九州殊口四', hip: 21444, raJ2000: 69.0798, decJ2000: -3.3525, mag: 3.928 },
    { cnName: '九州殊口五', hip: 22024, raJ2000: 71.0222, decJ2000: -8.5036, mag: 5.810 },
    { cnName: '九州殊口六', hip: 21986, raJ2000: 70.8948, decJ2000: -8.7943, mag: null },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
  ] as const,
}

const asterism_Banner_of_Wine_Shop: ChineseAsterism = {
  label: '酒旗',
  english: 'Banner of Wine Shop',
  type: 'sub',
  mansionIndex: 24,
  mansionLabel: '星',
  enclosure: null,
  color: '#E74C3C',
  quadrant: '南朱雀',
  stars: [
    { cnName: '酒旗一', hip: 47723, raJ2000: 145.9329, decJ2000: 14.0217, mag: 5.350 },
    { cnName: '酒旗二', hip: 46771, raJ2000: 142.9864, decJ2000: 11.2998, mag: 4.963 },
    { cnName: '酒旗三', hip: 46454, raJ2000: 142.1142, decJ2000: 9.0568, mag: null },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Mortar: ChineseAsterism = {
  label: '臼',
  english: 'Mortar',
  type: 'sub',
  mansionIndex: 10,
  mansionLabel: '虚',
  enclosure: null,
  color: '#1B4F72',
  quadrant: '北玄武',
  stars: [
    { cnName: '臼一', hip: 110371, raJ2000: 335.3306, decJ2000: 28.3305, mag: 4.810 },
    { cnName: '臼二', hip: 109176, raJ2000: 331.7528, decJ2000: 25.3451, mag: 3.770 },
    { cnName: '臼三', hip: 107354, raJ2000: 326.1614, decJ2000: 25.6450, mag: 4.135 },
    { cnName: '臼四', hip: 107310, raJ2000: 326.0357, decJ2000: 28.7426, mag: null },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Rolled_Tongue: ChineseAsterism = {
  label: '卷舌',
  english: 'Rolled Tongue',
  type: 'sub',
  mansionIndex: 17,
  mansionLabel: '昴',
  enclosure: null,
  color: '#829AE3',
  quadrant: '西白虎',
  stars: [
    { cnName: '卷舌一', hip: 17529, raJ2000: 56.2985, decJ2000: 42.5785, mag: 3.800 },
    { cnName: '卷舌二', hip: 18532, raJ2000: 59.4635, decJ2000: 40.0102, mag: 2.890 },
    { cnName: '卷舌三', hip: 18614, raJ2000: 59.7413, decJ2000: 35.7910, mag: 4.060 },
    { cnName: '卷舌四', hip: 18246, raJ2000: 58.5330, decJ2000: 31.8836, mag: 2.850 },
    { cnName: '卷舌五', hip: 17448, raJ2000: 56.0797, decJ2000: 32.2882, mag: 3.910 },
    { cnName: '卷舌六', hip: 17313, raJ2000: 55.5944, decJ2000: 33.9650, mag: 4.972 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
  ] as const,
}

const asterism_Military_Well: ChineseAsterism = {
  label: '军井',
  english: 'Military Well',
  type: 'sub',
  mansionIndex: 18,
  mansionLabel: '毕',
  enclosure: null,
  color: '#566573',
  quadrant: '西白虎',
  stars: [
    { cnName: '军井一', hip: 24244, raJ2000: 78.0746, decJ2000: -11.8691, mag: 4.450 },
    { cnName: '军井二', hip: 24327, raJ2000: 78.3078, decJ2000: -12.9413, mag: 4.440 },
    { cnName: '军井三', hip: 24845, raJ2000: 79.8938, decJ2000: -13.1768, mag: 4.290 },
    { cnName: '军井四', hip: 24873, raJ2000: 79.9959, decJ2000: -12.3156, mag: 5.284 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Southern_Military_Gate: ChineseAsterism = {
  label: '军南门',
  english: 'Southern Military Gate',
  type: 'sub',
  mansionIndex: 14,
  mansionLabel: '奎',
  enclosure: null,
  color: '#D4AF37',
  quadrant: '西白虎',
  stars: [
    { cnName: '军南门一', hip: 5434, raJ2000: 17.3755, decJ2000: 47.2418, mag: 4.250 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Market_for_Soldiers: ChineseAsterism = {
  label: '军市',
  english: 'Market for Soldiers',
  type: 'sub',
  mansionIndex: 20,
  mansionLabel: '参',
  enclosure: null,
  color: '#1C2833',
  quadrant: '西白虎',
  stars: [
    { cnName: '军市一', hip: 30324, raJ2000: 95.6749, decJ2000: -17.9559, mag: 1.970 },
    { cnName: '军市二', hip: 31700, raJ2000: 99.4726, decJ2000: -18.2375, mag: 4.430 },
    { cnName: '军市三', hip: 33092, raJ2000: 103.3871, decJ2000: -20.2243, mag: 4.830 },
    { cnName: '军市四', hip: 33248, raJ2000: 103.7614, decJ2000: -20.4049, mag: 5.792 },
    { cnName: '军市五', hip: 33152, raJ2000: 103.5331, decJ2000: -24.1842, mag: 3.870 },
    { cnName: '军市六', hip: 31125, raJ2000: 97.9640, decJ2000: -23.4184, mag: 4.330 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 0],
  ] as const,
}

const asterism_Chaff: ChineseAsterism = {
  label: '糠',
  english: 'Chaff',
  type: 'sub',
  mansionIndex: 5,
  mansionLabel: '尾',
  enclosure: null,
  color: '#145A32',
  quadrant: '东青龙',
  stars: [
    { cnName: '糠一', hip: 85423, raJ2000: 261.8386, decJ2000: -29.8670, mag: 4.269 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Boats_and_Lake: ChineseAsterism = {
  label: '亢池',
  english: 'Boats and Lake',
  type: 'sub',
  mansionIndex: 1,
  mansionLabel: '亢',
  enclosure: null,
  color: '#27AE60',
  quadrant: '东青龙',
  stars: [
    { cnName: '亢池一', hip: 70027, raJ2000: 214.9385, decJ2000: 16.3069, mag: null },
    { cnName: '亢池二', hip: 69260, raJ2000: 212.6807, decJ2000: 15.2908, mag: 6.932 },
    { cnName: '亢池三', hip: 69536, raJ2000: 213.5216, decJ2000: 12.9594, mag: null },
    { cnName: '亢池四', hip: 69989, raJ2000: 214.8178, decJ2000: 13.0043, mag: 5.396 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Peafowl: ChineseAsterism = {
  label: '孔雀',
  english: 'Peafowl',
  type: 'sub',
  mansionIndex: 7,
  mansionLabel: '斗',
  enclosure: null,
  color: '#5DADE2',
  quadrant: '北玄武',
  stars: [
    { cnName: '孔雀一', hip: 86929, raJ2000: 266.4333, decJ2000: -64.7239, mag: 3.581 },
    { cnName: '孔雀二', hip: 88866, raJ2000: 272.1451, decJ2000: -63.6686, mag: 4.328 },
    { cnName: '孔雀三', hip: 90797, raJ2000: 277.8434, decJ2000: -62.2783, mag: 4.640 },
    { cnName: '孔雀四', hip: 92609, raJ2000: 283.0543, decJ2000: -62.1876, mag: 4.207 },
    { cnName: '孔雀五', hip: 93015, raJ2000: 284.2376, decJ2000: -67.2335, mag: 4.400 },
    { cnName: '孔雀六', hip: 99240, raJ2000: 302.1817, decJ2000: -66.1821, mag: 3.560 },
    { cnName: '孔雀七', hip: 102395, raJ2000: 311.2396, decJ2000: -66.2032, mag: 3.408 },
    { cnName: '孔雀八', hip: 91792, raJ2000: 280.7589, decJ2000: -71.4281, mag: 4.003 },
    { cnName: '孔雀九', hip: 98495, raJ2000: 300.1481, decJ2000: -72.9105, mag: 3.940 },
    { cnName: '孔雀十', hip: 105858, raJ2000: 321.6109, decJ2000: -65.3662, mag: 4.220 },
    { cnName: '孔雀十一', hip: 100751, raJ2000: 306.4119, decJ2000: -56.7351, mag: 1.918 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    [8, 9],
    [9, 10],
  ] as const,
}

const asterism_Crying: ChineseAsterism = {
  label: '哭',
  english: 'Crying',
  type: 'sub',
  mansionIndex: 10,
  mansionLabel: '虚',
  enclosure: null,
  color: '#1B4F72',
  quadrant: '北玄武',
  stars: [
    { cnName: '哭一', hip: 108036, raJ2000: 328.3240, decJ2000: -13.5518, mag: 5.080 },
    { cnName: '哭二', hip: 109472, raJ2000: 332.6562, decJ2000: -11.5649, mag: 5.422 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Arsenal: ChineseAsterism = {
  label: '库楼',
  english: 'Arsenal',
  type: 'sub',
  mansionIndex: 27,
  mansionLabel: '轸',
  enclosure: null,
  color: '#BA4A00',
  quadrant: '南朱雀',
  stars: [
    { cnName: '库楼一', hip: 68002, raJ2000: 208.8849, decJ2000: -47.2884, mag: 2.550 },
    { cnName: '库楼二', hip: 71352, raJ2000: 218.8768, decJ2000: -42.1578, mag: 2.310 },
    { cnName: '库楼三', hip: 68933, raJ2000: 211.6706, decJ2000: -36.3700, mag: 2.050 },
    { cnName: '库楼四', hip: 67457, raJ2000: 207.3613, decJ2000: -34.4508, mag: 4.190 },
    { cnName: '库楼五', hip: 65936, raJ2000: 202.7611, decJ2000: -39.4073, mag: 3.880 },
    { cnName: '库楼六', hip: 63945, raJ2000: 196.5696, decJ2000: -48.4633, mag: 4.691 },
    { cnName: '库楼七', hip: 61932, raJ2000: 190.3793, decJ2000: -48.9599, mag: 2.170 },
    { cnName: '库楼八', hip: 61622, raJ2000: 189.4257, decJ2000: -48.5413, mag: 3.860 },
    { cnName: '库楼九', hip: 60517, raJ2000: 186.0892, decJ2000: -47.3729, mag: 6.610 },
    { cnName: '库楼十', hip: 60823, raJ2000: 187.0099, decJ2000: -50.2306, mag: 3.910 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    [8, 9],
  ] as const,
}

const asterism_Captain_of_the_Bodyguards: ChineseAsterism = {
  label: '郎将',
  english: 'Captain of the Bodyguards',
  type: 'sub',
  mansionIndex: 27,
  mansionLabel: '轸',
  enclosure: null,
  color: '#BA4A00',
  quadrant: '南朱雀',
  stars: [
    { cnName: '郎将一', hip: 62763, raJ2000: 192.9247, decJ2000: 27.5407, mag: 4.940 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Officers_of_the_Imperial_Guard: ChineseAsterism = {
  label: '郎位',
  english: 'Officers of the Imperial Guard',
  type: 'sub',
  mansionIndex: 26,
  mansionLabel: '翼',
  enclosure: null,
  color: '#CA6F1E',
  quadrant: '南朱雀',
  stars: [
    { cnName: '郎位一', hip: 60742, raJ2000: 186.7345, decJ2000: 28.2684, mag: 4.340 },
    { cnName: '郎位二', hip: 60697, raJ2000: 186.6003, decJ2000: 27.2682, mag: 4.950 },
    { cnName: '郎位三', hip: 60746, raJ2000: 186.7471, decJ2000: 26.8257, mag: 4.959 },
    { cnName: '郎位四', hip: 60904, raJ2000: 187.2279, decJ2000: 25.9129, mag: 5.236 },
    { cnName: '郎位五', hip: 60514, raJ2000: 186.0773, decJ2000: 26.0986, mag: 5.180 },
    { cnName: '郎位六', hip: 60351, raJ2000: 185.6263, decJ2000: 25.8462, mag: 4.810 },
    { cnName: '郎位七', hip: 61071, raJ2000: 187.7523, decJ2000: 24.5672, mag: 5.436 },
    { cnName: '郎位八', hip: 60941, raJ2000: 187.3627, decJ2000: 24.1089, mag: 5.468 },
    { cnName: '郎位九', hip: 59847, raJ2000: 184.0856, decJ2000: 23.9454, mag: 4.860 },
    { cnName: '郎位十', hip: 61394, raJ2000: 188.7128, decJ2000: 22.6292, mag: 4.773 },
    { cnName: '郎位十一', hip: 61724, raJ2000: 189.7804, decJ2000: 21.0626, mag: 5.490 },
    { cnName: '郎位十二', hip: 60957, raJ2000: 187.4302, decJ2000: 20.8961, mag: 5.679 },
    { cnName: '郎位十三', hip: 59501, raJ2000: 183.0387, decJ2000: 20.5421, mag: 5.550 },
    { cnName: '郎位十四', hip: 58858, raJ2000: 181.0692, decJ2000: 21.4592, mag: null },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    [8, 9],
    [9, 10],
    [10, 11],
    [11, 12],
    [12, 13],
  ] as const,
}

const asterism_Old_Man: ChineseAsterism = {
  label: '老人',
  english: 'Old Man',
  type: 'sub',
  mansionIndex: 20,
  mansionLabel: '参',
  enclosure: null,
  color: '#1C2833',
  quadrant: '西白虎',
  stars: [
    { cnName: '老人一', hip: 30438, raJ2000: 95.9880, decJ2000: -52.6957, mag: -0.740 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Thunder_and_Lightning: ChineseAsterism = {
  label: '雷电',
  english: 'Thunder and Lightning',
  type: 'sub',
  mansionIndex: 11,
  mansionLabel: '危',
  enclosure: null,
  color: '#154360',
  quadrant: '北玄武',
  stars: [
    { cnName: '雷电一', hip: 115919, raJ2000: 352.2887, decJ2000: 12.7605, mag: 4.560 },
    { cnName: '雷电二', hip: 115444, raJ2000: 350.7690, decJ2000: 12.3139, mag: 5.081 },
    { cnName: '雷电三', hip: 114144, raJ2000: 346.7511, decJ2000: 9.4095, mag: 4.520 },
    { cnName: '雷电四', hip: 112935, raJ2000: 343.1003, decJ2000: 9.8357, mag: 5.160 },
    { cnName: '雷电五', hip: 112447, raJ2000: 341.6732, decJ2000: 12.1729, mag: 4.200 },
    { cnName: '雷电六', hip: 112029, raJ2000: 340.3655, decJ2000: 10.8314, mag: 3.410 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
  ] as const,
}

const asterism_Line_of_Ramparts: ChineseAsterism = {
  label: '垒壁阵',
  english: 'Line of Ramparts',
  type: 'sub',
  mansionIndex: 4,
  mansionLabel: '心',
  enclosure: null,
  color: '#196F3D',
  quadrant: '东青龙',
  stars: [
    { cnName: '垒壁阵一', hip: 145, raJ2000: 0.4560, decJ2000: -3.0275, mag: 5.100 },
    { cnName: '垒壁阵二', hip: 118209, raJ2000: 359.6682, decJ2000: -3.5560, mag: 4.886 },
    { cnName: '垒壁阵三', hip: 154, raJ2000: 0.4901, decJ2000: -6.0141, mag: 4.410 },
    { cnName: '垒壁阵四', hip: 443, raJ2000: 1.3339, decJ2000: -5.7076, mag: 4.610 },
    { cnName: '垒壁阵五', hip: 114724, raJ2000: 348.5807, decJ2000: -6.0490, mag: 4.220 },
    { cnName: '垒壁阵六', hip: 112961, raJ2000: 343.1536, decJ2000: -7.5796, mag: 3.790 },
    { cnName: '垒壁阵七', hip: 111123, raJ2000: 337.6618, decJ2000: -10.6779, mag: 4.810 },
    { cnName: '垒壁阵八', hip: 109139, raJ2000: 331.6093, decJ2000: -13.8697, mag: 4.270 },
    { cnName: '垒壁阵九', hip: 107556, raJ2000: 326.7602, decJ2000: -16.1273, mag: 2.830 },
    { cnName: '垒壁阵十', hip: 106985, raJ2000: 325.0227, decJ2000: -16.6624, mag: 3.670 },
    { cnName: '垒壁阵十一', hip: 106723, raJ2000: 324.2701, decJ2000: -19.4660, mag: 4.550 },
    { cnName: '垒壁阵十二', hip: 107188, raJ2000: 325.6646, decJ2000: -18.8663, mag: 4.726 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [1, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    [8, 9],
    [9, 10],
    [10, 11],
    [11, 8],
  ] as const,
}

const asterism_Resting_Palace_Vassal_of_Encampment: ChineseAsterism = {
  label: '离宫 (附室宿)',
  english: 'Resting Palace (Vassal of Encampment)',
  type: 'sub',
  mansionIndex: 11,
  mansionLabel: '危',
  enclosure: null,
  color: '#154360',
  quadrant: '北玄武',
  stars: [
    { cnName: '离宫 (附室宿)一', hip: 112440, raJ2000: 341.6328, decJ2000: 23.5657, mag: 3.930 },
    { cnName: '离宫 (附室宿)二', hip: 112748, raJ2000: 342.5008, decJ2000: 24.6016, mag: 3.480 },
    { cnName: '离宫 (附室宿)三', hip: 112051, raJ2000: 340.4392, decJ2000: 29.3077, mag: 4.790 },
    { cnName: '离宫 (附室宿)四', hip: 112158, raJ2000: 340.7505, decJ2000: 30.2212, mag: 2.950 },
    { cnName: '离宫 (附室宿)五', hip: 115250, raJ2000: 350.1594, decJ2000: 23.7404, mag: 4.580 },
    { cnName: '离宫 (附室宿)六', hip: 115623, raJ2000: 351.3449, decJ2000: 23.4041, mag: 4.400 },
    { cnName: '离宫 (附室宿)七', hip: 113881, raJ2000: 345.9436, decJ2000: 28.0828, mag: 2.420 },
  ],
  connections: [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 1],
    [6, 3],
    [6, 4],
  ] as const,
}

const asterism_Jade_Ornament_on_Ladies_Wear: ChineseAsterism = {
  label: '离瑜',
  english: 'Jade Ornament on Ladies\' Wear',
  type: 'sub',
  mansionIndex: 9,
  mansionLabel: '女',
  enclosure: null,
  color: '#2874A6',
  quadrant: '北玄武',
  stars: [
    { cnName: '离瑜一', hip: 105140, raJ2000: 319.4845, decJ2000: -32.1725, mag: 4.708 },
    { cnName: '离瑜二', hip: 106067, raJ2000: 322.2656, decJ2000: -31.2386, mag: 6.500 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Pearls_on_Ladies_Wear: ChineseAsterism = {
  label: '离珠',
  english: 'Pearls on Ladies\' Wear',
  type: 'sub',
  mansionIndex: 8,
  mansionLabel: '牛',
  enclosure: null,
  color: '#3498DB',
  quadrant: '北玄武',
  stars: [
    { cnName: '离珠一', hip: 101936, raJ2000: 309.8537, decJ2000: 0.4864, mag: 5.153 },
    { cnName: '离珠二', hip: 101847, raJ2000: 309.5845, decJ2000: -1.1051, mag: 4.330 },
    { cnName: '离珠三', hip: 101692, raJ2000: 309.1818, decJ2000: -2.5500, mag: 4.880 },
    { cnName: '离珠四', hip: 101101, raJ2000: 307.4125, decJ2000: -2.8855, mag: 4.900 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Whetstone: ChineseAsterism = {
  label: '砺石',
  english: 'Whetstone',
  type: 'sub',
  mansionIndex: 17,
  mansionLabel: '昴',
  enclosure: null,
  color: '#829AE3',
  quadrant: '西白虎',
  stars: [
    { cnName: '砺石一', hip: 19205, raJ2000: 61.7519, decJ2000: 29.0013, mag: 5.200 },
    { cnName: '砺石二', hip: 19513, raJ2000: 62.7078, decJ2000: 26.4810, mag: 5.387 },
    { cnName: '砺石三', hip: 20430, raJ2000: 65.6456, decJ2000: 25.6293, mag: 5.378 },
    { cnName: '砺石四', hip: 20250, raJ2000: 65.0884, decJ2000: 27.3508, mag: 4.951 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Jewel_Market: ChineseAsterism = {
  label: '列肆',
  english: 'Jewel Market',
  type: 'sub',
  mansionIndex: 4,
  mansionLabel: '心',
  enclosure: null,
  color: '#196F3D',
  quadrant: '东青龙',
  stars: [
    { cnName: '列肆一', hip: 80179, raJ2000: 245.5181, decJ2000: 1.0290, mag: 4.820 },
    { cnName: '列肆二', hip: 80883, raJ2000: 247.7284, decJ2000: 1.9839, mag: null },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Astronomical_Observatory: ChineseAsterism = {
  label: '灵台',
  english: 'Astronomical Observatory',
  type: 'sub',
  mansionIndex: 26,
  mansionLabel: '翼',
  enclosure: null,
  color: '#CA6F1E',
  quadrant: '南朱雀',
  stars: [
    { cnName: '灵台一', hip: 54182, raJ2000: 166.2543, decJ2000: 7.3360, mag: 4.620 },
    { cnName: '灵台二', hip: 53824, raJ2000: 165.1867, decJ2000: 6.1014, mag: 4.977 },
    { cnName: '灵台三', hip: 53807, raJ2000: 165.1402, decJ2000: 3.6175, mag: 4.838 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Six_Jia: ChineseAsterism = {
  label: '六甲',
  english: 'Six Jia',
  type: 'sub',
  mansionIndex: 20,
  mansionLabel: '参',
  enclosure: null,
  color: '#1C2833',
  quadrant: '西白虎',
  stars: [
    { cnName: '六甲一', hip: 32439, raJ2000: 101.5590, decJ2000: 79.5648, mag: null },
    { cnName: '六甲二', hip: 33694, raJ2000: 105.0168, decJ2000: 76.9774, mag: 4.540 },
    { cnName: '六甲三', hip: 39538, raJ2000: 121.1961, decJ2000: 79.4796, mag: 5.387 },
    { cnName: '六甲四', hip: 36547, raJ2000: 112.7686, decJ2000: 82.4115, mag: 4.960 },
    { cnName: '六甲五', hip: 23265, raJ2000: 75.0863, decJ2000: 81.1941, mag: 5.090 },
    { cnName: '六甲六', hip: 25110, raJ2000: 80.6397, decJ2000: 79.2312, mag: null },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
  ] as const,
}

const asterism_Network_of_Dykes: ChineseAsterism = {
  label: '罗堰',
  english: 'Network of Dykes',
  type: 'sub',
  mansionIndex: 8,
  mansionLabel: '牛',
  enclosure: null,
  color: '#3498DB',
  quadrant: '北玄武',
  stars: [
    { cnName: '罗堰一', hip: 101923, raJ2000: 309.8180, decJ2000: -14.9548, mag: null },
    { cnName: '罗堰二', hip: 101984, raJ2000: 310.0123, decJ2000: -18.1387, mag: 5.100 },
    { cnName: '罗堰三', hip: 102487, raJ2000: 311.5416, decJ2000: -21.5140, mag: 5.902 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Horse_s_Abdomen: ChineseAsterism = {
  label: '马腹',
  english: 'Horse\'s Abdomen',
  type: 'sub',
  mansionIndex: 0,
  mansionLabel: '角',
  enclosure: null,
  color: '#2ECC71',
  quadrant: '东青龙',
  stars: [
    { cnName: '马腹一', hip: 68702, raJ2000: 210.9559, decJ2000: -60.3730, mag: 0.580 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Horse_s_Tail: ChineseAsterism = {
  label: '马尾',
  english: 'Horse\'s Tail',
  type: 'sub',
  mansionIndex: 26,
  mansionLabel: '翼',
  enclosure: null,
  color: '#CA6F1E',
  quadrant: '南朱雀',
  stars: [
    { cnName: '马尾一', hip: 60710, raJ2000: 186.6323, decJ2000: -51.4506, mag: 4.808 },
    { cnName: '马尾二', hip: 59449, raJ2000: 182.9130, decJ2000: -52.3684, mag: 3.960 },
    { cnName: '马尾三', hip: 59196, raJ2000: 182.0896, decJ2000: -50.7224, mag: 2.520 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Bee: ChineseAsterism = {
  label: '蜜蜂',
  english: 'Bee',
  type: 'sub',
  mansionIndex: 27,
  mansionLabel: '轸',
  enclosure: null,
  color: '#BA4A00',
  quadrant: '南朱雀',
  stars: [
    { cnName: '蜜蜂一', hip: 62322, raJ2000: 191.5700, decJ2000: -68.1081, mag: null },
    { cnName: '蜜蜂二', hip: 61585, raJ2000: 189.2959, decJ2000: -69.1356, mag: 2.649 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_The_Hall_of_Glory: ChineseAsterism = {
  label: '明堂',
  english: 'The Hall of Glory',
  type: 'sub',
  mansionIndex: 26,
  mansionLabel: '翼',
  enclosure: null,
  color: '#CA6F1E',
  quadrant: '南朱雀',
  stars: [
    { cnName: '明堂一', hip: 55945, raJ2000: 171.9843, decJ2000: 2.8563, mag: 4.943 },
    { cnName: '明堂二', hip: 56647, raJ2000: 174.2372, decJ2000: -0.8237, mag: 4.300 },
    { cnName: '明堂三', hip: 56127, raJ2000: 172.5787, decJ2000: -3.0035, mag: 4.770 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Southern_Boat: ChineseAsterism = {
  label: '南船',
  english: 'Southern Boat',
  type: 'sub',
  mansionIndex: 25,
  mansionLabel: '张',
  enclosure: null,
  color: '#DC7633',
  quadrant: '南朱雀',
  stars: [
    { cnName: '南船一', hip: 50371, raJ2000: 154.2707, decJ2000: -61.3323, mag: 3.350 },
    { cnName: '南船二', hip: 51576, raJ2000: 158.0061, decJ2000: -61.6853, mag: 3.270 },
    { cnName: '南船三', hip: 52419, raJ2000: 160.7392, decJ2000: -64.3945, mag: 2.760 },
    { cnName: '南船四', hip: 50099, raJ2000: 153.4343, decJ2000: -70.0379, mag: 3.330 },
    { cnName: '南船五', hip: 45238, raJ2000: 138.2999, decJ2000: -69.7172, mag: 1.690 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
  ] as const,
}

const asterism_South_River: ChineseAsterism = {
  label: '南河',
  english: 'South River',
  type: 'sub',
  mansionIndex: 21,
  mansionLabel: '井',
  enclosure: null,
  color: '#F5B7B1',
  quadrant: '南朱雀',
  stars: [
    { cnName: '南河一', hip: 36041, raJ2000: 111.4121, decJ2000: 9.2761, mag: 4.986 },
    { cnName: '南河二', hip: 36188, raJ2000: 111.7877, decJ2000: 8.2893, mag: 2.890 },
    { cnName: '南河三', hip: 37279, raJ2000: 114.8255, decJ2000: 5.2250, mag: 0.370 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Dongou: ChineseAsterism = {
  label: '东瓯',
  english: 'Dongou',
  type: 'sub',
  mansionIndex: 12,
  mansionLabel: '室',
  enclosure: null,
  color: '#0B5345',
  quadrant: '北玄武',
  stars: [
  ],
  connections: [
  ] as const,
}

const asterism_Southern_Gate: ChineseAsterism = {
  label: '南门',
  english: 'Southern Gate',
  type: 'sub',
  mansionIndex: 0,
  mansionLabel: '角',
  enclosure: null,
  color: '#2ECC71',
  quadrant: '东青龙',
  stars: [
    { cnName: '南门一', hip: 66657, raJ2000: 204.9719, decJ2000: -53.4664, mag: 2.300 },
    { cnName: '南门二', hip: 71683, raJ2000: 219.9021, decJ2000: -60.8340, mag: 0.010 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Inner_Kitchen: ChineseAsterism = {
  label: '内厨',
  english: 'Inner Kitchen',
  type: 'sub',
  mansionIndex: 27,
  mansionLabel: '轸',
  enclosure: null,
  color: '#BA4A00',
  quadrant: '南朱雀',
  stars: [
    { cnName: '内厨一', hip: 62423, raJ2000: 191.8931, decJ2000: 66.7903, mag: 5.423 },
    { cnName: '内厨二', hip: 63076, raJ2000: 193.8690, decJ2000: 65.4385, mag: 5.225 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Inner_Steps: ChineseAsterism = {
  label: '内阶',
  english: 'Inner Steps',
  type: 'sub',
  mansionIndex: 23,
  mansionLabel: '柳',
  enclosure: null,
  color: '#EC7063',
  quadrant: '南朱雀',
  stars: [
    { cnName: '内阶一', hip: 41704, raJ2000: 127.5661, decJ2000: 60.7182, mag: 3.420 },
    { cnName: '内阶二', hip: 45333, raJ2000: 138.5856, decJ2000: 61.4233, mag: 5.180 },
    { cnName: '内阶三', hip: 43903, raJ2000: 134.1560, decJ2000: 64.6038, mag: 5.560 },
    { cnName: '内阶四', hip: 46733, raJ2000: 142.8821, decJ2000: 63.0619, mag: 3.670 },
    { cnName: '内阶五', hip: 43644, raJ2000: 133.3440, decJ2000: 61.9623, mag: 5.740 },
    { cnName: '内阶六', hip: 45455, raJ2000: 138.9574, decJ2000: 56.7414, mag: 5.266 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [3, 4],
    [4, 5],
  ] as const,
}

const asterism_High_Judge: ChineseAsterism = {
  label: '内平',
  english: 'High Judge',
  type: 'sub',
  mansionIndex: 25,
  mansionLabel: '张',
  enclosure: null,
  color: '#DC7633',
  quadrant: '南朱雀',
  stars: [
    { cnName: '内平一', hip: 50218, raJ2000: 153.7764, decJ2000: 31.4681, mag: 6.460 },
    { cnName: '内平二', hip: 49593, raJ2000: 151.8573, decJ2000: 35.2447, mag: 4.490 },
    { cnName: '内平三', hip: 47631, raJ2000: 145.6781, decJ2000: 35.0934, mag: 6.140 },
    { cnName: '内平四', hip: 48742, raJ2000: 149.1306, decJ2000: 32.3846, mag: 6.550 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Inner_Screen: ChineseAsterism = {
  label: '内屏',
  english: 'Inner Screen',
  type: 'sub',
  mansionIndex: 26,
  mansionLabel: '翼',
  enclosure: null,
  color: '#CA6F1E',
  quadrant: '南朱雀',
  stars: [
    { cnName: '内屏一', hip: 57328, raJ2000: 176.3210, decJ2000: 8.2581, mag: 4.842 },
    { cnName: '内屏二', hip: 57380, raJ2000: 176.4648, decJ2000: 6.5294, mag: 4.040 },
    { cnName: '内屏三', hip: 58590, raJ2000: 180.2183, decJ2000: 6.6143, mag: 4.642 },
    { cnName: '内屏四', hip: 58948, raJ2000: 181.3022, decJ2000: 8.7330, mag: 4.120 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Imperial_Passageway: ChineseAsterism = {
  label: '辇道',
  english: 'Imperial Passageway',
  type: 'sub',
  mansionIndex: 7,
  mansionLabel: '斗',
  enclosure: null,
  color: '#5DADE2',
  quadrant: '北玄武',
  stars: [
    { cnName: '辇道一', hip: 92862, raJ2000: 283.8338, decJ2000: 43.9461, mag: 4.000 },
    { cnName: '辇道二', hip: 94481, raJ2000: 288.4395, decJ2000: 39.1460, mag: 4.398 },
    { cnName: '辇道三', hip: 94713, raJ2000: 289.0921, decJ2000: 38.1337, mag: 4.380 },
    { cnName: '辇道四', hip: 95556, raJ2000: 291.5380, decJ2000: 36.3179, mag: 5.150 },
    { cnName: '辇道五', hip: 97295, raJ2000: 296.6067, decJ2000: 33.7276, mag: null },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
  ] as const,
}

const asterism_Bird_s_Beak: ChineseAsterism = {
  label: '鸟喙',
  english: 'Bird\'s Beak',
  type: 'sub',
  mansionIndex: 0,
  mansionLabel: '角',
  enclosure: null,
  color: '#2ECC71',
  quadrant: '东青龙',
  stars: [
    { cnName: '鸟喙一', hip: 110130, raJ2000: 334.6255, decJ2000: -60.2596, mag: 2.820 },
    { cnName: '鸟喙二', hip: 110838, raJ2000: 336.8332, decJ2000: -64.9664, mag: 4.490 },
    { cnName: '鸟喙三', hip: 118092, raJ2000: 359.3330, decJ2000: -62.9566, mag: 5.943 },
    { cnName: '鸟喙四', hip: 2484, raJ2000: 7.8861, decJ2000: -62.9582, mag: 4.289 },
    { cnName: '鸟喙五', hip: 3330, raJ2000: 10.6182, decJ2000: -65.4680, mag: 5.381 },
    { cnName: '鸟喙六', hip: 1599, raJ2000: 5.0177, decJ2000: -64.8748, mag: 4.230 },
    { cnName: '鸟喙七', hip: 118322, raJ2000: 359.9791, decJ2000: -65.5771, mag: 4.470 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
  ] as const,
}

const asterism_Peasant: ChineseAsterism = {
  label: '农丈人',
  english: 'Peasant',
  type: 'sub',
  mansionIndex: 7,
  mansionLabel: '斗',
  enclosure: null,
  color: '#5DADE2',
  quadrant: '北玄武',
  stars: [
    { cnName: '农丈人一', hip: 91918, raJ2000: 281.0807, decJ2000: -35.6420, mag: 4.870 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Woman_s_Bed: ChineseAsterism = {
  label: '女床',
  english: 'Woman\'s Bed',
  type: 'sub',
  mansionIndex: 5,
  mansionLabel: '尾',
  enclosure: null,
  color: '#145A32',
  quadrant: '东青龙',
  stars: [
    { cnName: '女床一', hip: 84380, raJ2000: 258.7618, decJ2000: 36.8092, mag: 3.180 },
    { cnName: '女床二', hip: 84606, raJ2000: 259.4177, decJ2000: 37.2915, mag: 4.650 },
    { cnName: '女床三', hip: 85112, raJ2000: 260.9206, decJ2000: 37.1459, mag: 4.170 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Female_Protocol: ChineseAsterism = {
  label: '女史',
  english: 'Female Protocol',
  type: 'sub',
  mansionIndex: 5,
  mansionLabel: '尾',
  enclosure: null,
  color: '#145A32',
  quadrant: '东青龙',
  stars: [
    { cnName: '女史一', hip: 87728, raJ2000: 268.7965, decJ2000: 72.0051, mag: 5.430 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Thunderbolt: ChineseAsterism = {
  label: '霹雳',
  english: 'Thunderbolt',
  type: 'sub',
  mansionIndex: 12,
  mansionLabel: '室',
  enclosure: null,
  color: '#0B5345',
  quadrant: '北玄武',
  stars: [
    { cnName: '霹雳一', hip: 113889, raJ2000: 345.9692, decJ2000: 3.8200, mag: 4.520 },
    { cnName: '霹雳二', hip: 114971, raJ2000: 349.2914, decJ2000: 3.2823, mag: 3.700 },
    { cnName: '霹雳三', hip: 115830, raJ2000: 351.9921, decJ2000: 6.3790, mag: 4.300 },
    { cnName: '霹雳四', hip: 116771, raJ2000: 354.9877, decJ2000: 5.6263, mag: 4.120 },
    { cnName: '霹雳五', hip: 118268, raJ2000: 359.8279, decJ2000: 6.8633, mag: null },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
  ] as const,
}

const asterism_Judging: ChineseAsterism = {
  label: 'unknown',
  english: 'Judging',
  type: 'sub',
  mansionIndex: 0,
  mansionLabel: '角',
  enclosure: null,
  color: '#2ECC71',
  quadrant: '东青龙',
  stars: [
    { cnName: 'unknown一', hip: 64962, raJ2000: 199.7304, decJ2000: -23.1715, mag: 3.000 },
    { cnName: 'unknown二', hip: 68895, raJ2000: 211.5929, decJ2000: -26.6824, mag: 3.280 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Flat_Road: ChineseAsterism = {
  label: '平道',
  english: 'Flat Road',
  type: 'sub',
  mansionIndex: 0,
  mansionLabel: '角',
  enclosure: null,
  color: '#2ECC71',
  quadrant: '东青龙',
  stars: [
    { cnName: '平道一', hip: 64238, raJ2000: 197.4875, decJ2000: -5.5390, mag: 4.397 },
    { cnName: '平道二', hip: 66803, raJ2000: 205.4032, decJ2000: -8.7030, mag: 5.010 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Screen: ChineseAsterism = {
  label: '屏',
  english: 'Screen',
  type: 'sub',
  mansionIndex: 18,
  mansionLabel: '毕',
  enclosure: null,
  color: '#566573',
  quadrant: '西白虎',
  stars: [
    { cnName: '屏一', hip: 24305, raJ2000: 78.2329, decJ2000: -16.2055, mag: 3.290 },
    { cnName: '屏二', hip: 23685, raJ2000: 76.3653, decJ2000: -22.3710, mag: 3.180 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Seven_Excellencies: ChineseAsterism = {
  label: '七公',
  english: 'Seven Excellencies',
  type: 'sub',
  mansionIndex: 2,
  mansionLabel: '氐',
  enclosure: null,
  color: '#229954',
  quadrant: '东青龙',
  stars: [
    { cnName: '七公一', hip: 81497, raJ2000: 249.6869, decJ2000: 48.9283, mag: 4.900 },
    { cnName: '七公二', hip: 79992, raJ2000: 244.9352, decJ2000: 46.3134, mag: 3.870 },
    { cnName: '七公三', hip: 79101, raJ2000: 242.1924, decJ2000: 44.9349, mag: 4.270 },
    { cnName: '七公四', hip: 77760, raJ2000: 238.1689, decJ2000: 42.4515, mag: 4.620 },
    { cnName: '七公五', hip: 75973, raJ2000: 232.7323, decJ2000: 40.8330, mag: 5.026 },
    { cnName: '七公六', hip: 75411, raJ2000: 231.1226, decJ2000: 37.3772, mag: null },
    { cnName: '七公七', hip: 74666, raJ2000: 228.8757, decJ2000: 33.3148, mag: 3.490 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
  ] as const,
}

const asterism_House_for_Musical_Instruments: ChineseAsterism = {
  label: '器府',
  english: 'House for Musical Instruments',
  type: 'sub',
  mansionIndex: 12,
  mansionLabel: '室',
  enclosure: null,
  color: '#0B5345',
  quadrant: '北玄武',
  stars: [
  ],
  connections: [
  ] as const,
}

const asterism_Imperial_Guards: ChineseAsterism = {
  label: '骑官',
  english: 'Imperial Guards',
  type: 'sub',
  mansionIndex: 2,
  mansionLabel: '氐',
  enclosure: null,
  color: '#229954',
  quadrant: '东青龙',
  stars: [
    { cnName: '骑官一', hip: 76297, raJ2000: 233.7852, decJ2000: -41.1668, mag: 2.765 },
    { cnName: '骑官二', hip: 75141, raJ2000: 230.3430, decJ2000: -40.6475, mag: 3.190 },
    { cnName: '骑官三', hip: 73334, raJ2000: 224.7904, decJ2000: -42.1042, mag: 3.110 },
    { cnName: '骑官四', hip: 73273, raJ2000: 224.6330, decJ2000: -43.1340, mag: 2.680 },
    { cnName: '骑官五', hip: 74117, raJ2000: 227.2109, decJ2000: -45.2799, mag: 4.050 },
    { cnName: '骑官六', hip: 75264, raJ2000: 230.6703, decJ2000: -44.6896, mag: 3.366 },
    { cnName: '骑官七', hip: 74911, raJ2000: 229.6334, decJ2000: -47.8753, mag: null },
    { cnName: '骑官八', hip: 73807, raJ2000: 226.2801, decJ2000: -47.0511, mag: 3.890 },
    { cnName: '骑官九', hip: 72683, raJ2000: 222.9096, decJ2000: -43.5754, mag: 4.313 },
    { cnName: '骑官十', hip: 71860, raJ2000: 220.4823, decJ2000: -47.3882, mag: 2.286 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    [8, 9],
  ] as const,
}

const asterism_Chariots_and_Cavalry_General: ChineseAsterism = {
  label: '骑阵将军',
  english: 'Chariots and Cavalry General',
  type: 'sub',
  mansionIndex: 2,
  mansionLabel: '氐',
  enclosure: null,
  color: '#229954',
  quadrant: '东青龙',
  stars: [
    { cnName: '骑阵将军一', hip: 74376, raJ2000: 227.9836, decJ2000: -48.7378, mag: 3.700 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Weeping: ChineseAsterism = {
  label: '泣',
  english: 'Weeping',
  type: 'sub',
  mansionIndex: 11,
  mansionLabel: '危',
  enclosure: null,
  color: '#154360',
  quadrant: '北玄武',
  stars: [
    { cnName: '泣一', hip: 110273, raJ2000: 335.0497, decJ2000: -7.8211, mag: 5.339 },
    { cnName: '泣二', hip: 110003, raJ2000: 334.2085, decJ2000: -7.7833, mag: 4.160 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Celestial_Cereals: ChineseAsterism = {
  label: '天稷',
  english: 'Celestial Cereals',
  type: 'sub',
  mansionIndex: 12,
  mansionLabel: '室',
  enclosure: null,
  color: '#0B5345',
  quadrant: '北玄武',
  stars: [
  ],
  connections: [
  ] as const,
}

const asterism_Green_Hill: ChineseAsterism = {
  label: '青丘',
  english: 'Green Hill',
  type: 'sub',
  mansionIndex: 26,
  mansionLabel: '翼',
  enclosure: null,
  color: '#CA6F1E',
  quadrant: '南朱雀',
  stars: [
    { cnName: '青丘一', hip: 57936, raJ2000: 178.2272, decJ2000: -33.9081, mag: 4.280 },
    { cnName: '青丘二', hip: 58158, raJ2000: 178.9172, decJ2000: -28.4771, mag: 5.893 },
    { cnName: '青丘三', hip: 56280, raJ2000: 173.0684, decJ2000: -29.2610, mag: null },
    { cnName: '青丘四', hip: 56332, raJ2000: 173.2255, decJ2000: -31.0872, mag: 5.110 },
    { cnName: '青丘五', hip: 56343, raJ2000: 173.2505, decJ2000: -31.8576, mag: 3.540 },
    { cnName: '青丘六', hip: 56452, raJ2000: 173.6229, decJ2000: -32.8313, mag: 5.980 },
    { cnName: '青丘七', hip: 56922, raJ2000: 175.0533, decJ2000: -34.7447, mag: 4.700 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
  ] as const,
}

const asterism_Palace_Gate: ChineseAsterism = {
  label: '阙丘',
  english: 'Palace Gate',
  type: 'sub',
  mansionIndex: 20,
  mansionLabel: '参',
  enclosure: null,
  color: '#1C2833',
  quadrant: '西白虎',
  stars: [
    { cnName: '阙丘一', hip: 34724, raJ2000: 107.8484, decJ2000: -0.3019, mag: 5.428 },
    { cnName: '阙丘二', hip: 32578, raJ2000: 101.9652, decJ2000: 2.4122, mag: 4.470 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Humans: ChineseAsterism = {
  label: '人',
  english: 'Humans',
  type: 'sub',
  mansionIndex: 10,
  mansionLabel: '虚',
  enclosure: null,
  color: '#1B4F72',
  quadrant: '北玄武',
  stars: [
    { cnName: '人一', hip: 106140, raJ2000: 322.4871, decJ2000: 23.6388, mag: 4.509 },
    { cnName: '人二', hip: 105502, raJ2000: 320.5217, decJ2000: 19.8045, mag: 4.090 },
    { cnName: '人三', hip: 107348, raJ2000: 326.1279, decJ2000: 17.3500, mag: 4.350 },
    { cnName: '人四', hip: 107472, raJ2000: 326.5182, decJ2000: 22.9489, mag: 5.266 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Solar_Star: ChineseAsterism = {
  label: '日',
  english: 'Solar Star',
  type: 'sub',
  mansionIndex: 2,
  mansionLabel: '氐',
  enclosure: null,
  color: '#229954',
  quadrant: '东青龙',
  stars: [
    { cnName: '日一', hip: 76880, raJ2000: 235.4866, decJ2000: -19.6788, mag: 4.720 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Three_Excellencies_In_Supreme_Palace_Enclosure: ChineseAsterism = {
  label: '三公 (太微垣)',
  english: 'Three Excellencies (In Supreme Palace Enclosure)',
  type: 'sub',
  mansionIndex: 27,
  mansionLabel: '轸',
  enclosure: null,
  color: '#BA4A00',
  quadrant: '南朱雀',
  stars: [
    { cnName: '三公 (太微垣)一', hip: 61968, raJ2000: 190.4880, decJ2000: 6.8066, mag: 5.573 },
    { cnName: '三公 (太微垣)二', hip: 62443, raJ2000: 191.9642, decJ2000: 3.5727, mag: 6.410 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Three_Excellencies_In_Purple_Forbidden_Enclosure: ChineseAsterism = {
  label: '三公 (紫微垣)',
  english: 'Three Excellencies (In Purple Forbidden Enclosure)',
  type: 'sub',
  mansionIndex: 0,
  mansionLabel: '角',
  enclosure: null,
  color: '#2ECC71',
  quadrant: '东青龙',
  stars: [
    { cnName: '三公 (紫微垣)一', hip: 66234, raJ2000: 203.6136, decJ2000: 49.0160, mag: 4.700 },
    { cnName: '三公 (紫微垣)二', hip: 64906, raJ2000: 199.5605, decJ2000: 49.6821, mag: 5.150 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Triangle: ChineseAsterism = {
  label: '三角形',
  english: 'Triangle',
  type: 'sub',
  mansionIndex: 2,
  mansionLabel: '氐',
  enclosure: null,
  color: '#229954',
  quadrant: '东青龙',
  stars: [
    { cnName: '三角形一', hip: 74946, raJ2000: 229.7274, decJ2000: -68.6795, mag: 2.890 },
    { cnName: '三角形二', hip: 77952, raJ2000: 238.7857, decJ2000: -63.4307, mag: 2.850 },
    { cnName: '三角形三', hip: 82273, raJ2000: 252.1662, decJ2000: -69.0277, mag: 1.880 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 0],
  ] as const,
}

const asterism_Three_Top_Instructors: ChineseAsterism = {
  label: '三师',
  english: 'Three Top Instructors',
  type: 'sub',
  mansionIndex: 23,
  mansionLabel: '柳',
  enclosure: null,
  color: '#EC7063',
  quadrant: '南朱雀',
  stars: [
    { cnName: '三师一', hip: 44390, raJ2000: 135.6362, decJ2000: 67.6296, mag: 4.760 },
    { cnName: '三师二', hip: 44857, raJ2000: 137.0979, decJ2000: 66.8732, mag: 5.136 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Three_Steps: ChineseAsterism = {
  label: '三台',
  english: 'Three Steps',
  type: 'sub',
  mansionIndex: 25,
  mansionLabel: '张',
  enclosure: null,
  color: '#DC7633',
  quadrant: '南朱雀',
  stars: [
    { cnName: '三台一', hip: 44127, raJ2000: 134.8019, decJ2000: 48.0418, mag: 3.140 },
    { cnName: '三台二', hip: 44471, raJ2000: 135.9064, decJ2000: 47.1565, mag: 3.550 },
    { cnName: '三台三', hip: 50372, raJ2000: 154.2741, decJ2000: 42.9144, mag: 3.450 },
    { cnName: '三台四', hip: 50801, raJ2000: 155.5822, decJ2000: 41.4995, mag: 3.050 },
    { cnName: '三台五', hip: 55219, raJ2000: 169.6197, decJ2000: 33.0943, mag: 3.490 },
    { cnName: '三台六', hip: 55203, raJ2000: 169.5455, decJ2000: 31.5293, mag: 3.790 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
  ] as const,
}

const asterism_Royal_Secretary: ChineseAsterism = {
  label: '尚书',
  english: 'Royal Secretary',
  type: 'sub',
  mansionIndex: 5,
  mansionLabel: '尾',
  enclosure: null,
  color: '#145A32',
  quadrant: '东青龙',
  stars: [
    { cnName: '尚书一', hip: 85805, raJ2000: 262.9911, decJ2000: 68.1350, mag: 5.074 },
    { cnName: '尚书二', hip: 80650, raJ2000: 246.9959, decJ2000: 68.7681, mag: 4.949 },
    { cnName: '尚书三', hip: 81660, raJ2000: 250.2297, decJ2000: 64.5890, mag: 4.842 },
    { cnName: '尚书四', hip: 80161, raJ2000: 245.4530, decJ2000: 69.1094, mag: 5.264 },
    { cnName: '尚书五', hip: 82860, raJ2000: 254.0070, decJ2000: 65.1348, mag: 4.880 },
  ],
  connections: [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
  ] as const,
}

const asterism_Junior_Officers: ChineseAsterism = {
  label: '少微',
  english: 'Junior Officers',
  type: 'sub',
  mansionIndex: 25,
  mansionLabel: '张',
  enclosure: null,
  color: '#DC7633',
  quadrant: '南朱雀',
  stars: [
    { cnName: '少微一', hip: 54347, raJ2000: 166.7703, decJ2000: 25.5371, mag: 6.844 },
    { cnName: '少微二', hip: 53417, raJ2000: 163.9033, decJ2000: 24.7497, mag: 4.320 },
    { cnName: '少微三', hip: 52457, raJ2000: 160.8540, decJ2000: 23.1884, mag: 5.070 },
    { cnName: '少微四', hip: 52686, raJ2000: 161.6023, decJ2000: 18.8915, mag: 5.492 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Snake_s_Abdomen: ChineseAsterism = {
  label: '蛇腹',
  english: 'Snake\'s Abdomen',
  type: 'sub',
  mansionIndex: 15,
  mansionLabel: '娄',
  enclosure: null,
  color: '#BCC6CC',
  quadrant: '西白虎',
  stars: [
    { cnName: '蛇腹一', hip: 12876, raJ2000: 41.3860, decJ2000: -67.6166, mag: 4.820 },
    { cnName: '蛇腹二', hip: 12394, raJ2000: 39.8973, decJ2000: -68.2669, mag: 4.096 },
    { cnName: '蛇腹三', hip: 11001, raJ2000: 35.4373, decJ2000: -68.6594, mag: 4.090 },
    { cnName: '蛇腹四', hip: 8928, raJ2000: 28.7339, decJ2000: -67.6473, mag: 4.685 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Snake_s_Head: ChineseAsterism = {
  label: '蛇首',
  english: 'Snake\'s Head',
  type: 'sub',
  mansionIndex: 16,
  mansionLabel: '胃',
  enclosure: null,
  color: '#AEB6BF',
  quadrant: '西白虎',
  stars: [
    { cnName: '蛇首一', hip: 9236, raJ2000: 29.6922, decJ2000: -61.5698, mag: 2.840 },
    { cnName: '蛇首二', hip: 17440, raJ2000: 56.0499, decJ2000: -64.8069, mag: 3.833 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Snake_s_Tail: ChineseAsterism = {
  label: '蛇尾',
  english: 'Snake\'s Tail',
  type: 'sub',
  mansionIndex: 4,
  mansionLabel: '心',
  enclosure: null,
  color: '#196F3D',
  quadrant: '东青龙',
  stars: [
    { cnName: '蛇尾一', hip: 2021, raJ2000: 6.4378, decJ2000: -77.2542, mag: 2.790 },
    { cnName: '蛇尾二', hip: 110078, raJ2000: 334.4608, decJ2000: -77.5116, mag: 5.472 },
    { cnName: '蛇尾三', hip: 107089, raJ2000: 325.3689, decJ2000: -77.3900, mag: 3.728 },
    { cnName: '蛇尾四', hip: 104043, raJ2000: 316.1794, decJ2000: -77.0238, mag: 5.150 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Changing_Room_Vassal_of_Tail: ChineseAsterism = {
  label: '神宫 (附尾宿)',
  english: 'Changing Room (Vassal of Tail)',
  type: 'sub',
  mansionIndex: 5,
  mansionLabel: '尾',
  enclosure: null,
  color: '#145A32',
  quadrant: '东青龙',
  stars: [
    { cnName: '神宫 (附尾宿)一', hip: 82676, raJ2000: 253.5077, decJ2000: -41.8064, mag: 5.450 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Twelve_States: ChineseAsterism = {
  label: '十二国',
  english: 'Twelve States',
  type: 'sub',
  mansionIndex: 9,
  mansionLabel: '女',
  enclosure: null,
  color: '#2874A6',
  quadrant: '北玄武',
  stars: [
    { cnName: '十二国一', hip: 104019, raJ2000: 316.1012, decJ2000: -19.8551, mag: 4.840 },
    { cnName: '十二国二', hip: 103703, raJ2000: 315.2157, decJ2000: -17.5309, mag: 6.050 },
    { cnName: '十二国三', hip: 104139, raJ2000: 316.4868, decJ2000: -17.2329, mag: 4.070 },
    { cnName: '十二国四', hip: 105143, raJ2000: 319.4887, decJ2000: -17.9851, mag: 5.383 },
    { cnName: '十二国五', hip: 105515, raJ2000: 320.5616, decJ2000: -16.8345, mag: 4.270 },
    { cnName: '十二国六', hip: 106568, raJ2000: 323.7291, decJ2000: -20.2527, mag: 6.720 },
    { cnName: '十二国七', hip: 104429, raJ2000: 317.3143, decJ2000: -20.1932, mag: 6.740 },
    { cnName: '十二国八', hip: 104452, raJ2000: 317.3875, decJ2000: -20.5567, mag: 6.242 },
  ],
  connections: [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
  ] as const,
}

const asterism_Cross: ChineseAsterism = {
  label: '十字架',
  english: 'Cross',
  type: 'sub',
  mansionIndex: 26,
  mansionLabel: '翼',
  enclosure: null,
  color: '#CA6F1E',
  quadrant: '南朱雀',
  stars: [
    { cnName: '十字架一', hip: 61084, raJ2000: 187.7915, decJ2000: -57.1132, mag: 1.640 },
    { cnName: '十字架二', hip: 60718, raJ2000: 186.6496, decJ2000: -63.0991, mag: null },
    { cnName: '十字架三', hip: 62434, raJ2000: 191.9303, decJ2000: -59.6888, mag: 1.250 },
    { cnName: '十字架四', hip: 59747, raJ2000: 183.7863, decJ2000: -58.7489, mag: 2.752 },
  ],
  connections: [
    [0, 1],
    [2, 3],
  ] as const,
}

const asterism_Excrement: ChineseAsterism = {
  label: '屎',
  english: 'Excrement',
  type: 'sub',
  mansionIndex: 19,
  mansionLabel: '觜',
  enclosure: null,
  color: '#2C3E50',
  quadrant: '西白虎',
  stars: [
    { cnName: '屎一', hip: 27204, raJ2000: 86.4996, decJ2000: -32.3064, mag: 5.180 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Municipal_Office: ChineseAsterism = {
  label: '市楼',
  english: 'Municipal Office',
  type: 'sub',
  mansionIndex: 5,
  mansionLabel: '尾',
  enclosure: null,
  color: '#145A32',
  quadrant: '东青龙',
  stars: [
    { cnName: '市楼一', hip: 86284, raJ2000: 264.4613, decJ2000: -8.1188, mag: 4.620 },
    { cnName: '市楼二', hip: 86565, raJ2000: 265.3536, decJ2000: -12.8753, mag: 4.228 },
    { cnName: '市楼三', hip: 88404, raJ2000: 270.7705, decJ2000: -8.1803, mag: 4.790 },
    { cnName: '市楼四', hip: 84880, raJ2000: 260.2069, decJ2000: -12.8469, mag: 4.324 },
    { cnName: '市楼五', hip: 85397, raJ2000: 261.7590, decJ2000: -12.5125, mag: 6.206 },
    { cnName: '市楼六', hip: 86768, raJ2000: 265.9459, decJ2000: -7.0796, mag: 6.320 },
  ],
  connections: [
    [0, 1],
    [2, 3],
    [4, 5],
  ] as const,
}

const asterism_Eunuch: ChineseAsterism = {
  label: '势',
  english: 'Eunuch',
  type: 'sub',
  mansionIndex: 25,
  mansionLabel: '张',
  enclosure: null,
  color: '#DC7633',
  quadrant: '南朱雀',
  stars: [
    { cnName: '势一', hip: 51685, raJ2000: 158.3788, decJ2000: 34.9887, mag: 5.580 },
    { cnName: '势二', hip: 51556, raJ2000: 157.9641, decJ2000: 32.3796, mag: 5.905 },
    { cnName: '势三', hip: 52638, raJ2000: 161.4662, decJ2000: 30.6823, mag: 5.352 },
    { cnName: '势四', hip: 53229, raJ2000: 163.3279, decJ2000: 34.2149, mag: 3.830 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Official_for_Irrigation: ChineseAsterism = {
  label: '水府',
  english: 'Official for Irrigation',
  type: 'sub',
  mansionIndex: 20,
  mansionLabel: '参',
  enclosure: null,
  color: '#1C2833',
  quadrant: '西白虎',
  stars: [
    { cnName: '水府一', hip: 29038, raJ2000: 91.8930, decJ2000: 14.7685, mag: 4.397 },
    { cnName: '水府二', hip: 29426, raJ2000: 92.9850, decJ2000: 14.2088, mag: 4.480 },
    { cnName: '水府三', hip: 29704, raJ2000: 93.8547, decJ2000: 16.1432, mag: 5.327 },
    { cnName: '水府四', hip: 29434, raJ2000: 93.0137, decJ2000: 16.1304, mag: 4.920 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Crooked_Running_Water: ChineseAsterism = {
  label: '水委',
  english: 'Crooked Running Water',
  type: 'sub',
  mansionIndex: 14,
  mansionLabel: '奎',
  enclosure: null,
  color: '#D4AF37',
  quadrant: '西白虎',
  stars: [
    { cnName: '水委一', hip: 7588, raJ2000: 24.4285, decJ2000: -57.2368, mag: 0.460 },
    { cnName: '水委二', hip: 5348, raJ2000: 17.0962, decJ2000: -55.2458, mag: 4.014 },
    { cnName: '水委三', hip: 3405, raJ2000: 10.8384, decJ2000: -57.4631, mag: 4.361 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Water_Level: ChineseAsterism = {
  label: '水位',
  english: 'Water Level',
  type: 'sub',
  mansionIndex: 21,
  mansionLabel: '井',
  enclosure: null,
  color: '#F5B7B1',
  quadrant: '南朱雀',
  stars: [
    { cnName: '水位一', hip: 36425, raJ2000: 112.4491, decJ2000: 12.0066, mag: 4.531 },
    { cnName: '水位二', hip: 37921, raJ2000: 116.5675, decJ2000: 10.7683, mag: 5.237 },
    { cnName: '水位三', hip: 39567, raJ2000: 121.2687, decJ2000: 13.1182, mag: 5.136 },
    { cnName: '水位四', hip: 40167, raJ2000: 123.0530, decJ2000: 17.6478, mag: null },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Deified_Judge_of_Right_and_Wrong: ChineseAsterism = {
  label: '司非',
  english: 'Deified Judge of Right and Wrong',
  type: 'sub',
  mansionIndex: 9,
  mansionLabel: '女',
  enclosure: null,
  color: '#2874A6',
  quadrant: '北玄武',
  stars: [
    { cnName: '司非一', hip: 104521, raJ2000: 317.5854, decJ2000: 10.1316, mag: 4.680 },
    { cnName: '司非二', hip: 104858, raJ2000: 318.6201, decJ2000: 10.0070, mag: 4.490 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Deity_in_Charge_of_Monsters: ChineseAsterism = {
  label: '司怪',
  english: 'Deity in Charge of Monsters',
  type: 'sub',
  mansionIndex: 20,
  mansionLabel: '参',
  enclosure: null,
  color: '#1C2833',
  quadrant: '西白虎',
  stars: [
    { cnName: '司怪一', hip: 28237, raJ2000: 89.4986, decJ2000: 25.9539, mag: 4.820 },
    { cnName: '司怪二', hip: 28734, raJ2000: 91.0301, decJ2000: 23.2633, mag: 4.150 },
    { cnName: '司怪三', hip: 28716, raJ2000: 90.9799, decJ2000: 20.1385, mag: 4.630 },
    { cnName: '司怪四', hip: 27913, raJ2000: 88.5958, decJ2000: 20.2762, mag: 4.400 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Deified_Judge_of_Rank: ChineseAsterism = {
  label: '司禄',
  english: 'Deified Judge of Rank',
  type: 'sub',
  mansionIndex: 10,
  mansionLabel: '虚',
  enclosure: null,
  color: '#1B4F72',
  quadrant: '北玄武',
  stars: [
    { cnName: '司禄一', hip: 107575, raJ2000: 326.8082, decJ2000: 2.6861, mag: 5.624 },
    { cnName: '司禄二', hip: 106944, raJ2000: 324.8886, decJ2000: 2.2436, mag: 5.100 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Deified_Judge_of_Life: ChineseAsterism = {
  label: '司命',
  english: 'Deified Judge of Life',
  type: 'sub',
  mansionIndex: 10,
  mansionLabel: '虚',
  enclosure: null,
  color: '#1B4F72',
  quadrant: '北玄武',
  stars: [
    { cnName: '司命一', hip: 106942, raJ2000: 324.8814, decJ2000: -0.0511, mag: null },
    { cnName: '司命二', hip: 107144, raJ2000: 325.5421, decJ2000: 1.2853, mag: 5.641 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Deified_Judge_of_Disaster_and_Good_Fortune: ChineseAsterism = {
  label: '司危',
  english: 'Deified Judge of Disaster and Good Fortune',
  type: 'sub',
  mansionIndex: 9,
  mansionLabel: '女',
  enclosure: null,
  color: '#2874A6',
  quadrant: '北玄武',
  stars: [
    { cnName: '司危一', hip: 105570, raJ2000: 320.7234, decJ2000: 6.8111, mag: 5.148 },
    { cnName: '司危二', hip: 105413, raJ2000: 320.2701, decJ2000: 7.3545, mag: 5.798 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Four_Channels: ChineseAsterism = {
  label: '四渎',
  english: 'Four Channels',
  type: 'sub',
  mansionIndex: 20,
  mansionLabel: '参',
  enclosure: null,
  color: '#1C2833',
  quadrant: '西白虎',
  stars: [
    { cnName: '四渎一', hip: 34033, raJ2000: 105.9086, decJ2000: 10.9518, mag: 5.117 },
    { cnName: '四渎二', hip: 32533, raJ2000: 101.8326, decJ2000: 8.0373, mag: 4.770 },
    { cnName: '四渎三', hip: 31216, raJ2000: 98.2259, decJ2000: 7.3330, mag: 4.500 },
    { cnName: '四渎四', hip: 30419, raJ2000: 95.9420, decJ2000: 4.5929, mag: 4.398 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Four_Advisors: ChineseAsterism = {
  label: '四辅',
  english: 'Four Advisors',
  type: 'sub',
  mansionIndex: 25,
  mansionLabel: '张',
  enclosure: null,
  color: '#DC7633',
  quadrant: '南朱雀',
  stars: [
    { cnName: '四辅一', hip: 51502, raJ2000: 157.7696, decJ2000: 82.5587, mag: 5.252 },
    { cnName: '四辅二', hip: 51384, raJ2000: 157.4235, decJ2000: 84.2519, mag: 5.510 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Grandson: ChineseAsterism = {
  label: '孙',
  english: 'Grandson',
  type: 'sub',
  mansionIndex: 20,
  mansionLabel: '参',
  enclosure: null,
  color: '#1C2833',
  quadrant: '西白虎',
  stars: [
    { cnName: '孙一', hip: 29807, raJ2000: 94.1381, decJ2000: -35.1405, mag: 4.370 },
    { cnName: '孙二', hip: 29034, raJ2000: 91.8818, decJ2000: -37.2529, mag: 4.994 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Guard_of_the_Sun: ChineseAsterism = {
  label: '太阳守',
  english: 'Guard of the Sun',
  type: 'sub',
  mansionIndex: 26,
  mansionLabel: '翼',
  enclosure: null,
  color: '#CA6F1E',
  quadrant: '南朱雀',
  stars: [
    { cnName: '太阳守一', hip: 57399, raJ2000: 176.5126, decJ2000: 47.7794, mag: 3.720 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_First_Great_One: ChineseAsterism = {
  label: '太乙',
  english: 'First Great One',
  type: 'sub',
  mansionIndex: 0,
  mansionLabel: '角',
  enclosure: null,
  color: '#2ECC71',
  quadrant: '东青龙',
  stars: [
    { cnName: '太乙一', hip: 66798, raJ2000: 205.3746, decJ2000: 64.8224, mag: 5.850 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Crown_Prince: ChineseAsterism = {
  label: '太子',
  english: 'Crown Prince',
  type: 'sub',
  mansionIndex: 26,
  mansionLabel: '翼',
  enclosure: null,
  color: '#CA6F1E',
  quadrant: '南朱雀',
  stars: [
    { cnName: '太子一', hip: 57565, raJ2000: 176.9964, decJ2000: 20.2189, mag: 4.520 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Royals: ChineseAsterism = {
  label: '太尊',
  english: 'Royals',
  type: 'sub',
  mansionIndex: 26,
  mansionLabel: '翼',
  enclosure: null,
  color: '#CA6F1E',
  quadrant: '南朱雀',
  stars: [
    { cnName: '太尊一', hip: 54539, raJ2000: 167.4159, decJ2000: 44.4985, mag: 3.010 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Flying_Serpent: ChineseAsterism = {
  label: '螣蛇',
  english: 'Flying Serpent',
  type: 'sub',
  mansionIndex: 11,
  mansionLabel: '危',
  enclosure: null,
  color: '#154360',
  quadrant: '北玄武',
  stars: [
    { cnName: '螣蛇一', hip: 111169, raJ2000: 337.8229, decJ2000: 50.2825, mag: 3.770 },
    { cnName: '螣蛇二', hip: 110609, raJ2000: 336.1291, decJ2000: 49.4764, mag: 4.580 },
    { cnName: '螣蛇三', hip: 107533, raJ2000: 326.6984, decJ2000: 49.3096, mag: 4.180 },
    { cnName: '螣蛇四', hip: 107136, raJ2000: 325.5236, decJ2000: 51.1896, mag: 4.660 },
    { cnName: '螣蛇五', hip: 106886, raJ2000: 324.7401, decJ2000: 57.4890, mag: 5.620 },
    { cnName: '螣蛇六', hip: 108165, raJ2000: 328.7215, decJ2000: 56.6112, mag: 5.800 },
    { cnName: '螣蛇七', hip: 109857, raJ2000: 333.7592, decJ2000: 57.0436, mag: null },
    { cnName: '螣蛇八', hip: 110538, raJ2000: 335.8901, decJ2000: 52.2290, mag: 4.440 },
    { cnName: '螣蛇九', hip: 118243, raJ2000: 359.7522, decJ2000: 55.7549, mag: null },
    { cnName: '螣蛇十', hip: 117863, raJ2000: 358.5960, decJ2000: 57.4994, mag: 4.590 },
    { cnName: '螣蛇十一', hip: 117301, raJ2000: 356.7644, decJ2000: 58.6520, mag: 4.873 },
    { cnName: '螣蛇十二', hip: 115990, raJ2000: 352.5081, decJ2000: 58.5489, mag: 4.886 },
    { cnName: '螣蛇十三', hip: 111674, raJ2000: 339.3434, decJ2000: 51.5451, mag: 4.630 },
    { cnName: '螣蛇十四', hip: 113919, raJ2000: 346.0458, decJ2000: 50.0521, mag: null },
    { cnName: '螣蛇十五', hip: 114570, raJ2000: 348.1375, decJ2000: 49.4062, mag: 4.520 },
    { cnName: '螣蛇十六', hip: 115022, raJ2000: 349.4360, decJ2000: 49.0153, mag: 4.860 },
    { cnName: '螣蛇十七', hip: 116584, raJ2000: 354.3910, decJ2000: 46.4582, mag: 3.820 },
    { cnName: '螣蛇十八', hip: 117221, raJ2000: 356.5085, decJ2000: 46.4203, mag: 4.966 },
    { cnName: '螣蛇十九', hip: 116805, raJ2000: 355.1021, decJ2000: 44.3339, mag: 4.140 },
    { cnName: '螣蛇二十', hip: 116631, raJ2000: 354.5342, decJ2000: 43.2681, mag: 4.290 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    [8, 9],
    [9, 10],
    [10, 11],
    [11, 12],
    [12, 13],
    [13, 14],
    [14, 15],
    [15, 16],
    [16, 17],
    [17, 18],
    [18, 19],
  ] as const,
}

const asterism_Celestial_Concave: ChineseAsterism = {
  label: '天阿',
  english: 'Celestial Concave',
  type: 'sub',
  mansionIndex: 16,
  mansionLabel: '胃',
  enclosure: null,
  color: '#AEB6BF',
  quadrant: '西白虎',
  stars: [
    { cnName: '天阿一', hip: 15696, raJ2000: 50.5496, decJ2000: 27.6076, mag: 5.520 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Celestial_Flail: ChineseAsterism = {
  label: '天棓',
  english: 'Celestial Flail',
  type: 'sub',
  mansionIndex: 5,
  mansionLabel: '尾',
  enclosure: null,
  color: '#145A32',
  quadrant: '东青龙',
  stars: [
    { cnName: '天棓一', hip: 87585, raJ2000: 268.3822, decJ2000: 56.8726, mag: 3.750 },
    { cnName: '天棓二', hip: 85829, raJ2000: 263.0668, decJ2000: 55.1729, mag: null },
    { cnName: '天棓三', hip: 85670, raJ2000: 262.6082, decJ2000: 52.3014, mag: 2.810 },
    { cnName: '天棓四', hip: 87833, raJ2000: 269.1515, decJ2000: 51.4889, mag: 2.230 },
    { cnName: '天棓五', hip: 86414, raJ2000: 264.8662, decJ2000: 46.0063, mag: 3.800 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
  ] as const,
}

const asterism_Market_Officer: ChineseAsterism = {
  label: '天弁',
  english: 'Market Officer',
  type: 'sub',
  mansionIndex: 7,
  mansionLabel: '斗',
  enclosure: null,
  color: '#5DADE2',
  quadrant: '北玄武',
  stars: [
    { cnName: '天弁一', hip: 91117, raJ2000: 278.8018, decJ2000: -8.2441, mag: 3.830 },
    { cnName: '天弁二', hip: 91726, raJ2000: 280.5684, decJ2000: -9.0526, mag: 4.710 },
    { cnName: '天弁三', hip: 91845, raJ2000: 280.8802, decJ2000: -8.2752, mag: 4.889 },
    { cnName: '天弁四', hip: 92175, raJ2000: 281.7936, decJ2000: -4.7479, mag: 4.220 },
    { cnName: '天弁五', hip: 93026, raJ2000: 284.2653, decJ2000: -5.8463, mag: 4.818 },
    { cnName: '天弁六', hip: 93429, raJ2000: 285.4201, decJ2000: -5.7391, mag: 4.020 },
    { cnName: '天弁七', hip: 93805, raJ2000: 286.5622, decJ2000: -4.8826, mag: 3.430 },
    { cnName: '天弁八', hip: 93717, raJ2000: 286.2403, decJ2000: -4.0314, mag: 5.394 },
    { cnName: '天弁九', hip: 93526, raJ2000: 285.7271, decJ2000: -3.6990, mag: 5.400 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
  ] as const,
}

const asterism_Square_Celestial_Granary: ChineseAsterism = {
  label: '天仓',
  english: 'Square Celestial Granary',
  type: 'sub',
  mansionIndex: 14,
  mansionLabel: '奎',
  enclosure: null,
  color: '#D4AF37',
  quadrant: '西白虎',
  stars: [
    { cnName: '天仓一', hip: 1562, raJ2000: 4.8570, decJ2000: -8.8239, mag: 3.550 },
    { cnName: '天仓二', hip: 5364, raJ2000: 17.1475, decJ2000: -10.1823, mag: 3.450 },
    { cnName: '天仓三', hip: 6537, raJ2000: 21.0058, decJ2000: -8.1833, mag: 3.590 },
    { cnName: '天仓四', hip: 8645, raJ2000: 27.8651, decJ2000: -10.3350, mag: 3.720 },
    { cnName: '天仓五', hip: 8102, raJ2000: 26.0170, decJ2000: -15.9375, mag: 3.500 },
    { cnName: '天仓六', hip: 9326, raJ2000: 29.9425, decJ2000: -20.8245, mag: 5.429 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
  ] as const,
}

const asterism_Celestial_Slander: ChineseAsterism = {
  label: '天谗',
  english: 'Celestial Slander',
  type: 'sub',
  mansionIndex: 17,
  mansionLabel: '昴',
  enclosure: null,
  color: '#829AE3',
  quadrant: '西白虎',
  stars: [
    { cnName: '天谗一', hip: 17886, raJ2000: 57.3862, decJ2000: 33.0914, mag: 5.110 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Celestial_Kitchen: ChineseAsterism = {
  label: '天厨',
  english: 'Celestial Kitchen',
  type: 'sub',
  mansionIndex: 7,
  mansionLabel: '斗',
  enclosure: null,
  color: '#5DADE2',
  quadrant: '北玄武',
  stars: [
    { cnName: '天厨一', hip: 94376, raJ2000: 288.1388, decJ2000: 67.6615, mag: 3.070 },
    { cnName: '天厨二', hip: 96100, raJ2000: 293.0900, decJ2000: 69.6612, mag: 4.680 },
    { cnName: '天厨三', hip: 97433, raJ2000: 297.0431, decJ2000: 70.2679, mag: 3.910 },
    { cnName: '天厨四', hip: 98702, raJ2000: 300.7045, decJ2000: 67.8736, mag: 4.500 },
    { cnName: '天厨五', hip: 98583, raJ2000: 300.3689, decJ2000: 64.8210, mag: 5.270 },
    { cnName: '天厨六', hip: 95081, raJ2000: 290.1670, decJ2000: 65.7145, mag: 4.590 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
  ] as const,
}

const asterism_Celestial_Boat: ChineseAsterism = {
  label: '天船',
  english: 'Celestial Boat',
  type: 'sub',
  mansionIndex: 16,
  mansionLabel: '胃',
  enclosure: null,
  color: '#AEB6BF',
  quadrant: '西白虎',
  stars: [
    { cnName: '天船一', hip: 13268, raJ2000: 42.6742, decJ2000: 55.8955, mag: 3.790 },
    { cnName: '天船二', hip: 14328, raJ2000: 46.1993, decJ2000: 53.5065, mag: 2.930 },
    { cnName: '天船三', hip: 15863, raJ2000: 51.0807, decJ2000: 49.8612, mag: 1.790 },
    { cnName: '天船四', hip: 16826, raJ2000: 54.1224, decJ2000: 48.1926, mag: 4.230 },
    { cnName: '天船五', hip: 17358, raJ2000: 55.7312, decJ2000: 47.7875, mag: 3.010 },
    { cnName: '天船六', hip: 19343, raJ2000: 62.1654, decJ2000: 47.7125, mag: 4.030 },
    { cnName: '天船七', hip: 19812, raJ2000: 63.7244, decJ2000: 48.4093, mag: 4.160 },
    { cnName: '天船八', hip: 20156, raJ2000: 64.8051, decJ2000: 50.0487, mag: 5.400 },
    { cnName: '天船九', hip: 19949, raJ2000: 64.1795, decJ2000: 53.6118, mag: 5.187 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
  ] as const,
}

const asterism_Celestial_Bed: ChineseAsterism = {
  label: '天床',
  english: 'Celestial Bed',
  type: 'sub',
  mansionIndex: 2,
  mansionLabel: '氐',
  enclosure: null,
  color: '#229954',
  quadrant: '东青龙',
  stars: [
    { cnName: '天床一', hip: 69373, raJ2000: 213.0167, decJ2000: 69.4325, mag: 5.240 },
    { cnName: '天床二', hip: 74605, raJ2000: 228.6597, decJ2000: 67.3467, mag: null },
    { cnName: '天床三', hip: 77277, raJ2000: 236.6667, decJ2000: 62.5996, mag: 5.194 },
    { cnName: '天床四', hip: 79414, raJ2000: 243.1057, decJ2000: 67.1442, mag: 6.211 },
    { cnName: '天床五', hip: 73199, raJ2000: 224.3959, decJ2000: 65.9324, mag: 4.540 },
    { cnName: '天床六', hip: 72181, raJ2000: 221.4630, decJ2000: 71.9662, mag: 7.500 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [3, 4],
    [4, 5],
  ] as const,
}

const asterism_Great_General_of_Heaven: ChineseAsterism = {
  label: '天大将军',
  english: 'Great General of Heaven',
  type: 'sub',
  mansionIndex: 14,
  mansionLabel: '奎',
  enclosure: null,
  color: '#D4AF37',
  quadrant: '西白虎',
  stars: [
    { cnName: '天大将军一', hip: 9640, raJ2000: 30.9748, decJ2000: 42.3297, mag: 2.100 },
    { cnName: '天大将军二', hip: 8068, raJ2000: 25.9152, decJ2000: 50.6887, mag: 4.060 },
    { cnName: '天大将军三', hip: 7607, raJ2000: 24.4982, decJ2000: 48.6282, mag: 3.570 },
    { cnName: '天大将军四', hip: 6999, raJ2000: 22.5254, decJ2000: 47.0073, mag: 5.261 },
    { cnName: '天大将军五', hip: 7719, raJ2000: 24.8375, decJ2000: 44.3862, mag: 5.008 },
    { cnName: '天大将军六', hip: 7513, raJ2000: 24.1993, decJ2000: 41.4055, mag: 4.100 },
    { cnName: '天大将军七', hip: 7818, raJ2000: 25.1451, decJ2000: 40.5770, mag: 4.940 },
    { cnName: '天大将军八', hip: 9021, raJ2000: 29.0390, decJ2000: 37.2518, mag: null },
    { cnName: '天大将军九', hip: 10064, raJ2000: 32.3859, decJ2000: 34.9873, mag: 3.000 },
    { cnName: '天大将军十', hip: 10670, raJ2000: 34.3286, decJ2000: 33.8472, mag: 4.000 },
    { cnName: '天大将军十一', hip: 10644, raJ2000: 34.2635, decJ2000: 34.2242, mag: null },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    [8, 9],
    [9, 10],
    [10, 0],
  ] as const,
}

const asterism_Celestial_Drumstick: ChineseAsterism = {
  label: '天桴',
  english: 'Celestial Drumstick',
  type: 'sub',
  mansionIndex: 7,
  mansionLabel: '斗',
  enclosure: null,
  color: '#5DADE2',
  quadrant: '北玄武',
  stars: [
    { cnName: '天桴一', hip: 99473, raJ2000: 302.8262, decJ2000: -0.8215, mag: 3.220 },
    { cnName: '天桴二', hip: 98844, raJ2000: 301.0965, decJ2000: -0.7093, mag: 5.680 },
    { cnName: '天桴三', hip: 97980, raJ2000: 298.6866, decJ2000: 0.2736, mag: 5.631 },
    { cnName: '天桴四', hip: 97804, raJ2000: 298.1182, decJ2000: 1.0057, mag: 3.800 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Celestial_Spokes: ChineseAsterism = {
  label: '天辐',
  english: 'Celestial Spokes',
  type: 'sub',
  mansionIndex: 2,
  mansionLabel: '氐',
  enclosure: null,
  color: '#229954',
  quadrant: '东青龙',
  stars: [
    { cnName: '天辐一', hip: 76470, raJ2000: 234.2560, decJ2000: -28.1351, mag: 3.589 },
    { cnName: '天辐二', hip: 76600, raJ2000: 234.6640, decJ2000: -29.7777, mag: 3.642 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Materials_for_Making_Tents: ChineseAsterism = {
  label: '天纲',
  english: 'Materials for Making Tents',
  type: 'sub',
  mansionIndex: 11,
  mansionLabel: '危',
  enclosure: null,
  color: '#154360',
  quadrant: '北玄武',
  stars: [
    { cnName: '天纲一', hip: 113246, raJ2000: 343.9871, decJ2000: -32.5396, mag: 4.208 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Celestial_High_Terrace: ChineseAsterism = {
  label: '天高',
  english: 'Celestial High Terrace',
  type: 'sub',
  mansionIndex: 18,
  mansionLabel: '毕',
  enclosure: null,
  color: '#566573',
  quadrant: '西白虎',
  stars: [
    { cnName: '天高一', hip: 23497, raJ2000: 75.7739, decJ2000: 21.5900, mag: 4.615 },
    { cnName: '天高二', hip: 22565, raJ2000: 72.8436, decJ2000: 18.8399, mag: 5.085 },
    { cnName: '天高三', hip: 23949, raJ2000: 77.2101, decJ2000: 19.8599, mag: 6.500 },
    { cnName: '天高四', hip: 24822, raJ2000: 79.8192, decJ2000: 22.0965, mag: 4.948 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
  ] as const,
}

const asterism_Celestial_Hook: ChineseAsterism = {
  label: '天钩',
  english: 'Celestial Hook',
  type: 'sub',
  mansionIndex: 10,
  mansionLabel: '虚',
  enclosure: null,
  color: '#1B4F72',
  quadrant: '北玄武',
  stars: [
    { cnName: '天钩一', hip: 102253, raJ2000: 310.7959, decJ2000: 66.6574, mag: 5.600 },
    { cnName: '天钩二', hip: 99731, raJ2000: 303.5444, decJ2000: 64.7652, mag: 7.270 },
    { cnName: '天钩三', hip: 101093, raJ2000: 307.3954, decJ2000: 62.9941, mag: 4.220 },
    { cnName: '天钩四', hip: 102422, raJ2000: 311.3224, decJ2000: 61.8388, mag: 3.410 },
    { cnName: '天钩五', hip: 105199, raJ2000: 319.6449, decJ2000: 62.5856, mag: 2.460 },
    { cnName: '天钩六', hip: 108917, raJ2000: 330.9477, decJ2000: 64.6280, mag: 4.290 },
    { cnName: '天钩七', hip: 110817, raJ2000: 336.7721, decJ2000: 65.1323, mag: 5.515 },
    { cnName: '天钩八', hip: 112724, raJ2000: 342.4201, decJ2000: 66.2004, mag: 3.540 },
    { cnName: '天钩九', hip: 115088, raJ2000: 349.6562, decJ2000: 68.1114, mag: null },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
  ] as const,
}

const asterism_Celestial_Dog: ChineseAsterism = {
  label: '天狗',
  english: 'Celestial Dog',
  type: 'sub',
  mansionIndex: 23,
  mansionLabel: '柳',
  enclosure: null,
  color: '#EC7063',
  quadrant: '南朱雀',
  stars: [
    { cnName: '天狗一', hip: 42312, raJ2000: 129.4110, decJ2000: -42.9891, mag: 4.140 },
    { cnName: '天狗二', hip: 42884, raJ2000: 131.0998, decJ2000: -42.6493, mag: 4.046 },
    { cnName: '天狗三', hip: 42515, raJ2000: 130.0256, decJ2000: -35.3084, mag: 3.954 },
    { cnName: '天狗四', hip: 42828, raJ2000: 130.8981, decJ2000: -33.1864, mag: 3.680 },
    { cnName: '天狗五', hip: 43409, raJ2000: 132.6330, decJ2000: -27.7098, mag: 4.010 },
    { cnName: '天狗六', hip: 43825, raJ2000: 133.8815, decJ2000: -27.6818, mag: 4.890 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
  ] as const,
}

const asterism_Celestial_Pass: ChineseAsterism = {
  label: '天关',
  english: 'Celestial Pass',
  type: 'sub',
  mansionIndex: 19,
  mansionLabel: '觜',
  enclosure: null,
  color: '#2C3E50',
  quadrant: '西白虎',
  stars: [
    { cnName: '天关一', hip: 26451, raJ2000: 84.4112, decJ2000: 21.1425, mag: 3.030 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Great_Emperor_of_Heaven: ChineseAsterism = {
  label: '天皇大帝',
  english: 'Great Emperor of Heaven',
  type: 'sub',
  mansionIndex: 11,
  mansionLabel: '危',
  enclosure: null,
  color: '#154360',
  quadrant: '北玄武',
  stars: [
    { cnName: '天皇大帝一', hip: 109693, raJ2000: 333.2938, decJ2000: 86.1080, mag: 5.258 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Celestial_Pier: ChineseAsterism = {
  label: '天潢',
  english: 'Celestial Pier',
  type: 'sub',
  mansionIndex: 18,
  mansionLabel: '毕',
  enclosure: null,
  color: '#566573',
  quadrant: '西白虎',
  stars: [
    { cnName: '天潢一', hip: 24879, raJ2000: 80.0038, decJ2000: 33.9581, mag: 5.030 },
    { cnName: '天潢二', hip: 25541, raJ2000: 81.9120, decJ2000: 34.4759, mag: 5.059 },
    { cnName: '天潢三', hip: 25292, raJ2000: 81.1631, decJ2000: 37.3853, mag: 4.996 },
    { cnName: '天潢四', hip: 24340, raJ2000: 78.3572, decJ2000: 38.4845, mag: 4.821 },
    { cnName: '天潢五', hip: 24504, raJ2000: 78.8516, decJ2000: 32.6876, mag: 5.000 },
  ],
  connections: [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
  ] as const,
}

const asterism_Celestial_Pigsty: ChineseAsterism = {
  label: '天溷',
  english: 'Celestial Pigsty',
  type: 'sub',
  mansionIndex: 13,
  mansionLabel: '壁',
  enclosure: null,
  color: '#0E6251',
  quadrant: '北玄武',
  stars: [
    { cnName: '天溷一', hip: 4257, raJ2000: 13.5733, decJ2000: -8.7407, mag: 6.161 },
    { cnName: '天溷二', hip: 4371, raJ2000: 14.0062, decJ2000: -11.2665, mag: 5.326 },
    { cnName: '天溷三', hip: 3559, raJ2000: 11.3695, decJ2000: -12.8808, mag: 6.150 },
    { cnName: '天溷四', hip: 3455, raJ2000: 11.0475, decJ2000: -10.6096, mag: 4.767 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Celestial_Cock: ChineseAsterism = {
  label: '天鸡',
  english: 'Celestial Cock',
  type: 'sub',
  mansionIndex: 7,
  mansionLabel: '斗',
  enclosure: null,
  color: '#5DADE2',
  quadrant: '北玄武',
  stars: [
    { cnName: '天鸡一', hip: 96950, raJ2000: 295.6297, decJ2000: -16.1240, mag: 5.045 },
    { cnName: '天鸡二', hip: 97290, raJ2000: 296.5906, decJ2000: -19.7611, mag: 4.873 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Judge_for_Estimating_the_Age_of_Animals: ChineseAsterism = {
  label: '天记',
  english: 'Judge for Estimating the Age of Animals',
  type: 'sub',
  mansionIndex: 23,
  mansionLabel: '柳',
  enclosure: null,
  color: '#EC7063',
  quadrant: '南朱雀',
  stars: [
    { cnName: '天记一', hip: 44816, raJ2000: 136.9990, decJ2000: -43.4326, mag: 2.210 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Celestial_Discipline: ChineseAsterism = {
  label: '天纪',
  english: 'Celestial Discipline',
  type: 'sub',
  mansionIndex: 5,
  mansionLabel: '尾',
  enclosure: null,
  color: '#145A32',
  quadrant: '东青龙',
  stars: [
    { cnName: '天纪一', hip: 80181, raJ2000: 245.5243, decJ2000: 30.8920, mag: 4.849 },
    { cnName: '天纪二', hip: 81693, raJ2000: 250.3215, decJ2000: 31.6027, mag: 2.800 },
    { cnName: '天纪三', hip: 83207, raJ2000: 255.0724, decJ2000: 30.9264, mag: 3.920 },
    { cnName: '天纪四', hip: 83313, raJ2000: 255.4015, decJ2000: 33.5683, mag: 5.267 },
    { cnName: '天纪五', hip: 83462, raJ2000: 255.8759, decJ2000: 35.4141, mag: 6.230 },
    { cnName: '天纪六', hip: 84573, raJ2000: 259.3315, decJ2000: 33.1001, mag: 4.800 },
    { cnName: '天纪七', hip: 86178, raJ2000: 264.1531, decJ2000: 30.7852, mag: 6.050 },
    { cnName: '天纪八', hip: 87808, raJ2000: 269.0633, decJ2000: 37.2505, mag: 3.880 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
  ] as const,
}

const asterism_Celestial_River: ChineseAsterism = {
  label: '天江',
  english: 'Celestial River',
  type: 'sub',
  mansionIndex: 5,
  mansionLabel: '尾',
  enclosure: null,
  color: '#145A32',
  quadrant: '东青龙',
  stars: [
    { cnName: '天江一', hip: 84314, raJ2000: 258.5594, decJ2000: -26.9844, mag: 6.633 },
    { cnName: '天江二', hip: 84405, raJ2000: 258.8374, decJ2000: -26.6028, mag: null },
    { cnName: '天江三', hip: 84970, raJ2000: 260.5024, decJ2000: -24.9995, mag: 3.260 },
    { cnName: '天江四', hip: 85340, raJ2000: 261.5926, decJ2000: -24.1753, mag: 4.153 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Celestial_Street: ChineseAsterism = {
  label: '天街',
  english: 'Celestial Street',
  type: 'sub',
  mansionIndex: 17,
  mansionLabel: '昴',
  enclosure: null,
  color: '#829AE3',
  quadrant: '西白虎',
  stars: [
    { cnName: '天街一', hip: 20641, raJ2000: 66.3542, decJ2000: 22.2000, mag: 5.264 },
    { cnName: '天街二', hip: 19990, raJ2000: 64.3153, decJ2000: 20.5786, mag: 4.914 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Celestial_Tally: ChineseAsterism = {
  label: '天节',
  english: 'Celestial Tally',
  type: 'sub',
  mansionIndex: 18,
  mansionLabel: '毕',
  enclosure: null,
  color: '#566573',
  quadrant: '西白虎',
  stars: [
    { cnName: '天节一', hip: 20732, raJ2000: 66.6515, decJ2000: 14.7138, mag: 4.690 },
    { cnName: '天节二', hip: 21273, raJ2000: 68.4622, decJ2000: 14.8444, mag: 4.650 },
    { cnName: '天节三', hip: 20219, raJ2000: 64.9904, decJ2000: 14.0352, mag: 5.568 },
    { cnName: '天节四', hip: 20901, raJ2000: 67.2090, decJ2000: 13.0476, mag: 5.014 },
    { cnName: '天节五', hip: 21589, raJ2000: 69.5394, decJ2000: 12.5108, mag: 4.270 },
    { cnName: '天节六', hip: 21735, raJ2000: 70.0142, decJ2000: 12.1976, mag: 5.445 },
    { cnName: '天节七', hip: 21402, raJ2000: 68.9136, decJ2000: 10.1608, mag: 4.250 },
    { cnName: '天节八', hip: 20522, raJ2000: 65.9659, decJ2000: 9.4610, mag: 5.098 },
  ],
  connections: [
    [0, 1],
    [0, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
  ] as const,
}

const asterism_Celestial_Ford: ChineseAsterism = {
  label: '天津',
  english: 'Celestial Ford',
  type: 'sub',
  mansionIndex: 8,
  mansionLabel: '牛',
  enclosure: null,
  color: '#3498DB',
  quadrant: '北玄武',
  stars: [
    { cnName: '天津一', hip: 104732, raJ2000: 318.2341, decJ2000: 30.2269, mag: 3.210 },
    { cnName: '天津二', hip: 105138, raJ2000: 319.4795, decJ2000: 34.8969, mag: 4.420 },
    { cnName: '天津三', hip: 104887, raJ2000: 318.6979, decJ2000: 38.0453, mag: 3.730 },
    { cnName: '天津四', hip: 103413, raJ2000: 314.2934, decJ2000: 41.1671, mag: 3.940 },
    { cnName: '天津五', hip: 102098, raJ2000: 310.3580, decJ2000: 45.2803, mag: 1.250 },
    { cnName: '天津六', hip: 99639, raJ2000: 303.3252, decJ2000: 46.8157, mag: 4.819 },
    { cnName: '天津七', hip: 97165, raJ2000: 296.2437, decJ2000: 45.1308, mag: 2.870 },
    { cnName: '天津八', hip: 100453, raJ2000: 305.5571, decJ2000: 40.2567, mag: 2.230 },
    { cnName: '天津九', hip: 102488, raJ2000: 311.5528, decJ2000: 33.9703, mag: 2.480 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    [8, 0],
  ] as const,
}

const asterism_Celestial_Stable: ChineseAsterism = {
  label: '天厩',
  english: 'Celestial Stable',
  type: 'sub',
  mansionIndex: 13,
  mansionLabel: '壁',
  enclosure: null,
  color: '#0E6251',
  quadrant: '北玄武',
  stars: [
    { cnName: '天厩一', hip: 1366, raJ2000: 4.2729, decJ2000: 38.6816, mag: 4.610 },
    { cnName: '天厩二', hip: 1686, raJ2000: 5.2803, decJ2000: 37.9686, mag: 5.180 },
    { cnName: '天厩三', hip: 1473, raJ2000: 4.5819, decJ2000: 36.7852, mag: 4.520 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Celestial_Wolf: ChineseAsterism = {
  label: '天狼',
  english: 'Celestial Wolf',
  type: 'sub',
  mansionIndex: 20,
  mansionLabel: '参',
  enclosure: null,
  color: '#1C2833',
  quadrant: '西白虎',
  stars: [
    { cnName: '天狼一', hip: 32349, raJ2000: 101.2872, decJ2000: -16.7161, mag: -1.460 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Celestial_Prison: ChineseAsterism = {
  label: '天牢',
  english: 'Celestial Prison',
  type: 'sub',
  mansionIndex: 26,
  mansionLabel: '翼',
  enclosure: null,
  color: '#CA6F1E',
  quadrant: '南朱雀',
  stars: [
    { cnName: '天牢一', hip: 53295, raJ2000: 163.4948, decJ2000: 43.1900, mag: 4.664 },
    { cnName: '天牢二', hip: 56034, raJ2000: 172.2672, decJ2000: 39.3370, mag: 5.354 },
    { cnName: '天牢三', hip: 53721, raJ2000: 164.8666, decJ2000: 40.4303, mag: null },
    { cnName: '天牢四', hip: 56148, raJ2000: 172.6297, decJ2000: 43.1732, mag: 5.942 },
    { cnName: '天牢五', hip: 53838, raJ2000: 165.2101, decJ2000: 39.2121, mag: 5.062 },
    { cnName: '天牢六', hip: 55560, raJ2000: 170.7066, decJ2000: 43.4827, mag: 5.030 },
  ],
  connections: [
    [0, 1],
    [2, 3],
    [4, 5],
  ] as const,
}

const asterism_Celestial_Ramparts: ChineseAsterism = {
  label: '天垒城',
  english: 'Celestial Ramparts',
  type: 'sub',
  mansionIndex: 9,
  mansionLabel: '女',
  enclosure: null,
  color: '#2874A6',
  quadrant: '北玄武',
  stars: [
    { cnName: '天垒城一', hip: 106786, raJ2000: 324.4380, decJ2000: -7.8542, mag: 4.690 },
    { cnName: '天垒城二', hip: 107382, raJ2000: 326.2511, decJ2000: -9.0824, mag: 5.079 },
    { cnName: '天垒城三', hip: 107487, raJ2000: 326.5678, decJ2000: -9.2759, mag: 6.000 },
    { cnName: '天垒城四', hip: 107517, raJ2000: 326.6337, decJ2000: -11.3660, mag: 5.567 },
    { cnName: '天垒城五', hip: 107527, raJ2000: 326.6754, decJ2000: -11.6978, mag: 6.990 },
    { cnName: '天垒城六', hip: 105668, raJ2000: 321.0479, decJ2000: -12.8781, mag: 5.476 },
    { cnName: '天垒城七', hip: 104974, raJ2000: 318.9368, decJ2000: -15.1715, mag: 5.317 },
    { cnName: '天垒城八', hip: 103728, raJ2000: 315.2847, decJ2000: -13.5300, mag: 6.550 },
    { cnName: '天垒城九', hip: 103640, raJ2000: 314.9784, decJ2000: -13.0516, mag: 6.600 },
    { cnName: '天垒城十', hip: 104459, raJ2000: 317.3985, decJ2000: -11.3717, mag: 4.520 },
    { cnName: '天垒城十一', hip: 105019, raJ2000: 319.0741, decJ2000: -9.2147, mag: 6.460 },
    { cnName: '天垒城十二', hip: 105574, raJ2000: 320.7344, decJ2000: -9.3193, mag: 5.965 },
    { cnName: '天垒城十三', hip: 105761, raJ2000: 321.3043, decJ2000: -9.7486, mag: 5.713 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    [8, 9],
    [9, 10],
    [10, 11],
    [11, 12],
  ] as const,
}

const asterism_Judge_for_Nobility: ChineseAsterism = {
  label: '天理',
  english: 'Judge for Nobility',
  type: 'sub',
  mansionIndex: 26,
  mansionLabel: '翼',
  enclosure: null,
  color: '#CA6F1E',
  quadrant: '南朱雀',
  stars: [
    { cnName: '天理一', hip: 55060, raJ2000: 169.0791, decJ2000: 59.9433, mag: 6.905 },
    { cnName: '天理二', hip: 55797, raJ2000: 171.4880, decJ2000: 55.8505, mag: 5.700 },
    { cnName: '天理三', hip: 58181, raJ2000: 178.9934, decJ2000: 56.5986, mag: 5.824 },
    { cnName: '天理四', hip: 58259, raJ2000: 179.2218, decJ2000: 61.5492, mag: 6.200 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
  ] as const,
}

const asterism_Celestial_Foodstuff: ChineseAsterism = {
  label: '天廪',
  english: 'Celestial Foodstuff',
  type: 'sub',
  mansionIndex: 16,
  mansionLabel: '胃',
  enclosure: null,
  color: '#AEB6BF',
  quadrant: '西白虎',
  stars: [
    { cnName: '天廪一', hip: 16369, raJ2000: 52.7182, decJ2000: 12.9367, mag: 4.100 },
    { cnName: '天廪二', hip: 16322, raJ2000: 52.6020, decJ2000: 11.3364, mag: 5.124 },
    { cnName: '天廪三', hip: 16083, raJ2000: 51.7923, decJ2000: 9.7327, mag: 3.750 },
    { cnName: '天廪四', hip: 15900, raJ2000: 51.2033, decJ2000: 9.0289, mag: 3.600 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Celestial_Gate: ChineseAsterism = {
  label: '天门',
  english: 'Celestial Gate',
  type: 'sub',
  mansionIndex: 27,
  mansionLabel: '轸',
  enclosure: null,
  color: '#BA4A00',
  quadrant: '南朱雀',
  stars: [
    { cnName: '天门一', hip: 64407, raJ2000: 198.0148, decJ2000: -16.1986, mag: 5.040 },
    { cnName: '天门二', hip: 65639, raJ2000: 201.8632, decJ2000: -15.9736, mag: 4.750 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Celestial_Money: ChineseAsterism = {
  label: '天钱',
  english: 'Celestial Money',
  type: 'sub',
  mansionIndex: 10,
  mansionLabel: '虚',
  enclosure: null,
  color: '#1B4F72',
  quadrant: '北玄武',
  stars: [
    { cnName: '天钱一', hip: 108952, raJ2000: 331.0993, decJ2000: -29.9165, mag: 6.460 },
    { cnName: '天钱二', hip: 107608, raJ2000: 326.9340, decJ2000: -30.8983, mag: 5.017 },
    { cnName: '天钱三', hip: 107380, raJ2000: 326.2367, decJ2000: -33.0258, mag: 4.340 },
    { cnName: '天钱四', hip: 109285, raJ2000: 332.0959, decJ2000: -32.9885, mag: 4.500 },
    { cnName: '天钱五', hip: 109422, raJ2000: 332.5366, decJ2000: -32.5484, mag: 4.920 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 0],
  ] as const,
}

const asterism_Celestial_Spear: ChineseAsterism = {
  label: '天枪',
  english: 'Celestial Spear',
  type: 'sub',
  mansionIndex: 1,
  mansionLabel: '亢',
  enclosure: null,
  color: '#27AE60',
  quadrant: '东青龙',
  stars: [
    { cnName: '天枪一', hip: 69481, raJ2000: 213.3659, decJ2000: 51.7880, mag: 6.690 },
    { cnName: '天枪二', hip: 69713, raJ2000: 214.0414, decJ2000: 51.3672, mag: 4.750 },
    { cnName: '天枪三', hip: 70497, raJ2000: 216.2992, decJ2000: 51.8507, mag: 4.050 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Circular_Celestial_Granary: ChineseAsterism = {
  label: '天囷',
  english: 'Circular Celestial Granary',
  type: 'sub',
  mansionIndex: 15,
  mansionLabel: '娄',
  enclosure: null,
  color: '#BCC6CC',
  quadrant: '西白虎',
  stars: [
    { cnName: '天囷一', hip: 14135, raJ2000: 45.5699, decJ2000: 4.0897, mag: 2.530 },
    { cnName: '天囷二', hip: 15619, raJ2000: 50.2783, decJ2000: 3.6756, mag: 5.690 },
    { cnName: '天囷三', hip: 13954, raJ2000: 44.9287, decJ2000: 8.9074, mag: 4.700 },
    { cnName: '天囷四', hip: 12828, raJ2000: 41.2356, decJ2000: 10.1141, mag: 4.260 },
    { cnName: '天囷五', hip: 10324, raJ2000: 33.2500, decJ2000: 8.8467, mag: 4.350 },
    { cnName: '天囷六', hip: 11484, raJ2000: 37.0398, decJ2000: 8.4601, mag: 4.300 },
    { cnName: '天囷七', hip: 12093, raJ2000: 38.9686, decJ2000: 5.5932, mag: 4.871 },
    { cnName: '天囷八', hip: 12706, raJ2000: 40.8252, decJ2000: 3.2358, mag: 3.470 },
    { cnName: '天囷九', hip: 12387, raJ2000: 39.8707, decJ2000: 0.3285, mag: 4.070 },
    { cnName: '天囷十', hip: 11791, raJ2000: 38.0393, decJ2000: -1.0349, mag: 5.358 },
    { cnName: '天囷十一', hip: 11046, raJ2000: 35.5516, decJ2000: -0.8849, mag: 5.421 },
    { cnName: '天囷十二', hip: 10234, raJ2000: 32.8993, decJ2000: -1.8254, mag: 5.933 },
    { cnName: '天囷十三', hip: 10305, raJ2000: 33.1981, decJ2000: -2.3936, mag: 5.660 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    [8, 9],
    [9, 10],
    [10, 11],
    [11, 12],
  ] as const,
}

const asterism_Celestial_Milk: ChineseAsterism = {
  label: '天乳',
  english: 'Celestial Milk',
  type: 'sub',
  mansionIndex: 2,
  mansionLabel: '氐',
  enclosure: null,
  color: '#229954',
  quadrant: '东青龙',
  stars: [
    { cnName: '天乳一', hip: 77516, raJ2000: 237.4050, decJ2000: -3.4302, mag: 3.530 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Celestial_Earth_God_s_Temple: ChineseAsterism = {
  label: '天社',
  english: 'Celestial Earth God\'s Temple',
  type: 'sub',
  mansionIndex: 23,
  mansionLabel: '柳',
  enclosure: null,
  color: '#EC7063',
  quadrant: '南朱雀',
  stars: [
    { cnName: '天社一', hip: 39953, raJ2000: 122.3831, decJ2000: -47.3366, mag: 1.830 },
    { cnName: '天社二', hip: 42570, raJ2000: 130.1565, decJ2000: -46.6487, mag: 3.810 },
    { cnName: '天社三', hip: 42913, raJ2000: 131.1759, decJ2000: -54.7088, mag: null },
    { cnName: '天社四', hip: 45941, raJ2000: 140.5284, decJ2000: -55.0107, mag: 2.473 },
    { cnName: '天社五', hip: 46701, raJ2000: 142.8055, decJ2000: -57.0344, mag: 3.139 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
  ] as const,
}

const asterism_Celestial_Farmland_In_Horn_Mansion: ChineseAsterism = {
  label: '天田 (角宿)',
  english: 'Celestial Farmland (In Horn Mansion)',
  type: 'sub',
  mansionIndex: 0,
  mansionLabel: '角',
  enclosure: null,
  color: '#2ECC71',
  quadrant: '东青龙',
  stars: [
    { cnName: '天田 (角宿)一', hip: 68520, raJ2000: 210.4116, decJ2000: 1.5445, mag: 4.237 },
    { cnName: '天田 (角宿)二', hip: 66200, raJ2000: 203.5330, decJ2000: 3.6590, mag: 4.940 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Celestial_Farmland_In_Ox_Mansion: ChineseAsterism = {
  label: '天田 (牛宿)',
  english: 'Celestial Farmland (In Ox Mansion)',
  type: 'sub',
  mansionIndex: 9,
  mansionLabel: '女',
  enclosure: null,
  color: '#2874A6',
  quadrant: '北玄武',
  stars: [
    { cnName: '天田 (牛宿)一', hip: 104750, raJ2000: 318.3222, decJ2000: -27.6194, mag: 5.388 },
    { cnName: '天田 (牛宿)二', hip: 102978, raJ2000: 312.9554, decJ2000: -26.9191, mag: 4.120 },
    { cnName: '天田 (牛宿)三', hip: 104234, raJ2000: 316.7820, decJ2000: -25.0059, mag: 4.500 },
    { cnName: '天田 (牛宿)四', hip: 102485, raJ2000: 311.5239, decJ2000: -25.2709, mag: 4.122 },
  ],
  connections: [
    [0, 1],
    [0, 2],
    [2, 3],
    [1, 3],
  ] as const,
}

const asterism_Celestial_Premier: ChineseAsterism = {
  label: '天相',
  english: 'Celestial Premier',
  type: 'sub',
  mansionIndex: 25,
  mansionLabel: '张',
  enclosure: null,
  color: '#DC7633',
  quadrant: '南朱雀',
  stars: [
    { cnName: '天相一', hip: 49812, raJ2000: 152.5314, decJ2000: -8.4082, mag: 5.901 },
    { cnName: '天相二', hip: 50414, raJ2000: 154.4075, decJ2000: -8.0689, mag: 5.240 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Celestial_Great_One: ChineseAsterism = {
  label: '天乙',
  english: 'Celestial Great One',
  type: 'sub',
  mansionIndex: 0,
  mansionLabel: '角',
  enclosure: null,
  color: '#2ECC71',
  quadrant: '东青龙',
  stars: [
    { cnName: '天乙一', hip: 67627, raJ2000: 207.8580, decJ2000: 64.7233, mag: 4.660 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Celestial_Yin_Force: ChineseAsterism = {
  label: '天阴',
  english: 'Celestial Yin Force',
  type: 'sub',
  mansionIndex: 16,
  mansionLabel: '胃',
  enclosure: null,
  color: '#AEB6BF',
  quadrant: '西白虎',
  stars: [
    { cnName: '天阴一', hip: 15737, raJ2000: 50.6885, decJ2000: 20.7421, mag: 5.130 },
    { cnName: '天阴二', hip: 15110, raJ2000: 48.7254, decJ2000: 21.0444, mag: 4.869 },
    { cnName: '天阴三', hip: 14838, raJ2000: 47.9074, decJ2000: 19.7267, mag: 4.370 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Ricks_of_Grain: ChineseAsterism = {
  label: '天庾',
  english: 'Ricks of Grain',
  type: 'sub',
  mansionIndex: 15,
  mansionLabel: '娄',
  enclosure: null,
  color: '#BCC6CC',
  quadrant: '西白虎',
  stars: [
    { cnName: '天庾一', hip: 11918, raJ2000: 38.4613, decJ2000: -28.2323, mag: 4.960 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Celestial_Spring: ChineseAsterism = {
  label: '天渊',
  english: 'Celestial Spring',
  type: 'sub',
  mansionIndex: 7,
  mansionLabel: '斗',
  enclosure: null,
  color: '#5DADE2',
  quadrant: '北玄武',
  stars: [
    { cnName: '天渊一', hip: 95294, raJ2000: 290.8047, decJ2000: -44.7998, mag: 4.270 },
    { cnName: '天渊二', hip: 95241, raJ2000: 290.6596, decJ2000: -44.4590, mag: 4.010 },
    { cnName: '天渊三', hip: 95347, raJ2000: 290.9716, decJ2000: -40.6159, mag: 3.943 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Celestial_Orchard: ChineseAsterism = {
  label: '天园',
  english: 'Celestial Orchard',
  type: 'sub',
  mansionIndex: 16,
  mansionLabel: '胃',
  enclosure: null,
  color: '#AEB6BF',
  quadrant: '西白虎',
  stars: [
    { cnName: '天园一', hip: 7083, raJ2000: 22.8129, decJ2000: -49.0727, mag: 3.935 },
    { cnName: '天园二', hip: 9007, raJ2000: 28.9894, decJ2000: -51.6089, mag: 3.710 },
    { cnName: '天园三', hip: 10602, raJ2000: 34.1274, decJ2000: -51.5122, mag: 3.570 },
    { cnName: '天园四', hip: 11407, raJ2000: 36.7463, decJ2000: -47.7038, mag: 4.250 },
    { cnName: '天园五', hip: 12413, raJ2000: 39.9499, decJ2000: -42.8918, mag: 4.750 },
    { cnName: '天园六', hip: 13847, raJ2000: 44.5653, decJ2000: -40.3047, mag: null },
    { cnName: '天园七', hip: 17351, raJ2000: 55.7086, decJ2000: -37.3135, mag: 4.583 },
    { cnName: '天园八', hip: 17797, raJ2000: 57.1495, decJ2000: -37.6202, mag: 4.270 },
    { cnName: '天园九', hip: 17874, raJ2000: 57.3635, decJ2000: -36.2003, mag: 4.170 },
    { cnName: '天园十', hip: 20042, raJ2000: 64.4736, decJ2000: -33.7983, mag: 3.560 },
    { cnName: '天园十一', hip: 20535, raJ2000: 66.0092, decJ2000: -34.0168, mag: 3.960 },
    { cnName: '天园十二', hip: 21393, raJ2000: 68.8877, decJ2000: -30.5623, mag: 3.820 },
    { cnName: '天园十三', hip: 21248, raJ2000: 68.3773, decJ2000: -29.7665, mag: 4.510 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    [8, 9],
    [9, 10],
    [10, 11],
    [11, 12],
  ] as const,
}

const asterism_Celestial_Meadows: ChineseAsterism = {
  label: '天苑',
  english: 'Celestial Meadows',
  type: 'sub',
  mansionIndex: 16,
  mansionLabel: '胃',
  enclosure: null,
  color: '#AEB6BF',
  quadrant: '西白虎',
  stars: [
    { cnName: '天苑一', hip: 18543, raJ2000: 59.5074, decJ2000: -13.5085, mag: 2.940 },
    { cnName: '天苑二', hip: 17593, raJ2000: 56.5356, decJ2000: -12.1016, mag: 4.420 },
    { cnName: '天苑三', hip: 17378, raJ2000: 55.8121, decJ2000: -9.7634, mag: 3.540 },
    { cnName: '天苑四', hip: 16537, raJ2000: 53.2327, decJ2000: -9.4583, mag: 3.730 },
    { cnName: '天苑五', hip: 15197, raJ2000: 48.9584, decJ2000: -8.8197, mag: 4.800 },
    { cnName: '天苑六', hip: 13701, raJ2000: 44.1069, decJ2000: -8.8981, mag: 3.870 },
    { cnName: '天苑七', hip: 12770, raJ2000: 41.0306, decJ2000: -13.8587, mag: 4.236 },
    { cnName: '天苑八', hip: 12843, raJ2000: 41.2758, decJ2000: -18.5726, mag: 4.460 },
    { cnName: '天苑九', hip: 13288, raJ2000: 42.7597, decJ2000: -21.0040, mag: 4.770 },
    { cnName: '天苑十', hip: 14146, raJ2000: 45.5979, decJ2000: -23.6245, mag: 4.090 },
    { cnName: '天苑十一', hip: 15474, raJ2000: 49.8792, decJ2000: -21.7579, mag: 3.700 },
    { cnName: '天苑十二', hip: 16611, raJ2000: 53.4470, decJ2000: -21.6329, mag: 4.250 },
    { cnName: '天苑十三', hip: 17651, raJ2000: 56.7120, decJ2000: -23.2497, mag: 4.200 },
    { cnName: '天苑十四', hip: 17717, raJ2000: 56.9152, decJ2000: -23.8747, mag: 5.235 },
    { cnName: '天苑十五', hip: 18216, raJ2000: 58.4279, decJ2000: -24.6122, mag: 4.623 },
    { cnName: '天苑十六', hip: 18673, raJ2000: 59.9812, decJ2000: -24.0162, mag: 4.660 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    [8, 9],
    [9, 10],
    [10, 11],
    [11, 12],
    [12, 13],
    [13, 14],
    [14, 15],
  ] as const,
}

const asterism_Celestial_Keyhole: ChineseAsterism = {
  label: '天籥',
  english: 'Celestial Keyhole',
  type: 'sub',
  mansionIndex: 5,
  mansionLabel: '尾',
  enclosure: null,
  color: '#145A32',
  quadrant: '东青龙',
  stars: [
    { cnName: '天籥一', hip: 87706, raJ2000: 268.7252, decJ2000: -24.8871, mag: 6.200 },
    { cnName: '天籥二', hip: 86736, raJ2000: 265.8575, decJ2000: -21.6832, mag: 4.861 },
    { cnName: '天籥三', hip: 86352, raJ2000: 264.6869, decJ2000: -21.9127, mag: 6.200 },
    { cnName: '天籥四', hip: 86060, raJ2000: 263.8271, decJ2000: -22.0438, mag: 6.481 },
    { cnName: '天籥五', hip: 85755, raJ2000: 262.8540, decJ2000: -23.9626, mag: 4.810 },
    { cnName: '天籥六', hip: 85783, raJ2000: 262.9349, decJ2000: -26.2697, mag: 6.052 },
    { cnName: '天籥七', hip: 87072, raJ2000: 266.8901, decJ2000: -27.8308, mag: 4.540 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
  ] as const,
}

const asterism_Celestial_Pillar: ChineseAsterism = {
  label: '天柱',
  english: 'Celestial Pillar',
  type: 'sub',
  mansionIndex: 7,
  mansionLabel: '斗',
  enclosure: null,
  color: '#5DADE2',
  quadrant: '北玄武',
  stars: [
    { cnName: '天柱一', hip: 102208, raJ2000: 310.6468, decJ2000: 82.5312, mag: 5.750 },
    { cnName: '天柱二', hip: 104105, raJ2000: 316.3719, decJ2000: 78.1264, mag: 5.907 },
    { cnName: '天柱三', hip: 98401, raJ2000: 299.9026, decJ2000: 76.4814, mag: 6.200 },
    { cnName: '天柱四', hip: 94083, raJ2000: 287.2912, decJ2000: 76.5605, mag: 5.107 },
    { cnName: '天柱五', hip: 88127, raJ2000: 270.0147, decJ2000: 80.0008, mag: 5.939 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
  ] as const,
}

const asterism_Celestial_Wine_Cup: ChineseAsterism = {
  label: '天樽',
  english: 'Celestial Wine Cup',
  type: 'sub',
  mansionIndex: 20,
  mansionLabel: '参',
  enclosure: null,
  color: '#1C2833',
  quadrant: '西白虎',
  stars: [
    { cnName: '天樽一', hip: 35846, raJ2000: 110.8688, decJ2000: 25.0505, mag: 5.022 },
    { cnName: '天樽二', hip: 35550, raJ2000: 110.0307, decJ2000: 21.9823, mag: 3.530 },
    { cnName: '天樽三', hip: 33927, raJ2000: 105.6032, decJ2000: 24.2154, mag: 5.181 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Butcher_s_Shops: ChineseAsterism = {
  label: '屠肆',
  english: 'Butcher\'s Shops',
  type: 'sub',
  mansionIndex: 7,
  mansionLabel: '斗',
  enclosure: null,
  color: '#5DADE2',
  quadrant: '北玄武',
  stars: [
    { cnName: '屠肆一', hip: 90139, raJ2000: 275.9245, decJ2000: 21.7698, mag: 3.840 },
    { cnName: '屠肆二', hip: 88657, raJ2000: 271.5079, decJ2000: 22.2189, mag: 5.060 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Official_for_Earthworks_and_Buildings: ChineseAsterism = {
  label: '土公',
  english: 'Official for Earthworks and Buildings',
  type: 'sub',
  mansionIndex: 13,
  mansionLabel: '壁',
  enclosure: null,
  color: '#0E6251',
  quadrant: '北玄武',
  stars: [
    { cnName: '土公一', hip: 194, raJ2000: 0.6238, decJ2000: 8.4855, mag: 5.690 },
    { cnName: '土公二', hip: 2025, raJ2000: 6.4246, decJ2000: 7.6911, mag: 6.763 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Official_for_Materials_Supply: ChineseAsterism = {
  label: '土公吏',
  english: 'Official for Materials Supply',
  type: 'sub',
  mansionIndex: 11,
  mansionLabel: '危',
  enclosure: null,
  color: '#154360',
  quadrant: '北玄武',
  stars: [
    { cnName: '土公吏一', hip: 110386, raJ2000: 335.3795, decJ2000: 12.2052, mag: 4.990 },
    { cnName: '土公吏二', hip: 110986, raJ2000: 337.2833, decJ2000: 9.1290, mag: 5.574 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Master_of_Constructions: ChineseAsterism = {
  label: '土司空',
  english: 'Master of Constructions',
  type: 'sub',
  mansionIndex: 13,
  mansionLabel: '壁',
  enclosure: null,
  color: '#0E6251',
  quadrant: '北玄武',
  stars: [
    { cnName: '土司空一', hip: 3419, raJ2000: 10.8974, decJ2000: -17.9866, mag: 2.010 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Outer_Kitchen: ChineseAsterism = {
  label: '外厨',
  english: 'Outer Kitchen',
  type: 'sub',
  mansionIndex: 23,
  mansionLabel: '柳',
  enclosure: null,
  color: '#EC7063',
  quadrant: '南朱雀',
  stars: [
    { cnName: '外厨一', hip: 41375, raJ2000: 126.6134, decJ2000: -3.9874, mag: 5.590 },
    { cnName: '外厨二', hip: 42835, raJ2000: 130.9182, decJ2000: -7.2337, mag: 4.625 },
    { cnName: '外厨三', hip: 43305, raJ2000: 132.3405, decJ2000: -3.4430, mag: 5.310 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Outer_Fence: ChineseAsterism = {
  label: '外屏',
  english: 'Outer Fence',
  type: 'sub',
  mansionIndex: 14,
  mansionLabel: '奎',
  enclosure: null,
  color: '#D4AF37',
  quadrant: '西白虎',
  stars: [
    { cnName: '外屏一', hip: 9487, raJ2000: 30.5117, decJ2000: 2.7638, mag: null },
    { cnName: '外屏二', hip: 8833, raJ2000: 28.3889, decJ2000: 3.1875, mag: 4.604 },
    { cnName: '外屏三', hip: 7884, raJ2000: 25.3579, decJ2000: 5.4876, mag: 4.440 },
    { cnName: '外屏四', hip: 7007, raJ2000: 22.5463, decJ2000: 6.1438, mag: 4.840 },
    { cnName: '外屏五', hip: 5737, raJ2000: 18.4329, decJ2000: 7.5754, mag: 5.190 },
    { cnName: '外屏六', hip: 4906, raJ2000: 15.7359, decJ2000: 7.8901, mag: 4.280 },
    { cnName: '外屏七', hip: 3786, raJ2000: 12.1706, decJ2000: 7.5851, mag: 4.440 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
  ] as const,
}

const asterism_Wang_Liang: ChineseAsterism = {
  label: '王良',
  english: 'Wang Liang',
  type: 'sub',
  mansionIndex: 13,
  mansionLabel: '壁',
  enclosure: null,
  color: '#0E6251',
  quadrant: '北玄武',
  stars: [
    { cnName: '王良一', hip: 746, raJ2000: 2.2945, decJ2000: 59.1498, mag: 2.270 },
    { cnName: '王良二', hip: 2599, raJ2000: 8.2500, decJ2000: 62.9318, mag: 4.160 },
    { cnName: '王良三', hip: 3821, raJ2000: 12.2762, decJ2000: 57.8152, mag: 3.440 },
    { cnName: '王良四', hip: 3179, raJ2000: 10.1268, decJ2000: 56.5373, mag: 2.230 },
    { cnName: '王良五', hip: 2505, raJ2000: 7.9432, decJ2000: 54.5223, mag: null },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
  ] as const,
}

const asterism_Master_of_Constructions_In_Legs_Mansion: ChineseAsterism = {
  label: '王良 (土司空)',
  english: 'Master of Constructions (In Legs Mansion)',
  type: 'sub',
  mansionIndex: 12,
  mansionLabel: '室',
  enclosure: null,
  color: '#0B5345',
  quadrant: '北玄武',
  stars: [
  ],
  connections: [
  ] as const,
}

const asterism_Administrative_Center: ChineseAsterism = {
  label: '文昌',
  english: 'Administrative Center',
  type: 'sub',
  mansionIndex: 24,
  mansionLabel: '星',
  enclosure: null,
  color: '#E74C3C',
  quadrant: '南朱雀',
  stars: [
    { cnName: '文昌一', hip: 48319, raJ2000: 147.7473, decJ2000: 59.0387, mag: 3.810 },
    { cnName: '文昌二', hip: 48402, raJ2000: 148.0265, decJ2000: 54.0643, mag: 4.557 },
    { cnName: '文昌三', hip: 46853, raJ2000: 143.2143, decJ2000: 51.6773, mag: 3.180 },
    { cnName: '文昌四', hip: 44901, raJ2000: 137.2177, decJ2000: 51.6046, mag: 4.480 },
    { cnName: '文昌五', hip: 45493, raJ2000: 139.0472, decJ2000: 54.0219, mag: 4.805 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
  ] as const,
}

const asterism_Five_Chariots: ChineseAsterism = {
  label: '五车',
  english: 'Five Chariots',
  type: 'sub',
  mansionIndex: 18,
  mansionLabel: '毕',
  enclosure: null,
  color: '#566573',
  quadrant: '西白虎',
  stars: [
    { cnName: '五车一', hip: 23015, raJ2000: 74.2484, decJ2000: 33.1661, mag: 2.690 },
    { cnName: '五车二', hip: 24608, raJ2000: 79.1723, decJ2000: 45.9980, mag: 0.080 },
    { cnName: '五车三', hip: 28360, raJ2000: 89.8822, decJ2000: 44.9474, mag: 1.900 },
    { cnName: '五车四', hip: 28380, raJ2000: 89.9303, decJ2000: 37.2126, mag: 2.620 },
    { cnName: '五车五', hip: 25428, raJ2000: 81.5730, decJ2000: 28.6075, mag: 1.650 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
  ] as const,
}

const asterism_Interior_Seats_of_the_Five_Emperors: ChineseAsterism = {
  label: '五帝内座',
  english: 'Interior Seats of the Five Emperors',
  type: 'sub',
  mansionIndex: 16,
  mansionLabel: '胃',
  enclosure: null,
  color: '#AEB6BF',
  quadrant: '西白虎',
  stars: [
    { cnName: '五帝内座一', hip: 14417, raJ2000: 46.5327, decJ2000: 79.4185, mag: 5.520 },
    { cnName: '五帝内座二', hip: 9727, raJ2000: 31.2809, decJ2000: 77.2813, mag: 5.268 },
    { cnName: '五帝内座三', hip: 13055, raJ2000: 41.9489, decJ2000: 81.4485, mag: 5.781 },
    { cnName: '五帝内座四', hip: 15547, raJ2000: 50.0822, decJ2000: 77.7348, mag: 5.444 },
    { cnName: '五帝内座五', hip: 19461, raJ2000: 62.5114, decJ2000: 80.6987, mag: null },
  ],
  connections: [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
  ] as const,
}

const asterism_Seats_of_the_Five_Emperors: ChineseAsterism = {
  label: '五帝座',
  english: 'Seats of the Five Emperors',
  type: 'sub',
  mansionIndex: 26,
  mansionLabel: '翼',
  enclosure: null,
  color: '#CA6F1E',
  quadrant: '南朱雀',
  stars: [
    { cnName: '五帝座一', hip: 57632, raJ2000: 177.2649, decJ2000: 14.5721, mag: 2.130 },
    { cnName: '五帝座二', hip: 57646, raJ2000: 177.3116, decJ2000: 16.2429, mag: 6.036 },
    { cnName: '五帝座三', hip: 57320, raJ2000: 176.2976, decJ2000: 14.2633, mag: 6.525 },
    { cnName: '五帝座四', hip: 58159, raJ2000: 178.9189, decJ2000: 15.6468, mag: 5.522 },
    { cnName: '五帝座五', hip: 57779, raJ2000: 177.7306, decJ2000: 12.2790, mag: 6.367 },
  ],
  connections: [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
  ] as const,
}

const asterism_Five_Feudal_Kings: ChineseAsterism = {
  label: '五诸侯',
  english: 'Five Feudal Kings',
  type: 'sub',
  mansionIndex: 21,
  mansionLabel: '井',
  enclosure: null,
  color: '#F5B7B1',
  quadrant: '南朱雀',
  stars: [
    { cnName: '五诸侯一', hip: 33018, raJ2000: 103.1972, decJ2000: 33.9613, mag: 3.600 },
    { cnName: '五诸侯二', hip: 34693, raJ2000: 107.7849, decJ2000: 30.2452, mag: 4.420 },
    { cnName: '五诸侯三', hip: 36046, raJ2000: 111.4316, decJ2000: 27.7981, mag: 3.790 },
    { cnName: '五诸侯四', hip: 36962, raJ2000: 113.9806, decJ2000: 26.8957, mag: 4.060 },
    { cnName: '五诸侯五', hip: 38538, raJ2000: 118.3742, decJ2000: 26.7658, mag: 4.963 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
  ] as const,
}

const asterism_Five_Lords: ChineseAsterism = {
  label: '五诸侯',
  english: 'Five Lords',
  type: 'sub',
  mansionIndex: 27,
  mansionLabel: '轸',
  enclosure: null,
  color: '#BA4A00',
  quadrant: '南朱雀',
  stars: [
    { cnName: '五诸侯一', hip: 63948, raJ2000: 196.5885, decJ2000: 21.1534, mag: 6.057 },
    { cnName: '五诸侯二', hip: 63355, raJ2000: 194.7310, decJ2000: 17.4094, mag: 5.000 },
    { cnName: '五诸侯三', hip: 62356, raJ2000: 191.6615, decJ2000: 16.5777, mag: 5.120 },
    { cnName: '五诸侯四', hip: 59819, raJ2000: 184.0008, decJ2000: 14.8991, mag: 5.090 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Western_Door: ChineseAsterism = {
  label: '西咸',
  english: 'Western Door',
  type: 'sub',
  mansionIndex: 2,
  mansionLabel: '氐',
  enclosure: null,
  color: '#229954',
  quadrant: '东青龙',
  stars: [
    { cnName: '西咸一', hip: 78727, raJ2000: 241.0922, decJ2000: -11.3731, mag: 4.170 },
    { cnName: '西咸二', hip: 78207, raJ2000: 239.5474, decJ2000: -14.2794, mag: 4.870 },
    { cnName: '西咸三', hip: 77853, raJ2000: 238.4564, decJ2000: -16.7293, mag: 4.160 },
    { cnName: '西咸四', hip: 77060, raJ2000: 236.0183, decJ2000: -15.6728, mag: 5.412 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Xi_Zhong: ChineseAsterism = {
  label: '奚仲',
  english: 'Xi Zhong',
  type: 'sub',
  mansionIndex: 7,
  mansionLabel: '斗',
  enclosure: null,
  color: '#5DADE2',
  quadrant: '北玄武',
  stars: [
    { cnName: '奚仲一', hip: 94779, raJ2000: 289.2757, decJ2000: 53.3685, mag: 3.760 },
    { cnName: '奚仲二', hip: 95853, raJ2000: 292.4265, decJ2000: 51.7298, mag: 3.755 },
    { cnName: '奚仲三', hip: 96441, raJ2000: 294.1106, decJ2000: 50.2211, mag: 4.480 },
    { cnName: '奚仲四', hip: 96895, raJ2000: 295.4540, decJ2000: 50.5251, mag: 5.950 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Pool_of_Harmony: ChineseAsterism = {
  label: '咸池',
  english: 'Pool of Harmony',
  type: 'sub',
  mansionIndex: 18,
  mansionLabel: '毕',
  enclosure: null,
  color: '#566573',
  quadrant: '西白虎',
  stars: [
    { cnName: '咸池一', hip: 25048, raJ2000: 80.4517, decJ2000: 41.8046, mag: 5.207 },
    { cnName: '咸池二', hip: 25810, raJ2000: 82.6878, decJ2000: 39.8259, mag: 6.377 },
    { cnName: '咸池三', hip: 24813, raJ2000: 79.7853, decJ2000: 40.0991, mag: 4.710 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Prime_Minister: ChineseAsterism = {
  label: '相',
  english: 'Prime Minister',
  type: 'sub',
  mansionIndex: 26,
  mansionLabel: '翼',
  enclosure: null,
  color: '#CA6F1E',
  quadrant: '南朱雀',
  stars: [
    { cnName: '相一', hip: 60485, raJ2000: 186.0062, decJ2000: 51.5623, mag: 4.761 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Little_Dipper: ChineseAsterism = {
  label: '小斗',
  english: 'Little Dipper',
  type: 'sub',
  mansionIndex: 25,
  mansionLabel: '张',
  enclosure: null,
  color: '#DC7633',
  quadrant: '南朱雀',
  stars: [
    { cnName: '小斗一', hip: 60000, raJ2000: 184.5868, decJ2000: -79.3122, mag: 4.229 },
    { cnName: '小斗二', hip: 58484, raJ2000: 179.9066, decJ2000: -78.2218, mag: null },
    { cnName: '小斗三', hip: 51839, raJ2000: 158.8671, decJ2000: -78.6078, mag: 4.120 },
    { cnName: '小斗四', hip: 52633, raJ2000: 161.4459, decJ2000: -80.5402, mag: 4.433 },
    { cnName: '小斗五', hip: 46928, raJ2000: 143.4724, decJ2000: -80.9413, mag: 5.059 },
    { cnName: '小斗六', hip: 46107, raJ2000: 141.0384, decJ2000: -80.7869, mag: 5.360 },
    { cnName: '小斗七', hip: 43012, raJ2000: 131.4798, decJ2000: -79.5044, mag: 5.770 },
    { cnName: '小斗八', hip: 40888, raJ2000: 125.1606, decJ2000: -77.4845, mag: 4.337 },
    { cnName: '小斗九', hip: 36982, raJ2000: 114.0175, decJ2000: -77.6341, mag: 6.698 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
  ] as const,
}

const asterism_Officer_of_Honour: ChineseAsterism = {
  label: '幸臣',
  english: 'Officer of Honour',
  type: 'sub',
  mansionIndex: 26,
  mansionLabel: '翼',
  enclosure: null,
  color: '#CA6F1E',
  quadrant: '南朱雀',
  stars: [
    { cnName: '幸臣一', hip: 58519, raJ2000: 180.0196, decJ2000: 19.4194, mag: 6.950 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Temple: ChineseAsterism = {
  label: '虚梁',
  english: 'Temple',
  type: 'sub',
  mansionIndex: 11,
  mansionLabel: '危',
  enclosure: null,
  color: '#154360',
  quadrant: '北玄武',
  stars: [
    { cnName: '虚梁一', hip: 110023, raJ2000: 334.2771, decJ2000: -5.3872, mag: 5.751 },
    { cnName: '虚梁二', hip: 110578, raJ2000: 336.0287, decJ2000: -4.8370, mag: 5.779 },
    { cnName: '虚梁三', hip: 111710, raJ2000: 339.4391, decJ2000: -4.2281, mag: 5.030 },
    { cnName: '虚梁四', hip: 113345, raJ2000: 344.3216, decJ2000: -4.8101, mag: 6.313 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Xuanyuan: ChineseAsterism = {
  label: '轩辕',
  english: 'Xuanyuan',
  type: 'sub',
  mansionIndex: 24,
  mansionLabel: '星',
  enclosure: null,
  color: '#E74C3C',
  quadrant: '南朱雀',
  stars: [
    { cnName: '轩辕一', hip: 44248, raJ2000: 135.1603, decJ2000: 41.7830, mag: 3.960 },
    { cnName: '轩辕二', hip: 44700, raJ2000: 136.6324, decJ2000: 38.4522, mag: 4.539 },
    { cnName: '轩辕三', hip: 45688, raJ2000: 139.7110, decJ2000: 36.8026, mag: 3.920 },
    { cnName: '轩辕四', hip: 45860, raJ2000: 140.2638, decJ2000: 34.3926, mag: 3.140 },
    { cnName: '轩辕五', hip: 47617, raJ2000: 145.6443, decJ2000: 32.9949, mag: 6.920 },
    { cnName: '轩辕六', hip: 47701, raJ2000: 145.8886, decJ2000: 29.9745, mag: 5.621 },
    { cnName: '轩辕七', hip: 46146, raJ2000: 141.1636, decJ2000: 26.1823, mag: 4.460 },
    { cnName: '轩辕八', hip: 46750, raJ2000: 142.9301, decJ2000: 22.9680, mag: 4.310 },
    { cnName: '轩辕九', hip: 47908, raJ2000: 146.4628, decJ2000: 23.7743, mag: 2.980 },
    { cnName: '轩辕十', hip: 48455, raJ2000: 148.1909, decJ2000: 26.0070, mag: 3.880 },
    { cnName: '轩辕十一', hip: 50335, raJ2000: 154.1726, decJ2000: 23.4173, mag: 3.410 },
    { cnName: '轩辕十二', hip: 50583, raJ2000: 154.9931, decJ2000: 19.8415, mag: null },
    { cnName: '轩辕十三', hip: 49583, raJ2000: 151.8331, decJ2000: 16.7627, mag: 3.410 },
    { cnName: '轩辕十四', hip: 49669, raJ2000: 152.0930, decJ2000: 11.9672, mag: 1.400 },
    { cnName: '轩辕十五', hip: 47508, raJ2000: 145.2876, decJ2000: 9.8923, mag: 3.520 },
    { cnName: '轩辕十六', hip: 51624, raJ2000: 158.2028, decJ2000: 9.3066, mag: 3.870 },
    { cnName: '轩辕十七', hip: 49637, raJ2000: 151.9761, decJ2000: 9.9975, mag: 4.380 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    [8, 9],
    [9, 10],
    [10, 11],
    [11, 12],
    [12, 13],
    [13, 14],
    [13, 15],
    [13, 16],
  ] as const,
}

const asterism_Sombre_Lance: ChineseAsterism = {
  label: '玄戈',
  english: 'Sombre Lance',
  type: 'sub',
  mansionIndex: 1,
  mansionLabel: '亢',
  enclosure: null,
  color: '#27AE60',
  quadrant: '东青龙',
  stars: [
    { cnName: '玄戈一', hip: 69732, raJ2000: 214.0959, decJ2000: 46.0883, mag: 4.180 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Battle_Axe_Vassal_of_Well: ChineseAsterism = {
  label: '钺 (附井宿)',
  english: 'Battle Axe (Vassal of Well)',
  type: 'sub',
  mansionIndex: 20,
  mansionLabel: '参',
  enclosure: null,
  color: '#1C2833',
  quadrant: '西白虎',
  stars: [
    { cnName: '钺 (附井宿)一', hip: 29655, raJ2000: 93.7194, decJ2000: 22.5068, mag: 3.280 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Gate_of_Yang: ChineseAsterism = {
  label: '阳门',
  english: 'Gate of Yang',
  type: 'sub',
  mansionIndex: 1,
  mansionLabel: '亢',
  enclosure: null,
  color: '#27AE60',
  quadrant: '东青龙',
  stars: [
    { cnName: '阳门一', hip: 71865, raJ2000: 220.4900, decJ2000: -37.7935, mag: 4.000 },
    { cnName: '阳门二', hip: 72010, raJ2000: 220.9143, decJ2000: -35.1737, mag: 4.040 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Wild_Cockerel: ChineseAsterism = {
  label: '野鸡',
  english: 'Wild Cockerel',
  type: 'sub',
  mansionIndex: 20,
  mansionLabel: '参',
  enclosure: null,
  color: '#1C2833',
  quadrant: '西白虎',
  stars: [
    { cnName: '野鸡一', hip: 31592, raJ2000: 99.1710, decJ2000: -19.2559, mag: 3.910 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Usher_to_the_Court: ChineseAsterism = {
  label: '谒者',
  english: 'Usher to the Court',
  type: 'sub',
  mansionIndex: 26,
  mansionLabel: '翼',
  enclosure: null,
  color: '#CA6F1E',
  quadrant: '南朱雀',
  stars: [
    { cnName: '谒者一', hip: 60172, raJ2000: 185.0874, decJ2000: 3.3126, mag: 4.960 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Exotic_Bird: ChineseAsterism = {
  label: '异雀',
  english: 'Exotic Bird',
  type: 'sub',
  mansionIndex: 2,
  mansionLabel: '氐',
  enclosure: null,
  color: '#229954',
  quadrant: '东青龙',
  stars: [
    { cnName: '异雀一', hip: 84969, raJ2000: 260.4978, decJ2000: -67.7707, mag: 4.780 },
    { cnName: '异雀二', hip: 84979, raJ2000: 260.5245, decJ2000: -70.1232, mag: 5.390 },
    { cnName: '异雀三', hip: 81852, raJ2000: 250.7694, decJ2000: -77.5174, mag: 4.240 },
    { cnName: '异雀四', hip: 81065, raJ2000: 248.3628, decJ2000: -78.8971, mag: 3.854 },
    { cnName: '异雀五', hip: 70638, raJ2000: 216.7301, decJ2000: -83.6679, mag: 4.304 },
    { cnName: '异雀六', hip: 80047, raJ2000: 245.0867, decJ2000: -78.6957, mag: 4.680 },
    { cnName: '异雀七', hip: 69896, raJ2000: 214.5579, decJ2000: -81.0078, mag: 4.889 },
    { cnName: '异雀八', hip: 72370, raJ2000: 221.9655, decJ2000: -79.0448, mag: 3.798 },
    { cnName: '异雀九', hip: 70248, raJ2000: 215.5966, decJ2000: -80.1090, mag: 5.052 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [5, 7],
    [7, 8],
  ] as const,
}

const asterism_Hidden_Virtue: ChineseAsterism = {
  label: '阴德',
  english: 'Hidden Virtue',
  type: 'sub',
  mansionIndex: 25,
  mansionLabel: '张',
  enclosure: null,
  color: '#DC7633',
  quadrant: '南朱雀',
  stars: [
    { cnName: '阴德一', hip: 51734, raJ2000: 158.5560, decJ2000: 73.8345, mag: 7.570 },
    { cnName: '阴德二', hip: 51808, raJ2000: 158.7729, decJ2000: 75.7129, mag: 4.853 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Official_in_Charge_of_Pasturing: ChineseAsterism = {
  label: '右更',
  english: 'Official in Charge of Pasturing',
  type: 'sub',
  mansionIndex: 14,
  mansionLabel: '奎',
  enclosure: null,
  color: '#D4AF37',
  quadrant: '西白虎',
  stars: [
    { cnName: '右更一', hip: 6706, raJ2000: 21.5636, decJ2000: 19.1723, mag: 5.344 },
    { cnName: '右更二', hip: 7097, raJ2000: 22.8709, decJ2000: 15.3458, mag: 3.620 },
    { cnName: '右更三', hip: 7535, raJ2000: 24.2747, decJ2000: 12.1418, mag: 5.535 },
    { cnName: '右更四', hip: 8198, raJ2000: 26.3484, decJ2000: 9.1578, mag: 4.260 },
    { cnName: '右更五', hip: 7710, raJ2000: 24.8143, decJ2000: 14.2856, mag: 6.750 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
  ] as const,
}

const asterism_Right_Flag: ChineseAsterism = {
  label: '右旗',
  english: 'Right Flag',
  type: 'sub',
  mansionIndex: 7,
  mansionLabel: '斗',
  enclosure: null,
  color: '#5DADE2',
  quadrant: '北玄武',
  stars: [
    { cnName: '右旗一', hip: 96229, raJ2000: 293.5223, decJ2000: 7.3789, mag: 4.450 },
    { cnName: '右旗二', hip: 96665, raJ2000: 294.7985, decJ2000: 5.3978, mag: 5.170 },
    { cnName: '右旗三', hip: 95501, raJ2000: 291.3746, decJ2000: 3.1148, mag: 3.360 },
    { cnName: '右旗四', hip: 95585, raJ2000: 291.6295, decJ2000: 0.3386, mag: 4.720 },
    { cnName: '右旗五', hip: 96468, raJ2000: 294.1803, decJ2000: -1.2866, mag: 4.360 },
    { cnName: '右旗六', hip: 96392, raJ2000: 293.9614, decJ2000: -2.4557, mag: 6.980 },
    { cnName: '右旗七', hip: 96556, raJ2000: 294.4472, decJ2000: -4.6476, mag: 5.680 },
    { cnName: '右旗八', hip: 96483, raJ2000: 294.2227, decJ2000: -7.0275, mag: 4.960 },
    { cnName: '右旗九', hip: 97928, raJ2000: 298.5345, decJ2000: -8.5742, mag: 5.790 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
  ] as const,
}

const asterism_Right_Conductor: ChineseAsterism = {
  label: '右摄提',
  english: 'Right Conductor',
  type: 'sub',
  mansionIndex: 0,
  mansionLabel: '角',
  enclosure: null,
  color: '#2ECC71',
  quadrant: '东青龙',
  stars: [
    { cnName: '右摄提一', hip: 67927, raJ2000: 208.6712, decJ2000: 18.3977, mag: 2.680 },
    { cnName: '右摄提二', hip: 67275, raJ2000: 206.8156, decJ2000: 17.4569, mag: 4.490 },
    { cnName: '右摄提三', hip: 67459, raJ2000: 207.3693, decJ2000: 15.7979, mag: 4.070 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Fish: ChineseAsterism = {
  label: '鱼',
  english: 'Fish',
  type: 'sub',
  mansionIndex: 5,
  mansionLabel: '尾',
  enclosure: null,
  color: '#145A32',
  quadrant: '东青龙',
  stars: [
    { cnName: '鱼一', hip: 87616, raJ2000: 268.4782, decJ2000: -34.7527, mag: 5.960 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Palace_Guard: ChineseAsterism = {
  label: '羽林军',
  english: 'Palace Guard',
  type: 'sub',
  mansionIndex: 11,
  mansionLabel: '危',
  enclosure: null,
  color: '#154360',
  quadrant: '北玄武',
  stars: [
    { cnName: '羽林军一', hip: 108797, raJ2000: 330.6094, decJ2000: -16.9648, mag: null },
    { cnName: '羽林军二', hip: 109332, raJ2000: 332.2458, decJ2000: -18.5196, mag: 5.793 },
    { cnName: '羽林军三', hip: 109786, raJ2000: 333.5751, decJ2000: -21.0746, mag: null },
    { cnName: '羽林军四', hip: 110391, raJ2000: 335.3982, decJ2000: -21.5982, mag: 5.124 },
    { cnName: '羽林军五', hip: 110529, raJ2000: 335.8785, decJ2000: -24.7627, mag: 5.527 },
    { cnName: '羽林军六', hip: 109789, raJ2000: 333.5781, decJ2000: -27.7669, mag: 5.430 },
    { cnName: '羽林军七', hip: 110641, raJ2000: 336.1937, decJ2000: -26.8599, mag: 7.030 },
    { cnName: '羽林军八', hip: 111954, raJ2000: 340.1640, decJ2000: -27.0436, mag: 4.177 },
    { cnName: '羽林军九', hip: 112862, raJ2000: 342.8372, decJ2000: -29.5363, mag: 5.987 },
    { cnName: '羽林军十', hip: 112362, raJ2000: 341.3851, decJ2000: -25.2369, mag: 6.530 },
    { cnName: '羽林军十一', hip: 111449, raJ2000: 338.6735, decJ2000: -20.7082, mag: 5.203 },
    { cnName: '羽林军十二', hip: 112529, raJ2000: 341.8880, decJ2000: -19.6134, mag: 5.260 },
    { cnName: '羽林军十三', hip: 112211, raJ2000: 340.8968, decJ2000: -18.8304, mag: 4.690 },
    { cnName: '羽林军十四', hip: 111539, raJ2000: 338.9533, decJ2000: -17.4604, mag: 6.370 },
    { cnName: '羽林军十五', hip: 110778, raJ2000: 336.6429, decJ2000: -16.7416, mag: null },
    { cnName: '羽林军十六', hip: 111086, raJ2000: 337.5723, decJ2000: -14.5857, mag: 6.347 },
    { cnName: '羽林军十七', hip: 110602, raJ2000: 336.1127, decJ2000: -13.5294, mag: 5.752 },
    { cnName: '羽林军十八', hip: 110179, raJ2000: 334.7531, decJ2000: -13.3050, mag: 5.959 },
    { cnName: '羽林军十九', hip: 111200, raJ2000: 337.9222, decJ2000: -10.9055, mag: 6.381 },
    { cnName: '羽林军二十', hip: 111843, raJ2000: 339.8168, decJ2000: -10.0278, mag: 6.950 },
    { cnName: '羽林军二十一', hip: 112161, raJ2000: 340.7551, decJ2000: -10.1027, mag: 7.040 },
    { cnName: '羽林军二十二', hip: 112615, raJ2000: 342.1259, decJ2000: -10.5555, mag: 6.180 },
    { cnName: '羽林军二十三', hip: 113031, raJ2000: 343.3696, decJ2000: -11.6165, mag: 5.780 },
    { cnName: '羽林军二十四', hip: 112716, raJ2000: 342.3979, decJ2000: -13.5926, mag: 3.980 },
    { cnName: '羽林军二十五', hip: 112542, raJ2000: 341.9282, decJ2000: -14.0564, mag: 5.681 },
    { cnName: '羽林军二十六', hip: 113136, raJ2000: 343.6625, decJ2000: -15.8208, mag: 3.280 },
    { cnName: '羽林军二十七', hip: 113148, raJ2000: 343.6895, decJ2000: -16.2720, mag: 5.560 },
    { cnName: '羽林军二十八', hip: 114341, raJ2000: 347.3617, decJ2000: -21.1724, mag: 3.640 },
    { cnName: '羽林军二十九', hip: 114375, raJ2000: 347.4787, decJ2000: -22.4576, mag: 4.800 },
    { cnName: '羽林军三十', hip: 114119, raJ2000: 346.6702, decJ2000: -23.7430, mag: 4.470 },
    { cnName: '羽林军31', hip: 116247, raJ2000: 353.3193, decJ2000: -20.9145, mag: 4.758 },
    { cnName: '羽林军32', hip: 116118, raJ2000: 352.9252, decJ2000: -21.3695, mag: 6.239 },
    { cnName: '羽林军33', hip: 115669, raJ2000: 351.5116, decJ2000: -20.6420, mag: 4.390 },
    { cnName: '羽林军34', hip: 115438, raJ2000: 350.7426, decJ2000: -20.1006, mag: 3.980 },
    { cnName: '羽林军35', hip: 115404, raJ2000: 350.6632, decJ2000: -15.0393, mag: 5.220 },
    { cnName: '羽林军36', hip: 115125, raJ2000: 349.7773, decJ2000: -13.4553, mag: null },
    { cnName: '羽林军37', hip: 115115, raJ2000: 349.7403, decJ2000: -9.6107, mag: 5.003 },
    { cnName: '羽林军38', hip: 115033, raJ2000: 349.4759, decJ2000: -9.1825, mag: 4.400 },
    { cnName: '羽林军39', hip: 114855, raJ2000: 348.9729, decJ2000: -9.0877, mag: 4.250 },
    { cnName: '羽林军40', hip: 114164, raJ2000: 346.7988, decJ2000: -7.6946, mag: 7.370 },
    { cnName: '羽林军41', hip: 114054, raJ2000: 346.4689, decJ2000: -7.9367, mag: 6.690 },
    { cnName: '羽林军42', hip: 113996, raJ2000: 346.2911, decJ2000: -7.6939, mag: 5.470 },
    { cnName: '羽林军43', hip: 114939, raJ2000: 349.2122, decJ2000: -7.7265, mag: 5.060 },
    { cnName: '羽林军44', hip: 116758, raJ2000: 354.9461, decJ2000: -14.2222, mag: 4.977 },
    { cnName: '羽林军45', hip: 116971, raJ2000: 355.6806, decJ2000: -14.5449, mag: 4.484 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [3, 4],
    [4, 5],
    [6, 7],
    [7, 8],
    [9, 10],
    [10, 11],
    [12, 13],
    [13, 14],
    [15, 16],
    [16, 17],
    [18, 19],
    [19, 20],
    [21, 22],
    [22, 23],
    [24, 25],
    [25, 26],
    [27, 28],
    [28, 29],
    [30, 31],
    [31, 32],
    [33, 34],
    [34, 35],
    [36, 37],
    [37, 38],
    [39, 40],
    [40, 41],
    [42, 43],
    [43, 44],
  ] as const,
}

const asterism_Jade_Well: ChineseAsterism = {
  label: '玉井',
  english: 'Jade Well',
  type: 'sub',
  mansionIndex: 18,
  mansionLabel: '毕',
  enclosure: null,
  color: '#566573',
  quadrant: '西白虎',
  stars: [
    { cnName: '玉井一', hip: 23972, raJ2000: 77.2866, decJ2000: -8.7541, mag: 4.270 },
    { cnName: '玉井二', hip: 23364, raJ2000: 75.3598, decJ2000: -7.1740, mag: 4.780 },
    { cnName: '玉井三', hip: 23875, raJ2000: 76.9624, decJ2000: -5.0865, mag: 2.790 },
    { cnName: '玉井四', hip: 24674, raJ2000: 79.4016, decJ2000: -6.8444, mag: 3.590 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Maids_in_waiting: ChineseAsterism = {
  label: '御女',
  english: 'Maids-in-waiting',
  type: 'sub',
  mansionIndex: 7,
  mansionLabel: '斗',
  enclosure: null,
  color: '#5DADE2',
  quadrant: '北玄武',
  stars: [
    { cnName: '御女一', hip: 94648, raJ2000: 288.8874, decJ2000: 73.3555, mag: 4.450 },
    { cnName: '御女二', hip: 92112, raJ2000: 281.5927, decJ2000: 75.4340, mag: 5.358 },
    { cnName: '御女三', hip: 85852, raJ2000: 263.1717, decJ2000: 74.2274, mag: 6.627 },
    { cnName: '御女四', hip: 89937, raJ2000: 275.2641, decJ2000: 72.7328, mag: 3.580 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [0, 3],
  ] as const,
}

const asterism_Lunar_Star: ChineseAsterism = {
  label: '月',
  english: 'Lunar Star',
  type: 'sub',
  mansionIndex: 17,
  mansionLabel: '昴',
  enclosure: null,
  color: '#829AE3',
  quadrant: '西白虎',
  stars: [
    { cnName: '月一', hip: 19038, raJ2000: 61.1738, decJ2000: 22.0819, mag: 4.370 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Whisper_Vassal_of_Net: ChineseAsterism = {
  label: '附耳 (附毕宿)',
  english: 'Whisper (Vassal of Net)',
  type: 'sub',
  mansionIndex: 18,
  mansionLabel: '毕',
  enclosure: null,
  color: '#566573',
  quadrant: '西白虎',
  stars: [
    { cnName: '附耳 (附毕宿)一', hip: 21683, raJ2000: 69.8188, decJ2000: 15.9180, mag: 4.665 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Cloud_and_Rain: ChineseAsterism = {
  label: '云雨',
  english: 'Cloud and Rain',
  type: 'sub',
  mansionIndex: 12,
  mansionLabel: '室',
  enclosure: null,
  color: '#0B5345',
  quadrant: '北玄武',
  stars: [
    { cnName: '云雨一', hip: 115738, raJ2000: 351.7331, decJ2000: 1.2556, mag: 4.940 },
    { cnName: '云雨二', hip: 115951, raJ2000: 352.3763, decJ2000: -1.0359, mag: 6.890 },
    { cnName: '云雨三', hip: 117491, raJ2000: 357.3645, decJ2000: 1.0761, mag: 5.700 },
    { cnName: '云雨四', hip: 116928, raJ2000: 355.5117, decJ2000: 1.7800, mag: 4.510 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Zaofu: ChineseAsterism = {
  label: '造父',
  english: 'Zaofu',
  type: 'sub',
  mansionIndex: 10,
  mansionLabel: '虚',
  enclosure: null,
  color: '#1B4F72',
  quadrant: '北玄武',
  stars: [
    { cnName: '造父一', hip: 110991, raJ2000: 337.2928, decJ2000: 58.4152, mag: 3.750 },
    { cnName: '造父二', hip: 109492, raJ2000: 332.7137, decJ2000: 58.2013, mag: 3.350 },
    { cnName: '造父三', hip: 109556, raJ2000: 332.8774, decJ2000: 59.4145, mag: 5.050 },
    { cnName: '造父四', hip: 107259, raJ2000: 325.8769, decJ2000: 58.7800, mag: 4.080 },
    { cnName: '造父五', hip: 107418, raJ2000: 326.3622, decJ2000: 61.1208, mag: 4.290 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
  ] as const,
}

const asterism_Long_Wall: ChineseAsterism = {
  label: '长垣',
  english: 'Long Wall',
  type: 'sub',
  mansionIndex: 25,
  mansionLabel: '张',
  enclosure: null,
  color: '#DC7633',
  quadrant: '南朱雀',
  stars: [
    { cnName: '长垣一', hip: 51585, raJ2000: 158.0491, decJ2000: 14.1373, mag: 5.460 },
    { cnName: '长垣二', hip: 52689, raJ2000: 161.6053, decJ2000: 14.1946, mag: 5.478 },
    { cnName: '长垣三', hip: 52911, raJ2000: 162.3143, decJ2000: 10.5452, mag: 5.312 },
    { cnName: '长垣四', hip: 51775, raJ2000: 158.7001, decJ2000: 6.9538, mag: 5.070 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Grandfather: ChineseAsterism = {
  label: '丈人',
  english: 'Grandfather',
  type: 'sub',
  mansionIndex: 19,
  mansionLabel: '觜',
  enclosure: null,
  color: '#2C3E50',
  quadrant: '西白虎',
  stars: [
    { cnName: '丈人一', hip: 26634, raJ2000: 84.9123, decJ2000: -34.0741, mag: 2.650 },
    { cnName: '丈人二', hip: 25859, raJ2000: 82.8031, decJ2000: -35.4705, mag: 3.870 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Twinkling_Indicator: ChineseAsterism = {
  label: '招摇',
  english: 'Twinkling Indicator',
  type: 'sub',
  mansionIndex: 1,
  mansionLabel: '亢',
  enclosure: null,
  color: '#27AE60',
  quadrant: '东青龙',
  stars: [
    { cnName: '招摇一', hip: 71075, raJ2000: 218.0195, decJ2000: 38.3082, mag: 3.020 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Assistant_Vassal_of_Northern_Dipper: ChineseAsterism = {
  label: '辅 (附北斗)',
  english: 'Assistant (Vassal of Northern Dipper)',
  type: 'sub',
  mansionIndex: 0,
  mansionLabel: '角',
  enclosure: null,
  color: '#2ECC71',
  quadrant: '东青龙',
  stars: [
    { cnName: '辅 (附北斗)一', hip: 65477, raJ2000: 201.3064, decJ2000: 54.9880, mag: 4.010 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Executions: ChineseAsterism = {
  label: '折威',
  english: 'Executions',
  type: 'sub',
  mansionIndex: 1,
  mansionLabel: '亢',
  enclosure: null,
  color: '#27AE60',
  quadrant: '东青龙',
  stars: [
    { cnName: '折威一', hip: 69415, raJ2000: 213.1918, decJ2000: -27.2612, mag: 5.080 },
    { cnName: '折威二', hip: 71652, raJ2000: 219.8417, decJ2000: -25.0286, mag: 7.200 },
    { cnName: '折威三', hip: 71974, raJ2000: 220.8065, decJ2000: -24.9978, mag: 5.730 },
    { cnName: '折威四', hip: 72929, raJ2000: 223.5839, decJ2000: -24.6422, mag: 5.266 },
    { cnName: '折威五', hip: 73714, raJ2000: 226.0176, decJ2000: -25.2820, mag: 3.210 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
  ] as const,
}

const asterism_Battle_Chariots: ChineseAsterism = {
  label: '阵车',
  english: 'Battle Chariots',
  type: 'sub',
  mansionIndex: 2,
  mansionLabel: '氐',
  enclosure: null,
  color: '#229954',
  quadrant: '东青龙',
  stars: [
    { cnName: '阵车一', hip: 72571, raJ2000: 222.5721, decJ2000: -27.9604, mag: 4.410 },
    { cnName: '阵车二', hip: 73566, raJ2000: 225.5268, decJ2000: -28.0606, mag: 5.824 },
    { cnName: '阵车三', hip: 74857, raJ2000: 229.4577, decJ2000: -30.1487, mag: 4.330 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Right_linchpin_Vassal_of_Chariot: ChineseAsterism = {
  label: '右辖 (附轸宿)',
  english: 'Right linchpin (Vassal of Chariot)',
  type: 'sub',
  mansionIndex: 26,
  mansionLabel: '翼',
  enclosure: null,
  color: '#CA6F1E',
  quadrant: '南朱雀',
  stars: [
    { cnName: '右辖 (附轸宿)一', hip: 59199, raJ2000: 182.1034, decJ2000: -24.7289, mag: 4.010 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Weaving_Girl: ChineseAsterism = {
  label: '织女',
  english: 'Weaving Girl',
  type: 'sub',
  mansionIndex: 7,
  mansionLabel: '斗',
  enclosure: null,
  color: '#5DADE2',
  quadrant: '北玄武',
  stars: [
    { cnName: '织女一', hip: 91919, raJ2000: 281.0848, decJ2000: 39.6701, mag: null },
    { cnName: '织女二', hip: 91262, raJ2000: 279.2347, decJ2000: 38.7837, mag: 0.030 },
    { cnName: '织女三', hip: 91971, raJ2000: 281.1932, decJ2000: 37.6051, mag: 4.360 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Left_linchpin_Vassal_of_Chariot: ChineseAsterism = {
  label: '左辖 (附轸宿)',
  english: 'Left linchpin (Vassal of Chariot)',
  type: 'sub',
  mansionIndex: 26,
  mansionLabel: '翼',
  enclosure: null,
  color: '#CA6F1E',
  quadrant: '南朱雀',
  stars: [
    { cnName: '左辖 (附轸宿)一', hip: 61174, raJ2000: 188.0176, decJ2000: -16.1960, mag: 4.294 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Tripod_of_the_Zhou: ChineseAsterism = {
  label: '周鼎',
  english: 'Tripod of the Zhou',
  type: 'sub',
  mansionIndex: 27,
  mansionLabel: '轸',
  enclosure: null,
  color: '#BA4A00',
  quadrant: '南朱雀',
  stars: [
    { cnName: '周鼎一', hip: 64394, raJ2000: 197.9683, decJ2000: 27.8782, mag: 4.250 },
    { cnName: '周鼎二', hip: 63462, raJ2000: 195.0686, decJ2000: 30.7850, mag: 4.880 },
    { cnName: '周鼎三', hip: 64022, raJ2000: 196.7947, decJ2000: 27.6247, mag: 4.690 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Feudal_Kings: ChineseAsterism = {
  label: '诸王',
  english: 'Feudal Kings',
  type: 'sub',
  mansionIndex: 18,
  mansionLabel: '毕',
  enclosure: null,
  color: '#566573',
  quadrant: '西白虎',
  stars: [
    { cnName: '诸王一', hip: 27830, raJ2000: 88.3319, decJ2000: 27.6123, mag: 4.552 },
    { cnName: '诸王二', hip: 26640, raJ2000: 84.9342, decJ2000: 25.8971, mag: 5.166 },
    { cnName: '诸王三', hip: 25695, raJ2000: 82.3188, decJ2000: 25.1502, mag: 5.480 },
    { cnName: '诸王四', hip: 23900, raJ2000: 77.0276, decJ2000: 24.2652, mag: 5.500 },
    { cnName: '诸王五', hip: 23068, raJ2000: 74.4527, decJ2000: 23.9486, mag: 5.806 },
    { cnName: '诸王六', hip: 21881, raJ2000: 70.5612, decJ2000: 22.9569, mag: 4.258 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
  ] as const,
}

const asterism_Pillars_In_Net_Mansion: ChineseAsterism = {
  label: '柱 (毕宿)',
  english: 'Pillars (In Net Mansion)',
  type: 'sub',
  mansionIndex: 18,
  mansionLabel: '毕',
  enclosure: null,
  color: '#566573',
  quadrant: '西白虎',
  stars: [
    { cnName: '柱 (毕宿)一', hip: 23416, raJ2000: 75.4922, decJ2000: 43.8233, mag: 2.990 },
    { cnName: '柱 (毕宿)二', hip: 23453, raJ2000: 75.6195, decJ2000: 41.0758, mag: 3.750 },
    { cnName: '柱 (毕宿)三', hip: 23767, raJ2000: 76.6287, decJ2000: 41.2345, mag: 3.180 },
    { cnName: '柱 (毕宿)四', hip: 27639, raJ2000: 87.7602, decJ2000: 37.3056, mag: 4.740 },
    { cnName: '柱 (毕宿)五', hip: 27673, raJ2000: 87.8724, decJ2000: 39.1485, mag: 3.950 },
    { cnName: '柱 (毕宿)六', hip: 27483, raJ2000: 87.2935, decJ2000: 39.1811, mag: 4.500 },
    { cnName: '柱 (毕宿)七', hip: 25984, raJ2000: 83.1820, decJ2000: 32.1920, mag: 4.790 },
    { cnName: '柱 (毕宿)八', hip: 26536, raJ2000: 84.6587, decJ2000: 30.4924, mag: 5.406 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 0],
    [3, 4],
    [4, 5],
    [5, 3],
    [6, 7],
  ] as const,
}

const asterism_Pillars_In_Horn_Mansion: ChineseAsterism = {
  label: '柱 (角宿)',
  english: 'Pillars (In Horn Mansion)',
  type: 'sub',
  mansionIndex: 0,
  mansionLabel: '角',
  enclosure: null,
  color: '#2ECC71',
  quadrant: '东青龙',
  stars: [
    { cnName: '柱 (角宿)一', hip: 70300, raJ2000: 215.7593, decJ2000: -39.5118, mag: 4.420 },
    { cnName: '柱 (角宿)二', hip: 70090, raJ2000: 215.1393, decJ2000: -37.8853, mag: 4.034 },
    { cnName: '柱 (角宿)三', hip: 68523, raJ2000: 210.4313, decJ2000: -45.6034, mag: 4.330 },
    { cnName: '柱 (角宿)四', hip: 68282, raJ2000: 209.6698, decJ2000: -44.8036, mag: 3.870 },
    { cnName: '柱 (角宿)五', hip: 69996, raJ2000: 214.8509, decJ2000: -46.0581, mag: 3.529 },
    { cnName: '柱 (角宿)六', hip: 70574, raJ2000: 216.5343, decJ2000: -45.2214, mag: 4.553 },
    { cnName: '柱 (角宿)七', hip: 67786, raJ2000: 208.3022, decJ2000: -31.9276, mag: 4.730 },
    { cnName: '柱 (角宿)八', hip: 67669, raJ2000: 207.9567, decJ2000: -32.9941, mag: null },
    { cnName: '柱 (角宿)九', hip: 67153, raJ2000: 206.4218, decJ2000: -33.0437, mag: 4.230 },
    { cnName: '柱 (角宿)十', hip: 65109, raJ2000: 200.1492, decJ2000: -36.7123, mag: 2.730 },
  ],
  connections: [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
    [7, 8],
    [9, 9],
  ] as const,
}

const asterism_Official_of_Royal_Archives: ChineseAsterism = {
  label: '柱史',
  english: 'Official of Royal Archives',
  type: 'sub',
  mansionIndex: 7,
  mansionLabel: '斗',
  enclosure: null,
  color: '#5DADE2',
  quadrant: '北玄武',
  stars: [
    { cnName: '柱史一', hip: 89908, raJ2000: 275.1893, decJ2000: 71.3378, mag: 4.220 },
  ],
  connections: [
    [0, 0],
  ] as const,
}

const asterism_Son: ChineseAsterism = {
  label: '子',
  english: 'Son',
  type: 'sub',
  mansionIndex: 19,
  mansionLabel: '觜',
  enclosure: null,
  color: '#2C3E50',
  quadrant: '西白虎',
  stars: [
    { cnName: '子一', hip: 27810, raJ2000: 88.2787, decJ2000: -33.8014, mag: 4.870 },
    { cnName: '子二', hip: 27628, raJ2000: 87.7400, decJ2000: -35.7683, mag: 3.120 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Patriarchal_Clan: ChineseAsterism = {
  label: '宗',
  english: 'Patriarchal Clan',
  type: 'sub',
  mansionIndex: 7,
  mansionLabel: '斗',
  enclosure: null,
  color: '#5DADE2',
  quadrant: '北玄武',
  stars: [
    { cnName: '宗一', hip: 92043, raJ2000: 281.4155, decJ2000: 20.5463, mag: 4.190 },
    { cnName: '宗二', hip: 92161, raJ2000: 281.7551, decJ2000: 18.1815, mag: 4.360 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Official_of_Religious_Ceremonies: ChineseAsterism = {
  label: '宗人',
  english: 'Official of Religious Ceremonies',
  type: 'sub',
  mansionIndex: 5,
  mansionLabel: '尾',
  enclosure: null,
  color: '#145A32',
  quadrant: '东青龙',
  stars: [
    { cnName: '宗人一', hip: 88149, raJ2000: 270.0658, decJ2000: 4.3686, mag: 4.600 },
    { cnName: '宗人二', hip: 88192, raJ2000: 270.1613, decJ2000: 2.9316, mag: 3.930 },
    { cnName: '宗人三', hip: 88290, raJ2000: 270.4383, decJ2000: 1.3051, mag: 4.429 },
    { cnName: '宗人四', hip: 88601, raJ2000: 271.3637, decJ2000: 2.5001, mag: 4.030 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
  ] as const,
}

const asterism_Official_for_the_Royal_Clan: ChineseAsterism = {
  label: '宗正',
  english: 'Official for the Royal Clan',
  type: 'sub',
  mansionIndex: 5,
  mansionLabel: '尾',
  enclosure: null,
  color: '#145A32',
  quadrant: '东青龙',
  stars: [
    { cnName: '宗正一', hip: 86742, raJ2000: 265.8681, decJ2000: 4.5673, mag: 2.750 },
    { cnName: '宗正二', hip: 87108, raJ2000: 266.9732, decJ2000: 2.7073, mag: 3.750 },
  ],
  connections: [
    [0, 1],
  ] as const,
}

const asterism_Official_in_Charge_of_the_Forest: ChineseAsterism = {
  label: '左更',
  english: 'Official in Charge of the Forest',
  type: 'sub',
  mansionIndex: 16,
  mansionLabel: '胃',
  enclosure: null,
  color: '#AEB6BF',
  quadrant: '西白虎',
  stars: [
    { cnName: '左更一', hip: 12332, raJ2000: 39.7041, decJ2000: 21.9614, mag: 5.451 },
    { cnName: '左更二', hip: 12640, raJ2000: 40.5914, decJ2000: 20.0115, mag: 5.740 },
    { cnName: '左更三', hip: 12803, raJ2000: 41.1374, decJ2000: 15.3119, mag: 5.777 },
    { cnName: '左更四', hip: 13327, raJ2000: 42.8733, decJ2000: 15.0821, mag: 5.516 },
    { cnName: '左更五', hip: 13165, raJ2000: 42.3232, decJ2000: 17.4643, mag: null },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
  ] as const,
}

const asterism_Left_Flag: ChineseAsterism = {
  label: '左旗',
  english: 'Left Flag',
  type: 'sub',
  mansionIndex: 7,
  mansionLabel: '斗',
  enclosure: null,
  color: '#5DADE2',
  quadrant: '北玄武',
  stars: [
    { cnName: '左旗一', hip: 96757, raJ2000: 295.0241, decJ2000: 18.0139, mag: 4.380 },
    { cnName: '左旗二', hip: 96837, raJ2000: 295.2622, decJ2000: 17.4760, mag: 4.380 },
    { cnName: '左旗三', hip: 97365, raJ2000: 296.8469, decJ2000: 18.5343, mag: 3.810 },
    { cnName: '左旗四', hip: 97496, raJ2000: 297.2444, decJ2000: 19.1420, mag: 5.034 },
    { cnName: '左旗五', hip: 98337, raJ2000: 299.6893, decJ2000: 19.4921, mag: 3.470 },
    { cnName: '左旗六', hip: 98438, raJ2000: 300.0138, decJ2000: 17.5165, mag: 5.350 },
    { cnName: '左旗七', hip: 98234, raJ2000: 299.4394, decJ2000: 16.7892, mag: 5.534 },
    { cnName: '左旗八', hip: 98754, raJ2000: 300.8751, decJ2000: 16.0313, mag: 5.658 },
    { cnName: '左旗九', hip: 99742, raJ2000: 303.5692, decJ2000: 15.1976, mag: 4.946 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
  ] as const,
}

const asterism_Left_Conductor: ChineseAsterism = {
  label: '左摄提',
  english: 'Left Conductor',
  type: 'sub',
  mansionIndex: 1,
  mansionLabel: '亢',
  enclosure: null,
  color: '#27AE60',
  quadrant: '东青龙',
  stars: [
    { cnName: '左摄提一', hip: 72125, raJ2000: 221.3103, decJ2000: 16.9643, mag: 4.600 },
    { cnName: '左摄提二', hip: 71762, raJ2000: 220.1815, decJ2000: 16.4183, mag: 4.893 },
    { cnName: '左摄提三', hip: 71795, raJ2000: 220.2873, decJ2000: 13.7283, mag: 3.780 },
  ],
  connections: [
    [0, 1],
    [1, 2],
  ] as const,
}

const asterism_Seat_Flags: ChineseAsterism = {
  label: '座旗',
  english: 'Seat Flags',
  type: 'sub',
  mansionIndex: 20,
  mansionLabel: '参',
  enclosure: null,
  color: '#1C2833',
  quadrant: '西白虎',
  stars: [
    { cnName: '座旗一', hip: 32562, raJ2000: 101.9149, decJ2000: 48.7895, mag: 5.216 },
    { cnName: '座旗二', hip: 33485, raJ2000: 104.4046, decJ2000: 45.0941, mag: 4.893 },
    { cnName: '座旗三', hip: 32173, raJ2000: 100.7707, decJ2000: 44.5244, mag: 5.020 },
    { cnName: '座旗四', hip: 32480, raJ2000: 101.6847, decJ2000: 43.5774, mag: null },
    { cnName: '座旗五', hip: 31832, raJ2000: 99.8326, decJ2000: 42.4889, mag: 4.820 },
    { cnName: '座旗六', hip: 32844, raJ2000: 102.6914, decJ2000: 41.7812, mag: 4.975 },
    { cnName: '座旗七', hip: 31789, raJ2000: 99.7049, decJ2000: 39.9026, mag: 5.331 },
    { cnName: '座旗八', hip: 31771, raJ2000: 99.6647, decJ2000: 39.3909, mag: 5.690 },
    { cnName: '座旗九', hip: 33041, raJ2000: 103.2559, decJ2000: 38.8691, mag: 6.099 },
  ],
  connections: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
  ] as const,
}

export const CHINESE_ASTERISMS: readonly ChineseAsterism[] = [
  asterism_Net,
  asterism_Wall,
  asterism_Three_Stars,
  asterism_Root,
  asterism_Dipper,
  asterism_Room,
  asterism_Ghosts,
  asterism_Winnowing_Basket,
  asterism_Horn,
  asterism_Well,
  asterism_Neck,
  asterism_Legs,
  asterism_Willow,
  asterism_Bond,
  asterism_Hairy_Head,
  asterism_Ox,
  asterism_Girl,
  asterism_Encampment,
  asterism_Supreme_Palace_Right_Wall,
  asterism_Supreme_Palace_Left_Wall,
  asterism_Heavenly_Market_Right_Wall,
  asterism_Heavenly_Market_Left_Wall,
  asterism_Rooftop,
  asterism_Tail,
  asterism_Stomach,
  asterism_Heart,
  asterism_Star,
  asterism_Emptiness,
  asterism_Wings,
  asterism_Extended_Net,
  asterism_Chariot,
  asterism_Purple_Forbidden_Right_Wall,
  asterism_Purple_Forbidden_Left_Wall,
  asterism_Turtle_Beak,
  asterism_Eight_Kinds_of_Crops,
  asterism_Net_for_Catching_Birds,
  asterism_Rotten_Gourd,
  asterism_Decayed_Mortar,
  asterism_Northern_Dipper,
  asterism_North_River,
  asterism_Northern_Pole,
  asterism_North_Gate_of_the_Military_Camp,
  asterism_River_Turtle,
  asterism_Persia,
  asterism_Textile_Ruler,
  asterism_Banner_of_Three_Stars,
  asterism_Toilet,
  asterism_Whip,
  asterism_Royal_Guards,
  asterism_Big_Yard_for_Chariots,
  asterism_Chariots_and_Cavalry,
  asterism_Commodity_Market,
  asterism_Hay,
  asterism_Pestle_In_Winnowing_Basket_Mansion,
  asterism_Pestle_In_Rooftop_Mansion,
  asterism_Changsha_Vassal_of_Chariot,
  asterism_Guest_House,
  asterism_Retinue_In_Room_Mansion,
  asterism_Retinue_In_Supreme_Palace_Enclosure,
  asterism_Great_Horn,
  asterism_Chief_Judge,
  asterism_Mausoleum,
  asterism_Celestial_Temple,
  asterism_Mattress_of_the_Emperor,
  asterism_Emperor_s_Seat,
  asterism_Eastern_Door,
  asterism_Dipper_for_Liquids,
  asterism_Trials,
  asterism_Send_Armed_Forces_To_Suppress_Vassal_of_Three_Stars,
  asterism_Punishment,
  asterism_Flying_Fish,
  asterism_Tomb_Vassal_of_Rooftop,
  asterism_Axe,
  asterism_Sickle,
  asterism_Basket_for_Mulberry_Leaves,
  asterism_White_Patched_Nearby,
  asterism_Auxiliary_Road,
  asterism_Fu_Yue,
  asterism_Roofing,
  asterism_Canopy_Support_Vassal_of_Canopy_of_the_Emperor,
  asterism_Flying_Corridor,
  asterism_Celestial_Lance,
  asterism_Curved_Array,
  asterism_Lock_Vassal_of_Room,
  asterism_Dog,
  asterism_Territory_of_Dog,
  asterism_Coiled_Thong,
  asterism_Beacon_Fire,
  asterism_Tortoise,
  asterism_Sea_and_Mountain,
  asterism_Sea_Rock,
  asterism_Military_Gate,
  asterism_Drum_at_the_River,
  asterism_Crane,
  asterism_Railings,
  asterism_Astrologer,
  asterism_Bow_and_Arrow,
  asterism_Dipper_for_Solids,
  asterism_Emperor_s_Bodyguard,
  asterism_Good_Gourd,
  asterism_Canopy_of_the_Emperor,
  asterism_Eunuch_Official,
  asterism_Firebird,
  asterism_Cumulative_Corpses,
  asterism_Stored_water,
  asterism_Pile_of_Firewood,
  asterism_Group_of_Soldiers,
  asterism_White_Patches_Attached,
  asterism_Establishment,
  asterism_Clepsydra_Terrace,
  asterism_Door_Bolt,
  asterism_Goldfish,
  asterism_Recommending_Virtuous_Men,
  asterism_Accumulated_Water,
  asterism_Nine_Water_Wells,
  asterism_Nine_Senior_Officers,
  asterism_Imperial_Military_Flag,
  asterism_Interpreters_of_Nine_Dialects,
  asterism_Banner_of_Wine_Shop,
  asterism_Mortar,
  asterism_Rolled_Tongue,
  asterism_Military_Well,
  asterism_Southern_Military_Gate,
  asterism_Market_for_Soldiers,
  asterism_Chaff,
  asterism_Boats_and_Lake,
  asterism_Peafowl,
  asterism_Crying,
  asterism_Arsenal,
  asterism_Captain_of_the_Bodyguards,
  asterism_Officers_of_the_Imperial_Guard,
  asterism_Old_Man,
  asterism_Thunder_and_Lightning,
  asterism_Line_of_Ramparts,
  asterism_Resting_Palace_Vassal_of_Encampment,
  asterism_Jade_Ornament_on_Ladies_Wear,
  asterism_Pearls_on_Ladies_Wear,
  asterism_Whetstone,
  asterism_Jewel_Market,
  asterism_Astronomical_Observatory,
  asterism_Six_Jia,
  asterism_Network_of_Dykes,
  asterism_Horse_s_Abdomen,
  asterism_Horse_s_Tail,
  asterism_Bee,
  asterism_The_Hall_of_Glory,
  asterism_Southern_Boat,
  asterism_South_River,
  asterism_Dongou,
  asterism_Southern_Gate,
  asterism_Inner_Kitchen,
  asterism_Inner_Steps,
  asterism_High_Judge,
  asterism_Inner_Screen,
  asterism_Imperial_Passageway,
  asterism_Bird_s_Beak,
  asterism_Peasant,
  asterism_Woman_s_Bed,
  asterism_Female_Protocol,
  asterism_Thunderbolt,
  asterism_Judging,
  asterism_Flat_Road,
  asterism_Screen,
  asterism_Seven_Excellencies,
  asterism_House_for_Musical_Instruments,
  asterism_Imperial_Guards,
  asterism_Chariots_and_Cavalry_General,
  asterism_Weeping,
  asterism_Celestial_Cereals,
  asterism_Green_Hill,
  asterism_Palace_Gate,
  asterism_Humans,
  asterism_Solar_Star,
  asterism_Three_Excellencies_In_Supreme_Palace_Enclosure,
  asterism_Three_Excellencies_In_Purple_Forbidden_Enclosure,
  asterism_Triangle,
  asterism_Three_Top_Instructors,
  asterism_Three_Steps,
  asterism_Royal_Secretary,
  asterism_Junior_Officers,
  asterism_Snake_s_Abdomen,
  asterism_Snake_s_Head,
  asterism_Snake_s_Tail,
  asterism_Changing_Room_Vassal_of_Tail,
  asterism_Twelve_States,
  asterism_Cross,
  asterism_Excrement,
  asterism_Municipal_Office,
  asterism_Eunuch,
  asterism_Official_for_Irrigation,
  asterism_Crooked_Running_Water,
  asterism_Water_Level,
  asterism_Deified_Judge_of_Right_and_Wrong,
  asterism_Deity_in_Charge_of_Monsters,
  asterism_Deified_Judge_of_Rank,
  asterism_Deified_Judge_of_Life,
  asterism_Deified_Judge_of_Disaster_and_Good_Fortune,
  asterism_Four_Channels,
  asterism_Four_Advisors,
  asterism_Grandson,
  asterism_Guard_of_the_Sun,
  asterism_First_Great_One,
  asterism_Crown_Prince,
  asterism_Royals,
  asterism_Flying_Serpent,
  asterism_Celestial_Concave,
  asterism_Celestial_Flail,
  asterism_Market_Officer,
  asterism_Square_Celestial_Granary,
  asterism_Celestial_Slander,
  asterism_Celestial_Kitchen,
  asterism_Celestial_Boat,
  asterism_Celestial_Bed,
  asterism_Great_General_of_Heaven,
  asterism_Celestial_Drumstick,
  asterism_Celestial_Spokes,
  asterism_Materials_for_Making_Tents,
  asterism_Celestial_High_Terrace,
  asterism_Celestial_Hook,
  asterism_Celestial_Dog,
  asterism_Celestial_Pass,
  asterism_Great_Emperor_of_Heaven,
  asterism_Celestial_Pier,
  asterism_Celestial_Pigsty,
  asterism_Celestial_Cock,
  asterism_Judge_for_Estimating_the_Age_of_Animals,
  asterism_Celestial_Discipline,
  asterism_Celestial_River,
  asterism_Celestial_Street,
  asterism_Celestial_Tally,
  asterism_Celestial_Ford,
  asterism_Celestial_Stable,
  asterism_Celestial_Wolf,
  asterism_Celestial_Prison,
  asterism_Celestial_Ramparts,
  asterism_Judge_for_Nobility,
  asterism_Celestial_Foodstuff,
  asterism_Celestial_Gate,
  asterism_Celestial_Money,
  asterism_Celestial_Spear,
  asterism_Circular_Celestial_Granary,
  asterism_Celestial_Milk,
  asterism_Celestial_Earth_God_s_Temple,
  asterism_Celestial_Farmland_In_Horn_Mansion,
  asterism_Celestial_Farmland_In_Ox_Mansion,
  asterism_Celestial_Premier,
  asterism_Celestial_Great_One,
  asterism_Celestial_Yin_Force,
  asterism_Ricks_of_Grain,
  asterism_Celestial_Spring,
  asterism_Celestial_Orchard,
  asterism_Celestial_Meadows,
  asterism_Celestial_Keyhole,
  asterism_Celestial_Pillar,
  asterism_Celestial_Wine_Cup,
  asterism_Butcher_s_Shops,
  asterism_Official_for_Earthworks_and_Buildings,
  asterism_Official_for_Materials_Supply,
  asterism_Master_of_Constructions,
  asterism_Outer_Kitchen,
  asterism_Outer_Fence,
  asterism_Wang_Liang,
  asterism_Master_of_Constructions_In_Legs_Mansion,
  asterism_Administrative_Center,
  asterism_Five_Chariots,
  asterism_Interior_Seats_of_the_Five_Emperors,
  asterism_Seats_of_the_Five_Emperors,
  asterism_Five_Feudal_Kings,
  asterism_Five_Lords,
  asterism_Western_Door,
  asterism_Xi_Zhong,
  asterism_Pool_of_Harmony,
  asterism_Prime_Minister,
  asterism_Little_Dipper,
  asterism_Officer_of_Honour,
  asterism_Temple,
  asterism_Xuanyuan,
  asterism_Sombre_Lance,
  asterism_Battle_Axe_Vassal_of_Well,
  asterism_Gate_of_Yang,
  asterism_Wild_Cockerel,
  asterism_Usher_to_the_Court,
  asterism_Exotic_Bird,
  asterism_Hidden_Virtue,
  asterism_Official_in_Charge_of_Pasturing,
  asterism_Right_Flag,
  asterism_Right_Conductor,
  asterism_Fish,
  asterism_Palace_Guard,
  asterism_Jade_Well,
  asterism_Maids_in_waiting,
  asterism_Lunar_Star,
  asterism_Whisper_Vassal_of_Net,
  asterism_Cloud_and_Rain,
  asterism_Zaofu,
  asterism_Long_Wall,
  asterism_Grandfather,
  asterism_Twinkling_Indicator,
  asterism_Assistant_Vassal_of_Northern_Dipper,
  asterism_Executions,
  asterism_Battle_Chariots,
  asterism_Right_linchpin_Vassal_of_Chariot,
  asterism_Weaving_Girl,
  asterism_Left_linchpin_Vassal_of_Chariot,
  asterism_Tripod_of_the_Zhou,
  asterism_Feudal_Kings,
  asterism_Pillars_In_Net_Mansion,
  asterism_Pillars_In_Horn_Mansion,
  asterism_Official_of_Royal_Archives,
  asterism_Son,
  asterism_Patriarchal_Clan,
  asterism_Official_of_Religious_Ceremonies,
  asterism_Official_for_the_Royal_Clan,
  asterism_Official_in_Charge_of_the_Forest,
  asterism_Left_Flag,
  asterism_Left_Conductor,
  asterism_Seat_Flags,
] as const

/** 二十八宿英文名→索引映射 */
export const MANSION_ENGLISH_NAMES: Record<string, number> = {
  'Net': 18,
  'Wall': 13,
  'Three Stars': 20,
  'Root': 2,
  'Dipper': 7,
  'Room': 3,
  'Ghosts': 22,
  'Winnowing Basket': 6,
  'Horn': 0,
  'Well': 21,
  'Neck': 1,
  'Legs': 14,
  'Willow': 23,
  'Bond': 15,
  'Hairy Head': 17,
  'Ox': 8,
  'Girl': 9,
  'Encampment': 12,
  'Rooftop': 11,
  'Tail': 5,
  'Stomach': 16,
  'Heart': 4,
  'Star': 24,
  'Emptiness': 10,
  'Wings': 26,
  'Extended Net': 25,
  'Chariot': 27,
  'Turtle Beak': 19,
}

/** 按宿索引分组的星官 */
export const ASTERISMS_BY_MANSION: ChineseAsterism[][] = (() => {
  const groups: ChineseAsterism[][] = Array.from({ length: 28 }, () => [])
  for (const a of CHINESE_ASTERISMS) {
    if (a.mansionIndex >= 0 && a.mansionIndex < 28) groups[a.mansionIndex]!.push(a)
  }
  return groups
})()