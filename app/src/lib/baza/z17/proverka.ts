/**
 * База №17: независимая проверка ответа — без разбора по шагам.
 *
 * Корни ищутся перебором: левая минус правая часть считается в
 * плавающей точке на сетке значений x, на каждой смене знака корень
 * уточняется делением отрезка пополам и округляется до сотых. Затем
 * кандидат подставляется в исходное уравнение ТОЧНО: степени — дробь,
 * умноженная на простые числа в дробных степенях, логарифмы —
 * линейные комбинации ln p. Корнем считается только то, что прошло
 * точную подстановку. У квадратного уравнения число найденных корней
 * сверяется со знаком дискриминанта (по значениям в −1, 0, 1).
 */

import {
  del,
  minus,
  NOL,
  ODIN,
  plus,
  q,
  ravny,
  sravnit,
  step,
  tseloe,
  umn,
  zapisQ,
  znak,
  type Q,
} from './drobi';
import { estX, type Osnovanie, type Uravnenie, type Uzel } from './razbor';

/* ── Точные значения ─────────────────────────────────────────── */

/** Простое → показатель. Ключ «pi» — число π, «e» — число e (ln e = 1). */
type Karta = Map<string, Q>;

type Zn =
  | { t: 'q'; v: Q }
  /** c · Π p^{r_p}, 0 < r_p < 1 (у π — любой показатель). */
  | { t: 'm'; c: Q; r: Karta }
  /** Логарифм: (Σ ch_p ln p) / (Σ zn_p ln p). */
  | { t: 'l'; ch: Karta; zn: Karta };

class VneOdz extends Error {}

function razlozhit(n: bigint): Karta {
  const out: Karta = new Map();
  let x = n < 0n ? -n : n;
  if (x === 0n) throw new VneOdz('ноль');
  for (let p = 2n; p * p <= x && p < 2000n; p += 1n) {
    let k = 0;
    while (x % p === 0n) {
      x /= p;
      k += 1;
    }
    if (k > 0) out.set(p.toString(), q(k));
  }
  if (x > 1n) out.set(x.toString(), plus(out.get(x.toString()) ?? NOL, ODIN));
  return out;
}

function slozhitKarty(a: Karta, b: Karta, kb: Q = ODIN): Karta {
  const out: Karta = new Map(a);
  for (const [k, v] of b) {
    const s = plus(out.get(k) ?? NOL, umn(v, kb));
    if (s.n === 0n) out.delete(k);
    else out.set(k, s);
  }
  return out;
}

function ravnyKarty(a: Karta, b: Karta): boolean {
  if (a.size !== b.size) return false;
  for (const [k, v] of a) {
    const w = b.get(k);
    if (w === undefined || !ravny(v, w)) return false;
  }
  return true;
}

/** Одночлен c · Π p^{e_p} к виду с дробными показателями меньше 1. */
function odnochlen(c: Q, e: Karta): Zn {
  if (c.n === 0n) return { t: 'q', v: NOL };
  let k = c;
  const r: Karta = new Map();
  for (const [p, v] of e) {
    if (p === 'pi') {
      if (v.n !== 0n) r.set(p, v);
      continue;
    }
    let cel = v.n / v.d;
    if (v.n < 0n && v.n % v.d !== 0n) cel -= 1n;
    const ost = minus(v, q(cel));
    k = umn(k, step(q(BigInt(p)), Number(cel)));
    if (ost.n !== 0n) r.set(p, ost);
  }
  return r.size === 0 ? { t: 'q', v: k } : { t: 'm', c: k, r };
}

const kakM = (z: Zn): { c: Q; r: Karta } => {
  if (z.t === 'q') return { c: z.v, r: new Map() };
  if (z.t === 'm') return { c: z.c, r: z.r };
  throw new Error('логарифм в степени');
};

/** ln значения: Σ k_p ln p. Значение должно быть положительным. */
function lnKarta(z: Zn): Karta {
  const { c, r } = kakM(z);
  if (znak(c) <= 0) throw new VneOdz('логарифм неположительного');
  return slozhitKarty(slozhitKarty(razlozhit(c.n), razlozhit(c.d), q(-1)), r);
}

function logZn(ch: Karta, zn: Karta): Zn {
  /* Пропорциональны — логарифм рациональный. */
  const [k0, z0] = [...zn][0] ?? [];
  if (k0 === undefined || z0 === undefined) throw new VneOdz('основание 1');
  const t = del(ch.get(k0) ?? NOL, z0);
  const vse = new Set([...ch.keys(), ...zn.keys()]);
  if ([...vse].every((k) => ravny(ch.get(k) ?? NOL, umn(t, zn.get(k) ?? NOL)))) {
    return { t: 'q', v: t };
  }
  return { t: 'l', ch, zn };
}

function kakL(z: Zn, zn: Karta): Karta {
  if (z.t === 'l') {
    if (!ravnyKarty(z.zn, zn)) throw new Error('логарифмы с разными основаниями');
    return z.ch;
  }
  if (z.t === 'q') return slozhitKarty(new Map(), zn, z.v);
  throw new Error('логарифм и степень вместе');
}

function slozhit(a: Zn, b: Zn): Zn {
  if (a.t === 'q' && b.t === 'q') return { t: 'q', v: plus(a.v, b.v) };
  if (a.t === 'l' || b.t === 'l') {
    const zn = a.t === 'l' ? a.zn : b.t === 'l' ? b.zn : new Map<string, Q>();
    return logZn(slozhitKarty(kakL(a, zn), kakL(b, zn)), zn);
  }
  const x = kakM(a);
  const y = kakM(b);
  if (x.c.n === 0n) return b;
  if (y.c.n === 0n) return a;
  if (!ravnyKarty(x.r, y.r)) throw new Error('несравнимые слагаемые');
  return odnochlen(plus(x.c, y.c), x.r);
}

function umnozhit(a: Zn, b: Zn): Zn {
  if (a.t === 'l' || b.t === 'l') {
    const [l, k] = a.t === 'l' ? [a, b] : [b as Extract<Zn, { t: 'l' }>, a];
    if (k.t !== 'q') throw new Error('произведение с логарифмом');
    return logZn(slozhitKarty(new Map(), l.ch, k.v), l.zn);
  }
  const x = kakM(a);
  const y = kakM(b);
  return odnochlen(umn(x.c, y.c), slozhitKarty(x.r, y.r));
}

function obratnoe(a: Zn): Zn {
  const { c, r } = kakM(a);
  if (c.n === 0n) throw new VneOdz('деление на ноль');
  return odnochlen(del(ODIN, c), slozhitKarty(new Map(), r, q(-1)));
}

function vStepeni(a: Zn, e: Zn): Zn {
  if (e.t !== 'q') throw new Error('показатель не рациональный');
  const { c, r } = kakM(a);
  if (tseloe(e.v)) {
    if (c.n === 0n && znak(e.v) <= 0) throw new VneOdz('0 в степени');
    return odnochlen(step(c, Number(e.v.n)), slozhitKarty(new Map(), r, e.v));
  }
  if (znak(c) < 0) throw new VneOdz('корень из отрицательного');
  if (c.n === 0n) return { t: 'q', v: NOL };
  return odnochlen(ODIN, slozhitKarty(new Map(), lnKarta({ t: 'm', c, r }), e.v));
}

function lnOsnovaniya(o: Osnovanie, x: Q): Karta {
  if (o.vid === 'lg')
    return new Map([
      ['2', ODIN],
      ['5', ODIN],
    ]);
  if (o.vid === 'e') return new Map([['e', ODIN]]);
  const b = tochno(o.u, x);
  const k = lnKarta(b);
  if (k.size === 0) throw new VneOdz('основание 1');
  return k;
}

function tochno(u: Uzel, x: Q): Zn {
  switch (u.t) {
    case 'num':
      return { t: 'q', v: u.v };
    case 'x':
      return { t: 'q', v: x };
    case 'pi':
      return { t: 'm', c: ODIN, r: new Map([['pi', ODIN]]) };
    case 'sum':
      return u.chleny.reduce<Zn>(
        (s, c) => {
          const v = tochno(c.u, x);
          return slozhit(s, c.minus ? umnozhit({ t: 'q', v: q(-1) }, v) : v);
        },
        { t: 'q', v: NOL },
      );
    case 'mul':
      return umnozhit(tochno(u.a, x), tochno(u.b, x));
    case 'div':
      return umnozhit(tochno(u.a, x), obratnoe(tochno(u.b, x)));
    case 'pow':
      return vStepeni(tochno(u.a, x), tochno(u.b, x));
    case 'sqrt':
      return vStepeni(tochno(u.a, x), { t: 'q', v: q(1, 2) });
    case 'log': {
      const zn = lnOsnovaniya(u.osn, x);
      return logZn(lnKarta(tochno(u.a, x)), zn);
    }
  }
}

/** Верно ли равенство при x — точной подстановкой. */
export function koren(ur: Uravnenie, x: Q): boolean {
  try {
    const raznost = slozhit(tochno(ur.L, x), umnozhit({ t: 'q', v: q(-1) }, tochno(ur.R, x)));
    return raznost.t === 'q' && raznost.v.n === 0n;
  } catch {
    return false;
  }
}

/* ── Плавающая точка: поиск кандидатов ───────────────────────── */

function priblizhenno(u: Uzel, x: number): number {
  switch (u.t) {
    case 'num':
      return Number(u.v.n) / Number(u.v.d);
    case 'x':
      return x;
    case 'pi':
      return Math.PI;
    case 'sum':
      return u.chleny.reduce((s, c) => s + (c.minus ? -1 : 1) * priblizhenno(c.u, x), 0);
    case 'mul':
      return priblizhenno(u.a, x) * priblizhenno(u.b, x);
    case 'div':
      return priblizhenno(u.a, x) / priblizhenno(u.b, x);
    case 'pow':
      return priblizhenno(u.a, x) ** priblizhenno(u.b, x);
    case 'sqrt':
      return Math.sqrt(priblizhenno(u.a, x));
    case 'log': {
      const a = priblizhenno(u.a, x);
      const b = u.osn.vid === 'lg' ? 10 : u.osn.vid === 'e' ? Math.E : priblizhenno(u.osn.u, x);
      return a > 0 && b > 0 && b !== 1 ? Math.log(a) / Math.log(b) : NaN;
    }
  }
}

const SETKA: number[] = (() => {
  const s = new Set<number>();
  for (let i = -1024; i <= 1024; i += 1) s.add(i / 8);
  for (let v = 128; v < 1e5; v *= 1.01) {
    s.add(v);
    s.add(-v);
  }
  return [...s].sort((a, b) => a - b);
})();

function stepenSX(u: Uzel): boolean {
  switch (u.t) {
    case 'pow':
      return estX(u.b) || stepenSX(u.a);
    case 'sum':
      return u.chleny.some((c) => stepenSX(c.u));
    case 'mul':
    case 'div':
      return stepenSX(u.a) || stepenSX(u.b);
    case 'sqrt':
    case 'log':
      return stepenSX(u.a);
    default:
      return false;
  }
}

/** Все корни уравнения, прошедшие точную подстановку, по возрастанию. */
export function korni(ur: Uravnenie): Q[] {
  /* Обе части показательного уравнения ушли в машинный ноль — это не корень. */
  const pokazatelnoe = stepenSX(ur.L) || stepenSX(ur.R);
  const f = (x: number): number => {
    const a = priblizhenno(ur.L, x);
    const b = priblizhenno(ur.R, x);
    return pokazatelnoe && a === 0 && b === 0 ? NaN : a - b;
  };
  const kandidaty: number[] = [];
  const delenie = (a0: number, b0: number): void => {
    let [a, b, fa] = [a0, b0, f(a0)];
    for (let i = 0; i < 100; i += 1) {
      const m = (a + b) / 2;
      const fm = f(m);
      if (!Number.isFinite(fm)) break;
      if (Math.sign(fm) === Math.sign(fa)) [a, fa] = [m, fm];
      else b = m;
    }
    kandidaty.push((a + b) / 2);
  };
  /* Край области определения между a (f есть) и b (f нет): корень может
     лежать у самого края — сравниваем знак f в точке у края. */
  const kray = (a0: number, b0: number): void => {
    let [a, b] = [a0, b0];
    for (let i = 0; i < 100; i += 1) {
      const m = (a + b) / 2;
      if (Number.isFinite(f(m))) a = m;
      else b = m;
    }
    const fa0 = f(a0);
    const fk = f(a);
    if (fk === 0) kandidaty.push(a);
    else if (Number.isFinite(fk) && Math.sign(fk) !== Math.sign(fa0)) delenie(a0, a);
  };
  let px = NaN;
  let pf = NaN;
  for (const x of SETKA) {
    const fx = f(x);
    const est = Number.isFinite(fx);
    const bylo = Number.isFinite(pf);
    if (fx === 0) kandidaty.push(x);
    else if (est && bylo && pf !== 0 && Math.sign(fx) !== Math.sign(pf)) delenie(px, x);
    else if (est && !bylo && !Number.isNaN(px)) kray(x, px);
    else if (!est && bylo && pf !== 0) kray(px, x);
    [px, pf] = [x, fx];
  }
  const out: Q[] = [];
  for (const c of kandidaty) {
    const r = q(Math.round(c * 1000), 1000);
    if (Math.abs(c - Number(r.n) / Number(r.d)) > 1e-6 * Math.max(1, Math.abs(c))) continue;
    if (koren(ur, r) && !out.some((o) => ravny(o, r))) out.push(r);
  }
  return out.sort(sravnit);
}

/** Чем отвечать: единственный корень, меньший или больший. */
export type Vopros = 'koren' | 'menshiy' | 'bolshiy';

/**
 * Ответ задачи перебором. «?» — проверка не сошлась: корней не столько,
 * сколько должно быть.
 */
export function otvetPerebor(ur: Uravnenie, vopros: Vopros): string {
  const k = korni(ur);
  if (vopros === 'koren') return k.length === 1 && k[0] !== undefined ? zapisQ(k[0]) : '?';
  /* Квадратное: f(x) = ax² + bx + c по значениям в −1, 0, 1. */
  const zn = (x: number): Q => {
    const L = tochno(ur.L, q(x));
    const R = tochno(ur.R, q(x));
    if (L.t !== 'q' || R.t !== 'q') throw new Error('не многочлен');
    return minus(L.v, R.v);
  };
  const [fm, f0, f1] = [zn(-1), zn(0), zn(1)];
  const a = minus(del(plus(f1, fm), q(2)), f0);
  const b = del(minus(f1, fm), q(2));
  const D = minus(umn(b, b), umn(q(4), umn(a, f0)));
  const nado = znak(D) > 0 ? 2 : znak(D) === 0 ? 1 : 0;
  if (a.n === 0n || k.length !== nado || nado === 0) return '?';
  const v = vopros === 'menshiy' ? k[0] : k[k.length - 1];
  return v === undefined ? '?' : zapisQ(v);
}
