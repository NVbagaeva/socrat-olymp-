/**
 * Вкладка «О задании» №3: шапка, «Чем опасно», подписи, формулы блока
 * «Что нужно знать». Тексты — черновик автора сайта, вычитка:
 * docs/zadanie-3-teksty.md.
 */

import type { Ton3 } from './gruppy';

/** Факты о задании — один источник для «О задании» и для шапки раздела. */
const BALL3 = '1';
const MINUT3 = '≈ 3';

/** Таблетки шапки раздела: «1 балл», «≈ 3 минуты». */
export const TABLETKI3 = {
  ball: `${BALL3} балл`,
  vremya: `${MINUT3} минуты`,
} as const;

export const SHAPKA3 = {
  nadzagolovok: 'Задание №3 · первая часть',
  zagolovok: 'Стереометрия: одна фигура — одно число',
  lead: 'Проверяется, видите ли вы фигуру в пространстве и знаете ли формулы объёмов и площадей. Считать почти нечего: главное — найти нужный отрезок или нужную долю.',
  fakty: [
    { znachenie: BALL3, podpis: 'первичный балл' },
    { znachenie: MINUT3, podpis: 'минуты на экзамене' },
    { znachenie: '15', podpis: 'типов в семи группах' },
  ],
  opasnoTitle: 'Чем опасно',
  opasno: [
    'Площадь поверхности и объём — разные вопросы. Перечитайте, что именно просят найти.',
    'Рёбра увеличили в $k$ раз — площадь выросла в $k^2$, объём в $k^3$, а не в $k$.',
    'У пирамиды и конуса в объёме стоит $\\frac{1}{3}$ — её забывают чаще всего.',
    'В составном многограннике легко посчитать грань дважды или потерять «дно ступеньки».',
    'Радиус и диаметр: в формулах стоит $r$, а в условии часто дают диаметр.',
  ],
  gruppyTitle: 'Типы задач по группам',
  gruppyLead:
    'Откройте группу и выберите тип — внутри разобранный пример с чертежом, который можно повернуть.',
  znatTitle: 'Что нужно знать',
  znatLead: 'Каждая формула — с чертежом и коротким примером.',
  tipov: (n: number) => `${n} ${n === 1 ? 'тип' : n < 5 ? 'типа' : 'типов'}`,
  povtorit: 'Стоит повторить',
  neNachato: 'ещё не начато',
  resheno: (resheno: number, verno: number) => `решено ${resheno} · верно ${verno}`,
  primer: 'Разобранный пример',
  primerZhdyot: 'Открываем пример…',
  primerNet: 'Пример не открылся — обновите страницу.',
  otvet: 'Ответ',
  trenirovat: 'Потренировать этот тип',
  opornye: 'Опорные задачи этого типа',
  lovushka: 'Где теряют балл',
  /* Пример с чертежом. */
  chertezhUsloviya: 'Чертёж условия',
  naChertezhe: (n: number) => `На чертеже — шаг ${n}`,
  svernut: 'Свернуть',
  razvernut: 'Показать чертёж',
  shagKnopka: 'Показать шаг на чертеже',
};

export interface Formula3 {
  tex: string;
  /** Пример применения, TeX. */
  primer: string;
}

export interface FormulyFigury3 {
  /** Какой чертёж у рамки (components/tasks/zadanie3/chertezhiFormul). */
  id: 'parallelepiped' | 'prizma' | 'piramida' | 'cilindr' | 'konus' | 'shar';
  nazvanie: string;
  ton: Ton3;
  formuly: Formula3[];
}

export const FORMULY3: FormulyFigury3[] = [
  {
    id: 'parallelepiped',
    nazvanie: 'Куб и параллелепипед',
    ton: 'blue',
    formuly: [
      { tex: 'V = abc', primer: 'a=2,\\ b=3,\\ c=4:\\ V = 24' },
      { tex: 'S = 2(ab + bc + ac)', primer: 'S = 2(6 + 12 + 8) = 52' },
      { tex: 'd^{2} = a^{2} + b^{2} + c^{2}', primer: 'd^{2} = 4 + 9 + 36 = 49,\\ d = 7' },
    ],
  },
  {
    id: 'prizma',
    nazvanie: 'Призма',
    ton: 'navy',
    formuly: [
      { tex: 'V = S_{\\text{осн}} \\cdot h', primer: 'S_{\\text{осн}} = 6,\\ h = 5:\\ V = 30' },
      {
        tex: 'S_{\\text{бок}} = P_{\\text{осн}} \\cdot h',
        primer: 'P_{\\text{осн}} = 12,\\ h = 5:\\ S_{\\text{бок}} = 60',
      },
    ],
  },
  {
    id: 'piramida',
    nazvanie: 'Пирамида',
    ton: 'orange',
    formuly: [
      {
        tex: 'V = \\dfrac{1}{3} S_{\\text{осн}} \\cdot h',
        primer: 'S_{\\text{осн}} = 36,\\ h = 4:\\ V = \\tfrac{1}{3} \\cdot 36 \\cdot 4 = 48',
      },
    ],
  },
  {
    id: 'cilindr',
    nazvanie: 'Цилиндр',
    ton: 'blue',
    formuly: [
      { tex: 'V = \\pi r^{2} h', primer: 'r = 2,\\ h = 5:\\ V = 20\\pi' },
      { tex: 'S_{\\text{бок}} = 2\\pi r h', primer: 'r = 2,\\ h = 5:\\ S_{\\text{бок}} = 20\\pi' },
    ],
  },
  {
    id: 'konus',
    nazvanie: 'Конус',
    ton: 'terra',
    formuly: [
      { tex: 'V = \\dfrac{1}{3}\\pi r^{2} h', primer: 'r = 3,\\ h = 4:\\ V = 12\\pi' },
      { tex: 'l^{2} = r^{2} + h^{2}', primer: 'l^{2} = 9 + 16 = 25,\\ l = 5' },
      {
        tex: 'S_{\\text{бок}} = \\pi r l',
        primer: 'S_{\\text{бок}} = \\pi \\cdot 3 \\cdot 5 = 15\\pi',
      },
    ],
  },
  {
    id: 'shar',
    nazvanie: 'Шар',
    ton: 'navy',
    formuly: [
      { tex: 'V = \\dfrac{4}{3}\\pi R^{3}', primer: 'R = 3:\\ V = 36\\pi' },
      { tex: 'S = 4\\pi R^{2}', primer: 'R = 3:\\ S = 36\\pi' },
    ],
  },
];

/** Рамка «Подобные тела»: $k$, $k^2$, $k^3$ с наглядным примером. */
export const PODOBIE3 = {
  nazvanie: 'Подобные тела: $k$, $k^2$, $k^3$',
  lead: 'Все размеры тела увеличили в $k$ раз. Тогда:',
  stroki: [
    { chto: 'длины (рёбра, радиус, высота)', vo: 'k', primer: '2' },
    { chto: 'площади (грань, сечение, поверхность)', vo: 'k^{2}', primer: '4' },
    { chto: 'объём', vo: 'k^{3}', primer: '8' },
  ],
  vRaz: 'в',
  raz: 'раз',
  pri: (n: string) => `при $k = 2$: в ${n}`,
  primer:
    'Ребро куба увеличили в $2$ раза: было $a$, стало $2a$. Площадь грани выросла в $4$ раза, объём — в $8$ раз: в большой куб входит восемь маленьких.',
  alt: 'Два куба: с ребром a и с ребром 2a',
};
