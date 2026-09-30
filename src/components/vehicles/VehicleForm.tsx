import { useState, useEffect } from 'react';
import type { Vehicle, VehicleType } from '../../models/Vehicle';
import {
  ALL_VEHICLE_TYPES,
  VEHICLE_TYPE_LABELS,
  VEHICLE_TYPE_ICONS,
  createVehicle,
} from '../../models/Vehicle';

interface VehicleFormProps {
  vehicle: Vehicle | null;
  onSave: (vehicle: Vehicle) => void;
  onCancel: () => void;
}

const ICON_OPTIONS = [
  { key: 'car', label: 'Машина' },
  { key: 'bike', label: 'Мотоцикл' },
  { key: 'truck', label: 'Фургон' },
];

export function VehicleForm({ vehicle, onSave, onCancel }: VehicleFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<VehicleType>('car');
  const [plate, setPlate] = useState('');
  const [year, setYear] = useState('');
  const [icon, setIcon] = useState('car');
  const [initialMileage, setInitialMileage] = useState('');

  const isEditing = vehicle !== null;
  const isValid = name.trim().length > 0;

  useEffect(() => {
    if (vehicle) {
      setName(vehicle.name);
      setType(vehicle.type);
      setPlate(vehicle.plate);
      setYear(vehicle.year ? String(vehicle.year) : '');
      setIcon(vehicle.icon);
      setInitialMileage(
        vehicle.initialMileage > 0 ? String(vehicle.initialMileage) : '',
      );
    } else {
      setIcon('car');
    }
  }, [vehicle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const yearNum = parseInt(year) || 0;
    const mileageNum = parseInt(initialMileage) || 0;

    if (isEditing && vehicle) {
      onSave({
        ...vehicle,
        name: name.trim(),
        type,
        plate: plate.trim(),
        year: yearNum > 0 ? yearNum : undefined,
        icon,
        initialMileage: mileageNum,
      });
    } else {
      const newVehicle = createVehicle(
        name,
        type,
        plate,
        yearNum > 0 ? yearNum : null,
        icon,
        mileageNum,
      );
      onSave(newVehicle);
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
            {isEditing ? 'Редактирование' : 'Новый транспорт'}
          </h2>
          <button
            type="submit"
            form="vehicle-form"
            disabled={!isValid}
            className={`font-semibold ${
              isValid ? 'text-blue-600' : 'text-gray-300'
            }`}
          >
            Сохранить
          </button>
        </div>

        <form id="vehicle-form" onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Название */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Toyota Camry или Honda CB500"
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Тип */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Тип
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_VEHICLE_TYPES.map((t) => {
                const TypeIcon = VEHICLE_TYPE_ICONS[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setType(t);
                      // Автоматически подставляем иконку
                      if (t === 'car') setIcon('car');
                      if (t === 'motorcycle' || t === 'scooter') setIcon('bike');
                      if (t === 'other') setIcon('truck');
                    }}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border-2 transition-colors ${
                      type === t
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <TypeIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {VEHICLE_TYPE_LABELS[t]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Иконка */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Иконка
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ICON_OPTIONS.map((opt) => {
                const Icon = VEHICLE_TYPE_ICONS[
                  opt.key === 'bike'
                    ? 'motorcycle'
                    : opt.key === 'truck'
                      ? 'other'
                      : 'car'
                ];
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setIcon(opt.key)}
                    className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-lg border-2 transition-colors ${
                      icon === opt.key
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Госномер */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Госномер
            </label>
            <input
              type="text"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              placeholder="А123БВ 77"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            />
          </div>

          {/* Год выпуска */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Год выпуска
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2018"
              min="1900"
              max="2099"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Начальный пробег */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Текущий пробег
            </label>
            <div className="relative">
              <input
                type="number"
                value={initialMileage}
                onChange={(e) => setInitialMileage(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                км
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Пробег на момент добавления. Учитывается в напоминаниях, пока нет
              работ с большим пробегом.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}