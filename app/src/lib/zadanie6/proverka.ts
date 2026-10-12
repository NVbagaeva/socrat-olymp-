/**
 * «Проверь себя» в теории №6: после каждого раздела — задачи с выбором
 * ответа и генератор «Ещё такое же».
 *
 * Компонент и правила общие с теорией единиц №10/№11
 * (components/teoriya/ProverSebya.tsx, lib/teoriya/proverka-server.ts):
 * выбор плиткой, «Проверить», зелёное свечение у верного ответа,
 * подсказка к каждой ошибке. Неверные варианты не придумываются
 * руками: каждый — типичная ошибка (забыли проигрышные билеты, поделили
 * на $P(A)$, поделили на $n$, взяли дисперсию вместо $\sigma$, включили
 * границу при строгом знаке), и к нему привязана своя подсказка — без
 * готового ответа.
 *
 * Числа считаются в целых долях (сотых), поэтому ответ — ровно конечная
 * дробь. Первый экземпляр (seed 0) — числа, подобранные для теории.
 */

import type { Rng } from '../veroyatnost/generator';
import {
  peremeshat,
  type ShablonProverki,
  type VariantZadachi,
  type ZadachaProverki,
} from '../teoriya/proverka-edinic';
import { d } from '../zadanie11/num';

/** Число в $…$: 0{,}35. */
const m = (x: number) => `$${d(Math.round(x * 1e9) / 1e9)}$`;

interface Lozhnyy {
  x: number;
  podskazka: string;
}

/**
 * Варианты: верный и до трёх ошибок с подсказками. Повторы, совпадения с
 * верным и бесконечные дроби (их не бывает в ответе ЕГЭ — плитка выдала
 * бы себя) выбрасываются; если ошибок не хватило, добираются запасные.
 */
function varianty(r: Rng, verno: number, lozhnye: Lozhnyy[]): VariantZadachi[] {
  const okr = (x: number) => Math.round(x * 1e9) / 1e9;
  const konechnoe = (x: number) => Number.isFinite(x) && Math.abs(x * 1e4 - Math.round(x * 1e4)) < 1e-6;
  const byli = new Set([m(okr(verno))]);
  const out: VariantZadachi[] = [{ tekst: m(okr(verno)), verno: true }];
  const zapas: Lozhnyy[] = [
    { x: verno * 2, podskazka: 'Ответ вдвое больше верного: проверьте, не сложено ли что-то дважды.' },
    { x: verno + 0.1, podskazka: 'Пересчитайте по формуле раздела: одно из слагаемых посчитано неверно.' },
    { x: verno / 2, podskazka: 'Ответ вдвое меньше верного: проверьте, на что вы делили.' },
  ];
  for (const l of [...lozhnye, ...zapas]) {
    const t = m(okr(l.x));
    if (!byli.has(t) && konechnoe(l.x) && l.x >= 0) {
      byli.add(t);
      out.push({ tekst: t, verno: false, podskazka: l.podskazka });
    }
    if (out.length === 4) break;
  }
  return peremeshat(r, out);
}

/** Вероятности в сотых: n штук, кратные 5, в сумме 100. */
function sotye(r: Rng, n: number): number[] {
  for (;;) {
    const cuts = Array.from({ length: n - 1 }, () => r.int(1, 19)).sort((a, b) => a - b);
    const parts = [...cuts, 20].map((c, i) => (c - (i === 0 ? 0 : (cuts[i - 1] as number))) * 5);
    if (parts.every((p) => p > 0)) return parts;
  }
}

const pz = (ps: readonly number[]) => ps.map((p) => d(p / 100));

/* ── 1. Распределение ─────────────────────────────────────────────── */

const RASPREDELENIE: ShablonProverki[] = [
  {
    id: 'r6-propushchennaya',
    tip: 'skolko',
    sozdat(r, nomer) {
      const xs = nomer === 0 ? [0, 1, 2, 3] : [0, 1, 2, 3, 4].slice(0, r.int(3, 5));
      const ps = nomer === 0 ? [10, 30, 40, 20] : sotye(r, xs.length);
      const k = nomer === 0 ? 2 : r.int(0, xs.length - 1);
      const verno = ps[k] as number;
      const izv = ps.reduce((s, p, i) => (i === k ? s : s + p), 0);
      const niz = pz(ps).map((p, i) => (i === k ? 'p' : p));
      return {
        uslovie: `Случайная величина задана распределением $X\\sim\\begin{pmatrix}${xs.join('&')}\\\\${niz.join('&')}\\end{pmatrix}$. Найдите $p$.`,
        varianty: varianty(r, verno / 100, [
          {
            x: izv / 100,
            podskazka: 'Это сумма известных вероятностей. А $p$ дополняет её до единицы.',
          },
          {
            x: 1 / xs.length,
            podskazka:
              'Вероятности не обязаны быть одинаковыми: используйте, что их сумма равна $1$.',
          },
          {
            x: (verno + 10) / 100,
            podskazka: 'Сложите все вероятности вместе с $p$ — должна получиться ровно единица.',
          },
        ]),
        razbor: [`Сумма вероятностей равна $1$: $p=1-${d(izv / 100)}=${d(verno / 100)}$.`],
        znachenie: verno / 100,
      };
    },
  },
  {
    id: 'r6-summa',
    tip: 'deystvie',
    sozdat(r, nomer) {
      const ps = nomer === 0 ? [20, 35, 45] : sotye(r, 3);
      const plohie = [
        [ps[0] as number, (ps[1] as number) + 10, ps[2] as number],
        [ps[0] as number, ps[1] as number, (ps[2] as number) + 15],
        [(ps[0] as number) + 5, (ps[1] as number) + 5, ps[2] as number],
      ];
      const t = (q: number[]) => `$${pz(q).join(';\\ ')}$`;
      const out: VariantZadachi[] = [
        { tekst: t(ps), verno: true },
        ...plohie.map((q) => ({
          tekst: t(q),
          verno: false,
          podskazka: `Сложите: получится $${d(q.reduce((a, b) => a + b, 0) / 100)}$, а у распределения сумма вероятностей равна $1$.`,
        })),
      ];
      return {
        uslovie:
          'Какая тройка чисел может быть вероятностями значений $1$, $2$, $3$ случайной величины?',
        varianty: peremeshat(r, out),
        razbor: [`Подходит та, где сумма равна $1$: $${pz(ps).join('+')}=1$.`],
      };
    },
  },
];

/* ── 2. Диаграммы и деревья ───────────────────────────────────────── */

const DIAGRAMMY: ShablonProverki[] = [
  {
    id: 'r6-eiler',
    tip: 'skolko',
    sozdat(r, nomer) {
      const ps = nomer === 0 ? [10, 25, 20, 30, 15] : sotye(r, 5);
      const xs = nomer === 0 ? [1, 3, 1, 2, 3] : ps.map(() => r.int(1, 3));
      const k = nomer === 0 ? 3 : (xs[0] as number);
      /* Нужное значение стоит хотя бы у двух точек — иначе складывать нечего. */
      if (xs.filter((x) => x === k).length < 2) {
        xs[1] = k;
      }
      const idx = xs.map((x, i) => (x === k ? i : -1)).filter((i) => i >= 0);
      const verno = idx.reduce((s, i) => s + (ps[i] as number), 0) / 100;
      const tochki = xs
        .map((x, i) => `$${x}$ (вероятность $${d((ps[i] as number) / 100)}$)`)
        .join(', ');
      return {
        uslovie: `На диаграмме Эйлера пять точек-исходов; значения $X$ и вероятности: ${tochki}. Найдите $P(X=${k})$.`,
        varianty: varianty(r, verno, [
          {
            x: idx.length / 5,
            podskazka:
              'Исходы не равновозможны: у каждой точки своя вероятность — их и складываем.',
          },
          {
            x: idx.reduce((s, i) => s * ((ps[i] as number) / 100), 1),
            podskazka:
              'Вероятности перемножают вдоль ветвей дерева. Здесь событие наступает при любой из точек — складываем.',
          },
          {
            x: 1 - verno,
            podskazka: `Это вероятность того, что $X\\ne${k}$. Возьмите точки, где значение равно $${k}$.`,
          },
        ]),
        razbor: [
          `Значение $${k}$ стоит у ${idx.length} точек: $P(X=${k})=${idx.map((i) => d((ps[i] as number) / 100)).join('+')}=${d(verno)}$.`,
        ],
        znachenie: verno,
      };
    },
  },
  {
    id: 'r6-derevo',
    tip: 'skolko',
    sozdat(r, nomer) {
      const a = nomer === 0 ? 0.6 : r.int(1, 9) / 10;
      const b = nomer === 0 ? 0.4 : r.pick([0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 0.8]);
      const verno = a * b;
      return {
        uslovie: `На пути от корня дерева к исходу $c$ два ребра с вероятностями $${d(a)}$ и $${d(b)}$. Найдите $P(c)$.`,
        varianty: varianty(r, verno, [
          {
            x: a + b,
            podskazka:
              'Вдоль пути вероятности не складывают, а перемножают: оба шага должны случиться друг за другом.',
          },
          {
            x: b,
            podskazka:
              'Последнее ребро — это вероятность второго шага при условии первого. Учтите и первый шаг.',
          },
          { x: 1 - a * b, podskazka: 'Это вероятность того, что исход $c$ не наступит.' },
        ]),
        razbor: [
          `$P(c)=${d(a)}\\cdot${d(b)}=${d(Math.round(verno * 1e9) / 1e9)}$ — произведение вдоль ветви.`,
        ],
        znachenie: verno,
      };
    },
  },
];

/* ── 3. Условная вероятность ──────────────────────────────────────── */

const USLOVNAYA: ShablonProverki[] = [
  {
    id: 'r6-uslovnaya',
    tip: 'skolko',
    sozdat(r, nomer) {
      const [ab, pb, pa] =
        nomer === 0
          ? [0.48, 0.64, 0.8]
          : r.pick([
              [0.12, 0.4, 0.3],
              [0.24, 0.6, 0.48],
              [0.3, 0.5, 0.6],
              [0.18, 0.45, 0.36],
              [0.2, 0.8, 0.25],
              [0.14, 0.35, 0.28],
              [0.36, 0.48, 0.45],
            ] as const);
      return {
        uslovie: `Известно: $P(A\\cap B)=${d(ab)}$, $P(A)=${d(pa)}$, $P(B)=${d(pb)}$. Найдите $P(A\\mid B)$.`,
        varianty: varianty(r, ab / pb, [
          {
            x: ab / pa,
            podskazka:
              'Вы поделили на $P(A)$ — это $P(B\\mid A)$. Делим на вероятность того, что стоит после черты.',
          },
          {
            x: ab,
            podskazka:
              'Это вероятность того, что наступят оба события. Условие $B$ «сужает мир» — поделите на $P(B)$.',
          },
          {
            x: pa * pb,
            podskazka:
              'Произведение вероятностей — это не условная вероятность. Используйте $P(A\\mid B)=\\dfrac{P(A\\cap B)}{P(B)}$.',
          },
        ]),
        razbor: [
          `$P(A\\mid B)=\\dfrac{P(A\\cap B)}{P(B)}=\\dfrac{${d(ab)}}{${d(pb)}}=${d(Math.round((ab / pb) * 1e9) / 1e9)}$.`,
        ],
        znachenie: ab / pb,
      };
    },
  },
  {
    id: 'r6-uslovnaya-ba',
    tip: 'skolko',
    sozdat(r, nomer) {
      const [ab, pb, pa] =
        nomer === 0
          ? [0.24, 0.6, 0.4]
          : r.pick([
              [0.12, 0.3, 0.4],
              [0.3, 0.6, 0.5],
              [0.06, 0.15, 0.24],
              [0.21, 0.42, 0.35],
              [0.16, 0.2, 0.64],
              [0.09, 0.12, 0.36],
            ] as const);
      return {
        uslovie: `Известно: $P(A\\cap B)=${d(ab)}$, $P(A)=${d(pa)}$, $P(B)=${d(pb)}$. Найдите $P(B\\mid A)$.`,
        varianty: varianty(r, ab / pa, [
          {
            x: ab / pb,
            podskazka: 'Это $P(A\\mid B)$. Здесь условие — событие $A$: делим на $P(A)$.',
          },
          { x: ab, podskazka: 'Не забудьте поделить на вероятность условия.' },
          { x: pb, podskazka: 'Это вероятность $B$ без всякого условия.' },
        ]),
        razbor: [
          `$P(B\\mid A)=\\dfrac{P(A\\cap B)}{P(A)}=\\dfrac{${d(ab)}}{${d(pa)}}=${d(Math.round((ab / pa) * 1e9) / 1e9)}$.`,
        ],
        znachenie: ab / pa,
      };
    },
  },
];

/* ── 4. Ожидание ──────────────────────────────────────────────────── */

const OZHIDANIE: ShablonProverki[] = [
  {
    id: 'r6-e',
    tip: 'skolko',
    sozdat(r, nomer) {
      const xs = nomer === 0 ? [0, 1, 2, 3] : [r.int(-2, 1), r.int(2, 4), r.int(5, 9)];
      const ps = nomer === 0 ? [10, 30, 40, 20] : sotye(r, 3);
      const e = xs.reduce((s, x, i) => s + x * (ps[i] as number), 0) / 100;
      return {
        uslovie: `$X\\sim\\begin{pmatrix}${xs.join('&')}\\\\${pz(ps).join('&')}\\end{pmatrix}$. Найдите $E(X)$.`,
        varianty: varianty(r, e, [
          {
            x: xs.reduce((s, x) => s + x, 0) / xs.length,
            podskazka:
              'Это среднее значений без учёта вероятностей. Каждое значение умножьте на его вероятность.',
          },
          {
            x: xs.reduce((s, x) => s + x, 0),
            podskazka: 'Сложили значения. Нужна сумма произведений $x_ip_i$.',
          },
          {
            x: e + 0.5,
            podskazka:
              'Проверьте строку $x_ip_i$: умножьте каждое значение на вероятность и сложите.',
          },
        ]),
        razbor: [
          `$E(X)=${xs.map((x, i) => (x === 1 ? d((ps[i] as number) / 100) : `${x < 0 ? `(${x})` : x}\\cdot${d((ps[i] as number) / 100)}`)).join('+')}=${d(Math.round(e * 1e9) / 1e9)}$.`,
        ],
        znachenie: e,
      };
    },
  },
  {
    id: 'r6-loteraya',
    tip: 'skolko',
    sozdat(r, nomer) {
      const N = nomer === 0 ? 1000 : r.pick([500, 1000, 2000, 5000]);
      const w = nomer === 0 ? 100 : r.pick([50, 100, 200, 500]);
      const c = nomer === 0 ? 30 : r.pick([10, 20, 25, 40, 50]);
      const e = (w * c) / N;
      return {
        uslovie: `Выпущено ${N} лотерейных билетов, из них ${c} выигрывают по ${w} рублей, остальные — ничего. Найдите математическое ожидание выигрыша на один билет.`,
        varianty: varianty(r, e, [
          {
            x: w,
            podskazka:
              'Это выигрыш одного выигрышного билета. Большинство билетов ничего не выигрывают — их тоже учитываем.',
          },
          {
            x: (w * c) / (N - c),
            podskazka: 'Поделили на число проигрышных билетов. Делим на число всех билетов.',
          },
          {
            x: w * c,
            podskazka: 'Это сумма всех выигрышей. Осталось поделить её на число билетов.',
          },
        ]),
        razbor: [
          `$E=\\dfrac{${w}\\cdot${c}}{${N}}=${d(e)}$ — сумма выигрышей делится на все билеты.`,
        ],
        znachenie: e,
      };
    },
  },
];

/* ── 5. Дисперсия ─────────────────────────────────────────────────── */

const DISPERSIYA: ShablonProverki[] = [
  {
    id: 'r6-d',
    tip: 'skolko',
    sozdat(r, nomer) {
      const e = nomer === 0 ? 3 : r.int(1, 6);
      const d0 = nomer === 0 ? 0.8 : r.pick([0.5, 0.8, 1.2, 1.5, 2, 2.4, 3]);
      const e2 = e * e + d0;
      return {
        uslovie: `Известно: $E(X)=${d(e)}$, $E(X^2)=${d(Math.round(e2 * 1e9) / 1e9)}$. Найдите $D(X)$.`,
        varianty: varianty(r, d0, [
          {
            x: e2 - e,
            podskazka:
              'Вычитают квадрат среднего, а не само среднее: $D=E(X^2)-\\left(E(X)\\right)^2$.',
          },
          { x: e2, podskazka: 'Это среднее квадрата. Из него нужно вычесть квадрат среднего.' },
          { x: e2 + e * e, podskazka: 'Квадрат среднего вычитают, а не прибавляют.' },
        ]),
        razbor: [
          `$D(X)=E(X^2)-\\left(E(X)\\right)^2=${d(Math.round(e2 * 1e9) / 1e9)}-${d(e)}^2=${d(d0)}$.`,
        ],
        znachenie: d0,
      };
    },
  },
  {
    id: 'r6-sigma',
    tip: 'skolko',
    sozdat(r, nomer) {
      const s = nomer === 0 ? 1.5 : r.pick([0.4, 0.5, 0.6, 0.8, 1.2, 1.4, 2.5, 3, 0.9]);
      const D = Math.round(s * s * 1e6) / 1e6;
      return {
        uslovie: `Дисперсия случайной величины равна $${d(D)}$. Найдите стандартное отклонение.`,
        varianty: varianty(r, s, [
          { x: D, podskazka: 'Это сама дисперсия. Стандартное отклонение — корень из неё.' },
          { x: D / 2, podskazka: 'Корень — не половина: $\\sigma\\cdot\\sigma=D$.' },
          { x: D * D, podskazka: 'Возвели в квадрат, а нужно извлечь корень.' },
        ]),
        razbor: [`$\\sigma=\\sqrt{${d(D)}}=${d(s)}$.`],
        znachenie: s,
      };
    },
  },
];

/* ── 6. Выборка ───────────────────────────────────────────────────── */

const VYBORKA: ShablonProverki[] = [
  {
    id: 'r6-n-1',
    tip: 'skolko',
    sozdat(r, nomer) {
      const n = nomer === 0 ? 4 : r.int(4, 7);
      const s2 = nomer === 0 ? 2.79 : r.int(10, 400) / 100;
      const S = Math.round(s2 * (n - 1) * 100) / 100;
      return {
        uslovie: `В выборке ${n} значений; сумма квадратов их отклонений от выборочного среднего равна $${d(S)}$. Найдите несмещённую оценку дисперсии.`,
        varianty: varianty(r, S / (n - 1), [
          { x: S / n, podskazka: `Поделили на $n=${n}$. Несмещённая оценка — деление на $n-1$.` },
          { x: S, podskazka: 'Сумму квадратов ещё нужно поделить на $n-1$.' },
          { x: S / (n + 1), podskazka: 'Делим на $n-1$, а не на $n+1$.' },
        ]),
        razbor: [`$S^2=\\dfrac{${d(S)}}{${n}-1}=${d(Math.round((S / (n - 1)) * 1e9) / 1e9)}$.`],
        znachenie: S / (n - 1),
      };
    },
  },
  {
    id: 'r6-srednee',
    tip: 'skolko',
    sozdat(r, nomer) {
      const xs =
        nomer === 0 ? [2, 4.9, 1, 3.1] : Array.from({ length: 4 }, () => r.int(10, 80) / 10);
      const sum = Math.round(xs.reduce((a, b) => a + b, 0) * 10) / 10;
      return {
        uslovie: `Выборка: $${xs.map((x) => d(x)).join(';\\ ')}$. Найдите выборочное среднее.`,
        varianty: varianty(r, sum / 4, [
          {
            x: sum / 3,
            podskazka:
              'На $n-1$ делят сумму квадратов отклонений, а среднее — это сумма, делённая на $n$.',
          },
          { x: sum, podskazka: 'Это сумма значений. Поделите её на число значений.' },
          {
            x: (Math.max(...xs) + Math.min(...xs)) / 2,
            podskazka:
              'Это середина между наибольшим и наименьшим. Нужна сумма всех значений, делённая на их число.',
          },
        ]),
        razbor: [`$\\overline{x}=\\dfrac{${d(sum)}}{4}=${d(Math.round((sum / 4) * 1e9) / 1e9)}$.`],
        znachenie: sum / 4,
      };
    },
  },
];

/* ── 7. Чебышёв ───────────────────────────────────────────────────── */

const CHEBYSHEV: ShablonProverki[] = [
  {
    id: 'r6-cheb',
    tip: 'skolko',
    sozdat(r, nomer) {
      const E = nomer === 0 ? 6 : r.int(5, 30);
      const eps = nomer === 0 ? 2 : r.pick([2, 4, 5]);
      const D =
        nomer === 0 ? 1 : r.pick([0.4, 0.8, 1, 1.2, 2]) * (eps === 2 ? 1 : eps === 4 ? 4 : 5);
      const otv = D / (eps * eps);
      return {
        uslovie: `$E(X)=${E}$, $D(X)=${d(D)}$. Какую оценку вероятности события «$X\\leqslant${E - eps}$ или $X\\geqslant${E + eps}$» даёт неравенство Чебышёва?`,
        varianty: varianty(r, otv, [
          { x: D / eps, podskazka: 'В знаменателе — квадрат отклонения: $\\varepsilon^2$.' },
          {
            x: D / (4 * eps * eps),
            podskazka: `Отклонение от среднего — $${eps}$, а не $${2 * eps}$: каждая граница отстоит от $E(X)$ на $${eps}$.`,
          },
          {
            x: (eps * eps) / D / 10,
            podskazka: 'Дисперсию делят на $\\varepsilon^2$, а не наоборот.',
          },
        ]),
        razbor: [
          `$\\varepsilon=${eps}$: $P\\leqslant\\dfrac{${d(D)}}{${eps}^2}=${d(Math.round(otv * 1e9) / 1e9)}$.`,
        ],
        znachenie: otv,
      };
    },
  },
  {
    id: 'r6-eps',
    tip: 'skolko',
    sozdat(r, nomer) {
      const E = nomer === 0 ? 6 : r.int(5, 40);
      const eps = nomer === 0 ? 2 : r.int(2, Math.min(9, E - 1));
      return {
        uslovie: `$E(X)=${E}$. Чему равно $\\varepsilon$ в событии «$X\\leqslant${E - eps}$ или $X\\geqslant${E + eps}$»?`,
        varianty: varianty(r, eps, [
          {
            x: 2 * eps,
            podskazka:
              'Это расстояние между границами. $\\varepsilon$ — отклонение от среднего до одной границы.',
          },
          {
            x: E + eps,
            podskazka: 'Это сама граница. Найдите, на сколько она отстоит от среднего.',
          },
          {
            x: eps * eps,
            podskazka:
              'Квадрат понадобится в знаменателе оценки, а $\\varepsilon$ — само отклонение.',
          },
        ]),
        razbor: [`$${E + eps}-${E}=${eps}$ и $${E}-${E - eps}=${eps}$: $\\varepsilon=${eps}$.`],
        znachenie: eps,
      };
    },
  },
];

/* ── 8. Промежуток ────────────────────────────────────────────────── */

const PROMEZHUTOK: ShablonProverki[] = [
  {
    id: 'r6-promezhutok',
    tip: 'skolko',
    sozdat(r, nomer) {
      const ps = nomer === 0 ? [20, 15, 5, 25, 10, 25] : sotye(r, 6);
      const xs = [1, 2, 3, 4, 5, 6];
      const a = nomer === 0 ? 3 : r.int(1, 3);
      const b = nomer === 0 ? 6 : r.int(a + 2, 6);
      const zl = nomer === 0 ? '<' : r.pick(['<', '\\leqslant ']);
      const zr = nomer === 0 ? '<' : r.pick(['<', '\\leqslant ']);
      const vh = (x: number) => (zl === '<' ? x > a : x >= a) && (zr === '<' ? x < b : x <= b);
      const sum = (f: (x: number) => boolean) =>
        xs.reduce((s, x, i) => (f(x) ? s + (ps[i] as number) : s), 0) / 100;
      return {
        uslovie: `$X\\sim\\begin{pmatrix}${xs.join('&')}\\\\${pz(ps).join('&')}\\end{pmatrix}$. Найдите $P(${a}${zl}X${zr}${b})$.`,
        varianty: varianty(r, sum(vh), [
          {
            x: sum((x) => x >= a && x <= b),
            podskazka: 'Вы взяли обе границы. При строгом знаке граница не входит.',
          },
          {
            x: sum((x) => x > a && x < b),
            podskazka: 'Вы выбросили обе границы. При знаке $\\leqslant$ граница входит.',
          },
          {
            x: 1 - sum(vh),
            podskazka: 'Это вероятность того, что значение не попадёт в промежуток.',
          },
          {
            x: sum((x) => vh(x) && x !== xs.find(vh)),
            podskazka: 'Проверьте каждое значение по порядку: одно из подходящих пропущено.',
          },
          { x: sum((x) => x > a), podskazka: 'Учтите и правую границу промежутка.' },
        ]),
        razbor: [
          `Подходят значения ${xs
            .filter(vh)
            .map((x) => `$${x}$`)
            .join(', ')}: сумма их вероятностей — $${d(sum(vh))}$.`,
        ],
        znachenie: sum(vh),
      };
    },
  },
];

/* ── 9. Ловушки ───────────────────────────────────────────────────── */

const LOVUSHKI: ShablonProverki[] = [
  {
    id: 'r6-lov-bilety',
    tip: 'skolko',
    sozdat(r, nomer) {
      const N = nomer === 0 ? 2000 : r.pick([1000, 2000, 4000, 5000]);
      const w = nomer === 0 ? [100, 500] : [r.pick([50, 100, 200]), r.pick([500, 1000])];
      const c = nomer === 0 ? [40, 8] : [r.pick([20, 40, 50]), r.pick([2, 4, 5])];
      const S = (w[0] as number) * (c[0] as number) + (w[1] as number) * (c[1] as number);
      return {
        uslovie: `Выпущено ${N} билетов: ${c[0]} выигрывают по ${w[0]} рублей, ${c[1]} — по ${w[1]} рублей. Найдите ожидаемый выигрыш на один билет.`,
        varianty: varianty(r, S / N, [
          {
            x: S / ((c[0] as number) + (c[1] as number)),
            podskazka:
              'Поделили только на выигрышные билеты. Проигрышные — тоже значение величины: выигрыш $0$.',
          },
          {
            x: ((w[0] as number) + (w[1] as number)) / 2,
            podskazka: 'Это среднее двух выигрышей без учёта числа билетов.',
          },
          {
            x: S / N / 10,
            podskazka: 'Проверьте деление: сумма выигрышей делится на число всех билетов.',
          },
        ]),
        razbor: [`Сумма выигрышей $${S}$ делится на все $${N}$ билетов: $E=${d(S / N)}$.`],
        znachenie: S / N,
      };
    },
  },
  {
    id: 'r6-lov-strogiy',
    tip: 'skolko',
    sozdat(r, nomer) {
      const ps = nomer === 0 ? [10, 20, 30, 25, 15] : sotye(r, 5);
      const k = nomer === 0 ? 4 : r.int(2, 5);
      const vh = ps.slice(0, k - 1).reduce((a, b) => a + b, 0) / 100;
      return {
        uslovie: `$X\\sim\\begin{pmatrix}1&2&3&4&5\\\\${pz(ps).join('&')}\\end{pmatrix}$. Найдите $P(X<${k})$.`,
        varianty: varianty(r, vh, [
          {
            x: vh + (ps[k - 1] as number) / 100,
            podskazka: `Знак строгий: значение $${k}$ не входит.`,
          },
          { x: 1 - vh, podskazka: `Это $P(X\\geqslant${k})$.` },
          {
            x: (ps[k - 1] as number) / 100,
            podskazka: `Это вероятность самого значения $${k}$, а нужны значения меньше него.`,
          },
        ]),
        razbor: [`Меньше $${k}$ — значения от $1$ до $${k - 1}$: $P=${d(vh)}$.`],
        znachenie: vh,
      };
    },
  },
];

export const NABORY_PROVERKI_6: Record<string, readonly ShablonProverki[]> = {
  raspredelenie: RASPREDELENIE,
  diagrammy: DIAGRAMMY,
  uslovnaya: USLOVNAYA,
  ozhidanie: OZHIDANIE,
  dispersiya: DISPERSIYA,
  vyborka: VYBORKA,
  chebyshev: CHEBYSHEV,
  promezhutok: PROMEZHUTOK,
  lovushki: LOVUSHKI,
};

export type { ZadachaProverki };
