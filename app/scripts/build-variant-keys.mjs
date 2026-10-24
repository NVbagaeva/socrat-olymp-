#!/usr/bin/env node
/* scripts/build-variant-keys.mjs — ключи вариантов для базы
   (таблица variant_keys, supabase/migrations/20261024120000_raboty_chast2.sql).

   Часть 1 — запись бланка («2,5»), часть 2 — поле автопроверки по
   пунктам (тип Pole из lib/chast2/sravnenie.ts). Ключи собираются теми же
   шаблонами, что и задания на сайте, — расхождения быть не может.

   Файл с ответами в публичный репозиторий не кладётся: он пишется в
   app/pdf-private/ (в .gitignore) и выполняется на сервере при выкладке:

     node scripts/build-variant-keys.mjs            → app/pdf-private/variant_keys.sql
     node scripts/build-variant-keys.mjs --out FILE
     node scripts/build-variant-keys.mjs --check    → только сверка, без файла

   Скрипт идемпотентен: delete + insert по каждой версии в одной транзакции. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireSrc } from './lib/load-ts.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(HERE, '..');

const { GOTOVY } = requireSrc('lib/povyshennye/dannye/index');
const { povSetIz } = requireSrc('lib/povyshennye/set');
const { povKod } = requireSrc('lib/povyshennye/kod');
const { CHAST2_V01 } = requireSrc('lib/povyshennye/chast2/v01');
const { normalizeAnswer } = requireSrc('lib/variant/online/normalize');

/* Часть 2 по вариантам: добавляется вместе с данными (chast2/index.ts). */
const CHAST2 = { 1: CHAST2_V01 };

const args = process.argv.slice(2);
const check = args.includes('--check');
const outAt = args.indexOf('--out');
const OUT = outAt >= 0 ? args[outAt + 1] : path.join(APP, 'pdf-private', 'variant_keys.sql');

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const lines = [
  '-- Ключи вариантов: собрано scripts/build-variant-keys.mjs. Не коммитить.',
  'begin;',
];
let rows = 0;
const problems = [];

for (const k of GOTOVY) {
  const { VARIANT } = requireSrc(`lib/povyshennye/dannye/v${String(k).padStart(2, '0')}`);
  const set = povSetIz(k, VARIANT.versii);
  const code = povKod(k);
  set.variants.forEach((v, i) => {
    const versiya = i + 1;
    const vals = [];
    for (const t of v.tasks) {
      const n = normalizeAnswer(t.answer);
      if (!n.ok)
        problems.push(
          `${code}.${versiya} №${t.egeNumber}: ключ «${t.answer}» не по правилам бланка`,
        );
      vals.push(
        `(${q(code)}, ${versiya}, ${t.egeNumber}, '', ${q(JSON.stringify(t.answer))}::jsonb)`,
      );
    }
    for (const z of CHAST2[k]?.[versiya] ?? []) {
      z.punkty.forEach((p, j) => {
        if (p.pole !== null) {
          vals.push(
            `(${q(code)}, ${versiya}, ${z.no}, ${q(String(j))}, ${q(JSON.stringify(p.pole))}::jsonb)`,
          );
        }
      });
    }
    lines.push(
      `delete from public.variant_keys where variant_code = ${q(code)} and versiya = ${versiya};`,
    );
    lines.push(
      `insert into public.variant_keys (variant_code, versiya, task_no, punkt, pole) values\n  ${vals.join(',\n  ')};`,
    );
    rows += vals.length;
  });
}
lines.push('commit;', '');

if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}
if (check) {
  console.log(`Ключи: вариантов ${GOTOVY.length}, строк ${rows} — собираются.`);
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, lines.join('\n'));
  console.log(`Ключи: строк ${rows} → ${path.relative(process.cwd(), OUT)}`);
}
