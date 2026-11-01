/**
 * №14 (варианты 31–36), свои задачи раздела: тригонометрическое уравнение
 * и отбор корней на отрезке. Четыре вида:
 *   kvSin — A·cos 2x + B·sin x + C = 0: квадратное относительно sin x,
 *           один корень по модулю больше 1;
 *   kvCos — A·cos 2x + B·cos x + C = 0: то же для cos x;
 *   odnor — sin²x + b·sin x cos x + c·cos²x = 0, b = −(t₁ + t₂), c = t₁t₂:
 *           однородное, tg x = t₁ или t₂ (t из ±1, ±√3, ±√3/3);
 *   koren — (2·f(x) − m)·√(σ·g(x)) = 0, f ≠ g ∈ {sin, cos}, m = ±1:
 *           g(x) = 0 или f(x) = m/2 при σ·g(x) ≥ 0.
 * Корни на отрезке [lo·π/2; hi·π/2] — перебором серий.
 */

import { add, mul, rat, ratTex, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { piTex } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

/** Число вида r + s·√3 (r, s рациональные). */
interface R3 {
  r: Rat;
  s: Rat;
}

export type PR14 =
  | {
      vid: 'kvSin' | 'kvCos';
      A: number;
      c1: [number, number];
      c2: [number, number];
      lo: number;
      hi: number;
    }
  | { vid: 'odnor'; t1: TgKod; t2: TgKod; lo: number; hi: number }
  | {
      vid: 'koren';
      f: 'sin' | 'cos';
      m: 1 | -1;
      sigma: 1 | -1;
      lo: number;
      hi: number;
    };

/** Значения tg x: код → число r + s√3 и главный угол (в долях π). */
type TgKod = '1' | '-1' | 'k3' | '-k3' | 'k3/3' | '-k3/3';
const TG: Record<TgKod, { v: R3; ugol: Rat; tex: string }> = {
  '1': { v: { r: rat(1), s: rat(0) }, ugol: rat(1, 4), tex: '1' },
  '-1': { v: { r: rat(-1), s: rat(0) }, ugol: rat(-1, 4), tex: '-1' },
  k3: { v: { r: rat(0), s: rat(1) }, ugol: rat(1, 3), tex: '\\sqrt3' },
  '-k3': { v: { r: rat(0), s: rat(-1) }, ugol: rat(-1, 3), tex: '-\\sqrt3' },
  'k3/3': { v: { r: rat(0), s: rat(1, 3) }, ugol: rat(1, 6), tex: '\\dfrac{\\sqrt3}{3}' },
  '-k3/3': { v: { r: rat(0), s: rat(-1, 3) }, ugol: rat(-1, 6), tex: '-\\dfrac{\\sqrt3}{3}' },
};

const r3Add = (a: R3, b: R3): R3 => ({ r: add(a.r, b.r), s: add(a.s, b.s) });
const r3Mul = (a: R3, b: R3): R3 => ({
  r: add(mul(a.r, b.r), mul(rat(3), mul(a.s, b.s))),
  s: add(mul(a.r, b.s), mul(a.s, b.r)),
});
const r3Num = (a: R3): number => toNumber(a.r) + toNumber(a.s) * Math.sqrt(3);

/** r + s√3 в TeX; «знаковый» — с плюсом впереди, если положительное. */
function r3Tex(a: R3, znakovyy = false): string {
  const parts: string[] = [];
  if (a.r.n !== 0n) parts.push(ratTex(a.r));
  if (a.s.n !== 0n) {
    const neg = a.s.n < 0n;
    const ab = neg ? rat(-a.s.n, a.s.d) : a.s;
    const kor =
      ab.n === 1n && ab.d === 1n
        ? '\\sqrt3'
        : ab.d === 1n
          ? `${ab.n}\\sqrt3`
          : `\\dfrac{${ab.n === 1n ? '' : ab.n}\\sqrt3}{${ab.d}}`;
    parts.push(parts.length === 0 ? `${neg ? '-' : ''}${kor}` : `${neg ? '-' : '+'}${kor}`);
  }
  const t = parts.length === 0 ? '0' : parts.join('');
  return znakovyy && !t.startsWith('-') ? `+${t}` : t;
}

/** Коэффициент перед множителем: «+», «−», «+3», «−\sqrt3», «+(1+\sqrt3)». */
function koefTex(a: R3): string {
  const dvuchlen = a.r.n !== 0n && a.s.n !== 0n;
  if (dvuchlen) return `+\\left(${r3Tex(a)}\\right)`;
  const t = r3Tex(a, true);
  if (t === '+1') return '+';
  if (t === '-1') return '-';
  return t;
}

interface Seriya {
  /** x₀ в долях π. */
  x0: Rat;
  /** Период в долях π: 1 или 2. */
  T: 1 | 2;
}

/** Остаток по модулю T (в долях π): в (−T/2; T/2]. */
function privesti(x: Rat, T: number): Rat {
  const per = rat(T);
  let y = x;
  while (toNumber(y) > T / 2 + 1e-12) y = sub(y, per);
  while (toNumber(y) <= -T / 2 + 1e-12) y = add(y, per);
  return y;
}

function seriyaTex(s: Seriya, b: string): string {
  const per = s.T === 1 ? `\\pi ${b}` : `2\\pi ${b}`;
  return s.x0.n === 0n ? per : `${piTex(s.x0)}+${per}`;
}

/** Арксинус/арккосинус табличных значений ±1/2, ±1, 0 — в долях π. */
function arcsin(v: Rat): Rat {
  const x = toNumber(v);
  const tab: [number, Rat][] = [
    [0, rat(0)],
    [0.5, rat(1, 6)],
    [-0.5, rat(-1, 6)],
    [1, rat(1, 2)],
    [-1, rat(-1, 2)],
  ];
  const t = tab.find(([a]) => Math.abs(a - x) < 1e-12);
  if (t === undefined) throw new Error(`r14: arcsin ${x}`);
  return t[1];
}
const arccos = (v: Rat): Rat => sub(rat(1, 2), arcsin(v));

/** Серии решений sin x = v / cos x = v (|v| ≤ 1, табличное). */
function seriiSinCos(f: 'sin' | 'cos', v: Rat): Seriya[] {
  const x = toNumber(v);
  if (f === 'sin') {
    const a = arcsin(v);
    if (Math.abs(Math.abs(x) - 1) < 1e-12) return [{ x0: a, T: 2 }];
    if (x === 0) return [{ x0: rat(0), T: 1 }];
    return [
      { x0: privesti(a, 2), T: 2 },
      { x0: privesti(sub(rat(1), a), 2), T: 2 },
    ];
  }
  const a = arccos(v);
  if (x === 1) return [{ x0: rat(0), T: 2 }];
  if (x === -1) return [{ x0: rat(1), T: 2 }];
  if (x === 0) return [{ x0: rat(1, 2), T: 1 }];
  return [
    { x0: a, T: 2 },
    { x0: privesti(rat(-a.n, a.d), 2), T: 2 },
  ];
}

/** Точки серий на отрезке [lo; hi] (в долях π), по возрастанию. */
function naOtrezke(serii: Seriya[], lo: Rat, hi: Rat): Rat[] {
  const out: Rat[] = [];
  for (const s of serii) {
    for (let k = -12; k <= 12; k += 1) {
      const x = add(s.x0, rat(s.T * k));
      if (toNumber(x) >= toNumber(lo) - 1e-12 && toNumber(x) <= toNumber(hi) + 1e-12) out.push(x);
    }
  }
  return out.sort((a, b) => toNumber(a) - toNumber(b));
}

export function chislaR14(p: PR14) {
  const lo = rat(p.lo, 2);
  const hi = rat(p.hi, 2);
  if (!(p.hi > p.lo)) throw new Error('r14: отрезок');
  if (p.vid === 'kvSin' || p.vid === 'kvCos') {
    const c1 = rat(p.c1[0], p.c1[1]);
    const c2 = rat(p.c2[0], p.c2[1]);
    if (Math.abs(toNumber(c1)) > 1) throw new Error('r14: c1 вне [−1; 1]');
    if (Math.abs(toNumber(c2)) <= 1) throw new Error('r14: c2 должен быть посторонним');
    const A = rat(p.A);
    /* sin: −2A s² + B s + (A + C) = −2A(s − c1)(s − c2); cos: 2A c² + B c + (C − A) = 2A(c − c1)(c − c2). */
    const S = add(c1, c2);
    const P = mul(c1, c2);
    const B = p.vid === 'kvSin' ? mul(mul(rat(2), A), S) : mul(mul(rat(-2), A), S);
    const C = p.vid === 'kvSin' ? sub(mul(mul(rat(-2), A), P), A) : add(A, mul(mul(rat(2), A), P));
    if (B.d !== 1n || C.d !== 1n) throw new Error('r14: коэффициенты не целые');
    const serii = seriiSinCos(p.vid === 'kvSin' ? 'sin' : 'cos', c1);
    return { lo, hi, B, C, c1, c2, serii, vybor: naOtrezke(serii, lo, hi) };
  }
  if (p.vid === 'odnor') {
    if (p.t1 === p.t2) throw new Error('r14: t1 = t2');
    const a = TG[p.t1];
    const b = TG[p.t2];
    const bK = r3Add(a.v, b.v);
    const bNeg: R3 = { r: rat(-bK.r.n, bK.r.d), s: rat(-bK.s.n, bK.s.d) };
    const cK = r3Mul(a.v, b.v);
    const serii: Seriya[] = [a, b].map((t) => ({ x0: t.ugol, T: 1 as const }));
    return { lo, hi, bK: bNeg, cK, serii, vybor: naOtrezke(serii, lo, hi) };
  }
  /* koren: (2f − m)·√(σ·g) = 0. */
  if (p.vid !== 'koren') throw new Error('r14: вид');
  const g = p.f === 'sin' ? 'cos' : 'sin';
  const gNol: Seriya[] = g === 'cos' ? [{ x0: rat(1, 2), T: 1 }] : [{ x0: rat(0), T: 1 }];
  const fSer = seriiSinCos(p.f, rat(p.m, 2)).filter((s) => {
    const x = toNumber(s.x0) * Math.PI;
    const gv = g === 'cos' ? Math.cos(x) : Math.sin(x);
    return p.sigma * gv > 1e-9;
  });
  const serii = [...gNol, ...fSer];
  return { lo, hi, g, gNol, fSer, serii, vybor: naOtrezke(serii, lo, hi) };
}

const BUKVY = ['k', 'n', 'm'];

function sobrat(p: PR14): Chast2Zadacha {
  const ch = chislaR14(p);
  const lo = ch.lo;
  const hi = ch.hi;
  const otrT = `\\left[${piTex(lo)};\\ ${piTex(hi)}\\right]`;
  const serii = ch.serii.map((s, i) => seriyaTex(s, BUKVY[i] ?? 'k'));
  const bukvy = BUKVY.slice(0, serii.length).join(',');
  const vTex = ch.vybor.map(piTex);
  let urT = '';
  let reshenie: Chast2Zadacha['reshenie'] = [];
  let razbor: Chast2Zadacha['razbor'] = [];
  if (p.vid === 'kvSin' || p.vid === 'kvCos') {
    const c = ch as ReturnType<typeof chislaR14> & { B: Rat; C: Rat; c1: Rat; c2: Rat };
    const fn = p.vid === 'kvSin' ? '\\sin x' : '\\cos x';
    const bukva = p.vid === 'kvSin' ? 's' : 'c';
    const Bt =
      c.B.n === 0n
        ? ''
        : `${c.B.n > 0n ? '+' : '-'}${c.B.n === 1n || c.B.n === -1n ? '' : c.B.n < 0n ? -c.B.n : c.B.n}${fn}`;
    const Ct = c.C.n === 0n ? '' : `${c.C.n > 0n ? '+' : ''}${c.C.n}`;
    urT = `${p.A === 1 ? '' : p.A === -1 ? '-' : p.A}\\cos2x${Bt}${Ct}=0`;
    const kvA = p.vid === 'kvSin' ? -2 * p.A : 2 * p.A;
    const svobod = p.vid === 'kvSin' ? add(rat(p.A), c.C) : sub(c.C, rat(p.A));
    const kv = `${kvA}${bukva}^2${c.B.n >= 0n ? '+' : ''}${ratTex(c.B)}${bukva}${svobod.n >= 0n ? '+' : ''}${ratTex(svobod)}=0`;
    reshenie = [
      {
        title: 'а) Сводим к квадратному уравнению',
        lines: [
          p.vid === 'kvSin'
            ? `По формуле двойного угла $\\cos2x=1-2\\sin^2x$. Пусть $s=\\sin x$, $-1\\le s\\le1$: $${kv}$.`
            : `По формуле двойного угла $\\cos2x=2\\cos^2x-1$. Пусть $c=\\cos x$, $-1\\le c\\le1$: $${kv}$.`,
          `Корни: $${bukva}=${ratTex(c.c1)}$ и $${bukva}=${ratTex(c.c2)}$. Второй не подходит: $|${ratTex(c.c2)}|>1$.`,
        ],
      },
      {
        title: 'а) Серии',
        lines: [
          `$${fn}=${ratTex(c.c1)}$: $x=${serii.join('$ или $x=')}$, $${bukvy}\\in\\mathbb Z$.`,
        ],
      },
      {
        title: 'б) Отбор корней',
        lines: [
          `Отмечаем на тригонометрической окружности дугу отрезка $${otrT}$ и точки серий; на отрезке лежат $${vTex.join(';\\ ')}$.`,
        ],
      },
    ];
    razbor = [
      {
        slovo: 'Формула двойного угла',
        formula: p.vid === 'kvSin' ? '\\cos2x=1-2\\sin^2x' : '\\cos2x=2\\cos^2x-1',
      },
      { slovo: 'Квадратное уравнение', formula: kv },
      { slovo: 'Посторонний корень', formula: `|${ratTex(c.c2)}|>1` },
      { slovo: 'Отбор на отрезке', formula: vTex.join(';\\ ') },
    ];
  } else if (p.vid === 'odnor') {
    const c = ch as ReturnType<typeof chislaR14> & { bK: R3; cK: R3 };
    urT = `\\sin^2x${koefTex(c.bK)}\\sin x\\cos x${koefTex(c.cK)}\\cos^2x=0`.replace(/\+\+/g, '+');
    const t1 = TG[p.t1].tex;
    const t2 = TG[p.t2].tex;
    reshenie = [
      {
        title: 'а) Однородное уравнение',
        lines: [
          `Если $\\cos x=0$, то $\\sin^2x=1$ и левая часть равна $1\\ne0$; значит, $\\cos x\\ne0$, и можно разделить на $\\cos^2x$.`,
          `Пусть $t=\\operatorname{tg}x$: $t^2${koefTex(c.bK)}t${koefTex(c.cK)}=0$. По теореме Виета корни $t=${t1}$ и $t=${t2}$.`,
        ],
      },
      {
        title: 'а) Серии',
        lines: [
          `$\\operatorname{tg}x=${t1}$: $x=${serii[0]}$; $\\operatorname{tg}x=${t2}$: $x=${serii[1]}$, $${bukvy}\\in\\mathbb Z$.`,
        ],
      },
      {
        title: 'б) Отбор корней',
        lines: [`Серии с периодом $\\pi$ на отрезке $${otrT}$ дают точки $${vTex.join(';\\ ')}$.`],
      },
    ];
    razbor = [
      { slovo: '$\\cos x\\ne0$ — делим на $\\cos^2x$', formula: '\\cos^2x\\ne0' },
      {
        slovo: 'Квадратное относительно тангенса',
        formula: `\\operatorname{tg}x=${t1}\\ \\text{или}\\ ${t2}`,
      },
      { slovo: 'Серии с периодом $\\pi$', formula: serii.join(';\\ ') },
      { slovo: 'Отбор на отрезке', formula: vTex.join(';\\ ') },
    ];
  } else {
    if (p.vid !== 'koren') throw new Error('r14: вид');
    const c = ch as ReturnType<typeof chislaR14> & {
      g: 'sin' | 'cos';
      gNol: Seriya[];
      fSer: Seriya[];
    };
    const fT = `\\${p.f} x`;
    const gT = `\\${c.g} x`;
    const mT = p.m > 0 ? '1' : '-1';
    urT = `\\left(2${fT}${p.m > 0 ? '-1' : '+1'}\\right)\\sqrt{${p.sigma > 0 ? '' : '-'}${gT}}=0`;
    const gSer = c.gNol.map((s) => seriyaTex(s, 'k'));
    const fVse = seriiSinCos(p.f, rat(p.m, 2));
    const fVseT = fVse.map((s) => seriyaTex(s, 'n'));
    const fOk = c.fSer.map((s) => seriyaTex(s, 'n'));
    reshenie = [
      {
        title: 'а) Область определения',
        lines: [
          `Корень определён при $${p.sigma > 0 ? '' : '-'}${gT}\\ge0$, то есть $${gT}${p.sigma > 0 ? '\\ge' : '\\le'}0$.`,
        ],
      },
      {
        title: 'а) Произведение равно нулю',
        lines: [
          `Либо $${gT}=0$: $x=${gSer[0]}$, $k\\in\\mathbb Z$ — эти точки входят в область.`,
          `Либо $2${fT}=${mT}$, $${fT}=${ratTex(rat(p.m, 2))}$: $x=${fVseT.join('$ или $x=')}$. Условию $${gT}${p.sigma > 0 ? '\\ge' : '\\le'}0$ удовлетворяет только $x=${fOk.join('$ и $x=')}$.`,
          `Ответ а): $${serii.join(';\\ ')}$, $${bukvy}\\in\\mathbb Z$.`,
        ],
      },
      {
        title: 'б) Отбор корней',
        lines: [`На отрезке $${otrT}$: $${vTex.join(';\\ ')}$.`],
      },
    ];
    razbor = [
      { slovo: 'Область определения корня', formula: `${gT}${p.sigma > 0 ? '\\ge' : '\\le'}0` },
      { slovo: 'Корень равен нулю', formula: `${gT}=0` },
      { slovo: 'Отбрасываем точки вне области', formula: fOk.join(';\\ ') },
      { slovo: 'Отбор на отрезке', formula: vTex.join(';\\ ') },
    ];
  }
  const uslovie = `а) Решите уравнение $${urT}$.\nб) Найдите все корни этого уравнения, принадлежащие отрезку $${otrT}$.`;
  return {
    no: 14,
    shablon: 'r14.trig',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Серии решений', pole: { vid: 'serii', verno: serii } },
      { bukva: 'б', podpis: 'Корни на отрезке', pole: { vid: 'korni', verno: vTex } },
    ],
    otvet: `а) $${serii.join(';\\ ')}$, $${bukvy}\\in\\mathbb Z$; б) $${vTex.join(';\\ ')}$`,
    reshenie,
    razbor,
    kontrol: {
      serii: ch.serii.flatMap((s) => [toNumber(s.x0) * Math.PI, s.T * Math.PI]),
      vybor: ch.vybor.map((x) => toNumber(x) * Math.PI),
    },
  };
}

export const R14_TRIG: Shablon2<PR14> = {
  no: 14,
  prototip:
    'Тригонометрическое уравнение с отбором корней: квадратное относительно sin/cos, однородное (tg), произведение с корнем и областью определения',
  sobrat,
};

/** Для проверки: левая часть уравнения как функция x. */
export function levayaR14(p: PR14): (x: number) => number {
  const ch = chislaR14(p);
  if (p.vid === 'kvSin' || p.vid === 'kvCos') {
    const c = ch as unknown as { B: Rat; C: Rat };
    const B = toNumber(c.B);
    const C = toNumber(c.C);
    return p.vid === 'kvSin'
      ? (x) => p.A * Math.cos(2 * x) + B * Math.sin(x) + C
      : (x) => p.A * Math.cos(2 * x) + B * Math.cos(x) + C;
  }
  if (p.vid === 'odnor') {
    const c = ch as unknown as { bK: R3; cK: R3 };
    const b = r3Num(c.bK);
    const cc = r3Num(c.cK);
    return (x) => Math.sin(x) ** 2 + b * Math.sin(x) * Math.cos(x) + cc * Math.cos(x) ** 2;
  }
  if (p.vid !== 'koren') throw new Error('r14: вид');
  const f = p.f === 'sin' ? Math.sin : Math.cos;
  const g = p.f === 'sin' ? Math.cos : Math.sin;
  return (x) => {
    const u = p.sigma * g(x);
    if (u < -1e-12) return Number.NaN;
    return (2 * f(x) - p.m) * Math.sqrt(Math.max(0, u));
  };
}
