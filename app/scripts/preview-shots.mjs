#!/usr/bin/env node
/* scripts/preview-shots.mjs — снимки страниц собранного сайта.

   Нужны, чтобы смотреть правки до слияния: превью-сборки у проекта нет,
   сайт выкладывается только из main. Скрипт поднимает готовый экспорт
   у себя и снимает страницы на трёх ширинах — тех же, на которых
   принимается вёрстка.

   Запуск: node scripts/preview-shots.mjs <папка-для-снимков>
   Список страниц можно дополнить через PREVIEW_PATHS — так workflow
   передаёт адреса, названные в описании pull request. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'out');
const PORT = 4180;

/* Ширины, на которых смотрится вёрстка: телефон, планшет, десктоп. */
const SHIRINY = [360, 768, 1440];

/* Страницы по умолчанию: главная, банк заданий и открытые разделы.
   Правится здесь — на каждый адрес выйдет по три снимка. */
const STRANITSY = ['/', '/zadaniya/', '/zadaniya/3/', '/zadaniya/4/', '/zadaniya/5/'];

/* Адреса из описания pull request. Берём только то, что похоже
   на путь этого сайта: описание правит человек, но подставлять
   оттуда строку в адрес без проверки всё равно нельзя. */
function dopolnitelnye() {
  const raw = process.env.PREVIEW_PATHS ?? '';
  return raw
    .split(/[,\s]+/)
    .filter((p) => /^\/[a-z0-9/_-]*\/?$/i.test(p) && p.length < 120)
    .map((p) => (p.endsWith('/') ? p : `${p}/`));
}

/* Имя файла из адреса: /zadaniya/4/ → zadaniya-4. */
function imya(put) {
  const chistyy = put.replace(/^\/|\/$/g, '');
  return chistyy === '' ? 'glavnaya' : chistyy.replace(/\//g, '-');
}

const TIPY = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

/* Свой сервер, а не готовый пакет: зависимость ради пяти строк
   в сборке лишняя. Экспорт сделан с trailingSlash, поэтому папке
   отдаётся её index.html. */
function server() {
  return http.createServer((req, res) => {
    const put = decodeURIComponent((req.url ?? '/').split('?')[0]);
    let file = path.join(OUT, put);
    if (!file.startsWith(OUT)) {
      res.writeHead(403).end();
      return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      file = path.join(file, 'index.html');
    }
    if (!fs.existsSync(file)) {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('404');
      return;
    }
    res.writeHead(200, { 'content-type': TIPY[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
}

async function main() {
  const kuda = process.argv[2];
  if (kuda === undefined) {
    throw new Error('Не указана папка для снимков');
  }
  if (!fs.existsSync(path.join(OUT, 'index.html'))) {
    throw new Error('Нет собранного экспорта: сначала pnpm build');
  }
  fs.mkdirSync(kuda, { recursive: true });

  const lishnie = dopolnitelnye();
  const puti = [...new Set([...STRANITSY, ...lishnie])];
  const srv = server();
  await new Promise((done) => srv.listen(PORT, done));

  /* CHROMIUM_PATH — для запуска с уже установленным в системе
     браузером: в CI его ставит playwright install, а на машине
     разработчика он может лежать своим путём. */
  const svoy = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch(svoy === undefined ? {} : { executablePath: svoy });
  const snimki = [];
  const propushcheny = new Set();
  try {
    for (const put of puti) {
      for (const shirina of SHIRINY) {
        /* Плотность 1, а не 2: снимки едут в репозиторий, и вес
           здесь важнее ретины — вёрстку видно и так. */
        const page = await browser.newPage({
          viewport: { width: shirina, height: 900 },
          deviceScaleFactor: 1,
        });
        const otvet = await page.goto(`http://127.0.0.1:${PORT}${put}`, {
          waitUntil: 'networkidle',
        });
        if (otvet === null || !otvet.ok()) {
          /* Страница из списка по умолчанию обязана открыться: если
             её нет, сломан сайт или список. А вот адрес из описания
             pull request — ручной ввод, и опечатка в нём не повод
             ронять весь прогон: пропускаем с предупреждением. */
          const svoy = lishnie.includes(put);
          const beda = `Страница ${put} не открылась: ${otvet?.status() ?? 'нет ответа'}`;
          await page.close();
          if (!svoy) {
            throw new Error(beda);
          }
          console.warn(`${beda} — пропущена`);
          propushcheny.add(put);
          break;
        }
        /* Шрифты грузятся после разметки: без ожидания снимок
           уходит с запасным начертанием и другой высотой строк. */
        await page.evaluate(() => document.fonts.ready);
        /* JPEG, а не PNG: снимок страницы целиком в PNG весит около
           мегабайта, и набор на один прогон выходит под полтора
           десятка. Эти файлы едут в репозиторий, поэтому вес важнее
           точности пикселя — вёрстку и цвет на качестве 82 видно. */
        const fayl = path.join(kuda, `${imya(put)}-${shirina}.jpg`);
        await page.screenshot({ path: fayl, fullPage: true, type: 'jpeg', quality: 82 });
        snimki.push({ put, shirina, fayl: path.basename(fayl) });
        await page.close();
      }
    }
  } finally {
    await browser.close();
    srv.close();
  }

  /* Опись рядом со снимками: по ней workflow собирает комментарий,
     не повторяя у себя список страниц и ширин. */
  const snyaty = puti.filter((p) => !propushcheny.has(p));
  fs.writeFileSync(
    path.join(kuda, 'opis.json'),
    `${JSON.stringify({ puti: snyaty, shiriny: SHIRINY, snimki }, null, 2)}\n`,
  );
  console.log(`Снимков: ${snimki.length}, страниц: ${puti.length}`);
}

await main();
