/**
 * Названия прототипов №8, набранные KaTeX, — для блоков прогресса,
 * «Моих ошибок» и закладок. Вызывается на сборке (серверные страницы),
 * в браузер уходит готовый HTML, а не KaTeX.
 */

import { typeset } from '../tex';
import { PROTOTYPE_NAMES } from './ids';

export function names8Html(): Record<string, string> {
  return Object.fromEntries(Object.entries(PROTOTYPE_NAMES).map(([id, name]) => [id, typeset(name)]));
}
