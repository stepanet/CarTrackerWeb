import { useState, useMemo } from 'react';
import { useCarWorkStore } from '../../stores/useCarWorkStore';
import { ALL_CATEGORIES, CATEGORY_ICONS } from '../../models/CarWork';
import type { CarWork, WorkCategory } from '../../models/CarWork';
import { WorkRow } from './WorkRow';
import { WorkForm } from './WorkForm';
import { WorkDetail } from './WorkDetail';
import {
  Car,
  Search,
  X,
  Banknote,
  Calendar,
  ListTodo,
  Loader2,
  Plus,
} from 'lucide-react';

export function WorksList() {
  const works = useCarWorkStore((s) => s.works);
  const add = useCarWorkStore((s) => s.add);
  const update = useCarWorkStore((s) => s.update);
  const remove = useCarWorkStore((s) => s.remove);
  const isLoading = useCarWorkStore((s) => s.isLoading);
  const error = useCarWorkStore((s) => s.error);

  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WorkCategory | null>(null);
  const [showingForm, setShowingForm] = useState(false);
  const [editingWork, setEditingWork] = useState<CarWork | null>(null);
  const [viewingWork, setViewingWork] = useState<CarWork | null>(null);
  const [savingError, setSavingError] = useState<string | null>(null);

  // Статистика
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

  // Фильтрация
  const filteredWorks = useMemo(() => {
    return works.filter((w) => {
      const matchesSearch =
        searchText === '' ||
        w.title.toLowerCase().includes(searchText.toLowerCase());
      const matchesCategory =
        selectedCategory === null || w.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [works, searchText, selectedCategory]);

  const handleSave = async (work: CarWork) => {
    try {
      setSavingError(null);
      if (editingWork) {
        await update(work);
      } else {
        await add(work);
      }
      closeForm();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось сохранить';
      setSavingError(message);
    }
  };

  const handleDelete = async (work: CarWork) => {
    try {
      setSavingError(null);
      await remove(work.id);
      setViewingWork(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Не удалось удалить';
      setSavingError(message);
    }
  };

  const openAddForm = () => {
    setEditingWork(null);
    setShowingForm(true);
  };

  const openEditForm = (work: CarWork) => {
    setViewingWork(null);
    setEditingWork(work);
    setShowingForm(true);
  };

  const closeForm = () => {
    setShowingForm(false);
    setEditingWork(null);
  };

  const formatMoney = (value: number) =>
    value.toLocaleString('ru-RU', { maximumFractionDigits: 0 });

  return (
    <>
      <div className="space-y-4 pb-4">
        {/* Индикатор загрузки */}
        {isLoading && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg p-3 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Загрузка данных из облака...</span>
          </div>
        )}

        {/* Ошибка загрузки */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        {/* Ошибка сохранения */}
        {savingError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 flex justify-between items-center">
            <span>{savingError}</span>
            <button
              onClick={() => setSavingError(null)}
              className="text-red-500 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Шапка со статистикой */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard
            label="Всего1"
            value={`${formatMoney(totalCost)} ₽`}
            icon={<Banknote className="w-5 h-5" />}
            iconColor="text-blue-500"
          />
          <StatCard
            label="За год"
            value={`${formatMoney(totalThisYear)} ₽`}
            icon={<Calendar className="w-5 h-5" />}
            iconColor="text-green-500"
          />
          <StatCard
            label="Записей"
            value={String(works.length)}
            icon={<ListTodo className="w-5 h-5" />}
            iconColor="text-purple-500"
          />
        </div>

        {/* Поиск */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Поиск работ"
            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Фильтр по категориям */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          <FilterChip
            label="Все"
            active={selectedCategory === null}
            onClick={() => setSelectedCategory(null)}
          />
          {ALL_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat];
            return (
              <FilterChip
                key={cat}
                label={cat}
                icon={<Icon className="w-3.5 h-3.5" />}
                active={selectedCategory === cat}
                onClick={() =>
                  setSelectedCategory(selectedCategory === cat ? null : cat)
                }
              />
            );
          })}
        </div>

        {/* Список работ */}
        {filteredWorks.length === 0 ? (
          <EmptyState
            hasWorks={works.length > 0}
            isLoading={isLoading}
            onAdd={openAddForm}
          />
        ) : (
          <div className="space-y-2">
            {filteredWorks.map((work) => (
              <WorkRow
                key={work.id}
                work={work}
                onEdit={() => setViewingWork(work)}
                onDelete={(id) => {
                  const w = works.find((x) => x.id === id);
                  if (w) handleDelete(w);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Плавающая кнопка "+" */}
      <button
        onClick={openAddForm}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-transform z-10"
        aria-label="Добавить работу"
      >
        <Plus className="w-7 h-7" strokeWidth={2.5} />
      </button>

      {/* Детальный экран */}
      {viewingWork && (
        <WorkDetail
          work={viewingWork}
          onClose={() => setViewingWork(null)}
          onEdit={() => openEditForm(viewingWork)}
          onDelete={() => handleDelete(viewingWork)}
        />
      )}

      {/* Форма редактирования */}
      {showingForm && (
        <WorkForm
          work={editingWork}
          onSave={handleSave}
          onCancel={closeForm}
        />
      )}
    </>
  );
}

// ─── Вспомогательные компоненты ──────────────────

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconColor?: string;
}

function StatCard({ label, value, icon, iconColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm">
      <div className={`mb-1 ${iconColor ?? 'text-gray-500'}`}>{icon}</div>
      <p className="font-semibold text-gray-900 text-sm truncate">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

interface FilterChipProps {
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

function FilterChip({ label, icon, active, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors flex items-center gap-1.5 ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

interface EmptyStateProps {
  hasWorks: boolean;
  isLoading: boolean;
  onAdd: () => void;
}

function EmptyState({ hasWorks, isLoading, onAdd }: EmptyStateProps) {
  if (isLoading) return null;

  return (
    <div className="bg-white rounded-xl p-8 text-center shadow-sm">
      <Car className="w-16 h-16 mx-auto mb-3 text-gray-400" />
      <p className="text-gray-600 font-medium mb-1">
        {hasWorks ? 'Ничего не найдено' : 'Пока нет записей'}
      </p>
      <p className="text-sm text-gray-400 mb-4">
        {hasWorks
          ? 'Попробуйте изменить фильтры или поиск'
          : 'Нажмите «+», чтобы добавить первую работу'}
      </p>
      {!hasWorks && (
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          Добавить работу
        </button>
      )}
    </div>
  );
}