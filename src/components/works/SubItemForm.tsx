import { useState, useEffect } from 'react';
import type { SubItem, SubItemType } from '../../models/SubItem';
import {
  SUB_ITEM_TYPE_LABELS,
  SUB_ITEM_TYPE_ICONS,
  createSubItem,
} from '../../models/SubItem';

interface SubItemFormProps {
  item: SubItem | null;            // null = создание
  defaultType: SubItemType;        // какой тип открыть по умолчанию
  onSave: (item: SubItem) => void;
  onCancel: () => void;
}

export function SubItemForm({
  item,
  defaultType,
  onSave,
  onCancel,
}: SubItemFormProps) {
  const [type, setType] = useState<SubItemType>(defaultType);
  const [title, setTitle] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [note, setNote] = useState('');

  const isEditing = item !== null;

  // Парсим значения
  const qtyNum = parseNumeric(quantity) ?? 1;    // пусто → 1
  const priceNum = parseNumeric(unitPrice) ?? 0;

  const isValid =
    title.trim().length > 0 &&
    qtyNum > 0 &&
    priceNum >= 0;

  const totalCost = qtyNum * priceNum;

  // Заполняем при редактировании
  useEffect(() => {
    if (item) {
      setType(item.type);
      setTitle(item.title);
      // Если quantity == 1 — оставляем пустым (дефолт)
      setQuantity(item.quantity === 1 ? '' : formatNumeric(item.quantity));
      setUnitPrice(formatNumeric(item.unitPrice));
      setNote(item.note);
    } else {
      setType(defaultType);
    }
  }, [item, defaultType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    if (isEditing && item) {
      onSave({
        ...item,
        type,
        title: title.trim(),
        quantity: qtyNum,
        unitPrice: priceNum,
        note: note.trim(),
      });
    } else {
      onSave(
        createSubItem(type, title, qtyNum, priceNum, note),
      );
    }
  };

  const incrementQuantity = () => {
    const current = parseNumeric(quantity) ?? 1;
    setQuantity(formatNumeric(current + 1));
  };

  const decrementQuantity = () => {
    const current = parseNumeric(quantity) ?? 1;
    const newValue = Math.max(1, current - 1);
    setQuantity(newValue === 1 ? '' : formatNumeric(newValue));
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4"
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
            {isEditing
              ? 'Редактирование'
              : type === 'work'
                ? 'Новая работа'
                : 'Новая деталь'}
          </h2>
          <button
            type="submit"
            form="subitem-form"
            disabled={!isValid}
            className={`font-semibold ${
              isValid ? 'text-blue-600' : 'text-gray-300'
            }`}
          >
            Сохранить
          </button>
        </div>

        <form id="subitem-form" onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Тип */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Тип
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['work', 'part'] as SubItemType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border-2 transition-colors ${
                    type === t
                      ? t === 'work'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">{SUB_ITEM_TYPE_ICONS[t]}</span>
                  <span className="text-sm font-medium">
                    {SUB_ITEM_TYPE_LABELS[t]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Название */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === 'work'
                  ? 'Например: Замена масла'
                  : 'Например: Масло Mobil 5W-30'
              }
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Количество */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Количество
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={decrementQuantity}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl text-gray-700 shrink-0"
              >
                −
              </button>
              <input
                type="text"
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              />
              <button
                type="button"
                onClick={incrementQuantity}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl text-gray-700 shrink-0"
              >
                +
              </button>
            </div>
          </div>

          {/* Цена за единицу */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Цена за единицу
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                ₽
              </span>
            </div>
          </div>

          {/* Итого */}
          <div className="bg-blue-50 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm text-blue-900 font-medium">Итого</span>
            <span className="text-lg font-bold text-blue-700">
              {totalCost.toLocaleString('ru-RU')} ₽
            </span>
          </div>

          {/* Заметка */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Заметка
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                type === 'part'
                  ? 'Артикул, бренд, комментарий'
                  : 'Комментарий'
              }
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Вспомогательные ──────────────────────────

/** Парсит строку в число: "" → null, "4,5" → 4.5, "4.5" → 4.5 */
function parseNumeric(value: string): number | null {
  if (!value.trim()) return null;
  const normalized = value.replace(',', '.');
  const num = Number(normalized);
  return isNaN(num) ? null : num;
}

/** Форматирует число для поля ввода */
function formatNumeric(value: number): string {
  if (value === Math.floor(value)) return String(Math.floor(value));
  return value.toFixed(2);
}