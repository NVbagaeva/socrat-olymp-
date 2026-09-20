/**
 * Задание №4, блок I: классическое определение вероятности.
 *
 * Восемнадцать прототипов, собранных из задачника Е. А. Ширяевой
 * «ЕГЭпроф 2025», задачи 1–88. У каждого прототипа десять вариантов:
 * сколько взято из задачника и сколько создано заново — записано в
 * самом варианте.
 *
 * Числа в вариантах не случайные. Ответ ЕГЭ пишется в клетки,
 * поэтому дробь обязана быть конечной: `dopustimo` это и проверяет,
 * а автотест не пропустит вариант, где 1/3 вылезло бы ученику.
 * Там, где задачник сам просит округление («результат округлите до
 * сотых»), округление объявлено в `okruglenie` и бесконечная дробь
 * допустима.
 */

import {
  chelovek,
  kolichestvennoe,
  perechislenie,
  poryadkovoe,
  predlozhnoe,
  razGen,
  razy,
  skl,
  sobiratelnoe,
  vDen,
} from '../morfologia';
import { prototip } from '../generator';
import { konechnaya, num, text, type Params, type Prototype, type Variant } from '../types';
import { gen } from './generatory';
import {
  drob,
  plitki,
  plitkiDvuh,
  shagLL,
  shagP,
  tablitsaKostey,
  tablitsaMonet,
  tsiferblat,
} from './vizual';

/* ── Общее ───────────────────────────────────────────────────────── */

/**
 * Блоки банка — методы списка А и разделы списка Б задания №4
 * (lib/veroyatnost/metody4.ts). Задача попадает в блок по своему
 * номеру в задачнике, а не по рисунку: один и тот же рисунок бывает
 * у разных методов, и наоборот.
 */
const KLASSICHESKAYA = 'klassicheskaya';
const KUBIKI = 'kubiki';
const MONETY = 'monety';
const KRUGLYY_STOL = 'kruglyy-stol';
const PROTIVOPOLOZHNYE = 'protivopolozhnye';
const GEOMETRICHESKOE = 'geometricheskoe';

/** Без округления: ответ обязан быть конечной десятичной дробью. */
const tochno = (): null => null;

/** Список имён из параметра: «Дима, Марат, Петя». */
function spisok(p: Params, key: string): string[] {
  return text(p, key)
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '');
}

/** Число сочетаний: нужно монетам. */
function soch(n: number, k: number): number {
  let out = 1;
  for (let i = 0; i < k; i += 1) {
    out = (out * (n - i)) / (i + 1);
  }
  return Math.round(out);
}

/**
 * Перебор бросков монеты: сколько из 2ⁿ исходов подходят.
 * Считается перебором, а не формулой, — это и есть вторая проверка.
 */
function monetyPerebor(n: number, podhodit: (uspehov: number) => boolean): number {
  let ok = 0;
  for (let mask = 0; mask < 2 ** n; mask += 1) {
    let uspehov = 0;
    for (let bit = 0; bit < n; bit += 1) {
      if ((mask >> bit) % 2 === 1) {
        uspehov += 1;
      }
    }
    if (podhodit(uspehov)) {
      ok += 1;
    }
  }
  return ok / 2 ** n;
}

/** Доля k из N перебором позиций, а не делением. */
function dolyaPerebor(vsego: number, podhodit: (i: number) => boolean): number {
  let ok = 0;
  for (let i = 1; i <= vsego; i += 1) {
    if (podhodit(i)) {
      ok += 1;
    }
  }
  return ok / vsego;
}

/* ── 1. Вертолёт ─────────────────────────────────────────────────── */

const P01: Prototype = prototip({
  id: 'p4-01',
  generator: gen('p4-01'),
  blok: KLASSICHESKAYA,
  nazvanie: 'Вертолёт: первый рейс',
  tip: 'Вероятность попасть в первую группу',
  zadachnik: [1, 4],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) =>
    `В группе туристов ${chelovek(num(p, 'N'))}. Их вертолётом доставляют в труднодоступный район, перевозя по ${chelovek(num(p, 'k'))} за рейс. Порядок, в котором вертолёт перевозит туристов, случаен. Найдите вероятность того, что турист ${text(p, 'kto')}, входящий в состав группы, полетит первым рейсом вертолёта.`,
  dopustimo: (p) => {
    const N = num(p, 'N');
    const k = num(p, 'k');
    return N > k && k >= 2 && konechnaya(k / N);
  },
  otvet: (p) => num(p, 'k') / num(p, 'N'),
  perebor: (p) => dolyaPerebor(num(p, 'N'), (i) => i <= num(p, 'k')),
  shagi: (p) => {
    const N = num(p, 'N');
    const k = num(p, 'k');
    return [
      { text: 'Все исходы — места туриста в очереди на вертолёт:', formula: `n = ${N}`, value: N },
      { text: 'Благоприятные — места первого рейса:', formula: `m = ${k}`, value: k },
      shagP(k, N),
    ];
  },
  metodika: {
    metod: 'direct-count',
    methodHints: [
      'один случайный выбор: место туриста в порядке рейсов',
      'все туристы одинаково случайны — ни весов, ни процентов',
      'благоприятные исходы пересчитываются: места первого рейса',
    ],
    fraza: (p) =>
      `прямой пересчёт — турист занимает одно из ${num(p, 'N')} равновозможных мест, из них ${num(p, 'k')} в первом рейсе.`,
    vizual: (p) =>
      plitkiDvuh(
        { label: 'первый рейс', count: num(p, 'k') },
        { label: 'другие рейсы', count: num(p, 'N') - num(p, 'k') },
      ),
  },
  varianty: [
    { n: 1, source: 'задачник', ref: 'задачник 04, № 1', params: { N: 20, k: 4, kto: 'В.' } },
    { n: 2, source: 'задачник', ref: 'задачник 04, № 2', params: { N: 30, k: 6, kto: 'В.' } },
    { n: 3, source: 'задачник', ref: 'задачник 04, № 3', params: { N: 300, k: 15, kto: 'В.' } },
    { n: 4, source: 'задачник', ref: 'задачник 04, № 4', params: { N: 200, k: 12, kto: 'В.' } },
    { n: 5, source: 'новый', ref: 'создан заново', params: { N: 75, k: 3, kto: 'П.' } },
    { n: 6, source: 'новый', ref: 'создан заново', params: { N: 25, k: 5, kto: 'Д.' } },
    { n: 7, source: 'новый', ref: 'создан заново', params: { N: 50, k: 4, kto: 'С.' } },
    { n: 8, source: 'новый', ref: 'создан заново', params: { N: 40, k: 5, kto: 'К.' } },
    { n: 9, source: 'новый', ref: 'создан заново', params: { N: 60, k: 3, kto: 'М.' } },
    { n: 10, source: 'новый', ref: 'создан заново', params: { N: 250, k: 20, kto: 'Н.' } },
  ],
});

/* ── 2. Жребий: кто пойдёт в магазин ─────────────────────────────── */

const P02: Prototype = prototip({
  id: 'p4-02',
  generator: gen('p4-02'),
  blok: KLASSICHESKAYA,
  nazvanie: 'Жребий: кого выберут',
  tip: 'Вероятность быть выбранным жребием',
  zadachnik: [5, 8],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) =>
    `В группе туристов ${chelovek(num(p, 'N'))}. С помощью жребия они выбирают ${sobiratelnoe(num(p, 'k'))} человек, которые должны идти в село в магазин за продуктами. Какова вероятность того, что турист ${text(p, 'kto')}, входящий в состав группы, пойдёт в магазин?`,
  dopustimo: (p) => {
    const N = num(p, 'N');
    const k = num(p, 'k');
    return N > k && k >= 2 && k <= 10 && konechnaya(k / N);
  },
  otvet: (p) => num(p, 'k') / num(p, 'N'),
  perebor: (p) => dolyaPerebor(num(p, 'N'), (i) => i <= num(p, 'k')),
  shagi: (p) => {
    const N = num(p, 'N');
    const k = num(p, 'k');
    return [
      { text: 'Все исходы — участники жребия:', formula: `n = ${N}`, value: N },
      { text: 'Благоприятные — те, кого выберут:', formula: `m = ${k}`, value: k },
      shagP(k, N),
    ];
  },
  metodika: {
    metod: 'direct-count',
    methodHints: [
      'один жребий среди одинаково случайных участников',
      'благоприятные исходы считаются напрямую: места в тройке',
    ],
    fraza: (p) =>
      `прямой пересчёт — жребий одинаково случаен для всех ${num(p, 'N')}, выбирают ${num(p, 'k')}.`,
    vizual: (p) =>
      plitkiDvuh(
        { label: 'выбран', count: num(p, 'k') },
        { label: 'остаётся', count: num(p, 'N') - num(p, 'k') },
      ),
  },
  varianty: [
    { n: 1, source: 'задачник', ref: 'задачник 04, № 5', params: { N: 5, k: 3, kto: 'Д.' } },
    { n: 2, source: 'задачник', ref: 'задачник 04, № 6', params: { N: 8, k: 6, kto: 'Д.' } },
    { n: 3, source: 'задачник', ref: 'задачник 04, № 7', params: { N: 12, k: 3, kto: 'Д.' } },
    { n: 4, source: 'задачник', ref: 'задачник 04, № 8', params: { N: 10, k: 5, kto: 'Д.' } },
    { n: 5, source: 'новый', ref: 'создан заново', params: { N: 20, k: 4, kto: 'А.' } },
    { n: 6, source: 'новый', ref: 'создан заново', params: { N: 25, k: 10, kto: 'Б.' } },
    { n: 7, source: 'новый', ref: 'создан заново', params: { N: 16, k: 2, kto: 'В.' } },
    { n: 8, source: 'новый', ref: 'создан заново', params: { N: 40, k: 10, kto: 'Г.' } },
    { n: 9, source: 'новый', ref: 'создан заново', params: { N: 4, k: 3, kto: 'Е.' } },
    { n: 10, source: 'новый', ref: 'создан заново', params: { N: 50, k: 10, kto: 'Ж.' } },
  ],
});

/* ── 3. Прыжки в воду: жеребьёвка порядка ────────────────────────── */

const P03: Prototype = prototip({
  id: 'p4-03',
  generator: gen('p4-03'),
  blok: KLASSICHESKAYA,
  nazvanie: 'Прыжки в воду: кто выступит по счёту',
  tip: 'Вероятность выбрать спортсмена из страны',
  zadachnik: [9, 14],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const ischem = text(p, 'ischem') === 'a' ? text(p, 'strA') : text(p, 'strB');
    return `На чемпионате по прыжкам в воду выступают ${num(p, 'N')} ${skl(num(p, 'N'), 'спортсмен', 'спортсмена', 'спортсменов')}, среди них ${a} ${skl(a, 'спортсмен', 'спортсмена', 'спортсменов')} из ${text(p, 'strA')} и ${b} ${skl(b, 'спортсмен', 'спортсмена', 'спортсменов')} из ${text(p, 'strB')}. Порядок выступлений определяется жеребьёвкой. Найдите вероятность того, что ${poryadkovoe(num(p, 'm'))} будет выступать спортсмен из ${ischem}.`;
  },
  dopustimo: (p) => {
    const N = num(p, 'N');
    const a = num(p, 'a');
    const b = num(p, 'b');
    const m = num(p, 'm');
    const nado = text(p, 'ischem') === 'a' ? a : b;
    return a >= 1 && b >= 1 && a + b < N && m >= 1 && m <= N && konechnaya(nado / N);
  },
  otvet: (p) => (text(p, 'ischem') === 'a' ? num(p, 'a') : num(p, 'b')) / num(p, 'N'),
  perebor: (p) => {
    const nado = text(p, 'ischem') === 'a' ? num(p, 'a') : num(p, 'b');
    return dolyaPerebor(num(p, 'N'), (i) => i <= nado);
  },
  shagi: (p) => {
    const N = num(p, 'N');
    const nado = text(p, 'ischem') === 'a' ? num(p, 'a') : num(p, 'b');
    const ischem = text(p, 'ischem') === 'a' ? text(p, 'strA') : text(p, 'strB');
    return [
      {
        text: 'Все исходы — кто окажется под нужным номером, любой из спортсменов:',
        formula: `n = ${N}`,
        value: N,
      },
      { text: `Благоприятные — спортсмены из ${ischem}:`, formula: `m = ${nado}`, value: nado },
      shagP(nado, N),
    ];
  },
  metodika: {
    metod: 'direct-count',
    methodHints: [
      'порядок выступлений — один жребий, все позиции равновозможны',
      'спрашивают про одну позицию; занять её может любой из спортсменов',
      'исходы пересчитываются напрямую',
    ],
    fraza: (p) =>
      `прямой пересчёт — под нужным номером равновероятно любой из ${num(p, 'N')} спортсменов.`,
    vizual: (p) => {
      const N = num(p, 'N');
      const a = num(p, 'a');
      const b = num(p, 'b');
      const ischem = text(p, 'ischem');
      return plitki([
        { label: `из ${text(p, 'strA')}`, count: a, blago: ischem === 'a' },
        { label: `из ${text(p, 'strB')}`, count: b, blago: ischem === 'b' },
        { label: 'другие страны', count: N - a - b, blago: false },
      ]);
    },
  },
  varianty: [
    {
      n: 1,
      source: 'задачник',
      ref: 'задачник 04, № 9',
      params: { N: 20, a: 7, strA: 'Германии', b: 9, strB: 'США', m: 12, ischem: 'a' },
    },
    {
      n: 2,
      source: 'задачник',
      ref: 'задачник 04, № 10',
      params: { N: 25, a: 4, strA: 'Франции', b: 9, strB: 'Колумбии', m: 12, ischem: 'b' },
    },
    {
      n: 3,
      source: 'задачник',
      ref: 'задачник 04, № 11',
      params: { N: 40, a: 10, strA: 'Италии', b: 2, strB: 'Мексики', m: 21, ischem: 'a' },
    },
    {
      n: 4,
      source: 'задачник',
      ref: 'задачник 04, № 12',
      params: { N: 45, a: 4, strA: 'Испании', b: 9, strB: 'США', m: 24, ischem: 'b' },
    },
    {
      n: 5,
      source: 'задачник',
      ref: 'задачник 04, № 13',
      params: { N: 50, a: 11, strA: 'Голландии', b: 8, strB: 'Колумбии', m: 10, ischem: 'a' },
    },
    {
      n: 6,
      source: 'задачник',
      ref: 'задачник 04, № 14',
      params: { N: 75, a: 15, strA: 'Италии', b: 13, strB: 'Канады', m: 4, ischem: 'a' },
    },
    {
      n: 7,
      source: 'новый',
      ref: 'создан заново',
      params: { N: 80, a: 12, strA: 'Японии', b: 20, strB: 'Кореи', m: 9, ischem: 'a' },
    },
    {
      n: 8,
      source: 'новый',
      ref: 'создан заново',
      params: { N: 60, a: 21, strA: 'Сербии', b: 6, strB: 'Хорватии', m: 30, ischem: 'a' },
    },
    {
      n: 9,
      source: 'новый',
      ref: 'создан заново',
      params: { N: 25, a: 6, strA: 'Дании', b: 4, strB: 'Швеции', m: 7, ischem: 'b' },
    },
    {
      n: 10,
      source: 'новый',
      ref: 'создан заново',
      params: { N: 40, a: 14, strA: 'Польши', b: 6, strB: 'Чехии', m: 9, ischem: 'a' },
    },
  ],
});

/* ── 4. Жребий: кому начинать игру ───────────────────────────────── */

/**
 * Жребий: кому начинать игру.
 *
 * Тело у двух прототипов одно, а метод разный: вопрос «мальчик или
 * девочка» — классическая вероятность (задачи 15–16), вопрос «не
 * такой-то» — противоположные события (17–18). Считается и рисуется
 * это одинаково, поэтому заготовка общая, а прототипа два: по методу
 * их и выбирают в тренажёре.
 */
function zhrebiyPrototip(opisanie: {
  id: string;
  blok: string;
  nazvanie: string;
  tip: string;
  zadachnik: readonly [number, number];
  methodHints: readonly string[];
  varianty: Variant[];
}): Prototype {
  return prototip({
    id: opisanie.id,
    generator: gen(opisanie.id),
    blok: opisanie.blok,
    nazvanie: opisanie.nazvanie,
    tip: opisanie.tip,
    zadachnik: opisanie.zadachnik,
    format: 'десятичная',
    okruglenie: tochno,
    uslovie: (p) =>
      `${perechislenie(spisok(p, 'imena'))} бросили жребий — кому начинать игру. Найдите вероятность того, что ${text(p, 'vopros')}.`,
    dopustimo: (p) => {
      const vse = spisok(p, 'imena');
      const blag = spisok(p, 'blag');
      return (
        vse.length >= 3 &&
        blag.length >= 1 &&
        blag.length < vse.length &&
        blag.every((imya) => vse.includes(imya)) &&
        konechnaya(blag.length / vse.length)
      );
    },
    otvet: (p) => spisok(p, 'blag').length / spisok(p, 'imena').length,
    perebor: (p) => {
      const vse = spisok(p, 'imena');
      const blag = new Set(spisok(p, 'blag'));
      return dolyaPerebor(vse.length, (i) => blag.has(vse[i - 1] as string));
    },
    shagi: (p) => {
      const vse = spisok(p, 'imena');
      const blag = spisok(p, 'blag');
      return [
        {
          text: 'Все исходы — кому выпадет жребий, любой из играющих:',
          formula: `n = ${vse.length}`,
          value: vse.length,
        },
        {
          text: `Благоприятные — ${perechislenie(blag)}:`,
          formula: `m = ${blag.length}`,
          value: blag.length,
        },
        shagP(blag.length, vse.length),
      ];
    },
    metodika: {
      metod: 'direct-count',
      methodHints: opisanie.methodHints,
      fraza: (p) =>
        `прямой пересчёт — жребий одинаково случаен для всех ${spisok(p, 'imena').length} играющих.`,
      vizual: (p) => {
        const vse = spisok(p, 'imena');
        const blag = new Set(spisok(p, 'blag'));
        return {
          parametry: { method: 'direct-count', outcomes: vse, columns: 5 },
          podsvetka: {
            method: 'direct-count',
            favorable: vse.flatMap((imya, i) => (blag.has(imya) ? [i] : [])),
          },
        };
      },
    },
    varianty: opisanie.varianty,
  });
}

/* 4а. Задачи 15–16: спрашивают, кто начнёт, — мальчик или девочка. */
const P04: Prototype = zhrebiyPrototip({
  id: 'p4-04',
  blok: KLASSICHESKAYA,
  nazvanie: 'Жребий: кому начинать игру',
  tip: 'Вероятность по списку имён',
  zadachnik: [15, 16],
  methodHints: [
    'один случайный выбор из перечисленных людей',
    'благоприятные — просто пересчитать: мальчики',
  ],
  varianty: [
    {
      n: 1,
      source: 'задачник',
      ref: 'задачник 04, № 15',
      params: {
        imena: 'Дима, Марат, Петя, Надя, Света',
        blag: 'Дима, Марат, Петя',
        vopros: 'начинать игру должен будет мальчик',
      },
    },
    {
      n: 2,
      source: 'задачник',
      ref: 'задачник 04, № 16',
      params: {
        imena: 'Тоня, Арина, Маша, Денис, Лёня, Максим',
        blag: 'Тоня, Арина, Маша',
        vopros: 'начинать игру должна будет девочка',
      },
    },
    {
      n: 3,
      source: 'новый',
      ref: 'создан заново',
      params: {
        imena: 'Аня, Боря, Вика, Гена, Даша',
        blag: 'Боря, Гена',
        vopros: 'начинать игру должен будет мальчик',
      },
    },
    {
      n: 4,
      source: 'новый',
      ref: 'создан заново',
      params: {
        imena: 'Никита, Егор, Соня, Лиза, Юля, Рома, Тимур, Влад, Артём, Максим',
        blag: 'Соня, Лиза, Юля',
        vopros: 'начинать игру должна будет девочка',
      },
    },
    {
      n: 5,
      source: 'новый',
      ref: 'создан заново',
      params: {
        imena: 'Лена, Марина, Тимур, Вера',
        blag: 'Тимур',
        vopros: 'начинать игру должен будет мальчик',
      },
    },
    {
      n: 6,
      source: 'новый',
      ref: 'создан заново',
      params: {
        imena: 'Гриша, Захар, Илья, Катя, Пётр',
        blag: 'Катя',
        vopros: 'начинать игру должна будет девочка',
      },
    },
  ],
});

/* 4б. Задачи 17–18: спрашивают, что начнёт НЕ названный человек. */
const P24: Prototype = zhrebiyPrototip({
  id: 'p4-24',
  blok: PROTIVOPOLOZHNYE,
  nazvanie: 'Жребий: начинать будет не он',
  tip: 'Вероятность противоположного события',
  zadachnik: [17, 18],
  methodHints: [
    'один случайный выбор из перечисленных людей',
    'спрашивают, что жребий выпадет НЕ названному человеку',
    'благоприятные — все остальные',
  ],
  varianty: [
    {
      n: 1,
      source: 'задачник',
      ref: 'задачник 04, № 17',
      params: {
        imena: 'Серёжа, Саша, Ира, Соня, Женя, Толя, Ксюша, Федя',
        blag: 'Серёжа, Саша, Ира, Соня, Женя, Толя, Федя',
        vopros: 'начинать игру должна будет не Ксюша',
      },
    },
    {
      n: 2,
      source: 'задачник',
      ref: 'задачник 04, № 18',
      params: {
        imena: 'Миша, Олег, Настя, Галя',
        blag: 'Миша, Олег, Настя',
        vopros: 'начинать игру должна будет не Галя',
      },
    },
    {
      n: 3,
      source: 'новый',
      ref: 'создан заново',
      params: {
        imena: 'Ваня, Коля, Оля, Зина, Слава',
        blag: 'Ваня, Коля, Оля, Слава',
        vopros: 'начинать игру должна будет не Зина',
      },
    },
    {
      n: 4,
      source: 'новый',
      ref: 'создан заново',
      params: {
        imena: 'Тася, Вова, Ким, Юра, Ася, Рита, Лёва, Ника, Стёпа, Дина',
        blag: 'Тася, Вова, Ким, Юра, Ася, Рита, Лёва, Ника, Стёпа',
        vopros: 'начинать игру должна будет не Дина',
      },
    },
  ],
});

/* ── 5. Механические часы ────────────────────────────────────────── */

/** Дуга по циферблату от отметки a по часовой стрелке до отметки b. */
function duga(a: number, b: number): number {
  return ((b - a + 12) % 12 === 0 ? 12 : (b - a + 12) % 12) % 12;
}

const P05: Prototype = prototip({
  id: 'p4-05',
  generator: gen('p4-05'),
  blok: GEOMETRICHESKOE,
  nazvanie: 'Механические часы: где встала стрелка',
  tip: 'Геометрическая вероятность на циферблате',
  zadachnik: [19, 22],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) =>
    `Механические часы с двенадцатичасовым циферблатом в какой-то момент сломались и перестали идти. Найдите вероятность того, что часовая стрелка остановилась, достигнув отметки ${num(p, 'a')}, но не дойдя до отметки ${num(p, 'b')}.`,
  dopustimo: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    return (
      Number.isInteger(a) &&
      Number.isInteger(b) &&
      a >= 1 &&
      a <= 12 &&
      b >= 1 &&
      b <= 12 &&
      a !== b &&
      [3, 6, 9].includes(duga(a, b))
    );
  },
  otvet: (p) => duga(num(p, 'a'), num(p, 'b')) / 12,
  perebor: (p) => {
    /* Минутам циферблата всё равно, какая у дуги формула: считаем,
       сколько из 720 положений стрелки попали внутрь дуги. */
    const a = num(p, 'a');
    const d = duga(a, num(p, 'b'));
    let ok = 0;
    for (let minuta = 0; minuta < 720; minuta += 1) {
      const chasy = minuta / 60;
      if ((chasy - a + 12) % 12 < d) {
        ok += 1;
      }
    }
    return ok / 720;
  },
  shagi: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const d = duga(a, b);
    return [
      {
        text: 'Вся мера — полный круг циферблата, двенадцать часовых делений:',
        formula: 'L = 12',
        value: 12,
      },
      {
        text: `Благоприятная дуга — от отметки ${a} до отметки ${b}:`,
        formula: `l = ${d}`,
        value: d,
      },
      shagLL(d, 12, d / 12),
    ];
  },
  metodika: {
    metod: 'coordinate-line',
    methodHints: [
      'стрелка останавливается в любой точке круга равномерно',
      'событие задано промежутком: между двумя отметками',
      'вероятность — отношение мер: дуга ко всей окружности',
    ],
    fraza: () =>
      'отношение мер — стрелка равновероятно останавливается в любой точке круга, событие задано дугой.',
    vizual: (p) => tsiferblat(num(p, 'a'), num(p, 'b')),
  },
  varianty: [
    { n: 1, source: 'задачник', ref: 'задачник 04, № 19', params: { a: 7, b: 1 } },
    { n: 2, source: 'задачник', ref: 'задачник 04, № 20', params: { a: 5, b: 11 } },
    { n: 3, source: 'задачник', ref: 'задачник 04, № 21', params: { a: 3, b: 6 } },
    { n: 4, source: 'задачник', ref: 'задачник 04, № 22', params: { a: 11, b: 2 } },
    { n: 5, source: 'конспект', ref: 'конспект, № 16', params: { a: 10, b: 1 } },
    { n: 6, source: 'новый', ref: 'создан заново', params: { a: 1, b: 10 } },
    { n: 7, source: 'новый', ref: 'создан заново', params: { a: 12, b: 3 } },
    { n: 8, source: 'новый', ref: 'создан заново', params: { a: 4, b: 1 } },
    { n: 9, source: 'новый', ref: 'создан заново', params: { a: 2, b: 8 } },
    { n: 10, source: 'новый', ref: 'создан заново', params: { a: 6, b: 3 } },
  ],
});

/* ── 6. Толкание ядра: четыре страны ─────────────────────────────── */

/** Количество и страна по номеру 1…4. */
function stranaKol(p: Params, i: number): { kol: number; strana: string } {
  return { kol: num(p, `k${i}`), strana: text(p, `s${i}`) };
}

const P06: Prototype = prototip({
  id: 'p4-06',
  generator: gen('p4-06'),
  blok: KLASSICHESKAYA,
  nazvanie: 'Толкание ядра: четыре страны',
  tip: 'Вероятность выбрать спортсмена из страны',
  zadachnik: [23, 26],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const chasti = [1, 2, 3, 4].map((i) => {
      const { kol, strana } = stranaKol(p, i);
      return `${kol} из ${strana}`;
    });
    const { strana } = stranaKol(p, num(p, 'ischem'));
    return `В соревнованиях по толканию ядра участвуют спортсмены из четырёх стран: ${perechislenie(chasti)}. Порядок, в котором выступают спортсмены, определяется жребием. Найдите вероятность того, что спортсмен, выступающий ${text(p, 'poryadok')}, окажется из ${strana}.`;
  },
  dopustimo: (p) => {
    const vse = [1, 2, 3, 4].map((i) => num(p, `k${i}`));
    const i = num(p, 'ischem');
    const summa = vse.reduce((s, x) => s + x, 0);
    return (
      vse.every((x) => x >= 1) && i >= 1 && i <= 4 && konechnaya((vse[i - 1] as number) / summa)
    );
  },
  otvet: (p) => {
    const summa = [1, 2, 3, 4].reduce((s, i) => s + num(p, `k${i}`), 0);
    return num(p, `k${num(p, 'ischem')}`) / summa;
  },
  perebor: (p) => {
    const summa = [1, 2, 3, 4].reduce((s, i) => s + num(p, `k${i}`), 0);
    const nado = num(p, `k${num(p, 'ischem')}`);
    return dolyaPerebor(summa, (i) => i <= nado);
  },
  shagi: (p) => {
    const summa = [1, 2, 3, 4].reduce((s, i) => s + num(p, `k${i}`), 0);
    const { kol, strana } = stranaKol(p, num(p, 'ischem'));
    return [
      {
        text: 'Все исходы — кто выступит под нужным номером, любой из спортсменов:',
        formula: `n = ${[1, 2, 3, 4].map((i) => num(p, `k${i}`)).join(' + ')} = ${summa}`,
        value: summa,
      },
      { text: `Благоприятные — спортсмены из ${strana}:`, formula: `m = ${kol}`, value: kol },
      shagP(kol, summa),
    ];
  },
  metodika: {
    metod: 'direct-count',
    methodHints: [
      'один жребий: кто выступает первым',
      'группы даны количествами, объекты одинаково случайны',
      'благоприятные — размер одной группы',
    ],
    fraza: (p) =>
      `прямой пересчёт — жребий одинаково случаен для всех ${[1, 2, 3, 4].reduce((s, i) => s + num(p, `k${i}`), 0)} спортсменов.`,
    vizual: (p) =>
      plitki(
        [1, 2, 3, 4].map((i) => ({
          label: `из ${text(p, `s${i}`)}`,
          count: num(p, `k${i}`),
          blago: i === num(p, 'ischem'),
        })),
      ),
  },
  varianty: [
    {
      n: 1,
      source: 'задачник',
      ref: 'задачник 04, № 23',
      params: {
        k1: 6,
        s1: 'Эстонии',
        k2: 9,
        s2: 'Латвии',
        k3: 7,
        s3: 'Литвы',
        k4: 8,
        s4: 'Польши',
        ischem: 2,
        poryadok: 'первым',
      },
    },
    {
      n: 2,
      source: 'задачник',
      ref: 'задачник 04, № 24',
      params: {
        k1: 6,
        s1: 'Великобритании',
        k2: 2,
        s2: 'Франции',
        k3: 4,
        s3: 'Германии',
        k4: 3,
        s4: 'Италии',
        ischem: 1,
        poryadok: 'первым',
      },
    },
    {
      n: 3,
      source: 'задачник',
      ref: 'задачник 04, № 25',
      params: {
        k1: 4,
        s1: 'Аргентины',
        k2: 7,
        s2: 'Бразилии',
        k3: 5,
        s3: 'Парагвая',
        k4: 4,
        s4: 'Уругвая',
        ischem: 2,
        poryadok: 'первым',
      },
    },
    {
      n: 4,
      source: 'задачник',
      ref: 'задачник 04, № 26',
      params: {
        k1: 8,
        s1: 'Греции',
        k2: 6,
        s2: 'Болгарии',
        k3: 3,
        s3: 'Румынии',
        k4: 8,
        s4: 'Венгрии',
        ischem: 1,
        poryadok: 'последним',
      },
    },
    {
      n: 5,
      source: 'новый',
      ref: 'создан заново',
      params: {
        k1: 5,
        s1: 'Кении',
        k2: 9,
        s2: 'Эфиопии',
        k3: 4,
        s3: 'Марокко',
        k4: 2,
        s4: 'Туниса',
        ischem: 2,
        poryadok: 'первым',
      },
    },
    {
      n: 6,
      source: 'новый',
      ref: 'создан заново',
      params: {
        k1: 3,
        s1: 'Норвегии',
        k2: 6,
        s2: 'Швеции',
        k3: 7,
        s3: 'Финляндии',
        k4: 4,
        s4: 'Дании',
        ischem: 3,
        poryadok: 'первым',
      },
    },
    {
      n: 7,
      source: 'новый',
      ref: 'создан заново',
      params: {
        k1: 9,
        s1: 'Мексики',
        k2: 6,
        s2: 'Кубы',
        k3: 7,
        s3: 'Чили',
        k4: 3,
        s4: 'Перу',
        ischem: 1,
        poryadok: 'последним',
      },
    },
    {
      n: 8,
      source: 'новый',
      ref: 'создан заново',
      params: {
        k1: 4,
        s1: 'Египта',
        k2: 8,
        s2: 'Алжира',
        k3: 5,
        s3: 'Ливии',
        k4: 3,
        s4: 'Судана',
        ischem: 2,
        poryadok: 'первым',
      },
    },
    {
      n: 9,
      source: 'новый',
      ref: 'создан заново',
      params: {
        k1: 11,
        s1: 'Индии',
        k2: 5,
        s2: 'Непала',
        k3: 6,
        s3: 'Китая',
        k4: 3,
        s4: 'Японии',
        ischem: 1,
        poryadok: 'первым',
      },
    },
    {
      n: 10,
      source: 'новый',
      ref: 'создан заново',
      params: {
        k1: 7,
        s1: 'Латвии',
        k2: 5,
        s2: 'Литвы',
        k3: 6,
        s3: 'Эстонии',
        k4: 2,
        s4: 'Финляндии',
        ischem: 4,
        poryadok: 'последним',
      },
    },
  ],
});

/* ── 7. Конференция: три страны ──────────────────────────────────── */

const P07: Prototype = prototip({
  id: 'p4-07',
  generator: gen('p4-07'),
  blok: KLASSICHESKAYA,
  nazvanie: 'Конференция: чей доклад по счёту',
  tip: 'Вероятность выбрать учёного из страны',
  zadachnik: [27, 30],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const chasti = [1, 2, 3].map((i) => `${num(p, `k${i}`)} из ${text(p, `s${i}`)}`);
    return `На конференцию приехали учёные из трёх стран: ${perechislenie(chasti)}. Каждый из них делает на конференции один доклад. Порядок докладов определяется жеребьёвкой. Найдите вероятность того, что ${poryadkovoe(num(p, 'm'))} окажется доклад учёного из ${text(p, `s${num(p, 'ischem')}`)}.`;
  },
  dopustimo: (p) => {
    const vse = [1, 2, 3].map((i) => num(p, `k${i}`));
    const i = num(p, 'ischem');
    const summa = vse.reduce((s, x) => s + x, 0);
    const m = num(p, 'm');
    return (
      vse.every((x) => x >= 1) &&
      i >= 1 &&
      i <= 3 &&
      m >= 1 &&
      m <= summa &&
      konechnaya((vse[i - 1] as number) / summa)
    );
  },
  otvet: (p) => {
    const summa = [1, 2, 3].reduce((s, i) => s + num(p, `k${i}`), 0);
    return num(p, `k${num(p, 'ischem')}`) / summa;
  },
  perebor: (p) => {
    const summa = [1, 2, 3].reduce((s, i) => s + num(p, `k${i}`), 0);
    const nado = num(p, `k${num(p, 'ischem')}`);
    return dolyaPerebor(summa, (i) => i <= nado);
  },
  shagi: (p) => {
    const summa = [1, 2, 3].reduce((s, i) => s + num(p, `k${i}`), 0);
    const nado = num(p, `k${num(p, 'ischem')}`);
    const strana = text(p, `s${num(p, 'ischem')}`);
    return [
      {
        text: 'Все исходы — чей доклад окажется под нужным номером, любой из докладов:',
        formula: `n = ${[1, 2, 3].map((i) => num(p, `k${i}`)).join(' + ')} = ${summa}`,
        value: summa,
      },
      { text: `Благоприятные — учёные из ${strana}:`, formula: `m = ${nado}`, value: nado },
      shagP(nado, summa),
    ];
  },
  metodika: {
    metod: 'direct-count',
    methodHints: [
      'один случайный выбор: чей доклад первый',
      'группы даны количествами, без процентов',
      'благоприятные — учёные одной страны',
    ],
    fraza: (p) =>
      `прямой пересчёт — жеребьёвка одинаково случайна для всех ${[1, 2, 3].reduce((s, i) => s + num(p, `k${i}`), 0)} докладов.`,
    vizual: (p) =>
      plitki(
        [1, 2, 3].map((i) => ({
          label: `из ${text(p, `s${i}`)}`,
          count: num(p, `k${i}`),
          blago: i === num(p, 'ischem'),
        })),
      ),
  },
  varianty: [
    {
      n: 1,
      source: 'задачник',
      ref: 'задачник 04, № 27',
      params: {
        k1: 2,
        s1: 'Румынии',
        k2: 2,
        s2: 'Дании',
        k3: 6,
        s3: 'Польши',
        ischem: 3,
        m: 1,
      },
    },
    {
      n: 2,
      source: 'задачник',
      ref: 'задачник 04, № 28',
      params: { k1: 7, s1: 'Сербии', k2: 3, s2: 'России', k3: 2, s3: 'Дании', ischem: 2, m: 10 },
    },
    {
      n: 3,
      source: 'задачник',
      ref: 'задачник 04, № 29',
      params: {
        k1: 3,
        s1: 'Швейцарии',
        k2: 5,
        s2: 'Голландии',
        k3: 7,
        s3: 'Франции',
        ischem: 1,
        m: 6,
      },
    },
    {
      n: 4,
      source: 'задачник',
      ref: 'задачник 04, № 30',
      params: { k1: 5, s1: 'Австрии', k2: 2, s2: 'Венгрии', k3: 7, s3: 'Дании', ischem: 3, m: 6 },
    },
    {
      n: 5,
      source: 'конспект',
      ref: 'конспект, № 9',
      params: { k1: 3, s1: 'Норвегии', k2: 3, s2: 'России', k3: 4, s3: 'Испании', ischem: 2, m: 8 },
    },
    {
      n: 6,
      source: 'новый',
      ref: 'создан заново',
      params: { k1: 6, s1: 'Индии', k2: 9, s2: 'Китая', k3: 5, s3: 'Японии', ischem: 2, m: 12 },
    },
    {
      n: 7,
      source: 'новый',
      ref: 'создан заново',
      params: { k1: 4, s1: 'Чехии', k2: 7, s2: 'Польши', k3: 9, s3: 'Венгрии', ischem: 1, m: 15 },
    },
    {
      n: 8,
      source: 'новый',
      ref: 'создан заново',
      params: { k1: 5, s1: 'Египта', k2: 8, s2: 'Кении', k3: 12, s3: 'Ганы', ischem: 2, m: 20 },
    },
    {
      n: 9,
      source: 'новый',
      ref: 'создан заново',
      params: { k1: 2, s1: 'Перу', k2: 6, s2: 'Чили', k3: 17, s3: 'Бразилии', ischem: 3, m: 11 },
    },
    {
      n: 10,
      source: 'новый',
      ref: 'создан заново',
      params: {
        k1: 9,
        s1: 'Кореи',
        k2: 6,
        s2: 'Вьетнама',
        k3: 10,
        s3: 'Таиланда',
        ischem: 1,
        m: 4,
      },
    },
  ],
});

/* ── 8. Сборник билетов ──────────────────────────────────────────── */

/**
 * Сборник билетов: вопрос по теме и вопрос не по теме.
 *
 * Считается это одинаково — все билеты и подходящие, — но по
 * типологии автора методы разные: «достанется вопрос по теме» —
 * классическая вероятность (задачи 31–34), «не достанется» —
 * противоположные события (35–38). Заготовка общая, прототипа два.
 */
function biletyPrototip(opisanie: {
  id: string;
  blok: string;
  nazvanie: string;
  tip: string;
  zadachnik: readonly [number, number];
  /** 0 — вопрос по теме, 1 — не по теме. Фиксирован у прототипа. */
  ne: 0 | 1;
  methodHints: readonly string[];
  varianty: Variant[];
}): Prototype {
  const { ne } = opisanie;
  return prototip({
    id: opisanie.id,
    generator: gen(opisanie.id),
    blok: opisanie.blok,
    nazvanie: opisanie.nazvanie,
    tip: opisanie.tip,
    zadachnik: opisanie.zadachnik,
    format: 'десятичная',
    okruglenie: tochno,
    uslovie: (p) => {
      const N = num(p, 'N');
      const k = num(p, 'k');
      const tema = text(p, 'tema');
      const otritsanie = ne === 1 ? 'не ' : '';
      return `В сборнике билетов по ${text(p, 'predmet')} всего ${N} ${skl(N, 'билет', 'билета', 'билетов')}, в ${k} из них встречается вопрос по теме «${tema}». Найдите вероятность того, что в случайно выбранном на экзамене билете школьнику ${otritsanie}достанется вопрос по теме «${tema}».`;
    },
    /* Признак «не по теме» у прототипа один на все варианты: иначе
       в одном прототипе смешались бы два метода. */
    dopustimo: (p) => {
      const N = num(p, 'N');
      const k = num(p, 'k');
      return k >= 1 && k < N && num(p, 'ne') === ne && konechnaya(ne === 1 ? (N - k) / N : k / N);
    },
    otvet: (p) => {
      const N = num(p, 'N');
      const k = num(p, 'k');
      return ne === 1 ? (N - k) / N : k / N;
    },
    perebor: (p) =>
      dolyaPerebor(num(p, 'N'), (i) => (ne === 1 ? i > num(p, 'k') : i <= num(p, 'k'))),
    shagi: (p) => {
      const N = num(p, 'N');
      const k = num(p, 'k');
      const blag = ne === 1 ? N - k : k;
      return [
        { text: 'Все исходы — билеты сборника:', formula: `n = ${N}`, value: N },
        ne === 1
          ? {
              text: 'Благоприятные — билеты без этой темы:',
              formula: `m = ${N} - ${k} = ${blag}`,
              value: blag,
            }
          : { text: 'Благоприятные — билеты с этой темой:', formula: `m = ${k}`, value: blag },
        shagP(blag, N),
      ];
    },
    metodika: {
      metod: 'direct-count',
      methodHints: opisanie.methodHints,
      fraza: (p) => `прямой пересчёт — на экзамене равновероятно любой из ${num(p, 'N')} билетов.`,
      vizual: (p) => {
        const N = num(p, 'N');
        const k = num(p, 'k');
        return plitki([
          { label: `«${text(p, 'tema')}»`, count: k, blago: ne === 0 },
          { label: 'другая тема', count: N - k, blago: ne === 1 },
        ]);
      },
    },
    varianty: opisanie.varianty,
  });
}

/* 8а. Задачи 31–34: вопрос по теме. */
const P08: Prototype = biletyPrototip({
  id: 'p4-08',
  blok: KLASSICHESKAYA,
  nazvanie: 'Сборник билетов: вопрос по теме',
  tip: 'Вероятность события',
  zadachnik: [31, 34],
  ne: 0,
  methodHints: [
    'один случайный выбор билета',
    'даны количества: всего и подходящих',
    'делим благоприятные на все',
  ],
  varianty: [
    {
      n: 1,
      source: 'задачник',
      ref: 'задачник 04, № 31',
      params: { N: 25, k: 10, predmet: 'математике', tema: 'Логарифмы', ne: 0 },
    },
    {
      n: 2,
      source: 'задачник',
      ref: 'задачник 04, № 32',
      params: { N: 20, k: 18, predmet: 'истории', tema: 'Смутное время', ne: 0 },
    },
    {
      n: 3,
      source: 'задачник',
      ref: 'задачник 04, № 33',
      params: { N: 15, k: 6, predmet: 'химии', tema: 'Кислоты', ne: 0 },
    },
    {
      n: 4,
      source: 'задачник',
      ref: 'задачник 04, № 34',
      params: { N: 45, k: 9, predmet: 'математике', tema: 'Неравенства', ne: 0 },
    },
    {
      n: 5,
      source: 'новый',
      ref: 'создан заново',
      params: { N: 80, k: 28, predmet: 'обществознанию', tema: 'Право', ne: 0 },
    },
  ],
});

/* 8б. Задачи 35–38: вопрос НЕ по теме. */
const P25: Prototype = biletyPrototip({
  id: 'p4-25',
  blok: PROTIVOPOLOZHNYE,
  nazvanie: 'Сборник билетов: вопрос не по теме',
  tip: 'Вероятность противоположного события',
  zadachnik: [35, 38],
  ne: 1,
  methodHints: [
    'один случайный выбор билета',
    'спрашивают, что вопрос по теме НЕ достанется',
    'благоприятные — все остальные билеты',
  ],
  varianty: [
    {
      n: 1,
      source: 'задачник',
      ref: 'задачник 04, № 35',
      params: { N: 40, k: 14, predmet: 'географии', tema: 'Страны Африки', ne: 1 },
    },
    {
      n: 2,
      source: 'задачник',
      ref: 'задачник 04, № 36',
      params: { N: 48, k: 12, predmet: 'математике', tema: 'Логарифмы', ne: 1 },
    },
    {
      n: 3,
      source: 'задачник',
      ref: 'задачник 04, № 37',
      params: { N: 50, k: 5, predmet: 'истории', tema: 'Великая Отечественная война', ne: 1 },
    },
    {
      n: 4,
      source: 'задачник',
      ref: 'задачник 04, № 38',
      params: { N: 60, k: 9, predmet: 'географии', tema: 'Ресурсообеспеченность', ne: 1 },
    },
    {
      n: 5,
      source: 'новый',
      ref: 'создан заново',
      params: { N: 25, k: 4, predmet: 'физике', tema: 'Оптика', ne: 1 },
    },
  ],
});

/* ── 9. Фирма такси ──────────────────────────────────────────────── */

const P09: Prototype = prototip({
  id: 'p4-09',
  generator: gen('p4-09'),
  blok: KLASSICHESKAYA,
  nazvanie: 'Фирма такси: цвет машины',
  tip: 'Вероятность противоположного события',
  zadachnik: [39, 42],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const N = num(p, 'N');
    return `В фирме такси в наличии ${N} ${skl(N, 'легковой автомобиль', 'легковых автомобиля', 'легковых автомобилей')}; ${num(p, 'k')} из них чёрного цвета с жёлтыми надписями на боках, остальные — жёлтого цвета с чёрными надписями. Найдите вероятность того, что на случайный вызов приедет машина жёлтого цвета с чёрными надписями.`;
  },
  dopustimo: (p) => {
    const N = num(p, 'N');
    const k = num(p, 'k');
    return k >= 1 && k < N && konechnaya((N - k) / N);
  },
  otvet: (p) => (num(p, 'N') - num(p, 'k')) / num(p, 'N'),
  perebor: (p) => dolyaPerebor(num(p, 'N'), (i) => i > num(p, 'k')),
  shagi: (p) => {
    const N = num(p, 'N');
    const k = num(p, 'k');
    return [
      { text: 'Все исходы — машины фирмы, на вызов приедет любая:', formula: `n = ${N}`, value: N },
      {
        text: 'Благоприятные — жёлтые машины:',
        formula: `m = ${N} - ${k} = ${N - k}`,
        value: N - k,
      },
      shagP(N - k, N),
    ];
  },
  metodika: {
    metod: 'direct-count',
    methodHints: [
      'один случайный вызов — одна машина из всех',
      'даны количества, нет ни весов, ни процентов',
      'благоприятные — остальные машины: считаем вычитанием',
    ],
    fraza: (p) => `прямой пересчёт — на вызов равновероятно приедет любая из ${num(p, 'N')} машин.`,
    vizual: (p) =>
      plitkiDvuh(
        { label: 'жёлтая', count: num(p, 'N') - num(p, 'k') },
        { label: 'чёрная', count: num(p, 'k') },
      ),
  },
  varianty: [
    { n: 1, source: 'задачник', ref: 'задачник 04, № 39', params: { N: 45, k: 18 } },
    { n: 2, source: 'задачник', ref: 'задачник 04, № 40', params: { N: 55, k: 11 } },
    { n: 3, source: 'задачник', ref: 'задачник 04, № 41', params: { N: 50, k: 27 } },
    { n: 4, source: 'задачник', ref: 'задачник 04, № 42', params: { N: 60, k: 27 } },
    { n: 5, source: 'новый', ref: 'создан заново', params: { N: 40, k: 14 } },
    { n: 6, source: 'новый', ref: 'создан заново', params: { N: 25, k: 7 } },
    { n: 7, source: 'новый', ref: 'создан заново', params: { N: 120, k: 18 } },
    { n: 8, source: 'новый', ref: 'создан заново', params: { N: 200, k: 34 } },
    { n: 9, source: 'новый', ref: 'создан заново', params: { N: 50, k: 13 } },
    { n: 10, source: 'новый', ref: 'создан заново', params: { N: 80, k: 52 } },
  ],
});

/* ── 10. Гимнастика: «остальные из …» ────────────────────────────── */

const P10: Prototype = prototip({
  id: 'p4-10',
  generator: gen('p4-10'),
  blok: KLASSICHESKAYA,
  nazvanie: 'Гимнастика: остальные спортсменки',
  tip: 'Вероятность, когда группа задана остатком',
  zadachnik: [43, 48],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const N = num(p, 'N');
    return `В чемпионате по гимнастике участвуют ${N} ${skl(N, 'спортсменка', 'спортсменки', 'спортсменок')}: ${num(p, 'a')} из ${text(p, 'sA')}, ${num(p, 'b')} из ${text(p, 'sB')}, остальные из ${text(p, 'sC')}. Порядок, в котором выступают гимнастки, определяется жребием. Найдите вероятность того, что спортсменка, выступающая первой, окажется из ${text(p, 'sC')}.`;
  },
  dopustimo: (p) => {
    const N = num(p, 'N');
    const a = num(p, 'a');
    const b = num(p, 'b');
    return a >= 1 && b >= 1 && a + b < N && konechnaya((N - a - b) / N);
  },
  otvet: (p) => (num(p, 'N') - num(p, 'a') - num(p, 'b')) / num(p, 'N'),
  perebor: (p) => dolyaPerebor(num(p, 'N'), (i) => i > num(p, 'a') + num(p, 'b')),
  shagi: (p) => {
    const N = num(p, 'N');
    const a = num(p, 'a');
    const b = num(p, 'b');
    const c = N - a - b;
    return [
      {
        text: 'Все исходы — кто выступит под нужным номером, любая из гимнасток:',
        formula: `n = ${N}`,
        value: N,
      },
      {
        text: `Благоприятные — гимнастки из ${text(p, 'sC')}:`,
        formula: `m = ${N} - ${a} - ${b} = ${c}`,
        value: c,
      },
      shagP(c, N),
    ];
  },
  metodika: {
    metod: 'direct-count',
    methodHints: [
      'один жребий: кто выступает первой',
      'группы даны количествами, «остальные» находятся вычитанием',
      'исходы пересчитываются напрямую',
    ],
    fraza: (p) => `прямой пересчёт — жребий одинаково случаен для всех ${num(p, 'N')} гимнасток.`,
    vizual: (p) => {
      const N = num(p, 'N');
      const a = num(p, 'a');
      const b = num(p, 'b');
      return plitki([
        { label: `из ${text(p, 'sA')}`, count: a, blago: false },
        { label: `из ${text(p, 'sB')}`, count: b, blago: false },
        { label: `из ${text(p, 'sC')}`, count: N - a - b, blago: true },
      ]);
    },
  },
  varianty: [
    {
      n: 1,
      source: 'задачник',
      ref: 'задачник 04, № 43',
      params: { N: 25, a: 6, sA: 'Венгрии', b: 7, sB: 'Румынии', sC: 'Болгарии' },
    },
    {
      n: 2,
      source: 'задачник',
      ref: 'задачник 04, № 44',
      params: { N: 25, a: 6, sA: 'Венгрии', b: 9, sB: 'Румынии', sC: 'Болгарии' },
    },
    {
      n: 3,
      source: 'задачник',
      ref: 'задачник 04, № 45',
      params: { N: 50, a: 13, sA: 'Великобритании', b: 7, sB: 'Франции', sC: 'Германии' },
    },
    {
      n: 4,
      source: 'задачник',
      ref: 'задачник 04, № 46',
      params: { N: 56, a: 27, sA: 'Норвегии', b: 15, sB: 'Дании', sC: 'Швеции' },
    },
    {
      n: 5,
      source: 'задачник',
      ref: 'задачник 04, № 47',
      params: { N: 70, a: 29, sA: 'Сербии', b: 27, sB: 'Хорватии', sC: 'Словении' },
    },
    {
      n: 6,
      source: 'задачник',
      ref: 'задачник 04, № 48',
      params: { N: 60, a: 27, sA: 'Японии', b: 27, sB: 'Китая', sC: 'Кореи' },
    },
    {
      n: 7,
      source: 'новый',
      ref: 'создан заново',
      params: { N: 40, a: 11, sA: 'Польши', b: 9, sB: 'Чехии', sC: 'Словакии' },
    },
    {
      n: 8,
      source: 'новый',
      ref: 'создан заново',
      params: { N: 20, a: 4, sA: 'Италии', b: 3, sB: 'Испании', sC: 'Португалии' },
    },
    {
      n: 9,
      source: 'новый',
      ref: 'создан заново',
      params: { N: 80, a: 26, sA: 'Бразилии', b: 30, sB: 'Аргентины', sC: 'Чили' },
    },
    {
      n: 10,
      source: 'новый',
      ref: 'создан заново',
      params: { N: 50, a: 11, sA: 'Кореи', b: 4, sB: 'Китая', sC: 'Японии' },
    },
  ],
});

/* ── 11. Научная конференция в несколько дней ────────────────────── */

/** Сколько докладов приходится на последний день. */
function vPoslednijDen(d: number, N: number, m: number, k: number): number {
  return m === 0 ? N / d : (N - m * k) / (d - m);
}

const P11: Prototype = prototip({
  id: 'p4-11',
  generator: gen('p4-11'),
  blok: KLASSICHESKAYA,
  nazvanie: 'Научная конференция: последний день',
  tip: 'Вероятность попасть в день конференции',
  zadachnik: [49, 54],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const d = num(p, 'd');
    const N = num(p, 'N');
    const m = num(p, 'm');
    const k = num(p, 'k');
    const prof = text(p, 'prof');
    const raspredelenie =
      m === 0
        ? 'они распределены поровну между всеми днями'
        : m === 1
          ? `в первый день ${k} ${skl(k, 'доклад', 'доклада', 'докладов')}, остальные распределены поровну между ${poryadkovoe(2)} и ${poryadkovoe(d)} днями`
          : `первые ${kolichestvennoe(m)} ${skl(m, 'день', 'дня', 'дней')} по ${k} ${skl(k, 'доклад', 'доклада', 'докладов')}, остальные распределены поровну между ${poryadkovoe(m + 1)} и ${poryadkovoe(d)} днями`;
    return `Научная конференция проводится в ${d} ${skl(d, 'день', 'дня', 'дней')}. Всего запланировано ${N} ${skl(N, 'доклад', 'доклада', 'докладов')} — ${raspredelenie}. На конференции планируется доклад профессора ${prof} Порядок докладов определяется жеребьёвкой. Какова вероятность, что доклад профессора ${prof} окажется запланированным на последний день конференции?`;
  },
  dopustimo: (p) => {
    const d = num(p, 'd');
    const N = num(p, 'N');
    const m = num(p, 'm');
    const k = num(p, 'k');
    if (d < 3 || m < 0 || m >= d) {
      return false;
    }
    if (m === 0) {
      return N % d === 0 && konechnaya(1 / d);
    }
    /* Оставшиеся дни делятся поровну — в задачнике их ровно два,
       иначе «поровну между …» пришлось бы перечислять списком. */
    const ostalos = N - m * k;
    return d - m === 2 && k >= 1 && ostalos > 0 && ostalos % 2 === 0 && konechnaya(ostalos / 2 / N);
  },
  otvet: (p) => vPoslednijDen(num(p, 'd'), num(p, 'N'), num(p, 'm'), num(p, 'k')) / num(p, 'N'),
  perebor: (p) => {
    const N = num(p, 'N');
    const vDen0 = vPoslednijDen(num(p, 'd'), N, num(p, 'm'), num(p, 'k'));
    return dolyaPerebor(N, (i) => i > N - vDen0);
  },
  shagi: (p) => {
    const d = num(p, 'd');
    const N = num(p, 'N');
    const m = num(p, 'm');
    const k = num(p, 'k');
    const last = vPoslednijDen(d, N, m, k);
    return [
      {
        text: 'Все исходы — места доклада в расписании, все равновозможны:',
        formula: `n = ${N}`,
        value: N,
      },
      m === 0
        ? {
            text: `Благоприятные — доклады последнего дня; дней ${d}, докладов поровну:`,
            formula: `m = ${drob(N, d)} = ${last}`,
            value: last,
          }
        : {
            text: `Благоприятные — доклады последнего дня: на первые дни ушло ${m * k}, остальные поделены поровну:`,
            formula: `m = ${drob(`${N} - ${m * k}`, d - m)} = ${last}`,
            value: last,
          },
      shagP(last, N),
    ];
  },
  metodika: {
    metod: 'direct-count',
    methodHints: [
      'один доклад попадает на случайное место среди всех',
      'дни — группы мест, их размеры находятся из условия',
      'благоприятные — места последнего дня',
    ],
    fraza: (p) =>
      `прямой пересчёт — доклад профессора равновероятно стоит на любом из ${num(p, 'N')} мест.`,
    vizual: (p) => {
      const N = num(p, 'N');
      const last = vPoslednijDen(num(p, 'd'), N, num(p, 'm'), num(p, 'k'));
      return plitkiDvuh(
        { label: 'последний день', count: last },
        { label: 'другие дни', count: N - last },
      );
    },
  },
  varianty: [
    {
      n: 1,
      source: 'задачник',
      ref: 'задачник 04, № 49',
      params: { d: 3, N: 40, m: 1, k: 8, prof: 'М.' },
    },
    {
      n: 2,
      source: 'задачник',
      ref: 'задачник 04, № 50',
      params: { d: 3, N: 70, m: 1, k: 28, prof: 'М.' },
    },
    {
      n: 3,
      source: 'задачник',
      ref: 'задачник 04, № 51',
      params: { d: 4, N: 80, m: 2, k: 12, prof: 'М.' },
    },
    {
      n: 4,
      source: 'задачник',
      ref: 'задачник 04, № 52',
      params: { d: 4, N: 40, m: 2, k: 14, prof: 'К.' },
    },
    {
      n: 5,
      source: 'задачник',
      ref: 'задачник 04, № 53',
      params: { d: 5, N: 75, m: 3, k: 15, prof: 'М.' },
    },
    {
      n: 6,
      source: 'задачник',
      ref: 'задачник 04, № 54',
      params: { d: 5, N: 55, m: 0, k: 0, prof: 'М.' },
    },
    {
      n: 7,
      source: 'новый',
      ref: 'создан заново',
      params: { d: 3, N: 40, m: 1, k: 4, prof: 'Н.' },
    },
    {
      n: 8,
      source: 'новый',
      ref: 'создан заново',
      params: { d: 4, N: 120, m: 2, k: 15, prof: 'Р.' },
    },
    {
      n: 9,
      source: 'новый',
      ref: 'создан заново',
      params: { d: 4, N: 80, m: 0, k: 0, prof: 'С.' },
    },
    {
      n: 10,
      source: 'новый',
      ref: 'создан заново',
      params: { d: 3, N: 100, m: 1, k: 20, prof: 'Т.' },
    },
  ],
});

/* ── 12. Олимпиада: запасная аудитория ───────────────────────────── */

const P12: Prototype = prototip({
  id: 'p4-12',
  generator: gen('p4-12'),
  blok: KLASSICHESKAYA,
  nazvanie: 'Олимпиада: запасная аудитория',
  tip: 'Вероятность попасть в остаток',
  zadachnik: [55, 58],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const N = num(p, 'N');
    const m = num(p, 'm');
    return `На олимпиаде по ${text(p, 'predmet')} ${N} ${skl(N, 'участник', 'участника', 'участников')} разместили в ${predlozhnoe(m)} аудиториях. В первых ${predlozhnoe(m - 1)} удалось разместить по ${chelovek(num(p, 'k'))}, оставшихся перевели в запасную аудиторию в другом корпусе. Найдите вероятность того, что случайно выбранный участник писал олимпиаду в запасной аудитории.`;
  },
  dopustimo: (p) => {
    const N = num(p, 'N');
    const m = num(p, 'm');
    const k = num(p, 'k');
    const ostalos = N - (m - 1) * k;
    return m >= 3 && m <= 7 && k >= 1 && ostalos > 0 && konechnaya(ostalos / N);
  },
  otvet: (p) => (num(p, 'N') - (num(p, 'm') - 1) * num(p, 'k')) / num(p, 'N'),
  perebor: (p) => {
    const N = num(p, 'N');
    const zanyato = (num(p, 'm') - 1) * num(p, 'k');
    return dolyaPerebor(N, (i) => i > zanyato);
  },
  shagi: (p) => {
    const N = num(p, 'N');
    const m = num(p, 'm');
    const k = num(p, 'k');
    const ostalos = N - (m - 1) * k;
    return [
      {
        text: 'Все исходы — участники олимпиады, посадить могут любого:',
        formula: `n = ${N}`,
        value: N,
      },
      {
        text: 'Благоприятные — те, кто попал в запасную аудиторию:',
        formula: `m = ${N} - ${m - 1} \\cdot ${k} = ${ostalos}`,
        value: ostalos,
      },
      shagP(ostalos, N),
    ];
  },
  metodika: {
    metod: 'direct-count',
    methodHints: [
      'один случайно выбранный участник из всех',
      'даны количества по аудиториям, проценты не нужны',
      'благоприятные — оставшиеся: вычитаем из общего числа',
    ],
    fraza: (p) =>
      `прямой пересчёт — размещение одинаково случайно для всех ${num(p, 'N')} участников.`,
    vizual: (p) => {
      const N = num(p, 'N');
      const ostalos = N - (num(p, 'm') - 1) * num(p, 'k');
      return plitkiDvuh(
        { label: 'запасная аудитория', count: ostalos },
        { label: 'основные аудитории', count: N - ostalos },
      );
    },
  },
  varianty: [
    {
      n: 1,
      source: 'задачник',
      ref: 'задачник 04, № 55',
      params: { N: 550, m: 4, k: 110, predmet: 'математике' },
    },
    {
      n: 2,
      source: 'задачник',
      ref: 'задачник 04, № 56',
      params: { N: 400, m: 3, k: 110, predmet: 'обществознанию' },
    },
    {
      n: 3,
      source: 'задачник',
      ref: 'задачник 04, № 57',
      params: { N: 350, m: 3, k: 140, predmet: 'русскому языку' },
    },
    {
      n: 4,
      source: 'задачник',
      ref: 'задачник 04, № 58',
      params: { N: 400, m: 3, k: 150, predmet: 'химии' },
    },
    {
      n: 5,
      source: 'новый',
      ref: 'создан заново',
      params: { N: 500, m: 3, k: 180, predmet: 'физике' },
    },
    {
      n: 6,
      source: 'новый',
      ref: 'создан заново',
      params: { N: 600, m: 4, k: 140, predmet: 'биологии' },
    },
    {
      n: 7,
      source: 'новый',
      ref: 'создан заново',
      params: { N: 480, m: 4, k: 120, predmet: 'информатике' },
    },
    {
      n: 8,
      source: 'новый',
      ref: 'создан заново',
      params: { N: 200, m: 3, k: 60, predmet: 'литературе' },
    },
    {
      n: 9,
      source: 'новый',
      ref: 'создан заново',
      params: { N: 1000, m: 5, k: 200, predmet: 'английскому языку' },
    },
    {
      n: 10,
      source: 'новый',
      ref: 'создан заново',
      params: { N: 320, m: 3, k: 100, predmet: 'истории' },
    },
  ],
});

/* ── 13. Конкурс исполнителей ────────────────────────────────────── */

const P13: Prototype = prototip({
  id: 'p4-13',
  generator: gen('p4-13'),
  blok: KLASSICHESKAYA,
  nazvanie: 'Конкурс исполнителей: день выступления',
  tip: 'Вероятность попасть в день конкурса',
  zadachnik: [59, 62],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const d = num(p, 'd');
    const N = num(p, 'N');
    const k = num(p, 'k');
    const strana = text(p, 'strana');
    return `Конкурс исполнителей проводится в ${d} ${skl(d, 'день', 'дня', 'дней')}. Всего заявлено ${N} ${skl(N, 'выступление', 'выступления', 'выступлений')} — по одному от каждой страны, участвующей в конкурсе. Исполнитель из ${strana} участвует в конкурсе. В первый день запланировано ${k} ${skl(k, 'выступление', 'выступления', 'выступлений')}, остальные распределены поровну между оставшимися днями. Порядок выступлений определяется жеребьёвкой. Какова вероятность того, что выступление исполнителя из ${strana} состоится ${vDen(num(p, 'den'))} день конкурса?`;
  },
  dopustimo: (p) => {
    const d = num(p, 'd');
    const N = num(p, 'N');
    const k = num(p, 'k');
    const den = num(p, 'den');
    const ostalos = N - k;
    return (
      d >= 3 &&
      d <= 6 &&
      k >= 1 &&
      k < N &&
      den >= 2 &&
      den <= d &&
      ostalos % (d - 1) === 0 &&
      konechnaya(ostalos / (d - 1) / N)
    );
  },
  otvet: (p) => (num(p, 'N') - num(p, 'k')) / (num(p, 'd') - 1) / num(p, 'N'),
  perebor: (p) => {
    const N = num(p, 'N');
    const vDenN = (N - num(p, 'k')) / (num(p, 'd') - 1);
    const den = num(p, 'den');
    const start = num(p, 'k') + (den - 2) * vDenN;
    return dolyaPerebor(N, (i) => i > start && i <= start + vDenN);
  },
  shagi: (p) => {
    const d = num(p, 'd');
    const N = num(p, 'N');
    const k = num(p, 'k');
    const vDenN = (N - k) / (d - 1);
    return [
      { text: 'Все исходы — места выступления в расписании:', formula: `n = ${N}`, value: N },
      {
        text: `Благоприятные — выступления нужного дня; после первого дня осталось ${N - k}, они поделены на ${d - 1} дня поровну:`,
        formula: `m = ${drob(N - k, d - 1)} = ${vDenN}`,
        value: vDenN,
      },
      shagP(vDenN, N),
    ];
  },
  metodika: {
    metod: 'direct-count',
    methodHints: [
      'одно выступление на случайном месте среди всех',
      'дни — группы мест, размер второго дня из условия',
      'благоприятные пересчитываются напрямую',
    ],
    fraza: (p) =>
      `прямой пересчёт — выступление равновероятно стоит на любом из ${num(p, 'N')} мест.`,
    vizual: (p) => {
      const N = num(p, 'N');
      const vDenN = (N - num(p, 'k')) / (num(p, 'd') - 1);
      return plitkiDvuh(
        { label: 'нужный день', count: vDenN },
        { label: 'другие дни', count: N - vDenN },
      );
    },
  },
  varianty: [
    {
      n: 1,
      source: 'задачник',
      ref: 'задачник 04, № 59',
      params: { d: 3, N: 40, k: 12, den: 2, strana: 'России' },
    },
    {
      n: 2,
      source: 'задачник',
      ref: 'задачник 04, № 60',
      params: { d: 3, N: 80, k: 16, den: 3, strana: 'России' },
    },
    {
      n: 3,
      source: 'задачник',
      ref: 'задачник 04, № 61',
      params: { d: 3, N: 70, k: 28, den: 3, strana: 'России' },
    },
    {
      n: 4,
      source: 'задачник',
      ref: 'задачник 04, № 62',
      params: { d: 5, N: 75, k: 27, den: 3, strana: 'России' },
    },
    {
      n: 5,
      source: 'новый',
      ref: 'создан заново',
      params: { d: 4, N: 100, k: 25, den: 4, strana: 'Италии' },
    },
    {
      n: 6,
      source: 'новый',
      ref: 'создан заново',
      params: { d: 5, N: 100, k: 20, den: 5, strana: 'Японии' },
    },
    {
      n: 7,
      source: 'новый',
      ref: 'создан заново',
      params: { d: 3, N: 50, k: 20, den: 2, strana: 'Бразилии' },
    },
    {
      n: 8,
      source: 'новый',
      ref: 'создан заново',
      params: { d: 4, N: 200, k: 50, den: 2, strana: 'Франции' },
    },
    {
      n: 9,
      source: 'новый',
      ref: 'создан заново',
      params: { d: 3, N: 100, k: 20, den: 2, strana: 'Испании' },
    },
    {
      n: 10,
      source: 'новый',
      ref: 'создан заново',
      params: { d: 5, N: 80, k: 20, den: 4, strana: 'Германии' },
    },
  ],
});

/* ── 14. Разбивка на игровые пары ────────────────────────────────── */

const P14: Prototype = prototip({
  id: 'p4-14',
  generator: gen('p4-14'),
  blok: KRUGLYY_STOL,
  nazvanie: 'Игровые пары: соперник из России',
  tip: 'Вероятность при выборе соперника',
  zadachnik: [63, 66],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const N = num(p, 'N');
    const r = num(p, 'r');
    const imya = text(p, 'imya');
    return `Перед началом первого тура чемпионата по ${text(p, 'vid')} участников разбивают на игровые пары случайным образом с помощью жребия. Всего в чемпионате участвует ${N} ${skl(N, 'спортсмен', 'спортсмена', 'спортсменов')}, среди которых ${r} ${skl(r, 'спортсмен', 'спортсмена', 'спортсменов')} из России, в том числе ${imya}. Найдите вероятность того, что в первом туре ${imya} будет играть с каким-либо спортсменом из России.`;
  },
  dopustimo: (p) => {
    const N = num(p, 'N');
    const r = num(p, 'r');
    return N % 2 === 0 && r >= 2 && r <= N && konechnaya((r - 1) / (N - 1));
  },
  otvet: (p) => (num(p, 'r') - 1) / (num(p, 'N') - 1),
  perebor: (p) => dolyaPerebor(num(p, 'N') - 1, (i) => i <= num(p, 'r') - 1),
  shagi: (p) => {
    const N = num(p, 'N');
    const r = num(p, 'r');
    return [
      {
        text: 'Все исходы — возможные соперники, любой из остальных участников:',
        formula: `n = ${N} - 1 = ${N - 1}`,
        value: N - 1,
      },
      {
        text: 'Благоприятные — соперники из России, без него самого:',
        formula: `m = ${r} - 1 = ${r - 1}`,
        value: r - 1,
      },
      shagP(r - 1, N - 1),
    ];
  },
  metodika: {
    metod: 'direct-count',
    methodHints: [
      'один случайный соперник из всех остальных участников',
      'одного фиксируем, остальные одинаково случайны',
      'благоприятные — россияне без него самого',
    ],
    fraza: (p) =>
      `прямой пересчёт — в соперники равновероятно попадёт любой из остальных ${num(p, 'N') - 1} участников.`,
    vizual: (p) =>
      plitkiDvuh(
        { label: 'из России', count: num(p, 'r') - 1 },
        { label: 'из других стран', count: num(p, 'N') - num(p, 'r') },
      ),
  },
  varianty: [
    {
      n: 1,
      source: 'задачник',
      ref: 'задачник 04, № 63',
      params: { N: 76, r: 22, vid: 'бадминтону', imya: 'Игорь Чаев' },
    },
    {
      n: 2,
      source: 'задачник',
      ref: 'задачник 04, № 64',
      params: { N: 26, r: 17, vid: 'настольному теннису', imya: 'Денис Полянкин' },
    },
    {
      n: 3,
      source: 'задачник',
      ref: 'задачник 04, № 65',
      params: { N: 46, r: 28, vid: 'шахматам', imya: 'Дмитрий Тоснин' },
    },
    {
      n: 4,
      source: 'задачник',
      ref: 'задачник 04, № 66',
      params: { N: 76, r: 13, vid: 'шашкам', imya: 'Андрей Фомин' },
    },
    {
      n: 5,
      source: 'конспект',
      ref: 'конспект, № 7',
      params: { N: 46, r: 19, vid: 'теннису', imya: 'Ярослав Исаков' },
    },
    {
      n: 6,
      source: 'новый',
      ref: 'создан заново',
      params: { N: 126, r: 26, vid: 'шахматам', imya: 'Павел Гринёв' },
    },
    {
      n: 7,
      source: 'новый',
      ref: 'создан заново',
      params: { N: 46, r: 37, vid: 'шашкам', imya: 'Олег Ким' },
    },
    {
      n: 8,
      source: 'новый',
      ref: 'создан заново',
      params: { N: 26, r: 14, vid: 'настольному теннису', imya: 'Артём Волков' },
    },
    {
      n: 9,
      source: 'новый',
      ref: 'создан заново',
      params: { N: 76, r: 37, vid: 'бадминтону', imya: 'Марк Ильин' },
    },
    {
      n: 10,
      source: 'новый',
      ref: 'создан заново',
      params: { N: 46, r: 10, vid: 'теннису', imya: 'Роман Гущин' },
    },
  ],
});

/* ── 15. Класс делят на группы ───────────────────────────────────── */

const P15: Prototype = prototip({
  id: 'p4-15',
  generator: gen('p4-15'),
  blok: KRUGLYY_STOL,
  nazvanie: 'Деление на группы: вместе или врозь',
  tip: 'Вероятность оказаться в одной группе',
  zadachnik: [67, 70],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const N = num(p, 'N');
    const g = num(p, 'g');
    const a = text(p, 'a');
    const b = text(p, 'b');
    const para = text(p, 'para');
    const vmeste = num(p, 'vmeste') === 1;
    const kto = para === '' ? `среди них — ${a} и ${b}` : `среди них ${para} — ${a} и ${b}`;
    return `${text(p, 'gde')} ${N} ${skl(N, text(p, 'kogo1'), text(p, 'kogo2'), text(p, 'kogo2'))}, ${kto}. Их случайным образом делят на ${g} ${skl(g, 'группу', 'группы', 'групп')} по ${chelovek(N / g)} в каждой. Найдите вероятность того, что ${a} и ${b} окажутся в ${vmeste ? 'одной группе' : 'разных группах'}.`;
  },
  dopustimo: (p) => {
    const N = num(p, 'N');
    const g = num(p, 'g');
    if (g < 2 || N % g !== 0 || N / g < 2) {
      return false;
    }
    return konechnaya((N / g - 1) / (N - 1));
  },
  otvet: (p) => {
    const N = num(p, 'N');
    const vmeste = (N / num(p, 'g') - 1) / (N - 1);
    return num(p, 'vmeste') === 1 ? vmeste : 1 - vmeste;
  },
  perebor: (p) => {
    const N = num(p, 'N');
    const razmer = N / num(p, 'g');
    const vmeste = num(p, 'vmeste') === 1;
    /* Первого сажаем в первую группу; второй занимает одно из
       оставшихся N − 1 мест, и мест в его группе razmer − 1. */
    return dolyaPerebor(N - 1, (i) => (vmeste ? i < razmer : i >= razmer));
  },
  shagi: (p) => {
    const N = num(p, 'N');
    const razmer = N / num(p, 'g');
    const vmeste = num(p, 'vmeste') === 1;
    const m = vmeste ? razmer - 1 : N - razmer;
    return [
      {
        text: 'Одного из двоих фиксируем. Все исходы — места второго среди оставшихся:',
        formula: `n = ${N} - 1 = ${N - 1}`,
        value: N - 1,
      },
      vmeste
        ? {
            text: 'Благоприятные — свободные места в группе первого:',
            formula: `m = ${razmer} - 1 = ${m}`,
            value: m,
          }
        : {
            text: 'Благоприятные — места в других группах:',
            formula: `m = ${N} - ${razmer} = ${m}`,
            value: m,
          },
      shagP(m, N - 1),
    ];
  },
  metodika: {
    metod: 'direct-count',
    methodHints: [
      'одного друга фиксируем, второй занимает одно из оставшихся мест',
      'все места одинаково случайны',
      'благоприятные — свободные места в той же группе',
    ],
    fraza: (p) =>
      `прямой пересчёт — фиксируем одного, второй равновероятно занимает любое из ${num(p, 'N') - 1} оставшихся мест.`,
    vizual: (p) => {
      const N = num(p, 'N');
      const razmer = N / num(p, 'g');
      const vmeste = num(p, 'vmeste') === 1;
      return plitki([
        { label: 'в группе первого', count: razmer - 1, blago: vmeste },
        { label: 'в других группах', count: N - razmer, blago: !vmeste },
      ]);
    },
  },
  varianty: [
    {
      n: 1,
      source: 'задачник',
      ref: 'задачник 04, № 67',
      params: {
        gde: 'В классе',
        kogo1: 'учащийся',
        kogo2: 'учащихся',
        N: 16,
        g: 4,
        a: 'Вадим',
        b: 'Сергей',
        para: 'два друга',
        vmeste: 1,
      },
    },
    {
      n: 2,
      source: 'задачник',
      ref: 'задачник 04, № 68',
      params: {
        gde: 'В классе',
        kogo1: 'учащийся',
        kogo2: 'учащихся',
        N: 21,
        g: 7,
        a: 'Света',
        b: 'Нина',
        para: 'две подруги',
        vmeste: 1,
      },
    },
    {
      n: 3,
      source: 'задачник',
      ref: 'задачник 04, № 69',
      params: {
        gde: 'В классе',
        kogo1: 'семиклассник',
        kogo2: 'семиклассников',
        N: 26,
        g: 2,
        a: 'Иван',
        b: 'Игорь',
        para: 'два близнеца',
        vmeste: 0,
      },
    },
    {
      n: 4,
      source: 'задачник',
      ref: 'задачник 04, № 70',
      params: {
        gde: 'В школе',
        kogo1: 'пятиклассник',
        kogo2: 'пятиклассников',
        N: 51,
        g: 3,
        a: 'Саша',
        b: 'Настя',
        para: '',
        vmeste: 0,
      },
    },
    {
      n: 5,
      source: 'конспект',
      ref: 'конспект, № 12',
      params: {
        gde: 'На соревнование едут',
        kogo1: 'спортсмен',
        kogo2: 'спортсменов',
        N: 26,
        g: 2,
        a: 'Олег',
        b: 'Юрий',
        para: 'братья',
        vmeste: 1,
      },
    },
    {
      n: 6,
      source: 'конспект',
      ref: 'конспект, № 13',
      params: {
        gde: 'В классе',
        kogo1: 'учащийся',
        kogo2: 'учащихся',
        N: 9,
        g: 3,
        a: 'Михаил',
        b: 'Андрей',
        para: 'два друга',
        vmeste: 1,
      },
    },
    {
      n: 7,
      source: 'новый',
      ref: 'создан заново',
      params: {
        gde: 'В классе',
        kogo1: 'учащийся',
        kogo2: 'учащихся',
        N: 21,
        g: 3,
        a: 'Кирилл',
        b: 'Матвей',
        para: 'два друга',
        vmeste: 1,
      },
    },
    {
      n: 8,
      source: 'новый',
      ref: 'создан заново',
      params: {
        gde: 'В классе',
        kogo1: 'учащийся',
        kogo2: 'учащихся',
        N: 26,
        g: 13,
        a: 'Полина',
        b: 'Алиса',
        para: 'две подруги',
        vmeste: 1,
      },
    },
    {
      n: 9,
      source: 'новый',
      ref: 'создан заново',
      params: {
        gde: 'В школе',
        kogo1: 'шестиклассник',
        kogo2: 'шестиклассников',
        N: 76,
        g: 19,
        a: 'Тимур',
        b: 'Руслан',
        para: 'два брата',
        vmeste: 0,
      },
    },
    {
      n: 10,
      source: 'новый',
      ref: 'создан заново',
      params: {
        gde: 'В школе',
        kogo1: 'семиклассник',
        kogo2: 'семиклассников',
        N: 201,
        g: 3,
        a: 'Женя',
        b: 'Костя',
        para: 'два друга',
        vmeste: 0,
      },
    },
  ],
});

/* ── 16. Симметричная монета ─────────────────────────────────────── */

/** Сколько раз выпала нужная сторона — словами задачника. */
function skolkoRaz(k: number): string {
  const slova: Record<number, string> = {
    1: 'один раз',
    2: 'два раза',
    3: 'три раза',
    4: 'четыре раза',
  };
  const word = slova[k];
  if (word === undefined) {
    throw new Error(`Нет записи кратности для ${k}`);
  }
  return word;
}

/** Противоположная сторона монеты. */
function drugaya(storona: string): string {
  return storona === 'орёл' ? 'решка' : 'орёл';
}

const P16: Prototype = prototip({
  id: 'p4-16',
  generator: gen('p4-16'),
  blok: MONETY,
  nazvanie: 'Симметричная монета',
  tip: 'Вероятность числа выпадений',
  zadachnik: [71, 78],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const n = num(p, 'n');
    const storona = text(p, 'storona');
    const rezhim = text(p, 'rezhim');
    const k = num(p, 'k');
    const vopros =
      rezhim === 'ni-razu'
        ? `${storona} не выпадет ни разу`
        : rezhim === 'vse'
          ? `${storona} выпадет ${n === 2 ? 'оба раза' : `все ${skolkoRaz(n)}`}`
          : rezhim === 'bolshe'
            ? `${storona} выпала больше раз, чем ${drugaya(storona)}`
            : `${storona} выпадет ровно ${skolkoRaz(k)}`;
    return `В случайном эксперименте симметричную монету бросают ${razy(n)}. Найдите вероятность того, что ${vopros}.`;
  },
  dopustimo: (p) => {
    const n = num(p, 'n');
    const rezhim = text(p, 'rezhim');
    const k = num(p, 'k');
    const storona = text(p, 'storona');
    if (n < 2 || n > 4 || (storona !== 'орёл' && storona !== 'решка')) {
      return false;
    }
    if (rezhim === 'rovno') {
      return k >= 1 && k <= n;
    }
    return ['ni-razu', 'vse', 'bolshe'].includes(rezhim);
  },
  otvet: (p) => {
    const n = num(p, 'n');
    const rezhim = text(p, 'rezhim');
    if (rezhim === 'ni-razu' || rezhim === 'vse') {
      return 1 / 2 ** n;
    }
    if (rezhim === 'bolshe') {
      let ok = 0;
      for (let k = 0; k <= n; k += 1) {
        if (k > n - k) {
          ok += soch(n, k);
        }
      }
      return ok / 2 ** n;
    }
    return soch(n, num(p, 'k')) / 2 ** n;
  },
  perebor: (p) => {
    const n = num(p, 'n');
    const rezhim = text(p, 'rezhim');
    const k = num(p, 'k');
    if (rezhim === 'ni-razu') {
      return monetyPerebor(n, (u) => u === 0);
    }
    if (rezhim === 'vse') {
      return monetyPerebor(n, (u) => u === n);
    }
    if (rezhim === 'bolshe') {
      return monetyPerebor(n, (u) => u > n - u);
    }
    return monetyPerebor(n, (u) => u === k);
  },
  shagi: (p) => {
    const n = num(p, 'n');
    const rezhim = text(p, 'rezhim');
    const k = num(p, 'k');
    const vsego = 2 ** n;
    const otvet =
      rezhim === 'ni-razu' || rezhim === 'vse'
        ? 1 / vsego
        : rezhim === 'bolshe'
          ? monetyPerebor(n, (u) => u > n - u)
          : soch(n, k) / vsego;
    const m = Math.round(otvet * vsego);
    return [
      {
        text: `Все исходы — последовательности ${n} бросков, в таблице каждая — своя клетка:`,
        formula: `n = 2^{${n}} = ${vsego}`,
        value: vsego,
      },
      { text: 'Благоприятные — клетки, где выпало то, что нужно:', formula: `m = ${m}`, value: m },
      shagP(m, vsego),
    ];
  },
  metodika: {
    metod: 'outcome-table',
    methodHints: [
      'монету бросают дважды — два независимых броска',
      'исход — пара результатов, порядок важен',
      'всего пар 2 · 2 = 4: удобно выписать таблицей',
    ],
    fraza: (p) =>
      `таблица исходов — ${num(p, 'n')} независимых броска, важен порядок, все ${2 ** num(p, 'n')} исходов равновозможны.`,
    vizual: (p) => {
      const n = num(p, 'n');
      const k = num(p, 'k');
      const rezhim = text(p, 'rezhim');
      const uspeh = text(p, 'storona') === 'орёл' ? 'О' : 'Р';
      const podhodit = (u: number): boolean =>
        rezhim === 'ni-razu'
          ? u === 0
          : rezhim === 'vse'
            ? u === n
            : rezhim === 'bolshe'
              ? u > n - u
              : u === k;
      return tablitsaMonet(n, ['О', 'Р'], uspeh, podhodit);
    },
  },
  varianty: [
    {
      n: 1,
      source: 'задачник',
      ref: 'задачник 04, № 71',
      params: { n: 2, storona: 'орёл', rezhim: 'ni-razu', k: 0 },
    },
    {
      n: 2,
      source: 'задачник',
      ref: 'задачник 04, № 72',
      params: { n: 2, storona: 'решка', rezhim: 'rovno', k: 1 },
    },
    {
      n: 3,
      source: 'задачник',
      ref: 'задачник 04, № 73',
      params: { n: 2, storona: 'орёл', rezhim: 'vse', k: 0 },
    },
    {
      n: 4,
      source: 'задачник',
      ref: 'задачник 04, № 74',
      params: { n: 2, storona: 'решка', rezhim: 'bolshe', k: 0 },
    },
    {
      n: 5,
      source: 'задачник',
      ref: 'задачник 04, № 75',
      params: { n: 3, storona: 'решка', rezhim: 'vse', k: 0 },
    },
    {
      n: 6,
      source: 'задачник',
      ref: 'задачник 04, № 76',
      params: { n: 3, storona: 'орёл', rezhim: 'rovno', k: 1 },
    },
    {
      n: 7,
      source: 'задачник',
      ref: 'задачник 04, № 77',
      params: { n: 4, storona: 'орёл', rezhim: 'rovno', k: 2 },
    },
    {
      n: 8,
      source: 'задачник',
      ref: 'задачник 04, № 78',
      params: { n: 4, storona: 'орёл', rezhim: 'rovno', k: 3 },
    },
    {
      n: 9,
      source: 'новый',
      ref: 'создан заново',
      params: { n: 3, storona: 'орёл', rezhim: 'ni-razu', k: 0 },
    },
    {
      n: 10,
      source: 'новый',
      ref: 'создан заново',
      params: { n: 4, storona: 'решка', rezhim: 'bolshe', k: 0 },
    },
  ],
});

/* ── 17. Монетка судьи перед матчем ──────────────────────────────── */

const P17: Prototype = prototip({
  id: 'p4-17',
  generator: gen('p4-17'),
  blok: MONETY,
  nazvanie: 'Монетка судьи: кто начнёт с мячом',
  tip: 'Вероятность числа удачных жребиев',
  zadachnik: [79, 84],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const n = num(p, 'n');
    const k = num(p, 'k');
    const kom = text(p, 'komanda');
    const rezhim = text(p, 'rezhim');
    const vopros =
      rezhim === 'vse'
        ? n === 2
          ? 'оба раза'
          : `все ${skolkoRaz(n)}`
        : rezhim === 'ne-bolee'
          ? `не больше ${razGen(k)}`
          : `ровно ${skolkoRaz(k)}`;
    return `Перед началом футбольного матча судья бросает монетку, чтобы определить, какая из команд начнёт игру с мячом. Команда «${kom}» играет ${n === 2 ? 'два матча' : 'три матча'} с разными командами. Найдите вероятность того, что в этих матчах команда «${kom}» начнёт игру с мячом ${vopros}.`;
  },
  dopustimo: (p) => {
    const n = num(p, 'n');
    const k = num(p, 'k');
    const rezhim = text(p, 'rezhim');
    if (n !== 2 && n !== 3) {
      return false;
    }
    if (rezhim === 'vse') {
      return true;
    }
    return ['rovno', 'ne-bolee'].includes(rezhim) && k >= 1 && k <= n;
  },
  otvet: (p) => {
    const n = num(p, 'n');
    const k = num(p, 'k');
    const rezhim = text(p, 'rezhim');
    if (rezhim === 'vse') {
      return 1 / 2 ** n;
    }
    if (rezhim === 'rovno') {
      return soch(n, k) / 2 ** n;
    }
    let ok = 0;
    for (let i = 0; i <= k; i += 1) {
      ok += soch(n, i);
    }
    return ok / 2 ** n;
  },
  perebor: (p) => {
    const n = num(p, 'n');
    const k = num(p, 'k');
    const rezhim = text(p, 'rezhim');
    if (rezhim === 'vse') {
      return monetyPerebor(n, (u) => u === n);
    }
    if (rezhim === 'rovno') {
      return monetyPerebor(n, (u) => u === k);
    }
    return monetyPerebor(n, (u) => u <= k);
  },
  shagi: (p) => {
    const n = num(p, 'n');
    const vsego = 2 ** n;
    const otvet = P17.otvet(p);
    const m = Math.round(otvet * vsego);
    return [
      {
        text: `Все исходы — как лягут ${n} жребия подряд, в таблице каждый — своя клетка:`,
        formula: `n = 2^{${n}} = ${vsego}`,
        value: vsego,
      },
      {
        text: 'Благоприятные — клетки, где команда выиграла жребий столько раз, сколько нужно:',
        formula: `m = ${m}`,
        value: m,
      },
      shagP(m, vsego),
    ];
  },
  metodika: {
    metod: 'outcome-table',
    methodHints: [
      'две монетки — два независимых броска',
      'спрашивают про число выпадений в паре бросков',
      'исход — пара, все пары в таблицу',
    ],
    fraza: (p) =>
      `таблица исходов — ${num(p, 'n')} независимых жребия, все ${2 ** num(p, 'n')} исходов равновозможны.`,
    vizual: (p) => {
      const n = num(p, 'n');
      const k = num(p, 'k');
      const rezhim = text(p, 'rezhim');
      const podhodit = (u: number): boolean =>
        rezhim === 'vse' ? u === n : rezhim === 'rovno' ? u === k : u <= k;
      return tablitsaMonet(n, ['В', 'Н'], 'В', podhodit, ['1-й матч', '2-й матч']);
    },
  },
  varianty: [
    {
      n: 1,
      source: 'задачник',
      ref: 'задачник 04, № 79',
      params: { n: 2, komanda: 'Изумруд', rezhim: 'ne-bolee', k: 1 },
    },
    {
      n: 2,
      source: 'задачник',
      ref: 'задачник 04, № 80',
      params: { n: 2, komanda: 'Геолог', rezhim: 'rovno', k: 1 },
    },
    {
      n: 3,
      source: 'задачник',
      ref: 'задачник 04, № 81',
      params: { n: 3, komanda: 'Биолог', rezhim: 'vse', k: 3 },
    },
    {
      n: 4,
      source: 'задачник',
      ref: 'задачник 04, № 82',
      params: { n: 3, komanda: 'Физик', rezhim: 'rovno', k: 2 },
    },
    {
      n: 5,
      source: 'задачник',
      ref: 'задачник 04, № 83',
      params: { n: 3, komanda: 'Сапфир', rezhim: 'ne-bolee', k: 1 },
    },
    {
      n: 6,
      source: 'задачник',
      ref: 'задачник 04, № 84',
      params: { n: 3, komanda: 'Труд', rezhim: 'rovno', k: 1 },
    },
    {
      n: 7,
      source: 'новый',
      ref: 'создан заново',
      params: { n: 2, komanda: 'Ротор', rezhim: 'vse', k: 2 },
    },
    {
      n: 8,
      source: 'новый',
      ref: 'создан заново',
      params: { n: 3, komanda: 'Химик', rezhim: 'ne-bolee', k: 2 },
    },
    {
      n: 9,
      source: 'новый',
      ref: 'создан заново',
      params: { n: 2, komanda: 'Старт', rezhim: 'rovno', k: 2 },
    },
    {
      n: 10,
      source: 'новый',
      ref: 'создан заново',
      params: { n: 3, komanda: 'Метеор', rezhim: 'ne-bolee', k: 2 },
    },
  ],
});

/* ── 18. Две игральные кости ─────────────────────────────────────── */

const P18: Prototype = prototip({
  id: 'p4-18',
  generator: gen('p4-18'),
  blok: KUBIKI,
  nazvanie: 'Две игральные кости: сумма очков',
  tip: 'Вероятность суммы на двух кубиках',
  zadachnik: [85, 88],
  format: 'десятичная',
  okruglenie: (p) => (num(p, 'znakov') === 3 ? 3 : 2),
  uslovie: (p) => {
    const s = num(p, 's');
    const znakov = num(p, 'znakov');
    return `В случайном эксперименте бросают две игральные кости (кубика). Найдите вероятность того, что в сумме выпадет ${s} ${skl(s, 'очко', 'очка', 'очков')}. Результат округлите до ${znakov === 3 ? 'тысячных' : 'сотых'}.`;
  },
  dopustimo: (p) => {
    const s = num(p, 's');
    const znakov = num(p, 'znakov');
    return Number.isInteger(s) && s >= 2 && s <= 12 && (znakov === 2 || znakov === 3);
  },
  otvet: (p) => {
    const s = num(p, 's');
    let ok = 0;
    for (let a = 1; a <= 6; a += 1) {
      for (let b = 1; b <= 6; b += 1) {
        if (a + b === s) {
          ok += 1;
        }
      }
    }
    return ok / 36;
  },
  perebor: (p) => {
    /* Тот же перебор, но парами «первая кость — вторая»: считаем
       не совпадения суммы, а дополнение до неё. */
    const s = num(p, 's');
    let ok = 0;
    for (let a = 1; a <= 6; a += 1) {
      const b = s - a;
      if (b >= 1 && b <= 6) {
        ok += 1;
      }
    }
    return ok / 36;
  },
  shagi: (p) => {
    const s = num(p, 's');
    const znakov = num(p, 'znakov') === 3 ? 3 : 2;
    let ok = 0;
    for (let a = 1; a <= 6; a += 1) {
      const b = s - a;
      if (b >= 1 && b <= 6) {
        ok += 1;
      }
    }
    return [
      {
        text: 'Все исходы — пары значений двух костей, каждая — клетка таблицы:',
        formula: 'n = 6 \\cdot 6 = 36',
        value: 36,
      },
      { text: `Благоприятные — клетки с суммой ${s}:`, formula: `m = ${ok}`, value: ok },
      shagP(ok, 36, znakov),
    ];
  },
  metodika: {
    metod: 'outcome-table',
    methodHints: [
      'бросают две игральные кости',
      'спрашивают про сумму очков — свойство пары',
      'всего пар 6 · 6 = 36: таблица',
    ],
    fraza: () =>
      'таблица исходов — две кости, результат определяется парой значений, порядок важен.',
    vizual: (p) =>
      tablitsaKostey(
        (a, b) => a + b,
        (a, b) => a + b === num(p, 's'),
      ),
  },
  varianty: [
    { n: 1, source: 'задачник', ref: 'задачник 04, № 85', params: { s: 4, znakov: 2 } },
    { n: 2, source: 'задачник', ref: 'задачник 04, № 86', params: { s: 11, znakov: 2 } },
    { n: 3, source: 'задачник', ref: 'задачник 04, № 87', params: { s: 9, znakov: 2 } },
    { n: 4, source: 'задачник', ref: 'задачник 04, № 88', params: { s: 7, znakov: 3 } },
    { n: 5, source: 'новый', ref: 'создан заново', params: { s: 6, znakov: 2 } },
    { n: 6, source: 'новый', ref: 'создан заново', params: { s: 8, znakov: 3 } },
    { n: 7, source: 'новый', ref: 'создан заново', params: { s: 3, znakov: 3 } },
    { n: 8, source: 'новый', ref: 'создан заново', params: { s: 12, znakov: 3 } },
    { n: 9, source: 'новый', ref: 'создан заново', params: { s: 2, znakov: 2 } },
    { n: 10, source: 'новый', ref: 'создан заново', params: { s: 5, znakov: 3 } },
  ],
});

/* Порядок — порядок задачника: P24 стоит за P04 (задачи 17–18),
   P25 за P08 (35–38). Номера прототипов у них другие: p4-01…p4-23
   уже разошлись по картинкам и прогрессу, и перенумеровать их
   значило бы сбить и то, и другое. */
export const KLASSICHESKOE: readonly Prototype[] = [
  P01,
  P02,
  P03,
  P04,
  P24,
  P05,
  P06,
  P07,
  P08,
  P25,
  P09,
  P10,
  P11,
  P12,
  P13,
  P14,
  P15,
  P16,
  P17,
  P18,
];
