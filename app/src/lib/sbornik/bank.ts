/**
 * Банк сборника на сборке: читает data/sbornik/glava-N/tip-*.json и
 * набирает тексты KaTeX. Только для серверных страниц и файлов данных —
 * в браузер уходит ZadachaHtml без служебной части.
 */

import fs from 'node:fs';
import path from 'node:path';
import { typeset, typesetKrupno } from '@/lib/tex';
import { TIPY } from '@/content/sbornik';
import type { Otvet, ZadachaDannye, ZadachaHtml } from './types';

const DATA = path.join(process.cwd(), 'src', 'data', 'sbornik');

const cache = new Map<string, readonly ZadachaDannye[]>();

/** Задачи типа «1.2» из файла банка; файла ещё нет — пусто. */
export function zadachiTipa(tip: string): readonly ZadachaDannye[] {
  const got = cache.get(tip);
  if (got !== undefined) return got;
  const glava = tip.split('.')[0]!;
  const file = path.join(DATA, `glava-${glava}`, `tip-${tip}.json`);
  const list: ZadachaDannye[] = fs.existsSync(file)
    ? (JSON.parse(fs.readFileSync(file, 'utf8')) as ZadachaDannye[])
    : [];
  cache.set(tip, list);
  return list;
}

/** Все задачи главы в порядке типов. */
export function zadachiGlavy(glava: number): readonly ZadachaDannye[] {
  return (TIPY[glava] ?? []).flatMap((t) => zadachiTipa(t.id));
}

/** Формула отдельной строкой: дроби крупные. */
export function formulaHtml(tex: string): string {
  return typesetKrupno(`$\\displaystyle ${tex}$`);
}

/**
 * Выражение условия: все дроби — \dfrac. Иначе вложенная дробь
 * «многоэтажного» выражения набирается мелким кеглем, как индекс.
 */
export function formulaUsloviyaHtml(tex: string): string {
  return formulaHtml(tex.replace(/\\frac(?![a-zA-Z])/g, '\\dfrac'));
}

export function otvetTex(otvet: Otvet): string {
  return otvet.tex;
}

/**
 * Куски ответа для показа: соседние с одним и тем же выражением
 * сливаются в объединение — «$2-x$ при $x\in(-\infty;-2)\cup(-2;0)$».
 */
export function kuskiOtveta(otvet: Extract<Otvet, { vid: 'kusochnyi' }>): { tex: string; oblast: string }[] {
  const out: { tex: string; zapis: string; oblast: string[] }[] = [];
  for (const k of otvet.kuski) {
    const last = out[out.length - 1];
    if (last !== undefined && last.zapis === k.zapis) last.oblast.push(k.oblast.tex);
    else out.push({ tex: k.tex, zapis: k.zapis, oblast: [k.oblast.tex] });
  }
  return out.map((k) => ({ tex: k.tex, oblast: k.oblast.join('\\cup') }));
}

/** Ответ строкой, дроби крупные: в ответе $\\frac{a+7b}{ab}$ мелкая дробь не читается. */
function krupno(text: string): string {
  return typesetKrupno(text.replace(/\\frac(?![a-zA-Z])/g, '\\dfrac'));
}

export function otvetHtml(otvet: Otvet): string {
  if (otvet.vid === 'kusochnyi') {
    return kuskiOtveta(otvet)
      .map((k) => krupno(`$${k.tex}$ при $${otvet.peremennaya}\\in${k.oblast}$`))
      .join('; ');
  }
  if (otvet.vid === 'chisla') {
    return otvet.polya.map((p) => krupno(`$${p.podpis}=${p.tex}$`)).join(', ');
  }
  return krupno(`$${otvet.tex}$`);
}

/** Задача для показа: тексты набраны, служебная проверка отрезана. */
export function vHtml(z: ZadachaDannye): ZadachaHtml {
  return {
    id: z.id,
    tip: z.tip,
    uroven: z.uroven,
    uslovieHtml: typeset(z.uslovie),
    ...(z.formula === undefined ? {} : { formulaHtml: formulaUsloviyaHtml(z.formula) }),
    ...(z.dopolnenie === undefined ? {} : { dopolnenieHtml: typeset(z.dopolnenie) }),
    otvet: z.otvet,
    otvetHtml: otvetHtml(z.otvet),
    shagi: z.razbor.map((s) => ({
      chtoHtml: typeset(s.chto),
      formulaHtml: s.tex === undefined || s.tex === '' ? '' : formulaHtml(s.tex),
    })),
    podskazkiHtml: z.podskazki.map((p) => typeset(p)),
  };
}

/** Номер задачи для человека: «1.2.17». */
export function nomerZadachi(id: string): string {
  const [g, t, n] = id.split('.');
  return `${g}.${t}.${Number(n)}`;
}
