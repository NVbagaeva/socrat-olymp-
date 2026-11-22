import { clsx } from 'clsx';
import Link from 'next/link';
import { LEVELS, levelInfo, type Level } from '@/lib/level';
import './level.css';

export interface LevelTabsProps {
  /** Открытый уровень. */
  level: Level;
  /**
   * Куда ведут вкладки: главная уровня, её блок со списком заданий или
   * страница банка, сборщик варианта.
   */
  to: 'home' | 'home-bank' | 'bank' | 'variant';
  /** С номерами заданий: «Профиль · 1–13». Над списком заданий. */
  range?: boolean;
  /** Полная подпись: «Профиль, задания 1–13». Первый шаг сборщика варианта. */
  zadaniya?: boolean;
  /** Подпись для скринридера. */
  label?: string;
  className?: string;
}

function target(level: Level, to: LevelTabsProps['to']): string {
  const info = levelInfo(level);
  if (to === 'variant') return info.variant;
  return to === 'bank' ? info.bank : to === 'home' ? info.home : `${info.home}#bank`;
}

/**
 * Вкладки уровня: над заголовком главной и над списком заданий.
 * Ссылки, как и переключатель в шапке, — уровень живёт в адресе.
 */
export function LevelTabs({
  level,
  to,
  range = false,
  zadaniya = false,
  label = 'Уровень экзамена',
  className,
}: LevelTabsProps) {
  return (
    <nav className={clsx('level-tabs', className)} aria-label={label}>
      {LEVELS.map((id) => {
        const info = levelInfo(id);
        return (
          <Link
            key={id}
            href={target(id, to)}
            className={clsx('level-tabs__seg', id === level && 'is-active')}
            aria-current={id === level ? 'true' : undefined}
          >
            {zadaniya ? `${info.label}, задания ${info.range}` : info.label}
            {range ? <span className="level-tabs__range">{info.range}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
