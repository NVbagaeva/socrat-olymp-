#!/usr/bin/env node
/* scripts/check-trenazher-filtry.mjs — тренажёр с фильтрами сверху,
   логика без браузера (lib/trenazher/).

   Запуск: pnpm test:trenazher-filtry

   На всех подключённых разделах (№12: тренажёр по всем типам и каждая
   подтема), на случайных фильтрах и случайной статистике ученика:
     1. Числа на чипах совпадают с реальным числом задач: чип подтипа —
        столько, сколько найдёт фильтр с одним этим подтипом, чип темы —
        с её подтипами; «решено» на чипе — из статистики.
     2. Ссылка: фильтр → адрес → фильтр → адрес совпадают 1:1, фильтр из
        адреса равен исходному (приведённому к разделу).
     3. «Расширить фильтры» снимает последний добавленный фильтр и за
        конечное число шагов доходит до «без сужений»; найденных не
        становится меньше.
     4. «Только с ошибками» берёт ровно задачи с ошибками из статистики,
        «только нерешённые» — ровно нерешённые.
     5. Состав тренировки: столько, сколько выбрано (или все найденные),
        без повторов, только из найденных, подтипы поровну;
        «от простых к сложным» — уровни не убывают.
     6. Сессия: старая запись №12 (рецепты «набор, seed, задача») после
        переноса собирает те же задачи; новая тренировка по ключам
        собирает задачи детерминированно; состояние прежнего экрана
        читается (отметки и ошибки на местах). */

import { requireSrc } from './lib/load-ts.mjs';

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
  return ok;
}

const F = requireSrc('lib/trenazher/filtr.ts');
const S = requireSrc('lib/trenazher/sessiya.ts');
const T12 = requireSrc('lib/ves12/trenazher12.ts');
const { functionTypes } = requireSrc('data/functionTypes.ts');
const T11 = requireSrc('lib/zadanie11/trenazher/filtry11.ts');
const D11 = requireSrc('lib/zadanie11/trenazher/dannye.ts').dannyeTrenazhera();
const T1 = requireSrc('lib/planimetriya/trenazher/filtry1.ts');
const D1 = requireSrc('lib/planimetriya/trenazher/dannye.ts').dannyeTrenazhera1();
const T13 = requireSrc('lib/zadanie13/trenazher/filtry13.ts');
const P13 = requireSrc('lib/zadanie13/generate.ts').prototypes();
const { BANK_13 } = requireSrc('lib/zadanie13/bank.ts');
const T3 = requireSrc('lib/zadanie3/trenazher/filtry3.ts');
const { RAZDELY: RAZDELY_3 } = requireSrc('lib/zadanie3/index.ts');
const { fipiVarianta } = requireSrc('lib/zadanie3/fipi.ts');
const bezTex = (t) => t;

/* Воспроизводимый генератор случайных чисел. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, list) => list[Math.floor(r() * list.length)];
const some = (r, list, p) => list.filter(() => r() < p);

const RAZDELY = [
  { name: '№12, все типы', config: T12.trenazherConfig12(), refs: T12.zadachi12() },
  ...functionTypes
    .filter((t) => t.status === 'active')
    .map((t) => ({
      name: `№12 ${t.id}`,
      config: T12.trenazherConfig12(t.id),
      refs: T12.zadachi12(t.id),
    })),
  { name: '№11', config: T11.trenazherConfig11(D11), refs: T11.zadachi11(D11) },
  { name: '№1', config: T1.trenazherConfig1(D1, bezTex), refs: T1.zadachi1(D1) },
  { name: '№13', config: T13.trenazherConfig13(P13, bezTex), refs: T13.zadachi13(P13, BANK_13) },
  {
    name: '№3',
    config: T3.trenazherConfig3(RAZDELY_3, bezTex),
    refs: T3.zadachi3(RAZDELY_3, fipiVarianta),
  },
];

function randomStat(r, refs) {
  return {
    resheno: new Set(some(r, refs, 0.3).map((x) => x.key)),
    oshibki: new Set(some(r, refs, 0.15).map((x) => x.key)),
  };
}

/** Случайный фильтр: каждое поле меняется через izmenit, как на экране. */
function randomFiltr(r, config) {
  let f = { ...F.NACHALNYY };
  const ids = config.temy.flatMap((t) => t.podtipy.map((p) => p.id));
  const steps = Math.floor(r() * 6);
  for (let i = 0; i < steps; i += 1) {
    const what = pick(r, [
      'tipy',
      'istochnik',
      'urovni',
      'skolko',
      'rezhim',
      'poryadok',
      'moi',
      'tema',
      'dop',
    ]);
    if (what === 'tipy') f = F.pereklyuchitTip(f, pick(r, ids));
    if (what === 'tema') f = F.pereklyuchitTemu(f, pick(r, config.temy));
    if (what === 'istochnik' && config.istochnik)
      f = F.izmenit(f, { istochnik: pick(r, F.ISTOCHNIKI) });
    if (what === 'urovni' && config.urovni.length > 0)
      f = F.pereklyuchitUroven(f, pick(r, config.urovni).uroven);
    if (what === 'skolko') f = F.izmenit(f, { skolko: pick(r, F.SKOLKO) });
    if (what === 'rezhim') f = F.izmenit(f, { rezhim: pick(r, F.REZHIMY) });
    if (what === 'poryadok') f = F.izmenit(f, { poryadok: pick(r, F.PORYADKI) });
    if (what === 'moi') f = F.izmenit(f, { moi: pick(r, F.MOI) });
    if (what === 'dop' && (config.dop ?? []).length > 0) {
      const pole = pick(r, config.dop);
      f = F.kRazdelu({ ...f, dop: { ...f.dop, [pole.id]: pick(r, pole.varianty).id } }, config);
    }
  }
  return F.kRazdelu(f, config);
}

const strip = (f) => JSON.stringify({ ...f, pravilaTitle: f.pravilaTitle ?? null });

for (const { name, config, refs } of RAZDELY) {
  check(refs.length > 0, `${name}: список задач пуст`);
  const keys = new Set(refs.map((x) => x.key));
  check(keys.size === refs.length, `${name}: ключи задач повторяются`);
  const ids = new Set(config.temy.flatMap((t) => t.podtipy.map((p) => p.id)));
  check(
    refs.every((x) => ids.has(x.podtip)),
    `${name}: задача с подтипом не из конфига`,
  );

  const r = rng(name.length * 7919);
  for (let run = 0; run < 250; run += 1) {
    const stat = randomStat(r, refs);
    const f = randomFiltr(r, config);
    const tag = `${name}, фильтр «${F.vSsylku(f)}»`;

    /* 1. Числа на чипах. */
    const chisla = F.chislaChipov(config, refs, f, stat);
    for (const tema of config.temy) {
      const all = F.naydeno(refs, F.izmenit(f, { tipy: tema.podtipy.map((p) => p.id) }), stat);
      check(
        chisla[tema.id]?.n === all.length,
        `${tag}: чип темы ${tema.id} — ${chisla[tema.id]?.n}, а задач ${all.length}`,
      );
      for (const p of tema.podtipy) {
        const one = F.naydeno(refs, F.izmenit(f, { tipy: [p.id] }), stat);
        check(
          chisla[p.id]?.n === one.length,
          `${tag}: чип ${p.id} — ${chisla[p.id]?.n}, а задач ${one.length}`,
        );
        check(
          chisla[p.id]?.resheno === one.filter((x) => stat.resheno.has(x.key)).length,
          `${tag}: «решено» на чипе ${p.id} не сходится`,
        );
      }
    }

    /* 2. Ссылка 1:1. */
    const q = F.vSsylku(f);
    const back = F.izSsylki(new URLSearchParams(q), config);
    check(F.vSsylku(back) === q, `${tag}: адрес после разбора «${F.vSsylku(back)}»`);
    check(
      strip(back) === strip(f),
      `${tag}: фильтр из адреса не тот же: ${strip(back)} ≠ ${strip(f)}`,
    );
    check(F.estVSsylke(new URLSearchParams(q)) === (q !== ''), `${tag}: estVSsylke`);

    /* 3. «Расширить фильтры». */
    let cur = f;
    let found = F.naydeno(refs, cur, stat).length;
    for (let step = 0; step < 10; step += 1) {
      const next = F.rasshirit(cur);
      if (next === null) break;
      check(
        next.poryadokSuzheniya.length === cur.poryadokSuzheniya.length - 1,
        `${tag}: «Расширить» сняло не один фильтр`,
      );
      const more = F.naydeno(refs, next, stat).length;
      check(more >= found, `${tag}: после «Расширить» найдено меньше (${more} < ${found})`);
      cur = next;
      found = more;
    }
    check(cur.poryadokSuzheniya.length === 0, `${tag}: «Расширить» не дошло до конца`);

    /* 4. «Мои задачи». */
    const base = F.naydeno(refs, F.izmenit(f, { moi: 'vse' }), stat);
    const osh = F.naydeno(refs, F.izmenit(f, { moi: 'oshibki' }), stat);
    check(
      JSON.stringify(osh.map((x) => x.key)) ===
        JSON.stringify(base.filter((x) => stat.oshibki.has(x.key)).map((x) => x.key)),
      `${tag}: «только с ошибками» — не задачи с ошибками из статистики`,
    );
    const nere = F.naydeno(refs, F.izmenit(f, { moi: 'nereshennye' }), stat);
    check(
      nere.every((x) => !stat.resheno.has(x.key)) &&
        nere.length === base.filter((x) => !stat.resheno.has(x.key)).length,
      `${tag}: «только нерешённые» — не нерешённые`,
    );

    /* 5. Состав. */
    const all = F.naydeno(refs, f, stat);
    const sostav = F.sostav(all, f, rng(run));
    check(
      sostav.length === F.skolkoVozmyot(f, all.length),
      `${tag}: в тренировке ${sostav.length}, а должно ${F.skolkoVozmyot(f, all.length)}`,
    );
    check(
      new Set(sostav.map((x) => x.key)).size === sostav.length,
      `${tag}: задачи в тренировке повторяются`,
    );
    check(
      sostav.every((x) => all.includes(x)),
      `${tag}: в тренировке задача не из найденных`,
    );
    const per = new Map();
    sostav.forEach((x) => per.set(x.podtip, (per.get(x.podtip) ?? 0) + 1));
    const avail = new Map();
    all.forEach((x) => avail.set(x.podtip, (avail.get(x.podtip) ?? 0) + 1));
    const counts = [...per.values()];
    const short = [...avail.entries()].some(
      ([id, n]) => n < Math.max(...counts) && (per.get(id) ?? 0) === n,
    );
    check(
      counts.length === 0 || Math.max(...counts) - Math.min(...counts) <= 1 || short,
      `${tag}: подтипы не поровну (${JSON.stringify(Object.fromEntries(per))})`,
    );
    if (f.poryadok === 'prostye') {
      const lv = sostav.map((x) => x.uroven ?? 1);
      check(
        lv.every((l, i) => i === 0 || l >= lv[i - 1]),
        `${tag}: «от простых к сложным» — уровни убывают`,
      );
    }
  }

  /* Готовые наборы. */
  const slozh = F.nabor('slozhnye', F.NACHALNYY, config);
  if (config.urovni.length > 0) {
    const max = Math.max(...config.urovni.map((u) => u.uroven));
    check(
      slozh !== null && F.naydeno(refs, slozh).every((x) => x.uroven === max),
      `${name}: «Только сложные» — не только уровень ${max}`,
    );
  }
  const bystryy = F.nabor('bystryy', F.NACHALNYY, config);
  check(
    bystryy !== null && bystryy.skolko === 10 && bystryy.poryadok === 'sluchayno',
    `${name}: «Быстрый старт» — не 10 случайных`,
  );
  check(
    F.etoNabor('bystryy', F.NACHALNYY, config),
    `${name}: фильтр по умолчанию — это «Быстрый старт»`,
  );
}

/* Ярлык прежнего адреса: правило ответа — отдельный фильтр со своей подписью. */
{
  const config = T12.trenazherConfig12('quadratic');
  const refs = T12.zadachi12('quadratic');
  let f = F.izmenit(F.NACHALNYY, { tipy: ['12Q.H'] });
  f = F.izmenit(f, { pravila: ['intersection-x'], pravilaTitle: 'абсцисса второй точки' });
  const found = F.naydeno(refs, f);
  check(
    found.length > 0 && found.every((x) => x.podtip === '12Q.H' && x.pravilo === 'intersection-x'),
    'ярлык 12Q.H «абсцисса второй точки»: не те задачи',
  );
  const back = F.izSsylki(new URLSearchParams(F.vSsylku(f)), config);
  check(
    back.pravilaTitle === 'абсцисса второй точки',
    'ярлык: подпись правила не вернулась из ссылки',
  );
  check(
    F.svodka(config, f, 10, { ...requireSrc('content/trenazherFiltry.ts').SLOVA_FILTRA }).includes(
      'абсцисса второй точки',
    ),
    'ярлык: подписи правила нет в строке-сводке',
  );
}

/* Ссылки: тема целиком в «t», прежние «tip» и «tipy», поля раздела. */
{
  const c13 = T13.trenazherConfig13(P13, bezTex);
  const a = F.izSsylki(new URLSearchParams('t=A'), c13);
  const temaA = c13.temy.find((t) => t.id === 'A').podtipy.map((p) => p.id);
  check(JSON.stringify(a.tipy) === JSON.stringify(temaA), '№13: «?t=A» — не все прототипы схемы A');
  const c11 = T11.trenazherConfig11(D11);
  check(
    F.estVSsylke(new URLSearchParams('tip=DP-07')) &&
      F.izSsylki(new URLSearchParams('tip=DP-07'), c11).tipy.join() === 'DP-07',
    '№11: ссылка «?tip=DP-07» не открыла подтип',
  );
  check(
    F.izSsylki(new URLSearchParams('tipy=PR-01,PR-04,XX'), c11).tipy.join() === 'PR-01,PR-04',
    '№11: ссылка «?tipy=…» — не те подтипы',
  );
  const d = F.izSsylki(new URLSearchParams('d=zadanie.tip,oformlenie.nonsense,chuzhoe.x'), c13);
  check(
    JSON.stringify(d.dop) === JSON.stringify({ zadanie: 'tip' }),
    '№13: поля раздела из ссылки — чужие и неверные не отброшены',
  );
  check(F.vSsylku(d) === 'd=zadanie.tip', '№13: поле раздела в ссылке');
  const tip = F.naborRazdela(c13.nabory[0], F.NACHALNYY, c13);
  check(tip.dop.zadanie === 'tip', '№13: набор «Определи тип» не задаёт поле');
  check(
    F.dopAktivnye(tip, c13).length === 1 && F.snyatDop(tip, 'zadanie').dop.zadanie === undefined,
    '№13: чип поля раздела и его крестик',
  );
  check(
    F.izSsylki(new URLSearchParams('d=zadanie.tip'), c11).dop.zadanie === undefined,
    '№11: чужое поле раздела не отброшено',
  );
}

/* 6. Сессия. */
{
  const TS = requireSrc('lib/trainerSession.ts');
  const refs = T12.zadachi12();
  const r = rng(12);
  const sample = Array.from({ length: 60 }, () => pick(r, refs));
  const payload = {
    v: 1,
    filtr: '',
    rezhim: 'podskazki',
    seed: 'test-seed',
    items: sample.map((x) => ({ k: x.key })),
  };
  check(S.isTrenPayload(payload), 'новая тренировка не проходит проверку формы');
  check(!S.isTrenPayload({ ...payload, items: [] }), 'пустая тренировка проходит проверку формы');
  let built = 0;
  for (let at = 0; at < payload.items.length; at += 1) {
    const a = TS.zadachaShablona(payload.items[at].k, S.seedZadaniya(payload, at, 0), new Map());
    const b = TS.zadachaShablona(payload.items[at].k, S.seedZadaniya(payload, at, 0), new Map());
    if (check(a !== null, `задача ${payload.items[at].k} не собралась`)) {
      built += 1;
      check(
        a.id === payload.items[at].k,
        `задача ${payload.items[at].k}: собрана другая (${a.id})`,
      );
      check(TS.signatureOf !== undefined, 'нет signatureOf');
      check(
        a.questionHtml === b.questionHtml && a.answer === b.answer && a.chartSvg === b.chartSvg,
        `задача ${payload.items[at].k}: собирается по-разному на том же seed`,
      );
    }
    /* «Прорешать те же задачи»: свой seed задания даёт ту же задачу. */
    const sub = {
      ...payload,
      items: [{ k: payload.items[at].k, seed: S.osnovaSeed(payload, at, 0) }],
    };
    const c = TS.zadachaShablona(sub.items[0].k, S.seedZadaniya(sub, 0, 0), new Map());
    check(
      a === null || (c !== null && c.questionHtml === a.questionHtml && c.answer === a.answer),
      `задача ${payload.items[at].k}: «Прорешать те же» собрала другую`,
    );
  }
  check(built === payload.items.length, `собрано ${built} из ${payload.items.length}`);

  /* Перенос старой тренировки №12: рецепты → задания с тем же seed. */
  const old = TS.buildSession({
    skills: ['12.A', '12.C'],
    level: null,
    count: 6,
    mode: 'practice',
    mistakes: [],
  });
  const recipe = {
    recipe: 1,
    control: true,
    tasks: old.tasks.map((t) => ({
      set: t.kind,
      seed: t.origin.seed,
      id: t.id,
      sig: t.origin.sig,
    })),
  };
  const { readTrainerRecipe } = requireSrc('components/tasks/trainer/trainerPayload.ts');
  const rec = readTrainerRecipe(recipe);
  check(rec !== null, 'старая запись №12 не читается');
  const moved = {
    v: 1,
    filtr: '',
    rezhim: rec.control ? 'bez' : 'podskazki',
    seed: 'perenos',
    items: rec.tasks.map((t) => ({ k: t.id, seed: t.seed })),
  };
  check(S.isTrenPayload(moved), 'перенесённая тренировка не проходит проверку формы');
  moved.items.forEach((item, at) => {
    const t = TS.zadachaShablona(item.k, S.seedZadaniya(moved, at, 0), new Map());
    check(
      t !== null &&
        t.questionHtml === old.tasks[at].questionHtml &&
        t.answer === old.tasks[at].answer,
      `перенос: задача ${item.k} собралась не та же`,
    );
  });
  /* Состояние прежнего экрана: отметки и ошибки на местах. */
  const ui = S.readTrenUi({
    index: 2,
    marks: { 0: 'right', 1: 'hinted' },
    tried: { 1: true, 3: true },
    order: [2, 0, 1, 3, 4, 5],
    value: '7',
  });
  check(
    ui.z[0]?.itog === 'right' &&
      ui.z[1]?.itog === 'hinted' &&
      ui.z[3]?.oshibok === 1 &&
      ui.index === 2,
    'перенос: состояние прежнего экрана прочитано неверно',
  );
  const back = S.otmetki(ui.z);
  check(
    back.marks[0] === 'right' &&
      back.marks[1] === 'hinted' &&
      back.tried[1] === true &&
      back.tried[3] === true,
    'перенос: отметки после чтения не те же',
  );
}

/* №3: ключи читаются обратно, источник — по таблице открытого банка,
   ссылка разбора типа «?tipy=P03-…» открывает эти прототипы. */
{
  const c3 = T3.trenazherConfig3(RAZDELY_3, bezTex);
  const refs3 = T3.zadachi3(RAZDELY_3, fipiVarianta);
  const { FIPI_3 } = requireSrc('lib/zadanie3/fipi.ts');
  check(new Set(refs3.map((r) => r.key)).size === refs3.length, '№3: ключи задач повторяются');
  for (const r of refs3) {
    const k = T3.poKlyuchu3(r.key);
    check(
      k !== null && k.id === r.podtip && T3.klyuch3(k.id, k.n) === r.key,
      `№3: ключ ${r.key} не читается обратно`,
    );
    check(
      (r.istochnik === 'fipi') === (FIPI_3[r.key] !== undefined),
      `№3: источник ${r.key} не совпадает с таблицей ФИПИ`,
    );
  }
  check(
    refs3.filter((r) => r.istochnik === 'fipi').length === Object.keys(FIPI_3).length,
    '№3: задач открытого банка не столько, сколько в таблице',
  );
  check(
    F.izSsylki(new URLSearchParams('tipy=P03-01,P03-02,P03-99'), c3).tipy.join() ===
      'P03-01,P03-02',
    '№3: ссылка «?tipy=…» с разбора типа — не те прототипы',
  );
  check(T3.poKlyuchu3('P03-01|b1') === null, '№3: чужой ключ прочитан');
}

if (failures.length > 0) {
  console.error(`check-trenazher-filtry: ${failures.length} из ${checks} проверок не прошли`);
  failures.slice(0, 40).forEach((item) => console.error(` - ${item}`));
  process.exit(1);
}
console.log(`check-trenazher-filtry: ok (${checks} проверок, разделов ${RAZDELY.length})`);
