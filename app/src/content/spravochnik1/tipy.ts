/**
 * Справочник по планиметрии (задание №1): устройство данных.
 *
 * Один источник на всё: из этих записей собираются веб-страница
 * справочника, PDF и рамки «Повторяем» в листах генератора. Для
 * вычитки автором из них же генерируется docs/spravochnik-1/soderzhanie.md
 * (scripts/build-spravochnik-1.mjs).
 *
 * Тексты — свои формулировки. Математика — в $…$, её набирает KaTeX;
 * обозначения как в остальном разделе №1: $\angle A$, $^\circ$,
 * десятичная запятая $0{,}5$, $\operatorname{tg}$.
 */

import { plural } from '../../lib/plural';

/** Одно утверждение блока: словами и, если есть, формулой. */
export interface Utverzhdenie {
  /** Полное предложение. Может содержать $…$ и **жирное**. */
  tekst: string;
  /** Формула отдельной строкой (TeX без $). */
  formula?: string;
  /**
   * Школьная формулировка из учебника (теорема, признак). Такие фразы
   * неизбежно совпадают с учебными текстами: сверка пересказа печатает
   * их совпадения отдельным списком и не считает ошибкой.
   */
  shkolnaya?: true;
}

/** Теорема или формула: название, формулировка словами, формула. */
export interface Teorema {
  nazvanie?: string;
  slovami: string;
  formula: string;
  /** Вторая формула той же теоремы с подписью: «косинус угла по трём сторонам». */
  dop?: { podpis: string; formula: string };
  /** Школьная формулировка — см. Utverzhdenie.shkolnaya. */
  shkolnaya?: true;
}

/**
 * Откуда числа примера.
 * - `fipi` — задача открытого банка (номер в Блоке 1): условие и ответ
 *   собирает прототип, ответ разбора сверяется с ним автоматически;
 * - `analog` — наш аналог прототипа (прототип, номер аналога);
 * - `svoy` — свой пример: условие пишется здесь, ответ пересчитывается
 *   программно (`raschet`) из чисел условия и сверяется с `otvet`.
 */
export type IstochnikPrimera =
  { fipi: number } | { analog: { proto: number; no: number } } | { svoy: { uslovie: string } };

/** Шаг разбора: подпись этапа и что на нём делаем. */
export interface ShagPrimera {
  /** Подпись этапа: «Что знаем», «Применяем теорему», «Считаем»… */
  etap: string;
  tekst?: string;
  /** Строки выкладки (TeX без $), каждая — отдельной строкой. */
  tex?: string[];
}

export interface Primer {
  /** Короткое название хода: «Найти внешний угол». */
  title: string;
  istochnik: IstochnikPrimera;
  shagi: ShagPrimera[];
  /** Ответ в TeX: «118^\circ», «1{,}5», «10\sqrt2». */
  otvet: string;
  /**
   * Числовое значение ответа, если его не прочитать из `otvet`: корни,
   * два числа («$0{,}8$ и $-0{,}6$»).
   */
  znachenie?: number | readonly number[];
  /**
   * Свой пример: независимый пересчёт ответа по числам условия.
   * Нет — ответ не число («да», «$\angle B$»), тогда `bezChisla`.
   */
  raschet?: () => number | readonly number[];
  bezChisla?: true;
  /** Свой пример: что на чертеже (с числами условия). */
  chertezh?: string;
}

/**
 * Что нарисовать на чертеже теории (этап 2 строит его движком).
 * В теории никаких чисел — только обозначения.
 */
export interface OpisanieChertezha {
  /** Что на чертеже: точки, отрезки, дуги, засечки, подписи. */
  chto: string;
  /** Ключевой элемент — выделяется золотисто-оранжевым. */
  vydelit: string;
}

/** Карточка-тема справочника. Блоки берутся только нужные. */
export interface Tema1 {
  /** Якорь карточки: #k-<id>. */
  id: string;
  title: string;
  /** Большая тема — на всю ширину сетки (параллельные прямые). */
  shirokaya?: boolean;
  chertezh?: OpisanieChertezha;
  opredeleniya?: Utverzhdenie[];
  svoystva?: Utverzhdenie[];
  priznaki?: Utverzhdenie[];
  teoremy?: Teorema[];
  /** Таблица под блоками: заголовки столбцов и строки (тексты с $…$). */
  tablica?: { head: string[]; rows: string[][] };
  /** «Как применять»: 2–4 типичных хода в задании №1. */
  primenenie?: string[];
  /** «Важно»: ловушка или частая ошибка. */
  vazhno?: string[];
  primery?: Primer[];
  /** «Где на ЕГЭ»: прототипы задания №1. */
  prototipy: number[];
  /**
   * Карточки прежней теории, которые эта заменяет: старые якоря
   * #k-<id> (ссылки «Повторить теорию» из тренажёра) ведут сюда.
   */
  zamenyaet?: string[];
}

export interface Razdel1 {
  no: number;
  id: string;
  title: string;
  /** Одна-две фразы о разделе. */
  lead: string;
  temy: Tema1[];
}

/** Блок «Как пользоваться» в начале справочника. */
export interface KakPolzovatsya {
  title: string;
  legenda: { blok: keyof typeof BLOKI_SPRAVOCHNIKA; tekst: string }[];
  oboznacheniya: { title: string; tekst: string };
}

/** Подписи блоков — одни на веб, PDF и файл вычитки. */
export const BLOKI_SPRAVOCHNIKA = {
  opredeleniya: 'Определение',
  svoystva: 'Свойство',
  priznaki: 'Признак',
  teoremy: 'Теорема / формула',
  primenenie: 'Как применять',
  vazhno: 'Важно',
  primery: 'Пример',
  prototipy: 'Где на ЕГЭ',
} as const;

export const SPRAVOCHNIK_1 = {
  title: 'Справочник по планиметрии',
  lead: 'Всё для задания №1 первой части ЕГЭ профильного уровня',
  /** Поиск по темам. */
  poisk: 'Найти тему…',
  poiskLabel: 'Поиск по темам справочника',
  nichego: 'Ничего не нашлось. Попробуйте другое слово: «угол», «площадь», «касательная».',
  /** Кнопка разбора в карточке: свёрнут — раскрыть, раскрыт — свернуть. */
  primer: 'Пример',
  svernut: 'Свернуть пример',
  otvet: 'Ответ',
  uslovie: 'Условие',
  /** Откуда задача разбора. */
  fipi: (n: number) => `Открытый банк, задача ${n}`,
  neIzBanka: 'Не из открытого банка',
  /** Подпись к «Где на ЕГЭ»: номер ведёт в тренажёр на этот прототип. */
  gdeNaEgeTitle: (n: number, nazvanie: string) => `Прототип ${n}: ${nazvanie}`,
  /** PDF: кнопка на странице, переключатель примеров, лист. */
  pdf: {
    /** Главная кнопка: скачивает готовый PDF (public/materials/zadanie-1). */
    skachat: 'Скачать справочник',
    skachatAria: 'Скачать справочник по планиметрии в PDF',
    /** Подпись под кнопкой: «PDF, A4, 50 страниц». */
    podpis: (stranic: number) =>
      `PDF, A4, ${stranic} ${plural(stranic, 'страница', 'страницы', 'страниц')}`,
    /** Ссылка на печатную страницу: там окно печати браузера. */
    pechat: 'Открыть для печати',
    knopka: 'Печать',
    sPrimerami: 'С примерами',
    bezPrimerov: 'Без примеров',
    vybor: 'Что войдёт в PDF',
    lead: 'Откроется окно печати браузера: выберите «Сохранить как PDF». A4, книжная.',
    /** Кнопка «Назад» и хлебные крошки печатной страницы. */
    nazad: 'Назад',
    nazadAria: 'Назад, к справочнику',
    kroshki: {
      aria: 'Вы здесь',
      zadanie: 'Задание №1',
      teoriya: 'Теория',
      spravochnik: 'Справочник',
    },
    gotovim: 'Раскладываем страницы…',
    shapka: 'Справочник по планиметрии · Задание №1 ЕГЭ',
    zadanie: 'Задание №1 ЕГЭ',
    soderzhanie: 'Содержание',
    /** Разбор ушёл в следующую колонку: к какой теме он. */
    kTeme: 'К теме:',
    str: 'стр.',
  },
} as const;

export const KAK_POLZOVATSYA_1: KakPolzovatsya = {
  title: 'Как пользоваться',
  legenda: [
    { blok: 'opredeleniya', tekst: 'что это такое' },
    { blok: 'svoystva', tekst: 'что верно, когда уже известно, что объект такой' },
    { blok: 'priznaki', tekst: 'по чему узнать, что объект такой' },
    { blok: 'teoremy', tekst: 'утверждение словами и формулой' },
    { blok: 'vazhno', tekst: 'ловушка или частая ошибка' },
    { blok: 'primery', tekst: 'разбор задачи по шагам' },
  ],
  oboznacheniya: {
    title: 'Обозначения',
    tekst:
      '$a$, $b$, $c$ — стороны против углов $A$, $B$, $C$ ($a = BC$, $b = AC$, $c = AB$); $\\alpha$, $\\beta$, $\\gamma$ — углы при вершинах $A$, $B$, $C$; $h_a$ — высота к стороне $a$; $p$ — полупериметр; $S$ — площадь; $R$ и $r$ — радиусы описанной и вписанной окружностей; $\\smile AB$ — дуга $AB$.',
  },
};
