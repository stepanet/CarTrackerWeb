import { SCREEN_HEADER_TITLE, SCREEN_HEADER_SUBTITLE } from '../styles/tokens';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
}

export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  return (
    <div className="px-4 pt-2 pb-3">
      <h1 className={SCREEN_HEADER_TITLE}>{title}</h1>
      {subtitle && <p className={SCREEN_HEADER_SUBTITLE}>{subtitle}</p>}
    </div>
  );
}