'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useState, type CSSProperties } from 'react';
import { A4_RAZMER, HOWTO, HOWTO_HREFS } from '@/content/kakPolzovatsya';
import { snimokPut, type HowtoFaily } from './Kartinka';

const D = HOWTO.demo;
const MIN_Z = 2;
const MAX_Z = 4;
const MAX_V = 8;

/**
 * «Генератор за 10 секунд»: выбрать 2–4 задания, число вариантов и
 * лист — справа веером столько миниатюр листов, сколько вариантов.
 * Миниатюры — настоящие снимки листов генератора.
 *
 * Выбор в генератор не передаётся: генератор, получив набор в адресе,
 * сразу собирает лист и тратит пробную генерацию — пример не должен
 * этого делать. Кнопка ведёт в генератор как есть.
 */
export default function GeneratorDemo({ faily }: { faily: HowtoFaily }) {
  const [zadaniya, setZadaniya] = useState<number[]>([D.nomera[0], D.nomera[2]]);
  const [n, setN] = useState(3);
  const [uchitel, setUchitel] = useState(false);

  const pereklyuchit = (z: number) => {
    setZadaniya((cur) => {
      if (cur.includes(z)) return cur.length <= MIN_Z ? cur : cur.filter((x) => x !== z);
      return cur.length >= MAX_Z ? cur : [...cur, z].sort((a, b) => a - b);
    });
  };

  const list = faily[snimokPut(uchitel ? 'a4-uchitelya' : 'a4-uchenika')];
  const podpisList = uchitel ? D.uchitelya : D.uchenika;

  return (
    <section className="gdemo" aria-labelledby="howto-gdemo">
      <div className="gdemo__nastroyki">
        <h3 className="gdemo__title" id="howto-gdemo">
          {D.title}
        </h3>

        <fieldset className="gdemo__gruppa">
          <legend className="gdemo__legend">
            {D.zadaniya} <span className="gdemo__skolko">({MIN_Z}–{MAX_Z})</span>
          </legend>
          <div className="gdemo__chipy">
            {D.nomera.map((z) => {
              const on = zadaniya.includes(z);
              const nelzya = on ? zadaniya.length <= MIN_Z : zadaniya.length >= MAX_Z;
              return (
                <button
                  key={z}
                  type="button"
                  className={clsx('gdemo__chip', on && 'is-on')}
                  aria-pressed={on}
                  aria-disabled={nelzya || undefined}
                  onClick={() => pereklyuchit(z)}
                >
                  №{z}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="gdemo__gruppa">
          <span className="gdemo__legend" id="howto-gdemo-v">
            {D.variantov}
          </span>
          <div className="gdemo__shagi" role="group" aria-labelledby="howto-gdemo-v">
            <button
              type="button"
              className="gdemo__minus"
              aria-label={D.menshe}
              disabled={n <= 1}
              onClick={() => setN((x) => Math.max(1, x - 1))}
            >
              −
            </button>
            <output className="gdemo__n" aria-live="polite">
              {n}
            </output>
            <button
              type="button"
              className="gdemo__minus"
              aria-label={D.bolshe}
              disabled={n >= MAX_V}
              onClick={() => setN((x) => Math.min(MAX_V, x + 1))}
            >
              +
            </button>
          </div>
        </div>

        <div className="gdemo__gruppa">
          <span className="gdemo__legend" id="howto-gdemo-l">
            {D.list}
          </span>
          <div className="gdemo__seg" role="radiogroup" aria-labelledby="howto-gdemo-l">
            {[false, true].map((u) => (
              <button
                key={String(u)}
                type="button"
                role="radio"
                aria-checked={uchitel === u}
                className={clsx('gdemo__seg-k', uchitel === u && 'is-on')}
                onClick={() => setUchitel(u)}
              >
                {u ? D.uchitelya : D.uchenika}
              </button>
            ))}
          </div>
        </div>

        <Link className="btn btn--primary gdemo__sobrat" href={HOWTO_HREFS.generator}>
          {D.sobrat}
        </Link>
        <p className="gdemo__primechanie">{D.primechanie}</p>
      </div>

      <div className="gdemo__veer" aria-label={`${podpisList}: ${n}`} role="img">
        {Array.from({ length: n }, (_, i) => (
          <div
            key={i}
            className="gdemo__list"
            style={{ '--i': i, '--n': n } as CSSProperties}
          >
            {list === undefined ? null : (
              <img
                src={list}
                alt=""
                width={A4_RAZMER.width}
                height={A4_RAZMER.height}
                loading="lazy"
                decoding="async"
              />
            )}
            <span className="gdemo__metka">
              {D.variant(i + 1)} · {zadaniya.map((z) => `№${z}`).join(', ')}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
