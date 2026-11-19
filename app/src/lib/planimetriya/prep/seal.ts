/**
 * Микрозадача в закрытом виде: то, что уходит на экран. Модуль
 * изоморфный: на сборке им запечатываются зафиксированные варианты,
 * в браузере — свежие по кнопке «Ещё вариант». Чертёж условия — в
 * режиме ученика (данные подписаны), чертёж разбора — в режиме учителя,
 * он закрыт вместе с разбором.
 */

import { nazvanieFakta1 } from '../../../content/spravochnik1/fakty';
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
  /** Факт навыка: кнопка «Показать свойство» в подсказке. */
  fakt: { id: string; nazvanieHtml: string; vNasheyHtml: string } | null;
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
    /* Подсказка: словами, если формула навыка записана общими буквами. */
    formulaHtml: typeset(m.podskazka ?? `$${m.formula}$`),
    fakt:
      typeof m.fakt === 'string'
        ? {
            id: m.fakt,
            nazvanieHtml: typeset(nazvanieFakta1(m.fakt)),
            vNasheyHtml: m.vNashey === undefined ? '' : typeset(m.vNashey),
          }
        : null,
    razbor: sealText(JSON.stringify(razbor), seal),
  };
}
