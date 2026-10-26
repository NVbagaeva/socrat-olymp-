/**
 * №19: уравнение с |x|, сводящееся при t = |x| к произведению
 *
 *   вид «шесть» (вариант 5):  (a − kt)(a − pt + t²) = 0,
 *     |x|(kx² + (k+p)a) − x²(a + kp) = a²;
 *   вид «четыре» (вариант 6): (a − kt)(a − t² + pt) = 0,
 *     x²(a + kp) − |x|(kx² − (k−p)a) = a².
 *
 * Как квадратное относительно a уравнение имеет дискриминант
 * t²(t − c)², поэтому раскладывается. Каждому t > 0 соответствуют два
 * корня ±t, t = 0 — один. Число корней считается по случаям: знак a,
 * дискриминант квадратного по t множителя и совпадение его корня с a/k.
 *
 * Ответ: «шесть» — (0; a*) ∪ (a*; p²/4), a* = k(p − k);
 * «четыре» — (−p²/4; 0) ∪ (0; a*) ∪ (a*; +∞), a* = k(p + k).
 */

import { add, div, mul, rat, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat } from '@/lib/zadanie15/core/surd';
import type { Kusok } from '@/lib/chast2/sravnenie';
import { ratDecTex } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PC19 {
  vid: 'shest' | 'chetyre';
  k: number;
  p: number;
}

/** ε: множитель t² − pt + εa (шесть: +1, четыре: −1). */
const eps = (p: PC19) => (p.vid === 'shest' ? 1 : -1);

/** Число различных корней x при данном a — по множителям, точно. */
export function chisloKorneyC19(p: PC19, a: Rat): number {
  const e = eps(p);
  const ts: { v: number; exact: Rat | null }[] = [];
  const t1 = div(a, rat(p.k));
  ts.push({ v: toNumber(t1), exact: t1 });
  /* t² − pt + εa = 0. */
  const D = sub(rat(p.p * p.p), mul(rat(4 * e), a));
  if (toNumber(D) >= 0) {
    const s = sqrtRat(D);
    for (const z of [-1, 1]) {
      if (s.m === 1n) {
        const t = div(add(rat(p.p), mul(rat(z), s.k)), rat(2));
        ts.push({ v: toNumber(t), exact: t });
      } else {
        ts.push({ v: (p.p + z * Math.sqrt(toNumber(D))) / 2, exact: null });
      }
    }
  }
  const ok = ts.filter((t) => (t.exact !== null ? t.exact.n >= 0n : t.v > 0));
  const raz: typeof ok = [];
  for (const t of ok)
    if (
      !raz.some((u) =>
        u.exact !== null && t.exact !== null
          ? toNumber(sub(u.exact, t.exact)) === 0
          : Math.abs(u.v - t.v) < 1e-12,
      )
    )
      raz.push(t);
  return raz.reduce((s, t) => s + ((t.exact !== null ? t.exact.n === 0n : t.v === 0) ? 1 : 2), 0);
}

export interface KusokC19 {
  lo: Rat | null;
  loZ: boolean;
  hi: Rat | null;
  hiZ: boolean;
}

/** Множество a с нужным числом корней — по критическим точкам. */
export function otvetC19(p: PC19): KusokC19[] {
  const e = eps(p);
  const N = p.vid === 'shest' ? 6 : 4;
  const kr = [rat(0), rat(e * p.p * p.p, 4), rat(p.k * (p.p - e * p.k))]
    .sort((x, y) => toNumber(x) - toNumber(y))
    .filter((x, i, arr) => i === 0 || toNumber(sub(x, arr[i - 1]!)) !== 0);
  const out: KusokC19[] = [];
  const dobavit = (k: KusokC19) => {
    const last = out[out.length - 1];
    if (
      last !== undefined &&
      last.hi !== null &&
      k.lo !== null &&
      toNumber(sub(last.hi, k.lo)) === 0 &&
      (last.hiZ || k.loZ)
    ) {
      last.hi = k.hi;
      last.hiZ = k.hiZ;
    } else out.push(k);
  };
  for (let i = 0; i <= kr.length; i += 1) {
    const lo = i === 0 ? null : kr[i - 1]!;
    const hi = i === kr.length ? null : kr[i]!;
    const mid =
      lo === null ? sub(hi!, rat(1)) : hi === null ? add(lo, rat(1)) : div(add(lo, hi), rat(2));
    const vT = lo !== null && chisloKorneyC19(p, lo) === N;
    const vI = chisloKorneyC19(p, mid) === N;
    if (vT && !vI) dobavit({ lo, loZ: true, hi: lo, hiZ: true });
    if (vI) dobavit({ lo, loZ: vT, hi, hiZ: hi !== null && chisloKorneyC19(p, hi) === N });
  }
  return out;
}

const chT = (x: Rat | null, minus: boolean) =>
  x === null ? (minus ? '-\\infty' : '+\\infty') : ratDecTex(x);

export function mnozhestvoC19(ks: readonly KusokC19[]): string {
  return ks
    .map((k) =>
      k.lo !== null && k.hi !== null && toNumber(sub(k.lo, k.hi)) === 0
        ? `\\left\\{${chT(k.lo, true)}\\right\\}`
        : `\\left${k.loZ ? '[' : '('}${chT(k.lo, true)};\\ ${chT(k.hi, false)}\\right${k.hiZ ? ']' : ')'}`,
    )
    .join('\\cup');
}

const pole = (x: Rat | null, minus: boolean) =>
  x === null ? (minus ? '-inf' : 'inf') : ratDecTex(x).replace(/\\dfrac/g, '\\frac');

/** «k», «» при 1, «−» при −1 перед буквой. */
const kf = (k: number) => (k === 1 ? '' : k === -1 ? '-' : String(k));

function sobrat(p: PC19): Chast2Zadacha {
  const { k, p: pp } = p;
  const e = eps(p);
  if (!(k > 0 && pp > 0)) throw new Error('c19: нужны k > 0, p > 0');
  if (p.vid === 'shest' && !(pp > k && 2 * k !== pp)) throw new Error('c19: нужно p > k, p ≠ 2k');
  const ks = otvetC19(p);
  const otvet = mnozhestvoC19(ks);
  const aStar = rat(k * (pp - e * k));
  const gran = rat(e * pp * pp, 4);
  const aS = ratDecTex(aStar);
  const gr = ratDecTex(gran);
  const N = p.vid === 'shest' ? 6 : 4;
  const kp = k * pp;

  let ur: string;
  let faktor: string;
  let kvA: string;
  let diskr: string;
  let korniA: string;
  if (p.vid === 'shest') {
    ur = `|x|\\left(${kf(k)}x^2+${k + pp}a\\right)-x^2\\left(a+${kp}\\right)=a^2`;
    kvA = `a^2-\\left(${k + pp}t-t^2\\right)a+${kp}t^2-${kf(k)}t^3=0`;
    const c = pp - k;
    diskr = `\\left(${k + pp}t-t^2\\right)^2-4\\left(${kp}t^2-${kf(k)}t^3\\right)=t^2\\left(t^2-${2 * c}t+${c * c}\\right)=t^2\\left(t-${c}\\right)^2`;
    korniA = `a=\\dfrac{${k + pp}t-t^2\\pm t\\,(t-${c})}{2}`;
    faktor = `\\left(a-${kf(k)}t\\right)\\left(a-${kf(pp)}t+t^2\\right)=0`;
  } else {
    const kmp = k - pp;
    const vnutri =
      kmp === 0 ? `${kf(k)}x^2` : kmp > 0 ? `${kf(k)}x^2-${kf(kmp)}a` : `${kf(k)}x^2+${kf(-kmp)}a`;
    ur = `x^2\\left(a+${kp}\\right)-|x|\\left(${vnutri}\\right)=a^2`;
    const lin = kmp === 0 ? 't^2' : `t^2${kmp > 0 ? '+' : '-'}${kf(Math.abs(kmp))}t`;
    kvA = `a^2-\\left(${lin}\\right)a+${kf(k)}t^3-${kp}t^2=0`;
    const c = k + pp;
    diskr = `\\left(${lin}\\right)^2-4\\left(${kf(k)}t^3-${kp}t^2\\right)=t^2\\left(t^2-${2 * c}t+${c * c}\\right)=t^2\\left(t-${c}\\right)^2`;
    korniA = `a=\\dfrac{${lin}\\pm t\\,(t-${c})}{2}`;
    faktor = `\\left(a-${kf(k)}t\\right)\\left(a-t^2+${kf(pp)}t\\right)=0`;
  }
  const uslovie =
    `Найдите все значения $a$, при каждом из которых уравнение\n` +
    `$\\displaystyle ${ur}$\n` +
    `имеет ровно ${N === 6 ? 'шесть корней' : 'четыре корня'}.`;
  const aNaK = k === 1 ? 'a' : `\\dfrac a{${k}}`;
  const kvT = `t^2-${kf(pp)}t${e > 0 ? '+' : '-'}a=0`;

  const sluchai =
    p.vid === 'shest'
      ? [
          `Шесть корней — это три различных положительных значения $t$ (значение $t=0$ даёт один корень, и тогда корней нечётное число).`,
          `Корень $t=${aNaK}$ первого множителя положителен при $a>0$. У $${kvT}$ два различных положительных корня, когда $D=${pp * pp}-4a>0$, сумма корней $${pp}>0$ и произведение $a>0$, то есть при $0<a<${gr}$.`,
          `Корни не должны совпадать: $t=${aNaK}$ — корень $${kvT}$, если $${k === 1 ? 'a^2' : `\\dfrac{a^2}{${k * k}}`}-${k === 1 ? `${pp}a` : `\\dfrac{${pp}a}{${k}}`}+a=0$, то есть $a=0$ или $a=${aS}$.`,
          `При $a\\le0$ положительных значений $t$ меньше трёх, при $a\\ge${gr}$ квадратный множитель даёт не больше одного значения. Итак, $0<a<${gr}$ и $a\\ne${aS}$.`,
        ]
      : [
          `Четыре корня — это ровно два различных положительных значения $t$ и $t\\ne0$ (значение $t=0$ даёт один корень).`,
          `При $a>0$: $t=${aNaK}>0$, а у $${kvT}$ произведение корней $-a<0$ — ровно один положительный корень. Значения совпадают, если $${k === 1 ? 'a^2' : `\\dfrac{a^2}{${k * k}}`}-${k === 1 ? `${pp}a` : `\\dfrac{${pp}a}{${k}}`}-a=0$, то есть при $a=${aS}$ — тогда корней два. Иначе корней четыре.`,
          `При $a=0$: $t=0$ и $t=${pp}$ — три корня $x=0$, $x=\\pm${pp}$.`,
          `При $a<0$: $t=${aNaK}<0$ не подходит; у $${kvT}$ сумма корней $${pp}>0$ и произведение $-a>0$, два различных положительных корня — при $D=${pp * pp}+4a>0$, то есть $a>${gr}$. При $a=${gr}$ корень один ($t=${ratDecTex(rat(pp, 2))}$) — два корня $x$.`,
        ];

  return {
    no: 19,
    shablon: 'c19.modul',
    uslovie,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Множество значений $a$',
        pole: {
          vid: 'promezhutki',
          verno: {
            kuski: ks.map((q): Kusok =>
              q.lo !== null && q.hi !== null && toNumber(sub(q.lo, q.hi)) === 0
                ? { t: 'tochka', x: pole(q.lo, true) }
                : {
                    t: 'interval',
                    lo: pole(q.lo, true),
                    loZakr: q.loZ,
                    hi: pole(q.hi, false),
                    hiZakr: q.hiZ,
                  },
            ),
          },
        },
      },
    ],
    otvet: `$a\\in${otvet}$`,
    reshenie: [
      {
        title: 'Замена $t=|x|$',
        lines: [
          `Так как $x^2=|x|^2$, при $t=|x|\\ge0$ уравнение принимает вид $${kvA}$ — это квадратное уравнение относительно $a$.`,
          'Каждому $t>0$ соответствуют два корня $x=\\pm t$, значению $t=0$ — один корень $x=0$.',
        ],
      },
      {
        title: 'Раскладываем на множители',
        lines: [
          `Дискриминант по $a$: $${diskr}$.`,
          `$${korniA}$, то есть $a=${kf(k)}t$ или $a=${p.vid === 'shest' ? `${kf(pp)}t-t^2` : `t^2-${kf(pp)}t`}$:`,
          `$${faktor}$.`,
        ],
      },
      {
        title: 'Корни каждого множителя',
        lines: [`Первый множитель: $t=${aNaK}$. Второй: $${kvT}$.`],
      },
      { title: `Когда корней ровно ${N === 6 ? 'шесть' : 'четыре'}`, lines: sluchai },
      { title: 'Ответ', lines: [`$a\\in${otvet}$.`] },
    ],
    razbor: [
      { slovo: 'Замена $t=|x|\\ge0$ — квадратное уравнение относительно $a$', formula: kvA },
      { slovo: 'Дискриминант — полный квадрат, раскладываем', formula: faktor },
      { slovo: 'Каждое $t>0$ даёт два корня, $t=0$ — один', formula: `x=\\pm t` },
      { slovo: 'Считаем положительные корни по Виету и дискриминанту', formula: `a\\ne${aS}` },
      { slovo: 'Собираем ответ', formula: otvet },
    ],
    utochnenie: {
      u: `включением точки $a=${aS}$ и/или граничных точек`,
      u2: `промежуток множества значений $a$${p.vid === 'shest' ? `, содержащий $(0;\\ ${aS})$ или $(${aS};\\ ${gr})$` : ''}, возможно, с включением граничных точек`,
      u3: `исследованию уравнения $${faktor}$, $t=|x|\\ge0$`,
    },
    kontrol: {
      kuski: ks.flatMap((q) => [
        q.lo === null ? -1e9 : toNumber(q.lo),
        q.hi === null ? 1e9 : toNumber(q.hi),
        q.loZ ? 1 : 0,
        q.hiZ ? 1 : 0,
      ]),
      aStar: toNumber(aStar),
      gran: toNumber(gran),
      N,
    },
  };
}

export const C19_MODUL: Shablon2<PC19> = {
  no: 19,
  prototip: 'Уравнение с |x|: квадратное по a, разложение, число корней по t = |x|',
  sobrat,
};
