/**
 * План тренировки №13: какие задачи и на каких seed.
 *
 * Модуль лёгкий: реестр прототипов и банк приходят со страницы
 * (собраны на сборке), движок задач здесь не нужен — экран выбора
 * его не везёт. Задачи по плану собирает trenazher/zadacha.ts, он
 * подгружается при старте тренировки.
 */

import { rngOf } from '../../vychisleniya/rng';
import type { Difficulty, TypeCode } from '../types';

/** Что тренируем: одна схема, все схемы или «Определи тип». */
export type Chto13 = TypeCode | 'all' | 'tip';
/** «Ответ» — как на ЕГЭ; «С оформлением» — схема, первая строка таблицы, шаги, ответ. */
export type Rezhim13 = 'otvet' | 'oformlenie';
export type Istochnik13 = 'bank' | 'mix' | 'new';
export type Uroven13 = 'base' | 'all';

export interface Nastroyki13 {
  chto: Chto13;
  rezhim: Rezhim13;
  count: number;
  uroven: Uroven13;
  istochnik: Istochnik13;
  /** Только прототипы, в которых были ошибки. */
  oshibki: boolean;
}

export const NASTROYKI_13: Nastroyki13 = {
  chto: 'A',
  rezhim: 'otvet',
  count: 10,
  uroven: 'base',
  istochnik: 'mix',
  oshibki: false,
};

export const KOLICHESTVO_13 = [5, 10, 20] as const;

/** Прототип для плана: без движка. */
export interface ProtoPlan {
  id: string;
  type: TypeCode;
  difficulty: Difficulty;
}

/** Задача плана: прототип, seed и откуда она. */
export interface ZadachaPlan13 {
  prototypeId: string;
  seed: string;
  istochnik: 'bank' | 'new';
  vid: 'zadachi' | 'tip';
}

/** Ключ задачи в хранилище прогресса: «A-01|b3». */
export function klyuch13(z: { prototypeId: string; seed: string }): string {
  return `${z.prototypeId}|${z.seed}`;
}

export function prototipKlyucha13(key: string): string {
  return key.split('|')[0] ?? '';
}

/** Прототипы, которые попадают в тренировку по выбору. Таблицы руками (P-…) — в опорных задачах. */
export function prototipyDlya(
  n: Nastroyki13,
  protos: readonly ProtoPlan[],
  oshibki: readonly string[],
): ProtoPlan[] {
  return protos.filter(
    (p) =>
      !p.id.startsWith('P-') &&
      (n.chto === 'all' || n.chto === 'tip' || p.type === n.chto) &&
      (n.uroven === 'all' || p.difficulty === 'base') &&
      (!n.oshibki || oshibki.includes(p.id)),
  );
}

/** Seed новой задачи: «n» и случайный хвост от seed плана. */
function novyy(seed: string, i: number): string {
  return `n${seed}-${i}`;
}

/**
 * План: задачи по кругу по перемешанным прототипам, у каждого — свой
 * seed банка (без повторов) или новый. В режиме «Банк + новые» задачи
 * чередуются. Пустой выбор — пустой план.
 */
export function planTrenirovki13(
  n: Nastroyki13,
  protos: readonly ProtoPlan[],
  bank: readonly (readonly [string, string])[],
  oshibki: readonly string[],
  seed: string,
): ZadachaPlan13[] {
  const vybor = prototipyDlya(n, protos, oshibki);
  if (vybor.length === 0) {
    return [];
  }
  const r = rngOf(`z13-plan|${seed}`);
  const poryadok = r.sample(vybor, vybor.length);
  const seeds = new Map(
    poryadok.map((p) => [
      p.id,
      r.sample(
        bank.filter(([id]) => id === p.id).map(([, s]) => s),
        bank.filter(([id]) => id === p.id).length,
      ),
    ]),
  );
  const vid = n.chto === 'tip' ? 'tip' : 'zadachi';
  const out: ZadachaPlan13[] = [];
  for (let i = 0; out.length < n.count && i < n.count * 4; i += 1) {
    const p = poryadok[i % poryadok.length];
    if (p === undefined) break;
    const izBanka = n.istochnik === 'bank' || (n.istochnik === 'mix' && out.length % 2 === 0);
    const svoi = seeds.get(p.id) ?? [];
    const s = izBanka ? svoi.shift() : novyy(seed, i);
    if (s === undefined) {
      if (n.istochnik === 'bank') continue;
      out.push({ prototypeId: p.id, seed: novyy(seed, i), istochnik: 'new', vid });
      continue;
    }
    out.push({ prototypeId: p.id, seed: s, istochnik: izBanka ? 'bank' : 'new', vid });
  }
  return out;
}
