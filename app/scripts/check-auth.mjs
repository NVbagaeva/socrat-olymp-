#!/usr/bin/env node
/* scripts/check-auth.mjs — вход, регистрация и кабинет в браузере.

   Запуск после pnpm build:
     node scripts/check-auth.mjs [папка-для-снимков]      сборка со входом
     node scripts/check-auth.mjs --no-header               вход есть, кнопки в шапке нет
     node scripts/check-auth.mjs --disabled                сборка без входа
     node scripts/check-auth.mjs --gallery <папка>         только снимки ключевых экранов

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
     • шапка на 1440: «Войти» таблеткой со словом, «Начать бесплатно»
       ведёт в банк заданий (регистрация пока по приглашению); на 390,
       375 и 320 «Войти» — кружок в шапке не меньше 40 px,
       горизонтальной прокрутки нет, в меню телефона тоже «Войти»;
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

const OUT = path.join(APP, 'out');
const PORT = 4181;
const SUPABASE = 'http://127.0.0.1:54321';
const DISABLED = process.argv.includes('--disabled');
const NO_HEADER = process.argv.includes('--no-header');
/* Снимки и запись сценария ДЗ из трёх источников (ученик — WebKit, iPhone 13). */
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
const SHOTS =
  GALLERY !== null || GALLERY_Z8 !== null || GALLERY_DZ !== null
    ? null
    : (process.argv.slice(2).find((a) => !a.startsWith('--')) ?? null);

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
/* SITE_DEV — адрес запущенного next dev (отладка сценария без пересборки). */
const SITE = process.env.SITE_DEV ?? `http://127.0.0.1:${PORT}`;

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
  /* ДЗ из трёх источников (scenarijDz). */
  'dzi-repetitor@yandex.ru',
  'dzi-uchenik1@yandex.ru',
  'dzi-uchenik2@yandex.ru',
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
    /* Регистрация пока по приглашению: «Начать бесплатно» ведёт туда
       же, куда без входа, — в банк заданий, а не в закрытую форму. */
    check(
      (await page.locator('.site-head__cta .btn--primary').getAttribute('href')) === '/zadaniya/',
      'главная: «Начать бесплатно» ведёт в банк заданий',
    );
    await shot(page, 'shapka-do-vhoda-1440');
    await context.close();
  }
  /* Телефон: «Войти» — кружок со значком прямо в шапке, имя ссылки
     «Войти» для скринридера; прокрутки вбок нет и на 320. */
  for (const width of [320, 375]) {
    const { context, page } = await newPage(mock, width, errors);
    await page.goto(`${SITE}/`, { waitUntil: 'networkidle' });
    check(await noHorizontalScroll(page), `главная ${width}: горизонтальной прокрутки нет`);
    check(
      await page.getByRole('link', { name: 'Войти', exact: true }).first().isVisible(),
      `главная ${width}: кружок «Войти» виден в шапке`,
    );
    await context.close();
  }
  {
    const { context, page } = await newPage(mock, 390, errors);
    await page.goto(`${SITE}/`, { waitUntil: 'networkidle' });
    check(await noHorizontalScroll(page), 'главная 390: горизонтальной прокрутки нет');
    const login = page.locator(LOGIN);
    const box = await login.boundingBox();
    check(
      box !== null && box.width >= 40 && box.height >= 40,
      'главная 390: кружок «Войти» не меньше 40 px',
    );
    check(
      (await login.getAttribute('href')) === '/voyti/',
      'главная 390: кружок «Войти» ведёт на /voyti/',
    );
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
      'репетитору год рождения не нужен',
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
      (await page.locator('.kabinet__role').innerText()) === 'Кабинет репетитора',
      'кабинет: «Кабинет репетитора»',
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
    check((await page.locator('[data-field="role"]').innerText()) === 'Репетитор', 'профиль: роль');
    const savedText = await page.locator('[data-section="saved"]').innerText();
    check(
      savedText.includes('просмотрено'),
      'профиль: факт «приветствие просмотрено» перенесён из браузера',
    );
    check(savedText.includes('Тур для репетитора — пройден'), 'профиль: пройденный тур перенесён');
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
    /* Главная ученика — «Карта ЕГЭ»: без прогресса — 0 из 20 и без прогноза;
       карточки ДЗ нет, пока ДЗ не выдано; плашки «Войдите…» у вошедшего нет. */
    await page.waitForSelector('[data-section="karta"] .karta-holst[data-gotov]');
    const kartaItog = (await page.locator('.karta-shapka__itog').innerText()).replace(/\s+/g, ' ');
    check(
      kartaItog.includes('Освоено 0 из 20') && kartaItog.includes('Решите ещё немного'),
      `ученик: карта — «Освоено 0 из 20», прогноза нет (${kartaItog})`,
    );
    check((await page.locator('.karta-gost').count()) === 0, 'ученик: плашки «Войдите…» нет');
    check(
      (await page.locator('[data-section="karta"] .karta-ostrov').count()) === 20,
      'ученик: на карте 20 областей',
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
    await page.waitForSelector('[data-section="karta"] .karta-holst[data-gotov]');
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
      klass.includes('Тестовый класс') && klass.includes('Репетитор: Наталия В.'),
      'ученик в классе: название класса и имя репетитора (в профиле)',
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
        () => document.querySelector('.karta-ostrov--v-processe .karta-ostrov__kontur[data-cel="oblast:8"]') !== null,
        null,
        { timeout: 10000 },
      )
      .catch(() => {});
    check(
      (await phone.page.locator('.karta-ostrov--v-processe .karta-ostrov__kontur[data-cel="oblast:8"]').count()) === 1,
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

    /* Ученику конструктор недоступен. */
    await st2.page.goto(`${SITE}/kabinet/dz-vydat/`, { waitUntil: 'networkidle' });
    await st2.page.waitForSelector('text=Эта страница — для репетитора.');
    check(true, 'ДЗ: ученику конструктор — «Эта страница — для репетитора»');

    /* Телефон: экраны репетитора без горизонтальной прокрутки. */
    await tutor.page.setViewportSize({ width: 390, height: 844 });
    for (const [what, url] of [
      ['кабинет', `${SITE}/kabinet/`],
      ['класс', classUrl],
      ['выдача', `${SITE}/kabinet/dz-vydat/`],
    ]) {
      await tutor.page.goto(url, { waitUntil: 'networkidle' });
      await tutor.page.waitForTimeout(800);
      check(
        await noHorizontalScroll(tutor.page),
        `ДЗ: репетитор, ${what} 390 — горизонтальной прокрутки нет`,
      );
    }
    void tutorUser;
    void s1;
    await st1.context.close();
    await st2.context.close();
    await tutor.context.close();
  }

  /* 7г. ДЗ из трёх источников (docs/kabinet-dz-istochniki.md). */
  await scenarijDz(mock, errors);

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
      (await page.locator('.kabinet__role').innerText()) === 'Кабинет репетитора',
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
/* ── ДЗ из трёх источников: сквозной сценарий ──────────────────────
   Репетитор собирает ДЗ из двух наборов карточек №7, блока опорных
   №7 и пяти задач тренажёра двух разделов (№8 — прежней ссылкой из
   раздела, №7 — в конструкторе), выдаёт классу; ученик (телефон;
   с --dz-istochniki — WebKit, эмуляция iPhone 13) делает часть,
   уходит, возвращается, досдаёт; репетитор смотрит таблицу и выдаёт
   работу над ошибками. dir — снимки 375/390/768/1280 и запись. */
async function scenarijDz(mock, errors, { dir = null, uchenikWebkit = false } = {}) {
  registerInMock(mock, 'dzi-repetitor@yandex.ru', 'dzi-repetitor-1', 'Ольга Николаевна', 'tutor');
  registerInMock(mock, 'dzi-uchenik1@yandex.ru', 'dzi-uchenik-1', 'Маша Орлова', 'student');
  registerInMock(mock, 'dzi-uchenik2@yandex.ru', 'dzi-uchenik-2', 'Коля Белов', 'student');
  mock.seedClass(
    'dzi-repetitor@yandex.ru',
    ['dzi-uchenik1@yandex.ru', 'dzi-uchenik2@yandex.ru'],
    'Тестовый класс',
  );
  const s1 = mock.users.get('dzi-uchenik1@yandex.ru');
  const s2 = mock.users.get('dzi-uchenik2@yandex.ru');
  const dz = mock.dz;
  const text = async (page, sel) =>
    (await page.locator(sel).first().innerText()).replace(/\s+/g, ' ');
  const snap = async (page, name) => {
    if (dir === null) return;
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: false });
  };
  if (dir !== null) fs.mkdirSync(dir, { recursive: true });
  /* Черновик дошёл до базы: n пунктов. */
  const vChernovike = async (n) => {
    const tutorId = mock.users.get('dzi-repetitor@yandex.ru').id;
    for (let i = 0; i < 100; i += 1) {
      if (dz.drafts.find((d) => d.user_id === tutorId)?.body?.punkty?.length === n) return true;
      await new Promise((r) => setTimeout(r, 100));
    }
    return false;
  };

  /* Репетитор, компьютер. */
  const tutorCtx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: dir === null ? 1 : 2,
    ...(dir === null ? {} : { recordVideo: { dir: path.join(dir, 'zapis'), size: { width: 1280, height: 900 } } }),
  });
  await welcomeSeen(tutorCtx);
  await installMock(tutorCtx, mock);
  const tp = await tutorCtx.newPage();
  watchConsole(tp, errors);
  await login(tp, 'dzi-repetitor@yandex.ru', 'dzi-repetitor-1');

  /* 1. Два набора карточек №7 — кнопкой со страницы «Карточки». */
  await tp.goto(`${SITE}/zadaniya/7/kartochki/`, { waitUntil: 'networkidle' });
  await tp.locator('[data-block="dz-nabory"] > summary').click();
  const nabory = tp.locator('[data-block="dz-nabory"] [data-block="dz-v-chernovik"]');
  await nabory.nth(0).click();
  await tp.waitForSelector('[data-block="dz-chernovik-plashka"]');
  await nabory.nth(1).click();
  await tp.waitForFunction(() =>
    document.querySelector('[data-block="dz-chernovik-plashka"]')?.textContent?.includes(': 2'),
  );
  check(await vChernovike(2), 'ДЗ-3: два набора карточек №7 — в черновике в базе, плашка «В черновике ДЗ: 2»');
  const fab = await tp.evaluate(() => {
    const a = document.querySelector('[data-block="dz-chernovik-plashka"]')?.getBoundingClientRect();
    const b = document.querySelector('.help-fab')?.getBoundingClientRect();
    if (!a || !b) return true;
    return a.right <= b.left || a.bottom <= b.top || a.left >= b.right || a.top >= b.bottom;
  });
  check(fab, 'ДЗ-3: плашка черновика не перекрывает кнопку «?»');
  await snap(tp, '1280-01-kartochki-plashka');

  /* 2. Блок опорных №7 целиком — кнопкой со страницы блока. */
  await tp.goto(`${SITE}/zadaniya/7/opornye-zadachi/stepeni/`, { waitUntil: 'networkidle' });
  await tp.locator('[data-block="dz-v-chernovik"]').first().click();
  await tp
    .waitForFunction(() =>
      document.querySelector('[data-block="dz-chernovik-plashka"]')?.textContent?.includes(': 3'),
    )
    .catch(async (e) => {
      const kn = await tp.locator('[data-block="dz-v-chernovik"]').evaluateAll((els) =>
        els.map((x) => `${x.getAttribute('aria-label')}|${x.getAttribute('aria-pressed')}`),
      );
      console.log('ОТЛАДКА', kn, await tp.locator('[data-block="dz-chernovik-plashka"]').allInnerTexts());
      throw e;
    });
  check(await vChernovike(3), 'ДЗ-3: блок опорных №7 — в черновике (3 пункта)');

  /* 3. Прежняя ссылка «Выдать ДЗ» из №8: типы 8.A и 8.B — в черновик. */
  await tp.goto(`${SITE}/kabinet/dz-vydat/?ot=trenazher&tipy=8.A,8.B&n=1`, { waitUntil: 'networkidle' });
  await tp.waitForSelector('[data-block="dz-sostav"] .dzk-punkt');
  await tp.waitForFunction(() => document.querySelectorAll('.dzk-punkt').length === 4);
  check(
    new URL(tp.url()).search === '',
    'ДЗ-3: прежняя ссылка из №8 работает — типы в составе, адрес без параметров',
  );

  /* 4. В конструкторе: №7 → Тренажёр → первый тип, 3 задачи. */
  await tp.locator('.dzk-chip', { hasText: '№7' }).click();
  await tp.getByRole('tab', { name: 'Тренажёр' }).click();
  const tip = tp.locator('.dzk-tip').first();
  await tip.waitFor();
  await tip.getByRole('button', { name: 'Больше' }).click();
  await tip.locator('.dzk-dobavit').click();
  await tp.waitForFunction(() => document.querySelectorAll('.dzk-punkt').length === 5);
  /* Пример задачи — тем же сборщиком, что при выдаче. */
  await tip.getByRole('button', { name: 'Пример задачи' }).click();
  await tp.waitForSelector('[data-block="dz-primer"] .dzk-primer__uslovie');
  check(true, 'ДЗ-3: пример задачи тренажёра №7 собирается в конструкторе');
  const schet = await text(tp, '[data-block="dz-schet"]');
  check(
    /15 задач/.test(schet) && /2 набора карточек/.test(schet) && /≈ \d+ минут/.test(schet),
    `ДЗ-3: счётчик «… задач · 2 набора карточек · ≈ N минут» (${schet})`,
  );
  /* «Каждому свои» у правила №7, порядок: последний пункт — на шаг выше. */
  await tp.locator('.dzk-punkt').nth(4).locator('.dzk-galka input').check();
  await tp.locator('.dzk-punkt').nth(4).getByRole('button', { name: /^Выше/ }).click();
  await tp.waitForFunction(
    () => document.querySelectorAll('.dzk-punkt')[3]?.getAttribute('data-punkt') === 'trenazher',
  );
  check(
    !(await tp.getByRole('checkbox', { name: 'Показывать «Запомни»' }).isChecked()) &&
      !(await tp.getByRole('checkbox', { name: 'Показывать разобранный пример' }).isChecked()),
    'ДЗ-3: «Запомни» и разобранный пример по умолчанию выключены',
  );
  check(
    /^ДЗ от \d{2}\.\d{2}$/.test(await tp.inputValue('input[name="title"]')),
    'ДЗ-3: название по умолчанию — «ДЗ от дд.мм»',
  );
  await tp.fill('input[name="title"]', 'ДЗ: уравнения и степени');
  await tp.getByRole('radio', { name: '2', exact: true }).check();
  await tp.getByRole('radio', { name: 'Сразу после ответа' }).check();
  await tp.waitForTimeout(600);
  const draft = dz.drafts.find((d) => d.user_id === mock.users.get('dzi-repetitor@yandex.ru').id);
  check(draft !== undefined && draft.body.punkty.length === 5, 'ДЗ-3: черновик лежит в базе — 5 пунктов');
  /* Шаблон. */
  await tp.locator('[data-section="templates"] > summary').click();
  await tp.locator('[data-section="templates"] input').fill('Уравнения и степени');
  await tp.locator('[data-section="templates"] button:has-text("Сохранить как шаблон")').click();
  await tp.waitForSelector('[data-section="templates"] li');
  check(dz.templates.length === 1, 'ДЗ-3: шаблон сохранён');
  await snap(tp, '1280-02-konstruktor');
  check(await noHorizontalScroll(tp), 'ДЗ-3: конструктор 1280 — без горизонтальной прокрутки');

  await tp.locator('[data-action="vydat"]').click();
  await tp.waitForSelector('[data-page="vydano"]', { timeout: 60000 });
  const hw = dz.homework.find((h) => h.title === 'ДЗ: уравнения и степени');
  const hwParts = dz.parts.filter((p) => p.homework_id === hw.id).sort((a, b) => a.position - b.position);
  const units = dz.tasks.filter((t) => t.homework_id === hw.id);
  check(
    hw !== undefined &&
      hw.sections.join(',') === '7,8' &&
      hw.attempts_limit === 2 &&
      hw.solutions_when === 'instant' &&
      !hw.show_memo &&
      !hw.show_example,
    'ДЗ-3: в базе — разделы 7 и 8, 2 попытки, решения сразу, «Запомни» и пример выключены',
  );
  check(
    hwParts.map((p) => p.source).join(',') === 'kartochki,kartochki,opornye,trenazher,trenazher',
    `ДЗ-3: пункты по порядку (${hwParts.map((p) => p.source).join(',')})`,
  );
  const trSvoi = hwParts.find((p) => p.per_student);
  check(
    trSvoi !== undefined &&
      units.filter((u) => u.part_id === trSvoi.id && u.student_id === s1.id).length === 3 &&
      units.filter((u) => u.part_id === trSvoi.id && u.student_id === s2.id).length === 3,
    'ДЗ-3: «каждому свои» — по 3 задачи каждому ученику',
  );
  check(
    units.some((u) => u.answer_kind === 'self') && units.every((u) => !JSON.stringify(u.view).includes('"answer"')),
    'ДЗ-3: у карточек-самооценки нет ключа, ответов в том, что видит ученик, нет',
  );
  check(dz.drafts.length === 0 || dz.drafts.every((d) => d.body.punkty.length === 0), 'ДЗ-3: после выдачи черновик очищен');

  /* Ученик: телефон (с --dz-istochniki — WebKit, iPhone 13). */
  const engine = uchenikWebkit ? (await import('playwright')).webkit : null;
  const wk = engine === null ? null : await engine.launch();
  const { devices } = await import('playwright');
  const stCtx = await (wk ?? browser).newContext({
    ...(wk === null ? { viewport: { width: 390, height: 844 }, hasTouch: true } : devices['iPhone 13']),
    ...(dir === null ? {} : { recordVideo: { dir: path.join(dir, 'zapis'), size: { width: 390, height: 844 } } }),
  });
  await welcomeSeen(stCtx);
  await installMock(stCtx, mock);
  const sp = await stCtx.newPage();
  watchConsole(sp, errors);
  await login(sp, 'dzi-uchenik1@yandex.ru', 'dzi-uchenik-1');
  await sp.goto(`${SITE}/zadaniya/7/`, { waitUntil: 'networkidle' });
  await sp.waitForSelector('[data-block="dz-plashka"]');
  check(
    /Домашнее задание до .* · сделано 0 из \d+/.test(await text(sp, '[data-block="dz-plashka"]')),
    'ДЗ-3: в разделе №7 у ученика — «Домашнее задание до … · сделано 0 из N»',
  );
  await snap(sp, '390-03-plashka-uchenika');
  await sp.locator('[data-block="dz-plashka"] a').click();
  await sp.waitForSelector('.rdz-punkty .rdz-punkt');
  check((await sp.locator('.rdz-punkt').count()) === 5, 'ДЗ-3: у ученика 5 пунктов с метками источника');
  if (!(await noHorizontalScroll(sp))) {
    console.log(
      'ШИРЕ ЭКРАНА',
      await sp.evaluate(() =>
        [...document.querySelectorAll('body *')]
          .filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1)
          .slice(0, 8)
          .map((e) => `${e.tagName}.${e.className} ${Math.round(e.getBoundingClientRect().right)}`),
      ),
    );
  }
  check(await noHorizontalScroll(sp), 'ДЗ-3: решение ДЗ на телефоне — без горизонтальной прокрутки');
  await snap(sp, '390-04-dz-uchenika');

  /* Набор карточек 1: пройти все. */
  const keyOf = (id) => dz.keys.find((k) => k.task_id === id)?.answer;
  const naborKartochek = async () => {
    for (let guard = 0; guard < 40; guard += 1) {
      const card = sp.locator('[data-block="kartochki"]');
      if ((await card.count()) === 0) return;
      const id = await card.getAttribute('data-task');
      const task = dz.tasks.find((t) => t.id === id);
      if (task.answer_kind === 'self') {
        await sp.getByRole('button', { name: 'Показать ответ', exact: true }).click();
        await sp.getByRole('button', { name: /Знаю|Повторить/ }).first().click();
      } else if (task.answer_kind === 'verno') {
        await sp.locator('.kart-card__vybor button', { hasText: keyOf(id) === 'da' ? 'Верно' : 'Неверно' }).click();
        await sp.getByRole('button', { name: /Дальше/ }).first().click();
      } else {
        await sp.locator('.kart-card__forma input').fill(keyOf(id).replace('.', ','));
        await sp.locator('.kart-card__forma button[type="submit"]').click();
        await sp.getByRole('button', { name: /Дальше/ }).first().click();
      }
      await sp.waitForTimeout(150);
    }
  };
  await naborKartochek();
  await sp.waitForSelector('[data-block="kartochki-gotovo"]');
  check(true, 'ДЗ-3: набор карточек пройден — «Все карточки пройдены»');
  const marks = dz.answers.filter((a) => a.user_id === s1.id);
  check(marks.some((a) => a.state === 'known' || a.state === 'repeat'), 'ДЗ-3: отметки «Знаю / Повторить» записаны в базу');
  await snap(sp, '390-05-kartochki-gotovo');

  /* Уйти и вернуться — сделанное на месте. */
  await sp.goto(`${SITE}/kabinet/`, { waitUntil: 'networkidle' });
  await sp.goto(`${SITE}/kabinet/domashka/?id=${hw.id}`, { waitUntil: 'networkidle' });
  await sp.waitForSelector('.rdz-punkt');
  check(
    (await sp.locator('.rdz-punkt').first().getAttribute('class')).includes('is-gotovo'),
    'ДЗ-3: вернулся — первый пункт «Готово», открыт следующий незаконченный',
  );

  /* Задача тренажёра: дробь, неверно, верно. */
  await sp.locator('.rdz-punkt[data-istochnik="trenazher"]').first().click();
  await sp.waitForSelector('.rdz-zadacha .trn-input input, .rdz-zadacha .otvet-input__field');
  const taskId = await sp.locator('.rdz-zadacha').first().getAttribute('data-task');
  const key = keyOf(taskId);
  const field = sp.locator('.rdz-zadacha .otvet-input__field').first();
  await field.fill(String(Number(key) + 1).replace('.', ','));
  await sp.locator('.rdz-zadacha .trn-otvetnaya button:has-text("Проверить")').click();
  await sp.waitForSelector('.trn-verdikt--net');
  check((await sp.locator('[data-left]').first().getAttribute('data-left')) === '1', 'ДЗ-3: неверно — осталась 1 попытка');
  await field.fill(key.replace('.', ','));
  await sp.locator('.rdz-zadacha .trn-otvetnaya button:has-text("Проверить")').click();
  await sp.waitForSelector('.trn-verdikt--da');
  check(true, 'ДЗ-3: тот же экран задачи, что в тренажёре — «Верно!»');
  await snap(sp, '390-06-zadacha');

  /* Сдать. */
  await sp.locator('[data-action="sdat"]').click();
  await sp.locator('[role="dialog"] button:has-text("Сдать")').click();
  await sp.waitForSelector('[data-state="submitted"]');
  check(true, 'ДЗ-3: ученик сдал — «Сдано … · Верно …»');
  await snap(sp, '390-07-sdano');
  await stCtx.close();
  if (wk !== null) await wk.close();

  /* Репетитор: таблица «ученик × пункт», клетка, работа над ошибками. */
  await tp.goto(`${SITE}/kabinet/domashka/?id=${hw.id}`, { waitUntil: 'networkidle' });
  await tp.waitForSelector('.rez-tablica');
  check(
    (await tp.locator('.rez-gruppa').allInnerTexts()).join(',') === 'Карточки,Опорные задачи,Тренажёр',
    'ДЗ-3: в таблице столбцы сгруппированы по источникам',
  );
  const row1 = tp.locator(`tr[data-student="${s1.id}"]`);
  check(
    (await row1.locator('.rez-kletka').first().getAttribute('data-ton')) !== 'nichego',
    'ДЗ-3: у ученика 1 набор карточек — сделан',
  );
  await row1.locator('.rez-kletka').first().click();
  await tp.waitForSelector('[data-section="cell"]');
  check(/Знаю|Повторить|верно/.test(await text(tp, '[data-section="cell"]')), 'ДЗ-3: клик по клетке — «Знаю / Повторить» и ответы');
  await snap(tp, '1280-08-rezultaty');
  await tp.locator('[data-action="oshibki"]').click();
  await tp.waitForSelector('[data-page="dz-oshibki"]', { timeout: 60000 });
  await tp.waitForSelector('[data-section="mistakes"]', { timeout: 60000 });
  await snap(tp, '1280-09-oshibki');
  await tp.locator('.dzk-vydat').click();
  await tp.waitForSelector('[data-page="vydano"]', { timeout: 60000 });
  const fix = dz.homework.find((h) => h.parent_id === hw.id);
  const fixUnits = fix === undefined ? [] : dz.tasks.filter((t) => t.homework_id === fix.id);
  check(
    fix !== undefined && fix.origin === 'oshibki' && fixUnits.length > 0 && fixUnits.every((u) => u.student_id !== null),
    'ДЗ-3: работа над ошибками выдана — каждому его задачи',
  );

  /* Ширины: конструктор и результаты без горизонтальной прокрутки. */
  for (const width of [375, 390, 768, 1280]) {
    await tp.setViewportSize({ width, height: width < 500 ? 812 : 900 });
    for (const [what, url] of [
      ['konstruktor', `${SITE}/kabinet/dz-vydat/`],
      ['rezultaty', `${SITE}/kabinet/domashka/?id=${hw.id}`],
    ]) {
      await tp.goto(url, { waitUntil: 'networkidle' });
      await tp.waitForTimeout(500);
      check(await noHorizontalScroll(tp), `ДЗ-3: ${what} ${width} — без горизонтальной прокрутки`);
      await snap(tp, `${width}-${what}`);
    }
  }
  await tutorCtx.close();
}

/* Только сценарий ДЗ — для отладки (--tolko-dz). */
async function runTolkoDz() {
  const mock = makeMock();
  const errors = [];
  await scenarijDz(mock, errors);
  for (const e of errors) check(false, `консоль: ${e}`);
}

/* Снимки и запись сценария ДЗ из трёх источников: ученик — WebKit (iPhone 13). */
async function runGalleryDz(dir) {
  const mock = makeMock();
  const errors = [];
  await scenarijDz(mock, errors, { dir, uchenikWebkit: true });
  for (const e of errors) check(false, `консоль: ${e}`);
  console.log(`Снимки и запись: ${dir}`);
}

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
  else if (process.argv.includes('--tolko-dz')) await runTolkoDz();
  else if (NO_HEADER) await runNoHeader();
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
