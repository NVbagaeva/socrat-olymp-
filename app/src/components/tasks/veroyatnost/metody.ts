import type { Zadanie } from '@/content/veroyatnost';
import { METODY_5 } from '@/lib/veroyatnost/metody5';
import { METODY_4 } from '@/lib/veroyatnost/model';
import type { PoolKind } from '@/lib/veroyatnost/pool';

/**
 * Навык тренажёра — то, по чему выбирают тренировку, считают прогресс
 * и что угадывают в «Узнай метод». У задания №4 это метод решения из
 * каталога рисунков (model.ts: пять методов), у задания №5 — один из
 * двенадцати методов автора (metody5.ts), он же блок банка.
 */
export interface Navyk {
  id: string;
  nomer: number;
  nazvanie: string;
}

/** Навыки задания: пять методов у №4, двенадцать у №5. */
export function navykiZadaniya(zadanie: Zadanie): readonly Navyk[] {
  return zadanie === 4 ? METODY_4 : METODY_5;
}

export function navykPoId(zadanie: Zadanie, id: string): Navyk | undefined {
  return navykiZadaniya(zadanie).find((n) => n.id === id);
}

/**
 * Навык прототипа: у №4 — метод рисунка, один на все варианты, поэтому
 * берётся с первого; у №5 — блок банка.
 */
export function navykKind(kind: PoolKind, zadanie: Zadanie): string | undefined {
  return zadanie === 4 ? kind.variants[0]?.model?.method : kind.blok;
}

/** Идентификатор задачи в списке ошибок: прототип и номер варианта. */
export function zadachaId(kind: string, n: number): string {
  return `${kind}:${n}`;
}

/**
 * Часы для обработчиков: сколько заняла задача и ключ нового подхода.
 * Время берётся только в ответ на действие ученика, при отрисовке
 * часы не спрашиваются — иначе разметка сервера и браузера разошлись
 * бы. Вынесено сюда, чтобы линтер чистоты отрисовки видел обычный
 * вызов, а не Date.now() внутри компонента.
 */
export function seychas(): number {
  return Date.now();
}
