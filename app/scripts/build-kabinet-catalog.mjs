#!/usr/bin/env node
/* scripts/build-kabinet-catalog.mjs — каталог банка для кабинета.

   Запуск: pnpm build:kabinet-catalog          — записать файлы;
           pnpm build:kabinet-catalog --check  — только сверить (CI).

   Репетитор выдаёт домашнее задание задачами из банка: номер задания
   1–20 и прототип. Прототипы живут в коде движков, у каждого задания
   своя форма списка. Скрипт читает их тем же кодом сайта (requireSrc)
   и пишет два файла:

     src/content/kabinet/katalog.json        — для экранов кабинета:
       номер, название, открыто ли задание, прототипы {code, title},
       подписи разделов тренажёров («12:linear» → «Линейная функция»);
     ../supabase/seed/kabinet_katalog.sql    — те же строки для таблиц
       ege_tasks и bank_prototypes (миграция 20261015120000_kabinet.sql).

   Код прототипа в каталоге — «<номер>:<id в движке>» («7:P01»,
   «12:12Q.A»): id движков разных заданий пересекаются (P01 есть и у
   №7, и у №10). Ответов, условий и генераторов в файлах нет. */

import fs from 'node:fs';
import path from 'node:path';
import { APP, requireSrc } from './lib/load-ts.mjs';

const CHECK = process.argv.includes('--check');
const JSON_FILE = path.join(APP, 'src/content/kabinet/katalog.json');
const SQL_FILE = path.join(APP, '..', 'supabase/seed/kabinet_katalog.sql');

const { tasks } = requireSrc('content/tasks');
const { texPlain } = requireSrc('lib/texPlain');

/* Задание → модуль движка, имя списка и поле названия. */
const SOURCES = {
  1: ['lib/planimetriya/stseny/index', 'PROTOTIPY'],
  2: ['lib/vektory/prototypes/index', 'PROTOTYPES'],
  3: ['lib/zadanie3/index', 'BANK'],
  4: ['lib/veroyatnost/index', 'BANK_4'],
  5: ['lib/veroyatnost/index', 'BANK_5'],
  6: ['lib/zadanie6/prototypes/index', 'PROTOTYPES'],
  7: ['lib/zadanie7/prototypes/index', 'PROTOTYPES'],
  8: ['lib/vychisleniya/prototypes/index', 'PROTOTYPES'],
  9: ['lib/proizvodnaya/prototypes/index', 'PROTOTYPES'],
  10: ['lib/zadanie10/prototypes/index', 'PROTOTYPES'],
  11: ['lib/zadanie11/prototypes/index', 'SUBTYPES'],
  /* №13: реестр прототипов — функция генератора. */
  13: ['lib/zadanie13/generate', 'prototypes'],
};

function listOf(no) {
  if (no === 12) {
    /* №12: прототипы — наборы движка графиков вида «prototype» по
       семействам функций; наборы подготовки (prep) — не прототипы. */
    const { manifest } = requireSrc('lib/generator/manifest');
    return manifest.families.flatMap((family) =>
      family.skills
        .filter((skill) => skill.kind === 'prototype')
        .map((skill) => ({
          id: skill.id,
          title: `${family.title}: ${texPlain(skill.title.replace(/^\S+ · /, ''))}`,
        })),
    );
  }
  const source = SOURCES[no];
  if (source === undefined) {
    return [];
  }
  const [mod, name] = source;
  const found = requireSrc(mod)[name];
  const list = typeof found === 'function' ? found() : found;
  if (!Array.isArray(list)) {
    throw new Error(`${mod}: нет списка ${name}`);
  }
  return list.map((p) => ({ id: String(p.id), title: texPlain(String(p.nazvanie ?? p.title)) }));
}

const catalog = { tasks: [] };
const seen = new Set();
for (const task of tasks) {
  const no = Number(task.no);
  const ready = task.status === 'ready';
  const prototypes = ready
    ? listOf(no).map((p) => ({ code: `${no}:${p.id}`, title: p.title.trim() }))
    : [];
  for (const p of prototypes) {
    if (seen.has(p.code)) throw new Error(`повтор кода прототипа ${p.code}`);
    if (!p.title) throw new Error(`${p.code}: пустое название`);
    seen.add(p.code);
  }
  /* Вторая часть (№15, №16) — теория и чертежи, банка прототипов у
     разделов нет: ДЗ из банка по ним не выдаётся. */
  if (ready && prototypes.length === 0 && Number(task.part) === 1) {
    throw new Error(`№${no} открыт, а прототипов не нашлось: допишите его в SOURCES`);
  }
  catalog.tasks.push({ no, name: task.name, ready, prototypes });
}

/* Подписи разделов тренажёров со своей сессией («12:linear», «3:<фигура>»)
   — для списка тренировок в кабинете. */
const sections = {};
for (const family of requireSrc('lib/generator/manifest').manifest.families) {
  sections[`12:${family.id}`] = family.title;
}
for (const razdel of requireSrc('lib/zadanie3/index').RAZDELY) {
  sections[`3:${razdel.slug}`] = razdel.nazvanie;
}
catalog.sections = sections;

const json = `${JSON.stringify(catalog, null, 1)}\n`;

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const sqlLines = [
  '-- Каталог банка для кабинета. Файл собран: pnpm build:kabinet-catalog — не править руками.',
  '-- Применяется после миграции 20261015120000_kabinet.sql и при каждом обновлении банка.',
  'begin;',
  'insert into public.ege_tasks (no, name) values',
  catalog.tasks.map((t) => `  (${t.no}, ${q(t.name)})`).join(',\n'),
  'on conflict (no) do update set name = excluded.name;',
];
const protoRows = catalog.tasks.flatMap((t) =>
  t.prototypes.map((p, i) => `  (${q(p.code)}, ${t.no}, ${q(p.title)}, ${i + 1})`),
);
sqlLines.push(
  'insert into public.bank_prototypes (code, task_no, title, order_index) values',
  protoRows.join(',\n'),
  'on conflict (code) do update set task_no = excluded.task_no, title = excluded.title,',
  '  order_index = excluded.order_index, retired_at = null;',
  '-- Прототипы, которых больше нет в банке, не удаляются (на них могут ссылаться ДЗ и попытки),',
  '-- а помечаются выведенными.',
  'update public.bank_prototypes set retired_at = now()',
  ` where retired_at is null and code not in (${[...seen].map(q).join(', ')});`,
  'commit;',
  '',
);
const sql = sqlLines.join('\n');

const total = seen.size;
if (CHECK) {
  const stale = [
    [JSON_FILE, json],
    [SQL_FILE, sql],
  ].filter(([file, text]) => !fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text);
  if (stale.length > 0) {
    console.error(
      `Каталог кабинета устарел: ${stale.map(([f]) => path.relative(APP, f)).join(', ')}.\n` +
        'Запустите pnpm build:kabinet-catalog и закоммитьте файлы.',
    );
    process.exit(1);
  }
  console.log(`Каталог кабинета актуален: ${total} прототипов.`);
} else {
  fs.mkdirSync(path.dirname(JSON_FILE), { recursive: true });
  fs.mkdirSync(path.dirname(SQL_FILE), { recursive: true });
  fs.writeFileSync(JSON_FILE, json);
  fs.writeFileSync(SQL_FILE, sql);
  for (const t of catalog.tasks) {
    if (t.ready) console.log(`№${t.no} ${t.name}: ${t.prototypes.length}`);
  }
  console.log(
    `Записано ${total} прототипов: ${path.relative(APP, JSON_FILE)}, ${path.relative(APP, SQL_FILE)}`,
  );
}
