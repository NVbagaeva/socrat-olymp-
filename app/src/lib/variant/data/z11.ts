/**
 * Данные задания №11 для «Собрать вариант» (серверная часть,
 * маршрут /variant/dannye/z11.json): условия банка и аналогов **без
 * ответов** — тот же список, что тренажёр и лист №11 получают от
 * сервера (`dannyeTrenazhera().bank`, поле answer туда не переносится).
 * Ответ и разбор браузер считает движком подтипа по параметрам.
 * Разминка (РЗ) в вариант ЕГЭ не входит — её задачи сюда не идут.
 */

import { dannyeTrenazhera } from '@/lib/zadanie11/trenazher/dannye';
import KARTINKI_ANALOGOV_JSON from '@/data/zadanie11/kartinki-analogov.json';
import type { UslovieBanka } from '@/lib/zadanie11/trenazher/sessiya';

const KARTINKI_ANALOGOV = KARTINKI_ANALOGOV_JSON as Readonly<Record<string, string>>;

export function dannye(): UslovieBanka[] {
  return dannyeTrenazhera()
    .bank.filter((b) => !b.razminka && !b.id.startsWith('RZ-'))
    .map((b) => {
      const ks = b.analog === undefined ? undefined : KARTINKI_ANALOGOV[b.analog.kod];
      return b.analog === undefined || ks === undefined ? b : { ...b, analog: { ...b.analog, ks } };
    });
}
