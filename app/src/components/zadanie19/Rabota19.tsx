'use client';

import { useRef, useState, type ReactNode } from 'react';
import { Badge } from '@/components/ui';
import { RABOTA_19, UROVNI_19 } from '@/content/zadanie19';
import type { Uroven19 } from '@/content/teoriya19/tipy';
import { proverit16, type Proverka16 } from '@/lib/zadanie16/otvet';

/** Задание, набранное на сервере: условие, подсказка и решение — готовая вёрстка. */
export interface Zadanie19View {
  id: string;
  uroven: Uroven19;
  uslovie: ReactNode;
  /** TeX-запись множества — по ней идёт проверка. */
  otvet: string;
  podskazka: ReactNode;
  reshenie: ReactNode;
}

const TON = { razminka: 'success', ege: 'info', povyshennyy: 'warning' } as const;

/** Кнопки знаков: «∞», «∪» и скобки с телефона иначе не набрать. */
const ZNAKI = ['(', ')', '[', ']', ';', '−∞', '+∞', '∪', '√', '{', '}', '/'] as const;

function Zadanie({ z, no, onVerno }: { z: Zadanie19View; no: number; onVerno: () => void }) {
  const [vvod, setVvod] = useState('');
  const [itog, setItog] = useState<Proverka16 | null>(null);
  const [podskazka, setPodskazka] = useState(false);
  const [reshenie, setReshenie] = useState(false);
  const pole = useRef<HTMLInputElement>(null);

  function vstavit(znak: string) {
    const el = pole.current;
    const start = el?.selectionStart ?? vvod.length;
    const end = el?.selectionEnd ?? vvod.length;
    setVvod(vvod.slice(0, start) + znak + vvod.slice(end));
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

  const idPolya = `z19-otvet-${z.id}`;
  return (
    <li className="z16-zad z19-zad" id={z.id}>
      <div className="z19-zad__head">
        <span className="z16-zad__no">{no}.</span>
        <Badge tone={TON[z.uroven]}>{UROVNI_19[z.uroven]}</Badge>
      </div>
      <div className="z16-zad__uslovie">{z.uslovie}</div>
      <form
        className="z16-zad__forma"
        onSubmit={(e) => {
          e.preventDefault();
          proverit();
        }}
      >
        <label className="z16-zad__label" htmlFor={idPolya}>
          {RABOTA_19.pole}
        </label>
        <input
          ref={pole}
          id={idPolya}
          className="z16-zad__pole"
          value={vvod}
          placeholder={RABOTA_19.polePodskazka}
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
          {RABOTA_19.proverit}
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
          <span className="z16-zad__verno">{RABOTA_19.verno}</span>
        ) : itog === 'neverno' ? (
          <span className="z16-zad__neverno">{RABOTA_19.neverno}</span>
        ) : (
          <span className="z16-zad__neverno">{itog.oshibka}</span>
        )}
      </p>
      <div className="z19-zad__knopki">
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          aria-expanded={podskazka}
          onClick={() => setPodskazka((v) => !v)}
        >
          {RABOTA_19.podskazka}
        </button>
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          aria-expanded={reshenie}
          onClick={() => setReshenie((v) => !v)}
        >
          {reshenie ? RABOTA_19.skrytReshenie : RABOTA_19.reshenie}
        </button>
      </div>
      <div className="z19-zad__podskazka" hidden={!podskazka}>
        {z.podskazka}
      </div>
      <div className="z19-zad__reshenie" hidden={!reshenie}>
        {z.reshenie}
      </div>
    </li>
  );
}

/**
 * Тренировочная работа №19: у задания — уровень, поле ответа с
 * проверкой (разбор множества — lib/zadanie16/otvet.ts), подсказка и
 * полное решение в раскрывающемся блоке. Решение лежит в разметке
 * скрытым (hidden): его видят поиск по странице и печать.
 */
export function Rabota19({
  zadaniya,
  primer,
}: {
  zadaniya: readonly Zadanie19View[];
  primer: ReactNode;
}) {
  const [verno, setVerno] = useState(0);
  return (
    <div className="z16-rabota">
      <p className="z16-rabota__primer">{primer}</p>
      <p className="z16-rabota__schet">{RABOTA_19.resheno(verno, zadaniya.length)}</p>
      <ol className="z16-rabota__list">
        {zadaniya.map((z, i) => (
          <Zadanie z={z} no={i + 1} key={z.id} onVerno={() => setVerno((k) => k + 1)} />
        ))}
      </ol>
    </div>
  );
}
