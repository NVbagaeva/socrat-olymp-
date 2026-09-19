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
