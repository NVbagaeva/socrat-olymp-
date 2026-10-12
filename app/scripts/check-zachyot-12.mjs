#!/usr/bin/env node
/* scripts/check-zachyot-12.mjs — «Весь №12»: зачётная работа и генератор
   по всем типам, без браузера.

   Зачётная:
     • по одному адресу (коду работы) варианты собираются одинаково —
       в этом процессе и в отдельном процессе Node (отпечаток сверяется);
     • у всех вариантов один состав прототипов: место N — один набор;
     • задача не повторяется ни внутри варианта, ни между вариантами;
     • «Только ФИПИ» — только задачи открытого банка;
     • новый код — другие задачи;
     • листы ученика и учителя собираются; в листе учителя — таблица
       ответов всех вариантов и шкала оценок, ответы в ней — движка.
   Генератор по всем типам:
     • лист по типам с рамкой «Запомни» и разобранными примерами
       собирается; задач столько, сколько заказано.

   node scripts/check-zachyot-12.mjs            — проверка
   node scripts/check-zachyot-12.mjs --print K  — отпечаток работы с кодом K
   Ненулевой код возврата — проверка не прошла. */

import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { requireSrc } from './lib/load-ts.mjs';

const { ves12Catalog } = requireSrc('lib/ves12/catalog.ts');
const work = requireSrc('lib/ves12/work.ts');
const build = requireSrc('lib/ves12/build.ts');
const { buildDocument } = requireSrc('lib/sheet/sheet.js');
const { sheetSpec } = requireSrc('lib/generatorSheet.ts');
const { isFipiTask } = requireSrc('lib/ves12/fipi.ts');
const { prototypes } = requireSrc('lib/graph/data/index.js');

const catalog = ves12Catalog();
const errors = [];
const bad = (text) => errors.push(text);

/** Параметры работы: counts — по шаблону или явно; types — только эти типы. */
function params(code, source, variants, perType = 2, types = null, extra = {}) {
  const counts = {};
  work.openTypes(catalog).forEach((type) => {
    counts[type.id] = types === null || types.includes(type.id) ? perType : 0;
  });
  return {
    counts,
    off: [],
    analogs: [],
    variants,
    source,
    minutes: 24,
    grades: work.DEFAULT_GRADES,
    order: 'types',
    title: work.DEFAULT_TITLE,
    teacher: 'Иванова А. Б.',
    code,
    ...extra,
  };
}

/** Отпечаток вариантов: id, условие и ответ каждой задачи. */
function fingerprint(built) {
  const text = built.variants
    .map((v) => v.tasks.map((t) => `${t.setId}|${t.task.id}|${t.task.questionHtml}|${t.task.answer}`).join('\n'))
    .join('\n--\n');
  return crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
}

/* Отпечаток для другого процесса. */
if (process.argv.includes('--print')) {
  const code = process.argv[process.argv.indexOf('--print') + 1];
  console.log(fingerprint(build.buildWork(params(code, 'all', 3), catalog)));
  process.exit(0);
}

function checkWork(p) {
  const label = `${p.code} ${p.source} ×${p.variants}`;
  const built = build.buildWork(p, catalog);
  const plan = work.planWork(p, catalog);
  if (built.missing > 0 || plan.shortages.length > 0) {
    bad(`${label}: банк не дал ${built.missing} задач, нехваток в плане ${plan.shortages.length}`);
  }
  const seen = new Set();
  built.variants.forEach((variant) => {
    const slots = plan.variants[variant.no - 1].map((slot) => slot.setId);
    if (variant.tasks.length !== plan.perVariant) {
      bad(`${label}: в варианте ${variant.no} задач ${variant.tasks.length}, а в плане ${plan.perVariant}`);
    }
    variant.tasks.forEach((item, i) => {
      if (item.setId !== slots[i]) {
        bad(`${label}: вариант ${variant.no}, место ${i + 1} — ${item.setId}, а в плане ${slots[i]}`);
      }
      const key = build.shownKey(item.task);
      if (seen.has(key)) {
        bad(`${label}: задача ${item.task.id} повторяется (вариант ${variant.no})`);
      }
      seen.add(key);
      if (work.typeSource(p, item.type.id) === 'fipi') {
        const raw = prototypes.find((set) => set.id === item.setId);
        if (!isFipiTask(raw, item.task.id)) {
          bad(`${label}: ${item.task.id} — не из открытого банка`);
        }
      }
    });
  });
  const again = build.buildWork(p, catalog);
  if (fingerprint(again) !== fingerprint(built)) {
    bad(`${label}: повторная сборка дала другие задачи`);
  }
  return built;
}

/* У каждого готового типа есть задачи ФИПИ; у типов, где набор целиком —
   прототипы банка, их столько же, сколько задач в тренажёре раздела. */
const { manifest } = requireSrc('lib/generator/manifest.ts');
work.openTypes(catalog).forEach((type) => {
  const fipi = type.sets.reduce((sum, set) => sum + (set.fipi === null ? set.count : set.fipi), 0);
  const trainer = manifest.families.find((family) => family.id === type.id).prototypes.tasks;
  if (fipi <= 0) {
    bad(`«${type.title}»: задач ФИПИ 0`);
  }
  if (type.sets.every((set) => set.fipi === null) && fipi !== trainer) {
    bad(`«${type.title}»: задач ФИПИ ${fipi}, а в тренажёре раздела ${trainer}`);
  }
});

/* Шаблон «Весь №12, как на ЕГЭ»: все готовые типы по 2, по банку ФИПИ. */
const ege = work.templates(catalog).find((item) => item.id === 'ege');
if (ege === undefined || Object.values(ege.counts).some((n) => n !== 2)) {
  bad('шаблон «Весь №12, как на ЕГЭ» — не все типы по 2');
}
checkWork(params('7K3F-00', 'fipi', 1));
/* Два варианта по банку ФИПИ: прямая и показательная. */
const base = checkWork(params('7K3F-00', 'fipi', 2, 2, ['linear', 'exponential']));
/* Задач меньше, чем прототипов: прототипы идут по кругу между вариантами. */
{
  const p = params('R0T4-00', 'all', 2, 1, ['quadratic']);
  const plan = work.planWork(p, catalog);
  if (plan.variants[0][0].setId === plan.variants[1][0].setId) {
    bad('1 задача параболы, 2 варианта: прототип в вариантах один и тот же');
  }
}
/* Выключенный прототип в работу не попадает. */
{
  const p = params('0FF0-00', 'all', 2, 3, ['exponential'], { off: ['12E.D'] });
  const built = checkWork(p);
  if (built.variants.some((v) => v.tasks.some((t) => t.setId === '12E.D'))) {
    bad('выключенный прототип 12E.D попал в работу');
  }
}
/* «Добавить аналоги для этого типа» снимает нехватку. */
{
  const p = params('A7A7-00', 'fipi', 2, 4, ['trigonometric']);
  const sh = work.planWork(p, catalog).shortages;
  if (sh.length !== 1 || sh[0].enough !== 1) {
    bad(`тригонометрия, 4 задачи × 2 варианта по ФИПИ: ждали «хватает на 1 вариант», план: ${JSON.stringify(sh.map((x) => x.enough))}`);
  }
  const fixed = { ...p, analogs: ['trigonometric'] };
  if (work.planWork(fixed, catalog).shortages.length > 0) {
    bad('тригонометрия с аналогами: нехватка осталась');
  }
  checkWork(fixed);
}
checkWork(params('AB12-00', 'all', 4));
checkWork(params('ZZ99-00', 'all', 3, 3));
checkWork(params('Q0Q0-00', 'fipi', 1, 1));

/* Новый код — другие задачи. */
const other = build.buildWork(params('M4N5-00', 'all', 2), catalog);
const first = build.buildWork(params('AB12-00', 'all', 2), catalog);
if (fingerprint(other) === fingerprint(first)) {
  bad('новый код дал те же задачи');
}

/* Нехватка банка ФИПИ видна в плане до сборки. */
/* «Весь №12» по ФИПИ на 2 варианта: прототипы идут по кругу, банка хватает. */
checkWork(params('E6E2-00', 'fipi', 2));

/* Адрес настроек (без кода) туда и обратно. */
{
  const p = params('7K3F-00', 'fipi', 3, 2, null, { off: ['12E.D'], analogs: ['trigonometric'], order: 'mix' });
  const { code: _code, ...settings } = p;
  const back = work.parseSettings(new URLSearchParams(work.settingsQuery(settings)));
  const strip = (x) => ({ ...x, counts: Object.fromEntries(Object.entries(x.counts).filter(([, n]) => n > 0)) });
  if (JSON.stringify(strip(back)) !== JSON.stringify(strip(settings))) {
    bad(`адрес настроек не восстанавливает их: ${JSON.stringify(back)}`);
  }
}

/* Адрес работы туда и обратно. */
const p0 = params('7K3F-00', 'fipi', 2, 2, ['linear', 'exponential']);
const parsed = work.parseWorkQuery(new URLSearchParams(work.workQuery(p0)));
const stripZero = (x) => ({ ...x, counts: Object.fromEntries(Object.entries(x.counts).filter(([, n]) => n > 0)) });
if (JSON.stringify(stripZero(parsed)) !== JSON.stringify(stripZero(p0))) {
  bad(`адрес работы не восстанавливает параметры: ${JSON.stringify(parsed)}`);
}

/* Другой процесс — тот же отпечаток. */
const here = fingerprint(build.buildWork(params('PR0C-00', 'all', 3), catalog));
const there = execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--print', 'PR0C-00'], {
  encoding: 'utf8',
}).trim();
if (here !== there) {
  bad(`другой процесс собрал другие варианты: ${here} ≠ ${there}`);
}

/* Листы зачётной. */
for (const withAnswers of [false, true]) {
  const spec = build.workSheetSpec(p0, base, withAnswers);
  const html = buildDocument({ ...spec, kit: `Работа ${p0.code}` }, {});
  const tasks = (html.match(/class=\\"sheet-task sheet-task--single/g) ?? []).length;
  const want = base.variants.reduce((sum, v) => sum + v.tasks.length, 0);
  if (tasks !== want) {
    bad(`лист ${withAnswers ? 'учителя' : 'ученика'}: карточек задач ${tasks}, а задач ${want}`);
  }
  if (withAnswers) {
    if (!html.includes('sheet-work-key')) {
      bad('лист учителя: нет общей таблицы ответов');
    }
    if (!html.includes('Шкала оценок')) {
      bad('лист учителя: нет шкалы оценок');
    }
    if (!/Решения по[\s\u00a0]шагам/.test(html) || !html.includes('sheet-solution')) {
      bad('лист учителя: нет решений по шагам');
    }
  } else if (/Ответ:<\\\/b>|sheet-solution/.test(html)) {
    bad('лист ученика: в нём решения');
  }
}

/* Генератор по всем типам. */
const sets = work.openTypes(catalog).flatMap((type) => type.sets.map((set) => set.id));
const genParams = {
  skills: sets,
  count: sets.length * 2,
  level: null,
  seed: 'gen-test',
  theme: 'color',
  layout: 'single',
  kind: 'Лист для отработки',
  date: '',
  variants: 1,
  order: 'types',
  theory: true,
  examples: 1,
};
const gen = sheetSpec(genParams, false, 'Графики функций');
const genTasks = gen.blocks.reduce((sum, block) => sum + block.tasks.length, 0);
if (genTasks !== genParams.count) {
  bad(`генератор по всем типам: задач ${genTasks}, заказано ${genParams.count}`);
}
const openTypes = catalog.types.filter((type) => !type.soon).length;
if (gen.blocks.length !== openTypes) {
  bad(`генератор по всем типам: блоков ${gen.blocks.length}, открытых типов ${openTypes}`);
}
gen.blocks.forEach((block) => {
  if (!block.recap) {
    bad(`генератор: у блока «${block.title}» нет рамки «Запомни»`);
  }
  if ((block.leadItems ?? []).length !== 1) {
    bad(`генератор: у блока «${block.title}» примеров ${(block.leadItems ?? []).length}, а не 1`);
  }
});
buildDocument(gen, {});

/* По первому прототипу каждого типа (выбор генератора по умолчанию), два
   примера на тип: пример находится и там, где у выбранного прототипа
   разбора нет (знак коэффициента параболы). */
const firstOnly = work.openTypes(catalog).map((type) => type.sets[0].id);
const gen2 = sheetSpec({ ...genParams, skills: firstOnly, count: firstOnly.length * 2, examples: 2 }, false, 'Графики функций');
gen2.blocks.forEach((block) => {
  if ((block.leadItems ?? []).length !== 2) {
    bad(`генератор (первые прототипы): у блока «${block.title}» примеров ${(block.leadItems ?? []).length}, а не 2`);
  }
});

if (errors.length > 0) {
  console.error(`Весь №12 — расхождения (${errors.length}):`);
  errors.slice(0, 40).forEach((line) => console.error('  ✗ ' + line));
  process.exit(1);
}
console.log(
  `Весь №12: типов ${openTypes}, в варианте ${work.tasksLabel(base.variants[0].tasks.length)}, ` +
    `варианты без повторов, код воспроизводит работу в двух процессах, листы и генератор собираются.`,
);
