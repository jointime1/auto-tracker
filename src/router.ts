import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: () => import('./views/HomeView.vue') },
    { path: '/settings', component: () => import('./views/SettingsView.vue') },
    { path: '/car/add', component: () => import('./views/AddCarView.vue') },
    { path: '/car/:id', component: () => import('./views/CarView.vue'), props: true },
    { path: '/car/:id/fuel/add', component: () => import('./views/AddFuelView.vue'), props: true },
    { path: '/car/:id/service/add', component: () => import('./views/AddServiceView.vue'), props: true },
    { path: '/car/:id/expense/add', component: () => import('./views/AddExpenseView.vue'), props: true },
    { path: '/car/:id/analytics', component: () => import('./views/AnalyticsView.vue'), props: true },
    { path: '/car/:id/reminders', component: () => import('./views/RemindersView.vue'), props: true },
  ],
})

export default router
