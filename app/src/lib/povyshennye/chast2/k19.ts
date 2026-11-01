/**
 * №19 (варианты 19–20): квадрат |x − p| + |y − q| = s и окружность
 * (x − p)² + (y − q)² = a² с общим центром.
 *
 * Сдвиг u = x − p, v = y − q. Квадрат |u| + |v| = s вписан в окружность
 * радиуса s и описан около окружности радиуса s/√2. Окружность радиуса
 * |a|: при |a| < s/√2 или |a| > s — нет решений; |a| = s/√2 — 4
 * (точки касания); s/√2 < |a| < s — 8 (по две на каждой стороне);
 * |a| = s — 4 (вершины). При a = 0 решений нет (s > 0).
 */

import { div, rat, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex, surdToNumber } from '@/lib/zadanie15/core/surd';
import { mnozhKontrol, mnozhPole, mnozhTex, type Kus } from './kMnozh';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PK19 {
  p: number;
  q: number;
  /** s² (s = √s2). */
  s2: number;
  /** Сколько решений: ровно 8, ровно 4, хотя бы одно. */
  nado: 8 | 4 | 'est';
}

const kv = (x: Rat) => surdTex(sqrtRat(x));

export function chislaK19(p: PK19) {
  const s2 = rat(p.s2);
  const r2 = div(s2, rat(2));
  const s = surdToNumber(sqrtRat(s2));
  const r = surdToNumber(sqrtRat(r2));
  const K = (v: number, t: string) => ({ v, tex: t });
  const sT = kv(s2);
  const rT = kv(r2);
  let kuski: Kus[];
  if (p.nado === 8) {
    kuski = [
      { lo: K(-s, `-${sT}`), hi: K(-r, `-${rT}`), loZ: false, hiZ: false },
      { lo: K(r, rT), hi: K(s, sT), loZ: false, hiZ: false },
    ];
  } else if (p.nado === 4) {
    kuski = [
      { lo: K(-s, `-${sT}`), hi: K(-s, `-${sT}`), loZ: true, hiZ: true },
      { lo: K(-r, `-${rT}`), hi: K(-r, `-${rT}`), loZ: true, hiZ: true },
      { lo: K(r, rT), hi: K(r, rT), loZ: true, hiZ: true },
      { lo: K(s, sT), hi: K(s, sT), loZ: true, hiZ: true },
    ];
  } else {
    kuski = [
      { lo: K(-s, `-${sT}`), hi: K(-r, `-${rT}`), loZ: true, hiZ: true },
      { lo: K(r, rT), hi: K(s, sT), loZ: true, hiZ: true },
    ];
  }
  return { s2, r2, s, r, sT, rT, kuski };
}

/** Число решений системы при данном a — вторым счётом (для проверки). */
export function chisloResheniyK19(s: number, a: number): number {
  const R = Math.abs(a);
  const r = s / Math.SQRT2;
  const eps = 1e-12;
  if (R < r - eps || R > s + eps) return 0;
  if (Math.abs(R - r) < eps || Math.abs(R - s) < eps) return 4;
  return 8;
}

function sobrat(p: PK19): Chast2Zadacha {
  const ch = chislaK19(p);
  const sh = (c: number, b: string) => (c === 0 ? b : `(${b}${c > 0 ? '-' : '+'}${Math.abs(c)})`);
  const u = sh(p.p, 'x');
  const v = sh(p.q, 'y');
  const mod = (c: number, b: string) =>
    c === 0 ? `|${b}|` : `|${b}${c > 0 ? '-' : '+'}${Math.abs(c)}|`;
  const sist = `\\begin{cases}${mod(p.p, 'x')}+${mod(p.q, 'y')}=${ch.sT},\\\\ ${u}^2+${v}^2=a^2\\end{cases}`;
  const chto =
    p.nado === 8
      ? 'ровно восемь решений'
      : p.nado === 4
        ? 'ровно четыре решения'
        : 'хотя бы одно решение';
  const otv = mnozhTex(ch.kuski);
  return {
    no: 19,
    shablon: 'k19.kvadratOkr',
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
        title: 'Сдвиг начала координат',
        lines: [
          `Пусть $u=x${p.p === 0 ? '' : p.p > 0 ? `-${p.p}` : `+${-p.p}`}$, $v=y${p.q === 0 ? '' : p.q > 0 ? `-${p.q}` : `+${-p.q}`}$. Каждому решению $(u;v)$ соответствует ровно одно решение $(x;y)$, система принимает вид $|u|+|v|=${ch.sT}$, $u^2+v^2=a^2$.`,
          `Первое уравнение задаёт квадрат с вершинами $(\\pm${ch.sT};0)$, $(0;\\pm${ch.sT})$, второе при $a\\ne0$ — окружность с центром в начале координат радиуса $|a|$; при $a=0$ — точку $(0;0)$, которая не лежит на квадрате.`,
        ],
      },
      {
        title: 'Взаимное расположение',
        lines: [
          `Расстояние от центра до стороны квадрата (например, до прямой $u+v=${ch.sT}$) равно $\\dfrac{${ch.sT}}{\\sqrt2}=${ch.rT}$, до вершин — $${ch.sT}$.`,
          `При $|a|<${ch.rT}$ и $|a|>${ch.sT}$ общих точек нет. При $|a|=${ch.rT}$ окружность касается четырёх сторон — 4 решения. При $${ch.rT}<|a|<${ch.sT}$ она пересекает каждую сторону в двух точках — 8 решений. При $|a|=${ch.sT}$ проходит через 4 вершины — 4 решения.`,
        ],
      },
      {
        title: 'Ответ',
        lines: [`Система имеет ${chto} при $a\\in${otv}$.`],
      },
    ],
    razbor: [
      { slovo: 'Сдвиг: центр — в начало координат', formula: `|u|+|v|=${ch.sT},\\ u^2+v^2=a^2` },
      { slovo: 'Квадрат и окружность радиуса $|a|$', formula: `${ch.rT}\\le|a|\\le${ch.sT}` },
      { slovo: 'Касание — 4, пересечение — 8, вершины — 4', formula: 'a=0:\\ \\text{нет решений}' },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: { kuski: mnozhKontrol(ch.kuski), s: ch.s, r2: toNumber(ch.r2) },
  };
}

export const K19_KVADRAT_OKR: Shablon2<PK19> = {
  no: 19,
  prototip:
    'Система «квадрат |x| + |y| = s и окружность радиуса |a|»: число решений по взаимному расположению',
  sobrat,
};
