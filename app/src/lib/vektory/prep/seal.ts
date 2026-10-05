/**
 * Микрозадача в закрытом виде: то, что уходит на экран.
 *
 * Модуль изоморфный: на сборке им запечатываются зафиксированные
 * варианты, в браузере — свежие по кнопке «Ещё вариант». Рисунок
 * собирается движком здесь же: SVG без катетов для условия и с
 * катетами для разбора — второй закрыт вместе с разбором.
 */

import { typeset } from '../../tex';
import { renderVectorPlane } from '../render';
import { sealAnswer, sealChoice, sealText } from '../secret';
import { generateMikro } from './generate';
import type { Mikro, MikroVybor } from './types';

export interface MikroSealed {
  id: string;
  seed: string;
  nazvanie: string;
  uslovieHtml: string;
  /** Рисунок условия без катетов; null — задача по координатам. */
  risunokSvg: string | null;
  answerType: 'number' | 'choice';
  /** Варианты с набранными подписями. */
  vybory: MikroVybor[] | null;
  /** Отпечаток ответа. */
  seal: string;
  /** Формула-подсказка, свёрстана. Ответа в ней нет. */
  formulaHtml: string;
  /** Разбор: JSON строк HTML и рисунок с катетами, закрытые отпечатком. */
  razbor: string;
}

export interface MikroRazbor {
  stroki: string[];
  risunokSvg: string | null;
}

export function sealMikro(m: Mikro, seed: string): MikroSealed {
  const task = generateMikro(m.id, seed);
  const seal = typeof task.otvet === 'number' ? sealAnswer(task.otvet) : sealChoice(task.otvet);
  const razbor: MikroRazbor = {
    stroki: task.razbor.map((line) => typeset(line)),
    risunokSvg: task.risunok === null ? null : renderVectorPlane({ ...task.risunok, hints: true }),
  };
  return {
    id: m.id,
    seed,
    nazvanie: m.nazvanie,
    uslovieHtml: typeset(task.uslovie),
    risunokSvg: task.risunok === null ? null : renderVectorPlane(task.risunok),
    answerType: m.answerType,
    vybory:
      task.vybory === undefined
        ? null
        : task.vybory.map((v) => ({ number: v.number, label: typeset(v.label) })),
    seal,
    formulaHtml: typeset(`$${m.formula}$`),
    razbor: sealText(JSON.stringify(razbor), seal),
  };
}
