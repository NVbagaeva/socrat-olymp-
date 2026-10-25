/**
 * Движок задания №13: generate(prototypeId, seed) → Task13.
 *
 * Детерминированно по seed. Прототип делает попытки с подсидами
 * «seed#0», «seed#1», …; задача принимается, если ответ формулы совпал
 * с ответом солвера, ответ — положительная конечная десятичная дробь,
 * нет нарушений и чисел из источников.
 */

import { pickPlot, type PlotFull } from './plots';
import { PROTOTYPE_BY_ID, PROTOTYPES } from './proto';
import type { Draft, Prototype } from './proto/types';
import { rng13 } from './rng';
import { toTableModel } from './tablica';
import type { PrototypeInfo, Task13 } from './types';

const MAX_TRIES = 400;

export interface Attempt {
  draft: Draft | null;
  plot: PlotFull;
  problems: string[];
}

/** Проверки готового черновика. */
export function draftProblems(p: Prototype, d: Draft): string[] {
  const out = [...(d.problems ?? [])];
  if (!d.answer.eq(d.verify)) out.push(`ответ формулы ${d.answer} ≠ ответу солвера ${d.verify}`);
  if (!d.answer.isPositive()) out.push('ответ не положительный');
  if (!d.answer.isFiniteDecimal()) out.push('ответ — бесконечная дробь');
  else if (d.answer.decimals() > (p.maxDecimals ?? 2))
    out.push(`в ответе ${d.answer.decimals()} знаков после запятой`);
  for (const f of p.forbid ?? []) {
    if (Object.entries(f).every(([k, val]) => d.params[k] === val))
      out.push(`числа из источника: ${JSON.stringify(f)}`);
  }
  if (!d.condition.trim()) out.push('пустое условие');
  if (!d.solution.length) out.push('нет решения');
  if (!d.hints.length) out.push('нет подсказок');
  return out;
}

export function attempt(p: Prototype, seed: string, i: number): Attempt {
  const rng = rng13(p.id, `${seed}#${i}`);
  const plot = pickPlot(rng, p.plot ?? {});
  let draft: Draft | null;
  try {
    draft = p.make({ rng, plot });
  } catch {
    // Например, промежуточное число — бесконечная дробь: такие параметры не годятся.
    draft = null;
  }
  if (!draft) return { draft: null, plot, problems: ['параметры не подошли'] };
  return { draft, plot, problems: draftProblems(p, draft) };
}

export function generate(prototypeId: string, seed: string): Task13 {
  const p = PROTOTYPE_BY_ID[prototypeId];
  if (!p) throw new Error(`Нет прототипа ${prototypeId}`);
  for (let i = 0; i < MAX_TRIES; i++) {
    const { draft, plot, problems } = attempt(p, seed, i);
    if (!draft || problems.length) continue;
    return {
      id: `13.${p.id}:${seed}`,
      taskNumber: 13,
      type: p.type,
      subtype: p.subtype,
      prototypeId: p.id,
      source: p.source,
      ...(p.sourceNote ? { sourceNote: p.sourceNote } : {}),
      difficulty: p.difficulty,
      seed,
      condition: draft.condition,
      ...(draft.conditionTable ? { conditionTable: draft.conditionTable } : {}),
      answer: draft.answer.toNumber(),
      units: draft.units ?? p.units,
      ...(draft.vopros ? { vopros: draft.vopros } : {}),
      solution: draft.solution,
      hints: draft.hints,
      tableModel: toTableModel(draft.rows, draft.scheme, draft.period, {
        ...(draft.labels ? { labels: draft.labels } : {}),
        ...(draft.extra ? { extra: draft.extra } : {}),
      }),
      plot: { deck: plot.deck, who: plot.who, goal: plot.goal, year: plot.year },
      params: draft.params,
    };
  }
  throw new Error(`${prototypeId}: за ${MAX_TRIES} попыток не нашлось задачи для seed «${seed}»`);
}

export function prototypes(): PrototypeInfo[] {
  return PROTOTYPES.map(({ id, type, subtype, source, sourceNote, difficulty, units, title }) => ({
    id,
    type,
    subtype,
    source,
    ...(sourceNote ? { sourceNote } : {}),
    difficulty,
    units,
    title,
  }));
}
