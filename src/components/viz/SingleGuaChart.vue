<script setup lang="ts">
/**
 * 单卦属性图（爻位 · 爻辞 · 卦五行 · 卦阴阳 · 爻线 · 当位 · 纳甲 · 五行 · 六亲）
 *
 * ⚠️ 完全静态 —— 单卦是不随时间变化的，无 time prop、无 ClientOnly、无响应式依赖。
 *
 * 数据派生：全部走 utils/guaInfo.ts#deriveGuaInfo，组件层不重复实现。
 * 使用位置：VitePress md 里直接 <SingleGuaChart :value="63" />，或古籍注解页复用。
 *
 * 核心设计：
 *   - 所有行数据预计算为 YaoRow[]，模板纯声明式渲染
 *   - 只有爻辞来自外部 props（不稳定因素），其余全部由 value 确定
 *
 * 版式：
 *   - 深紫底 SVG，六行等高（六爻自上而下：上爻→初爻），每行 9 列
 *   - 阳爻：整段横条；阴爻：中间断开的两段横条
 *   - 世爻标金色「世」、应爻标青色「应」
 *   - 三爻/四爻之间虚线分隔内外卦
 *   - 卦五行/卦阴阳：合并三行标注（外卦标五爻、内卦标二爻）
 *   - 当位列：阳爻居阳位(1/3/5)或阴爻居阴位(2/4/6)为当位，否则为失位
 */
import { computed } from 'vue'
import { deriveGuaInfo, ELEMENT_COLORS } from '@/utils/guaInfo'

// =========================================================================
// Props
// =========================================================================

interface Props {
  /** 六爻二进制编码 0-63（bit0=初爻，阳=1） */
  value: number
  /** 爻辞覆盖，长度 6，index 0 = 初爻文字（如"潜龙勿用"） */
  yaoText?: readonly string[]
  /** 图题（默认自动生成 "乾卦（䷀） · 乾宫 · 属金" 等） */
  caption?: string
  /** 图宽（px），默认 920 */
  width?: number
}

const props = withDefaults(defineProps<Props>(), {
  width: 920
})

// =========================================================================
// 布局常量
// =========================================================================

const L = {
  colX: {
    pos: 30,        // 爻位
    text: 110,      // 爻辞
    gua: 470,       // 卦五行（外卦/内卦），合并三行标注
    guaYinYang: 530,// 卦阴阳（阳卦/阴卦），合并三行标注
    lineStart: 590, // 爻线起点
    lineWidth: 80,
    dangWei: 690,   // 当位（爻线与纳甲之间）
    najia: 740,     // 纳甲
    element: 810,   // 五行
    liuqin: 870     // 六亲
  },
  rowY: {
    header: 66,
    first: 90,
    step: 40
  },
  width: 920,
  height: 340
} as const

// =========================================================================
// 纯工具函数（无响应式依赖）
// =========================================================================

const POSITIONS = ['初', '二', '三', '四', '五', '上'] as const

/** 中文爻位名：阳爻 = 九，阴爻 = 六 */
function yaoPositionName(index: number, yang: boolean): string {
  const suffix = yang ? '九' : '六'
  const prefix = POSITIONS[index]!
  return (index === 0 || index === 5) ? prefix + suffix : suffix + prefix
}

/** 八卦阴阳标签 */
const yinYangLabelOf = (yang: boolean) => yang ? '阳卦' : '阴卦'

// =========================================================================
// 预计算行数据（核心：模板只消费此数组，零逻辑）
// =========================================================================

interface YaoRow {
  posLabel: string
  posColor: string
  isShi: boolean
  isYing: boolean
  yaoText: string        // ← 唯一不稳定因素
  guaLabel: string
  guaColor: string
  showGua: boolean       // 外卦标五爻、内卦标二爻时可见
  yinYangLabel: string
  lineColor: string
  yang: boolean
  dangWeiLabel: string
  dangWeiColor: string
  najia: string
  elementLabel: string
  elementColor: string
  liuqin: string
}

/** 从上到下（上爻→初爻）的预计算行数据 */
const rows = computed<YaoRow[]>(() => {
  const g = gua.value
  return [...g.yaos].reverse().map(yao => {
    const isOuter = yao.index >= 3
    const triEl = isOuter ? g.outerElement : g.innerElement
    const triYang = isOuter ? g.outerYang : g.innerYang
    const triName = isOuter ? g.outerGua : g.innerGua
    const showTri = yao.index === 4 || yao.index === 1

    return {
      posLabel: yaoPositionName(yao.index, yao.yang),
      posColor: yao.isShi ? '#f1c40f' : yao.isYing ? '#3498db' : '#aaa',
      isShi: yao.isShi,
      isYing: yao.isYing,
      yaoText: props.yaoText?.[yao.index] ?? '',
      guaLabel: `${triName}${triEl}`,
      guaColor: ELEMENT_COLORS[triEl],
      showGua: showTri,
      yinYangLabel: yinYangLabelOf(triYang),
      lineColor: ELEMENT_COLORS[yao.element],
      yang: yao.yang,
      dangWeiLabel: yao.dangWei ? '当位' : '失位',
      dangWeiColor: yao.dangWei ? '#27AE60' : '#C0392B',
      najia: yao.najia,
      elementLabel: yao.element,
      elementColor: ELEMENT_COLORS[yao.element],
      liuqin: yao.liuqin
    }
  })
})

// =========================================================================
// 派生
// =========================================================================

const gua = computed(() => deriveGuaInfo(props.value))

const figureCaption = computed(() => {
  if (props.caption) return props.caption
  const g = gua.value
  return `${g.name}卦（${g.unicode}） · ${g.palace}宫 · ${g.shiyingType} · 属${g.palaceElement}`
})

/** 内外卦分界虚线 y 坐标（三爻和四爻之间） */
const dividerY = L.rowY.first + 2 * L.rowY.step + L.rowY.step / 2

/** 表头定义 */
const headers = [
  { x: L.colX.pos, label: '爻位' },
  { x: L.colX.text, label: '爻辞' },
  { x: L.colX.gua, label: '卦五行' },
  { x: L.colX.guaYinYang, label: '卦阴阳' },
  { x: L.colX.lineStart + 10, label: '爻线' },
  { x: L.colX.dangWei, label: '当位' },
  { x: L.colX.najia, label: '纳甲' },
  { x: L.colX.element, label: '五行' },
  { x: L.colX.liuqin, label: '六亲' }
]

// =========================================================================
// 样式
// =========================================================================

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
      :viewBox="`0 0 ${L.width} ${L.height}`"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      :aria-label="`${gua.name}卦属性图`"
      :style="svgStyle"
    >
      <!-- 背景 -->
      <rect x="0" y="0" :width="L.width" :height="L.height" fill="#1a0f2e" rx="6" />

      <!-- 标题 -->
      <text
        :x="L.width / 2" y="30"
        text-anchor="middle"
        fill="#f1c40f"
        font-size="18"
        font-family="serif"
        letter-spacing="0.2em"
      >{{ gua.name }} {{ gua.unicode }} · {{ gua.palace }}宫 · 属{{ gua.palaceElement }} · {{ gua.hexagramYinYang }}</text>

      <!-- 表头 -->
      <text
        v-for="h in headers"
        :key="h.label"
        :x="h.x"
        :y="L.rowY.header"
        fill="#aaa"
        font-size="12"
      >{{ h.label }}</text>

      <!-- 六爻行（自上而下：上爻→初爻） -->
      <g
        v-for="(row, idx) in rows"
        :key="idx"
        :transform="`translate(0, ${L.rowY.first + idx * L.rowY.step})`"
      >
        <!-- 爻位 -->
        <text
          :x="L.colX.pos" y="0"
          :fill="row.posColor"
          font-size="14" font-family="serif"
          dominant-baseline="central"
        >{{ row.posLabel }}<tspan v-if="row.isShi" fill="#f1c40f"> 世</tspan><tspan v-if="row.isYing" fill="#3498db"> 应</tspan></text>

        <!-- 爻辞（唯一不稳定列） -->
        <text :x="L.colX.text" y="0" fill="#ddd" font-size="13" dominant-baseline="central">{{ row.yaoText }}</text>

        <!-- 卦五行（外卦标五爻、内卦标二爻，合并三行） -->
        <text v-if="row.showGua" :x="L.colX.gua" y="0" :fill="row.guaColor" font-size="13" dominant-baseline="central">{{ row.guaLabel }}</text>

        <!-- 卦阴阳（外卦标五爻、内卦标二爻，合并三行） -->
        <text v-if="row.showGua" :x="L.colX.guaYinYang" y="0" fill="#bbb" font-size="13" dominant-baseline="central">{{ row.yinYangLabel }}</text>

        <!-- 爻线 -->
        <rect
          v-if="row.yang"
          :x="L.colX.lineStart" y="-5"
          :width="L.colX.lineWidth" height="10"
          :fill="row.lineColor"
        />
        <template v-else>
          <rect
            :x="L.colX.lineStart" y="-5"
            :width="L.colX.lineWidth * 0.4" height="10"
            :fill="row.lineColor"
          />
          <rect
            :x="L.colX.lineStart + L.colX.lineWidth * 0.6" y="-5"
            :width="L.colX.lineWidth * 0.4" height="10"
            :fill="row.lineColor"
          />
        </template>

        <!-- 当位 / 失位 -->
        <text :x="L.colX.dangWei" y="0" :fill="row.dangWeiColor" font-size="13" dominant-baseline="central">{{ row.dangWeiLabel }}</text>

        <!-- 纳甲 / 五行 / 六亲 -->
        <text :x="L.colX.najia"   y="0" fill="#eee"                           font-size="14" dominant-baseline="central">{{ row.najia }}</text>
        <text :x="L.colX.element" y="0" :fill="row.elementColor"               font-size="14" dominant-baseline="central">{{ row.elementLabel }}</text>
        <text :x="L.colX.liuqin"  y="0" :fill="row.elementColor"               font-size="14" dominant-baseline="central">{{ row.liuqin }}</text>
      </g>

      <!-- 内外卦分界虚线 -->
      <line x1="20" :y1="dividerY" :x2="L.width - 20" :y2="dividerY" stroke="#555" stroke-dasharray="3 4" />
    </svg>

    <figcaption :style="figcaptionStyle">
      <span :style="{ color: 'var(--ysg-gold-400)' }">图 · </span>{{ figureCaption }}
    </figcaption>
  </figure>
</template>
