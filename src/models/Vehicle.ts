import {
  Car,
  Bike,
  Truck,
  type LucideIcon,
} from 'lucide-react';

// ═══════════════════════════════════════════════
// Тип транспорта
// ═══════════════════════════════════════════════

export type VehicleType = 'car' | 'motorcycle' | 'scooter' | 'other';

/** Список всех типов (для UI) */
export const ALL_VEHICLE_TYPES: VehicleType[] = [
  'car',
  'motorcycle',
  'scooter',
  'other',
];

/** Читаемые названия */
export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  car: 'Машина',
  motorcycle: 'Мотоцикл',
  scooter: 'Скутер',
  other: 'Другое',
};

/** Иконки для UI (Lucide) */
export const VEHICLE_TYPE_ICONS: Record<VehicleType, LucideIcon> = {
  car: Car,
  motorcycle: Bike,
  scooter: Bike, // заменим позже, если понадобится отдельная
  other: Truck,
};

/** Иконки Lucide для выбора в форме (соответствуют ключам, которые хранятся в БД) */
export const VEHICLE_ICON_MAP: Record<string, LucideIcon> = {
  car: Car,
  bike: Bike,
  truck: Truck,
};

// ═══════════════════════════════════════════════
// Модель Vehicle
// ═══════════════════════════════════════════════

export interface Vehicle {
  id: string;                     // UUID
  name: string;                   // "Toyota Camry" или "Моя машина"
  type: VehicleType;
  plate: string;                  // госномер
  year?: number;                  // год выпуска (опционально)
  icon: string;                   // ключ иконки: 'car', 'bike', 'truck'
  initialMileage: number;         // начальный пробег (пробег при добавлении ТС)
  isDefault: boolean;             // "по умолчанию" — куда падают работы без vehicle_id
  createdAt: string;              // ISO 8601
  updatedAt: string;              // ISO 8601
}

// ═══════════════════════════════════════════════
// Хелперы
// ═══════════════════════════════════════════════

/** Создать новый транспорт с дефолтными значениями */
export function createVehicle(
  name: string,
  type: VehicleType,
  plate: string = '',
  year: number | null = null,
  icon: string = 'car',
  initialMileage: number = 0,
): Vehicle {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    type,
    plate: plate.trim(),
    year: year ?? undefined,
    icon,
    initialMileage,
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  };
}

/** Отображаемое имя: если имя пустое — используем тип */
export function vehicleDisplayName(vehicle: Vehicle): string {
  if (vehicle.name.trim()) return vehicle.name;
  return VEHICLE_TYPE_LABELS[vehicle.type];
}

/** Описание: "Toyota Camry · А123БВ 77" */
export function vehicleSubtitle(vehicle: Vehicle): string {
  const parts: string[] = [];
  if (vehicle.plate) parts.push(vehicle.plate);
  if (vehicle.year) parts.push(`${vehicle.year} г.`);
  return parts.join(' · ');
}

/** Иконка по ключу */
export function vehicleIcon(key: string): LucideIcon {
  return VEHICLE_ICON_MAP[key] ?? Car;
}