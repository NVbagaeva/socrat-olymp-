/**
 * Проверка ответа пункта б) №18: одно число. Разбор числа — общий
 * (chislo16 из lib/zadanie16/otvet.ts): целые и десятичные через
 * запятую или точку, дроби a/b и \dfrac, корни √3, sqrt3, sqrt(3),
 * \sqrt{3} с множителем. Здесь запись только приводится к его виду:
 * TeX-запятая 9{,}6, знаки умножения, градусы, лишние скобки.
 */

import { chislo16 } from '@/lib/zadanie16/otvet';

/** Число из записи ученика или из ответа в TeX. Не число — null. */
export function chisloOtveta18(zapis: string): number | null {
  const s = zapis
    .replace(/\$/g, '')
    .replace(/\{,\}/g, ',')
    .replace(/\\[,;:! ]/g, '')
    .replace(/\^\{?\\circ\}?|°/g, '')
    .replace(/\\cdot|[·×*]/g, '')
    .replace(/\s+/g, '')
    .replace(/[−–—]/g, '-');
  if (s === '') return null;
  const x = chislo16(s) ?? chislo16(s.replace(/[()]/g, ''));
  return x === null || !Number.isFinite(x) ? null : x;
}

export type Proverka18 = 'verno' | 'neverno' | { oshibka: string };

/** Ответ ученика против ответа задачи (TeX). */
export function proverit18(vvod: string, etalon: string): Proverka18 {
  const e = chisloOtveta18(etalon);
  if (e === null) throw new Error(`Ответ в данных не разбирается: ${etalon}`);
  if (vvod.trim() === '') return { oshibka: 'Введите ответ.' };
  const u = chisloOtveta18(vvod);
  if (u === null) {
    return {
      oshibka:
        'Не понял число. Дробь пиши через косую черту, корень — знаком √ или словом sqrt, десятичную дробь — через запятую.',
    };
  }
  return Math.abs(u - e) <= 1e-9 * Math.max(1, Math.abs(e)) ? 'verno' : 'neverno';
}
