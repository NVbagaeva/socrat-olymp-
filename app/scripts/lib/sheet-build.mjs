/* scripts/lib/sheet-build.mjs — общая сборка печатного листа в PDF.

   Один и тот же путь для любого сборника: сборника №12, сборника №4,
   всего, что ещё будет печататься шаблоном lib/sheet/. Здесь:

     • куда ложится готовый файл — спрашивается у sheet/outputs.js
       и зависит от того, есть ли в файле ответы;
     • печать через sheet-render.mjs и проверка отчёта пагинатора:
       все ли задачи встали на лист, нет ли куска выше страницы,
       принял ли KaTeX каждую формулу;
     • промежуточный HTML и отчёт — в служебную папку .pdf-build,
       по ним работают автотесты и снимки страниц.

   Что печатать — описание листа (spec) — собирает сборник сам:
   про задание этот модуль не знает ничего.
*/

import fs from 'node:fs';
import path from 'node:path';

import outputs from '../../src/lib/sheet/outputs.js';
import { renderPdf } from './sheet-render.mjs';

/** Служебная папка с промежуточным HTML и отчётами. В сборку не идёт. */
export function buildDir(app) {
  return path.join(app, '.pdf-build');
}

/**
 * Путь готового файла — и страховка от ответов в public.
 *
 * Файл для ученика идёт в public и отдаётся сайтом, файл для учителя —
 * в папку вне репозитория и уезжает архивом из CI. Репозиторий
 * публичный, и всё из public доступно по прямому адресу.
 */
export function outputFor(app, section, name, withAnswers) {
  const where = outputs.target(app, { name, section, withAnswers });
  outputs.assertSafe(where.file, withAnswers);
  return where;
}

/**
 * Печать одного файла с проверкой отчёта.
 *
 * spec — описание листа для sheet.buildDocument.
 * options:
 *   withAnswers   есть ли в файле ответы: решает папку назначения
 *   expectTasks   сколько задач должно оказаться на листе
 *   requireKatex  падать, если формулы набраны запасным набором
 *   keepHtml      оставить промежуточный HTML и отчёт в .pdf-build
 *   extraCss      стили сверх шаблона: например, рисунки раздела
 *
 * Возвращает отчёт пагинатора. Любое расхождение — ошибка: молча
 * выпустить PDF с потерянной задачей нельзя.
 */
export async function buildSheet(app, section, name, spec, options) {
  const where = outputFor(app, section, name, Boolean(options.withAnswers));
  const file = where.file;
  const report = await renderPdf(spec, file, {
    keepHtml: options.keepHtml ? path.join(buildDir(app), name + '.html') : null,
    requireKatex: options.requireKatex,
    extraCss: options.extraCss,
  });

  if (report.tasks !== options.expectTasks) {
    throw new Error(name + ': на листе ' + report.tasks + ' задач, в банке ' + options.expectTasks);
  }
  if (report.overflowing.length) {
    throw new Error(name + ': куски выше страницы — ' + report.overflowing.join(', '));
  }
  if (report.formulasFailed) {
    throw new Error(name + ': KaTeX не принял формул — ' + report.formulasFailed);
  }

  const size = (fs.statSync(file).size / 1024).toFixed(0);
  console.log('  ' + name + '.pdf → ' + (where.published ? 'сайт' : 'только CI') +
    ', страниц ' + report.pages +
    ', задач ' + report.tasks + ', формул ' + report.formulas +
    (report.katex ? ' (KaTeX)' : ' (запасной набор)') + ', ' + size + ' КБ');
  return report;
}
