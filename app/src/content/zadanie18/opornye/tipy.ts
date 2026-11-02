/**
 * Шаблон опорной задачи №18. Задачи составлены для сайта в духе
 * задания 18 профильного ЕГЭ: условие с пунктами а) «докажите» и
 * б) «найдите», чертёж (lib/zadanie18/opornye), ключевые схемы,
 * из которых собрано решение, и решение по шагам.
 *
 * Строки — с формулами в долларах (lib/razmetka.ts). У шага решения —
 * группы подсветки чертежа, как у шагов доказательства схемы.
 * Утверждение а) и ответ б) проверены численно:
 * scripts/verify_opornye18 (pnpm test:opornye-18).
 */

import type { Gruppa18, Podsvechennoe } from '../tipy';

export interface SkhemaVZadache {
  /** id ключевой схемы из content/zadanie18/spisok.ts. */
  id: string;
  /** Чем схема помогает в этой задаче. */
  zachem: string;
}

/** Подсказка-вопрос перед решением: вопрос виден, ответ — по кнопке. */
export interface Podskazka18 {
  vopros: string;
  otvet: string;
}

/** «Важно» — правило сайта: только вместе с конкретным примером. */
export interface Vazhno18 {
  tekst: string;
  primer: string;
}

export interface Opornaya18 {
  id: string;
  no: number;
  gruppa: Gruppa18;
  nazvanie: string;
  /** Общая часть условия. */
  uslovie: string;
  /** Пункт а): что доказать. */
  a: string;
  /** Пункт б): что найти и при каких данных. */
  b: string;
  skhemy: readonly SkhemaVZadache[];
  reshenieA: readonly Podsvechennoe[];
  reshenieB: readonly Podsvechennoe[];
  /** Ответ пункта б): формула в долларах. */
  otvet: string;
  /** Подсказки-вопросы перед решением (2–3). */
  podskazki?: readonly Podskazka18[];
  /** «Типичные ошибки» — 1–2 пункта. */
  oshibki?: readonly string[];
  /** «Важно» с примером. */
  vazhno?: Vazhno18;
  /** Вариация к опорной задаче с этим id: та же ключевая идея, другой вопрос. */
  variaciya?: string;
  /**
   * Откуда условие: нет — составлено для сайта; «kurs» — из курса
   * подготовки, решение написано заново и проверено вычислением.
   */
  istochnik?: 'kurs';
}
