/**
 * Пул опорных задач №9: блоки с зафиксированными вариантами,
 * запечатанные на сборке. Модуль только серверный: ответы дальше не
 * идут. Импорт node:fs — страховка, как у №2 и №8: модуль с ним не
 * соберётся в клиентский бандл. Пока в блоке нет микрозадач, его
 * список пуст — страницы от этого не падают.
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
  zapomniHtml: string[];
  zadachi: (PrepSealed & { no: number })[];
}

export function prepPool9(): PrepPoolBlock[] {
  if (!fs.existsSync(process.cwd())) {
    throw new Error('Пул опорных задач собирается только на сервере');
  }
  return PREP_BLOCKS.map((block) => ({
    id: block.id,
    slug: block.slug,
    no: block.no,
    nazvanie: block.nazvanie,
    lead: block.lead,
    zapomniHtml: block.zapomni.map((line) => typeset(line)),
    zadachi: block.zadachi.map((micro, i) => ({ ...sealPrep(micro, fixedSeed(micro)), no: i + 1 })),
  }));
}
