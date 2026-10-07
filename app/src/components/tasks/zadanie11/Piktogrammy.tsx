import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import type { Level, SectionId } from '@/lib/zadanie11/types';

/**
 * Пиктограммы задания №11: значки разделов и мини-иллюстрации типов
 * задач. Линейные рисунки 24×24 в цвете раздела (currentColor) —
 * так же нарисованы значки навигации сайта. Мини-иллюстрация типа —
 * одна-три пиктограммы на мягкой плашке раздела.
 */

const P: Record<string, ReactNode> = {
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  percent: (
    <>
      <path d="M19 5 5 19" />
      <circle cx="7" cy="7" r="2.5" />
      <circle cx="17" cy="17" r="2.5" />
    </>
  ),
  flask: <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3M7.4 15h9.2" />,
  car: (
    <>
      <path d="M3 16v-4l2.5-5h13L21 12v4zM3 12h18" />
      <circle cx="7" cy="17" r="1.8" />
      <circle cx="17" cy="17" r="1.8" />
    </>
  ),
  train: (
    <>
      <path d="M7 3h10a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM4 10h16M8 21l2-3M16 21l-2-3" />
      <circle cx="8" cy="14" r="1" />
      <circle cx="16" cy="14" r="1" />
    </>
  ),
  ship: <path d="M2 14h20l-3 6H5zM6 14V9h12v5M9 9V5h6v4" />,
  boat: <path d="M3 15h18l-3 5H6zM12 15V3l6 10h-6" />,
  cycle: <path d="M20 12a8 8 0 0 1-14.9 4M4 12a8 8 0 0 1 14.9-4M19 3v5h-5M5 21v-5h5" />,
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
      <circle cx="12" cy="12" r="6.5" />
    </>
  ),
  stairs: <path d="M3 20h5v-5h5v-5h5V5h3" />,
  bike: (
    <>
      <circle cx="6" cy="17" r="3.5" />
      <circle cx="18" cy="17" r="3.5" />
      <path d="M6 17l4-7h6l2 7M10 10 8.5 6H6.5M14.5 6H16l-1.5 4" />
    </>
  ),
  runner: (
    <>
      <circle cx="14" cy="4" r="2" />
      <path d="M7 21l3.5-6 3 2.5V22M10.5 15l1.5-6-4 1.5-2 3M12 9l3 3.5 3.5-1" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  gauge: (
    <>
      <path d="M4 18a8 8 0 1 1 16 0" />
      <path d="M12 18l4.5-5.5" />
      <circle cx="12" cy="18" r="1.2" />
    </>
  ),
  hill: <path d="M2 20c4-7.5 7-12 10-12s6 4.5 10 12z" />,
  arrow: <path d="M4 12h15M14 7l5 5-5 5" />,
  uturn: <path d="M20 9H8.5a4.5 4.5 0 0 0 0 9H12M16 5l4 4-4 4" />,
  raft: <path d="M3 18h18M4 14.5h16V18H4zM12 14.5V6l5 6.5" />,
  pipe: <path d="M3 7h9v5H3zM12 9h5a3 3 0 0 1 3 3v3M20 18.5v1.5" />,
  drop: <path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z" />,
  fence: <path d="M4 21V7l2-3 2 3v14M10 21V7l2-3 2 3v14M16 21V7l2-3 2 3v14M3 11h18M3 17h18" />,
  tag: (
    <>
      <path d="M3 12V4h8l10 10-8 8z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </>
  ),
  chart: <path d="M3 20h18M5 16l4-5 4 3 6-8" />,
  family: (
    <>
      <circle cx="6" cy="8" r="2" />
      <circle cx="12" cy="6" r="2" />
      <circle cx="18" cy="8" r="2" />
      <path d="M3 20v-4a3 3 0 0 1 6 0M9 20v-6a3 3 0 0 1 6 0v6M15 20v-4a3 3 0 0 1 6 0" />
    </>
  ),
  shirt: <path d="M8 3 3 6l2 4 2-1v12h10V9l2 1 2-4-5-3a4 4 0 0 1-8 0z" />,
  bars: <path d="M3 19h8l-1-4H4zM13 19h8l-1-4h-6zM8 14h8l-1-4H9z" />,
  grapes: (
    <>
      <circle cx="9" cy="9" r="2.3" />
      <circle cx="14" cy="9" r="2.3" />
      <circle cx="11.5" cy="13.2" r="2.3" />
      <circle cx="16.5" cy="13.2" r="2.3" />
      <circle cx="14" cy="17.4" r="2.3" />
      <path d="M11 6.5 10 3M10 3h4" />
    </>
  ),
  snail: (
    <>
      <circle cx="14" cy="12" r="6" />
      <path d="M14 12a2.5 2.5 0 1 0 2.5-2.5M2 19h19M8 18c-3 0-5-1.5-5-4M4.5 14 3.5 9.5M6.5 14.5l1-4.5" />
    </>
  ),
  plane: <path d="M21 4 3 11l7 3 3 7zM10 14l5-5" />,
  bus: (
    <>
      <path d="M5 3h14a1 1 0 0 1 1 1v13H4V4a1 1 0 0 1 1-1zM4 10h16M7 20v-3M17 20v-3" />
      <circle cx="8" cy="14" r="1" />
      <circle cx="16" cy="14" r="1" />
    </>
  ),
  can: <path d="M5 7h14v13H5zM5 7c0-1.7 3.1-3 7-3s7 1.3 7 3M9 12h6" />,
  pill: <path d="M10.5 20.5a5 5 0 0 1-7-7l7-7a5 5 0 0 1 7 7zM7 10l7 7" />,
  balloon: <path d="M12 3a5 6 0 1 1 0 12 5 6 0 1 1 0-12zM11 15h2l-1 2zM12 17c0 2-2 3 0 5" />,
  coins: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="2.5" />
      <path d="M5 6v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6M5 10v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4M5 14v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-4" />
    </>
  ),
  ring: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v3" />
    </>
  ),
  tunnel: <path d="M3 20v-9a9 9 0 0 1 18 0v9M7 20v-8a5 5 0 0 1 10 0v8M2 20h20" />,
  square: <path d="M4 7h16v12H4zM4 7l3-3h16l-3 3M20 19l3-3V4" />,
  book: <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21a2 2 0 0 1 2-2h13v2H6" />,
  bulb: (
    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 1 3.5 10.9c-.6.5-1 1.2-1 2V17h-5v-1.1c0-.8-.4-1.5-1-2A6 6 0 0 1 12 3z" />
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6M12 16.5v.5" />
    </>
  ),
  table: <path d="M4 4h16v16H4zM4 9h16M4 14.5h16M10 4v16" />,
  flag: <path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
  layers: <path d="M12 3 3 8l9 5 9-5zM3 12.5l9 5 9-5M3 17l9 5 9-5" />,
  sparkle: (
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
  ),
  doc: <path d="M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  play: <path d="M8 5v14l11-7z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.5-4.5" />
    </>
  ),
  back: <path d="M15 5 8 12l7 7" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  grid: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </>
  ),
  /* Гаечный ключ — «общие навыки»: инструменты для всех разделов. */
  tools: (
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z" />
  ),
};

export type PiktogrammaName = keyof typeof P;

export function Piktogramma({
  name,
  className,
  flip,
}: {
  name: string;
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      className={clsx('z11-pic', className)}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {flip ? (
        <g transform="translate(24 0) scale(-1 1)">{P[name] ?? P.flag}</g>
      ) : (
        (P[name] ?? P.flag)
      )}
    </svg>
  );
}

/** Значок раздела. */
export const ZNACHOK_RAZDELA: Record<SectionId, string> = {
  RZ: 'bolt',
  PR: 'percent',
  SM: 'flask',
  DP: 'car',
  PT: 'train',
  VD: 'ship',
  OK: 'cycle',
  RB: 'gear',
  PG: 'stairs',
};

/** Класс цвета раздела: задаёт --z11-c и --z11-c-soft (zadanie11.css). */
export function tsvetRazdela(section: SectionId): string {
  return `z11-sec--${section.toLowerCase()}`;
}

/** Кружок со значком раздела в цвете раздела. */
export function IkonkaRazdela({ section, className }: { section: SectionId; className?: string }) {
  return (
    <span className={clsx('z11-ikonka', tsvetRazdela(section), className)} aria-hidden="true">
      <Piktogramma name={ZNACHOK_RAZDELA[section]} />
    </span>
  );
}

/** Значок блока опорных задач: раздел или «общие навыки» (синий). */
export function IkonkaBloka({
  razdel,
  className,
}: {
  razdel: SectionId | 'OB';
  className?: string;
}) {
  if (razdel !== 'OB') {
    return <IkonkaRazdela section={razdel} className={className} />;
  }
  return (
    <span className={clsx('z11-ikonka', 'z11-sec--ob', className)} aria-hidden="true">
      <Piktogramma name="tools" />
    </span>
  );
}

/** Мини-иллюстрации типов задач: пиктограммы; «-flip» — отражённая. */
const SCENY: Record<string, string[]> = {
  'RZ-01': ['tag', 'coins'],
  'RZ-02': ['bike', 'gauge'],
  'RZ-03': ['plane', 'clock'],
  'RZ-04': ['bus', 'family'],
  'RZ-05': ['can', 'square'],
  'RZ-06': ['pill', 'clock'],
  'RZ-07': ['boat', 'gauge'],
  'RZ-08': ['balloon', 'coins'],
  'RZ-09': ['book', 'tag'],
  'RZ-10': ['tag', 'percent'],
  'RZ-11': ['coins', 'percent'],
  'RZ-12': ['family', 'percent'],
  'RZ-13': ['percent', 'chart'],
  'RZ-14': ['percent', 'uturn'],
  'RZ-15': ['percent', 'chart'],
  'RZ-16': ['square', 'percent'],
  'RZ-17': ['percent', 'uturn'],
  'RZ-18': ['book', 'clock'],
  'PR-01': ['coins', 'percent'],
  'PR-02': ['tag', 'chart'],
  'PR-03': ['chart', 'percent'],
  'PR-04': ['shirt', 'tag'],
  'PR-05': ['family', 'coins'],
  'PR-06': ['coins', 'clock'],
  'PR-07': ['car', 'clock'],
  'SM-01': ['flask', 'drop'],
  'SM-02': ['flask', 'flask'],
  'SM-03': ['flask', 'flask'],
  'SM-04': ['bars', 'bars'],
  'SM-05': ['bars'],
  'SM-06': ['grapes', 'arrow', 'drop'],
  'SM-07': ['flask', 'flask'],
  'SM-08': ['flask', 'drop', 'flask'],
  'DP-01': ['runner', 'gauge'],
  'DP-02': ['car', 'gauge'],
  'DP-03': ['car', 'gauge'],
  'DP-04': ['gauge', 'clock'],
  'DP-05': ['runner', 'hill'],
  'DP-06': ['car', 'arrow', 'car-flip'],
  'DP-07': ['bike', 'clock', 'uturn'],
  'DP-08': ['bike', 'bike'],
  'DP-09': ['car', 'bike'],
  'DP-10': ['car', 'uturn'],
  'DP-11': ['bike', 'arrow', 'car-flip'],
  'DP-12': ['car', 'car'],
  'DP-13': ['ship', 'ship'],
  'PT-01': ['train', 'tunnel'],
  'PT-02': ['train', 'arrow', 'train-flip'],
  'PT-03': ['train', 'train'],
  'PT-04': ['ship', 'ship'],
  'VD-01': ['ship', 'uturn'],
  'VD-02': ['ship', 'drop'],
  'VD-03': ['ship', 'drop'],
  'VD-04': ['boat', 'uturn'],
  'VD-05': ['boat', 'clock'],
  'VD-06': ['raft', 'boat'],
  'VD-07': ['boat', 'uturn'],
  'OK-01': ['ring', 'car'],
  'OK-02': ['ring', 'flag'],
  'OK-03': ['ring', 'bike'],
  'RB-01': ['gear', 'gear'],
  'RB-02': ['gear', 'clock'],
  'RB-03': ['pipe', 'pipe'],
  'RB-04': ['family', 'gear'],
  'RB-05': ['family', 'clock'],
  'RB-06': ['pipe', 'clock'],
  'RB-07': ['fence', 'family'],
  'PG-01': ['snail', 'stairs'],
};

export function MiniKartinka({
  id,
  section,
  className,
}: {
  id: string;
  section: SectionId;
  className?: string;
}) {
  const scena = SCENY[id] ?? [ZNACHOK_RAZDELA[section]];
  return (
    <span className={clsx('z11-mini', tsvetRazdela(section), className)} aria-hidden="true">
      {scena.map((name, i) => (
        <Piktogramma
          key={i}
          name={name.replace('-flip', '')}
          flip={name.endsWith('-flip')}
          className={name === 'arrow' || name === 'uturn' ? 'z11-pic--strelka' : undefined}
        />
      ))}
    </span>
  );
}

/** Звёзды сложности: только целые, ★ … ★★★. */
export function Zvezdy({ level, className }: { level: Level; className?: string }) {
  return (
    <span
      className={clsx('z11-zvezdy', className)}
      role="img"
      aria-label={`Сложность ${level} из 3`}
    >
      {[1, 2, 3].map((n) => (
        <svg
          key={n}
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={n <= level ? 'is-on' : undefined}
        >
          <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
        </svg>
      ))}
    </span>
  );
}

/** Есть ли у подтипа своя сцена (для автотеста). */
export function estScena(id: string): boolean {
  return id in SCENY;
}
