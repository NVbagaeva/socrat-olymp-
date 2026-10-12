/**
 * Точные дроби для шаблонов задания №5.
 *
 * Ответ шаблона считается только в дробях: 0,1 + 0,2 здесь ровно 3/10,
 * а не 0,30000000000000004. В число с плавающей точкой дробь переводится
 * один раз — при записи ответа, и то через целые (BigInt), так что
 * округление до сотых не ошибается на границе.
 */

const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const FIVE = BigInt(5);
const TEN = BigInt(10);

function gcd(a: bigint, b: bigint): bigint {
  let x = a < ZERO ? -a : a;
  let y = b < ZERO ? -b : b;
  while (y !== ZERO) {
    [x, y] = [y, x % y];
  }
  return x;
}

export class Drob {
  /** Числитель и знаменатель в несократимом виде, знаменатель > 0. */
  readonly p: bigint;
  readonly q: bigint;

  constructor(p: bigint, q: bigint = ONE) {
    if (q === ZERO) {
      throw new Error('Drob: знаменатель равен нулю');
    }
    const s = q < ZERO ? -ONE : ONE;
    const g = gcd(p, q) || ONE;
    this.p = (s * p) / g;
    this.q = (s * q) / g;
  }

  plus(o: Drob): Drob {
    return new Drob(this.p * o.q + o.p * this.q, this.q * o.q);
  }
  minus(o: Drob): Drob {
    return new Drob(this.p * o.q - o.p * this.q, this.q * o.q);
  }
  times(o: Drob): Drob {
    return new Drob(this.p * o.p, this.q * o.q);
  }
  div(o: Drob): Drob {
    return new Drob(this.p * o.q, this.q * o.p);
  }
  /** 1 − x: вероятность противоположного события. */
  ne(): Drob {
    return ED.minus(this);
  }
  eq(o: Drob): boolean {
    return this.p === o.p && this.q === o.q;
  }
  lt(o: Drob): boolean {
    return this.p * o.q < o.p * this.q;
  }
  le(o: Drob): boolean {
    return this.p * o.q <= o.p * this.q;
  }
  toNumber(): number {
    return Number(this.p) / Number(this.q);
  }
  toString(): string {
    return this.q === ONE ? String(this.p) : `${this.p}/${this.q}`;
  }
}

/** Дробь из целых: d(3, 20) = 3/20, d(7) = 7. */
export function d(p: number | bigint, q: number | bigint = 1): Drob {
  return new Drob(BigInt(p), BigInt(q));
}

/** Проценты: pr(15) = 15/100. */
export function pr(n: number): Drob {
  return d(n, 100);
}

export const NOL = d(0);
export const ED = d(1);

/** Сумма и произведение списка. */
export function summa(xs: readonly Drob[]): Drob {
  return xs.reduce((s, x) => s.plus(x), NOL);
}
export function proizv(xs: readonly Drob[]): Drob {
  return xs.reduce((s, x) => s.times(x), ED);
}

/** x в степени n, n ≥ 0. */
export function step(x: Drob, n: number): Drob {
  let out = ED;
  for (let i = 0; i < n; i += 1) {
    out = out.times(x);
  }
  return out;
}

/** Число сочетаний C(n, k). */
export function cnk(n: number, k: number): number {
  if (k < 0 || k > n) {
    return 0;
  }
  let out = 1;
  for (let i = 1; i <= k; i += 1) {
    out = (out * (n - k + i)) / i;
  }
  return Math.round(out);
}

/**
 * Сколько знаков после запятой у конечной десятичной дроби.
 * null — дробь бесконечная (в знаменателе есть множители кроме 2 и 5).
 */
export function znakov(x: Drob): number | null {
  let q = x.q;
  let a = 0;
  let b = 0;
  while (q % TWO === ZERO) {
    q /= TWO;
    a += 1;
  }
  while (q % FIVE === ZERO) {
    q /= FIVE;
    b += 1;
  }
  return q === ONE ? Math.max(a, b) : null;
}

/** Запись с десятичной запятой ровно с k знаками, округление «половина вверх». */
function zapis(x: Drob, k: number): string {
  const m = TEN ** BigInt(k);
  const neg = x.p < ZERO;
  const p = neg ? -x.p : x.p;
  /* Округление p·m/q до целого: (2·p·m + q) / (2·q). */
  const n = (TWO * p * m + x.q) / (TWO * x.q);
  const s = n.toString().padStart(k + 1, '0');
  const cel = s.slice(0, s.length - k);
  const dr = s.slice(s.length - k);
  return (neg ? '−' : '') + (k === 0 ? cel : `${cel},${dr}`);
}

/** Точная запись конечной дроби: «0,052». Бесконечная — ошибка. */
export function dec(x: Drob): string {
  const k = znakov(x);
  if (k === null) {
    throw new Error(`dec: дробь ${x.toString()} не конечная`);
  }
  return zapis(x, k);
}

/** Запись с округлением до k знаков: «0,87». Хвостовые нули не срезаются. */
export function okrugl(x: Drob, k: number): string {
  return zapis(x, k);
}

/**
 * Насколько число далеко от середины между соседними ответами,
 * в долях шага округления: 0 — ровно «…5» (округление спорное),
 * 0,5 — число само лежит на сетке. Шаблон требует запас, чтобы
 * ответ ученика с обычным округлением не расходился с ключом.
 */
export function zapasOkrugleniya(x: Drob, k: number): number {
  const v = x.toNumber() * 10 ** k;
  const frac = v - Math.floor(v);
  return Math.abs(frac - 0.5);
}

/** Запись для TeX: «0{,}052». */
export function texDec(x: Drob): string {
  return dec(x).replace(',', '{,}').replace('−', '-');
}

/** Запись для TeX с округлением: «0{,}87». */
export function texOkrugl(x: Drob, k: number): string {
  return okrugl(x, k).replace(',', '{,}').replace('−', '-');
}

/** «\frac{3}{20}» — обыкновенная дробь в TeX. */
export function texFrac(x: Drob): string {
  return x.q === ONE ? String(x.p) : `\\frac{${x.p}}{${x.q}}`;
}

/** Конечная дробь — десятичной записью, иначе обыкновенной. */
export function texChislo(x: Drob): string {
  return znakov(x) === null ? texFrac(x) : texDec(x);
}

/** Проценты из дроби: 3/20 → «15». Только для дробей с конечной записью. */
export function procenty(x: Drob): string {
  return dec(x.times(d(100)));
}
