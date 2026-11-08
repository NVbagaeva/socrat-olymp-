/**
 * Подбор аналогов задания №7: по 20 на прототип.
 *
 * Правила (как у банков №9 и №10):
 *   — ответ для бланка: целое или конечная десятичная дробь (не больше
 *     двух знаков после запятой), по модулю меньше 1000;
 *   — у 20 аналогов не меньше 12 разных ответов, ни один не встречается
 *     больше двух раз (исключения — ISKLYUCHENIYA, с причиной);
 *   — нет двух одинаковых уравнений с точностью до перестановки
 *     слагаемых и частей (отпечаток), в том числе совпадений с ФИПИ;
 *   — ответ решателя совпадает с независимым численным пересчётом;
 *   — у иррациональных и логарифмических — часть аналогов с
 *     посторонним корнем (П-09, П-13, П-30; генератор чередует случаи).
 *
 * После 20 подобранных — задачи листа учителя, которых нет в открытом
 * банке (IZ_LISTA): параметры записаны вручную, номера идут дальше
 * (P18-a21 …), условие собирает прототип, ответ — решатель с той же
 * численной сверкой. Правила разнообразия ответов к ним не относятся.
 *
 * Подбор детерминированный (rngOf('z7-analog-<id>')): запуск
 * `pnpm build:bank-7` перезаписывает data/zadanie7/analogi.json, а
 * самотест сверяет файл с повторным подбором.
 */

import { rngOf } from '../../vychisleniya/rng';
import { otvetChislenno } from '../proverka';
import { prototype } from '../prototypes';
import type { BankItem, Params, Prototype } from '../types';
import { GENERATORY } from './generatory';

export { GENERATORY };

export const ANALOGOV = 20;
export const RAZNYH_OTVETOV = 12;
export const POVTOROV_OTVETA = 2;
/** Сколько кандидатов перебирать на прототип. */
const KANDIDATOV = 60_000;

export interface PravilaOtvetov {
  minRaznyh: number;
  maxPovtor: number;
}

/** Прототипы, которым объективно не набрать 12 разных ответов. Пока таких нет. */
export const ISKLYUCHENIYA: Record<string, PravilaOtvetov & { prichina: string }> = {};

export function pravila(id: string): PravilaOtvetov {
  return ISKLYUCHENIYA[id] ?? { minRaznyh: RAZNYH_OTVETOV, maxPovtor: POVTOROV_OTVETA };
}

/** Ответ для бланка ЕГЭ: целое или конечная десятичная дробь, |x| < 1000. */
export function otvetEge(x: number, znakov = 2): boolean {
  const k = 10 ** znakov;
  return Number.isFinite(x) && Math.abs(x) < 1000 && Math.abs(x * k - Math.round(x * k)) < 1e-7;
}

/**
 * Отпечаток уравнения: прототип + две части уравнения в каноническом
 * порядке слагаемых (параметр `por` не учитывается), части — по
 * алфавиту (у П-35 с нулём справа не учитывается и внешнее основание).
 * Так «$\log_5(x+4)=2$» и «$\log_5(4+x)=2$», а также
 * «$(4x+3)^2=(4x+5)^2$» и «$(4x+5)^2=(4x+3)^2$» — одно уравнение.
 */
export function otpechatok(proto: Prototype, p: Params): string {
  const kanon: Params = { ...p };
  if ('por' in kanon) {
    kanon.por = 'xb';
  }
  /* П-35 с нулём справа: $\log_a(…)=0$ при любом основании a — одно и то же уравнение. */
  if (proto.id === 'P35' && kanon.m === 0) {
    kanon.a = 2;
  }
  const u = proto.uravnenie(kanon);
  const chasti = u.split('=').sort();
  return `${proto.id}|${chasti.join('=')}`;
}

/** Знаменатель сетки для численного пересчёта тригонометрии. */
export function znamTrig(p: Params): number {
  return 24 * (typeof p.k === 'number' ? Math.abs(p.k) : 1);
}

/**
 * Задачи листа учителя (часть 1), которых нет в банке: аналоги
 * прототипа после подобранных 20, «не из открытого банка». Отпечатки
 * заняты заранее — генератор их не повторит.
 */
export const IZ_LISTA: Record<string, Params[]> = {
  /* 36^(x−12) = 1/6 → 11,5; 16^(x−9) = 0,5 → 8,75 */
  P18: [
    { a: 6, s: 2, inv: 0, k: 1, b: -12, por: 'xb', tt: -1 },
    { a: 2, s: 4, inv: 0, k: 1, b: -9, por: 'xb', tt: -1, dec: 1 },
  ],
  /* log_(x−5) 49 = 2, меньший корень → 12 */
  P30: [{ a: -5, N: 49, v: 'menshiy' }],
  /* 3/3ˣ = 1/81 → 5 */
  P31: [{ a: 3, m: 1, b: 0, tt: -4 }],
  /* 4^(x+2) − 2^(x+3) + 1 = 0 → −2 */
  P32: [{ a: 2, p: 2, s: -1, K: 1, q: 3, c: 1, v: 'koren' }],
  /* log₂(2ˣ − 8) = 3 → 4 */
  P33: [{ a: 2, p: 0, b: -8, c: 3 }],
  /* log²₂x + log₂x = 0, меньший корень → 0,5 */
  P34: [{ a: 2, B: 1, C: 0, v: 'menshiy' }],
  /* log₁₃(log₂(log₅x)) = 0 → 25 */
  P35: [{ a: 13, b: 2, c: 5, m: 0 }],
};

/** Сколько аналогов у прототипа: 20 подобранных и задачи листа. */
export function analogovPrototipa(id: string): number {
  return ANALOGOV + (IZ_LISTA[id]?.length ?? 0);
}

/** Подобрать аналоги прототипа. fipi — задачи ФИПИ (их отпечатки заняты). */
export function podobratAnalogi(protoId: string, fipi: readonly BankItem[]): BankItem[] {
  const g = GENERATORY[protoId];
  if (g === undefined) {
    throw new Error(`нет генератора аналогов ${protoId}`);
  }
  const proto = prototype(protoId);
  const prav = pravila(protoId);
  const r = rngOf(`z7-analog-${protoId}`);
  const zanyato = new Set(
    fipi.filter((f) => f.prototypeId === protoId).map((f) => otpechatok(proto, f.params)),
  );
  const izLista = IZ_LISTA[protoId] ?? [];
  for (const params of izLista) {
    const fp = otpechatok(proto, params);
    if (zanyato.has(fp)) {
      throw new Error(`${protoId}: задача листа ${proto.uravnenie(params)} уже есть в банке`);
    }
    zanyato.add(fp);
  }
  const otvety = new Map<number, number>();
  const out: BankItem[] = [];
  /* Сколько ответов можно повторить, чтобы разных осталось не меньше minRaznyh. */
  const mozhnoPovtorov = ANALOGOV - Math.min(prav.minRaznyh, ANALOGOV);
  let povtorov = 0;

  for (let i = 0; i < KANDIDATOV && out.length < ANALOGOV; i += 1) {
    const params = g(r, out.length);
    if (params === null) {
      continue;
    }
    let answer: number;
    try {
      answer = proto.solve(params).answer;
    } catch {
      continue;
    }
    if (!otvetEge(answer)) {
      continue;
    }
    const fp = otpechatok(proto, params);
    if (zanyato.has(fp)) {
      continue;
    }
    const byl = otvety.get(answer) ?? 0;
    if (byl >= prav.maxPovtor || (byl > 0 && povtorov >= mozhnoPovtorov)) {
      continue;
    }
    /* Независимый пересчёт: численный ответ совпадает с решателем. */
    const ch = proto.chisla(params);
    const chisl = otvetChislenno(ch, proto.vopros(params), znamTrig(params));
    if (chisl === null || Math.abs(chisl - answer) > 1e-6) {
      continue;
    }
    zanyato.add(fp);
    otvety.set(answer, byl + 1);
    if (byl > 0) {
      povtorov += 1;
    }
    out.push({
      id: `${protoId}-a${String(out.length + 1).padStart(2, '0')}`,
      prototypeId: protoId,
      source: 'analog',
      text: proto.uslovie(params),
      params,
      answer,
    });
  }
  if (out.length < ANALOGOV) {
    throw new Error(`${protoId}: подобрано ${out.length} аналогов из ${ANALOGOV}`);
  }
  for (const params of izLista) {
    const answer = proto.solve(params).answer;
    const chisl = otvetChislenno(proto.chisla(params), proto.vopros(params), znamTrig(params));
    if (!otvetEge(answer) || chisl === null || Math.abs(chisl - answer) > 1e-6) {
      throw new Error(`${protoId}: задача листа ${proto.uravnenie(params)} — ответ ${answer}`);
    }
    out.push({
      id: `${protoId}-a${String(out.length + 1).padStart(2, '0')}`,
      prototypeId: protoId,
      source: 'analog',
      text: proto.uslovie(params),
      params,
      answer,
    });
  }
  return out;
}
