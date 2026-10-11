/* scripts/lib/generator-versions.mjs — версии генераторов листов.

   Код комплекта («7K3F-2B») — seed листа и версия генератора, который
   его собрал. Версия — два знака хеша исходников генератора: файлы
   движка, сборщика листа и его слов. Поменялся хоть один файл —
   поменялась версия, и экран «Мои комплекты» честно говорит, что
   прежний комплект может собраться иначе. Точнее версии сверяет
   отпечаток заданий (lib/komplekt.ts): версия могла поменяться из-за
   правки комментария, а задания — остаться теми же.

   Таблицу { область: версия } считает next.config.ts при каждой
   сборке и отдаёт коду через process.env.GENERATOR_VERSIONS; тот же
   расчёт берёт автотест комплектов. */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/* Область комплекта → исходники генератора, от папки app/src. Папка
   берётся целиком. №4 и №5 — один движок вероятностей. */
export const GENERATOR_SOURCES = {
  12: [
    'lib/graph',
    'lib/generatorSheet.ts',
    'lib/generatorQuery.ts',
    'lib/sheetPlan.ts',
    'lib/trainerSession.ts',
    'lib/sheet/answers12.js',
    'lib/sheet/figures12.js',
    'content/sheet12.js',
  ],
  2: ['lib/vektory', 'content/sheet2.ts'],
  4: ['lib/veroyatnost', 'lib/sheetPlan.ts'],
  5: ['lib/veroyatnost', 'lib/sheetPlan.ts'],
  8: ['lib/vychisleniya', 'content/sheet8.js'],
  9: ['lib/proizvodnaya', 'content/sheet9.js', 'lib/sheet/answers9.js'],
  11: ['lib/zadanie11'],
};

/* Crockford base32: без I, L, O, U — код читают с бумаги. */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function files(full) {
  if (!fs.existsSync(full)) {
    return [];
  }
  if (!fs.statSync(full).isDirectory()) {
    return [full];
  }
  return fs.readdirSync(full).sort().flatMap((name) => files(path.join(full, name)));
}

/** Версия одной области: два знака Crockford base32 из sha256 исходников. */
export function generatorVersion(srcDir, scope) {
  const hash = crypto.createHash('sha256');
  for (const rel of GENERATOR_SOURCES[scope] ?? []) {
    for (const file of files(path.join(srcDir, rel))) {
      hash.update(path.relative(srcDir, file).split(path.sep).join('/'));
      hash.update('\0');
      hash.update(fs.readFileSync(file));
      hash.update('\0');
    }
  }
  const bytes = hash.digest();
  const bits = (bytes[0] << 8) | bytes[1];
  return ALPHABET[(bits >> 11) & 31] + ALPHABET[(bits >> 6) & 31];
}

/** Таблица { '12': '2B', '2': 'K7', … } для всех областей. */
export function generatorVersions(srcDir) {
  const out = {};
  for (const scope of Object.keys(GENERATOR_SOURCES)) {
    out[scope] = generatorVersion(srcDir, scope);
  }
  return out;
}
