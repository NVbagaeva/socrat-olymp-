/**
 * Ссылка на файл из public/ с версией: '/materials/x.pdf' →
 * '/materials/x.pdf?v=3f9a1c2e'.
 *
 * Хостинг отдаёт PDF и картинки с кешем на год, а имена у них
 * постоянные. Версия — первые знаки хеша содержимого: перезалили файл —
 * ссылка новая, и браузер берёт его заново; не трогали — ссылка
 * прежняя, и кеш работает.
 *
 * Таблицу версий считает next.config.ts на каждой сборке
 * (scripts/lib/asset-versions.mjs) и встраивает в код через
 * process.env — работает и на сервере, и в браузере. Файла нет в
 * таблице (внешняя ссылка, файл не из public/) — адрес как есть.
 *
 * Пропущенную версию ловит pnpm test:asset-versions после сборки.
 */

let table: Record<string, string> | null = null;

function versions(): Record<string, string> {
  if (table === null) {
    try {
      table = JSON.parse(process.env.ASSET_VERSIONS ?? '{}') as Record<string, string>;
    } catch {
      table = {};
    }
  }
  return table;
}

/**
 * Путь к файлу без версии и якоря: '/images/x.jpg?v=3f9a' → '/images/x.jpg'.
 * Нужен там, где по ссылке ищут сам файл в public/ — например, проверка
 * на сборке «лежит ли фотография на месте»: с хвостом ?v=… такого файла
 * на диске нет.
 */
export function bezVersii(path: string): string {
  return path.split(/[?#]/)[0] ?? path;
}

export function assetUrl(path: string): string {
  const [bare] = path.split(/[?#]/);
  const version = bare === undefined ? undefined : versions()[bare];
  if (version === undefined) {
    return path;
  }
  return `${bare}?v=${version}${path.slice(bare!.length).replace(/^\?/, '&')}`;
}
