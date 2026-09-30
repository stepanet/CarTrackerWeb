import { supabase } from './supabase';
import type { Reminder } from '../models/Reminder';

// ═══════════════════════════════════════════════
// Тип строки в базе (snake_case)
// ═══════════════════════════════════════════════

interface ReminderRow {
  id: string;
  user_id: string;
  vehicle_id: string | null;   // ← НОВОЕ
  title: string;
  icon: string;
  interval_km: number;
  interval_months: number;
  last_date: string;
  last_mileage: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════
// Конвертация DB ↔ App
// ═══════════════════════════════════════════════

function rowToReminder(row: ReminderRow): Reminder {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    title: row.title,
    icon: row.icon,
    intervalKm: row.interval_km,
    intervalMonths: row.interval_months,
    lastDate: row.last_date,
    lastMileage: row.last_mileage,
    isEnabled: row.is_enabled,
  };
}

function reminderToRow(reminder: Reminder, userId: string) {
  return {
    id: reminder.id,
    user_id: userId,
    vehicle_id: reminder.vehicleId ?? null,   // ← НОВОЕ
    title: reminder.title,
    icon: reminder.icon,
    interval_km: reminder.intervalKm,
    interval_months: reminder.intervalMonths,
    last_date: reminder.lastDate,
    last_mileage: reminder.lastMileage,
    is_enabled: reminder.isEnabled,
  };
}

// ═══════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════

/** Получить все напоминания пользователя */
export async function fetchAllReminders(
  userId: string,
  vehicleId?: string,   // ← НОВЫЙ ПАРАМЕТР
): Promise<Reminder[]> {
  let query = supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (vehicleId) {
    query = query.eq('vehicle_id', vehicleId);
  }

  const { data, error } = await query;

  if (error) throw error;
  if (!data) return [];

  return data.map((row) => rowToReminder(row as ReminderRow));
}

/** Создать напоминание */
export async function createReminder(
  reminder: Reminder,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('reminders')
    .insert(reminderToRow(reminder, userId));

  if (error) throw error;
}

/** Обновить напоминание */
export async function updateReminder(
  reminder: Reminder,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from('reminders')
    .update(reminderToRow(reminder, userId))
    .eq('id', reminder.id);

  if (error) throw error;
}

/** Удалить напоминание */
export async function deleteReminder(reminderId: string): Promise<void> {
  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('id', reminderId);

  if (error) throw error;
}

/** Массовая вставка (для миграции из localStorage) */
export async function bulkInsertReminders(
  reminders: Reminder[],
  userId: string,
): Promise<{ inserted: number; skipped: number }> {
  if (reminders.length === 0) return { inserted: 0, skipped: 0 };

  // Сначала смотрим, какие id уже есть в базе у этого пользователя
  const ids = reminders.map((r) => r.id);
  const { data: existing, error: fetchError } = await supabase
    .from('reminders')
    .select('id')
    .eq('user_id', userId)
    .in('id', ids);

  if (fetchError) throw fetchError;

  const existingIds = new Set((existing ?? []).map((r) => r.id));
  const toInsert = reminders.filter((r) => !existingIds.has(r.id));

  if (toInsert.length === 0) {
    return { inserted: 0, skipped: reminders.length };
  }

  const rows = toInsert.map((r) => reminderToRow(r, userId));
  const { error } = await supabase.from('reminders').insert(rows);

  if (error) throw error;

  return {
    inserted: toInsert.length,
    skipped: reminders.length - toInsert.length,
  };
}

/**
 * Миграция: привязать все напоминания без vehicle_id к указанному транспорту.
 */
export async function migrateRemindersToVehicle(
  userId: string,
  vehicleId: string,
): Promise<number> {
  const { data: orphanReminders, error: fetchError } = await supabase
    .from('reminders')
    .select('id')
    .eq('user_id', userId)
    .is('vehicle_id', null);

  if (fetchError) throw fetchError;
  if (!orphanReminders || orphanReminders.length === 0) return 0;

  const ids = orphanReminders.map((r) => r.id);

  const { error: updateError } = await supabase
    .from('reminders')
    .update({ vehicle_id: vehicleId })
    .in('id', ids);

  if (updateError) throw updateError;

  return ids.length;
}