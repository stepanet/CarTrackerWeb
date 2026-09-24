import { supabase } from './supabase';
import type { CarWork, WorkCategory } from '../models/CarWork';
import type { SubItem, SubItemType } from '../models/SubItem';

// ═══════════════════════════════════════════════
// Типы строк в базе (snake_case, как в SQL)
// ═══════════════════════════════════════════════

interface WorkRow {
  id: string;
  user_id: string;
  title: string;
  category: string;
  date: string;
  mileage: number;
  cost: number;
  note: string;
  is_done: boolean;
  created_at: string;
  updated_at: string;
}

interface SubWorkRow {
  id: string;
  work_id: string;
  type: string;
  title: string;
  quantity: number;
  unit_price: number;
  note: string;
  created_at: string;
}

// ═══════════════════════════════════════════════
// Конвертация DB ↔ App
// ═══════════════════════════════════════════════

function rowToSubItem(row: SubWorkRow): SubItem {
  return {
    id: row.id,
    type: row.type as SubItemType,
    title: row.title,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    note: row.note,
  };
}

function rowToCarWork(row: WorkRow, subWorks: SubWorkRow[]): CarWork {
  return {
    id: row.id,
    title: row.title,
    category: row.category as WorkCategory,
    date: row.date,
    mileage: row.mileage,
    cost: Number(row.cost),
    note: row.note,
    isDone: row.is_done,
    subWorks: subWorks.map(rowToSubItem),
  };
}

function carWorkToRow(work: CarWork, userId: string) {
  return {
    id: work.id,
    user_id: userId,
    title: work.title,
    category: work.category,
    date: work.date,
    mileage: work.mileage,
    cost: work.cost,
    note: work.note,
    is_done: work.isDone,
  };
}

function subItemToRow(item: SubItem, workId: string) {
  return {
    id: item.id,
    work_id: workId,
    type: item.type,
    title: item.title,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    note: item.note,
  };
}

// ═══════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════

/** Получить все работы пользователя вместе с подработами */
export async function fetchAllWorks(userId: string): Promise<CarWork[]> {
  const { data: works, error: worksError } = await supabase
    .from('works')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (worksError) throw worksError;
  if (!works || works.length === 0) return [];

  const workIds = works.map((w) => w.id);

  const { data: subWorks, error: subError } = await supabase
    .from('sub_works')
    .select('*')
    .in('work_id', workIds);

  if (subError) throw subError;

  // Группируем подработы по work_id
  const subByWork = new Map<string, SubWorkRow[]>();
  for (const sw of subWorks ?? []) {
    const arr = subByWork.get(sw.work_id) ?? [];
    arr.push(sw);
    subByWork.set(sw.work_id, arr);
  }

  return works.map((w) =>
    rowToCarWork(w as WorkRow, subByWork.get(w.id) ?? []),
  );
}

/** Создать работу с подработами (транзакционно) */
export async function createWork(
  work: CarWork,
  userId: string,
): Promise<void> {
  // 1. Вставляем работу
  const { error: workError } = await supabase
    .from('works')
    .insert(carWorkToRow(work, userId));

  if (workError) throw workError;

  // 2. Вставляем подработы (если есть)
  if (work.subWorks.length > 0) {
    const subRows = work.subWorks.map((item) => subItemToRow(item, work.id));
    const { error: subError } = await supabase
      .from('sub_works')
      .insert(subRows);

    if (subError) {
      // Откатываем работу, чтобы не осталось «пустой» без подработ
      await supabase.from('works').delete().eq('id', work.id);
      throw subError;
    }
  }
}

/** Обновить работу и её подработы */
export async function updateWork(
  work: CarWork,
  userId: string,
): Promise<void> {
  // 1. Обновляем саму работу
  const { error: workError } = await supabase
    .from('works')
    .update(carWorkToRow(work, userId))
    .eq('id', work.id);

  if (workError) throw workError;

  // 2. Удаляем все подработы этой работы
  const { error: deleteError } = await supabase
    .from('sub_works')
    .delete()
    .eq('work_id', work.id);

  if (deleteError) throw deleteError;

  // 3. Вставляем заново
  if (work.subWorks.length > 0) {
    const subRows = work.subWorks.map((item) => subItemToRow(item, work.id));
    const { error: subError } = await supabase
      .from('sub_works')
      .insert(subRows);

    if (subError) throw subError;
  }
}

/** Удалить работу (подработы удалятся каскадно) */
export async function deleteWork(workId: string): Promise<void> {
  const { error } = await supabase.from('works').delete().eq('id', workId);
  if (error) throw error;
}

/** Массовая вставка работ (для миграции из localStorage) */
export async function bulkInsertWorks(
  works: CarWork[],
  userId: string,
): Promise<{ inserted: number; skipped: number }> {
  if (works.length === 0) return { inserted: 0, skipped: 0 };

  // Смотрим, какие id работ уже есть у пользователя
  const ids = works.map((w) => w.id);
  const { data: existing, error: fetchError } = await supabase
    .from('works')
    .select('id')
    .eq('user_id', userId)
    .in('id', ids);

  if (fetchError) throw fetchError;

  const existingIds = new Set((existing ?? []).map((r) => r.id));
  const toInsert = works.filter((w) => !existingIds.has(w.id));

  if (toInsert.length === 0) {
    return { inserted: 0, skipped: works.length };
  }

  const workRows = toInsert.map((w) => carWorkToRow(w, userId));
  const { error: workError } = await supabase
    .from('works')
    .insert(workRows);

  if (workError) throw workError;

  const allSubRows = toInsert.flatMap((w) =>
    w.subWorks.map((item) => subItemToRow(item, w.id)),
  );

  if (allSubRows.length > 0) {
    const { error: subError } = await supabase
      .from('sub_works')
      .insert(allSubRows);

    if (subError) throw subError;
  }

  return {
    inserted: toInsert.length,
    skipped: works.length - toInsert.length,
  };
}