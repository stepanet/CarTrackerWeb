import { useState, useMemo } from 'react';
import type { CarWork } from '../../models/CarWork';
import type { SubItemType } from '../../models/SubItem';
import { getTopItems } from '../../stores/statsHelpers';

interface TopItemsChartProps {
  works: CarWork[];
}

export function TopItemsChart({ works }: TopItemsChartProps) {
  const [selectedType, setSelectedType] = useState<SubItemType>('part');

  const items = useMemo(
    () => getTopItems(works, selectedType, 5),
    [works, selectedType],
  );

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-3">Топ-5 затрат</h3>

      {/* Переключатель тип */}
      <div className="flex bg-gray-100 rounded-lg p-0.5 mb-3">
        <TypeChip
          active={selectedType === 'work'}
          onClick={() => setSelectedType('work')}
          icon="🔧"
          label="Работы"
          activeColor="text-blue-600"
        />
        <TypeChip
          active={selectedType === 'part'}
          onClick={() => setSelectedType('part')}
          icon="📦"
          label="Детали"
          activeColor="text-orange-600"
        />
      </div>

      {/* Список */}
      {items.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-3xl mb-2">📊</p>
          <p className="text-sm text-gray-400">
            {selectedType === 'work'
              ? 'Нет работ с указанной стоимостью'
              : 'Нет деталей с указанной стоимостью'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item, index) => (
            <div key={item.id} className="flex items-center gap-3">
              {/* Номер */}
              <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500 shrink-0">
                {index + 1}
              </span>

              {/* Название + контекст */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">{item.title}</p>

                {/* Количество: "4 × 565 ₽" — если не 1 */}
                {item.quantity !== undefined &&
                  item.unitPrice !== undefined &&
                  item.quantity !== 1 && (
                    <p className="text-xs text-gray-500">
                      {formatQty(item.quantity)} ×{' '}
                      {item.unitPrice.toLocaleString('ru-RU', {
                        maximumFractionDigits: 0,
                      })}{' '}
                      ₽
                    </p>
                  )}

                {/* К какому ТО относится */}
                {item.workTitle && (
                  <p className="text-xs text-gray-400 truncate">
                    {item.workTitle}
                    {item.workDate && (
                      <>
                        {' • '}
                        {new Date(item.workDate).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </>
                    )}
                  </p>
                )}
              </div>

              {/* Сумма */}
              <span className="text-sm font-semibold text-gray-900 shrink-0">
                {item.total.toLocaleString('ru-RU', {
                  maximumFractionDigits: 0,
                })}{' '}
                ₽
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Вспомогательные ──────────────────────────

/** Форматирует количество: 1 → "1", 4 → "4", 4.5 → "4.5" */
function formatQty(value: number): string {
  if (value === Math.floor(value)) return String(Math.floor(value));
  return value.toFixed(2).replace(/\.?0+$/, '');
}

interface TypeChipProps {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  activeColor: string;
}

function TypeChip({ active, onClick, icon, label, activeColor }: TypeChipProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
        active
          ? `bg-white ${activeColor} shadow-sm`
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}