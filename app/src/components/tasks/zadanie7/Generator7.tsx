'use client';

import { clsx } from 'clsx';
import { useState } from 'react';
import { Tex } from '@/components/ui/Tex';
import { GENERATOR_7, TRENAZHER_7 } from '@/content/zadanie7';
import type { ProtoInfo7 } from '@/lib/zadanie7/protoInfo';
import {
  NA_TIP_MAX,
  VARIANTOV_MAX,
  zaprosQuery,
  type Istochnik,
  type ZaprosLista,
} from '@/lib/zadanie7/sborka';
import { KitBar } from '../generator/KitBar';

const T = GENERATOR_7;

/**
 * Генератор листов №7: сколько задач каждого прототипа, источник
 * (только ФИПИ / сгенерированные / вперемешку), варианты, рамки теории
 * с 0–2 разобранными примерами на тип. Лист ученика и лист учителя —
 * из одного набора: оба адреса строятся по одному запросу и seed
 * комплекта (KitBar), код комплекта печатается в колонтитуле.
 */
export function Generator7({
  prototipy,
  gruppy,
  base,
}: {
  prototipy: ProtoInfo7[];
  gruppy: { id: string; title: string }[];
  base: string;
}) {
  const [chislo, setChislo] = useState<Record<string, number>>({});
  const [istochnik, setIstochnik] = useState<Istochnik>('fipi');
  const [variantov, setVariantov] = useState(2);
  const [primery, setPrimery] = useState<0 | 1 | 2>(1);

  const tipy = prototipy
    .filter((p) => (chislo[p.id] ?? 0) > 0)
    .map((p) => ({ id: p.id, n: chislo[p.id] ?? 0 }));
  const vsego = tipy.reduce((s, t) => s + t.n, 0);

  function hrefs(seed: string) {
    const zapros: ZaprosLista = { tipy, istochnik, variantov, primery, seed };
    const q = zaprosQuery(zapros);
    return { student: `${base}/pechat/?${q}`, teacher: `${base}/pechat/otvety/?${q}` };
  }

  return (
    <div className="z7-gen">
      <section className="z7-gen__blok">
        <h2 className="t-h3">{T.istochnik}</h2>
        <div className="z7-tr__istochnik" role="radiogroup" aria-label={T.istochnik}>
          {TRENAZHER_7.istochniki.map((i) => (
            <button
              type="button"
              role="radio"
              aria-checked={istochnik === i.id}
              key={i.id}
              className={clsx('z7-tr__pereklyuchatel', istochnik === i.id ? 'is-active' : '')}
              onClick={() => setIstochnik(i.id as Istochnik)}
            >
              {i.label}
            </button>
          ))}
        </div>
      </section>
      <section className="z7-gen__blok">
        <h2 className="t-h3">{T.sostav}</h2>
        {gruppy.map((g) => (
          <fieldset key={g.id} className="z7-tr__gruppa">
            <legend>
              Группа {g.id}. {g.title}
            </legend>
            <ul className="z7-gen__tipy">
              {prototipy
                .filter((p) => p.group === g.id)
                .map((p) => (
                  <li key={p.id}>
                    <label>
                      <span>
                        <span className="z7-tr__kod">{p.kod}</span> <Tex text={p.title} />
                        {p.bezFipi ? <span className="z7-metka">{TRENAZHER_7.bezFipi}</span> : null}
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
      <section className="z7-gen__blok z7-gen__nastroyki">
        <label>
          {T.variantov}{' '}
          <select value={variantov} onChange={(e) => setVariantov(Number(e.target.value))}>
            {Array.from({ length: VARIANTOV_MAX }, (_, k) => (
              <option key={k + 1} value={k + 1}>
                {k + 1}
              </option>
            ))}
          </select>
        </label>
        <label>
          {T.primery}{' '}
          <select value={primery} onChange={(e) => setPrimery(Number(e.target.value) as 0 | 1 | 2)}>
            <option value={0}>{T.primeryBez}</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
        </label>
        <p className="z7-gen__vsego">
          {T.vsego} <b>{vsego}</b>
        </p>
      </section>
      <KitBar
        scope="7"
        slot={base}
        section={T.section}
        count={vsego * variantov}
        ready={vsego > 0}
        hrefs={hrefs}
      />
    </div>
  );
}
