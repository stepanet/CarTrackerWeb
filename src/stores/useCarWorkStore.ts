import { create } from 'zustand';
import type { CarWork, WorkCategory } from '../models/CarWork';
import type { SubItem } from '../models/SubItem';
import { getSubItemTotal } from '../models/SubItem';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  fetchAllWorks,
  createWork,
  updateWork,
  deleteWork,
  bulkInsertWorks,
  migrateWorksToVehicle,
} from '../lib/worksApi';
import { subscribeToWorkChanges } from '../lib/realtimeHelpers';
import { useVehicleStore } from './useVehicleStore';

interface CarWorkState {
  works: CarWork[];

  isLoading: boolean;
  error: string | null;
  userId: string | null;
  realtimeChannel: RealtimeChannel | null;

  loadWorks: (userId: string) => Promise<void>;
  reload: () => Promise<void>;
  subscribeRealtime: (userId: string) => void;
  unsubscribeRealtime: () => void;
  clear: () => void;

  migrateFromLocalStorage: (userId: string) => Promise<number>;
  migrateOrphanWorks: (userId: string, vehicleId: string) => Promise<number>;

  add: (work: CarWork) => Promise<void>;
  update: (work: CarWork) => Promise<void>;
  remove: (id: string) => Promise<void>;

  addSubItem: (workId: string, item: SubItem) => Promise<void>;
  updateSubItem: (workId: string, item: SubItem) => Promise<void>;
  removeSubItem: (workId: string, itemId: string) => Promise<void>;
  clearSubItems: (workId: string) => Promise<void>;

  getTotalCost: () => number;
  getTotalThisYear: () => number;
  getCurrentMileage: () => number;
  getTotalWorksCost: () => number;
  getTotalPartsCost: () => number;
}

export const useCarWorkStore = create<CarWorkState>((set, get) => ({
  works: [],
  isLoading: false,
  error: null,
  userId: null,
  realtimeChannel: null,

  // ─── Загрузка ───────────────────────────────

  loadWorks: async (userId: string) => {
    set({ isLoading: true, error: null, userId });
    try {
      // Берём активный транспорт
      const activeVehicleId = useVehicleStore.getState().activeVehicleId;

      const works = await fetchAllWorks(userId, activeVehicleId ?? undefined);
      set({ works: sortWorks(works), isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  reload: async () => {
    const { userId } = get();
    if (!userId) return;
    await get().loadWorks(userId);
  },

  subscribeRealtime: (userId: string) => {
    get().unsubscribeRealtime();

    const channel = subscribeToWorkChanges(userId, async () => {
      try {
        const activeVehicleId = useVehicleStore.getState().activeVehicleId;
        const works = await fetchAllWorks(
          userId,
          activeVehicleId ?? undefined,
        );
        set({ works: sortWorks(works) });
      } catch (err) {
        console.error('Ошибка realtime-синхронизации:', err);
      }
    });

    set({ realtimeChannel: channel });
  },

  unsubscribeRealtime: () => {
    const { realtimeChannel } = get();
    if (realtimeChannel) {
      realtimeChannel.unsubscribe();
      set({ realtimeChannel: null });
    }
  },

  clear: () => {
    get().unsubscribeRealtime();
    set({ works: [], userId: null, error: null });
  },

  // ─── Миграция ───────────────────────────────

  migrateFromLocalStorage: async (userId: string) => {
    try {
      const raw = localStorage.getItem('cartracker-works');
      if (!raw) return 0;

      const parsed = JSON.parse(raw);
      const works: CarWork[] = parsed?.state?.works ?? [];
      if (works.length === 0) {
        localStorage.removeItem('cartracker-works');
        return 0;
      }

      const normalized = works.map((w) => normalizeCost(w));
      const result = await bulkInsertWorks(normalized, userId);

      localStorage.removeItem('cartracker-works');

      return result.inserted;
    } catch (err) {
      console.error('Ошибка миграции:', err);
      return 0;
    }
  },

  migrateOrphanWorks: async (userId: string, vehicleId: string) => {
    try {
      const count = await migrateWorksToVehicle(userId, vehicleId);
      if (count > 0) {
        console.log(`🔄 Привязано работ к транспорту: ${count}`);
      }
      return count;
    } catch (err) {
      console.error('Ошибка миграции работ:', err);
      return 0;
    }
  },

  // ─── CRUD ───────────────────────────────────

  add: async (work) => {
    const { userId } = get();
    if (!userId) throw new Error('Не авторизован');

    // Проставляем активный транспорт, если не задан
    const activeVehicleId = useVehicleStore.getState().activeVehicleId;
    const withVehicle: CarWork = {
      ...work,
      vehicleId: work.vehicleId ?? activeVehicleId,
    };

    const normalized = normalizeCost(withVehicle);

    set((state) => ({
      works: sortWorks([...state.works, normalized]),
    }));

    try {
      await createWork(normalized, userId);
    } catch (err) {
      set((state) => ({
        works: state.works.filter((w) => w.id !== normalized.id),
      }));
      throw err;
    }
  },

  update: async (work) => {
    const { userId } = get();
    if (!userId) throw new Error('Не авторизован');

    const normalized = normalizeCost(work);
    const previous = get().works.find((w) => w.id === work.id);

    set((state) => ({
      works: sortWorks(
        state.works.map((w) => (w.id === normalized.id ? normalized : w)),
      ),
    }));

    try {
      await updateWork(normalized, userId);
    } catch (err) {
      if (previous) {
        set((state) => ({
          works: sortWorks(
            state.works.map((w) => (w.id === previous.id ? previous : w)),
          ),
        }));
      }
      throw err;
    }
  },

  remove: async (id) => {
    const previous = get().works.find((w) => w.id === id);

    set((state) => ({
      works: state.works.filter((w) => w.id !== id),
    }));

    try {
      await deleteWork(id);
    } catch (err) {
      if (previous) {
        set((state) => ({
          works: sortWorks([...state.works, previous]),
        }));
      }
      throw err;
    }
  },

  // ─── Подзаписи ─────────────────────────────

  addSubItem: async (workId, item) => {
    const work = get().works.find((w) => w.id === workId);
    if (!work) return;
    const subWorks = [...(work.subWorks ?? []), item];
    await get().update(recalculateCost({ ...work, subWorks }));
  },

  updateSubItem: async (workId, item) => {
    const work = get().works.find((w) => w.id === workId);
    if (!work) return;
    const subWorks = (work.subWorks ?? []).map((si) =>
      si.id === item.id ? item : si,
    );
    await get().update(recalculateCost({ ...work, subWorks }));
  },

  removeSubItem: async (workId, itemId) => {
    const work = get().works.find((w) => w.id === workId);
    if (!work) return;
    const subWorks = (work.subWorks ?? []).filter((si) => si.id !== itemId);
    await get().update(recalculateCost({ ...work, subWorks }));
  },

  clearSubItems: async (workId) => {
    const work = get().works.find((w) => w.id === workId);
    if (!work) return;
    await get().update({ ...work, subWorks: [] });
  },

  // ─── Утилиты ───────────────────────────────

  getTotalCost: () =>
    get().works.filter((w) => w.isDone).reduce((sum, w) => sum + w.cost, 0),

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
    get()
      .works.filter((w) => w.isDone)
      .flatMap((w) => w.subWorks ?? [])
      .filter((item) => item.type === 'work')
      .reduce((sum, item) => sum + getSubItemTotal(item), 0),

  getTotalPartsCost: () =>
    get()
      .works.filter((w) => w.isDone)
      .flatMap((w) => w.subWorks ?? [])
      .filter((item) => item.type === 'part')
      .reduce((sum, item) => sum + getSubItemTotal(item), 0),
}));

// ─── Вспомогательные ───────────────────────────

function sortWorks(works: CarWork[]): CarWork[] {
  return [...works].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function useWorksByCategory(category: WorkCategory | null): CarWork[] {
  const works = useCarWorkStore((s) => s.works);
  if (!category) return works;
  return works.filter((w) => w.category === category);
}

function normalizeCost(work: CarWork): CarWork {
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