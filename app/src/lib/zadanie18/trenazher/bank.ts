/**
 * Банк тренажёра №18 — собирается на сервере страницы: условия
 * набраны KaTeX, ответ — отпечатком, подсказка и разбор закрыты им же.
 * Открытые ответы (content/zadanie18/trenazher.ts) в браузер не уходят.
 */

import type { ShagVoprosa } from '@/components/trenazher/ShagiVoprosy';
import { GRUPPY_18 } from '@/content/zadanie18/tipy';
import { SOBRANNYE } from '@/content/zadanie18/spisok';
import { TIPY_18 } from '@/content/zadanie18/trenazher';
import type { TrenazherConfig, Uroven, ZadachaRef } from '@/lib/trenazher/types';
import type { Parametry } from './sceny';
import { klyuch18, zapechatatOtvet18, zapechatatTekst18 } from './otvet';

/** Шаг разбора в браузере: HTML и группы подсветки чертежа. */
export interface ShagRazbora18 {
  html: string;
  gruppy: readonly string[];
}

/** Задача банка, как её видит браузер. */
export interface Zadacha18 {
  key: string;
  tip: string;
  /** Номер схемы и её название — в шапке задачи. */
  skhemaNo: number;
  p: Parametry;
  uslovieHtml: string;
  aHtml: string;
  bHtml: string;
  seal: string;
  /** JSON { a: ShagRazbora18[], b: ShagRazbora18[] }, закрыт отпечатком. */
  razbor: string;
  /** JSON ShagVoprosa[] (HTML), закрыт отпечатком. */
  podskazka: string;
  /** Ответ пункта б) строкой («3,6»), закрыт отпечатком: его открывает лист учителя генератора. */
  otvet: string;
  /** Уровень ★–★★★ и тема (группа схемы) — для генератора листов. */
  uroven: Uroven;
}

/** Ответ числом в запись листа: десятичная запятая. */
export const zapisOtveta18 = (x: number): string =>
  String(Math.round(x * 1e6) / 1e6).replace('.', ',');

/** Детерминированная перестановка вариантов ответа подсказки: верный не всегда первый. */
function peremeshat(s: ShagVoprosa, zerno: string): ShagVoprosa {
  let h = 2166136261;
  for (let i = 0; i < zerno.length; i += 1) h = Math.imul(h ^ zerno.charCodeAt(i), 16777619) >>> 0;
  const idx = s.options.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i -= 1) {
    h = Math.imul(h ^ (i + 7), 16777619) >>> 0;
    const j = h % (i + 1);
    [idx[i], idx[j]] = [idx[j]!, idx[i]!];
  }
  return { ...s, options: idx.map((i) => s.options[i]!), correct: idx.indexOf(s.correct) };
}

export function bank18(typeset: (t: string) => string): Zadacha18[] {
  return TIPY_18.flatMap((t) => {
    const skhemaNo = SOBRANNYE.find((s) => s.id === t.skhema)?.no ?? 0;
    return t.varianty.map((p, i) => {
      const key = klyuch18(t.id, i + 1);
      const tx = t.tekst(p);
      const seal = zapechatatOtvet18(key, t.otvet(p));
      const shag = (s: { tekst: string; gruppy: readonly string[] }) => ({
        html: typeset(s.tekst),
        gruppy: s.gruppy,
      });
      const razbor = JSON.stringify({ a: t.reshenieA(p).map(shag), b: t.reshenieB(p).map(shag) });
      const podskazka = JSON.stringify(
        t.podskazka(p).map((s, k) => {
          const m = peremeshat(s, `${key}/${k}`);
          return {
            question: typeset(m.question),
            options: m.options.map(typeset),
            correct: m.correct,
            comment: m.comment === null ? null : typeset(m.comment),
          };
        }),
      );
      return {
        key,
        tip: t.id,
        skhemaNo,
        p,
        uslovieHtml: typeset(tx.uslovie),
        aHtml: typeset(tx.a),
        bHtml: typeset(tx.b),
        seal,
        razbor: zapechatatTekst18(key, razbor, seal),
        podskazka: zapechatatTekst18(key, podskazka, seal),
        otvet: zapechatatTekst18(key, zapisOtveta18(t.otvet(p)), seal),
        uroven: t.uroven,
      };
    });
  });
}

const UROVNI: { uroven: Uroven; words: string }[] = [
  { uroven: 1, words: 'одна схема, короткое решение' },
  { uroven: 2, words: 'схема и вычисление в несколько шагов' },
  { uroven: 3, words: 'две схемы или неочевидное построение' },
];

/** Конфиг фильтров: темы — группы схем, чипы — ключевые схемы, у которых есть задачи. */
export function trenazherConfig18(): TrenazherConfig {
  const skhemy = new Set(TIPY_18.map((t) => t.skhema));
  return {
    razdel: '18',
    scope: '18',
    temy: GRUPPY_18.map((g) => ({
      id: g.id,
      title: g.title,
      short: g.title.charAt(0).toLowerCase() + g.title.slice(1),
      podtipy: SOBRANNYE.filter((s) => s.gruppa === g.id && skhemy.has(s.id)).map((s) => ({
        id: s.id,
        code: `Схема ${s.no}`,
        title: s.nazvanie,
      })),
    })).filter((t) => t.podtipy.length > 0),
    urovni: UROVNI,
    istochnik: false,
  };
}

export function zadachi18(): ZadachaRef[] {
  return TIPY_18.flatMap((t) =>
    t.varianty.map((_, i) => ({
      key: klyuch18(t.id, i + 1),
      podtip: t.skhema,
      uroven: t.uroven,
      istochnik: 'new' as const,
    })),
  );
}
