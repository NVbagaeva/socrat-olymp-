/**
 * Живые рисунки №19: подвижная линия на ползунке параметра.
 *
 * Описание — данные и функции; функции в браузер со страницы не
 * передать, поэтому компонент (components/zadanie19/Zhivoy19.tsx)
 * берёт описание здесь по id. Число решений считается точно —
 * не по картинке: для ломаных — по кускам, где функция линейна.
 */

import { grafik, pryamaya, scena, tochka, type Scena19 } from './risunok';

export interface Osoboe19 {
  a: number;
  /** Подпись кнопки: TeX без долларов. */
  tex: string;
}

export interface Zhivoy19 {
  bukva: string;
  min: number;
  max: number;
  shag: number;
  start: number;
  osobye: Osoboe19[];
  scena: (a: number) => Scena19;
  /** Число решений; Infinity — бесконечно много. */
  resheniy: (a: number) => number;
}

/** Корни кусочно-линейной f: изломы известны, на каждом куске — линейное уравнение. */
export function korniKL(f: (x: number) => number, izlomy: number[]): number {
  const t = [...new Set(izlomy)].sort((p, q) => p - q);
  const granicy = [-Infinity, ...t, Infinity];
  const korni: number[] = [];
  for (let i = 0; i + 1 < granicy.length; i++) {
    const lo = granicy[i]!;
    const hi = granicy[i + 1]!;
    const p =
      lo === -Infinity ? (hi === Infinity ? 0 : hi - 1) : hi === Infinity ? lo + 1 : (lo + hi) / 2;
    const q = lo === -Infinity ? p - 1 : hi === Infinity ? p + 1 : (lo + 3 * hi) / 4;
    const k = (f(q) - f(p)) / (q - p);
    const b = f(p) - k * p;
    if (Math.abs(k) < 1e-12) {
      if (Math.abs(b) < 1e-12) return Infinity;
      continue;
    }
    const x = -b / k;
    if (x >= lo - 1e-12 && x <= hi + 1e-12 && !korni.some((y) => Math.abs(x - y) < 1e-9)) {
      korni.push(x);
    }
  }
  return korni.length;
}

const W = (x: number) => Math.abs(Math.abs(x) - 2);

const ZHIVYE: Record<string, Zhivoy19> = {
  /* Разбор метода 1: ||x| − 2| = a(x − 8) + 2, пучок через A(8; 2). */
  'm01-r1': {
    bukva: 'a',
    min: -1.5,
    max: 1.5,
    shag: 0.01,
    start: 0.25,
    osobye: [
      { a: -1, tex: '-1' },
      { a: 0, tex: '0' },
      { a: 1 / 5, tex: '\\frac15' },
      { a: 1 / 3, tex: '\\frac13' },
      { a: 1, tex: '1' },
    ],
    scena: (a) =>
      scena(
        { x: [-6, 10], y: [-3, 6] },
        {
          curves: [grafik(W), pryamaya(a, 2 - 8 * a, 'lineB')],
          points: [tochka(8, 2, 'A'), tochka(2, 0, 'B'), tochka(-2, 0, 'C'), tochka(0, 2, 'D')],
        },
        `Ломаная y = ||x| − 2| и прямая y = a(x − 8) + 2 при a = ${String(Math.round(a * 100) / 100).replace('.', ',')}`,
      ),
    resheniy: (a) => korniKL((x) => W(x) - a * (x - 8) - 2, [-2, 0, 2]),
  },
};

export function zhivoy19(id: string): Zhivoy19 | undefined {
  return ZHIVYE[id];
}
