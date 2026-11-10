/**
 * Группа II, логарифмы: 8.H, 8.I, 8.J, 8.K, 8.L.
 */

import { gcd, nice, round9 } from '../numbers';
import type { Rng } from '../rng';
import { d, fracExp, log, paren, pw, root } from '../tex';
import type { Priznak, Prototype, Shag } from '../types';
import { keys, naydi, podtip, priznakiDlya, shag } from './common';

/** Является ли x целой степенью b (1 = b^0 тоже). */
function isPowerOf(x: number, b: number): boolean {
  for (let e = 0; e <= 12; e += 1) {
    if (Math.abs(b ** e - x) < 1e-9) {
      return true;
    }
  }
  return false;
}

/* ── Числа в решениях ────────────────────────────────────────── */

/** Цепочка равенств без повторов подряд. */
function cepochka(parts: string[]): string {
  return parts.filter((x, i) => i === 0 || x !== parts[i - 1]).join(' = ');
}

/** Дробь как есть, без сокращения; со знаменателем 1 — целое число. */
function drobTex(num: number, den: number): string {
  return den === 1 ? String(num) : `\\dfrac{${num}}{${den}}`;
}

/** Несократимая дробь num/den. */
function sokr(num: number, den: number): [number, number] {
  const g = gcd(num, den);
  return [num / g, den / g];
}

/** Десятичная дробь как обыкновенная: 18,75 = 1875/100 = 75/4 (сократили на g). */
interface Obyknovennaya {
  X: number;
  D: number;
  num: number;
  den: number;
  g: number;
}

function obyknovennaya(x: number): Obyknovennaya {
  let D = 1;
  while (D < 1e6 && Math.abs(Math.round(x * D) - x * D) > 1e-6) {
    D *= 10;
  }
  const X = Math.round(x * D);
  const g = gcd(X, D);
  return { X, D, num: X / g, den: D / g, g };
}

/** Степень основания b^e несократимой дробью: 0,8^{-2} = 25/16, 4^{-1} = 1/4, 6^2 = 36/1. */
function stepenDrobyu(base: number, e: number): [number, number] {
  const B = obyknovennaya(base);
  const [P, Q] = e >= 0 ? [B.num, B.den] : [B.den, B.num];
  const k = Math.abs(e);
  return [P ** k, Q ** k];
}

/**
 * Сокращение n на g, которое держится на признаке делимости (на 4 и
 * на 25 у трёхзначных и больших чисел): признак словами, а сам признак —
 * в список для панели «Признаки делимости». Очевидное сокращение — пусто.
 */
function priznak(n: number, g: number, znaki: Priznak[]): string {
  if (n < 100 || (g !== 4 && g !== 25)) {
    return '';
  }
  for (const p of priznakiDlya(g)) {
    if (!znaki.includes(p)) znaki.push(p);
  }
  const hvost = String(n % 100).padStart(2, '0');
  return g === 4
    ? `$${n}$ делится на $4$, потому что $${hvost}$ делится на $4$`
    : `$${n}$ делится на $25$, потому что оканчивается на $${hvost}$`;
}

/** Простые множители: 48 → [[2, 4], [3, 1]]. */
function prostye(n: number): [number, number][] {
  const out: [number, number][] = [];
  let m = n;
  for (let p = 2; p * p <= m; p += 1) {
    let e = 0;
    while (m % p === 0) {
      m /= p;
      e += 1;
    }
    if (e > 0) out.push([p, e]);
  }
  if (m > 1) out.push([m, 1]);
  return out;
}

/** Произведение степеней простых: 2^{4} \cdot 3. */
function stepeniTex(f: [number, number][]): string {
  return f.map(([p, e]) => (e === 1 ? String(p) : pw(String(p), String(e)))).join(' \\cdot ');
}

/**
 * Произведение двух целых без умножения: оба числа раскладываются на
 * простые множители основания, и сразу видна степень основания.
 * Последнее звено выкладки — b^{e}.
 */
function razlozhenie(x: number, y: number, b: number, e: number): Shag | null {
  const fb = prostye(b);
  const primes = fb.map(([p]) => p);
  const fx = prostye(x);
  const fy = prostye(y);
  if (![...fx, ...fy].every(([p]) => primes.includes(p))) {
    return null;
  }
  const sum = (p: number) => [...fx, ...fy].filter(([q]) => q === p).reduce((s, [, k]) => s + k, 0);
  const chain = [`${x} \\cdot ${y}`, `${stepeniTex(fx)} \\cdot ${stepeniTex(fy)}`];
  const first = fb[0] as [number, number];
  if (fb.length === 1) {
    const [p, s] = first;
    if (sum(p) !== s * e) return null;
    chain.push(pw(String(p), String(s * e)));
    if (s > 1) chain.push(pw(`(${pw(String(p), String(s))})`, String(e)));
    chain.push(pw(String(b), String(e)));
    return shag(
      s === 1
        ? `Не перемножаем, а записываем множители степенями числа $${p}$ — при умножении показатели складываются`
        : `Не перемножаем, а раскладываем на простые множители: основание $${b} = ${pw(String(p), String(s))}$, поэтому ищем степень числа $${p}$. При умножении показатели складываются`,
      cepochka(chain),
    );
  }
  if (fb.some(([p, s]) => s !== 1 || sum(p) !== e)) {
    return null;
  }
  chain.push(stepeniTex(primes.map((p) => [p, e])));
  chain.push(pw(String(b), String(e)));
  return shag(
    `Не перемножаем, а раскладываем на простые множители: основание $${b} = ${primes.join(' \\cdot ')}$. У степеней с одинаковым основанием показатели складываются, а степени с равными показателями собираем в одну: $a^{n} \\cdot b^{n} = (ab)^{n}$`,
    cepochka(chain),
  );
}

/** Подпись с большой буквы. */
function sBolshoy(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Произведение, где есть десятичная дробь: переходим к обыкновенным
 * дробям и сокращаем до умножения. Если перевод в обыкновенную дробь
 * сокращается по признаку делимости, подпись его называет.
 */
function drobnoeProizvedenie(
  x: number,
  y: number,
  znaki: Priznak[],
): { shag: Shag; num: number; den: number } {
  const A = obyknovennaya(x);
  const B = obyknovennaya(y);
  const start = `${d(x)} \\cdot ${d(y)}`;
  const [p, q] = sokr(A.num * B.num, A.den * B.den);
  const raw = (f: Obyknovennaya) => `\\dfrac{${f.X}}{${f.D}}`;
  const chain = [start];
  if (A.D === 1 || B.D === 1) {
    /* Целое n на десятичную дробь f. */
    const n = A.D === 1 ? A.X : B.X;
    const f = A.D === 1 ? B : A;
    const fx = A.D === 1 ? y : x;
    const k = Math.round(Math.log10(n));
    if (10 ** k === n && n >= f.D) {
      return {
        shag: shag(
          `Умножить на $${n}$ — значит перенести запятую на ${['один знак', 'два знака', 'три знака'][k - 1] ?? `${k} знаков`} вправо`,
          `${start} = ${drobTex(p, q)}`,
        ),
        num: p,
        den: q,
      };
    }
    /* Сокращение дроби держится на признаке, но 10 или 100 делит n —
       дробь не сокращаем, знаменатель уйдёт в n. */
    const celaya = n % f.D === 0 && f.X >= 100 && (f.g === 4 || f.g === 25);
    const [fn, fd] = celaya ? [f.X, f.D] : [f.num, f.den];
    const note = celaya ? '' : priznak(f.X, f.g, znaki);
    const poryadok = (t: string) => (A.D === 1 ? `${n} \\cdot ${t}` : `${t} \\cdot ${n}`);
    if (note !== '') chain.push(poryadok(raw(f)));
    chain.push(poryadok(drobTex(fn, fd)));
    const g = gcd(n, fd);
    let deystvie: string;
    if (g > 1) {
      if (n !== fd) {
        chain.push(`\\dfrac{${n}}{${fd}}${fn === 1 ? '' : ` \\cdot ${fn}`}`);
        const [r1, r2] = sokr(n, fd);
        if (fn !== 1) chain.push(`${drobTex(r1, r2)} \\cdot ${fn}`);
      }
      const pr = priznak(n, g, znaki);
      deystvie = `сокращаем $${n}$ со знаменателем $${fd}$${g === Math.min(n, fd) ? '' : ` на $${g}$`}${pr === '' ? '' : ` (${pr})`}`;
    } else {
      deystvie = `сокращать нечего — умножаем числитель на $${n}$`;
    }
    chain.push(drobTex(p, q));
    const zapis = `Записываем $${d(fx)}$ обыкновенной дробью`;
    return {
      shag: shag(
        note !== ''
          ? `${zapis}: ${note}. Затем ${deystvie}`
          : g > 1
            ? `${zapis} и ${deystvie}`
            : `${zapis}. ${sBolshoy(deystvie)}`,
        cepochka(chain),
      ),
      num: p,
      den: q,
    };
  }
  /* Две десятичные дроби: меняем знаменатели местами и сокращаем крест-накрест. */
  const notes = [A, B].map((f) => priznak(f.X, f.g, znaki)).filter((s) => s !== '');
  if (notes.length > 0) chain.push(`${raw(A)} \\cdot ${raw(B)}`);
  chain.push(`${drobTex(A.num, A.den)} \\cdot ${drobTex(B.num, B.den)}`);
  const g1 = gcd(A.num, B.den);
  const g2 = gcd(B.num, A.den);
  let deystvie: string;
  if (g1 > 1 || g2 > 1) {
    chain.push(`\\dfrac{${A.num}}{${B.den}} \\cdot \\dfrac{${B.num}}{${A.den}}`);
    const parts = [sokr(A.num, B.den), sokr(B.num, A.den)]
      .filter(([u, v]) => !(u === 1 && v === 1))
      .map(([u, v]) => drobTex(u, v));
    if (parts.length === 2) chain.push(parts.join(' \\cdot '));
    const pary = [
      ...(g1 > 1 ? [[A.num, B.den, g1] as const] : []),
      ...(g2 > 1 ? [[B.num, A.den, g2] as const] : []),
    ].map(([u, v, g]) => {
      const pr = priznak(u, g, znaki);
      return `$${u}$ и $${v}$ — ${u === v ? 'полностью' : `на $${g}$`}${pr === '' ? '' : ` (${pr})`}`;
    });
    deystvie = `меняем знаменатели местами и сокращаем: ${pary.join(', ')}`;
  } else {
    chain.push(`\\dfrac{${A.num} \\cdot ${B.num}}{${A.den} \\cdot ${B.den}}`);
    deystvie = 'общих множителей нет — перемножаем числители и знаменатели';
  }
  chain.push(drobTex(p, q));
  const zapis = 'Записываем десятичные дроби обыкновенными';
  return {
    shag: shag(
      notes.length > 0
        ? `${zapis}: ${notes.join(', а ')}. Затем ${deystvie}`
        : g1 > 1 || g2 > 1
          ? `${zapis}, ${deystvie}`
          : `${zapis}. ${sBolshoy(deystvie)}`,
      cepochka(chain),
    ),
    num: p,
    den: q,
  };
}

/**
 * Частное x/y = p/q без деления столбиком: у числителя и знаменателя
 * общий множитель u (x = p·u, y = q·u), на него и сокращаем.
 */
function chastnoe(x: number, y: number, p: number, q: number): Shag {
  const left = `\\dfrac{${d(x)}}{${d(y)}}`;
  if (q === 1) {
    return shag(
      `Числитель ровно в $${p}$ раз${p % 10 >= 2 && p % 10 <= 4 && (p % 100 < 12 || p % 100 > 14) ? 'а' : ''} больше знаменателя: $${d(x)} = ${p} \\cdot ${d(y)}$. Сокращаем на $${d(y)}$ — делить столбиком не нужно`,
      `${left} = \\dfrac{${p} \\cdot ${d(y)}}{${d(y)}} = ${p}`,
    );
  }
  if (p === 1) {
    return shag(
      `Знаменатель ровно в $${q}$ раз${q % 10 >= 2 && q % 10 <= 4 && (q % 100 < 12 || q % 100 > 14) ? 'а' : ''} больше числителя: $${d(y)} = ${q} \\cdot ${d(x)}$. Сокращаем на $${d(x)}$ — делить столбиком не нужно`,
      `${left} = \\dfrac{${d(x)}}{${q} \\cdot ${d(x)}} = \\dfrac{1}{${q}}`,
    );
  }
  const u = round9(x / p);
  return shag(
    `У числителя и знаменателя общий множитель $${d(u)}$: $${d(x)} = ${p} \\cdot ${d(u)}$, $${d(y)} = ${q} \\cdot ${d(u)}$. Сокращаем на него`,
    `${left} = \\dfrac{${p} \\cdot ${d(u)}}{${q} \\cdot ${d(u)}} = \\dfrac{${p}}{${q}}`,
  );
}

/**
 * Последний шаг: под логарифмом — степень основания, логарифм равен
 * показателю. arg — как число получилось на прошлом шаге.
 */
function logStepeni(base: number, e: number, arg: string): Shag {
  const b = d(base);
  const L = log(b, arg);
  if (e === 0) {
    return shag('Логарифм единицы по любому основанию равен нулю: $\\log_a 1 = 0$', `${L} = 0`);
  }
  if (Number.isInteger(base)) {
    if (e === 1) {
      return shag('Под логарифмом получилось само основание, а $\\log_a a = 1$', `${L} = 1`);
    }
    const st = pw(b, String(e));
    if (e > 0) {
      return shag(
        `Узнаём степень основания: $${arg} = ${st}$. Логарифм степени основания равен показателю: $\\log_a a^{c} = c$`,
        `${L} = ${log(b, st)} = ${e}`,
      );
    }
    const k = -e;
    return shag(
      k === 1
        ? `Дробь $${arg}$ — это степень основания с показателем $-1$: $\\dfrac{1}{a} = a^{-1}$. Логарифм степени основания равен показателю`
        : `Записываем дробь степенью основания: $${base ** k} = ${pw(b, String(k))}$, а $\\dfrac{1}{a^{n}} = a^{-n}$, поэтому $${arg} = ${st}$. Логарифм степени основания равен показателю`,
      `${L} = ${log(b, st)} = ${e}`,
    );
  }
  /* Десятичное основание — обыкновенной дробью P/Q. */
  const B = obyknovennaya(base);
  const PQ = `\\dfrac{${B.num}}{${B.den}}`;
  if (e === 1) {
    return shag(
      `Под логарифмом получилось само основание: $${arg} = ${b}$, а $\\log_a a = 1$`,
      `${L} = ${log(b, b)} = 1`,
    );
  }
  const st = `\\left(${PQ}\\right)^{${e}}`;
  let pochemu: string;
  if (e > 0) {
    pochemu = `$${arg} = ${st}$ — степень основания`;
  } else {
    const flip = drobTex(B.den, B.num);
    const flipPow = B.num === 1 ? pw(flip, String(-e)) : `\\left(${flip}\\right)^{${-e}}`;
    pochemu = `$${arg} = ${e === -1 ? '' : `${flipPow} = `}${st}$: перевёрнутая дробь — это степень с показателем $-1$`;
  }
  return shag(
    `Записываем основание обыкновенной дробью: $${b} = ${PQ}$. Тогда ${pochemu}. Логарифм степени основания равен показателю`,
    `${L} = ${log(b, st)} = ${e}`,
  );
}

/** Под логарифмом уже стоит степень основания. */
function logGotovoyStepeni(b: number, e: number): Shag {
  return shag(
    'Логарифм степени основания равен показателю: $\\log_a a^{c} = c$',
    `${log(String(b), pw(String(b), String(e)))} = ${e}`,
  );
}

/**
 * Логарифм произведения x·y по основанию b, равного b^e: шаги после
 * «сумма логарифмов — логарифм произведения». Маленькое произведение
 * целых считается в том же шаге (fold), большое — разложением,
 * десятичные — через обыкновенные дроби.
 */
function logProizvedeniya(
  b: number,
  x: number,
  y: number,
  e: number,
  znaki: Priznak[],
): { fold: string; steps: Shag[] } {
  const [tn, td] = stepenDrobyu(b, e);
  if (Number.isInteger(x) && Number.isInteger(y)) {
    if (x * y <= 100) {
      return { fold: ` = ${log(d(b), String(x * y))}`, steps: [logStepeni(b, e, String(x * y))] };
    }
    const r = Number.isInteger(b) ? razlozhenie(x, y, b, e) : null;
    if (r !== null) {
      return { fold: '', steps: [r, logGotovoyStepeni(b, e)] };
    }
    return { fold: ` = ${log(d(b), String(x * y))}`, steps: [logStepeni(b, e, String(x * y))] };
  }
  const p = drobnoeProizvedenie(x, y, znaki);
  return { fold: '', steps: [p.shag, logStepeni(b, e, drobTex(tn, td))] };
}

/** Решения с признаками делимости, если сокращение на них держится. */
function sPriznakami(razbor: Shag[], znaki: Priznak[]): { razbor: Shag[]; delimost?: Priznak[] } {
  return znaki.length === 0 ? { razbor } : { razbor, delimost: znaki };
}

/** Частное логарифмов по одному основанию c — логарифм по основанию b. */
function perekhod(c: string, a: string, b: string): Shag {
  return shag(
    `Числитель и знаменатель — логарифмы по одному основанию $${c}$, поэтому дробь сворачивается в один логарифм по формуле перехода: $\\dfrac{\\log_c x}{\\log_c y} = \\log_y x$. Формула верна при любом основании $c$ — значит, и при $c = ${c}$`,
    `\\dfrac{${log(c, a)}}{${log(c, b)}} = ${log(b, a)}`,
  );
}

/**
 * k·p/q до ответа: k сокращаем со знаменателем до умножения, нецелое —
 * десятичной дробью. Возвращает звенья выкладки после k·p/q и подпись.
 */
function naDrob(k: number, p: number, q: number, ans: number): { chain: string[]; chto: string } {
  const chain: string[] = [];
  const g = gcd(k, q);
  const [n, m] = sokr(k * p, q);
  if (g > 1) {
    const kk = k / g;
    const qq = q / g;
    const verh = p === 1 ? String(kk) : kk === 1 ? String(p) : `${kk} \\cdot ${p}`;
    chain.push(qq === 1 ? verh : `\\dfrac{${verh}}{${qq}}`);
  }
  chain.push(drobTex(n, m));
  if (m !== 1) chain.push(d(ans));
  const chto =
    g > 1
      ? g === q && p === 1
        ? `Умножить на $\\dfrac{1}{${q}}$ — значит разделить на $${q}$`
        : `До умножения сокращаем $${k}$ со знаменателем $${q}$${g === Math.min(k, q) ? '' : ` на $${g}$`}`
      : `Сокращать нечего — умножаем числитель на $${k}$${m === 1 ? '' : ' и записываем дробь десятичной'}`;
  return { chain, chto };
}

/* ── 8.H  сумма и разность логарифмов ────────────────────────── */

function razborH(
  base: number,
  x: number,
  y: number,
  op: '+' | '-',
  e: number,
): { razbor: Shag[]; delimost?: Priznak[] } {
  const b = d(base);
  const znaki: Priznak[] = [];
  const left = `${log(b, d(x))} ${op} ${log(b, d(y))}`;
  if (op === '+') {
    const { fold, steps } = logProizvedeniya(base, x, y, e, znaki);
    return sPriznakami(
      [
        shag(
          'Сумма логарифмов с одинаковым основанием — логарифм произведения: $\\log_a x + \\log_a y = \\log_a (xy)$',
          `${left} = ${log(b, `(${d(x)} \\cdot ${d(y)})`)}${fold}`,
        ),
        ...steps,
      ],
      znaki,
    );
  }
  const [tn, td] = stepenDrobyu(base, e);
  const svoistvo =
    'Разность логарифмов с одинаковым основанием — логарифм частного: $\\log_a x - \\log_a y = \\log_a \\dfrac{x}{y}$';
  const arg = log(b, `\\dfrac{${d(x)}}{${d(y)}}`);
  const T = drobTex(tn, td);
  /* Дробь уже несократима — сокращать нечего; маленькие целые делим
     в том же шаге; остальное — отдельным шагом сокращения. */
  const nesokratima = x === tn && y === td;
  const prosto =
    Number.isInteger(x) && Number.isInteger(y) && (tn === 1 || td === 1) && x <= 60 && y <= 60;
  const razbor = nesokratima
    ? [shag(svoistvo, `${left} = ${arg}`)]
    : prosto
      ? [shag(svoistvo, `${left} = ${arg} = ${log(b, T)}`)]
      : [shag(svoistvo, `${left} = ${arg}`), chastnoe(x, y, tn, td)];
  razbor.push(logStepeni(base, e, T));
  return sPriznakami(razbor, znaki);
}

function drawH(r: Rng, decimalArgs: boolean, base: number, e: number) {
  const T = round9(base ** e);
  /* Степень основания сама должна быть конечной десятичной дробью:
     0,7 в минус первой — нет, 0,8 в минус первой — 1,25. */
  if (!nice(T, 4)) {
    return null;
  }
  const op = r.pick(['+', '-'] as const);
  let x: number;
  if (decimalArgs) {
    x = r.pick([r.dec(1.1, 60, 1), r.dec(1.01, 20, 2)]);
  } else {
    x = r.int(2, 60);
  }
  if (x <= 1 || isPowerOf(x, base)) {
    return null;
  }
  const y = Math.round((op === '+' ? T / x : x / T) * 100) / 100;
  const back = round9(op === '+' ? x * y : x / y);
  if (
    Math.abs(back - T) > 1e-9 ||
    y === x ||
    y === 1 ||
    y < 0.01 ||
    y > 999 ||
    isPowerOf(y, base)
  ) {
    return null;
  }
  if (!decimalArgs && (!Number.isInteger(y) || !Number.isInteger(x))) {
    return null;
  }
  const b = d(base);
  const tex = `${log(b, d(x))} ${op} ${log(b, d(y))}`;
  return {
    uslovie: naydi(tex),
    otvet: e,
    ...razborH(base, x, y, op, e),
    proverka:
      op === '+'
        ? Math.log(x) / Math.log(base) + Math.log(y) / Math.log(base)
        : Math.log(x) / Math.log(base) - Math.log(y) / Math.log(base),
    signature: `${base}:${op}:${e}`,
    params: { b: base, x, y, op },
  };
}

export const P8H: Prototype = {
  id: '8.H',
  group: 'II',
  nazvanie: 'Сумма и разность логарифмов',
  podtipy: [
    podtip('int', 'base', (r) => drawH(r, false, r.pick([2, 3, 4, 5, 6, 7, 8, 9]), r.int(1, 4))),
    podtip('dec-args', 'advanced', (r) =>
      drawH(r, true, r.pick([2, 3, 4, 5, 6, 7, 8, 9]), r.pick([-2, -1, 1, 2, 3])),
    ),
    podtip('dec-base', 'advanced', (r) =>
      drawH(r, r.pick([true, false]), r.pick([0.2, 0.5, 0.7, 0.8]), r.pick([-2, -1, 1, 2])),
    ),
  ],
  isklyucheniya: keys([
    { b: 6, x: 3, y: 2, op: '+' },
    { b: 8, x: 2, y: 32, op: '+' },
    { b: 2, x: 56, y: 7, op: '-' },
    { b: 3, x: 72, y: 8, op: '-' },
    { b: 7, x: 12.25, y: 4, op: '+' },
    { b: 3, x: 6.75, y: 4, op: '+' },
    { b: 2, x: 6.4, y: 10, op: '+' },
    { b: 4, x: 51.2, y: 5, op: '+' },
    { b: 2, x: 24, y: 0.75, op: '-' },
    { b: 3, x: 121.5, y: 1.5, op: '-' },
    { b: 6, x: 135, y: 3.75, op: '-' },
    { b: 5, x: 312.5, y: 2.5, op: '-' },
    { b: 0.7, x: 10, y: 7, op: '-' },
    { b: 0.8, x: 5, y: 4, op: '-' },
    { b: 0.5, x: 4, y: 1, op: '-' },
    { b: 0.2, x: 50, y: 2, op: '-' },
  ]),
};

/* ── 8.I  частное логарифмов плюс логарифм ───────────────────── */

function razborI(
  b: number,
  c: number,
  a: number,
  dd: number,
  e: number,
): { razbor: Shag[]; delimost?: Priznak[] } {
  const znaki: Priznak[] = [];
  const B = String(b);
  const { fold, steps } = logProizvedeniya(b, a, dd, e, znaki);
  return sPriznakami(
    [
      perekhod(String(c), String(a), B),
      shag(
        `Теперь оба логарифма по основанию $${b}$, а сумма логарифмов — логарифм произведения: $\\log_a x + \\log_a y = \\log_a (xy)$`,
        `${log(B, String(a))} + ${log(B, d(dd))} = ${log(B, `(${a} \\cdot ${d(dd)})`)}${fold}`,
      ),
      ...steps,
    ],
    znaki,
  );
}

export const P8I: Prototype = {
  id: '8.I',
  group: 'II',
  nazvanie: 'Переход к новому основанию с добавкой',
  podtipy: [
    podtip('1', 'advanced', (r) => {
      const b = r.pick([2, 3, 4, 5, 6, 7, 8, 9, 11, 13, 14]);
      const c = r.pick([2, 3, 5, 7, 9]);
      if (c === b) {
        return null;
      }
      const e = r.pick([-1, 0, 1, 1, 2, 2, 3]);
      const a = r.int(2, 59);
      const dd = round9(b ** e / a);
      if (!nice(dd, 2) || dd === 1 || dd === a || dd < 0.04 || isPowerOf(a, b)) {
        return null;
      }
      const tex = `\\dfrac{${log(String(c), String(a))}}{${log(String(c), String(b))}} + ${log(String(b), d(dd))}`;
      return {
        uslovie: naydi(tex),
        otvet: e,
        ...razborI(b, c, a, dd, e),
        proverka:
          Math.log(a) / Math.log(c) / (Math.log(b) / Math.log(c)) + Math.log(dd) / Math.log(b),
        signature: `${b}:${e}`,
        params: { b, c, a, d: dd },
      };
    }),
  ],
  isklyucheniya: keys([
    { b: 13, c: 5, a: 2, d: 0.5 },
    { b: 8, c: 7, a: 40, d: 0.2 },
    { b: 5, c: 3, a: 50, d: 0.5 },
    { b: 14, c: 2, a: 4, d: 3.5 },
    { b: 7, c: 9, a: 28, d: 1.75 },
    { b: 4, c: 7, a: 20, d: 0.2 },
  ]),
};

/* ── 8.J  частное логарифмов, чистый переход ─────────────────── */

/** Коэффициент 1/k перед логарифмом; при k = 1 — ничего. */
function obratnyy(k: number): string {
  return k === 1 ? '' : `\\frac{1}{${k}}`;
}

function razborJArg(b: number, m: number, n: number, a: number, ans: number): Shag[] {
  const A = String(a);
  const B = String(b);
  const osn = (k: number) => (k === 1 ? B : pw(B, String(k)));
  const stepeni = [m, n].filter((k) => k !== 1);
  const zapis = stepeni.map((k) => `$${b ** k} = ${pw(B, String(k))}$`).join(', ');
  const osnovaniya =
    stepeni.length === 1
      ? `Основание $${b ** (stepeni[0] as number)}$ — степень числа $${b}$: ${zapis}`
      : `Оба основания — степени числа $${b}$: ${zapis}`;
  const lab = log(B, A);
  const sverhu = `${obratnyy(m)}${lab}`;
  const snizu = `${obratnyy(n)}${lab}`;
  const levo = `\\dfrac{${sverhu}}{${snizu}}`;
  let konec: string[];
  let pochemu: string;
  if (m === 1) {
    konec = [`1 : \\dfrac{1}{${n}}`, String(n)];
    pochemu = `Делить на $\\dfrac{1}{${n}}$ — значит умножать на $${n}$`;
  } else if (n === 1) {
    konec = [`\\dfrac{1}{${m}}`, d(ans)];
    pochemu = 'Остаётся коэффициент числителя';
  } else {
    const [p, q] = sokr(n, m);
    konec = [
      `\\dfrac{1}{${m}} : \\dfrac{1}{${n}}`,
      `\\dfrac{1}{${m}} \\cdot ${n}`,
      `\\dfrac{${n}}{${m}}`,
    ];
    if (q !== m) konec.push(drobTex(p, q));
    if (q !== 1) konec.push(d(ans));
    pochemu = `Остаётся частное коэффициентов, а делить на $\\dfrac{1}{${n}}$ — значит умножать на $${n}$${
      q !== m ? `. Дробь сокращаем на $${m / q}$` : ''
    }`;
  }
  return [
    shag(
      `${osnovaniya}. Показатель основания выносим вперёд обратным числом: $\\log_{a^{k}} x = \\dfrac{1}{k}\\log_a x$`,
      cepochka([
        `\\dfrac{${log(String(b ** m), A)}}{${log(String(b ** n), A)}}`,
        `\\dfrac{${log(osn(m), A)}}{${log(osn(n), A)}}`,
        levo,
      ]),
    ),
    shag(
      `Сокращаем $${lab}$ — он стоит и в числителе, и в знаменателе и не равен нулю, так как $${a} \\ne 1$. ${pochemu}`,
      cepochka([levo, ...konec]),
    ),
  ];
}

export const P8J: Prototype = {
  id: '8.J',
  group: 'II',
  nazvanie: 'Частное логарифмов',
  podtipy: [
    podtip('same-base', 'base', (r) => {
      const c = r.pick([2, 3, 5, 7, 11]);
      const b = r.int(2, 10);
      const e = r.int(2, 5);
      if (b === c || b ** e > 2000 || isPowerOf(b, c)) {
        return null;
      }
      const tex = `\\dfrac{${log(String(c), String(b ** e))}}{${log(String(c), String(b))}}`;
      return {
        uslovie: naydi(tex),
        otvet: e,
        razbor: [perekhod(String(c), String(b ** e), String(b)), logStepeni(b, e, String(b ** e))],
        proverka: Math.log(b ** e) / Math.log(c) / (Math.log(b) / Math.log(c)),
        signature: `${b}:${e}`,
        params: { c, b, e },
      };
    }),
    podtip('same-arg', 'advanced', (r) => {
      const b = r.pick([2, 3, 5]);
      const m = r.int(1, 6);
      const n = r.int(1, 6);
      if (m === n || b ** m > 100 || b ** n > 100) {
        return null;
      }
      const ans = round9(n / m);
      if (!nice(ans, 2)) {
        return null;
      }
      const a = r.pick([5, 7, 8, 11, 13, 14, 17]);
      if (isPowerOf(a, b)) {
        return null;
      }
      const tex = `\\dfrac{${log(String(b ** m), String(a))}}{${log(String(b ** n), String(a))}}`;
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: razborJArg(b, m, n, a, ans),
        proverka: Math.log(a) / Math.log(b ** m) / (Math.log(a) / Math.log(b ** n)),
        signature: `${b}:${m}:${n}`,
        params: { b, m, n, a },
      };
    }),
  ],
  isklyucheniya: keys([
    { c: 7, b: 3, e: 5 },
    { c: 3, b: 2, e: 8 },
    { c: 2, b: 9, e: 3 },
    { c: 11, b: 10, e: 2 },
    { b: 3, m: 2, n: 4, a: 5 },
    { b: 2, m: 1, n: 4, a: 8 },
    { b: 2, m: 3, n: 6, a: 14 },
    { b: 3, m: 1, n: 3, a: 17 },
  ]),
};

/* ── 8.K  произведение логарифмов ────────────────────────────── */

/**
 * Первый шаг 8.K: во втором логарифме переходим к основанию первого,
 * и log_b a сокращается. koef — множитель перед произведением.
 */
function cepnoe(koef: string, b: string, a: string, c: string): Shag {
  return shag(
    `Во втором логарифме переходим к основанию $${b}$: $${log(a, c)} = \\dfrac{${log(b, c)}}{${log(b, a)}}$ — формула перехода верна для любого нового основания. Тогда $${log(b, a)}$ сокращается: он не равен нулю, так как $${a} \\ne 1$`,
    `${koef}${log(b, a)} \\cdot ${log(a, c)} = ${koef}${log(b, a)} \\cdot \\dfrac{${log(b, c)}}{${log(b, a)}} = ${koef}${log(b, c)}`,
  );
}

export const P8K: Prototype = {
  id: '8.K',
  group: 'II',
  nazvanie: 'Произведение логарифмов',
  podtipy: [
    podtip('int', 'base', (r) => {
      const b = r.pick([2, 3, 4, 5, 7]);
      const e = r.int(2, 5);
      const c = b ** e;
      if (c > 1000) {
        return null;
      }
      const a = r.pick([2, 3, 5, 7, 11, 13]);
      if (a === b || a === c || isPowerOf(a, b)) {
        return null;
      }
      const tex = `${log(String(b), String(a))} \\cdot ${log(String(a), String(c))}`;
      return {
        uslovie: naydi(tex),
        otvet: e,
        razbor: [cepnoe('', String(b), String(a), String(c)), logStepeni(b, e, String(c))],
        proverka: (Math.log(a) / Math.log(b)) * (Math.log(c) / Math.log(a)),
        signature: `${b}:${e}`,
        params: { b, a, c, k: 1 },
      };
    }),
    podtip('dec', 'advanced', (r) => {
      const b = r.pick([1.25, 2.5, 0.2, 0.25, 1.5, 2, 3, 5]);
      const e = r.pick([-1, -1, 2, 3]);
      const c = round9(b ** e);
      if (!nice(c, 2) || c > 1000 || c < 0.01 || c === 1) {
        return null;
      }
      const a = r.pick([2, 3, 5, 7, 11, 13]);
      if (a === b || a === c || isPowerOf(a, b)) {
        return null;
      }
      const k = r.int(2, 9);
      const ans = k * e;
      const tex = `${k}${log(d(b), String(a))} \\cdot ${log(String(a), d(c))}`;
      const st = pw(d(b), String(e));
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: [
          cepnoe(String(k), d(b), String(a), d(c)),
          shag(
            `${
              e === -1
                ? `Числа взаимно обратные: $${d(b)} \\cdot ${d(c)} = 1$, поэтому $${d(c)} = ${st}$`
                : `Узнаём степень основания: $${d(c)} = ${st}$`
            }. Логарифм степени основания равен показателю, остаётся умножить на $${k}$`,
            `${k}${log(d(b), d(c))} = ${k}${log(d(b), st)} = ${k} \\cdot ${paren(e)} = ${d(ans)}`,
          ),
        ],
        proverka: k * (Math.log(a) / Math.log(b)) * (Math.log(c) / Math.log(a)),
        signature: `${b}:${e}`,
        params: { b, a, c, k },
      };
    }),
  ],
  isklyucheniya: keys([
    { b: 3, a: 5, c: 81, k: 1 },
    { b: 2, a: 7, c: 32, k: 1 },
    { b: 4, a: 3, c: 16, k: 1 },
    { b: 5, a: 2, c: 125, k: 1 },
    { b: 1.25, a: 5, c: 0.8, k: 4 },
    { b: 2.5, a: 11, c: 0.4, k: 7 },
  ]),
};

/* ── 8.L  логарифм с корнем ──────────────────────────────────── */

/** Корень в основании: log_{ⁿ√b} b^m = n·m — число записываем степенью корня. */
function razborLBase(n: number, b: number, m: number, k: number, ans: number): Shag[] {
  const kor = root(n, String(b));
  const skob = `\\left(${kor}\\right)`;
  const arg = m === 1 ? String(b) : String(b ** m);
  const st = pw(skob, String(n * m));
  const koef = k === 1 ? '' : String(k);
  return [
    m === 1
      ? shag(
          `Записываем $${b}$ как степень основания: корень $n$-й степени, возведённый в $n$-ю степень, равен подкоренному числу — $(\\sqrt[n]{a})^{n} = a$`,
          `${b} = ${st}`,
        )
      : shag(
          `Записываем $${arg}$ как степень основания: $${b} = ${pw(skob, String(n))}$, потому что $(\\sqrt[n]{a})^{n} = a$. Степень в степени — показатели перемножаются`,
          `${arg} = ${pw(String(b), String(m))} = ${pw(`\\left(${pw(skob, String(n))}\\right)`, String(m))} = ${st}`,
        ),
    shag(
      `Логарифм степени основания равен показателю: $\\log_a a^{c} = c$${k === 1 ? '' : `. Остаётся умножить на $${k}$`}`,
      cepochka([
        `${koef}${log(kor, arg)}`,
        `${koef}${log(kor, st)}`,
        ...(k === 1 ? [] : [`${k} \\cdot ${n * m}`]),
        d(ans),
      ]),
    ),
  ];
}

/** Корень под логарифмом: log_b ⁿ√(b^m) = m/n — корень записываем степенью. */
function razborLArg(n: number, b: number, m: number, k: number, ans: number): Shag[] {
  const B = String(b);
  const arg = root(n, String(b ** m));
  const g = gcd(m, n);
  const [p, q] = [m / g, n / g];
  const pokazatel = q === 1 ? String(p) : fracExp(p, q);
  const st = q === 1 && p === 1 ? B : pw(B, pokazatel);
  const koef = k === 1 ? '' : String(k);
  const pervyy =
    m === 1
      ? shag(
          'Корень — степень с дробным показателем: $\\sqrt[n]{a} = a^{\\frac{1}{n}}$',
          `${arg} = ${st}`,
        )
      : shag(
          `Записываем $${b ** m}$ как степень основания: $${b ** m} = ${pw(B, String(m))}$. Корень — степень с дробным показателем: $\\sqrt[n]{a^{m}} = a^{\\frac{m}{n}}$${
            g > 1 ? `, а показатель $\\frac{${m}}{${n}}$ сокращаем на $${g}$` : ''
          }`,
          cepochka([arg, root(n, pw(B, String(m))), pw(B, `\\frac{${m}}{${n}}`), st]),
        );
  const znach = q === 1 ? String(p) : `\\dfrac{${p}}{${q}}`;
  const chain = [`${koef}${log(B, arg)}`, `${koef}${log(B, st)}`];
  let chto =
    q === 1 && p === 1
      ? 'Под логарифмом получилось само основание, а $\\log_a a = 1$'
      : 'Логарифм степени основания равен показателю: $\\log_a a^{c} = c$';
  if (k === 1) {
    chain.push(znach);
    if (q !== 1) chain.push(d(ans));
  } else if (q === 1) {
    chain.push(`${k} \\cdot ${p}`, d(ans));
    chto += `. Остаётся умножить на $${k}$`;
  } else {
    chain.push(`${k} \\cdot ${znach}`);
    const { chain: dalshe, chto: kak } = naDrob(k, p, q, ans);
    chain.push(...dalshe);
    chto += `. ${kak}`;
  }
  return [pervyy, shag(chto, cepochka(chain))];
}

export const P8L: Prototype = {
  id: '8.L',
  group: 'II',
  nazvanie: 'Логарифм с корнем',
  podtipy: [
    podtip('root-base', 'base', (r) => {
      const n = r.int(2, 8);
      const b = r.pick([2, 3, 5, 7, 11, 13]);
      const k = r.int(2, 12);
      const ans = k * n;
      const tex = `${k}${log(root(n, String(b)), String(b))}`;
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: razborLBase(n, b, 1, k, ans),
        proverka: (k * Math.log(b)) / Math.log(Math.pow(b, 1 / n)),
        signature: `${n}:base`,
        params: { n, b, m: 1, k, where: 'base' },
      };
    }),
    podtip('root-base-pow', 'advanced', (r) => {
      const n = r.int(2, 8);
      const b = r.pick([2, 3, 5, 7, 11, 13]);
      const m = r.pick([2, 3]);
      const k = r.int(1, 9);
      const ans = k * n * m;
      const arg = String(b ** m);
      const tex = `${k === 1 ? '' : k}${log(root(n, String(b)), arg)}`;
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: razborLBase(n, b, m, k, ans),
        proverka: (k * Math.log(b ** m)) / Math.log(Math.pow(b, 1 / n)),
        signature: `${n}:${m}:base`,
        params: { n, b, m, k, where: 'base' },
      };
    }),
    podtip('root-arg', 'base', (r) => {
      const n = r.pick([2, 4, 5, 8, 10]);
      const b = r.pick([2, 3, 5, 7, 11, 13]);
      const k = r.int(2, 12);
      const ans = round9(k / n);
      if (!nice(ans, 3)) {
        return null;
      }
      const tex = `${k}${log(String(b), root(n, String(b)))}`;
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: razborLArg(n, b, 1, k, ans),
        proverka: (k * Math.log(Math.pow(b, 1 / n))) / Math.log(b),
        signature: `${n}:${k}:arg`,
        params: { n, b, m: 1, k, where: 'arg' },
      };
    }),
    podtip('root-arg-pow', 'advanced', (r) => {
      const n = r.int(2, 8);
      const b = r.pick([2, 3, 5, 7, 11]);
      const m = r.pick([2, 3, 4]);
      const k = r.int(1, 12);
      const ans = round9((k * m) / n);
      if (!nice(ans, 2) || b ** m > 1000) {
        return null;
      }
      const arg = root(n, String(b ** m));
      const tex = `${k === 1 ? '' : k}${log(String(b), arg)}`;
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: razborLArg(n, b, m, k, ans),
        proverka: (k * Math.log(Math.pow(b ** m, 1 / n))) / Math.log(b),
        signature: `${n}:${m}:arg`,
        params: { n, b, m, k, where: 'arg' },
      };
    }),
  ],
  isklyucheniya: keys([
    { n: 6, b: 13, m: 1, k: 6, where: 'base' },
    { n: 5, b: 21, m: 1, k: 5, where: 'base' },
    { n: 4, b: 5, m: 2, k: 3, where: 'base' },
    { n: 5, b: 7, m: 2, k: 2, where: 'base' },
    { n: 4, b: 5, m: 1, k: 8, where: 'arg' },
    { n: 3, b: 7, m: 1, k: 9, where: 'arg' },
    { n: 5, b: 2, m: 4, k: 15, where: 'arg' },
    { n: 4, b: 3, m: 3, k: 20, where: 'arg' },
  ]),
};
