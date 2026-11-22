/**
 * Разобранный пример типа №13 для карты задания («О задании»): задача
 * движка по прототипу и seed, её таблица условия, решение по частям шага
 * и ответ строкой — без правки содержания. Модуль изоморфный: первый
 * раскрытый пример собирается на сборке, остальные — в браузере по
 * раскрытию карточки (отдельным куском).
 */

import { typeset } from '../tex';
import { generate } from './generate';
import { kletkiUsloviya, otvetText, tablitsaHtml } from './html';
import { reshenieShagami, type ShagChasti13 } from './reshenieHtml';
import type { Units, Vopros13 } from './types';

export interface Primer13 {
  uslovieHtml: string;
  tablitsaHtml: string | null;
  shagi: ShagChasti13[];
  otvet: string;
  vopros: Vopros13 | undefined;
  units: Units;
}

export function primer13(prototypeId: string, seed: string): Primer13 {
  const t = generate(prototypeId, seed);
  return {
    uslovieHtml: t.condition
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => `<p>${typeset(line)}</p>`)
      .join(''),
    tablitsaHtml: t.conditionTable ? tablitsaHtml(kletkiUsloviya(t.conditionTable)) : null,
    shagi: reshenieShagami(t.solution, t.tableModel),
    otvet: otvetText(t.answer, t.units),
    vopros: t.vopros,
    units: t.units,
  };
}
