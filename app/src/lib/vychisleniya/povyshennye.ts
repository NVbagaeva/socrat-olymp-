/**
 * Шаблоны раздела «Варианты повышенной сложности» для задания №8.
 *
 * Черновик того же вида, что у подтипов раздела (types.ts, `Draft`):
 * условие, ответ, решение по шагам (`Shag`: что делаем и почему, и
 * выкладка) и второй, численный счёт. Лист учителя (`razborStepsHtml`)
 * собирает его как задачу банка. В банк, тренажёр и генератор №8 не
 * входит. Как писать шаги — docs/zadanie-8-razbory.md.
 */

import { priznakiDlya, shag } from './prototypes/common';
import { coefRoot, d, fn, frac, log, quarterInterval, rad } from './tex';
import type { Draft, Shag } from './types';

const round9 = (x: number) => Math.round(x * 1e9) / 1e9;
/** Конечная ли десятичная дробь (до 4 знаков): 1/(−3) — нет, его оставляем дробью. */
const konechnaya = (x: number) => Math.abs(x * 1e4 - Math.round(x * 1e4)) < 1e-9;

/* ── Кирпичи решений ────────────────────────────────────────────── */

/** Отрицательное число — в скобках: \left(-0{,}5\right). */
const sk = (x: number) => (x < 0 ? `\\left(${d(x)}\\right)` : d(x));
/** Формула со знаком минус впереди — в скобках. */
const skTex = (tex: string) => (tex.startsWith('-') ? `\\left(${tex}\\right)` : tex);
/** Дробь n/m как есть, без сокращения; m = 1 — целое. */
const drob = (n: number, m: number) => (m === 1 ? `${n}` : `\\dfrac{${n}}{${m}}`);
/** Обратное к t: −\dfrac{1}{4}; к дробному t — \dfrac{1}{0{,}4}. */
const obratnoe = (t: number) => (Number.isInteger(t) ? frac(1, t) : `\\dfrac{1}{${d(t)}}`);
/** Первая буква — заглавная. */
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** Произведение множителей без единиц; пусто — 1. */
const proizv = (xs: (number | string)[]) => {
  const ys = xs.map(String).filter((x) => x !== '1');
  return ys.length === 0 ? '1' : ys.join('\\cdot ');
};

/** Последний шаг: степень с целым показателем — число. */
function stepenChislom(b: number, e: number, otvet: number): Shag {
  if (e === -1) {
    return shag(
      'Показатель $-1$ означает обратное число: $a^{-1} = \\dfrac{1}{a}$',
      `${b}^{-1} = \\dfrac{1}{${b}} = ${d(otvet)}`,
    );
  }
  if (e < 0) {
    return shag(
      'Отрицательный показатель означает дробь: $a^{-n} = \\dfrac{1}{a^{n}}$',
      `${b}^{${e}} = \\dfrac{1}{${b}^{${-e}}} = \\dfrac{1}{${round9(b ** -e)}} = ${d(otvet)}`,
    );
  }
  if (e === 0) {
    return shag(
      'Любое число, кроме нуля, в нулевой степени равно единице',
      `${b}^{0} = ${d(otvet)}`,
    );
  }
  return shag('Считаем степень', `${b}^{${d(e)}} = ${d(otvet)}`);
}

/**
 * log_a(bᵐ·√a), если log_b a = t: сначала перевернуть логарифм
 * (log_a b = 1/t), затем разложить логарифм произведения.
 */
export function logObratnyy(p: { m: number; t: number }): Draft {
  const { m, t } = p;
  const obr = 1 / t;
  const chast = round9(m * obr);
  const otvet = round9(chast + 0.5);
  const arg = `b^{${m}}\\cdot\\sqrt{a}`;
  const lab = log('a', 'b');
  /* m·(1/t): делим m на |t| — без десятичной дроби 1/t. */
  const umnozh = Number.isInteger(t)
    ? `${m}\\cdot ${skTex(frac(1, t))} = ${t < 0 ? '-' : ''}\\dfrac{${m}}{${Math.abs(t)}} = ${d(chast)}`
    : `${m}\\cdot\\dfrac{1}{${d(t)}} = ${d(chast)}`;
  return {
    uslovie: `Найдите значение выражения $${log('a', `\\left(${arg}\\right)`)}$, если $${log('b', 'a')} = ${d(t)}$.`,
    otvet,
    razbor: [
      shag(
        'Логарифм произведения — сумма логарифмов',
        `${log('a', `\\left(${arg}\\right)`)} = ${log('a', `b^{${m}}`)} + ${log('a', '\\sqrt{a}')}`,
      ),
      shag(
        `В первом слагаемом нужен $${lab}$, а дан $${log('b', 'a')}$. Такие логарифмы взаимно обратны`,
        `${lab} = \\dfrac{1}{${log('b', 'a')}} = ${obratnoe(t)}`,
      ),
      shag(
        `Показатель степени выносим множителем и подставляем $${lab}$`,
        `${log('a', `b^{${m}}`)} = ${m}${lab} = ${umnozh}`,
      ),
      shag(
        'Корень — степень с показателем $\\dfrac12$, а логарифм основания по тому же основанию равен $1$',
        `${log('a', '\\sqrt{a}')} = ${log('a', 'a^{\\frac12}')} = \\dfrac12 = 0{,}5`,
      ),
      shag(
        'Складываем найденные логарифмы',
        `${log('a', `\\left(${arg}\\right)`)} = ${d(chast)} + 0{,}5 = ${d(otvet)}`,
      ),
    ],
    params: { m, t },
    /* Второй счёт: подставляем конкретные a и b с log_b a = t. */
    proverka: (() => {
      const b = 3;
      const a = b ** t;
      return Math.log(b ** m * Math.sqrt(a)) / Math.log(a);
    })(),
    signature: `inv:${m}:${t}`,
  };
}

/**
 * log_a(aᵐ·√b), если log_b a = t: степень основания даёт m, а корень из
 * b — половину log_a b = 1/t. Подвох — «перевернуть» логарифм.
 */
export function logPryamoy(p: { m: number; t: number }): Draft {
  const { m, t } = p;
  const obr = round9(1 / t);
  const pol = round9(obr / 2);
  const otvet = round9(m + pol);
  const arg = `a^{${m}}\\cdot\\sqrt{b}`;
  const lab = log('a', 'b');
  const obrTex = obratnoe(t);
  return {
    uslovie: `Найдите $${log('a', `\\left(${arg}\\right)`)}$, если $${log('b', 'a')} = ${d(t)}$.`,
    otvet,
    razbor: [
      shag(
        'Логарифм произведения — сумма логарифмов',
        `${log('a', `\\left(${arg}\\right)`)} = ${log('a', `a^{${m}}`)} + ${log('a', '\\sqrt{b}')}`,
      ),
      shag(
        'Логарифм степени основания равен показателю: $\\log_{a} a^{k} = k$',
        `${log('a', `a^{${m}}`)} = ${m}`,
      ),
      shag(
        `Во втором слагаемом нужен $${lab}$, а дан $${log('b', 'a')}$. Такие логарифмы взаимно обратны`,
        `${lab} = \\dfrac{1}{${log('b', 'a')}} = ${obrTex}${obrTex === d(obr) || !konechnaya(obr) ? '' : ` = ${d(obr)}`}`,
      ),
      shag(
        'Корень — степень с показателем $\\dfrac12$, этот показатель выносим множителем',
        `${log('a', '\\sqrt{b}')} = \\dfrac12${lab} = \\dfrac12\\cdot ${sk(obr)} = ${d(pol)}`,
      ),
      shag(
        'Складываем найденные логарифмы',
        `${log('a', `\\left(${arg}\\right)`)} = ${m} ${pol < 0 ? '-' : '+'} ${d(Math.abs(pol))} = ${d(otvet)}`,
      ),
    ],
    params: { m, t },
    proverka: (() => {
      const b = 3;
      const a = b ** t;
      return Math.log(a ** m * Math.sqrt(b)) / Math.log(a);
    })(),
    signature: `pryam:${m}:${t}`,
  };
}

/**
 * 2c·sin x·cos x / sin(360° − 2x): числитель — c·sin 2x, знаменатель
 * по формуле приведения −sin 2x. Подвох — знак: ответ −c.
 */
export function sinDvoynogoPrivedenie(p: { x: number; c: number }): Draft {
  const { x, c } = p;
  const y = 360 - 2 * x;
  const vnizu = `\\sin ${y}^\\circ`;
  const dva = `\\sin ${2 * x}^\\circ`;
  const koef = c === 1 ? '' : String(c);
  return {
    uslovie: `Найдите значение выражения $\\dfrac{${2 * c}\\sin ${x}^\\circ\\cdot\\cos ${x}^\\circ}{${vnizu}}$.`,
    otvet: -c,
    razbor: [
      shag(
        `В числителе — синус двойного угла: $2\\sin\\alpha\\cos\\alpha = \\sin 2\\alpha$. Выделяем множитель $2$`,
        `${2 * c}\\sin ${x}^\\circ\\cos ${x}^\\circ = ${c === 1 ? '' : `${c}\\cdot `}2\\sin ${x}^\\circ\\cos ${x}^\\circ = ${koef}${dva}`,
      ),
      shag(
        `Знаменатель приводим к тому же углу: $${y}^\\circ = 360^\\circ - ${2 * x}^\\circ$, а при вычитании угла из $360^\\circ$ синус меняет знак`,
        `${vnizu} = \\sin(360^\\circ - ${2 * x}^\\circ) = -${dva}`,
      ),
      shag(
        `Сокращаем дробь на $${dva}$ — он не равен нулю`,
        `\\dfrac{${koef}${dva}}{-${dva}} = ${d(-c)}`,
      ),
    ],
    params: { x, c },
    proverka: (() => {
      const r = Math.PI / 180;
      return (2 * c * Math.sin(x * r) * Math.cos(x * r)) / Math.sin(y * r);
    })(),
    signature: `sin2:${x}:${c}`,
  };
}

/**
 * Основание B = b^s как степень числа b: Bˣ = b^{s·x}. При s = 1
 * основание уже b, и шага нет.
 */
function kOsnovaniyu(b: number, s: number, x: number, e: number): Shag | null {
  if (s === 1) return null;
  const B = b ** s;
  return shag(
    `Записываем $${B}$ как степень числа $${b}$: $${B} = ${b}^{${s}}$. Степень в степени — показатели перемножаются`,
    `${B}^{${d(x)}} = \\left(${b}^{${s}}\\right)^{${d(x)}} = ${b}^{${s} \\cdot ${d(x)}} = ${b}^{${d(e)}}`,
  );
}

/**
 * Решение (b^s1)^x : (b^s2)^y и (b^s1)^x · (b^s2)^y: основания — к
 * одному числу b, показатели вычесть или сложить — дробные части
 * уходят, остаётся целая степень.
 */
function razborDvuhStepeney(
  p: { b: number; s1: number; s2: number; x: number; y: number },
  e1: number,
  e2: number,
  e: number,
  otvet: number,
  op: 'del' | 'umn',
): Shag[] {
  const { b, s1, s2, x, y } = p;
  const steps = [kOsnovaniyu(b, s1, x, e1), kOsnovaniyu(b, s2, y, e2)].filter(
    (s): s is Shag => s !== null,
  );
  const konec = e === 1 ? ` = ${d(otvet)}` : '';
  steps.push(
    op === 'del'
      ? shag(
          'Основания одинаковые — при делении показатели вычитаются, и дробные части показателей уходят',
          `${b}^{${d(e1)}} : ${b}^{${d(e2)}} = ${b}^{${d(e1)} - ${d(e2)}} = ${b}^{${d(e)}}${konec}`,
        )
      : shag(
          'Основания одинаковые — при умножении показатели складываются, и дробные части дают целое число',
          `${b}^{${d(e1)}} \\cdot ${b}^{${d(e2)}} = ${b}^{${d(e1)} + ${d(e2)}} = ${b}^{${d(e)}}${konec}`,
        ),
  );
  if (e !== 1) steps.push(stepenChislom(b, e, otvet));
  return steps;
}

/**
 * (b^s1)^x / (b^s2)^y: оба основания — степени b, показатели дробные,
 * разность целая. Ответ b^(s1·x − s2·y).
 */
export function stepeniChastnoe(p: {
  b: number;
  s1: number;
  s2: number;
  x: number;
  y: number;
}): Draft {
  const { b, s1, s2, x, y } = p;
  const B1 = b ** s1;
  const B2 = b ** s2;
  const e1 = round9(s1 * x);
  const e2 = round9(s2 * y);
  const e = round9(e1 - e2);
  const otvet = round9(b ** e);
  return {
    uslovie: `Найдите значение выражения $\\dfrac{${B1}^{${d(x)}}}{${B2}^{${d(y)}}}$.`,
    otvet,
    razbor: razborDvuhStepeney(p, e1, e2, e, otvet, 'del'),
    params: { b, s1, s2, x, y },
    proverka: B1 ** x / B2 ** y,
    signature: `stch:${b}:${s1}:${s2}:${x}:${y}`,
  };
}

/* ── Партия 2 ───────────────────────────────────────────────────── */

const nod = (x: number, y: number): number => (y === 0 ? Math.abs(x) : nod(y, x % y));

/**
 * log_{aⁱ}(bʲ) : log_{aᵏ}(bˡ): и основания, и числа — степени двух чисел
 * a и b. Оба логарифма сводятся к log_a b с множителями j/i и l/k, log_a b
 * сокращается. Ответ (j·k)/(i·l) — конечная дробь.
 */
export function logChastnoeStepeney(p: {
  a: number;
  i: number;
  b: number;
  j: number;
  k: number;
  l: number;
}): Draft {
  const { a, i, b, j, k, l } = p;
  const A = a ** i;
  const B = b ** j;
  const C = a ** k;
  const D = b ** l;
  const otvet = round9((j * k) / (i * l));
  if (!konechnaya(otvet)) throw new Error(`logChastnoeStepeney: ${j * k}/${i * l}`);
  const verh = log(String(A), String(B));
  const niz = log(String(C), String(D));
  const lab = log(String(a), String(b));
  /* Коэффициенты j/i и l/k — несократимыми дробями J/I и L/K. */
  const g1 = nod(j, i);
  const [J, I] = [j / g1, i / g1];
  const g2 = nod(l, k);
  const [L, K] = [l / g2, k / g2];
  const koef = (n: number, m: number) =>
    n === m ? '' : m === 1 ? String(n) : `\\frac{${n}}{${m}}`;
  const razbor: Shag[] = [
    shag(
      `Основания — степени числа $${a}$, а числа под логарифмами — степени числа $${b}$`,
      `\\dfrac{${verh}}{${niz}} = \\dfrac{${log(`${a}^{${i}}`, `${b}^{${j}}`)}}{${log(`${a}^{${k}}`, `${b}^{${l}}`)}}`,
    ),
    shag(
      'Показатель числа выносим множителем, а показатель основания — делителем: $\\log_{a^{k}} b^{n} = \\dfrac{n}{k}\\log_{a} b$',
      `\\dfrac{${log(`${a}^{${i}}`, `${b}^{${j}}`)}}{${log(`${a}^{${k}}`, `${b}^{${l}}`)}} = \\dfrac{${koef(J, I)}${lab}}{${koef(L, K)}${lab}}`,
    ),
  ];
  const levo = `\\dfrac{${koef(J, I)}${lab}}{${koef(L, K)}${lab}}`;
  const otvetTex = (n: number, m: number) =>
    m === 1 || drob(n, m) === d(otvet) ? d(otvet) : `${drob(n, m)} = ${d(otvet)}`;
  if (L === K) {
    razbor.push(
      shag(`Сокращаем дробь на $${lab}$ — он не равен нулю`, `${levo} = ${otvetTex(J, I)}`),
    );
  } else {
    razbor.push(
      shag(
        `Сокращаем дробь на $${lab}$ — он не равен нулю. Остаётся частное коэффициентов`,
        `${levo} = ${drob(J, I)} : ${drob(L, K)}`,
      ),
    );
    /* J/I · K/L: сокращаем крест-накрест до умножения. */
    const h1 = nod(J, L);
    const h2 = nod(K, I);
    const para = [
      ...(h2 > 1 ? [`$${K}$ и $${I}$ — на $${h2}$`] : []),
      ...(h1 > 1 ? [`$${J}$ и $${L}$ — на $${h1}$`] : []),
    ];
    const verhP = [J / h1, K / h2].filter((x) => x !== 1);
    const nizP = [I / h2, L / h1].filter((x) => x !== 1);
    const N = (J / h1) * (K / h2);
    const M = (I / h2) * (L / h1);
    const chain = [`${drob(J, I)} : ${drob(L, K)}`, `${drob(J, I)}\\cdot ${drob(K, L)}`];
    if (para.length > 0)
      chain.push(nizP.length === 0 ? proizv(verhP) : `\\dfrac{${proizv(verhP)}}{${proizv(nizP)}}`);
    chain.push(drob(N, M), d(otvet));
    razbor.push(
      shag(
        `Делить на дробь — значит умножать на перевёрнутую${para.length === 0 ? '' : `. До умножения сокращаем ${para.join(', ')}`}`,
        chain.filter((x, n) => n === 0 || x !== chain[n - 1]).join(' = '),
      ),
    );
  }
  return {
    uslovie: `Найдите значение выражения $\\dfrac{${verh}}{${niz}}$.`,
    otvet,
    razbor,
    params: { a, i, b, j, k, l },
    proverka: Math.log(B) / Math.log(A) / (Math.log(D) / Math.log(C)),
    signature: `lchs:${a}:${i}:${b}:${j}:${k}:${l}`,
  };
}

/** Тригонометрическая функция и угол n·π/den. */
export type TrigUgol = ['sin' | 'cos' | 'tg', number, number];

/** Значение в стандартном угле: знак · √s / D. */
interface TrigZnach {
  zn: 1 | -1;
  s: number;
  D: number;
}

/** sin, cos, tg опорного угла φ = π/6, π/4, π/3 (по знаменателю 6, 4, 3). */
const TABLICA: Record<'sin' | 'cos' | 'tg', Record<number, [number, number]>> = {
  sin: { 6: [1, 2], 4: [2, 2], 3: [3, 2] },
  cos: { 6: [3, 2], 4: [2, 2], 3: [1, 2] },
  tg: { 6: [3, 3], 4: [1, 1], 3: [3, 1] },
};

/** Значение в TeX: −\dfrac{\sqrt2}{2}, \sqrt3, \dfrac12. */
function znachTex(z: TrigZnach): string {
  const verh = z.s === 1 ? '1' : `\\sqrt{${z.s}}`;
  const body = z.D === 1 ? verh : `\\dfrac{${verh}}{${z.D}}`;
  return `${z.zn < 0 ? '-' : ''}${body}`;
}

/** Угол n·π/den в TeX, отрицательный — в скобках. */
function ugolTex(n: number, den: number): string {
  return n < 0 ? `\\left(${rad(n, den)}\\right)` : rad(n, den);
}

/** Кратное π в TeX: π, 2π, 4π. */
const piK = (m: number) => (m === 1 ? '\\pi' : `${m}\\pi`);

/** Название функции в подписи шага. */
const IMYA: Record<'sin' | 'cos' | 'tg', string> = { sin: 'синус', cos: 'косинус', tg: 'тангенс' };

/**
 * Значение f(nπ/den) цепочкой формул приведения: чётность, отбрасывание
 * периодов, «π − φ», табличное значение. Углы — только с опорным
 * π/6, π/4, π/3 (на осях значения нулевые или не существуют).
 * chto — подпись шага решения: какие приёмы применены и почему.
 */
export function trigCepochka(u: TrigUgol): { tex: string; z: TrigZnach; chto: string } {
  const [f, n0, den0] = u;
  const g0 = nod(n0, den0);
  const n = n0 / g0;
  const den = den0 / g0;
  const F = fn(f);
  const ch: string[] = [`${F}${ugolTex(n, den)}`];
  const priemy: string[] = [];
  const chetnost = (snova: boolean) =>
    f === 'cos'
      ? snova
        ? 'снова убираем минус у угла'
        : 'косинус чётный — минус у угла убираем'
      : snova
        ? `${IMYA[f]} нечётный — снова выносим минус`
        : `${IMYA[f]} нечётный — выносим минус вперёд`;
  let zn: 1 | -1 = 1;
  const pref = () => (zn < 0 ? '-' : '');
  let m = n;
  if (m < 0) {
    m = -m;
    if (f !== 'cos') zn = -1;
    ch.push(`${pref()}${F}${rad(m, den)}`);
    priemy.push(chetnost(false));
  }
  /* Период в единицах π/den: 2π у синуса и косинуса, π у тангенса. */
  const P = f === 'tg' ? den : 2 * den;
  const kk = Math.round(m / P);
  let th = m - kk * P;
  if (kk !== 0) {
    const kratnoe = piK(f === 'tg' ? kk : 2 * kk);
    const ost = th === 0 ? '' : `${th < 0 ? '-' : '+'}${rad(Math.abs(th), den)}`;
    ch.push(`${pref()}${F}\\left(${kratnoe}${ost}\\right)`);
    priemy.push(
      f === 'tg'
        ? kk === 1
          ? 'отбрасываем период тангенса $\\pi$'
          : `отбрасываем $${kratnoe}$ — целое число периодов тангенса`
        : kk === 1
          ? 'отбрасываем полный оборот $2\\pi$'
          : `отбрасываем полные обороты $${kratnoe}$`,
    );
    if (th < 0) {
      ch.push(`${pref()}${F}\\left(${rad(th, den)}\\right)`);
      th = -th;
      if (f !== 'cos') zn = zn === 1 ? -1 : 1;
      ch.push(`${pref()}${F}${rad(th, den)}`);
      priemy.push(chetnost(n < 0));
    } else {
      ch.push(`${pref()}${F}${rad(th, den)}`);
    }
  }
  /* th ∈ [0; P/2]: у синуса и косинуса тупой угол — через π − φ. */
  let phi = th;
  if (f !== 'tg' && 2 * th > den) {
    phi = den - th;
    ch.push(`${pref()}${F}\\left(\\pi-${rad(phi, den)}\\right)`);
    if (f === 'cos') zn = zn === 1 ? -1 : 1;
    ch.push(`${pref()}${F}${rad(phi, den)}`);
    priemy.push(
      f === 'sin'
        ? 'по формуле приведения $\\sin(\\pi-\\alpha)=\\sin\\alpha$'
        : 'по формуле приведения $\\cos(\\pi-\\alpha)=-\\cos\\alpha$',
    );
  }
  const g = nod(phi, den);
  const op = den / g;
  if (phi === 0 || phi / g !== 1 || TABLICA[f][op] === undefined)
    throw new Error(`trigCepochka: угол ${n}π/${den} не табличный`);
  const [s, D] = TABLICA[f][op] as [number, number];
  const z: TrigZnach = { zn, s, D };
  ch.push(znachTex(z));
  const chto =
    priemy.length === 0
      ? 'Угол табличный — берём значение из таблицы'
      : `${cap(priemy.join('; '))}; остаётся табличное значение`;
  return { tex: ch.join('='), z, chto };
}

export interface TrigPrivedenie {
  /** Множитель k·√r перед произведением. */
  k: number;
  r: number;
  /** Множители числителя. */
  f: TrigUgol[];
  /** Делитель. */
  g: TrigUgol;
}

/** Выражение задачи в TeX. */
export function trigPrivedenieTex(p: TrigPrivedenie): string {
  const mnozh = (u: TrigUgol) => `${fn(u[0])}${ugolTex(u[1], u[2])}`;
  const verh = `${coefRoot(p.k, p.r).replace(/^1$/, '')}${p.f.map(mnozh).join('\\cdot ')}`;
  return `\\dfrac{${verh}}{${mnozh(p.g)}}`;
}

/**
 * k√r · f₁(α₁) · f₂(α₂) : g(β), углы больше периода и отрицательные.
 * Каждое значение — формулами приведения; корни сокращаются, ответ
 * рациональный. Подвох — знаки после приведения.
 */
export function trigPrivedenie(p: TrigPrivedenie): Draft {
  const vse = [...p.f, p.g];
  const c = vse.map(trigCepochka);
  const zf = c.slice(0, -1).map((x) => x.z);
  const zg = (c[c.length - 1] as { z: TrigZnach }).z;
  const znak = zf.reduce((s, z) => s * z.zn, 1) * zg.zn;
  /* √r·Πs_i : √s_g = √(r·Πs_i·s_g) / s_g. */
  const podK = p.r * zf.reduce((s, z) => s * z.s, 1) * zg.s;
  const Qk = Math.round(Math.sqrt(podK));
  if (Qk * Qk !== podK) throw new Error(`trigPrivedenie: корень √${podK} не извлекается`);
  const chisl = p.k * zg.D * Qk;
  const znam = zf.reduce((s, z) => s * z.D, 1) * zg.s;
  const otvet = round9((znak * chisl) / znam);
  if (!konechnaya(otvet)) throw new Error(`trigPrivedenie: ${chisl}/${znam}`);
  const skob = (z: TrigZnach) => (z.zn < 0 ? `\\left(${znachTex(z)}\\right)` : znachTex(z));
  const koef = coefRoot(p.k, p.r).replace(/^1$/, '');
  const podst = `\\dfrac{${koef}${koef === '' ? '' : '\\cdot'}${zf.map(skob).join('\\cdot')}}{${znachTex(zg)}}`;
  const minusov = [...zf, zg].filter((z) => z.zn < 0).length;
  const znakText =
    [
      'минусов нет — результат положительный',
      'минус один — результат отрицательный',
      'минусов два — чётное число, результат положительный',
      'минусов три — нечётное число, результат отрицательный',
    ][minusov] ??
    `минусов ${minusov} — ${minusov % 2 === 1 ? 'нечётное число, результат отрицательный' : 'чётное число, результат положительный'}`;
  const minus = otvet < 0 ? '-' : '';
  /* Одна дробь без знаков: деление на √s/D — умножение на D/√s. */
  const kor = (s: number) => `\\sqrt{${s}}`;
  const odnoy = (verh: (number | string)[], niz: (number | string)[]) => {
    const n = niz.map(String).filter((x) => x !== '1');
    return n.length === 0 ? proizv(verh) : `\\dfrac{${proizv(verh)}}{${proizv(n)}}`;
  };
  const verhK = [p.r, ...zf.map((z) => z.s)].filter((s) => s !== 1);
  const nizK = zg.s === 1 ? [] : [zg.s];
  const razbor: Shag[] = c.map((x) => shag(x.chto, x.tex));
  razbor.push(
    shag(
      `Подставляем значения. ${cap(znakText)}${zg.D === 1 ? '' : '. Деление на дробь заменяем умножением на перевёрнутую'}`,
      `${podst} = ${minus}${odnoy(
        [p.k, ...verhK.map(kor), zg.D],
        [...zf.map((z) => z.D), ...nizK.map(kor)],
      )}`,
    ),
  );
  /* Корни: √(r·Πs_i) : √s_g = Qk / s_g. */
  const h = nod(Qk, zg.s);
  const [rn, rd] = [Qk / h, zg.s / h];
  if (verhK.length + nizK.length > 0) {
    /* Сначала одинаковые корни сверху и снизу сокращаются, потом √a·√a = a,
       и только остальное — под один корень. */
    const verh = [...verhK];
    const niz: number[] = [];
    const ushli: number[] = [];
    for (const x of nizK) {
      const i = verh.indexOf(x);
      if (i >= 0) {
        verh.splice(i, 1);
        ushli.push(x);
      } else niz.push(x);
    }
    const ostalos = verh.length + niz.length > 0;
    const pary =
      niz.length === 0 && verh.every((x) => verh.filter((y) => y === x).length % 2 === 0);
    const chain = [odnoy(verhK.map(kor), nizK.map(kor))];
    if (ushli.length > 0) chain.push(odnoy(verh.map(kor), niz.map(kor)));
    if (ostalos && !pary) {
      const pod = verh.reduce((s, x) => s * x, 1) / niz.reduce((s, x) => s * x, 1);
      const podTex = odnoy(verh, niz);
      chain.push(`\\sqrt{${podTex}}`);
      if (Number.isInteger(pod) && String(pod) !== podTex) chain.push(`\\sqrt{${pod}}`);
    }
    chain.push(drob(rn, rd));
    const chto = [
      ...(ushli.length > 0 ? ['одинаковые корни в числителе и знаменателе сокращаем'] : []),
      ...(!ostalos
        ? []
        : pary
          ? [
              'корень, умноженный сам на себя, даёт подкоренное число: $\\sqrt{a}\\cdot\\sqrt{a} = a$',
            ]
          : [
              `${ushli.length > 0 ? 'остальные корни' : 'корни'} собираем под один знак корня: $\\sqrt{a}\\cdot\\sqrt{b} = \\sqrt{ab}$${niz.length === 0 ? '' : ', $\\dfrac{\\sqrt{a}}{\\sqrt{b}} = \\sqrt{\\dfrac{a}{b}}$'}`,
            ]),
    ];
    razbor.push(
      shag(
        cap(chto.join(', а ')),
        chain.filter((x, i) => i === 0 || x !== chain[i - 1]).join(' = '),
      ),
    );
  }
  razbor.push(
    shag(
      `${verhK.length + nizK.length > 0 ? 'Подставляем значение корней и сокращаем числа' : 'Сокращаем числа'}${minus === '' ? '' : ', минус сохраняем'}`,
      `${minus}${odnoy([p.k, rn, zg.D], [...zf.map((z) => z.D), rd])} = ${d(otvet)}`,
    ),
  );
  return {
    uslovie: `Найдите значение выражения $${trigPrivedenieTex(p)}$.`,
    otvet,
    razbor,
    params: { k: p.k, r: p.r, f: JSON.stringify(p.f), g: JSON.stringify(p.g) },
    proverka: (() => {
      const F = (u: TrigUgol) => {
        const x = (u[1] * Math.PI) / u[2];
        return u[0] === 'sin' ? Math.sin(x) : u[0] === 'cos' ? Math.cos(x) : Math.tan(x);
      };
      return (p.k * Math.sqrt(p.r) * p.f.reduce((s, u) => s * F(u), 1)) / F(p.g);
    })(),
    signature: `trpr:${JSON.stringify(p)}`,
  };
}

export interface LogAmBn {
  m: number;
  n: number;
  /** a^m·b^n или a^m / b^n. */
  op: 'umn' | 'del';
  /** Что дано: log_a b = t ('ab') или log_b a = t ('ba'). */
  dano: 'ab' | 'ba';
  t: number;
}

/**
 * log_a(aᵐ·bⁿ) или log_a(aᵐ/bⁿ) при данном log_a b или log_b a:
 * m ± n·log_a b. Подвох — знак у частного и «перевёрнутый» логарифм.
 */
export function logAmBn(p: LogAmBn): Draft {
  const { m, n, op, dano, t } = p;
  const L = round9(dano === 'ab' ? t : 1 / t);
  /* log_a b = 1/t может быть и бесконечной дробью (−1/3): тогда пишем дробью. */
  const Ltex = konechnaya(L) ? d(L) : frac(dano === 'ab' ? t : 1, dano === 'ab' ? 1 : t);
  const znak = op === 'umn' ? 1 : -1;
  const otvet = round9(m + znak * (dano === 'ab' ? n * t : n / t));
  const arg = op === 'umn' ? `\\left(a^{${m}}b^{${n}}\\right)` : `\\dfrac{a^{${m}}}{b^{${n}}}`;
  const lab = log('a', 'b');
  const nL = round9(dano === 'ab' ? n * t : n / t);
  if (!konechnaya(nL)) throw new Error(`logAmBn: ${n}·log_a b = ${nL}`);
  const zn = znak > 0 ? '+' : '-';
  /* Слагаемое со знаком: m ± n·log_a b = m ∓ |n·log_a b|. */
  const zn2 = znak * nL < 0 ? '-' : '+';
  const podstanovka =
    dano === 'ab'
      ? `${m} ${zn} ${n}\\cdot ${sk(t)} = ${m} ${zn2} ${d(Math.abs(nL))}`
      : Number.isInteger(t)
        ? `${m} ${zn} ${n}\\cdot ${skTex(obratnoe(t))} = ${m} ${zn2} \\dfrac{${n}}{${Math.abs(t)}} = ${m} ${zn2} ${d(Math.abs(nL))}`
        : `${m} ${zn} ${n}\\cdot ${skTex(Ltex)} = ${m} ${zn2} ${d(Math.abs(nL))}`;
  return {
    uslovie: `Найдите значение выражения $${log('a', arg)}$, если $${dano === 'ab' ? lab : log('b', 'a')}=${d(t)}$.`,
    otvet,
    razbor: [
      shag(
        `${op === 'umn' ? 'Логарифм произведения — сумма логарифмов' : 'Логарифм частного — разность логарифмов'}. Логарифм степени основания равен показателю, а показатель $b^{${n}}$ выносим множителем`,
        `${log('a', arg)} = ${log('a', `a^{${m}}`)} ${zn} ${log('a', `b^{${n}}`)} = ${m} ${zn} ${n}${lab}`,
      ),
      ...(dano === 'ba'
        ? [
            shag(
              `Нужен $${lab}$, а дан $${log('b', 'a')}$. Такие логарифмы взаимно обратны`,
              `${lab} = \\dfrac{1}{${log('b', 'a')}} = ${obratnoe(t)}`,
            ),
          ]
        : []),
      shag(
        dano === 'ab'
          ? `Подставляем $${lab} = ${d(t)}$`
          : `Подставляем $${lab}$: умножить на $\\dfrac{1}{${d(Math.abs(t))}}$ — значит разделить на $${d(Math.abs(t))}$`,
        `${m} ${zn} ${n}${lab} = ${podstanovka} = ${d(otvet)}`,
      ),
    ],
    params: { m, n, op, dano, t },
    proverka: (() => {
      const b = 2;
      const a = b ** (1 / L);
      const x = op === 'umn' ? a ** m * b ** n : a ** m / b ** n;
      return Math.log(x) / Math.log(a);
    })(),
    signature: `lamb:${m}:${n}:${op}:${dano}:${t}`,
  };
}

/* ── Партия 3 ───────────────────────────────────────────────────── */

export interface CosDvoynogo {
  /** Подкоренное число множителя √A. */
  A: number;
  /** Угол α = n·π/den. */
  n: number;
  den: number;
  /** raznost: √A·cos²α − √A·sin²α; odin: √(4A)·cos²α − √A; sinus: √A − √(4A)·sin²α. */
  vid: 'raznost' | 'odin' | 'sinus';
}

/** Квадрат функции угла в TeX: \cos^2\frac{19\pi}{12}. */
const kvadratTex = (f: 'sin' | 'cos', n: number, den: number) => `${fn(f)}^2${rad(n, den)}`;

/**
 * √A·cos²α − √A·sin²α или √(4A)·cos²α − √A: в обоих случаях это
 * √A·cos 2α, где 2α — угол с табличным косинусом, а √A сокращает
 * корень значения. Подвох — увидеть косинус двойного угла (во втором
 * виде — после 2cos²α − 1) и не ошибиться со знаком при приведении.
 */
export function cosDvoynogo(p: CosDvoynogo): Draft {
  const { A, n, den, vid } = p;
  const c2 = kvadratTex('cos', n, den);
  const s2 = kvadratTex('sin', n, den);
  const vyr =
    vid === 'raznost'
      ? `\\sqrt{${A}}${c2}-\\sqrt{${A}}${s2}`
      : vid === 'sinus'
        ? `\\sqrt{${A}}-\\sqrt{${4 * A}}${s2}`
        : `\\sqrt{${4 * A}}${c2}-\\sqrt{${A}}`;
  const cep = trigCepochka(['cos', 2 * n, den]);
  const { zn, s, D } = cep.z;
  const koren = Math.round(Math.sqrt(A * s));
  if (koren * koren !== A * s) throw new Error(`cosDvoynogo: √(${A}·${s}) не целый`);
  const otvet = round9((zn * koren) / D);
  if (!konechnaya(otvet)) throw new Error(`cosDvoynogo: ${zn * koren}/${D} — бесконечная дробь`);
  const dvaAlfa = rad(2 * n, den);
  const skobka = vid === 'raznost' ? `${c2}-${s2}` : vid === 'sinus' ? `1-2${s2}` : `2${c2}-1`;
  const formula =
    vid === 'raznost'
      ? '\\cos^2\\alpha-\\sin^2\\alpha'
      : vid === 'sinus'
        ? '1-2\\sin^2\\alpha'
        : '2\\cos^2\\alpha-1';
  const vynos =
    vid === 'raznost'
      ? shag(
          `Выносим общий множитель $\\sqrt{${A}}$ за скобки`,
          `${vyr} = \\sqrt{${A}}\\left(${skobka}\\right)`,
        )
      : shag(
          `Выносим из корня множитель $4$: $\\sqrt{${4 * A}} = \\sqrt{4\\cdot ${A}} = 2\\sqrt{${A}}$. Затем $\\sqrt{${A}}$ — за скобки`,
          `${vyr} = ${
            vid === 'sinus' ? `\\sqrt{${A}}-2\\sqrt{${A}}${s2}` : `2\\sqrt{${A}}${c2}-\\sqrt{${A}}`
          } = \\sqrt{${A}}\\left(${skobka}\\right)`,
        );
  const znakM = zn < 0 ? '-' : '';
  /* √A·(±√s/D) = ±√(A·s)/D, и корень извлекается. */
  const nadD = (top: string) => (D === 1 ? `${znakM}${top}` : `${znakM}\\dfrac{${top}}{${D}}`);
  const umnozh =
    s === 1
      ? `\\sqrt{${A}}\\cdot ${skTex(znachTex(cep.z))} = ${nadD(String(koren))}`
      : `\\sqrt{${A}}\\cdot ${skTex(znachTex(cep.z))} = ${nadD(`\\sqrt{${A}\\cdot ${s}}`)} = ${nadD(`\\sqrt{${A * s}}`)} = ${nadD(String(koren))}`;
  return {
    uslovie: `Найдите значение выражения $${vyr}$.`,
    otvet,
    razbor: [
      vynos,
      shag(
        `В скобках — косинус двойного угла: $${formula} = \\cos2\\alpha$`,
        `\\sqrt{${A}}\\left(${skobka}\\right) = \\sqrt{${A}}${fn('cos')}${dvaAlfa}`,
      ),
      shag(cep.chto, cep.tex),
      shag(
        s === 1
          ? `Подставляем значение: $\\sqrt{${A}} = ${koren}$`
          : 'Подставляем значение и перемножаем корни: $\\sqrt{a}\\cdot\\sqrt{b} = \\sqrt{ab}$ — корень извлекается',
        `${umnozh}${nadD(String(koren)) === d(otvet) ? '' : ` = ${d(otvet)}`}`,
      ),
    ],
    params: { A, n, den, vid },
    proverka: (() => {
      const a = (n * Math.PI) / den;
      return vid === 'raznost'
        ? Math.sqrt(A) * Math.cos(a) ** 2 - Math.sqrt(A) * Math.sin(a) ** 2
        : vid === 'sinus'
          ? Math.sqrt(A) - Math.sqrt(4 * A) * Math.sin(a) ** 2
          : Math.sqrt(4 * A) * Math.cos(a) ** 2 - Math.sqrt(A);
    })(),
    signature: `cos2:${vid}:${A}:${n}:${den}`,
  };
}

/**
 * a^(n + log_a b): степень суммы — произведение степеней, а
 * a^(log_a b) = b по определению логарифма. Ответ aⁿ·b.
 */
export function stepenSLog(p: { a: number; n: number; b: number }): Draft {
  const { a, n, b } = p;
  const an = a ** n;
  const otvet = round9(an * b);
  return {
    uslovie: `Найдите значение выражения $${a}^{${n}+${log(String(a), String(b))}}$.`,
    otvet,
    razbor: [
      shag(
        'Сумма в показателе — произведение степеней: $a^{x + y} = a^{x}\\cdot a^{y}$',
        `${a}^{${n}+${log(String(a), String(b))}} = ${a}^{${n}}\\cdot ${a}^{${log(String(a), String(b))}}`,
      ),
      shag(
        'По основному логарифмическому тождеству $a^{\\log_{a} b} = b$',
        `${a}^{${n}}\\cdot ${a}^{${log(String(a), String(b))}} = ${a}^{${n}}\\cdot ${b}`,
      ),
      shag('Считаем степень и умножаем', `${a}^{${n}}\\cdot ${b} = ${an}\\cdot ${b} = ${d(otvet)}`),
    ],
    params: { a, n, b },
    proverka: a ** (n + Math.log(b) / Math.log(a)),
    signature: `stlog:${a}:${n}:${b}`,
  };
}

export interface TgPoZnacheniyu {
  /** Что дано: косинус или синус. */
  f: 'sin' | 'cos';
  /** Значение (a√r)/(b√s), знак — sign. */
  a: number;
  r: number;
  b: number;
  s: number;
  sign: 1 | -1;
  /** Четверть угла. */
  q: 1 | 2 | 3 | 4;
}

/** a√r/(b√s) в TeX: \dfrac{2}{\sqrt{29}}, \dfrac{2\sqrt{5}}{5}. */
function drobKorenTex(p: TgPoZnacheniyu): string {
  return `${p.sign < 0 ? '-' : ''}\\dfrac{${coefRoot(p.a, p.r)}}{${coefRoot(p.b, p.s)}}`;
}

/**
 * Дано cos α (или sin α) с корнем и четверть угла; найти tg α. Через
 * основное тождество: квадрат второй функции, затем tg²α и знак по
 * четверти. Подвох — знак: в четверти он у синуса и косинуса свой.
 */
export function tgPoZnacheniyu(p: TgPoZnacheniyu): Draft {
  const { f, a, r, b, s, sign, q } = p;
  /* v² = P/Q. */
  const P = a * a * r;
  const Q = b * b * s;
  if (P >= Q) throw new Error('tgPoZnacheniyu: |значение| ≥ 1');
  const g = f === 'cos' ? fn('cos') : fn('sin');
  const drug = f === 'cos' ? fn('sin') : fn('cos');
  /* tg² = (Q − P)/P при данном косинусе и P/(Q − P) при данном синусе. */
  const [tn0, td0] = f === 'cos' ? [Q - P, P] : [P, Q - P];
  const [tn, td] = [tn0 / nod(tn0, td0), td0 / nod(tn0, td0)];
  const kn = Math.round(Math.sqrt(tn));
  const kd = Math.round(Math.sqrt(td));
  if (kn * kn !== tn || kd * kd !== td) throw new Error('tgPoZnacheniyu: tg не рационален');
  const plusTg = q === 1 || q === 3;
  const sinPol = q === 1 || q === 2;
  const cosPol = q === 1 || q === 4;
  const znakDannoy = f === 'cos' ? cosPol : sinPol;
  if (sign > 0 !== znakDannoy) throw new Error('tgPoZnacheniyu: знак не по четверти');
  const otvet = round9(((plusTg ? 1 : -1) * kn) / kd);
  if (!konechnaya(otvet)) throw new Error('tgPoZnacheniyu: tg — бесконечная дробь');
  const sinZnak = sinPol ? 'положителен' : 'отрицателен';
  const cosZnak = cosPol ? 'положителен' : 'отрицателен';
  return {
    uslovie: `Найдите $${fn('tg')}\\alpha$, если $${g}\\alpha = ${drobKorenTex(p)}$ и $\\alpha\\in${quarterInterval(q)}$.`,
    otvet,
    razbor: [
      shag(
        `Находим $${drug}^2\\alpha$ из основного тождества $\\sin^2\\alpha + \\cos^2\\alpha = 1$`,
        `${drug}^2\\alpha = 1-${g}^2\\alpha = 1-\\left(${drobKorenTex(p)}\\right)^2 = 1-${drob(P, Q)}${frac(P, Q) === drob(P, Q) ? '' : ` = 1-${frac(P, Q)}`} = ${frac(Q - P, Q)}`,
      ),
      shag(
        'Тангенс — отношение синуса к косинусу. Делим квадраты: знаменатели у дробей одинаковые и сокращаются',
        `${fn('tg')}^2\\alpha = \\dfrac{\\sin^2\\alpha}{\\cos^2\\alpha} = ${f === 'cos' ? `${frac(Q - P, Q)} : ${frac(P, Q)}` : `${frac(P, Q)} : ${frac(Q - P, Q)}`} = ${frac(tn, td)}`,
      ),
      shag(
        'Извлекаем корень — получаем модуль тангенса',
        `|${fn('tg')}\\alpha| = \\sqrt{${frac(tn, td)}} = ${frac(kn, kd)}`,
      ),
      shag(
        `При $\\alpha\\in${quarterInterval(q)}$ ${
          sinPol === cosPol
            ? `и синус, и косинус ${sinPol ? 'положительны' : 'отрицательны'}`
            : `синус ${sinZnak}, а косинус ${cosZnak}`
        }, поэтому тангенс ${plusTg ? 'положителен' : 'отрицателен'}`,
        `${fn('tg')}\\alpha = ${plusTg ? '' : '-'}${frac(kn, kd)}${kd === 1 ? '' : ` = ${d(otvet)}`}`,
      ),
    ],
    params: { f, a, r, b, s, sign, q },
    proverka: (() => {
      const v = (sign * a * Math.sqrt(r)) / (b * Math.sqrt(s));
      /* Угол в нужной четверти по значению: арккосинус или арксинус, затем отражения. */
      let al: number;
      if (f === 'cos') al = q === 1 || q === 2 ? Math.acos(v) : 2 * Math.PI - Math.acos(v);
      else al = q === 1 || q === 4 ? Math.asin(v) : Math.PI - Math.asin(v);
      return Math.tan(al);
    })(),
    signature: `tg:${f}:${a}:${r}:${b}:${s}:${sign}:${q}`,
  };
}

/* ── Партия 4 (варианты 19–24) ──────────────────────────────────── */

/** Степень с показателем в скобках при отрицательном: 6^{-3{,}7}. */
const st = (osn: number, e: number) => `${osn}^{${d(e)}}`;

/**
 * Произведение и частное степеней с основаниями a, b и a·b, показатели
 * — десятичные дроби:
 *  vid 'ab'  — aˣ·bʸ / (ab)ᶻ;
 *  vid 'abb' — (ab)ˣ·bʸ / aᶻ.
 * Подвох — разложить ab на множители и собрать показатели при a и при b
 * отдельно: дробные части сокращаются, остаются целые степени.
 */
export function stepeniTriOsnovaniya(p: {
  vid: string;
  a: number;
  b: number;
  x: number;
  y: number;
  z: number;
}): Draft {
  const { vid, a, b, x, y, z } = p;
  const ab = a * b;
  const ea = round9(vid === 'ab' ? x - z : x - z);
  const eb = round9(vid === 'ab' ? y - z : x + y);
  if (!Number.isInteger(ea) || !Number.isInteger(eb))
    throw new Error(`№8: показатели не целые ${JSON.stringify(p)}`);
  const otvet = round9(a ** ea * b ** eb);
  if (!konechnaya(otvet)) throw new Error(`№8: ответ ${otvet} — не конечная дробь`);
  const vyr =
    vid === 'ab'
      ? `\\dfrac{${st(a, x)}\\cdot ${st(b, y)}}{${st(ab, z)}}`
      : `\\dfrac{${st(ab, x)}\\cdot ${st(b, y)}}{${st(a, z)}}`;
  const pr = (v: number) => (v < 0 ? `(${d(v)})` : d(v));
  const stp = (osn: number, e: number) => (e === 1 ? `${osn}` : `${osn}^{${e}}`);
  const itogo = `${stp(a, ea)}\\cdot ${stp(b, eb)}`;
  /* Положительные степени — в числитель, отрицательные — в знаменатель. */
  const verh = [...(ea > 0 ? [a ** ea] : []), ...(eb > 0 ? [b ** eb] : [])];
  const niz = [...(ea < 0 ? [a ** -ea] : []), ...(eb < 0 ? [b ** -eb] : [])];
  const chisla = niz.length === 0 ? proizv(verh) : `\\dfrac{${proizv(verh)}}{${proizv(niz)}}`;
  return {
    uslovie: `Найдите значение выражения $${vyr}$.`,
    otvet,
    razbor: [
      vid === 'ab'
        ? shag(
            `Раскладываем основание знаменателя: $${ab} = ${a}\\cdot ${b}$, а степень произведения — произведение степеней`,
            `${st(ab, z)} = ${st(a, z)}\\cdot ${st(b, z)}`,
          )
        : shag(
            `Раскладываем основание в числителе: $${ab} = ${a}\\cdot ${b}$, а степень произведения — произведение степеней`,
            `${st(ab, x)} = ${st(a, x)}\\cdot ${st(b, x)}`,
          ),
      vid === 'ab'
        ? shag(
            'Делим степени с одинаковыми основаниями — показатели вычитаются, и дробные части уходят',
            `\\dfrac{${st(a, x)}\\cdot ${st(b, y)}}{${st(a, z)}\\cdot ${st(b, z)}} = ${a}^{${d(x)}-${pr(z)}}\\cdot ${b}^{${d(y)}-${pr(z)}} = ${itogo}`,
          )
        : shag(
            'Собираем степени с одинаковыми основаниями: при делении показатели вычитаются, при умножении складываются — дробные части уходят',
            `\\dfrac{${st(a, x)}\\cdot ${st(b, x)}\\cdot ${st(b, y)}}{${st(a, z)}} = ${a}^{${d(x)}-${pr(z)}}\\cdot ${b}^{${d(x)}+${pr(y)}} = ${itogo}`,
          ),
      shag(
        ea < 0 || eb < 0
          ? 'Отрицательный показатель — это дробь: $a^{-n} = \\dfrac{1}{a^{n}}$'
          : 'Считаем степени и перемножаем',
        [itogo, chisla, d(otvet)].filter((x, i, xs) => i === 0 || x !== xs[i - 1]).join(' = '),
      ),
    ],
    params: { vid, a, b, x, y, z },
    proverka:
      vid === 'ab'
        ? Math.exp(x * Math.log(a) + y * Math.log(b) - z * Math.log(ab))
        : Math.exp(x * Math.log(ab) + y * Math.log(b) - z * Math.log(a)),
    signature: `st3:${vid}:${a}:${b}:${x}:${y}:${z}`,
  };
}

/** log_c arg = k: число под логарифмом — степень основания, и показатель — ответ. */
function stepenOsnovaniya(c: number, arg: number, k: number): Shag {
  const L = (v: string) => log(d(c), v);
  const C = d(c);
  if (k === 0) return shag('Логарифм единицы по любому основанию равен нулю', `${L('1')} = 0`);
  if (k === 1)
    return shag(
      'Под логарифмом получилось само основание, а $\\log_{a} a = 1$',
      `${L(d(arg))} = 1`,
    );
  if (k > 0)
    return shag(
      `Записываем $${d(arg)}$ как степень основания: $${d(arg)} = ${C}^{${k}}$`,
      `${L(d(arg))} = ${L(`${C}^{${k}}`)} = ${k}`,
    );
  if (c > 1) {
    /* Число меньше единицы: 1/cⁿ = c⁻ⁿ. */
    const inv = round9(1 / arg);
    return shag(
      'Число меньше единицы — записываем его дробью, а дробь — отрицательной степенью основания: $\\dfrac{1}{a^{n}} = a^{-n}$',
      `${L(d(arg))} = ${L(`\\dfrac{1}{${d(inv)}}`)} = ${
        k === -1 ? '' : `${L(`\\dfrac{1}{${C}^{${-k}}}`)} = `
      }${L(`${C}^{${k}}`)} = ${k}`,
    );
  }
  /* Основание меньше единицы, число больше: 1/c — целое, это c⁻¹. */
  const ic = round9(1 / c);
  return shag(
    `Основание меньше единицы, а число больше — показатель отрицательный: $${d(ic)} = \\dfrac{1}{${C}} = ${C}^{-1}$`,
    `${L(d(arg))} = ${
      k === -1
        ? `${L(`${C}^{-1}`)}`
        : `${L(`${d(ic)}^{${-k}}`)} = ${L(`\\left(${C}^{-1}\\right)^{${-k}}`)} = ${L(`${C}^{${k}}`)}`
    } = ${k}`,
  );
}

/**
 * log_c x − log_c y (znak −1) или log_c x + log_c y (znak 1), основание
 * c — десятичная дробь (2,5; 0,2). Подвох — свернуть в log_c(x/y) или
 * log_c(xy) и увидеть степень основания, в том числе отрицательную.
 */
export function logRaznost(p: { c: number; x: number; y: number; znak: number }): Draft {
  const { c, x, y, znak } = p;
  const arg = round9(znak > 0 ? x * y : x / y);
  const k = Math.round(Math.log(arg) / Math.log(c));
  if (Math.abs(c ** k - arg) > 1e-9) throw new Error(`№8: ${arg} — не степень ${c}`);
  const zn = znak > 0 ? '+' : '-';
  const svernuto = znak > 0 ? `${d(x)}\\cdot ${d(y)}` : `\\dfrac{${d(x)}}{${d(y)}}`;
  return {
    uslovie: `Найдите значение выражения $${log(d(c), d(x))} ${zn} ${log(d(c), d(y))}$.`,
    otvet: k,
    razbor: [
      shag(
        `Основания одинаковые, поэтому ${znak > 0 ? 'сумма логарифмов — логарифм произведения' : 'разность логарифмов — логарифм частного'}`,
        `${log(d(c), d(x))} ${zn} ${log(d(c), d(y))} = ${log(d(c), `\\left(${svernuto}\\right)`)} = ${log(d(c), d(arg))}`,
      ),
      stepenOsnovaniya(c, arg, k),
    ],
    params: { c, x, y, znak },
    proverka: (Math.log(x) + znak * Math.log(y)) / Math.log(c),
    signature: `logr:${c}:${x}:${y}:${znak}`,
  };
}

/**
 * Сумма дробей 1/n со знаками (n = 1 — единица): общий знаменатель —
 * наименьшее общее кратное, потом сокращение. 1/5 + 1/20 = (4 + 1)/20.
 */
function summaDrobey(plus: number[], minus: number[]): { tex: string; L: number } {
  const vse = [...plus, ...minus];
  const L = vse.reduce((s, n) => (s / nod(s, n)) * n, 1);
  const chlen = (n: number) => (n === 1 ? '1' : `\\dfrac{1}{${n}}`);
  const sleva = `${plus.map(chlen).join('+')}${minus.map((n) => `-${chlen(n)}`).join('')}`;
  const chisl = `${plus.map((n) => L / n).join('+')}${minus.map((n) => `-${L / n}`).join('')}`;
  const S = plus.reduce((s, n) => s + L / n, 0) - minus.reduce((s, n) => s + L / n, 0);
  const g = nod(Math.abs(S), L) || 1;
  const [P, Q] = [S / g, L / g];
  const parts = [
    sleva,
    `\\dfrac{${chisl}}{${L}}`,
    `${S < 0 ? '-' : ''}\\dfrac{${Math.abs(S)}}{${L}}`,
  ];
  if (g !== 1) parts.push(Q === 1 ? `${P}` : `${P < 0 ? '-' : ''}\\dfrac{${Math.abs(P)}}{${Q}}`);
  return { tex: parts.join(' = '), L };
}

/** A^{p/q} при A = r^q: записать A степенью, показатели перемножаются. */
function stepenSDrobnym(A: number, pe: number, qe: number, zn: number): Shag {
  const fe = `\\frac{${pe}}{${qe}}`;
  if (qe === 1) return shag('Считаем степень', `${A}^{${pe}} = ${d(zn)}`);
  const r = Math.round(A ** (1 / qe));
  if (r ** qe !== A) {
    return shag(`Показатель $${fe}$ — это корень степени $${qe}$`, `${A}^{${fe}} = ${d(zn)}`);
  }
  return shag(
    `Записываем $${A}$ степенью: $${A} = ${r}^{${qe}}$. Степень в степени — показатели перемножаются`,
    `${A}^{${fe}} = \\left(${r}^{${qe}}\\right)^{${fe}} = ${pe === 1 ? '' : `${r}^{${pe}} = `}${d(zn)}`,
  );
}

/**
 * k·ⁿ√A·ᵐ√A: корни разных степеней из одного числа A. Подвох — перейти
 * к степеням с дробными показателями и сложить их: A^(1/n + 1/m).
 */
export function korniProizvedenie(p: { k: number; A: number; n: number; m: number }): Draft {
  const { k, A, n, m } = p;
  const num = m + n;
  const den = n * m;
  const g = nod(num, den);
  const pe = num / g;
  const qe = den / g;
  const zn = Math.round(A ** (pe / qe));
  if (Math.abs(zn - A ** (pe / qe)) > 1e-6) throw new Error(`№8: ${A}^(${pe}/${qe}) не целое`);
  const otvet = k * zn;
  const koren = (s: number) => (s === 2 ? `\\sqrt{${A}}` : `\\sqrt[${s}]{${A}}`);
  const summa = summaDrobey([n, m], []);
  const razbor: Shag[] = [
    shag(
      'Записываем корни степенями с дробными показателями: $\\sqrt[n]{a} = a^{\\frac{1}{n}}$. Основания одинаковые — при умножении показатели складываются',
      `${koren(n)}\\cdot ${koren(m)} = ${A}^{\\frac{1}{${n}}}\\cdot ${A}^{\\frac{1}{${m}}} = ${A}^{\\frac{1}{${n}}+\\frac{1}{${m}}}`,
    ),
    shag(`Складываем дроби в показателе: приводим их к общему знаменателю $${summa.L}$`, summa.tex),
    stepenSDrobnym(A, pe, qe, zn),
  ];
  if (k !== 1) {
    razbor.push(
      shag(`Умножаем на множитель $${k}$, стоящий перед корнями`, `${k}\\cdot ${zn} = ${otvet}`),
    );
  }
  return {
    uslovie: `Найдите значение выражения $${k === 1 ? '' : `${k}\\cdot `}${koren(n)}\\cdot ${koren(m)}$.`,
    otvet,
    razbor,
    params: { k, A, n, m },
    proverka: k * A ** (1 / n) * A ** (1 / m),
    signature: `kpr:${k}:${A}:${n}:${m}`,
  };
}

/* ── Партия 5 (варианты 25–30) ──────────────────────────────────── */

/**
 * (1 − log_a(a·bᵐ))·(1 − log_b(b·aⁿ)): каждая скобка — минус логарифм
 * второго числа, (−m·log_a b)·(−n·log_b a) = m·n. Подвох — увидеть
 * в 1 логарифм основания и что log_a b·log_b a = 1.
 */
export function logSkobki(p: { a: number; b: number; m: number; n: number }): Draft {
  const { a, b, m, n } = p;
  const X = a * b ** m;
  const Y = b * a ** n;
  const otvet = m * n;
  const st = (c: number, k: number) => (k === 1 ? `${c}` : `${c}^{${k}}`);
  const lab = log(String(a), String(b));
  const lba = log(String(b), String(a));
  const km = m === 1 ? '' : String(m);
  const kn = n === 1 ? '' : String(n);
  return {
    uslovie: `Найдите значение выражения $\\left(1-${log(String(a), String(X))}\\right)\\left(1-${log(String(b), String(Y))}\\right)$.`,
    otvet,
    razbor: [
      shag(
        'Раскладываем числа под логарифмами: в каждом есть множитель, равный основанию логарифма',
        `${X} = ${a}\\cdot ${st(b, m)},\\quad ${Y} = ${b}\\cdot ${st(a, n)}`,
      ),
      shag(
        `Логарифм произведения — сумма логарифмов, $${log(String(a), String(a))} = 1$${m === 1 ? '' : ', а показатель степени выносим множителем'}. Единицы взаимно уничтожаются`,
        `1-${log(String(a), String(X))} = 1-\\left(${log(String(a), String(a))}+${log(String(a), st(b, m))}\\right) = 1-1-${km}${lab} = -${km}${lab}`,
      ),
      shag(
        'Так же раскладываем вторую скобку',
        `1-${log(String(b), String(Y))} = 1-\\left(${log(String(b), String(b))}+${log(String(b), st(a, n))}\\right) = -${kn}${lba}`,
      ),
      shag(
        `Перемножаем скобки: минус на минус даёт плюс, а $${lab}\\cdot ${lba} = 1$ — эти логарифмы взаимно обратны`,
        `\\left(-${km}${lab}\\right)\\left(-${kn}${lba}\\right) = ${m * n === 1 ? '' : m * n}${lab}\\cdot ${lba} = ${m * n === 1 ? '' : `${m * n}\\cdot 1 = `}${otvet}`,
      ),
    ],
    params: { a, b, m, n },
    proverka: (1 - Math.log(X) / Math.log(a)) * (1 - Math.log(Y) / Math.log(b)),
    signature: `logsk:${a}:${b}:${m}:${n}`,
  };
}

/**
 * log_a N : (k + log_a c), где N = (aᵏ·c)ᵐ: знаменатель — логарифм
 * aᵏ·c, числитель — m таких логарифмов. vid 'pryamo' — ответ m;
 * vid 'obratno' (дробь перевёрнута) — 1/m. Подвох — записать k как
 * log_a aᵏ и собрать знаменатель в один логарифм.
 */
export function logDrobSumma(p: {
  a: number;
  k: number;
  c: number;
  m: number;
  vid: 'pryamo' | 'obratno';
}): Draft {
  const { a, k, c, m, vid } = p;
  const M = a ** k * c;
  const N = M ** m;
  const lN = log(String(a), String(N));
  const zn = `${k}+${log(String(a), String(c))}`;
  const otvet = vid === 'obratno' ? round9(1 / m) : m;
  if (!konechnaya(otvet)) throw new Error(`logDrobSumma: 1/${m} — бесконечная дробь`);
  return {
    uslovie:
      vid === 'obratno'
        ? `Найдите значение выражения $\\dfrac{${zn}}{${lN}}$.`
        : `Найдите значение выражения $\\dfrac{${lN}}{${zn}}$.`,
    otvet,
    razbor: [
      shag(
        `Записываем $${k}$ как логарифм по основанию $${a}$: $${k} = ${k === 1 ? '' : `${log(String(a), `${a}^{${k}}`)} = `}${log(String(a), String(a ** k))}$. Сумма логарифмов — логарифм произведения`,
        `${zn} = ${log(String(a), String(a ** k))}+${log(String(a), String(c))} = ${log(String(a), String(M))}`,
      ),
      ...(m === 1
        ? []
        : [
            shag(
              `Замечаем, что $${N} = ${M}^{${m}}$ — степень того же числа $${M}$. Показатель выносим множителем`,
              `${lN} = ${log(String(a), `${M}^{${m}}`)} = ${m}${log(String(a), String(M))}`,
            ),
          ]),
      shag(
        `Сокращаем дробь на $${log(String(a), String(M))}$ — он не равен нулю`,
        vid === 'obratno'
          ? `\\dfrac{${zn}}{${lN}} = \\dfrac{${log(String(a), String(M))}}{${m === 1 ? '' : m}${log(String(a), String(M))}} = ${m === 1 ? '' : `\\dfrac{1}{${m}} = `}${d(otvet)}`
          : `\\dfrac{${lN}}{${zn}} = \\dfrac{${m === 1 ? '' : m}${log(String(a), String(M))}}{${log(String(a), String(M))}} = ${otvet}`,
      ),
    ],
    params: { a, k, c, m, vid },
    proverka: (() => {
      const num = Math.log(N) / Math.log(a);
      const den = k + Math.log(c) / Math.log(a);
      return vid === 'obratno' ? den / num : num / den;
    })(),
    signature: `logdr:${vid}:${a}:${k}:${c}:${m}`,
  };
}

/**
 * (b^s1)^x · (b^s2)^y: оба основания — степени b, показатели дробные,
 * сумма s1·x + s2·y целая. Ответ b^(s1·x + s2·y).
 */
export function stepeniProizvedenie(p: {
  b: number;
  s1: number;
  s2: number;
  x: number;
  y: number;
}): Draft {
  const { b, s1, s2, x, y } = p;
  const B1 = b ** s1;
  const B2 = b ** s2;
  const e1 = round9(s1 * x);
  const e2 = round9(s2 * y);
  const e = round9(e1 + e2);
  const otvet = round9(b ** e);
  if (!konechnaya(otvet))
    throw new Error(`stepeniProizvedenie: ответ ${otvet} — не конечная дробь`);
  return {
    uslovie: `Найдите значение выражения $${B1}^{${d(x)}}\\cdot ${B2}^{${d(y)}}$.`,
    otvet,
    razbor: razborDvuhStepeney(p, e1, e2, e, otvet, 'umn'),
    params: { b, s1, s2, x, y },
    proverka: B1 ** x * B2 ** y,
    signature: `stpr:${b}:${s1}:${s2}:${x}:${y}`,
  };
}

/**
 * A·sin α·cos α при α = n·π/den: это (A/2)·sin 2α, у угла 2α табличный
 * синус ±1/2 или ±1. Подвох — увидеть половину синуса двойного угла и
 * не ошибиться со знаком при приведении.
 */
export function sinCosProizvedenie(p: { A: number; n: number; den: number }): Draft {
  const { A, n, den } = p;
  const cep = trigCepochka(['sin', 2 * n, den]);
  const { zn, s, D } = cep.z;
  if (s !== 1) throw new Error(`sinCosProizvedenie: sin 2α = ±√${s}/${D} — с корнем`);
  const otvet = round9((zn * A) / (2 * D));
  if (!konechnaya(otvet))
    throw new Error(`sinCosProizvedenie: ${zn * A}/${2 * D} — бесконечная дробь`);
  const ugol = rad(n, den);
  return {
    uslovie: `Найдите значение выражения $${A}${fn('sin')}${ugol}\\cdot${fn('cos')}${ugol}$.`,
    otvet,
    razbor: [
      shag(
        'Синус двойного угла: $2\\sin\\alpha\\cos\\alpha = \\sin 2\\alpha$, поэтому выделяем из коэффициента множитель $2$',
        `${A}${fn('sin')}${ugol}\\cdot${fn('cos')}${ugol} = ${d(A / 2)}\\cdot 2${fn('sin')}${ugol}${fn('cos')}${ugol} = ${d(A / 2)}${fn('sin')}${rad(2 * n, den)}`,
      ),
      shag(cep.chto, cep.tex),
      shag(
        'Подставляем значение синуса и умножаем',
        `${d(A / 2)}${fn('sin')}${rad(2 * n, den)} = ${d(A / 2)}\\cdot ${skTex(znachTex(cep.z))} = ${
          Number.isInteger(A / 2) && D !== 1 && (A / 2) % D !== 0
            ? `${zn < 0 ? '-' : ''}\\dfrac{${A / 2}}{${D}} = `
            : ''
        }${d(otvet)}`,
      ),
    ],
    params: { A, n, den },
    proverka: A * Math.sin((n * Math.PI) / den) * Math.cos((n * Math.PI) / den),
    signature: `sincos:${A}:${n}:${den}`,
  };
}

/* ── Партия 6 (варианты 31–36) ──────────────────────────────────── */

/**
 * (B₁^x₁)^x₂ : (B₂^y₁)^y₂, где B₁ = b^s1, B₂ = b^s2. Подвох — степень
 * в степени: показатели перемножаются (а не складываются), а оба
 * основания надо свести к одному числу b.
 */
export function stepeniVlozhennye(p: {
  b: number;
  s1: number;
  s2: number;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}): Draft {
  const { b, s1, s2, x1, x2, y1, y2 } = p;
  const B1 = b ** s1;
  const B2 = b ** s2;
  const e1 = s1 * x1 * x2;
  const e2 = s2 * y1 * y2;
  const e = e1 - e2;
  const otvet = round9(b ** e);
  if (!konechnaya(otvet)) throw new Error(`№8: ${b}^${e} — не конечная дробь`);
  /* Скобки после записи оснований степенями b; при s = 1 основание уже b. */
  const skobki = (s: number, p1: number, p2: number) =>
    s === 1
      ? `\\left(${b}^{${p1}}\\right)^{${p2}}`
      : `\\left(\\left(${b}^{${s}}\\right)^{${p1}}\\right)^{${p2}}`;
  const pokaz = (s: number, p1: number, p2: number) =>
    s === 1 ? `${p1}\\cdot ${p2}` : `${s}\\cdot ${p1}\\cdot ${p2}`;
  const zapis = [B1, B2].map((B, i) => ({ B, s: i === 0 ? s1 : s2 })).filter((x) => x.s !== 1);
  const levo = `${skobki(s1, x1, x2)} : ${skobki(s2, y1, y2)}`;
  const razbor: Shag[] = [
    shag(
      zapis.length === 1
        ? `Записываем $${zapis[0]?.B}$ как степень числа $${b}$: $${zapis[0]?.B} = ${b}^{${zapis[0]?.s}}$`
        : `Записываем $${B1}$ и $${B2}$ как степени числа $${b}$: $${B1} = ${b}^{${s1}}$, $${B2} = ${b}^{${s2}}$`,
      `\\left(${B1}^{${x1}}\\right)^{${x2}}:\\left(${B2}^{${y1}}\\right)^{${y2}} = ${levo}`,
    ),
    shag(
      'Степень в степени — показатели перемножаются, сколько бы скобок ни было',
      `${levo} = ${b}^{${pokaz(s1, x1, x2)}} : ${b}^{${pokaz(s2, y1, y2)}} = ${b}^{${e1}} : ${b}^{${e2}}`,
    ),
    shag(
      'Основания одинаковые — при делении показатели вычитаются. Большие степени не считаем',
      `${b}^{${e1}} : ${b}^{${e2}} = ${b}^{${e1} - ${e2}} = ${b}^{${e}}`,
    ),
    stepenChislom(b, e, otvet),
  ];
  return {
    uslovie: `Найдите значение выражения $\\left(${B1}^{${x1}}\\right)^{${x2}}:\\left(${B2}^{${y1}}\\right)^{${y2}}$.`,
    otvet,
    razbor,
    params: { b, s1, s2, x1, x2, y1, y2 },
    proverka: Math.exp(x1 * x2 * Math.log(B1) - y1 * y2 * Math.log(B2)),
    signature: `stvl:${b}:${s1}:${s2}:${x1}:${x2}:${y1}:${y2}`,
  };
}

/**
 * k·cos 2α по sin α или cos α (знак не важен). Подвох — выбрать формулу
 * двойного угла под данную функцию: 1 − 2sin²α или 2cos²α − 1.
 */
export function cosDvoynogoPo(p: { given: 'sin' | 'cos'; s: number; k: number }): Draft {
  const { given, s, k } = p;
  const s2 = round9(s * s);
  const c2 = round9(given === 'sin' ? 1 - 2 * s2 : 2 * s2 - 1);
  const otvet = round9(k * c2);
  const formula = given === 'sin' ? '1-2\\sin^2\\alpha' : '2\\cos^2\\alpha-1';
  const mn = (x: number) => (x < 0 ? `(${d(x)})` : d(x));
  return {
    uslovie: `Найдите $${k === 1 ? '' : k}\\cos 2\\alpha$, если $\\${given}\\alpha=${d(s)}$.`,
    otvet,
    razbor: [
      shag(
        `Дан $\\${given}\\alpha$, поэтому берём формулу косинуса двойного угла через ту же функцию`,
        `\\cos2\\alpha=${formula}=${given === 'sin' ? `1-2\\cdot${mn(s)}^2` : `2\\cdot${mn(s)}^2-1`}`,
      ),
      shag(
        `Возводим в квадрат — знак $\\${given}\\alpha$ при этом не важен — и считаем`,
        given === 'sin'
          ? `1-2\\cdot${mn(s)}^2=1-2\\cdot${d(s2)}=${d(c2)}`
          : `2\\cdot${mn(s)}^2-1=2\\cdot${d(s2)}-1=${d(c2)}`,
      ),
      ...(k === 1
        ? []
        : [
            /* 25·0,28: умножить на 25 — то же, что разделить на 4 число сотых. */
            100 % k === 0 && k >= 20
              ? shag(
                  `Умножаем на $${k}$: это то же, что разделить на $${100 / k}$ число сотых, ведь $${d(Math.abs(c2))} = \\dfrac{${Math.round(Math.abs(c2) * 100)}}{100}$`,
                  `${k}\\cdot${mn(c2)}=${c2 < 0 ? '-' : ''}\\dfrac{${Math.round(Math.abs(c2) * 100)}}{${100 / k}}=${d(otvet)}`,
                )
              : shag(`Умножаем на коэффициент $${k}$`, `${k}\\cdot${mn(c2)}=${d(otvet)}`),
          ]),
    ],
    params: { given, s, k },
    proverka: k * Math.cos(2 * (given === 'sin' ? Math.asin(s) : Math.acos(s))),
    signature: `cos2po:${given}:${s}:${k}`,
  };
}

/**
 * Дробь из корней разных степеней одной переменной (и самой переменной)
 * при заданном значении: показатель — сумма 1/n по числителю минус
 * сумма по знаменателю. Подвох — не подставлять число сразу (корни
 * не извлекаются), а сначала свести всё к одной степени.
 */
export function korniDrob(p: { v: string; A: number; chisl: number[]; znam: number[] }): Draft {
  const { v, A, chisl, znam } = p;
  /* Показатель — несократимая дробь P/Q: сумма 1/n с плюсом и минусом. */
  let P = 0;
  let Q = 1;
  const dob = (n: number, z: number) => {
    P = P * n + z * Q;
    Q *= n;
    const g = nod(Math.abs(P), Q) || 1;
    P /= g;
    Q /= g;
  };
  chisl.forEach((n) => dob(n, 1));
  znam.forEach((n) => dob(n, -1));
  const otvet = round9(A ** (P / Q));
  if (!konechnaya(otvet) || otvet === 0)
    throw new Error(`№8: ${A}^(${P}/${Q}) — не конечная дробь`);
  const vA = d(A);
  const koren = (n: number) => (n === 1 ? v : n === 2 ? `\\sqrt{${v}}` : `\\sqrt[${n}]{${v}}`);
  const korni = (xs: number[]) => xs.map(koren).join('\\cdot ');
  const st = (n: number) => (n === 1 ? v : `${v}^{\\frac{1}{${n}}}`);
  const stepeni = (xs: number[]) => xs.map(st).join('\\cdot ');
  const fe = Q === 1 ? `${P}` : `${P < 0 ? '-' : ''}\\frac{${Math.abs(P)}}{${Q}}`;
  const chlen = (n: number) => (n === 1 ? '1' : `\\frac{1}{${n}}`);
  const pokazateli = `${chisl.map(chlen).join('+')}${znam.map((n) => `-${chlen(n)}`).join('')}`;
  const summa = summaDrobey(chisl, znam);
  const vyrazhenie = `\\dfrac{${korni(chisl)}}{${korni(znam)}}`;
  /* Подстановка: показатель −1 — обратное число; иначе A = rᵠ. */
  let podstanovka: Shag;
  let delimost: ReturnType<typeof priznakiDlya> = [];
  const dec = (String(A).split('.')[1] ?? '').length;
  const r = Math.round(A ** (1 / Q));
  if (P === -1 && Q === 1) {
    const num = 10 ** dec;
    const den = Math.round(A * num);
    const g = nod(num, den);
    const sokr = g > 1 && den / g !== 1 ? ` = ${drob(num / g, den / g)}` : '';
    if (g % 25 === 0) delimost = priznakiDlya(g);
    podstanovka = shag(
      `Подставляем $${v} = ${vA}$: показатель $-1$ — это обратное число${
        dec === 0
          ? ''
          : `. Избавляемся от запятой: умножаем числитель и знаменатель на $${num}$${
              sokr === ''
                ? ''
                : `, затем сокращаем на $${g}$${g % 25 === 0 ? ' — делимость на $25$ видна по двум последним цифрам' : ''}`
            }`
      }`,
      `${v}^{-1} = \\dfrac{1}{${vA}}${dec === 0 ? '' : ` = ${drob(num, den)}${sokr}`} = ${d(otvet)}`,
    );
  } else if (Q === 1) {
    podstanovka = shag(`Подставляем $${v} = ${vA}$`, `${v}^{${fe}} = ${vA}^{${fe}} = ${d(otvet)}`);
  } else if (dec === 0 && r ** Q === A) {
    podstanovka = shag(
      `Подставляем $${v} = ${vA}$ и записываем это число степенью: $${vA} = ${r}^{${Q}}$. Степень в степени — показатели перемножаются`,
      `${v}^{${fe}} = ${vA}^{${fe}} = \\left(${r}^{${Q}}\\right)^{${fe}} = ${P === 1 ? '' : `${r}^{${P}} = `}${d(otvet)}`,
    );
  } else {
    podstanovka = shag(`Подставляем $${v} = ${vA}$`, `${v}^{${fe}} = ${vA}^{${fe}} = ${d(otvet)}`);
  }
  return {
    uslovie: `Найдите значение выражения $${vyrazhenie}$ при $${v}=${vA}$.`,
    otvet,
    razbor: [
      shag(
        'Записываем корни степенями с дробными показателями: $\\sqrt[n]{x} = x^{\\frac{1}{n}}$',
        `${vyrazhenie} = \\dfrac{${stepeni(chisl)}}{${stepeni(znam)}}`,
      ),
      shag(
        'Основание одно: при умножении показатели складываются, при делении — вычитаются',
        `\\dfrac{${stepeni(chisl)}}{${stepeni(znam)}} = ${v}^{${pokazateli}}`,
      ),
      shag(`Считаем показатель: приводим дроби к общему знаменателю $${summa.L}$`, summa.tex),
      podstanovka,
    ],
    ...(delimost.length === 0 ? {} : { delimost }),
    params: { v, A, chisl: chisl.join(','), znam: znam.join(',') },
    proverka:
      chisl.reduce((s, n) => s * A ** (1 / n), 1) / znam.reduce((s, n) => s * A ** (1 / n), 1),
    signature: `kdr:${v}:${A}:${chisl.join(',')}:${znam.join(',')}`,
  };
}
