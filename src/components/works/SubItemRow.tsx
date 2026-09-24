import type { SubItem } from '../../models/SubItem';
import {
  SUB_ITEM_TYPE_ICONS,
  getSubItemTotal,
  formatQuantityDescription,
} from '../../models/SubItem';

interface SubItemRowProps {
  item: SubItem;
  onEdit: () => void;
  onDelete: () => void;
}

export function SubItemRow({ item, onEdit, onDelete }: SubItemRowProps) {
  const isWork = item.type === 'work';

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
      {/* Иконка типа */}
      <span
        className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 ${
          isWork
            ? 'bg-blue-100 text-blue-600'
            : 'bg-orange-100 text-orange-600'
        }`}
      >
        {SUB_ITEM_TYPE_ICONS[item.type]}
      </span>

      {/* Название + заметка */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 truncate">{item.title}</p>
        {item.note && (
          <p className="text-xs text-gray-500 truncate">{item.note}</p>
        )}
      </div>

      {/* Стоимость + количество */}
      <div className="text-right shrink-0">
        <p className="text-sm font-medium text-gray-900">
          {getSubItemTotal(item).toLocaleString('ru-RU')} ₽
        </p>
        {item.quantity !== 1 && (
          <p className="text-xs text-gray-500">
            {formatQuantityDescription(item)}
          </p>
        )}
      </div>

      {/* Действия */}
      <div className="flex gap-0.5 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-blue-600"
          title="Редактировать"
        >
          ✏️
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-600"
          title="Удалить"
        >
          🗑
        </button>
      </div>
    </div>
  );
}