/* scripts/check-illustrations.mjs — в сборке нет заглушек вместо картинок
   и нет битых изображений.

   Две беды, из-за которых картинка пропадала с сайта молча:
   1. Страница показывает заглушку «Иллюстрация готовится» вместо
      фотографии: файл не нашёлся при сборке (так было с фото в «Немного
      истории» №4 — проверка наличия файла шла по адресу с ?v=, см.
      lib/assetUrl.ts → bezVersii).
   2. В странице осталась ссылка на картинку, которой в сборке нет.

   Проверка идёт по собранному сайту (out/) и падает на любом из двух:
     • в HTML страниц есть текст заглушки («Иллюстрация готовится»,
       «Портрета пока нет», «Здесь появится фотография»);
     • на любой адрес картинки из страниц, данных роутера (…/index.txt) и
       кода (_next/static) сервер отвечает не 200 с типом image/*. Сервер
       настоящий: файлы out/ отдаёт node:http, адреса разбираются так же,
       как их разбирает браузер (с ?v=…, без него, с %-кодами).
   Удалили картинку — тест падает, пока не поставлена замена.

   Запуск после pnpm build:  node scripts/check-illustrations.mjs */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(app, 'out');

/* Заглушки вместо изображений. Сюда же — любая новая фраза-заглушка. */
const ZAGLUSHKI = [
  /Иллюстраци[яи]\s+готовится/i,
  /Портрета\s+пока\s+нет/i,
  /Здесь\s+появится\s+фотография/i,
];

const EXT = /\.(?:png|jpe?g|webp|avif|gif|svg|ico)$/i;
const TYPES = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.avif': 'image/avif', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

if (!fs.existsSync(OUT)) {
  console.error('Нет папки out/: сначала pnpm build.');
  process.exit(1);
}

const all = walk(OUT);
const pages = all.filter((f) => f.endsWith('.html'));
const texts = all.filter((f) => /\.(?:html|txt|js|css)$/.test(f));

/* ── 1. Заглушки ─────────────────────────────────────────────── */
const errors = [];
for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  for (const re of ZAGLUSHKI) {
    const m = re.exec(html);
    if (m !== null) {
      const page = '/' + path.relative(OUT, path.dirname(file)).split(path.sep).join('/');
      errors.push(`заглушка «${m[0]}» на странице ${page === '/.' ? '/' : page + '/'}`);
    }
  }
}

/* ── 2. Адреса картинок ──────────────────────────────────────── */
/* Адрес картинки в тексте: в атрибутах HTML, в данных роутера, в коде и
   стилях. Берём любой путь от корня сайта, оканчивающийся на расширение
   картинки; значение после ? — версия — в адрес не входит. */
const URL_RE = /(\/[A-Za-z0-9_\-./%@~+]+?\.(?:png|jpe?g|webp|avif|gif|svg|ico))(?=[?#"'\\)\s,;<>]|$)/gi;
/* Откуда ссылка: нужна для сообщения об ошибке. */
const found = new Map(); // url → первая страница
/* Данные роутера в HTML Next.js режет на куски: <script>self.__next_f.push([1,"…"])</script>
   подряд, и граница куска может прийтись на середину адреса
   ("/image" | "s/mountains-network.webp"). Обрывок выглядел бы как
   отдельная битая ссылка, поэтому соседние куски сперва склеиваются. */
const RSC_STYK = /"\]\)<\/script><script>self\.__next_f\.push\(\[1,"/g;
for (const file of texts) {
  const text = fs.readFileSync(file, 'utf8').replace(RSC_STYK, '');
  let m;
  while ((m = URL_RE.exec(text)) !== null) {
    const url = m[1];
    /* Протокол-относительный адрес и путь в комментарии кода — не файл сайта. */
    if (url.startsWith('//')) continue;
    if (!found.has(url)) found.set(url, path.relative(OUT, file));
  }
}

const server = http.createServer((req, res) => {
  let p;
  try {
    p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }
  const file = path.join(OUT, p);
  if (!file.startsWith(OUT + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const { port } = server.address();

let checked = 0;
for (const [url, where] of found) {
  if (!EXT.test(url)) continue;
  const res = await fetch(`http://127.0.0.1:${port}${url}`);
  const type = res.headers.get('content-type') ?? '';
  await res.arrayBuffer();
  checked += 1;
  if (res.status !== 200) {
    errors.push(`картинка ${url}: ответ ${res.status} (ссылка в ${where})`);
  } else if (!type.startsWith('image/')) {
    errors.push(`картинка ${url}: тип ${type}, а не image/* (ссылка в ${where})`);
  }
}
server.close();

if (errors.length > 0) {
  console.error(`Картинки: ${errors.length} проблем(ы).`);
  errors.slice(0, 40).forEach((e) => console.error(`  ${e}`));
  console.error('Если картинку убрали намеренно, поставьте замену: заглушка в сборке не допускается.');
  process.exit(1);
}
console.log(
  `Картинки: страниц ${pages.length}, адресов картинок ${checked}, все отвечают 200, заглушек нет.`,
);
