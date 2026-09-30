import { useState, useRef, useEffect } from 'react';
import { useVehicleStore } from '../stores/useVehicleStore';
import {
  vehicleDisplayName,
  vehicleIcon,
} from '../models/Vehicle';
import { ChevronDown, Check } from 'lucide-react';

interface VehicleSwitcherProps {
  onOpenGarage: () => void;
}

export function VehicleSwitcher({ onOpenGarage }: VehicleSwitcherProps) {
  const vehicles = useVehicleStore((s) => s.vehicles);
  const activeVehicleId = useVehicleStore((s) => s.activeVehicleId);
  const setActiveVehicle = useVehicleStore((s) => s.setActiveVehicle);

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeVehicle = vehicles.find((v) => v.id === activeVehicleId);

  // Закрытие по клику вне
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Если транспортов нет — не показываем переключатель
  if (vehicles.length === 0) return null;

  const Icon = activeVehicle ? vehicleIcon(activeVehicle.icon) : null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors max-w-[200px]"
      >
        {Icon && <Icon className="w-4 h-4 text-blue-600 shrink-0" />}
        <span className="text-sm font-medium text-gray-800 truncate">
          {activeVehicle ? vehicleDisplayName(activeVehicle) : 'Выбрать'}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-1 min-w-[240px] z-50">
          {vehicles.map((vehicle) => {
            const ItemIcon = vehicleIcon(vehicle.icon);
            const isActive = vehicle.id === activeVehicleId;

            return (
              <button
                key={vehicle.id}
                onClick={() => {
                  setActiveVehicle(vehicle.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 ${
                  isActive ? 'bg-blue-50' : ''
                }`}
              >
                <ItemIcon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  }`}
                />
                <span
                  className={`text-sm flex-1 truncate ${
                    isActive ? 'font-medium text-blue-600' : 'text-gray-700'
                  }`}
                >
                  {vehicleDisplayName(vehicle)}
                </span>
                {isActive && (
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                )}
              </button>
            );
          })}

          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenGarage();
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-600"
            >
              ⚙️ Управление гаражом
            </button>
          </div>
        </div>
      )}
    </div>
  );
}