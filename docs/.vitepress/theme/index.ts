/**
 * 乙巳观 · 主题入口
 *
 * ════════════════════════════════════════════════════════════════
 *  阶段一：注入紫金 tokens.css，扩展 DefaultTheme
 *  阶段二：enhanceApp 全局注册罗盘环组件（供 md 直接书写）
 *  阶段四（重构）：所有罗盘 View 也全局注册 → docs/compass/*.md 可直接调用
 *                CompassLayout 作为自定义 layout，实现全屏罗盘页
 * ════════════════════════════════════════════════════════════════
 */

import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import type { Theme } from 'vitepress'
import { useData } from 'vitepress'
import './tokens.css'

// md 内嵌罗盘通用外壳
import CompassFigure from './components/CompassFigure.vue'

// 自定义 layout
import CompassLayout from './layouts/CompassLayout.vue'

// 主项目环组件（走 @ alias → ../../src/components/rings/*）
import ConstellationsRing from '@/components/rings/ConstellationsRing.vue'
import SiXiangRing from '@/components/rings/SiXiangRing.vue'
import SolarTermsRing from '@/components/rings/SolarTermsRing.vue'
import SolarTermsPointRing from '@/components/rings/SolarTermsPointRing.vue'
import DataRing from '@/components/rings/DataRing.vue'
import SixtyJiaziRing from '@/components/rings/SixtyJiaziRing.vue'
import BranchesRing from '@/components/rings/BranchesRing.vue'
import StemsRing from '@/components/rings/StemsRing.vue'
import LunarMonthsRing from '@/components/rings/LunarMonthsRing.vue'
import GuaRing from '@/components/rings/GuaRing.vue'
import JingFangGuaRing from '@/components/rings/JingFangGuaRing.vue'
import JingFangEightPalaceRing from '@/components/rings/JingFangEightPalaceRing.vue'
import NajiaRing from '@/components/rings/NajiaRing.vue'
import ShiYingRing from '@/components/rings/ShiYingRing.vue'
import SevenLuminariesRing from '@/components/rings/SevenLuminariesRing.vue'
import MansionDegreeRing from '@/components/rings/MansionDegreeRing.vue'
import DegreeScale from '@/components/rings/DegreeScale.vue'

// 单卦静态图（书籍笔记专用，非环组件）
import SingleGuaChart from '@/components/gua/SingleGuaChart.vue'

// 罗盘一览页（挂到 docs/compass/index.md，走默认主题 layout）
import HomeView from '@/views/HomeView.vue'
// 罗盘全屏 View（挂到 docs/compass/*.md，走 CompassLayout）
import AstronomyView from '@/views/AstronomyView.vue'
import LiushiJiaziView from '@/views/LiushiJiaziView.vue'
import SixtyFourGuaView from '@/views/SixtyFourGuaView.vue'
import JingFangView from '@/views/JingFangView.vue'
import PlanetMansionView from '@/views/PlanetMansionView.vue'
import TropicalYearView from '@/views/TropicalYearView.vue'
import GuanDouView from '@/views/GuanDouView.vue'
import FeifuView from '@/views/FeifuView.vue'
import SuzhouStellarMapView from '@/views/SuzhouStellarMapView.vue'

// 飞伏圆心 + 文本环（RingStack 架构）
import FeifuCenter from '@/components/centers/FeifuCenter.vue'
import FeifuTextRing from '@/components/rings/FeifuTextRing.vue'

export default {
  extends: DefaultTheme,

  /**
   * 根据 frontmatter.layout 分派布局：
   *   - layout: compass → 全屏罗盘 layout
   *   - 其它            → DefaultTheme.Layout（含 nav/sidebar/aside）
   */
  Layout: () => {
    const { frontmatter } = useData()
    if (frontmatter.value.layout === 'compass') {
      return h(CompassLayout)
    }
    return h(DefaultTheme.Layout)
  },

  enhanceApp({ app }) {
    // 罗盘插图外壳
    app.component('CompassFigure', CompassFigure)

    // 环组件全局注册（供 md 内嵌为插图）
    app.component('ConstellationsRing', ConstellationsRing)
    app.component('SiXiangRing', SiXiangRing)
    app.component('SolarTermsRing', SolarTermsRing)
    app.component('SolarTermsPointRing', SolarTermsPointRing)
    app.component('DataRing', DataRing)
    app.component('SixtyJiaziRing', SixtyJiaziRing)
    app.component('BranchesRing', BranchesRing)
    app.component('StemsRing', StemsRing)
    app.component('LunarMonthsRing', LunarMonthsRing)
    app.component('GuaRing', GuaRing)
    app.component('JingFangGuaRing', JingFangGuaRing)
    app.component('JingFangEightPalaceRing', JingFangEightPalaceRing)
    app.component('NajiaRing', NajiaRing)
    app.component('ShiYingRing', ShiYingRing)
    app.component('SevenLuminariesRing', SevenLuminariesRing)
    app.component('MansionDegreeRing', MansionDegreeRing)
    app.component('DegreeScale', DegreeScale)
    app.component('SingleGuaChart', SingleGuaChart)

    // 罗盘 View 全局注册（供 docs/compass/*.md 直接调用）
    app.component('HomeView', HomeView)   // /compass/ 罗盘一览（page layout）
    app.component('AstronomyView', AstronomyView)
    app.component('LiushiJiaziView', LiushiJiaziView)
    app.component('SixtyFourGuaView', SixtyFourGuaView)
    app.component('JingFangView', JingFangView)
    app.component('PlanetMansionView', PlanetMansionView)
    app.component('TropicalYearView', TropicalYearView)
    app.component('GuanDouView', GuanDouView)
    app.component('FeifuView', FeifuView)
    app.component('SuzhouStellarMapView', SuzhouStellarMapView)
    app.component('FeifuCenter', FeifuCenter)
    app.component('FeifuTextRing', FeifuTextRing)
  },
} satisfies Theme

/**
 * 📌 md 里传静态数据的推荐写法（因 md 上下文默认取不到 import 变量）：
 *
 * ```md
 * <script setup>
 * import { siXiang } from '@/data/rings'
 * </script>
 *
 * <CompassFigure caption="四象">
 *   <DataRing :data="siXiang" :radius="260" />
 * </CompassFigure>
 * ```
 *
 * VitePress 的 md 支持顶部 <script setup>，块内的 import 在 md 主体里可直接用。
 */
