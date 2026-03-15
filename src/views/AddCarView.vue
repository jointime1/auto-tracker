<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCarsStore } from '../stores/cars'
import { useTelegram } from '../composables/useTelegram'

const router = useRouter()
const store = useCarsStore()
const { haptic } = useTelegram()

const brand = ref('')
const model = ref('')
const year = ref('')
const mileage = ref('')
const licensePlate = ref('')
const vin = ref('')

function save() {
  if (!brand.value.trim() || !model.value.trim() || !year.value || !mileage.value) return

  store.addCar({
    id: crypto.randomUUID(),
    brand: brand.value.trim(),
    model: model.value.trim(),
    year: parseInt(year.value),
    mileage: parseInt(mileage.value),
    licensePlate: licensePlate.value.trim() || undefined,
    vin: vin.value.trim() || undefined,
  })
  haptic('success')
  router.push('/')
}
</script>

<template>
  <div class="max-w-lg mx-auto px-4 py-8">
    <div class="flex items-center gap-3 mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Добавить авто</h1>
    </div>

    <form @submit.prevent="save" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Марка *</label>
        <input v-model="brand" type="text" placeholder="Toyota" required
          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Модель *</label>
        <input v-model="model" type="text" placeholder="Camry" required
          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Год выпуска *</label>
          <input v-model="year" type="number" min="1900" :max="new Date().getFullYear() + 1" placeholder="2020" required
            class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Пробег (км) *</label>
          <input v-model="mileage" type="number" min="0" placeholder="50000" required
            class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Госномер</label>
        <input v-model="licensePlate" type="text" placeholder="А123БВ777"
          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition uppercase" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">VIN</label>
        <input v-model="vin" type="text" placeholder="17 символов" maxlength="17"
          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition uppercase" />
      </div>
      <button type="submit"
        class="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition mt-4">
        Сохранить
      </button>
    </form>
  </div>
</template>
