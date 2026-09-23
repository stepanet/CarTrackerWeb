import type { SubItem } from './SubItem';
import { getSubItemTotal } from './SubItem';

/**
 * Категории работ.
 * Значения — русские строки, точно совпадают с WorkCategory в Swift.
 */
export type WorkCategory =
  | 'ТО'
  | 'Ремонт'
  | 'Шины'
  | 'Топливо'
  | 'Страховка'
  | 'Прочее';

/** Список всех категорий (для UI-выбора и итерации) */
export const ALL_CATEGORIES: WorkCategory[] = [
  'ТО',
  'Ремонт',
  'Шины',
  'Топливо',
  'Страховка',
  'Прочее',
];

/** Иконки-эмодзи для веба (в Swift — SF Symbols) */
export const CATEGORY_ICONS: Record<WorkCategory, string> = {
  'ТО': '🔧',
  'Ремонт': '🔨',
  'Шины': '⭕',
  'Топливо': '⛽',
  'Страховка': '🛡️',
  'Прочее': '📌',
};

/**
 * Работа по автомобилю.
 * Поля точно совпадают с CarWork в Swift.
 */
export interface CarWork {
  id: string;              // UUID
  title: string;
  category: WorkCategory;
  date: string;            // ISO 8601
  mileage: number;
  cost: number;
  note: string;
  isDone: boolean;
  subWorks: SubItem[];    // ← НОВОЕ ПОЛЕ
}

/**
 * Создать новую работу с дефолтными значениями.
 * Аналог `CarWork(title: ...)` в Swift.
 */
export function createCarWork(
  title: string,
  category: WorkCategory,
  date: Date,
  mileage: number,
  cost: number,
  note: string,
  isDone: boolean = true,
  subWorks: SubItem[] = [],
): CarWork {
  // Если есть подработы — стоимость = сумма подработ
  const finalCost = subWorks.length > 0
    ? subWorks.reduce((sum, item) => sum + getSubItemTotal(item), 0)
    : cost;

  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    category,
    date: date.toISOString(),
    mileage,
    cost: finalCost,
    note,
    isDone,
    subWorks,
  };
}

/** Есть ли подработы */
export function hasSubItems(work: CarWork): boolean {
  return work.subWorks && work.subWorks.length > 0;
}

/** Количество работ (услуг) */
export function getWorksCount(work: CarWork): number {
  if (!work.subWorks) return 0;
  return work.subWorks.filter((item) => item.type === 'work').length;
}

/** Количество деталей */
export function getPartsCount(work: CarWork): number {
  if (!work.subWorks) return 0;
  return work.subWorks.filter((item) => item.type === 'part').length;
}

/** Сумма всех подработ */
export function getSubWorksTotal(work: CarWork): number {
  if (!work.subWorks) return 0;
  return work.subWorks.reduce((sum, item) => sum + getSubItemTotal(item), 0);
}