#!/usr/bin/env node
/* scripts/build-spravochnik-1.mjs — файл для вычитки справочника №1:
   docs/spravochnik-1/soderzhanie.md из данных app/src/content/spravochnik1.

   Запуск: pnpm build:spravochnik-1 */

import fs from 'node:fs';
import path from 'node:path';
import { APP } from './lib/load-ts.mjs';
import { soderzhanieMd } from './lib/spravochnik-1-md.mjs';

const FILE = path.join(APP, '..', 'docs', 'spravochnik-1', 'soderzhanie.md');
fs.mkdirSync(path.dirname(FILE), { recursive: true });
fs.writeFileSync(FILE, soderzhanieMd());
console.log(`записан ${path.relative(path.join(APP, '..'), FILE)}`);
