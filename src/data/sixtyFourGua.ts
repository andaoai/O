/**
 * 先天六十四卦（伏羲 / 邵雍先天圆图）数据与算法
 *
 * 把「六十四卦如何排成先天圆图」这一领域知识从渲染层抽离：
 * 组件只消费成品 XIANTIAN_64_GUA，不在模板里推导位反转 / 文王序 / Unicode / 角度。
 *
 * 【二进制编码 value】
 *   一卦六爻自下而上为 bit0..bit5，阳爻=1、阴爻=0，value = 0..63。
 *   下卦（初/二/三爻）= bit0..bit2，上卦（四/五/上爻）= bit3..bit5。
 *   八经卦 bit 值：坤☷=0、震☳=1、坎☵=2、兑☱=3、艮☶=4、离☲=5、巽☴=6、乾☰=7。
 *   故 value = 下卦值 + 上卦值 * 8。
 *
 * 【先天圆周位置 pos = bitReverse6(value)】
 *   邵雍先天圆图按六爻二进制的「位反转」定圆周次序。
 *   验证：坤(value0)→pos0、姤(value62)→pos31、复(value1)→pos32、乾(value63)→pos63；
 *   自复(pos32)递增即得「复颐屯益震噬嗑随无妄…」经典次序。
 *
 * 【屏幕角度（SVG 空间，已含上下翻转）】
 *   PolarCanvas 坐标 x=cos·r、y=sin·r，SVG 中 y 向下：0°在正右、90°在正下、270°在正上、顺时针。
 *   先天圆图要乾居顶、坤居底且对径相对，两仪各占半圆：
 *     阳仪 pos>=32：centerAngle = 270 + (63 - pos) * GUA_STEP   → 乾(pos63)=270 顶，沿右半下行
 *     阴仪 pos<=31：centerAngle = 270 - (32 - pos) * GUA_STEP   → 坤(pos0)=90 底，沿左半上行
 *   乾(顶,270°)与坤(底,90°)恰好对径；右半阳仪、左半阴仪。
 *
 * 【Unicode 卦符】U+4DC0..U+4DFF 按「文王卦序」排列（U+4DC0=䷀=乾=文王第1卦）。
 *   文王序无规律 → 必须硬编码 value→{文王序,卦名} 映射；unicode = 0x4DC0 + 文王序 - 1。
 */

/** 每卦圆心角步长：360 / 64 */
export const GUA_STEP = 360 / 64

/**
 * 八经卦 bit 值 → 卦名
 * 与文件顶部注释「坤☷=0、震☳=1、坎☵=2、兑☱=3、艮☶=4、离☲=5、巽☴=6、乾☰=7」严格一致。
 * 索引即三爻二进制值：bit0=初爻,bit2=三爻，阳=1阴=0。
 */
export const BAGUA_NAMES: readonly string[] = [
  '坤', '震', '坎', '兑', '艮', '离', '巽', '乾'
]

/** 由 64 卦 value 取内卦（下卦）八经卦名：取 bit0..bit2 */
export function getInnerGuaName(value: number): string {
  return BAGUA_NAMES[value & 0b111]!
}

/** 由 64 卦 value 取外卦（上卦）八经卦名：取 bit3..bit5 */
export function getOuterGuaName(value: number): string {
  return BAGUA_NAMES[(value >> 3) & 0b111]!
}

/** 一卦的基础元信息（按 value 硬编码） */
export interface GuaMeta {
  /** 六爻二进制编码 0-63（bit0=初爻,bit5=上爻；阳=1阴=0） */
  value: number
  /** 卦名 */
  name: string
  /** 文王卦序 1-64（用于映射 Unicode 卦符） */
  wenwangOrder: number
}

/** 先天圆图上某一卦的渲染就绪数据 */
export interface XiantianGuaItem extends GuaMeta {
  /** 先天圆周位置 0-63（= bitReverse6(value)） */
  pos: number
  /** Unicode 卦符字符（如 ䷀） */
  unicode: string
  /** 六爻自下而上：true=阳爻、false=阴爻（下标0=初爻,5=上爻） */
  lines: boolean[]
  /** 圆心角（SVG 空间，度） */
  centerAngle: number
  /** 扇形起始角（centerAngle - GUA_STEP/2） */
  startAngle: number
  /** 扇形结束角（centerAngle + GUA_STEP/2） */
  endAngle: number
}

/**
 * value → {文王序, 卦名} 映射，按 value 索引（长度 64）。
 * 由「上下经卦二进制」逐卦推导：value = 下卦值 + 上卦值*8。
 * 渲染核心输入是 value（lines/pos 皆由 value 推导），故按 value 索引最省查找。
 */
export const WENWANG_GUA_BY_VALUE: readonly GuaMeta[] = [
  { value: 0, name: '坤', wenwangOrder: 2 },
  { value: 1, name: '复', wenwangOrder: 24 },
  { value: 2, name: '师', wenwangOrder: 7 },
  { value: 3, name: '临', wenwangOrder: 19 },
  { value: 4, name: '谦', wenwangOrder: 15 },
  { value: 5, name: '明夷', wenwangOrder: 36 },
  { value: 6, name: '升', wenwangOrder: 46 },
  { value: 7, name: '泰', wenwangOrder: 11 },
  { value: 8, name: '豫', wenwangOrder: 16 },
  { value: 9, name: '震', wenwangOrder: 51 },
  { value: 10, name: '解', wenwangOrder: 40 },
  { value: 11, name: '归妹', wenwangOrder: 54 },
  { value: 12, name: '小过', wenwangOrder: 62 },
  { value: 13, name: '丰', wenwangOrder: 55 },
  { value: 14, name: '恒', wenwangOrder: 32 },
  { value: 15, name: '大壮', wenwangOrder: 34 },
  { value: 16, name: '比', wenwangOrder: 8 },
  { value: 17, name: '屯', wenwangOrder: 3 },
  { value: 18, name: '坎', wenwangOrder: 29 },
  { value: 19, name: '节', wenwangOrder: 60 },
  { value: 20, name: '蹇', wenwangOrder: 39 },
  { value: 21, name: '既济', wenwangOrder: 63 },
  { value: 22, name: '井', wenwangOrder: 48 },
  { value: 23, name: '需', wenwangOrder: 5 },
  { value: 24, name: '萃', wenwangOrder: 45 },
  { value: 25, name: '随', wenwangOrder: 17 },
  { value: 26, name: '困', wenwangOrder: 47 },
  { value: 27, name: '兑', wenwangOrder: 58 },
  { value: 28, name: '咸', wenwangOrder: 31 },
  { value: 29, name: '革', wenwangOrder: 49 },
  { value: 30, name: '大过', wenwangOrder: 28 },
  { value: 31, name: '夬', wenwangOrder: 43 },
  { value: 32, name: '剥', wenwangOrder: 23 },
  { value: 33, name: '颐', wenwangOrder: 27 },
  { value: 34, name: '蒙', wenwangOrder: 4 },
  { value: 35, name: '损', wenwangOrder: 41 },
  { value: 36, name: '艮', wenwangOrder: 52 },
  { value: 37, name: '贲', wenwangOrder: 22 },
  { value: 38, name: '蛊', wenwangOrder: 18 },
  { value: 39, name: '大畜', wenwangOrder: 26 },
  { value: 40, name: '晋', wenwangOrder: 35 },
  { value: 41, name: '噬嗑', wenwangOrder: 21 },
  { value: 42, name: '未济', wenwangOrder: 64 },
  { value: 43, name: '睽', wenwangOrder: 38 },
  { value: 44, name: '旅', wenwangOrder: 56 },
  { value: 45, name: '离', wenwangOrder: 30 },
  { value: 46, name: '鼎', wenwangOrder: 50 },
  { value: 47, name: '大有', wenwangOrder: 14 },
  { value: 48, name: '观', wenwangOrder: 20 },
  { value: 49, name: '益', wenwangOrder: 42 },
  { value: 50, name: '涣', wenwangOrder: 59 },
  { value: 51, name: '中孚', wenwangOrder: 61 },
  { value: 52, name: '渐', wenwangOrder: 53 },
  { value: 53, name: '家人', wenwangOrder: 37 },
  { value: 54, name: '巽', wenwangOrder: 57 },
  { value: 55, name: '小畜', wenwangOrder: 9 },
  { value: 56, name: '否', wenwangOrder: 12 },
  { value: 57, name: '无妄', wenwangOrder: 25 },
  { value: 58, name: '讼', wenwangOrder: 6 },
  { value: 59, name: '履', wenwangOrder: 10 },
  { value: 60, name: '遁', wenwangOrder: 33 },
  { value: 61, name: '同人', wenwangOrder: 13 },
  { value: 62, name: '姤', wenwangOrder: 44 },
  { value: 63, name: '乾', wenwangOrder: 1 }
]

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

/** 由先天位置 pos 取圆心角（SVG 空间，度）。乾顶坤底、两仪对称。 */
export function getXiantianCenterAngle(pos: number): number {
  return pos >= 32
    ? 270 + (63 - pos) * GUA_STEP // 阳仪：乾(pos63)=270 顶，沿右半下行
    : 270 - (32 - pos) * GUA_STEP // 阴仪：坤(pos0)=90 底，沿左半上行
}

/** 由文王序取 Unicode 卦符字符 */
export function getUnicodeHexagram(wenwangOrder: number): string {
  return String.fromCodePoint(0x4dc0 + wenwangOrder - 1)
}

/**
 * 先天六十四卦渲染数据：按先天圆周位置 pos 升序排列，每项带好
 * unicode / lines / centerAngle / startAngle / endAngle，组件直接消费。
 */
export const XIANTIAN_64_GUA: readonly XiantianGuaItem[] = WENWANG_GUA_BY_VALUE.map(meta => {
  const pos = getXiantianPos(meta.value)
  const centerAngle = getXiantianCenterAngle(pos)
  return {
    ...meta,
    pos,
    unicode: getUnicodeHexagram(meta.wenwangOrder),
    lines: getGuaLines(meta.value),
    centerAngle,
    startAngle: centerAngle - GUA_STEP / 2,
    endAngle: centerAngle + GUA_STEP / 2
  }
})
  .slice()
  .sort((a, b) => a.pos - b.pos)
