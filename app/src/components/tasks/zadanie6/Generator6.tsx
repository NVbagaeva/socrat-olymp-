'use client';

import { useState } from 'react';
import { Tex } from '@/components/ui/Tex';
import { GENERATOR_6, TRENAZHER_6 } from '@/content/zadanie6';
import type { ProtoInfo6 } from '@/lib/zadanie6/protoInfo';
import {
  NA_TIP_MAX,
  VARIANTOV_MAX,
  zaprosQuery,
  type Istochnik,
  type ZaprosLista,
} from '@/lib/zadanie6/sborka';
import type { Stil } from '@/lib/zadanie6/shablony';
import { KitBar } from '../generator/KitBar';
import { Pereklyuchatel, Shablony6 } from './Vybor6';

const T = GENERATOR_6;

/**
 * Генератор листов №6: шаблон → источник и формулировка → сколько задач
 * каждого прототипа → варианты и рамки теории с 0–2 разобранными
 * примерами на тип. Лист ученика и лист учителя — из одного набора: оба
 * адреса строятся по одному запросу и seed комплекта (KitBar), код
 * комплекта печатается в колонтитуле и стоит в адресе.
 */
export function Generator6({
  prototipy,
  gruppy,
  base,
}: {
  prototipy: ProtoInfo6[];
  gruppy: { id: string; title: string }[];
  base: string;
}) {
  const [chislo, setChislo] = useState<Record<string, number>>({});
  const [istochnik, setIstochnik] = useState<Istochnik>('mix');
  const [stil, setStil] = useState<Stil>('vse');
  const [variantov, setVariantov] = useState(2);
  const [primery, setPrimery] = useState<0 | 1 | 2>(1);

  const tipy = prototipy
    .filter((p) => (chislo[p.id] ?? 0) > 0)
    .map((p) => ({ id: p.id, n: chislo[p.id] ?? 0 }));
  const vsego = tipy.reduce((acc, t) => acc + t.n, 0);

  function hrefs(seed: string) {
    const zapros: ZaprosLista = { tipy, istochnik, variantov, primery, stil, seed };
    const q = zaprosQuery(zapros);
    return { student: `${base}/pechat/?${q}`, teacher: `${base}/pechat/otvety/?${q}` };
  }

  return (
    <div className="z6-gen">
      <section className="z6-gen__blok">
        <h2 className="t-h3">{TRENAZHER_6.shablony}</h2>
        <Shablony6
          vybrat={(t, st) => {
            setChislo(Object.fromEntries(t.map((id) => [id, 1])));
            setStil(st);
          }}
        />
      </section>
      <section className="z6-gen__blok">
        <h2 className="t-h3">{T.istochnik}</h2>
        <Pereklyuchatel<Istochnik>
          label={T.istochnik}
          varianty={TRENAZHER_6.istochniki}
          znachenie={istochnik}
          izmenit={setIstochnik}
        />
        <p className="z6-tr__poyasnenie">{TRENAZHER_6.istochnikPoyasnenie}</p>
        <h3 className="z6-tr__podzag">{TRENAZHER_6.stil}</h3>
        <Pereklyuchatel<Stil>
          label={TRENAZHER_6.stil}
          varianty={TRENAZHER_6.stili}
          znachenie={stil}
          izmenit={setStil}
        />
      </section>
      <section className="z6-gen__blok">
        <h2 className="t-h3">{T.sostav}</h2>
        {gruppy.map((g) => (
          <fieldset key={g.id} className="z6-tr__gruppa">
            <legend>
              Группа {g.id}. {g.title}
            </legend>
            <ul className="z6-gen__tipy">
              {prototipy
                .filter((p) => p.group === g.id)
                .map((p) => (
                  <li key={p.id}>
                    <label>
                      <span>
                        <span className="z6-tr__kod">{p.kod}</span> <Tex text={p.title} />
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
      <section className="z6-gen__blok z6-gen__nastroyki">
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
        <p className="z6-gen__vsego">
          {T.vsego} <b>{vsego}</b>
        </p>
      </section>
      <KitBar
        scope="6"
        slot={base}
        section={T.section}
        count={vsego * variantov}
        ready={vsego > 0}
        hrefs={hrefs}
      />
    </div>
  );
}
