import { useCarWorkStore } from '../../stores/useCarWorkStore';
import { getAveragePerMonth } from '../../stores/statsHelpers';
import { MonthlyChart } from './MonthlyChart';
import { CategoryChart } from './CategoryChart';

export function StatsView() {
  const works = useCarWorkStore((s) => s.works);

  const totalCost = works
    .filter((w) => w.isDone)
    .reduce((s, w) => s + w.cost, 0);

  const year = new Date().getFullYear();
  const totalThisYear = works
    .filter((w) => w.isDone && new Date(w.date).getFullYear() === year)
    .reduce((s, w) => s + w.cost, 0);

  const averagePerMonth = getAveragePerMonth(works, 6);

  const formatMoney = (v: number) =>
    v.toLocaleString('ru-RU', { maximumFractionDigits: 0 });

  return (
    <div className="space-y-4 pb-4">
      {/* Сводка */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          label="Всего"
          value={`${formatMoney(totalCost)} ₽`}
          icon="💰"
          iconColor="text-blue-500"
        />
        <StatCard
          label="За год"
          value={`${formatMoney(totalThisYear)} ₽`}
          icon="📅"
          iconColor="text-green-500"
        />
        <StatCard
          label="Средн/мес"
          value={`${formatMoney(averagePerMonth)} ₽`}
          icon="📈"
          iconColor="text-orange-500"
        />
      </div>

      {/* Графики */}
      <MonthlyChart works={works} />
      <CategoryChart works={works} />
    </div>
  );
}

// ─── Карточка статистики ──────────────────────

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  iconColor: string;
}

function StatCard({ label, value, icon, iconColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm">
      <div className={`text-lg mb-1 ${iconColor}`}>{icon}</div>
      <p className="font-semibold text-gray-900 text-sm truncate">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}