import { useState, useMemo } from 'react';
import { useCarWorkStore } from '../../stores/useCarWorkStore';
import { ALL_CATEGORIES, CATEGORY_ICONS } from '../../models/CarWork';
import type { CarWork, WorkCategory } from '../../models/CarWork';
import { WorkRow } from './WorkRow';
import { WorkForm } from './WorkForm';
import { WorkDetail } from './WorkDetail';

export function WorksList() {
  const works = useCarWorkStore((s) => s.works);
  const add = useCarWorkStore((s) => s.add);
  const update = useCarWorkStore((s) => s.update);
  const remove = useCarWorkStore((s) => s.remove);

  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<WorkCategory | null>(null);
  const [showingForm, setShowingForm] = useState(false);
  const [editingWork, setEditingWork] = useState<CarWork | null>(null);
  const [viewingWork, setViewingWork] = useState<CarWork | null>(null);

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

  const handleSave = (work: CarWork) => {
    if (editingWork) {
      update(work);
    } else {
      add(work);
    }
    closeForm();
  };

  const openAddForm = () => {
    setEditingWork(null);
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
        {/* Шапка со статистикой */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Всего" value={`${formatMoney(totalCost)} ₽`} icon="💰" />
          <StatCard label="За год" value={`${formatMoney(totalThisYear)} ₽`} icon="📅" />
          <StatCard label="Записей" value={String(works.length)} icon="📋" />
        </div>

        {/* Поиск */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
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
              ✕
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
          {ALL_CATEGORIES.map((cat) => (
            <FilterChip
              key={cat}
              label={`${CATEGORY_ICONS[cat]} ${cat}`}
              active={selectedCategory === cat}
              onClick={() =>
                setSelectedCategory(selectedCategory === cat ? null : cat)
              }
            />
          ))}
        </div>

        {/* Список работ */}
        {filteredWorks.length === 0 ? (
          <EmptyState hasWorks={works.length > 0} onAdd={openAddForm} />
        ) : (
          <div className="space-y-2">
            {filteredWorks.map((work) => (
              <WorkRow
                key={work.id}
                work={work}
                onEdit={() => setViewingWork(work)}
                onDelete={remove}
              />
            ))}
          </div>
        )}
      </div>

      {/* Плавающая кнопка "+" */}
      <button
        onClick={openAddForm}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-blue-600 text-white text-3xl shadow-lg flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-transform z-10"
        aria-label="Добавить работу"
      >
        +
      </button>

            {/* Детальный экран */}
      {viewingWork && (
        <WorkDetail
          work={viewingWork}
          onClose={() => setViewingWork(null)}
          onEdit={() => {
            const workToEdit = viewingWork;
            setViewingWork(null);
            setEditingWork(workToEdit);
            setShowingForm(true);
          }}
          onDelete={() => {
            remove(viewingWork.id);
            setViewingWork(null);
          }}
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

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm">
      <div className="text-lg mb-1">{icon}</div>
      <p className="font-semibold text-gray-900 text-sm truncate">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  );
}

function EmptyState({ hasWorks, onAdd }: { hasWorks: boolean; onAdd: () => void }) {
  return (
    <div className="bg-white rounded-xl p-8 text-center shadow-sm">
      <p className="text-5xl mb-3">🚗</p>
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