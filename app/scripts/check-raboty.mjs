/* scripts/check-raboty.mjs — правила работ-вариантов пробного кабинета
   (lib/raboty/localApi.ts) — те же, что проверяют SQL-тесты базы
   (supabase/tests/raboty_chast2.test.sql):

     выдача только своим ученикам, срок, продление;
     ответы и фото только до срока и только своей работы;
     фото: проверка по содержимому, не больше 6, чужие — «не найдено»;
     сдача: часть 1 автоматически, «не приступал», автопроверка части 2;
     баллы не выше максимума, пересчёт, шкала 0…33, история;
     завершение только при всех 14–20, повторное открытие, уведомления;
     доработка: меняется только возвращённое задание;
     срок хранения фото: истёкшие удаляются.

   Запуск: node scripts/check-raboty.mjs */

import { requireSrc } from './lib/load-ts.mjs';

const { createLocalRaboty, memoryStore } = requireSrc('lib/raboty/localApi');
const { memoryBlobs } = requireSrc('lib/raboty/blobs');
const { TESTOVYJ } = requireSrc('content/variantOnline/shkala');
const { CHAST2_V01 } = requireSrc('lib/povyshennye/chast2/v01');

let checks = 0;
let failures = 0;
function ok(cond, what) {
  checks += 1;
  if (!cond) {
    failures += 1;
    console.error(`  ✗ ${what}`);
  }
}
async function throws(fn, code, what) {
  try {
    await fn();
    ok(false, `${what}: ошибки нет`);
  } catch (e) {
    ok(e?.code === code, `${what}: ждали ${code}, получили ${e?.code ?? e}`);
  }
}

/* ── Кабинет: учитель T с учениками A и B, чужой учитель X с учеником C ── */
const user = (id, role, extra = {}) => ({
  id,
  email: `${id}@test`,
  role,
  name: id,
  grade: null,
  birthYear: null,
  parentEmail: null,
  parentConfirmedAt: null,
  createdAt: '2026-09-01T00:00:00Z',
  consents: [],
  ...extra,
});
const kab = {
  v: 1,
  currentUserId: null,
  users: [
    user('T', 'tutor'),
    user('X', 'tutor'),
    user('A', 'student'),
    user('B', 'student'),
    user('C', 'student'),
    user('P', 'student', { parentEmail: 'p@test' }),
  ],
  invitations: [],
  links: [
    { tutorId: 'T', studentId: 'A', linkedAt: '', endedAt: null },
    { tutorId: 'T', studentId: 'B', linkedAt: '', endedAt: null },
    { tutorId: 'T', studentId: 'P', linkedAt: '', endedAt: null },
    { tutorId: 'X', studentId: 'C', linkedAt: '', endedAt: null },
  ],
  classes: [],
  members: [],
  homework: [],
  recipients: [],
  attempts: [],
  sessions: [],
};
const as = (id) => {
  kab.currentUserId = id;
};

let now = new Date('2026-10-20T10:00:00Z');
let online = true;
const keys = {
  part1: Array.from({ length: 13 }, (_, i) => ({ taskNo: i + 1, answer: String(i + 1) })),
  part2: CHAST2_V01[1],
};
const api = createLocalRaboty({
  store: memoryStore(),
  blobs: memoryBlobs(),
  kabinet: () => kab,
  now: () => now,
  keys: async () => keys,
  online: () => online,
  toUrl: () => 'blob:test',
});
const jpeg = (n = 100) =>
  new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...new Array(n).fill(1)])]);
const png = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3])]);
const meta = { width: 1500, height: 2000 };

console.log('1. Выдача');
as('A');
await throws(
  () =>
    api.issueWork({
      title: 'x',
      note: null,
      dueAt: null,
      classId: null,
      students: ['A'],
      code: 'PV-01',
      versiya: 1,
      part2Mode: 'teacher',
    }),
  'forbidden',
  'ученик не выдаёт',
);
as('T');
const base = {
  title: 'Пробник',
  note: null,
  dueAt: '2026-10-27T18:00:00Z',
  classId: null,
  code: 'PV-01',
  versiya: 1,
  part2Mode: 'teacher',
};
await throws(
  () => api.issueWork({ ...base, students: ['C'] }),
  'not_your_student',
  'чужому ученику',
);
await throws(
  () => api.issueWork({ ...base, students: ['A'], dueAt: '2026-10-01T00:00:00Z' }),
  'bad_due',
  'срок в прошлом',
);
const W = await api.issueWork({ ...base, students: ['A', 'B', 'P'] });
ok(typeof W === 'string', 'работа выдана');
as('A');
ok((await api.myWorks()).length === 1, 'ученик видит выданную работу');
ok(
  (await api.notices()).some((n) => n.kind === 'work_issued'),
  'уведомление «выдана»',
);
as('C');
ok((await api.myWorks()).length === 0, 'чужой ученик работы не видит');
ok((await api.studentWork(W)) === null, 'чужой ученик не открывает работу по id');
await throws(() => api.saveAnswer(W, 1, '', '1'), 'not_your_work', 'чужой ученик не пишет ответ');
as('P');
await throws(() => api.saveAnswer(W, 1, '', '1'), 'progress_not_allowed', 'без согласия родителя');

console.log('2. Ответы и фото');
as('A');
for (let i = 1; i <= 13; i += 1) await api.saveAnswer(W, i, '', i <= 10 ? String(i) : '999');
await api.saveAnswer(W, 14, '0', ['2\\pi n', '-\\frac{\\pi}{2}+2\\pi n']);
await api.saveAnswer(W, 14, '1', ['\\frac{7\\pi}{2}', '4\\pi']);
await api.saveAnswer(W, 16, '0', {
  kuski: [{ t: 'interval', lo: '1', hi: '2', loZakr: true, hiZakr: false }],
});
await throws(() => api.uploadPhoto(W, 15, png, meta), 'not_image', 'не JPEG — отказ');
await throws(() => api.uploadPhoto(W, 15, jpeg(3_100_000), meta), 'too_big', 'больше 3 МБ — отказ');
await throws(() => api.uploadPhoto(W, 13, jpeg(), meta), 'bad_task', 'фото к части 1 — отказ');
online = false;
await throws(
  () => api.uploadPhoto(W, 15, jpeg(), meta),
  'offline',
  'без связи — «offline» для очереди',
);
online = true;
const ph = [];
for (let i = 0; i < 6; i += 1) ph.push(await api.uploadPhoto(W, 15, jpeg(), meta));
ok(ph.map((p) => p.position).join() === '1,2,3,4,5,6', 'позиции 1…6');
await throws(() => api.uploadPhoto(W, 15, jpeg(), meta), 'too_many', 'седьмое фото — отказ');
await api.orderPhotos(W, 15, [ph[5].id, ...ph.slice(0, 5).map((p) => p.id)]);
let sw = await api.studentWork(W);
ok(
  sw.photos.filter((p) => p.taskNo === 15)[0].id === ph[5].id,
  'порядок фото меняется перетаскиванием',
);
await api.deletePhoto(ph[5].id);
sw = await api.studentWork(W);
ok(
  sw.photos
    .filter((p) => p.taskNo === 15)
    .map((p) => p.position)
    .join() === '1,2,3,4,5',
  'после удаления позиции сжимаются',
);
ok(sw.photos[0].expiresAt === '2027-08-31T20:59:59.000Z', 'срок хранения — конец учебного года');
ok((await api.photoUrl(ph[0].id)) === 'blob:test', 'ученик открывает своё фото');
as('B');
await throws(
  () => api.photoUrl(ph[0].id),
  'not_found',
  'другой ученик того же учителя — «не найдено»',
);
as('C');
await throws(() => api.photoUrl(ph[0].id), 'not_found', 'чужой ученик — «не найдено»');
as('X');
await throws(() => api.photoUrl(ph[0].id), 'not_found', 'чужой учитель — «не найдено»');
as('T');
ok((await api.photoUrl(ph[0].id)) === 'blob:test', 'свой учитель открывает фото');
as('B');
await throws(() => api.deletePhoto(ph[0].id), 'not_found', 'чужое фото не удаляется');

console.log('3. Сдача');
as('T');
ok((await api.checkList()).length === 0, 'черновик учителю не виден');
as('A');
await api.submitWork(W);
await throws(() => api.submitWork(W), 'already_submitted', 'повторная сдача');
await throws(() => api.saveAnswer(W, 1, '', '5'), 'closed', 'после сдачи ответ не меняется');
await throws(
  () => api.uploadPhoto(W, 17, jpeg(), meta),
  'closed',
  'после сдачи фото не добавляется',
);
sw = await api.studentWork(W);
ok(sw.score.part1 === 10, `часть 1 проверена сразу: ${sw.score.part1}`);
ok(sw.score.test === null, 'тестовый балл ученику — только после проверки');
ok(!sw.grades.some((g) => g.taskNo >= 14), 'баллы части 2 до проверки ученику не видны');
as('T');
let cw = await api.checkWork((await api.checkList())[0].submissionId);
const S = cw.submission.id;
const g = (no) => cw.grades.find((x) => x.taskNo === no);
ok(g(17)?.nePristupal === true && g(17).ball === 0, '№17 без ответа и фото — 0 «не приступал»');
ok(g(15) === undefined, '№15 с фото — не «не приступал»');
ok(g(14) === undefined, '№14 с ответом — не «не приступал»');
ok(
  cw.answers.find((a) => a.taskNo === 14 && a.punkt === '0').auto === 'sovpadaet',
  'автопроверка №14 а — совпадает',
);
ok(
  cw.answers.find((a) => a.taskNo === 16).auto === 'ne-sovpadaet',
  'автопроверка №16 — не совпадает',
);
ok(
  (await api.notices()).some((n) => n.kind === 'work_submitted'),
  'учителю — «сдана»',
);
as('X');
ok((await api.checkWork(S)) === null, 'чужой учитель работу не открывает');
await throws(() => api.startCheck(S), 'forbidden', 'чужой учитель не проверяет');

console.log('4. Проверка');
as('T');
await throws(() => api.setGrade(S, 14, 2, 0, 0, null), 'not_checking', 'балл до «начать проверку»');
await api.startCheck(S);
await throws(() => api.setGrade(S, 14, 3, 0, 0, null), 'ball_over_max', '№14: 3 > 2 — отказ');
await throws(() => api.setGrade(S, 19, 5, 0, 0, null), 'ball_over_max', '№19: 5 > 4 — отказ');
await throws(() => api.setGrade(S, 5, 1, 0, 0, null), 'part2_only', 'часть 1 не через set_grade');
await throws(() => api.finishCheck(S, null), 'not_graded', 'завершение без всех 14–20');
/* №17–20 без ответа и фото уже «не приступал» (0); №14–16 ждут оценки. */
const bally = { 14: 2, 15: 3, 17: 0, 18: 2, 19: 4 };
for (const [no, b] of Object.entries(bally)) await api.setGrade(S, Number(no), b, 0, 0, 'ок');
await throws(
  () => api.finishCheck(S, null),
  /* №16 */ 'not_graded',
  'не оценено №16 — завершить нельзя',
);
await api.setGrade(S, 16, 1, 0, 0, null);
await api.setGrade(S, 20, 3, 1, 0, null);
await api.overridePart1(S, 11, true, 'другая форма ответа');
cw = await api.checkWork(S);
ok(
  cw.score.part1 === 11 && cw.score.part2 === 15,
  `пересчёт: ${cw.score.part1} + ${cw.score.part2}`,
);
ok(
  g(17) === undefined || cw.grades.find((x) => x.taskNo === 17).nePristupal === false,
  '«не приступал» снят оценкой',
);
ok(cw.grades.find((x) => x.taskNo === 11).vruchnuyu, 'ручная правка части 1 помечена');
await api.finishCheck(S, 'Молодец');
as('A');
sw = await api.studentWork(W);
ok(sw.score.total === 26 && sw.score.test === TESTOVYJ[26], `тестовый по шкале: ${sw.score.test}`);
ok(
  sw.grades.filter((x) => x.taskNo >= 14).length === 7,
  'после проверки ученик видит все баллы 14–20',
);
ok(
  (await api.notices()).some((n) => n.kind === 'work_checked'),
  'ученику — «проверено»',
);

console.log('5. Повторное открытие и история');
as('T');
await api.startCheck(S);
await api.setGrade(S, 16, 2, 0, 0, null);
await api.finishCheck(S, null);
cw = await api.checkWork(S);
const h16 = cw.history.filter((h) => h.taskNo === 16);
ok(
  h16.at(-1).oldBall === 1 && h16.at(-1).newBall === 2 && h16.at(-1).by === 'T',
  'история: кто, было → стало',
);
ok(
  cw.history.some((h) => h.reason === 'reopen'),
  'история: повторное открытие',
);
ok(cw.submission.comment === 'Молодец', 'общий комментарий сохранён');
as('A');
ok(
  (await api.notices()).some((n) => n.kind === 'work_regraded'),
  'ученику — «оценка изменена»',
);

console.log('6. Доработка');
as('T');
await api.startCheck(S);
await api.returnTask(S, 15, 'Нет обоснования в пункте б');
as('A');
sw = await api.studentWork(W);
ok(sw.submission.status === 'returned', 'статус «на доработке»');
ok(sw.editable.join() === '15', `меняется только №15: ${sw.editable.join()}`);
await api.uploadPhoto(W, 15, jpeg(), meta);
await throws(() => api.saveAnswer(W, 14, '0', ['x']), 'closed', '№14 не возвращён — не меняется');
await api.submitWork(W);
as('T');
cw = await api.checkWork(S);
ok(!cw.grades.some((x) => x.naDorabotke), 'после пересдачи отметка «на доработке» снята');

console.log('7. Сроки и хранение');
as('T');
now = new Date('2026-10-28T10:00:00Z');
as('B');
await throws(() => api.saveAnswer(W, 1, '', '1'), 'closed', 'после срока ответ не пишется');
as('T');
await api.extendWork(W, '2026-11-02T18:00:00Z', 'B');
as('B');
await api.saveAnswer(W, 1, '', '1');
ok(true, 'продление одному ученику открывает работу');
now = new Date('2027-09-01T00:00:00Z');
as('A');
sw = await api.studentWork(W);
ok(sw.photos.length === 0, 'истёкшие фото удалены');
ok(sw.score.total > 0, 'баллы после удаления фото остались');

if (failures > 0) {
  console.error(`\nРаботы: ошибок ${failures} из ${checks}`);
  process.exit(1);
}
console.log(`Работы: ${checks} проверок — всё сходится`);
