import {
  Car,
  Bike,
  Snowflake,
  Sprout,
  Tractor,
  Zap,
  Anchor,
  Truck,
  Box,
  type LucideIcon,
} from 'lucide-react';

// ═══════════════════════════════════════════════
// Тип транспорта / техники
// ═══════════════════════════════════════════════

export type VehicleType =
  | 'car'
  | 'motorcycle'
  | 'scooter'
  | 'snowblower'
  | 'lawnmower'
  | 'tiller'
  | 'generator'
  | 'atv'
  | 'boat'
  | 'trailer'
  | 'other';

/** Список всех типов (для UI) */
export const ALL_VEHICLE_TYPES: VehicleType[] = [
  'car',
  'motorcycle',
  'scooter',
  'snowblower',
  'lawnmower',
  'tiller',
  'generator',
  'atv',
  'boat',
  'trailer',
  'other',
];

/** Читаемые названия */
export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  car: 'Машина',
  motorcycle: 'Мотоцикл',
  scooter: 'Скутер',
  snowblower: 'Снегоуборщик',
  lawnmower: 'Газонокосилка',
  tiller: 'Мотоблок',
  generator: 'Генератор',
  atv: 'Квадроцикл',
  boat: 'Лодка',
  trailer: 'Прицеп',
  other: 'Другое',
};

/** Иконки Lucide для UI */
export const VEHICLE_TYPE_ICONS: Record<VehicleType, LucideIcon> = {
  car: Car,
  motorcycle: Bike,
  scooter: Bike,
  snowblower: Snowflake,
  lawnmower: Sprout,
  tiller: Tractor,
  generator: Zap,
  atv: Car,
  boat: Anchor,
  trailer: Truck,
  other: Box,
};

/**
 * Иконки для ключа `icon`, который хранится в БД.
 * Совместимо со старыми записями (car, bike, truck).
 */
export const VEHICLE_ICON_MAP: Record<string, LucideIcon> = {
  car: Car,
  bike: Bike,
  truck: Truck,
  snowflake: Snowflake,
  sprout: Sprout,
  tractor: Tractor,
  zap: Zap,
  anchor: Anchor,
  box: Box,
};

// ═══════════════════════════════════════════════
// Модель Vehicle
// ═══════════════════════════════════════════════

export interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  plate: string;
  year?: number;
  icon: string;          // ключ: 'car', 'snowflake', 'sprout' и т.д.
  initialMileage: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════
// Хелперы
// ═══════════════════════════════════════════════

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

export function vehicleDisplayName(vehicle: Vehicle): string {
  if (vehicle.name.trim()) return vehicle.name;
  return VEHICLE_TYPE_LABELS[vehicle.type];
}

export function vehicleSubtitle(vehicle: Vehicle): string {
  const parts: string[] = [];
  if (vehicle.plate) parts.push(vehicle.plate);
  if (vehicle.year) parts.push(`${vehicle.year} г.`);
  return parts.join(' · ');
}

export function vehicleIcon(key: string): LucideIcon {
  return VEHICLE_ICON_MAP[key] ?? Car;
}