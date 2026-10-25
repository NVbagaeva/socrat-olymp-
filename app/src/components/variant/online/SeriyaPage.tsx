'use client';

import { clsx } from 'clsx';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ONLINE_TEXT as T } from '@/content/variantOnline/text';
import { browserStorage } from '@/lib/storage';
import { peekHead, sessionKey } from '@/lib/trainerSession/store';
import { printHref } from '@/lib/variant/handoff';
import { parseSeriya, proverkaHref, reshatHref, workScope } from '@/lib/variant/online/link';
import { loadSet, type LoadedSet } from '@/lib/variant/online/work';
import { kindTitle } from './WorkRun';
import { StatsView } from './StatsView';
import { useArchive } from './useArchive';

type CardStatus = 'none' | 'run' | 'done';

/** Есть ли незавершённая сессия варианта (запись оболочки тренажёров). */
function inProgress(scope: string): boolean {
  try {
    const raw = browserStorage()?.getItem(sessionKey(scope)) ?? null;
    return raw !== null && peekHead(raw) !== null;
  } catch {
    return false;
  }
}

/**
 * Страница серии для ученика: карточки «Вариант 1…N» со статусом —
 * не начат, в процессе, завершён с баллами — и статистика серии.
 * Статус — с этого устройства: незавершённые работы в сессиях
 * тренажёров, завершённые — в архиве (IndexedDB).
 */
export function SeriyaPage() {
  const query = useSearchParams();
  const parsed = useMemo(() => parseSeriya(new URLSearchParams(query.toString())), [query]);
  const [loaded, setLoaded] = useState<LoadedSet | null | 'loading'>('loading');
  const [running, setRunning] = useState<number[]>([]);
  const works = useArchive();

  useEffect(() => {
    if (parsed === null) return undefined;
    let alive = true;
    void loadSet(parsed.code).then((l) => {
      if (!alive) return;
      setLoaded(l);
      /* Незавершённые варианты — по записям сессий на этом устройстве. */
      const n = l?.set.variants.length ?? 0;
      setRunning(
        Array.from({ length: n }, (_, i) => i + 1).filter((v) =>
          inProgress(workScope(parsed.code, v, parsed.settings.mode)),
        ),
      );
    });
    return () => {
      alive = false;
    };
  }, [parsed]);

  if (parsed === null || loaded === null) return <p className="vo-warn">{T.start.bad}</p>;
  if (loaded === 'loading') {
    return (
      <p className="vo-status" role="status" aria-busy="true">
        {T.start.loading}
      </p>
    );
  }
  const { code, settings } = parsed;
  const count = loaded.set.variants.length;
  const title = kindTitle(settings.kind, settings.title);
  const mine = (works ?? []).filter((w) => w.code === code && w.mode === settings.mode);

  return (
    <div className="vo-series" data-testid="vo-series">
      <header className="vo-series__head">
        <h2 className="vo-start__title">{title}</h2>
        <p className="vo-start__meta">
          {T.seriya.lead(count)} · <b>{T.start.mode[settings.mode]}</b>
        </p>
        <p className="vo-note">{T.seriya.code(code)}</p>
        {loaded.outdated ? <p className="vo-warn">{T.start.outdated}</p> : null}
      </header>

      <ul className="vo-cards">
        {loaded.set.variants.map((v) => {
          const done = mine.filter((w) => w.variant === v.index);
          const last = done[done.length - 1];
          const status: CardStatus = running.includes(v.index)
            ? 'run'
            : last !== undefined
              ? 'done'
              : 'none';
          const href = `${reshatHref({ code, variant: v.index, ...settings })}&s=1`;
          return (
            <li key={v.index} className={clsx('vo-vcard', `is-${status}`)} data-status={status}>
              <p className="vo-vcard__title">{T.seriya.card(v.index)}</p>
              <p className="vo-vcard__status">
                {T.seriya.status[status]}
                {last !== undefined && status !== 'run' ? (
                  <b className="vo-vcard__score">
                    {last.test !== null ? `${last.test} · ` : ''}
                    {T.seriya.score(last.primary, last.max)}
                  </b>
                ) : null}
              </p>
              <div className="vo-vcard__actions">
                {status === 'done' && last !== undefined ? (
                  <>
                    <a
                      className="btn btn--secondary btn--sm"
                      href={`${proverkaHref(last.resultCode)}&moy=1`}
                    >
                      {T.seriya.open.done}
                    </a>
                    <a className="vo-link" href={href}>
                      {T.seriya.again}
                    </a>
                  </>
                ) : (
                  <a
                    className="btn btn--primary btn--sm"
                    href={href}
                    data-testid={`vo-card-${v.index}`}
                  >
                    {T.seriya.open[status]}
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="vo-series__print">
        <a className="vo-link" href={printHref('uchenik', code)} target="_blank" rel="noreferrer">
          {T.seriya.print}
        </a>
      </p>

      <section className="vo-series__stats">
        <h2 className="vo-h2">{T.seriya.stats}</h2>
        {works === null ? null : <StatsView works={mine} code={code} />}
      </section>
    </div>
  );
}
