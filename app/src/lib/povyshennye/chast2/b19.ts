/**
 * №19 (варианты 3–4): √(R² − x⁴) + c = a·x² − m·a, ровно k решений.
 *
 * t = x² ≥ 0: y = √(R² − t²) — дуга окружности радиуса R от A(0; R) до
 * B(R; 0), y = a(t − m) − c — прямая через M(m; −c) с угловым
 * коэффициентом a. Точка дуги с t > 0 даёт два решения x = ±√t, точка A —
 * одно. Особые положения прямой: через A, через B, касание дуги; число
 * решений на промежутках между ними считается заново.
 */

import { rat, type Rat } from '@/lib/zadanie15/core/rational';
import { renderPlan } from '@/lib/planimetriya/render';
import type { Element, Scena } from '@/lib/planimetriya/types';
import type { Kusok, Mnozhestvo } from '@/lib/chast2/sravnenie';
import { sKornem, skTex, skToNumber, type SKornem } from './chisla';
import { reshenieKasaniya } from './b19kasanie';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PB19 {
  R: number;
  c: number;
  m: number;
  /** Сколько решений должно быть (в образцах — 2). */
  k?: number;
  /**
   * Оформление решения учителя: по умолчанию — особые положения и
   * таблица; 'kasanie' — через формулу расстояния от точки до прямой,
   * с рамкой теории, рисунком трёх прямых и сноской (b19kasanie.ts).
   */
  oformlenie?: 'kasanie';
}

const ratSK = (u: Rat): SKornem => ({ u, k: rat(0), m: 1n });

/** Точки пересечения прямой y = a(t − m) − c с дугой: t ∈ [0; R], y ≥ 0. */
export function tochkiDugi(p: PB19, a: number): number[] {
  const b = -a * p.m - p.c;
  const A = 1 + a * a;
  const B = 2 * a * b;
  const C = b * b - p.R * p.R;
  const D = B * B - 4 * A * C;
  const eps = 1e-9;
  if (D < -eps) return [];
  const sq = Math.sqrt(Math.max(0, D));
  const ts = D <= eps ? [-B / (2 * A)] : [(-B - sq) / (2 * A), (-B + sq) / (2 * A)];
  return ts
    .filter((t) => t >= -eps && t <= p.R + eps && a * t + b >= -eps)
    .map((t) => Math.max(0, t));
}

/** Число решений исходного уравнения при данном a. */
export function chisloResheniy(p: PB19, a: number): number {
  return tochkiDugi(p, a).reduce((s, t) => s + (t < 1e-9 ? 1 : 2), 0);
}

interface Osoboe {
  a: SKornem;
  vid: 'A' | 'B' | 'kas';
}

export function osobye(p: PB19): {
  list: Osoboe[];
  kasVne: SKornem[];
  kv: [number, number, number];
} {
  const { R, c, m } = p;
  const list: Osoboe[] = [];
  if (m !== 0) list.push({ a: ratSK(rat(-(R + c), m)), vid: 'A' });
  if (R !== m) list.push({ a: ratSK(rat(c, R - m)), vid: 'B' });
  /* Касание: (m² − R²)a² + 2mca + c² − R² = 0. */
  const A2 = m * m - R * R;
  const A1 = 2 * m * c;
  const A0 = c * c - R * R;
  const kasVne: SKornem[] = [];
  if (A2 !== 0) {
    const D4 = rat(R * R * (m * m + c * c - R * R), A2 * A2);
    if (D4.n > 0n) {
      const u = rat(-m * c, A2);
      for (const z of [-1, 1] as const) {
        const a = sKornem(u, D4, z);
        const av = skToNumber(a);
        /* Точка касания — основание перпендикуляра из O. */
        const b = -av * m - c;
        const t = (-av * b) / (1 + av * av);
        const y = av * t + b;
        if (t > 1e-9 && t < R - 1e-9 && y > 1e-9) list.push({ a, vid: 'kas' });
        else kasVne.push(a);
      }
    }
  }
  list.sort((x, y) => skToNumber(x.a) - skToNumber(y.a));
  return { list, kasVne, kv: [A2, A1, A0] };
}

interface KusokA {
  lo: SKornem | null;
  hi: SKornem | null;
  loZ: boolean;
  hiZ: boolean;
}

function otvetKuski(
  p: PB19,
  list: Osoboe[],
): { kuski: KusokA[]; tablica: { tekst: string; n: number }[] } {
  const k = p.k ?? 2;
  const vals = list.map((o) => skToNumber(o.a));
  const tablica: { tekst: string; n: number }[] = [];
  const kuski: KusokA[] = [];
  const push = (q: KusokA) => {
    const last = kuski[kuski.length - 1];
    if (
      last &&
      last.hi &&
      q.lo &&
      skToNumber(last.hi) === skToNumber(q.lo) &&
      (last.hiZ || q.loZ)
    ) {
      last.hi = q.hi;
      last.hiZ = q.hiZ;
    } else kuski.push(q);
  };
  for (let i = 0; i <= list.length; i += 1) {
    const lo = i === 0 ? null : list[i - 1]!.a;
    const hi = i === list.length ? null : list[i]!.a;
    const lv = lo === null ? vals[0]! - 10 : vals[i - 1]!;
    const hv = hi === null ? vals[list.length - 1]! + 10 : vals[i]!;
    const n = chisloResheniy(p, (lv + hv) / 2);
    const tex =
      lo === null
        ? `a<${skTex(hi!)}`
        : hi === null
          ? `a>${skTex(lo)}`
          : `${skTex(lo)}<a<${skTex(hi)}`;
    tablica.push({ tekst: tex, n });
    if (n === k) push({ lo, hi, loZ: false, hiZ: false });
    if (hi !== null) {
      const nt = chisloResheniy(p, vals[i]!);
      tablica.push({ tekst: `a=${skTex(hi)}`, n: nt });
      if (nt === k) {
        const last = kuski[kuski.length - 1];
        if (last && last.hi === hi) last.hiZ = true;
        else push({ lo: hi, hi, loZ: true, hiZ: true });
      }
    }
  }
  /* Точка, к которой справа примыкает промежуток. */
  for (let i = 0; i + 1 < kuski.length; i += 1) {
    const a = kuski[i]!;
    const b = kuski[i + 1]!;
    if (a.lo === a.hi && b.lo !== null && a.hi !== null && skToNumber(a.hi) === skToNumber(b.lo)) {
      b.loZ = true;
      kuski.splice(i, 1);
      i -= 1;
    }
  }
  return { kuski, tablica };
}

const endTex = (x: SKornem | null, minus: boolean) =>
  x === null ? (minus ? '-\\infty' : '+\\infty') : skTex(x);

export function mnozhTexA(kuski: readonly KusokA[]): string {
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

const CHISLO = [
  'нет решений',
  'одно решение',
  'два решения',
  'три решения',
  'четыре решения',
  'пять решений',
  'шесть решений',
];
const RESH = (n: number) => CHISLO[n] ?? `${n} решений`;
/** Коэффициент при a: 1 → «», −1 → «−», 9 → «9». */
const ka = (m: number) => (m === 1 ? '' : m === -1 ? '-' : `${m}`);
/** Слагаемое со знаком: +2, −10, пусто для 0. */
const chlenA = (k: number) =>
  k === 0 ? '' : `${k > 0 ? '+' : '-'}${Math.abs(k) === 1 ? '' : Math.abs(k)}a`;
const sl = (c: number) => (c === 0 ? '' : c > 0 ? `+${c}` : `${c}`);
const SLOVO_K: Record<number, string> = {
  1: 'ровно одно решение',
  2: 'ровно два решения',
  3: 'ровно три решения',
  4: 'ровно четыре решения',
};

/** Чертёж: дуга, точка M и прямые в особых положениях. */
function chertezh(p: PB19, list: Osoboe[]): string {
  const { R, c, m } = p;
  const tochki: Scena['tochki'] = {
    O: [0, 0],
    A: [0, R],
    B: [R, 0],
    M: [m, -c],
    X: [Math.max(R, m) + 1, 0],
    Y: [0, Math.max(R, -c) + 1],
  };
  const el: Element[] = [
    { tip: 'otrezok', a: 'O', b: 'X', stil: 'punktir' },
    { tip: 'otrezok', a: 'O', b: 'Y', stil: 'punktir' },
    { tip: 'duga', okr: 'w', ot: 'B', do: 'A' },
    { tip: 'tochka', t: 'O' },
    { tip: 'tochka', t: 'M', vydelit: 'iskomoe' },
  ];
  const podpisi = ['O', 'A', 'B', 'M'];
  for (const o of list) {
    if (o.vid === 'A') el.push({ tip: 'pryamaya', a: 'M', b: 'A', zaB: 0.25, sloy: 'reshenie' });
    else if (o.vid === 'B')
      el.push({ tip: 'pryamaya', a: 'M', b: 'B', zaB: 0.4, sloy: 'reshenie' });
    else {
      const a = skToNumber(o.a);
      const b = -a * m - c;
      const t = (-a * b) / (1 + a * a);
      tochki.T = [t, a * t + b];
      el.push({ tip: 'tochka', t: 'T', sloy: 'reshenie' });
      el.push({ tip: 'pryamaya', a: 'M', b: 'T', zaB: 0.3, sloy: 'reshenie' });
      podpisi.push('T');
    }
  }
  const scena: Scena = {
    tochki,
    okruzhnosti: { w: { centr: 'O', radius: R } },
    elementy: el,
    podpisi,
  };
  return renderPlan(scena, {
    rezhim: { rezhim: 'uchitel' },
    shirina: 260,
    vysota: 220,
    alt: 'Четверть окружности и прямые через точку M в особых положениях',
  });
}

export function chertezhB19(p: PB19): string {
  return chertezh(p, osobye(p).list);
}

function sobrat(p: PB19): Chast2Zadacha {
  const { R, c, m } = p;
  const k = p.k ?? 2;
  if (m * m + c * c <= R * R) throw new Error('b19: точка M внутри круга');
  const { list, kasVne, kv } = osobye(p);
  const { kuski, tablica } = otvetKuski(p, list);
  if (kuski.length === 0) throw new Error('b19: пустой ответ');
  const otvet = mnozhTexA(kuski);

  const lev = `\\sqrt{${R * R}-x^4}${c === 0 ? '' : c > 0 ? `+${c}` : `${c}`}`;
  const prav = `ax^2${m === 0 ? '' : m === 1 ? '-a' : m === -1 ? '+a' : m > 0 ? `-${m}a` : `+${-m}a`}`;
  const uslovie = `Найдите все значения $a$, при каждом из которых уравнение\n$\\displaystyle ${lev}=${prav}$\nимеет ${SLOVO_K[k] ?? `ровно ${k} решений`}.`;

  const pryam = `y=a(t${m === 0 ? '' : m > 0 ? `-${m}` : `+${-m}`})${-c === 0 ? '' : -c > 0 ? `+${-c}` : `${-c}`}`;
  const aA = list.find((o) => o.vid === 'A');
  const aB = list.find((o) => o.vid === 'B');
  const aK = list.filter((o) => o.vid === 'kas');
  const zn = kv[0] < 0 ? -1 : 1;
  const [A2, A1, A0] = kv.map((x) => x * zn) as [number, number, number];
  const kvTex = `${A2}a^2${A1 === 0 ? '' : A1 > 0 ? `+${A1}a` : `${A1}a`}${A0 === 0 ? '' : A0 > 0 ? `+${A0}` : `${A0}`}=0`;
  const Mt = `M(${m};\\,${-c})`;

  const kasanie =
    p.oformlenie === 'kasanie'
      ? reshenieKasaniya({ R, c, m, list, kasVne, kv, tochki: (a) => tochkiDugi(p, a), otvet })
      : null;

  return {
    no: 19,
    shablon: 'b19.koren4',
    uslovie,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Множество значений $a$',
        pole: { vid: 'promezhutki', verno: vPole(kuski) },
      },
    ],
    otvet: `$a\\in${otvet}$`,
    ...(kasanie === null ? {} : { snoska: kasanie.snoska }),
    reshenie: kasanie?.reshenie ?? [
      {
        title: 'Замена',
        lines: [
          `Пусть $t=x^2$, $t\\ge0$. Уравнение принимает вид $\\sqrt{${R * R}-t^2}=a(t${m === 0 ? '' : m > 0 ? `-${m}` : `+${-m}`})${-c === 0 ? '' : -c > 0 ? `+${-c}` : `${-c}`}$.`,
          'Каждому корню $t>0$ соответствуют два решения $x=\\pm\\sqrt t$, корню $t=0$ — одно решение $x=0$.',
        ],
      },
      {
        title: 'Графики',
        lines: [
          `$y=\\sqrt{${R * R}-t^2}$ при $t\\ge0$ — дуга окружности $t^2+y^2=${R * R}$ с концами $A(0;\\,${R})$ и $B(${R};\\,0)$ (четверть окружности в первой четверти).`,
          `$${pryam}$ — прямая с угловым коэффициентом $a$, проходящая через точку $${Mt}$ (эта точка лежит вне круга).`,
          'Число решений равно удвоенному числу общих точек прямой и дуги с $t>0$, плюс одно, если прямая проходит через $A$.',
        ],
      },
      {
        title: 'Особые положения прямой',
        risunok: chertezh(p, list),
        lines: [
          ...(aA ? [`Через $A(0;\\,${R})$: $${R}=${ka(-m)}a${sl(-c)}$, $a=${skTex(aA.a)}$.`] : []),
          ...(aB ? [`Через $B(${R};\\,0)$: $0=${ka(R - m)}a${sl(-c)}$, $a=${skTex(aB.a)}$.`] : []),
          `Касание окружности: {{t:kasatelnaya-radius|радиус в точку касания перпендикулярен касательной}}, поэтому расстояние от $O(0;\\,0)$ до прямой $at-y${chlenA(-m)}${sl(-c)}=0$ равно радиусу: $\\dfrac{\\left|${ka(m)}a${sl(c)}\\right|}{\\sqrt{1+a^2}}=${R}$, то есть $${kvTex}$.`,
          ...aK.map((o) => `При $a=${skTex(o.a)}$ точка касания лежит на дуге.`),
          ...kasVne.map(
            (a) =>
              `При $a=${skTex(a)}$ прямая касается окружности вне дуги — с дугой у неё общих точек нет.`,
          ),
        ],
      },
      {
        title: 'Считаем решения',
        lines: [
          'Поворачиваем прямую вокруг точки $M$ и считаем общие точки с дугой между особыми положениями и в них самих:',
          ...tablica.map((r) => `$${r.tekst}$ — ${RESH(r.n)}.`),
          `${(SLOVO_K[k] ?? RESH(k)).replace(/^./, (x) => x.toUpperCase())} — при $a\\in${otvet}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'Замена $t=x^2$: корень $t>0$ даёт два решения, $t=0$ — одно',
        formula: `\\sqrt{${R * R}-t^2}=${pryam.slice(2)}`,
      },
      { slovo: 'Левая часть — четверть окружности, правая — прямые через точку $M$', formula: Mt },
      {
        slovo: 'Находим положения прямой через концы дуги и касательной',
        formula: list.map((o) => `a=${skTex(o.a)}`).join(',\\ '),
      },
      { slovo: 'Считаем решения на каждом промежутке', formula: otvet },
    ],
    utochnenie: {
      u: 'включением или исключением граничных точек',
      u2: 'один из промежутков множества значений $a$, возможно, с включением или исключением граничных точек',
      u3: 'исследованию взаимного расположения дуги окружности и прямых, проходящих через фиксированную точку',
    },
    kontrol: {
      osobye: list.map((o) => skToNumber(o.a)),
      kuski: kuski.flatMap((q) => [
        q.lo === null ? -1e9 : skToNumber(q.lo),
        q.hi === null ? 1e9 : skToNumber(q.hi),
        q.loZ ? 1 : 0,
        q.hiZ ? 1 : 0,
      ]),
      k,
    },
  };
}

export const B19_KOREN4: Shablon2<PB19> = {
  no: 19,
  prototip: '√(R² − x⁴) + c = a(x² − m): дуга окружности и пучок прямых через точку',
  sobrat,
};
