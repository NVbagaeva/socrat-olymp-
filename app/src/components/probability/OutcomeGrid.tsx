import { clsx } from 'clsx';
import type { RisunokState } from './OutcomeTiles';

/**
 * Таблица исходов n×n — метод 2.
 *
 * Строки — исходы первого объекта, столбцы — второго, клетка — пара.
 * Благоприятные клетки подсвечены, и m считается прямо по ним.
 */

export interface OutcomeGridProps {
  rows: number;
  columns: number;
  /** Подписи строк и столбцов. Короче массив — недостающие по номеру. */
  rowLabels?: readonly string[];
  columnLabels?: readonly string[];
  /** Заголовки осей: «1-й кубик», «2-й кубик». */
  rowTitle?: string;
  columnTitle?: string;
  /** Что стоит в клетке: сумма, произведение, совпадение. */
  cellContent: (row: number, column: number) => string;
  /**
   * Благоприятные клетки парами (строка; столбец), нумерация с нуля.
   * Как и у плиток — только вместе с решением: подсветка выдаёт m.
   */
  favorableCells?: readonly (readonly [number, number])[];
  /** Клетка под курсором или выбранная учеником. */
  selectedCell?: readonly [number, number];
  /** Клик по клетке отмечает её. Передан — клетки становятся кнопками. */
  onCellClick?: (row: number, column: number) => void;
  showCounts?: boolean;
  /**
   * Заготовка: клетки пустые, без сумм и пар — ученик заполняет их
   * сам. Размер клеток считается по содержимому, как и с числами.
   */
  blank?: boolean;
  state?: RisunokState;
  alt?: string;
  className?: string;
}

const CELL = 46;
const HEAD = 34;
const TITLE = 26;
/* Колонка под повёрнутый заголовок строк: у него своя ширина,
   иначе он наезжает на подписи строк. */
const TITLE_ROW = 34;
const COUNTS_H = 30;
/** Ширина знака при кегле подписи — оценка сверху. */
const ZNAK = 7.2;

export function OutcomeGrid({
  rows,
  columns,
  rowLabels,
  columnLabels,
  rowTitle,
  columnTitle,
  cellContent,
  favorableCells,
  selectedCell,
  onCellClick,
  showCounts = false,
  blank = false,
  state = 'default',
  alt,
  className,
}: OutcomeGridProps) {
  const blago = new Set((favorableCells ?? []).map(([r, c]) => `${r}:${c}`));
  const vybrana = selectedCell === undefined ? '' : `${selectedCell[0]}:${selectedCell[1]}`;

  const metka = (spisok: readonly string[] | undefined, i: number): string =>
    spisok?.[i] ?? String(i + 1);

  /* Клетка и шапка растут под самую длинную подпись: «решка» в клетку
     на 46 и в шапку на 34 не помещается и налезала на соседнюю. */
  const dlina = (s: string): number => s.length;
  let dlinnaya = 0;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < columns; c += 1) {
      dlinnaya = Math.max(dlinnaya, dlina(cellContent(r, c)));
    }
  }
  for (let c = 0; c < columns; c += 1) {
    dlinnaya = Math.max(dlinnaya, dlina(metka(columnLabels, c)));
  }
  let dlinnayaStroka = 0;
  for (let r = 0; r < rows; r += 1) {
    dlinnayaStroka = Math.max(dlinnayaStroka, dlina(metka(rowLabels, r)));
  }

  const cellW = Math.max(CELL, Math.round(dlinnaya * ZNAK) + 14);
  const head = Math.max(HEAD, Math.round(dlinnayaStroka * ZNAK) + 12);

  const left = TITLE_ROW + head;
  const top = TITLE + HEAD;
  const width = left + columns * cellW;
  const height = top + rows * CELL + (showCounts ? COUNTS_H : 0);
  const n = rows * columns;

  return (
    <svg
      className={clsx('pr-grid', `pr-is-${state}`, className)}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={
        alt ??
        `Таблица исходов ${rows} на ${columns}: всего ${n}` +
          (favorableCells === undefined ? '' : `, благоприятных ${favorableCells.length}`)
      }
    >
      {/* Заголовки осей */}
      {columnTitle === undefined ? null : (
        <text
          className="pr-axis"
          x={left + (columns * cellW) / 2}
          y={TITLE - 10}
          textAnchor="middle"
        >
          {columnTitle}
        </text>
      )}
      {rowTitle === undefined ? null : (
        <text
          className="pr-axis"
          x={14}
          y={top + (rows * CELL) / 2}
          textAnchor="middle"
          transform={`rotate(-90 14 ${top + (rows * CELL) / 2})`}
        >
          {rowTitle}
        </text>
      )}

      {/* Шапка столбцов */}
      {Array.from({ length: columns }, (_, c) => (
        <text
          key={`c${c}`}
          className="pr-head"
          x={left + c * cellW + cellW / 2}
          y={top - 12}
          textAnchor="middle"
        >
          {metka(columnLabels, c)}
        </text>
      ))}
      {/* Шапка строк */}
      {Array.from({ length: rows }, (_, r) => (
        <text
          key={`r${r}`}
          className="pr-head"
          x={left - 12}
          y={top + r * CELL + CELL / 2}
          textAnchor="end"
          dominantBaseline="central"
        >
          {metka(rowLabels, r)}
        </text>
      ))}

      {/* Клетки */}
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: columns }, (_, c) => {
          const klyuch = `${r}:${c}`;
          const x = left + c * cellW;
          const y = top + r * CELL;
          /* Клетка становится кнопкой только когда обработчик передан:
             иначе это картинка, и лишний tabindex мешал бы обходу. */
          const klik = onCellClick;
          return (
            <g
              key={klyuch}
              className={clsx(
                'pr-cell',
                blago.has(klyuch) && 'pr-cell--favorable',
                vybrana === klyuch && 'pr-cell--selected',
                klik !== undefined && 'pr-cell--interactive',
              )}
              {...(klik === undefined
                ? {}
                : {
                    role: 'button',
                    tabIndex: 0,
                    onClick: () => klik(r, c),
                    onKeyDown: (event: React.KeyboardEvent) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        klik(r, c);
                      }
                    },
                  })}
            >
              <rect x={x} y={y} width={cellW} height={CELL} />
              {blank ? null : (
                <text
                  x={x + cellW / 2}
                  y={y + CELL / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {cellContent(r, c)}
                </text>
              )}
            </g>
          );
        }),
      )}

      {showCounts && !blank ? (
        <text className="pr-counts" x="0" y={height - 8}>
          <tspan className="pr-math">n</tspan>
          {` = ${rows} · ${columns} = ${n}`}
          {favorableCells === undefined ? null : (
            <>
              {', '}
              <tspan className="pr-math">m</tspan>
              {` = ${favorableCells.length}`}
            </>
          )}
        </text>
      ) : null}
    </svg>
  );
}
