export interface Car {
  id: string
  brand: string
  model: string
  year: number
  mileage: number
  licensePlate?: string
  vin?: string
}

export interface FuelRecord {
  id: string
  carId: string
  date: string
  liters: number
  pricePerLiter: number
  totalCost: number
  mileage: number
  fuelType: string
  station?: string
}

export interface ServiceRecord {
  id: string
  carId: string
  date: string
  type: ServiceType
  title: string
  cost: number
  mileage: number
  notes?: string
  nextMileage?: number
}

export interface Expense {
  id: string
  carId: string
  date: string
  category: ExpenseCategory
  title: string
  cost: number
  notes?: string
}

export interface Reminder {
  id: string
  carId: string
  type: 'insurance' | 'inspection' | 'custom'
  title: string
  dueDate: string
  dueMileage?: number
  notes?: string
}

export type ServiceType = 'oil_change' | 'tire' | 'brake' | 'filter' | 'inspection' | 'other'
export type ExpenseCategory = 'insurance' | 'tax' | 'parking' | 'fine' | 'wash' | 'other'
export type FuelType = 'АИ-92' | 'АИ-95' | 'АИ-98' | 'АИ-100' | 'ДТ' | 'Газ'

export const FUEL_TYPES: FuelType[] = ['АИ-92', 'АИ-95', 'АИ-98', 'АИ-100', 'ДТ', 'Газ']

export const SERVICE_TYPES: Record<ServiceType, string> = {
  oil_change: 'Замена масла',
  tire: 'Шины',
  brake: 'Тормоза',
  filter: 'Фильтры',
  inspection: 'Диагностика',
  other: 'Другое',
}

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, string> = {
  insurance: 'Страховка',
  tax: 'Налог',
  parking: 'Парковка',
  fine: 'Штраф',
  wash: 'Мойка',
  other: 'Другое',
}

// Auto-calculated intervals for nextMileage suggestion
export const SERVICE_INTERVALS: Partial<Record<ServiceType, number>> = {
  oil_change: 10000,
  tire: 40000,
  brake: 30000,
  filter: 15000,
  inspection: 20000,
}

export interface ServiceTemplate {
  type: ServiceType
  title: string
  estimatedCost: number
}

export const SERVICE_TEMPLATES: ServiceTemplate[] = [
  { type: 'oil_change', title: 'Замена масла + масляный фильтр', estimatedCost: 5000 },
  { type: 'oil_change', title: 'Замена масла + все фильтры', estimatedCost: 8000 },
  { type: 'tire', title: 'Сезонная замена шин (шиномонтаж)', estimatedCost: 3000 },
  { type: 'tire', title: 'Покупка + установка новых шин', estimatedCost: 25000 },
  { type: 'brake', title: 'Замена тормозных колодок (перед)', estimatedCost: 4000 },
  { type: 'brake', title: 'Замена тормозных дисков + колодки', estimatedCost: 12000 },
  { type: 'filter', title: 'Замена воздушного фильтра', estimatedCost: 1500 },
  { type: 'filter', title: 'Замена салонного фильтра', estimatedCost: 1200 },
  { type: 'inspection', title: 'Диагностика ходовой', estimatedCost: 3000 },
  { type: 'inspection', title: 'Компьютерная диагностика', estimatedCost: 2000 },
  { type: 'other', title: 'Замена аккумулятора', estimatedCost: 7000 },
  { type: 'other', title: 'Замена свечей зажигания', estimatedCost: 3000 },
]

export const SERVICE_COLORS: Record<ServiceType, string> = {
  oil_change: '#FF8F00',
  tire: '#5C6BC0',
  brake: '#E53935',
  filter: '#43A047',
  inspection: '#1E88E5',
  other: '#757575',
}

export const EXPENSE_COLORS: Record<ExpenseCategory, string> = {
  insurance: '#1E88E5',
  tax: '#E53935',
  parking: '#43A047',
  fine: '#FF8F00',
  wash: '#5C6BC0',
  other: '#757575',
}
