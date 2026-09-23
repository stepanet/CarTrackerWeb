import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { CarWork } from '../../models/CarWork';
import { getMonthlyCosts } from '../../stores/statsHelpers';

interface MonthlyChartProps {
  works: CarWork[];
}

const PERIODS = [
  { value: 3, label: '3 мес' },
  { value: 6, label: '6 мес' },
  { value: 12, label: '12 мес' },
] as const;

export function MonthlyChart({ works }: MonthlyChartProps) {
  const [monthsBack, setMonthsBack] = useState<number>(6);

  const data = useMemo(
    () => getMonthlyCosts(works, monthsBack),
    [works, monthsBack],
  );

  const hasData = data.some((d) => d.total > 0);
  const maxTotal = Math.max(...data.map((d) => d.total));

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      {/* Заголовок + переключатель периода */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-semibold text-gray-900">Расходы по месяцам</h3>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setMonthsBack(p.value)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                monthsBack === p.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* График */}
      {!hasData ? (
        <EmptyChart />
      ) : (
        <div className="h-56 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 16, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e5e7eb"
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                width={50}
                tickFormatter={(value) => formatAxisTick(value)}
              />
              <Tooltip
                cursor={{ fill: 'rgba(59, 130, 246, 0.06)' }}
                content={<CustomTooltip />}
              />
              <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.total === maxTotal ? '#2563eb' : '#93c5fd'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─── Вспомогательные ──────────────────────────

function formatAxisTick(value: number): string {
  if (value === 0) return '0';
  if (value >= 1000) return `${Math.round(value / 1000)}к`;
  return String(value);
}

function EmptyChart() {
  return (
    <div className="h-56 flex flex-col items-center justify-center text-gray-400">
      <p className="text-4xl mb-2">📊</p>
      <p className="text-sm">Нет данных для отображения</p>
    </div>
  );
}

interface TooltipPayload {
  payload: { fullLabel: string; total: number };
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
      <p className="font-medium capitalize mb-0.5">{item.fullLabel}</p>
      <p className="text-blue-300 font-semibold">
        {item.total.toLocaleString('ru-RU')} ₽
      </p>
    </div>
  );
}