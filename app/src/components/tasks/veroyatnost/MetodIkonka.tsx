import { clsx } from 'clsx';
import type { ReactElement } from 'react';
import type { Zadanie } from '@/content/veroyatnost';

/**
 * Значки методов заданий №4 и №5.
 *
 * У каждого метода один линейный значок на светлом кружке — тот же
 * на опорных задачах, в тренажёре, в генераторе и в сводке варианта.
 * Рисуются теми же средствами, что остальные значки проекта:
 * инлайновый SVG, поле 24×24, обводка currentColor, заливки нет
 * (у буквенных значков — буквы заливкой того же цвета). Цвет кружка
 * задаёт задание: №4 — синяя гамма, №5 — фиолетовая (токены
 * --color-metod-N в tokens.css).
 *
 * Ключ — идентификатор метода из lib/veroyatnost/metody4.ts и
 * metody5.ts: он же блок банка и навык тренажёра. Метод без своего
 * рисунка получает запасной значок (точка в кружке), а не пустое место.
 */

/* Общие атрибуты всех значков. */
const SVG = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: 'false',
} as const;

/* Буква в значке: заливка цветом линии, обводки нет. */
const BUKVA = {
  fill: 'currentColor',
  stroke: 'none',
  fontSize: 11,
  fontWeight: 700,
  fontFamily: 'inherit',
  textAnchor: 'middle',
} as const;

/** Буквы «A» и «Ā»: противоположные события в обоих заданиях. */
function protivopolozhnye(): ReactElement {
  return (
    <svg {...SVG}>
      <text x="7" y="16.5" {...BUKVA}>
        A
      </text>
      <text x="17" y="16.5" {...BUKVA}>
        A
      </text>
      <path d="M13.8 5.6h6.4" />
    </svg>
  );
}

const IKONKI_4: Record<string, () => ReactElement> = {
  /* Дробь: благоприятные над чертой, все исходы под ней. */
  klassicheskaya: () => (
    <svg {...SVG}>
      <circle cx="12" cy="6.4" r="1.7" fill="currentColor" stroke="none" />
      <path d="M5.5 12h13" />
      <circle cx="12" cy="17.6" r="1.7" fill="currentColor" stroke="none" />
    </svg>
  ),
  /* Игральная кость: пять точек. */
  kubiki: () => (
    <svg {...SVG}>
      <rect x="4" y="4" width="16" height="16" rx="3.5" />
      <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
  /* Монета: два круга, кант и поле. */
  monety: () => (
    <svg {...SVG}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5" />
      <path d="M12 9.5v5" />
    </svg>
  ),
  /* Круглый стол со стульями по четырём сторонам. */
  'kruglyy-stol': () => (
    <svg {...SVG}>
      <ellipse cx="12" cy="12.5" rx="6.2" ry="3.2" />
      <rect x="9.6" y="2.8" width="4.8" height="3.2" rx="1" />
      <rect x="9.6" y="18" width="4.8" height="3.2" rx="1" />
      <rect x="2.4" y="10.2" width="3.2" height="4.8" rx="1" />
      <rect x="18.4" y="10.2" width="3.2" height="4.8" rx="1" />
    </svg>
  ),
  protivopolozhnye,
  /* Отрезок с выделенным участком. */
  geometricheskoe: () => (
    <svg {...SVG}>
      <path d="M3 12h18" />
      <path d="M9 12h6" strokeWidth="4.2" />
      <circle cx="3.5" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="20.5" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  /* Столбчатая диаграмма: частоты наблюдений. */
  statisticheskoe: () => (
    <svg {...SVG}>
      <path d="M6.5 19.5v-6M12 19.5V8M17.5 19.5v-9" strokeWidth="2.6" />
      <path d="M3.5 19.5h17" />
    </svg>
  ),
};

const IKONKI_5: Record<string, () => ReactElement> = {
  /* Сложение несовместных: плюс. */
  nesovmestnye: () => (
    <svg {...SVG}>
      <path d="M12 5.5v13M5.5 12h13" strokeWidth="2.2" />
    </svg>
  ),
  protivopolozhnoe: protivopolozhnye,
  /* Координатная прямая: ось со стрелкой и отрезок на ней. */
  koordinatnaya: () => (
    <svg {...SVG}>
      <path d="M2.5 13h18" />
      <path d="M17.5 10l3 3-3 3" />
      <path d="M7.5 13h6" strokeWidth="4" />
      <path d="M7.5 9v4M13.5 9v4" />
    </svg>
  ),
  /* Совместные события: два пересекающихся круга. */
  sovmestnye: () => (
    <svg {...SVG}>
      <circle cx="9" cy="12" r="6" />
      <circle cx="15" cy="12" r="6" />
    </svg>
  ),
  /* Условная вероятность: A | B. */
  uslovnaya: () => (
    <svg {...SVG}>
      <text x="6.5" y="16.5" {...BUKVA}>
        A
      </text>
      <path d="M12 6v12" />
      <text x="17.5" y="16.5" {...BUKVA}>
        B
      </text>
    </svg>
  ),
  /* Умножение независимых: крест. */
  nezavisimye: () => (
    <svg {...SVG}>
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" strokeWidth="2.2" />
    </svg>
  ),
  /* «Хотя бы»: единица минус многоточие. */
  'hotya-by': () => (
    <svg {...SVG}>
      <text x="12" y="16" {...BUKVA} fontSize="10">
        1 − …
      </text>
    </svg>
  ),
  /* Два предмета из коробки: открытая коробка. */
  'dva-predmeta': () => (
    <svg {...SVG}>
      <path d="M4 9.5l8-3.5 8 3.5-8 3.5z" />
      <path d="M4 9.5V17l8 3.5 8-3.5V9.5" />
      <path d="M12 13v7.5" />
      <path d="M8 7.3l8 3.6" />
    </svg>
  ),
  /* Полная вероятность: дерево. */
  polnaya: () => (
    <svg {...SVG}>
      <path d="M12 4.5L6.5 12M12 4.5l5.5 7.5M6.5 12l-2.5 7.5M6.5 12l2.5 7.5M17.5 12l-2.5 7.5M17.5 12l2.5 7.5" />
      <circle cx="12" cy="4.2" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="6.5" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  /* До первого успеха: ступеньки с флажком. */
  'do-uspeha': () => (
    <svg {...SVG}>
      <path d="M3 20h4v-4h4v-4h4V8h4" />
      <path d="M19 8V3" />
      <path d="M19 3h3.5l-1.3 1.7 1.3 1.8H19z" fill="currentColor" stroke="none" />
    </svg>
  ),
};

/** Запасной значок: метод без своего рисунка. */
function zapasnoy(): ReactElement {
  return (
    <svg {...SVG}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Есть ли у метода свой значок. */
export function metodIkonkaEst(zadanie: Zadanie, metod: string): boolean {
  return (zadanie === 4 ? IKONKI_4 : IKONKI_5)[metod] !== undefined;
}

export interface MetodIkonkaProps {
  zadanie: Zadanie;
  /** Идентификатор метода: klassicheskaya, kubiki, … (metody4.ts, metody5.ts). */
  metod: string;
  /** Размер кружка: обычный 48px, крупный 72px, мелкий 28px. */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** Значок метода на светлом кружке. Декоративный: название метода стоит рядом текстом. */
export function MetodIkonka({ zadanie, metod, size = 'md', className }: MetodIkonkaProps) {
  const risunok = (zadanie === 4 ? IKONKI_4 : IKONKI_5)[metod] ?? zapasnoy;
  return (
    <span
      className={clsx('mikon', `mikon--${zadanie}`, `mikon--${size}`, className)}
      aria-hidden="true"
    >
      {risunok()}
    </span>
  );
}
