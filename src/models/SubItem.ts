import { Wrench, Package, type LucideIcon } from 'lucide-react';

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

/** Иконки-компоненты Lucide */
export const SUB_ITEM_TYPE_ICONS: Record<SubItemType, LucideIcon> = {
  work: Wrench,
  part: Package,
};

/** Цвета для UI (Tailwind) */
export const SUB_ITEM_TYPE_COLORS: Record<
  SubItemType,
  { bg: string; text: string; border: string }
> = {
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
 */
export interface SubItem {
  id: string;
  type: SubItemType;
  title: string;
  quantity: number;
  unitPrice: number;
  note: string;
}

/** Итоговая стоимость подзаписи */
export function getSubItemTotal(item: SubItem): number {
  return item.quantity * item.unitPrice;
}

/** Создать новую подзапись */
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