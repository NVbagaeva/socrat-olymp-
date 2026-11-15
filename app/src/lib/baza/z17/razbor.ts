/**
 * База №17: разбор записи уравнения (TeX) в дерево.
 *
 * Аналоги хранятся записью уравнения — так, как она стоит в условии.
 * Разборщик понимает то подмножество TeX, что встречается в №17:
 * числа (в том числе «0,2»), x, скобки и \left( \right), неявное
 * умножение «5x», «7(x+2)», \cdot и «:», степени ^{…}, \frac, \sqrt,
 * \log_{…}, \lg, \ln и \pi. У каждого узла хранится его запись в
 * условии — разбор цитирует части уравнения как есть.
 */

import { del, minus, NOL, ODIN, plus, prot, q, ravny, step, tseloe, umn, type Q } from './drobi';

export type Osnovanie = { vid: 'uzel'; u: Uzel } | { vid: 'e' } | { vid: 'lg' };

export type Uzel =
  | { t: 'num'; v: Q; s: string }
  | { t: 'x'; s: string }
  | { t: 'pi'; s: string }
  | { t: 'sum'; chleny: { minus: boolean; u: Uzel }[]; s: string }
  | { t: 'mul'; a: Uzel; b: Uzel; s: string }
  | { t: 'div'; a: Uzel; b: Uzel; frac: boolean; s: string }
  | { t: 'pow'; a: Uzel; b: Uzel; s: string }
  | { t: 'sqrt'; a: Uzel; s: string }
  | { t: 'log'; osn: Osnovanie; a: Uzel; s: string };

export interface Uravnenie {
  L: Uzel;
  R: Uzel;
  s: string;
}

interface Token {
  k: string;
  v?: string;
  from: number;
  to: number;
}

/** Запись для показа: «0,2» → «0{,}2». */
export const pokaz = (s: string): string => s.trim().replace(/(\d),(\d)/g, '$1{,}$2');

function tokeny(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i] ?? '';
    if (c === ' ') {
      i += 1;
      continue;
    }
    if (c === '\\') {
      const m = /^\\([a-zA-Z]+)/.exec(src.slice(i));
      if (m === null) throw new Error(`не разобрать «${src.slice(i)}»`);
      const cmd = m[1] ?? '';
      const to = i + m[0].length;
      if (cmd === 'left' || cmd === 'right') {
        const skobka = src[to];
        if (skobka !== '(' && skobka !== ')') throw new Error('\\left без скобки');
        out.push({ k: skobka, from: i, to: to + 1 });
        i = to + 1;
        continue;
      }
      out.push({ k: `\\${cmd}`, from: i, to });
      i = to;
      continue;
    }
    const num = /^\d+(,\d+)?/.exec(src.slice(i));
    if (num !== null) {
      out.push({ k: 'num', v: num[0], from: i, to: i + num[0].length });
      i += num[0].length;
      continue;
    }
    if ('x+-=(){}^_:'.includes(c)) {
      out.push({ k: c, from: i, to: i + 1 });
      i += 1;
      continue;
    }
    throw new Error(`неизвестный знак «${c}» в «${src}»`);
  }
  return out;
}

const NACHALO = new Set([
  'num',
  'x',
  '(',
  '\\frac',
  '\\sqrt',
  '\\log',
  '\\lg',
  '\\ln',
  '\\pi',
  '{',
]);

function chisloIz(s: string): Q {
  const [cel, dr] = s.split(',');
  if (dr === undefined) return q(BigInt(cel ?? '0'));
  return q(BigInt(`${cel ?? '0'}${dr}`), 10n ** BigInt(dr.length));
}

export function razobrat(src: string): Uravnenie {
  const tk = tokeny(src);
  let p = 0;
  const vid = (): string => tk[p]?.k ?? 'end';
  const zhdu = (k: string): Token => {
    const t = tk[p];
    if (t === undefined || t.k !== k) throw new Error(`ждали «${k}» в «${src}»`);
    p += 1;
    return t;
  };
  const otrezok = (from: number): string => {
    const a = tk[from]?.from ?? src.length;
    const b = tk[p - 1]?.to ?? src.length;
    return pokaz(src.slice(a, b));
  };

  function vyrazhenie(): Uzel {
    const start = p;
    const chleny: { minus: boolean; u: Uzel }[] = [];
    let znakMinus = false;
    if (vid() === '-' || vid() === '+') {
      znakMinus = vid() === '-';
      p += 1;
    }
    chleny.push({ minus: znakMinus, u: slagaemoe() });
    while (vid() === '+' || vid() === '-') {
      const m = vid() === '-';
      p += 1;
      chleny.push({ minus: m, u: slagaemoe() });
    }
    const first = chleny[0];
    if (chleny.length === 1 && first !== undefined && !first.minus) return first.u;
    return { t: 'sum', chleny, s: otrezok(start) };
  }

  function slagaemoe(): Uzel {
    const start = p;
    let u = mnozhitel();
    for (;;) {
      if (vid() === '\\cdot') {
        p += 1;
        u = { t: 'mul', a: u, b: mnozhitel(), s: '' };
      } else if (vid() === ':') {
        p += 1;
        u = { t: 'div', a: u, b: mnozhitel(), frac: false, s: '' };
      } else if (NACHALO.has(vid())) {
        u = { t: 'mul', a: u, b: mnozhitel(), s: '' };
      } else break;
      u.s = otrezok(start);
    }
    return u;
  }

  function mnozhitel(): Uzel {
    const start = p;
    const a = pervichnoe();
    if (vid() !== '^') return a;
    p += 1;
    const b = gruppa();
    return { t: 'pow', a, b, s: otrezok(start) };
  }

  function gruppa(): Uzel {
    if (vid() === '{') {
      p += 1;
      const u = vyrazhenie();
      zhdu('}');
      return u;
    }
    const t = tk[p];
    if (t?.k === 'x') {
      p += 1;
      return { t: 'x', s: 'x' };
    }
    if (t?.k === 'num' && t.v !== undefined) {
      p += 1;
      return { t: 'num', v: chisloIz(t.v), s: pokaz(t.v) };
    }
    throw new Error(`ждали группу в «${src}»`);
  }

  function pervichnoe(): Uzel {
    const start = p;
    const t = tk[p];
    if (t === undefined) throw new Error(`обрыв записи «${src}»`);
    switch (t.k) {
      case 'num':
        p += 1;
        return { t: 'num', v: chisloIz(t.v ?? '0'), s: pokaz(t.v ?? '0') };
      case 'x':
        p += 1;
        return { t: 'x', s: 'x' };
      case '\\pi':
        p += 1;
        return { t: 'pi', s: '\\pi' };
      case '(': {
        p += 1;
        const u = vyrazhenie();
        zhdu(')');
        return u;
      }
      case '{':
        return gruppa();
      case '\\frac': {
        p += 1;
        const a = gruppa();
        const b = gruppa();
        return { t: 'div', a, b, frac: true, s: otrezok(start) };
      }
      case '\\sqrt': {
        p += 1;
        const a = gruppa();
        return { t: 'sqrt', a, s: otrezok(start) };
      }
      case '\\log':
      case '\\lg':
      case '\\ln': {
        p += 1;
        let osn: Osnovanie = t.k === '\\lg' ? { vid: 'lg' } : { vid: 'e' };
        if (t.k === '\\log') {
          zhdu('_');
          osn = { vid: 'uzel', u: gruppa() };
        }
        const a = pervichnoe();
        return { t: 'log', osn, a, s: otrezok(start) };
      }
      default:
        throw new Error(`неожиданный знак «${t.k}» в «${src}»`);
    }
  }

  const L = vyrazhenie();
  zhdu('=');
  const R = vyrazhenie();
  if (p !== tk.length) throw new Error(`лишнее в конце «${src}»`);
  return { L, R, s: pokaz(src) };
}

/* ── Свойства дерева ─────────────────────────────────────────── */

export function estX(u: Uzel): boolean {
  switch (u.t) {
    case 'x':
      return true;
    case 'num':
    case 'pi':
      return false;
    case 'sum':
      return u.chleny.some((c) => estX(c.u));
    case 'mul':
    case 'div':
    case 'pow':
      return estX(u.a) || estX(u.b);
    case 'sqrt':
    case 'log':
      return estX(u.a);
  }
}

export function estUzel(u: Uzel, t: Uzel['t']): boolean {
  if (u.t === t) return true;
  switch (u.t) {
    case 'sum':
      return u.chleny.some((c) => estUzel(c.u, t));
    case 'mul':
    case 'div':
    case 'pow':
      return estUzel(u.a, t) || estUzel(u.b, t);
    case 'sqrt':
    case 'log':
      return estUzel(u.a, t);
    default:
      return false;
  }
}

/** Значение выражения без x — дробь (без π, корней и логарифмов). */
export function konstanta(u: Uzel): Q {
  switch (u.t) {
    case 'num':
      return u.v;
    case 'sum':
      return u.chleny.reduce((s, c) => {
        const v = konstanta(c.u);
        return c.minus ? minus(s, v) : plus(s, v);
      }, NOL);
    case 'mul':
      return umn(konstanta(u.a), konstanta(u.b));
    case 'div':
      return del(konstanta(u.a), konstanta(u.b));
    case 'pow': {
      const k = konstanta(u.b);
      if (!tseloe(k)) throw new Error('дробная степень константы');
      return step(konstanta(u.a), Number(k.n));
    }
    default:
      throw new Error(`не число: ${u.s}`);
  }
}

/* ── Многочлены от x ─────────────────────────────────────────── */

/** Многочлен: коэффициенты по степеням, [свободный, при x, при x²…]. */
export type Mn = Q[];

const obrezat = (a: Mn): Mn => {
  const r = [...a];
  while (r.length > 0 && ravny(r[r.length - 1] ?? NOL, NOL)) r.pop();
  return r;
};

export const mnPlus = (a: Mn, b: Mn): Mn =>
  obrezat(
    Array.from({ length: Math.max(a.length, b.length) }, (_, i) => plus(a[i] ?? NOL, b[i] ?? NOL)),
  );
export const mnProt = (a: Mn): Mn => a.map(prot);
export const mnMinus = (a: Mn, b: Mn): Mn => mnPlus(a, mnProt(b));
export function mnUmn(a: Mn, b: Mn): Mn {
  const r: Q[] = Array.from({ length: Math.max(0, a.length + b.length - 1) }, () => NOL);
  a.forEach((x, i) => b.forEach((y, j) => (r[i + j] = plus(r[i + j] ?? NOL, umn(x, y)))));
  return obrezat(r);
}
export const koef = (a: Mn, i: number): Q => a[i] ?? NOL;
export const stepen = (a: Mn): number => obrezat(a).length - 1;

/** Выражение как многочлен от x. Бросает, если это не многочлен. */
export function mnogochlen(u: Uzel): Mn {
  switch (u.t) {
    case 'num':
      return obrezat([u.v]);
    case 'x':
      return [NOL, ODIN];
    case 'sum':
      return u.chleny.reduce<Mn>((s, c) => {
        const v = mnogochlen(c.u);
        return c.minus ? mnMinus(s, v) : mnPlus(s, v);
      }, []);
    case 'mul':
      return mnUmn(mnogochlen(u.a), mnogochlen(u.b));
    case 'div': {
      const k = konstanta(u.b);
      return mnUmn(mnogochlen(u.a), [del(ODIN, k)]);
    }
    case 'pow': {
      const k = konstanta(u.b);
      if (!tseloe(k) || k.n < 0n) throw new Error('не многочлен');
      let r: Mn = [ODIN];
      for (let i = 0n; i < k.n; i += 1n) r = mnUmn(r, mnogochlen(u.a));
      return r;
    }
    default:
      throw new Error(`не многочлен: ${u.s}`);
  }
}
