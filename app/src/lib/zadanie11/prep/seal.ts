/**
 * Микрозадача №11 в закрытом виде: то, что уходит на экран.
 *
 * Модуль изоморфный: на сборке им запечатываются зафиксированные
 * варианты, в браузере — свежие по кнопке «Ещё вариант». Ответ уходит
 * отпечатком; пошаговые подсказки и разбор (с заполненной таблицей)
 * закрыты тем же отпечатком и открываются по кнопке. Таблица условия
 * с клетками «?» идёт открыто — ответа в ней нет.
 */

import { typesetKrupno as typeset } from '../../tex';
import { sealAnswer, sealChoice, sealText } from '../secret';
import type { Tablitsa } from '../types';
import { generateMikro } from './generate';
import type { Mikro, MikroVybor } from './types';

export interface ShagHtml {
  question: string;
  options: string[];
  correct: number;
  comment: string | null;
}

export interface MikroSealed11 {
  id: string;
  seed: string;
  nazvanie: string;
  uslovieHtml: string;
  tablitsa: Tablitsa | null;
  answerType: 'number' | 'choice';
  vybory: MikroVybor[] | null;
  /** Отпечаток ответа. */
  seal: string;
  /** Пошаговые подсказки: JSON ShagHtml[], закрыт отпечатком. */
  podskazki: string;
  /** Разбор: JSON MikroRazbor11, закрыт отпечатком. */
  razbor: string;
}

export interface MikroRazbor11 {
  stroki: string[];
  tablitsa: Tablitsa | null;
}

export function sealMikro11(m: Mikro, seed: string): MikroSealed11 {
  const task = generateMikro(m.id, seed);
  const seal = typeof task.otvet === 'number' ? sealAnswer(task.otvet) : sealChoice(task.otvet);
  const shagi: ShagHtml[] = task.hints.map((h) => ({
    question: typeset(h.question),
    options: h.options.map((o) => typeset(o)),
    correct: h.correct,
    comment: h.comment === undefined ? null : typeset(h.comment),
  }));
  const razbor: MikroRazbor11 = {
    stroki: task.razbor.map((line) => typeset(line)),
    tablitsa: task.razborTablitsa ?? null,
  };
  return {
    id: m.id,
    seed,
    nazvanie: m.nazvanie,
    uslovieHtml: typeset(task.uslovie),
    tablitsa: task.tablitsa ?? null,
    answerType: task.answerType,
    vybory:
      task.vybory === undefined
        ? null
        : task.vybory.map((v) => ({ number: v.number, label: typeset(v.label) })),
    seal,
    podskazki: sealText(JSON.stringify(shagi), seal),
    razbor: sealText(JSON.stringify(razbor), seal),
  };
}
