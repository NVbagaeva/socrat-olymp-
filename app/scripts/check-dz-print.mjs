#!/usr/bin/env node
/* scripts/check-dz-print.mjs — печать домашнего задания (lib/dz/print.ts).

   Запуск: node scripts/check-dz-print.mjs

   Задачи ДЗ собираются так же, как при выдаче (lib/dz/z08.ts: byKinds,
   mistakesOf, placeTasks): условия и решения настоящие, набранные KaTeX.
   Дальше они лежат как строки базы (homework_tasks + homework_keys), и
   из них собираются описания листов и сами документы (buildDocument).

   Проверяется:
     • листы ученика и учителя одного ДЗ — те же задачи, те же условия,
       тот же порядок (по position, а не по порядку строк);
     • на листе ученика нет ответов, решений, таблицы «Ответы» и
       источника задач («банк», «новая»), а ключи он даже не читает;
     • на листе учителя у каждой задачи решение и ответ, в таблице —
       ответ и источник;
     • клетка (kletka=1) меняет только лист ученика;
     • индивидуальное ДЗ: каждый ученик — своим вариантом под своим
       именем; печать одного ученика — только его задачи;
     • вёрстка из базы проходит через sanitize, простой текст (название,
       комментарий, имена, ответ, источник) экранируется.

   Очистка здесь — заменитель sanitizeHtml (тот работает с DOM браузера):
   вырезает <script>, <img> и обработчики on*=, а заодно запоминает всё,
   что через неё прошло. */

import { requireSrc } from './lib/load-ts.mjs';

const z08 = requireSrc('lib/dz/z08');
const print = requireSrc('lib/dz/print');
const { buildDocument } = requireSrc('lib/sheet/sheet.js');
const { displayAnswer } = requireSrc('lib/otvet');

let checks = 0;
const failures = [];

function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
}

function same(a, b, what) {
  const x = JSON.stringify(a);
  const y = JSON.stringify(b);
  check(x === y, `${what}\n      ожидалось ${y.slice(0, 300)}\n      вышло     ${x.slice(0, 300)}`);
}

/* ── Очистка ─────────────────────────────────────────────────────── */

const seen = new Set();

function sanitize(html) {
  seen.add(html);
  return String(html)
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<\/?(?:img|iframe|object|embed|a|link|style)\b[^>]*>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}

const identity = (html) => html;

/* ── ДЗ как строки базы ─────────────────────────────────────────── */

/**
 * Задачи выдачи → homework_tasks и homework_keys. Строки лежат в
 * обратном порядке: лист обязан сам расставить задачи по position.
 */
function asRows(placed, prefix) {
  const tasks = placed.map((t, i) => ({
    id: `${prefix}-${i + 1}`,
    position: t.position,
    kind: t.kind,
    questionHtml: t.questionHtml,
    comment: t.comment,
    studentId: t.studentId,
  }));
  const keys = new Map(
    placed.map((t, i) => [
      `${prefix}-${i + 1}`,
      { ref: t.ref, answer: t.answer, razbor: t.razbor, source: t.source },
    ]),
  );
  return { tasks: tasks.slice().reverse(), keys };
}

const HW = {
  title: 'Степени и логарифмы',
  note: 'Решите до пятницы.\nУдачи!',
  dueAt: null,
  taskNo: 8,
};

/* Общее ДЗ: задачи банка и свежие («новая») — у листа учителя оба источника. */
const bank = z08.byKinds(['8.A', '8.C', '8.H'], 2, 1)[0];
const fresh = z08.mistakesOf([bank[0].ref, bank[2].ref]);
const sharedRows = asRows(z08.placeTasks([[...bank, ...fresh]], ['s1', 's2'], false), 'sh');
const shared = {
  hw: HW,
  ...sharedRows,
  recipients: [
    { userId: 's1', name: 'Аня Иванова' },
    { userId: 's2', name: 'Борис Петров' },
  ],
};
const sharedSorted = shared.tasks.slice().sort((a, b) => a.position - b.position);
const sources = [...shared.keys.values()].map((k) => k.source);
check(sharedSorted.length === 8, `общее ДЗ: 8 задач, вышло ${sharedSorted.length}`);
check(
  sources.some((s) => s.startsWith('банк')),
  'в общем ДЗ есть задачи банка',
);
check(sources.includes('новая'), 'в общем ДЗ есть свежие задачи («новая»)');

/* Индивидуальное ДЗ: трём ученикам свои задачи; у третьего нет имени. */
const STUDENTS = ['u1', 'u2', 'u3'];
const indRows = asRows(z08.placeTasks(z08.byKinds(['8.A', '8.C'], 2, 3), STUDENTS, true), 'in');
const individual = {
  hw: { ...HW, title: 'Индивидуальное', note: '' },
  ...indRows,
  recipients: [
    { userId: 'u1', name: 'Аня Иванова' },
    { userId: 'u2', name: 'Борис Петров' },
    { userId: 'u3', name: '' },
  ],
};
const NAMES = ['Аня Иванова', 'Борис Петров', 'Ученик 3'];
const ownIds = (id) =>
  individual.tasks
    .filter((t) => t.studentId === id)
    .sort((a, b) => a.position - b.position)
    .map((t) => t.id);

/* ── Чтение листа ────────────────────────────────────────────────── */

const spec = (source, list, more = {}) =>
  print.printSpec(source, { list, grid: false, sanitize, ...more });

const tasksOfSpec = (s) =>
  (s.variants ?? [{ blocks: s.blocks }]).flatMap((v) => v.blocks.flatMap((b) => b.tasks));

/** Документ как его собирает buildDocument — для проверок «ничего не просочилось». */
const rawOf = (s) => buildDocument(s, {});

/**
 * Что увидит человек: название вкладки, шапки, начало листа и куски
 * потока из описания для paginate.js (там они лежат строками JSON).
 * Неразрывные пробелы типографики — обычными: так проще искать текст.
 */
function docOf(s) {
  const raw = rawOf(s);
  const open = raw.indexOf('<script type="application/json" id="sheet-spec">');
  const start = raw.indexOf('>', open) + 1;
  const data = JSON.parse(raw.slice(start, raw.indexOf('</script>', start)));
  const title = /<title>[\s\S]*?<\/title>/.exec(raw)?.[0] ?? '';
  return [title, data.fullHead, data.compactHead, data.opening, ...data.items, data.footer]
    .join('\n')
    .replace(/\u00a0/g, ' ');
}

/** [id задачи, условие] по порядку карточек. */
function cards(doc) {
  return [
    ...doc.matchAll(/data-task="([^"]*)"[\s\S]*?<p class="sheet-task-question">([\s\S]*?)<\/p>/g),
  ].map((m) => [m[1], m[2]]);
}

const count = (doc, needle) => doc.split(needle).length - 1;

/* ── 1. Общее ДЗ: те же задачи на двух листах ───────────────────── */

const uchenik = spec(shared, 'uchenik');
const uchitel = spec(shared, 'uchitel');
const ids = sharedSorted.map((t) => t.id);

same(
  tasksOfSpec(uchenik).map((t) => t.id),
  ids,
  'ученик: задачи по position',
);
same(
  tasksOfSpec(uchitel).map((t) => t.id),
  ids,
  'учитель: задачи по position',
);
same(
  tasksOfSpec(uchenik).map((t) => t.questionHtml),
  sharedSorted.map((t) => sanitize(t.questionHtml)),
  'ученик: условия — очищенные строки базы',
);
same(
  tasksOfSpec(uchitel).map((t) => [t.no, t.questionHtml]),
  tasksOfSpec(uchenik).map((t) => [t.no, t.questionHtml]),
  'учитель и ученик: те же номера и условия',
);
check(uchenik.variants === undefined, 'общее ДЗ — один лист, без вариантов');
check(uchenik.title.variant === undefined, 'общее ДЗ: имени ученика в названии нет');

const docUchenik = docOf(uchenik);
const docUchitel = docOf(uchitel);
const cardsUchenik = cards(docUchenik);
same(
  cardsUchenik.map(([id]) => id),
  ids,
  'документ ученика: карточки по порядку',
);
same(cards(docUchitel), cardsUchenik, 'документы ученика и учителя: те же карточки и условия');
check(
  cardsUchenik.every(([, q]) => q.includes('class="katex"')),
  'условия — вёрстка KaTeX',
);
check(
  docUchenik.includes(HW.title) && docUchitel.includes(HW.title),
  'название ДЗ на обоих листах',
);
check(
  docUchenik.includes('Решите до пятницы.<br>Удачи!'),
  'комментарий репетитора на листе ученика (с переносом строки)',
);

/* ── 2. Лист ученика: ни ответов, ни решений, ни источника ──────── */

for (const needle of [
  'sheet-task-solution',
  'sheet-task-answer',
  'sheet-steps',
  'data-answer',
  'sheet-key-',
  'Признаки делимости',
  '>Ответы<',
]) {
  check(!docUchenik.includes(needle), `ученик: на листе нет «${needle}»`);
}
for (const word of ['банк', 'Банк', 'новая', 'Новая']) {
  check(!docUchenik.includes(word), `ученик: на листе нет «${word}»`);
}
for (const source of new Set(sources)) {
  check(!docUchenik.includes(source), `ученик: источник «${source}» не печатается`);
}
check(
  tasksOfSpec(uchenik).every((t) => t.solutionHtml === null),
  'ученик: у задач нет решения',
);
check(
  !/"(?:answer|source|razbor|ref)"/.test(JSON.stringify(uchenik)),
  'ученик: в описании нет ключей',
);
check(
  count(docUchenik, 'sheet-answer-line') === ids.length,
  'ученик: строка «Ответ: ____» у каждой задачи',
);
check(uchenik.fields !== null, 'ученик: строка «Фамилия, имя / Класс / Дата»');

seen.clear();
spec(shared, 'uchenik');
const razborSeen = [...shared.keys.values()].some((k) =>
  k.razbor.shagi.some((s) => seen.has(s.chto) || seen.has(s.tex)),
);
check(!razborSeen, 'ученик: лист без клетки не читает решений');

/* ── 3. Лист учителя: решение, ответ и источник ─────────────────── */

check(
  count(docUchitel, 'class="sheet-task-solution"') === ids.length,
  'учитель: решение у каждой задачи',
);
check(
  count(docUchitel, 'class="sheet-steps"') === ids.length,
  'учитель: шаги решения у каждой задачи',
);
for (const task of sharedSorted) {
  const key = shared.keys.get(task.id);
  const shown = displayAnswer(key.answer);
  check(
    docUchitel.includes(`Ответ: <b>${shown}</b>`),
    `учитель: ответ ${shown} в карточке ${task.id}`,
  );
  check(docUchitel.includes(`data-answer="${shown}"`), `учитель: ответ ${shown} в таблице`);
  check(
    docUchitel.includes(`class="sheet-key-method">${key.source}<`),
    `учитель: источник «${key.source}» в таблице`,
  );
}
check(docUchitel.includes('>Ответы<'), 'учитель: раздел «Ответы»');
check(uchitel.fields === null, 'учитель: без строки «Фамилия, имя»');
check(!docUchitel.includes('sheet-answer-line'), 'учитель: без строки «Ответ: ____»');

seen.clear();
spec(shared, 'uchitel');
const stored = [...shared.keys.values()].flatMap((k) => [
  ...k.razbor.shagi.flatMap((s) => [s.chto, s.tex]),
  ...k.razbor.delimost.map((d) => d.html),
]);
check(
  shared.tasks.every((t) => seen.has(t.questionHtml)) && stored.every((h) => seen.has(h)),
  'учитель: условия и все куски решений прошли через sanitize',
);

/* ── 4. Клетка — только у листа ученика ─────────────────────────── */

const uchenikGrid = spec(shared, 'uchenik', { grid: true });
const uchitelGrid = spec(shared, 'uchitel', { grid: true });
const docUchenikGrid = docOf(uchenikGrid);
check(
  tasksOfSpec(uchenikGrid).every((t) => t.space?.mode === 'grid' && t.space.rows >= 5),
  'клетка: поле у каждой задачи ученика',
);
check(count(docUchenikGrid, 'sheet-space--grid') === ids.length, 'клетка: сетка в документе');
check(!docUchenik.includes('sheet-space'), 'без клетки: поля нет');
check(
  count(docUchenikGrid, 'sheet-answer-line') === ids.length,
  'клетка: строка «Ответ: ____» на месте',
);
same(
  {
    ...uchenikGrid,
    blocks: uchenikGrid.blocks.map((b) => ({
      ...b,
      tasks: b.tasks.map(({ space: _, ...t }) => t),
    })),
  },
  uchenik,
  'клетка: кроме полей, лист ученика тот же',
);
same(uchitelGrid, uchitel, 'клетка: описание листа учителя не меняется');
check(docOf(uchitelGrid) === docUchitel, 'клетка: документ учителя не меняется');
same(cards(docUchenikGrid), cardsUchenik, 'клетка: те же карточки и условия');

/* ── 5. Индивидуальное ДЗ ───────────────────────────────────────── */

const indUchenik = spec(individual, 'uchenik');
const indUchitel = spec(individual, 'uchitel');
for (const [label, s] of [
  ['ученик', indUchenik],
  ['учитель', indUchitel],
]) {
  check(s.variants?.length === 3, `${label}: три варианта — по ученику`);
  same(
    (s.variants ?? []).map((v) => v.title.variant),
    NAMES,
    `${label}: имена учеников в названиях вариантов (без имени — «Ученик 3»)`,
  );
  STUDENTS.forEach((id, i) => {
    const tasks = s.variants?.[i]?.blocks.flatMap((b) => b.tasks) ?? [];
    same(
      tasks.map((t) => t.id),
      ownIds(id),
      `${label}: у ${NAMES[i]} только свои задачи`,
    );
    same(
      tasks.map((t) => t.no),
      ownIds(id).map((_, k) => k + 1),
      `${label}: у ${NAMES[i]} своя нумерация`,
    );
  });
}
const docIndUchenik = docOf(indUchenik);
const docIndUchitel = docOf(indUchitel);
same(
  cards(docIndUchitel),
  cards(docIndUchenik),
  'индивидуальное: те же карточки у ученика и учителя',
);
same(
  cards(docIndUchenik).map(([id]) => id),
  STUDENTS.flatMap(ownIds),
  'индивидуальное: варианты учеников подряд',
);
for (const name of NAMES) {
  check(docIndUchenik.includes(name), `индивидуальное: «${name}» на листе ученика`);
  check(
    docIndUchitel.slice(docIndUchitel.indexOf('>Ответы<')).includes(name),
    `индивидуальное: «${name}» над таблицей ответов`,
  );
}
check(
  count(docIndUchenik, 'data-section-start') === 3,
  'индивидуальное: каждый вариант с новой страницы',
);

for (const [i, id] of STUDENTS.entries()) {
  const one = spec(individual, 'uchenik', { studentId: id });
  const oneT = spec(individual, 'uchitel', { studentId: id });
  same(
    tasksOfSpec(one).map((t) => t.id),
    ownIds(id),
    `печать для ${NAMES[i]}: только его задачи`,
  );
  same(
    tasksOfSpec(oneT).map((t) => t.id),
    ownIds(id),
    `печать для ${NAMES[i]}, учитель: только его задачи`,
  );
  check(
    one.variants === undefined && one.title.variant === NAMES[i],
    `печать для ${NAMES[i]}: его имя`,
  );
  const doc = docOf(oneT);
  const others = STUDENTS.filter((x) => x !== id).flatMap(ownIds);
  check(
    !others.some((x) => doc.includes(`data-task="${x}"`)),
    `печать для ${NAMES[i]}: чужих задач нет`,
  );
  check(
    count(doc, 'data-answer=') === ownIds(id).length,
    `печать для ${NAMES[i]}: ответы только его задач`,
  );
  check(
    NAMES.filter((n) => n !== NAMES[i]).every((n) => !docOf(one).includes(n)),
    `печать для ${NAMES[i]}: чужих имён нет`,
  );
}
check(
  spec(individual, 'uchenik', { studentId: 'chuzhoy' }) === null,
  'чужой ученик — печатать нечего',
);
check(spec({ ...shared, tasks: [] }, 'uchenik') === null, 'ДЗ без задач — печатать нечего');
same(
  tasksOfSpec(spec(shared, 'uchenik', { studentId: 's2' })).map((t) => t.id),
  ids,
  'общее ДЗ для одного ученика — все задачи',
);

/* ── 6. Вёрстка из базы очищается, текст экранируется ───────────── */

const EVIL_HTML =
  '<script>alert(1)</script><img src=x onerror="alert(2)"><span onmouseover="alert(3)">!</span>';
const EVIL_TEXT = '<img src=x onerror=alert(4)>';
const firstKey = sharedRows.keys.get(sharedSorted[0].id);
const evil = {
  hw: { ...HW, title: `ДЗ ${EVIL_TEXT}`, note: `${EVIL_TEXT}<script>alert(5)</script>` },
  recipients: [{ userId: 's1', name: EVIL_TEXT }],
  tasks: shared.tasks.map((t) =>
    t.id === sharedSorted[0].id
      ? { ...t, questionHtml: t.questionHtml + EVIL_HTML, studentId: 's1' }
      : t,
  ),
  keys: new Map([
    ...shared.keys,
    [
      sharedSorted[0].id,
      {
        ...firstKey,
        answer: '<b>1</b>',
        source: EVIL_TEXT,
        razbor: {
          shagi: firstKey.razbor.shagi.map((s) => ({
            chto: s.chto + EVIL_HTML,
            tex: s.tex + EVIL_HTML,
          })),
          delimost: [{ title: EVIL_TEXT, html: EVIL_HTML }],
        },
      },
    ],
  ]),
};
const RAW_SCRIPT = /<script>alert/;
const ON_ATTR = /<[^<>]*\son[a-z]+\s*=/i;
const RAW_IMG = /<img\b/i;
for (const list of ['uchenik', 'uchitel']) {
  for (const studentId of [null, 's1']) {
    for (const grid of [false, true]) {
      const s = spec(evil, list, { studentId, grid });
      const label = `${list}${studentId === null ? '' : ', один ученик'}${grid ? ', клетка' : ''}`;
      for (const doc of [rawOf(s), docOf(s)]) {
        check(!RAW_SCRIPT.test(doc), `${label}: <script> из базы не попал в лист`);
        check(!ON_ATTR.test(doc), `${label}: обработчики on*= из базы не попали в лист`);
        check(!RAW_IMG.test(doc), `${label}: <img> из базы и из текста не попал в лист`);
        check(doc.includes('&lt;img'), `${label}: текст с «<» экранирован`);
      }
    }
  }
}
/* Контроль: без очистки вредная вёрстка дошла бы до листа — значит, её
   действительно убирает sanitize, а не что-то по дороге. */
const leaked = docOf(print.printSpec(evil, { list: 'uchitel', grid: false, sanitize: identity }));
check(
  RAW_SCRIPT.test(leaked) && ON_ATTR.test(leaked),
  'контроль: без sanitize вёрстка из базы дошла бы до листа',
);

/* ── 7. Адрес страницы печати ───────────────────────────────────── */

same(
  print.readPrintQuery(new URLSearchParams('id=abc&list=uchitel&kletka=1&uchenik=u2')),
  { id: 'abc', list: 'uchitel', grid: true, studentId: 'u2', theme: 'color' },
  'адрес: все параметры',
);
same(
  print.readPrintQuery(new URLSearchParams('id=abc&list=zzz')),
  { id: 'abc', list: 'uchenik', grid: false, studentId: null, theme: 'color' },
  'адрес: неизвестный лист — лист ученика',
);
check(
  print.withStudent('/kabinet/domashka/pechat/?id=abc&list=uchenik&kletka=1', 'u 2') ===
    '/kabinet/domashka/pechat/?id=abc&list=uchenik&kletka=1&uchenik=u+2',
  'адрес: вариант одного ученика',
);
check(
  print.withStudent('/kabinet/domashka/pechat/?id=abc&list=uchenik&uchenik=u2', null) ===
    '/kabinet/domashka/pechat/?id=abc&list=uchenik',
  'адрес: все ученики',
);

/* ── Итог ───────────────────────────────────────────────────────── */

console.log(`check-dz-print: проверок ${checks}, не прошло ${failures.length}.`);
if (failures.length > 0) {
  console.error('\nНе прошли:');
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
