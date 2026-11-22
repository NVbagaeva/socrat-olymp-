#!/usr/bin/env node
/* scripts/check-progress-10.mjs — тренажёр и опорные №10 в «Стеклянной
   сцене»: прежний прогресс читается, тренировки собираются, запись
   сессии и ответа — по общим правилам.

   Без браузера и без сборки сайта: модули читаются из исходников.
   Логика тренировки общая с №7 и №6 (lib/trening/bank.ts); здесь — то,
   что у №10 своё: ключи задач (F…, P…-a…), прототипы из курса без задач
   ФИПИ, прежние записи тренажёра и опорных задач №10.

     1. Прежний прогресс. Образец scripts/fixtures/progress-10-prezhniy.json
        записан ПРЕЖНИМ кодом №10 (до редизайна): журнал — теми же вызовами
        log10.record, что делал прежний экран задачи, опорные — в форме
        прежнего экрана { задача: верно ли }, незаконченная тренировка —
        прежним lib/zadanie10/trenazher.ts (sessionStorage). Новый код
        читает журнал по тому же ключу: счётчики по типам и группам,
        «Мои ошибки», «Работа над ошибками»; запись не меняется при
        чтении. Опорные: те же исходы, новая запись — в той же форме,
        прежние исходы на месте. Прежняя тренировка из sessionStorage
        за новую не принимается (она жила до закрытия вкладки).
     2. Ключи: журнал и сессия №10 — в списке переноса в аккаунт.
     3. Каталог и тренировка по типам и источнику.
     4. «Работа над ошибками» и «Похожая задача».
     5. Запись тренировки.
     6. Запись ответа: обыкновенная дробь с верным значением — подсказка.
     7. Тексты карты: «Где теряют балл» у каждого типа.

   Запуск: node scripts/check-progress-10.mjs */

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
function podstavitStorage(storage, session = fakeStorage()) {
  globalThis.window = {
    localStorage: storage,
    sessionStorage: session,
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {},
  };
  globalThis.localStorage = storage;
}

const LOG_KEY = 'budetege:zadanie-10:log:v1';
const OPORNYE_KEY = 'budetege:zadanie-10:opornye:v1';
const SESSIYA_PREZHNYAYA = 'budetege:zadanie-10:trenazher:v1';

const obrazec = JSON.parse(
  fs.readFileSync(path.join(HERE, 'fixtures', 'progress-10-prezhniy.json'), 'utf8'),
);

podstavitStorage(fakeStorage());
const { PROTOTYPES, GROUPS, prototypesOfGroup } = requireSrc('lib/zadanie10/prototypes/index.ts');
const { zadachiPrototipa, BANK } = requireSrc('lib/zadanie10/bank/index.ts');
const B = requireSrc('lib/trening/bank.ts');
const S = requireSrc('lib/zadanie10/trening/session.ts');
const M = requireSrc('lib/progressLog/model.ts');

/* Каталог — как на сервере (Trenazher10Tab): f — ФИПИ, a — аналоги. */
const katalog = Object.fromEntries(
  PROTOTYPES.map((p) => {
    const { fipi, analogi } = zadachiPrototipa(p.id);
    return [p.id, { f: fipi.map((z) => z.id), a: analogi.map((z) => z.id) }];
  }),
);
const poZadache = B.prototipyZadach(katalog);
const prototipOf = (task) => B.prototipZadachi(task, poZadache);
const gruppaOf = new Map(GROUPS.flatMap((g) => prototypesOfGroup(g.id).map((p) => [p.id, g.id])));

/* ── 1. Прежний прогресс ──────────────────────────────────────── */
const prezhniyLog = obrazec.localStorage[LOG_KEY];
check(Array.isArray(prezhniyLog?.attempts), 'образец: нет журнала №10');
{
  const raw = JSON.stringify(prezhniyLog);
  const storage = fakeStorage({ [LOG_KEY]: raw });
  podstavitStorage(storage);
  const { LEGACY_LOGS, migrateLegacyLog } = requireSrc('lib/progressLog/index.ts');
  check(
    LEGACY_LOGS[LOG_KEY] === undefined,
    'журнал №10 и прежде был журналом: сворачивать в него нечего',
  );
  migrateLegacyLog(LOG_KEY);
  const { log10, PROGRESS10_KEY } = requireSrc('lib/zadanie10/trening/progress.ts');
  check(PROGRESS10_KEY === LOG_KEY, 'тренажёр №10 пишет в другой журнал');
  const log = log10.get();
  check(storage.getItem(LOG_KEY) === raw, 'чтение журнала изменило запись');
  check(log.attempts.length === prezhniyLog.attempts.length, 'попытки из журнала потерялись');

  /* Ожидание — прямо из записей образца. */
  const ozhidaem = new Map();
  for (const a of prezhniyLog.attempts) {
    check(poZadache.get(a.task) === a.kind, `образец: задача ${a.task} не из прототипа ${a.kind}`);
    const row = ozhidaem.get(a.kind) ?? { done: 0, right: 0 };
    row.done += 1;
    row.right += a.outcome === 'right' ? 1 : 0;
    ozhidaem.set(a.kind, row);
  }
  const poTipam = M.kindStats(log);
  for (const [kind, row] of ozhidaem) {
    const s = poTipam.get(kind);
    check(
      s?.done === row.done && s?.right === row.right,
      `счётчики ${kind}: ждали ${row.done}/${row.right}, получили ${s?.done}/${s?.right}`,
    );
  }
  const poGruppam = M.kindStats(log, (kind) => gruppaOf.get(kind) ?? kind);
  for (const g of GROUPS) {
    const zhdem = [...ozhidaem]
      .filter(([kind]) => gruppaOf.get(kind) === g.id)
      .reduce((acc, [, r]) => acc + r.done, 0);
    check((poGruppam.get(g.id)?.done ?? 0) === zhdem, `группа ${g.id}: решено не сошлось`);
  }
  const oshibki = M.mistakes(log, prototipOf);
  const zhdemOshibki = prezhniyLog.attempts
    .filter((a) => a.outcome === 'wrong' || a.outcome === 'revealed')
    .map((a) => a.task);
  check(
    oshibki.length === zhdemOshibki.length &&
      zhdemOshibki.every((id) => oshibki.some((m) => m.task === id)),
    `«Мои ошибки»: ${oshibki.map((m) => m.task).join(',')}, а ждали ${zhdemOshibki.join(',')}`,
  );
  const rabota = B.buildMistakes(katalog, oshibki, 10);
  check(rabota.length > 0, '«Работа над ошибками» из прежних ошибок не собралась');
  check(
    rabota.every((t) => zhdemOshibki.includes(t.fixes) && !zhdemOshibki.includes(t.id)),
    '«Работа над ошибками»: задача с ошибкой или чужой аналог',
  );

  /* Новая попытка дописывается к прежним. */
  log10.record({ task: katalog.P12.f[0], kind: 'P12', outcome: 'right', seconds: 30 });
  const posle = M.parseLog(JSON.parse(storage.getItem(LOG_KEY) ?? 'null'));
  check(posle.attempts.length === prezhniyLog.attempts.length + 1, 'новая попытка не записалась');
  check(
    prezhniyLog.attempts.every((a) => posle.attempts.some((b) => b.id === a.id)),
    'новая попытка затёрла прежние',
  );
}

/* Опорные задачи: прежняя форма { задача: верно ли }. */
{
  const prezhnie = obrazec.localStorage[OPORNYE_KEY];
  const raw = JSON.stringify(prezhnie);
  const storage = fakeStorage({ [OPORNYE_KEY]: raw });
  podstavitStorage(storage);
  const O = requireSrc('lib/zadanie10/trening/opornye.ts');
  check(O.OPORNYE10_KEY === OPORNYE_KEY, 'опорные №10 пишут под другим ключом');
  const { outcomes } = O.razobratOpornye10(raw);
  for (const [id, verno] of Object.entries(prezhnie)) {
    check(outcomes[id] === (verno ? 'right' : 'wrong'), `опорные: исход ${id} не прочитан`);
  }
  check(Object.keys(outcomes).length === Object.keys(prezhnie).length, 'опорные: лишние исходы');
  check(storage.getItem(OPORNYE_KEY) === raw, 'опорные: чтение изменило запись');
  O.opornye10.recordAttempt({
    kind: 'podstanovka',
    taskId: 'pod-2',
    right: true,
    clean: true,
    seconds: 0,
    itog: 'right',
  });
  O.opornye10.recordAttempt({
    kind: 'koren',
    taskId: 'kor-1',
    right: false,
    clean: false,
    seconds: 0,
    itog: 'wrong',
  });
  const zapis = JSON.parse(storage.getItem(OPORNYE_KEY) ?? 'null');
  check(
    JSON.stringify(zapis) === JSON.stringify({ ...prezhnie, 'pod-2': true, 'kor-1': false }),
    `опорные: новая запись не в прежней форме: ${JSON.stringify(zapis)}`,
  );
  for (const [chto, bad] of [
    ['испорченная', '{не json'],
    ['массив', '[1,2]'],
    ['чужие значения', '{"pod-1":"да"}'],
  ]) {
    let upalo = false;
    try {
      const r = O.razobratOpornye10(bad);
      check(Object.keys(r.outcomes).length === 0, `опорные: ${chto} запись дала исходы`);
    } catch {
      upalo = true;
    }
    check(!upalo, `опорные: ${chto} запись роняет чтение`);
  }
}

/* Прежняя незаконченная тренировка (sessionStorage) — не новая запись. */
{
  const prezhnyaya = obrazec.sessionStorage[SESSIYA_PREZHNYAYA];
  check(Array.isArray(prezhnyaya?.plan), 'образец: нет прежней тренировки');
  check(
    S.razobratZapis10(prezhnyaya) === null,
    'прежняя тренировка из sessionStorage принята за запись нового тренажёра',
  );
  for (const id of prezhnyaya.plan) {
    check(S.etoKlyuch10(id), `образец: ключ ${id} прежней тренировки не читается`);
  }
}

/* ── 2. Ключи ─────────────────────────────────────────────────── */
{
  const { IMPORT_GROUPS, IMPORT_KEY_PATTERN } = requireSrc('lib/progressImport/registry.ts');
  const z10 = IMPORT_GROUPS.find((g) => g.id === 'z10');
  check(z10 !== undefined, 'в списке переноса в аккаунт нет №10');
  check(z10?.keys.includes(LOG_KEY) === true, 'журнал №10 не переносится в аккаунт');
  check(z10?.keys.includes('budetege:trainer:10:session') === true, 'сессия №10 не переносится');
  check(
    (z10?.keys ?? []).every((key) => IMPORT_KEY_PATTERN.test(key)),
    'ключ №10 не проходит правило базы',
  );
}

/* ── 3. Каталог и тренировка ──────────────────────────────────── */
check(Object.keys(katalog).length === PROTOTYPES.length, 'в каталоге не все прототипы');
check(poZadache.size === BANK.length, `в каталоге ${poZadache.size} задач, в банке ${BANK.length}`);
for (const z of BANK) {
  check(S.etoKlyuch10(z.id), `ключ ${z.id} не читается`);
  check(poZadache.get(z.id) === z.prototypeId, `задача ${z.id}: чужой прототип в каталоге`);
}

let seed = 10;
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
  const t = B.buildByTipy(katalog, ['P11', 'P22'], 20, new Set(), 'fipi', rnd);
  check(
    t.every((x) => /^F\d{3}$/.test(x.id)),
    'из банка ФИПИ: попал аналог',
  );
  check(
    t.length === katalog.P11.f.length + katalog.P22.f.length,
    `из банка ФИПИ: ${t.length} задач`,
  );
  const n = B.buildByTipy(katalog, ['P11', 'P22'], 20, new Set(), 'new', rnd);
  check(
    n.every((x) => /^P\d\d-a\d\d$/.test(x.id)),
    'сгенерированные: попала задача ФИПИ',
  );
  /* Тип из курса без задач ФИПИ: «Из банка ФИПИ» даёт аналоги, как прежде. */
  const kurs = PROTOTYPES.filter((p) => katalog[p.id].f.length === 0).map((p) => p.id);
  check(kurs.length > 0, 'нет типов из курса — обновить проверку');
  const k = B.buildByTipy(katalog, kurs, 10, new Set(), 'fipi', rnd);
  check(k.length === 10, 'типы из курса в режиме «Из банка ФИПИ» выпали из тренировки');
}
{
  const closed = new Set(katalog.P17.a.slice(0, 10));
  const t = B.buildByTipy(katalog, ['P17'], 10, closed, 'new', rnd);
  check(
    t.every((x) => !closed.has(x.id)),
    'решённая задача пришла раньше нерешённых',
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
    { task: katalog.P11.f[0], kind: 'P11', at: 2, streak: 0 },
    { task: katalog.P33.a[3], kind: 'P33', at: 1, streak: 0 },
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
  const id = katalog.P04.f[0];
  const a = B.analogOf(katalog, 'P04', id, new Set(), rnd);
  check(a !== null && a !== id && poZadache.get(a) === 'P04', 'похожая задача: не тот прототип');
  const zanyato = new Set([...katalog.P04.f, ...katalog.P04.a]);
  check(B.analogOf(katalog, 'P04', id, zanyato, rnd) === null, 'похожая задача: когда задач нет');
}

/* ── 5. Запись тренировки ─────────────────────────────────────── */
{
  const payload = {
    tasks: [
      { id: katalog.P11.f[0], p: 'P11' },
      { id: 'P13-a03', p: 'P13', fixes: katalog.P13.f[0] },
    ],
    control: true,
    timer: false,
  };
  check(S.isTrenazher10Payload(payload), 'запись тренировки не читается');
  check(S.razobratZapis10(payload) === payload, 'запись изменена при чтении');
  check(!S.isTrenazher10Payload({ tasks: [], control: false }), 'пустая тренировка принята');
  check(
    !S.isTrenazher10Payload({ tasks: [{ id: 'S03', p: 'P01' }], control: false }),
    'ключ №6 принят в №10',
  );
  check(S.razobratZapis10(null) === null && S.razobratZapis10({}) === null, 'мусор принят');
}

/* ── 6. Запись ответа ─────────────────────────────────────────── */
{
  const { sealAnswer, answerMatches } = requireSrc('lib/zadanie10/secret.ts');
  const { proverit10 } = requireSrc('lib/zadanie10/trening/otvet10.ts');
  const seal = sealAnswer(0.75);
  const r = (v) => proverit10(v, seal);
  check(r('0,75').kind === 'answer' && r('0,75').right === true, 'ответ 0,75 не засчитан');
  check(r('0.75').kind === 'answer' && r('0.75').right === true, 'ответ 0.75 не засчитан');
  check(r('3/4').kind === 'fractionRight', 'дробь 3/4 с верным значением — не подсказка');
  check(r('1/4').kind === 'answer' && r('1/4').right === false, 'неверная дробь не стала ошибкой');
  check(r('0,7').kind === 'answer' && r('0,7').right === false, 'неверный ответ засчитан');
  check(r('0,75 м').kind === 'format', 'ответ с единицами — не подсказка о записи');
  check(r('π/4').kind === 'pi', 'ответ через π — не подсказка');
  /* Прежняя проверка (листы, самотест) по-прежнему принимает дробь. */
  check(answerMatches('3/4', seal) === true, 'прежняя проверка листов изменилась');
}

/* ── 7. Тексты карты ──────────────────────────────────────────── */
{
  const { TIPY10_OPASNO, GRUPPY10_VID, FORMULY10, NAVYKI10 } =
    requireSrc('content/prikladnye10.ts');
  for (const p of PROTOTYPES) {
    check(
      typeof TIPY10_OPASNO[p.id] === 'string' && TIPY10_OPASNO[p.id].length > 20,
      `у типа ${p.id} нет текста «Где теряют балл»`,
    );
  }
  check(
    Object.keys(TIPY10_OPASNO).every((id) => katalog[id] !== undefined),
    'текст «Где теряют балл» у несуществующего типа',
  );
  check(
    new Set(Object.values(TIPY10_OPASNO)).size === PROTOTYPES.length,
    'тексты типов повторяются',
  );
  check(
    GROUPS.every((g) => GRUPPY10_VID[g.id] !== undefined),
    'у группы нет оформления',
  );
  check(FORMULY10.length > 0, 'нет блока «Что нужно знать»');
  const { BLOKI_OPORNYH } = requireSrc('lib/zadanie10/opornye.ts');
  const vNavykah = NAVYKI10.flatMap((n) => n.bloki.map((b) => b.slug));
  check(
    BLOKI_OPORNYH.every((b) => vNavykah.includes(b.slug)) &&
      vNavykah.length === BLOKI_OPORNYH.length,
    'не все блоки опорных задач на вкладке',
  );
  const vse = JSON.stringify({ TIPY10_OPASNO, FORMULY10, NAVYKI10 });
  check(!/П-\d\d/.test(vse), 'в текстах ученика код прототипа «П-…»');
}

if (failures.length > 0) {
  console.error(`\nТренажёр №10: ${failures.length} из ${checks} проверок не прошли:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(
  `Тренажёр №10: ${checks} проверок — прежний прогресс, опорные, тренировки, запись сессии и ответа.`,
);
