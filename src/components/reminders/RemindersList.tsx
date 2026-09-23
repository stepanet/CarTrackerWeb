import { useState, useMemo } from 'react';
import { useCarWorkStore } from '../../stores/useCarWorkStore';
import { useReminderStore, getStatus } from '../../stores/useReminderStore';
import type { Reminder } from '../../models/Reminder';
import { ReminderCard } from './ReminderCard';
import { ReminderForm } from './ReminderForm';

export function RemindersList() {
  const works = useCarWorkStore((s) => s.works);
  const reminders = useReminderStore((s) => s.reminders);
  const add = useReminderStore((s) => s.add);
  const update = useReminderStore((s) => s.update);
  const remove = useReminderStore((s) => s.remove);
  const markDone = useReminderStore((s) => s.markDone);
  const toggleEnabled = useReminderStore((s) => s.toggleEnabled);

  const [showingForm, setShowingForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  // Текущий пробег = максимум из работ
  const currentMileage = useMemo(
    () => works.reduce((max, w) => Math.max(max, w.mileage), 0),
    [works],
  );

  // Сортировка по статусу (🔴 → 🟡 → 🟢 → ⚪)
  const sortedReminders = useMemo(() => {
    const order = { overdue: 0, soon: 1, ok: 2, disabled: 3 };
    return [...reminders].sort((a, b) => {
      const sa = getStatus(a, currentMileage);
      const sb = getStatus(b, currentMileage);
      return order[sa] - order[sb];
    });
  }, [reminders, currentMileage]);

  // Сводка
  const summary = useMemo(() => {
    let overdue = 0;
    let soon = 0;
    let ok = 0;
    for (const r of reminders) {
      const s = getStatus(r, currentMileage);
      if (s === 'overdue') overdue++;
      else if (s === 'soon') soon++;
      else if (s === 'ok') ok++;
    }
    return { overdue, soon, ok };
  }, [reminders, currentMileage]);

  // ─── Действия ───────────────────────────────

  const handleSave = (reminder: Reminder) => {
    if (editingReminder) {
      update(reminder);
    } else {
      add(reminder);
    }
    closeForm();
  };

  const handleMarkDone = (id: string) => {
    markDone(id, currentMileage);
  };

  const openAddForm = () => {
    setEditingReminder(null);
    setShowingForm(true);
  };

  const openEditForm = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setShowingForm(true);
  };

  const closeForm = () => {
    setShowingForm(false);
    setEditingReminder(null);
  };

  const installDefaults = () => {
    const today = new Date();
    const defaults: Reminder[] = [
      {
        id: crypto.randomUUID(),
        title: 'Замена масла',
        icon: '🛢',
        intervalKm: 10000,
        intervalMonths: 12,
        lastDate: today.toISOString(),
        lastMileage: currentMileage,
        isEnabled: true,
      },
      {
        id: crypto.randomUUID(),
        title: 'Ротация шин',
        icon: '🛞',
        intervalKm: 15000,
        intervalMonths: 12,
        lastDate: today.toISOString(),
        lastMileage: currentMileage,
        isEnabled: true,
      },
      {
        id: crypto.randomUUID(),
        title: 'Замена тормозной жидкости',
        icon: '💧',
        intervalKm: 0,
        intervalMonths: 24,
        lastDate: today.toISOString(),
        lastMileage: 0,
        isEnabled: true,
      },
      {
        id: crypto.randomUUID(),
        title: 'Замена салонного фильтра',
        icon: '🌀',
        intervalKm: 20000,
        intervalMonths: 12,
        lastDate: today.toISOString(),
        lastMileage: currentMileage,
        isEnabled: true,
      },
    ];
    for (const r of defaults) {
      add(r);
    }
  };

  // ─── Пустое состояние ────────────────────────

  if (reminders.length === 0) {
    return (
      <>
        <div className="bg-white rounded-xl p-8 text-center shadow-sm">
          <p className="text-5xl mb-3">🔔</p>
          <p className="text-gray-600 font-medium mb-1">
            Пока нет напоминаний
          </p>
          <p className="text-sm text-gray-400 mb-4">
            Создайте правило — приложение подскажет, когда пора делать ТО
          </p>
          <div className="flex flex-col gap-2 max-w-xs mx-auto">
            <button
              onClick={installDefaults}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              ✨ Установить типовой набор
            </button>
            <button
              onClick={openAddForm}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
            >
              Создать своё
            </button>
          </div>
        </div>

        {showingForm && (
          <ReminderForm
            reminder={editingReminder}
            onSave={handleSave}
            onCancel={closeForm}
          />
        )}
      </>
    );
  }

  // ─── Основной вид ────────────────────────────

  return (
    <>
      <div className="space-y-4 pb-4">
        {/* Сводка */}
        <div className="grid grid-cols-3 gap-2">
          <SummaryBadge count={summary.overdue} label="Пора" color="red" />
          <SummaryBadge count={summary.soon} label="Скоро" color="orange" />
          <SummaryBadge count={summary.ok} label="ОК" color="green" />
        </div>

        {/* Список карточек */}
        <div className="space-y-3">
          {sortedReminders.map((r) => (
            <ReminderCard
              key={r.id}
              reminder={r}
              currentMileage={currentMileage}
              onMarkDone={handleMarkDone}
              onToggleEnabled={toggleEnabled}
              onEdit={openEditForm}
              onDelete={remove}
            />
          ))}
        </div>
      </div>

      {/* Плавающая кнопка "+" */}
      <button
        onClick={openAddForm}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-blue-600 text-white text-3xl shadow-lg flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-transform z-10"
        aria-label="Добавить напоминание"
      >
        +
      </button>

      {showingForm && (
        <ReminderForm
          reminder={editingReminder}
          onSave={handleSave}
          onCancel={closeForm}
        />
      )}
    </>
  );
}

// ─── Сводка ──────────────────────────────────

interface SummaryBadgeProps {
  count: number;
  label: string;
  color: 'red' | 'orange' | 'green';
}

function SummaryBadge({ count, label, color }: SummaryBadgeProps) {
  const colorClasses = {
    red: 'text-red-600 bg-red-50',
    orange: 'text-orange-600 bg-orange-50',
    green: 'text-green-600 bg-green-50',
  }[color];

  return (
    <div className={`rounded-xl py-3 text-center ${colorClasses}`}>
      <p className="text-xl font-bold">{count}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}