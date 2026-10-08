/**
 * Тексты онбординга: окно «Впервые здесь?», кнопка «?», туры и страница
 * «Как пользоваться сайтом». В разметке строк нет — правка только здесь.
 *
 * Правило: только то, что на сайте уже работает. Сверка макетов с
 * сайтом — в описании PR онбординга. К репетитору — на «вы», к ученику —
 * на «ты».
 */

import { tasksPage } from '@/content/tasks';

/** Адрес страницы «Как пользоваться сайтом». */
export const HOWTO_HREF = '/kak-polzovatsya/';

/** Вкладки страницы: адрес вкладки — ?dlya=… */
export type HowtoTab = 'uchenik' | 'repetitor';

export function howtoHref(tab: HowtoTab): string {
  return `${HOWTO_HREF}?dlya=${tab}`;
}

/** Генератор, который открывают кнопки «Создать вариант» и «Открыть генератор». */
export const GENERATOR_HREF = '/zadaniya/11/generator/';

/* ── Туры ──────────────────────────────────────────────────────── */

export interface TourStep {
  id: string;
  /** Короткое имя шага для панели «Как проходит тур?». */
  short: string;
  /** Страница шага; тур сам переходит на неё. */
  href: string;
  /**
   * Что подсветить: CSS-селекторы, рамка охватывает их все. Пусто —
   * подсказка по центру экрана без подсветки.
   */
  target: readonly string[];
  title: string;
  text: string;
}

export interface TourFinal {
  short: string;
  title: string;
  lead: string;
  skillsTitle: string;
  skills: readonly string[];
  again: string;
  go: { label: string; href: string };
}

export interface Tour {
  id: TourId;
  /** Подпись в меню «?». */
  label: string;
  steps: readonly TourStep[];
  final: TourFinal;
}

export type TourId = 'repetitor';

/**
 * Тур для репетитора по заданию №11: в нём все вкладки, полный раздел
 * «Для репетиторов» и самый подробный генератор.
 */
export const TOUR_REPETITOR: Tour = {
  id: 'repetitor',
  label: 'Тур для репетитора',
  steps: [
    {
      id: 'bank',
      short: 'Банк заданий',
      href: tasksPage.href,
      target: ['.task-card[href="/zadaniya/11/"]'],
      title: 'Банк заданий',
      text:
        'Все задания ЕГЭ в одном месте. У каждого готового задания один маршрут: ' +
        'теория → опорные задачи → тренажёр → генератор. Покажем на задании №11 «Текстовые задачи».',
    },
    {
      id: 'trenazher',
      short: 'Опорные задачи и тренажёр',
      href: '/zadaniya/11/trenazher/',
      target: [
        '.topic-tabs a[href$="/zadaniya/11/opornye-zadachi/"]',
        '.topic-tabs a[href$="/zadaniya/11/trenazher/"]',
      ],
      title: 'Опорные задачи и тренажёр',
      text:
        'Ученик тренируется сам: подсказки-вопросы ведут к решению. ' +
        'Удобно советовать тренажёр между занятиями.',
    },
    {
      id: 'generator',
      short: 'Генератор',
      href: GENERATOR_HREF,
      target: ['.z11-gen__side'],
      title: 'Генератор вариантов',
      text:
        'Выберите, откуда брать задачи, режим и состав варианта. ' +
        'Можно собрать до 8 вариантов с разными числами.',
    },
    {
      id: 'listy',
      short: 'Листы с ответами',
      href: GENERATOR_HREF,
      target: ['.z11-gen__toolbar'],
      title: 'Лист ученика и лист учителя',
      text:
        'После «Сгенерировать» здесь появятся лист ученика и лист учителя ' +
        'с ответами и решениями. Их можно скачать в PDF и распечатать.',
    },
    {
      id: 'repetitory',
      short: 'Для репетиторов',
      href: '/zadaniya/11/dlya-repetitorov/',
      /* Первый ряд маршрутов: весь список выше экрана, и подсказке
         рядом с ним негде встать. */
      target: ['.z11-rep__marshruty > :nth-child(1)', '.z11-rep__marshruty > :nth-child(3)'],
      title: 'Для репетиторов',
      text:
        'Маршруты уроков, методические заметки и быстрый лист для занятия. ' +
        'В других заданиях здесь печатные материалы — там, где они уже готовы.',
    },
  ],
  final: {
    short: 'Готово',
    title: 'Вы прошли тур для репетитора',
    lead: 'Теперь вы знаете, где что лежит. Вернуться к туру можно кнопкой «?» в углу экрана.',
    skillsTitle: 'Что вы теперь умеете',
    skills: [
      'Находить задания и теорию',
      'Советовать ученикам тренажёр для самостоятельной работы',
      'Собирать варианты в генераторе',
      'Печатать листы ученика и листы с ответами',
      'Брать готовые маршруты уроков (в задании №11)',
    ],
    again: 'Пройти тур заново',
    go: { label: 'Перейти к материалам', href: tasksPage.href },
  },
};

export const TOURS: Record<TourId, Tour> = {
  repetitor: TOUR_REPETITOR,
};

/** Подписи общих элементов тура. */
export const TOUR_UI = {
  step: (n: number, total: number) => `Шаг ${n} из ${total}`,
  back: 'Назад',
  next: 'Дальше',
  done: 'Понятно',
  close: 'Закрыть тур',
  panelTitle: 'Как проходит тур?',
  panelNote: 'Можно закрыть в любой момент и продолжить с того же шага.',
  dots: 'Шаги тура',
} as const;

/* ── Окно «Впервые здесь?» ─────────────────────────────────────── */

export const WELCOME = {
  eyebrow: 'Добро пожаловать',
  title: 'Впервые здесь?',
  lead: 'Покажем, как устроена подготовка, и поможем быстро разобраться.',
  student: {
    title: 'Я ученик',
    text: 'Покажем, с чего начать и как заниматься по шагам.',
  },
  tutor: {
    title: 'Я репетитор',
    text: 'Покажем, как использовать сайт на занятиях и собирать варианты.',
  },
  later: 'Не сейчас',
  close: 'Закрыть',
} as const;

/* ── Кнопка «?» ────────────────────────────────────────────────── */

export const HELP = {
  button: 'Помощь',
  title: 'Помощь',
  tutorTour: 'Тур для репетитора',
  continueTour: (n: number, total: number) => `Продолжить тур · шаг ${n} из ${total}`,
  restartTour: 'Начать тур заново',
  studentTour: 'Тур для ученика',
  soon: 'Скоро',
  howto: 'Как пользоваться сайтом',
} as const;

/* ── Пилюля на первом экране главной ───────────────────────────── */

export const HOWTO_PILL = {
  label: 'Как пользоваться сайтом',
  meta: '2 минуты',
} as const;
