#!/usr/bin/env node
/* scripts/build-pereezd.mjs — 301 со старых адресов банка по номеру на
   адреса по коду раздела (docs/ege-2027-struktura-shag-0.md, раздел 5).

   Запуск: pnpm build:pereezd — переписывает блок между метками
   «# >>> pereezd-kody» и «# <<< pereezd-kody» в public/.htaccess.
   pnpm test:pereezd — только проверка: блок совпадает с тем, что
   строится, и каждый прежний адрес уходит ровно туда, куда записано.

   Источник — src/content/pereezd/starye-adresa.json (снят со сборки до
   переезда) и структура (src/content/struktura.js). На каждый номер
   хранения из таблицы — три правила, после особых правил файла (они
   ловят и номер, и код и ведут сразу на итоговый адрес):

     …/N/…/podgotovka/{блок}/  → /zadaniya/<код>/…/opornye-zadachi/{блок}/
     /zadaniya/N/…/            → /zadaniya/<код>/…/
     /zadaniya/N/файл.ext      → /zadaniya/<код>/файл.ext

   PDF в материалах — по одному правилу на файл, из
   src/content/pereezd/starye-pdf.json:

     /materials/zadanie-N/старое-имя.pdf → /materials/<код>/новое-имя.pdf

   Скрытого раздела в таблице нет — ему 404 (build-skrytye.mjs). Раздел
   без своей страницы (оптимизация, №17 хранения) уходит целиком туда,
   куда вела его заглушка. Проверка повторяет логику check-links.mjs:
   первое подходящее правило, $1… из совпадения. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTACCESS = path.join(APP, 'public', '.htaccess');
const NACHALO = '  # >>> pereezd-kody';
const KONEC = '  # <<< pereezd-kody';
const HOST = '%{ENV:SITE_SCHEME}://%{HTTP_HOST}';

const { RAZDELY } = await import(path.join(APP, 'src/content/struktura.js'));
const STARYE = JSON.parse(
  fs.readFileSync(path.join(APP, 'src/content/pereezd/starye-adresa.json'), 'utf8'),
);
const STARYE_PDF = JSON.parse(
  fs.readFileSync(path.join(APP, 'src/content/pereezd/starye-pdf.json'), 'utf8'),
);
const kodPo = new Map(RAZDELY.map((r) => [String(r.hranenie), r.kod]));

function nomera() {
  const set = new Set(Object.keys(STARYE).map((a) => a.split('/')[2]));
  return [...set].sort((a, b) => Number(a) - Number(b));
}

export function blokPravil() {
  const out = [
    '  # Адреса банка по номеру хранения → по коду раздела (scripts/build-pereezd.mjs).',
    '  # Блок пишет скрипт, руками не править.',
  ];
  for (const n of nomera()) {
    const kod = kodPo.get(n);
    const svoy = STARYE[`/zadaniya/${n}/`];
    if (svoy !== undefined && !svoy.startsWith(`/zadaniya/${kod}/`)) {
      /* Своей страницы у раздела нет: всё — туда, куда вела заглушка. */
      out.push(
        `  RewriteRule ^zadaniya/${n}((?:/[^/.]+)*)(/|/index\\.html)?$ ${HOST}${svoy} [R=301,L]`,
      );
      continue;
    }
    out.push(
      `  RewriteRule ^zadaniya/${n}((?:/[^/.]+)*)/podgotovka(/[^/.]+)?(/|/index\\.html)?$ ${HOST}/zadaniya/${kod}$1/opornye-zadachi$2/ [R=301,L]`,
      `  RewriteRule ^zadaniya/${n}((?:/[^/.]+)*)(/|/index\\.html)?$ ${HOST}/zadaniya/${kod}$1/ [R=301,L]`,
      `  RewriteRule ^zadaniya/${n}/(.+\\.[A-Za-z0-9]+)$ ${HOST}/zadaniya/${kod}/$1 [R=301,L]`,
    );
  }
  out.push('  # PDF в материалах: папка и имя — по коду раздела, без номера.');
  for (const [staryy, novyy] of Object.entries(STARYE_PDF)) {
    const re = staryy.slice(1).replace(/[.]/g, (c) => `\\${c}`);
    out.push(`  RewriteRule ^${re}$ ${HOST}${novyy} [R=301,L]`);
  }
  return out;
}

function sobrat(text) {
  const a = text.indexOf(NACHALO);
  const b = text.indexOf(KONEC);
  if (a === -1 || b === -1 || b < a) throw new Error('Нет меток pereezd-kody в public/.htaccess');
  return `${text.slice(0, a + NACHALO.length)}\n${blokPravil().join('\n')}\n${text.slice(b)}`;
}

/* Правила 301 файла — как их читает check-links.mjs. */
function pravila(text) {
  const out = [];
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*RewriteRule\s+(\S+)\s+(\S+)\s+\[([^\]]*R=301[^\]]*)\]/);
    if (m === null || m[1] === '^(.*)$') continue;
    out.push({ re: new RegExp(m[1]), to: m[2].replace(HOST, '') });
  }
  return out;
}
function kuda(rules, url) {
  const p = url.replace(/^\//, '');
  for (const r of rules) {
    const m = p.match(r.re);
    if (m !== null) return r.to.replace(/\$(\d)/g, (_, i) => m[Number(i)] ?? '');
  }
  return null;
}

export function proverit(text) {
  const rules = pravila(text);
  const oshibki = [];
  for (const [staryy, novyy] of Object.entries(STARYE)) {
    for (const v of [staryy, staryy.replace(/\/$/, ''), `${staryy}index.html`]) {
      const got = kuda(rules, v);
      if (got !== novyy) oshibki.push(`${v} → ${got ?? '—'}, нужно ${novyy}`);
    }
  }
  for (const [staryy, novyy] of Object.entries(STARYE_PDF)) {
    const got = kuda(rules, staryy);
    if (got !== novyy) oshibki.push(`${staryy} → ${got ?? '—'}, нужно ${novyy}`);
    if (!fs.existsSync(path.join(APP, 'public', novyy)))
      oshibki.push(`${novyy}: нет файла в public`);
    if (fs.existsSync(path.join(APP, 'public', staryy)))
      oshibki.push(`${staryy}: старый файл остался в public`);
  }
  /* ?… Apache сохраняет сам, проверять нечего; файл — на файл. */
  const fayl = kuda(rules, '/zadaniya/1/dannye/primer.json');
  if (fayl !== '/zadaniya/planimetriya/dannye/primer.json') oshibki.push(`файл → ${fayl}`);
  if (kuda(rules, '/zadaniya/6/') !== null) oshibki.push('у скрытого раздела не должно быть 301');
  return oshibki;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const text = fs.readFileSync(HTACCESS, 'utf8');
  const novyy = sobrat(text);
  const tolkoProverka = process.argv.includes('--check');
  if (tolkoProverka && novyy !== text) {
    console.error('Блок pereezd-kody в public/.htaccess устарел: pnpm build:pereezd');
    process.exit(1);
  }
  if (!tolkoProverka) fs.writeFileSync(HTACCESS, novyy);
  const oshibki = proverit(novyy);
  if (oshibki.length > 0) {
    console.error(`Переезд адресов: ${oshibki.length} ошибок`);
    for (const o of oshibki.slice(0, 30)) console.error(`  — ${o}`);
    process.exit(1);
  }
  console.log(
    `Переезд адресов: ${Object.keys(STARYE).length} прежних адресов (×3 написания) и ${Object.keys(STARYE_PDF).length} PDF уходят ровно туда, куда записано.`,
  );
}
