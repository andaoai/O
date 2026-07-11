import { defineConfig } from 'vitepress'
import { fileURLToPath, URL } from 'node:url'

/**
 * 乙巳观文档站配置
 *
 * 部署路径：https://andaoai.github.io/O/
 * 与主项目 vite.config.ts 的 base 保持一致
 */
export default defineConfig({
  lang: 'zh-CN',
  title: '乙巳观',
  description: '道由天观 · 古代天文与易学算法的可视化观测台',

  // 与主项目一致的 base，配合 GitHub Pages 部署
  base: '/O/',

  // 文档产物输出到项目根 dist/（GitHub Actions 部署此目录）
  outDir: '../dist',

  // 复用主项目已有的品牌 favicon
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/O/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#4a2c7a' }],
    ['meta', { name: 'author', content: 'AnDaoAi' }],
  ],

  /**
   * 阶段二：让 md 能直接引用主项目组件
   *
   * VitePress 内嵌 Vite，暴露 `vite` 字段覆写内部构建配置。
   * 这里加一个 alias：`@` → 主项目 `src/`，与 vite.config.ts 保持一致。
   * 于是 md 里可写 `<ConstellationsRing />`（全局注册后）
   * 或 `import Foo from '@/components/…'`（在 vue 单文件里）。
   */
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('../../src', import.meta.url)),
      },
    },
    // 主项目组件依赖 astronomy-engine / tyme4ts，SSR 阶段不预打包
    // 直接标记为 noExternal，让 Vite SSR 内联处理，避免 dev/build 时的 CJS 边界问题
    ssr: {
      noExternal: ['astronomy-engine', 'tyme4ts'],
    },
  },

  // 强制深色模式（黑底紫金是本站视觉基调）
  appearance: 'force-dark',

  // 关闭默认的 vitepress 页脚
  cleanUrls: true,

  themeConfig: {
    // 站内 logo（同样复用品牌资产）
    logo: '/andaoai-logo.svg',
    siteTitle: '乙巳观',

    nav: [
      { text: '首页', link: '/' },
      { text: '古籍笔记', link: '/books/' },
      { text: '通用概念', link: '/concepts/' },
      { text: '罗盘', link: '/compass/' },
      { text: '开发文档', link: '/dev/' },
    ],

    sidebar: {
      '/books/': [
        {
          text: '古籍笔记',
          items: [{ text: '导读', link: '/books/' }],
        },
        {
          text: '乙巳占',
          collapsed: false,
          items: [
            { text: '书籍导读', link: '/books/yisizhan/' },
            {
              text: '卷一 · 天象',
              collapsed: false,
              items: [
                { text: '一 · 天说', link: '/books/yisizhan/juan-1/tianshuo' },
              ],
            },
          ],
        },
        {
          text: '京氏易傳',
          collapsed: false,
          items: [
            { text: '书籍导读', link: '/books/京氏易傳/' },
            {
              text: '卷上 · 乾宫',
              collapsed: false,
              items: [
                { text: '乾', link: '/books/京氏易傳/乾卦' },
                { text: '姤', link: '/books/京氏易傳/姤卦' },
                { text: '遯', link: '/books/京氏易傳/遯卦' },
                { text: '否', link: '/books/京氏易傳/否卦' },
                { text: '觀', link: '/books/京氏易傳/觀卦' },
                { text: '剥', link: '/books/京氏易傳/剥卦' },
                { text: '𣈆', link: '/books/京氏易傳/𣈆卦' },
                { text: '大有', link: '/books/京氏易傳/大有卦' },
              ],
            },
            {
              text: '卷上 · 震宫',
              collapsed: false,
              items: [
                { text: '震', link: '/books/京氏易傳/震卦' },
                { text: '豫', link: '/books/京氏易傳/豫卦' },
                { text: '解', link: '/books/京氏易傳/解卦' },
                { text: '恒', link: '/books/京氏易傳/恒卦' },
                { text: '升', link: '/books/京氏易傳/升卦' },
                { text: '井', link: '/books/京氏易傳/井卦' },
                { text: '大过', link: '/books/京氏易傳/大过卦' },
                { text: '随', link: '/books/京氏易傳/随卦' },
              ],
            },
            {
              text: '卷上 · 坎宫',
              collapsed: false,
              items: [
                { text: '坎', link: '/books/京氏易傳/坎卦' },
                { text: '节', link: '/books/京氏易傳/节卦' },
                { text: '屯', link: '/books/京氏易傳/屯卦' },
                { text: '既济', link: '/books/京氏易傳/既济卦' },
                { text: '革', link: '/books/京氏易傳/革卦' },
                { text: '丰', link: '/books/京氏易傳/丰卦' },
                { text: '明夷', link: '/books/京氏易傳/明夷卦' },
                { text: '师', link: '/books/京氏易傳/师卦' },
              ],
            },
            {
              text: '卷上 · 艮宫',
              collapsed: false,
              items: [
                { text: '艮', link: '/books/京氏易傳/艮卦' },
                { text: '贲', link: '/books/京氏易傳/贲卦' },
              ],
            },
          ],
        },
      ],
      '/concepts/': [
        {
          text: '通用概念',
          items: [{ text: '概览', link: '/concepts/' }],
        },
        {
          text: '时间与历法',
          collapsed: false,
          items: [
            { text: '干支 · 六十甲子', link: '/concepts/ganzhi' },
            { text: '二十四节气 · 节气与中气', link: '/concepts/solar-terms' },
            { text: '十二辰 · 十二时辰', link: '/concepts/shichen' },
            { text: '闰月 · 无中气置闰法', link: '/concepts/leap-month' },
            { text: '岁差', link: '/concepts/precession' },
          ],
        },
        {
          text: '空间与星辰',
          collapsed: false,
          items: [
            { text: '二十八宿 · 距星', link: '/concepts/constellations' },
            { text: '四象 · 青龙白虎朱雀玄武', link: '/concepts/si-xiang' },
            { text: '七曜 · 日月五星', link: '/concepts/seven-luminaries' },
          ],
        },
        {
          text: '象数与义理',
          collapsed: false,
          items: [
            { text: '六十四卦 · 序卦', link: '/concepts/sixty-four-gua' },
            { text: '八宫卦', link: '/concepts/eight-palace' },
          ],
        },
        {
          text: '占验方法',
          collapsed: false,
          items: [
            { text: '京房卦气 · 六日七分', link: '/concepts/jingfang-guaqi' },
            { text: '纳甲', link: '/concepts/najia' },
            { text: '世应爻位', link: '/concepts/shi-ying' },
            { text: '飞伏 · 显隐互藏', link: '/concepts/gua-relation' },
          ],
        },
      ],
      '/dev/': [
        {
          text: '开发文档',
          items: [
            { text: '总览', link: '/dev/' },
            { text: '组件 API 与类型契约', link: '/dev/components' },
            { text: 'Astronomy Engine 集成', link: '/dev/astronomy-engine' },
          ],
        },
      ],
      // /compass/* 走 CompassLayout 全屏 layout，不显示 sidebar
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/andaoai/O' },
    ],

    outline: {
      level: [2, 3],
      label: '本页目录',
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },

    lastUpdated: {
      text: '最后更新',
      formatOptions: {
        dateStyle: 'medium',
        timeStyle: undefined,
      },
    },

    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    sidebarMenuLabel: '目录',
    returnToTopLabel: '回到顶部',

    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: { buttonText: '搜索', buttonAriaLabel: '搜索文档' },
              modal: {
                displayDetails: '展开详情',
                resetButtonTitle: '清除',
                backButtonTitle: '关闭',
                noResultsText: '无匹配结果',
                footer: {
                  selectText: '选择',
                  navigateText: '切换',
                  closeText: '关闭',
                },
              },
            },
          },
        },
      },
    },

    footer: {
      message: '道由天观 · 静观其变',
      copyright: '© 2026 AnDaoAi · 乙巳观',
    },
  },
})
