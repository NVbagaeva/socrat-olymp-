/**
 * Адаптер задания №8: банк тренажёра (BANK, 10 seed на прототип) и
 * новые задачи того же прототипа, когда банк в партии кончился.
 * Задачу считает движок раздела `generate(прототип, seed, уровень)`,
 * решение учителя — шаги листа №8 (`razborStepsHtml`, sheet8.ts).
 */

import { typeset } from '@/lib/tex';
import { BANK } from '@/lib/vychisleniya/bank';
import { generate, hasLevel } from '@/lib/vychisleniya/generate';
import { prototypeById } from '@/lib/vychisleniya/prototypes';
import { razborStepsHtml } from '@/lib/vychisleniya/sheet8';
import type { Level } from '@/lib/vychisleniya/types';
import type { SectionAdapter, SectionModule, Stars, VariantTask } from '../../types';
import {
  FALLBACK,
  answerHtml,
  answerText,
  pickCandidate,
  razborAnswer,
  sourceOk,
  starsOk,
  studentFromSteps,
  subtypeOk,
  type Candidate,
} from '../common';
import { info } from './info';

interface C8 extends Candidate {
  seed: string;
  level: Level | null;
}

function stars(level: Level): Stars {
  return level === 'base' ? 1 : 2;
}

function taskId(prototypeId: string, seed: string, level: Level | null): string {
  return `${prototypeId}|${seed}|${level ?? 'any'}`;
}

/**
 * Кандидат пула. У части вариантов банка уровень не задан (`level:
 * null` — у прототипа один уровень на всё): звёзды тогда берутся из
 * задачи, которую даёт seed, — один расчёт на вариант при первой сборке.
 */
function candidate(prototypeId: string, seed: string, level: Level | null): C8 | null {
  const p = prototypeById(prototypeId);
  if (p === undefined) return null;
  let actual: Level;
  try {
    actual = level ?? generate(prototypeId, seed, null).level;
  } catch {
    return null;
  }
  return {
    taskId: taskId(prototypeId, seed, level),
    prototypeId,
    subtype: p.group,
    source: 'own',
    stars: stars(actual),
    seed,
    level,
  };
}

let pool: C8[] | null = null;

function bankPool(): C8[] {
  pool ??= BANK.flatMap((entry) =>
    entry.variants.flatMap((v) => {
      const c = candidate(entry.prototype, v.seed, v.level);
      return c === null ? [] : [c];
    }),
  );
  return pool;
}

function build(c: C8, isNew: boolean): VariantTask | null {
  let t;
  try {
    t = generate(c.prototypeId, c.seed, c.level);
  } catch {
    return null;
  }
  const otvet = answerHtml(t.otvet);
  const steps = razborStepsHtml(t.razbor);
  return {
    egeNumber: 8,
    taskId: c.taskId,
    prototypeId: c.prototypeId,
    subtype: c.subtype,
    source: {
      kind: 'own',
      label: `Своя: прототип ${c.prototypeId}${isNew ? ', новые числа' : ''}`,
    },
    difficulty: stars(t.level),
    statement: `<p>${typeset(t.uslovie)}</p>`,
    figure: null,
    figureTeacher: null,
    answer: answerText(t.otvet),
    answerHtml: otvet,
    solutionTeacher: steps + razborAnswer(otvet),
    /* Ученику — те же строки разбора раздела: пояснений словами у
       шагов №8 нет, есть только выкладки. */
    solutionStudent:
      studentFromSteps([{ title: 'Преобразуем и считаем', lines: t.razbor }]) + razborAnswer(otvet),
    fallbacks: [FALLBACK.studentFromTeacher],
    ref: { prototype: c.prototypeId, seed: c.seed, level: c.level ?? 'any' },
  };
}

/** Уровни прототипа, подходящие под звёзды. */
function levelsFor(prototypeId: string, want: readonly Stars[] | null): Level[] {
  const p = prototypeById(prototypeId);
  if (p === undefined) return [];
  return (['base', 'advanced'] as const).filter((l) => hasLevel(p, l) && starsOk(stars(l), want));
}

function init(): SectionAdapter {
  return {
    info,
    getRandomTask(filters, rng) {
      const c = pickCandidate(bankPool(), filters, rng);
      if (c !== null) return build(c, false);
      /* Банк кончился: новая задача того же прототипа на своём seed. */
      const proto = filters.prototype;
      if (proto === undefined || !sourceOk('own', filters.source)) return null;
      const group = prototypeById(proto)?.group;
      if (group === undefined || !subtypeOk(group, filters.subtypes)) return null;
      let levels = levelsFor(proto, filters.stars);
      if (levels.length === 0) {
        /* У прототипа партии нет выбранной сложности: значит, вариант 1
           взят с ослабленной сложностью, и эта пометка переходит к
           параллельным вариантам вместе с прототипом. Тот же прототип
           любой сложности — сначала из банка. */
        const any = pickCandidate(bankPool(), { ...filters, stars: null }, rng);
        if (any !== null) return build(any, false);
        levels = levelsFor(proto, null);
      }
      if (levels.length === 0) return null;
      const level = rng.pick(levels);
      for (let i = 0; i < 20; i += 1) {
        const seed = `${proto}#v${Math.floor(rng.next() * 1e9).toString(36)}`;
        const fresh = candidate(proto, seed, level);
        if (fresh === null || filters.exclude.has(fresh.taskId)) continue;
        const t = build(fresh, true);
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
