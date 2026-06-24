/**
 * 二十八宿距星数据
 *
 * 二十八宿是中国古代赤道坐标体系：每宿由一颗「距星」界定，相邻距星的赤经差即该宿宿度。
 * 此处采用传统认证距星 + Hipparcos/SIMBAD J2000 坐标，运行时用 astronomy-engine
 * 做岁差修正到当前历元，再投影成星图。
 *
 * 坐标已脚本校验：28 距星赤经沿天赤道单调环绕一周、无反序。
 * （觜→参跨度仅约 0.5°，为真实天象「觜参之争」，非数据错误。）
 *
 * 配色沿用四象色系（东青龙绿、北玄武蓝、西白虎金灰、南朱雀红）。
 */

export interface MansionStar {
  /** 宿名 */
  label: string
  /** 距星认证恒星（拜耳/弗兰斯蒂德编号 + 传统名） */
  star: string
  /** J2000 赤经（度） */
  raJ2000: number
  /** J2000 赤纬（度） */
  decJ2000: number
  /** 距离（光年，DefineStar 需要，不影响投影角度） */
  distanceLy: number
  /** 配色 */
  color: string
}

/** 二十八宿距星表（东青龙 → 北玄武 → 西白虎 → 南朱雀，按赤经顺序环绕） */
export const LUNAR_MANSIONS: MansionStar[] = [
  // 东方青龙七宿
  { label: '角', star: 'α Vir 角宿一(Spica)', raJ2000: 201.298, decJ2000: -11.161, distanceLy: 250, color: '#2ECC71' },
  { label: '亢', star: 'κ Vir 亢宿一', raJ2000: 213.224, decJ2000: -10.274, distanceLy: 250, color: '#27AE60' },
  { label: '氐', star: 'α2 Lib 氐宿一', raJ2000: 222.720, decJ2000: -16.042, distanceLy: 77, color: '#229954' },
  { label: '房', star: 'π Sco 房宿一', raJ2000: 239.713, decJ2000: -26.114, distanceLy: 590, color: '#1D8348' },
  { label: '心', star: 'σ Sco 心宿一', raJ2000: 245.297, decJ2000: -25.593, distanceLy: 700, color: '#196F3D' },
  { label: '尾', star: 'μ1 Sco 尾宿一', raJ2000: 252.968, decJ2000: -38.047, distanceLy: 500, color: '#145A32' },
  { label: '箕', star: 'γ Sgr 箕宿一', raJ2000: 271.452, decJ2000: -30.424, distanceLy: 96, color: '#0E6251' },

  // 北方玄武七宿
  { label: '斗', star: 'φ Sgr 斗宿一', raJ2000: 281.414, decJ2000: -26.991, distanceLy: 230, color: '#5DADE2' },
  { label: '牛', star: 'β Cap 牛宿一', raJ2000: 305.253, decJ2000: -14.781, distanceLy: 340, color: '#3498DB' },
  { label: '女', star: 'ε Aqr 女宿一', raJ2000: 311.918, decJ2000: -9.496, distanceLy: 230, color: '#2874A6' },
  { label: '虚', star: 'β Aqr 虚宿一', raJ2000: 322.890, decJ2000: -5.571, distanceLy: 540, color: '#1B4F72' },
  { label: '危', star: 'α Aqr 危宿一', raJ2000: 331.446, decJ2000: -0.320, distanceLy: 760, color: '#154360' },
  { label: '室', star: 'α Peg 室宿一(Markab)', raJ2000: 346.190, decJ2000: 15.205, distanceLy: 133, color: '#0B5345' },
  { label: '壁', star: 'γ Peg 壁宿一(Algenib)', raJ2000: 3.309, decJ2000: 15.184, distanceLy: 390, color: '#0E6251' },

  // 西方白虎七宿
  { label: '奎', star: 'ζ And 奎宿一', raJ2000: 11.829, decJ2000: 24.267, distanceLy: 180, color: '#D4AF37' },
  { label: '娄', star: 'β Ari 娄宿一(Sheratan)', raJ2000: 28.660, decJ2000: 20.808, distanceLy: 60, color: '#BCC6CC' },
  { label: '胃', star: '35 Ari 胃宿一', raJ2000: 42.366, decJ2000: 27.708, distanceLy: 340, color: '#AEB6BF' },
  { label: '昴', star: '17 Tau 昴宿一(Electra)', raJ2000: 56.219, decJ2000: 24.113, distanceLy: 370, color: '#829AE3' },
  { label: '毕', star: 'ε Tau 毕宿一', raJ2000: 67.154, decJ2000: 19.180, distanceLy: 150, color: '#566573' },
  { label: '觜', star: 'φ1 Ori 觜宿一', raJ2000: 84.687, decJ2000: 9.490, distanceLy: 1000, color: '#2C3E50' },
  { label: '参', star: 'ζ Ori 参宿一(Alnitak)', raJ2000: 85.190, decJ2000: -1.943, distanceLy: 820, color: '#1C2833' },

  // 南方朱雀七宿
  { label: '井', star: 'μ Gem 井宿一', raJ2000: 95.740, decJ2000: 22.514, distanceLy: 230, color: '#F5B7B1' },
  { label: '鬼', star: 'θ Cnc 鬼宿一', raJ2000: 124.129, decJ2000: 18.099, distanceLy: 600, color: '#F1948A' },
  { label: '柳', star: 'δ Hya 柳宿一', raJ2000: 131.690, decJ2000: 6.419, distanceLy: 130, color: '#EC7063' },
  { label: '星', star: 'α Hya 星宿一(Alphard)', raJ2000: 141.897, decJ2000: -8.659, distanceLy: 180, color: '#E74C3C' },
  { label: '张', star: 'υ1 Hya 张宿一', raJ2000: 154.273, decJ2000: -14.846, distanceLy: 270, color: '#DC7633' },
  { label: '翼', star: 'α Crt 翼宿一', raJ2000: 164.944, decJ2000: -18.299, distanceLy: 170, color: '#CA6F1E' },
  { label: '轸', star: 'γ Crv 轸宿一(Gienah)', raJ2000: 183.952, decJ2000: -17.542, distanceLy: 165, color: '#BA4A00' }
]
