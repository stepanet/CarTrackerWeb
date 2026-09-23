/**
 * Тип подзаписи: работа (услуга) или деталь (запчасть).
 * Значения — латиница, точно совпадают с SubItemType в Swift.
 */
export type SubItemType = 'work' | 'part';

/** Список всех типов (для UI) */
export const ALL_SUB_ITEM_TYPES: SubItemType[] = ['work', 'part'];

/** Читаемые названия */
export const SUB_ITEM_TYPE_LABELS: Record<SubItemType, string> = {
  work: 'Работа',
  part: 'Деталь',
};

/** Иконки для веба (эмодзи вместо SF Symbols) */
export const SUB_ITEM_TYPE_ICONS: Record<SubItemType, string> = {
  work: '🔧',
  part: '📦',
};

/** Цвета для UI (Tailwind) */
export const SUB_ITEM_TYPE_COLORS: Record<SubItemType, {
  bg: string;
  text: string;
  border: string;
}> = {
  work: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-500',
  },
  part: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-500',
  },
};

/**
 * Подзапись внутри работы.
 * Точно совпадает с SubItem в Swift.
 */
export interface SubItem {
  id: string;              // UUID
  type: SubItemType;
  title: string;
  quantity: number;        // Для деталей — 4 свечи, 4л масла
  unitPrice: number;       // Цена за единицу
  note: string;
}

/** Итоговая стоимость подзаписи */
export function getSubItemTotal(item: SubItem): number {
  return item.quantity * item.unitPrice;
}

/**
 * Создать новую подзапись.
 * Аналог `SubItem(type:title:...)` в Swift.
 */
export function createSubItem(
  type: SubItemType,
  title: string,
  quantity: number,
  unitPrice: number,
  note: string = '',
): SubItem {
  return {
    id: crypto.randomUUID(),
    type,
    title: title.trim(),
    quantity,
    unitPrice,
    note: note.trim(),
  };
}

/** Красивое описание количества: «4 × 565 ₽» */
export function formatQuantityDescription(item: SubItem): string {
  const qty = item.quantity === Math.floor(item.quantity)
    ? String(item.quantity)
    : item.quantity.toFixed(2);

  const price = item.unitPrice.toLocaleString('ru-RU', {
    maximumFractionDigits: 0,
  });

  return `${qty} × ${price} ₽`;
}