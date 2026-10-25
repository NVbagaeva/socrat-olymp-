/**
 * Адреса файлов бланков ЕГЭ (app/public/blanki). Лёгкий модуль: сборка
 * PDF из нескольких страниц и копий — в lib/blankiPdf.ts, она грузится
 * по нажатию кнопки.
 */

import { BLANKI_DIR, BLANKI_FILES, type BlankPart } from '@/content/blanki';
import { assetUrl } from './assetUrl';

/** Адрес файла страницы бланка — с версией для кеша. */
export function blankUrl(part: BlankPart): string {
  return assetUrl(`${BLANKI_DIR}${BLANKI_FILES[part]}`);
}
