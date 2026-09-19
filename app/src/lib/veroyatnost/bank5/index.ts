/**
 * Банк задания №5: двенадцать прототипов по типам, утверждённым
 * автором, — задачи 1–58 задачника Е. А. Ширяевой «ЕГЭпроф 2025».
 *
 * Порядок — порядок задачника и порядок блоков в blocks.ts. У каждого
 * прототипа исходные варианты из задачника и десять сгенерированных.
 */

import { type Prototype } from '../types';
import { DEREVO } from './derevo';
import { FORMULY } from './formuly';
import { TABLITSA } from './tablitsa';
import { UDOBNOE } from './udobnoe';

const PO_ID = new Map([...FORMULY, ...UDOBNOE, ...TABLITSA, ...DEREVO].map((p) => [p.id, p]));

function po(id: string): Prototype {
  const p = PO_ID.get(id);
  if (p === undefined) {
    throw new Error(`В банке №5 нет прототипа ${id}`);
  }
  return p;
}

export const BANK_5: readonly Prototype[] = [
  'p5-01',
  'p5-02',
  'p5-03',
  'p5-04',
  'p5-05',
  'p5-06',
  'p5-07',
  'p5-08',
  'p5-09',
  'p5-10',
  'p5-11',
  'p5-12',
].map(po);
