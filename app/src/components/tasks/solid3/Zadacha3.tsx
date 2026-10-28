'use client';

import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { Chertezh3 } from '@/components/chertezh3/Chertezh3';
import { ZhivoyChertezh3d } from '@/components/stereo/ZhivoyChertezh3d';
import type { Model } from '@/lib/solid/model';
import { ORTHO_AZIMUTH, ORTHO_ELEVATION } from '@/lib/solid/project';
import { ShagiVoprosy, shagiSost } from '@/components/trenazher/ShagiVoprosy';
import type { KartochkaRazdela, Shagi } from '@/components/trenazher/types';
import { FigureZoom, Input } from '@/components/ui';
import type { Scenariy } from '@/lib/chertezh3/scenariy';
import { otkrytPodskazku } from '@/lib/veroyatnost/razbor';
import type { Pool, PoolKind, PoolVariant } from '@/lib/zadanie3/pool';
import { recordTask } from '@/lib/zadanie3/progress';
import { answerMatches, openText } from '@/lib/zadanie3/secret';
import { klyuch3, poKlyuchu3 } from '@/lib/zadanie3/trenazher/filtry3';

/**
 * Карточка задачи №3 в общем тренажёре (components/trenazher/):
 * прототип и метка открытого банка, условие с чертежом (у
 * многогранников — живой чертёж), ответ числом, подсказка вопросами
 * по шагам и разбор, шаги которого подсвечивают элементы чертежа.
 * Условия и чертежи готовы на сборке (lib/zadanie3/pool.ts); ответ,
 * подсказка и разбор закрыты отпечатком и раскрываются по требованию.
 */

/** Задача тренировки: прототип и вариант из банка. */
export interface Zadacha3 {
  key: string;
  kind: PoolKind;
  variant: PoolVariant;
}

const SLOVA = {
  risunok: 'Чертёж к задаче',
  fipi: (nomera: readonly string[]) => `Задача ФИПИ № ${nomera.join(', ')}`,
  shag: (i: number, n: number) => `Шаг ${i} из ${n}`,
  neverno: 'Не то — подумайте ещё.',
  vseShagi: 'Все шаги пройдены — посчитайте ответ и впишите его в поле.',
  naChertezhe: 'на чертеже',
  pokazat: 'показать на чертеже',
};

/* Набор формул KaTeX: приезжает вместе с банком по «Начать» (zagruzit).
   Подсказки и разборы банк хранит текстом с формулами $…$. */
let nabor: ((text: string) => string) | null = null;
const tex = (text: string) => (nabor === null ? text : nabor(text));

const PODSKAZKI = new WeakMap<PoolVariant, ReturnType<typeof otkrytPodskazku> | null>();
function podskazka(v: PoolVariant) {
  if (!PODSKAZKI.has(v)) {
    PODSKAZKI.set(
      v,
      v.podskazka === null
        ? null
        : otkrytPodskazku(v.podskazka, v.seal).map((h) => ({
            question: tex(h.question),
            options: h.options.map(tex),
            correct: h.correct,
            comment: h.comment === null ? null : tex(h.comment),
          })),
    );
  }
  return PODSKAZKI.get(v) ?? null;
}

const SCENY = new WeakMap<PoolVariant, Scenariy>();
function scena(v: PoolVariant): Scenariy | null {
  if (v.scena === null) return null;
  let s = SCENY.get(v);
  if (s === undefined) {
    s = JSON.parse(openText(v.scena, v.seal)) as Scenariy;
    SCENY.set(v, s);
  }
  return s;
}

/** Чертёж задачи: живой у многогранников, иначе готовый SVG. */
function Chertezh({ z, podsvetka }: { z: Zadacha3; podsvetka: string[] | null }) {
  const sc = scena(z.variant);
  if (sc !== null && z.kind.podpisiHtml !== null) {
    return (
      <Chertezh3
        className="z3t__fig z3t__fig--3d"
        scenariy={sc}
        podpisiHtml={z.kind.podpisiHtml}
        podsvetka={podsvetka}
      />
    );
  }
  const m = model(z);
  const svg = z.variant.svg ?? z.kind.svg;
  if (m === null) {
    return (
      <FigureZoom className="z3t__fig" label={`${SLOVA.risunok}: ${z.kind.titlePlain}`}>
        <span dangerouslySetInnerHTML={{ __html: svg }} />
      </FigureZoom>
    );
  }
  /* Тела вращения: живой чертёж движка lib/solid — первый кадр готов,
     движок приезжает по первому касанию. */
  return (
    <ZhivoyChertezh3d
      className="z3t__fig z3t__fig--3d"
      model={m}
      svg={svg}
      azimuth={m.rakurs?.azimuth ?? ORTHO_AZIMUTH}
      elevation={m.rakurs?.elevation ?? ORTHO_ELEVATION}
      podpisi={[]}
    />
  );
}

/* Модель чертежа тела вращения: разбирается один раз на вариант. */
const MODELI = new WeakMap<object, Model | null>();
function model(z: Zadacha3): Model | null {
  let m = MODELI.get(z.variant);
  if (m === undefined) {
    const json = z.variant.model ?? z.kind.model;
    m = json === '' ? null : (JSON.parse(json) as Model);
    MODELI.set(z.variant, m);
  }
  return m;
}

function Uslovie({ task: z }: { task: Zadacha3; nomer: number; shagi: Shagi | null }) {
  const fipi = z.variant.fipi;
  return (
    <div className="ptask__text z3t">
      {/* Прототип и источник — в шапке общей карточки; здесь — номер в открытом банке. */}
      {fipi.length > 0 ? (
        <p className="z3t__count">
          <span className="z3t__metka is-fipi">{SLOVA.fipi(fipi)}</span>
        </p>
      ) : null}
      <div className="z3t__card">
        <div
          className="ptask__question z3t__question"
          dangerouslySetInnerHTML={{ __html: z.variant.uslovieHtml }}
        />
        <Chertezh z={z} podsvetka={null} />
      </div>
    </div>
  );
}

/**
 * Разбор по шагам. У живого чертежа шаг — кнопка: открытый шаг
 * подсвечивает на чертеже свои элементы, остальное приглушается.
 */
function Razbor({ task: z }: { task: Zadacha3 }) {
  const steps = useMemo(() => openText(z.variant.steps, z.variant.seal).split('\n').map(tex), [z]);
  const refs = useMemo(
    () =>
      z.variant.stepRefs === null
        ? null
        : (JSON.parse(openText(z.variant.stepRefs, z.variant.seal)) as string[][]),
    [z],
  );
  const [active, setActive] = useState<number | null>(refs === null ? null : 0);
  if (refs === null) {
    return (
      <ol className="z3t__steps">
        {steps.map((text, i) => (
          /* Шаг набран KaTeX в браузере (tex): в банке — текст с формулами. */
          <li key={i} dangerouslySetInnerHTML={{ __html: text }} />
        ))}
      </ol>
    );
  }
  return (
    <div className="z3t__razbor">
      <Chertezh z={z} podsvetka={active === null ? null : (refs[active] ?? null)} />
      <ol className="z3t__steps z3t__steps--live">
        {steps.map((text, i) => {
          const est = (refs[i]?.length ?? 0) > 0;
          return (
            <li key={i} className={clsx(active === i && 'is-active')}>
              <button
                type="button"
                className="z3t__step"
                aria-pressed={active === i}
                onClick={() => setActive(active === i ? null : i)}
              >
                <span dangerouslySetInnerHTML={{ __html: text }} />
                {est ? (
                  <span className="z3t__step-hint">
                    {active === i ? SLOVA.naChertezhe : SLOVA.pokazat}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
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
  task: Zadacha3;
  shagi: Shagi;
  setShagi: (next: Shagi) => void;
  onMiss: () => void;
  onDone: () => void;
}) {
  return (
    <ShagiVoprosy
      shagi={podskazka(z.variant) ?? []}
      sost={shagiSost(shagi)}
      onChange={(next) => setShagi({ ...next })}
      onMiss={onMiss}
      onDone={onDone}
      slova={{ shag: SLOVA.shag, neverno: SLOVA.neverno, vse: SLOVA.vseShagi }}
    />
  );
}

/**
 * Карточка №3 над банком тренажёра. Банк (условия, чертежи, закрытые
 * ответы и разборы) на странице не лежит: он приезжает одним файлом по
 * «Начать тренировку» вместе с KaTeX — zagruzitBank.
 */
export function kartochka3(zagruzitBank: () => Promise<Pool>): KartochkaRazdela<Zadacha3> {
  let pool: Pool | null = null;
  let byId = new Map<string, PoolKind>();

  function Otvet({
    task: z,
    value,
    onChange,
    proverka,
    disabled,
    labelId,
  }: {
    task: Zadacha3;
    value: string;
    onChange: (v: string) => void;
    proverka: 'right' | 'wrong' | null;
    disabled: boolean;
    labelId: string;
  }) {
    return (
      <>
        <Input
          className="ttask__input z3t__input"
          value={value}
          state={proverka === null ? 'default' : proverka === 'right' ? 'success' : 'error'}
          inputMode="decimal"
          autoComplete="off"
          aria-labelledby={labelId}
          readOnly={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
        {z.kind.format === 'на-пи' ? (
          <p className="z3t__hint" dangerouslySetInnerHTML={{ __html: pool?.piHintHtml ?? '' }} />
        ) : null}
      </>
    );
  }

  /** Задача по ключу; похожая — другой вариант того же прототипа. */
  function sobrat(key: string, seed: string, pohozhaya: number): Zadacha3 | null {
    const k = poKlyuchu3(key);
    const kind = k === null ? undefined : byId.get(k.id);
    if (k === null || kind === undefined) return null;
    let variant = kind.variants.find((v) => v.n === k.n);
    if (variant === undefined) return null;
    if (pohozhaya > 0) {
      const drugie = kind.variants.filter((v) => v.n !== k.n);
      variant = drugie[hash(seed) % Math.max(1, drugie.length)] ?? variant;
    }
    return { key: klyuch3(kind.id, variant.n), kind, variant };
  }

  return {
    zagruzit: async () => {
      /* Банк, KaTeX и seed похожей — по «Начать»: на странице их нет. */
      const [{ osnovaSeed }, { typeset }, bank] = await Promise.all([
        import('@/lib/trenazher/sessiya'),
        import('@/lib/tex'),
        zagruzitBank(),
      ]);
      nabor = typeset;
      pool = bank;
      byId = new Map(bank.kinds.map((k) => [k.id, k]));
      return {
        postroit: (payload, at, pohozhaya) => {
          const item = payload.items[at];
          return item === undefined
            ? null
            : sobrat(item.k, osnovaSeed(payload, at, pohozhaya), pohozhaya);
        },
      };
    },
    html: (z) => z.variant.uslovieHtml,
    Uslovie,
    Otvet,
    proverit: (z, value) => answerMatches(value, z.variant.seal, z.key),
    estPodskazka: (z) => (podskazka(z.variant)?.length ?? 0) > 0,
    /* Подсказка ведёт к ответу, но числа не называет: его вводит ученик. */
    otvetPosleShagov: true,
    Podskazka,
    estRazbor: () => true,
    Razbor,
    /* Статистика — по задаче, которую решали: у похожей свой вариант,
       но ключ места тренировки — исходный. Счёт идёт на прототип. */
    zapisat: (key, itog) => {
      const k = poKlyuchu3(key);
      if (k !== null) recordTask(k.id, k.n, itog.clean, itog.sek, itog.right);
    },
  };
}

/** Строка → неотрицательное целое: выбор варианта похожей задачи по seed. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
