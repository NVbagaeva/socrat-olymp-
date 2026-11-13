#!/usr/bin/env node
/* scripts/check-progress-9.mjs — тренажёр №9 в «Стеклянной сцене»:
   перенос прежнего прогресса, каталог, сборка тренировок, запись сессии.

   Без браузера и без сборки сайта: модули читаются из исходников.
   Логика тренировки общая с №7, №6, №2 (lib/trening/bank.ts); здесь —
   то, что у №9 своё: ключи задач «прототип|seed», каталог из банка
   зафиксированных вариантов, прежние записи тренажёра №9.

     1. Перенос прогресса. Прежнее хранилище (ключ budetege:proizvodnaya-9:v1,
        lib/progressStore.ts) наполняется НАСТОЯЩИМ прежним кодом — теми
        же вызовами recordAttempt, что делал прежний экран задачи
        (kind — прототип, задача — «прототип|seed»). Затем запись
        сворачивается в журнал тем же кодом, что на сайте
        (migrateLegacyLog): счётчики по прототипам и группам, «Мои
        ошибки», прежний ключ на месте, повтор ничего не меняет,
        испорченные записи не ломают журнал. Отдельно — файл-образец
        scripts/fixtures/progress-9-prezhniy.json (записан кодом main
        до редизайна).
     2. Ключи: журнал, сессия и опорные №9 — в списке переноса в аккаунт.
     3. Каталог: все 610 задач банка собираются генератором, ответ
        сверяется с отпечатком; тренировка по типам.
     4. «Работа над ошибками» и «Похожая задача».
     5. Запись тренировки: новый формат и прежняя незаконченная
        тренировка из sessionStorage («Контроль» → «Без подсказок»).
     6. Опорные задачи: прежний прогресс блоков.
     7. Тексты карты и примеры типов.

   Запуск: node scripts/check-progress-9.mjs */

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

const OLD_KEY = 'budetege:proizvodnaya-9:v1';
const NEW_KEY = 'budetege:proizvodnaya-9:log:v1';
const PREP_KEY = 'budetege:proizvodnaya-9:prep:v1';

const obrazec = JSON.parse(
  fs.readFileSync(path.join(HERE, 'fixtures', 'progress-9-prezhniy.json'), 'utf8'),
);

const { PROTOTYPES } = requireSrc('lib/proizvodnaya/prototypes/index.ts');
const { GRUPPY, prototypesOfGroup } = requireSrc('lib/proizvodnaya/skills.ts');
const { BANK } = requireSrc('lib/proizvodnaya/bank.ts');
const { generate } = requireSrc('lib/proizvodnaya/generate.ts');
const { sealAnswer } = requireSrc('lib/proizvodnaya/secret.ts');
const B = requireSrc('lib/trening/bank.ts');
const S = requireSrc('lib/proizvodnaya/trening/session.ts');
const { katalog9 } = requireSrc('lib/proizvodnaya/trening/katalog.ts');
const { readSealed9 } = requireSrc('lib/proizvodnaya/trening/otvet9.ts');
const M = requireSrc('lib/progressLog/model.ts');

const katalog = katalog9();
const poZadache = B.prototipyZadach(katalog);
const prototipOf = (task) => B.prototipZadachi(task, poZadache);
const gruppaOf = new Map(GRUPPY.flatMap((g) => prototypesOfGroup(g.id).map((p) => [p.id, g.id])));
const A = (p, n = 0) => katalog[p].a[n];

/* ── 1. Перенос прогресса ─────────────────────────────────────── */

/* [задача, верно, начисто, секунд] — как писал прежний экран №9. */
const PREZHNIE = [
  [A('9.1.1'), true, true, 52] /* верно с первого раза */,
  [A('9.2.1', 3), true, false, 140] /* верно после ошибки */,
  [A('9.3.4', 7), false, false, 95] /* открыл решение, не решив */,
  [A('9.4.9', 2), true, false, 210] /* верно с подсказкой */,
  [A('9.5.3', 11), true, true, 88],
  [A('9.2.7', 5), false, false, 77],
];

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
  check(LEGACY_LOGS[NEW_KEY] === OLD_KEY, 'журнал №9 не связан с прежним ключом');
  const { PROGRESS9_KEY } = requireSrc('lib/proizvodnaya/trening/progress.ts');
  check(PROGRESS9_KEY === NEW_KEY, 'тренажёр №9 пишет не в тот журнал, что прежний');
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
  for (const g of GRUPPY) {
    const zhdem = Object.entries(staroe.kinds)
      .filter(([k]) => gruppaOf.get(k) === g.id)
      .reduce((s, [, t]) => s + t.done, 0);
    check(
      (poGruppam.get(g.id)?.done ?? 0) === zhdem,
      `перенос: группа ${g.id} — ждали ${zhdem}, получили ${poGruppam.get(g.id)?.done ?? 0}`,
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

/* Файл-образец: хранилище ученика, решавшего №9 до редизайна. */
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
    check(gruppaOf.has(kind), `образец: прототипа ${kind} нет в генераторе`);
  }
  const oshibki = M.mistakes(log, prototipOf);
  check(
    oshibki.length === obrazec[OLD_KEY].mistakes.length,
    `образец: ошибок ${oshibki.length}, а в прежней записи ${obrazec[OLD_KEY].mistakes.length}`,
  );
  for (const m of oshibki) {
    check(poZadache.has(m.task), `образец: задачи ${m.task} нет в каталоге`);
    check(m.kind === poZadache.get(m.task), `образец: у ошибки ${m.task} чужой прототип`);
  }
}

/* ── 2. Ключи ─────────────────────────────────────────────────── */
{
  const { IMPORT_GROUPS, IMPORT_KEY_PATTERN } = requireSrc('lib/progressImport/registry.ts');
  const z9 = IMPORT_GROUPS.find((g) => g.id === 'z9');
  check(z9 !== undefined, 'в списке переноса в аккаунт нет №9');
  check(z9?.keys.includes(NEW_KEY) === true, 'журнал №9 не переносится в аккаунт');
  check(z9?.keys.includes('budetege:trainer:9:session') === true, 'сессия №9 не переносится');
  check(z9?.keys.includes(PREP_KEY) === true, 'опорные №9 не переносятся');
  check(z9?.keys.includes(OLD_KEY) !== true, 'прежний ключ №9 не должен уходить в аккаунт');
  check(
    (z9?.keys ?? []).every((key) => IMPORT_KEY_PATTERN.test(key)),
    'ключ №9 не проходит правило базы',
  );
}

/* ── 3. Каталог и тренировка ──────────────────────────────────── */
check(Object.keys(katalog).length === PROTOTYPES.length, 'в каталоге не все прототипы');
const vBanke = BANK.reduce((s, e) => s + e.variants.length, 0);
check(poZadache.size === vBanke, `в каталоге ${poZadache.size} задач, в банке ${vBanke}`);
for (const [p, { f, a }] of Object.entries(katalog)) {
  check(f.length === 0, `${p}: у №9 нет задач открытого банка`);
  for (const id of a) {
    check(S.KLYUCH9.test(id), `ключ ${id} не читается`);
    check(S.prototipKlyucha9(id) === p, `ключ ${id}: чужой прототип`);
    let task = null;
    try {
      task = generate(p, id.slice(p.length + 1));
    } catch {
      task = null;
    }
    check(task !== null, `задача ${id} не собирается генератором`);
    if (task !== null) {
      const zapis = String(task.otvet).replace('.', ',');
      const r = readSealed9(zapis, sealAnswer(task.otvet));
      check(r.kind === 'answer' && r.right, `задача ${id}: верный ответ ${zapis} не засчитан`);
    }
  }
}

let seed = 9;
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
  const bezKonca = B.buildByTipy(katalog, vse, 40, new Set(), 'vse', rnd);
  check(bezKonca.length === 40, `«Без конца»: ${bezKonca.length} задач, а не 40`);
  check(new Set(bezKonca.map((x) => x.id)).size === 40, '«Без конца»: повтор задачи');
  const closed = new Set(katalog['9.4.1'].a.slice(0, 10));
  const r = B.buildByTipy(katalog, ['9.4.1'], 10, closed, 'vse', rnd);
  check(
    r.every((x) => !closed.has(x.id)),
    'по типам: решённая задача пришла раньше нерешённых',
  );
  check(
    B.skolkoZadach(katalog, ['9.1.1', '9.5.6'], 'vse') === 40,
    'счёт задач у двух типов — не 40',
  );
}

/* ── 4. «Работа над ошибками» и «Похожая задача» ─────────────── */
{
  const mistakes = [
    { task: A('9.2.1', 1), kind: '9.2.1', at: 2, streak: 0 },
    /* Ошибка прежних лет: задача со случайным seed, которой нет в банке. */
    { task: '9.4.10|lx2abc-9fk3', kind: '9.4.10', at: 1, streak: 0 },
  ];
  const t = B.buildMistakes(katalog, mistakes, 10, rnd);
  check(t.length === 4, `работа над ошибками: ${t.length} задач, а не 4`);
  check(
    t.every((x) => mistakes.some((m) => m.task === x.fixes && m.kind === x.p)),
    'работа над ошибками: аналог не помнит свою ошибку',
  );
  check(
    prototipOf('9.4.10|lx2abc-9fk3') === '9.4.10',
    'ключ прежнего тренажёра со случайным seed: прототип не читается',
  );
  const id = A('9.3.6', 4);
  const a = B.analogOf(katalog, '9.3.6', id, new Set(), rnd);
  check(a !== null && a !== id && poZadache.get(a) === '9.3.6', 'похожая задача: не тот прототип');
}

/* ── 5. Запись тренировки ─────────────────────────────────────── */
{
  const payload = {
    tasks: [
      { id: A('9.2.1'), p: '9.2.1' },
      { id: A('9.5.5', 2), p: '9.5.5', fixes: A('9.5.5', 1) },
    ],
    control: true,
    timer: false,
  };
  check(S.isTrenazher9Payload(payload), 'запись тренировки не читается');
  check(S.razobratZapis9(payload) === payload, 'запись нового формата изменена при чтении');
  check(!S.isTrenazher9Payload({ tasks: [], control: false }), 'пустая тренировка принята');
  check(
    !S.isTrenazher9Payload({ tasks: [{ id: 'A6|k07', p: 'A6' }], control: false }),
    'ключ №2 принят в №9',
  );
  check(S.razobratZapis9(null) === null && S.razobratZapis9({}) === null, 'мусор принят');

  const prezhnyaya = obrazec.sessionStorage[S.PREZHNYAYA_SESSIYA9_KEY];
  const perenos = S.prezhnyayaSessiya9(JSON.stringify(prezhnyaya));
  check(perenos !== null, 'образец: прежняя незаконченная тренировка не читается');
  if (perenos !== null) {
    check(
      perenos.payload.tasks.map((t) => t.id).join() === prezhnyaya.taskIds.join(),
      'образец: задачи прежней тренировки не те',
    );
    check(
      perenos.payload.tasks.every((t) => t.p === S.prototipKlyucha9(t.id)),
      'образец: у задачи прежней тренировки чужой прототип',
    );
    check(perenos.payload.control === true, 'образец: «Контроль» не стал «Без подсказок»');
    check(S.isTrenazher9Payload(perenos.payload), 'образец: перенесённая запись не проходит');
    check(perenos.ui.index === 1, 'образец: тренировка открылась не на той задаче');
    check(perenos.ui.marks[0] === 'right', 'образец: решённая задача потеряла отметку');
    check(perenos.ui.tried[1] === true, 'образец: ошибка в текущей задаче потеряна');
    check(
      perenos.ui.value === '3' && perenos.ui.checked === 'wrong' && perenos.ui.failed === true,
      'образец: ответ текущей задачи потерян',
    );
    check(perenos.activeMs === 95000, `образец: время ${perenos.activeMs} мс, а не 95 000`);
    const { readUiBanka } = requireSrc('components/tasks/trening/bank/ui.ts');
    const ui = readUiBanka(perenos.ui);
    check(
      ui.index === 1 && ui.value === '3' && ui.shag === 1,
      'образец: экран не читает состояние',
    );
  }
  check(
    S.prezhnyayaSessiya9(JSON.stringify({ ...prezhnyaya, mode: 'practice' })) !== null,
    'прежняя запись в режиме тренировки не читается',
  );
  check(
    S.prezhnyayaSessiya9(
      JSON.stringify({ ...prezhnyaya, settings: { ...prezhnyaya.settings, mode: 'mixed' } }),
    )?.payload.control === false,
    'прежний режим «Смешанная» стал «Без подсказок»',
  );
  for (const musor of [
    null,
    '{',
    '[]',
    JSON.stringify({ v: 2 }),
    JSON.stringify({ ...prezhnyaya, taskIds: ['F001'] }),
  ]) {
    check(
      S.prezhnyayaSessiya9(musor) === null,
      `прежняя запись: мусор принят (${String(musor).slice(0, 20)})`,
    );
  }
}

/* ── 6. Опорные задачи ────────────────────────────────────────── */
{
  const { PREP_BLOCKS } = requireSrc('lib/proizvodnaya/prep/blocks.ts');
  const { NAVYKI9, TIPY_BLOKA9 } = requireSrc('content/proizvodnaya9.ts');
  const slugi = NAVYKI9.flatMap((n) => n.bloki.map((b) => b.slug));
  check(
    slugi.length === PREP_BLOCKS.length && PREP_BLOCKS.every((b) => slugi.includes(b.slug)),
    'опорные: не все блоки в навыках',
  );
  const progress = obrazec[PREP_KEY];
  for (const [blok, nomera] of Object.entries(progress)) {
    const b = PREP_BLOCKS.find((x) => x.id === blok);
    check(b !== undefined, `образец: блока ${blok} нет`);
    check(
      nomera.every((n) => n >= 1 && n <= (b?.zadachi.length ?? 0)),
      `образец: номер вне блока ${blok}`,
    );
  }
  for (const [slug, tipy] of Object.entries(TIPY_BLOKA9)) {
    check(slugi.includes(slug), `«Где пригодится»: нет блока ${slug}`);
    check(
      tipy.every((id) => katalog[id] !== undefined),
      `«Где пригодится» блока ${slug}: несуществующий тип`,
    );
  }
  for (const p of PROTOTYPES) {
    check(
      Object.values(TIPY_BLOKA9).some((tipy) => tipy.includes(p.id)),
      `тип ${p.id}: нет блока опорных задач («Опорные задачи» на карте ведёт на список)`,
    );
  }
}

/* ── 7. Тексты карты и примеры ────────────────────────────────── */
{
  const { TIPY9_OPASNO, GRUPPY9_VID, ZNAT9 } = requireSrc('content/proizvodnaya9.ts');
  for (const p of PROTOTYPES) {
    check(
      typeof TIPY9_OPASNO[p.id] === 'string' && TIPY9_OPASNO[p.id].length > 20,
      `у типа ${p.id} нет текста «Где теряют балл»`,
    );
  }
  check(
    Object.keys(TIPY9_OPASNO).every((id) => katalog[id] !== undefined),
    'текст «Где теряют балл» у несуществующего типа',
  );
  check(
    GRUPPY.every((g) => GRUPPY9_VID[g.id] !== undefined),
    'у группы нет оформления',
  );
  check(ZNAT9.length === 5, 'в «Что нужно знать» не пять рамок');

  const { primer9 } = requireSrc('components/tasks/proizvodnaya/primer9.ts');
  for (const p of PROTOTYPES) {
    let pr = null;
    try {
      pr = primer9(p.id);
    } catch {
      pr = null;
    }
    check(pr !== null, `пример типа ${p.id} не собирается`);
    if (pr === null) continue;
    check(pr.shagi.length > 0 && pr.otvet !== '', `пример типа ${p.id}: нет шагов или ответа`);
    check(
      pr.chertezhi.length > 0 === p.risunok,
      `пример типа ${p.id}: чертёж ${pr.chertezhi.length > 0 ? 'есть' : 'нет'}, а в прототипе — наоборот`,
    );
    if (p.risunok) {
      check(
        pr.chertezhi[0].vid === 'uslovie' && pr.chertezhi.at(-1).vid === 'vse',
        `пример типа ${p.id}: виды чертежа не «условие … все построения»`,
      );
    }
    check(
      !/\b9\.[1-5]\.\d/.test(JSON.stringify(pr.shagi)),
      `пример типа ${p.id}: код прототипа в тексте`,
    );
  }
}

if (failures.length > 0) {
  console.error(`\nТренажёр №9: ${failures.length} из ${checks} проверок не прошли:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(
  `Тренажёр №9: ${checks} проверок — перенос прогресса, каталог, тренировки, запись сессии, опорные, карта.`,
);
