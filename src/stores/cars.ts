import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Car, FuelRecord, ServiceRecord, Expense, Reminder } from '../types'

const storageError = ref('')

export function useStorageError() {
  return storageError
}

function loadFromStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveToStorage<T>(key: string, data: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
    storageError.value = ''
  } catch (e) {
    storageError.value = 'Ошибка сохранения данных. Хранилище переполнено.'
    console.error('Failed to save to localStorage:', e)
  }
}

export const useCarsStore = defineStore('cars', () => {
  const cars = ref<Car[]>(loadFromStorage('cars'))
  const fuelRecords = ref<FuelRecord[]>(loadFromStorage('fuelRecords'))
  const serviceRecords = ref<ServiceRecord[]>(loadFromStorage('serviceRecords'))
  const expenses = ref<Expense[]>(loadFromStorage('expenses'))
  const reminders = ref<Reminder[]>(loadFromStorage('reminders'))

  function persist() {
    saveToStorage('cars', cars.value)
    saveToStorage('fuelRecords', fuelRecords.value)
    saveToStorage('serviceRecords', serviceRecords.value)
    saveToStorage('expenses', expenses.value)
    saveToStorage('reminders', reminders.value)
  }

  // Cars
  function addCar(car: Car) {
    cars.value.push(car)
    persist()
  }

  function updateCar(car: Car) {
    const idx = cars.value.findIndex(c => c.id === car.id)
    if (idx !== -1) {
      cars.value[idx] = car
      persist()
    }
  }

  function deleteCar(id: string) {
    cars.value = cars.value.filter(c => c.id !== id)
    fuelRecords.value = fuelRecords.value.filter(r => r.carId !== id)
    serviceRecords.value = serviceRecords.value.filter(r => r.carId !== id)
    expenses.value = expenses.value.filter(r => r.carId !== id)
    reminders.value = reminders.value.filter(r => r.carId !== id)
    persist()
  }

  function updateCarMileage(id: string, mileage: number) {
    const car = cars.value.find(c => c.id === id)
    if (car && mileage > car.mileage) {
      car.mileage = mileage
      persist()
    }
  }

  function getCarById(id: string) {
    return computed(() => cars.value.find(c => c.id === id))
  }

  // Fuel
  function addFuelRecord(record: FuelRecord) {
    fuelRecords.value.push(record)
    const car = cars.value.find(c => c.id === record.carId)
    if (car && record.mileage > car.mileage) {
      car.mileage = record.mileage
    }
    persist()
  }

  function updateFuelRecord(record: FuelRecord) {
    const idx = fuelRecords.value.findIndex(r => r.id === record.id)
    if (idx !== -1) {
      fuelRecords.value[idx] = record
      const car = cars.value.find(c => c.id === record.carId)
      if (car && record.mileage > car.mileage) car.mileage = record.mileage
      persist()
    }
  }

  function deleteFuelRecord(id: string) {
    fuelRecords.value = fuelRecords.value.filter(r => r.id !== id)
    persist()
  }

  function getFuelRecords(carId: string) {
    return computed(() =>
      fuelRecords.value
        .filter(r => r.carId === carId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    )
  }

  // Service
  function addServiceRecord(record: ServiceRecord) {
    serviceRecords.value.push(record)
    const car = cars.value.find(c => c.id === record.carId)
    if (car && record.mileage > car.mileage) {
      car.mileage = record.mileage
    }
    persist()
  }

  function updateServiceRecord(record: ServiceRecord) {
    const idx = serviceRecords.value.findIndex(r => r.id === record.id)
    if (idx !== -1) {
      serviceRecords.value[idx] = record
      const car = cars.value.find(c => c.id === record.carId)
      if (car && record.mileage > car.mileage) car.mileage = record.mileage
      persist()
    }
  }

  function deleteServiceRecord(id: string) {
    serviceRecords.value = serviceRecords.value.filter(r => r.id !== id)
    persist()
  }

  function getServiceRecords(carId: string) {
    return computed(() =>
      serviceRecords.value
        .filter(r => r.carId === carId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    )
  }

  // Expenses
  function addExpense(expense: Expense) {
    expenses.value.push(expense)
    persist()
  }

  function updateExpense(expense: Expense) {
    const idx = expenses.value.findIndex(r => r.id === expense.id)
    if (idx !== -1) {
      expenses.value[idx] = expense
      persist()
    }
  }

  function deleteExpense(id: string) {
    expenses.value = expenses.value.filter(r => r.id !== id)
    persist()
  }

  function getExpenses(carId: string) {
    return computed(() =>
      expenses.value
        .filter(r => r.carId === carId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    )
  }

  // Last fuel record (for quick refuel)
  function getLastFuelRecord(carId: string) {
    return computed(() => {
      const records = fuelRecords.value
        .filter(r => r.carId === carId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      return records[0] ?? null
    })
  }

  // Reminders
  function addReminder(reminder: Reminder) {
    reminders.value.push(reminder)
    persist()
  }

  function deleteReminder(id: string) {
    reminders.value = reminders.value.filter(r => r.id !== id)
    persist()
  }

  function getReminders(carId: string) {
    return computed(() =>
      reminders.value
        .filter(r => r.carId === carId)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    )
  }

  // Export / Import
  function exportData(): string {
    return JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      cars: cars.value,
      fuelRecords: fuelRecords.value,
      serviceRecords: serviceRecords.value,
      expenses: expenses.value,
      reminders: reminders.value,
    }, null, 2)
  }

  function importData(json: string): { success: boolean; message: string } {
    try {
      if (json.length > 10 * 1024 * 1024) {
        return { success: false, message: 'Файл слишком большой (макс. 10 МБ)' }
      }
      const data = JSON.parse(json)
      if (!data.version || !Array.isArray(data.cars)) {
        return { success: false, message: 'Неверный формат файла' }
      }
      // Validate car records have required fields with correct types
      for (const c of data.cars) {
        if (typeof c.id !== 'string' || typeof c.brand !== 'string' ||
            typeof c.model !== 'string' || typeof c.year !== 'number' ||
            typeof c.mileage !== 'number') {
          return { success: false, message: 'Повреждённые данные автомобилей' }
        }
      }
      // Validate fuel records
      if (data.fuelRecords && !Array.isArray(data.fuelRecords)) {
        return { success: false, message: 'Повреждённые данные заправок' }
      }
      for (const r of data.fuelRecords ?? []) {
        if (typeof r.id !== 'string' || typeof r.liters !== 'number' ||
            typeof r.mileage !== 'number' || typeof r.totalCost !== 'number') {
          return { success: false, message: 'Повреждённые данные заправок' }
        }
      }
      // Validate service records
      for (const r of data.serviceRecords ?? []) {
        if (typeof r.id !== 'string' || typeof r.cost !== 'number' ||
            typeof r.mileage !== 'number') {
          return { success: false, message: 'Повреждённые данные обслуживания' }
        }
      }
      // Validate expenses
      if (data.expenses && !Array.isArray(data.expenses)) {
        return { success: false, message: 'Повреждённые данные расходов' }
      }
      for (const r of data.expenses ?? []) {
        if (typeof r.id !== 'string' || typeof r.cost !== 'number' ||
            typeof r.title !== 'string') {
          return { success: false, message: 'Повреждённые данные расходов' }
        }
      }
      // Validate reminders
      if (data.reminders && !Array.isArray(data.reminders)) {
        return { success: false, message: 'Повреждённые данные напоминаний' }
      }
      for (const r of data.reminders ?? []) {
        if (typeof r.id !== 'string' || typeof r.title !== 'string' ||
            typeof r.dueDate !== 'string') {
          return { success: false, message: 'Повреждённые данные напоминаний' }
        }
      }
      cars.value = data.cars
      fuelRecords.value = data.fuelRecords ?? []
      serviceRecords.value = data.serviceRecords ?? []
      expenses.value = data.expenses ?? []
      reminders.value = data.reminders ?? []
      persist()
      return { success: true, message: `Импортировано: ${cars.value.length} авто` }
    } catch {
      return { success: false, message: 'Ошибка чтения файла' }
    }
  }

  return {
    cars,
    fuelRecords,
    serviceRecords,
    expenses,
    reminders,
    addCar,
    updateCar,
    updateCarMileage,
    deleteCar,
    getCarById,
    addFuelRecord,
    updateFuelRecord,
    deleteFuelRecord,
    getFuelRecords,
    getLastFuelRecord,
    addServiceRecord,
    updateServiceRecord,
    deleteServiceRecord,
    getServiceRecords,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpenses,
    addReminder,
    deleteReminder,
    getReminders,
    exportData,
    importData,
  }
})
