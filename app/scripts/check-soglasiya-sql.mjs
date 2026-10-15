#!/usr/bin/env node
/* scripts/check-soglasiya-sql.mjs — согласия и кабинет в базе.

   Запуск: pnpm test:soglasiya-sql (или pnpm test:kabinet-sql — то же)

   Два набора, каждый в своей базе. Кабинет (роли, приглашения, классы,
   ДЗ, попытки, сессии тренажёра) — supabase/tests/kabinet.test.sql,
   план — docs/kabinet-roli-dz.md. Согласия:

   Поднимает временный PostgreSQL (initdb в папке ОС для временных
   файлов, свой порт и сокет), применяет заглушку Supabase
   (supabase/tests/supabase-stub.sql), миграцию согласий и проверки
   supabase/tests/soglasiya.test.sql:

     - без двух галочек пользователь не создаётся, даже в обход формы;
     - согласие записывается с типом, редакцией, временем и IP;
     - ученику младше 18 нужна почта родителя, до подтверждения прогресс
       не сохраняется (и RLS не пускает строку прогресса);
     - письмо родителю — не чаще раза в минуту, ссылка одноразовая,
       выдать и подтвердить токен может только сервер;
     - новая редакция требует согласия заново;
     - выгрузка JSON и удаление аккаунта: всё, кроме журнала согласий;
       через три года журнал удалённого аккаунта чистится.

   Нужны программы PostgreSQL 14+ (initdb, pg_ctl, psql): из PATH,
   /usr/lib/postgresql/<версия>/bin или PG_BIN. Под root сервер
   запускается от пользователя postgres. */

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SUPA = path.join(ROOT, 'supabase');

function pgBin() {
  if (process.env.PG_BIN) return process.env.PG_BIN;
  const base = '/usr/lib/postgresql';
  if (fs.existsSync(base)) {
    const v = fs.readdirSync(base).sort((a, b) => Number(b) - Number(a))[0];
    if (v && fs.existsSync(path.join(base, v, 'bin', 'initdb'))) return path.join(base, v, 'bin');
  }
  const which = spawnSync('which', ['initdb'], { encoding: 'utf8' });
  if (which.status === 0) return path.dirname(which.stdout.trim());
  console.error('Не нашёл PostgreSQL (initdb). Укажите PG_BIN=<папка с initdb, pg_ctl, psql>.');
  process.exit(2);
}

const BIN = pgBin();
const asRoot = process.getuid?.() === 0;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'soglasiya-pg-'));
const data = path.join(dir, 'data');
const port = String(54000 + Math.floor(Math.random() * 1000));
if (asRoot) execFileSync('chown', ['-R', 'postgres', dir]);

function run(cmd, args, opts = {}) {
  const full = path.join(BIN, cmd);
  const [c, a] = asRoot ? ['runuser', ['-u', 'postgres', '--', full, ...args]] : [full, args];
  return spawnSync(c, a, { encoding: 'utf8', ...opts });
}

function must(res, what) {
  if (res.status !== 0) {
    console.error(`${what}: не получилось\n${res.stdout}\n${res.stderr}`);
    stop();
    process.exit(1);
  }
  return res;
}

function stop() {
  run('pg_ctl', ['-D', data, '-m', 'immediate', 'stop']);
  fs.rmSync(dir, { recursive: true, force: true });
}

must(
  run('initdb', [
    '-D',
    data,
    '-U',
    'postgres',
    '--auth=trust',
    '--encoding=UTF8',
    '--locale=C.UTF-8',
  ]),
  'initdb',
);
must(
  run('pg_ctl', [
    '-D',
    data,
    '-l',
    path.join(dir, 'log'),
    '-w',
    '-o',
    `-p ${port} -k ${dir} -c listen_addresses=''`,
    'start',
  ]),
  'запуск PostgreSQL',
);

const psql = (file, db) =>
  run('psql', [
    '-h',
    dir,
    '-p',
    port,
    '-U',
    'postgres',
    '-d',
    db,
    '-v',
    'ON_ERROR_STOP=1',
    '-q',
    '-f',
    file,
  ]);

const migrations = fs
  .readdirSync(path.join(SUPA, 'migrations'))
  .filter((f) => f.endsWith('.sql'))
  .sort();
const migration = (f) => [f, path.join(SUPA, 'migrations', f)];
const stub = ['supabase-stub.sql', path.join(SUPA, 'tests', 'supabase-stub.sql')];

/* Каждый набор проверок — в своей базе: тест согласий создаёт
   пользователей без приглашения, и на полной схеме (с регистрацией
   только по приглашению) его не прогнать. */
const SUITES = [
  {
    name: 'Согласия',
    db: 'soglasiya',
    files: [
      stub,
      ...migrations.filter((f) => f <= '20261011120000_soglasiya.sql').map(migration),
      ['soglasiya.test.sql', path.join(SUPA, 'tests', 'soglasiya.test.sql')],
    ],
  },
  {
    name: 'Кабинет',
    db: 'kabinet',
    files: [
      stub,
      ...migrations.map(migration),
      ['kabinet_katalog.sql', path.join(SUPA, 'seed', 'kabinet_katalog.sql')],
      ['kabinet.test.sql', path.join(SUPA, 'tests', 'kabinet.test.sql')],
    ],
  },
];

let failed = false;
for (const suite of SUITES) {
  console.log(`\n${suite.name}:`);
  must(run('createdb', ['-h', dir, '-p', port, '-U', 'postgres', suite.db]), `база ${suite.db}`);
  for (const [name, src] of suite.files) {
    // Файлы читает пользователь postgres — копируем во временную папку.
    const copy = path.join(dir, name);
    fs.copyFileSync(src, copy);
    if (asRoot) execFileSync('chown', ['postgres', copy]);
    const res = psql(copy, suite.db);
    const notices = `${res.stderr}`
      .split('\n')
      .filter((l) => l.includes('NOTICE:'))
      .map((l) => l.replace(/^.*NOTICE:\s*/, '  '));
    if (notices.length) console.log(notices.join('\n'));
    if (res.status !== 0) {
      console.error(
        `\n${name}:\n${res.stderr
          .split('\n')
          .filter((l) => !l.includes('NOTICE:'))
          .join('\n')}`,
      );
      failed = true;
      break;
    }
  }
  if (failed) break;
}

stop();
if (failed) process.exit(1);
console.log('\nСогласия и кабинет в базе: все проверки прошли.');
