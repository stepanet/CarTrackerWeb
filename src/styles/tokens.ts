/**
 * Design tokens — единые константы для отступов и радиусов.
 * Аналог Spacing и Radius в iOS-версии.
 */

export const Spacing = {
  /** Внешние отступы от края экрана */
  screenPadding: 'px-4',
  /** Внутренние отступы в карточках */
  cardPadding: 'p-4',
  /** Между секциями */
  sectionSpacing: 'space-y-5',
  /** Между элементами внутри карточки */
  itemSpacing: 'gap-2',
  /** Маленький отступ */
  smallSpacing: 'gap-1',
} as const;

export const Radius = {
  /** Карточки */
  card: 'rounded-2xl',
  /** Кнопки */
  button: 'rounded-xl',
  /** Чипы / маленькие элементы */
  chip: 'rounded-full',
} as const;

/** Единый стиль карточки (Tailwind-классы) */
export const CARD_STYLE = 'bg-white rounded-2xl p-4 shadow-sm';

/** Единый стиль заголовка экрана */
export const SCREEN_HEADER_TITLE = 'text-3xl font-bold text-gray-900';
export const SCREEN_HEADER_SUBTITLE = 'text-sm text-gray-500 mt-1';