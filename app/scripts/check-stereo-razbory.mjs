#!/usr/bin/env node
/* scripts/check-stereo-razbory.mjs — разборы типов задач №3 и №15
   (вкладка «О задании», lib/stereo/razbory3.ts и razbory15.ts).

   Запуск: pnpm test:stereo-razbory

   Проверяет без браузера:
     — у каждого типа «О задании» есть ровно один разбор;
     — ответ разбора равен ответу банка (prototype.otvet) на тех же
       числах, а числа условия банка встречаются в тексте разбора —
       задачу в тексте нельзя «поправить» отдельно от банка;
     — номер задачи ФИПИ есть в снимке открытого банка
       (content-source/stereometria/fipi-otkrytyy-bank.json) и относится
       к тому же прототипу;
     — шаги чертежа не обгоняют текст (последние шаги текста бывают
       чистым вычислением), и на каждом шаге чертежа что-то выделено;
     — все формулы и строки с $…$ набираются KaTeX без ошибок;
     — №15: ответ равен независимому расчёту по координатам модели,
       задача есть в снимке банка ФИПИ и её числа — в тексте, решение
       разбито на пункт а и пункт б. */

import fs from 'node:fs';
import path from 'node:path';
import katex from 'katex';
import { APP, requireSrc } from './lib/load-ts.mjs';

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) {
    failures.push(what);
  }
}

const { RAZBORY_3 } = requireSrc('lib/stereo/razbory3.ts');
const { TIPY_3 } = requireSrc('content/stereo/tipy.ts');
const { prototypeById } = requireSrc('lib/zadanie3/index.ts');
const R = requireSrc('lib/solid/render.ts');

const FIPI = JSON.parse(
  fs.readFileSync(
    path.join(APP, '..', 'content-source', 'stereometria', 'fipi-otkrytyy-bank.json'),
    'utf8',
  ),
).zadachi;

/* Строка с формулами: каждая $…$ набирается без ошибок. */
function texOk(text, where) {
  const parts = text.split('$');
  check(parts.length % 2 === 1, `${where}: непарный $`);
  parts.forEach((part, i) => {
    if (i % 2 === 1) {
      try {
        katex.renderToString(part, { throwOnError: true });
      } catch (error) {
        check(false, `${where}: ${error.message}`);
      }
    }
  });
}

for (const tip of TIPY_3) {
  const n = RAZBORY_3.filter((r) => r.tip === tip.id).length;
  check(n === 1, `тип ${tip.id}: разборов ${n}`);
}

for (const r of RAZBORY_3) {
  const where = `${r.tip} (${r.prototip})`;
  const proto = r.prototip === undefined ? undefined : prototypeById(r.prototip);
  if (proto === undefined) {
    check(r.prototip === 'P03-92', `${where}: прототипа нет в банке`);
  } else {
    check(r.params !== undefined, `${where}: нет чисел банка`);
    const otvet = proto.otvet(r.params);
    check(Math.abs(otvet - r.otvet) < 1e-9, `${where}: ответ ${r.otvet}, в банке ${otvet}`);
    const chisla = (proto.uslovie(r.params).match(/\d+(?:[.,]\d+)?/g) ?? []).filter(
      (x) => x !== '1',
    );
    chisla.forEach((x) =>
      check(r.uslovie.includes(x), `${where}: число ${x} из условия банка не в тексте`),
    );
  }
  if (r.fipi !== undefined) {
    const z = FIPI.find((item) => item.nomer === r.fipi);
    check(z !== undefined, `${where}: задачи ФИПИ ${r.fipi} нет в снимке банка`);
    if (z !== undefined && r.prototip !== 'P03-92') {
      check(z.prototip === r.prototip, `${where}: ФИПИ ${r.fipi} — прототип ${z.prototip}`);
    }
  }

  texOk(r.uslovie, `${where}: условие`);
  r.shagi.forEach((s, i) => {
    texOk(s.chto, `${where}: шаг ${i + 1}`);
    s.zachem.forEach((p) => texOk(p, `${where}: шаг ${i + 1}`));
    (s.formuly ?? []).forEach((f) => {
      try {
        katex.renderToString(f, { throwOnError: true, displayMode: true });
      } catch (error) {
        check(false, `${where}: шаг ${i + 1}: ${error.message}`);
      }
    });
  });

  const model = r.model();
  const items = [
    ...(model.lines ?? []),
    ...(model.sections ?? []),
    ...(model.angles ?? []),
    ...(model.marks ?? []),
    ...(model.measures ?? []),
    ...(model.notes ?? []),
  ];
  const shagov = Math.max(0, ...items.map((x) => x.shag ?? 0));
  /* Последние шаги бывают чистым вычислением — нового на чертеже нет,
     чертёж держит выделение прошлого шага. Больше шагов на чертеже,
     чем в тексте, быть не может. */
  check(
    shagov <= r.shagi.length,
    `${where}: шагов на чертеже ${shagov}, в тексте ${r.shagi.length}`,
  );
  for (let k = 1; k <= shagov; k += 1) {
    const svg = R.renderSolid(model, { shag: k, ustoychivo: true });
    /* Выделение шага — толщины выделения из оформления движка или
       подпись шага (data-hl): подписи не жирные. */
    const w = R.SOLID_THEME.width;
    check(
      [w.hl, w.hlHidden, w.hlMarker].some((x) => svg.includes(`stroke-width="${x}"`)) ||
        svg.includes('data-hl="1"') ||
        svg.includes('class="solid-hl"'),
      `${where}: на шаге ${k} на чертеже ничего не выделено`,
    );
  }
}

/* ── №15 ─────────────────────────────────────────────────────── */

const { RAZBORY_15 } = requireSrc('lib/stereo/razbory15.ts');
const { TIPY_15 } = requireSrc('content/stereo/tipy.ts');

for (const tip of TIPY_15) {
  const n = RAZBORY_15.filter((r) => r.tip === tip.id).length;
  check(n === 1, `№15, тип ${tip.id}: разборов ${n}`);
}

for (const r of RAZBORY_15) {
  const where = `№15 ${r.tip} (${r.fipi})`;
  /* Ответ — независимым расчётом по координатам модели. */
  check(typeof r.proverka === 'function', `${where}: нет проверки ответа`);
  if (typeof r.proverka === 'function') {
    const p = r.proverka();
    check(
      Math.abs(p - r.otvet) < 1e-9 * Math.max(1, Math.abs(p)),
      `${where}: ответ ${r.otvet}, по модели ${p}`,
    );
  }
  check(typeof r.otvetTex === 'string', `${where}: нет записи ответа`);
  if (r.otvetTex !== undefined) {
    texOk(r.otvetTex, `${where}: ответ`);
  }

  /* Задача — из снимка открытого банка, числа условия те же. */
  const z = FIPI.find((item) => item.nomer === r.fipi);
  check(z !== undefined && z.zadanie === '15', `${where}: задачи ФИПИ нет в снимке банка №15`);
  if (z !== undefined) {
    const chisla = (z.uslovie.match(/\d+/g) ?? []).filter((x) => x !== '1');
    chisla.forEach((x) =>
      check(r.uslovie.includes(x), `${where}: число ${x} из условия ФИПИ не в тексте`),
    );
  }

  /* Пункты: решение начинается с «а», «б» — ровно один раз и после «а». */
  const punkty = r.shagi.map((s) => s.punkt).filter((x) => x !== undefined);
  check(punkty.join('') === 'аб', `${where}: пункты ${punkty.join(',') || 'нет'}`);
  check(r.shagi[0]?.punkt === 'а', `${where}: решение начинается не с пункта а`);

  texOk(r.uslovie, `${where}: условие`);
  r.shagi.forEach((s, i) => {
    texOk(s.chto, `${where}: шаг ${i + 1}`);
    s.zachem.forEach((p) => texOk(p, `${where}: шаг ${i + 1}`));
    (s.formuly ?? []).forEach((f) => {
      try {
        katex.renderToString(f, { throwOnError: true, displayMode: true });
      } catch (error) {
        check(false, `${where}: шаг ${i + 1}: ${error.message}`);
      }
    });
  });

  const model = r.model();
  const items = [
    ...(model.lines ?? []),
    ...(model.sections ?? []),
    ...(model.angles ?? []),
    ...(model.marks ?? []),
  ];
  const shagov = Math.max(0, ...items.map((x) => x.shag ?? 0));
  check(
    shagov >= 1 && shagov <= r.shagi.length,
    `${where}: шагов на чертеже ${shagov}, в тексте ${r.shagi.length}`,
  );
  R.renderSolid(model, { shag: shagov, ustoychivo: true });
}

if (failures.length > 0) {
  console.error(`check-stereo-razbory: ${failures.length} из ${checks} проверок не прошли`);
  failures.forEach((item) => console.error(` - ${item}`));
  process.exit(1);
}
console.log(
  `check-stereo-razbory: ok (${RAZBORY_3.length + RAZBORY_15.length} разборов, ${checks} проверок)`,
);
