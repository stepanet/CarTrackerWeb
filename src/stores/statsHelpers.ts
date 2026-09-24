import type { CarWork } from '../models/CarWork';
import { getSubItemTotal, type SubItemType } from '../models/SubItem';

/** Данные одной точки на графике по месяцам */
export interface MonthlyCost {
  month: string;          // "2026-09-01" — первое число месяца
  label: string;          // "сен"
  fullLabel: string;      // "сентябрь 2026"
  total: number;
}

/** Данные одной категории */
export interface CategoryCost {
  category: WorkCategory;
  total: number;
  percent: number;        // 0..100
}

/**
 * Расходы по месяцам за последние N месяцев (включая текущий).
 * Возвращает массив точек, даже если в каком-то месяце 0.
 */
export function getMonthlyCosts(works: CarWork[], monthsBack: number): MonthlyCost[] {
  const result: MonthlyCost[] = [];
  const now = new Date();

  for (let i = monthsBack - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth();

    const total = works
      .filter((w) => {
        if (!w.isDone) return false;
        const d = new Date(w.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, w) => sum + w.cost, 0);

    result.push({
      month: date.toISOString(),
      label: shortMonthName(month),
      fullLabel: fullMonthName(month) + ' ' + year,
      total,
    });
  }

  return result;
}

/**
 * Расходы по категориям, отсортированные по убыванию.
 */
export function getCategoryCosts(works: CarWork[]): CategoryCost[] {
  const done = works.filter((w) => w.isDone);
  const total = done.reduce((sum, w) => sum + w.cost, 0);

  const byCategory = new Map<WorkCategory, number>();
  for (const w of done) {
    byCategory.set(w.category, (byCategory.get(w.category) ?? 0) + w.cost);
  }

  const result: CategoryCost[] = [];
  for (const [category, sum] of byCategory.entries()) {
    if (sum <= 0) continue;
    result.push({
      category,
      total: sum,
      percent: total > 0 ? (sum / total) * 100 : 0,
    });
  }

  return result.sort((a, b) => b.total - a.total);
}

/**
 * Средний расход в месяц (по месяцам, где были траты).
 */
export function getAveragePerMonth(works: CarWork[], monthsBack: number = 6): number {
  const monthly = getMonthlyCosts(works, monthsBack);
  const nonEmpty = monthly.filter((m) => m.total > 0);
  if (nonEmpty.length === 0) return 0;
  return nonEmpty.reduce((s, m) => s + m.total, 0) / nonEmpty.length;
}

// ─── Локализация месяцев ──────────────────────

const SHORT_MONTHS = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

const FULL_MONTHS = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
];

function shortMonthName(month: number): string {
  return SHORT_MONTHS[month] ?? '';
}

function fullMonthName(month: number): string {
  return FULL_MONTHS[month] ?? '';
}



/**
 * Расходы по месяцам с разбивкой на работы и детали.
 * Работы без подработ (просто с cost) относятся к "работам" — у них нет структуры.
 */
export interface MonthlyCostDetailed {
  month: string;
  label: string;
  fullLabel: string;
  worksTotal: number;
  partsTotal: number;
  total: number;
}

export function getMonthlyCostsDetailed(
  works: CarWork[],
  monthsBack: number,
): MonthlyCostDetailed[] {
  const result: MonthlyCostDetailed[] = [];
  const now = new Date();

  for (let i = monthsBack - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth();

    // Работы этого месяца
    const worksInMonth = works.filter((w) => {
      if (!w.isDone) return false;
      const d = new Date(w.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    // Работы (услуги) — только subWorks типа 'work'
    const worksSum = worksInMonth
      .flatMap((w) => w.subWorks ?? [])
      .filter((item) => item.type === 'work')
      .reduce((sum, item) => sum + getSubItemTotal(item), 0);

    // Детали — subWorks типа 'part'
    const partsSum = worksInMonth
      .flatMap((w) => w.subWorks ?? [])
      .filter((item) => item.type === 'part')
      .reduce((sum, item) => sum + getSubItemTotal(item), 0);

    // Работы БЕЗ подработ — их cost относится к "работам"
    const worksWithoutSubs = worksInMonth
      .filter((w) => !w.subWorks || w.subWorks.length === 0)
      .reduce((sum, w) => sum + w.cost, 0);

    const worksTotal = worksSum + worksWithoutSubs;
    const partsTotal = partsSum;

    result.push({
      month: date.toISOString(),
      label: shortMonthName(month),
      fullLabel: `${fullMonthName(month)} ${year}`,
      worksTotal,
      partsTotal,
      total: worksTotal + partsTotal,
    });
  }

  return result;
}

/**
 * Топ-N затрат (работ или деталей) за всё время.
 * Агрегирует по названию — "Масло Mobil 5W-30" в 3 ТО = одна строка.
 */
export interface TopItem {
  id: string;              // ← НОВОЕ
  title: string;
  total: number;
  occurrences: number;
  workTitle?: string;
  workDate?: string;
  quantity?: number;
  unitPrice?: number;
}

export function getTopItems(
  works: CarWork[],
  type: SubItemType,
  limit: number = 5,
): TopItem[] {
  // Собираем ВСЕ подзаписи указанного типа вместе с информацией о работе
  const allItems = works
    .filter((w) => w.isDone)
    .flatMap((work) =>
      (work.subWorks ?? [])
        .filter((item) => item.type === type)
        .map((item) => ({
          item,
          workTitle: work.title,
          workDate: work.date,
        })),
    );

  // Сортируем по цене (totalCost = quantity × unitPrice) — по убыванию
  return allItems
    .sort(
      (a, b) =>
        getSubItemTotal(b.item) - getSubItemTotal(a.item),
    )
    .slice(0, limit)
    .map(({ item, workTitle, workDate }) => ({
      id: item.id,                              // ← НОВОЕ
      title: item.title,
      total: getSubItemTotal(item),
      occurrences: 1,
      workTitle,
      workDate,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));
}

/**
 * Общая сумма работ (услуг) за всё время.
 */
export function getTotalWorksCost(works: CarWork[]): number {
  return works
    .filter((w) => w.isDone)
    .flatMap((w) => w.subWorks ?? [])
    .filter((item) => item.type === 'work')
    .reduce((sum, item) => sum + getSubItemTotal(item), 0);
}

/**
 * Общая сумма деталей за всё время.
 */
export function getTotalPartsCost(works: CarWork[]): number {
  return works
    .filter((w) => w.isDone)
    .flatMap((w) => w.subWorks ?? [])
    .filter((item) => item.type === 'part')
    .reduce((sum, item) => sum + getSubItemTotal(item), 0);
}