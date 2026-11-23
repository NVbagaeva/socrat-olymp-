/**
 * Картинки задач №9 (раздел хранения 10) для тренажёра, генератора,
 * печати и вариантов: картинки прототипов (illyustracii.ts) и картинки
 * сюжетов аналогов (kartinkiSyuzhetov.ts, lib/kartinkiZadach.ts) под
 * ключом `<прототип>:<сюжет>`. Модуль серверный (illyustracii.ts читает
 * public/ на сборке). Отдельно от illyustracii.ts: тот файл —
 * содержание раздела, его сторожит scripts/check-redesign.mjs.
 */

import { kartinkaSyuzheta } from '../kartinkiZadach';
import { kartinkiPrototipov } from './illyustracii';
import { SYUZHET_KARTINKI_9 } from './kartinkiSyuzhetov';

export interface KartinkaZadachi10 {
  webp: string;
  png: string;
  alt: string;
  width: number;
  height: number;
  /** Копия 280 px — у картинок сюжетов аналогов. */
  webp280?: string;
}

export function kartinkiZadach10(): Record<string, KartinkaZadachi10> {
  const ill: Record<string, KartinkaZadachi10> = { ...kartinkiPrototipov() };
  for (const [k, syuzhet] of Object.entries(SYUZHET_KARTINKI_9)) {
    const s = kartinkaSyuzheta(9, syuzhet);
    if (s) {
      ill[k] = {
        webp: s.src,
        png: s.src,
        webp280: s.src280,
        alt: s.alt,
        width: s.razmer,
        height: s.razmer,
      };
    }
  }
  return ill;
}
