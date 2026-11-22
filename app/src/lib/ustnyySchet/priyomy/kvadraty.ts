/**
 * Квадраты: наизусть 11–30, числа на 5, около круглых, около 50,
 * через разность квадратов.
 */

import { sdelat, znach } from '../primer';
import type { Priyom, Shag } from '../types';

const num = (s: string | undefined): number => Number(s ?? '0');

/* ── 11–30 наизусть ─────────────────────────────────────────── */

function cepKvadrata(n: number): Shag {
  if (n % 10 === 0) return { cep: [`${n}^2`, `${n * n}`] };
  if (n < 20) {
    const k = n - 10;
    return {
      tekst: 'Квадрат суммы: $(10+k)^2 = 100 + 20k + k^2$.',
      cep: [`${n}^2`, `(10+${k})^2`, `100+${20 * k}+${k * k}`, `${n * n}`],
    };
  }
  const base = Math.floor(n / 10) * 10;
  const u = n % 10;
  if (u <= 5) {
    return {
      tekst: `Квадрат суммы: $(${base}+k)^2 = ${base * base} + ${2 * base}k + k^2$.`,
      cep: [`${n}^2`, `(${base}+${u})^2`, `${base * base}+${2 * base * u}+${u * u}`, `${n * n}`],
    };
  }
  const up = base + 10;
  const k = up - n;
  return {
    tekst: `Квадрат разности: $(${up}-k)^2 = ${up * up} - ${2 * up}k + k^2$.`,
    cep: [`${n}^2`, `(${up}-${k})^2`, `${up * up}-${2 * up * k}+${k * k}`, `${n * n}`],
  };
}

export const kvadraty1130: Priyom = {
  id: 'kvadraty-11-30',
  gruppa: 'kvadraty',
  deystvie: 'kvadraty',
  deystviya: ['kvadraty'],
  sozdat(rng, o) {
    const n = o.uroven === 1 ? rng.int(11, 20) : o.uroven === 2 ? rng.int(21, 30) : rng.int(11, 30);
    const koren = o.uroven === 3 && rng.chance(0.5);
    return this.iz([String(n)], o.uroven, koren ? 'koren' : undefined);
  },
  iz(d, uroven, v) {
    const n = num(d[0]);
    if (v === 'koren') {
      return sdelat({
        priyom: 'kvadraty-11-30',
        uroven,
        deystvie: 'kvadraty',
        d,
        v,
        expr: `sqrt(${n * n})`,
      });
    }
    return sdelat({ priyom: 'kvadraty-11-30', uroven, deystvie: 'kvadraty', d, expr: `${n}^2` });
  },
  razbor(p) {
    const n = num(p.d[0]);
    if (p.v === 'koren') {
      return [
        { tekst: `Ищем число, квадрат которого равен $${n * n}$.`, cep: [`${n}^2`, `${n * n}`] },
        { cep: [`sqrt(${n * n})`, `${n}`] },
      ];
    }
    return [cepKvadrata(n)];
  },
};

/* ── Числа на 5 ─────────────────────────────────────────────── */

export const kvadratNa5: Priyom = {
  id: 'kvadrat-na-5',
  gruppa: 'kvadraty',
  deystvie: 'kvadraty',
  deystviya: ['kvadraty'],
  desyatichnye: [3],
  sozdat(rng, o) {
    if (o.uroven === 1) return this.iz([String(rng.int(1, 9))], 1);
    if (o.uroven === 2) return this.iz([String(rng.int(10, 19))], 2);
    if (o.desyatichnye && rng.chance(0.4)) return this.iz([String(rng.int(0, 9))], 3, 'dec');
    return this.iz([String(rng.int(20, 99))], 3);
  },
  iz(d, uroven, v) {
    const a = num(d[0]);
    const expr = v === 'dec' ? `${a}.5^2` : `${10 * a + 5}^2`;
    return sdelat({
      priyom: 'kvadrat-na-5',
      uroven,
      deystvie: 'kvadraty',
      d,
      ...(v ? { v } : {}),
      expr,
    });
  },
  razbor(p) {
    const a = num(p.d[0]);
    const s = a * (a + 1);
    const first: Shag = {
      tekst: `Число без последней пятёрки — $${a}$. Умножаем его на следующее: $${a}\\cdot${a + 1}$.`,
      cep: [`${a}*${a + 1}`, `${s}`],
    };
    if (p.v === 'dec') {
      return [
        first,
        {
          tekst: `Приписываем $25$ и отделяем запятой два знака: у $${a}{,}5$ один знак после запятой, у квадрата — два.`,
          cep: [`(${s}*100+25)/100`, znach(p.expr)],
        },
        { cep: [p.expr, znach(p.expr)] },
      ];
    }
    return [
      first,
      { tekst: 'Приписываем справа $25$.', cep: [`${s}*100+25`, znach(p.expr)] },
      { cep: [p.expr, znach(p.expr)] },
    ];
  },
};

/* ── Около круглых ──────────────────────────────────────────── */

function okolo(R: number, b: number) {
  return { n: R + b, R, b };
}

export const kvadratOkoloKruglyh: Priyom = {
  id: 'kvadrat-okolo-kruglyh',
  gruppa: 'kvadraty',
  deystvie: 'kvadraty',
  deystviya: ['kvadraty'],
  sozdat(rng, o) {
    let R: number;
    let b: number;
    if (o.uroven === 1) {
      R = rng.pick([20, 30, 40, 50, 60, 70, 80, 90]);
      b = rng.pick([-1, 1]);
    } else if (o.uroven === 2) {
      R = rng.pick([50, 100]);
      b = rng.pick([-3, -2, -1, 1, 2, 3]);
    } else {
      R = rng.pick([100, 200, 300, 500, 1000]);
      b = R === 100 ? rng.pick([-5, -4, 4, 5]) : rng.pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]);
    }
    return this.iz([String(R), String(b)], o.uroven);
  },
  iz(d, uroven) {
    const { n } = okolo(num(d[0]), num(d[1]));
    return sdelat({
      priyom: 'kvadrat-okolo-kruglyh',
      uroven,
      deystvie: 'kvadraty',
      d,
      expr: `${n}^2`,
      key: `kvadrat-okolo-kruglyh|${n}`,
    });
  },
  razbor(p) {
    const { n, R, b } = okolo(num(p.d[0]), num(p.d[1]));
    const B = Math.abs(b);
    const z = b > 0 ? '+' : '-';
    return [
      {
        tekst:
          b > 0
            ? `$${n} = ${R} + ${B}$, квадрат суммы: $(a+b)^2 = a^2 + 2ab + b^2$.`
            : `$${n} = ${R} - ${B}$, квадрат разности: $(a-b)^2 = a^2 - 2ab + b^2$.`,
        cep: [
          `${n}^2`,
          `(${R}${z}${B})^2`,
          `${R}^2${z}2*${R}*${B}+${B}^2`,
          `${R * R}${z}${2 * R * B}+${B * B}`,
          `${n * n}`,
        ],
      },
    ];
  },
};

/* ── Около 50 ───────────────────────────────────────────────── */

export const kvadratOkolo50: Priyom = {
  id: 'kvadrat-okolo-50',
  gruppa: 'kvadraty',
  deystvie: 'kvadraty',
  deystviya: ['kvadraty'],
  sozdat(rng, o) {
    if (o.uroven === 1) return this.iz([String(rng.pick([-4, -3, -2, -1, 1, 2, 3, 4]))], 1);
    if (o.uroven === 2) {
      const B = rng.int(1, 9);
      return this.iz([String(rng.chance(0.5) ? B : -B)], 2);
    }
    const B = rng.int(1, 9);
    return this.iz([String(rng.chance(0.5) ? B : -B)], 3, '500');
  },
  iz(d, uroven, v) {
    const b = num(d[0]);
    const n = (v === '500' ? 500 : 50) + b;
    return sdelat({
      priyom: 'kvadrat-okolo-50',
      uroven,
      deystvie: 'kvadraty',
      d,
      ...(v ? { v } : {}),
      expr: `${n}^2`,
    });
  },
  razbor(p) {
    const b = num(p.d[0]);
    const B = Math.abs(b);
    const big = p.v === '500';
    const base = big ? 250 : 25;
    const n = (big ? 500 : 50) + b;
    const head = base + b;
    const tail = B * B;
    const shir = big ? 3 : 2;
    const tailStr = String(tail).padStart(shir, '0');
    return [
      {
        tekst: big
          ? `$${n} = 500 ${b > 0 ? '+' : '-'} ${B}$. Первые цифры: $250 ${b > 0 ? '+' : '-'} ${B}$.`
          : `$${n} = 50 ${b > 0 ? '+' : '-'} ${B}$. Сотни: $25 ${b > 0 ? '+' : '-'} ${B}$.`,
        cep: [`${base}${b > 0 ? '+' : '-'}${B}`, `${head}`],
      },
      {
        tekst: `Последние ${big ? 'три цифры' : 'две цифры'} — квадрат отклонения: $${B}^2 = ${tail}$, пишем $${tailStr}$.`,
        cep: [`${B}^2`, `${tail}`],
      },
      {
        cep: [`${head}*${big ? 1000 : 100}+${tail}`, `${n}^2`, `${n * n}`],
      },
    ];
  },
};

/* ── Через разность квадратов ───────────────────────────────── */

export const kvadratCherezRaznost: Priyom = {
  id: 'kvadrat-cherez-raznost',
  gruppa: 'kvadraty',
  deystvie: 'kvadraty',
  deystviya: ['kvadraty'],
  sozdat(rng, o) {
    const [lo, hi] = o.uroven === 1 ? [21, 39] : o.uroven === 2 ? [41, 79] : [81, 99];
    let a = rng.int(lo, hi);
    while (a % 10 === 0) a = rng.int(lo, hi);
    return this.iz([String(a)], o.uroven);
  },
  iz(d, uroven) {
    const a = num(d[0]);
    return sdelat({
      priyom: 'kvadrat-cherez-raznost',
      uroven,
      deystvie: 'kvadraty',
      d,
      expr: `${a}^2`,
    });
  },
  razbor(p) {
    const a = num(p.d[0]);
    const u = a % 10;
    const B = u <= 5 ? u : 10 - u;
    const round = u <= 5 ? a - B : a + B;
    const other = u <= 5 ? a + B : a - B;
    return [
      {
        tekst: `$a^2 = (a-b)(a+b) + b^2$. Берём $b = ${B}$: одно из чисел $${a} \\pm ${B}$ круглое — $${round}$.`,
        cep: [`${a}^2`, `${round}*${other}+${B}^2`, `${round * other}+${B * B}`, `${a * a}`],
      },
    ];
  },
};

export const KVADRATY: readonly Priyom[] = [
  kvadraty1130,
  kvadratNa5,
  kvadratOkoloKruglyh,
  kvadratOkolo50,
  kvadratCherezRaznost,
];
