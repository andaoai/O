/**
 * 罗盘元数据
 *
 * 这是整个罗盘平台的注册表：首页卡片列表从这里读取。
 * 新增一个罗盘 = 建一个 views/XxxView.vue + docs/compass/xxx.md，
 * 再在下方 compasses 数组加一项。
 */
export interface CompassMeta {
  /** 路由 path 片段，如 'astronomy' → /compass/astronomy */
  id: string
  /** 显示名（首页卡片标题） */
  name: string
  /** 首页卡片描述 */
  description: string
  /** 分类（天文/风水/术数……），用于首页分组或筛选 */
  category?: string
}

export const compasses: CompassMeta[] = [
  {
    id: 'astronomy',
    name: '中华天文圆环',
    description: '360度刻度、二十四节气、二十八星宿、六十甲子、五行纳音、十天干、天干空亡、十二长生、十二地支、八门、四象、日月五星黄道与太极',
    category: '天文'
  },
  {
    id: 'liushi-jiazi',
    name: '六十甲子六环',
    description: '年柱、月柱、日柱、时柱、分柱、秒柱六环同步显示，实时跟随时间变化，当前干支高亮指示',
    category: '干支历'
  },
  {
    id: 'sixty-four-gua',
    name: '先天六十四卦盘',
    description: '伏羲／邵雍先天圆图，六十四卦按二进制位反转排列，乾南坤北、两仪对称，展示卦符、卦名与六爻爻象',
    category: '易学'
  },
  {
    id: 'jingfang',
    name: '京房十二消息卦盘',
    description: '京房卦气体系：外圈365天刻度，60卦六日七分环（360爻位装载365.25天），四正卦顶四季（震春离夏兑秋坎冬），十二消息卦环（复临泰大壮夬乾姤遁否观剥坤）',
    category: '易学'
  },
  {
    id: 'planet-mansion',
    name: '七曜入宿天象盘',
    description: '天极投影盖天图，赤道·黄道·白道三道斜交，日月五星各居其道并实时入二十八宿，外缠二十四节气与 360° 赤经刻度，跟随真实时间并可调',
    category: '天文'
  },
  {
    id: 'tropical-year',
    name: '回归年闰月盘',
    description: '365天回归年 vs 360度甲子纪年对比，二十四节气节/中气区分，农历月份含闰月特殊高亮，当日月相实时可视化，揭示「无中气置闰」的天文规律',
    category: '天文'
  },
  {
    id: 'guan-dou',
    name: '观斗盘',
    description: '模拟古人观察北斗——圆心真实北斗七星（岁差修正）+ 紫微垣东西两藩 + 勾陈一 + 地平圈（浏览器定位），外裹月建/时辰赤道环、月将/七曜/节气黄道环，从内到外一步步把北斗的方位读成时辰、季节与年岁',
    category: '天文'
  },
  {
    id: 'feifu',
    name: '卦关系盘',
    description: '六十四卦多种关系可视化——可选飞伏、互卦、对卦、综卦、交卦，有向箭头直观展示卦与卦之间的关联。五种关系类型可随意切换，与后天/先天布局自由组合',
    category: '易学'
  },
  {
    id: 'suzhou-stellar-map',
    name: '苏州石刻天文图',
    description: '南宋淳祐七年（1247）王致远勒石于苏州府学的天文图数字复原——三规圆（内规δ+55°/赤道/外规δ−55°）+ 二十八宿不等宽径向辐条 + 中央拱极北斗，斗柄随本地恒星时旋转并自动标注所指之宿（斗柄东指角、南指心、西指牛、北指奎）',
    category: '天文'
  }
]
