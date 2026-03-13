import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Car, FuelRecord, ServiceRecord, Expense, Reminder } from '../types'

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
  } catch (e) {
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
      const data = JSON.parse(json)
      if (!data.version || !data.cars) {
        return { success: false, message: 'Неверный формат файла' }
      }
      cars.value = data.cars ?? []
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
    deleteCar,
    getCarById,
    addFuelRecord,
    deleteFuelRecord,
    getFuelRecords,
    addServiceRecord,
    deleteServiceRecord,
    getServiceRecords,
    addExpense,
    deleteExpense,
    getExpenses,
    addReminder,
    deleteReminder,
    getReminders,
    exportData,
    importData,
  }
})
