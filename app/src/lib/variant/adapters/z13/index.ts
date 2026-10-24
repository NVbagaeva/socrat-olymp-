/**
 * Адаптер задания №13: банк движка (BANK_13, по 10 seed на прототип)
 * и новые задачи того же прототипа, когда банк в партии кончился.
 * Разметку задачи собирает генератор раздела (`sobrat`, gen/list.ts):
 * условие с таблицей, полное решение по шагам.
 */

import { BANK_13 } from '@/lib/zadanie13/bank';
import { sobrat, tablitsaUsloviya13 } from '@/lib/zadanie13/gen/list';
import { otvetText } from '@/lib/zadanie13/html';
import { PROTOTYPE_BY_ID } from '@/lib/zadanie13/proto';
import type { TypeCode } from '@/lib/zadanie13/types';
import type { SectionAdapter, SectionModule, Stars, VariantTask } from '../../types';
import {
  FALLBACK,
  answerHtml,
  answerText,
  pickCandidate,
  razborAnswer,
  studentFromHints,
  type Candidate,
} from '../common';
import { info } from './info';

const TYPES: readonly TypeCode[] = ['A', 'B', 'C', 'D'];

interface C13 extends Candidate {
  seed: string;
}

function stars(d: 'base' | 'hard'): Stars {
  return d === 'base' ? 1 : 3;
}

function candidate(prototypeId: string, seed: string): C13 | null {
  const p = PROTOTYPE_BY_ID[prototypeId];
  if (p === undefined || !TYPES.includes(p.type)) return null;
  return {
    taskId: `${prototypeId}:${seed}`,
    prototypeId,
    subtype: p.type,
    source: p.source,
    stars: stars(p.difficulty),
    seed,
  };
}

const POOL: C13[] = BANK_13.flatMap(([id, seed]) => {
  const c = candidate(id, seed);
  return c === null ? [] : [c];
});

function build(c: C13, isNew: boolean): VariantTask {
  const z = sobrat({
    pos: '1.1',
    no: 1,
    vid: c.subtype as TypeCode,
    prototypeId: c.prototypeId,
    seed: c.seed,
    istochnik: isNew ? 'new' : 'bank',
  });
  const t = z.task;
  const statement = z.questionHtml + tablitsaUsloviya13(z);
  const solution = z.polnoHtml;
  const otvet = answerHtml(t.answer);
  const note = t.sourceNote === undefined ? '' : `, ${t.sourceNote}`;
  return {
    egeNumber: 13,
    taskId: c.taskId,
    prototypeId: c.prototypeId,
    subtype: c.subtype,
    source: {
      kind: t.source,
      label:
        t.source === 'fipi'
          ? `Открытый банк ФИПИ: прототип ${c.prototypeId}${note}`
          : `Своя: прототип ${c.prototypeId}${isNew ? ', новые числа' : ''}`,
    },
    difficulty: stars(t.difficulty),
    statement,
    figure: null,
    figureTeacher: null,
    answer: answerText(t.answer),
    answerHtml: otvet,
    solutionTeacher: solution + razborAnswer(otvetText(t.answer, t.units)),
    solutionStudent:
      studentFromHints(t.hints, []) +
      `<p class="var-razbor__h">Решаем</p>${solution}` +
      razborAnswer(otvetText(t.answer, t.units)),
    fallbacks: [
      FALLBACK.studentFromHints,
      ...(t.source === 'fipi' ? [FALLBACK.noPrototypeNo] : []),
    ],
    ref: { prototype: c.prototypeId, seed: c.seed },
  };
}

function init(): SectionAdapter {
  return {
    info,
    getRandomTask(filters, rng) {
      const c = pickCandidate(POOL, filters, rng);
      if (c !== null) return build(c, false);
      /* Банк кончился: новая задача того же прототипа на своём seed. */
      if (filters.prototype === undefined) return null;
      for (let i = 0; i < 20; i += 1) {
        const fresh = candidate(filters.prototype, `v${Math.floor(rng.next() * 1e9).toString(36)}`);
        if (fresh !== null && !filters.exclude.has(fresh.taskId)) return build(fresh, true);
      }
      return null;
    },
  };
}

export const section: SectionModule = {
  load: () => Promise.resolve(null),
  init,
};
