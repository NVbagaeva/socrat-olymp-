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

import type { MaterialId } from '@/data/materials';
import type { TaskTypeId } from '@/data/taskTypes';
import { taskTypes } from '@/data/taskTypes';

export type FunctionTypeId =
  | 'linear'
  | 'quadratic'
  | 'rational'
  | 'logarithmic'
  | 'exponential'
  | 'trigonometric';

/** Что лежит в блоке теории. Определяет, чем блок будет наполнен. */
export type TheoryBlockType = 'definition' | 'properties' | 'chart' | 'example' | 'note';

export interface TheoryBlock {
  id: string;
  title: string;
  type: TheoryBlockType;
  /** Содержимое блока. null — материала ещё нет. */
  content: string | null;
  /** ready только тогда, когда content заполнен. */
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
}

/* Заголовки блоков теории заданы автором: четырнадцать пунктов в том
   порядке, в каком они стоят в содержании темы. Это счётчик внутри
   одной подтемы, с прогрессом по разделам кабинета он не связан.

   Тип блока — служебное поле: оно говорит, чем блок будет наполнен,
   и ни на один видимый текст не влияет. Содержимого нет ни у одного,
   поэтому все empty: пустой блок честно показывает «Материал
   готовится». */
const LINEAR_THEORY: TheoryBlock[] = [
  { id: 'what', title: 'Что такое функция?', type: 'definition', content: null, status: 'empty' },
  { id: 'inside', title: 'Как устроена функция', type: 'definition', content: null, status: 'empty' },
  { id: 'kinds', title: 'Какие бывают функции', type: 'properties', content: null, status: 'empty' },
  { id: 'not-function', title: 'Что не является функцией', type: 'note', content: null, status: 'empty' },
  { id: 'special-lines', title: 'Особые прямые', type: 'chart', content: null, status: 'empty' },
  { id: 'for-19', title: 'Это пригодится в №19', type: 'note', content: null, status: 'empty' },
  { id: 'linear', title: 'Линейная функция', type: 'definition', content: null, status: 'empty' },
  { id: 'k', title: 'Коэффициент k', type: 'properties', content: null, status: 'empty' },
  { id: 'b', title: 'Коэффициент b', type: 'properties', content: null, status: 'empty' },
  { id: 'build', title: 'Как построить прямую', type: 'chart', content: null, status: 'empty' },
  { id: 'non-standard', title: 'Функция не в стандартном виде', type: 'example', content: null, status: 'empty' },
  { id: 'from-chart', title: 'Коэффициенты по графику', type: 'chart', content: null, status: 'empty' },
  { id: 'equation', title: 'Составление уравнения прямой', type: 'example', content: null, status: 'empty' },
  { id: 'prep', title: 'Подготовительные задачи', type: 'example', content: null, status: 'empty' },
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
      prep: ['P12-1', 'P12-2', 'P12-3', 'P12-4', 'P12-5'],
      prototypes: ['12.A', '12.B', '12.C', '12.D'],
    },
    status: 'active',
  },
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

/** Первый открытый тип: единственный осмысленный переход по умолчанию. */
export function firstOpenFunctionType(): FunctionType | undefined {
  return functionTypes.find((type) => type.status === 'active');
}
