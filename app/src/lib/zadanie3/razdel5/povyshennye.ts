/**
 * Раздел V для «Вариантов повышенной сложности»: прототип той же
 * формы, что P03-69 (два цилиндра), но наоборот: у второго цилиндра
 * высота БОЛЬШЕ, а радиус МЕНЬШЕ. Подвох — радиус уменьшается в
 * квадрате, высота — в первой степени. В список прототипов раздела
 * не входит — его берёт только раздел вариантов.
 *
 * Проверка — как у P03-69: объёмы настоящих 48-угольных призм,
 * погрешность приближения сокращается в отношении.
 */

import { polygonStart, regularPolygon, rightPrism } from '../../solid/figures';
import { hullVolume } from '../../solid/measure';
import { type Model } from '../../solid/model';
import { volumeUnits } from './common';
import { twoMugs, vesselWithRise } from './drawings';
import { razaWord, ru } from '../format';
import { type Prototype, num, text } from '../types';

const R = 2.2;
const H = 4.4;

/** Два цилиндра: второй выше и уже первого. */
function dvaCilindraVyshe(alt: string): Model {
  const r2 = R * 0.55;
  return {
    alt,
    bodies: [
      { kind: 'cylinder', base: [0, 0, 0], r: R, h: H },
      { kind: 'cylinder', base: [R + r2 + 1.2, 0, 0], r: r2, h: H * 1.45 },
    ],
  };
}

/* ── P03-69S. Два цилиндра: второй выше, радиус меньше ──────────── */

export const P03_69S: Prototype = {
  id: 'P03-69S',
  razdel: 'V',
  nazvanie: 'Два цилиндра: у второго высота больше, радиус меньше — объём второго',
  tip: 'объём второго цилиндра, когда высота растёт, а радиус уменьшается',
  zadachnik: [234, 237],
  status: 'добавить',
  format: 'десятичная',

  uslovie: (p) =>
    `Объём одного цилиндра равен ${ru(num(p, 'V'))}. Второй цилиндр в ${ru(num(p, 'a'))} ` +
    `${razaWord(num(p, 'a'))} выше первого, а радиус его основания в ${ru(num(p, 'b'))} ` +
    `${razaWord(num(p, 'b'))} меньше. Найдите объём второго цилиндра.`,

  dopustimo: (p) => num(p, 'V') > 0 && num(p, 'a') > 1 && num(p, 'b') > 1,

  otvet: (p) => (num(p, 'V') * num(p, 'a')) / (num(p, 'b') * num(p, 'b')),

  poModeli: (p) => {
    const scale = num(p, 'V') / volumeUnits(1, 1);
    return scale * volumeUnits(1 / num(p, 'b'), num(p, 'a'));
  },

  chertezh: () =>
    dvaCilindraVyshe('Два цилиндра: второй выше первого, а радиус его основания меньше'),

  shagi: (p) => {
    const V = num(p, 'V');
    const a = num(p, 'a');
    const b = num(p, 'b');
    const otv = (V * a) / (b * b);
    return [
      {
        text: `Объём цилиндра $V = \\pi r^2 h$. Радиус уменьшился в ${ru(b)} ${razaWord(b)} — площадь основания уменьшилась в $${ru(b)}^2 = ${ru(b * b)}$ ${razaWord(b * b)}.`,
        value: b * b,
      },
      {
        text: `Высота выросла в ${ru(a)} ${razaWord(a)}: объём второго $${ru(V)} \\cdot ${ru(a)} : ${ru(b * b)} = ${ru(otv)}$.`,
        value: otv,
      },
    ];
  },

  varianty: [],
};

/* ── Две кружки: своя копия P03-70 без чисел банка ─────────────────
   Тот же разбор, что у прототипа раздела (dvacilindra.ts), но без его
   вариантов: импорт прототипа раздела унёс бы их в сборку. */

const HEIGHT_WORDS: Record<string, string> = {
  '1.5': 'в полтора раза',
  '2': 'вдвое',
  '2.5': 'в два с половиной раза',
  '3': 'втрое',
  '4': 'в четыре раза',
  '4.5': 'в четыре с половиной раза',
};

const WIDTH_WORDS: Record<string, string> = {
  '1.5': 'в полтора раза',
  '2': 'в два раза',
  '2.5': 'в два с половиной раза',
  '3': 'в три раза',
  '4': 'в четыре раза',
  '5': 'в пять раз',
};

function heightWord(value: number): string {
  const word = HEIGHT_WORDS[String(value)];
  if (word === undefined) {
    throw new Error(`Нет словесной формы для высоты ×${value}`);
  }
  return word;
}

function widthWord(value: number): string {
  const word = WIDTH_WORDS[String(value)];
  if (word === undefined) {
    throw new Error(`Нет словесной формы для ширины ×${value}`);
  }
  return word;
}

export const PV03_KRUZHKI: Prototype = {
  id: 'PV03-kruzhki',
  razdel: 'V',
  nazvanie: 'Две кружки: отношение объёмов',
  tip: 'отношение объёмов двух цилиндрических кружек',
  zadachnik: [0, 0],
  status: 'есть',
  format: 'десятичная',

  uslovie: (p) => {
    const h = heightWord(num(p, 'hk'));
    const w = widthWord(num(p, 'wk'));
    const tail = 'Найдите отношение объёма второй кружки к объёму первой.';
    return text(p, 'style') === 'зато'
      ? `Первая цилиндрическая кружка ${h} выше второй, зато вторая ${w} шире. ${tail}`
      : `Первая цилиндрическая кружка ${h} выше второй, а вторая ${w} шире первой. ${tail}`;
  },

  dopustimo: (p) =>
    HEIGHT_WORDS[String(num(p, 'hk'))] !== undefined &&
    WIDTH_WORDS[String(num(p, 'wk'))] !== undefined,

  otvet: (p) => (num(p, 'wk') * num(p, 'wk')) / num(p, 'hk'),

  poModeli: (p) => {
    /* Первая кружка: радиус 1, высота hk. Вторая: радиус wk, высота 1.
       Оба объёма меряются на настоящих призмах. */
    return volumeUnits(num(p, 'wk'), 1) / volumeUnits(1, num(p, 'hk'));
  },

  chertezh: () => twoMugs('Две цилиндрические кружки: первая выше, вторая шире'),

  shagi: (p) => {
    const hk = num(p, 'hk');
    const wk = num(p, 'wk');
    return [
      {
        text: `Вторая кружка шире в ${ru(wk)} ${razaWord(wk)}, значит площадь её дна больше в ${ru(wk * wk)} ${razaWord(wk * wk)}.`,
        value: wk * wk,
      },
      {
        text: `Но она ниже в ${ru(hk)} ${razaWord(hk)}, поэтому отношение объёмов: $${ru(wk * wk)} : ${ru(hk)} = ${ru((wk * wk) / hk)}$.`,
        value: (wk * wk) / hk,
      },
    ];
  },

  varianty: [],
};

/* ── Партия 4. Цилиндр и конус с общим основанием и высотой ─────── */

/** Многоугольник основания: 96 вершин на окружности радиуса r в плоскости z. */
function krug96(r: number, z: number): [number, number, number][] {
  return Array.from({ length: 96 }, (_, i) => {
    const u = (2 * Math.PI * i) / 96;
    return [r * Math.cos(u), r * Math.sin(u), z] as [number, number, number];
  });
}

/**
 * Цилиндр и конус с общим основанием и общей высотой: по объёму одного
 * найти объём другого. Подвох — в какую сторону множитель 3: объём
 * конуса — треть объёма цилиндра, а не втрое больше.
 * vid 0 — дан цилиндр, найти конус; vid 1 — дан конус, найти цилиндр.
 */
export const PV03_CILINDR_KONUS: Prototype = {
  id: 'PV03-cilindr-konus',
  razdel: 'V',
  nazvanie: 'Цилиндр и конус с общим основанием и высотой: объём одного по объёму другого',
  tip: 'объём цилиндра или конуса с общим основанием и общей высотой',
  zadachnik: [196, 197],
  status: 'добавить',
  format: 'десятичная',
  uslovie: (p) =>
    num(p, 'vid') === 0
      ? `Конус вписан в цилиндр: основание конуса совпадает с нижним основанием цилиндра, а вершина лежит в центре верхнего. Объём цилиндра равен ${ru(num(p, 'V'))}. Найдите объём конуса.`
      : `Конус вписан в цилиндр: основание конуса совпадает с нижним основанием цилиндра, а вершина лежит в центре верхнего. Объём конуса равен ${ru(num(p, 'V'))}. Найдите объём цилиндра.`,
  dopustimo: (p) => num(p, 'V') > 0,
  otvet: (p) => Math.round((num(p, 'vid') === 0 ? num(p, 'V') / 3 : num(p, 'V') * 3) * 1e9) / 1e9,
  /* Призма и пирамида над одним 96-угольником: отношение объёмов по координатам. */
  poModeli: (p) => {
    const niz = krug96(1, 0);
    const prizma = hullVolume([...niz, ...krug96(1, 2)]);
    const piramida = hullVolume([...niz, [0, 0, 2]]);
    const k = prizma / piramida;
    return Math.round((num(p, 'vid') === 0 ? num(p, 'V') / k : num(p, 'V') * k) * 1e6) / 1e6;
  },
  chertezh: () => ({
    alt: 'Конус, вписанный в цилиндр: общее основание и общая высота',
    bodies: [
      { kind: 'cylinder', base: [0, 0, 0], r: R, h: H, glass: true },
      { kind: 'cone', base: [0, 0, 0], r: R, h: H },
    ],
  }),
  shagi: (p) => {
    const V = num(p, 'V');
    const ans = num(p, 'vid') === 0 ? V / 3 : V * 3;
    return [
      {
        text: 'Объём цилиндра $V=S\\cdot h$, объём конуса $V=\\dfrac13 S\\cdot h$, где $S$ — площадь основания, $h$ — высота. Основание и высота у них общие.',
      },
      {
        text:
          num(p, 'vid') === 0
            ? `Значит, конус втрое меньше цилиндра: $\\dfrac{${ru(V)}}{3}=${ru(ans)}$.`
            : `Значит, цилиндр втрое больше конуса: $3\\cdot ${ru(V)}=${ru(ans)}$.`,
        value: ans,
      },
    ];
  },
  varianty: [],
};

/* ── Партия 5. Сосуд — правильная треугольная призма ─────────────── */

/** Правильный треугольник со стороной a в плоскости z = 0, сдвинутый на dx. */
function treugolnikOsnovaniya(a: number, dx: number, z = 0): [number, number, number][] {
  return regularPolygon(3, a / Math.sqrt(3), z, polygonStart(3)).map(
    ([x, y, zz]) => [x + dx, y, zz] as [number, number, number],
  );
}

/** Два сосуда-призмы рядом: второй шире; в первом — уровень жидкости. */
function dvaSosudaPrizmy(alt: string): Model {
  const a1 = 3;
  const a2 = 5.2;
  const h1 = 4.6;
  const h2 = 3.2;
  const p1 = rightPrism(treugolnikOsnovaniya(a1, 0), h1);
  const p2 = rightPrism(treugolnikOsnovaniya(a2, a1 / 2 + a2 / 2 + 1.6), h2);
  for (const t of [p1, p2]) t.names = t.names?.map(() => null);
  return {
    alt,
    bodies: [p1, p2],
    sections: [{ points: treugolnikOsnovaniya(a1, 0, h1 * 0.62) }],
  };
}

/**
 * Жидкость перелили из сосуда — правильной треугольной призмы — в другой
 * такой же формы, у которого сторона основания в n раз больше. Подвох —
 * площадь основания растёт как квадрат стороны: уровень падает в n²
 * раз, а не в n.
 */
export const PV03_SOSUD_PRIZMA: Prototype = {
  id: 'PV03-sosud-prizma',
  razdel: 'V',
  nazvanie: 'Сосуд — правильная треугольная призма: уровень жидкости после переливания',
  tip: 'уровень падает во столько раз, во сколько выросла площадь основания',
  zadachnik: [226, 229],
  status: 'добавить',
  format: 'десятичная',
  uslovie: (p) =>
    `В сосуде, имеющем форму правильной треугольной призмы, налита вода; её уровень достигает ${ru(num(p, 'h'))} см. Воду перелили в другой сосуд той же формы, у которого сторона основания в ${ru(num(p, 'n'))} ${razaWord(num(p, 'n'))} больше. На какой высоте окажется уровень воды во втором сосуде? Ответ дайте в сантиметрах.`,
  dopustimo: (p) => num(p, 'h') > 0 && num(p, 'n') > 1,
  otvet: (p) => Math.round((num(p, 'h') / num(p, 'n') ** 2) * 1e9) / 1e9,
  /* Объём воды в первой призме, затем высота во второй — по объёмам тел. */
  poModeli: (p) => {
    const n = num(p, 'n');
    const h = num(p, 'h');
    const v1 = hullVolume(rightPrism(treugolnikOsnovaniya(1, 0), h).vertices);
    const v2 = hullVolume(rightPrism(treugolnikOsnovaniya(n, 0), 1).vertices);
    return Math.round((v1 / v2) * 1e6) / 1e6;
  },
  chertezh: () => dvaSosudaPrizmy('Два сосуда в форме правильной треугольной призмы: второй шире'),
  shagi: (p) => {
    const h = num(p, 'h');
    const n = num(p, 'n');
    const ans = h / (n * n);
    return [
      {
        text: `Основания подобны: сторона больше в ${ru(n)} ${razaWord(n)}, значит площадь основания больше в $${ru(n)}^2=${ru(n * n)}$ ${razaWord(n * n)}.`,
        value: n * n,
      },
      {
        text: `Объём воды тот же: $V=S\\cdot h$, и уровень уменьшается во столько же раз, во сколько выросла площадь: $${ru(h)} : ${ru(n * n)} = ${ru(ans)}$ см.`,
        value: ans,
      },
    ];
  },
  varianty: [],
};

/* ── Партия 6 (варианты 31–36): деталь в цилиндрическом сосуде ───── */

/**
 * Деталь погрузили в цилиндрический сосуд с водой: vid 'na' — дан объём
 * воды V, уровень H и подъём dh (как P03-65); vid 'raz' — объём воды V и
 * во сколько раз k вырос уровень (как P03-66). Подвох — объём детали
 * равен объёму «добавленного» столбика, а не всему новому объёму.
 */
export const PV03_DETAL: Prototype = {
  id: 'PV03-detal',
  razdel: 'V',
  nazvanie: 'Деталь в цилиндрическом сосуде: объём по подъёму уровня',
  tip: 'объём детали по подъёму уровня воды',
  zadachnik: [216, 225],
  status: 'добавить',
  format: 'десятичная',
  uslovie: (p) =>
    text(p, 'vid') === 'na'
      ? `В цилиндрическом сосуде ${ru(num(p, 'V'))} см³ воды, её уровень — ${ru(num(p, 'H'))} см. Когда в воду целиком опустили деталь, уровень поднялся на ${ru(num(p, 'dh'))} см. Чему равен объём детали? Ответ дайте в кубических сантиметрах.`
      : `В цилиндрический сосуд налито ${ru(num(p, 'V'))} см³ воды. После того как в неё целиком опустили деталь, уровень воды стал в ${ru(num(p, 'k'))} ${razaWord(num(p, 'k'))} выше. Чему равен объём детали? Ответ дайте в кубических сантиметрах.`,
  dopustimo: (p) =>
    num(p, 'V') > 0 &&
    (text(p, 'vid') === 'na' ? num(p, 'H') > 0 && num(p, 'dh') > 0 : num(p, 'k') > 1),
  otvet: (p) =>
    Math.round(
      (text(p, 'vid') === 'na'
        ? (num(p, 'V') * num(p, 'dh')) / num(p, 'H')
        : num(p, 'V') * (num(p, 'k') - 1)) * 1e9,
    ) / 1e9,
  /* По модели: столбики воды единичного сечения, масштаб — по объёму воды. */
  poModeli: (p) => {
    const H = text(p, 'vid') === 'na' ? num(p, 'H') : 1;
    const dh = text(p, 'vid') === 'na' ? num(p, 'dh') : num(p, 'k') - 1;
    const scale = num(p, 'V') / volumeUnits(1, H);
    return Math.round(scale * volumeUnits(1, dh) * 1e6) / 1e6;
  },
  chertezh: () =>
    vesselWithRise('Цилиндрический сосуд с водой: уровень до и после погружения детали', 2.4, 3.5),
  shagi: (p) => {
    const V = num(p, 'V');
    if (text(p, 'vid') === 'na') {
      const H = num(p, 'H');
      const dh = num(p, 'dh');
      const S = V / H;
      return [
        {
          text: `Объём воды — площадь дна на высоту уровня, поэтому площадь дна $S = ${ru(V)} : ${ru(H)} = ${ru(S)}$ см².`,
          value: S,
        },
        {
          text: `Деталь вытеснила воду, и уровень поднялся на ${ru(dh)} см: её объём — столбик над прежним уровнем, $${ru(S)}\\cdot ${ru(dh)} = ${ru(S * dh)}$ см³.`,
          value: S * dh,
        },
      ];
    }
    const k = num(p, 'k');
    return [
      {
        text: `Сечение сосуда одно и то же, объёмы пропорциональны уровням: вода вместе с деталью занимает в ${ru(k)} ${razaWord(k)} больше, $${ru(V)}\\cdot ${ru(k)} = ${ru(V * k)}$ см³.`,
        value: V * k,
      },
      {
        text: `Объём детали — разность: $${ru(V * k)} - ${ru(V)} = ${ru(V * (k - 1))}$ см³.`,
        value: V * (k - 1),
      },
    ];
  },
  varianty: [],
};
