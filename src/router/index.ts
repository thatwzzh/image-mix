import { createRouter, createWebHistory } from 'vue-router'
import ImageMix from '../views/ImageMix.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'imageMix',
      component: ImageMix,
    },
  ],
})

export default router
