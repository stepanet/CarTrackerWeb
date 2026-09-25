import type { CarWork } from '../../models/CarWork';
import { CATEGORY_ICONS } from '../../models/CarWork';
import { Trash2 } from 'lucide-react';

interface WorkRowProps {
  work: CarWork;
  onEdit: (work: CarWork) => void;
  onDelete: (id: string) => void;
}

export function WorkRow({ work, onEdit, onDelete }: WorkRowProps) {
  const formattedDate = new Date(work.date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const worksCount = (work.subWorks ?? []).filter((i) => i.type === 'work').length;
  const partsCount = (work.subWorks ?? []).filter((i) => i.type === 'part').length;

  const formattedCost = work.cost.toLocaleString('ru-RU', {
    maximumFractionDigits: 0,
  });

  const formattedMileage = work.mileage.toLocaleString('ru-RU');

  const CategoryIcon = CATEGORY_ICONS[work.category];

  return (
    <div
      className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer active:bg-gray-50"
      onClick={() => onEdit(work)}
    >
      {/* Иконка категории */}
      <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
        <CategoryIcon className="w-5 h-5 text-blue-600" />
      </div>

      {/* Основная информация */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{work.title}</p>
        <p className="text-xs text-gray-500 truncate">
          {formattedDate}
          {work.mileage > 0 && ` • ${formattedMileage} км`}
        </p>

        {(worksCount > 0 || partsCount > 0) && (
          <div className="flex items-center gap-2 mt-0.5 text-xs">
            {worksCount > 0 && (
              <span className="flex items-center gap-0.5 text-blue-600">
                <span className="font-medium">{worksCount}</span>
              </span>
            )}
            {partsCount > 0 && (
              <span className="flex items-center gap-0.5 text-orange-600">
                <span className="font-medium">{partsCount}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Стоимость + действия */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <p className="font-semibold text-gray-900 text-sm">
          {formattedCost} ₽
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Удалить «${work.title}»?`)) {
              onDelete(work.id);
            }
          }}
          className="text-red-500 hover:text-red-700 p-1"
          title="Удалить"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}