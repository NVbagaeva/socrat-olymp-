/* scripts/lib/asset-versions.mjs — версии файлов из public/.

   Файлы в public/ (PDF-листы, картинки) лежат под постоянными именами,
   а хостинг отдаёт их с кешем на год. Перезалили лист под тем же
   именем — браузер, уже открывавший прежний, показал бы старый.

   Поэтому к ссылке на такой файл добавляется версия: ?v=<первые
   8 знаков хеша содержимого>. Поменялось содержимое — поменялась
   ссылка, и браузер берёт файл заново. Не поменялось — ссылка та же,
   и годовой кеш работает как надо.

   Таблицу «путь → версия» считает next.config.ts при каждой сборке и
   отдаёт коду через process.env (lib/assetUrl.ts). Руками ничего
   вести не нужно. Тот же расчёт использует проверка сборки
   (scripts/check-asset-versions.mjs). */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/* Что версия не нужна: служебные файлы сервера и описания папок. */
const SKIP = /(^|\/)(\.htaccess|README\.md)$/;

/** Таблица { '/materials/x.pdf': '3f9a1c2e', … } для папки public. */
export function assetVersions(publicDir) {
  const out = {};
  (function walk(dir) {
    for (const name of fs.readdirSync(dir).sort()) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      const rel = '/' + path.relative(publicDir, full).split(path.sep).join('/');
      if (SKIP.test(rel)) {
        continue;
      }
      out[rel] = crypto
        .createHash('sha256')
        .update(fs.readFileSync(full))
        .digest('hex')
        .slice(0, 8);
    }
  })(publicDir);
  return out;
}
