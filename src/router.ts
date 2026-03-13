import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import CarView from './views/CarView.vue'
import AddCarView from './views/AddCarView.vue'
import AddFuelView from './views/AddFuelView.vue'
import AddServiceView from './views/AddServiceView.vue'
import AddExpenseView from './views/AddExpenseView.vue'
import AnalyticsView from './views/AnalyticsView.vue'
import RemindersView from './views/RemindersView.vue'
import SettingsView from './views/SettingsView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/settings', component: SettingsView },
    { path: '/car/add', component: AddCarView },
    { path: '/car/:id', component: CarView, props: true },
    { path: '/car/:id/fuel/add', component: AddFuelView, props: true },
    { path: '/car/:id/service/add', component: AddServiceView, props: true },
    { path: '/car/:id/expense/add', component: AddExpenseView, props: true },
    { path: '/car/:id/analytics', component: AnalyticsView, props: true },
    { path: '/car/:id/reminders', component: RemindersView, props: true },
  ],
})

export default router
