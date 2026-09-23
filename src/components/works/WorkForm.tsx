import { useState, useEffect } from 'react';
import type { CarWork, WorkCategory } from '../../models/CarWork';
import { ALL_CATEGORIES, CATEGORY_ICONS, createCarWork } from '../../models/CarWork';

interface WorkFormProps {
  work: CarWork | null;      // null = создание, объект = редактирование
  onSave: (work: CarWork) => void;
  onCancel: () => void;
}

export function WorkForm({ work, onSave, onCancel }: WorkFormProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<WorkCategory>('ТО');
  const [date, setDate] = useState('');
  const [mileage, setMileage] = useState('');
  const [cost, setCost] = useState('');
  const [note, setNote] = useState('');
  const [isDone, setIsDone] = useState(true);

  const isEditing = work !== null;
  const isValid = title.trim().length > 0;

  // Заполняем форму при редактировании
  useEffect(() => {
    if (work) {
      setTitle(work.title);
      setCategory(work.category);
      // ISO → YYYY-MM-DD для <input type="date">
      setDate(work.date.split('T')[0]);
      setMileage(work.mileage > 0 ? String(work.mileage) : '');
      setCost(work.cost > 0 ? String(work.cost) : '');
      setNote(work.note);
      setIsDone(work.isDone);
    } else {
      // Новая работа — сегодняшняя дата
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [work]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const dateObj = date ? new Date(date + 'T12:00:00') : new Date();
    const mileageNum = parseInt(mileage) || 0;
    const costNum = parseFloat(cost.replace(',', '.')) || 0;

    if (isEditing && work) {
      // Обновляем существующую
      onSave({
        ...work,
        title: title.trim(),
        category,
        date: dateObj.toISOString(),
        mileage: mileageNum,
        cost: costNum,
        note: note.trim(),
        isDone,
      });
    } else {
      // Создаём новую
      onSave(
        createCarWork(title, category, dateObj, mileageNum, costNum, note.trim(), isDone),
      );
    }
  };

  return (
    // Оверлей
    <div
      className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={onCancel}
    >
      {/* Модальное окно */}
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
            {isEditing ? 'Редактирование' : 'Новая работа'}
          </h2>
          <button
            type="submit"
            form="work-form"
            disabled={!isValid}
            className={`font-semibold ${
              isValid ? 'text-blue-600' : 'text-gray-300'
            }`}
          >
            Сохранить
          </button>
        </div>

        {/* Форма */}
        <form id="work-form" onSubmit={handleSubmit} className="p-4 space-y-4">
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

          {/* Категория */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Категория
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-colors ${
                    category === cat
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl mb-1">{CATEGORY_ICONS[cat]}</span>
                  <span className="text-xs font-medium">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Дата */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дата
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Пробег + Стоимость в одной строке */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Пробег
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  км
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Стоимость
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  ₽
                </span>
              </div>
            </div>
          </div>

          {/* Заметки */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Заметки
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Комментарий"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Выполнено */}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-700">
              Выполнено
            </span>
            <button
              type="button"
              onClick={() => setIsDone(!isDone)}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                isDone ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  isDone ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}