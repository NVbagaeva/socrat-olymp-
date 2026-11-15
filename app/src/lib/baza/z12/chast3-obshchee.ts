/**
 * База №12, часть 3 (задачи 243–463): общие помощники прототипов.
 *
 * Числа задач — из таблиц аналогов (chast3-dannye.ts): прототип берёт
 * строку и строит по ней условие, разбор и чертёж. Длины и
 * тригонометрия считаются точно — в дробях из целых: квадраты сторон
 * целые или дробные, корень извлекается только нацело, иначе задача
 * в банк не попадёт (бросается ошибка). Независимая проверка — по
 * координатам вершин в плавающей точке.
 */

import { renderPlan, pustoyOtchet } from '@/lib/planimetriya/render';
import type { Scena } from '@/lib/planimetriya/types';
import { konechna, nod, tex, zapis } from '../chisla';
import type { HintStep, Params, Prototip, Resheno } from '../types';
import { DANNYE_12_3 } from './chast3-dannye';

/* ── Параметры ───────────────────────────────────────────────── */

export const num = (p: Params, key: string): number => {
  const v = p[key];
  if (typeof v !== 'number') throw new Error(`нет числа ${key}`);
  return v;
};

/**
 * Таблица аналогов прототипа: строки [номер задачника, номер аналога,
 * …числа]. generate берёт случайную строку и раскладывает числа по
 * именам полей; sverka — те же параметры с номером задачи для сверки
 * с ключом.
 */
export function tablica(id: string, polya: readonly string[]) {
  const stroki = DANNYE_12_3[id];
  if (stroki === undefined) throw new Error(`нет данных ${id}`);
  const params = (r: readonly number[]): Params =>
    Object.fromEntries(polya.map((f, i) => [f, r[i + 2] ?? NaN]));
  return {
    zadach: stroki.length,
    generate: (rng: { int(a: number, b: number): number }): Params => {
      const r = stroki[rng.int(0, stroki.length - 1)];
      if (r === undefined) throw new Error(`${id}: нет строки`);
      return params(r);
    },
    sverka: stroki.map((r) => ({ nomer: `${r[0]}.${r[1]}`, params: params(r) })),
  };
}

/* ── Точные дроби ────────────────────────────────────────────── */

/** Дробь [числитель, знаменатель], знаменатель > 0, несократимая. */
export type Q = readonly [number, number];

export function q(a: number, b = 1): Q {
  if (!Number.isInteger(a) || !Number.isInteger(b) || b === 0) {
    throw new Error(`не дробь ${a}/${b}`);
  }
  const d = nod(a, b) || 1;
  const s = b < 0 ? -1 : 1;
  return [(s * a) / d, (s * b) / d];
}
export const qAdd = (x: Q, y: Q): Q => q(x[0] * y[1] + y[0] * x[1], x[1] * y[1]);
export const qSub = (x: Q, y: Q): Q => q(x[0] * y[1] - y[0] * x[1], x[1] * y[1]);
export const qMul = (x: Q, y: Q): Q => q(x[0] * y[0], x[1] * y[1]);
export const qDiv = (x: Q, y: Q): Q => q(x[0] * y[1], x[1] * y[0]);
export const qKv = (x: Q): Q => qMul(x, x);

function korenTseliy(n: number): number | null {
  if (n < 0) return null;
  const r = Math.round(Math.sqrt(n));
  return r * r === n ? r : null;
}

/** Точный корень из дроби; бросает, если он не рационален. */
export function qKoren(x: Q): Q {
  const a = korenTseliy(x[0]);
  const b = korenTseliy(x[1]);
  if (a === null || b === null) throw new Error(`корень из ${x[0]}/${x[1]} не извлекается`);
  return q(a, b);
}

/** Запись бланка дроби (конечная десятичная). */
export const qZapis = (x: Q): string => zapis(x[0], x[1]);

/** Дробь в TeX: десятичной записью, если она конечна, иначе \dfrac. */
export function qTex(x: Q): string {
  if (x[1] === 1) return String(x[0]);
  if (konechna(x[0], x[1])) return tex(zapis(x[0], x[1]));
  return `\\dfrac{${x[0]}}{${x[1]}}`;
}

/** Обыкновенная дробь в TeX как есть: \dfrac{p}{q} (или целое). */
export const drob = (p: number, d: number): string => (d === 1 ? String(p) : `\\dfrac{${p}}{${d}}`);

/** Дробь из условия: обыкновенная или десятичная, как в задаче. */
export const drobUsloviya = (p: number, d: number, dec: number): string =>
  dec === 1 ? tex(zapis(p, d)) : drob(p, d);

/* ── Корни ───────────────────────────────────────────────────── */

/** √n = k√m, m свободно от квадратов. */
export function vynesti(n: number): [number, number] {
  let k = 1;
  let m = n;
  for (let d = 2; d * d <= m; d += 1) {
    while (m % (d * d) === 0) {
      m /= d * d;
      k *= d;
    }
  }
  return [k, m];
}

/** k√m в TeX: «7», «\sqrt{91}», «2\sqrt{15}». */
export function kor(k: number, m: number): string {
  if (m === 1) return String(k);
  return `${k === 1 ? '' : k}\\sqrt{${m}}`;
}

/** k√m для подписи на чертеже: «2√15». */
export function korChertezh(k: number, m: number): string {
  if (m === 1) return String(k);
  return `${k === 1 ? '' : k}√${m}`;
}

/** Квадрат k√m в TeX: «(2\sqrt{15})^2», «7^2». */
export const korKv = (k: number, m: number): string =>
  m === 1 ? `${k}^2` : k === 1 ? `(\\sqrt{${m}})^2` : `(${k}\\sqrt{${m}})^2`;

/** √x для дроби x: точный корень, если есть, иначе k√m (для целого x). */
export function korenTex(x: Q): string {
  const a = korenTseliy(x[0]);
  const b = korenTseliy(x[1]);
  if (a !== null && b !== null) return qTex(q(a, b));
  if (x[1] === 1) {
    const [k, m] = vynesti(x[0]);
    return kor(k, m);
  }
  return `\\sqrt{${qTex(x)}}`;
}

/* ── Проверка через плавающую точку ──────────────────────────── */

/** Число из координат → запись бланка; не конечная дробь — «?». */
export function izFloat(x: number): string {
  const r = Math.round(x * 10000) / 10000;
  if (!Number.isFinite(x) || Math.abs(x - r) > 1e-7) return `?${x}`;
  const s = String(r).replace('.', ',');
  return s.startsWith('-') ? `−${s.slice(1)}` : s;
}

export type T = readonly [number, number];
export const rasst = (a: T, b: T): number => Math.hypot(a[0] - b[0], a[1] - b[1]);
/** Угол APB в градусах по координатам. */
export function ugolMezhdu(a: T, p: T, b: T): number {
  const u = [a[0] - p[0], a[1] - p[1]];
  const v = [b[0] - p[0], b[1] - p[1]];
  const c = (u[0]! * v[0]! + u[1]! * v[1]!) / (Math.hypot(u[0]!, u[1]!) * Math.hypot(v[0]!, v[1]!));
  return (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
}
/** Площадь треугольника по координатам. */
export const ploshchadTr = (a: T, b: T, c: T): number =>
  Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2;
export const RAD = Math.PI / 180;

/* ── Подсказки ───────────────────────────────────────────────── */

/**
 * Подсказка-вопрос: верный вариант и отвлекающие (типичные ошибки).
 * Повторы убираются, место верного зависит от sdvig.
 */
export function vopros(
  question: string,
  verno: string,
  drugie: string[],
  sdvig: number,
  comment?: string,
): HintStep {
  const prochie = [...new Set(drugie)].filter((d) => d !== verno).slice(0, 2);
  if (prochie.length === 0) throw new Error(`подсказка без отвлекающих: ${question}`);
  const mesto = Math.abs(Math.round(sdvig)) % (prochie.length + 1);
  const options = [...prochie.slice(0, mesto), verno, ...prochie.slice(mesto)];
  return { question, options, correct: mesto, ...(comment === undefined ? {} : { comment }) };
}

/** Число в $…$ для вариантов подсказки. */
export const v$ = (s: string | number): string => `$${s}$`;

/* ── Чертёж ──────────────────────────────────────────────────── */

/** Порог угла на чертеже: меньший угол рисуется схематично. */
export const POROG_UGLA = 14;

export const zazhat = (x: number, lo: number, hi: number): number => Math.min(Math.max(x, lo), hi);

/** SVG условия по сцене: числа условия на чертеже, как в тренажёре профиля. */
export function narisovat(s: Scena, alt: string): string {
  return renderPlan(s, { chisla: true, alt });
}

/** Отчёт движка о чертеже (для проверки: налезания, вырожденность). */
export function otchetChertezha(s: Scena): string[] {
  const o = pustoyOtchet();
  renderPlan(s, { chisla: true }, o);
  return o.problems;
}

/** Буквы точек из условия: латинские заглавные вне команд TeX. */
export function bukvyUsloviya(text: string): string[] {
  const bez = text.replace(/\\[a-zA-Z]+/g, ' ');
  return [...new Set(bez.match(/[A-Z]/g) ?? [])].sort();
}

/**
 * Проверка SVG чертежа: разметка разбирается (теги закрыты по
 * порядку), есть viewBox, и каждая буква из условия подписана на
 * чертеже. Возвращает список нарушений (пустой — всё в порядке).
 */
export function proveritSvg(svg: string, bukvy: readonly string[]): string[] {
  const out: string[] = [];
  if (!svg.startsWith('<svg') || !svg.endsWith('</svg>')) out.push('не SVG');
  if (!/viewBox="[^"]+"/.test(svg)) out.push('нет viewBox');
  if (/(href|src)="(https?:)?\/\//.test(svg)) out.push('внешний ресурс');
  const stek: string[] = [];
  const teg = /<(\/?)([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^'">])*?)(\/?)>/g;
  for (const m of svg.matchAll(teg)) {
    const [, zakr, imya, , sam] = m;
    if (imya === undefined) continue;
    if (zakr === '/') {
      if (stek.pop() !== imya) {
        out.push(`тег </${imya}> не по порядку`);
        break;
      }
    } else if (sam !== '/') stek.push(imya);
  }
  if (stek.length > 0) out.push(`не закрыты теги: ${stek.join(', ')}`);
  const podpisi = new Set(
    [...svg.matchAll(/<text[^>]*class="pl-bukva"[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]),
  );
  for (const b of bukvy) if (!podpisi.has(b)) out.push(`нет подписи ${b}`);
  return out;
}

/** Чертёж с проверкой: SVG битый или без буквы из условия — ошибка сборки. */
export function risunokSProverkoy(s: Scena, alt: string, bukvy: readonly string[]): string {
  const svg = narisovat(s, alt);
  const oshibki = proveritSvg(svg, bukvy);
  if (oshibki.length > 0) throw new Error(`чертёж «${alt}»: ${oshibki.join('; ')}`);
  return svg;
}

/* ── Сборка прототипа ────────────────────────────────────────── */

export interface OpisaniePrototipa {
  id: string;
  gruppa: string;
  title: string;
  /** Имена чисел строки таблицы (после номера задачи и аналога). */
  polya: readonly string[];
  text(p: Params): string;
  solve(p: Params): Resheno;
  proverka(p: Params): string;
  /** Сцена чертежа по числам условия. */
  scena(p: Params): Scena;
  /** Подпись чертежа для скринридера. */
  alt: string;
}

export type PrototipChasti3 = Prototip & {
  /** Аналоги прототипа с номером «задача.аналог» — для сверки с ключом. */
  sverka: { nomer: string; params: Params }[];
  scena(p: Params): Scena;
};

export function sobrat(o: OpisaniePrototipa): PrototipChasti3 {
  const t = tablica(o.id, o.polya);
  return {
    id: o.id,
    gruppa: o.gruppa,
    title: o.title,
    tip: 'chislo',
    zadach: t.zadach,
    generate: t.generate,
    text: o.text,
    solve: o.solve,
    proverka: o.proverka,
    risunok: (p) => risunokSProverkoy(o.scena(p), o.alt, bukvyUsloviya(o.text(p))),
    sverka: t.sverka,
    scena: o.scena,
  };
}
