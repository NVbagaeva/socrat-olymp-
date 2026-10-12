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
 * алфавиту. Так «$\log_5(x+4)=2$» и «$\log_5(4+x)=2$», а также
 * «$(4x+3)^2=(4x+5)^2$» и «$(4x+5)^2=(4x+3)^2$» — одно уравнение.
 */
export function otpechatok(proto: Prototype, p: Params): string {
  const kanon: Params = { ...p };
  if ('por' in kanon) {
    kanon.por = 'xb';
  }
  const u = proto.uravnenie(kanon);
  const chasti = u.split('=').sort();
  return `${proto.id}|${chasti.join('=')}`;
}

/** Знаменатель сетки для численного пересчёта тригонометрии. */
export function znamTrig(p: Params): number {
  return 24 * (typeof p.k === 'number' ? Math.abs(p.k) : 1);
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
  return out;
}
