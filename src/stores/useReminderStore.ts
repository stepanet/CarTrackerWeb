import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Reminder, ReminderStatus } from '../models/Reminder';

interface ReminderState {
  reminders: Reminder[];

  // CRUD
  add: (reminder: Reminder) => void;
  update: (reminder: Reminder) => void;
  remove: (id: string) => void;
  replaceAll: (reminders: Reminder[]) => void;

  // Действия
  markDone: (id: string, currentMileage: number) => void;
  toggleEnabled: (id: string) => void;
}

export const useReminderStore = create<ReminderState>()(
  persist(
    (set, get) => ({
      reminders: [],

      add: (reminder) =>
        set((state) => ({
          reminders: [...state.reminders, reminder],
        })),

      update: (reminder) =>
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === reminder.id ? reminder : r,
          ),
        })),

      remove: (id) =>
        set((state) => ({
          reminders: state.reminders.filter((r) => r.id !== id),
        })),

      replaceAll: (reminders) => set({ reminders }),

      markDone: (id, currentMileage) =>
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === id
              ? {
                  ...r,
                  lastDate: new Date().toISOString(),
                  lastMileage: currentMileage,
                }
              : r,
          ),
        })),

      toggleEnabled: (id) =>
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === id ? { ...r, isEnabled: !r.isEnabled } : r,
          ),
        })),
    }),
    {
      name: 'cartracker-reminders',
    },
  ),
);

// ═══════════════════════════════════════════════
// Логика статусов — вынесена в отдельный модуль,
// чтобы использовать в компонентах без импорта store
// ═══════════════════════════════════════════════

/** Следующая дата замены (null, если интервал по месяцам не задан) */
export function getNextDate(reminder: Reminder): Date | null {
  if (reminder.intervalMonths <= 0) return null;
  const d = new Date(reminder.lastDate);
  d.setMonth(d.getMonth() + reminder.intervalMonths);
  return d;
}

/** Следующий пробег замены (null, если интервал по км не задан) */
export function getNextMileage(reminder: Reminder): number | null {
  if (reminder.intervalKm <= 0) return null;
  return reminder.lastMileage + reminder.intervalKm;
}

/** Определить статус напоминания */
export function getStatus(
  reminder: Reminder,
  currentMileage: number,
): ReminderStatus {
  if (!reminder.isEnabled) return 'disabled';

  // По дате
  const nextDate = getNextDate(reminder);
  if (nextDate) {
    const daysLeft = Math.floor(
      (nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (daysLeft < 0) return 'overdue';
    if (daysLeft < 30) return 'soon';
  }

  // По пробегу
  const nextMileage = getNextMileage(reminder);
  if (nextMileage !== null) {
    const kmLeft = nextMileage - currentMileage;
    if (kmLeft < 0) return 'overdue';
    if (kmLeft < 1000) return 'soon';
  }

  return 'ok';
}

/** Текст «осталось X км • Y дн.» */
export function getRemainingText(
  reminder: Reminder,
  currentMileage: number,
): string {
  if (!reminder.isEnabled) return 'Выключено';

  const parts: string[] = [];

  const nextMileage = getNextMileage(reminder);
  if (nextMileage !== null) {
    const kmLeft = nextMileage - currentMileage;
    if (kmLeft < 0) {
      parts.push(`просрочено на ${Math.abs(kmLeft).toLocaleString('ru-RU')} км`);
    } else {
      parts.push(`осталось ${kmLeft.toLocaleString('ru-RU')} км`);
    }
  }

  const nextDate = getNextDate(reminder);
  if (nextDate) {
    const days = Math.floor(
      (nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (days < 0) {
      parts.push(`просрочено на ${Math.abs(days)} дн.`);
    } else {
      parts.push(`осталось ${days} дн.`);
    }
  }

  return parts.length === 0 ? '—' : parts.join(' • ');
}

/** Описание интервала «каждые 10 000 км или 12 месяцев» */
export function getIntervalDescription(reminder: Reminder): string {
  const parts: string[] = [];

  if (reminder.intervalKm > 0) {
    parts.push(`каждые ${reminder.intervalKm.toLocaleString('ru-RU')} км`);
  }

  if (reminder.intervalMonths > 0) {
    const n = reminder.intervalMonths;
    const mod10 = n % 10;
    const mod100 = n % 100;
    let word = 'месяцев';
    if (mod100 >= 11 && mod100 <= 14) word = 'месяцев';
    else if (mod10 === 1) word = 'месяц';
    else if (mod10 >= 2 && mod10 <= 4) word = 'месяца';

    parts.push(`каждые ${n} ${word}`);
  }

  return parts.length === 0 ? 'интервал не задан' : parts.join(' или ');
}