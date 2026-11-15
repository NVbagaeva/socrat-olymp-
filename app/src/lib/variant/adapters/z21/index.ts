/**
 * Адаптер раздела «Наибольшее и наименьшее значение функции» (номер
 * хранения 21): задачи каталога тренажёра (lib/zadanie21/trening/katalog.ts)
 * — по 20 задач генератора на тип («P01|k7») и задачи сборника
 * («P22|s3-1»). Задачу по ключу строит генератор раздела
 * (lib/zadanie21/zadacha.ts) — та же, что в тренажёре и в закладках.
 * Кончились задачи типа в партии — новые числа того же типа на своём
 * ключе («P01|v…»): генератор прототипа даёт «хороший» ответ при любом
 * зерне.
 *
 * Разметка — как у тренажёра и листа учителя раздела (sheet21.ts):
 * этапы разбора со схемой знаков производной, подсказки-вопросы.
 */

import { prototype } from '@/lib/zadanie21/prototypes';
import { shagiHtml21 } from '@/lib/zadanie21/sheet21';
import { shemaSvg } from '@/lib/zadanie21/shema';
import { katalog21 } from '@/lib/zadanie21/trening/katalog';
import type { Etap, Solved } from '@/lib/zadanie21/types';
import { prototipKlyucha, zadachaPoKlyuchu } from '@/lib/zadanie21/zadacha';
import { typeset } from '@/lib/tex';
import type { SectionAdapter, SectionModule, VariantTask } from '../../types';
import {
  FALLBACK,
  answerHtml,
  answerText,
  hintSteps,
  pickCandidate,
  razborAnswer,
  sourceOk,
  studentFromHints,
  subtypeOk,
  type Candidate,
} from '../common';
import { info } from './info';

function candidate(klyuch: string): Candidate | null {
  let vid: number;
  try {
    vid = prototype(prototipKlyucha(klyuch)).vid;
  } catch {
    return null;
  }
  return {
    taskId: klyuch,
    prototypeId: prototipKlyucha(klyuch),
    subtype: `G${vid}`,
    source: 'own',
    stars: null,
  };
}

/* Пул — весь каталог тренажёра по порядку типов: проверенные самотестом задачи. */
const POOL: Candidate[] = Object.values(katalog21()).flatMap((k) =>
  [...k.f, ...k.a].flatMap((klyuch) => {
    const c = candidate(klyuch);
    return c === null ? [] : [c];
  }),
);

const bezShaga = (title: string) => title.replace(/^Шаг \d+\.\s*/, '');

/** Схема знаков производной под этапом разбора. */
function shemaHtml(e: Etap): string {
  return e.shema === undefined ? '' : `<div class="z21-shema-list">${shemaSvg(e.shema)}</div>`;
}

/** «Решаем» разбора для ученика: этапы тренажёра, формулы KaTeX, схема знаков. */
function etapyUchenika(solved: Solved): string {
  const items = solved.etapy
    .filter((e) => e.title !== 'Ответ')
    .map(
      (e, i) =>
        `<li class="var-razbor__step">` +
        `<p class="var-razbor__q"><span class="var-razbor__n">${i + 1}</span>${typeset(bezShaga(e.title))}</p>` +
        e.lines.map((l) => `<p class="var-razbor__line">${typeset(l)}</p>`).join('') +
        shemaHtml(e) +
        `</li>`,
    )
    .join('');
  return items === ''
    ? ''
    : `<p class="var-razbor__h">Решаем</p><ol class="var-razbor">${items}</ol>`;
}

function build(c: Candidate, isNew: boolean): VariantTask | null {
  let z: ReturnType<typeof zadachaPoKlyuchu>;
  try {
    z = zadachaPoKlyuchu(c.taskId);
  } catch {
    return null;
  }
  const { solved } = z;
  if (!Number.isFinite(solved.answer)) return null;
  const otvet = answerHtml(solved.answer);
  const hints = solved.hints.map((h) => ({
    question: h.question,
    options: h.options,
    correct: h.correct,
    ...(h.comment === undefined ? {} : { comment: h.comment }),
  }));
  return {
    egeNumber: 21,
    taskId: c.taskId,
    prototypeId: c.prototypeId,
    subtype: c.subtype,
    source: {
      kind: 'own',
      label: `Своя: тип ${c.prototypeId}${isNew ? ', новые числа' : ''}`,
    },
    difficulty: null,
    statement: `<p>${typeset(z.uslovie)}</p>`,
    figure: null,
    figureTeacher: null,
    answer: answerText(solved.answer),
    answerHtml: otvet,
    solutionTeacher: shagiHtml21(solved) + razborAnswer(otvet),
    hints: hintSteps(hints),
    solutionStudent: studentFromHints(hints, []) + etapyUchenika(solved) + razborAnswer(otvet),
    fallbacks: [FALLBACK.noDifficulty, FALLBACK.studentFromHints],
    ref: { klyuch: c.taskId },
  };
}

/* Партия собирается заново при каждой замене: готовые задачи
   запоминаются. build — чистая функция от ключа. */
const CACHE_MAX = 300;
const cache = new Map<string, VariantTask | null>();

function cached(c: Candidate, isNew: boolean): VariantTask | null {
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
      /* Каталог типа кончился: новые числа того же типа на своём ключе. */
      const proto = filters.prototype;
      if (proto === undefined) return null;
      for (let i = 0; i < 20; i += 1) {
        const fresh = candidate(`${proto}|v${Math.floor(rng.next() * 1e9).toString(36)}`);
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
