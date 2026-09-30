import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Reminder, ReminderStatus } from '../models/Reminder';
import {
  fetchAllReminders,
  createReminder as apiCreateReminder,
  updateReminder as apiUpdateReminder,
  deleteReminder as apiDeleteReminder,
  bulkInsertReminders,
  migrateRemindersToVehicle,
} from '../lib/remindersApi';
import { subscribeToReminderChanges } from '../lib/realtimeHelpers';
import { useVehicleStore } from './useVehicleStore';

// ═══════════════════════════════════════════════
// Состояние
// ═══════════════════════════════════════════════

interface ReminderState {
  reminders: Reminder[];

  isLoading: boolean;
  error: string | null;
  userId: string | null;
  realtimeChannel: RealtimeChannel | null;

  // Загрузка
  loadReminders: (userId: string) => Promise<void>;
  reload: () => Promise<void>;
  subscribeRealtime: (userId: string) => void;
  unsubscribeRealtime: () => void;
  clear: () => void;

  // Миграция
  migrateFromLocalStorage: (userId: string) => Promise<number>;
  migrateOrphanReminders: (userId: string, vehicleId: string) => Promise<number>;

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
      const activeVehicleId = useVehicleStore.getState().activeVehicleId;
      const reminders = await fetchAllReminders(
        userId,
        activeVehicleId ?? undefined,
      );
      set({ reminders, isLoading: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Ошибка загрузки напоминаний';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  reload: async () => {
    const { userId } = get();
    if (!userId) return;
    await get().loadReminders(userId);
  },

  subscribeRealtime: (userId: string) => {
    get().unsubscribeRealtime();

    const channel = subscribeToReminderChanges(userId, async () => {
      try {
        const activeVehicleId = useVehicleStore.getState().activeVehicleId;
        const reminders = await fetchAllReminders(
          userId,
          activeVehicleId ?? undefined,
        );
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

  clear: () => {
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

  migrateOrphanReminders: async (userId: string, vehicleId: string) => {
    try {
      const count = await migrateRemindersToVehicle(userId, vehicleId);
      if (count > 0) {
        console.log(`🔄 Привязано напоминаний к транспорту: ${count}`);
      }
      return count;
    } catch (err) {
      console.error('Ошибка миграции напоминаний:', err);
      return 0;
    }
  },

  // ─── CRUD ───────────────────────────────────

  add: async (reminder) => {
    const { userId } = get();
    if (!userId) throw new Error('Не авторизован');

    // Проставляем активный транспорт, если не задан
    const activeVehicleId = useVehicleStore.getState().activeVehicleId;
    const withVehicle: Reminder = {
      ...reminder,
      vehicleId: reminder.vehicleId ?? activeVehicleId,
    };

    set((state) => ({
      reminders: [...state.reminders, withVehicle],
    }));

    try {
      await apiCreateReminder(withVehicle, userId);
    } catch (err) {
      set((state) => ({
        reminders: state.reminders.filter((r) => r.id !== withVehicle.id),
      }));
      throw err;
    }
  },

  update: async (reminder) => {
    const { userId } = get();
    if (!userId) throw new Error('Не авторизован');

    const previous = get().reminders.find((r) => r.id === reminder.id);

    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === reminder.id ? reminder : r,
      ),
    }));

    try {
      await apiUpdateReminder(reminder, userId);
    } catch (err) {
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

    set((state) => ({
      reminders: state.reminders.filter((r) => r.id !== id),
    }));

    try {
      await apiDeleteReminder(id);
    } catch (err) {
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
// Логика статусов (без изменений)
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