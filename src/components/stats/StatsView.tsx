import { useMemo } from 'react';
import { useCarWorkStore } from '../../stores/useCarWorkStore';
import {
  getAveragePerMonth,
  getTotalWorksCost,
  getTotalPartsCost,
} from '../../stores/statsHelpers';
import {
  Banknote,
  Calendar,
  TrendingUp,
  ListTodo,
  Wrench,
  Package,
} from 'lucide-react';
import { MonthlyChart } from './MonthlyChart';
import { CategoryChart } from './CategoryChart';
import { TopItemsChart } from './TopItemsChart';

export function StatsView() {
  const works = useCarWorkStore((s) => s.works);

  const totalCost = useMemo(
    () => works.filter((w) => w.isDone).reduce((s, w) => s + w.cost, 0),
    [works],
  );

  const totalThisYear = useMemo(() => {
    const year = new Date().getFullYear();
    return works
      .filter((w) => w.isDone && new Date(w.date).getFullYear() === year)
      .reduce((s, w) => s + w.cost, 0);
  }, [works]);

  const totalWorks = useMemo(() => getTotalWorksCost(works), [works]);
  const totalParts = useMemo(() => getTotalPartsCost(works), [works]);
  const averagePerMonth = useMemo(() => getAveragePerMonth(works, 6), [works]);

  const formatMoney = (v: number) =>
    v.toLocaleString('ru-RU', { maximumFractionDigits: 0 });

  const percentText = (value: number) => {
    if (totalCost === 0) return '0%';
    return `${Math.round((value / totalCost) * 100)}%`;
  };

  return (
    <div className="space-y-4 pb-4">
      {/* ─── Верхняя сводка с разбивкой ─── */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="mb-3">
          <p className="text-xs text-gray-500">Всего потрачено</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatMoney(totalCost)} ₽
          </p>
        </div>

        <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-3">
          {/* Работы */}
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <Wrench className="w-3.5 h-3.5 text-blue-500" />
              <span>Работы</span>
            </div>
            <p className="font-semibold text-gray-900 text-sm">
              {formatMoney(totalWorks)} ₽
            </p>
            <p className="text-xs text-gray-400">{percentText(totalWorks)}</p>
          </div>

          {/* Детали */}
          <div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <Package className="w-3.5 h-3.5 text-orange-500" />
              <span>Детали</span>
            </div>
            <p className="font-semibold text-gray-900 text-sm">
              {formatMoney(totalParts)} ₽
            </p>
            <p className="text-xs text-gray-400">{percentText(totalParts)}</p>
          </div>
        </div>
      </div>

      {/* ─── Три маленькие карточки ─── */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          label="За год"
          value={`${formatMoney(totalThisYear)} ₽`}
          icon={<Calendar className="w-5 h-5" />}
          iconColor="text-green-500"
        />
        <StatCard
          label="Средн/мес"
          value={`${formatMoney(averagePerMonth)} ₽`}
          icon={<TrendingUp className="w-5 h-5" />}
          iconColor="text-orange-500"
        />
        <StatCard
          label="Записей"
          value={String(works.length)}
          icon={<ListTodo className="w-5 h-5" />}
          iconColor="text-purple-500"
        />
      </div>

      {/* ─── Графики ─── */}
      <MonthlyChart works={works} />
      <CategoryChart works={works} />
      <TopItemsChart works={works} />
    </div>
  );
}

// ─── Карточка статистики ──────────────────────

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconColor: string;
}

function StatCard({ label, value, icon, iconColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm">
      <div className={`mb-1 ${iconColor}`}>{icon}</div>
      <p className="font-semibold text-gray-900 text-sm truncate">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}