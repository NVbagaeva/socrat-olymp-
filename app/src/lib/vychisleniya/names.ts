/**
 * Названия прототипов №8, набранные KaTeX, — для блоков прогресса,
 * «Моих ошибок» и закладок. Вызывается на сборке (серверные страницы),
 * в браузер уходит готовый HTML, а не KaTeX.
 */

import { typeset } from '../tex';
import { PROTOTYPE_NAMES } from './ids';
import { SKILL_FORMULA } from '@/content/vychisleniya';

export function names8Html(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(PROTOTYPE_NAMES).map(([id, name]) => [id, typeset(name)]),
  );
}

/**
 * «Запомни» в домашнем задании: формула навыка, набранная на сборке, —
 * по id навыка (S1…S11). Тот же текст, что подсказка тренажёра.
 */
export function memo8Html(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(SKILL_FORMULA).map(([id, tex]) => [id, typeset(`$${tex}$`)]),
  );
}
