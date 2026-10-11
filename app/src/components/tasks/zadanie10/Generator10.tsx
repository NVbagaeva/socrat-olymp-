'use client';

import { clsx } from 'clsx';
import { useState, useSyncExternalStore } from 'react';
import { TRENAZHER_10 } from '@/content/zadanie10';
import {
  NA_TIP_MAX,
  novyyKod,
  VARIANTOV_MAX,
  zaprosQuery,
  type Istochnik,
  type ZaprosLista,
} from '@/lib/zadanie10/sborka';
import type { ProtoInfo10 } from './Trenazher10';

/* Первый код набора создаётся один раз в браузере (на сервере — пусто). */
let seedKesh: string | null = null;
const seedBrauzera = () => (seedKesh ??= novyyKod());
const nePodpisyvatsya = () => () => {};

/**
 * Генератор листов №10: сколько задач каждого прототипа, источник
 * (только ФИПИ / сгенерированные / вперемешку), варианты, рамки теории
 * с 0–2 разобранными примерами на тип, картинки сюжетов (по умолчанию
 * выключены). Лист ученика и лист учителя открываются по одной ссылке —
 * из одного набора задач; код набора (seed) — в адресе.
 */
export function Generator10({
  prototipy,
  gruppy,
  base,
}: {
  prototipy: ProtoInfo10[];
  gruppy: { id: string; title: string }[];
  base: string;
}) {
  const [chislo, setChislo] = useState<Record<string, number>>({});
  const [istochnik, setIstochnik] = useState<Istochnik>('fipi');
  const [variantov, setVariantov] = useState(2);
  const [primery, setPrimery] = useState<0 | 1 | 2>(1);
  const [kartinki, setKartinki] = useState(false);
  const nachalnyy = useSyncExternalStore(nePodpisyvatsya, seedBrauzera, () => '');
  const [svoy, setSeed] = useState<string | null>(null);
  const seed = svoy ?? nachalnyy;

  const tipy = prototipy
    .filter((p) => (chislo[p.id] ?? 0) > 0)
    .map((p) => ({ id: p.id, n: chislo[p.id] ?? 0 }));
  const zapros: ZaprosLista = { tipy, istochnik, variantov, primery, kartinki, seed };
  const ssylka = (l: 'uchenik' | 'uchitel') => `${base}/pechat/?m=g&l=${l}&${zaprosQuery(zapros)}`;
  const vsego = tipy.reduce((s, t) => s + t.n, 0);

  return (
    <div className="z10-gen">
      <section className="z10-gen__blok">
        <h2 className="t-h3">Источник задач</h2>
        <div className="z10-tr__istochnik" role="radiogroup" aria-label="Источник задач">
          {TRENAZHER_10.istochniki.map((i) => (
            <button
              type="button"
              role="radio"
              aria-checked={istochnik === i.id}
              key={i.id}
              className={clsx('z10-tr__pereklyuchatel', istochnik === i.id ? 'is-active' : '')}
              onClick={() => setIstochnik(i.id as Istochnik)}
            >
              {i.label}
            </button>
          ))}
        </div>
      </section>
      <section className="z10-gen__blok">
        <h2 className="t-h3">Сколько задач каждого типа в варианте</h2>
        {gruppy.map((g) => (
          <fieldset key={g.id} className="z10-tr__gruppa">
            <legend>
              Группа {g.id}. {g.title}
            </legend>
            <ul className="z10-gen__tipy">
              {prototipy
                .filter((p) => p.group === g.id)
                .map((p) => (
                  <li key={p.id}>
                    <label>
                      <span>
                        {p.kod} {p.title}
                        {p.izKursa ? (
                          <span className="z10-metka">не из открытого банка</span>
                        ) : null}
                      </span>
                      <select
                        value={chislo[p.id] ?? 0}
                        onChange={(e) => setChislo({ ...chislo, [p.id]: Number(e.target.value) })}
                        aria-label={`${p.kod}: задач в варианте`}
                      >
                        {Array.from({ length: NA_TIP_MAX + 1 }, (_, k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                    </label>
                  </li>
                ))}
            </ul>
          </fieldset>
        ))}
      </section>
      <section className="z10-gen__blok z10-gen__nastroyki">
        <label>
          Вариантов{' '}
          <select value={variantov} onChange={(e) => setVariantov(Number(e.target.value))}>
            {Array.from({ length: VARIANTOV_MAX }, (_, k) => (
              <option key={k + 1} value={k + 1}>
                {k + 1}
              </option>
            ))}
          </select>
        </label>
        <label>
          Рамки теории: разобранных примеров на тип{' '}
          <select value={primery} onChange={(e) => setPrimery(Number(e.target.value) as 0 | 1 | 2)}>
            <option value={0}>0 — без теории</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={kartinki}
            onChange={(e) => setKartinki(e.target.checked)}
          />{' '}
          Картинки сюжетов в листе (тратят тонер; чертёж моста печатается всегда)
        </label>
      </section>
      <section className="z10-gen__blok z10-gen__itog">
        <p>
          В варианте задач: <b>{vsego}</b>. Код набора: <b>{seed}</b>{' '}
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setSeed(novyyKod())}
          >
            Другой набор
          </button>
        </p>
        <div className="z10-gen__knopki">
          <a
            className={clsx('btn btn--primary', vsego === 0 ? 'is-disabled' : '')}
            aria-disabled={vsego === 0}
            href={vsego === 0 ? undefined : ssylka('uchenik')}
            target="_blank"
            rel="noopener"
          >
            Скачать лист ученика
          </a>
          <a
            className={clsx('btn btn--secondary', vsego === 0 ? 'is-disabled' : '')}
            aria-disabled={vsego === 0}
            href={vsego === 0 ? undefined : ssylka('uchitel')}
            target="_blank"
            rel="noopener"
          >
            Скачать лист учителя
          </a>
        </div>
      </section>
    </div>
  );
}
