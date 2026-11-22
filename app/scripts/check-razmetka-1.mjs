#!/usr/bin/env node
/* scripts/check-razmetka-1.mjs — автотест разметки чертежей задания №1.

   «Чертёж — схема, а не масштабный рисунок»: прогоняет все чертежи
   раздела (условия, каждый шаг подсказки, решения, опорные задачи,
   листы генератора и уроков, теория, справочник) и падает, если:
   — отображаемый угол вне 25°…150° (кроме прямого) или спорит со
     своим числом (острый нарисован тупым, меньший — большим);
   — рамки подписей пересекаются между собой, с линиями или с дугами,
     величина угла стоит далеко от своей дуги без выноски;
   — две точки на одной прямой ближе 12 % её длины;
   — фигура сплющена (меньшая сторона рамки меньше 0,35 большей);
   — нарушена структура: середина не середина, перпендикуляр не
     перпендикуляр, биссектриса не делит угол пополам, равные отрезки
     не равны.

   Запуск: pnpm test:razmetka-1 [seedов] [--json файл] [--bystro]
   --bystro — каждый пятый аналог банка (для правок сцен).
   Ненулевой код возврата — есть проблемы, они печатаются списком. */

import fs from 'node:fs';
import { requireSrc } from './lib/load-ts.mjs';

const args = process.argv.slice(2);
const jsonI = args.indexOf('--json');
const json = jsonI >= 0 ? args[jsonI + 1] : null;
const seedov = Number(args.find((a) => /^\d+$/.test(a)) ?? 3);

const { checkRazmetka } = requireSrc('lib/planimetriya/razmetka-selftest');
const r = checkRazmetka(seedov, args.includes('--bystro'));

for (const z of r.razdely)
  console.log(`${z.title}: чертежей ${z.chertezhey}, с нарушениями ${z.plohih}`);
console.log(`всего: чертежей ${r.chertezhey}, с нарушениями ${r.plohih}`);
console.log(
  `по правилам: углы ${r.poKodam.ugol}, подписи ${r.poKodam.podpis}, точки на прямой ${r.poKodam.tochki}, сплющено ${r.poKodam.splyushchen}, структура ${r.poKodam.struktura}`,
);
if (json) {
  fs.writeFileSync(
    json,
    JSON.stringify({
      razdely: r.razdely,
      chertezhey: r.chertezhey,
      plohih: r.plohih,
      poKodam: r.poKodam,
      plohie: r.plohie.map((p) => ({ razdel: p.razdel, metka: p.metka, problems: p.problems })),
    }),
  );
}
const vse = [
  ...r.oshibki.map((o) => `ошибка: ${o}`),
  ...r.plohie.map((p) => `${p.metka}: ${p.problems.map((x) => x.tekst).join('; ')}`),
];
if (vse.length > 0) {
  for (const p of vse.slice(0, 150)) console.log(`  ✗ ${p}`);
  if (vse.length > 150) console.log(`  … и ещё ${vse.length - 150}`);
  process.exit(1);
}
console.log('ок');
