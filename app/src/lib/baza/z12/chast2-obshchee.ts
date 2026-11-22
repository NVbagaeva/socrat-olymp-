/**
 * База, задание №12, часть 2: общее для прототипов задач 115–242
 * (площадь, теорема Пифагора, подобие и средняя линия).
 *
 * Числа условия — из готовых аналогов (chast2-dannye.ts): прототип
 * выбирает набор по номеру, а условие, разбор, ответ и чертёж строит из
 * чисел. Считается в точных дробях (пара целых) и точных корнях: ответ
 * №12 — конечная десятичная дробь, плавающая точка здесь не годится.
 * Независимая проверка (proverka) — наоборот, на координатах в
 * плавающей точке, с округлением до десятитысячных.
 */

import { pustoyOtchet, renderPlan } from '@/lib/planimetriya/render';
import { projT } from '@/lib/planimetriya/geom';
import type { Element, Scena } from '@/lib/planimetriya/types';
import { konechna, nod, tex, zapis } from '../chisla';
import type { HintStep, Params, Prototip, Resheno } from '../types';

/* ── Точные дроби ─────────────────────────────────────────────── */

/** Дробь m/n: несократимая, знаменатель положительный. */
export type Q = readonly [number, number];

export function q(m: number, n = 1): Q {
  if (!Number.isInteger(m) || !Number.isInteger(n) || n === 0) {
    throw new Error(`не дробь: ${m}/${n}`);
  }
  const g = nod(m, n) || 1;
  const s = n < 0 ? -1 : 1;
  return [(s * m) / g, (s * n) / g];
}
export const plus = (a: Q, b: Q): Q => q(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
export const minus = (a: Q, b: Q): Q => q(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
export const umn = (a: Q, b: Q): Q => q(a[0] * b[0], a[1] * b[1]);
export const del = (a: Q, b: Q): Q => q(a[0] * b[1], a[1] * b[0]);
export const kv = (a: Q): Q => umn(a, a);

/** Целый корень; бросает, если n — не полный квадрат. */
export function korenTseliy(n: number): number {
  const r = Math.round(Math.sqrt(n));
  if (n < 0 || r * r !== n) throw new Error(`корень из ${n} не извлекается`);
  return r;
}

/** Точный корень из дроби. */
export const koren = (a: Q): Q => q(korenTseliy(a[0]), korenTseliy(a[1]));

/** Запись бланка: «12», «4,8». */
export const zq = (a: Q): string => zapis(a[0], a[1]);

/** Дробь в TeX: десятичной записью, если она конечна, иначе дробью. */
export function tq(a: Q): string {
  if (konechna(a[0], a[1])) return tex(zapis(a[0], a[1]));
  return `${a[0] < 0 ? '-' : ''}\\dfrac{${Math.abs(a[0])}}{${a[1]}}`;
}

/** Целое (или удвоенное k,5) → дробь: polovina — данное хранится удвоенным. */
export const iz = (x: number, polovina = false): Q => q(x, polovina ? 2 : 1);

/* ── Проверка в плавающей точке ───────────────────────────────── */

/**
 * Ответ, посчитанный на координатах, → запись бланка. Ответ №12 —
 * десятичная дробь не длиннее сотых, поэтому округление до
 * десятитысячных его не меняет; если число на круглое не похоже —
 * задача не годится, бросаем.
 */
export function prov(x: number): string {
  const r = Math.round(x * 10000);
  if (!Number.isFinite(x) || Math.abs(x * 10000 - r) > 1e-4 * Math.max(1, Math.abs(r))) {
    throw new Error(`проверка: ${x} — не конечная дробь`);
  }
  return zapis(r, 10000);
}

export type T = readonly [number, number];
export const rasst = (a: T, b: T): number => Math.hypot(a[0] - b[0], a[1] - b[1]);
/** Площадь многоугольника по координатам (формула шнурования). */
export function ploshchadMn(t: readonly T[]): number {
  let s = 0;
  for (let i = 0; i < t.length; i += 1) {
    const a = t[i]!;
    const b = t[(i + 1) % t.length]!;
    s += a[0] * b[1] - a[1] * b[0];
  }
  return Math.abs(s) / 2;
}
/** Площадь по трём сторонам — формула Герона. */
export function geron(a: number, b: number, c: number): number {
  const p = (a + b + c) / 2;
  return Math.sqrt(Math.max(0, p * (p - a) * (p - b) * (p - c)));
}

/* ── Подсказка-вопрос (как в №5) ──────────────────────────────── */

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

/** Число в $…$: «$4{,}5$». */
export const m$ = (a: Q): string => `$${tq(a)}$`;

/* ── Чертёж условия ───────────────────────────────────────────── */

/**
 * Простая проверка разметки: каждый открытый тег закрыт в нужном
 * порядке, кавычки атрибутов парные. Чертёж уходит в браузер через
 * innerHTML — сломанная разметка испортила бы страницу.
 */
export function svgRazbiraetsya(svg: string): boolean {
  if (!svg.startsWith('<svg') || !svg.endsWith('</svg>')) return false;
  const stek: string[] = [];
  const re = /<(\/?)([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"<>]*")*)\s*(\/?)>/g;
  let pos = 0;
  for (let m = re.exec(svg); m !== null; m = re.exec(svg)) {
    if (svg.slice(pos, m.index).includes('<')) return false;
    pos = m.index + m[0].length;
    const [, zakr, imya, , sam] = m;
    if (sam === '/') continue;
    if (zakr === '/') {
      if (stek.pop() !== imya) return false;
    } else stek.push(imya!);
  }
  return stek.length === 0 && !svg.slice(pos).includes('<');
}

/**
 * SVG условия по сцене: числа условия подписаны, искомое — нет.
 * Бросает на сборке, если движку не хватило места для подписи, если
 * разметка не разбирается или на чертеже нет буквы вершины из условия.
 * Ширину задаёт CSS (тренажёр: .trn-risunok), рисунок не крупнее
 * своего размера.
 */
export function chertezh(scena: Scena, bukvy: readonly string[], alt: string): string {
  const R = pustoyOtchet();
  const svg = renderPlan(scena, { chisla: true, alt }, R);
  if (R.problems.length > 0) throw new Error(`чертёж «${alt}»: ${R.problems.join('; ')}`);
  if (!svgRazbiraetsya(svg)) throw new Error(`чертёж «${alt}»: SVG не разбирается`);
  for (const b of bukvy) {
    if (!R.teksty.includes(b) || !svg.includes(`>${b}</text>`)) {
      throw new Error(`чертёж «${alt}»: нет подписи вершины ${b}`);
    }
  }
  return svg.replace(
    / width="([\d.]+)" height="[\d.]+"(.*?) style="max-width:100%;height:auto"/,
    (_, w: string, mezhdu: string) => `${mezhdu} style="width:100%;max-width:${w}px;height:auto"`,
  );
}

/** Число на стороне, уже нарисованной многоугольником (данное). */
export const storona = (a: string, b: string, zn: string): Element => ({
  tip: 'otrezok',
  a,
  b,
  tolkoShtrihi: true,
  vydelit: 'dano',
  znachenie: zn,
});

/** Искомый отрезок: выделен, его число на чертеже не показывается. */
export const iskomyy = (a: string, b: string, zn: string): Element => ({
  tip: 'otrezok',
  a,
  b,
  vydelit: 'iskomoe',
  znachenie: zn,
  otvet: true,
});

/** Где основание перпендикуляра из P на AB: внутри отрезка или за концом. */
export function gdeOsnovanie(p: T, a: T, b: T): 'a' | 'b' | null {
  const t = projT(p, a, b);
  return t < -1e-9 ? 'a' : t > 1 + 1e-9 ? 'b' : null;
}

export const clamp = (x: number, lo: number, hi: number): number => Math.min(Math.max(x, lo), hi);

/** Подпись чертежа для скринридера: название без разметки TeX. */
export const bezTex = (s: string): string =>
  s
    .replace(/\\sqrt\{([^}]*)\}/g, '√$1')
    .replace(/\^\\circ/g, '°')
    .replace(/\\perp/g, '⊥')
    .replace(/\\sim/g, '∼')
    .replace(/[$\\{}]/g, '');

/* ── Прототип из списка наборов чисел ─────────────────────────── */

/** Числа задачи по именам полей данных. */
export type Ch = Readonly<Record<string, number>>;

export interface OpisaniePrototipa {
  id: string;
  gruppa: string;
  title: string;
  /** Наборы чисел аналогов. */
  dannye: readonly (readonly number[])[];
  /** Имена полей набора — по порядку. */
  polya: readonly string[];
  text(c: Ch): string;
  solve(c: Ch, sdvig: number): Resheno;
  proverka(c: Ch): string;
  scena(c: Ch): Scena;
  /** Буквы вершин из условия — все должны быть на чертеже. */
  bukvy(c: Ch): readonly string[];
}

function chisla(p: Params, polya: readonly string[]): Ch {
  const out: Record<string, number> = {};
  for (const k of polya) {
    const v = p[k];
    if (typeof v !== 'number') throw new Error(`нет числа ${k}`);
    out[k] = v;
  }
  return out;
}

export function prototip(o: OpisaniePrototipa): Prototip {
  const n = o.dannye.length;
  for (const row of o.dannye) {
    if (row.length !== o.polya.length) throw new Error(`${o.id}: набор ${row.join(', ')}`);
  }
  return {
    id: o.id,
    gruppa: o.gruppa,
    title: o.title,
    tip: 'chislo',
    zadach: n,
    generate(rng) {
      const i = rng.int(0, n - 1);
      const row = o.dannye[i]!;
      const p: Params = {};
      o.polya.forEach((k, j) => {
        p[k] = row[j]!;
      });
      return p;
    },
    text: (p) => o.text(chisla(p, o.polya)),
    solve(p) {
      const c = chisla(p, o.polya);
      return o.solve(
        c,
        Object.values(c).reduce((s, x) => s + x, 0),
      );
    },
    proverka: (p) => o.proverka(chisla(p, o.polya)),
    risunok(p) {
      const c = chisla(p, o.polya);
      return chertezh(o.scena(c), o.bukvy(c), bezTex(o.title));
    },
  };
}
