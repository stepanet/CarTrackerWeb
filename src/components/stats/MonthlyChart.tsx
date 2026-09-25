import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { CarWork } from '../../models/CarWork';
import { getMonthlyCostsDetailed } from '../../stores/statsHelpers';

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
    () => getMonthlyCostsDetailed(works, monthsBack),
    [works, monthsBack],
  );

  const hasData = data.some((d) => d.total > 0);

  const averageMonthly = useMemo(() => {
    const nonEmpty = data.filter((d) => d.total > 0);
    if (nonEmpty.length === 0) return 0;
    return nonEmpty.reduce((s, d) => s + d.total, 0) / nonEmpty.length;
  }, [data]);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      {/* Заголовок + период */}
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
        <>
          <div className="h-56 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 8, left: 0, bottom: 0 }}
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

                {/* Stacked bar: работы + детали */}
                <Bar
                  dataKey="worksTotal"
                  stackId="cost"
                  fill="#3b82f6"
                  name="Работы"
                />
                <Bar
                  dataKey="partsTotal"
                  stackId="cost"
                  fill="#f59e0b"
                  radius={[6, 6, 0, 0]}
                  name="Детали"
                />

                {/* Линия среднего */}
                {averageMonthly > 0 && (
                  <ReferenceLine
                    y={averageMonthly}
                    stroke="#9ca3af"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    label={{
                      value: `средн: ${formatAxisTick(averageMonthly)}`,
                      position: 'insideTopRight',
                      fill: '#6b7280',
                      fontSize: 10,
                    }}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Легенда */}
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-500" />
              <span>Работы</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-orange-500" />
              <span>Детали</span>
            </div>
          </div>
        </>
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
      <BarChart3 className="w-12 h-12 mb-2" />
      <p className="text-sm">Нет данных для отображения</p>
    </div>
  );
}

interface TooltipPayload {
  payload: {
    fullLabel: string;
    worksTotal: number;
    partsTotal: number;
    total: number;
  };
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
      <p className="font-medium capitalize mb-1.5">{item.fullLabel}</p>
      <div className="space-y-0.5">
        {item.worksTotal > 0 && (
          <p className="text-blue-300">
            Работы: {item.worksTotal.toLocaleString('ru-RU')} ₽
          </p>
        )}
        {item.partsTotal > 0 && (
          <p className="text-orange-300">
            Детали: {item.partsTotal.toLocaleString('ru-RU')} ₽
          </p>
        )}
        <p className="font-semibold border-t border-gray-700 pt-0.5 mt-1">
          Всего: {item.total.toLocaleString('ru-RU')} ₽
        </p>
      </div>
    </div>
  );
}