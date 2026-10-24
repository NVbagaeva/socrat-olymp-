/**
 * Шаблон решения задачи на дифференцированный платёж через переплату
 * (решение автора от 24.10.2026). Всё — в переменных, числа
 * подставляются только там, где их требует шаблон:
 *
 *  1. Определяем тип платежа — одна строка с признаком из условия.
 *  2. Вводим обозначения: S, n, r; сумма изменения долга S/n.
 *  3. Рамка «Вспоминаем: как найти r % от числа S» — пропорцией.
 *  4. Таблица в переменных (стрелка «Переплата → Долг на начало»).
 *  5. Складываем переплаты: полная сумма, плашка про nS/n, общий
 *     множитель, сумма прогрессии, упрощение до k·S.
 *  6. Переплата в процентах от суммы кредита — пропорцией.
 *
 * Последний шаг — ответ на вопрос задачи — пишет прототип: он зависит
 * от формулировки (Task13.vopros). Каждое промежуточное число шаблон
 * отдаёт наружу (itogi), автотест сверяет его с солвером.
 */

import { D, type Drob } from './drob';
import { tex, TIP_VYVOD } from './proto/common';
import { months, years } from './text';
import type { ShagBlok, SolutionStep, TablitsaPeremennye } from './types';

export interface Kredit13 {
  /** Число периодов; null — неизвестно, в решении буква n. */
  n: number | null;
  /** Ставка в процентах; null — неизвестна, в решении буква. */
  r: Drob | null;
  /** Буква ставки: r или t (как в условии). */
  bukva?: string;
  /** «первый банк», «срок 24 месяца» — когда кредитов два. */
  imya?: string;
  /** То же в родительном падеже: «для первого банка». */
  kogo?: string;
}

export interface DifItog {
  /** Переплата в долях кредита: P = koef · S; null — в ответе есть буква. */
  koef: Drob | null;
  /** Сумма прогрессии n + (n − 1) + … + 1; null — n неизвестно. */
  summa: number | null;
  /** Переплата в процентах от кредита; null — в ответе есть буква. */
  procent: Drob | null;
  /** То же в TeX: «42», «6t», «\dfrac{(n+1)\cdot 3}{2}». */
  procentTex: string;
  /** Обозначение переплаты: P, P_1, P_2. */
  P: string;
  /** Обозначение процента: x, x_1, x_2. */
  x: string;
}

const fr = (a: string, b: string | number) => `\\dfrac{${a}}{${b}}`;

/** Множитель «k» в записи kS/n: число или выражение с n. */
type Mnozh = number | string;

function dolya(m: Mnozh, n: number | null): string {
  const nT = n === null ? 'n' : String(n);
  if (m === 0) return '0';
  if (m === 1) return fr('S', nT);
  return fr(`${m}S`, nT);
}

function stavka(k: Kredit13): string {
  return fr(k.r === null ? (k.bukva ?? 'r') : tex(k.r), 100);
}

/** «Первый банк: $n = 11$, $r = 7$». */
function podpis(k: Kredit13, period: 'month' | 'year'): string {
  const b = k.bukva ?? 'r';
  const chasti = [
    k.n === null ? '' : `$n = ${k.n}$ (${period === 'year' ? years(k.n) : months(k.n)})`,
    k.r === null ? '' : `$${b} = ${tex(k.r)}$`,
  ].filter(Boolean);
  const imya = k.imya ? `${k.imya.charAt(0).toUpperCase()}${k.imya.slice(1)}` : '';
  return [imya, chasti.join(', ')].filter(Boolean).join(': ');
}

/** Таблица в переменных: строки 1–3, «…», n − 1, n (до пяти строк — все). */
function tablitsa(k: Kredit13, period: 'month' | 'year', P: string): TablitsaPeremennye {
  const b = k.bukva ?? 'r';
  const rT = stavka(k);
  const cell = (start: Mnozh, end: Mnozh, pervaya: boolean, n: number | null) => {
    const nT = n === null ? 'n' : String(n);
    const nachalo = pervaya ? fr(`${nT}S`, nT) : dolya(start, n);
    return [
      pervaya ? `S = ${nachalo}` : nachalo,
      dolya(1, n),
      `${nachalo}\\cdot ${rT}`,
      dolya(end, n),
    ] as [string, string, string, string];
  };
  let rows: TablitsaPeremennye['rows'];
  if (k.n === null) {
    rows = [
      { label: '1', cells: cell('n', '(n-1)', true, null) },
      { label: '2', cells: cell('(n-1)', '(n-2)', false, null) },
      { label: '3', cells: cell('(n-2)', '(n-3)', false, null) },
      null,
      { label: 'n-1', cells: cell(2, 1, false, null) },
      { label: 'n', cells: cell(1, 0, false, null) },
    ];
  } else {
    const n = k.n;
    const pokaz = n <= 5 ? Array.from({ length: n }, (_, i) => i + 1) : [1, 2, 3, 0, n - 1, n];
    rows = pokaz.map((j) =>
      j === 0 ? null : { label: String(j), cells: cell(n - j + 1, n - j, j === 1, n) },
    );
  }
  const kogda = period === 'year' ? 'года' : 'месяца';
  return {
    podpis: podpis(k, period),
    period,
    rows,
    itog: ['S', P],
    strelka:
      k.r === null
        ? `$${b}\\,\\%$ начисляется на долг на начало ${kogda}`
        : `$${b}\\,\\% = ${tex(k.r)}\\,\\%$ начисляется на долг на начало ${kogda}`,
  };
}

/** Слагаемые переплаты: все при n ≤ 4, иначе два первых, «…» и последнее. */
function slagaemye(k: Kredit13): string {
  const rT = stavka(k);
  if (k.n === null) {
    return [fr('nS', 'n'), fr('(n-1)S', 'n'), '\\dots', fr('S', 'n')]
      .map((t) => (t === '\\dots' ? t : `${t}\\cdot ${rT}`))
      .join(' + ');
  }
  const n = k.n;
  const term = (j: number) => `${j === 1 ? fr(`${n}S`, n) : dolya(n - j + 1, n)}\\cdot ${rT}`;
  const js = n <= 4 ? Array.from({ length: n }, (_, i) => i + 1) : [1, 2, 0, n];
  return js.map((j) => (j === 0 ? '\\dots' : term(j))).join(' + ');
}

function chleny(n: number | null): string {
  if (n === null) return 'n + (n-1) + \\dots + 1';
  const js = n <= 4 ? Array.from({ length: n }, (_, i) => n - i) : [n, n - 1, 0, 1];
  return js.map((j) => (j === 0 ? '\\dots' : String(j))).join(' + ');
}

/** Шаг «Складываем переплаты» и итог одного кредита. */
function skladyvaem(
  k: Kredit13,
  P: string,
  x: string,
  period: 'month' | 'year',
): { shag: SolutionStep; itog: DifItog } {
  const b = k.bukva ?? 'r';
  const rT = stavka(k);
  const nT = k.n === null ? 'n' : String(k.n);
  const obshiy = `${fr('S', nT)}\\cdot ${rT}`;
  const bloki: ShagBlok[] = [{ vid: 'formula', tex: `${P} = ${slagaemye(k)}` }];
  if (k.n !== 1) {
    bloki.push({
      vid: 'plashka',
      text: `В первом слагаемом $S$ записали как $${fr(`${nT}S`, nT)}$ — домножили на $${fr(nT, nT)}$, чтобы у всех слагаемых был общий множитель $${obshiy}$.`,
    });
  }
  bloki.push({ vid: 'formula', tex: `${P} = ${obshiy}\\cdot\\big(${chleny(k.n)}\\big)` });
  bloki.push({
    vid: 'text',
    text: 'В скобках — арифметическая прогрессия. Её сумма — полусумма первого и последнего членов, умноженная на число членов:',
  });
  let itog: DifItog;
  if (k.n === null) {
    bloki.push({ vid: 'formula', tex: `${chleny(null)} = \\dfrac{n + 1}{2}\\cdot n` });
    const rNum = k.r === null ? b : tex(k.r);
    bloki.push({
      vid: 'formula',
      tex: `${P} = ${obshiy}\\cdot\\dfrac{(n + 1)\\,n}{2} = S\\cdot\\dfrac{n + 1}{2}\\cdot ${fr(rNum, 100)}`,
    });
    itog = {
      koef: null,
      summa: null,
      procent: null,
      procentTex: `\\dfrac{(n + 1)\\cdot ${rNum}}{2}`,
      P,
      x,
    };
  } else {
    const n = k.n;
    const summa = (n * (n + 1)) / 2;
    const q = D(summa, n); // (n + 1) / 2
    const qT = q.isInteger() ? tex(q) : fr(String(q.n), String(q.d));
    bloki.push({
      vid: 'formula',
      tex: `${chleny(n)} = \\dfrac{${n} + 1}{2}\\cdot ${n} = ${summa}`,
    });
    let konec: string;
    let koef: Drob | null = null;
    let procentTex: string;
    if (k.r === null) {
      /* Ставка неизвестна: k·S с буквой, например «\dfrac{6t}{100}S». */
      const chisl = q.isInteger() ? `${tex(q)}${b}` : `${q.n}${b}`;
      const znam = q.isInteger() ? '100' : String(100n * q.d);
      konec = `${fr(chisl, znam)}\\,S`;
      procentTex = q.isInteger() ? `${tex(q)}${b}` : fr(`${q.n}${b}`, String(q.d));
    } else {
      koef = q.mul(k.r).div(100);
      const chisl = q.mul(k.r);
      konec = `${fr(`${tex(chisl)}S`, 100)} = ${tex(koef)}S`;
      procentTex = tex(koef.mul(100));
    }
    bloki.push({
      vid: 'formula',
      tex: `${P} = ${obshiy}\\cdot ${summa} = S\\cdot ${qT}\\cdot ${rT} = ${konec}`,
    });
    itog = { koef, summa, procent: koef === null ? null : koef.mul(100), procentTex, P, x };
  }
  return {
    shag: {
      title: k.imya ? `Складываем переплаты: ${k.imya}` : 'Складываем переплаты',
      text: `Переплата за ${period === 'year' ? 'год' : 'месяц'} — $${b}\\,\\%$ от долга на начало. Складываем столбец «Переплата».`,
      bloki,
    },
    itog,
  };
}

/**
 * Шаги 1–6 шаблона для одного или двух кредитов. Возвращает шаги и
 * итоги по каждому кредиту — коэффициент k в P = kS и процент от S.
 */
export function difPereplata(
  krediti: Kredit13[],
  period: 'month' | 'year',
  opts: { bezProcentov?: boolean } = {},
): { shagi: SolutionStep[]; itogi: DifItog[] } {
  const dva = krediti.length > 1;
  const P = (i: number) => (dva ? `P_{${i + 1}}` : 'P');
  const x = (i: number) => (dva ? `x_{${i + 1}}` : 'x');
  const b = krediti[0]?.bukva ?? 'r';
  const ed = period === 'year' ? 'лет' : 'месяцев';
  const vStavka = period === 'year' ? 'годовая' : 'месячная';
  const izmenenie = krediti
    .map((k) => {
      const d = `$${fr('S', k.n === null ? 'n' : k.n)}$`;
      return dva && k.kogo ? `для ${k.kogo} — ${d}` : d;
    })
    .join(', ');
  const shagi: SolutionStep[] = [
    {
      title: TIP_VYVOD.A.title,
      text: `Долг уменьшается на одну и ту же величину, значит платёж дифференцированный.`,
    },
    {
      title: 'Вводим обозначения',
      text: `$S$ — сумма кредита, $n$ — число ${ed}, $${b}\\,\\%$ — ${vStavka} ставка. Долг каждый ${period === 'year' ? 'год' : 'месяц'} уменьшается на одну и ту же сумму — сумма изменения долга равна $\\dfrac{S}{n}$: ${izmenenie}.`,
    },
    {
      title: `Вспоминаем: как найти $${b}\\,\\%$ от числа $S$`,
      text: 'Пропорция:',
      vid: 'ramka',
      bloki: [
        {
          vid: 'proporciya',
          rows: [
            ['100\\,\\%', 'S'],
            [`${b}\\,\\%`, '?'],
          ],
          vyvod: `? = \\dfrac{S\\cdot ${b}}{100} = S\\cdot\\dfrac{${b}}{100}`,
        },
        {
          vid: 'text',
          text: `Найти $${b}\\,\\%$ от числа — значит умножить число на $\\dfrac{${b}}{100}$.`,
        },
        {
          vid: 'melko',
          text: `Долг вместе с процентами — это $(100 + ${b})\\,\\%$ от $S$, то есть $S\\cdot\\dfrac{100 + ${b}}{100}$.`,
        },
      ],
    },
  ];
  krediti.forEach((k, i) => {
    shagi.push({
      title: dva && k.imya ? `Составляем таблицу: ${k.imya}` : 'Составляем таблицу',
      text: `Долг на начало каждой строки — долг на конец предыдущей. Переплата — $${b}\\,\\%$ от долга на начало: умножаем его на $${stavka(k)}$.`,
      bloki: [{ vid: 'tablitsa', t: tablitsa(k, period, P(i)) }],
    });
  });
  const itogi: DifItog[] = [];
  krediti.forEach((k, i) => {
    const { shag, itog } = skladyvaem(k, P(i), x(i), period);
    shagi.push(shag);
    itogi.push(itog);
  });
  /* Переплата в процентах нужна не всегда: вопрос в рублях отвечается без неё. */
  if (opts.bezProcentov) return { shagi, itogi };
  shagi.push({
    title: 'Выражаем переплату в процентах от суммы кредита',
    text: dva ? 'Пропорцией для каждого кредита:' : 'Пропорцией:',
    bloki: itogi.map((it, i): ShagBlok => {
      const k = krediti[i] as Kredit13;
      const PS =
        it.koef !== null
          ? `${tex(it.koef)}S`
          : k.n === null
            ? `S\\cdot\\dfrac{n + 1}{2}\\cdot\\dfrac{${k.r === null ? b : tex(k.r)}}{100}`
            : `${fr(it.procentTex, 100)}\\,S`;
      return {
        vid: 'proporciya',
        rows: [
          ['100\\,\\%', 'S'],
          [`${it.x}\\,\\%`, PS],
        ],
        vyvod: `${it.x} = \\dfrac{${PS}\\cdot 100}{S} = ${it.procentTex}\\,\\%`,
      };
    }),
  });
  return { shagi, itogi };
}
