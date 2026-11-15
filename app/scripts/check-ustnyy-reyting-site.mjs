#!/usr/bin/env node
/* scripts/check-ustnyy-reyting-site.mjs — рейтинг устного счёта в браузере.

   Запуск (сборка со входом, адрес и ключ — ненастоящие, запросы к ним
   перехватывает мок, как в check-auth.mjs):
     NEXT_PUBLIC_AUTH_ENABLED=1 NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
     NEXT_PUBLIC_SUPABASE_ANON_KEY=mock-anon-key pnpm build
     pnpm test:ustnyy-reyting-site [--snimki]

   Мок повторяет функции базы (миграция 20261115120000_ustnyy_schet.sql)
   упрощённо: примеры — генераторами форматов сайта, проверка ответа,
   буфер на два вперёд, итог. Сама миграция проверяется на настоящей
   базе (pnpm test:soglasiya-sql, supabase/tests/ustnyy-schet.test.sql),
   здесь — экраны.

   1. Гость: на рейтинговой тренировке и странице рейтинга — приглашение
      войти, тренировка формата без рейтинга доступна.
   2. Ученик, серия «Квадраты» с клавиатуры: ответы уходят на сервер по
      порядку, каждый один раз; сеть медленная (300 мс на ответ), а
      следующий пример показывается сразу из буфера; на скрытой вкладке
      время идёт (паузы нет); итоги — место в рейтинге от сервера.
   3. На время с подменённым временем: срок — по времени сервера, финиш
      один раз, после срока ответы не уходят.
   4. Ошибки старта (too_many_starts, vyzov_uzhe) — понятный текст.
   5. Страница рейтинга: ники, своё место, вне таблицы — отдельной
      строкой; смена ника (ошибка и успех), случайный ник, показ в
      рейтинге выключается; 320 px без прокрутки вбок. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { APP, requireSrc } from './lib/load-ts.mjs';
import { welcomeSeen } from './lib/onboarding.mjs';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';
import { normalizeEge } from './lib/dz-mock.mjs';

bezBanneraCookieVsyudu(chromium);

const OUT = path.join(APP, 'out');
const SUPABASE = 'http://127.0.0.1:54321';
const SNIMKI = process.argv.includes('--snimki')
  ? path.join(APP, '..', 'docs', 'ustnyy-schet-snimki')
  : null;
if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('Нет сборки: сначала pnpm build (со входом, см. начало файла).');
  process.exit(1);
}
{
  const js = fs
    .readdirSync(path.join(OUT, '_next', 'static', 'chunks'), { recursive: true })
    .filter((f) => String(f).endsWith('.js'))
    .some((f) =>
      fs
        .readFileSync(path.join(OUT, '_next', 'static', 'chunks', String(f)), 'utf8')
        .includes('127.0.0.1:54321'),
    );
  if (!js) {
    console.error(
      'Сборка без входа: соберите с NEXT_PUBLIC_AUTH_ENABLED=1 и адресом мока (см. начало файла).',
    );
    process.exit(1);
  }
}

const { FORMATY } = requireSrc('lib/ustnyySchet/formaty.ts');
const { createRng } = requireSrc('lib/ustnyySchet/rng.ts');

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
  console.log(`  ${ok ? 'ok' : 'НЕТ'}  ${what}`);
  return ok;
}

/* ── Мок функций базы ───────────────────────────────────────── */

const USER = {
  id: 'a1000000-0000-0000-0000-000000000000',
  email: 's1@x.ru',
  name: 'Ученик Первый',
};

function b64url(o) {
  return Buffer.from(JSON.stringify(o)).toString('base64url');
}
const TOKEN = `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({
  sub: USER.id,
  email: USER.email,
  role: 'authenticated',
  exp: Math.floor(Date.now() / 1000) + 24 * 3600,
})}.mock`;
const SESSION = {
  access_token: TOKEN,
  token_type: 'bearer',
  expires_in: 24 * 3600,
  expires_at: Math.floor(Date.now() / 1000) + 24 * 3600,
  refresh_token: 'r-1',
  user: {
    id: USER.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: USER.email,
    user_metadata: { name: USER.name, role: 'student' },
    app_metadata: { provider: 'email' },
  },
};

function createMock(o = {}) {
  const st = {
    starts: 0,
    finishes: 0,
    answers: [],
    nick: 'Быстрый Енот 27',
    pokazyvat: true,
    sessions: new Map(),
    startError: o.startError ?? null,
    answerDelay: o.answerDelay ?? 0,
    now: o.now ?? (() => Date.now()),
  };
  const genFor = (format) =>
    FORMATY.find((f) => f.id === (format === 'vyzov-dnya' ? 'kvadraty-20' : format));
  const vydat = (s, pos) => {
    const p = s.gen(s.rng);
    s.items.set(pos, p);
    return { pos, priyom: p.priyom, d: p.d, v: p.v ?? null };
  };
  const pg = (message) => ({
    status: 400,
    body: { code: 'P0001', message, details: null, hint: null },
  });

  const rpc = {
    ustnyy_start({ p_format }) {
      st.starts += 1;
      if (st.startError !== null) return pg(`${st.startError}: отказ`);
      const f = genFor(p_format);
      const tip = p_format === 'vyzov-dnya' ? 'seriya' : f.tip;
      const id = `ses-${st.starts}`;
      const now = st.now();
      const s = {
        id,
        format: p_format,
        tip,
        sek: tip === 'vremya' ? f.sek : null,
        n: tip === 'seriya' ? 20 : null,
        started: now,
        deadline: tip === 'vremya' ? now + f.sek * 1000 : now + 30 * 60_000,
        items: new Map(),
        rng: createRng(`mock-${st.starts}`),
        gen: f.istochnik,
        verno: 0,
        vsego: 0,
        active: true,
      };
      st.sessions.set(id, s);
      return {
        status: 200,
        body: {
          session: id,
          format: p_format,
          tip,
          sek: s.sek,
          n: s.n,
          nick: st.nick,
          server_now: now,
          deadline: s.deadline,
          items: [vydat(s, 1), vydat(s, 2)],
        },
      };
    },
    ustnyy_answer({ p_session, p_pos, p_answer }) {
      const s = st.sessions.get(p_session);
      if (s === undefined) return pg('not_your_session: чужая');
      if (!s.active) return pg('session_closed: закончена');
      st.answers.push({ pos: p_pos, at: st.now() });
      if (st.now() > s.deadline + 2000) return { status: 200, body: { kind: 'late' } };
      if (p_pos !== s.vsego + 1) return pg('bad_pos: не по порядку');
      const norm = normalizeEge(p_answer);
      if (norm === null) return { status: 200, body: { kind: 'format' } };
      const it = s.items.get(p_pos);
      const verno = norm === it.otvet;
      s.vsego += 1;
      if (verno) s.verno += 1;
      const next = s.tip === 'vremya' || p_pos + 2 <= s.n ? vydat(s, p_pos + 2) : null;
      return {
        status: 200,
        delay: st.answerDelay,
        body: {
          kind: 'answer',
          verno,
          otvet: it.otvet,
          next,
          done: s.tip === 'seriya' && p_pos >= s.n,
        },
      };
    },
    ustnyy_finish({ p_session }) {
      const s = st.sessions.get(p_session);
      if (s === undefined || !s.active) return pg('session_closed: закончена');
      st.finishes += 1;
      s.active = false;
      const net = s.tip === 'vremya' ? s.sek * 1000 : st.now() - s.started;
      const valid =
        s.vsego > 0 && s.verno * 5 >= s.vsego * 4 && (s.tip === 'vremya' || s.vsego >= s.n);
      return {
        status: 200,
        body: {
          valid,
          reason: valid ? null : s.vsego === 0 ? 'empty' : 'accuracy',
          verno: s.verno,
          vsego: s.vsego,
          net_ms: net,
          score_ms: net + 5000 * (s.vsego - s.verno),
          mesto: valid ? 3 : null,
          rekord: valid,
          prezhniy: null,
        },
      };
    },
    ustnyy_reyting({ p_format }) {
      const tip = p_format === 'vyzov-dnya' || p_format === 'kvadraty-20' ? 'seriya' : 'vremya';
      const rows = Array.from({ length: 12 }, (_, i) => ({
        mesto: i + 1,
        nick: `Зверь ${i + 1}`,
        verno: 40 - i,
        vsego: 41 - i,
        net_ms: 60_000,
        score_ms: 30_000 + i * 1500,
        at: Date.now(),
        ya: false,
      }));
      return {
        status: 200,
        body: {
          format: p_format,
          tip,
          rows,
          ya: {
            mesto: 57,
            nick: st.nick,
            verno: 20,
            vsego: 22,
            net_ms: 60_000,
            score_ms: 52_000,
            pokazyvat: st.pokazyvat,
          },
          vsego: 80,
        },
      };
    },
    ustnyy_moy_profil() {
      return {
        status: 200,
        body: { nick: st.nick, auto: true, pokazyvat: st.pokazyvat, mozhno: true },
      };
    },
    ustnyy_set_nick({ p_nick }) {
      if (String(p_nick).trim().length < 3) return { status: 200, body: { error: 'too_short' } };
      st.nick = String(p_nick).trim();
      return { status: 200, body: { nick: st.nick } };
    },
    ustnyy_random_nick() {
      st.nick = 'Мудрый Филин 42';
      return { status: 200, body: { nick: st.nick } };
    },
    ustnyy_set_pokazyvat({ p_pokazyvat }) {
      st.pokazyvat = p_pokazyvat;
      return { status: 200, body: { pokazyvat: p_pokazyvat } };
    },
  };

  function handle(method, url, body) {
    const u = new URL(url);
    const p = u.pathname;
    if (p === '/auth/v1/user') return { status: 200, body: SESSION.user };
    if (p === '/auth/v1/token') return { status: 200, body: SESSION };
    if (p.startsWith('/rest/v1/rpc/')) {
      const name = p.slice('/rest/v1/rpc/'.length);
      const f = rpc[name];
      if (f === undefined) return { status: 200, body: null };
      return f(body === null ? {} : JSON.parse(body));
    }
    if (p.startsWith('/rest/v1/')) return { status: 200, body: [] };
    return { status: 200, body: {} };
  }
  return { st, handle };
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers':
    'apikey, authorization, content-type, x-client-info, x-supabase-api-version, prefer, accept, accept-profile, content-profile',
  'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

async function installMock(ctx, mock) {
  await ctx.route(`${SUPABASE}/**`, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS });
      return;
    }
    let out;
    try {
      out = mock.handle(req.method(), req.url(), req.postData());
    } catch (e) {
      out = { status: 500, body: { message: `мок упал: ${e.message}` } };
    }
    if (out.delay) await new Promise((r) => setTimeout(r, out.delay));
    await route.fulfill({
      status: out.status,
      headers: { ...CORS, 'content-type': 'application/json' },
      body: out.body === null || out.body === undefined ? 'null' : JSON.stringify(out.body),
    });
  });
}

/* ── Статический сервер ─────────────────────────────────────── */

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
};
const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let file = path.join(OUT, url);
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!file.startsWith(OUT) || !fs.existsSync(file)) {
    res.writeHead(404, { 'content-type': TYPES['.html'] });
    fs.createReadStream(path.join(OUT, '404.html')).pipe(res);
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();

async function context(mock, { voshel = true, ...opts } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: SNIMKI === null ? 1 : 2,
    ...opts,
  });
  await welcomeSeen(ctx);
  if (voshel) {
    await ctx.addInitScript((s) => {
      try {
        localStorage.setItem('budetege-auth', s);
        localStorage.setItem('budetege:auth:remember', '1');
      } catch {
        /* нет хранилища */
      }
    }, JSON.stringify(SESSION));
  }
  await installMock(ctx, mock);
  return ctx;
}

async function open(ctx, url, wait) {
  const p = await ctx.newPage();
  p.setDefaultTimeout(20_000);
  p.errors = [];
  p.on('pageerror', (e) => p.errors.push(e.message));
  await p.goto(BASE + url, { waitUntil: 'load' });
  await p.locator(wait).first().waitFor({ state: 'visible' });
  return p;
}

async function snimok(p, name) {
  if (SNIMKI === null) return;
  await p.waitForTimeout(250);
  await p.screenshot({ path: path.join(SNIMKI, `${name}.png`), fullPage: true });
}

async function otvetNaTekushiy(p) {
  const expr = await p.locator('.us-igra__vopros').getAttribute('data-expr');
  const { vychislit, str } = requireSrc('lib/ustnyySchet/chislo.ts');
  return str(vychislit(expr)).replace('.', ',');
}

/* ── 1. Гость ───────────────────────────────────────────────── */
console.log('1. Гость');
{
  const mock = createMock();
  const ctx = await context(mock, { voshel: false });
  const p = await open(ctx, '/ustnyy-schet/trenirovka/?f=tablica-1m&rt=1', '.us-nastroyki');
  check(
    (await p.getByText('Войди, чтобы попасть в рейтинг').count()) > 0,
    'гостю — приглашение войти',
  );
  check(
    (await p.getByRole('button', { name: 'Тренироваться без рейтинга' }).count()) === 1,
    'гостю — тренировка без рейтинга',
  );
  await p.getByRole('button', { name: 'Тренироваться без рейтинга' }).click();
  await p.locator('.us-igra__vopros').waitFor();
  check(mock.st.starts === 0, 'практика гостя на сервер не ходит');
  const r = await open(ctx, '/ustnyy-schet/reyting/', '.us-reyting__vhod');
  check(
    (await r.getByRole('link', { name: 'Войти' }).count()) > 0,
    'страница рейтинга гостю — «Войти»',
  );
  check(
    p.errors.length === 0 && r.errors.length === 0,
    `ошибок нет ${[...p.errors, ...r.errors].join('; ')}`,
  );
  await ctx.close();
}

/* ── 2. Серия: буфер, очередь, без паузы ────────────────────── */
console.log('2. Рейтинговая серия');
{
  const mock = createMock({ answerDelay: 300 });
  const ctx = await context(mock);
  const p = await open(ctx, '/ustnyy-schet/trenirovka/?f=kvadraty-20&rt=1', '.us-nastroyki');
  await p.getByRole('button', { name: 'Начать' }).click();
  await p.locator('.us-igra__vopros').waitFor();
  check(mock.st.starts === 1, 'старт — один запрос');
  const t0 = Number(await p.locator('.us-taymer').getAttribute('data-ms'));
  /* Скрытая вкладка: время не встаёт. */
  await p.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await p.waitForTimeout(700);
  await p.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await p.waitForTimeout(200);
  const t1 = Number(await p.locator('.us-taymer').getAttribute('data-ms'));
  check(t1 - t0 >= 800, `на скрытой вкладке время идёт (${t1 - t0} мс)`);
  check((await p.locator('.us-igra__pauza').count()) === 0, 'плашки «пауза» нет');

  let bezOzhidaniya = 0;
  for (let i = 0; i < 20; i += 1) {
    const ans = await otvetNaTekushiy(p);
    const before = await p.locator('.us-igra__vopros').getAttribute('data-expr');
    await p.locator('#us-otvet').focus();
    await p.keyboard.type(ans);
    const tAns = Date.now();
    await p.keyboard.press('Enter');
    if (i < 19) {
      await p
        .waitForFunction(
          (b) => {
            const el = document.querySelector('.us-igra__vopros');
            return el !== null && el.getAttribute('data-expr') !== b;
          },
          before,
          { timeout: 5000 },
        )
        .catch(() => {});
      /* Ответ на сервер идёт 300 мс, а следующий пример уже на экране. */
      if (Date.now() - tAns < 250) bezOzhidaniya += 1;
    }
  }
  check(
    bezOzhidaniya >= 15,
    `следующий пример — сразу из буфера (${bezOzhidaniya} из 19 без ожидания сети)`,
  );
  await p.locator('.us-itogi').waitFor({ timeout: 20_000 });
  const posy = mock.st.answers.map((a) => a.pos);
  check(
    posy.length === 20 && posy.every((x, i) => x === i + 1),
    `ответы ушли по порядку, по одному: ${posy.join(',')}`,
  );
  check(mock.st.finishes === 1, 'финиш — один раз');
  check(
    (await p.getByText('Место в рейтинге: 3').count()) === 1,
    'итоги: место в рейтинге от сервера',
  );
  check((await p.getByRole('link', { name: 'Открыть рейтинг' }).count()) > 0, 'ссылка на рейтинг');
  await snimok(p, 'kompyuter-1280-reyting-itogi');
  check(p.errors.length === 0, `ошибок нет ${p.errors.join('; ')}`);
  await ctx.close();
}

/* ── 3. На время: срок сервера ──────────────────────────────── */
console.log('3. Рейтинговая тренировка на время');
{
  let sdvig = 0;
  const mock = createMock({ now: () => Date.now() + sdvig });
  const ctx = await context(mock);
  const p = await ctx.newPage();
  p.errors = [];
  p.on('pageerror', (e) => p.errors.push(e.message));
  await p.clock.install();
  await p.goto(`${BASE}/ustnyy-schet/trenirovka/?f=tablica-1m&rt=1&go=1`, { waitUntil: 'load' });
  await p.locator('.us-igra__vopros').waitFor();
  for (let i = 0; i < 3; i += 1) {
    await p.locator('#us-otvet').focus();
    await p.keyboard.type(await otvetNaTekushiy(p));
    await p.keyboard.press('Enter');
    await p.waitForTimeout(100);
  }
  await p.clock.pauseAt(Date.now() + 1000);
  const ost = Number(await p.locator('.us-taymer').getAttribute('data-ms'));
  check(ost > 55_000 && ost <= 60_000, `срок — минута по времени сервера (осталось ${ost} мс)`);
  sdvig = 60_000;
  await p.clock.runFor(ost + 1000);
  await p.locator('.us-itogi').waitFor({ timeout: 10_000 });
  check(mock.st.finishes === 1, 'по сроку — один финиш');
  check(mock.st.answers.length === 3, `после срока ответы не уходят (${mock.st.answers.length})`);
  check(p.errors.length === 0, `ошибок нет ${p.errors.join('; ')}`);
  await ctx.close();
}

/* ── 4. Ошибки старта ───────────────────────────────────────── */
console.log('4. Ошибки старта');
for (const [kod, tekst] of [
  ['too_many_starts', 'Слишком много рейтинговых тренировок'],
  ['vyzov_uzhe', 'Вызов дня сегодня уже пройден'],
]) {
  const mock = createMock({ startError: kod });
  const ctx = await context(mock);
  const p = await open(ctx, '/ustnyy-schet/trenirovka/?f=vyzov-dnya&rt=1&go=1', '.us-igra');
  await p.locator('.us-igra__pusto').waitFor();
  check((await p.locator('.us-igra__pusto').textContent())?.includes(tekst), `${kod}: «${tekst}…»`);
  await ctx.close();
}

/* ── 5. Страница рейтинга и ник ─────────────────────────────── */
console.log('5. Страница рейтинга');
for (const [ekran, opts] of [
  ['kompyuter-1280', {}],
  ['telefon-320', { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true }],
]) {
  const mock = createMock();
  const ctx = await context(mock, opts);
  const p = await open(ctx, '/ustnyy-schet/reyting/', '.us-reyting');
  await p.locator('.us-reyting__tablica').waitFor();
  check(
    (await p.locator('.us-reyting__tablica tbody tr').count()) === 12,
    `${ekran}: строки рейтинга`,
  );
  check(
    (await p.getByText('Твоё место: 57').count()) === 1,
    `${ekran}: своё место вне таблицы — отдельной строкой`,
  );
  check(
    !(await p.locator('.us-reyting').innerText()).includes(USER.name),
    `${ekran}: в рейтинге имени ученика нет — только ники`,
  );
  check(
    await p.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    ),
    `${ekran}: прокрутки вбок нет`,
  );
  await snimok(p, `${ekran}-reyting`);
  if (ekran === 'kompyuter-1280') {
    await p.locator('#us-nik-pole').fill('ab');
    await p.getByRole('button', { name: 'Сохранить' }).click();
    await p.getByText('Ник — от 3 символов.').waitFor();
    check(true, 'короткий ник — понятная ошибка');
    await p.locator('#us-nik-pole').fill('Математик 7');
    await p.getByRole('button', { name: 'Сохранить' }).click();
    await p.locator('.us-nik__tekushiy', { hasText: 'Математик 7' }).waitFor();
    check(mock.st.nick === 'Математик 7', 'ник сохранён на сервере');
    await p.getByRole('button', { name: 'Случайный ник' }).click();
    await p.locator('.us-nik__tekushiy', { hasText: 'Мудрый Филин 42' }).waitFor();
    check(true, 'случайный ник');
    await p
      .getByRole('switch', { name: 'Показывать меня в общем рейтинге' })
      .uncheck({ force: true });
    await p.waitForTimeout(300);
    check(mock.st.pokazyvat === false, 'показ в рейтинге выключен');
    await p.getByRole('button', { name: 'Неделя' }).click();
    await p.waitForTimeout(200);
    check(
      (await p.getByRole('button', { name: 'Неделя' }).getAttribute('aria-pressed')) === 'true',
      'вкладка периода',
    );
  }
  check(p.errors.length === 0, `${ekran}: ошибок нет ${p.errors.join('; ')}`);
  await ctx.close();
}

await browser.close();
server.close();

if (failures.length > 0) {
  console.error(`\nРейтинг устного счёта: ${failures.length} из ${checks} проверок не прошли:`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`\nРейтинг устного счёта в браузере: ${checks} проверок, всё в порядке.`);
