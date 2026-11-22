#!/usr/bin/env node
/* scripts/build-skrytye.mjs — правила сервера для скрытых разделов.

   Запускается сам после сборки (postbuild): pnpm build.
   Отдельно: node scripts/build-skrytye.mjs [--out <папка сборки>]

   Скрытый раздел — раздел, которого нет в действующей структуре
   экзамена (src/content/struktura.js, skryt). Его страницы собираются
   как обычно, а закрывает их сервер: посетителю любой адрес раздела
   отвечает 404, администратору (cookie budetege_skrytye=1, её ставит
   кабинет — src/lib/skrytye.ts) — страницу. И тем и другим —
   X-Robots-Tag: noindex.

   Скрипт пишет эти правила в out/.htaccess между строками-метками
   «# >>> skrytye-razdely» и «# <<< skrytye-razdely». В исходном
   public/.htaccess между метками пусто: список разделов берётся из
   структуры, руками его не ведут. Сменилась структура или у раздела
   поставили otkryt: true — правила меняются сами при следующей сборке.

   Адреса раздела — по номеру хранения (/zadaniya/6/) и по коду
   (/zadaniya/sluchainye-velichiny/): закрываются оба.

   SKRYTYE=1 (превью pull request): скрытые разделы открыты всем —
   правила 404 не пишутся, остаётся только noindex. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RAZDELY, STRUKTURA, prichinaSkrytiya, skryt } from '../src/content/struktura.js';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const METKA_SKRYTYH = 'budetege_skrytye';
export const NACHALO = '# >>> skrytye-razdely';
export const KONEC = '# <<< skrytye-razdely';

/**
 * Скрытые разделы, у которых в сборке есть страницы.
 * @param {string} out Папка сборки.
 * @returns {{ kod: string, hranenie: number, prichina: string, adresa: string[] }[]}
 */
export function skrytyeVSborke(out) {
  return RAZDELY.filter((r) => skryt(r.kod))
    .map((r) => ({
      kod: r.kod,
      hranenie: r.hranenie,
      prichina: prichinaSkrytiya(r.kod) ?? '',
      /* Папки раздела в сборке: по номеру хранения и по коду. */
      adresa: [String(r.hranenie), r.kod].filter((slug) =>
        fs.existsSync(path.join(out, 'zadaniya', slug, 'index.html')),
      ),
    }))
    .filter((r) => r.adresa.length > 0);
}

/**
 * Правила для .htaccess — строки между метками.
 * @param {ReturnType<typeof skrytyeVSborke>} razdely
 * @param {{ vsem: boolean }} opts vsem — пробная сборка SKRYTYE=1.
 * @returns {string[]}
 */
export function pravila(razdely, { vsem }) {
  if (razdely.length === 0) {
    return ['# Скрытых разделов нет.'];
  }
  const out = [`# Структура экзамена: ${STRUKTURA.id}. Написано сборкой, руками не править.`];
  if (vsem) {
    out.push('# Пробная сборка SKRYTYE=1: разделы открыты всем, 404 не ставится.');
  }
  out.push('<IfModule mod_rewrite.c>', '  RewriteEngine On');
  for (const r of razdely) {
    /* Закрываются оба адреса раздела, даже если в сборке пока один. */
    const adres = `^zadaniya/(${r.hranenie}|${r.kod})(/|$)`;
    out.push(`  # ${r.kod} (номер хранения ${r.hranenie}): ${r.prichina}`);
    out.push(`  RewriteRule ${adres} - [E=SKRYTYY_RAZDEL:1]`);
    if (!vsem) {
      out.push(`  RewriteCond %{HTTP_COOKIE} !(^|;\\s*)${METKA_SKRYTYH}=1(\\s*;|$)`);
      out.push(`  RewriteRule ${adres} - [R=404,L]`);
    }
  }
  out.push('</IfModule>');
  out.push(
    '<IfModule mod_headers.c>',
    '  Header always set X-Robots-Tag "noindex" env=SKRYTYY_RAZDEL',
    /* Своя страница ошибки на хостинге — внутренний переход: имя
       переменной получает приставку REDIRECT_. */
    '  Header always set X-Robots-Tag "noindex" env=REDIRECT_SKRYTYY_RAZDEL',
    /* Ответ зависит от cookie: промежуточный кеш не отдаст страницу
       администратора посетителю и наоборот. */
    '  Header always merge Vary "Cookie" env=SKRYTYY_RAZDEL',
    '</IfModule>',
  );
  return out;
}

/**
 * Вставить правила между метками.
 * @param {string} htaccess Текст .htaccess.
 * @param {string[]} stroki
 * @returns {string}
 */
export function vstavit(htaccess, stroki) {
  const a = htaccess.indexOf(NACHALO);
  const b = htaccess.indexOf(KONEC);
  if (a === -1 || b === -1 || b < a) {
    throw new Error(
      `В .htaccess нет строк-меток «${NACHALO}» и «${KONEC}»: правила скрытых разделов вставить некуда`,
    );
  }
  return `${htaccess.slice(0, a)}${NACHALO}\n${stroki.join('\n')}\n${htaccess.slice(b)}`;
}

/** Правила, которые стоят в .htaccess между метками; null — меток нет. */
export function tekushchie(htaccess) {
  const a = htaccess.indexOf(NACHALO);
  const b = htaccess.indexOf(KONEC);
  if (a === -1 || b === -1 || b < a) return null;
  return htaccess
    .slice(a + NACHALO.length, b)
    .split('\n')
    .filter((line) => line !== '');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const out = path.resolve(
    args.includes('--out') ? args[args.indexOf('--out') + 1] : path.join(APP, 'out'),
  );
  const file = path.join(out, '.htaccess');
  if (!fs.existsSync(file)) {
    console.error(`Нет ${file}: сначала next build.`);
    process.exit(1);
  }
  const vsem = process.env.SKRYTYE === '1';
  const razdely = skrytyeVSborke(out);
  fs.writeFileSync(file, vstavit(fs.readFileSync(file, 'utf8'), pravila(razdely, { vsem })));
  console.log(
    razdely.length === 0
      ? `Скрытые разделы (${STRUKTURA.id}): нет — правил в .htaccess нет.`
      : `Скрытые разделы (${STRUKTURA.id}): ${razdely.map((r) => r.kod).join(', ')} — ` +
          (vsem
            ? 'пробная сборка, открыты всем (только noindex).'
            : 'в .htaccess записаны 404 для посетителей и noindex.'),
  );
}
