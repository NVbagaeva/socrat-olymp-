#!/usr/bin/env node
/* scripts/check-hidden-points.mjs — инвариант «невидимой» точки, задание №12.

   Если в условии спрашивают координаты точки, которая по смыслу задачи
   на рисунке не видна (вторая точка пересечения B, точка пересечения
   прямых «за кадром»), она не попадает в окно рисунка: за рамкой не
   ближе клетки хотя бы по одной координате (lib/graph/hidden.js).

   Что проверяется:
   1. Все задачи со скрытой точкой во всех наборах (подготовка и
      прототипы, прямая, парабола, гипербола) — не меньше 500
      сгенерированных вариантов на каждую задачу: точка скрыта, на
      чертеже её маркера и подписи нет, в сценах разбора и подсказок —
      тоже (кроме окна шире исходного, которого сейчас нет нигде).
   2. Тексты: фраза «не видна / за рамкой / не видно» стоит только у
      наборов и задач, где точка действительно скрыта.
   3. Статичные чертежи сайта с той же ситуацией — «О задании»
      гиперболы, пример теории «Гипербола и прямая», миниатюры навыков
      12.C, 12.D, 12Q.H, 12Q.I, 12R.G, 12R.H: неотмеченная (искомая)
      точка пересечения скрыта.

   Запуск: pnpm test:hidden-points [--variants N]  (по умолчанию 500).
   Ненулевой код возврата — нарушение. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import generator from '../src/lib/graph/generate.js';
import SolutionQ from '../src/lib/graph/solution-quadratic.js';
import HintsQ from '../src/lib/graph/hints-quadratic.js';
import SolutionR from '../src/lib/graph/solution-rational.js';
import HintsR from '../src/lib/graph/hints-rational.js';
import { HIDDEN_MARGIN, isPointHidden, outsideBy } from '../src/lib/graph/hidden.js';
import { requireSrc } from './lib/load-ts.mjs';

const args = process.argv.slice(2);
const VARIANTS = args.includes('--variants') ? Number(args[args.indexOf('--variants') + 1]) : 500;
const MAX_SEEDS = VARIANTS * 4;

const ROOT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'lib',
  'graph',
  'data',
);
function readSets(dir) {
  const full = path.join(ROOT, dir);
  return fs.existsSync(full)
    ? fs
        .readdirSync(full)
        .filter((n) => n.endsWith('.json'))
        .sort()
        .map((n) => JSON.parse(fs.readFileSync(path.join(full, n), 'utf8')))
    : [];
}
const PREP = ['12', '12q', '12r'].flatMap((d) => readSets(path.join('prep', d)));
const PROTO = ['12', '12q', '12r'].flatMap((d) => readSets(path.join('prototypes', d)));
generator.setSets({ prep: PREP, prototypes: PROTO });

/* Нарушения группируются по задаче и виду: «задача: что» → сколько
   раз и первый пример. Иначе 500 вариантов одной задачи дают 500
   одинаковых строк. */
const errors = new Map();
function fail(what, example = '') {
  const item = errors.get(what) ?? { count: 0, example };
  item.count += 1;
  errors.set(what, item);
}
const v = (f) => (typeof f === 'number' ? f : f.p / f.q);
const near = (a, b) => Math.abs(a - b) < 1e-6;

/* ── Какие задачи со скрытой точкой ─────────────────────────── */

/** Задача спрашивает координату точки, которая на рисунке не видна. */
function hiddenTask(task) {
  const rule = task.answerRule || '';
  const cross = (task.constraints || {}).intersection;
  if (rule === 'cross-x' || rule === 'cross-y') {
    return true;
  } /* гипербола и прямая */
  if (!cross) {
    return false;
  }
  if (cross.visible === 'one') {
    return true;
  } /* парабола */
  if (cross.inside === false) {
    return true;
  } /* две прямые */
  return false;
}

/** Искомая точка задачи — по meta. */
function askedPoint(task) {
  const m = task.meta;
  const i = m.intersection;
  if (!i) {
    return null;
  }
  if (m.family === 'rational') {
    return { x: v(i.B.x), y: v(i.B.y) };
  }
  if (m.family === 'quadratic') {
    return { x: i.asked.x, y: i.asked.y };
  }
  return { x: i.x, y: i.y };
}

/* Сцены, которые могут оказаться в разборе и подсказках: объекты
   с окном и кривыми. Ищем в них маркер или подпись в искомой точке
   и окно шире исходного. */
function scenesIn(value, out = [], seen = new Set()) {
  if (value === null || typeof value !== 'object' || seen.has(value)) {
    return out;
  }
  seen.add(value);
  if (value.window && Array.isArray(value.curves)) {
    out.push(value);
  }
  for (const item of Array.isArray(value) ? value : Object.values(value)) {
    scenesIn(item, out, seen);
  }
  return out;
}

function sceneShowsPoint(scene, P) {
  const at = (x, y) => near(x, P.x) && near(y, P.y);
  if ((scene.points || []).some((pt) => at(pt.x, pt.y))) {
    return 'маркер';
  }
  if ((scene.shapes || []).some((sh) => Array.isArray(sh.at) && at(sh.at[0], sh.at[1]))) {
    return 'подпись';
  }
  return null;
}

function checkTask(set, source, task) {
  const where = `${set.id}/${task.id} seed ${task.meta.seed}`;
  const P = askedPoint(task);
  const win = task.meta.window;
  const id = `${set.id}/${task.id}`;
  if (!P || !win) {
    fail(`${id}: нет искомой точки или окна`, where);
    return;
  }
  if (!isPointHidden(P, win, HIDDEN_MARGIN)) {
    fail(
      `${id}: искомая точка видна на рисунке (внутри окна или ближе клетки к рамке)`,
      `${where}: (${P.x}; ${P.y}), окно ±${win.xmax}, вынос ${outsideBy(P, win).toFixed(2)}`,
    );
  }
  /* На чертеже нет маркера в этой точке и нет подписи «B». */
  if ((task.meta.points || []).some((pt) => near(pt.x, P.x) && near(pt.y, P.y))) {
    fail(`${id}: на чертеже отмечена искомая точка`, where);
  }
  if (task.svg && />\s*B\s*</.test(task.svg)) {
    fail(`${id}: на чертеже подпись B`, where);
  }
  /* Разбор и подсказки: их сцены — то же окно, точки B в них нет. */
  let extra = [];
  try {
    if (task.meta.family === 'quadratic') {
      extra = [SolutionQ.fromTask(task), HintsQ.fromTask(task)];
    } else if (task.meta.family === 'rational') {
      extra = [SolutionR.fromTask(task), HintsR.fromTask(task)];
    }
  } catch (error) {
    fail(`${id}: разбор или подсказка не собрались`, `${where}: ${error.message}`);
  }
  for (const scene of scenesIn(extra)) {
    const shown = sceneShowsPoint(scene, P);
    const w = scene.window;
    const wider = w.xmin < win.xmin || w.xmax > win.xmax || w.ymin < win.ymin || w.ymax > win.ymax;
    /* Расширенный рисунок с B допустим только в разборе учителя и
       с пометкой «за пределами исходного рисунка». */
    if (shown && !(wider && scene.outsideNote)) {
      fail(`${id}: ${shown} искомой точки в сцене разбора или подсказки`, where);
    }
  }
}

/* ── 1. Генерация: не меньше VARIANTS вариантов на задачу ───── */

let total = 0;
console.log(`невидимая точка: не меньше ${VARIANTS} вариантов на задачу`);
for (const set of PREP.concat(PROTO)) {
  const tasks = (set.tasks || []).filter(hiddenTask);
  if (!tasks.length) {
    continue;
  }
  const count = Object.fromEntries(tasks.map((t) => [t.id, 0]));
  let seeds = 0;
  let broken = 0;
  const started = Date.now();
  for (let run = 0; run < MAX_SEEDS; run++) {
    if (tasks.every((t) => count[t.id] >= VARIANTS)) {
      break;
    }
    const seed = run === 0 ? set.seed : set.seed * 10000 + run;
    seeds += 1;
    let built;
    try {
      built = generator.generateSet(set.id, seed);
    } catch {
      broken += 1;
      continue;
    }
    for (const task of built) {
      const source = tasks.find((t) => t.id === task.id);
      if (!source) {
        continue;
      }
      checkTask(set, source, task);
      count[task.id] += 1;
      total += 1;
    }
  }
  const least = Math.min(...Object.values(count));
  console.log(
    `  ${set.id.padEnd(8)} задач ${String(tasks.length).padStart(2)}, вариантов на задачу не меньше ${least}` +
      ` (seed ${seeds}, не собралось ${broken}), ${Date.now() - started} мс`,
  );
  for (const [id, n] of Object.entries(count)) {
    if (n < VARIANTS) {
      fail(`${set.id}/${id}: собрано ${n} вариантов из ${VARIANTS}`);
    }
  }
}
console.log(`вариантов проверено: ${total}`);

/* ── 2. Тексты: «не видна» — только там, где правда ─────────── */

const HIDDEN_WORDS = /не вид(на|но|ны)|за рамк|за предел|за кадр/i;
for (const set of PREP.concat(PROTO)) {
  const crossTasks = (set.tasks || []).filter((t) => /cross|intersection/.test(t.answerRule || ''));
  if (HIDDEN_WORDS.test(`${set.subtitle || ''} ${set.lead || ''}`)) {
    for (const t of crossTasks) {
      if (!hiddenTask(t)) {
        fail(`${set.id}: в подзаголовке набора точка скрыта, а у ${t.id} она видна`);
      }
    }
  }
  for (const t of crossTasks) {
    const text = `${t.question || ''} ${t.hint || ''} ${t.levelReason || ''}`;
    if (HIDDEN_WORDS.test(text) && !hiddenTask(t)) {
      fail(`${set.id}/${t.id}: текст говорит, что точка не видна, а она видна`);
    }
  }
}

/* ── 3. Статичные чертежи ───────────────────────────────────── */

const S = requireSrc('lib/scenes');

function valueOf(curve, x) {
  if (curve.type === 'line') {
    return curve.k * x + curve.b;
  }
  if (curve.type === 'quadratic') {
    return curve.a * x * x + curve.b * x + curve.c;
  }
  if (curve.type === 'rational') {
    const d = x + (curve.a || 0);
    return Math.abs(d) < 1e-12 ? NaN : curve.k / d + (curve.b || 0);
  }
  throw new Error(`нет формулы для «${curve.type}»`);
}

/** Точки пересечения двух кривых сцены: численно, на широком отрезке. */
function crossings(c1, c2) {
  const out = [];
  const f = (x) => valueOf(c1, x) - valueOf(c2, x);
  const step = 0.01;
  for (let x = -60; x < 60; x += step) {
    const a = f(x);
    const b = f(x + step);
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      continue;
    }
    if (Math.abs(a) < 1e-12 || a * b < 0) {
      let lo = x;
      let hi = x + step;
      for (let i = 0; i < 60; i++) {
        const mid = (lo + hi) / 2;
        if (f(lo) * f(mid) <= 0) {
          hi = mid;
        } else {
          lo = mid;
        }
      }
      /* Разрыв гиперболы — не пересечение. */
      if (Math.abs(f(lo)) > 1e-3) {
        continue;
      }
      const px = (lo + hi) / 2;
      if (!out.some((p) => Math.abs(p.x - px) < 1e-4)) {
        out.push({ x: px, y: valueOf(c1, px) });
      }
    }
  }
  return out;
}

const STATIC = [
  ['«О задании» гиперболы (карточка «Точка B не видна»)', S.hyperbolaAndLineScene()],
  ['теория гиперболы, «Гипербола и прямая»', S.rationalTheoryScene('line-example')],
  ['миниатюра 12R.G', S.generatorSkillScene('12R.G')],
  ['миниатюра 12R.H', S.generatorSkillScene('12R.H')],
  ['миниатюра 12Q.H', S.generatorSkillScene('12Q.H')],
  ['миниатюра 12Q.I', S.generatorSkillScene('12Q.I')],
  ['миниатюра 12.C', S.generatorSkillScene('12.C')],
  ['миниатюра 12.D', S.generatorSkillScene('12.D')],
];
for (const [name, scene] of STATIC) {
  const curves = scene.curves.filter((c) => ['line', 'quadratic', 'rational'].includes(c.type));
  if (curves.length !== 2) {
    fail(`${name}: ожидались две кривые`);
    continue;
  }
  const points = crossings(curves[0], curves[1]);
  const marked = (scene.points || []).filter((pt) =>
    points.some((p) => Math.abs(p.x - pt.x) < 0.01 && Math.abs(p.y - pt.y) < 0.01),
  );
  const asked = points.filter(
    (p) => !marked.some((pt) => Math.abs(p.x - pt.x) < 0.01 && Math.abs(p.y - pt.y) < 0.01),
  );
  if (!asked.length) {
    fail(`${name}: нет неотмеченной точки пересечения`);
  }
  for (const p of asked) {
    if (!isPointHidden(p, scene.window, HIDDEN_MARGIN)) {
      fail(
        `${name}: точка (${p.x.toFixed(2)}; ${p.y.toFixed(2)}) видна на рисунке ±${scene.window.xmax}`,
      );
    }
  }
  console.log(`  ${name}: отмечено ${marked.length}, искомых за рамкой ${asked.length}`);
}

/* Карточка «Возможные формулировки» гиперболы говорит, что B не видна. */
const rationalText = fs.readFileSync(
  path.join(ROOT, '..', '..', '..', 'content', 'rational.ts'),
  'utf8',
);
if (!/Точка \$B\$ не видна на рисунке/.test(rationalText)) {
  console.log('  (фразы «Точка B не видна на рисунке» в карточке гиперболы больше нет)');
}

if (errors.size) {
  console.error(`\nНАРУШЕНИЯ (${errors.size}):`);
  for (const [what, item] of errors) {
    console.error(
      `  • ${what}${item.count > 1 ? ` — ${item.count} раз` : ''}${item.example ? `; например, ${item.example}` : ''}`,
    );
  }
  process.exit(1);
}
console.log('\nнарушений: 0 — невидимые точки на рисунках не видны');
