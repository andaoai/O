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
  }
]
