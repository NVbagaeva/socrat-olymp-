'use client';

import { clsx } from 'clsx';
import { kindStats, type KindStats, type ProgressLog } from '@/lib/progressLog';
import './progress.css';

export interface TypeGroup {
  /** Идентификатор группы (у №8 — навык S1…S11). */
  id: string;
  title: string;
  /** Типы журнала внутри группы (у №8 — прототипы); название уже набрано KaTeX. */
  kinds: { id: string; titleHtml: string }[];
  /** Сколько задач банка в группе: шкала полосы, пока решено меньше. */
  capacity: number;
}

const EMPTY: KindStats = {
  kind: '',
  done: 0,
  right: 0,
  mistakes: 0,
  hinted: 0,
  seconds: 0,
  lastAt: 0,
  recent: [],
  repeat: false,
};

/** Полоса: верно и ошибки от шкалы (банк группы или решённое, если больше). */
function Bar({ stats, capacity }: { stats: KindStats; capacity: number }) {
  const scale = Math.max(stats.done, capacity, 1);
  return (
    <span className="tp-bar" aria-hidden="true">
      <span className="tp-bar__right" style={{ width: `${(stats.right / scale) * 100}%` }} />
      <span className="tp-bar__wrong" style={{ width: `${(stats.mistakes / scale) * 100}%` }} />
    </span>
  );
}

function Numbers({ stats }: { stats: KindStats }) {
  return (
    <p className="tp-card__nums">
      <span>
        решено <b>{stats.done}</b>
      </span>
      <span className="tp-card__right">
        верно <b>{stats.right}</b>
      </span>
      <span className="tp-card__wrong">
        ошибки <b>{stats.mistakes}</b>
      </span>
    </p>
  );
}

/**
 * Карточки типов с полосой «решено / верно / ошибки» и меткой «Стоит
 * повторить» — когда в последних пяти задачах типа две ошибки и больше.
 * Общий блок: раздел передаёт свои группы и журнал попыток.
 *
 * compact — для «О задании»: без списка типов внутри карточки.
 */
export function TypeCards({
  groups,
  log,
  compact = false,
  hideEmpty = false,
  label,
}: {
  groups: TypeGroup[];
  log: ProgressLog;
  compact?: boolean;
  /** Не показывать карточки нерешённых типов — только строкой под карточками. */
  hideEmpty?: boolean;
  /** Подпись списка для скринридера. */
  label: string;
}) {
  const groupOf = new Map(groups.flatMap((g) => g.kinds.map((k) => [k.id, g.id] as const)));
  const byGroup = kindStats(log, (kind) => groupOf.get(kind) ?? kind);
  const byKind = kindStats(log);
  const shown = hideEmpty ? groups.filter((g) => (byGroup.get(g.id)?.done ?? 0) > 0) : groups;
  const hidden = groups.filter((g) => !shown.includes(g));
  return (
    <>
      <ul className={clsx('tp-cards', compact && 'tp-cards--compact')} aria-label={label}>
        {shown.map((group) => {
          const stats = byGroup.get(group.id) ?? EMPTY;
          return (
            <li
              key={group.id}
              className={clsx('tp-card', stats.repeat && 'is-repeat')}
              data-group={group.id}
            >
              <div className="tp-card__head">
                <h4 className="tp-card__title">{group.title}</h4>
                {stats.repeat ? <span className="tp-card__flag">Стоит повторить</span> : null}
              </div>
              <Bar stats={stats} capacity={group.capacity} />
              {stats.done === 0 ? (
                <p className="tp-card__nums tp-card__nums--empty">Ещё не решали</p>
              ) : (
                <Numbers stats={stats} />
              )}
              {compact || stats.done === 0 ? null : (
                <ul className="tp-card__kinds">
                  {group.kinds.map((kind) => {
                    const k = byKind.get(kind.id) ?? EMPTY;
                    return (
                      <li key={kind.id} className={clsx('tp-kind', k.repeat && 'is-repeat')}>
                        <span
                          className="tp-kind__title"
                          dangerouslySetInnerHTML={{ __html: kind.titleHtml }}
                        />
                        <span className="tp-kind__score">
                          {k.done === 0 ? '—' : `${k.right} из ${k.done}`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
      {hidden.length === 0 ? null : (
        <p className="tp-hidden">Ещё не решали: {hidden.map((g) => g.title).join(', ')}.</p>
      )}
    </>
  );
}
