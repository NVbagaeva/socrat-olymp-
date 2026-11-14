#!/usr/bin/env node
/* scripts/check-progress-import.mjs — перенос прогресса гостя в аккаунт.

   Запуск: pnpm test:progress-import (сборка не нужна).

   Список того, что переносится из браузера в аккаунт при первом входе
   (src/lib/progressImport/registry.ts), написан строками, а не взят из
   кода разделов: кабинету незачем тянуть в свою сборку движки
   тренажёров. Поэтому здесь сверяется, что строки не разошлись:

     • каждый ключ из списка действительно пишет сам раздел (ключ есть в
       его исходниках или собирается хранилищем сессий тренажёра);
     • ключи проходят правило базы — оно одно и то же в registry.ts и в
       таблице user_storage (supabase/migrations);
     • предел размера значения на сайте не больше предела в базе;
     • ключи не повторяются, у раздела есть название.

   Раздел подключён, а ключ переименовали — проверка упадёт и назовёт его. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(APP, 'src');
const read = (file) => fs.readFileSync(file, 'utf8');

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  console.log(`${ok ? '  ok ' : '  НЕТ'} ${what}`);
  if (!ok) failures.push(what);
}

/* ── Список из registry.ts ─────────────────────────────────────── */

const registry = read(path.join(SRC, 'lib', 'progressImport', 'registry.ts'));
const groups = [];
const groupRe = /\{\s*id:\s*'([^']+)',\s*title:\s*'([^']+)',\s*keys:\s*\[([\s\S]*?)\],\s*\}/g;
for (const m of registry.matchAll(groupRe)) {
  const keys = [...m[3].matchAll(/'([^']+)'/g)].map((k) => k[1]);
  groups.push({ id: m[1], title: m[2], keys });
}
check(groups.length >= 1, `в списке переноса есть разделы: ${groups.map((g) => g.id).join(', ')}`);

const pattern = /IMPORT_KEY_PATTERN = \/(.+)\/;/.exec(registry)?.[1] ?? '';
const limit = Number(/IMPORT_VALUE_LIMIT = ([\d_]+);/.exec(registry)?.[1]?.replaceAll('_', ''));

/* ── Правило и предел в базе ───────────────────────────────────── */

const migrations = path.resolve(APP, '..', 'supabase', 'migrations');
const sql = fs
  .readdirSync(migrations)
  .filter((f) => f.endsWith('.sql'))
  .map((f) => read(path.join(migrations, f)))
  .join('\n');
const sqlPattern = /key text not null check \(key ~ '([^']+)'\)/.exec(sql)?.[1] ?? '';
const sqlLimit = Number(/octet_length\(value::text\) <= (\d+)/.exec(sql)?.[1]);
check(
  pattern !== '' && pattern === sqlPattern,
  `правило ключа на сайте и в базе одно: ${sqlPattern || 'в базе не найдено'}`,
);
check(
  Number.isFinite(limit) && Number.isFinite(sqlLimit) && limit <= sqlLimit,
  `предел значения на сайте (${limit}) не больше предела в базе (${sqlLimit})`,
);

/* ── Исходники разделов ────────────────────────────────────────── */

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) yield full;
  }
}
const sources = [...walk(SRC)]
  .filter((file) => !file.includes(`${path.sep}progressImport${path.sep}`))
  .map((file) => read(file));
const written = (key) => sources.some((text) => text.includes(`'${key}'`));

/* Сессию тренажёра хранилище собирает из частей: «budetege:trainer:» +
   раздел + «:session» (lib/trainerSession/store.ts), раздел задаёт
   тренажёр: scope: '8'. */
const store = read(path.join(SRC, 'lib', 'trainerSession', 'store.ts'));
const sessionPrefix = /const PREFIX = '([^']+)';/.exec(store)?.[1] ?? '';
const sessionSuffix = /const SUFFIX = '([^']+)';/.exec(store)?.[1] ?? '';
function sessionScope(key) {
  if (sessionPrefix === '' || !key.startsWith(sessionPrefix) || !key.endsWith(sessionSuffix)) {
    return null;
  }
  return key.slice(sessionPrefix.length, key.length - sessionSuffix.length);
}
const scopeUsed = (scope) =>
  sources.some((text) => new RegExp(`scope[:=]\\s*['"]${scope}['"]`).test(text));

const seen = new Set();
const rule = new RegExp(pattern);
for (const group of groups) {
  check(group.title.trim() !== '', `${group.id}: у раздела есть название для вопроса`);
  check(group.keys.length >= 1, `${group.id}: есть ключи`);
  for (const key of group.keys) {
    check(!seen.has(key), `${key}: не повторяется`);
    seen.add(key);
    check(rule.test(key), `${key}: проходит правило базы`);
    const scope = sessionScope(key);
    if (scope !== null) {
      check(scopeUsed(scope), `${key}: тренажёр раздела «${scope}» пишет сессию под этим ключом`);
    } else {
      check(written(key), `${key}: раздел пишет этот ключ`);
    }
  }
}

console.log(`\nПроверок: ${checks}, не прошло: ${failures.length}.`);
if (failures.length > 0) {
  console.error('\nНе прошли:');
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
