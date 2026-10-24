#!/usr/bin/env node
/* scripts/check-generator.mjs — общий генератор листов (components/generator/).

   Запуск: pnpm test:generator

   Проверяет логику и подключение разделов (№11, №1) без браузера:
     1. Каждый пресет даёт годное состояние: есть задачи, не больше
        ограничений конфига, темы есть в выбранном источнике.
     2. Один seed — один лист: лист собирается дважды одинаково, листы
        ученика и учителя состоят из тех же задач в том же порядке.
     3. Лист ученика без ответов, решений и служебных пометок; лист
        учителя без пометок «банк»/«новая» у задач, источник — строкой.
     4. Ссылка на набор открывает то же состояние (план, источник,
        уровни, варианты, seed, замены).
     5. Изменения состава: степпер темы, смена уровней, источника,
        удаление задачи — ограничения соблюдаются, темы не пропадают.
     6. Задачи на местах: добавление темы, «Убрать», перестановка,
        «−» и «+», смена уровней не меняют остальные задачи; замены
        остаются у своих позиций; лист печати — тот же, что на экране.
     7. Старые адреса листов (прежний генератор) открываются тем же
        листом, что был напечатан.
     8. «Дополнительно»: рамка теории, примеры, QR-код, вид работы,
        дата и учитель попадают в ссылку и на оба листа; задачи от них
        не меняются, примеры не повторяют задачи листа.

   Ненулевой код возврата — проверка не прошла. */

import { requireSrc } from './lib/load-ts.mjs';

const { dannyeTrenazhera } = requireSrc('lib/zadanie11/trenazher/dannye.ts');
const G = requireSrc('lib/generator/obshchiy/state.ts');
const A = requireSrc('lib/zadanie11/generator11.ts');
const S11 = requireSrc('lib/zadanie11/sheet11.ts');
const { dannyeTrenazhera1 } = requireSrc('lib/planimetriya/trenazher/dannye.ts');
const A1 = requireSrc('lib/planimetriya/generator1.ts');
const S1 = requireSrc('lib/planimetriya/sheet1.ts');
const { GEN_UI } = requireSrc('content/generatorUi.ts');

let failed = 0;
let checks = 0;
function ok(cond, what) {
  checks += 1;
  if (!cond) {
    failed += 1;
    console.error(`  ✗ ${what}`);
  }
}
const okTop = ok;

const { razdely, bank } = dannyeTrenazhera();
const config = A.config11(razdely, '/zadaniya/11');
const engine = A.engine11(config, razdely, bank, '/zadaniya/11');
const SEEDS = ['7K3F', 'Q2M8', '0000', 'ZZZZ', 'A1B2'];

/* Разделы на общем генераторе: адаптер, лист и что у них своё. */
const d1 = dannyeTrenazhera1();
const config1 = A1.config1(d1.razdely, '/zadaniya/1');
const RAZDELY = [
  {
    name: '№11',
    config,
    engine,
    params: (st) => A.paramsIzSostoyaniya(st, config),
    parse: (q) => S11.parseSheetQuery11(q),
    query: (p) => S11.sheetQuery11(p),
    sobrat: (p) => S11.sobratList(p, bank),
    spec: (p, list, vid, qr) => S11.sheetSpec11(p, list, vid, qr),
    primery: (p, list) =>
      Object.values(list.primery ?? {})
        .flat()
        .map((x) => x.questionHtml),
    badge: 'z11-sheet-badge',
    ist: 'z11-sheet-istochnik',
    old: 'm=v&i=m&s=PR-04:2,VD-05:1&v=3&seed=K7Q2&z=2.1:1',
    oldIds: 'PR-04,PR-04,VD-05',
    urok: 'm=r&r=2',
  },
  {
    name: '№1',
    config: config1,
    engine: A1.engine1(config1, d1.razdely, d1.bank, '/zadaniya/1'),
    params: (st) => A1.paramsIzSostoyaniya(st, config1),
    parse: (q) => S1.parseSheetQuery1(q),
    query: (p) => S1.sheetQuery1(p),
    sobrat: (p) => S1.sobratList(p, d1.bank),
    spec: (p, list, vid, qr) => S1.sheetSpec1(p, list, vid, qr),
    primery: (p, list) =>
      [...S1.ramkiLista(p, list).values()].flatMap((r) => r.primery.map((x) => x.conditionHtml)),
    badge: 'z1-sheet-badge',
    ist: 'z1-sheet-istochnik',
    /* Прежний генератор №1: рамка теории с одним примером (f=1). */
    old: 'm=v&i=m&s=p01:2,p05:1&v=3&seed=K7Q2&z=2.1:1&f=1',
    oldIds: 'p01,p01,p05',
    urok: 'm=u&i=m&u=2&k=K7Q2AA&seed=K7Q2',
  },
];

function specOf(R, state, vid) {
  const p = R.params(state);
  return R.spec(p, R.sobrat(p), vid);
}
function tasksOf(spec) {
  const blocks = spec.variants ? spec.variants.flatMap((v) => v.blocks) : spec.blocks;
  return blocks.flatMap((b) => b.tasks);
}
const stripTags = (html) => html.replace(/<[^>]+>/g, '');
/** Задачи листа: ключ позиции → условие. */
function byPos(sheet) {
  const out = {};
  for (const v of sheet.variants) for (const t of v) out[t.pos] = t.questionHtml;
  return out;
}
/** Позиции, что есть в обоих листах, но с разными задачами. */
function diffTasks(a, b) {
  const x = byPos(a);
  const y = byPos(b);
  return Object.keys(x).filter((k) => k in y && x[k] !== y[k]);
}

async function proverit(R) {
  const { config, engine } = R;
  const ok = (cond, what) => okTop(cond, `${R.name} ${what}`);
  /* ── 1–4. Пресеты ──────────────────────────────────────────────── */
  console.log(`Пресеты ${R.name}`);
  for (const preset of config.presets) {
    for (const source of config.sources.map((s) => s.id)) {
      const base = G.stateFromPreset(config, preset, source);
      const label = `${preset.id}/${source}`;
      ok(
        G.problems(config, base).length === 0,
        `${label}: годное состояние (${G.problems(config, base).join(', ')})`,
      );
      ok(G.matchPreset(config, base) === preset.id, `${label}: пресет узнаётся по состоянию`);
      for (const seed of SEEDS) {
        const state = { ...base, seed };
        const sheet = await engine.build(state);
        const again = await engine.build(state);
        ok(
          sheet.variants.length === state.variants,
          `${label}/${seed}: вариантов ${state.variants}`,
        );
        ok(
          sheet.variants.every((v) => v.length === state.plan.length),
          `${label}/${seed}: задач в варианте ${state.plan.length}`,
        );
        ok(
          JSON.stringify(sheet) === JSON.stringify(again),
          `${label}/${seed}: один seed — один лист`,
        );

        const uch = tasksOf(specOf(R, state, 'uchenik'));
        const tea = tasksOf(specOf(R, state, 'uchitel'));
        ok(uch.length === tea.length, `${label}/${seed}: у ученика и учителя одно число задач`);
        ok(
          uch.every(
            (t, i) =>
              tea[i] !== undefined && t.id === tea[i].id && t.questionHtml === tea[i].questionHtml,
          ),
          `${label}/${seed}: лист ученика и лист учителя — те же задачи в том же порядке`,
        );
        const uchHtml = JSON.stringify(specOf(R, state, 'uchenik'));
        ok(
          uch.every((t) => t.solutionHtml === null) &&
            !new RegExp(`sheet-task-answer|${R.badge}|${R.ist}`).test(uchHtml),
          `${label}/${seed}: на листе ученика нет ответов, решений и пометок`,
        );
        const teaSpec = specOf(R, state, 'uchitel');
        ok(
          !JSON.stringify(teaSpec).includes(R.badge),
          `${label}/${seed}: у задач учителя нет плашек «банк»/«новая»`,
        );
        ok(
          teaSpec.extraItems.filter((x) => x.includes(R.ist)).length === state.variants,
          `${label}/${seed}: строка источника у каждого варианта`,
        );
        const bankNos = sheet.variants[0].filter((t) => t.fromBank).map((t) => t.no);
        const line = teaSpec.extraItems.find((x) => x.includes(R.ist)) ?? '';
        ok(
          stripTags(line) === GEN_UI.istochnikStroka(bankNos, state.plan.length),
          `${label}/${seed}: строка источника совпадает с задачами банка (${stripTags(line)})`,
        );

        const zameny = {
          [G.posKey(1, state.plan[0])]: 2,
          [G.posKey(state.variants, state.plan[state.plan.length - 1])]: 1,
        };
        const withZ = { ...state, zameny };
        const link = engine.hrefs(withZ).link;
        const back = engine.parse(new URLSearchParams(link.split('?')[1]));
        ok(
          back !== null &&
            JSON.stringify(back.plan) === JSON.stringify(withZ.plan) &&
            back.source === withZ.source &&
            back.variants === withZ.variants &&
            back.seed === withZ.seed &&
            JSON.stringify([...back.levels].sort()) === JSON.stringify([...withZ.levels].sort()) &&
            JSON.stringify(back.zameny) === JSON.stringify(zameny),
          `${label}/${seed}: ссылка на набор открывает то же состояние`,
        );
        const replaced = await engine.build(withZ);
        const changed = diffTasks(sheet, replaced);
        ok(
          changed.every((pos) => pos in zameny) && changed.includes(G.posKey(1, state.plan[0])),
          `${label}/${seed}: замена меняет только заменённые задачи (${changed.join(' ')})`,
        );
        ok(
          (specOf(R, state, 'uchenik').variants ?? [specOf(R, state, 'uchenik')]).every((v) =>
            v.blocks.flatMap((b) => b.tasks).every((t, i) => t.no === i + 1),
          ),
          `${label}/${seed}: номера на листе печати идут по порядку`,
        );
      }
    }
  }

  /* ── 6. Задачи на местах ────────────────────────────────────────── */
  console.log(`Задачи на местах ${R.name}`);
  for (const preset of config.presets) {
    for (const source of config.sources.map((s) => s.id)) {
      for (const seed of SEEDS.slice(0, 3)) {
        const label = `${preset.id}/${source}/${seed}`;
        const base = { ...G.stateFromPreset(config, preset, source), seed };
        if (preset.pickTopic !== undefined) base.variants = 2;
        const a = await engine.build(base);
        const same = async (plan, what) => {
          const b = await engine.build({ ...base, plan });
          const d = diffTasks(a, b);
          ok(d.length === 0, `${label}: ${what} — остальные задачи на месте (${d.join(' ')})`);
          return b;
        };
        const other = config.topics.find(
          (t) =>
            G.topicAllowed(t, source) &&
            !base.plan.some((s) => G.topicOfSubtype(config, s.id) === t),
        );
        const plus =
          other === undefined
            ? base.plan
            : G.setTopicCount(config, base.plan, other.id, 1, base.levels);
        await same(plus, 'тема добавлена');
        const mid = Math.floor(base.plan.length / 2);
        await same(G.removeAt(base.plan, mid), '«Убрать»');
        const b = await same(G.moveSlot(base.plan, 0, base.plan.length - 1), 'перестановка');
        ok(
          b.variants[0][base.plan.length - 1]?.questionHtml === a.variants[0][0]?.questionHtml,
          `${label}: задача едет вместе с позицией`,
        );
        const lv = G.relayout(config, base.plan, [1]);
        const kept = new Set(
          lv.filter((s, i) => G.slotKey(s) === G.slotKey(base.plan[i])).map(G.slotKey),
        );
        const c = await engine.build({ ...base, plan: lv });
        const d = diffTasks(a, c).filter((pos) => kept.has(pos.slice(pos.indexOf('.') + 1)));
        ok(d.length === 0, `${label}: смена уровней не трогает позиции с прежним подтипом`);

        if (base.variants < config.limits.variantsMax) {
          const more = await engine.build({ ...base, variants: base.variants + 1 });
          const dv = diffTasks(a, more);
          ok(dv.length === 0, `${label}: ещё один вариант не меняет прежние (${dv.join(' ')})`);
        }

        /* Замены остаются у своих позиций после правки состава. */
        const pos = G.posKey(base.variants, base.plan[mid]);
        const z1 = { ...base, zameny: { [pos]: 1 } };
        const r1 = byPos(await engine.build(z1));
        const r1plus = byPos(await engine.build({ ...z1, plan: plus }));
        ok(r1plus[pos] === r1[pos], `${label}: замена остаётся после добавления темы`);
        const r2 = byPos(await engine.build({ ...base, zameny: { [pos]: 2 } }));
        ok(
          r1[pos] !== byPos(a)[pos] && r2[pos] !== r1[pos] && r2[pos] !== byPos(a)[pos],
          `${label}: каждая замена даёт новую задачу`,
        );

        /* Лист печати по ссылке — тот же, что на экране. */
        const link = engine.hrefs(z1).link.split('?')[1];
        const p = R.parse(new URLSearchParams(link));
        const printed = R.sobrat(p).poVariantam.flatMap((v) => v.map((t) => t.questionHtml));
        const shown = Object.values(r1);
        ok(
          p.poKlyucham === true && JSON.stringify(printed) === JSON.stringify(shown),
          `${label}: лист печати по ссылке совпадает с экраном`,
        );
      }
    }
  }

  /* ── 7. Старые адреса ───────────────────────────────────────────── */
  console.log(`Прежние адреса листов ${R.name}`);
  {
    const q = R.query(R.parse(new URLSearchParams(R.old)));
    const st = engine.parse(new URLSearchParams(q));
    ok(
      st !== null &&
        st.legacy !== undefined &&
        st.plan.map((s) => s.id).join() === R.oldIds &&
        st.variants === 3 &&
        st.seed === 'K7Q2',
      'адрес листа прежнего генератора открывается',
    );
    ok(st !== null && st.levels.length > 0, 'уровни выводятся из подтипов, если в адресе их нет');
    const was = R.sobrat(R.parse(new URLSearchParams(q))).poVariantam.flatMap((v) =>
      v.map((t) => t.questionHtml),
    );
    const now =
      st === null
        ? []
        : (await engine.build(st)).variants.flatMap((v) => v.map((t) => t.questionHtml));
    ok(
      JSON.stringify(was) === JSON.stringify(now),
      'прежний адрес в генераторе — тот же лист, что был напечатан',
    );
    if (st !== null) {
      const pOld = R.parse(new URLSearchParams(q));
      const pNow = R.params(st);
      ok(
        JSON.stringify(R.spec(pOld, R.sobrat(pOld), 'uchitel')) ===
          JSON.stringify(R.spec(pNow, R.sobrat(pNow), 'uchitel')),
        'прежний адрес: лист учителя целиком тот же — режим, блоки, рамка',
      );
    }
    ok(
      st !== null && engine.hrefs(st).student.split('?')[1] === q,
      'прежний адрес до правки остаётся прежним',
    );
    ok(engine.parse(new URLSearchParams(R.urok)) === null, 'урок серии генератор не перехватывает');
  }

  /* ── 8. «Дополнительно» ─────────────────────────────────────────── */
  console.log(`«Дополнительно» ${R.name}`);
  {
    const blocksOf = (spec) =>
      spec.variants ? spec.variants.flatMap((v) => v.blocks) : spec.blocks;
    for (const preset of config.presets) {
      for (const seed of SEEDS.slice(0, 2)) {
        const label = `${preset.id}/${seed}`;
        const base = { ...G.stateFromPreset(config, preset, 'mix'), seed };
        const extras = {
          theory: true,
          examples: 2,
          qr: true,
          kind: 'kr',
          date: '2026-10-24',
          teacher: 'Иванова А.А.',
        };
        const st = { ...base, extras };
        const back = engine.parse(new URLSearchParams(engine.hrefs(st).link.split('?')[1]));
        ok(
          back !== null && JSON.stringify(back.extras) === JSON.stringify(extras),
          `${label}: «Дополнительно» в ссылке на набор`,
        );
        /* Пресет может задать вид работы; без «Дополнительно» вовсе — прежний адрес. */
        const plain = { ...base, extras: G.defaultExtras(config) };
        const plainLink = engine.hrefs(plain).link;
        ok(
          engine.parse(new URLSearchParams(plainLink.split('?')[1]))?.extras.theory === false &&
            !/[?&](tr|pr|qr|vr|d|uch)=/.test(plainLink),
          `${label}: без «Дополнительно» адрес прежний`,
        );
        const a = await engine.build(base);
        const b = await engine.build(st);
        ok(diffTasks(a, b).length === 0, `${label}: задачи от «Дополнительно» не меняются`);
        ok(
          b.variants.every(
            (v) => v[0]?.lead?.includes('gen-recap') && v[0].lead.includes('gen-example'),
          ),
          `${label}: в предпросмотре рамка и примеры перед задачами`,
        );
        const p = R.params(st);
        const list = R.sobrat(p);
        for (const vid of ['uchenik', 'uchitel']) {
          const spec = R.spec(p, list, vid, '<svg></svg>');
          const blocks = blocksOf(spec);
          const titles = spec.variants ? spec.variants.map((v) => v.title) : [spec.title];
          ok(
            blocks.some((x) => x.recap?.items.length > 0) &&
              blocks.some((x) => (x.leadItems ?? []).length > 0),
            `${label}/${vid}: рамка и примеры на листе`,
          );
          ok(
            titles.every(
              (t) => t.qr === '<svg></svg>' && t.subtitle.startsWith('Контрольная работа'),
            ),
            `${label}/${vid}: QR-код и вид работы в шапке`,
          );
          ok(
            spec.fields.date === '24.10.2026' && spec.head.author === 'Иванова А.А.',
            `${label}/${vid}: дата и учитель`,
          );
          if (vid === 'uchenik')
            ok(
              blocks.flatMap((x) => x.tasks).every((t) => t.solutionHtml === null),
              `${label}: у задач ученика по-прежнему нет решений`,
            );
        }
        const primery = R.primery(p, list);
        const zadachi = new Set(list.poVariantam.flat().map((z) => z.questionHtml));
        ok(
          primery.length > 0 && primery.every((x) => !zadachi.has(x)),
          `${label}: примеры не повторяют задачи листа (${primery.length})`,
        );
        const noQr = R.spec(
          R.params({ ...st, extras: { ...extras, qr: false } }),
          list,
          'uchenik',
          '<svg></svg>',
        );
        ok(
          (noQr.variants ?? [noQr]).every((v) => (v.title ?? noQr.title).qr === undefined),
          `${label}: без галочки QR-кода нет`,
        );
      }
    }
  }
}

for (const R of RAZDELY) await proverit(R);

/* ── 5. Изменения состава ───────────────────────────────────────── */
console.log('Изменения состава');
const ege = G.stateFromPreset(config, config.presets[0], 'mix');
{
  let plan = ege.plan;
  for (let i = 0; i < 10; i += 1) plan = G.setTopicCount(config, plan, 'VD', i + 2, ege.levels);
  ok(
    G.countsByTopic(config, plan).VD === config.limits.maxPerTopic,
    'степпер темы не выходит за предел на тип',
  );
  ok(G.problems(config, { ...ege, plan }).length === 0, 'состав в пределах после степпера');
  let big = [];
  for (const t of config.topics)
    big = G.setTopicCount(config, big, t.id, config.limits.maxPerTopic, [1, 2, 3]);
  ok(big.length <= config.limits.maxTasks, `всего задач не больше ${config.limits.maxTasks}`);

  const only3 = G.relayout(config, ege.plan, [3]);
  const c0 = G.countsByTopic(config, ege.plan);
  const c3 = G.countsByTopic(config, only3);
  ok(
    Object.keys(c0).every((k) => c0[k] === c3[k]),
    'смена уровня не выкидывает темы из состава',
  );
  ok(
    only3.every((s) => G.subtypeById(config, s.id) !== undefined),
    'подтипы после смены уровня существуют',
  );

  const bankPlan = G.filterBySource(
    config,
    G.setTopicCount(config, ege.plan, 'RZ', 2, ege.levels),
    'bank',
  );
  ok(!bankPlan.some((s) => s.id.startsWith('RZ-')), 'разминка уходит из состава при «только банк»');

  const removed = G.removeAt(ege.plan, 2);
  ok(removed.length === ege.plan.length - 1, 'удаление убирает одну позицию');
  const gone = G.slotKey(ege.plan[2]);
  const keep = G.slotKey(ege.plan[3]);
  const z = G.pruneZameny({ [`1.${gone}`]: 1, [`1.${keep}`]: 2, [`9.${keep}`]: 1 }, removed, 4);
  ok(
    JSON.stringify(z) === JSON.stringify({ [`1.${keep}`]: 2 }),
    'замены убранной позиции и лишних вариантов уходят, остальные остаются',
  );
  const moved = G.moveSlot(ege.plan, 0, 3);
  ok(
    moved.length === ege.plan.length &&
      G.slotKey(moved[3]) === G.slotKey(ege.plan[0]) &&
      G.slotKey(moved[0]) === G.slotKey(ege.plan[1]),
    'перестановка двигает одну позицию',
  );
  const three = G.setTopicCount(config, ege.plan, 'VD', 3, ege.levels);
  const down = G.setTopicCount(config, three, 'VD', 2, ege.levels);
  const up = G.setTopicCount(config, down, 'VD', 3, ege.levels);
  ok(JSON.stringify(up) === JSON.stringify(three), '«−» и «+» возвращают ту же позицию');
  let many = ege.plan;
  for (let i = 0; i < 4; i += 1) many = G.setSubtypeCount(config, many, 'VD-05', i + 1);
  ok(
    G.problems(config, { ...ege, plan: many }).length === 0 &&
      many
        .filter((s) => s.id === 'VD-05')
        .every((s, i, a) => i === 0 || many.indexOf(a[i - 1]) + 1 === many.indexOf(s)),
    'задачи одного подтипа добавляются подряд, ключи не повторяются',
  );

  const lv = G.changeLevelAt(config, ege.plan, 0, 1);
  ok(
    lv.length === ege.plan.length &&
      G.topicOfSubtype(config, lv[0].id)?.id === G.topicOfSubtype(config, ege.plan[0].id)?.id,
    '«другой уровень» остаётся в той же теме',
  );
  ok(
    G.levelsText([1, 2, 3]) === '★–★★★' &&
      G.levelsText([1, 3]) === '★ и ★★★' &&
      G.levelsText([2]) === '★★',
    'уровни словами',
  );
}

console.log(`\n${checks - failed}/${checks} проверок прошли.`);
if (failed > 0) process.exit(1);
