import type { Zadanie } from '@/content/veroyatnost';
import { OPORNYE_4 } from '@/lib/veroyatnost/metody4';
import { METODY_5 } from '@/lib/veroyatnost/metody5';
import type { PoolKind } from '@/lib/veroyatnost/pool';

/**
 * Навык тренажёра — то, по чему выбирают тренировку, считают прогресс
 * и что угадывают в «Узнай метод». Навык и блок банка — одно и то же:
 * у №4 это семь разделов списка Б (metody4.ts), у №5 — десять методов
 * автора (metody5.ts).
 *
 * Названия рисунков («Прямой пересчёт исходов», «Таблица исходов»)
 * навыками больше не бывают: рисунок — это как показать задачу, а не
 * каким методом её решают.
 */
export interface Navyk {
  id: string;
  nomer: number;
  nazvanie: string;
}

/** Навыки задания: семь разделов у №4, десять методов у №5. */
export function navykiZadaniya(zadanie: Zadanie): readonly Navyk[] {
  return zadanie === 4 ? OPORNYE_4 : METODY_5;
}

export function navykPoId(zadanie: Zadanie, id: string): Navyk | undefined {
  return navykiZadaniya(zadanie).find((n) => n.id === id);
}

/** Навык прототипа — его блок банка. */
export function navykKind(kind: PoolKind): string {
  return kind.blok;
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
