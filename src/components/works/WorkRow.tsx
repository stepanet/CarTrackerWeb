import type { CarWork } from '../../models/CarWork';
import { CATEGORY_ICONS } from '../../models/CarWork';

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

  const formattedCost = work.cost.toLocaleString('ru-RU', {
    maximumFractionDigits: 0,
  });

  const formattedMileage = work.mileage.toLocaleString('ru-RU');

  return (
    <div className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
      {/* Иконка категории */}
      <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-xl shrink-0">
        {CATEGORY_ICONS[work.category]}
      </div>

      {/* Основная информация */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{work.title}</p>
        <p className="text-xs text-gray-500 truncate">
          {formattedDate}
          {work.mileage > 0 && ` • ${formattedMileage} км`}
        </p>
      </div>

      {/* Стоимость + действия */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <p className="font-semibold text-gray-900 text-sm">
          {formattedCost} ₽
        </p>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(work)}
            className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1"
            title="Редактировать"
          >
            ✏️
          </button>
          <button
            onClick={() => {
              if (confirm(`Удалить «${work.title}»?`)) {
                onDelete(work.id);
              }
            }}
            className="text-xs text-red-600 hover:text-red-800 px-2 py-1"
            title="Удалить"
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}