#!/usr/bin/env node
/* scripts/build-oferta.mjs — текст оферты для вычитки с телефона
   (docs/oferta.md): src/content/legal/oferta.md с подставленными
   реквизитами, сроками и ценами из конфига тарифов — ровно то, что
   покажет страница /oferta/.

   Запуск: pnpm build:oferta. pnpm test:oferta падает, если файл
   отстал от кода. */

import fs from 'node:fs';
import path from 'node:path';
import { APP, requireSrc } from './lib/load-ts.mjs';

const { zapolnitOfertu } = requireSrc('lib/legal/oferta.ts');
const { prodavets, prodavetsFilled } = requireSrc('lib/legal/prodavets.ts');
const { ofertaDoc } = requireSrc('content/legal/documents.ts');

export const OFERTA_DOCS = path.join(APP, '..', 'docs', 'oferta.md');

export function sobratOfertu() {
  const tekst = zapolnitOfertu(
    fs.readFileSync(path.join(APP, 'src', 'content', 'legal', 'oferta.md'), 'utf8'),
  )
    /* В файле для вычитки разделы — заголовки второго уровня. */
    .replace(/^### /gm, '## ');
  const shapka = [
    `# ${ofertaDoc.title}`,
    '',
    `Редакция от ${prodavets.dataOferty}`,
    '',
    prodavetsFilled
      ? '> Файл собран из кода (`app/src/content/legal/oferta.md`); если код и файл разойдутся, верен код.'
      : '> **Черновик на вычитку.** [ИНН] и [ПОЧТА] подставятся из `app/src/content/legal/prodavets.json`. Цены и сроки — из конфига тарифов. Файл собран из кода (`app/src/content/legal/oferta.md`); если код и файл разойдутся, верен код.',
    '',
  ].join('\n');
  return `${shapka}\n${tekst.trimEnd()}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fs.writeFileSync(OFERTA_DOCS, sobratOfertu());
  console.log(`Записано: ${path.relative(path.join(APP, '..'), OFERTA_DOCS)}`);
}
