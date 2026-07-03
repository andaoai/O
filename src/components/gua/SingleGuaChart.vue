<script setup lang="ts">
/**
 * 单卦静态图（六爻爻线 + 纳甲六亲 + 世应）
 *
 * ⚠️ 完全静态 —— 单卦是不随时间变化的，无 time prop、无 ClientOnly、无响应式依赖。
 *
 * 数据派生：全部走 utils/liuqin.ts#deriveGuaInfo，组件层不重复实现纳甲 / 六亲逻辑。
 * 使用位置：VitePress md 里直接 <SingleGuaChart :value="63" />，或古籍注解页复用。
 *
 * 版式：
 *   - 深紫底 SVG，六行等高（六爻自上而下：上爻→初爻），每行分若干列
 *   - 阳爻：整段横条；阴爻：中间断开的两段横条
 *   - 世爻标金色「世」、应爻标青色「应」
 *   - 三爻/四爻之间虚线，右侧标"外卦 · 纳X"/"内卦 · 纳Y"
 */
import { computed } from 'vue'
import { deriveGuaInfo, ELEMENT_COLORS } from '@/utils/liuqin'

interface Props {
  /** 六爻二进制编码 0-63（bit0=初爻，阳=1） */
  value: number
  /** 爻辞覆盖，长度 6，index 0 = 初爻文字（如"潜龙勿用"） */
  yaoText?: readonly string[]
  /** 图题（默认自动生成 "乾卦 · 纳甲六亲图" 等） */
  caption?: string
  /** 图宽（px），默认 520 */
  width?: number
}

const props = withDefaults(defineProps<Props>(), {
  width: 520
})

/** 从 value 派生完整卦信息 */
const gua = computed(() => deriveGuaInfo(props.value))

/** 图题：优先用外部传入，否则自动生成 */
const figureCaption = computed(() => {
  if (props.caption) return props.caption
  const g = gua.value
  return `${g.name}卦（${g.unicode}） · ${g.palace}宫 · ${g.shiyingType} · 属${g.palaceElement}`
})

/** 六爻显示顺序：自上而下（上爻→初爻） */
const yaosTopDown = computed(() => [...gua.value.yaos].reverse())

/** 中文爻位名（阳爻 = 九，阴爻 = 六） */
function yaoPositionName(index: number, yang: boolean): string {
  const positions = ['初', '二', '三', '四', '五', '上']
  const suffix = yang ? '九' : '六'
  const prefix = positions[index]!
  // 「初九/上九」 vs 「九二/九三/九四/九五」的传统写法
  if (index === 0 || index === 5) return prefix + suffix
  return suffix + prefix
}

/** 布局常量（SVG viewBox 空间） */
const LAYOUT = {
  colX: {
    pos: 30,        // 爻位（初九 世）
    text: 110,      // 爻辞
    lineStart: 220, // 爻线起点
    lineWidth: 80,
    najia: 320,     // 纳甲
    element: 390,   // 五行
    liuqin: 450     // 六亲
  },
  rowY: {
    header: 66,     // 表头
    first: 90,      // 第一行（上爻）
    step: 40        // 行间距
  },
  height: 340       // viewBox 高度
} as const

/** 内外卦分界虚线的 y 坐标（三爻和四爻之间） */
const dividerY = computed(() => {
  // 上爻 = row 0 (y=90), 五爻 = row 1 (y=130), 四爻 = row 2 (y=170),
  // 三爻 = row 3 (y=210), 二爻 = row 4 (y=250), 初爻 = row 5 (y=290)
  // 分界位于 row 2 (y=170, 四爻) 和 row 3 (y=210, 三爻) 之间 = 190
  return LAYOUT.rowY.first + 2 * LAYOUT.rowY.step + LAYOUT.rowY.step / 2
})

/** figure / svg / figcaption 的 inline style（对应品牌 tokens） */
const figureStyle = computed(() => ({
  margin: '1.8rem auto',
  maxWidth: `${props.width}px`,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  gap: '0.6rem'
}))
const svgStyle = {
  width: '100%',
  height: 'auto',
  display: 'block',
  border: '1px solid var(--vp-c-brand-soft)',
  borderRadius: '8px',
  boxShadow: '0 2px 24px var(--ysg-brand-glow-dim)'
}
const figcaptionStyle = {
  color: 'var(--ysg-paper-300)',
  fontFamily: 'var(--ysg-font-serif)',
  fontSize: '0.9rem',
  letterSpacing: '0.05em',
  textAlign: 'center' as const,
  opacity: 0.85
}
</script>

<template>
  <figure :style="figureStyle">
    <svg
      :viewBox="`0 0 520 ${LAYOUT.height}`"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      :aria-label="`${gua.name}卦纳甲六亲图`"
      :style="svgStyle"
    >
      <!-- 深紫底 -->
      <rect x="0" y="0" width="520" :height="LAYOUT.height" fill="#1a0f2e" rx="6" />

      <!-- 标题：卦名 + Unicode 卦符 + 所属宫 + 本宫五行 -->
      <text
        x="260" y="30"
        text-anchor="middle"
        fill="#f1c40f"
        font-size="18"
        font-family="serif"
        letter-spacing="0.2em"
      >{{ gua.name }} {{ gua.unicode }} · {{ gua.palace }}宫 · 属{{ gua.palaceElement }}</text>

      <!-- 表头 -->
      <text :x="LAYOUT.colX.pos"          :y="LAYOUT.rowY.header" fill="#aaa" font-size="12">爻位</text>
      <text :x="LAYOUT.colX.text"         :y="LAYOUT.rowY.header" fill="#aaa" font-size="12">爻辞</text>
      <text :x="LAYOUT.colX.lineStart + 10" :y="LAYOUT.rowY.header" fill="#aaa" font-size="12">爻线</text>
      <text :x="LAYOUT.colX.najia"        :y="LAYOUT.rowY.header" fill="#aaa" font-size="12">纳甲</text>
      <text :x="LAYOUT.colX.element"      :y="LAYOUT.rowY.header" fill="#aaa" font-size="12">五行</text>
      <text :x="LAYOUT.colX.liuqin"       :y="LAYOUT.rowY.header" fill="#aaa" font-size="12">六亲</text>

      <!-- 六爻自上而下 -->
      <g
        v-for="(yao, rowIdx) in yaosTopDown"
        :key="yao.index"
        :transform="`translate(0, ${LAYOUT.rowY.first + rowIdx * LAYOUT.rowY.step})`"
      >
        <!-- 爻位（世/应用高亮色，其余灰色） -->
        <text
          :x="LAYOUT.colX.pos" y="0"
          :fill="yao.isShi ? '#f1c40f' : yao.isYing ? '#3498db' : '#aaa'"
          font-size="14"
          font-family="serif"
        >{{ yaoPositionName(yao.index, yao.yang) }}<tspan v-if="yao.isShi" fill="#f1c40f"> 世</tspan><tspan v-if="yao.isYing" fill="#3498db"> 应</tspan></text>

        <!-- 爻辞（可选） -->
        <text :x="LAYOUT.colX.text" y="0" fill="#ddd" font-size="13">{{ yaoText?.[yao.index] ?? '' }}</text>

        <!-- 爻线：阳整段 / 阴中间断开 -->
        <rect
          v-if="yao.yang"
          :x="LAYOUT.colX.lineStart" y="-10"
          :width="LAYOUT.colX.lineWidth" height="10"
          :fill="ELEMENT_COLORS[yao.element]"
        />
        <template v-else>
          <rect
            :x="LAYOUT.colX.lineStart" y="-10"
            :width="LAYOUT.colX.lineWidth * 0.4" height="10"
            :fill="ELEMENT_COLORS[yao.element]"
          />
          <rect
            :x="LAYOUT.colX.lineStart + LAYOUT.colX.lineWidth * 0.6" y="-10"
            :width="LAYOUT.colX.lineWidth * 0.4" height="10"
            :fill="ELEMENT_COLORS[yao.element]"
          />
        </template>

        <!-- 纳甲 / 五行 / 六亲 -->
        <text :x="LAYOUT.colX.najia"   y="0" fill="#eee" font-size="14">{{ yao.najia }}</text>
        <text :x="LAYOUT.colX.element" y="0" :fill="ELEMENT_COLORS[yao.element]" font-size="14">{{ yao.element }}</text>
        <text :x="LAYOUT.colX.liuqin"  y="0" :fill="ELEMENT_COLORS[yao.element]" font-size="14">{{ yao.liuqin }}</text>
      </g>

      <!--
        内外卦分界：虚线横穿全图，中央小徽章标注 "外 X / 内 Y"。
        徽章 x 位置落在爻辞列右端 (x=162) 与爻线列左端 (x=220) 之间的空白带上，
        用底色矩形把虚线中段遮盖，避免文字与虚线交叉。
      -->
      <line x1="20" :y1="dividerY" x2="500" :y2="dividerY" stroke="#555" stroke-dasharray="3 4" />
      <rect
        :x="164"
        :y="dividerY - 9"
        width="52"
        height="18"
        fill="#1a0f2e"
        rx="2"
      />
      <text
        x="190"
        :y="dividerY + 4"
        fill="#aaa"
        font-size="10"
        text-anchor="middle"
        letter-spacing="0.1em"
      >外 {{ gua.outerGua }} / 内 {{ gua.innerGua }}</text>
    </svg>
    <figcaption :style="figcaptionStyle">
      <span :style="{ color: 'var(--ysg-gold-400)' }">图 · </span>{{ figureCaption }}
    </figcaption>
  </figure>
</template>