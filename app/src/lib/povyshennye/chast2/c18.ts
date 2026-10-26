/**
 * №18: трапеция ABCD (AD — большее основание) вписана в окружность,
 * KM — средняя линия. а) Если центр окружности вне ABCD, то центр
 * окружности, описанной около AKMD (вид «AKMD», вариант 5) или KBCM
 * (вид «KBCM», вариант 6), тоже вне этой трапеции. б) Радиус этой
 * окружности по основаниям и боковой стороне.
 *
 * Центр окружности около равнобедренной трапеции с основаниями 2u
 * (нижнее, большее) и 2w, высотой h лежит на оси на высоте
 * y = (w² + h² − u²)/(2h) над большим основанием; y < h всегда, и
 * центр вне трапеции ⇔ y < 0 ⇔ u² > w² + h².
 */

import { renderPlan } from '@/lib/planimetriya/render';
import type { Element, Scena } from '@/lib/planimetriya/types';
import { add, div, mul, rat, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex } from '@/lib/zadanie15/core/surd';
import { ratTex } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PC18 {
  AD: number;
  BC: number;
  AB: number;
  vid: 'AKMD' | 'KBCM';
}

const kor = (x: Rat) => surdTex(sqrtRat(x));
const kv = (x: Rat) => mul(x, x);

export function chislaC18(p: PC18) {
  const a = rat(p.AD, 2);
  const b = rat(p.BC, 2);
  const h2 = sub(rat(p.AB * p.AB), kv(sub(a, b)));
  const km = add(a, b);
  const s = div(km, rat(2));
  /* Трапеция AKMD: основания 2a и a + b, высота h/2; KBCM: a + b и 2b. */
  const [u, w] = p.vid === 'AKMD' ? [a, s] : [s, b];
  const H2 = div(h2, rat(4));
  /* y·h' = (w² + h'² − u²)/2, h' = h/2: числитель N, y = N/h'. */
  const N = div(add(sub(kv(w), kv(u)), H2), rat(2));
  const y2 = div(kv(N), H2);
  const R2 = add(kv(u), y2);
  return { a, b, h2, km, s, u, w, H2, N, y2, R2 };
}

/** Точки сцены (масштаб — исходные длины). */
function tochkiSceny(p: PC18) {
  const c = chislaC18(p);
  const a = toNumber(c.a);
  const b = toNumber(c.b);
  const h = Math.sqrt(toNumber(c.h2));
  const s = toNumber(c.s);
  /* Центр ABCD: y0 = (b² + h² − a²)/(2h). */
  const y0 = (b * b + h * h - a * a) / (2 * h);
  const r0 = Math.hypot(a, y0);
  /* Центр AKMD / KBCM. */
  const yN = toNumber(c.N) / Math.sqrt(toNumber(c.H2));
  const y1 = p.vid === 'AKMD' ? yN : h / 2 + yN;
  const R = Math.sqrt(toNumber(c.R2));
  return {
    t: {
      A: [-a, 0],
      D: [a, 0],
      B: [-b, h],
      C: [b, h],
      K: [-s, h / 2],
      M: [s, h / 2],
      O: [0, y0],
      O1: [0, y1],
    } as Record<string, [number, number]>,
    r0,
    R,
  };
}

/** Описание чертежей для голосового доступа (обычный текст, без формул). */
const ALT_18 = {
  a: { alt: 'Трапеция ABCD, вписанная в окружность с центром O, средняя линия KM' },
  AKMD: { alt: 'Трапеция ABCD, средняя линия KM и окружность с центром O1, описанная около AKMD' },
  KBCM: { alt: 'Трапеция ABCD, средняя линия KM и окружность с центром O1, описанная около KBCM' },
} as const;

function chertezh(p: PC18, punkt: 'a' | 'b'): string {
  const { t, r0, R } = tochkiSceny(p);
  const el: Element[] = [
    { tip: 'mnogougolnik', tochki: ['A', 'B', 'C', 'D'] },
    { tip: 'okruzhnost', okr: 'w' },
    { tip: 'otrezok', a: 'K', b: 'M' },
    { tip: 'tochka', t: 'O' },
  ];
  if (punkt === 'a') {
    el.push({ tip: 'otrezok', a: 'A', b: 'K', shtrihi: 1, tolkoShtrihi: true, sloy: 'reshenie' });
    el.push({ tip: 'otrezok', a: 'K', b: 'B', shtrihi: 1, tolkoShtrihi: true, sloy: 'reshenie' });
    el.push({ tip: 'otrezok', a: 'D', b: 'M', shtrihi: 1, tolkoShtrihi: true, sloy: 'reshenie' });
    el.push({ tip: 'otrezok', a: 'M', b: 'C', shtrihi: 1, tolkoShtrihi: true, sloy: 'reshenie' });
    el.push({ tip: 'otrezok', a: 'O', b: 'A', stil: 'punktir', sloy: 'reshenie' });
    el.push({ tip: 'otrezok', a: 'O', b: 'B', stil: 'punktir', sloy: 'reshenie' });
  } else {
    el.push({ tip: 'okruzhnost', okr: 'w1', stil: 'punktir', sloy: 'reshenie' });
    el.push({ tip: 'tochka', t: 'O1', sloy: 'reshenie' });
    const [x1, x2] = p.vid === 'AKMD' ? ['A', 'K'] : ['K', 'B'];
    el.push({ tip: 'otrezok', a: 'O1', b: x1, stil: 'punktir', sloy: 'reshenie' });
    el.push({ tip: 'otrezok', a: 'O1', b: x2, stil: 'punktir', sloy: 'reshenie' });
  }
  const scena: Scena = {
    tochki: t,
    okruzhnosti: { w: { centr: 'O', radius: r0 }, w1: { centr: 'O1', radius: R } },
    elementy: el,
    podpisi:
      punkt === 'a'
        ? ['A', 'B', 'C', 'D', 'K', 'M', 'O']
        : ['A', 'B', 'C', 'D', 'K', 'M', 'O', 'O1'],
    proverki: [
      { naOkruzhnosti: 'w', tochki: ['A', 'B', 'C', 'D'] },
      {
        naOkruzhnosti: 'w1',
        tochki: p.vid === 'AKMD' ? ['A', 'K', 'M', 'D'] : ['K', 'B', 'C', 'M'],
      },
    ],
  };
  return renderPlan(scena, {
    rezhim: { rezhim: 'uchitel' },
    shirina: 260,
    vysota: 260,
    alt: ALT_18[punkt === 'a' ? 'a' : p.vid].alt,
  });
}

export function chertezhC18(p: PC18, punkt: 'a' | 'b'): string {
  return chertezh(p, punkt);
}

/** Число или корень в TeX: целое — как есть, иначе дробь. */
const rT = (x: Rat) => ratTex(x);

function sobrat(p: PC18): Chast2Zadacha {
  const c = chislaC18(p);
  if (!(p.AD > p.BC && toNumber(c.h2) > 0)) throw new Error('c18: трапеция не строится');
  const AKMD = p.vid === 'AKMD';
  const T = p.vid;
  const otvet = kor(c.R2);
  const h = kor(c.h2);
  const proek = rT(sub(c.a, c.b));
  const uslovie =
    `Трапеция $ABCD$ с большим основанием $AD$ вписана в окружность, $KM$ — средняя линия трапеции ($K$ лежит на $AB$, $M$ — на $CD$).\n` +
    `а) Докажите, что если центр окружности, описанной около трапеции $ABCD$, лежит вне её, то центр окружности, описанной около трапеции $${T}$, лежит вне трапеции $${T}$.\n` +
    `б) Найдите радиус окружности, описанной около трапеции $${T}$, если $AD=${p.AD}$, $BC=${p.BC}$, $AB=${p.AB}$.`;

  /* а) для вида: основания (нижнее — большее) и неравенство. */
  const dokaz = AKMD
    ? [
        `Трапеция $AKMD$: основания $AD=2a$ и $KM=a+b$ ($KM<AD$), высота $\\dfrac h2$. Её центр лежит вне её, если $a^2>\\left(\\dfrac{a+b}2\\right)^2+\\dfrac{h^2}4$, то есть $4a^2>(a+b)^2+h^2$.`,
        `Из условия $h^2<a^2-b^2$, поэтому $(a+b)^2+h^2<(a+b)^2+a^2-b^2=2a^2+2ab<4a^2$ (так как $b<a$). Неравенство выполнено — центр окружности, описанной около $AKMD$, лежит вне этой трапеции.`,
      ]
    : [
        `Трапеция $KBCM$: основания $KM=a+b$ (большее) и $BC=2b$, высота $\\dfrac h2$. Её центр лежит вне её, если $\\left(\\dfrac{a+b}2\\right)^2>b^2+\\dfrac{h^2}4$, то есть $(a+b)^2>4b^2+h^2$.`,
        `Из условия $h^2<a^2-b^2$, поэтому $4b^2+h^2<a^2+3b^2<a^2+2ab+b^2=(a+b)^2$ (так как $2b^2<2ab$ при $b<a$). Неравенство выполнено — центр окружности, описанной около $KBCM$, лежит вне этой трапеции.`,
      ];

  const uT = rT(c.u);
  const wT = rT(c.w);
  const yAbs = kor(c.y2);
  const nPol = toNumber(c.N) >= 0;
  const [niz, verh] = AKMD ? ['AD', 'KM'] : ['KM', 'BC'];

  return {
    no: 18,
    shablon: 'c18.trapeciyaSrednyaya',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: 'Радиус',
        pole: { vid: 'chislo', verno: otvet.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otvet}$`,
    reshenie: [
      {
        title: 'а) Где лежит центр окружности около трапеции',
        risunok: chertezh(p, 'a'),
        lines: [
          `{{t:vpisannaya-trapeciya|Трапеция, вписанная в окружность, равнобедренная}}, поэтому центр окружности лежит на её {{t:ravnobedr-trapeciya-os|оси симметрии}} — {{t:seredinnyy-perp|серединном перпендикуляре}} к основаниям.`,
          'Пусть у равнобедренной трапеции большее основание $2u$, меньшее $2w$, высота $t$, центр $O$ — на оси на расстоянии $y$ от большего основания (со знаком: $y>0$ — в сторону меньшего). Из $OA=OB$: $u^2+y^2=w^2+(t-y)^2$, откуда $y=\\dfrac{w^2+t^2-u^2}{2t}$.',
          'Так как $w^2-u^2<0<t^2$, то $y<t$: центр всегда ниже меньшего основания. Поэтому центр лежит вне трапеции ровно тогда, когда $y<0$, то есть $u^2>w^2+t^2$.',
        ],
      },
      {
        title: 'а) Условие и средняя линия',
        lines: [
          'Пусть $AD=2a$, $BC=2b$ ($a>b$), высота трапеции $ABCD$ равна $h$. Центр её окружности вне трапеции, значит, $a^2>b^2+h^2$.',
          `{{t:srednyaya-liniya-trapecii|Средняя линия}} $KM\\parallel AD$, $KM=a+b$, и она делит высоту пополам. Трапеция $${T}$ равнобедренная ($${AKMD ? 'AK=MD' : 'KB=CM'}=\\dfrac{AB}2$), около неё можно описать окружность, и к ней применимо то же правило.`,
          ...dokaz,
        ],
      },
      {
        title: 'б) Высота трапеции',
        lines: [
          `$a=${rT(c.a)}$, $b=${rT(c.b)}$. Проекция боковой стороны на $AD$ равна $a-b=${proek}$, по {{t:pifagor|теореме Пифагора}} $h=\\sqrt{${p.AB}^2-${proek}^2}=${h}$.`,
          `$KM=a+b=${rT(c.km)}$; у трапеции $${T}$ основания $${niz}=${rT(mul(c.u, rat(2)))}$, $${verh}=${rT(mul(c.w, rat(2)))}$, высота $\\dfrac h2$, $\\left(\\dfrac h2\\right)^2=${rT(c.H2)}$.`,
        ],
      },
      {
        title: 'б) Центр и радиус',
        risunok: chertezh(p, 'b'),
        lines: [
          `По формуле из пункта а) с $u=${uT}$, $w=${wT}$, $t=\\dfrac h2$: $y=\\dfrac{w^2+t^2-u^2}{2t}$, $|y|=${yAbs}$ — центр ${nPol ? 'внутри полосы между основаниями' : `по другую сторону от $${niz}$, вне трапеции`}.`,
          `Радиус — расстояние от центра до конца большего основания: $R=\\sqrt{u^2+y^2}=\\sqrt{${rT(kv(c.u))}+${rT(c.y2)}}=${otvet}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'Вписанная трапеция равнобедренная, центр — на оси',
        formula: 'y=\\dfrac{w^2+t^2-u^2}{2t}',
      },
      {
        slovo: 'Центр вне трапеции ⇔ он по другую сторону от большего основания',
        formula: 'u^2>w^2+t^2',
      },
      {
        slovo: `Для $${T}$ неравенство следует из $h^2<a^2-b^2$`,
        formula: AKMD ? '4a^2>(a+b)^2+h^2' : '(a+b)^2>4b^2+h^2',
      },
      {
        slovo: 'б) Высота по теореме Пифагора, средняя линия',
        formula: `h=${h},\\ KM=${rT(c.km)}`,
      },
      { slovo: 'Радиус через расстояние от центра до основания', formula: `R=${otvet}` },
    ],
    kontrol: { R: Math.sqrt(toNumber(c.R2)), h: Math.sqrt(toNumber(c.h2)) },
  };
}

export const C18_TRAPECIYA_SREDNYAYA: Shablon2<PC18> = {
  no: 18,
  prototip: 'Вписанная трапеция и её средняя линия: центр описанной окружности, радиус',
  sobrat,
};
