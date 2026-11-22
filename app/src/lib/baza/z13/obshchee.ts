/**
 * База, задание №13: общее для прототипов — числа строки данных,
 * запись чисел и корней в TeX, подсказки-вопросы и сборка прототипа
 * по таблице чисел (dannye.ts) с чертежом условия (ris.ts).
 */

import type { Rng } from '@/lib/veroyatnost/generator';
import { konechna, tex, zapis } from '../chisla';
import type { HintStep, Params, Prototip, Resheno } from '../types';
import { DANNYE_13, KLUCHI_13 } from './dannye';
import { narisovat, vershinyUsloviya } from './ris';
import type { Model } from '@/lib/solid/model';

export const num = (p: Params, key: string): number => {
  const v = p[key];
  if (typeof v !== 'number') throw new Error(`нет числа ${key}`);
  return v;
};

/** Число m/n в TeX: «14{,}5». */
export const t = (m: number, n = 1): string => tex(zapis(m, n));

/** m/n в TeX: десятичной дробью, если она конечна, иначе — \frac (для подсказок). */
export const drob = (m: number, n = 1): string =>
  konechna(m, n) ? t(m, n) : `\\frac{${m / nodK(m, n)}}{${n / nodK(m, n)}}`;

const nodK = (a: number, b: number): number => (b === 0 ? Math.abs(a) : nodK(b, a % b));

/** Площадь правильного треугольника со стороной a в TeX, сокращённо: 4√3, \frac{25\sqrt{3}}{4}. */
export function sPravilnogo(a: number): string {
  const kv = a * a;
  if (kv % 4 === 0) return kv === 4 ? '\\sqrt{3}' : `${kv / 4}\\sqrt{3}`;
  return kv % 2 === 0 ? `\\frac{${kv / 2}\\sqrt{3}}{2}` : `\\frac{${kv}\\sqrt{3}}{4}`;
}

/** Ответ из TeX-записи в запись бланка: «14{,}5» → «14,5». */
export const blank = (texZapis: string): string => texZapis.replace('{,}', ',').replace(/^-/, '−');

/** Вариант подсказки формулой: «$12$». */
export const $ = (s: string): string => `$${s}$`;

/** Корень в TeX: k√n, k = 1 — просто √n. */
export const koren = (k: number, n: number): string => `${k === 1 ? '' : String(k)}\\sqrt{${n}}`;

/** Целый корень из n; бросает, если n — не полный квадрат. */
export function tselyyKoren(n: number): number {
  const r = Math.round(Math.sqrt(n));
  if (r * r !== n) throw new Error(`корень из ${n} не целый`);
  return r;
}

/** Корень из n перебором целых: для независимого пересчёта. */
export function korenPereborom(n: number): number {
  for (let r = 0; r * r <= n; r += 1) if (r * r === n) return r;
  throw new Error(`у ${n} нет целого корня`);
}

/** Значение, посчитанное в плавающей точке, — в запись бланка (до сотых). */
export function izmereno(x: number): string {
  const r = Math.round(x * 100);
  if (Math.abs(x * 100 - r) > 1e-6) throw new Error(`не до сотых: ${x}`);
  return zapis(r, 100);
}

/**
 * Подсказка-вопрос: верный вариант и отвлекающие (повторы убраны),
 * место верного зависит от sdvig — одно и то же при пересборке.
 */
export function vopros(
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

/**
 * Прототип по таблице чисел: generate берёт одну строку dannye.ts и
 * называет её числа ключами KLUCHI_13. Чертёж проверяется по условию:
 * каждая вершина, названная в тексте, должна быть подписана.
 */
export function prototip(o: {
  id: string;
  gruppa: string;
  title: string;
  text: (p: Params) => string;
  solve: (p: Params) => Resheno;
  proverka: (p: Params) => string;
  model: (p: Params) => Model;
}): Prototip {
  const stroki = DANNYE_13[o.id];
  const kluchi = KLUCHI_13[o.id];
  if (stroki === undefined || kluchi === undefined) throw new Error(`нет чисел ${o.id}`);
  return {
    id: o.id,
    gruppa: o.gruppa,
    title: o.title,
    tip: 'chislo',
    zadach: stroki.length,
    generate(rng: Rng) {
      const s = stroki[rng.int(0, stroki.length - 1)] ?? [];
      const p: Params = {};
      kluchi.forEach((k, i) => {
        p[k] = s[i] ?? NaN;
      });
      return p;
    },
    text: o.text,
    solve: o.solve,
    proverka: o.proverka,
    risunok(p) {
      return narisovat(o.model(p), vershinyUsloviya(o.text(p)));
    },
  };
}
