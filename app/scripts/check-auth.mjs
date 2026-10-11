#!/usr/bin/env node
/* scripts/check-auth.mjs — вход, регистрация и кабинет в браузере.

   Запуск после pnpm build:
     node scripts/check-auth.mjs [папка-для-снимков]      сборка со входом
     node scripts/check-auth.mjs --disabled                сборка без входа

   Служба входа (Supabase: GoTrue и PostgREST) здесь не настоящая, а
   мок внутри Playwright: все запросы к адресу проекта перехватываются
   и отвечают так, как отвечает сервис. Письма складываются в ящик
   мока, ссылки из них открываются в том же браузере. Так сценарий
   идёт без сети и без секретов и одинаково в CI и на машине.

   Сборку со входом собирают с переменными:
     NEXT_PUBLIC_AUTH_ENABLED=1
     NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
     NEXT_PUBLIC_SUPABASE_ANON_KEY=mock-anon-key

   Сценарии (сборка со входом):
     • шапка на 1440 и 390: «Войти» есть, горизонтальной прокрутки нет,
       в меню телефона тоже «Войти»;
     • регистрация чужой почтой → «Регистрация пока по приглашению»,
       ошибок в консоли нет;
     • регистрация разрешённой почтой → письмо → ссылка → подтверждение
       → кабинет; в шапке кружок с инициалами;
     • кабинет: имя, почта, роль; смена имени и роли;
     • выход из меню шапки; неверный пароль; вход без подтверждения
       почты → «Подтвердите почту…» и повторная отправка;
     • «Запомнить меня» выключено → сессия в sessionStorage;
     • сброс пароля: письмо → новый пароль → вход новым паролем;
     • комплект репетитора записывается в аккаунт;
     • удаление аккаунта с подтверждением;
     • SDK не входит в первую загрузку главной и страницы задания;
     • на 390 «Войти» не пересекает закреплённую панель генератора и
       кнопку «?» (если она есть), горизонтальной прокрутки нет.
   Сценарии (сборка без входа): кнопки «Войти» нет ни в шапке, ни в
   меню, ни в оболочке заданий; /voyti/ и /kabinet/ честно говорят,
   что вход не включён; адреса сервиса в сборке нет. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { bezBanneraCookie } from './lib/cookie-notice.mjs';
import { APP } from './lib/load-ts.mjs';

const OUT = path.join(APP, 'out');
const PORT = 4181;
const SUPABASE = 'http://127.0.0.1:54321';
const DISABLED = process.argv.includes('--disabled');
const SHOTS = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? null;

if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('Нет out/index.html — сначала pnpm build.');
  process.exit(1);
}

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  console.log(`${ok ? '  ok ' : '  НЕТ'} ${what}`);
  if (!ok) failures.push(what);
}

/* ── Статический сервер над out/ ───────────────────────────────── */

const MIME = {
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
const server = http.createServer((req, res) => {
  let file = path.join(OUT, decodeURIComponent((req.url ?? '/').split('?')[0]));
  if (!file.startsWith(OUT)) {
    res.writeHead(403).end();
    return;
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('404');
    return;
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((done) => server.listen(PORT, '127.0.0.1', done));
const SITE = `http://127.0.0.1:${PORT}`;

/* ── Мок службы входа ──────────────────────────────────────────── */

const ALLOWED = new Set(['svoy@example.ru', 'vtoroy@example.ru']);

function makeMock() {
  const users = new Map(); // email → user
  const sessions = new Map(); // access_token → email
  const refreshes = new Map(); // refresh_token → email
  const verifyTokens = new Map(); // token → { email, type }
  const profiles = new Map(); // id → row
  const kits = []; // rows
  const mailbox = []; // { to, type, link }
  let counter = 0;

  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const jwt = (user) =>
    `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({
      sub: user.id,
      email: user.email,
      role: 'authenticated',
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600,
    })}.mock-signature`;

  const publicUser = (u) => ({
    id: u.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: u.email,
    email_confirmed_at: u.confirmed ? u.createdAt : null,
    confirmed_at: u.confirmed ? u.createdAt : null,
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: u.meta,
    identities: [{ id: u.id, user_id: u.id, provider: 'email', identity_data: { email: u.email } }],
    created_at: u.createdAt,
    updated_at: u.createdAt,
  });

  const session = (u) => {
    const access = jwt(u);
    const refresh = `r-${++counter}`;
    sessions.set(access, u.email);
    refreshes.set(refresh, u.email);
    return {
      access_token: access,
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: refresh,
      user: publicUser(u),
    };
  };

  const err = (status, code, msg) => ({
    status,
    body: code === null ? { code: status, msg } : { code: status, error_code: code, msg },
  });

  const mail = (u, type, redirectTo) => {
    const token = `v-${++counter}`;
    verifyTokens.set(token, { email: u.email, type });
    const link = `${SUPABASE}/auth/v1/verify?token=${token}&type=${type}&redirect_to=${encodeURIComponent(redirectTo)}`;
    mailbox.push({ to: u.email, type, link });
  };

  const bearer = (headers) => {
    const h = headers.authorization ?? '';
    const token = h.replace(/^Bearer\s+/i, '');
    const email = sessions.get(token);
    return email === undefined ? null : (users.get(email) ?? null);
  };

  /* Один обработчик на все запросы к адресу проекта. */
  function handle(method, url, headers, rawBody) {
    const u = new URL(url);
    const p = u.pathname;
    const body = rawBody ? JSON.parse(rawBody) : {};
    const prefersObject = (headers.accept ?? '').includes('vnd.pgrst.object');

    /* GoTrue */
    if (p === '/auth/v1/signup' && method === 'POST') {
      const email = String(body.email ?? '').toLowerCase();
      if (!ALLOWED.has(email)) return err(403, null, 'invite_only');
      if (users.has(email)) {
        /* Существующий адрес: сервис отвечает «как будто создал», без письма. */
        const fake = publicUser({ ...users.get(email), confirmed: false });
        return { status: 200, body: { ...fake, identities: [], user_metadata: {} } };
      }
      const user = {
        id: `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`,
        email,
        password: body.password,
        confirmed: false,
        meta: body.data ?? {},
        createdAt: new Date().toISOString(),
      };
      users.set(email, user);
      profiles.set(user.id, {
        id: user.id,
        name: String(user.meta.name ?? '').slice(0, 80),
        role: user.meta.role === 'tutor' ? 'tutor' : 'student',
        welcome_seen_at: null,
        tour_id: null,
        tour_done: false,
        created_at: user.createdAt,
      });
      mail(user, 'signup', body.email_redirect_to ?? `${SITE}/voyti/podtverzhdenie/`);
      return { status: 200, body: publicUser(user) };
    }
    if (p === '/auth/v1/token' && method === 'POST') {
      const grant = u.searchParams.get('grant_type');
      if (grant === 'password') {
        const user = users.get(String(body.email ?? '').toLowerCase());
        if (!user || user.password !== body.password) {
          return err(400, 'invalid_credentials', 'Invalid login credentials');
        }
        if (!user.confirmed) return err(400, 'email_not_confirmed', 'Email not confirmed');
        return { status: 200, body: session(user) };
      }
      if (grant === 'refresh_token') {
        const email = refreshes.get(body.refresh_token);
        if (email === undefined)
          return err(400, 'refresh_token_not_found', 'Invalid Refresh Token');
        refreshes.delete(body.refresh_token);
        return { status: 200, body: session(users.get(email)) };
      }
    }
    if (p === '/auth/v1/user' && method === 'GET') {
      const user = bearer(headers);
      if (!user) return err(401, 'bad_jwt', 'invalid JWT');
      return { status: 200, body: publicUser(user) };
    }
    if (p === '/auth/v1/user' && method === 'PUT') {
      const user = bearer(headers);
      if (!user) return err(401, 'bad_jwt', 'invalid JWT');
      if (typeof body.password === 'string') {
        if (body.password.length < 8) return err(422, 'weak_password', 'Password is too weak');
        if (body.password === user.password) return err(422, 'same_password', 'Same password');
        user.password = body.password;
      }
      if (body.data) user.meta = { ...user.meta, ...body.data };
      return { status: 200, body: publicUser(user) };
    }
    if (p === '/auth/v1/logout' && method === 'POST') {
      const token = (headers.authorization ?? '').replace(/^Bearer\s+/i, '');
      const email = sessions.get(token);
      sessions.delete(token);
      if (u.searchParams.get('scope') !== 'local' && email !== undefined) {
        for (const [r, e] of refreshes) if (e === email) refreshes.delete(r);
        for (const [t, e] of sessions) if (e === email) sessions.delete(t);
      }
      return { status: 204, body: null };
    }
    if (p === '/auth/v1/recover' && method === 'POST') {
      const user = users.get(String(body.email ?? '').toLowerCase());
      if (user)
        mail(user, 'recovery', u.searchParams.get('redirect_to') ?? `${SITE}/voyti/novyy-parol/`);
      return { status: 200, body: {} };
    }
    if (p === '/auth/v1/resend' && method === 'POST') {
      const user = users.get(String(body.email ?? '').toLowerCase());
      if (user && !user.confirmed) {
        mail(user, 'signup', body.email_redirect_to ?? `${SITE}/voyti/podtverzhdenie/`);
      }
      return { status: 200, body: {} };
    }
    if (p === '/auth/v1/verify' && method === 'GET') {
      const token = u.searchParams.get('token');
      const redirect = u.searchParams.get('redirect_to') ?? SITE;
      const found = verifyTokens.get(token);
      if (!found) {
        return {
          status: 303,
          headers: {
            location: `${redirect}#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired`,
          },
          body: null,
        };
      }
      verifyTokens.delete(token);
      const user = users.get(found.email);
      user.confirmed = true;
      const s = session(user);
      const hash = new URLSearchParams({
        access_token: s.access_token,
        expires_at: String(s.expires_at),
        expires_in: '3600',
        refresh_token: s.refresh_token,
        token_type: 'bearer',
        type: found.type,
      });
      return { status: 303, headers: { location: `${redirect}#${hash}` }, body: null };
    }

    /* PostgREST */
    const me = bearer(headers);
    if (p.startsWith('/rest/v1/')) {
      if (!me) return err(401, 'PGRST301', 'JWT expired');
      const table = p.slice('/rest/v1/'.length);
      const idEq = (u.searchParams.get('id') ?? '').replace(/^eq\./, '');
      if (table === 'profiles' && method === 'GET') {
        const row = profiles.get(me.id);
        const rows = row && (idEq === '' || idEq === me.id) ? [row] : [];
        if (prefersObject) {
          return rows.length === 1
            ? { status: 200, body: rows[0] }
            : err(406, 'PGRST116', 'JSON object requested, multiple (or no) rows returned');
        }
        return { status: 200, body: rows };
      }
      if (table === 'profiles' && method === 'PATCH') {
        const row = profiles.get(me.id);
        if (!row || (idEq !== '' && idEq !== me.id))
          return { status: 200, body: prefersObject ? null : [] };
        const allowed = ['name', 'role', 'welcome_seen_at', 'tour_id', 'tour_done'];
        for (const k of allowed) if (k in body) row[k] = body[k];
        return { status: 200, body: prefersObject ? row : [row] };
      }
      if (table === 'rpc/delete_own_account' && method === 'POST') {
        users.delete(me.email);
        profiles.delete(me.id);
        for (let i = kits.length - 1; i >= 0; i -= 1)
          if (kits[i].user_id === me.id) kits.splice(i, 1);
        for (const [t, e] of sessions) if (e === me.email) sessions.delete(t);
        return { status: 204, body: null };
      }
      if (table === 'kits' && method === 'POST') {
        const rows = Array.isArray(body) ? body : [body];
        for (const r of rows) {
          if (r.user_id !== me.id) return err(403, '42501', 'row-level security');
          const i = kits.findIndex((k) => k.user_id === me.id && k.code === r.code);
          const row = {
            ...r,
            created_at: i === -1 ? new Date().toISOString() : kits[i].created_at,
          };
          if (i === -1) kits.push(row);
          else kits[i] = row;
        }
        return { status: 201, body: prefersObject ? rows[0] : rows };
      }
      if (table === 'kits' && method === 'GET') {
        const mine = kits
          .filter((k) => k.user_id === me.id)
          .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
        return { status: 200, body: mine };
      }
    }
    return { status: 404, body: { msg: `мок: нет обработчика ${method} ${p}` } };
  }

  return { handle, users, mailbox, kits, profiles };
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers':
    'apikey, authorization, content-type, x-client-info, x-supabase-api-version, prefer, accept, accept-profile, content-profile',
  'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'access-control-expose-headers': 'content-range',
};

async function installMock(context, mock) {
  await context.route(`${SUPABASE}/**`, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS });
      return;
    }
    const headers = Object.fromEntries(
      Object.entries(req.headers()).map(([k, v]) => [k.toLowerCase(), v]),
    );
    let out;
    try {
      out = mock.handle(req.method(), req.url(), headers, req.postData());
    } catch (e) {
      out = { status: 500, body: { msg: `мок упал: ${e.message}` } };
    }
    await route.fulfill({
      status: out.status,
      headers: { ...CORS, ...(out.headers ?? {}), 'content-type': 'application/json' },
      body: out.body === null || out.body === undefined ? '' : JSON.stringify(out.body),
    });
  });
}

/* ── Браузер ───────────────────────────────────────────────────── */

/* Баннер cookie (components/CookieNotice.tsx) на телефоне закрывает низ
   экрана, и клик по кнопке формы попадал бы в него. Здесь проверяется
   вход, а не баннер: браузер — с уже прочитанным баннером. */
const browser = bezBanneraCookie(
  await chromium.launch({
    args: ['--no-sandbox'],
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
  }),
);

if (SHOTS !== null) fs.mkdirSync(SHOTS, { recursive: true });
async function shot(page, name) {
  if (SHOTS === null) return;
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false });
}

/** Консоль страницы: ошибки копятся, их не должно быть ни в одном сценарии.
    Исключение одно: Chromium сам пишет «Failed to load resource … 4xx» на
    любой ответ службы входа с кодом ошибки (неверный пароль, адрес не в
    списке). Это запись браузера о сетевом ответе, а не ошибка сайта —
    такая строка есть у любого сайта с формой входа. Всё остальное,
    включая исключения в коде страницы, роняет проверку. */
function watchConsole(page, bucket) {
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const fromService = (m.location()?.url ?? '').startsWith(SUPABASE);
    if (fromService && /Failed to load resource/.test(m.text())) return;
    bucket.push(`console: ${m.text()}`);
  });
  page.on('pageerror', (e) => bucket.push(`pageerror: ${e.message}`));
}

async function noHorizontalScroll(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
}

async function newPage(mock, width, errors) {
  const context = await browser.newContext({
    viewport: { width, height: width < 500 ? 844 : 900 },
    deviceScaleFactor: 1,
    hasTouch: width < 500,
  });
  await installMock(context, mock);
  const page = await context.newPage();
  watchConsole(page, errors);
  return { context, page };
}

const LOGIN = 'a.auth-widget__login';
const AVATAR = '.auth-widget__button';

/* ── Сборка без входа ──────────────────────────────────────────── */

async function runDisabled() {
  const errors = [];
  const { context, page } = await newPage(makeMock(), 1440, errors);
  await page.goto(`${SITE}/`, { waitUntil: 'networkidle' });
  check((await page.locator(LOGIN).count()) === 0, 'главная: кнопки «Войти» нет');
  check((await page.locator('.auth-widget').count()) === 0, 'главная: блока аккаунта нет');
  check(
    (await page.locator('.site-head__cta .btn--primary').innerText()).includes('Начать бесплатно'),
    'главная: «Начать бесплатно» на месте, как раньше',
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.click('.burger');
  await page.waitForSelector('#site-menu');
  check(
    !(await page.locator('#site-menu').innerText()).includes('Войти'),
    'меню телефона: «Войти» нет',
  );
  await page.goto(`${SITE}/zadaniya/12/linear/`, { waitUntil: 'networkidle' });
  check(
    (await page.locator('.topbar .auth-widget, .topbar ' + LOGIN).count()) === 0,
    'оболочка заданий: входа нет',
  );
  check(
    (await page.locator('.topbar__user').count()) === 0,
    'оболочка заданий: выдуманного пользователя в шапке нет',
  );
  for (const p of ['/voyti/', '/kabinet/', '/voyti/podtverzhdenie/', '/voyti/novyy-parol/']) {
    const res = await page.goto(`${SITE}${p}`, { waitUntil: 'networkidle' });
    check(
      res.ok() && (await page.locator('body').innerText()).includes('Вход пока недоступен'),
      `${p}: «Вход пока недоступен»`,
    );
  }
  /* Адреса сервиса и SDK в сборке нет. */
  let supabaseTrace = 0;
  for (const f of walk(path.join(OUT, '_next'))) {
    if (!f.endsWith('.js')) continue;
    const t = fs.readFileSync(f, 'utf8');
    if (t.includes('supabase.co') || t.includes('GoTrueClient')) supabaseTrace += 1;
  }
  check(supabaseTrace === 0, 'в сборке без входа нет следов SDK и адреса сервиса');
  check(
    errors.length === 0,
    `ошибок в консоли нет${errors.length ? `: ${errors.join(' | ')}` : ''}`,
  );
  await context.close();
}

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

/* ── Сборка со входом ──────────────────────────────────────────── */

async function runEnabled() {
  const mock = makeMock();
  const errors = [];

  /* 1. Шапка до входа, 1440 и 390. */
  {
    const { context, page } = await newPage(mock, 1440, errors);
    await page.goto(`${SITE}/`, { waitUntil: 'networkidle' });
    check((await page.locator(LOGIN).count()) === 1, 'главная 1440: кнопка «Войти» есть');
    check(
      (await page.locator('.site-head__cta .btn--primary').getAttribute('href')) ===
        '/voyti/?vkladka=registraciya',
      'главная: «Начать бесплатно» ведёт на регистрацию',
    );
    await shot(page, 'shapka-do-vhoda-1440');
    await context.close();
  }
  {
    const { context, page } = await newPage(mock, 390, errors);
    await page.goto(`${SITE}/`, { waitUntil: 'networkidle' });
    check(await noHorizontalScroll(page), 'главная 390: горизонтальной прокрутки нет');
    await shot(page, 'shapka-do-vhoda-390');
    await page.click('.burger');
    await page.waitForSelector('#site-menu');
    check(
      (await page.locator('#site-menu a[href="/voyti/"]').count()) === 1,
      'меню телефона: пункт «Войти» есть',
    );
    await shot(page, 'menyu-390');
    await context.close();
  }

  /* 2. Страница входа и регистрация чужой почтой. */
  {
    const { context, page } = await newPage(mock, 1440, errors);
    await page.goto(`${SITE}/voyti/`, { waitUntil: 'networkidle' });
    check((await page.locator('h1').innerText()) === 'Вход', '/voyti/: заголовок «Вход»');
    await shot(page, 'vhod-1440');
    await page.click('[role="tab"]:has-text("Зарегистрироваться")');
    await page.fill('input[name="name"]', 'Чужой Человек');
    await page.fill('input[name="email"]', 'chuzhoy@example.ru');
    await page.fill('input[name="password"]', 'parol-dlinnyy-1');
    await page.click('.role-card[data-role="student"]');
    await shot(page, 'registraciya-uchenik-1440');
    await page.click('.role-card[data-role="tutor"]');
    await shot(page, 'registraciya-repetitor-1440');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.field__msg--error');
    check(
      (await page.locator('.field__msg--error').innerText()) === 'Регистрация пока по приглашению.',
      'чужая почта: «Регистрация пока по приглашению.»',
    );
    const html = await page.content();
    check(
      !html.includes('svoy@example.ru') && !html.includes('invite_only'),
      'чужая почта: ни разрешённых адресов, ни технических слов на экране',
    );
    check(errors.length === 0, 'чужая почта: ошибок в консоли нет');
    await context.close();
  }
  {
    const { context, page } = await newPage(mock, 390, errors);
    await page.goto(`${SITE}/voyti/`, { waitUntil: 'networkidle' });
    check(await noHorizontalScroll(page), '/voyti/ 390: горизонтальной прокрутки нет');
    await shot(page, 'vhod-390');
    await page.click('[role="tab"]:has-text("Зарегистрироваться")');
    await page.click('.role-card[data-role="student"]');
    check(await noHorizontalScroll(page), 'регистрация 390: горизонтальной прокрутки нет');
    await shot(page, 'registraciya-390');
    await context.close();
  }

  /* 3. Регистрация разрешённой почтой → письмо → подтверждение → кабинет. */
  {
    const { context, page } = await newPage(mock, 1440, errors);
    /* Онбординг уже прошёл в этом браузере — факт должен уехать в профиль. */
    await page.goto(`${SITE}/voyti/?vkladka=registraciya`, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.setItem(
        'budetege:onboarding:v1',
        JSON.stringify({
          welcomeSeen: true,
          active: null,
          tours: { repetitor: { step: 0, done: true } },
        }),
      );
    });
    check(
      (await page.locator('[role="tab"][aria-selected="true"]').innerText()).includes(
        'Зарегистрироваться',
      ),
      '?vkladka=registraciya открывает вкладку регистрации',
    );
    await page.fill('input[name="name"]', 'Наталья Багаева');
    await page.fill('input[name="email"]', 'svoy@example.ru');
    await page.fill('input[name="password"]', 'kor');
    check(
      (await page.locator('.password + .field__msg').innerText()).startsWith('Ещё 5'),
      'подсказка о длине пароля по мере ввода',
    );
    await page.fill('input[name="password"]', 'moy-dlinnyy-parol');
    await page.click('.role-card[data-role="tutor"]');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.state');
    check(
      (await page.locator('.state').innerText()).includes('svoy@example.ru'),
      'разрешённая почта: экран «Подтвердите почту» с адресом',
    );
    check(
      mock.mailbox.length === 1 && mock.mailbox[0].type === 'signup',
      'письмо подтверждения отправлено',
    );
    await shot(page, 'pismo-otpravleno-1440');

    await page.goto(mock.mailbox[0].link, { waitUntil: 'networkidle' });
    await page.waitForSelector('.state');
    check(
      page.url().startsWith(`${SITE}/voyti/podtverzhdenie/`),
      'ссылка из письма вернула на сайт',
    );
    check(
      (await page.locator('.state h4').innerText()) === 'Почта подтверждена',
      'подтверждение: «Почта подтверждена»',
    );
    check(!page.url().includes('access_token'), 'токены убраны из адреса после входа');
    await page.waitForSelector(AVATAR);
    check((await page.locator(AVATAR).innerText()).trim() === 'НБ', 'в шапке кружок «НБ»');
    await shot(page, 'podtverzhdenie-1440');

    await page.click('.state a[href="/kabinet/"]');
    await page.waitForSelector('.kabinet');
    check(
      (await page.locator('dd[data-field="name"]').innerText()) === 'Наталья Багаева',
      'кабинет: имя',
    );
    check(
      (await page.locator('dd[data-field="email"]').innerText()) === 'svoy@example.ru',
      'кабинет: почта',
    );
    check(
      (await page.locator('dd[data-field="role"]').innerText()) === 'Репетитор',
      'кабинет: роль',
    );
    const savedText = await page.locator('.kabinet__card').nth(1).innerText();
    check(
      savedText.includes('просмотрено'),
      'кабинет: факт «приветствие просмотрено» перенесён из браузера',
    );
    check(savedText.includes('Тур для репетитора — пройден'), 'кабинет: пройденный тур перенесён');
    check(savedText.includes('Пока ни одного'), 'кабинет: кодов комплектов честно нет');
    await shot(page, 'kabinet-1440');
    await shot(page, 'shapka-posle-vhoda-1440');

    /* Смена имени и роли. */
    await page.click('.kabinet__card button:has-text("Изменить")');
    await page.fill('.kabinet__card input[autocomplete="name"]', 'Наталья В.');
    await page.click('.kabinet__card .role-card[data-role="student"]');
    await page.click('.kabinet__card button[type="submit"]');
    await page.waitForSelector('dd[data-field="role"]');
    check(
      (await page.locator('dd[data-field="role"]').innerText()) === 'Ученик',
      'смена роли: «Ученик»',
    );
    check(
      (await page.locator('dd[data-field="name"]').innerText()) === 'Наталья В.',
      'смена имени',
    );
    check(
      mock.profiles.get(mock.users.get('svoy@example.ru').id).role === 'student',
      'роль записана в базу',
    );
    check(mock.users.get('svoy@example.ru').meta.role === 'student', 'роль записана и в сессию');
    check(
      (await page.locator(AVATAR).innerText()).trim() === 'НВ',
      'инициалы в шапке обновились: «НВ»',
    );

    /* Выход из меню шапки. */
    await page.click(AVATAR);
    await page.waitForSelector('.auth-widget__menu');
    check(
      (await page.locator('.auth-widget__menu').innerText()).includes('Мой кабинет'),
      'меню аккаунта: «Мой кабинет» и «Выйти»',
    );
    await shot(page, 'menyu-akkaunta-1440');
    await page.click('.auth-widget__menu button:has-text("Выйти")');
    await page.waitForSelector(LOGIN);
    check(
      (await page.evaluate(() => localStorage.getItem('budetege-auth'))) === null,
      'выход: сессии в хранилище нет',
    );
    check(mock.users.has('svoy@example.ru'), 'выход: пользователь остался');
    check(
      errors.length === 0,
      `регистрация и кабинет: ошибок в консоли нет${errors.length ? `: ${errors.join(' | ')}` : ''}`,
    );
    await context.close();
  }

  /* 4. Неверный пароль; неподтверждённая почта; «Запомнить меня» выключено. */
  {
    const { context, page } = await newPage(mock, 1440, errors);
    await page.goto(`${SITE}/voyti/`, { waitUntil: 'networkidle' });
    await page.fill('input[name="email"]', 'svoy@example.ru');
    await page.fill('input[name="password"]', 'ne-tot-parol');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.field__msg--error');
    check(
      (await page.locator('.field__msg--error').innerText()) === 'Неверная почта или пароль.',
      'неверный пароль: «Неверная почта или пароль.»',
    );
    await shot(page, 'nevernyy-parol-1440');

    /* Второй разрешённый адрес регистрируется, но почту не подтверждает. */
    mock.handle(
      'POST',
      `${SUPABASE}/auth/v1/signup`,
      {},
      JSON.stringify({
        email: 'vtoroy@example.ru',
        password: 'vtoroy-parol-123',
        data: { name: 'Второй', role: 'student' },
      }),
    );
    await page.fill('input[name="email"]', 'vtoroy@example.ru');
    await page.fill('input[name="password"]', 'vtoroy-parol-123');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.field__msg--error');
    check(
      (await page.locator('.field__msg--error').innerText()) ===
        'Подтвердите почту: письмо отправлено на vtoroy@example.ru.',
      'без подтверждения: «Подтвердите почту: письмо отправлено на …»',
    );
    const before = mock.mailbox.length;
    await page.click('.auth-form__resend button');
    await page.waitForSelector('.auth-form__ok');
    check(mock.mailbox.length === before + 1, 'повторное письмо отправлено');
    check(
      (await page.locator('.auth-form__resend').innerText()).includes('Письмо отправлено.'),
      'после повтора кнопки нет — отсчёт минуты',
    );

    /* Вход без «Запомнить меня». */
    await page.fill('input[name="email"]', 'svoy@example.ru');
    await page.fill('input[name="password"]', 'moy-dlinnyy-parol');
    await page.click('.check--box input');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${SITE}/kabinet/`);
    await page.waitForSelector('.kabinet');
    const where = await page.evaluate(() => ({
      local: localStorage.getItem('budetege-auth'),
      session: sessionStorage.getItem('budetege-auth'),
    }));
    check(
      where.local === null && where.session !== null,
      '«Запомнить меня» выключено: сессия в sessionStorage',
    );
    await page.click('.kabinet__card button:has-text("Выйти")');
    await page.waitForURL(`${SITE}/`);
    check(errors.length === 0, 'вход: ошибок в консоли нет');
    await context.close();
  }

  /* 5. Сброс пароля. */
  {
    const { context, page } = await newPage(mock, 1440, errors);
    await page.goto(`${SITE}/voyti/`, { waitUntil: 'networkidle' });
    await page.click('button:has-text("Забыли пароль?")');
    await page.fill('input[name="email"]', 'svoy@example.ru');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.state');
    check(
      (await page.locator('.state h4').innerText()) === 'Проверьте почту',
      'сброс: «Проверьте почту»',
    );
    const letter = mock.mailbox.at(-1);
    check(
      letter.type === 'recovery' && letter.to === 'svoy@example.ru',
      'письмо сброса отправлено',
    );
    await shot(page, 'sbros-otpravlen-1440');
    await page.goto(letter.link, { waitUntil: 'networkidle' });
    await page.waitForSelector('input[name="password"]');
    check(
      page.url().startsWith(`${SITE}/voyti/novyy-parol/`),
      'ссылка сброса открыла «Новый пароль»',
    );
    await shot(page, 'novyy-parol-1440');
    await page.fill('input[name="password"]', 'sovsem-novyy-parol');
    await page.fill('input[name="password-repeat"]', 'sovsem-novyy-parol');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.state');
    check(
      (await page.locator('.state h4').innerText()) === 'Пароль сохранён',
      'новый пароль сохранён',
    );
    check(
      mock.users.get('svoy@example.ru').password === 'sovsem-novyy-parol',
      'пароль изменён на сервере',
    );
    await context.close();
  }

  /* 6. Устаревшая ссылка. */
  {
    const { context, page } = await newPage(mock, 1440, errors);
    await page.goto(
      `${SITE}/voyti/podtverzhdenie/#error=access_denied&error_code=otp_expired&error_description=expired`,
      { waitUntil: 'networkidle' },
    );
    await page.waitForSelector('.state');
    check(
      (await page.locator('.state h4').innerText()) === 'Ссылка не подошла',
      'устаревшая ссылка: честный экран',
    );
    await context.close();
  }

  /* 7. Комплект репетитора уходит в аккаунт; телефон: «Войти» и панели. */
  {
    const { context, page } = await newPage(mock, 390, errors);
    /* Вход новым паролем, роль — репетитор. */
    await page.goto(`${SITE}/voyti/`, { waitUntil: 'networkidle' });
    await page.fill('input[name="email"]', 'svoy@example.ru');
    await page.fill('input[name="password"]', 'sovsem-novyy-parol');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${SITE}/kabinet/`);
    await page.waitForSelector('.kabinet');
    check(await noHorizontalScroll(page), 'кабинет 390: горизонтальной прокрутки нет');
    await shot(page, 'kabinet-390');
    await page.click('.kabinet__card button:has-text("Изменить")');
    await page.click('.kabinet__card .role-card[data-role="tutor"]');
    await page.click('.kabinet__card button[type="submit"]');
    await page.waitForSelector('dd[data-field="role"]:has-text("Репетитор")');

    await page.goto(`${SITE}/zadaniya/8/generator/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.topbar ' + AVATAR);
    check(await noHorizontalScroll(page), 'генератор 390: горизонтальной прокрутки нет');
    await shot(page, 'shapka-posle-vhoda-390');
    const boxes = await page.evaluate(() => {
      const box = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: r.top, left: r.left, bottom: r.bottom, right: r.right };
      };
      return { auth: box('.topbar .auth-widget'), bar: box('.cfg-bar'), fab: box('.help-fab') };
    });
    const apart = (a, b) =>
      a === null ||
      b === null ||
      a.bottom <= b.top ||
      a.top >= b.bottom ||
      a.right <= b.left ||
      a.left >= b.right;
    check(boxes.auth !== null, 'генератор 390: блок аккаунта в шапке есть');
    check(
      apart(boxes.auth, boxes.bar),
      'блок аккаунта не перекрывает закреплённую панель генератора',
    );
    check(apart(boxes.auth, boxes.fab), 'блок аккаунта не перекрывает кнопку «?»');

    /* Скачивание листа: ссылка открывает новую вкладку — её закрываем. */
    const kitBtn = page.locator('.kit-bar a.btn--primary');
    if ((await kitBtn.count()) === 1) {
      await page.waitForSelector('.kit-bar a.btn--primary[href]');
      const code = (await page.locator('.kit-code').getAttribute('data-kit-code')) ?? '';
      const popup = context
        .waitForEvent('page')
        .then((p) => p.close())
        .catch(() => {});
      await kitBtn.click();
      await popup;
      const deadline = Date.now() + 5000;
      while (Date.now() < deadline && mock.kits.length === 0) {
        await page.waitForTimeout(100);
      }
      check(
        mock.kits.length === 1 && mock.kits[0].code === code,
        `комплект ${code} записан в аккаунт`,
      );
      await page.goto(`${SITE}/kabinet/`, { waitUntil: 'networkidle' });
      await page.waitForSelector('.kit-list');
      check(
        (await page.locator('.kit-list__code').first().innerText()) === code,
        'кабинет: код комплекта в списке',
      );
      await shot(page, 'kabinet-komplekty-390');
    } else {
      check(false, 'генератор №8: кнопка скачивания листа не найдена');
    }
    await context.close();
  }

  /* 8. Удаление аккаунта. */
  {
    const { context, page } = await newPage(mock, 1440, errors);
    await page.goto(`${SITE}/voyti/`, { waitUntil: 'networkidle' });
    await page.fill('input[name="email"]', 'svoy@example.ru');
    await page.fill('input[name="password"]', 'sovsem-novyy-parol');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${SITE}/kabinet/`);
    await page.waitForSelector('.kabinet');
    await page.click('.kabinet__card button:has-text("Удалить аккаунт")');
    await page.waitForSelector('[role="dialog"]');
    await shot(page, 'udalenie-1440');
    await page.click('[role="dialog"] button:has-text("Удалить")');
    await page.waitForSelector('.state');
    check(
      (await page.locator('.state h4').innerText()) === 'Аккаунт удалён',
      'удаление: «Аккаунт удалён»',
    );
    check(!mock.users.has('svoy@example.ru'), 'пользователя на сервере нет');
    check(mock.kits.length === 0, 'комплекты удалены каскадом');
    await page.waitForSelector(LOGIN);
    check(
      (await page.evaluate(
        () => localStorage.getItem('budetege-auth') ?? sessionStorage.getItem('budetege-auth'),
      )) === null,
      'после удаления сессии нет',
    );
    check(
      errors.length === 0,
      `удаление: ошибок в консоли нет${errors.length ? `: ${errors.join(' | ')}` : ''}`,
    );
    await context.close();
  }

  /* 9. SDK вне первой загрузки. */
  for (const p of ['', 'zadaniya/12/linear']) {
    const html = fs.readFileSync(path.join(OUT, p, 'index.html'), 'utf8');
    const srcs = [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"[^>]*>/g)].map((m) => m[1]);
    let sdk = false;
    for (const src of srcs) {
      const t = fs.readFileSync(path.join(OUT, decodeURIComponent(src.split('?')[0])), 'utf8');
      if (t.includes('GoTrueClient') || t.includes('PostgrestClient')) sdk = true;
    }
    check(!sdk, `/${p}: SDK входа не в первой загрузке`);
  }
}

try {
  if (DISABLED) await runDisabled();
  else await runEnabled();
} finally {
  await browser.close();
  server.close();
}

console.log(`\nПроверок: ${checks}, не прошло: ${failures.length}.`);
if (failures.length > 0) {
  console.error('\nНе прошли:');
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
