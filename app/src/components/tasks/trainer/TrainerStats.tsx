'use client';

import { Button } from '@/components/ui';
import { trainerKindTitle, trainerStats } from '@/content/trainerModes';
import {
  resetTrainer,
  summarize,
  useTrainerProgress,
  type TrainerProgress,
} from '@/lib/trainerProgress';

export interface TrainerStatsProps {
  /** Сколько заданий всего есть в наборах: знаменатель счётчика. */
  total: number;
}

interface KindRow {
  title: string;
  done: number;
  right: number;
  accuracy: number | null;
}

/** «1 мин 24 с». Часы не нужны: столько одно задание не длится. */
function timeText(seconds: number | null): string {
  if (seconds === null) {
    return '—';
  }
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes === 0 ? `${rest} с` : `${minutes} мин ${rest} с`;
}

/* Абсцисса и ордината — один тип задания: их счётчики складываются. */
function kindRows(progress: TrainerProgress): KindRow[] {
  const rows: KindRow[] = [];
  Object.entries(progress.kinds).forEach(([kind, tally]) => {
    const title = trainerKindTitle[kind] ?? kind;
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

/** Тип с наименьшей точностью. Пока решено меньше трёх — не советуем. */
function weakest(rows: KindRow[]): KindRow | null {
  const solid = rows.filter((row) => row.done >= 3 && row.accuracy !== null);
  if (solid.length === 0) {
    return null;
  }
  return solid.reduce((worst, row) =>
    (row.accuracy ?? 100) < (worst.accuracy ?? 100) ? row : worst,
  );
}

/** Задание «12.C-04» → «Точка пересечения графиков · № 4». */
function mistakeText(id: string): string {
  const [set, no] = id.split('-');
  const title = trainerKindTitle[set ?? ''] ?? set ?? id;
  return `${title} · № ${Number(no ?? 0)}`;
}

/**
 * Что уже сделано в тренажёре.
 *
 * Счётчики приходят из хранилища браузера и обновляются сразу после
 * проверки: экран задания и эта сводка смотрят в одно и то же место.
 * До монтирования здесь нули — хранилище читается только в браузере.
 */
export function TrainerStats({ total }: TrainerStatsProps) {
  const progress = useTrainerProgress();
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
                    <span
                      className="tkind__fill"
                      style={{ width: `${row.accuracy ?? 0}%` }}
                    />
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
              <b>{trainerStats.advice}</b> {weak.title} — {trainerStats.adviceTail}{' '}
              {weak.accuracy}%.
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

          <Button variant="ghost" onClick={resetTrainer}>
            {trainerStats.reset}
          </Button>
        </>
      )}
    </section>
  );
}
