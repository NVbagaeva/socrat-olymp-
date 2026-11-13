#!/usr/bin/env node
/* scripts/check-progress-2.mjs — тренажёр №2 в «Стеклянной сцене»:
   перенос прежнего прогресса, сборка тренировок, запись сессии.

   Без браузера и без сборки сайта: модули читаются из исходников.
   Логика тренировки общая с №7 и №6 (lib/trening/bank.ts); здесь — то,
   что у №2 своё: банка нет, задачи строит генератор по ключу
   «прототип|seed»; каталог — по 50 проверенных seed на тип; прежние
   ключи со случайным seed тоже читаются.

     1. Перенос прогресса. Прежнее хранилище (ключ budetege:vektory-2:v1,
        lib/progressStore.ts) наполняется НАСТОЯЩИМ прежним кодом — теми
        же вызовами recordAttempt, что делал экран задачи до редизайна
        (kind — прототип, ключ — «прототип|случайный seed»). Затем запись
        сворачивается в журнал тем же кодом, что работает на сайте
        (migrateLegacyLog): счётчики по прототипам и группам, «Мои
        ошибки», прежний ключ на месте, повторный перенос ничего не
        меняет, испорченные записи не ломают журнал. Отдельно — файл-
        образец (scripts/fixtures/progress-2-prezhniy.json).
     2. Ключи: журнал №2 в списке переноса в аккаунт и в списке прежних.
     3. Каталог: 50 разных задач на тип, каждая собирается генератором;
        тренировка по типам; «Работа над ошибками» из прежних ошибок со
        случайным seed; «Похожая задача».
     4. Запись тренировки: новый формат и прежний ({ control, tasks:
        [[ключ, подпись], …] }), «Контроль» → «Без подсказок и решений».
     5. Тексты карты: «Где теряют балл» у каждого типа; опорные блоки
        типов существуют.

   Запуск: node scripts/check-progress-2.mjs */

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

const OLD_KEY = 'budetege:vektory-2:v1';
const NEW_KEY = 'budetege:zadanie-2:log:v1';

const { PROTOTYPES } = requireSrc('lib/vektory/prototypes/index.ts');
const { generate } = requireSrc('lib/vektory/generate.ts');
const B = requireSrc('lib/trening/bank.ts');
const S = requireSrc('lib/vektory/trening/session.ts');
const M = requireSrc('lib/progressLog/model.ts');
const { katalog2, ZADACH_NA_TIP } = requireSrc('lib/vektory/trening/katalog.ts');

const katalog = katalog2();
const poZadache = B.prototipyZadach(katalog);
const prototipOf = (task) => B.prototipZadachi(task, poZadache);
const gruppaOf = new Map(PROTOTYPES.map((p) => [p.id, p.gruppa]));

/* ── 1. Перенос прогресса ─────────────────────────────────────── */

/* [прототип, случайный seed, верно, начисто, секунд] — как писал прежний экран. */
const PREZHNIE = [
  ['A1', 'mx1a2b-3c4d5e6f', true, true, 40],
  ['A6', 'mx1a2c-7g8h9i0j', true, false, 130] /* верно после ошибки */,
  ['A6', 'mx1a2d-1k2l3m4n', false, false, 95] /* открыл решение */,
  ['B5', 'mx1a2e-5o6p7q8r', true, true, 88],
  ['C2', 'mx1a2f-9s0t1u2v', false, false, 200],
];
{
  const storage = fakeStorage();
  podstavitStorage(storage);
  const { createProgressStore } = requireSrc('lib/progressStore.ts');
  const prezhnee = createProgressStore(OLD_KEY);
  for (const [p, seed, right, clean, seconds] of PREZHNIE) {
    prezhnee.recordAttempt({ kind: p, taskId: `${p}|${seed}`, right, clean, seconds });
  }
  const snimok = storage.getItem(OLD_KEY);
  check(snimok !== null, 'прежний код не записал хранилище');
  const staroe = JSON.parse(snimok);

  const { migrateLegacyLog, LEGACY_LOGS } = requireSrc('lib/progressLog/index.ts');
  check(LEGACY_LOGS[NEW_KEY] === OLD_KEY, 'журнал №2 не связан с прежним ключом');
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
  check(poTipam.size === Object.keys(staroe.kinds).length, 'перенос: появились лишние типы');
  const poGruppam = M.kindStats(log, (kind) => gruppaOf.get(kind) ?? kind);
  check(
    poGruppam.get('A')?.done === 3 &&
      poGruppam.get('B')?.done === 1 &&
      poGruppam.get('C')?.done === 1,
    'перенос: счётчики по группам не сошлись',
  );

  const oshibki = M.mistakes(log, prototipOf);
  const zhdem = PREZHNIE.filter((p) => !p[3]).map((p) => `${p[0]}|${p[1]}`);
  check(
    oshibki.length === zhdem.length && zhdem.every((id) => oshibki.some((m) => m.task === id)),
    `перенос: ошибки ${oshibki.map((m) => m.task).join(',')}, а ждали ${zhdem.join(',')}`,
  );
  for (const m of oshibki) {
    check(m.kind === m.task.split('|')[0], `перенос: у ошибки ${m.task} чужой прототип`);
    check(S.etoKlyuch2(m.task), `перенос: ключ прежней ошибки ${m.task} не читается`);
  }
  /* «Работа над ошибками» из прежних ошибок со случайным seed: задачи каталога того же типа. */
  const rabota = B.buildMistakes(katalog, oshibki, 10);
  check(rabota.length > 0, 'перенос: «Работа над ошибками» из прежних ошибок не собралась');
  check(
    rabota.every((t) => zhdem.includes(t.fixes) && poZadache.get(t.id) === t.p),
    'перенос: в «Работе над ошибками» чужая задача',
  );

  check(storage.getItem(OLD_KEY) === snimok, 'перенос: прежний ключ изменён или удалён');
  const posle = storage.getItem(NEW_KEY);
  migrateLegacyLog(NEW_KEY);
  check(storage.getItem(NEW_KEY) === posle, 'перенос: повторный запуск изменил журнал');
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

/* Файл-образец: localStorage ученика, решавшего №2 до редизайна. */
{
  const obrazec = JSON.parse(
    fs.readFileSync(path.join(HERE, 'fixtures', 'progress-2-prezhniy.json'), 'utf8'),
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
    check(gruppaOf.has(kind), `образец: прототипа ${kind} нет`);
  }
  const oshibki = M.mistakes(log, prototipOf);
  check(
    oshibki.length === obrazec[OLD_KEY].mistakes.length,
    `образец: ошибок ${oshibki.length}, а в прежней записи ${obrazec[OLD_KEY].mistakes.length}`,
  );
  for (const m of oshibki) {
    let sobralas = true;
    try {
      generate(m.kind, m.task.split('|')[1]);
    } catch {
      sobralas = false;
    }
    check(sobralas, `образец: задача ошибки ${m.task} не собирается генератором`);
  }
  /* Опорные: ключ и формат прежние — прогресс блока читается как есть. */
  const op = obrazec['budetege:vektory-2:opornye:v1'];
  const { mikroResheno } = requireSrc('lib/vektory/progress.ts');
  check(mikroResheno(op, 'P2-1', 10) === 4, 'образец: опорные — прогресс блока не читается');
}

/* ── 2. Ключи ─────────────────────────────────────────────────── */
{
  const { IMPORT_GROUPS, IMPORT_KEY_PATTERN } = requireSrc('lib/progressImport/registry.ts');
  const z2 = IMPORT_GROUPS.find((g) => g.id === 'z2');
  check(z2 !== undefined, 'в списке переноса в аккаунт нет №2');
  check(z2?.keys.includes(NEW_KEY) === true, 'журнал №2 не переносится в аккаунт');
  check(z2?.keys.includes('budetege:trainer:2:session') === true, 'сессия №2 не переносится');
  check(z2?.keys.includes(OLD_KEY) !== true, 'прежний ключ №2 не должен уходить в аккаунт');
  check(
    (z2?.keys ?? []).every((key) => IMPORT_KEY_PATTERN.test(key)),
    'ключ №2 не проходит правило базы',
  );
}

/* ── 3. Каталог и тренировки ─────────────────────────────────── */
check(Object.keys(katalog).length === PROTOTYPES.length, 'в каталоге не все прототипы');
for (const p of PROTOTYPES) {
  const ids = katalog[p.id].a;
  check(ids.length === ZADACH_NA_TIP, `тип ${p.id}: ${ids.length} задач, а не ${ZADACH_NA_TIP}`);
  const podpisi = new Set();
  for (const id of ids) {
    check(S.etoKlyuch2(id), `ключ ${id} не читается`);
    check(S.prototipKlyucha2(id) === p.id, `ключ ${id}: чужой прототип`);
    const [, seed] = id.split('|');
    const task = generate(p.id, seed);
    podpisi.add(task.signature);
    check(Number.isFinite(task.otvet), `задача ${id}: нет ответа`);
  }
  check(podpisi.size === ids.length, `тип ${p.id}: в каталоге повторяются задачи`);
}

let seed = 2;
const rnd = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};
const vse = PROTOTYPES.map((p) => p.id);
{
  const t = B.buildByTipy(katalog, vse, 10, new Set(), 'vse', rnd);
  check(t.length === 10, `вперемешку: ${t.length} задач, а не 10`);
  check(new Set(t.map((x) => x.id)).size === t.length, 'вперемешку: повтор задачи');
  check(new Set(t.map((x) => x.p)).size === 10, 'вперемешку: тип повторился раньше времени');
  const bezKonca = B.buildByTipy(katalog, vse, 40, new Set(), 'vse', rnd);
  check(bezKonca.length === 40 && new Set(bezKonca.map((x) => x.id)).size === 40, '«Без конца»');
  const tipy = ['A6', 'C2'];
  const pt = B.buildByTipy(katalog, tipy, 20, new Set(), 'vse', rnd);
  check(pt.length === 20 && pt.every((x) => tipy.includes(x.p)), 'по типам: задача чужого типа');
  const closed = new Set(katalog.B5.a.slice(0, 10));
  const nr = B.buildByTipy(katalog, ['B5'], 10, closed, 'vse', rnd);
  check(
    nr.every((x) => !closed.has(x.id)),
    'по типам: решённая задача раньше нерешённых',
  );
}
{
  const id = katalog.B9.a[0];
  const a = B.analogOf(katalog, 'B9', id, new Set(), rnd);
  check(a !== null && a !== id && poZadache.get(a) === 'B9', 'похожая задача: не тот прототип');
}

/* ── 4. Запись тренировки ─────────────────────────────────────── */
{
  const payload = {
    tasks: [
      { id: 'A1|k01', p: 'A1' },
      { id: 'C2|k05', p: 'C2', fixes: 'C2|mx1a2f-9s0t1u2v' },
    ],
    control: false,
    timer: true,
  };
  check(S.isTrenazher2Payload(payload), 'запись тренировки не читается');
  check(S.razobratZapis2(payload) === payload, 'запись нового формата изменена при чтении');
  check(!S.isTrenazher2Payload({ tasks: [], control: false }), 'пустая тренировка принята');
  check(
    !S.isTrenazher2Payload({ tasks: [{ id: 'P01-a01', p: 'P01' }], control: false }),
    'ключ №6 принят в №2',
  );
  check(S.razobratZapis2(null) === null && S.razobratZapis2({}) === null, 'мусор принят');
  /* Прежняя запись №2: { control, tasks: [[ключ, подпись], …] }. */
  for (const control of [false, true]) {
    const prezhnyaya = {
      control,
      tasks: [
        ['A6|mx1a2c-7g8h9i0j', 'podpis1'],
        ['B3|mx1a2g-3w4x5y6z', 'podpis2'],
      ],
    };
    const novaya = S.razobratZapis2(prezhnyaya);
    check(novaya !== null, `прежняя запись (контроль ${control}) не открылась`);
    check(
      novaya?.tasks.length === 2 && novaya.tasks[0].p === 'A6' && novaya.tasks[1].p === 'B3',
      'прежняя запись: задачи не те',
    );
    check(novaya?.control === control, 'прежняя запись: «Контроль» → «Без подсказок»');
    check(S.isTrenazher2Payload(novaya), 'прежняя запись после чтения не проходит проверку');
  }
  check(
    S.razobratZapis2({ control: false, tasks: [['F112', 'x']] }) === null,
    'прежняя запись с чужим ключом принята',
  );
}

/* ── 5. Тексты карты и опорные блоки типов ───────────────────── */
{
  const { TIPY2_OPASNO, GRUPPY2_VID } = requireSrc('content/vektory2.ts');
  const { OPORNYE_TIPA2, tipyBloka2 } = requireSrc('lib/vektory/links.ts');
  const { BLOKI } = requireSrc('lib/vektory/prep/bloki.ts');
  const slugi = new Set(BLOKI.map((b) => b.slug));
  for (const p of PROTOTYPES) {
    check(
      typeof TIPY2_OPASNO[p.id] === 'string' && TIPY2_OPASNO[p.id].length > 20,
      `у типа ${p.id} нет текста «Где теряют балл»`,
    );
    check(slugi.has(OPORNYE_TIPA2[p.id]), `у типа ${p.id} нет блока опорных задач`);
  }
  check(
    ['A', 'B', 'C'].every((g) => GRUPPY2_VID[g] !== undefined),
    'у группы нет оформления',
  );
  for (const b of BLOKI) {
    check(tipyBloka2(b.slug).length > 0, `у блока ${b.slug} нет «Где пригодится»`);
  }
}

if (failures.length > 0) {
  console.error(`\nТренажёр №2: ${failures.length} из ${checks} проверок не прошли:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(
  `Тренажёр №2: ${checks} проверок — перенос прогресса, каталог, тренировки, запись сессии.`,
);
