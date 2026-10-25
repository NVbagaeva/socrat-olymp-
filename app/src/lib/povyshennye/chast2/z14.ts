/**
 * №14: логарифм от суммы «√2·(формула приведения) ± (синус или косинус
 * со сдвигом π/4)» равен числу, при котором аргумент равен 1/√2.
 *
 * После приведения аргумент — (α sin x + β cos x)/√2 с α, β = ±1, то
 * есть уравнение сводится к α sin x + β cos x = 1: две серии с шагом 2π
 * и отбор на отрезке длиной 3π/2, где корней ровно два — как в образце.
 */

import { rat, type Rat } from '@/lib/zadanie15/core/rational';
import { piTex, seriyaTex } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

/** Слагаемое с множителем √2: запись и чему равно (коэффициенты при sin x и cos x). */
const A_TERM = {
  'c-': { tex: '\\sqrt2\\cos\\left(x-\\dfrac{\\pi}{2}\\right)', s: 1, c: 0 },
  'c+': { tex: '\\sqrt2\\cos\\left(x+\\dfrac{\\pi}{2}\\right)', s: -1, c: 0 },
  's+': { tex: '\\sqrt2\\sin\\left(x+\\dfrac{\\pi}{2}\\right)', s: 0, c: 1 },
  's-': { tex: '\\sqrt2\\sin\\left(x-\\dfrac{\\pi}{2}\\right)', s: 0, c: -1 },
  spi: { tex: '\\sqrt2\\sin(\\pi-x)', s: 1, c: 0 },
  cpi: { tex: '\\sqrt2\\cos(\\pi-x)', s: 0, c: -1 },
  c32: { tex: '\\sqrt2\\cos\\left(\\dfrac{3\\pi}{2}-x\\right)', s: -1, c: 0 },
  s32: { tex: '\\sqrt2\\sin\\left(\\dfrac{3\\pi}{2}+x\\right)', s: 0, c: -1 },
} as const;

/** Слагаемое со сдвигом π/4: запись и (коэффициенты при sin x и cos x)·√2. */
const B_TERM = {
  'c-4': {
    tex: '\\cos\\left(x-\\dfrac{\\pi}{4}\\right)',
    s: 1,
    c: 1,
    f: '\\cos x\\cos\\dfrac{\\pi}{4}+\\sin x\\sin\\dfrac{\\pi}{4}',
  },
  'c+4': {
    tex: '\\cos\\left(x+\\dfrac{\\pi}{4}\\right)',
    s: -1,
    c: 1,
    f: '\\cos x\\cos\\dfrac{\\pi}{4}-\\sin x\\sin\\dfrac{\\pi}{4}',
  },
  's+4': {
    tex: '\\sin\\left(x+\\dfrac{\\pi}{4}\\right)',
    s: 1,
    c: 1,
    f: '\\sin x\\cos\\dfrac{\\pi}{4}+\\cos x\\sin\\dfrac{\\pi}{4}',
  },
  's-4': {
    tex: '\\sin\\left(x-\\dfrac{\\pi}{4}\\right)',
    s: 1,
    c: -1,
    f: '\\sin x\\cos\\dfrac{\\pi}{4}-\\cos x\\sin\\dfrac{\\pi}{4}',
  },
} as const;

/** Основание логарифма и правая часть: osn^prav = 1/√2. */
const LOG = {
  '2': { osn: '2', prav: '-0{,}5', step: '2^{-0{,}5}' },
  '4': { osn: '4', prav: '-0{,}25', step: '4^{-0{,}25}' },
  '0,5': { osn: '0{,}5', prav: '0{,}5', step: '0{,}5^{0{,}5}' },
  '0,25': { osn: '0{,}25', prav: '0{,}25', step: '0{,}25^{0{,}25}' },
  r2: { osn: '\\sqrt2', prav: '-1', step: '\\left(\\sqrt2\\right)^{-1}' },
} as const;

export interface P14 {
  a: keyof typeof A_TERM;
  /** Знак перед вторым слагаемым. */
  z: 1 | -1;
  b: keyof typeof B_TERM;
  log: keyof typeof LOG;
  /** Отрезок [lo·π/2; hi·π/2]. */
  lo: number;
  hi: number;
}

/** Коэффициенты α, β в α sin x + β cos x = 1; null — сочетание не годится. */
export function koeff14(p: Pick<P14, 'a' | 'z' | 'b'>): { al: number; be: number } | null {
  const A = A_TERM[p.a];
  const B = B_TERM[p.b];
  const al = 2 * A.s + p.z * B.s;
  const be = 2 * A.c + p.z * B.c;
  return Math.abs(al) === 1 && Math.abs(be) === 1 ? { al, be } : null;
}

/** k·π/2 как дробь при π. */
const polPi = (k: number): Rat => rat(k, 2);

/** Корни α sin x + β cos x = 1 на (−π; π] — в долях π/2. */
function bazovye(al: number, be: number): number[] {
  return [-1, 0, 1, 2].filter((k) => {
    const x = (k * Math.PI) / 2;
    return Math.abs(al * Math.sin(x) + be * Math.cos(x) - 1) < 1e-9;
  });
}

/** Корни серий на отрезке [lo; hi] (в долях π/2): по сериям. */
export function otbor14(base: readonly number[], lo: number, hi: number): number[][] {
  return base.map((b) => {
    const out: number[] = [];
    for (let x = b + 4 * Math.floor((lo - b) / 4); x <= hi; x += 4) if (x >= lo) out.push(x);
    return out;
  });
}

const sgn = (n: number) => (n < 0 ? '-' : '+');
const koefTex = (n: number, f: string) => `${n < 0 ? '-' : ''}${f}`;

function sobrat(p: P14): Chast2Zadacha {
  const k = koeff14(p);
  if (k === null)
    throw new Error(`z14: сочетание ${p.a} ${p.z} ${p.b} не сводится к ±sin x ± cos x = 1`);
  const { al, be } = k;
  const A = A_TERM[p.a];
  const B = B_TERM[p.b];
  const L = LOG[p.log];
  const base = bazovye(al, be);
  if (base.length !== 2) throw new Error('z14: ожидались две серии');
  const naOtrezke = otbor14(base, p.lo, p.hi);
  const vse = naOtrezke.flat().sort((x, y) => x - y);
  if (vse.length !== 2 || p.hi - p.lo !== 3)
    throw new Error(`z14: на отрезке ${vse.length} корней`);

  const arg = `${A.tex}${p.z < 0 ? '-' : '+'}${B.tex}`;
  const otrTex = `\\left[${piTex(polPi(p.lo))};\\ ${piTex(polPi(p.hi))}\\right]`;
  const uslovie =
    `а) Решите уравнение $\\log_{${L.osn}}\\left(${arg}\\right)=${L.prav}.$\n` +
    `б) Найдите все корни этого уравнения, принадлежащие отрезку $${otrTex}.$`;

  /* Приведение: √2·(формула) = ±√2 sin x или ±√2 cos x. */
  const aVal = A.s !== 0 ? koefTex(A.s, '\\sqrt2\\sin x') : koefTex(A.c, '\\sqrt2\\cos x');
  const bVal = `\\dfrac{${koefTex(B.s, '\\sin x')}${sgn(B.c)}\\cos x}{\\sqrt2}`;
  const bRaskryt = `${B.f}=${bVal}`;
  const sum = `${al < 0 ? '-' : ''}\\sin x${be < 0 ? '-' : '+'}\\cos x`;

  /* Вспомогательный угол. */
  let vspom: string;
  let shag: string;
  if (al === be) {
    vspom = `${al < 0 ? '-' : ''}\\sqrt2\\sin\\left(x+\\dfrac{\\pi}{4}\\right)=1`;
    shag =
      al > 0
        ? '\\sin\\left(x+\\dfrac{\\pi}{4}\\right)=\\dfrac{\\sqrt2}{2},\\quad x+\\dfrac{\\pi}{4}=\\dfrac{\\pi}{4}+2\\pi n\\ \\text{или}\\ x+\\dfrac{\\pi}{4}=\\dfrac{3\\pi}{4}+2\\pi n'
        : '\\sin\\left(x+\\dfrac{\\pi}{4}\\right)=-\\dfrac{\\sqrt2}{2},\\quad x+\\dfrac{\\pi}{4}=-\\dfrac{\\pi}{4}+2\\pi n\\ \\text{или}\\ x+\\dfrac{\\pi}{4}=-\\dfrac{3\\pi}{4}+2\\pi n';
  } else if (al > 0) {
    vspom = '\\sqrt2\\sin\\left(x-\\dfrac{\\pi}{4}\\right)=1';
    shag =
      '\\sin\\left(x-\\dfrac{\\pi}{4}\\right)=\\dfrac{\\sqrt2}{2},\\quad x-\\dfrac{\\pi}{4}=\\dfrac{\\pi}{4}+2\\pi n\\ \\text{или}\\ x-\\dfrac{\\pi}{4}=\\dfrac{3\\pi}{4}+2\\pi n';
  } else {
    vspom = '\\sqrt2\\cos\\left(x+\\dfrac{\\pi}{4}\\right)=1';
    shag =
      '\\cos\\left(x+\\dfrac{\\pi}{4}\\right)=\\dfrac{\\sqrt2}{2},\\quad x+\\dfrac{\\pi}{4}=\\pm\\dfrac{\\pi}{4}+2\\pi n';
  }
  const serii = base.map((b) => seriyaTex(polPi(b)));
  const seriiOtvet = serii.map((s) => `$x=${s},\\ n\\in\\mathbb Z$`).join('; ');

  /* Отбор: двойное неравенство для каждой серии. */
  const lo = polPi(p.lo);
  const hi = polPi(p.hi);
  const otborLines = base.map((b, i) => {
    const nLo = rat(p.lo - b, 4);
    const nHi = rat(p.hi - b, 4);
    const ns = naOtrezke[i]!.map((x) => (x - b) / 4);
    const kor = naOtrezke[i]!.map((x) => `$x=${piTex(polPi(x))}$`).join(', ');
    return (
      `Серия $x=${serii[i]}$: $${piTex(lo)}\\le ${serii[i]}\\le ${piTex(hi)}$, откуда ` +
      `$${fracN(nLo)}\\le n\\le ${fracN(nHi)}$, то есть $n=${ns.join(';\\ ')}$: ${kor}.`
    );
  });
  const otvetB = vse.map((x) => piTex(polPi(x)));

  return {
    no: 14,
    shablon: 'z14.logTrig',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Серии решений', pole: { vid: 'serii', verno: serii } },
      { bukva: 'б', podpis: 'Корни на отрезке', pole: { vid: 'korni', verno: otvetB } },
    ],
    otvet: `а) ${seriiOtvet}; б) $${otvetB.join(';\\ ')}$`,
    reshenie: [
      {
        title: 'а) Упрощаем аргумент логарифма',
        lines: [
          `По формулам приведения $${A.tex}=${aVal}$.`,
          `По формуле ${B.tex.startsWith('\\cos') ? 'косинуса' : 'синуса'} ${B.f.includes('-') ? 'разности' : 'суммы'} $${B.tex}=${bRaskryt}$.`,
          `Аргумент логарифма: $${aVal}${p.z < 0 ? '-' : '+'}${bVal}=\\dfrac{${sum}}{\\sqrt2}$.`,
        ],
      },
      {
        title: 'а) Освобождаемся от логарифма',
        lines: [
          `По определению логарифма аргумент равен $${L.step}=\\dfrac{1}{\\sqrt2}$ — это число положительно, поэтому условие на область определения выполнено само.`,
          `Получаем $\\dfrac{${sum}}{\\sqrt2}=\\dfrac{1}{\\sqrt2}$, то есть $${sum}=1$.`,
        ],
      },
      {
        title: 'а) Решаем уравнение',
        lines: [
          `Вводим вспомогательный угол: $${vspom}$.`,
          `$${shag}$, $n\\in\\mathbb Z$.`,
          `Отсюда $x=${serii[0]}$ или $x=${serii[1]}$, $n\\in\\mathbb Z$.`,
        ],
      },
      {
        title: 'б) Отбираем корни на отрезке',
        lines: [...otborLines],
      },
    ],
    razbor: [
      { slovo: 'Приводим слагаемые к синусу и косинусу', formula: `${A.tex}=${aVal}` },
      { slovo: 'Раскрываем синус или косинус суммы', formula: `${B.tex}=${bVal}` },
      {
        slovo: 'Аргумент логарифма равен основанию в степени правой части',
        formula: `\\dfrac{${sum}}{\\sqrt2}=\\dfrac{1}{\\sqrt2}`,
      },
      { slovo: 'Решаем через вспомогательный угол', formula: `x=${serii[0]},\\quad x=${serii[1]}` },
      { slovo: 'Отбираем корни двойным неравенством', formula: otvetB.join(';\\ ') },
    ],
    kontrol: {
      serii: base.map((b) => (b * Math.PI) / 2),
      korni: vse.map((x) => (x * Math.PI) / 2),
      lo: (p.lo * Math.PI) / 2,
      hi: (p.hi * Math.PI) / 2,
    },
  };
}

/** n-граница как дробь TeX. */
function fracN(q: Rat): string {
  if (q.d === 1n) return `${q.n}`;
  const neg = q.n < 0n;
  return `${neg ? '-' : ''}\\dfrac{${neg ? -q.n : q.n}}{${q.d}}`;
}

export const Z14_LOG_TRIG: Shablon2<P14> = {
  no: 14,
  prototip: 'Логарифм от суммы тригонометрических слагаемых; две серии, отбор на отрезке 3π/2',
  sobrat,
};
