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

  // 忽略指向未创建 compasses/说明页的死链
  ignoreDeadLinks: [
    /^\/compasses\//,
  ],

  themeConfig: {
    // 站内 logo（同样复用品牌资产）
    logo: '/andaoai-logo.svg',
    siteTitle: '乙巳观',

    nav: [
      { text: '首页', link: '/' },
      { text: '古籍笔记', link: '/books/' },
      { text: '通用概念', link: '/concepts/' },
      { text: '罗盘', link: '/compass/' },
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
      ],
      '/concepts/': [
        {
          text: '通用概念',
          items: [{ text: '概览', link: '/concepts/' }],
        },
      ],
      '/compasses/': [
        {
          text: '罗盘',
          items: [{ text: '罗盘一览', link: '/compass/' }],
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
