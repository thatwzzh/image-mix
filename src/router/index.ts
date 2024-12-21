import { createRouter, createWebHistory } from 'vue-router'
import ImageMix from '../views/ImageMix.vue'
import Step1 from '../views/Step1.vue'
import Step2 from '../views/Step2.vue'
import Step3 from '../views/Step3.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'imageMix',
      component: ImageMix,
    },
    {
      path: '/step1',
      name: 'step1',
      component: Step1,
    },
    {
      path: '/step2',
      name: 'step2',
      component: Step2,
    },
    {
      path: '/step3',
      name: 'step3',
      component: Step3,
    },
  ],
})

export default router
