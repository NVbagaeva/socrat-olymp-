'use client';

import { clsx } from 'clsx';
import { useMemo, useState } from 'react';
import { StatsView } from '@/components/variant/online/StatsView';
import { useArchive } from '@/components/variant/online/useArchive';
import { POV_SCREEN as T } from '@/content/povyshennye';
import { GOTOVY } from '@/lib/povyshennye/dannye';
import { povKod, povNomer, versiyaText } from '@/lib/povyshennye/kod';
import { VARIANTOV, VERSIY } from '@/lib/povyshennye/types';
import { useActiveTrainerScopes } from '@/lib/trainerSession/store';
import { PRINT_PATH } from '@/lib/variant/handoff';
import type { ArchivedWork } from '@/lib/variant/online/archive';
import { reshatHref, workScope, type Mode } from '@/lib/variant/online/link';
import './povyshennye.css';

type Filtr = 'all' | 'nereshennye' | 'oshibki';
type Status = 'new' | 'progress' | 'done';

interface Sostoyanie {
  status: Status;
  /** Последняя завершённая попытка версии. */
  last: ArchivedWork | null;
}

const LISTY = ['uchenik', 'uchitel', 'razbor'] as const;

/** Таймер режима «Как на ЕГЭ» для части 1, минуты. */
const MINUT_KONTROL = 90;

function printHref(k: number, v: number, list: (typeof LISTY)[number]): string {
  const q = new URLSearchParams({ kod: povKod(k), v: String(v), list });
  return `${PRINT_PATH}?${q.toString()}`;
}

/**
 * Экран раздела: сетка 36 вариантов, в карточке — шесть версий кнопками
 * со статусом и баллами, печать трёх листов версии и статистика раздела.
 *
 * Решение версии — общий онлайн-режим «Собрать вариант» (/variant/reshat/
 * с кодом раздела PV-07): лента номеров, клавиатура, режимы, пауза,
 * итоги, работа над ошибками и шкала — те же. Статус и баллы берутся из
 * его архива завершённых работ и записей незавершённых сессий.
 */
export function PovScreen() {
  const works = useArchive();
  const active = useActiveTrainerScopes();
  const [filtr, setFiltr] = useState<Filtr>('all');
  const [mode, setMode] = useState<Mode>('trening');
  const [pechat, setPechat] = useState<number | null>(null);

  const nashi = useMemo(() => (works ?? []).filter((w) => povNomer(w.code) !== null), [works]);

  const sostoyanie = (k: number, v: number): Sostoyanie => {
    const code = povKod(k);
    const done = nashi
      .filter((w) => w.code === code && w.variant === v)
      .sort((a, b) => b.finishedAt - a.finishedAt);
    const idet = (['trening', 'kontrol'] as const).some((m) =>
      active.includes(workScope(code, v, m)),
    );
    const last = done[0] ?? null;
    return { status: idet ? 'progress' : last !== null ? 'done' : 'new', last };
  };

  const pokazat = (s: Sostoyanie): boolean => {
    if (filtr === 'nereshennye') return s.status !== 'done';
    if (filtr === 'oshibki') return s.last !== null && s.last.primary < s.last.max;
    return true;
  };

  const kartochki = Array.from({ length: VARIANTOV }, (_, i) => i + 1).map((k) => {
    const gotov = GOTOVY.includes(k);
    const versii = Array.from({ length: VERSIY }, (_, i) => i + 1).map((v) => ({
      v,
      s: gotov ? sostoyanie(k, v) : ({ status: 'new', last: null } as Sostoyanie),
    }));
    return { k, gotov, versii };
  });
  const vidimye = kartochki.filter(
    (c) => filtr === 'all' || (c.gotov && c.versii.some((x) => pokazat(x.s))),
  );

  return (
    <div className="pov">
      <p className="pov-part">{T.part1}</p>

      <div className="pov-controls">
        <div className="pov-seg" role="radiogroup" aria-label={T.filter.label}>
          <span className="pov-seg__label">{T.filter.label}</span>
          {(['all', 'nereshennye', 'oshibki'] as const).map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={filtr === f}
              className={clsx('pov-seg__btn', filtr === f && 'is-on')}
              onClick={() => setFiltr(f)}
            >
              {T.filter[f]}
            </button>
          ))}
        </div>
        <div className="pov-seg" role="radiogroup" aria-label={T.mode.label}>
          <span className="pov-seg__label">{T.mode.label}</span>
          {(['trening', 'kontrol'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              className={clsx('pov-seg__btn', mode === m && 'is-on')}
              onClick={() => setMode(m)}
            >
              {T.mode[m]}
            </button>
          ))}
        </div>
      </div>
      <p className="pov-note">{mode === 'trening' ? T.mode.trenNote : T.mode.kontrolNote}</p>
      <p className="pov-note pov-note--legend">{T.legend}</p>

      {vidimye.length === 0 ? (
        <p className="pov-empty">{filtr === 'oshibki' ? T.empty.oshibki : T.empty.nereshennye}</p>
      ) : (
        <ul className="pov-grid" data-testid="pov-grid">
          {vidimye.map((c) => {
            const resheno = c.versii.filter((x) => x.s.status === 'done').length;
            return (
              <li
                key={c.k}
                className={clsx('pov-card', !c.gotov && 'is-soon')}
                data-testid={`pov-card-${c.k}`}
              >
                <header className="pov-card__head">
                  <h2 className="pov-card__title">{T.card.title(c.k)}</h2>
                  <span className="pov-card__meta">
                    {c.gotov ? T.card.done(resheno) : T.card.soon}
                  </span>
                </header>
                {c.gotov ? (
                  <>
                    <ol className="pov-versii" aria-label={T.card.versii}>
                      {c.versii
                        .filter((x) => filtr === 'all' || pokazat(x.s))
                        .map(({ v, s }) => {
                          const kv = versiyaText(c.k, v);
                          const href = reshatHref({
                            code: povKod(c.k),
                            variant: v,
                            mode,
                            timer:
                              mode === 'kontrol'
                                ? { kind: 'down', minutes: MINUT_KONTROL }
                                : { kind: 'none' },
                            kind: 'ege',
                            title: '',
                          });
                          return (
                            <li key={v}>
                              <a
                                className={clsx('pov-v', `is-${s.status}`)}
                                href={href}
                                data-testid={`pov-v-${kv}`}
                                aria-label={`${kv}: ${T.status[s.status]}${s.last === null ? '' : `, ${T.score(s.last.primary, s.last.max, s.last.test)}`}`}
                              >
                                <span className="pov-v__no">{kv}</span>
                                <span className="pov-v__status">{T.status[s.status]}</span>
                                <span className="pov-v__score" title={T.scoreTitle}>
                                  {s.last === null
                                    ? '—'
                                    : T.score(s.last.primary, s.last.max, s.last.test)}
                                </span>
                              </a>
                            </li>
                          );
                        })}
                    </ol>
                    <div className="pov-print">
                      <button
                        type="button"
                        className="pov-print__toggle"
                        aria-expanded={pechat === c.k}
                        onClick={() => setPechat(pechat === c.k ? null : c.k)}
                      >
                        {T.card.print}
                      </button>
                      {pechat === c.k ? (
                        <table className="pov-print__table">
                          <tbody>
                            {c.versii.map(({ v }) => (
                              <tr key={v}>
                                <th scope="row">{versiyaText(c.k, v)}</th>
                                {LISTY.map((l) => (
                                  <td key={l}>
                                    <a
                                      href={printHref(c.k, v, l)}
                                      target="_blank"
                                      rel="noopener"
                                      aria-label={`${T.card.printFor(versiyaText(c.k, v))}: ${T.card.sheets[l]}`}
                                    >
                                      {T.card.sheets[l]}
                                    </a>
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <section className="pov-stats" aria-labelledby="pov-stats-title">
        <h2 id="pov-stats-title" className="pov-stats__title">
          {T.stats.title}
        </h2>
        {works === null ? null : nashi.length === 0 ? (
          <p className="pov-note">{T.stats.none}</p>
        ) : (
          <StatsView
            works={nashi}
            code={null}
            label={(w) => versiyaText(povNomer(w.code) ?? 0, w.variant)}
          />
        )}
      </section>
    </div>
  );
}
