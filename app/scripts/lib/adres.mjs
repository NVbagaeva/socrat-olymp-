/* Адрес раздела банка профиля — по коду (src/lib/paths.ts): номер
   хранения → код. Для проверок, которые перебирают разделы по номеру. */

import { RAZDELY } from '../../src/content/struktura.js';

/** Код раздела по номеру хранения: 7 → «uravneniya». Не номер — как есть. */
export function kod(x) {
  return RAZDELY.find((r) => String(r.hranenie) === String(x))?.kod ?? String(x);
}
