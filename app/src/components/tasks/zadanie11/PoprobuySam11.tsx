'use client';

import { clsx } from 'clsx';
import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { TEORIYA_11 } from '@/content/teoriya11';

export interface MiniZadanie {
  /** Вопрос, набранный KaTeX на сервере. */
  qHtml: string;
  /** Ответ числом строкой: «15625», «2,5». */
  otvet: string;
}

/** «15 625», «2,5» и «2.5» — одно и то же число. */
function norm(s: string): string {
  const t = s.replace(/[\s ]/g, '').replace(',', '.');
  const n = Number(t);
  return Number.isFinite(n) && t !== '' ? String(n) : t.toLowerCase();
}

/**
 * «Попробуй сам» в разделе «Быстрый счёт»: два-три мини-задания с
 * полем ответа и проверкой на месте. Ответы здесь не секрет — это
 * тренировка приёма, а не зачёт: после промаха можно открыть ответ.
 */
export function PoprobuySam11({ zadaniya }: { zadaniya: MiniZadanie[] }) {
  const [values, setValues] = useState<string[]>(() => zadaniya.map(() => ''));
  const [status, setStatus] = useState<('right' | 'wrong' | null)[]>(() =>
    zadaniya.map(() => null),
  );
  const [shown, setShown] = useState<boolean[]>(() => zadaniya.map(() => false));
  const t = TEORIYA_11.poprobuy;

  function check(i: number) {
    const ok = norm(values[i] ?? '') === norm(zadaniya[i]?.otvet ?? '');
    setStatus((prev) => prev.map((x, k) => (k === i ? (ok ? 'right' : 'wrong') : x)));
  }

  return (
    <ol className="z11-poprobuy">
      {zadaniya.map((z, i) => {
        const st = status[i] ?? null;
        const done = st === 'right' || shown[i] === true;
        return (
          <li key={i} className={clsx('z11-poprobuy__item', st !== null && `is-${st}`)}>
            <span className="z11-poprobuy__q" dangerouslySetInnerHTML={{ __html: z.qHtml }} />
            <span className="z11-poprobuy__row">
              <Input
                className="z11-poprobuy__input"
                value={values[i] ?? ''}
                placeholder={t.placeholder}
                inputMode="decimal"
                autoComplete="off"
                aria-label={t.otvet}
                state={st === null ? 'default' : st === 'right' ? 'success' : 'error'}
                readOnly={done}
                onChange={(e) => {
                  const v = e.target.value;
                  setValues((prev) => prev.map((x, k) => (k === i ? v : x)));
                  if (st === 'wrong') {
                    setStatus((prev) => prev.map((x, k) => (k === i ? null : x)));
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') check(i);
                }}
              />
              {done ? null : (
                <Button size="sm" variant="secondary" onClick={() => check(i)}>
                  {t.proverit}
                </Button>
              )}
              {st === 'wrong' && shown[i] !== true ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShown((prev) => prev.map((x, k) => (k === i ? true : x)))}
                >
                  {t.pokazat}
                </Button>
              ) : null}
            </span>
            {st === 'right' ? <span className="z11-poprobuy__msg is-right">{t.verno}</span> : null}
            {st === 'wrong' && shown[i] !== true ? (
              <span className="z11-poprobuy__msg is-wrong">{t.neverno}</span>
            ) : null}
            {shown[i] === true && st !== 'right' ? (
              <span className="z11-poprobuy__msg">
                {t.otvet}: <b>{z.otvet}</b>
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
