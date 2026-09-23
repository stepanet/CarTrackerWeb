import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CarWork, WorkCategory } from '../models/CarWork';
import type { SubItem } from '../models/SubItem';
import { getSubItemTotal } from '../models/SubItem';


interface CarWorkState {
  works: CarWork[];

  // CRUD работы
  add: (work: CarWork) => void;
  update: (work: CarWork) => void;
  remove: (id: string) => void;
  replaceAll: (works: CarWork[]) => void;

  // CRUD подзаписи
  addSubItem: (workId: string, item: SubItem) => void;
  updateSubItem: (workId: string, item: SubItem) => void;
  removeSubItem: (workId: string, itemId: string) => void;
  clearSubItems: (workId: string) => void;

  // Утилиты
  getTotalCost: () => number;
  getTotalThisYear: () => number;
  getCurrentMileage: () => number;
  getTotalWorksCost: () => number;
  getTotalPartsCost: () => number;
}

export const useCarWorkStore = create<CarWorkState>()(
  persist(
    (set, get) => ({
      works: [],

    add: (work) =>
        set((state) => {
          const normalized = normalizeCost(work);
          return {
            works: sortWorks([...state.works, normalized]),
          };
        }),

            update: (work) =>
        set((state) => {
          const normalized = normalizeCost(work);
          return {
            works: sortWorks(
              state.works.map((w) => (w.id === work.id ? normalized : w)),
            ),
          };
        }),

      remove: (id) =>
        set((state) => ({
          works: state.works.filter((w) => w.id !== id),
        })),

      replaceAll: (works) =>
        set({ works: sortWorks(works) }),

            // ─── Подзаписи ─────────────────────────

      addSubItem: (workId, item) =>
        set((state) => ({
          works: state.works.map((work) => {
            if (work.id !== workId) return work;
            const subWorks = [...(work.subWorks ?? []), item];
            return recalculateCost({ ...work, subWorks });
          }),
        })),

      updateSubItem: (workId, item) =>
        set((state) => ({
          works: state.works.map((work) => {
            if (work.id !== workId) return work;
            const subWorks = (work.subWorks ?? []).map((si) =>
              si.id === item.id ? item : si,
            );
            return recalculateCost({ ...work, subWorks });
          }),
        })),

      removeSubItem: (workId, itemId) =>
        set((state) => ({
          works: state.works.map((work) => {
            if (work.id !== workId) return work;
            const subWorks = (work.subWorks ?? []).filter(
              (si) => si.id !== itemId,
            );
            return recalculateCost({ ...work, subWorks });
          }),
        })),

      clearSubItems: (workId) =>
        set((state) => ({
          works: state.works.map((work) => {
            if (work.id !== workId) return work;
            return { ...work, subWorks: [] };
          }),
        })),

      getTotalCost: () =>
        get().works
          .filter((w) => w.isDone)
          .reduce((sum, w) => sum + w.cost, 0),

      getTotalThisYear: () => {
        const year = new Date().getFullYear();
        return get()
          .works.filter((w) => {
            if (!w.isDone) return false;
            return new Date(w.date).getFullYear() === year;
          })
          .reduce((sum, w) => sum + w.cost, 0);
      },

      getCurrentMileage: () =>
        get().works.reduce((max, w) => Math.max(max, w.mileage), 0),
          getTotalWorksCost: () =>
        get().works
          .filter((w) => w.isDone)
          .flatMap((w) => w.subWorks ?? [])
          .filter((item) => item.type === 'work')
          .reduce((sum, item) => sum + getSubItemTotal(item), 0),

      getTotalPartsCost: () =>
        get().works
          .filter((w) => w.isDone)
          .flatMap((w) => w.subWorks ?? [])
          .filter((item) => item.type === 'part')
          .reduce((sum, item) => sum + getSubItemTotal(item), 0),}),
    {
      name: 'cartracker-works', // ключ в localStorage
    },
  ),
);

/** Отсортировать работы: свежие сверху */
function sortWorks(works: CarWork[]): CarWork[] {
  return [...works].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

/** Хук для получения работ по категории */
export function useWorksByCategory(category: WorkCategory | null): CarWork[] {
  const works = useCarWorkStore((s) => s.works);
  if (!category) return works;
  return works.filter((w) => w.category === category);
}

// ─── Вспомогательные функции ───────────────────

/**
 * Пересчитать стоимость работы, если у неё есть подработы.
 * Если подработ нет — оставить введённое значение `cost`.
 */
function normalizeCost(work: CarWork): CarWork {
  // Защита от старых данных без subWorks
  const subWorks = work.subWorks ?? [];

  if (subWorks.length === 0) {
    return { ...work, subWorks: [] };
  }

  return {
    ...work,
    subWorks,
    cost: subWorks.reduce((sum, item) => sum + getSubItemTotal(item), 0),
  };
}

/**
 * Пересчитать стоимость работы после изменения подзаписей.
 * Если подработ нет — оставляем cost как есть.
 */
function recalculateCost(work: CarWork): CarWork {
  const subWorks = work.subWorks ?? [];

  if (subWorks.length === 0) {
    return { ...work, subWorks };
  }

  return {
    ...work,
    subWorks,
    cost: subWorks.reduce((sum, item) => sum + getSubItemTotal(item), 0),
  };
}