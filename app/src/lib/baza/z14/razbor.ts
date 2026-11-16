/**
 * База, задание №14: разбор выражения с дробями по действиям.
 *
 * Запись выражения (TeX, как в условии) разбирается в дерево: числа,
 * обыкновенные дроби, смешанные числа, скобки, четыре действия и
 * дробная черта. Дерево считается в точных дробях по порядку действий:
 * сначала скобки, числитель и знаменатель, затем умножение и деление
 * слева направо, затем сложение и вычитание. Каждое действие — отдельный
 * шаг разбора с промежуточным результатом.
 *
 * Вид чисел в действии выбирается, как в школе: две десятичные дроби —
 * действие с десятичными (запятая, перенос запятой при делении);
 * обыкновенная дробь рядом с десятичной переводится в десятичную, если
 * это короткая конечная дробь, иначе десятичная переводится в
 * обыкновенную. Обыкновенные дроби — через общий знаменатель, умножение
 * числителей и знаменателей, сокращение.
 */

import { nod, tex, zapis } from '../chisla';
import type { Etap, HintStep } from '../types';

/* ── Точные дроби ────────────────────────────────────────────── */

export interface Q {
  p: number;
  q: number;
}

function cel(n: number): number {
  if (!Number.isSafeInteger(n)) throw new Error(`слишком большое число ${n}`);
  return n;
}

export function drob(p: number, q = 1): Q {
  if (q === 0) throw new Error('деление на ноль');
  const g = nod(p, q) || 1;
  const s = q < 0 ? -1 : 1;
  return { p: cel((s * p) / g) || 0, q: cel((s * q) / g) };
}

const plus = (a: Q, b: Q): Q => drob(a.p * b.q + b.p * a.q, a.q * b.q);
const minus = (a: Q, b: Q): Q => drob(a.p * b.q - b.p * a.q, a.q * b.q);
const umn = (a: Q, b: Q): Q => drob(a.p * b.p, a.q * b.q);
const del = (a: Q, b: Q): Q => drob(a.p * b.q, a.q * b.p);
const protiv = (a: Q): Q => drob(-a.p, a.q);
const nok = (a: number, b: number): number => (a / nod(a, b)) * b;

/** Знаков после запятой у конечной дроби; null — бесконечная. */
function znakov(x: Q): number | null {
  let d = x.q;
  let k2 = 0;
  let k5 = 0;
  while (d % 2 === 0) [d, k2] = [d / 2, k2 + 1];
  while (d % 5 === 0) [d, k5] = [d / 5, k5 + 1];
  return d === 1 ? Math.max(k2, k5) : null;
}

/* ── Дерево выражения ────────────────────────────────────────── */

type Op = '+' | '-' | '*' | ':';

export type Uzel =
  | { t: 'num'; x: Q; s: string; des: boolean }
  | { t: 'drob'; a: Uzel; b: Uzel }
  | { t: 'smesh'; c: number; a: number; b: number }
  | { t: 'neg'; x: Uzel }
  | { t: 'skob'; x: Uzel }
  | { t: 'bin'; op: Op; l: Uzel; r: Uzel };

type Token = string;

function tokeny(s: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i] ?? '';
    if (ch === ' ') {
      i += 1;
    } else if (/\d/.test(ch)) {
      const m = /^\d+(,\d+)?/.exec(s.slice(i));
      if (m === null) throw new Error('число');
      out.push(m[0]);
      i += m[0].length;
    } else if (ch === '\\') {
      const m = /^\\[a-zA-Z]+/.exec(s.slice(i));
      if (m === null) throw new Error(`команда в «${s}»`);
      i += m[0].length;
      if (m[0] === '\\frac') out.push('frac');
      else if (m[0] === '\\cdot') out.push('*');
      else if (m[0] !== '\\left' && m[0] !== '\\right') throw new Error(`команда ${m[0]}`);
    } else if ('{}()+-:'.includes(ch)) {
      out.push(ch);
      i += 1;
    } else {
      throw new Error(`знак «${ch}» в «${s}»`);
    }
  }
  return out;
}

/** Разбор записи в дерево (рекурсивный спуск). */
export function razobrat(zapisVyrazheniya: string): Uzel {
  const t = tokeny(zapisVyrazheniya);
  let i = 0;
  const zhdu = (x: Token): void => {
    if (t[i] !== x) throw new Error(`ждали «${x}» в «${zapisVyrazheniya}»`);
    i += 1;
  };
  const isNum = (x: Token | undefined): x is string => x !== undefined && /^\d/.test(x);

  function chislo(s: string): Uzel {
    const [c = '0', d = ''] = s.split(',');
    return {
      t: 'num',
      x: drob(Number(c + d), 10 ** d.length),
      s,
      des: d !== '',
    };
  }

  function drobnaya(): Uzel {
    zhdu('frac');
    zhdu('{');
    const a = summa();
    zhdu('}');
    zhdu('{');
    const b = summa();
    zhdu('}');
    return { t: 'drob', a, b };
  }

  function mnozhitel(): Uzel {
    const x = t[i];
    if (x === '-') {
      i += 1;
      return { t: 'neg', x: mnozhitel() };
    }
    if (x === '(') {
      i += 1;
      const v = summa();
      zhdu(')');
      return { t: 'skob', x: v };
    }
    if (x === 'frac') return drobnaya();
    if (isNum(x)) {
      i += 1;
      if (t[i] === 'frac' && !x.includes(',')) {
        const d = drobnaya();
        if (d.t !== 'drob' || d.a.t !== 'num' || d.b.t !== 'num' || d.a.des || d.b.des) {
          throw new Error('смешанное число');
        }
        return { t: 'smesh', c: Number(x), a: d.a.x.p, b: d.b.x.p };
      }
      return chislo(x);
    }
    throw new Error(`лишний знак «${x}» в «${zapisVyrazheniya}»`);
  }

  function proizvedenie(): Uzel {
    let l = mnozhitel();
    while (t[i] === '*' || t[i] === ':') {
      const op = t[i] as Op;
      i += 1;
      l = { t: 'bin', op, l, r: mnozhitel() };
    }
    return l;
  }

  function summa(): Uzel {
    let l = proizvedenie();
    while (t[i] === '+' || t[i] === '-') {
      const op = t[i] as Op;
      i += 1;
      l = { t: 'bin', op, l, r: proizvedenie() };
    }
    return l;
  }

  const u = summa();
  if (i !== t.length) throw new Error(`хвост в «${zapisVyrazheniya}»`);
  return u;
}

/* ── Запись в TeX ────────────────────────────────────────────── */

const OP_TEX: Record<Op, string> = { '+': '+', '-': '-', '*': '\\cdot ', ':': ':' };

const dfrac = (a: string | number, b: string | number): string => `\\dfrac{${a}}{${b}}`;

/** Обыкновенная дробь из двух целых чисел (числитель и знаменатель как написаны). */
function literalDrob(u: Uzel): boolean {
  return u.t === 'drob' && u.a.t === 'num' && u.b.t === 'num' && !u.a.des && !u.b.des;
}

function atom(u: Uzel): boolean {
  if (u.t === 'num' || u.t === 'smesh' || literalDrob(u)) return true;
  if (u.t === 'neg' || u.t === 'skob') return atom(u.x);
  return false;
}

/** Выражение как в условии. */
export function pokaz(u: Uzel): string {
  switch (u.t) {
    case 'num':
      return tex(u.s);
    case 'smesh':
      return `${u.c}${dfrac(u.a, u.b)}`;
    case 'drob':
      return dfrac(pokaz(u.a), pokaz(u.b));
    case 'neg':
      return `-${pokaz(u.x)}`;
    case 'skob':
      return `\\left(${pokaz(u.x)}\\right)`;
    case 'bin':
      return `${pokaz(u.l)}${OP_TEX[u.op]}${pokaz(u.r)}`;
  }
}

/* ── Значения и их запись ────────────────────────────────────── */

type Vid = 'cel' | 'des' | 'drob' | 'smesh';

interface Znach {
  x: Q;
  vid: Vid;
  /** Смешанное число как в записи: целая часть, дробная часть. */
  sm?: { c: number; a: number; b: number };
  /** Обыкновенная дробь как в записи (может быть сократимой). */
  raw?: { a: number; b: number };
}

function desTex(x: Q): string {
  return tex(zapis(x.p, x.q));
}

function drobTex(x: Q): string {
  if (x.q === 1) return String(x.p);
  return `${x.p < 0 ? '-' : ''}${dfrac(Math.abs(x.p), x.q)}`;
}

/** Значение в своей записи. */
function zTex(z: Znach): string {
  const minus = z.x.p < 0 ? '-' : '';
  if (z.vid === 'smesh' && z.sm !== undefined) {
    return `${minus}${z.sm.c}${dfrac(z.sm.a, z.sm.b)}`;
  }
  if (z.vid === 'drob' && z.raw !== undefined) return `${minus}${dfrac(z.raw.a, z.raw.b)}`;
  if (z.vid === 'des') return desTex(z.x);
  return drobTex(z.x);
}

/** Отрицательное число внутри выражения — в скобках. */
function vSkobkah(s: string): string {
  if (!s.startsWith('-')) return s;
  return s.includes('\\dfrac') ? `\\left(${s}\\right)` : `(${s})`;
}

/** Число результата в виде, близком к vid (для вариантов подсказок). */
function zapisKak(x: Q, vid: Vid): string {
  if (x.q === 1) return String(x.p);
  const k = znakov(x);
  if (vid === 'des' && k !== null && k <= 4) return desTex(x);
  return drobTex(x);
}

/* ── Действия ────────────────────────────────────────────────── */

interface Deystvie {
  uzel: Uzel;
  /** «сложение», «деление» … */
  imya: string;
  /** «в скобках», «в числителе», '' */
  gde: string;
  /** Действие с числами на момент вычисления. */
  vyrazh: string;
  lines: string[];
  rez: Znach;
  oshibki: Q[];
}

const IMYA: Record<Op | 'bar', string> = {
  '+': 'сложение',
  '-': 'вычитание',
  '*': 'умножение',
  ':': 'деление',
  bar: 'деление (дробная черта)',
};

/** Перевести в обыкновенную дробь: строка перевода или null, если не нужно. */
function vDrob(z: Znach): { z: Znach; line: string | null } {
  if (z.vid === 'smesh' && z.sm !== undefined) {
    const { c, a, b } = z.sm;
    const minus = z.x.p < 0 ? '-' : '';
    const nz: Znach = { x: z.x, vid: 'drob' };
    return {
      z: nz,
      line: `$${minus}${c}${dfrac(a, b)} = ${minus}${dfrac(`${c}\\cdot ${b}+${a}`, b)} = ${drobTex(z.x)}$`,
    };
  }
  if (z.vid === 'drob' && z.raw !== undefined) {
    const { a, b } = z.raw;
    if (nod(a, b) === 1) return { z: { x: z.x, vid: 'drob' }, line: null };
    return {
      z: { x: z.x, vid: z.x.q === 1 ? 'cel' : 'drob' },
      line: `Сократим дробь: $${zTex(z)} = ${drobTex(z.x)}$`,
    };
  }
  if (z.vid === 'des') {
    const k = znakov(z.x) ?? 0;
    const m = 10 ** k;
    const p = z.x.p * (m / z.x.q);
    const syraya = `${p < 0 ? '-' : ''}${dfrac(Math.abs(p), m)}`;
    const sokr = nod(p, m) === 1 ? '' : ` = ${drobTex(z.x)}`;
    return {
      z: { x: z.x, vid: z.x.q === 1 ? 'cel' : 'drob' },
      line: `$${desTex(z.x)} = ${syraya}${sokr}$`,
    };
  }
  return { z, line: null };
}

/** Перевести в десятичную дробь, если она короткая (до двух знаков). */
function vDes(z: Znach): { z: Znach; line: string | null } | null {
  if (z.vid === 'des' || z.vid === 'cel') return { z, line: null };
  const k = znakov(z.x);
  if (k === null || k > 2) return null;
  const nz: Znach = { x: z.x, vid: z.x.q === 1 ? 'cel' : 'des' };
  return { z: nz, line: `$${zTex(z)} = ${desTex(z.x)}$` };
}

/** Сумма двух чисел со знаками: строки цепочки после «A ± B». */
function summaZnakov(a: Q, y: Q, pis: (x: Q) => string): string {
  const s = plus(a, y);
  const A = pis(a);
  const absA = pis(drob(Math.abs(a.p), a.q));
  const absY = pis(drob(Math.abs(y.p), y.q));
  const rez = pis(s);
  if (a.p >= 0 && y.p >= 0) return `${A}+${absY} = ${rez}`;
  if (a.p >= 0 && y.p < 0) {
    if (s.p >= 0) return `${A}-${absY} = ${rez}`;
    return `${A}-${absY} = -(${absY}-${A}) = ${rez}`;
  }
  if (a.p < 0 && y.p >= 0) {
    if (s.p >= 0) return `${A}+${absY} = ${absY}-${absA} = ${rez}`;
    return `${A}+${absY} = -(${absA}-${absY}) = ${rez}`;
  }
  return `${A}-${absY} = -(${absA}+${absY}) = ${rez}`;
}

/** Действие с десятичными (и целыми) числами. */
function desDeystvie(op: Op | 'bar', L: Q, R: Q, lines: string[]): Q | null {
  const A = desTex(L);
  const B = vSkobkah(desTex(R));
  if (op === '+' || op === '-') {
    const y = op === '+' ? R : protiv(R);
    const nachalo = `${A}${op}${B}`;
    const vid = `${A}${y.p < 0 ? '-' : '+'}${desTex(drob(Math.abs(y.p), y.q))}`;
    const cep = summaZnakov(L, y, desTex);
    lines.push(`$${nachalo === vid ? '' : `${nachalo} = `}${cep}$`);
    return plus(L, y);
  }
  if (op === '*') {
    const r = umn(L, R);
    lines.push(`$${A}\\cdot ${B} = ${desTex(r)}$`);
    const kL = znakov(L) ?? 0;
    const kR = znakov(R) ?? 0;
    if (kL > 0 && kR > 0) {
      const m = Math.abs(L.p * (10 ** kL / L.q));
      const n = Math.abs(R.p * (10 ** kR / R.q));
      lines.push(
        `Умножаем, не глядя на запятые: $${m}\\cdot ${n} = ${m * n}$. В множителях после запятой $${kL}+${kR} = ${kL + kR}$ знака — столько же отделяем запятой в произведении.`,
      );
    }
    return r;
  }
  /* деление и дробная черта */
  const r = del(L, R);
  if (znakov(r) === null) return null;
  const kR = znakov(R) ?? 0;
  const nachalo = op === 'bar' ? `${dfrac(A, desTex(R))} = ${A}:${B}` : `${A}:${B}`;
  if (kR === 0) {
    lines.push(`$${nachalo} = ${desTex(r)}$`);
  } else {
    const m = 10 ** kR;
    const A2 = desTex(umn(L, drob(m)));
    const B2 = vSkobkah(desTex(umn(R, drob(m))));
    lines.push(`$${nachalo} = ${A2}:${B2} = ${desTex(r)}$`);
    lines.push(
      `Чтобы делитель стал целым, переносим запятую вправо на ${kR} ${kR === 1 ? 'знак' : 'знака'} и в делимом, и в делителе — частное не меняется.`,
    );
  }
  return r;
}

/** Действие с обыкновенными дробями (целые — как дроби со знаменателем 1). */
function drobDeystvie(op: Op | 'bar', L: Q, R: Q, lines: string[]): Q {
  const A = drobTex(L);
  const B = vSkobkah(drobTex(R));
  if (op === '+' || op === '-') {
    const y = op === '+' ? R : protiv(R);
    const s = plus(L, y);
    const znak = y.p < 0 ? '-' : '+';
    const absY = drob(Math.abs(y.p), y.q);
    const cep: string[] = [`${A}${op}${B}`];
    const vid = `${A}${znak}${drobTex(absY)}`;
    if (vid !== cep[0]) cep.push(vid);
    if (L.q === 1 && y.q === 1) {
      cep.push(drobTex(s));
    } else {
      const N = nok(L.q, y.q);
      const a = L.p * (N / L.q);
      const b = Math.abs(y.p) * (N / y.q);
      if (L.q !== N || y.q !== N) {
        cep.push(`${a < 0 ? '-' : ''}${dfrac(Math.abs(a), N)}${znak}${dfrac(b, N)}`);
      }
      const ch = a + (y.p < 0 ? -b : b);
      cep.push(dfrac(`${a}${znak}${b}`, N));
      cep.push(`${ch < 0 ? '-' : ''}${dfrac(Math.abs(ch), N)}`);
      if (s.q !== N) cep.push(drobTex(s));
    }
    lines.push(`$${cep.join(' = ')}$`);
    if (L.q !== y.q && !(L.q === 1 && y.q === 1)) {
      lines.push(`Общий знаменатель — $${nok(L.q, y.q)}$.`);
    }
    return s;
  }
  const L2 = L;
  let R2 = R;
  const cep: string[] = [];
  if (op === ':' || op === 'bar') {
    if (op === 'bar') cep.push(dfrac(A, drobTex(R)));
    cep.push(`${A}:${B}`);
    R2 = drob(R.q, R.p);
    cep.push(`${A}\\cdot ${vSkobkah(drobTex(R2))}`);
  } else {
    cep.push(`${A}\\cdot ${B}`);
  }
  const r = umn(L2, R2);
  const minus = r.p < 0 ? '-' : '';
  const ch = [Math.abs(L2.p), Math.abs(R2.p)];
  const zn = [L2.q, R2.q];
  const proizv = (xs: number[]): string => {
    const ne1 = xs.filter((x) => x !== 1);
    return ne1.length === 0 ? '1' : ne1.join('\\cdot ');
  };
  const zapisDrobi = (c: number[], z: number[]): string => {
    const zz = proizv(z);
    return zz === '1' ? `${minus}${proizv(c)}` : `${minus}${dfrac(proizv(c), zz)}`;
  };
  let zametka: string | null = null;
  if (zn.every((x) => x === 1)) {
    cep.push(`${minus}${proizv(ch)}`);
  } else {
    cep.push(zapisDrobi(ch, zn));
    /* Сокращаем до умножения: числитель одной дроби со знаменателем другой (и своей). */
    const sokr: string[] = [];
    for (const [i, j] of [
      [0, 1],
      [1, 0],
      [0, 0],
      [1, 1],
    ] as const) {
      const g = nod(ch[i] ?? 1, zn[j] ?? 1);
      if (g > 1) {
        sokr.push(`$${ch[i]}$ и $${zn[j]}$ — на $${g}$`);
        ch[i] = (ch[i] ?? 1) / g;
        zn[j] = (zn[j] ?? 1) / g;
      }
    }
    if (sokr.length > 0) {
      cep.push(zapisDrobi(ch, zn));
      zametka = `Сокращаем до умножения: ${sokr.join(', ')}.`;
    }
  }
  cep.push(drobTex(r));
  const uniq = cep.filter((c, k) => k === 0 || c !== cep[k - 1]);
  lines.push(`$${uniq.join(' = ')}$`);
  if (zametka !== null) lines.push(zametka);
  if (op !== '*') lines.push('Деление на дробь — умножение на перевёрнутую дробь.');
  return r;
}

function oshibkiDeystviya(op: Op | 'bar', L: Q, R: Q, r: Q, desRezhim: boolean): Q[] {
  const out: Q[] = [];
  const probuy = (f: () => Q): void => {
    try {
      out.push(f());
    } catch {
      /* деление на ноль — такой ошибки нет */
    }
  };
  if (op === '+') {
    if (L.q !== 1 && R.q !== 1 && !desRezhim) probuy(() => drob(L.p + R.p, L.q + R.q));
    probuy(() => minus(L, R));
    if (desRezhim) probuy(() => umn(r, drob(10)));
  } else if (op === '-') {
    probuy(() => minus(R, L));
    probuy(() => plus(L, R));
  } else if (op === '*') {
    if (desRezhim) probuy(() => umn(r, drob(10)));
    probuy(() => del(L, R));
    if (desRezhim) probuy(() => del(r, drob(10)));
  } else {
    probuy(() => umn(L, R));
    probuy(() => del(R, L));
    if (desRezhim) probuy(() => umn(r, drob(10)));
  }
  return out;
}

/* ── Вычисление дерева ───────────────────────────────────────── */

function vychislit(koren: Uzel): { deystviya: Deystvie[]; itog: Znach } {
  const deystviya: Deystvie[] = [];

  function deystvie(uzel: Uzel, op: Op | 'bar', Lz: Znach, Rz: Znach, gde: string): Znach {
    const lines: string[] = [];
    const vyrazh =
      op === 'bar' ? dfrac(zTex(Lz), zTex(Rz)) : `${zTex(Lz)}${OP_TEX[op]}${vSkobkah(zTex(Rz))}`;
    let L = Lz;
    let R = Rz;
    let desRezhim = false;
    if (L.vid === 'des' || R.vid === 'des') {
      const l2 = vDes(L);
      const r2 = vDes(R);
      if (l2 !== null && r2 !== null) {
        desRezhim = true;
        const perevod = [l2.line, r2.line].filter((s): s is string => s !== null);
        if (perevod.length > 0) {
          lines.push(`Переведём в десятичную дробь: ${perevod.join(', ')}.`);
        }
        L = l2.z;
        R = r2.z;
      }
    } else if (L.vid === 'cel' && R.vid === 'cel') {
      desRezhim = true;
    }
    let r: Q | null = null;
    if (desRezhim) {
      const probnye: string[] = [];
      r = desDeystvie(op, L.x, R.x, probnye);
      if (r !== null) lines.push(...probnye);
      else lines.length = 0;
    }
    if (r === null) {
      desRezhim = false;
      const l2 = vDrob(Lz);
      const r2 = vDrob(Rz);
      const perevod = [l2.line, r2.line].filter((s): s is string => s !== null);
      const est = [Lz, Rz].some((z) => z.vid === 'des');
      const smesh = [Lz, Rz].some((z) => z.vid === 'smesh');
      if (perevod.length > 0) {
        const chto =
          est && smesh
            ? 'Запишем числа обыкновенными дробями'
            : est
              ? 'Переведём десятичную дробь в обыкновенную'
              : smesh
                ? 'Запишем смешанное число неправильной дробью'
                : 'Сначала';
        lines.push(`${chto}: ${perevod.join(', ')}.`);
      }
      r = drobDeystvie(op, l2.z.x, r2.z.x, lines);
      L = l2.z;
      R = r2.z;
      /* Рядом были десятичные — короткий результат тоже пишем десятичной дробью. */
      const k = znakov(r);
      if (est && r.q !== 1 && k !== null && k <= 3) {
        lines.push(`Запишем результат десятичной дробью: $${drobTex(r)} = ${desTex(r)}$.`);
        desRezhim = true;
      }
    }
    const vid: Vid = r.q === 1 ? 'cel' : desRezhim ? 'des' : 'drob';
    const rez: Znach = { x: r, vid };
    deystviya.push({
      uzel,
      imya: IMYA[op],
      gde,
      vyrazh,
      lines,
      rez,
      oshibki: oshibkiDeystviya(op, L.x, R.x, r, desRezhim),
    });
    return rez;
  }

  function idi(u: Uzel, gde: string): Znach {
    switch (u.t) {
      case 'num':
        return { x: u.x, vid: u.des ? 'des' : 'cel' };
      case 'smesh':
        return { x: drob(u.c * u.b + u.a, u.b), vid: 'smesh', sm: { c: u.c, a: u.a, b: u.b } };
      case 'neg': {
        const z = idi(u.x, gde);
        return { ...z, x: protiv(z.x) };
      }
      case 'skob':
        return idi(u.x, atom(u.x) ? gde : 'в скобках');
      case 'drob': {
        if (literalDrob(u) && u.a.t === 'num' && u.b.t === 'num') {
          return { x: drob(u.a.x.p, u.b.x.p), vid: 'drob', raw: { a: u.a.x.p, b: u.b.x.p } };
        }
        const a = idi(u.a, 'в числителе');
        const b = idi(u.b, 'в знаменателе');
        return deystvie(u, 'bar', a, b, '');
      }
      case 'bin': {
        const l = idi(u.l, gde);
        const r = idi(u.r, gde);
        return deystvie(u, u.op, l, r, gde);
      }
    }
  }

  const itog = idi(koren, '');
  return { deystviya, itog };
}

/* ── Подсказка «какое действие первым» ───────────────────────── */

function kraynyAtom(u: Uzel, storona: 'l' | 'r'): Uzel | null {
  if (atom(u)) return u;
  if (u.t === 'bin') return kraynyAtom(storona === 'l' ? u.l : u.r, storona);
  if (u.t === 'skob') return kraynyAtom(u.x, storona);
  if (u.t === 'neg' && storona === 'r') return kraynyAtom(u.x, storona);
  return null;
}

/** «Наивные» пары: соседние числа вокруг каждого знака действия. */
function naivnyePary(koren: Uzel): string[] {
  const out: string[] = [];
  const obhod = (u: Uzel): void => {
    if (u.t === 'bin') {
      obhod(u.l);
      obhod(u.r);
      const a = kraynyAtom(u.l, 'r');
      const b = kraynyAtom(u.r, 'l');
      /* a + b ± c и a · b : c — сосед справа можно считать и раньше: не ошибка. */
      const levyy = u.l.t === 'bin' ? u.l.op : null;
      const bezvredno =
        (levyy === '+' && (u.op === '+' || u.op === '-')) ||
        (levyy === '*' && (u.op === '*' || u.op === ':'));
      if (a !== null && b !== null && !bezvredno) {
        out.push(`${pokaz(a)}${OP_TEX[u.op]}${pokaz(b)}`);
      }
    } else if (u.t === 'drob' && !literalDrob(u)) {
      obhod(u.a);
      obhod(u.b);
      const a = kraynyAtom(u.a, 'r');
      const b = kraynyAtom(u.b, 'l');
      if (a !== null && b !== null) out.push(`${pokaz(a)}:${pokaz(b)}`);
    } else if (u.t === 'neg' || u.t === 'skob') {
      obhod(u.x);
    }
  };
  obhod(koren);
  return out;
}

/* ── Разбор целиком ──────────────────────────────────────────── */

export interface Razbor {
  otvet: string;
  etapy: Etap[];
  hints: HintStep[];
}

/**
 * Подсказка-вопрос: верный вариант и отвлекающие (как в z05). Повторы
 * убираются, место верного зависит от sdvig.
 */
function vopros(
  question: string,
  verno: string,
  drugie: string[],
  sdvig: number,
  comment?: string,
): HintStep {
  const prochie = [...new Set(drugie)].filter((d) => d !== verno).slice(0, 2);
  const mesto = prochie.length === 0 ? 0 : sdvig % (prochie.length + 1);
  const options = [...prochie.slice(0, mesto), verno, ...prochie.slice(mesto)];
  return { question, options, correct: mesto, ...(comment === undefined ? {} : { comment }) };
}

const SOVET: Record<string, string> = {
  сложение: 'Дроби складывают, приведя к общему знаменателю; у десятичных запятая под запятой.',
  вычитание: 'Следите за знаком: из большего вычитаем меньшее и ставим знак большего по модулю.',
  умножение:
    'Числитель умножаем на числитель, знаменатель на знаменатель; у десятичных считаем знаки после запятой.',
  деление: 'Делить на дробь — значит умножать на перевёрнутую дробь.',
  'деление (дробная черта)': 'Дробная черта — это деление числителя на знаменатель.',
};

export function razborVyrazheniya(zapisVyrazheniya: string, sdvig: number): Razbor {
  const koren = razobrat(zapisVyrazheniya);
  const { deystviya, itog } = vychislit(koren);
  const otvet = zapis(itog.x.p, itog.x.q);
  const etapy: Etap[] = [];

  const nazvanie = (d: Deystvie): string => `${d.imya}${d.gde === '' ? '' : ` ${d.gde}`}`;

  if (deystviya.length > 1) {
    etapy.push({
      title: 'Порядок действий',
      lines: [
        'Сначала считаем в скобках, в числителе и в знаменателе, затем умножение и деление по порядку слева направо, в конце — сложение и вычитание.',
        `Здесь: ${deystviya.map((d, k) => `${k + 1}) ${nazvanie(d)}`).join(', ')}.`,
      ],
    });
  }
  deystviya.forEach((d, k) => {
    const n = nazvanie(d);
    etapy.push({
      title: `${deystviya.length > 1 ? `${k + 1}. ` : ''}${n[0]?.toUpperCase() ?? ''}${n.slice(1)}`,
      lines: d.lines,
    });
  });

  const itogTex = zTex(itog);
  const otvetTex = tex(otvet);
  const posledniye: string[] = [];
  if (itog.vid === 'drob' || itog.vid === 'smesh') {
    const k = znakov(itog.x) ?? 0;
    const m = 10 ** k;
    const ab = Math.abs(itog.x.p);
    const minusZ = itog.x.p < 0 ? '-' : '';
    const mnozh = m / itog.x.q;
    const cep =
      mnozh === 1
        ? `${itogTex} = ${otvetTex}`
        : `${itogTex} = ${minusZ}${dfrac(`${ab}\\cdot ${mnozh}`, `${itog.x.q}\\cdot ${mnozh}`)} = ${minusZ}${dfrac(ab * mnozh, m)} = ${otvetTex}`;
    posledniye.push(`В бланк записываем десятичную дробь: $${cep}$.`);
  }
  posledniye.push(`Ответ: $${otvetTex}$.`);
  etapy.push({ title: 'Ответ', lines: posledniye });

  /* Подсказки. */
  const hints: HintStep[] = [];
  const pervoe = deystviya[0];
  if (deystviya.length > 1 && pervoe !== undefined) {
    const verno = pokaz(pervoe.uzel);
    const drugie = naivnyePary(koren)
      .filter((s) => s !== verno)
      .map((s) => `$${s}$`);
    if (drugie.length > 0) {
      hints.push(
        vopros(
          'Какое действие выполняем первым?',
          `$${verno}$`,
          drugie,
          sdvig,
          'Сначала скобки, числитель и знаменатель; умножение и деление — раньше сложения и вычитания; равноправные действия — слева направо.',
        ),
      );
    }
  }
  const proDeystvie = (d: Deystvie, s: number): HintStep => {
    /* Ответ действия десятичный — и отвлекающие варианты по возможности десятичные. */
    const drugie = d.oshibki.filter((x) => x.p !== d.rez.x.p || x.q !== d.rez.x.q);
    const desyatichnye = drugie.filter((x) => {
      const k = znakov(x);
      return k !== null && k <= 4;
    });
    const oshibki = [
      ...(d.rez.vid !== 'drob' && desyatichnye.length > 0 ? desyatichnye : drugie),
      /* Запасной отвлекающий вариант — ошибка в знаке или в разряде. */
      d.rez.x.p === 0 ? drob(1) : protiv(d.rez.x),
    ];
    return vopros(
      `Чему равно $${d.vyrazh}$?`,
      `$${zapisKak(d.rez.x, d.rez.vid)}$`,
      oshibki.map((x) => `$${zapisKak(x, d.rez.vid === 'cel' ? 'des' : d.rez.vid)}$`),
      s,
      SOVET[d.imya],
    );
  };
  if (pervoe !== undefined) hints.push(proDeystvie(pervoe, sdvig + 1));
  const posl = deystviya[deystviya.length - 1];
  if (posl !== undefined && posl !== pervoe && hints.length < 3) {
    hints.push(proDeystvie(posl, sdvig + 2));
  }
  if (itog.vid === 'drob' && hints.length < 3) {
    const a = Math.abs(itog.x.p);
    const b = itog.x.q;
    const minusZ = itog.x.p < 0 ? '-' : '';
    const obr = znakov(drob(b, a));
    hints.push(
      vopros(
        `Как записать $${itogTex}$ десятичной дробью?`,
        `$${otvetTex}$`,
        [
          `$${minusZ}${a}{,}${b}$`,
          ...(obr !== null && a !== 0 ? [`$${minusZ}${desTex(drob(b, a))}$`] : []),
          `$${desTex(umn(itog.x, drob(10)))}$`,
        ],
        sdvig + 2,
        'Числитель делим на знаменатель.',
      ),
    );
  }
  return { otvet, etapy, hints };
}
