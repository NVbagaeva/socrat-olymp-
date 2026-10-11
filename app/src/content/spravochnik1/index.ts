/**
 * Справочник по планиметрии (задание №1): все разделы по порядку и
 * поиск по ним. Устройство данных — ./tipy.ts.
 */

import { R01_UGLY } from './r01-ugly';
import { R02_TREUGOLNIK } from './r02-treugolnik';
import { R03_ELEMENTY } from './r03-elementy';
import { R04_PRYAMOUGOLNYY } from './r04-pryamougolnyy';
import { R05_PODOBIE } from './r05-podobie';
import { R06_PLOSHCHADI } from './r06-ploshchadi';
import { R07_SINUSY_KOSINUSY } from './r07-sinusy-kosinusy';
import { R08_CHETYREHUGOLNIKI } from './r08-chetyrehugolniki';
import { R09_OKRUZHNOST } from './r09-okruzhnost';
import { R10_VPISANNYE } from './r10-vpisannye';
import { R11_FAKTY } from './r11-fakty';
import type { Razdel1, Tema1 } from './tipy';

export * from './tipy';

export const RAZDELY_SPRAVOCHNIKA_1: readonly Razdel1[] = [
  R01_UGLY,
  R02_TREUGOLNIK,
  R03_ELEMENTY,
  R04_PRYAMOUGOLNYY,
  R05_PODOBIE,
  R06_PLOSHCHADI,
  R07_SINUSY_KOSINUSY,
  R08_CHETYREHUGOLNIKI,
  R09_OKRUZHNOST,
  R10_VPISANNYE,
  R11_FAKTY,
];

/** Все карточки по порядку справочника. */
export const TEMY_SPRAVOCHNIKA_1: readonly Tema1[] = RAZDELY_SPRAVOCHNIKA_1.flatMap((r) => r.temy);

export function temaSpravochnika1(id: string): Tema1 | undefined {
  return TEMY_SPRAVOCHNIKA_1.find((t) => t.id === id);
}

/** Карточки, которые ссылаются на прототип (блок «Где на ЕГЭ»). */
export function temyPrototipa1(proto: number): Tema1[] {
  return TEMY_SPRAVOCHNIKA_1.filter((t) => t.prototipy.includes(proto));
}

/** Старый якорь прежней теории → новая карточка. */
export function novayaTema1(staryyId: string): Tema1 | undefined {
  return (
    temaSpravochnika1(staryyId) ??
    TEMY_SPRAVOCHNIKA_1.find((t) => t.zamenyaet?.includes(staryyId) === true)
  );
}
