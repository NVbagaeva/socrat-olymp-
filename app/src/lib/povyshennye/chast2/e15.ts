/**
 * №15 (варианты 9–10): прямая призма ABCDA₁B₁C₁D₁, в основании
 * трапеция ABCD с основаниями BC = b, AD = d и боковой стороной AB.
 *
 * Числа: AB = 2r, CD = b + d − 2r, r = bd/(b + d) — трапеция
 * прямоугольная (AB ⊥ AD) и описанная (AB + CD = BC + AD). Условие
 * (BC₁ = A₁C₁ или BD = DA₁) даёт высоту призмы h = AB = 2r, поэтому в
 * призму вписывается шар. б) Расстояние от точки до плоскости — в
 * координатах: все координаты целые.
 */

import { chertezhSvg, postroit, sVidom, vybratVid, type Scenariy } from '@/lib/chertezh3';
import { obernut3d } from '@/lib/stereo/zhivoy';
import { rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex, surdToNumber } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

type V3 = [number, number, number];

export interface PE15 {
  b: number;
  d: number;
  usl: 'BC1=A1C1' | 'BD=DA1';
  /** б) расстояние от точки до плоскости. */
  t: string;
  pl: readonly [string, string, string];
}

export function chislaE15(p: PE15) {
  const r = (p.b * p.d) / (p.b + p.d);
  if (!Number.isInteger(r) || p.b >= p.d) throw new Error('e15: r не целое');
  const AB = 2 * r;
  const CD = p.b + p.d - 2 * r;
  const h = AB;
  const T: Record<string, V3> = {
    A: [0, 0, 0],
    B: [0, AB, 0],
    C: [p.b, AB, 0],
    D: [p.d, 0, 0],
    A1: [0, 0, h],
    B1: [0, AB, h],
    C1: [p.b, AB, h],
    D1: [p.d, 0, h],
  };
  const sub = (P: V3, Q: V3): V3 => [P[0] - Q[0], P[1] - Q[1], P[2] - Q[2]];
  const X = T[p.pl[0]]!;
  const u = sub(T[p.pl[1]]!, X);
  const v = sub(T[p.pl[2]]!, X);
  let n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const g = (a: number, c: number): number => (c === 0 ? Math.abs(a) : g(c, a % c));
  const gg = g(g(n[0], n[1]), n[2]) || 1;
  n = [n[0] / gg, n[1] / gg, n[2] / gg];
  const w = sub(T[p.t]!, X);
  const num = Math.abs(n[0] * w[0] + n[1] * w[1] + n[2] * w[2]);
  const nn = n[0] ** 2 + n[1] ** 2 + n[2] ** 2;
  const dist = sqrtRat(rat(num * num, nn));
  /* Уравнение плоскости n·(x − X) = 0: n·x = n·X. */
  const D0 = n[0] * X[0] + n[1] * X[1] + n[2] * X[2];
  return { r, AB, CD, h, T, n, num, nn, dist, u, v, D0 };
}

const im = (P: string) => P.replace(/(\d)/, '_$1');

function scenariy(p: PE15, punkt: 'a' | 'b'): Scenariy {
  const c = chislaE15(p);
  const sc: Scenariy = {
    id: `PV-E15-${punkt}`,
    alt:
      punkt === 'a'
        ? 'Прямая призма, в основании прямоугольная трапеция ABCD, боковая сторона AB перпендикулярна основаниям'
        : 'Прямая призма над трапецией и плоскость пункта б',
    telo: {
      vid: 'pryamaya-prizma',
      osnovanie: [
        [0, 0],
        [p.d, 0],
        [p.b, c.AB],
        [0, c.AB],
      ],
      h: c.h,
    },
    imena: ['A', 'D', 'C', 'B', 'A1', 'D1', 'C1', 'B1'],
    elementy:
      punkt === 'a'
        ? p.usl === 'BC1=A1C1'
          ? [
              { id: 'bc1', vid: 'otrezok', tochki: ['B', 'C1'], rol: 'uslovie' },
              { id: 'a1c1', vid: 'otrezok', tochki: ['A1', 'C1'], rol: 'uslovie' },
            ]
          : [
              { id: 'bd', vid: 'otrezok', tochki: ['B', 'D'], rol: 'uslovie' },
              { id: 'da1', vid: 'otrezok', tochki: ['D', 'A1'], rol: 'uslovie' },
            ]
        : [{ id: 'pl', vid: 'ploskost', tochki: [p.pl[0], p.pl[1], p.pl[2]], rol: 'uslovie' }],
  };
  if (punkt === 'b') {
    const a = scenariy(p, 'a');
    return { ...sc, rakurs: a.rakurs, szhatie: a.szhatie };
  }
  return sVidom(sc, vybratVid(postroit(sc)));
}

export function scenariyE15(p: PE15, punkt: 'a' | 'b'): Scenariy {
  return scenariy(p, punkt);
}

function chertezh(p: PE15, punkt: 'a' | 'b'): string {
  /* На экране чертёж решения вращается руками (lib/stereo/zhivoy.ts). */
  return obernut3d(
    chertezhSvg(scenariy(p, punkt), { rezhim: 'uchitel', shirina: 300, klass: 'ch3-svg' }),
    { sc: scenariy(p, punkt), vspom: true },
  );
}

const vT = (v: readonly number[]) => `\\left(${v.join(';\\,')}\\right)`;

function sobrat(p: PE15): Chast2Zadacha {
  const c = chislaE15(p);
  if (c.num === 0) throw new Error('e15: точка в плоскости');
  const otv = surdTex(c.dist);
  const s = p.d - p.b;
  const uslTex = p.usl === 'BC1=A1C1' ? 'BC_1=A_1C_1' : 'BD=DA_1';
  const uslovie =
    `В прямой призме $ABCDA_1B_1C_1D_1$ основанием является трапеция $ABCD$ с боковой стороной $AB$, $AB=${c.AB}$, $BC=${p.b}$, $CD=${c.CD}$, $AD=${p.d}$, $${uslTex}$.\n` +
    `а) Докажите, что в призму $ABCDA_1B_1C_1D_1$ можно вписать шар.\n` +
    `б) Найдите расстояние от точки $${im(p.t)}$ до плоскости $${p.pl.map(im).join('')}$.`;
  const visota =
    p.usl === 'BC1=A1C1'
      ? `$A_1C_1=AC$, $AC^2=AB^2+BC^2$, $BC_1^2=BC^2+CC_1^2$ (боковые рёбра перпендикулярны основанию). Из $BC_1=A_1C_1$: $CC_1^2=AB^2$, то есть высота призмы $h=AB=${c.AB}$.`
      : `$BD^2=AB^2+AD^2$, $DA_1^2=AD^2+AA_1^2$ (боковые рёбра перпендикулярны основанию). Из $BD=DA_1$: $AA_1^2=AB^2$, то есть высота призмы $h=AB=${c.AB}$.`;
  const pts = [p.t, ...p.pl].filter((x, i, a) => a.indexOf(x) === i);
  const nT = vT(c.n);
  const urT = `${c.n
    .map((k, i) =>
      k === 0 ? '' : `${k < 0 ? '-' : '+'}${Math.abs(k) === 1 ? '' : Math.abs(k)}${'xyz'[i]}`,
    )
    .join('')
    .replace(/^\+/, '')}=${c.D0}`;
  return {
    no: 15,
    shablon: 'e15.prizmaTrapeciya',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: 'Расстояние',
        pole: { vid: 'chislo', verno: otv.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otv}$`,
    reshenie: [
      {
        title: 'а) Трапеция прямоугольная',
        risunok: chertezh(p, 'a'),
        lines: [
          `Пусть $x$ — проекция стороны $AB$ на прямую $AD$; тогда проекция $CD$ равна $AD-BC-x=${s}-x$. Высоты трапеции из $B$ и $C$ равны: по {{t:pifagor|теореме Пифагора}} $${c.AB}^2-x^2=${c.CD}^2-(${s}-x)^2$, откуда $x=0$.`,
          `Значит, $AB\\perp AD$ и $AB$ — высота трапеции.`,
        ],
      },
      {
        title: 'а) Вписанная окружность и высота призмы',
        lines: [
          `$AB+CD=${c.AB}+${c.CD}=${c.AB + c.CD}=BC+AD$, поэтому в трапецию {{t:opisannyy-chetyrehugolnik|можно вписать окружность}}; она касается обоих оснований, её радиус $r=\\dfrac{AB}{2}=${c.r}$.`,
          visota,
          `Высота призмы равна диаметру окружности, вписанной в основание, поэтому {{t:shar-v-prizme|в призму можно вписать шар}}: его центр — над центром вписанной окружности на высоте $${c.r}$.`,
        ],
      },
      {
        title: 'б) Координаты',
        risunok: chertezh(p, 'b'),
        lines: [
          `Начало — в точке $A$, ось $Ox$ — по лучу $AD$, $Oy$ — по лучу $AB$, $Oz$ — по лучу $AA_1$. Тогда $${pts.map((P) => `${im(P)}${vT(c.T[P]!)}`).join(',\\ ')}$.`,
          `$\\overrightarrow{${im(p.pl[0])}${im(p.pl[1])}}=${vT(c.u)}$, $\\overrightarrow{${im(p.pl[0])}${im(p.pl[2])}}=${vT(c.v)}$. Вектор $\\vec n=${nT}$ перпендикулярен обоим, плоскость $${p.pl.map(im).join('')}$: $${urT}$.`,
        ],
      },
      {
        title: 'б) Расстояние',
        lines: [
          `По {{t:rasst-do-ploskosti|формуле расстояния от точки до плоскости}}: $\\rho=\\dfrac{${c.num}}{\\sqrt{${c.nn}}}=${otv}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'а) Боковая сторона $AB$ перпендикулярна основаниям', formula: 'x=0' },
      {
        slovo: 'а) Суммы противоположных сторон равны — есть вписанная окружность',
        formula: `r=${c.r}`,
      },
      { slovo: 'а) Высота призмы равна $2r$', formula: `h=${c.AB}` },
      { slovo: 'б) Координаты и уравнение плоскости', formula: urT },
      { slovo: 'б) Расстояние', formula: otv },
    ],
    kontrol: { dist: surdToNumber(c.dist), r: c.r, h: c.h },
  };
}

export const E15_PRIZMA_TRAPECIYA: Shablon2<PE15> = {
  no: 15,
  prototip: 'Призма над прямоугольной описанной трапецией: вписанный шар, расстояние до плоскости',
  sobrat,
};
