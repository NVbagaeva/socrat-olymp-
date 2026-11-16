/**
 * Таблица умножения: прямая (7 · 8) и обратная (56 = □ · 8).
 *
 * Строка — первый множитель (то, что ученик выбрал: «×8»), второй —
 * от 2 до 9 (и 10, если выбрана строка ×10). Клетка сетки — пара
 * множителей без порядка: 7 · 8 и 8 · 7 — один пример.
 */

import { sdelat } from '../primer';
import type { Priyom, Shag } from '../types';

const num = (s: string | undefined): number => Number(s ?? '0');

export const STROKI_VSE: readonly number[] = [2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Ключ клетки: «7x8» (меньший множитель первым). */
export function kletka(a: number, b: number): string {
  return a <= b ? `${a}x${b}` : `${b}x${a}`;
}

export const tablica: Priyom = {
  id: 'tablica',
  gruppa: 'tablica',
  deystvie: 'tablica',
  deystviya: ['tablica', 'umnozhenie'],
  sozdat(rng, o) {
    const stroki =
      o.stroki !== undefined && o.stroki.length > 0
        ? o.stroki
        : o.uroven === 1
          ? [2, 3, 4, 5]
          : o.uroven === 2
            ? [6, 7, 8, 9]
            : [2, 3, 4, 5, 6, 7, 8, 9];
    const a = rng.pick(stroki);
    const vtorye = stroki.includes(10) ? [2, 3, 4, 5, 6, 7, 8, 9, 10] : [2, 3, 4, 5, 6, 7, 8, 9];
    const b = rng.pick(vtorye);
    const obr = o.obratnaya ?? (o.uroven === 3 && rng.chance(0.4));
    return this.iz(
      [String(a), String(b)],
      o.uroven,
      obr ? 'obr' : rng.chance(0.5) ? 'ba' : undefined,
    );
  },
  /* v: undefined — «a · b», «ba» — «b · a», «obr» — «a·b = □ · a». */
  iz(d, uroven, v) {
    const a = num(d[0]);
    const b = num(d[1]);
    const key = `tablica|${v === 'obr' ? 'obr' : 'pr'}|${kletka(a, b)}`;
    if (v === 'obr') {
      return sdelat({
        priyom: 'tablica',
        uroven,
        deystvie: 'tablica',
        d,
        v,
        expr: `${a * b}/${a}`,
        tex: `${a * b} = \\square\\cdot ${a}`,
        text: `${a * b} = □ · ${a}`,
        key,
      });
    }
    const expr = v === 'ba' ? `${b}*${a}` : `${a}*${b}`;
    return sdelat({
      priyom: 'tablica',
      uroven,
      deystvie: 'tablica',
      d,
      ...(v ? { v } : {}),
      expr,
      key,
    });
  },
  razbor(p) {
    const a = num(p.d[0]);
    const b = num(p.d[1]);
    const n = a * b;
    if (p.v === 'obr') {
      return [
        {
          tekst: `Какое число, умноженное на $${a}$, даёт $${n}$? Вспоминаем строку на $${a}$.`,
          cep: [`${a}*${b}`, `${n}`],
        },
        { cep: [`${n}/${a}`, `${b}`] },
      ];
    }
    const shagi: Shag[] = [];
    if (a === 9 || b === 9) {
      const k = a === 9 ? b : a;
      shagi.push({
        tekst: `Умножить на $9$ — умножить на $10$ и вычесть само число.`,
        cep: [p.expr, `10*${k}-${k}`, `${10 * k}-${k}`, `${n}`],
      });
    } else if (a === 5 || b === 5) {
      const k = a === 5 ? b : a;
      shagi.push({
        tekst: 'Умножить на $5$ — половина от умножения на $10$.',
        cep: [p.expr, `${k}*10/2`, `${10 * k}/2`, `${n}`],
      });
    } else {
      const big = Math.max(a, b);
      const small = Math.min(a, b);
      shagi.push({
        tekst: `Опора на соседний пример: $${big}\\cdot ${small - 1} = ${big * (small - 1)}$, прибавляем ещё $${big}$.`,
        cep: [p.expr, `${big}*${small - 1}+${big}`, `${big * (small - 1)}+${big}`, `${n}`],
      });
    }
    return shagi;
  },
};
