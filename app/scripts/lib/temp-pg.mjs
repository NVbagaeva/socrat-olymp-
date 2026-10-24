/* scripts/lib/temp-pg.mjs — временный PostgreSQL для проверок базы.

   Тот же приём, что в check-soglasiya-sql.mjs: initdb во временной
   папке, свой порт и сокет, под root — от пользователя postgres.
   Нужны программы PostgreSQL 14+ (PG_BIN или /usr/lib/postgresql/<v>/bin). */

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function pgBin() {
  if (process.env.PG_BIN) return process.env.PG_BIN;
  const base = '/usr/lib/postgresql';
  if (fs.existsSync(base)) {
    const v = fs.readdirSync(base).sort((a, b) => Number(b) - Number(a))[0];
    if (v && fs.existsSync(path.join(base, v, 'bin', 'initdb'))) return path.join(base, v, 'bin');
  }
  const which = spawnSync('which', ['initdb'], { encoding: 'utf8' });
  if (which.status === 0) return path.dirname(which.stdout.trim());
  throw new Error('Не нашёл PostgreSQL (initdb). Укажите PG_BIN.');
}

export function startTempPg(prefix = 'pg-') {
  const BIN = pgBin();
  const asRoot = process.getuid?.() === 0;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const data = path.join(dir, 'data');
  const port = String(55000 + Math.floor(Math.random() * 1000));
  if (asRoot) execFileSync('chown', ['-R', 'postgres', dir]);
  const run = (cmd, args) => {
    const full = path.join(BIN, cmd);
    const [c, a] = asRoot ? ['runuser', ['-u', 'postgres', '--', full, ...args]] : [full, args];
    const r = spawnSync(c, a, { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`${cmd}: ${r.stdout}\n${r.stderr}`);
    return r;
  };
  run('initdb', ['-D', data, '-U', 'postgres', '--auth=trust', '--encoding=UTF8', '--locale=C.UTF-8']);
  run('pg_ctl', ['-D', data, '-l', path.join(dir, 'log'), '-w', '-o', `-p ${port} -k ${dir} -c listen_addresses=''`, 'start']);
  return {
    dir,
    port,
    /** Выполнить SQL-файл (копия во временной папке — её читает postgres). */
    file(db, src) {
      const copy = path.join(dir, path.basename(src));
      fs.copyFileSync(src, copy);
      if (asRoot) execFileSync('chown', ['postgres', copy]);
      return run('psql', ['-h', dir, '-p', port, '-U', 'postgres', '-d', db, '-v', 'ON_ERROR_STOP=1', '-q', '-f', copy]);
    },
    sql(db, text) {
      return run('psql', ['-h', dir, '-p', port, '-U', 'postgres', '-d', db, '-v', 'ON_ERROR_STOP=1', '-qAt', '-c', text]);
    },
    createdb(db) {
      run('createdb', ['-h', dir, '-p', port, '-U', 'postgres', db]);
    },
    stop() {
      try {
        run('pg_ctl', ['-D', data, '-m', 'immediate', 'stop']);
      } catch {
        /* уже остановлен */
      }
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}
