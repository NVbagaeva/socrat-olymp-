/**
 * Адаптер задания №6: исходные задачи и аналоги банка раздела (без
 * ответов, маршрут /variant/dannye/z06.json). Ответ, рисунок условия,
 * разбор и подсказки считает решатель прототипа по параметрам, а
 * размечают компоненты листа раздела (components/tasks/zadanie6:
 * Uslovie6, Ris6, Razbor6) — так же, как лист учителя №6 (List6).
 * Компоненты без состояния, поэтому здесь они отрисовываются в строку
 * (`renderToStaticMarkup`).
 *
 * Рисунок задачи: диаграмма Эйлера и дерево — SVG рядом с условием
 * (без выделений: они бывают только в разборе); таблица распределения
 * и запись $X\sim(\ldots)$ — HTML, они остаются в условии на своём
 * месте. Разбор учителя несёт свои рисунки с выделениями в шагах.
 *
 * Генератора новых чисел здесь нет: в банке по 51–54 задачи на
 * прототип, вариантов в партии не больше десяти.
 */

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Razbor6 } from '@/components/tasks/zadanie6/Razbor6';
import { Ris6 } from '@/components/tasks/zadanie6/Ris6';
import { Uslovie6 } from '@/components/tasks/zadanie6/Uslovie6';
import { dataUrl } from '@/lib/dataUrl';
import { kodNaSayte, prototype } from '@/lib/zadanie6/prototypes';
import type { Ris, Solved, Uslovie } from '@/lib/zadanie6/types';
import type { Zadacha6Variant } from '../../data/z06';
import type { Fallback, Figure, SectionAdapter, SectionModule, VariantTask } from '../../types';
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
import { info } from './info';

/* ── Рисунок ────────────────────────────────────────────────────── */

/** Миллиметров в CSS-пикселе: рисунки №6 заданы в пикселях. */
const MM_V_PX = 25.4 / 96;
/** Дерево на листе №6 не шире 340 px (zadanie6.css, @media print). */
const DEREVO_MAX_PX = 340;
/** Шире — рисунок под условием, а не справа. */
const SBOKU_MAX_MM = 80;

/** Рисунок условия отдельно от текста: диаграмма Эйлера и дерево. */
function otdelnyy(ris: Ris | undefined): ris is Extract<Ris, { vid: 'eiler' | 'derevo' }> {
  return ris !== undefined && (ris.vid === 'eiler' || ris.vid === 'derevo');
}

/** SVG рисунка Ris6 без обёртки <figure>: ширину и место задаёт лист. */
function figureOf(ris: Extract<Ris, { vid: 'eiler' | 'derevo' }>): Figure {
  const html = renderToStaticMarkup(createElement(Ris6, { ris }));
  const svg = html.replace(/^<figure[^>]*>/, '').replace(/<\/figure>$/, '');
  const w = Number(/^<svg[^>]*\swidth="([\d.]+)"/.exec(svg)?.[1] ?? 0);
  const px = ris.vid === 'derevo' ? Math.min(w, DEREVO_MAX_PX) : w;
  const mm = Math.round(px * MM_V_PX);
  return { svg, width: mm, ...(mm > SBOKU_MAX_MM ? { below: true } : {}) };
}

/* ── Разбор ─────────────────────────────────────────────────────── */

/** Строка «**Ответ:** …» в шаге: ответ на листе стоит отдельно. */
const OTVET = /^\s*\*{0,2}Ответ:/;

/**
 * Разбор листа учителя №6 (Razbor6). Панель «Считаем с умом» на
 * экране свёрнута (<details>), на бумаге свёрнутая не печатается —
 * здесь она раскрыта.
 */
function razborHtml(s: Solved): string {
  const bezOtveta: Solved = {
    ...s,
    etapy: s.etapy.map((e) => ({ ...e, lines: e.lines.filter((l) => !OTVET.test(l)) })),
  };
  return renderToStaticMarkup(createElement(Razbor6, { s: bezOtveta })).replace(
    /<details class="z6-razbor__calc">/g,
    '<details class="z6-razbor__calc" open="">',
  );
}

/* ── Источник ───────────────────────────────────────────────────── */

function sourceOf(z: Zadacha6Variant): { kind: 'fipi' | 'own'; label: string } {
  const kod = kodNaSayte(z.prototypeId);
  switch (z.source) {
    case 'fipi':
      return { kind: 'fipi', label: `Открытый банк ФИПИ: прототип ${kod}` };
    case 'demo':
      return {
        kind: 'own',
        label: `${z.gde ?? 'Демоверсия ФИПИ'} (не открытый банк), прототип ${kod}`,
      };
    case 'obrazec':
      return {
        kind: 'own',
        label: `Образец: ${z.gde ?? 'сторонний банк'} · не из открытого банка ФИПИ, прототип ${kod}`,
      };
    default:
      return { kind: 'own', label: `Аналог прототипа ${kod}` };
  }
}

/* ── Адаптер ────────────────────────────────────────────────────── */

export interface C6 extends Candidate {
  z: Zadacha6Variant;
}

function candidate(z: Zadacha6Variant): C6 | null {
  let group: string;
  try {
    group = prototype(z.prototypeId).group;
  } catch {
    return null;
  }
  return {
    taskId: z.id,
    prototypeId: z.prototypeId,
    subtype: group,
    source: z.source === 'fipi' ? 'fipi' : 'own',
    stars: null,
    z,
  };
}

export function build(c: C6): VariantTask {
  const { z } = c;
  const p = prototype(z.prototypeId);
  const ris = p.ris(z.params);
  const s = p.solve(z.params);
  const figure = otdelnyy(ris) ? figureOf(ris) : null;
  const u: Uslovie = {
    text: z.text,
    ...(ris !== undefined && figure === null ? { ris } : {}),
    ...(z.posle === undefined ? {} : { posle: z.posle }),
  };
  const razbor = razborHtml(s);
  const otvet = razborAnswer(answerHtml(s.answer));
  const source = sourceOf(z);
  const fallbacks: Fallback[] = [FALLBACK.studentFromHints, FALLBACK.noDifficulty];
  if (source.kind === 'fipi') fallbacks.push(FALLBACK.noPrototypeNo);
  return {
    egeNumber: 6,
    taskId: c.taskId,
    prototypeId: c.prototypeId,
    subtype: c.subtype,
    source,
    difficulty: null,
    statement: renderToStaticMarkup(createElement(Uslovie6, { u })),
    figure,
    figureTeacher: null,
    answer: answerText(s.answer),
    answerHtml: answerHtml(s.answer),
    solutionTeacher: razbor + otvet,
    hints: hintSteps(s.hints),
    solutionStudent:
      studentFromHints(s.hints, []) + `<p class="var-razbor__h">Решаем</p>${razbor}` + otvet,
    fallbacks,
    ref: { prototype: z.prototypeId, id: z.id },
  };
}

function init(data: unknown): SectionAdapter {
  const pool = (data as Zadacha6Variant[]).flatMap((z) => {
    const c = candidate(z);
    return c === null ? [] : [c];
  });
  return {
    info,
    getRandomTask(filters, rng) {
      const c = pickCandidate(pool, filters, rng);
      return c === null ? null : build(c);
    },
  };
}

export const section: SectionModule = {
  load: () =>
    fetch(dataUrl('/variant/dannye/z06.json')).then((r) => {
      if (!r.ok) throw new Error(`нет данных №6: ${r.status}`);
      return r.json() as Promise<unknown>;
    }),
  init,
};
