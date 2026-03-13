import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Car, FuelRecord, ServiceRecord, Expense } from '../types'

function loadFromStorage<T>(key: string): T[] {
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : []
}

function saveToStorage<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data))
}

export const useCarsStore = defineStore('cars', () => {
  const cars = ref<Car[]>(loadFromStorage('cars'))
  const fuelRecords = ref<FuelRecord[]>(loadFromStorage('fuelRecords'))
  const serviceRecords = ref<ServiceRecord[]>(loadFromStorage('serviceRecords'))
  const expenses = ref<Expense[]>(loadFromStorage('expenses'))

  function persist() {
    saveToStorage('cars', cars.value)
    saveToStorage('fuelRecords', fuelRecords.value)
    saveToStorage('serviceRecords', serviceRecords.value)
    saveToStorage('expenses', expenses.value)
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

  return {
    cars,
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
  }
})
