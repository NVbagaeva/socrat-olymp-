import { clsx } from 'clsx';
import type { CSSProperties } from 'react';
import type { OutcomeGridProps } from './OutcomeGrid';
import type { OutcomeTilesProps } from './OutcomeTiles';

/**
 * Таблица и плитки исходов для экрана — разметкой, а не SVG.
 *
 * SVG-версии (OutcomeGrid, OutcomeTiles) рисуют фиксированную картинку:
 * на телефоне её приходилось либо ужимать целиком (подписи в клетках
 * становились мелкими), либо прокручивать вбок — таблица 6×6 и ряд
 * плиток обрезались справа. Здесь ширина клеток считается от ширины
 * колонки (CSS grid, 1fr), кегль — от неё же (container queries, cqi),
 * плитки переносятся на новую строку, строка «n = …, m = …» рвётся по
 * запятой. Всё целиком влезает в 320 px без горизонтальной прокрутки.
 *
 * SVG-версии остаются для печатных листов (scripts/lib/sheet4-tasks.mjs)
 * и витрины — им нужен viewBox.
 */

type Schet = { n: string; m?: string };

/** «n = 36, m = 5» — куски не рвутся внутри, строка рвётся по запятой. */
function Schyot({ n, m }: Schet) {
  return (
    <p className="pr-f-counts">
      <span className="pr-f-counts__kusok">
        <i className="pr-math">n</i> = {n}
        {m === undefined ? '' : ','}
      </span>
      {m === undefined ? null : (
        <span className="pr-f-counts__kusok">
          <i className="pr-math">m</i> = {m}
        </span>
      )}
    </p>
  );
}

export function OutcomeGridFluid({
  rows,
  columns,
  rowLabels,
  columnLabels,
  rowTitle,
  columnTitle,
  cellContent,
  favorableCells,
  showCounts = false,
  blank = false,
  state = 'default',
  alt,
  className,
}: OutcomeGridProps) {
  const blago = new Set((favorableCells ?? []).map(([r, c]) => `${r}:${c}`));
  const metka = (spisok: readonly string[] | undefined, i: number): string =>
    spisok?.[i] ?? String(i + 1);
  const n = rows * columns;
  let dlinnaya = 1;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < columns; c += 1) {
      dlinnaya = Math.max(dlinnaya, cellContent(r, c).length);
    }
  }
  for (let c = 0; c < columns; c += 1) {
    dlinnaya = Math.max(dlinnaya, metka(columnLabels, c).length);
  }
  const est = rowTitle !== undefined;
  const sdvig = est ? 2 : 1;

  return (
    <div
      className={clsx('pr-f', `pr-is-${state}`, className)}
      /* Ширина по клеткам: 2×2 не раздувается во всю колонку, 6×6 на
         телефоне ужимается до неё (max-width: 100 %). */
      style={{
        width: `${Math.min(30, (columns + (est ? 2 : 1)) * Math.max(3, dlinnaya * 0.8 + 1.2))}rem`,
      }}
      role="img"
      aria-label={
        alt ??
        `Таблица исходов ${rows} на ${columns}: всего ${n}` +
          (favorableCells === undefined ? '' : `, благоприятных ${favorableCells.length}`)
      }
    >
      <div
        className={clsx('pr-f-grid', dlinnaya > 3 && 'pr-f-grid--dlinnye')}
        style={{
          gridTemplateColumns: `${est ? 'auto ' : ''}auto repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {columnTitle === undefined ? null : (
          <span
            className="pr-f-grid__os pr-f-grid__os--stolbcy"
            style={{ gridColumn: `${sdvig + 1} / span ${columns}`, gridRow: 1 }}
          >
            {columnTitle}
          </span>
        )}
        {est ? (
          <span
            className="pr-f-grid__os pr-f-grid__os--stroki"
            style={{ gridColumn: 1, gridRow: `3 / span ${rows}` }}
          >
            {rowTitle}
          </span>
        ) : null}
        {Array.from({ length: columns }, (_, c) => (
          <span
            key={`c${c}`}
            className="pr-f-grid__shapka"
            style={{ gridColumn: sdvig + 1 + c, gridRow: 2 }}
          >
            {metka(columnLabels, c)}
          </span>
        ))}
        {Array.from({ length: rows }, (_, r) => (
          <span
            key={`r${r}`}
            className="pr-f-grid__shapka pr-f-grid__shapka--stroka"
            style={{ gridColumn: sdvig, gridRow: 3 + r }}
          >
            {metka(rowLabels, r)}
          </span>
        ))}
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: columns }, (_, c) => (
            <span
              key={`${r}:${c}`}
              className={clsx('pr-f-grid__kletka', blago.has(`${r}:${c}`) && 'is-blago')}
              style={{ gridColumn: sdvig + 1 + c, gridRow: 3 + r }}
            >
              {blank ? '' : cellContent(r, c)}
            </span>
          )),
        )}
      </div>
      {showCounts && !blank ? (
        <Schyot
          n={`${rows} · ${columns} = ${n}`}
          {...(favorableCells === undefined ? {} : { m: String(favorableCells.length) })}
        />
      ) : null}
    </div>
  );
}

export function OutcomeTilesFluid({
  outcomes,
  favorable,
  counts,
  groups,
  showCounts = false,
  columns = 6,
  blank = false,
  state = 'default',
  alt,
  className,
}: OutcomeTilesProps) {
  const kolichestva = counts ?? outcomes.map(() => 1);
  const n = kolichestva.reduce((s, c) => s + c, 0);
  const m = (favorable ?? []).reduce((s, i) => s + (kolichestva[i] ?? 0), 0);
  const cols = Math.max(1, Math.min(columns, outcomes.length));
  const blago = new Set(favorable ?? []);

  const polnaya = (label: string, i: number): string =>
    counts === undefined ? label : `${label} ×${counts[i] ?? 0}`;
  /* Самое длинное слово подписи: плитка не уже него, поэтому слово
     не режется («ост…»), а длинная подпись переносится по словам. */
  const slovo = outcomes.reduce(
    (max, s, i) =>
      Math.max(
        max,
        ...polnaya(s, i)
          .split(/\s+/)
          .map((w) => w.length),
      ),
    1,
  );

  const podpis =
    alt ??
    `Плитки исходов: всего ${n}` +
      (favorable === undefined ? '' : `, благоприятных ${m}`) +
      (groups === undefined || blank
        ? ''
        : `. ${groups.map((g) => `${g.label} — ${g.count}`).join(', ')}`);

  return (
    <div
      className={clsx('pr-f', `pr-is-${state}`, className)}
      style={{
        width: `${Math.min(36, cols * Math.max(4.5, slovo * 0.62 + 1.6) + (cols - 1) * 0.6)}rem`,
      }}
      role="img"
      aria-label={podpis}
    >
      <ul
        className="pr-f-tiles"
        style={
          {
            '--pr-cols': cols,
            '--pr-slovo': slovo,
          } as CSSProperties
        }
      >
        {outcomes.map((label, i) => (
          <li key={i} className={clsx('pr-f-tile', blago.has(i) && 'is-blago')}>
            {blank ? label : polnaya(label, i)}
          </li>
        ))}
      </ul>
      {showCounts && !blank ? (
        <Schyot n={String(n)} {...(favorable === undefined ? {} : { m: String(m) })} />
      ) : null}
    </div>
  );
}
