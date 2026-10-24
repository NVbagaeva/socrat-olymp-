/**
 * Адаптер задания №9: банк тренажёра (BANK, до 20 seed на прототип) и
 * новые задачи того же прототипа, когда банк в партии кончился.
 * Задачу и рисунок считает движок раздела (`generate`, `renderFigura`),
 * разметку — функции листа №9 (sheet9.ts): рисунок условия в режиме
 * 'student', рисунок учителя в режиме 'teacher' (треугольник наклона,
 * пунктиры), этапы разбора — как на листе учителя.
 */

import { generate } from '@/lib/proizvodnaya/generate';
import { BANK } from '@/lib/proizvodnaya/bank';
import { prototypeById } from '@/lib/proizvodnaya/prototypes';
import {
  CELL,
  TEACHER_CELL,
  TEACHER_MAX_MM,
  drawFigure,
  razborEtapyHtml,
} from '@/lib/proizvodnaya/sheet9';
import type { Generated } from '@/lib/proizvodnaya/types';
import typo from '@/lib/sheet/typography.js';
import { typeset } from '@/lib/tex';
import type { SectionAdapter, SectionModule, VariantTask } from '../../types';
import {
  FALLBACK,
  answerHtml,
  answerText,
  pickCandidate,
  razborAnswer,
  sourceOk,
  studentFromHints,
  subtypeOk,
  type Candidate,
  type HintLike,
} from '../common';
import { info } from './info';

interface C9 extends Candidate {
  seed: string;
}

function candidate(prototypeId: string, seed: string): C9 | null {
  const p = prototypeById(prototypeId);
  if (p === undefined || p.zaglushka === true) return null;
  return {
    taskId: `${prototypeId}|${seed}`,
    prototypeId,
    subtype: p.gruppa,
    source: p.istochnik === 'otkrytyj-bank' ? 'fipi' : 'own',
    stars: null,
    seed,
  };
}

const POOL: C9[] = BANK.flatMap((entry) =>
  entry.variants.flatMap((v) => {
    const c = candidate(entry.prototype, v.seed);
    return c === null ? [] : [c];
  }),
);

function unattr(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Заглушки формул листа (`<span class="math" data-tex>`, typo.mathText)
 * → готовая вёрстка KaTeX: карточки генератора вариантов набраны сразу,
 * без прохода KaTeX на странице.
 */
function katexHtml(html: string): string {
  return html.replace(/<span class="math" data-tex="([^"]*)">[^<]*<\/span>/g, (_, tex: string) =>
    typeset(`$${unattr(tex)}$`),
  );
}

/** Лесенка вопросов подсказки: верная кнопка — ответ, итог — пояснение. */
function hints(t: Generated): HintLike[] {
  return t.podskazka.map((v) => ({
    question: v.vopros,
    options: v.knopki.map((k) => k.tekst),
    correct: v.knopki.findIndex((k) => k.verno),
    ...(v.itog === undefined ? {} : { comment: v.itog }),
  }));
}

function build(c: C9, isNew: boolean): VariantTask | null {
  let t: Generated;
  try {
    t = generate(c.prototypeId, c.seed);
  } catch {
    return null;
  }
  const student = drawFigure(t, 'student');
  const teacher = drawFigure(t, 'teacher');
  const otvet = answerHtml(t.otvet);
  const steps = t.shagi
    .filter((s) => s.zagolovok !== 'Ответ')
    .map((s) => ({ title: s.zagolovok, lines: s.stroki }));
  return {
    egeNumber: 9,
    taskId: c.taskId,
    prototypeId: c.prototypeId,
    subtype: c.subtype,
    source:
      c.source === 'fipi'
        ? { kind: 'fipi', label: `Открытый банк ФИПИ: прототип ${c.prototypeId}` }
        : {
            kind: 'own',
            label: `Своя: прототип ${c.prototypeId}${isNew ? ', новый рисунок и числа' : ''}`,
          },
    difficulty: null,
    statement: `<p>${katexHtml(typo.mathText(t.uslovie))}</p>`,
    figure: student === null ? null : { svg: student.svg, width: student.width(CELL.single) },
    figureTeacher:
      teacher === null
        ? null
        : {
            svg: teacher.svg,
            width: Math.min(teacher.width(TEACHER_CELL.single), TEACHER_MAX_MM.single),
            below: true,
          },
    answer: answerText(t.otvet),
    answerHtml: otvet,
    solutionTeacher: katexHtml(razborEtapyHtml(t)) + razborAnswer(otvet),
    solutionStudent: studentFromHints(hints(t), steps) + razborAnswer(otvet),
    fallbacks: [
      FALLBACK.noDifficulty,
      FALLBACK.studentFromHints,
      ...(c.source === 'fipi' ? [FALLBACK.noPrototypeNo] : []),
    ],
    ref: { prototype: c.prototypeId, seed: c.seed },
  };
}

/* Рисунок считается долго (движок подбирает подписи), а партия
   собирается заново при каждой замене: готовые задачи запоминаются.
   build — чистая функция от кандидата, запоминание ничего не меняет. */
const CACHE_MAX = 300;
const cache = new Map<string, VariantTask | null>();

function cached(c: C9, isNew: boolean): VariantTask | null {
  const hit = cache.get(c.taskId);
  if (hit !== undefined) return hit;
  const t = build(c, isNew);
  if (cache.size >= CACHE_MAX) cache.clear();
  cache.set(c.taskId, t);
  return t;
}

function init(): SectionAdapter {
  return {
    info,
    getRandomTask(filters, rng) {
      const c = pickCandidate(POOL, filters, rng);
      if (c !== null) return cached(c, false);
      /* Банк кончился: новая задача того же прототипа на своём seed. */
      const proto = filters.prototype;
      if (proto === undefined) return null;
      for (let i = 0; i < 20; i += 1) {
        const fresh = candidate(proto, `${proto}#v${Math.floor(rng.next() * 1e9).toString(36)}`);
        if (fresh === null) return null;
        if (!sourceOk(fresh.source, filters.source) || !subtypeOk(fresh.subtype, filters.subtypes))
          return null;
        if (filters.exclude.has(fresh.taskId)) continue;
        const t = cached(fresh, true);
        if (t !== null) return t;
      }
      return null;
    },
  };
}

export const section: SectionModule = {
  load: () => Promise.resolve(null),
  init,
};
