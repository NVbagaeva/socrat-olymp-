#!/usr/bin/env node
/* scripts/check-progress-1.mjs — тренажёр №1 в «Стеклянной сцене»:
   перенос прежнего прогресса, сборка тренировок, запись сессии.

   Без браузера и без сборки сайта: модули читаются из исходников.
   Логика тренировки общая с №7 и №6 (lib/trening/bank.ts); здесь — то,
   что у №1 своё: ключи задач («p05|b12», «p05|a1500», «p05|nСИД»),
   задачи собирает движок планиметрии, прежняя запись тренировки —
   запись общей панели фильтров.

     1. Перенос прогресса. Файл-образец scripts/fixtures/progress-1-
        prezhniy.json — localStorage ученика, решавшего №1 до редизайна,
        записан НАСТОЯЩИМ прежним кодом: хранилище прогресса
        (lib/progressStore.ts) теми же вызовами recordAttempt, что делала
        карточка задачи прежнего тренажёра (Zadacha1: kind — прототип,
        задача — ключ), опорные задачи — mikroZapisat, незаконченная
        тренировка — perenestiPauzu1 из прежней паузы. Пересобрать:
        node scripts/check-progress-1.mjs --zapisat (только если прежний
        код в git ещё есть). Затем запись сворачивается в журнал тем же
        кодом, что на сайте (migrateLegacyLog): счётчики по прототипам и
        группам, «Мои ошибки», «Работа над ошибками», прежний ключ на
        месте, повторный перенос ничего не меняет.
     2. Ключи: журнал и сессия №1 в списке переноса в аккаунт.
     3. Каталог: все задачи банка и аналоги, ключи читаются, каждая
        задача собирается движком (с ответом и разбором).
     4. Тренировки, «Работа над ошибками», «Похожая задача».
     5. Запись тренировки: новый формат и прежний (панель фильтров), из
        образца — та же тренировка, те же задачи.
     6. Тексты карты: «Где теряют балл» у каждого из 75 типов.

   Запуск: node scripts/check-progress-1.mjs */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireSrc } from './lib/load-ts.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(HERE, 'fixtures', 'progress-1-prezhniy.json');

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

const OLD_KEY = 'budetege:planimetriya-1:v1';
const NEW_KEY = 'budetege:planimetriya-1:log:v1';
const OPORNYE_KEY = 'budetege:planimetriya-1:opornye:v1';
const SESSION_KEY = 'budetege:trainer:1:session';
const PAUZA_KEY = 'budetege:planimetriya-1:trenazher-pauza:v1';

const { PROTOTIPY } = requireSrc('lib/planimetriya/stseny/index.ts');
const { BANK_FIPI } = requireSrc('lib/planimetriya/bank/fipi.ts');
const { katalog1 } = requireSrc('lib/planimetriya/trening/katalog.ts');
const K = requireSrc('lib/planimetriya/trening/klyuch.ts');
const B = requireSrc('lib/trening/bank.ts');
const M = requireSrc('lib/progressLog/model.ts');

const katalog = katalog1();
const poZadache = B.prototipyZadach(katalog);
const prototipOf = (task) => B.prototipZadachi(task, poZadache);
const kp = (id) => `p${String(id).padStart(2, '0')}`;
const gruppaOf = new Map(PROTOTIPY.map((p) => [kp(p.id), p.blok]));

/* ── 0. Образец: записать прежним кодом (--zapisat) ──────────── */

const F = (p, n = 0) => katalog[p].f[n];
const A = (p, n = 0) => katalog[p].a[n];
/* [задача, верно, начисто, секунд] — как писала карточка прежнего тренажёра. */
const PREZHNIE = [
  [F('p01'), true, true, 41],
  [F('p01', 2), true, true, 38],
  [F('p05'), false, false, 120],
  [A('p05', 3), true, false, 95],
  [F('p13'), true, true, 64],
  [F('p24', 1), false, false, 150],
  [A('p37', 0), true, true, 70],
  [F('p45'), false, false, 88],
  [A('p58', 5), true, true, 102],
  [F('p49'), true, false, 130],
];

if (process.argv.includes('--zapisat')) {
  const storage = fakeStorage();
  podstavitStorage(storage);
  const { createProgressStore } = requireSrc('lib/progressStore.ts');
  /* До PR #340 тренажёр писал только счётчики: хранилище без журнала. */
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
  /* Опорные задачи: прежний экран блока (Opornye1Screen → mikroZapisat). */
  const { mikroZapisat } = requireSrc('lib/planimetriya/progress.ts');
  mikroZapisat('P1-1', 1, 'right');
  mikroZapisat('P1-1', 2, 'wrong');
  mikroZapisat('P1-1', 2, 'right');
  mikroZapisat('P1-3', 4, 'revealed');
  /* Незаконченная тренировка: прежняя пауза → запись сессии прежним кодом. */
  storage.setItem(
    PAUZA_KEY,
    JSON.stringify({
      plan: [
        { vid: 'bank', id: 'p10', no: BANK_FIPI.find((z) => z.proto === 10).n },
        { vid: 'analog', id: 'p23', no: Number(A('p23', 2).split('|a')[1]) },
        { vid: 'new', id: 'p33', seed: 'staryy-seed' },
      ],
      podskazki: false,
      index: 1,
      otmetki: ['right'],
      nachato: 1_760_000_000_000,
    }),
  );
  const { perenestiPauzu1 } = requireSrc('lib/planimetriya/trenazher/pauza.ts');
  perenestiPauzu1();
  const dump = storage.dump();
  const out = {
    _chto:
      'localStorage ученика, решавшего №1 до редизайна: счётчики тренажёра (budetege:planimetriya-1:v1, до PR #340), опорные задачи (budetege:planimetriya-1:opornye:v1) и незаконченная тренировка общей панели фильтров (budetege:trainer:1:session). Записано прежним кодом: lib/progressStore.ts теми же вызовами, что делала карточка прежнего тренажёра, mikroZapisat и perenestiPauzu1. Нужен scripts/check-progress-1.mjs и браузерной проверке переноса.',
    [OLD_KEY]: JSON.parse(dump[OLD_KEY]),
    [OPORNYE_KEY]: JSON.parse(dump[OPORNYE_KEY]),
    [SESSION_KEY]: dump[SESSION_KEY],
  };
  fs.writeFileSync(FIXTURE, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`Записано: ${path.relative(process.cwd(), FIXTURE)}`);
  process.exit(0);
}

const obrazec = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));

/* ── 1. Перенос прогресса ─────────────────────────────────────── */
{
  const storage = fakeStorage({ [OLD_KEY]: JSON.stringify(obrazec[OLD_KEY]) });
  podstavitStorage(storage);
  const snimok = storage.getItem(OLD_KEY);
  const staroe = obrazec[OLD_KEY];
  const { migrateLegacyLog, LEGACY_LOGS } = requireSrc('lib/progressLog/index.ts');
  check(LEGACY_LOGS[NEW_KEY] === OLD_KEY, 'журнал №1 не связан с прежним ключом');
  migrateLegacyLog(NEW_KEY);
  const log = M.parseLog(JSON.parse(storage.getItem(NEW_KEY) ?? 'null'));

  const poTipam = M.kindStats(log);
  for (const [kind, tally] of Object.entries(staroe.kinds)) {
    const s = poTipam.get(kind);
    check(
      s !== undefined && s.done === tally.done && s.right === tally.right,
      `перенос: счётчики ${kind} — было ${tally.done}/${tally.right}, стало ${s?.done}/${s?.right}`,
    );
    check(gruppaOf.has(kind), `образец: прототипа ${kind} нет в разделе`);
  }
  check(poTipam.size === Object.keys(staroe.kinds).length, 'перенос: появились лишние типы');

  /* Группы на «О задании» и в тренажёре — блоки I–X. */
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

  const oshibki = M.mistakes(log, prototipOf);
  check(
    oshibki.length === staroe.mistakes.length,
    `перенос: ошибок ${oshibki.length}, а в прежней записи ${staroe.mistakes.length}`,
  );
  for (const m of oshibki) {
    check(poZadache.has(m.task), `перенос: задачи ${m.task} нет в каталоге`);
    check(m.kind === poZadache.get(m.task), `перенос: у ошибки ${m.task} чужой прототип`);
  }
  const rabota = B.buildMistakes(katalog, oshibki, 10);
  check(rabota.length > 0, 'перенос: «Работа над ошибками» из прежних ошибок не собралась');
  check(
    rabota.every((t) => staroe.mistakes.includes(t.fixes) && !staroe.mistakes.includes(t.id)),
    'перенос: в «Работе над ошибками» задача с ошибкой или чужой аналог',
  );

  check(storage.getItem(OLD_KEY) === snimok, 'перенос: прежний ключ изменён или удалён');
  const posle = storage.getItem(NEW_KEY);
  migrateLegacyLog(NEW_KEY);
  check(storage.getItem(NEW_KEY) === posle, 'перенос: повторный запуск изменил журнал');

  /* Журнал, который уже вёл тренажёр после PR #340, — тот же ключ: новый
     тренажёр дописывает в него, прежние записи не теряются. */
  const { createProgressStore } = requireSrc('lib/progressStore.ts');
  const sPr340 = createProgressStore(OLD_KEY, NEW_KEY);
  sPr340.recordAttempt({ kind: 'p02', taskId: F('p02'), right: true, clean: true, seconds: 30 });
  const log2 = M.parseLog(JSON.parse(storage.getItem(NEW_KEY) ?? 'null'));
  check(M.totals(log2).done === M.totals(log).done + 1, 'после #340: запись в журнал потерялась');
  check(
    M.closedTasks(log2).has(F('p02')),
    'после #340: решённая задача не считается решённой в новом тренажёре',
  );
}

for (const [chto, raw] of [
  ['испорченная', '{не json'],
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

/* Опорные задачи: тот же ключ и тот же формат — новый экран читает их. */
{
  const storage = fakeStorage({ [OPORNYE_KEY]: JSON.stringify(obrazec[OPORNYE_KEY]) });
  podstavitStorage(storage);
  const { mikroItog, opornye1 } = requireSrc('lib/planimetriya/progress.ts');
  const p = opornye1.getProgress?.() ?? JSON.parse(storage.getItem(OPORNYE_KEY));
  check(mikroItog(p, 'P1-1', 1) === 'right', 'опорные: решённая задача не видна');
  check(mikroItog(p, 'P1-1', 2) === 'right', 'опорные: исправленная задача не видна');
  check(mikroItog(p, 'P1-3', 4) !== null, 'опорные: открытый разбор не виден');
}

/* ── 2. Ключи ─────────────────────────────────────────────────── */
{
  const { IMPORT_GROUPS, IMPORT_KEY_PATTERN } = requireSrc('lib/progressImport/registry.ts');
  const z1 = IMPORT_GROUPS.find((g) => g.id === 'z1');
  check(z1 !== undefined, 'в списке переноса в аккаунт нет №1');
  check(z1?.keys.includes(NEW_KEY) === true, 'журнал №1 не переносится в аккаунт');
  check(z1?.keys.includes(SESSION_KEY) === true, 'сессия №1 не переносится');
  check(z1?.keys.includes(OLD_KEY) !== true, 'прежний ключ №1 не должен уходить в аккаунт');
  check(
    (z1?.keys ?? []).every((key) => IMPORT_KEY_PATTERN.test(key)),
    'ключ №1 не проходит правило базы',
  );
  const { PROGRESS1_KEY } = requireSrc('lib/planimetriya/trening/progress.ts');
  check(PROGRESS1_KEY === NEW_KEY, 'новый тренажёр пишет не в прежний журнал №1');
}

/* ── 3. Каталог: каждая задача собирается движком ─────────────── */
{
  const { analogi } = requireSrc('lib/planimetriya/bank/analogi.ts');
  const vsegoAnalogov = PROTOTIPY.reduce((n, p) => n + analogi(p.id).length, 0);
  check(Object.keys(katalog).length === 75, `в каталоге ${Object.keys(katalog).length} типов`);
  check(
    poZadache.size === BANK_FIPI.length + vsegoAnalogov,
    `в каталоге ${poZadache.size} задач, а в банке ${BANK_FIPI.length} + ${vsegoAnalogov}`,
  );
  check(BANK_FIPI.length === 214, `в открытом банке ${BANK_FIPI.length} задач, а не 214`);
  for (const p of PROTOTIPY) {
    check(analogi(p.id).length >= 20, `у типа ${kp(p.id)} меньше 20 аналогов`);
  }
  const { sobrat1 } = requireSrc('lib/planimetriya/trening/sborka.ts');
  const { answerMatches } = requireSrc('lib/planimetriya/secret.ts');
  const { razreshit, sostavZadachi } = requireSrc('lib/planimetriya/trenazher/zadacha.ts');
  const { dannyeTrenazhera1 } = requireSrc('lib/planimetriya/trenazher/dannye.ts');
  const bank = dannyeTrenazhera1().bank;
  const { planPoKlyuchu1 } = requireSrc('lib/planimetriya/trenazher/filtry1.ts');
  let sobrano = 0;
  for (const [id, p] of poZadache) {
    check(K.KLYUCH1.test(id), `ключ ${id} не читается`);
    check(K.prototipKlyucha1(id) === p, `задача ${id}: чужой прототип`);
    const s = sobrat1(id);
    if (s === null) {
      check(false, `задача ${id} не собралась`);
      continue;
    }
    sobrano += 1;
    /* Ответ — тот же, что дал бы прежний тренажёр. */
    const otvet = sostavZadachi(razreshit(planPoKlyuchu1(id, ''), bank)).otvet;
    check(answerMatches(String(otvet), s.z.seal), `задача ${id}: отпечаток не того ответа`);
    check(s.z.risunokSvg.includes('<svg'), `задача ${id}: нет чертежа условия`);
    check(s.s.shagi.length > 0 && s.s.voprosy.length > 0, `задача ${id}: нет шагов или вопросов`);
    check(
      s.s.shagi[s.s.shagi.length - 1].risunokSvg === s.s.uchitelSvg,
      `задача ${id}: у последнего шага не чертёж всех построений`,
    );
    check(
      s.s.voprosy.every((v) => v.verno >= 0 && v.verno < v.variantyHtml.length),
      `задача ${id}: верный вариант подсказки вне кнопок`,
    );
    check(!/\$/.test(s.z.text), `задача ${id}: в условии осталась разметка $…$`);
  }
  check(sobrano === poZadache.size, `собрано ${sobrano} задач из ${poZadache.size}`);
}

/* ── 4. Тренировки ────────────────────────────────────────────── */
let seed = 1;
const rnd = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};
const vse = Object.keys(katalog);
{
  const t = B.buildByTipy(katalog, vse, 10, new Set(), 'vse', rnd);
  check(t.length === 10, `вперемешку: ${t.length} задач, а не 10`);
  check(new Set(t.map((x) => x.p)).size === 10, 'вперемешку: тип повторился раньше времени');
  check(
    t.every((x) => poZadache.get(x.id) === x.p),
    'вперемешку: у задачи чужой прототип',
  );
  const b = B.buildByTipy(katalog, ['p01', 'p49'], 20, new Set(), 'fipi', rnd);
  check(
    b.every((x) => /\|b\d+$/.test(x.id)),
    'открытый банк: попал аналог',
  );
  check(b.length === 8, `открытый банк p01+p49: ${b.length} задач, а не 8`);
  const a = B.buildByTipy(katalog, ['p01'], 20, new Set(), 'new', rnd);
  check(
    a.every((x) => /\|a\d+$/.test(x.id)),
    'аналоги: попала задача банка',
  );
  /* Тип не из банка (группа X) в «Открытый банк» даёт аналоги — тип не выпадает молча. */
  const x = B.buildByTipy(katalog, ['p55'], 5, new Set(), 'fipi', rnd);
  check(x.length === 5, 'тип не из банка выпал из тренировки «Открытый банк»');
  const closed = new Set(katalog.p05.a.slice(0, 10));
  const c = B.buildByTipy(katalog, ['p05'], 10, closed, 'new', rnd);
  check(
    c.every((y) => !closed.has(y.id)),
    'решённая задача пришла раньше нерешённых',
  );
  const bk = B.buildByTipy(katalog, vse, 40, new Set(), 'vse', rnd);
  check(new Set(bk.map((y) => y.id)).size === 40, '«Без конца»: повтор задачи');
}
{
  const mistakes = [
    { task: F('p04'), kind: 'p04', at: 2, streak: 0 },
    { task: 'p33|nstaryy-seed', kind: 'p33', at: 1, streak: 0 },
  ];
  const t = B.buildMistakes(katalog, mistakes, 10, rnd);
  check(t.length === 4, `работа над ошибками: ${t.length} задач, а не 4`);
  check(
    t.every((y) => mistakes.some((m) => m.task === y.fixes && m.kind === y.p)),
    'работа над ошибками: аналог не помнит свою ошибку',
  );
  check(
    B.prototipZadachi('p33|nstaryy-seed', poZadache) === 'p33',
    'ошибка в новой задаче прежнего тренажёра: прототип не читается',
  );
  const a = B.analogOf(katalog, 'p09', F('p09'), new Set(), rnd);
  check(a !== null && poZadache.get(a) === 'p09', 'похожая задача: не тот прототип');
}

/* ── 5. Запись тренировки ─────────────────────────────────────── */
{
  const payload = {
    tasks: [
      { id: F('p01'), p: 'p01' },
      { id: A('p13', 4), p: 'p13', fixes: F('p13') },
      { id: 'p33|nstaryy-seed', p: 'p33' },
    ],
    control: false,
    timer: true,
  };
  check(B.isPayloadBanka(payload, K.KLYUCH1), 'запись тренировки №1 не читается');
  check(B.razobratZapis(payload, K.KLYUCH1) === payload, 'запись нового формата изменена');
  check(
    !B.isPayloadBanka({ tasks: [{ id: 'S03', p: 'P04' }], control: false }, K.KLYUCH1),
    'ключ №6 принят в №1',
  );
  check(K.prezhnyayaZapis1(null) === null && K.prezhnyayaZapis1({}) === null, 'мусор принят');
  check(
    K.prezhnyayaZapis1({ v: 1, seed: 's', items: [{ k: 'S03' }], rezhim: 'bez', filtr: '' }) ===
      null,
    'прежняя запись с чужим ключом принята',
  );

  /* Образец: незаконченная тренировка прежнего тренажёра (из паузы). */
  const { decodeSession } = requireSrc('lib/trainerSession/store.ts');
  const stored = decodeSession(obrazec[SESSION_KEY], '1');
  check(stored !== null && stored !== 'version', 'образец: запись сессии не читается');
  if (stored !== null && stored !== 'version') {
    const prezhnyaya = stored.payload;
    const novaya = K.prezhnyayaZapis1(prezhnyaya);
    check(novaya !== null, 'образец: прежняя тренировка не открылась');
    check(novaya?.tasks.length === 3, 'образец: не все задачи прежней тренировки');
    check(novaya?.control === true, 'образец: «без подсказок» не перенёсся');
    check(
      novaya?.tasks[0].id.startsWith('p10|b') &&
        novaya?.tasks[1].id.startsWith('p23|a') &&
        novaya?.tasks[2].id === 'p33|nstaryy-seed',
      `образец: задачи не те — ${novaya?.tasks.map((t) => t.id).join(', ')}`,
    );
    check(B.isPayloadBanka(novaya, K.KLYUCH1), 'образец: после чтения запись не проходит проверку');
    const { sobrat1 } = requireSrc('lib/planimetriya/trening/sborka.ts');
    for (const t of novaya?.tasks ?? []) {
      check(sobrat1(t.id) !== null, `образец: задача ${t.id} не собирается`);
    }
    const ui = stored.ui;
    check(ui.index === 1 && ui.marks?.[0] === 'right', 'образец: номер задачи и отметки не те');
  }
  /* Новая задача без своего seed берёт seed тренировки и место — как прежде. */
  const bezSeed = K.prezhnyayaZapis1({
    v: 1,
    filtr: '',
    rezhim: 'podskazki',
    seed: 'abc',
    items: [{ k: 'p05|b17' }, { k: 'p07|n' }],
  });
  check(bezSeed?.tasks[1].id === 'p07|nabc:1', 'прежняя запись: seed новой задачи не тот');
  check(bezSeed?.control === false, 'прежняя запись: режим с подсказками стал без подсказок');
}

/* ── 6. Тексты карты ──────────────────────────────────────────── */
{
  const { TIPY1_OPASNO, GRUPPY1_TON, FORMULY1 } = requireSrc('content/planimetriya1.ts');
  for (const p of PROTOTIPY) {
    check(
      typeof TIPY1_OPASNO[kp(p.id)] === 'string' && TIPY1_OPASNO[kp(p.id)].length > 20,
      `у типа ${kp(p.id)} нет текста «Где теряют балл»`,
    );
    check(GRUPPY1_TON[p.blok] !== undefined, `у группы ${p.blok} нет оформления`);
  }
  check(
    Object.keys(TIPY1_OPASNO).every((id) => katalog[id] !== undefined),
    'текст «Где теряют балл» у несуществующего типа',
  );
  check(FORMULY1.length > 0, 'нет блока «Что нужно знать»');
  const { primer1 } = requireSrc('lib/planimetriya/trening/primer.ts');
  for (const p of PROTOTIPY) {
    const ex = primer1(kp(p.id));
    check(ex !== null && ex.shagi.length > 0, `у типа ${kp(p.id)} нет разобранного примера`);
    check(
      (ex?.fipi === null) === (p.fipi.length === 0),
      `пример типа ${kp(p.id)}: не задача открытого банка`,
    );
  }
}

if (failures.length > 0) {
  console.error(`\nТренажёр №1: ${failures.length} из ${checks} проверок не прошли:\n`);
  for (const f of failures.slice(0, 40)) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`Тренажёр №1: ${checks} проверок — перенос прогресса, тренировки, запись сессии.`);
