#!/usr/bin/env node
/* scripts/check-progress.mjs — правило учёта единого журнала прогресса.

   Проверяет lib/progress/core.ts: окно навыка получает одну запись на
   экземпляр задачи (его итог), повторные проверки идут только в журнал,
   пропуск в окно не идёт, статус обратим. Ненулевой код возврата —
   правило разошлось с ожиданием. */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const require0 = createRequire(import.meta.url);

function loadTypeScript() {
  try {
    return require0('typescript');
  } catch {
    return createRequire('/opt/node22/lib/node_modules/typescript/package.json')('typescript');
  }
}

const ts = loadTypeScript();
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'progress-check-'));
for (const name of ['types', 'core']) {
  const src = path.join(root, 'src', 'lib', 'progress', `${name}.ts`);
  fs.writeFileSync(
    path.join(dir, `${name}.js`),
    ts.transpileModule(fs.readFileSync(src, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
  );
}
const { EMPTY, JOURNAL_CAP, applyAttempt, skillKey, statusOf } = require0(path.join(dir, 'core.js'));
fs.rmSync(dir, { recursive: true });

let ts0 = 0;
function attempt(over) {
  ts0 += 1;
  return {
    taskNo: '4',
    subtopicId: '4',
    source: 'prep',
    skillId: 'opredelenie',
    taskId: 'k4-01',
    instanceId: 'i1',
    seed: null,
    verdict: 'correct',
    hintUsed: false,
    firstTry: true,
    seconds: 0,
    ts: ts0,
    ...over,
  };
}
const KEY = skillKey('4', '4', 'prep', 'opredelenie');

function run(list) {
  return list.reduce((data, item) => applyAttempt(data, item), EMPTY);
}
function windowOf(data) {
  return (data.skills[KEY]?.window ?? []).map((entry) => (entry.credit ? 'зачёт' : 'незачёт'));
}

let failed = 0;
function expect(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed += 1;
  console.log(`  ${ok ? 'ок ' : 'НЕТ'}  ${name}: ${JSON.stringify(got)}${ok ? '' : ` — ждали ${JSON.stringify(want)}`}`);
}

/* 1. Три неверных проверки одной задачи, потом верно. */
{
  const data = run([
    attempt({ verdict: 'incorrect', firstTry: true }),
    attempt({ verdict: 'incorrect', firstTry: false }),
    attempt({ verdict: 'incorrect', firstTry: false }),
    attempt({ verdict: 'correct', firstTry: false }),
  ]);
  expect('три неверных и верная — в окне', windowOf(data), ['незачёт']);
  expect('три неверных и верная — в журнале', data.journal.length, 4);
  expect('три неверных и верная — экземпляров', data.skills[KEY].instancesTotal, 1);
}

/* 2. Верно с первой проверки, потом повторная проверка того же экземпляра. */
{
  const data = run([attempt({}), attempt({ verdict: 'incorrect', firstTry: false })]);
  expect('зачёт и повтор того же экземпляра — в окне', windowOf(data), ['зачёт']);
}

/* 3. Разбор открыт до ответа, потом верно. */
{
  const data = run([
    attempt({ verdict: 'incorrect', hintUsed: true }),
    attempt({ verdict: 'correct', hintUsed: true }),
  ]);
  expect('разбор до ответа, потом верно — в окне', windowOf(data), ['незачёт']);
}

/* 4. Пропуск: только журнал, окно не тронуто, экземпляр не израсходован. */
{
  const data = run([attempt({ verdict: 'skipped' })]);
  expect('пропуск — окно', windowOf(data), []);
  expect('пропуск — навык не заведён', data.skills[KEY] === undefined, true);
  expect('пропуск — журнал', data.journal.map((a) => a.verdict), ['skipped']);
  const after = applyAttempt(data, attempt({}));
  expect('пропуск, потом верно тем же экземпляром — окно', windowOf(after), ['зачёт']);
}

/* 5. Освоенность и её обратимость. */
{
  const five = ['c', 'c', 'c', 'x', 'c'].map((mark, i) =>
    attempt({ instanceId: `m${i}`, verdict: mark === 'c' ? 'correct' : 'incorrect' }),
  );
  const mastered = run(five);
  expect('4 зачёта из 5 — статус', statusOf(mastered.skills[KEY]), 'mastered');
  const dropped = applyAttempt(mastered, attempt({ instanceId: 'm5', verdict: 'incorrect' }));
  expect('ещё незачёт (3 из 5) — статус', statusOf(dropped.skills[KEY]), 'in-progress');
  const four = run(five.slice(0, 4));
  expect('четыре экземпляра — окно неполное', statusOf(four.skills[KEY]), 'in-progress');
  expect('ноль попыток — статус', statusOf({ window: [] }), 'none');
}

/* 6. Потолок журнала: старое вытесняется, окно не страдает. */
{
  let data = run([attempt({ instanceId: 'first' })]);
  for (let i = 0; i < JOURNAL_CAP + 5; i += 1) {
    data = applyAttempt(data, attempt({ skillId: 'zhrebiy', instanceId: `j${i}` }));
  }
  expect('журнал не больше потолка', data.journal.length, JOURNAL_CAP);
  expect('окно навыка с вытесненной записью цело', windowOf(data), ['зачёт']);
}

if (failed > 0) {
  console.error(`\nПравило учёта разошлось с ожиданием: ${failed}.`);
  process.exit(1);
}
console.log('\nПравило учёта сходится.');
