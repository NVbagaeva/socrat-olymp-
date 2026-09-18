'use client';

import { Button } from '@/components/ui';
import type { Pool } from '@/lib/zadanie3/pool';
import { type Z3Progress, resetZ3, summarize, weakestKind } from '@/lib/zadanie3/progress';

export interface Solid3StatsProps {
  pool: Pool;
  progress: Z3Progress;
  /** Открыть повторение ошибок. null — ошибок нет. */
  onRepeat: (() => void) | null;
  /** Перейти к типу, который советуем повторить. */
  onGoKind: (id: string) => void;
}

function minutes(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} с`;
  }
  return `${Math.floor(seconds / 60)} мин ${seconds % 60} с`;
}

/**
 * Итог работы в тренажёре: сводка, таблица по типам и совет.
 *
 * Считается по хранилищу браузера, поэтому обновляется сразу после
 * каждого закрытого задания — отдельного «обновить» не нужно.
 */
export function Solid3Stats({ pool, progress, onRepeat, onGoKind }: Solid3StatsProps) {
  const total = summarize(progress);
  const weakest = weakestKind(progress);
  const weakTitle = pool.kinds.find((kind) => kind.id === weakest)?.title ?? null;
  const rows = pool.kinds
    .map((kind) => ({ kind, tally: progress.kinds[kind.id] }))
    .filter((row) => row.tally !== undefined && row.tally.done > 0);

  return (
    <section className="z3t-stats">
      <h3 className="z3t-stats__title">Статистика</h3>

      <ul className="z3t-stats__grid">
        <li>
          <span className="z3t-stats__num">
            {pool.kinds.reduce((s, k) => s + k.variants.length, 0)}
          </span>
          <span className="z3t-stats__cap">всего заданий</span>
        </li>
        <li>
          <span className="z3t-stats__num">{total.done}</span>
          <span className="z3t-stats__cap">решено</span>
        </li>
        <li>
          <span className="z3t-stats__num z3t-stats__num--right">{total.right}</span>
          <span className="z3t-stats__cap">верно с первой попытки</span>
        </li>
        <li>
          <span className="z3t-stats__num z3t-stats__num--wrong">{total.wrong}</span>
          <span className="z3t-stats__cap">с ошибкой</span>
        </li>
        <li>
          <span className="z3t-stats__num">
            {total.accuracy === null ? '—' : `${total.accuracy}%`}
          </span>
          <span className="z3t-stats__cap">точность</span>
        </li>
        <li>
          <span className="z3t-stats__num">
            {total.average === null ? '—' : minutes(total.average)}
          </span>
          <span className="z3t-stats__cap">среднее время</span>
        </li>
      </ul>

      {weakest !== null && weakTitle !== null ? (
        <p className="z3t-stats__advice">
          Рекомендуем повторить: <b>{weakTitle}</b>{' '}
          <button type="button" className="z3t-link" onClick={() => onGoKind(weakest)}>
            перейти
          </button>
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className="z3t-stats__empty">
          Пока ничего не решено — таблица заполнится после первых заданий.
        </p>
      ) : (
        <div className="z3t-stats__table-wrap">
          <table className="z3t-stats__table">
            <thead>
              <tr>
                <th>Тип задания</th>
                <th>Решено</th>
                <th>Верно</th>
                <th>Точность</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ kind, tally }) => {
                const done = tally?.done ?? 0;
                const right = tally?.right ?? 0;
                return (
                  <tr key={kind.id}>
                    <td>{kind.title}</td>
                    <td>{done}</td>
                    <td>{right}</td>
                    <td>{done === 0 ? '—' : `${Math.round((right / done) * 100)}%`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="z3t-stats__actions">
        {onRepeat === null ? null : (
          <Button variant="ghost" onClick={onRepeat}>
            Повторение ошибок ({progress.mistakes.length})
          </Button>
        )}
        {/* Сбрасывает только счёт стереометрии: у задания №12 свой ключ. */}
        <Button variant="ghost" onClick={resetZ3}>
          Сбросить
        </Button>
      </div>
    </section>
  );
}
