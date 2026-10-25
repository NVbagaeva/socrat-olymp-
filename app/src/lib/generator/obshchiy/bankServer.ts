/**
 * Индекс банка раздела на сервере — для конфига генератора: сколько
 * исходных задач у прототипа. Тот же файл public/data/…/indeks.json,
 * что грузит браузер.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { ZadachaBanka } from './bank';

export function indeksBanka(papka: string): ZadachaBanka[] {
  const file = path.join(process.cwd(), 'public', papka, 'indeks.json');
  return JSON.parse(fs.readFileSync(file, 'utf8')) as ZadachaBanka[];
}
