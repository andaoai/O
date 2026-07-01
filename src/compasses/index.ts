import type { Component } from 'vue'

/**
 * 罗盘元数据
 *
 * 这是整个罗盘平台的注册表：首页列表和路由都从这里读取。
 * 新增一个罗盘 = 建一个 views/XxxView.vue + 在下方 compasses 数组加一项。
 */
export interface CompassMeta {
  /** 路由 path 片段，如 'astronomy' → /compass/astronomy */
  id: string
  /** 显示名（首页卡片标题、路由名） */
  name: string
  /** 首页卡片描述 */
  description: string
  /** 分类（天文/风水/术数……），用于首页分组或筛选 */
  category?: string
  /** 懒加载的页面视图组件 */
  component: () => Promise<Component>
}

export const compasses: CompassMeta[] = [
  {
    id: 'astronomy',
    name: '中华天文圆环',
    description: '360度刻度、二十四节气、二十八星宿、六十甲子、五行纳音、十天干、天干空亡、十二长生、十二地支、八门、四象、日月五星黄道与太极',
    category: '天文',
    component: () => import('@/views/AstronomyView.vue')
  },
  {
    id: 'liushi-jiazi',
    name: '六十甲子六环',
    description: '年柱、月柱、日柱、时柱、分柱、秒柱六环同步显示，实时跟随时间变化，当前干支高亮指示',
    category: '干支历',
    component: () => import('@/views/LiushiJiaziView.vue')
  },
  {
    id: 'sixty-four-gua',
    name: '先天六十四卦盘',
    description: '伏羲／邵雍先天圆图，六十四卦按二进制位反转排列，乾南坤北、两仪对称，展示卦符、卦名与六爻爻象',
    category: '易学',
    component: () => import('@/views/SixtyFourGuaView.vue')
  },
  {
    id: 'jingfang',
    name: '京房十二消息卦盘',
    description: '京房卦气体系：外圈365天刻度，60卦六日七分环（360爻位装载365.25天），四正卦顶四季（震春离夏兑秋坎冬），十二消息卦环（复临泰大壮夬乾姤遁否观剥坤）',
    category: '易学',
    component: () => import('@/views/JingFangView.vue')
  },
  {
    id: 'planet-mansion',
    name: '七曜入宿天象盘',
    description: '天极投影盖天图，赤道·黄道·白道三道斜交，日月五星各居其道并实时入二十八宿，外缠二十四节气与 360° 赤经刻度，跟随真实时间并可调',
    category: '天文',
    component: () => import('@/views/PlanetMansionView.vue')
  },
  {
    id: 'tropical-year',
    name: '回归年闰月盘',
    description: '365天回归年 vs 360度甲子纪年对比，二十四节气节/中气区分，农历月份含闰月特殊高亮，当日月相实时可视化，揭示「无中气置闰」的天文规律',
    category: '天文',
    component: () => import('@/views/TropicalYearView.vue')
  }
]
