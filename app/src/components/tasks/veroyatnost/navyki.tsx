import { YARLYKI_REZHIMOV, type Rezhim, type Zadanie } from '@/content/veroyatnost';
import type { Pool } from '@/lib/veroyatnost/pool';
import { navykKind, navykiZadaniya } from './metody';

/**
 * Карточка метода в тренажёре: что показывает шаг «Выбери методы».
 * Значок метода рисует MetodIkonka по идентификатору, поэтому здесь
 * только название, номер и число задач в банке.
 */
export interface MetodKarta {
  id: string;
  nomer: number;
  title: string;
  /** Сколько задач этого метода в банке — все варианты всех прототипов. */
  count: number;
}

/**
 * Методы тренажёра — те, под которые в банке есть задачи: у №4 семь
 * разделов списка Б, у №5 десять методов автора. Карточка собирается
 * на сервере: название и номер из каталога, число задач из банка.
 *
 * Метод без задач в банке карточки не получает: тренировать по нему
 * нечего.
 */
export function navykiMetodov(pool: Pool, zadanie: Zadanie): MetodKarta[] {
  return navykiZadaniya(zadanie).flatMap((m): MetodKarta[] => {
    const kinds = pool.kinds.filter((kind) => navykKind(kind) === m.id);
    if (kinds.length === 0) {
      return [];
    }
    return [
      {
        id: m.id,
        nomer: m.nomer,
        title: m.nazvanie,
        count: kinds.reduce((sum, kind) => sum + kind.variants.length, 0),
      },
    ];
  });
}

/**
 * Сюжет генератора — прототип банка: название, код, метод и число
 * вариантов. Картинку сюжета подбирает экран по коду
 * (content/veroyatnost-syuzhety.ts); нет картинки — стоит значок метода.
 */
export interface Syuzhet {
  id: string;
  title: string;
  /** Метод (блок банка): по нему сюжеты сгруппированы в генераторе. */
  metod: string;
  count: number;
}

/** Сюжеты генератора — прототипы банка в порядке банка. */
export function syuzhetyPrototipov(pool: Pool): Syuzhet[] {
  return pool.kinds.map((kind): Syuzhet => ({
    id: kind.id,
    title: kind.title,
    metod: navykKind(kind),
    count: kind.variants.length,
  }));
}

/** Ярлык к конфигуратору: адрес /trenazher/{id}/ и что в нём выбрано. */
export interface Yarlyk {
  id: string;
  title: string;
  skill: string | null;
  mode: Rezhim;
}

/**
 * Ярлыки тренажёра задания: по одному на метод с задачами, тренировка
 * вперемешку и «Узнай метод». Из них собираются адреса страниц.
 */
export function yarlyki(pool: Pool, zadanie: Zadanie): Yarlyk[] {
  const poMetodam = navykiMetodov(pool, zadanie).map((skill): Yarlyk => ({
    id: skill.id,
    title: skill.title,
    skill: skill.id,
    mode: 'practice',
  }));
  return [...poMetodam, ...YARLYKI_REZHIMOV.map((item): Yarlyk => ({ ...item, skill: null }))];
}
