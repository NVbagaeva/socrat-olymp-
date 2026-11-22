#!/usr/bin/env node
/* scripts/build-avtor-miniatyura.mjs — миниатюра фото автора для плашки
   «Наталия Багаева — учитель математики, эксперт ГИА» (тарифы, главная).

   Фото — то же, что на «Об авторе» (public/images/author/
   nata-portrait-large.webp), без правок: только квадратная обрезка по
   лицу и уменьшение. Круг или скругление делает CSS. Фон остаётся
   прозрачным, как у исходника.

   Запуск: node scripts/build-avtor-miniatyura.mjs */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'public/images/author/nata-portrait-large.webp');
const OUT = path.join(ROOT, 'public/images/author');

/* Квадрат по лицу в исходнике 874 px шириной. */
const KADR = { left: 205, top: 20, width: 530, height: 530 };

for (const size of [96, 192]) {
  const file = path.join(OUT, `nata-miniatyura-${size}.webp`);
  const info = await sharp(SRC)
    .extract(KADR)
    .resize(size, size)
    .webp({ quality: 82, alphaQuality: 90, effort: 6 })
    .toFile(file);
  console.log(path.relative(ROOT, file), `${Math.round(info.size / 1024)} КБ`);
}
