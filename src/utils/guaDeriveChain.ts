/**
 * 卦关系链式推衍
 *
 * ═══════════════════════════════════════════════════════════════
 *  推衍模式核心：对同一种关系类型反复施加，形成 value 链
 *
 *  给定关系类型 R（互卦/对卦/综卦/交卦/变卦/飞伏）和深度 N，
 *  对每个 value ∈ [0..63] 计算：
 *
 *     chain[0][v] = v                    // 恒等，源卦本身
 *     chain[1][v] = R(v)                 // 一次推衍
 *     chain[2][v] = R(R(v))              // 二次推衍
 *     ...
 *     chain[k][v] = R^k(v)
 *
 *  返回 chain: number[][]，chain[k][v] 即"位置 v 上第 k 层推衍出的卦值"。
 *
 *  用于 GuaRelationView 的推衍模式：外圈按源卦 v 排布，内圈按同一角度
 *  的 chain[k][v] 显示第 k 层派生卦。
 * ═══════════════════════════════════════════════════════════════
 */
import {
  computeHugua,
  computeDuigua,
  computeZonggua,
  computeJiaogua,
  computeBiangua,
  type GuaRelationType,
} from './guaRelations'
import { FEIFU_TABLE } from './guaRelationArrows'

/**
 * 由关系类型生成单步推衍函数 v → v'
 *
 * 飞伏走 FEIFU_TABLE 查表（依赖京房八宫），其他关系是纯位运算函数。
 * 变卦 movingLines 为空数组时 R(v) = v（自映射），符合"未指定动爻则变卦即原卦"的易理。
 */
function getStepFn(
  type: GuaRelationType,
  movingLines: readonly number[],
): (v: number) => number {
  switch (type) {
    case 'feifu': {
      // 预生成 64 元查表数组，O(1) 单次访问
      const table = new Array<number>(64)
      for (const e of FEIFU_TABLE) table[e.feiValue] = e.fuValue
      return v => table[v] ?? v
    }
    case 'hugua':
      return computeHugua
    case 'duigua':
      return computeDuigua
    case 'zonggua':
      return computeZonggua
    case 'jiaogua':
      return computeJiaogua
    case 'biangua':
      return v => computeBiangua(v, movingLines)
  }
}

/**
 * 生成链式推衍表
 *
 * @param type        关系类型
 * @param depth       推衍深度（1..N）；返回数组长度为 depth + 1（含第 0 层恒等）
 * @param movingLines 动爻位（仅 biangua 使用）
 * @returns readonly number[][] 二维数组：outer index = 层号 (0..depth)，inner index = 源卦 value (0..63)
 *
 * 示例：computeDeriveChain('hugua', 2) 返回长度 3 的数组
 *   [0]: [0,1,2,...,63]              — 源卦
 *   [1]: 每卦的互卦
 *   [2]: 互卦的互卦
 */
export function computeDeriveChain(
  type: GuaRelationType,
  depth: number,
  movingLines: readonly number[] = [],
): readonly (readonly number[])[] {
  const safeDepth = Math.max(0, Math.floor(depth))
  const step = getStepFn(type, movingLines)

  const chain: number[][] = []
  // 第 0 层：恒等
  const layer0 = Array.from({ length: 64 }, (_, v) => v)
  chain.push(layer0)

  // 第 k 层：对第 k-1 层每个位置应用一次 step
  for (let k = 1; k <= safeDepth; k++) {
    const prev = chain[k - 1]!
    const cur = new Array<number>(64)
    for (let v = 0; v < 64; v++) cur[v] = step(prev[v]!)
    chain.push(cur)
  }

  return chain
}
