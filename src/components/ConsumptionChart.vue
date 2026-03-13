<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip } from 'chart.js'
import type { FuelRecord } from '../types'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip)

const props = defineProps<{ records: FuelRecord[] }>()

const chartData = computed(() => {
  const sorted = [...props.records].sort((a, b) => a.mileage - b.mileage)
  const labels: string[] = []
  const data: number[] = []

  for (let i = 1; i < sorted.length; i++) {
    const dist = sorted[i].mileage - sorted[i - 1].mileage
    if (dist > 0) {
      const consumption = (sorted[i].liters / dist) * 100
      labels.push(`${(sorted[i].mileage / 1000).toFixed(0)}т км`)
      data.push(parseFloat(consumption.toFixed(1)))
    }
  }

  return {
    labels,
    datasets: [
      {
        label: 'л/100км',
        data,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#2563eb',
      },
    ],
  }
})

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: false },
  },
}
</script>

<template>
  <div class="h-52">
    <Line v-if="chartData.labels.length > 0" :data="chartData" :options="options" />
    <p v-else class="text-gray-400 text-sm text-center py-8">Нужно минимум 2 заправки с разным пробегом</p>
  </div>
</template>
