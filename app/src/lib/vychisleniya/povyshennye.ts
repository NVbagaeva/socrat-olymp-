/**
 * Шаблоны раздела «Варианты повышенной сложности» для задания №8.
 *
 * Черновик того же вида, что у подтипов раздела (types.ts, `Draft`):
 * условие, ответ, строки разбора с формулами и второй, численный счёт.
 * Лист учителя (`razborStepsHtml`) собирает его как задачу банка.
 * В банк, тренажёр и генератор №8 не входит.
 */

import { coefRoot, d, fn, frac, log, quarterInterval, rad } from './tex';
import type { Draft } from './types';

const round9 = (x: number) => Math.round(x * 1e9) / 1e9;
/** Конечная ли десятичная дробь (до 4 знаков): 1/(−3) — нет, его оставляем дробью. */
const konechnaya = (x: number) => Math.abs(x * 1e4 - Math.round(x * 1e4)) < 1e-9;

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
  return {
    uslovie: `Найдите значение выражения $${log('a', `\\left(${arg}\\right)`)}$, если $${log('b', 'a')} = ${d(t)}$.`,
    otvet,
    razbor: [
      `Основания разные: дано $${log('b', 'a')}$, а нужен $${log('a', 'b')}$. Они взаимно обратны: $${log('a', 'b')} = \\dfrac{1}{${log('b', 'a')}} = \\dfrac{1}{${d(t)}}${Number.isInteger(obr) || !konechnaya(obr) ? '' : ` = ${d(round9(obr))}`}$.`,
      `Логарифм произведения — сумма логарифмов: $${log('a', `\\left(${arg}\\right)`)} = ${log('a', `b^{${m}}`)} + ${log('a', '\\sqrt{a}')}$.`,
      `Показатель выносим множителем: $${log('a', `b^{${m}}`)} = ${m}\\cdot${log('a', 'b')} = ${m}\\cdot\\dfrac{1}{${d(t)}} = ${d(chast)}$.`,
      `Корень — степень $\\dfrac12$: $${log('a', '\\sqrt{a}')} = ${log('a', 'a^{\\frac12}')} = \\dfrac12 = 0{,}5$.`,
      `Складываем: $${d(chast)} + 0{,}5 = ${d(otvet)}$.`,
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
  return {
    uslovie: `Найдите $${log('a', `\\left(${arg}\\right)`)}$, если $${log('b', 'a')} = ${d(t)}$.`,
    otvet,
    razbor: [
      `Логарифм произведения — сумма логарифмов: $${log('a', `\\left(${arg}\\right)`)} = ${log('a', `a^{${m}}`)} + ${log('a', '\\sqrt{b}')}$.`,
      `$${log('a', `a^{${m}}`)} = ${m}$ — показатель степени основания.`,
      `Дано $${log('b', 'a')}$, а нужен $${log('a', 'b')}$: они взаимно обратны, $${log('a', 'b')} = \\dfrac{1}{${d(t)}} = ${d(obr)}$.`,
      `Корень — степень $\\dfrac12$: $${log('a', '\\sqrt{b}')} = \\dfrac12\\cdot${log('a', 'b')} = \\dfrac12\\cdot(${d(obr)}) = ${d(pol)}$.`,
      `Складываем: $${m} + (${d(pol)}) = ${d(otvet)}$.`,
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
  const svyaz = `$\\sin ${y}^\\circ = \\sin(360^\\circ - ${2 * x}^\\circ) = -\\sin ${2 * x}^\\circ$ — синус меняет знак при вычитании из $360^\\circ$.`;
  return {
    uslovie: `Найдите значение выражения $\\dfrac{${2 * c}\\sin ${x}^\\circ\\cdot\\cos ${x}^\\circ}{${vnizu}}$.`,
    otvet: -c,
    razbor: [
      `Числитель — синус двойного угла: $${2 * c}\\sin ${x}^\\circ\\cos ${x}^\\circ = ${c}\\cdot 2\\sin ${x}^\\circ\\cos ${x}^\\circ = ${c}\\sin ${2 * x}^\\circ$.`,
      svyaz,
      `Делим: $\\dfrac{${c}\\sin ${2 * x}^\\circ}{-\\sin ${2 * x}^\\circ} = ${d(-c)}$.`,
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
    razbor: [
      `Оба основания — степени числа $${b}$: $${B1} = ${b}^{${s1}}$, $${B2} = ${b}^{${s2}}$.`,
      `Степень в степени — показатели перемножаются: $${B1}^{${d(x)}} = ${b}^{${s1}\\cdot${d(x)}} = ${b}^{${d(e1)}}$, $${B2}^{${d(y)}} = ${b}^{${s2}\\cdot${d(y)}} = ${b}^{${d(e2)}}$.`,
      `При делении степеней показатели вычитаются: $${b}^{${d(e1)}-${d(e2)}} = ${b}^{${d(e)}} = ${d(otvet)}$.`,
    ],
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
  const g = nod(j * k, i * l);
  const sokr = g === 1 ? '' : `=\\dfrac{${(j * k) / g}}{${(i * l) / g}}`;
  return {
    uslovie: `Найдите значение выражения $\\dfrac{${verh}}{${niz}}$.`,
    otvet,
    razbor: [
      `Основания — степени числа $${a}$: $${A}=${a}^{${i}}$, $${C}=${a}^{${k}}$; числа под логарифмами — степени числа $${b}$: $${B}=${b}^{${j}}$, $${D}=${b}^{${l}}$.`,
      `Показатель числа выносится множителем, показатель основания — делителем: $${log(`${a}^{${i}}`, `${b}^{${j}}`)}=\\dfrac{${j}}{${i}}${lab}$.`,
      `Числитель: $${verh}=\\dfrac{${j}}{${i}}${lab}$; знаменатель: $${niz}=\\dfrac{${l}}{${k}}${lab}$.`,
      `Делим, $${lab}$ сокращается: $\\dfrac{${j}}{${i}}:\\dfrac{${l}}{${k}}=\\dfrac{${j}\\cdot${k}}{${i}\\cdot${l}}${sokr}=${d(otvet)}$.`,
    ],
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

/**
 * Значение f(nπ/den) цепочкой формул приведения: чётность, отбрасывание
 * периодов, «π − φ», табличное значение. Углы — только с опорным
 * π/6, π/4, π/3 (на осях значения нулевые или не существуют).
 */
export function trigCepochka(u: TrigUgol): { tex: string; z: TrigZnach } {
  const [f, n0, den0] = u;
  const g0 = nod(n0, den0);
  const n = n0 / g0;
  const den = den0 / g0;
  const F = fn(f);
  const ch: string[] = [`${F}${ugolTex(n, den)}`];
  let zn: 1 | -1 = 1;
  const pref = () => (zn < 0 ? '-' : '');
  let m = n;
  if (m < 0) {
    m = -m;
    if (f !== 'cos') zn = -1;
    ch.push(`${pref()}${F}${rad(m, den)}`);
  }
  /* Период в единицах π/den: 2π у синуса и косинуса, π у тангенса. */
  const P = f === 'tg' ? den : 2 * den;
  const kk = Math.round(m / P);
  let th = m - kk * P;
  if (kk !== 0) {
    const kratnoe = piK(f === 'tg' ? kk : 2 * kk);
    const ost = th === 0 ? '' : `${th < 0 ? '-' : '+'}${rad(Math.abs(th), den)}`;
    ch.push(`${pref()}${F}\\left(${kratnoe}${ost}\\right)`);
    if (th < 0) {
      ch.push(`${pref()}${F}\\left(${rad(th, den)}\\right)`);
      th = -th;
      if (f !== 'cos') zn = zn === 1 ? -1 : 1;
      ch.push(`${pref()}${F}${rad(th, den)}`);
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
  }
  const g = nod(phi, den);
  const op = den / g;
  if (phi === 0 || phi / g !== 1 || TABLICA[f][op] === undefined)
    throw new Error(`trigCepochka: угол ${n}π/${den} не табличный`);
  const [s, D] = TABLICA[f][op] as [number, number];
  const z: TrigZnach = { zn, s, D };
  ch.push(znachTex(z));
  return { tex: ch.join('='), z };
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
  const korni = [p.r, ...zf.map((z) => z.s)].filter((s) => s !== 1);
  const korniTex =
    korni.length === 0 && zg.s === 1
      ? ''
      : ` Корни: $\\dfrac{${korni.length === 0 ? '1' : korni.map((s) => `\\sqrt{${s}}`).join('\\cdot')}}{${zg.s === 1 ? '1' : `\\sqrt{${zg.s}}`}}=\\sqrt{\\dfrac{${korni.length === 0 ? '1' : korni.join('\\cdot')}}{${zg.s}}}=${d(round9(Math.sqrt(podK) / zg.s))}$.`;
  return {
    uslovie: `Найдите значение выражения $${trigPrivedenieTex(p)}$.`,
    otvet,
    razbor: [
      ...c.map((x) => `$${x.tex}$.`),
      `Подставляем: $${podst}$.`,
      `Знак: минусов ${minusov} — ${minusov % 2 === 1 ? 'нечётное число, результат отрицательный' : 'чётное число, результат положительный'}.${korniTex}`,
      `Числа без знака: $${[
        ...(p.k === 1 ? [] : [String(p.k)]),
        ...zf.filter((z) => z.D !== 1).map((z) => `\\dfrac{1}{${z.D}}`),
        ...(zg.D === 1 ? [] : [String(zg.D)]),
        ...(podK === zg.s * zg.s ? [] : [d(round9(Math.sqrt(podK) / zg.s))]),
      ].join('\\cdot')}=${d(Math.abs(otvet))}$, со знаком — $${d(otvet)}$.`,
    ],
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
  const sk = (x: number) => (x < 0 ? `(${d(x)})` : d(x));
  return {
    uslovie: `Найдите значение выражения $${log('a', arg)}$, если $${dano === 'ab' ? lab : log('b', 'a')}=${d(t)}$.`,
    otvet,
    razbor: [
      op === 'umn'
        ? `Логарифм произведения — сумма логарифмов: $${log('a', arg)}=${log('a', `a^{${m}}`)}+${log('a', `b^{${n}}`)}=${m}+${n}${lab}$.`
        : `Логарифм частного — разность логарифмов: $${log('a', arg)}=${log('a', `a^{${m}}`)}-${log('a', `b^{${n}}`)}=${m}-${n}${lab}$.`,
      ...(dano === 'ba'
        ? [
            `Дано $${log('b', 'a')}$, а нужен $${lab}$: они взаимно обратны, $${lab}=\\dfrac{1}{${d(t)}}${konechnaya(L) ? `=${d(L)}` : ''}$.`,
          ]
        : []),
      `$${n}${lab}=${n}\\cdot${L < 0 ? `\\left(${Ltex}\\right)` : Ltex}=${d(nL)}$.`,
      `$${m}${znak > 0 ? '+' : '-'}${sk(nL)}=${d(otvet)}$.`,
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
  return {
    uslovie: `Найдите значение выражения $${vyr}$.`,
    otvet,
    razbor: [
      vid === 'raznost'
        ? `Выносим общий множитель: $${vyr} = \\sqrt{${A}}\\left(${c2}-${s2}\\right)$.`
        : vid === 'sinus'
          ? `$\\sqrt{${4 * A}} = \\sqrt{4\\cdot${A}} = 2\\sqrt{${A}}$, поэтому $${vyr} = \\sqrt{${A}}\\left(1-2${s2}\\right)$.`
          : `$\\sqrt{${4 * A}} = \\sqrt{4\\cdot${A}} = 2\\sqrt{${A}}$, поэтому $${vyr} = \\sqrt{${A}}\\left(2${c2}-1\\right)$.`,
      vid === 'raznost'
        ? `Косинус двойного угла: $\\cos^2\\alpha-\\sin^2\\alpha = \\cos2\\alpha$, здесь $2\\alpha = ${dvaAlfa}$.`
        : vid === 'sinus'
          ? `Косинус двойного угла: $1-2\\sin^2\\alpha = \\cos2\\alpha$, здесь $2\\alpha = ${dvaAlfa}$.`
          : `Косинус двойного угла: $2\\cos^2\\alpha-1 = \\cos2\\alpha$, здесь $2\\alpha = ${dvaAlfa}$.`,
      `Формулы приведения: $${cep.tex}$.`,
      `Умножаем: $\\sqrt{${A}}\\cdot\\left(${cep.tex.split('=').pop()}\\right) = ${zn < 0 ? '-' : ''}\\dfrac{\\sqrt{${A * s}}}{${D}} = ${d(otvet)}$.`,
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
      `При умножении степеней показатели складываются, поэтому $${a}^{${n}+${log(String(a), String(b))}} = ${a}^{${n}}\\cdot ${a}^{${log(String(a), String(b))}}$.`,
      `Основное логарифмическое тождество: $${a}^{${log(String(a), String(b))}} = ${b}$.`,
      `$${a}^{${n}}\\cdot ${b} = ${an}\\cdot ${b} = ${d(otvet)}$.`,
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
  if ((sign > 0) !== znakDannoy) throw new Error('tgPoZnacheniyu: знак не по четверти');
  const otvet = round9(((plusTg ? 1 : -1) * kn) / kd);
  if (!konechnaya(otvet)) throw new Error('tgPoZnacheniyu: tg — бесконечная дробь');
  const sinZnak = sinPol ? 'положителен' : 'отрицателен';
  const cosZnak = cosPol ? 'положителен' : 'отрицателен';
  return {
    uslovie: `Найдите $${fn('tg')}\\alpha$, если $${g}\\alpha = ${drobKorenTex(p)}$ и $\\alpha\\in${quarterInterval(q)}$.`,
    otvet,
    razbor: [
      `Основное тождество: $${drug}^2\\alpha = 1-${g}^2\\alpha = 1-${frac(P, Q)} = ${frac(Q - P, Q)}$.`,
      `$${fn('tg')}^2\\alpha = \\dfrac{\\sin^2\\alpha}{\\cos^2\\alpha} = ${f === 'cos' ? `${frac(Q - P, Q)} : ${frac(P, Q)}` : `${frac(P, Q)} : ${frac(Q - P, Q)}`} = ${frac(tn, td)}$, $|${fn('tg')}\\alpha| = ${frac(kn, kd)}$.`,
      `При $\\alpha\\in${quarterInterval(q)}$ синус ${sinZnak}, косинус ${cosZnak}, поэтому тангенс ${plusTg ? 'положителен' : 'отрицателен'}: $${fn('tg')}\\alpha = ${d(otvet)}$.`,
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
  const razlozh =
    vid === 'ab'
      ? `$${st(ab, z)} = ${st(a, z)}\\cdot ${st(b, z)}$, поэтому выражение равно $\\dfrac{${st(a, x)}}{${st(a, z)}}\\cdot\\dfrac{${st(b, y)}}{${st(b, z)}}$.`
      : `$${st(ab, x)} = ${st(a, x)}\\cdot ${st(b, x)}$, поэтому выражение равно $\\dfrac{${st(a, x)}}{${st(a, z)}}\\cdot ${st(b, x)}\\cdot ${st(b, y)}$.`;
  const sobrat =
    vid === 'ab'
      ? `$${a}^{${d(x)}-${d(z)}}\\cdot ${b}^{${d(y)}-${d(z)}} = ${a}^{${ea}}\\cdot ${b}^{${eb}}$`
      : `$${a}^{${d(x)}-${z < 0 ? `(${d(z)})` : d(z)}}\\cdot ${b}^{${d(x)}+${y < 0 ? `(${d(y)})` : d(y)}} = ${a}^{${ea}}\\cdot ${b}^{${eb}}$`;
  return {
    uslovie: `Найдите значение выражения $${vyr}$.`,
    otvet,
    razbor: [
      `Раскладываем основание $${ab}$ на множители: $${ab} = ${a}\\cdot ${b}$, а степень произведения — произведение степеней: ${razlozh}`,
      `Собираем показатели при одинаковых основаниях (при делении вычитаются, при умножении складываются): ${sobrat}.`,
      `$${a}^{${ea}}\\cdot ${b}^{${eb}} = ${d(otvet)}$.`,
    ],
    params: { vid, a, b, x, y, z },
    proverka:
      vid === 'ab'
        ? Math.exp(x * Math.log(a) + y * Math.log(b) - z * Math.log(ab))
        : Math.exp(x * Math.log(ab) + y * Math.log(b) - z * Math.log(a)),
    signature: `st3:${vid}:${a}:${b}:${x}:${y}:${z}`,
  };
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
      `Логарифмы с одним основанием: ${znak > 0 ? 'сумма логарифмов — логарифм произведения' : 'разность логарифмов — логарифм частного'}: $${log(d(c), d(x))} ${zn} ${log(d(c), d(y))} = ${log(d(c), `\\left(${svernuto}\\right)`)} = ${log(d(c), d(arg))}$.`,
      `$${d(arg)} = ${d(c)}^{${k}}$${k < 0 ? ` (отрицательная степень: $${d(c)}^{${k}} = \\dfrac{1}{${d(round9(c ** -k))}}$)` : ''}, поэтому логарифм равен $${k}$.`,
    ],
    params: { c, x, y, znak },
    proverka: (Math.log(x) + znak * Math.log(y)) / Math.log(c),
    signature: `logr:${c}:${x}:${y}:${znak}`,
  };
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
  return {
    uslovie: `Найдите значение выражения $${k === 1 ? '' : `${k}\\cdot `}${koren(n)}\\cdot ${koren(m)}$.`,
    otvet,
    razbor: [
      `Запишем корни степенями: $${koren(n)} = ${A}^{\\frac{1}{${n}}}$, $${koren(m)} = ${A}^{\\frac{1}{${m}}}$.`,
      `При умножении показатели складываются: $\\dfrac{1}{${n}}+\\dfrac{1}{${m}} = \\dfrac{${num}}{${den}}${g === 1 ? '' : ` = \\dfrac{${pe}}{${qe}}`}$, то есть $${A}^{\\frac{${pe}}{${qe}}}${qe === 1 ? '' : pe === 1 ? ` = ${koren(qe)}` : ` = \\left(${koren(qe)}\\right)^{${pe}}`} = ${zn}$.`,
      `$${k === 1 ? '' : `${k}\\cdot `}${zn} = ${otvet}$.`,
    ],
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
  return {
    uslovie: `Найдите значение выражения $\\left(1-${log(String(a), String(X))}\\right)\\left(1-${log(String(b), String(Y))}\\right)$.`,
    otvet,
    razbor: [
      `Разложим числа под логарифмами: $${X} = ${a}\\cdot ${st(b, m)}$, $${Y} = ${b}\\cdot ${st(a, n)}$.`,
      `Логарифм произведения — сумма, и $${log(String(a), String(a))} = 1$: $1-${log(String(a), String(X))} = 1-1-${m === 1 ? '' : m}${log(String(a), String(b))} = -${m === 1 ? '' : m}${log(String(a), String(b))}$.`,
      `Так же $1-${log(String(b), String(Y))} = -${n === 1 ? '' : n}${log(String(b), String(a))}$.`,
      `Произведение: $${m * n === 1 ? '' : m * n}${log(String(a), String(b))}\\cdot ${log(String(b), String(a))} = ${m * n === 1 ? '' : `${m * n}\\cdot `}1 = ${otvet}$, потому что $${log(String(a), String(b))} = \\dfrac{1}{${log(String(b), String(a))}}$.`,
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
export function logDrobSumma(p: { a: number; k: number; c: number; m: number; vid: 'pryamo' | 'obratno' }): Draft {
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
      `Число $${k}$ — это $${log(String(a), String(a ** k))}$, поэтому $${zn} = ${log(String(a), String(a ** k))}+${log(String(a), String(c))} = ${log(String(a), String(M))}$.`,
      m === 1
        ? `Под логарифмом в другой части дроби — то же число $${N}$.`
        : `$${N} = ${M}^{${m}}$, поэтому $${lN} = ${m}${log(String(a), String(M))}$.`,
      vid === 'obratno'
        ? `Дробь равна $\\dfrac{${log(String(a), String(M))}}{${m === 1 ? '' : m}${log(String(a), String(M))}} = ${d(otvet)}$.`
        : `Дробь равна $\\dfrac{${m === 1 ? '' : m}${log(String(a), String(M))}}{${log(String(a), String(M))}} = ${otvet}$.`,
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
export function stepeniProizvedenie(p: { b: number; s1: number; s2: number; x: number; y: number }): Draft {
  const { b, s1, s2, x, y } = p;
  const B1 = b ** s1;
  const B2 = b ** s2;
  const e1 = round9(s1 * x);
  const e2 = round9(s2 * y);
  const e = round9(e1 + e2);
  const otvet = round9(b ** e);
  if (!konechnaya(otvet)) throw new Error(`stepeniProizvedenie: ответ ${otvet} — не конечная дробь`);
  return {
    uslovie: `Найдите значение выражения $${B1}^{${d(x)}}\\cdot ${B2}^{${d(y)}}$.`,
    otvet,
    razbor: [
      `Оба основания — степени числа $${b}$: $${B1} = ${b}^{${s1}}$, $${B2} = ${b}^{${s2}}$.`,
      `Степень в степени — показатели перемножаются: $${B1}^{${d(x)}} = ${b}^{${s1}\\cdot${d(x)}} = ${b}^{${d(e1)}}$, $${B2}^{${d(y)}} = ${b}^{${s2}\\cdot${d(y)}} = ${b}^{${d(e2)}}$.`,
      `При умножении степеней показатели складываются: $${b}^{${d(e1)}+${d(e2)}} = ${b}^{${d(e)}} = ${d(otvet)}$.`,
    ],
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
  if (!konechnaya(otvet)) throw new Error(`sinCosProizvedenie: ${zn * A}/${2 * D} — бесконечная дробь`);
  const ugol = rad(n, den);
  return {
    uslovie: `Найдите значение выражения $${A}${fn('sin')}${ugol}\\cdot${fn('cos')}${ugol}$.`,
    otvet,
    razbor: [
      `Синус двойного угла: $\\sin2\\alpha = 2\\sin\\alpha\\cos\\alpha$, поэтому $${A}\\sin\\alpha\\cos\\alpha = ${d(A / 2)}\\sin2\\alpha$, здесь $2\\alpha = ${rad(2 * n, den)}$.`,
      `Формулы приведения: $${cep.tex}$.`,
      `$${d(A / 2)}\\cdot\\left(${cep.tex.split('=').pop()}\\right) = ${d(otvet)}$.`,
    ],
    params: { A, n, den },
    proverka: A * Math.sin((n * Math.PI) / den) * Math.cos((n * Math.PI) / den),
    signature: `sincos:${A}:${n}:${den}`,
  };
}
