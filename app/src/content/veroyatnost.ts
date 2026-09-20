/**
 * Тексты страниц заданий №4 и №5 — теория вероятностей.
 *
 * Здесь только то, что читается глазами. Описаний теории, разборов и
 * рекламных фраз нет намеренно: их пишет автор, а пустое место
 * честнее придуманного текста.
 *
 * Названия разделов взяты из кодификатора ФИПИ и из задачников
 * Е. А. Ширяевой, по которым собираются банки: «Основные понятия
 * теории вероятностей» и «Вероятности событий».
 */

import type { TutorMaterial } from './sections';
import { counted } from '@/lib/plural';
import { trainerPage } from './trainerModes';

/** Вкладка раздела: хвост адреса и есть её идентификатор. */
export interface VeroyatnostTab {
  id: string;
  label: string;
  /** Часть адреса после /zadaniya/{slug}/. Пусто — сам адрес раздела. */
  tail: string;
}

export interface VeroyatnostSection {
  /** Номер задания в экзамене, две цифры — как в банке заданий. */
  no: string;
  /** Часть адреса: /zadaniya/{slug}. */
  slug: string;
  /** Название темы: заголовок страницы. */
  title: string;
  /**
   * Короткое имя темы — для тренажёра и генератора. Там страница уже
   * внутри задания, и номер в подписи «Задание №4. …» повторял бы
   * сам себя. Нет поля — берётся полное название.
   */
  korotko?: string;
  /** Одна строка под заголовком. Про устройство раздела, не про предмет. */
  lead: string;
  /** Пометка уровня рядом с заголовком. */
  badge: string;
  /**
   * Вкладки раздела по порядку. У заданий они разные: у №4 есть
   * «О задании», у №5 её пока нет.
   */
  tabs: readonly VeroyatnostTab[];
  /**
   * Меню «Для репетиторов» в ленте вкладок — то же, что у задания №12.
   * Нет поля — нет и кнопки.
   */
  tutors?: { title: string; lead: string; items: TutorMaterial[] };
}

/**
 * Вкладки задания №4 — по референсу тренажёра: О задании · Теория ·
 * Ключевые методы решения · Подготовительные задачи · Тренажёр ·
 * Генератор; «Для репетиторов» стоит в той же ленте кнопкой меню.
 * Теория живёт на своём адресе, а сам адрес раздела — это «О задании».
 * «Узнай метод» — режим тренажёра, а не вкладка: как и остальные
 * режимы, он выбирается в конфигураторе тренировки.
 */
const TABS_4: readonly VeroyatnostTab[] = [
  { id: 'o-zadanii', label: 'О задании', tail: '' },
  { id: 'teoriya', label: 'Теория', tail: 'teoriya/' },
  { id: 'metody', label: 'Ключевые методы решения', tail: 'metody/' },
  { id: 'podgotovka', label: 'Подготовительные задачи', tail: 'podgotovka/' },
  { id: 'trenazher', label: 'Тренажёр', tail: 'trenazher/' },
  { id: 'generator', label: 'Генератор', tail: 'generator/' },
];

/**
 * Вкладки задания №5: Теория · Ключевые методы решения ·
 * Подготовительные задачи · Тренажёр · Генератор. Вкладки «О задании»
 * нет — её текст для №5 автор ещё не писал; появится вместе с текстом.
 */
const TABS_5: readonly VeroyatnostTab[] = [
  { id: 'teoriya', label: 'Теория', tail: '' },
  { id: 'metody', label: 'Ключевые методы решения', tail: 'metody/' },
  { id: 'podgotovka', label: 'Подготовительные задачи', tail: 'podgotovka/' },
  { id: 'trenazher', label: 'Тренажёр', tail: 'trenazher/' },
  { id: 'generator', label: 'Генератор', tail: 'generator/' },
];

/**
 * Заголовок раздела №4 — один на все вкладки: он живёт в шапке
 * раздела, а не в страницах, и по вкладкам не дублируется.
 */
export const ZAGOLOVOK_4 = 'Задание №4. Вероятность: простая';

/**
 * Короткое имя темы №4 — для тренажёра и генератора: там страница уже
 * внутри задания, и «Задание №4» в подписи повторяло бы само себя.
 */
export const KOROTKO_4 = 'Вероятность: простая';

/** Подзаголовок раздела №4 — строка под бейджем уровня. */
export const PODZAGOLOVOK_4 =
  'Одно задание — восемь методов. Ученик смотрит на условие, узнаёт структуру и берёт подходящий метод.';

/** Подзаголовок раздела №5: двенадцать методов автора (lib/veroyatnost/metody5.ts). */
export const PODZAGOLOVOK_5 =
  'Одно задание — 12 методов. Ученик смотрит на условие, узнаёт структуру и берёт подходящий метод.';

export const VEROYATNOST: readonly VeroyatnostSection[] = [
  {
    no: '04',
    slug: '4',
    title: ZAGOLOVOK_4,
    korotko: KOROTKO_4,
    lead: PODZAGOLOVOK_4,
    badge: 'Базовый уровень',
    tabs: TABS_4,
    /* Те же две карточки, что у задания №12. Файлы — сборник
       «Задание 4», который собирает scripts/build-pdf-4.mjs и кладёт
       в app/public по этим же путям (workflow «PDF 4»). Здесь стоят
       файлы для ученика, а не для учителя: меню открыто всем, кто
       зашёл на страницу темы, и ответы из него скачивались бы заодно;
       файлы учителя уезжают архивом со страницы запуска CI. */
    tutors: {
      title: 'Для репетиторов',
      lead: 'Материалы для занятий по теме «Основные понятия теории вероятностей».',
      items: [
        {
          id: 'workbook',
          title: 'Рабочая тетрадь для репетиторов',
          lead: 'Задачи с заготовками рисунков и строкой для ответа',
          icon: 'doc',
          file: '/materials/zadanie-4/zadanie-4-teoriya-veroyatnostey-uchenik.pdf',
        },
        {
          id: 'pdf',
          title: 'PDF-практикум',
          lead: 'Те же задания чёрно-белым — для принтера',
          icon: 'pdf',
          file: '/materials/zadanie-4/zadanie-4-teoriya-veroyatnostey-uchenik-chb.pdf',
        },
        /* Печатная база тренажёра: все прототипы, варианты 1–10.
           Собирает scripts/build-pdf-4-baza.mjs (workflow «PDF 4 база»);
           файл учителя с решениями — только архивом CI. */
        {
          id: 'baza',
          title: 'Печатная база задания 4',
          lead: 'Все прототипы тренажёра, по десять вариантов, без рисунков — со строкой для ответа',
          icon: 'pdf',
          file: '/materials/zadanie-4/Zadanie_4_baza_uchenik.pdf',
        },
      ],
    },
  },
  {
    no: '05',
    slug: '5',
    title: 'Вероятности событий',
    lead: PODZAGOLOVOK_5,
    badge: 'Базовый уровень',
    tabs: TABS_5,
    /* Сборник «Задание 5»: scripts/build-pdf-5.mjs, workflow «PDF 5».
       Как и у №4, здесь только файлы для ученика. */
    tutors: {
      title: 'Для репетиторов',
      lead: 'Материалы для занятий по теме «Вероятности событий».',
      items: [
        {
          id: 'workbook',
          title: 'Рабочая тетрадь для репетиторов',
          lead: 'Задачи конспекта и прототипы с заготовками рисунков и строкой для ответа',
          icon: 'doc',
          file: '/materials/zadanie-5/zadanie-5-veroyatnosti-sobytiy-uchenik.pdf',
        },
        {
          id: 'pdf',
          title: 'PDF-практикум',
          lead: 'Те же задания чёрно-белым — для принтера',
          icon: 'pdf',
          file: '/materials/zadanie-5/zadanie-5-veroyatnosti-sobytiy-uchenik-chb.pdf',
        },
      ],
    },
  },
];

export function veroyatnostBySlug(slug: string): VeroyatnostSection | undefined {
  return VEROYATNOST.find((section) => section.slug === slug);
}

/**
 * Имя темы для тренажёра и генератора: короткое, если оно задано.
 * Эти экраны живут внутри задания, и номер в подписи там лишний.
 */
export function veroyatnostFamily(slug: string): string {
  const section = veroyatnostBySlug(slug);
  return section === undefined ? '' : (section.korotko ?? section.title);
}

/**
 * Заголовок окна браузера: «Тема. Вкладка — задание №N — Будет на ЕГЭ».
 * Собирается здесь, чтобы название темы и номер не переписывались
 * руками в каждой из страниц.
 *
 * Номер задания приписывается, только если его нет в самом названии:
 * у №4 название начинается с «Задание №4», и повторять его дважды
 * в одной строке незачем.
 */
export function veroyatnostTitle(slug: string, tab: string): string {
  const section = veroyatnostBySlug(slug);
  if (section === undefined) {
    throw new Error(`Нет раздела вероятности ${slug}`);
  }
  const zadanie = `задание №${Number(section.no)}`;
  const hvost = section.title.toLowerCase().includes(zadanie) ? '' : ` — ${zadanie}`;
  return `${section.title}. ${tab}${hvost} — Будет на ЕГЭ`;
}

/* ── Слова тренажёра (раздел 07 референса) ───────────────────────── */

/** Задание, у которого есть тренажёр по методам и «Узнай метод». */
export type Zadanie = 4 | 5;

/**
 * Режимы тренажёра — форматы внутри одного конфигуратора, как у
 * задания №12: три режима референса и «Узнай метод», где считать
 * ничего не нужно — только назвать метод по условию.
 */
export type Rezhim = 'practice' | 'mixed' | 'mistakes' | 'uznay';

export interface RezhimOpisanie {
  id: Rezhim;
  title: string;
  lead: string;
}

/** Режимы — как в референсе, слово в слово; четвёртый — «Узнай метод». */
export const REZHIMY: readonly RezhimOpisanie[] = [
  { id: 'practice', title: 'Отработка', lead: 'Один метод' },
  { id: 'mixed', title: 'Смешанная', lead: 'Все методы вперемешку' },
  { id: 'mistakes', title: 'Повтор ошибок', lead: 'Только ошибки' },
  { id: 'uznay', title: 'Узнай метод', lead: 'Только условие: назвать метод' },
];

/**
 * Слова конфигуратора тренировки — те же, что у задания №12, кроме
 * первого шага: здесь выбирают не навык, а метод. Уровней сложности у
 * задач вероятности нет, и конфигуратор этот ряд не показывает.
 */
export const KONFIGURATOR_SLOVA: typeof trainerPage = {
  ...trainerPage,
  skill: {
    step: '1',
    title: 'Выбери метод',
    lead: 'Какой метод отрабатываем в разделе «{family}»?',
  },
  params: {
    ...trainerPage.params,
    lead: 'Выбери формат и количество задач',
  },
  summary: {
    title: 'Выбранная тренировка',
    note: 'Все задачи соответствуют реальным прототипам ЕГЭ.',
  },
};

/**
 * Ярлыки к конфигуратору — как у задания №12: адрес /trenazher/{id}/
 * открывает ту же вкладку с уже выбранным методом или режимом.
 */
export const YARLYKI_REZHIMOV: readonly { id: string; title: string; mode: Rezhim }[] = [
  { id: 'mixed', title: 'Смешанная тренировка', mode: 'mixed' },
  { id: 'uznay-metod', title: 'Узнай метод', mode: 'uznay' },
];

/** Слова тренажёра одного задания: общие, кроме номера задания. */
export function trenazherSlova(zadanie: Zadanie) {
  return {
    zhdem: 'Собираем подход…',
    schet: (i: number, n: number): string => `Задача ${i} из ${n}`,
    istochnik: `Прототип задания ${zadanie}`,
    dalshe: 'Следующая',
    zavershit: 'Завершить подход',
    progress: {
      title: 'Прогресс тренажёра',
      lead: 'Считается отдельно по каждому методу: верных ответов из закрытых задач.',
      ring: 'решено верно',
      pusto: 'Пока ни одной закрытой задачи',
      sbros: 'Сбросить прогресс',
    },
  } as const;
}

/* ── Слова режима «Узнай метод» ──────────────────────────────────── */

export function uznaySlova(zadanie: Zadanie) {
  return {
    vopros: 'Каким методом решается задача?',
    verno: 'Верно',
    neverno: 'Неверно',
    pravilnyy: 'Правильный метод:',
    priznaki: 'Признаки в условии:',
    kakVidno: 'Как это было видно:',
    istochnik: { prototip: `Прототип задания ${zadanie}`, konspekt: 'Задача конспекта' },
    progress: {
      title: 'Прогресс «Узнай метод»',
      lead: 'Считается отдельно от решённых задач: узнано верно из показанных, по каждому методу.',
      ring: 'узнано верно',
      pusto: 'Пока ни одной задачи',
      sbros: 'Сбросить прогресс',
    },
  } as const;
}

/* ── Слова подготовительных задач ────────────────────────────────── */

/**
 * Вкладка подготовки устроена как у задания №12: лента блоков сверху,
 * страница блока с рядом кружков и одной задачей на экране. Слова
 * общие для №4 и №5 — разница только в числе блоков и задач, а его
 * даёт банк.
 */
export const PODGOTOVKA_SLOVA = {
  title: 'Подготовительные задачи',
  lead: 'Задачи авторского конспекта. Блоки идут в порядке конспекта: это последовательность, а не каталог.',
  allLabel: 'Все блоки',
  /** Строка над рядом кружков. */
  schet: (nomer: number, vsego: number): string => `Задача ${nomer} из ${vsego}`,
  ryad: 'Задачи блока',
  verno: 'верных',
  neverno: 'неверных',
  dalshe: 'Следующая задача →',
  dalsheNereshennaya: 'Следующая нерешённая →',
  kSpisku: 'К списку блоков →',
  /** Подпись под карточкой блока в списке. */
  zadach: (vsego: number): string => counted(vsego, 'задача', 'задачи', 'задач'),
} as const;

/* ── Слова листа для печати: вкладка «Генератор» ─────────────────── */

/**
 * Слова листа одного задания: название, колонтитул и заголовки
 * разделов файла с ответами. Экран генератора — тот же, что у задания
 * №12; шапка и подвал листа общие для всей платформы и берутся из
 * content/sheet12.js: там подпись курса и соцсети, а не слова про
 * линейную функцию.
 */
export interface ListSlova {
  title: { chip: string; text: string };
  runner: string;
  otvety: { title: string; note: string };
  resheniya: { title: string; note: (resheno: number, vsego: number) => string };
}

const RESHENIYA = {
  title: 'Краткие решения',
  note: (resheno: number, vsego: number): string =>
    `формулы разбора из банка, ${resheno} задач из ${vsego}`,
};

export const LIST_4: ListSlova = {
  title: { chip: 'Задание 4', text: 'Основные понятия теории вероятностей' },
  runner: 'Задание 4 · Основные понятия теории вероятностей',
  otvety: { title: 'Ответы', note: 'по блокам, сквозная нумерация' },
  resheniya: RESHENIYA,
};

export const LIST_5: ListSlova = {
  title: { chip: 'Задание 5', text: 'Вероятности событий' },
  runner: 'Задание 5 · Вероятности событий',
  otvety: { title: 'Ответы', note: 'по типам задач, сквозная нумерация' },
  resheniya: RESHENIYA,
};

/**
 * Слова листа по номеру задания. Страница печати — клиентский
 * компонент, а в словах есть функция подписи «Кратких решений»:
 * с сервера такой объект не передать, поэтому компонент получает
 * номер задания и выбирает слова сам.
 */
export function listSlova(zadanie: Zadanie): ListSlova {
  return zadanie === 4 ? LIST_4 : LIST_5;
}
