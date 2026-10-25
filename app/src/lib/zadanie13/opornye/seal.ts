/**
 * Задача опорного блока №13 в закрытом виде: то, что уходит на экран.
 *
 * Модуль изоморфный: на сборке им запечатываются задачи банка, в
 * браузере — свежие по кнопке «Ещё вариант». Ответ уходит отпечатком,
 * вместе с ним — отпечатки того же ответа в чужих единицах («число
 * верное, единицы нет»). Пошаговые подсказки и разбор закрыты тем же
 * отпечатком и открываются по кнопке.
 */

import { typeset } from '../../tex';
import type { ShagHtml } from '../../zadanie11/prep/seal';
import { wrongUnitValues } from '../edinicy';
import { generate } from '../generate';
import { kletkiUsloviya, otvetText, tablitsaHtml } from '../html';
import { reshenieHtml } from '../reshenieHtml';
import { choice, SIGN } from '../proto/common';
import { sealAnswer, sealChoice, sealText } from '../secret';
import { TYPE_NAMES, type HintStep, type Task13, type TypeCode } from '../types';
import { tablitsaZapolni13, type TablitsaZapolni13 } from '../zapolni';

export type { ShagHtml };

export interface Vybor13 {
  number: string;
  label: string;
}

export interface Zadacha13Sealed {
  prototypeId: string;
  seed: string;
  uslovieHtml: string;
  /** Таблица условия (график долга), если она есть. */
  tablitsaHtml: string | null;
  /** «Заполни таблицу» (таблица руками): клетки закрыты отпечатками. */
  zapolni: TablitsaZapolni13 | null;
  /** «не из открытого банка», «повышенный уровень». */
  metki: string[];
  /** Выбор схемы в «Определи тип»; null — ответ числом. */
  vybory: Vybor13[] | null;
  /** Отпечаток ответа. */
  seal: string;
  /** Отпечатки того же ответа в других денежных единицах. */
  wrongUnits: string[];
  /** Пошаговые подсказки: JSON ShagHtml[], закрыт отпечатком. */
  podskazki: string;
  /** Разбор: JSON Razbor13, закрыт отпечатком. */
  razbor: string;
}

/** Разбор: решение по шагам общей разметкой и строка ответа. */
export interface Razbor13 {
  html: string;
  otvet: string;
}

const TIPY: TypeCode[] = ['A', 'B', 'C', 'D'];

function nazvanieMalenkoe(type: TypeCode): string {
  const name = TYPE_NAMES[type];
  return name.charAt(0).toLowerCase() + name.slice(1);
}

export function shagiHtml(hints: HintStep[]): ShagHtml[] {
  return hints.map((h) => ({
    question: typeset(h.question),
    options: h.options.map((o) => typeset(o)),
    correct: h.correct,
    comment: h.comment === undefined ? null : typeset(h.comment),
  }));
}

function uslovieHtml(t: Task13): string {
  return t.condition
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => `<p>${typeset(line)}</p>`)
    .join('');
}

function metki(t: Task13): string[] {
  const out: string[] = [];
  if (t.source === 'own') out.push('не из открытого банка');
  if (t.difficulty === 'hard') out.push('повышенный уровень');
  return out;
}

/** Задача с ответом числом: решение движка по шагам. */
function zadachaChislom(t: Task13): Zadacha13Sealed {
  const seal = sealAnswer(t.answer);
  const razbor: Razbor13 = {
    html: reshenieHtml(t.solution, t.tableModel),
    otvet: otvetText(t.answer, t.units),
  };

  return {
    prototypeId: t.prototypeId,
    seed: t.seed,
    uslovieHtml: uslovieHtml(t),
    tablitsaHtml: t.conditionTable ? tablitsaHtml(kletkiUsloviya(t.conditionTable)) : null,
    zapolni: tablitsaZapolni13(t, typeset),
    metki: metki(t),
    vybory: null,
    seal,
    wrongUnits: wrongUnitValues(t.answer, t.units).map((v) => sealAnswer(v)),
    podskazki: sealText(JSON.stringify(shagiHtml(t.hints)), seal),
    razbor: sealText(JSON.stringify(razbor), seal),
  };
}

/** «Определи тип»: условие задачи, ответ — схема словами. */
function zadachaTip(t: Task13, no: number): Zadacha13Sealed {
  const right = String(TIPY.indexOf(t.type) + 1);
  const seal = sealChoice(right);
  const hint = choice(
    'Что сказано в условии?',
    SIGN[t.type],
    TIPY.filter((x) => x !== t.type).map((x) => SIGN[x]),
    no,
    `Это ${nazvanieMalenkoe(t.type)}.`,
  );
  const razbor: Razbor13 = {
    html: reshenieHtml(
      [
        { title: 'Ищем признак', text: `В условии: ${SIGN[t.type]}.` },
        { title: 'Называем схему', text: `Это ${nazvanieMalenkoe(t.type)}.` },
      ],
      null,
    ),
    otvet: TYPE_NAMES[t.type],
  };
  return {
    prototypeId: t.prototypeId,
    seed: t.seed,
    uslovieHtml: uslovieHtml(t),
    tablitsaHtml: t.conditionTable ? tablitsaHtml(kletkiUsloviya(t.conditionTable)) : null,
    zapolni: null,
    metki: metki(t),
    vybory: TIPY.map((x, i) => ({ number: String(i + 1), label: TYPE_NAMES[x] })),
    seal,
    wrongUnits: [],
    podskazki: sealText(JSON.stringify(shagiHtml([hint])), seal),
    razbor: sealText(JSON.stringify(razbor), seal),
  };
}

/** Готовая задача движка в закрытом виде: для опорных задач и тренажёра. */
export function sealTask13(t: Task13, vid: 'zadachi' | 'tip', no: number): Zadacha13Sealed {
  return vid === 'tip' ? zadachaTip(t, no) : zadachaChislom(t);
}

export function sealZadacha13(
  prototypeId: string,
  seed: string,
  vid: 'zadachi' | 'tip',
  no: number,
): Zadacha13Sealed {
  return sealTask13(generate(prototypeId, seed), vid, no);
}
