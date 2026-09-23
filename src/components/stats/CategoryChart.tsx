import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { CarWork, WorkCategory } from '../../models/CarWork';
import { CATEGORY_ICONS } from '../../models/CarWork';
import { getCategoryCosts } from '../../stores/statsHelpers';

interface CategoryChartProps {
  works: CarWork[];
}

// Палитра цветов для категорий — фиксированная, чтобы не «прыгала» при обновлениях
const CATEGORY_COLORS: Record<WorkCategory, string> = {
  'ТО': '#3b82f6',         // blue
  'Ремонт': '#ef4444',     // red
  'Шины': '#6b7280',       // gray
  'Топливо': '#f59e0b',    // amber
  'Страховка': '#10b981',  // emerald
  'Прочее': '#8b5cf6',     // violet
};

export function CategoryChart({ works }: CategoryChartProps) {
  const data = useMemo(() => getCategoryCosts(works), [works]);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">
          Расходы по категориям
        </h3>
        <div className="h-56 flex flex-col items-center justify-center text-gray-400">
          <p className="text-4xl mb-2">🥧</p>
          <p className="text-sm">Нет данных для отображения</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-4">
        Расходы по категориям
      </h3>

      {/* Круговая диаграмма */}
      <div className="h-56 -mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell
                  key={entry.category}
                  fill={CATEGORY_COLORS[entry.category]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Легенда */}
      <div className="mt-4 space-y-2">
        {data.map((item) => (
          <div
            key={item.category}
            className="flex items-center gap-2 text-sm"
          >
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: CATEGORY_COLORS[item.category] }}
            />
            <span className="text-base shrink-0">
              {CATEGORY_ICONS[item.category]}
            </span>
            <span className="text-gray-700 flex-1 truncate">
              {item.category}
            </span>
            <span className="font-medium text-gray-900 shrink-0">
              {item.total.toLocaleString('ru-RU')} ₽
            </span>
            <span className="text-gray-400 text-xs w-10 text-right shrink-0">
              {item.percent.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Вспомогательные ──────────────────────────

interface TooltipPayload {
  payload: { category: WorkCategory; total: number; percent: number };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0].payload;

  return (
    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
      <p className="font-medium mb-0.5">
        {CATEGORY_ICONS[item.category]} {item.category}
      </p>
      <p className="text-blue-300 font-semibold">
        {item.total.toLocaleString('ru-RU')} ₽
      </p>
      <p className="text-gray-400 text-[10px]">
        {item.percent.toFixed(1)}% от общего
      </p>
    </div>
  );
}