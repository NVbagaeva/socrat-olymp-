/**
 * Карта задания №3: семь групп, 15 типов, 92 прототипа.
 *
 * Группы утверждены заказчиком (шаг 0 редизайна,
 * docs/zadanie-3-audit.md). Типы — те же, что в content/stereo/tipy.ts
 * (TIPY_3: у каждого разобранный пример и свои прототипы банка); здесь
 * — раскладка по группам, человеческие названия и тексты для вкладки
 * «О задании» и выбора тем тренажёра. Прототип ученику не показывается
 * нигде: ни кодом, ни названием.
 */

import { TIPY_3 } from '../stereo/tipy';

export type Ton3 = 'blue' | 'navy' | 'orange' | 'terra' | 'green';

export interface Gruppa3 {
  id: string;
  nazvanie: string;
  lead: string;
  ton: Ton3;
  /** Прототип, чья фигура — значок группы. */
  znak: string;
  /** Типы группы (id из TIPY_3). */
  tipy: string[];
}

export const GRUPPY3: Gruppa3[] = [
  {
    id: 'kub',
    nazvanie: 'Куб и прямоугольный параллелепипед',
    lead: 'Диагональ, сечение-прямоугольник',
    ton: 'blue',
    znak: 'P03-01',
    tipy: ['diagonali', 'secheniya'],
  },
  {
    id: 'ugly',
    nazvanie: 'Углы между прямыми',
    lead: 'Куб и призма: 90°, 60°, 45°',
    ton: 'navy',
    znak: 'P03-08',
    tipy: ['ugly'],
  },
  {
    id: 'prizma-piramida',
    nazvanie: 'Призма и пирамида',
    lead: 'Высота, боковое ребро, объём',
    ton: 'orange',
    znak: 'P03-46',
    tipy: ['obem-prizmy', 'piramida', 'obem-piramidy'],
  },
  {
    id: 'sostavnye',
    nazvanie: 'Составные многогранники и части тел',
    lead: '«Из кубиков», отсечённые части, пирамида внутри призмы',
    ton: 'terra',
    znak: 'P03-11',
    tipy: ['kubiki', 'chast', 'piramida-vnutri'],
  },
  {
    id: 'vrashcheniya',
    nazvanie: 'Цилиндр, конус, шар',
    lead: 'Радиус, высота, образующая, осевое сечение',
    ton: 'blue',
    znak: 'P03-55',
    tipy: ['konus', 'cilindr-shar'],
  },
  {
    id: 'vo-skolko-raz',
    nazvanie: 'Во сколько раз изменится',
    lead: 'Подобные тела, жидкость в сосудах',
    ton: 'orange',
    znak: 'P03-70',
    tipy: ['vo-skolko-raz', 'zhidkost'],
  },
  {
    id: 'kombinacii',
    nazvanie: 'Комбинации тел',
    lead: 'Вписанные и описанные цилиндр, конус, шар',
    ton: 'navy',
    znak: 'P03-85',
    tipy: ['cilindr-komb', 'sfera-komb'],
  },
];

export interface TipTeksty3 {
  /** Название типа; формулы — $…$. */
  nazvanie: string;
  /** Одна строка под названием: в чём приём. Без формул. */
  lead: string;
  /** «Где теряют балл»; формулы — $…$. */
  opasno: string;
  /** Блок опорных задач этого типа (slug из lib/stereo/opornye3/bloki). */
  opornye: string;
}

/** Тексты типов — черновик автора сайта, вычитка: docs/zadanie-3-teksty.md. */
export const TIPY3: Record<string, TipTeksty3> = {
  diagonali: {
    nazvanie: 'Диагональ куба и параллелепипеда',
    lead: 'Три ребра → диагональ: теорема Пифагора два раза',
    opasno:
      'Находят диагональ грани и записывают её в ответ. Диагональ параллелепипеда идёт через всё тело: $d^2 = a^2 + b^2 + c^2$.',
    opornye: 'prostranstvo-treugolnik',
  },
  secheniya: {
    nazvanie: 'Сечение параллелепипеда',
    lead: 'Сечение — прямоугольник: находим две его стороны',
    opasno:
      'Одну сторону сечения берут как ребро, а вторую тоже как ребро. Вторая сторона — диагональ грани, её считают по теореме Пифагора.',
    opornye: 'prostranstvo-treugolnik',
  },
  ugly: {
    nazvanie: 'Угол между прямыми',
    lead: 'Переносим прямую параллельно и ищем треугольник',
    opasno:
      'Ищут угол между прямыми, которые не пересекаются, «на глаз». Одну прямую нужно перенести параллельно, чтобы получился треугольник.',
    opornye: 'ugly',
  },
  'obem-prizmy': {
    nazvanie: 'Объём призмы',
    lead: 'Площадь основания на высоту',
    opasno:
      'В основании прямоугольный треугольник — его площадь равна половине произведения катетов. Половину забывают.',
    opornye: 'obem-i-ploshchad',
  },
  piramida: {
    nazvanie: 'Высота и рёбра пирамиды',
    lead: 'Прямоугольный треугольник с высотой внутри пирамиды',
    opasno:
      'В треугольник с высотой подставляют всю диагональ основания. Катет — её половина: высота падает в центр основания.',
    opornye: 'piramida',
  },
  'obem-piramidy': {
    nazvanie: 'Объём пирамиды',
    lead: 'Треть площади основания на высоту; отсечённые пирамиды',
    opasno: 'Забывают $\\frac{1}{3}$ в формуле объёма и получают объём призмы.',
    opornye: 'piramida',
  },
  kubiki: {
    nazvanie: 'Многогранник «из кубиков»',
    lead: 'Объём — по частям, площадь — по трём направлениям',
    opasno:
      'В площади поверхности теряют «дно ступеньки» или считают внутреннюю грань дважды. Надёжнее смотреть на тело с трёх сторон.',
    opornye: 'sostavnye-obem',
  },
  chast: {
    nazvanie: 'Часть параллелепипеда или призмы',
    lead: 'Какую долю целого занимает отсечённая часть',
    opasno:
      'Не рисуют многогранник по перечисленным вершинам и не видят, что это половина или четверть целого.',
    opornye: 'chasti-tel',
  },
  'piramida-vnutri': {
    nazvanie: 'Пирамида внутри призмы',
    lead: 'То же основание и высота — треть объёма',
    opasno:
      'Считают объём пирамиды как объём призмы. У пирамиды с тем же основанием и той же высотой объём втрое меньше.',
    opornye: 'chasti-tel',
  },
  konus: {
    nazvanie: 'Конус: радиус, высота, образующая',
    lead: 'Осевое сечение — равнобедренный треугольник',
    opasno: 'В условии дан диаметр, а в теорему Пифагора нужен радиус: $l^2 = r^2 + h^2$.',
    opornye: 'cilindr-konus-shar',
  },
  'cilindr-shar': {
    nazvanie: 'Цилиндр и шар: площади и объёмы',
    lead: 'Формулы с числом $\\pi$: что дано — радиус или диаметр',
    opasno: 'Путают боковую поверхность цилиндра $2\\pi rh$ с полной и радиус с диаметром.',
    opornye: 'cilindr-konus-shar',
  },
  'vo-skolko-raz': {
    nazvanie: 'Размеры изменили — во сколько раз',
    lead: 'Длины в $k$, площади в $k^2$, объёмы в $k^3$',
    opasno:
      'Радиус увеличили в $k$ раз — отвечают, что объём вырос в $k$ раз. Площадь растёт в $k^2$, объём подобного тела — в $k^3$.',
    opornye: 'vo-skolko-raz',
  },
  zhidkost: {
    nazvanie: 'Жидкость в сосуде',
    lead: 'Объём тот же — меняется уровень',
    opasno:
      'В коническом сосуде уровень вдвое ниже — жидкости не вдвое, а в восемь раз меньше: объём идёт как куб высоты.',
    opornye: 'vo-skolko-raz',
  },
  'cilindr-komb': {
    nazvanie: 'Цилиндр и вписанные в него тела',
    lead: 'Общий радиус и общая высота',
    opasno: 'Сторону описанного параллелепипеда берут равной радиусу. Она равна диаметру цилиндра.',
    opornye: 'kombinacii',
  },
  'sfera-komb': {
    nazvanie: 'Шар и описанные около него тела',
    lead: 'Диаметр шара — ребро куба или высота цилиндра',
    opasno:
      'Ребро описанного куба приравнивают к радиусу шара. Ребро куба и высота цилиндра равны диаметру.',
    opornye: 'kombinacii',
  },
};

/** Все типы по порядку групп. */
export const TIPY3_ORDER: string[] = GRUPPY3.flatMap((g) => g.tipy);

const NOMERA = new Map<string, readonly number[]>(TIPY_3.map((t) => [t.id, t.prototipy ?? []]));

/** «P03-01» по номеру прототипа. */
export function kodPrototipa(n: number): string {
  return `P03-${String(n).padStart(2, '0')}`;
}

/** Прототипы типа: «P03-01», «P03-02». */
export function prototipyTipa(tip: string): string[] {
  return (NOMERA.get(tip) ?? []).map(kodPrototipa);
}

const TIP_PROTOTIPA = new Map<string, string>(
  TIPY3_ORDER.flatMap((tip) => prototipyTipa(tip).map((p) => [p, tip] as const)),
);

/** Тип прототипа; undefined — прототип вне карты. */
export function tipPrototipa(prototip: string): string | undefined {
  return TIP_PROTOTIPA.get(prototip);
}

/** Прототип задачи по её ключу: «P03-01#3» и прежнее «P03-01:3» → «P03-01». */
export function prototipZadachi(zadacha: string): string {
  return zadacha.split(/[#:]/)[0] ?? zadacha;
}

/** Тип задачи по её ключу; у неизвестной — сам ключ (в прогрессе не потеряется). */
export function tipZadachi(zadacha: string): string {
  return tipPrototipa(prototipZadachi(zadacha)) ?? zadacha;
}

export function gruppaTipa(tip: string): Gruppa3 | undefined {
  return GRUPPY3.find((g) => g.tipy.includes(tip));
}

export function gruppaById(id: string): Gruppa3 | undefined {
  return GRUPPY3.find((g) => g.id === id);
}
