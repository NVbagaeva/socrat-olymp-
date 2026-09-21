/**
 * Шесть типов функций задания №12 — единственный их список в проекте.
 *
 * Отсюда берут данные и карточки выбора типа, и страницы подтем, и
 * маршруты статического экспорта. Чтобы открыть тип, достаточно
 * поменять здесь status: разметка не правится.
 *
 * Описания и тексты теории пустые: их пишет автор. Пустое поле — это
 * честное «материала ещё нет», а не повод что-то придумать.
 */

import { OPORNYE } from '@/content/opornye';
import { QUADRATIC } from '@/content/quadratic';
import type { SectionAbout, TutorMaterial } from '@/content/sections';
import type { MaterialId } from '@/data/materials';
import type { TaskTypeId } from '@/data/taskTypes';
import { taskTypes } from '@/data/taskTypes';

export type FunctionTypeId =
  'linear' | 'quadratic' | 'rational' | 'logarithmic' | 'exponential' | 'trigonometric';

/** Что лежит в блоке теории. Определяет, чем блок будет наполнен. */
export type TheoryBlockType = 'definition' | 'properties' | 'chart' | 'example' | 'note';

export interface TheoryBlock {
  id: string;
  title: string;
  type: TheoryBlockType;
  /** Содержимое блока обычным текстом. null — материала ещё нет. */
  content: string | null;
  /**
   * Ключ свёрстанного раздела: разметка с картинками, чертежами и
   * плашками в строку не укладывается, поэтому раздел собирается
   * компонентом, а тексты лежат в своём конфиге.
   */
  body?: string;
  /** Кружок у заголовка раздела. Своя нумерация, не из содержания. */
  badge?: string;
  /** ready только тогда, когда заполнен content или body. */
  status: 'ready' | 'empty';
}

/**
 * Банк заданий типа функции — не сами задания, а ссылки на наборы
 * движка graph/. Задания собирает generate() по id набора и seed,
 * поэтому дублировать их здесь нечем и незачем.
 */
export interface FunctionBank {
  /** Идентификаторы наборов подготовки: P12-1 и далее. */
  prep: string[];
  /** Идентификаторы прототипов ФИПИ: 12.A и далее. */
  prototypes: string[];
}

export interface FunctionType {
  id: FunctionTypeId;
  /** Номер на карточке выбора: 01 … 06. */
  no: string;
  /** Полное название: «Линейные функции». Так оно стоит в макете. */
  title: string;
  /** Короткое название для вкладок и фильтров: «Линейные». */
  shortTitle: string;
  /** Формула в записи TeX: набирается KaTeX, текстом не выводится. */
  formula: string;
  /** Описание типа. Пустая строка — текста ещё нет. */
  description: string;
  theory: TheoryBlock[];
  /** Типы заданий, доступные у этого типа функции. */
  taskTypes: TaskTypeId[];
  materials: MaterialId[];
  bank: FunctionBank;
  status: 'active' | 'soon';
  /**
   * Предпросмотр: страницы подтемы собраны и открываются с карточки
   * и из окна выбора типа, но бейдж «Скоро» остаётся. Снимается
   * вместе со сменой status на active, когда подтема готова.
   */
  preview?: boolean;
  /**
   * Шапка подтемы. Задана — H1 общий на задание, «Задание №12.
   * Графики функций», а название подтемы стоит подзаголовком.
   * Не задана — H1 равен названию подтемы, как у линейной.
   */
  head?: { subtitle: string };
  /**
   * Своя вкладка «О задании». Не задана — вкладка раздела, одна на
   * все его подтемы. Плашка-подсказка у подтемы не своя: она одна
   * на раздел и стоит ещё в окне выбора типа функции.
   */
  about?: Omit<SectionAbout, 'hint'>;
  /** Вкладка «Ключевые методы решения». Не задана — вкладки нет. */
  methods?: boolean;
  /**
   * Материалы «Для репетиторов» подтемы. Не заданы — материалы
   * раздела. Пустой список — меню открывается на пустое состояние.
   */
  tutors?: TutorMaterial[];
}

/* Заголовки блоков теории заданы автором: четырнадцать пунктов в том
   порядке, в каком они стоят в содержании темы. Это счётчик внутри
   одной подтемы, с прогрессом по разделам кабинета он не связан.

   Тип блока — служебное поле: оно говорит, чем блок будет наполнен,
   и ни на один видимый текст не влияет. Содержимого нет ни у одного,
   поэтому все empty: пустой блок честно показывает «Материал
   готовится». */
const LINEAR_THEORY: TheoryBlock[] = [
  {
    id: 'what',
    title: 'Что такое функция?',
    type: 'definition',
    content: null,
    body: 'what-is-function',
    badge: '1',
    status: 'ready',
  },
  {
    id: 'inside',
    title: 'Как устроена функция',
    type: 'definition',
    content: null,
    status: 'empty',
  },
  {
    id: 'kinds',
    title: 'Какие бывают функции',
    type: 'properties',
    content: null,
    body: 'kinds-of-functions',
    badge: '3',
    status: 'ready',
  },
  /* Пункт собран из двух прежних: «Что не является функцией» и
     «Особые прямые». Идентификатор оставлен прежний — на него уже
     ведут якоря, и менять его без нужды значит их оборвать. */
  {
    id: 'not-function',
    title: 'Когда график не функция',
    type: 'chart',
    content: null,
    body: 'graph-not-function',
    badge: '4',
    status: 'ready',
  },
  { id: 'for-19', title: 'Это пригодится в №19', type: 'note', content: null, status: 'empty' },
  { id: 'linear', title: 'Линейная функция', type: 'definition', content: null, status: 'empty' },
  { id: 'k', title: 'Коэффициент k', type: 'properties', content: null, status: 'empty' },
  { id: 'b', title: 'Коэффициент b', type: 'properties', content: null, status: 'empty' },
  { id: 'build', title: 'Как построить прямую', type: 'chart', content: null, status: 'empty' },
  {
    id: 'non-standard',
    title: 'Функция не в стандартном виде',
    type: 'example',
    content: null,
    status: 'empty',
  },
  {
    id: 'from-chart',
    title: 'Коэффициенты по графику',
    type: 'chart',
    content: null,
    status: 'empty',
  },
  {
    id: 'equation',
    title: 'Составление уравнения прямой',
    type: 'example',
    content: null,
    status: 'empty',
  },
  { id: 'prep', title: OPORNYE.title, type: 'example', content: null, status: 'empty' },
];

/** Все четыре типа заданий: вопрос не зависит от вида функции. */
const ALL_TASK_TYPES: TaskTypeId[] = taskTypes.map((type) => type.id);

/** Пустой банк: заданий этого типа в движке пока нет. */
const EMPTY_BANK: FunctionBank = { prep: [], prototypes: [] };

export const functionTypes: FunctionType[] = [
  {
    id: 'linear',
    no: '01',
    title: 'Линейные функции',
    shortTitle: 'Линейные',
    formula: 'y = kx + b',
    description: '',
    theory: LINEAR_THEORY,
    taskTypes: ALL_TASK_TYPES,
    materials: ['notebook'],
    bank: {
      prep: ['P12-1', 'P12-2', 'P12-3', 'P12-4', 'P12-5', 'P12-6'],
      prototypes: ['12.A', '12.B', '12.C', '12.D'],
    },
    status: 'active',
  },
  /* Подтема собирается: страницы есть и открываются, бейдж «Скоро»
     снимается последним этапом. Чем она отличается от линейной —
     признаками ниже, тексты к ним в content/quadratic.ts. */
  {
    id: 'quadratic',
    no: '02',
    title: 'Квадратичные функции',
    shortTitle: 'Квадратичные',
    formula: 'y = ax^2 + bx + c',
    description: '',
    theory: [],
    taskTypes: ALL_TASK_TYPES,
    materials: [],
    bank: EMPTY_BANK,
    status: 'soon',
    preview: true,
    head: QUADRATIC.head,
    about: QUADRATIC.about,
    methods: true,
    tutors: QUADRATIC.tutors,
  },
  {
    id: 'rational',
    no: '03',
    title: 'Дробно-рациональные функции',
    shortTitle: 'Дробно-рациональные',
    formula: 'y = \\dfrac{ax + b}{cx + d}',
    description: '',
    theory: [],
    taskTypes: ALL_TASK_TYPES,
    materials: [],
    bank: EMPTY_BANK,
    status: 'soon',
  },
  {
    id: 'logarithmic',
    no: '04',
    title: 'Логарифмические функции',
    shortTitle: 'Логарифмические',
    formula: 'y = \\log_a x',
    description: '',
    theory: [],
    taskTypes: ALL_TASK_TYPES,
    materials: [],
    bank: EMPTY_BANK,
    status: 'soon',
  },
  {
    id: 'exponential',
    no: '05',
    title: 'Показательные функции',
    shortTitle: 'Показательные',
    formula: 'y = a^x',
    description: '',
    theory: [],
    taskTypes: ALL_TASK_TYPES,
    materials: [],
    bank: EMPTY_BANK,
    status: 'soon',
  },
  {
    id: 'trigonometric',
    no: '06',
    title: 'Тригонометрические функции',
    shortTitle: 'Тригонометрические',
    formula: 'y = \\sin x',
    description: '',
    theory: [],
    taskTypes: ALL_TASK_TYPES,
    materials: [],
    bank: EMPTY_BANK,
    status: 'soon',
  },
];

export function findFunctionType(id: string): FunctionType | undefined {
  return functionTypes.find((type) => type.id === id);
}

/**
 * Страницы подтемы собраны: она открыта или стоит в предпросмотре.
 * Только у таких подтем есть вложенные адреса и ссылки с карточек.
 */
export function subtopicBuilt(type: FunctionType): boolean {
  return type.status === 'active' || type.preview === true;
}

/** Первый открытый тип: единственный осмысленный переход по умолчанию. */
export function firstOpenFunctionType(): FunctionType | undefined {
  return functionTypes.find((type) => type.status === 'active');
}
