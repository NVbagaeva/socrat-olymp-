'use client';

import { clsx } from 'clsx';
import { useState } from 'react';
import { RAZDEL, UPRAVLENIE } from './kontent';

/**
 * Живые элементы демо: вкладки раздела, режим тренировки и сложность.
 * Нажимаются по-настоящему — так видно и обычное, и активное состояние,
 * и ховер, и фокус с клавиатуры.
 */

export function Vkladki() {
  const [aktivnaya, setAktivnaya] = useState(RAZDEL.aktivnaya);
  return (
    <div className="dm-vkladki" role="tablist" aria-label="Разделы задания №9">
      {RAZDEL.vkladki.map((label, i) => (
        <button
          key={label}
          type="button"
          role="tab"
          aria-selected={i === aktivnaya}
          tabIndex={i === aktivnaya ? 0 : -1}
          className={clsx('dm-vkladka', i === aktivnaya && 'is-active')}
          onClick={() => setAktivnaya(i)}
          onKeyDown={(e) => {
            const shag = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
            if (shag === 0) return;
            e.preventDefault();
            const next = (i + shag + RAZDEL.vkladki.length) % RAZDEL.vkladki.length;
            setAktivnaya(next);
            const spisok = e.currentTarget.parentElement?.children;
            (spisok?.[next] as HTMLElement | undefined)?.focus();
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function Rezhim() {
  const { rezhim } = UPRAVLENIE;
  const [vybrana, setVybrana] = useState<string>(rezhim.vybrana);
  return (
    <fieldset className="dm-pole">
      <legend className="dm-pole__podpis">{rezhim.podpis}</legend>
      <div className="dm-opcii">
        {rezhim.opcii.map((o) => {
          const nedostupna = 'nedostupna' in o && o.nedostupna;
          return (
            <label
              key={o.id}
              className={clsx(
                'dm-opciya',
                vybrana === o.id && 'is-vybrana',
                nedostupna && 'is-nedostupna',
              )}
            >
              <input
                type="radio"
                name="dm-rezhim"
                value={o.id}
                checked={vybrana === o.id}
                disabled={nedostupna}
                onChange={() => setVybrana(o.id)}
              />
              <span className="dm-opciya__label">{o.label}</span>
              <span className="dm-opciya__opisanie">{o.opisanie}</span>
              <svg className="dm-opciya__galka" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3.5 8.5l3 3 6-7" />
              </svg>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function Slozhnost() {
  const { slozhnost } = UPRAVLENIE;
  const [vybrana, setVybrana] = useState<number>(slozhnost.vybrana);
  return (
    <fieldset className="dm-pole">
      <legend className="dm-pole__podpis">{slozhnost.podpis}</legend>
      <div className="dm-zvyozdy">
        {slozhnost.urovni.map((label, i) => (
          <label key={label} className={clsx('dm-zvezda', i + 1 === vybrana && 'is-gorit')}>
            <input
              type="radio"
              name="dm-slozhnost"
              value={i + 1}
              checked={vybrana === i + 1}
              onChange={() => setVybrana(i + 1)}
            />
            <span className="dm-zvezda__ryad" aria-hidden="true">
              {Array.from({ length: i + 1 }, (_, k) => (
                <svg key={k} viewBox="0 0 16 16">
                  <path d="M8 1.6l1.9 4 4.4.5-3.3 3 .9 4.3L8 11.2l-3.9 2.2.9-4.3-3.3-3 4.4-.5z" />
                </svg>
              ))}
            </span>
            <span className="dm-zvezda__label">{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
