<script setup lang="ts">
import { ref } from 'vue'
import { useCarsStore } from '../stores/cars'
import { useTelegram } from '../composables/useTelegram'

const store = useCarsStore()
const { confirm: tgConfirm, haptic } = useTelegram()

const importResult = ref<{ success: boolean; message: string } | null>(null)
const showDangerZone = ref(false)

function exportData() {
  const json = store.exportData()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `autotracker-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  haptic('success')
}

function triggerImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    if (store.cars.length > 0) {
      const ok = await tgConfirm('Импорт заменит все текущие данные. Продолжить?')
      if (!ok) return
    }

    const text = await file.text()
    importResult.value = store.importData(text)
    haptic(importResult.value.success ? 'success' : 'error')
  }
  input.click()
}

async function clearAllData() {
  const ok1 = await tgConfirm('ВНИМАНИЕ: Все данные будут удалены безвозвратно. Продолжить?')
  if (!ok1) return
  const ok2 = await tgConfirm('Вы уверены? Это действие нельзя отменить.')
  if (!ok2) return

  localStorage.clear()
  haptic('success')
  location.reload()
}

const stats = {
  cars: store.cars.length,
  fuel: store.fuelRecords.length,
  service: store.serviceRecords.length,
  expenses: store.expenses.length,
  reminders: store.reminders.length,
}

const storageUsed = (() => {
  let total = 0
  for (const key of ['cars', 'fuelRecords', 'serviceRecords', 'expenses', 'reminders']) {
    total += (localStorage.getItem(key) || '').length
  }
  return (total / 1024).toFixed(1)
})()
</script>

<template>
  <div class="max-w-lg mx-auto px-4 py-8">
    <div class="flex items-center gap-3 mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Настройки</h1>
    </div>

    <!-- Data stats -->
    <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
      <h3 class="font-semibold text-gray-900 mb-3">Данные</h3>
      <div class="grid grid-cols-3 gap-3 text-center mb-4">
        <div>
          <div class="text-xl font-bold text-blue-600">{{ stats.cars }}</div>
          <div class="text-xs text-gray-500">Авто</div>
        </div>
        <div>
          <div class="text-xl font-bold text-orange-500">{{ stats.fuel }}</div>
          <div class="text-xs text-gray-500">Заправок</div>
        </div>
        <div>
          <div class="text-xl font-bold text-teal-600">{{ stats.service }}</div>
          <div class="text-xs text-gray-500">ТО</div>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-3 text-center">
        <div>
          <div class="text-xl font-bold text-purple-600">{{ stats.expenses }}</div>
          <div class="text-xs text-gray-500">Расходов</div>
        </div>
        <div>
          <div class="text-xl font-bold text-amber-600">{{ stats.reminders }}</div>
          <div class="text-xs text-gray-500">Напоминаний</div>
        </div>
        <div>
          <div class="text-xl font-bold text-gray-600">{{ storageUsed }}</div>
          <div class="text-xs text-gray-500">КБ</div>
        </div>
      </div>
    </div>

    <!-- Export / Import -->
    <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
      <h3 class="font-semibold text-gray-900 mb-3">Бэкап данных</h3>
      <p class="text-sm text-gray-500 mb-4">
        Экспортируйте данные для сохранности или переноса.
      </p>
      <div class="grid grid-cols-2 gap-3">
        <button @click="exportData"
          class="bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
            <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
          </svg>
          Экспорт
        </button>
        <button @click="triggerImport"
          class="bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
            <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
          </svg>
          Импорт
        </button>
      </div>
      <div v-if="importResult" :class="[
        'mt-3 rounded-xl px-4 py-3 text-sm',
        importResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
      ]">
        {{ importResult.message }}
      </div>
    </div>

    <!-- Danger zone -->
    <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <button @click="showDangerZone = !showDangerZone"
        class="flex items-center justify-between w-full">
        <h3 class="font-semibold text-red-600">Опасная зона</h3>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-400 transition"
          :class="showDangerZone && 'rotate-180'" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
        </svg>
      </button>
      <div v-if="showDangerZone" class="mt-4">
        <p class="text-sm text-gray-500 mb-3">Удаление всех данных необратимо. Сделайте экспорт перед удалением.</p>
        <button @click="clearAllData"
          class="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition">
          Удалить все данные
        </button>
      </div>
    </div>
  </div>
</template>
