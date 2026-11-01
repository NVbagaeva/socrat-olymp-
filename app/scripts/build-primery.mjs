#!/usr/bin/env node
/* scripts/build-primery.mjs — примеры задач для статических блоков.

   Запуск: сам, первым шагом pnpm build; вручную — pnpm build:primery.

   Тренажёры и генераторы собирают задачи в браузере, поэтому без
   JavaScript на их страницах не было ни одного условия. Скрипт берёт
   по 3 задачи из банка каждого задания 1–13 тем же движком, что
   «Собрать вариант» (lib/variant/adapters), и пишет
   src/data/primery.json: подтип, условие готовой вёрсткой (формулы —
   KaTeX) и рисунок. Ответов и решений в файле нет — их ученик получает
   в самом тренажёре после попытки. Блок под тренажёром
   (components/seo/BlokRazdela.tsx) показывает их на странице.

   Выбор постоянный: одно зерно на задание — те же задачи на каждой
   сборке. Сначала — открытый банк ФИПИ и разные подтипы.

   Почему скрипт, а не страница: движок варианта рисует условия через
   react-dom/server, а серверным компонентам Next.js этот импорт
   запрещён. Файл лежит в репозитории, чтобы pnpm dev работал без
   сборки; сборка его пересобирает. */

import fs from 'node:fs';
import path from 'node:path';
import { APP, requireSrc } from './lib/load-ts.mjs';

const { rngOf } = requireSrc('lib/vychisleniya/rng.ts');
const DANNYE = {
  1: 'z01',
  3: 'z03',
  4: 'z04',
  5: 'z05',
  6: 'z06',
  7: 'z07',
  10: 'z10',
  11: 'z11',
};

function adapter(no) {
  const kod = `z${String(no).padStart(2, '0')}`;
  const { section } = requireSrc(`lib/variant/adapters/${kod}/index.ts`);
  const dannye = DANNYE[no] === undefined ? null : requireSrc(`lib/variant/data/${DANNYE[no]}.ts`).dannye();
  return section.init(dannye);
}

/** Примеры задания: подтипы по кругу, сначала открытый банк. */
function primery(a, no, skolko, podtipy) {
  const vse = podtipy ?? a.info.subtypes.map((s) => s.id);
  const vzyato = new Set();
  const out = [];
  for (let i = 0; out.length < skolko && i < skolko * 4; i += 1) {
    const podtip = vse[i % Math.max(1, vse.length)];
    const task = a.getRandomTask(
      {
        subtypes: podtip === undefined ? null : [podtip],
        source: i < skolko * 2 ? 'fipi' : 'mix',
        stars: null,
        exclude: vzyato,
      },
      rngOf(`primer|${no}|${podtip ?? ''}|${i}`),
    );
    if (task === null || vzyato.has(task.taskId)) continue;
    vzyato.add(task.taskId);
    out.push({
      podtip: a.info.subtypes.find((s) => s.id === task.subtype)?.label ?? '',
      uslovieHtml: task.statement,
      risunok: task.figure === null ? null : { svg: task.figure.svg, below: task.figure.below === true },
    });
  }
  return out;
}

const zadaniya = {};
const podrazdely12 = {};
for (let no = 1; no <= 13; no += 1) {
  const a = adapter(no);
  zadaniya[no] = primery(a, no, 3);
  if (no === 12) {
    for (const s of a.info.subtypes) podrazdely12[s.id] = primery(a, no, 3, [s.id]);
  }
}

const file = path.join(APP, 'src', 'data', 'primery.json');
const json = `${JSON.stringify({ zadaniya, podrazdely12 }, null, 1)}\n`;
const bylo = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
if (bylo !== json) fs.writeFileSync(file, json);
const n = Object.values(zadaniya).reduce((s, l) => s + l.length, 0);
console.log(`build-primery: заданий 13, примеров ${n}, подразделов №12 ${Object.keys(podrazdely12).length}${bylo === json ? ' (без изменений)' : ''}`);
