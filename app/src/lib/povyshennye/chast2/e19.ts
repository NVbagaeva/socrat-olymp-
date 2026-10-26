/**
 * №19 (варианты 9–10): первое уравнение системы — окружность
 * (x − cx)² + (y − cy)² = r², второе — пара прямых
 * (x − αa)² = (y − βa)²: ℓ₁: y = x + (β − α)a, ℓ₂: y = −x + (α + β)a,
 * пересекающихся в точке P(αa; βa).
 *
 * Число решений = n₁ + n₂ − [P на окружности], где nᵢ = 2, 1, 0 по
 * расстоянию от центра до ℓᵢ. Особые a: касания (концы промежутков
 * |dᵢ ± gᵢa| < r√2) и P на окружности (квадратное уравнение).
 */

import { renderPlan } from '@/lib/planimetriya/render';
import type { Element } from '@/lib/planimetriya/types';
import type { Kusok, Mnozhestvo } from '@/lib/chast2/sravnenie';
import { rat } from '@/lib/zadanie15/core/rational';
import { sKornem, skTex, skToNumber, type SKornem } from './chisla';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PE19 {
  cx: number;
  cy: number;
  r: number;
  al: number;
  be: number;
  /** Сколько решений должно быть (в образце — 4). */
  k: number;
}

const EPS = 1e-9;

/** Число решений системы при данном a. */
export function chisloE19(p: PE19, a: number): number {
  const n = (d: number) => (d < p.r - EPS ? 2 : Math.abs(d - p.r) <= EPS ? 1 : 0);
  const n1 = n(Math.abs(p.cx - p.cy + (p.be - p.al) * a) / Math.SQRT2);
  const n2 = n(Math.abs(p.cx + p.cy - (p.al + p.be) * a) / Math.SQRT2);
  const P = (p.al * a - p.cx) ** 2 + (p.be * a - p.cy) ** 2 - p.r * p.r;
  return n1 + n2 - (Math.abs(P) <= EPS ? 1 : 0);
}

interface Osoboe {
  a: SKornem;
  vid: 'l1' | 'l2' | 'P';
}

export function osobyeE19(p: PE19): Osoboe[] {
  const g1 = p.be - p.al;
  const g2 = p.al + p.be;
  if (g1 === 0 || g2 === 0) throw new Error('e19: прямая не зависит от a');
  const d1 = p.cx - p.cy;
  const d2 = p.cx + p.cy;
  const list: Osoboe[] = [];
  /* ℓ₁ касается: d1 + g1·a = ±r√2. */
  for (const z of [-1, 1] as const)
    list.push({ a: sKornem(rat(-d1, g1), rat(2 * p.r * p.r, g1 * g1), z), vid: 'l1' });
  for (const z of [-1, 1] as const)
    list.push({ a: sKornem(rat(d2, g2), rat(2 * p.r * p.r, g2 * g2), z), vid: 'l2' });
  /* P на окружности: (α² + β²)a² − 2(αcx + βcy)a + cx² + cy² − r² = 0. */
  const A = p.al ** 2 + p.be ** 2;
  const B = p.al * p.cx + p.be * p.cy;
  const C = p.cx ** 2 + p.cy ** 2 - p.r ** 2;
  const D4 = B * B - A * C;
  if (D4 > 0)
    for (const z of [-1, 1] as const)
      list.push({ a: sKornem(rat(B, A), rat(D4, A * A), z), vid: 'P' });
  else if (D4 === 0) list.push({ a: sKornem(rat(B, A), rat(0), 1), vid: 'P' });
  list.sort((x, y) => skToNumber(x.a) - skToNumber(y.a));
  for (let i = 0; i + 1 < list.length; i += 1)
    if (Math.abs(skToNumber(list[i]!.a) - skToNumber(list[i + 1]!.a)) < 1e-9)
      throw new Error('e19: совпали особые точки');
  return list;
}

interface KusokA {
  lo: SKornem | null;
  hi: SKornem | null;
  loZ: boolean;
  hiZ: boolean;
}

export function otvetE19(p: PE19): { kuski: KusokA[]; tablica: { tekst: string; n: number }[] } {
  const list = osobyeE19(p);
  const vals = list.map((o) => skToNumber(o.a));
  const kuski: KusokA[] = [];
  const tablica: { tekst: string; n: number }[] = [];
  for (let i = 0; i <= list.length; i += 1) {
    const lo = i === 0 ? null : list[i - 1]!.a;
    const hi = i === list.length ? null : list[i]!.a;
    const lv = lo === null ? vals[0]! - 10 : vals[i - 1]!;
    const hv = hi === null ? vals[list.length - 1]! + 10 : vals[i]!;
    const n = chisloE19(p, (lv + hv) / 2);
    tablica.push({
      tekst:
        lo === null
          ? `a<${skTex(hi!)}`
          : hi === null
            ? `a>${skTex(lo)}`
            : `${skTex(lo)}<a<${skTex(hi)}`,
      n,
    });
    if (n === p.k) {
      const last = kuski[kuski.length - 1];
      if (last && lo !== null && last.hi === lo && last.hiZ) {
        last.hi = hi;
        last.hiZ = false;
      } else kuski.push({ lo, hi, loZ: false, hiZ: false });
    }
    if (hi !== null) {
      const nt = chisloE19(p, vals[i]!);
      tablica.push({ tekst: `a=${skTex(hi)}`, n: nt });
      if (nt === p.k) {
        const last = kuski[kuski.length - 1];
        if (last && last.hi === hi) last.hiZ = true;
        else kuski.push({ lo: hi, hi, loZ: true, hiZ: true });
      }
    }
  }
  /* Отдельная точка, к которой справа примыкает промежуток. */
  for (let i = 0; i + 1 < kuski.length; i += 1) {
    const a = kuski[i]!;
    const b = kuski[i + 1]!;
    if (a.lo === a.hi && b.lo === a.hi) {
      b.loZ = true;
      kuski.splice(i, 1);
      i -= 1;
    }
  }
  if (kuski.length === 0) throw new Error('e19: пустой ответ');
  return { kuski, tablica };
}

const endTex = (x: SKornem | null, minus: boolean) =>
  x === null ? (minus ? '-\\infty' : '+\\infty') : skTex(x);

function mnozhTex(kuski: readonly KusokA[]): string {
  if (kuski.every((q) => q.lo !== null && q.lo === q.hi))
    return `\\left\\{${kuski.map((q) => skTex(q.lo!)).join(';\\ ')}\\right\\}`;
  return kuski
    .map((q) =>
      q.lo !== null && q.lo === q.hi
        ? `\\left\\{${skTex(q.lo)}\\right\\}`
        : `\\left${q.loZ ? '[' : '('}${endTex(q.lo, true)};\\ ${endTex(q.hi, false)}\\right${q.hiZ ? ']' : ')'}`,
    )
    .join('\\cup');
}

function vPole(kuski: readonly KusokA[]): Mnozhestvo {
  return {
    kuski: kuski.map((q): Kusok =>
      q.lo !== null && q.lo === q.hi
        ? { t: 'tochka', x: skTex(q.lo) }
        : {
            t: 'interval',
            lo: q.lo === null ? '-inf' : skTex(q.lo),
            loZakr: q.loZ,
            hi: q.hi === null ? 'inf' : skTex(q.hi),
            hiZakr: q.hiZ,
          },
    ),
  };
}

/** Слагаемое k·v со знаком: «+8x», «-x», пусто при k = 0. */
const chlen = (k: number, v: string, pervyy = false) =>
  k === 0
    ? ''
    : `${k < 0 ? '-' : pervyy ? '' : '+'}${Math.abs(k) === 1 && v !== '' ? '' : Math.abs(k)}${v}`;
const sdvig = (v: string, c: number) => (c === 0 ? v : `${v}${c > 0 ? '-' : '+'}${Math.abs(c)}`);
const kA = (k: number) => (k === 1 ? '' : k === -1 ? '-' : `${k}`);

const SLOVO: Record<number, string> = {
  2: 'ровно два решения',
  3: 'ровно три решения',
  4: 'ровно четыре решения',
};

function chertezh(p: PE19, a: number): string {
  const r = p.r;
  const P: [number, number] = [p.al * a, p.be * a];
  const el: Element[] = [
    { tip: 'okruzhnost', okr: 'w' },
    { tip: 'tochka', t: 'Q' },
    { tip: 'pryamaya', a: 'L1', b: 'M1', zaA: 0.1, zaB: 0.1 },
    { tip: 'pryamaya', a: 'L2', b: 'M2', zaA: 0.1, zaB: 0.1 },
    { tip: 'tochka', t: 'P' },
  ];
  const s = r + 3;
  return renderPlan(
    {
      tochki: {
        Q: [p.cx, p.cy],
        P,
        L1: [p.cx - s, p.cx - s + (p.be - p.al) * a],
        M1: [p.cx + s, p.cx + s + (p.be - p.al) * a],
        L2: [p.cx - s, -(p.cx - s) + (p.al + p.be) * a],
        M2: [p.cx + s, -(p.cx + s) + (p.al + p.be) * a],
      },
      okruzhnosti: { w: { centr: 'Q', radius: r } },
      elementy: el,
      podpisi: ['Q', 'P'],
      bezPodpisi: ['L1', 'M1', 'L2', 'M2'],
    },
    {
      rezhim: { rezhim: 'uchitel' },
      shirina: 260,
      vysota: 260,
      alt: 'Окружность и две перпендикулярные прямые, пересекающиеся в точке P',
    },
  );
}

function sobrat(p: PE19): Chast2Zadacha {
  const { kuski, tablica } = otvetE19(p);
  const otv = mnozhTex(kuski);
  const A = -2 * (p.cx + p.cy);
  const B = -2 * (p.cx - p.cy);
  const C = 2 * (p.r * p.r - p.cx * p.cx - p.cy * p.cy);
  const ur1 = `(x+y)^2+(x-y)^2${chlen(A, '(x+y)')}${chlen(B, '(x-y)')}=${C}`;
  const vn = `${chlen(2 * p.al, 'x', true)}${chlen(-2 * p.be, 'y')}${chlen(-(p.al ** 2 - p.be ** 2), 'a')}`;
  const ur2 = `(x+y)^2+(x-y)^2-4y^2=2a\\left(${vn}\\right)`;
  const sist = `\\begin{cases}${ur1},\\\\ ${ur2}\\end{cases}`;
  const g1 = p.be - p.al;
  const g2 = p.al + p.be;
  const d1 = p.cx - p.cy;
  const d2 = p.cx + p.cy;
  const os = osobyeE19(p);
  const okr = `(${sdvig('x', p.cx)})^2+(${sdvig('y', p.cy)})^2=${p.r * p.r}`;
  const l1 = `y=x${chlen(g1, 'a')}`;
  const l2 = `y=-x${chlen(g2, 'a')}`;
  const kas = (vid: 'l1' | 'l2') =>
    os
      .filter((o) => o.vid === vid)
      .map((o) => skTex(o.a))
      .join('$ и $a=');
  const Pz = os.filter((o) => o.vid === 'P');
  const A2 = p.al ** 2 + p.be ** 2;
  const B2 = -2 * (p.al * p.cx + p.be * p.cy);
  const C2 = p.cx ** 2 + p.cy ** 2 - p.r ** 2;
  const kvP = `${chlen(A2, 'a^2', true)}${chlen(B2, 'a')}${C2 === 0 ? '' : C2 > 0 ? `+${C2}` : `${C2}`}=0`;
  const k0 = kuski.find((q) => q.lo !== null && q.hi !== null && q.lo !== q.hi);
  const aPrim = k0 ? Math.round(((skToNumber(k0.lo!) + skToNumber(k0.hi!)) / 2) * 10) / 10 : 0;
  return {
    no: 19,
    shablon: 'e19.okrPrjamye',
    uslovie: `Найдите все значения $a$, при каждом из которых система уравнений\n$${sist}$\nимеет ${SLOVO[p.k] ?? `${p.k} решений`}.`,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Множество значений $a$',
        pole: { vid: 'promezhutki', verno: vPole(kuski) },
      },
    ],
    otvet: `$a\\in${otv}$`,
    reshenie: [
      {
        title: 'Первое уравнение — окружность',
        lines: [
          `$(x+y)^2+(x-y)^2=2x^2+2y^2$, а $${chlen(A, '(x+y)', true)}${chlen(B, '(x-y)')}=${chlen(-4 * p.cx, 'x', true)}${chlen(-4 * p.cy, 'y')}$. Делим на $2$ и выделяем полные квадраты: $${okr}$ — окружность $\\omega$ с центром $Q(${p.cx};\\,${p.cy})$ и радиусом $${p.r}$.`,
        ],
      },
      {
        title: 'Второе уравнение — две прямые',
        lines: [
          `Левая часть равна $2x^2-2y^2$; после деления на $2$ и переноса: $x^2${chlen(-2 * p.al, 'ax')}+${p.al ** 2}a^2=y^2${chlen(-2 * p.be, 'ay')}+${p.be ** 2}a^2$, то есть $(x${chlen(-p.al, 'a')})^2=(y${chlen(-p.be, 'a')})^2$.`.replace(
            /\+1a\^2/g,
            '+a^2',
          ),
          `Это пара прямых $\\ell_1$: $${l1}$ и $\\ell_2$: $${l2}$; они перпендикулярны и пересекаются в точке $P(${kA(p.al)}a;\\,${kA(p.be)}a)$.`,
        ],
        risunok: k0 ? chertezh(p, aPrim) : undefined,
      },
      {
        title: 'Как считать решения',
        lines: [
          'Решения системы — общие точки окружности $\\omega$ с объединением прямых $\\ell_1$ и $\\ell_2$. Прямая пересекает окружность в двух точках, если расстояние от центра до неё меньше радиуса, касается — если равно, и не имеет общих точек — если больше.',
          'Если точка $P$ лежит на окружности, то она общая для обеих прямых и считается один раз.',
        ],
      },
      {
        title: 'Касания и точка $P$',
        lines: [
          `$\\rho(Q,\\ell_1)=\\dfrac{|${p.cx}-${p.cy < 0 ? `(${p.cy})` : p.cy}${chlen(g1, 'a')}|}{\\sqrt2}=\\dfrac{|${d1}${chlen(g1, 'a')}|}{\\sqrt2}$; $\\rho=${p.r}$ при $a=${kas('l1')}$.`.replace(
            /\|0\+/g,
            '|',
          ),
          `$\\rho(Q,\\ell_2)=\\dfrac{|${p.cx}+${p.cy < 0 ? `(${p.cy})` : p.cy}${chlen(-g2, 'a')}|}{\\sqrt2}=\\dfrac{|${d2}${chlen(-g2, 'a')}|}{\\sqrt2}$; $\\rho=${p.r}$ при $a=${kas('l2')}$.`,
          Pz.length > 0
            ? `$P\\in\\omega$: $(${kA(p.al)}a${p.cx === 0 ? '' : p.cx > 0 ? `-${p.cx}` : `+${-p.cx}`})^2+(${kA(p.be)}a${p.cy === 0 ? '' : p.cy > 0 ? `-${p.cy}` : `+${-p.cy}`})^2=${p.r * p.r}$, $${kvP}$, $a=${Pz.map((o) => skTex(o.a)).join('$ или $a=')}$.`
            : `$P\\in\\omega$: $${kvP}$ — корней нет, точка $P$ никогда не лежит на окружности.`,
        ],
      },
      {
        title: 'Число решений',
        lines: [
          'Особые значения разбивают прямую на промежутки; на каждом считаем решения по правилу выше:',
          ...tablica.map(
            (t) =>
              `$${t.tekst}$: ${t.n} ${t.n === 1 ? 'решение' : t.n >= 2 && t.n <= 4 ? 'решения' : 'решений'}.`,
          ),
          `Ответ: $a\\in${otv}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Первое уравнение — окружность', formula: okr },
      { slovo: 'Второе уравнение — две перпендикулярные прямые', formula: `${l1},\\ ${l2}` },
      {
        slovo: 'Касания прямых и попадание точки $P$ на окружность',
        formula: `a=${os.map((o) => skTex(o.a)).join(';\\ ')}`,
      },
      { slovo: 'Подсчёт решений на промежутках', formula: otv },
    ],
    kontrol: {
      tochki: os.map((o) => skToNumber(o.a)),
      k: p.k,
      kuski: kuski.flatMap((q) => [
        q.lo ? skToNumber(q.lo) : -1e9,
        q.hi ? skToNumber(q.hi) : 1e9,
        q.loZ ? 1 : 0,
        q.hiZ ? 1 : 0,
      ]),
    },
  };
}

export const E19_OKR_PRYAMYE: Shablon2<PE19> = {
  no: 19,
  prototip: 'Окружность и пара перпендикулярных прямых: касания и общая точка прямых',
  sobrat,
};
