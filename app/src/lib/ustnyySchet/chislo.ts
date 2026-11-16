/**
 * Точные числа устного счёта: конечная десятичная дробь как целое
 * BigInt и число знаков после запятой. Никакой плавающей точки:
 * 0,1 + 0,2 здесь ровно 0,3.
 *
 * Здесь же — разбор и вычисление коротких выражений («(100-1)^2»,
 * «360/10+18», «sqrt(729)»). Из них собраны примеры и шаги разборов:
 * каждое звено разбора — выражение, и проверка
 * (scripts/check-ustnyy-schet.mjs) пересчитывает его независимо.
 * Отсюда же — запись выражения для KaTeX.
 *
 * Модуль чистый, без браузера и React.
 */

/** Число m / 10^e, e ≥ 0; хвостовых нулей у дробной части нет. */
export interface Dec {
  readonly m: bigint;
  readonly e: number;
}

function norm(m: bigint, e: number): Dec {
  let mm = m;
  let ee = e;
  while (ee > 0 && mm % 10n === 0n) {
    mm /= 10n;
    ee -= 1;
  }
  return { m: mm, e: ee };
}

const POW10: bigint[] = [];
function p10(n: number): bigint {
  if (POW10[n] === undefined) POW10[n] = 10n ** BigInt(n);
  return POW10[n] as bigint;
}

/** Число из записи «-12.5» (точка; запятая тоже понимается). */
export function dec(x: string | number | bigint): Dec {
  if (typeof x === 'bigint') return { m: x, e: 0 };
  if (typeof x === 'number') {
    if (!Number.isSafeInteger(x)) {
      throw new Error(`dec: дробное число передаётся строкой, а не number: ${x}`);
    }
    return { m: BigInt(x), e: 0 };
  }
  const m = /^(-?)(\d+)(?:[.,](\d+))?$/.exec(x.trim());
  if (m === null) throw new Error(`dec: не число «${x}»`);
  const [, sign = '', whole = '', frac = ''] = m;
  const v = BigInt(whole + frac) * (sign === '-' ? -1n : 1n);
  return norm(v, frac.length);
}

function align(a: Dec, b: Dec): [bigint, bigint, number] {
  const e = Math.max(a.e, b.e);
  return [a.m * p10(e - a.e), b.m * p10(e - b.e), e];
}

export function add(a: Dec, b: Dec): Dec {
  const [x, y, e] = align(a, b);
  return norm(x + y, e);
}

export function sub(a: Dec, b: Dec): Dec {
  const [x, y, e] = align(a, b);
  return norm(x - y, e);
}

export function mul(a: Dec, b: Dec): Dec {
  return norm(a.m * b.m, a.e + b.e);
}

export function neg(a: Dec): Dec {
  return { m: -a.m, e: a.e };
}

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) [x, y] = [y, x % y];
  return x;
}

/** Деление; бесконечная дробь в ответе — ошибка (такой пример не годится). */
export function div(a: Dec, b: Dec): Dec {
  if (b.m === 0n) throw new Error('div: деление на ноль');
  let num = a.m * p10(b.e);
  let den = b.m * p10(a.e);
  if (den < 0n) {
    num = -num;
    den = -den;
  }
  const g = gcd(num, den);
  num /= g;
  den /= g;
  /* Знаменатель вида 2^x·5^y — дробь конечная. */
  let d = den;
  let twos = 0;
  let fives = 0;
  while (d % 2n === 0n) {
    d /= 2n;
    twos += 1;
  }
  while (d % 5n === 0n) {
    d /= 5n;
    fives += 1;
  }
  if (d !== 1n) throw new Error('div: бесконечная десятичная дробь');
  const e = Math.max(twos, fives);
  return norm((num * p10(e)) / den, e);
}

export function pow(a: Dec, n: number): Dec {
  if (!Number.isInteger(n) || n < 0 || n > 40) throw new Error(`pow: показатель ${n}`);
  let r: Dec = { m: 1n, e: 0 };
  for (let i = 0; i < n; i += 1) r = mul(r, a);
  return r;
}

/** Квадратный корень — только из точного квадрата. */
export function sqrt(a: Dec): Dec {
  if (a.m < 0n) throw new Error('sqrt: отрицательное');
  if (a.e % 2 !== 0) {
    return sqrt({ m: a.m * 10n, e: a.e + 1 });
  }
  let lo = 0n;
  let hi = a.m + 1n;
  while (hi - lo > 1n) {
    const mid = (lo + hi) / 2n;
    if (mid * mid <= a.m) lo = mid;
    else hi = mid;
  }
  if (lo * lo !== a.m) throw new Error('sqrt: не точный квадрат');
  return norm(lo, a.e / 2);
}

export function cmp(a: Dec, b: Dec): number {
  const [x, y] = align(a, b);
  return x === y ? 0 : x < y ? -1 : 1;
}

export function eq(a: Dec, b: Dec): boolean {
  return cmp(a, b) === 0;
}

export function isInt(a: Dec): boolean {
  return a.e === 0;
}

/** Обычное число JS — только для подбора чисел в генераторах, не для ответа. */
export function toNumber(a: Dec): number {
  return Number(a.m) / 10 ** a.e;
}

/** Нормальная запись ответа, как у lib/otvet: «-2.25», «7225». */
export function str(a: Dec): string {
  const neg0 = a.m < 0n;
  const digits = (neg0 ? -a.m : a.m).toString().padStart(a.e + 1, '0');
  const whole = digits.slice(0, digits.length - a.e);
  const frac = digits.slice(digits.length - a.e);
  const body = frac === '' ? whole : `${whole}.${frac}`;
  return neg0 ? `-${body}` : body;
}

/** Число знаков после запятой. */
export function znakov(a: Dec): number {
  return a.e;
}

/* ── Выражения ────────────────────────────────────────────────── */

export type Uzel =
  | { t: 'n'; v: string }
  | { t: 'op'; op: '+' | '-' | '*' | '/'; a: Uzel; b: Uzel }
  | { t: 'pow'; a: Uzel; b: Uzel }
  | { t: 'neg'; a: Uzel }
  | { t: 'sqrt'; a: Uzel }
  | { t: 'par'; a: Uzel };

function tokens(s: string): string[] {
  const out: string[] = [];
  const re = /\s*(\d+(?:\.\d+)?|sqrt|[-+*/^()])/y;
  let i = 0;
  while (i < s.length) {
    if (/\s/.test(s[i] ?? '')) {
      i += 1;
      continue;
    }
    re.lastIndex = i;
    const m = re.exec(s);
    if (m === null) throw new Error(`разбор: непонятный знак в «${s}» на ${i}`);
    out.push(m[1] as string);
    i = re.lastIndex;
  }
  return out;
}

/** Разбор выражения: + − · : ^, скобки, унарный минус, sqrt(…). */
export function razobrat(s: string): Uzel {
  const tk = tokens(s);
  let i = 0;
  const peek = () => tk[i];
  const take = (want?: string): string => {
    const t = tk[i];
    if (t === undefined || (want !== undefined && t !== want)) {
      throw new Error(`разбор: ждали «${want ?? 'что-то'}» в «${s}»`);
    }
    i += 1;
    return t;
  };
  function expr(): Uzel {
    let a = term();
    while (peek() === '+' || peek() === '-') {
      const op = take() as '+' | '-';
      a = { t: 'op', op, a, b: term() };
    }
    return a;
  }
  function term(): Uzel {
    let a = unary();
    while (peek() === '*' || peek() === '/') {
      const op = take() as '*' | '/';
      a = { t: 'op', op, a, b: unary() };
    }
    return a;
  }
  function unary(): Uzel {
    if (peek() === '-') {
      take();
      return { t: 'neg', a: unary() };
    }
    return power();
  }
  function power(): Uzel {
    const a = primary();
    if (peek() === '^') {
      take();
      return { t: 'pow', a, b: unary() };
    }
    return a;
  }
  function primary(): Uzel {
    const t = peek();
    if (t === '(') {
      take('(');
      const a = expr();
      take(')');
      return { t: 'par', a };
    }
    if (t === 'sqrt') {
      take();
      take('(');
      const a = expr();
      take(')');
      return { t: 'sqrt', a };
    }
    if (t !== undefined && /^\d/.test(t)) {
      take();
      return { t: 'n', v: t };
    }
    throw new Error(`разбор: ждали число в «${s}»`);
  }
  const root = expr();
  if (i !== tk.length) throw new Error(`разбор: лишнее в «${s}»`);
  return root;
}

export function vychislit(u: Uzel | string): Dec {
  const n = typeof u === 'string' ? razobrat(u) : u;
  switch (n.t) {
    case 'n':
      return dec(n.v);
    case 'par':
      return vychislit(n.a);
    case 'neg':
      return neg(vychislit(n.a));
    case 'sqrt':
      return sqrt(vychislit(n.a));
    case 'pow': {
      const b = vychislit(n.b);
      if (!isInt(b)) throw new Error('pow: дробный показатель');
      return pow(vychislit(n.a), Number(b.m));
    }
    case 'op': {
      const a = vychislit(n.a);
      const b = vychislit(n.b);
      return n.op === '+'
        ? add(a, b)
        : n.op === '-'
          ? sub(a, b)
          : n.op === '*'
            ? mul(a, b)
            : div(a, b);
    }
  }
}

/* ── Запись для KaTeX ────────────────────────────────────────── */

/** Число в TeX: запятая «{,}», тонкие пробелы в длинных целых (10 000). */
export function chisloTex(v: string): string {
  const neg0 = v.startsWith('-');
  const body = neg0 ? v.slice(1) : v;
  const [whole = '', frac] = body.split('.');
  const w = whole.length >= 5 ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, '\\,') : whole;
  const t = frac === undefined ? w : `${w}{,}${frac}`;
  return neg0 ? `-${t}` : t;
}

/** Число обычным текстом: «−2,25», «10 000» (узкий неразрывный пробел). */
export function chisloText(v: string): string {
  const neg0 = v.startsWith('-');
  const body = neg0 ? v.slice(1) : v;
  const [whole = '', frac] = body.split('.');
  const w = whole.length >= 5 ? whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : whole;
  const t = frac === undefined ? w : `${w},${frac}`;
  return neg0 ? `−${t}` : t;
}

function texUzla(n: Uzel): string {
  switch (n.t) {
    case 'n':
      return chisloTex(n.v);
    case 'par':
      return `(${texUzla(n.a)})`;
    case 'neg':
      return `-${texUzla(n.a)}`;
    case 'sqrt':
      return `\\sqrt{${texUzla(n.a)}}`;
    case 'pow':
      return `${texUzla(n.a)}^{${texUzla(n.b)}}`;
    case 'op': {
      const op = n.op === '*' ? '\\cdot' : n.op === '/' ? ':' : n.op;
      return `${texUzla(n.a)} ${op} ${texUzla(n.b)}`;
    }
  }
}

/** Выражение → TeX: «(100-1)^2» → «(100 - 1)^{2}», «*» → «\cdot», «/» → «:». */
export function tex(s: string): string {
  return texUzla(razobrat(s));
}

/** Выражение → обычный текст для скринридера и итогов: «85²», «48 · 52». */
export function text(s: string): string {
  const sup: Record<string, string> = {
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
  };
  function t(n: Uzel): string {
    switch (n.t) {
      case 'n':
        return chisloText(n.v);
      case 'par':
        return `(${t(n.a)})`;
      case 'neg':
        return `−${t(n.a)}`;
      case 'sqrt':
        return `√${t(n.a)}`;
      case 'pow': {
        const b = t(n.b);
        return /^\d+$/.test(b)
          ? `${t(n.a)}${[...b].map((c) => sup[c] ?? c).join('')}`
          : `${t(n.a)}^${b}`;
      }
      case 'op': {
        const op = n.op === '*' ? '·' : n.op === '/' ? ':' : n.op === '-' ? '−' : '+';
        return `${t(n.a)} ${op} ${t(n.b)}`;
      }
    }
  }
  return t(razobrat(s));
}
