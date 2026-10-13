import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import type { CarWork } from '../../models/CarWork';
import {
  getYearlyComparison,
  getAvailableYears,
} from '../../stores/statsHelpers';

interface YearComparisonChartProps {
  works: CarWork[];
}

export function YearComparisonChart({ works }: YearComparisonChartProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const availableYears = useMemo(() => getAvailableYears(works), [works]);

  const result = useMemo(
    () => getYearlyComparison(works, selectedYear),
    [works, selectedYear],
  );

  const { months, currentYearTotal, previousYearTotal, totalDiff, totalPercentChange, hasAnyData } =
    result;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      {/* Заголовок + переключатель года */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-semibold text-gray-900">Сравнение по годам</h3>

        <div className="relative">
          <button
            onClick={() => setShowYearPicker((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <span>{selectedYear}</span>
            <span className="text-gray-400 text-xs">vs {selectedYear - 1}</span>
          </button>

          {showYearPicker && (
            <>
              {/* Затемнение */}
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowYearPicker(false)}
              />
              {/* Дропдаун */}
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-40 min-w-[100px]">
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => {
                      setSelectedYear(year);
                      setShowYearPicker(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${
                      year === selectedYear
                        ? 'text-blue-600 font-medium'
                        : 'text-gray-700'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {!hasAnyData ? (
        <EmptyChart />
      ) : (
        <>
          {/* Итоговая разница */}
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-0.5">
                  {selectedYear} vs {selectedYear - 1}
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatMoney(currentYearTotal)} ₽
                  <span className="text-gray-400 font-normal"> / </span>
                  <span className="text-gray-500 font-normal">
                    {formatMoney(previousYearTotal)} ₽
                  </span>
                </p>
              </div>
              <DiffBadge diff={totalDiff} percent={totalPercentChange} />
            </div>
          </div>

          {/* График */}
          <div className="h-56 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={months}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                barCategoryGap="20%"
                barGap={2}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                  tickFormatter={(v) => formatAxisTick(v)}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(59, 130, 246, 0.06)' }}
                  content={<CustomTooltip selectedYear={selectedYear} />}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                />
                <Bar
                  dataKey="currentTotal"
                  fill="#3b82f6"
                  name={String(selectedYear)}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="previousTotal"
                  fill="#d1d5db"
                  name={String(selectedYear - 1)}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Вспомогательные ──────────────────────────

function formatMoney(value: number): string {
  return value.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
}

function formatAxisTick(value: number): string {
  if (value === 0) return '0';
  if (value >= 1000) return `${Math.round(value / 1000)}к`;
  return String(value);
}

interface DiffBadgeProps {
  diff: number;
  percent: number;
}

function DiffBadge({ diff, percent }: DiffBadgeProps) {
  if (diff === 0) {
    return (
      <span className="text-xs text-gray-500 shrink-0 px-2 py-1 bg-gray-100 rounded-md">
        без изменений
      </span>
    );
  }

  const isUp = diff > 0;
  const Icon = isUp ? TrendingUp : TrendingDown;
  const colorClass = isUp
    ? 'text-red-600 bg-red-50'
    : 'text-green-600 bg-green-50';

  return (
    <div className={`shrink-0 px-2 py-1 rounded-md ${colorClass}`}>
      <div className="flex items-center gap-1 text-xs font-medium">
        <Icon className="w-3.5 h-3.5" />
        <span>{Math.abs(percent).toFixed(0)}%</span>
      </div>
      <p className="text-[10px] font-semibold mt-0.5">
        {isUp ? '+' : '−'}
        {formatMoney(Math.abs(diff))} ₽
      </p>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-56 flex flex-col items-center justify-center text-gray-400">
      <BarChart3 className="w-12 h-12 mb-2" />
      <p className="text-sm">Нет данных для сравнения</p>
    </div>
  );
}

// ─── Tooltip ──────────────────────────────────

interface TooltipPayload {
  payload: {
    fullLabel: string;
    currentTotal: number;
    previousTotal: number;
    diff: number;
    percentChange: number;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  selectedYear: number;
}

function CustomTooltip({ active, payload, selectedYear }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0].payload;
  const hasBoth = item.currentTotal > 0 && item.previousTotal > 0;

  return (
    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
      <p className="font-medium capitalize mb-1.5">{item.fullLabel}</p>
      <div className="space-y-0.5">
        {item.currentTotal > 0 && (
          <p className="text-blue-300">
            {selectedYear}: {item.currentTotal.toLocaleString('ru-RU')} ₽
          </p>
        )}
        {item.previousTotal > 0 && (
          <p className="text-gray-400">
            {selectedYear - 1}: {item.previousTotal.toLocaleString('ru-RU')} ₽
          </p>
        )}
        {hasBoth && (
          <p
            className={`font-semibold border-t border-gray-700 pt-0.5 mt-1 ${
              item.diff > 0 ? 'text-red-300' : 'text-green-300'
            }`}
          >
            {item.diff > 0 ? '+' : '−'}
            {Math.abs(item.diff).toLocaleString('ru-RU')} ₽ (
            {item.percentChange > 0 ? '+' : ''}
            {item.percentChange.toFixed(0)}%)
          </p>
        )}
      </div>
    </div>
  );
}