<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCarsStore } from '../stores/cars'
import { FUEL_TYPES } from '../types'

const props = defineProps<{ id: string }>()
const router = useRouter()
const store = useCarsStore()
const car = store.getCarById(props.id)
const lastFuel = store.getLastFuelRecord(props.id)

const today = new Date().toISOString().slice(0, 10)
const date = ref(today)
const fuelType = ref(lastFuel.value?.fuelType ?? 'АИ-95')
const liters = ref('')
const pricePerLiter = ref(lastFuel.value?.pricePerLiter.toString() ?? '')
const mileage = ref(car.value?.mileage.toString() ?? '')
const station = ref(lastFuel.value?.station ?? '')
const error = ref('')

const totalCost = computed(() => {
  const l = parseFloat(liters.value) || 0
  const p = parseFloat(pricePerLiter.value) || 0
  return l * p
})

// Consumption alert
const fuelRecords = store.getFuelRecords(props.id)
const avgConsumption = computed(() => {
  const sorted = [...fuelRecords.value].sort((a, b) => a.mileage - b.mileage)
  if (sorted.length < 3) return null
  let total = 0, count = 0
  for (let i = 1; i < sorted.length; i++) {
    const dist = sorted[i].mileage - sorted[i - 1].mileage
    if (dist > 0) {
      total += (sorted[i].liters / dist) * 100
      count++
    }
  }
  return count > 0 ? total / count : null
})

const consumptionWarning = computed(() => {
  if (!avgConsumption.value || !liters.value || !mileage.value || !car.value) return null
  const m = parseInt(mileage.value)
  const dist = m - car.value.mileage
  if (dist <= 0) return null
  const current = (parseFloat(liters.value) / dist) * 100
  const diff = ((current - avgConsumption.value) / avgConsumption.value) * 100
  if (diff > 30) {
    return `Расход ${current.toFixed(1)} л/100км — на ${diff.toFixed(0)}% выше среднего (${avgConsumption.value.toFixed(1)})`
  }
  return null
})

function save() {
  error.value = ''
  if (!liters.value || !pricePerLiter.value || !mileage.value || !car.value) return
  const m = parseInt(mileage.value)
  if (m < car.value.mileage) {
    error.value = `Пробег не может быть меньше ${car.value.mileage.toLocaleString('ru-RU')} км`
    return
  }

  store.addFuelRecord({
    id: crypto.randomUUID(),
    carId: props.id,
    date: date.value,
    liters: parseFloat(liters.value),
    pricePerLiter: parseFloat(pricePerLiter.value),
    totalCost: totalCost.value,
    mileage: m,
    fuelType: fuelType.value,
    station: station.value.trim() || undefined,
  })
  router.back()
}
</script>

<template>
  <div class="max-w-lg mx-auto px-4 py-8">
    <div class="flex items-center gap-3 mb-8">
      <button @click="router.back()" class="p-2 hover:bg-gray-100 rounded-lg transition" aria-label="Назад">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd" />
        </svg>
      </button>
      <h1 class="text-2xl font-bold text-gray-900">Заправка</h1>
    </div>

    <!-- Quick refuel hint -->
    <div v-if="lastFuel" class="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 text-sm text-green-700">
      Предзаполнено из прошлой заправки: {{ lastFuel.fuelType }}, {{ lastFuel.pricePerLiter }} ₽/л
      <span v-if="lastFuel.station">, {{ lastFuel.station }}</span>
    </div>

    <form @submit.prevent="save" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Дата</label>
        <input v-model="date" type="date" :max="today"
          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
      </div>
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
        {{ error }}
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Тип топлива</label>
        <select v-model="fuelType"
          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition">
          <option v-for="t in FUEL_TYPES" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Литры *</label>
          <input v-model="liters" type="number" step="0.01" min="0.1" placeholder="40" required
            class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Цена за литр *</label>
          <input v-model="pricePerLiter" type="number" step="0.01" min="0.01" placeholder="56.50" required
            class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
        </div>
      </div>
      <div class="bg-blue-50 rounded-xl px-4 py-3 text-blue-800 font-semibold text-lg">
        Итого: {{ totalCost.toFixed(2) }} ₽
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Пробег (км) *</label>
        <input v-model="mileage" type="number" min="0" required
          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
      </div>

      <!-- Consumption anomaly warning -->
      <div v-if="consumptionWarning" class="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
        <span class="shrink-0">⚠️</span>
        <span>{{ consumptionWarning }}</span>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">АЗС</label>
        <input v-model="station" type="text" placeholder="Лукойл, Газпромнефть..."
          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
      </div>
      <button type="submit"
        class="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition mt-4">
        Сохранить
      </button>
    </form>
  </div>
</template>
