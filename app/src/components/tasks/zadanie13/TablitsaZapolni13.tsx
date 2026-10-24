'use client';

import { clsx } from 'clsx';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { answerMatches } from '@/lib/zadanie13/secret';
import type { TablitsaZapolni13 } from '@/lib/zadanie13/zapolni';

const klyuch = (r: number, c: number) => `${r}.${c}`;

/**
 * «Заполни таблицу» в опорных задачах и онлайн-наборе №13: строки —
 * величины, столбцы — периоды. Ученик вводит числа (цифровая
 * клавиатура), «Проверить таблицу» подсвечивает клетки зелёным или
 * красным — сверка с отпечатками, ответов в разметке нет. У строки —
 * подсказка «Как найти …?». На телефоне таблица прокручивается вбок
 * в своей рамке, столбец с названиями строк закреплён. Итоговый ответ
 * — в поле ответа задачи под таблицей.
 */
export function TablitsaZapolni13({ t }: { t: TablitsaZapolni13 }) {
  const [znacheniya, setZnacheniya] = useState<Record<string, string>>({});
  const [provereno, setProvereno] = useState<Record<string, boolean>>({});
  const [podskazka, setPodskazka] = useState<number | null>(null);

  const vsego = t.stroki.reduce((n, s) => n + s.kletki.filter((k) => k.seal !== null).length, 0);
  const verno = Object.values(provereno).filter(Boolean).length;
  const estProverka = Object.keys(provereno).length > 0;

  function proverit() {
    const out: Record<string, boolean> = {};
    t.stroki.forEach((s, r) =>
      s.kletki.forEach((k, c) => {
        if (k.seal === null) return;
        const v = (znacheniya[klyuch(r, c)] ?? '').trim();
        /* Пустая клетка — не ошибка: её просто ещё не заполнили. */
        if (v !== '') out[klyuch(r, c)] = answerMatches(v, k.seal);
      }),
    );
    setProvereno(out);
  }

  const otkryta = podskazka === null ? undefined : t.stroki[podskazka];

  return (
    <div className="z13-zap">
      <p className="z13-zap__title">Заполните таблицу</p>
      <div className="z13-zap__scroll">
        <table className="z13-zap__table">
          <thead>
            <tr>
              <th scope="col" className="z13-zap__sticky">
                {t.period}
              </th>
              {t.periody.map((p) => (
                <th key={p} scope="col">
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.stroki.map((s, r) => (
              <tr key={s.title}>
                <th scope="row" className="z13-zap__sticky">
                  <span className="z13-zap__name">{s.title}</span>
                  <button
                    type="button"
                    className={clsx('z13-zap__q', podskazka === r && 'is-open')}
                    aria-label={s.vopros}
                    aria-expanded={podskazka === r}
                    title={s.vopros}
                    onClick={() => setPodskazka(podskazka === r ? null : r)}
                  >
                    ?
                  </button>
                </th>
                {s.kletki.map((k, c) => {
                  const key = klyuch(r, c);
                  const itog = provereno[key];
                  return (
                    <td key={key}>
                      {k.dano !== null ? (
                        <span
                          className="z13-zap__dano"
                          dangerouslySetInnerHTML={{ __html: k.dano }}
                        />
                      ) : (
                        <input
                          className={clsx(
                            'z13-zap__input',
                            itog === true && 'is-right',
                            itog === false && 'is-wrong',
                          )}
                          inputMode="decimal"
                          autoComplete="off"
                          aria-label={`${s.title}, ${t.period.toLowerCase()} ${t.periody[c] ?? ''}`}
                          value={znacheniya[key] ?? ''}
                          onChange={(e) => {
                            setZnacheniya((prev) => ({ ...prev, [key]: e.target.value }));
                            if (itog !== undefined) {
                              setProvereno((prev) => {
                                const next = { ...prev };
                                delete next[key];
                                return next;
                              });
                            }
                          }}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {otkryta === undefined ? null : (
        <p className="z13-zap__hint" role="note">
          <b>{otkryta.vopros}</b> <span dangerouslySetInnerHTML={{ __html: otkryta.podskazka }} />
        </p>
      )}
      <div className="z13-zap__actions">
        <Button variant="secondary" size="sm" onClick={proverit}>
          Проверить таблицу
        </Button>
        {estProverka ? (
          <span className={clsx('z13-zap__itog', verno === vsego && 'is-right')} role="status">
            {verno === vsego ? 'Таблица заполнена верно' : `Верно ${verno} из ${vsego}`}
          </span>
        ) : null}
      </div>
    </div>
  );
}
