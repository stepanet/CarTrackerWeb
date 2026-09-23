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
): CarWork {
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    category,
    date: date.toISOString(),
    mileage,
    cost,
    note,
    isDone,
  };
}