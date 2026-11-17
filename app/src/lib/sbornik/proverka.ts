/**
 * Проверка ответа сборника для вузов. Без браузера и KaTeX: её берут
 * экран задачи, тренажёр и проверка банка (scripts/check-sbornik.mjs).
 *
 * Верных значений у браузера нет — только отпечатки (zamok.ts):
 *
 *   число      — значение ответа ученика, округлённое до 8 значащих
 *                цифр, сравнивается с отпечатком; если верный ответ
 *                иррациональный, десятичная дробь — подсказка о записи;
 *   выражение  — ответ ученика вычисляется в точках проверки (там
 *                выражение условия определено), каждое значение — с
 *                отпечатком верного;
 *   по случаям — ученик задаёт промежутки сам: отпечаток их объединения
 *                должен совпасть с отпечатком области определения
 *                (выколотые внутри точки не различаются), в каждой точке —
 *                значение выражения той строки, куда точка попала;
 *   несколько чисел — по полям.
 *
 * Запись ответа разбирает общий модуль части 2 (lib/chast2/vyrazhenie):
 * TeX из математической клавиатуры или обычный текст («3sqrt(2)/2»).
 * Не разобралась запись — подсказка о записи, попытка не тратится.
 */

import { normalizovat, peremennye, razobrat, vychislit, type Uzel } from '@/lib/chast2/vyrazhenie';
import type { Forma, ProverkaKlient, TochkaKlient, VvodSbornika } from './types';
import { kanon, otpechatokStroki, sovpadaetZnachenie } from './zamok';

export type Itog =
  | { kind: 'verno' }
  | { kind: 'neverno'; zametka?: string }
  /** Запись не разобралась или ответ не в той форме: попытка не тратится. */
  | { kind: 'format'; hint: string };

function pusto(s: string): boolean {
  return s.replace(/\\[,;: ]|\s/g, '').length === 0;
}

/** Переменные точки и отпечаток её значения. */
function razdelit(pt: TochkaKlient): { vars: Record<string, number>; o: string } {
  const vars: Record<string, number> = {};
  let o = '';
  for (const [k, v] of Object.entries(pt)) {
    if (k === '#') o = String(v);
    else vars[k] = Number(v);
  }
  return { vars, o };
}

/* ── Число ──────────────────────────────────────────────────────── */

/** Есть ли в записи десятичная дробь: «1,41», «0.7». */
function estDesyatichnaya(src: string): boolean {
  return /\d(?:[.,]|\{,\})\d/.test(src);
}

function proveritChislo(tex: string, o: string, irr: boolean): Itog {
  if (pusto(tex)) return { kind: 'format', hint: 'Впишите ответ.' };
  const u = razobrat(tex);
  if (u === null) return { kind: 'format', hint: 'Запись не разобралась — проверьте скобки и знаки.' };
  if (peremennye(u).size > 0) return { kind: 'format', hint: 'В ответе должно быть число, без букв.' };
  if (irr && estDesyatichnaya(tex)) {
    return { kind: 'format', hint: 'Нужно точное значение — с корнем, а не десятичное приближение.' };
  }
  return sovpadaetZnachenie(vychislit(u), o) ? { kind: 'verno' } : { kind: 'neverno' };
}

/* ── Выражение ──────────────────────────────────────────────────── */

function lishnieBukvy(u: Uzel, mozhno: readonly string[]): string[] {
  return [...peremennye(u)].filter((v) => !mozhno.includes(v));
}

function proveritVyrazhenie(
  tex: string,
  pr: { peremennye: readonly string[]; tochki: readonly TochkaKlient[]; forma?: readonly Forma[] },
): Itog {
  if (pusto(tex)) return { kind: 'format', hint: 'Впишите ответ.' };
  const u = razobrat(tex);
  if (u === null) return { kind: 'format', hint: 'Запись не разобралась — проверьте скобки и знаки.' };
  if (lishnieBukvy(u, pr.peremennye).length > 0) {
    const est = pr.peremennye.map((v) => `$${v}$`).join(', ');
    return {
      kind: 'format',
      hint:
        pr.peremennye.length === 0
          ? 'В ответе должно быть число, без букв.'
          : `В ответе могут быть только буквы условия: ${est}.`,
    };
  }
  const vse = pr.tochki.every((pt) => {
    const { vars, o } = razdelit(pt);
    return sovpadaetZnachenie(vychislit(u, vars), o);
  });
  if (!vse) return { kind: 'neverno' };
  return proveritFormu(u, pr.forma ?? []);
}

/* ── Форма ответа ───────────────────────────────────────────────── */

function estKoren(u: Uzel): boolean {
  switch (u.t) {
    case 'num':
    case 'var':
      return false;
    case 'neg':
      return estKoren(u.a);
    case 'bin':
      if (u.op === '^' && u.b.t !== 'num') return true;
      if (u.op === '^' && u.b.t === 'num' && !Number.isInteger(u.b.v)) return true;
      return estKoren(u.a) || estKoren(u.b);
    case 'fn':
      return u.name === 'sqrt' || u.name === 'root' || u.args.some(estKoren);
  }
}

function kornVZnamenatele(u: Uzel): boolean {
  switch (u.t) {
    case 'num':
    case 'var':
      return false;
    case 'neg':
      return kornVZnamenatele(u.a);
    case 'bin':
      if (u.op === '/' && estKoren(u.b)) return true;
      if (u.op === '^' && u.b.t === 'neg') return estKoren(u.a);
      return kornVZnamenatele(u.a) || kornVZnamenatele(u.b);
    case 'fn':
      return u.args.some(kornVZnamenatele);
  }
}

/** Множители произведения верхнего уровня (минус и числа не в счёт). */
function mnozhiteli(u: Uzel): Uzel[] {
  if (u.t === 'neg') return mnozhiteli(u.a);
  if (u.t === 'bin' && u.op === '*') return [...mnozhiteli(u.a), ...mnozhiteli(u.b)];
  if (u.t === 'bin' && u.op === '^' && u.b.t === 'num' && Number.isInteger(u.b.v) && u.b.v >= 2) {
    return [u.a, u.a];
  }
  return u.t === 'num' ? [] : [u];
}

function proveritFormu(u: Uzel, forma: readonly Forma[]): Itog {
  if (forma.includes('bez-kornya-v-znamenatele') && kornVZnamenatele(u)) {
    return {
      kind: 'format',
      hint: 'Значение верное, но в знаменателе остался корень — освободитесь от него.',
    };
  }
  if (forma.includes('proizvedenie') && mnozhiteli(u).length < 2) {
    return {
      kind: 'format',
      hint: 'Значение верное, но ответ нужно записать произведением множителей.',
    };
  }
  return { kind: 'verno' };
}

/* ── По случаям ─────────────────────────────────────────────────── */

export interface Promezhutok {
  lo: number;
  hi: number;
  loZakr: boolean;
  hiZakr: boolean;
}

/**
 * Промежуток из записи: «(-\infty; 3]», «[1;5)», «(2;+∞)», «x<3», «x\geq 1».
 * Числа — любые записи, что понимает разбор («\frac{1}{2}», «\sqrt{3}»).
 */
export function razobratPromezhutok(src: string, v = 'x'): Promezhutok | null {
  let s = src
    .trim()
    .replace(/\\left|\\right/g, '')
    .replace(/\\lbrack|\\lparen/g, (m) => (m === '\\lbrack' ? '[' : '('))
    .replace(/\\rbrack|\\rparen/g, (m) => (m === '\\rbrack' ? ']' : ')'))
    .replace(/\s+/g, '');
  const ch = (t: string): number | null => {
    const n = normalizovat(t);
    if (/^\+?inf$/.test(n)) return Infinity;
    if (n === '-inf') return -Infinity;
    const u = razobrat(t);
    if (u === null || peremennye(u).size > 0) return null;
    const val = vychislit(u);
    return Number.isNaN(val) ? null : val;
  };
  const m = /^([[(])(.+);(.+)([\])])$/.exec(s);
  if (m !== null) {
    const lo = ch(m[2]!);
    const hi = ch(m[3]!);
    if (lo === null || hi === null || !(lo < hi)) return null;
    return {
      lo,
      hi,
      loZakr: m[1] === '[' && Number.isFinite(lo),
      hiZakr: m[4] === ']' && Number.isFinite(hi),
    };
  }
  /* Неравенства: x<3, x\le 3, 3<x<5, -1\leq x<2. */
  s = s
    .replace(/\\leqslant|\\leq|\\le|≤/g, '≤')
    .replace(/\\geqslant|\\geq|\\ge|≥/g, '≥')
    .replace(/\\lt/g, '<')
    .replace(/\\gt/g, '>');
  const dvoynoe = new RegExp(`^(.+?)(<|≤)${v}(<|≤)(.+)$`).exec(s);
  if (dvoynoe !== null) {
    const lo = ch(dvoynoe[1]!);
    const hi = ch(dvoynoe[4]!);
    if (lo === null || hi === null || !(lo < hi)) return null;
    return { lo, hi, loZakr: dvoynoe[2] === '≤', hiZakr: dvoynoe[3] === '≤' };
  }
  const odno = new RegExp(`^${v}(<|≤|>|≥)(.+)$`).exec(s);
  if (odno !== null) {
    const c = ch(odno[2]!);
    if (c === null || !Number.isFinite(c)) return null;
    const zn = odno[1]!;
    return zn === '<' || zn === '≤'
      ? { lo: -Infinity, hi: c, loZakr: false, hiZakr: zn === '≤' }
      : { lo: c, hi: Infinity, loZakr: zn === '≥', hiZakr: false };
  }
  return null;
}

/** Объединение промежутков → непересекающиеся куски по возрастанию. */
function obedinit(list: readonly Promezhutok[]): Promezhutok[] {
  const s = [...list].sort((a, b) => a.lo - b.lo || Number(b.loZakr) - Number(a.loZakr));
  const out: Promezhutok[] = [];
  for (const p of s) {
    const last = out[out.length - 1];
    if (last !== undefined && (p.lo < last.hi || (p.lo === last.hi && (p.loZakr || last.hiZakr)))) {
      if (p.hi > last.hi || (p.hi === last.hi && p.hiZakr)) {
        last.hiZakr = p.hi > last.hi ? p.hiZakr : last.hiZakr || p.hiZakr;
        last.hi = p.hi;
      }
    } else {
      out.push({ ...p });
    }
  }
  return out;
}

/**
 * Выколотые точки внутри промежутка не различаем: «$1$ при $x\in(-\infty;7)$»
 * и «$1$ при $x\in(-\infty;-1)$; $1$ при $x\in(-1;7)$» — один ответ.
 * Точку вне области определения ученик видит в решении, а промежуток с
 * «дыркой» записью $(a;b)$ не выразить. Концы области — различаем.
 */
function bezVykolotyh(list: readonly Promezhutok[]): Promezhutok[] {
  const s = obedinit(list);
  const out: Promezhutok[] = [];
  for (const p of s) {
    const last = out[out.length - 1];
    if (last !== undefined && kanon(last.hi) === kanon(p.lo) && !last.hiZakr && !p.loZakr) {
      last.hi = p.hi;
      last.hiZakr = p.hiZakr;
    } else {
      out.push({ ...p });
    }
  }
  return out;
}

/**
 * Каноническая строка объединения промежутков — по ней строится и
 * сравнивается отпечаток области: «(-inf;30000000e-7]U(…)».
 */
export function strokaObedineniya(list: readonly Promezhutok[]): string {
  const konec = (x: number) => (x === -Infinity ? '-inf' : x === Infinity ? 'inf' : kanon(x));
  return bezVykolotyh(list)
    .map((p) => `${p.loZakr ? '[' : '('}${konec(p.lo)};${konec(p.hi)}${p.hiZakr ? ']' : ')'}`)
    .join('U');
}

function vnutri(x: number, p: Promezhutok): boolean {
  return (x > p.lo || (p.loZakr && x === p.lo)) && (x < p.hi || (p.hiZakr && x === p.hi));
}

function proveritKuski(
  kuski: readonly { oblast: string; tex: string }[],
  pr: Extract<ProverkaKlient, { vid: 'kusochnyi' }>,
): Itog {
  const zapolneny = kuski.filter((k) => !pusto(k.oblast) || !pusto(k.tex));
  if (zapolneny.length === 0) return { kind: 'format', hint: 'Впишите ответ.' };
  const v = pr.peremennaya;
  const razobrannye: { p: Promezhutok; u: Uzel }[] = [];
  for (const [i, k] of zapolneny.entries()) {
    /* В строке может быть объединение: «(-\infty;-2)\cup(-2;0)». */
    const chasti = k.oblast.split(/\\cup|∪/).map((c) => razobratPromezhutok(c, v));
    if (chasti.length === 0 || chasti.some((c) => c === null)) {
      return {
        kind: 'format',
        hint: `Промежуток в строке ${i + 1} не разобрался. Пишите так: $(-\\infty;\\,3)$, $[1;\\,5]$ или $${v}<3$.`,
      };
    }
    const u = razobrat(k.tex);
    if (u === null || pusto(k.tex)) {
      return { kind: 'format', hint: `Выражение в строке ${i + 1} не разобралось.` };
    }
    const lishnie = lishnieBukvy(u, [v, ...pr.bukvy]);
    if (lishnie.length > 0) {
      return { kind: 'format', hint: `В строке ${i + 1} лишняя буква: $${lishnie[0]}$.` };
    }
    for (const p of chasti) razobrannye.push({ p: p!, u });
  }
  if (otpechatokStroki(strokaObedineniya(razobrannye.map((r) => r.p))) !== pr.oblast) {
    return { kind: 'neverno', zametka: 'Промежутки вместе не совпадают с областью, где выражение определено.' };
  }
  for (const pt of pr.tochki) {
    const { vars, o } = razdelit(pt);
    const x = vars[v]!;
    const r = razobrannye.find((item) => vnutri(x, item.p));
    if (r === undefined || !sovpadaetZnachenie(vychislit(r.u, vars), o)) {
      return { kind: 'neverno', zametka: 'На одном из промежутков выражение неверное.' };
    }
  }
  return { kind: 'verno' };
}

/* ── Общая точка входа ──────────────────────────────────────────── */

export function proverit(vvod: VvodSbornika, pr: ProverkaKlient): Itog {
  switch (pr.vid) {
    case 'chislo': {
      if (vvod.vid !== 'odno') return { kind: 'format', hint: 'Впишите ответ.' };
      const itog = proveritChislo(vvod.tex, pr.o, pr.irr);
      if (itog.kind !== 'verno' || pr.forma === undefined) return itog;
      const u = razobrat(vvod.tex);
      return u === null ? itog : proveritFormu(u, pr.forma);
    }
    case 'vyrazhenie':
      if (vvod.vid !== 'odno') return { kind: 'format', hint: 'Впишите ответ.' };
      return proveritVyrazhenie(vvod.tex, pr);
    case 'kusochnyi':
      if (vvod.vid !== 'kuski') return { kind: 'format', hint: 'Впишите ответ.' };
      return proveritKuski(vvod.kuski, pr);
    case 'chisla': {
      if (vvod.vid !== 'polya') return { kind: 'format', hint: 'Впишите ответ.' };
      for (const [i, pole] of pr.polya.entries()) {
        const itog = proveritChislo(vvod.polya[i] ?? '', pole.o, pole.irr);
        if (itog.kind === 'format') return { kind: 'format', hint: `$${pole.podpis}$: ${itog.hint}` };
        if (itog.kind === 'neverno') return itog;
      }
      return { kind: 'verno' };
    }
  }
}

/** Пустой ввод под вид ответа. */
export function pustoyVvod(pr: ProverkaKlient): VvodSbornika {
  switch (pr.vid) {
    case 'kusochnyi':
      /* Две строки, а не по числу кусков ответа: число случаев ученик
         находит сам, строки добавляются кнопкой. */
      return { vid: 'kuski', kuski: [{ oblast: '', tex: '' }, { oblast: '', tex: '' }] };
    case 'chisla':
      return { vid: 'polya', polya: pr.polya.map(() => '') };
    default:
      return { vid: 'odno', tex: '' };
  }
}
