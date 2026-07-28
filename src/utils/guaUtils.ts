/**
 * 卦算法纯函数工具
 *
 * 从 data/sixtyFourGua.ts 提取的纯计算函数：
 *   - 位反转、六爻提取、先天位置、Unicode 卦符
 *
 * 无数据依赖，可独立测试。
 */

/** 6 位整体位反转：bit0↔bit5, bit1↔bit4, bit2↔bit3 */
export function bitReverse6(value: number): number {
  let r = 0
  for (let i = 0; i < 6; i++) {
    r = (r << 1) | ((value >> i) & 1)
  }
  return r
}

/** 由 value 取六爻数组（自下而上，下标0=初爻；true=阳爻） */
export function getGuaLines(value: number): boolean[] {
  return Array.from({ length: 6 }, (_, i) => Boolean(value & (1 << i)))
}

/** 由 value 取先天圆周位置 0-63 */
export function getXiantianPos(value: number): number {
  return bitReverse6(value)
}

/** 由文王序取 Unicode 卦符字符 */
export function getUnicodeHexagram(wenwangOrder: number): string {
  return String.fromCodePoint(0x4dc0 + wenwangOrder - 1)
}
