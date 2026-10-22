import { withVersion } from './assetUrl';

/**
 * Ссылка на файл данных тренажёра из public/data/ с версией:
 * '/data/zadanie6/indeks.json' → '/data/zadanie6/indeks.json?v=3f9a1c2e'.
 *
 * Версии этих файлов — своей таблицей (process.env.DATA_ASSET_VERSIONS,
 * её считает next.config.ts), а не в общей из lib/assetUrl.ts: общая
 * попадает в первую загрузку каждой страницы, а данные нужны только
 * тренажёрам заданий 6, 7 и 10 (dannye.ts в lib/zadanie6, 7, 10).
 */

let table: Record<string, string> | null = null;

function versions(): Record<string, string> {
  if (table === null) {
    try {
      table = JSON.parse(process.env.DATA_ASSET_VERSIONS ?? '{}') as Record<string, string>;
    } catch {
      table = {};
    }
  }
  return table;
}

export function dataUrl(path: string): string {
  return withVersion(path, versions());
}
