import { create } from 'zustand';
import type { Reminder, ReminderStatus } from '../models/Reminder';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  fetchAllReminders,
  createReminder as apiCreateReminder,
  updateReminder as apiUpdateReminder,
  deleteReminder as apiDeleteReminder,
  bulkInsertReminders,
} from '../lib/remindersApi';
import { subscribeToReminderChanges } from '../lib/realtimeHelpers';

interface ReminderState {
  reminders: Reminder[];

  // Состояние
  isLoading: boolean;
  error: string | null;
  userId: string | null;
  realtimeChannel: RealtimeChannel | null;

  // Загрузка / синхронизация
  loadReminders: (userId: string) => Promise<void>;
  subscribeRealtime: (userId: string) => void;
  unsubscribeRealtime: () => void;
  clearReminders: () => void;

  // Миграция
  migrateFromLocalStorage: (userId: string) => Promise<number>;

  // CRUD
  add: (reminder: Reminder) => Promise<void>;
  update: (reminder: Reminder) => Promise<void>;
  remove: (id: string) => Promise<void>;

  // Действия
  markDone: (id: string, currentMileage: number) => Promise<void>;
  toggleEnabled: (id: string) => Promise<void>;
}

export const useReminderStore = create<ReminderState>((set, get) => ({
  reminders: [],
  isLoading: false,
  error: null,
  userId: null,
  realtimeChannel: null,

  // ─── Загрузка ───────────────────────────────

  loadReminders: async (userId: string) => {
    set({ isLoading: true, error: null, userId });
    try {
      const reminders = await fetchAllReminders(userId);
      set({ reminders, isLoading: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Ошибка загрузки напоминаний';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  subscribeRealtime: (userId: string) => {
    // Отписываемся от старой подписки, если есть
    get().unsubscribeRealtime();

    const channel = subscribeToReminderChanges(userId, async () => {
      try {
        const reminders = await fetchAllReminders(userId);
        set({ reminders });
      } catch (err) {
        console.error('Ошибка realtime-синхронизации напоминаний:', err);
      }
    });

    set({ realtimeChannel: channel });
  },

  unsubscribeRealtime: () => {
    const { realtimeChannel } = get();
    if (realtimeChannel) {
      realtimeChannel.unsubscribe();
      set({ realtimeChannel: null });
    }
  },

  clearReminders: () => {
    get().unsubscribeRealtime();
    set({ reminders: [], userId: null, error: null });
  },

  // ─── Миграция ───────────────────────────────

  migrateFromLocalStorage: async (userId: string) => {
    try {
      const raw = localStorage.getItem('cartracker-reminders');
      if (!raw) return 0;

      const parsed = JSON.parse(raw);
      const reminders: Reminder[] = parsed?.state?.reminders ?? [];
      if (reminders.length === 0) {
        localStorage.removeItem('cartracker-reminders');
        return 0;
      }

      const result = await bulkInsertReminders(reminders, userId);

      // Очищаем localStorage В ЛЮБОМ СЛУЧАЕ — миграция больше не нужна
      localStorage.removeItem('cartracker-reminders');

      if (result.skipped > 0) {
        console.log(
          `ℹ️ Напоминания: добавлено ${result.inserted}, пропущено дубликатов ${result.skipped}`,
        );
      }

      return result.inserted;
    } catch (err) {
      console.error('Ошибка миграции напоминаний:', err);
      return 0;
    }
  },

  // ─── CRUD ───────────────────────────────────

  add: async (reminder) => {
    const { userId } = get();
    if (!userId) throw new Error('Не авторизован');

    // 1. Оптимистично добавляем
    set((state) => ({
      reminders: [...state.reminders, reminder],
    }));

    // 2. Сохраняем в Supabase
    try {
      await apiCreateReminder(reminder, userId);
    } catch (err) {
      // Откатываем
      set((state) => ({
        reminders: state.reminders.filter((r) => r.id !== reminder.id),
      }));
      throw err;
    }
  },

  update: async (reminder) => {
    const { userId } = get();
    if (!userId) throw new Error('Не авторизован');

    const previous = get().reminders.find((r) => r.id === reminder.id);

    // 1. Оптимистично обновляем
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === reminder.id ? reminder : r,
      ),
    }));

    // 2. Сохраняем в Supabase
    try {
      await apiUpdateReminder(reminder, userId);
    } catch (err) {
      // Откатываем
      if (previous) {
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === previous.id ? previous : r,
          ),
        }));
      }
      throw err;
    }
  },

  remove: async (id) => {
    const previous = get().reminders.find((r) => r.id === id);

    // 1. Оптимистично удаляем
    set((state) => ({
      reminders: state.reminders.filter((r) => r.id !== id),
    }));

    // 2. Удаляем из Supabase
    try {
      await apiDeleteReminder(id);
    } catch (err) {
      // Откатываем
      if (previous) {
        set((state) => ({
          reminders: [...state.reminders, previous],
        }));
      }
      throw err;
    }
  },

  // ─── Действия ───────────────────────────────

  markDone: async (id, currentMileage) => {
    const reminder = get().reminders.find((r) => r.id === id);
    if (!reminder) return;

    const updated: Reminder = {
      ...reminder,
      lastDate: new Date().toISOString(),
      lastMileage: currentMileage,
    };

    await get().update(updated);
  },

  toggleEnabled: async (id) => {
    const reminder = get().reminders.find((r) => r.id === id);
    if (!reminder) return;

    const updated: Reminder = {
      ...reminder,
      isEnabled: !reminder.isEnabled,
    };

    await get().update(updated);
  },
}));

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

  const nextDate = getNextDate(reminder);
  if (nextDate) {
    const daysLeft = Math.floor(
      (nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (daysLeft < 0) return 'overdue';
    if (daysLeft < 30) return 'soon';
  }

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