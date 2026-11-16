/**
 * Витрина возможностей на главной (components/landing/sumerki/
 * Vitrina.tsx): генератор рабочих листов и тренажёр. Голос — автора
 * сайта, от первого лица; без «мы».
 *
 * Каждое утверждение сверено с кодом:
 *   — место для решения: нет, пустое поле или клетка, на 5, 9 или 14
 *     строк либо по задаче (lib/sheet/space.js);
 *   — вариантов за раз: «Собрать вариант» — MAX_VARIANTS
 *     (lib/variant/types.ts), генератор задания — MAX_VARIANTS листа
 *     (lib/generatorQuery.ts);
 *   — лист учителя: решения по шагам с чертежами и таблица «Ответы»;
 *   — решать онлайн: ссылка и QR ученику (/variant/reshat/), код
 *     результата учителю — ответы, баллы, время (content/variantOnline);
 *   — задание 18 «Параметр»: 14 методов, у каждого — когда применять,
 *     алгоритм, ловушки, образец (content/zadanie19.ts);
 *   — подсказка вопросами: неверный вариант гаснет (components/trenazher/
 *     ShagiVoprosy, тренажёр №10); «Работа над ошибками» — в тренажёре;
 *   — карточки «Знаю / Не знаю», вопрос и оборот (components/kartochki).
 * Снимки — scripts/glavnaya/snimki-vecher.mjs.
 */

import { VARIANT_HREF } from '@/content/variant';
import { MAX_VARIANTS as LIST_MAX } from '@/lib/generatorQuery';
import { href, ZADANIYA } from '@/lib/paths';
import { MAX_VARIANTS } from '@/lib/variant/types';

export interface Snimok {
  /** Имя файлов: public/images/glavnaya/vitrina-<imya>-… */
  imya: string;
  /** Подпись в просмотре. */
  podpis: string;
  /** Пропорции кадра для витрины: ширина × высота (CSS). */
  w: number;
  h: number;
}

export interface PunktVitriny {
  id: string;
  zagolovok: string;
  tekst: string;
  /** Снимки пункта: первый — главный на сцене. */
  snimki: Snimok[];
}

const S = (imya: string, podpis: string, w: number, h: number): Snimok => ({ imya, podpis, w, h });

/* Пропорции кадров — как у файлов (scripts/glavnaya/snimki-vecher.mjs). */
const LIST = { w: 520, h: 409 };

export const VITRINA = {
  /** Заголовок блока: два варианта на выбор владельцу. */
  zagolovki: {
    a: {
      tekst: 'Рабочий лист к уроку — за минуту. И его не стыдно положить на парту',
      akcent: 'за минуту',
    },
    b: {
      tekst: 'Листы, которые я сама хотела бы раздавать. Собираются за минуту',
      akcent: 'Собираются за минуту',
    },
  },

  generator: {
    metka: 'Для учителя',
    zagolovok: 'Генератор рабочих листов',
    akcent: 'рабочих листов',
    lid: 'Выбираете задание и типы задач, остальное лист делает сам: варианты, ответы, решения.',
    kletka: { bez: 'Без клетки', s: 'С клеткой', podpis: 'Место для решения' },
    punkty: [
      {
        id: 'listy',
        zagolovok: 'Лист, который не стыдно положить на парту',
        tekst:
          'Под каждой задачей — место для решения: чистое поле или клетка, на 5, 9 или 14 строк. Или вовсе без него.',
        snimki: [
          S('list-bez', 'Самостоятельная работа · без места для решения', LIST.w, LIST.h),
          S('list-kletka', 'Тот же лист · место для решения в клетку', LIST.w, LIST.h),
        ],
      },
      {
        id: 'varianty',
        zagolovok: 'Списать не выйдет',
        tekst: `Задачи те же, числа разные. В «Собрать вариант» — до ${MAX_VARIANTS} вариантов за раз, в генераторе задания — до ${LIST_MAX}.`,
        snimki: [
          S('list-bez', 'Вариант 1', LIST.w, LIST.h),
          S('variant-2', 'Вариант 2 того же набора — другие числа и буквы', LIST.w, LIST.h),
          S('variant-3', 'Вариант 3 того же набора', LIST.w, LIST.h),
        ],
      },
      {
        id: 'uchitel',
        zagolovok: 'Лист учителя',
        tekst:
          'Решение каждой задачи по шагам, с чертежом, и таблица ответов по всем вариантам. У учеников этого листа нет.',
        snimki: [
          S('uchitel-reshenie', 'Лист учителя · решения по шагам с чертежами', LIST.w, LIST.h),
          S(
            'uchitel-otvety',
            'Лист учителя · ответы всех вариантов в одной таблице',
            LIST.w,
            LIST.h,
          ),
        ],
      },
      {
        id: 'onlayn',
        zagolovok: 'Онлайн или на бумаге',
        tekst:
          'Вариант можно распечатать или отправить ученику ссылкой и QR-кодом. Он решит на сайте и пришлёт код — по нему видно ответы, баллы и время.',
        snimki: [
          S('onlayn', 'Тот же вариант на сайте: ученик решает онлайн', 520, 475),
          S('pechat-varianta', 'Вариант в формате ЕГЭ · лист для печати', LIST.w, LIST.h),
        ],
      },
      {
        id: 'zadachi',
        zagolovok: 'Задачи не из одного учебника',
        tekst:
          'Прототипы открытого банка ФИПИ и мои задачи того же типа. Графики, сюжеты, чертежи, и у каждой свои числа.',
        snimki: [
          S('zadacha-grafik', 'Задание 11 · график функции', 520, 351),
          S('zadacha-chertezh', 'Задание 1 · планиметрия с чертежом', 520, 97),
          S('zadacha-stereo', 'Задание 3 · стереометрия с чертежом', 520, 173),
          S('zadacha-syuzhet', 'Задание 10 · сюжетная задача', 520, 125),
        ],
      },
      {
        id: 'parametr',
        zagolovok: 'Параметр — по 14 методам',
        tekst:
          'Задание 18 я разложила на 14 методов. У каждого: когда применять, алгоритм, ловушки и образец оформления.',
        snimki: [S('parametr', 'Задание 18 · метод 1: суть, когда применять, алгоритм', 520, 757)],
      },
    ] satisfies PunktVitriny[],
    knopki: [
      { tekst: 'Собрать рабочий лист', href: href(ZADANIYA, '1', 'generator'), glavnaya: true },
      { tekst: 'Собрать вариант ЕГЭ', href: VARIANT_HREF, glavnaya: false },
    ],
  },

  trenazher: {
    metka: 'Для ученика',
    zagolovok: 'Тренажёр, который ведёт как на занятии',
    akcent: 'Тренажёр',
    lid: 'Подсказки я писала так, как объясняю на уроке.',
    punkty: [
      {
        id: 'vopros',
        zagolovok: 'Подсказка — это вопрос',
        tekst:
          'Застрял — тренажёр не выдаёт ответ, а спрашивает про следующий шаг и даёт варианты. Шаг делает сам ученик.',
        snimki: [S('podskazka', 'Тренажёр · подсказка вопросами и таблица модели', 520, 627)],
      },
      {
        id: 'oshibka',
        zagolovok: 'Ошибка не теряется',
        tekst:
          'Неверный вариант гаснет сразу — можно подумать и выбрать снова. А задачи, где была ошибка, собираются в «Работу над ошибками».',
        snimki: [S('oshibka', 'Шаг пройден, на следующем — неверный вариант погас', 520, 731)],
      },
      {
        id: 'kartochki',
        zagolovok: 'Карточки для формул',
        tekst:
          'Вопрос на одной стороне, ответ на другой. Отмечаете «Знаю» или «Не знаю» — и видно, что повторить.',
        snimki: [
          S('kartochka-oborot', 'Карточка · оборот с ответом и чертежом', 520, 214),
          S('kartochka-lico', 'Карточка · вопрос', 520, 214),
        ],
      },
    ] satisfies PunktVitriny[],
    knopka: { tekst: 'Попробовать тренажёр', href: href(ZADANIYA, '11', 'trenazher') },
  },
} as const;
