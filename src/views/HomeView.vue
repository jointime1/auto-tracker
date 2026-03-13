<script setup lang="ts">
import { useCarsStore } from '../stores/cars'

const store = useCarsStore()
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">АвтоТрекер</h1>
      <router-link
        to="/car/add"
        class="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
        </svg>
        Добавить авто
      </router-link>
    </div>

    <div v-if="store.cars.length === 0" class="text-center py-20">
      <div class="text-6xl mb-4">🚗</div>
      <h2 class="text-xl font-semibold text-gray-500 mb-2">Нет автомобилей</h2>
      <p class="text-gray-400 mb-6">Добавьте первый автомобиль, чтобы начать отслеживать расходы</p>
      <router-link to="/car/add"
        class="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition font-semibold">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
        </svg>
        Добавить авто
      </router-link>
    </div>

    <div v-else class="space-y-3">
      <router-link
        v-for="car in store.cars"
        :key="car.id"
        :to="`/car/${car.id}`"
        class="block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition border border-gray-100"
      >
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">
            🚗
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-gray-900 text-lg">{{ car.brand }} {{ car.model }}</h3>
            <p class="text-gray-500 text-sm">
              {{ car.year }} · {{ car.mileage.toLocaleString('ru-RU') }} км
              <span v-if="car.licensePlate"> · {{ car.licensePlate }}</span>
            </p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
          </svg>
        </div>
      </router-link>
    </div>
  </div>
</template>
