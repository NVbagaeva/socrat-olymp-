/**
 * Точная дробь для солвера задания №13.
 *
 * Солвер пересчитывает таблицу по периодам без округлений: k = 1,1
 * в двадцатой степени в числах с плавающей точкой уже теряет копейки,
 * а проверка «ответ — конечная десятичная дробь» и «соседнее целое
 * не подходит» требует точного равенства. Поэтому числитель и
 * знаменатель — BigInt, знаменатель всегда положительный, дробь
 * всегда сокращена.
 */

const gcd = (a: bigint, b: bigint): bigint => {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) [x, y] = [y, x % y];
  return x;
};

export type DrobInput = Drob | number | bigint | string;

export class Drob {
  readonly n: bigint;
  readonly d: bigint;

  private constructor(n: bigint, d: bigint) {
    if (d === 0n) throw new Error('Drob: деление на ноль');
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d) || 1n;
    this.n = n / g;
    this.d = d / g;
  }

  static of(x: DrobInput, d: DrobInput = 1n): Drob {
    const a = Drob.parse(x);
    if (d === 1n) return a;
    return a.div(Drob.parse(d));
  }

  /** Число из записи: 1,25 и 1.25 — одно и то же; число JS — только конечная десятичная запись. */
  private static parse(x: DrobInput): Drob {
    if (x instanceof Drob) return x;
    if (typeof x === 'bigint') return new Drob(x, 1n);
    const s = (typeof x === 'number' ? String(x) : x).trim().replace(',', '.');
    if (typeof x === 'number' && !Number.isFinite(x)) throw new Error(`Drob: не число ${x}`);
    if (/e/i.test(s)) throw new Error(`Drob: экспоненциальная запись не поддерживается: ${s}`);
    const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(s);
    if (!m) throw new Error(`Drob: не число «${s}»`);
    const frac = m[3] ?? '';
    const n = BigInt((m[1] ?? '') + (m[2] ?? '0') + frac);
    return new Drob(n, 10n ** BigInt(frac.length));
  }

  add(x: DrobInput): Drob {
    const b = Drob.of(x);
    return new Drob(this.n * b.d + b.n * this.d, this.d * b.d);
  }
  sub(x: DrobInput): Drob {
    const b = Drob.of(x);
    return new Drob(this.n * b.d - b.n * this.d, this.d * b.d);
  }
  mul(x: DrobInput): Drob {
    const b = Drob.of(x);
    return new Drob(this.n * b.n, this.d * b.d);
  }
  div(x: DrobInput): Drob {
    const b = Drob.of(x);
    return new Drob(this.n * b.d, this.d * b.n);
  }
  pow(k: number): Drob {
    let r = Drob.of(1n);
    for (let i = 0; i < k; i++) r = r.mul(this);
    return r;
  }
  neg(): Drob {
    return new Drob(-this.n, this.d);
  }
  cmp(x: DrobInput): -1 | 0 | 1 {
    const b = Drob.of(x);
    const l = this.n * b.d;
    const r = b.n * this.d;
    return l < r ? -1 : l > r ? 1 : 0;
  }
  eq(x: DrobInput): boolean {
    return this.cmp(x) === 0;
  }
  lt(x: DrobInput): boolean {
    return this.cmp(x) < 0;
  }
  gt(x: DrobInput): boolean {
    return this.cmp(x) > 0;
  }
  isInteger(): boolean {
    return this.d === 1n;
  }
  isPositive(): boolean {
    return this.n > 0n;
  }

  /** Конечная десятичная дробь: в знаменателе только двойки и пятёрки. */
  isFiniteDecimal(): boolean {
    let d = this.d;
    while (d % 2n === 0n) d /= 2n;
    while (d % 5n === 0n) d /= 5n;
    return d === 1n;
  }

  /** Число знаков после запятой у конечной дроби; у бесконечной — Infinity. */
  decimals(): number {
    if (!this.isFiniteDecimal()) return Infinity;
    let k = 0;
    while (Drob.of(this).mul(10n ** BigInt(k)).d !== 1n) k++;
    return k;
  }

  floor(): bigint {
    const q = this.n / this.d;
    return this.n < 0n && q * this.d !== this.n ? q - 1n : q;
  }
  ceil(): bigint {
    const f = this.floor();
    return f * this.d === this.n ? f : f + 1n;
  }

  toNumber(): number {
    return Number(this.n) / Number(this.d);
  }

  /** Запись для условия и ответа: «1 200 000», «813,5195». Только конечные дроби. */
  toRu(): string {
    if (!this.isFiniteDecimal())
      throw new Error(`Drob: ${this.n}/${this.d} — не конечная десятичная дробь`);
    const k = this.decimals();
    const scaled = this.mul(10n ** BigInt(k)).n;
    const neg = scaled < 0n;
    const digits = (neg ? -scaled : scaled).toString().padStart(k + 1, '0');
    const int = digits.slice(0, digits.length - k);
    const frac = digits.slice(digits.length - k);
    const grouped = int.length > 4 ? int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : int;
    return (neg ? '−' : '') + grouped + (k ? ',' + frac : '');
  }

  toString(): string {
    return this.d === 1n ? this.n.toString() : `${this.n}/${this.d}`;
  }
}

export const D = (x: DrobInput, d: DrobInput = 1n): Drob => Drob.of(x, d);

/** Коэффициент k = 1 + r/100. */
export const kOf = (r: DrobInput): Drob => D(1n).add(D(r).div(100n));

export const sum = (xs: readonly Drob[]): Drob => xs.reduce((a, b) => a.add(b), D(0n));
