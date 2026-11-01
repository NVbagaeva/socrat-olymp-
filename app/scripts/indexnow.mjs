#!/usr/bin/env node
/* scripts/indexnow.mjs — сообщить Яндексу (IndexNow) об изменённых страницах.

   Запуск: последним шагом выкладки (deploy.yml), после заливки на хостинг.

   Список адресов — app/out/seo-changed.txt: его пишет
   scripts/seo-postbuild.mjs — страницы, у которых изменился текст с
   прошлой выкладки, и новые. Ключ — переменная INDEXNOW_KEY (GitHub:
   Settings → Secrets and variables → Actions → Variables); файл ключа
   https://budetege.ru/<ключ>.txt кладёт в сборку тот же postbuild, и к
   этому шагу он уже на хостинге.

   Нет ключа или нечего отправлять — шаг ничего не делает и не падает.
   Ответ Яндекса печатается; ошибка IndexNow выкладку не роняет (сайт
   уже выложен), но видна в журнале шага. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOST = 'budetege.ru';
const ENDPOINT = 'https://yandex.com/indexnow';

const key = (process.env.INDEXNOW_KEY ?? '').trim();
if (key === '') {
  console.log('IndexNow: ключ INDEXNOW_KEY не задан — пропускаю.');
  process.exit(0);
}
const file = path.join(APP, 'out', 'seo-changed.txt');
const urls = fs.existsSync(file)
  ? fs.readFileSync(file, 'utf8').split('\n').map((s) => s.trim()).filter((s) => s.startsWith(`https://${HOST}/`))
  : [];
if (urls.length === 0) {
  console.log('IndexNow: изменённых страниц нет — отправлять нечего.');
  process.exit(0);
}

/* Яндекс принимает до 10 000 адресов за запрос. */
for (let i = 0; i < urls.length; i += 10000) {
  const urlList = urls.slice(i, i + 10000);
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${key}.txt`, urlList }),
  }).catch((error) => ({ ok: false, status: 0, text: async () => String(error) }));
  const text = await res.text();
  console.log(`IndexNow: отправлено ${urlList.length}, ответ ${res.status} ${text.slice(0, 300)}`);
  if (!res.ok && res.status !== 202) {
    console.log('::warning::IndexNow не принял список — страницы Яндекс найдёт по sitemap.xml');
  }
}
