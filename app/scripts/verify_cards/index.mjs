#!/usr/bin/env node
/* scripts/verify_cards — проверка колод карточек по теории.

   Ошибочная карточка не публикуется: скрипт падает, и сборка с ней
   не проходит проверку. Что проверяется:
     — устройство: id уникальны во всех колодах, номер задания и
       подтема существуют, у «верно / неверно» есть ответ и оборот
       начинается с «Верно» или «Неверно» в согласии с ним;
     — «Повторить теорию»: якорь `source` есть во вкладке «Теория»
       своего номера (или карточка помечена «добавлено»);
     — формулы: каждый текст набирается KaTeX строго;
     — чертежи: каждый рисуется движком своего номера;
     — вычисления (тип 5): ответ в записи ЕГЭ (целое или конечная
       десятичная дробь) и совпадает с независимым пересчётом;
     — формулы (проверки колоды): 200 случайных фигур на формулу,
       формула сходится с прямым счётом до 1e-6;
     — Лейтнер: переходы коробок, повтор «Не знаю» в сессии, быстрая
       проверка без влияния на коробки;
     — списки колод (index.ts, spisok.ts) не устарели.

   Запуск: pnpm test:kartochki. Печатает сводку по номерам и подтемам
   и список карточек «добавлено». */

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireSrc } from '../lib/load-ts.mjs';
import { yakorya } from './yakorya.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const oshibki = [];
const fail = (msg) => oshibki.push(msg);

/* Списки колод — свежие. */
try {
  execFileSync('node', [path.join(HERE, '..', 'build-kartochki.mjs'), '--check'], {
    stdio: 'pipe',
  });
} catch (e) {
  fail(String(e.stderr ?? e.message).trim());
}

const { KOLODY } = requireSrc('content/kartochki/index');
const { typeset } = requireSrc('lib/tex');
const { narisovat, podgotovit } = requireSrc('lib/kartochki/podgotovka');
const { otpechatok, VERNO, NEVERNO } = requireSrc('lib/kartochki/otvet');
const { parseAnswer } = requireSrc('lib/answer');
const L = requireSrc('lib/kartochki/leitner');

/* Детерминированный генератор: прогоны повторяемы. */
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function katex(text, gde) {
  try {
    typeset(text, true);
  } catch (e) {
    fail(`${gde}: формула не набирается — ${e.message}`);
  }
}

/* Ответ ЕГЭ: целое или конечная десятичная дробь, запятая. */
const OTVET_EGE = /^-?\d+(,\d+)?$/;

const vseId = new Set();
const dobavleno = [];
const svodka = [];

for (const k of KOLODY) {
  const temy = new Set(k.podtemy.map((t) => t.id));
  const nashi = new Set(k.kartochki.map((c) => c.id));
  let anchors = null;
  try {
    anchors = yakorya(k.task);
  } catch (e) {
    fail(`№${k.task}: якоря теории не собраны — ${e.message}`);
  }
  if (anchors === undefined)
    console.warn(`№${k.task}: якоря теории не проверяются (нет в yakorya.mjs)`);
  if (k.slug !== String(k.task)) fail(`№${k.task}: slug «${k.slug}» не совпадает с номером`);
  k.podtemy.forEach((t) => katex(t.title, `№${k.task} подтема ${t.id}`));

  const poTemam = Object.fromEntries(k.podtemy.map((t) => [t.id, 0]));
  const poTipam = {};
  for (const c of k.kartochki) {
    const gde = `№${k.task} ${c.id}`;
    if (vseId.has(c.id)) fail(`${gde}: id повторяется`);
    vseId.add(c.id);
    if (c.task !== k.task) fail(`${gde}: task ${c.task} в колоде №${k.task}`);
    if (!temy.has(c.topic)) fail(`${gde}: нет подтемы «${c.topic}»`);
    else poTemam[c.topic] += 1;
    poTipam[c.type] = (poTipam[c.type] ?? 0) + 1;
    if (c.level !== 'база' && c.level !== 'важно для ЕГЭ') fail(`${gde}: уровень «${c.level}»`);
    if (c.front.trim() === '' || c.back.trim() === '') fail(`${gde}: пустая сторона`);

    for (const [pole, text] of [
      ['front', c.front],
      ['back', c.back],
      ['pochemu', c.pochemu],
    ]) {
      if (text !== undefined) katex(text, `${gde}.${pole}`);
      /* Две формулы через \quad в одном $…$ не переносятся и на 375 px
         вылезают за карточку: пишем их отдельными $…$ через запятую. */
      if (text !== undefined && /\\q?quad/.test(text))
        fail(`${gde}.${pole}: формулы через \\quad — разбейте на отдельные $…$`);
    }

    if (c.source === 'добавлено') {
      dobavleno.push(`№${k.task} · ${c.id}: ${c.front.replace(/\$/g, '')}`);
    } else if (anchors && !anchors.has(c.source)) {
      fail(`${gde}: якоря «#${c.source}» нет во вкладке «Теория» №${k.task}`);
    }

    if (c.figure !== undefined) {
      try {
        const svg = narisovat(c.id, c.figure);
        if (svg.length === 0 || svg.some((s) => !s.includes('<'))) fail(`${gde}: пустой чертёж`);
      } catch (e) {
        fail(`${gde}: чертёж не рисуется — ${e.message}`);
      }
    }
    if (c.type === 'chertezh' && c.figure === undefined)
      fail(`${gde}: у карточки «чертёж» нет чертежа`);

    if (c.type === 'verno') {
      if (typeof c.verno !== 'boolean') fail(`${gde}: нет ответа «верно / неверно»`);
      const nachalo = c.verno ? /^Верно/ : /^Неверно/;
      if (!nachalo.test(c.back))
        fail(`${gde}: оборот не согласован с ответом (${c.verno ? 'верно' : 'неверно'})`);
    }

    if (c.type === 'vychislenie') {
      if (!OTVET_EGE.test(c.otvet)) fail(`${gde}: ответ «${c.otvet}» не в записи ЕГЭ`);
      const nado = parseAnswer(c.otvet);
      let schet;
      try {
        schet = c.proverka();
      } catch (e) {
        fail(`${gde}: пересчёт упал — ${e.message}`);
      }
      if (
        nado === null ||
        typeof schet !== 'number' ||
        !(Math.abs(nado - schet) < 1e-6 * Math.max(1, Math.abs(nado)))
      ) {
        fail(`${gde}: ответ ${c.otvet}, пересчёт даёт ${schet}`);
      }
      /* Ответ стоит в обороте — ученик видит то же число. */
      if (!c.back.replace(/\{,\}/g, ',').includes(c.otvet))
        fail(`${gde}: ответа ${c.otvet} нет на обороте`);
    }
  }

  /* Что уходит в браузер: ни ответа, ни верно/неверно открыто. */
  const gotovaya = podgotovit(k, `/zadaniya/${k.task}`);
  const json = JSON.stringify(gotovaya);
  if (/"(otvet|verno)":/.test(json)) fail(`№${k.task}: в данные страницы попал открытый ответ`);
  for (const g of gotovaya.kartochki) {
    const src = k.kartochki.find((c) => c.id === g.id);
    if (src.type === 'vychislenie') {
      if (!otpechatok.answerMatches(src.otvet, g.otpechatok))
        fail(`${g.id}: отпечаток не сходится с ответом ${src.otvet}`);
    }
    if (src.type === 'verno') {
      if (!otpechatok.choiceMatches(src.verno ? VERNO : NEVERNO, g.otpechatok))
        fail(`${g.id}: отпечаток верно/неверно не сходится`);
    }
    if (src.type === 'verno' || src.type === 'vychislenie') {
      if (g.back !== '' || g.zakryto === undefined) fail(`${g.id}: оборот с автопроверкой открыт`);
      else {
        const oborot = JSON.parse(otpechatok.openText(g.zakryto, g.id));
        if (typeof oborot.back !== 'string' || oborot.back.trim() === '')
          fail(`${g.id}: после ответа оборот пуст`);
      }
    }
  }

  /* Проверки формул: случайные фигуры. */
  const proverennye = new Set();
  for (const p of k.proverki ?? []) {
    if (!nashi.has(p.kartochka))
      fail(`№${k.task}: проверка для несуществующей карточки ${p.kartochka}`);
    proverennye.add(p.kartochka);
    const rnd = mulberry(p.kartochka.length * 7919 + k.task);
    for (let i = 0; i < 200; i += 1) {
      const { poFormule, pryamo } = p.sluchay(rnd);
      if (
        !Number.isFinite(poFormule) ||
        !Number.isFinite(pryamo) ||
        Math.abs(poFormule - pryamo) > 1e-6 * Math.max(1, Math.abs(pryamo))
      ) {
        fail(
          `№${k.task} ${p.kartochka}: формула ${poFormule} ≠ прямой счёт ${pryamo} (случай ${i + 1})`,
        );
        break;
      }
    }
  }
  const bezProverki = k.kartochki
    .filter((c) => c.type === 'formula' && !proverennye.has(c.id))
    .map((c) => c.id);

  for (const [t, n] of Object.entries(poTemam))
    if (n === 0) fail(`№${k.task}: в подтеме «${t}» нет карточек`);
  svodka.push({ k, poTemam, poTipam, proverennye: proverennye.size, bezProverki });
}

/* ── Лейтнер ── */
{
  let p = {};
  p = L.otsenit(p, 'a', true);
  if (L.korobka(p, 'a') !== 2) fail('Лейтнер: новая + «Знаю» → коробка 2');
  for (let i = 0; i < 5; i += 1) p = L.otsenit(p, 'a', true);
  if (L.korobka(p, 'a') !== L.KOROBOK || !L.vyuchena(p, 'a'))
    fail('Лейтнер: выше 5-й коробки не поднимается, 5-я — выучена');
  p = L.otsenit(p, 'a', false);
  if (L.korobka(p, 'a') !== 1) fail('Лейтнер: «Не знаю» → коробка 1');
  if (!L.neznakoma(p, 'a') || !L.neznakoma(p, 'новая'))
    fail('Лейтнер: незнакомые — новые и коробка 1');

  const kart = 'abcdefghijkl'.split('').map((id, i) => ({ id, topic: i < 6 ? 't1' : 't2' }));
  const rnd = mulberry(1);
  let s = L.novayaSessiya('vse', L.sobratOchered('vse', kart, {}, rnd));
  const pervaya = L.tekushchaya(s);
  s = L.otmetit(s, false);
  if (s.ochered[s.poz + L.SDVIG_POVTORA] !== pervaya)
    fail('Лейтнер: «Не знаю» возвращается через SDVIG_POVTORA карточек');
  while (!L.zakonchena(s)) s = L.otmetit(s, true);
  const it = L.itog(s, kart);
  if (it.povtorit !== 1 || it.znayu !== 11 || it.slabye.length !== 1)
    fail(`Лейтнер: итог сессии ${JSON.stringify(it)}`);

  const b = L.novayaSessiya('bystro', L.sobratOchered('bystro', kart, {}, rnd));
  if (b.ochered.length !== L.BYSTRO_KARTOCHEK || new Set(b.ochered).size !== L.BYSTRO_KARTOCHEK)
    fail('Быстрая проверка: 10 разных карточек');
  const b2 = L.otmetit(b, false);
  if (b2.ochered.length !== b.ochered.length || L.menyaetKorobki(b2))
    fail('Быстрая проверка: без повтора и без коробок');

  const vyuch = { a: { b: 5, n: 4 }, b: { b: 3, n: 2 } };
  const och = L.sobratOchered('vse', kart, vyuch, rnd);
  if (och[och.length - 1] !== 'a' || och[och.length - 2] !== 'b')
    fail('Очередь: старшие коробки — в конце');
  const nz = L.sobratOchered('neznakomye', kart, vyuch, rnd);
  if (nz.includes('a') || nz.includes('b') || nz.length !== 10)
    fail('«Только незнакомые»: без коробок 2–5');
  const tm = L.sobratOchered('temy', kart, {}, rnd, ['t2']);
  if (tm.length !== 6 || tm.some((id) => kart.find((x) => x.id === id).topic !== 't2'))
    fail('«По подтемам»: только отмеченные');
}

/* ── Сводка ── */
for (const { k, poTemam, poTipam, proverennye, bezProverki } of svodka) {
  console.log(`\n№${k.task} ${k.title}: ${k.kartochki.length} карточек`);
  for (const t of k.podtemy)
    console.log(`  ${String(poTemam[t.id]).padStart(3)}  ${t.title.replace(/\$/g, '')}`);
  console.log(
    `  типы: ${Object.entries(poTipam)
      .map(([t, n]) => `${t} ${n}`)
      .join(', ')}`,
  );
  console.log(`  формулы проверены на случайных фигурах: ${proverennye}`);
  if (bezProverki.length > 0)
    console.log(
      `  формулы без численной проверки (определения словами): ${bezProverki.join(', ')}`,
    );
}
console.log(`\n«добавлено» (нет в теории приложения): ${dobavleno.length}`);
dobavleno.forEach((d) => console.log(`  ${d}`));

if (oshibki.length > 0) {
  console.error(`\nОшибок: ${oshibki.length}`);
  oshibki.forEach((o) => console.error(`  ✗ ${o}`));
  process.exit(1);
}
console.log('\nКарточки: всё сходится.');
