/**
 * Автопроверка ответа №14.
 *
 * Пункт а: ученик вводит серии в любой равносильной записи
 * ($\frac{\pi}{6}+2\pi k$, $(-1)^k\frac{\pi}{6}+\pi k$, $\pm\frac{\pi}{3}+2\pi n$).
 * Сравниваются не записи, а множества корней на большом отрезке
 * $[-20\pi;\,20\pi]$: разные записи одного множества засчитываются.
 *
 * Пункт б: корни через точку с запятой, порядок не важен.
 */

import { razobrat, vychislit } from '../chast2/vyrazhenie';
import { chislaSeriy, ravnyMnozhestva, unikalnye, znach, type Seriya, type Ugol } from './ugol';

export const OKNO = 20 * Math.PI;

const BUKVY = ['k', 'n', 'm', 'l', 't'];

/** Убирает «x=», «, k\in\mathbb{Z}» и обёртки. */
function ochistit(src: string): string {
  let t = src.trim();
  t = t.replace(/^\s*x\s*=\s*/, '');
  t = t.replace(/[,;]?\s*(\\left)?\(?\s*[a-z]\s*(\\in|∈).*$/u, '');
  t = t.replace(/\\mathbb\{Z\}|ℤ/gu, '');
  return t.trim();
}

export type ItogSerii =
  | { itog: 'verno' }
  | { itog: 'neverno'; lishnie: number[]; poteryany: number[] }
  | { itog: 'ne-razobrano'; stroka: number };

/** Корни одной записи серии на окне. null — запись не разобралась. */
export function korniZapisi(zapis: string, lo = -OKNO, hi = OKNO): number[] | null {
  const chast = raskrytPm(ochistit(zapis));
  const out: number[] = [];
  for (const c of chast) {
    const u = razobrat(c);
    if (u === null) return null;
    const bukva = BUKVY.find((b) => new RegExp(`(^|[^a-z])${b}([^a-z]|$)`).test(c.replace(/\\[a-zA-Z]+/g, ' '))) ?? 'k';
    let est = false;
    for (let k = -400; k <= 400; k += 1) {
      const x = vychislit(u, { [bukva]: k });
      if (!Number.isFinite(x)) return null;
      est = true;
      if (x >= lo - 1e-9 && x <= hi + 1e-9) out.push(x);
    }
    if (!est) return null;
  }
  return out;
}

/**
 * ± — перед первым слагаемым: «\pm\frac{\pi}{3}+2\pi k» → «\frac{\pi}{3}+2\pi k»
 * и «-\frac{\pi}{3}+2\pi k». Слагаемое с буквой серии ищется по уровню скобок.
 */
function raskrytPm(t: string): string[] {
  const m = /^(\\pm|±)\s*/u.exec(t);
  if (m === null) return [t];
  const rest = t.slice(m[0].length);
  /* Первое слагаемое — до «+»/«-» на нулевом уровне скобок. */
  let depth = 0;
  let cut = rest.length;
  for (let i = 1; i < rest.length; i += 1) {
    const ch = rest[i];
    if (ch === '{' || ch === '(') depth += 1;
    else if (ch === '}' || ch === ')') depth -= 1;
    else if ((ch === '+' || ch === '-') && depth === 0) {
      cut = i;
      break;
    }
  }
  const a = rest.slice(0, cut);
  const b = rest.slice(cut);
  return [`${a}${b}`, `-(${a})${b}`];
}

/** Проверка пункта а: записи серий ученика против эталона. */
export function proveritSerii(zapisi: readonly string[], etalon: readonly Seriya[]): ItogSerii {
  const lo = -OKNO;
  const hi = OKNO;
  const vse: number[] = [];
  const nepustye = zapisi.map((z) => z.trim()).filter((z) => z !== '');
  for (let i = 0; i < nepustye.length; i += 1) {
    const k = korniZapisi(nepustye[i] as string, lo, hi);
    if (k === null) return { itog: 'ne-razobrano', stroka: i };
    vse.push(...k);
  }
  const u = unikalnye(vse);
  const e = chislaSeriy(etalon, lo, hi);
  if (ravnyMnozhestva(u, e)) return { itog: 'verno' };
  const est = (xs: number[], x: number) => xs.some((y) => Math.abs(x - y) < 1e-6);
  /* Только с центральной части окна: у краёв серии обрываются по-разному. */
  const vCentre = (x: number) => Math.abs(x) <= 2 * Math.PI + 1e-9;
  return {
    itog: 'neverno',
    lishnie: u.filter((x) => vCentre(x) && !est(e, x)),
    poteryany: e.filter((x) => vCentre(x) && !est(u, x)),
  };
}

export type ItogKorney =
  | { itog: 'verno' }
  | { itog: 'neverno'; lishnie: number; poteryano: number }
  | { itog: 'ne-razobrano' };

/** Числа ответа пункта б: «-\frac{7\pi}{2};\ -\frac{17\pi}{6}». null — не разобралось. */
export function chislaOtveta(vvod: string): number[] | null {
  const t = vvod.replace(/\\varnothing|∅/gu, '').trim();
  if (t === '') return [];
  const out: number[] = [];
  for (const kusok of t.split(/;|\\;|\n/u)) {
    const c = kusok.replace(/^\\\s*/, '').trim();
    if (c === '') continue;
    const u = razobrat(c);
    if (u === null) return null;
    const x = vychislit(u, {});
    if (!Number.isFinite(x)) return null;
    out.push(x);
  }
  return out;
}

export function proveritKorni(vvod: string, etalon: readonly Ugol[]): ItogKorney {
  const xs = chislaOtveta(vvod);
  if (xs === null) return { itog: 'ne-razobrano' };
  const u = unikalnye(xs);
  const e = etalon.map(znach);
  if (ravnyMnozhestva(u, unikalnye(e))) return { itog: 'verno' };
  const est = (arr: number[], x: number) => arr.some((y) => Math.abs(x - y) < 1e-6);
  return {
    itog: 'neverno',
    lishnie: u.filter((x) => !est(e, x)).length,
    poteryano: e.filter((x) => !est(u, x)).length,
  };
}
