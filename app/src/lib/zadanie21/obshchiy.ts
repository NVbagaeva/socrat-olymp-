/**
 * Разбор задач общего вида (прототипы P22 и дальше, prototypes22.ts):
 * многочлены, точки с подписью дробью, две общие схемы решения.
 *
 *   tochkaPoZnakam — точка экстремума: нули производной, знаки на
 *     интервалах, смена знака в нужную сторону;
 *   naOtrezkeObshchiy — наибольшее / наименьшее значение на отрезке:
 *     нули на отрезке, знаки на частях отрезка, кандидаты (концы и
 *     точки экстремума нужного вида), сравнение, значение.
 *
 * Знаки производной считаются по самой производной (функция df), а не
 * пишутся руками: текст разбора не может разойтись с расчётом.
 */

import {
  HINT_CHTO_TOCHKA,
  HINT_CHTO_ZNACH,
  SLOVO_TOCHKI,
  SLOVO_ZNACH,
  otr,
  type Cel,
} from './razbor';
import { podpisChisla, type Shema } from './shema';
import { num, okrugl, otrezokTex, summa } from './tex';
import type { Etap, HintStep, Solved } from './types';

/* ── Точки с подписью ────────────────────────────────────────────── */

/** Точка на прямой: число, запись в TeX и подпись на схеме знаков. */
export interface Tochka {
  x: number;
  tex: string;
  podpis: string;
}

export function nod(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y > 0) [x, y] = [y, x % y];
  return x || 1;
}

/** Знаменатель без множителей, кроме 2 и 5: дробь конечная. */
function konechnaya(q: number): boolean {
  let n = q;
  while (n % 2 === 0) n /= 2;
  while (n % 5 === 0) n /= 5;
  return n === 1;
}

/** Точка p/q: конечная дробь — десятичной записью, иначе обыкновенной («−22/3»). */
export function drobT(p: number, q = 1): Tochka {
  const s = q < 0 ? -1 : 1;
  const g = nod(p, q);
  const pp = (s * p) / g;
  const qq = (s * q) / g;
  const x = okrugl(pp / qq);
  if (konechnaya(qq)) return { x, tex: num(x), podpis: podpisChisla(x) };
  return {
    x,
    tex: `${pp < 0 ? '-' : ''}\\frac{${Math.abs(pp)}}{${qq}}`,
    podpis: `${pp < 0 ? '−' : ''}${Math.abs(pp)}/${qq}`,
  };
}

/** Обыкновенной дробью, если не целое: «\frac{1}{16}», «1/16». */
export function drobObyknovennaya(p: number, q: number): Tochka {
  const g = nod(p, q);
  const a = p / g;
  const b = q / g;
  if (b === 1) return drobT(a);
  return {
    x: a / b,
    tex: `${a < 0 ? '-' : ''}\\frac{${Math.abs(a)}}{${b}}`,
    podpis: `${a < 0 ? '−' : ''}${Math.abs(a)}/${b}`,
  };
}

/** Число → дробь p/q со знаменателем до 12; нет такой — null. */
export function racional(x: number): { p: number; q: number } | null {
  for (let q = 1; q <= 12; q += 1) {
    const p = Math.round(x * q);
    if (Math.abs(x * q - p) < 1e-7 * Math.max(1, Math.abs(x))) return { p, q };
  }
  return null;
}

/** Точка по числу: дробь, если число рациональное с малым знаменателем. */
export function tochkaChisla(x: number): Tochka {
  const r = racional(x);
  if (r === null) throw new Error(`№21: корень ${x} — не дробь`);
  return drobT(r.p, r.q);
}

/** Точка с готовой записью: «−5π/6», «ln 2». */
export const tochkaT = (x: number, tex: string, podpis: string): Tochka => ({ x, tex, podpis });

/* ── Многочлены: коэффициенты c[k] при x^k ───────────────────────── */

export type Poly = readonly number[];

export const pVal = (c: Poly, x: number): number => c.reduceRight((s, a) => s * x + a, 0);

export const pDer = (c: Poly): number[] => c.slice(1).map((a, i) => okrugl(a * (i + 1)));

export function pStepen(c: Poly): number {
  for (let k = c.length - 1; k >= 0; k -= 1) if (okrugl(c[k] ?? 0) !== 0) return k;
  return 0;
}

const telo = (k: number): string => (k === 0 ? '' : k === 1 ? 'x' : `x^${k}`);

/** Многочлен в TeX; por — порядок степеней («12x^2-x^3+3»: [2, 3, 0]). */
export function pTex(c: Poly, por?: readonly number[]): string {
  const poryadok = por ?? Array.from({ length: c.length }, (_, i) => c.length - 1 - i);
  return summa(poryadok.map((k) => [c[k] ?? 0, telo(k)] as const));
}

/**
 * Действительные корни многочлена с кратностью — для производных
 * задания: степень до двух или биквадратный после вынесения x^m.
 */
export function pKorni(c: Poly): { x: number; k: number }[] {
  let p = c.slice(0, pStepen(c) + 1).map(okrugl);
  const out: { x: number; k: number }[] = [];
  let nol = 0;
  while (p.length > 1 && p[0] === 0) {
    nol += 1;
    p = p.slice(1);
  }
  if (nol > 0) out.push({ x: 0, k: nol });
  const dobavit = (x: number) => {
    const x0 = okrugl(x);
    const e = out.find((r) => Math.abs(r.x - x0) < 1e-9);
    if (e) e.k += 1;
    else out.push({ x: x0, k: 1 });
  };
  const kvadr = (a: number, b: number, cc: number): number[] => {
    const D = b * b - 4 * a * cc;
    if (D < -1e-9) return [];
    const s = Math.sqrt(Math.max(0, D));
    return Math.abs(D) < 1e-9
      ? [-b / (2 * a), -b / (2 * a)]
      : [(-b - s) / (2 * a), (-b + s) / (2 * a)];
  };
  const st = p.length - 1;
  if (st === 1) dobavit(-(p[0] as number) / (p[1] as number));
  else if (st === 2)
    for (const x of kvadr(p[2] as number, p[1] as number, p[0] as number)) dobavit(x);
  else if (st === 4 && p[1] === 0 && p[3] === 0) {
    for (const t of kvadr(p[4] as number, p[2] as number, p[0] as number)) {
      if (t < -1e-9) continue;
      if (Math.abs(t) < 1e-9) {
        dobavit(0);
        dobavit(0);
      } else {
        dobavit(-Math.sqrt(t));
        dobavit(Math.sqrt(t));
      }
    }
  } else if (st > 0) throw new Error(`№21: корни многочлена степени ${st} не ищутся`);
  return out.sort((a, b) => a.x - b.x);
}

/** Деление на (x − r): коэффициенты частного. */
function delit(c: number[], r: number): number[] {
  const n = c.length - 1;
  const q = new Array<number>(n).fill(0);
  let acc = 0;
  for (let k = n; k >= 1; k -= 1) {
    acc = acc * r + (c[k] as number);
    q[k - 1] = acc;
  }
  return q;
}

/**
 * Разложение на множители по рациональным корням: «3(x+6)(x+2)»,
 * «(4x-11)(x-3)», «15x^2(x+1)(x-1)», «5(x+2)(x-2)(x^2+1)». Корней нет
 * — сам многочлен.
 */
export function pRazlozhenie(c: Poly): string {
  const st = pStepen(c);
  const korni = pKorni(c);
  let lead = c[st] as number;
  let ost = c.slice(0, st + 1);
  const xs: string[] = [];
  const mnozh: string[] = [];
  for (const { x, k } of korni) {
    for (let j = 0; j < k; j += 1) ost = delit(ost, x);
    const r = racional(x);
    if (r === null) throw new Error(`№21: корень ${x} — не дробь`);
    lead /= r.q ** k;
    const st2 = k > 1 ? `^${k}` : '';
    if (x === 0) xs.push(`x${st2}`);
    else
      mnozh.push(
        `(${summa([
          [r.q, 'x'],
          [-r.p, ''],
        ])})${st2}`,
      );
  }
  const ostSt = ost.length - 1;
  if (ostSt > 0) {
    const lo = ost[ostSt] as number;
    mnozh.push(`(${pTex(ost.map((a) => okrugl(a / lo)))})`);
  }
  lead = okrugl(lead);
  const koef = lead === 1 ? '' : lead === -1 ? '-' : num(lead);
  return `${koef}${xs.join('')}${mnozh.join('')}` || num(lead);
}

/** Значение многочлена в точке по слагаемым: «$y(-1) = -3+5+1 = 3$». */
export function schetPoSlagaemym(t: Tochka, slagaemye: readonly number[], v: number): string {
  const ch = slagaemye.map(okrugl).filter((s) => s !== 0);
  const vse = ch.every((s) => Math.abs(Math.round(s * 1e4) - s * 1e4) < 1e-6);
  const seredina = ch.length > 1 && vse ? ` = ${summa(ch.map((s) => [s, ''] as const))}` : '';
  return `$y(${t.tex})${seredina} = ${num(v)}$.`;
}

/* ── Знаки производной ──────────────────────────────────────────── */

const znak = (v: number): '+' | '-' => (v > 0 ? '+' : '-');

function intervaly(
  granicy: readonly (Tochka | null)[],
  z: readonly ('+' | '-')[],
  skobki: ['(' | '[', ')' | ']'] = ['(', ')'],
): string {
  return z
    .map((s, i) => {
      const l = granicy[i];
      const r = granicy[i + 1];
      const lt = l === null || l === undefined ? '-\\infty' : l.tex;
      const rt = r === null || r === undefined ? '+\\infty' : r.tex;
      const lb = i === 0 ? skobki[0] : '(';
      const rb = i === z.length - 1 ? skobki[1] : ')';
      return `на $${lb}${lt};\\,${rt}${rb}$ $y'${s === '+' ? '>' : '<'}0$`;
    })
    .join(', ');
}

/** Варианты подсказки «где»: верный и до трёх других, место верного — от ответа. */
function variantyT(verno: string, drugie: readonly string[], otvet: number) {
  const opts = [...new Set([verno, ...drugie])].slice(0, 4);
  const mesto = Math.abs(Math.round(otvet * 7)) % opts.length;
  opts.splice(0, 1);
  opts.splice(mesto, 0, verno);
  return { options: opts.map((t) => `$x = ${t}$`), correct: mesto };
}

const strelka = (s: '+' | '-') => (s === '+' ? '+' : '−');

/* ── Точка экстремума ───────────────────────────────────────────── */

export interface TochkaObsh {
  cel: Cel;
  fn: string;
  /** Производная, TeX без «y' =». */
  d: string;
  odz?: string;
  nuli: string[];
  /** Нули производной по возрастанию. */
  korni: Tochka[];
  /** Точки вне области определения (выколотые) — тоже границы знаков. */
  vykoloty?: Tochka[];
  /** Левая граница области определения: «[0;» — закрыта, «(−a;» — открыта. */
  granica?: { t: Tochka; zakryta: boolean };
  df: (x: number) => number;
}

export function tochkaPoZnakam(o: TochkaObsh): Solved {
  const gr = [...o.korni, ...(o.vykoloty ?? [])].sort((a, b) => a.x - b.x);
  const vyk = new Set((o.vykoloty ?? []).map((t) => t.x));
  const first = gr[0] as Tochka;
  const last = gr[gr.length - 1] as Tochka;
  const proby: number[] = [
    o.granica === undefined ? first.x - 1 : (o.granica.t.x + first.x) / 2,
    ...gr.slice(1).map((t, i) => ((gr[i] as Tochka).x + t.x) / 2),
    last.x + 1,
  ];
  const z = proby.map((x) => znak(o.df(x)));
  const iskat = o.cel === 'max' ? ['+', '-'] : ['-', '+'];
  const i = gr.findIndex((t, j) => !vyk.has(t.x) && z[j] === iskat[0] && z[j + 1] === iskat[1]);
  const otvet = gr[i];
  if (otvet === undefined) throw new Error(`№21: нет точки ${o.cel} у ${o.fn}`);
  const answer = okrugl(otvet.x);
  const shema: Shema = {
    tochki: [
      ...(o.granica === undefined
        ? []
        : [
            {
              podpis: o.granica.t.podpis,
              vid: o.granica.zakryta ? ('konec' as const) : ('granica' as const),
            },
          ]),
      ...gr.map((t) => ({
        podpis: t.podpis,
        vid: vyk.has(t.x) ? ('vykolota' as const) : ('krit' as const),
      })),
    ],
    znaki: z,
    luchLevo: o.granica === undefined,
    luchPravo: true,
  };
  const granicy = [o.granica?.t ?? null, ...gr, null];
  const skobki: ['(' | '[', ')'] = [o.granica?.zakryta ? '[' : '(', ')'];
  const etapy: Etap[] = [
    {
      title: 'Шаг 1. Производная',
      lines: [...(o.odz === undefined ? [] : [o.odz]), `$y' = ${o.d}$`],
    },
    { title: 'Шаг 2. Нули производной', lines: o.nuli },
    {
      title: 'Шаг 3. Знаки производной',
      lines: [
        `${intervaly(granicy, z, skobki)}.`,
        `В точке $x = ${otvet.tex}$ производная меняет знак с «${strelka(iskat[0] as '+')}» на «${strelka(iskat[1] as '+')}» — это точка ${SLOVO_TOCHKI[o.cel]}.`,
      ],
      shema,
    },
    { title: 'Ответ', lines: [`$${num(answer)}$`] },
  ];
  const v = variantyT(
    otvet.tex,
    [
      ...o.korni.filter((t) => t !== otvet).map((t) => t.tex),
      num(-answer),
      num(answer + 1),
      num(answer - 1),
    ],
    answer,
  );
  const hints: HintStep[] = [
    HINT_CHTO_TOCHKA,
    {
      question: 'С чего начать?',
      options: ['Найти производную и её нули', 'Подставить $x = 0$', 'Решить уравнение $y = 0$'],
      correct: 0,
      comment: `$y' = ${o.d}$.`,
    },
    {
      question: `Где производная меняет знак с «${strelka(iskat[0] as '+')}» на «${strelka(iskat[1] as '+')}»?`,
      ...v,
    },
  ];
  return { answer, funkciya: o.fn, proizvodnaya: o.d, etapy, hints };
}

/* ── Наибольшее и наименьшее на отрезке ─────────────────────────── */

export interface OtrezokObsh {
  cel: Cel;
  fn: string;
  d: string;
  odz?: string;
  /** Как найдены нули (или почему их нет). */
  nuli: string[];
  lo: Tochka;
  hi: Tochka;
  /** Все найденные нули производной — и вне отрезка тоже. */
  korni: Tochka[];
  f: (x: number) => number;
  df: (x: number) => number;
  /** Точная запись значения в точке, TeX (для сравнения кандидатов). */
  znach?: (t: Tochka) => string | undefined;
  /** Строки подсчёта ответа в точке; нет — просто значение. */
  schet?: (t: Tochka) => string[];
}

const okr6 = (v: number): number => okrugl(Math.round(v * 1e6) / 1e6);

const tselaya = (v: number): boolean => Math.abs(Math.round(v * 100) - v * 100) < 1e-6;

export function naOtrezkeObshchiy(o: OtrezokObsh): Solved {
  const eps = 1e-9 * Math.max(1, Math.abs(o.lo.x), Math.abs(o.hi.x));
  const vnutri = o.korni.filter((t) => t.x > o.lo.x + eps && t.x < o.hi.x - eps);
  const naKonce = o.korni.filter(
    (t) => Math.abs(t.x - o.lo.x) <= eps || Math.abs(t.x - o.hi.x) <= eps,
  );
  const vne = o.korni.filter((t) => !vnutri.includes(t) && !naKonce.includes(t));
  const otrT = `${otrezokTex(o.lo.tex, o.hi.tex)}`;
  const xy = (ts: readonly Tochka[]) => ts.map((t) => `$x = ${t.tex}$`).join(' и ');
  const pro: string[] = [];
  if (vnutri.length > 0)
    pro.push(`Внутри отрезка $${otrT}$ ${vnutri.length === 1 ? 'лежит' : 'лежат'} ${xy(vnutri)}.`);
  else if (o.korni.length > 0) pro.push(`Внутри отрезка $${otrT}$ нулей производной нет.`);
  if (naKonce.length > 0)
    pro.push(`${xy(naKonce)} — ${naKonce.length === 1 ? 'конец' : 'концы'} отрезка.`);
  if (vne.length > 0) pro.push(`${xy(vne)} — вне отрезка.`);

  const tochki = [o.lo, ...vnutri, o.hi];
  const z = tochki.slice(1).map((t, i) => znak(o.df(((tochki[i] as Tochka).x + t.x) / 2)));
  const max = o.cel === 'max';
  const kandidaty: Tochka[] = [];
  if (z[0] === (max ? '-' : '+')) kandidaty.push(o.lo);
  vnutri.forEach((t, i) => {
    if (z[i] === (max ? '+' : '-') && z[i + 1] === (max ? '-' : '+')) kandidaty.push(t);
  });
  if (z[z.length - 1] === (max ? '+' : '-')) kandidaty.push(o.hi);
  const luchshe = (a: number, b: number) => (max ? a > b : a < b);
  let best = kandidaty[0] as Tochka;
  for (const t of kandidaty) if (luchshe(o.f(t.x), o.f(best.x))) best = t;
  const answer = okr6(o.f(best.x));

  const vybor: string[] = [`${intervaly(tochki, z, ['[', ']'])}.`];
  const Slovo = max ? 'Наибольшее' : 'Наименьшее';
  if (vnutri.length === 0 || (z.every((s) => s === z[0]) && kandidaty.length === 1)) {
    vybor.push(
      `Функция ${z[0] === '+' ? 'возрастает' : 'убывает'} на всём отрезке: ${SLOVO_ZNACH[o.cel]} значение — на ${best === o.lo ? 'левом' : 'правом'} конце, в точке $x = ${best.tex}$.`,
    );
  } else if (kandidaty.length === 1) {
    vybor.push(
      `В точке $x = ${best.tex}$ производная меняет знак с «${max ? '+' : '−'}» на «${max ? '−' : '+'}»: левее функция ${max ? 'возрастает' : 'убывает'}, правее ${max ? 'убывает' : 'возрастает'}. Это единственная точка ${SLOVO_TOCHKI[o.cel]} на отрезке — в ней ${SLOVO_ZNACH[o.cel]} значение.`,
    );
  } else {
    const zap = (t: Tochka) => {
      const v = o.f(t.x);
      const tochno = o.znach?.(t);
      const pribl = tselaya(okr6(v)) ? num(okr6(v)) : `\\approx ${num(Math.round(v * 100) / 100)}`;
      return `$y(${t.tex}) = ${tochno === undefined ? pribl : tselaya(okr6(v)) ? tochno : `${tochno} ${pribl}`}$`;
    };
    vybor.push(
      `${Slovo} значение — в точке ${SLOVO_TOCHKI[o.cel]} или на конце отрезка, куда функция ${max ? 'растёт' : 'убывает'}. Сравним: ${kandidaty.map(zap).join(', ')}. ${max ? 'Больше' : 'Меньше'} — в точке $x = ${best.tex}$.`,
    );
  }

  const etapy: Etap[] = [
    {
      title: 'Шаг 1. Производная',
      lines: [...(o.odz === undefined ? [] : [o.odz]), `$y' = ${o.d}$`],
    },
    { title: 'Шаг 2. Нули производной на отрезке', lines: [...o.nuli, ...pro] },
    {
      title: `Шаг 3. Где ${SLOVO_ZNACH[o.cel]} значение`,
      lines: vybor,
      shema: otr(
        o.lo.podpis,
        vnutri.map((t) => t.podpis),
        o.hi.podpis,
        z,
      ),
    },
    { title: 'Шаг 4. Значение', lines: o.schet?.(best) ?? [`$y(${best.tex}) = ${num(answer)}$.`] },
    { title: 'Ответ', lines: [`$${num(answer)}$`] },
  ];
  const v = variantyT(
    best.tex,
    [o.lo.tex, o.hi.tex, ...o.korni.map((t) => t.tex), num(-best.x)],
    answer * 3,
  );
  const hints: HintStep[] = [
    HINT_CHTO_ZNACH,
    {
      question: 'С чего начать?',
      options: [
        'Найти производную и её нули на отрезке',
        'Сразу подставить концы отрезка',
        'Решить уравнение $y = 0$',
      ],
      correct: 0,
      comment: `$y' = ${o.d}$.`,
    },
    {
      question: `В какой точке отрезка функция принимает ${SLOVO_ZNACH[o.cel]} значение?`,
      ...v,
    },
  ];
  return { answer, funkciya: o.fn, proizvodnaya: o.d, etapy, hints };
}
