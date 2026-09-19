import type { Zadanie } from '@/content/veroyatnost';
import { METODY_4, METODY_5, type Method } from '@/lib/veroyatnost/model';
import type { PoolKind } from '@/lib/veroyatnost/pool';

/** Каталог методов задания: пять у №4, шесть у №5. */
export function metodyZadaniya(zadanie: Zadanie) {
  return zadanie === 4 ? METODY_4 : METODY_5;
}

/** Метод прототипа: он один на все варианты, поэтому берётся с первого. */
export function metodKind(kind: PoolKind): Method | undefined {
  return kind.variants[0]?.model?.method;
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
