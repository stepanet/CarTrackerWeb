import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Vehicle } from '../models/Vehicle';
import { createVehicle as createVehicleModel } from '../models/Vehicle';
import {
  fetchAllVehicles,
  createVehicleApi,
  updateVehicleApi,
  deleteVehicleApi,
} from '../lib/vehiclesApi';
import { subscribeToVehicleChanges } from '../lib/realtimeHelpers';

// ═══════════════════════════════════════════════
// Состояние
// ═══════════════════════════════════════════════

interface VehicleState {
  vehicles: Vehicle[];

  // Состояние
  isLoading: boolean;
  error: string | null;
  userId: string | null;
  realtimeChannel: RealtimeChannel | null;

  // Активный транспорт (сохраняется в localStorage)
  activeVehicleId: string | null;

  // Загрузка / Realtime
  loadVehicles: (userId: string) => Promise<void>;
  reload: () => Promise<void>;
  subscribeRealtime: (userId: string) => void;
  unsubscribeRealtime: () => void;
  clear: () => void;

  // Активный транспорт
  setActiveVehicle: (vehicleId: string) => void;

  // CRUD
  add: (vehicle: Vehicle) => Promise<void>;
  update: (vehicle: Vehicle) => Promise<void>;
  remove: (id: string) => Promise<void>;

  // Хелперы
  ensureDefaultVehicle: (userId: string) => Promise<Vehicle | null>;
  getActiveVehicle: () => Vehicle | null;
  getAllMileage: (workMileage: number, vehicleId: string) => number;
}

export const useVehicleStore = create<VehicleState>()(
  persist(
    (set, get) => ({
      vehicles: [],
      isLoading: false,
      error: null,
      userId: null,
      realtimeChannel: null,
      activeVehicleId: null,

      // ═══════════════════════════════════════════
      // Загрузка
      // ═══════════════════════════════════════════

      loadVehicles: async (userId: string) => {
        set({ isLoading: true, error: null, userId });
        try {
          const vehicles = await fetchAllVehicles(userId);
          set({ vehicles, isLoading: false });

          // Если активного нет — ставим первый доступный
          const { activeVehicleId } = get();
          if (!activeVehicleId && vehicles.length > 0) {
            set({ activeVehicleId: vehicles[0].id });
          }

          // Если активный был удалён — выбираем первый
          if (activeVehicleId && !vehicles.some((v) => v.id === activeVehicleId)) {
            set({ activeVehicleId: vehicles[0]?.id ?? null });
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Ошибка загрузки';
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      reload: async () => {
        const { userId } = get();
        if (!userId) return;
        await get().loadVehicles(userId);
      },

      subscribeRealtime: (userId: string) => {
        get().unsubscribeRealtime();

        const channel = subscribeToVehicleChanges(userId, async () => {
          try {
            const vehicles = await fetchAllVehicles(userId);
            set({ vehicles });
          } catch (err) {
            console.error('Ошибка realtime-синхронизации vehicles:', err);
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
        set({
          vehicles: [],
          userId: null,
          error: null,
          activeVehicleId: null,
        });
      },

      // ═══════════════════════════════════════════
      // Активный транспорт
      // ═══════════════════════════════════════════

      setActiveVehicle: (vehicleId: string) => {
        set({ activeVehicleId: vehicleId });
      },

      getActiveVehicle: () => {
        const { vehicles, activeVehicleId } = get();
        if (!activeVehicleId) return null;
        return vehicles.find((v) => v.id === activeVehicleId) ?? null;
      },

      getAllMileage: (workMileage: number, vehicleId: string) => {
        const { vehicles } = get();
        const vehicle = vehicles.find((v) => v.id === vehicleId);
        const initial = vehicle?.initialMileage ?? 0;
        return Math.max(initial, workMileage);
      },

      // ═══════════════════════════════════════════
      // CRUD
      // ═══════════════════════════════════════════

      add: async (vehicle) => {
        const { userId } = get();
        if (!userId) throw new Error('Не авторизован');

        // Оптимистично добавляем
        set((state) => ({
          vehicles: [...state.vehicles, vehicle],
        }));

        try {
          await createVehicleApi(vehicle, userId);
        } catch (err) {
          // Откат
          set((state) => ({
            vehicles: state.vehicles.filter((v) => v.id !== vehicle.id),
          }));
          throw err;
        }
      },

      update: async (vehicle) => {
        const { userId } = get();
        if (!userId) throw new Error('Не авторизован');

        const previous = get().vehicles.find((v) => v.id === vehicle.id);

        set((state) => ({
          vehicles: state.vehicles.map((v) =>
            v.id === vehicle.id ? vehicle : v,
          ),
        }));

        try {
          await updateVehicleApi(vehicle, userId);
        } catch (err) {
          if (previous) {
            set((state) => ({
              vehicles: state.vehicles.map((v) =>
                v.id === previous.id ? previous : v,
              ),
            }));
          }
          throw err;
        }
      },

      remove: async (id) => {
        const previous = get().vehicles;

        set((state) => ({
          vehicles: state.vehicles.filter((v) => v.id !== id),
        }));

        // Если удалили активный — выбираем следующий
        const { activeVehicleId } = get();
        if (activeVehicleId === id) {
          const next = get().vehicles[0]?.id ?? null;
          set({ activeVehicleId: next });
        }

        try {
          await deleteVehicleApi(id);
        } catch (err) {
          set({ vehicles: previous });
          throw err;
        }
      },

      // ═══════════════════════════════════════════
      // Создание дефолтного транспорта
      // ═══════════════════════════════════════════

      ensureDefaultVehicle: async (userId: string): Promise<Vehicle | null> => {
        const { vehicles } = get();

        // Уже есть? Возвращаем дефолтный
        if (vehicles.length > 0) {
          const defaultVehicle =
            vehicles.find((v) => v.isDefault) ?? vehicles[0];
          return defaultVehicle;
        }

        // Нет ни одного — создаём "Моя машина"
        const newVehicle = createVehicleModel(
          'Моя машина',
          'car',
          '',
          null,
          'car',
          0,
        );
        newVehicle.isDefault = true;

        try {
          await createVehicleApi(newVehicle, userId);
          set({ vehicles: [newVehicle], activeVehicleId: newVehicle.id });
          console.log('🚗 Создан транспорт по умолчанию:', newVehicle.name);
          return newVehicle;
        } catch (err) {
          console.error('Ошибка создания дефолтного транспорта:', err);
          return null;
        }
      },
    }),
    {
      name: 'cartracker-active-vehicle', // сохраняем только activeVehicleId
      partialize: (state) => ({
        activeVehicleId: state.activeVehicleId,
      }),
    },
  ),
);