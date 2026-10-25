#!/usr/bin/env node
/* scripts/build-blanki.mjs — бланки ЕГЭ для блока «Бланки» (/variant/).

   Запуск: pnpm build:blanki <Бланки-ГГГГ.pdf> [ГГГГ]
           pnpm build:blanki ~/Downloads/Бланки-2027.pdf 2027

   Берёт общий PDF бланков (5 страниц в таком порядке: регистрация,
   ответы № 1, ответы № 2 лист 1, ответы № 2 лист 2, дополнительный № 2)
   и раскладывает его на отдельные файлы в app/public/blanki/<год>/ с
   именами из src/content/blanki.ts.

   Страницы исходника крупнее A4 (сканы с полями под 1011–1131 pt по
   ширине). Чтобы бланк печатался «на A4 в масштабе 100 %» без обрезки,
   каждая страница ставится на лист A4 целиком, с сохранением пропорций
   и по центру. Сами изображения не пересжимаются: страница исходника
   встраивается как есть (её JPEG-поток копируется в файл без изменений),
   меняется только размер листа и масштаб вывода.

   После запуска год нужно поменять в src/content/blanki.ts (BLANKI_YEAR). */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument } from 'pdf-lib';

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/* Имена файлов — те же, что в src/content/blanki.ts (BLANKI_FILES). */
const FILES = [
  'registraciya.pdf',
  'otvety-1.pdf',
  'otvety-2-list-1.pdf',
  'otvety-2-list-2.pdf',
  'dop-otvety-2.pdf',
];

/* A4 в пунктах. */
const A4 = [595.28, 841.89];

const [source, yearArg] = process.argv.slice(2);
if (source === undefined) {
  console.error('Укажите файл бланков: pnpm build:blanki <Бланки-ГГГГ.pdf> [ГГГГ]');
  process.exit(1);
}
const year = yearArg ?? String(new Date().getFullYear());
const out = path.join(APP, 'public', 'blanki', year);
fs.mkdirSync(out, { recursive: true });

const src = await PDFDocument.load(fs.readFileSync(source));
const pages = src.getPages();
if (pages.length !== FILES.length) {
  console.error(
    `В файле ${pages.length} стр., ожидалось ${FILES.length}: порядок — в шапке скрипта.`,
  );
  process.exit(1);
}

for (let i = 0; i < FILES.length; i += 1) {
  const doc = await PDFDocument.create();
  const [embedded] = await doc.embedPages([pages[i]]);
  const page = doc.addPage(A4);
  const scale = Math.min(A4[0] / embedded.width, A4[1] / embedded.height);
  const w = embedded.width * scale;
  const h = embedded.height * scale;
  page.drawPage(embedded, { x: (A4[0] - w) / 2, y: (A4[1] - h) / 2, width: w, height: h });
  doc.setTitle(`ЕГЭ-${year}: ${FILES[i].replace('.pdf', '')}`);
  doc.setCreator('Будет на ЕГЭ');
  /* Метаданные без даты сборки: файл не меняется от запуска к запуску. */
  doc.setCreationDate(new Date(`${year}-01-01T00:00:00Z`));
  doc.setModificationDate(new Date(`${year}-01-01T00:00:00Z`));
  const bytes = await doc.save();
  fs.writeFileSync(path.join(out, FILES[i]), bytes);
  console.log(
    `${FILES[i]}: ${Math.round(pages[i].getWidth())}×${Math.round(pages[i].getHeight())} pt → A4, ` +
      `масштаб ${(scale * 100).toFixed(1)} %, ${(bytes.length / 1024).toFixed(0)} КБ`,
  );
}
console.log(`Готово: ${path.relative(APP, out)}/`);
