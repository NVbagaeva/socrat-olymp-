import { clsx } from 'clsx';

/**
 * Плитки исходов — метод 1, прямой пересчёт.
 *
 * Одна плитка — один исход. Ученик видит n и m как количество плиток,
 * а не как абстрактные числа.
 *
 * Компонент ничего не считает и не знает про конкретную задачу: что
 * нарисовать, целиком задают параметры.
 */

/** Состояние рисунка. Одно на весь компонент, приходит от карточки. */
export type RisunokState = 'default' | 'selected' | 'correct' | 'incorrect';

export interface OutcomeTilesProps {
  /** Подпись каждого исхода. Длина массива и есть n. */
  outcomes: readonly string[];
  /**
   * Индексы благоприятных исходов.
   *
   * Не передавать, пока ученик не ответил: подсвеченные плитки выдают
   * m, а значит и ответ. Карточка передаёт их вместе с решением.
   */
  favorable?: readonly number[];
  /** Группы одинаковых объектов: подпись и количество. */
  groups?: readonly { label: string; count: number }[];
  /** Строка «n = 12, m = 3» под сеткой. */
  showCounts?: boolean;
  /** Сколько плиток в ряду. */
  columns?: number;
  state?: RisunokState;
  /** Что прочитает скринридер вместо картинки. */
  alt?: string;
  className?: string;
}

/* Геометрия плитки в единицах viewBox. Ширина — не меньше W, но
   растёт под самую длинную подпись: «другая тема» в плитку на 64
   не влезает и вылезала за край. */
const W = 64;
const H = 44;
const GAP = 10;
const COUNTS_H = 30;
/** Ширина знака при кегле подписи — оценка сверху, на глаз не влияет. */
const ZNAK = 7.2;

export function OutcomeTiles({
  outcomes,
  favorable,
  groups,
  showCounts = false,
  columns = 6,
  state = 'default',
  alt,
  className,
}: OutcomeTilesProps) {
  const n = outcomes.length;
  const cols = Math.max(1, Math.min(columns, n));
  const rows = Math.ceil(n / cols);
  const blago = new Set(favorable ?? []);

  const dlinnaya = outcomes.reduce((max, s) => Math.max(max, s.length), 0);
  const w = Math.max(W, Math.round(dlinnaya * ZNAK) + 16);

  const width = cols * (w + GAP) - GAP;
  const height = rows * (H + GAP) - GAP + (showCounts ? COUNTS_H : 0);

  const podpis =
    alt ??
    `Плитки исходов: всего ${n}` +
      (favorable === undefined ? '' : `, благоприятных ${favorable.length}`);

  return (
    <svg
      className={clsx('pr-tiles', `pr-is-${state}`, className)}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={podpis}
    >
      {outcomes.map((label, i) => {
        const x = (i % cols) * (w + GAP);
        const y = Math.floor(i / cols) * (H + GAP);
        const est = blago.has(i);
        return (
          <g key={i} className={clsx('pr-tile', est && 'pr-tile--favorable')}>
            <rect x={x} y={y} width={w} height={H} rx="8" />
            <text x={x + w / 2} y={y + H / 2} textAnchor="middle" dominantBaseline="central">
              {label}
            </text>
          </g>
        );
      })}

      {/* Счёт под сеткой. Буквы математические — курсивная антиква,
          как во всех остальных обозначениях раздела. */}
      {showCounts ? (
        <text className="pr-counts" x="0" y={height - 8}>
          <tspan className="pr-math">n</tspan>
          {` = ${n}`}
          {favorable === undefined ? null : (
            <>
              {', '}
              <tspan className="pr-math">m</tspan>
              {` = ${favorable.length}`}
            </>
          )}
        </text>
      ) : null}

      {/* Группы в подписи к рисунку: их видно и без цвета, поэтому
          они уходят только в текст для скринридера. */}
      {groups === undefined ? null : (
        <desc>{groups.map((g) => `${g.label} — ${g.count}`).join(', ')}</desc>
      )}
    </svg>
  );
}
