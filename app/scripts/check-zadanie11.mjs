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
   Опорные задачи: 12 блоков по 10 микрозадач, разминка первая; на
   каждую — зафиксированный вариант и новые: ответ, варианты,
   подсказки, таблицы, KaTeX, отпечаток (lib/zadanie11/prep/selftest).
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
    for (const t of [...(r.tablitsa?.tables ?? []), ...(r.paraTablits ?? []).map((x) => x.table)]) {
      problems.push(...checkTablitsa(`теория ${r.id}`, t));
      texts.push(...t.head, ...t.rows.flat(), t.title ?? '');
    }
    for (const x of r.paraTablits ?? []) {
      texts.push(x.primer, x.note);
    }
    for (const l of r.formula?.legenda ?? []) {
      texts.push(`$${l.tex}$`, l.text);
    }
    for (const sl of r.formula?.sledstviya ?? []) {
      texts.push(`$${sl.tex}$`, sl.podpis);
    }
    if (r.zapomnit) {
      const z = r.zapomnit;
      texts.push(`$${z.verh}$`, ...z.niz.map((t) => `$${t}$`), z.pravilo, z.sovet);
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

/* Опорные задачи: 12 блоков по 10 микрозадач, seeds вариантов на каждую. */
const prepSeeds = Math.min(seeds, 100);
const prep = requireSrc('lib/zadanie11/prep/selftest').checkPrep(prepSeeds, typeset);
problems.push(...prep.problems);
for (const { where, text } of prep.texts) {
  const plain = stripDollarMath(text).replace(/\*\*/g, '');
  for (const f of [...findPlainMath(plain), ...findRawTex(plain)]) {
    problems.push({ where, what: `вне KaTeX (${f.rule}): «${f.match}» в «${text.slice(0, 70)}»` });
  }
}

/* Обозначения смесей: m_{\text{в-ва}}, m_{\text{р-ра}} — индекс прямым
   шрифтом и полностью. «в.в.», «в-в» и курсивный индекс m_{в…} — ошибка. */
{
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { APP } = await import('./lib/load-ts.mjs');
  const files = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (/\.(ts|tsx|json)$/.test(e.name)) files.push(full);
    }
  };
  for (const dir of [
    'src/lib/zadanie11',
    'src/content',
    'src/components/tasks/zadanie11',
    'src/data/zadanie11',
  ]) {
    walk(path.join(APP, dir));
  }
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const [re, what] of [
      [/в\.в\./, 'обозначение «в.в.» вместо «в-ва»'],
      [/в-в(?!а)/, 'обозначение «в-в» вместо «в-ва»'],
      [/m_\{?(?:в|р)/, 'индекс m без \\text{…}: курсив вместо прямого'],
    ]) {
      const m = re.exec(text);
      if (m !== null) {
        problems.push({
          where: path.relative(APP, file),
          what: `${what}: «${text.slice(m.index - 10, m.index + 20)}»`,
        });
      }
    }
  }
}

/* Подпись столбца равных масс: звёздочка — верхний индекс. */
{
  const { podpisStolbtsa } = requireSrc('lib/zadanie11/kit');
  const { checkTablitsa } = requireSrc('lib/zadanie11/selftest');
  for (const [got, want] of [
    [podpisStolbtsa('I*'), '$\\text{I}^{*}$'],
    [podpisStolbtsa('I* + II*'), '$\\text{I}^{*}+\\text{II}^{*}$'],
    [podpisStolbtsa('I + вода'), 'I + вода'],
  ]) {
    if (got !== want) problems.push({ where: 'столбцы', what: `«${got}» вместо «${want}»` });
  }
  /* Звёздочка строкой, арабская цифра, неподсвеченная строка — проверка их ловит. */
  const plokhaya = {
    vid: 'koncentraciya',
    head: ['', 'I*', '1'],
    rows: [],
  };
  if (checkTablitsa('мутация', plokhaya).length < 3) {
    problems.push({ where: 'столбцы', what: 'checkTablitsa пропустила «I*», «1» или подсветку' });
  }
}

/* Тренажёр: данные страницы без ответов, план тренировки по
   источнику, задача в закрытом виде узнаёт свой ответ. */
const trenazher = { zadach: 0 };
{
  const { dannyeTrenazhera } = requireSrc('lib/zadanie11/trenazher/dannye');
  const { planSessii, bankDlya, klyuchZadachi, podtipKlyucha, primernoeVremya, vTrenirovke } =
    requireSrc('lib/zadanie11/trenazher/sessiya');
  const { sobratZadachu } = requireSrc('lib/zadanie11/trenazher/zadacha');
  const { answerMatches, choiceMatches, openText } = requireSrc('lib/zadanie11/secret');
  const { kodNaSayte } = requireSrc('lib/zadanie11/kod');
  const { SECTIONS: SEKCII } = requireSrc('lib/zadanie11/taxonomy');
  const { BANK, RAZMINKA } = requireSrc('lib/zadanie11/bank');
  const add = (what) => problems.push({ where: 'тренажёр', what });

  for (const sec of SEKCII) {
    if (kodNaSayte(`${sec.id}-01`) !== `${sec.kod}-01`)
      add(`код ${sec.id} → ${kodNaSayte(`${sec.id}-01`)}`);
  }
  const d = dannyeTrenazhera();
  if (JSON.stringify(d).includes('"answer"')) add('в данных страницы есть поле answer');
  if (d.bank.length !== BANK.length + RAZMINKA.length)
    add('в данных не все задачи банка и разминки');
  if (d.razdely.map((r) => r.id).join() !== SEKCII.map((x) => x.id).join())
    add('разделы не по порядку');
  for (const r of d.razdely) {
    if (!d.ssylki[r.id] || d.ssylki[r.id].teoriya === '') add(`у ${r.id} нет ссылки на теорию`);
  }
  const vse = d.razdely.flatMap((r) => r.podtipy);
  const ids = vse.map((x) => x.id);

  /* План: «только банк» — без разминки и повторов, не больше банка. */
  const bankPlan = planSessii({ podtipy: ids, istochnik: 'bank', count: 500 }, d.bank, 's1');
  if (bankPlan.some((x) => x.vid !== 'bank' || x.id.startsWith('RZ-')))
    add('в режиме «банк» есть не банк');
  if (bankPlan.length !== BANK.length)
    add(`«банк»: ${bankPlan.length} задач вместо ${BANK.length}`);
  if (new Set(bankPlan.map(klyuchZadachi)).size !== bankPlan.length)
    add('«банк»: задачи повторяются');
  for (let i = 1; i < bankPlan.length; i += 1) {
    if (
      bankPlan[i].id === bankPlan[i - 1].id &&
      new Set(bankPlan.map((x) => x.id)).size > 1 &&
      i < 30
    ) {
      add('«банк»: подряд две задачи одного подтипа');
      break;
    }
  }
  const malo = planSessii({ podtipy: ['DP-07'], istochnik: 'bank', count: 50 }, d.bank, 's2');
  if (malo.length !== bankDlya(['DP-07'], d.bank, 'bank').length) add('«банк»: план длиннее банка');
  const mix = planSessii(
    { podtipy: ['DP-07', 'RZ-01'], istochnik: 'mix', count: 20 },
    d.bank,
    's3',
  );
  if (mix.length !== 20 || !mix.some((x) => x.vid === 'new') || !mix.some((x) => x.vid !== 'new')) {
    add('«банк + новые»: нет смеси или не та длина');
  }
  if (!mix.some((x) => x.vid === 'razminka')) add('«банк + новые»: нет задач разминки для РЗ');
  const novye = planSessii(
    { podtipy: ['VD-01', 'RB-03'], istochnik: 'new', count: 12 },
    d.bank,
    's4',
  );
  if (novye.length !== 12 || novye.some((x) => x.vid !== 'new')) add('«только новые»: не то');
  if (planSessii({ podtipy: ['RZ-01'], istochnik: 'bank', count: 5 }, d.bank, 's5').length !== 0) {
    add('«банк»: разминка не скрыта');
  }
  if (podtipKlyucha(klyuchZadachi({ vid: 'new', id: 'DP-07', seed: 'x' })) !== 'DP-07')
    add('ключ задачи');
  const n0 = {
    istochnik: 'bank',
    podtipy: ['RZ-01', 'DP-07', 'DP-10'],
    count: 5,
    uroven: 3,
    podskazki: true,
  };
  if (
    vTrenirovke(n0, vse)
      .map((x) => x.id)
      .join() !== 'DP-10'
  )
    add('фильтр уровня и разминки');
  const [lo, hi] = primernoeVremya([1, 2, 3], 15);
  if (!(lo > 0 && hi > lo)) add('примерное время');

  /* Каждая задача банка и разминки, по 3 новых на подтип: закрытый
     ответ узнаётся, подсказки и разбор открываются. */
  const plany = [
    ...d.bank.map((b) => ({ vid: b.razminka ? 'razminka' : 'bank', no: b.no, id: b.id })),
    ...ids.flatMap((id) => [0, 1, 2].map((k) => ({ vid: 'new', id, seed: `t${k}` }))),
  ];
  const otvetBanka = new Map(d.bank.map((b, i) => [b.no, [...BANK, ...RAZMINKA][i].answer]));
  for (const plan of plany) {
    let z;
    try {
      z = sobratZadachu(plan, d.bank);
    } catch (e) {
      add(`${klyuchZadachi(plan)}: не собралась — ${e.message}`);
      continue;
    }
    trenazher.zadach += 1;
    if (plan.vid !== 'new') {
      const a = otvetBanka.get(plan.no);
      const ok =
        z.answerType === 'choice'
          ? z.vybory.length >= 2
          : answerMatches(String(a).replace('.', ','), z.seal);
      if (!ok) add(`${klyuchZadachi(plan)}: отпечаток не узнаёт ответ ${a}`);
    }
    if (z.answerType === 'choice' && !z.vybory.some((v) => choiceMatches(v.number, z.seal))) {
      add(`${klyuchZadachi(plan)}: нет верного варианта`);
    }
    try {
      const p = JSON.parse(openText(z.podskazki, z.seal));
      const r = JSON.parse(openText(z.razbor, z.seal));
      if (!Array.isArray(p.shagi) || p.shagi.length === 0)
        add(`${klyuchZadachi(plan)}: нет подсказок`);
      if (!Array.isArray(r.etapy) || r.etapy.length === 0)
        add(`${klyuchZadachi(plan)}: нет разбора`);
    } catch {
      add(`${klyuchZadachi(plan)}: подсказки или разбор не открываются`);
    }
    if (z.uslovieHtml.includes('$')) add(`${klyuchZadachi(plan)}: формула не набрана`);
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
console.log(`опорные задачи: ${prep.generated} вариантов, по ${prepSeeds} seed на микрозадачу`);
const poor = gen.stats.filter((x) => x.distinct < seeds / 2);
if (poor.length > 0) {
  console.log(`  мало разных задач: ${poor.map((x) => `${x.id} (${x.distinct})`).join(', ')}`);
}
console.log(`тренажёр: ${trenazher.zadach} задач собрано в закрытом виде`);
console.log(`проблем: ${problems.length}`);
for (const p of problems.slice(0, 80)) {
  console.log(`  ${p.where} — ${p.what}`);
}
if (problems.length > 0) {
  process.exitCode = 1;
}
