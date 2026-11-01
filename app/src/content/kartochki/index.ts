/* Сгенерировано scripts/build-kartochki.mjs — не править руками. */
import type { Koloda } from '@/lib/kartochki/tipy';
import k01 from './01-planimetriya';
import k02 from './02-vektory';
import k03 from './03-stereometriya';
import k18 from './18-klyuchevye-skhemy';

/** Все колоды по номеру задания. */
export const KOLODY: readonly Koloda[] = [k01, k02, k03, k18];

export function kolodaNomera(task: number): Koloda {
  const k = KOLODY.find((x) => x.task === task);
  if (k === undefined) throw new Error(`нет колоды карточек для №${task}`);
  return k;
}
