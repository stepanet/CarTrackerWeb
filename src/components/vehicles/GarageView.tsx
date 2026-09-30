import { useState } from 'react';
import { useVehicleStore } from '../../stores/useVehicleStore';
import type { Vehicle } from '../../models/Vehicle';
import { VehicleCard } from './VehicleCard';
import { VehicleForm } from './VehicleForm';
import { Plus, Car } from 'lucide-react';

export function GarageView() {
  const vehicles = useVehicleStore((s) => s.vehicles);
  const activeVehicleId = useVehicleStore((s) => s.activeVehicleId);
  const setActiveVehicle = useVehicleStore((s) => s.setActiveVehicle);
  const addVehicle = useVehicleStore((s) => s.add);
  const updateVehicle = useVehicleStore((s) => s.update);
  const removeVehicle = useVehicleStore((s) => s.remove);

  const [showingForm, setShowingForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (vehicle: Vehicle) => {
    try {
      setError(null);
      if (editingVehicle) {
        await updateVehicle(vehicle);
      } else {
        await addVehicle(vehicle);
      }
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить');
    }
  };

  const handleDelete = async (vehicle: Vehicle) => {
    const confirmed = confirm(
      `Удалить «${vehicle.name}»?\n\nВсе работы и напоминания этого транспорта будут удалены. Это действие нельзя отменить.`,
    );
    if (!confirmed) return;

    try {
      setError(null);
      await removeVehicle(vehicle.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить');
    }
  };

  const openAddForm = () => {
    setEditingVehicle(null);
    setShowingForm(true);
  };

  const openEditForm = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setShowingForm(true);
  };

  const closeForm = () => {
    setShowingForm(false);
    setEditingVehicle(null);
  };

  return (
    <>
      <div className="space-y-4 pb-4">
        {/* Ошибка */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        {/* Заголовок с количеством */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Мой гараж
          </h2>
          <p className="text-sm text-gray-500">
            {vehicles.length === 0
              ? 'Добавьте машину или мотоцикл'
              : `Транспортов: ${vehicles.length}`}
          </p>
        </div>

        {/* Пустое состояние */}
        {vehicles.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <Car className="w-16 h-16 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 font-medium mb-1">
              Пока нет транспорта
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Добавьте машину или мотоцикл, чтобы разделить работы
            </p>
            <button
              onClick={openAddForm}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Добавить транспорт
            </button>
          </div>
        ) : (
          <>
            {/* Список карточек */}
            <div className="space-y-3">
              {vehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  isActive={vehicle.id === activeVehicleId}
                  onSelect={() => setActiveVehicle(vehicle.id)}
                  onEdit={() => openEditForm(vehicle)}
                  onDelete={() => handleDelete(vehicle)}
                />
              ))}
            </div>

            {/* Кнопка "Добавить" */}
            <button
              onClick={openAddForm}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Добавить транспорт
            </button>
          </>
        )}
      </div>

      {/* Форма */}
      {showingForm && (
        <VehicleForm
          vehicle={editingVehicle}
          onSave={handleSave}
          onCancel={closeForm}
        />
      )}
    </>
  );
}