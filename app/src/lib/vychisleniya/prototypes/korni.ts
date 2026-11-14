/**
 * Группа I, корни: 8.B, 8.E, 8.F, 8.G.
 */

import { gcd, isSquare, nice, round9, simpRoot } from '../numbers';
import { CDOT, coefRoot, d, frac, fracExp, pw, root } from '../tex';
import type { Draft, Priznak, Prototype, Shag } from '../types';
import type { Rng } from '../rng';
import { keys, naydi, nonSquare, podtip, priznakiDlya, shag, tenth } from './common';

/* ── Шаги, общие для корней ───────────────────────────────────── */

/** Решение задачи: шаги и признаки делимости, если они нужны. */
type Reshenie = Pick<Draft, 'razbor' | 'delimost'>;

function reshenie(razbor: Shag[], g: number[] = []): Reshenie {
  const delimost = [...new Set(g.flatMap((x) => priznakiDlya(x)))] as Priznak[];
  return delimost.length === 0 ? { razbor } : { razbor, delimost };
}

/** Наименьшее общее кратное. */
function nok(a: number, b: number): number {
  return (a / gcd(a, b)) * b;
}

/** Показатель e, если x = base^e (e ≥ 1), иначе null. */
function pokazatel(x: number, base: number): number | null {
  let e = 0;
  let v = 1;
  while (v < x) {
    v *= base;
    e += 1;
  }
  return v === x && e >= 1 ? e : null;
}

/** Степень в записи: показатель 1 не пишется. */
function stepen(base: number, e: number): string {
  return e === 1 ? String(base) : pw(String(base), String(e));
}

/** Произведение множителей без единиц: 9 \cdot 3; одни единицы — 1. */
function proizv(xs: number[]): string {
  const rest = xs.filter((x) => x !== 1);
  return rest.length === 0 ? '1' : rest.join(' \\cdot ');
}

/** Дробь из произведения: \dfrac{9 \cdot 3}{4}; знаменатель 1 — без дроби. */
function drobProizv(xs: number[], den: number): string {
  return den === 1 ? proizv(xs) : `\\dfrac{${proizv(xs)}}{${den}}`;
}

/**
 * Почему n делится на g, если это не видно из таблицы умножения:
 * признак делимости на 3 (на 6, на 9) по сумме цифр.
 */
function pochemuDelitsya(n: number, g: number): string | null {
  if (n < 40 || (g !== 3 && g !== 6 && g !== 9)) {
    return null;
  }
  /* Из таблицы умножения делимость видна и так: 63 = 7 · 9. */
  for (let i = 1; i <= 10; i += 1) {
    if (n % i === 0 && n / i <= 10 && (i % g === 0 || (n / i) % g === 0)) {
      return null;
    }
  }
  const digits = String(n).split('');
  const sum = digits.reduce((s, x) => s + Number(x), 0);
  const rule = `сумма цифр $${digits.join(' + ')} = ${sum}$ делится на $${g === 9 ? 9 : 3}$`;
  return g === 6
    ? `$${n}$ делится на $6$: оно чётное, а ${rule}`
    : `$${n}$ делится на $${g}$: ${rule}`;
}

/** Сокращение дроби a·b / c, не перемножая числитель. */
interface Sokrashchenie {
  /** Цепочка записей: исходная дробь, после каждого сокращения. */
  formy: string[];
  /** Подпись шага: что на что сокращаем и почему. */
  chto: string;
  /** Множители, сокращение на которые держится на признаке делимости. */
  g: number[];
  /** Что осталось в числителе и в знаменателе. */
  xs: number[];
  den: number;
}

/**
 * Сокращаем a·b / c по множителям: сначала тот множитель числителя, у
 * которого с c общий делитель больше, потом второй — с тем, что от c
 * осталось. Так сокращение видно, и большое произведение не нужно.
 */
function sokrashchaem(a: number, b: number, c: number): Sokrashchenie {
  const xs = [a, b];
  const formy = [drobProizv(xs, c)];
  const chasti: string[] = [];
  const notes: string[] = [];
  const g: number[] = [];
  let den = c;
  const order = gcd(b, c) > gcd(a, c) ? [1, 0] : [0, 1];
  for (const i of order) {
    const x = xs[i] as number;
    const k = gcd(x, den);
    if (k === 1) {
      continue;
    }
    chasti.push(x === den ? `одинаковый множитель $${x}$` : `$${x}$ и $${den}$ — на $${k}$`);
    for (const n of [x, den]) {
      const why = pochemuDelitsya(n, k);
      if (why !== null) {
        notes.push(why);
        g.push(k);
      }
    }
    xs[i] = x / k;
    den /= k;
    formy.push(drobProizv(xs, den));
  }
  const first = chasti[0] ?? '';
  const head = first.startsWith('одинаковый')
    ? `Не перемножаем, а сокращаем ${first}`
    : `Не перемножаем, а сокращаем: ${first}`;
  const tail = chasti.length > 1 ? `, затем ${chasti[1] as string}` : '';
  const why = notes.length === 0 ? '' : `. ${notes.join('; ')}`;
  return { formy, chto: `${head}${tail}${why}`, g, xs, den };
}

/** Произведение без единиц и его значение: «9 \cdot 3 = 27» или «27». */
function sProizvedeniem(xs: number[]): string {
  const rest = xs.filter((x) => x !== 1);
  const value = xs.reduce((s, x) => s * x, 1);
  return rest.length > 1 ? `${proizv(xs)} = ${value}` : String(value);
}

/**
 * Последний шаг: дробь num/den — в десятичную. Делить на 2 — пополам,
 * на 10 и 100 — перенос запятой, остальные знаменатели доводим до 10
 * или 100. multiply — начало подписи, если числитель ещё произведение.
 */
function vDesyatichnuyu(xs: number[], den: number, ans: number, multiply: string): Shag {
  const num = xs.reduce((s, x) => s * x, 1);
  const multi = xs.filter((x) => x !== 1).length > 1;
  const chain = [drobProizv(xs, den), ...(multi ? [`\\dfrac{${num}}{${den}}`] : [])];
  const t = [10, 100, 1000].find((x) => x % den === 0) ?? 0;
  const znaki = t === 10 ? 'один знак' : t === 100 ? 'два знака' : 'три знака';
  const zapyataya = `деление на $${t}$ — это перенос запятой на ${znaki} влево`;
  if (den === 2) {
    return shag(
      multi ? `${multiply} и делим на $2$` : 'Делим числитель на $2$',
      `${chain.join(' = ')} = ${d(ans)}`,
    );
  }
  if (t === den) {
    return shag(
      multi ? `${multiply}, а ${zapyataya}` : `Д${zapyataya.slice(1)}`,
      `${chain.join(' = ')} = ${d(ans)}`,
    );
  }
  return shag(
    `${multi ? `${multiply} и доводим` : 'Доводим'} знаменатель до $${t}$: умножаем числитель и знаменатель на $${t / den}$, а ${zapyataya}`,
    `${chain.join(' = ')} = \\dfrac{${num * (t / den)}}{${t}} = ${d(ans)}`,
  );
}

/* ── 8.B  квадрат произведения с корнем, раскрытие скобок ─────── */

const E_LIST = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25];

/** (c√d)² / e: квадрат — без корня, дальше сокращаем, не перемножая. */
function razborSq(c: number, dd: number, e: number, ans: number): Reshenie {
  const c2 = c * c;
  const steps: Shag[] = [
    shag(
      'Квадрат произведения — произведение квадратов, а квадрат корня равен подкоренному числу: $(a\\sqrt{b})^2 = a^2 \\cdot b$',
      `(${c}\\sqrt{${dd}})^2 = ${pw(String(c), '2')} \\cdot (\\sqrt{${dd}})^{2} = ${c2} \\cdot ${dd}`,
    ),
  ];
  if (e === 10 && !Number.isInteger(ans)) {
    steps.push(vDesyatichnuyu([c2, dd], e, ans, 'Перемножаем числитель'));
    return reshenie(steps);
  }
  const s = sokrashchaem(c2, dd, e);
  if (s.formy.length === 1) {
    steps.push(
      vDesyatichnuyu(
        [c2, dd],
        e,
        ans,
        'Общих множителей у числителя и знаменателя нет — перемножаем числитель',
      ),
    );
    return reshenie(steps);
  }
  if (s.den === 1) {
    const formy = s.formy.slice(0, -1);
    steps.push(shag(s.chto, `${[...formy, sProizvedeniem(s.xs)].join(' = ')}`));
    return reshenie(steps, s.g);
  }
  steps.push(shag(s.chto, s.formy.join(' = ')));
  steps.push(vDesyatichnuyu(s.xs, s.den, ans, 'Перемножаем оставшееся'));
  return reshenie(steps, s.g);
}

/** (√p ± √q)·√p, p = k²·rr, q = l²·rr: выносим множители из-под корня. */
function razborBrackets(k: number, l: number, rr: number, sign: string, ans: number): Shag[] {
  const p = k * k * rr;
  const q = l * l * rr;
  const m = sign === '-' ? k - l : k + l;
  const vynos = [
    ...(k === 1 ? [] : [`$${p} = ${k * k} \\cdot ${rr}$`]),
    ...(l === 1 ? [] : [`$${q} = ${l * l} \\cdot ${rr}$`]),
  ];
  const kr = coefRoot(k, rr);
  const lr = coefRoot(l, rr);
  const mr = coefRoot(m, rr);
  const factors = [Math.abs(m), k, rr].filter((x) => x !== 1);
  const prod = `${m < 0 ? '-' : ''}${factors.join(' \\cdot ')}`;
  return [
    shag(
      `Выносим множитель из-под корня: $\\sqrt{a^2 b} = a\\sqrt{b}$. Здесь ${vynos.join(', ')}`,
      `(\\sqrt{${p}} ${sign} \\sqrt{${q}}) \\cdot \\sqrt{${p}} = (${kr} ${sign} ${lr}) \\cdot ${kr}`,
    ),
    shag(
      `В скобках подобные слагаемые с одним и тем же корнем $\\sqrt{${rr}}$ — ${
        sign === '-' ? 'вычитаем' : 'складываем'
      } коэффициенты`,
      `(${kr} ${sign} ${lr}) \\cdot ${kr} = ${mr} \\cdot ${kr}`,
    ),
    shag(
      `Квадрат корня равен подкоренному числу: $\\sqrt{${rr}} \\cdot \\sqrt{${rr}} = ${rr}$`,
      `${mr} \\cdot ${kr} = ${factors.length > 1 ? `${prod} = ` : ''}${d(ans)}`,
    ),
  ];
}

function squareB(r: Rng, integer: boolean) {
  const c = r.int(2, 9);
  const dd = nonSquare(r, 2, 49);
  const e = r.pick(E_LIST);
  const ans = round9((c * c * dd) / e);
  if (!nice(ans, 2) || ans > 300 || Number.isInteger(ans) !== integer) {
    return null;
  }
  const tex = `\\dfrac{(${c}\\sqrt{${dd}})^2}{${e}}`;
  return {
    uslovie: naydi(tex),
    otvet: ans,
    ...razborSq(c, dd, e, ans),
    proverka: (c * Math.sqrt(dd)) ** 2 / e,
    signature: `${dd}:${e}`,
    params: { c, d: dd, e },
  };
}

export const P8B: Prototype = {
  id: '8.B',
  group: 'I',
  nazvanie: 'Корни: квадрат и раскрытие скобок',
  podtipy: [
    podtip('sq-int', 'base', (r) => squareB(r, true)),
    podtip('sq-dec', 'advanced', (r) => squareB(r, false)),
    podtip('brackets', 'advanced', (r) => {
      const rr = r.pick([2, 3, 5, 6, 7, 10]);
      const k = r.int(1, 6);
      const l = r.int(1, 6);
      if (k === l) {
        return null;
      }
      const p = k * k * rr;
      const q = l * l * rr;
      if (p > 99 || q > 99) {
        return null;
      }
      const sign = r.pick(['-', '+']);
      const ans = sign === '-' ? p - k * l * rr : p + k * l * rr;
      const tex = `(\\sqrt{${p}} ${sign} \\sqrt{${q}}) \\cdot \\sqrt{${p}}`;
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: razborBrackets(k, l, rr, sign, ans),
        proverka: (Math.sqrt(p) + (sign === '-' ? -1 : 1) * Math.sqrt(q)) * Math.sqrt(p),
        signature: `${rr}:${k}:${l}`,
        params: { p, q, sign },
      };
    }),
  ],
  isklyucheniya: keys([
    { c: 3, d: 8, e: 6 },
    { c: 5, d: 6, e: 10 },
    { c: 6, d: 2, e: 8 },
    { c: 2, d: 7, e: 4 },
    { p: 12, q: 75, sign: '-' },
    { p: 63, q: 28, sign: '-' },
    { p: 32, q: 50, sign: '-' },
    { p: 75, q: 27, sign: '-' },
  ]),
};

/* ── 8.E  корни разных степеней от одного числа ──────────────── */

function isPower(x: number, n: number): boolean {
  const rt = Math.round(x ** (1 / n));
  return rt ** n === x;
}

/** Суммы 1/a + 1/b − 1/c, дающие «хороший» показатель. */
const SUMS: { value: number; xs: number[]; pow: number }[] = [
  { value: 0, xs: [2, 3, 5, 6, 7, 10, 11, 13, 16, 81], pow: 0 },
  { value: 1 / 2, xs: [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144], pow: 1 / 2 },
  { value: 1 / 3, xs: [8, 27, 64, 125, 216, 343], pow: 1 / 3 },
  { value: 1 / 4, xs: [16, 81, 625], pow: 1 / 4 },
  { value: 1, xs: [2, 3, 5, 6, 7, 10, 11, 13], pow: 1 },
  { value: 2 / 3, xs: [8, 27, 64, 125], pow: 2 / 3 },
];

/** Тройки степеней (a, b, c) с 1/a + 1/b − 1/c из списка SUMS. */
const MIXED: { a: number; b: number; c: number; sum: (typeof SUMS)[number] }[] = [];
for (let a = 2; a <= 15; a += 1) {
  for (let b = 2; b <= 15; b += 1) {
    for (let c = 2; c <= 30; c += 1) {
      if (new Set([a, b, c]).size < 3) {
        continue;
      }
      const s = 1 / a + 1 / b - 1 / c;
      const sum = SUMS.find((item) => Math.abs(item.value - s) < 1e-9);
      if (sum !== undefined) {
        MIXED.push({ a, b, c, sum });
      }
    }
  }
}

/** Корень и степень с одним показателем снимают друг друга. */
const KOREN_STEPENI =
  'Корень и степень с одинаковым показателем снимают друг друга: $\\sqrt[n]{a^{n}} = a$';

/**
 * Корень n-й степени из произведения xs, равного k^n: множители —
 * степени одного числа, показатели складываются, корень снимает
 * степень. Если оба множителя — степени k, хватает одного шага; иначе
 * идём через простое p (k = p^s) и потом собираем p^{sn} = (p^s)^n.
 */
function kornIzStepeni(n: number, xs: number[], k: number): Shag[] {
  const rest = xs.filter((x) => x !== 1);
  const under = root(n, proizv(rest));
  const T = k ** n;
  if (rest.length === 1) {
    return [
      shag(
        `Узнаём под корнем степень: $${T} = ${pw(String(k), String(n))}$. ${KOREN_STEPENI}`,
        `${under} = ${root(n, pw(String(k), String(n)))} = ${k}`,
      ),
    ];
  }
  const [P, Q] = rest as [number, number];
  const p = [2, 3, 5].find((x) => k % x === 0) as number;
  const base = pokazatel(P, k) !== null && pokazatel(Q, k) !== null ? k : p;
  const eP = pokazatel(P, base) as number;
  const eQ = pokazatel(Q, base) as number;
  const spisok = [P, Q]
    .map((x, i) => [x, i === 0 ? eP : eQ] as const)
    .filter(([x, e], i) => e > 1 && !(i === 1 && x === P))
    .map(([x, e]) => `$${x} = ${pw(String(base), String(e))}$`)
    .join(', ');
  const sum = `${root(n, `${stepen(base, eP)} \\cdot ${stepen(base, eQ)}`)} = ${root(n, pw(String(base), String(eP + eQ)))}`;
  if (base === k) {
    return [
      shag(
        `Под корнем — степени числа $${k}$: ${spisok}. При умножении показатели складываются, а ${KOREN_STEPENI.charAt(0).toLowerCase()}${KOREN_STEPENI.slice(1)}`,
        `${under} = ${sum} = ${k}`,
      ),
    ];
  }
  const s = pokazatel(k, p) as number;
  return [
    shag(
      `Под корнем — степени числа $${p}$: ${spisok}. При умножении показатели складываются`,
      `${under} = ${sum}`,
    ),
    shag(
      `Записываем $${pw(String(p), String(eP + eQ))} = (${pw(String(p), String(s))})^{${n}}$: степень в степени — показатели перемножаются, $${s} \\cdot ${n} = ${eP + eQ}$. ${KOREN_STEPENI}`,
      `${root(n, pw(String(p), String(eP + eQ)))} = ${root(n, `(${pw(String(p), String(s))})^{${n}}`)} = ${pw(String(p), String(s))} = ${k}`,
    ),
  ];
}

/** ⁿ√a · ⁿ√b / ⁿ√c: под один корень, сокращаем, узнаём степень. */
function razborSameIndex(n: number, a: number, b: number, c: number, k: number): Reshenie {
  const s = sokrashchaem(a, b, c);
  const formy = s.formy.map((f) => root(n, f));
  return reshenie(
    [
      shag(
        'Корни одной степени собираем под один корень: $\\sqrt[n]{a} \\cdot \\sqrt[n]{b} = \\sqrt[n]{ab}$ и $\\dfrac{\\sqrt[n]{a}}{\\sqrt[n]{b}} = \\sqrt[n]{\\dfrac{a}{b}}$',
        `\\dfrac{${root(n, String(a))} \\cdot ${root(n, String(b))}}{${root(n, String(c))}} = ${formy[0] as string}`,
      ),
      shag(s.chto, formy.join(' = ')),
      ...kornIzStepeni(n, s.xs, k),
    ],
    s.g,
  );
}

/** Степень x^{num/den} в записи: целый показатель — без дроби. */
function xPow(x: number, num: number, den: number): string {
  return pw(String(x), num % den === 0 ? String(num / den) : fracExp(num, den));
}

/** ᵃ√x · ᵇ√x / ᶜ√x: степени с дробным показателем, общий знаменатель. */
function razborMixed(a: number, b: number, c: number, x: number, ans: number): Shag[] {
  const L = nok(nok(a, b), c);
  const num = L / a + L / b - L / c;
  const g = gcd(num, L);
  const pn = num / g;
  const pd = L / g;
  const xs = String(x);
  const sumTex = pw(xs, `\\frac{1}{${a}} + \\frac{1}{${b}} - \\frac{1}{${c}}`);
  const chain = [
    `\\dfrac{${pw(xs, fracExp(1, a))} \\cdot ${pw(xs, fracExp(1, b))}}{${pw(xs, fracExp(1, c))}}`,
    sumTex,
    pw(xs, `\\frac{${L / a} + ${L / b} - ${L / c}}{${L}}`),
    ...(num !== 0 && g !== 1 ? [pw(xs, `\\frac{${num}}{${L}}`)] : []),
    xPow(x, pn, pd),
  ];
  const steps: Shag[] = [
    shag(
      'Записываем корни как степени с дробным показателем: $\\sqrt[n]{a} = a^{\\frac{1}{n}}$',
      `\\dfrac{${root(a, xs)} \\cdot ${root(b, xs)}}{${root(c, xs)}} = ${chain[0] as string}`,
    ),
    shag(
      `Основание одно, поэтому при умножении показатели складываются, а при делении вычитаются. Дроби приводим к общему знаменателю $${L}$`,
      chain.join(' = '),
    ),
  ];
  const last = xPow(x, pn, pd);
  if (pn === 0) {
    steps.push(
      shag('Любое число, кроме нуля, в нулевой степени равно единице', `${last} = ${d(ans)}`),
    );
  } else if (pd === 1) {
    steps.push(shag('Первая степень числа равна самому числу', `${last} = ${d(ans)}`));
  } else {
    /* x = t^pd, ответ t^pn. */
    const t = Math.round(x ** (1 / pd));
    if (pn === 1) {
      steps.push(
        shag(
          `Показатель $${fracExp(1, pd)}$ — это корень: $a^{\\frac{1}{n}} = \\sqrt[n]{a}$, а $${x} = ${pw(String(t), String(pd))}$`,
          `${last} = ${root(pd, xs)} = ${root(pd, pw(String(t), String(pd)))} = ${d(ans)}`,
        ),
      );
    } else {
      steps.push(
        shag(
          `Записываем $${x} = ${pw(String(t), String(pd))}$: степень в степени — показатели перемножаются, $${pd} \\cdot ${fracExp(pn, pd)} = ${pn}$`,
          `${last} = ${pw(`(${pw(String(t), String(pd))})`, fracExp(pn, pd))} = ${pw(String(t), String(pn))} = ${d(ans)}`,
        ),
      );
    }
  }
  return steps;
}

/** ᵃ√x · x · ᵇ√x / ᶜ√x при 1/a + 1/b = 1/c: корни дают ровно ᶜ√x. */
function razborWithFactor(a: number, b: number, c: number, x: number): Shag[] {
  const L = nok(a, b);
  const xs = String(x);
  return [
    shag(
      `Корни из одного числа перемножаем как степени: $\\sqrt[n]{a} = a^{\\frac{1}{n}}$, а при умножении показатели складываются`,
      `${root(a, xs)} \\cdot ${root(b, xs)} = ${pw(xs, `\\frac{1}{${a}} + \\frac{1}{${b}}`)} = ${pw(
        xs,
        `\\frac{${L / a} + ${L / b}}{${L}}`,
      )} = ${pw(xs, `\\frac{${L / a + L / b}}{${L}}`)} = ${pw(xs, fracExp(1, c))} = ${root(c, xs)}`,
    ),
    shag(
      `Получился ровно корень из знаменателя: одинаковые множители $${root(c, xs)}$ в числителе и знаменателе сокращаются`,
      `\\dfrac{${root(c, xs)} \\cdot ${x}}{${root(c, xs)}} = ${d(x)}`,
    ),
  ];
}

/** Пары (a, b) с 1/a + 1/b = 1/c при целом c. */
const WITH_FACTOR: { a: number; b: number; c: number }[] = [];
for (let a = 3; a <= 40; a += 1) {
  for (let b = a + 1; b <= 60; b += 1) {
    const inv = 1 / a + 1 / b;
    const c = Math.round(1 / inv);
    if (c >= 2 && Math.abs(1 / c - inv) < 1e-9) {
      WITH_FACTOR.push({ a, b, c });
    }
  }
}

export const P8E: Prototype = {
  id: '8.E',
  group: 'I',
  nazvanie: 'Корни разных степеней',
  podtipy: [
    podtip('same-index', 'base', (r) => {
      const n = r.pick([3, 4, 5]);
      const k = r.pick([2, 3, 4, 5]);
      const T = k ** n;
      const a = r.int(2, 99);
      const step = T / gcd(a, T);
      if (step > 99) {
        return null;
      }
      const b = step * r.int(1, Math.floor(99 / step));
      if (b < 2 || b > 99) {
        return null;
      }
      const c = (a * b) / T;
      if (c < 2 || c > 99 || new Set([a, b, c]).size < 3) {
        return null;
      }
      if (isPower(a, n) || isPower(b, n) || isPower(c, n)) {
        return null;
      }
      const tex = `\\dfrac{${root(n, String(a))}${CDOT}${root(n, String(b))}}{${root(n, String(c))}}`;
      return {
        uslovie: naydi(tex),
        otvet: k,
        ...razborSameIndex(n, a, b, c, k),
        proverka: (Math.pow(a, 1 / n) * Math.pow(b, 1 / n)) / Math.pow(c, 1 / n),
        signature: `${n}:${k}:${a}`,
        params: { n, a, b, c },
      };
    }),
    podtip('mixed-index', 'advanced', (r) => {
      const { a, b, c, sum: found } = r.pick(MIXED);
      const x = r.pick(found.xs);
      const ans = round9(x ** found.pow);
      if (!Number.isInteger(ans)) {
        return null;
      }
      const tex = `\\dfrac{${root(a, String(x))}${CDOT}${root(b, String(x))}}{${root(c, String(x))}}`;
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: razborMixed(a, b, c, x, ans),
        proverka: Math.pow(x, 1 / a + 1 / b - 1 / c),
        signature: `${x}:${found.value}`,
        params: { a, b, c, x },
      };
    }),
    podtip('with-factor', 'advanced', (r) => {
      const { a, b, c } = r.pick(WITH_FACTOR);
      const x = r.pick([2, 3, 5, 6, 7, 10, 11, 13, 17]);
      const tex = `\\dfrac{${root(a, String(x))} \\cdot ${x} \\cdot ${root(b, String(x))}}{${root(c, String(x))}}`;
      return {
        uslovie: naydi(tex),
        otvet: x,
        razbor: razborWithFactor(a, b, c, x),
        proverka: (Math.pow(x, 1 / a) * x * Math.pow(x, 1 / b)) / Math.pow(x, 1 / c),
        signature: `${x}:${c}:factor`,
        params: { a, b, c, x },
      };
    }),
  ],
  isklyucheniya: keys([
    { n: 4, a: 8, b: 48, c: 24 },
    { n: 5, a: 20, b: 16, c: 10 },
    { n: 3, a: 15, b: 36, c: 20 },
    { a: 3, b: 4, c: 12, x: 121 },
    { a: 3, b: 5, c: 30, x: 36 },
    { a: 6, b: 3, c: 2, x: 81 },
    { a: 20, b: 5, c: 4, x: 16 },
    { a: 15, b: 10, c: 6, x: 5 },
    { a: 28, b: 21, c: 12, x: 3 },
    { a: 40, b: 24, c: 15, x: 10 },
    { a: 36, b: 45, c: 20, x: 17 },
  ]),
};

/* ── 8.F  квадрат суммы или разности корней над знаменателем ─── */

/** c(√a ± √b)² / (m(a+b) ± 2m√(ab)): та же скобка, вынесенная с множителем m. */
function razborF(a: number, b: number, m: number, c: number, sign: string, ans: number): Shag[] {
  const skobka = `${a + b} ${sign} 2\\sqrt{${a * b}}`;
  const denom = `${m * (a + b)} ${sign} ${2 * m}\\sqrt{${a * b}}`;
  const top = c === 1 ? skobka : `${c}(${skobka})`;
  const g = gcd(c, m);
  const ratio = g === 1 ? [] : [frac(c, m)];
  /* Знаменатель 4, 5, 8, 20, 25 доводим до 10, 100 или 1000. */
  const den = m / g;
  const t = [10, 100, 1000].find((x) => x % den === 0) ?? den;
  const dovodim =
    den === 1 || den === 2 || t === den ? [] : [`\\dfrac{${(c / g) * (t / den)}}{${t}}`];
  const value = Number.isInteger(ans) ? [] : [d(ans)];
  return [
    shag(
      sign === '-'
        ? 'Раскрываем квадрат разности: $(x - y)^2 = x^2 - 2xy + y^2$, а квадрат корня равен подкоренному числу'
        : 'Раскрываем квадрат суммы: $(x + y)^2 = x^2 + 2xy + y^2$, а квадрат корня равен подкоренному числу',
      `(\\sqrt{${a}} ${sign} \\sqrt{${b}})^2 = ${a} ${sign} 2\\sqrt{${a}} \\cdot \\sqrt{${b}} + ${b} = ${skobka}`,
    ),
    shag(
      `Ищем ту же скобку в знаменателе: при корне стоит $${2 * m} = ${m} \\cdot 2$, и $${m * (a + b)} = ${m} \\cdot ${a + b}$ — выносим $${m}$ за скобку`,
      `${denom} = ${m}(${skobka})`,
    ),
    shag(
      `Одинаковые скобки в числителе и знаменателе сокращаются — остаются множители перед ними${
        dovodim.length === 0
          ? ''
          : `. Чтобы записать десятичную дробь, доводим знаменатель до $${t}$`
      }`,
      [
        `\\dfrac{${top}}{${m}(${skobka})}`,
        `\\dfrac{${c}}{${m}}`,
        ...ratio,
        ...dovodim,
        ...value,
      ].join(' = '),
    ),
  ];
}

export const P8F: Prototype = {
  id: '8.F',
  group: 'I',
  nazvanie: 'Квадрат суммы корней',
  podtipy: [
    podtip('1', 'advanced', (r) => {
      const a = nonSquare(r, 2, 30);
      const b = nonSquare(r, 2, 40);
      /* Числа под корнями — без квадратных множителей, как и их
         произведение: √20 в условии выглядело бы неупрощённым. */
      if (
        a >= b ||
        a * b > 99 ||
        simpRoot(a).k !== 1 ||
        simpRoot(b).k !== 1 ||
        simpRoot(a * b).k !== 1
      ) {
        return null;
      }
      const m = r.pick([2, 4, 5, 8, 10, 20, 25]);
      const c = r.pick([1, 1, 1, 2, 3, 4]);
      const sign = r.pick(['+', '-']);
      const ans = round9(c / m);
      if (!nice(ans, 3) || c === m) {
        return null;
      }
      const numer = `${c === 1 ? '' : c}(\\sqrt{${a}} ${sign} \\sqrt{${b}})^2`;
      const denom = `${m * (a + b)} ${sign} ${2 * m}\\sqrt{${a * b}}`;
      return {
        uslovie: naydi(`\\dfrac{${numer}}{${denom}}`),
        otvet: ans,
        razbor: razborF(a, b, m, c, sign, ans),
        proverka:
          (c * (Math.sqrt(a) + (sign === '-' ? -1 : 1) * Math.sqrt(b)) ** 2) /
          (m * (a + b) + (sign === '-' ? -1 : 1) * 2 * m * Math.sqrt(a * b)),
        signature: `${a}:${b}`,
        params: { a, b, m, c, sign },
      };
    }),
  ],
  isklyucheniya: keys([
    { a: 5, b: 7, m: 10, c: 1, sign: '+' },
    { a: 3, b: 7, m: 8, c: 1, sign: '+' },
    { a: 3, b: 10, m: 2, c: 1, sign: '-' },
    { a: 2, b: 5, m: 10, c: 1, sign: '-' },
  ]),
};

/* ── 8.G  произведение корней десятичных дробей ──────────────── */

/** √x·√y / √z: под один корень, без запятых, сокращаем, извлекаем. */
function razborG(x: number, y: number, z: number, ans: number): Reshenie {
  const X = Math.round(x * 10);
  const Y = Math.round(y * 10);
  const Z = Math.round(z * 100);
  const s = sokrashchaem(X, Y, Z);
  const formy = s.formy.map((f) => root(2, f));
  const rest = s.xs.filter((v) => v !== 1);
  const under = root(2, proizv(rest));
  let last: Shag;
  if (rest.length === 1) {
    last = shag(
      `Под корнем полный квадрат: $${ans * ans} = ${pw(String(ans), '2')}$, а корень из квадрата положительного числа равен самому числу`,
      `${under} = ${d(ans)}`,
    );
  } else if (rest[0] === rest[1]) {
    last = shag(
      `Под корнем квадрат числа: $${proizv(rest)} = ${pw(String(ans), '2')}$, а корень из квадрата положительного числа равен самому числу`,
      `${under} = ${root(2, pw(String(ans), '2'))} = ${d(ans)}`,
    );
  } else if (rest.every((v) => isSquare(v))) {
    last = shag(
      'Корень из произведения — произведение корней: извлекаем корень из каждого множителя',
      `${under} = ${rest.map((v) => root(2, String(v))).join(' \\cdot ')} = ${rest
        .map((v) => Math.round(Math.sqrt(v)))
        .join(' \\cdot ')} = ${d(ans)}`,
    );
  } else {
    last = shag(
      `Перемножаем оставшееся — получается полный квадрат $${ans * ans} = ${pw(String(ans), '2')}$`,
      `${under} = ${root(2, String(ans * ans))} = ${d(ans)}`,
    );
  }
  return reshenie(
    [
      shag(
        'Произведение и частное корней — корень из произведения и частного: $\\sqrt{a} \\cdot \\sqrt{b} = \\sqrt{ab}$, $\\dfrac{\\sqrt{a}}{\\sqrt{b}} = \\sqrt{\\dfrac{a}{b}}$',
        `\\dfrac{\\sqrt{${d(x)}} \\cdot \\sqrt{${d(y)}}}{\\sqrt{${d(z)}}} = ${root(2, `\\dfrac{${d(x)} \\cdot ${d(y)}}{${d(z)}}`)}`,
      ),
      shag(
        'Избавляемся от запятых: умножаем числитель и знаменатель на $100$ — каждый множитель числителя на $10$, знаменатель на $100$',
        `${root(2, `\\dfrac{${d(x)} \\cdot ${d(y)}}{${d(z)}}`)} = ${formy[0] as string}`,
      ),
      shag(s.chto, formy.join(' = ')),
      last,
    ],
    s.g,
  );
}

export const P8G: Prototype = {
  id: '8.G',
  group: 'I',
  nazvanie: 'Корни из десятичных дробей',
  podtipy: [
    podtip('1', 'base', (r) => {
      const ans = r.int(2, 10);
      const x = tenth(r, 1.1, 9.9);
      const y = tenth(r, 1.1, 9.9);
      const z = round9((x * y) / (ans * ans));
      if (!nice(z, 2) || z >= 1 || z <= 0.01) {
        return null;
      }
      const tex = `\\dfrac{\\sqrt{${d(x)}}${CDOT}\\sqrt{${d(y)}}}{\\sqrt{${d(z)}}}`;
      return {
        uslovie: naydi(tex),
        otvet: ans,
        ...razborG(x, y, z, ans),
        proverka: (Math.sqrt(x) * Math.sqrt(y)) / Math.sqrt(z),
        signature: `${ans}:${x}`,
        params: { x, y, z },
      };
    }),
  ],
  isklyucheniya: keys([
    { x: 1.2, y: 1.4, z: 0.42 },
    { x: 2.8, y: 4.2, z: 0.24 },
    { x: 1.5, y: 3.3, z: 0.55 },
    { x: 3.5, y: 1.5, z: 0.21 },
  ]),
};

/** Упрощённая запись корня: √24 = 2√6. Пригодится тригонометрии. */
export function rootTex(n: number): string {
  const { k, m } = simpRoot(n);
  if (m === 1) {
    return String(k);
  }
  return `${k === 1 ? '' : k}\\sqrt{${m}}`;
}
