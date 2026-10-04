/* scripts/lib/apache.mjs — настоящий Apache над собранным сайтом.

   Сайт живёт на хостинге с Apache, и правила кеширования и
   перенаправлений лежат в public/.htaccess. Проверять их на
   самодельном сервере бессмысленно: проверяется тогда самоделка.
   Здесь поднимается сам Apache с теми же модулями, что на хостинге
   (rewrite, headers, mime, dir), над папкой out/ и с AllowOverride
   All — .htaccess читается так же, как в public_html.

   Нужен установленный apache2 (в CI: apt-get install apache2). */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const MODULES = ['mpm_event', 'authz_core', 'mime', 'dir', 'rewrite', 'headers'];

function modulesDir() {
  for (const dir of ['/usr/lib/apache2/modules', '/usr/libexec/apache2', '/usr/lib64/httpd/modules']) {
    if (fs.existsSync(path.join(dir, 'mod_rewrite.so'))) { return dir; }
  }
  throw new Error('Не найден каталог модулей Apache: поставьте apache2');
}

function binary() {
  for (const bin of ['/usr/sbin/apache2', '/usr/sbin/httpd']) {
    if (fs.existsSync(bin)) { return bin; }
  }
  throw new Error('Не найден apache2: поставьте пакет apache2');
}

/** Поднять Apache над root на порту port. Возвращает { url, stop }. */
export async function startApache(root, port) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'apache-'));
  const mods = modulesDir();
  const conf = [
    `ServerRoot "${dir}"`,
    `Listen 127.0.0.1:${port}`,
    `PidFile "${dir}/httpd.pid"`,
    `ErrorLog "${dir}/error.log"`,
    'LogLevel warn',
    /* Часть модулей в сборке Apache бывает встроенной (unixd в Ubuntu):
       такие файлом не загружаются. */
    ...MODULES.filter((m) => fs.existsSync(`${mods}/mod_${m}.so`))
      .map((m) => `LoadModule ${m}_module "${mods}/mod_${m}.so"`),
    fs.existsSync('/etc/mime.types') ? 'TypesConfig /etc/mime.types' : '',
    'ServerName localhost',
    `DocumentRoot "${path.resolve(root)}"`,
    `<Directory "${path.resolve(root)}">`,
    '  AllowOverride All',
    '  Require all granted',
    '</Directory>',
    'DirectoryIndex index.html',
    'AddDefaultCharset utf-8',
  ].join('\n');
  fs.writeFileSync(path.join(dir, 'httpd.conf'), conf);

  const check = spawnSync(binary(), ['-t', '-f', path.join(dir, 'httpd.conf')], { encoding: 'utf8' });
  if (check.status !== 0) {
    throw new Error('Конфигурация Apache не прошла проверку:\n' + check.stderr);
  }
  const proc = spawn(binary(), ['-f', path.join(dir, 'httpd.conf'), '-DFOREGROUND'], { stdio: 'inherit' });

  const url = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 50; i++) {
    try {
      await fetch(url + '/');
      return {
        url,
        stop() {
          proc.kill('SIGTERM');
          const log = path.join(dir, 'error.log');
          return fs.existsSync(log) ? fs.readFileSync(log, 'utf8') : '';
        },
      };
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  proc.kill('SIGTERM');
  throw new Error('Apache не ответил за 5 секунд');
}
