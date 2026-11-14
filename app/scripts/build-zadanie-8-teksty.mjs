#!/usr/bin/env node
/* scripts/build-zadanie-8-teksty.mjs — сводка текстов задания №8 на вычитку.

   Запуск: node scripts/build-zadanie-8-teksty.mjs [--check]

   Собирает docs/zadanie-8-teksty.md из content/vychisleniya8 и
   генератора: по каждому из 26 типов — название (сейчас → предлагаю),
   группа, строка под названием, «где теряют балл», по каждому подтипу
   пример условия с решением по шагам (подписи «что делаем и почему» —
   из генератора, docs/zadanie-8-razbory.md) и подсказка до ответа.
   Сверху — шапка вкладки «О задании», снизу — формулы «Что нужно
   знать» и признаки делимости.

   Файл читает автор с телефона, поэтому формулы оставлены в записи
   TeX между $…$: так их видно и без набора. --check — только сравнить
   файл с тем, что собралось бы: расхождение — ненулевой код. */

import fs from 'node:fs';
import path from 'node:path';
import { APP, requireSrc } from './lib/load-ts.mjs';

const OUT = path.join(APP, '..', 'docs', 'zadanie-8-teksty.md');

const { GRUPPY8 } = requireSrc('content/vychisleniya8/gruppy.ts');
const { TIPY8, PODTIPY8, podskazkaTipa } = requireSrc('content/vychisleniya8/tipy.ts');
const { SHAPKA8, FORMULY8, DELIMOST8 } = requireSrc('content/vychisleniya8/spravka.ts');
const { PROTOTYPES, prototypeById } = requireSrc('lib/vychisleniya/prototypes/index.ts');
const { PROTOTYPE_NAMES } = requireSrc('lib/vychisleniya/ids.ts');
const { rngOf } = requireSrc('lib/vychisleniya/rng.ts');
const { ru } = requireSrc('lib/vychisleniya/numbers.ts');

/** Первый подошедший черновик подтипа на детерминированных seed. */
function primer(prototype, podtip) {
  for (let s = 0; s < 400; s += 1) {
    const draft = podtip.generate(rngOf(`${prototype.id}|teksty${s}`));
    if (draft !== null) {
      return draft;
    }
  }
  return null;
}

const lines = [];
const p = (s = '') => lines.push(s);

p('# Задание №8: тексты на вычитку');
p();
p('Черновик для вкладок «О задании» и «Тренажёр». Формулы в записи TeX между `$…$`.');
p('Собирается скриптом `app/scripts/build-zadanie-8-teksty.mjs`: названия, строки под ними,');
p('подсказки и «где теряют балл» — из `app/src/content/vychisleniya8/`, подписи шагов решения —');
p('из генератора (`app/src/lib/vychisleniya/prototypes/`, правила — `docs/zadanie-8-razbory.md`).');
p('Правки вносить туда (или прислать правки по этому файлу — перенесу).');
p();
p('## Шапка вкладки «О задании»');
p();
p(`- Надзаголовок: ${SHAPKA8.nadzagolovok}`);
p(`- Заголовок: ${SHAPKA8.zagolovok}`);
p(`- Подзаголовок: ${SHAPKA8.lead}`);
p(`- Факты: ${SHAPKA8.fakty.map((f) => `**${f.znachenie}** ${f.podpis}`).join(' · ')}`);
p(`- ${SHAPKA8.opasnoTitle}:`);
for (const o of SHAPKA8.opasno) {
  p(`  - ${o}`);
}
p();
p('## Названия типов: сейчас → предлагаю');
p();
p('| Код | Группа | Сейчас (генератор) | Предлагаю |');
p('|---|---|---|---|');
for (const g of GRUPPY8) {
  for (const id of g.prototypes) {
    p(`| ${id} | ${g.nazvanie} | ${PROTOTYPE_NAMES[id]} | ${TIPY8[id].nazvanie} |`);
  }
}
p();
p('## Типы по группам');
p();
for (const g of GRUPPY8) {
  p(`## ${g.nazvanie}`);
  p();
  const razdely = g.podgruppy ?? [{ nazvanie: null, prototypes: g.prototypes }];
  for (const pod of razdely) {
    if (pod.nazvanie !== null) {
      p(`### ${pod.nazvanie}`);
      p();
    }
    for (const id of pod.prototypes) {
      const proto = prototypeById(id);
      const t = TIPY8[id];
      p(`#### ${t.nazvanie} (${id})`);
      p();
      p(`*${t.lead}*`);
      p();
      p(`**Где теряют балл.** ${t.opasno}`);
      p();
      for (const podtip of proto.podtipy) {
        const ex = primer(proto, podtip);
        const svoya = PODTIPY8[`${id}:${podtip.id}`]?.podskazka !== undefined;
        p(
          `**Подтип ${podtip.id}** (${podtip.level === 'base' ? 'базовый' : 'повышенный'}${svoya ? ', своя подсказка' : ''})`,
        );
        p();
        if (ex === null) {
          p('_пример не подобрался_');
          p();
          continue;
        }
        p(`Условие: ${ex.uslovie}`);
        p();
        ex.razbor.forEach((step, i) => {
          p(`${i + 1}. ${step.chto}`);
          p(`   $${step.tex}$`);
        });
        p();
        p(`Ответ: **${ru(ex.otvet)}**`);
        p();
        p(`Подсказка до ответа: _${podskazkaTipa(id, podtip.id)}_`);
        p();
      }
    }
  }
}
p('## Что нужно знать');
p();
for (const blok of FORMULY8) {
  p(`### ${blok.nazvanie}`);
  p();
  for (const f of blok.formuly) {
    p(`- $${f.tex}$ — например $${f.primer}$`);
  }
  p();
}
p(`## ${SHAPKA8.delimostTitle}`);
p();
for (const d of DELIMOST8) {
  p(`- на ${d.na}: ${d.pravilo} — ${d.primer}`);
}
p();

const text = lines.join('\n');
const missing = PROTOTYPES.map((x) => x.id).filter((id) => TIPY8[id] === undefined);
if (missing.length > 0) {
  console.error(`Нет текстов для прототипов: ${missing.join(', ')}`);
  process.exit(1);
}
if (process.argv.includes('--check')) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (current !== text) {
    console.error(`docs/zadanie-8-teksty.md устарел: node scripts/build-zadanie-8-teksty.mjs`);
    process.exit(1);
  }
  console.log('docs/zadanie-8-teksty.md актуален.');
} else {
  fs.writeFileSync(OUT, text);
  console.log(`Записан ${path.relative(process.cwd(), OUT)} (${lines.length} строк).`);
}
