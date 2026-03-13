<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCarsStore } from '../stores/cars'
import { SERVICE_TYPES, SERVICE_INTERVALS, SERVICE_TEMPLATES, type ServiceType } from '../types'

const props = defineProps<{ id: string }>()
const router = useRouter()
const store = useCarsStore()
const car = store.getCarById(props.id)

const today = new Date().toISOString().slice(0, 10)
const date = ref(today)
const type = ref<ServiceType>('oil_change')
const title = ref('')
const cost = ref('')
const mileage = ref(car.value?.mileage.toString() ?? '')
const notes = ref('')
const nextMileage = ref('')
const error = ref('')
const showTemplates = ref(true)

// Auto-suggest nextMileage when type changes
watch(type, (newType) => {
  const interval = SERVICE_INTERVALS[newType]
  const m = parseInt(mileage.value) || car.value?.mileage || 0
  if (interval && m > 0) {
    nextMileage.value = (m + interval).toString()
  }
})

// Also update when mileage changes
watch(mileage, (val) => {
  const interval = SERVICE_INTERVALS[type.value]
  const m = parseInt(val) || 0
  if (interval && m > 0) {
    nextMileage.value = (m + interval).toString()
  }
})

function applyTemplate(tmpl: typeof SERVICE_TEMPLATES[number]) {
  type.value = tmpl.type
  title.value = tmpl.title
  cost.value = tmpl.estimatedCost.toString()
  showTemplates.value = false
  // Trigger nextMileage calculation
  const interval = SERVICE_INTERVALS[tmpl.type]
  const m = parseInt(mileage.value) || car.value?.mileage || 0
  if (interval && m > 0) {
    nextMileage.value = (m + interval).toString()
  }
}

function save() {
  error.value = ''
  if (!title.value.trim() || !cost.value || !mileage.value) return

  const m = parseInt(mileage.value)
  if (car.value && m < car.value.mileage) {
    error.value = `Пробег не может быть меньше ${car.value.mileage.toLocaleString('ru-RU')} км`
    return
  }

  store.addServiceRecord({
    id: crypto.randomUUID(),
    carId: props.id,
    date: date.value,
    type: type.value,
    title: title.value.trim(),
    cost: parseFloat(cost.value),
    mileage: m,
    notes: notes.value.trim() || undefined,
    nextMileage: nextMileage.value ? parseInt(nextMileage.value) : undefined,
  })
  router.back()
}
</script>

<template>
  <div class="max-w-lg mx-auto px-4 py-8">
    <div class="flex items-center gap-3 mb-6">
      <button @click="router.back()" class="p-2 hover:bg-gray-100 rounded-lg transition">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd" />
        </svg>
      </button>
      <h1 class="text-2xl font-bold text-gray-900">Обслуживание</h1>
    </div>

    <!-- Templates -->
    <div v-if="showTemplates" class="mb-6">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide">Быстрый выбор</h3>
        <button @click="showTemplates = false" class="text-xs text-blue-600 hover:text-blue-800">
          Заполнить вручную
        </button>
      </div>
      <div class="grid grid-cols-1 gap-2">
        <button v-for="tmpl in SERVICE_TEMPLATES" :key="tmpl.title"
          @click="applyTemplate(tmpl)"
          class="text-left bg-white rounded-xl p-3 border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition flex items-center gap-3">
          <div class="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-sm">🔧</div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-gray-900 truncate">{{ tmpl.title }}</div>
            <div class="text-xs text-gray-500">{{ SERVICE_TYPES[tmpl.type] }} · ~{{ tmpl.estimatedCost.toLocaleString('ru-RU') }} ₽</div>
          </div>
        </button>
      </div>
    </div>

    <!-- Form -->
    <form @submit.prevent="save" class="space-y-4" :class="showTemplates && 'opacity-50 pointer-events-none'">
      <div v-if="!showTemplates">
        <button type="button" @click="showTemplates = true" class="text-xs text-blue-600 hover:text-blue-800 mb-3">
          ← Показать шаблоны
        </button>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Дата</label>
        <input v-model="date" type="date" :max="today"
          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
      </div>
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
        {{ error }}
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Тип работ</label>
        <select v-model="type"
          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition">
          <option v-for="(label, key) in SERVICE_TYPES" :key="key" :value="key">{{ label }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Описание работ *</label>
        <input v-model="title" type="text" placeholder="Замена масла и фильтра" required
          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Стоимость *</label>
          <input v-model="cost" type="number" step="0.01" min="0" placeholder="5000" required
            class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Пробег (км) *</label>
          <input v-model="mileage" type="number" min="0" required
            class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Следующее ТО на пробеге (км)
          <span v-if="SERVICE_INTERVALS[type]" class="text-gray-400 font-normal">
            · авто: +{{ SERVICE_INTERVALS[type]!.toLocaleString('ru-RU') }} км
          </span>
        </label>
        <input v-model="nextMileage" type="number" min="0" placeholder="Необязательно"
          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Заметки</label>
        <textarea v-model="notes" rows="3" placeholder="Дополнительная информация..."
          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition resize-none"></textarea>
      </div>
      <button type="submit"
        class="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition mt-4">
        Сохранить
      </button>
    </form>
  </div>
</template>
