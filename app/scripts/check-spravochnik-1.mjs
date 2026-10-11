#!/usr/bin/env node
/* scripts/check-spravochnik-1.mjs — справочник по планиметрии (№1).

   1. Самотест данных (lib/planimetriya/spravochnik-selftest.ts):
      карточки, «Где на ЕГЭ» покрывает прототипы 1–75, старые якоря
      ведут на новые карточки, ответы разборов совпадают с ответами
      задач банка и аналогов, обязательные пункты на месте, KaTeX
      набирает все тексты и формулы.
   2. Пересказ: ни одна фраза не совпадает с текстами сторонних
      источников больше чем на восемь слов подряд (тексты источников
      есть только локально, в _sources/; в CI шаг пропускается).
   3. Файл вычитки docs/spravochnik-1/soderzhanie.md совпадает с данными
      (иначе: pnpm build:spravochnik-1).

   Запуск: pnpm test:spravochnik-1 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { APP, requireSrc } from './lib/load-ts.mjs';
import { proveritPereskaz } from './lib/istochniki-1.mjs';
import { soderzhanieMd } from './lib/spravochnik-1-md.mjs';

const require = createRequire(import.meta.url);
const katex = require('katex');
const typeset = (tex) => katex.renderToString(tex, { throwOnError: true, strict: 'error' });

const { checkSpravochnik, tekstySpravochnika } = requireSrc(
  'lib/planimetriya/spravochnik-selftest.ts',
);

const itog = checkSpravochnik(typeset);
console.log(
  `справочник: ${itog.razdelov} разделов, ${itog.kartochek} карточек, ${itog.primerov} разборов, проблем ${itog.problems.length}`,
);

const pereskaz = proveritPereskaz(tekstySpravochnika(), 8);
if (pereskaz === null)
  console.log('пересказ: текстов источников нет на этой машине — сверка пропущена');
else console.log(`пересказ: совпадений с источниками длиннее 8 слов — ${pereskaz.length}`);

const FILE = path.join(APP, '..', 'docs', 'spravochnik-1', 'soderzhanie.md');
const fajl = fs.existsSync(FILE) ? fs.readFileSync(FILE, 'utf8') : '';
const svezhiy = fajl === soderzhanieMd();
console.log(`файл вычитки: ${svezhiy ? 'совпадает с данными' : 'устарел'}`);

const vse = [
  ...itog.problems,
  ...(pereskaz ?? []).map((x) => `совпадение с источником: ${x}`),
  ...(svezhiy ? [] : ['docs/spravochnik-1/soderzhanie.md устарел: pnpm build:spravochnik-1']),
];
if (vse.length > 0) {
  for (const p of vse) console.log(`  ✗ ${p}`);
  process.exit(1);
}
console.log('ок');
