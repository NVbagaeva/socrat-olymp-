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
     6. Старые адреса листов (прежний генератор) открываются.

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

      const zameny = { 1.1: 2, [`${state.variants}.${state.plan.length}`]: 1 };
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
      ok(
        replaced.variants[0][1]?.questionHtml === sheet.variants[0][1]?.questionHtml ||
          state.plan.length < 2,
        `${label}/${seed}: замена задачи 1 не трогает задачу 2`,
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
    only3.every((id) => G.subtypeById(config, id) !== undefined),
    'подтипы после смены уровня существуют',
  );

  const bankPlan = G.filterBySource(
    config,
    G.setTopicCount(config, ege.plan, 'RZ', 2, ege.levels),
    'bank',
  );
  ok(!bankPlan.some((id) => id.startsWith('RZ-')), 'разминка уходит из состава при «только банк»');

  const removed = G.removeAt(ege.plan, 2);
  ok(removed.length === ege.plan.length - 1, 'удаление убирает одну позицию');
  const z = G.shiftZameny({ 1.2: 1, 1.3: 4, 1.5: 2, 2.5: 1 }, 2);
  ok(
    JSON.stringify(z) === JSON.stringify({ 1.2: 1, 1.4: 2, 2.4: 1 }),
    'замены сдвигаются после удаления',
  );

  const lv = G.changeLevelAt(config, ege.plan, 0, 1);
  ok(
    lv.length === ege.plan.length &&
      G.topicOfSubtype(config, lv[0])?.id === G.topicOfSubtype(config, ege.plan[0])?.id,
    '«другой уровень» остаётся в той же теме',
  );
  ok(
    G.levelsText([1, 2, 3]) === '★–★★★' &&
      G.levelsText([1, 3]) === '★ и ★★★' &&
      G.levelsText([2]) === '★★',
    'уровни словами',
  );
}

/* ── 6. Старые адреса ───────────────────────────────────────────── */
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
      st.plan.join() === 'PR-04,PR-04,VD-05' &&
      st.variants === 3 &&
      st.seed === 'K7Q2',
    'адрес листа прежнего генератора открывается',
  );
  ok(st !== null && st.levels.length > 0, 'уровни выводятся из подтипов, если в адресе их нет');
  ok(
    engine.parse(new URLSearchParams('m=r&r=2')) === null,
    'маршрут урока генератор не перехватывает',
  );
}

console.log(`\n${checks - failed}/${checks} проверок прошли.`);
if (failed > 0) process.exit(1);
