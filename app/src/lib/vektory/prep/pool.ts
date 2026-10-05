/**
 * Пул тренировок навыков: блоки с зафиксированными вариантами,
 * запечатанные на сборке. Модуль только серверный: ответы дальше не
 * идут. Импорт node:fs — страховка, как у №4 и №8: модуль с ним не
 * соберётся в клиентский бандл.
 */

import fs from 'node:fs';
import { typeset } from '../../tex';
import { BLOKI } from './bloki';
import { fixedSeed } from './generate';
import { sealMikro, type MikroSealed } from './seal';

export interface PoolBlok {
  id: string;
  slug: string;
  no: string;
  nazvanie: string;
  lead: string;
  formulaHtml: string;
  formulyHtml: string[];
  zadachi: (MikroSealed & { no: number })[];
}

export function prepPool2(): PoolBlok[] {
  if (!fs.existsSync(process.cwd())) {
    throw new Error('Пул тренировок собирается только на сервере');
  }
  return BLOKI.map((b) => ({
    id: b.id,
    slug: b.slug,
    no: b.no,
    nazvanie: b.nazvanie,
    lead: b.lead,
    formulaHtml: typeset(`$${b.formula}$`),
    formulyHtml: b.formuly.map((f) => typeset(`$${f}$`)),
    zadachi: b.zadachi.map((m, i) => ({ ...sealMikro(m, fixedSeed(m)), no: i + 1 })),
  }));
}
