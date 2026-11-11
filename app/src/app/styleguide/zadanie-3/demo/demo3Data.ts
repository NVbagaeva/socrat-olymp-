/* Данные демо-страницы задания №3 (/styleguide/zadanie-3/demo/).

   Задачи, чертежи, разборы и опорные задачи — настоящие, из банка №3
   (lib/zadanie3, lib/stereo/razbory3, lib/stereo/opornye3). Группы,
   шапка, «Чем опасно» и примеры к формулам — черновик для показа
   оформления: перед выходом на сайт их читает автор. Прогресс ученика
   — образец, в бою он придёт из журнала попыток. */

import type { Ton } from '@/components/tasks/steklo';

export interface Gruppa3 {
  id: string;
  nazvanie: string;
  lead: string;
  ton: Ton;
  /** Прототип, чья фигура — значок группы. */
  znak: string;
  /** Типы группы: id из content/stereo/tipy.ts (TIPY_3). */
  tipy: string[];
  /** Блок опорных задач группы (slug из lib/stereo/opornye3/bloki). */
  opornye: string;
  /** Образец прогресса: решено, верно, ошибок из последних пяти. */
  resheno: number;
  verno: number;
  oshibokIz5: number;
}

/** Семь групп вместо восьми разделов «по телам»: 15 типов, 92 прототипа. */
export const GRUPPY3: Gruppa3[] = [
  {
    id: 'kub',
    nazvanie: 'Куб и прямоугольный параллелепипед',
    lead: 'Диагональ, сечение-прямоугольник',
    ton: 'blue',
    znak: 'P03-01',
    tipy: ['diagonali', 'secheniya'],
    opornye: 'prostranstvo-treugolnik',
    resheno: 14,
    verno: 12,
    oshibokIz5: 0,
  },
  {
    id: 'ugly',
    nazvanie: 'Углы между прямыми',
    lead: 'Куб, призма: 90°, 60°, 45°',
    ton: 'navy',
    znak: 'P03-08',
    tipy: ['ugly'],
    opornye: 'ugly',
    resheno: 6,
    verno: 2,
    oshibokIz5: 3,
  },
  {
    id: 'prizma-piramida',
    nazvanie: 'Призма и пирамида',
    lead: 'Высота, боковое ребро, объём',
    ton: 'orange',
    znak: 'P03-46',
    tipy: ['obem-prizmy', 'piramida', 'obem-piramidy'],
    opornye: 'piramida',
    resheno: 9,
    verno: 7,
    oshibokIz5: 1,
  },
  {
    id: 'sostavnye',
    nazvanie: 'Составные многогранники и части тел',
    lead: '«Из кубиков», отсечённые части, пирамида внутри призмы',
    ton: 'terra',
    znak: 'P03-11',
    tipy: ['kubiki', 'chast', 'piramida-vnutri'],
    opornye: 'sostavnye-obem',
    resheno: 0,
    verno: 0,
    oshibokIz5: 0,
  },
  {
    id: 'vrashcheniya',
    nazvanie: 'Цилиндр, конус, шар',
    lead: 'Радиус, высота, образующая, осевое сечение',
    ton: 'blue',
    znak: 'P03-55',
    tipy: ['konus', 'cilindr-shar'],
    opornye: 'cilindr-konus-shar',
    resheno: 11,
    verno: 9,
    oshibokIz5: 1,
  },
  {
    id: 'vo-skolko-raz',
    nazvanie: 'Во сколько раз изменится',
    lead: 'Подобные тела, жидкость в сосудах',
    ton: 'orange',
    znak: 'P03-70',
    tipy: ['vo-skolko-raz', 'zhidkost'],
    opornye: 'vo-skolko-raz',
    resheno: 5,
    verno: 2,
    oshibokIz5: 2,
  },
  {
    id: 'kombinacii',
    nazvanie: 'Комбинации тел',
    lead: 'Вписанные и описанные цилиндр, конус, шар',
    ton: 'navy',
    znak: 'P03-85',
    tipy: ['cilindr-komb', 'sfera-komb'],
    opornye: 'kombinacii',
    resheno: 3,
    verno: 3,
    oshibokIz5: 0,
  },
];

/** Человеческие названия типов (черновик): «сейчас → предлагаю». */
export const TIPY3_NAZVANIYA: Record<string, { nazvanie: string; lead: string }> = {
  diagonali: {
    nazvanie: 'Диагональ куба и параллелепипеда',
    lead: 'Три ребра → диагональ: теорема Пифагора два раза',
  },
  secheniya: {
    nazvanie: 'Сечение параллелепипеда',
    lead: 'Сечение — прямоугольник: находим две его стороны',
  },
  ugly: {
    nazvanie: 'Угол между прямыми',
    lead: 'Переносим прямую параллельно и ищем треугольник',
  },
  'obem-prizmy': {
    nazvanie: 'Объём призмы',
    lead: 'Площадь основания на высоту',
  },
  piramida: {
    nazvanie: 'Высота и рёбра пирамиды',
    lead: 'Прямоугольный треугольник с высотой внутри пирамиды',
  },
  'obem-piramidy': {
    nazvanie: 'Объём пирамиды',
    lead: 'Треть площади основания на высоту; отсечённые пирамиды',
  },
  kubiki: {
    nazvanie: 'Многогранник «из кубиков»',
    lead: 'Объём — по частям, площадь — по трём направлениям',
  },
  chast: {
    nazvanie: 'Часть параллелепипеда или призмы',
    lead: 'Какую долю целого занимает отсечённая часть',
  },
  'piramida-vnutri': {
    nazvanie: 'Пирамида внутри призмы',
    lead: 'То же основание и высота — треть объёма',
  },
  konus: {
    nazvanie: 'Конус: радиус, высота, образующая',
    lead: 'Осевое сечение — равнобедренный треугольник',
  },
  'cilindr-shar': {
    nazvanie: 'Цилиндр и шар: площади и объёмы',
    lead: 'Формулы с $\\pi$: что дано — радиус или диаметр',
  },
  'vo-skolko-raz': {
    nazvanie: 'Размеры изменили — во сколько раз',
    lead: 'Длины в $k$, площади в $k^2$, объёмы в $k^3$',
  },
  zhidkost: {
    nazvanie: 'Жидкость в сосуде',
    lead: 'Объём тот же — меняется уровень',
  },
  'cilindr-komb': {
    nazvanie: 'Цилиндр и вписанные в него тела',
    lead: 'Общий радиус и общая высота',
  },
  'sfera-komb': {
    nazvanie: 'Шар и описанные около него тела',
    lead: 'Диаметр шара — ребро куба или высота цилиндра',
  },
};

export const SHAPKA3 = {
  nadzagolovok: 'Задание №3 · первая часть',
  zagolovok: 'Стереометрия: одна фигура — одно число',
  lead: 'Проверяется, видите ли вы фигуру в пространстве и знаете ли формулы объёмов и площадей. Считать почти нечего: главное — найти нужный отрезок или нужную долю.',
  fakty: [
    { znachenie: '1', podpis: 'первичный балл' },
    { znachenie: '≈ 3', podpis: 'минуты на экзамене' },
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
  gruppyTitle: 'Типы задач',
  gruppyLead: 'Семь групп. Откройте группу, выберите тип — внутри разобранный пример с чертежом.',
  znatTitle: 'Что нужно знать',
  znatLead: 'Каждая формула — с чертежом и коротким примером.',
  primer: 'Разобранный пример',
  otvet: 'Ответ',
  lovushka: 'Где теряют балл',
  trenirovat: 'Потренировать этот тип',
  opornye: 'Опорные задачи этого типа',
  povtorit: 'Стоит повторить',
  neNachato: 'Ещё не решали',
};

/** «Что нужно знать»: формулы с примером. Чертёж рамки — в Demo3.tsx. */
export const FORMULY3: {
  id: string;
  nazvanie: string;
  ton: Ton;
  formuly: { tex: string; primer: string }[];
}[] = [
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

export const PODOBIE3 = {
  nazvanie: 'Подобные тела: k, k², k³',
  lead: 'Все размеры тела увеличили в $k$ раз. Тогда:',
  stroki: [
    { chto: 'длины (рёбра, радиус, высота)', vo: 'k', primer: '2' },
    { chto: 'площади (грань, сечение, поверхность)', vo: 'k^{2}', primer: '4' },
    { chto: 'объём', vo: 'k^{3}', primer: '8' },
  ],
  primer:
    'Ребро куба увеличили в $2$ раза: было $1$, стало $2$. Площадь грани: $1 \\to 4$. Объём: $1 \\to 8$ — в большой куб входит восемь маленьких.',
};

/** Опорные задачи: блоки по навыкам — «сейчас 12 блоков → предлагаю 6 навыков». */
export const NAVYKI3: {
  id: string;
  nazvanie: string;
  lead: string;
  ton: Ton;
  znak: string;
  bloki: string[];
}[] = [
  {
    id: 'vizhu',
    nazvanie: 'Видим фигуру в пространстве',
    lead: 'Рёбра, грани, прямые углы на чертеже',
    ton: 'blue',
    znak: 'P03-08',
    bloki: ['chitayu-chertezh', 'prostranstvo-treugolnik', 'ugly'],
  },
  {
    id: 'kub',
    nazvanie: 'Объём и площадь куба и параллелепипеда',
    lead: 'Три ребра — объём, поверхность, диагональ',
    ton: 'navy',
    znak: 'P03-01',
    bloki: ['obem-i-ploshchad'],
  },
  {
    id: 'prizma-piramida',
    nazvanie: 'Призма и пирамида',
    lead: 'Основание, высота и одна треть',
    ton: 'orange',
    znak: 'P03-46',
    bloki: ['piramida', 'chasti-tel'],
  },
  {
    id: 'vrashcheniya',
    nazvanie: 'Тела вращения',
    lead: 'Цилиндр, конус, шар и их комбинации',
    ton: 'blue',
    znak: 'P03-55',
    bloki: ['cilindr-konus-shar', 'kombinacii'],
  },
  {
    id: 'k',
    nazvanie: 'Что будет, если увеличить в k раз',
    lead: 'Длины, площади и объёмы растут по-разному',
    ton: 'terra',
    znak: 'P03-70',
    bloki: ['vo-skolko-raz'],
  },
  {
    id: 'sostavnye',
    nazvanie: 'Разбиваем составную фигуру на простые',
    lead: 'Объём по частям, поверхность по граням',
    ton: 'orange',
    znak: 'P03-11',
    bloki: ['sostavnye-obem', 'sostavnye-ploshchad'],
  },
];

/** Тренажёр: задачи живого прогона — прототип и номер варианта. */
export const ZADACHI_DEMO: { prototip: string; n: number; gruppa: string }[] = [
  { prototip: 'P03-01', n: 1, gruppa: 'kub' },
  { prototip: 'P03-55', n: 1, gruppa: 'vrashcheniya' },
  { prototip: 'P03-85', n: 1, gruppa: 'kombinacii' },
];

export const VARIANTY3 = [
  {
    id: 'a',
    bukva: 'А',
    nazvanie: 'Витрина',
    lead: 'Группы — крупные стеклянные карточки с фигурой; пример раскрывается на месте: чертёж сверху, шаги под ним. Формулы — сеткой рамок.',
  },
  {
    id: 'b',
    bukva: 'Б',
    nazvanie: 'Сцена',
    lead: 'Группы — плотный список с цветной направляющей; в примере чертёж закреплён рядом с шагами и подсвечивает то, о чём шаг. Формулы — лентой по фигурам.',
  },
] as const;

export type Variant3 = (typeof VARIANTY3)[number]['id'];
