/**
 * Банк заданий №4 и №5 по частям: оглавление на странице, задачи —
 * отдельными файлами.
 *
 * Раньше банк целиком (у №4 — 460 вариантов с закрытыми разборами и
 * подсказками, 15 МБ) уезжал пропсом клиентского компонента внутрь
 * HTML каждой страницы тренажёра и листа. Теперь в странице только
 * оглавление: прототипы с подписями и номера их вариантов. Сами
 * варианты лежат файлами сборки, по папке на прототип:
 *
 *   /zadaniya/4/dannye/<прототип>/<n>.json        — вариант отработки
 *   /zadaniya/4/dannye/uznay/<прототип>/<n>.json  — вариант «Узнай метод»
 *
 * Тренажёр и лист догружают только те задачи, что попали в подход
 * или на лист (zagruzka45.ts). Содержимое файла — тот же объект,
 * который раньше лежал в банке страницы (PoolVariant, UznayVariant),
 * байт в байт: выбор задач, проверка ответа и запись тренировки не
 * меняются. Файлы собирают маршруты app/zadaniya/{4,5}/dannye/.
 *
 * Модуль без Node и без KaTeX: его импортируют и страницы, и браузер.
 */

import type { Blok } from './blocks';
import type { PoolKind } from './pool';

/** Вариант в оглавлении: номер и версия файла (отпечаток содержимого). */
export interface IndeksVarianta {
  n: number;
  /** Версия файла: меняется вместе с задачей — старый файл из кеша не возьмётся. */
  v: string;
}

/** Прототип в оглавлении: всё открытое о нём, кроме самих вариантов. */
export type IndeksKind = Omit<PoolKind, 'variants'> & { variants: IndeksVarianta[] };

/** Оглавление банка отработки. */
export interface IndeksPool {
  bloki: readonly Blok[];
  kinds: IndeksKind[];
}

/** Прототип «Узнай метод» в оглавлении. */
export interface IndeksUznayKind {
  id: string;
  istochnik: 'prototip' | 'opornaya';
  variants: IndeksVarianta[];
}

export interface IndeksUznay {
  kinds: IndeksUznayKind[];
}

/**
 * Вариант в оглавлении листа: ещё и отпечаток условия. Выбору задач
 * листа (sheet4.ts) условие нужно только чтобы не повторять одно и то
 * же условие дважды — для этого хватает отпечатка, а условия всех
 * вариантов в страницу не едут.
 */
export interface IndeksVariantaLista extends IndeksVarianta {
  u: string;
}

export type IndeksKindLista = Omit<IndeksKind, 'variants'> & { variants: IndeksVariantaLista[] };

export interface IndeksLista {
  bloki: readonly Blok[];
  kinds: IndeksKindLista[];
}

/** Набор файлов: отработка или «Узнай метод». */
export type Nabor45 = 'bank' | 'uznay';

/** Соль отпечатка условия: та же у оглавления листа и у загруженного варианта. */
export const SOL_USLOVIYA = 'v45-u:';

/** Адрес файла варианта без версии — так его отдаёт маршрут сборки. */
export function putVarianta(zadanie: 4 | 5, nabor: Nabor45, kind: string, n: number): string {
  return nabor === 'uznay'
    ? `/zadaniya/${zadanie}/dannye/uznay/${kind}/${n}.json`
    : `/zadaniya/${zadanie}/dannye/${kind}/${n}.json`;
}

/** Адрес файла варианта с версией: так его запрашивает браузер. */
export function adresVarianta(
  zadanie: 4 | 5,
  nabor: Nabor45,
  kind: string,
  variant: IndeksVarianta,
): string {
  return `${putVarianta(zadanie, nabor, kind, variant.n)}?v=${variant.v}`;
}
