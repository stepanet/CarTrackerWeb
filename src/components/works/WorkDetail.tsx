import type { CarWork } from '../../models/CarWork';
import { CATEGORY_ICONS } from '../../models/CarWork';
import type { SubItem } from '../../models/SubItem';
import {
  SUB_ITEM_TYPE_ICONS,
  getSubItemTotal,
  formatQuantityDescription,
} from '../../models/SubItem';
import { Wrench, Bolt, Pencil, Trash2, ChevronLeft } from 'lucide-react';

interface WorkDetailProps {
  work: CarWork;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function WorkDetail({ work, onClose, onEdit, onDelete }: WorkDetailProps) {
  const subWorks = work.subWorks ?? [];
  const workItems = subWorks.filter((item) => item.type === 'work');
  const partItems = subWorks.filter((item) => item.type === 'part');

  const worksTotal = workItems.reduce((sum, item) => sum + getSubItemTotal(item), 0);
  const partsTotal = partItems.reduce((sum, item) => sum + getSubItemTotal(item), 0);

  const hasSubItems = subWorks.length > 0;

  const formattedDate = new Date(work.date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formatMoney = (value: number) =>
    value.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) + ' ₽';

  const handleDelete = () => {
    if (confirm(`Удалить «${work.title}»?\n\nЭто действие нельзя отменить.`)) {
      onDelete();
    }
  };

  const CategoryIcon = CATEGORY_ICONS[work.category];

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col overflow-hidden">
      {/* Шапка */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shrink-0">
        <button
          onClick={onClose}
          className="text-blue-600 font-medium flex items-center gap-0.5"
        >
          <ChevronLeft className="w-5 h-5" />
          Назад
        </button>
        <h1 className="font-semibold text-gray-900 truncate max-w-[180px]">
          {work.title}
        </h1>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="text-blue-600 p-1"
            title="Редактировать"
          >
            <Pencil className="w-5 h-5" />
          </button>
          <button
            onClick={handleDelete}
            className="text-red-500 p-1"
            title="Удалить"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-8">
        {/* Основная информация */}
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <CategoryIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900">{work.title}</p>
              <p className="text-sm text-gray-500">
                {work.category} • {formattedDate}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            {work.mileage > 0 && (
              <div>
                <p className="text-xs text-gray-500">Пробег</p>
                <p className="font-medium">
                  {work.mileage.toLocaleString('ru-RU')} км
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">Статус</p>
              <p
                className={`font-medium ${
                  work.isDone ? 'text-green-600' : 'text-orange-600'
                }`}
              >
                {work.isDone ? 'Выполнено' : 'Запланировано'}
              </p>
            </div>
          </div>
        </div>

        {/* Секция «Работы» */}
        {workItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-gray-900">
                Работы ({workItems.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {workItems.map((item) => (
                <SubItemDetailRow key={item.id} item={item} />
              ))}
            </div>
            <div className="px-4 py-3 bg-blue-50 flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                Итого работы
              </span>
              <span className="font-semibold text-blue-900">
                {formatMoney(worksTotal)}
              </span>
            </div>
          </div>
        )}

        {/* Секция «Детали» */}
        {partItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Bolt className="w-4 h-4 text-orange-600" />
              <h2 className="font-semibold text-gray-900">
                Детали ({partItems.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {partItems.map((item) => (
                <SubItemDetailRow key={item.id} item={item} />
              ))}
            </div>
            <div className="px-4 py-3 bg-orange-50 flex items-center justify-between">
              <span className="text-sm font-medium text-orange-900">
                Итого детали
              </span>
              <span className="font-semibold text-orange-900">
                {formatMoney(partsTotal)}
              </span>
            </div>
          </div>
        )}

        {/* Итоговая стоимость */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">
              Общая стоимость
            </span>
            <span className="text-2xl font-bold text-blue-600">
              {formatMoney(work.cost)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {hasSubItems
              ? 'Стоимость рассчитана автоматически из подзаписей.'
              : 'Стоимость введена вручную.'}
          </p>
        </div>

        {/* Заметки */}
        {work.note && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-2">Заметки</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {work.note}
            </p>
          </div>
        )}

        {/* Кнопка редактирования */}
        <button
          onClick={onEdit}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Pencil className="w-4 h-4" />
          Редактировать
        </button>
      </div>
    </div>
  );
}

interface SubItemDetailRowProps {
  item: SubItem;
}

function SubItemDetailRow({ item }: SubItemDetailRowProps) {
  const isWork = item.type === 'work';
  const TypeIcon = SUB_ITEM_TYPE_ICONS[item.type];

  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <span
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isWork ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
        }`}
      >
        <TypeIcon className="w-4 h-4" />
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">{item.title}</p>
        {item.note && (
          <p className="text-xs text-gray-500 line-clamp-2">{item.note}</p>
        )}
      </div>

      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-gray-900">
          {getSubItemTotal(item).toLocaleString('ru-RU')} ₽
        </p>
        {item.quantity !== 1 && (
          <p className="text-xs text-gray-500">
            {formatQuantityDescription(item)}
          </p>
        )}
      </div>
    </div>
  );
}