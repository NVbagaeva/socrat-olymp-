/**
 * Готовые PDF справочника №1: адрес файла (с версией по содержимому —
 * lib/assetUrl.ts) и число страниц. Файлы и pdf.json пишет
 * scripts/build-pdf-spravochnik-1.mjs; с текущей раскладкой их сверяет
 * test:pdf-spravochnik-1.
 */

import { assetUrl } from '../../lib/assetUrl';
import fayly from './pdf.json';

export interface PdfSpravochnika {
  href: string;
  stranic: number;
}

export const PDF_SPRAVOCHNIKA_1: { sPrimerami: PdfSpravochnika; bezPrimerov: PdfSpravochnika } = {
  sPrimerami: { href: assetUrl(fayly.sPrimerami.fayl), stranic: fayly.sPrimerami.stranic },
  bezPrimerov: { href: assetUrl(fayly.bezPrimerov.fayl), stranic: fayly.bezPrimerov.stranic },
};
