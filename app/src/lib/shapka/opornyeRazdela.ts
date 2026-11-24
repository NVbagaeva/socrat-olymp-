/**
 * Опорные задачи раздела для кольца прогресса в шапке.
 *
 * Для каждого раздела (по номеру хранения) — полный список опорных
 * задач, которые показывает его вкладка «Опорные задачи», в том же
 * виде ключей, каким хранилище раздела помнит решённые. Решённые
 * считает клиентский хук useOpornyeResheno (тот же номер хранения,
 * те же ключи).
 *
 * Кодировка ключей:
 *   - «id задачи» — id задачи банка, ключ outcomes в хранилище раздела
 *     (№3, №4, №5, №6, №7, №10, №14, №18, №21);
 *   - «блок:номер» — id блока и номер микрозадачи с единицы
 *     (№1, №2, №11, №13 — ключ outcomes; №8, №9 — хранилище «блок →
 *     номера решённых», хук разбирает ключ по последнему двоеточию).
 *
 * Список — те же блоки, что выводит вкладка (навыки раздела поверх
 * блоков данных), без повторов. Раздела без опорных задач нет —
 * null: №12 (хаб «Графики функций», вкладки нет), №15 и №16
 * (заглушки), №19 (опорные — разобранные примеры, отметки «решено»
 * у них нет), №17 и №20 (раздела нет).
 *
 * Модуль серверный: только данные, без React. Зовётся при сборке
 * из серверных компонентов.
 */

import { NAVYKI1 } from '@/content/planimetriya1';
import { NAVYKI2 } from '@/content/vektory2';
import { NAVYKI3 } from '@/content/zadanie3/navyki';
import { NAVYKI4 } from '@/content/veroyatnost4';
import { NAVYKI5 } from '@/content/veroyatnost5';
import { NAVYKI6 } from '@/content/sluchainye6';
import { NAVYKI7 } from '@/content/uravneniya7';
import { NAVYKI9 } from '@/content/proizvodnaya9';
import { NAVYKI10 } from '@/content/prikladnye10';
import { NAVYKI11 } from '@/content/tekstovye11';
import { OPORNYE_13 } from '@/content/zadanie13';
import { OPORNYE_18 } from '@/content/zadanie18/opornye';
import { NAVYKI21 } from '@/content/naibolshee21';
import { BLOKI as BLOKI_1 } from '@/lib/planimetriya/prep/bloki';
import { BLOKI as BLOKI_2 } from '@/lib/vektory/prep/bloki';
import { BLOKI_3, zadachiBloka as zadachiBloka3 } from '@/lib/stereo/opornye3/bloki';
import { PODGOTOVKA_4 } from '@/lib/veroyatnost/podgotovka4';
import { PODGOTOVKA_5 } from '@/lib/veroyatnost/podgotovka5';
import { BLOKI_OPORNYH as BLOKI_6 } from '@/lib/zadanie6/opornye';
import { BLOKI_OPORNYH as BLOKI_7 } from '@/lib/zadanie7/opornye';
import { PREP_BLOCKS as BLOKI_8 } from '@/lib/vychisleniya/prep/blocks';
import { PREP_BLOCKS as BLOKI_9 } from '@/lib/proizvodnaya/prep/blocks';
import { BLOKI_OPORNYH as BLOKI_10 } from '@/lib/zadanie10/opornye';
import { BLOKI as BLOKI_11 } from '@/lib/zadanie11/prep/bloki';
import { BLOKI_13, zadachiBloka as zadachiBloka13 } from '@/lib/zadanie13/opornye/bloki';
import { BLOKI_14 } from '@/lib/zadanie14/opornye';
import { BLOKI_OPORNYH21 as BLOKI_21 } from '@/lib/zadanie21/opornye';

export interface OpornyeRazdela {
  /** Сколько опорных задач в разделе (= ids.length). */
  vsego: number;
  /** Ключи задач в кодировке хранилища раздела (см. начало файла). */
  ids: readonly string[];
}

/** Ключи «блок:номер» для блока из n задач. */
function poNomeram(blok: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => `${blok}:${i + 1}`);
}

/** Блоки в порядке навыков: только те, что есть в данных. */
function poNavykam<B>(slugi: readonly string[], najti: (slug: string) => B | undefined): B[] {
  return slugi.flatMap((slug) => {
    const b = najti(slug);
    return b === undefined ? [] : [b];
  });
}

function sobrat(hranenie: number): string[] | null {
  switch (hranenie) {
    case 1:
      return poNavykam(
        NAVYKI1.flatMap((n) => n.bloki.map((b) => b.slug)),
        (slug) => BLOKI_1.find((b) => b.slug === slug),
      ).flatMap((b) => poNomeram(b.id, b.zadachi.length));
    case 2:
      return poNavykam(
        NAVYKI2.flatMap((n) => n.bloki.map((b) => b.slug)),
        (slug) => BLOKI_2.find((b) => b.slug === slug),
      ).flatMap((b) => poNomeram(b.id, b.zadachi.length));
    case 3:
      return poNavykam(
        NAVYKI3.flatMap((n) => n.bloki),
        (slug) => BLOKI_3.find((b) => b.slug === slug && b.gotov),
      ).flatMap((b) => zadachiBloka3(b.id).map((z) => z.id));
    case 4:
      return poNavykam(
        NAVYKI4.flatMap((n) => n.bloki),
        (id) => PODGOTOVKA_4.find((b) => b.id === id),
      ).flatMap((b) => b.zadachi.map((z) => z.id));
    case 5:
      return poNavykam(
        NAVYKI5.flatMap((n) => n.bloki.map((b) => b.id)),
        (id) => PODGOTOVKA_5.find((b) => b.id === id),
      ).flatMap((b) => b.zadachi.map((z) => z.id));
    case 6:
      return poNavykam(
        NAVYKI6.flatMap((n) => n.bloki.map((b) => b.slug)),
        (slug) => BLOKI_6.find((b) => b.slug === slug),
      ).flatMap((b) => b.zadachi.map((z) => z.id));
    case 7:
      return poNavykam(
        NAVYKI7.flatMap((n) => n.bloki.map((b) => b.slug)),
        (slug) => BLOKI_7.find((b) => b.slug === slug),
      ).flatMap((b) => b.zadachi.map((z) => z.id));
    case 8:
      /* Вкладка №8 показывает все блоки подготовки. */
      return BLOKI_8.flatMap((b) => poNomeram(b.id, b.zadachi.length));
    case 9:
      return poNavykam(
        NAVYKI9.flatMap((n) => n.bloki.map((b) => b.slug)),
        (slug) => BLOKI_9.find((b) => b.slug === slug),
      ).flatMap((b) => poNomeram(b.id, b.zadachi.length));
    case 10:
      return poNavykam(
        NAVYKI10.flatMap((n) => n.bloki.map((b) => b.slug)),
        (slug) => BLOKI_10.find((b) => b.slug === slug),
      ).flatMap((b) => b.zadachi.map((z) => z.id));
    case 11:
      return poNavykam(
        NAVYKI11.flatMap((n) => n.bloki.map((b) => b.slug)),
        (slug) => BLOKI_11.find((b) => b.slug === slug),
      ).flatMap((b) => poNomeram(b.id, b.zadachi.length));
    case 13:
      return poNavykam(
        OPORNYE_13.gruppy.flatMap((g) => g.bloki),
        (no) => BLOKI_13.find((b) => b.no === no),
      ).flatMap((b) => zadachiBloka13(b).map((z) => `${b.id}:${z.no}`));
    case 14:
      return BLOKI_14.flatMap((b) => b.zadachi.map((z) => z.id));
    case 18:
      return OPORNYE_18.map((o) => o.id);
    case 21:
      return poNavykam(
        NAVYKI21.flatMap((n) => n.bloki.map((b) => b.slug)),
        (slug) => BLOKI_21.find((b) => b.slug === slug),
      ).flatMap((b) => b.zadachi.map((z) => z.id));
    default:
      return null;
  }
}

const KESH = new Map<number, OpornyeRazdela | null>();

/**
 * Опорные задачи раздела по номеру хранения; null — у раздела их нет.
 */
export function opornyeRazdela(hranenie: number): OpornyeRazdela | null {
  const gotovo = KESH.get(hranenie);
  if (gotovo !== undefined) return gotovo;
  const spisok = sobrat(hranenie);
  const itog =
    spisok === null || spisok.length === 0
      ? null
      : (() => {
          const ids = [...new Set(spisok)];
          return { vsego: ids.length, ids };
        })();
  KESH.set(hranenie, itog);
  return itog;
}
