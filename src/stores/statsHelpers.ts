import type { CarWork, WorkCategory } from '../models/CarWork';

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