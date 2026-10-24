#!/usr/bin/env node
/* scripts/check-zadanie13.mjs — автотест задания №13 «Экономические задачи».

   Запуск: pnpm test:zadanie13

   Сейчас (этап 3, PR 1, ядро) проверяется:
     — точные дроби lib/zadanie13/drob.ts;
     — независимый солвер lib/zadanie13/solver.ts: прямым пересчётом
       таблицы по периодам он воспроизводит ответы задач из материалов
       автора (зачёт, рабочая тетрадь, лист «Дифференцируемый платёж»,
       конспекты), задач ЕГЭ и демоверсий ФИПИ 2026 и 2027;
     — проверка «число верное, единицы нет» (edinicy.ts);
     — сокращённые таблицы 1, 2, 3, …, n−1, n (tablica.ts).
   Когда появятся прототипы, сюда добавится генерация: каждая задача
   банка решается солвером, 1000 задач на тип без ошибок.

   Ненулевой код возврата — есть проблемы, они печатаются списком. */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import { requireSrc } from './lib/load-ts.mjs';

const require = createRequire(import.meta.url);

const { D, kOf } = requireSrc('lib/zadanie13/drob');
const S_ = requireSrc('lib/zadanie13/solver');
const { checkValue, wrongUnitValues } = requireSrc('lib/zadanie13/edinicy');
const { shownRows, toTableModel } = requireSrc('lib/zadanie13/tablica');

const problems = [];
let checks = 0;
const expect = (where, got, want) => {
  checks += 1;
  const ok =
    typeof want === 'object' && want !== null && 'eq' in want
      ? D(got).eq(want)
      : D(got).eq(D(want));
  if (!ok) problems.push(`${where}: получилось ${got}, ждали ${want}`);
};
const findInt = (from, to, pred) => {
  const out = [];
  for (let x = from; x <= to; x++) if (pred(x)) out.push(x);
  return out;
};
const one = (where, list) => {
  checks += 1;
  if (list.length !== 1)
    problems.push(`${where}: ждали ровно одно значение, нашлось ${JSON.stringify(list)}`);
  return list[0];
};

const {
  differentiated: dif,
  byDebts,
  byPayments,
  deposit,
  totalPaid,
  overpay,
  equalPayment,
  loanProblems,
  evenEnds,
} = S_;
const paid = (rows) => totalPaid(rows);
const pct = (rows, S) => overpay(rows).div(S).mul(100);

/* ── Дроби ─────────────────────────────────────────────────────── */
expect('drob: 1,1³', kOf(10).pow(3), D('1.331'));
expect('drob: 0,1 + 0,2', D('0.1').add('0.2'), D('0.3'));
checks += 4;
if (D(1n, 3n).isFiniteDecimal()) problems.push('drob: 1/3 — не конечная дробь');
if (!D('813.5195').isFiniteDecimal()) problems.push('drob: 813,5195 — конечная дробь');
if (D('813.5195').toRu() !== '813,5195') problems.push('drob: запись 813,5195');
if (D(1200000n).toRu() !== '1 200 000') problems.push('drob: запись 1 200 000');

/* ── Зачёт автора (ответы из файла учителя) ───────────────────── */
expect(
  'зачёт 1',
  one(
    'зачёт 1',
    findInt(1, 80, (n) => pct(dif(100, n, 2), 100).eq(25)),
  ),
  24,
);
expect('зачёт 2', pct(byDebts(100, [80, 70, 50, 30, 20, 0], 4), 100), 14);
expect(
  'зачёт 3',
  D(1404)
    .div(paid(dif(1, 16, 2)))
    .mul(1000),
  1200000,
);
expect(
  'зачёт 4',
  paid(dif(900, 18, 4))
    .sub(paid(dif(900, 12, 4)))
    .mul(1000),
  108000,
);
{
  const n = one(
    'зачёт 5: срок',
    findInt(1, 40, (k) => paid(dif(12, k, 10)).eq('18.6')),
  );
  const p = dif(12, n, 10);
  expect('зачёт 5', p[4].payment.sub(p[7].payment).mul(1e6), 360000);
}
{
  const broken = (S) =>
    byDebts(S, [...Array.from({ length: 12 }, (_, i) => S - 30 * (i + 1)), 0], 2);
  const S = one(
    'зачёт 6',
    findInt(361, 3000, (s) => paid(broken(s)).eq('709.2')),
  );
  expect('зачёт 6', S - 360, 240);
}
expect(
  'зачёт 7',
  one(
    'зачёт 7',
    findInt(1, 60, (r) => paid(dif('1.2', 6, [10, 10, 10, r, r, r])).eq('1.68')),
  ),
  15,
);
expect('зачёт 8', paid(dif(800, 8, [10, 10, 10, 10, 15, 15, 15, 15])), 1210);
{
  const rows = byDebts(1, [D('0.75'), D('0.4'), 0], 15);
  const s = Math.min(...findInt(1, 2000, (S) => rows.every((r) => r.payment.mul(S).isInteger())));
  expect('зачёт 9', s, 400);
}
{
  const S = 180;
  const D2 = D(S).mul('0.6');
  const x = equalPayment(D2, 2, 25);
  const rows = byPayments(D2, [x, x], 25);
  checks += 1;
  if (!rows[1].end.eq(0)) problems.push('зачёт 10: два равных платежа не гасят остаток');
  expect('зачёт 10', paid(byDebts(S, [D(S).mul('0.8'), D2], 25)).add(x.mul(2)), 303);
}
expect('зачёт 11', equalPayment(910, 3, 20).mul(3).sub(910), 386);
expect('зачёт 12', equalPayment(4300000, 2, 15), 2645000);
expect(
  'зачёт 13',
  one(
    'зачёт 13',
    findInt(1, 60, (r) =>
      D(1464100)
        .div(equalPayment(1, 4, r))
        .eq(D(2674100).div(equalPayment(1, 2, r))),
    ),
  ),
  10,
);
expect(
  'зачёт 14',
  D(400)
    .mul(kOf(10).pow(2).add(kOf(10)))
    .add(407)
    .div(kOf(10).pow(3))
    .mul(1000),
  1000000,
);
{
  const k = kOf(10);
  const x = D(741000)
    .mul(k.pow(3))
    .div(k.pow(2).add(k.mul(2)).add(4));
  const rows = byPayments(741000, [x, x.mul(2), x.mul(4)], 10);
  checks += 1;
  if (!rows[2].end.eq(0)) problems.push('зачёт 15: долг не погашен');
  expect('зачёт 15', x, 133100);
}
{
  const r = one(
    'зачёт 16',
    findInt(1, 60, (rr) => {
      const k = kOf(rr);
      const S = D(42).div(k.pow(2).sub(1));
      return S.mul(k.pow(2)).mul(k.sub(1)).eq('24.2');
    }),
  );
  expect('зачёт 16', D(42).div(kOf(r).pow(2).sub(1)), 200);
}
expect(
  'зачёт 17',
  Math.max(...findInt(1, 20, (S) => deposit(S, 4, 10, { before: [0, 1, 1, 1] })[3].end.lt(10))),
  4,
);
expect(
  'зачёт 18',
  Math.min(
    ...findInt(1, 200, (S) => {
      const r = deposit(S, 4, 20, { after: [10, 10, 5, 5] });
      return r[1].end.gt(70) && r[3].end.gt(120);
    }),
  ),
  38,
);
expect('зачёт 19', D('2.8').mul(150).sub(D(2).mul(150).mul('1.2')).mul(1000), 60000);
{
  const S = D(133100)
    .mul(kOf(10).pow(2).add(kOf(10)).add(1))
    .div(kOf(10).pow(3));
  const rows = deposit(S, 3, 10, { after: [-133100, -133100, -133100] });
  checks += 1;
  if (!rows[2].end.eq(0)) problems.push('зачёт 20: вклад не обнулился');
  expect('зачёт 20', S, 331000);
}

/* ── Рабочая тетрадь «Дифференцированный платёж» ──────────────── */
expect('тетрадь 1', overpay(dif(60000, 4, 10)), 15000);
expect('тетрадь 2', pct(dif(1, 8, 12), 1).sub(pct(dif(1, 20, 5), 1)), '1.5');
{
  const S = D(24).div(dif(1, 21, 4)[10].payment);
  expect('тетрадь 3', paid(dif(S, 21, 4)), 504);
}
expect(
  'тетрадь 4',
  one(
    'тетрадь 4',
    findInt(1, 50, (r) => pct(dif(1, 8, r), 1).eq(45)),
  ),
  10,
);
expect(
  'тетрадь 5',
  one(
    'тетрадь 5',
    findInt(1, 80, (n) => pct(dif(1, n, 4), 1).eq(26)),
  ),
  12,
);
{
  const p = dif(1, 20, 2);
  const S = D(1310).div(p.slice(0, 10).reduce((a, x) => a.add(x.payment), D(0)));
  expect('тетрадь 6', paid(dif(S, 20, 2).slice(10)), 1110);
}
expect(
  'тетрадь 7',
  D(
    one(
      'тетрадь 7',
      findInt(1, 100, (x) => dif(1, 40, D(x, 10))[0].payment.eq(D(1, 25))),
    ),
  ).div(10),
  '1.5',
);
expect('тетрадь 8', pct(dif(1, 15, 3), 1), 24);
expect('тетрадь 9', pct(byDebts(100, [85, 70, 55, 40, 20, 0], 4), 100), '14.8');
{
  const rows = byDebts(1, [D('0.8'), D('0.5'), 0], 25);
  const min = rows.reduce((m, r) => (r.payment.lt(m) ? r.payment : m), rows[0].payment);
  expect('тетрадь 10', Math.min(...findInt(1, 100, (S) => min.mul(S).gt(4))), 9);
}
expect(
  'тетрадь 11',
  Math.max(
    ...findInt(1, 60, (r) =>
      paid(byDebts(1, [D('0.8'), D('0.6'), D('0.4'), D('0.2'), D('0.1'), 0], r)).lt('1.25'),
    ),
  ),
  8,
);
expect('тетрадь 12а', dif(900000, 5, 2)[2].payment, 190800);
expect('тетрадь 12б', paid(dif(900000, 5, 2)), 954000);
expect('тетрадь 13', D(78000).div(dif(1, 10, 3)[0].payment), 600000);
{
  const r = one(
    'тетрадь 14',
    findInt(1, 500, (x) => {
      const p = dif(1, 7, D(x, 10));
      return p[0].payment.div(p[6].payment).eq(D(5, 3));
    }),
  );
  expect('тетрадь 14', pct(dif(1, 7, D(r, 10)), 1), 50);
}
expect(
  'тетрадь 15',
  one(
    'тетрадь 15',
    findInt(1, 40, (t) => pct(dif(1, 19, t), 1).eq(40)),
  ),
  4,
);

/* ── Лист «Дифференцируемый платёж», конспекты, ДЗ, повторение ── */
expect(
  'лист 3',
  D(29.6)
    .div(dif(1, 31, 3)[15].payment)
    .mul(paid(dif(1, 31, 3))),
  '917.6',
);
expect(
  'лист 10',
  Math.min(
    ...findInt(1, 100, (S) =>
      byDebts(1, [D('0.7'), D('0.3'), 0], 30).every((r) => r.payment.mul(S).gt(3)),
    ),
  ),
  8,
);
{
  const rows = byDebts(1, [D('0.7'), D('0.4'), 0], 25);
  const ps = rows.map((r) => r.payment);
  const spread = ps.reduce((m, x) => (x.gt(m) ? x : m)).sub(ps.reduce((m, x) => (x.lt(m) ? x : m)));
  expect('лист 12', Math.max(...findInt(1, 100, (S) => spread.mul(S).lt(1))), 13);
}
expect(
  'конспект 21.12 №7 (r)',
  one(
    '21.12 №7',
    findInt(1, 60, (r) => paid(dif('2.5', 10, [12, 12, 12, 12, 12, r, r, r, r, r])).eq(4)),
  ),
  8,
);
{
  const broken = (S, X, m, r) =>
    byDebts(S, [...Array.from({ length: m }, (_, i) => D(S).sub(D(X).mul(i + 1))), 0], r);
  expect(
    'конспект 21.12 №5',
    one(
      '21.12 №5',
      findInt(501, 3000, (S) => paid(broken(S, 20, 25, 3)).eq(1407)),
    ) - 500,
    400,
  );
  expect(
    'конспект 21.12 №8',
    one(
      '21.12 №8',
      findInt(601, 3000, (S) => paid(broken(S, 30, 20, 3)).eq(1604)),
    ),
    1100,
  );
  expect(
    'IMG_0952',
    one(
      'IMG_0952',
      findInt(801, 3000, (S) => paid(broken(S, 80, 10, 3)).eq(1198)),
    ) - 800,
    200,
  );
  expect(
    'IMG_0945 №20',
    one(
      'IMG_0945',
      findInt(901, 3000, (S) => paid(broken(S, 50, 18, 2)).eq(1209)),
    ) - 900,
    100,
  );
  expect(
    'IMG_0951 №5 (r)',
    one(
      'IMG_0951 №5',
      findInt(1, 40, (r) => paid(broken(900, 20, 30, r)).eq(1272)),
    ),
    2,
  );
  expect(
    'IMG_0951 №6 (n)',
    one(
      'IMG_0951 №6',
      findInt(1, 100, (n) => paid(broken(700, D(400, n), n, 1)).eq(755)),
    ),
    10,
  );
  expect(
    'IMG_0951 №7 (n)',
    one(
      'IMG_0951 №7',
      findInt(1, 100, (n) => paid(broken(600, D(400, n), n, 3)).eq(852)),
    ),
    20,
  );
  expect('ЕГЭ-2018 (300 тыс., 21 мес.)', paid(broken(300, 10, 20, 2)), 384);
}
{
  const ends = [
    ...Array.from({ length: 5 }, (_, i) => 1500 - 160 * (i + 1)),
    ...Array.from({ length: 5 }, (_, i) => 700 - 140 * (i + 1)),
  ];
  expect('повторение №4 (долг 2030)', paid(byDebts(1500, ends, 10)), 2300);
  const x = equalPayment(1, 1, 10);
  checks += 1;
  if (!x.eq('1.1')) problems.push('повторение: один платёж = 1,1S');
}
expect(
  'повторение №1',
  (() => {
    const k = kOf(10);
    const d = D('634.5').mul(k).sub(100).mul(k).sub(100);
    return d.mul(k).add(200);
  })(),
  '813.5195',
);
expect(
  'повторение №3',
  dif(1800, 24, 1)
    .slice(0, 12)
    .reduce((a, r) => a.add(r.payment), D(0)),
  '1066.5',
);
expect('ДЗ-21 №1', pct(byDebts(100, [90, 80, 70, 60, 50, 0], 5), 100), '22.5');

/* ── Аннуитет, льготный, вклады: фото ЕГЭ и Ларина ─────────────── */
expect('IMG_2487 №1', equalPayment(550000, 2, 20).mul(2), 720000);
expect('IMG_2487 №2', equalPayment(8052000, 4, 20), 3110400);
expect(
  'IMG_2487 №3',
  equalPayment(4026000, 4, 20)
    .mul(4)
    .sub(equalPayment(4026000, 2, 20).mul(2)),
  950400,
);
expect('IMG_0946 №4', D('2.16').div(equalPayment(1, 3, 20)), '4.55');
expect(
  'IMG_0946 №5',
  D(48250)
    .div(equalPayment(1, 3, 20).mul(3).sub(1))
    .add(48250),
  162000,
);
expect(
  'IMG_0946 №7',
  Math.min(...findInt(1, 30, (n) => !equalPayment(1300000, n, 10).gt(350000))),
  5,
);
expect(
  'IMG_0946 №8',
  one(
    'IMG_0946 №8',
    findInt(1, 80, (r) => byPayments(300000, [260000, 169000], r)[1].end.eq(0)),
  ),
  30,
);
expect('IMG_2488 №6', D(78030).div(equalPayment(1, 3, 30).mul(3).sub(1)), 119700);
expect(
  'IMG_2488 №7',
  one(
    'IMG_2488 №7',
    findInt(1, 80, (r) => byPayments(400000, [330000, 121000], r)[1].end.eq(0)),
  ),
  10,
);
expect('IMG_2488 №9', equalPayment(419375, 4, 20).mul(4), 648000);
{
  const x = one(
    'IMG_2488 №8',
    findInt(1, 800, (xx) => {
      const rows = byPayments(800, [xx, xx], 20);
      const y = rows[1].end.mul(kOf(20));
      return D(2 * xx)
        .add(y)
        .eq('1254.4');
    }),
  );
  expect('IMG_2488 №8 (ЕГЭ-2022)', x, 200);
}
const lgot = (S, m, n, r) => {
  const x = equalPayment(S, n - m, r);
  return D(S)
    .mul(kOf(r).sub(1))
    .mul(m)
    .add(x.mul(n - m));
};
expect(
  'IMG_5099 №10',
  one(
    'IMG_5099 №10',
    findInt(1, 80, (r) => lgot(220, 3, 5, r).eq(420)),
  ),
  20,
);
expect('IMG_5099 №11', Math.max(...findInt(1, 100, (S) => lgot(S, 3, 5, 20).lt(7))), 3);
expect('IMG_5099 №12', Math.min(...findInt(1, 100, (S) => lgot(S, 3, 5, 20).gt(10))), 6);
expect(
  'IMG_5099 №13',
  one(
    'IMG_5099 №13',
    findInt(1, 80, (r) => lgot('4.2', 3, 5, r).eq('6.1')),
  ),
  10,
);
expect(
  'IMG_5099 №14',
  one(
    'IMG_5099 №14',
    findInt(1, 80, (r) =>
      D(38016)
        .div(equalPayment(1, 3, r))
        .eq(D(52416).div(equalPayment(1, 2, r))),
    ),
  ),
  20,
);
expect(
  'IMG_5099 №15',
  one(
    'IMG_5099 №15',
    findInt(1, 80, (r) =>
      D(58564)
        .div(equalPayment(1, 4, r))
        .eq(D(106964).div(equalPayment(1, 2, r))),
    ),
  ),
  10,
);
{
  const k = kOf(10);
  expect(
    'IMG_0946 №6',
    D(270200)
      .mul(k.pow(3))
      .div(k.pow(2).add(k.mul(3)).add(9)),
    26620,
  );
}
expect(
  'IMG_0945 №19',
  Math.min(
    ...findInt(1, 1000, (S) => {
      const r = deposit(S, 4, 40, { after: [40, 40, 20, 20] });
      return r[1].end.gt(270) && r[3].end.gt(490);
    }),
  ),
  89,
);
expect(
  'IMG_0955 №1',
  deposit(10000, 3, 10)
    .at(-1)
    .end.sub(deposit(10000, 3, 10, { after: [-2000, 2000, 0] }).at(-1).end),
  220,
);
{
  const k = kOf(50);
  const x = D(3900)
    .mul('8.25')
    .sub(D(3900).mul(k.pow(5)))
    .div(k.pow(4).add(k.pow(3)).add(k.pow(2)).add(k));
  const r = deposit(3900, 5, 50, { after: [x, x, x, x, 0] });
  checks += 1;
  if (!r[4].end.eq(D(3900).mul('8.25'))) problems.push('IMG_0955 №3: итог не 8,25S');
  expect('IMG_0955 №3', x, 210);
}
expect(
  'IMG_0955 №4',
  one(
    'IMG_0955 №4',
    findInt(1, 200, (a) =>
      kOf(a)
        .mul(D(3, 4))
        .mul(kOf(a + 40))
        .eq('1.44'),
    ),
  ) + 40,
  60,
);
{
  // Ларин №82: a = S·kA/6, b = S·kB/6 из двух линейных уравнений, затем S/6 из второго года.
  const a = D(3350 - 710, 24),
    b = D(670).sub(a.mul(5));
  const s = a.mul(a).mul(5).add(b.mul(b)).div(749);
  expect('IMG_0955 №2', a.mul(a.div(s)).add(b.mul(5).mul(b.div(s))), 841);
}
expect(
  '738d827e №2',
  Math.min(...findInt(1, 40, (n) => kOf(8).mul(kOf(n).pow(2)).gt(kOf(10).pow(3)))),
  12,
);

/* ── Демоверсии ФИПИ ───────────────────────────────────────────── */
expect('демо-2027 №13 (182 000, 3 платежа)', equalPayment(182000, 3, 20).mul(3), 259200);
{
  const ends = [
    ...Array.from({ length: 5 }, (_, i) => 800 - 120 * (i + 1)),
    ...Array.from({ length: 5 }, (_, i) => 200 - 40 * (i + 1)),
  ];
  expect(
    'демо-2026 №16 (r)',
    one(
      'демо-2026',
      findInt(1, 60, (r) => paid(byDebts(800, ends, r)).eq(1480)),
    ),
    20,
  );
}

/* ── Решения автора: «известные платежи» таблицей диф. платежа ─── */
{
  // ЕГЭ-2022: долг после двух равных платежей x, сумма = S + переплата.
  const x = 200,
    k = kOf(20);
  const d1 = D(800).mul(k).sub(x),
    d2 = d1.mul(k).sub(x);
  expect('Б7 через переплату', D(800).add(D('0.2').mul(D(800).add(d1).add(d2))), '1254.4');
}

/* ── Корректность кредита ──────────────────────────────────────── */
checks += 2;
if (loanProblems(dif(1000, 4, 10)).length)
  problems.push('loanProblems: дифференцированный кредит помечен ошибочным');
if (!loanProblems(byPayments(1000, [100, 100], 10)).length)
  problems.push('loanProblems: непогашенный кредит не замечен');

/* ── Единицы ответа ────────────────────────────────────────────── */
const units = [
  [1200, 1200000, 'rub', 'units'],
  [1.2, 1200000, 'rub', 'units'],
  [1200000, 1200000, 'rub', 'right'],
  [240000, 240, 'thous', 'units'],
  [240, 240, 'thous', 'right'],
  [241, 240, 'thous', 'wrong'],
  [20, 20, 'percent', 'right'],
  [0.2, 20, 'percent', 'wrong'],
];
for (const [input, answer, u, want] of units) {
  checks += 1;
  const got = checkValue(input, answer, u);
  if (got !== want)
    problems.push(`единицы: ${input} при ответе ${answer} ${u} → ${got}, ждали ${want}`);
}
checks += 1;
if (wrongUnitValues(20, 'percent').length)
  problems.push('единицы: у процентов не бывает «чужих единиц»');

/* ── Таблицы ───────────────────────────────────────────────────── */
const sr = (n, extra) => JSON.stringify(shownRows(n, extra));
const tables = [
  [4, [], '[1,2,3,4]'],
  [21, [], '[1,2,3,0,20,21]'],
  [21, [11], '[1,2,3,0,11,0,20,21]'],
  [20, [10, 11], '[1,2,3,0,10,11,0,19,20]'],
];
for (const [n, extra, want] of tables) {
  checks += 1;
  if (sr(n, extra) !== want)
    problems.push(`таблица ${n} строк ${JSON.stringify(extra)}: ${sr(n, extra)}, ждали ${want}`);
}
{
  const tm = toTableModel(dif(1000, 4, 10), 'dif', 'month');
  checks += 1;
  if (tm.totals.change !== 1000 || tm.totals.interest !== 250 || tm.totals.payment !== 1250)
    problems.push('таблица Пети: итоги не 1000 / 250 / 1250');
  checks += 1;
  if (JSON.stringify(evenEnds(1000, 4).map(String)) !== '["750","500","250","0"]')
    problems.push('evenEnds');
}

/* ── Теория: правила с примерами, «Важно» не одно, формулы собираются ── */
{
  const katex = require('katex');
  const { findPlainMath, findRawTex, stripDollarMath } = await import('./lib/math-markup.mjs');
  const { GLAVY_13, PRIZNAKI } = requireSrc('content/teoriya13');
  const { generate: gen13 } = requireSrc('lib/zadanie13/generate');
  const tx = (t, where) => {
    try {
      katex.renderToString(t, { throwOnError: true, strict: 'error' });
    } catch (e) {
      problems.push(`теория ${where}: KaTeX «${t.slice(0, 50)}»: ${e.message.slice(0, 100)}`);
    }
  };
  const txt = (t, where) => {
    for (const m of t.matchAll(/\$([^$]+)\$/g)) tx(m[1], where);
    const plain = stripDollarMath(t).replace(/\*\*/g, '');
    for (const f of [...findPlainMath(plain), ...findRawTex(plain)])
      problems.push(`теория ${where}: вне KaTeX (${f.rule}): «${f.match}»`);
  };
  const ids = new Set();
  for (const g of GLAVY_13) {
    checks += 1;
    if (ids.has(g.id)) problems.push(`теория: повтор id ${g.id}`);
    ids.add(g.id);
    txt(g.lead, g.id);
    if (/\$/.test(g.title))
      problems.push(`теория ${g.id}: в названии главы формула — содержание её не наберёт`);
    for (const p of g.podrazdely) {
      if (ids.has(p.id)) problems.push(`теория: повтор id ${p.id}`);
      ids.add(p.id);
      for (const b of p.bloki) {
        const w = `${p.id}/${b.vid}${b.title ? ' «' + b.title.slice(0, 30) + '»' : ''}`;
        checks += 1;
        if (b.title) txt(b.title, w);
        if (b.vid === 'kartochka') {
          txt(b.text, w);
          if (b.tex) tx(b.tex, w);
          (b.spisok ?? []).forEach((x) => txt(x, w));
          if (b.pochemu) txt(b.pochemu, w);
          if ((b.rol === 'pravilo' || b.rol === 'vazhno') && !b.primer)
            problems.push(`теория ${w}: у правила и «Важно» нужен пример`);
          if (b.rol === 'vazhno' && !b.pochemu)
            problems.push(`теория ${w}: «Важно» без «Почему это работает»`);
          if (b.primer) {
            txt(b.primer.uslovie, w);
            for (const st of b.primer.shagi) {
              txt(st.title + ' ' + st.text, w);
              if (st.tex) tx(st.tex, w);
            }
            if (b.primer.otvet) txt(b.primer.otvet, w);
          }
        }
        if (b.vid === 'tablitsa') {
          b.tablitsa.rows.flat().forEach((c) => tx(c, w));
          b.tablitsa.labels.forEach((c) => tx(c, w));
          (b.tablitsa.itog ?? []).filter(Boolean).forEach((c) => tx(c, w));
          if (b.tablitsa.podpis) txt(b.tablitsa.podpis, w);
        }
        if (b.vid === 'proporciya') {
          b.stroki.flat().forEach((c) => tx(c, w));
          tx(b.vyvod, w);
        }
        if (b.vid === 'risunok') txt(b.podpis, w);
        if (b.vid === 'razbor') {
          try {
            const t = gen13(b.prototypeId, b.seed);
            if (!t.solution.length) problems.push(`теория ${w}: разбор без решения`);
          } catch (e) {
            problems.push(`теория ${w}: разбор не собрался: ${e.message}`);
          }
        }
        if (b.vid === 'opredeli') b.zadachi.forEach((z) => (txt(z.text, w), txt(z.priznak, w)));
      }
    }
  }
  PRIZNAKI.forEach((p) => (txt(p.vizhu, 'признаки'), txt(p.pochemu, 'признаки')));
  /* Типы называются словами, без букв: «тип А» в тексте теории недопустим. */
  const all = JSON.stringify(GLAVY_13);
  if (/тип\s+[АБВГ]\b/.test(all)) problems.push('теория: типы должны называться словами, без букв');
}

/* ── Банк: 10 вариантов на прототип ────────────────────────────── */
{
  const bankFile = new URL('../src/lib/zadanie13/bank.ts', import.meta.url);
  const { BANK_13 } = fs.existsSync(bankFile) ? requireSrc('lib/zadanie13/bank') : { BANK_13: [] };
  if (!BANK_13.length) problems.push('банк не собран: pnpm build:bank-13');
  const { generate, prototypes } = requireSrc('lib/zadanie13/generate');
  const ids = prototypes().map((p) => p.id);
  const byProto = new Map();
  for (const [id, seed] of BANK_13) {
    if (!byProto.has(id)) byProto.set(id, []);
    byProto.get(id).push(generate(id, seed));
  }
  for (const id of ids) {
    const list = byProto.get(id) ?? [];
    checks += 1;
    if (list.length !== 10) problems.push(`банк ${id}: ${list.length} вариантов вместо 10`);
    const sig = new Set(list.map((t) => JSON.stringify(t.params)));
    const who = new Set(list.map((t) => t.plot.who));
    const cond = new Set(list.map((t) => t.condition));
    if (sig.size !== list.length || who.size !== list.length || cond.size !== list.length)
      problems.push(`банк ${id}: повторяются числа, имя или условие`);
  }
  for (const id of byProto.keys())
    if (!ids.includes(id)) problems.push(`банк: прототипа ${id} нет в реестре`);
}

/* ── Опорные задачи: 17 блоков по 10, ответы открываются ──────── */
{
  const katex = require('katex');
  const { findPlainMath, findRawTex, stripDollarMath } = await import('./lib/math-markup.mjs');
  const { BLOKI_13, zadachiBloka } = requireSrc('lib/zadanie13/opornye/bloki');
  const { sealZadacha13 } = requireSrc('lib/zadanie13/opornye/seal');
  const { generate, prototypes } = requireSrc('lib/zadanie13/generate');
  const secret = requireSrc('lib/zadanie13/secret');
  const { TYPE_NAMES } = requireSrc('lib/zadanie13/types');
  const txt = (t, where) => {
    for (const m of t.matchAll(/\$([^$]+)\$/g)) {
      try {
        katex.renderToString(m[1], { throwOnError: true, strict: 'error' });
      } catch (e) {
        problems.push(`опорные ${where}: KaTeX «${m[1].slice(0, 50)}»: ${e.message.slice(0, 100)}`);
      }
    }
    const plain = stripDollarMath(t);
    for (const f of [...findPlainMath(plain), ...findRawTex(plain)])
      problems.push(`опорные ${where}: вне KaTeX (${f.rule}): «${f.match}»`);
  };
  if (BLOKI_13.length !== 17) problems.push(`опорные: блоков ${BLOKI_13.length} вместо 17`);
  const slugs = new Set();
  const covered = new Set();
  BLOKI_13.forEach((b, i) => {
    checks += 1;
    const w = `блок ${b.no}`;
    if (b.no !== String(i + 1).padStart(2, '0')) problems.push(`опорные ${w}: номер не по порядку`);
    if (slugs.has(b.slug)) problems.push(`опорные ${w}: повтор адреса ${b.slug}`);
    slugs.add(b.slug);
    /* Карточка без формул: название и описание — простой текст. */
    if (/[$\\]/.test(b.nazvanie + b.lead)) problems.push(`опорные ${w}: формула на карточке`);
    txt(b.nazvanie + ' ' + b.lead, w);
    b.zapomni.forEach((z) => txt(z, `${w} «Запомни»`));
    if (/тип\s+[АБВГABCD]\b/.test(JSON.stringify(b))) problems.push(`опорные ${w}: тип буквой`);
    const list = zadachiBloka(b);
    if (list.length !== 10) problems.push(`опорные ${w}: ${list.length} задач вместо 10`);
    const keys = new Set(list.map((z) => `${z.prototypeId}:${z.seed}`));
    if (keys.size !== list.length) problems.push(`опорные ${w}: задачи повторяются`);
    if (b.vid === 'zadachi') {
      for (const id of b.prototipy) covered.add(id);
      if (!b.prototipy.every((id) => list.some((z) => z.prototypeId === id)))
        problems.push(`опорные ${w}: не каждый прототип блока попал в задачи`);
      /* Повышенный уровень — в конце блока. */
      const hard = list.map((z) => generate(z.prototypeId, z.seed).difficulty === 'hard');
      if (hard.some((h, k) => !h && hard.slice(0, k).some(Boolean)))
        problems.push(`опорные ${w}: базовая задача после повышенной`);
    }
    for (const z of list) {
      checks += 1;
      const zw = `${w} №${z.no} ${z.prototypeId}:${z.seed}`;
      const t = generate(z.prototypeId, z.seed);
      const sealed = sealZadacha13(z.prototypeId, z.seed, b.vid, z.no);
      try {
        const shagi = JSON.parse(secret.openText(sealed.podskazki, sealed.seal));
        const razbor = JSON.parse(secret.openText(sealed.razbor, sealed.seal));
        if (!shagi.length || !razbor.shagi.length || !razbor.otvet)
          problems.push(`опорные ${zw}: пустые подсказка или решение`);
      } catch {
        problems.push(`опорные ${zw}: подсказка или решение не открываются`);
      }
      if (sealed.uslovieHtml.includes('$')) problems.push(`опорные ${zw}: формула не набрана`);
      if (t.source === 'own' && !sealed.metki.includes('не из открытого банка'))
        problems.push(`опорные ${zw}: нет пометки «не из открытого банка»`);
      if (b.vid === 'tip') {
        const right = sealed.vybory.find((v) => secret.choiceMatches(v.number, sealed.seal));
        if (!right || right.label !== TYPE_NAMES[t.type])
          problems.push(`опорные ${zw}: верный выбор — не схема задачи`);
      } else {
        const answer = String(t.answer).replace('.', ',');
        if (!secret.answerMatches(answer, sealed.seal))
          problems.push(`опорные ${zw}: ответ не сходится с отпечатком`);
        if (sealed.wrongUnits.some((u) => secret.answerMatches(answer, u)))
          problems.push(`опорные ${zw}: верный ответ попал в «чужие единицы»`);
      }
    }
  });
  const tipy = new Set(zadachiBloka(BLOKI_13[16]).map((z) => z.prototypeId[0]));
  if (tipy.size !== 4) problems.push('опорные «Определи тип»: нужны все четыре схемы');
  for (const p of prototypes())
    if (!covered.has(p.id)) problems.push(`опорные: прототип ${p.id} не попал ни в один блок`);
}

/* ── Генерация: все прототипы ──────────────────────────────────── */
{
  const katex = require('katex');
  const { findPlainMath, findRawTex, stripDollarMath } = await import('./lib/math-markup.mjs');
  const typeset = (t, where) => {
    try {
      katex.renderToString(t, { throwOnError: true, strict: 'error' });
    } catch (e) {
      problems.push(`${where}: KaTeX «${t.slice(0, 60)}»: ${e.message.slice(0, 120)}`);
    }
  };
  const inline = (text, where) => {
    for (const m of text.matchAll(/\$([^$]+)\$/g)) typeset(m[1], where);
    const plain = stripDollarMath(text).replace(/\*\*/g, '');
    for (const f of [...findPlainMath(plain), ...findRawTex(plain)])
      problems.push(`${where}: вне KaTeX (${f.rule}): «${f.match}»`);
  };
  const { generate, prototypes } = requireSrc('lib/zadanie13/generate');
  /* Не меньше 1000 задач на тип: число seed на прототип зависит от того, сколько прототипов в типе. */
  const byType = {};
  for (const p of prototypes()) byType[p.type] = (byType[p.type] ?? 0) + 1;
  const seedsFor = (type) => Number(process.env.Z13_SEEDS ?? Math.ceil(1000 / byType[type]));
  const only = process.env.Z13_ONLY;
  const counts = {};
  for (const info of prototypes()) {
    if (only && !info.id.startsWith(only)) continue;
    const seen = new Set();
    const perProto = seedsFor(info.type);
    for (let i = 0; i < perProto; i++) {
      const where = `${info.id} seed s${i}`;
      let t;
      try {
        t = generate(info.id, `s${i}`);
      } catch (e) {
        problems.push(`${where}: ${e.message}`);
        break;
      }
      checks += 1;
      counts[info.type] = (counts[info.type] ?? 0) + 1;
      seen.add(t.condition);
      inline(t.condition, where + ' условие');
      for (const st of t.solution) {
        inline(st.title + ' ' + st.text, where + ' решение');
        if (st.formula) typeset(st.formula, where + ' формула');
      }
      for (const h of t.hints) {
        inline(h.question, where + ' подсказка');
        h.options.forEach((o) => inline(o, where + ' вариант'));
        if (h.comment) inline(h.comment, where + ' комментарий');
        if (
          !(h.correct >= 0 && h.correct < h.options.length) ||
          new Set(h.options).size !== h.options.length
        )
          problems.push(`${where}: подсказка без верного варианта или с повтором`);
      }
      const again = generate(info.id, `s${i}`);
      if (again.condition !== t.condition || again.answer !== t.answer)
        problems.push(`${where}: не воспроизводится по seed`);
    }
    if (seen.size < Math.min(perProto, 10))
      problems.push(`${info.id}: из ${perProto} задач разных условий только ${seen.size}`);
  }
  console.log('сгенерировано по типам:', JSON.stringify(counts));
}

if (problems.length) {
  console.error(`check-zadanie13: проблем ${problems.length} из ${checks} проверок`);
  for (const p of problems) console.error('  — ' + p);
  process.exit(1);
}
console.log(`check-zadanie13: ${checks} проверок, все прошли.`);
