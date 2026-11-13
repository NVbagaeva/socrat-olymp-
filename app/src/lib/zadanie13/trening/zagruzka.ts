'use client';

/**
 * Задачи тренажёра №13 в браузере для общего тренажёра по банку
 * (lib/trening/zagruzka.ts задаёт тот же интерфейс). Файлов с задачами у
 * №13 нет: движок задач (generate), разметка решения и KaTeX приезжают
 * одним куском при первой задаче — как и в прежнем тренажёре №13, —
 * задача строится по ключу «прототип|seed». Ответ сразу закрывается
 * отпечатком (с ним — тот же ответ в чужих единицах и отпечаток схемы для
 * «Определи тип»); разбор и подсказки — из той же задачи движка.
 */

import type { Zagruzka } from '@/lib/trening/zagruzka';
import type { ShagChasti13 } from '../reshenieHtml';
import type { HintStep, Task13, TypeCode } from '../types';
import { prototipKlyucha13 } from './session';

/** Задача №13 на экране тренажёра. */
export interface Zadacha13 {
  id: string;
  prototypeId: string;
  params: Record<string, unknown>;
  /** Условие: абзацы через перевод строки, формулы в $…$. */
  text: string;
  /** Таблица условия (график долга), готовая разметка; null — таблицы нет. */
  tablitsaHtml: string | null;
  /** «не из открытого банка», «повышенный уровень». */
  metki: string[];
  seal: string;
  /** Отпечатки того же ответа в других денежных единицах. */
  wrongUnits: string[];
  /** Отпечаток верной схемы для «Определи тип» (кнопки 1–4). */
  sealTip: string;
}

/** Подсказка-вопрос в готовом HTML. */
export interface Vopros13 {
  question: string;
  options: string[];
  correct: number;
  comment: string | null;
}

/** Разбор: шаги решения, ответ строкой, вопросы подсказки; то же — для «Определи тип». */
export interface Reshenie13 {
  shagi: ShagChasti13[];
  otvet: string;
  voprosy: Vopros13[];
  tip: { shagi: ShagChasti13[]; otvet: string; voprosy: Vopros13[] };
  type: TypeCode;
}

interface Moduli {
  generate: (prototip: string, seed: string) => Task13;
  typeset: (text: string) => string;
  sealAnswer: (x: number) => string;
  sealChoice: (x: string) => string;
  wrongUnitValues: (answer: number, units: Task13['units']) => number[];
  tablitsa: (t: NonNullable<Task13['conditionTable']>) => string;
  shagami: (t: Task13) => ShagChasti13[];
  shagiTipa: (type: TypeCode) => ShagChasti13[];
  otvetText: (t: Task13) => string;
  podskazkaTipa: (type: TypeCode, shift: number) => HintStep;
  nazvanie: (type: TypeCode) => string;
}

const TIPY: TypeCode[] = ['A', 'B', 'C', 'D'];

let moduli: Moduli | null = null;
let zhdyot: Promise<void> | null = null;
const zadachi = new Map<string, { z: Zadacha13; task: Task13 }>();
const resheniya = new Map<string, Reshenie13>();

function zagruzitModuli(): Promise<void> {
  zhdyot ??= Promise.all([
    import('../generate'),
    import('@/lib/tex'),
    import('../secret'),
    import('../edinicy'),
    import('../html'),
    import('../reshenieHtml'),
    import('../opornye/seal'),
    import('../types'),
  ]).then(([g, tex, secret, ed, html, resh, seal, types]) => {
    moduli = {
      generate: g.generate,
      typeset: tex.typeset,
      sealAnswer: secret.sealAnswer,
      sealChoice: secret.sealChoice,
      wrongUnitValues: ed.wrongUnitValues,
      tablitsa: (t) => html.tablitsaHtml(html.kletkiUsloviya(t)),
      shagami: (t) => resh.reshenieShagami(t.solution, t.tableModel),
      shagiTipa: (type) => resh.reshenieShagami(seal.shagiTipa(type), null),
      otvetText: (t) => html.otvetText(t.answer, t.units),
      podskazkaTipa: seal.podskazkaTipa,
      nazvanie: (type) => types.TYPE_NAMES[type],
    };
  });
  zhdyot.catch(() => {
    zhdyot = null;
  });
  return zhdyot;
}

function metki(t: Task13): string[] {
  const out: string[] = [];
  if (t.source === 'own') out.push('не из открытого банка');
  if (t.difficulty === 'hard') out.push('повышенный уровень');
  return out;
}

function postroit(id: string): { z: Zadacha13; task: Task13 } | undefined {
  const gotovaya = zadachi.get(id);
  if (gotovaya !== undefined || moduli === null) {
    return gotovaya;
  }
  const prototip = prototipKlyucha13(id);
  const seed = id.slice(prototip.length + 1);
  try {
    const task = moduli.generate(prototip, seed);
    const m = moduli;
    const z: Zadacha13 = {
      id,
      prototypeId: prototip,
      params: { seed },
      text: task.condition,
      tablitsaHtml: task.conditionTable === undefined ? null : m.tablitsa(task.conditionTable),
      metki: metki(task),
      seal: m.sealAnswer(task.answer),
      wrongUnits: m.wrongUnitValues(task.answer, task.units).map((v) => m.sealAnswer(v)),
      sealTip: m.sealChoice(String(TIPY.indexOf(task.type) + 1)),
    };
    zadachi.set(id, { z, task });
    return zadachi.get(id);
  } catch {
    /* Движок не собрал задачу по этому ключу (сайт обновился). */
    return undefined;
  }
}

/** Порядок кнопок подсказки «Определи тип» — от ключа задачи, стабильно. */
function sdvig(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 997;
  return h;
}

function voprosyHtml(hints: HintStep[], typeset: (text: string) => string): Vopros13[] {
  return hints.map((h) => ({
    question: typeset(h.question),
    options: h.options.map((o) => typeset(o)),
    correct: h.correct,
    comment: h.comment === undefined ? null : typeset(h.comment),
  }));
}

/** Условие абзацами, формулы — KaTeX; пока KaTeX не приехал — как есть. */
function nabrat(text: string): string {
  if (moduli === null) return text;
  const typeset = moduli.typeset;
  return text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => `<p>${typeset(line)}</p>`)
    .join('');
}

export const ZAGRUZKA13: Zagruzka<Zadacha13, Reshenie13, null> = {
  zagruzit: () => zagruzitModuli(),
  izKesha: (id) => postroit(id)?.z,
  reshenie(z) {
    const gotovoe = resheniya.get(z.id);
    if (gotovoe !== undefined) {
      return gotovoe;
    }
    const zapis = postroit(z.id);
    if (zapis === undefined || moduli === null) {
      return null;
    }
    const t = zapis.task;
    const m = moduli;
    const r: Reshenie13 = {
      shagi: m.shagami(t),
      otvet: m.otvetText(t),
      voprosy: voprosyHtml(t.hints, m.typeset),
      tip: {
        shagi: m.shagiTipa(t.type),
        otvet: m.nazvanie(t.type),
        voprosy: voprosyHtml([m.podskazkaTipa(t.type, sdvig(z.id))], m.typeset),
      },
      type: t.type,
    };
    resheniya.set(z.id, r);
    return r;
  },
  nabrat,
  prototip: () => null,
};
