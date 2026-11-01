/**
 * №19 (варианты 31–36), свои задачи раздела: параметр, графический метод.
 *   polukrug — √(R² − x²) = kx + a, k = kn/kd > 0, √(1 + k²) = m рационально:
 *              полуокружность и прямые одного наклона. Два корня при
 *              a ∈ [kR; mR), один — при a ∈ [−kR; kR) ∪ {mR}.
 *   okrModul — y = |x| + a, x² + y² = R²: «галочка» сдвигается по
 *              вертикали. 2 решения: a = −R√2 или −R < a < R; 3: a = −R;
 *              4: −R√2 < a < −R.
 *   puchok   — |x² − (1 + k)x + k| = ax, k = s² (s ≥ 2): прямые через
 *              начало координат. aₜ = (s − 1)², aₘ = (s + 1)²:
 *              2 корня — a < −aₘ, a = 0, a > aₜ; 3 — a = aₜ; 4 — 0 < a < aₜ.
 */

import type { Kusok, Mnozhestvo } from '@/lib/chast2/sravnenie';
import { mul, rat, ratTex, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import type { Chast2Zadacha, Shablon2 } from './types';

export type PR19 =
  | { vid: 'polukrug'; R: number; kn: number; kd: number; kol: 1 | 2 }
  | { vid: 'okrModul'; R: number; kol: 2 | 3 | 4 }
  | { vid: 'puchok'; s: number; kol: 2 | 3 | 4 };

interface Tch {
  v: number;
  tex: string;
}
type Kus =
  | { t: 'tochka'; x: Tch }
  | { t: 'interval'; lo: Tch | null; hi: Tch | null; loZ: boolean; hiZ: boolean };

const T = (q: Rat): Tch => ({ v: toNumber(q), tex: ratTex(q) });

export function chislaR19(p: PR19): { kuski: Kus[]; dop: Record<string, Tch> } {
  if (p.vid === 'polukrug') {
    const k = rat(p.kn, p.kd);
    const m2 = 1 + (p.kn / p.kd) ** 2;
    const mN = Math.round(Math.sqrt(p.kn * p.kn + p.kd * p.kd));
    if (mN * mN !== p.kn * p.kn + p.kd * p.kd) throw new Error('r19: √(1+k²) не рационален');
    void m2;
    const m = rat(mN, p.kd);
    const kR = T(mul(k, rat(p.R)));
    const mR = T(mul(m, rat(p.R)));
    const minus = T(mul(k, rat(-p.R)));
    const kuski: Kus[] =
      p.kol === 2
        ? [{ t: 'interval', lo: kR, hi: mR, loZ: true, hiZ: false }]
        : [
            { t: 'interval', lo: minus, hi: kR, loZ: true, hiZ: false },
            { t: 'tochka', x: mR },
          ];
    return { kuski, dop: { kR, mR, minus } };
  }
  if (p.vid === 'okrModul') {
    const R = p.R;
    const r2: Tch = { v: -R * Math.SQRT2, tex: `-${R === 1 ? '' : R}\\sqrt2` };
    const mR: Tch = { v: -R, tex: `${-R}` };
    const pR: Tch = { v: R, tex: `${R}` };
    const kuski: Kus[] =
      p.kol === 2
        ? [
            { t: 'tochka', x: r2 },
            { t: 'interval', lo: mR, hi: pR, loZ: false, hiZ: false },
          ]
        : p.kol === 3
          ? [{ t: 'tochka', x: mR }]
          : [{ t: 'interval', lo: r2, hi: mR, loZ: false, hiZ: false }];
    return { kuski, dop: { r2, mR, pR } };
  }
  if (p.s < 2) throw new Error('r19: s ≥ 2');
  const at: Tch = { v: (p.s - 1) ** 2, tex: `${(p.s - 1) ** 2}` };
  const am: Tch = { v: -((p.s + 1) ** 2), tex: `${-((p.s + 1) ** 2)}` };
  const nol: Tch = { v: 0, tex: '0' };
  const kuski: Kus[] =
    p.kol === 2
      ? [
          { t: 'interval', lo: null, hi: am, loZ: false, hiZ: false },
          { t: 'tochka', x: nol },
          { t: 'interval', lo: at, hi: null, loZ: false, hiZ: false },
        ]
      : p.kol === 3
        ? [{ t: 'tochka', x: at }]
        : [{ t: 'interval', lo: nol, hi: at, loZ: false, hiZ: false }];
  return { kuski, dop: { at, am } };
}

function kusTex(k: Kus): string {
  if (k.t === 'tochka') return `\\left\\{${k.x.tex}\\right\\}`;
  return `\\left${k.loZ ? '[' : '('}${k.lo?.tex ?? '-\\infty'};\\ ${k.hi?.tex ?? '+\\infty'}\\right${k.hiZ ? ']' : ')'}`;
}

function vPole(kuski: Kus[]): Mnozhestvo {
  const pl = (t: Tch | null, inf: string) =>
    t === null ? inf : t.tex.replace(/\\dfrac/g, '\\frac');
  return {
    kuski: kuski.map((k): Kusok =>
      k.t === 'tochka'
        ? { t: 'tochka', x: pl(k.x, '') }
        : {
            t: 'interval',
            lo: pl(k.lo, '-inf'),
            loZakr: k.loZ,
            hi: pl(k.hi, 'inf'),
            hiZakr: k.hiZ,
          },
    ),
  };
}

const KOL: Record<number, string> = {
  1: 'ровно один корень',
  2: 'ровно два различных корня',
  3: 'ровно три различных корня',
  4: 'ровно четыре различных корня',
};
const KOL_S: Record<number, string> = {
  2: 'ровно два различных решения',
  3: 'ровно три различных решения',
  4: 'ровно четыре различных решения',
};

function sobrat(p: PR19): Chast2Zadacha {
  const ch = chislaR19(p);
  const otv = ch.kuski.map(kusTex).join('\\cup');
  let uslovie = '';
  let reshenie: Chast2Zadacha['reshenie'] = [];
  let razbor: Chast2Zadacha['razbor'] = [];
  if (p.vid === 'polukrug') {
    const kT = p.kd === 1 ? `${p.kn}` : `\\dfrac{${p.kn}}{${p.kd}}`;
    const d = ch.dop;
    uslovie = `Найдите все значения $a$, при каждом из которых уравнение $\\sqrt{${p.R * p.R}-x^2}=${kT}x+a$ имеет ${KOL[p.kol]}.`;
    reshenie = [
      {
        title: 'Графики',
        lines: [
          `$y=\\sqrt{${p.R * p.R}-x^2}$ — верхняя полуокружность с центром $O(0;0)$ и радиусом $${p.R}$ (концы $(\\pm${p.R};0)$). $y=${kT}x+a$ — прямые с угловым коэффициентом $${kT}$; $a$ сдвигает их по вертикали. Число корней — число общих точек.`,
        ],
      },
      {
        title: 'Граничные положения',
        lines: [
          `Прямая через правый конец $(${p.R};0)$: $a=${d.minus!.tex}$; через левый конец $(-${p.R};0)$: $a=${d.kR!.tex}$.`,
          `Касание: расстояние от $O$ до прямой $${kT}x-y+a=0$ равно радиусу: $\\dfrac{|a|}{\\sqrt{1+\\left(${kT}\\right)^2}}=${p.R}$, $a=${d.mR!.tex}$ (касание сверху).`,
          `При $${d.minus!.tex}\\le a<${d.kR!.tex}$ — одна общая точка; при $${d.kR!.tex}\\le a<${d.mR!.tex}$ — две; при $a=${d.mR!.tex}$ — одна; при остальных $a$ — ни одной.`,
        ],
      },
      { title: 'Ответ', lines: [`$a\\in${otv}$.`] },
    ];
    razbor = [
      { slovo: 'Полуокружность', formula: `y=\\sqrt{${p.R * p.R}-x^2}` },
      { slovo: 'Прямая через левый конец', formula: `a=${d.kR!.tex}` },
      { slovo: 'Касание: расстояние до центра равно радиусу', formula: `a=${d.mR!.tex}` },
      { slovo: 'Ответ', formula: otv },
    ];
  } else if (p.vid === 'okrModul') {
    const d = ch.dop;
    uslovie = `Найдите все значения $a$, при каждом из которых система уравнений $\\begin{cases}y=|x|+a,\\\\x^2+y^2=${p.R * p.R}\\end{cases}$ имеет ${KOL_S[p.kol]}.`;
    reshenie = [
      {
        title: 'Графики',
        lines: [
          `Второе уравнение — окружность с центром $O(0;0)$ и радиусом $${p.R}$. Первое — «галочка» $y=|x|$, сдвинутая на $a$ по вертикали; график симметричен относительно оси $Oy$.`,
          `Решения на правой ветви $y=x+a$, $x\\ge0$: $2x^2+2ax+a^2-${p.R * p.R}=0$, $x=\\dfrac{-a\\pm\\sqrt{${2 * p.R * p.R}-a^2}}{2}$; левая ветвь даёт симметричные решения, точка $x=0$ общая.`,
        ],
      },
      {
        title: 'Подсчёт решений',
        lines: [
          `Касание ветви: $a=${d.r2!.tex}$ (вершина ниже окружности, по одной точке на ветви) — $2$ решения; при $a<${d.r2!.tex}$ решений нет.`,
          `При $${d.r2!.tex}<a<${d.mR!.tex}$ у каждой ветви два неотрицательных корня — $4$ решения; при $a=${d.mR!.tex}$ один из корней $x=0$ общий — $3$ решения.`,
          `При $${d.mR!.tex}<a<${d.pR!.tex}$ — по одному положительному корню на ветви, $2$ решения; при $a=${d.pR!.tex}$ — одна точка $(0;${p.R})$; при $a>${d.pR!.tex}$ — ни одной.`,
        ],
      },
      { title: 'Ответ', lines: [`$a\\in${otv}$.`] },
    ];
    razbor = [
      { slovo: 'Окружность и сдвинутая «галочка»', formula: `x^2+y^2=${p.R * p.R},\\ y=|x|+a` },
      { slovo: 'Касание ветви', formula: `a=${d.r2!.tex}` },
      { slovo: 'Вершина на окружности', formula: `a=\\pm${p.R}` },
      { slovo: 'Ответ', formula: otv },
    ];
  } else {
    const k = p.s * p.s;
    const d = ch.dop;
    uslovie = `Найдите все значения $a$, при каждом из которых уравнение $\\left|x^2-${k + 1}x+${k}\\right|=ax$ имеет ${KOL[p.kol]}.`;
    reshenie = [
      {
        title: 'Графики',
        lines: [
          `$y=\\left|(x-1)(x-${k})\\right|$ — парабола, у которой часть между корнями $1$ и $${k}$ отражена вверх. $y=ax$ — прямые через начало координат.`,
          `При $a>0$: на $(0;1)$ и на $(${k};+\\infty)$ всегда ровно по одной общей точке; на $(1;${k})$ уравнение $x^2-(${k + 1}-a)x+${k}=0$ имеет два, один или ни одного корня — по дискриминанту $(${k + 1}-a)^2-${4 * k}$.`,
        ],
      },
      {
        title: 'Граничные значения',
        lines: [
          `Касание с отражённой частью: $${k + 1}-a=${2 * p.s}$, $a=${d.at!.tex}$ (точка касания $x=${p.s}$ лежит на $(1;${k})$).`,
          `$a=0$: корни $1$ и $${k}$. При $a<0$ общие точки только при $x<0$: $x^2-(${k + 1}+a)x+${k}=0$ с двумя отрицательными корнями, когда $${k + 1}+a<0$ и $(${k + 1}+a)^2\\ge${4 * k}$, то есть $a\\le${d.am!.tex}$ (при равенстве — один корень).`,
          `Итак: $4$ корня при $0<a<${d.at!.tex}$, $3$ — при $a=${d.at!.tex}$, $2$ — при $a>${d.at!.tex}$, $a=0$ и $a<${d.am!.tex}$, $1$ — при $a=${d.am!.tex}$.`,
        ],
      },
      { title: 'Ответ', lines: [`$a\\in${otv}$.`] },
    ];
    razbor = [
      { slovo: 'Модуль параболы и прямые через $O$', formula: `y=|(x-1)(x-${k})|,\\ y=ax` },
      { slovo: 'Касание с отражённой частью', formula: `a=${d.at!.tex}` },
      { slovo: 'Отрицательные $a$: касание левой ветви', formula: `a=${d.am!.tex}` },
      { slovo: 'Ответ', formula: otv },
    ];
  }
  return {
    no: 19,
    shablon: 'r19.parametr',
    uslovie,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Множество значений параметра',
        pole: { vid: 'promezhutki', verno: vPole(ch.kuski) },
      },
    ],
    otvet: `$a\\in${otv}$`,
    reshenie,
    razbor,
    kontrol: {
      kuski: ch.kuski.flatMap((k) =>
        k.t === 'tochka'
          ? [k.x.v, k.x.v, 1, 1]
          : [k.lo?.v ?? -1e9, k.hi?.v ?? 1e9, k.loZ ? 1 : 0, k.hiZ ? 1 : 0],
      ),
    },
  };
}

export const R19_PARAMETR: Shablon2<PR19> = {
  no: 19,
  prototip:
    'Параметр, графический метод: полуокружность и параллельные прямые; окружность и сдвинутая «галочка»; модуль параболы и прямые через начало координат',
  sobrat,
};

/** Для проверки: число решений при данном a (численно). */
export function chisloResheniyR19(p: PR19, a: number): number {
  const korni = (f: (x: number) => number, lo: number, hi: number): number[] => {
    const out: number[] = [];
    const N = 40000;
    const h = (hi - lo) / N;
    let x0 = lo;
    let f0 = f(x0);
    if (Math.abs(f0) < 1e-12) out.push(x0);
    for (let i = 1; i <= N; i += 1) {
      const x1 = lo + i * h;
      const f1 = f(x1);
      if (Math.abs(f1) < 1e-12) out.push(x1);
      else if (f0 * f1 < 0 && Math.abs(f0) > 1e-12) {
        let l = x0;
        let r = x1;
        for (let j = 0; j < 80; j += 1) {
          const m = (l + r) / 2;
          if (f(l) * f(m) <= 0) r = m;
          else l = m;
        }
        out.push((l + r) / 2);
      }
      x0 = x1;
      f0 = f1;
    }
    return out;
  };
  const uniq = (xs: number[]) =>
    xs.sort((u, v) => u - v).filter((x, i, s) => i === 0 || Math.abs(x - s[i - 1]!) > 1e-6);
  if (p.vid === 'polukrug') {
    const k = p.kn / p.kd;
    const R = p.R;
    /* Касание даёт двойной корень: ищем через квадратное уравнение. */
    const A = 1 + k * k;
    const B = 2 * k * a;
    const C = a * a - R * R;
    const D = B * B - 4 * A * C;
    if (D < -1e-9) return 0;
    const xs =
      D < 1e-9 ? [-B / (2 * A)] : [(-B - Math.sqrt(D)) / (2 * A), (-B + Math.sqrt(D)) / (2 * A)];
    return uniq(xs.filter((x) => Math.abs(x) <= R + 1e-9 && k * x + a >= -1e-9)).length;
  }
  if (p.vid === 'okrModul') {
    const R = p.R;
    const xs: number[] = [];
    const D = 2 * R * R - a * a;
    if (D >= -1e-9) {
      const sq = Math.sqrt(Math.max(0, D));
      for (const x of [(-a - sq) / 2, (-a + sq) / 2])
        if (x >= -1e-9) xs.push(Math.max(0, x), -Math.max(0, x));
    }
    return uniq(xs).length;
  }
  const k = p.s * p.s;
  const f = (x: number) => Math.abs(x * x - (k + 1) * x + k) - a * x;
  /* Касания — двойные корни: добавляем корни квадратных уравнений точно. */
  const xs: number[] = [];
  for (const [b1, sign] of [
    [-(k + 1 + a), 1],
    [-(k + 1 - a), -1],
  ] as const) {
    const D = b1 * b1 - 4 * k;
    if (D < -1e-9) continue;
    const sq = Math.sqrt(Math.max(0, D));
    for (const x of [(-b1 - sq) / 2, (-b1 + sq) / 2]) {
      const g = x * x - (k + 1) * x + k;
      if (sign > 0 ? g >= -1e-9 : g <= 1e-9) xs.push(x);
    }
  }
  void korni;
  void f;
  return uniq(xs).length;
}
