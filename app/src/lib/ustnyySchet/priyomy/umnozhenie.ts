/**
 * Умножение: разность квадратов, «десятки одинаковые, единицы до 10»,
 * около 100, на 11, на 5/25/50/125, округление, разложение,
 * группировка, десятичные дроби.
 */

import { klyuchPerestanovki, sdelat, sk, znach } from '../primer';
import type { Rng } from '../rng';
import type { Priyom, Shag, Uroven } from '../types';

const num = (s: string | undefined): number => Number(s ?? '0');

/** Произведение двух чисел в случайном порядке. */
function para(rng: Rng | null, a: string | number, b: string | number): [string, string] {
  return rng !== null && rng.chance(0.5) ? [String(b), String(a)] : [String(a), String(b)];
}

function proizv(
  id: Priyom['id'],
  uroven: Uroven,
  d: readonly string[],
  v?: string,
  extra: { tex?: string; text?: string } = {},
) {
  return sdelat({
    priyom: id,
    uroven,
    deystvie: 'umnozhenie',
    d,
    ...(v === undefined ? {} : { v }),
    expr: d.map(sk).join('*'),
    key: klyuchPerestanovki(id, '*', d),
    ...extra,
  });
}

/* ── Разность квадратов ─────────────────────────────────────── */

export const raznostKvadratov: Priyom = {
  id: 'raznost-kvadratov',
  gruppa: 'umnozhenie',
  deystvie: 'umnozhenie',
  deystviya: ['umnozhenie'],
  sozdat(rng, o) {
    let m: number;
    let b: number;
    if (o.uroven === 1) {
      m = rng.int(2, 9) * 10;
      b = rng.int(1, 2);
    } else if (o.uroven === 2) {
      m = rng.int(2, 9) * 10;
      b = rng.int(3, 5);
    } else {
      m = rng.pick([50, 100, 150, 200]);
      b = rng.int(2, 9);
    }
    return this.iz(para(rng, m - b, m + b), o.uroven);
  },
  iz(d, uroven) {
    return proizv('raznost-kvadratov', uroven, d);
  },
  razbor(p) {
    const x = num(p.d[0]);
    const y = num(p.d[1]);
    const m = (x + y) / 2;
    const b = Math.abs(x - y) / 2;
    return [
      {
        tekst: `Числа стоят на равном расстоянии от $${m}$: $${m} - ${b}$ и $${m} + ${b}$. Формула $(a-b)(a+b) = a^2 - b^2$.`,
        cep: [
          `${x}*${y}`,
          `(${m}-${b})*(${m}+${b})`,
          `${m}^2-${b}^2`,
          `${m * m}-${b * b}`,
          znach(`${x}*${y}`),
        ],
      },
    ];
  },
};

/* ── Десятки одинаковые, единицы в сумме 10 ─────────────────── */

export const desyatkiEdinicy10: Priyom = {
  id: 'desyatki-edinicy-10',
  gruppa: 'umnozhenie',
  deystvie: 'umnozhenie',
  deystviya: ['umnozhenie'],
  sozdat(rng, o) {
    const t = o.uroven === 1 ? rng.int(1, 4) : o.uroven === 2 ? rng.int(5, 9) : rng.int(10, 19);
    const u = rng.int(1, 9);
    return this.iz(para(rng, 10 * t + u, 10 * t + 10 - u), o.uroven);
  },
  iz(d, uroven) {
    return proizv('desyatki-edinicy-10', uroven, d);
  },
  razbor(p) {
    const x = num(p.d[0]);
    const y = num(p.d[1]);
    const t = Math.floor(x / 10);
    const u = x % 10;
    const w = y % 10;
    const v1 = t * (t + 1);
    const v2 = u * w;
    return [
      {
        tekst: `Начало у чисел одинаковое ($${t}$), последние цифры в сумме дают $10$. Начало умножаем на следующее число.`,
        cep: [`${t}*${t + 1}`, `${v1}`],
      },
      {
        tekst: `Последние цифры перемножаем и записываем двумя цифрами: $${u}\\cdot${w} = ${v2}$ → $${String(v2).padStart(2, '0')}$.`,
        cep: [`${u}*${w}`, `${v2}`],
      },
      { cep: [`${v1}*100+${v2}`, `${x}*${y}`, znach(`${x}*${y}`)] },
    ];
  },
};

/* ── Около 100 ──────────────────────────────────────────────── */

function okolo100(rng: Rng, lo: number, hi: number): number {
  let x = rng.int(lo, hi);
  while (x === 100) x = rng.int(lo, hi);
  return x;
}

export const okolo100Priyom: Priyom = {
  id: 'okolo-100',
  gruppa: 'umnozhenie',
  deystvie: 'umnozhenie',
  deystviya: ['umnozhenie'],
  sozdat(rng, o) {
    if (o.uroven === 1) return this.iz(para(rng, rng.int(91, 99), rng.int(91, 99)), 1);
    if (o.uroven === 2) {
      /* Хотя бы одно число больше 100: иначе это уровень 1. */
      return this.iz(para(rng, okolo100(rng, 101, 109), okolo100(rng, 91, 109)), 2);
    }
    const x = rng.int(101, 115);
    const y = rng.chance(0.5) ? rng.int(101, 115) : rng.int(88, 99);
    return this.iz(para(rng, x, y), 3);
  },
  iz(d, uroven) {
    return proizv('okolo-100', uroven, d);
  },
  razbor(p) {
    const x = num(p.d[0]);
    const y = num(p.d[1]);
    const pp = 100 - x;
    const q = 100 - y;
    const s = x - q;
    const pq = pp * q;
    const nedost = (n: number, k: number) =>
      k >= 0 ? `$${n}$ меньше $100$ на $${k}$` : `$${n}$ больше $100$ на $${-k}$`;
    return [
      {
        tekst: `${nedost(x, pp)}, ${nedost(y, q)}. Первая часть: $${x} ${q >= 0 ? '-' : '+'} ${Math.abs(q)}$ (то же, что $${y} ${pp >= 0 ? '-' : '+'} ${Math.abs(pp)}$).`,
        cep: [`${x}${q >= 0 ? '-' : '+'}${Math.abs(q)}`, `${s}`],
      },
      {
        tekst:
          'Вторая часть — произведение этих отклонений (со знаками): это сотни и единицы ответа.',
        cep: [`${sk(pp)}*${sk(q)}`, `${pq}`],
      },
      {
        tekst: '$(100-p)(100-q) = 100\\cdot(100-p-q) + pq$.',
        cep: [`${s}*100${pq >= 0 ? '+' : '-'}${Math.abs(pq)}`, `${x}*${y}`, znach(`${x}*${y}`)],
      },
    ];
  },
};

/* ── На 11 ──────────────────────────────────────────────────── */

export const na11: Priyom = {
  id: 'na-11',
  gruppa: 'umnozhenie',
  deystvie: 'umnozhenie',
  deystviya: ['umnozhenie'],
  sozdat(rng, o) {
    let n: number;
    if (o.uroven === 3) {
      n = rng.int(101, 999);
    } else {
      const a = rng.int(1, 9);
      const b = o.uroven === 1 ? rng.int(0, 9 - a) : rng.int(Math.max(10 - a, 1), 9);
      n = 10 * a + b;
      if (o.uroven === 1 && n < 12) n = 12 + rng.int(0, 6);
    }
    return this.iz(para(rng, n, 11), o.uroven);
  },
  iz(d, uroven) {
    return proizv('na-11', uroven, d);
  },
  razbor(p) {
    const n = num(p.d[0]) === 11 ? num(p.d[1]) : num(p.d[0]);
    const ans = znach(`${n}*11`);
    if (n < 100) {
      const a = Math.floor(n / 10);
      const b = n % 10;
      const s = a + b;
      return [
        {
          tekst:
            s <= 9
              ? `Раздвигаем цифры $${a}$ и $${b}$, в середину пишем их сумму.`
              : `Сумма цифр $${s}$ — двузначная: в середину пишем $${s % 10}$, а единицу переносим к первой цифре: $${a} + 1 = ${a + 1}$.`,
          cep: [`${a}+${b}`, `${s}`],
        },
        {
          tekst: '$\\overline{ab}\\cdot 11 = 100a + 10(a+b) + b$.',
          cep: [`${a}*100+${s}*10+${b}`, `${n}*11`, ans],
        },
      ];
    }
    const a = Math.floor(n / 100);
    const b = Math.floor(n / 10) % 10;
    const c = n % 10;
    return [
      {
        tekst: `Крайние цифры $${a}$ и $${c}$ остаются, между ними — суммы соседних цифр.`,
        cep: [`${a}+${b}`, `${a + b}`],
      },
      { cep: [`${b}+${c}`, `${b + c}`] },
      {
        tekst: 'Складываем по разрядам (переносы — к старшему разряду).',
        cep: [`${a}*1000+${a + b}*100+${b + c}*10+${c}`, `${n}*11`, ans],
      },
    ];
  },
};

/* ── На 5, 25, 50, 125 ─────────────────────────────────────── */

const NA_ZAMENA: Record<string, { up: number; down: number; tekst: string }> = {
  '5': { up: 10, down: 2, tekst: 'Умножить на $5$ — умножить на $10$ и разделить на $2$.' },
  '50': { up: 100, down: 2, tekst: 'Умножить на $50$ — умножить на $100$ и разделить на $2$.' },
  '25': { up: 100, down: 4, tekst: 'Умножить на $25$ — умножить на $100$ и разделить на $4$.' },
  '125': { up: 1000, down: 8, tekst: 'Умножить на $125$ — умножить на $1000$ и разделить на $8$.' },
  '0.5': { up: 1, down: 2, tekst: 'Умножить на $0{,}5$ — разделить на $2$.' },
  '0.25': { up: 1, down: 4, tekst: 'Умножить на $0{,}25$ — разделить на $4$.' },
};

export const na52550125: Priyom = {
  id: 'na-5-25-50-125',
  gruppa: 'umnozhenie',
  deystvie: 'umnozhenie',
  deystviya: ['umnozhenie'],
  desyatichnye: [3],
  sozdat(rng, o) {
    let m: string;
    let k: number;
    if (o.uroven === 1) {
      m = rng.pick(['5', '50']);
      k = rng.int(12, 98);
    } else if (o.uroven === 2) {
      m = '25';
      k = rng.chance(0.6) ? 4 * rng.int(3, 24) : rng.int(12, 99);
    } else {
      m = o.desyatichnye ? rng.pick(['125', '125', '0.5', '0.25']) : '125';
      k = m === '125' ? 8 * rng.int(2, 12) : rng.int(13, 99);
    }
    if (k % 10 === 0) k += m === '125' ? 8 : 2;
    return this.iz(para(rng, k, m), o.uroven);
  },
  iz(d, uroven) {
    return proizv('na-5-25-50-125', uroven, d);
  },
  razbor(p) {
    const m = NA_ZAMENA[p.d[0] ?? ''] !== undefined ? (p.d[0] as string) : (p.d[1] as string);
    const k = m === p.d[0] ? (p.d[1] as string) : (p.d[0] as string);
    const z = NA_ZAMENA[m];
    if (z === undefined) return [];
    const ans = znach(`${k}*${m}`);
    if (z.up === 1) {
      return [{ tekst: z.tekst, cep: [`${k}*${m}`, `${k}/${z.down}`, ans] }];
    }
    const big = znach(`${k}*${z.up}`);
    return [
      { tekst: z.tekst, cep: [`${k}*${m}`, `${k}*${z.up}/${z.down}`, `${big}/${z.down}`, ans] },
    ];
  },
};

/* ── Округление ────────────────────────────────────────────── */

function vverh(x: number): { R: number; dd: number } {
  if (x === 9 || x === 99 || x === 999) return { R: x + 1, dd: 1 };
  if (x >= 100) {
    const R = Math.ceil(x / 100) * 100;
    return { R, dd: R - x };
  }
  const R = Math.ceil(x / 10) * 10;
  return { R, dd: R - x };
}

export const okruglenieUmnozhenie: Priyom = {
  id: 'okruglenie-umnozhenie',
  gruppa: 'umnozhenie',
  deystvie: 'umnozhenie',
  deystviya: ['umnozhenie'],
  sozdat(rng, o) {
    let x: number;
    let k: number;
    if (o.uroven === 1) {
      x = rng.int(1, 9) * 10 + rng.pick([8, 9]);
      k = rng.int(3, 9);
    } else if (o.uroven === 2) {
      x = rng.pick([9, 99]);
      k = rng.int(12, 99);
      if (k % 10 === 0) k += 3;
    } else {
      x = rng.pick([199, 299, 399, 198, 98, 999]);
      k = x === 98 ? rng.int(12, 49) : rng.int(3, 9);
      if (k % 10 === 0) k += 1;
    }
    return this.iz(para(rng, x, k), o.uroven, String(x));
  },
  /* v — какой из множителей округляем. */
  iz(d, uroven, v) {
    return proizv('okruglenie-umnozhenie', uroven, d, v ?? d[0]);
  },
  razbor(p) {
    const x = num(p.v ?? p.d[0]);
    const k = p.d[0] === (p.v ?? p.d[0]) ? num(p.d[1]) : num(p.d[0]);
    const { R, dd } = vverh(x);
    return [
      {
        tekst: `Округляем $${x}$ до $${R}$ и вычитаем лишнее: $(${R} - ${dd})\\cdot ${k} = ${R}\\cdot ${k} - ${dd}\\cdot ${k}$.`,
        cep: [
          `${x}*${k}`,
          `(${R}-${dd})*${k}`,
          `${R}*${k}-${dd}*${k}`,
          `${R * k}-${dd * k}`,
          znach(`${x}*${k}`),
        ],
      },
    ];
  },
};

/* ── Разложение ────────────────────────────────────────────── */

function razryady(n: number): number[] {
  const s = String(n);
  return s
    .split('')
    .map((c, i) => Number(c) * 10 ** (s.length - 1 - i))
    .filter((x) => x !== 0);
}

export const razlozhenie: Priyom = {
  id: 'razlozhenie',
  gruppa: 'umnozhenie',
  deystvie: 'umnozhenie',
  deystviya: ['umnozhenie'],
  sozdat(rng, o) {
    const bez0 = (lo: number, hi: number) => {
      let n = rng.int(lo, hi);
      while (n % 10 === 0) n = rng.int(lo, hi);
      return n;
    };
    if (o.uroven === 1) return this.iz([String(bez0(12, 99)), String(rng.int(3, 9))], 1);
    if (o.uroven === 2) return this.iz([String(bez0(12, 99)), String(rng.int(12, 19))], 2);
    return this.iz([String(bez0(101, 999)), String(rng.int(3, 9))], 3);
  },
  iz(d, uroven) {
    return proizv('razlozhenie', uroven, d);
  },
  razbor(p) {
    const x = num(p.d[0]);
    const k = num(p.d[1]);
    const ans = znach(`${x}*${k}`);
    if (k >= 10) {
      const w = k - 10;
      return [
        {
          tekst: `$${k} = 10 + ${w}$: умножаем на $10$ и на $${w}$ и складываем.`,
          cep: [`${x}*${k}`, `${x}*10+${x}*${w}`, `${x * 10}+${x * w}`, ans],
        },
      ];
    }
    const parts = razryady(x);
    return [
      {
        tekst: `Раскладываем $${x}$ по разрядам и умножаем каждую часть на $${k}$.`,
        cep: [
          `${x}*${k}`,
          parts.map((q) => `${q}*${k}`).join('+'),
          parts.map((q) => `${q * k}`).join('+'),
          ans,
        ],
      },
    ];
  },
};

/* ── Группировка множителей ────────────────────────────────── */

const PARY_1: readonly [number, number][] = [
  [25, 4],
  [5, 2],
  [2, 50],
  [4, 25],
  [5, 20],
];
const PARY_2: readonly [number, number][] = [
  [125, 8],
  [25, 8],
  [8, 125],
  [4, 250],
  [40, 25],
];

export const gruppirovkaMnozhiteley: Priyom = {
  id: 'gruppirovka-mnozhiteley',
  gruppa: 'umnozhenie',
  deystvie: 'umnozhenie',
  deystviya: ['umnozhenie'],
  sozdat(rng, o) {
    const k = rng.int(11, 99);
    if (o.uroven === 3) {
      const [a, b] = rng.pick(PARY_1);
      const m = rng.int(2, 9);
      const order = rng.shuffle([a, k, b, m]);
      return this.iz(order.map(String), 3, `${a},${b}`);
    }
    const [a, b] = rng.pick(o.uroven === 1 ? PARY_1 : PARY_2);
    /* Пара не рядом: «25 · 17 · 4». */
    const order = rng.chance(0.5) ? [a, k, b] : [b, k, a];
    return this.iz(order.map(String), o.uroven, `${a},${b}`);
  },
  iz(d, uroven, v) {
    return proizv('gruppirovka-mnozhiteley', uroven, d, v);
  },
  razbor(p) {
    const [a, b] = (p.v ?? '').split(',').map(Number) as [number, number];
    const rest = [...p.d.map(Number)];
    for (const x of [a, b]) {
      const i = rest.indexOf(x);
      if (i >= 0) rest.splice(i, 1);
    }
    const ab = a * b;
    const restMul = rest.reduce((s, x) => s * x, 1);
    const ans = znach(p.expr);
    const cep: string[] = [p.expr, `(${a}*${b})*${rest.join('*')}`, `${ab}*${rest.join('*')}`];
    if (rest.length > 1) cep.push(`${ab}*${restMul}`);
    cep.push(ans);
    return [
      {
        tekst: `Переставляем множители: $${a}\\cdot ${b} = ${ab}$ — круглое число.`,
        cep,
      },
    ];
  },
};

/* ── Десятичные дроби ──────────────────────────────────────── */

function celoe(x: string): { n: string; k: number } {
  const [w = '', f = ''] = x.split('.');
  return { n: String(Number(w + f)), k: f.length };
}

export const desyatichnyeUmnozhenie: Priyom = {
  id: 'desyatichnye-umnozhenie',
  gruppa: 'umnozhenie',
  deystvie: 'umnozhenie',
  deystviya: ['umnozhenie'],
  desyatichnye: [1, 2, 3],
  sozdat(rng, o) {
    if (!o.desyatichnye) return null;
    let a: string;
    let b: string;
    if (o.uroven === 1) {
      a = `0.${rng.int(1, 9)}`;
      b = rng.chance(0.5) ? `0.${rng.int(2, 9)}` : String(rng.int(2, 9));
    } else if (o.uroven === 2) {
      const t = rng.int(0, 3);
      if (t === 0) {
        a = znach(`${rng.int(11, 49)}/10`);
        b = '0.5';
      } else if (t === 1) {
        a = '0.25';
        b = String(4 * rng.int(2, 9));
      } else if (t === 2) {
        a = '0.75';
        b = String(4 * rng.int(2, 9));
      } else {
        a = `0.${rng.int(2, 8)}`;
        b = znach(`${rng.int(11, 39)}/10`);
      }
    } else if (rng.chance(0.3)) {
      a = '0.125';
      b = String(8 * rng.int(2, 9));
    } else {
      let A = rng.int(11, 99);
      while (A % 10 === 0) A = rng.int(11, 99);
      a = znach(`${A}/100`);
      b = `0.${rng.int(2, 9)}`;
    }
    if (a.endsWith('.0') || b.endsWith('.0')) return null;
    return this.iz(para(rng, a, b), o.uroven);
  },
  iz(d, uroven) {
    return proizv('desyatichnye-umnozhenie', uroven, d);
  },
  razbor(p) {
    const a = p.d[0] as string;
    const b = p.d[1] as string;
    const ca = celoe(a);
    const cb = celoe(b);
    const k = ca.k + cb.k;
    const prod = Number(ca.n) * Number(cb.n);
    const del = 10 ** k;
    const shagi: Shag[] = [
      {
        tekst: `Умножаем без запятых: $${ca.n}\\cdot ${cb.n} = ${prod}$. Знаков после запятой у множителей вместе — ${k}: отделяем их в ответе.`,
        cep: [`${a}*${b}`, `${ca.n}*${cb.n}/${del}`, `${prod}/${del}`, znach(p.expr)],
      },
    ];
    return shagi;
  },
};

export const UMNOZHENIE: readonly Priyom[] = [
  raznostKvadratov,
  desyatkiEdinicy10,
  okolo100Priyom,
  na11,
  na52550125,
  okruglenieUmnozhenie,
  razlozhenie,
  gruppirovkaMnozhiteley,
  desyatichnyeUmnozhenie,
];
