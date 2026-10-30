/**
 * Вариант раздела как набор «Собрать вариант» (`VariantSet`) с одной
 * версией: онлайн-режим, листы, результаты и статистика работают с ним
 * так же, как с вариантами повышенной сложности.
 */

import { EZH_MESYACY } from '@/content/ezhemesyachnye';
import { EGE_NUMBERS, type HintStep, type VariantSet, type VariantTask } from '@/lib/variant/types';
import { SHABLONY, type Shablon } from '@/lib/povyshennye/shablony';
import { zagruzitVariant } from './dannye';
import { ezhKod } from './kod';
import { SHABLONY_EV } from './shablony';
import type { Zapis } from './types';

/** Версия набора: меняется, когда меняются шаблоны или данные. */
export const EZH_VERSION = 'ev1';

export function shablonEV(id: string): Shablon {
  const s = SHABLONY_EV[id] ?? SHABLONY[id];
  if (s === undefined) throw new Error(`Нет шаблона ${id}`);
  return s;
}

/**
 * Кнопки подсказок в порядке по ключу задачи: у движков, где верный
 * вариант перечислен первым, ответ не выдаётся положением.
 */
function peremeshatKnopki(h: readonly HintStep[], klyuch: string): HintStep[] {
  return h.map((x, i) => {
    let s = 0;
    for (const ch of `${klyuch}|${i}`) s = (Math.imul(s, 31) + ch.charCodeAt(0)) >>> 0;
    const sdvig = s % x.options.length;
    const options = x.options.map((_, j) => x.options[(j + sdvig) % x.options.length]!);
    return { ...x, options, correct: (x.correct - sdvig + x.options.length) % x.options.length };
  });
}

/** Задача варианта k: разметка шаблона плюс поля набора. */
export function zadachaEV(k: number, zapis: Zapis): VariantTask {
  const sh = shablonEV(zapis.s);
  const klyuch = `EV${k}.${sh.ege}`;
  const t = sh.zadacha(zapis.p as never, klyuch);
  if (t.egeNumber !== sh.ege) throw new Error(`${zapis.s}: номер задания ${t.egeNumber}`);
  return {
    ...t,
    ...(t.hints === undefined ? {} : { hints: peremeshatKnopki(t.hints, klyuch) }),
    taskId: klyuch,
    prototypeId: zapis.s,
    subtype: zapis.s,
    source: { kind: 'own', label: `Ежемесячный вариант: ${EZH_MESYACY[k - 1] ?? k}` },
    ref: { k, v: 1, ege: sh.ege },
  };
}

export async function ezhSet(k: number): Promise<VariantSet | null> {
  const d = await zagruzitVariant(k);
  if (d === null) return null;
  return ezhSetIz(d.k, d.versii);
}

/** То же без загрузки — для автотеста на Node. */
export function ezhSetIz(k: number, versii: Zapis[][]): VariantSet {
  const code = ezhKod(k);
  return {
    code,
    seed: code,
    version: EZH_VERSION,
    config: {
      tasks: [...EGE_NUMBERS],
      subtypes: {},
      source: 'own',
      stars: [],
      count: versii.length,
      parallel: false,
    },
    zameny: {},
    variants: versii.map((zapisi, i) => ({
      index: i + 1,
      tasks: zapisi.map((z) => zadachaEV(k, z)),
    })),
    createdAt: '2026-10-29T00:00:00.000Z',
  };
}
