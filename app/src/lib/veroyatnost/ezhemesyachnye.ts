/**
 * Шаблоны раздела «Ежемесячные варианты» для заданий №4 и №5.
 *
 * Прототипы того же устройства, что банк раздела (types.ts, `Prototype`):
 * условие, допустимость, ответ формулой и вторым путём (перебор), шаги
 * с этапами из общего словаря и подсказки-вопросы. В BANK_4 и BANK_5
 * они не входят; чисел своих у них нет (`varianty` пусто): числа и
 * сюжет задаёт вариант.
 */

import { shagP } from './bank4/vizual';
import { shtuk, tex, tochnee, tochno, veroyatnost } from './bank5/obshchee';
import { skl } from './morfologia';
import { vopros } from './podskazka';
import { dec, konechnaya, num, text, type Params, type Prototype } from './types';

const SVOI = {
  blok: 'ezhemesyachnye',
  sourceRange: [0, 0] as const,
  okruglenie: tochno,
  varianty: [],
};

/** C(n, k). */
function soch(n: number, k: number): number {
  let c = 1;
  for (let i = 1; i <= k; i += 1) c = (c * (n - k + i)) / i;
  return Math.round(c);
}

/** Перебор 2ⁿ серий: вероятность ровно k успехов. */
function bernulliPerebor(n: number, k: number, q: number): number {
  let P = 0;
  for (let mask = 0; mask < 2 ** n; mask += 1) {
    let hits = 0;
    let w = 1;
    for (let i = 0; i < n; i += 1) {
      if ((mask >> i) & 1) {
        hits += 1;
        w *= q;
      } else w *= 1 - q;
    }
    if (hits === k) P += w;
  }
  return P;
}

/* ── №4. Оба изделия — в нужном интервале массы ─────────────────── */

const vNorme = (p: Params) => tochnee(veroyatnost(p, 'p1') + veroyatnost(p, 'p2') - 1);

/**
 * P(m < b) = p1, P(m > a) = p2 → P(a < m < b) = p1 + p2 − 1 (события
 * «m < b» и «m > a» вместе покрывают всё); два изделия независимо —
 * квадрат. Подвох — перемножить p1 и p2.
 */
export const EV4_DVA_V_NORME: Prototype = {
  ...SVOI,
  id: 'ev4-dva-v-norme',
  nazvanie: 'Масса в интервале по двум «хвостам», два изделия независимо',
  tip: 'Независимые события',
  format: 'десятичная',
  uslovie: (p) =>
    `Сыроварня продаёт головки сыра массой от ${dec(num(p, 'a'))} до ${dec(num(p, 'b'))} кг — именно такие охотнее всего берут кафе. ` +
    `Вероятность того, что масса случайно выбранной головки меньше ${dec(num(p, 'b'))} кг, равна ${dec(veroyatnost(p, 'p1'))}, ` +
    `а вероятность того, что её масса больше ${dec(num(p, 'a'))} кг, равна ${dec(veroyatnost(p, 'p2'))}. ` +
    `Повар кафе наугад берёт две головки. Найдите вероятность того, что масса обеих окажется от ${dec(num(p, 'a'))} до ${dec(num(p, 'b'))} кг.`,
  dopustimo: (p) => {
    const q = vNorme(p);
    return q > 0 && q < 1 && konechnaya(q * q) && num(p, 'a') < num(p, 'b');
  },
  otvet: (p) => tochnee(vNorme(p) ** 2),
  /* Второй путь: 100 головок, по долям — сколько «тяжёлых» и «лёгких»; пары — из 100·100. */
  perebor: (p) => {
    const N = 100;
    const legkie = N - shtuk(veroyatnost(p, 'p2'), N);
    const tyazhelye = N - shtuk(veroyatnost(p, 'p1'), N);
    const m = N - legkie - tyazhelye;
    return (m * m) / (N * N);
  },
  shagi: (p) => {
    const p1 = veroyatnost(p, 'p1');
    const p2 = veroyatnost(p, 'p2');
    const q = vNorme(p);
    const a = dec(num(p, 'a'));
    const b = dec(num(p, 'b'));
    return [
      {
        etap: 'Связь событий',
        text: `Событие «масса меньше ${b} кг» не наступает только у тяжёлых головок, а «масса больше ${a} кг» — только у лёгких. Вместе эти события покрывают все случаи, а их пересечение — нужный интервал.`,
      },
      {
        etap: 'Вычисление',
        text: 'Вероятность объединения равна единице, поэтому вероятность пересечения:',
        formula: `q = ${tex(p1)} + ${tex(p2)} - 1 = ${tex(q)}`,
        value: q,
      },
      {
        etap: 'Ответ',
        text: 'Массы двух случайно взятых головок независимы — вероятности перемножаются:',
        formula: `P = ${tex(q)}\\cdot${tex(q)} = ${tex(q * q)}`,
        value: tochnee(q * q),
      },
    ];
  },
  podskazka: (p) => {
    const p1 = veroyatnost(p, 'p1');
    const p2 = veroyatnost(p, 'p2');
    const q = vNorme(p);
    return [
      vopros(
        'Чему равна вероятность того, что масса одной головки в нужном интервале?',
        `$${tex(p1)} + ${tex(p2)} - 1 = ${tex(q)}$`,
        [`$${tex(p1)}\\cdot${tex(p2)}$`, `$${tex(p1)} - ${tex(p2)}$`, `$1 - ${tex(p1)}$`],
        'Два «хвоста» вместе покрывают всё, а общая часть посчитана дважды.',
      ),
      vopros(
        'Как получить вероятность для двух головок?',
        `Возвести $${tex(q)}$ в квадрат`,
        [`Умножить $${tex(q)}$ на $2$`, `Сложить $${tex(q)}$ и $${tex(q)}$`],
        'Головки выбираются независимо.',
      ),
    ];
  },
};

/* ── №4. Диаграмма Эйлера: условная вероятность ─────────────────── */

/**
 * Точки на диаграмме: только в A (nA), в A и B (nAB), только в B (nB),
 * вне обоих (n0). Все исходы равновозможны.
 */
function eilerChisla(p: Params) {
  const nA = num(p, 'nA');
  const nAB = num(p, 'nAB');
  const nB = num(p, 'nB');
  const n0 = num(p, 'n0');
  return { nA, nAB, nB, n0, vsego: nA + nAB + nB + n0, vA: nA + nAB };
}

export const EV4_EILER_USLOVNAYA: Prototype = {
  ...SVOI,
  id: 'ev4-eiler-uslovnaya',
  nazvanie: 'Диаграмма Эйлера с точками: условная вероятность $P(B\\mid A)$',
  tip: 'Условная вероятность',
  format: 'десятичная',
  uslovie: (p) => {
    const { vsego } = eilerChisla(p);
    return `На диаграмме Эйлера показаны события $A$ и $B$ в некотором случайном эксперименте, в котором ${vsego} равновозможных элементарных событий. Элементарные события показаны точками. Найдите $P(B\\mid A)$ — условную вероятность события $B$ при условии $A$.`;
  },
  dopustimo: (p) => {
    const { nAB, vA } = eilerChisla(p);
    return vA > 0 && nAB > 0 && konechnaya(nAB / vA);
  },
  otvet: (p) => {
    const { nAB, vA } = eilerChisla(p);
    return tochnee(nAB / vA);
  },
  /* Второй путь: P(A∩B) / P(A) долями всех исходов. */
  perebor: (p) => {
    const { nAB, vA, vsego } = eilerChisla(p);
    return tochnee(nAB / vsego / (vA / vsego));
  },
  shagi: (p) => {
    const { nA, nAB, vA } = eilerChisla(p);
    return [
      {
        etap: 'Все исходы',
        text: `При условии $A$ остаются только точки внутри $A$: ${nA} только в $A$ и ${nAB} в общей части.`,
        formula: `n = ${nA} + ${nAB} = ${vA}`,
        value: vA,
      },
      {
        etap: 'Благоприятные исходы',
        text: 'Из них событию $B$ благоприятствуют точки общей части $A$ и $B$:',
        formula: `m = ${nAB}`,
        value: nAB,
      },
      shagP(nAB, vA),
    ];
  },
  podskazka: (p) => {
    const { nAB, vA, vsego } = eilerChisla(p);
    return [
      vopros('Какие точки остаются при условии $A$?', 'Только точки внутри $A$', [
        'Все точки диаграммы',
        'Только точки внутри $B$',
      ]),
      vopros(`Сколько из ${vA} точек внутри $A$ лежат и в $B$?`, `$${nAB}$`, [
        `$${vA - nAB}$`,
        `$${vA}$`,
      ]),
      vopros(
        'Как найти $P(B\\mid A)$?',
        `$\\dfrac{${nAB}}{${vA}}$`,
        [`$\\dfrac{${nAB}}{${vsego}}$`, `$\\dfrac{${vA}}{${vsego}}$`],
        'Условная вероятность — доля благоприятных среди исходов, где наступило $A$.',
      ),
    ];
  },
};

/** Точки в областях диаграммы: позиции в координатах рисунка 300×190. */
const SLOTY = {
  A: [
    [70, 70],
    [62, 118],
    [96, 98],
    [92, 142],
    [100, 52],
  ],
  AB: [
    [150, 76],
    [146, 122],
    [158, 100],
  ],
  B: [
    [208, 66],
    [226, 118],
    [196, 140],
    [234, 88],
  ],
  O: [
    [28, 26],
    [272, 30],
    [270, 168],
    [150, 172],
    [32, 170],
    [150, 26],
    [200, 176],
  ],
} as const;

/**
 * Рисунок условия: прямоугольник опыта, два овала событий и точки —
 * той же разметкой и теми же классами, что диаграмма №6
 * (components/probability/EilerDiagramma). Выделение (точки A∩B) —
 * только на рисунке к разбору.
 */
export function eilerSobytiyaSvg(p: Params, vydelit = false): string {
  const { nA, nAB, nB, n0 } = eilerChisla(p);
  const w = 300;
  const h = 190;
  const take = (key: keyof typeof SLOTY, k: number) => {
    if (k > SLOTY[key].length) throw new Error(`Эйлер: в области ${key} нет места для ${k} точек`);
    return SLOTY[key].slice(0, k);
  };
  const tochki = [
    ...take('A', nA).map((t) => ({ t, ab: false })),
    ...take('AB', nAB).map((t) => ({ t, ab: true })),
    ...take('B', nB).map((t) => ({ t, ab: false })),
    ...take('O', n0).map((t) => ({ t, ab: false })),
  ];
  const kr = 'fill="none" stroke="currentColor" stroke-width="1.25"';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" data-engine="veroyatnost" data-min-font="16" class="pr-eiler" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" ` +
    `aria-label="Диаграмма Эйлера двух событий: ${tochki.length} элементарных событий; только в первом — ${nA}, в обоих — ${nAB}, только во втором — ${nB}, вне обоих — ${n0}">` +
    `<rect class="pr-eiler__opyt" x="4" y="4" width="${w - 8}" height="${h - 8}" rx="3" ${kr}/>` +
    `<ellipse class="pr-eiler__opyt" cx="112" cy="97" rx="78" ry="62" ${kr}/>` +
    `<ellipse class="pr-eiler__opyt" cx="190" cy="97" rx="72" ry="62" ${kr}/>` +
    `<text class="pr-math pr-eiler__s" x="16" y="24" font-style="italic" font-size="16">S</text>` +
    `<text class="pr-math pr-eiler__s" x="42" y="54" font-style="italic" font-size="16">A</text>` +
    `<text class="pr-math pr-eiler__s" x="252" y="54" font-style="italic" font-size="16">B</text>` +
    tochki
      .map(
        ({ t, ab }) =>
          `<g class="pr-eiler__tochka${vydelit && ab ? ' is-vydelena' : ''}"><circle cx="${t[0]}" cy="${t[1]}" r="${vydelit && ab ? 5.2 : 3.6}" fill="currentColor"/></g>`,
      )
      .join('') +
    `</svg>`
  );
}

/* ── №4. Хотя бы одно из двух событий ───────────────────────────── */

export const EV4_HOTYA_BY_ODNO: Prototype = {
  ...SVOI,
  id: 'ev4-hotya-by-odno',
  nazvanie: 'Хотя бы одно из двух совместных событий: формула сложения',
  tip: 'Сложение вероятностей',
  format: 'десятичная',
  uslovie: (p) =>
    `${text(p, 'kto')} выходит на утреннюю прогулку по парку с фотоаппаратом. Вероятность сфотографировать белку равна ${dec(veroyatnost(p, 'pA'))}, ` +
    `вероятность сфотографировать дятла равна ${dec(veroyatnost(p, 'pB'))}, а вероятность за одну прогулку сфотографировать и белку, и дятла равна ${dec(veroyatnost(p, 'pAB'))}. ` +
    `Найдите вероятность того, что на прогулке удастся сфотографировать хотя бы одного из них.`,
  dopustimo: (p) => {
    const pA = veroyatnost(p, 'pA');
    const pB = veroyatnost(p, 'pB');
    const pAB = veroyatnost(p, 'pAB');
    const o = tochnee(pA + pB - pAB);
    return pAB <= Math.min(pA, pB) && o > 0 && o < 1;
  },
  otvet: (p) => tochnee(veroyatnost(p, 'pA') + veroyatnost(p, 'pB') - veroyatnost(p, 'pAB')),
  /* Второй путь: 100 прогулок — только белка, только дятел, оба. */
  perebor: (p) => {
    const A = shtuk(veroyatnost(p, 'pA'), 100);
    const B = shtuk(veroyatnost(p, 'pB'), 100);
    const AB = shtuk(veroyatnost(p, 'pAB'), 100);
    return (A - AB + (B - AB) + AB) / 100;
  },
  shagi: (p) => {
    const pA = veroyatnost(p, 'pA');
    const pB = veroyatnost(p, 'pB');
    const pAB = veroyatnost(p, 'pAB');
    const o = tochnee(pA + pB - pAB);
    return [
      {
        etap: 'Связь событий',
        text: 'События «белка» и «дятел» совместны: на одной прогулке может случиться и то и другое. «Хотя бы один» — их объединение.',
      },
      {
        etap: 'Ответ',
        text: 'Складываем вероятности и вычитаем вероятность пересечения — иначе прогулки с обоими зверьками посчитаны дважды:',
        formula: `P(A\\cup B) = ${tex(pA)} + ${tex(pB)} - ${tex(pAB)} = ${tex(o)}`,
        value: o,
      },
    ];
  },
  podskazka: (p) => {
    const pA = veroyatnost(p, 'pA');
    const pB = veroyatnost(p, 'pB');
    const pAB = veroyatnost(p, 'pAB');
    return [
      vopros('Совместны ли события «белка» и «дятел»?', 'Да: возможно и то и другое', [
        'Нет: они исключают друг друга',
        'Они противоположны',
      ]),
      vopros(
        'По какой формуле считать?',
        '$P(A)+P(B)-P(A\\cap B)$',
        ['$P(A)+P(B)$', '$P(A)\\cdot P(B)$'],
        `$${tex(pA)}+${tex(pB)}-${tex(pAB)}$.`,
      ),
    ];
  },
};

/* ── №4. Второй этап — только после первого ─────────────────────── */

export const EV4_DVA_ETAPA: Prototype = {
  ...SVOI,
  id: 'ev4-dva-etapa',
  nazvanie: 'Второй этап — только после первого: «первый сдан, второй нет»',
  tip: 'Сложение вероятностей',
  format: 'десятичная',
  uslovie: (p) =>
    `Чтобы получить водительские права, нужно сдать теоретический экзамен, а затем экзамен по вождению; к вождению допускают только тех, кто сдал теорию. ` +
    `Вероятность того, что ученик автошколы сдаст теорию, равна ${dec(veroyatnost(p, 'p1'))}, а вероятность того, что он сдаст оба экзамена, равна ${dec(veroyatnost(p, 'p12'))}. ` +
    `Найдите вероятность того, что ученик сдаст теорию, но не сдаст вождение.`,
  dopustimo: (p) => veroyatnost(p, 'p12') < veroyatnost(p, 'p1'),
  otvet: (p) => tochnee(veroyatnost(p, 'p1') - veroyatnost(p, 'p12')),
  perebor: (p) => (shtuk(veroyatnost(p, 'p1'), 100) - shtuk(veroyatnost(p, 'p12'), 100)) / 100,
  shagi: (p) => {
    const p1 = veroyatnost(p, 'p1');
    const p12 = veroyatnost(p, 'p12');
    const o = tochnee(p1 - p12);
    return [
      {
        etap: 'Связь событий',
        text: 'Сдавшие теорию делятся на две несовместные группы: сдали и вождение (получили права) и не сдали вождение.',
      },
      {
        etap: 'Ответ',
        text: 'Вероятность сдать теорию — сумма вероятностей этих групп, поэтому:',
        formula: `P = ${tex(p1)} - ${tex(p12)} = ${tex(o)}`,
        value: o,
      },
    ];
  },
  podskazka: (p) => {
    const p1 = veroyatnost(p, 'p1');
    const p12 = veroyatnost(p, 'p12');
    return [
      vopros(
        'На какие группы делятся ученики, сдавшие теорию?',
        'Сдали вождение и не сдали вождение',
        ['Сдали и не сдали теорию', 'Получили права и не допущены к вождению'],
      ),
      vopros('Какое выражение даёт ответ?', `$${tex(p1)}-${tex(p12)}$`, [
        `$${tex(p1)}\\cdot(1-${tex(p12)})$`,
        `$1-${tex(p12)}$`,
      ]),
    ];
  },
};

/* ── №5. Хотя бы один из трёх независимых ───────────────────────── */

export const EV5_HOTYA_BY_TRI: Prototype = {
  ...SVOI,
  id: 'ev5-hotya-by-tri',
  nazvanie: 'Хотя бы одно из трёх независимых событий — через противоположное, в процентах',
  tip: 'Независимые события',
  format: 'целое',
  uslovie: (p) =>
    `Молодая группа «${text(p, 'gruppa')}» разослала своё демо на три независимых лейбла. Первый лейбл заключит с группой контракт с вероятностью ${num(p, 'q1')}%, второй — с вероятностью ${num(p, 'q2')}%, третий — с вероятностью ${num(p, 'q3')}%. ` +
    `Других предложений не будет. С какой вероятностью (в процентах) группа подпишет хотя бы один контракт?`,
  dopustimo: (p) => [1, 2, 3].every((i) => num(p, `q${i}`) > 0 && num(p, `q${i}`) < 100),
  otvet: (p) => tochnee(100 * (1 - [1, 2, 3].reduce((s, i) => s * (1 - num(p, `q${i}`) / 100), 1))),
  /* Второй путь: перебор 2³ исходов «да/нет» у трёх лейблов. */
  perebor: (p) => {
    const q = [1, 2, 3].map((i) => num(p, `q${i}`) / 100);
    let P = 0;
    for (let mask = 1; mask < 8; mask += 1) {
      P += q.reduce((w, x, i) => w * ((mask >> i) & 1 ? x : 1 - x), 1);
    }
    return tochnee(100 * P);
  },
  shagi: (p) => {
    const q = [1, 2, 3].map((i) => num(p, `q${i}`) / 100);
    const net = q.map((x) => tochnee(1 - x));
    const nikto = tochnee(net.reduce((s, x) => s * x, 1));
    const o = tochnee(100 * (1 - nikto));
    return [
      {
        etap: 'Противоположное событие',
        text: '«Хотя бы один контракт» противоположно событию «ни один лейбл не заключит контракт». Отказы лейблов независимы:',
        formula: `P(\\text{ни одного}) = ${net.map(tex).join('\\cdot')} = ${tex(nikto)}`,
        value: nikto,
      },
      {
        etap: 'Ответ',
        text: 'Вычитаем из единицы и переводим в проценты:',
        formula: `P = 1 - ${tex(nikto)} = ${tex(tochnee(1 - nikto))} = ${dec(o)}\\%`,
        value: o,
      },
    ];
  },
  podskazka: (p) => {
    const q = [1, 2, 3].map((i) => num(p, `q${i}`) / 100);
    return [
      vopros(
        'Какое событие противоположно «хотя бы один контракт»?',
        'Ни один лейбл не заключит контракт',
        ['Все три заключат контракт', 'Ровно один заключит контракт'],
      ),
      vopros(
        'Чему равна вероятность того, что ни один лейбл не заключит контракт?',
        `$${q.map((x) => tex(tochnee(1 - x))).join('\\cdot')}$`,
        [`$${q.map((x) => tex(x)).join('\\cdot')}$`, `$1-${q.map((x) => tex(x)).join('-')}$`],
      ),
    ];
  },
};

/* ── №5. Схема Бернулли: отношение двух вероятностей ────────────── */

/** Сюжеты: одна серия у одного человека или две серии у двоих. */
function bernulliChisla(p: Params) {
  const n = num(p, 'n');
  const k1 = num(p, 'k1');
  const k2 = num(p, 'k2');
  const q1 = veroyatnost(p, 'q1');
  const q2 = veroyatnost(p, 'q2');
  const P1 = soch(n, k1) * q1 ** k1 * (1 - q1) ** (n - k1);
  const P2 = soch(n, k2) * q2 ** k2 * (1 - q2) ** (n - k2);
  return { n, k1, k2, q1, q2, P1, P2, x: tochnee(P1 / P2) };
}

const brosok = (m: number) => `${m} ${skl(m, 'попадание', 'попадания', 'попаданий')}`;
const chashka = (m: number) =>
  `${m} ${skl(m, 'удачный рисунок', 'удачных рисунка', 'удачных рисунков')}`;

export const EV5_BERNULLI_OTNOSHENIE: Prototype = {
  ...SVOI,
  id: 'ev5-bernulli-otnoshenie',
  nazvanie: 'Схема Бернулли: во сколько раз одна вероятность больше другой',
  tip: 'Независимые события',
  format: 'десятичная',
  uslovie: (p) => {
    const { n, k1, k2, q1, q2 } = bernulliChisla(p);
    if (text(p, 'syuzhet') === 'barista') {
      return (
        `Два стажёра кофейни, ${text(p, 'kto1')} и ${text(p, 'kto2')}, учатся рисовать на латте и готовят по ${n} чашек. ` +
        `У ${text(p, 'kogo1')} рисунок получается удачным с вероятностью ${dec(q1)}, у ${text(p, 'kogo2')} — с вероятностью ${dec(q2)}, все попытки независимы. ` +
        `Во сколько раз вероятность того, что у ${text(p, 'kogo1')} будет ровно ${chashka(k1)}, больше вероятности того, что у ${text(p, 'kogo2')} будет ровно ${chashka(k2)}?`
      );
    }
    return (
      `${text(p, 'kto1')} пробивает ${n} штрафных бросков. Вероятность попадания при каждом броске равна ${dec(q1)}, броски независимы. ` +
      `Во сколько раз вероятность того, что будет ровно ${brosok(k1)}, больше вероятности того, что будет ровно ${brosok(k2)}?`
    );
  },
  dopustimo: (p) => {
    const { x } = bernulliChisla(p);
    return x > 1 && konechnaya(x);
  },
  otvet: (p) => bernulliChisla(p).x,
  perebor: (p) => {
    const { n, k1, k2, q1, q2 } = bernulliChisla(p);
    return tochnee(bernulliPerebor(n, k1, q1) / bernulliPerebor(n, k2, q2));
  },
  shagi: (p) => {
    const { n, k1, k2, q1, q2, x } = bernulliChisla(p);
    const c1 = soch(n, k1);
    const c2 = soch(n, k2);
    const odin = q1 === q2;
    const Pk = (k: number, q: number) =>
      `C_{${n}}^{${k}}\\cdot ${tex(q)}^{${k}}\\cdot ${tex(tochnee(1 - q))}^{${n - k}}`;
    return [
      {
        etap: 'Количества',
        text: 'Формула Бернулли: вероятность ровно $k$ успехов в $n$ независимых попытках.',
        formula: `P_n(k) = C_n^k\\,p^k(1-p)^{n-k},\\quad C_{${n}}^{${k1}} = ${c1},\\quad C_{${n}}^{${k2}} = ${c2}`,
      },
      {
        etap: 'Вычисление',
        text: odin
          ? 'Делим одну вероятность на другую — одинаковые множители сокращаются:'
          : 'Делим одну вероятность на другую:',
        formula: `\\dfrac{${Pk(k1, q1)}}{${Pk(k2, q2)}}`,
      },
      {
        etap: 'Ответ',
        text: 'Считаем:',
        formula: odin
          ? `\\dfrac{${c1}}{${c2}}\\cdot\\left(\\dfrac{${tex(q1)}}{${tex(tochnee(1 - q1))}}\\right)^{${k1 - k2}} = ${dec(x).replace(',', '{,}')}`
          : `\\dfrac{${c1}\\cdot ${tex(q1)}^{${k1}}\\cdot ${tex(tochnee(1 - q1))}^{${n - k1}}}{${c2}\\cdot ${tex(q2)}^{${k2}}\\cdot ${tex(tochnee(1 - q2))}^{${n - k2}}} = ${dec(x).replace(',', '{,}')}`,
        value: x,
      },
    ];
  },
  podskazka: (p) => {
    const { n, k1, k2 } = bernulliChisla(p);
    return [
      vopros(
        'По какой формуле считается вероятность ровно $k$ успехов?',
        '$C_n^k\\,p^k(1-p)^{n-k}$',
        ['$p^k$', '$k\\cdot p$'],
        'Попытки независимы — это схема Бернулли.',
      ),
      vopros(`Чему равно $C_{${n}}^{${k1}}$?`, `$${soch(n, k1)}$`, [
        `$${soch(n, k1) + 1}$`,
        `$${n * k1}$`,
      ]),
      vopros(`Чему равно $C_{${n}}^{${k2}}$?`, `$${soch(n, k2)}$`, [
        `$${n * k2}$`,
        `$${soch(n, k2) + n}$`,
      ]),
    ];
  },
};

/* ── №5. Условная вероятность по долям ──────────────────────────── */

export const EV5_USLOVNAYA: Prototype = {
  ...SVOI,
  id: 'ev5-uslovnaya',
  nazvanie: 'Условная вероятность по вероятностям события и пересечения',
  tip: 'Условная вероятность',
  format: 'десятичная',
  uslovie: (p) =>
    `Среди посетителей книжного фестиваля ${num(p, 'a')}% купили хотя бы одну книгу, ${num(p, 'b')}% — хотя бы один комикс, а ${num(p, 'ab')}% купили и книгу, и комикс. ` +
    `Посетитель фестиваля купил книгу. С какой вероятностью он купил и комикс?`,
  dopustimo: (p) =>
    num(p, 'ab') <= Math.min(num(p, 'a'), num(p, 'b')) && konechnaya(num(p, 'ab') / num(p, 'a')),
  otvet: (p) => tochnee(num(p, 'ab') / num(p, 'a')),
  perebor: (p) => tochnee(shtuk(num(p, 'ab') / 100, 1000) / shtuk(num(p, 'a') / 100, 1000)),
  shagi: (p) => {
    const a = num(p, 'a');
    const ab = num(p, 'ab');
    const o = tochnee(ab / a);
    return [
      {
        etap: 'Связь событий',
        text: 'Нужно $P(B\\mid A)$, где $A$ — «купил книгу», $B$ — «купил комикс». Это доля покупателей комиксов среди покупателей книг.',
      },
      {
        etap: 'Ответ',
        text: 'По определению условной вероятности:',
        formula: `P(B\\mid A) = \\dfrac{P(A\\cap B)}{P(A)} = \\dfrac{${tex(ab / 100)}}{${tex(a / 100)}} = ${tex(o)}`,
        value: o,
      },
    ];
  },
  podskazka: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const ab = num(p, 'ab');
    return [
      vopros('Какое событие дано как условие?', '«Купил книгу»', [
        '«Купил комикс»',
        '«Купил и то и другое»',
      ]),
      vopros(
        'Как найти условную вероятность?',
        `$\\dfrac{${tex(ab / 100)}}{${tex(a / 100)}}$`,
        [`$\\dfrac{${tex(ab / 100)}}{${tex(b / 100)}}$`, `$${tex(ab / 100)}$`],
        '$P(B\\mid A)=\\dfrac{P(A\\cap B)}{P(A)}$.',
      ),
    ];
  },
};
