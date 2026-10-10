#!/usr/bin/env node
/* scripts/build-pdf-9.mjs — сборник PDF «Задание 9. Производная
   и первообразная».

   Запуск:
     node scripts/build-pdf-9.mjs            все четыре файла сборника
     node scripts/build-pdf-9.mjs --sample   образец: первая группа, обе темы
     node scripts/build-pdf-9.mjs --draft    то же, что без ключей, но
                                             без требования KaTeX

   Готовый сборник собирается только с KaTeX. Ключ --draft — проверить
   состав и разбиение на страницы там, где пакет недоступен; выпускать
   такой файл нельзя.

   Лист — тот же, что собирает генератор (lib/proizvodnaya/sheet9.ts):
   рамки «Запомни», разобранные примеры, карточки задач с рисунками
   режима 'student', у учителя — разбор по этапам и рисунок построений.
   Отличие одно: задачи не по seed адреса, а фиксированные — банк
   тренажёра lib/proizvodnaya/bank.ts (десять вариантов на прототип),
   а пока банка нет — десять seed «<прототип>#1 … #10». В этом файле
   ни одного условия и ни одного ответа нет: считает движок.

   Слова листа — в src/content/sheet9.js, вёрстка — в src/lib/sheet/.
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import content from '../src/content/sheet9.js';
import { requireSrc } from './lib/load-ts.mjs';
import { buildSheet } from './lib/sheet-build.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(HERE, '..');
const SECTION = 'zadanie-9';

const S9 = requireSrc('lib/proizvodnaya/sheet9.ts');
const { GRUPPY, prototypesOfGroup } = requireSrc('lib/proizvodnaya/skills.ts');

/** Печатная CSS страницы листа: рисунки графиков в ч/б теме. */
export const EXTRA_CSS = fs.readFileSync(
  path.join(APP, 'src', 'app', 'zadaniya', '9', 'pechat', 'pechat9.css'),
  'utf8',
);

/** Варианты прототипа: банк тренажёра, а без него — десять seed подряд. */
export function variantsOf(prototypeId) {
  const file = path.join(APP, 'src', 'lib', 'proizvodnaya', 'bank.ts');
  if (fs.existsSync(file)) {
    const entry = requireSrc('lib/proizvodnaya/bank.ts').BANK.find(
      (e) => e.prototype === prototypeId,
    );
    if (entry !== undefined) {
      return entry.variants.map((v) => ({ prototype: prototypeId, seed: v.seed, n: v.n }));
    }
  }
  return Array.from({ length: 10 }, (_, i) => ({
    prototype: prototypeId,
    seed: `${prototypeId}#${i + 1}`,
    n: i + 1,
  }));
}

/** План сборника: по группе блок, внутри — прототипы по порядку кодов. */
export function planOf(limitGroups, limitTasks) {
  const groups = GRUPPY.filter((g) => prototypesOfGroup(g.id).length > 0);
  return (limitGroups ? groups.slice(0, limitGroups) : groups).map((g) => {
    let tasks = prototypesOfGroup(g.id).flatMap((p) => variantsOf(p.id));
    if (limitTasks) {
      tasks = tasks.slice(0, limitTasks);
    }
    return { group: g.id, tasks };
  });
}

function blocksOf(plan, withAnswers) {
  return S9.fixedBlocks9(plan, { layout: 'single', ramki: 2 }, withAnswers);
}

function specOf(blocks, options) {
  return S9.printSpec9({
    ...S9.specOfBlocks9(
      blocks,
      { theme: options.theme, layout: 'single', kind: '', date: '' },
      options.withAnswers,
    ),
  });
}

async function build(name, plan, options) {
  const blocks = blocksOf(plan, options.withAnswers);
  const expected = blocks.reduce((sum, block) => sum + block.tasks.length, 0);
  return buildSheet(APP, SECTION, name, specOf(blocks, options), {
    withAnswers: Boolean(options.withAnswers),
    expectTasks: expected,
    requireKatex: options.requireKatex,
    keepHtml: options.keepHtml,
    extraCss: EXTRA_CSS,
  });
}

async function sample() {
  const plan = planOf(1, 10);
  console.log('Образец: группа ' + plan[0].group + ', задач ' + plan[0].tasks.length);
  for (const theme of ['color', 'print']) {
    await build('obrazec' + (theme === 'print' ? '-chb' : '-cvet'), plan, {
      theme,
      keepHtml: true,
      withAnswers: false,
    });
  }
  await build('obrazec-otvety', plan, { theme: 'color', keepHtml: true, withAnswers: true });
}

async function full(draft) {
  const plan = planOf(0, 0);
  const total = plan.reduce((sum, g) => sum + g.tasks.length, 0);
  console.log('Сборник: групп ' + plan.length + ', задач ' + total);

  const files = [
    { name: content.files.uchenik, theme: 'color', withAnswers: false },
    { name: content.files.uchenikChb, theme: 'print', withAnswers: false },
    { name: content.files.uchitel, theme: 'color', withAnswers: true },
    { name: content.files.uchitelChb, theme: 'print', withAnswers: true },
  ];
  for (const file of files) {
    await build(file.name, plan, {
      theme: file.theme,
      withAnswers: file.withAnswers,
      requireKatex: !draft,
      keepHtml: true,
    });
  }
}

async function main() {
  if (process.argv.includes('--sample')) {
    await sample();
    return;
  }
  await full(process.argv.includes('--draft'));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error('\nсборка не удалась: ' + error.message);
    process.exit(1);
  });
}
