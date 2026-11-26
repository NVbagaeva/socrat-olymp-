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

/* Очистка ДЗ (lib/dz/sanitize.ts) в браузере работает с DOM; здесь —
   та же сверка по разметке: теги и атрибуты SVG из её списков, id — только
   у <pattern>, ссылки — только url(#id). Возвращает, что очистка вырежет. */
const SAN = requireSrc('lib/dz/sanitize.ts');
function vneDopuska(svg) {
  const out = [];
  for (const m of svg.matchAll(/<([a-zA-Z][\w:-]*)((?:\s+[\w:-]+\s*=\s*"[^"]*")*)\s*\/?>/g)) {
    const tag = m[1].toLowerCase();
    if (!SAN.TAGS.has(tag)) out.push(`<${tag}>`);
    for (const at of m[2].matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)) {
      const name = at[1].toLowerCase();
      if (!(SAN.ATTRS.has(name) || (name === 'id' && tag === 'pattern') || name.startsWith('data-'))) {
        out.push(`${tag}@${name}`);
      }
      for (const u of at[2].match(/url\s*\([^)]*\)/gi) ?? []) {
        if (!/^url\(#[A-Za-z0-9_-]+\)$/.test(u.replace(/\s+/g, ''))) out.push(`${tag}@${name}=${u}`);
      }
    }
  }
  return out;
}
const chertezhiRazdelov = [];

/* Этап 4б: тренажёр по банку — «В домашку» у №1, 2, 7, 9, 10, 11, 12, 13, 21.
   Типы тренажёра (id из выбора тем) должны совпадать с прототипами адаптера
   «Собрать вариант», из которого собирается запас ДЗ: каждый тип, который
   раздел пускает в ДЗ (RazdelBanka.vDomashku), даёт задачу с числовым
   ответом; каждый не пущенный — правда без задач у адаптера. */
{
  const TIPY = {
    1: () => {
      const { klyuchProto } = requireSrc('lib/planimetriya/trenazher/sessiya.ts');
      return requireSrc('lib/planimetriya/stseny/index.ts').PROTOTIPY.map((p) => klyuchProto(p.id));
    },
    2: () => requireSrc('lib/vektory/prototypes/index.ts').PROTOTYPES.map((p) => p.id),
    /* №3 (этап 4д): в ДЗ идут прототипы выбранных типов (prototipyTipa). */
    3: () => {
      const G = requireSrc('content/zadanie3/gruppy.ts');
      return G.TIPY3_ORDER.flatMap((t) => G.prototipyTipa(t));
    },
    7: () => requireSrc('lib/zadanie7/prototypes/index.ts').PROTOTYPES.map((p) => p.id),
    9: () => requireSrc('lib/proizvodnaya/prototypes/index.ts').PROTOTYPES.map((p) => p.id),
    10: () => requireSrc('lib/zadanie10/prototypes/index.ts').PROTOTYPES.map((p) => p.id),
    11: () => requireSrc('lib/zadanie11/prototypes/index.ts').SUBTYPES.map((p) => p.id),
    12: () => Object.keys(requireSrc('lib/ves12/trening/katalog.ts').katalog12()),
    13: () => requireSrc('lib/zadanie13/trening/katalog.ts').PROTOTIPY_TRENAZHERA_13.map((p) => p.id),
    21: () => requireSrc('lib/zadanie21/prototypes.ts').PROTOTYPES.map((p) => p.id),
  };
  const FILTR = {
    11: requireSrc('components/tasks/zadanie11/razdel11.tsx').razdel11({}, {}).vDomashku,
    12: requireSrc('components/tasks/zadanie12/razdel12.tsx').RAZDEL12.vDomashku,
  };
  for (const [nStr, tipyOf] of Object.entries(TIPY)) {
    const n = Number(nStr);
    const a = adapter(n);
    const vzyat = (tip, seed) =>
      a.getRandomTask({ subtypes: null, source: 'mix', stars: null, prototype: tip, exclude: new Set() }, rngOf(seed));
    const tipy = tipyOf();
    const filtr = FILTR[n] ?? (() => true);
    const vDz = tipy.filter(filtr);
    const net = vDz.filter((t) => vzyat(t, `proba|${t}`) === null);
    check(net.length === 0, `№${n}: типы ДЗ без задач у адаптера: ${net.slice(0, 6).join(', ')}`);
    const lishnie = tipy.filter((t) => !filtr(t) && vzyat(t, `proba|${t}`) !== null);
    check(lishnie.length === 0, `№${n}: тип не пущен в ДЗ, а у адаптера задачи есть: ${lishnie.slice(0, 6).join(', ')}`);
    const zapas = Z.zapasTrenazhera(
      vDz.slice(0, 3),
      9,
      (prototype, uzhe, shag) =>
        a.getRandomTask({ subtypes: null, source: 'mix', stars: null, prototype, exclude: uzhe },
          rngOf(`dz-4b|${prototype}|${shag}`)),
      () => 1,
    );
    check(zapas.length > 0 && zapas.every((t) => NORM.test(t.answer) && vDz.slice(0, 3).includes(t.kind)),
      `№${n}: запас ДЗ из трёх типов с ответами (${zapas.length})`);
    /* Чертёж ученика — в условии ДЗ (4г): по задаче каждого типа, у которой
       у адаптера есть рисунок, условие несёт его SVG, и очистка его не режет. */
    let sRisunkom = 0;
    let sChertezhom = 0;
    const plohieSvg = [];
    for (const tip of vDz) {
      const zadacha = vzyat(tip, `chertezh|${tip}`);
      if (zadacha === null) continue;
      const svg = typeof zadacha.figure?.svg === 'string' ? zadacha.figure.svg : null;
      const [dz] = Z.zapasTrenazhera([tip], 1, () => zadacha, () => 1);
      if (dz === undefined) continue;
      /* Условие целиком (таблицы №13, KaTeX) — тоже без вырезанного. */
      plohieSvg.push(...vneDopuska(dz.question_html).map((x) => `${tip}: ${x}`));
      if (svg !== null) {
        sRisunkom += 1;
        if (dz.question_html.includes(svg) && dz.question_html.includes('dz2-chertezh')) sChertezhom += 1;
      }
    }
    check(sRisunkom === sChertezhom, `№${n}: чертёж в условии ДЗ у ${sChertezhom} из ${sRisunkom} типов с рисунком`);
    check(plohieSvg.length === 0, `№${n}: очистка ДЗ режет условие: ${[...new Set(plohieSvg)].slice(0, 6).join('; ')}`);
    if (sRisunkom > 0) chertezhiRazdelov.push(n);
  }
  /* Разделы, где чертёж решает задачу: проверка выше не должна пустеть. */
  for (const n of [1, 2, 3, 9, 10]) {
    check(chertezhiRazdelov.includes(n), `№${n}: у тренажёра в ДЗ нашлись задачи с чертежом`);
  }
}

/* Этап 4г: опорные на своих экранах (№1, 2, 9, 11, 13). «В домашку»
   собирает задачи блока тем же генератором, что «Ещё вариант»: ответ
   генератора по (задача, seed) — тот, что закрыт отпечатком на экране;
   разбор открывается; чертёж и таблица условия проходят очистку ДЗ;
   задача ДЗ — с ответом в нормальной записи и чертежом в условии.
   Задачи с выбором («Определи тип», варианты) и «Заполни таблицу» — не в ДЗ. */
{
  const RAZDELY = {
    1: {
      pool: () => requireSrc('lib/planimetriya/prep/pool.ts').prepPool1(),
      secret: 'lib/planimetriya/secret.ts',
      otvet: (x) => requireSrc('lib/planimetriya/prep/generate.ts').generateMikro(x.id, x.seed).otvet,
      stroki: (x, open) => JSON.parse(open(x.razbor, x.seal)).stroki,
      chislom: () => true,
    },
    2: {
      pool: () => requireSrc('lib/vektory/prep/pool.ts').prepPool2(),
      secret: 'lib/vektory/secret.ts',
      otvet: (x) => requireSrc('lib/vektory/prep/generate.ts').generateMikro(x.id, x.seed).otvet,
      stroki: (x, open) => JSON.parse(open(x.razbor, x.seal)).stroki,
      chislom: (x) => x.answerType === 'number',
    },
    9: {
      pool: () => requireSrc('lib/proizvodnaya/prep/pool.ts').prepPool9(),
      secret: 'lib/proizvodnaya/secret.ts',
      otvet: (x) => requireSrc('lib/proizvodnaya/prep/generate.ts').generatePrepById(x.id, x.seed).otvet,
      stroki: (x, open) => JSON.parse(open(x.zakryto, x.seal)).razborHtml,
      chislom: (x) => x.answerType === 'number',
    },
    11: {
      pool: () => requireSrc('lib/zadanie11/prep/pool.ts').prepPool11(),
      secret: 'lib/zadanie11/secret.ts',
      otvet: (x) => requireSrc('lib/zadanie11/prep/generate.ts').generateMikro(x.id, x.seed).otvet,
      stroki: (x, open) => JSON.parse(open(x.razbor, x.seal)).stroki,
      tablitsa: (x) => (x.tablitsa === null ? null : requireSrc('lib/zadanie11/sheet11.ts').tablitsaHtml(x.tablitsa)),
      chislom: (x) => x.answerType === 'number',
    },
    13: {
      pool: () => requireSrc('lib/zadanie13/opornye/pool.ts').prepPool13().filter((b) => b.vid !== 'tip'),
      secret: 'lib/zadanie13/secret.ts',
      id: (x) => x.prototypeId,
      otvet: (x) => requireSrc('lib/zadanie13/generate.ts').generate(x.prototypeId, x.seed).answer,
      stroki: (x) => {
        const t = requireSrc('lib/zadanie13/generate.ts').generate(x.prototypeId, x.seed);
        return requireSrc('lib/zadanie13/reshenieHtml.ts').reshenieShagami(t.solution, t.tableModel).map((sh) => sh.chtoHtml + sh.formulaHtml);
      },
      tablitsa: (x) => x.tablitsaHtml,
      chislom: (x) => x.vybory === null && x.zapolni === null,
    },
  };
  for (const [nStr, R] of Object.entries(RAZDELY)) {
    const n = Number(nStr);
    const { sealAnswer, openText } = requireSrc(R.secret);
    let vsego = 0;
    let seal = 0;
    let razbor = 0;
    let dz = 0;
    let sRisunkom = 0;
    let sTablitsey = 0;
    const plohie = [];
    for (const b of R.pool()) {
      for (const x of b.zadachi.filter(R.chislom)) {
        vsego += 1;
        const otvet = R.otvet(x);
        if (sealAnswer(otvet) === x.seal) seal += 1;
        let stroki = [];
        try {
          stroki = R.stroki(x, openText);
        } catch {
          stroki = [];
        }
        if (Array.isArray(stroki) && stroki.length > 0) razbor += 1;
        const tablitsaHtml = R.tablitsa?.(x) ?? null;
        const d = Z.zadachaOpornayaGen(
          {
            id: R.id?.(x) ?? x.id,
            seed: x.seed,
            uslovieHtml: x.uslovieHtml,
            risunokSvg: x.risunokSvg ?? null,
            tablitsaHtml,
            otvet,
            shagi: stroki.map((chto) => ({ chto })),
          },
          2,
        );
        if (d !== null && NORM.test(d.answer) && Number(d.answer) === Number(otvet)) dz += 1;
        /* Условие целиком — чертёж, таблица, KaTeX — очистка не режет. */
        if (d !== null) plohie.push(...vneDopuska(d.question_html).map((v) => `${R.id?.(x) ?? x.id}: ${v}`));
        if (typeof x.risunokSvg === 'string') {
          sRisunkom += 1;
          if (!d?.question_html.includes(x.risunokSvg)) plohie.push(`${x.id}: чертежа нет в условии`);
        }
        if (tablitsaHtml !== null) {
          sTablitsey += 1;
        }
      }
    }
    check(vsego > 0 && seal === vsego, `№${n} опорные: ответ генератора совпадает с отпечатком экрана (${seal} из ${vsego})`);
    check(razbor === vsego, `№${n} опорные: разбор открывается (${razbor} из ${vsego})`);
    check(dz === vsego, `№${n} опорные: задачи ДЗ с ответом (${dz} из ${vsego})`);
    check(plohie.length === 0, `№${n} опорные: чертёж и таблица в ДЗ: ${[...new Set(plohie)].slice(0, 6).join('; ')}`);
    if ([1, 2, 9].includes(n)) check(sRisunkom > 0, `№${n} опорные: есть задачи с чертежом (${sRisunkom})`);
    if ([11, 13].includes(n)) check(sTablitsey > 0, `№${n} опорные: есть задачи с таблицей (${sTablitsey})`);
  }
}

/* Этап 4д: опорные №3 (стереометрия). Числовая задача — ответ закрыт
   ключом «id|otvet» на странице блока и открывается в исходный; чертёж —
   renderSolid по модели задачи, очистка ДЗ его не режет. Задачи с выбором,
   касанием и плоским чертежом в ДЗ не идут. */
{
  const B = requireSrc('lib/stereo/opornye3/bloki.ts');
  const { sealZadacha } = requireSrc('lib/stereo/opornye3/seal.ts');
  const { sealText, openText } = requireSrc('lib/stereo/opornye3/secret.ts');
  const { renderSolid } = requireSrc('lib/solid/render.ts');
  let vsego = 0;
  let ok = 0;
  const plohie = [];
  for (const b of B.BLOKI_3.filter((x) => x.gotov)) {
    const zadachi = B.zadachiBloka(b.id);
    for (const [i, z] of zadachi.entries()) {
      if (z.vid !== 'chislo') continue;
      vsego += 1;
      const t = sealZadacha(z, i + 1);
      const otvet = openText(sealText(z.otvet, `${z.id}|otvet`), `${z.id}|otvet`);
      let uchenik = '';
      try {
        uchenik = JSON.parse(openText(t.razbor, t.id)).uchenikHtml;
      } catch {
        uchenik = '';
      }
      const d = Z.zadachaOpornayaGen(
        { id: z.id, seed: 'blok', uslovieHtml: t.uslovieHtml, risunokSvg: renderSolid(t.model), otvet, shagi: [{ chto: uchenik }] },
        1,
      );
      if (d !== null && NORM.test(d.answer) && Number(d.answer) === Number(String(z.otvet).replace(',', '.'))
        && uchenik !== '' && d.question_html.includes('dz2-chertezh')) ok += 1;
      if (d !== null) plohie.push(...vneDopuska(d.question_html).map((v) => `${z.id}: ${v}`));
    }
  }
  check(vsego > 0 && ok === vsego, `№3 опорные: ответ, разбор и чертёж в ДЗ (${ok} из ${vsego})`);
  check(plohie.length === 0, `№3 опорные: очистка ДЗ режет условие: ${[...new Set(plohie)].slice(0, 6).join('; ')}`);
}

/* Этап 4в: опорные на общем экране банка (№7, 10, 21). Ответ уходит в
   браузер закрытым ключом «id|otvet» (как разбор; добавляет страница блока,
   lib/opornye/otvetDz.ts) и открывается только по
   «В домашку»: открытый ответ совпадает с исходным у каждой задачи, разбор
   читается, задача ДЗ собирается с ответом в нормальной записи. */
{
  const nabor = { tekst: (t) => t, formula: (t) => t };
  for (const [n, fn] of [[7, 'opornyeDlyaBrauzera'], [10, 'opornyeDlyaBrauzera'], [21, 'opornyeDlyaBrauzera21']]) {
    const O = requireSrc(`lib/zadanie${n}/opornye.ts`);
    const { openText, sealText } = requireSrc(`lib/zadanie${n}/secret.ts`);
    const { sOtvetomDz } = requireSrc('lib/opornye/otvetDz.ts');
    let vsego = 0;
    let bad = 0;
    let dz = 0;
    for (const b of O.BLOKI_OPORNYH ?? O.BLOKI_OPORNYH21) {
      /* Так же, как страница блока: данные раздела + ответ для ДЗ. */
      const brauzer = sOtvetomDz(O[fn](b), b.zadachi, sealText);
      for (const [i, z] of brauzer.entries()) {
        vsego += 1;
        const iskhodnyy = b.zadachi[i];
        const otvet = openText(z.otvet, `${z.id}|otvet`);
        if (otvet !== String(iskhodnyy.answer) || 'answer' in z) bad += 1;
        let shagi = [];
        try {
          const stroki = JSON.parse(openText(z.razbor, z.id));
          shagi = Array.isArray(stroki) ? stroki.map((text) => ({ text })) : [];
        } catch {
          shagi = [];
        }
        const d = Z.zadachaOpornaya5({ id: z.id, uslovie: z.uslovie }, { otvet, shagi }, nabor, 1);
        if (d !== null && NORM.test(d.answer) && Number(d.answer) === Number(iskhodnyy.answer)) dz += 1;
      }
    }
    check(vsego > 0 && bad === 0, `№${n} опорные: закрытый ответ открывается в исходный (${vsego - bad} из ${vsego})`);
    check(dz === vsego, `№${n} опорные: задачи ДЗ с ответом (${dz} из ${vsego})`);
  }
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
  const { typeset, typesetText } = requireSrc('lib/tex.ts');
  const nabor = { tekst: typesetText, formula: (tex) => typeset(`$${tex}$`) };
  let vsego = 0;
  let sobrano = 0;
  let dollar = 0;
  let formul = 0;
  for (const blok of prep5Pool()) {
    for (const z of blok.zadachi) {
      vsego += 1;
      const r = otkrytRazbor(z.steps, z.seal);
      const d = Z.zadachaOpornaya5(z, r, nabor);
      if (d !== null && NORM.test(d.answer) && d.razbor.shagi.length > 0) sobrano += 1;
      /* В базу — готовая вёрстка: ни одной формулы в $…$, у шага с TeX — KaTeX. */
      const html = d === null ? '' : [d.question_html, ...d.razbor.shagi.flatMap((s) => [s.chto, s.tex ?? ''])].join('');
      if (/\$[^$]+\$/.test(html.replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g, ''))) dollar += 1;
      if (d !== null && r.shagi.some((s) => s.tex !== undefined) && !d.razbor.shagi.some((s) => s.tex?.includes('katex')))
        formul += 1;
    }
  }
  check(vsego > 0 && sobrano === vsego, `опорные №5: собрано ${sobrano} из ${vsego}`);
  check(dollar === 0, `опорные №5: формулы набраны KaTeX, без $…$ (осталось у ${dollar})`);
  check(formul === 0, `опорные №5: шаги с формулой набраны KaTeX (нет у ${formul})`);
  {
    const z = { id: 'k', uslovie: 'Найдите <b>a</b> & $x^2$' };
    const d = Z.zadachaOpornaya5(z, { otvet: '0,5', shagi: [{ text: 'Шаг' }] }, nabor);
    check(d.question_html.includes('&lt;b&gt;') && d.question_html.includes('katex'),
      'опорные №5: текст условия экранирован, формула набрана');
  }
}

/* ── Ученик (PR 2в): «Мои домашки» и экран решения ────────────── */
{
  const U = requireSrc('lib/dz2/uchenik.ts');
  const now = Date.parse('2026-11-25T12:00:00Z');
  const d = (id, status, due, after = 'late_ok', extra = {}) => ({
    id, title: id, status, after_due: after, kontrol: false, items: 3, items_done: 1,
    ...(due === null ? {} : { due_at: due }), ...extra,
  });
  const list = [
    d('sdano', 'submitted', '2026-11-20T15:00:00Z', 'late_ok', { submitted_at: '2026-11-19T10:00:00Z' }),
    d('bez-sroka', 'not_started', null),
    d('pozzhe', 'in_progress', '2026-11-30T15:00:00Z'),
    d('ranshe', 'not_started', '2026-11-26T15:00:00Z'),
    d('vernuli', 'returned', '2026-12-10T15:00:00Z'),
    d('zakryto', 'missed', '2026-11-24T15:00:00Z', 'closed'),
    d('opozdal-mozhno', 'missed', '2026-11-24T15:00:00Z', 'late_ok'),
  ];
  const ids = U.poryadok(list, now).map((x) => x.id);
  check(ids.join() === 'vernuli,opozdal-mozhno,ranshe,pozzhe,bez-sroka,sdano,zakryto' ||
    ids.join() === 'vernuli,opozdal-mozhno,ranshe,pozzhe,bez-sroka,zakryto,sdano',
    `порядок «Моих домашек»: доработка, по сроку, без срока, потом сданные (${ids.join()})`);
  check(!U.aktivnaya(list[5], now) && U.aktivnaya(list[6], now), 'срок прошёл: закрытое — не активное, «с опозданием» — активное');
  check(!U.aktivnaya(list[0], now) && U.sdano('late') && !U.sdano('returned'), 'сданное не активно; «с опозданием» — сдано');

  check(U.risunokSrc('/images/veroyatnost/zadanie-5/k5-21.webp') === '/images/veroyatnost/zadanie-5/k5-21.webp',
    'картинка условия из /images/ показывается');
  for (const bad of ['https://evil.example/x.png', '//evil.example/x.png', '/images/../api/x.png',
    'javascript:alert(1)', '/images/x.png?track=1', '/kabinet/x.png']) {
    check(U.risunokSrc(bad) === null, `чужая картинка не грузится: ${bad}`);
  }

  const dz = { hints_allowed: true, kontrol: false };
  const op = { kind: 'opornye' };
  const tr = { kind: 'trenazher' };
  check(U.estPodskazki(dz, op) && !U.estPodskazki(dz, tr), 'подсказки — у опорных, у тренажёра нет (разбор одним куском)');
  check(!U.estPodskazki({ ...dz, kontrol: true }, op) && !U.estPodskazki({ ...dz, hints_allowed: false }, op),
    'контрольная и «без подсказок» — подсказок нет');

  const e = (progress, tasks) => ({ progress, tasks });
  check(JSON.stringify(U.cel(e({ done: 7, need: 3, completed: true }))) === '{"done":3,"need":3}', 'цель: не больше нужного');
  check(JSON.stringify(U.cel(e({ done: 1, need: null, completed: false }, [{}, {}]))) === '{"done":1,"need":2}',
    'цель без числа — все задачи');
  const t3 = [{ state: 'right' }, { state: 'open' }, { state: 'open' }];
  check(U.pervayaOtkrytaya({ tasks: t3 }) === 1 && U.otkrytye({ tasks: t3 }) === 2, 'открывается первая незакрытая задача');
  check(U.pervayaOtkrytaya({ tasks: [{ state: 'right' }] }) === 0, 'всё закрыто — первая');
  check(U.vypolneno({ items: [{ progress: { completed: true } }, { progress: { completed: false } }] }) === 1,
    'выполнено элементов');
  check(U.srokProshel({ due_at: '2026-11-24T15:00:00Z' }, now) && !U.srokProshel({}, now), 'срок прошёл / без срока');
}

/* ── Итоги учителя (PR 2г) ──────────────────────────────────────── */
{
  const I = requireSrc('lib/dz2/itogi.ts');
  check(I.yacheyka(undefined) === 'net' && I.yacheyka({ done: 0, need: 3, completed: false }) === 'net',
    'клетка: не начато');
  check(I.yacheyka({ done: 1, need: 3, completed: false }) === 'nachato', 'клетка: начато');
  check(I.yacheyka({ done: 0, need: 3, completed: false, closed: 2, total: 10 }) === 'nachato',
    'клетка «подряд»: серия сорвалась, но задачи решались — начато');
  check(I.yacheyka({ done: 3, need: 3, completed: true }) === 'gotovo', 'клетка: выполнено');
  const tr = { kind: 'trenazher' };
  const te = { kind: 'teoriya' };
  check(I.podpisYacheyki(tr, { done: 5, need: 3, completed: true }) === '3/3', 'подпись: не больше цели');
  check(I.podpisYacheyki(te, { done: 1, need: 1, completed: true }) === '✓' &&
    I.podpisYacheyki(te, { done: 0, need: 1, completed: false }) === '—', 'подпись теории');
  check(I.podpisYacheyki(tr, undefined) === '—', 'подпись без прогресса');
  const u = (id, name, status, progress = {}) => ({ id, name, status, seconds: 0, progress });
  const list = [
    u('a', 'Яна', 'not_started'), u('b', 'Борис', 'late', { e1: { done: 1, need: 1, completed: true } }),
    u('c', 'Аня', 'submitted', { e1: { done: 1, need: 1, completed: true } }), u('d', 'Вера', 'returned'),
    u('e', 'Гоша', 'missed'), u('f', 'Дина', 'in_progress', { e1: { done: 0, need: 1, completed: false } }),
  ];
  check(I.poryadokUchenikov(list).map((x) => x.id).join() === 'c,b,d,f,a,e',
    `порядок учеников: сдавшие, на доработке, в работе, не начавшие, не сдавшие (${I.poryadokUchenikov(list).map((x) => x.id).join()})`);
  check(I.sdali(list) === 2 && I.vypolnili(list, 'e1') === 2, 'сдали 2, элемент выполнили 2');
  check(JSON.stringify(I.poStatusam(list)) === '{"not_started":1,"late":1,"submitted":1,"returned":1,"missed":1,"in_progress":1}',
    'счёт по статусам');
  check(I.mozhnoVernut(list[1]) && I.mozhnoVernut(list[2]) && !I.mozhnoVernut(list[3]) && !I.mozhnoVernut(list[0]),
    'вернуть можно только сданное');
  const items = [{ id: 'e2', position: 2 }, { id: 'e1', position: 1 }];
  const ot = [{ id: 't2', item_id: 'e1', position: 2 }, { id: 't1', item_id: 'e1', position: 1 }, { id: 't3', item_id: 'e2', position: 1 }];
  const pe = I.poElementam(items, ot);
  check(pe[0].e.id === 'e2' && pe[0].zadachi.length === 1 && pe[1].zadachi.map((x) => x.id).join() === 't1,t2',
    'ответы по элементам и по порядку задач');
}

/* Ссылки ученика из ДЗ — на настоящие адреса разделов. */
{
  const L = requireSrc('lib/dz2/links.ts');
  check(L.dz2KartochkiHref(5) === '/zadaniya/slozhnaya-veroyatnost/kartochki/', `карточки №5: ${L.dz2KartochkiHref(5)}`);
  check(L.dz2TeoriyaHref(5, 'koordinatnaya-pryamaya') === '/zadaniya/slozhnaya-veroyatnost/teoriya/#teoriya-koordinatnaya-pryamaya',
    `глава теории №5: ${L.dz2TeoriyaHref(5, 'koordinatnaya-pryamaya')}`);
}

console.log(`Новая выдача ДЗ: ${checks} проверок, не прошло ${failures.length}.`);
if (failures.length > 0) {
  for (const f of failures) console.error(`  НЕТ ${f}`);
  process.exit(1);
}
