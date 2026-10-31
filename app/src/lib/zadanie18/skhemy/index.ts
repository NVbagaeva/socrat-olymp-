/**
 * Реестр живых чертежей ключевых схем №18: id схемы → сцена движка
 * lib/skhemy. Тексты схем — content/zadanie18/.
 */

import type { ZhivayaSkhema } from '@/lib/skhemy/tipy';
import { BISSEKTRISA } from './bissektrisa';
import { MEDIANA } from './mediana';
import { RAVNYE_UGLY } from './ravnyeUgly';
import { SEKUSHCHIE } from './sekushchie';
import { PRYAMYE_UGLY } from './pryamyeUgly';
import { SREDLIN_TRAP } from './sredlinTrap';
import { SREDLIN_TREUG } from './sredlinTreug';
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
