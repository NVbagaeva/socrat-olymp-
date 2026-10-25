#!/usr/bin/env node
/* scripts/check-k-treugolnik.mjs — угловой коэффициент только через треугольник.

   На всём сайте k прямой (и f'(x₀) = k касательной в №9) находится
   одним способом, словами теории №12: две целые точки → треугольник
   под прямой → катеты длинами → противолежащий катет делим на
   прилежащий, прямая убывает — ставим минус. Формулы двух точек
   (y₂ − y₁)/(x₂ − x₁), Δy/Δx, «разность ординат на разность абсцисс»
   и система уравнений для k под запретом.

   Проверка в два слоя:
     1. исходники — src (тексты, шаблоны разборов и подсказок, наборы
        задач JSON) и public/data: ни одной запрещённой записи;
     2. то, что видит ученик и учитель, — собранные тексты: разборы
        №12 «прямая» (лист учителя, разбор ученика), подсказки
        тренажёра, разборы опорных задач, «Запомни» №12, разборы и
        подсказки прототипов и опорных задач №9.

   Исключения — места, где Δx и Δy значат не катеты наклона: понятие
   производной (приращения и предел секущей), векторы, парабола (шаги
   до вершины), разметка формул. Каждое — с причиной.

   Запуск: pnpm test:k-treugolnik */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireSrc } from './lib/load-ts.mjs';
import { variantAnswersItems } from '../src/lib/sheet/answers12.js';
import { solutionSvg } from '../src/lib/sheet/figures12.js';

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/* Запрещённые записи. Минус бывает и дефисом, и «−». */
const MINUS = '[-−]';
const FORBIDDEN = [
  ['y₂ − y₁', new RegExp(`y_\\{?2\\}?\\s*${MINUS}\\s*y_\\{?1\\}?|y₂\\s*${MINUS}\\s*y₁`)],
  ['x₂ − x₁', new RegExp(`x_\\{?2\\}?\\s*${MINUS}\\s*x_\\{?1\\}?|x₂\\s*${MINUS}\\s*x₁`)],
  [
    'y_B − y_A',
    new RegExp(`y_\\{?B\\}?\\s*${MINUS}\\s*y_\\{?A\\}?|x_\\{?B\\}?\\s*${MINUS}\\s*x_\\{?A\\}?`),
  ],
  ['Δy', /\\Delta\s*y|Δ\s*y/],
  ['Δx', /\\Delta\s*x|Δ\s*x/],
  ['разность ординат/абсцисс', /разност\S*\s+(?:ординат|абсцисс)/i],
  ['изменение y к изменению x', /изменени\S*\s+(?:<[^>]+>|\S){0,40}?y\S*\s+к\s+изменени/i],
];
const SISTEMA = /систем\S*\s+уравнени/i;
/* «Рядом с k»: коэффициент наклона прямой, тангенс угла, касательная. */
const K_NEAR =
  /\$k\$|\bk\s*=|угл\S* коэффициент|наклон|\\operatorname\{tg\}\s*\\alpha|tg\s*α|касательн/i;
const WINDOW = 160;

/* Где Δ — не катеты наклона. Путь от src или от корня приложения. */
const EXEMPT = new Map([
  ['src/content/theoryPonyatie9.ts', 'понятие производной: приращения и предел секущей'],
  ['src/lib/proizvodnaya/stsenyPonyatiya.ts', 'понятие производной: сцены секущей'],
  [
    'src/components/tasks/proizvodnaya/ZhivyeRisunki9.tsx',
    'понятие производной: живые рисунки секущей',
  ],
  ['src/lib/proizvodnaya/selftest.ts', 'самопроверка секущей и предела'],
  ['src/lib/proizvodnaya/types.ts', 'описание рисунка секущей в теории'],
  ['src/lib/proizvodnaya/render.ts', 'подписи секущей в теории понятия производной'],
  ['src/lib/vektory/render.ts', 'векторы: координаты, не наклон'],
  ['src/lib/vektory/types.ts', 'векторы: координаты, не наклон'],
  ['src/lib/graph/hints-quadratic.js', 'парабола: шаги от вершины'],
  ['src/lib/graph/solution-quadratic.js', 'парабола: шаги от вершины'],
  ['src/content/quadraticMetody.ts', 'парабола: шаги от вершины'],
  ['src/content/quadraticBasics.ts', 'парабола: шаги от вершины'],
  ['src/lib/graph/data/prep/12q/skill-2.json', 'парабола: шаги от вершины'],
  ['src/lib/graph/math.js', 'разметка формул: токен \\Delta в наборе дробей'],
]);

let failed = 0;
let checks = 0;
const problems = [];
function fail(what) {
  failed += 1;
  if (problems.length < 60) problems.push(what);
}

function scanText(text, where) {
  checks += 1;
  /* Запись ищется рядом с k: те же x₂ − x₁ у вектора или в показателе
     степени к наклону прямой отношения не имеют. */
  const near = (i) => K_NEAR.test(text.slice(Math.max(0, i - WINDOW), i + WINDOW));
  const show = (i) => text.slice(Math.max(0, i - 50), i + 60).replace(/\s+/g, ' ');
  for (const [label, re] of [...FORBIDDEN, ['система уравнений', SISTEMA]]) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) {
      if (near(m.index)) {
        fail(`${where}: «${label}» рядом с k — …${show(m.index)}…`);
        break;
      }
    }
  }
}

/* ── 1. Исходники ──────────────────────────────────────────────── */
console.log('Исходники');
function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|mjs|json)$/.test(name)) out.push(full);
  }
  return out;
}
const files = [...walk(path.join(APP, 'src'), []), ...walk(path.join(APP, 'public', 'data'), [])];
let scanned = 0;
for (const full of files) {
  const rel = path.relative(APP, full).split(path.sep).join('/');
  if (EXEMPT.has(rel)) continue;
  scanned += 1;
  scanText(fs.readFileSync(full, 'utf8'), rel);
}
console.log(`  файлов: ${scanned}, исключений: ${EXEMPT.size}`);

/* ── 2. Собранные тексты ───────────────────────────────────────── */
const strip = (html) =>
  String(html)
    .replace(/<annotation[^>]*>([\s\S]*?)<\/annotation>/g, ' $1 ')
    .replace(/data-tex="([^"]*)"/g, ' $1 ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
const flat = (value) => strip(JSON.stringify(value));

const DATA = path.join(APP, 'src', 'lib', 'graph', 'data');
function readSets(dir) {
  const full = path.join(DATA, dir);
  return fs.existsSync(full)
    ? fs
        .readdirSync(full)
        .filter((n) => n.endsWith('.json'))
        .sort()
        .map((n) => JSON.parse(fs.readFileSync(path.join(full, n), 'utf8')))
    : [];
}

console.log('№12 «прямая»: разборы, подсказки, опорные задачи');
{
  const generator =
    requireSrc('lib/graph/generate.js').default ?? requireSrc('lib/graph/generate.js');
  const solution = requireSrc('lib/graph/solution.js');
  const build = solution.build ?? solution.default?.build;
  const { trainerTaskFrom } = requireSrc('lib/trainer.ts');
  const prep = readSets('prep/12');
  const proto = readSets('prototypes/12');
  generator.setSets({ prep, prototypes: proto });
  const rules = {};
  for (const set of prep.concat(proto)) for (const t of set.tasks || []) rules[t.id] = t.answerRule;
  let tasks = 0;
  let treugolnikov = 0;
  let teacherKeys = 0;
  for (const set of prep.concat(proto)) {
    for (let run = 0; run < 6; run++) {
      const seed = run === 0 ? set.seed : set.seed * 1000 + run;
      let list;
      try {
        list = generator.generateSet(set.id, seed);
      } catch {
        continue;
      }
      for (const task of list) {
        tasks += 1;
        const where = `${task.id}/${seed}`;
        /* Разбор: лист учителя и разбор ученика собираются этим движком. */
        const lines = task.meta.lines;
        let steps = [];
        if (lines && lines.length === 2) {
          steps = build({
            lines,
            window: task.meta.window,
            task: { rule: rules[task.id], answer: task.answer },
          });
        } else {
          const a = generator.analysis(task.id, task.meta.seed);
          if (a)
            steps = build({
              triangle: a.triangle,
              line: a.line,
              window: a.task.meta.window,
              task: {
                rule: rules[task.id],
                answer: task.answer,
                query: task.meta.query,
                probe: task.meta.probe,
              },
            });
        }
        scanText(flat(steps), `разбор ${where}`);
        /* Треугольник на чертеже разбора — у каждой прямой с наклоном. */
        if (task.svg) {
          const tri = generator.slopeTriangles(task);
          const nado = (lines && lines.length === 2 ? lines : [task.meta]).filter(
            (l) => l.k !== 0,
          ).length;
          checks += 1;
          if (nado > 0 && (tri === null || tri.triangles.filter(Boolean).length !== nado))
            fail(`${where}: на чертеже разбора не у каждой прямой треугольник наклона`);
          else if (nado > 0) treugolnikov += 1;
        }
        /* Рисунок к решению на листе учителя и в примере: треугольник у каждой прямой. */
        if (set.kind === 'prototype' && task.svg) {
          const svg = solutionSvg(task, generator) || '';
          const nado = (lines && lines.length === 2 ? lines : [task.meta]).filter(
            (l) => l.k !== 0,
          ).length;
          const est = (svg.match(/id="slope-fill(?:-\d)?"/g) || []).length;
          checks += 1;
          if (est !== nado)
            fail(
              `лист учителя ${where}: треугольников на рисунке ${est}, прямых с наклоном ${nado}`,
            );
        }
        /* Краткое решение на листе учителя: k словами теории. */
        if (set.kind === 'prototype' && run === 0) {
          const html = variantAnswersItems(
            [
              {
                title: null,
                blocks: [
                  {
                    title: '',
                    tasks: [{ ...task, no: 1, seed: task.meta.seed, answerRule: rules[task.id] }],
                  },
                ],
              },
            ],
            generator,
            solution.default ?? solution,
            null,
            null,
          )
            .filter((x) => x.includes('sheet-solution'))
            .join('');
          scanText(strip(html), `лист учителя ${where}`);
          checks += 1;
          if (html !== '') teacherKeys += 1;
          if (
            html !== '' &&
            task.svg &&
            !/Вертикальный катет \d+, горизонтальный \d+, прямая (?:возрастает|убывает) →/.test(
              html,
            )
          )
            fail(
              `лист учителя ${where}: нет строки «вертикальный катет …, горизонтальный …, прямая … → k = …»`,
            );
        }
        /* Подсказка тренажёра. */
        if (set.kind === 'prototype') {
          const tt = trainerTaskFrom(task);
          scanText(flat(tt), `тренажёр ${where}`);
          const stepK = tt.steps.find((s) => /\$?k\$?/.test(strip(s.titleHtml)) && s.parts);
          if (task.svg && task.meta.k !== 0) {
            checks += 1;
            const prompts = (stepK?.parts ?? []).map((p) => strip(p.promptHtml ?? p.textHtml));
            const order = [
              'Выберите две точки в узлах сетки',
              'Сколько клеток по вертикали',
              'Сколько по горизонтали',
              'Прямая возрастает или убывает',
            ];
            if (!order.every((q, i) => (prompts[i] ?? '').includes(q)))
              fail(
                `тренажёр ${where}: шаги про k не по порядку «точки → вертикаль → горизонталь → направление»: ${prompts.join(' | ')}`,
              );
            checks += 1;
            if (!stepK?.chartSvg?.includes('slope-fill'))
              fail(`тренажёр ${where}: у подсказки про k нет чертежа с треугольником`);
          }
        }
      }
    }
  }
  console.log(
    `  задач: ${tasks}, чертежей с треугольником: ${treugolnikov}, решений на листе учителя: ${teacherKeys}`,
  );
  checks += 1;
  if (teacherKeys === 0)
    fail('лист учителя: ни одного краткого решения — проверка ничего не проверила');
  const { recapByType } = requireSrc('content/ves12.ts');
  scanText(flat(recapByType), '«Запомни» №12');
  checks += 1;
  if (!recapByType.linear.some((x) => x.includes('противолежащий катет делим на прилежащий')))
    fail('«Запомни» №12: нет правила треугольника словами теории');
  const { prepSkills } = requireSrc('content/prepSkills.ts');
  scanText(flat(prepSkills), 'карточки навыков');
  const { buildPrepTasks } = requireSrc('lib/prep.ts');
  for (const skill of prepSkills.filter((s) => /^P12-/.test(s.setId))) {
    try {
      scanText(flat(buildPrepTasks(skill)), `опорные ${skill.setId}`);
    } catch (e) {
      fail(`опорные ${skill.setId}: не собрались (${e.message})`);
    }
  }
}

console.log('№9: прототипы и опорные задачи');
{
  const { generate } = requireSrc('lib/proizvodnaya/generate.ts');
  const { PROTOTYPES } = requireSrc('lib/proizvodnaya/prototypes/index.ts');
  const { PREP_BLOCKS } = requireSrc('lib/proizvodnaya/prep/blocks.ts');
  const { generatePrepById } = requireSrc('lib/proizvodnaya/prep/generate.ts');
  let n = 0;
  for (const p of PROTOTYPES) {
    for (let i = 0; i < 8; i++) {
      let t;
      try {
        t = generate(p.id, 'K' + i);
      } catch {
        continue;
      }
      n += 1;
      scanText(
        flat({ shagi: t.shagi, razbor: t.razbor, podskazka: t.podskazka }),
        `№9 ${p.id}/K${i}`,
      );
    }
  }
  for (const b of PREP_BLOCKS) {
    scanText(flat(b.zapomni), `№9 «Запомни» ${b.id}`);
    for (const m of b.zadachi) {
      for (let i = 0; i < 8; i++) {
        let t;
        try {
          t = generatePrepById(m.id, 'K' + i);
        } catch {
          continue;
        }
        n += 1;
        scanText(flat({ razbor: t.razbor, podskazka: t.podskazka }), `№9 ${m.id}/K${i}`);
      }
    }
  }
  console.log(`  задач: ${n}`);
}

for (const p of problems) console.error(`  ✗ ${p}`);
console.log(`\n${checks - failed}/${checks} проверок прошли.`);
if (failed > 0) process.exit(1);
