'use client';

import { Button } from '@/components/ui';
import { trainerStats } from '@/content/trainerModes';
import { summarize, type TrainerProgress } from '@/lib/trainerProgress';
import { progress2 } from '@/lib/vektory/progress';
import { kindTitle } from '@/lib/vektory/session';

interface KindRow {
  title: string;
  done: number;
  right: number;
  accuracy: number | null;
}

function timeText(seconds: number | null): string {
  if (seconds === null) {
    return '—';
  }
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes === 0 ? `${rest} с` : `${minutes} мин ${rest} с`;
}

function kindRows(progress: TrainerProgress): KindRow[] {
  return Object.entries(progress.kinds).map(([kind, tally]) => ({
    title: kindTitle(kind),
    done: tally.done,
    right: tally.right,
    accuracy: tally.done === 0 ? null : Math.round((tally.right / tally.done) * 100),
  }));
}

function weakest(rows: KindRow[]): KindRow | null {
  const solid = rows.filter((row) => row.done >= 3 && row.accuracy !== null && row.accuracy < 100);
  if (solid.length === 0) {
    return null;
  }
  return solid.reduce((worst, row) =>
    (row.accuracy ?? 100) < (worst.accuracy ?? 100) ? row : worst,
  );
}

/** Задача «A6|seed» → «A6 · Длина по рисунку: два вектора». */
function mistakeText(id: string): string {
  return kindTitle(id.split('|')[0] ?? id);
}

/** Что уже сделано в тренажёре №2: счётчики из хранилища браузера. */
export function Trenazher2Stats({ total }: { total: number }) {
  const progress = progress2.useProgress();
  const sum = summarize(progress);
  const rows = kindRows(progress);
  const weak = weakest(rows);

  return (
    <section className="tstats">
      <p className="tstats__counter">
        <b>{sum.done}</b> из {total} заданий
      </p>

      {sum.done === 0 ? (
        <p className="tstats__empty">{trainerStats.empty}</p>
      ) : (
        <>
          <dl className="tstats__rows">
            <div className="tstats__row">
              <dt>{trainerStats.rows.total}</dt>
              <dd>{total}</dd>
            </div>
            <div className="tstats__row">
              <dt>{trainerStats.rows.done}</dt>
              <dd>{sum.done}</dd>
            </div>
            <div className="tstats__row">
              <dt>{trainerStats.rows.right}</dt>
              <dd>{sum.right}</dd>
            </div>
            <div className="tstats__row">
              <dt>{trainerStats.rows.wrong}</dt>
              <dd>{sum.wrong}</dd>
            </div>
            <div className="tstats__row">
              <dt>{trainerStats.rows.accuracy}</dt>
              <dd>{sum.accuracy === null ? '—' : `${sum.accuracy}%`}</dd>
            </div>
            <div className="tstats__row">
              <dt>{trainerStats.rows.average}</dt>
              <dd>{timeText(sum.averageSeconds)}</dd>
            </div>
          </dl>

          <section className="tstats__kinds">
            <h3 className="tstats__title">{trainerStats.kinds}</h3>
            <ul className="tstats__list">
              {rows.map((row) => (
                <li className="tkind" key={row.title}>
                  <span className="tkind__name">{row.title}</span>
                  <span className="tkind__bar">
                    <span className="tkind__fill" style={{ width: `${row.accuracy ?? 0}%` }} />
                  </span>
                  <span className="tkind__score">
                    {row.right}/{row.done}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {weak === null ? null : (
            <p className="tstats__advice">
              <b>{trainerStats.advice}</b> {weak.title} — {trainerStats.adviceTail} {weak.accuracy}
              %.
            </p>
          )}

          {progress.mistakes.length === 0 ? null : (
            <section className="tstats__kinds">
              <h3 className="tstats__title">{trainerStats.mistakes}</h3>
              <ul className="tstats__mistakes">
                {progress.mistakes.map((id) => (
                  <li key={id}>{mistakeText(id)}</li>
                ))}
              </ul>
            </section>
          )}

          <Button variant="ghost" onClick={() => progress2.reset()}>
            {trainerStats.reset}
          </Button>
        </>
      )}
    </section>
  );
}
