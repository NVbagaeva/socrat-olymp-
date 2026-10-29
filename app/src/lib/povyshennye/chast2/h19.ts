/**
 * №19 (варианты 15–16): система X⁴ − Y⁴ − κa²X² + κa²Y² = 0, y = ax + γa,
 * где X = x + αa, Y = y + βa; ровно четыре решения.
 *
 * Первое уравнение: (X² − Y²)(X² + Y² − κa²) = 0 — две прямые Y = ±X и
 * окружность радиуса |a|√κ (при a ≠ 0). Прямая ℓ: y = ax + γa.
 * Четыре решения ⇔ ℓ пересекает обе прямые (a ≠ ±1), окружность в двух
 * точках (Q(a) > 0, a ≠ 0), и все четыре точки различны:
 *  • точка на Y = X лежит на окружности при a = (sρ − δ)/(sρ − α);
 *  • точка на Y = −X — при a = (−sρ − δ)/(sρ − α), s = ±1, ρ = √(κ/2);
 *  • точки на прямых совпадают (общая точка X = Y = 0) при a = δ/α;
 * δ = β + γ, Q(a) = (κ − α²)a² + 2αδa + (κ − δ²).
 */

import type { Kusok, Mnozhestvo } from '@/lib/chast2/sravnenie';
import {
  add,
  div,
  mul,
  neg,
  rat,
  ratTex,
  sub,
  toNumber,
  type Rat,
} from '@/lib/zadanie15/core/rational';
import { sKornem, skTex, skToNumber, type SKornem } from './chisla';
import type { Chast2Zadacha, Shablon2 } from './types';

type Dr = readonly [number, number];
const R = (d: Dr) => rat(d[0], d[1]);

export interface PH19 {
  alfa: Dr;
  beta: Dr;
  gamma: Dr;
  /** κ: 1/2 или 2 (ρ = 1/2 или 1). */
  kappa: Dr;
  /** Какие a рассматриваются. */
  dom: 'vse' | 'pol' | 'otr';
}

interface Tch {
  v: number;
  tex: string;
}
interface Kus {
  lo: Tch | null;
  hi: Tch | null;
  loZ: boolean;
  hiZ: boolean;
}

const fromRat = (x: Rat): Tch => ({ v: toNumber(x), tex: ratTex(x) });
const fromSk = (x: SKornem): Tch => ({ v: skToNumber(x), tex: skTex(x) });

export function chislaH19(p: PH19) {
  const al = R(p.alfa);
  const be = R(p.beta);
  const ga = R(p.gamma);
  const ka = R(p.kappa);
  const de = add(be, ga);
  const ro = toNumber(ka) === 0.5 ? rat(1, 2) : toNumber(ka) === 2 ? rat(1) : null;
  if (ro === null) throw new Error('h19: κ');
  const A2 = sub(ka, mul(al, al));
  const B1 = mul(rat(2), mul(al, de));
  const C0 = sub(ka, mul(de, de));
  /* Множество Q(a) > 0. */
  let qKuski: Kus[];
  let korniQ: Tch[] = [];
  if (A2.n === 0n) {
    if (B1.n === 0n) throw new Error('h19: Q постоянно');
    const r = div(neg(C0), B1);
    korniQ = [fromRat(r)];
    qKuski =
      toNumber(B1) > 0
        ? [{ lo: fromRat(r), hi: null, loZ: false, hiZ: false }]
        : [{ lo: null, hi: fromRat(r), loZ: false, hiZ: false }];
  } else {
    const u = div(neg(B1), mul(rat(2), A2));
    const D = div(sub(mul(B1, B1), mul(rat(4), mul(A2, C0))), mul(rat(4), mul(A2, A2)));
    if (!(toNumber(D) > 0)) throw new Error('h19: D ≤ 0');
    const r1 = fromSk(sKornem(u, D, toNumber(A2) > 0 ? -1 : 1));
    const r2 = fromSk(sKornem(u, D, toNumber(A2) > 0 ? 1 : -1));
    const [lo, hi] = r1.v < r2.v ? [r1, r2] : [r2, r1];
    korniQ = [lo, hi];
    qKuski =
      toNumber(A2) > 0
        ? [
            { lo: null, hi: lo, loZ: false, hiZ: false },
            { lo: hi, hi: null, loZ: false, hiZ: false },
          ]
        : [{ lo, hi, loZ: false, hiZ: false }];
  }
  /* Исключаемые значения. */
  const isk: { a: Rat; pochemu: string }[] = [
    { a: rat(0), pochemu: 'a=0' },
    { a: rat(1), pochemu: 'прямая параллельна' },
    { a: rat(-1), pochemu: 'прямая параллельна' },
  ];
  for (const s of [1, -1]) {
    const sr = mul(rat(s), ro);
    const zn = sub(sr, al);
    if (zn.n === 0n) {
      if (sub(sr, de).n === 0n || add(sr, de).n === 0n)
        throw new Error('h19: совпадение при всех a');
      continue;
    }
    isk.push({ a: div(sub(sr, de), zn), pochemu: 'plus' });
    isk.push({ a: div(sub(neg(sr), de), zn), pochemu: 'minus' });
  }
  if (al.n !== 0n) isk.push({ a: div(de, al), pochemu: 'nol' });
  /* Домен. */
  const domK: Kus =
    p.dom === 'pol'
      ? { lo: fromRat(rat(0)), hi: null, loZ: false, hiZ: false }
      : p.dom === 'otr'
        ? { lo: null, hi: fromRat(rat(0)), loZ: false, hiZ: false }
        : { lo: null, hi: null, loZ: false, hiZ: false };
  const lv = (t: Tch | null) => (t === null ? -Infinity : t.v);
  const hv = (t: Tch | null) => (t === null ? Infinity : t.v);
  let kuski: Kus[] = [];
  for (const q of qKuski) {
    const lo = lv(q.lo) >= lv(domK.lo) ? q.lo : domK.lo;
    const hi = hv(q.hi) <= hv(domK.hi) ? q.hi : domK.hi;
    if (lv(lo) < hv(hi)) kuski.push({ lo, hi, loZ: false, hiZ: false });
  }
  /* Выкалываем исключённые точки, попавшие внутрь. */
  const vnutri: Rat[] = [];
  for (const e of isk) {
    const v = toNumber(e.a);
    if (vnutri.some((x) => toNumber(x) === v)) continue;
    if (kuski.some((q) => lv(q.lo) < v && v < hv(q.hi))) vnutri.push(e.a);
  }
  for (const e of vnutri) {
    const v = toNumber(e);
    kuski = kuski.flatMap((q) =>
      lv(q.lo) < v && v < hv(q.hi)
        ? [
            { lo: q.lo, hi: fromRat(e), loZ: false, hiZ: false },
            { lo: fromRat(e), hi: q.hi, loZ: false, hiZ: false },
          ]
        : [q],
    );
  }
  kuski.sort((a, b) => lv(a.lo) - lv(b.lo));
  if (kuski.length === 0) throw new Error('h19: пусто');
  return { al, be, ga, ka, de, ro, A2, B1, C0, korniQ, isk, vnutri, kuski };
}

/** «x», «(x+a)», «(x-\\frac{a}{2})». */
function sdvig(v: string, k: Rat): string {
  if (k.n === 0n) return v;
  const kv = toNumber(k);
  const ab = kv < 0 ? neg(k) : k;
  const aT =
    ab.n === 1n && ab.d === 1n
      ? 'a'
      : ab.d === 1n
        ? `${ab.n}a`
        : `\\frac{${ab.n === 1n ? '' : ab.n}a}{${ab.d}}`;
  return `(${v}${kv < 0 ? '-' : '+'}${aT})`;
}

function sobrat(p: PH19): Chast2Zadacha {
  const c = chislaH19(p);
  const X = sdvig('x', c.al);
  const Y = sdvig('y', c.be);
  const kT = toNumber(c.ka) === 0.5 ? '0{,}5' : '2';
  const st = (b: string, n: number) => (b.length === 1 ? `${b}^${n}` : `${b}^${n}`);
  const ur1 = `${st(X, 4)}-${st(Y, 4)}-${kT}a^2${st(X, 2)}+${kT}a^2${st(Y, 2)}=0`;
  const gT = (() => {
    if (c.ga.n === 0n) return '';
    const v = toNumber(c.ga);
    const ab = v < 0 ? neg(c.ga) : c.ga;
    const t =
      ab.n === 1n && ab.d === 1n
        ? 'a'
        : ab.d === 1n
          ? `${ab.n}a`
          : `\\dfrac{${ab.n === 1n ? '' : ab.n}a}{${ab.d}}`;
    return `${v < 0 ? '-' : '+'}${t}`;
  })();
  const ur2 = `y=ax${gT}`;
  const dom =
    p.dom === 'pol'
      ? 'положительные значения $a$'
      : p.dom === 'otr'
        ? 'отрицательные значения $a$'
        : 'значения $a$';
  const uslovie = `Найдите все ${dom}, при каждом из которых система уравнений\n$\\begin{cases}${ur1},\\\\ ${ur2}\\end{cases}$\nимеет ровно четыре различных решения.`;
  const kusTex = (q: Kus) =>
    `\\left(${q.lo?.tex ?? '-\\infty'};\\ ${q.hi?.tex ?? '+\\infty'}\\right)`;
  const otv = c.kuski.map(kusTex).join('\\cup');
  const pl = (t: Tch | null, inf: string) =>
    t === null ? inf : t.tex.replace(/\\dfrac/g, '\\frac');
  const vPole: Mnozhestvo = {
    kuski: c.kuski.map((q): Kusok => ({
      t: 'interval',
      lo: pl(q.lo, '-inf'),
      loZakr: false,
      hi: pl(q.hi, 'inf'),
      hiZakr: false,
    })),
  };
  const roT = ratTex(c.ro);
  const Qt = (() => {
    const chl: string[] = [];
    const add1 = (k: Rat, s: string) => {
      if (k.n === 0n) return;
      const n = k.n < 0n;
      const ab = n ? neg(k) : k;
      const t = ab.n === 1n && ab.d === 1n && s !== '' ? '' : ratTex(ab);
      chl.push(`${n ? '-' : chl.length ? '+' : ''}${t}${s}`);
    };
    add1(c.A2, 'a^2');
    add1(c.B1, 'a');
    add1(c.C0, '');
    return chl.join('') || '0';
  })();
  const iskT = [...new Map(c.isk.map((e) => [toNumber(e.a), e])).values()]
    .map((e) => ratTex(e.a))
    .join(';\\ ');
  const vnT = c.vnutri.map(ratTex).join(';\\ ');
  return {
    no: 19,
    shablon: 'h19.pryamyeOkr',
    uslovie,
    risunok: null,
    punkty: [{ bukva: null, podpis: 'Значения $a$', pole: { vid: 'promezhutki', verno: vPole } }],
    otvet: `$${otv}$`,
    reshenie: [
      {
        title: 'Первое уравнение',
        lines: [
          `Пусть $X=${X.replace(/^\(|\)$/g, '')}$, $Y=${Y.replace(/^\(|\)$/g, '')}$. Тогда $X^4-Y^4-${kT}a^2\\left(X^2-Y^2\\right)=\\left(X^2-Y^2\\right)\\left(X^2+Y^2-${kT}a^2\\right)=0$.`,
          `Это две прямые $Y=X$, $Y=-X$ и (при $a\\ne0$) окружность $X^2+Y^2=${kT}a^2$ с центром в точке $X=Y=0$. При $a=0$ система сводится к $x^4=y^4$, $y=0$ — одно решение.`,
        ],
      },
      {
        title: 'Пересечения с прямой $' + ur2 + '$',
        lines: [
          `С прямой $Y=X$ — одна точка, если $a\\ne1$ (при $a=1$ прямые параллельны); с прямой $Y=-X$ — одна точка, если $a\\ne-1$.`,
          `С окружностью: подставляя $y$, получаем квадратное уравнение $\\left(1+a^2\\right)x^2+\\ldots=0$, у которого дискриминант равен $4a^2Q(a)$, $Q(a)=${Qt}$. Две точки — при $Q(a)>0$, $a\\ne0$.`,
          `Нули $Q$: $a=${c.korniQ.map((t) => t.tex).join('$ и $a=')}$; ${toNumber(c.A2) > 0 ? '$Q(a)>0$ вне отрезка между ними' : toNumber(c.A2) < 0 ? '$Q(a)>0$ между ними' : '$Q$ линейна'}.`,
        ],
      },
      {
        title: 'Совпадения точек',
        lines: [
          `Точка прямой $Y=\\pm X$ лежит на окружности, когда $X=\\pm${roT === '1' ? '' : roT}a$; подставляя такие $x$ и $y$ во второе уравнение, получаем значения $a$, при которых решения совпадают. Общая точка прямых $X=Y=0$ лежит на $${ur2}$ ${toNumber(c.al) !== 0 ? `при $a=${ratTex(div(c.de, c.al))}$` : 'только при $a=0$'}.`,
          `Все «особые» значения: $a\\in\\{${iskT}\\}$.${vnT ? ` В найденное множество попадают $a=${vnT}$ — их исключаем (решений меньше четырёх).` : ''}`,
        ],
      },
      {
        title: 'Ответ',
        lines: [
          `Ровно четыре решения: $Q(a)>0$, $a\\ne0$, $a\\ne\\pm1$ и $a$ не из особых значений${p.dom === 'vse' ? '' : p.dom === 'pol' ? ', $a>0$' : ', $a<0$'}: $a\\in${otv}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Разложение на множители', formula: '(X^2-Y^2)(X^2+Y^2-' + kT + 'a^2)=0' },
      { slovo: 'Две прямые и окружность', formula: `Y=\\pm X,\\ X^2+Y^2=${kT}a^2` },
      { slovo: 'Две точки на окружности', formula: `${Qt}>0` },
      { slovo: 'Исключаем совпадения', formula: vnT || '\\varnothing' },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: {
      kuski: c.kuski.flatMap((q) => [q.lo?.v ?? -1e9, q.hi?.v ?? 1e9, 0, 0]),
      A2: toNumber(c.A2),
    },
  };
}

export const H19_PRYAMYE_OKR: Shablon2<PH19> = {
  no: 19,
  prototip:
    'Система: разложение на две прямые и окружность, прямая с параметром — ровно четыре решения',
  sobrat,
};
