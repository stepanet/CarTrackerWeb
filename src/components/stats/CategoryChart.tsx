import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import type { CarWork, WorkCategory } from '../../models/CarWork';
import { CATEGORY_ICONS } from '../../models/CarWork';
import { getCategoryCosts } from '../../stores/statsHelpers';

interface CategoryChartProps {
  works: CarWork[];
}

const CATEGORY_COLORS: Record<WorkCategory, string> = {
  'ТО': '#3b82f6',
  'Ремонт': '#ef4444',
  'Шины': '#6b7280',
  'Топливо': '#f59e0b',
  'Страховка': '#10b981',
  'Прочее': '#8b5cf6',
};

export function CategoryChart({ works }: CategoryChartProps) {
  const data = useMemo(() => getCategoryCosts(works), [works]);

  const totalSum = useMemo(
    () => data.reduce((s, item) => s + item.total, 0),
    [data],
  );

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">
          Расходы по категориям
        </h3>
        <div className="h-56 flex flex-col items-center justify-center text-gray-400">
          <PieIcon className="w-12 h-12 mb-2" />
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

      {/* Круговая диаграмма с суммой в центре */}
      <div className="h-56 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
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

        {/* Центральный текст */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-xs text-gray-500">Всего</p>
            <p className="text-lg font-bold text-gray-900">
              {shortCurrency(totalSum)}
            </p>
            <p className="text-xs text-gray-500">₽</p>
          </div>
        </div>
      </div>

      {/* Легенда */}
      <div className="mt-4 space-y-2">
        {data.map((item) => {
          const CategoryIcon = CATEGORY_ICONS[item.category];
          return (
            <div
              key={item.category}
              className="flex items-center gap-2 text-sm"
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[item.category] }}
              />
              <span className="text-gray-500 shrink-0">
                <CategoryIcon className="w-4 h-4" />
              </span>
              <span className="text-gray-700 flex-1 truncate">
                {item.category}
              </span>
              <span className="font-medium text-gray-900 shrink-0">
                {item.total.toLocaleString('ru-RU', {
                  maximumFractionDigits: 0,
                })}{' '}
                ₽
              </span>
              <span className="text-gray-400 text-xs w-10 text-right shrink-0">
                {item.percent.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Вспомогательные ──────────────────────────

function shortCurrency(value: number): string {
  if (value >= 1000) return `${Math.round(value / 1000)}к`;
  return String(Math.round(value));
}

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
  const CategoryIcon = CATEGORY_ICONS[item.category];

  return (
    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
      <div className="flex items-center gap-1.5 mb-0.5">
        <CategoryIcon className="w-3 h-3" />
        <span className="font-medium">{item.category}</span>
      </div>
      <p className="text-blue-300 font-semibold">
        {item.total.toLocaleString('ru-RU')} ₽
      </p>
      <p className="text-gray-400 text-[10px]">
        {item.percent.toFixed(1)}% от общего
      </p>
    </div>
  );
}