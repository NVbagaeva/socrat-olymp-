/**
 * Квадратные уравнения по теореме Виета: приведённое, «сначала
 * раздели на a», сумма коэффициентов и метод переброски.
 *
 * Данные примера — коэффициенты [a, b, c] (целые). У примера два
 * ответа — корни (Primer.otvety, по возрастанию); в режиме «Как в ЕГЭ»
 * (вариант 'men' или 'bol') ответ один — меньший или больший корень.
 * Primer.otvet всегда есть: меньший корень или тот, что просит ЕГЭ, а
 * Primer.expr считает его по формуле корней — так проверка
 * (scripts/check-ustnyy-schet.mjs) пересчитывает ответ независимо.
 *
 * Корни — целые или конечные десятичные дроби: генераторы подбирают
 * корни, а коэффициенты собирают из них.
 */

import { chisloTex, cmp, dec, div, str, vychislit } from '../chislo';
import { sk } from '../primer';
import type { Rng } from '../rng';
import type { GenOpts, Primer, Priyom, PriyomId, Shag, Uroven, Zveno } from '../types';

/** Режим «Как в ЕГЭ»: в ответ — меньший или больший корень. */
export type EgeKoren = 'men' | 'bol';

export const VIETA_IDS = [
  'vieta-privedennoe',
  'vieta-delim-na-a',
  'vieta-summa-koefficientov',
  'vieta-perebroska',
] as const satisfies readonly PriyomId[];

export type VietaId = (typeof VIETA_IDS)[number];

export function estVieta(id: PriyomId): id is VietaId {
  return (VIETA_IDS as readonly string[]).includes(id);
}

/* ── Запись уравнения ───────────────────────────────────────── */

type Koef = readonly [number, number, number];

function chleny(k: Koef, v: string, kv: string, minus: string): string {
  const [a, b, c] = k;
  const parts: [number, string][] = [
    [a, kv],
    [b, v],
    [c, ''],
  ];
  let out = '';
  for (const [n, x] of parts) {
    if (n === 0) continue;
    const abs = Math.abs(n);
    const coef = abs === 1 && x !== '' ? '' : String(abs);
    if (out === '') out = `${n < 0 ? minus : ''}${coef}${x}`;
    else out += ` ${n < 0 ? minus : '+'} ${coef}${x}`;
  }
  return out;
}

/** Уравнение в TeX стандартного вида: «x^2 - 7x + 12 = 0», без «+ −», «1x», «+ 0». */
export function uravnenieTex(a: number, b: number, c: number, v = 'x'): string {
  return `${chleny([a, b, c], v, `${v}^2`, '-')} = 0`;
}

/** То же текстом: «x² − 7x + 12 = 0». */
export function uravnenieText(a: number, b: number, c: number, v = 'x'): string {
  return `${chleny([a, b, c], v, `${v}²`, '−')} = 0`;
}

/* ── Корни ──────────────────────────────────────────────────── */

function isqrt(n: number): number {
  const r = Math.round(Math.sqrt(n));
  if (n < 0 || r * r !== n) throw new Error(`vieta: дискриминант ${n} — не точный квадрат`);
  return r;
}

/** Корни по возрастанию, нормальной записью; равные — дважды. */
export function korni(a: number, b: number, c: number): [string, string] {
  const s = isqrt(b * b - 4 * a * c);
  const r1 = div(dec(-b - s), dec(2 * a));
  const r2 = div(dec(-b + s), dec(2 * a));
  return cmp(r1, r2) <= 0 ? [str(r1), str(r2)] : [str(r2), str(r1)];
}

/** Выражение, равное корню x, по формуле корней (для независимой проверки). */
function formulaKornya(a: number, b: number, c: number, x: string): string {
  const D = b * b - 4 * a * c;
  for (const z of ['-', '+']) {
    const e = `(${-b}${z}sqrt(${D}))/${sk(2 * a)}`;
    if (str(vychislit(e)) === x) return e;
  }
  throw new Error('vieta: корень не по формуле');
}

/** Конечная ли дробь p / q (q ≠ 0). */
function konechnaya(p: number, q: number): boolean {
  try {
    div(dec(p), dec(q));
    return true;
  } catch {
    return false;
  }
}

const tx = (s: string): string => chisloTex(s);

/* ── Пример ─────────────────────────────────────────────────── */

function vietaPrimer(id: VietaId, uroven: Uroven, d: readonly string[], v?: string): Primer {
  const [a = 1, b = 0, c = 0] = d.map(Number);
  const [x1, x2] = korni(a, b, c);
  const ege = v === 'men' || v === 'bol';
  const otvet = v === 'bol' ? x2 : x1;
  return {
    key: `${id}|${a},${b},${c}`,
    priyom: id,
    uroven,
    deystvie: 'uravneniya',
    d: [String(a), String(b), String(c)],
    ...(ege ? { v } : {}),
    expr: formulaKornya(a, b, c, otvet),
    tex: uravnenieTex(a, b, c),
    text: uravnenieText(a, b, c),
    otvet,
    ...(ege ? {} : { otvety: [x1, x2] }),
  };
}

/* ── Разбор ─────────────────────────────────────────────────── */

/** a·x² + b·x + c при подстановке x — выражение для цепочки «… = 0». */
export function podstanovka(a: number, b: number, c: number, x: string): string {
  const X = sk(x);
  let e = a === 1 ? `${X}^2` : a === -1 ? `-${X}^2` : `${a}*${X}^2`;
  if (b !== 0) e += `${b < 0 ? '-' : '+'}${Math.abs(b) === 1 ? X : `${Math.abs(b)}*${X}`}`;
  if (c !== 0) e += `${c < 0 ? '-' : '+'}${Math.abs(c)}`;
  return e;
}

function proverka(a: number, b: number, c: number, x1: string, x2: string): Shag[] {
  const out: Shag[] = [
    {
      tekst: x1 === x2 ? 'Проверка подстановкой:' : 'Проверка подстановкой — оба корня:',
      cep: [podstanovka(a, b, c, x1), '0'],
    },
  ];
  if (x1 !== x2) out.push({ cep: [podstanovka(a, b, c, x2), '0'] });
  return out;
}

/** Правило знаков: что говорит c о знаках корней приведённого уравнения. */
export function praviloZnakov(C: number): 'odin' | 'raznye' {
  return C > 0 ? 'odin' : 'raznye';
}

/** Шаги Виета для приведённого y² + By + C = 0 с целыми корнями r1 ≤ r2. */
function shagiPrivedennogo(B: number, C: number, r1: string, r2: string, v: string): Shag[] {
  const S = String(-B);
  const P = String(C);
  const znak = Number(S) > 0;
  const pravilo =
    praviloZnakov(C) === 'odin'
      ? `$c > 0$ — корни одного знака, знак как у $-b$: оба ${znak ? 'положительные' : 'отрицательные'}.`
      : `$c < 0$ — знаки разные, больший по модулю корень со знаком $-b$: он ${znak ? 'положительный' : 'отрицательный'}.`;
  const podbor =
    r1 === r2
      ? `Подходит одно число дважды: $${v}_1 = ${v}_2 = ${tx(r1)}$ — корень один.`
      : `Подбираем: $${v}_1 = ${tx(r1)}$, $${v}_2 = ${tx(r2)}$.`;
  return [
    {
      tekst: `Ищем два числа: сумма равна $-b = ${tx(S)}$, произведение равно $c = ${tx(P)}$.`,
      cep: [`-(${B})`, S],
    },
    { tekst: pravilo, cep: [] },
    { tekst: podbor, cep: [`${sk(r1)}+${sk(r2)}`, S] },
    { cep: [`${sk(r1)}*${sk(r2)}`, P] },
  ];
}

/** Последний шаг режима «Как в ЕГЭ»: какой корень в ответ. */
function egeShag(p: Primer, x1: string, x2: string): Shag[] {
  if (p.v !== 'men' && p.v !== 'bol') return [];
  const fn = p.v === 'men' ? '\\min' : '\\max';
  const z: Zveno = { e: p.otvet, tex: `${fn}(${tx(x1)};\\,${tx(x2)})` };
  return [
    {
      tekst: p.v === 'men' ? 'В ответ — меньший корень.' : 'В ответ — больший корень.',
      cep: [z, p.otvet],
    },
  ];
}

const koef = (p: Primer): [number, number, number] => {
  const [a = 1, b = 0, c = 0] = p.d.map(Number);
  return [a, b, c];
};

/* ── Подбор чисел ───────────────────────────────────────────── */

function nenul(rng: Rng, lo: number, hi: number): number {
  for (;;) {
    const x = rng.int(lo, hi);
    if (x !== 0) return x;
  }
}

/** Пара корней r1, r2 (целые) по правилу уровня; null — не вышло. */
function paraKorney(rng: Rng, uroven: Uroven, predel: number): [number, number] {
  for (let i = 0; i < 200; i += 1) {
    let x: number;
    let y: number;
    if (uroven === 1) {
      x = rng.int(1, Math.min(10, predel));
      y = rng.int(1, Math.min(10, predel));
      if (x === y) continue;
    } else if (uroven === 2) {
      x = rng.int(1, predel);
      y = -rng.int(1, predel);
      if (rng.chance(0.5)) [x, y] = [y, x];
    } else {
      const r = rng.next();
      if (r < 0.12) {
        x = nenul(rng, -Math.min(15, predel), Math.min(15, predel));
        if (Math.abs(x) < 2) continue;
        y = x;
        return [x, y];
      }
      if (r < 0.56) {
        x = -rng.int(1, predel);
        y = -rng.int(1, predel);
      } else {
        x = nenul(rng, -predel, predel);
        y = nenul(rng, -predel, predel);
        if (Math.max(Math.abs(x), Math.abs(y)) <= 10) continue;
      }
      if (x === y) continue;
    }
    if (x + y === 0) continue;
    return [x, y];
  }
  return [2, 3];
}

/* ── Приёмы ─────────────────────────────────────────────────── */

const PREDEL: Record<Uroven, number> = { 1: 10, 2: 15, 3: 25 };

export const vietaPrivedennoe: Priyom = {
  id: 'vieta-privedennoe',
  gruppa: 'uravneniya',
  deystvie: 'uravneniya',
  deystviya: ['uravneniya'],
  sozdat(rng, o: GenOpts) {
    const [x, y] = paraKorney(rng, o.uroven, PREDEL[o.uroven]);
    return this.iz(['1', String(-(x + y)), String(x * y)], o.uroven, o.ege);
  },
  iz(d, uroven, v) {
    return vietaPrimer('vieta-privedennoe', uroven, d, v);
  },
  razbor(p) {
    const [a, b, c] = koef(p);
    const [x1, x2] = korni(a, b, c);
    return [
      { tekst: 'Уравнение приведённое: $a = 1$.', cep: [] },
      ...shagiPrivedennogo(b, c, x1, x2, 'x'),
      ...proverka(a, b, c, x1, x2),
      ...egeShag(p, x1, x2),
    ];
  },
};

const A_DELIM = [2, 3, 4, 5, -1, -2] as const;

export const vietaDelimNaA: Priyom = {
  id: 'vieta-delim-na-a',
  gruppa: 'uravneniya',
  deystvie: 'uravneniya',
  deystviya: ['uravneniya'],
  sozdat(rng, o) {
    const a = o.uroven === 1 ? rng.pick([2, 3, 4, 5]) : rng.pick(A_DELIM);
    const [x, y] =
      o.uroven === 1
        ? paraKorney(rng, 1, 9)
        : o.uroven === 2
          ? (() => {
              for (;;) {
                const p = [nenul(rng, -10, 10), nenul(rng, -10, 10)] as const;
                if (p[0] !== p[1] && p[0] + p[1] !== 0) return p;
              }
            })()
          : (() => {
              for (;;) {
                const u = nenul(rng, -15, 15);
                const w = rng.chance(0.1) ? u : nenul(rng, -15, 15);
                if (u + w !== 0 && Math.max(Math.abs(u), Math.abs(w)) > 5) return [u, w] as const;
              }
            })();
    return this.iz([String(a), String(-a * (x + y)), String(a * x * y)], o.uroven, o.ege);
  },
  iz(d, uroven, v) {
    return vietaPrimer('vieta-delim-na-a', uroven, d, v);
  },
  razbor(p) {
    const [a, b, c] = koef(p);
    const [x1, x2] = korni(a, b, c);
    const B = b / a;
    const C = c / a;
    return [
      {
        tekst: `$a = ${a} \\ne 1$ — делим обе части уравнения на $${a}$: сначала $b$,`,
        cep: [`${sk(b)}/${sk(a)}`, String(B)],
      },
      { tekst: 'потом $c$:', cep: [`${sk(c)}/${sk(a)}`, String(C)] },
      { tekst: `Получилось приведённое уравнение $${uravnenieTex(1, B, C)}$.`, cep: [] },
      ...shagiPrivedennogo(B, C, x1, x2, 'x'),
      ...proverka(a, b, c, x1, x2),
      ...egeShag(p, x1, x2),
    ];
  },
};

/** a и c для «суммы коэффициентов»: второй корень ±c/a — целый или конечная дробь. */
function acDlyaSummy(rng: Rng, uroven: Uroven, desyatichnye: boolean): [number, number] | null {
  const drobnyy = desyatichnye && uroven > 1 && rng.chance(0.6);
  for (let i = 0; i < 300; i += 1) {
    let a: number;
    let c: number;
    if (drobnyy) {
      /* У 3, 7 и 9 дробь c/a не бывает конечной, если не целая; у 8 — три знака. */
      a = rng.pick([2, 4, 5, 6]);
      c = nenul(rng, -45, 45);
      if (c % a === 0 || !konechnaya(c, a)) continue;
    } else {
      a = rng.int(2, 9);
      c = a * (uroven === 1 ? rng.int(2, 9) : nenul(rng, -9, 9));
    }
    if (uroven === 1 && c < 0) continue;
    if (c === a || c === -a || c === 0) continue;
    return [a, c];
  }
  return null;
}

export const vietaSummaKoefficientov: Priyom = {
  id: 'vieta-summa-koefficientov',
  gruppa: 'uravneniya',
  deystvie: 'uravneniya',
  deystviya: ['uravneniya'],
  desyatichnye: [2, 3],
  sozdat(rng, o) {
    const ac = acDlyaSummy(rng, o.uroven, o.desyatichnye);
    if (ac === null) return null;
    const [a, c] = ac;
    const minus = o.uroven === 3 && rng.chance(0.5);
    /* a + b + c = 0 → b = −(a + c); a − b + c = 0 → b = a + c. */
    const b = minus ? a + c : -(a + c);
    return this.iz([String(a), String(b), String(c)], o.uroven, o.ege);
  },
  iz(d, uroven, v) {
    return vietaPrimer('vieta-summa-koefficientov', uroven, d, v);
  },
  razbor(p) {
    const [a, b, c] = koef(p);
    const [x1, x2] = korni(a, b, c);
    const plus = a + b + c === 0;
    const drugoy = str(div(dec(plus ? c : -c), dec(a)));
    return [
      plus
        ? {
            tekst: 'Сумма коэффициентов $a + b + c = 0$ — значит, $x_1 = 1$.',
            cep: [`${a}+${sk(b)}+${sk(c)}`, '0'],
          }
        : {
            tekst: 'Здесь $a - b + c = 0$ — значит, $x_1 = -1$.',
            cep: [`${a}-${sk(b)}+${sk(c)}`, '0'],
          },
      plus
        ? {
            tekst:
              'Второй корень — из произведения: $x_1 x_2 = \\frac{c}{a}$ и $x_1 = 1$, поэтому $x_2 = \\frac{c}{a}$.',
            cep: [`${sk(c)}/${a}`, drugoy],
          }
        : {
            tekst:
              'Второй корень — из произведения: $x_1 x_2 = \\frac{c}{a}$ и $x_1 = -1$, поэтому $x_2 = -\\frac{c}{a}$.',
            cep: [`-${sk(c)}/${a}`, drugoy],
          },
      ...proverka(a, b, c, x1, x2),
      ...egeShag(p, x1, x2),
    ];
  },
};

const A_PEREBROSKA = [2, 4, 5] as const;

function gcd(x: number, y: number): number {
  let p = Math.abs(x);
  let q = Math.abs(y);
  while (q !== 0) [p, q] = [q, p % q];
  return p;
}

export const vietaPerebroska: Priyom = {
  id: 'vieta-perebroska',
  gruppa: 'uravneniya',
  deystvie: 'uravneniya',
  deystviya: ['uravneniya'],
  desyatichnye: [1, 2, 3],
  sozdat(rng, o) {
    for (let i = 0; i < 400; i += 1) {
      const a = o.uroven === 1 ? 2 : rng.pick(A_PEREBROSKA);
      const lim = o.uroven === 1 ? 12 : o.uroven === 2 ? 15 : 30;
      let y1: number;
      let y2: number;
      if (o.uroven === 1) {
        y1 = rng.int(1, lim);
        y2 = rng.int(1, lim);
      } else {
        y1 = nenul(rng, -lim, lim);
        y2 = nenul(rng, -lim, lim);
      }
      if (y1 === y2 && !(o.uroven === 3 && rng.chance(0.3))) continue;
      if (y1 + y2 === 0 || (y1 * y2) % a !== 0) continue;
      const celye = y1 % a === 0 && y2 % a === 0;
      if (o.desyatichnye === celye) continue;
      const b = -(y1 + y2);
      const c = (y1 * y2) / a;
      if (o.desyatichnye && gcd(gcd(a, b), c) !== 1) continue;
      return this.iz([String(a), String(b), String(c)], o.uroven, o.ege);
    }
    return null;
  },
  iz(d, uroven, v) {
    return vietaPrimer('vieta-perebroska', uroven, d, v);
  },
  razbor(p) {
    const [a, b, c] = koef(p);
    const [x1, x2] = korni(a, b, c);
    const ac = a * c;
    const [y1, y2] = korni(1, b, ac);
    const obratno: Shag[] = [
      { tekst: `Возвращаемся к $x$: $x = y : ${a}$.`, cep: [`${sk(y1)}/${a}`, x1] },
    ];
    if (y1 !== y2) obratno.push({ cep: [`${sk(y2)}/${a}`, x2] });
    return [
      {
        tekst: `Перебрасываем $a = ${a}$ к свободному члену: решаем $${uravnenieTex(1, b, ac, 'y')}$, где $y = ${a}x$, а свободный член — $ac$:`,
        cep: [`${a}*${sk(c)}`, String(ac)],
      },
      ...shagiPrivedennogo(b, ac, y1, y2, 'y'),
      ...obratno,
      ...proverka(a, b, c, x1, x2),
      ...egeShag(p, x1, x2),
    ];
  },
};

export const VIETA: readonly Priyom[] = [
  vietaPrivedennoe,
  vietaDelimNaA,
  vietaSummaKoefficientov,
  vietaPerebroska,
];
