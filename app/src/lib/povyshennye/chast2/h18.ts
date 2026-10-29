/**
 * №18 (варианты 15–16): в равнобедренную трапецию ABCD (AD — большее
 * основание) вписаны две окружности радиуса r: одна касается AB, BC, AD,
 * другая — BC, CD, AD; окружности касаются друг друга.
 *
 * Обе касаются параллельных BC и AD — диаметр равен высоте, радиусы равны.
 * Центр O₂ второй окружности — на биссектрисах углов C и D, ∠C + ∠D = 180°,
 * поэтому ∠CO₂D = 90° и r² = CT·TD (высота прямоугольного треугольника).
 * CT : TD = m : n, CT = mk, TD = nk: r = √(mn)·k, CD = (m + n)k.
 * б) AB = CD = L: k = L/(m+n), BC = 2r + 2mk, AD = 2r + 2nk, высота 2r.
 *    Радиус описанной окружности (центр на оси симметрии), площадь или диагональ.
 */

import { renderPlan } from '@/lib/planimetriya/render';
import type { Element } from '@/lib/planimetriya/types';
import { add, div, mul, rat, ratTex, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex, surdToNumber } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PH18 {
  /** CT : TD = m : n (m < n, mn — квадрат). */
  m: number;
  n: number;
  /** AB = L. */
  L: number;
  nado: 'R' | 'S' | 'AC';
}

function chisloTex(x: Rat): string {
  let d = x.d;
  while (d % 2n === 0n) d /= 2n;
  while (d % 5n === 0n) d /= 5n;
  return d === 1n ? String(toNumber(x)).replace('.', '{,}') : ratTex(x);
}

export function chislaH18(p: PH18) {
  const s = Math.round(Math.sqrt(p.m * p.n));
  if (s * s !== p.m * p.n || !(p.m < p.n)) throw new Error('h18: mn');
  const kf = rat(s, p.m + p.n);
  const k = rat(p.L, p.m + p.n);
  const r = mul(rat(s), k);
  const H = mul(rat(2), r);
  const b = add(r, mul(rat(p.m), k));
  const d = add(r, mul(rat(p.n), k));
  /* Центр на оси на высоте y над AD: d² + y² = b² + (H − y)². */
  const y = div(sub(add(mul(b, b), mul(H, H)), mul(d, d)), mul(rat(2), H));
  const R2 = add(mul(d, d), mul(y, y));
  const S = mul(add(b, d), H);
  const AC2 = add(mul(add(b, d), add(b, d)), mul(H, H));
  return { s, kf, k, r, H, b, d, y, R2, S, AC2 };
}

function chertezh(p: PH18, punkt: 'a' | 'b'): string {
  const c = chislaH18({ ...p, L: p.m + p.n });
  const r = toNumber(c.r);
  const b = toNumber(c.b);
  const d = toNumber(c.d);
  const H = toNumber(c.H);
  const sc = 4 / d;
  const P = (x: number, y: number): [number, number] => [x * sc, y * sc];
  const A = P(-d, 0);
  const D = P(d, 0);
  const B = P(-b, H);
  const C = P(b, H);
  const O1 = P(-r, r);
  const O2 = P(r, r);
  /* Точка касания T на CD: C + (m/(m+n))·(D − C). */
  const t = p.m / (p.m + p.n);
  const T: [number, number] = [C[0] + t * (D[0] - C[0]), C[1] + t * (D[1] - C[1])];
  const el: Element[] = [
    { tip: 'mnogougolnik', tochki: ['A', 'B', 'C', 'D'] },
    { tip: 'okruzhnost', okr: 'w1' },
    { tip: 'okruzhnost', okr: 'w2' },
    { tip: 'tochka', t: 'T' },
    { tip: 'tochka', t: 'O1' },
    { tip: 'tochka', t: 'O2' },
  ];
  if (punkt === 'a') {
    el.push({ tip: 'otrezok', a: 'O2', b: 'C', stil: 'punktir', sloy: 'reshenie' });
    el.push({ tip: 'otrezok', a: 'O2', b: 'D', stil: 'punktir', sloy: 'reshenie' });
    el.push({ tip: 'otrezok', a: 'O2', b: 'T', sloy: 'reshenie' });
    el.push({ tip: 'ugol', a: 'O2', v: 'T', b: 'D', pryamoy: true, sloy: 'reshenie' });
  } else {
    el.push({ tip: 'otrezok', a: 'A', b: 'C', stil: 'punktir', sloy: 'reshenie' });
  }
  return renderPlan(
    {
      tochki: { A, B, C, D, O1, O2, T },
      okruzhnosti: { w1: { centr: 'O1', radius: r * sc }, w2: { centr: 'O2', radius: r * sc } },
      elementy: el,
      podpisi: ['A', 'B', 'C', 'D', 'T', 'O1', 'O2'],
    },
    {
      rezhim: { rezhim: 'uchitel' },
      shirina: 300,
      vysota: 180,
      alt: 'Равнобедренная трапеция с двумя касающимися вписанными окружностями',
    },
  );
}

const NADO: Record<PH18['nado'], string> = {
  R: 'радиус окружности, описанной около трапеции $ABCD$',
  S: 'площадь трапеции $ABCD$',
  AC: 'диагональ трапеции $ABCD$',
};

function sobrat(p: PH18): Chast2Zadacha {
  const c = chislaH18(p);
  const kfT = chisloTex(c.kf);
  const otvS =
    p.nado === 'R' ? sqrtRat(c.R2) : p.nado === 'AC' ? sqrtRat(c.AC2) : sqrtRat(mul(c.S, c.S));
  const otvT = surdTex(otvS);
  const uslovie =
    `В равнобедренную трапецию $ABCD$ с большим основанием $AD$ вписаны две окружности так, что одна из них касается сторон $AB$, $BC$ и $AD$, вторая — сторон $BC$, $CD$ и $AD$, а сами они касаются друг друга внешним образом. Точка касания стороны $CD$ с одной из окружностей радиуса $r$ делит сторону $CD$ в отношении $${p.m}:${p.n}$.\n` +
    `а) Докажите, что $r=${kfT}\\cdot CD$.\n` +
    `б) Найдите ${NADO[p.nado]}, если $AB=${p.L}$.`;
  const kT = ratTex(c.k);
  const rT = ratTex(c.r);
  const bT = ratTex(c.b);
  const dT = ratTex(c.d);
  const HT = ratTex(c.H);
  const bLines =
    p.nado === 'R'
      ? [
          `{{t:vpisannaya-trapeciya|Около равнобедренной трапеции можно описать окружность}}; её центр лежит на {{t:ravnobedr-trapeciya-os|оси симметрии}} — на {{t:seredinnyy-perp|серединных перпендикулярах}} к основаниям. Пусть центр на высоте $y$ над $AD$; тогда $R^2=\\left(\\frac{AD}{2}\\right)^2+y^2=\\left(\\frac{BC}{2}\\right)^2+(${HT}-y)^2$.`,
          `$\\frac{AD}{2}=${dT}$, $\\frac{BC}{2}=${bT}$: $y=\\dfrac{${bT}^2+${HT}^2-${dT}^2}{2\\cdot${HT}}=${ratTex(c.y)}$, $R^2=${ratTex(c.R2)}$, $R=${otvT}$.`,
        ]
      : p.nado === 'S'
        ? [`Площадь трапеции $S=\\dfrac{AD+BC}{2}\\cdot h=(${dT}+${bT})\\cdot${HT}=${otvT}$.`]
        : [
            `Проекция диагонали $AC$ на $AD$ равна $\\dfrac{AD+BC}{2}=${ratTex(add(c.b, c.d))}$, высота $${HT}$. По {{t:pifagor|теореме Пифагора}} $AC^2=${ratTex(add(c.b, c.d))}^2+${HT}^2=${ratTex(c.AC2)}$, $AC=${otvT}$.`,
          ];
  return {
    no: 18,
    shablon: 'h18.trapeciyaDveOkr',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: p.nado === 'R' ? 'Радиус' : p.nado === 'S' ? 'Площадь' : 'Диагональ',
        pole: { vid: 'chislo', verno: otvT.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otvT}$`,
    reshenie: [
      {
        title: 'а) Радиусы и высота',
        risunok: chertezh(p, 'a'),
        lines: [
          'Обе окружности касаются параллельных прямых $BC$ и $AD$, поэтому их диаметры равны высоте трапеции: радиусы равны, $h=2r$.',
          `Пусть $O_2$ — центр окружности, касающейся $BC$, $CD$ и $AD$, $T$ — точка касания с $CD$. {{t:centr-v-ugle|Центр окружности, вписанной в угол, лежит на биссектрисе}}: $O_2C$ и $O_2D$ — биссектрисы углов $C$ и $D$. Так как $\\angle C+\\angle D=180^\\circ$, получаем $\\angle CO_2D=90^\\circ$, а $O_2T\\perp CD$ ({{t:kasatelnaya-radius|касательная перпендикулярна радиусу}}).`,
          `{{t:vysota-pryamougolnogo|Высота прямоугольного треугольника}} $CO_2D$: $r^2=O_2T^2=CT\\cdot TD$. Угол $C$ тупой, отрезок касательной из $C$ короче: $CT=${p.m}x$, $TD=${p.n}x$. Тогда $r=${c.s}x$, $CD=${p.m + p.n}x$, и $r=\\dfrac{${c.s}}{${p.m + p.n}}CD=${kfT}\\cdot CD$.`,
        ],
      },
      {
        title: 'б) Основания',
        risunok: chertezh(p, 'b'),
        lines: [
          `$CD=AB=${p.L}$, $x=\\dfrac{${p.L}}{${p.m + p.n}}=${kT}$, $r=${rT}$, высота $${HT}$.`,
          `Окружности касаются друг друга и прямой $BC$, их центры на одной высоте, поэтому точки касания с $BC$ отстоят на $O_1O_2=2r$. {{t:kasatelnye-otrezki|Отрезки касательных}} из $C$ равны: от точки касания до $C$ — $CT=${ratTex(mul(rat(p.m), c.k))}$. Значит, $\\frac{BC}{2}=r+CT=${bT}$; так же $\\frac{AD}{2}=r+TD=${dT}$.`,
        ],
      },
      { title: 'б) Ответ', lines: [...bLines, `Ответ: $${otvT}$.`] },
    ],
    razbor: [
      { slovo: 'а) Радиусы равны, высота $2r$', formula: 'h=2r' },
      { slovo: 'а) Прямой угол $CO_2D$, высота к гипотенузе', formula: 'r^2=CT\\cdot TD' },
      {
        slovo: 'б) Основания через отрезки касательных',
        formula: `\\tfrac{BC}{2}=${bT},\\ \\tfrac{AD}{2}=${dT}`,
      },
      { slovo: 'б) Ответ', formula: otvT },
    ],
    kontrol: { r: toNumber(c.r), b: toNumber(c.b), d: toNumber(c.d), otvet: surdToNumber(otvS) },
  };
}

export const H18_TRAPECIYA_DVE_OKR: Shablon2<PH18> = {
  no: 18,
  prototip:
    'Равнобедренная трапеция с двумя касающимися вписанными окружностями: r через боковую сторону; радиус описанной, площадь или диагональ',
  sobrat,
};
