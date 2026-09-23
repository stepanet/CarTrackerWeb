/** Статус напоминания (совпадает с ReminderStatus в Swift) */
export type ReminderStatus = 'ok' | 'soon' | 'overdue' | 'disabled';

/** Читаемые названия статусов */
export const STATUS_LABELS: Record<ReminderStatus, string> = {
  ok: 'В порядке',
  soon: 'Скоро',
  overdue: 'Пора',
  disabled: 'Выключено',
};

/** Цвета для UI (Tailwind-классы) */
export const STATUS_COLORS: Record<ReminderStatus, {
  bg: string;
  text: string;
  border: string;
  dot: string;
}> = {
  ok: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-500',
    dot: 'bg-green-500',
  },
  soon: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-500',
    dot: 'bg-orange-500',
  },
  overdue: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-500',
    dot: 'bg-red-500',
  },
  disabled: {
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    border: 'border-gray-300',
    dot: 'bg-gray-400',
  },
};

/**
 * Напоминание о ТО.
 * Поля точно совпадают с Reminder в Swift.
 */
export interface Reminder {
  id: string;
  title: string;
  icon: string;
  intervalKm: number;
  intervalMonths: number;
  lastDate: string;        // ISO 8601
  lastMileage: number;
  isEnabled: boolean;
}

/** Создать новое напоминание */
export function createReminder(
  title: string,
  icon: string,
  intervalKm: number,
  intervalMonths: number,
  lastDate: Date,
  lastMileage: number,
  isEnabled: boolean = true,
): Reminder {
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    icon,
    intervalKm,
    intervalMonths,
    lastDate: lastDate.toISOString(),
    lastMileage,
    isEnabled,
  };
}