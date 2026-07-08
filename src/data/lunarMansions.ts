/**
 * 二十八宿距星表（薄封装 · 派生自 MANSION_ASTERISMS）
 *
 * ═══════════════════════════════════════════════════════════════
 *  真理源:
 *   · 星坐标 → src/data/mansionStars.ts::MANSION_ASTERISMS
 *     由 scripts/import-stellarium.py 从 Stellarium Chinese Sky Culture
 *     + SIMBAD ICRS J2000 自动生成,是本项目的"现代天文基准"。
 *   · 每宿距星 = MANSION_ASTERISMS[i].stars[0](Stellarium 意义的"XX 宿一")。
 *
 *  为什么保留本文件？
 *   · 下游 6 个消费方(planetMansion / skyEvents / useSevenLuminaries /
 *     ConstellationsRing / SiXiangRing / SkyChart)只需要"28 颗距星"的扁平表,
 *     不需要每宿完整星官。本文件把 MANSION_ASTERISMS 的 stars[0] 提取出来,
 *     保持 getMansionSpans 等下游接口零改动。
 *   · 四象配色(COLORS)是本项目自身的设计约定,与 Stellarium 无关,故本地维护。
 *
 *  ⚠️ 请勿手动修改本文件的 raJ2000 / decJ2000 数值 —— 它们全部派生自上游,
 *     任何差异都是 bug。要改动距星,请去改 mansionStars.ts 的 stars[0] 顺序。
 * ═══════════════════════════════════════════════════════════════
 */

import { MANSION_ASTERISMS } from './mansionStars'

export interface MansionStar {
  /** 宿名 */
  label: string
  /** 距星认证恒星(如"角宿一 (HIP 65474)") */
  star: string
  /** J2000 赤经(度) */
  raJ2000: number
  /** J2000 赤纬(度) */
  decJ2000: number
  /**
   * 距离(光年,fixedStarEquatorial 内部 DefineStar 需要正距离)。
   * 只影响视差修正(arc-sec 级),不影响赤经数值,统一填安全常量即可。
   */
  distanceLy: number
  /** 四象配色 */
  color: string
}

/**
 * 四象配色(与 mansionStars.ts::MANSION_ASTERISMS[i].color 一致,
 * 但独立在此处维护,避免下游误以为色彩也是 Stellarium 数据)。
 */
const MANSION_COLORS: Record<string, string> = {
  // 东青龙
  角: '#2ECC71', 亢: '#27AE60', 氐: '#229954', 房: '#1D8348',
  心: '#196F3D', 尾: '#145A32', 箕: '#0E6251',
  // 北玄武
  斗: '#5DADE2', 牛: '#3498DB', 女: '#2874A6', 虚: '#1B4F72',
  危: '#154360', 室: '#0B5345', 壁: '#0E6251',
  // 西白虎
  奎: '#D4AF37', 娄: '#BCC6CC', 胃: '#AEB6BF', 昴: '#829AE3',
  毕: '#566573', 觜: '#2C3E50', 参: '#1C2833',
  // 南朱雀
  井: '#F5B7B1', 鬼: '#F1948A', 柳: '#EC7063', 星: '#E74C3C',
  张: '#DC7633', 翼: '#CA6F1E', 轸: '#BA4A00'
}

/**
 * 二十八宿距星表(东青龙 → 北玄武 → 西白虎 → 南朱雀,按赤经顺序环绕)。
 *
 * 派生规则:LUNAR_MANSIONS[i] = MANSION_ASTERISMS[i].stars[0] 的扁平化视图。
 */
export const LUNAR_MANSIONS: MansionStar[] = MANSION_ASTERISMS.map((asterism) => {
  const dist = asterism.stars[0]
  if (!dist) {
    throw new Error(`Mansion ${asterism.label} has no stars[0] — mansionStars.ts is malformed`)
  }
  return {
    label: asterism.label,
    star: `${dist.cnName} (${dist.bayer})`,
    raJ2000: dist.raJ2000,
    decJ2000: dist.decJ2000,
    // 距离对赤经无影响,统一 100 光年即可(实测所有距星均 >60ly,视差修正可忽略)
    distanceLy: 100,
    color: MANSION_COLORS[asterism.label] ?? '#888888'
  }
})
