#!/usr/bin/env node
/* scripts/build-bank-baza.mjs — банки задач базовой математики.

   Запуск: pnpm build:bank-baza   (--check — ничего не пишет, падает,
   если файлы устарели).

   Для каждого наполненного раздела базы (lib/baza/razdely.ts) собирает
   банк из прототипов и пишет файлы для браузера:
   public/data/baza/{номер}/{прототип}.json — условие, параметры и
   отпечаток ответа. Сборка детерминированная: повторный запуск даёт те
   же файлы. Ответы сверяет pnpm test:baza. */

import fs from 'node:fs';
import path from 'node:path';
import { APP, requireSrc } from './lib/load-ts.mjs';

const { napolnennyeRazdely } = requireSrc('lib/baza/razdely.ts');
const { bankRazdela, dannyeDlyaBrauzera } = requireSrc('lib/baza/bank.ts');

const CHECK = process.argv.includes('--check');
const ROOT = path.join(APP, 'public/data/baza');
let ustarelo = false;

for (const razdel of napolnennyeRazdely()) {
  if (razdel.prototipy === undefined) continue;
  const bank = bankRazdela(razdel.slug, razdel.prototipy);
  const fayly = dannyeDlyaBrauzera(bank);
  const dir = path.join(ROOT, razdel.slug);
  if (CHECK) {
    const est = fs.existsSync(dir) ? fs.readdirSync(dir).sort() : [];
    const nado = Object.keys(fayly)
      .map((f) => `${f}.json`)
      .sort();
    const sovpalo =
      JSON.stringify(est) === JSON.stringify(nado) &&
      nado.every((f) => fs.readFileSync(path.join(dir, f), 'utf8') === fayly[f.slice(0, -5)]);
    if (!sovpalo) {
      console.error(`База №${razdel.slug}: файлы данных устарели — pnpm build:bank-baza`);
      ustarelo = true;
    }
    continue;
  }
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  for (const [fail, soderzhimoe] of Object.entries(fayly)) {
    fs.writeFileSync(path.join(dir, `${fail}.json`), soderzhimoe);
  }
  console.log(
    `База №${razdel.slug}: ${bank.length} задач, файлов ${Object.keys(fayly).length} → ${path.relative(APP, dir)}/`,
  );
}
if (ustarelo) process.exit(1);
