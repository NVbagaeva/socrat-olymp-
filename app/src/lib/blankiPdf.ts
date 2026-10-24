/**
 * Сборка бланков ЕГЭ в один PDF в браузере: страницы из app/public/blanki
 * по порядку, нужное число копий. pdf-lib копирует страницы как есть —
 * изображения не пересжимаются. Модуль грузится по нажатию кнопки
 * (динамический импорт), в первую загрузку страницы он не входит.
 */

import { PDFDocument } from 'pdf-lib';
import { BLANKI_FILES, type BlankPart } from '@/content/blanki';
import { blankUrl } from './blanki';

const loaded = new Map<BlankPart, Promise<ArrayBuffer>>();

function bytesOf(part: BlankPart): Promise<ArrayBuffer> {
  let p = loaded.get(part);
  if (p === undefined) {
    p = fetch(blankUrl(part)).then((r) => {
      if (!r.ok) throw new Error(`${BLANKI_FILES[part]}: ${r.status}`);
      return r.arrayBuffer();
    });
    p.catch(() => loaded.delete(part));
    loaded.set(part, p);
  }
  return p;
}

/**
 * Один PDF: страницы parts по порядку, весь набор — copies раз. Страница
 * встраивается один раз и рисуется на каждой копии: изображение лежит в
 * файле в одном экземпляре, и десять копий весят почти как одна.
 */
export async function sobratBlanki(parts: readonly BlankPart[], copies = 1): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  const pages = await Promise.all(
    parts.map(async (part) => {
      const src = await PDFDocument.load(await bytesOf(part));
      return out.embedPages(src.getPages());
    }),
  );
  for (let c = 0; c < copies; c += 1) {
    for (const embedded of pages.flat()) {
      const page = out.addPage([embedded.width, embedded.height]);
      page.drawPage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
    }
  }
  return out.save();
}
