'use client';

import { clsx } from 'clsx';
import { useMemo, useState } from 'react';
import { ShagiVoprosy, shagiSost, type ShagVoprosa } from '@/components/trenazher/ShagiVoprosy';
import type { KartochkaRazdela, Shagi } from '@/components/trenazher/types';
import { Input } from '@/components/ui';
import { TRENAZHER_18 as SLOVA } from '@/content/zadanie18/trenazherUi';
import type { Sostoyanie } from '@/lib/skhemy/ekran';
import { VID_ISHODNYY } from '@/lib/skhemy/tipy';
import type { ShagRazbora18, Zadacha18 } from '@/lib/zadanie18/trenazher/bank';
import { otkrytTekst18, otvetVeren18, poKlyuchu18 } from '@/lib/zadanie18/trenazher/otvet';
import { trenazher18 } from '@/lib/zadanie18/trenazher/progress';
import { scena18 } from '@/lib/zadanie18/trenazher/sceny';
import { ChertezhSkhemy } from '@/components/skhemy/ChertezhSkhemy';

/**
 * Карточка задачи №18 в общем тренажёре (components/trenazher/):
 * условие с пунктами а) и б), чертёж по числам варианта, ответ
 * пункта б) числом, подсказка вопросами и разбор обоих пунктов, шаг
 * которого подсвечивает чертёж. Банк готов на сервере
 * (lib/zadanie18/trenazher/bank.ts): ответ — отпечатком, подсказка и
 * разбор закрыты им же.
 */

function Chertezh({ z, lit }: { z: Zadacha18; lit: readonly string[] }) {
  const skhema = useMemo(() => scena18(z.tip, z.p), [z]);
  const sost: Sostoyanie = useMemo(() => ({ lit: new Set(lit), shag: null, podpisi: true }), [lit]);
  return (
    <div className="z18-tr__chertezh">
      <ChertezhSkhemy
        skhema={skhema}
        t={skhema.nachalo}
        vid={VID_ISHODNYY}
        sost={sost}
        opisanie={SLOVA.chertezh}
        dolyaVysoty={0.62}
        maxVysota={340}
      />
    </div>
  );
}

const NET: readonly string[] = [];

function Uslovie({ task: z }: { task: Zadacha18; nomer: number; shagi: Shagi | null }) {
  return (
    <div className="ptask__text z18-tr">
      <div className="z18-tr__karta">
        <div className="ptask__question z18-tr__uslovie">
          <p dangerouslySetInnerHTML={{ __html: z.uslovieHtml }} />
          <p>
            <span className="z18-tr__punkt">{SLOVA.punktA}</span>{' '}
            <span dangerouslySetInnerHTML={{ __html: z.aHtml }} />
          </p>
          <p>
            <span className="z18-tr__punkt">{SLOVA.punktB}</span>{' '}
            <span dangerouslySetInnerHTML={{ __html: z.bHtml }} />
          </p>
          <p className="z18-tr__proverka">{SLOVA.proverka}</p>
        </div>
        <Chertezh z={z} lit={NET} />
      </div>
    </div>
  );
}

function otkryt<T>(z: Zadacha18, tekst: string): T {
  return JSON.parse(otkrytTekst18(z.key, tekst, z.seal)) as T;
}

/** Разбор: пункты а) и б) по шагам; открытый шаг подсвечивает чертёж. */
function Razbor({ task: z }: { task: Zadacha18 }) {
  const r = useMemo(() => otkryt<{ a: ShagRazbora18[]; b: ShagRazbora18[] }>(z, z.razbor), [z]);
  const shagi = [
    ...r.a.map((s, i) => ({ ...s, id: `a${i}`, punkt: i === 0 ? SLOVA.razborA : null })),
    ...r.b.map((s, i) => ({ ...s, id: `b${i}`, punkt: i === 0 ? SLOVA.razborB : null })),
  ];
  const [active, setActive] = useState<string | null>(shagi[0]?.id ?? null);
  const lit = shagi.find((s) => s.id === active)?.gruppy ?? NET;
  return (
    <div className="z18-tr__razbor">
      <Chertezh z={z} lit={lit} />
      <ol className="z18-tr__shagi">
        {shagi.map((s) => (
          <li key={s.id} className={clsx(active === s.id && 'is-active')}>
            {s.punkt === null ? null : <p className="z18-tr__razbor-punkt">{s.punkt}</p>}
            <button
              type="button"
              className="z18-tr__shag"
              aria-pressed={active === s.id}
              onClick={() => setActive(active === s.id ? null : s.id)}
            >
              <span dangerouslySetInnerHTML={{ __html: s.html }} />
              <span className="z18-tr__shag-hint">
                {active === s.id ? SLOVA.naChertezhe : SLOVA.pokazat}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Podskazka({
  task: z,
  shagi,
  setShagi,
  onMiss,
  onDone,
}: {
  task: Zadacha18;
  shagi: Shagi;
  setShagi: (next: Shagi) => void;
  onMiss: () => void;
  onDone: () => void;
}) {
  const voprosy = useMemo(() => otkryt<ShagVoprosa[]>(z, z.podskazka), [z]);
  return (
    <ShagiVoprosy
      shagi={voprosy}
      sost={shagiSost(shagi)}
      onChange={(next) => setShagi({ ...next })}
      onMiss={onMiss}
      onDone={onDone}
      slova={{ shag: SLOVA.shag, neverno: SLOVA.neverno, vse: SLOVA.vseShagi }}
    />
  );
}

function Otvet({
  value,
  onChange,
  proverka,
  disabled,
  labelId,
}: {
  task: Zadacha18;
  value: string;
  onChange: (v: string) => void;
  proverka: 'right' | 'wrong' | null;
  disabled: boolean;
  labelId: string;
}) {
  return (
    <Input
      className="ttask__input z18-tr__input"
      value={value}
      state={proverka === null ? 'default' : proverka === 'right' ? 'success' : 'error'}
      inputMode="decimal"
      autoComplete="off"
      aria-labelledby={labelId}
      readOnly={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

/** Строка → неотрицательное целое: выбор варианта похожей задачи. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
}

/** Карточка №18 над банком, собранным на сервере страницы. */
export function kartochka18(bank: readonly Zadacha18[]): KartochkaRazdela<Zadacha18> {
  const poKlyuchu = new Map(bank.map((z) => [z.key, z]));

  function sobrat(key: string, seed: string, pohozhaya: number): Zadacha18 | null {
    const z = poKlyuchu.get(key);
    if (z === undefined) return null;
    if (pohozhaya === 0) return z;
    /* Похожая — другой вариант того же типа. */
    const drugie = bank.filter((x) => x.tip === z.tip && x.key !== z.key);
    return drugie[hash(seed) % Math.max(1, drugie.length)] ?? z;
  }

  return {
    zagruzit: async () => {
      const { osnovaSeed } = await import('@/lib/trenazher/sessiya');
      return {
        postroit: (payload, at, pohozhaya) => {
          const item = payload.items[at];
          return item === undefined
            ? null
            : sobrat(item.k, osnovaSeed(payload, at, pohozhaya), pohozhaya);
        },
      };
    },
    html: (z) => `${z.uslovieHtml} ${z.bHtml}`,
    Uslovie,
    Otvet,
    proverit: (z, value) => otvetVeren18(z.key, value, z.seal),
    estPodskazka: () => true,
    /* Подсказка ведёт к ответу, но числа не называет: его вводит ученик. */
    otvetPosleShagov: true,
    Podskazka,
    estRazbor: () => true,
    Razbor,
    zapisat: (key, itog) => {
      const k = poKlyuchu18(key);
      if (k === null) return;
      trenazher18.recordAttempt({
        kind: k.tip,
        taskId: key,
        right: itog.right,
        clean: itog.clean,
        seconds: itog.sek,
        ishod: itog.ishod,
        itog: itog.right ? 'right' : 'wrong',
      });
    },
  };
}
