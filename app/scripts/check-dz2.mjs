#!/usr/bin/env node
/* scripts/check-dz2.mjs — новая выдача ДЗ в браузере учителя (без сборки).

   Запуск: pnpm test:dz2

   Чистые функции src/lib/dz2 (docs/kabinet-dz2.md):
     • корзина: добавить без дублей, убрать, сдвинуть, предел 30, разбор
       из хранилища;
     • настройки: контрольная (одна попытка, без подсказок), время по
       Москве ↔ UTC, что мешает выдать;
     • запрос dz2_save: позиции элементов и задач, цели только у
       тренажёра, индивидуальные задачи с учеником, у шаблона — без целей;
     • нормальная запись ответа — та же таблица случаев, что у базы
       (normalizeCases.json);
     • задачи на настоящих генераторах: запас тренажёра №5 и №8 по
       выбранным типам — без повторов, ответы в нормальной записи;
       каждый тип тренажёра №5 и №8 есть у генератора; блоки опорных
       №8 и №5 собираются целиком (кроме задач с выбором варианта). */

import fs from 'node:fs';
import path from 'node:path';
import { requireSrc, SRC } from './lib/load-ts.mjs';

const M = requireSrc('lib/dz2/model.ts');
const Z = requireSrc('lib/dz2/zadachi.ts');

let checks = 0;
const failures = [];
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
}

/* ── Корзина ────────────────────────────────────────────────────── */
{
  const e = (key, vid = 'teoriya') => ({ key, vid, task_no: 5, title: key, spec: {} });
  let k = M.PUSTAYA_KORZINA;
  k = M.dobavit(k, e('a'));
  k = M.dobavit(k, e('b'));
  k = M.dobavit(k, { ...e('a'), title: 'новое' });
  check(k.elementy.length === 2 && k.elementy[0].title === 'новое', 'повтор того же элемента обновляет, а не дублирует');
  k = M.sdvinut(k, 'b', -1);
  check(k.elementy[0].key === 'b', 'сдвиг вверх');
  check(M.sdvinut(k, 'b', -1) === k, 'первый выше не сдвигается');
  k = M.ubrat(k, 'b');
  check(k.elementy.length === 1, 'убрать');
  let big = M.PUSTAYA_KORZINA;
  for (let i = 0; i < 40; i += 1) big = M.dobavit(big, e(`k${i}`));
  check(big.elementy.length === M.PREDEL_ELEMENTOV, 'не больше 30 элементов');
  check(M.razobrat({ v: 1, elementy: [e('x'), { key: 1 }, { ...e('y'), vid: 'chto-to' }] }).elementy.length === 1,
    'мусор из хранилища отброшен');
  check(M.razobrat(null).elementy.length === 0, 'пустое хранилище — пустая корзина');
}

/* ── Настройки и время по Москве ───────────────────────────────── */
{
  check(M.mskVUtc('2026-11-27T18:00') === '2026-11-27T15:00:00.000Z', '18:00 по Москве — 15:00 UTC');
  check(M.utcVMsk('2026-11-27T15:00:00.000Z') === '2026-11-27T18:00', 'обратно — 18:00');
  check(M.mskVUtc('27.11.2026') === null, 'неверная дата — null');
  const kr = M.kontrolnaya({ ...M.NASTROYKI_PO_UMOLCHANIYU, due_msk: '2026-11-27T18:00' }, true);
  check(kr.kontrol && !kr.hints_allowed && kr.attempts_limit === 1 && kr.solutions_when === 'after_due',
    'контрольная: одна попытка, без подсказок, решения после дедлайна');
  const kr2 = M.kontrolnaya(M.NASTROYKI_PO_UMOLCHANIYU, true);
  check(kr2.solutions_when === 'never', 'контрольная без дедлайна — решения никогда');
  check(!M.kontrolnaya(kr, false).kontrol && M.kontrolnaya(kr, false).hints_allowed, 'выключить контрольную');

  const now = Date.parse('2026-11-24T12:00:00Z');
  const k = { v: 1, elementy: [{ key: 't', vid: 'trenazher', task_no: 8, title: 'T', spec: {}, zapas: 5, goal_kind: 'count', goal_n: 8 }] };
  const o = M.proverit(k, { ...M.NASTROYKI_PO_UMOLCHANIYU, due_msk: '2026-11-20T10:00', solutions_when: 'after_due' }, now);
  check(['net_nazvaniya', 'net_poluchateley', 'srok_proshel', 'cel_bolshe_zapasa'].every((x) => o.includes(x)),
    `что мешает выдать: ${o.join(', ')}`);
  const o2 = M.proverit(k, { ...M.NASTROYKI_PO_UMOLCHANIYU, title: 'x', klassy: ['c'], solutions_when: 'after_due',
    publish_msk: '2026-11-30T10:00', due_msk: '2026-11-29T10:00' }, now);
  check(o2.includes('srok_ranshe_publikacii'), 'дедлайн раньше публикации');
  const o3 = M.proverit({ v: 1, elementy: [] }, { ...M.NASTROYKI_PO_UMOLCHANIYU, solutions_when: 'after_due' }, now);
  check(o3.includes('net_elementov') && o3.includes('reshenia_bez_sroka'), 'пустая корзина и решения без срока');
}

/* ── Запрос dz2_save ───────────────────────────────────────────── */
{
  const task = (a) => ({ kind: '8.A', task_ref: `8.A|${a}|base`, question_html: `<p>${a}</p>`, answer: a });
  const k = {
    v: 1,
    elementy: [
      { key: 'op', vid: 'opornye', task_no: 8, title: 'Опорные', spec: { blok: 'P8-1' }, tasks: [task('1'), task('2')] },
      { key: 'tr', vid: 'trenazher', task_no: 8, title: 'Тренажёр', spec: { tipy: ['8.A'] }, tipy: ['8.A'], zapas: 3, goal_kind: 'streak', goal_n: 2 },
      { key: 'te', vid: 'teoriya', task_no: 5, title: 'Глава', spec: { glava: 'x' }, goal_kind: 'count', goal_n: 4 },
    ],
  };
  const n = { ...M.NASTROYKI_PO_UMOLCHANIYU, title: ' ДЗ ', klassy: ['c1'], ucheniki: ['s9'], due_msk: '2026-11-27T18:00' };
  const z = { op: { obshchie: k.elementy[0].tasks }, tr: { poUchenikam: { s1: [task('5'), task('6')], s2: [task('7')] } } };
  const r = M.zapros(k, n, z, 'draft', 'id-1');
  check(r.id === 'id-1' && r.title === 'ДЗ' && r.due_at === '2026-11-27T15:00:00.000Z', 'шапка запроса');
  check(JSON.stringify(r.targets) === '[{"class_id":"c1"},{"student_id":"s9"}]', 'цели: класс и ученик');
  check(r.items.map((i) => i.position).join() === '1,2,3', 'позиции элементов');
  check(r.items[0].tasks.map((t) => t.position).join() === '1,2', 'позиции задач');
  check(r.items[1].goal_kind === 'streak' && r.items[1].goal_n === 2, 'цель тренажёра');
  check(r.items[2].goal_kind === 'all' && r.items[2].goal_n === null, 'цель есть только у тренажёра');
  check(r.items[1].tasks.length === 3 && r.items[1].tasks.filter((t) => t.student_id === 's1').length === 2,
    'индивидуальные задачи — с учеником');
  const tpl = M.zapros(k, n, z, 'template');
  check(tpl.targets.length === 0 && tpl.id === undefined, 'шаблон — без целей и новым');
}

/* ── Нормальная запись ответа — как у базы ─────────────────────── */
{
  const cases = JSON.parse(
    fs.readFileSync(path.join(SRC, 'lib', 'variant', 'online', 'normalizeCases.json'), 'utf8'),
  ).cases;
  let bad = 0;
  for (const [vvod, ozhid] of cases) {
    const v = M.normalnayaZapis(vvod);
    const ok = /^-?[0-9]+(\.[0-9]+)?$/.test(ozhid) ? v === ozhid : v === null;
    if (!ok) bad += 1;
  }
  check(bad === 0, `нормальная запись расходится с базой в ${bad} случаях`);
  check(M.normalnayaZapis('−2,50') === '-2.5' && M.normalnayaZapis('0,0') === '0' && M.normalnayaZapis('1/2') === null,
    'минус, запятая, нули, дробь');
}

/* ── Задачи на настоящих генераторах ───────────────────────────── */
const { rngOf } = requireSrc('lib/vychisleniya/rng.ts');
function adapter(n) {
  const p = String(n).padStart(2, '0');
  const { section } = requireSrc(`lib/variant/adapters/z${p}/index`);
  const df = `lib/variant/data/z${p}`;
  const data = fs.existsSync(path.join(SRC, `${df}.ts`)) ? requireSrc(df).dannye() : null;
  return section.init(data == null ? null : JSON.parse(JSON.stringify(data)));
}
const NORM = /^-?[0-9]+(\.[0-9]+)?$/;

for (const n of [8, 5]) {
  const a = adapter(n);
  const zapas = (tipy, skolko, seed) =>
    Z.zapasTrenazhera(
      tipy,
      skolko,
      (prototype, uzhe, shag) =>
        a.getRandomTask({ subtypes: null, source: 'mix', stars: null, prototype, exclude: uzhe },
          rngOf(`${seed}|${prototype}|${shag}`)),
      () => 1,
    );
  /* Все типы тренажёра раздела — у генератора есть задачи каждого. */
  const tipy =
    n === 8
      ? requireSrc('lib/vychisleniya/progress.ts').PROTOTYPES8_ORDER ??
        Object.keys(requireSrc('lib/vychisleniya/ids.ts').PROTOTYPE_NAMES)
      : requireSrc('lib/veroyatnost/pool.ts').bank5Pool().kinds.map((k) => k.id);
  const netu = tipy.filter((tip) => zapas([tip], 1, 'proba').length === 0);
  check(netu.length === 0, `№${n}: у генератора нет задач типов ${netu.slice(0, 5).join(', ')}`);
  const z = zapas(tipy.slice(0, 3), 12, 'dz-1');
  check(z.length === 12, `№${n}: запас 12 задач трёх типов (${z.length})`);
  check(new Set(z.map((t) => t.task_ref)).size === z.length, `№${n}: запас без повторов`);
  check(z.every((t) => NORM.test(t.answer)), `№${n}: ответы в нормальной записи`);
  check(z.every((t) => tipy.slice(0, 3).includes(t.kind)), `№${n}: только выбранные типы`);
  const z2 = zapas(tipy.slice(0, 3), 12, 'dz-1|uchenik-2');
  check(z2.map((t) => t.task_ref).join() !== z.map((t) => t.task_ref).join(), `№${n}: у другого ученика свой набор`);
  check(zapas(tipy.slice(0, 3), 12, 'dz-1').map((t) => t.task_ref).join() === z.map((t) => t.task_ref).join(),
    `№${n}: тот же seed — тот же набор`);
}

/* Опорные №8: весь блок, ответ генератора, разбор открыт отпечатком. */
{
  const { prepPool } = requireSrc('lib/vychisleniya/prep/pool.ts');
  const { generatePrep } = requireSrc('lib/vychisleniya/prep/generate.ts');
  const { openText } = requireSrc('lib/vychisleniya/secret.ts');
  let vsego = 0;
  let sobrano = 0;
  let bad = 0;
  for (const blok of prepPool()) {
    for (const t of blok.zadachi.filter((x) => x.answerType === 'number')) {
      vsego += 1;
      const z = Z.zadachaOpornaya8(t, generatePrep(t.id, t.seed).otvet, JSON.parse(openText(t.razbor, t.seal)));
      if (z !== null) sobrano += 1;
      if (z !== null && (!NORM.test(z.answer) || (z.razbor?.shagi.length ?? 0) === 0)) bad += 1;
    }
  }
  check(vsego > 0 && sobrano === vsego && bad === 0, `опорные №8: собрано ${sobrano} из ${vsego}, с ошибкой ${bad}`);
}

/* Опорные №5: ответ и шаги из закрытого разбора. */
{
  const { prep5Pool } = requireSrc('lib/veroyatnost/pool.ts');
  const { otkrytRazbor } = requireSrc('lib/veroyatnost/razbor.ts');
  let vsego = 0;
  let sobrano = 0;
  for (const blok of prep5Pool()) {
    for (const z of blok.zadachi) {
      vsego += 1;
      const d = Z.zadachaOpornaya5(z, otkrytRazbor(z.steps, z.seal));
      if (d !== null && NORM.test(d.answer) && d.razbor.shagi.length > 0) sobrano += 1;
    }
  }
  check(vsego > 0 && sobrano === vsego, `опорные №5: собрано ${sobrano} из ${vsego}`);
}

console.log(`Новая выдача ДЗ: ${checks} проверок, не прошло ${failures.length}.`);
if (failures.length > 0) {
  for (const f of failures) console.error(`  НЕТ ${f}`);
  process.exit(1);
}
