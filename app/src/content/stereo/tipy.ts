/**
 * Типы задач открытого банка — карточки вкладки «О задании».
 * Раскладка прототипов — docs/stereometry-plan.md, п. 7.1 (№3) и 7.2 (№15);
 * сверка с банком ФИПИ — п. 2.4.
 *
 * На этапе каркаса карточка ведёт в главу теории; разобранный пример
 * с интерактивным чертежом подключается на этапе 2.
 */

export interface TipStereo {
  id: string;
  title: string;
  /** Глава теории, где тип разобран (id из content/stereo/glavy.ts). */
  glava: string;
  /** Номера прототипов банка №3 (P03-NN). */
  prototipy?: readonly number[];
}

function ot(a: number, b: number): number[] {
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}

export const TIPY_3: readonly TipStereo[] = [
  {
    id: 'diagonali',
    title: 'Диагонали и «Пифагор в пространстве»',
    glava: 'kub',
    prototipy: [1, 2],
  },
  {
    id: 'secheniya',
    title: 'Сечения прямоугольного параллелепипеда',
    glava: 'kub',
    prototipy: [3, 4],
  },
  {
    id: 'ugly',
    title: 'Углы между прямыми в кубе и призме',
    glava: 'pryamye',
    prototipy: [...ot(6, 10), 22, 23, 35],
  },
  {
    id: 'kubiki',
    title: 'Многогранник «из кубиков»: площадь и объём',
    glava: 'kubiki',
    prototipy: [5, 11],
  },
  {
    id: 'chast',
    title: 'Часть параллелепипеда или призмы',
    glava: 'podobie',
    prototipy: [...ot(12, 16), ...ot(24, 27), 31, 32, 36, 37],
  },
  {
    id: 'piramida-vnutri',
    title: 'Пирамида внутри призмы или параллелепипеда',
    glava: 'podobie',
    prototipy: [...ot(17, 19), ...ot(28, 30), 33, 34, ...ot(38, 40)],
  },
  { id: 'obem-prizmy', title: 'Объём призмы', glava: 'prizma', prototipy: [20, 21] },
  {
    id: 'piramida',
    title: 'Пирамида: высота, ребро, апофема',
    glava: 'piramida',
    prototipy: [...ot(41, 44), 49, 51],
  },
  {
    id: 'obem-piramidy',
    title: 'Объём пирамиды и отсечённые пирамиды',
    glava: 'podobie',
    prototipy: [...ot(45, 48), 50],
  },
  {
    id: 'konus',
    title: 'Конус: элементы и осевое сечение',
    glava: 'vrashcheniya',
    prototipy: ot(52, 57),
  },
  {
    id: 'vo-skolko-raz',
    title: 'Изменили размеры — во сколько раз',
    glava: 'podobie',
    prototipy: [...ot(58, 60), 62, 72, 73],
  },
  {
    id: 'cilindr-shar',
    title: 'Цилиндр и шар: площади и объёмы',
    glava: 'vrashcheniya',
    prototipy: [63, 64, ...ot(69, 71), 92],
  },
  {
    id: 'zhidkost',
    title: 'Жидкость в сосудах',
    glava: 'zhidkost',
    prototipy: [61, ...ot(65, 68)],
  },
  {
    id: 'cilindr-komb',
    title: 'Вписанный и описанный цилиндр',
    glava: 'kombinacii',
    prototipy: ot(74, 80),
  },
  {
    id: 'sfera-komb',
    title: 'Вписанная и описанная сфера',
    glava: 'kombinacii',
    prototipy: ot(81, 91),
  },
];

/** Типы №15 — по частоте в открытом банке ФИПИ. */
export const TIPY_15: readonly TipStereo[] = [
  { id: 'ploshchad-secheniya', title: 'Площадь сечения', glava: 'ploshchadi' },
  { id: 'obem', title: 'Объём многогранника или его части', glava: 'secheniya' },
  { id: 'ugol-ploskostey', title: 'Угол между плоскостями', glava: 'ugly' },
  { id: 'do-ploskosti', title: 'Расстояние от точки до плоскости', glava: 'rasstoyaniya' },
  { id: 'otnoshenie', title: 'В каком отношении плоскость делит отрезок', glava: 'secheniya' },
  { id: 'pryamaya-ploskost', title: 'Угол между прямой и плоскостью', glava: 'ugly' },
  { id: 'do-pryamoy', title: 'Расстояние от точки до прямой', glava: 'rasstoyaniya' },
  { id: 'dlina', title: 'Длина отрезка и периметр сечения', glava: 'secheniya' },
  { id: 'cilindr', title: 'Цилиндр в задаче №15', glava: 'secheniya' },
  { id: 'ugol-pryamyh', title: 'Угол между прямыми', glava: 'ugly' },
];

export const O_ZADANII_STEREO = {
  '3': {
    zagolovok: 'Что проверяет задание',
    text: [
      'Задание №3 — первая часть экзамена, ответ — число. Нужно найти длину, площадь или объём многогранника или тела вращения.',
      'Почти все задачи открытого банка решаются одной-двумя формулами — если увидеть на чертеже нужный треугольник, подобие или «связующий» отрезок. Этому и учит раздел.',
    ],
  },
  '15': {
    zagolovok: 'Как устроена задача',
    text: [
      'Задание №15 — вторая часть, развёрнутый ответ, до 3 баллов. В условии многогранник (чаще всего пирамида) и плоскость или прямые.',
      'Пункт а — доказательство: что сечение — прямоугольник, что прямые перпендикулярны, что плоскость проходит через точку. Пункт б — вычисление: площадь сечения, объём, угол или расстояние. Пункт а обычно готовит решение пункта б.',
    ],
  },
  tipy: 'Типы задач открытого банка',
  tipyLead:
    'Карточка ведёт в главу теории, где тип разобран. Разобранный пример с интерактивным чертежом откроется прямо здесь — на следующем этапе.',
  prototipov: ['прототип', 'прототипа', 'прототипов'] as const,
  kGlave: 'Глава теории',
  umet: 'Что нужно уметь',
} as const;
