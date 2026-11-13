/**
 * Реестр сборщиков ДЗ по разделам: одна форма на всех. Подключить
 * раздел — добавить сюда строку (и номер в RAZDELY_DZ каталога).
 * Модули грузятся лениво: при выдаче — только разделы этого ДЗ.
 */

import type { BlokKat, KatalogRazdela } from '../katalog/types';
import type { HwUnitInput } from '../types';

export interface SborshchikRazdela {
  /** Опорные строятся из зерна: аналоги, «каждому свои» имеет смысл. */
  opornyeIzZerna: boolean;
  trenazher(
    kat: KatalogRazdela,
    tipy: readonly string[],
    skolko: number,
    zerno: string,
    komu: readonly (string | null)[],
  ): Promise<HwUnitInput[]> | HwUnitInput[];
  zadacha(kat: KatalogRazdela, ref: string): Promise<HwUnitInput[]> | HwUnitInput[];
  opornye(
    blok: BlokKat,
    ids: readonly string[],
    zerno: string,
    komu: readonly (string | null)[],
  ): HwUnitInput[];
  /** Работа над ошибками в тренажёре: аналог задачи с ошибкой. */
  analogZadachi(
    kat: KatalogRazdela,
    ref: string,
    student: string,
    zerno: string,
    avoid: Set<string>,
  ): Promise<HwUnitInput | null> | HwUnitInput | null;
  /** Работа над ошибками в опорных: аналог (с зерном) или та же задача. */
  analogOpornoy(
    blok: BlokKat,
    kind: string,
    ref: string,
    zerno: string,
    student: string,
  ): HwUnitInput | null;
}

/** Банковый раздел: опорные без зерна — та же задача. */
function bankovyy(m: {
  trenazher: SborshchikRazdela['trenazher'];
  zadacha: SborshchikRazdela['zadacha'];
  analogZadachi: SborshchikRazdela['analogZadachi'];
  opornye: (blok: BlokKat, ids: readonly string[]) => HwUnitInput[];
  opornaya: (blok: BlokKat, id: string, student: string | null) => HwUnitInput | null;
}): SborshchikRazdela {
  return {
    opornyeIzZerna: false,
    trenazher: m.trenazher,
    zadacha: m.zadacha,
    analogZadachi: m.analogZadachi,
    opornye: (blok, ids) => m.opornye(blok, ids),
    analogOpornoy: (blok, kind, _ref, _zerno, student) => m.opornaya(blok, kind, student),
  };
}

export const SBORSHCHIKI: Record<number, () => Promise<SborshchikRazdela>> = {
  6: () =>
    import('./r6').then((m) =>
      bankovyy({
        trenazher: m.trenazher6,
        zadacha: m.zadacha6,
        analogZadachi: m.analogZadachi6,
        opornye: m.opornye6,
        opornaya: m.opornaya6,
      }),
    ),
  7: () =>
    import('./r7').then((m) =>
      bankovyy({
        trenazher: m.trenazher7,
        zadacha: m.zadacha7,
        analogZadachi: m.analogZadachi7,
        opornye: m.opornye7,
        opornaya: m.opornaya7,
      }),
    ),
  8: () =>
    import('./r8').then(
      (m): SborshchikRazdela => ({
        opornyeIzZerna: true,
        trenazher: (kat, tipy, skolko, _zerno, komu) => m.trenazher8(kat, tipy, skolko, komu),
        zadacha: m.zadacha8,
        analogZadachi: (kat, ref, student, _zerno, avoid) => m.analogZadachi8(kat, ref, student, avoid),
        opornye: m.opornye8,
        analogOpornoy: (blok, _kind, ref, zerno, student) => m.analogOpornoy8(blok, ref, zerno, student),
      }),
    ),
  10: () =>
    import('./r10').then((m) =>
      bankovyy({
        trenazher: m.trenazher10,
        zadacha: m.zadacha10,
        analogZadachi: m.analogZadachi10,
        opornye: m.opornye10,
        opornaya: m.opornaya10,
      }),
    ),
};

/** Разделы, где опорные строятся из зерна (для «Каждому свои» без загрузки модуля). */
export const OPORNYE_IZ_ZERNA: ReadonlySet<number> = new Set([8]);
