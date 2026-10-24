#!/usr/bin/env node
/* scripts/build-pdf-13.mjs — образцы PDF генератора задания №13
   «Экономические задачи».

   Запуск:
     node scripts/build-pdf-13.mjs           образцы: «Домашка» и «Зачёт»,
                                             лист ученика и лист учителя
     node scripts/build-pdf-13.mjs --draft   то же без требования KaTeX

   Лист — тот же, что собирает генератор (lib/zadanie13/gen/sheet.ts):
   пресет, постоянный seed, задачи считает движок. В этом файле ни
   одного условия и ни одного ответа нет. Листы ученика ложатся в
   public/materials/zadanie-13, листы учителя — только в pdf-private
   (lib/sheet/outputs.js). QR ведёт на онлайн-набор на budetege.ru.
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { requireSrc } from './lib/load-ts.mjs';
import { buildSheet } from './lib/sheet-build.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(HERE, '..');
const SECTION = 'zadanie-13';
const SITE = 'https://budetege.ru';

const P = requireSrc('lib/zadanie13/gen/params.ts');
const L = requireSrc('lib/zadanie13/gen/list.ts');
const S = requireSrc('lib/zadanie13/gen/sheet.ts');
const { PRESETY_13 } = requireSrc('content/generator13.ts');
const { qrSvg } = requireSrc('lib/qr.ts');

/** Печатная CSS листа без блока :root: шрифты сборке задаёт sheet-render. */
const EXTRA_CSS = fs
  .readFileSync(path.join(APP, 'src', 'app', 'zadaniya', '13', 'pechat', 'pechat13.css'), 'utf8')
  .replace(/^:root\s*\{[^}]*\}\s*/m, '');

function paramsOf(presetId) {
  const p = PRESETY_13.find((x) => x.id === presetId);
  if (!p) throw new Error('нет пресета ' + presetId);
  return {
    ...P.GEN_PARAMS_13,
    sostav: { ...p.sostav },
    uroven: p.uroven,
    pomoshch: p.pomoshch,
    vid: p.vid,
    variants: p.variants,
    zachet: p.zachet === true,
    title: p.title,
    seed: 'OBRAZEC',
  };
}

async function build(name, params, withAnswers, requireKatex) {
  const list = L.sobratList13(params);
  const spec = S.sheetSpec13(params, list, withAnswers ? 'uchitel' : 'uchenik');
  const qr = withAnswers
    ? null
    : qrSvg(SITE + P.onlaynHref13(params), 'QR-код: решать набор онлайн');
  const expected = list.poVariantam.reduce((n, v) => n + v.length, 0);
  return buildSheet(
    APP,
    SECTION,
    name,
    { ...spec, qr },
    {
      withAnswers,
      expectTasks: expected,
      requireKatex,
      keepHtml: true,
      extraCss: EXTRA_CSS,
    },
  );
}

async function main() {
  const requireKatex = !process.argv.includes('--draft');
  for (const preset of ['domashka', 'zachet']) {
    const params = paramsOf(preset);
    await build(`${preset}-uchenik`, params, false, requireKatex);
    await build(`${preset}-uchitel`, params, true, requireKatex);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error('\nсборка не удалась: ' + error.message);
    process.exit(1);
  });
}
