#!/usr/bin/env node
/* scripts/check-progress-12.mjs — тренажёр узла №12 в «Стеклянной сцене»:
   перенос прежнего прогресса, каталог шаблонов, сборка тренировок,
   запись сессии, проверка ответа, примеры карты и тексты.

   Без браузера и без сборки сайта: модули читаются из исходников.
   Логика тренировки общая с №7 и №6 (lib/trening/bank.ts); здесь — то,
   что у №12 своё: задача — шаблон набора движка («12Q.B-07», у задач ФИПИ
   «12E.A-F1»), задачу строит движок graph/ с постоянным seed набора,
   прежние записи тренажёра с фильтрами.

     1. Перенос прогресса. Файл-образец scripts/fixtures/progress-12-prezhniy.json
        записан ПРЕЖНИМ кодом хранилища (main до редизайна):
          - budetege:trainer:v1 — счётчики самого первого тренажёра (тот же
            образец, что в progress-legacy.json);
          - budetege:zadanie-12:log:v1 — журнал, записанный вызовами
            recordAttempt (lib/trainerProgress.ts) — так писал экран задачи
            прежнего тренажёра (KARTOCHKA_12.zapisat);
          - budetege:trainer:12:session — незаконченная тренировка прежнего
            тренажёра узла: запись encodeSession с заданиями формата
            TrenPayload, как их собирал Trenazher.nachat.
        Новый тренажёр читает тот же журнал: счётчики по наборам и видам,
        «Мои ошибки», «Работа над ошибками»; прежний ключ сворачивается
        в журнал и остаётся на месте; прежняя тренировка открывается.
     2. Ключи: журнал и сессия №12 в списке переноса в аккаунт.
     3. Каталог: 748 шаблонов, 42 набора, ключи читаются.
     4. Тренировки: вперемешку, по типам, источник, «Работа над ошибками».
     5. Каждый шаблон собирается движком с seed набора; ответ проверяется
        по общему правилу записи (дробь с верным значением — подсказка).
     6. Примеры карты «О задании»: у каждого типа есть условие, чертёж,
        шаги и ответ; «Где теряют балл» — у каждого типа.

   Запуск: node scripts/check-progress-12.mjs */

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
  return ok;
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
    sessionStorage: storage,
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {},
  };
  globalThis.localStorage = storage;
}

const OLD_KEY = 'budetege:trainer:v1';
const NEW_KEY = 'budetege:zadanie-12:log:v1';
const SESSION_KEY = 'budetege:trainer:12:session';

const OBRAZEC = JSON.parse(
  fs.readFileSync(path.join(HERE, 'fixtures', 'progress-12-prezhniy.json'), 'utf8'),
);

const { katalog12 } = requireSrc('lib/ves12/trening/katalog.ts');
const S = requireSrc('lib/ves12/trening/session.ts');
const B = requireSrc('lib/trening/bank.ts');
const M = requireSrc('lib/progressLog/model.ts');
const { podtemaNabora } = requireSrc('lib/ves12/trenazher12.ts');

const katalog = katalog12();
const poZadache = B.prototipyZadach(katalog);
const prototipOf = (task) => B.prototipZadachi(task, poZadache);
const vidNabora = podtemaNabora();

/* ── 1. Перенос прогресса ─────────────────────────────────────── */

/* а) Только счётчики самого первого тренажёра: сворачиваются в журнал. */
{
  const raw = JSON.stringify(OBRAZEC[OLD_KEY]);
  const storage = fakeStorage({ [OLD_KEY]: raw });
  podstavitStorage(storage);
  const { migrateLegacyLog, LEGACY_LOGS } = requireSrc('lib/progressLog/index.ts');
  check(LEGACY_LOGS[NEW_KEY] === OLD_KEY, 'журнал №12 не связан с прежним ключом');
  migrateLegacyLog(NEW_KEY);
  const log = M.parseLog(JSON.parse(storage.getItem(NEW_KEY) ?? 'null'));
  const stats = M.kindStats(log);
  for (const [kind, tally] of Object.entries(OBRAZEC[OLD_KEY].kinds)) {
    const s = stats.get(kind);
    check(
      s?.done === tally.done && s?.right === tally.right,
      `перенос: счётчики ${kind} — было ${tally.done}/${tally.right}, стало ${s?.done}/${s?.right}`,
    );
    check(katalog[kind] !== undefined, `перенос: набора ${kind} нет в каталоге тренажёра`);
  }
  const oshibki = M.mistakes(log, prototipOf);
  check(
    oshibki.length === OBRAZEC[OLD_KEY].mistakes.length,
    `перенос: ошибок ${oshibki.length}, а в прежней записи ${OBRAZEC[OLD_KEY].mistakes.length}`,
  );
  for (const m of oshibki) {
    check(poZadache.has(m.task), `перенос: задачи ${m.task} нет в каталоге`);
    check(m.kind === poZadache.get(m.task), `перенос: у ошибки ${m.task} чужой набор`);
  }
  check(storage.getItem(OLD_KEY) === raw, 'перенос: прежний ключ изменён или удалён');
  const posle = storage.getItem(NEW_KEY);
  migrateLegacyLog(NEW_KEY);
  check(storage.getItem(NEW_KEY) === posle, 'перенос: повторный запуск изменил журнал');
}

/* б) Журнал прежнего тренажёра: новый тренажёр читает его как есть. */
{
  const zapis = OBRAZEC[NEW_KEY];
  const storage = fakeStorage({
    [OLD_KEY]: JSON.stringify(OBRAZEC[OLD_KEY]),
    [NEW_KEY]: JSON.stringify(zapis),
  });
  podstavitStorage(storage);
  const { log12 } = requireSrc('lib/ves12/trening/progress.ts');
  const log = log12.get();
  check(log.attempts.length === zapis.attempts.length, 'журнал: попытки потерялись при чтении');
  check(
    storage.getItem(NEW_KEY) === JSON.stringify(zapis),
    'журнал: прежний ключ свернулся поверх готового журнала',
  );
  const stats = M.kindStats(log);
  for (const a of zapis.attempts) {
    check(katalog[a.kind] !== undefined, `журнал: набора ${a.kind} нет в каталоге`);
    check(poZadache.get(a.task) === a.kind, `журнал: задача ${a.task} не в своём наборе`);
    check(stats.get(a.kind) !== undefined, `журнал: нет счётчика ${a.kind}`);
  }
  /* Прогресс по видам функций — как на карте и в панели тренажёра. */
  const poVidam = M.kindStats(log, (kind) => vidNabora[kind] ?? kind);
  check(poVidam.get('quadratic')?.done === 3, 'журнал: по квадратичной не 3 задачи');
  const oshibki = M.mistakes(log, prototipOf);
  /* «С подсказкой» в «Мои ошибки» не попадает — как и прежде. */
  const zhdem = zapis.attempts
    .filter((a) => a.outcome === 'wrong' || a.outcome === 'revealed')
    .map((a) => a.task);
  check(
    oshibki.length === zhdem.length && zhdem.every((id) => oshibki.some((m) => m.task === id)),
    `журнал: ошибки ${oshibki.map((m) => m.task).join(',')}, а ждали ${zhdem.join(',')}`,
  );
  const rabota = B.buildMistakes(katalog, oshibki, 10);
  check(rabota.length > 0, 'журнал: «Работа над ошибками» не собралась');
  check(
    rabota.every(
      (t) => zhdem.includes(t.fixes) && !zhdem.includes(t.id) && t.p === poZadache.get(t.fixes),
    ),
    'журнал: в «Работе над ошибками» задача с ошибкой или чужой набор',
  );
  const closed = M.closedTasks(log);
  check(closed.has('12Q.B-03') && closed.has('12.C-07'), 'журнал: решённые задачи не закрыты');
}

/* в) Незаконченная тренировка прежнего тренажёра узла. */
{
  const { decodeSession } = requireSrc('lib/trainerSession/store.ts');
  const raw = JSON.stringify(OBRAZEC[SESSION_KEY]);
  const stored = decodeSession(raw, '12');
  check(stored !== null && stored !== 'version', 'сессия: прежняя запись не читается хранилищем');
  const packed = stored?.payload;
  check(B.razobratZapis(packed, S.KLYUCH12) === null, 'сессия: прежний формат принят как новый');
  const novaya = S.perenos12(packed);
  check(novaya !== null, 'сессия: прежняя тренировка не открылась');
  check(
    novaya?.tasks.map((t) => `${t.id}:${t.p}`).join(',') ===
      '12Q.B-03:12Q.B,12R.A-05:12R.A,12.D-11:12.D',
    'сессия: задачи прежней тренировки не те',
  );
  check(novaya?.control === true, 'сессия: «Без подсказок» не стал «Без подсказок и решений»');
  check(
    novaya !== null && B.isPayloadBanka(novaya, S.KLYUCH12),
    'сессия: перенос не в формате банка',
  );
  check(
    S.perenos12({ v: 1, filtr: '', rezhim: 'vremya', seed: 'x', items: [{ k: '12.A-01' }] })
      ?.timer === true,
    'сессия: «На время» не стал таймером',
  );
  check(
    S.perenos12({
      recipe: 1,
      control: false,
      tasks: [{ set: '12.A', seed: 's', id: '12.A-02', sig: 'q' }],
    })?.tasks[0]?.id === '12.A-02',
    'сессия: самый первый формат (рецепты) не читается',
  );
  check(S.perenos12({ v: 1, items: [{ k: 'P04' }] }) === null, 'сессия: чужой ключ принят');
  check(S.perenos12(null) === null && S.perenos12({}) === null, 'сессия: мусор принят');
}

/* ── 2. Ключи ─────────────────────────────────────────────────── */
{
  const { IMPORT_GROUPS, IMPORT_KEY_PATTERN } = requireSrc('lib/progressImport/registry.ts');
  const z12 = IMPORT_GROUPS.find((g) => g.id === 'z12');
  check(z12?.keys.includes(NEW_KEY) === true, 'журнал №12 не переносится в аккаунт');
  check(z12?.keys.includes(SESSION_KEY) === true, 'сессия №12 не переносится в аккаунт');
  check(z12?.keys.includes(OLD_KEY) !== true, 'прежний ключ №12 не должен уходить в аккаунт');
  check(
    (z12?.keys ?? []).every((key) => IMPORT_KEY_PATTERN.test(key)),
    'ключ №12 не проходит правило базы',
  );
}

/* ── 3. Каталог ───────────────────────────────────────────────── */
const nabory = Object.keys(katalog);
check(nabory.length === 42, `наборов в каталоге ${nabory.length}, а не 42`);
check(poZadache.size === 748, `шаблонов в каталоге ${poZadache.size}, а не 748`);
check(
  Object.values(katalog).reduce((n, k) => n + k.f.length, 0) === 448,
  'задач ФИПИ в каталоге не 448',
);
for (const [id, p] of poZadache) {
  check(S.KLYUCH12.test(id), `ключ ${id} не читается`);
  check(S.naborKlyucha(id) === p, `шаблон ${id}: чужой набор в каталоге`);
  check(B.prototipZadachi(id, new Map()) === p, `шаблон ${id}: набор по ключу не тот`);
}
for (const n of nabory) {
  check(vidNabora[n] !== undefined, `набор ${n} без вида функции`);
}

/* ── 4. Тренировки ────────────────────────────────────────────── */
let seed = 12;
const rnd = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};
{
  const t = B.buildByTipy(katalog, nabory, 10, new Set(), 'vse', rnd);
  check(t.length === 10, `вперемешку: ${t.length} задач, а не 10`);
  check(new Set(t.map((x) => x.p)).size === 10, 'вперемешку: тип повторился раньше времени');
  check(
    t.every((x) => poZadache.get(x.id) === x.p),
    'вперемешку: у задачи чужой набор',
  );
  const vse = B.buildByTipy(katalog, nabory, 40, new Set(), 'vse', rnd);
  check(new Set(vse.map((x) => x.id)).size === 40, '«Без конца»: повтор задачи');
}
{
  const fipi = B.buildByTipy(katalog, ['12Q.B', '12E.A'], 20, new Set(), 'fipi', rnd);
  const f = new Set([...katalog['12Q.B'].f, ...katalog['12E.A'].f]);
  check(
    fipi.length > 0 && fipi.every((x) => f.has(x.id)),
    'источник «ФИПИ»: попала задача не из банка',
  );
  const nw = B.buildByTipy(katalog, ['12E.A'], 20, new Set(), 'new', rnd);
  check(
    nw.every((x) => katalog['12E.A'].a.includes(x.id)),
    'источник «Не из банка»: попала ФИПИ',
  );
  const closed = new Set(katalog['12Q.B'].f.slice(0, 5));
  const t = B.buildByTipy(katalog, ['12Q.B'], 5, closed, 'vse', rnd);
  check(
    t.every((x) => !closed.has(x.id)),
    'по типам: решённая задача раньше нерешённых',
  );
}
{
  const id = katalog['12R.G'].f[0] ?? katalog['12R.G'].a[0];
  const a = B.analogOf(katalog, '12R.G', id, new Set(), rnd);
  check(a !== null && a !== id && poZadache.get(a) === '12R.G', 'похожая задача: не тот набор');
}

/* ── 5. Каждый шаблон собирается; ответ — по общему правилу ──── */
{
  const { zadachaShablona } = requireSrc('lib/trainerSession.ts');
  const { readOtvet12, seal12 } = requireSrc('lib/ves12/trening/otvet12.ts');
  const cache = new Map();
  let vybor = 0;
  for (const [id, p] of poZadache) {
    const task = zadachaShablona(id, S.seedNabora12(p), cache);
    if (!check(task !== null, `шаблон ${id} не собрался с seed набора`)) continue;
    const again = zadachaShablona(id, S.seedNabora12(p), new Map());
    check(again?.questionHtml === task.questionHtml, `шаблон ${id}: задача по ключу не та же`);
    check(task.chartSvg !== null, `шаблон ${id}: нет чертежа`);
    const seal = seal12(task.answer, task.options !== null);
    if (task.options !== null) {
      vybor += 1;
      check(
        readOtvet12(task.answer, seal).right === true,
        `шаблон ${id}: верный вариант не принят`,
      );
      const drugoy = task.options.find((o) => o.number !== task.answer)?.number ?? 'x';
      check(readOtvet12(drugoy, seal).right === false, `шаблон ${id}: неверный вариант принят`);
    } else {
      const r = readOtvet12(task.answer, seal);
      check(r.kind === 'answer' && r.right, `шаблон ${id}: верный ответ ${task.answer} не принят`);
    }
  }
  check(vybor === 40, `задач с выбором варианта ${vybor}, а не 40`);
  const drob = readOtvet12('1/2', '0,5');
  check(drob.kind === 'fractionRight', 'дробь с верным значением засчитана, а не подсказка');
  check(readOtvet12('0.5', '0,5').right === true, 'десятичная точка не принята');
  check(readOtvet12('-3', '3').right === false, 'неверный ответ принят');
}

/* ── 6. Примеры карты и тексты ───────────────────────────────── */
{
  const { primer12 } = requireSrc('lib/ves12/trening/primer.ts');
  const C = requireSrc('content/zadanie12.ts');
  for (const n of nabory) {
    const p = primer12(katalog, n);
    if (!check(p !== null, `пример ${n} не собрался`)) continue;
    check(p.chertezhSvg !== null, `пример ${n}: нет чертежа`);
    check(p.shagi.length > 0, `пример ${n}: нет шагов`);
    check(p.otvetHtml !== '', `пример ${n}: нет ответа`);
    check(poZadache.get(p.klyuch) === n, `пример ${n}: задача из чужого набора`);
    check((katalog[n].f[0] ?? katalog[n].a[0]) === p.klyuch, `пример ${n}: не первая задача`);
    check(
      typeof C.TIPY12_OPASNO[n] === 'string' && C.TIPY12_OPASNO[n].length > 20,
      `«Где теряют балл» нет у ${n}`,
    );
    check(!/\b12[A-Z]?\.[A-Z]\b/.test(C.TIPY12_OPASNO[n] ?? ''), `код набора в тексте ${n}`);
  }
  const vidy = new Set(Object.values(vidNabora));
  for (const v of vidy) {
    check(
      C.FORMULY12.some((f) => f.vid === v),
      `«Что нужно знать»: нет формул вида ${v}`,
    );
  }
}

if (failures.length > 0) {
  console.error(`\n№12: ${failures.length} из ${checks} проверок не прошли:\n`);
  for (const f of failures.slice(0, 60)) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(
  `№12: ${checks} проверок — перенос прогресса, каталог, тренировки, ответы и примеры в порядке.`,
);
