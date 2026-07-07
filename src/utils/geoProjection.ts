/**
 * 世界地图 → 极方位等距投影工具
 *
 * ═══════════════════════════════════════════════════════════════
 *  核心洞察: 地面经纬度与天球赤经赤纬在等距方位投影下是同构的
 * ═══════════════════════════════════════════════════════════════
 *
 * 天球 (skyProjection.project):
 *   极径 r = (90° − δ)/90°     ← 北天极 δ=90° 在盘心
 *   极角 α = ra (投影后)        ← 春分点 ra=0
 *
 * 地球 (本文件):
 *   极径 r = (90° − φ)/90°     ← 北极 φ=90° 在盘心,赤道 φ=0 在 r=1,南极 φ=−90° 在 r=2
 *   极角 α = projAngle          ← 由本文件 geoToProjAngle 给出
 *
 * 由于两者极径公式完全一致,直接把地面 φ 当作天球 δ 送入 `project(projAngle, lat)`
 * 即可复用 SuzhouSkyMap 现有的 makeToSvg 管道。本文件只提供「经度 → projAngle」
 * 这一步的映射。
 *
 * ─────────────────────────────────────────────────────────────
 *  projAngle 公式(重要:与「观测者坐标系」对齐,非「LST 锁定」)
 * ─────────────────────────────────────────────────────────────
 *
 * 天球公式 : projAngle_sky    = LST − RA + 90°  (面朝北仰望,天球随 LST 旋转)
 * 地面公式 : projAngle_ground = λ_obs − λ + 90°  (观测者所在经度恒在盘顶,地面静态基)
 *
 * 关键:地面基公式**不含 LST**。天地旋转的对偶由 SuzhouSkyMap 的 orientOffset
 * 机制统一提供:
 *
 *   · fixed-ground     : orientOffset = 0
 *       → 地面静止(观测者在盘顶),天球随 LST 旋转 —— 观测者视角
 *   · fixed-sky-coord  : orientOffset = LST
 *       → 天球静止(春分点在盘顶),地面绕天极旋转(一恒星日一周) —— 惯性系视角
 *   · fixed-sky-suzhou : orientOffset = LST − SUZHOU_TOP_RA
 *       → 天球静止(心宿二在盘顶),地面旋转 —— 苏图约定
 *
 * 天地对齐验证:惯性系下星 X 的天顶下方经度 λ = λ_obs + (RA_X − LST),
 * 代入两公式得到相同的 projAngle,像素级重合(推导略,由等距方位投影同构性质保证)。
 *
 * ⚠️ 五层架构: 纯函数工具,无副作用。
 */

import { project, type PlanePoint } from './skyProjection'
import { normalizeAngle } from './geometry'

/**
 * 地面经度 → 观测者坐标系下的投影极角(度)
 *
 * @param lon 地面经度(度,东正西负,-180..180 或 0..360 均可)
 * @param observerLon 观测者经度(度)—— 决定"哪个经度锁在盘顶"
 * @returns 投影极角(度,已归一化到 0..360),可直接送入 project()
 *
 * 特例:lon = observerLon 时 projAngle = 90°(盘顶),即观测者的地面位置。
 * 该值恒定不含 LST,天地相对旋转由 SuzhouSkyMap 的 orientOffset 统一处理。
 */
export const geoToProjAngle = (lon: number, observerLon: number): number =>
  normalizeAngle(observerLon - lon + 90)

/**
 * 地面经纬度 → 单位平面坐标(直接可用于 makeToSvg 管道)
 *
 * @param lon 地面经度(度)
 * @param lat 地面纬度(度,北正南负)
 * @param observerLon 观测者经度(度)
 * @returns 数学平面坐标 {x, y},赤道半径=1,北极在原点
 *
 * 与天球投影关系:
 *   geoToPlane(λ, φ, λ_obs) === project(geoToProjAngle(λ, λ_obs), φ)
 *   把 (λ, φ) 当作 (RA, δ) 送入天球投影,只是 RA 用「observerLon−λ+90」代替
 */
export const geoToPlane = (
  lon: number,
  lat: number,
  observerLon: number
): PlanePoint => project(geoToProjAngle(lon, observerLon), lat)

