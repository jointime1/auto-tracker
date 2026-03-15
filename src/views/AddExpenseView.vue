<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCarsStore } from '../stores/cars'
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '../types'
import { useTelegram } from '../composables/useTelegram'

const props = defineProps<{ id: string }>()
const router = useRouter()
const store = useCarsStore()
const { haptic } = useTelegram()

const today = new Date().toISOString().slice(0, 10)
const date = ref(today)
const category = ref<ExpenseCategory>('insurance')
const title = ref('')
const cost = ref('')
const notes = ref('')
const error = ref('')

function save() {
  error.value = ''
  if (!title.value.trim()) {
    error.value = 'Укажите описание'
    return
  }
  if (!cost.value || parseFloat(cost.value) <= 0) {
    error.value = 'Укажите сумму'
    return
  }

  store.addExpense({
    id: crypto.randomUUID(),
    carId: props.id,
    date: date.value,
    category: category.value,
    title: title.value.trim(),
    cost: parseFloat(cost.value),
    notes: notes.value.trim() || undefined,
  })
  haptic('success')
  router.back()
}
</script>

<template>
  <div class="max-w-lg mx-auto px-4 py-8">
    <div class="flex items-center gap-3 mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Расход</h1>
    </div>

    <form @submit.prevent="save" class="space-y-4">
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
        {{ error }}
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Дата</label>
        <input v-model="date" type="date" :max="today"
          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Категория</label>
        <select v-model="category"
          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition">
          <option v-for="(label, key) in EXPENSE_CATEGORIES" :key="key" :value="key">{{ label }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Описание *</label>
        <input v-model="title" type="text" placeholder="ОСАГО на год" required
          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Сумма (₽) *</label>
        <input v-model="cost" type="number" step="0.01" min="0" placeholder="15000" required
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
