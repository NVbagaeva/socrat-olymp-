/**
 * Ядро генератора задач задания №11 — без банка.
 *
 * Чистая функция: один seed — одна задача. Генератор подтипа
 * подбирает параметры «от ответа»; задача принимается, только если
 * `solve` получил тот же ответ, ответ положительный и конечный, а
 * параметры не похожи на задачу банка. Банк приходит параметром
 * (список условий без ответов): так ядро работает и в браузере —
 * тренажёру не нужно везти туда bank.json с ответами.
 */

import { nice } from '../num';
import { subtype } from '../prototypes';
import type { Params, Solved } from '../types';
import { rngOf } from '../../vychisleniya/rng';
import { GEN_DP } from './dp';
import { GEN_OK } from './ok';
import { GEN_PG } from './pg';
import { GEN_PR } from './pr';
import { GEN_PT } from './pt';
import { GEN_RB } from './rb';
import { GEN_RZ } from './rz';
import { GEN_SM } from './sm';
import type { Gen } from './types';
import { GEN_VD } from './vd';

export const GENERATORS: Record<string, Gen> = {
  ...GEN_RZ,
  ...GEN_PR,
  ...GEN_SM,
  ...GEN_DP,
  ...GEN_PT,
  ...GEN_VD,
  ...GEN_OK,
  ...GEN_RB,
  ...GEN_PG,
};

/** Сколько попыток подбора на один seed. */
const ATTEMPTS = 3000;

/** Ключ параметров без учёта порядка полей. */
export function paramsKey(id: string, params: Params): string {
  const keys = Object.keys(params).sort();
  return `${id}|${keys.map((k) => `${k}=${String(params[k])}`).join(';')}`;
}

/** Условие задачи банка без ответа: подтип и параметры. */
export interface UslovieBanka {
  id: string;
  params: Params;
}

export type Pohozha = (id: string, params: Params) => boolean;

/**
 * Проверка «похожа ли задача на задачу банка»: совпадает или
 * отличается одним числом при трёх и более параметрах (другая
 * «граница» в ДП-12 — всё та же задача банка).
 */
export function pohozhaNa(items: readonly UslovieBanka[]): Pohozha {
  const zanyato = new Set(items.map((item) => paramsKey(item.id, item.params)));
  const poPodtipam = new Map<string, Params[]>();
  for (const item of items) {
    poPodtipam.set(item.id, [...(poPodtipam.get(item.id) ?? []), item.params]);
  }
  return (id, params) => {
    if (zanyato.has(paramsKey(id, params))) {
      return true;
    }
    const keys = Object.keys(params);
    return (poPodtipam.get(id) ?? []).some((b) => {
      const all = new Set([...keys, ...Object.keys(b)]);
      const numeric = [...all].filter(
        (k) => typeof params[k] === 'number' || typeof b[k] === 'number',
      );
      if (numeric.length < 3) {
        return false;
      }
      const diff = [...all].filter((k) => params[k] !== b[k]).length;
      return diff <= 1;
    });
  };
}

export interface Generated {
  id: string;
  seed: string;
  params: Params;
  solved: Solved;
  sluchay?: string;
}

/**
 * Новая задача подтипа на seed, не похожая на задачи банка. Если
 * подобрать не удалось — исключение: значит, ограничения генератора
 * записаны с ошибкой, и это ловит автотест.
 */
export function generateBez(id: string, seed: string, pohozhaNaBank: Pohozha): Generated {
  const gen = GENERATORS[id];
  if (!gen) {
    throw new Error(`нет генератора для ${id}`);
  }
  const st = subtype(id);
  const r = rngOf(`z11|${id}|${seed}`);
  for (let i = 0; i < ATTEMPTS; i += 1) {
    const z = gen(r);
    if (!z || pohozhaNaBank(id, z.params)) {
      continue;
    }
    let solved: Solved;
    try {
      solved = st.solve(z.params);
    } catch {
      continue;
    }
    if (
      Math.abs(solved.answer - z.answer) > 1e-9 ||
      !(solved.answer > 0) ||
      !nice(solved.answer, 2)
    ) {
      continue;
    }
    const out: Generated = { id, seed, params: z.params, solved };
    if (z.sluchay) {
      out.sluchay = z.sluchay;
    }
    return out;
  }
  throw new Error(`${id}: не подобрались параметры на seed ${seed}`);
}
