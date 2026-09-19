#!/usr/bin/env node
/* scripts/build-tetrad-12.mjs — методическая тетрадь «Задание 12.
   Линейная функция» для репетитора: 2 урока, теория с нуля,
   тренировка с ответами и плашкой «Для репетитора» под каждой
   задачей.

   Запуск:
     node scripts/build-tetrad-12.mjs --demo   демо: 6 страниц,
                                                по одной каждого типа
     node scripts/build-tetrad-12.mjs --urok=1 весь урок 1 (этап 2)
     node scripts/build-tetrad-12.mjs --urok=2 весь урок 2 (этап 3)
     node scripts/build-tetrad-12.mjs          оба урока (этап 4)

   Тетрадь целиком — материал «для репетитора»: под каждой задачей
   плашка с ответом и разбором. Такой файл не публикуется без
   проверки кода доступа (см. docs/PRODUCT BRIEF AND ROADMAP.md,
   пакет А2), поэтому он всегда собирается путём с ответами —
   в app/pdf-private/, а не в app/public. Ученической версии без
   плашек у тетради нет: задание на неё не предусматривает.

   Задачи, теория и ответы приходят из существующего банка задания
   №12 (src/lib/graph/) — детерминированно, по seed набора. Здесь
   нет ни одной задачи и ни одного ответа, придуманных заново:
   номер задачи только выбирает, какой вариант того же банка
   показать (см. TASK_MAP и SELECTION ниже).
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import generator from '../src/lib/graph/generate.js';
import solutionBuilder from '../src/lib/graph/solution.js';
import Line from '../src/lib/graph/families/line.js';
import renderer from '../src/lib/graph/renderer.js';
import tetrad from '../src/lib/sheet/tetrad.js';
import content from '../src/content/tetrad12.js';
import { buildSheet } from './lib/sheet-build.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(HERE, '..');
const DATA = path.join(APP, 'src', 'lib', 'graph', 'data');
const SECTION = 'zadanie-12';
const TETRAD_CSS = fs.readFileSync(
  path.join(APP, 'src', 'lib', 'sheet', 'tetrad.css'), 'utf8');

/* Чертёж в тетради крупнее, чем в сборнике задач: страница на одну
   задачу, места хватает — рамка одна на все чертежи, в миллиметрах. */
const FRAME = 70;

/* ══════════════════════════════════════════════════════════
   Банк
   ══════════════════════════════════════════════════════════ */
function readSets(dir) {
  const full = path.join(DATA, dir);
  return fs.readdirSync(full)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => JSON.parse(fs.readFileSync(path.join(full, name), 'utf8')));
}
const PREP_SETS = readSets('prep/12');
const PROTOTYPE_SETS = readSets('prototypes/12');
generator.setSets({ prep: PREP_SETS, prototypes: PROTOTYPE_SETS });

/* Правило ответа (k / b / equation-choice / value-at / …) лежит
   в описании задачи банка, а не в том, что возвращает генератор:
   generateSet() его не прокидывает (см. build-pdf-12.mjs, тот же
   приём). Плашке репетитора без него не выбрать ветку разбора. */
const ANSWER_RULES = {};
for (const set of [...PREP_SETS, ...PROTOTYPE_SETS]) {
  for (const task of set.tasks || []) { ANSWER_RULES[task.id] = task.answerRule; }
}

/* Номер задачи в исходном сборнике («1 / 46» и т.д.) → набор движка
   и место в нём. Те же границы, что в src/content/sheet12.js:
   номера 41–60 (принадлежность точки) тетрадь не использует —
   их нет в задании на неё. */
const RANGES = [
  { set: 'P12-1', from: 1, to: 10 },
  { set: 'P12-2', from: 11, to: 20 },
  { set: 'P12-6', from: 21, to: 30 },
  { set: 'P12-3', from: 31, to: 40 },
  { set: '12.A', from: 61, to: 80 },
  { set: '12.B', from: 81, to: 100 },
  { set: '12.C', from: 101, to: 120 },
  { set: '12.D', from: 121, to: 140 },
];

function taskByNumber(no) {
  const range = RANGES.find((r) => no >= r.from && no <= r.to);
  if (!range) { throw new Error('tetrad: номер ' + no + ' вне диапазонов банка'); }
  const tasks = generator.generateSet(range.set);
  const task = tasks[no - range.from];
  if (!task) { throw new Error('tetrad: в наборе ' + range.set + ' нет задачи № ' + no); }
  return task;
}

/* ══════════════════════════════════════════════════════════
   Плашка репетитора: ответ и разбор в 2–3 строки, оба — из
   движка. Формулы берутся тем же способом, что и краткие решения
   сборника №12 (src/lib/sheet/answers12.js): последняя формула
   каждого нужного шага solution.js, без пересчёта вручную.
   ══════════════════════════════════════════════════════════ */
function answerHtmlOf(task) {
  if (!task.options) { return task.answerHtml || String(task.answer); }
  const picked = task.options.filter((o) => o.number === task.answer)[0];
  return picked ? task.answer + ') ' + (picked.html || picked.text) : String(task.answer);
}

function lastFormula(step) {
  const list = (step.blocks || []).filter((b) => b.type === 'formula' && b.tex);
  return list.length ? { type: 'formula', tex: list[list.length - 1].tex } : null;
}

function tutorSummary(task) {
  const answerHtml = answerHtmlOf(task);
  const rule = ANSWER_RULES[task.id];

  let analysis = null;
  try { analysis = generator.analysis(task.id, task.meta.seed); } catch { analysis = null; }
  if (!analysis) { return { answerHtml, steps: [] }; }

  let steps;
  try {
    steps = solutionBuilder.build({
      triangle: analysis.triangle,
      line: analysis.line,
      window: analysis.task.meta.window,
      task: { rule: rule, answer: task.answer,
              query: task.meta.query, probe: task.meta.probe },
    });
  } catch { return { answerHtml, steps: [] }; }

  const t = analysis.triangle;
  const lines = [];

  if (rule === 'k') {
    lines.push({ type: 'text',
      html: t.rising ? 'Возрастает → k = +…' : 'Убывает → k = −…' });
    lines.push({ type: 'text', html: 'Катеты: ' + t.dy + ' и ' + t.dx + ' кл.' });
    const f = lastFormula(steps[1]); if (f) { lines.push(f); }
  } else if (rule === 'b') {
    lines.push({ type: 'text', html: 'Точка на прямой → b' });
    const f = lastFormula(steps[2]); if (f) { lines.push(f); }
  } else if (rule === 'equation-choice') {
    const f = lastFormula(steps[3]); if (f) { lines.push(f); }
  } else if (rule === 'value-at' || rule === 'argument-for') {
    const f1 = lastFormula(steps[3]); if (f1) { lines.push(f1); }
    const f2 = lastFormula(steps[4]); if (f2) { lines.push(f2); }
  }

  return { answerHtml, steps: lines };
}

function trainingItem(no, pdfNumber) {
  const task = taskByNumber(pdfNumber);
  const tutor = tutorSummary(task);
  return tetrad.trainingItem(
    Object.assign({}, task, { no: no }),
    { layout: 'single', frame: FRAME, withAnswerLine: true },
    tutor
  );
}

/* ══════════════════════════════════════════════════════════
   Чертежи теории: те же Line/renderer, что и у банка, — не
   отдельная картинка, а вызов движка с руками заданными k и b
   (в теории они не из банка, а из самого объяснения — «например,
   y = 2x − 1» и подобные, дословно из задания).
   ══════════════════════════════════════════════════════════ */
function lineScene(k, b, label) {
  const line = Line.create(k, b);
  const win = Line.windowFor(line);
  if (!win) { throw new Error('tetrad: не подобралось окно для k=' + k + ' b=' + b); }
  const points = Line.referencePoints(line, win) || [];
  return renderer.renderGraph({
    window: win,
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '0' },
    axisLabels: 'minimal',
    curves: [{ type: 'line', k: line.kValue, b: line.bValue, color: 'lineA',
               label: label === undefined ? 'y = f(x)' : label }],
    points: points.map((p) => ({ x: p.x, y: p.y, style: 'solid', color: 'lineA' })),
    alt: 'График линейной функции',
  });
}

/* ══════════════════════════════════════════════════════════
   Демо: по одной странице каждого из пяти типов + титул (этап 1).
   ══════════════════════════════════════════════════════════ */
function demoItems() {
  const c = content.lesson1;

  return [
    tetrad.dividerItem(c.dividerWhatIsIt),
    tetrad.theoryItem(Object.assign({}, c.theory1_2, {
      figureSvg: lineScene(2, -1),
      figureWidth: FRAME,
    })),
    tetrad.memoItem(c.memo1_6),
    trainingItem(1, 2),
    tetrad.calloutItem(content.lesson2.callout2_2),
  ];
}

/* ══════════════════════════════════════════════════════════
   Сборка документа
   ══════════════════════════════════════════════════════════ */
function spec(lesson, items) {
  const runner = lesson === 2 ? content.lesson2.runner : content.lesson1.runner;
  return {
    theme: 'color',
    layout: 'single',
    documentTitle: 'Тетрадь для репетитора · Задание 12 · Урок ' + lesson,
    head: content.head,
    runner: runner,
    /* titleBlock()/recapBlock() вычисляются в sheet.buildDocument
       безусловно, даже когда не используются: первая страница
       потока в тетради всегда получает компактную шапку, потому
       что титул уже занял место 0 (см. sheet/paginate.js). Поэтому
       spec.title нужен только формой, а не содержанием. */
    title: { chip: '', text: runner, subtitle: null },
    recap: null,
    titlePage: tetrad.titlePage(content.title(lesson)),
    blocks: [],
    withAnswerLine: false,
    extraItems: items,
    foot: content.foot,
  };
}

async function build(name, lesson, items, expectTasks) {
  return buildSheet(APP, SECTION, name, spec(lesson, items), {
    withAnswers: true,           /* тетрадь без проверки кода не публикуется */
    expectTasks: expectTasks,
    requireKatex: true,
    keepHtml: true,
    extraCss: TETRAD_CSS,
  });
}

async function demo() {
  const items = demoItems();
  console.log('Демо тетради: 6 страниц (титул + 5 типов)');
  await build('tetrad-12-demo', 1, items, 1);
}

async function main() {
  if (process.argv.includes('--demo')) {
    await demo();
    return;
  }
  console.log('Пока собран только режим --demo (этап 1). Урок 1, урок 2 и полная ' +
    'сборка появятся на следующих этапах.');
}

main().catch((error) => {
  console.error('\nсборка не удалась: ' + error.message);
  process.exit(1);
});
