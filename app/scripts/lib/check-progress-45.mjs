/* scripts/lib/check-progress-45.mjs — общая часть проверок тренажёра №4 и
   №5 в «Стеклянной сцене» (scripts/check-progress-4.mjs, -5.mjs).

   Без браузера и без сборки сайта: модули читаются из исходников.

     1. Перенос прогресса. Образец scripts/fixtures/progress-N-prezhniy.json
        записан прежним кодом (main до редизайна) теми же вызовами, что
        делали прежние экраны: тренажёр до PR #340 (счётчики по методам,
        budetege:veroyatnost-N:v2), «Узнай метод», опорные задачи и
        незаконченная тренировка. Счётчики сворачиваются в тот же журнал
        budetege:veroyatnost-N:log:v1, что и после PR #340: по методам,
        «Мои ошибки» — те же задачи, прежние ключи нетронуты, повторный
        перенос ничего не меняет. Журнал после PR #340 (прежний тренажёр
        писал в него сам) читается новым тренажёром как есть.
     2. Ключи: журнал и сессия — в списке переноса в аккаунт.
     3. Каталог: все прототипы и варианты, сборник — `f`, новые — `a`;
        тренировки по типам, источнику, «Работа над ошибками».
     4. Запись тренировки: прежняя запись открывается на той же задаче
        (задачи, состояние экрана), «Узнай метод», новая запись с
        таймером и аналогом из «Работы над ошибками».
     5. Запись ответа по общему правилу: дробь с верным значением —
        подсказка, а не ответ.
     6. Тексты карты: «Где теряют балл» у каждого типа, примеры «Что
        нужно знать» посчитаны верно. */

import fs from 'node:fs';
import path from 'node:path';
import { requireSrc, APP } from './load-ts.mjs';

export function proveritProgress45(Z) {
  const failures = [];
  let checks = 0;
  const check = (ok, what) => {
    checks += 1;
    if (!ok) failures.push(what);
  };

  const fakeStorage = (initial = {}) => {
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
  };
  const podstavit = (storage) => {
    globalThis.window = {
      localStorage: storage,
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {},
      location: { search: '', pathname: `/zadaniya/${Z}/trenazher/` },
    };
    globalThis.localStorage = storage;
  };

  const OLD_KEY = `budetege:veroyatnost-${Z}:v2`;
  const LOG_KEY = `budetege:veroyatnost-${Z}:log:v1`;
  const UZNAY_KEY = `budetege:veroyatnost-${Z}-uznay:v2`;
  const PREP_KEY = `budetege:veroyatnost-${Z}:prep:v1`;
  const SESSION_KEY = `budetege:trainer:${Z}:session`;

  const I = requireSrc('lib/veroyatnost/index.ts');
  const P = requireSrc('lib/veroyatnost/pool.ts');
  const K = requireSrc('lib/veroyatnost/trening/katalog.ts');
  const B = requireSrc('lib/trening/bank.ts');
  const M = requireSrc('lib/progressLog/model.ts');
  const SP = requireSrc('components/tasks/veroyatnost/sessiyaPayload.ts');
  const U = requireSrc('components/tasks/veroyatnost/trening/ui45.ts');
  const PR = requireSrc('lib/veroyatnost/trening/progress.ts');

  const BANK = Z === 4 ? I.BANK_4 : I.BANK_5;
  const pool = Z === 4 ? P.bank4Pool() : P.bank5Pool();
  const lyogkiy = P.bezRazborov(pool);
  const uznay = P.uznayMetodPool(Z);
  const katalog = K.katalog45(Z);
  const poZadache = B.prototipyZadach(katalog);
  const metodOf = new Map(BANK.map((p) => [p.id, p.blok]));
  const prototipOf = (task) => task.slice(0, task.lastIndexOf(':'));
  const metodZadachi = (task) => metodOf.get(prototipOf(task)) ?? task;

  const obrazec = JSON.parse(
    fs.readFileSync(path.join(APP, 'scripts', 'fixtures', `progress-${Z}-prezhniy.json`), 'utf8'),
  );

  /* ── 1. Перенос прогресса ─────────────────────────────────── */
  {
    const staroe = obrazec[OLD_KEY];
    check(staroe !== undefined, `образец: нет прежнего ключа ${OLD_KEY}`);
    const initial = Object.fromEntries(
      Object.entries(obrazec)
        .filter(([k]) => k !== '_chto')
        .map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]),
    );
    const storage = fakeStorage(initial);
    podstavit(storage);
    const { migrateLegacyLog, LEGACY_LOGS } = requireSrc('lib/progressLog/index.ts');
    check(LEGACY_LOGS[LOG_KEY] === OLD_KEY, `журнал №${Z} не связан с прежним ключом`);
    check(PR.LOG45_KEY[Z] === LOG_KEY, `тренажёр №${Z} пишет не в тот журнал`);
    check(PR.UZNAY45_KEY[Z] === UZNAY_KEY, `«Узнай метод» №${Z}: не тот ключ`);

    /* Так журнал читает новый тренажёр: log45(N).get() сворачивает прежнее. */
    const log = PR.log45(Z).get();
    const stats = M.kindStats(log);
    for (const [kind, tally] of Object.entries(staroe.kinds)) {
      const s = stats.get(kind);
      check(
        s?.done === tally.done && s?.right === tally.right && s?.seconds === tally.seconds,
        `перенос: метод ${kind} — было ${tally.done}/${tally.right}, стало ${s?.done}/${s?.right}`,
      );
      check(
        metodOf.size > 0 && [...metodOf.values()].includes(kind),
        `перенос: метода ${kind} нет в банке`,
      );
    }
    check(stats.size === Object.keys(staroe.kinds).length, 'перенос: появились лишние методы');
    const oshibki = M.mistakes(log, metodZadachi);
    check(
      oshibki.length === staroe.mistakes.length &&
        staroe.mistakes.every((t) => oshibki.some((m) => m.task === t)),
      `перенос: ошибки ${oshibki.map((m) => m.task).join(',')}, а было ${staroe.mistakes.join(',')}`,
    );
    for (const m of oshibki) {
      check(poZadache.has(m.task), `перенос: ошибки ${m.task} нет в каталоге`);
      check(m.kind === metodZadachi(m.task), `перенос: у ошибки ${m.task} чужой метод`);
      const analog = B.analogOf(katalog, prototipOf(m.task), m.task, new Set([m.task]));
      check(
        analog !== null && prototipOf(analog) === prototipOf(m.task),
        `перенос: для ошибки ${m.task} нет аналога`,
      );
    }
    for (const key of [OLD_KEY, UZNAY_KEY, PREP_KEY, SESSION_KEY]) {
      check(storage.getItem(key) === initial[key], `перенос: прежний ключ ${key} изменён`);
    }
    const posle = storage.getItem(LOG_KEY);
    check(posle !== null, 'перенос: журнал не записан');
    migrateLegacyLog(LOG_KEY);
    check(storage.getItem(LOG_KEY) === posle, 'перенос: повторный запуск изменил журнал');

    /* «Узнай метод» и опорные — прежние хранилища, читаются как есть. */
    const uzProgress = JSON.parse(storage.getItem(UZNAY_KEY));
    check(
      Object.keys(uzProgress.kinds).length > 0 &&
        Object.keys(uzProgress.kinds).every((m) => [...metodOf.values()].includes(m)),
      '«Узнай метод»: в образце методы не из банка',
    );
    const { prepItog } = requireSrc('lib/veroyatnost/prepProgress.ts');
    const prepProgress = JSON.parse(storage.getItem(PREP_KEY));
    const prepPool = Z === 4 ? P.prep4Pool() : P.prep5Pool();
    const vsePrep = new Set(prepPool.flatMap((b) => b.zadachi.map((z) => z.id)));
    for (const id of Object.keys(prepProgress.kinds)) {
      check(vsePrep.has(id), `опорные: задачи ${id} из образца нет в блоках`);
    }
    const pervaya = prepPool[0].zadachi[0].id;
    check(
      prepItog({ ...prepProgress, outcomes: prepProgress.outcomes ?? {} }, pervaya) === 'right',
      'опорные: решённая задача образца не читается решённой',
    );
  }

  /* Журнал после PR #340: прежний тренажёр писал в него через
     createProgressStore(прежний, журнал) — новый читает его как есть. */
  {
    const storage = fakeStorage();
    podstavit(storage);
    const { createProgressStore } = requireSrc('lib/progressStore.ts');
    const prezhniy = createProgressStore(OLD_KEY, LOG_KEY);
    const k0 = pool.kinds[0];
    prezhniy.recordAttempt({
      kind: k0.blok,
      taskId: `${k0.id}:2`,
      right: true,
      clean: true,
      seconds: 30,
      ishod: 'right',
    });
    prezhniy.recordAttempt({
      kind: k0.blok,
      taskId: `${k0.id}:5`,
      right: false,
      clean: false,
      seconds: 50,
      ishod: 'revealed',
    });
    const log = M.parseLog(JSON.parse(storage.getItem(LOG_KEY)));
    check(log.attempts.length === 2, 'журнал после #340: попытки не записаны');
    check(
      log.attempts.every((a) => a.kind === k0.blok && poZadache.has(a.task)),
      'журнал после #340: тип попытки не метод или задача не из каталога',
    );
    check(
      M.mistakes(log, metodZadachi)
        .map((m) => m.task)
        .join() === `${k0.id}:5`,
      'журнал после #340: ошибка не читается',
    );
  }

  /* ── 2. Ключи ─────────────────────────────────────────────── */
  {
    const { IMPORT_GROUPS, IMPORT_KEY_PATTERN } = requireSrc('lib/progressImport/registry.ts');
    const g = IMPORT_GROUPS.find((x) => x.id === `z${Z}`);
    check(g !== undefined, `в списке переноса в аккаунт нет №${Z}`);
    check(g?.keys.includes(LOG_KEY) === true, `журнал №${Z} не переносится в аккаунт`);
    check(g?.keys.includes(SESSION_KEY) === true, `сессия №${Z} не переносится`);
    check(g?.keys.includes(OLD_KEY) !== true, `прежний ключ №${Z} не должен уходить в аккаунт`);
    check(
      (g?.keys ?? []).every((key) => IMPORT_KEY_PATTERN.test(key)),
      `ключ №${Z} не проходит правило базы`,
    );
  }

  /* ── 3. Каталог и тренировки ──────────────────────────────── */
  const vsegoVariantov = BANK.reduce((s, p) => s + p.varianty.length, 0);
  check(Object.keys(katalog).length === BANK.length, 'в каталоге не все прототипы');
  check(
    poZadache.size === vsegoVariantov,
    `в каталоге ${poZadache.size} задач, в банке ${vsegoVariantov}`,
  );
  for (const p of BANK) {
    const f = new Set(
      p.varianty.filter((v) => v.source === 'sbornik').map((v) => `${p.id}:${v.n}`),
    );
    check(
      katalog[p.id].f.every((id) => f.has(id)) && katalog[p.id].f.length === f.size,
      `${p.id}: «из сборника» не совпало с банком`,
    );
    for (const id of [...katalog[p.id].f, ...katalog[p.id].a]) {
      const [kind, n] = [prototipOf(id), Number(id.slice(id.lastIndexOf(':') + 1))];
      const z = SP.zadachaBanka(kind, n, 'practice', lyogkiy, uznay);
      check(
        z !== null && z.id === id && z.metod === p.blok,
        `задача ${id} не собирается из банка страницы`,
      );
    }
  }
  let seed = Z;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const vse = BANK.map((p) => p.id);
  {
    const t = B.buildByTipy(katalog, vse, 10, new Set(), 'vse', rnd);
    check(
      t.length === 10 && new Set(t.map((x) => x.id)).size === 10,
      'вперемешку: не 10 разных задач',
    );
    check(new Set(t.map((x) => x.p)).size === 10, 'вперемешку: тип повторился раньше времени');
    const f = B.buildByTipy(katalog, vse, 20, new Set(), 'fipi', rnd);
    check(
      f.every((x) => katalog[x.p].f.includes(x.id) || katalog[x.p].f.length === 0),
      'из сборника: попала новая',
    );
    const n = B.buildByTipy(katalog, vse, 20, new Set(), 'new', rnd);
    check(
      n.every((x) => katalog[x.p].a.includes(x.id)),
      'новые: попала задача сборника',
    );
    const bezKonca = B.buildByTipy(katalog, vse, 40, new Set(), 'vse', rnd);
    check(new Set(bezKonca.map((x) => x.id)).size === 40, '«Без конца»: не 40 разных задач');
  }

  /* ── 4. Запись тренировки ─────────────────────────────────── */
  {
    const zapis = obrazec[SESSION_KEY];
    check(
      zapis !== undefined && zapis.schemaVersion === 2,
      'образец: нет незаконченной тренировки',
    );
    const payload = SP.raspakovat(zapis.payload, lyogkiy, uznay);
    check(payload !== null, 'прежняя тренировка не открылась');
    check(SP.isSessiyaPayload(payload), 'прежняя тренировка после чтения не проходит проверку');
    check(
      payload?.tasks.length === zapis.payload.tasks.length &&
        payload.tasks.every(
          (t, i) => t.kind === zapis.payload.tasks[i][0] && t.n === zapis.payload.tasks[i][1],
        ),
      'прежняя тренировка: задачи не те',
    );
    check(
      payload?.podskazki === true && payload?.rezhim === 'practice',
      'прежняя тренировка: режим не тот',
    );
    const ui = U.readUi45(zapis.ui);
    check(ui.index === 1 && ui.marks[0] === 'right', 'прежнее состояние: номер задачи или отметки');
    check(ui.value === zapis.ui.card.value, 'прежнее состояние: введённый ответ потерян');
    check(
      ui.checked === 'wrong' && ui.failed === true,
      'прежнее состояние: неверный ответ не прочитан',
    );
    check(ui.solutionOpen === false && ui.vybor === null, 'прежнее состояние: лишнее открыто');

    /* «Узнай метод» прежней записью. */
    const kindU = uznay.kinds[0];
    const tasksU = SP.zadachiPodhoda(
      [{ kind: kindU.id, n: kindU.variants[0].n }],
      'uznay',
      lyogkiy,
      uznay,
    );
    const packedU = SP.upakovat({
      zadanie: Z,
      rezhim: 'uznay',
      metod: '',
      podskazki: true,
      tasks: tasksU,
    });
    const back = SP.raspakovat(JSON.parse(JSON.stringify(packedU)), lyogkiy, uznay);
    check(
      back !== null && back.rezhim === 'uznay' && back.tasks[0].metodSeal !== '',
      '«Узнай метод»: запись не читается',
    );
    check(
      U.readUi45({ index: 0, marks: {}, tried: {}, order: null, vybor: 'kubiki' }).vybor ===
        'kubiki',
      '«Узнай метод»: выбор не восстановлен',
    );

    /* Новая запись: таймер, «без подсказок», аналог помнит свою ошибку. */
    const k = pool.kinds[2];
    const t1 = SP.zadachaBanka(k.id, 2, 'mistakes', lyogkiy, uznay);
    const novaya = {
      zadanie: Z,
      rezhim: 'mistakes',
      metod: '',
      podskazki: false,
      timer: false,
      tasks: [{ ...t1, fixes: `${k.id}:1` }],
    };
    const packed = JSON.parse(JSON.stringify(SP.upakovat(novaya)));
    const r = SP.raspakovat(packed, lyogkiy, uznay);
    check(
      r?.timer === false && r?.podskazki === false,
      'новая запись: таймер или «без подсказок» потеряны',
    );
    check(r?.tasks[0].fixes === `${k.id}:1`, 'новая запись: аналог забыл свою ошибку');
    check(
      SP.raspakovat({ ...packed, tasks: [[k.id, 2, 'чужая подпись']] }, lyogkiy, uznay) === null,
      'запись с чужой подписью принята',
    );
    check(
      SP.raspakovat({ tasks: [] }, lyogkiy, uznay) === null &&
        SP.raspakovat(null, lyogkiy, uznay) === null,
      'мусор принят',
    );
    const sim = SP.pohozhieZadachi(r, [0], lyogkiy, uznay);
    check(
      sim !== null &&
        sim.tasks[0].kind === k.id &&
        sim.tasks[0].id !== t1.id &&
        sim.tasks[0].fixes === `${k.id}:1`,
      '«Работа над ошибками» на итогах: не тот аналог',
    );
  }

  /* ── 5. Запись ответа ─────────────────────────────────────── */
  {
    const { readSealed45 } = requireSrc('lib/veroyatnost/trening/otvet45.ts');
    const { klyuchZadachi } = requireSrc('lib/veroyatnost/secret.ts');
    let provereno = 0;
    for (const p of BANK) {
      const v = p.varianty[0];
      const otvet = I.otvetUchenika(p, v.params);
      const kind = pool.kinds.find((x) => x.id === p.id);
      const seal = kind.variants.find((x) => x.n === v.n).seal;
      const klyuch = klyuchZadachi(p.id, v.n);
      const zapis = String(otvet).replace('.', ',');
      const r = readSealed45(zapis, seal, klyuch);
      check(r.kind === 'answer' && r.right, `${p.id}: верный ответ ${zapis} не засчитан`);
      /* Та же величина обыкновенной дробью: «0,55» → «11/20». */
      const znam = [2, 4, 5, 8, 10, 20, 25, 40, 50, 100, 200, 250, 500, 1000].find(
        (d) => otvet > 0 && otvet < 1 && Math.abs(otvet * d - Math.round(otvet * d)) < 1e-9,
      );
      const drob = znam === undefined ? undefined : `${Math.round(otvet * znam)}/${znam}`;
      if (drob !== undefined) {
        provereno += 1;
        const d = readSealed45(drob, seal, klyuch);
        check(d.kind === 'fractionRight', `${p.id}: дробь ${drob} засчитана как ответ`);
      }
      const mimo = readSealed45('123', seal, klyuch);
      check(mimo.kind === 'answer' && !mimo.right, `${p.id}: неверный ответ засчитан`);
    }
    check(provereno > 0, 'запись ответа: ни одной задачи с ответом-дробью');
  }

  return { failures, checks };
}

/** Сводка и код выхода. */
export function itog45(Z, { failures, checks }, dop = 0) {
  if (failures.length > 0) {
    console.error(`\nТренажёр №${Z}: ${failures.length} из ${checks + dop} проверок не прошли:\n`);
    for (const f of failures) console.error(`  ✗ ${f}`);
    process.exit(1);
  }
  console.log(
    `Тренажёр №${Z}: ${checks + dop} проверок — перенос прогресса, каталог, тренировки, запись сессии, ответ, тексты.`,
  );
}
