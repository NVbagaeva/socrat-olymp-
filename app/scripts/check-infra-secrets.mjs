#!/usr/bin/env node
/* scripts/check-infra-secrets.mjs — в репозитории нет ключей и паролей сервера.

   Запуск: pnpm test:infra-secrets (входит и в pnpm test:secrets).
   Самопроверка: node scripts/check-infra-secrets.mjs --self-test

   Репозиторий публичный. Секреты сервера api.budetege.ru живут только в
   GitHub Secrets и на самом сервере (.env.generated, .env.github —
   docs/SERVER.md), а сюда не должны попадать никогда, даже на минуту:
   история коммитов хранит всё.

   По всем файлам репозитория ищутся:
     закрытые ключи (-----BEGIN … PRIVATE KEY-----, AGE-SECRET-KEY-…);
     токены GitHub (ghp_…, github_pat_…), ключи Yandex Cloud (YCAJ…,
       YC…, AQVN…), AWS (AKIA…), Supabase sb_secret_…;
     JWT — в infra/, .github/ и supabase/ их быть не может вообще:
       ключи anon и service_role создаются на сервере;
     файлы .env, *.pem, *.key, ключи deploy и age;
     адреса из ALLOWED_EMAILS, если список передан в окружение проверки.
   В infra/, .github/ и supabase/ дополнительно:
     пароли и ключи, вписанные значением (PASSWORD=…, SECRET: …),
       а не подставленные из переменной (${…}, ${{ secrets.… }});
     внешние IPv4-адреса — адрес сервера тоже держится в секрете.

   Ненулевой код возврата — нашлось то, чего в репозитории быть не должно.
*/

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/* ── Что ищем ───────────────────────────────────────────────────── */

const VEZDE = [
  ['закрытый ключ', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['закрытый ключ age', /AGE-SECRET-KEY-1[0-9A-Z]{50,}/],
  ['токен GitHub', /\b(?:ghp|gho|ghu|ghs)_[A-Za-z0-9]{30,}|\bgithub_pat_[A-Za-z0-9_]{40,}/],
  /* Не посреди длинной строки base64 (картинки в HTML): до и после
     ключа — не буква и не цифра. */
  [
    'ключ Yandex Cloud',
    /(?<![A-Za-z0-9+/_-])(?:YCAJ[A-Za-z0-9_-]{20,}|YC[A-Za-z0-9_-]{38}|AQVN[A-Za-z0-9_-]{30,})(?![A-Za-z0-9+/_-])/,
  ],
  ['ключ AWS', /\bAKIA[0-9A-Z]{16}\b/],
  ['секретный ключ Supabase', /sb_secret_[A-Za-z0-9_-]{10,}/],
];

const JWT = /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/;

/* Пароль или ключ значением: имя переменной с PASSWORD, PASS, SECRET,
   TOKEN или KEY, потом = или :, потом не подстановка. */
const ZNACHENIE =
  /\b[A-Z0-9_]*(?:PASSWORD|PASS|SECRET|TOKEN|_KEY)[A-Z0-9_]*\s*[:=]\s*['"]?([^\s'"$%{}<>()|;`,\\]+)/g;
const NE_SEKRET = new Set(['true', 'false', 'none', 'null', 'yes', 'no', '-', '1', '0']);

const IPV4 = /(?<![\d.])(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?![\d.])/g;
function vneshniy([a, b, c]) {
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  /* Документационные сети (RFC 5737): в примерах и сценарии. */
  if (a === 192 && b === 0 && c === 2) return false;
  if (a === 198 && b === 51 && c === 100) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  return true;
}

const OPASNYE_FAYLY = [
  /(^|\/)\.env(\.[^/]*)?$/,
  /\.pem$/,
  /\.key$/,
  /(^|\/)(deploy_key|admin_key|age_identity|id_ed25519|id_rsa)$/,
];

const INFRA = /^(infra|\.github|supabase)\//;

/* ── Проверка одного файла ──────────────────────────────────────── */

function proverit(rel, text) {
  const found = [];
  for (const [chto, re] of VEZDE) {
    if (re.test(text)) found.push(chto);
  }
  const adresa = (process.env.ALLOWED_EMAILS ?? '')
    .split(',')
    .map((a) => a.trim().toLowerCase())
    .filter((a) => a.includes('@'));
  for (const adres of adresa) {
    if (text.toLowerCase().includes(adres)) found.push('адрес из ALLOWED_EMAILS');
  }
  if (INFRA.test(rel)) {
    if (JWT.test(text)) found.push('JWT (ключи anon и service_role создаются на сервере)');
    for (const m of text.matchAll(ZNACHENIE)) {
      const value = m[1];
      /* Строка с пометкой «не секрет» — тестовое значение (пароль
         проверочного аккаунта, адрес мока). */
      const stroka = text.slice(
        text.lastIndexOf('\n', m.index) + 1,
        text.indexOf('\n', m.index) >>> 0,
      );
      if (stroka.includes('не секрет')) continue;
      if (value.length < 8 || NE_SEKRET.has(value.toLowerCase())) continue;
      /* Имя другой переменной или секрета, а не значение. */
      if (/^[A-Z][A-Z0-9_]+$/.test(value)) continue;
      found.push(`значение секрета: ${m[0].slice(0, 40)}…`);
    }
    for (const m of text.matchAll(IPV4)) {
      const octets = m.slice(1, 5).map(Number);
      if (octets.every((o) => o <= 255) && vneshniy(octets)) {
        found.push(`внешний IP-адрес ${m[0]}`);
      }
    }
  }
  return found;
}

function proveritFayly(root, files) {
  const bad = [];
  for (const rel of files) {
    const full = path.join(root, rel);
    const problemy = [];
    if (OPASNYE_FAYLY.some((re) => re.test(rel))) {
      problemy.push('файл с секретами в репозитории');
    }
    let stat;
    try {
      stat = fs.statSync(full);
    } catch {
      continue;
    }
    if (stat.isFile() && stat.size < 2_000_000) {
      const buf = fs.readFileSync(full);
      /* Двоичные файлы (картинки, PDF) пропускаем. */
      if (!buf.subarray(0, 8000).includes(0)) {
        problemy.push(...proverit(rel, buf.toString('utf8')));
      }
    }
    if (problemy.length > 0) bad.push({ rel, problemy });
  }
  return bad;
}

/* ── Самопроверка: подсаженные секреты должны найтись ───────────── */

function selfTest() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'infra-secrets-'));
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const jwt = `${b64({ alg: 'HS256' })}.${b64({ role: 'service_role', iss: 'supabase' })}.c2lnbmF0dXJlc2lnbmF0dXJl`;
  const plant = {
    'infra/lite/a.sh': '-----BEGIN OPENSSH PRIVATE KEY-----\nabc\n',
    'infra/lite/b.sh': `AGE-SECRET-KEY-1${'Q'.repeat(58)}\n`,
    'infra/lite/c.yml': `token: ghp_${'a'.repeat(36)}\n`,
    'infra/lite/d.sh': `S3_ACCESS_KEY_ID=YCAJE${'x'.repeat(20)}\n`,
    'infra/lite/e.yml': `ANON_KEY: ${jwt}\n`,
    'infra/lite/f.sh': "SMTP_PASS='hunter2hunter2'\n",
    'infra/lite/g.sh': 'SERVER_HOST=185.12.34.56\n',
    '.env': 'X=1\n',
    'docs/h.md': `ключ: AKIA${'A'.repeat(16)}\n`,
  };
  const clean = {
    'infra/lite/ok.yml': [
      'SMTP_PASS: ${{ secrets.SMTP_PASSWORD }}',
      'POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?нет}',
      'printf \'DB_ADMIN_PASSWORD=%s\\n\' "$DB_ADMIN_PASSWORD"',
      'GOTRUE_SMTP_PASS: ${SMTP_PASS:-}',
      'listen 127.0.0.1:5432 и 203.0.113.7, версия 2.11.7',
      'SERVER_SSH_KEY: нет секрета SERVER_SSH_KEY',
      "const PASSWORD = 'probe-Passw0rd-1'; // не секрет: проверочный аккаунт",
      `картинка: data:image/png;base64,QUJD${'YC'}eRWx34ZLC9nBiOCUXSYT3F6OYHB5jrLAUKHACnAxyz`,
    ].join('\n'),
  };
  for (const [rel, text] of Object.entries({ ...plant, ...clean })) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), text);
  }
  const bad = proveritFayly(dir, Object.keys({ ...plant, ...clean }));
  fs.rmSync(dir, { recursive: true, force: true });
  const naydeno = new Set(bad.map((b) => b.rel));
  const propushcheno = Object.keys(plant).filter((rel) => !naydeno.has(rel));
  const lozhnye = Object.keys(clean).filter((rel) => naydeno.has(rel));
  if (propushcheno.length > 0 || lozhnye.length > 0) {
    console.error('Самопроверка не прошла.');
    if (propushcheno.length > 0) console.error(`  не найдено: ${propushcheno.join(', ')}`);
    for (const row of bad.filter((b) => lozhnye.includes(b.rel))) {
      console.error(`  ложная тревога в ${row.rel}: ${row.problemy.join('; ')}`);
    }
    process.exit(1);
  }
  console.log(
    `Самопроверка: найдено ${Object.keys(plant).length} подсаженных секретов из ${Object.keys(plant).length}, ложных тревог нет.`,
  );
}

/* ── Запуск ─────────────────────────────────────────────────────── */

if (process.argv.includes('--self-test')) {
  selfTest();
  process.exit(0);
}

const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: repo, encoding: 'utf8' })
  .split('\0')
  .filter((f) => f !== '' && !f.startsWith('app/scripts/check-infra-secrets.mjs'));
const bad = proveritFayly(repo, tracked);
console.log(`Просмотрено файлов репозитория: ${tracked.length}.`);
if (bad.length === 0) {
  console.log('Ключей, паролей и адреса сервера в репозитории нет.');
  process.exit(0);
}
console.error('\nВ репозитории лежит то, чего там быть не должно:');
for (const row of bad) {
  console.error(`  ${row.rel}`);
  for (const p of row.problemy.slice(0, 8)) console.error(`    ${p}`);
}
process.exit(1);
