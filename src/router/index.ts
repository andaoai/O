import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { compasses } from '@/compasses'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    // 从罗盘注册表动态生成各罗盘路由（懒加载）
    ...compasses.map(c => ({
      path: `/compass/${c.id}`,
      name: c.id,
      component: c.component
    })),
    // 兜底：未匹配路径重定向回首页
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ],
})

export default router
