/**
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

const 角: MansionAsterism = {
  label: '角',
  quadrant: '东青龙',
  color: '#2ECC71',
  stars: [
    { cnName: '角宿一', bayer: 'HIP 65474', raJ2000: 201.2982, decJ2000: -11.1613, mag: 0.97 },
    { cnName: '角宿二', bayer: 'HIP 66249', raJ2000: 203.6733, decJ2000: -0.5958, mag: 3.38 }
  ],
  connections: [[0, 1]]
}

const 亢: MansionAsterism = {
  label: '亢',
  quadrant: '东青龙',
  color: '#27AE60',
  stars: [
    { cnName: '亢宿一', bayer: 'HIP 69427', raJ2000: 213.2239, decJ2000: -10.2737, mag: 4.21 },
    { cnName: '亢宿二', bayer: 'HIP 69701', raJ2000: 214.0036, decJ2000: -6.0005, mag: 4.08 },
    { cnName: '亢宿三', bayer: 'HIP 70755', raJ2000: 217.0506, decJ2000: -2.2280, mag: 4.84 },
    { cnName: '亢宿四', bayer: 'HIP 69974', raJ2000: 214.7775, decJ2000: -13.3711, mag: 4.52 }
  ],
  connections: [[0, 1], [1, 2], [0, 3]]
}

const 氐: MansionAsterism = {
  label: '氐',
  quadrant: '东青龙',
  color: '#229954',
  stars: [
    { cnName: '氐宿一', bayer: 'HIP 72622', raJ2000: 222.7196, decJ2000: -16.0418, mag: 2.75 },
    { cnName: '氐宿二', bayer: 'HIP 74392', raJ2000: 228.0554, decJ2000: -19.7917, mag: 4.54 },
    { cnName: '氐宿三', bayer: 'HIP 76333', raJ2000: 233.8816, decJ2000: -14.7895, mag: 3.91 },
    { cnName: '氐宿四', bayer: 'HIP 74785', raJ2000: 229.2517, decJ2000: -9.3829, mag: 2.62 }
  ],
  connections: [[0, 1], [1, 2], [2, 3]]
}

const 房: MansionAsterism = {
  label: '房',
  quadrant: '东青龙',
  color: '#1D8348',
  stars: [
    { cnName: '房宿一', bayer: 'HIP 78820', raJ2000: 241.3593, decJ2000: -19.8055, mag: 2.62 },
    { cnName: '房宿二', bayer: 'HIP 78401', raJ2000: 240.0834, decJ2000: -22.6217, mag: 2.32 },
    { cnName: '房宿三', bayer: 'HIP 78265', raJ2000: 239.7130, decJ2000: -26.1141, mag: 2.91 },
    { cnName: '房宿四', bayer: 'HIP 78104', raJ2000: 239.2212, decJ2000: -29.2141, mag: 3.86 }
  ],
  connections: [[0, 1], [1, 2], [2, 3]]
}

const 心: MansionAsterism = {
  label: '心',
  quadrant: '东青龙',
  color: '#196F3D',
  stars: [
    { cnName: '心宿一', bayer: 'HIP 80112', raJ2000: 245.2971, decJ2000: -25.5928, mag: 2.89 },
    { cnName: '心宿二', bayer: 'HIP 80763', raJ2000: 247.3519, decJ2000: -26.4320, mag: 0.91 },
    { cnName: '心宿三', bayer: 'HIP 81266', raJ2000: 248.9706, decJ2000: -28.2160, mag: 2.81 }
  ],
  connections: [[0, 1], [1, 2]]
}

const 尾: MansionAsterism = {
  label: '尾',
  quadrant: '东青龙',
  color: '#145A32',
  stars: [
    { cnName: '尾宿一', bayer: 'HIP 82396', raJ2000: 252.5409, decJ2000: -34.2932, mag: 2.29 },
    { cnName: '尾宿二', bayer: 'HIP 82514', raJ2000: 252.9676, decJ2000: -38.0474, mag: 2.98 },
    { cnName: '尾宿三', bayer: 'HIP 82671', raJ2000: 253.4989, decJ2000: -42.3620, mag: 4.79 },
    { cnName: '尾宿四', bayer: 'HIP 84143', raJ2000: 258.0383, decJ2000: -43.2392, mag: 3.33 },
    { cnName: '尾宿五', bayer: 'HIP 86228', raJ2000: 264.3297, decJ2000: -42.9978, mag: 1.85 },
    { cnName: '尾宿六', bayer: 'HIP 87073', raJ2000: 266.8962, decJ2000: -40.1270, mag: 2.992 },
    { cnName: '尾宿七', bayer: 'HIP 86670', raJ2000: 265.6220, decJ2000: -39.0300, mag: 2.386 },
    { cnName: '尾宿八', bayer: 'HIP 85927', raJ2000: 263.4022, decJ2000: -37.1038, mag: 1.63 },
    { cnName: '尾宿九', bayer: 'HIP 85696', raJ2000: 262.6910, decJ2000: -37.2958, mag: 2.65 },
    { cnName: '尾宿十', bayer: 'HIP 82545', raJ2000: 253.0839, decJ2000: -38.0175, mag: 3.542 }
  ],
  connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [1, 9]]
}

const 箕: MansionAsterism = {
  label: '箕',
  quadrant: '东青龙',
  color: '#0E6251',
  stars: [
    { cnName: '箕宿一', bayer: 'HIP 88635', raJ2000: 271.4520, decJ2000: -30.4241, mag: 2.99 },
    { cnName: '箕宿二', bayer: 'HIP 89931', raJ2000: 275.2485, decJ2000: -29.8281, mag: 2.668 },
    { cnName: '箕宿三', bayer: 'HIP 90185', raJ2000: 276.0430, decJ2000: -34.3846, mag: 1.81 },
    { cnName: '箕宿四', bayer: 'HIP 89642', raJ2000: 274.4068, decJ2000: -36.7617, mag: 3.11 }
  ],
  connections: [[0, 1], [1, 2], [2, 3]]
}

const 斗: MansionAsterism = {
  label: '斗',
  quadrant: '北玄武',
  color: '#5DADE2',
  stars: [
    { cnName: '斗宿一', bayer: 'HIP 89341', raJ2000: 273.4409, decJ2000: -21.0588, mag: 3.85 },
    { cnName: '斗宿二', bayer: 'HIP 90496', raJ2000: 276.9927, decJ2000: -25.4217, mag: 2.81 },
    { cnName: '斗宿三', bayer: 'HIP 92041', raJ2000: 281.4141, decJ2000: -26.9908, mag: 3.14 },
    { cnName: '斗宿四', bayer: 'HIP 92855', raJ2000: 283.8164, decJ2000: -26.2967, mag: 2.067 },
    { cnName: '斗宿五', bayer: 'HIP 93864', raJ2000: 286.7350, decJ2000: -27.6704, mag: 3.31 },
    { cnName: '斗宿六', bayer: 'HIP 93506', raJ2000: 285.6530, decJ2000: -29.8801, mag: 2.59 }
  ],
  connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]]
}

const 牛: MansionAsterism = {
  label: '牛',
  quadrant: '北玄武',
  color: '#3498DB',
  stars: [
    { cnName: '牛宿一', bayer: 'HIP 100345', raJ2000: 305.2528, decJ2000: -14.7814, mag: 3.08 },
    { cnName: '牛宿二', bayer: 'HIP 100064', raJ2000: 304.5136, decJ2000: -12.5449, mag: 3.58 },
    { cnName: '牛宿三', bayer: 'HIP 99572', raJ2000: 303.1078, decJ2000: -12.6175, mag: 5.85 },
    { cnName: '牛宿四', bayer: 'HIP 100881', raJ2000: 306.8300, decJ2000: -18.2117, mag: 5.14 },
    { cnName: '牛宿五', bayer: 'HIP 101123', raJ2000: 307.4746, decJ2000: -18.5832, mag: 5.897 },
    { cnName: '牛宿六', bayer: 'HIP 101027', raJ2000: 307.2151, decJ2000: -17.8137, mag: 5.5 }
  ],
  connections: [[0, 1], [1, 2], [0, 3], [3, 4], [4, 5], [3, 5]]
}

const 女: MansionAsterism = {
  label: '女',
  quadrant: '北玄武',
  color: '#2874A6',
  stars: [
    { cnName: '女宿一', bayer: 'HIP 102618', raJ2000: 311.9190, decJ2000: -9.4958, mag: 3.77 },
    { cnName: '女宿二', bayer: 'HIP 103045', raJ2000: 313.1635, decJ2000: -8.9833, mag: 4.72 },
    { cnName: '女宿三', bayer: 'HIP 102945', raJ2000: 312.8573, decJ2000: -5.6266, mag: 6.07 },
    { cnName: '女宿四', bayer: 'HIP 102624', raJ2000: 311.9343, decJ2000: -5.0277, mag: 4.44 }
  ],
  connections: [[0, 1], [1, 2], [2, 3]]
}

const 虚: MansionAsterism = {
  label: '虚',
  quadrant: '北玄武',
  color: '#1B4F72',
  stars: [
    { cnName: '虚宿一', bayer: 'HIP 106278', raJ2000: 322.8897, decJ2000: -5.5712, mag: 2.89 },
    { cnName: '虚宿二', bayer: 'HIP 104987', raJ2000: 318.9560, decJ2000: 5.2479, mag: 3.933 }
  ],
  connections: [[0, 1]]
}

const 危: MansionAsterism = {
  label: '危',
  quadrant: '北玄武',
  color: '#154360',
  stars: [
    { cnName: '危宿一', bayer: 'HIP 109074', raJ2000: 331.4460, decJ2000: -0.3199, mag: 2.94 },
    { cnName: '危宿二', bayer: 'HIP 109427', raJ2000: 332.5500, decJ2000: 6.1979, mag: 3.55 },
    { cnName: '危宿三', bayer: 'HIP 107315', raJ2000: 326.0465, decJ2000: 9.8750, mag: 2.39 }
  ],
  connections: [[0, 1], [1, 2]]
}

const 室: MansionAsterism = {
  label: '室',
  quadrant: '北玄武',
  color: '#0B5345',
  stars: [
    { cnName: '室宿一', bayer: 'HIP 113963', raJ2000: 346.1902, decJ2000: 15.2053, mag: 2.48 },
    { cnName: '室宿二', bayer: 'HIP 113881', raJ2000: 345.9436, decJ2000: 28.0828, mag: 2.42 }
  ],
  connections: [[0, 1]]
}

const 壁: MansionAsterism = {
  label: '壁',
  quadrant: '北玄武',
  color: '#0E6251',
  stars: [
    { cnName: '壁宿一', bayer: 'HIP 1067', raJ2000: 3.3090, decJ2000: 15.1836, mag: 2.84 },
    { cnName: '壁宿二', bayer: 'HIP 677', raJ2000: 2.0969, decJ2000: 29.0904, mag: 2.06 }
  ],
  connections: [[0, 1]]
}

const 奎: MansionAsterism = {
  label: '奎',
  quadrant: '西白虎',
  color: '#D4AF37',
  stars: [
    { cnName: '奎宿一', bayer: 'HIP 4463', raJ2000: 14.3017, decJ2000: 23.4177, mag: 4.42 },
    { cnName: '奎宿二', bayer: 'HIP 3693', raJ2000: 11.8347, decJ2000: 24.2672, mag: 4.06 },
    { cnName: '奎宿三', bayer: 'HIP 3885', raJ2000: 12.4715, decJ2000: 27.7103, mag: 5.5 },
    { cnName: '奎宿四', bayer: 'HIP 3031', raJ2000: 9.6389, decJ2000: 29.3118, mag: 4.38 },
    { cnName: '奎宿五', bayer: 'HIP 3092', raJ2000: 9.8317, decJ2000: 30.8610, mag: 3.28 },
    { cnName: '奎宿六', bayer: 'HIP 2912', raJ2000: 9.2202, decJ2000: 33.7193, mag: 4.36 },
    { cnName: '奎宿七', bayer: 'HIP 3881', raJ2000: 12.4535, decJ2000: 41.0789, mag: 4.53 },
    { cnName: '奎宿八', bayer: 'HIP 4436', raJ2000: 14.1884, decJ2000: 38.4993, mag: 3.87 },
    { cnName: '奎宿九', bayer: 'HIP 5447', raJ2000: 17.4330, decJ2000: 35.6206, mag: 2.05 },
    { cnName: '奎宿十', bayer: 'HIP 5175', raJ2000: 16.5467, decJ2000: 32.1815, mag: 6.26 },
    { cnName: '奎宿十一', bayer: 'HIP 5586', raJ2000: 17.9151, decJ2000: 30.0896, mag: 4.511 },
    { cnName: '奎宿十二', bayer: 'HIP 6315', raJ2000: 20.2807, decJ2000: 28.7382, mag: 5.223 },
    { cnName: '奎宿十三', bayer: 'HIP 6193', raJ2000: 19.8666, decJ2000: 27.2641, mag: 4.748 },
    { cnName: '奎宿十四', bayer: 'HIP 5742', raJ2000: 18.4373, decJ2000: 24.5837, mag: 4.66 },
    { cnName: '奎宿十五', bayer: 'HIP 5571', raJ2000: 17.8634, decJ2000: 21.0346, mag: 4.658 },
    { cnName: '奎宿十六', bayer: 'HIP 5131', raJ2000: 16.4206, decJ2000: 21.4732, mag: 5.273 }
  ],
  connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15], [15, 0]]
}

const 娄: MansionAsterism = {
  label: '娄',
  quadrant: '西白虎',
  color: '#BCC6CC',
  stars: [
    { cnName: '娄宿一', bayer: 'HIP 9884', raJ2000: 31.7934, decJ2000: 23.4624, mag: 2.01 },
    { cnName: '娄宿二', bayer: 'HIP 8903', raJ2000: 28.6600, decJ2000: 20.8080, mag: 2.65 },
    { cnName: '娄宿三', bayer: 'HIP 8832', raJ2000: 28.3826, decJ2000: 19.2939, mag: 5.5 }
  ],
  connections: [[0, 1], [1, 2]]
}

const 胃: MansionAsterism = {
  label: '胃',
  quadrant: '西白虎',
  color: '#AEB6BF',
  stars: [
    { cnName: '胃宿一', bayer: 'HIP 12719', raJ2000: 40.8630, decJ2000: 27.7071, mag: 4.67 },
    { cnName: '胃宿二', bayer: 'HIP 13061', raJ2000: 41.9773, decJ2000: 29.2471, mag: 4.51 },
    { cnName: '胃宿三', bayer: 'HIP 13209', raJ2000: 42.4960, decJ2000: 27.2605, mag: 3.594 }
  ],
  connections: [[0, 1], [1, 2]]
}

const 昴: MansionAsterism = {
  label: '昴',
  quadrant: '西白虎',
  color: '#829AE3',
  stars: [
    { cnName: '昴宿一', bayer: 'HIP 17499', raJ2000: 56.2189, decJ2000: 24.1133, mag: 3.7 },
    { cnName: '昴宿二', bayer: 'HIP 17531', raJ2000: 56.3021, decJ2000: 24.4673, mag: 4.3 },
    { cnName: '昴宿三', bayer: 'HIP 17579', raJ2000: 56.4770, decJ2000: 24.5545, mag: 5.76 },
    { cnName: '昴宿四', bayer: 'HIP 17573', raJ2000: 56.4567, decJ2000: 24.3677, mag: 3.87 },
    { cnName: '昴宿五', bayer: 'HIP 17608', raJ2000: 56.5816, decJ2000: 23.9484, mag: 4.18 },
    { cnName: '昴宿六', bayer: 'HIP 17702', raJ2000: 56.8712, decJ2000: 24.1051, mag: 2.87 },
    { cnName: '昴宿七', bayer: 'HIP 17847', raJ2000: 57.2906, decJ2000: 24.0534, mag: 3.63 }
  ],
  connections: [[0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 6]]
}

const 毕: MansionAsterism = {
  label: '毕',
  quadrant: '西白虎',
  color: '#566573',
  stars: [
    { cnName: '毕宿一', bayer: 'HIP 20889', raJ2000: 67.1542, decJ2000: 19.1804, mag: 3.53 },
    { cnName: '毕宿二', bayer: 'HIP 20648', raJ2000: 66.3724, decJ2000: 17.9279, mag: 4.298 },
    { cnName: '毕宿三', bayer: 'HIP 20455', raJ2000: 65.7337, decJ2000: 17.5425, mag: 3.76 },
    { cnName: '毕宿四', bayer: 'HIP 20205', raJ2000: 64.9483, decJ2000: 15.6276, mag: 3.65 },
    { cnName: '毕宿五', bayer: 'HIP 21421', raJ2000: 68.9802, decJ2000: 16.5093, mag: 0.86 },
    { cnName: '毕宿六', bayer: 'HIP 20885', raJ2000: 67.1437, decJ2000: 15.9623, mag: 3.84 },
    { cnName: '毕宿七', bayer: 'HIP 20713', raJ2000: 66.5865, decJ2000: 15.6183, mag: 4.48 },
    { cnName: '毕宿八', bayer: 'HIP 18724', raJ2000: 60.1701, decJ2000: 12.4903, mag: 3.41 },
    { cnName: '毕宿九', bayer: 'HIP 21683', raJ2000: 69.8188, decJ2000: 15.9180, mag: 4.665 }
  ],
  connections: [[0, 1], [1, 2], [2, 3], [4, 5], [5, 6], [6, 3], [3, 7], [4, 8]]
}

const 觜: MansionAsterism = {
  label: '觜',
  quadrant: '西白虎',
  color: '#2C3E50',
  stars: [
    { cnName: '觜宿一', bayer: 'HIP 26207', raJ2000: 83.7845, decJ2000: 9.9342, mag: 3.66 },
    { cnName: '觜宿二', bayer: 'HIP 26176', raJ2000: 83.7052, decJ2000: 9.4896, mag: 4.41 },
    { cnName: '觜宿三', bayer: 'HIP 26366', raJ2000: 84.2266, decJ2000: 9.2907, mag: 4.09 }
  ],
  connections: [[0, 1], [0, 2]]
}

const 参: MansionAsterism = {
  label: '参',
  quadrant: '西白虎',
  color: '#1C2833',
  stars: [
    { cnName: '参宿一', bayer: 'HIP 27989', raJ2000: 88.7929, decJ2000: 7.4071, mag: 0.42 },
    { cnName: '参宿二', bayer: 'HIP 26727', raJ2000: 85.1897, decJ2000: -1.9426, mag: 1.77 },
    { cnName: '参宿三', bayer: 'HIP 26311', raJ2000: 84.0534, decJ2000: -1.2019, mag: 1.69 },
    { cnName: '参宿四', bayer: 'HIP 25930', raJ2000: 83.0017, decJ2000: -0.2991, mag: 2.41 },
    { cnName: '参宿五', bayer: 'HIP 24436', raJ2000: 78.6345, decJ2000: -8.2016, mag: 0.13 },
    { cnName: '参宿六', bayer: 'HIP 25336', raJ2000: 81.2828, decJ2000: 6.3497, mag: 1.64 },
    { cnName: '参宿七', bayer: 'HIP 27366', raJ2000: 86.9391, decJ2000: -9.6696, mag: 2.06 }
  ],
  connections: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [1, 6]]
}

const 井: MansionAsterism = {
  label: '井',
  quadrant: '南朱雀',
  color: '#F5B7B1',
  stars: [
    { cnName: '井宿一', bayer: 'HIP 35350', raJ2000: 109.5232, decJ2000: 16.5404, mag: 3.559 },
    { cnName: '井宿二', bayer: 'HIP 34088', raJ2000: 106.0272, decJ2000: 20.5703, mag: 3.79 },
    { cnName: '井宿三', bayer: 'HIP 32921', raJ2000: 102.8877, decJ2000: 21.7611, mag: 5.259 },
    { cnName: '井宿四', bayer: 'HIP 32246', raJ2000: 100.9830, decJ2000: 25.1311, mag: 2.98 },
    { cnName: '井宿五', bayer: 'HIP 30883', raJ2000: 97.2408, decJ2000: 20.2121, mag: 4.14 },
    { cnName: '井宿六', bayer: 'HIP 30343', raJ2000: 95.7401, decJ2000: 22.5136, mag: 2.87 },
    { cnName: '井宿七', bayer: 'HIP 31681', raJ2000: 99.4280, decJ2000: 16.3993, mag: 1.92 },
    { cnName: '井宿八', bayer: 'HIP 32362', raJ2000: 101.3224, decJ2000: 12.8956, mag: 3.36 },
    { cnName: '井宿九', bayer: 'HIP 29655', raJ2000: 93.7194, decJ2000: 22.5068, mag: 3.28 }
  ],
  connections: [[0, 1], [1, 2], [2, 3], [2, 4], [4, 5], [4, 6], [6, 1], [6, 7], [5, 8]]
}

const 鬼: MansionAsterism = {
  label: '鬼',
  quadrant: '南朱雀',
  color: '#F1948A',
  stars: [
    { cnName: '鬼宿一', bayer: 'HIP 41822', raJ2000: 127.8989, decJ2000: 18.0944, mag: 5.337 },
    { cnName: '鬼宿二', bayer: 'HIP 41909', raJ2000: 128.1771, decJ2000: 20.4412, mag: 5.325 },
    { cnName: '鬼宿三', bayer: 'HIP 42806', raJ2000: 130.8214, decJ2000: 21.4685, mag: 4.652 },
    { cnName: '鬼宿四', bayer: 'HIP 42911', raJ2000: 131.1712, decJ2000: 18.1543, mag: 3.94 }
  ],
  connections: [[0, 1], [1, 2], [2, 3]]
}

const 柳: MansionAsterism = {
  label: '柳',
  quadrant: '南朱雀',
  color: '#EC7063',
  stars: [
    { cnName: '柳宿一', bayer: 'HIP 42402', raJ2000: 129.6893, decJ2000: 3.3414, mag: 4.43 },
    { cnName: '柳宿二', bayer: 'HIP 42799', raJ2000: 130.8061, decJ2000: 3.3987, mag: 4.3 },
    { cnName: '柳宿三', bayer: 'HIP 43234', raJ2000: 132.1082, decJ2000: 5.8378, mag: 4.337 },
    { cnName: '柳宿四', bayer: 'HIP 43109', raJ2000: 131.6938, decJ2000: 6.4188, mag: 3.38 },
    { cnName: '柳宿五', bayer: 'HIP 42313', raJ2000: 129.4140, decJ2000: 5.7038, mag: 4.131 },
    { cnName: '柳宿六', bayer: 'HIP 43813', raJ2000: 133.8484, decJ2000: 5.9456, mag: 3.1 },
    { cnName: '柳宿七', bayer: 'HIP 44659', raJ2000: 136.4932, decJ2000: 5.0923, mag: 4.981 },
    { cnName: '柳宿八', bayer: 'HIP 45336', raJ2000: 138.5911, decJ2000: 2.3143, mag: 5.5 }
  ],
  connections: [[0, 1], [1, 2], [2, 3], [4, 3], [2, 5], [5, 6], [6, 7]]
}

const 星: MansionAsterism = {
  label: '星',
  quadrant: '南朱雀',
  color: '#E74C3C',
  stars: [
    { cnName: '星宿一', bayer: 'HIP 46390', raJ2000: 141.8968, decJ2000: -8.6586, mag: 1.97 },
    { cnName: '星宿二', bayer: 'HIP 46509', raJ2000: 142.2872, decJ2000: -2.7689, mag: 4.6 },
    { cnName: '星宿三', bayer: 'HIP 46776', raJ2000: 142.9955, decJ2000: -1.1847, mag: 4.548 },
    { cnName: '星宿四', bayer: 'HIP 47431', raJ2000: 144.9640, decJ2000: -1.1428, mag: 3.91 },
    { cnName: '星宿五', bayer: 'HIP 45811', raJ2000: 140.1209, decJ2000: -9.5557, mag: 4.811 },
    { cnName: '星宿六', bayer: 'HIP 45751', raJ2000: 139.9433, decJ2000: -11.9749, mag: 4.77 },
    { cnName: '星宿七', bayer: 'HIP 46744', raJ2000: 142.9124, decJ2000: -10.5520, mag: 6.123 }
  ],
  connections: [[0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 6], [0, 6]]
}

const 张: MansionAsterism = {
  label: '张',
  quadrant: '南朱雀',
  color: '#DC7633',
  stars: [
    { cnName: '张宿一', bayer: 'HIP 48356', raJ2000: 147.8695, decJ2000: -14.8466, mag: 4.11 },
    { cnName: '张宿二', bayer: 'HIP 49841', raJ2000: 152.6470, decJ2000: -12.3541, mag: 3.61 },
    { cnName: '张宿三', bayer: 'HIP 51069', raJ2000: 156.5226, decJ2000: -16.8363, mag: 3.81 },
    { cnName: '张宿四', bayer: 'HIP 49321', raJ2000: 151.0117, decJ2000: -18.1014, mag: 6.228 },
    { cnName: '张宿五', bayer: 'HIP 47452', raJ2000: 145.0765, decJ2000: -14.3323, mag: 5.052 },
    { cnName: '张宿六', bayer: 'HIP 52085', raJ2000: 159.6456, decJ2000: -16.8766, mag: 4.903 }
  ],
  connections: [[0, 1], [1, 2], [2, 3], [0, 3], [0, 4], [2, 5]]
}

const 翼: MansionAsterism = {
  label: '翼',
  quadrant: '南朱雀',
  color: '#CA6F1E',
  stars: [
    { cnName: '翼宿一', bayer: 'HIP 53740', raJ2000: 164.9436, decJ2000: -18.2988, mag: 4.07 },
    { cnName: '翼宿二', bayer: 'HIP 55705', raJ2000: 171.2205, decJ2000: -17.6840, mag: 4.06 },
    { cnName: '翼宿三', bayer: 'HIP 55598', raJ2000: 170.8412, decJ2000: -18.7800, mag: 5.09 },
    { cnName: '翼宿四', bayer: 'HIP 52943', raJ2000: 162.4062, decJ2000: -16.1936, mag: 3.11 },
    { cnName: '翼宿五', bayer: 'HIP 57283', raJ2000: 176.1907, decJ2000: -18.3507, mag: 4.706 },
    { cnName: '翼宿六', bayer: 'HIP 58188', raJ2000: 179.0040, decJ2000: -17.1508, mag: 5.16 },
    { cnName: '翼宿七', bayer: 'HIP 55282', raJ2000: 169.8352, decJ2000: -14.7785, mag: 3.56 },
    { cnName: '翼宿八', bayer: 'HIP 56802', raJ2000: 174.6667, decJ2000: -13.2019, mag: 5.48 },
    { cnName: '翼宿九', bayer: 'HIP 55874', raJ2000: 171.7896, decJ2000: -12.3567, mag: 5.923 },
    { cnName: '翼宿十', bayer: 'HIP 55687', raJ2000: 171.1525, decJ2000: -10.8593, mag: 4.802 },
    { cnName: '翼宿十一', bayer: 'HIP 53975', raJ2000: 165.6302, decJ2000: -9.9949, mag: 7.32 },
    { cnName: '翼宿十二', bayer: 'HIP 56633', raJ2000: 174.1705, decJ2000: -9.8022, mag: 4.673 },
    { cnName: '翼宿十三', bayer: 'HIP 57587', raJ2000: 177.0979, decJ2000: -10.3131, mag: 6.226 },
    { cnName: '翼宿十四', bayer: 'HIP 54682', raJ2000: 167.9145, decJ2000: -22.8258, mag: 4.449 },
    { cnName: '翼宿十五', bayer: 'HIP 54204', raJ2000: 166.3329, decJ2000: -27.2936, mag: 4.912 }
  ],
  connections: [[0, 1], [0, 2], [0, 3], [1, 4], [4, 2], [4, 5], [1, 6], [6, 7], [7, 8], [8, 9], [9, 10], [9, 11], [11, 12], [2, 13], [13, 14]]
}

const 轸: MansionAsterism = {
  label: '轸',
  quadrant: '南朱雀',
  color: '#BA4A00',
  stars: [
    { cnName: '轸宿一', bayer: 'HIP 61359', raJ2000: 188.5968, decJ2000: -23.3968, mag: 2.64 },
    { cnName: '轸宿二', bayer: 'HIP 60965', raJ2000: 187.4661, decJ2000: -16.5154, mag: 2.94 },
    { cnName: '轸宿三', bayer: 'HIP 59803', raJ2000: 183.9515, decJ2000: -17.5419, mag: 2.58 },
    { cnName: '轸宿四', bayer: 'HIP 59316', raJ2000: 182.5312, decJ2000: -22.6198, mag: 2.98 },
    { cnName: '轸宿五', bayer: 'HIP 60189', raJ2000: 185.1402, decJ2000: -22.2159, mag: 5.21 },
    { cnName: '轸宿六', bayer: 'HIP 61174', raJ2000: 188.0176, decJ2000: -16.1960, mag: 4.294 },
    { cnName: '轸宿七', bayer: 'HIP 59199', raJ2000: 182.1034, decJ2000: -24.7289, mag: 4.01 }
  ],
  connections: [[0, 1], [1, 2], [2, 3], [2, 4], [1, 5], [3, 6]]
}

/* ═══════════════════════════════════════════════════════════════
 *  统一导出(按赤经环绕顺序:东青龙→北玄武→西白虎→南朱雀)
 * ═══════════════════════════════════════════════════════════════ */

export const MANSION_ASTERISMS: readonly MansionAsterism[] = [
  角, 亢, 氐, 房, 心, 尾, 箕, 斗, 牛, 女, 虚, 危, 室, 壁, 奎, 娄, 胃, 昴, 毕, 觜, 参, 井, 鬼, 柳, 星, 张, 翼, 轸
] as const
