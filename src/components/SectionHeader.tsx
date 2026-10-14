import {
  SECTION_HEADER_TITLE,
  SECTION_HEADER_ROW,
} from '../styles/tokens';

interface SectionHeaderProps {
  title: string;
  /** Опциональный элемент справа (переключатели, кнопки) */
  trailing?: React.ReactNode;
}

/**
 * Единый заголовок секции внутри карточки.
 * Аналог SectionHeader из iOS.
 *
 * Использование:
 *   <SectionHeader title="Расходы по месяцам" />
 *   <SectionHeader title="Расходы по месяцам" trailing={<Picker />} />
 */
export function SectionHeader({ title, trailing }: SectionHeaderProps) {
  if (!trailing) {
    return (
      <h3 className={`${SECTION_HEADER_TITLE} mb-3`}>{title}</h3>
    );
  }

  return (
    <div className={SECTION_HEADER_ROW}>
      <h3 className={SECTION_HEADER_TITLE}>{title}</h3>
      <div className="shrink-0">{trailing}</div>
    </div>
  );
}