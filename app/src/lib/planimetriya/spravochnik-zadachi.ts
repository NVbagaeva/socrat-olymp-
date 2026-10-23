/**
 * Задачи разборов справочника №1: условие и ответ задачи, которую
 * разбирает пример (банк, аналог или свой), и число из ответа в TeX.
 * Нужны и странице справочника, и его самотесту.
 */

import type { Primer } from '../../content/spravochnik1/tipy';
import { analogi } from './bank/analogi';
import { BANK_FIPI } from './bank/fipi';
import { PROTOTIPY } from './stseny';
import type { Params } from './stseny/dsl';

/** Условие и ответ задачи, которую разбирает пример. */
export function zadachaPrimera(p: Primer): {
  uslovie: string;
  otvet: number | null;
  proto: number | null;
  metka: string;
} {
  const ist = p.istochnik;
  if ('svoy' in ist)
    return { uslovie: ist.svoy.uslovie, otvet: null, proto: null, metka: 'свой пример' };
  if ('fipi' in ist) {
    const z = BANK_FIPI.find((x) => x.n === ist.fipi);
    if (z === undefined) throw new Error(`нет задачи ${ist.fipi} в банке`);
    const pr = PROTOTIPY.find((x) => x.id === z.proto);
    if (pr === undefined) throw new Error(`нет прототипа ${z.proto}`);
    const params = { ...pr.primer, ...z.params } as Params;
    return {
      uslovie: pr.uslovie(params),
      otvet: pr.otvet(params),
      proto: z.proto,
      metka: `открытый банк, задача ${z.n}`,
    };
  }
  const { proto, no } = ist.analog;
  const pr = PROTOTIPY.find((x) => x.id === proto);
  if (pr === undefined) throw new Error(`нет прототипа ${proto}`);
  const a = analogi(proto).find((x) => x.no === no);
  if (a === undefined) throw new Error(`нет аналога ${no} прототипа ${proto}`);
  const params = { ...pr.primer, ...a.params } as Params;
  return {
    uslovie: pr.uslovie(params),
    otvet: pr.otvet(params),
    proto,
    metka: `аналог ${no} прототипа ${proto}, не из открытого банка`,
  };
}

/** Число из ответа в TeX: «118^\circ» → 118, «1{,}5» → 1.5; null — не число. */
export function chisloOtveta(tex: string): number | null {
  const s = tex
    .replace(/\^\\circ/g, '')
    .replace(/\{,\}/g, '.')
    .trim();
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

