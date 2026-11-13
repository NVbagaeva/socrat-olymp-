/**
 * Каталог раздела для конструктора ДЗ: что можно положить в домашнее
 * задание из карточек, опорных задач и тренажёра. Собирается на сборке
 * (lib/dz/katalog/server.ts) и лежит файлом
 * /kabinet/dz-vydat/dannye/zNN.json: всё уже набрано KaTeX и нарисовано.
 *
 * Ответы и разборы закрыты так же, как на страницах разделов
 * (lib/otpechatok.ts, sealText с seed = id): это защита от
 * подглядывания, а не от отладчика. Открывает их конструктор при выдаче
 * — ключ уходит в базу, ученику не показывается.
 */

import type { KartochkaGotovaya } from '@/lib/kartochki/podgotovka';

/** Карточка каталога: готовая карточка раздела и закрытый ответ. */
export interface KartochkaKat extends KartochkaGotovaya {
  /**
   * Ответ для базы, закрыт sealText(seed = id): «da» / «net» у
   * «верно / неверно», нормальная запись ЕГЭ у «вычисления». Только у
   * карточек с проверкой.
   */
  klyuch?: string;
  /** Оборот карточки с проверкой, закрыт так же: JSON {back, pochemu}. */
  oborot?: string;
}

export interface PodtemaKat {
  id: string;
  /** Название, HTML с формулами. */
  titleHtml: string;
  kartochki: KartochkaKat[];
}

/** Опорная задача из зафиксированных (№7: свои задачи блока). */
export interface OpornayaKat {
  id: string;
  /** Что отрабатывается — для списка (№8). */
  nazvanie?: string;
  uslovieHtml: string;
  /** Подсказка, HTML. */
  podskazkaHtml: string;
  /** Варианты выбора (№8 «плюс / минус»). */
  varianty?: { number: string; label: string }[];
  /**
   * Задача строится из зерна (№8): при выдаче берётся аналог с новым
   * зерном, здесь — только зафиксированный вариант для предпросмотра.
   */
  izZerna?: boolean;
  /** Ответ и разбор (JSON RazborDz), закрыты sealText(seed = id). Нет у izZerna. */
  klyuch?: string;
  razbor?: string;
}

export interface BlokKat {
  slug: string;
  nazvanie: string;
  /** «Запомни»: правило блока, HTML. */
  zapomniHtml: string;
  zadachi: OpornayaKat[];
}

export interface TipKat {
  /** Прототип: «8.A», «P05». */
  id: string;
  nazvanieHtml: string;
}

export interface GruppaKat {
  id: string;
  nazvanie: string;
  tipy: TipKat[];
}

export interface KatalogRazdela {
  no: number;
  nazvanie: string;
  /** null — у раздела нет карточек (№8). */
  kartochki: PodtemaKat[] | null;
  opornye: BlokKat[];
  trenazher: GruppaKat[];
}
