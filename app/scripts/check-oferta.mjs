#!/usr/bin/env node
/* scripts/check-oferta.mjs — оферта и реквизиты продавца.

   Часть 1 — без сборки:
     — в оферте 14 разделов по порядку, «Возврат денег» — раздел 8
       (на его якорь ссылаются тарифы);
     — после подстановки нет других скобок, кроме незаполненных [ИНН] и
       [ПОЧТА]; цены, сроки пробного и оплаченного доступа — из конфига
       тарифов;
     — в тексте есть то, без чего оферта не годится: Robokassa, «без
       НДС», галочка «Принимаю условия оферты», 10 дней на возврат,
       30 дней на претензию, ссылки на тарифы, политику и согласие;
     — проверка реквизитов: плейсхолдеры не проходят, верные — проходят;
     — docs/oferta.md совпадает с кодом (pnpm build:oferta).

   Часть 2 — готовый экспорт out/, если он есть. Флаг
   NEXT_PUBLIC_LEGAL_READY выключен, поэтому:
     — страницы /oferta/ нет (если сборка превью с OFERTA_PREVIEW=1 —
       страница есть, но закрыта от поиска и с плашкой черновика);
     — ни одна страница не ссылается на /oferta/;
     — в подвале нет реквизитов продавца (ИНН), в ответе про возврат
       на /tarify/ — ссылки на оферту.

   Запуск: pnpm test:oferta (после сборки — обе части). */

import fs from 'node:fs';
import path from 'node:path';
import { APP, requireSrc } from './lib/load-ts.mjs';
import { prodavetsProblems } from '../src/lib/legal/prodavetsProblems.mjs';
import { OFERTA_DOCS, sobratOfertu } from './build-oferta.mjs';

const problems = [];
const fail = (text) => problems.push(text);

/* ── Часть 1: текст ───────────────────────────────────────────── */

const { zapolnitOfertu } = requireSrc('lib/legal/oferta.ts');
const { parseLegal } = requireSrc('lib/legal/markdown.ts');
const { ofertaDoc } = requireSrc('content/legal/documents.ts');
const c = requireSrc('lib/tarify/config.ts');

const md = fs.readFileSync(path.join(APP, 'src', 'content', 'legal', 'oferta.md'), 'utf8');
const tekst = zapolnitOfertu(md);
const bloki = parseLegal(tekst);
const razdely = bloki.filter((b) => b.type === 'h');

const ZHDYOM = [
  'Термины',
  'Предмет',
  'договор',
  'Тарифы и цены',
  'Пробный доступ',
  'Оплата',
  'Права и обязанности',
  'Возврат',
  'Несовершеннолетние',
  'Ответственность',
  'Персональные данные',
  'Изменение оферты',
  'Споры',
  'Реквизиты',
];
if (razdely.length !== ZHDYOM.length) {
  fail(`разделов ${razdely.length}, ждали ${ZHDYOM.length}`);
}
ZHDYOM.forEach((slovo, i) => {
  const r = razdely[i];
  if (!r || r.id !== `razdel-${i + 1}` || !r.text.includes(slovo)) {
    fail(`раздел ${i + 1}: ждали «${slovo}», а там «${r?.text ?? '—'}»`);
  }
});
const vozvrat = razdely.find((r) => r.id === ofertaDoc.yakorVozvrata);
if (!vozvrat?.text.includes('Возврат')) {
  fail(`якорь ${ofertaDoc.yakorVozvrata} ведёт не на «Возврат денег»`);
}

const skobki = new Set(tekst.match(/\[[^\]]+\]/g) ?? []);
for (const s of skobki) {
  /* [ЧАСОВ] — срок открытия доступа, пока владелец его не назвал;
     с флагом публикации такая сборка падает (prodavetsProblems). */
  if (s !== '[ИНН]' && s !== '[ПОЧТА]' && s !== '[ЧАСОВ]') fail(`после подстановки осталось ${s}`);
}

const ploskiy = tekst.replace(/\*\*/g, '');
const est = (frag, zachem) => {
  if (!ploskiy.includes(frag)) fail(`нет «${frag}» (${zachem})`);
};
est(`на ${c.PROBNYY_SROK}`, 'срок пробного доступа из конфига');
est(`${c.PERIOD_DNEY} дней`, 'оплаченный срок из конфига');
for (const rol of ['uchenik', 'repetitor']) {
  const t = c.PLATNYE[rol];
  est(`«${t.nazvanie}» — ${c.rubli(t.tsena30)}`, `цена за 30 дней, ${t.nazvanie}`);
  for (const stupen of t.doEge) est(c.rubli(stupen.tsena), `ступень «До ЕГЭ», ${t.nazvanie}`);
}
est('Систему быстрых платежей', 'способ оплаты');
est('«Мой налог»', 'чек самозанятой');
est('«Я оплатил(а)»', 'кнопка заявки об оплате');
est('включается сам', 'пробный доступ после регистрации');
if (/Robokassa|сразу после оплаты|чем ближе экзамен/.test(ploskiy)) {
  fail(
    'в оферте остались прежние условия: Robokassa, «сразу после оплаты» или «чем ближе экзамен»',
  );
}
est('без НДС', 'цены без НДС');
est('налог на профессиональный доход', 'статус исполнителя');
est('один раз на аккаунт', 'пробный доступ');
est('Автопродления нет', 'без автопродления');
est('в течение 10 дней', 'срок возврата');
est('в течение 30 дней', 'претензионный порядок');
est('не гарантирует конкретный балл', 'ответственность');
const g = c.TARIFY_TEXT.galochkaOferty;
est(`«${g.tekst} ${g.ssylka}»`, 'галочка в форме оплаты');
for (const adres of ['budetege.ru/tarify', 'budetege.ru/politika', 'budetege.ru/soglasie']) {
  est(adres, 'ссылка на документ');
}

/* Реквизиты. */
const OK = { telegram: 'nataliy_bagaeva', srokOtkrytiyaChasov: '24', dataOferty: '12.11.2026' };
if (prodavetsProblems({ ...OK, inn: '[ИНН]', pochta: '[ПОЧТА]' }).length !== 2) {
  fail('проверка реквизитов пропустила плейсхолдеры');
}
if (prodavetsProblems({ ...OK, inn: '1234567890', pochta: 'a@b.ru' }).length !== 1) {
  fail('ИНН из 10 цифр (организации) принят за ИНН самозанятой');
}
if (
  prodavetsProblems({
    ...OK,
    inn: '123456789012',
    pochta: 'a@b.ru',
    srokOtkrytiyaChasov: '[ЧАСОВ]',
  }).length !== 1
) {
  fail('проверка реквизитов пропустила незаполненный срок открытия доступа');
}
if (
  prodavetsProblems({ ...OK, inn: '123456789012', pochta: 'a@b.ru', telegram: '@x' }).length !== 1
) {
  fail('проверка реквизитов пропустила неверный Telegram');
}
if (prodavetsProblems({ ...OK, inn: '123456789012', pochta: 'a@b.ru' }).length) {
  fail('верные реквизиты не приняты');
}

/* docs/oferta.md. */
if (!fs.existsSync(OFERTA_DOCS) || fs.readFileSync(OFERTA_DOCS, 'utf8') !== sobratOfertu()) {
  fail('docs/oferta.md отстал от кода — запустите pnpm build:oferta');
}

/* ── Часть 2: экспорт ─────────────────────────────────────────── */

const OUT = path.join(APP, 'out');

function htmlFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '_next') out.push(...htmlFiles(full));
    } else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

let stranic = 0;
if (fs.existsSync(path.join(OUT, 'index.html'))) {
  if (process.env.NEXT_PUBLIC_LEGAL_READY === '1') {
    fail('проверка ждёт сборку с выключенным NEXT_PUBLIC_LEGAL_READY');
  }
  const oferta = path.join(OUT, 'oferta', 'index.html');
  if (fs.existsSync(oferta)) {
    /* Сборка превью (OFERTA_PREVIEW=1): черновик закрыт от поиска. */
    const html = fs.readFileSync(oferta, 'utf8');
    if (!/<meta name="robots" content="noindex, ?nofollow"/.test(html)) {
      fail('/oferta/: черновик без noindex');
    }
    if (!html.includes('Черновик на вычитку')) fail('/oferta/: нет плашки черновика');
    if (!html.includes('id="razdel-8"')) fail('/oferta/: нет якоря раздела «Возврат денег»');
  }
  for (const file of htmlFiles(OUT)) {
    const rel = path.relative(OUT, file);
    if (rel.startsWith(`oferta${path.sep}`)) continue;
    stranic++;
    const html = fs.readFileSync(file, 'utf8');
    if (/href="\/oferta\//.test(html)) fail(`${rel}: ссылка на неопубликованную оферту`);
    if (html.includes('site-foot__rekvizity')) fail(`${rel}: реквизиты в подвале без флага`);
  }
}

if (problems.length > 0) {
  console.error(`Оферта: ${problems.length} проблем(ы):`);
  for (const p of problems) console.error(`  — ${p}`);
  process.exit(1);
}
console.log(
  `Оферта: текст в порядке (${razdely.length} разделов)${stranic ? `; страниц проверено: ${stranic}, ссылок на оферту и реквизитов без флага нет` : ''}.`,
);
