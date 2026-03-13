<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCarsStore } from '../stores/cars'
import { SERVICE_TYPES, EXPENSE_CATEGORIES, SERVICE_COLORS, EXPENSE_COLORS } from '../types'
import { formatMoney } from '../utils'
import { Pie, Bar, Line } from 'vue-chartjs'
import {
  Chart as ChartJS, ArcElement, BarElement, LineElement, PointElement,
  CategoryScale, LinearScale, Tooltip, Legend, Filler,
} from 'chart.js'
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

ChartJS.register(ArcElement, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler)

const props = defineProps<{ id: string }>()
const router = useRouter()
const store = useCarsStore()

const car = store.getCarById(props.id)
const fuelRecords = store.getFuelRecords(props.id)
const serviceRecords = store.getServiceRecords(props.id)
const expenses = store.getExpenses(props.id)

const monthsBack = ref(6)

// Monthly spending data
const monthlyData = computed(() => {
  const now = new Date()
  const months: { label: string; fuel: number; service: number; expense: number; start: Date; end: Date }[] = []

  for (let i = monthsBack.value - 1; i >= 0; i--) {
    const d = subMonths(now, i)
    const start = startOfMonth(d)
    const end = endOfMonth(d)
    months.push({
      label: format(d, 'LLL yy', { locale: ru }),
      start,
      end,
      fuel: 0,
      service: 0,
      expense: 0,
    })
  }

  for (const r of fuelRecords.value) {
    const d = parseISO(r.date)
    for (const m of months) {
      if (isWithinInterval(d, { start: m.start, end: m.end })) {
        m.fuel += r.totalCost
        break
      }
    }
  }
  for (const r of serviceRecords.value) {
    const d = parseISO(r.date)
    for (const m of months) {
      if (isWithinInterval(d, { start: m.start, end: m.end })) {
        m.service += r.cost
        break
      }
    }
  }
  for (const r of expenses.value) {
    const d = parseISO(r.date)
    for (const m of months) {
      if (isWithinInterval(d, { start: m.start, end: m.end })) {
        m.expense += r.cost
        break
      }
    }
  }

  return months
})

const monthlyChartData = computed(() => ({
  labels: monthlyData.value.map(m => m.label),
  datasets: [
    {
      label: 'Топливо',
      data: monthlyData.value.map(m => Math.round(m.fuel)),
      backgroundColor: '#f97316',
    },
    {
      label: 'ТО',
      data: monthlyData.value.map(m => Math.round(m.service)),
      backgroundColor: '#14b8a6',
    },
    {
      label: 'Прочее',
      data: monthlyData.value.map(m => Math.round(m.expense)),
      backgroundColor: '#3b82f6',
    },
  ],
}))

// Cost breakdown pie
const costBreakdown = computed(() => {
  const fuel = fuelRecords.value.reduce((s, r) => s + r.totalCost, 0)
  const service = serviceRecords.value.reduce((s, r) => s + r.cost, 0)
  const expense = expenses.value.reduce((s, r) => s + r.cost, 0)
  return { fuel, service, expense, total: fuel + service + expense }
})

const pieChartData = computed(() => ({
  labels: ['Топливо', 'Обслуживание', 'Прочие расходы'],
  datasets: [{
    data: [
      Math.round(costBreakdown.value.fuel),
      Math.round(costBreakdown.value.service),
      Math.round(costBreakdown.value.expense),
    ],
    backgroundColor: ['#f97316', '#14b8a6', '#3b82f6'],
  }],
}))

// Service breakdown
const serviceBreakdown = computed(() => {
  const map: Record<string, number> = {}
  for (const r of serviceRecords.value) {
    map[r.type] = (map[r.type] || 0) + r.cost
  }
  return Object.entries(map)
    .map(([type, cost]) => ({ type, label: SERVICE_TYPES[type as keyof typeof SERVICE_TYPES] || type, cost, color: SERVICE_COLORS[type as keyof typeof SERVICE_COLORS] || '#757575' }))
    .sort((a, b) => b.cost - a.cost)
})

// Expense breakdown
const expenseBreakdown = computed(() => {
  const map: Record<string, number> = {}
  for (const r of expenses.value) {
    map[r.category] = (map[r.category] || 0) + r.cost
  }
  return Object.entries(map)
    .map(([cat, cost]) => ({ category: cat, label: EXPENSE_CATEGORIES[cat as keyof typeof EXPENSE_CATEGORIES] || cat, cost, color: EXPENSE_COLORS[cat as keyof typeof EXPENSE_COLORS] || '#757575' }))
    .sort((a, b) => b.cost - a.cost)
})

// Fuel price trend
const fuelPriceData = computed(() => {
  const sorted = [...fuelRecords.value].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  return {
    labels: sorted.map(r => {
      const [, m, d] = r.date.split('-')
      return `${d}.${m}`
    }),
    datasets: [{
      label: '₽/л',
      data: sorted.map(r => r.pricePerLiter),
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      fill: true,
      tension: 0.3,
      pointBackgroundColor: '#ef4444',
    }],
  }
})

// Avg monthly spend
const avgMonthlySpend = computed(() => {
  const months = monthlyData.value.filter(m => m.fuel + m.service + m.expense > 0)
  if (months.length === 0) return 0
  const total = months.reduce((s, m) => s + m.fuel + m.service + m.expense, 0)
  return total / months.length
})

// Cost per km — based on tracked distance, not total odometer
const costPerKm = computed(() => {
  if (!car.value || costBreakdown.value.total <= 0) return null
  const allMileages = [
    ...fuelRecords.value.map(r => r.mileage),
    ...serviceRecords.value.map(r => r.mileage),
  ]
  if (allMileages.length < 2) return null
  const distance = Math.max(...allMileages) - Math.min(...allMileages)
  if (distance <= 0) return null
  return costBreakdown.value.total / distance
})

// Fuel stats
const fuelStats = computed(() => {
  if (fuelRecords.value.length === 0) return null
  const totalLiters = fuelRecords.value.reduce((s, r) => s + r.liters, 0)
  const totalCost = fuelRecords.value.reduce((s, r) => s + r.totalCost, 0)
  const avgPrice = totalCost / totalLiters
  return { totalLiters, totalCost, avgPrice }
})

// Expense forecast — predict next month based on averages
const forecast = computed(() => {
  const months = monthlyData.value.filter(m => m.fuel + m.service + m.expense > 0)
  if (months.length < 2) return null
  const avgFuel = months.reduce((s, m) => s + m.fuel, 0) / months.length
  const avgService = months.reduce((s, m) => s + m.service, 0) / months.length
  const avgExpense = months.reduce((s, m) => s + m.expense, 0) / months.length
  // Trend: compare last 2 months to overall average
  const last2 = months.slice(-2)
  const recentTotal = last2.reduce((s, m) => s + m.fuel + m.service + m.expense, 0) / last2.length
  const overallAvg = avgFuel + avgService + avgExpense
  const trend = overallAvg > 0 ? ((recentTotal - overallAvg) / overallAvg) * 100 : 0
  return {
    fuel: Math.round(avgFuel),
    service: Math.round(avgService),
    expense: Math.round(avgExpense),
    total: Math.round(avgFuel + avgService + avgExpense),
    trend: Math.round(trend),
  }
})

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' as const } },
  scales: { x: { stacked: true }, y: { stacked: true } },
}

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' as const } },
}

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-8" v-if="car">
    <div class="flex items-center gap-3 mb-6">
      <button @click="router.back()" class="p-2 hover:bg-gray-100 rounded-lg transition">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd" />
        </svg>
      </button>
      <h1 class="text-2xl font-bold text-gray-900">Аналитика</h1>
      <span class="text-gray-400 text-sm">{{ car.brand }} {{ car.model }}</span>
    </div>

    <!-- Key metrics -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div class="text-xs text-gray-500 mb-1">Всего потрачено</div>
        <div class="text-lg font-bold text-red-600">{{ formatMoney(costBreakdown.total) }} ₽</div>
      </div>
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div class="text-xs text-gray-500 mb-1">В среднем/мес</div>
        <div class="text-lg font-bold text-purple-600">{{ formatMoney(avgMonthlySpend) }} ₽</div>
      </div>
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div class="text-xs text-gray-500 mb-1">Стоимость км</div>
        <div class="text-lg font-bold text-teal-600">{{ costPerKm ? costPerKm.toFixed(1) + ' ₽' : '—' }}</div>
      </div>
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div class="text-xs text-gray-500 mb-1">Ср. цена топлива</div>
        <div class="text-lg font-bold text-orange-600">{{ fuelStats ? fuelStats.avgPrice.toFixed(2) + ' ₽/л' : '—' }}</div>
      </div>
    </div>

    <!-- Expense forecast -->
    <div v-if="forecast" class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-5 border border-purple-100 mb-6">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold text-gray-900">Прогноз на следующий месяц</h3>
        <span v-if="forecast.trend > 5" class="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full">
          Тренд +{{ forecast.trend }}%
        </span>
        <span v-else-if="forecast.trend < -5" class="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
          Тренд {{ forecast.trend }}%
        </span>
      </div>
      <div class="grid grid-cols-4 gap-3 text-center">
        <div>
          <div class="text-lg font-bold text-purple-700">{{ formatMoney(forecast.total) }} ₽</div>
          <div class="text-xs text-gray-500">Всего</div>
        </div>
        <div>
          <div class="text-sm font-semibold text-orange-600">{{ formatMoney(forecast.fuel) }} ₽</div>
          <div class="text-xs text-gray-500">Топливо</div>
        </div>
        <div>
          <div class="text-sm font-semibold text-teal-600">{{ formatMoney(forecast.service) }} ₽</div>
          <div class="text-xs text-gray-500">ТО</div>
        </div>
        <div>
          <div class="text-sm font-semibold text-blue-600">{{ formatMoney(forecast.expense) }} ₽</div>
          <div class="text-xs text-gray-500">Прочее</div>
        </div>
      </div>
    </div>

    <!-- Monthly spending chart -->
    <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-gray-900">Расходы по месяцам</h3>
        <select v-model="monthsBack" class="text-sm border border-gray-200 rounded-lg px-3 py-1.5">
          <option :value="3">3 мес</option>
          <option :value="6">6 мес</option>
          <option :value="12">12 мес</option>
        </select>
      </div>
      <div class="h-64">
        <Bar :data="monthlyChartData" :options="barOptions" />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <!-- Cost breakdown pie -->
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 class="font-semibold text-gray-900 mb-4">Структура расходов</h3>
        <div class="h-56" v-if="costBreakdown.total > 0">
          <Pie :data="pieChartData" :options="pieOptions" />
        </div>
        <p v-else class="text-gray-400 text-sm text-center py-10">Нет данных</p>
      </div>

      <!-- Fuel price trend -->
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 class="font-semibold text-gray-900 mb-4">Динамика цен на топливо</h3>
        <div class="h-56" v-if="fuelRecords.length >= 2">
          <Line :data="fuelPriceData" :options="lineOptions" />
        </div>
        <p v-else class="text-gray-400 text-sm text-center py-10">Нужно минимум 2 заправки</p>
      </div>
    </div>

    <!-- Detailed breakdowns -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <!-- Service breakdown -->
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100" v-if="serviceBreakdown.length > 0">
        <h3 class="font-semibold text-gray-900 mb-4">Расходы на ТО</h3>
        <div class="space-y-3">
          <div v-for="s in serviceBreakdown" :key="s.type" class="flex items-center gap-3">
            <div class="w-3 h-3 rounded-full shrink-0" :style="{ backgroundColor: s.color }"></div>
            <span class="flex-1 text-sm text-gray-700">{{ s.label }}</span>
            <span class="font-semibold text-sm">{{ formatMoney(s.cost) }} ₽</span>
          </div>
        </div>
      </div>

      <!-- Expense breakdown -->
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100" v-if="expenseBreakdown.length > 0">
        <h3 class="font-semibold text-gray-900 mb-4">Прочие расходы</h3>
        <div class="space-y-3">
          <div v-for="e in expenseBreakdown" :key="e.category" class="flex items-center gap-3">
            <div class="w-3 h-3 rounded-full shrink-0" :style="{ backgroundColor: e.color }"></div>
            <span class="flex-1 text-sm text-gray-700">{{ e.label }}</span>
            <span class="font-semibold text-sm">{{ formatMoney(e.cost) }} ₽</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Fuel stats -->
    <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100" v-if="fuelStats">
      <h3 class="font-semibold text-gray-900 mb-4">Статистика топлива</h3>
      <div class="grid grid-cols-3 gap-4 text-center">
        <div>
          <div class="text-2xl font-bold text-orange-600">{{ fuelStats.totalLiters.toFixed(0) }}</div>
          <div class="text-xs text-gray-500 mt-1">Всего литров</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-red-600">{{ formatMoney(fuelStats.totalCost) }} ₽</div>
          <div class="text-xs text-gray-500 mt-1">Всего на топливо</div>
        </div>
        <div>
          <div class="text-2xl font-bold text-blue-600">{{ fuelRecords.length }}</div>
          <div class="text-xs text-gray-500 mt-1">Заправок</div>
        </div>
      </div>
    </div>
  </div>
</template>
