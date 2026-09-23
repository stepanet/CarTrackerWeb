import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CarWork, WorkCategory } from '../models/CarWork';

interface CarWorkState {
  works: CarWork[];

  // CRUD
  add: (work: CarWork) => void;
  update: (work: CarWork) => void;
  remove: (id: string) => void;
  replaceAll: (works: CarWork[]) => void;

  // Утилиты
  getTotalCost: () => number;
  getTotalThisYear: () => number;
  getCurrentMileage: () => number;
}

export const useCarWorkStore = create<CarWorkState>()(
  persist(
    (set, get) => ({
      works: [],

      add: (work) =>
        set((state) => ({
          works: sortWorks([...state.works, work]),
        })),

      update: (work) =>
        set((state) => ({
          works: sortWorks(
            state.works.map((w) => (w.id === work.id ? work : w)),
          ),
        })),

      remove: (id) =>
        set((state) => ({
          works: state.works.filter((w) => w.id !== id),
        })),

      replaceAll: (works) =>
        set({ works: sortWorks(works) }),

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
    }),
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