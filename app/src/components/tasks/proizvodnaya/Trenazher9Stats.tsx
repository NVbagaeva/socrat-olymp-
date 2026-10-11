'use client';

import { Button } from '@/components/ui';
import { trainerStats } from '@/content/trainerModes';
import { progress9 } from '@/lib/proizvodnaya/progress';
import { isOpenId, kindTitle } from '@/lib/proizvodnaya/session';
import { summarize, type TrainerProgress } from '@/lib/trainerProgress';

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

/* Прототипы одной группы идут одной строкой. */
function kindRows(progress: TrainerProgress): KindRow[] {
  const rows: KindRow[] = [];
  Object.entries(progress.kinds).forEach(([kind, tally]) => {
    const title = kindTitle(kind);
    const found = rows.find((row) => row.title === title);
    const row = found ?? { title, done: 0, right: 0, accuracy: null };
    if (found === undefined) {
      rows.push(row);
    }
    row.done += tally.done;
    row.right += tally.right;
  });
  return rows.map((row) => ({
    ...row,
    accuracy: row.done === 0 ? null : Math.round((row.right / row.done) * 100),
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

/** Задача «9.2.1|seed» → «Касательная · 9.2.1». */
function mistakeText(id: string): string {
  const prototype = id.split('|')[0] ?? id;
  const source = isOpenId(id) ? ' (открытый банк)' : '';
  return `${kindTitle(prototype)} · ${prototype}${source}`;
}

/** Что уже сделано в тренажёре №9: счётчики из хранилища браузера. */
export function Trenazher9Stats() {
  const progress = progress9.useProgress();
  const sum = summarize(progress);
  const rows = kindRows(progress);
  const weak = weakest(rows);

  return (
    <section className="tstats">
      <p className="tstats__counter">
        Решено заданий: <b>{sum.done}</b>
      </p>

      {sum.done === 0 ? (
        <p className="tstats__empty">{trainerStats.empty}</p>
      ) : (
        <>
          <dl className="tstats__rows">
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

          <Button variant="ghost" onClick={() => progress9.reset()}>
            {trainerStats.reset}
          </Button>
        </>
      )}
    </section>
  );
}
