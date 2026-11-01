/**
 * №19 (варианты 23–24): «галочка» y = k|x| + a и верхняя полуокружность
 * y = √(r² − x²).
 *
 * Ветви y = ±kx + a (x ≥ 0 и x ≤ 0) симметричны, у каждой — не больше
 * одной общей точки с полуокружностью, кроме случая касания, который
 * здесь не наступает при y ≥ 0:
 *  a > r — общих точек нет; a = r — одна (вершина (0; r));
 *  −kr ≤ a < r — каждая ветвь пересекает полуокружность ровно в одной
 *  точке, всего две; a < −kr — нет (при x ≤ r ветвь ниже оси Ox).
 */

import { mnozhKontrol, mnozhPole, mnozhTex, type Kus } from './kMnozh';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PM19 {
  k: number;
  r: number;
  nado: 2 | 1 | 'est';
}

export function chislaM19(p: PM19) {
  const lo = -p.k * p.r;
  const K = (v: number) => ({ v, tex: String(v) });
  const kuski: Kus[] =
    p.nado === 2
      ? [{ lo: K(lo), hi: K(p.r), loZ: true, hiZ: false }]
      : p.nado === 1
        ? [{ lo: K(p.r), hi: K(p.r), loZ: true, hiZ: true }]
        : [{ lo: K(lo), hi: K(p.r), loZ: true, hiZ: true }];
  return { lo, kuski };
}

/** Число решений системы — численно (для проверки). */
export function chisloResheniyM19(k: number, r: number, a: number): number {
  const sol = new Set<string>();
  for (const sg of [1, -1]) {
    /* x² + (sg·k·x + a)² = r², sg·x ≥ 0, y ≥ 0. */
    const A = 1 + k * k;
    const B = 2 * sg * k * a;
    const C = a * a - r * r;
    const D = B * B - 4 * A * C;
    if (D < -1e-12) continue;
    for (const s of [1, -1]) {
      const x = (-B + s * Math.sqrt(Math.max(D, 0))) / (2 * A);
      const y = sg * k * x + a;
      if (sg * x >= -1e-12 && y >= -1e-12) sol.add(`${x.toFixed(9)}|${y.toFixed(9)}`);
    }
  }
  return sol.size;
}

function sobrat(p: PM19): Chast2Zadacha {
  const ch = chislaM19(p);
  const kT = p.k === 1 ? '' : String(p.k);
  const sist = `\\begin{cases}y=${kT}|x|+a,\\\\ y=\\sqrt{${p.r * p.r}-x^2}\\end{cases}`;
  const chto =
    p.nado === 2
      ? 'ровно два решения'
      : p.nado === 1
        ? 'ровно одно решение'
        : 'хотя бы одно решение';
  const otv = mnozhTex(ch.kuski);
  return {
    no: 19,
    shablon: 'm19.galochka',
    uslovie: `Найдите все значения $a$, при каждом из которых система уравнений $${sist}$ имеет ${chto}.`,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Значения $a$',
        pole: { vid: 'promezhutki', verno: mnozhPole(ch.kuski) },
      },
    ],
    otvet: `$${otv}$`,
    reshenie: [
      {
        title: 'Графики',
        lines: [
          `Второе уравнение: $y\\ge0$, $x^2+y^2=${p.r * p.r}$ — верхняя полуокружность радиуса $${p.r}$ с центром в начале координат, концы $(\\pm${p.r};0)$.`,
          `Первое — «галочка» с вершиной $(0;a)$ и ветвями $y=${kT}x+a$ ($x\\ge0$) и $y=-${kT}x+a$ ($x\\le0$). Картина симметрична относительно оси $Oy$.`,
        ],
      },
      {
        title: 'Сдвигаем вершину по оси $Oy$',
        lines: [
          `При $a>${p.r}$ вершина выше полуокружности, ветви уходят вверх — общих точек нет. При $a=${p.r}$ общая точка одна — вершина $(0;${p.r})$: правая ветвь $y=${kT}x+${p.r}$ при $x>0$ проходит выше окружности.`,
          `При $-${p.k * p.r}\\le a<${p.r}$ вершина ниже верхней точки, а правая ветвь в точке $x=${p.r}$ не ниже оси ($${p.k * p.r}+a\\ge0$): ветвь пересекает полуокружность ровно один раз (функция $${kT}x+a$ возрастает, $\\sqrt{${p.r * p.r}-x^2}$ убывает на $[0;${p.r}]$). Левая — симметрично: всего два решения.`,
          `При $a<-${p.k * p.r}$ на отрезке $[0;${p.r}]$ правая ветвь ниже оси $Ox$ — общих точек нет.`,
        ],
      },
      { title: 'Ответ', lines: [`Система имеет ${chto} при $a\\in${otv}$.`] },
    ],
    razbor: [
      {
        slovo: 'Полуокружность и «галочка» с вершиной $(0;a)$',
        formula: `x^2+y^2=${p.r * p.r},\\ y\\ge0`,
      },
      {
        slovo: 'Возрастающая и убывающая функции пересекаются не более одного раза',
        formula: `${kT}x+a=\\sqrt{${p.r * p.r}-x^2}`,
      },
      { slovo: 'Граничные положения', formula: `a=${p.r},\\ a=-${p.k * p.r}` },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: { kuski: mnozhKontrol(ch.kuski) },
  };
}

export const M19_GALOCHKA: Shablon2<PM19> = {
  no: 19,
  prototip: 'Параметр: «галочка» y = k|x| + a и верхняя полуокружность, число решений системы',
  sobrat,
};
