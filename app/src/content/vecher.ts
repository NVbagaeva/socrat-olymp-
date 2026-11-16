/**
 * Блок главной «вечер» (components/landing/sumerki/VecherKartochki.tsx):
 * тексты двух вариантов на выбор владельцу и подписи настоящих снимков
 * листов (scripts/glavnaya/snimki-vecher.mjs).
 *
 * Каждое утверждение — то, что сайт умеет на самом деле:
 *   — до MAX_VARIANTS вариантов за раз — «Собрать вариант»
 *     (lib/variant/types.ts); в генераторах заданий — до 4–6;
 *   — название работы, рамка теории и разобранный пример — опции листа
 *     (lib/zadanie11/sheet11.ts: vr, tr, pr; так же у №1, №12, №14);
 *   — лист учителя: решения по шагам и таблица «Ответы» по вариантам;
 *   — «Скачать PDF / Печать» — одна кнопка на странице листа.
 * Цифр экономии времени, отзывов и обещаний результата здесь нет.
 */

import { VARIANT_HREF } from '@/content/variant';
import { href, ZADANIYA } from '@/lib/paths';
import { MAX_VARIANTS } from '@/lib/variant/types';

export interface KartochkaVechera {
  id: 'samostoyatelnye' | 'domashnie' | 'proverka' | 'materialy';
  nomer: string;
  metka: string;
  zagolovok: string;
  tekst: string;
  /** Куда ведёт ссылка под текстом. */
  ssylka: { tekst: string; href: string };
}

export interface TekstyVechera {
  zagolovok: string;
  lid: string;
  kartochki: KartochkaVechera[];
}

const SSYLKI = {
  samostoyatelnye: { tekst: 'Собрать вариант', href: VARIANT_HREF },
  domashnie: { tekst: 'Открыть генератор', href: href(ZADANIYA, '11', 'generator') },
  proverka: { tekst: 'Для репетиторов', href: href(ZADANIYA, '1', 'dlya-repetitorov') },
  materialy: {
    tekst: 'Справочник по планиметрии',
    href: href(ZADANIYA, '1', 'pechat', 'spravochnik'),
  },
} as const;

/** Вариант А — заголовок о времени. */
const A: TekstyVechera = {
  zagolovok: 'Вечер подготовки к уроку — теперь одна минута',
  lid: 'Варианты с разными числами, лист ответов, пошаговый разбор и теория в рамках — собираются за минуту и печатаются в два клика.',
  kartochki: [
    {
      id: 'samostoyatelnye',
      nomer: '01',
      metka: 'Самостоятельные',
      zagolovok: 'Списать невозможно',
      tekst: `У каждого ученика свой вариант: те же типы задач, другие числа. До ${MAX_VARIANTS} вариантов за раз.`,
      ssylka: SSYLKI.samostoyatelnye,
    },
    {
      id: 'domashnie',
      nomer: '02',
      metka: 'Домашние',
      zagolovok: 'Своё задание каждому',
      tekst: 'Лист с названием работы, теорией в рамке и разобранным примером — по вашему выбору.',
      ssylka: SSYLKI.domashnie,
    },
    {
      id: 'proverka',
      nomer: '03',
      metka: 'Проверка',
      zagolovok: 'Проверка — по одному листу',
      tekst:
        'Таблица ответов на все варианты и решения по шагам с чертежами — на листе учителя, только у вас.',
      ssylka: SSYLKI.proverka,
    },
    {
      id: 'materialy',
      nomer: '04',
      metka: 'Материалы',
      zagolovok: 'Выглядит как из издательства',
      tekst: 'Чистые чертежи, графики и формулы. PDF и печать — одной кнопкой.',
      ssylka: SSYLKI.materialy,
    },
  ],
};

/** Вариант Б — прежний заголовок, акцент на настоящих листах. */
const B: TekstyVechera = {
  zagolovok: 'Мы взяли на себя то, что обычно забирает ваш вечер',
  lid: 'Ниже — настоящие листы сайта, без макетов. Нажмите на любой, чтобы рассмотреть страницу целиком.',
  kartochki: [
    {
      id: 'samostoyatelnye',
      nomer: '01',
      metka: 'Самостоятельные',
      zagolovok: 'У соседа по парте — другие числа',
      tekst: `Те же типы задач, свой вариант у каждого. До ${MAX_VARIANTS} вариантов за раз.`,
      ssylka: SSYLKI.samostoyatelnye,
    },
    {
      id: 'domashnie',
      nomer: '02',
      metka: 'Домашние',
      zagolovok: 'Домашняя под вашу тему',
      tekst:
        'Название работы, «Повторяем» с теорией и разобранный пример — включаете то, что нужно.',
      ssylka: SSYLKI.domashnie,
    },
    {
      id: 'proverka',
      nomer: '03',
      metka: 'Проверка',
      zagolovok: 'Ответы всех вариантов — в одной таблице',
      tekst: 'А на отдельном листе учителя — решения по шагам с чертежами.',
      ssylka: SSYLKI.proverka,
    },
    {
      id: 'materialy',
      nomer: '04',
      metka: 'Материалы',
      zagolovok: 'Материалы, которые не стыдно раздать',
      tekst: 'Справочник, чертежи и формулы в типографском качестве. PDF и печать — одной кнопкой.',
      ssylka: SSYLKI.materialy,
    },
  ],
};

export const TEKSTY_VECHERA = { a: A, b: B } as const;

/** Снимок листа: файл и подпись в просмотре. */
export interface SnimokLista {
  imya: string;
  podpis: string;
}

/**
 * Снимки по карточкам: первый — передний лист в карточке, остальные
 * лежат за ним веером. В просмотре листаются все подряд.
 */
export const SNIMKI_VECHERA: Record<KartochkaVechera['id'], SnimokLista[]> = {
  samostoyatelnye: [
    { imya: 'samostoyatelnaya-v1', podpis: 'Самостоятельная работа · планиметрия · вариант 1' },
    { imya: 'samostoyatelnaya-v2', podpis: 'Тот же набор · вариант 2 — другие числа и буквы' },
    { imya: 'samostoyatelnaya-v3', podpis: 'Тот же набор · вариант 3' },
  ],
  domashnie: [
    {
      imya: 'domashnyaya',
      podpis: 'Домашняя работа · текстовые задачи · теория «Повторяем» и разобранный пример',
    },
    {
      imya: 'domashnyaya-2',
      podpis: 'Та же домашняя · разобранный пример по шагам, правило в рамке',
    },
  ],
  proverka: [
    { imya: 'proverka-razbor', podpis: 'Лист учителя · решения по шагам с чертежами' },
    { imya: 'proverka-otvety', podpis: 'Лист учителя · ответы всех вариантов в одной таблице' },
    { imya: 'samostoyatelnaya-v1', podpis: 'Лист ученика того же варианта' },
  ],
  materialy: [
    {
      imya: 'materialy-spravochnik',
      podpis: 'Справочник по планиметрии · определения, свойства, чертежи',
    },
    { imya: 'materialy-oblozhka', podpis: 'Справочник по планиметрии · содержание' },
  ],
};
