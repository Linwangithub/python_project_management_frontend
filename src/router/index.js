import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { pinia } from '@/stores'

const routes = [
  { path: '/', redirect: '/login' },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/dashboard/DashboardView.vue'),
  },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

let restored = false

router.beforeEach(async (to) => {
  const auth = useAuthStore(pinia)

  if (!restored) {
    restored = true
    await auth.restore()
  }

  if (to.path !== '/login' && !auth.token) return '/login'
  if (to.path === '/login' && auth.token) return '/dashboard'
  return true
})
