#!/usr/bin/env node
/* scripts/check-variant-kabinet.mjs — онлайн-вариант через кабинет (этап 2),
   пробная реализация кабинета (lib/kabinet/localApi + localVariant) на Node.

   Запуск: pnpm test:variant-kabinet

   Те же правила, что у функций базы (supabase/tests/variant.test.sql
   проверяет их в PostgreSQL):
     1. Выдаёт репетитор своим ученикам: серия из 2 вариантов «Собрать
        вариант» по коду партии; номера вариантов в партии сохранены.
     2. Ученик получает условия без ключа: в данных работы нет верных
        ответов и подсказок.
     3. Тренировка: неверная запись не тратит попытку; ошибка — подсказки
        с сервера; вторая попытка; в баллы идёт первая.
     4. Контрольная: проверки до завершения нет; черновик сохраняется;
        баллы и ключ — после завершения.
     5. Репетитор: таблица класса, средние, выгрузка в Excel — настоящий
        .xlsx (zip читается, строки на месте — openpyxl, если есть).
     6. Kabinet-проверка (lib/variant/online/kabinetProverka) — тот же
        интерфейс, что у проверки в браузере. */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { requireSrc, SRC } from './lib/load-ts.mjs';

const warn = console.warn;
console.warn = (...a) => (String(a[0]).includes('LaTeX-incompatible') ? undefined : warn(...a));

/* ── localStorage на Node ─────────────────────────────────────────── */
const memory = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => (memory.has(key) ? memory.get(key) : null),
    setItem: (key, value) => memory.set(key, String(value)),
    removeItem: (key) => memory.delete(key),
    key: (i) => [...memory.keys()][i] ?? null,
    get length() {
      return memory.size;
    },
  },
  addEventListener() {},
  removeEventListener() {},
};

let failures = 0;
let checks = 0;
function ok(cond, what) {
  checks += 1;
  if (!cond) {
    failures += 1;
    console.error(`  ✗ ${what}`);
  }
}
async function fails(promise, code, what) {
  try {
    await promise;
    ok(false, `${what}: прошло, а не должно`);
  } catch (e) {
    ok(e?.code === code, `${what}: ждали ${code}, получили ${e?.code ?? e}`);
  }
}

const { createLocalApi } = requireSrc('lib/kabinet/localApi');
const { buildVariantSet } = requireSrc('lib/variant/build');
const { encodeCode } = requireSrc('lib/variant/code');
const { normalizeAnswer } = requireSrc('lib/variant/online/normalize');
const { issueInput } = requireSrc('lib/variant/online/issue');
const { kabinetProverka } = requireSrc('lib/variant/online/kabinetProverka');
const { classTable, excelRows, excelName } = requireSrc('lib/variant/online/classResults');
const { xlsx, crc32 } = requireSrc('lib/xlsx');

/* ── Партия «Собрать вариант» ─────────────────────────────────────── */
const adapters = new Map();
for (let n = 1; n <= 13; n += 1) {
  const p = String(n).padStart(2, '0');
  const { section } = requireSrc(`lib/variant/adapters/z${p}/index`);
  const df = `lib/variant/data/z${p}`;
  const data = fs.existsSync(path.join(SRC, `${df}.ts`)) ? requireSrc(df).dannye() : null;
  adapters.set(n, section.init(data == null ? null : JSON.parse(JSON.stringify(data))));
}
const subtypeIds = {};
for (let n = 1; n <= 13; n += 1) subtypeIds[n] = adapters.get(n).info.subtypes.map((s) => s.id);
const ALL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
const config = { tasks: ALL, subtypes: {}, source: 'mix', stars: [], count: 3, parallel: false };
const CODE = encodeCode({ seed: 'KB2E', config, zameny: {}, version: '00' }, subtypeIds);
const SET = buildVariantSet(
  { config, seed: 'KB2E', zameny: {}, version: '00', code: CODE },
  adapters,
);
const key = (v, i) => normalizeAnswer(SET.variants[v - 1].tasks[i].answer).value;

/* ── Люди ─────────────────────────────────────────────────────────── */
const api = createLocalApi();
const form = (name, email) => ({
  name,
  email,
  birthYear: 2000,
  parentEmail: null,
  grade: 11,
  acceptSoglashenie: true,
  acceptSoglasie: true,
});
await api.bootstrapAdmin(form('Наталья', 'admin@x.ru'));
const tutorCode = await api.createInvitation('tutor');
await api.register(tutorCode, form('Репетитор Анна', 't@x.ru'));
const tutorId = (await api.me()).id;
const classId = await api.createClass('11 «А»');
const c1 = await api.createInvitation('student', classId);
const c2 = await api.createInvitation('student', classId);
await api.register(c1, form('Ученик Пётр', 's1@x.ru'));
const s1 = (await api.me()).id;
api.trial.signIn(tutorId);
await api.register(c2, form('Ученица Вера', 's2@x.ru'));
const s2 = (await api.me()).id;
const asTutor = () => api.trial.signIn(tutorId);

console.log('1. Выдача');
asTutor();
const base = { title: 'Пробный ЕГЭ', kind: 'probnik', dueAt: null, classId, studentIds: [] };
const trening = await api.issueVariantWork(
  issueInput(SET, { ...base, mode: 'trening', timer: { kind: 'none' }, variants: [2, 3] }),
);
const kontrol = await api.issueVariantWork(
  issueInput(SET, {
    ...base,
    mode: 'kontrol',
    timer: { kind: 'down', minutes: 90 },
    variants: [1],
  }),
);
let view = await api.variantWork(trening);
ok(
  view.work.variants === 2 && view.work.setVariants.join() === '2,3',
  'серия: 2 варианта, номера в партии 2 и 3',
);
ok(view.results.length === 2, 'получатели — класс');
const bad = issueInput(SET, { ...base, mode: 'trening', timer: { kind: 'none' }, variants: [1] });
bad.variants[0].tasks[0].answer = '1/2';
await fails(api.issueVariantWork(bad), 'bad_answer', 'ключ не в формате ЕГЭ');
api.trial.signIn(s1);
await fails(api.issueVariantWork(bad), 'forbidden', 'ученик не выдаёт');

console.log('2. Ключ закрыт от ученика');
view = await api.variantWork(trening);
const json = JSON.stringify(view);
ok(view.results === null, 'ученику — без итогов класса');
ok(!/"answer"|"hints"|"key"/.test(json), 'в работе ученика нет полей ответа и подсказок');
ok(
  view.tasks[0].length === 13 && view.tasks[0][0].statement === SET.variants[1].tasks[0].statement,
  'условия — те же, что у листа',
);

console.log('3. Тренировка');
const start = await api.variantStart(trening, 1);
const pv = kabinetProverka(api, start.attemptId);
ok((await pv.checkOne(0, '1/2')).kind === 'format', 'неверная запись — подсказка о формате');
ok((await pv.checkOne(0, key(2, 0).replace('.', ','))).kind === 'right', 'верно с запятой');
const wrong = await pv.checkOne(6, '123456789');
ok(wrong.kind === 'wrong', 'неверно');
const hasHints = (SET.variants[1].tasks[6].hints ?? []).length > 0;
ok(!hasHints || (wrong.hints?.length ?? 0) > 0, 'с ошибкой пришли подсказки (№7)');
ok((await pv.checkOne(6, key(2, 6))).kind === 'right', 'вторая попытка верна');
await fails(
  api.variantCheck(start.attemptId, 7, key(2, 6)),
  'already_checked',
  'третьей попытки нет',
);
ok(
  (await api.variantStart(trening, 1)).attemptId === start.attemptId,
  'незавершённая попытка продолжается',
);
const answers = SET.variants[1].tasks.map((_, i) =>
  i < 2 || i === 6 ? '' : i % 2 === 0 ? key(2, i) : '0',
);
const check = await pv.finish(answers, { seconds: ALL.map((n) => n * 10), hinted: [6] });
const res = pv.lastResult();
const expected = SET.variants[1].tasks.filter(
  (_, i) => i === 0 || (i > 1 && i !== 6 && i % 2 === 0) || (i % 2 === 1 && key(2, i) === '0'),
).length;
ok(
  res.primary === expected,
  `баллы: первая попытка (${res.primary} из ${res.max}, ждали ${expected})`,
);
ok(
  check.right[6] === false && res.tasks[6].secondRight === true && res.tasks[6].hinted,
  '№7: в баллы не идёт, исправлено и с подсказкой',
);
ok(
  check.answers.every((a) => normalizeAnswer(a).ok),
  'ключ — после завершения, в записи бланка',
);
ok(res.seconds === ALL.reduce((s, n) => s + n * 10, 0), 'время — сумма по заданиям');
await fails(
  api.variantCheck(start.attemptId, 1, '1'),
  'already_finished',
  'после завершения не проверяется',
);

console.log('4. Контрольная');
api.trial.signIn(s2);
const k = await api.variantStart(kontrol, 1);
ok(
  k.deadlineAt !== null && Math.abs(Date.parse(k.deadlineAt) - Date.now() - 90 * 60_000) < 5000,
  'отсчёт 90 минут — от сервера',
);
await fails(api.variantCheck(k.attemptId, 1, key(1, 0)), 'kontrol', 'до завершения не проверяется');
await api.variantSaveDraft(k.attemptId, { answers: { 0: '5' }, later: [3] });
ok(
  JSON.stringify((await api.variantStart(kontrol, 1)).draft) ===
    JSON.stringify({ answers: { 0: '5' }, later: [3] }),
  'черновик вернулся (другое устройство)',
);
const kr = await api.variantSubmit(
  k.attemptId,
  SET.variants[0].tasks.map((_, i) => key(1, i)),
  [],
  [],
);
ok(kr.primary === 13 && kr.max === 13 && !kr.late, 'контрольная: все верно, в срок');

console.log('5. Репетитор: таблица класса и Excel');
asTutor();
const kv = await api.variantWork(kontrol);
const table = classTable(kv);
ok(table.finished === 1 && table.total === 2, 'сдали 1 из 2');
ok(
  table.average.every((x) => x === 1),
  'средние по номерам: 100%',
);
ok(
  table.rows.find((r) => r.student.id === s2)?.test === 72,
  'тестовый балл ученицы: 13 первичных → 72 по шкале',
);
const tv = await api.variantWork(trening);
const tt = classTable(tv);
ok(
  tt.rows.find((r) => r.student.id === s1)?.attempt?.primary === res.primary,
  'репетитор видит баллы ученика',
);
const rows = excelRows(tt);
ok(
  rows.length === 4 && rows[0][0] === 'Ученик' && rows[3][0] === 'Среднее по классу',
  'строки Excel: заголовок, ученики, среднее',
);
ok(
  excelName({ work: { title: 'Пробный: ЕГЭ', className: '11 «А»' } }) ===
    'Пробный  ЕГЭ — 11 «А».xlsx',
  'имя файла Excel: название и класс, без запрещённых знаков',
);
const bytes = xlsx('Пробный ЕГЭ', rows, [24]);
ok(crc32(new TextEncoder().encode('123456789')) === 0xcbf43926, 'crc32');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xlsx-'));
const file = path.join(dir, 'r.xlsx');
fs.writeFileSync(file, bytes);
const unzip = spawnSync('unzip', ['-t', file], { encoding: 'utf8' });
if (unzip.status === null) console.log('   unzip не найден — проверка архива пропущена');
else
  ok(unzip.status === 0, `архив .xlsx читается: ${unzip.stdout.split('\n').slice(-2).join(' ')}`);
const py = spawnSync(
  'python3',
  [
    '-c',
    'import sys, openpyxl; ws = openpyxl.load_workbook(sys.argv[1]).active; print(ws["A1"].value, "|", ws["A4"].value, "|", ws.max_row)',
    file,
  ],
  { encoding: 'utf8' },
);
if (py.status === 0)
  ok(
    py.stdout.trim() === 'Ученик | Среднее по классу | 4',
    `openpyxl читает файл: ${py.stdout.trim()}`,
  );
else console.log('   openpyxl не установлен — проверка книги пропущена');
fs.rmSync(dir, { recursive: true, force: true });

console.log('6. Чужие');
await api.bootstrapAdmin(form('x', 'x@x.ru')).catch(() => undefined);
api.trial.signIn(s1);
await fails(api.variantResult(kr.id), 'not_your_attempt', 'чужой итог закрыт');

const studentHome = await api.studentHome();
ok(
  studentHome.variantWorks.length === 2 &&
    studentHome.variantWorks.some((w) => w.attempts.length === 1),
  'у ученика — работы и итоги для статистики',
);
asTutor();
const tutorHome = await api.tutorHome();
ok(tutorHome.variantWorks.length === 2, 'у репетитора — выданные работы');

console.log(`\nПроверок: ${checks}, ошибок: ${failures}`);
process.exit(failures === 0 ? 0 : 1);
