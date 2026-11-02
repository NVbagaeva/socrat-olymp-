import type { BlankKit } from '@/content/blanki';
import { blankUrl } from '@/lib/blanki';

/**
 * Скачивание бланков ЕГЭ — общее у блока «Бланки» (BlankiEge) и окна
 * бланков «Собрать вариант» (BlankiVybor).
 *
 * Бланк из одной страницы в одной копии — прямая ссылка на файл в
 * public/blanki. Несколько страниц или копий — один PDF, собранный в
 * браузере (lib/blankiPdf.ts, pdf-lib грузится по нажатию).
 */

/** Прямая ссылка на файл или null — файл собирается в браузере. */
export function pryamayaSsylka(kit: BlankKit, copies: number): string | null {
  const [only] = kit.parts;
  const direct = kit.parts.length === 1 && (kit.copies !== true || copies === 1);
  return direct && only !== undefined ? blankUrl(only) : null;
}

function saveBytes(bytes: Uint8Array, name: string): void {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Собрать PDF из страниц бланка (n копий, если у бланка есть копии) и скачать. */
export async function sobratISkachat(kit: BlankKit, copies: number): Promise<void> {
  const n = kit.copies === true ? copies : 1;
  const { sobratBlanki } = await import('@/lib/blankiPdf');
  const bytes = await sobratBlanki(kit.parts, n);
  saveBytes(bytes, n > 1 ? `${kit.file}-${n}-kopii` : kit.file);
}
