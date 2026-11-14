/**
 * Режим «С оформлением» тренажёра №13 — как в прежнем тренажёре: перед
 * числом ученик выбирает схему и заполняет первую строку таблицы (клетки,
 * которые считаются по условию). Ответ — одна строка JSON
 * { s: номер схемы, k: клетки, o: число }. Засчитывается, когда верны все
 * три части; число проверяется по общему правилу записи (lib/otvet) и с
 * вердиктом «число верное, единицы нет».
 */

import type { Reading } from '@/lib/otvet';
import { answerMatches } from '../secret';
import type { Oformlenie13 } from '../trenazher/zadacha';
import { proverit13 } from './otvet13';

/** Ответ с оформлением. */
export interface Oformlennyy13 {
  s: number | null;
  k: Record<string, string>;
  o: string;
}

export function razobratOformlenie(value: string): Oformlennyy13 {
  try {
    const raw = JSON.parse(value) as Partial<Oformlennyy13>;
    return {
      s: typeof raw.s === 'number' ? raw.s : null,
      k: typeof raw.k === 'object' && raw.k !== null ? raw.k : {},
      o: typeof raw.o === 'string' ? raw.o : '',
    };
  } catch {
    return { s: null, k: {}, o: '' };
  }
}

/** Клетки первой строки, которые считает ученик: индекс → отпечаток. */
export function svoiKletki(of: Oformlenie13): [string, string][] {
  return (of.stroka?.kletki ?? []).flatMap((k, i) =>
    k.seal === null ? [] : [[String(i), k.seal] as [string, string]],
  );
}

/** Что в ответе с оформлением неверно: схема и номера неверных клеток. */
export function oshibkiOformleniya(of: Oformlenie13, a: Oformlennyy13) {
  return {
    shema: a.s !== of.shema.correct,
    kletki: svoiKletki(of)
      .filter(([i, seal]) => !answerMatches(a.k[i] ?? '', seal))
      .map(([i]) => i),
  };
}

/** Все части заполнены: схема выбрана, свои клетки и число введены. */
export function gotovOformlenie(of: Oformlenie13 | null, value: string): boolean {
  const a = razobratOformlenie(value);
  if (of === null) return a.o.trim() !== '';
  return (
    a.s !== null && a.o.trim() !== '' && svoiKletki(of).every(([i]) => (a.k[i] ?? '').trim() !== '')
  );
}

/**
 * Проверка ответа с оформлением. Запись числа неверна (дробь, лишние
 * знаки) — подсказка, попытка не тратится. «Единицы» — когда схема и
 * клетки верны, а число записано в чужих единицах.
 */
export function proveritOformlenie(
  value: string,
  z: { seal: string; wrongUnits: readonly string[]; sealTip: string },
  of: Oformlenie13 | null,
): Reading | { kind: 'edinicy' } {
  const a = razobratOformlenie(value);
  const chislo = proverit13(a.o, z, false);
  if (chislo.kind === 'format' || chislo.kind === 'fractionRight') return chislo;
  const osh = of === null ? { shema: false, kletki: [] } : oshibkiOformleniya(of, a);
  const oformleno = !osh.shema && osh.kletki.length === 0;
  if (oformleno && chislo.kind === 'edinicy') return chislo;
  const right = oformleno && chislo.kind === 'answer' && chislo.right;
  return {
    kind: 'answer',
    value: chislo.kind === 'answer' ? chislo.value : a.o,
    right,
    viaFraction: false,
  };
}
