<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCarsStore } from '../stores/cars'
import { FUEL_TYPES } from '../types'

const props = defineProps<{ id: string }>()
const router = useRouter()
const store = useCarsStore()
const car = store.getCarById(props.id)

const today = new Date().toISOString().slice(0, 10)
const date = ref(today)
const fuelType = ref('АИ-95')
const liters = ref('')
const pricePerLiter = ref('')
const mileage = ref(car.value?.mileage.toString() ?? '')
const station = ref('')
const error = ref('')

const totalCost = computed(() => {
  const l = parseFloat(liters.value) || 0
  const p = parseFloat(pricePerLiter.value) || 0
  return l * p
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
      <button @click="router.back()" class="p-2 hover:bg-gray-100 rounded-lg transition">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd" />
        </svg>
      </button>
      <h1 class="text-2xl font-bold text-gray-900">Заправка</h1>
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
          <input v-model="liters" type="number" step="0.01" min="0" placeholder="40" required
            class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Цена за литр *</label>
          <input v-model="pricePerLiter" type="number" step="0.01" min="0" placeholder="56.50" required
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
