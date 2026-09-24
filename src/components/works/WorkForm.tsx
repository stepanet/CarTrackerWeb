import { useState, useEffect } from 'react';
import type { CarWork, WorkCategory } from '../../models/CarWork';
import { ALL_CATEGORIES, CATEGORY_ICONS, createCarWork } from '../../models/CarWork';
import type { SubItem, SubItemType } from '../../models/SubItem';
import { getSubItemTotal } from '../../models/SubItem';
import { SubItemForm } from './SubItemForm';
import { SubItemRow } from './SubItemRow';

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

  // Подзаписи
  const [subWorks, setSubWorks] = useState<SubItem[]>([]);
  const [editingSubItem, setEditingSubItem] = useState<SubItem | null>(null);
  const [showingSubItemForm, setShowingSubItemForm] = useState(false);
  const [newSubItemType, setNewSubItemType] = useState<SubItemType>('work');

  const isEditing = work !== null;
  const isValid = title.trim().length > 0;

  // Подзаписи — вычисляемые
  const hasSubItems = subWorks.length > 0;
  const subItemsTotal = subWorks.reduce(
    (sum, item) => sum + getSubItemTotal(item),
    0,
  );
  const workItems = subWorks.filter((item) => item.type === 'work');
  const partItems = subWorks.filter((item) => item.type === 'part');

  // Заполняем форму при редактировании
  useEffect(() => {
    if (work) {
      setTitle(work.title);
      setCategory(work.category);
      setDate(work.date.split('T')[0]);
      setMileage(work.mileage > 0 ? String(work.mileage) : '');
      setCost(work.cost > 0 ? String(work.cost) : '');
      setNote(work.note);
      setIsDone(work.isDone);
      setSubWorks(work.subWorks ?? []);
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setSubWorks([]);
    }
  }, [work]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const dateObj = date ? new Date(date + 'T12:00:00') : new Date();
    const mileageNum = parseInt(mileage) || 0;

    // Если есть подработы — стоимость = сумма подработ.
    // Если нет — берём ручной ввод.
    const costNum = hasSubItems
      ? subItemsTotal
      : parseFloat(cost.replace(',', '.')) || 0;

    if (isEditing && work) {
      onSave({
        ...work,
        title: title.trim(),
        category,
        date: dateObj.toISOString(),
        mileage: mileageNum,
        cost: costNum,
        note: note.trim(),
        isDone,
        subWorks,
      });
    } else {
      onSave(
        createCarWork(
          title,
          category,
          dateObj,
          mileageNum,
          costNum,
          note.trim(),
          isDone,
          subWorks,
        ),
      );
    }
  };

  // ─── Подзаписи ─────────────────────────────

  const openAddSubItem = (type: SubItemType) => {
    setNewSubItemType(type);
    setEditingSubItem(null);
    setShowingSubItemForm(true);
  };

  const openEditSubItem = (item: SubItem) => {
    setEditingSubItem(item);
    setShowingSubItemForm(true);
  };

  const saveSubItem = (item: SubItem) => {
    if (editingSubItem) {
      // Обновление
      setSubWorks((prev) =>
        prev.map((si) => (si.id === item.id ? item : si)),
      );
    } else {
      // Добавление
      setSubWorks((prev) => [...prev, item]);
    }
    // Сбрасываем ручной cost, если есть подработы
    if (subWorks.length + (editingSubItem ? 0 : 1) > 0) {
      setCost('');
    }
    setEditingSubItem(null);
    setShowingSubItemForm(false);
  };

  const deleteSubItem = (item: SubItem) => {
    setSubWorks((prev) => prev.filter((si) => si.id !== item.id));
  };

  const cancelSubItemForm = () => {
    setEditingSubItem(null);
    setShowingSubItemForm(false);
  };

  return (
    <>
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

            {/* Пробег */}
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

            {/* ───── Секция «Работы» ───── */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  🔧 Работы
                </label>
                <button
                  type="button"
                  onClick={() => openAddSubItem('work')}
                  className="text-sm text-blue-600 font-medium hover:text-blue-800"
                >
                  + Добавить
                </button>
              </div>

              {workItems.length === 0 ? (
                <p className="text-xs text-gray-400 italic">
                  Услуги: замена, диагностика, регулировка
                </p>
              ) : (
                <div className="space-y-1.5">
                  {workItems.map((item) => (
                    <SubItemRow
                      key={item.id}
                      item={item}
                      onEdit={() => openEditSubItem(item)}
                      onDelete={() => deleteSubItem(item)}
                    />
                  ))}
                  <p className="text-xs text-gray-500 text-right pt-1">
                    Итого работы:{' '}
                    <span className="font-medium">
                      {workItems
                        .reduce((s, i) => s + getSubItemTotal(i), 0)
                        .toLocaleString('ru-RU')}{' '}
                      ₽
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* ───── Секция «Детали» ───── */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  🔩 Детали
                </label>
                <button
                  type="button"
                  onClick={() => openAddSubItem('part')}
                  className="text-sm text-blue-600 font-medium hover:text-blue-800"
                >
                  + Добавить
                </button>
              </div>

              {partItems.length === 0 ? (
                <p className="text-xs text-gray-400 italic">
                  Запчасти: масло, фильтры, свечи, колодки
                </p>
              ) : (
                <div className="space-y-1.5">
                  {partItems.map((item) => (
                    <SubItemRow
                      key={item.id}
                      item={item}
                      onEdit={() => openEditSubItem(item)}
                      onDelete={() => deleteSubItem(item)}
                    />
                  ))}
                  <p className="text-xs text-gray-500 text-right pt-1">
                    Итого детали:{' '}
                    <span className="font-medium">
                      {partItems
                        .reduce((s, i) => s + getSubItemTotal(i), 0)
                        .toLocaleString('ru-RU')}{' '}
                      ₽
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* ───── Стоимость ───── */}
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Стоимость
              </label>
              {hasSubItems ? (
                <div className="bg-blue-50 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-sm text-blue-900 font-medium">
                    Автоматически
                  </span>
                  <span className="text-lg font-bold text-blue-700">
                    {subItemsTotal.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              ) : (
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
              )}
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
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  isDone ? 'bg-blue-500' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={isDone}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                    isDone ? 'translate-x-[22px]' : 'translate-x-[2px]'
                  }`}
                />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Модальная форма подзаписи — поверх формы работы */}
      {showingSubItemForm && (
        <SubItemForm
          item={editingSubItem}
          defaultType={newSubItemType}
          onSave={saveSubItem}
          onCancel={cancelSubItemForm}
        />
      )}
    </>
  );
}