#!/usr/bin/env node
/* scripts/build-karta-fon.mjs — WebP-версии фона «Карты ЕГЭ».

   Запуск: pnpm build:karta-fon (после замены исходника).

   Исходник public/images/karta/fon-ishodnik.jpg не меняется. Из него
   делаются WebP нескольких ширин для телефона и компьютера; шире
   исходника версии не делаются — растягивание только мылит. Список
   получившихся ширин пишется в src/content/karta/fon.json: по нему
   карта собирает srcset и считает, до какого масштаба фон остаётся
   резким. Контуры островов лежат отдельно (kontury.json) в координатах
   1586 × 992 и от размера фона не зависят. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(APP, 'public', 'images', 'karta');
const SRC = path.join(DIR, 'fon-ishodnik.jpg');
const SHIRINY = [800, 1200, 1600, 2400, 3200, 4000];

const meta = await sharp(SRC).metadata();
const shiriny = [...new Set([...SHIRINY.filter((w) => w < meta.width), meta.width])];

for (const file of fs.readdirSync(DIR)) {
  if (/^fon-\d+\.webp$/.test(file)) fs.rmSync(path.join(DIR, file));
}
for (const w of shiriny) {
  const out = path.join(DIR, `fon-${w}.webp`);
  await sharp(SRC).resize({ width: w }).webp({ quality: 82, effort: 6 }).toFile(out);
  console.log(`fon-${w}.webp — ${Math.round(fs.statSync(out).size / 1024)} КБ`);
}
/* Крошечная размытая версия: видна, пока грузится настоящая. */
const zaglushka = await sharp(SRC).resize({ width: 32 }).blur(1.2).webp({ quality: 50 }).toBuffer();

fs.writeFileSync(
  path.join(APP, 'src', 'content', 'karta', 'fon.json'),
  JSON.stringify(
    {
      shirina: meta.width,
      vysota: meta.height,
      shiriny,
      zaglushka: `data:image/webp;base64,${zaglushka.toString('base64')}`,
    },
    null,
    2,
  ) + '\n',
);
console.log(`Исходник ${meta.width} × ${meta.height}; ширины: ${shiriny.join(', ')}`);
