import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import RayspeedDetail from '../pages/RayspeedDetail.vue'
import NashirDetail from '../pages/NashirDetail.vue'
const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/project/rayspeed',
    name: 'RayspeedDetail',
    component: RayspeedDetail
  },
  {
    path: '/project/nashir',
    name: 'NashirDetail',
    component: NashirDetail
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      }
    }
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

export default router
