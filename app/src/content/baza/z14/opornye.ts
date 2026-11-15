/**
 * База, №14: опорные задачи — короткие выражения на одно действие с
 * дробями. Из этих шагов складывается любое выражение номера.
 *
 * Каждая задача задана числами. Ответ и разбор считаются здесь, в
 * точных дробях (пары целых); условие — запись выражения в TeX, как в
 * тренажёре. Независимый пересчёт `proverka` разбирает саму запись
 * условия (lib/baza/z14/proverka.ts) — его сверяет pnpm test:baza.
 */

import { nod, slovo, tex, zapis } from '@/lib/baza/chisla';
import type { BlokOpornyh, MikroZadacha, NavykOpornyh } from '@/lib/baza/types';
import { proveritVyrazhenie } from '@/lib/baza/z14/proverka';

/* ── Точные дроби ── */

interface Q {
  p: number;
  q: number;
}

function q(p: number, zn = 1): Q {
  const g = nod(p, zn) || 1;
  const s = zn < 0 ? -1 : 1;
  return { p: (s * p) / g, q: (s * zn) / g };
}
const plus = (a: Q, b: Q): Q => q(a.p * b.q + b.p * a.q, a.q * b.q);
const minus = (a: Q, b: Q): Q => q(a.p * b.q - b.p * a.q, a.q * b.q);
const umn = (a: Q, b: Q): Q => q(a.p * b.p, a.q * b.q);
const del = (a: Q, b: Q): Q => q(a.p * b.q, a.q * b.p);

/** Запись бланка и TeX ответа. */
const otv = (x: Q): string => zapis(x.p, x.q);
const t = (x: Q): string => tex(otv(x));

/** Десятичная дробь из записи «1,25». */
function dec(s: string): Q {
  const [c = '0', d = ''] = s.replace('−', '-').split(',');
  const znak = c.startsWith('-') ? -1 : 1;
  const tseloe = Math.abs(Number(c));
  return q(znak * Number(`${tseloe}${d}`), 10 ** d.length);
}

/** Цифр после запятой. */
const posle = (s: string): number => (s.split(',')[1] ?? '').length;

/** «1,25» → «1{,}25», «-0,5» → «-0{,}5». */
const dt = (s: string): string => s.replace(',', '{,}').replace('−', '-');

/** Обыкновенная дробь в TeX, со знаком: −9/4 → «-\dfrac{9}{4}». */
const fr = (x: Q): string =>
  x.q === 1 ? String(x.p) : `${x.p < 0 ? '-' : ''}\\dfrac{${Math.abs(x.p)}}{${x.q}}`;

/** Запись для пересчёта → запись условия. */
const pokaz = (zapisV: string): string =>
  zapisV.replace(/\\frac/g, '\\dfrac').replace(/(\d),(\d)/g, '$1{,}$2');

const nok = (a: number, b: number): number => (a / nod(a, b)) * b;

const zadachi = (slug: string, spisok: Omit<MikroZadacha, 'id'>[]): MikroZadacha[] =>
  spisok.map((z, i) => ({ ...z, id: `b14-${slug}-${String(i + 1).padStart(2, '0')}` }));

const USLOVIE = (zapisV: string, vid = pokaz(zapisV)): string =>
  `Найдите значение выражения $${vid}$.`;

/**
 * Произведение двух дробей с сокращением «крест-накрест»: шаги разбора
 * и результат.
 */
function sokratit(a: number, b: number, c: number, d: number): { shagi: string[]; x: Q } {
  /* a/b · c/d: сначала каждая дробь сама, потом a с d и c с b. */
  const pary: [number, number][] = [];
  let [a1, b1, c1, d1] = [a, b, c, d];
  const para = (u: number, v: number): [number, number] => {
    const g = nod(u, v);
    if (g > 1) pary.push([u, v]);
    return [u / g, v / g];
  };
  [a1, d1] = para(a1, d1);
  [c1, b1] = para(c1, b1);
  const x = umn(q(a, b), q(c, d));
  const shagi: string[] = [];
  const opisanie = pary.map(([u, v]) => `$${u}$ и $${v}$ — на $${nod(u, v)}$`).join(', ');
  shagi.push(
    pary.length > 0
      ? `Сокращаем крест-накрест: ${opisanie}.`
      : 'Сокращать нечего — перемножаем как есть.',
  );
  const itog = `\\dfrac{${a1} \\cdot ${c1}}{${b1} \\cdot ${d1}}`;
  const pryamo = `\\dfrac{${a1 * c1}}{${b1 * d1}}`;
  shagi.push(b1 * d1 === 1 ? `$${itog} = ${t(x)}$.` : `$${itog} = ${pryamo} = ${t(x)}$.`);
  return { shagi, x };
}

/* ══ Навык 1. Обыкновенные дроби ══ */

/* ── Блок 1. Общий знаменатель ── */
const OBSHCHIY: [number, number, '+' | '-', number, number][] = [
  [1, 4, '+', 3, 10],
  [5, 6, '-', 1, 3],
  [7, 10, '-', 1, 4],
  [2, 3, '+', 5, 6],
  [9, 20, '-', 1, 5],
  [5, 8, '+', 7, 40],
];

const blokObshchiy: BlokOpornyh = {
  slug: 'obshchiy-znamenatel',
  nazvanie: 'Общий знаменатель',
  opisanie: 'Сложить или вычесть дроби с разными знаменателями',
  zapomni:
    'Приведи дроби к общему знаменателю, потом сложи числители: $\\dfrac{a}{c} + \\dfrac{b}{c} = \\dfrac{a + b}{c}$.',
  znak: '\\tfrac{a}{c}+\\tfrac{b}{c}',
  zadachi: zadachi(
    'obshchiy',
    OBSHCHIY.map(([a, b, z, c, d]) => {
      const zapisV = `\\frac{${a}}{${b}}${z}\\frac{${c}}{${d}}`;
      const n = nok(b, d);
      const [a2, c2] = [a * (n / b), c * (n / d)];
      const r = z === '+' ? a2 + c2 : a2 - c2;
      const x = z === '+' ? plus(q(a, b), q(c, d)) : minus(q(a, b), q(c, d));
      const privedenie = [
        b === n ? '' : `$\\dfrac{${a}}{${b}} = \\dfrac{${a2}}{${n}}$`,
        d === n ? '' : `$\\dfrac{${c}}{${d}} = \\dfrac{${c2}}{${n}}$`,
      ]
        .filter((s) => s !== '')
        .join(', ');
      return {
        uslovie: USLOVIE(zapisV),
        otvet: otv(x),
        podskazka: `Общий знаменатель — $${n}$.`,
        razbor: [
          `Приводим к знаменателю $${n}$: ${privedenie}.`,
          `$\\dfrac{${a2}}{${n}} ${z} \\dfrac{${c2}}{${n}} = \\dfrac{${r}}{${n}} = ${t(x)}$.`,
        ],
        proverka: () => proveritVyrazhenie(zapisV),
      };
    }),
  ),
};

/* ── Блок 2. Умножение с сокращением ── */
const UMNOZHENIE: [number, number, number, number][] = [
  [4, 9, 27, 10],
  [15, 8, 4, 25],
  [7, 12, 18, 35],
  [21, 16, 8, 7],
  [9, 14, 28, 45],
  [25, 6, 9, 20],
];

const blokUmnozhenie: BlokOpornyh = {
  slug: 'umnozhenie-drobey',
  nazvanie: 'Умножение с сокращением',
  opisanie: 'Сократить крест-накрест и перемножить',
  zapomni:
    '$\\dfrac{a}{b} \\cdot \\dfrac{c}{d} = \\dfrac{a \\cdot c}{b \\cdot d}$. Сокращай до умножения: числитель одной дроби со знаменателем другой.',
  znak: '\\tfrac{a}{b}\\cdot\\tfrac{c}{d}',
  zadachi: zadachi(
    'umnozhenie',
    UMNOZHENIE.map(([a, b, c, d]) => {
      const zapisV = `\\frac{${a}}{${b}}\\cdot\\frac{${c}}{${d}}`;
      const { shagi, x } = sokratit(a, b, c, d);
      return {
        uslovie: USLOVIE(zapisV),
        otvet: otv(x),
        podskazka: `Сократите $${a}$ с $${d}$ и $${c}$ с $${b}$.`,
        razbor: shagi,
        proverka: () => proveritVyrazhenie(zapisV),
      };
    }),
  ),
};

/* ── Блок 3. Деление дробей ── */
const DELENIE: [number, number, number, number][] = [
  [3, 4, 5, 8],
  [9, 10, 3, 5],
  [7, 15, 14, 9],
  [5, 12, 25, 36],
  [6, 7, 15, 14],
  [11, 6, 22, 15],
];

const blokDelenie: BlokOpornyh = {
  slug: 'delenie-drobey',
  nazvanie: 'Деление дробей',
  opisanie: 'Заменить деление умножением на перевёрнутую дробь',
  zapomni:
    '$\\dfrac{a}{b} : \\dfrac{c}{d} = \\dfrac{a}{b} \\cdot \\dfrac{d}{c}$ — переворачивают только делитель.',
  znak: '\\tfrac{a}{b}:\\tfrac{c}{d}',
  zadachi: zadachi(
    'delenie',
    DELENIE.map(([a, b, c, d]) => {
      const zapisV = `\\frac{${a}}{${b}}:\\frac{${c}}{${d}}`;
      const { shagi, x } = sokratit(a, b, d, c);
      return {
        uslovie: USLOVIE(zapisV),
        otvet: otv(x),
        podskazka: `Делитель $\\dfrac{${c}}{${d}}$ переверните: $\\dfrac{${d}}{${c}}$.`,
        razbor: [
          `Делим — значит умножаем на перевёрнутую: $\\dfrac{${a}}{${b}} \\cdot \\dfrac{${d}}{${c}}$.`,
          ...shagi,
        ],
        proverka: () => proveritVyrazhenie(zapisV),
      };
    }),
  ),
};

/* ══ Навык 2. Смешанные числа ══ */

type Smesh = [number, number, number];
const smeshQ = ([a, b, c]: Smesh): Q => q(a * c + b, c);
const smeshTex = ([a, b, c]: Smesh): string => `${a}\\dfrac{${b}}{${c}}`;
const smeshZapis = ([a, b, c]: Smesh): string => `${a}\\frac{${b}}{${c}}`;

/* ── Блок 4. Смешанное и целое ── */
const S_TSELOE: { s: Smesh; n: number; snachalaSmesh: boolean }[] = [
  { s: [2, 3, 4], n: 5, snachalaSmesh: true },
  { s: [1, 1, 5], n: 4, snachalaSmesh: true },
  { s: [2, 1, 4], n: 6, snachalaSmesh: false },
  { s: [4, 1, 2], n: 7, snachalaSmesh: true },
  { s: [3, 2, 5], n: 8, snachalaSmesh: false },
  { s: [1, 7, 20], n: 3, snachalaSmesh: true },
];

const blokSmeshTseloe: BlokOpornyh = {
  slug: 'smeshannoe-i-tseloe',
  nazvanie: 'Смешанное число и целое',
  opisanie: 'Вычесть, когда ответ может уйти в минус',
  zapomni:
    'Запиши оба числа дробями с одним знаменателем: $a\\dfrac{b}{c} = \\dfrac{a \\cdot c + b}{c}$, $n = \\dfrac{n \\cdot c}{c}$.',
  znak: '2\\tfrac{3}{4}-5',
  zadachi: zadachi(
    'smesh-tseloe',
    S_TSELOE.map(({ s, n, snachalaSmesh }) => {
      const [, , c] = s;
      const zapisV = snachalaSmesh ? `${smeshZapis(s)}-${n}` : `${n}-${smeshZapis(s)}`;
      const sm = smeshQ(s);
      const nQ = q(n);
      const x = snachalaSmesh ? minus(sm, nQ) : minus(nQ, sm);
      const chS = s[0] * c + s[1];
      const chN = n * c;
      const r = snachalaSmesh ? chS - chN : chN - chS;
      const [lev, prav] = snachalaSmesh
        ? [`\\dfrac{${chS}}{${c}}`, `\\dfrac{${chN}}{${c}}`]
        : [`\\dfrac{${chN}}{${c}}`, `\\dfrac{${chS}}{${c}}`];
      return {
        uslovie: USLOVIE(zapisV),
        otvet: otv(x),
        podskazka: `Запишите оба числа дробями со знаменателем $${c}$.`,
        razbor: [
          `$${smeshTex(s)} = \\dfrac{${chS}}{${c}}$, $${n} = \\dfrac{${chN}}{${c}}$.`,
          `$${lev} - ${prav} = ${fr({ p: r, q: c })} = ${t(x)}$.`,
        ],
        proverka: () => proveritVyrazhenie(zapisV),
      };
    }),
  ),
};

/* ── Блок 5. Умножение и деление смешанных ── */
const S_UMN: [Smesh, '\\cdot' | ':', Smesh][] = [
  [[1, 1, 2], '\\cdot', [2, 2, 3]],
  [[2, 1, 4], '\\cdot', [1, 1, 3]],
  [[3, 1, 3], ':', [1, 1, 9]],
  [[1, 3, 5], '\\cdot', [3, 3, 4]],
  [[4, 1, 2], ':', [1, 1, 4]],
  [[5, 1, 4], ':', [2, 1, 3]],
];

const blokSmeshUmn: BlokOpornyh = {
  slug: 'smeshannye-umnozhenie',
  nazvanie: 'Умножение и деление смешанных',
  opisanie: 'Записать неправильными дробями, потом умножить или разделить',
  zapomni:
    'Перед умножением и делением: $a\\dfrac{b}{c} = \\dfrac{a \\cdot c + b}{c}$. Только целую часть не умножают.',
  znak: '1\\tfrac{1}{2}\\cdot 2\\tfrac{2}{3}',
  zadachi: zadachi(
    'smesh-umn',
    S_UMN.map(([s1, z, s2]) => {
      const zapisV = `${smeshZapis(s1)}${z}${smeshZapis(s2)}`;
      const [x1, x2] = [smeshQ(s1), smeshQ(s2)];
      const delim = z === ':';
      const { shagi, x } = delim
        ? sokratit(x1.p, x1.q, x2.q, x2.p)
        : sokratit(x1.p, x1.q, x2.p, x2.q);
      return {
        uslovie: USLOVIE(zapisV),
        otvet: otv(x),
        podskazka: 'Запишите оба смешанных числа неправильными дробями.',
        razbor: [
          `$${smeshTex(s1)} = ${fr(x1)}$, $${smeshTex(s2)} = ${fr(x2)}$.`,
          ...(delim
            ? [`Делим — умножаем на перевёрнутую: $${fr(x1)} \\cdot ${fr(q(x2.q, x2.p))}$.`]
            : []),
          ...shagi,
        ],
        proverka: () => proveritVyrazhenie(zapisV),
      };
    }),
  ),
};

/* ── Блок 6. Сложение и вычитание смешанных ── */
const S_SLOZH: [Smesh, '+' | '-', Smesh][] = [
  [[2, 1, 4], '+', [1, 1, 2]],
  [[3, 2, 5], '+', [1, 1, 10]],
  [[5, 3, 4], '-', [2, 1, 2]],
  [[4, 1, 8], '-', [1, 3, 4]],
  [[1, 2, 3], '+', [2, 1, 3]],
  [[6, 1, 5], '-', [2, 7, 10]],
];

const blokSmeshSlozh: BlokOpornyh = {
  slug: 'smeshannye-slozhenie',
  nazvanie: 'Сложение и вычитание смешанных',
  opisanie: 'Отдельно целые части, отдельно дробные',
  zapomni:
    'Складывай и вычитай целые части отдельно, дробные — отдельно, потом объедини: $a\\dfrac{b}{c} + d\\dfrac{e}{c} = (a + d) + \\dfrac{b + e}{c}$.',
  znak: '2\\tfrac{1}{4}+1\\tfrac{1}{2}',
  zadachi: zadachi(
    'smesh-slozh',
    S_SLOZH.map(([s1, z, s2]) => {
      const zapisV = `${smeshZapis(s1)}${z}${smeshZapis(s2)}`;
      const plyus = z === '+';
      const tseloe = plyus ? s1[0] + s2[0] : s1[0] - s2[0];
      const n = nok(s1[2], s2[2]);
      const [b2, e2] = [s1[1] * (n / s1[2]), s2[1] * (n / s2[2])];
      const ch = plyus ? b2 + e2 : b2 - e2;
      const drob = q(ch, n);
      const x = plyus ? plus(smeshQ(s1), smeshQ(s2)) : minus(smeshQ(s1), smeshQ(s2));
      const drobTex =
        s1[2] === s2[2]
          ? `\\dfrac{${s1[1]}}{${n}} ${z} \\dfrac{${s2[1]}}{${n}}`
          : `\\dfrac{${b2}}{${n}} ${z} \\dfrac{${e2}}{${n}}`;
      const drobRavno =
        ch === drob.p && n === drob.q ? fr(drob) : `${fr({ p: ch, q: n })} = ${fr(drob)}`;
      return {
        uslovie: USLOVIE(zapisV),
        otvet: otv(x),
        podskazka: 'Посчитайте отдельно целые части и отдельно дробные.',
        razbor: [
          `Целые: $${s1[0]} ${z} ${s2[0]} = ${tseloe}$. Дробные: $${drobTex} = ${drobRavno}$.`,
          drob.p < 0
            ? `$${tseloe} - ${fr(q(-drob.p, drob.q))} = ${t(x)}$.`
            : `$${tseloe} + ${fr(drob)} = ${t(x)}$.`,
        ],
        proverka: () => proveritVyrazhenie(zapisV),
      };
    }),
  ),
};

/* ══ Навык 3. Десятичные дроби ══ */

/* ── Блок 7. Умножение десятичных ── */
const D_UMN: [string, string][] = [
  ['0,25', '1,6'],
  ['1,2', '0,05'],
  ['2,5', '0,8'],
  ['0,35', '0,4'],
  ['3,2', '1,5'],
  ['0,6', '0,07'],
];

const bezZapyatoy = (s: string): number => Number(s.replace(',', ''));

const blokDecUmn: BlokOpornyh = {
  slug: 'umnozhenie-desyatichnyh',
  nazvanie: 'Умножение десятичных',
  opisanie: 'Умножить как целые и поставить запятую',
  zapomni:
    'Умножай как целые, потом отдели справа столько цифр, сколько их после запятой в обоих множителях вместе: $0{,}3 \\cdot 0{,}2 = 0{,}06$.',
  znak: '0{,}3\\cdot 0{,}2',
  zadachi: zadachi(
    'dec-umn',
    D_UMN.map(([a, b]) => {
      const zapisV = `${a}\\cdot${b}`;
      const x = umn(dec(a), dec(b));
      const [ka, kb] = [posle(a), posle(b)];
      const k = ka + kb;
      const ab = bezZapyatoy(a) * bezZapyatoy(b);
      /* Произведение с запятой, но ещё с нулями на конце: 400 → «0,400». */
      const cifry = String(ab).padStart(k + 1, '0');
      const syroe = `${cifry.slice(0, -k)}{,}${cifry.slice(-k)}`;
      const itog = syroe === t(x) ? t(x) : `${syroe} = ${t(x)}`;
      return {
        uslovie: USLOVIE(zapisV, `${dt(a)} \\cdot ${dt(b)}`),
        otvet: otv(x),
        podskazka: `Перемножьте $${bezZapyatoy(a)} \\cdot ${bezZapyatoy(b)}$ и отделите $${k}$ ${slovo(k, ['цифру', 'цифры', 'цифр'])}.`,
        razbor: [
          `Как целые: $${bezZapyatoy(a)} \\cdot ${bezZapyatoy(b)} = ${ab}$.`,
          `После запятой $${ka} + ${kb} = ${k}$ ${slovo(k, ['цифра', 'цифры', 'цифр'])}: $${itog}$.`,
        ],
        proverka: () => proveritVyrazhenie(zapisV),
      };
    }),
  ),
};

/* ── Блок 8. Деление на десятичную ── */
const D_DEL: [string, string][] = [
  ['4,8', '0,6'],
  ['0,72', '0,08'],
  ['1,5', '0,03'],
  ['2,4', '0,16'],
  ['0,9', '1,2'],
  ['3,6', '0,045'],
];

const blokDecDel: BlokOpornyh = {
  slug: 'delenie-desyatichnyh',
  nazvanie: 'Деление на десятичную',
  opisanie: 'Перенести запятую, чтобы делитель стал целым',
  zapomni:
    'Перенеси запятую в делимом и делителе на одинаковое число знаков вправо, пока делитель не станет целым: $4{,}2 : 0{,}06 = 420 : 6$.',
  znak: '4{,}2:0{,}06',
  zadachi: zadachi(
    'dec-del',
    D_DEL.map(([a, b]) => {
      const zapisV = `${a}:${b}`;
      const x = del(dec(a), dec(b));
      const k = posle(b);
      const aQ = dec(a);
      const a2 = t(q(aQ.p * 10 ** k, aQ.q));
      const b2 = bezZapyatoy(b);
      return {
        uslovie: USLOVIE(zapisV, `${dt(a)} : ${dt(b)}`),
        otvet: otv(x),
        podskazka: `В делителе $${k}$ ${slovo(k, ['цифра', 'цифры', 'цифр'])} после запятой.`,
        razbor: [
          `Переносим запятую на $${k}$ ${slovo(k, ['знак', 'знака', 'знаков'])} вправо в обоих числах: $${a2} : ${b2}$.`,
          `$${a2} : ${b2} = ${t(x)}$.`,
        ],
        proverka: () => proveritVyrazhenie(zapisV),
      };
    }),
  ),
};

/* ── Блок 9. Обыкновенная → десятичная ── */
const PEREVOD: [number, number][] = [
  [3, 8],
  [7, 20],
  [11, 25],
  [13, 50],
  [3, 16],
  [17, 5],
];

const blokPerevod: BlokOpornyh = {
  slug: 'v-desyatichnuyu',
  nazvanie: 'Обыкновенную — в десятичную',
  opisanie: 'Домножить знаменатель до 10, 100, 1000',
  zapomni:
    'Подбери множитель, чтобы знаменатель стал $10$, $100$, $1000$: $\\dfrac{7}{20} = \\dfrac{35}{100} = 0{,}35$.',
  znak: '\\tfrac{3}{8}=0{,}375',
  zadachi: zadachi(
    'perevod',
    PEREVOD.map(([m, n]) => {
      const zapisV = `\\frac{${m}}{${n}}`;
      let st = 10;
      while (st % n !== 0) st *= 10;
      const mn = st / n;
      const x = q(m, n);
      return {
        uslovie: `Запишите десятичной дробью: $\\dfrac{${m}}{${n}}$.`,
        otvet: otv(x),
        podskazka: `Домножьте числитель и знаменатель на $${mn}$.`,
        razbor: [
          `$${n} \\cdot ${mn} = ${st}$: $\\dfrac{${m}}{${n}} = \\dfrac{${m * mn}}{${st}}$.`,
          `$\\dfrac{${m * mn}}{${st}} = ${t(x)}$.`,
        ],
        proverka: () => proveritVyrazhenie(zapisV),
      };
    }),
  ),
};

/* ══ Навык 4. Порядок, этажи, знаки ══ */

/* ── Блок 10. Порядок действий ── */
const PORYADOK: [string, '+' | '-', string, '\\cdot' | ':', string][] = [
  ['1,5', '+', '2,5', '\\cdot', '0,4'],
  ['7', '-', '4,2', ':', '0,7'],
  ['0,8', '+', '3,6', ':', '1,2'],
  ['10', '-', '1,25', '\\cdot', '4'],
  ['2,3', '+', '0,7', '\\cdot', '0,3'],
  ['4,5', '-', '1,8', ':', '0,6'],
];

const blokPoryadok: BlokOpornyh = {
  slug: 'poryadok-deystviy',
  nazvanie: 'Порядок действий',
  opisanie: 'Сначала умножение и деление, потом сложение и вычитание',
  zapomni:
    'Скобки → умножение и деление слева направо → сложение и вычитание слева направо. $2 + 0{,}5 \\cdot 6 = 2 + 3 = 5$.',
  znak: 'a+b\\cdot c',
  zadachi: zadachi(
    'poryadok',
    PORYADOK.map(([a, z1, b, z2, c]) => {
      const zapisV = `${a}${z1}${b}${z2}${c}`;
      const vtoroe = z2 === ':' ? del(dec(b), dec(c)) : umn(dec(b), dec(c));
      const x = z1 === '+' ? plus(dec(a), vtoroe) : minus(dec(a), vtoroe);
      return {
        uslovie: USLOVIE(zapisV, `${dt(a)} ${z1} ${dt(b)} ${z2} ${dt(c)}`),
        otvet: otv(x),
        podskazka: z2 === ':' ? 'Сначала деление.' : 'Сначала умножение.',
        razbor: [
          `${z2 === ':' ? 'Деление' : 'Умножение'}: $${dt(b)} ${z2} ${dt(c)} = ${t(vtoroe)}$.`,
          `$${dt(a)} ${z1} ${t(vtoroe)} = ${t(x)}$.`,
        ],
        proverka: () => proveritVyrazhenie(zapisV),
      };
    }),
  ),
};

/* ── Блок 11. Многоэтажная дробь ── */
const ETAZHI: [number, number, '+' | '-', number, number][] = [
  [1, 1, '+', 1, 9],
  [2, 1, '+', 1, 3],
  [3, 2, '-', 1, 2],
  [1, 1, '-', 1, 5],
  [6, 1, '+', 1, 4],
  [7, 3, '+', 1, 2],
];

const blokEtazhi: BlokOpornyh = {
  slug: 'mnogoetazhnye',
  nazvanie: 'Многоэтажная дробь',
  opisanie: 'Сначала нижний этаж, потом деление',
  zapomni:
    'Считай снизу вверх. Деление на дробь: $\\dfrac{a}{\\;\\frac{b}{c}\\;} = \\dfrac{a \\cdot c}{b}$.',
  znak: '\\dfrac{1}{1+\\frac{1}{n}}',
  zadachi: zadachi(
    'etazhi',
    ETAZHI.map(([a, k, z, p, n]) => {
      const zapisV = `\\frac{${a}}{${k}${z}\\frac{${p}}{${n}}}`;
      const niz = z === '+' ? plus(q(k), q(p, n)) : minus(q(k), q(p, n));
      const x = del(q(a), niz);
      return {
        uslovie: USLOVIE(zapisV, `\\dfrac{${a}}{${k} ${z} \\frac{${p}}{${n}}}`),
        otvet: otv(x),
        podskazka: `Сначала посчитайте знаменатель $${k} ${z} \\dfrac{${p}}{${n}}$.`,
        razbor: [
          `Нижний этаж: $${k} ${z} \\dfrac{${p}}{${n}} = ${fr(niz)}$.`,
          `$${a} : ${fr(niz)} = \\dfrac{${a} \\cdot ${niz.q}}{${niz.p}} = ${t(x)}$.`,
        ],
        proverka: () => proveritVyrazhenie(zapisV),
      };
    }),
  ),
};

/* ── Блок 12. Отрицательные числа ── */
const ZNAKI: [string, '+' | '-' | '\\cdot' | ':', string][] = [
  ['1,2', '-', '4,5'],
  ['-2,5', '-', '1,7'],
  ['3,6', '-', '-1,4'],
  ['-0,8', '\\cdot', '-2,5'],
  ['-4,2', ':', '0,6'],
  ['-1,5', ':', '-0,25'],
];

/** Число в выражении: отрицательное второе — в скобках. */
const vSkobkah = (s: string): string => (s.startsWith('-') ? `(${dt(s)})` : dt(s));
const modul = (s: string): string => dt(s.replace('-', ''));
const abs = (x: Q): Q => ({ p: Math.abs(x.p), q: x.q });

function razborZnaka(a: string, z: string, b: string, x: Q): string[] {
  const [qa, qb] = [dec(a), dec(b)];
  const vyr = `${dt(a)} ${z} ${vSkobkah(b)}`;
  if (z === '\\cdot' || z === ':') {
    const odinakovye = qa.p < 0 === qb.p < 0;
    const m = z === ':' ? del(abs(qa), abs(qb)) : umn(abs(qa), abs(qb));
    return [
      `Знаки ${odinakovye ? 'одинаковые — ответ положительный' : 'разные — ответ отрицательный'}.`,
      `$${modul(a)} ${z} ${modul(b)} = ${t(m)}$, значит $${vyr} = ${t(x)}$.`,
    ];
  }
  if (qb.p < 0) {
    return [`Минус на минус даёт плюс: $${vyr} = ${dt(a)} + ${modul(b)} = ${t(x)}$.`];
  }
  if (qa.p < 0) {
    const s = plus(abs(qa), qb);
    return [
      `Оба числа уводят влево: складываем $${modul(a)} + ${dt(b)} = ${t(s)}$.`,
      `Ставим минус: $${vyr} = ${t(x)}$.`,
    ];
  }
  const d = minus(qb, qa);
  return [
    `Из меньшего вычитаем большее: $${dt(b)} - ${dt(a)} = ${t(d)}$.`,
    `Ставим минус: $${vyr} = ${t(x)}$.`,
  ];
}

const blokZnaki: BlokOpornyh = {
  slug: 'otricatelnye',
  nazvanie: 'Отрицательные числа',
  opisanie: 'Вычитание и знак произведения или частного',
  zapomni: '$a - (-b) = a + b$. При умножении и делении: знаки одинаковые — плюс, разные — минус.',
  znak: 'a-(-b)',
  zadachi: zadachi(
    'znaki',
    ZNAKI.map(([a, z, b]) => {
      const zapisV = `${a}${z}${b.startsWith('-') ? `(${b})` : b}`;
      const [qa, qb] = [dec(a), dec(b)];
      const x =
        z === '+'
          ? plus(qa, qb)
          : z === '-'
            ? minus(qa, qb)
            : z === '\\cdot'
              ? umn(qa, qb)
              : del(qa, qb);
      return {
        uslovie: USLOVIE(zapisV, `${dt(a)} ${z} ${vSkobkah(b)}`),
        otvet: otv(x),
        podskazka:
          z === '\\cdot' || z === ':'
            ? 'Сначала определите знак ответа, потом считайте без знаков.'
            : 'Представьте числа на числовой прямой.',
        razbor: razborZnaka(a, z, b, x),
        proverka: () => proveritVyrazhenie(zapisV),
      };
    }),
  ),
};

export const OPORNYE_14: NavykOpornyh[] = [
  {
    id: 'obyknovennye',
    nazvanie: 'Обыкновенные дроби',
    lead: 'Общий знаменатель, сокращение, перевёрнутая дробь',
    ton: 'blue',
    bloki: [blokObshchiy, blokUmnozhenie, blokDelenie],
  },
  {
    id: 'smeshannye',
    nazvanie: 'Смешанные числа',
    lead: 'Неправильная дробь или целые и дробные части отдельно',
    ton: 'orange',
    bloki: [blokSmeshTseloe, blokSmeshUmn, blokSmeshSlozh],
  },
  {
    id: 'desyatichnye',
    nazvanie: 'Десятичные дроби',
    lead: 'Умножение, деление с переносом запятой, перевод',
    ton: 'green',
    bloki: [blokDecUmn, blokDecDel, blokPerevod],
  },
  {
    id: 'poryadok',
    nazvanie: 'Порядок, этажи и знаки',
    lead: 'Что считать сначала и какой знак у ответа',
    ton: 'navy',
    bloki: [blokPoryadok, blokEtazhi, blokZnaki],
  },
];
