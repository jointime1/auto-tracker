<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useCarsStore } from '../stores/cars'
import { SERVICE_TYPES, EXPENSE_CATEGORIES, SERVICE_COLORS, EXPENSE_COLORS } from '../types'
import ConsumptionChart from '../components/ConsumptionChart.vue'

type Tab = 'overview' | 'fuel' | 'service' | 'expenses'

const props = defineProps<{ id: string }>()
const router = useRouter()
const store = useCarsStore()

const car = store.getCarById(props.id)
const fuelRecords = store.getFuelRecords(props.id)
const serviceRecords = store.getServiceRecords(props.id)
const expenses = store.getExpenses(props.id)
const reminders = store.getReminders(props.id)

const urgentReminders = computed(() => {
  const now = new Date()
  let count = 0
  // Date-based
  for (const r of reminders.value) {
    const diff = Math.ceil((new Date(r.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diff <= 14) count++
  }
  // Mileage-based
  if (car.value) {
    for (const s of serviceRecords.value) {
      if (s.nextMileage && s.nextMileage - car.value.mileage <= 1000) count++
    }
  }
  return count
})

// Redirect if car doesn't exist
watchEffect(() => {
  if (!car.value) router.replace('/')
})

const tab = ref<Tab>('overview')

const totalSpent = computed(() => {
  const fuel = fuelRecords.value.reduce((s, r) => s + r.totalCost, 0)
  const service = serviceRecords.value.reduce((s, r) => s + r.cost, 0)
  const exp = expenses.value.reduce((s, r) => s + r.cost, 0)
  return fuel + service + exp
})

const avgConsumption = computed(() => {
  const sorted = [...fuelRecords.value].sort((a, b) => a.mileage - b.mileage)
  if (sorted.length < 2) return null
  let totalLiters = 0
  for (let i = 1; i < sorted.length; i++) {
    totalLiters += sorted[i].liters
  }
  const distance = sorted[sorted.length - 1].mileage - sorted[0].mileage
  if (distance <= 0) return null
  return (totalLiters / distance) * 100
})

const nextService = computed(() => {
  if (!car.value) return null
  const pending = serviceRecords.value.filter(
    s => s.nextMileage && s.nextMileage > car.value!.mileage
  )
  if (pending.length === 0) return null
  return pending.reduce((a, b) => (a.nextMileage! < b.nextMileage! ? a : b))
})

const consumptionMap = computed(() => {
  const sorted = [...fuelRecords.value].sort((a, b) => a.mileage - b.mileage)
  const map = new Map<string, number>()
  for (let i = 1; i < sorted.length; i++) {
    const dist = sorted[i].mileage - sorted[i - 1].mileage
    if (dist > 0) {
      map.set(sorted[i].id, (sorted[i].liters / dist) * 100)
    }
  }
  return map
})

const costPerKm = computed(() => {
  if (!car.value || car.value.mileage <= 0 || totalSpent.value <= 0) return null
  return totalSpent.value / car.value.mileage
})

function formatDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}`
}

function formatMoney(n: number) {
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function confirmDelete(name: string, action: () => void) {
  if (confirm(`Удалить "${name}"?`)) action()
}

function deleteCar() {
  if (!confirm('Удалить автомобиль и все его данные?')) return
  store.deleteCar(props.id)
  router.push('/')
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8" v-if="car">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <button @click="router.push('/')" class="p-2 hover:bg-gray-100 rounded-lg transition">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd" />
        </svg>
      </button>
      <h1 class="text-2xl font-bold text-gray-900 flex-1">{{ car.brand }} {{ car.model }}</h1>
      <button @click="deleteCar" class="p-2 hover:bg-red-50 rounded-lg transition text-red-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
      <button v-for="t in ([
        { key: 'overview', label: 'Обзор' },
        { key: 'fuel', label: 'Топливо' },
        { key: 'service', label: 'ТО' },
        { key: 'expenses', label: 'Расходы' },
      ] as const)" :key="t.key"
        @click="tab = t.key"
        :class="[
          'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition',
          tab === t.key ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
        ]"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- Overview -->
    <div v-if="tab === 'overview'" class="space-y-4">
      <!-- Car info -->
      <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
        <div class="text-4xl mb-3">🚗</div>
        <h2 class="text-xl font-bold text-gray-900">{{ car.brand }} {{ car.model }} {{ car.year }}</h2>
        <p v-if="car.licensePlate" class="text-gray-500 mt-1">{{ car.licensePlate }}</p>
        <p class="text-lg font-semibold text-gray-700 mt-2">{{ car.mileage.toLocaleString('ru-RU') }} км</p>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 gap-3">
        <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div class="text-sm text-gray-500 mb-1">Всего потрачено</div>
          <div class="text-lg font-bold text-red-600">{{ formatMoney(totalSpent) }} ₽</div>
        </div>
        <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div class="text-sm text-gray-500 mb-1">Расход</div>
          <div class="text-lg font-bold text-blue-600">
            {{ avgConsumption ? avgConsumption.toFixed(1) + ' л/100км' : '—' }}
          </div>
        </div>
        <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div class="text-sm text-gray-500 mb-1">Заправок</div>
          <div class="text-lg font-bold text-orange-500">{{ fuelRecords.length }}</div>
        </div>
        <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div class="text-sm text-gray-500 mb-1">Стоимость км</div>
          <div class="text-lg font-bold text-teal-600">
            {{ costPerKm ? costPerKm.toFixed(1) + ' ₽/км' : '—' }}
          </div>
        </div>
      </div>

      <!-- Next service warning -->
      <div v-if="nextService" class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <span class="text-xl">⚠️</span>
        <div>
          <p class="font-semibold text-amber-800">Следующее ТО</p>
          <p class="text-amber-700 text-sm">
            {{ SERVICE_TYPES[nextService.type] }} через
            {{ (nextService.nextMileage! - car.mileage).toLocaleString('ru-RU') }} км
          </p>
        </div>
      </div>

      <!-- Chart -->
      <div v-if="fuelRecords.length >= 2" class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 class="font-semibold text-gray-900 mb-3">Расход топлива</h3>
        <ConsumptionChart :records="fuelRecords" />
      </div>

      <!-- Quick actions -->
      <div class="grid grid-cols-3 gap-3">
        <router-link :to="`/car/${id}/fuel/add`"
          class="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-center hover:bg-orange-100 transition">
          <div class="text-2xl mb-1">⛽</div>
          <div class="text-xs font-medium text-orange-700">Заправка</div>
        </router-link>
        <router-link :to="`/car/${id}/service/add`"
          class="bg-teal-50 border border-teal-100 rounded-2xl p-4 text-center hover:bg-teal-100 transition">
          <div class="text-2xl mb-1">🔧</div>
          <div class="text-xs font-medium text-teal-700">ТО</div>
        </router-link>
        <router-link :to="`/car/${id}/expense/add`"
          class="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center hover:bg-blue-100 transition">
          <div class="text-2xl mb-1">💰</div>
          <div class="text-xs font-medium text-blue-700">Расход</div>
        </router-link>
      </div>

      <!-- Feature links -->
      <div class="grid grid-cols-2 gap-3">
        <router-link :to="`/car/${id}/analytics`"
          class="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex items-center gap-3 hover:bg-purple-100 transition">
          <div class="text-2xl">📊</div>
          <div>
            <div class="text-sm font-medium text-purple-700">Аналитика</div>
            <div class="text-xs text-purple-500">Графики и статистика</div>
          </div>
        </router-link>
        <router-link :to="`/car/${id}/reminders`"
          class="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3 hover:bg-amber-100 transition relative">
          <div class="text-2xl">🔔</div>
          <div>
            <div class="text-sm font-medium text-amber-700">Напоминания</div>
            <div class="text-xs text-amber-500">Страховка, ТО, техосмотр</div>
          </div>
          <span v-if="urgentReminders > 0"
            class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {{ urgentReminders }}
          </span>
        </router-link>
      </div>
    </div>

    <!-- Fuel tab -->
    <div v-if="tab === 'fuel'" class="space-y-3">
      <router-link :to="`/car/${id}/fuel/add`"
        class="block bg-blue-600 text-white text-center py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
        + Добавить заправку
      </router-link>
      <p v-if="fuelRecords.length === 0" class="text-center text-gray-400 py-10">Нет записей о заправках</p>
      <div v-for="r in fuelRecords" :key="r.id"
        class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
        <div class="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-lg shrink-0">⛽</div>
        <div class="flex-1 min-w-0">
          <div class="font-medium text-gray-900">{{ r.liters.toFixed(1) }} л · {{ r.fuelType }}</div>
          <div class="text-sm text-gray-500">
            {{ formatDate(r.date) }} · {{ r.mileage.toLocaleString('ru-RU') }} км
            <template v-if="consumptionMap.get(r.id)">
              · {{ consumptionMap.get(r.id)!.toFixed(1) }} л/100км
            </template>
          </div>
          <div v-if="r.station" class="text-xs text-gray-400 mt-0.5">{{ r.station }}</div>
        </div>
        <div class="text-right shrink-0">
          <div class="font-bold text-gray-900">{{ formatMoney(r.totalCost) }} ₽</div>
          <button @click="confirmDelete(`${r.liters} л`, () => store.deleteFuelRecord(r.id))"
            class="text-xs text-red-400 hover:text-red-600 mt-1">
            Удалить
          </button>
        </div>
      </div>
    </div>

    <!-- Service tab -->
    <div v-if="tab === 'service'" class="space-y-3">
      <router-link :to="`/car/${id}/service/add`"
        class="block bg-blue-600 text-white text-center py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
        + Добавить обслуживание
      </router-link>
      <p v-if="serviceRecords.length === 0" class="text-center text-gray-400 py-10">Нет записей об обслуживании</p>
      <div v-for="r in serviceRecords" :key="r.id"
        class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          :style="{ backgroundColor: SERVICE_COLORS[r.type] + '15' }">
          🔧
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-medium text-gray-900">{{ r.title }}</div>
          <div class="text-sm text-gray-500">
            {{ formatDate(r.date) }} · {{ r.mileage.toLocaleString('ru-RU') }} км
            · {{ SERVICE_TYPES[r.type] }}
          </div>
          <div v-if="r.nextMileage" class="text-xs text-amber-600 mt-0.5">
            След. ТО: {{ r.nextMileage.toLocaleString('ru-RU') }} км
          </div>
          <div v-if="r.notes" class="text-xs text-gray-400 mt-0.5">{{ r.notes }}</div>
        </div>
        <div class="text-right shrink-0">
          <div class="font-bold text-gray-900">{{ formatMoney(r.cost) }} ₽</div>
          <button @click="confirmDelete(r.title, () => store.deleteServiceRecord(r.id))"
            class="text-xs text-red-400 hover:text-red-600 mt-1">
            Удалить
          </button>
        </div>
      </div>
    </div>

    <!-- Expenses tab -->
    <div v-if="tab === 'expenses'" class="space-y-3">
      <router-link :to="`/car/${id}/expense/add`"
        class="block bg-blue-600 text-white text-center py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
        + Добавить расход
      </router-link>
      <p v-if="expenses.length === 0" class="text-center text-gray-400 py-10">Нет записей о расходах</p>
      <div v-for="r in expenses" :key="r.id"
        class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
          :style="{ backgroundColor: EXPENSE_COLORS[r.category] + '15' }">
          💰
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-medium text-gray-900">{{ r.title }}</div>
          <div class="text-sm text-gray-500">
            {{ formatDate(r.date) }} · {{ EXPENSE_CATEGORIES[r.category] }}
          </div>
          <div v-if="r.notes" class="text-xs text-gray-400 mt-0.5">{{ r.notes }}</div>
        </div>
        <div class="text-right shrink-0">
          <div class="font-bold text-gray-900">{{ formatMoney(r.cost) }} ₽</div>
          <button @click="confirmDelete(r.title, () => store.deleteExpense(r.id))"
            class="text-xs text-red-400 hover:text-red-600 mt-1">
            Удалить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
