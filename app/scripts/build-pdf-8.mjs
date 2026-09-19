#!/usr/bin/env node
/* scripts/build-pdf-8.mjs — сборник PDF «Задание 8. Вычисления
   и преобразования».

   Запуск:
     node scripts/build-pdf-8.mjs            все четыре файла сборника
     node scripts/build-pdf-8.mjs --sample   образец: первый навык, обе темы
     node scripts/build-pdf-8.mjs --draft    то же, что без ключей, но
                                             без требования KaTeX

   Готовый сборник собирается только с KaTeX. Ключ --draft — проверить
   состав и разбиение на страницы там, где пакет недоступен; выпускать
   такой файл нельзя, и в его отчёте так и написано.

   Задачи, условия, ответы и разборы приходят из движка
   lib/vychisleniya/generate.ts и того же банка, что видит ученик
   в тренажёре (lib/vychisleniya/bank.ts): десять зафиксированных
   вариантов на каждый из 26 прототипов, сгруппированных по 11
   навыкам. В этом файле ни одного условия и ни одного ответа нет
   и быть не может: движок и банк считают их сами.

   Слова листа — в src/content/sheet8.js, вёрстка — в src/lib/sheet/.
*/

import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { answersItems } from '../src/lib/sheet/answers8.js';
import { sectionHead } from '../src/lib/sheet/answers.js';
import content from '../src/content/sheet8.js';
import { requireSrc } from './lib/load-ts.mjs';
import { buildSheet } from './lib/sheet-build.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(HERE, '..');
const SECTION = 'zadanie-8';

const { BANK } = requireSrc('lib/vychisleniya/bank');
const { generate } = requireSrc('lib/vychisleniya/generate');
const { ru } = requireSrc('lib/vychisleniya/numbers');
const { SKILLS } = requireSrc('lib/vychisleniya/skills');
const { SKILL_FORMULA } = requireSrc('content/vychisleniya');

/* typeset() через прямой require('katex'), а не через src/lib/tex.ts:
   у того модуля есть `import 'katex/dist/katex.min.css'», а пакет
   собран как ESM («type»: «module»); формула-заглушка .css вместо
   .js обычным CommonJS require katex решается штатно — тем же
   пакетом, тот же вызов renderToString, что и в lib/tex.ts. */
const require = createRequire(import.meta.url);
const katex = require('katex');
function typeset(text) {
  return String(text).replace(/\$([^$]+)\$/g, (_match, formula) =>
    katex.renderToString(formula, { throwOnError: false, displayMode: false }));
}

/* ══════════════════════════════════════════════════════════
   Банк
   ══════════════════════════════════════════════════════════ */

/** Разбор задачи: шаги и строка ответа — та же вёрстка, что у листа
    из генератора (lib/vychisleniya/sheet8.ts), своя копия здесь:
    сборник PDF и интерактивный генератор не делят код по правилу
    «одна страница — один источник задач». */
function razborHtml(lines, answerText) {
  const items = lines.map((line) => '<li class="sheet-step">' + typeset(line) + '</li>').join('');
  return '<ol class="sheet-steps">' + items + '</ol>' +
    '<p class="sheet-task-answer">Ответ: <b>' + answerText + '</b></p>';
}

/**
 * Блоки сборника — по одному на навык S1…S11, сквозная нумерация.
 * Задачи — весь зафиксированный банк: десять вариантов на каждый
 * прототип навыка, в том порядке, что в отчёте банка (этап 3).
 */
function collectBlocks(limitSkills, limitTasks, withAnswers) {
  let number = 0;
  const chosen = limitSkills ? SKILLS.slice(0, limitSkills) : SKILLS;

  return chosen.map((skill) => {
    let entries = skill.prototypes.flatMap((protoId) => {
      const entry = BANK.find((item) => item.prototype === protoId);
      if (entry === undefined) { throw new Error('банк: нет прототипа ' + protoId); }
      return entry.variants.map((variant) => ({ protoId, variant }));
    });
    if (limitTasks) { entries = entries.slice(0, limitTasks); }

    return {
      title: skill.nazvanie,
      note: '',
      set: skill.id,
      tasks: entries.map(({ protoId, variant }) => {
        const task = generate(protoId, variant.seed, variant.level);
        const answerText = ru(task.otvet);
        number += 1;
        return {
          no: number,
          id: protoId + '#' + variant.n,
          questionHtml: typeset(task.uslovie),
          options: null,
          figureSvg: null,
          answer: answerText,
          answerHtml: null,
          solutionHtml: withAnswers ? razborHtml(task.razbor, answerText) : null,
        };
      }),
    };
  });
}

/* ══════════════════════════════════════════════════════════
   «Ключевые формулы»: одна карточка на навык, перед задачами
   ══════════════════════════════════════════════════════════ */
function formulasLead() {
  const cells = SKILLS.map((skill) =>
    '<div class="z8-pdf-formula"><b>' + skill.nazvanie + '</b>' +
      '<span>' + typeset('$' + (SKILL_FORMULA[skill.id] || '') + '$') + '</span></div>').join('');
  return [
    sectionHead('Ключевые формулы', SKILLS.length + ' навыков раздела'),
    '<div class="sheet-item z8-pdf-formulas">' + cells + '</div>',
  ];
}

/** Стили карточек с формулами — сверх общего шаблона, только для
    этого сборника: токены темы те же, что у остальных элементов
    листа, свой цвет здесь не заводится. */
const EXTRA_CSS = '.z8-pdf-formulas{display:grid;grid-template-columns:repeat(2,1fr);' +
  'gap:calc(var(--sheet-step) * 2);margin:calc(var(--sheet-step) * 2) 0 calc(var(--sheet-step) * 5);}' +
  '.z8-pdf-formula{display:flex;align-items:center;justify-content:space-between;gap:calc(var(--sheet-step) * 2);' +
  'padding:calc(var(--sheet-step) * 2) calc(var(--sheet-step) * 3);border:1px solid var(--sheet-card-line);' +
  'border-radius:var(--sheet-radius-md);font-size:var(--sheet-fs-small);color:var(--sheet-ink);}' +
  '.z8-pdf-formula .katex{font-size:1.05em;}';

/* ══════════════════════════════════════════════════════════
   Описание листа
   ══════════════════════════════════════════════════════════ */
function spec(blocks, options) {
  return {
    theme: options.theme,
    layout: 'single',
    documentTitle: content.title.chip + '. ' + content.title.text,
    head: content.head,
    runner: content.runner,
    title: content.title,
    recap: null,
    leadItems: formulasLead(),
    blocks,
    withAnswerLine: !options.withAnswers,
    extraItems: options.withAnswers ? answersItems(blocks) : [],
    foot: content.foot,
  };
}

/* Раскладка сборника — одна колонка: у задач №8 нет чертежей, но
   формулы в две колонки читаются теснее, а сборник рассчитан на
   печать и чтение с листа, не на экономию бумаги. */

async function build(name, blocks, options) {
  const expected = blocks.reduce((sum, block) => sum + block.tasks.length, 0);
  return buildSheet(APP, SECTION, name, spec(blocks, options), {
    withAnswers: Boolean(options.withAnswers),
    expectTasks: expected,
    requireKatex: options.requireKatex,
    keepHtml: options.keepHtml,
    extraCss: EXTRA_CSS,
  });
}

async function sample() {
  /* Образец: первый навык, десять задач, в утверждённой раскладке. */
  const blocksNo = collectBlocks(1, 10, false);
  const blocksYes = collectBlocks(1, 10, true);
  console.log('Образец: навык «' + blocksNo[0].title + '», задач ' + blocksNo[0].tasks.length);

  for (const theme of ['color', 'print']) {
    await build('obrazec' + (theme === 'print' ? '-chb' : '-cvet'),
      blocksNo, { theme, keepHtml: true, withAnswers: false });
  }
  await build('obrazec-otvety', blocksYes, { theme: 'color', keepHtml: true, withAnswers: true });
}

async function full(draft) {
  const withoutAnswers = collectBlocks(0, 0, false);
  const withAnswers = collectBlocks(0, 0, true);
  const total = withoutAnswers.reduce((sum, block) => sum + block.tasks.length, 0);
  console.log('Сборник: навыков ' + withoutAnswers.length + ', задач ' + total);

  const files = [
    { name: content.files.uchenik, theme: 'color', withAnswers: false },
    { name: content.files.uchenikChb, theme: 'print', withAnswers: false },
    { name: content.files.uchitel, theme: 'color', withAnswers: true },
    { name: content.files.uchitelChb, theme: 'print', withAnswers: true },
  ];

  for (const file of files) {
    await build(file.name, file.withAnswers ? withAnswers : withoutAnswers, {
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

main().catch((error) => {
  console.error('\nсборка не удалась: ' + error.message);
  process.exit(1);
});
