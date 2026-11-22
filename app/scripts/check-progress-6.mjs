#!/usr/bin/env node
/* scripts/check-progress-6.mjs — тренажёр №6 в «Стеклянной сцене»:
   перенос прежнего прогресса, сборка тренировок, запись сессии.

   Без браузера и без сборки сайта: модули читаются из исходников.
   Логика тренировки общая с №7 (lib/trening/bank.ts); здесь — то, что
   у №6 своё: ключи задач (S…, D…, P…-a…), источники, переключатель
   формулировки и прежние записи тренажёра №6.

     1. Перенос прогресса. Прежнее хранилище (ключ budetege:zadanie-6:v1,
        lib/progressStore.ts) наполняется НАСТОЯЩИМ прежним кодом — теми
        же вызовами recordAttempt, что делал экран задачи до редизайна
        (Reshenie6: kind — прототип задачи). Затем запись сворачивается
        в журнал тем же кодом, что работает на сайте (migrateLegacyLog):
        счётчики по прототипам и группам, «Мои ошибки», прежний ключ на
        месте, повторный перенос ничего не меняет, испорченные записи не
        ломают журнал. Отдельно — файл-образец
        (scripts/fixtures/progress-6-prezhniy.json).
     2. Ключи: журнал №6 в списке переноса в аккаунт и в списке прежних.
     3. Каталог и тренировка по типам, источнику и формулировке.
     4. «Работа над ошибками» и «Похожая задача».
     5. Запись тренировки: новый формат и прежний ({ zadachi, rezhim }),
        режим «Проверка» → «Без подсказок и решений».
     6. Тексты карты: «Где теряют балл» у каждого типа.

   Запуск: node scripts/check-progress-6.mjs */

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

const OLD_KEY = 'budetege:zadanie-6:v1';
const NEW_KEY = 'budetege:zadanie-6:log:v1';

const { PROTOTYPES, GROUPS, prototypesOfGroup } = requireSrc('lib/zadanie6/prototypes/index.ts');
const { zadachiPrototipa, BANK } = requireSrc('lib/zadanie6/bank/index.ts');
const B = requireSrc('lib/trening/bank.ts');
const S = requireSrc('lib/zadanie6/trening/session.ts');
const M = requireSrc('lib/progressLog/model.ts');

/* Каталог — как на сервере (Trenazher6Tab): f — исходные, a — аналоги,
   s — сюжетные среди всех. */
const katalog = Object.fromEntries(
  PROTOTYPES.map((p) => {
    const { istochniki, analogi } = zadachiPrototipa(p.id);
    return [
      p.id,
      {
        f: istochniki.map((z) => z.id),
        a: analogi.map((z) => z.id),
        s: [...istochniki, ...analogi].filter((z) => z.stil === 'syuzhet').map((z) => z.id),
      },
    ];
  }),
);
const poZadache = B.prototipyZadach(katalog);
const prototipOf = (task) => B.prototipZadachi(task, poZadache);
const gruppaOf = new Map(GROUPS.flatMap((g) => prototypesOfGroup(g.id).map((p) => [p.id, g.id])));

/* ── 1. Перенос прогресса ─────────────────────────────────────── */

const F = (p, n = 0) => katalog[p].f[n];
const A = (p, n = 0) => katalog[p].a[n];
/* [задача, верно, начисто, секунд] — как писал прежний экран №6. */
const PREZHNIE = [
  [F('P01'), true, true, 52] /* верно с первого раза */,
  [F('P04', 3), true, true, 61] /* демоверсия ФИПИ (D01) */,
  [F('P04', 1), true, false, 140] /* верно после ошибки */,
  [A('P10'), false, false, 95] /* открыл разбор, не решив */,
  [A('P13', 4), true, false, 210] /* верно с подсказкой */,
  [F('P11', 1), false, false, 77],
  [A('P15', 9), true, true, 88],
];
check(
  F('P04', 3) === 'D01',
  'образец: демоверсия больше не четвёртая задача П-04 — обновить проверку',
);

{
  const storage = fakeStorage();
  podstavitStorage(storage);
  const { createProgressStore } = requireSrc('lib/progressStore.ts');
  const prezhnee = createProgressStore(OLD_KEY);
  for (const [taskId, right, clean, seconds] of PREZHNIE) {
    prezhnee.recordAttempt({ kind: poZadache.get(taskId), taskId, right, clean, seconds });
  }
  const snimok = storage.getItem(OLD_KEY);
  check(snimok !== null, 'прежний код не записал хранилище');
  const staroe = JSON.parse(snimok);

  const { migrateLegacyLog, LEGACY_LOGS } = requireSrc('lib/progressLog/index.ts');
  check(LEGACY_LOGS[NEW_KEY] === OLD_KEY, 'журнал №6 не связан с прежним ключом');
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
  check(vsego.done === PREZHNIE.length, `перенос: всего решено ${vsego.done}`);
  check(vsego.right === PREZHNIE.filter((p) => p[1]).length, 'перенос: число верных не сошлось');

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

  storage.setItem(
    OLD_KEY,
    JSON.stringify({ kinds: { P02: { done: 9, right: 9, seconds: 9 } }, mistakes: [] }),
  );
  migrateLegacyLog(NEW_KEY);
  check(storage.getItem(NEW_KEY) === posle, 'перенос: журнал затёрт прежним ключом');
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

/* Файл-образец: localStorage ученика, решавшего №6 до редизайна. */
{
  const obrazec = JSON.parse(
    fs.readFileSync(path.join(HERE, 'fixtures', 'progress-6-prezhniy.json'), 'utf8'),
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
  const oshibki = M.mistakes(log, prototipOf);
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
  const z6 = IMPORT_GROUPS.find((g) => g.id === 'z6');
  check(z6 !== undefined, 'в списке переноса в аккаунт нет №6');
  check(z6?.keys.includes(NEW_KEY) === true, 'журнал №6 не переносится в аккаунт');
  check(z6?.keys.includes('budetege:trainer:6:session') === true, 'сессия №6 не переносится');
  check(z6?.keys.includes(OLD_KEY) !== true, 'прежний ключ №6 не должен уходить в аккаунт');
  check(
    (z6?.keys ?? []).every((key) => IMPORT_KEY_PATTERN.test(key)),
    'ключ №6 не проходит правило базы',
  );
}

/* ── 3. Каталог и тренировка ──────────────────────────────────── */
check(Object.keys(katalog).length === PROTOTYPES.length, 'в каталоге не все прототипы');
check(poZadache.size === BANK.length, `в каталоге ${poZadache.size} задач, в банке ${BANK.length}`);
for (const z of BANK) {
  check(S.etoKlyuch6(z.id), `ключ ${z.id} не читается`);
  check(poZadache.get(z.id) === z.prototypeId, `задача ${z.id}: чужой прототип в каталоге`);
}

let seed = 6;
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
  check(
    t.every((x) => poZadache.get(x.id) === x.p),
    'вперемешку: у задачи чужой прототип',
  );
}
{
  const tipy = ['P04', 'P11'];
  const t = B.buildByTipy(katalog, tipy, 20, new Set(), 'fipi', rnd);
  check(
    t.every((x) => tipy.includes(x.p)),
    'по типам: задача чужого типа',
  );
  check(
    t.every((x) => /^[SD]\d\d$/.test(x.id)),
    'по типам, исходные: попал аналог',
  );
  check(t.length === 6, `по типам, исходные: ${t.length} задач, а не 6 (4 + 2)`);
  const n = B.buildByTipy(katalog, tipy, 20, new Set(), 'new', rnd);
  check(
    n.every((x) => /^P\d\d-a\d\d$/.test(x.id)),
    'по типам, сгенерированные: попала исходная',
  );
}
{
  /* Формулировка: сюжетные — только из списка s, стандартные — без него. */
  const syuzhet = new Set(Object.values(katalog).flatMap((k) => k.s));
  const s = B.buildByTipy(katalog, vse, 30, new Set(), 'vse', rnd, 'syuzhet');
  check(s.length === 30, `сюжетные: ${s.length} задач, а не 30`);
  check(
    s.every((x) => syuzhet.has(x.id)),
    'сюжетные: попала стандартная задача',
  );
  const st = B.buildByTipy(katalog, vse, 30, new Set(), 'vse', rnd, 'standart');
  check(
    st.every((x) => !syuzhet.has(x.id)),
    'стандартные: попала сюжетная задача',
  );
  check(
    B.skolkoZadach(katalog, ['P01'], 'vse', 'syuzhet') === katalog.P01.s.length,
    'сюжетные: счёт задач',
  );
  check(
    B.skolkoZadach(katalog, ['P01'], 'vse', 'vse') === katalog.P01.f.length + katalog.P01.a.length,
    'все: счёт задач',
  );
}
{
  const closed = new Set(katalog.P04.a.slice(0, 10));
  const t = B.buildByTipy(katalog, ['P04'], 10, closed, 'new', rnd);
  check(
    t.every((x) => !closed.has(x.id)),
    'по типам: решённая задача пришла раньше нерешённых',
  );
}
{
  const bezKonca = B.buildByTipy(katalog, vse, 40, new Set(), 'vse', rnd);
  check(bezKonca.length === 40, `«Без конца»: ${bezKonca.length} задач, а не 40`);
  check(new Set(bezKonca.map((x) => x.id)).size === 40, '«Без конца»: повтор задачи');
}

/* ── 4. «Работа над ошибками» и «Похожая задача» ─────────────── */
{
  const mistakes = [
    { task: katalog.P04.f[0], kind: 'P04', at: 2, streak: 0 },
    { task: katalog.P12.a[3], kind: 'P12', at: 1, streak: 0 },
  ];
  const t = B.buildMistakes(katalog, mistakes, 10, rnd);
  check(t.length === 4, `работа над ошибками: ${t.length} задач, а не 4`);
  check(
    t.every((x) => mistakes.some((m) => m.task === x.fixes && m.kind === x.p)),
    'работа над ошибками: аналог не помнит свою ошибку',
  );
  check(
    t.every((x) => !mistakes.some((m) => m.task === x.id)),
    'работа над ошибками: выдана та же задача',
  );
}
{
  const id = katalog.P09.f[0];
  const a = B.analogOf(katalog, 'P09', id, new Set(), rnd);
  check(a !== null && a !== id && poZadache.get(a) === 'P09', 'похожая задача: не тот прототип');
  const zanyato = new Set([...katalog.P09.f, ...katalog.P09.a]);
  check(B.analogOf(katalog, 'P09', id, zanyato, rnd) === null, 'похожая задача: когда задач нет');
}

/* ── 5. Запись тренировки ─────────────────────────────────────── */
{
  const payload = {
    tasks: [
      { id: 'D01', p: 'P04' },
      { id: 'P13-a03', p: 'P13', fixes: 'S17' },
    ],
    control: true,
    timer: false,
  };
  check(S.isTrenazher6Payload(payload), 'запись тренировки не читается');
  check(S.razobratZapis6(payload) === payload, 'запись нового формата изменена при чтении');
  check(!S.isTrenazher6Payload({ tasks: [], control: false }), 'пустая тренировка принята');
  check(
    !S.isTrenazher6Payload({ tasks: [{ id: 'F001', p: 'P01' }], control: false }),
    'ключ №7 принят в №6',
  );
  check(S.razobratZapis6(null) === null && S.razobratZapis6({}) === null, 'мусор принят');

  /* Прежняя запись №6: задачи целиком (ZadachaLite) и режим. */
  const z = BANK.find((b) => b.id === 'S08');
  const lite = (item, seal) => ({
    id: item.id,
    prototypeId: item.prototypeId,
    source: item.source,
    stil: item.stil,
    text: item.text,
    ...(item.posle === undefined ? {} : { posle: item.posle }),
    params: item.params,
    seal,
  });
  const analog = BANK.find((b) => b.id === 'P11-a07');
  for (const [rezhim, control] of [
    [undefined, false],
    ['trenirovka', false],
    ['proverka', true],
  ]) {
    const prezhnyaya = {
      zadachi: [lite(z, 'x'), lite(analog, 'y')],
      ...(rezhim === undefined ? {} : { rezhim }),
    };
    const novaya = S.razobratZapis6(prezhnyaya);
    check(novaya !== null, `прежняя запись (${rezhim ?? 'без режима'}) не открылась`);
    check(
      novaya?.tasks.length === 2 &&
        novaya.tasks[0].id === 'S08' &&
        novaya.tasks[0].p === 'P05' &&
        novaya.tasks[1].p === 'P11',
      'прежняя запись: задачи не те',
    );
    check(
      novaya?.control === control,
      `прежняя запись: режим ${rezhim ?? '—'} → «без подсказок» ${novaya?.control}`,
    );
    check(S.isTrenazher6Payload(novaya), 'прежняя запись после чтения не проходит проверку');
  }
  check(
    S.razobratZapis6({ zadachi: [{ id: 'F112', prototypeId: 'P01' }] }) === null,
    'прежняя запись с чужим ключом принята',
  );
}

/* ── 6. Тексты карты ──────────────────────────────────────────── */
{
  const { TIPY6_OPASNO, GRUPPY6_VID, FORMULY6 } = requireSrc('content/sluchainye6.ts');
  for (const p of PROTOTYPES) {
    check(
      typeof TIPY6_OPASNO[p.id] === 'string' && TIPY6_OPASNO[p.id].length > 20,
      `у типа ${p.id} нет текста «Где теряют балл»`,
    );
  }
  check(
    Object.keys(TIPY6_OPASNO).every((id) => katalog[id] !== undefined),
    'текст «Где теряют балл» у несуществующего типа',
  );
  check(
    GROUPS.every((g) => GRUPPY6_VID[g.id] !== undefined),
    'у группы нет оформления',
  );
  check(FORMULY6.length > 0, 'нет блока «Что нужно знать»');
}

if (failures.length > 0) {
  console.error(`\nТренажёр №6: ${failures.length} из ${checks} проверок не прошли:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`Тренажёр №6: ${checks} проверок — перенос прогресса, тренировки, запись сессии.`);
