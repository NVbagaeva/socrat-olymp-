#!/usr/bin/env node
/* scripts/check-sql-bezopasnost.mjs — правила безопасности в миграциях.

   Запуск: pnpm test:sql-bezopasnost

   Зачем. В базе лежат данные учеников: имена, классы, прогресс,
   журнал, согласия. Защита держится на трёх правилах, которые сейчас
   соблюдены везде. Нарушить их легко и незаметно — новая миграция без
   одной строки открывает таблицу всем. Проверка держит правила.

   Что проверяется в supabase/migrations/**.sql:

   1. У каждой таблицы, созданной в схеме public, включён RLS
      (alter table … enable row level security). Без него политики не
      действуют и таблицу читает любой, кто вошёл на сайт.

   2. Каждая функция security definer задаёт search_path. Такая функция
      выполняется с правами владельца; без фиксированного search_path
      неполное имя (foo вместо public.foo) можно перехватить своим
      объектом в другой схеме и выполнить чужой код с правами владельца.

   3. Права и политики для роли anon (гость, не вошёл) — только на
      справочники из SPRAVOCHNIKI. Остальное anon не видит.

   Таблицы схем, кроме public (auth_hooks и прочие служебные), не
   проверяются: они не доступны клиенту напрямую.

   Если новое исключение действительно нужно — впишите его в
   SPRAVOCHNIKI или BEZ_RLS с комментарием, почему так можно. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOREN = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MIGRACII = path.join(KOREN, 'supabase', 'migrations');

/**
 * Справочники: одинаковы для всех, личных данных нет, гость их читает.
 * Ключ — таблица, значение — почему так можно.
 */
const SPRAVOCHNIKI = new Map([
  ['public.ege_tasks', 'каталог заданий ЕГЭ — тот же для всех, личных данных нет'],
  ['public.bank_prototypes', 'прототипы банка задач — тот же каталог, личных данных нет'],
  [
    'public.legal_editions',
    'редакции документов сайта (политика, соглашение) — их надо показать до входа',
  ],
]);

/**
 * Таблицы public без RLS: только с объяснением, почему это безопасно.
 */
const BEZ_RLS = new Map();

const fajly = fs
  .readdirSync(MIGRACII)
  .filter((f) => f.endsWith('.sql'))
  .sort();

/** Строка в файле по позиции в тексте. */
const stroka = (text, i) => text.slice(0, i).split('\n').length;

const sozdany = new Map(); // public.таблица → "файл:строка"
const sRls = new Set();
const bezSearchPath = []; // { fajl, stroka, imya }
const anonLishnee = []; // { fajl, stroka, chto, obekt }

for (const fajl of fajly) {
  const text = fs.readFileSync(path.join(MIGRACII, fajl), 'utf8');

  // 1. Созданные таблицы и включённый RLS.
  for (const m of text.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?([a-z0-9_.]+)/gi)) {
    const imya = m[1].toLowerCase();
    if (imya.startsWith('public.') && !sozdany.has(imya)) {
      sozdany.set(imya, `${fajl}:${stroka(text, m.index)}`);
    }
  }
  for (const m of text.matchAll(
    /alter\s+table\s+(?:if\s+exists\s+)?([a-z0-9_.]+)\s+enable\s+row\s+level\s+security/gi,
  )) {
    sRls.add(m[1].toLowerCase());
  }

  // 2. security definer без search_path.
  for (const m of text.matchAll(/create\s+(?:or\s+replace\s+)?function\s+([a-z0-9_."]+)\s*\(/gi)) {
    const hvost = text.slice(m.index + m[0].length, m.index + m[0].length + 900);
    const zagolovok = hvost.split(/\bas\s*\$/i)[0];
    if (!/security\s+definer/i.test(zagolovok)) continue;
    if (!/set\s+search_path/i.test(zagolovok)) {
      bezSearchPath.push({ fajl, stroka: stroka(text, m.index), imya: m[1] });
    }
  }

  // 3. Права и политики для anon — только на справочники.
  for (const m of text.matchAll(/grant\s+[a-z, ]+?\s+on\s+([a-z0-9_., ]+?)\s+to\s+([a-z, ]+);/gi)) {
    if (!/\banon\b/i.test(m[2])) continue;
    for (const obekt of m[1].split(',').map((s) => s.trim().toLowerCase())) {
      if (!obekt.startsWith('public.')) continue;
      if (SPRAVOCHNIKI.has(obekt)) continue;
      // Права на функцию — это не доступ к таблице.
      if (/\bfunction\b/i.test(m[0])) continue;
      anonLishnee.push({ fajl, stroka: stroka(text, m.index), chto: 'grant', obekt });
    }
  }
  for (const m of text.matchAll(
    /create\s+policy\s+[a-z0-9_]+\s+on\s+([a-z0-9_.]+)[\s\S]{0,200}?to\s+([a-z, ]+?)\s+(?:using|with)/gi,
  )) {
    if (!/\banon\b/i.test(m[2])) continue;
    const obekt = m[1].toLowerCase();
    if (SPRAVOCHNIKI.has(obekt)) continue;
    anonLishnee.push({ fajl, stroka: stroka(text, m.index), chto: 'политика', obekt });
  }
}

const bezZaschity = [...sozdany.keys()].filter((t) => !sRls.has(t) && !BEZ_RLS.has(t));

const bed = [];

if (bezZaschity.length) {
  bed.push(
    `Таблицы public без RLS (${bezZaschity.length}):\n` +
      bezZaschity.map((t) => `    ${t} — ${sozdany.get(t)}`).join('\n') +
      '\n  Добавьте: alter table ' +
      bezZaschity[0] +
      ' enable row level security;',
  );
}

if (bezSearchPath.length) {
  bed.push(
    `Функции security definer без set search_path (${bezSearchPath.length}):\n` +
      bezSearchPath.map((f) => `    ${f.imya} — ${f.fajl}:${f.stroka}`).join('\n') +
      "\n  Добавьте в заголовок: set search_path = ''",
  );
}

if (anonLishnee.length) {
  bed.push(
    `Доступ для гостя (anon) не к справочнику (${anonLishnee.length}):\n` +
      anonLishnee.map((a) => `    ${a.chto} на ${a.obekt} — ${a.fajl}:${a.stroka}`).join('\n') +
      '\n  Уберите anon или впишите таблицу в SPRAVOCHNIKI с объяснением.',
  );
}

if (bed.length) {
  console.error('\nПравила безопасности в миграциях нарушены:\n');
  for (const b of bed) console.error('  ' + b + '\n');
  console.error(
    'Это правила защиты данных учеников. Если исключение действительно\n' +
      'нужно — впишите его в SPRAVOCHNIKI или BEZ_RLS\n' +
      '(scripts/check-sql-bezopasnost.mjs) с объяснением, почему так можно.\n',
  );
  process.exit(1);
}

const sdef = bezSearchPath.length;
console.log(
  `Миграции: таблиц public ${sozdany.size}, у всех RLS; ` +
    `функций security definer с search_path — все (без — ${sdef}); ` +
    `гостю открыты только справочники (${SPRAVOCHNIKI.size}).`,
);
