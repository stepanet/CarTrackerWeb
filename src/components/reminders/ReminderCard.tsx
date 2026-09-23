import type { Reminder } from '../../models/Reminder';
import { STATUS_LABELS, STATUS_COLORS } from '../../models/Reminder';
import {
  getStatus,
  getRemainingText,
  getIntervalDescription,
  getNextDate,
  getNextMileage,
} from '../../stores/useReminderStore';

interface ReminderCardProps {
  reminder: Reminder;
  currentMileage: number;
  onMarkDone: (id: string) => void;
  onToggleEnabled: (id: string) => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
}

export function ReminderCard({
  reminder,
  currentMileage,
  onMarkDone,
  onToggleEnabled,
  onEdit,
  onDelete,
}: ReminderCardProps) {
  const status = getStatus(reminder, currentMileage);
  const colors = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];
  const progress = getProgress(reminder, currentMileage);

  const nextDate = getNextDate(reminder);
  const nextMileage = getNextMileage(reminder);

  return (
    <div
      className={`bg-white rounded-xl shadow-sm overflow-hidden relative ${
        status === 'disabled' ? 'opacity-60' : ''
      }`}
    >
      {/* Цветная полоса слева */}
      <div
        className={`absolute top-0 left-0 bottom-0 w-1 ${colors.dot}`}
      />

      <div className="p-3 pl-4">
        {/* Верхняя строка: иконка + название + бейдж */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${colors.bg} ${colors.text}`}
          >
            <span className="text-base">🔧</span>
          </div>

          <div className="flex-1 min-w-0">
            <p
              className={`font-semibold text-gray-900 leading-tight ${
                status === 'disabled' ? 'line-through text-gray-500' : ''
              }`}
            >
              {reminder.title}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {getIntervalDescription(reminder)}
            </p>
          </div>

          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${colors.bg} ${colors.text}`}
          >
            {label}
          </span>
        </div>

        {/* Прогресс-бар */}
        {reminder.isEnabled && (
          <div className="mb-3">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${colors.dot}`}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <p className={`text-xs font-medium mt-1.5 ${colors.text}`}>
              {getRemainingText(reminder, currentMileage)}
            </p>
          </div>
        )}

        {/* Детали: последнее → следующее */}
        <div className="flex items-center gap-3 text-xs mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-gray-400 mb-0.5">Последнее</p>
            {reminder.lastMileage > 0 && (
              <p className="font-medium text-gray-700">
                {reminder.lastMileage.toLocaleString('ru-RU')} км
              </p>
            )}
            <p className="text-gray-500 truncate">
              {new Date(reminder.lastDate).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>

          <span className="text-gray-300 shrink-0">→</span>

          <div className="flex-1 min-w-0">
            <p className="text-gray-400 mb-0.5">Следующее</p>
            {nextMileage !== null && (
              <p className="font-medium text-gray-700">
                {nextMileage.toLocaleString('ru-RU')} км
              </p>
            )}
            {nextDate && (
              <p className="text-gray-500 truncate">
                {nextDate.toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex gap-2">
          {reminder.isEnabled && (
            <button
              onClick={() => onMarkDone(reminder.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${colors.bg} ${colors.text} hover:opacity-80`}
            >
              ✓ Сделано сегодня
            </button>
          )}
          <button
            onClick={() => onEdit(reminder)}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
            title="Редактировать"
          >
            ✏️
          </button>
          <button
            onClick={() => onToggleEnabled(reminder.id)}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
            title={reminder.isEnabled ? 'Выключить' : 'Включить'}
          >
            {reminder.isEnabled ? '🔕' : '🔔'}
          </button>
          <button
            onClick={() => {
              if (confirm(`Удалить «${reminder.title}»?`)) {
                onDelete(reminder.id);
              }
            }}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-red-600 hover:bg-red-50"
            title="Удалить"
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Прогресс ─────────────────────────────────

/**
 * Прогресс от 0 (только что сделано) до 1 (пора).
 * Учитывает и км, и дату — берёт максимум.
 */
function getProgress(reminder: Reminder, currentMileage: number): number {
  if (!reminder.isEnabled) return 0;

  let maxProgress = 0;

  // По км
  if (reminder.intervalKm > 0) {
    const passed = currentMileage - reminder.lastMileage;
    maxProgress = Math.max(maxProgress, passed / reminder.intervalKm);
  }

  // По дате
  if (reminder.intervalMonths > 0) {
    const lastDate = new Date(reminder.lastDate);
    const nextDate = new Date(lastDate);
    nextDate.setMonth(nextDate.getMonth() + reminder.intervalMonths);

    const totalInterval = nextDate.getTime() - lastDate.getTime();
    const elapsed = Date.now() - lastDate.getTime();

    if (totalInterval > 0) {
      maxProgress = Math.max(maxProgress, elapsed / totalInterval);
    }
  }

  return Math.min(Math.max(maxProgress, 0), 1);
}