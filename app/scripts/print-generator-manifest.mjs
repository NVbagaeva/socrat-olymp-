#!/usr/bin/env node
/* scripts/print-generator-manifest.mjs — манифест генератора таблицей.

   Запуск: pnpm manifest:generator

   Печатает то, что соберёт src/lib/generator/build-manifest.js из данных
   движка и списка семейств. Ничего не проверяет и ничего не пишет:
   это способ посмотреть на числа глазами до того, как они попадут
   на экран.

   Манифест берётся из src/lib/generator/manifest.ts — того же модуля,
   что читают страницы, — через общий загрузчик TypeScript
   (scripts/lib/load-ts.mjs): наборы всех семейств и список семейств
   со всеми их импортами по алиасу «@/».
*/

import { requireSrc } from './lib/load-ts.mjs';

const { manifest } = requireSrc('lib/generator/manifest');

function levels(skill) {
  return skill.levels.length === 0
    ? '—'
    : skill.levels.map((l) => `${l} ${skill.levelCounts[l]}`).join(', ');
}

for (const family of manifest.families) {
  console.log(`\n${family.title} (${family.id}) · ${family.status}`);
  console.log(
    `  подготовка: ${family.prep.sets} наб. / ${family.prep.tasks} задач · ` +
      `прототипы: ${family.prototypes.sets} наб. / ${family.prototypes.tasks} задач · ` +
      `всего ${family.total} · уровни: ${family.levels.join(', ') || '—'}`,
  );
  if (family.missing.length) {
    console.log(`  ! в конфиге есть, в данных нет: ${family.missing.join(', ')}`);
  }
  if (family.skills.length === 0) {
    console.log('  навыков нет');
    continue;
  }
  console.log('  набор   | вид       | название                       | задач | уровни               | правило ответа');
  for (const s of family.skills) {
    console.log(
      `  ${s.id.padEnd(7)} | ${s.kind.padEnd(9)} | ${s.title.padEnd(30)} | ${String(s.count).padStart(5)} | ` +
        `${levels(s).padEnd(20)} | ${s.answerRules.join(', ')}${s.hasChart ? '' : ' (без чертежа)'}`,
    );
  }
}
if (manifest.orphans.length) {
  console.log(`\n! наборы без семейства: ${manifest.orphans.join(', ')}`);
}
