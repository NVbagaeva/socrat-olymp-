/**
 * Микро-задача в закрытом виде: то, что уходит на экран.
 *
 * Модуль изоморфный: на сборке им запечатываются зафиксированные
 * варианты, в браузере — свежие по кнопке «Ещё вариант».
 */

import { typeset } from '../../tex';
import { razborData } from '../razbor';
import { sealAnswer, sealChoice, sealText } from '../secret';
import { generatePrep } from './generate';
import type { PrepChoice, PrepMicro } from './types';

export interface PrepSealed {
  id: string;
  seed: string;
  nazvanie: string;
  uslovieHtml: string;
  answerType: 'number' | 'choice';
  choices: PrepChoice[] | null;
  /** Отпечаток ответа. */
  seal: string;
  /** Формула-подсказка, свёрстана. Ответа в ней нет. */
  formulaHtml: string;
  /** Решение (RazborHtml, JSON), закрытое отпечатком. */
  razbor: string;
}

export function sealPrep(micro: PrepMicro, seed: string): PrepSealed {
  const task = generatePrep(micro.id, seed);
  const seal = typeof task.otvet === 'number' ? sealAnswer(task.otvet) : sealChoice(task.otvet);
  return {
    id: micro.id,
    seed,
    nazvanie: micro.nazvanie,
    uslovieHtml: typeset(task.uslovie),
    answerType: micro.answerType,
    choices: micro.choices ?? null,
    seal,
    formulaHtml: typeset(`$${micro.formula}$`),
    razbor: sealText(JSON.stringify(razborData(task.razbor)), seal),
  };
}
