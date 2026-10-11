/**
 * Пул тренировок навыков: блоки с зафиксированными вариантами,
 * запечатанные на сборке. Модуль только серверный: ответы дальше не
 * идут (import node:fs — страховка, как у №2 и №8).
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
  formulyHtml: string[];
  zadachi: (MikroSealed & { no: number })[];
}

let kesh: PoolBlok[] | null = null;

export function prepPool1(): PoolBlok[] {
  if (!fs.existsSync(process.cwd())) {
    throw new Error('Пул тренировок собирается только на сервере');
  }
  if (kesh !== null) return kesh;
  kesh = BLOKI.map((b) => ({
    id: b.id,
    slug: b.slug,
    no: b.no,
    nazvanie: b.nazvanie,
    lead: b.lead,
    formulyHtml: b.formuly.map((f) => typeset(`$${f}$`)),
    zadachi: b.zadachi.map((m, i) => ({ ...sealMikro(m, fixedSeed(m.id)), no: i + 1 })),
  }));
  return kesh;
}
