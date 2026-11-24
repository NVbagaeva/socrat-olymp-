/**
 * Картинки к задачам №10 по ЕГЭ-2027 (раздел хранения 11, текстовые
 * задачи). Картинка рисуется на сюжет: одна на все задачи с тем же
 * сюжетом и другими числами (lib/kartinkiZadach.ts, файлы —
 * public/images/zadachi/10/).
 *
 * Ключ сюжета задачи:
 *   — аналог из пула — по его номеру («ДП-07-a01»):
 *     data/kartinki-analogov-11.json (klyuchAnaloga11);
 *   — задача банка и генератора — по подтипу и, где у подтипа несколько
 *     шаблонов текста, по параметру `form` (`kto` у ДП-09): SYUZHET_PODTIPA_11.
 * Разминка (РЗ) картинок не получает. План и журнал —
 * docs/plans/kartinki-k-zadacham.md.
 */

import { kartinkaSyuzheta, type KartinkaZadachi } from '../kartinkiZadach';
import KARTINKI_ANALOGOV from '@/data/kartinki-analogov-11.json';
import type { Params } from './types';

/** Подтип → ключ сюжета; у подтипов с шаблонами — по `form`/`kto` ('' — остальные). */
export const SYUZHET_PODTIPA_11: Readonly<
  Record<string, string | Readonly<Record<string, string>>>
> = {
  'PR-01': 'pr-01-tax-citizen',
  'PR-03': 'pr-03-shares',
  'PR-04': 'pr-04-shirts-jacket',
  'PR-05': 'pr-05-student-daughter',
  'PR-06': { holodilnik: 'pr-06-fridge', vklad: 'pr-06-bank-deposits' },
  'PR-07': 'pr-07-car-faster',
  'SM-01': 'sm-01-vessel',
  'SM-02': 'sm-02-equal-solutions',
  'SM-03': 'sm-03-juices',
  'SM-04': 'sm-04-two-alloys-ingots',
  'SM-05': 'sm-05-two-alloys-melt',
  'SM-06': { izyum: 'sm-06-grapes-raisins', pyure: 'sm-06-potato-flakes' },
  'SM-07': 'sm-07-acid-vessels',
  'SM-08': 'sm-08-lab-two-solutions-water',
  'SM-09': 'sm-09-lab-water-or-solution',
  'DP-01': 'dp-01-runner',
  'DP-02': 'dp-02-car',
  'DP-03': 'dp-03-car',
  'DP-04': 'dp-04-car',
  'DP-05': 'dp-05-hiker',
  'DP-06': 'dp-06-cars',
  'DP-07': { velo: 'dp-07-cyclist', barzha: 'dp-07-barge-lake' },
  'DP-08': 'dp-08-cyclists',
  'DP-09': { avto: 'dp-09-car-cyclist', moto: 'dp-09-moto-cyclist' },
  'DP-10': 'dp-10-car-moto',
  'DP-11': 'dp-11-moto-cyclist',
  'DP-12': 'dp-12-cars',
  'DP-13': 'dp-13-motor-ships',
  'PT-01': { tonnel: 'pt-01-tunnel', lesopolosa: 'pt-01-forest-belt' },
  'PT-02': 'pt-02-trains-opposite',
  'PT-03': 'pt-03-trains-overtaking',
  'PT-04': 'pt-04-two-ships-swap',
  'VD-01': 'vd-01-motor-ship',
  'VD-02': 'vd-02-motor-ship',
  'VD-03': 'vd-03-motor-ship',
  'VD-04': 'vd-04-motorboat',
  'VD-05': {
    kater: 'vd-05-cutter',
    barzha: 'vd-05-barge',
    lodka: 'vd-05-motorboat',
    baidarka: 'vd-05-kayak',
  },
  'VD-06': 'vd-06-raft-yacht',
  'VD-07': 'vd-07-cutter',
  'OK-01': 'ok-01-cars',
  'OK-02': 'ok-02-race-cars',
  'OK-03': 'ok-03-moto-cyclist',
  'RB-01': 'rb-01-workshop-parts',
  'RB-02': 'rb-02-workshop-parts',
  'RB-03': 'rb-03-tank',
  'RB-06': 'rb-06-tank',
  'RB-04': { mastera: 'rb-04-masters-order', nasosy: 'rb-04-pumps-tank' },
  'RB-05': 'rb-05-weeding',
  'RB-07': 'rb-07-fence',
  'PG-01': { ulitka: 'pg-01-snail', vasya: 'pg-01-problems' },
};

const ANALOGI = KARTINKI_ANALOGOV as Readonly<Record<string, string>>;

/** Ключ сюжета аналога по его номеру; нет — у аналога картинки нет. */
export function klyuchAnaloga11(kod: string): string | undefined {
  return ANALOGI[kod];
}

/** Ключ сюжета задачи банка или генератора по подтипу и параметрам. */
export function klyuchPodtipa11(podtip: string, params?: Params): string | undefined {
  const z = SYUZHET_PODTIPA_11[podtip];
  if (z === undefined || typeof z === 'string') {
    return z;
  }
  const form = String(params?.form ?? params?.kto ?? '');
  return z[form] ?? z[''];
}

/** Картинка сюжета: по ключу задачи (у аналога) или по подтипу. */
export function kartinka11(
  podtip: string,
  params?: Params,
  klyuch?: string,
): KartinkaZadachi | undefined {
  return kartinkaSyuzheta(10, klyuch ?? klyuchPodtipa11(podtip, params));
}
