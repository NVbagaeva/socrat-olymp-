/**
 * Пул «Опорных задач» №11: блоки с зафиксированными вариантами,
 * запечатанные на сборке. Модуль только серверный: ответы дальше не
 * идут. Импорт node:fs — страховка, как у №2: модуль с ним не
 * соберётся в клиентский бандл.
 */

import fs from 'node:fs';
import { typesetKrupno as typeset } from '../../tex';
import { BLOKI } from './bloki';
import { fixedSeed } from './generate';
import { sealMikro11, type MikroSealed11 } from './seal';
import type { RazdelBloka } from './types';

export interface PoolBlok11 {
  id: string;
  slug: string;
  no: string;
  razdel: RazdelBloka;
  nazvanie: string;
  lead: string;
  zachem: string;
  /** «Теория к этому блоку», свёрстана. */
  teoriyaHtml: string[];
  teoriyaRazdel: string;
  zapomniHtml: string[];
  zadachi: (MikroSealed11 & { no: number })[];
}

export function prepPool11(): PoolBlok11[] {
  if (!fs.existsSync(process.cwd())) {
    throw new Error('Пул опорных задач собирается только на сервере');
  }
  return BLOKI.map((b) => ({
    id: b.id,
    slug: b.slug,
    no: b.no,
    razdel: b.razdel,
    nazvanie: b.nazvanie,
    lead: b.lead,
    zachem: b.zachem,
    teoriyaHtml: b.teoriya.map((z) => typeset(z)),
    teoriyaRazdel: b.teoriyaRazdel,
    zapomniHtml: b.zapomni.map((z) => typeset(z)),
    zadachi: b.zadachi.map((m, i) => ({ ...sealMikro11(m, fixedSeed(m)), no: i + 1 })),
  }));
}
