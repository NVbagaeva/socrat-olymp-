/**
 * Сложение и вычитание: округление с поправкой, по разрядам слева
 * направо, дополнение до круглого, удобная группировка, отрицательные.
 */

import { sdelat, znach } from '../primer';
import type { Rng } from '../rng';
import type { Deystvie, GenOpts, Priyom, Shag } from '../types';

const num = (s: string | undefined): number => Number(s ?? '0');

/** Знак примера: по миксу «по действию» или случайно. */
function znak(rng: Rng, o: GenOpts): '+' | '-' {
  if (o.deystvie === 'slozhenie') return '+';
  if (o.deystvie === 'vychitanie') return '-';
  return rng.chance(0.5) ? '+' : '-';
}

const DEYSTVIE: Record<'+' | '-', Deystvie> = { '+': 'slozhenie', '-': 'vychitanie' };

/* ── Округление с поправкой ────────────────────────────────── */

export const okruglenieSPopravkoy: Priyom = {
  id: 'okruglenie-s-popravkoy',
  gruppa: 'slozhenie',
  deystvie: 'slozhenie',
  deystviya: ['slozhenie', 'vychitanie'],
  desyatichnye: [3],
  sozdat(rng, o) {
    const z = znak(rng, o);
    let R: string;
    let dd: string;
    let a: string;
    if (o.uroven === 1) {
      R = String(rng.int(2, 8) * 10);
      dd = String(rng.int(1, 2));
      a = String(z === '+' ? rng.int(13, 89) : Number(R) + rng.int(11, 59));
    } else if (o.uroven === 2) {
      R = String(rng.int(1, 7) * 100);
      dd = String(rng.int(1, 3));
      a = String(z === '+' ? rng.int(101, 899) : Number(R) + rng.int(101, 899));
    } else if (o.desyatichnye && rng.chance(0.4)) {
      R = String(rng.int(2, 8));
      dd = rng.pick(['0.01', '0.02', '0.03', '0.1']);
      a = znach(`${z === '+' ? rng.int(101, 899) : Number(R) * 100 + rng.int(101, 799)}/100`);
    } else {
      R = String(rng.int(1, 7) * 1000);
      dd = String(rng.int(1, 3));
      a = String(z === '+' ? rng.int(1001, 8999) : Number(R) + rng.int(1001, 8999));
    }
    if (/^\d+$/.test(a) && Number(a) % 10 === 0) a = String(Number(a) + 3);
    const vniz = rng.chance(0.7);
    const b = znach(vniz ? `${R}-${dd}` : `${R}+${dd}`);
    const d = z === '+' && rng.chance(0.5) ? [b, a] : [a, b];
    return this.iz(d, o.uroven, `${z}${R}`);
  },
  /* v — знак и круглое число: «+400», «-200». */
  iz(d, uroven, v) {
    const z = (v ?? '+')[0] === '-' ? '-' : '+';
    return sdelat({
      priyom: 'okruglenie-s-popravkoy',
      uroven,
      deystvie: DEYSTVIE[z],
      d,
      v: v ?? '+',
      expr: `${d[0]}${z}${d[1]}`,
    });
  },
  razbor(p) {
    const z = (p.v ?? '+')[0] === '-' ? '-' : '+';
    const R = (p.v ?? '+0').slice(1);
    const [x, y] = [p.d[0] as string, p.d[1] as string];
    const ans = znach(p.expr);
    /* Какое число округляем: то, что ближе к R. */
    const dx = Math.abs(num(x) - num(R));
    const dy = Math.abs(num(y) - num(R));
    const kr = z === '-' || dy <= dx ? y : x;
    const drugoe = kr === y ? x : y;
    const raz = znach(`${kr}-${R}`);
    const vniz = raz.startsWith('-');
    const pop = vniz ? raz.slice(1) : raz;
    if (z === '+') {
      const sum = znach(`${drugoe}+${R}`);
      return [
        {
          tekst: `$${kr.replace('.', '{,}')}$ — это $${R} ${vniz ? '-' : '+'} ${pop.replace('.', '{,}')}$: прибавляем $${R}$ и поправляем.`,
          cep: [
            p.expr,
            `${drugoe}+${R}${vniz ? '-' : '+'}${pop}`,
            `${sum}${vniz ? '-' : '+'}${pop}`,
            ans,
          ],
        },
      ];
    }
    const r = znach(`${x}-${R}`);
    return [
      {
        tekst: vniz
          ? `Вычитаем $${R}$ — это на $${pop.replace('.', '{,}')}$ больше, чем нужно: прибавляем лишнее обратно.`
          : `Вычитаем $${R}$ и ещё $${pop.replace('.', '{,}')}$.`,
        cep: [p.expr, `${x}-${R}${vniz ? '+' : '-'}${pop}`, `${r}${vniz ? '+' : '-'}${pop}`, ans],
      },
    ];
  },
};

/* ── По разрядам ───────────────────────────────────────────── */

function chasti(n: number): number[] {
  const s = String(n);
  return s
    .split('')
    .map((c, i) => Number(c) * 10 ** (s.length - 1 - i))
    .filter((x) => x !== 0);
}

export const poRazryadam: Priyom = {
  id: 'po-razryadam',
  gruppa: 'slozhenie',
  deystvie: 'slozhenie',
  deystviya: ['slozhenie', 'vychitanie'],
  sozdat(rng, o) {
    const z = znak(rng, o);
    const [lo, hi] = o.uroven === 1 ? [12, 89] : o.uroven === 2 ? [102, 899] : [1002, 8999];
    let a = rng.int(lo, hi);
    let b = rng.int(lo, hi);
    /* Есть переход через разряд — иначе приём не нужен. */
    for (let i = 0; i < 20 && (z === '+' ? (a % 10) + (b % 10) < 10 : a % 10 >= b % 10); i += 1) {
      a = rng.int(lo, hi);
      b = rng.int(lo, hi);
    }
    if (z === '-' && a < b) [a, b] = [b, a];
    if (z === '-' && a === b) a += 11;
    return this.iz([String(a), String(b)], o.uroven, z);
  },
  iz(d, uroven, v) {
    const z = v === '-' ? '-' : '+';
    return sdelat({
      priyom: 'po-razryadam',
      uroven,
      deystvie: DEYSTVIE[z],
      d,
      v: z,
      expr: `${d[0]}${z}${d[1]}`,
    });
  },
  razbor(p) {
    const z = p.v === '-' ? '-' : '+';
    const a = num(p.d[0]);
    const b = num(p.d[1]);
    const parts = chasti(b);
    const cep: string[] = [p.expr, `${a}${parts.map((q) => `${z}${q}`).join('')}`];
    let acc = a;
    for (let i = 0; i < parts.length - 1; i += 1) {
      acc = z === '+' ? acc + (parts[i] as number) : acc - (parts[i] as number);
      cep.push(
        `${acc}${parts
          .slice(i + 1)
          .map((q) => `${z}${q}`)
          .join('')}`,
      );
    }
    cep.push(znach(p.expr));
    return [
      {
        tekst: `${z === '+' ? 'Прибавляем' : 'Вычитаем'} $${b}$ по разрядам слева направо: ${parts.map((q) => `$${q}$`).join(', ')}.`,
        cep,
      },
    ];
  },
};

/* ── Дополнение до круглого ────────────────────────────────── */

export const dopolnenieDoKruglogo: Priyom = {
  id: 'dopolnenie-do-kruglogo',
  gruppa: 'slozhenie',
  deystvie: 'vychitanie',
  deystviya: ['vychitanie'],
  desyatichnye: [3],
  sozdat(rng, o) {
    if (o.deystvie === 'slozhenie') return null;
    const bez0 = (lo: number, hi: number) => {
      let n = rng.int(lo, hi);
      while (n % 10 === 0) n = rng.int(lo, hi);
      return n;
    };
    if (o.uroven === 1) return this.iz(['100', String(bez0(11, 89))], 1);
    if (o.uroven === 2) return this.iz(['1000', String(bez0(101, 989))], 2);
    if (o.desyatichnye && rng.chance(0.4)) return this.iz(['1', znach(`${bez0(11, 89)}/100`)], 3);
    return this.iz(['10000', String(bez0(1001, 9989))], 3);
  },
  iz(d, uroven) {
    return sdelat({
      priyom: 'dopolnenie-do-kruglogo',
      uroven,
      deystvie: 'vychitanie',
      d,
      expr: `${d[0]}-${d[1]}`,
    });
  },
  razbor(p) {
    const R = p.d[0] as string;
    const x = p.d[1] as string;
    /* Шаг последнего разряда: 1 для целых, 0,01 для сотых. */
    const k = (x.split('.')[1] ?? '').length;
    const step = k === 0 ? '1' : znach(`1/${10 ** k}`);
    const nines = znach(`${R}-${step}`);
    const ans = znach(p.expr);
    const mid = znach(`${nines}-${x}`);
    return [
      {
        tekst: `Каждую цифру дополняем до $9$, последнюю — до $10$: $${R.replace('.', '{,}')} = ${nines.replace('.', '{,}')} + ${step.replace('.', '{,}')}$, а из девяток вычитать легко — без переходов через разряд.`,
        cep: [p.expr, `${nines}-${x}+${step}`, `${mid}+${step}`, ans],
      },
    ];
  },
};

/* ── Удобная группировка ───────────────────────────────────── */

export const gruppirovkaSlagaemyh: Priyom = {
  id: 'gruppirovka-slagaemyh',
  gruppa: 'slozhenie',
  deystvie: 'slozhenie',
  deystviya: ['slozhenie'],
  sozdat(rng, o) {
    if (o.deystvie === 'vychitanie' && o.uroven < 3) return null;
    const bez0 = () => {
      let n = rng.int(11, 89);
      while (n % 10 === 0) n = rng.int(11, 89);
      return n;
    };
    const a = bez0();
    let b = bez0();
    while (b === a || b === 100 - a) b = bez0();
    if (o.uroven === 1) {
      return this.iz([a, b, 100 - a, 100 - b].map(String), 1, `${a},${b}`);
    }
    if (o.uroven === 2) {
      let c = bez0();
      while ([a, 100 - a, b, 100 - b].includes(c)) c = bez0();
      const order = rng.shuffle([a, 100 - a, b, 100 - b, c]);
      return this.iz(order.map(String), 2, `${a},${b}`);
    }
    /* Уровень 3: со знаком минус: a − c + b + (100 − a) − (100 − c). */
    let c = bez0();
    while (c === a || c === 100 - a || c === b) c = bez0();
    return this.iz([a, -c, b, 100 - a, -(100 - c)].map(String), 3, `${a},${c},${b}`);
  },
  iz(d, uroven, v) {
    const expr = d.map((x, i) => (i === 0 ? x : x.startsWith('-') ? x : `+${x}`)).join('');
    return sdelat({
      priyom: 'gruppirovka-slagaemyh',
      uroven,
      deystvie: d.some((x) => x.startsWith('-')) ? 'vychitanie' : 'slozhenie',
      d,
      ...(v === undefined ? {} : { v }),
      expr,
    });
  },
  razbor(p) {
    const ans = znach(p.expr);
    const nums = (p.v ?? '').split(',').map(Number);
    if (p.uroven === 3 && nums.length === 3) {
      const [a = 0, c = 0, b = 0] = nums;
      return [
        {
          tekst: `Собираем пары, дающие $100$: $${a} + ${100 - a}$ и $${c} + ${100 - c}$ (оба со знаком минус).`,
          cep: [p.expr, `(${a}+${100 - a})-(${c}+${100 - c})+${b}`, `100-100+${b}`, ans],
        },
      ];
    }
    const [a = 0, b = 0] = nums;
    const ostatok = p.d.map(Number).filter((x) => ![a, 100 - a, b, 100 - b].includes(x));
    const extra = ostatok.map((x) => `+${x}`).join('');
    const shagi: Shag[] = [
      {
        tekst: `Собираем пары, дающие $100$: $${a} + ${100 - a}$ и $${b} + ${100 - b}$.`,
        cep: [p.expr, `(${a}+${100 - a})+(${b}+${100 - b})${extra}`, `100+100${extra}`, ans],
      },
    ];
    return shagi;
  },
};

/* ── Отрицательные числа ───────────────────────────────────── */

type Vid = 'pm' | 'mm' | 'raz' | 'pn' | 'umn' | 'umm' | 'del';

export const otricatelnye: Priyom = {
  id: 'otricatelnye',
  gruppa: 'slozhenie',
  deystvie: 'slozhenie',
  deystviya: ['slozhenie', 'vychitanie'],
  otricatelnye: [1, 2, 3],
  sozdat(rng, o) {
    if (!o.otricatelnye) return null;
    const hi = o.uroven === 1 ? 9 : o.uroven === 2 ? 50 : 99;
    const lo = o.uroven === 1 ? 1 : 3;
    let vidy: Vid[] =
      o.uroven === 1
        ? ['pm', 'mm', 'raz']
        : o.uroven === 2
          ? ['pm', 'mm', 'raz', 'pn']
          : ['pm', 'mm', 'raz', 'pn', 'umn', 'umm', 'del'];
    if (o.deystvie === 'slozhenie') vidy = vidy.filter((x) => x === 'pm' || x === 'pn');
    if (o.deystvie === 'vychitanie') vidy = vidy.filter((x) => x === 'mm' || x === 'raz');
    const vid = rng.pick(vidy);
    if (vid === 'umn' || vid === 'umm' || vid === 'del') {
      const a = rng.int(2, 12);
      const b = rng.int(2, 9);
      return this.iz(
        vid === 'del' ? [String(a * b), String(b)] : [String(a), String(b)],
        o.uroven,
        vid,
      );
    }
    let a = rng.int(lo, hi);
    let b = rng.int(lo, hi);
    if (vid === 'raz' || vid === 'pn') {
      while (b === a) b = rng.int(lo, hi);
      if (b < a) [a, b] = [b, a];
    }
    return this.iz([String(a), String(b)], o.uroven, vid);
  },
  iz(d, uroven, v) {
    const a = d[0] as string;
    const b = d[1] as string;
    const vid = (v ?? 'pm') as Vid;
    const expr =
      vid === 'pm'
        ? `-${a}+${b}`
        : vid === 'mm'
          ? `-${a}-${b}`
          : vid === 'raz'
            ? `${a}-${b}`
            : vid === 'pn'
              ? `${a}+(-${b})`
              : vid === 'umn'
                ? `(-${a})*${b}`
                : vid === 'umm'
                  ? `(-${a})*(-${b})`
                  : `(-${a})/${b}`;
    const deystvie: Deystvie =
      vid === 'mm' || vid === 'raz'
        ? 'vychitanie'
        : vid === 'umn' || vid === 'umm'
          ? 'umnozhenie'
          : vid === 'del'
            ? 'delenie'
            : 'slozhenie';
    return sdelat({ priyom: 'otricatelnye', uroven, deystvie, d, v: vid, expr });
  },
  razbor(p) {
    const a = p.d[0] as string;
    const b = p.d[1] as string;
    const ans = znach(p.expr);
    const A = num(a);
    const B = num(b);
    switch (p.v as Vid) {
      case 'pm':
        return B >= A
          ? [
              {
                tekst:
                  'Знаки разные: из большего модуля вычитаем меньший. Больше модуль у плюса — ответ положительный.',
                cep: [p.expr, `${b}-${a}`, ans],
              },
            ]
          : [
              {
                tekst:
                  'Знаки разные: из большего модуля вычитаем меньший. Больше модуль у минуса — ответ отрицательный.',
                cep: [p.expr, `-(${a}-${b})`, ans],
              },
            ];
      case 'mm':
        return [
          {
            tekst: 'Оба числа отрицательные: модули складываем, ставим минус.',
            cep: [p.expr, `-(${a}+${b})`, ans],
          },
        ];
      case 'raz':
        return [
          {
            tekst: 'Вычитаем большее из меньшего: ответ отрицательный, по модулю — разность.',
            cep: [p.expr, `-(${b}-${a})`, ans],
          },
        ];
      case 'pn':
        return [
          { tekst: 'Прибавить отрицательное — то же, что вычесть.', cep: [p.expr, `${a}-${b}`] },
          {
            tekst: 'Вычитаем большее из меньшего: ответ отрицательный.',
            cep: [`${a}-${b}`, `-(${b}-${a})`, ans],
          },
        ];
      case 'umn':
        return [{ tekst: 'Минус на плюс — минус.', cep: [p.expr, `-(${a}*${b})`, ans] }];
      case 'umm':
        return [{ tekst: 'Минус на минус — плюс.', cep: [p.expr, `${a}*${b}`, ans] }];
      case 'del':
        return [{ tekst: 'Минус на плюс — минус.', cep: [p.expr, `-(${a}/${b})`, ans] }];
      default:
        return [{ cep: [p.expr, ans] }];
    }
  },
};

export const SLOZHENIE: readonly Priyom[] = [
  okruglenieSPopravkoy,
  poRazryadam,
  dopolnenieDoKruglogo,
  gruppirovkaSlagaemyh,
  otricatelnye,
];
