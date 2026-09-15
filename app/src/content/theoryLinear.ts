/**
 * Тексты разделов теории линейных функций.
 *
 * Здесь и только здесь лежат слова: компоненты раздела берут их
 * отсюда и своих строк не содержат. Тексты авторские, дословные.
 */

import type { KindId, LineKindId } from '@/lib/scenes';

/**
 * Кусок текста: жирным выделяется то, что выделено автором.
 *
 * math — математическая переменная: она набирается KaTeX и выходит
 * курсивом, как принято в формулах, а не обычной буквой.
 */
export interface Phrase {
  text: string;
  strong?: boolean;
  math?: boolean;
}

export interface WhatIsFunctionContent {
  /** Первая строка: она выделена крупнее остального текста. */
  lead: string;
  intro: string;
  /** Акцентная строка между абзацами: синяя, без плашки. */
  accent: string;
  after: Phrase[];
  illustration: { src: string; width: number; height: number; alt: string };
  mapping: {
    title: string;
    setX: string;
    setY: string;
    /** Главная мысль схемы, справа от неё. */
    caption: Phrase[];
    /** Уточнение под главной мыслью, мельче и светлее. */
    note: Phrase[];
  };
  rule: { title: string; text: Phrase[] };
}

export const whatIsFunction: WhatIsFunctionContent = {
  lead: 'Вы наверняка сталкивались со словом «зависимость».',
  intro:
    'Мы говорим о компьютерной зависимости, когда человек не может оторваться от игр. Есть зависимость от социальных сетей, от кофе, от мнения окружающих.',
  accent: 'Во всех этих примерах одно явление зависит от другого.',
  after: [
    { text: 'В математике ' },
    { text: 'функция', strong: true },
    {
      text: ' — это тоже зависимость. Только здесь всё чётко, понятно и подчиняется определённому правилу.',
    },
  ],
  /* Пузыри с подписями и рукописная надпись нарисованы внутри самого
     файла: рядом с ним ни карточек, ни HandNote быть не должно. */
  illustration: {
    src: '/images/sloth-dependencies.webp',
    width: 1517,
    height: 1024,
    alt: 'Ленивец в лавровом венке за тетрадью, вокруг — зависимость от кофе, игр, мнения окружающих и соцсетей',
  },
  mapping: {
    title: 'Функция как отображение',
    setX: 'Множество X (аргументы)',
    setY: 'Множество Y (значения)',
    caption: [
      { text: 'Для каждого ' },
      { text: 'x', math: true },
      { text: ' — ровно одно ' },
      { text: 'y', math: true },
      { text: '.' },
    ],
    note: [
      { text: 'Разные значения ' },
      { text: 'x', math: true },
      { text: ' могут соответствовать одному и тому же ' },
      { text: 'y', math: true },
      { text: '.' },
    ],
  },
  rule: {
    title: 'Строгое определение',
    text: [
      { text: 'Функция', strong: true },
      { text: ' — это зависимость, при которой каждому значению ' },
      { text: 'x', math: true },
      { text: ' из области определения соответствует ' },
      { text: 'единственное значение функции ', strong: true },
      { text: 'y', strong: true, math: true },
      { text: '.' },
    ],
  },
};

/** Карточка известного графика: название, формула и чертёж. */
export interface KindCard {
  /** Ключ чертежа в lib/scenes.ts. */
  id: KindId;
  title: string;
  /** Формула в записи TeX: набирается KaTeX, текстом не выводится. */
  formula: string;
}

export interface WhatKindsContent {
  lead: string;
  cards: KindCard[];
}

export const whatKinds: WhatKindsContent = {
  lead: 'На самом деле вы уже давно работаете с функциями. Вот самые известные примеры:',
  cards: [
    { id: 'linear', title: 'Линейная функция', formula: 'y = kx + b' },
    { id: 'quadratic', title: 'Квадратичная функция', formula: 'y = ax^2 + bx + c' },
    { id: 'rational', title: 'Дробно-рациональная', formula: 'y = \\dfrac{ax + b}{cx + d}' },
    { id: 'sqrt', title: 'График корня', formula: 'y = \\sqrt{x}' },
  ],
};

/** Раздел «Когда график не функция». */
/** Карточка прямой: формула, чертёж, вердикт и пояснение. */
export interface NoFnCard {
  /** Ключ чертежа в lib/scenes.ts. */
  id: LineKindId;
  /** Номер на бейдже: 01 … 04. */
  no: string;
  /** Формула в записи TeX: набирается KaTeX, текстом не выводится. */
  formula: string;
  caption: string;
  /** Итог: график функции или нет. Отсюда берётся цвет вердикта. */
  verdict: 'function' | 'not-function';
  verdictLabel: string;
  explain: Phrase[];
  note: Phrase[];
}

export interface GraphNotFunctionContent {
  /** Плашка в строке заголовка, у правого края. */
  hint: string;
  cards: NoFnCard[];
}

/* Пояснения набраны кусками, потому что переменные в них идут
   курсивом через KaTeX, а выделенные автором слова — полужирным. */
const FOR_EACH_X: Phrase[] = [
  { text: 'Для каждого ' },
  { text: 'x', math: true },
  { text: ' существует ' },
  { text: 'ровно одно', strong: true },
  { text: ' значение ' },
];

export const graphNotFunction: GraphNotFunctionContent = {
  hint: 'Всё это — прямые. Но не все они являются графиками функций!',
  cards: [
    {
      id: 'horizontal',
      no: '01',
      formula: 'y = b',
      caption: 'Горизонтальная прямая',
      verdict: 'function',
      verdictLabel: 'ФУНКЦИЯ',
      explain: [...FOR_EACH_X, { text: 'y = b', math: true }, { text: '.' }],
      note: [{ text: 'Любая вертикальная прямая пересекает график ровно в одной точке.' }],
    },
    {
      id: 'vertical',
      no: '02',
      formula: 'x = a',
      caption: 'Вертикальная прямая',
      verdict: 'not-function',
      verdictLabel: 'НЕ ФУНКЦИЯ',
      explain: [
        { text: 'Для одного и того же ' },
        { text: 'x = a', math: true },
        { text: ' существует ' },
        { text: 'бесконечно много', strong: true },
        { text: ' значений ' },
        { text: 'y', math: true },
        { text: '.' },
      ],
      note: [
        { text: 'Нарушается главное условие функции: одному ' },
        { text: 'x', math: true },
        { text: ' соответствует не одно, а множество значений ' },
        { text: 'y', math: true },
        { text: '.' },
      ],
    },
    {
      id: 'bisector',
      no: '03',
      formula: 'y = x',
      caption: 'Биссектриса I и III четвертей',
      verdict: 'function',
      verdictLabel: 'ФУНКЦИЯ',
      explain: [...FOR_EACH_X, { text: 'y', math: true }, { text: '.' }],
      note: [
        { text: 'Например: если ' },
        { text: 'x = 2', math: true },
        { text: ', то ' },
        { text: 'y = 2', math: true },
        { text: '.' },
      ],
    },
    {
      id: 'antibisector',
      no: '04',
      formula: 'y = -x',
      caption: 'Биссектриса II и IV четвертей',
      verdict: 'function',
      verdictLabel: 'ФУНКЦИЯ',
      explain: [...FOR_EACH_X, { text: 'y', math: true }, { text: '.' }],
      note: [
        { text: 'Например: если ' },
        { text: 'x = 2', math: true },
        { text: ', то ' },
        { text: 'y = -2', math: true },
        { text: '.' },
      ],
    },
  ],
};
