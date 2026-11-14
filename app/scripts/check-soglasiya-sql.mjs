#!/usr/bin/env node
/* scripts/check-soglasiya-sql.mjs — согласия и кабинет в базе.

   Запуск: pnpm test:soglasiya-sql (или pnpm test:kabinet-sql — то же)

   Наборы, каждый в своей базе. Кабинет (роли, приглашения, классы,
   ДЗ, попытки, сессии тренажёра) — supabase/tests/kabinet.test.sql,
   план — docs/kabinet-roli-dz.md. Кабинет репетитора и ДЗ №8 (код
   класса, задачи и проверка ответа в базе) — supabase/tests/dz.test.sql,
   контракт — docs/kabinet-dz-8.md. Согласия:

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
/* Таблица случаев нормализации ответа — временной таблицей в сессии теста. */
function normalizeCasesSql() {
  const { cases } = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'app/src/lib/variant/online/normalizeCases.json'), 'utf8'),
  );
  const lit = (v) => (v === null ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
  const ok = (want) => /^-?\d+(\.\d+)?$/.test(want);
  const rows = cases.map(([input, want]) => `(${lit(input)}, ${lit(ok(want) ? want : null)})`);
  return (
    'create temp table normalize_cases (input text, expected text);\n' +
    `insert into normalize_cases values\n${rows.join(',\n')};\n`
  );
}

/* Помощники проверок ДЗ — в начало каждого файла (функции pg_temp
   живут в одном сеансе psql). */
const dzHelpers = () =>
  fs.readFileSync(path.join(SUPA, 'tests', 'dz-pomoshchniki.sql'), 'utf8');
const DZ_ISTOCHNIKI = '20261113130000_dz_istochniki.sql';

/* Таблица примеров проверки ответа ДЗ — временной таблицей. */
function proverkaCasesSql() {
  const { cases } = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'app/src/lib/otvet/proverkaDzCases.json'), 'utf8'),
  );
  const lit = (v) => `'${String(v).replace(/'/g, "''")}'`;
  return (
    'create temp table proverka_cases (input text, answer text, expected text);\n' +
    `insert into proverka_cases values\n${cases.map((c) => `(${c.map(lit).join(', ')})`).join(',\n')};\n`
  );
}

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
      ['domeny-x-ru.sql', path.join(SUPA, 'tests', 'domeny-x-ru.sql')],
      ['kabinet.test.sql', path.join(SUPA, 'tests', 'kabinet.test.sql')],
    ],
  },
  {
    /* Правила доступа единой схемы на фоне прав своего сервера: аноним,
       чужой ученик, чужой класс, репетитор без класса; регистрация по
       списку адресов. */
    name: 'Правила доступа (RLS)',
    db: 'rls',
    files: [
      stub,
      ['lite-defaults.sql', path.join(SUPA, 'tests', 'lite-defaults.sql')],
      ...migrations.map(migration),
      ['kabinet_katalog.sql', path.join(SUPA, 'seed', 'kabinet_katalog.sql')],
      ['domeny-x-ru.sql', path.join(SUPA, 'tests', 'domeny-x-ru.sql')],
      ['rls.test.sql', path.join(SUPA, 'tests', 'rls.test.sql')],
    ],
  },
  {
    /* Онлайн-вариант через кабинет: выдача, проверка в базе, ключ закрыт
       от ученика. В начало теста — таблица случаев нормализации ответа,
       общая с сайтом (тот же файл проверяет check-variant-online.mjs). */
    name: 'Онлайн-вариант',
    db: 'variant',
    files: [
      stub,
      ...migrations.map(migration),
      ['domeny-x-ru.sql', path.join(SUPA, 'tests', 'domeny-x-ru.sql')],
      ['variant.test.sql', path.join(SUPA, 'tests', 'variant.test.sql'), normalizeCasesSql],
    ],
  },
  {
    /* Кабинет репетитора и ДЗ №8 (docs/kabinet-dz-8.md): код класса и
       вступление по коду, имя ученика для репетитора, задачи ДЗ и ключ,
       проверка ответа в базе, когда ученик видит решение. На фоне прав
       своего сервера — как правила доступа. */
    name: 'Кабинет репетитора и ДЗ №8',
    db: 'dz',
    files: [
      stub,
      ['lite-defaults.sql', path.join(SUPA, 'tests', 'lite-defaults.sql')],
      ...migrations.map(migration),
      ['kabinet_katalog.sql', path.join(SUPA, 'seed', 'kabinet_katalog.sql')],
      ['domeny-x-ru.sql', path.join(SUPA, 'tests', 'domeny-x-ru.sql')],
      ['dz.test.sql', path.join(SUPA, 'tests', 'dz.test.sql')],
    ],
  },
  {
    /* ДЗ из трёх источников (docs/kabinet-dz-istochniki.md): карточки,
       опорные, тренажёр; виды ответа и отметки самооценки; черновик и
       шаблоны; права к новым таблицам. В начало теста — таблица
       примеров проверки ответа, общая с сайтом и заглушкой
       (app/src/lib/otvet/proverkaDzCases.json). */
    name: 'ДЗ из трёх источников',
    db: 'dz_istochniki',
    files: [
      stub,
      ['lite-defaults.sql', path.join(SUPA, 'tests', 'lite-defaults.sql')],
      ...migrations.map(migration),
      ['kabinet_katalog.sql', path.join(SUPA, 'seed', 'kabinet_katalog.sql')],
      ['domeny-x-ru.sql', path.join(SUPA, 'tests', 'domeny-x-ru.sql')],
      ['dz-lyudi.sql', path.join(SUPA, 'tests', 'dz-lyudi.sql'), dzHelpers],
      [
        'dz-istochniki.test.sql',
        path.join(SUPA, 'tests', 'dz-istochniki.test.sql'),
        () => dzHelpers() + proverkaCasesSql(),
      ],
    ],
  },
  {
    /* Перенос ДЗ этапа 3: миграции до ДЗ-источников, ДЗ кодом этапа 3,
       потом миграция и сверка — задачи, ключи, ход решения те же. */
    name: 'Перенос ДЗ этапа 3',
    db: 'dz_perenos',
    files: [
      stub,
      ['lite-defaults.sql', path.join(SUPA, 'tests', 'lite-defaults.sql')],
      ...migrations.filter((f) => f < DZ_ISTOCHNIKI).map(migration),
      ['kabinet_katalog.sql', path.join(SUPA, 'seed', 'kabinet_katalog.sql')],
      ['domeny-x-ru.sql', path.join(SUPA, 'tests', 'domeny-x-ru.sql')],
      ['dz-lyudi.sql', path.join(SUPA, 'tests', 'dz-lyudi.sql'), dzHelpers],
      ['dz-perenos.setup.sql', path.join(SUPA, 'tests', 'dz-perenos.setup.sql'), dzHelpers],
      ...migrations.filter((f) => f >= DZ_ISTOCHNIKI).map(migration),
      ['dz-perenos.test.sql', path.join(SUPA, 'tests', 'dz-perenos.test.sql'), dzHelpers],
    ],
  },
  {
    /* Регистрация только с почтой российских почтовых сервисов: хук,
       триггер, смена почты, ручной список, старые пользователи
       (supabase/tests/domeny.test.sql). Без добавленного x.ru. */
    name: 'Почтовые домены',
    db: 'domeny',
    files: [
      stub,
      ['lite-defaults.sql', path.join(SUPA, 'tests', 'lite-defaults.sql')],
      ...migrations.map(migration),
      ['domeny.test.sql', path.join(SUPA, 'tests', 'domeny.test.sql')],
    ],
  },
];

let failed = false;
for (const suite of SUITES) {
  console.log(`\n${suite.name}:`);
  must(run('createdb', ['-h', dir, '-p', port, '-U', 'postgres', suite.db]), `база ${suite.db}`);
  for (const [name, src, prefix] of suite.files) {
    // Файлы читает пользователь postgres — копируем во временную папку.
    const copy = path.join(dir, name);
    fs.writeFileSync(copy, (prefix?.() ?? '') + fs.readFileSync(src, 'utf8'));
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
console.log(
  '\nСогласия, кабинет, правила доступа, онлайн-вариант, ДЗ №8, ДЗ из трёх источников, перенос ДЗ и почтовые домены в базе: все проверки прошли.',
);
