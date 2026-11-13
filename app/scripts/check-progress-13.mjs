#!/usr/bin/env node
/* scripts/check-progress-13.mjs — тренажёр №13 в «Стеклянной сцене»:
   перенос прежнего прогресса, каталог, проверка ответа, тренировки,
   запись сессии и тексты карты.

   Без браузера и без сборки сайта: модули читаются из исходников.
   Логика тренировки общая с №7, №6 (lib/trening/bank.ts); здесь — то,
   что у №13 своё: ключи задач «A-01|b3» (прототип и seed банка),
   источник у прототипа целиком, вердикт «число верное, единицы нет»,
   режим «Определи тип» и записи прежнего тренажёра с фильтрами.

     1. Перенос прогресса. Прежнее хранилище (ключ budetege:zadanie-13:v1,
        lib/progressStore.ts) наполняется НАСТОЯЩИМ прежним кодом — теми
        же вызовами recordAttempt, что делал прежний экран задачи
        (Zadacha13: kind — прототип, taskId — «A-01|b3»). Затем запись
        сворачивается в журнал тем же кодом, что работает на сайте
        (migrateLegacyLog). Попытки после PR #340 прежний экран писал
        прямо в журнал (trenazher13) — новый тренажёр читает их же.
        Отдельно — файл-образец (scripts/fixtures/progress-13-prezhniy.json).
     2. Ключи: журнал и сессия №13 в списке переноса в аккаунт.
     3. Каталог: 66 прототипов, 660 задач; каждая собирается движком,
        отпечаток ответа сходится, ответ в чужих единицах — «единицы».
     4. Тренировки по типам и источнику, «Работа над ошибками», «Похожая».
     5. Запись тренировки: новый формат, «Определи тип», записи прежнего
        тренажёра с фильтрами и самого первого экрана.
     6. Шаги решения: те же шаги, что в прежнем разборе.
     7. Тексты карты: «Где теряют балл» у каждого типа.

   Запуск: node scripts/check-progress-13.mjs */

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

const OLD_KEY = 'budetege:zadanie-13:v1';
const NEW_KEY = 'budetege:zadanie-13:log:v1';
const SESSION_KEY = 'budetege:trainer:13:session';

const { BANK_13 } = requireSrc('lib/zadanie13/bank.ts');
const { PROTOTIPY_TRENAZHERA_13, SHEMY_13 } = requireSrc('lib/zadanie13/trening/katalog.ts');
const { generate } = requireSrc('lib/zadanie13/generate.ts');
const { wrongUnitValues } = requireSrc('lib/zadanie13/edinicy.ts');
const { sealAnswer, sealChoice } = requireSrc('lib/zadanie13/secret.ts');
const { proverit13 } = requireSrc('lib/zadanie13/trening/otvet13.ts');
const { reshenieChasti, reshenieShagami } = requireSrc('lib/zadanie13/reshenieHtml.ts');
const B = requireSrc('lib/trening/bank.ts');
const S = requireSrc('lib/zadanie13/trening/session.ts');
const M = requireSrc('lib/progressLog/model.ts');

/* Каталог — как на сервере (Trenazher13Tab.katalog13). */
const katalog = Object.fromEntries(
  PROTOTIPY_TRENAZHERA_13.map((p) => {
    const ids = BANK_13.filter(([id]) => id === p.id).map(([id, seed]) => `${id}|${seed}`);
    return [
      p.id,
      p.source === 'fipi' ? { f: ids, a: [], strogo: true } : { f: [], a: ids, strogo: true },
    ];
  }),
);
const poZadache = B.prototipyZadach(katalog);
const prototipOf = (task) => B.prototipZadachi(task, poZadache);
const shemaOf = new Map(PROTOTIPY_TRENAZHERA_13.map((p) => [p.id, p.type]));

/* ── 1. Перенос прогресса ─────────────────────────────────────── */

/* [задача, верно, начисто, секунд, исход] — как писал прежний экран №13. */
const PREZHNIE = [
  ['A-01|b1', true, true, 210, 'right'],
  ['A-01|b2', true, false, 340, 'wrong'],
  ['A-05|b3', false, false, 400, 'wrong'],
  ['B-04|b1', true, true, 520, 'right'],
  ['B-13|b2', false, false, 610, 'revealed'],
  ['C-08|b5', true, false, 450, 'hinted'],
  ['D-07|b2', false, false, 380, 'wrong'],
];
{
  const storage = fakeStorage();
  podstavitStorage(storage);
  const { createProgressStore } = requireSrc('lib/progressStore.ts');
  const prezhnee = createProgressStore(OLD_KEY);
  for (const [taskId, right, clean, seconds, ishod] of PREZHNIE) {
    prezhnee.recordAttempt({
      kind: taskId.split('|')[0],
      taskId,
      right,
      clean,
      seconds,
      ishod,
      itog: right ? 'right' : 'wrong',
    });
  }
  const snimok = storage.getItem(OLD_KEY);
  check(snimok !== null, 'прежний код не записал хранилище');
  const staroe = JSON.parse(snimok);

  const { migrateLegacyLog, LEGACY_LOGS } = requireSrc('lib/progressLog/index.ts');
  check(LEGACY_LOGS[NEW_KEY] === OLD_KEY, 'журнал №13 не связан с прежним ключом');
  migrateLegacyLog(NEW_KEY);
  const log = M.parseLog(JSON.parse(storage.getItem(NEW_KEY) ?? 'null'));

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

  const poShemam = M.kindStats(log, (kind) => shemaOf.get(kind) ?? kind);
  for (const shema of SHEMY_13) {
    const zhdem = PREZHNIE.filter(([id]) => id.startsWith(shema));
    const s = poShemam.get(shema);
    check(
      (s?.done ?? 0) === zhdem.length && (s?.right ?? 0) === zhdem.filter((p) => p[1]).length,
      `перенос: схема ${shema} — ждали ${zhdem.length}, получили ${s?.done}/${s?.right}`,
    );
  }

  const oshibki = M.mistakes(log, prototipOf);
  const zhdem = PREZHNIE.filter((p) => !p[2]).map((p) => p[0]);
  check(
    oshibki.length === zhdem.length && zhdem.every((id) => oshibki.some((m) => m.task === id)),
    `перенос: ошибки ${oshibki.map((m) => m.task).join(',')}, а ждали ${zhdem.join(',')}`,
  );
  for (const m of oshibki) {
    check(m.kind === poZadache.get(m.task), `перенос: у ошибки ${m.task} чужой прототип`);
  }
  const rabota = B.buildMistakes(katalog, oshibki, 10);
  check(rabota.length > 0, 'перенос: «Работа над ошибками» из прежних ошибок не собралась');
  check(
    rabota.every((t) => zhdem.includes(t.fixes) && !zhdem.includes(t.id)),
    'перенос: в «Работе над ошибками» задача с ошибкой или чужой аналог',
  );
  check(storage.getItem(OLD_KEY) === snimok, 'перенос: прежний ключ изменён или удалён');
  const posle = storage.getItem(NEW_KEY);
  migrateLegacyLog(NEW_KEY);
  check(storage.getItem(NEW_KEY) === posle, 'перенос: повторный запуск изменил журнал');
}

/* После PR #340 прежний экран писал в журнал (createProgressStore с журналом):
   новый тренажёр читает тот же ключ. */
{
  const storage = fakeStorage();
  podstavitStorage(storage);
  const { trenazher13 } = requireSrc('lib/zadanie13/progress.ts');
  trenazher13.recordAttempt({
    kind: 'C-02',
    taskId: 'C-02|b4',
    right: false,
    clean: false,
    seconds: 90,
    ishod: 'wrong',
    itog: 'wrong',
  });
  const { PROGRESS13_KEY } = requireSrc('lib/zadanie13/trening/progress.ts');
  check(PROGRESS13_KEY === NEW_KEY, 'новый тренажёр пишет не в тот журнал');
  const log = M.parseLog(JSON.parse(storage.getItem(NEW_KEY) ?? 'null'));
  check(
    M.mistakes(log, prototipOf).some((m) => m.task === 'C-02|b4' && m.kind === 'C-02'),
    'попытка прежнего экрана после PR #340 не видна новому тренажёру',
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
  check(storage.getItem(OLD_KEY) === raw, `перенос: ${chto} прежняя запись изменена`);
}

/* Файл-образец: localStorage ученика, решавшего №13 до редизайна. */
const obrazec = JSON.parse(
  fs.readFileSync(path.join(HERE, 'fixtures', 'progress-13-prezhniy.json'), 'utf8'),
);
{
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
    check(shemaOf.has(kind), `образец: прототипа ${kind} нет в тренажёре`);
  }
  const oshibki = M.mistakes(log, prototipOf);
  check(
    oshibki.length === obrazec[OLD_KEY].mistakes.length,
    `образец: ошибок ${oshibki.length}, а в прежней записи ${obrazec[OLD_KEY].mistakes.length}`,
  );
  for (const m of oshibki) {
    check(poZadache.has(m.task), `образец: задачи ${m.task} нет в каталоге`);
  }
}

/* ── 2. Ключи ─────────────────────────────────────────────────── */
{
  const { IMPORT_GROUPS, IMPORT_KEY_PATTERN } = requireSrc('lib/progressImport/registry.ts');
  const z13 = IMPORT_GROUPS.find((g) => g.id === 'z13');
  check(z13 !== undefined, 'в списке переноса в аккаунт нет №13');
  check(z13?.keys.includes(NEW_KEY) === true, 'журнал №13 не переносится в аккаунт');
  check(z13?.keys.includes(SESSION_KEY) === true, 'сессия №13 не переносится');
  check(z13?.keys.includes(OLD_KEY) !== true, 'прежний ключ №13 не должен уходить в аккаунт');
  check(
    (z13?.keys ?? []).every((key) => IMPORT_KEY_PATTERN.test(key)),
    'ключ №13 не проходит правило базы',
  );
}

/* ── 3. Каталог: каждая задача собирается, ответ сходится ──────── */
check(PROTOTIPY_TRENAZHERA_13.length === 66, `в тренажёре ${PROTOTIPY_TRENAZHERA_13.length} типов`);
check(Object.keys(katalog).length === 66, 'в каталоге не все прототипы');
check(poZadache.size === 660, `в каталоге ${poZadache.size} задач, а не 660`);
{
  let edinic = 0;
  const TIPY = ['A', 'B', 'C', 'D'];
  for (const [id] of poZadache) {
    check(S.KLYUCH13.test(id), `ключ ${id} не читается`);
    const p = S.prototipKlyucha13(id);
    const t = generate(p, id.slice(p.length + 1));
    const z = {
      seal: sealAnswer(t.answer),
      wrongUnits: wrongUnitValues(t.answer, t.units).map((v) => sealAnswer(v)),
      sealTip: sealChoice(String(TIPY.indexOf(t.type) + 1)),
    };
    const otvet = String(t.answer).replace('.', ',');
    const r = proverit13(otvet, z, false);
    check(r.kind === 'answer' && r.right, `${id}: верный ответ ${otvet} не принят`);
    const chuzhoe = wrongUnitValues(t.answer, t.units)[0];
    if (chuzhoe !== undefined && Number.isInteger(chuzhoe * 1000)) {
      edinic += 1;
      const u = proverit13(String(chuzhoe).replace('.', ','), z, false);
      check(u.kind === 'edinicy', `${id}: ответ в чужих единицах ${chuzhoe} — не «единицы»`);
    }
    const w = proverit13(String(t.answer + 1), z, false);
    check(w.kind === 'answer' && !w.right, `${id}: неверный ответ принят`);
    check(
      proverit13(String(TIPY.indexOf(t.type) + 1), z, true).right === true,
      `${id}: «Определи тип» — верная схема не принята`,
    );
    check(
      proverit13(String(((TIPY.indexOf(t.type) + 1) % 4) + 1), z, true).right === false,
      `${id}: «Определи тип» — чужая схема принята`,
    );
    /* Шаги решения — те же, что в прежнем разборе: столько же и в том же порядке. */
    const chasti = reshenieChasti(t.solution, t.tableModel);
    const shagi = reshenieShagami(t.solution, t.tableModel);
    check(
      shagi.length === chasti.length,
      `${id}: шагов ${shagi.length}, а в разборе ${chasti.length}`,
    );
    check(
      shagi.every((s, i) => chasti[i].includes(s.zagolovokHtml)),
      `${id}: подпись шага не та, что в разборе`,
    );
    check(
      shagi.every((s, i) => s.formulaHtml === '' || chasti[i].includes(s.formulaHtml)),
      `${id}: формула шага не та, что в разборе`,
    );
  }
  check(edinic > 300, `«единицы» проверены только у ${edinic} задач`);
}
{
  /* Дробь с верным значением — подсказка, попытка не тратится (lib/otvet). */
  const z = { seal: sealAnswer(0.5), wrongUnits: [], sealTip: '' };
  check(proverit13('1/2', z, false).kind === 'fractionRight', 'дробь «1/2» не дала подсказку');
}

/* ── 4. Тренировки ───────────────────────────────────────────── */
let seed = 13;
const rnd = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};
const vse = PROTOTIPY_TRENAZHERA_13.map((p) => p.id);
{
  const t = B.buildByTipy(katalog, vse, 10, new Set(), 'vse', rnd);
  check(t.length === 10, `вперемешку: ${t.length} задач, а не 10`);
  check(new Set(t.map((x) => x.p)).size === 10, 'вперемешку: тип повторился раньше времени');
  check(
    t.every((x) => poZadache.get(x.id) === x.p),
    'вперемешку: у задачи чужой прототип',
  );
}
{
  const svoi = PROTOTIPY_TRENAZHERA_13.filter((p) => p.source === 'own').map((p) => p.id);
  const fipi = PROTOTIPY_TRENAZHERA_13.filter((p) => p.source === 'fipi').map((p) => p.id);
  check(svoi.length > 0 && fipi.length > 0, 'нет прототипов одного из источников');
  const f = B.buildByTipy(katalog, vse, 40, new Set(), 'fipi', rnd);
  check(
    f.length === 40 && f.every((x) => fipi.includes(x.p)),
    '«Из банка ФИПИ»: попала задача не из банка',
  );
  check(
    B.skolkoZadach(katalog, svoi, 'fipi') === 0,
    '«Из банка ФИПИ» у своих прототипов подставил их задачи',
  );
  const n = B.buildByTipy(katalog, vse, 40, new Set(), 'new', rnd);
  check(
    n.length > 0 && n.every((x) => svoi.includes(x.p)),
    '«Не из банка»: попала задача из банка',
  );
}
{
  const bezKonca = B.buildByTipy(katalog, vse, 40, new Set(), 'vse', rnd);
  check(new Set(bezKonca.map((x) => x.id)).size === 40, '«Без конца»: повтор задачи');
  const closed = new Set(katalog['A-01'].f.slice(0, 8));
  const t = B.buildByTipy(katalog, ['A-01'], 2, closed, 'vse', rnd);
  check(
    t.every((x) => !closed.has(x.id)),
    'по типам: решённая задача пришла раньше нерешённых',
  );
}
{
  const mistakes = [
    { task: 'A-01|b2', kind: 'A-01', at: 2, streak: 0 },
    { task: 'D-07|b2', kind: 'D-07', at: 1, streak: 0 },
  ];
  const t = B.buildMistakes(katalog, mistakes, 10, rnd);
  check(t.length === 4, `работа над ошибками: ${t.length} задач, а не 4`);
  check(
    t.every((x) => mistakes.some((m) => m.task === x.fixes && m.kind === x.p)),
    'работа над ошибками: аналог не помнит свою ошибку',
  );
  const a = B.analogOf(katalog, 'C-08', 'C-08|b1', new Set(), rnd);
  check(a !== null && a !== 'C-08|b1' && a.startsWith('C-08|'), 'похожая задача: не тот прототип');
}

/* ── 5. Запись тренировки ─────────────────────────────────────── */
{
  const payload = {
    tasks: [
      { id: 'A-01|b3', p: 'A-01' },
      { id: 'D-02|b5', p: 'D-02', fixes: 'D-02|b1' },
    ],
    control: false,
    timer: true,
    rezhim: S.REZHIM_TIP,
  };
  check(B.isPayloadBanka(payload, S.KLYUCH13), 'запись «Определи тип» не читается');
  check(
    B.razobratZapis(payload, S.KLYUCH13) === payload,
    'запись нового формата изменена при чтении',
  );
  check(
    !B.isPayloadBanka({ tasks: [{ id: 'P04-a01', p: 'P04' }], control: false }, S.KLYUCH13),
    'ключ №6 принят в №13',
  );
  check(!B.isPayloadBanka({ ...payload, rezhim: 5 }, S.KLYUCH13), 'режим-число принят');
}
{
  /* Прежний тренажёр с фильтрами: запись из образца. */
  const zapis = JSON.parse(obrazec[SESSION_KEY]);
  check(
    B.razobratZapis(zapis.payload, S.KLYUCH13) === null,
    'прежняя запись читается общим разбором',
  );
  const novaya = S.prezhnyayaZapis13(zapis.payload);
  check(novaya !== null, 'прежняя запись тренажёра с фильтрами не открылась');
  check(
    novaya?.tasks.length === 3 &&
      novaya.tasks[0].id === 'A-01|b3' &&
      novaya.tasks[0].p === 'A-01' &&
      novaya.tasks[1].p === 'C-02',
    'прежняя запись: задачи не те',
  );
  check(novaya?.control === true, 'прежний режим «Без подсказок» потерян');
  check(novaya?.rezhim === undefined, 'прежняя запись без «Определить схему» стала «Определи тип»');
  check(B.isPayloadBanka(novaya, S.KLYUCH13), 'прежняя запись после чтения не проходит проверку');

  const tip = S.prezhnyayaZapis13({ ...zapis.payload, rezhim: 'vremya', dop: { zadanie: 'tip' } });
  check(
    tip?.rezhim === S.REZHIM_TIP && tip.timer === true,
    'прежняя «Определить схему» не открылась',
  );
  const oform = S.prezhnyayaZapis13({ ...zapis.payload, dop: { oformlenie: 'oformlenie' } });
  check(oform !== null && oform.rezhim === undefined, 'прежняя «С оформлением» не открылась');

  /* Самый первый экран №13: { zadachi: [[прототип, seed, …, вид]] }. */
  const pervaya = S.prezhnyayaZapis13({
    zadachi: [
      ['B-04', 'b2', '', 'zadachi', ''],
      ['C-01', 'b1', '', 'zadachi', ''],
    ],
    rezhim: 'otvet',
  });
  check(
    pervaya?.tasks.map((t) => t.id).join() === 'B-04|b2,C-01|b1',
    'самая первая запись №13 не открылась',
  );
  check(
    S.prezhnyayaZapis13({ v: 1, items: [{ k: 'чужое' }] }) === null &&
      S.prezhnyayaZapis13(null) === null,
    'мусор принят за прежнюю запись',
  );
}

/* ── 7. Тексты карты ──────────────────────────────────────────── */
{
  const { opasno13, GRUPPY13_VID, FORMULY13, OPASNO_VOPROS13 } = requireSrc(
    'content/ekonomicheskie13.ts',
  );
  for (const p of PROTOTIPY_TRENAZHERA_13) {
    const t = generate(p.id, katalog[p.id].f[0] ?? katalog[p.id].a[0]);
    const txt = opasno13(p.type, t.vopros, t.units);
    check(typeof txt === 'string' && txt.length > 20, `у типа ${p.id} нет «Где теряют балл»`);
    check(
      t.vopros === undefined || OPASNO_VOPROS13[t.vopros] !== undefined,
      `у вопроса ${t.vopros} нет текста`,
    );
    check(!/[A-D]-\d\d/.test(txt), `в «Где теряют балл» типа ${p.id} — код прототипа`);
  }
  check(
    SHEMY_13.every((s) => GRUPPY13_VID[s] !== undefined),
    'у схемы нет оформления',
  );
  check(FORMULY13.length > 0, 'нет блока «Что нужно знать»');
}

if (failures.length > 0) {
  console.error(`\nТренажёр №13: ${failures.length} из ${checks} проверок не прошли:\n`);
  for (const f of failures.slice(0, 60)) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(
  `Тренажёр №13: ${checks} проверок — перенос прогресса, каталог, тренировки, запись сессии.`,
);
