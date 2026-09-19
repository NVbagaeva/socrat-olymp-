/**
 * Пул подготовки: блоки с зафиксированными вариантами, запечатанные
 * на сборке. Модуль только серверный: ответы дальше не идут.
 *
 * Импорт node:fs — страховка, как у lib/veroyatnost/pool.ts: модуль
 * с ним не соберётся в клиентский бандл, и случайно утащить пул в
 * браузер нельзя.
 */

import fs from 'node:fs';
import { typeset } from '../../tex';
import { PREP_BLOCKS } from './blocks';
import { fixedSeed } from './generate';
import { sealPrep, type PrepSealed } from './seal';

export interface PrepPoolBlock {
  id: string;
  slug: string;
  no: string;
  nazvanie: string;
  lead: string;
  formulaHtml: string;
  formulyHtml: string[];
  zadachi: (PrepSealed & { no: number })[];
}

export function prepPool(): PrepPoolBlock[] {
  if (!fs.existsSync(process.cwd())) {
    throw new Error('Пул подготовки собирается только на сервере');
  }
  return PREP_BLOCKS.map((block) => ({
    id: block.id,
    slug: block.slug,
    no: block.no,
    nazvanie: block.nazvanie,
    lead: block.lead,
    formulaHtml: typeset(`$${block.formula}$`),
    formulyHtml: block.formuly.map((f) => typeset(`$${f}$`)),
    zadachi: block.zadachi.map((micro, i) => ({ ...sealPrep(micro, fixedSeed(micro)), no: i + 1 })),
  }));
}
