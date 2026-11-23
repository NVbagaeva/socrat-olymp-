/**
 * Общее для живых чертежей с графиком на стеклянной плите (№8, №9, №12):
 * плита лежит наклонно, как на картинке, а график стоит на ней
 * вертикальной стенкой вдоль средней линии. Стенка — тоже аффинная
 * плоскость (Plita): ось x — вдоль плиты, ось y — вверх по экрану, так
 * что ручки тянутся в координатах графика через sEkrana.
 */

import { naEkran, type Plita, type Tochka } from './obshchee';

/** Плита 8 × 6 клеток — та же посадка, что у «Векторов», чуть ниже. */
export const PLITA: Plita = { o: [15, 150], ex: [19, 9], ey: [13, -14] };

/** Стенка графика над линией y = yPlity плиты; ед — пикселей на единицу. */
export function stena(yPlity: number, ed: number, pl: Plita = PLITA): Plita {
  return { o: naEkran(pl, 0, yPlity), ex: pl.ex, ey: [0, -ed] };
}

/** Путь по точкам функции в координатах стенки. */
export function putFunkcii(
  st: Plita,
  f: (x: number) => number,
  x0: number,
  x1: number,
  n = 80,
): string {
  let d = '';
  for (let i = 0; i <= n; i += 1) {
    const x = x0 + ((x1 - x0) * i) / n;
    const [a, b] = naEkran(st, x, f(x));
    d += `${i === 0 ? 'M' : 'L'}${a.toFixed(1)} ${b.toFixed(1)}`;
  }
  return d;
}

/** Заливка под графиком до основания стенки — стекло. */
export function zalivkaPod(
  st: Plita,
  f: (x: number) => number,
  x0: number,
  x1: number,
  n = 80,
): string {
  const [a0, b0] = naEkran(st, x0, 0);
  const [a1, b1] = naEkran(st, x1, 0);
  return `${putFunkcii(st, f, x0, x1, n)}L${a1.toFixed(1)} ${b1.toFixed(1)}L${a0.toFixed(1)} ${b0.toFixed(1)}Z`;
}

/** Число для KaTeX: десятичная запятая в фигурных скобках, обычный минус. */
export function tex(v: number, znakov = 1): string {
  const k = 10 ** znakov;
  const r = Math.round(v * k) / k;
  return (Object.is(r, -0) ? 0 : r).toString().replace('.', '{,}');
}

export const tochkaStr = (p: Tochka) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
