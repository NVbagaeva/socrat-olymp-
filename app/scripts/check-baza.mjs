#!/usr/bin/env node
/* scripts/check-baza.mjs — раздел «Базовая математика».

   Запуск: pnpm test:baza (сборка не нужна).

   1. Уровень экзамена (lib/level.ts): уровень по адресу, пара страницы
      на другом уровне, ключи хранилища — у профиля прежние, у базы свои.
   2. Список заданий базы: ровно 21, номера 01–21 по порядку, адреса
      /baza/zadaniya/N/, у каждого есть паспорт (content/baza/razdely.ts).
   3. Пары «это же задание» профиль ↔ база ведут на существующие номера.
   4. Раздел тренажёра по адресу: у базы свой («baza-5»), не «5».

   Ненулевой код возврата — расхождение, оно печатается. */

import { requireSrc } from './lib/load-ts.mjs';

const { levelOfPath, levelTwin, levelKey, levelInfo } = requireSrc('lib/level.ts');
const { tasks, tasksOf, taskHref, shortTasksOf } = requireSrc('content/tasks.ts');
const { PARY_PROFIL_BAZA } = requireSrc('content/baza/tasks.ts');
const { PASPORTA, VKLADKI_BAZY } = requireSrc('content/baza/razdely.ts');
const { scopeOfPath } = requireSrc('lib/trainerSession/scope.ts');

let checks = 0;
const failures = [];
function eq(got, want, what) {
  checks += 1;
  if (JSON.stringify(got) !== JSON.stringify(want)) {
    failures.push(`${what}: получено ${JSON.stringify(got)}, нужно ${JSON.stringify(want)}`);
  }
}

/* 1. Уровень по адресу. */
for (const [path, level] of [
  ['/', 'profile'],
  ['/zadaniya/', 'profile'],
  ['/zadaniya/4/trenazher/', 'profile'],
  ['/variant/', 'profile'],
  ['/variant/onlayn/', 'profile'],
  ['/povyshennye/', 'profile'],
  ['/baza/', 'base'],
  ['/baza', 'base'],
  ['/baza/zadaniya/', 'base'],
  ['/baza/zadaniya/5/teoriya/', 'base'],
  ['/baza/variant/', 'base'],
  ['/about/', null],
  ['/tarify/', null],
  ['/statistika/', null],
  ['/bazar/', null],
]) {
  eq(levelOfPath(path), level, `уровень адреса ${path}`);
}
for (const [path, to, twin] of [
  ['/', 'base', '/baza/'],
  ['/baza/', 'profile', '/'],
  ['/zadaniya/', 'base', '/baza/zadaniya/'],
  ['/zadaniya/4/teoriya/', 'base', '/baza/zadaniya/'],
  ['/baza/zadaniya/5/', 'profile', '/zadaniya/'],
  ['/variant/', 'base', '/baza/variant/'],
  ['/baza/variant/', 'profile', '/variant/'],
  ['/about/', 'base', '/baza/'],
  ['/about/', 'profile', '/'],
]) {
  eq(levelTwin(path, to), twin, `переключатель с ${path} на ${to}`);
}
eq(levelKey('profile', 'kartochki:5:v1'), 'kartochki:5:v1', 'ключ профиля не меняется');
eq(levelKey('base', 'kartochki:5:v1'), 'baza:kartochki:5:v1', 'ключ базы — со своим префиксом');

/* 2. Список заданий базы. */
const baza = tasksOf('base');
eq(baza.length, 21, 'в базе 21 задание');
eq(shortTasksOf('base').length, levelInfo('base').count, 'все задания базы — с кратким ответом');
baza.forEach((task, i) => {
  const n = i + 1;
  eq(task.no, String(n).padStart(2, '0'), `номер задания ${n}`);
  eq(taskHref(task), `/baza/zadaniya/${n}/`, `адрес задания базы ${n}`);
  eq(task.level, 'base', `уровень задания базы ${n}`);
  eq(typeof PASPORTA[task.slug]?.lead, 'string', `паспорт задания базы ${n}`);
});
eq(tasksOf('profile'), tasks, 'список профиля — прежний');
eq(
  tasks.map((t) => taskHref(t)),
  tasks.map((t) => `/zadaniya/${t.slug}/`),
  'адреса заданий профиля не изменились',
);
eq(VKLADKI_BAZY.map((t) => t.id).length, 6, 'у задания базы шесть вкладок');

/* 3. Пары профиль ↔ база. */
for (const [profil, bazaNo] of Object.entries(PARY_PROFIL_BAZA)) {
  eq(
    tasks.some((t) => t.slug === profil && t.part === 1),
    true,
    `пара: профиль №${profil} есть`,
  );
  eq(
    baza.some((t) => t.slug === bazaNo),
    true,
    `пара: база №${bazaNo} есть`,
  );
}
eq(
  new Set(Object.values(PARY_PROFIL_BAZA)).size,
  Object.keys(PARY_PROFIL_BAZA).length,
  'пары без повторов',
);

/* 4. Раздел тренажёра. */
eq(scopeOfPath('/zadaniya/5/trenazher/'), '5', 'раздел тренажёра профиля');
eq(scopeOfPath('/baza/zadaniya/5/trenazher/'), 'baza-5', 'раздел тренажёра базы');
eq(scopeOfPath('/zadaniya/12/linear/trenazher/'), '12:linear', 'раздел подтемы профиля');

if (failures.length > 0) {
  console.error(`База: расхождений ${failures.length} из ${checks}`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`База: проверок ${checks}, расхождений нет.`);
