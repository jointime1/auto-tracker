<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCarsStore } from '../stores/cars'
import { SERVICE_TYPES } from '../types'
import { formatDate } from '../utils'
import type { Reminder } from '../types'

const props = defineProps<{ id: string }>()
const router = useRouter()
const store = useCarsStore()

const car = store.getCarById(props.id)
const reminders = store.getReminders(props.id)
const serviceRecords = store.getServiceRecords(props.id)

const showForm = ref(false)
const formType = ref<Reminder['type']>('insurance')
const formTitle = ref('')
const formDate = ref('')
const formMileage = ref('')
const formNotes = ref('')

const today = new Date().toISOString().slice(0, 10)

// Service-based reminders (auto-generated from nextMileage)
const serviceReminders = computed(() => {
  if (!car.value) return []
  return serviceRecords.value
    .filter(s => s.nextMileage && s.nextMileage > 0)
    .map(s => {
      const remaining = s.nextMileage! - car.value!.mileage
      const urgent = remaining <= 1000
      const overdue = remaining <= 0
      return {
        id: s.id,
        serviceRecordId: s.id,
        title: `${SERVICE_TYPES[s.type]} — ${s.title}`,
        subtitle: overdue
          ? `Просрочено на ${Math.abs(remaining).toLocaleString('ru-RU')} км`
          : `Через ${remaining.toLocaleString('ru-RU')} км (на ${s.nextMileage!.toLocaleString('ru-RU')} км)`,
        urgent,
        overdue,
        icon: '🔧',
      }
    })
    .sort((a, b) => (a.overdue === b.overdue ? 0 : a.overdue ? -1 : 1))
})

// Date-based reminders (user-created)
const dateReminders = computed(() => {
  return reminders.value.map(r => {
    const dueDate = new Date(r.dueDate)
    const now = new Date()
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const overdue = diffDays < 0
    const urgent = diffDays <= 14 && diffDays >= 0

    return {
      ...r,
      diffDays,
      overdue,
      urgent,
      subtitle: overdue
        ? `Просрочено на ${Math.abs(diffDays)} дн.`
        : diffDays === 0
          ? 'Сегодня!'
          : `Через ${diffDays} дн. (${formatDate(r.dueDate)})`,
      icon: r.type === 'insurance' ? '🛡️' : r.type === 'inspection' ? '📋' : '🔔',
    }
  }).sort((a, b) => (a.overdue === b.overdue ? a.diffDays - b.diffDays : a.overdue ? -1 : 1))
})

const allRemindersCount = computed(() => serviceReminders.value.length + dateReminders.value.length)
const urgentCount = computed(() =>
  serviceReminders.value.filter(r => r.urgent || r.overdue).length +
  dateReminders.value.filter(r => r.urgent || r.overdue).length
)

function save() {
  if (!formTitle.value.trim() || !formDate.value) return

  store.addReminder({
    id: crypto.randomUUID(),
    carId: props.id,
    type: formType.value,
    title: formTitle.value.trim(),
    dueDate: formDate.value,
    dueMileage: formMileage.value ? parseInt(formMileage.value) : undefined,
    notes: formNotes.value.trim() || undefined,
  })

  showForm.value = false
  formTitle.value = ''
  formDate.value = ''
  formMileage.value = ''
  formNotes.value = ''
}

function dismissServiceReminder(serviceRecordId: string) {
  const record = serviceRecords.value.find(r => r.id === serviceRecordId)
  if (!record) return
  if (!confirm('Убрать напоминание о следующем ТО?')) return
  store.updateServiceRecord({ ...record, nextMileage: undefined })
}

function confirmDelete(name: string, id: string) {
  if (confirm(`Удалить напоминание "${name}"?`)) {
    store.deleteReminder(id)
  }
}

const reminderTypes = [
  { value: 'insurance', label: 'Страховка (ОСАГО/КАСКО)' },
  { value: 'inspection', label: 'Техосмотр' },
  { value: 'custom', label: 'Другое' },
] as const
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8" v-if="car">
    <div class="flex items-center gap-3 mb-6">
      <button @click="router.back()" class="p-2 hover:bg-gray-100 rounded-lg transition" aria-label="Назад">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd" />
        </svg>
      </button>
      <h1 class="text-2xl font-bold text-gray-900 flex-1">Напоминания</h1>
      <span v-if="urgentCount > 0"
        class="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
        {{ urgentCount }}
      </span>
    </div>

    <!-- Add button -->
    <button @click="showForm = !showForm"
      class="w-full bg-blue-600 text-white text-center py-3 rounded-xl font-semibold hover:bg-blue-700 transition mb-4">
      {{ showForm ? 'Отмена' : '+ Добавить напоминание' }}
    </button>

    <!-- Add form -->
    <div v-if="showForm" class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6 space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Тип</label>
        <select v-model="formType"
          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition">
          <option v-for="t in reminderTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Название *</label>
        <input v-model="formTitle" type="text" placeholder="ОСАГО до 15.06.2026" required
          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Дата *</label>
          <input v-model="formDate" type="date" :min="today" required
            class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">На пробеге (км)</label>
          <input v-model="formMileage" type="number" min="0" placeholder="Необязательно"
            class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Заметки</label>
        <input v-model="formNotes" type="text" placeholder="Дополнительная информация"
          class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
      </div>
      <button @click="save" class="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
        Сохранить
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="allRemindersCount === 0 && !showForm" class="text-center py-16">
      <div class="text-5xl mb-4">🔔</div>
      <p class="text-gray-500">Нет активных напоминаний</p>
      <p class="text-gray-400 text-sm mt-1">Добавьте напоминание о страховке, техосмотре или ТО</p>
    </div>

    <!-- Service-based reminders -->
    <div v-if="serviceReminders.length > 0" class="mb-6">
      <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">По пробегу</h3>
      <div class="space-y-2">
        <div v-for="r in serviceReminders" :key="r.id"
          :class="[
            'rounded-2xl p-4 flex items-center gap-4 border',
            r.overdue ? 'bg-red-50 border-red-200' : r.urgent ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100 shadow-sm'
          ]">
          <div class="text-2xl shrink-0">{{ r.icon }}</div>
          <div class="flex-1 min-w-0">
            <div :class="['font-medium', r.overdue ? 'text-red-800' : r.urgent ? 'text-amber-800' : 'text-gray-900']">
              {{ r.title }}
            </div>
            <div :class="['text-sm', r.overdue ? 'text-red-600' : r.urgent ? 'text-amber-600' : 'text-gray-500']">
              {{ r.subtitle }}
            </div>
          </div>
          <button @click="dismissServiceReminder(r.serviceRecordId)" class="text-red-400 hover:text-red-600 shrink-0" title="Убрать">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Date-based reminders -->
    <div v-if="dateReminders.length > 0">
      <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">По дате</h3>
      <div class="space-y-2">
        <div v-for="r in dateReminders" :key="r.id"
          :class="[
            'rounded-2xl p-4 flex items-center gap-4 border',
            r.overdue ? 'bg-red-50 border-red-200' : r.urgent ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100 shadow-sm'
          ]">
          <div class="text-2xl shrink-0">{{ r.icon }}</div>
          <div class="flex-1 min-w-0">
            <div :class="['font-medium', r.overdue ? 'text-red-800' : r.urgent ? 'text-amber-800' : 'text-gray-900']">
              {{ r.title }}
            </div>
            <div :class="['text-sm', r.overdue ? 'text-red-600' : r.urgent ? 'text-amber-600' : 'text-gray-500']">
              {{ r.subtitle }}
            </div>
            <div v-if="r.notes" class="text-xs text-gray-400 mt-0.5">{{ r.notes }}</div>
          </div>
          <button @click="confirmDelete(r.title, r.id)" class="text-red-400 hover:text-red-600 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
