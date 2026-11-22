/**
 * База, №16: опорные задачи — короткие задачи на один шаг. Из этих шагов
 * складывается любая задача номера. Ответ записан из чисел условия;
 * `proverka` считает то же выражение заново «в лоб» (плавающей точкой,
 * Math.sqrt, Math.log, Math.sin) и округляет до миллионных — расхождение
 * ловит pnpm test:baza.
 */

import { tex, zapis } from '@/lib/baza/chisla';
import type { BlokOpornyh, MikroZadacha, NavykOpornyh } from '@/lib/baza/types';

/** Число с плавающей точкой → запись бланка (до миллионных). */
const izChisla = (x: number): string => zapis(Math.round(x * 1e6), 1e6);

/** Целое → запись бланка: −3 → «−3». */
const tseloe = (n: number): string => zapis(n, 1);

const GRAD = Math.PI / 180;

const zadachi = (slug: string, spisok: Omit<MikroZadacha, 'id'>[]): MikroZadacha[] =>
  spisok.map((z, i) => ({ ...z, id: `b16-${slug}-${String(i + 1).padStart(2, '0')}` }));

const NAYDITE = 'Найдите значение выражения';

/* ═════════════ Навык 1. Степени ═════════════ */

/* ── Блок 1. Одно основание: a^m · a^n : a^k ── */
const ODNO: [number, number, number, number][] = [
  [2, 7, 5, 9],
  [3, 6, 2, 5],
  [5, 4, 3, 5],
  [7, 9, -3, 4],
  [2, -4, 12, 3],
  [10, 5, -2, 1],
];

const pok = (n: number) => (n < 0 ? `(${n})` : String(n));

const blokOdno: BlokOpornyh = {
  slug: 'odno-osnovanie',
  nazvanie: 'Одно основание',
  opisanie: 'Сложить и вычесть показатели, потом посчитать',
  zapomni: '$a^{m} \\cdot a^{n} = a^{m+n}$, $a^{m} : a^{n} = a^{m-n}$.',
  znak: 'a^{m+n}',
  zadachi: zadachi(
    'odno',
    ODNO.map(([a, m, n, k]) => {
      const p = m + n - k;
      return {
        uslovie: `${NAYDITE} $\\dfrac{${a}^{${m}} \\cdot ${a}^{${n}}}{${a}^{${k}}}$.`,
        otvet: tseloe(a ** p),
        podskazka: 'Основания одинаковые — работаем только с показателями.',
        razbor: [
          `Показатель: $${m} + ${pok(n)} - ${pok(k)} = ${p}$.`,
          `$${a}^{${p}} = ${tex(tseloe(a ** p))}$.`,
        ],
        proverka: () => izChisla((a ** m * a ** n) / a ** k),
      };
    }),
  ),
};

/* ── Блок 2. Разложить основание: (pq)^n / (p^a q^b) ── */
const RAZLOZHIT: [number, number, number, number, number][] = [
  [2, 3, 7, 6, 5],
  [2, 5, 8, 6, 7],
  [3, 5, 6, 4, 6],
  [2, 7, 5, 3, 4],
  [3, 4, 9, 8, 8],
  [5, 3, 10, 9, 8],
];

const blokRazlozhit: BlokOpornyh = {
  slug: 'razlozhit',
  nazvanie: 'Разложить основание',
  opisanie: 'Составное основание — в произведение простых множителей',
  zapomni:
    '$(pq)^{n} = p^{n} q^{n}$. Потом делим степень $p$ на степень $p$, степень $q$ — на степень $q$.',
  znak: '(ab)^{n}',
  zadachi: zadachi(
    'razlozhit',
    RAZLOZHIT.map(([p, q, n, a, b]) => {
      const x = p ** (n - a);
      const y = q ** (n - b);
      const otvet = tseloe(x * y);
      return {
        uslovie: `${NAYDITE} $\\dfrac{${p * q}^{${n}}}{${p}^{${a}} \\cdot ${q}^{${b}}}$.`,
        otvet,
        podskazka: `$${p * q} = ${p} \\cdot ${q}$.`,
        razbor: [
          `$${p * q}^{${n}} = ${p}^{${n}} \\cdot ${q}^{${n}}$.`,
          `$\\dfrac{${p}^{${n}}}{${p}^{${a}}} = ${p}^{${n - a}} = ${x}$, $\\dfrac{${q}^{${n}}}{${q}^{${b}}} = ${q}^{${n - b}} = ${y}$.`,
          `$${x} \\cdot ${y} = ${tex(otvet)}$.`,
        ],
        proverka: () => izChisla((p * q) ** n / (p ** a * q ** b)),
      };
    }),
  ),
};

/* ── Блок 3. Отрицательный показатель: a^{-n} ── */
const OTRICAT: [number, number][] = [
  [2, 2],
  [5, 2],
  [4, 3],
  [2, 5],
  [20, 2],
  [8, 1],
];

const blokOtricat: BlokOpornyh = {
  slug: 'otricatelnyy',
  nazvanie: 'Отрицательный показатель',
  opisanie: 'Перевернуть степень и записать десятичной дробью',
  zapomni: '$a^{-n} = \\dfrac{1}{a^{n}}$.',
  znak: 'a^{-n}',
  zadachi: zadachi(
    'otricat',
    OTRICAT.map(([a, n]) => {
      const otvet = zapis(1, a ** n);
      return {
        uslovie: `${NAYDITE} $${a}^{-${n}}$.`,
        otvet,
        podskazka: `$${a}^{-${n}} = \\dfrac{1}{${a}^{${n}}}$.`,
        razbor: [`$${a}^{-${n}} = \\dfrac{1}{${a ** n}} = ${tex(otvet)}$.`],
        proverka: () => izChisla(a ** -n),
      };
    }),
  ),
};

/* ── Блок 4. Степени десяти: сумма разрядов ── */
/* Слагаемое — [множитель в десятых, показатель]: 25 → 2,5. */
const DESYAT: [number, number][][] = [
  [
    [70, -1],
    [30, -2],
  ],
  [
    [40, -1],
    [10, -2],
    [60, -3],
  ],
  [
    [52, -1],
    [37, -2],
  ],
  [
    [18, 2],
    [-45, 1],
  ],
  [
    [90, -2],
    [20, -3],
  ],
  [
    [36, 1],
    [-24, -1],
  ],
];

const chlen = (desyatye: number): string => tex(zapis(desyatye, 10));

const blokDesyat: BlokOpornyh = {
  slug: 'desyat',
  nazvanie: 'Степени десяти',
  opisanie: 'Перевести каждое слагаемое в десятичную дробь и сложить',
  zapomni:
    'Множитель $10^{n}$ сдвигает запятую на $n$ знаков вправо, $10^{-n}$ — на $n$ знаков влево.',
  znak: '10^{-n}',
  zadachi: zadachi(
    'desyat',
    DESYAT.map((chleny) => {
      /* Всё в десятитысячных: показатели не меньше −3. */
      const v = chleny.map(([d, s]) => (d * 10 ** (s + 3)) as number);
      const summa = v.reduce((x, y) => x + y, 0);
      const otvet = zapis(summa, 10000);
      const zapisi = chleny
        .map(([d, s], i) => {
          const t = `${chlen(Math.abs(d))} \\cdot 10^{${s}}`;
          return i === 0 ? (d < 0 ? `-${t}` : t) : d < 0 ? ` - ${t}` : ` + ${t}`;
        })
        .join('');
      const chisla = v
        .map((x, i) => {
          const t = tex(zapis(Math.abs(x), 10000));
          return i === 0 ? (x < 0 ? `-${t}` : t) : x < 0 ? ` - ${t}` : ` + ${t}`;
        })
        .join('');
      return {
        uslovie: `${NAYDITE} $${zapisi}$.`,
        otvet,
        podskazka: 'Сдвиньте запятую в каждом слагаемом отдельно.',
        razbor: [`$${chisla} = ${tex(otvet)}$.`],
        proverka: () => izChisla(chleny.reduce((x, [d, s]) => x + (d / 10) * 10 ** s, 0)),
      };
    }),
  ),
};

/* ═════════════ Навык 2. Корни ═════════════ */

/* ── Блок 5. Под один корень ── */
const ODIN_KOREN: [number, number, '·' | ':'][] = [
  [8, 18, '·'],
  [27, 12, '·'],
  [20, 45, '·'],
  [6, 54, '·'],
  [98, 2, ':'],
  [300, 3, ':'],
];

const blokOdinKoren: BlokOpornyh = {
  slug: 'odin-koren',
  nazvanie: 'Под один корень',
  opisanie: 'Произведение или частное корней — корень из произведения или частного',
  zapomni:
    '$\\sqrt{a} \\cdot \\sqrt{b} = \\sqrt{ab}$, $\\dfrac{\\sqrt{a}}{\\sqrt{b}} = \\sqrt{\\dfrac{a}{b}}$.',
  znak: '\\sqrt{ab}',
  zadachi: zadachi(
    'koren',
    ODIN_KOREN.map(([a, b, op]) => {
      const pod = op === '·' ? a * b : a / b;
      const otvet = tseloe(Math.round(Math.sqrt(pod)));
      return {
        uslovie:
          op === '·'
            ? `${NAYDITE} $\\sqrt{${a}} \\cdot \\sqrt{${b}}$.`
            : `${NAYDITE} $\\dfrac{\\sqrt{${a}}}{\\sqrt{${b}}}$.`,
        otvet,
        podskazka: 'Соберите всё под один корень.',
        razbor: [
          op === '·'
            ? `$\\sqrt{${a} \\cdot ${b}} = \\sqrt{${pod}} = ${tex(otvet)}$.`
            : `$\\sqrt{\\dfrac{${a}}{${b}}} = \\sqrt{${pod}} = ${tex(otvet)}$.`,
        ],
        proverka: () =>
          izChisla(op === '·' ? Math.sqrt(a) * Math.sqrt(b) : Math.sqrt(a) / Math.sqrt(b)),
      };
    }),
  ),
};

/* ── Блок 6. Квадрат корня с множителем ── */
const KVADRAT: [number, number, number][] = [
  [3, 5, 1],
  [2, 6, 1],
  [5, 2, 1],
  [4, 3, 8],
  [6, 2, 9],
  [2, 7, 35],
];

const blokKvadrat: BlokOpornyh = {
  slug: 'kvadrat',
  nazvanie: 'Квадрат корня с множителем',
  opisanie: 'Множитель перед корнем — тоже в квадрат',
  zapomni: '$\\left(k\\sqrt{a}\\right)^{2} = k^{2} a$.',
  znak: '(k\\sqrt{a})^{2}',
  zadachi: zadachi(
    'kvadrat',
    KVADRAT.map(([k, a, d]) => {
      const kv = k * k * a;
      const otvet = zapis(kv, d);
      const vyr = `\\left(${k}\\sqrt{${a}}\\right)^{2}`;
      return {
        uslovie: `${NAYDITE} $${d === 1 ? vyr : `\\dfrac{${vyr}}{${d}}`}$.`,
        otvet,
        podskazka: `$${k}^{2} = ${k * k}$, $\\left(\\sqrt{${a}}\\right)^{2} = ${a}$.`,
        razbor:
          d === 1
            ? [`$${k * k} \\cdot ${a} = ${tex(otvet)}$.`]
            : [
                `$${vyr} = ${k * k} \\cdot ${a} = ${kv}$.`,
                `$\\dfrac{${kv}}{${d}} = ${tex(otvet)}$.`,
              ],
        proverka: () => izChisla((k * Math.sqrt(a)) ** 2 / d),
      };
    }),
  ),
};

/* ── Блок 7. Корень из степеней ── */
const IZ_STEPENEY: [number, number, number, number][] = [
  [2, 4, 3, 2],
  [5, 2, 2, 6],
  [3, 4, 2, 2],
  [2, 8, 7, 2],
  [3, 6, 5, 2],
  [10, 4, 2, 2],
];

const blokIzStepeney: BlokOpornyh = {
  slug: 'iz-stepeney',
  nazvanie: 'Корень из степеней',
  opisanie: 'Показатель под корнем делится пополам',
  zapomni: '$\\sqrt{a^{2n}} = a^{n}$ и $\\sqrt{xy} = \\sqrt{x} \\cdot \\sqrt{y}$.',
  znak: '\\sqrt{a^{2n}}',
  zadachi: zadachi(
    'iz-stepeney',
    IZ_STEPENEY.map(([p, m, q, n]) => {
      const x = p ** (m / 2);
      const y = q ** (n / 2);
      const otvet = tseloe(x * y);
      return {
        uslovie: `${NAYDITE} $\\sqrt{${p}^{${m}} \\cdot ${q}^{${n}}}$.`,
        otvet,
        podskazka: 'Извлеките корень из каждой степени отдельно.',
        razbor: [
          `$\\sqrt{${p}^{${m}}} = ${p}^{${m / 2}} = ${x}$, $\\sqrt{${q}^{${n}}} = ${q}^{${n / 2}} = ${y}$.`,
          `$${x} \\cdot ${y} = ${tex(otvet)}$.`,
        ],
        proverka: () => izChisla(Math.sqrt(p ** m * q ** n)),
      };
    }),
  ),
};

/* ── Блок 8. Скобка на корень ── */
const SKOBKA: [number, number][] = [
  [48, 3],
  [50, 2],
  [27, 3],
  [80, 5],
  [63, 7],
  [200, 8],
];

const blokSkobka: BlokOpornyh = {
  slug: 'skobka',
  nazvanie: 'Скобка на корень',
  opisanie: 'Раскрыть скобки: каждый корень умножить на корень',
  zapomni: '$\\left(\\sqrt{a} - \\sqrt{b}\\right)\\sqrt{b} = \\sqrt{ab} - b$.',
  znak: '(\\,)\\sqrt{b}',
  zadachi: zadachi(
    'skobka',
    SKOBKA.map(([a, b]) => {
      const k = Math.round(Math.sqrt(a * b));
      const otvet = tseloe(k - b);
      return {
        uslovie: `${NAYDITE} $\\left(\\sqrt{${a}} - \\sqrt{${b}}\\right) \\cdot \\sqrt{${b}}$.`,
        otvet,
        podskazka: `$\\sqrt{${b}} \\cdot \\sqrt{${b}} = ${b}$.`,
        razbor: [
          `$\\sqrt{${a} \\cdot ${b}} - \\sqrt{${b}} \\cdot \\sqrt{${b}} = \\sqrt{${a * b}} - ${b}$.`,
          `$${k} - ${b} = ${tex(otvet)}$.`,
        ],
        proverka: () => izChisla((Math.sqrt(a) - Math.sqrt(b)) * Math.sqrt(b)),
      };
    }),
  ),
};

/* ── Блок 9. Разность квадратов ── */
const RAZNOST: [number, number, number][] = [
  [1, 13, 6],
  [1, 23, 7],
  [2, 3, 5],
  [3, 2, 7],
  [2, 5, 3],
  [4, 2, 30],
];

const blokRaznost: BlokOpornyh = {
  slug: 'raznost-kvadratov',
  nazvanie: 'Разность квадратов',
  opisanie: 'Скобки отличаются только знаком — корни исчезают',
  zapomni: '$(a - b)(a + b) = a^{2} - b^{2}$; $\\left(k\\sqrt{a}\\right)^{2} = k^{2} a$.',
  znak: 'a^{2}-b^{2}',
  zadachi: zadachi(
    'raznost',
    RAZNOST.map(([k, a, b]) => {
      const pervyy = k === 1 ? `\\sqrt{${a}}` : `${k}\\sqrt{${a}}`;
      const otvet = tseloe(k * k * a - b);
      return {
        uslovie: `${NAYDITE} $\\left(${pervyy} - \\sqrt{${b}}\\right)\\left(${pervyy} + \\sqrt{${b}}\\right)$.`,
        otvet,
        podskazka: 'Это разность квадратов.',
        razbor: [
          `$\\left(${pervyy}\\right)^{2} - \\left(\\sqrt{${b}}\\right)^{2} = ${k * k * a} - ${b} = ${tex(otvet)}$.`,
        ],
        proverka: () =>
          izChisla((k * Math.sqrt(a) - Math.sqrt(b)) * (k * Math.sqrt(a) + Math.sqrt(b))),
      };
    }),
  ),
};

/* ═════════════ Навык 3. Логарифмы ═════════════ */

/* ── Блок 10. По определению ── */
/* [основание, число, TeX числа, ответ] */
const OPRED: [number, number, string, string][] = [
  [2, 64, '64', '6'],
  [3, 81, '81', '4'],
  [5, 0.04, '0{,}04', '−2'],
  [10, 0.001, '0{,}001', '−3'],
  [4, 2, '2', '0,5'],
  [16, 8, '8', '0,75'],
];

const blokOpred: BlokOpornyh = {
  slug: 'opredelenie',
  nazvanie: 'По определению',
  opisanie: 'В какую степень возвести основание, чтобы получить число',
  zapomni: '$\\log_{a} b = c$ значит $a^{c} = b$.',
  znak: '\\log_{a}b',
  zadachi: zadachi(
    'opred',
    OPRED.map(([a, b, bTex, otvet]) => ({
      uslovie: `${NAYDITE} $\\log_{${a}} ${bTex}$.`,
      otvet,
      podskazka: `Представьте $${bTex}$ как степень числа $${a}$.`,
      razbor: [`$${a}^{${tex(otvet)}} = ${bTex}$, значит, $\\log_{${a}} ${bTex} = ${tex(otvet)}$.`],
      proverka: () => izChisla(Math.log(b) / Math.log(a)),
    })),
  ),
};

/* ── Блок 11. Логарифм логарифма ── */
/* [внешнее основание, внутреннее основание, внутреннее число] */
const LOG_LOGA: [number, number, number][] = [
  [2, 3, 81],
  [3, 2, 8],
  [2, 5, 625],
  [4, 2, 256],
  [9, 10, 1000],
  [5, 2, 32],
];

const blokLogLoga: BlokOpornyh = {
  slug: 'log-loga',
  nazvanie: 'Логарифм логарифма',
  opisanie: 'Сначала внутренний логарифм, потом внешний',
  zapomni: 'Считаем изнутри наружу: внутренний логарифм — обычное число.',
  znak: '\\log\\log',
  zadachi: zadachi(
    'log-loga',
    LOG_LOGA.map(([a, b, c]) => {
      const vnutri = Math.round(Math.log(c) / Math.log(b));
      const otvet = izChisla(Math.log(vnutri) / Math.log(a));
      return {
        uslovie: `${NAYDITE} $\\log_{${a}}\\left(\\log_{${b}} ${c}\\right)$.`,
        otvet,
        podskazka: `$${b}$ в какой степени равно $${c}$?`,
        razbor: [
          `$\\log_{${b}} ${c} = ${vnutri}$, так как $${b}^{${vnutri}} = ${c}$.`,
          `$\\log_{${a}} ${vnutri} = ${tex(otvet)}$.`,
        ],
        proverka: () => {
          /* Перебором: внутренний показатель — наименьшее k с b^k = c. */
          let k = 0;
          while (b ** k < c) k += 1;
          return izChisla(Math.log2(k) / Math.log2(a));
        },
      };
    }),
  ),
};

/* ── Блок 12. Сумма и разность ── */
/* [основание, x, TeX x, знак, y, TeX y] */
const SUMMA: [number, number, string, '+' | '-', number, string][] = [
  [6, 4, '4', '+', 9, '9'],
  [15, 5, '5', '+', 45, '45'],
  [2, 0.8, '0{,}8', '+', 10, '10'],
  [3, 54, '54', '-', 2, '2'],
  [5, 250, '250', '-', 2, '2'],
  [4, 0.5, '0{,}5', '+', 32, '32'],
];

const blokSumma: BlokOpornyh = {
  slug: 'summa-raznost',
  nazvanie: 'Сумма и разность логарифмов',
  opisanie: 'Объединить в один логарифм произведения или частного',
  zapomni:
    '$\\log_{a} x + \\log_{a} y = \\log_{a}(xy)$, $\\log_{a} x - \\log_{a} y = \\log_{a}\\dfrac{x}{y}$.',
  znak: '\\log xy',
  zadachi: zadachi(
    'summa',
    SUMMA.map(([a, x, xT, z, y, yT]) => {
      const pod = Math.round(z === '+' ? x * y : x / y);
      const otvet = izChisla(Math.log(pod) / Math.log(a));
      return {
        uslovie: `${NAYDITE} $\\log_{${a}} ${xT} ${z} \\log_{${a}} ${yT}$.`,
        otvet,
        podskazka:
          z === '+'
            ? 'Сумма логарифмов — логарифм произведения.'
            : 'Разность логарифмов — логарифм частного.',
        razbor: [
          z === '+'
            ? `$\\log_{${a}}(${xT} \\cdot ${yT}) = \\log_{${a}} ${pod}$.`
            : `$\\log_{${a}}\\dfrac{${xT}}{${yT}} = \\log_{${a}} ${pod}$.`,
          `$${a}^{${tex(otvet)}} = ${pod}$, ответ $${tex(otvet)}$.`,
        ],
        proverka: () =>
          izChisla(
            z === '+'
              ? (Math.log(x) + Math.log(y)) / Math.log(a)
              : (Math.log(x) - Math.log(y)) / Math.log(a),
          ),
      };
    }),
  ),
};

/* ── Блок 13. Показатель — вперёд ── */
/* [вид, основание, число, показатель, множитель в знаменателе] */
type Pokaz = ['koren', number, number] | ['drob', number, number, number, number];
const POKAZ: Pokaz[] = [
  ['koren', 3, 5],
  ['koren', 7, 2],
  ['koren', 5, 3],
  ['drob', 2, 11, 15, 5],
  ['drob', 6, 5, 16, 8],
  ['drob', 3, 10, 14, 4],
];

const blokPokaz: BlokOpornyh = {
  slug: 'pokazatel',
  nazvanie: 'Показатель — вперёд',
  opisanie: 'Вынести показатель степени из-под логарифма',
  zapomni: '$\\log_{a} b^{k} = k\\log_{a} b$; $\\log_{\\sqrt{a}} b = 2\\log_{a} b$.',
  znak: 'k\\log_{a}b',
  zadachi: zadachi(
    'pokaz',
    POKAZ.map((r) => {
      if (r[0] === 'koren') {
        const [, a, n] = r;
        const otvet = tseloe(2 * n);
        return {
          uslovie: `${NAYDITE} $\\log_{\\sqrt{${a}}} ${a}^{${n}}$.`,
          otvet,
          podskazka: `$${a} = \\left(\\sqrt{${a}}\\right)^{2}$.`,
          razbor: [
            `$${a}^{${n}} = \\left(\\sqrt{${a}}\\right)^{${2 * n}}$, значит, логарифм равен $${tex(otvet)}$.`,
          ],
          proverka: () => izChisla((n * Math.log(a)) / Math.log(Math.sqrt(a))),
        };
      }
      const [, a, b, k, m] = r;
      const otvet = zapis(k, m);
      return {
        uslovie: `${NAYDITE} $\\dfrac{\\log_{${a}} ${b}^{${k}}}{${m}\\log_{${a}} ${b}}$.`,
        otvet,
        podskazka: `$\\log_{${a}} ${b}^{${k}} = ${k}\\log_{${a}} ${b}$.`,
        razbor: [
          `$\\dfrac{${k}\\log_{${a}} ${b}}{${m}\\log_{${a}} ${b}} = \\dfrac{${k}}{${m}} = ${tex(otvet)}$.`,
        ],
        proverka: () =>
          izChisla(Math.log(b ** k) / Math.log(a) / ((m * Math.log(b)) / Math.log(a))),
      };
    }),
  ),
};

/* ── Блок 14. Логарифмическое тождество ── */
/* a^{m + k·log_a b} = a^m · b^k */
const TOZHD: [number, number, number, number][] = [
  [5, 0, 1, 7],
  [3, 0, 2, 4],
  [2, 3, 1, 5],
  [7, 1, 1, 3],
  [10, -1, 1, 6],
  [4, -2, 1, 8],
];

const pokazTex = (m: number, k: number, a: number, b: number): string => {
  const log = `${k === 1 ? '' : k}\\log_{${a}} ${b}`;
  if (m === 0) return log;
  return m > 0 ? `${m} + ${log}` : `${log} - ${-m}`;
};

const blokTozhd: BlokOpornyh = {
  slug: 'tozhdestvo',
  nazvanie: 'Логарифмическое тождество',
  opisanie: 'Основание в степени логарифма по тому же основанию',
  zapomni: '$a^{\\log_{a} b} = b$; $a^{m + \\log_{a} b} = a^{m} b$; $a^{k\\log_{a} b} = b^{k}$.',
  znak: 'a^{\\log_{a}b}',
  zadachi: zadachi(
    'tozhd',
    TOZHD.map(([a, m, k, b]) => {
      const otvet = m >= 0 ? tseloe(a ** m * b ** k) : zapis(b ** k, a ** -m);
      const shag =
        m === 0
          ? k === 1
            ? `$${a}^{\\log_{${a}} ${b}} = ${b}$`
            : `$\\left(${a}^{\\log_{${a}} ${b}}\\right)^{${k}} = ${b}^{${k}}`
          : m > 0
            ? `$${a}^{${m}} \\cdot ${a}^{\\log_{${a}} ${b}} = ${a ** m} \\cdot ${b}`
            : `$\\dfrac{${a}^{\\log_{${a}} ${b}}}{${a}^{${-m}}} = \\dfrac{${b}}{${a ** -m}}`;
      return {
        uslovie: `${NAYDITE} $${a}^{${pokazTex(m, k, a, b)}}$.`,
        otvet,
        podskazka: 'Отделите $a^{\\log_{a} b}$ от остальной степени.',
        razbor: [m === 0 && k === 1 ? `${shag}.` : `${shag} = ${tex(otvet)}$.`],
        proverka: () => izChisla(a ** (m + (k * Math.log(b)) / Math.log(a))),
      };
    }),
  ),
};

/* ═════════════ Навык 4. Тригонометрия ═════════════ */

/* Угол по значению функции и четверти — независимо от формул приведения. */
function ugol(fn: 'sin' | 'cos', v: number, chetvert: 1 | 2 | 3 | 4): number {
  if (fn === 'sin') {
    const b = Math.asin(v); /* от −90° до 90° */
    return chetvert === 1 ? b : chetvert === 4 ? 2 * Math.PI + b : Math.PI - b;
  }
  const b = Math.acos(v); /* от 0° до 180° */
  return chetvert <= 2 ? b : 2 * Math.PI - b;
}

const PROMEZHUTOK: Record<number, string> = {
  1: '0^\\circ < \\alpha < 90^\\circ',
  2: '90^\\circ < \\alpha < 180^\\circ',
  3: '180^\\circ < \\alpha < 270^\\circ',
  4: '270^\\circ < \\alpha < 360^\\circ',
};
const RIM = ['', 'I', 'II', 'III', 'IV'];

/* ── Блок 15. Основное тождество и знак ── */
/* [дано, TeX значения, значение, четверть, |ответ|·100, TeX квадрата ответа] */
const TOZHDESTVO: ['sin' | 'cos', string, number, 1 | 2 | 3 | 4, number, string][] = [
  ['sin', '0{,}6', 0.6, 2, 80, '0{,}64'],
  ['sin', '-0{,}28', -0.28, 3, 96, '0{,}9216'],
  ['cos', '0{,}8', 0.8, 4, 60, '0{,}36'],
  ['cos', '-0{,}6', -0.6, 2, 80, '0{,}64'],
  ['cos', '\\dfrac{\\sqrt{51}}{10}', Math.sqrt(51) / 10, 4, 70, '\\dfrac{49}{100}'],
  ['sin', '-\\dfrac{\\sqrt{91}}{10}', -Math.sqrt(91) / 10, 4, 30, '\\dfrac{9}{100}'],
];

const ZNAK_SIN = { 1: 1, 2: 1, 3: -1, 4: -1 } as const;
const ZNAK_COS = { 1: 1, 2: -1, 3: -1, 4: 1 } as const;

const blokTozhdestvo: BlokOpornyh = {
  slug: 'osnovnoe',
  nazvanie: 'Основное тождество и знак',
  opisanie: 'Найти модуль из тождества, знак — по четверти',
  zapomni:
    '$\\sin^{2}\\alpha + \\cos^{2}\\alpha = 1$. Синус отрицателен в III и IV четвертях, косинус — во II и III.',
  znak: '\\sin^{2}',
  zadachi: zadachi(
    'osnovnoe',
    TOZHDESTVO.map(([fn, vTex, v, ch, modul, kvTex]) => {
      const iskomaya = fn === 'sin' ? 'cos' : 'sin';
      const znak = (iskomaya === 'sin' ? ZNAK_SIN : ZNAK_COS)[ch];
      const otvet = zapis(znak * modul, 100);
      return {
        uslovie: `Найдите $\\${iskomaya}\\alpha$, если $\\${fn}\\alpha = ${vTex}$ и $${PROMEZHUTOK[ch]}$.`,
        otvet,
        podskazka: `В ${RIM[ch]} четверти $\\${iskomaya}\\alpha$ ${znak > 0 ? 'положительный' : 'отрицательный'}.`,
        razbor: [
          `$\\${iskomaya}^{2}\\alpha = 1 - \\left(${vTex}\\right)^{2} = ${kvTex}$.`,
          `В ${RIM[ch]} четверти знак «${znak > 0 ? '+' : '−'}»: $\\${iskomaya}\\alpha = ${tex(otvet)}$.`,
        ],
        proverka: () => {
          const x = ugol(fn, v, ch);
          return izChisla(iskomaya === 'sin' ? Math.sin(x) : Math.cos(x));
        },
      };
    }),
  ),
};

/* ── Блок 16. Тангенс по синусу или косинусу ── */
/* [дано, TeX, значение, четверть, TeX второй функции, ответ в сотых] */
const TANGENS: ['sin' | 'cos', string, number, 1 | 2 | 3 | 4, string, number][] = [
  ['sin', '0{,}6', 0.6, 2, '-0{,}8', -75],
  ['cos', '-0{,}8', -0.8, 3, '-0{,}6', 75],
  ['sin', '\\dfrac{1}{\\sqrt{5}}', 1 / Math.sqrt(5), 1, '\\dfrac{2}{\\sqrt{5}}', 50],
  ['cos', '\\dfrac{2}{\\sqrt{5}}', 2 / Math.sqrt(5), 4, '-\\dfrac{1}{\\sqrt{5}}', -50],
  ['sin', '\\dfrac{3}{\\sqrt{13}}', 3 / Math.sqrt(13), 2, '-\\dfrac{2}{\\sqrt{13}}', -150],
  ['cos', '0{,}8', 0.8, 4, '-0{,}6', -75],
];

const blokTangens: BlokOpornyh = {
  slug: 'tangens',
  nazvanie: 'Тангенс по синусу или косинусу',
  opisanie: 'Найти вторую функцию со знаком, потом разделить',
  zapomni:
    '$\\mathrm{tg}\\,\\alpha = \\dfrac{\\sin\\alpha}{\\cos\\alpha}$. Тангенс положителен в I и III четвертях.',
  znak: '\\mathrm{tg}\\,\\alpha',
  zadachi: zadachi(
    'tangens',
    TANGENS.map(([fn, vTex, v, ch, drugoeTex, sotye]) => {
      const drugaya = fn === 'sin' ? 'cos' : 'sin';
      const otvet = zapis(sotye, 100);
      const [sinT, cosT] = fn === 'sin' ? [vTex, drugoeTex] : [drugoeTex, vTex];
      return {
        uslovie: `Найдите $\\mathrm{tg}\\,\\alpha$, если $\\${fn}\\alpha = ${vTex}$ и $${PROMEZHUTOK[ch]}$.`,
        otvet,
        podskazka: `Сначала найдите $\\${drugaya}\\alpha$ — со знаком ${RIM[ch]} четверти.`,
        razbor: [
          `$\\${drugaya}\\alpha = ${drugoeTex}$.`,
          `$\\mathrm{tg}\\,\\alpha = \\left(${sinT}\\right) : \\left(${cosT}\\right) = ${tex(otvet)}$.`,
        ],
        proverka: () => izChisla(Math.tan(ugol(fn, v, ch))),
      };
    }),
  ),
};

/* ── Блок 17. Табличные значения ── */
/* [TeX выражения, TeX решения без ответа, ответ, пересчёт] */
const TABLICA: [string, string, string, () => number][] = [
  ['12\\sin 30^\\circ', '12 \\cdot \\dfrac{1}{2}', '6', () => 12 * Math.sin(30 * GRAD)],
  [
    '10\\sqrt{3}\\cos 30^\\circ',
    '10\\sqrt{3} \\cdot \\dfrac{\\sqrt{3}}{2} = \\dfrac{30}{2}',
    '15',
    () => 10 * Math.sqrt(3) * Math.cos(30 * GRAD),
  ],
  [
    '6\\sqrt{2}\\sin 45^\\circ',
    '6\\sqrt{2} \\cdot \\dfrac{\\sqrt{2}}{2} = \\dfrac{12}{2}',
    '6',
    () => 6 * Math.SQRT2 * Math.sin(45 * GRAD),
  ],
  [
    '7\\sqrt{3}\\,\\mathrm{tg}\\,60^\\circ',
    '7\\sqrt{3} \\cdot \\sqrt{3} = 7 \\cdot 3',
    '21',
    () => 7 * Math.sqrt(3) * Math.tan(60 * GRAD),
  ],
  ['9\\cos 180^\\circ', '9 \\cdot (-1)', '−9', () => 9 * Math.cos(180 * GRAD)],
  [
    '8\\sqrt{3}\\,\\mathrm{tg}\\,30^\\circ',
    '8\\sqrt{3} \\cdot \\dfrac{1}{\\sqrt{3}}',
    '8',
    () => 8 * Math.sqrt(3) * Math.tan(30 * GRAD),
  ],
];

const blokTablica: BlokOpornyh = {
  slug: 'tablica',
  nazvanie: 'Табличные значения',
  opisanie: 'Подставить значение для $30^\\circ$, $45^\\circ$, $60^\\circ$',
  zapomni:
    '$\\sin 30^\\circ = \\cos 60^\\circ = \\dfrac{1}{2}$, $\\sin 45^\\circ = \\cos 45^\\circ = \\dfrac{\\sqrt{2}}{2}$, $\\mathrm{tg}\\,60^\\circ = \\sqrt{3}$.',
  znak: '\\sin 30^\\circ',
  zadachi: zadachi(
    'tablica',
    TABLICA.map(([vyr, reshenie, otvet, p]) => ({
      uslovie: `${NAYDITE} $${vyr}$.`,
      otvet,
      podskazka: 'Вспомните табличное значение.',
      razbor: [`$${reshenie} = ${tex(otvet)}$.`],
      proverka: () => izChisla(p()),
    })),
  ),
};

/* ── Блок 18. Полные обороты и приведение ── */
/* [множитель, функция, угол, TeX приведения, TeX значения, ответ] */
const PRIVEDENIE: [number, 'sin' | 'cos' | 'tg', number, string, string, string][] = [
  [10, 'sin', 750, '750^\\circ - 2 \\cdot 360^\\circ = 30^\\circ', '\\dfrac{1}{2}', '5'],
  [6, 'tg', 405, '405^\\circ - 2 \\cdot 180^\\circ = 45^\\circ', '1', '6'],
  [
    16,
    'cos',
    600,
    '600^\\circ - 360^\\circ = 240^\\circ = 180^\\circ + 60^\\circ',
    '-\\dfrac{1}{2}',
    '−8',
  ],
  [
    14,
    'sin',
    570,
    '570^\\circ - 360^\\circ = 210^\\circ = 180^\\circ + 30^\\circ',
    '-\\dfrac{1}{2}',
    '−7',
  ],
  [
    22,
    'cos',
    1020,
    '1020^\\circ - 2 \\cdot 360^\\circ = 300^\\circ = 360^\\circ - 60^\\circ',
    '\\dfrac{1}{2}',
    '11',
  ],
  [
    -15,
    'tg',
    495,
    '495^\\circ - 2 \\cdot 180^\\circ = 135^\\circ = 180^\\circ - 45^\\circ',
    '-1',
    '15',
  ],
];

const fnTex = (fn: 'sin' | 'cos' | 'tg') => (fn === 'tg' ? '\\mathrm{tg}\\,' : `\\${fn}`);
const FN: Record<'sin' | 'cos' | 'tg', (x: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tg: Math.tan,
};

const blokPrivedenie: BlokOpornyh = {
  slug: 'privedenie',
  nazvanie: 'Большие углы',
  opisanie: 'Отбросить полные обороты, привести к острому углу, взять знак четверти',
  zapomni:
    'У синуса и косинуса отбрасываем $360^\\circ$, у тангенса — $180^\\circ$. Знак — по четверти исходного угла.',
  znak: '360^\\circ',
  zadachi: zadachi(
    'privedenie',
    PRIVEDENIE.map(([k, fn, deg, privTex, znachTex, otvet]) => ({
      uslovie: `${NAYDITE} $${k}${fnTex(fn)}${fn === 'tg' ? '' : ' '}${deg}^\\circ$.`,
      otvet,
      podskazka:
        fn === 'tg'
          ? 'Период тангенса — $180^\\circ$.'
          : 'Отбросьте полные обороты по $360^\\circ$.',
      razbor: [
        `$${privTex}$.`,
        `$${fnTex(fn)}${fn === 'tg' ? '' : ' '}${deg}^\\circ = ${znachTex}$, $${k} \\cdot \\left(${znachTex}\\right) = ${tex(otvet)}$.`,
      ],
      proverka: () => izChisla(k * FN[fn](deg * GRAD)),
    })),
  ),
};

/* ── Блок 19. Тангенс на котангенс ── */
/* [множитель, угол] или [tg, null]: ctg по tg */
const TG_CTG: [number, number | null][] = [
  [5, 40],
  [-3, 113],
  [2.5, 71],
  [4, null],
  [-0.5, null],
  [1.25, null],
];

const chisloTex = (x: number) => tex(izChisla(x));

const blokTgCtg: BlokOpornyh = {
  slug: 'tg-ctg',
  nazvanie: 'Тангенс и котангенс',
  opisanie: 'Произведение тангенса и котангенса одного угла равно единице',
  zapomni:
    '$\\mathrm{tg}\\,\\alpha \\cdot \\mathrm{ctg}\\,\\alpha = 1$, $\\mathrm{ctg}\\,\\alpha = \\dfrac{1}{\\mathrm{tg}\\,\\alpha}$.',
  znak: '\\mathrm{tg}\\cdot\\mathrm{ctg}',
  zadachi: zadachi(
    'tg-ctg',
    TG_CTG.map(([x, deg]) => {
      if (deg !== null) {
        const otvet = izChisla(x);
        return {
          uslovie: `${NAYDITE} $${chisloTex(x)}\\,\\mathrm{tg}\\,${deg}^\\circ \\cdot \\mathrm{ctg}\\,${deg}^\\circ$.`,
          otvet,
          podskazka: 'Угол не табличный — значит, он сократится.',
          razbor: [
            `$\\mathrm{tg}\\,${deg}^\\circ \\cdot \\mathrm{ctg}\\,${deg}^\\circ = 1$, ответ $${chisloTex(x)} \\cdot 1 = ${tex(otvet)}$.`,
          ],
          proverka: () => izChisla((x * Math.tan(deg * GRAD)) / Math.tan(deg * GRAD)),
        };
      }
      const otvet = izChisla(1 / x);
      return {
        uslovie: `Найдите $\\mathrm{ctg}\\,\\alpha$, если $\\mathrm{tg}\\,\\alpha = ${chisloTex(x)}$.`,
        otvet,
        podskazka: 'Котангенс — число, обратное тангенсу.',
        razbor: [`$\\mathrm{ctg}\\,\\alpha = \\dfrac{1}{${chisloTex(x)}} = ${tex(otvet)}$.`],
        proverka: () => izChisla(Math.cos(Math.atan(x)) / Math.sin(Math.atan(x))),
      };
    }),
  ),
};

export const OPORNYE_16: NavykOpornyh[] = [
  {
    id: 'stepeni',
    nazvanie: 'Степени',
    lead: 'Одно основание, разложение основания, отрицательные показатели, степени десяти',
    ton: 'blue',
    bloki: [blokOdno, blokRazlozhit, blokOtricat, blokDesyat],
  },
  {
    id: 'korni',
    nazvanie: 'Корни',
    lead: 'Собрать под один корень, возвести в квадрат, раскрыть скобки',
    ton: 'orange',
    bloki: [blokOdinKoren, blokKvadrat, blokIzStepeney, blokSkobka, blokRaznost],
  },
  {
    id: 'logarifmy',
    nazvanie: 'Логарифмы',
    lead: 'Определение, сумма и разность, показатель, основное тождество',
    ton: 'green',
    bloki: [blokOpred, blokLogLoga, blokSumma, blokPokaz, blokTozhd],
  },
  {
    id: 'trig',
    nazvanie: 'Тригонометрия',
    lead: 'Знак по четверти, табличные значения, большие углы, тангенс и котангенс',
    ton: 'navy',
    bloki: [blokTozhdestvo, blokTangens, blokTablica, blokPrivedenie, blokTgCtg],
  },
];
