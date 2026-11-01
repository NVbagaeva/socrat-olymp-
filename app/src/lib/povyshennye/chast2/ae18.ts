/**
 * №18 (варианты 17–18): вписанная и вневписанная окружности.
 *
 * Треугольник ABC (BC = a, AC = b, AB = c, b ≠ c), p — полупериметр.
 * Вписанная окружность касается BC в K, вневписанная (против A) — в L.
 * а) BK = p − b, CL = p − b ⇒ BK = CL.
 * б) KL = |a − 2(p − b)| = |b − c|; BL = p − c.
 */

import { renderPlan } from '@/lib/planimetriya/render';
import type { Element } from '@/lib/planimetriya/types';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PAE18 {
  a: number;
  b: number;
  c: number;
  nado: 'KL' | 'BL';
}

export function chislaAE18(p: PAE18) {
  const { a, b, c } = p;
  if (!(a + b > c && a + c > b && b + c > a)) throw new Error('ae18: не треугольник');
  if (b === c) throw new Error('ae18: K и L совпадают');
  const pp = (a + b + c) / 2;
  return { pp, BK: pp - b, BL: pp - c, KL: Math.abs(b - c) };
}

function chertezh(p: PAE18): string {
  const ch = chislaAE18(p);
  const { a, b, c } = p;
  const xA = (c * c - b * b + a * a) / (2 * a);
  const yA = Math.sqrt(c * c - xA * xA);
  const S = (yA * a) / 2;
  const r = S / ch.pp;
  const ra = S / (ch.pp - a);
  /* Масштаб — по всей картинке: треугольник и вневписанная окружность под BC. */
  const s = 6 / Math.max(a + 2 * ra, yA + 2 * ra);
  const B: [number, number] = [0, 0];
  const C: [number, number] = [a * s, 0];
  const A: [number, number] = [xA * s, yA * s];
  /* Продолжения AB и AC за точки касания с вневписанной окружностью (AT = p). */
  const za = (P: [number, number], dl: number): [number, number] => {
    const t = (ch.pp * 1.15) / dl;
    return [A[0] + (P[0] - A[0]) * t, A[1] + (P[1] - A[1]) * t];
  };
  const B2 = za(B, c);
  const C2 = za(C, b);
  const I: [number, number] = [ch.BK * s, r * s];
  const J: [number, number] = [ch.BL * s, -ra * s];
  const K: [number, number] = [ch.BK * s, 0];
  const L: [number, number] = [ch.BL * s, 0];
  const el: Element[] = [
    { tip: 'mnogougolnik', tochki: ['A', 'B', 'C'] },
    { tip: 'okruzhnost', okr: 'w' },
    { tip: 'okruzhnost', okr: 'wa' },
    { tip: 'otrezok', a: 'B', b: 'B2' },
    { tip: 'otrezok', a: 'C', b: 'C2' },
    { tip: 'tochka', t: 'K' },
    { tip: 'tochka', t: 'L' },
  ];
  return renderPlan(
    {
      tochki: { A, B, C, I, J, K, L, B2, C2 },
      okruzhnosti: { w: { centr: 'I', radius: r * s }, wa: { centr: 'J', radius: ra * s } },
      elementy: el,
      podpisi: ['A', 'B', 'C', 'K', 'L'],
    },
    { rezhim: { rezhim: 'uchitel' } },
  );
}

function sobrat(p: PAE18): Chast2Zadacha {
  const ch = chislaAE18(p);
  const otv = p.nado === 'KL' ? ch.KL : ch.BL;
  return {
    no: 18,
    shablon: 'ae18.vnevpisannaya',
    uslovie:
      `Вписанная окружность треугольника $ABC$ касается стороны $BC$ в точке $K$, а вневписанная окружность, касающаяся стороны $BC$ и продолжений сторон $AB$ и $AC$, — в точке $L$.\n` +
      `а) Докажите, что $BK=CL$.\n` +
      `б) Найдите $${p.nado}$, если $BC=${p.a}$, $AC=${p.b}$, $AB=${p.c}$.`,
    risunok: chertezh(p),
    punkty: [
      { bukva: 'а', pole: null },
      { bukva: 'б', podpis: p.nado, pole: { vid: 'chislo', verno: String(otv) } },
    ],
    otvet: `б) $${otv}$`,
    reshenie: [
      {
        title: 'а) Вписанная окружность',
        lines: [
          `{{t:kasatelnye-otrezki|Отрезки касательных}} из одной вершины к окружности равны. Для вписанной окружности обозначим их $x$ (из $A$), $y$ (из $B$), $z$ (из $C$): $x+y=AB$, $y+z=BC$, $x+z=AC$, откуда $BK=y=p-AC$, где $p$ — полупериметр.`,
        ],
      },
      {
        title: 'а) Вневписанная окружность',
        lines: [
          `Центр вневписанной окружности равноудалён от прямых $AB$ и $AC$, поэтому лежит на биссектрисе угла $A$ ({{t:bissektrisa-gmt|биссектриса как ГМТ}}, {{t:centr-v-ugle|центр окружности, вписанной в угол}}); касательные из $A$ к ней равны, и каждая равна $p$: их сумма — это периметр. Тогда $CL$ равен касательной из $C$: $CL=p-AC$ ({{t:kasatelnaya-radius|радиус в точку касания}}).`,
          `Значит, $BK=CL=p-AC$.`,
        ],
      },
      {
        title: 'б) Вычисление',
        lines: [
          `$p=\\dfrac{${p.a}+${p.b}+${p.c}}{2}=${ch.pp}$, $BK=CL=${ch.BK}$, $BL=BC-CL=${ch.BL}$.`,
          p.nado === 'KL' ? `$KL=|BL-BK|=${ch.KL}$. Ответ: $${ch.KL}$.` : `Ответ: $${ch.BL}$.`,
        ],
      },
      {
        title: 'Ответ',
        lines: [`б) $${otv}$.`],
      },
    ],
    razbor: [
      { slovo: 'Отрезки касательных', formula: 'BK=p-AC' },
      { slovo: 'Вневписанная окружность', formula: 'CL=p-AC' },
      { slovo: 'Полупериметр', formula: `p=${ch.pp}` },
      { slovo: 'Ответ', formula: String(otv) },
    ],
    kontrol: { otvet: otv, pp: ch.pp },
  };
}

export const AE18_VNEVPISANNAYA: Shablon2<PAE18> = {
  no: 18,
  prototip:
    'Вписанная и вневписанная окружности: точки касания на стороне симметричны относительно середины',
  sobrat,
};
