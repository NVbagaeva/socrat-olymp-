'use client';

import { clsx } from 'clsx';
import { useSyncExternalStore } from 'react';
import type { RazdelNaProverku } from '@/lib/zadanie11/proverka';

type Otmetka = { status: 'ok' | 'fix'; comment: string };
type Otmetki = Record<string, Otmetka>;

const KEY = 'budetege:zadanie-11:proverka-analogov:v1';
const EMPTY: Otmetki = {};
const listeners = new Set<() => void>();
let cache: Otmetki | null = null;

/* Отметки живут в localStorage этого браузера: внешний источник для
   useSyncExternalStore, на сервере пусто. */
function snapshot(): Otmetki {
  if (cache === null) {
    try {
      const raw = window.localStorage.getItem(KEY);
      cache = raw === null ? EMPTY : (JSON.parse(raw) as Otmetki);
    } catch {
      cache = EMPTY;
    }
  }
  return cache;
}

function zapisat(next: Otmetki) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* Приватный режим: отметки живут до перезагрузки. */
  }
  listeners.forEach((l) => l());
}

function useOtmetki(): Otmetki {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    snapshot,
    () => EMPTY,
  );
}

const ZVEZDY = ['', '★', '★★', '★★★'];

/**
 * Страница вычитки аналогов №11: по разделам и прототипам — исходная
 * задача банка и 10 аналогов. У каждого аналога — ответ, решение по
 * кнопке, отметки «ок» / «на исправление» с комментарием (хранятся в
 * этом браузере) и общий отчёт в markdown.
 */
export function ProverkaAnalogov({ razdely }: { razdely: RazdelNaProverku[] }) {
  const otmetki = useOtmetki();
  const vse = razdely.flatMap((r) => r.prototipy.flatMap((p) => p.analogi));
  const ok = vse.filter((a) => otmetki[a.id]?.status === 'ok').length;
  const fix = vse.filter((a) => otmetki[a.id]?.status === 'fix').length;

  function postavit(id: string, patch: Partial<Otmetka>) {
    const cur = snapshot()[id] ?? { status: 'ok' as const, comment: '' };
    zapisat({ ...snapshot(), [id]: { ...cur, ...patch } });
  }

  function skachat() {
    const lines: string[] = [
      '# Задание 11 — проверка аналогов',
      '',
      `Всего ${vse.length}, ок — ${ok}, на исправление — ${fix}, не просмотрено — ${vse.length - ok - fix}.`,
      '',
    ];
    for (const r of razdely) {
      lines.push(`## ${r.nazvanie}`, '');
      for (const p of r.prototipy) {
        lines.push(`## ${p.kod}. ${p.title} (${ZVEZDY[p.level]})`, '');
        for (const a of p.analogi) {
          const o = otmetki[a.id];
          lines.push(a.md);
          lines.push(
            o === undefined
              ? '_Отметка: не просмотрено_'
              : `_Отметка: ${o.status === 'ok' ? 'ок' : 'на исправление'}_${o.comment ? ` — ${o.comment}` : ''}`,
            '',
          );
        }
      }
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'zadanie-11-analogi.md';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="z11-pr">
      <header className="z11-pr__head">
        <h1 className="t-h2">Задание 11 · проверка аналогов</h1>
        <p className="z11-pr__lead">
          Служебная страница для преподавателя. Отметки сохраняются в этом браузере.
        </p>
        <p className="z11-pr__sum">
          Всего <b>{vse.length}</b> · ок <b>{ok}</b> · на исправление <b>{fix}</b> · не просмотрено{' '}
          <b>{vse.length - ok - fix}</b>
        </p>
        <button type="button" className="btn btn--primary" onClick={skachat}>
          Скачать отчёт (markdown)
        </button>
      </header>

      {razdely.map((r) => (
        <section key={r.id} className="z11-pr__razdel">
          <h2 className="z11-pr__h2">{r.nazvanie}</h2>
          {r.prototipy.map((p) => (
            <section key={p.id} className="z11-pr__proto" id={p.id}>
              <h3 className="z11-pr__h3">
                {p.kod}. {p.title} <span className="z11-pr__level">{ZVEZDY[p.level]}</span>
              </h3>
              <div className="z11-pr__bank">
                <p className="z11-pr__label">Задача банка</p>
                <div dangerouslySetInnerHTML={{ __html: p.bankHtml }} />
                <p className="z11-pr__otvet">
                  Ответ: <span dangerouslySetInnerHTML={{ __html: p.bankOtvetHtml }} />
                </p>
              </div>
              <ol className="z11-pr__list">
                {p.analogi.map((a) => {
                  const o = otmetki[a.id];
                  return (
                    <li key={a.id} className={clsx('z11-pr__analog', o && `is-${o.status}`)}>
                      <p className="z11-pr__meta">
                        <b>{a.id}</b> · {a.plotTag} · вопрос: {a.ask}
                      </p>
                      <div
                        className="z11-pr__text"
                        dangerouslySetInnerHTML={{ __html: a.tekstHtml }}
                      />
                      <p className="z11-pr__otvet">
                        Ответ: <span dangerouslySetInnerHTML={{ __html: a.otvetHtml }} />
                      </p>
                      <details className="z11-pr__reshenie">
                        <summary>Показать решение</summary>
                        <div dangerouslySetInnerHTML={{ __html: a.resheniyeHtml }} />
                      </details>
                      <div className="z11-pr__marks">
                        <button
                          type="button"
                          className={clsx('z11-pr__btn', o?.status === 'ok' && 'is-on')}
                          aria-pressed={o?.status === 'ok'}
                          onClick={() => postavit(a.id, { status: 'ok' })}
                        >
                          ок
                        </button>
                        <button
                          type="button"
                          className={clsx(
                            'z11-pr__btn z11-pr__btn--fix',
                            o?.status === 'fix' && 'is-on',
                          )}
                          aria-pressed={o?.status === 'fix'}
                          onClick={() => postavit(a.id, { status: 'fix' })}
                        >
                          на исправление
                        </button>
                        {o?.status === 'fix' ? (
                          <textarea
                            className="z11-pr__comment"
                            placeholder="Что исправить"
                            aria-label={`Комментарий к ${a.id}`}
                            defaultValue={o.comment}
                            onBlur={(e) => postavit(a.id, { comment: e.target.value })}
                          />
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </section>
      ))}
    </main>
  );
}
