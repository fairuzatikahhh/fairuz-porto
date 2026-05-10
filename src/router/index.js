import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import RayspeedDetail from '../pages/RayspeedDetail.vue'
import NashirDetail from '../pages/NashirDetail.vue'
import TriesDetail from '../pages/TriesDetail.vue'
import BuckstoreDetail from '../pages/BuckstoreDetail.vue'
import JannahDetail from '../pages/JannahDetail.vue'
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
  },
  {
    path: '/project/tries',
    name: 'TriesDetail',
    component: TriesDetail
  },
  {
    path: '/project/buckstore',
    name: 'BuckstoreDetail',
    component: BuckstoreDetail
  },
  {
    path: '/project/jannah',
    name: 'JannahDetail',
    component: JannahDetail
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
