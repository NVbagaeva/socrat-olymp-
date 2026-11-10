/**
 * Группа IV, преобразование числовых тригонометрических выражений:
 * 8.Q, 8.R, 8.S, 8.T, 8.U, 8.V.
 */

import { gcd, nice, round9 } from '../numbers';
import type { Rng } from '../rng';
import { coefRoot, d, deg, fn, rad } from '../tex';
import type { Draft, Priznak, Prototype, Shag } from '../types';
import { keys, naydi, podtip, priznakiDlya, shag } from './common';

type Fn = 'sin' | 'cos' | 'tg';

/** Табличное значение как рациональное число × √r: {v, r}. */
interface Tab {
  v: number;
  r: 1 | 2 | 3;
}

/** Значение sin/cos/tg табличного угла в градусах. null — не табличный. */
export function table(f: Fn, angle: number): Tab | null {
  const a = ((angle % 360) + 360) % 360;
  const ref = a <= 90 ? a : a <= 180 ? 180 - a : a <= 270 ? a - 180 : 360 - a;
  const sinTab: Record<number, Tab> = {
    0: { v: 0, r: 1 },
    30: { v: 1 / 2, r: 1 },
    45: { v: 1 / 2, r: 2 },
    60: { v: 1 / 2, r: 3 },
    90: { v: 1, r: 1 },
  };
  const s = sinTab[ref];
  const c = sinTab[90 - ref];
  if (s === undefined || c === undefined) {
    return null;
  }
  const sinSign = a < 180 ? 1 : -1;
  const cosSign = a < 90 || a > 270 ? 1 : -1;
  if (f === 'sin') {
    return { v: s.v * sinSign, r: s.r };
  }
  if (f === 'cos') {
    return { v: c.v * cosSign, r: c.r };
  }
  if (c.v === 0) {
    return null;
  }
  /* tg = sin/cos: 1, √3, √3/3 со знаком. */
  const sign = sinSign * cosSign;
  if (ref === 45) {
    return { v: sign, r: 1 };
  }
  if (ref === 60) {
    return { v: sign, r: 3 };
  }
  if (ref === 30) {
    return { v: sign / 3, r: 3 };
  }
  return { v: 0, r: 1 };
}

/** Угол в радианах из градусов. */
function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Численное значение функции угла в градусах — для независимой проверки. */
function numeric(f: Fn, degrees: number): number {
  const x = toRad(degrees);
  return f === 'sin' ? Math.sin(x) : f === 'cos' ? Math.cos(x) : Math.tan(x);
}

/** Произведение двух табличных значений: рациональная часть и радикал. */
function multiply(a: Tab, b: Tab): { v: number; r: number } {
  let v = a.v * b.v;
  let r = a.r * b.r;
  if (r === 4) {
    v *= 2;
    r = 1;
  }
  if (r === 9) {
    v *= 3;
    r = 1;
  }
  return { v, r };
}

/** Запись угла: в градусах или радианах, отрицательный — в скобках. */
function angleTex(degrees: number, radians: boolean): string {
  if (!radians) {
    return deg(degrees);
  }
  const g = gcd(Math.abs(degrees), 180);
  const s = rad(degrees / g, 180 / g);
  return degrees < 0 ? `\\left(${s}\\right)` : s;
}

/** Табличное значение как текст: \frac{\sqrt{2}}{2}, -\frac{1}{2}. */
function tabTex(t: Tab): string {
  const sign = t.v < 0 ? '-' : '';
  const av = Math.abs(t.v);
  if (t.r === 1) {
    return sign + (av === 1 ? '1' : av === 0.5 ? '\\frac{1}{2}' : d(av));
  }
  if (av === 1) {
    return `${sign}\\sqrt{${t.r}}`;
  }
  if (av === 0.5) {
    return `${sign}\\frac{\\sqrt{${t.r}}}{2}`;
  }
  return `${sign}\\frac{\\sqrt{${t.r}}}{3}`;
}

const BASE_ANGLES = [30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330];
const EXTRA_ANGLES = [
  -30, -45, -60, -120, -135, -150, -210, -225, -240, -300, -315, -330, 390, 405, 420, 480, 495, 510,
  570, 585, 600, 660, 675, 690, 750,
];

/* ── Шаги решения ─────────────────────────────────────────────── */

const IMYA: Record<Fn, string> = { sin: 'синус', cos: 'косинус', tg: 'тангенс' };

const CHETVERT = ['I', 'II', 'III', 'IV'];

/** Слово с большой буквы: «Синус». */
function sBolshoy(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Аргумент функции в скобках; в радианах скобки растягиваются под дробь. */
function vSkobkah(inner: string, radians: boolean): string {
  return radians ? `\\left(${inner}\\right)` : `(${inner})`;
}

/** Запись со знаком минус впереди, если sign < 0. */
function soZnakom(sign: number, body: string): string {
  return sign < 0 ? `-${body}` : body;
}

/** Табличное значение множителем: отрицательное — в скобках. */
function mnozhitel(t: Tab): string {
  const s = tabTex(t);
  if (t.v >= 0) {
    return s;
  }
  return s.includes('\\frac') ? `\\left(${s}\\right)` : `(${s})`;
}

/** Коэффициент перед функцией: единица не пишется. */
function bezEdinicy(s: string): string {
  return s === '1' ? '' : s;
}

/** Плюс или минус число: «+ 5», «- 11». */
function plusMinus(x: number): string {
  return `${x < 0 ? '-' : '+'} ${Math.abs(x)}`;
}

/** Дробь из множителей: \dfrac{25 \cdot 3}{2}; единицы не пишутся. */
function drob(sign: number, nums: number[], den: number): string {
  const n = nums.filter((x) => x !== 1);
  const top = n.length === 0 ? '1' : n.join(' \\cdot ');
  return soZnakom(sign, den === 1 ? top : `\\dfrac{${top}}{${den}}`);
}

/** Цепочка равенств; одинаковые звенья подряд не повторяются. */
function cep(parts: string[]): string {
  return parts.filter((p, i) => i === 0 || p !== parts[i - 1]).join(' = ');
}

/** Цифры числа через плюс и их сумма: «7 + 8 = 15». */
function summaCifr(n: number): string {
  const digits = String(n).split('');
  const sum = digits.reduce((s, x) => s + Number(x), 0);
  return `${digits.join(' + ')} = ${sum}`;
}

/**
 * Перевод дроби a/m в десятичную: знаменатель 5, 20, 25, 50 — домножаем
 * до 10 или 100; 2 и 4 — делим сразу. Звенья цепочки до ответа и
 * пояснение к подписи.
 */
function vDesyatichnuyu(sign: number, a: number, m: number): { tex: string[]; chto: string } {
  if (m === 1 || m === 2 || m === 4 || m === 10 || m === 100) {
    return { tex: [], chto: '' };
  }
  const k = 10 % m === 0 ? 10 / m : 100 % m === 0 ? 100 / m : 0;
  if (k === 0) {
    return { tex: [], chto: '' };
  }
  return {
    tex: [drob(sign, [a * k], m * k)],
    chto: `: домножаем числитель и знаменатель на $${k}$`,
  };
}

/** Значение функции угла и как угол сводится к табличному. */
interface Znachenie {
  /** f(угол) = … = табличное значение. */
  tex: string;
  /** Чётность, период, формула приведения по порядку; пусто у острого угла. */
  chto: string;
  t: Tab;
}

/**
 * Сведение угла к острому: чётность (минус у угла), период (полные
 * обороты), формула приведения (знак — по четверти). У острого угла
 * объяснять нечего: значение из таблицы.
 */
function znachenie(f: Fn, angle: number, radians: boolean): Znachenie {
  const T = (x: number): string => angleTex(x, radians);
  const F = fn(f);
  const chain = [`${F}${T(angle)}`];
  const why: string[] = [];
  let sign = 1;
  let a = angle;
  if (a < 0) {
    a = -a;
    if (f === 'cos') {
      why.push('Косинус чётный: $\\cos(-\\alpha) = \\cos\\alpha$');
    } else {
      sign = -1;
      why.push(`${sBolshoy(IMYA[f])} нечётный: $${F}(-\\alpha) = -${F}\\alpha$`);
    }
    chain.push(soZnakom(sign, `${F}${T(a)}`));
  }
  const period = f === 'tg' ? 180 : 360;
  if (a >= period) {
    const k = Math.floor(a / period);
    const rest = a - k * period;
    why.push(
      `${sBolshoy(IMYA[f])} повторяется через $${T(period)}$ — это его период, поэтому вычитаем $${T(k * period)}$${k > 1 ? ` (это $${k} \\cdot ${T(period)}$)` : ''}`,
    );
    chain.push(soZnakom(sign, `${F}${vSkobkah(`${T(a)} - ${T(k * period)}`, radians)}`));
    chain.push(soZnakom(sign, `${F}${T(rest)}`));
    a = rest;
  }
  if (a > 90) {
    const q = a < 180 ? 2 : a < 270 ? 3 : 4;
    const base = q === 4 ? 360 : 180;
    const op = q === 3 ? '+' : '-';
    const acute = q === 2 ? 180 - a : q === 3 ? a - 180 : 360 - a;
    const plus = f === 'sin' ? q === 2 : f === 'cos' ? q === 4 : q === 3;
    const formula = `${F}(${T(base)} ${op} \\alpha) = ${plus ? '' : '-'}${F}\\alpha`;
    why.push(
      `По формуле приведения $${formula}$: $${T(a)} = ${T(base)} ${op} ${T(acute)}$ — угол ${CHETVERT[q - 1]} четверти, ${IMYA[f]} там ${plus ? 'положителен' : 'отрицателен'}`,
    );
    chain.push(soZnakom(sign, `${F}${vSkobkah(`${T(base)} ${op} ${T(acute)}`, radians)}`));
    if (sign < 0 && !plus) {
      chain.push(`-\\left(-${F}${T(acute)}\\right)`);
    }
    sign = plus ? sign : -sign;
    chain.push(soZnakom(sign, `${F}${T(acute)}`));
  }
  const t = table(f, angle) as Tab;
  chain.push(tabTex(t));
  return { tex: chain.join(' = '), chto: why.join('. '), t };
}

/** Коэффициент перед значениями: c·√R / m и его запись (пустая — единица). */
interface Koef {
  c: number;
  R: number;
  m: number;
  tex: string;
}

/** Табличное значение ±√r / m по частям. */
function chasti(t: Tab): { sign: number; r: number; m: number } {
  return { sign: t.v < 0 ? -1 : 1, r: t.r, m: Math.round(1 / Math.abs(t.v)) };
}

/**
 * Дробь ±c·K / M сокращаем по частям: сначала то, что сокращается
 * сильнее (обычно число из-под корней со знаменателем), потом
 * остальное, и переводим в десятичную.
 */
function sokrashchaem(sign: number, c: number, K: number, M: number, ans: number): Shag {
  let a = c;
  let k = K;
  let m = M;
  const chain = [drob(sign, [a, k], m)];
  const why: string[] = [];
  const order: ('k' | 'a')[] = gcd(k, m) >= gcd(a, m) ? ['k', 'a'] : ['a', 'k'];
  for (const kto of order) {
    const x = kto === 'k' ? k : a;
    const g = gcd(x, m);
    if (g === 1) {
      continue;
    }
    why.push(x === m ? `$${x}$ в числителе и знаменателе` : `$${x}$ и $${m}$ на $${g}$`);
    if (kto === 'k') {
      k /= g;
    } else {
      a /= g;
    }
    m /= g;
    chain.push(drob(sign, [a, k], m));
  }
  if (a > 1 && k > 1) {
    chain.push(drob(sign, [a * k], m));
  }
  const des = vDesyatichnuyu(sign, a * k, m);
  chain.push(...des.tex, d(ans));
  let chto = why.length > 0 ? `Сокращаем ${why.join(', затем ')}` : 'Дробь несократима';
  if (m > 1) {
    chto += `${why.length > 0 ? ' и переводим дробь' : ' — переводим её'} в десятичную${des.chto}`;
  }
  return shag(chto, cep(chain));
}

/** Сокращается ли дробь ±c·K / M хоть на что-то. */
function sokrashchaetsya(c: number, K: number, M: number): boolean {
  return gcd(c, M) > 1 || gcd(K, M) > 1;
}

interface Podstanovka {
  /** Выражение, куда подставляем значения. */
  expr: string;
  k: Koef;
  vals: Tab[];
  ans: number;
  /** Начало подписи: какие значения подставляем. */
  intro: string;
  /** Коэффициент до упрощения корня (√288) и почему он равен k.tex. */
  alt?: { tex: string; chto: string };
  /** Других шагов нет: подстановку — отдельным шагом, чтобы их было два. */
  odna?: boolean;
}

/**
 * Подставляем значения и собираем число: знак по числу минусов, корни
 * перемножаем (они всегда дают целое), знаменатели — в один. Если
 * осталась дробь — следующий шаг её сокращает.
 */
function podstavlyaem(p: Podstanovka): Shag[] {
  const { expr, k, vals, ans } = p;
  const parts = vals.map(chasti);
  const sign = parts.reduce((s, x) => s * x.sign, 1);
  const minusov = parts.filter((x) => x.sign < 0).length;
  const korni = [k.R, ...parts.map((x) => x.r)].filter((r) => r > 1);
  const P = korni.reduce((s, r) => s * r, 1);
  const K = Math.round(Math.sqrt(P));
  const M = parts.reduce((s, x) => s * x.m, k.m);
  const umnozh = (coefTex: string): string =>
    [coefTex, ...vals.map(mnozhitel)].filter((s) => s !== '').join(' \\cdot ');
  const podst = [expr, ...(p.alt ? [umnozh(p.alt.tex)] : []), umnozh(k.tex)];
  const intro = [p.intro, ...(p.alt ? [p.alt.chto] : [])];
  if (k.tex === '' && vals.length === 1) {
    return [
      shag(
        `${intro.join('. ')}${M > 1 ? ' и записываем его десятичной дробью' : ''}`,
        cep([expr, tabTex(vals[0] as Tab), d(ans)]),
      ),
    ];
  }
  const sbor: string[] = [];
  if (minusov === 1) {
    sbor.push(
      vals.length === 1
        ? 'Значение отрицательное — результат со знаком минус'
        : 'Один множитель отрицательный — произведение отрицательное',
    );
  }
  if (minusov === 2) {
    sbor.push('Два отрицательных множителя дают плюс');
  }
  if (korni.length === 2 && korni[0] === korni[1]) {
    sbor.push(
      `Корень, умноженный на такой же корень, даёт число под корнем: $\\sqrt{${korni[0]}} \\cdot \\sqrt{${korni[0]}} = ${korni[0]}$`,
    );
  } else if (korni.length > 0) {
    sbor.push(
      `Корни перемножаем: $${korni.map((r) => `\\sqrt{${r}}`).join(' \\cdot ')} = \\sqrt{${P}} = ${K}$`,
    );
  }
  const sobrano = drob(sign, [k.c, K], M);
  let hvost = M === 1 ? [sobrano, d(ans)] : [sobrano];
  /* Несократимую дробь сразу переводим в десятичную — отдельный шаг
     «сокращать нечего» ничего не объясняет. Если других шагов нет,
     перевод остаётся отдельным: шагов должно быть два. */
  const srazu = M > 1 && p.odna !== true && !sokrashchaetsya(k.c, K, M);
  if (srazu) {
    const des = vDesyatichnuyu(sign, k.c * K, M);
    hvost = [sobrano, ...(k.c > 1 && K > 1 ? [drob(sign, [k.c * K], M)] : []), ...des.tex, d(ans)];
    sbor.push(`Дробь несократима — переводим её в десятичную${des.chto}`);
  }
  const steps: Shag[] = [];
  if (p.odna === true && M === 1) {
    steps.push(shag(intro.join('. '), cep(podst)));
    steps.push(
      shag(
        sbor.length > 0 ? sbor.join('. ') : 'Перемножаем числа',
        cep([podst[podst.length - 1] as string, ...hvost]),
      ),
    );
  } else {
    steps.push(shag([...intro, ...sbor].join('. '), cep([...podst, ...hvost])));
  }
  if (M > 1 && !srazu) {
    steps.push(sokrashchaem(sign, k.c, K, M, ans));
  }
  return steps;
}

/**
 * Последнее деление c / n. Нацело — проверка умножением; иначе
 * сокращаем и переводим в десятичную. Если сокращение держится на
 * делимости на 3 у двузначного числа — называем признак.
 */
function delenie(c: number, n: number, ans: number): { step: Shag; delimost?: Priznak[] } {
  const g = gcd(c, n);
  const q = c / g;
  /* Делимость на 3 у числа за пределами таблицы умножения (51, 57, 78)
     не видна сразу — называем признак. */
  const priznak = g % 3 === 0 && q > 10 && c >= 50;
  const pochemu = priznak
    ? `$${c}$ делится на $${g}$: сумма цифр $${summaCifr(c)}$ делится на $3$${g % 2 === 0 ? `, и $${c}$ чётное` : ''}`
    : '';
  const delimost = priznak ? priznakiDlya(g) : undefined;
  const nachalo = `\\dfrac{${c}}{${n}}`;
  if (g === n) {
    return {
      step: shag(
        priznak ? `Делим нацело — ${pochemu}` : `Делим нацело, ведь $${c} = ${n} \\cdot ${q}$`,
        `${nachalo} = ${d(ans)}`,
      ),
      delimost,
    };
  }
  if (n === 10 || n === 100) {
    return {
      step: shag(
        `Делим на $${n}$ — запятая сдвигается на ${n === 10 ? 'один знак' : 'два знака'} влево`,
        `${nachalo} = ${d(ans)}`,
      ),
    };
  }
  const m = n / g;
  const des = vDesyatichnuyu(1, q, m);
  const chain = [nachalo, ...(g > 1 ? [`\\dfrac{${q}}{${m}}`] : []), ...des.tex, d(ans)];
  const chto =
    g > 1
      ? `Сокращаем дробь на $${g}$${priznak ? ` — ${pochemu}` : ''}. Затем переводим её в десятичную${des.chto}`
      : `Переводим дробь в десятичную${des.chto}`;
  return { step: shag(chto, cep(chain)), delimost };
}

/* ── 8.Q  произведение табличных значений ────────────────────── */

/**
 * Решение 8.Q: каждый нетабличный угол сводим к острому отдельным
 * шагом, потом подставляем значения — корень коэффициента
 * сокращается с корнями значений — и сокращаем дробь.
 */
function razborQ(
  tex: string,
  c: number,
  R: number,
  mnozhiteli: [Fn, number][],
  radians: boolean,
  ans: number,
): Shag[] {
  const zs = mnozhiteli.map(([f, a]) => znachenie(f, a, radians));
  /* Два одинаковых множителя — значение находим один раз. */
  const raznye = zs.filter((z, i) => zs.findIndex((w) => w.tex === z.tex) === i);
  const steps = raznye.filter((z) => z.chto !== '').map((z) => shag(z.chto, z.tex));
  const tabl = raznye.filter((z) => z.chto === '').map((z) => `$${z.tex}$`);
  const intro =
    tabl.length === 0
      ? raznye.length === 1
        ? 'Подставляем найденное значение'
        : 'Подставляем найденные значения'
      : steps.length === 0
        ? `Подставляем табличн${tabl.length === 1 ? 'ое значение' : 'ые значения'} ${tabl.join(' и ')}`
        : `Подставляем найденное значение и табличное ${tabl.join(', ')}`;
  return [
    ...steps,
    ...podstavlyaem({
      expr: tex,
      k: { c, R, m: 1, tex: bezEdinicy(coefRoot(c, R)) },
      vals: zs.map((z) => z.t),
      ans,
      intro,
      odna: steps.length === 0,
    }),
  ];
}

function drawQ(r: Rng, advanced: boolean): Draft | null {
  const angles = advanced ? [...BASE_ANGLES, ...EXTRA_ANGLES] : BASE_ANGLES;
  const fns: Fn[] = advanced ? ['sin', 'cos', 'tg'] : ['sin', 'cos'];
  const single = advanced && r.int(0, 2) === 0;
  const f1 = r.pick(fns);
  const a1 = r.pick(angles);
  const t1 = table(f1, a1);
  if (t1 === null || t1.v === 0) {
    return null;
  }
  let product: { v: number; r: number } = { v: t1.v, r: t1.r };
  let f2: Fn = 'sin';
  let a2 = 0;
  if (!single) {
    f2 = r.pick(fns);
    a2 = r.pick(angles);
    const t2 = table(f2, a2);
    if (t2 === null || t2.v === 0) {
      return null;
    }
    product = multiply(t1, t2);
    if (
      advanced &&
      !EXTRA_ANGLES.includes(a1) &&
      !EXTRA_ANGLES.includes(a2) &&
      f1 !== 'tg' &&
      f2 !== 'tg'
    ) {
      return null;
    }
  } else if (!EXTRA_ANGLES.includes(a1)) {
    return null;
  }
  const radians = r.int(0, 1) === 0;
  const c = r.int(2, 29);
  const ans = round9(c * product.v * product.r);
  if (!nice(ans, 2) || Math.abs(ans) > 100 || ans === 0) {
    return null;
  }
  const coefTex = coefRoot(c, product.r);
  const body = single
    ? `${fn(f1)}${angleTex(a1, radians)}`
    : `${fn(f1)}${angleTex(a1, radians)} \\cdot ${fn(f2)}${angleTex(a2, radians)}`;
  const tex = `${coefTex === '1' ? '' : coefTex}${body}`;
  return {
    uslovie: naydi(tex),
    otvet: ans,
    razbor: razborQ(
      tex,
      c,
      product.r,
      single
        ? [[f1, a1]]
        : [
            [f1, a1],
            [f2, a2],
          ],
      radians,
      ans,
    ),
    proverka: c * Math.sqrt(product.r) * numeric(f1, a1) * (single ? 1 : numeric(f2, a2)),
    signature: single ? `${a1}` : `${a1}:${a2}`,
    params: single ? { f1, a1, c } : { f1, a1, f2, a2, c },
  };
}

export const P8Q: Prototype = {
  id: '8.Q',
  group: 'IV',
  nazvanie: 'Табличные значения',
  podtipy: [
    podtip('base', 'base', (r) => drawQ(r, false)),
    podtip('adv', 'advanced', (r) => drawQ(r, true)),
  ],
  isklyucheniya: keys([
    { f1: 'cos', a1: 45, f2: 'cos', a2: 240, c: 26 },
    { f1: 'cos', a1: 135, f2: 'cos', a2: 60, c: 28 },
    { f1: 'tg', a1: 45, f2: 'sin', a2: 45, c: 18 },
    { f1: 'tg', a1: 225, f2: 'sin', a2: 135, c: 12 },
    { f1: 'sin', a1: 150, f2: 'cos', a2: 120, c: 12 },
    { f1: 'sin', a1: 45, f2: 'cos', a2: 135, c: 14 },
    { f1: 'sin', a1: 30, f2: 'cos', a2: 120, c: 10 },
    { f1: 'sin', a1: 45, f2: 'cos', a2: 135, c: 16 },
    { f1: 'cos', a1: -225, c: 12 },
    { f1: 'sin', a1: -120, c: 4 },
    { f1: 'cos', a1: -495, c: 32 },
    { f1: 'cos', a1: -570, c: 26 },
  ]),
};

/* ── 8.R  синус двойного угла ────────────────────────────────── */

/** Углы, у которых удвоенный — табличный: кратные 15° и нечётные π/8. */
const HALF_ANGLES = [
  15, 75, 105, 165, 195, 255, 285, 345, 22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5,
];

/** Запись угла в радианах; 22,5° = π/8 бывает только в радианах. */
function halfTex(x: number): string {
  if (Number.isInteger(x)) {
    return angleTex(x, true);
  }
  return rad(Math.round(x / 22.5), 8);
}

/**
 * Решение 8.R (табличный угол): sin·cos — половина синуса двойного
 * угла; удвоенный угол сводим к острому; коэффициент с корнем
 * сокращается с корнем значения.
 */
function razborRTable(
  tex: string,
  c: number,
  t: Tab,
  x: number,
  angle: string,
  doubled: string,
  radians: boolean,
  ans: number,
): Shag[] {
  const full = coefRoot(c, t.r);
  const half: Koef =
    c % 2 === 0
      ? { c: c / 2, R: t.r, m: 1, tex: bezEdinicy(coefRoot(c / 2, t.r)) }
      : { c, R: t.r, m: 2, tex: `\\dfrac{${full}}{2}` };
  const dvoyka =
    c % 2 === 1
      ? 'Двойки перед произведением нет — умножаем и делим на $2$'
      : half.tex === ''
        ? 'Двойка уже стоит перед произведением'
        : `Выделяем двойку из коэффициента: $${full} = ${half.tex} \\cdot 2$`;
  const sc = `\\sin${angle}\\cos${angle}`;
  const z = znachenie('sin', 2 * x, radians);
  return [
    shag(
      `Произведение $\\sin\\alpha\\cos\\alpha$ — половина синуса двойного угла: $2\\sin\\alpha\\cos\\alpha = \\sin 2\\alpha$. ${dvoyka}. Угол удваивается: $2 \\cdot ${angle} = ${doubled}$`,
      cep([
        tex,
        ...(half.tex === '' ? [] : [`${half.tex} \\cdot 2${sc}`]),
        `${half.tex}\\sin${doubled}`,
      ]),
    ),
    ...(z.chto === '' ? [] : [shag(z.chto, z.tex)]),
    ...podstavlyaem({
      expr: `${half.tex}\\sin${doubled}`,
      k: half,
      vals: [t],
      ans,
      intro:
        z.chto === ''
          ? `Подставляем табличное значение $${z.tex}$`
          : 'Подставляем найденное значение',
    }),
  ];
}

export const P8R: Prototype = {
  id: '8.R',
  group: 'IV',
  nazvanie: 'Синус двойного угла',
  podtipy: [
    podtip('table', 'advanced', (r) => {
      const x = r.pick(HALF_ANGLES);
      const t = table('sin', 2 * x);
      if (t === null || t.v === 0) {
        return null;
      }
      const c = r.int(1, 24);
      const ans = round9((c / 2) * t.v * t.r);
      if (!nice(ans, 2)) {
        return null;
      }
      const inDegrees = Number.isInteger(x) && r.int(0, 1) === 0;
      const angle = inDegrees ? deg(x) : halfTex(x);
      const coefTex = coefRoot(c, t.r);
      const tex = `${coefTex === '1' ? '' : coefTex}\\sin${angle} \\cdot \\cos${angle}`;
      const doubled = inDegrees ? deg(2 * x) : angleTex(2 * x, true);
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: razborRTable(tex, c, t, x, angle, doubled, !inDegrees, ans),
        proverka: c * Math.sqrt(t.r) * Math.sin(toRad(x)) * Math.cos(toRad(x)),
        signature: `${x}`,
        params: { x, c },
      };
    }),
    podtip('cancel', 'base', (r) => {
      const x = r.int(31, 99);
      if ([45, 60, 90].includes(x)) {
        return null;
      }
      const c = r.int(2, 19);
      const tex = `\\dfrac{${2 * c}\\sin${deg(x)} \\cdot \\cos${deg(x)}}{\\sin${deg(2 * x)}}`;
      return {
        uslovie: naydi(tex),
        otvet: c,
        razbor: [
          shag(
            `В числителе — синус двойного угла: $2\\sin\\alpha\\cos\\alpha = \\sin 2\\alpha$. Выделяем двойку: $${2 * c} = ${c} \\cdot 2$. Угол удваивается: $2 \\cdot ${deg(x)} = ${deg(2 * x)}$ — это как раз угол знаменателя`,
            cep([
              tex,
              `\\dfrac{${c} \\cdot 2\\sin${deg(x)}\\cos${deg(x)}}{\\sin${deg(2 * x)}}`,
              `\\dfrac{${c}\\sin${deg(2 * x)}}{\\sin${deg(2 * x)}}`,
            ]),
          ),
          shag(
            `Сокращаем $\\sin${deg(2 * x)}$ — он не равен нулю, и остаётся $${c}$`,
            `\\dfrac{${c}\\sin${deg(2 * x)}}{\\sin${deg(2 * x)}} = ${c}`,
          ),
        ],
        proverka: (2 * c * Math.sin(toRad(x)) * Math.cos(toRad(x))) / Math.sin(toRad(2 * x)),
        signature: `${x}`,
        params: { x, c, form: 'cancel' },
      };
    }),
    podtip('reduce', 'advanced', (r) => {
      const y = r.int(50, 88);
      if ([60].includes(y)) {
        return null;
      }
      const c = r.int(2, 29);
      const tex = `\\dfrac{${c}\\sin${deg(180 - 2 * y)}}{\\cos${deg(y)} \\cdot \\cos${deg(90 - y)}}`;
      return {
        uslovie: naydi(tex),
        otvet: 2 * c,
        razbor: [
          shag(
            `Знаменатель приводим к одному углу: $${deg(90 - y)} = 90^\\circ - ${deg(y)}$, а по формуле приведения $\\cos(90^\\circ - \\alpha) = \\sin\\alpha$`,
            cep([
              `\\cos${deg(y)} \\cdot \\cos${deg(90 - y)}`,
              `\\cos${deg(y)} \\cdot \\cos(90^\\circ - ${deg(y)})`,
              `\\sin${deg(y)}\\cos${deg(y)}`,
            ]),
          ),
          shag(
            `В знаменателе $\\sin${deg(y)}\\cos${deg(y)}$ — половина синуса угла $2 \\cdot ${deg(y)} = ${deg(2 * y)}$. Числитель приводим к этому углу: $${deg(180 - 2 * y)} = 180^\\circ - ${deg(2 * y)}$, а по формуле приведения $\\sin(180^\\circ - \\alpha) = \\sin\\alpha$. Затем раскладываем по формуле синуса двойного угла $\\sin 2\\alpha = 2\\sin\\alpha\\cos\\alpha$`,
            cep([
              `\\sin${deg(180 - 2 * y)}`,
              `\\sin(180^\\circ - ${deg(2 * y)})`,
              `\\sin${deg(2 * y)}`,
              `2\\sin${deg(y)}\\cos${deg(y)}`,
            ]),
          ),
          shag(
            `Подставляем и сокращаем $\\sin${deg(y)}\\cos${deg(y)}$ — остаётся $${c} \\cdot 2$`,
            cep([
              `\\dfrac{${c} \\cdot 2\\sin${deg(y)}\\cos${deg(y)}}{\\sin${deg(y)}\\cos${deg(y)}}`,
              `${c} \\cdot 2`,
              d(2 * c),
            ]),
          ),
        ],
        proverka:
          (c * Math.sin(toRad(180 - 2 * y))) / (Math.cos(toRad(y)) * Math.cos(toRad(90 - y))),
        signature: `${y}`,
        params: { y, c, form: 'reduce' },
      };
    }),
  ],
  isklyucheniya: keys([
    { x: 157.5, c: 1 },
    { x: 337.5, c: 7 },
    { x: 210, c: 10 },
    { x: 150, c: 6 },
    { x: 98, c: 8, form: 'cancel' },
    { x: 87, c: 12, form: 'cancel' },
    { x: 96, c: 9, form: 'cancel' },
    { x: 73, c: 14, form: 'cancel' },
    { y: 77, c: 7, form: 'reduce' },
    { y: 81, c: 9, form: 'reduce' },
    { y: 65, c: 8, form: 'reduce' },
    { y: 54, c: 6, form: 'reduce' },
  ]),
};

/* ── 8.S  косинус двойного угла ──────────────────────────────── */

/** Коэффициент c√r, иногда спрятанный под один корень: √72 вместо 6√2. */
function hiddenCoef(c: number, rr: number, hidden: boolean): string {
  if (hidden && rr > 1) {
    return `\\sqrt{${c * c * rr}}`;
  }
  return coefRoot(c, rr);
}

/** Шаг сведения удвоенного угла к острому — если угол не острый. */
function svodim(z: Znachenie): Shag[] {
  return z.chto === '' ? [] : [shag(z.chto, z.tex)];
}

/** Начало подписи подстановки: табличное значение или найденное на прошлом шаге. */
function podstavlyaemZnachenie(z: Znachenie): string {
  return z.chto === ''
    ? `Подставляем табличное значение $${z.tex}$`
    : 'Подставляем найденное значение';
}

/**
 * Решение 8.S (разность квадратов): общий множитель — за скобки, в
 * скобках косинус двойного угла; угол — к острому; корень коэффициента
 * сокращается с корнем значения.
 */
function razborSDiff(
  tex: string,
  c: number,
  kk: string,
  t: Tab,
  x: number,
  angle: string,
  doubled: string,
  radians: boolean,
  ans: number,
): Shag[] {
  const formula = '$\\cos^2\\alpha - \\sin^2\\alpha = \\cos 2\\alpha$';
  const udvoenie = `Угол удваивается: $2 \\cdot ${angle} = ${doubled}$`;
  const z = znachenie('cos', 2 * x, radians);
  return [
    kk === ''
      ? shag(`Это косинус двойного угла: ${formula}. ${udvoenie}`, cep([tex, `\\cos${doubled}`]))
      : shag(
          `Выносим общий множитель $${kk}$ за скобки — в скобках косинус двойного угла: ${formula}. ${udvoenie}`,
          cep([
            tex,
            `${kk}\\left(\\cos^2${angle} - \\sin^2${angle}\\right)`,
            `${kk}\\cos${doubled}`,
          ]),
        ),
    ...svodim(z),
    ...podstavlyaem({
      expr: `${kk}\\cos${doubled}`,
      k: { c, R: t.r, m: 1, tex: kk },
      vals: [t],
      ans,
      intro: podstavlyaemZnachenie(z),
    }),
  ];
}

/**
 * Решение 8.S (2cos² − 1 и 1 − 2sin²): младший коэффициент — за
 * скобки, в скобках косинус двойного угла. Коэффициенты под корнем:
 * сначала видим, что под большим корнем число вчетверо больше, и
 * только в конце упрощаем один корень.
 */
function razborSHalf(
  tex: string,
  u: { c: number; t: Tab; x: number; angle: string; doubled: string; radians: boolean },
  v: { hidden: boolean; big: string; small: string; form: 'cos' | 'sin'; identity: string },
  ans: number,
): Shag[] {
  const { c, t, x, angle, doubled, radians } = u;
  const { hidden, big, small, form, identity } = v;
  const formula =
    form === 'cos'
      ? '$2\\cos^2\\alpha - 1 = \\cos 2\\alpha$'
      : '$1 - 2\\sin^2\\alpha = \\cos 2\\alpha$';
  const udvoenie = `Угол удваивается: $2 \\cdot ${angle} = ${doubled}$`;
  const z = znachenie('cos', 2 * x, radians);
  const vynosim = (two: string): Shag =>
    shag(
      `Выносим $${small}$ за скобки${!hidden && c > 1 ? ` (ведь $${big} = 2 \\cdot ${small}$)` : ''} — в скобках косинус двойного угла: ${formula}. ${udvoenie}`,
      cep([two, `${small}\\left(${identity}\\right)`, `${small}\\cos${doubled}`]),
    );
  const steps: Shag[] = [];
  if (hidden) {
    const N = c * c * t.r;
    const two =
      form === 'cos'
        ? `2\\sqrt{${N}}\\cos^2${angle} - \\sqrt{${N}}`
        : `\\sqrt{${N}} - 2\\sqrt{${N}}\\sin^2${angle}`;
    steps.push(
      shag(
        `Под большим корнем число вчетверо больше: $${4 * N} = 4 \\cdot ${N}$, поэтому $\\sqrt{${4 * N}} = \\sqrt{4} \\cdot \\sqrt{${N}} = 2\\sqrt{${N}}$`,
        cep([tex, two]),
      ),
      vynosim(two),
    );
  } else {
    steps.push(vynosim(tex));
  }
  const prostoy = coefRoot(c, t.r);
  return [
    ...steps,
    ...svodim(z),
    ...podstavlyaem({
      expr: `${small}\\cos${doubled}`,
      k: { c, R: t.r, m: 1, tex: prostoy },
      vals: [t],
      ans,
      intro: podstavlyaemZnachenie(z),
      ...(hidden && c > 1
        ? {
            alt: {
              tex: small,
              chto: `Упрощаем корень: $${c * c * t.r} = ${c * c} \\cdot ${t.r}$, поэтому $${small} = ${prostoy}$`,
            },
          }
        : {}),
    }),
  ];
}

export const P8S: Prototype = {
  id: '8.S',
  group: 'IV',
  nazvanie: 'Косинус двойного угла',
  podtipy: [
    podtip('diff', 'base', (r) => {
      const x = r.pick(HALF_ANGLES);
      const t = table('cos', 2 * x);
      if (t === null || t.v === 0) {
        return null;
      }
      const c = r.int(1, 12);
      const ans = round9(c * t.v * t.r);
      if (!nice(ans, 2)) {
        return null;
      }
      const inDegrees = Number.isInteger(x) && r.int(0, 1) === 0;
      const angle = inDegrees ? deg(x) : halfTex(x);
      const k = coefRoot(c, t.r);
      const kk = k === '1' ? '' : k;
      const tex = `${kk}\\cos^2${angle} - ${kk}\\sin^2${angle}`;
      const doubled = inDegrees ? deg(2 * x) : angleTex(2 * x, true);
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: razborSDiff(tex, c, kk, t, x, angle, doubled, !inDegrees, ans),
        proverka: c * Math.sqrt(t.r) * (Math.cos(toRad(x)) ** 2 - Math.sin(toRad(x)) ** 2),
        signature: `${x}`,
        params: { x, c, form: 'diff' },
      };
    }),
    podtip('half', 'advanced', (r) => {
      const x = r.pick(HALF_ANGLES);
      const t = table('cos', 2 * x);
      if (t === null || t.v === 0) {
        return null;
      }
      const c = r.int(1, 12);
      const ans = round9(c * t.v * t.r);
      if (!nice(ans, 2)) {
        return null;
      }
      const inDegrees = Number.isInteger(x) && r.int(0, 1) === 0;
      const angle = inDegrees ? deg(x) : halfTex(x);
      const hidden = r.int(0, 2) === 0;
      const big = hiddenCoef(2 * c, t.r, hidden);
      const small = hiddenCoef(c, t.r, hidden);
      const form = r.pick(['cos', 'sin'] as const);
      const tex =
        form === 'cos' ? `${big}\\cos^2${angle} - ${small}` : `${small} - ${big}\\sin^2${angle}`;
      const doubled = inDegrees ? deg(2 * x) : angleTex(2 * x, true);
      const identity = form === 'cos' ? `2\\cos^2${angle} - 1` : `1 - 2\\sin^2${angle}`;
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: razborSHalf(
          tex,
          { c, t, x, angle, doubled, radians: !inDegrees },
          { hidden: hidden && t.r > 1, big, small, form, identity },
          ans,
        ),
        proverka:
          form === 'cos'
            ? 2 * c * Math.sqrt(t.r) * Math.cos(toRad(x)) ** 2 - c * Math.sqrt(t.r)
            : c * Math.sqrt(t.r) - 2 * c * Math.sqrt(t.r) * Math.sin(toRad(x)) ** 2,
        signature: `${x}:${form}`,
        params: { x, c, form },
      };
    }),
    podtip('cancel', 'advanced', (r) => {
      const x = r.int(50, 88);
      if ([60, 67.5, 75].includes(x)) {
        return null;
      }
      const c = 2 * r.int(1, 19) + 1;
      const ans = -c / 2;
      const tex = `\\dfrac{${c}(\\sin^2${deg(x)} - \\cos^2${deg(x)})}{2\\cos${deg(2 * x)}}`;
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: [
          shag(
            `В скобках — косинус двойного угла с обратным знаком: $\\cos^2\\alpha - \\sin^2\\alpha = \\cos 2\\alpha$, а у нас вычитание в другом порядке. Угол удваивается: $2 \\cdot ${deg(x)} = ${deg(2 * x)}$ — как в знаменателе`,
            cep([
              `\\sin^2${deg(x)} - \\cos^2${deg(x)}`,
              `-\\left(\\cos^2${deg(x)} - \\sin^2${deg(x)}\\right)`,
              `-\\cos${deg(2 * x)}`,
            ]),
          ),
          shag(
            `Подставляем и сокращаем $\\cos${deg(2 * x)}$ — он не равен нулю. Число $${c}$ нечётное, на $2$ не сокращается — делим`,
            cep([
              `\\dfrac{${c} \\cdot \\left(-\\cos${deg(2 * x)}\\right)}{2\\cos${deg(2 * x)}}`,
              `-\\dfrac{${c}}{2}`,
              d(ans),
            ]),
          ),
        ],
        proverka:
          (c * (Math.sin(toRad(x)) ** 2 - Math.cos(toRad(x)) ** 2)) / (2 * Math.cos(toRad(2 * x))),
        signature: `${x}`,
        params: { x, c, form: 'cancel' },
      };
    }),
  ],
  isklyucheniya: keys([
    { x: 202.5, c: 3, form: 'diff' },
    { x: 105, c: 4, form: 'diff' },
    { x: 157.5, c: 3, form: 'diff' },
    { x: 202.5, c: 6, form: 'diff' },
    { x: 157.5, c: 2, form: 'cos' },
    { x: 195, c: 1, form: 'cos' },
    { x: 15, c: 3, form: 'cos' },
    { x: 157.5, c: 4, form: 'cos' },
    { x: 337.5, c: 1, form: 'sin' },
    { x: 195, c: 5, form: 'sin' },
    { x: 202.5, c: 4, form: 'sin' },
    { x: 165, c: 3, form: 'sin' },
    { x: 66, c: 21, form: 'cancel' },
    { x: 68, c: 25, form: 'cancel' },
    { x: 72, c: 23, form: 'cancel' },
    { x: 77, c: 19, form: 'cancel' },
  ]),
};

/* ── 8.T  формулы приведения ─────────────────────────────────── */

const TABLE_DEG = [30, 45, 60, 90, 120, 135, 150];

/** Решение 8.T (период): большой угол — малый плюс полные обороты; потом сокращаем. */
function razborTPeriod(f: 'sin' | 'cos', x: number, big: number, c: number, sign: number): Shag[] {
  const F = fn(f);
  const k = Math.round((big - x) / 360);
  const oboroty = `${k === 1 ? '' : `${k} \\cdot `}360^\\circ`;
  return [
    shag(
      `${sBolshoy(IMYA[f])} повторяется через $360^\\circ$ — это его период. Раскладываем $${deg(big)} = ${deg(x)} + ${oboroty}$ и отбрасываем ${k === 1 ? 'полный оборот' : 'полные обороты'}`,
      cep([`${F}${deg(big)}`, `${F}(${deg(x)} + ${oboroty})`, `${F}${deg(x)}`]),
    ),
    shag(
      `Подставляем: в числителе и знаменателе $${F}${deg(x)}$ — сокращаем, он не равен нулю`,
      cep([`${sign < 0 ? '-' : ''}\\dfrac{${c}${F}${deg(x)}}{${F}${deg(x)}}`, d(sign * c)]),
    ),
  ];
}

export const P8T: Prototype = {
  id: '8.T',
  group: 'IV',
  nazvanie: 'Формулы приведения',
  podtipy: [
    podtip('co', 'advanced', (r) => {
      const x = r.int(1, 89);
      if (TABLE_DEG.includes(x)) {
        return null;
      }
      const f = r.pick(['sin', 'cos'] as const);
      const c = r.int(2, 39);
      const dd = r.int(-15, 15);
      if (dd === 0) {
        return null;
      }
      const other = f === 'sin' ? 'cos' : 'sin';
      const tex = `\\dfrac{${c}${fn(f)}${deg(90 - x)}}{${fn(other)}${deg(x)}} ${dd < 0 ? '-' : '+'} ${Math.abs(dd)}`;
      return {
        uslovie: naydi(tex),
        otvet: c + dd,
        razbor: [
          shag(
            `Углы $${deg(90 - x)}$ и $${deg(x)}$ в сумме дают $90^\\circ$, поэтому работает формула приведения $${fn(f)}(90^\\circ - \\alpha) = ${fn(other)}\\alpha$`,
            cep([
              `${fn(f)}${deg(90 - x)}`,
              `${fn(f)}(90^\\circ - ${deg(x)})`,
              `${fn(other)}${deg(x)}`,
            ]),
          ),
          shag(
            `Подставляем: в числителе и знаменателе одно и то же $${fn(other)}${deg(x)}$ — сокращаем, и дробь равна $${c}$`,
            cep([
              `\\dfrac{${c}${fn(other)}${deg(x)}}{${fn(other)}${deg(x)}} ${plusMinus(dd)}`,
              `${c} ${plusMinus(dd)}`,
              d(c + dd),
            ]),
          ),
        ],
        proverka: (c * numeric(f, 90 - x)) / numeric(other, x) + dd,
        signature: `${x}`,
        params: { form: 'co', f, x, c, d: dd },
      };
    }),
    podtip('period', 'base', (r) => {
      const x = r.int(1, 179);
      if (TABLE_DEG.includes(x) || x === 180) {
        return null;
      }
      const f = r.pick(['sin', 'cos'] as const);
      const c = r.int(2, 39);
      const sign = r.pick([1, -1]);
      const up = r.int(0, 1) === 0;
      const big = x + 360 * r.pick([1, 1, 2]);
      const top = up ? deg(big) : deg(x);
      const bottom = up ? deg(x) : deg(big);
      const tex = `${sign < 0 ? '-' : ''}\\dfrac{${c}${fn(f)}${top}}{${fn(f)}${bottom}}`;
      return {
        uslovie: naydi(tex),
        otvet: sign * c,
        razbor: razborTPeriod(f, x, big, c, sign),
        proverka: (sign * c * numeric(f, up ? big : x)) / numeric(f, up ? x : big),
        signature: `${x}`,
        params: { form: 'period', f, x, c, big, sign, up: up ? 1 : 0 },
      };
    }),
    podtip('pi', 'base', (r) => {
      const x = r.int(1, 89);
      if (TABLE_DEG.includes(x)) {
        return null;
      }
      const f = r.pick(['sin', 'cos'] as const);
      const plus = r.int(0, 1) === 0;
      const c = r.int(2, 39);
      const angle = plus ? 180 + x : 180 - x;
      /* sin(180−x) = sin x, sin(180+x) = −sin x, cos(180±x) = −cos x. */
      const value = f === 'sin' && !plus ? 1 : -1;
      const tex = `\\dfrac{${c}${fn(f)}${deg(angle)}}{${fn(f)}${deg(x)}}`;
      return {
        uslovie: naydi(tex),
        otvet: value * c,
        razbor: [
          shag(
            `По формуле приведения $${fn(f)}(180^\\circ ${plus ? '+' : '-'} \\alpha) = ${value < 0 ? '-' : ''}${fn(f)}\\alpha$: угол $${deg(angle)}$ лежит в ${plus ? 'III' : 'II'} четверти, ${IMYA[f]} там ${value < 0 ? 'отрицателен' : 'положителен'}`,
            cep([
              `${fn(f)}${deg(angle)}`,
              `${fn(f)}(180^\\circ ${plus ? '+' : '-'} ${deg(x)})`,
              `${value < 0 ? '-' : ''}${fn(f)}${deg(x)}`,
            ]),
          ),
          shag(
            `Подставляем и сокращаем $${fn(f)}${deg(x)}$ — он не равен нулю${value < 0 ? ', а минус остаётся' : ''}`,
            cep([
              value < 0
                ? `\\dfrac{${c} \\cdot (-${fn(f)}${deg(x)})}{${fn(f)}${deg(x)}}`
                : `\\dfrac{${c}${fn(f)}${deg(x)}}{${fn(f)}${deg(x)}}`,
              d(value * c),
            ]),
          ),
        ],
        proverka: (c * numeric(f, angle)) / numeric(f, x),
        signature: `${x}`,
        params: { form: 'pi', f, x, c, plus: plus ? 1 : 0 },
      };
    }),
  ],
  isklyucheniya: keys([
    { form: 'co', f: 'cos', x: 10, c: 7, d: -3 },
    { form: 'co', f: 'cos', x: 86, c: 51, d: 8 },
    { form: 'co', f: 'cos', x: 79, c: 35, d: -7 },
    { form: 'co', f: 'cos', x: 37, c: 2, d: 13 },
  ]),
};

/* ── 8.U  произведение тангенсов дополнительных углов ────────── */

/** Угол n·π/m без сокращения — чтобы сложить дроби с общим знаменателем. */
function piNad(n: number, m: number): string {
  return `\\frac{${n === 1 ? '' : n}\\pi}{${m}}`;
}

export const P8U: Prototype = {
  id: '8.U',
  group: 'IV',
  nazvanie: 'Тангенсы дополнительных углов',
  podtipy: [
    podtip('deg', 'base', (r) => {
      const x = r.int(1, 44);
      if (x === 30) {
        return null;
      }
      const c = r.int(2, 59);
      const dd = r.int(-60, 60);
      if (dd === 0 || c + dd === 0) {
        return null;
      }
      const tex = `${c}\\operatorname{tg}${deg(x)} \\cdot \\operatorname{tg}${deg(90 - x)} ${dd < 0 ? '-' : '+'} ${Math.abs(dd)}`;
      return {
        uslovie: naydi(tex),
        otvet: c + dd,
        razbor: [
          shag(
            `Углы $${deg(x)}$ и $${deg(90 - x)}$ в сумме дают $90^\\circ$, поэтому работает формула приведения $\\operatorname{tg}(90^\\circ - \\alpha) = \\operatorname{ctg}\\alpha$`,
            cep([
              `\\operatorname{tg}${deg(90 - x)}`,
              `\\operatorname{tg}(90^\\circ - ${deg(x)})`,
              `\\operatorname{ctg}${deg(x)}`,
            ]),
          ),
          shag(
            'Тангенс и котангенс одного угла — взаимно обратные числа: $\\operatorname{tg}\\alpha \\cdot \\operatorname{ctg}\\alpha = 1$',
            cep([
              `${c}\\operatorname{tg}${deg(x)} \\cdot \\operatorname{ctg}${deg(x)} ${plusMinus(dd)}`,
              `${c} \\cdot 1 ${plusMinus(dd)}`,
              d(c + dd),
            ]),
          ),
        ],
        proverka: c * Math.tan(toRad(x)) * Math.tan(toRad(90 - x)) + dd,
        signature: `${x}`,
        params: { x, c, d: dd, unit: 'deg' },
      };
    }),
    podtip('rad', 'advanced', (r) => {
      const den = r.pick([10, 14, 18, 22, 26]);
      const a = r.int(1, den / 2 - 1);
      const b = den / 2 - a;
      if (a >= b) {
        return null;
      }
      const c = r.int(2, 59) * r.pick([1, -1]);
      const dd = r.int(-60, 60);
      if (dd === 0 || c + dd === 0) {
        return null;
      }
      const cTex = c < 0 ? `-${-c}` : String(c);
      const tex = `${cTex}\\operatorname{tg}${rad(a, den)} \\cdot \\operatorname{tg}${rad(b, den)} ${dd < 0 ? '-' : '+'} ${Math.abs(dd)}`;
      return {
        uslovie: naydi(tex),
        otvet: c + dd,
        razbor: [
          shag(
            `Проверяем, что углы в сумме дают прямой угол $\\dfrac{\\pi}{2}$: приводим дроби к знаменателю $${den}$`,
            cep([
              `${rad(a, den)} + ${rad(b, den)}`,
              `${piNad(a, den)} + ${piNad(b, den)}`,
              piNad(den / 2, den),
              '\\frac{\\pi}{2}',
            ]),
          ),
          shag(
            `Значит, $${rad(b, den)} = \\dfrac{\\pi}{2} - ${rad(a, den)}$, и по формуле приведения $\\operatorname{tg}\\left(\\dfrac{\\pi}{2} - \\alpha\\right) = \\operatorname{ctg}\\alpha$`,
            cep([
              `\\operatorname{tg}${rad(b, den)}`,
              `\\operatorname{tg}\\left(\\frac{\\pi}{2} - ${rad(a, den)}\\right)`,
              `\\operatorname{ctg}${rad(a, den)}`,
            ]),
          ),
          shag(
            'Тангенс и котангенс одного угла — взаимно обратные числа: $\\operatorname{tg}\\alpha \\cdot \\operatorname{ctg}\\alpha = 1$',
            cep([
              `${cTex}\\operatorname{tg}${rad(a, den)} \\cdot \\operatorname{ctg}${rad(a, den)} ${plusMinus(dd)}`,
              `${cTex} \\cdot 1 ${plusMinus(dd)}`,
              d(c + dd),
            ]),
          ),
        ],
        proverka: c * Math.tan((Math.PI * a) / den) * Math.tan((Math.PI * b) / den) + dd,
        signature: `${a}:${den}`,
        params: { a, den, c, d: dd, unit: 'rad' },
      };
    }),
  ],
  isklyucheniya: keys([
    { x: 3, c: 30, d: -43, unit: 'deg' },
    { x: 7, c: 46, d: -57, unit: 'deg' },
    { x: 20, c: 12, d: -7, unit: 'deg' },
  ]),
};

/* ── 8.V  основное тождество с приведением ───────────────────── */

type FormV = 'c90+' | 'c90-' | 's90+' | 's90-' | 'c270+' | 'c270-' | 's270+' | 's270-';

function secondAngle(form: FormV, x: number): number {
  const base = form.includes('270') ? 270 : 90;
  return form.endsWith('+') ? base + x : base - x;
}

/**
 * Решение 8.V: второй квадрат формулой приведения превращаем в квадрат
 * кофункции того же угла (минус, если есть, уходит при возведении в
 * квадрат), сумма квадратов синуса и косинуса — единица, остаётся
 * разделить.
 */
function razborV(
  form: FormV,
  x: number,
  dd: number,
  c: number,
  ans: number,
): { razbor: Shag[]; delimost?: Priznak[] } {
  const f: Fn = form.startsWith('c') ? 'cos' : 'sin';
  const o: Fn = f === 'cos' ? 'sin' : 'cos';
  const F = fn(f);
  const O = fn(o);
  const base = form.includes('270') ? 270 : 90;
  const op = form.endsWith('+') ? '+' : '-';
  const y = secondAngle(form, x);
  /* cos(90°+α) = −sin α, sin(270°±α) = −cos α, cos(270°−α) = −sin α. */
  const minus = form === 'c90+' || form === 's270+' || form === 's270-' || form === 'c270-';
  const n = 1 + dd;
  const del = delenie(c, n, ans);
  return {
    razbor: [
      shag(
        `По формуле приведения $${F}(${base}^\\circ ${op} \\alpha) = ${minus ? '-' : ''}${O}\\alpha$: от $${base}^\\circ$ ${IMYA[f]} меняется на ${IMYA[o]}${minus ? ', а минус при возведении в квадрат исчезает' : ''}`,
        cep([
          `${F}^2${deg(y)}`,
          `${F}^2(${base}^\\circ ${op} ${deg(x)})`,
          ...(minus ? [`(-${O}${deg(x)})^2`] : []),
          `${O}^2${deg(x)}`,
        ]),
      ),
      shag(
        `В знаменателе квадраты синуса и косинуса одного угла, а их сумма по основному тригонометрическому тождеству равна единице: $\\sin^2\\alpha + \\cos^2\\alpha = 1$`,
        cep([
          `\\dfrac{${c}}{${F}^2${deg(x)} + ${dd} + ${O}^2${deg(x)}}`,
          `\\dfrac{${c}}{1 + ${dd}}`,
          `\\dfrac{${c}}{${n}}`,
        ]),
      ),
      del.step,
    ],
    ...(del.delimost === undefined ? {} : { delimost: del.delimost }),
  };
}

export const P8V: Prototype = {
  id: '8.V',
  group: 'IV',
  nazvanie: 'Основное тождество с приведением',
  podtipy: [
    podtip('90', 'base', (r) => {
      const form = r.pick(['c90+', 'c90-', 's90+', 's90-'] as const);
      const x = r.int(1, 89);
      if (TABLE_DEG.includes(x)) {
        return null;
      }
      const dd = r.int(1, 29);
      const c = (1 + dd) * r.int(2, 9);
      if (c > 200) {
        return null;
      }
      const f = form.startsWith('c') ? 'cos' : 'sin';
      const y = secondAngle(form, x);
      const tex = `\\dfrac{${c}}{${fn(f)}^2${deg(x)} + ${dd} + ${fn(f)}^2${deg(y)}}`;
      const ans = c / (1 + dd);
      return {
        uslovie: naydi(tex),
        otvet: ans,
        ...razborV(form, x, dd, c, ans),
        proverka: c / (numeric(f, x) ** 2 + dd + numeric(f, y) ** 2),
        signature: `${x}`,
        params: { form, x, d: dd, c },
      };
    }),
    podtip('270', 'advanced', (r) => {
      const form = r.pick(['c270+', 'c270-', 's270+', 's270-', 'c90+', 's90+'] as const);
      const x = form.includes('270') ? r.int(1, 89) : r.int(91, 179);
      if (TABLE_DEG.includes(x) || x === 180 || (x > 90 && TABLE_DEG.includes(180 - x))) {
        return null;
      }
      const dd = r.int(1, 29);
      const c = r.int(2, 79);
      const ans = round9(c / (1 + dd));
      if (!nice(ans, 2) || c === 1 + dd) {
        return null;
      }
      const f = form.startsWith('c') ? 'cos' : 'sin';
      const y = secondAngle(form, x);
      const tex = `\\dfrac{${c}}{${fn(f)}^2${deg(x)} + ${dd} + ${fn(f)}^2${deg(y)}}`;
      return {
        uslovie: naydi(tex),
        otvet: ans,
        ...razborV(form, x, dd, c, ans),
        proverka: c / (numeric(f, x) ** 2 + dd + numeric(f, y) ** 2),
        signature: `${x}`,
        params: { form, x, d: dd, c },
      };
    }),
  ],
  isklyucheniya: keys([
    { form: 'c90+', x: 74, d: 2, c: 6 },
    { form: 'c90+', x: 92, d: 1, c: 10 },
    { form: 'c90+', x: 59, d: 3, c: 26 },
    { form: 'c90+', x: 33, d: 3, c: 20 },
    { form: 's90+', x: 56, d: 1, c: 23 },
    { form: 's90+', x: 43, d: 4, c: 36 },
    { form: 's90+', x: 147, d: 4, c: 24 },
    { form: 's90+', x: 51, d: 3, c: 38 },
    { form: 'c90-', x: 19, d: 4, c: 16 },
    { form: 'c90-', x: 37, d: 1, c: 19 },
    { form: 'c90-', x: 14, d: 3, c: 58 },
    { form: 'c90-', x: 6, d: 24, c: 30 },
  ]),
};
