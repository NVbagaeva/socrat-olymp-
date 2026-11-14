#!/usr/bin/env node
/* scripts/check-progress-11.mjs — тренажёр №11 в «Стеклянной сцене»:
   перенос прежнего прогресса, файлы задач, сборка тренировок, запись
   сессии.

   Без браузера и без сборки сайта: модули читаются из исходников.
   Логика тренировки общая с №7 и №6 (lib/trening/bank.ts); здесь — то,
   что у №11 своё: ключи задач («DP-07|b12», «|r1001», «|a2001»), подтипы
   вида «DP-07», задачи прежнего генератора («DP-07|n…») и записи
   прежнего тренажёра №11 (панель фильтров).

     1. Перенос прогресса. Прежнее хранилище (ключ budetege:zadanie-11:v1)
        наполняется НАСТОЯЩИМ прежним кодом lib/progressStore.ts — теми же
        вызовами recordAttempt, что делала карточка задачи прежнего
        тренажёра (kind — подтип, taskId — ключ задачи). Затем запись
        сворачивается в журнал тем же кодом, что на сайте
        (migrateLegacyLog): счётчики по подтипам и группам, «Мои ошибки»
        (и у задачи генератора, которой нет в банке), прежний ключ на
        месте, повторный перенос ничего не меняет. Отдельно — журнал,
        который писал тренажёр после PR #340 (тот же ключ), и
        файл-образец scripts/fixtures/progress-11-prezhniy.json.
     2. Ключи: журнал и сессия №11 в списке переноса в аккаунт.
     3. Файлы задач public/data/zadanie11: свежие, без ответов, все
        задачи банка, разминки и аналогов; отпечаток ответа сходится.
     4. Тренировка по типам и источнику, «Работа над ошибками».
     5. Запись тренировки: новый формат, прежний формат тренажёра №11
        ({ v: 1, rezhim, items }) и самый ранний ({ zadachi, podskazki }).
     6. Тексты карты: «Где теряют балл» у каждого из 68 типов.

   Запуск: node scripts/check-progress-11.mjs */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP, requireSrc } from './lib/load-ts.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
}

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

const OLD_KEY = 'budetege:zadanie-11:v1';
const NEW_KEY = 'budetege:zadanie-11:log:v1';

const { SUBTYPES } = requireSrc('lib/zadanie11/prototypes/index.ts');
const { SECTIONS } = requireSrc('lib/zadanie11/taxonomy.ts');
const D = requireSrc('lib/zadanie11/trening/dannye-server.ts');
const { KLYUCH11 } = requireSrc('lib/zadanie11/trening/dannye.ts');
const S = requireSrc('lib/zadanie11/trening/session.ts');
const B = requireSrc('lib/trening/bank.ts');
const M = requireSrc('lib/progressLog/model.ts');
const { answerMatches, choiceMatches } = requireSrc('lib/zadanie11/secret.ts');
const { dannyeTrenazhera } = requireSrc('lib/zadanie11/trenazher/dannye.ts');
const { klyuchZadachi } = requireSrc('lib/zadanie11/trenazher/sessiya.ts');

/* Каталог — как на сервере (Trenazher11Tab). */
const katalog = D.katalog11();
const poZadache = B.prototipyZadach(katalog);
const prototipOf = (task) => B.prototipZadachi(task, poZadache);
const gruppaOf = new Map(SUBTYPES.map((st) => [st.id, st.section]));

/* ── 1. Перенос прогресса ─────────────────────────────────────── */

const F = (p, n = 0) => katalog[p].f[n];
const A = (p, n = 0) => katalog[p].a[n];
/* [задача, верно, начисто, секунд] — как писала прежняя карточка №11. */
const PREZHNIE = [
  [F('DP-07'), true, true, 140],
  [A('DP-07', 2), true, false, 260] /* верно после ошибки */,
  [F('SM-06'), false, false, 300],
  [F('RZ-17'), true, true, 30] /* разминка, ответ выбором */,
  ['RB-04|nq7x2k', false, false, 180] /* задача прежнего генератора */,
  [A('VD-02', 5), true, true, 410],
];

{
  const storage = fakeStorage();
  podstavitStorage(storage);
  const { createProgressStore } = requireSrc('lib/progressStore.ts');
  const prezhnee = createProgressStore(OLD_KEY);
  for (const [taskId, right, clean, seconds] of PREZHNIE) {
    prezhnee.recordAttempt({
      kind: taskId.split('|')[0],
      taskId,
      right,
      clean,
      seconds,
      itog: right ? 'right' : 'wrong',
    });
  }
  const snimok = storage.getItem(OLD_KEY);
  check(snimok !== null, 'прежний код не записал хранилище');
  const staroe = JSON.parse(snimok);

  const { migrateLegacyLog, LEGACY_LOGS } = requireSrc('lib/progressLog/index.ts');
  check(LEGACY_LOGS[NEW_KEY] === OLD_KEY, 'журнал №11 не связан с прежним ключом');
  const { PROGRESS11_KEY } = requireSrc('lib/zadanie11/trening/progress.ts');
  check(PROGRESS11_KEY === NEW_KEY, 'новый тренажёр №11 пишет не в тот журнал');
  migrateLegacyLog(NEW_KEY);
  const log = M.parseLog(JSON.parse(storage.getItem(NEW_KEY) ?? 'null'));

  const poTipam = M.kindStats(log);
  for (const [kind, tally] of Object.entries(staroe.kinds)) {
    const s = poTipam.get(kind);
    check(
      s !== undefined && s.done === tally.done && s.right === tally.right,
      `перенос: счётчики ${kind} — было ${tally.done}/${tally.right}, стало ${s?.done}/${s?.right}`,
    );
  }
  const poGruppam = M.kindStats(log, (kind) => gruppaOf.get(kind) ?? kind);
  for (const g of new Set(PREZHNIE.map((p) => gruppaOf.get(p[0].split('|')[0])))) {
    const zhdem = PREZHNIE.filter((p) => gruppaOf.get(p[0].split('|')[0]) === g);
    const s = poGruppam.get(g);
    check(
      s?.done === zhdem.length && s?.right === zhdem.filter((p) => p[1]).length,
      `перенос: группа ${g} — получили ${s?.done}/${s?.right}`,
    );
  }

  const oshibki = M.mistakes(log, prototipOf);
  const zhdem = PREZHNIE.filter((p) => !p[2]).map((p) => p[0]);
  check(
    oshibki.length === zhdem.length && zhdem.every((id) => oshibki.some((m) => m.task === id)),
    `перенос: ошибки ${oshibki.map((m) => m.task).join(',')}, а ждали ${zhdem.join(',')}`,
  );
  for (const m of oshibki) {
    check(m.kind === m.task.split('|')[0], `перенос: у ошибки ${m.task} чужой подтип ${m.kind}`);
  }
  const rabota = B.buildMistakes(katalog, oshibki, 10);
  check(rabota.length > 0, 'перенос: «Работа над ошибками» из прежних ошибок не собралась');
  check(
    rabota.every((t) => zhdem.includes(t.fixes) && !zhdem.includes(t.id) && KLYUCH11.test(t.id)),
    'перенос: в «Работе над ошибками» задача с ошибкой, чужой аналог или не задача банка',
  );
  check(
    rabota.some((t) => t.fixes === 'RB-04|nq7x2k' && t.p === 'RB-04'),
    'перенос: ошибка в задаче прежнего генератора не попала в «Работу над ошибками»',
  );

  check(storage.getItem(OLD_KEY) === snimok, 'перенос: прежний ключ изменён или удалён');
  const posle = storage.getItem(NEW_KEY);
  migrateLegacyLog(NEW_KEY);
  check(storage.getItem(NEW_KEY) === posle, 'перенос: повторный запуск изменил журнал');
}

/* Журнал, который писал тренажёр №11 после PR #340 (тот же ключ):
   новый тренажёр продолжает его, ничего не переносится. */
{
  const storage = fakeStorage();
  podstavitStorage(storage);
  const { createProgressStore } = requireSrc('lib/progressStore.ts');
  const posle340 = createProgressStore(OLD_KEY, NEW_KEY);
  posle340.recordAttempt({
    kind: 'PR-02',
    taskId: F('PR-02'),
    right: true,
    clean: true,
    seconds: 50,
    ishod: 'right',
    itog: 'right',
  });
  posle340.recordAttempt({
    kind: 'SM-01',
    taskId: A('SM-01', 3),
    right: false,
    clean: false,
    seconds: 70,
    ishod: 'wrong',
    itog: 'wrong',
  });
  const log = M.parseLog(JSON.parse(storage.getItem(NEW_KEY) ?? 'null'));
  check(M.kindStats(log).get('PR-02')?.right === 1, 'журнал после PR #340: верная задача потеряна');
  const oshibki = M.mistakes(log, prototipOf);
  check(
    oshibki.length === 1 && oshibki[0].task === A('SM-01', 3) && oshibki[0].kind === 'SM-01',
    'журнал после PR #340: ошибка не читается',
  );
}

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

/* Файл-образец: localStorage ученика, решавшего №11 до редизайна. */
{
  const obrazec = JSON.parse(
    fs.readFileSync(path.join(HERE, 'fixtures', 'progress-11-prezhniy.json'), 'utf8'),
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
    check(gruppaOf.has(kind), `образец: подтипа ${kind} нет`);
  }
  const oshibki = M.mistakes(log, prototipOf);
  check(
    oshibki.length === obrazec[OLD_KEY].mistakes.length,
    `образец: ошибок ${oshibki.length}, а в прежней записи ${obrazec[OLD_KEY].mistakes.length}`,
  );
  for (const m of oshibki) {
    check(poZadache.has(m.task) || /\|n/.test(m.task), `образец: задачи ${m.task} нет в банке`);
    check(m.kind === m.task.split('|')[0], `образец: у ошибки ${m.task} чужой подтип`);
  }
  for (const [id, itog] of Object.entries(obrazec[OLD_KEY].outcomes)) {
    if (itog === 'right' && !/\|n/.test(id)) {
      check(poZadache.has(id), `образец: решённой задачи ${id} нет в каталоге`);
    }
  }
  /* Опорные задачи: хранилище и ключи прежние. */
  const op = obrazec['budetege:zadanie-11:opornye:v1'];
  const { BLOKI } = requireSrc('lib/zadanie11/prep/bloki.ts');
  for (const id of Object.keys(op.outcomes)) {
    const [blok, no] = id.split(':');
    const b = BLOKI.find((x) => x.id === blok);
    check(
      b !== undefined && Number(no) >= 1 && Number(no) <= b.zadachi.length,
      `образец: опорная задача ${id} не находится в блоках`,
    );
  }
}

/* ── 2. Ключи ─────────────────────────────────────────────────── */
{
  const { IMPORT_GROUPS, IMPORT_KEY_PATTERN } = requireSrc('lib/progressImport/registry.ts');
  const z11 = IMPORT_GROUPS.find((g) => g.id === 'z11');
  check(z11 !== undefined, 'в списке переноса в аккаунт нет №11');
  check(z11?.keys.includes(NEW_KEY) === true, 'журнал №11 не переносится в аккаунт');
  check(z11?.keys.includes('budetege:trainer:11:session') === true, 'сессия №11 не переносится');
  check(z11?.keys.includes(OLD_KEY) !== true, 'прежний ключ №11 не должен уходить в аккаунт');
  check(
    (z11?.keys ?? []).every((key) => IMPORT_KEY_PATTERN.test(key)),
    'ключ №11 не проходит правило базы',
  );
}

/* ── 3. Файлы задач ───────────────────────────────────────────── */
{
  const bank = dannyeTrenazhera().bank;
  const fayly = D.dannyeDlyaBrauzera11();
  check(Object.keys(fayly).length === SUBTYPES.length, 'файлов задач не столько, сколько подтипов');
  let vsego = 0;
  for (const st of SUBTYPES) {
    const file = path.join(APP, 'public/data/zadanie11', `${st.id}.json`);
    const est = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    check(est === fayly[st.id], `public/data/zadanie11/${st.id}.json устарел (pnpm build:bank-11)`);
    const zadachi = JSON.parse(fayly[st.id] ?? '[]');
    vsego += zadachi.length;
    check(zadachi.length >= 10, `у подтипа ${st.id} меньше 10 задач`);
    for (const z of zadachi) {
      check(KLYUCH11.test(z.id), `ключ ${z.id} не читается`);
      check(z.prototypeId === st.id, `задача ${z.id} в чужом файле`);
      check(!('answer' in z) && !('otvet' in z), `в файле задачи ${z.id} лежит ответ`);
      check(poZadache.get(z.id) === st.id, `задачи ${z.id} нет в каталоге`);
    }
  }
  check(vsego === bank.length, `в файлах ${vsego} задач, в банке тренажёра ${bank.length}`);
  check(vsego === 912, `задач ${vsego}, а не 912 (212 ФИПИ + 20 разминка + 680 аналогов)`);
  /* Ключи — те же, что у прежнего тренажёра, и отпечаток сходится с ответом движка. */
  const { subtype } = requireSrc('lib/zadanie11/prototypes/index.ts');
  const lite = new Map(
    Object.values(fayly)
      .flatMap((t) => JSON.parse(t))
      .map((z) => [z.id, z]),
  );
  for (const b of bank) {
    const plan = {
      vid: b.analog !== undefined ? 'analog' : b.razminka ? 'razminka' : 'bank',
      no: b.no,
      id: b.id,
    };
    const z = lite.get(klyuchZadachi(plan));
    check(z !== undefined, `задачи ${klyuchZadachi(plan)} прежнего тренажёра нет в файлах`);
    if (z === undefined) continue;
    const s = subtype(b.id).solve(b.params);
    check(
      s.vybor === undefined
        ? answerMatches(String(s.answer), z.seal)
        : choiceMatches(String(s.vybor.correct + 1), z.seal),
      `отпечаток ответа задачи ${z.id} не сходится`,
    );
    check(z.text === (b.analog?.tekst ?? s.uslovie), `условие задачи ${z.id} не то`);
  }
  check(
    lite.get(F('RZ-17'))?.vybory?.length === 3,
    'у задачи с выбором (РЗ-17) нет вариантов ответа',
  );
}

/* ── 4. Тренировка ────────────────────────────────────────────── */
let seed = 11;
const rnd = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};
const vse = SUBTYPES.map((st) => st.id);
{
  const t = B.buildByTipy(katalog, vse, 10, new Set(), 'vse', rnd);
  check(t.length === 10, `вперемешку: ${t.length} задач, а не 10`);
  check(new Set(t.map((x) => x.p)).size === 10, 'вперемешку: тип повторился раньше времени');
  check(
    t.every((x) => poZadache.get(x.id) === x.p),
    'вперемешку: у задачи чужой подтип',
  );
  const fipi = B.buildByTipy(katalog, ['DP-07', 'SM-06'], 30, new Set(), 'fipi', rnd);
  check(
    fipi.every((x) => /\|b\d+$/.test(x.id)),
    'из банка: попал аналог',
  );
  const nov = B.buildByTipy(katalog, ['DP-07'], 30, new Set(), 'new', rnd);
  check(
    nov.length === katalog['DP-07'].a.length && nov.every((x) => /\|a\d+$/.test(x.id)),
    'аналоги: попала задача банка',
  );
  const razm = B.buildByTipy(katalog, ['RZ-04'], 30, new Set(), 'fipi', rnd);
  check(
    razm.length > 0 && razm.every((x) => /\|r\d+$/.test(x.id)),
    'разминка «из банка»: не задачи разминки',
  );
  check(
    SECTIONS.every((s) => SUBTYPES.some((st) => st.section === s.id)),
    'у раздела нет подтипов',
  );
}

/* ── 5. Запись тренировки ─────────────────────────────────────── */
{
  const payload = {
    tasks: [
      { id: F('DP-07'), p: 'DP-07' },
      { id: A('SM-06', 1), p: 'SM-06', fixes: F('SM-06') },
    ],
    control: true,
    timer: false,
  };
  check(S.isTrenazher11Payload(payload), 'запись тренировки не читается');
  check(S.razobratZapis11(payload, katalog) === payload, 'запись нового формата изменена');
  check(
    !S.isTrenazher11Payload({ tasks: [{ id: 'F001', p: 'P01' }], control: false }),
    'ключ №7 принят в №11',
  );
  check(
    S.razobratZapis11(null, katalog) === null && S.razobratZapis11({}, katalog) === null,
    'мусор принят',
  );

  /* Прежний тренажёр №11 (панель фильтров): { v: 1, filtr, rezhim, seed, items: [{ k }] }. */
  for (const [rezhim, control] of [
    ['podskazki', false],
    ['bez', true],
    ['vremya', false],
  ]) {
    const prezhnyaya = {
      v: 1,
      filtr: 'tipy=DP-07',
      rezhim,
      seed: 'abc',
      items: [{ k: F('DP-07') }, { k: 'DP-07|n', seed: 'perenos:1' }, { k: A('RZ-17', 1) }],
    };
    const novaya = S.razobratZapis11(prezhnyaya, katalog);
    check(novaya !== null, `прежняя запись (${rezhim}) не открылась`);
    check(
      novaya?.tasks.length === 3 &&
        novaya.tasks[0].id === F('DP-07') &&
        novaya.tasks[1].p === 'DP-07' &&
        KLYUCH11.test(novaya.tasks[1].id) &&
        novaya.tasks[1].id !== F('DP-07') &&
        novaya.tasks[2].id === A('RZ-17', 1),
      'прежняя запись: задачи не те или сдвинулись',
    );
    check(
      novaya?.control === control,
      `прежняя запись: режим ${rezhim} → без подсказок ${novaya?.control}`,
    );
    check(novaya?.timer === true, `прежняя запись: режим ${rezhim} без таймера`);
    check(S.isTrenazher11Payload(novaya), 'прежняя запись после чтения не проходит проверку');
  }
  /* Самая ранняя запись: { zadachi: [[вид, подтип, номер или seed]], podskazki }. */
  const b = dannyeTrenazhera().bank.find((x) => x.id === 'VD-02' && x.analog === undefined);
  const rannyaya = S.razobratZapis11(
    {
      zadachi: [
        ['bank', 'VD-02', b.no],
        ['new', 'PR-02', 'sid'],
      ],
      podskazki: false,
    },
    katalog,
  );
  check(
    rannyaya?.tasks[0]?.id === `VD-02|b${b.no}` &&
      rannyaya.tasks[1]?.p === 'PR-02' &&
      rannyaya.control,
    'самая ранняя запись №11 не открылась',
  );
  check(
    S.razobratZapis11(
      { v: 1, rezhim: 'bez', seed: 'x', filtr: '', items: [{ k: 'XX-99|b1' }] },
      katalog,
    ) === null,
    'прежняя запись с чужим ключом принята',
  );
}

/* ── 6. Тексты карты ──────────────────────────────────────────── */
{
  const { TIPY11_OPASNO, GRUPPY11_TON, FORMULY11 } = requireSrc('content/tekstovye11.ts');
  for (const st of SUBTYPES) {
    check(
      typeof TIPY11_OPASNO[st.id] === 'string' && TIPY11_OPASNO[st.id].length > 20,
      `у типа ${st.id} нет текста «Где теряют балл»`,
    );
  }
  check(
    Object.keys(TIPY11_OPASNO).every((id) => gruppaOf.has(id)),
    'текст «Где теряют балл» у несуществующего типа',
  );
  check(
    SECTIONS.every((s) => GRUPPY11_TON[s.id] !== undefined),
    'у группы нет оформления',
  );
  check(FORMULY11.length > 0, 'нет блока «Что нужно знать»');
  for (const t of Object.values(TIPY11_OPASNO)) {
    check(!/[А-ЯЁ]{2}-\d\d/.test(t), `код подтипа в тексте для ученика: ${t.slice(0, 40)}`);
  }
}

if (failures.length > 0) {
  console.error(`\nТренажёр №11: ${failures.length} из ${checks} проверок не прошли:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(
  `Тренажёр №11: ${checks} проверок — перенос прогресса, файлы задач, тренировки, запись сессии.`,
);
