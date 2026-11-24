/**
 * Тексты страницы «Как пользоваться сайтом». Отдельно от
 * content/onboarding.ts: тот грузится на каждой странице (кнопка «?»,
 * тур), а эти тексты нужны только самой странице.
 *
 * Ответы про вход, бесплатное и платное собираются из тех же констант,
 * что страница тарифов и вход (lib/tarify/config.ts, lib/auth/config.ts):
 * поменяется тариф — поменяется и ответ здесь.
 */

import { GENERATOR_HREF } from '@/content/onboarding';
import { OPORNYE } from '@/content/opornye';
import { tasksPage } from '@/content/tasks';
import { TUTORS_LABEL } from '@/content/vkladki';
import { AUTH_ENABLED } from '@/lib/auth/config';
import { href, razdelBase } from '@/lib/paths';
import {
  BESPLATNO,
  KLASS_MAKS,
  PAYMENTS_ENABLED,
  PLATNYE,
  TARIFY_HREF,
  TARIFY_TEXT,
  nomeraGeneratorov,
  plashki,
} from '@/lib/tarify/config';
import { nomerRazdela, razdelNomera } from '@/content/struktura';

/** Номера заданий на снимках — из struktura.js, не цифрой. */
const N_VEROYATNOST = nomerRazdela('veroyatnost');
const N_PLANIMETRIYA = nomerRazdela('planimetriya');

/* ── Картинки и снимки ─────────────────────────────────────────── */

/**
 * Стеклянные картинки страницы (images/kak-polzovatsya/, журнал —
 * docs/plans/kak-polzovatsya-kartinki.md). Размеры файлов: шапка —
 * 560/280, карточки и «start» — 360/180, значки шагов — 192/96.
 */
export type HowtoKartinka =
  | 'shapka'
  | 'bank'
  | 'teoriya'
  | 'opornye'
  | 'trenazher'
  | 'progress'
  | 'generator'
  | 'listy'
  | 'uroki'
  | 'pechat'
  | 'start';

/** Снимок настоящей страницы сайта (images/kak-polzovatsya/shagi/). */
export type HowtoSnimok =
  | 'bank'
  | 'teoriya'
  | 'opornye'
  | 'generator'
  | 'list-uchitelya'
  | 'list-uchenika'
  | 'trenazher'
  | 'uroki'
  /* Листы А4 генератора — миниатюры мини-демо. */
  | 'a4-uchenika'
  | 'a4-uchitelya';

/** Размер миниатюры листа А4 (CSS-пиксели, файл — вдвое больше). */
export const A4_RAZMER = { width: 420, height: 594 } as const;

/** Ширина и высота снимков (CSS-пиксели, файл — вдвое больше). */
export const SNIMOK_RAZMER = { width: 1024, height: 640 } as const;

/** Адреса: из общих констант, не строкой. */
const nomer1 = razdelNomera(1).kod;
const nomer4 = razdelNomera(4).kod;
export const HOWTO_HREFS = {
  bank: tasksPage.href,
  teoriya: href(razdelBase(nomer1), 'teoriya'),
  opornye: href(razdelBase(nomer1), OPORNYE.tail),
  trenazher: href(razdelBase(nomer4), 'trenazher'),
  generator: GENERATOR_HREF,
} as const;

/* ── Страница «Как пользоваться сайтом» ────────────────────────── */

export interface HowtoStep {
  title: string;
  text: string;
  /** Значок шага. */
  ikonka: HowtoKartinka;
  /** Снимок страницы справа от пути и строка под ним. */
  snimok: HowtoSnimok;
  snimokAlt: string;
  poyasnenie: string;
  /** Куда ведёт «Открыть →». */
  href: string;
}

export interface HowtoFeature {
  title: string;
  text: string;
  /** Стеклянная картинка карточки. */
  kartinka: HowtoKartinka;
  kartinkaAlt: string;
  /** Снимок настоящей страницы — по кнопке «Как это выглядит на сайте». */
  snimok?: { id: HowtoSnimok; alt: string };
  /** Рядом с карточкой — мини-демо генератора. */
  demo?: 'generator';
}

export interface HowtoFaq {
  q: string;
  a: string;
  /** Ссылка под ответом. */
  link?: { label: string; href: string };
}

export interface HowtoTabContent {
  tab: string;
  video: { title: string; text: string };
  stepsTitle: string;
  steps: readonly HowtoStep[];
  featuresTitle: string;
  features: readonly HowtoFeature[];
  faqTitle: string;
  faq: readonly HowtoFaq[];
  cta: {
    title: string;
    text: string;
    primary: { label: string; href: string };
    /** Подпись под главной кнопкой. */
    note?: string;
    tour?: string;
  };
  /** Подсказка над путём: «Нажмите на шаг». */
  stepsHint: string;
  /** Заголовок мини-задачи с подсказкой. */
  probaTitle: string;
}

/* ── Частые вопросы: из констант входа и тарифов ───────────────── */

const besplatnoVhodit = plashki('uchenik')[0].vhodit;
const besplatnoNet = plashki('uchenik')[0].net;

function nizhniy(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/** Что бесплатно и что в тарифах — как на странице тарифов. */
const besplatnoTekst =
  `Бесплатно: ${besplatnoVhodit.map(nizhniy).join('; ')}. ` +
  `В платных тарифах: ${besplatnoNet.map(nizhniy).join('; ')} и без ограничений — ` +
  'подробно на странице тарифов.' +
  (PAYMENTS_ENABLED ? '' : ` ${TARIFY_TEXT.skoroSnoska}`);

const registraciya = AUTH_ENABLED
  ? 'Нет: банк заданий, теория и тренажёр открываются без входа. Аккаунт нужен, чтобы прогресс ' +
    'сохранялся на сервере, а для учителя — для классов и домашних заданий.'
  : 'Нет: входа на сайте пока нет, всё открытое работает без аккаунта.';

/** Генераторы, открытые без тарифа: «№1, 2, 9, 10». */
const generatory =
  `Без тарифа открыты генераторы ${nomeraGeneratorov()}: в каждом ` +
  `${BESPLATNO.generatorProbnyh === 1 ? 'одна пробная генерация' : `${BESPLATNO.generatorProbnyh} пробные генерации`}. ` +
  `Генераторы остальных заданий — в пробном доступе и тарифе «${PLATNYE.repetitor.nazvanie}».`;

const progressUchenikov = AUTH_ENABLED
  ? `Да, в кабинете учителя: классы до ${KLASS_MAKS} учеников, домашние задания и таблица ` +
    `результатов — в тарифе «${PLATNYE.repetitor.nazvanie}». Без входа прогресс ученика ` +
    'хранится только на его устройстве.'
  : 'Пока нет: входа на сайте ещё нет, и прогресс сохраняется только на устройстве ученика. ' +
    `Классы до ${KLASS_MAKS} учеников, домашние задания и таблица результатов появятся ` +
    `вместе со входом — в тарифе «${PLATNYE.repetitor.nazvanie}».`;

export const HOWTO = {
  meta: {
    title: 'Как пользоваться сайтом — Будет на ЕГЭ',
    description:
      'Короткое руководство: как устроен банк заданий, тренажёр и генератор вариантов и как пользоваться ими на занятиях и дома.',
  },
  crumbs: 'Как пользоваться',
  title: 'Как пользоваться сайтом',
  lead: 'Короткое руководство: как устроен сайт и как пользоваться им на занятиях и дома.',
  tabsLabel: 'Для кого инструкция',
  videoSoon: 'Видеоинструкция скоро',
  /** Заставка первого визита ещё раз — с любой вкладки. */
  intro: 'Посмотреть приветствие',

  /** Шапка: подсказка на картинке и её описание. */
  shapka: {
    alt: 'Стеклянный компас на открытой книге и указатель с тремя стрелками',
    podskazka: 'Нажми',
  },
  /** Блок шагов. */
  put: {
    nazad: '← Назад',
    dalshe: 'Дальше →',
    shag: (n: number, iz: number) => `Шаг ${n} из ${iz}`,
    otkryt: 'Открыть →',
  },
  /** Кнопка карточки и окно со снимком. */
  snimok: {
    knopka: 'Как это выглядит на сайте',
    zakryt: 'Закрыть',
  },
  video: {
    title: 'Видео о сайте',
    label: 'Видео о сайте Будет на ЕГЭ',
    smotret: (sek: number) => `Смотреть — ${sek} секунд`,
    glavyLabel: 'Главы видео',
    /** Начала глав — по кадрам ролика (ffmpeg, смена надписи в кадре). */
    glavy: [
      { label: 'Начало', t: 0 },
      { label: 'Чертежи', t: 12.5 },
      { label: 'Подсказки', t: 21 },
      { label: 'Листы', t: 26.2 },
      { label: 'Как начать', t: 32.1 },
    ],
    /** Длительность ролика, секунд (ffprobe: 36.0). */
    sekund: 36,
  },
  /** Мини-задача «Попробуй подсказку». */
  proba: {
    uslovieHtml:
      'В коробке 4 синих и 6 красных шаров. Наугад достают один шар. Найдите вероятность того, что он синий.',
    otvet: 'Ответ',
    placeholder: 'Например, 0,5',
    proverit: 'Проверить',
    podskazka: 'Подсказка',
    neverno: 'Пока не то. Открой подсказку — она подведёт к ответу шаг за шагом.',
    verno: 'Готово! Так устроен весь тренажёр: застрял — открой подсказку',
    trenazher: `Открыть тренажёр №${N_VEROYATNOST} →`,
    zanovo: 'Решить заново',
    voprosy: {
      title: 'Подсказка — вопросами',
      verno: 'Верно.',
      podumayte: 'Подумай ещё.',
      varianty: 'Варианты ответа',
      gotovo: 'Теперь посчитай и впиши ответ.',
    },
  },
  /** Мини-демо генератора во вкладке «Учителю». */
  demo: {
    title: 'Генератор за 10 секунд',
    zadaniya: 'Задания',
    variantov: 'Вариантов',
    menshe: 'Меньше вариантов',
    bolshe: 'Больше вариантов',
    list: 'Лист',
    uchenika: 'Лист ученика',
    uchitelya: 'Лист учителя',
    sobrat: 'Собрать по-настоящему →',
    primechanie: 'Это пример. Настоящие варианты — в генераторе.',
    variant: (n: number) => `Вариант ${n}`,
    /** Номера ЕГЭ на чипах. */
    nomera: [1, 2, 4, 9, 10, 11] as const,
  },
  start: { alt: 'Стеклянный бумажный самолётик взлетает' },

  repetitor: {
    tab: 'Учителю',
    video: {
      title: 'Видеоинструкция для учителей',
      text: 'Пока её нет, пройдите тур по сайту — он займёт пару минут.',
    },
    stepsTitle: 'Как работать с сайтом',
    stepsHint: 'Нажмите на шаг',
    probaTitle: 'Так ученик решает в тренажёре',
    steps: [
      {
        title: 'Выберите задание в банке',
        text: 'Готовые задания открыты, у каждого — теория, опорные задачи и тренажёр.',
        ikonka: 'bank',
        snimok: 'bank',
        snimokAlt: 'Банк заданий: карточки заданий ЕГЭ',
        poyasnenie: 'Банк заданий: все номера ЕГЭ и сколько в них задач.',
        href: HOWTO_HREFS.bank,
      },
      {
        title: 'Разберите теорию и опорные задачи',
        text: 'Опорные задачи показывают главные приёмы — с них удобно начинать занятие.',
        ikonka: 'teoriya',
        snimok: 'teoriya',
        snimokAlt: `Вкладка «Теория» задания №${N_PLANIMETRIYA}`,
        poyasnenie: `Теория задания №${N_PLANIMETRIYA}: всё нужное — на одной вкладке.`,
        href: HOWTO_HREFS.teoriya,
      },
      {
        title: 'Соберите вариант в генераторе',
        text: 'Нужные типы задач и несколько вариантов с разными числами.',
        ikonka: 'generator',
        snimok: 'generator',
        snimokAlt: `Генератор вариантов задания №${nomerRazdela('tekstovye-zadachi')}`,
        poyasnenie: `Генератор задания №${nomerRazdela('tekstovye-zadachi')}: типы задач и число вариантов.`,
        href: HOWTO_HREFS.generator,
      },
      {
        title: 'Распечатайте листы',
        text: 'Лист ученика и лист учителя с ответами и решениями — в PDF.',
        ikonka: 'pechat',
        snimok: 'list-uchitelya',
        snimokAlt: 'Лист учителя с ответами и решениями',
        poyasnenie: 'Лист учителя: ответы и решения для проверки.',
        href: HOWTO_HREFS.generator,
      },
      {
        title: 'Советуйте тренажёр между занятиями',
        text: 'Ученик тренируется сам: подсказки-вопросы ведут к решению.',
        ikonka: 'trenazher',
        snimok: 'trenazher',
        snimokAlt: `Тренажёр задания №${N_VEROYATNOST} с открытой подсказкой`,
        poyasnenie: `Тренажёр №${N_VEROYATNOST}: подсказка задаёт вопрос к следующему шагу.`,
        href: HOWTO_HREFS.trenazher,
      },
    ],
    featuresTitle: 'Возможности для учителей',
    features: [
      {
        title: 'Генератор вариантов',
        text:
          `Нужные типы задач и сложность. В задании №${nomerRazdela('tekstovye-zadachi')} — готовые составы: вариант ЕГЭ, ` +
          'урок по разделу, готовый урок; до 8 вариантов с разными числами.',
        kartinka: 'generator',
        kartinkaAlt: 'Две стеклянные шестерёнки и листы бумаги',
        snimok: {
          id: 'generator',
          alt: `Генератор задания №${nomerRazdela('tekstovye-zadachi')}: готовые составы и настройки`,
        },
        demo: 'generator',
      },
      {
        title: 'Листы с ответами и решениями',
        text: 'Лист ученика и лист учителя: ответы и пошаговые решения для проверки.',
        kartinka: 'listy',
        kartinkaAlt: 'Два стеклянных листа с галочкой',
        snimok: {
          id: 'list-uchitelya',
          alt: `Лист учителя задания №${nomerRazdela('tekstovye-zadachi')} с ответами и решением`,
        },
      },
      {
        title: 'Готовые уроки и методические заметки',
        text:
          'Готовые уроки: маршрут → лист в генераторе в один клик. Типичные ошибки ' +
          `и порядок задач — в заметках к разделам. В задании №${nomerRazdela('tekstovye-zadachi')}.`,
        kartinka: 'uroki',
        kartinkaAlt: 'Стеклянный планшет с тремя отмеченными строками и карандаш',
        snimok: {
          id: 'uroki',
          alt: `Карточки готовых уроков задания №${nomerRazdela('tekstovye-zadachi')}`,
        },
      },
      {
        title: 'Тренажёр с подсказками',
        text: 'Для самостоятельной работы ученика: подсказки-вопросы шаг за шагом ведут к решению.',
        kartinka: 'trenazher',
        kartinkaAlt: 'Стеклянная гантель и облачко с лампочкой',
        snimok: {
          id: 'trenazher',
          alt: `Тренажёр задания №${N_VEROYATNOST} с открытой подсказкой`,
        },
      },
    ],
    faqTitle: 'Частые вопросы',
    faq: [
      { q: 'Нужно ли регистрироваться?', a: registraciya },
      {
        q: 'Это бесплатно?',
        a: besplatnoTekst,
        link: { label: 'Тарифы →', href: TARIFY_HREF },
      },
      {
        q: 'Могу ли я создавать свои варианты?',
        a:
          'Да. Во вкладке «Генератор» выберите типы задач и количество вариантов — ' +
          `числа в вариантах будут разными. ${generatory}`,
      },
      {
        q: 'Можно ли использовать материалы на занятиях?',
        a:
          `Да. Листы из генератора и PDF из вкладки «${TUTORS_LABEL}» сделаны для занятий: ` +
          'их можно распечатать и раздать ученикам.',
      },
      {
        q: 'Есть ли рабочие тетради?',
        a: `Да, в PDF для заданий ${nomerRazdela('veroyatnost')}, ${nomerRazdela('slozhnaya-veroyatnost')} и ${nomerRazdela('vychisleniya')} — во вкладке «${TUTORS_LABEL}».`,
      },
      { q: 'Можно ли отслеживать прогресс учеников?', a: progressUchenikov },
    ],
    cta: {
      title: 'Готовы попробовать?',
      text: 'Соберите первый вариант — без регистрации.',
      primary: { label: 'Открыть генератор', href: GENERATOR_HREF },
      note: `Без тарифа — пробная генерация в ${nomeraGeneratorov()}, вкладка «Генератор».`,
      tour: 'Пройти тур',
    },
  } satisfies HowtoTabContent,

  uchenik: {
    tab: 'Ученику',
    video: {
      title: 'Видеоинструкция для ученика',
      text: 'Видео скоро. А пока — пройди тур по сайту или прочитай короткую инструкцию ниже.',
    },
    stepsTitle: 'С чего начать',
    stepsHint: 'Нажми на шаг',
    probaTitle: 'Попробуй, как работают подсказки',
    steps: [
      {
        title: 'Выбери задание в банке',
        text: 'Открыты задания, у которых раздел уже готов.',
        ikonka: 'bank',
        snimok: 'bank',
        snimokAlt: 'Банк заданий: карточки заданий ЕГЭ',
        poyasnenie: 'Банк заданий: выбери номер и открой раздел.',
        href: HOWTO_HREFS.bank,
      },
      {
        title: 'Прочитай теорию',
        text: 'Коротко и по делу, с разобранными примерами.',
        ikonka: 'teoriya',
        snimok: 'teoriya',
        snimokAlt: `Вкладка «Теория» задания №${N_PLANIMETRIYA}`,
        poyasnenie: `Теория задания №${N_PLANIMETRIYA}: коротко и с примерами.`,
        href: HOWTO_HREFS.teoriya,
      },
      {
        title: 'Реши опорные задачи',
        text: 'Это главные приёмы, на которых держится задание.',
        ikonka: 'opornye',
        snimok: 'opornye',
        snimokAlt: `Опорные задачи задания №${N_PLANIMETRIYA}`,
        poyasnenie: `Опорные задачи №${N_PLANIMETRIYA}: главные приёмы по одному.`,
        href: HOWTO_HREFS.opornye,
      },
      {
        title: 'Тренируйся в тренажёре',
        text: 'Застрял — открой подсказку: вопросы шаг за шагом ведут к решению.',
        ikonka: 'trenazher',
        snimok: 'trenazher',
        snimokAlt: `Тренажёр задания №${N_VEROYATNOST} с открытой подсказкой`,
        poyasnenie: `Тренажёр №${N_VEROYATNOST}: подсказка спрашивает, а не выдаёт ответ.`,
        href: HOWTO_HREFS.trenazher,
      },
    ],
    featuresTitle: 'Что есть на сайте',
    features: [
      {
        title: 'Теория',
        text: 'Всё нужное для задания на одной вкладке.',
        kartinka: 'teoriya',
        kartinkaAlt: 'Стеклянная книга с лампочкой',
      },
      {
        title: 'Опорные задачи',
        text: 'Главные приёмы задания — по одному на задачу.',
        kartinka: 'opornye',
        kartinkaAlt: 'Стеклянная мишень с дротиком в центре',
      },
      {
        title: 'Тренажёр с подсказками',
        text: 'Подсказки-вопросы ведут к решению, если не получается.',
        kartinka: 'trenazher',
        kartinkaAlt: 'Стеклянная гантель и облачко с лампочкой',
      },
      {
        title: 'Прогресс',
        text: 'В большинстве разделов видно, сколько уже пройдено.',
        kartinka: 'progress',
        kartinkaAlt: 'Стеклянное кольцо прогресса с флажком',
      },
    ],
    faqTitle: 'Частые вопросы',
    faq: [
      { q: 'Нужно ли регистрироваться?', a: registraciya },
      {
        q: 'Это бесплатно?',
        a: besplatnoTekst,
        link: { label: 'Тарифы →', href: TARIFY_HREF },
      },
      {
        q: 'Где сохраняется мой прогресс?',
        a: 'На твоём устройстве, в браузере. На другом телефоне или компьютере прогресс начнётся заново.',
      },
    ],
    cta: {
      title: 'Готов начать?',
      text: 'Выбери задание и начни с теории.',
      primary: { label: 'Открыть банк заданий', href: tasksPage.href },
      tour: 'Пройти тур',
    },
  } satisfies HowtoTabContent,
} as const;
