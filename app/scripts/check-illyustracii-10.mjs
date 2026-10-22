#!/usr/bin/env node
/* scripts/check-illyustracii-10.mjs — иллюстрации сюжетов задания №10.

   Запуск:
     node scripts/check-illyustracii-10.mjs          — список слотов: какие
       картинки уже лежат в public/illustrations/zadanie-10/, какие пусты;
       у заполненного слота должны быть оба файла (webp и png) и png
       читаться. Пустой слот — не ошибка: картинку рисует автор.
     node scripts/check-illyustracii-10.mjs --site   — после pnpm build:
       на страницах разделов (out/zadaniya/10/ и 11/) нет заглушек («Иллюстрация
       готовится» и т. п.), и каждое изображение, на которое ссылаются
       страницы out/, отдаётся статическим сервером с кодом 200 и типом
       image/*. (Заглушки других разделов ловит их собственная проверка.) */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { APP, requireSrc } from './lib/load-ts.mjs';

const site = process.argv.includes('--site');
const problems = [];

if (!site) {
  const { PROTOTYPES, kodNaSayte } = requireSrc('lib/zadanie10/prototypes');
  const { faylSlota, altSlota } = requireSrc('lib/zadanie10/illyustracii');
  const dir = path.join(APP, 'public/illustrations/zadanie-10');
  const pustye = [];
  for (const p of PROTOTYPES) {
    const f = faylSlota(p.id);
    const webp = fs.existsSync(path.join(dir, `${f}.webp`));
    const png = fs.existsSync(path.join(dir, `${f}.png`));
    if (!webp && !png) {
      pustye.push(`${kodNaSayte(p.id)} ${p.title} → ${f}.webp + ${f}.png`);
    } else if (!webp || !png) {
      problems.push(`${p.id}: есть только ${webp ? 'webp' : 'png'} — нужны оба файла`);
    } else {
      const buf = fs.readFileSync(path.join(dir, `${f}.png`));
      if (buf.toString('ascii', 1, 4) !== 'PNG') {
        problems.push(`${f}.png — не PNG`);
      }
      const razmer = fs.statSync(path.join(dir, `${f}.webp`)).size;
      if (razmer > 300 * 1024) {
        problems.push(`${f}.webp — ${Math.round(razmer / 1024)} КБ, больше 300 КБ`);
      }
    }
    const alt = altSlota(p.id, p.alt);
    if (!alt || alt.length < 10) {
      problems.push(`${p.id}: нет alt-текста`);
    }
  }
  /* Лишние файлы: всё в папке должно принадлежать какому-то слоту. */
  const nuzhnye = new Set(
    PROTOTYPES.flatMap((p) => [`${faylSlota(p.id)}.webp`, `${faylSlota(p.id)}.png`]),
  );
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
    if (!nuzhnye.has(f)) {
      problems.push(`${f}: файл не относится ни к одному слоту`);
    }
  }
  console.log(
    `Слотов иллюстраций: ${PROTOTYPES.length}, заполнено ${PROTOTYPES.length - pustye.length}, пустых ${pustye.length}.`,
  );
  pustye.forEach((s) => console.log(`  пусто: ${s}`));
} else {
  const OUT = path.join(APP, 'out');
  if (!fs.existsSync(path.join(OUT, 'index.html'))) {
    console.error('Нет out/index.html — сначала pnpm build.');
    process.exit(1);
  }
  const ZAGLUSHKI = [
    /Иллюстраци[яи]\s+готовится/i,
    /Картинк[аи]\s+готовится/i,
    /Здесь\s+появится\s+(?:фото|картинка|иллюстрация)/i,
  ];
  const IMG =
    /(\/[A-Za-z0-9_\-./%@~+]+?\.(?:png|jpe?g|webp|avif|gif|svg|ico))(?=[?#"'\\)\s,;<>]|$)/gi;
  const urls = new Set();
  const walk = function* (d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        yield* walk(p);
      } else if (/\.(html|txt|css)$/.test(e.name)) {
        yield p;
      }
    }
  };
  /* Данные роутера в HTML режутся на куски self.__next_f.push(…), и граница
     куска может прийтись на середину адреса («/image» | «s/…webp»). Как в
     check-illustrations.mjs: куски склеиваем, иначе обрывок адреса виден
     как отдельная битая картинка. */
  const STYK = /"\]\)<\/script><script>self\.__next_f\.push\(\[1,"/g;
  for (const f of walk(OUT)) {
    const s = fs.readFileSync(f, 'utf8').replace(STYK, '');
    /* №11 — там та же общая теория единиц со слотами stepeni-*. */
    const razdel = ['10', '11'].some((n) =>
      path.relative(OUT, f).startsWith(`zadaniya${path.sep}${n}${path.sep}`),
    );
    for (const z of razdel ? ZAGLUSHKI : []) {
      if (z.test(s)) {
        problems.push(`${path.relative(OUT, f)}: заглушка «${s.match(z)?.[0]}»`);
      }
    }
    for (const m of s.matchAll(IMG)) {
      if (!m[1].startsWith('//')) {
        urls.add(m[1]);
      }
    }
  }
  const types = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    avif: 'image/avif',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    ico: 'image/x-icon',
  };
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
    const file = path.join(OUT, url);
    if (file.startsWith(OUT) && fs.existsSync(file) && fs.statSync(file).isFile()) {
      res.writeHead(200, {
        'content-type':
          types[path.extname(file).slice(1).toLowerCase()] ?? 'application/octet-stream',
      });
      res.end(fs.readFileSync(file));
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((ok) => server.listen(0, ok));
  const port = server.address().port;
  for (const u of urls) {
    const r = await new Promise((ok) => {
      http.get(`http://127.0.0.1:${port}${u}`, (res) => {
        res.resume();
        ok({ code: res.statusCode, type: res.headers['content-type'] ?? '' });
      });
    });
    if (r.code !== 200 || !String(r.type).startsWith('image/')) {
      problems.push(`${u} → ${r.code} ${r.type}`);
    }
  }
  server.close();
  console.log(`Изображений в экспорте: ${urls.size}, проверено: каждое отдаётся с кодом 200.`);
}

if (problems.length > 0) {
  console.error(`Проблем: ${problems.length}`);
  problems.forEach((p) => console.error('  ' + p));
  process.exit(1);
}
