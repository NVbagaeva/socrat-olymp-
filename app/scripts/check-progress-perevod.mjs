#!/usr/bin/env node
/* scripts/check-progress-perevod.mjs — перевод разделов на журнал попыток.

   Запуск: pnpm test:progress-perevod (сборка не нужна).

   Разделы №1, 2, 4, 5, 6, 7, 9, 11, 12, 13, 14, 18 раньше держали
   счётчики (lib/progressStore.ts, lib/trainerProgress.ts), теперь пишут
   в общий журнал (lib/progressLog), а экраны читают прежнюю форму из
   журнала (lib/progressLog/sovmestimost.ts). Здесь проверяется, что:

     • настоящие записи прежнего формата (scripts/fixtures/progress-legacy.json —
       их написал прежний код хранилищ) сворачиваются в журнал без потерь:
       счётчики, ошибки, исходы задач и решённые задачи те же;
     • прежние ключи при переводе не меняются и не удаляются;
     • новые попытки продолжают те же счётчики; сброс не воскрешает старое;
     • исход «с подсказкой» не идёт ни в «верно», ни в ошибки, а открытое
       решение для «Стоит повторить» считается ошибкой;
     • записи журнала, сделанные до появления «с подсказкой», читаются как есть;
     • два устройства сливаются без потерь и двойного счёта;
     • у каждого переведённого раздела есть прежний ключ в LEGACY_LOGS, а
       журнал подключён к синхронизации с аккаунтом. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireSrc } from './lib/load-ts.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = JSON.parse(
  fs.readFileSync(path.join(HERE, 'fixtures', 'progress-legacy.json'), 'utf8'),
);

/* Хранилище браузера понарошку: модулям хватает localStorage и событий. */
const memory = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => (memory.has(key) ? memory.get(key) : null),
    setItem: (key, value) => void memory.set(key, String(value)),
    removeItem: (key) => void memory.delete(key),
  },
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() {
    return true;
  },
};
globalThis.CustomEvent = class {
  constructor(type, init) {
    this.type = type;
    this.detail = init?.detail;
  }
};

const L = requireSrc('lib/progressLog/model.ts');
const S = requireSrc('lib/progressLog/sovmestimost.ts');
const I = requireSrc('lib/progressLog/index.ts');
const R = requireSrc('lib/progressImport/registry.ts');
const M = requireSrc('lib/accountSync/merge.ts');
const P = requireSrc('lib/progressStore.ts');

let checks = 0;
const failures = [];
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const sorted = (list) => [...list].sort();
const sortKeys = (obj) =>
  Object.fromEntries(Object.entries(obj).sort(([a], [b]) => (a < b ? -1 : 1)));

const LOG_OF = Object.fromEntries(Object.entries(I.LEGACY_LOGS).map(([log, old]) => [old, log]));
const SYNCED = R.IMPORT_GROUPS.flatMap((g) => g.keys);

/* ── Список переведённых разделов ───────────────────────────────── */
{
  const perevedeny = [
    'budetege:planimetriya-1:v1',
    'budetege:vektory-2:v1',
    'budetege:veroyatnost-4:v2',
    'budetege:veroyatnost-5:v2',
    'budetege:zadanie-6:v1',
    'budetege:zadanie-7:v1',
    'budetege:proizvodnaya-9:v1',
    'budetege:zadanie-11:v1',
    'budetege:trainer:v1',
    'budetege:zadanie-13:v1',
    'budetege:zadanie-14:v1',
    'budetege:zadanie-18:trenazher:v1',
  ];
  for (const old of perevedeny) {
    check(LOG_OF[old] !== undefined, `${old}: есть журнал в LEGACY_LOGS`);
    check(FIXTURES[old] !== undefined, `${old}: есть пример прежних данных`);
    check(SYNCED.includes(LOG_OF[old]), `${LOG_OF[old]}: журнал синхронизируется с аккаунтом`);
  }
  for (const key of ['budetege:zadanie-10:log:v1', 'budetege:zadanie-19:log:v1']) {
    check(SYNCED.includes(key), `${key}: журнал нового раздела синхронизируется`);
  }
  check(
    Object.keys(I.LEGACY_LOGS).every((key) => key.endsWith(':log:v1')),
    'ключи журналов кончаются на :log:v1 — по этому хвосту их сливает синхронизация',
  );
}

/* ── Прежние данные сворачиваются без потерь ────────────────────── */
for (const [old, value] of Object.entries(FIXTURES)) {
  const log = L.fromLegacy(value, 'ustroystvo-1');
  const view = S.legacyView(L.parseLog(JSON.parse(JSON.stringify(log))));
  check(same(sortKeys(view.kinds), sortKeys(value.kinds)), `${old}: счётчики по типам те же`);
  check(same(sorted(view.mistakes), sorted(value.mistakes)), `${old}: список ошибок тот же`);
  check(
    same(sortKeys(view.outcomes), sortKeys(value.outcomes ?? {})),
    `${old}: исходы задач те же`,
  );
  check(same(sorted(view.solved), sorted(value.solved ?? [])), `${old}: решённые задачи те же`);

  /* Итоги журнала: решено и верно — как в прежних счётчиках. */
  const t = L.totals(log);
  const done = Object.values(value.kinds).reduce((n, k) => n + k.done, 0);
  const right = Object.values(value.kinds).reduce((n, k) => n + k.right, 0);
  check(
    t.done === done && t.right === right,
    `${old}: итог ${t.done}/${t.right}, ждали ${done}/${right}`,
  );
}

/* ── Перенос в браузере: прежние ключи целы, сброс не воскрешает ── */
{
  for (const [old, value] of Object.entries(FIXTURES)) memory.set(old, JSON.stringify(value));
  const before = new Map(memory);
  I.migrateAllLegacyLogs();
  for (const [old, raw] of before) {
    check(memory.get(old) === raw, `${old}: прежний ключ после перевода не изменился`);
    const log = L.parseLog(JSON.parse(memory.get(LOG_OF[old]) ?? 'null'));
    check(!L.isEmptyLog(log), `${LOG_OF[old]}: журнал собран из прежнего ключа`);
  }
  const snapshot = new Map(memory);
  I.migrateAllLegacyLogs();
  check(
    [...snapshot].every(([key, raw]) => memory.get(key) === raw),
    'повторный перевод ничего не меняет',
  );

  /* Хранилище раздела поверх журнала: запись попытки и сброс. */
  const store = P.createProgressStore('budetege:zadanie-7:v1', 'budetege:zadanie-7:log:v1');
  store.recordAttempt({
    kind: 'P7-04',
    taskId: 'P7-04-f09',
    right: true,
    clean: true,
    seconds: 31.4,
  });
  let log = L.parseLog(JSON.parse(memory.get('budetege:zadanie-7:log:v1')));
  let view = S.legacyView(log);
  const bylo = FIXTURES['budetege:zadanie-7:v1'];
  check(
    view.kinds['P7-04'].done === bylo.kinds['P7-04'].done + 1 &&
      view.kinds['P7-04'].right === bylo.kinds['P7-04'].right + 1,
    'новая попытка продолжает прежние счётчики',
  );
  check(!view.mistakes.includes('P7-04-f09'), 'задача, решённая начисто, ушла из ошибок');
  check(log.attempts.length === 1 && log.attempts[0].seconds === 31, 'попытка записана в журнал');
  check(
    memory.get('budetege:zadanie-7:v1') === before.get('budetege:zadanie-7:v1'),
    'запись попытки не трогает прежний ключ',
  );
  store.reset();
  const again = P.createProgressStore('budetege:zadanie-7:v1', 'budetege:zadanie-7:log:v1');
  again.recordAttempt({
    kind: 'P7-01',
    taskId: 'P7-01-f05',
    right: false,
    clean: false,
    seconds: 9,
  });
  view = S.legacyView(L.parseLog(JSON.parse(memory.get('budetege:zadanie-7:log:v1'))));
  check(
    same(Object.keys(view.kinds), ['P7-01']) && view.kinds['P7-01'].done === 1,
    'после сброса прежние счётчики не возвращаются',
  );

  /* Длинные идентификаторы режутся, а не пропадают при чтении. */
  const dlinnye = I.createLogStore('budetege:zadanie-10:log:v1');
  dlinnye.record({ task: 'z'.repeat(300), kind: 'k'.repeat(90), outcome: 'right', seconds: 1 });
  log = L.parseLog(JSON.parse(memory.get('budetege:zadanie-10:log:v1')));
  check(log.attempts.length === 1, 'попытка с длинным идентификатором читается обратно');
}

/* ── Исходы ─────────────────────────────────────────────────────── */
{
  const o = S.outcomeOf;
  check(o({ right: true, clean: true }) === 'right', 'начисто — «верно»');
  check(o({ right: true, clean: false }) === 'hinted', 'решено не начисто — «с подсказкой»');
  check(o({ right: false, clean: false }) === 'wrong', 'не решено — ошибка');
  check(
    o({ right: false, clean: false, itog: 'revealed' }) === 'revealed',
    'открытое решение из itog',
  );
  check(o({ right: true, clean: false, ishod: 'wrong' }) === 'wrong', 'точный исход главнее');

  const i = S.ishodOf;
  check(i({ solved: true }) === 'right', 'верно с первой попытки');
  check(i({ solved: true, hint: true }) === 'hinted', 'верно с подсказкой');
  check(i({ solved: true, misses: 1 }) === 'wrong', 'верно со второй попытки — ошибка');
  check(i({ solved: true, misses: 1, hint: true }) === 'wrong', 'ошибка главнее подсказки');
  check(i({ solved: true, revealed: true }) === 'revealed', 'решение открыто до ответа');
  check(i({ solved: false }) === 'wrong', 'не решено — ошибка');

  let clock = 5_000_000;
  let log = L.EMPTY_LOG;
  const add = (outcome, task = `t${clock}`) => {
    clock += 1000;
    log = L.addAttempt(log, { id: `a${clock}`, task, kind: 'K', outcome, seconds: 10, at: clock });
  };
  for (const outcome of ['right', 'hinted', 'hinted', 'right', 'hinted']) add(outcome);
  let s = L.kindStats(log).get('K');
  check(
    s.done === 5 && s.right === 2 && s.hinted === 3 && s.mistakes === 0,
    `«с подсказкой» — ни в «верно», ни в ошибки: ${JSON.stringify(s)}`,
  );
  check(s.repeat === false, 'подсказки не дают «Стоит повторить»');
  check(L.mistakes(log, () => 'K').length === 0, 'задача с подсказкой не идёт в «Мои ошибки»');
  check(s.lastAt === clock, 'известно, когда тип решался в последний раз');
  add('revealed');
  add('wrong');
  s = L.kindStats(log).get('K');
  check(s.repeat === true && s.mistakes === 2, 'открытое решение и ошибка — «Стоит повторить»');

  /* В прежней форме «с подсказкой» — как раньше: не «верно», задача в списке ошибок. */
  const view = S.legacyView(log);
  check(
    view.kinds.K.done === 7 && view.kinds.K.right === 2,
    'прежние счётчики: верно только чистое',
  );
  check(
    view.mistakes.length === 5,
    'прежний список ошибок: подсказка и ошибка ставят задачу в список',
  );

  /* Журнал до появления «с подсказкой» читается как есть. */
  const staryy = {
    v: 1,
    attempts: [
      { id: 'a1', task: '8.A|s1|base', kind: '8.A', outcome: 'right', seconds: 30, at: 1 },
      { id: 'a2', task: '8.A|s2|base', kind: '8.A', outcome: 'revealed', seconds: 30, at: 2 },
      { id: 'a3', task: '8.A|s3|base', kind: '8.A', outcome: 'wrong', seconds: 30, at: 3 },
    ],
    archive: { 'ustroystvo-x': { '8.A': { done: 7, right: 5, seconds: 210 } } },
    legacyMistakes: ['8.A|old|any'],
  };
  const parsed = L.parseLog(staryy);
  check(same(parsed, staryy), 'журнал без «с подсказкой» после разбора тот же');
  s = L.kindStats(parsed).get('8.A');
  check(
    s.done === 10 && s.right === 6 && s.mistakes === 4 && s.hinted === 0,
    'и считается как раньше',
  );

  /* Свёртка старых попыток помнит подсказки. */
  let big = L.EMPTY_LOG;
  for (let n = 0; n < L.LOG_LIMIT + 4; n += 1) {
    big = L.addAttempt(big, {
      id: `b${n}`,
      task: `t${n}`,
      kind: 'K',
      outcome: n < 4 ? 'hinted' : 'right',
      seconds: 1,
      at: 10 + n,
    });
  }
  s = L.kindStats(L.parseLog(JSON.parse(JSON.stringify(big)))).get('K');
  check(
    s.done === L.LOG_LIMIT + 4 && s.hinted === 4 && s.mistakes === 0,
    `свёрнутые подсказки не стали ошибками: ${s.done}/${s.hinted}/${s.mistakes}`,
  );
}

/* ── Два устройства ─────────────────────────────────────────────── */
{
  const value = FIXTURES['budetege:trainer:v1'];
  const phone = L.fromLegacy(value, 'telefon');
  const laptop = L.addAttempt(
    L.fromLegacy({ kinds: {}, mistakes: [], solved: ['12.B-07'] }, 'noutbuk'),
    { id: 'n1', task: '12.A-01', kind: '12.A', outcome: 'hinted', seconds: 20, at: 100 },
  );
  const merged = M.mergeValue('budetege:zadanie-12:log:v1', phone, laptop, new Set());
  const view = S.legacyView(merged);
  check(
    view.kinds['12.A'].done === value.kinds['12.A'].done + 1,
    'слияние: счётчики телефона плюс попытка ноутбука',
  );
  check(
    view.solved.includes('12.B-07') && value.solved.every((id) => view.solved.includes(id)),
    'слияние: решённые задачи обоих устройств',
  );
  check(
    view.mistakes.includes('12.A-01'),
    'слияние: подсказка на ноутбуке вернула задачу в ошибки',
  );
  const twice = M.mergeValue('budetege:zadanie-12:log:v1', merged, phone, new Set());
  check(same(S.legacyView(twice), view), 'повторное слияние ничего не удваивает');

  /* Сброс одного раздела №12 не трогает другие. */
  const setOf = (id) => id.split('-')[0];
  const left = S.legacyView(S.dropKinds(merged, (kind) => kind.startsWith('12Q.'), setOf));
  check(
    Object.keys(left.kinds).every((kind) => !kind.startsWith('12Q.')) &&
      left.kinds['12.A'].done === view.kinds['12.A'].done,
    'сброс раздела: его счётчики ушли, чужие остались',
  );
  check(
    left.mistakes.every((id) => !id.startsWith('12Q.')) &&
      left.solved.every((id) => !id.startsWith('12Q.')) &&
      left.solved.includes('12.B-07'),
    'сброс раздела: его ошибки и решённые ушли, чужие остались',
  );
}

console.log(
  `Перевод разделов на журнал попыток: ${checks} проверок, не прошло ${failures.length}.`,
);
if (failures.length > 0) {
  for (const f of failures) console.error(`  НЕТ ${f}`);
  process.exit(1);
}
