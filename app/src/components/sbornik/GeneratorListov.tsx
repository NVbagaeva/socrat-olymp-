'use client';

import { useMemo, useState } from 'react';
import { SpaceOption } from '@/components/tasks/space/SpaceOption';
import { useSheetSpace } from '@/components/tasks/space/useSheetSpace';
import { withSpace } from '@/lib/sheet/space.js';
import { VARIANTOV_MAX, ZADACH_TIPA_MAX, zaprosLista, type ParametryLista } from '@/lib/sbornik/list';
import type { Uroven } from '@/lib/sbornik/types';

export interface TipGeneratora {
  id: string;
  nazvanie: string;
  /** Сколько задач каждого уровня в банке. */
  poUrovnyam: readonly [number, number, number];
}

function novoeZerno(): string {
  return Math.random().toString(36).slice(2, 8);
}

/**
 * Генератор листов главы для репетитора: сколько задач какого типа,
 * уровни, варианты (задачи вариантов не повторяются), тема, место для
 * решения. Лист ученика и лист учителя — с решениями по шагам и
 * таблицей ответов — открываются отдельными страницами для печати.
 */
export function GeneratorListov({
  glava,
  tipy,
  pechatHref,
}: {
  glava: number;
  tipy: readonly TipGeneratora[];
  /** Адрес страницы печати главы (без строки запроса). */
  pechatHref: string;
}) {
  const [skolko, setSkolko] = useState<Record<string, number>>(() =>
    Object.fromEntries(tipy.map((t, i) => [t.id, i < 3 ? 2 : 0])),
  );
  const [urovni, setUrovni] = useState<Set<Uroven>>(() => new Set<Uroven>([1, 2, 3]));
  const [varianty, setVarianty] = useState(2);
  const [tema, setTema] = useState<'color' | 'print'>('color');
  const [zerno, setZerno] = useState('a1b2c3');
  const [space, setSpace] = useSheetSpace();

  const params: ParametryLista = {
    glava,
    tipy: tipy.filter((t) => (skolko[t.id] ?? 0) > 0).map((t) => ({ tip: t.id, k: skolko[t.id]! })),
    urovni: [...urovni].sort(),
    varianty,
    zerno,
    tema,
  };
  const vsego = params.tipy.reduce((s, t) => s + t.k, 0);
  const nehvataet = useMemo(
    () =>
      params.tipy.filter((t) => {
        const tip = tipy.find((item) => item.id === t.tip)!;
        const est = [...urovni].reduce((s, u) => s + tip.poUrovnyam[u - 1]!, 0);
        return est < t.k * varianty;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [skolko, urovni, varianty, tipy],
  );
  const zapros = zaprosLista(params);
  const uchenik = withSpace(`${pechatHref}?${zapros}`, space);
  const uchitel = `${pechatHref}?${zapros}&vid=uchitel`;

  return (
    <div className="sb-generator">
      <section className="sb-nastroyka stk-glass" aria-labelledby="sb-gen-zag">
        <h2 id="sb-gen-zag" className="sb-nastroyka__zag">
          Состав листа
        </h2>
        <p className="sb-nastroyka__poyasnenie">
          Сколько задач каждого типа будет в одном варианте. Задачи берутся из банка главы; в разных
          вариантах они не повторяются.
        </p>
        <ul className="sb-gen-tipy">
          {tipy.map((t) => {
            const k = skolko[t.id] ?? 0;
            return (
              <li key={t.id} className="sb-gen-tip">
                <span className="sb-gen-tip__imya">
                  <b>{t.id}</b> {t.nazvanie}
                </span>
                <span className="sb-stepper">
                  <button
                    type="button"
                    aria-label={`Меньше задач типа ${t.id}`}
                    disabled={k === 0}
                    onClick={() => setSkolko((o) => ({ ...o, [t.id]: Math.max(0, k - 1) }))}
                  >
                    −
                  </button>
                  <output aria-live="polite">{k}</output>
                  <button
                    type="button"
                    aria-label={`Больше задач типа ${t.id}`}
                    disabled={k >= ZADACH_TIPA_MAX}
                    onClick={() => setSkolko((o) => ({ ...o, [t.id]: Math.min(ZADACH_TIPA_MAX, k + 1) }))}
                  >
                    +
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="sb-nastroyka stk-glass" aria-labelledby="sb-gen-param">
        <h2 id="sb-gen-param" className="sb-nastroyka__zag">
          Параметры
        </h2>
        <fieldset className="sb-nastroyka__gruppa">
          <legend>Уровни</legend>
          <div className="sb-filtr__gruppa">
            {([1, 2, 3] as const).map((u) => (
              <button
                key={u}
                type="button"
                className="sb-chip"
                aria-pressed={urovni.has(u)}
                onClick={() =>
                  setUrovni((old) => {
                    const next = new Set(old);
                    if (next.has(u) && next.size > 1) next.delete(u);
                    else next.add(u);
                    return next;
                  })
                }
              >
                {'★'.repeat(u)}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="sb-nastroyka__gruppa">
          <legend>Вариантов</legend>
          <div className="sb-filtr__gruppa">
            {Array.from({ length: VARIANTOV_MAX }, (_, i) => i + 1).map((n) => (
              <button key={n} type="button" className="sb-chip" aria-pressed={varianty === n} onClick={() => setVarianty(n)}>
                {n}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="sb-nastroyka__gruppa">
          <legend>Печать</legend>
          <div className="sb-filtr__gruppa">
            <button type="button" className="sb-chip" aria-pressed={tema === 'color'} onClick={() => setTema('color')}>
              Цветная
            </button>
            <button type="button" className="sb-chip" aria-pressed={tema === 'print'} onClick={() => setTema('print')}>
              Чёрно-белая
            </button>
          </div>
        </fieldset>
        <SpaceOption value={space} onChange={setSpace} />
      </section>

      <section className="sb-nastroyka stk-glass" aria-labelledby="sb-gen-gotovo">
        <h2 id="sb-gen-gotovo" className="sb-nastroyka__zag">
          Лист
        </h2>
        {vsego === 0 ? (
          <p>Выберите хотя бы одну задачу.</p>
        ) : (
          <>
            <p>
              В варианте <b>{vsego}</b> задач, вариантов — <b>{varianty}</b>.{' '}
              {nehvataet.length === 0
                ? null
                : `Для типов ${nehvataet.map((t) => t.tip).join(', ')} задач выбранных уровней на все варианты не хватит — часть вариантов выйдет короче.`}
            </p>
            <div className="sb-zadacha__knopki">
              <a className="btn btn--primary" href={uchenik} target="_blank" rel="noopener">
                Лист ученика
              </a>
              <a className="btn btn--secondary" href={uchitel} target="_blank" rel="noopener">
                Лист учителя: решения и ответы
              </a>
              <button type="button" className="btn btn--ghost" onClick={() => setZerno(novoeZerno())}>
                Другие задачи
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
