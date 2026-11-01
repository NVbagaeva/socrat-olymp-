/**
 * Реестр живых чертежей ключевых схем №18: id схемы → сцена движка
 * lib/skhemy. Тексты схем — content/zadanie18/.
 */

import type { ZhivayaSkhema } from '@/lib/skhemy/tipy';
import { BABOCHKA } from './babochka';
import { BISSEKTRISA } from './bissektrisa';
import { CHETYRE_TOCHKI } from './chetyreTochki';
import { MENELAY } from './menelay';
import { METOD_PLOSHCHADEY, OBSHCHAYA_VYSOTA, OBSHCHIY_UGOL, RELSY } from './ploshchadi';
import { RAVNOBOKAYA } from './ravnobokaya';
import { KASATELNAYA } from './kasatelnaya';
import { KASAYUSHCHIESYA } from './kasayushchiesya';
import { MEDIANA } from './mediana';
import { OBSHCHAYA_KASATELNAYA } from './obshchayaKasatelnaya';
import { OTREZKI_KASATELNYH } from './otrezkiKasatelnyh';
import { RAVNYE_UGLY } from './ravnyeUgly';
import { SEKUSHCHIE } from './sekushchie';
import { PRYAMYE_UGLY } from './pryamyeUgly';
import { SREDLIN_TRAP } from './sredlinTrap';
import { SREDLIN_TREUG } from './sredlinTreug';
import { STEPEN_TOCHKI } from './stepenTochki';
import { TREZUBEC } from './trezubec';
import { UGLY_DUGI } from './uglyDugi';
import { VPISANNYY } from './vpisannyy';
import { VYSOTY } from './vysoty';

const REESTR: Readonly<Record<string, ZhivayaSkhema>> = {
  vysoty: VYSOTY,
  bissektrisa: BISSEKTRISA,
  'udvoenie-mediany': MEDIANA,
  'dve-sekushchie': SEKUSHCHIE,
  'ravnye-ugly': RAVNYE_UGLY,
  'pryamye-ugly': PRYAMYE_UGLY,
  trezubec: TREZUBEC,
  'ugly-i-dugi': UGLY_DUGI,
  chetyrekhugolniki: VPISANNYY,
  'sredlin-treug': SREDLIN_TREUG,
  'sredlin-trap': SREDLIN_TRAP,
  'kasatelnaya-sekushchaya': KASATELNAYA,
  'otrezki-kasatelnyh': OTREZKI_KASATELNYH,
  kasayushchiesya: KASAYUSHCHIESYA,
  'obshchaya-kasatelnaya': OBSHCHAYA_KASATELNAYA,
  babochka: BABOCHKA,
  'chetyre-tochki': CHETYRE_TOCHKI,
  ravnobokaya: RAVNOBOKAYA,
  'menelay-cheva': MENELAY,
  'metod-ploshchadey': METOD_PLOSHCHADEY,
  'obshchaya-vysota': OBSHCHAYA_VYSOTA,
  'obshchiy-ugol': OBSHCHIY_UGOL,
  'relsy-evklida': RELSY,
  'stepen-tochki': STEPEN_TOCHKI,
};

export function zhivayaSkhema18(id: string): ZhivayaSkhema | undefined {
  return REESTR[id];
}

/** То же, но схема обязана быть: страницы строятся только для собранных. */
export function trebuetsyaSkhema18(id: string): ZhivayaSkhema {
  const s = REESTR[id];
  if (s === undefined) throw new Error(`Нет живого чертежа схемы ${id}`);
  return s;
}
