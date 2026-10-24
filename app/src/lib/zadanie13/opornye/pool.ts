/**
 * Пул «Опорных задач» №13: блоки с задачами банка, запечатанными на
 * сборке. Модуль только серверный: ответы дальше не идут. Импорт
 * node:fs — страховка, как у №11: модуль с ним не соберётся в
 * клиентский бандл.
 */

import fs from 'node:fs';
import { typeset } from '../../tex';
import { BLOKI_13, zadachiBloka, type Blok13 } from './bloki';
import { sealZadacha13, type Zadacha13Sealed } from './seal';

export interface PoolBlok13 {
  id: string;
  slug: string;
  no: string;
  nazvanie: string;
  lead: string;
  vid: Blok13['vid'];
  zapomniHtml: string[];
  zadachi: (Zadacha13Sealed & { no: number })[];
}

export function prepPool13(): PoolBlok13[] {
  if (!fs.existsSync(process.cwd())) {
    throw new Error('Пул опорных задач собирается только на сервере');
  }
  return BLOKI_13.map((b) => ({
    id: b.id,
    slug: b.slug,
    no: b.no,
    nazvanie: b.nazvanie,
    lead: b.lead,
    vid: b.vid,
    zapomniHtml: b.zapomni.map((z) => typeset(z)),
    zadachi: zadachiBloka(b).map((z) => ({
      ...sealZadacha13(z.prototypeId, z.seed, b.vid, z.no),
      no: z.no,
    })),
  }));
}
