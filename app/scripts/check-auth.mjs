#!/usr/bin/env node
/* scripts/check-auth.mjs — вход, регистрация и кабинет в браузере.

   Запуск после pnpm build:
     node scripts/check-auth.mjs [папка-для-снимков]      сборка со входом
     node scripts/check-auth.mjs --no-header               вход есть, кнопки в шапке нет
     node scripts/check-auth.mjs --disabled                сборка без входа
     node scripts/check-auth.mjs --gallery <папка>         только снимки ключевых экранов
     NEXT_PUBLIC_ZHURNAL=1 node scripts/check-auth.mjs --zhurnal [папка]
                                                           только журнал решения задач

   Служба входа (Supabase: GoTrue и PostgREST) здесь не настоящая, а
   мок внутри Playwright: все запросы к адресу проекта перехватываются
   и отвечают так, как отвечает сервис. Письма складываются в ящик
   мока, ссылки из них открываются в том же браузере. Так сценарий
   идёт без сети и без секретов и одинаково в CI и на машине.

   Сборку со входом собирают с переменными:
     NEXT_PUBLIC_AUTH_ENABLED=1
     NEXT_PUBLIC_AUTH_IN_HEADER=1   (для --no-header — без неё)
     NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
     NEXT_PUBLIC_SUPABASE_ANON_KEY=mock-anon-key

   Сценарии (сборка со входом и кнопкой в шапке, NEXT_PUBLIC_AUTH_IN_HEADER=1):
     • шапка на 1440: «Войти» — вторичная таблетка со словом, без
       значка, «Начать бесплатно» — основная и ведёт на регистрацию
       (регистрация открыта, REGISTRATION_OPEN); на 320,
       375, 390 и 430 в шапке знак с названием, «Войти» словом и
       бургер (оба не меньше 44×44, ничего не налезает), «Начать
       бесплатно» нет в шапке и есть на первом экране под лидом;
       горизонтальной прокрутки нет; на прокрутке шапка ниже, а
       содержимое под ней не сдвигается; в меню телефона тоже «Войти»;
     • после входа на 320 и 375: кружок с инициалами 44×44 вместо
       «Войти»; меню аккаунта с клавиатуры (фокус, стрелки, Esc
       возвращает фокус) и закрывается нажатием вне меню;
     • регистрация без галочек согласий → просьба отметить, запрос не уходит;
       ученику — год рождения, младше 18 — почта родителя;
     • регистрация чужой почтой → «Регистрация пока по приглашению»,
       ошибок в консоли нет;
     • почта не российского сервиса (gmail.com, заглавными, с пробелами,
       поддомен) → спокойная подсказка со ссылкой на почту, запрос не
       уходит; «Мой адрес уже добавили» → решает сервер: отказ — та же
       подсказка, школьная почта из ручного списка — аккаунт создан;
     • старый пользователь с gmail.com входит как раньше;
     • регистрация разрешённой почтой → письмо → ссылка → подтверждение
       → кабинет; в шапке кружок с инициалами;
     • кабинет репетитора: «Мои классы», «Домашние задания», коды
       комплектов; вкладка «Профиль»: имя, почта, роль (не меняется),
       согласие, выгрузка данных;
     • «Перенести ваш прогресс с этого устройства в кабинет?»: «Да» →
       ключи №8 в аккаунте, второй раз не спрашивает; «Нет» → ничего;
     • кабинет ученика: «Прогресс», «Мои ошибки», «Отложенные»,
       «Домашние задания» — пустые состояния; класс от репетитора;
     • выход из меню шапки; неверный пароль; вход без подтверждения
       почты → «Подтвердите почту…» и повторная отправка;
     • «Запомнить меня» выключено → сессия в sessionStorage;
     • сброс пароля: письмо → новый пароль → вход новым паролем;
     • два устройства: тренировка №8, начатая на компьютере, продолжается
       на телефоне с той же задачи; решённое и закладка видны в кабинете;
     • классы и ДЗ №8 (этап 3): репетитор создаёт класс и получает код,
       ученик вступает по ссылке (код помнится до входа) и по коду,
       неверный код — понятный отказ; псевдоним ученика; выдача ДЗ из
       формы с типами; ученик решает: дробь с верным значением и «5 см» —
       подсказки без траты попытки, попытки считает база, решение сразу
       после ответа, «Показать решение», «Сдать»; таблица результатов,
       что вводил ученик, комментарий к задаче, сводка по типам, работа
       над ошибками; ученику форма выдачи недоступна;
     • комплект репетитора записывается в аккаунт;
     • удаление аккаунта с подтверждением;
     • SDK не входит в первую загрузку главной и страницы задания;
     • на 390 блок аккаунта не пересекает закреплённую панель генератора
       и кнопку «?» (если она есть), горизонтальной прокрутки нет.
   Сценарии (--no-header: сборка со входом, но без кнопки в шапке —
   так сайт живёт в пробном режиме): «Войти» нет ни в шапке, ни в меню
   телефона, ни в оболочке заданий, шапка выглядит как без входа;
   /voyti/ по прямой ссылке открывает форму; после входа кружок с
   инициалами и «Мой кабинет» на месте.
   Сценарии (сборка без входа): кнопки «Войти» нет ни в шапке, ни в
   меню, ни в оболочке заданий; /voyti/ и /kabinet/ честно говорят,
   что вход не включён; адреса сервиса в сборке нет. */

import fs from 'node:fs';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';
import { bezBanneraCookie } from './lib/cookie-notice.mjs';
import { APP, requireSrc } from './lib/load-ts.mjs';
import { welcomeSeen } from './lib/onboarding.mjs';
import { applyFilters, createDzMock } from './lib/dz-mock.mjs';

const { generate } = requireSrc('lib/vychisleniya/generate.ts');
const { emailDomainAllowed } = requireSrc('lib/auth/allowed-domains.ts');
const { parseTaskId } = requireSrc('lib/vychisleniya/ids.ts');
const { ru } = requireSrc('lib/vychisleniya/numbers.ts');
/* Областей на «Карте ЕГЭ» — по действующей структуре экзамена. */
const KARTA_OBLASTEY = requireSrc('lib/karta/katalog.ts').KARTA_RAZDELY.length;

/* SAYT_OUT — другая сборка (снимки «до» со сборки основной ветки). */
const OUT = process.env.SAYT_OUT ?? path.join(APP, 'out');
const PORT = 4181;
const SUPABASE = 'http://127.0.0.1:54321';
/* Сборка с журналом решения задач (NEXT_PUBLIC_ZHURNAL=1): сценарий журнала. */
const ZHURNAL_ON = process.env.NEXT_PUBLIC_ZHURNAL === '1';
/* Сборка с экранами прогресса (NEXT_PUBLIC_PROGRESS_UCHITEL=1 и _UCHENIK=1). */
/* Сборка с новой выдачей ДЗ (NEXT_PUBLIC_DZ2=1). */
const DZ2_ON = process.env.NEXT_PUBLIC_DZ2 === '1';
const PROGRESS_ON =
  process.env.NEXT_PUBLIC_PROGRESS_UCHITEL === '1' && process.env.NEXT_PUBLIC_PROGRESS_UCHENIK === '1';
const DISABLED = process.argv.includes('--disabled');
const NO_HEADER = process.argv.includes('--no-header');
/* Снимки классов и ДЗ №8 для описания PR этапа 3. */
const GALLERY_DZ = process.argv.includes('--gallery-dz')
  ? (process.argv[process.argv.indexOf('--gallery-dz') + 1] ?? 'snimki-dz')
  : null;
/* Снимки кабинета ученика с прогрессом №8 для описания PR этапа 2. */
const GALLERY_Z8 = process.argv.includes('--gallery-z8')
  ? (process.argv[process.argv.indexOf('--gallery-z8') + 1] ?? 'snimki-z8-kabinet')
  : null;
const GALLERY = process.argv.includes('--gallery')
  ? (process.argv[process.argv.indexOf('--gallery') + 1] ?? 'snimki-pr')
  : null;
/* «Карта ЕГЭ» на телефонах: снимки до/после (scripts/lib/karta-nazad.mjs). */
const SHOTS_KARTA = process.argv.includes('--shots-karta')
  ? {
      dir: process.argv[process.argv.indexOf('--shots-karta') + 1] ?? 'snimki-karta',
      pristavka: process.argv[process.argv.indexOf('--shots-karta') + 2] ?? 'posle',
    }
  : null;
/* Сценарии «← К карте» и карты на телефоне (pnpm test:karta-nazad). */
const KARTA_NAZAD = process.argv.includes('--karta-nazad');
const SHOTS =
  GALLERY !== null || GALLERY_Z8 !== null || GALLERY_DZ !== null || SHOTS_KARTA !== null
    ? null
    : (process.argv.slice(2).find((a) => !a.startsWith('--')) ?? null);
if (SHOTS !== null) fs.mkdirSync(SHOTS, { recursive: true });

if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('Нет out/index.html — сначала pnpm build.');
  process.exit(1);
}

/* Редакция правовых документов — дата из operator.json, как её считает
   сайт (lib/legal/operator.ts). */
const DOCUMENTS_VERSION = (() => {
  const { data } = JSON.parse(
    fs.readFileSync(path.join(APP, 'src', 'content', 'legal', 'operator.json'), 'utf8'),
  );
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(data ?? '').trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : 'chernovik';
})();

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

const ALLOWED = new Set([
  'svoy@yandex.ru',
  'vtoroy@yandex.ru',
  'uchenik@yandex.ru',
  'shkolnik@yandex.ru',
  'dva@yandex.ru',
  'dz-repetitor@yandex.ru',
  'dz-uchenik1@yandex.ru',
  'dz-uchenik2@yandex.ru',
  /* Журнал решения задач: ученик и учитель. */
  'zhurnal@yandex.ru',
  'zhurnal2@yandex.ru',
  'zhurnal-uchitel@yandex.ru',
  'zhurnal-uchitel2@yandex.ru',
  'zhurnal-chuzhoy@yandex.ru',
  /* Почта не российского сервиса: приглашена, но база откажет по домену. */
  'zarubezh@gmail.com',
  /* Школьная почта, добавленная владельцем вручную (SIGNUP_EXTRA). */
  'shkola@school.example',
]);
/** Добавленное вручную: домены и адреса (как auth_hooks.signup_extra). */
const EXTRA = new Set(['school.example']);

/** Данные формы регистрации, как их шлёт сайт. */
function signupData(name, role, extra = {}) {
  return {
    name,
    role,
    documents_version: DOCUMENTS_VERSION,
    accept_soglashenie: true,
    accept_soglasie: true,
    ...(role === 'student' ? { birth_year: 2000 } : {}),
    ...extra,
  };
}

function makeMock() {
  const users = new Map(); // email → user
  const sessions = new Map(); // access_token → email
  const refreshes = new Map(); // refresh_token → email
  const verifyTokens = new Map(); // token → { email, type }
  const profiles = new Map(); // user_id → row
  const kits = []; // rows
  const consents = []; // { user_id, kind, version, accepted_at }
  const parents = new Map(); // user_id → { parent_email, confirmed_at }
  const storage = []; // { user_id, key, value, updated_at }
  const classes = []; // { id, name, tutor_id, archived_at, created_at }
  const members = []; // { class_id, user_id }
  const zhurnal = []; // строки журнала решения задач: { user_id, id, task_no, popytki, … }
  const zhurnalVarianty = [];
  const dz2 = []; // ДЗ новой выдачи: { id, tutor_id, status, p, chernovik, recipients }
  /* Текущая редакция документов в «базе». */
  const edition = { version: DOCUMENTS_VERSION };
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
      /* Хук базы: сначала почтовый домен, потом приглашение. */
      if (!emailDomainAllowed(email) && !EXTRA.has(email) && !EXTRA.has(email.split('@')[1])) {
        return err(403, null, 'domain_not_allowed');
      }
      if (!ALLOWED.has(email)) return err(403, null, 'invite_only');
      /* Триггеры базы: без галочек согласий, со старой редакцией, без
         года рождения ученика аккаунт не создаётся. Служба входа отдаёт
         отказ базы как есть, с кодом 500. */
      const data = body.data ?? {};
      const reject = (reason) => ({ status: 500, body: { code: '23514', message: reason } });
      if (data.accept_soglashenie !== true || data.accept_soglasie !== true) {
        return reject('consents_required: без согласия регистрация невозможна');
      }
      if (data.documents_version !== edition.version) {
        return reject('outdated_documents: редакция документов сменилась');
      }
      if (data.role !== 'student' && data.role !== 'tutor') {
        return reject('bad_role: при регистрации выбирают «ученик» или «репетитор»');
      }
      if (data.role === 'student' && !/^\d{4}$/.test(String(data.birth_year ?? ''))) {
        return reject('birth_year_required: ученик указывает год рождения');
      }
      const minor = data.role === 'student' && new Date().getFullYear() - data.birth_year <= 18;
      if (minor && !data.parent_email) {
        return reject('parent_email_required: ученику младше 18 нужна почта родителя');
      }
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
        user_id: user.id,
        display_name: String(user.meta.name ?? '').slice(0, 80),
        role: user.meta.role,
        grade: null,
        welcome_seen_at: null,
        tour_id: null,
        tour_done: false,
        created_at: user.createdAt,
      });
      for (const kind of ['soglashenie', 'soglasie']) {
        consents.push({
          user_id: user.id,
          kind,
          version: edition.version,
          accepted_at: user.createdAt,
        });
      }
      if (minor) parents.set(user.id, { parent_email: data.parent_email, confirmed_at: null });
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
      const idEq = (u.searchParams.get('user_id') ?? '').replace(/^eq\./, '');
      /* Классы и ДЗ этапа 3 — отдельный мок (scripts/lib/dz-mock.mjs). */
      const dzAnswer = dz.handle(table, method, u, body, me, prefersObject);
      if (dzAnswer !== null) return dzAnswer;
      if (table === 'profiles' && method === 'GET') {
        /* RLS: свой профиль, свои ученики (репетитору), свой репетитор (ученику). */
        const mine = profiles.get(me.id);
        const visible = [...profiles.values()].filter((row) => {
          if (row.user_id === me.id) return true;
          const shared = (tutorId, studentId) =>
            classes.some(
              (c) =>
                c.tutor_id === tutorId &&
                members.some((m) => m.class_id === c.id && m.user_id === studentId),
            );
          return mine?.role === 'tutor' ? shared(me.id, row.user_id) : shared(row.user_id, me.id);
        });
        const rows = applyFilters(visible, u.searchParams);
        if (prefersObject) {
          return rows.length === 1
            ? { status: 200, body: rows[0] }
            : err(406, 'PGRST116', 'JSON object requested, multiple (or no) rows returned');
        }
        return { status: 200, body: rows };
      }
      if (table === 'profiles' && method === 'PATCH') {
        const row = profiles.get(me.id);
        /* Роль из браузера не меняется: права на колонку нет. */
        if ('role' in body) return err(403, '42501', 'permission denied for table profiles');
        if (!row || (idEq !== '' && idEq !== me.id))
          return { status: 200, body: prefersObject ? null : [] };
        const allowed = ['display_name', 'grade', 'welcome_seen_at', 'tour_id', 'tour_done'];
        for (const k of allowed) if (k in body) row[k] = body[k];
        return { status: 200, body: prefersObject ? row : [row] };
      }
      const wipe = () => {
        users.delete(me.email);
        profiles.delete(me.id);
        parents.delete(me.id);
        for (const list of [kits, storage, members]) {
          for (let i = list.length - 1; i >= 0; i -= 1)
            if (list[i].user_id === me.id) list.splice(i, 1);
        }
        for (let i = classes.length - 1; i >= 0; i -= 1)
          if (classes[i].tutor_id === me.id) classes.splice(i, 1);
        /* Журнал согласий переживает аккаунт — с отметкой об удалении. */
        for (const c of consents)
          if (c.user_id === me.id) c.account_deleted_at = new Date().toISOString();
        for (const [t, e] of sessions) if (e === me.email) sessions.delete(t);
      };
      /* Журнал решения задач (docs/kabinet-zhurnal.md): запись копится,
         повтор той же задачи заменяет её — как дополнение строки в базе. */
      if (table === 'rpc/zhurnal_push' && method === 'POST') {
        if (profiles.get(me.id)?.role !== 'student') return err(403, '42501', 'forbidden');
        const pachka = body.p ?? {};
        for (const z of pachka.zadachi ?? []) {
          const i = zhurnal.findIndex((r) => r.user_id === me.id && r.id === z.id);
          const row = { ...z, user_id: me.id };
          if (i === -1) zhurnal.push(row);
          else zhurnal[i] = row;
        }
        for (const v of pachka.varianty ?? []) zhurnalVarianty.push({ ...v, user_id: me.id });
        return {
          status: 200,
          body: { saved: (pachka.zadachi ?? []).length + (pachka.varianty ?? []).length, skipped: 0 },
        };
      }
      /* Чтение журнала (функции uchitel_*, moya_*): как в базе — учитель
         видит только учеников своих классов, ученику не уходит «очень быстро». */
      const ZHURNAL_RPC = [
        'uchitel_klass', 'uchitel_uchenik', 'uchitel_lenta', 'uchitel_zadacha', 'uchitel_variant',
        'moya_statistika', 'moya_lenta', 'moy_variant',
      ];
      const rpcName = table.startsWith('rpc/') ? table.slice(4) : '';
      if (ZHURNAL_RPC.includes(rpcName) && method === 'POST') {
        return zhurnalRead(rpcName, body, me);
      }
      /* Новая выдача ДЗ (docs/kabinet-dz2.md): учительские функции. */
      if (table.startsWith('rpc/dz2_') && method === 'POST') {
        const fn = table.slice(4);
        const role = profiles.get(me.id)?.role;
        const pg = (code, message) => ({ status: 400, body: { code, message, details: null, hint: null } });
        if (role !== 'tutor') return pg('42501', 'forbidden');
        const mine = (id) => dz2.find((d) => d.id === id && d.tutor_id === me.id);
        if (fn === 'dz2_save') {
          const p = body.p ?? {};
          const old = p.id ? mine(p.id) : undefined;
          if (p.id && (old === undefined || !['draft', 'template'].includes(old.status))) return pg('P0001', 'not_draft');
          const row = old ?? { id: `dz2-${dz2.length + 1}`, tutor_id: me.id, chernovik: null };
          Object.assign(row, { status: p.status ?? 'draft', p, created_at: new Date().toISOString() });
          if (old === undefined) dz2.push(row);
          return { status: 200, body: row.id };
        }
        if (fn === 'dz2_chernovik') {
          const d = mine(body.p_id);
          if (d === undefined) return pg('42501', 'forbidden');
          d.chernovik = body.p;
          return { status: 200, body: null };
        }
        if (fn === 'dz2_publish') {
          const d = mine(body.p_id);
          if (d === undefined || d.status !== 'draft') return pg('P0001', 'not_draft');
          const ids = new Set();
          for (const t of d.p.targets ?? []) {
            if (t.class_id) for (const m of members) if (m.class_id === t.class_id) ids.add(m.user_id);
            if (t.student_id) ids.add(t.student_id);
          }
          if (ids.size === 0) return pg('P0001', 'no_recipients');
          d.status = 'published';
          d.recipients = [...ids];
          return { status: 200, body: { id: d.id, recipients: ids.size } };
        }
        if (fn === 'dz2_spisok') {
          return {
            status: 200,
            body: dz2
              .filter((d) => d.tutor_id === me.id)
              .map((d) => ({
                id: d.id, title: d.p.title, status: d.status, created_at: d.created_at,
                ...(d.p.due_at ? { due_at: d.p.due_at } : {}), ...(d.p.publish_at ? { publish_at: d.p.publish_at } : {}),
                items: (d.p.items ?? []).length, recipients: (d.recipients ?? []).length, submitted: 0,
              })),
          };
        }
        if (fn === 'dz2_copy') {
          const d = mine(body.p_id);
          if (d === undefined) return pg('42501', 'forbidden');
          const row = { id: `dz2-${dz2.length + 1}`, tutor_id: me.id, status: body.p_status ?? 'draft',
            p: { ...d.p, targets: [] }, chernovik: d.chernovik, created_at: new Date().toISOString() };
          dz2.push(row);
          return { status: 200, body: row.id };
        }
        if (fn === 'dz2_delete') {
          const i = dz2.findIndex((d) => d.id === body.p_id && d.tutor_id === me.id && ['draft', 'template'].includes(d.status));
          if (i < 0) return pg('42501', 'forbidden');
          dz2.splice(i, 1);
          return { status: 200, body: null };
        }
        if (fn === 'dz2_edit') {
          const d = mine(body.p_id);
          if (d === undefined) return pg('42501', 'forbidden');
          if (body.p?.closed === true) d.status = 'closed';
          if (body.p?.closed === false) d.status = 'published';
          return { status: 200, body: null };
        }
        return pg('P0001', 'unknown');
      }
      /* Черновик: учитель читает свою строку ДЗ с рабочей копией. */
      if (table === 'homework2' && method === 'GET') {
        const id = (u.searchParams.get('id') ?? '').replace(/^eq\./, '');
        const d = dz2.find((x) => x.id === id && x.tutor_id === me.id);
        if (d === undefined) return err(406, 'PGRST116', 'JSON object requested, multiple (or no) rows returned');
        const row = { id: d.id, title: d.p.title, note: d.p.note ?? null, status: d.status,
          publish_at: d.p.publish_at ?? null, due_at: d.p.due_at ?? null, after_due: d.p.after_due ?? 'late_ok',
          hints_allowed: d.p.hints_allowed ?? true, attempts_limit: d.p.attempts_limit ?? null,
          solutions_when: d.p.solutions_when ?? 'instant', individual: d.p.individual ?? false,
          kontrol: d.p.kontrol ?? false, chernovik: d.chernovik };
        return { status: 200, body: prefersObject ? row : [row] };
      }
      if (table === 'rpc/delete_my_account' && method === 'POST') {
        wipe();
        return { status: 204, body: null };
      }
      if (table === 'rpc/export_my_data' && method === 'POST') {
        return {
          status: 200,
          body: {
            account: { id: me.id, email: me.email },
            consents: consents.filter((c) => c.user_id === me.id),
            profiles: [profiles.get(me.id)],
            kits: kits.filter((k) => k.user_id === me.id),
            user_storage: storage.filter((r) => r.user_id === me.id),
          },
        };
      }
      if (table === 'consents' && method === 'GET') {
        const kind = (u.searchParams.get('kind') ?? '').replace(/^eq\./, '');
        const rows = consents
          .filter((c) => c.user_id === me.id && (kind === '' || c.kind === kind))
          .sort((a, b) => (a.accepted_at < b.accepted_at ? 1 : -1));
        return { status: 200, body: rows };
      }
      if (table === 'parent_consents' && method === 'GET') {
        const row = parents.get(me.id);
        return { status: 200, body: row ? [{ user_id: me.id, ...row }] : [] };
      }
      if (table === 'classes' && method === 'GET') {
        const rows = classes.filter(
          (c) =>
            c.tutor_id === me.id || members.some((m) => m.class_id === c.id && m.user_id === me.id),
        );
        return { status: 200, body: rows };
      }
      if (table === 'class_members' && method === 'GET') {
        const rows = members.filter(
          (m) =>
            m.user_id === me.id || classes.some((c) => c.id === m.class_id && c.tutor_id === me.id),
        );
        return { status: 200, body: rows };
      }
      if (table === 'user_storage' && method === 'POST') {
        /* Ученик младше 18 до согласия родителя прогресс не пишет. */
        if (parents.get(me.id)?.confirmed_at === null) {
          return err(403, '42501', 'new row violates row-level security policy');
        }
        const rows = Array.isArray(body) ? body : [body];
        for (const r of rows) {
          if (!/^budetege:[a-z0-9:_-]{1,80}$/.test(r.key)) {
            return err(400, '23514', 'violates check constraint "user_storage_key_check"');
          }
          const row = {
            user_id: me.id,
            key: r.key,
            value: r.value,
            updated_at: new Date().toISOString(),
          };
          const i = storage.findIndex((x) => x.user_id === me.id && x.key === r.key);
          if (i === -1) storage.push(row);
          else storage[i] = row;
        }
        return { status: 201, body: null };
      }
      if (table === 'user_storage' && method === 'GET') {
        return { status: 200, body: storage.filter((r) => r.user_id === me.id) };
      }
      if (table === 'user_storage' && method === 'DELETE') {
        /* key=in.(a,b) — значения могут быть в кавычках. */
        const list = /^in\.\((.*)\)$/.exec(u.searchParams.get('key') ?? '');
        const keys = new Set(
          (list?.[1] ?? '')
            .split(',')
            .map((k) => k.trim().replace(/^"(.*)"$/, '$1'))
            .filter(Boolean),
        );
        for (let i = storage.length - 1; i >= 0; i -= 1) {
          if (storage[i].user_id === me.id && keys.has(storage[i].key)) storage.splice(i, 1);
        }
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

  /** Тестовые данные, как их кладёт кнопка «Сервер: тестовые данные». */
  const dz = createDzMock({ profiles, classes, members });

  /* ── Чтение журнала для экранов прогресса ── */
  /* Ошибка функции базы — в формате PostgREST: код в начале message. */
  const perr = (status, code, message) => ({ status, body: { code, message, details: null, hint: null } });
  const SOLVED = ['right', 'hinted', 'wrong', 'revealed'];
  const moyStudent = (tutorId, studentId) =>
    classes.some(
      (c) => c.tutor_id === tutorId && members.some((m) => m.class_id === c.id && m.user_id === studentId),
    );
  const day = (iso) => new Date(Date.parse(iso) + 3 * 3600000).toISOString().slice(0, 10);
  const bystro = (z) =>
    z.outcome === 'right' && z.attempts_n <= 1 && z.hint_steps === 0 && !z.shown_solution &&
    (z.level ?? 1) >= 2 && z.active_ms < 8000;
  const vid = (z, uchitel, polno) => {
    const last = [...(z.popytki ?? [])].reverse()[0];
    const out = { ...z, last_answer: last?.answer, verified: false };
    delete out.user_id;
    if (!polno) {
      delete out.popytki;
      delete out.uslovie_tex;
      delete out.risunok;
    }
    if (uchitel && bystro(z)) out.bystro = true;
    return out;
  };
  const vPeriode = (z, b) =>
    day(z.started_at) >= b.p_from && day(z.started_at) <= b.p_to && (b.p_task_no == null || z.task_no === b.p_task_no);
  function svodka(uid, b) {
    const rows = zhurnal.filter((z) => z.user_id === uid && vPeriode(z, b));
    const solved = rows.filter((z) => SOLVED.includes(z.outcome));
    const group = (key) => {
      const m = new Map();
      for (const z of rows) {
        const k = key(z);
        const g = m.get(k) ?? { solved: 0, right: 0, active_ms: 0, z };
        if (SOLVED.includes(z.outcome)) g.solved += 1;
        if (z.outcome === 'right') g.right += 1;
        g.active_ms += z.active_ms;
        m.set(k, g);
      }
      return [...m.values()];
    };
    return {
      active_ms: rows.reduce((a, z) => a + z.active_ms, 0),
      total_ms: rows.reduce((a, z) => a + z.total_ms, 0),
      solved: solved.length,
      right: rows.filter((z) => z.outcome === 'right').length,
      po_zadaniyam: group((z) => z.task_no)
        .map((g) => ({ task_no: g.z.task_no, solved: g.solved, right: g.right, active_ms: g.active_ms }))
        .sort((a, c) => a.task_no - c.task_no),
      dni: group((z) => day(z.started_at)).map((g) => ({
        day: day(g.z.started_at), solved: g.solved, active_ms: g.active_ms,
      })),
      slabye: group((z) => `${z.task_no}|${z.kind}`)
        .filter((g) => g.solved >= 3)
        .sort((a, c) => a.right / a.solved - c.right / c.solved)
        .slice(0, 5)
        .map((g) => ({ task_no: g.z.task_no, kind: g.z.kind, solved: g.solved, right: g.right })),
      varianty: zhurnalVarianty
        .filter((v) => v.user_id === uid && day(v.finished_at) >= b.p_from && day(v.finished_at) <= b.p_to)
        .map((v) => {
          const out = { ...v };
          delete out.user_id;
          return out;
        }),
    };
  }
  function lenta(uid, b, uchitel) {
    return zhurnal
      .filter((z) => z.user_id === uid && vPeriode(z, b) && (b.p_before == null || z.started_at < b.p_before))
      .sort((a, c) => (a.started_at < c.started_at ? 1 : -1))
      .slice(0, 50)
      .map((z) => vid(z, uchitel, false));
  }
  function variant(uid, id, uchitel) {
    const v = zhurnalVarianty.find((x) => x.user_id === uid && x.id === id);
    if (v === undefined) return perr(400, 'P0002', 'not_found');
    const out = { ...v, zadachi: zhurnal.filter((z) => z.user_id === uid && z.place_ref === id).map((z) => vid(z, uchitel, true)) };
    delete out.user_id;
    return { status: 200, body: out };
  }
  function zhurnalRead(name, b, me) {
    const role = profiles.get(me.id)?.role;
    if (name.startsWith('uchitel_')) {
      if (role !== 'tutor') return perr(403, '42501', name === 'uchitel_klass' ? 'forbidden' : 'not_your_student');
      if (name === 'uchitel_klass') {
        const c = classes.find((x) => x.id === b.p_class && x.tutor_id === me.id);
        if (c === undefined) return perr(403, '42501', 'forbidden');
        const ids = members.filter((m) => m.class_id === c.id).map((m) => m.user_id);
        const karta = [];
        for (const uid of ids) {
          for (const g of svodka(uid, { ...b, p_task_no: null }).po_zadaniyam) karta.push({ id: uid, ...g });
        }
        return {
          status: 200,
          body: {
            class: { id: c.id, name: c.name },
            ucheniki: ids.map((uid) => {
              const mine = zhurnal.filter((z) => z.user_id === uid);
              const last = mine.map((z) => day(z.started_at)).sort().at(-1);
              const ned = svodka(uid, { p_from: '2000-01-01', p_to: '2100-01-01', p_task_no: null });
              return {
                id: uid,
                name: profiles.get(uid)?.display_name ?? '',
                s: '2026-01-01',
                ...(last === undefined ? {} : { last_day: last }),
                nedelya: { solved: ned.solved, active_ms: ned.active_ms, dni: ned.dni.length },
              };
            }),
            karta,
            skryto: 0,
          },
        };
      }
      if (!moyStudent(me.id, b.p_student)) return perr(403, '42501', 'not_your_student');
      const uid = b.p_student;
      if (name === 'uchitel_uchenik') {
        return {
          status: 200,
          body: { id: uid, name: profiles.get(uid)?.display_name ?? '', s: '2026-01-01', progress_allowed: true,
            svodka: svodka(uid, b) },
        };
      }
      if (name === 'uchitel_lenta') return { status: 200, body: lenta(uid, b, true) };
      if (name === 'uchitel_zadacha') {
        const z = zhurnal.find((x) => x.user_id === uid && x.id === b.p_id);
        return z === undefined ? perr(400, 'P0002', 'not_found') : { status: 200, body: vid(z, true, true) };
      }
      return variant(uid, b.p_id, true);
    }
    if (role !== 'student') return perr(403, '42501', 'forbidden');
    if (name === 'moya_statistika') return { status: 200, body: svodka(me.id, b) };
    if (name === 'moya_lenta') return { status: 200, body: lenta(me.id, b, false) };
    return variant(me.id, b.p_id, false);
  }

  function seedClass(tutorEmail, studentEmails, name = 'Тестовый класс') {
    const id = `class-${classes.length + 1}`;
    classes.push({
      id,
      name,
      tutor_id: users.get(tutorEmail).id,
      archived_at: null,
      created_at: new Date().toISOString(),
    });
    for (const email of studentEmails) {
      members.push({ class_id: id, user_id: users.get(email).id });
    }
  }

  return {
    handle,
    dz,
    zhurnal,
    zhurnalVarianty,
    dz2,
    users,
    mailbox,
    kits,
    profiles,
    consents,
    parents,
    storage,
    classes,
    members,
    edition,
    seedClass,
  };
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

/** Шапка и первый экран главной на телефоне: что видно и где стоит. */
async function phoneHead(page) {
  return page.evaluate(() => {
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || getComputedStyle(el).visibility === 'hidden') return null;
      return { x: r.x, y: r.y, w: r.width, h: r.height, right: r.right, bottom: r.bottom };
    };
    const q = (sel) => document.querySelector(sel);
    const login = q('.site-head a.auth-widget__login');
    const logo = q('.site-head .logo');
    /* Прежний первый экран (HeroSection, база) и синяя сцена (SumerkiHero). */
    const hero = q('.hero__start, .sm-start');
    const lead = q('.hero__lead, .sm__lid');
    const door = q('.hero__doors, .sm-dver');
    const heroBox = box(hero);
    return {
      login: box(login),
      loginText: login?.innerText.trim() ?? null,
      loginIcon: login?.querySelector('svg, .auth-login__ico') !== null && login !== null,
      burger: box(q('.site-head .burger')),
      startVisible: box(q('.site-head .site-head__start')) !== null,
      logo: box(logo),
      nameVisible: logo !== null && parseFloat(getComputedStyle(logo).fontSize) >= 14,
      heroStart: heroBox,
      /* Ширина содержимого первого экрана — по дверям (у прежнего
         первого экрана это ряд дверей, у синей сцены — сама дверь). */
      doorW: door?.getBoundingClientRect().width ?? null,
      heroStartHref: hero?.getAttribute('href') ?? null,
      heroOrder:
        heroBox !== null &&
        lead !== null &&
        door !== null &&
        heroBox.y >= lead.getBoundingClientRect().bottom &&
        heroBox.bottom <= door.getBoundingClientRect().top,
    };
  });
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

/* Прогресс №8 прежнего формата: при входе он сворачивается в журнал LOG_8,
   в аккаунт уходит журнал, а сам прежний ключ остаётся в браузере. */
const PROGRESS_8 = 'budetege:vychisleniya-8:v1';
const LOG_8 = 'budetege:vychisleniya-8:log:v1';
const PREP_8 = 'budetege:vychisleniya-8:prep:v1';

/** Отметить обе галочки согласий в форме регистрации. */
async function tickConsents(page) {
  await page.check('input[name="accept-soglashenie"]');
  await page.check('input[name="accept-soglasie"]');
}

/** Вкладка кабинета «Профиль». */
async function openProfile(page) {
  await page.click('.kabinet__tabs [role="tab"]:has-text("Профиль")');
  await page.waitForSelector('[data-section="profile"]');
}

async function login(page, email, password) {
  await page.goto(`${SITE}/voyti/`, { waitUntil: 'networkidle' });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${SITE}/kabinet/`);
  await page.waitForSelector('.kabinet');
}

/** Зарегистрировать и подтвердить почту прямо в моке, без формы. */
function registerInMock(mock, email, password, name, role, extra = {}) {
  mock.handle(
    'POST',
    `${SUPABASE}/auth/v1/signup`,
    {},
    JSON.stringify({ email, password, data: signupData(name, role, extra) }),
  );
  mock.users.get(email).confirmed = true;
}

async function runEnabled() {
  const mock = makeMock();
  const errors = [];

  /* 1. Шапка до входа, 1440 и 390. */
  {
    const { context, page } = await newPage(mock, 1440, errors);
    await page.goto(`${SITE}/`, { waitUntil: 'networkidle' });
    check((await page.locator(LOGIN).count()) === 1, 'главная 1440: кнопка «Войти» есть');
    check(
      (await page.locator(LOGIN).innerText()).trim() === 'Войти',
      'главная 1440: на кнопке видно слово «Войти»',
    );
    /* Регистрация открыта (REGISTRATION_OPEN): «Начать бесплатно»
       ведёт на вкладку «Регистрация» страницы входа. */
    check(
      (await page.locator('.site-head__cta .btn--primary').getAttribute('href')) ===
        '/voyti/?vkladka=registraciya',
      'главная: «Начать бесплатно» ведёт на регистрацию',
    );
    check(
      (await page.locator('.site-head .auth-login__ico').count()) === 0,
      'главная 1440: у «Войти» нет значка-дубля',
    );
    check(
      await page.locator('.site-head__cta .btn--primary').isVisible(),
      'главная 1440: «Начать бесплатно» — основная кнопка в шапке',
    );
    check(
      !(await page.locator('.hero__start, .sm-start').isVisible()),
      'главная 1440: на первом экране «Начать бесплатно» не повторяется',
    );
    await shot(page, 'shapka-do-vhoda-1440');
    await context.close();
  }
  /* Телефон: в шапке знак с названием, «Войти» словом (вторичная
     таблетка, без значка) и бургер; «Начать бесплатно» в шапке нет —
     она на первом экране главной, под лидом, над дверями. Тап-зоны не
     меньше 44×44, ничего не налезает, прокрутки вбок нет и на 320. */
  for (const width of [320, 375, 390, 430]) {
    const { context, page } = await newPage(mock, width, errors);
    await page.goto(`${SITE}/`, { waitUntil: 'networkidle' });
    check(await noHorizontalScroll(page), `главная ${width}: горизонтальной прокрутки нет`);
    const head = await phoneHead(page);
    check(head.login !== null, `главная ${width}: «Войти» видна в шапке`);
    check(head.loginText === 'Войти', `главная ${width}: на кнопке слово «Войти»`);
    check(!head.loginIcon, `главная ${width}: значка-человечка у «Войти» нет`);
    check(
      head.login !== null && head.login.w >= 44 && head.login.h >= 44,
      `главная ${width}: «Войти» не меньше 44×44`,
    );
    check(
      head.burger !== null && head.burger.w >= 44 && head.burger.h >= 44,
      `главная ${width}: бургер не меньше 44×44`,
    );
    check(!head.startVisible, `главная ${width}: «Начать бесплатно» в шапке нет`);
    check(head.nameVisible, `главная ${width}: название сайта видно рядом со знаком`);
    check(
      head.login !== null && head.logo.right <= head.login.x - 4,
      `главная ${width}: логотип не налезает на «Войти»`,
    );
    check(
      head.login !== null && head.burger !== null && head.login.right <= head.burger.x,
      `главная ${width}: «Войти» не налезает на бургер`,
    );
    check(head.burger !== null && head.burger.right <= width, `главная ${width}: бургер в экране`);
    check(
      head.heroStart !== null &&
        head.doorW !== null &&
        head.heroStart.w >= head.doorW - 1 &&
        head.heroStart.w >= width - 64 &&
        head.heroStart.h >= 44,
      `главная ${width}: «Начать бесплатно» на первом экране во всю ширину содержимого`,
    );
    check(
      head.heroStartHref === '/voyti/?vkladka=registraciya',
      `главная ${width}: «Начать бесплатно» ведёт на регистрацию (регистрация открыта)`,
    );
    check(head.heroOrder, `главная ${width}: «Начать бесплатно» под лидом и над дверями`);
    if (width === 390) {
      check(
        (await page.locator(LOGIN).getAttribute('href')) === '/voyti/',
        'главная 390: «Войти» ведёт на /voyti/',
      );
      await shot(page, 'shapka-do-vhoda-390');
      /* На прокрутке шапка ниже, а содержимое под ней не сдвигается. */
      const before = await page.evaluate(
        () => document.querySelector('main').getBoundingClientRect().top + window.scrollY,
      );
      await page.evaluate(() => window.scrollTo(0, 300));
      await page.waitForFunction(() =>
        document.querySelector('.site-head').hasAttribute('data-compact'),
      );
      await page.waitForTimeout(400);
      const after = await page.evaluate(() => ({
        main: document.querySelector('main').getBoundingClientRect().top + window.scrollY,
        head: document.querySelector('.site-head').getBoundingClientRect(),
      }));
      check(after.head.height < 72 && after.head.top === 0, 'прокрутка: шапка ниже и у верха');
      check(Math.abs(after.main - before) < 0.5, 'прокрутка: содержимое под шапкой не сдвинулось');
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForFunction(
        () => !document.querySelector('.site-head').hasAttribute('data-compact'),
      );
      await page.click('.burger');
      await page.waitForSelector('#site-menu');
      check(
        (await page.locator('#site-menu a[href="/voyti/"]').count()) === 1,
        'меню телефона: пункт «Войти» есть',
      );
      await shot(page, 'menyu-390');
    }
    await context.close();
  }

  /* 2. Страница входа; галочки согласий; регистрация чужой почтой. */
  {
    const { context, page } = await newPage(mock, 1440, errors);
    await page.goto(`${SITE}/voyti/`, { waitUntil: 'networkidle' });
    check((await page.locator('h1').innerText()) === 'Вход', '/voyti/: заголовок «Вход»');
    await shot(page, 'vhod-1440');
    await page.click('[role="tab"]:has-text("Зарегистрироваться")');
    await page.fill('input[name="name"]', 'Чужой Человек');
    await page.fill('input[name="email"]', 'chuzhoy@yandex.ru');
    await page.fill('input[name="password"]', 'parol-dlinnyy-1');
    check(
      (await page.locator('input[name="birth-year"]').count()) === 0,
      'пока роль не выбрана, года рождения в форме нет',
    );
    {
      const roleCards = await page.locator('.role-card').allInnerTexts();
      check(
        roleCards.some((t) => t.includes('Я учитель')) &&
          roleCards.some((t) => t.includes('Я ученик')) &&
          !roleCards.some((t) => /репетитор/i.test(t)),
        'выбор роли «Кто вы?»: «Я ученик» и «Я учитель», без «репетитора»',
      );
    }
    await page.click('.role-card[data-role="student"]');
    check(
      (await page.locator('input[name="birth-year"]').count()) === 1,
      'ученику — поле «Год рождения»',
    );
    check(
      (await page.locator('input[name="parent-email"]').count()) === 0,
      'без года рождения почты родителя в форме нет',
    );
    await page.fill('input[name="birth-year"]', String(new Date().getFullYear() - 16));
    check(
      (await page.locator('input[name="parent-email"]').count()) === 1,
      'ученику младше 18 — поле «Почта родителя»',
    );
    await shot(page, 'registraciya-uchenik-1440');
    await page.fill('input[name="birth-year"]', '2000');
    check(
      (await page.locator('input[name="parent-email"]').count()) === 0,
      'взрослому ученику почта родителя не нужна',
    );
    await page.click('.role-card[data-role="tutor"]');
    check(
      (await page.locator('input[name="birth-year"]').count()) === 0,
      'учителю год рождения не нужен',
    );
    const docLinks = await page
      .locator('.consent-checks a')
      .evaluateAll((list) => list.map((a) => a.getAttribute('href')));
    check(
      docLinks.includes('/soglashenie/') && docLinks.includes('/soglasie/'),
      'галочки согласий со ссылками на соглашение и согласие',
    );
    check(
      (await page.locator('.auth-form a[href="/politika/"]').count()) >= 1,
      'в форме есть ссылка на политику обработки данных',
    );
    await shot(page, 'registraciya-repetitor-1440');

    /* Без галочек запрос не уходит. */
    const before = mock.users.size;
    let asked = false;
    page.on('request', (r) => {
      if (r.url().includes('/auth/v1/signup')) asked = true;
    });
    await page.click('button[type="submit"]');
    await page.waitForSelector('.field__msg--error');
    check(
      (await page.locator('.field__msg--error').innerText()).startsWith('Отметьте обе галочки'),
      'без галочек: «Отметьте обе галочки…»',
    );
    check(!asked && mock.users.size === before, 'без галочек запрос на сервер не уходит');

    await tickConsents(page);
    await page.click('button[type="submit"]');
    await page.waitForFunction(
      () =>
        document.querySelector('.field__msg--error')?.textContent ===
        'Регистрация пока по приглашению.',
    );
    check(
      (await page.locator('.field__msg--error').innerText()) === 'Регистрация пока по приглашению.',
      'чужая почта: «Регистрация пока по приглашению.»',
    );
    const html = await page.content();
    check(
      !html.includes('svoy@yandex.ru') && !html.includes('invite_only'),
      'чужая почта: ни разрешённых адресов, ни технических слов на экране',
    );
    check(errors.length === 0, 'чужая почта: ошибок в консоли нет');
    await context.close();
  }

  /* 2а. Почта не российского сервиса: спокойная подсказка со ссылкой на
        почту, запрос не уходит; «Мой адрес уже добавили» — решает сервер. */
  {
    const { context, page } = await newPage(mock, 1440, errors);
    await page.goto(`${SITE}/voyti/?vkladka=registraciya`, { waitUntil: 'networkidle' });
    const note = page.locator('.auth-form__domain');
    const email = page.locator('input[name="email"]');
    const blur = () => page.locator('input[name="name"]').click();
    let asked = 0;
    page.on('request', (r) => {
      if (r.url().includes('/auth/v1/signup')) asked += 1;
    });

    for (const value of [
      'zarubezh@gmail.com',
      'ZARUBEZH@GMAIL.COM',
      '  zarubezh@gmail.com  ',
      'ivan@mail.yandex.ru',
      'ivan@mail.ru.example.com',
    ]) {
      await email.fill(value);
      await blur();
      check((await note.count()) === 1, `«${value}»: подсказка о российских почтовых сервисах`);
    }
    const text = await note.innerText();
    check(
      text.startsWith(
        'Регистрация доступна с адресами российских почтовых сервисов: Яндекс, Mail.ru, Рамблер. Если у вас школьная или рабочая почта — напишите нам, добавим вручную.',
      ),
      `текст подсказки: ${text.slice(0, 120)}`,
    );
    check(
      ((await note.locator('a').getAttribute('href')) ?? '').startsWith('mailto:'),
      '«напишите нам» — ссылка на почту',
    );
    check(
      (await page.locator('.field__msg--error').count()) === 0,
      'подсказка спокойная: не красная ошибка',
    );

    /* Российская почта — заглавными и с пробелами — подсказку убирает. */
    await email.fill('  Novyy@Yandex.RU ');
    check((await note.count()) === 0, 'Novyy@Yandex.RU с пробелами: подсказки нет');

    /* Отправка с иностранной почтой: запрос не уходит. */
    await email.fill('zarubezh@gmail.com');
    await page.fill('input[name="name"]', 'Иван Зарубежный');
    await page.fill('input[name="password"]', 'parol-dlinnyy-1');
    await page.click('.role-card[data-role="tutor"]');
    await tickConsents(page);
    await page.click('button[type="submit"]');
    check(
      (await note.count()) === 1 && asked === 0,
      'иностранная почта: запрос на сервер не уходит',
    );

    /* «Уже добавили», а на деле нет: сервер отказывает, снова подсказка. */
    await page.click('.auth-form__domain button');
    await page.waitForFunction(() => document.querySelector('.auth-form__domain') !== null);
    check(asked === 1, '«Мой адрес уже добавили»: запрос уходит на сервер');
    check(
      (await note.count()) === 1 && (await page.locator('.field__msg--error').count()) === 0,
      'сервер отказал по домену: та же спокойная подсказка, не ошибка',
    );
    check(
      !(await page.content()).includes('domain_not_allowed'),
      'технического слова domain_not_allowed на экране нет',
    );
    check(!mock.users.has('zarubezh@gmail.com'), 'иностранная почта: аккаунт не создан');

    /* Школьная почта, добавленная вручную: аккаунт создаётся. */
    await email.fill('shkola@school.example');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.auth-form__domain');
    await page.click('.auth-form__domain button');
    await page.waitForSelector('.state');
    check(
      mock.users.has('shkola@school.example'),
      'школьная почта из ручного списка: аккаунт создан',
    );
    check(errors.length === 0, `почтовые домены: ошибок в консоли нет (${errors.join(' | ')})`);
    await shot(page, 'registraciya-domen-1440');
    await context.close();
    /* Дальше сценарий ждёт пустой почтовый ящик и одного нового
       пользователя — убираем школьный аккаунт и его письмо. */
    const shkola = mock.users.get('shkola@school.example');
    mock.users.delete(shkola.email);
    mock.profiles.delete(shkola.id);
    for (let i = mock.consents.length - 1; i >= 0; i -= 1) {
      if (mock.consents[i].user_id === shkola.id) mock.consents.splice(i, 1);
    }
    mock.mailbox.splice(0);
  }
  {
    const { context, page } = await newPage(mock, 390, errors);
    await page.goto(`${SITE}/voyti/?vkladka=registraciya`, { waitUntil: 'networkidle' });
    await page.fill('input[name="email"]', 'zarubezh@gmail.com');
    await page.locator('input[name="name"]').click();
    await page.waitForSelector('.auth-form__domain');
    check(await noHorizontalScroll(page), 'подсказка о почте 390: горизонтальной прокрутки нет');
    const button = await page.locator('.auth-form__domain button').boundingBox();
    check((button?.height ?? 0) >= 44, '«Мой адрес уже добавили» 390: высота кнопки не меньше 44');
    await shot(page, 'registraciya-domen-390');
    await context.close();
  }
  {
    const { context, page } = await newPage(mock, 390, errors);
    await page.goto(`${SITE}/voyti/`, { waitUntil: 'networkidle' });
    check(await noHorizontalScroll(page), '/voyti/ 390: горизонтальной прокрутки нет');
    await shot(page, 'vhod-390');
    await page.click('[role="tab"]:has-text("Зарегистрироваться")');
    await page.click('.role-card[data-role="student"]');
    await page.fill('input[name="birth-year"]', String(new Date().getFullYear() - 16));
    check(await noHorizontalScroll(page), 'регистрация 390: горизонтальной прокрутки нет');
    await shot(page, 'registraciya-390');
    await context.close();
  }

  /* 3. Регистрация разрешённой почтой → письмо → подтверждение → кабинет
        репетитора; перенос прогресса «Да». */
  {
    const { context, page } = await newPage(mock, 1440, errors);
    /* Онбординг уже прошёл в этом браузере, и в тренажёре №8 есть прогресс. */
    await page.goto(`${SITE}/voyti/?vkladka=registraciya`, { waitUntil: 'networkidle' });
    await page.evaluate(
      ([progressKey, prepKey]) => {
        localStorage.setItem(
          'budetege:onboarding:v1',
          JSON.stringify({
            welcomeSeen: true,
            active: null,
            tours: { repetitor: { step: 0, done: true } },
          }),
        );
        localStorage.setItem(
          progressKey,
          JSON.stringify({ kinds: { '8.A': { done: 3, right: 2, seconds: 90 } }, mistakes: [] }),
        );
        localStorage.setItem(prepKey, JSON.stringify({ 'P8-1': [1, 3] }));
      },
      [PROGRESS_8, PREP_8],
    );
    check(
      (await page.locator('[role="tab"][aria-selected="true"]').innerText()).includes(
        'Зарегистрироваться',
      ),
      '?vkladka=registraciya открывает вкладку регистрации',
    );
    await page.fill('input[name="name"]', 'Наталия Багаева');
    await page.fill('input[name="email"]', 'svoy@yandex.ru');
    await page.fill('input[name="password"]', 'kor');
    check(
      (await page.locator('.password + .field__msg').innerText()).startsWith('Ещё 5'),
      'подсказка о длине пароля по мере ввода',
    );
    await page.fill('input[name="password"]', 'moy-dlinnyy-parol');
    await page.click('.role-card[data-role="tutor"]');
    await tickConsents(page);
    await page.click('button[type="submit"]');
    await page.waitForSelector('.state');
    check(
      (await page.locator('.state').innerText()).includes('svoy@yandex.ru'),
      'разрешённая почта: экран «Подтвердите почту» с адресом',
    );
    check(
      mock.mailbox.length === 1 && mock.mailbox[0].type === 'signup',
      'письмо подтверждения отправлено',
    );
    {
      const me = mock.users.get('svoy@yandex.ru');
      const mine = mock.consents.filter((c) => c.user_id === me.id);
      check(
        mine.length === 2 && me.meta.documents_version === mock.edition.version,
        'согласия записаны: два документа текущей редакции',
      );
      check(
        !('signup_ip' in me.meta) && !('bootstrap_admin' in me.meta),
        'форма не шлёт ни IP, ни отметок администратора',
      );
    }
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
    await page.waitForSelector('.kabinet[data-role="tutor"]');

    /* Первый вход: вопрос о переносе прогресса. */
    await page.waitForSelector('[role="dialog"]');
    check(
      (await page.locator('[role="dialog"]').innerText()).includes(
        'Перенести ваш прогресс с этого устройства в кабинет?',
      ),
      'первый вход: «Перенести ваш прогресс с этого устройства в кабинет?»',
    );
    check(
      (await page.locator('[role="dialog"] .import-list').innerText()).includes('№8'),
      'в вопросе названо, что переносится: №8',
    );
    await shot(page, 'perenos-vopros-1440');
    await page.click('[role="dialog"] button:has-text("Да, перенести")');
    await page.waitForSelector('.kabinet__notice--ok');
    {
      const me = mock.users.get('svoy@yandex.ru');
      const keys = mock.storage
        .filter((r) => r.user_id === me.id)
        .map((r) => r.key)
        .sort();
      check(
        keys.length === 2 && keys.includes(LOG_8) && keys.includes(PREP_8),
        `«Да»: журнал №8 и опорные записаны в аккаунт (${keys.join(', ')})`,
      );
      const archive = Object.values(
        mock.storage.find((r) => r.user_id === me.id && r.key === LOG_8)?.value?.archive ?? {},
      );
      check(
        archive.length === 1 && archive[0]?.['8.A']?.done === 3,
        '«Да»: прежние счётчики перенесены в журнал',
      );
    }
    check(
      (await page.evaluate((k) => localStorage.getItem(k), PROGRESS_8)) !== null,
      'прогресс в браузере после переноса остался',
    );

    /* Кабинет репетитора: разделы с пустыми состояниями. */
    check(
      (await page.locator('.kabinet__role').innerText()) === 'Кабинет учителя',
      'кабинет: «Кабинет учителя»',
    );
    /* Классы и ДЗ грузятся каждый сам (components/dz/KabinetDz.tsx). */
    await page.waitForFunction(() =>
      ['classes', 'homework'].every(
        (name) => !document.querySelector(`[data-section="${name}"]`)?.textContent?.includes('…'),
      ),
    );
    const home = await page.locator('.kabinet').innerText();
    check(
      home.includes('Мои классы') && home.includes('У вас пока нет классов'),
      'репетитор: «Мои классы» — «У вас пока нет классов»',
    );
    check(
      home.includes('Домашние задания') && home.includes('Заданий пока нет'),
      'репетитор: «Домашние задания» — пустое состояние',
    );
    check(home.includes('Пока ни одного'), 'репетитор: кодов комплектов честно нет');
    check(
      (await page.locator('[data-section="progress"], [data-section="mistakes"]').count()) === 0,
      'репетитор: разделов ученика нет',
    );
    await shot(page, 'kabinet-repetitor-1440');

    /* Вкладка «Профиль». */
    await openProfile(page);
    check(page.url().endsWith('/kabinet/?vkladka=profil'), 'вкладка «Профиль» — в адресе');
    check(
      (await page.locator('dd[data-field="name"]').innerText()) === 'Наталия Багаева',
      'профиль: имя',
    );
    check(
      (await page.locator('dd[data-field="email"]').innerText()) === 'svoy@yandex.ru',
      'профиль: почта',
    );
    check((await page.locator('[data-field="role"]').innerText()) === 'Учитель', 'профиль: роль');
    const savedText = await page.locator('[data-section="saved"]').innerText();
    check(
      savedText.includes('просмотрено'),
      'профиль: факт «приветствие просмотрено» перенесён из браузера',
    );
    check(savedText.includes('Тур для учителя — пройден'), 'профиль: пройденный тур перенесён');
    check(savedText.includes('№8 «Вычисления» — перенесён'), 'профиль: перенос №8 виден');
    check(
      (await page.locator('[data-field="consent"]').innerText()).includes('редакция документов от'),
      'профиль: когда и на какую редакцию дано согласие',
    );
    await shot(page, 'kabinet-profil-1440');

    /* Выгрузка данных. */
    const download = page.waitForEvent('download');
    await page.click('[data-section="documents"] button:has-text("Выгрузить мои данные")');
    check(
      (await download).suggestedFilename() === 'budetege-moi-dannye.json',
      'выгрузка данных: файл budetege-moi-dannye.json',
    );

    /* Смена имени; роль в кабинете не меняется. */
    await page.click('[data-section="profile"] button:has-text("Изменить имя")');
    check(
      (await page.locator('[data-section="profile"] .role-card').count()) === 0,
      'в профиле выбора роли нет',
    );
    await page.fill('[data-section="profile"] input[autocomplete="name"]', 'Наталия В.');
    await page.click('[data-section="profile"] button[type="submit"]');
    await page.waitForSelector('dd[data-field="name"]:has-text("Наталия В.")');
    check(
      mock.profiles.get(mock.users.get('svoy@yandex.ru').id).display_name === 'Наталия В.',
      'имя записано в базу',
    );
    check(
      mock.profiles.get(mock.users.get('svoy@yandex.ru').id).role === 'tutor',
      'роль в базе не изменилась',
    );
    check(
      (await page.locator(AVATAR).innerText()).trim() === 'НВ',
      'инициалы в шапке обновились: «НВ»',
    );

    /* Второй заход в кабинет: вопроса о переносе больше нет. */
    await page.goto(`${SITE}/kabinet/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.kabinet');
    await page.waitForSelector('[data-section="kits"]');
    check(
      (await page.locator('[role="dialog"]').count()) === 0,
      'второй вход: вопрос о переносе не повторяется',
    );
    await shot(page, 'shapka-posle-vhoda-1440');

    /* Телефон после входа: вместо «Войти» — кружок с инициалами 44×44,
       по нажатию меню «Мой кабинет» / «Выйти»; меню с клавиатуры: фокус
       на первом пункте, стрелки, Esc закрывает и возвращает фокус на
       кружок; касание вне меню закрывает. */
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`${SITE}/`, { waitUntil: 'networkidle' });
      await page.waitForSelector(AVATAR);
      check(await noHorizontalScroll(page), `после входа ${width}: прокрутки вбок нет`);
      const head = await phoneHead(page);
      const avatar = await page.locator(AVATAR).boundingBox();
      check(head.login === null, `после входа ${width}: «Войти» в шапке нет`);
      check(
        avatar !== null && avatar.width >= 44 && avatar.height >= 44,
        `после входа ${width}: кружок аккаунта не меньше 44×44`,
      );
      check(
        avatar !== null && head.burger !== null && avatar.x + avatar.width <= head.burger.x,
        `после входа ${width}: кружок не налезает на бургер`,
      );
      check(!head.startVisible, `после входа ${width}: «Начать бесплатно» в шапке нет`);
      check(head.nameVisible, `после входа ${width}: название сайта видно`);
    }
    await page.focus(AVATAR);
    await page.keyboard.press('Enter');
    await page.waitForSelector('.auth-widget__menu');
    check(
      await page.evaluate(
        () =>
          document.activeElement?.getAttribute('role') === 'menuitem' &&
          document.activeElement.textContent?.includes('Мой кабинет'),
      ),
      'меню аккаунта с клавиатуры: фокус на «Мой кабинет»',
    );
    await page.keyboard.press('ArrowDown');
    check(
      await page.evaluate(() => document.activeElement?.textContent?.includes('Выйти') === true),
      'меню аккаунта: стрелка вниз — «Выйти»',
    );
    check(
      (await page.locator(AVATAR).getAttribute('aria-expanded')) === 'true',
      'меню аккаунта: aria-expanded="true"',
    );
    await shot(page, 'menyu-akkaunta-375');
    await page.keyboard.press('Escape');
    await page.waitForSelector('.auth-widget__menu', { state: 'detached' });
    check(
      await page.evaluate(() => document.activeElement?.classList.contains('auth-widget__button')),
      'меню аккаунта: Esc закрывает и возвращает фокус на кружок',
    );
    await page.click(AVATAR);
    await page.waitForSelector('.auth-widget__menu');
    await page.mouse.click(20, 400);
    await page.waitForSelector('.auth-widget__menu', { state: 'detached' });
    check(true, 'меню аккаунта: касание вне меню закрывает');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${SITE}/kabinet/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.kabinet');

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
    check(mock.users.has('svoy@yandex.ru'), 'выход: пользователь остался');
    check(
      errors.length === 0,
      `регистрация и кабинет: ошибок в консоли нет${errors.length ? `: ${errors.join(' | ')}` : ''}`,
    );
    await context.close();
  }

  /* 3а. Старый пользователь с иностранной почтой: зарегистрирован до
        правила о доменах — входит как раньше. */
  {
    const createdAt = new Date().toISOString();
    const old = {
      id: '00000000-0000-4000-8000-0000000000aa',
      email: 'staryy@gmail.com',
      password: 'staryy-parol-1',
      confirmed: true,
      meta: { name: 'Старый Пользователь', role: 'tutor', documents_version: mock.edition.version },
      createdAt,
    };
    mock.users.set(old.email, old);
    mock.profiles.set(old.id, {
      user_id: old.id,
      display_name: 'Старый Пользователь',
      role: 'tutor',
      grade: null,
      welcome_seen_at: createdAt,
      tour_id: null,
      tour_done: true,
      created_at: createdAt,
    });
    for (const kind of ['soglashenie', 'soglasie']) {
      mock.consents.push({
        user_id: old.id,
        kind,
        version: mock.edition.version,
        accepted_at: createdAt,
      });
    }
    const { context, page } = await newPage(mock, 1440, errors);
    await page.goto(`${SITE}/voyti/`, { waitUntil: 'networkidle' });
    await page.fill('input[name="email"]', 'Staryy@Gmail.com');
    await page.fill('input[name="password"]', 'staryy-parol-1');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${SITE}/kabinet/`);
    await page.waitForSelector('.kabinet');
    check(
      (await page.locator('.auth-form__domain').count()) === 0,
      'вход старого пользователя с gmail.com: подсказки о доменах нет, кабинет открылся',
    );
    await context.close();
  }

  /* 4. Неверный пароль; неподтверждённая почта; «Запомнить меня» выключено. */
  {
    const { context, page } = await newPage(mock, 1440, errors);
    await page.goto(`${SITE}/voyti/`, { waitUntil: 'networkidle' });
    await page.fill('input[name="email"]', 'svoy@yandex.ru');
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
        email: 'vtoroy@yandex.ru',
        password: 'vtoroy-parol-123',
        data: signupData('Второй', 'student'),
      }),
    );
    await page.fill('input[name="email"]', 'vtoroy@yandex.ru');
    await page.fill('input[name="password"]', 'vtoroy-parol-123');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.field__msg--error');
    check(
      (await page.locator('.field__msg--error').innerText()) ===
        'Подтвердите почту: письмо отправлено на vtoroy@yandex.ru.',
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
    await page.fill('input[name="email"]', 'svoy@yandex.ru');
    await page.fill('input[name="password"]', 'moy-dlinnyy-parol');
    await page.click('.auth-form__row .check--box input');
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
    await openProfile(page);
    await page.click('[data-section="account"] button:has-text("Выйти")');
    await page.waitForURL(`${SITE}/`);
    check(errors.length === 0, 'вход: ошибок в консоли нет');
    await context.close();
  }

  /* 5. Сброс пароля. */
  {
    const { context, page } = await newPage(mock, 1440, errors);
    await page.goto(`${SITE}/voyti/`, { waitUntil: 'networkidle' });
    await page.click('button:has-text("Забыли пароль?")');
    await page.fill('input[name="email"]', 'svoy@yandex.ru');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.state');
    check(
      (await page.locator('.state h4').innerText()) === 'Проверьте почту',
      'сброс: «Проверьте почту»',
    );
    const letter = mock.mailbox.at(-1);
    check(letter.type === 'recovery' && letter.to === 'svoy@yandex.ru', 'письмо сброса отправлено');
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
      mock.users.get('svoy@yandex.ru').password === 'sovsem-novyy-parol',
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

  /* 7. Кабинет ученика: пустые состояния, «Нет» на вопрос о переносе,
        класс от репетитора; репетитор видит свой класс. */
  {
    registerInMock(mock, 'uchenik@yandex.ru', 'uchenik-parol-1', 'Тестовый ученик 1', 'student');
    const { context, page } = await newPage(mock, 390, errors);
    await page.goto(`${SITE}/voyti/`, { waitUntil: 'networkidle' });
    await page.evaluate(
      (key) => localStorage.setItem(key, JSON.stringify({ kinds: { '8.B': { done: 1 } } })),
      PROGRESS_8,
    );
    await login(page, 'uchenik@yandex.ru', 'uchenik-parol-1');
    await page.waitForSelector('[role="dialog"]');
    await shot(page, 'perenos-vopros-390');
    await page.click('[role="dialog"] button:has-text("Нет")');
    await page.waitForSelector('[role="dialog"]', { state: 'detached' });
    const student = mock.users.get('uchenik@yandex.ru');
    check(
      mock.storage.filter((r) => r.user_id === student.id).length === 0,
      '«Нет»: в аккаунт ничего не ушло',
    );
    check(
      (await page.locator('.kabinet__role').innerText()) === 'Кабинет ученика',
      'кабинет: «Кабинет ученика»',
    );
    /* Главная ученика — «Карта ЕГЭ»: без прогресса — 0 из всех областей и без прогноза;
       карточки ДЗ нет, пока ДЗ не выдано; плашки «Войдите…» у вошедшего нет. */
    await page.waitForSelector(
      '[data-section="karta"] .karta-holst[data-gotov], [data-section="karta"] .karta-ps',
    );
    const kartaItog = (await page.locator('.karta-shapka__itog').innerText()).replace(/\s+/g, ' ');
    check(
      kartaItog.includes(`Освоено 0 из ${KARTA_OBLASTEY}`) &&
        kartaItog.includes('Решите ещё немного'),
      `ученик: карта — «Освоено 0 из ${KARTA_OBLASTEY}», прогноза нет (${kartaItog})`,
    );
    check((await page.locator('.karta-gost').count()) === 0, 'ученик: плашки «Войдите…» нет');
    check(
      /* На телефоне карта — список (KartaSpisok), на компьютере — острова. */
      (await page.locator('[data-section="karta"] :is(.karta-ostrov, .karta-ps__uzel)').count()) ===
        KARTA_OBLASTEY,
      `ученик: на карте ${KARTA_OBLASTEY} областей`,
    );
    await page.waitForFunction(() => document.querySelector('.karta-dz') === null, null, {
      timeout: 10000,
    });
    check(
      (await page.locator('.karta-dz').count()) === 0,
      'ученик без ДЗ: карточки ДЗ под картой нет',
    );
    check(
      (await page.locator('[data-section="kits"]').count()) === 0,
      'ученик: кодов комплектов репетитора нет',
    );
    check(await noHorizontalScroll(page), 'кабинет ученика 390: горизонтальной прокрутки нет');
    await shot(page, 'kabinet-uchenik-390');
    /* Классы — на вкладке профиля. */
    await openProfile(page);
    await page.waitForFunction(
      () => !document.querySelector('[data-section="classes"]')?.textContent?.includes('…'),
    );
    check(
      (await page.locator('[data-section="classes"]').innerText()).includes('пока не в классе'),
      'ученик без класса: «Ты пока не в классе» (в профиле)',
    );

    /* «Нет» запомнено: при следующем заходе вопроса нет. */
    await page.goto(`${SITE}/kabinet/`, { waitUntil: 'networkidle' });
    await page.waitForSelector(
      '[data-section="karta"] .karta-holst[data-gotov], [data-section="karta"] .karta-ps',
    );
    check(
      (await page.locator('[role="dialog"]').count()) === 0,
      '«Нет» запомнено: вопрос не повторяется',
    );
    check(
      mock.storage.filter((r) => r.user_id === student.id).length === 0,
      '«Нет»: и после следующего прохода синхронизации прогресс гостя не в аккаунте',
    );

    /* Тестовый класс, как после кнопки «Сервер: тестовые данные». */
    mock.seedClass('svoy@yandex.ru', ['uchenik@yandex.ru']);
    await page.goto(`${SITE}/kabinet/`, { waitUntil: 'networkidle' });
    await openProfile(page);
    await page.waitForSelector('.klass-list');
    const klass = await page.locator('[data-section="classes"]').innerText();
    check(
      klass.includes('Тестовый класс') && klass.includes('Учитель: Наталия В.'),
      'ученик в классе: название класса и имя учителя (в профиле)',
    );
    check(await noHorizontalScroll(page), 'профиль 390: горизонтальной прокрутки нет');
    await shot(page, 'kabinet-profil-390');
    await context.close();
  }
  {
    /* Школьник: до согласия родителя вопроса о переносе нет, есть плашка. */
    registerInMock(mock, 'shkolnik@yandex.ru', 'shkolnik-parol-1', 'Школьник', 'student', {
      birth_year: new Date().getFullYear() - 15,
      parent_email: 'mama@yandex.ru',
    });
    const { context, page } = await newPage(mock, 1440, errors);
    await page.goto(`${SITE}/voyti/`, { waitUntil: 'networkidle' });
    await page.evaluate(
      (key) => localStorage.setItem(key, JSON.stringify({ kinds: { '8.B': { done: 1 } } })),
      PROGRESS_8,
    );
    await login(page, 'shkolnik@yandex.ru', 'shkolnik-parol-1');
    await page.waitForSelector('.kabinet__notice');
    check(
      (await page.locator('.kabinet__notice').innerText()).includes('Ждём согласия родителя'),
      'школьник: плашка «Ждём согласия родителя»',
    );
    check(
      (await page.locator('[role="dialog"]').count()) === 0,
      'школьник до согласия родителя: вопроса о переносе нет',
    );
    await shot(page, 'kabinet-shkolnik-1440');
    await context.close();
  }

  /* 7б. Два устройства: тренировка №8, начатая на компьютере, продолжается
         на телефоне с той же задачи; решённое и закладка — в кабинете. */
  {
    registerInMock(mock, 'dva@yandex.ru', 'dva-ustroystva-1', 'Ученик Два', 'student');
    const dva = mock.users.get('dva@yandex.ru');
    const KEYS = [
      'budetege:vychisleniya-8:log:v1',
      'budetege:trainer:8:session',
      'budetege:zakladki:v1',
    ];
    /* Записи браузера совпали с аккаунтом — синхронизация дошла. */
    const pushed = async (page) => {
      const until = Date.now() + 15000;
      for (;;) {
        const local = await page.evaluate((ks) => ks.map((k) => localStorage.getItem(k)), KEYS);
        const same = KEYS.every((key, i) => {
          const row = mock.storage.find((r) => r.user_id === dva.id && r.key === key);
          return (
            row !== undefined &&
            local[i] !== null &&
            JSON.stringify(row.value) === JSON.stringify(JSON.parse(local[i]))
          );
        });
        if (same || Date.now() > until) return same;
        await new Promise((done) => setTimeout(done, 250));
      }
    };
    const TRAINER = `${SITE}/zadaniya/8/trenazher/`;
    const CARD = '.trn-zadacha[data-task]';

    const desk = await newPage(mock, 1280, errors);
    await welcomeSeen(desk.context);
    await login(desk.page, 'dva@yandex.ru', 'dva-ustroystva-1');
    check(
      (await desk.page.locator('[role="dialog"]').count()) === 0,
      'два устройства: без прогресса гостя вопроса о переносе нет',
    );
    await desk.page.goto(TRAINER, { waitUntil: 'networkidle' });
    /* Стартовый экран тренажёра: «Выбрать темы» → 5 задач → «Начать». */
    await desk.page.waitForSelector('.trn-start');
    await desk.page.locator('.trn-rezhim:has-text("Выбрать темы")').click();
    await desk.page.locator('.trn-seg button').filter({ hasText: /^5$/ }).first().click();
    await desk.page.locator('.trn-vybor__start').click();
    await desk.page.waitForSelector(CARD);
    const first = await desk.page.locator(CARD).getAttribute('data-task');
    const parsed = parseTaskId(first);
    const right = ru(generate(parsed.prototype, parsed.seed, parsed.level).otvet);
    await desk.page.fill('.trn-ekran .otvet-input__field', right);
    await desk.page.locator('.trn-otvetnaya button:has-text("Проверить")').click();
    await desk.page.locator('.trn-knopki button:has-text("Дальше")').click();
    await desk.page.waitForFunction(
      ([sel, id]) => document.querySelector(sel)?.getAttribute('data-task') !== id,
      [CARD, first],
    );
    const second = await desk.page.locator(CARD).getAttribute('data-task');
    await desk.page.locator('.trn-zadacha .zakladka').click();
    check(await pushed(desk.page), 'компьютер: журнал, тренировка и закладка ушли в аккаунт');
    await desk.context.close();

    const phone = await newPage(mock, 390, errors);
    await welcomeSeen(phone.context);
    await login(phone.page, 'dva@yandex.ru', 'dva-ustroystva-1');
    /* Журнал №8 с компьютера приехал: на карте №8 — «в процессе». */
    await phone.page
      .waitForFunction(
        () =>
          document.querySelector(
            '.karta-ostrov--v-processe .karta-ostrov__kontur[data-cel="oblast:8"], .karta-ps__uzel--v-processe[data-no="8"]',
          ) !== null,
        null,
        { timeout: 10000 },
      )
      .catch(() => {});
    check(
      (await phone.page
        .locator(
          '.karta-ostrov--v-processe .karta-ostrov__kontur[data-cel="oblast:8"], .karta-ps__uzel--v-processe[data-no="8"]',
        )
        .count()) === 1,
      'телефон: на карте №8 «в процессе» — решённое на компьютере приехало',
    );
    const laterRaw = await phone.page.evaluate(() => localStorage.getItem('budetege:zakladki:v1'));
    check(
      typeof laterRaw === 'string' && laterRaw.includes(second),
      'телефон: закладка с компьютера приехала в хранилище',
    );
    check(
      await noHorizontalScroll(phone.page),
      'кабинет с прогрессом 390: горизонтальной прокрутки нет',
    );
    await shot(phone.page, 'kabinet-uchenik-progress-390');
    await phone.page.goto(TRAINER, { waitUntil: 'networkidle' });
    await phone.page.waitForSelector(CARD);
    check(
      (await phone.page.locator(CARD).getAttribute('data-task')) === second,
      'телефон: тренировка продолжается с той же задачи',
    );
    check(
      (await phone.page.locator('.trn-zadacha .zakladka').getAttribute('aria-pressed')) === 'true',
      'телефон: задача отмечена «Отложить на потом»',
    );
    await phone.context.close();
  }

  /* 7в. Классы и ДЗ №8: класс и код, вступление, выдача, решение,
         результаты, работа над ошибками. */
  {
    registerInMock(mock, 'dz-repetitor@yandex.ru', 'dz-repetitor-1', 'Ирина Петровна', 'tutor');
    registerInMock(mock, 'dz-uchenik1@yandex.ru', 'dz-uchenik-1', 'Аня Смирнова', 'student');
    registerInMock(mock, 'dz-uchenik2@yandex.ru', 'dz-uchenik-2', 'Петя Иванов', 'student');
    const tutorUser = mock.users.get('dz-repetitor@yandex.ru');
    const s1 = mock.users.get('dz-uchenik1@yandex.ru');
    const text = async (page, sel) =>
      (await page.locator(sel).first().innerText()).replace(/\s+/g, ' ');

    /* Репетитор: пустые состояния, класс и код. */
    const tutor = await newPage(mock, 1280, errors);
    await welcomeSeen(tutor.context);
    await login(tutor.page, 'dz-repetitor@yandex.ru', 'dz-repetitor-1');
    await tutor.page.waitForFunction(
      () => !document.querySelector('[data-section="classes"]')?.textContent?.includes('…'),
    );
    check(
      (await text(tutor.page, '[data-section="classes"]')).includes(
        'У вас пока нет классов — создайте первый',
      ),
      'ДЗ: репетитор без классов — «У вас пока нет классов — создайте первый»',
    );
    await tutor.page.waitForFunction(
      () => !document.querySelector('[data-section="homework"]')?.textContent?.includes('…'),
    );
    check(
      (await text(tutor.page, '[data-section="homework"]')).includes('Заданий пока нет'),
      'ДЗ: репетитор без заданий — «Заданий пока нет»',
    );
    await tutor.page.fill('input[name="class-name"]', 'Группа по средам');
    await tutor.page.locator('[data-section="classes"] button:has-text("Создать класс")').click();
    await tutor.page.waitForSelector('.dz-klassy__item');
    const code = (await tutor.page.locator('.dz-klassy__code').innerText()).trim();
    check(/^[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{6}$/.test(code), `ДЗ: у класса код из 6 знаков (${code})`);
    await shot(tutor.page, 'dz-kabinet-repetitor-1280');
    await tutor.page.locator('.dz-klassy__name').click();
    await tutor.page.waitForSelector('.dz-code');
    check(
      (await tutor.page.locator('.dz-link').innerText()).includes(`/kabinet/vstupit/?kod=${code}`),
      'ДЗ: на странице класса — ссылка-приглашение с кодом',
    );
    const classUrl = tutor.page.url();

    /* Ученик 1: ссылка до входа — код помнится и подставляется после входа. */
    const st1 = await newPage(mock, 390, errors);
    await welcomeSeen(st1.context);
    await st1.page.goto(`${SITE}/kabinet/vstupit/?kod=${code}`, { waitUntil: 'networkidle' });
    await st1.page.waitForSelector('text=войди в кабинет ученика');
    check(true, 'ДЗ: ссылка-приглашение без входа — «войди в кабинет ученика»');
    await login(st1.page, 'dz-uchenik1@yandex.ru', 'dz-uchenik-1');
    await st1.page.waitForSelector('[data-form="join"] input[name="class-code"]');
    check(
      (await st1.page.inputValue('[data-form="join"] input[name="class-code"]')) === code,
      'ДЗ: после входа код из ссылки уже в форме «Вступить»',
    );
    await st1.page.locator('[data-form="join"] button:has-text("Вступить")').click();
    await st1.page.waitForSelector('[data-form="join"] .dz-ok');
    check(
      (await text(st1.page, '[data-form="join"] .dz-ok')).includes('Группа по средам'),
      'ДЗ: ученик вступил по ссылке — «Готово: ты в классе …»',
    );

    /* Ученик 2: неверный код, потом код строчными и с дефисом. */
    const st2 = await newPage(mock, 1280, errors);
    await welcomeSeen(st2.context);
    await login(st2.page, 'dz-uchenik2@yandex.ru', 'dz-uchenik-2');
    await st2.page.waitForSelector('[data-form="join"] input[name="class-code"]');
    await st2.page.fill('[data-form="join"] input[name="class-code"]', 'ZZZZZZ');
    await st2.page.locator('[data-form="join"] button:has-text("Вступить")').click();
    await st2.page.waitForFunction(() =>
      document.querySelector('[data-form="join"]')?.textContent?.includes('Такого кода нет'),
    );
    check(
      (await text(st2.page, '[data-form="join"]')).includes('Такого кода нет'),
      'ДЗ: неверный код — «Такого кода нет или класс сейчас не принимает учеников»',
    );
    await st2.page.fill(
      '[data-form="join"] input[name="class-code"]',
      `${code.slice(0, 3).toLowerCase()}-${code.slice(3).toLowerCase()}`,
    );
    await st2.page.locator('[data-form="join"] button:has-text("Вступить")').click();
    await st2.page.waitForSelector('[data-form="join"] .dz-ok');
    check(true, 'ДЗ: код строчными и с дефисом тоже подходит');

    /* Репетитор: двое в классе, псевдоним ученика. */
    await tutor.page.goto(classUrl, { waitUntil: 'networkidle' });
    await tutor.page.waitForSelector('.dz-members__item');
    check(
      (await tutor.page.locator('.dz-members__item').count()) === 2,
      'ДЗ: в классе двое учеников',
    );
    const petya = tutor.page.locator('.dz-members__item', { hasText: 'Петя Иванов' });
    await petya.locator('button:has-text("Переименовать")').click();
    await tutor.page.locator('.dz-members__item input').fill('Петя (среда)');
    await tutor.page.locator('.dz-members__item button:has-text("Сохранить")').click();
    await tutor.page.waitForSelector('.dz-members__name:has-text("Петя (среда)")');
    check(true, 'ДЗ: репетитор переименовал ученика для себя');
    await shot(tutor.page, 'dz-klass-1280');

    /* Выдать ДЗ из формы: типы 8.A и 8.B по одной задаче, 2 попытки, решения сразу. */
    await tutor.page.goto(`${SITE}/kabinet/dz-vydat/?ot=trenazher&tipy=8.A,8.B&n=1`, {
      waitUntil: 'networkidle',
    });
    await tutor.page.waitForSelector('[data-section="preview"] .dz-preview__item');
    await tutor.page.waitForFunction(
      () => document.querySelectorAll('[data-section="preview"] .dz-preview__item').length === 2,
    );
    check(true, 'ДЗ: форма выдачи из тренажёра — типы уже отмечены, в предпросмотре 2 задачи');
    check(
      (await tutor.page.locator('[data-list="students"] input:checked').count()) === 3,
      'ДЗ: по умолчанию — всему классу (галочка «Всему классу» и оба ученика)',
    );
    check(
      !(await tutor.page.getByRole('checkbox', { name: 'Показывать «Запомни»' }).isChecked()) &&
        !(await tutor.page
          .getByRole('checkbox', { name: 'Показывать разобранный пример' })
          .isChecked()),
      'ДЗ: «Запомни» и разобранный пример по умолчанию выключены',
    );
    await tutor.page.fill('input[name="title"]', 'ДЗ: степени и корни');
    await tutor.page.getByRole('radio', { name: '2', exact: true }).check();
    await tutor.page.getByRole('radio', { name: 'Сразу после ответа' }).check();
    await shot(tutor.page, 'dz-vydat-1280');
    await tutor.page.locator('button[type="submit"]:has-text("Выдать")').click();
    await tutor.page.waitForSelector('text=Задание выдано');
    const hw = mock.dz.homework.find((h) => h.title === 'ДЗ: степени и корни');
    check(
      hw !== undefined &&
        hw.attempts_limit === 2 &&
        hw.solutions_when === 'instant' &&
        !hw.show_memo,
      'ДЗ: в базе — 2 попытки, решения сразу, «Запомни» выключено',
    );
    const hwTasks = mock.dz.tasks
      .filter((t) => t.homework_id === hw.id)
      .sort((a, b) => a.position - b.position);
    const keyOf = (task) => mock.dz.keys.find((k) => k.task_id === task.id).answer;
    check(
      hwTasks.length === 2 && hwTasks.every((t) => t.student_id === null),
      'ДЗ: один набор на всех — 2 общие задачи',
    );
    check(
      !hwTasks.some((t) => /банк|новая/.test(t.question_html)),
      'ДЗ: в условии для ученика нет меток «банк/новая»',
    );

    /* Ученик 1 (телефон): ДЗ в кабинете, плашка в №8, решение. */
    /* Карточка ДЗ под картой: название, срок, «сделано 0 из N». */
    await st1.page.goto(`${SITE}/kabinet/`, { waitUntil: 'networkidle' });
    await st1.page.waitForSelector('.karta-dz');
    check(
      (await text(st1.page, '.karta-dz')).includes('ДЗ: степени и корни') &&
        /сделано 0 из \d+/.test(await text(st1.page, '.karta-dz')),
      'ДЗ: у ученика под картой — карточка задания, «сделано 0 из N»',
    );
    await st1.page.goto(`${SITE}/zadaniya/8/`, { waitUntil: 'networkidle' });
    await st1.page.waitForSelector('[data-block="dz-plashka"]');
    check(
      (await text(st1.page, '[data-block="dz-plashka"]')).includes('У вас домашнее задание до'),
      'ДЗ: в разделе №8 — плашка «У вас домашнее задание до …»',
    );
    await shot(st1.page, 'dz-plashka-390');
    await st1.page.locator('[data-block="dz-plashka"] a').click();
    await st1.page.waitForSelector('.dz-task');
    const field = '.dz-answer .otvet-input__field';
    const left = () => st1.page.locator('[data-left]').getAttribute('data-left');
    const key1 = keyOf(hwTasks[0]);
    const asFraction = (decimal) => {
      const [int, frac = ''] = decimal.replace('-', '').split('.');
      const den = 10 ** frac.length;
      const num = Number(`${int}${frac}`);
      const g = (a, b) => (b === 0 ? a : g(b, a % b));
      const d = g(num, den) || 1;
      return `${decimal.startsWith('-') ? '−' : ''}${(num / d) * (den / d === 1 ? 2 : 1)}/${den / d === 1 ? 2 : den / d}`;
    };
    await st1.page.fill(field, asFraction(key1));
    await st1.page.locator('.dz-answer button:has-text("Проверить")').click();
    await st1.page.waitForSelector('.dz-answer .otvet-hint');
    check(
      (await text(st1.page, '.dz-answer .otvet-hint')).startsWith('Значение верное') &&
        (await left()) === '2',
      `ДЗ: «${asFraction(key1)}» — «Значение верное…», попытка не потрачена`,
    );
    await st1.page.fill(field, '5 см');
    await st1.page.locator('.dz-answer button:has-text("Проверить")').click();
    await st1.page.waitForSelector('.dz-answer .otvet-hint');
    check(
      (await text(st1.page, '.dz-answer .otvet-hint')).includes('только число') &&
        (await left()) === '2',
      'ДЗ: «5 см» — подсказка о записи, попытка не потрачена',
    );
    const wrong1 = String(Number(key1) + 1).replace('.', ',');
    await st1.page.fill(field, wrong1);
    await st1.page.locator('.dz-answer button:has-text("Проверить")').click();
    await st1.page.waitForSelector('.dz-verdict--wrong');
    check((await left()) === '1', 'ДЗ: неверный ответ — осталась 1 попытка');
    await st1.page.fill(field, key1.replace('.', ','));
    await st1.page.locator('.dz-answer button:has-text("Проверить")').click();
    await st1.page.waitForSelector('.dz-verdict--right');
    await st1.page.waitForSelector('.z8-razbor');
    check(true, 'ДЗ: верно — и сразу решение по шагам (решения «сразу после ответа»)');
    check(await noHorizontalScroll(st1.page), 'ДЗ: решение ДЗ 390 — горизонтальной прокрутки нет');
    await shot(st1.page, 'dz-reshenie-390');
    await st1.page.locator('.dz-strip__btn').nth(1).click();
    await st1.page.waitForSelector(`.dz-task[data-task="${hwTasks[1].id}"]`);
    await st1.page.locator('.dz-answer button:has-text("Показать решение")').click();
    await st1.page
      .locator(
        '.modal button:has-text("Показать решение"), [role="dialog"] button:has-text("Показать решение")',
      )
      .last()
      .click();
    await st1.page.waitForSelector('.z8-razbor');
    check(
      (await st1.page.locator('.dz-strip__btn.is-revealed').count()) === 1,
      'ДЗ: «Показать решение» закрывает задачу — в ленте она отмечена',
    );
    await st1.page.locator('.dz-submit button:has-text("Сдать задание")').click();
    await st1.page.locator('[role="dialog"] button:has-text("Сдать задание")').click();
    await st1.page.waitForSelector('[data-state="submitted"]');
    check(
      (await text(st1.page, '[data-state="submitted"]')).includes('Верно 1 из 2'),
      'ДЗ: после «Сдать» — «Сдано … · Верно 1 из 2»',
    );

    /* Ученику форма выдачи недоступна. */
    await st2.page.goto(`${SITE}/kabinet/dz-vydat/`, { waitUntil: 'networkidle' });
    await st2.page.waitForSelector('text=Эта страница — для учителя.');
    check(true, 'ДЗ: ученику форма выдачи — «Эта страница — для учителя»');

    /* Репетитор: таблица, что вводил ученик, комментарий, работа над ошибками. */
    await tutor.page.goto(`${SITE}/kabinet/domashka/?id=${hw.id}`, { waitUntil: 'networkidle' });
    await tutor.page.waitForSelector('.dz-table');
    const row1 = tutor.page.locator(`tr[data-student="${s1.id}"]`);
    const marks1 = await row1
      .locator('.dz-cell')
      .evaluateAll((els) => els.map((e) => e.dataset.mark));
    check(
      marks1.join(',') === 'right,revealed',
      `ДЗ: в таблице у ученика 1 — верно, с решением (${marks1.join(',')})`,
    );
    const marks2 = await tutor.page
      .locator('tr[data-student]')
      .nth(1)
      .locator('.dz-cell')
      .evaluateAll((els) => els.map((e) => e.dataset.mark));
    check(marks2.join(',') === 'none,none', 'ДЗ: у ученика 2 — не решал');
    check(
      (await text(tutor.page, '[data-section="kinds"]')).includes('1 из 2 ошиблись') ||
        (await text(tutor.page, '[data-section="kinds"]')).includes('1 из 2 ошибся'),
      'ДЗ: сводка по типам — «1 из 2 ошиблись»',
    );
    await row1.locator('.dz-cell').first().click();
    await tutor.page.waitForSelector('[data-section="cell"]');
    check(
      (await text(tutor.page, '[data-section="cell"] [data-field="entered"]')).includes(wrong1),
      `ДЗ: клик по клетке — что вводил ученик (${wrong1})`,
    );
    await shot(tutor.page, 'dz-rezultaty-1280');
    await tutor.page
      .locator('[data-section="task-comment"] textarea')
      .fill('Посмотри, как сокращаются степени');
    await tutor.page.locator('[data-section="task-comment"] button:has-text("Сохранить")').click();
    await tutor.page.waitForSelector('[data-section="task-comment"] .dz-ok');
    check(
      hwTasks[0].comment === 'Посмотри, как сокращаются степени',
      'ДЗ: комментарий к задаче сохранён',
    );
    await st1.page.reload({ waitUntil: 'networkidle' });
    await st1.page.locator('.dz-strip__btn').first().click();
    await st1.page.waitForSelector('[data-note="task"]');
    check(true, 'ДЗ: ученик видит комментарий репетитора к задаче');

    await tutor.page
      .locator('[data-section="kinds"] a:has-text("Выдать работу над ошибками")')
      .click();
    await tutor.page.waitForSelector('[data-section="preview"] .dz-preview-people');
    check(
      (await tutor.page.locator('[data-list="students"] input').count()) === 1,
      'ДЗ: работа над ошибками — только тому, кто ошибся',
    );
    await tutor.page.locator('button[type="submit"]:has-text("Выдать")').click();
    await tutor.page.waitForSelector('text=Задание выдано');
    const fix = mock.dz.homework.find((h) => h.parent_id === hw.id);
    const fixTasks = fix === undefined ? [] : mock.dz.tasks.filter((t) => t.homework_id === fix.id);
    check(
      fix !== undefined &&
        fix.origin === 'oshibki' &&
        fixTasks.length === 1 &&
        fixTasks[0].student_id === s1.id &&
        fixTasks[0].kind === hwTasks[1].kind &&
        fixTasks[0].question_html !== hwTasks[1].question_html,
      'ДЗ: работа над ошибками — новый аналог задачи с ошибкой, тот же тип, ученику 1',
    );
    /* Телефон: экраны репетитора без горизонтальной прокрутки. */
    await tutor.page.setViewportSize({ width: 390, height: 844 });
    for (const [what, url] of [
      ['кабинет', `${SITE}/kabinet/`],
      ['класс', classUrl],
      ['выдача', `${SITE}/kabinet/dz-vydat/?ot=trenazher&tipy=8.A,8.B&n=1`],
      ['результаты', `${SITE}/kabinet/domashka/?id=${hw.id}`],
    ]) {
      await tutor.page.goto(url, { waitUntil: 'networkidle' });
      await tutor.page.waitForTimeout(800);
      check(
        await noHorizontalScroll(tutor.page),
        `ДЗ: репетитор, ${what} 390 — горизонтальной прокрутки нет`,
      );
    }
    await st1.page.goto(`${SITE}/kabinet/`, { waitUntil: 'networkidle' });
    await st1.page.waitForSelector('.karta-dz');
    check(
      await noHorizontalScroll(st1.page),
      'ДЗ: ученик, кабинет 390 — горизонтальной прокрутки нет',
    );
    void tutorUser;
    await st1.context.close();
    await st2.context.close();
    await tutor.context.close();
  }

  /* 8. Комплект репетитора уходит в аккаунт; телефон: блок аккаунта и панели. */
  {
    const { context, page } = await newPage(mock, 390, errors);
    await login(page, 'svoy@yandex.ru', 'sovsem-novyy-parol');
    await page.waitForSelector('.dz-klassy__item');
    const klass = await page.locator('[data-section="classes"]').innerText();
    check(
      klass.includes('Тестовый класс') && klass.includes('1 ученик'),
      'репетитор: свой класс и сколько в нём учеников',
    );
    /* Имена учеников — на странице класса. */
    await page.locator('.dz-klassy__name', { hasText: 'Тестовый класс' }).click();
    await page.waitForSelector('.dz-members__item');
    check(
      (await page.locator('.dz-members').innerText()).includes('Тестовый ученик 1'),
      'репетитор: на странице класса — ученик',
    );
    await page.goto(`${SITE}/kabinet/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.dz-klassy__item');
    check(await noHorizontalScroll(page), 'кабинет 390: горизонтальной прокрутки нет');
    await shot(page, 'kabinet-repetitor-390');

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
      return { auth: box('.topbar .auth-widget'), bar: box('.gen-actbar'), fab: box('.help-fab') };
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

    /* Скачивание листа (общий генератор): «Сгенерировать», затем «Скачать
       PDF» — ссылка открывает новую вкладку, её закрываем. */
    await page.locator('.gen-actbar .gen-go').click();
    await page.waitForSelector('.gen-paper.is-live .gen-task');
    const kitBtn = page.locator('a.gen-pv__pdf[href]');
    if ((await kitBtn.count()) === 1) {
      /* Адрес листа несёт код комплекта (lib/komplekt.ts, withKit). */
      const code = new URL(await kitBtn.getAttribute('href'), SITE).searchParams.get('kit') ?? '';
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
        mock.kits.length === 1 && code !== '' && mock.kits[0].code === code,
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

  /* 9. Удаление аккаунта. */
  {
    const { context, page } = await newPage(mock, 1440, errors);
    await login(page, 'svoy@yandex.ru', 'sovsem-novyy-parol');
    const id = mock.users.get('svoy@yandex.ru').id;
    await openProfile(page);
    await page.click('[data-section="account"] button:has-text("Удалить аккаунт")');
    await page.waitForSelector('[role="dialog"]');
    await shot(page, 'udalenie-1440');
    await page.click('[role="dialog"] button:has-text("Удалить")');
    await page.waitForSelector('.state');
    check(
      (await page.locator('.state h4').innerText()) === 'Аккаунт удалён',
      'удаление: «Аккаунт удалён»',
    );
    check(!mock.users.has('svoy@yandex.ru'), 'пользователя на сервере нет');
    check(mock.kits.length === 0, 'комплекты удалены каскадом');
    check(
      mock.storage.filter((r) => r.user_id === id).length === 0,
      'перенесённый прогресс удалён каскадом',
    );
    check(
      mock.consents.filter((c) => c.user_id === id && c.account_deleted_at).length === 2,
      'запись о согласии осталась с отметкой об удалении',
    );
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

  if (ZHURNAL_ON) await runZhurnal();
  if (PROGRESS_ON) await runProgress();
  if (DZ2_ON) await runDz2();

  sdkOutsideFirstLoad();
}

/** SDK входа не должен попадать в первую загрузку страниц. */
function sdkOutsideFirstLoad() {
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

/* ── Журнал решения задач (docs/kabinet-zhurnal.md) ──
   Ученик решает №8 в тренажёре: неверно, потом верно; вторую задачу —
   с подсказкой. В «базу» уходят ответы как есть, номера попыток,
   подсказка, время и исход. Учитель журнал не пишет. Снимки экрана
   тренажёра с записью — на телефоне и компьютере. */
async function runZhurnal() {
  const mock = makeMock();
  /* У каждой ширины свой ученик: тренировка синхронизируется с аккаунтом,
     и второй вход продолжил бы начатую. */
  const uchenik = { 375: 'zhurnal@yandex.ru', 1280: 'zhurnal2@yandex.ru' };
  for (const email of Object.values(uchenik)) {
    registerInMock(mock, email, 'zhurnal-parol-1', 'Журнал Ученик', 'student', { birth_year: 2000 });
  }
  const errors = [];
  const answerOfTask = (id) => {
    const parsed = parseTaskId(id);
    return generate(parsed.prototype, parsed.seed, parsed.level).otvet;
  };
  for (const width of [375, 1280]) {
    const { context, page } = await newPage(mock, width, errors);
    await welcomeSeen(context);
    await login(page, uchenik[width], 'zhurnal-parol-1');
    await page.goto(`${SITE}/zadaniya/8/trenazher/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.trn-start');
    await page.locator('.trn-rezhim:has-text("Выбрать темы")').click();
    await page.locator('.trn-seg button').filter({ hasText: /^5$/ }).first().click();
    await page.locator('.trn-vybor__start').click();
    const CARD = '.trn-zadacha[data-task]';
    await page.waitForSelector(CARD);
    const first = await page.locator(CARD).getAttribute('data-task');
    const right = answerOfTask(first);
    const wrongTyped = ` ${ru(right + 1)} `;
    await page.fill('.trn-ekran .otvet-input__field', wrongTyped);
    await page.locator('.trn-otvetnaya button:has-text("Проверить")').click();
    await page.waitForSelector('.trn-verdikt--net');
    await page.fill('.trn-ekran .otvet-input__field', ru(right));
    await page.locator('.trn-otvetnaya button:has-text("Проверить")').click();
    await page.locator('.trn-knopki button:has-text("Дальше")').click();
    await page.waitForFunction(
      ([sel, id]) => document.querySelector(sel)?.getAttribute('data-task') !== id,
      [CARD, first],
    );
    const second = await page.locator(CARD).getAttribute('data-task');
    const hint = page.locator('.trn-ekran button:has-text("Подсказка")');
    const hinted = (await hint.count()) > 0;
    if (hinted) await hint.first().click();
    await page.fill('.trn-ekran .otvet-input__field', ru(answerOfTask(second)));
    await page.locator('.trn-otvetnaya button:has-text("Проверить")').click();
    await page.waitForSelector('.trn-verdikt--da');
    if (SHOTS !== null) {
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(SHOTS, `zhurnal-trenazher-8-${width}.png`) });
    }
    /* Очередь уходит через 3 с после изменения. */
    const until = Date.now() + 15000;
    const rowOf = (id) =>
      mock.zhurnal.find((r) => r.task_ref === id && r.outcome !== null && r.outcome !== undefined);
    while (Date.now() < until && (rowOf(first) === undefined || rowOf(second) === undefined)) {
      await new Promise((done) => setTimeout(done, 250));
    }
    const a = rowOf(first);
    const b = rowOf(second);
    check(a !== undefined && b !== undefined, `журнал ${width}: обе задачи ушли в базу`);
    if (a !== undefined) {
      check(a.task_no === 8 && a.kind === parseTaskId(first).prototype && a.place === 'trenazher',
        `журнал ${width}: раздел, тип и место задачи`);
      check(a.popytki.length === 2 && a.popytki[0].answer === wrongTyped && !a.popytki[0].ok
        && a.popytki[1].ok && a.popytki[1].n === 2,
        `журнал ${width}: обе попытки с ответом как есть: ${JSON.stringify(a.popytki)}`);
      check(a.outcome === 'wrong', `журнал ${width}: верно со второй попытки — ошибка (${a.outcome})`);
      check(typeof a.gen_hash === 'string' && a.gen_hash.length === 16 && a.uslovie_tex.length > 0,
        `журнал ${width}: отпечаток и условие для учителя`);
      check(a.total_ms > 0 && a.active_ms > 0 && a.active_ms <= a.total_ms,
        `журнал ${width}: активное и общее время (${a.active_ms} из ${a.total_ms})`);
    }
    if (b !== undefined) {
      check(b.outcome === (hinted ? 'hinted' : 'right') && b.hint_steps === (hinted ? 1 : 0),
        `журнал ${width}: подсказка и исход второй задачи (${b.outcome}, ${b.hint_steps})`);
    }
    await context.close();
    mock.zhurnal.length = 0;
  }
  /* Учитель журнал не пишет: очереди у него нет. */
  registerInMock(mock, 'zhurnal-uchitel@yandex.ru', 'zhurnal-parol-2', 'Журнал Учитель', 'tutor');
  const { context, page } = await newPage(mock, 1280, errors);
  await welcomeSeen(context);
  await login(page, 'zhurnal-uchitel@yandex.ru', 'zhurnal-parol-2');
  await page.goto(`${SITE}/zadaniya/8/trenazher/`, { waitUntil: 'networkidle' });
  await page.locator('.trn-rezhim:has-text("Выбрать темы")').click();
  await page.locator('.trn-seg button').filter({ hasText: /^5$/ }).first().click();
  await page.locator('.trn-vybor__start').click();
  await page.waitForSelector('.trn-zadacha[data-task]');
  const id = await page.locator('.trn-zadacha[data-task]').getAttribute('data-task');
  await page.fill('.trn-ekran .otvet-input__field', ru(answerOfTask(id)));
  await page.locator('.trn-otvetnaya button:has-text("Проверить")').click();
  await new Promise((done) => setTimeout(done, 5000));
  check(mock.zhurnal.length === 0, 'журнал: учитель в журнал не пишет');
  await context.close();
  check(errors.length === 0, `журнал: ошибок в консоли нет${errors.length ? `: ${errors.join(' | ')}` : ''}`);
}

/* ── Экраны прогресса (кабинет v2, этап 1б; docs/kabinet-zhurnal.md) ──
   Журнал заполнен заранее (как его пишет браузер ученика — это проверяет
   runZhurnal): учитель открывает класс, ученика, задачу и вариант; чужого
   ученика ему не показывают; Excel скачивается; ученик видит «Мою
   статистику» без пометки «очень быстро». Снимки — 375 и 1280. */
async function runProgress() {
  const M = requireSrc('lib/zhurnal/model.ts');
  const mock = makeMock();
  const emails = ['zhurnal@yandex.ru', 'zhurnal2@yandex.ru', 'zhurnal-chuzhoy@yandex.ru'];
  const names = ['Аня Смирнова', 'Борис Ким', 'Чужой ученик'];
  emails.forEach((e, i) =>
    registerInMock(mock, e, 'zhurnal-parol-1', names[i], 'student', { birth_year: 2000 }),
  );
  registerInMock(mock, 'zhurnal-uchitel@yandex.ru', 'zhurnal-parol-2', 'Журнал Учитель', 'tutor');
  registerInMock(mock, 'zhurnal-uchitel2@yandex.ru', 'zhurnal-parol-2', 'Другой учитель', 'tutor');
  mock.seedClass('zhurnal-uchitel@yandex.ru', emails.slice(0, 2), '11 «А»');
  mock.seedClass('zhurnal-uchitel2@yandex.ru', emails.slice(2), 'Чужой класс');
  const uid = (e) => mock.users.get(e).id;

  /* Журнал: задачи №8 (те же числа собираются по id) и №5, вариант. */
  const now = Date.now();
  const iso = (minAgo) => new Date(now - minAgo * 60000).toISOString();
  const z8 = (i, outcome, activeMs, level, popytki, extra = {}) => {
    const ref = `8.${'ABCDH'[i % 5]}|zh${i}|${level === 2 ? 'advanced' : 'base'}`;
    const p = parseTaskId(ref);
    const g = generate(p.prototype, p.seed, p.level);
    return {
      id: M.idIz(ref), task_no: 8, kind: p.prototype, task_ref: ref, place: 'trenazher', place_ref: 'r1',
      gen_hash: M.otpechatokUsloviya(g.uslovie), uslovie_tex: g.uslovie, level, outcome,
      answer_key: String(g.otvet), attempts_n: popytki.length, hint_steps: 0, hint_wrong: [],
      shown_fact: false, shown_solution: false, skipped: false, active_ms: activeMs, total_ms: activeMs + 30000,
      started_at: iso(60 * 24 * (i % 6) + i), closed_at: iso(60 * 24 * (i % 6) + i - 1),
      popytki: popytki.map((a, n) => ({ n: n + 1, answer: a === true ? ru(g.otvet) : a, ok: a === true, vid: 'answer',
        at: iso(i) })),
      ...extra,
    };
  };
  const a = uid(emails[0]);
  const rows = [
    z8(1, 'right', 3000, 2, [true]),
    z8(2, 'wrong', 95000, 1, ['7', true], { hint_steps: 2, hint_wrong: [1] }),
    z8(3, 'right', 64000, 1, [true]),
    z8(4, 'hinted', 120000, 2, [true], { hint_steps: 1 }),
    z8(5, 'wrong', 80000, 1, ['0,5']),
    z8(6, 'right', 50000, 1, [true]),
    z8(7, 'revealed', 150000, 1, [], { shown_solution: true }),
  ].map((z) => ({ ...z, user_id: a }));
  for (let i = 0; i < 4; i += 1) {
    rows.push({
      id: M.idIz(`5|${i}`), user_id: a, task_no: 5, kind: '5:P03', task_ref: `5:P03:${i + 1}`, place: 'opornye',
      place_ref: 'summa', uslovie_tex: 'В урне 4 белых и 6 чёрных шаров. Наугад достают два. Найдите вероятность того, что оба белые.',
      level: 2, outcome: i < 3 ? 'right' : 'wrong', answer_key: '0,13', attempts_n: 1, hint_steps: 0, hint_wrong: [],
      shown_fact: false, shown_solution: false, skipped: false, active_ms: 70000, total_ms: 90000,
      started_at: iso(60 * 24 * i + 30), closed_at: iso(60 * 24 * i + 29),
      popytki: [{ n: 1, answer: i < 3 ? '0,13' : '0,4', ok: i < 3, vid: 'answer', at: iso(30) }],
    });
  }
  const variantId = M.idIz('variant|demo');
  mock.zhurnalVarianty.push(
    { id: M.idIz('variant|old'), user_id: a, source: 'sobrat', set_code: 'K7M2', variant_no: 1, title: 'Вариант 1',
      started_at: iso(60 * 24 * 9), finished_at: iso(60 * 24 * 9 - 200), primary_score: 9, max_score: 32,
      test_score: 52, active_ms: 9000000, total_ms: 11000000 },
    { id: variantId, user_id: a, source: 'sobrat', set_code: 'K7M2', variant_no: 2, title: 'Вариант 2',
      started_at: iso(300), finished_at: iso(100), primary_score: 14, max_score: 32, test_score: 70,
      active_ms: 10000000, total_ms: 12000000 },
  );
  rows.push(
    { ...z8(9, 'right', 240000, 1, [true]), user_id: a, place: 'variant', place_ref: variantId },
    { ...z8(10, 'wrong', 300000, 1, ['12']), user_id: a, place: 'variant', place_ref: variantId },
  );
  rows.push({ ...z8(11, 'right', 70000, 1, [true]), id: M.idIz('b1'), user_id: uid(emails[1]) });
  rows.push({ ...z8(12, 'right', 70000, 1, [true]), id: M.idIz('c1'), user_id: uid(emails[2]) });
  mock.zhurnal.push(...rows);
  const bystraya = rows[0].id;
  const klass = mock.classes.find((c) => c.name === '11 «А»').id;

  const errors = [];
  for (const width of [375, 1280]) {
    const { context, page } = await newPage(mock, width, errors);
    await welcomeSeen(context);
    await login(page, 'zhurnal-uchitel@yandex.ru', 'zhurnal-parol-2');
    const snap = async (name) => {
      const shire = await page.evaluate(() =>
        [...document.querySelectorAll('main *')]
          .filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1)
          .slice(0, 4)
          .map((e) => `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]}:${Math.round(e.getBoundingClientRect().right)}`)
          .join(', '),
      );
      check(await noHorizontalScroll(page), `прогресс ${width} ${name}: без горизонтальной прокрутки страницы ${shire}`);
      if (SHOTS === null) return;
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: path.join(SHOTS, `progress-${name}-${width}.png`),
        fullPage: true,
        style: '.help-fab, .help-fab * { visibility: hidden !important; }',
      });
    };

    await page.goto(`${SITE}/kabinet/progress/klass/?id=${klass}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.pu-karta');
    const imena = await page.locator('.pu-karta tbody th').allTextContents();
    check(imena.join('|') === 'Аня Смирнова|Борис Ким', `класс ${width}: свои ученики (${imena.join('|')})`);
    check((await page.locator('.pu-karta thead th').allTextContents()).includes('№7'),
      `класс ${width}: №8 показан как задание 7 ЕГЭ-2027`);
    check(!(await page.content()).includes('Чужой ученик'), `класс ${width}: чужого ученика нет`);
    await snap('klass');

    await page.goto(`${SITE}/kabinet/progress/uchenik/?id=${a}&klass=${klass}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.pu-lenta');
    check((await page.locator('.pu-bystro').count()) === 1, `ученик ${width}: одна пометка «очень быстро»`);
    check((await page.locator('.pu-dinamika').count()) === 1, `ученик ${width}: динамика тестового балла`);
    if (width === 1280) {
      const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('button:has-text("Excel")').click()]);
      /* Имя файла (по-русски) проверяет test:zhurnal: headless-Chromium
         отдаёт для не-ASCII имени «download». Здесь — сам файл. */
      const file = path.join(os.tmpdir(), `progress-${Date.now()}.xlsx`);
      await dl.saveAs(file);
      const py = spawnSync('python3', ['-c',
        'import sys,openpyxl;ws=openpyxl.load_workbook(sys.argv[1]).active;print(ws.max_row, ws["F2"].value)', file],
        { encoding: 'utf8' });
      if (py.status === 0) check(/^14 /.test(py.stdout.trim()), `Excel ученика: строки на месте (${py.stdout.trim()})`);
      else check(spawnSync('unzip', ['-t', file]).status === 0, 'Excel ученика: архив .xlsx цел');
      fs.rmSync(file, { force: true });
    }
    await snap('uchenik');

    await page.goto(`${SITE}/kabinet/progress/zadacha/?u=${a}&id=${bystraya}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.pu-uslovie .katex');
    check((await page.locator('.pu-vnimanie').count()) === 0, `задача ${width}: собрана заново, не по записи`);
    check((await page.locator('.pu-bystro').count()) === 1, `задача ${width}: пометка «очень быстро»`);
    await snap('zadacha');

    await page.goto(`${SITE}/kabinet/progress/variant/?u=${a}&id=${variantId}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.pu-tablica tbody tr');
    check((await page.locator('.pu-tablica tbody tr').count()) === 2, `вариант ${width}: две задачи`);
    await snap('variant');

    /* Чужой ученик: база отказывает, экран говорит спокойно. */
    await page.goto(`${SITE}/kabinet/progress/uchenik/?id=${uid(emails[2])}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('text=Этого ученика нет среди ваших учеников.');
    check(!(await page.content()).includes('Чужой ученик'), `чужой ученик ${width}: имени и данных нет`);
    await context.close();
  }

  /* Ученик: своя статистика, без пометок для учителя. */
  for (const width of [375, 1280]) {
    const { context, page } = await newPage(mock, width, errors);
    await welcomeSeen(context);
    await login(page, emails[0], 'zhurnal-parol-1');
    await page.goto(`${SITE}/kabinet/statistika/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.pu-lenta');
    check((await page.locator('.pu-bystro').count()) === 0 && !(await page.content()).includes('очень быстро'),
      `статистика ${width}: без пометки «очень быстро»`);
    check((await page.locator('.pu-lenta a').count()) === 0, `статистика ${width}: лента без ссылок учителя`);
    check(await noHorizontalScroll(page), `статистика ${width}: без горизонтальной прокрутки`);
    if (SHOTS !== null) {
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(SHOTS, `progress-statistika-${width}.png`), fullPage: true,
        style: '.help-fab, .help-fab * { visibility: hidden !important; }' });
    }
    /* Ученик не открывает экраны учителя. */
    await page.goto(`${SITE}/kabinet/progress/uchenik/?id=${a}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('text=Эта страница — для учителя.');
    await context.close();
  }
  check(errors.length === 0, `прогресс: ошибок в консоли нет${errors.length ? `: ${errors.join(' | ')}` : ''}`);
}

/* ── Новая выдача ДЗ (кабинет v2, этап 2б; docs/kabinet-dz2.md) ──
   Учитель кладёт «В домашку» тренажёр №8 (выбранные типы) и блок опорных
   №8, открывает мастер, ставит цель «K верных подряд», выбирает класс и
   выдаёт: в «базу» уходят задачи с ответами в нормальной записи, рабочая
   копия черновика и публикация. Ученик кнопки «В домашку» не видит.
   Снимки — 375 и 1280. */
async function runDz2() {
  const NORM = /^-?[0-9]+(\.[0-9]+)?$/;
  const { prepPool } = requireSrc('lib/vychisleniya/prep/pool.ts');
  const blok = prepPool()[0];
  const mock = makeMock();
  registerInMock(mock, 'zhurnal-uchitel@yandex.ru', 'zhurnal-parol-2', 'Журнал Учитель', 'tutor');
  for (const e of ['zhurnal@yandex.ru', 'zhurnal2@yandex.ru']) {
    registerInMock(mock, e, 'zhurnal-parol-1', e.startsWith('zhurnal2') ? 'Борис Ким' : 'Аня Смирнова', 'student',
      { birth_year: 2000 });
  }
  mock.seedClass('zhurnal-uchitel@yandex.ru', ['zhurnal@yandex.ru', 'zhurnal2@yandex.ru'], '11 «А»');
  const errors = [];
  const snap = async (page, name, width) => {
    check(await noHorizontalScroll(page), `ДЗ ${width} ${name}: без горизонтальной прокрутки`);
    if (SHOTS === null) return;
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(SHOTS, `dz2-${name}-${width}.png`), fullPage: true,
      style: '.help-fab, .help-fab * { visibility: hidden !important; }' });
  };

  for (const width of [375, 1280]) {
    const { context, page } = await newPage(mock, width, errors);
    await welcomeSeen(context);
    await login(page, 'zhurnal-uchitel@yandex.ru', 'zhurnal-parol-2');

    await page.goto(`${SITE}/zadaniya/8/trenazher/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.trn-start');
    await page.locator('.trn-rezhim:has-text("Выбрать темы")').click();
    const knopka = page.locator('.trn-vybor__ryadom .dz2-knopka__glavnaya');
    await knopka.waitFor();
    await knopka.click();
    await page.waitForSelector('.trn-vybor__ryadom .dz2-knopka__glavnaya[aria-pressed="true"]');
    check((await page.locator('.trn-vybor__ryadom .dz2-knopka__korzina').textContent()).includes('(1)'),
      `ДЗ ${width}: в корзине один элемент`);
    /* Ряд «Начать» на телефоне прилипает к низу экрана: проверяется, что
       кнопка, прокрученная в видимую часть, не закрыта им и нажимается. */
    await knopka.scrollIntoViewIfNeeded();
    check(await knopka.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return top !== null && el.contains(top);
    }), `ДЗ ${width}: «В домашку» видна и не закрыта рядом «Начать»`);
    await snap(page, 'trenazher', width);

    await page.goto(`${SITE}/zadaniya/8/opornye-zadachi/${blok.slug}/`, { waitUntil: 'networkidle' });
    await page.locator('.dz2-ryad .dz2-knopka__glavnaya').click();
    await page.waitForSelector('.dz2-ryad .dz2-knopka__glavnaya[aria-pressed="true"]');

    await page.goto(`${SITE}/kabinet/dz2/vydat/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.dz2-element');
    check((await page.locator('.dz2-element').count()) === 2, `ДЗ ${width}: в мастере два элемента`);
    const tr = page.locator('.dz2-element').first();
    await tr.locator('select').nth(1).selectOption('streak');
    await tr.locator('input[type="number"]').fill('3');
    await page.locator('input[placeholder="ДЗ к пятнице"]').fill(`ДЗ на ${width}`);
    await page.locator('label:has-text("11 «А» (2)")').click();
    await page.locator('input[type="datetime-local"]').nth(1).fill('2027-05-20T18:00');
    await snap(page, 'master', width);
    await page.locator('.dz2-deystviya button:has-text("Выдать")').click();
    await page.waitForSelector('.dz2-uspeh');
    check((await page.locator('.dz2-uspeh').textContent()).includes('учеников — 2'), `ДЗ ${width}: выдано двоим`);

    const d = mock.dz2.find((x) => x.p.title === `ДЗ на ${width}`);
    check(d !== undefined && d.status === 'published', `ДЗ ${width}: опубликовано`);
    if (d !== undefined) {
      const [t1, t2] = d.p.items;
      check(t1.kind === 'trenazher' && t1.goal_kind === 'streak' && t1.goal_n === 3 && t1.tasks.length === 10,
        `ДЗ ${width}: тренажёр — цель «3 подряд», запас 10 (${t1.tasks.length})`);
      check(t1.tasks.every((t) => NORM.test(t.answer) && t.question_html.length > 0 && t.task_ref.length > 0),
        `ДЗ ${width}: задачи тренажёра с ответами`);
      check(t2.kind === 'opornye' && t2.tasks.length > 0 && t2.tasks.every((t) => NORM.test(t.answer)),
        `ДЗ ${width}: опорные с ответами (${t2.tasks.length})`);
      check(d.p.due_at === '2027-05-20T15:00:00.000Z', `ДЗ ${width}: дедлайн по Москве в UTC (${d.p.due_at})`);
      check(JSON.stringify(d.p.targets) === JSON.stringify([{ class_id: mock.classes[0].id }]), `ДЗ ${width}: класс`);
      check(d.chernovik?.korzina?.elementy?.length === 2, `ДЗ ${width}: рабочая копия сохранена`);
    }
    check((await page.locator('.dz2-element').count()) === 0, `ДЗ ${width}: корзина очищена после выдачи`);

    await page.goto(`${SITE}/kabinet/dz2/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.dz2-kartochka');
    check((await page.locator('.dz2-kartochka:has-text("Выдано")').count()) >= 1, `ДЗ ${width}: в списке «Выдано»`);
    await snap(page, 'spisok', width);
    await context.close();
  }

  /* Ученик кнопки «В домашку» не видит. */
  const { context, page } = await newPage(mock, 1280, errors);
  await welcomeSeen(context);
  await login(page, 'zhurnal@yandex.ru', 'zhurnal-parol-1');
  await page.goto(`${SITE}/zadaniya/8/trenazher/`, { waitUntil: 'networkidle' });
  await page.locator('.trn-rezhim:has-text("Выбрать темы")').click();
  await page.waitForSelector('.trn-vybor__start');
  check((await page.locator('.dz2-knopka').count()) === 0, 'ДЗ: ученик не видит «В домашку»');
  await context.close();
  check(errors.length === 0, `ДЗ: ошибок в консоли нет${errors.length ? `: ${errors.join(' | ')}` : ''}`);
}

/* ── Вход включён, кнопки в шапке нет (пробный режим) ──────────── */

async function runNoHeader() {
  const mock = makeMock();
  const errors = [];

  /* Гость: шапка как без входа. */
  {
    const { context, page } = await newPage(mock, 1440, errors);
    await page.goto(`${SITE}/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.site-head__cta .btn--primary');
    check((await page.locator(LOGIN).count()) === 0, 'главная 1440: кнопки «Войти» нет');
    check(
      (await page.locator('.site-head a[href^="/voyti/"]').count()) === 0,
      'главная: в шапке нет ссылок на страницу входа',
    );
    check(
      (await page.locator('.site-head__cta .btn--primary').getAttribute('href')) !==
        '/voyti/?vkladka=registraciya',
      'главная: «Начать бесплатно» ведёт туда же, куда без входа',
    );
    await shot(page, 'bez-knopki-shapka-1440');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.click('.burger');
    await page.waitForSelector('#site-menu');
    check(
      !(await page.locator('#site-menu').innerText()).includes('Войти'),
      'меню телефона: «Войти» нет',
    );
    await shot(page, 'bez-knopki-menyu-390');
    await page.goto(`${SITE}/zadaniya/8/trenazher/`, { waitUntil: 'networkidle' });
    check(
      (await page.locator('.topbar .auth-widget, .topbar ' + LOGIN).count()) === 0,
      'оболочка заданий: входа нет',
    );
    await context.close();
  }

  /* Прямая ссылка: страница входа работает, после входа кружок на месте. */
  {
    registerInMock(mock, 'svoy@yandex.ru', 'moy-dlinnyy-parol', 'Наталия Багаева', 'tutor');
    const { context, page } = await newPage(mock, 390, errors);
    await page.goto(`${SITE}/voyti/`, { waitUntil: 'networkidle' });
    check(
      (await page.locator('h1').innerText()) === 'Вход',
      '/voyti/ по прямой ссылке: форма входа открывается',
    );
    check(
      (await page.locator('[role="tab"]:has-text("Зарегистрироваться")').count()) === 1,
      '/voyti/: вкладка регистрации на месте',
    );
    await shot(page, 'bez-knopki-vhod-390');
    await login(page, 'svoy@yandex.ru', 'moy-dlinnyy-parol');
    check(
      (await page.locator('.kabinet__role').innerText()) === 'Кабинет учителя',
      'вход по прямой ссылке ведёт в кабинет',
    );
    await page.click('.burger');
    await page.waitForSelector('#site-menu');
    const menu = await page.locator('#site-menu').innerText();
    check(
      menu.includes('Мой кабинет') && menu.includes('Выйти'),
      'после входа в меню телефона: «Мой кабинет» и «Выйти»',
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${SITE}/`, { waitUntil: 'networkidle' });
    await page.waitForSelector(AVATAR);
    check(
      (await page.locator(AVATAR).innerText()).trim() === 'НБ',
      'после входа в шапке кружок «НБ»',
    );
    await page.click(AVATAR);
    await page.click('.auth-widget__menu button:has-text("Выйти")');
    await page.waitForSelector('.site-head__cta .btn--primary');
    await page.waitForFunction(() => !document.querySelector('.auth-widget__button'));
    check((await page.locator(LOGIN).count()) === 0, 'после выхода «Войти» в шапке снова нет');
    await context.close();
  }
  check(
    errors.length === 0,
    `ошибок в консоли нет${errors.length ? `: ${errors.join(' | ')}` : ''}`,
  );
  sdkOutsideFirstLoad();
}

/* ── Снимки для описания PR ────────────────────────────────────── */

/** Ключевые экраны на четырёх ширинах, с плотностью 2 — их смотрит человек.
    Запуск: node scripts/check-auth.mjs --gallery <папка>. Проверок здесь
    нет: только снимки. Годится любая сборка со входом. */
/**
 * Классы и ДЗ №8 на пяти ширинах. Класс — тестовыми данными, ДЗ выдаётся
 * через форму и решается учеником один раз (на первой ширине); дальше
 * те же экраны снимаются на остальных ширинах.
 */
async function runGalleryDz(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const mock = makeMock();
  registerInMock(mock, 'dz-repetitor@yandex.ru', 'dz-repetitor-1', 'Ирина Петровна', 'tutor');
  registerInMock(mock, 'dz-uchenik1@yandex.ru', 'dz-uchenik-1', 'Аня Смирнова', 'student');
  registerInMock(mock, 'dz-uchenik2@yandex.ru', 'dz-uchenik-2', 'Петя Иванов', 'student');
  mock.seedClass(
    'dz-repetitor@yandex.ru',
    ['dz-uchenik1@yandex.ru', 'dz-uchenik2@yandex.ru'],
    'Группа по средам',
  );
  const s1 = mock.users.get('dz-uchenik1@yandex.ru');
  let hw = null;
  const context = async (width) => {
    const ctx = await browser.newContext({
      viewport: { width, height: width < 500 ? 812 : 900 },
      deviceScaleFactor: 2,
      hasTouch: width < 500,
    });
    await welcomeSeen(ctx);
    await installMock(ctx, mock);
    return { ctx, page: await ctx.newPage() };
  };
  const ready = (page, sections) =>
    page.waitForFunction(
      (names) =>
        names.every(
          (n) =>
            document.querySelector(`[data-section="${n}"]`) !== null &&
            !document.querySelector(`[data-section="${n}"]`).textContent.includes('…'),
        ),
      sections,
    );

  for (const width of [1280, 375, 390, 430, 768]) {
    const snap = async (page, name, fullPage = true) => {
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: path.join(dir, `${width}-${name}.png`),
        fullPage,
        /* Высокая страница снимается по частям: закреплённая шапка иначе
           повторилась бы посреди снимка. */
        style:
          '.help-fab, .help-fab * { visibility: hidden !important; } .site-head { position: static !important; }',
      });
    };

    /* Репетитор: кабинет, класс, выдача. */
    const t = await context(width);
    await login(t.page, 'dz-repetitor@yandex.ru', 'dz-repetitor-1');
    await ready(t.page, ['classes', 'homework']);
    const klass = mock.classes.find((k) => k.name === 'Группа по средам');
    await t.page.goto(`${SITE}/kabinet/klassy/?id=${klass.id}`, { waitUntil: 'networkidle' });
    await t.page.waitForSelector('.dz-members__item');
    await snap(t.page, '02-klass');
    await t.page.goto(`${SITE}/kabinet/dz-vydat/?ot=trenazher&tipy=8.A,8.C,8.H&n=1`, {
      waitUntil: 'networkidle',
    });
    await t.page.waitForFunction(
      () => document.querySelectorAll('[data-section="preview"] .dz-preview__item').length === 3,
    );
    await t.page.fill('input[name="title"]', 'ДЗ к среде: степени и логарифмы');
    await t.page.getByRole('radio', { name: '2', exact: true }).check();
    await t.page.getByRole('radio', { name: 'Сразу после ответа' }).check();
    await t.page.fill(
      '[data-section="settings"] textarea',
      'Повтори свойства степеней перед решением.',
    );
    await snap(t.page, '03-vydat');
    if (hw === null) {
      await t.page.locator('button[type="submit"]:has-text("Выдать")').click();
      await t.page.waitForSelector('text=Задание выдано');
      hw = mock.dz.homework.find((h) => h.title === 'ДЗ к среде: степени и логарифмы');
      /* Ученик 1 решает: ошибка и верно в первой, решение во второй. */
      const st = await context(width);
      await login(st.page, 'dz-uchenik1@yandex.ru', 'dz-uchenik-1');
      await st.page.goto(`${SITE}/kabinet/domashka/?id=${hw.id}`, { waitUntil: 'networkidle' });
      await st.page.waitForSelector('.dz-task');
      const hwTasks = mock.dz.tasks
        .filter((x) => x.homework_id === hw.id)
        .sort((a, b) => a.position - b.position);
      const key = mock.dz.keys.find((k) => k.task_id === hwTasks[0].id).answer;
      await st.page.fill(
        '.dz-answer .otvet-input__field',
        String(Number(key) + 1).replace('.', ','),
      );
      await st.page.locator('.dz-answer button:has-text("Проверить")').click();
      await st.page.waitForSelector('.dz-verdict--wrong');
      await st.page.fill('.dz-answer .otvet-input__field', key.replace('.', ','));
      await st.page.locator('.dz-answer button:has-text("Проверить")').click();
      await st.page.waitForSelector('.dz-verdict--right');
      await st.page.locator('.dz-strip__btn').nth(1).click();
      await st.page.locator('.dz-answer button:has-text("Показать решение")').click();
      await st.page.locator('[role="dialog"] button:has-text("Показать решение")').click();
      await st.page.waitForSelector('.z8-razbor');
      await st.ctx.close();
    }
    await t.page.goto(`${SITE}/kabinet/`, { waitUntil: 'networkidle' });
    await ready(t.page, ['classes', 'homework']);
    await snap(t.page, '01-kabinet-repetitora');
    await t.page.goto(`${SITE}/kabinet/domashka/?id=${hw.id}`, { waitUntil: 'networkidle' });
    await t.page.waitForSelector('.dz-table');
    await t.page.locator(`tr[data-student="${s1.id}"] .dz-cell`).first().click();
    await t.page.waitForSelector('[data-section="cell"]');
    await snap(t.page, '05-rezultaty');
    if (width === 1280) {
      for (const list of ['uchenik', 'uchitel']) {
        await t.page.goto(`${SITE}/kabinet/domashka/pechat/?id=${hw.id}&list=${list}`, {
          waitUntil: 'networkidle',
        });
        await t.page.waitForTimeout(1500);
        await snap(t.page, `09-pechat-${list}`, false);
      }
    }
    await t.ctx.close();

    /* Ученик: кабинет, плашка в №8, решение. */
    const st = await context(width);
    await login(st.page, 'dz-uchenik1@yandex.ru', 'dz-uchenik-1');
    await st.page.waitForSelector('.karta-dz');
    await snap(st.page, '06-kabinet-uchenika');
    await st.page.goto(`${SITE}/zadaniya/8/`, { waitUntil: 'networkidle' });
    await st.page.waitForSelector('[data-block="dz-plashka"]');
    await snap(st.page, '07-plashka-8', false);
    await st.page.goto(`${SITE}/kabinet/domashka/?id=${hw.id}`, { waitUntil: 'networkidle' });
    await st.page.waitForSelector('.dz-task');
    await st.page.locator('.dz-strip__btn').first().click();
    await st.page.waitForSelector('.z8-razbor');
    await snap(st.page, '08-reshenie-dz');
    await st.ctx.close();
  }
  console.log(`Снимки: ${dir}`);
}

/**
 * Кабинет ученика после тренировки №8: решено, ошибка, закладка, история.
 * Тренировка проходит один раз на компьютере; на остальных ширинах тот же
 * ученик входит заново, и прогресс приходит из аккаунта.
 */
async function runGalleryZ8(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const mock = makeMock();
  registerInMock(mock, 'dva@yandex.ru', 'dva-ustroystva-1', 'Анна Смирнова', 'student');
  const me = mock.users.get('dva@yandex.ru');
  const CARD = '.trn-zadacha[data-task]';
  const answerOf = (id) => {
    const p = parseTaskId(id);
    return generate(p.prototype, p.seed, p.level).otvet;
  };
  let trained = false;
  for (const width of [1280, 375, 390, 430, 768]) {
    const context = await browser.newContext({
      viewport: { width, height: width < 500 ? 812 : 900 },
      deviceScaleFactor: 2,
      hasTouch: width < 500,
    });
    await welcomeSeen(context);
    await installMock(context, mock);
    const page = await context.newPage();
    await login(page, 'dva@yandex.ru', 'dva-ustroystva-1');
    if (!trained) {
      await page.goto(`${SITE}/zadaniya/8/trenazher/`, { waitUntil: 'networkidle' });
      /* Стартовый экран тренажёра: «Выбрать темы» → 5 задач → «Начать». */
      await page.waitForSelector('.trn-start');
      await page.locator('.trn-rezhim:has-text("Выбрать темы")').click();
      await page.locator('.trn-seg button').filter({ hasText: /^5$/ }).first().click();
      await page.locator('.trn-vybor__start').click();
      for (let i = 0; i < 5; i += 1) {
        await page.waitForSelector(CARD);
        const id = await page.locator(CARD).getAttribute('data-task');
        const right = answerOf(id);
        await page.fill('.trn-ekran .otvet-input__field', ru(i === 1 ? right + 1 : right));
        await page.locator('.trn-otvetnaya button:has-text("Проверить")').click();
        if (i === 1) {
          await page.waitForSelector('.trn-verdikt--net');
          await page.locator('.trn-knopki button:has-text("Решение")').first().click();
        }
        if (i === 2) await page.locator('.trn-zadacha .zakladka').click();
        const next = page.locator('.trn-knopki button:has-text("Дальше")');
        if ((await next.count()) > 0) await next.click();
        else await page.locator('.trn-knopki button:has-text("К итогам")').click();
      }
      await page.waitForSelector('.trn-itogi');
      /* Записи — в аккаунт: после паузы синхронизации в моке есть журнал. */
      const until = Date.now() + 15000;
      while (
        Date.now() < until &&
        !mock.storage.some((r) => r.user_id === me.id && r.key === 'budetege:istoriya:v1')
      ) {
        await new Promise((done) => setTimeout(done, 250));
      }
      trained = true;
      await page.goto(`${SITE}/kabinet/`, { waitUntil: 'networkidle' });
    }
    await page.waitForFunction(
      () =>
        /Решено\s*5\s*из\s*260/.test(
          document.querySelector('[data-section="progress"]')?.textContent ?? '',
        ),
      null,
      { timeout: 15000 },
    );
    await page.evaluate(() => document.fonts.ready);
    /* «?» закреплена в углу экрана: на склеенном снимке всей страницы
       она висела бы посреди блока. */
    await page.screenshot({
      path: path.join(dir, `${width}-08-kabinet-progress.png`),
      fullPage: true,
      style: '.help-fab, .help-fab * { visibility: hidden !important; }',
    });
    await context.close();
  }
  console.log(`Снимки: ${dir}`);
}

async function runGallery(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const mock = makeMock();
  registerInMock(mock, 'svoy@yandex.ru', 'moy-dlinnyy-parol', 'Наталия Багаева', 'tutor');
  registerInMock(mock, 'uchenik@yandex.ru', 'uchenik-parol-1', 'Тестовый ученик 1', 'student');
  registerInMock(mock, 'vtoroy@yandex.ru', 'vtoroy-parol-123', 'Тестовый ученик 2', 'student');
  mock.seedClass('svoy@yandex.ru', ['uchenik@yandex.ru', 'vtoroy@yandex.ru']);

  for (const width of [375, 390, 768, 1280]) {
    const context = await browser.newContext({
      viewport: { width, height: width < 500 ? 812 : 900 },
      deviceScaleFactor: 2,
      hasTouch: width < 500,
    });
    await installMock(context, mock);
    const page = await context.newPage();
    const snap = async (name, fullPage = true) => {
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(dir, `${width}-${name}.png`), fullPage });
    };

    await page.goto(`${SITE}/voyti/`, { waitUntil: 'networkidle' });
    await snap('01-vhod');
    await page.click('[role="tab"]:has-text("Зарегистрироваться")');
    await page.fill('input[name="name"]', 'Тестовый ученик');
    await page.fill('input[name="email"]', 'uchenik@yandex.ru');
    await page.fill('input[name="password"]', 'dlinnyy-parol-uchenika');
    await page.click('.role-card[data-role="student"]');
    await page.fill('input[name="birth-year"]', String(new Date().getFullYear() - 16));
    await page.fill('input[name="parent-email"]', 'mama@yandex.ru');
    await tickConsents(page);
    await snap('02-registraciya');

    /* Ученик: в браузере есть прогресс №8 — вопрос о переносе. */
    await page.evaluate(
      (key) => localStorage.setItem(key, JSON.stringify({ kinds: { '8.A': { done: 3 } } })),
      PROGRESS_8,
    );
    await login(page, 'uchenik@yandex.ru', 'uchenik-parol-1');
    await page.waitForSelector('[role="dialog"]');
    await snap('03-perenos-progressa', false);
    await page.click('[role="dialog"] button:has-text("Нет")');
    await page.waitForSelector('[role="dialog"]', { state: 'detached' });
    await page.waitForSelector('.klass-list');
    await snap('04-kabinet-uchenika');
    await openProfile(page);
    await snap('05-profil');
    await page.click('[data-section="account"] button:has-text("Выйти")');
    await page.waitForURL(`${SITE}/`);

    /* Репетитор: свой класс с учениками. */
    await login(page, 'svoy@yandex.ru', 'moy-dlinnyy-parol');
    await page.waitForSelector('.dz-klassy__item');
    await page.waitForSelector('[role="dialog"]');
    await page.click('[role="dialog"] button:has-text("Нет")');
    await page.waitForSelector('[role="dialog"]', { state: 'detached' });
    await snap('06-kabinet-repetitora');
    await context.close();
  }
  console.log(`Снимки: ${dir}`);
}

try {
  if (DISABLED) await runDisabled();
  else if (GALLERY !== null) await runGallery(GALLERY);
  else if (GALLERY_Z8 !== null) await runGalleryZ8(GALLERY_Z8);
  else if (GALLERY_DZ !== null) await runGalleryDz(GALLERY_DZ);
  else if (NO_HEADER) await runNoHeader();
  else if (process.argv.includes('--zhurnal')) await runZhurnal();
  else if (process.argv.includes('--progress')) await runProgress();
  else if (process.argv.includes('--dz2')) await runDz2();
  else if (SHOTS_KARTA !== null || KARTA_NAZAD) {
    const K = await import('./lib/karta-nazad.mjs');
    const deps = { browser, SITE, mock: makeMock(), installMock, registerInMock, login, check };
    if (SHOTS_KARTA !== null) await K.snimkiKarty(deps, SHOTS_KARTA.dir, SHOTS_KARTA.pristavka);
    else await K.proverkiKartaNazad(deps, SHOTS);
  } else await runEnabled();
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
