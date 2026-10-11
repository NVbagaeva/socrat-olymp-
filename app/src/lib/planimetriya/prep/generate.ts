/**
 * Микрозадача по идентификатору и seed: чистая функция. Набор
 * принимается, только если ответ — целое или конечная десятичная
 * дробь и чертёж чист в режимах ученика и учителя.
 */

import { rngOf } from '../../vychisleniya/rng';
import { otvetEge } from '../bank/analogi';
import { pustoyOtchet, renderPlan } from '../render';
import { chislo, gr } from '../stseny/dsl';
import type { Scena } from '../types';
import { mikroById } from './bloki';
import type { MikroGenerated } from './types';

const ATTEMPTS = 400;

/** Зафиксированный вариант блока. */
export function fixedSeed(id: string): string {
  return `${id}#1`;
}

/**
 * Чертёж разбора: у единственного искомого элемента без подписи
 * появляется ответ (угол и дуга — в градусах). Подпись с otvet: true
 * движок выводит только на листе учителя.
 */
export function sOtvetom(scena: Scena, otvet: number): Scena {
  const iskomye = scena.elementy.filter((e) => e.vydelit === 'iskomoe');
  const e = iskomye[0];
  if (iskomye.length !== 1 || e === undefined || e.znachenie !== undefined) return scena;
  const znachenie = e.tip === 'ugol' || e.tip === 'duga' ? gr(otvet) : chislo(otvet);
  return {
    ...scena,
    elementy: scena.elementy.map((x) => (x === e ? { ...x, znachenie, otvet: true } : x)),
  };
}

export function risunokChist(g: MikroGenerated): boolean {
  if (g.risunok === null) return true;
  const varianty = [
    { scena: g.risunok, rezhim: { rezhim: 'uchenik' as const } },
    { scena: sOtvetom(g.risunok, g.otvet), rezhim: { rezhim: 'uchitel' as const } },
  ];
  for (const { scena, rezhim } of varianty) {
    const o = pustoyOtchet();
    renderPlan(scena, { rezhim, chisla: true }, o);
    if (o.problems.length > 0) return false;
  }
  return true;
}

export function generateMikro(id: string, seed: string): MikroGenerated {
  const m = mikroById(id);
  if (m === undefined) throw new Error(`Нет микрозадачи ${id}`);
  const r = rngOf(`${id}|${seed}`);
  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    const draft = m.generate(r);
    if (draft === null || !otvetEge(draft.otvet)) continue;
    let chist = false;
    try {
      chist = risunokChist(draft);
    } catch {
      chist = false;
    }
    if (!chist) continue;
    return draft;
  }
  throw new Error(`Микрозадача ${id}: не подобрались параметры на seed ${seed}`);
}

/** Seed для кнопки «Ещё вариант». */
export function sluchaynyySeed(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
