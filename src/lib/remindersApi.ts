import { supabase } from './supabase';
import type { Reminder } from '../models/Reminder';

// ═══════════════════════════════════════════════
// Тип строки в базе (snake_case)
// ═══════════════════════════════════════════════

interface ReminderRow {
  id: string;
  user_id: string;
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
export async function fetchAllReminders(userId: string): Promise<Reminder[]> {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

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
): Promise<void> {
  if (reminders.length === 0) return;

  const rows = reminders.map((r) => reminderToRow(r, userId));
  const { error } = await supabase.from('reminders').insert(rows);

  if (error) throw error;
}