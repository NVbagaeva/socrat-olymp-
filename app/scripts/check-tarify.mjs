#!/usr/bin/env node
/* scripts/check-tarify.mjs — тарифы: единый конфиг и выключенная оплата.

   Часть 1 — конфиг (lib/tarify/config.ts), без сборки:
     — цены за 30 дней и ступени «До ЕГЭ» — утверждённые числа;
     — цена «До ЕГЭ» по ступеням только снижается, а за месяц до
       экзамена срок не продаётся;
     — в каждой плашке 5–7 пунктов «входит» и 1–2 «нет»;
     — в каждой плашке и в таблице сравнения есть методические подсказки.

   Часть 2 — готовый экспорт out/ (после pnpm build), если он есть:
     — /tarify/ собрана, ссылка «Тарифы» есть в шапке и подвале главной;
     — флаг NEXT_PUBLIC_PAYMENTS_ENABLED выключен — значит, во всём
       сайте нет ни одной активной кнопки оплаты: ни ссылки на
       регистрацию с тарифом, ни кнопки data-oplata="vklyuchena";
       кнопки оплаты на /tarify/ все неактивны (disabled);
     — разметки Offer нет (страницу /oferta/ и ссылки на неё проверяет
       scripts/check-oferta.mjs);
     — «мягкой стены» нет нигде, кроме служебной витрины.

   Запуск: node scripts/check-tarify.mjs (после сборки — обе части). */

import fs from 'node:fs';
import path from 'node:path';
import { APP, requireSrc } from './lib/load-ts.mjs';

const problems = [];
const fail = (text) => problems.push(text);

/* ── Часть 1: конфиг ──────────────────────────────────────────── */

const config = requireSrc('lib/tarify/config.ts');
const { PLATNYE, BESPLATNO, PROBNYY, KLASS_MAKS, PODSKAZKI, SRAVNENIE } = config;

const UTVERZHDENO = {
  uchenik: { tsena30: 390, doEge: [1990, 1590, 1290, 990, 690] },
  repetitor: { tsena30: 890, doEge: [4990, 3990, 2990, 2290, 1590] },
};
for (const [rol, zhdyom] of Object.entries(UTVERZHDENO)) {
  const tarif = PLATNYE[rol];
  if (tarif.tsena30 !== zhdyom.tsena30) {
    fail(`${rol}: цена за 30 дней ${tarif.tsena30}, утверждено ${zhdyom.tsena30}`);
  }
  const ceny = tarif.doEge.map((s) => s.tsena);
  if (JSON.stringify(ceny) !== JSON.stringify(zhdyom.doEge)) {
    fail(`${rol}: ступени «До ЕГЭ» ${ceny.join(', ')}, утверждено ${zhdyom.doEge.join(', ')}`);
  }
  for (let i = 1; i < tarif.doEge.length; i++) {
    if (tarif.doEge[i].tsena >= tarif.doEge[i - 1].tsena) {
      fail(`${rol}: ступень ${tarif.doEge[i].s} не дешевле предыдущей`);
    }
    if (tarif.doEge[i].s <= tarif.doEge[i - 1].s) {
      fail(`${rol}: ступени «До ЕГЭ» не по порядку дат`);
    }
  }
}

const SLUCHAI = [
  ['uchenik', '2026-11-11', 1990],
  ['uchenik', '2027-01-31', 1990],
  ['uchenik', '2027-02-01', 1590],
  ['uchenik', '2027-05-31', 690],
  ['uchenik', '2027-06-01', null],
  ['repetitor', '2026-11-11', 4990],
  ['repetitor', '2027-04-15', 2290],
  ['repetitor', '2027-06-30', null],
];
for (const [rol, data, zhdyom] of SLUCHAI) {
  const est = config.tsenaDoEge(rol, data);
  if (est !== zhdyom) fail(`tsenaDoEge(${rol}, ${data}) = ${est}, ждали ${zhdyom}`);
}
if (config.tsena('uchenik', 'd30', '2027-06-15') !== 390) {
  fail('30 дней должны продаваться и после окончания продаж «До ЕГЭ»');
}
if (config.rubli(1990) !== '1 990 ₽') fail(`rubli(1990) = ${config.rubli(1990)}`);

if (
  BESPLATNO.trenazherVDen !== 10 ||
  BESPLATNO.variantovOnlayn !== 1 ||
  BESPLATNO.generatorVDen !== 1
) {
  fail('лимиты бесплатного доступа не совпадают с утверждёнными (10 / 1 / 1)');
}
if (PROBNYY.dney !== 3 || PROBNYY.raz !== 1) fail('пробный доступ — 3 дня, один раз');
if (config.PROBNYY_SROK !== '3 дня') fail(`срок пробного словами: «${config.PROBNYY_SROK}»`);
if (KLASS_MAKS !== 30) fail('класс репетитора — до 30 учеников');

/* Срок пробного доступа в базе (public.probnyy_dney) — то же число. */
{
  const sql = fs.readFileSync(
    path.join(APP, '..', 'supabase', 'migrations', '20261114120000_otkrytaya_registraciya.sql'),
    'utf8',
  );
  const vBaze = /function public\.probnyy_dney\(\)[\s\S]*?select (\d+)/.exec(sql)?.[1];
  if (Number(vBaze) !== PROBNYY.dney) {
    fail(`пробный доступ: в базе ${vBaze} дн., в конфиге ${PROBNYY.dney}`);
  }
}

for (const rol of ['uchenik', 'repetitor']) {
  for (const plashka of config.plashki(rol)) {
    const kto = `${rol}/${plashka.id}`;
    if (plashka.vhodit.length < 5 || plashka.vhodit.length > 7) {
      fail(`${kto}: пунктов «входит» ${plashka.vhodit.length}, нужно 5–7`);
    }
    if (plashka.net.length < 1 || plashka.net.length > 2) {
      fail(`${kto}: серых пунктов ${plashka.net.length}, нужно 1–2`);
    }
    if (!plashka.vhodit.some((punkt) => /подсказ/i.test(punkt))) {
      fail(`${kto}: нет пункта про методические подсказки`);
    }
  }
}
const strokaPodskazok = SRAVNENIE.find((s) => /подсказ/i.test(s.vozmozhnost));
if (
  !strokaPodskazok ||
  ![strokaPodskazok.besplatno, strokaPodskazok.uchenik, strokaPodskazok.repetitor].every(
    (v) => v === true,
  )
) {
  fail('в таблице сравнения подсказки должны входить во все тарифы');
}
if (PODSKAZKI.primery.length !== 3) fail('блок подсказок — три пункта');

/* ── Часть 2: готовый экспорт ─────────────────────────────────── */

const OUT = path.join(APP, 'out');

function htmlFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...htmlFiles(full));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

let proverenoStranic = 0;
if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.log('out/ нет — проверен только конфиг (для полной проверки сначала pnpm build).');
} else {
  if (process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === '1') {
    fail(
      'проверка ждёт сборку с выключенной оплатой: NEXT_PUBLIC_PAYMENTS_ENABLED не должен быть 1',
    );
  }
  const tarify = path.join(OUT, 'tarify', 'index.html');
  if (!fs.existsSync(tarify)) {
    fail('нет out/tarify/index.html');
  } else {
    const html = fs.readFileSync(tarify, 'utf8');
    const knopki = [...html.matchAll(/<(button|a|span)\b[^>]*data-oplata="([a-z]+)"[^>]*>/g)];
    if (knopki.length === 0) fail('/tarify/: не найдено ни одной кнопки оплаты');
    for (const [tag, el, sostoyanie] of knopki) {
      if (sostoyanie !== 'vyklyuchena' || el !== 'button' || !/\sdisabled(=""|\s|>)/.test(tag)) {
        fail(`/tarify/: активная кнопка оплаты: ${tag.slice(0, 120)}`);
      }
    }
    if (!html.includes('Оплата скоро откроется'))
      fail('/tarify/: нет подписи «Оплата скоро откроется»');
    if (!html.includes('Начать заниматься')) fail('/tarify/: нет кнопки «Начать заниматься»');
    if (/<input[^>]+type="email"/.test(html)) fail('/tarify/: на странице есть поле почты');
  }

  const index = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');
  const ssylok = (index.match(/href="\/tarify\/"/g) ?? []).length;
  if (ssylok < 2) fail(`главная: ссылок «Тарифы» ${ssylok}, ждали в шапке и подвале`);
  if (!index.includes('Начать бесплатно')) fail('главная: пропала кнопка «Начать бесплатно»');

  for (const file of htmlFiles(OUT)) {
    proverenoStranic++;
    const rel = path.relative(OUT, file);
    const html = fs.readFileSync(file, 'utf8');
    if (html.includes('data-oplata="vklyuchena"')) fail(`${rel}: активная кнопка оплаты`);
    if (/href="\/voyti\/\?[^"]*tarif=/.test(html)) fail(`${rel}: ссылка на оплату тарифа`);
    if (/"@type":"Offer"/.test(html)) fail(`${rel}: разметка Offer при выключенной оплате`);
    if (html.includes('tf-stena') && !rel.startsWith(`styleguide${path.sep}tarify`)) {
      fail(`${rel}: «мягкая стена» на боевой странице`);
    }
  }
}

if (problems.length > 0) {
  console.error(`Тарифы: ${problems.length} проблем(ы):`);
  for (const p of problems) console.error(`  — ${p}`);
  process.exit(1);
}
console.log(
  `Тарифы: конфиг в порядке${proverenoStranic ? `; страниц проверено: ${proverenoStranic}, активных кнопок оплаты нет` : ''}.`,
);
