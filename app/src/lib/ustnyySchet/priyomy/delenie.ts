/**
 * Деление: на 5, 25, 50, 125 и на 0,5 / 0,25 / 0,2 / 0,125; по частям;
 * обратная таблица умножения.
 */

import { sdelat, znach } from '../primer';
import type { Priyom } from '../types';

const num = (s: string | undefined): number => Number(s ?? '0');

/* ── На 5, 25 и десятичные ─────────────────────────────────── */

const DEL: Record<string, { kak: 'umn' | 'dom'; k: number; up?: number; tekst: string }> = {
  '5': {
    kak: 'dom',
    k: 2,
    up: 10,
    tekst: 'Делить на $5$ — умножить на $2$ и разделить на $10$: $5\\cdot2 = 10$.',
  },
  '50': {
    kak: 'dom',
    k: 2,
    up: 100,
    tekst: 'Делить на $50$ — умножить на $2$ и разделить на $100$.',
  },
  '25': {
    kak: 'dom',
    k: 4,
    up: 100,
    tekst: 'Делить на $25$ — умножить на $4$ и разделить на $100$: $25\\cdot4 = 100$.',
  },
  '125': {
    kak: 'dom',
    k: 8,
    up: 1000,
    tekst: 'Делить на $125$ — умножить на $8$ и разделить на $1000$.',
  },
  '0.5': { kak: 'umn', k: 2, tekst: 'Делить на $0{,}5$ — умножать на $2$: в целом $2$ половины.' },
  '0.25': {
    kak: 'umn',
    k: 4,
    tekst: 'Делить на $0{,}25$ — умножать на $4$: в целом $4$ четверти.',
  },
  '0.2': { kak: 'umn', k: 5, tekst: 'Делить на $0{,}2$ — умножать на $5$: $0{,}2 = \\frac15$.' },
  '0.125': {
    kak: 'umn',
    k: 8,
    tekst: 'Делить на $0{,}125$ — умножать на $8$: $0{,}125 = \\frac18$.',
  },
};

/* ── На 5 ──────────────────────────────────────────────────── */

/**
 * Деление на 5 — отдельным приёмом: самое частое из «удобных»
 * делений. Делимое умножаем на 2, результат делим на 10 (переносим
 * запятую на знак влево).
 */
export const delenieNa5: Priyom = {
  id: 'delenie-na-5',
  gruppa: 'delenie',
  deystvie: 'delenie',
  deystviya: ['delenie'],
  desyatichnye: [2, 3],
  sozdat(rng, o) {
    let n: string;
    if (o.uroven === 1) {
      n = String(5 * rng.int(3, 40));
    } else if (o.uroven === 2) {
      if (o.desyatichnye && rng.chance(0.4)) {
        /* Не делится нацело — ответ десятичная дробь: 37 : 5 = 7,4. */
        let x = rng.int(11, 99);
        while (x % 5 === 0) x = rng.int(11, 99);
        n = String(x);
      } else {
        n = String(5 * rng.int(41, 199));
      }
    } else if (o.desyatichnye && rng.chance(0.5)) {
      /* Десятичное делимое или трёхзначное не на 5: 4,5 : 5; 123 : 5. */
      if (rng.chance(0.5)) {
        let a = rng.int(11, 99);
        while (a % 10 === 0) a = rng.int(11, 99);
        n = znach(`${a}/10`);
      } else {
        let x = rng.int(101, 999);
        while (x % 5 === 0) x = rng.int(101, 999);
        n = String(x);
      }
    } else {
      n = String(5 * rng.int(200, 1999));
    }
    return this.iz([n], o.uroven);
  },
  iz(d, uroven) {
    return sdelat({
      priyom: 'delenie-na-5',
      uroven,
      deystvie: 'delenie',
      d,
      expr: `${d[0]}/5`,
    });
  },
  razbor(p) {
    const n = p.d[0] as string;
    const dvazhdy = znach(`${n}*2`);
    const ans = znach(p.expr);
    return [
      {
        tekst: `Умножаем делимое и делитель на $2$: делить на $5$ — то же, что делить вдвое большее число на $10$.`,
        cep: [p.expr, `(${n}*2)/(5*2)`, `${dvazhdy}/10`],
      },
      {
        tekst: `Разделить на $10$ — перенести запятую на один знак влево.`,
        cep: [`${dvazhdy}/10`, ans],
      },
    ];
  },
};

export const delenieNa525: Priyom = {
  id: 'delenie-na-5-25',
  gruppa: 'delenie',
  deystvie: 'delenie',
  deystviya: ['delenie'],
  desyatichnye: [2, 3],
  sozdat(rng, o) {
    let n: number;
    let m: string;
    if (o.uroven === 1) {
      if (rng.chance(0.5)) {
        m = '5';
        n = 5 * rng.int(11, 99);
      } else {
        m = '25';
        n = 25 * rng.int(3, 39);
      }
    } else if (o.uroven === 2) {
      if (o.desyatichnye) {
        m = rng.pick(['0.5', '0.25']);
        n = rng.int(3, 99);
      } else {
        m = rng.pick(['25', '50']);
        n = Number(m) * rng.int(11, 99);
      }
    } else if (o.desyatichnye && rng.chance(0.6)) {
      m = rng.pick(['0.2', '0.125']);
      n = m === '0.2' ? rng.int(3, 60) : rng.int(2, 25);
    } else {
      m = '125';
      n = 125 * rng.int(2, 24);
    }
    if (n % 10 === 0 && Number(m) >= 1) n += Number(m);
    return this.iz([String(n), m], o.uroven);
  },
  iz(d, uroven) {
    return sdelat({
      priyom: 'delenie-na-5-25',
      uroven,
      deystvie: 'delenie',
      d,
      expr: `${d[0]}/${d[1]}`,
    });
  },
  razbor(p) {
    const n = p.d[0] as string;
    const m = p.d[1] as string;
    const z = DEL[m];
    const ans = znach(p.expr);
    if (z === undefined) return [{ cep: [p.expr, ans] }];
    if (z.kak === 'umn') return [{ tekst: z.tekst, cep: [p.expr, `${n}*${z.k}`, ans] }];
    return [
      {
        tekst: z.tekst,
        cep: [p.expr, `(${n}*${z.k})/(${m}*${z.k})`, `${znach(`${n}*${z.k}`)}/${z.up}`, ans],
      },
    ];
  },
};

/* ── По частям ─────────────────────────────────────────────── */

export const deleniePoChastyam: Priyom = {
  id: 'delenie-po-chastyam',
  gruppa: 'delenie',
  deystvie: 'delenie',
  deystviya: ['delenie'],
  sozdat(rng, o) {
    const [dl, dh, ql, qh] =
      o.uroven === 1 ? [11, 19, 12, 20] : o.uroven === 2 ? [12, 25, 21, 49] : [12, 35, 51, 99];
    const dd = rng.int(dl, dh);
    let q = rng.int(ql, qh);
    while (q % 10 === 0) q = rng.int(ql, qh);
    return this.iz([String(dd * q), String(dd)], o.uroven);
  },
  iz(d, uroven) {
    return sdelat({
      priyom: 'delenie-po-chastyam',
      uroven,
      deystvie: 'delenie',
      d,
      expr: `${d[0]}/${d[1]}`,
    });
  },
  razbor(p) {
    const n = num(p.d[0]);
    const dd = num(p.d[1]);
    const q = n / dd;
    const T = Math.floor(q / 10) * 10;
    const r = q - T;
    return [
      {
        tekst: `Разбиваем $${n}$ на части, которые делятся на $${dd}$ нацело: $${dd}\\cdot${T} = ${dd * T}$ и остаток $${dd * r}$.`,
        cep: [p.expr, `${dd * T}/${dd}+${dd * r}/${dd}`, `${T}+${r}`, `${q}`],
      },
    ];
  },
};

/* ── Обратная таблица ──────────────────────────────────────── */

export const obratnayaTablica: Priyom = {
  id: 'obratnaya-tablica',
  gruppa: 'delenie',
  deystvie: 'delenie',
  deystviya: ['delenie'],
  sozdat(rng, o) {
    const b = o.uroven === 1 ? rng.int(2, 5) : o.uroven === 2 ? rng.int(6, 9) : rng.int(2, 12);
    const a = o.uroven === 3 ? rng.int(2, 12) : rng.int(2, 9);
    return this.iz([String(a * b), String(b)], o.uroven, rng.chance(0.5) ? 'kv' : undefined);
  },
  iz(d, uroven, v) {
    const n = num(d[0]);
    const b = num(d[1]);
    return sdelat({
      priyom: 'obratnaya-tablica',
      uroven,
      deystvie: 'delenie',
      d,
      ...(v === undefined ? {} : { v }),
      expr: `${n}/${b}`,
      key: `obratnaya-tablica|${n}/${b}`,
      ...(v === 'kv' ? { tex: `${n} = \\square\\cdot ${b}`, text: `${n} = □ · ${b}` } : {}),
    });
  },
  razbor(p) {
    const n = num(p.d[0]);
    const b = num(p.d[1]);
    const a = n / b;
    return [
      {
        tekst: `Вспоминаем строку таблицы на $${b}$: какое число, умноженное на $${b}$, даёт $${n}$?`,
        cep: [`${a}*${b}`, `${n}`],
      },
      { cep: [`${n}/${b}`, `${a}`] },
    ];
  },
};

export const DELENIE: readonly Priyom[] = [
  delenieNa5,
  delenieNa525,
  deleniePoChastyam,
  obratnayaTablica,
];
