/**
 * Адаптер задания №2: банк для репетиторов (BANK, десять seed на
 * прототип) и новые задачи того же прототипа, когда банк в партии
 * кончился. Задачу считает движок раздела в браузере (`generate`),
 * рисунок — `renderVectorPlane`: ученику без катетов, учителю — с
 * катетами-подсказками, как на листе №2. Решение — шаги листа
 * учителя (`shagiHtml2`, sheet2.ts).
 */

import { typeset } from '@/lib/tex';
import { BANK } from '@/lib/vektory/bank';
import { generate } from '@/lib/vektory/generate';
import { prototypeById } from '@/lib/vektory/prototypes';
import { renderVectorPlane } from '@/lib/vektory/render';
import { shagiHtml2 } from '@/lib/vektory/sheet2';
import { krupnyyRisunok } from '../../pechat';
import type { Generated, Risunok } from '@/lib/vektory/types';
import type { Figure, SectionAdapter, SectionModule, VariantTask } from '../../types';
import {
  FALLBACK,
  answerHtml,
  answerText,
  pickCandidate,
  razborAnswer,
  studentFromSteps,
  type Candidate,
} from '../common';
import { info } from './info';

export interface C02 extends Candidate {
  seed: string;
  /** Номер варианта банка; null — новая задача. */
  n: number | null;
}

function candidate(prototypeId: string, seed: string, n: number | null): C02 | null {
  const p = prototypeById(prototypeId);
  if (p === undefined) return null;
  return {
    taskId: `${prototypeId}|${seed}`,
    prototypeId,
    subtype: p.gruppa,
    source: 'own',
    stars: null,
    seed,
    n,
  };
}

const POOL: C02[] = BANK.flatMap((entry) =>
  entry.variants.flatMap((v) => {
    const c = candidate(entry.prototype, v.seed, v.n);
    return c === null ? [] : [c];
  }),
);

/** Рисунок на листе варианта: клетка 7 мм (не меньше 6), под условием (lib/variant/pechat). */
function risunokLista(risunok: Risunok): Figure {
  const r = krupnyyRisunok((kegl) => renderVectorPlane({ ...risunok, minFont: kegl }));
  return { svg: r.svg, width: r.width, below: true };
}

export function build(c: C02, task: Generated): VariantTask {
  const risunok = task.risunok;
  const condition = risunok === null ? null : risunokLista(risunok);
  const withLegs = risunok === null ? null : risunokLista({ ...risunok, hints: true });
  const otvet = answerHtml(task.otvet);
  const shagi = task.shagi
    .filter((s) => s.zagolovok !== 'Ответ')
    .map((s) => ({ title: s.zagolovok, lines: s.stroki }));
  return {
    egeNumber: 2,
    taskId: c.taskId,
    prototypeId: c.prototypeId,
    subtype: c.subtype,
    source: {
      kind: 'own',
      label:
        c.n === null
          ? `Своя: прототип ${c.prototypeId}, новые числа`
          : `Своя: прототип ${c.prototypeId}, банк для репетиторов, вариант ${c.n}`,
    },
    difficulty: null,
    statement: typeset(task.uslovie),
    figure: condition,
    /* Рисунок без сетки катетов не имеет — тогда отдельного рисунка учителя нет. */
    figureTeacher: withLegs === null || withLegs.svg === condition?.svg ? null : withLegs,
    answer: answerText(task.otvet),
    answerHtml: otvet,
    solutionTeacher: shagiHtml2(task) + razborAnswer(otvet),
    solutionStudent: studentFromSteps(shagi) + razborAnswer(otvet),
    fallbacks: [FALLBACK.noDifficulty, FALLBACK.studentFromTeacher],
    ref: { prototype: c.prototypeId, seed: c.seed },
  };
}

function tryGenerate(c: C02): Generated | null {
  try {
    return generate(c.prototypeId, c.seed);
  } catch {
    return null;
  }
}

function init(): SectionAdapter {
  return {
    info,
    getRandomTask(filters, rng) {
      const c = pickCandidate(POOL, filters, rng);
      if (c !== null) {
        const task = tryGenerate(c);
        if (task !== null) return build(c, task);
      }
      /* Банк прототипа в партии кончился: новая задача на своём seed. */
      if (filters.prototype === undefined) return null;
      for (let i = 0; i < 20; i += 1) {
        const seed = `v${Math.floor(rng.next() * 1e9).toString(36)}`;
        const fresh = candidate(filters.prototype, seed, null);
        if (fresh === null || filters.exclude.has(fresh.taskId)) continue;
        const task = tryGenerate(fresh);
        if (task !== null) return build(fresh, task);
      }
      return null;
    },
  };
}

export const section: SectionModule = {
  load: () => Promise.resolve(null),
  init,
};
