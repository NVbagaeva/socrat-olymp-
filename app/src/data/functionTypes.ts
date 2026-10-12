/**
 * Семь типов функций задания №12 — единственный их список в проекте.
 *
 * Отсюда берут данные и карточки выбора типа, и страницы подтем, и
 * маршруты статического экспорта. Чтобы открыть тип, достаточно
 * поменять здесь status: разметка не правится.
 *
 * Описания и тексты теории пустые: их пишет автор. Пустое поле — это
 * честное «материала ещё нет», а не повод что-то придумать.
 */

import { QUADRATIC } from '@/content/quadratic';
import { QUADRATIC_THEORY } from '@/content/theoryQuadratic';
import { RATIONAL } from '@/content/rational';
import { RATIONAL_THEORY } from '@/content/theoryRational';
import { IRRATIONAL } from '@/content/irrational';
import { IRRATIONAL_THEORY } from '@/content/theoryIrrational';
import { LINEAR_RICH_THEORY } from '@/content/theoryLinearRich';
import type { SectionAbout, TutorMaterial } from '@/content/sections';
import type { MaterialId } from '@/data/materials';
import type { TaskTypeId } from '@/data/taskTypes';
import { taskTypes } from '@/data/taskTypes';

export type FunctionTypeId =
  | 'linear'
  | 'quadratic'
  | 'rational'
  | 'irrational'
  | 'logarithmic'
  | 'exponential'
  | 'trigonometric';

/** Что лежит в блоке теории. Определяет, чем блок будет наполнен. */
export type TheoryBlockType = 'definition' | 'properties' | 'chart' | 'example' | 'note';

export interface TheoryBlock {
  id: string;
  /** Заголовок; формулы в нём — $…$. */
  title: string;
  /**
   * Тот же заголовок, набранный KaTeX. Ставит страница на сервере
   * (FunctionTopicPage): лента вкладок — клиентский экран, и тянуть
   * в него KaTeX ради заголовков незачем.
   */
  titleHtml?: string;
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
  /**
   * Название раздела — название ФУНКЦИИ: «Квадратичная функция». Единственное
   * место, откуда его берут плашка, меню, карточки, заголовки страниц и
   * листов, title страниц и крошки: строк с названием в компонентах нет.
   */
  title: string;
  /**
   * Название ГРАФИКА, подпись под названием: «График — парабола». Так же
   * единственное место; проверяет scripts/check-razdely-names.mjs.
   */
  graphName: string;
  /** Иконка раздела: имя файлов в public/images/razdely/12. */
  icon: string;
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
  head?: boolean;
  /**
   * Своя вкладка «О задании». Не задана — вкладка раздела, одна на
   * все его подтемы. Плашка-подсказка у подтемы не своя: она одна
   * на раздел и стоит ещё в окне выбора типа функции.
   */
  about?: Omit<SectionAbout, 'hint' | 'title'>;
  /** Вкладка «Ключевые методы решения». Не задана — вкладки нет. */
  methods?: boolean;
  /**
   * Подтема заведена после того, как вкладку «Подготовительные
   * задачи» переименовали в «Опорные задачи». Прежнего адреса
   * (content/opornye.ts, staryyTail) у неё никогда не было, и
   * страницы-редиректы по нему не собираются: уводить с адреса,
   * которого не существовало, некого. Не задано — подтема жила до
   * переименования, и редиректы ей нужны.
   */
  bezStarogoAdresa?: boolean;
  /**
   * Тренажёр подтемы принимает задачи с ответом выбором варианта.
   * Не задано — берутся только задачи с числовым ответом, как было
   * у линейной подтемы и у заданий №4 и №5.
   */
  choiceAnswers?: boolean;
  /**
   * Материалы «Для репетиторов» подтемы. Не заданы — материалы
   * раздела. Пустой список — меню открывается на пустое состояние.
   */
  tutors?: TutorMaterial[];
}

/* Теория линейной функции — восемь пунктов «Содержания» и итоги,
   свёрстанные блоками: тексты в content/theoryLinearRich.ts. Прежние
   общие разделы («Что такое функция?», «Какие бывают функции», «Когда
   график не функция») из содержания убраны, их разметка осталась в
   components/tasks/theory. */
const LINEAR_THEORY: TheoryBlock[] = LINEAR_RICH_THEORY;

/** Все четыре типа заданий: вопрос не зависит от вида функции. */
const ALL_TASK_TYPES: TaskTypeId[] = taskTypes.map((type) => type.id);

/** Пустой банк: заданий этого типа в движке пока нет. */
const EMPTY_BANK: FunctionBank = { prep: [], prototypes: [] };

export const functionTypes: FunctionType[] = [
  {
    id: 'linear',
    no: '01',
    title: 'Линейная функция',
    graphName: 'График — прямая',
    icon: 'linear',
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
  /* Подтема открыта. Чем она отличается от линейной — признаками
     ниже, тексты к ним в content/quadratic.ts. */
  {
    id: 'quadratic',
    no: '02',
    title: 'Квадратичная функция',
    graphName: 'График — парабола',
    icon: 'quadratic',
    formula: 'y = ax^2 + bx + c',
    description: '',
    theory: QUADRATIC_THEORY,
    taskTypes: ALL_TASK_TYPES,
    materials: [],
    bank: {
      prep: [
        'P12Q-1',
        'P12Q-2',
        'P12Q-3',
        'P12Q-4',
        'P12Q-5',
        'P12Q-6',
        'P12Q-7',
        'P12Q-8',
        'P12Q-9',
      ],
      prototypes: ['12Q.A', '12Q.B', '12Q.C', '12Q.D', '12Q.E', '12Q.F', '12Q.G', '12Q.H', '12Q.I'],
    },
    status: 'active',
    head: QUADRATIC.head,
    about: QUADRATIC.about,
    methods: true,
    bezStarogoAdresa: true,
    choiceAnswers: true,
    tutors: QUADRATIC.tutors,
  },
  /* Подтема «Гипербола» открыта на месте дробно-рациональных функций:
     y = k/x, её сдвиги и дробь (kx + a)/(x + b). Признаки — как у
     квадратичной, тексты в content/rational.ts. */
  {
    id: 'rational',
    no: '03',
    title: 'Дробно-линейная функция',
    graphName: 'График — гипербола',
    icon: 'rational',
    formula: 'y = \\dfrac{k}{x + a} + b',
    description: '',
    theory: RATIONAL_THEORY,
    taskTypes: ALL_TASK_TYPES,
    materials: [],
    bank: {
      prep: [
        'P12R-1',
        'P12R-2',
        'P12R-3',
        'P12R-4',
        'P12R-5',
        'P12R-6',
        'P12R-7',
        'P12R-8',
        'P12R-9',
        'P12R-10',
        'P12R-11',
      ],
      prototypes: [
        '12R.A',
        '12R.B',
        '12R.C',
        '12R.D',
        '12R.E',
        '12R.F',
        '12R.G',
        '12R.H',
        '12R.I',
        '12R.J',
      ],
    },
    status: 'active',
    head: RATIONAL.head,
    about: RATIONAL.about,
    methods: true,
    bezStarogoAdresa: true,
    tutors: RATIONAL.tutors,
  },
  /* Подтема «Иррациональная функция» (график — ветвь параболы): f(x) = k√x и
     f(x) = k√(x − x₀) + y₀, иногда вместе с прямой. Признаки — как у
     гиперболы, тексты в content/irrational.ts; вкладки «Ключевые
     методы решения» у подтемы нет. */
  {
    id: 'irrational',
    no: '04',
    title: 'Иррациональная функция',
    graphName: 'График — ветвь параболы',
    icon: 'irrational',
    formula: 'y = k\\sqrt{x}',
    description: '',
    theory: IRRATIONAL_THEORY,
    taskTypes: ALL_TASK_TYPES,
    materials: [],
    bank: {
      prep: ['P12S-1', 'P12S-2', 'P12S-3', 'P12S-4', 'P12S-5'],
      prototypes: ['12S.A', '12S.B', '12S.C', '12S.D'],
    },
    status: 'active',
    head: IRRATIONAL.head,
    about: IRRATIONAL.about,
    bezStarogoAdresa: true,
    tutors: IRRATIONAL.tutors,
  },
  {
    id: 'exponential',
    no: '05',
    title: 'Показательная функция',
    graphName: 'График — экспонента',
    icon: 'exponential',
    formula: 'y = a^x',
    description: '',
    theory: [],
    taskTypes: ALL_TASK_TYPES,
    materials: [],
    bank: EMPTY_BANK,
    status: 'soon',
  },
  {
    id: 'logarithmic',
    no: '06',
    title: 'Логарифмическая функция',
    graphName: 'График — логарифмическая кривая',
    icon: 'logarithmic',
    formula: 'y = \\log_a x',
    description: '',
    theory: [],
    taskTypes: ALL_TASK_TYPES,
    materials: [],
    bank: EMPTY_BANK,
    status: 'soon',
  },
  {
    id: 'trigonometric',
    no: '07',
    title: 'Тригонометрические функции',
    graphName: 'Графики — синусоида, косинусоида, тангенсоида',
    icon: 'trig',
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
