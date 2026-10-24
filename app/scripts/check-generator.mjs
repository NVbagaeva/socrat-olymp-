#!/usr/bin/env node
/* scripts/check-generator.mjs — общий генератор листов (components/generator/).

   Запуск: pnpm test:generator

   Проверяет логику и подключение №11 без браузера:
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

   Ненулевой код возврата — проверка не прошла. */

import { requireSrc } from './lib/load-ts.mjs';

const { dannyeTrenazhera } = requireSrc('lib/zadanie11/trenazher/dannye.ts');
const G = requireSrc('lib/generator/obshchiy/state.ts');
const A = requireSrc('lib/zadanie11/generator11.ts');
const S11 = requireSrc('lib/zadanie11/sheet11.ts');
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

const { razdely, bank } = dannyeTrenazhera();
const config = A.config11(razdely, '/zadaniya/11');
const engine = A.engine11(config, razdely, bank, '/zadaniya/11');
const SEEDS = ['7K3F', 'Q2M8', '0000', 'ZZZZ', 'A1B2'];

function specOf(state, vid) {
  const p = A.paramsIzSostoyaniya(state, config);
  return S11.sheetSpec11(p, S11.sobratList(p, bank), vid);
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

/* ── 1–4. Пресеты ──────────────────────────────────────────────── */
console.log('Пресеты №11');
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
      ok(sheet.variants.length === state.variants, `${label}/${seed}: вариантов ${state.variants}`);
      ok(
        sheet.variants.every((v) => v.length === state.plan.length),
        `${label}/${seed}: задач в варианте ${state.plan.length}`,
      );
      ok(
        JSON.stringify(sheet) === JSON.stringify(again),
        `${label}/${seed}: один seed — один лист`,
      );

      const uch = tasksOf(specOf(state, 'uchenik'));
      const tea = tasksOf(specOf(state, 'uchitel'));
      ok(uch.length === tea.length, `${label}/${seed}: у ученика и учителя одно число задач`);
      ok(
        uch.every(
          (t, i) =>
            tea[i] !== undefined && t.id === tea[i].id && t.questionHtml === tea[i].questionHtml,
        ),
        `${label}/${seed}: лист ученика и лист учителя — те же задачи в том же порядке`,
      );
      const uchHtml = JSON.stringify(specOf(state, 'uchenik'));
      ok(
        uch.every((t) => t.solutionHtml === null) &&
          !/sheet-task-answer|z11-sheet-badge|z11-sheet-istochnik/.test(uchHtml),
        `${label}/${seed}: на листе ученика нет ответов, решений и пометок`,
      );
      const teaSpec = specOf(state, 'uchitel');
      ok(
        !JSON.stringify(teaSpec).includes('z11-sheet-badge'),
        `${label}/${seed}: у задач учителя нет плашек «банк»/«новая»`,
      );
      ok(
        teaSpec.extraItems.filter((x) => x.includes('z11-sheet-istochnik')).length ===
          state.variants,
        `${label}/${seed}: строка источника у каждого варианта`,
      );
      const bankNos = sheet.variants[0].filter((t) => t.fromBank).map((t) => t.no);
      const line = teaSpec.extraItems.find((x) => x.includes('z11-sheet-istochnik')) ?? '';
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
        (specOf(state, 'uchenik').variants ?? [specOf(state, 'uchenik')]).every((v) =>
          v.blocks.flatMap((b) => b.tasks).every((t, i) => t.no === i + 1),
        ),
        `${label}/${seed}: номера на листе печати идут по порядку`,
      );
    }
  }
}

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

/* ── 6. Задачи на местах ────────────────────────────────────────── */
console.log('Задачи на местах');
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
          G.topicAllowed(t, source) && !base.plan.some((s) => G.topicOfSubtype(config, s.id) === t),
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
      const p = S11.parseSheetQuery11(new URLSearchParams(link));
      const printed = S11.sobratList(p, bank).poVariantam.flatMap((v) =>
        v.map((t) => t.questionHtml),
      );
      const shown = Object.values(r1);
      ok(
        p.poKlyucham === true && JSON.stringify(printed) === JSON.stringify(shown),
        `${label}: лист печати по ссылке совпадает с экраном`,
      );
    }
  }
}

/* ── 7. Старые адреса ───────────────────────────────────────────── */
console.log('Прежние адреса листов');
{
  const q = S11.sheetQuery11({
    rezhim: 'komplekt',
    istochnik: 'mix',
    sostav: [
      { id: 'PR-04', n: 2 },
      { id: 'VD-05', n: 1 },
    ],
    variants: 3,
    seed: 'K7Q2',
    zameny: { 2.1: 1 },
    marshrut: 1,
    theme: 'color',
  });
  const st = engine.parse(new URLSearchParams(q));
  ok(
    st !== null &&
      st.legacy === true &&
      st.plan.map((s) => s.id).join() === 'PR-04,PR-04,VD-05' &&
      st.variants === 3 &&
      st.seed === 'K7Q2',
    'адрес листа прежнего генератора открывается',
  );
  ok(st !== null && st.levels.length > 0, 'уровни выводятся из подтипов, если в адресе их нет');
  const old = S11.parseSheetQuery11(new URLSearchParams(q));
  const was = S11.sobratList(old, bank).poVariantam.flatMap((v) => v.map((t) => t.questionHtml));
  const now =
    st === null
      ? []
      : (await engine.build(st)).variants.flatMap((v) => v.map((t) => t.questionHtml));
  ok(
    JSON.stringify(was) === JSON.stringify(now),
    'прежний адрес в генераторе — тот же лист, что был напечатан',
  );
  ok(
    st !== null && engine.hrefs(st).student.split('?')[1] === q,
    'прежний адрес до правки остаётся прежним',
  );
  ok(
    engine.parse(new URLSearchParams('m=r&r=2')) === null,
    'маршрут урока генератор не перехватывает',
  );
}

console.log(`\n${checks - failed}/${checks} проверок прошли.`);
if (failed > 0) process.exit(1);
