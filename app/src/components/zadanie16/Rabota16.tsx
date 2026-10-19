'use client';

import { useRef, useState } from 'react';
import { proverit16, type Proverka16 } from '@/lib/zadanie16/otvet';

/** Задание работы, набранное на сервере: условие и ответ — готовая вёрстка KaTeX. */
export interface Zadanie16View {
  id: string;
  uslovieHtml: string;
  /** Ответ из данных: TeX-запись множества, по ней идёт проверка. */
  otvet: string;
  otvetHtml: string;
}

/** Кнопки знаков: набрать «∞» и «∪» с телефона иначе нечем. */
const ZNAKI = ['(', ')', '[', ']', ';', '−∞', '+∞', '∪', '√', '{', '}'] as const;

const TEKST = {
  pole: 'Ответ',
  pole_podskazka: 'Ответ промежутками',
  proverit: 'Проверить',
  verno: 'Верно!',
  neverno: 'Пока неверно — проверьте концы и скобки.',
  pokazat: 'Показать ответ',
  otvet: 'Ответ:',
  resheno: (k: number, n: number) => `Решено ${k} из ${n}`,
} as const;

function Zadanie({ z, no, onVerno }: { z: Zadanie16View; no: number; onVerno: () => void }) {
  const [vvod, setVvod] = useState('');
  const [itog, setItog] = useState<Proverka16 | null>(null);
  const [pokazan, setPokazan] = useState(false);
  const pole = useRef<HTMLInputElement>(null);

  function vstavit(znak: string) {
    const el = pole.current;
    const start = el?.selectionStart ?? vvod.length;
    const end = el?.selectionEnd ?? vvod.length;
    const novyy = vvod.slice(0, start) + znak + vvod.slice(end);
    setVvod(novyy);
    setItog(null);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + znak.length, start + znak.length);
    });
  }

  function proverit() {
    const r = proverit16(vvod, z.otvet);
    if (r === 'verno' && itog !== 'verno') {
      onVerno();
    }
    setItog(r);
  }

  const idPolya = `z16-otvet-${z.id}`;
  return (
    <li className="z16-zad">
      <p className="z16-zad__uslovie">
        <span className="z16-zad__no">{no}.</span>{' '}
        <span dangerouslySetInnerHTML={{ __html: z.uslovieHtml }} />
      </p>
      <form
        className="z16-zad__forma"
        onSubmit={(e) => {
          e.preventDefault();
          proverit();
        }}
      >
        <label className="z16-zad__label" htmlFor={idPolya}>
          {TEKST.pole}
        </label>
        <input
          ref={pole}
          id={idPolya}
          className="z16-zad__pole"
          value={vvod}
          placeholder={TEKST.pole_podskazka}
          autoComplete="off"
          spellCheck={false}
          inputMode="text"
          onChange={(e) => {
            setVvod(e.target.value);
            setItog(null);
          }}
          aria-invalid={itog !== null && itog !== 'verno'}
        />
        <button type="submit" className="btn btn--primary btn--sm">
          {TEKST.proverit}
        </button>
      </form>
      <div className="z16-zad__znaki" role="group" aria-label="Знаки для ответа">
        {ZNAKI.map((zn) => (
          <button type="button" key={zn} className="z16-zad__znak" onClick={() => vstavit(zn)}>
            {zn}
          </button>
        ))}
      </div>
      <p className="z16-zad__itog" aria-live="polite">
        {itog === null ? null : itog === 'verno' ? (
          <span className="z16-zad__verno">{TEKST.verno}</span>
        ) : itog === 'neverno' ? (
          <span className="z16-zad__neverno">{TEKST.neverno}</span>
        ) : (
          <span className="z16-zad__neverno">{itog.oshibka}</span>
        )}
      </p>
      {pokazan ? (
        <p className="z16-zad__otvet">
          {TEKST.otvet} <span dangerouslySetInnerHTML={{ __html: z.otvetHtml }} />
        </p>
      ) : (
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() => setPokazan(true)}
        >
          {TEKST.pokazat}
        </button>
      )}
    </li>
  );
}

/**
 * Тренировочная работа главы: задания по порядку, у каждого поле
 * ответа с проверкой (lib/zadanie16/otvet.ts) и кнопка «Показать
 * ответ». Счёт верных — только на этой странице, без сохранения.
 */
export function Rabota16({
  zadaniya,
  primerHtml,
}: {
  zadaniya: readonly Zadanie16View[];
  /** Как записывать ответ — строка с формулой, набранная на сервере. */
  primerHtml: string;
}) {
  const [verno, setVerno] = useState(0);
  return (
    <div className="z16-rabota">
      <p className="z16-rabota__primer" dangerouslySetInnerHTML={{ __html: primerHtml }} />
      <p className="z16-rabota__schet">{TEKST.resheno(verno, zadaniya.length)}</p>
      <ol className="z16-rabota__list">
        {zadaniya.map((z, i) => (
          <Zadanie z={z} no={i + 1} key={z.id} onVerno={() => setVerno((k) => k + 1)} />
        ))}
      </ol>
    </div>
  );
}
