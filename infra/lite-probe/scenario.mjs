#!/usr/bin/env node
/**
 * Сценарий пробного кабинета против облегчённого набора — и замер памяти.
 *
 * Запросы делает тот же supabase-js, что на сайте (из app/node_modules),
 * из настоящего браузера и с другого адреса (127.0.0.1:4173 → :8000),
 * поэтому проверяются и CORS, и ссылки из писем, и разбор токена из
 * адреса страницы — ровно как на /voyti/podtverzhdenie/ и
 * /voyti/novyy-parol/.
 *
 * Шаги: регистрация не по списку (отказ) → регистрация по списку →
 * письмо → повторное письмо раньше минуты (отказ) → вход до
 * подтверждения (отказ) → ссылка из письма → вход → кабинет → смена
 * роли → код комплекта → второй человек и правила RLS «не вижу чужое» →
 * сброс пароля → обновление токена → удаление аккаунта → нагрузка.
 *
 * Пока идёт сценарий, `docker stats` раз в секунду пишет память
 * контейнеров; пики уходят в out/probe-report.json и out/probe-summary.md.
 *
 *   ALLOWED_EMAILS=… ./up.sh && node scenario.mjs
 */
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appRequire = createRequire(join(here, '../../app/package.json'));
const { chromium } = appRequire('playwright');
const SDK_PATH = join(dirname(appRequire.resolve('@supabase/supabase-js')), 'umd/supabase.js');
const SDK_VERSION = JSON.parse(
  readFileSync(join(dirname(appRequire.resolve('@supabase/supabase-js')), '../package.json'), 'utf8'),
).version;

const env = Object.fromEntries(
  readFileSync(join(here, '.env'), 'utf8')
    .split('\n')
    .filter((line) => line.includes('='))
    .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]),
);

const API = 'http://127.0.0.1:8000';
const SITE = 'http://127.0.0.1:4173';
const MAIL = 'http://127.0.0.1:8025';
const OUT = join(here, 'out');
mkdirSync(OUT, { recursive: true });

const ANNA = 'anna@example.test';
const BORIS = 'boris@example.test';
const STRANGER = 'stranger@example.test';
const PASSWORD = 'probe-Passw0rd-1';
const NEW_PASSWORD = 'probe-Passw0rd-2';

/* ── Итоги ──────────────────────────────────────────────────────── */

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok: Boolean(ok), detail: String(detail).slice(0, 300) });
  console.log(`${ok ? '✓' : '✗'} ${name}${detail && !ok ? ` — ${detail}` : ''}`);
}

/* ── Память ─────────────────────────────────────────────────────── */

const UNITS = { B: 1, KiB: 1024, MiB: 1024 ** 2, GiB: 1024 ** 3, kB: 1e3, MB: 1e6, GB: 1e9 };
function bytes(text) {
  const match = /([\d.]+)\s*([A-Za-z]+)/.exec(text);
  return match ? Number(match[1]) * (UNITS[match[2]] ?? 1) : 0;
}
const mib = (value) => Math.round((value / 1024 ** 2) * 10) / 10;

const memory = { phase: 'idle', peaks: {}, idle: {}, warm: {}, samples: 0 };
function sampleLine(line) {
  let row;
  try {
    row = JSON.parse(line);
  } catch {
    return;
  }
  const name = row.Name.replace(/^lite-/, '').replace(/-1$/, '');
  const used = bytes(row.MemUsage.split('/')[0]);
  const limit = bytes(row.MemUsage.split('/')[1] ?? '');
  memory.samples += 1;
  const bucket = { idle: memory.idle, warm: memory.warm }[memory.phase] ?? memory.peaks;
  if (!bucket[name] || bucket[name].used < used) bucket[name] = { used, limit };
}
const stats = spawn('docker', ['stats', '--format', '{{json .}}'], { stdio: ['ignore', 'pipe', 'inherit'] });
let buffer = '';
stats.stdout.on('data', (chunk) => {
  /* Поток docker stats перемежает строки управляющими кодами терминала. */
  buffer += chunk.toString().replace(/\x1b\[[0-9;]*[A-Za-z]/g, '\n');
  const lines = buffer.split('\n');
  buffer = lines.pop() ?? '';
  lines.forEach(sampleLine);
});

/* Память самих dockerd и containerd: они тоже живут на сервере. */
function daemonsRss() {
  try {
    const out = execFileSync('ps', ['-C', 'dockerd,containerd,containerd-shim-runc-v2', '-o', 'comm=,rss='], {
      encoding: 'utf8',
    });
    const sum = {};
    for (const line of out.trim().split('\n')) {
      const [comm, rss] = line.trim().split(/\s+/);
      sum[comm] = (sum[comm] ?? 0) + Number(rss) * 1024;
    }
    return sum;
  } catch {
    return {};
  }
}

/* ── Страница «сайта» с supabase-js ─────────────────────────────── */

const sdk = readFileSync(SDK_PATH);
const page = `<!doctype html><meta charset="utf-8"><title>probe</title>
<script src="/sb.js"></script>
<script>
  /* Те же настройки, что в app/src/lib/auth/client.ts. */
  window.sb = supabase.createClient(${JSON.stringify(API)}, ${JSON.stringify(env.ANON_KEY)}, {
    auth: { storageKey: 'budetege-auth', flowType: 'implicit', detectSessionInUrl: true,
            persistSession: true, autoRefreshToken: false },
  });
</script>`;
const server = http.createServer((req, res) => {
  if (req.url === '/sb.js') {
    res.writeHead(200, { 'content-type': 'text/javascript' });
    res.end(sdk);
    return;
  }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(page);
});
await new Promise((resolve) => server.listen(4173, '127.0.0.1', resolve));

/* ── Почта (Mailpit) ────────────────────────────────────────────── */

async function mailTo(address, subjectPart, after) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const list = await (await fetch(`${MAIL}/api/v1/search?query=${encodeURIComponent(`to:${address}`)}`)).json();
    const hit = (list.messages ?? []).find(
      (item) => item.Subject.includes(subjectPart) && new Date(item.Created).getTime() >= after,
    );
    if (hit) {
      const full = await (await fetch(`${MAIL}/api/v1/message/${hit.ID}`)).json();
      const link = /href="([^"]*\/auth\/v1\/verify[^"]*)"/.exec(full.HTML ?? '')?.[1]?.replaceAll('&amp;', '&');
      return { subject: full.Subject, from: full.From?.Address, html: full.HTML ?? '', link };
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return null;
}

/* ── Прямые запросы с ключом service_role (только для проверок) ── */

async function asService(path) {
  const response = await fetch(`${API}/rest/v1/${path}`, {
    headers: { apikey: env.SERVICE_ROLE_KEY, authorization: `Bearer ${env.SERVICE_ROLE_KEY}` },
  });
  return response.json();
}

/* ── Сценарий ───────────────────────────────────────────────────── */

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined;
const browser = await chromium.launch({ executablePath });

async function freshPage(path = '/voyti/') {
  const context = await browser.newContext();
  const tab = await context.newPage();
  const errors = [];
  tab.on('pageerror', (error) => errors.push(error.message));
  tab.on('console', (message) => {
    if (message.type() === 'error' && /CORS|blocked/i.test(message.text())) errors.push(message.text());
  });
  await tab.goto(`${SITE}${path}`);
  return { tab, errors, context };
}

/** Выполнить код в странице: sb — клиент supabase-js. */
const run = (tab, fn, arg) => tab.evaluate(fn, arg);

async function signUpAndConfirm(email, name, role) {
  const { tab, errors } = await freshPage('/voyti/');
  const sent = Date.now() - 1000;
  const signUp = await run(
    tab,
    async ({ email, password, name, role, back }) => {
      const { data, error } = await window.sb.auth.signUp({
        email,
        password,
        options: { data: { name, role }, emailRedirectTo: back },
      });
      return { user: data?.user?.id ?? null, session: Boolean(data?.session), error: error?.message ?? null };
    },
    { email, password: PASSWORD, name, role, back: `${SITE}/voyti/podtverzhdenie/` },
  );
  check(`${name}: регистрация по списку принята, сессии до подтверждения нет`, signUp.user && !signUp.session, JSON.stringify(signUp));

  const mail = await mailTo(email, 'Подтвердите почту', sent);
  check(`${name}: пришло письмо «Подтвердите почту — Будет на ЕГЭ» от noreply@budetege.ru`,
    mail?.subject === 'Подтвердите почту — Будет на ЕГЭ' && mail?.from === 'noreply@budetege.ru', JSON.stringify(mail?.subject));
  check(`${name}: письмо из шаблона supabase/templates (русский текст, ссылка на /voyti/podtverzhdenie/)`,
    /Будет на ЕГЭ/.test(mail?.html ?? '') && decodeURIComponent(mail?.link ?? '').includes('/voyti/podtverzhdenie/'), mail?.link);
  return { tab, errors, mail, userId: signUp.user };
}

try {
  memory.phase = 'idle';
  await new Promise((resolve) => setTimeout(resolve, 8000));
  const daemonsIdle = daemonsRss();
  memory.phase = 'scenario';
  await fetch(`${MAIL}/api/v1/messages`, { method: 'DELETE' });

  /* 1. Не по списку. */
  {
    const { tab, errors } = await freshPage('/voyti/');
    const result = await run(
      tab,
      async ({ email, password }) => {
        const { error } = await window.sb.auth.signUp({ email, password });
        return { message: error?.message ?? null, status: error?.status ?? null };
      },
      { email: STRANGER, password: PASSWORD },
    );
    check('Адреса нет в списке — отказ invite_only (сайт пишет «Регистрация пока по приглашению»)',
      result.message?.includes('invite_only') && result.status === 403, JSON.stringify(result));
    check('Запросы с адреса сайта проходят CORS без ошибок', errors.length === 0, errors.join(' | '));
  }

  /* 2–6. Анна: регистрация, письмо, повтор, вход до подтверждения, ссылка. */
  const anna = await signUpAndConfirm(ANNA, 'Анна', 'student');
  {
    const resend = await run(
      anna.tab,
      async ({ email, back }) => {
        const { error } = await window.sb.auth.resend({ type: 'signup', email, options: { emailRedirectTo: back } });
        return { status: error?.status ?? null, code: error?.code ?? null };
      },
      { email: ANNA, back: `${SITE}/voyti/podtverzhdenie/` },
    );
    check('Повторное письмо раньше минуты — отказ 429 (ограничение частоты)', resend.status === 429, JSON.stringify(resend));

    const early = await run(
      anna.tab,
      async ({ email, password }) => {
        const { error } = await window.sb.auth.signInWithPassword({ email, password });
        return { code: error?.code ?? null };
      },
      { email: ANNA, password: PASSWORD },
    );
    check('Вход до подтверждения почты — отказ email_not_confirmed', early.code === 'email_not_confirmed', JSON.stringify(early));

    /* Переход по ссылке из письма: GoTrue → 303 → страница сайта с
       токеном в якоре → supabase-js сам забирает сессию. */
    await anna.tab.goto(anna.mail.link);
    const confirmed = await run(anna.tab, async () => {
      const { data } = await window.sb.auth.getSession();
      return { email: data.session?.user?.email ?? null, url: location.pathname, hashGone: location.hash === '' };
    });
    check('Ссылка из письма открывает /voyti/podtverzhdenie/ и даёт сессию', confirmed.email === ANNA && confirmed.url === '/voyti/podtverzhdenie/', JSON.stringify(confirmed));
  }

  /* 7–10. Вход, кабинет, смена роли, код комплекта. */
  const annaSession = await freshPage('/voyti/');
  {
    const tab = annaSession.tab;
    const login = await run(tab, async ({ email, password }) => {
      const { data, error } = await window.sb.auth.signInWithPassword({ email, password });
      return { id: data?.user?.id ?? null, name: data?.user?.user_metadata?.name ?? null, error: error?.message ?? null };
    }, { email: ANNA, password: PASSWORD });
    check('Вход по почте и паролю', login.id === anna.userId && login.name === 'Анна', JSON.stringify(login));

    await tab.goto(`${SITE}/kabinet/`);
    const profile = await run(tab, async () => {
      const { data: { user } } = await window.sb.auth.getUser();
      const { data, error } = await window.sb.from('profiles').select('name, role, tour_done').eq('id', user.id).single();
      return { data, error: error?.message ?? null };
    });
    check('Кабинет: профиль создан триггером, имя и роль из регистрации', profile.data?.name === 'Анна' && profile.data?.role === 'student', JSON.stringify(profile));

    const changed = await run(tab, async () => {
      const { data: { user } } = await window.sb.auth.getUser();
      const { error } = await window.sb.from('profiles').update({ name: 'Анна П.', role: 'tutor' }).eq('id', user.id);
      const { error: metaError } = await window.sb.auth.updateUser({ data: { name: 'Анна П.', role: 'tutor' } });
      const { data } = await window.sb.from('profiles').select('name, role').eq('id', user.id).single();
      const { data: fresh } = await window.sb.auth.getUser();
      return { data, meta: fresh.user?.user_metadata?.role, error: error?.message ?? metaError?.message ?? null };
    });
    check('Смена роли ученик → репетитор (профиль и данные аккаунта)', changed.data?.role === 'tutor' && changed.meta === 'tutor', JSON.stringify(changed));

    const kit = await run(tab, async () => {
      const row = { code: 'AB12-CD', scope: '12', section: 'Проба', student_href: '/list/?s=12.A', teacher_href: '/list/?s=12.A&o=1' };
      const { error } = await window.sb.from('kits').upsert(row, { onConflict: 'user_id,code' });
      const { data } = await window.sb.from('kits').select('code').order('created_at', { ascending: false });
      return { codes: (data ?? []).map((item) => item.code), error: error?.message ?? null };
    });
    check('Код комплекта сохраняется и читается', kit.codes.includes('AB12-CD') && !kit.error, JSON.stringify(kit));
  }

  /* 11–12. Борис и правила RLS. */
  const boris = await signUpAndConfirm(BORIS, 'Борис', 'student');
  await boris.tab.goto(boris.mail.link);
  {
    const tab = boris.tab;
    const rls = await run(tab, async ({ annaId }) => {
      const profiles = await window.sb.from('profiles').select('id');
      const kits = await window.sb.from('kits').select('code');
      const update = await window.sb.from('profiles').update({ name: 'взлом' }).eq('id', annaId).select('id');
      const insert = await window.sb.from('kits').insert({ user_id: annaId, code: 'ZZ99-ZZ', scope: '12', student_href: '/x/', teacher_href: '/y/' });
      const del = await window.sb.from('kits').delete().eq('user_id', annaId).select('id');
      return {
        profiles: (profiles.data ?? []).length,
        kits: (kits.data ?? []).length,
        updated: (update.data ?? []).length,
        insertCode: insert.error?.code ?? null,
        deleted: (del.data ?? []).length,
      };
    }, { annaId: anna.userId });
    check('RLS: второй человек видит только свой профиль', rls.profiles === 1, JSON.stringify(rls));
    check('RLS: чужие коды комплектов не видны', rls.kits === 0, JSON.stringify(rls));
    check('RLS: чужой профиль не меняется', rls.updated === 0, JSON.stringify(rls));
    check('RLS: нельзя записать комплект на чужой аккаунт (42501)', rls.insertCode === '42501', JSON.stringify(rls));
    check('RLS: нельзя удалить чужие комплекты', rls.deleted === 0, JSON.stringify(rls));

    const anonymous = await (await freshPage('/')).tab.evaluate(async () => {
      const profiles = await window.sb.from('profiles').select('id');
      const kits = await window.sb.from('kits').insert({ code: 'QQ11-QQ', scope: '12', student_href: '/x/', teacher_href: '/y/' });
      const rpc = await window.sb.rpc('delete_own_account');
      return { profiles: (profiles.data ?? []).length, kitsError: kits.error?.code ?? null, rpcError: rpc.error?.code ?? null };
    });
    check('Без входа: профили не видны, записать и удалить нельзя', anonymous.profiles === 0 && anonymous.kitsError !== null && anonymous.rpcError !== null, JSON.stringify(anonymous));

    const annaStill = await asService(`profiles?id=eq.${anna.userId}&select=name`);
    check('Профиль Анны после попыток Бориса не изменился', annaStill[0]?.name === 'Анна П.', JSON.stringify(annaStill));
  }

  /* Шлюз: ключ обязателен, описание схемы закрыто. */
  {
    const noKey = await fetch(`${API}/rest/v1/profiles`);
    const badKey = await fetch(`${API}/auth/v1/settings`, { headers: { apikey: 'nope' } });
    const root = await fetch(`${API}/rest/v1/`, { headers: { apikey: env.ANON_KEY } });
    const foreign = await fetch(`${API}/auth/v1/token`, { method: 'OPTIONS', headers: { Origin: 'https://evil.example' } });
    const db = await fetch('http://127.0.0.1:5432').then(() => 'open', () => 'closed-or-not-http');
    check('Без apikey и с чужим ключом — 401', noKey.status === 401 && badKey.status === 401, `${noKey.status}/${badKey.status}`);
    check('Описание схемы (OpenAPI) не отдаётся', root.status === 404, root.status);
    check('Чужой сайт не проходит CORS', foreign.status === 403 && !foreign.headers.get('access-control-allow-origin'), foreign.status);
    check('Порт базы не отвечает по HTTP (опубликован только на 127.0.0.1)', db !== 'open', db);
  }

  /* 13–14. Сброс пароля и обновление токена. */
  {
    const { tab } = await freshPage('/voyti/');
    const sent = Date.now() - 1000;
    const asked = await run(tab, async ({ email, back }) => {
      const { error } = await window.sb.auth.resetPasswordForEmail(email, { redirectTo: back });
      return { error: error?.message ?? null };
    }, { email: ANNA, back: `${SITE}/voyti/novyy-parol/` });
    const mail = await mailTo(ANNA, 'Сброс пароля', sent);
    check('Сброс пароля: письмо «Сброс пароля — Будет на ЕГЭ» со ссылкой на /voyti/novyy-parol/',
      !asked.error && mail?.subject === 'Сброс пароля — Будет на ЕГЭ' && decodeURIComponent(mail?.link ?? '').includes('/voyti/novyy-parol/'), JSON.stringify({ asked, subject: mail?.subject }));

    await tab.goto(mail.link);
    const reset = await run(tab, async ({ password }) => {
      const { data } = await window.sb.auth.getSession();
      const { error } = await window.sb.auth.updateUser({ password });
      await window.sb.auth.signOut();
      return { had: Boolean(data.session), path: location.pathname, error: error?.message ?? null };
    }, { password: NEW_PASSWORD });
    check('Ссылка сброса даёт сессию на /voyti/novyy-parol/, новый пароль сохраняется', reset.had && reset.path === '/voyti/novyy-parol/' && !reset.error, JSON.stringify(reset));

    const logins = await run(tab, async ({ email, oldPassword, newPassword }) => {
      const old = await window.sb.auth.signInWithPassword({ email, password: oldPassword });
      const fresh = await window.sb.auth.signInWithPassword({ email, password: newPassword });
      const refreshed = await window.sb.auth.refreshSession();
      return { old: old.error?.code ?? 'ok', fresh: fresh.error?.code ?? 'ok', refresh: refreshed.error?.message ?? 'ok' };
    }, { email: ANNA, oldPassword: PASSWORD, newPassword: NEW_PASSWORD });
    check('Старый пароль больше не подходит, новый подходит', logins.old === 'invalid_credentials' && logins.fresh === 'ok', JSON.stringify(logins));
    check('Обновление токена (refresh token) работает', logins.refresh === 'ok', JSON.stringify(logins));
  }

  /* 15. Удаление аккаунта. */
  {
    const gone = await run(boris.tab, async ({ email, password }) => {
      const { error } = await window.sb.rpc('delete_own_account');
      await window.sb.auth.signOut({ scope: 'local' });
      const again = await window.sb.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null, again: again.error?.code ?? 'ok' };
    }, { email: BORIS, password: PASSWORD });
    const left = await asService(`profiles?id=eq.${boris.userId}&select=id`);
    check('Удаление аккаунта: войти больше нельзя, профиль удалён каскадом', !gone.error && gone.again === 'invalid_credentials' && left.length === 0, JSON.stringify({ gone, left }));
  }

  /* 16. Нагрузка: 30 входов (bcrypt) и 300 чтений профиля разом —
     заметно больше, чем даст класс учеников в одну минуту. */
  memory.phase = 'load';
  let loadInfo;
  {
    const signIns = await Promise.all(
      Array.from({ length: 30 }, async () => {
        const started = performance.now();
        const response = await fetch(`${API}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: { apikey: env.ANON_KEY, 'content-type': 'application/json' },
          body: JSON.stringify({ email: ANNA, password: NEW_PASSWORD }),
        });
        const body = await response.json();
        return { status: response.status, ms: performance.now() - started, token: body.access_token };
      }),
    );
    const token = signIns.find((item) => item.token)?.token;
    const reads = await Promise.all(
      Array.from({ length: 300 }, async () => {
        const started = performance.now();
        const response = await fetch(`${API}/rest/v1/profiles?select=name,role`, {
          headers: { apikey: env.ANON_KEY, authorization: `Bearer ${token}` },
        });
        await response.text();
        return { status: response.status, ms: performance.now() - started };
      }),
    );
    const pct = (list, p) => Math.round([...list].sort((a, b) => a - b)[Math.floor((list.length - 1) * p)]);
    loadInfo = {
      signIns: { ok: signIns.filter((item) => item.status === 200).length, total: signIns.length, p50: pct(signIns.map((i) => i.ms), 0.5), p95: pct(signIns.map((i) => i.ms), 0.95) },
      reads: { ok: reads.filter((item) => item.status === 200).length, total: reads.length, p50: pct(reads.map((i) => i.ms), 0.5), p95: pct(reads.map((i) => i.ms), 0.95) },
    };
    const limited = signIns.filter((item) => item.status === 429).length;
    loadInfo.signIns.limited = limited;
    check(`Нагрузка: ${loadInfo.signIns.ok}/30 входов, ${loadInfo.reads.ok}/300 чтений, ошибок сервера нет`,
      signIns.every((item) => item.status === 200 || item.status === 429) && loadInfo.signIns.ok >= 20 && loadInfo.reads.ok === 300, JSON.stringify(loadInfo));

    /* GoTrue ограничивает входы с одного адреса: 150 за 5 минут, разом
       не больше 30. Обойти подделкой X-Forwarded-For нельзя — Caddy
       ставит в заголовок настоящий адрес. */
    const spoofed = await Promise.all(
      Array.from({ length: 40 }, async (_, index) => {
        const response = await fetch(`${API}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: { apikey: env.ANON_KEY, 'content-type': 'application/json', 'x-forwarded-for': `203.0.113.${index + 1}` },
          body: JSON.stringify({ email: ANNA, password: 'wrong-password' }),
        });
        return response.status;
      }),
    );
    loadInfo.spoofed429 = spoofed.filter((status) => status === 429).length;
    check('Подбор пароля упирается в ограничение частоты, подделка X-Forwarded-For не помогает', loadInfo.spoofed429 >= 10, JSON.stringify(spoofed));
  }
  await new Promise((resolve) => setTimeout(resolve, 3000));

  /* 17. Худший случай для базы: таблица больше shared_buffers (128 МБ)
     читается целиком, буферы заполняются до конца. Так база будет
     выглядеть, когда данных станет много. Таблица потом удаляется. */
  memory.phase = 'warm';
  {
    const sql = [
      'create table probe_fill as select g, repeat(md5(g::text), 6) as pad from generate_series(1, 700000) g',
      /* Обычное чтение большой таблицы идёт через маленькое кольцо
         буферов, поэтому грузим её в shared_buffers напрямую. */
      'create extension if not exists pg_prewarm',
      'select pg_prewarm(\'probe_fill\')',
      'select count(*), sum(length(pad)) from probe_fill',
      'drop table probe_fill',
      'drop extension pg_prewarm',
    ].join(';\n');
    execFileSync('docker', ['compose', 'exec', '-T', 'db', 'psql', '-U', 'postgres', '-q', '-v', 'ON_ERROR_STOP=1', '-c', sql], { cwd: here, stdio: 'ignore' });
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  /* ── Отчёт ───────────────────────────────────────────────────── */
  const daemonsPeak = daemonsRss();
  const restarts = execFileSync('docker', ['ps', '-a', '--filter', 'name=lite-', '--format', '{{.Names}} {{.Status}}'], { encoding: 'utf8' }).trim();
  const oom = execFileSync('sh', ['-c', "docker inspect -f '{{.Name}} {{.State.OOMKilled}} {{.RestartCount}}' $(docker ps -aq --filter name=lite-)"], { encoding: 'utf8' }).trim();
  check('Ни один контейнер не упёрся в лимит памяти (OOMKilled=false, без перезапусков)', !/ true /.test(oom) && !/ [1-9]\d*$/m.test(oom), oom);
  const dbSize = execFileSync('docker', ['compose', 'exec', '-T', 'db', 'psql', '-U', 'postgres', '-tAc', "select pg_size_pretty(pg_database_size('postgres'))"], { cwd: here, encoding: 'utf8' }).trim();

  const SERVICES = ['db', 'auth', 'rest', 'caddy'];
  const total = (bucket) => SERVICES.reduce((sum, name) => sum + (bucket[name]?.used ?? 0), 0);
  const daemonsSum = (set) => Object.values(set).reduce((a, b) => a + b, 0);
  const report = {
    date: new Date().toISOString(),
    supabaseJs: SDK_VERSION,
    images: execFileSync('docker', ['compose', 'images', '--format', 'json'], { cwd: here, encoding: 'utf8' }),
    checks: results,
    memoryMiB: {
      idle: Object.fromEntries(SERVICES.map((name) => [name, mib(memory.idle[name]?.used ?? 0)])),
      peak: Object.fromEntries(SERVICES.map((name) => [name, mib(memory.peaks[name]?.used ?? 0)])),
      limit: Object.fromEntries(SERVICES.map((name) => [name, mib(memory.peaks[name]?.limit ?? 0)])),
      idleTotal: mib(total(memory.idle)),
      peakTotal: mib(total(memory.peaks)),
      warmDb: mib(memory.warm.db?.used ?? 0),
      /* Пик сценария, где база взята с полными буферами. */
      worstTotal: mib(total(memory.peaks) - (memory.peaks.db?.used ?? 0) + Math.max(memory.peaks.db?.used ?? 0, memory.warm.db?.used ?? 0)),
      mailpitPeak: mib(memory.peaks.mailpit?.used ?? 0),
      daemonsIdle: Object.fromEntries(Object.entries(daemonsIdle).map(([k, v]) => [k, mib(v)])),
      daemonsPeak: Object.fromEntries(Object.entries(daemonsPeak).map(([k, v]) => [k, mib(v)])),
      daemonsPeakTotal: mib(daemonsSum(daemonsPeak)),
      samples: memory.samples,
    },
    load: loadInfo,
    dbSize,
    containers: restarts,
  };
  writeFileSync(join(OUT, 'probe-report.json'), JSON.stringify(report, null, 2));

  const lines = [
    '## Проба облегчённого набора',
    '',
    `supabase-js ${SDK_VERSION}; проверок пройдено: ${results.filter((r) => r.ok).length} из ${results.length}.`,
    '',
    '| Проверка | Итог |',
    '|---|---|',
    ...results.map((r) => `| ${r.name} | ${r.ok ? '✓' : `✗ ${r.detail.replaceAll('|', '/')}`} |`),
    '',
    '### Память, МиБ (docker stats)',
    '',
    '| Контейнер | Покой | Пик | Лимит |',
    '|---|---|---|---|',
    ...SERVICES.map((name) => `| ${name} | ${report.memoryMiB.idle[name]} | ${report.memoryMiB.peak[name]} | ${report.memoryMiB.limit[name]} |`),
    `| **итого** | **${report.memoryMiB.idleTotal}** | **${report.memoryMiB.peakTotal}** | |`,
    '',
    `База с полностью заполненными shared_buffers: ${report.memoryMiB.warmDb} МиБ; итог контейнеров в худшем случае: ${report.memoryMiB.worstTotal} МиБ.`,
    '',
    `dockerd + containerd + shim (RSS, пик): ${report.memoryMiB.daemonsPeakTotal} МиБ — ${JSON.stringify(report.memoryMiB.daemonsPeak)}.`,
    `Mailpit (только в пробе, в итог не входит): ${report.memoryMiB.mailpitPeak} МиБ. Замеров: ${memory.samples}.`,
    '',
    `Нагрузка: входы p50 ${loadInfo.signIns.p50} мс, p95 ${loadInfo.signIns.p95} мс (отклонено ограничением частоты: ${loadInfo.signIns.limited}); подбор с поддельным X-Forwarded-For: ${loadInfo.spoofed429} из 40 получили 429; чтения p50 ${loadInfo.reads.p50} мс, p95 ${loadInfo.reads.p95} мс. Размер базы: ${dbSize}.`,
  ];
  writeFileSync(join(OUT, 'probe-summary.md'), lines.join('\n') + '\n');
  console.log('\n' + lines.join('\n'));
} catch (error) {
  check('Сценарий дошёл до конца', false, error.stack ?? error.message);
} finally {
  await browser.close();
  server.close();
  stats.kill();
}

process.exitCode = results.every((r) => r.ok) ? 0 : 1;
