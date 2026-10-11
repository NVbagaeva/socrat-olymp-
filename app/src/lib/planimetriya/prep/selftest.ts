/**
 * Самотест тренировок навыков №1: зафиксированные и случайные
 * варианты каждой микрозадачи — ответ ЕГЭ, чертёж чист, формулы
 * KaTeX, десять задач в блоке, зафиксированные задачи блока разные.
 */

import { otvetEge } from '../bank/analogi';
import { BLOKI } from './bloki';
import { fixedSeed, generateMikro } from './generate';

export function checkPrep(
  seeds: number,
  katex: (tex: string) => string,
): { zadach: number; problems: string[] } {
  const problems: string[] = [];
  let zadach = 0;
  const ids = new Set<string>();
  for (const b of BLOKI) {
    if (b.zadachi.length !== 10) problems.push(`блок ${b.id}: задач ${b.zadachi.length}`);
    for (const f of b.formuly) {
      try {
        katex(f);
      } catch (e) {
        problems.push(`блок ${b.id}: формула «${f}»: ${(e as Error).message}`);
      }
    }
    for (const m of b.zadachi) {
      if (ids.has(m.id)) problems.push(`микрозадача ${m.id} повторяется`);
      ids.add(m.id);
      for (const seed of [
        fixedSeed(m.id),
        ...Array.from({ length: seeds }, (_, i) => `test-${i}`),
      ]) {
        let g;
        try {
          g = generateMikro(m.id, seed);
        } catch (e) {
          problems.push(`${m.id} на ${seed}: ${(e as Error).message}`);
          continue;
        }
        zadach += 1;
        if (!otvetEge(g.otvet)) problems.push(`${m.id} на ${seed}: ответ ${g.otvet}`);
        for (const s of [g.uslovie, ...g.razbor, `$${m.formula}$`]) {
          if (/NaN|undefined|Infinity/.test(s)) problems.push(`${m.id}: «${s}»`);
          for (const f of s.match(/\$[^$]+\$/g) ?? []) {
            try {
              katex(f.slice(1, -1));
            } catch (e) {
              problems.push(`${m.id}: KaTeX «${f}»: ${(e as Error).message}`);
            }
          }
        }
      }
    }
  }
  return { zadach, problems };
}
