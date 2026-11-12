#!/usr/bin/env node
/* scripts/check-progress-7.mjs — тренажёр №7 в «Стеклянной сцене»:
   перенос прежнего прогресса, сборка тренировок, запись сессии.

   Без браузера и без сборки сайта: модули читаются из исходников.

     1. Перенос прогресса. Прежнее хранилище (ключ budetege:zadanie-7:v1,
        lib/progressStore.ts) наполняется НАСТОЯЩИМ прежним кодом — теми
        же вызовами recordAttempt, что делал экран задачи до редизайна:
        верно начисто, верно после ошибки, открыт разбор, верно с
        подсказкой. Затем запись сворачивается в журнал тем же кодом, что
        работает на сайте (migrateLegacyLog). Проверяется:
          — счётчики по прототипам и по группам сошлись с прежними;
          — «Мои ошибки» — те же задачи, у каждой свой прототип (у задач
            ФИПИ он берётся по каталогу, у аналогов — из ключа);
          — прежний ключ остался на месте нетронутым (запасной вариант);
          — повторное чтение ничего не меняет и не дублирует;
          — запись, уже перенесённая, прежними данными не затирается;
          — испорченная и пустая прежние записи не ломают журнал.
        Отдельно — запись, сохранённая в файле-образце
        (scripts/fixtures/progress-7-prezhniy.json): так выглядит
        localStorage ученика, решавшего №7 до редизайна.
     2. Ключи: журнал №7 стоит в списке переноса в аккаунт и в списке
        прежних ключей.
     3. Каталог и тренировка по типам: нужное число задач без повторов,
        только из выбранных типов и источника; нерешённые раньше
        решённых; у типа без задач ФИПИ «Из банка ФИПИ» даёт аналоги.
     4. «Работа над ошибками»: другие задачи тех же прототипов; задач,
        в которых была ошибка, среди них нет; аналог помнит ошибку.
     5. «Похожая задача»: тот же прототип, другая задача.
     6. Запись тренировки: формат читается, чужое отсекается; запись
        прежнего тренажёра ({ zadachi: […] }) открывается.

   Запуск: node scripts/check-progress-7.mjs */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireSrc } from './lib/load-ts.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
}

/* Хранилище браузера для кода, который читает window.localStorage. */
function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => void data.set(key, String(value)),
    removeItem: (key) => void data.delete(key),
    key: (i) => [...data.keys()][i] ?? null,
    get length() {
      return data.size;
    },
    dump: () => Object.fromEntries(data),
  };
}
function podstavitStorage(storage) {
  globalThis.window = {
    localStorage: storage,
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {},
  };
  globalThis.localStorage = storage;
}

const OLD_KEY = 'budetege:zadanie-7:v1';
const NEW_KEY = 'budetege:zadanie-7:log:v1';

const { PROTOTYPES, GROUPS, prototypesOfGroup } = requireSrc('lib/zadanie7/prototypes/index.ts');
const { zadachiPrototipa, BANK } = requireSrc('lib/zadanie7/bank/index.ts');
const S = requireSrc('lib/zadanie7/trening/session.ts');
const M = requireSrc('lib/progressLog/model.ts');

const katalog = Object.fromEntries(
  PROTOTYPES.map((p) => {
    const { fipi, analogi } = zadachiPrototipa(p.id);
    return [p.id, { f: fipi.map((z) => z.id), a: analogi.map((z) => z.id) }];
  }),
);
const poZadache = S.prototipyZadach(katalog);
const gruppaOf = new Map(GROUPS.flatMap((g) => prototypesOfGroup(g.id).map((p) => [p.id, g.id])));

/* ── 1. Перенос прогресса ─────────────────────────────────────── */

/* Что ученик делал в прежнем тренажёре: [задача, верно, начисто, секунд].
   Те же аргументы, что передавал прежний экран (Reshenie7.zapisat). */
const F = (p, n = 0) => katalog[p].f[n];
const A = (p, n = 0) => katalog[p].a[n];
const PREZHNIE = [
  [F('P01'), true, true, 41] /* верно с первого раза */,
  [F('P01', 1), true, true, 37],
  [F('P13'), true, false, 96] /* верно после ошибки */,
  [F('P13', 1), false, false, 120] /* открыл разбор, не решив */,
  [A('P18'), true, false, 75] /* верно с подсказкой */,
  [F('P21'), false, false, 58],
  [A('P26'), true, true, 143],
  [A('P32'), false, false, 201] /* прототип без задач ФИПИ */,
];

{
  const storage = fakeStorage();
  podstavitStorage(storage);
  /* Настоящий прежний код хранилища. */
  const { createProgressStore } = requireSrc('lib/progressStore.ts');
  const prezhnee = createProgressStore(OLD_KEY);
  for (const [taskId, right, clean, seconds] of PREZHNIE) {
    prezhnee.recordAttempt({ kind: poZadache.get(taskId), taskId, right, clean, seconds });
  }
  const snimok = storage.getItem(OLD_KEY);
  check(snimok !== null, 'прежний код не записал хранилище');
  const staroe = JSON.parse(snimok);

  /* Перенос — тем же кодом, что на сайте. */
  const { migrateLegacyLog, LEGACY_LOGS } = requireSrc('lib/progressLog/index.ts');
  check(LEGACY_LOGS[NEW_KEY] === OLD_KEY, 'журнал №7 не связан с прежним ключом');
  migrateLegacyLog(NEW_KEY);
  const log = M.parseLog(JSON.parse(storage.getItem(NEW_KEY) ?? 'null'));

  /* Счётчики по прототипам. */
  const poTipam = M.kindStats(log);
  for (const [kind, tally] of Object.entries(staroe.kinds)) {
    const s = poTipam.get(kind);
    check(
      s !== undefined && s.done === tally.done && s.right === tally.right,
      `перенос: счётчики ${kind} — было ${tally.done}/${tally.right}, стало ${s?.done}/${s?.right}`,
    );
    check(s?.seconds === tally.seconds, `перенос: время ${kind} не сошлось`);
  }
  check(poTipam.size === Object.keys(staroe.kinds).length, 'перенос: появились лишние типы');

  /* Счётчики по группам — то, что видит ученик в «Моём прогрессе». */
  const poGruppam = M.kindStats(log, (kind) => gruppaOf.get(kind) ?? kind);
  const ozhidaem = new Map();
  for (const [kind, tally] of Object.entries(staroe.kinds)) {
    const g = gruppaOf.get(kind);
    const row = ozhidaem.get(g) ?? { done: 0, right: 0 };
    row.done += tally.done;
    row.right += tally.right;
    ozhidaem.set(g, row);
  }
  for (const [g, row] of ozhidaem) {
    const s = poGruppam.get(g);
    check(
      s?.done === row.done && s?.right === row.right,
      `перенос: группа ${g} — ждали ${row.done}/${row.right}, получили ${s?.done}/${s?.right}`,
    );
  }
  const vsego = M.totals(log);
  check(
    vsego.done === PREZHNIE.length,
    `перенос: всего решено ${vsego.done}, а не ${PREZHNIE.length}`,
  );
  check(vsego.right === PREZHNIE.filter((p) => p[1]).length, 'перенос: число верных не сошлось');

  /* «Мои ошибки»: те же задачи, у каждой — свой прототип. */
  const oshibki = M.mistakes(log, (task) => S.prototipZadachi7(task, poZadache));
  const zhdem = PREZHNIE.filter((p) => !p[2]).map((p) => p[0]);
  check(
    oshibki.length === zhdem.length && zhdem.every((id) => oshibki.some((m) => m.task === id)),
    `перенос: ошибки ${oshibki.map((m) => m.task).join(',')}, а ждали ${zhdem.join(',')}`,
  );
  for (const m of oshibki) {
    check(/^P\d\d$/.test(m.kind), `перенос: у ошибки ${m.task} нет прототипа (${m.kind})`);
    check(m.kind === poZadache.get(m.task), `перенос: у ошибки ${m.task} чужой прототип`);
  }
  /* «Работа над ошибками» собирается из перенесённых ошибок. */
  const rabota = S.buildMistakes7(katalog, oshibki, 10);
  check(rabota.length > 0, 'перенос: «Работа над ошибками» из прежних ошибок не собралась');
  check(
    rabota.every((t) => zhdem.includes(t.fixes) && !zhdem.includes(t.id)),
    'перенос: в «Работе над ошибками» задача с ошибкой или чужой аналог',
  );

  /* Прежний ключ на месте и не изменён. */
  check(storage.getItem(OLD_KEY) === snimok, 'перенос: прежний ключ изменён или удалён');

  /* Повторное чтение: ничего не меняется и не дублируется. */
  const posle = storage.getItem(NEW_KEY);
  migrateLegacyLog(NEW_KEY);
  check(storage.getItem(NEW_KEY) === posle, 'перенос: повторный запуск изменил журнал');

  /* Новые попытки ложатся поверх перенесённого. */
  const dalshe = M.addAttempt(log, {
    id: 'proverka',
    at: 1,
    task: F('P01', 2),
    kind: 'P01',
    outcome: 'right',
    seconds: 30,
    session: 's',
  });
  check(
    M.kindStats(dalshe).get('P01')?.done === staroe.kinds.P01.done + 1,
    'перенос: новая попытка не прибавилась к прежним',
  );

  /* Уже перенесённый журнал прежними данными не затирается. */
  storage.setItem(
    OLD_KEY,
    JSON.stringify({ kinds: { P02: { done: 9, right: 9, seconds: 9 } }, mistakes: [] }),
  );
  migrateLegacyLog(NEW_KEY);
  check(storage.getItem(NEW_KEY) === posle, 'перенос: журнал затёрт прежним ключом');
}

/* Испорченная и пустая прежние записи. */
for (const [chto, raw] of [
  ['испорченная', '{не json'],
  ['пустая', JSON.stringify({ kinds: {}, mistakes: [], outcomes: {} })],
  ['чужой формат', JSON.stringify([1, 2, 3])],
]) {
  const storage = fakeStorage({ [OLD_KEY]: raw });
  podstavitStorage(storage);
  const { migrateLegacyLog } = requireSrc('lib/progressLog/index.ts');
  let upalo = false;
  try {
    migrateLegacyLog(NEW_KEY);
  } catch {
    upalo = true;
  }
  check(!upalo, `перенос: ${chto} прежняя запись роняет перенос`);
  check(storage.getItem(NEW_KEY) === null, `перенос: ${chto} прежняя запись создала журнал`);
  check(storage.getItem(OLD_KEY) === raw, `перенос: ${chto} прежняя запись изменена`);
}

/* Файл-образец: localStorage ученика, решавшего №7 до редизайна. */
{
  const obrazec = JSON.parse(
    fs.readFileSync(path.join(HERE, 'fixtures', 'progress-7-prezhniy.json'), 'utf8'),
  );
  const storage = fakeStorage({ [OLD_KEY]: JSON.stringify(obrazec[OLD_KEY]) });
  podstavitStorage(storage);
  const { migrateLegacyLog } = requireSrc('lib/progressLog/index.ts');
  migrateLegacyLog(NEW_KEY);
  const log = M.parseLog(JSON.parse(storage.getItem(NEW_KEY) ?? 'null'));
  const stats = M.kindStats(log);
  for (const [kind, tally] of Object.entries(obrazec[OLD_KEY].kinds)) {
    check(
      stats.get(kind)?.done === tally.done && stats.get(kind)?.right === tally.right,
      `образец: счётчики ${kind} не сошлись`,
    );
    check(gruppaOf.has(kind), `образец: прототипа ${kind} нет в банке`);
  }
  const oshibki = M.mistakes(log, (task) => S.prototipZadachi7(task, poZadache));
  check(
    oshibki.length === obrazec[OLD_KEY].mistakes.length,
    `образец: ошибок ${oshibki.length}, а в прежней записи ${obrazec[OLD_KEY].mistakes.length}`,
  );
  for (const m of oshibki) {
    check(poZadache.has(m.task), `образец: задачи ${m.task} нет в банке`);
    check(m.kind === poZadache.get(m.task), `образец: у ошибки ${m.task} чужой прототип`);
  }
}

/* ── 2. Ключи ─────────────────────────────────────────────────── */
{
  const { IMPORT_GROUPS, IMPORT_KEY_PATTERN } = requireSrc('lib/progressImport/registry.ts');
  const z7 = IMPORT_GROUPS.find((g) => g.id === 'z7');
  check(z7 !== undefined, 'в списке переноса в аккаунт нет №7');
  check(z7?.keys.includes(NEW_KEY) === true, 'журнал №7 не переносится в аккаунт');
  check(z7?.keys.includes('budetege:trainer:7:session') === true, 'сессия №7 не переносится');
  check(z7?.keys.includes(OLD_KEY) !== true, 'прежний ключ №7 не должен уходить в аккаунт');
  check(
    (z7?.keys ?? []).every((key) => IMPORT_KEY_PATTERN.test(key)),
    'ключ №7 не проходит правило базы',
  );
}

/* ── 3. Каталог и тренировка по типам ─────────────────────────── */
check(Object.keys(katalog).length === PROTOTYPES.length, 'в каталоге не все прототипы');
check(poZadache.size === BANK.length, `в каталоге ${poZadache.size} задач, в банке ${BANK.length}`);
for (const z of BANK) {
  check(S.etoKlyuch7(z.id), `ключ ${z.id} не читается`);
  check(poZadache.get(z.id) === z.prototypeId, `задача ${z.id}: чужой прототип в каталоге`);
}

let seed = 7;
const rnd = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};
const vse = PROTOTYPES.map((p) => p.id);
{
  const t = S.buildByTipy7(katalog, vse, 10, new Set(), 'vse', rnd);
  check(t.length === 10, `вперемешку: ${t.length} задач, а не 10`);
  check(new Set(t.map((x) => x.id)).size === t.length, 'вперемешку: повтор задачи');
  check(
    new Set(t.map((x) => x.p)).size === 10,
    'вперемешку: тип повторился раньше, чем кончились типы',
  );
  check(
    t.every((x) => poZadache.get(x.id) === x.p),
    'вперемешку: у задачи чужой прототип',
  );
}
{
  const tipy = ['P11', 'P13'];
  const t = S.buildByTipy7(katalog, tipy, 20, new Set(), 'fipi', rnd);
  check(
    t.every((x) => tipy.includes(x.p)),
    'по типам: задача чужого типа',
  );
  check(
    t.every((x) => x.id.startsWith('F')),
    'по типам, ФИПИ: попал аналог',
  );
  check(
    t.length === Math.min(20, katalog.P11.f.length + katalog.P13.f.length),
    'по типам, ФИПИ: не то число задач',
  );
  const n = S.buildByTipy7(katalog, tipy, 20, new Set(), 'new', rnd);
  check(
    n.every((x) => !x.id.startsWith('F')),
    'по типам, не из банка: попала задача ФИПИ',
  );
}
{
  /* У П-32 задач ФИПИ нет: «Из банка ФИПИ» даёт аналоги, а не пустоту. */
  check(katalog.P32.f.length === 0, 'у П-32 появились задачи ФИПИ — обновить проверку');
  const t = S.buildByTipy7(katalog, ['P32'], 5, new Set(), 'fipi', rnd);
  check(t.length === 5, 'тип без задач ФИПИ: тренировка «Из банка ФИПИ» пуста');
  check(S.skolkoZadach7(katalog, ['P32'], 'fipi') === katalog.P32.a.length, 'тип без ФИПИ: счёт');
}
{
  /* Нерешённые раньше решённых. */
  const closed = new Set(katalog.P11.f.slice(0, 5));
  const t = S.buildByTipy7(katalog, ['P11'], 6, closed, 'fipi', rnd);
  check(
    t.every((x) => !closed.has(x.id)),
    'по типам: решённая задача пришла раньше нерешённых',
  );
}
{
  const bezKonca = S.buildByTipy7(katalog, vse, 40, new Set(), 'vse', rnd);
  check(bezKonca.length === 40, `«Без конца»: ${bezKonca.length} задач, а не 40`);
  check(new Set(bezKonca.map((x) => x.id)).size === 40, '«Без конца»: повтор задачи');
}

/* ── 4. «Работа над ошибками» ─────────────────────────────────── */
{
  const mistakes = [
    { task: katalog.P13.f[0], kind: 'P13', at: 2, streak: 0 },
    { task: katalog.P21.a[3], kind: 'P21', at: 1, streak: 0 },
  ];
  const t = S.buildMistakes7(katalog, mistakes, 10, rnd);
  check(t.length === 4, `работа над ошибками: ${t.length} задач, а не 4 (по два аналога)`);
  check(
    t.every((x) => mistakes.some((m) => m.task === x.fixes && m.kind === x.p)),
    'работа над ошибками: аналог не помнит свою ошибку',
  );
  check(
    t.every((x) => !mistakes.some((m) => m.task === x.id)),
    'работа над ошибками: выдана та же задача',
  );
  check(new Set(t.map((x) => x.id)).size === t.length, 'работа над ошибками: повтор');
}

/* ── 5. «Похожая задача» ──────────────────────────────────────── */
{
  const id = katalog.P18.f[0];
  const a = S.analogOf7(katalog, 'P18', id, new Set(), rnd);
  check(a !== null && a !== id && poZadache.get(a) === 'P18', 'похожая задача: не тот прототип');
  const zanyato = new Set([...katalog.P18.f, ...katalog.P18.a]);
  check(S.analogOf7(katalog, 'P18', id, zanyato, rnd) === null, 'похожая задача: когда задач нет');
}

/* ── 6. Запись тренировки ─────────────────────────────────────── */
{
  const payload = {
    tasks: [
      { id: 'F001', p: 'P01' },
      { id: 'P18-a03', p: 'P18', fixes: 'F100' },
    ],
    control: false,
    timer: true,
  };
  check(S.isTrenazher7Payload(payload), 'запись тренировки не читается');
  check(S.razobratZapis7(payload) === payload, 'запись нового формата изменена при чтении');
  check(!S.isTrenazher7Payload({ tasks: [], control: false }), 'пустая тренировка принята');
  check(
    !S.isTrenazher7Payload({ tasks: [{ id: 'X1', p: 'P01' }], control: false }),
    'чужой ключ принят',
  );
  check(
    !S.isTrenazher7Payload({ tasks: [{ id: 'F001' }], control: false }),
    'задача без прототипа принята',
  );
  check(S.razobratZapis7(null) === null && S.razobratZapis7({}) === null, 'мусор принят за запись');

  /* Запись прежнего тренажёра: так её писал экран до редизайна. */
  const z = BANK.find((b) => b.id === 'F112');
  const prezhnyaya = {
    zadachi: [
      {
        id: z.id,
        prototypeId: z.prototypeId,
        source: 'fipi',
        no: z.no,
        text: z.text,
        params: z.params,
        seal: 'x',
      },
      { id: 'P18-a03', prototypeId: 'P18', source: 'analog', text: '…', params: {}, seal: 'y' },
    ],
  };
  const novaya = S.razobratZapis7(prezhnyaya);
  check(novaya !== null, 'запись прежнего тренажёра не открылась');
  check(
    novaya?.tasks.length === 2 && novaya.tasks[0].id === 'F112' && novaya.tasks[0].p === 'P13',
    'запись прежнего тренажёра: задачи не те',
  );
  check(novaya?.control === false && novaya?.timer === true, 'прежняя запись: подсказки и часы');
  check(S.isTrenazher7Payload(novaya), 'прежняя запись после чтения не проходит проверку формата');
  check(
    S.razobratZapis7({ zadachi: [{ id: 'мусор', prototypeId: 'P01' }] }) === null,
    'прежняя запись с чужим ключом принята',
  );
}

if (failures.length > 0) {
  console.error(`\nТренажёр №7: ${failures.length} из ${checks} проверок не прошли:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`Тренажёр №7: ${checks} проверок — перенос прогресса, тренировки, запись сессии.`);
