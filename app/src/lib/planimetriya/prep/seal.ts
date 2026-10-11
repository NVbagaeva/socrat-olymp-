/**
 * Микрозадача в закрытом виде: то, что уходит на экран. Модуль
 * изоморфный: на сборке им запечатываются зафиксированные варианты,
 * в браузере — свежие по кнопке «Ещё вариант». Чертёж условия — в
 * режиме ученика (данные подписаны), чертёж разбора — в режиме учителя,
 * он закрыт вместе с разбором.
 */

import { typeset } from '../../tex';
import { renderPlan } from '../render';
import { sealAnswer, sealText } from '../secret';
import { generateMikro, sOtvetom } from './generate';
import type { Mikro } from './types';

export interface MikroSealed {
  id: string;
  seed: string;
  nazvanie: string;
  uslovieHtml: string;
  risunokSvg: string | null;
  seal: string;
  formulaHtml: string;
  /** Разбор: JSON строк HTML и рисунок учителя, закрытые отпечатком. */
  razbor: string;
}

export interface MikroRazbor {
  stroki: string[];
  risunokSvg: string | null;
}

export function sealMikro(m: Mikro, seed: string): MikroSealed {
  const task = generateMikro(m.id, seed);
  const seal = sealAnswer(task.otvet);
  const razbor: MikroRazbor = {
    stroki: task.razbor.map((line) => typeset(line)),
    risunokSvg:
      task.risunok === null
        ? null
        : renderPlan(sOtvetom(task.risunok, task.otvet), {
            rezhim: { rezhim: 'uchitel' },
            chisla: true,
          }),
  };
  return {
    id: m.id,
    seed,
    nazvanie: m.nazvanie,
    uslovieHtml: typeset(task.uslovie),
    risunokSvg:
      task.risunok === null ? null : renderPlan(task.risunok, { chisla: true, alt: m.nazvanie }),
    seal,
    formulaHtml: typeset(`$${m.formula}$`),
    razbor: sealText(JSON.stringify(razbor), seal),
  };
}
