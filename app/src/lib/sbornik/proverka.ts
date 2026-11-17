/**
 * Проверка ответа сборника для вузов. Без браузера и KaTeX: её берут
 * экран задачи, тренажёр и проверка банка на сборке.
 *
 * Запись ответа разбирает общий модуль части 2 (lib/chast2/vyrazhenie):
 * TeX из математической клавиатуры или обычный текст («3sqrt(2)/2»).
 *
 *   число      — по значению; если нужна точная запись, приближённая
 *                десятичная дробь вместо корня не засчитывается;
 *   выражение  — по значениям в точках из банка: там выражение условия
 *                определено, и в каждой точке уже записано верное значение;
 *   по случаям — ученик сам задаёт промежутки: их объединение должно
 *                совпасть с верным, а на каждом куске — выражение;
 *   несколько чисел — по полям.
 *
 * Форма ответа («без корня в знаменателе», «произведением») проверяется
 * по дереву записи, когда значение уже верно.
 *
 * Не разобралась запись — это не ошибка в решении: подсказка о записи,
 * попытка не тратится.
 */

import { normalizovat, peremennye, razobrat, vychislit, type Uzel } from '@/lib/chast2/vyrazhenie';
import type {
  Forma,
  Oblast,
  Otvet,
  OtvetChislo,
  OtvetKusochnyi,
  OtvetVyrazhenie,
  Tochka,
  VvodSbornika,
} from './types';

export type Itog =
  | { kind: 'verno' }
  | { kind: 'neverno'; zametka?: string }
  /** Запись не разобралась или ответ не в той форме: попытка не тратится. */
  | { kind: 'format'; hint: string };

const TOL = 1e-7;

function blizko(a: number, b: number): boolean {
  return (
    Number.isFinite(a) &&
    Number.isFinite(b) &&
    Math.abs(a - b) <= TOL * Math.max(1, Math.abs(a), Math.abs(b))
  );
}

function pusto(s: string): boolean {
  return s.replace(/\\[,;: ]|\s/g, '').length === 0;
}

/* ── Число ──────────────────────────────────────────────────────── */

/** Есть ли в записи десятичная дробь: «1,41», «0.7». */
function estDesyatichnaya(src: string): boolean {
  return /\d(?:[.,]|\{,\})\d/.test(src);
}

function proveritChislo(tex: string, ot: { znachenie: number; tochno: boolean; zapis: string }): Itog {
  if (pusto(tex)) return { kind: 'format', hint: 'Впишите ответ.' };
  const u = razobrat(tex);
  if (u === null) return { kind: 'format', hint: 'Запись не разобралась — проверьте скобки и знаки.' };
  if (peremennye(u).size > 0) return { kind: 'format', hint: 'В ответе должно быть число, без букв.' };
  const val = vychislit(u);
  if (!blizko(val, ot.znachenie)) return { kind: 'neverno' };
  /* Точный ответ — иррациональный, а введена десятичная дробь: значение
     сошлось лишь приближённо (допуск 1e-7 такое пропустит редко, но
     «1,4142136» вместо √2 — всё равно не ответ). */
  const tochnyyIrracionalnyy = /sqrt|root|pi|\^\(?\d+\/\d+/.test(ot.zapis);
  if (ot.tochno && tochnyyIrracionalnyy && estDesyatichnaya(tex)) {
    return { kind: 'format', hint: 'Нужно точное значение — с корнем, а не десятичное приближение.' };
  }
  return { kind: 'verno' };
}

/* ── Выражение ──────────────────────────────────────────────────── */

function proveritVyrazhenie(
  tex: string,
  ot: Pick<OtvetVyrazhenie, 'peremennye' | 'tochki' | 'forma'>,
): Itog {
  if (pusto(tex)) return { kind: 'format', hint: 'Впишите ответ.' };
  const u = razobrat(tex);
  if (u === null) return { kind: 'format', hint: 'Запись не разобралась — проверьте скобки и знаки.' };
  const lishnie = [...peremennye(u)].filter((v) => !ot.peremennye.includes(v));
  if (lishnie.length > 0) {
    const est = ot.peremennye.map((v) => `$${v}$`).join(', ');
    return {
      kind: 'format',
      hint:
        ot.peremennye.length === 0
          ? 'В ответе должно быть число, без букв.'
          : `В ответе могут быть только буквы условия: ${est}.`,
    };
  }
  if (!sovpadaetVTochkah(u, ot.tochki)) return { kind: 'neverno' };
  return proveritFormu(u, ot.forma ?? []);
}

function sovpadaetVTochkah(u: Uzel, tochki: readonly Tochka[]): boolean {
  return tochki.every((pt) => {
    const { '=': verno, ...vars } = pt;
    return blizko(vychislit(u, vars), verno!);
  });
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
      if (u.op === '^' && u.b.t === 'bin' && u.b.op === '/') return true;
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

interface Promezhutok {
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

function izOblasti(o: Oblast): Promezhutok {
  return {
    lo: o.lo ?? -Infinity,
    hi: o.hi ?? Infinity,
    loZakr: o.loZakr,
    hiZakr: o.hiZakr,
  };
}

/** Объединение промежутков → непересекающиеся куски по возрастанию. */
function obedinit(list: readonly Promezhutok[]): Promezhutok[] {
  const s = [...list].sort((a, b) => a.lo - b.lo || Number(b.loZakr) - Number(a.loZakr));
  const out: Promezhutok[] = [];
  for (const p of s) {
    const last = out[out.length - 1];
    if (last !== undefined && (p.lo < last.hi || (p.lo === last.hi && (p.loZakr || last.hiZakr)))) {
      if (p.hi > last.hi || (p.hi === last.hi && p.hiZakr)) {
        last.hi = p.hi;
        last.hiZakr = p.hiZakr || (p.hi === last.hi && last.hiZakr);
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
    if (last !== undefined && last.hi === p.lo && !last.hiZakr && !p.loZakr) {
      last.hi = p.hi;
      last.hiZakr = p.hiZakr;
    } else {
      out.push({ ...p });
    }
  }
  return out;
}

function ravnyObedineniya(a: readonly Promezhutok[], b: readonly Promezhutok[]): boolean {
  const x = bezVykolotyh(a);
  const y = bezVykolotyh(b);
  const eq = (p: number, q: number) => p === q || blizko(p, q);
  return (
    x.length === y.length &&
    x.every(
      (p, i) =>
        eq(p.lo, y[i]!.lo) &&
        eq(p.hi, y[i]!.hi) &&
        p.loZakr === y[i]!.loZakr &&
        p.hiZakr === y[i]!.hiZakr,
    )
  );
}

function vnutri(x: number, p: Promezhutok): boolean {
  return (x > p.lo || (p.loZakr && x === p.lo)) && (x < p.hi || (p.hiZakr && x === p.hi));
}

function proveritKuski(
  kuski: readonly { oblast: string; tex: string }[],
  ot: OtvetKusochnyi,
): Itog {
  const zapolneny = kuski.filter((k) => !pusto(k.oblast) || !pusto(k.tex));
  if (zapolneny.length === 0) return { kind: 'format', hint: 'Впишите ответ.' };
  const v = ot.peremennaya;
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
    const lishnie = [...peremennye(u)].filter((name) => name !== v && !ot.kuski[0]!.peremennye.includes(name));
    if (lishnie.length > 0) {
      return { kind: 'format', hint: `В строке ${i + 1} лишняя буква: $${lishnie[0]}$.` };
    }
    for (const p of chasti) razobrannye.push({ p: p!, u });
  }
  if (!ravnyObedineniya(razobrannye.map((r) => r.p), ot.kuski.map((k) => izOblasti(k.oblast)))) {
    return { kind: 'neverno', zametka: 'Промежутки вместе не совпадают с областью, где выражение определено.' };
  }
  for (const k of ot.kuski) {
    for (const pt of k.tochki) {
      const x = pt[v]!;
      const r = razobrannye.find((item) => vnutri(x, item.p));
      if (r === undefined) return { kind: 'neverno' };
      const { '=': verno, ...vars } = pt;
      if (!blizko(vychislit(r.u, vars), verno!)) {
        return { kind: 'neverno', zametka: 'На одном из промежутков выражение неверное.' };
      }
    }
  }
  return { kind: 'verno' };
}

/* ── Общая точка входа ──────────────────────────────────────────── */

export function proverit(vvod: VvodSbornika, otvet: Otvet): Itog {
  switch (otvet.vid) {
    case 'chislo':
      if (vvod.vid !== 'odno') return { kind: 'format', hint: 'Впишите ответ.' };
      return withForma(proveritChislo(vvod.tex, otvet), vvod.tex, otvet);
    case 'vyrazhenie':
      if (vvod.vid !== 'odno') return { kind: 'format', hint: 'Впишите ответ.' };
      return proveritVyrazhenie(vvod.tex, otvet);
    case 'kusochnyi':
      if (vvod.vid !== 'kuski') return { kind: 'format', hint: 'Впишите ответ.' };
      return proveritKuski(vvod.kuski, otvet);
    case 'chisla': {
      if (vvod.vid !== 'polya') return { kind: 'format', hint: 'Впишите ответ.' };
      for (const [i, pole] of otvet.polya.entries()) {
        const itog = proveritChislo(vvod.polya[i] ?? '', pole);
        if (itog.kind === 'format') {
          return { kind: 'format', hint: `$${pole.podpis}$: ${itog.hint}` };
        }
        if (itog.kind === 'neverno') return itog;
      }
      return { kind: 'verno' };
    }
  }
}

function withForma(itog: Itog, tex: string, ot: OtvetChislo): Itog {
  if (itog.kind !== 'verno' || ot.forma === undefined) return itog;
  const u = razobrat(tex);
  return u === null ? itog : proveritFormu(u, ot.forma);
}

/** Пустой ввод под вид ответа. */
export function pustoyVvod(otvet: Otvet): VvodSbornika {
  switch (otvet.vid) {
    case 'kusochnyi':
      /* Две строки, а не по числу кусков ответа: число случаев ученик
         находит сам, строки добавляются кнопкой. */
      return { vid: 'kuski', kuski: [{ oblast: '', tex: '' }, { oblast: '', tex: '' }] };
    case 'chisla':
      return { vid: 'polya', polya: otvet.polya.map(() => '') };
    default:
      return { vid: 'odno', tex: '' };
  }
}
