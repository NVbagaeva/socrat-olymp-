/**
 * Адаптер задания №7: банк раздела — задачи ФИПИ и аналоги (по 20 на
 * прототип). Данные приходят без ответов (/variant/dannye/z07.json,
 * lib/variant/data/z07.ts): ответ, разбор по этапам, панель «Считаем
 * с умом» и подсказки считает решатель прототипа `solve(params)` —
 * как лист учителя №7 (components/tasks/zadanie7/List7.tsx).
 */

import { dataUrl } from '@/lib/dataUrl';
import { typeset } from '@/lib/tex';
import { kodNaSayte, prototype } from '@/lib/zadanie7/prototypes';
import type { SectionAdapter, SectionModule, VariantTask } from '../../types';
import {
  FALLBACK,
  answerHtml,
  answerText,
  pickCandidate,
  razborAnswer,
  hintSteps,
  studentFromHints,
  type Candidate,
} from '../common';
import type { Dannye7, Zadacha7 } from './dannye';
import { info } from './info';
import { razbor7Html } from './razbor';

interface C7 extends Candidate {
  z: Zadacha7;
}

function candidate(z: Zadacha7): C7 | null {
  let group: string;
  try {
    group = prototype(z.p).group;
  } catch {
    return null;
  }
  return {
    taskId: z.id,
    prototypeId: z.p,
    subtype: group,
    source: z.t === undefined ? 'own' : 'fipi',
    stars: null,
    z,
  };
}

function build(c: C7): VariantTask {
  const proto = prototype(c.prototypeId);
  const s = proto.solve(c.z.params);
  const text = c.z.t ?? proto.uslovie(c.z.params);
  const kod = kodNaSayte(c.prototypeId);
  const otvet = answerHtml(s.answer);
  const razbor = razbor7Html(s);
  return {
    egeNumber: 7,
    taskId: c.taskId,
    prototypeId: c.prototypeId,
    subtype: c.subtype,
    source:
      c.source === 'fipi'
        ? {
            kind: 'fipi',
            label:
              c.z.no === undefined
                ? `Открытый банк ФИПИ (прототип ${kod})`
                : `Открытый банк ФИПИ: задача №${c.z.no} (прототип ${kod})`,
          }
        : { kind: 'own', label: `Аналог прототипа ${kod}` },
    difficulty: null,
    statement: `<p>${typeset(text)}</p>`,
    figure: null,
    figureTeacher: null,
    answer: answerText(s.answer),
    answerHtml: otvet,
    solutionTeacher: razbor + razborAnswer(otvet),
    hints: hintSteps(s.hints),
    solutionStudent:
      studentFromHints(s.hints, []) +
      `<p class="var-razbor__h">Решаем</p>${razbor}` +
      razborAnswer(otvet),
    fallbacks: [
      FALLBACK.noDifficulty,
      FALLBACK.studentFromHints,
      ...(c.source === 'fipi' && c.z.no === undefined ? [FALLBACK.noPrototypeNo] : []),
    ],
    ref: { prototype: c.prototypeId, id: c.taskId },
  };
}

function init(data: unknown): SectionAdapter {
  const z = (data as Dannye7 | null)?.z ?? [];
  const pool = z.flatMap((x) => {
    const c = candidate(x);
    return c === null ? [] : [c];
  });
  return {
    info,
    getRandomTask(filters, rng) {
      /* Аналогов по 20 на прототип, а вариантов в партии не больше
         десяти: банк в партии не кончается, новые задачи не нужны. */
      const c = pickCandidate(pool, filters, rng);
      return c === null ? null : build(c);
    },
  };
}

export const section: SectionModule = {
  async load() {
    const r = await fetch(dataUrl('/variant/dannye/z07.json'));
    if (!r.ok) throw new Error(`нет данных №7: ${r.status}`);
    return r.json();
  },
  init,
};
