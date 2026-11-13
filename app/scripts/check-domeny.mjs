#!/usr/bin/env node
/* scripts/check-domeny.mjs — регистрация только с почтой российских
   почтовых сервисов. Без сборки и без браузера:

     1. список доменов в lib/auth/allowed-domains.ts совпадает со
        списком в миграции (auth_hooks.signup_domains) — форма и база
        не расходятся;
     2. сравнение адресов: регистр и пробелы по краям не мешают;
        поддомен, похожий домен, пробел внутри — не проходят;
     3. отказ базы domain_not_allowed форма узнаёт раньше «по
        приглашению» (оба — 403);
     4. входа через сторонние сервисы нет: ни кнопок и вызовов
        signInWithOAuth в коде сайта, ни включённых провайдеров у службы
        входа (infra/lite/compose.yml).

   Сама база — pnpm test:soglasiya-sql (supabase/tests/domeny.test.sql),
   форма в браузере — pnpm test:auth, настоящая служба входа —
   infra/lite/test/scenario.mjs. */

import fs from 'node:fs';
import path from 'node:path';
import { APP, requireSrc } from './lib/load-ts.mjs';

const ROOT = path.join(APP, '..');
const problems = [];
const fail = (t) => problems.push(t);

const D = requireSrc('lib/auth/allowed-domains.ts');
const E = requireSrc('lib/auth/errors.ts');

/* 1. Код и база. */
const MIGRATION = path.join(ROOT, 'supabase', 'migrations', '20261113120000_pochtovye_domeny.sql');
const sql = fs.readFileSync(MIGRATION, 'utf8');
const insert =
  /insert into auth_hooks\.signup_domains \(domain\) values([\s\S]*?);/.exec(sql)?.[1] ?? '';
const vBaze = [...insert.matchAll(/\('([^']+)'\)/g)].map((m) => m[1]).sort();
const vKode = [...D.ALLOWED_EMAIL_DOMAINS].sort();
if (vBaze.join() !== vKode.join()) {
  fail(`списки доменов разошлись:\n    код:  ${vKode.join(', ')}\n    база: ${vBaze.join(', ')}`);
}
const ZADANO = [
  'yandex.ru',
  'ya.ru',
  'yandex.com',
  'yandex.by',
  'yandex.kz',
  'narod.ru',
  'mail.ru',
  'bk.ru',
  'inbox.ru',
  'list.ru',
  'internet.ru',
  'rambler.ru',
  'lenta.ru',
  'autorambler.ru',
  'myrambler.ru',
  'ro.ru',
  'budetege.ru',
].sort();
if (vKode.join() !== ZADANO.join()) fail('список доменов отличается от утверждённого владельцем');

/* 2. Сравнение. */
for (const email of [
  'anna@mail.ru',
  'ANNA@MAIL.RU',
  '  Anna@Yandex.Ru ',
  'a.b+c@ya.ru',
  'x@budetege.ru',
]) {
  if (!D.emailDomainAllowed(email)) fail(`не пропущен «${email}»`);
}
for (const email of [
  'anna@gmail.com',
  'ANNA@GMAIL.COM',
  ' anna@gmail.com ',
  'anna@mail.yandex.ru',
  'anna@sub.mail.ru',
  'anna@mail.ru.example.com',
  'anna@mymail.ru',
  'anna @mail.ru',
  'anna@mail .ru',
  'anna@mail.ru@gmail.com',
  'mail.ru',
  '',
  '@mail.ru',
]) {
  if (D.emailDomainAllowed(email)) fail(`пропущен «${email}»`);
}

/* 3. Отказ базы. */
const domainFail = { status: 403, message: 'domain_not_allowed' };
if (!E.isDomainRejected(domainFail)) fail('отказ domain_not_allowed не распознан');
if (E.describeAuthError(domainFail) !== E.AUTH_ERRORS.domainNotAllowed) {
  fail('отказ по домену показан как «по приглашению» или как неизвестная ошибка');
}
if (E.isDomainRejected({ status: 403, message: 'invite_only' }))
  fail('invite_only принят за отказ по домену');
if (E.describeAuthError({ status: 403, message: 'invite_only' }) !== E.AUTH_ERRORS.inviteOnly) {
  fail('invite_only больше не распознаётся');
}

/* 4. Сторонние способы входа. */
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx?|mjs|js)$/.test(entry.name)) out.push(full);
  }
  return out;
}
for (const file of walk(path.join(APP, 'src'))) {
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(APP, file);
  if (/signInWith(OAuth|IdToken|SSO|Otp)\b/.test(text)) fail(`${rel}: вход через сторонний сервис`);
  if (
    /(Войти|Вход) (через|с помощью) (Google|Apple|VK|ВК|Яндекс|Mail\.ru|Telegram|Госуслуг)/i.test(
      text,
    )
  ) {
    fail(`${rel}: кнопка входа через сторонний сервис`);
  }
}
const compose = fs.readFileSync(path.join(ROOT, 'infra', 'lite', 'compose.yml'), 'utf8');
for (const m of compose.matchAll(/GOTRUE_EXTERNAL_([A-Z_]+)_ENABLED:\s*'?(\w+)'?/g)) {
  if (m[1] !== 'EMAIL' && m[2] === 'true') fail(`служба входа: включён провайдер ${m[1]}`);
}
if (!/GOTRUE_EXTERNAL_EMAIL_ENABLED:\s*'true'/.test(compose))
  fail('служба входа: вход по почте выключен?');

if (problems.length > 0) {
  console.error(`Почтовые домены: ${problems.length} проблем(ы):`);
  for (const p of problems) console.error(`  — ${p}`);
  process.exit(1);
}
console.log(
  `Почтовые домены: список (${vKode.length}) в коде и в базе совпадает, сравнение и отказ в порядке, входа через сторонние сервисы нет.`,
);
