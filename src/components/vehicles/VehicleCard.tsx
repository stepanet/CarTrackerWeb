import type { Vehicle } from '../../models/Vehicle';
import {
  vehicleDisplayName,
  vehicleSubtitle,
  vehicleIcon,
} from '../../models/Vehicle';
import { Check, Pencil, Trash2 } from 'lucide-react';

interface VehicleCardProps {
  vehicle: Vehicle;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function VehicleCard({
  vehicle,
  isActive,
  onSelect,
  onEdit,
  onDelete,
}: VehicleCardProps) {
  const Icon = vehicleIcon(vehicle.icon);
  const subtitle = vehicleSubtitle(vehicle);

  return (
    <div
      className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer transition-all ${
        isActive
          ? 'border-2 border-blue-500 bg-blue-50/40'
          : 'border border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        {/* Иконка */}
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
            isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
          }`}
        >
          <Icon className="w-6 h-6" />
        </div>

        {/* Название */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">
            {vehicleDisplayName(vehicle)}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 truncate">{subtitle}</p>
          )}
          {vehicle.initialMileage > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              Начальный пробег:{' '}
              {vehicle.initialMileage.toLocaleString('ru-RU')} км
            </p>
          )}
        </div>

        {/* Кнопки действий */}
        <div className="flex flex-col gap-1 shrink-0">
          {isActive ? (
            <span className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white">
              <Check className="w-4 h-4" />
            </span>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-blue-600"
              title="Редактировать"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-600"
            title="Удалить"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isActive && (
        <p className="text-xs text-blue-600 mt-2 font-medium">
          ✓ Активный транспорт
        </p>
      )}
    </div>
  );
}