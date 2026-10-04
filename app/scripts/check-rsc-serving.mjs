/* scripts/check-rsc-serving.mjs — сырой RSC-текст никогда не виден.

   При переходе по сайту Next.js в статическом экспорте берёт рядом со
   страницей служебный файл …/index.txt (RSC) и дорисовывает экран.
   Если этот запрос падал (вкладка iPhone ушла в фон, сеть моргнула),
   Next.js 15 уводил браузер на сам index.txt, и ученик видел текст
   «1:"$Sreact.fragment" 2:I[…]». Исправлено в двух местах:

     1. patches/next@15.5.25.patch — после неудачного запроса
        открывается страница, а не index.txt; RSC-запрос всегда
        перепроверяется (cache: 'no-cache').
     2. public/.htaccess — index.txt, открытый как страница, уводится
        на страницу; служебный ответ не хранится (no-store) и помечен
        Vary.

   Проверки:
     A. Исправление в Next.js на месте: в установленном пакете и в
        собранных файлах. Потеряется при обновлении Next.js — упадёт.
     B. Заголовки настоящего Apache с нашим .htaccess (как на хостинге).
     C. Сценарии в браузере: обычный переход, упавшая фоновая подгрузка,
        уход вкладки в фон, новая версия сайта, прямое открытие
        index.txt. Сценарии гоняются дважды: через Apache с .htaccess и
        так, как сейчас отдаёт .txt nginx хостинга (без правил), —
        исправление в Next.js должно справляться и без сервера.

   Запуск после pnpm build:  node scripts/check-rsc-serving.mjs
   Нужны apache2 и Chromium (Playwright). */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { startApache } from './lib/apache.mjs';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(app, 'out');
const require = createRequire(import.meta.url);

const PAGE = '/zadaniya/4/';
const FROM = '/zadaniya/';
const TXT = PAGE + 'index.txt';

const failures = [];
function check(ok, what) {
  console.log(`${ok ? '  ✓' : '  ✗'} ${what}`);
  if (!ok) { failures.push(what); }
}

/* ── A. Исправление в Next.js на месте ─────────────────────────── */

console.log('A. Исправление Next.js (patches/)');
const nextDir = path.dirname(require.resolve('next/package.json'));
const patched = JSON.parse(fs.readFileSync(path.join(app, 'package.json'), 'utf8')).pnpm?.patchedDependencies ?? {};
const nextVersion = JSON.parse(fs.readFileSync(path.join(nextDir, 'package.json'), 'utf8')).version;
check(Object.keys(patched).includes(`next@${nextVersion}`),
  `патч объявлен для установленной версии next@${nextVersion} (сейчас: ${Object.keys(patched).join(', ') || 'нет'})`);
for (const rel of ['dist/client', 'dist/esm/client']) {
  const file = path.join(nextDir, rel, 'components/router-reducer/fetch-server-response.js');
  const src = fs.readFileSync(file, 'utf8');
  check(src.includes('budetege-patch: rsc-fallback-url') && src.includes('budetege-patch: rsc-no-cache'),
    `${rel}: обе правки патча в установленном пакете`);
}
const chunks = path.join(OUT, '_next/static/chunks');
const bundled = fs.readdirSync(chunks, { recursive: true })
  .filter((f) => String(f).endsWith('.js'))
  .some((f) => /cache:"no-cache",headers:/.test(fs.readFileSync(path.join(chunks, String(f)), 'utf8')));
check(bundled, 'правка попала в собранный код сайта (cache:"no-cache" у RSC-запроса)');

/* ── B. Заголовки Apache ───────────────────────────────────────── */

const apache = await startApache(OUT, 4180);
const A = apache.url;

async function head(url, headers = {}) {
  const res = await fetch(A + url, { headers, redirect: 'manual' });
  await res.arrayBuffer();
  return res;
}

console.log('\nB. Заголовки (Apache + public/.htaccess)');
{
  const html = await head(PAGE, { Accept: 'text/html' });
  check(html.status === 200 && /^text\/html/.test(html.headers.get('content-type') ?? ''), 'страница: 200, text/html');
  check(/no-cache/.test(html.headers.get('cache-control') ?? ''), `страница: Cache-Control no-cache (${html.headers.get('cache-control')})`);

  /* Так шлёт сценарий сайта: fetch с RSC: 1, Accept «звёздочка/звёздочка» и
     Sec-Fetch-Dest: empty (у старых Safari заголовка нет вовсе). */
  for (const [label, extra] of [['современный браузер', { 'Sec-Fetch-Dest': 'empty' }], ['старый Safari', {}]]) {
    const rsc = await head(TXT + '?_rsc=abc12', { Accept: '*/*', RSC: '1', ...extra });
    const vary = rsc.headers.get('vary') ?? '';
    check(rsc.status === 200, `RSC-запрос (${label}): 200, без перенаправления (${rsc.status})`);
    check(/^text\/(plain|x-component)/.test(rsc.headers.get('content-type') ?? ''), `RSC-запрос (${label}): ${rsc.headers.get('content-type')}`);
    check(/no-store/.test(rsc.headers.get('cache-control') ?? ''), `RSC-запрос (${label}): Cache-Control no-store`);
    check(/Accept/.test(vary) && /Sec-Fetch-Dest/.test(vary), `RSC-запрос (${label}): Vary ${vary}`);
  }

  for (const [label, headers] of [
    ['Sec-Fetch-Dest: document', { 'Sec-Fetch-Dest': 'document', Accept: 'text/html,*/*' }],
    ['старый Safari, Accept text/html', { Accept: 'text/html,application/xhtml+xml,*/*;q=0.8' }],
  ]) {
    const doc = await head(TXT + '?_rsc=abc12', headers);
    check(doc.status === 302 && doc.headers.get('location')?.endsWith(PAGE),
      `index.txt открыт как страница (${label}) → 302 на ${PAGE} (${doc.status} ${doc.headers.get('location')})`);
  }

  const index = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');
  const asset = /\/_next\/static\/[^"]+\.js/.exec(index)?.[0];
  const js = await head(asset);
  check(js.status === 200, `файл сборки ${asset}: 200`);
}

/* ── C. Сценарии в браузере ────────────────────────────────────── */

const browser = await chromium.launch(
  fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {},
);

/* Как сейчас отдаёт .txt nginx хостинга: файл как есть, text/plain,
   без перенаправлений и с кешем на год. Так проверяется само
   исправление в Next.js — без помощи .htaccess. */
async function asNginx(page) {
  await page.route('**/index.txt*', async (route) => {
    const url = new URL(route.request().url());
    const file = path.join(OUT, decodeURIComponent(url.pathname));
    if (!fs.existsSync(file)) { return route.fulfill({ status: 404, body: 'not found' }); }
    return route.fulfill({
      status: 200,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'max-age=31536000' },
      body: fs.readFileSync(file),
    });
  });
}

async function scenario(server, name, act) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const documents = [];
  page.on('request', (r) => {
    if (r.isNavigationRequest() && r.frame() === page.mainFrame()) { documents.push(new URL(r.url()).pathname); }
  });
  if (server === 'nginx') { await asNginx(page); }
  await act(page);
  await page.waitForTimeout(2500);
  const type = await page.evaluate(() => document.contentType).catch(() => '');
  const text = await page.evaluate(() => document.body?.innerText ?? '').catch(() => '');
  const raw = /^\s*\d+:"\$Sreact|^\s*\d+:I\[/m.test(text) || type === 'text/plain';
  const toTxt = documents.some((p) => p.endsWith('.txt'));
  check(!raw && !(server === 'nginx' && toTxt) && type === 'text/html',
    `[${server}] ${name}: ${new URL(page.url()).pathname}, ${type}${toTxt ? ', был переход на .txt' : ''}`);
  await context.close();
}

const link = (page) => page.locator(`a[href="${PAGE}"]`).first();

for (const server of ['apache', 'nginx']) {
  console.log(`\nC. Сценарии в браузере — ${server === 'apache' ? 'Apache с .htaccess' : '.txt отдаёт nginx, без правил'}`);

  await scenario(server, 'обычный переход по ссылке (без перезагрузки)', async (page) => {
    await page.goto(A + FROM, { waitUntil: 'networkidle' });
    await page.evaluate(() => { window.__sameDocument = true; });
    await link(page).click();
    await page.waitForURL('**' + PAGE);
    await page.waitForTimeout(800);
    check(await page.evaluate(() => window.__sameDocument === true), `[${server}] переход прошёл без полной перезагрузки`);
  });

  await scenario(server, 'сеть не отвечает в момент нажатия', async (page) => {
    await page.route('**' + TXT + '*', (r) => r.abort('failed'));
    await page.goto(A + FROM, { waitUntil: 'networkidle' });
    await link(page).click();
    await page.waitForTimeout(500);
    await page.unroute('**' + TXT + '*');
  });

  await scenario(server, 'фоновая подгрузка упала, сеть вернулась, нажали позже', async (page) => {
    await page.route('**' + TXT + '*', (r) => r.abort('failed'));
    await page.goto(A + FROM, { waitUntil: 'load' });
    await link(page).scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    await page.unroute('**' + TXT + '*');
    if (server === 'nginx') { await asNginx(page); }
    await link(page).click();
  });

  await scenario(server, 'вкладка ушла в фон во время подгрузки и вернулась', async (page) => {
    let release;
    const gate = new Promise((r) => { release = r; });
    await page.route('**' + TXT + '*', async (r) => { await gate; try { await r.continue(); } catch { /* запрос уже оборван */ } });
    await page.goto(A + FROM, { waitUntil: 'load' });
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    });
    release();
    await page.unroute('**' + TXT + '*');
    if (server === 'nginx') { await asNginx(page); }
    await page.waitForTimeout(300);
    await link(page).click();
  });

  await scenario(server, 'на сервере уже новая версия сайта', async (page) => {
    await page.route('**' + TXT + '*', async (r) => {
      const res = await r.fetch();
      const body = (await res.text()).replace(/"b":"[^"]+"/, '"b":"new-deploy"');
      await r.fulfill({ response: res, body });
    });
    await page.goto(A + FROM, { waitUntil: 'networkidle' });
    await link(page).click();
  });

  if (server === 'apache') {
    await scenario(server, 'index.txt открыт напрямую (ссылка из мессенджера)', async (page) => {
      await page.goto(A + TXT, { waitUntil: 'load' });
    });
  }
}

await browser.close();
const log = apache.stop();

if (failures.length > 0) {
  console.error(`\nПроверка не прошла (${failures.length}):`);
  failures.forEach((f) => console.error('  ' + f));
  if (log.trim()) { console.error('\nЖурнал Apache:\n' + log); }
  process.exit(1);
}
console.log('\nСырой RSC-текст не виден ни в одном сценарии.');
