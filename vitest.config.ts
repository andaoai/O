import { fileURLToPath, URL } from 'node:url'
import { defineConfig, configDefaults } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

/**
 * Vitest 独立配置
 *
 * ⚠️ 项目已从 SPA (Vite) 迁移到 VitePress，根 vite.config.ts 已删除。
 * Vitest 直接从这里 defineConfig，不再依赖任何主项目 vite 配置。
 * 只需保证：
 *   - @/ → src/ 别名（与 tsconfig.app.json 一致）
 *   - Vue SFC 支持（@vitejs/plugin-vue 由 VitePress 传递依赖引入，node_modules 里已有）
 *   - jsdom 环境
 */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, 'e2e/**'],
    root: fileURLToPath(new URL('./', import.meta.url)),
  },
})
