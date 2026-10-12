#!/usr/bin/env node
/* scripts/check-pdf-spravochnik-1.mjs — справочник по планиметрии №1
   для печати и PDF (этап 3).

   Запуск: pnpm build && pnpm test:pdf-spravochnik-1

   Собранная страница /zadaniya/1/pechat/spravochnik/ открывается
   в Chromium дважды — с примерами и без (?primery=0) — и после
   раскладки (paginate.js, две колонки) проверяется готовый лист:
     — раскладка без ошибок, ни один кусок не выше колонки;
     — каждая карточка данных стоит ровно один раз, целиком внутри своей
       колонки (или на всю ширину листа) — карточка не рвётся и не
       обрезана; разборы — все 84 или ни одного, каждый после своей
       карточки;
     — заголовок раздела стоит на одной странице со своей первой
       карточкой; в содержании первой страницы — номера страниц
       разделов, и они совпадают с настоящими;
     — шапка «Справочник по планиметрии · Задание №1 ЕГЭ» и номер
       «N / M» на каждой странице;
     — формулы набраны KaTeX без ошибок, сырого TeX в тексте нет,
       формулы, чертежи и таблицы не вылезают за рамку;
     — окно печати открылось один раз.
   Число страниц в PDF и пустые страницы проверяет test:print-pages.
   Готовые PDF (build:pdf-spravochnik-1) лежат на месте, и страниц в них
   столько же, сколько раскладывает лист сейчас.
   «Назад» и хлебные крошки на бумагу не попадают; «Теория → печать →
   Назад» и прямой заход на печать → «Назад» приводят на вкладку
   «Теория» №1; кнопка «Назад» не меньше 44×44 px и липкая.
   «Скачать справочник» на вкладке «Теория»: aria-label, download,
   отдаёт PDF, подпись «PDF, A4, N страниц», переключатель меняет файл. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { APP, requireSrc } from './lib/load-ts.mjs';
import { bezBanneraCookie } from './lib/cookie-notice.mjs';
import { findRawTex } from './lib/math-markup.mjs';

const OUT = path.join(APP, 'out');
if (!fs.existsSync(OUT)) {
  console.error('Нет папки сборки out: сначала pnpm build');
  process.exit(1);
}

const { RAZDELY_SPRAVOCHNIKA_1, TEMY_SPRAVOCHNIKA_1, SPRAVOCHNIK_1 } = requireSrc(
  'content/spravochnik1/index.ts',
);
const KARTOCHKI = TEMY_SPRAVOCHNIKA_1.map((t) => `k-${t.id}`);
const PRIMERY = TEMY_SPRAVOCHNIKA_1.flatMap((t) =>
  (t.primery ?? []).map((_, i) => `p-${t.id}-${i + 1}`),
);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};
const server = http.createServer((req, res) => {
  let file = path.join(OUT, decodeURIComponent(req.url.split('?')[0]));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    file = path.join(file, 'index.html');
  }
  if (!fs.existsSync(file)) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const BASE = 'http://127.0.0.1:' + server.address().port;

const ispolnyaemyy =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
  (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = bezBanneraCookie(
  await chromium.launch(ispolnyaemyy === undefined ? {} : { executablePath: ispolnyaemyy }),
);

const oshibki = [];
function proverka(ok, chto) {
  if (!ok) oshibki.push(chto);
}

/** Лист после раскладки: всё, что нужно проверкам, одним снимком. */
async function snyatList(page) {
  return page.evaluate(() => {
    const host = document.getElementById('sheet-pages');
    const pages = [...host.querySelectorAll('.sheet-page')];
    const stranitsa = (el) => pages.indexOf(el.closest('.sheet-page')) + 1;
    const ramka = (k) =>
      k.closest('.spr1p-blok, .spr1p-primer, .spr1p-card, .spr1p-pr, .spr1p-toc, .spr1p-kak');
    const kuski = [...host.querySelectorAll('[data-item-id]')].map((el) => {
      const r = el.getBoundingClientRect();
      const col = el.closest('.sheet-col');
      const mesto = (col ?? el.closest('.sheet-flow')).getBoundingClientRect();
      return {
        id: el.getAttribute('data-item-id'),
        stranitsa: stranitsa(el),
        vnutri:
          r.top >= mesto.top - 0.5 &&
          r.bottom <= mesto.bottom + 0.5 &&
          r.left >= mesto.left - 0.5 &&
          r.right <= mesto.right + 0.5,
      };
    });
    const shire = [...host.querySelectorAll('.katex, svg.pl, table')]
      .filter((k) => {
        const box = ramka(k);
        if (box === null) return false;
        const a = k.getBoundingClientRect();
        const b = box.getBoundingClientRect();
        return a.width > 0 && (a.right > b.right + 1 || a.left < b.left - 1);
      })
      .map((k) => k.closest('[data-item-id]')?.getAttribute('data-item-id'));
    const toc = [...host.querySelectorAll('[data-toc-ref]')].map((el) => ({
      ref: el.getAttribute('data-toc-ref'),
      nomer: el.textContent.trim(),
    }));
    const tekst = host.cloneNode(true);
    tekst
      .querySelectorAll('.katex-mathml, annotation, script, style, svg')
      .forEach((n) => n.remove());
    return {
      otchet: window.sheetPagination,
      stranic: pages.length,
      shapki: pages.map((p) => p.querySelector('.sheet-head')?.textContent ?? ''),
      nomera: pages.map((p) => p.querySelector('[data-page-number]')?.textContent ?? ''),
      kuski,
      shire,
      toc,
      katexOshibok: host.querySelectorAll('.katex-error').length,
      tekst: tekst.textContent ?? '',
      pechat: window.__pechat ?? 0,
    };
  });
}

/* Готовые файлы (build:pdf-spravochnik-1) и число их страниц. */
const MANIFEST = JSON.parse(
  fs.readFileSync(path.join(APP, 'src', 'content', 'spravochnik1', 'pdf.json'), 'utf8'),
);

const stroki = [];
for (const [imya, zapros, sPrimerami, klyuch] of [
  ['с примерами', '', true, 'sPrimerami'],
  ['без примеров', '?primery=0', false, 'bezPrimerov'],
]) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 1200 } });
  await page.addInitScript(() => {
    window.print = () => {
      window.__pechat = (window.__pechat ?? 0) + 1;
    };
  });
  await page.goto(`${BASE}/zadaniya/1/pechat/spravochnik/${zapros}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.sheetPagination !== undefined, null, {
    timeout: 120000,
  });
  await page
    .waitForFunction(() => (window.__pechat ?? 0) > 0, null, { timeout: 10000 })
    .catch(() => {});
  const l = await snyatList(page);
  const pre = `${imya}:`;

  proverka(l.otchet.error === undefined, `${pre} раскладка упала — ${l.otchet.error}`);
  proverka(
    l.otchet.overflowing.length === 0,
    `${pre} выше колонки или обрезано: ${l.otchet.overflowing.join(', ')}`,
  );

  const ids = l.kuski.map((k) => k.id);
  for (const id of KARTOCHKI) {
    const n = ids.filter((x) => x === id).length;
    proverka(n === 1, `${pre} карточка ${id} на листе ${n} раз`);
  }
  const primery = ids.filter((x) => x.startsWith('p-'));
  proverka(
    primery.length === (sPrimerami ? PRIMERY.length : 0),
    `${pre} разборов ${primery.length}, ожидалось ${sPrimerami ? PRIMERY.length : 0}`,
  );
  for (const p of primery) {
    const k = `k-${p.replace(/^p-/, '').replace(/-\d+$/, '')}`;
    proverka(ids.indexOf(p) > ids.indexOf(k), `${pre} разбор ${p} стоит раньше своей карточки`);
  }
  for (const k of l.kuski) {
    proverka(k.vnutri, `${pre} ${k.id} выходит за свою колонку (стр. ${k.stranitsa})`);
  }

  for (const r of RAZDELY_SPRAVOCHNIKA_1) {
    const kusok = l.kuski.find((k) => k.id === `r-${r.id}`);
    proverka(kusok !== undefined, `${pre} нет заголовка раздела ${r.id}`);
    if (kusok === undefined) continue;
    const pervaya = l.kuski.find((k) => k.id === `k-${r.temy[0].id}`);
    proverka(
      pervaya?.stranitsa === kusok.stranitsa,
      `${pre} заголовок раздела ${r.no} на стр. ${kusok.stranitsa}, а первая карточка — на ${pervaya?.stranitsa}`,
    );
    const v = l.toc.find((t) => t.ref === r.id);
    proverka(
      v !== undefined && v.nomer === String(kusok.stranitsa),
      `${pre} в содержании у раздела ${r.no} стр. ${v?.nomer}, а он на стр. ${kusok.stranitsa}`,
    );
  }
  proverka(
    l.kuski.find((k) => k.id === 'soderzhanie')?.stranitsa === 1,
    `${pre} содержание не на первой странице`,
  );

  for (const [i, shapka] of l.shapki.entries()) {
    const t = shapka.replace(/\s+/g, ' ');
    proverka(
      t.includes(SPRAVOCHNIK_1.title) && t.includes(SPRAVOCHNIK_1.pdf.zadanie),
      `${pre} стр. ${i + 1}: в шапке «${t.trim()}»`,
    );
  }
  for (const [i, n] of l.nomera.entries()) {
    const nomer = n.replace(/\s+/g, ' ');
    proverka(nomer === `${i + 1} / ${l.stranic}`, `${pre} стр. ${i + 1}: номер «${nomer}»`);
  }

  proverka(l.katexOshibok === 0, `${pre} ошибок KaTeX: ${l.katexOshibok}`);
  const syroy = findRawTex(l.tekst.replace(/\s+/g, ' '));
  proverka(syroy.length === 0, `${pre} сырой TeX в тексте листа: ${syroy.length}`);
  proverka(l.shire.length === 0, `${pre} шире своей рамки: ${[...new Set(l.shire)].join(', ')}`);
  proverka(l.pechat === 1, `${pre} окно печати открывалось ${l.pechat} раз`);

  /* Готовый PDF не отстал от данных: страниц столько же, сколько
     раскладывает лист сейчас. Отстал — pnpm build:pdf-spravochnik-1. */
  const fayl = MANIFEST[klyuch];
  proverka(
    fs.existsSync(path.join(APP, 'public', fayl.fayl)),
    `${pre} нет готового файла ${fayl.fayl}`,
  );
  proverka(
    fayl.stranic === l.stranic,
    `${pre} в готовом PDF ${fayl.stranic} стр., а лист сейчас — ${l.stranic}: пересоберите pnpm build:pdf-spravochnik-1`,
  );

  /* «Назад» и крошки на бумагу не попадают. */
  await page.emulateMedia({ media: 'print' });
  const vidnoVPechati = await page.evaluate(() =>
    ['.spr1p-verh', '.spr1-pdf', '.spr1p-bar'].filter((sel) => {
      const el = document.querySelector(sel);
      return el !== null && getComputedStyle(el).display !== 'none';
    }),
  );
  proverka(vidnoVPechati.length === 0, `${pre} при печати видно: ${vidnoVPechati.join(', ')}`);

  stroki.push(
    `${imya.padEnd(13)} страниц ${String(l.stranic).padStart(2)}, карточек ${KARTOCHKI.length}, разборов ${primery.length}`,
  );
  await page.close();
}

/* Вкладка «Теория»: «Скачать справочник» отдаёт готовый PDF,
   переключатель меняет файл. */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.addInitScript(() => {
    window.print = () => {};
  });
  await page.goto(`${BASE}/zadaniya/1/teoriya/`, { waitUntil: 'networkidle' });
  const knopka = page.locator('.spr1-pdf__knopka');
  const adres = async () => (await knopka.getAttribute('href')) ?? '';
  proverka(
    (await knopka.getAttribute('aria-label')) === SPRAVOCHNIK_1.pdf.skachatAria,
    'веб: у кнопки нет aria-label «Скачать справочник по планиметрии в PDF»',
  );
  proverka((await knopka.getAttribute('download')) !== null, 'веб: у кнопки нет атрибута download');
  const sPrimerami = await adres();
  proverka(
    sPrimerami.split('?')[0] === MANIFEST.sPrimerami.fayl,
    `веб: «Скачать справочник» ведёт на ${sPrimerami}`,
  );
  const otvet = await page.request.get(`${BASE}${sPrimerami}`);
  const telo = await otvet.body();
  proverka(
    otvet.ok() && telo.subarray(0, 5).toString() === '%PDF-',
    `веб: по ${sPrimerami} не PDF (${otvet.status()})`,
  );
  const podpis = await page.locator('.spr1-pdf__podpis').textContent();
  proverka(
    podpis === SPRAVOCHNIK_1.pdf.podpis(MANIFEST.sPrimerami.stranic),
    `веб: подпись под кнопкой «${podpis}»`,
  );
  /* Нажатие — загрузка файла (вкладка сайта остаётся на месте). */
  const [zagruzka] = await Promise.all([page.waitForEvent('download'), knopka.click()]);
  proverka(
    zagruzka.suggestedFilename().endsWith('.pdf'),
    `веб: скачался файл «${zagruzka.suggestedFilename()}»`,
  );
  proverka(
    page.url().endsWith('/zadaniya/1/teoriya/'),
    `веб: после скачивания вкладка на ${page.url()}`,
  );
  await page.locator('.spr1-pdf__switch').click();
  proverka(
    (await adres()).split('?')[0] === MANIFEST.bezPrimerov.fayl,
    `веб: без примеров кнопка ведёт на ${await adres()}`,
  );

  /* «Теория → печать → Назад» возвращает на теорию. */
  await page.locator('.spr1-pdf__pechat').click();
  await page.waitForURL(/\/pechat\/spravochnik\//);
  await page.locator('.spr1p-nazad').click();
  await page.waitForURL(/\/zadaniya\/1\/teoriya\/$/, { timeout: 15000 }).catch(() => {});
  proverka(
    page.url().endsWith('/zadaniya/1/teoriya/'),
    `назад: с печати после теории попали на ${page.url()}`,
  );
  await page.close();
}

/* Прямой заход на печатную страницу: «Назад» ведёт на теорию №1. */
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.addInitScript(() => {
    window.print = () => {};
  });
  await page.goto(`${BASE}/zadaniya/1/pechat/spravochnik/`, { waitUntil: 'networkidle' });
  const nazad = page.locator('.spr1p-nazad');
  const box = await nazad.boundingBox();
  proverka(
    box !== null && box.width >= 44 && box.height >= 44,
    `назад: кнопка ${box?.width}×${box?.height} px, нужно не меньше 44×44`,
  );
  await page.mouse.wheel(0, 3000);
  await page.waitForTimeout(200);
  const posle = await nazad.boundingBox();
  proverka(
    posle !== null && posle.y >= -1 && posle.y < 60,
    'назад: кнопка не липкая при прокрутке',
  );
  await nazad.click();
  await page.waitForURL(/\/zadaniya\/1\/teoriya\/$/, { timeout: 15000 }).catch(() => {});
  proverka(
    page.url().endsWith('/zadaniya/1/teoriya/'),
    `назад: с прямого захода попали на ${page.url()}`,
  );
  await page.close();
}

await browser.close();
server.close();
console.log(stroki.join('\n'));
if (oshibki.length > 0) {
  console.error(`\nСправочник №1, PDF (${oshibki.length}):`);
  oshibki.slice(0, 40).forEach((o) => console.error('  ✗ ' + o));
  process.exit(1);
}
console.log(
  '\nСправочник №1, PDF: лист разложен, карточки целы, содержание и номера страниц верны.',
);
