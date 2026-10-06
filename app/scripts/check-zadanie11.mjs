#!/usr/bin/env node
/* scripts/check-zadanie11.mjs — автотест задания №11 «Текстовые задачи».

   Запуск: pnpm test:zadanie11 [seeds]   (по умолчанию 200 seed на подтип)

   Каждая задача открытого банка (src/data/zadanie11/bank.json) и
   разминки (razminka.json) решается функцией своего подтипа:
     — ответ solve совпадает с ответом из JSON;
     — ответ положительный, целый или конечная десятичная дробь;
     — каждая формула $…$ условия, разбора, таблицы и подсказок
       набирается KaTeX в строгом режиме;
     — разбор идёт этапами «Шаг 1. …», последняя строка — ответ;
     — у вопросов подсказки есть верный вариант, варианты разные;
     — вне $…$ нет формул обычным текстом и сырого TeX (те же
       признаки, что у pnpm test:math-markup).
   Генератор: на каждый подтип seeds новых задач с теми же проверками
   и методикой таблиц; сырой прогон генератора сверяет задуманный им
   ответ с solve; новые задачи не совпадают с банком (и не отличаются
   от задачи банка одним числом); у разминки встречаются оба случая —
   с остатком и нацело, округление вверх и вниз.
   Отдельно — склонения: «1 час / 2 часа / 5 часов» и т. п.

   Ненулевой код возврата — есть проблемы, они печатаются списком. */

import { createRequire } from 'node:module';
import { requireSrc } from './lib/load-ts.mjs';
import { findPlainMath, findRawTex, stripDollarMath } from './lib/math-markup.mjs';

const require = createRequire(import.meta.url);
const katex = require('katex');
const typeset = (tex) => katex.renderToString(tex, { throwOnError: true, strict: 'error' });

const { checkBank, checkRazminka, checkGenerators, allTexts } =
  requireSrc('lib/zadanie11/selftest');

/* Сколько seed на подтип: pnpm test:zadanie11 [seeds]. */
const seeds = Number(process.argv[2] ?? 200);
const { SUBTYPES } = requireSrc('lib/zadanie11/prototypes');
const { sk, vremya, shtuk, SLOVA } = requireSrc('lib/zadanie11/sklonenie');

const problems = [];

const bank = checkBank(typeset);
const razminka = checkRazminka(typeset);
const gen = checkGenerators(seeds, typeset);
problems.push(...bank.problems, ...razminka.problems, ...gen.problems);

/* Формулы обычным текстом и сырой TeX вне $…$. */
for (const { where, s } of [...bank.solved, ...razminka.solved, ...gen.solved]) {
  for (const text of allTexts(s)) {
    const plain = stripDollarMath(text).replace(/\*\*/g, '');
    for (const f of [...findPlainMath(plain), ...findRawTex(plain)]) {
      problems.push({
        where,
        what: `вне KaTeX (${f.rule}): «${f.match}» в «${text.slice(0, 70)}»`,
      });
    }
  }
}

/* Банк покрывает подтипы: у каждого подтипа (кроме РЗ) есть задача. */
const inBank = new Set(
  [...bank.solved, ...razminka.solved].map(({ where }) => where.split(' ')[2]),
);
for (const st of SUBTYPES) {
  if (!inBank.has(st.id)) {
    problems.push({ where: st.id, what: 'у подтипа нет ни одной задачи в банке или разминке' });
  }
}

/* Дерево разделов: каждый подтип в своём разделе, поиск по сюжетам. */
const { sectionsInfo, poisk } = requireSrc('lib/zadanie11/taxonomy');
const covered = sectionsInfo().flatMap((s) => s.subtypes.map((st) => st.id));
if (
  covered.length !== SUBTYPES.length ||
  new Set(SUBTYPES.map((s) => s.id)).size !== SUBTYPES.length
) {
  problems.push({ where: 'дерево', what: 'подтип вне разделов или повтор кода' });
}
for (const [word, id] of [
  ['изюм', 'SM-06'],
  ['баржа', 'DP-07'],
  ['трубы', 'RB-03'],
  ['плот', 'VD-06'],
]) {
  if (!poisk(word).some((st) => st.id === id)) {
    problems.push({ where: 'поиск', what: `«${word}» не находит ${id}` });
  }
}

/* Теория: у каждого раздела дерева — раздел теории, ссылки на
   лайфхаки и ловушки целы, у каждого подтипа — мини-иллюстрация,
   таблицы теории — по правилам методики, формулы набираются. */
{
  const { RAZDELY_TEORII_11, LAYFHAKI, LOVUSHKI } = requireSrc('content/teoriya11');
  const { estScena } = requireSrc('components/tasks/zadanie11/Piktogrammy');
  const { checkTablitsa, texPieces } = requireSrc('lib/zadanie11/selftest');
  const { SECTIONS } = requireSrc('lib/zadanie11/taxonomy');
  for (const sec of SECTIONS) {
    if (!RAZDELY_TEORII_11.some((r) => r.section === sec.id)) {
      problems.push({ where: 'теория', what: `нет раздела теории для ${sec.kod}` });
    }
  }
  for (const st of SUBTYPES) {
    if (!estScena(st.id)) {
      problems.push({ where: 'теория', what: `у ${st.id} нет мини-иллюстрации` });
    }
  }
  const texts = [];
  for (const r of RAZDELY_TEORII_11) {
    for (const id of r.layfhaki) {
      if (!LAYFHAKI[id]) problems.push({ where: `теория ${r.id}`, what: `нет лайфхака ${id}` });
    }
    for (const id of r.lovushki) {
      if (!LOVUSHKI[id]) problems.push({ where: `теория ${r.id}`, what: `нет ловушки ${id}` });
    }
    for (const t of r.tablitsa?.tables ?? []) {
      problems.push(...checkTablitsa(`теория ${r.id}`, t));
      texts.push(...t.head, ...t.rows.flat(), t.title ?? '');
    }
    texts.push(
      r.lead,
      ...r.idei,
      r.formula?.podpis ?? '',
      r.tablitsa?.primer ?? '',
      r.tablitsa?.note ?? '',
    );
    texts.push(...(r.tablitsa?.legenda ?? []));
    if (r.vvedenie) {
      texts.push(
        r.vvedenie.opredelenie,
        r.vvedenie.glavnoe,
        ...r.vvedenie.kartinki.flatMap((k) => [k.title, k.text]),
      );
    }
    for (const k of r.kartochki ?? []) texts.push(k.text);
    for (const tex of [r.formula?.tex, ...(r.kartochki ?? []).map((k) => k.tex)]) {
      if (tex) texts.push(`$${tex}$`);
    }
  }
  for (const l of Object.values(LAYFHAKI)) {
    texts.push(
      l.lead,
      l.dolgo.podpis,
      l.bystro.podpis,
      ...l.shagi,
      `$${l.dolgo.tex}$`,
      `$${l.bystro.tex}$`,
    );
    if (l.bystro.itog) texts.push(`$${l.bystro.itog}$`);
  }
  for (const l of Object.values(LOVUSHKI)) {
    texts.push(l.text);
    if (l.tex) texts.push(`$${l.tex}$`);
  }
  for (const text of texts) {
    if (/⇔|\\Leftrightarrow|\\iff|равносил/i.test(text)) {
      problems.push({ where: 'теория', what: `знак равносильности: ${text.slice(0, 60)}` });
    }
    const pieces = texPieces(text);
    if (pieces === null) {
      problems.push({ where: 'теория', what: `непарный $: ${text.slice(0, 60)}` });
      continue;
    }
    for (const tex of pieces) {
      try {
        typeset(tex);
      } catch (e) {
        problems.push({
          where: 'теория',
          what: `KaTeX: ${e.message.slice(0, 60)} в «${tex.slice(0, 50)}»`,
        });
      }
    }
    const plain = stripDollarMath(text).replace(/\*\*/g, '');
    for (const f of [...findPlainMath(plain), ...findRawTex(plain)]) {
      problems.push({
        where: 'теория',
        what: `вне KaTeX (${f.rule}): «${f.match}» в «${text.slice(0, 60)}»`,
      });
    }
  }
}

/* Склонения. */
const expect = [
  [sk(1, SLOVA.chas), '1 час'],
  [sk(2, SLOVA.chas), '2 часа'],
  [sk(5, SLOVA.chas), '5 часов'],
  [sk(11, SLOVA.chas), '11 часов'],
  [sk(21, SLOVA.chas), '21 час'],
  [sk(1, SLOVA.detal), '1 деталь'],
  [sk(2, SLOVA.detal), '2 детали'],
  [sk(5, SLOVA.detal), '5 деталей'],
  [sk(3, SLOVA.litr), '3 литра'],
  [sk(1, SLOVA.minuta), '1 минута'],
  [vremya(80), '1 час 20 минут'],
  [vremya(130), '2 часа 10 минут'],
  [vremya(50), '50 минут'],
  [vremya(84), '1 час 24 минуты'],
  [vremya(120), '2 часа'],
  [
    shtuk(4, ['одинаковые', 'одинаковых'], ['рубашка', 'рубашки', 'рубашек']),
    'четыре одинаковые рубашки',
  ],
  [
    shtuk(6, ['одинаковые', 'одинаковых'], ['рубашка', 'рубашки', 'рубашек']),
    'шесть одинаковых рубашек',
  ],
  [
    shtuk(11, ['одинаковые', 'одинаковых'], ['рубашка', 'рубашки', 'рубашек']),
    'одиннадцать одинаковых рубашек',
  ],
];
for (const [got, want] of expect) {
  if (got !== want) {
    problems.push({ where: 'склонения', what: `«${got}» вместо «${want}»` });
  }
}

console.log(`подтипов: ${SUBTYPES.length}`);
console.log(`банк: ${bank.checked}, разминка: ${razminka.checked} (задач)`);
console.log(`генератор: ${gen.generated} задач, по ${seeds} seed на подтип`);
const poor = gen.stats.filter((x) => x.distinct < seeds / 2);
if (poor.length > 0) {
  console.log(`  мало разных задач: ${poor.map((x) => `${x.id} (${x.distinct})`).join(', ')}`);
}
console.log(`проблем: ${problems.length}`);
for (const p of problems.slice(0, 80)) {
  console.log(`  ${p.where} — ${p.what}`);
}
if (problems.length > 0) {
  process.exitCode = 1;
}
