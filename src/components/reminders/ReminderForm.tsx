import { useState, useEffect } from 'react';
import type { Reminder } from '../../models/Reminder';
import { createReminder } from '../../models/Reminder';

interface ReminderFormProps {
  reminder: Reminder | null;
  onSave: (reminder: Reminder) => void;
  onCancel: () => void;
}

// Палитра иконок — эмодзи-эквиваленты SF Symbols из iOS
const ICON_PALETTE = [
  '🛢', '🔧', '⭕', '💧', '🛞',
  '❄️', '🔥', '⚡', '🪫', '🔋',
  '💡', '🚿', '🧴', '🧽', '🌀',
  '⚙️', '🔩', '🪛', '🛠', '🚗',
];

export function ReminderForm({ reminder, onSave, onCancel }: ReminderFormProps) {
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('🔧');
  const [intervalKm, setIntervalKm] = useState('');
  const [intervalMonths, setIntervalMonths] = useState('');
  const [lastDate, setLastDate] = useState('');
  const [lastMileage, setLastMileage] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);

  const isEditing = reminder !== null;

  const km = parseInt(intervalKm) || 0;
  const months = parseInt(intervalMonths) || 0;
  const isValid = title.trim().length > 0 && (km > 0 || months > 0);

  useEffect(() => {
    if (reminder) {
      setTitle(reminder.title);
      setIcon(reminder.icon);
      setIntervalKm(reminder.intervalKm > 0 ? String(reminder.intervalKm) : '');
      setIntervalMonths(
        reminder.intervalMonths > 0 ? String(reminder.intervalMonths) : '',
      );
      setLastDate(reminder.lastDate.split('T')[0]);
      setLastMileage(
        reminder.lastMileage > 0 ? String(reminder.lastMileage) : '',
      );
      setIsEnabled(reminder.isEnabled);
    } else {
      setLastDate(new Date().toISOString().split('T')[0]);
    }
  }, [reminder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const dateObj = lastDate ? new Date(lastDate + 'T12:00:00') : new Date();
    const mileageNum = parseInt(lastMileage) || 0;

    if (isEditing && reminder) {
      onSave({
        ...reminder,
        title: title.trim(),
        icon,
        intervalKm: km,
        intervalMonths: months,
        lastDate: dateObj.toISOString(),
        lastMileage: mileageNum,
        isEnabled,
      });
    } else {
      onSave(
        createReminder(
          title,
          icon,
          km,
          months,
          dateObj,
          mileageNum,
          isEnabled,
        ),
      );
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <button
            type="button"
            onClick={onCancel}
            className="text-blue-600 font-medium"
          >
            Отмена
          </button>
          <h2 className="font-semibold">
            {isEditing ? 'Редактирование' : 'Новое напоминание'}
          </h2>
          <button
            type="submit"
            form="reminder-form"
            disabled={!isValid}
            className={`font-semibold ${
              isValid ? 'text-blue-600' : 'text-gray-300'
            }`}
          >
            Сохранить
          </button>
        </div>

        <form id="reminder-form" onSubmit={handleSubmit} className="p-4 space-y-5">
          {/* Название */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Замена масла"
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Иконка */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Иконка
            </label>
            <div className="grid grid-cols-6 gap-2">
              {ICON_PALETTE.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`aspect-square rounded-lg text-xl flex items-center justify-center transition-colors ${
                    icon === emoji
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Интервалы */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Интервал
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <input
                  type="number"
                  value={intervalKm}
                  onChange={(e) => setIntervalKm(e.target.value)}
                  placeholder="—"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  км
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={intervalMonths}
                  onChange={(e) => setIntervalMonths(e.target.value)}
                  placeholder="—"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  мес
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              Заполните хотя бы одно. Если оба — сработает то, что наступит раньше.
            </p>
          </div>

          {/* Последнее выполнение */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Последнее выполнение
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={lastDate}
                onChange={(e) => setLastDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="relative">
                <input
                  type="number"
                  value={lastMileage}
                  onChange={(e) => setLastMileage(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  км
                </span>
              </div>
            </div>
          </div>

          {/* Включено */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-700">
              Напоминание включено
            </span>
            <button
              type="button"
              onClick={() => setIsEnabled(!isEnabled)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                isEnabled ? 'bg-blue-500' : 'bg-gray-300'
              }`}
              role="switch"
              aria-checked={isEnabled}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                  isEnabled ? 'translate-x-[22px]' : 'translate-x-[2px]'
                }`}
              />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}