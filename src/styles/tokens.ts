/**
 * Design tokens — единые константы для отступов и радиусов.
 * 1:1 с iOS (Spacing / Radius / CardStyle).
 */

// ═══════════════════════════════════════════════
// Отступы
// ═══════════════════════════════════════════════

export const Spacing = {
  /** Между секциями на экране (iOS: 20) */
  sectionSpacing: 'space-y-5',

  /** Внешние отступы от края экрана (iOS: 16) */
  screenPadding: 'px-4',

  /** Внутренние отступы в карточках (iOS: 14 → p-3.5) */
  cardPadding: 'p-3.5',

  /** Между элементами внутри карточки (iOS: 8 → gap-2) */
  itemSpacing: 'gap-2',

  /** Маленький отступ (iOS: 4 → gap-1) */
  smallSpacing: 'gap-1',
} as const;

// ═══════════════════════════════════════════════
// Радиусы
// ═══════════════════════════════════════════════

export const Radius = {
  /** Карточки (iOS: 16 → rounded-2xl) */
  card: 'rounded-2xl',
  /** Кнопки (iOS: 12 → rounded-xl) */
  button: 'rounded-xl',
  /** Чипы / маленькие элементы (iOS: 20 → rounded-full для круглых) */
  chip: 'rounded-full',
} as const;

// ═══════════════════════════════════════════════
// Стиль карточки (аналог cardStyle() в iOS)
// ═══════════════════════════════════════════════

export const CARD_STYLE = `bg-white ${Radius.card} ${Spacing.cardPadding} shadow-sm`;

// ═══════════════════════════════════════════════
// Заголовок экрана (аналог ScreenHeader в iOS)
// ═══════════════════════════════════════════════

export const SCREEN_HEADER_TITLE = 'text-3xl font-bold text-gray-900';
export const SCREEN_HEADER_SUBTITLE = 'text-sm text-gray-500 mt-1';

// ═══════════════════════════════════════════════
// Заголовок секции (аналог SectionHeader в iOS)
// ═══════════════════════════════════════════════

export const SECTION_HEADER_TITLE = 'text-base font-semibold text-gray-900';
export const SECTION_HEADER_ROW = 'flex items-center justify-between gap-2 mb-3';