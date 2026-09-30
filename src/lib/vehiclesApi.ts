import { supabase } from './supabase';
import type { Vehicle, VehicleType } from '../models/Vehicle';

// ═══════════════════════════════════════════════
// Тип строки в базе (snake_case)
// ═══════════════════════════════════════════════

interface VehicleRow {
  id: string;
  user_id: string;
  name: string;
  type: string;
  plate: string;
  year: number | null;
  icon: string;
  initial_mileage: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════
// Конвертеры
// ═══════════════════════════════════════════════

function rowToVehicle(row: VehicleRow): Vehicle {
  return {
    id: row.id,
    name: row.name,
    type: row.type as VehicleType,
    plate: row.plate,
    year: row.year ?? undefined,
    icon: row.icon,
    initialMileage: row.initial_mileage,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function vehicleToRow(vehicle: Vehicle, userId: string) {
  return {
    id: vehicle.id,
    user_id: userId,
    name: vehicle.name,
    type: vehicle.type,
    plate: vehicle.plate,
    year: vehicle.year ?? null,
    icon: vehicle.icon,
    initial_mileage: vehicle.initialMileage,
    is_default: vehicle.isDefault,
  };
}

// ═══════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════

/** Получить все транспорты пользователя */
export async function fetchAllVehicles(userId: string): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  if (!data) return [];

  return data.map((row) => rowToVehicle(row as VehicleRow));
}

/** Создать транспорт */
export async function createVehicleApi(
  vehicle: Vehicle,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('vehicles')
    .insert(vehicleToRow(vehicle, userId));

  if (error) throw error;
}

/** Обновить транспорт */
export async function updateVehicleApi(
  vehicle: Vehicle,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('vehicles')
    .update(vehicleToRow(vehicle, userId))
    .eq('id', vehicle.id);

  if (error) throw error;
}

/** Удалить транспорт (работы и напоминания удалятся каскадно) */
export async function deleteVehicleApi(vehicleId: string): Promise<void> {
  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', vehicleId);

  if (error) throw error;
}

/** Массовая вставка (для миграции) */
export async function bulkInsertVehicles(
  vehicles: Vehicle[],
  userId: string,
): Promise<number> {
  if (vehicles.length === 0) return 0;

  const ids = vehicles.map((v) => v.id);
  const { data: existing, error: fetchError } = await supabase
    .from('vehicles')
    .select('id')
    .eq('user_id', userId)
    .in('id', ids);

  if (fetchError) throw fetchError;

  const existingIds = new Set((existing ?? []).map((r) => r.id));
  const toInsert = vehicles.filter((v) => !existingIds.has(v.id));

  if (toInsert.length === 0) return 0;

  const rows = toInsert.map((v) => vehicleToRow(v, userId));
  const { error } = await supabase.from('vehicles').insert(rows);

  if (error) throw error;

  return toInsert.length;
}