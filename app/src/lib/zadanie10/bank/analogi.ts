/**
 * Подбор аналогов задания №10: по 20 на прототип.
 *
 * Правила (как у банков №1 и №9):
 *   — ответ ЕГЭ: положительный, целый или конечная десятичная дробь
 *     (не больше трёх знаков после запятой);
 *   — у 20 аналогов не меньше 12 разных ответов, ни один не встречается
 *     больше двух раз (исключения — ISKLYUCHENIYA, с причиной);
 *   — нет двух задач с одинаковым отпечатком (прототип + числа), в том
 *     числе совпадений с задачами ФИПИ;
 *   — половина аналогов (10 из 20) — современные сюжеты;
 *   — величины в правдоподобных пределах (fizika сюжета).
 *
 * Подбор детерминированный (rngOf('z10-analog-<id>')): запуск
 * `pnpm build:bank-10` перезаписывает data/zadanie10/analogi.json, а
 * самотест сверяет файл с повторным подбором.
 */

import { rngOf } from '../../vychisleniya/rng';
import { prototype } from '../prototypes';
import type { BankItem, Params } from '../types';
import { G_P01, G_P02, G_P03, G_P04, G_P05, G_P06, G_P07, G_P08, G_P09, G_P10 } from './syuzhety1';
import { G_P11, G_P12, G_P13, G_P14, G_P15, G_P16, G_P17 } from './syuzhety2';
import { G_P18, G_P19, G_P20, G_P21, G_P30, G_P31, G_P32 } from './syuzhety3';
import { G_P22, G_P23, G_P24, G_P25 } from './syuzhety4';
import { G_P26, G_P27, G_P28, G_P29, G_P33, G_P34 } from './syuzhety5';
import type { GeneratorAnalogov } from './syuzhet-tip';

export const ANALOGOV = 20;
export const SOVREMENNYH = 10;
export const RAZNYH_OTVETOV = 12;
export const POVTOROV_OTVETA = 2;
/** Сколько кандидатов перебирать на прототип. */
const KANDIDATOV = 40_000;

export const GENERATORY: Record<string, GeneratorAnalogov> = {
  P01: G_P01,
  P02: G_P02,
  P03: G_P03,
  P04: G_P04,
  P05: G_P05,
  P06: G_P06,
  P07: G_P07,
  P08: G_P08,
  P09: G_P09,
  P10: G_P10,
  P11: G_P11,
  P12: G_P12,
  P13: G_P13,
  P14: G_P14,
  P15: G_P15,
  P16: G_P16,
  P17: G_P17,
  P18: G_P18,
  P19: G_P19,
  P20: G_P20,
  P21: G_P21,
  P22: G_P22,
  P23: G_P23,
  P24: G_P24,
  P25: G_P25,
  P26: G_P26,
  P27: G_P27,
  P28: G_P28,
  P29: G_P29,
  P30: G_P30,
  P31: G_P31,
  P32: G_P32,
  P33: G_P33,
  P34: G_P34,
};

export interface PravilaOtvetov {
  minRaznyh: number;
  maxPovtor: number;
}

/**
 * Прототипы, которые объективно не дотягивают до 12 разных ответов из
 * 20: ответ — табличный угол, и других значений у него быть не может.
 */
export const ISKLYUCHENIYA: Record<string, PravilaOtvetov & { prichina: string }> = {
  P26: {
    minRaznyh: 2,
    maxPovtor: 10,
    prichina:
      'наименьший угол броска при $\\sin\\alpha\\ge s$ с рациональным $s=\\frac{tg}{2v_0}$ бывает только $30^\\circ$ ($s=\\frac12$) или $90^\\circ$ ($s=1$): синусы $45^\\circ$ и $60^\\circ$ иррациональны',
  },
  P28: {
    minRaznyh: 4,
    maxPovtor: 5,
    prichina:
      '$\\sin^2\\alpha=\\frac{Q}{mv^2}$ рационально, табличных значений четыре ($\\frac14,\\frac12,\\frac34,1$) — ответы $2\\alpha=60^\\circ,90^\\circ,120^\\circ,180^\\circ$',
  },
  P29: {
    minRaznyh: 3,
    maxPovtor: 8,
    prichina:
      'для острого угла $\\cos2\\alpha$ — рациональное табличное: $\\frac12,0,-\\frac12$, ответы только $30^\\circ$, $45^\\circ$, $60^\\circ$',
  },
  P33: {
    minRaznyh: 10,
    maxPovtor: 5,
    prichina:
      'в форме «наименьший угол» $\\sin\\varphi=\\frac{k\\lambda}{d}$ рационален, поэтому угол — только $30^\\circ$ или $90^\\circ$; разнообразие ответов дают задачи на наименьший период решётки',
  },
};

export function pravila(id: string): PravilaOtvetov {
  return ISKLYUCHENIYA[id] ?? { minRaznyh: RAZNYH_OTVETOV, maxPovtor: POVTOROV_OTVETA };
}

/** Ответ ЕГЭ: положительный, целый или конечная дробь с ≤ 3 знаками. */
export function otvetEge(x: number): boolean {
  return (
    Number.isFinite(x) && x > 0 && Math.abs(x * 1000 - Math.round(x * 1000)) < 1e-7 && x < 100_000
  );
}

/** Отпечаток задачи: прототип + числа условия (без имён и слов сюжета). */
export function otpechatok(protoId: string, p: Params): string {
  const chisla = Object.values(p)
    .filter((v) => typeof v === 'number')
    .map((v) => String(Math.round(Number(v) * 1e6) / 1e6))
    .sort();
  return `${protoId}|${chisla.join(';')}`;
}

/** Подобрать аналоги прототипа. fipi — задачи ФИПИ (их отпечатки заняты). */
export function podobratAnalogi(protoId: string, fipi: readonly BankItem[]): BankItem[] {
  const g = GENERATORY[protoId];
  if (g === undefined) {
    throw new Error(`нет генератора аналогов ${protoId}`);
  }
  const proto = prototype(protoId);
  const prav = pravila(protoId);
  const r = rngOf(`z10-analog-${protoId}`);
  const zanyato = new Set(
    fipi.filter((f) => f.prototypeId === protoId).map((f) => otpechatok(protoId, f.params)),
  );
  const otvety = new Map<number, number>();
  const out: BankItem[] = [];
  const sovr = g.syuzhety.filter((s) => s.modern);
  const klass = g.syuzhety.filter((s) => !s.modern);
  const okOtvet = g.okOtvet ?? otvetEge;
  const nuzhnoRaznyh = Math.min(prav.minRaznyh, ANALOGOV);

  for (let i = 0; i < KANDIDATOV && out.length < ANALOGOV; i += 1) {
    const modern = out.length % 2 === 1;
    const spisok = modern ? sovr : klass;
    /* Сюжеты по кругу, чтобы каждый встретился. */
    const s = spisok[Math.floor(out.length / 2) % spisok.length];
    if (s === undefined) {
      throw new Error(`${protoId}: нет ${modern ? 'современных' : 'классических'} сюжетов`);
    }
    const sgen = g.gen(r, s);
    if (sgen === null) {
      continue;
    }
    const params: Params = { ...(s.params ?? {}), ...sgen };
    let answer: number;
    try {
      answer = proto.solve(params).answer;
    } catch {
      continue;
    }
    if (!okOtvet(answer) || !g.fizika(params, answer)) {
      continue;
    }
    const a = Math.round(answer * 1e9) / 1e9;
    const sk = otvety.get(a) ?? 0;
    if (sk >= prav.maxPovtor) {
      continue;
    }
    /* Пока разных ответов меньше нужного — берём только новые. */
    if (sk > 0 && otvety.size < nuzhnoRaznyh && i < KANDIDATOV / 2) {
      continue;
    }
    const fp = otpechatok(protoId, params);
    if (zanyato.has(fp)) {
      continue;
    }
    zanyato.add(fp);
    otvety.set(a, sk + 1);
    const no = String(out.length + 1).padStart(2, '0');
    out.push({
      id: `${protoId}-a${no}`,
      prototypeId: protoId,
      source: 'analog',
      text: s.text(params),
      params,
      answer: a,
      plot: s.plot,
      modern: s.modern,
    });
  }
  return out;
}
