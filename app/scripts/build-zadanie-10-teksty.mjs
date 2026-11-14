#!/usr/bin/env node
/* scripts/build-zadanie-10-teksty.mjs — черновик новых текстов №10 на вычитку
   (docs/zadanie-10-teksty.md) прямо из исходников: content/prikladnye10.ts и
   названия типов банка. Так файл для вычитки не расходится с сайтом.

     node scripts/build-zadanie-10-teksty.mjs          — записать файл
     node scripts/build-zadanie-10-teksty.mjs --check  — сверить, не записывая */

import fs from 'node:fs';
import path from 'node:path';
import { requireSrc, APP } from './lib/load-ts.mjs';

const FILE = path.join(APP, '..', 'docs', 'zadanie-10-teksty.md');

const C = requireSrc('content/prikladnye10.ts');
const { GROUPS, prototypesOfGroup, PROTOTYPES } = requireSrc('lib/zadanie10/prototypes/index.ts');
const { BLOKI_OPORNYH } = requireSrc('lib/zadanie10/opornye.ts');

const S = C.SHAPKA10;
const T = C.TRENAZHER10;
const lines = [];
const p = (...xs) => lines.push(...xs);
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

p(
  '# Задание №10 — новые тексты редизайна на вычитку',
  '',
  'Черновик. Всё, что ниже, написано заново для «Стеклянной сцены» и лежит в',
  '`app/src/content/prikladnye10.ts`. Файл собирается из исходников',
  '(`node scripts/build-zadanie-10-teksty.mjs`), поэтому совпадает с сайтом дословно.',
  'Условия задач, ответы, решения, подсказки-вопросы тренажёра, опорные задачи и теория **не менялись** — их здесь нет.',
  '',
  'Обращение к ученику — на «ты», как в №7 и №6.',
  '',
  '## 1. Шапка «О задании»',
  '',
  '| Где | Текст |',
  '|---|---|',
  `| Надзаголовок | ${cell(S.nadzagolovok)} |`,
  `| Заголовок | ${cell(S.zagolovok)} |`,
  `| Вводка | ${cell(S.lead)} |`,
  `| Факты | ${S.fakty(PROTOTYPES.length)
    .map((f) => `**${f.znachenie}** ${f.podpis}`)
    .join(' · ')} |`,
  `| Типы задач | ${cell(S.gruppyTitle)}. ${cell(S.gruppyLead)} |`,
  `| Под названием типа | «Найти: …» — что ищут, из описания прототипа в банке |`,
  `| Что нужно знать | ${cell(S.znatTitle)}. ${cell(S.znatLead)} |`,
  '',
  '«≈ 5 минут» — моя оценка (условие длинное, нужно выбрать корень и перевести единицы). Поправьте, если даёте другое время.',
  '',
  `### ${S.opasnoTitle}`,
  '',
  ...S.opasno.map((line, i) => `${i + 1}. ${line}`),
  '',
  '## 2. «Где теряют балл» — свой текст у каждого типа',
  '',
  'Показывается под разобранным примером типа на «О задании».',
  '',
);
for (const g of GROUPS) {
  p(
    `### ${g.id}. ${g.title} (значок $${C.GRUPPY10_VID[g.id].znak}$)`,
    '',
    '| Тип | Где теряют балл |',
    '|---|---|',
  );
  for (const proto of prototypesOfGroup(g.id)) {
    p(`| ${cell(proto.title)} | ${cell(C.TIPY10_OPASNO[proto.id] ?? '—')} |`);
  }
  p('');
}
p(
  '## 3. «Что нужно знать»',
  '',
  'Формула и маленький пример к ней. Примеры посчитаны заново, проверьте числа.',
  '',
);
for (const blok of C.FORMULY10) {
  p(`### ${blok.nazvanie}`, '', '| Формула | Пример |', '|---|---|');
  for (const f of blok.formuly) p(`| $${cell(f.tex)}$ | $${cell(f.primer)}$ |`);
  p('');
}
p(
  '## 4. Опорные задачи: навыки',
  '',
  'Блоки опорных задач (они сами и их задачи не менялись) сгруппированы по навыкам, как в №3, №7 и №6.',
  '',
  `Вводка вкладки: ${C.OPORNYE10.lead ?? ''}`.trim(),
  '',
  '| Навык | Пояснение | Блоки |',
  '|---|---|---|',
);
for (const n of C.NAVYKI10) {
  const bloki = n.bloki
    .map((b) => BLOKI_OPORNYH.find((x) => x.slug === b.slug)?.nazvanie ?? b.slug)
    .join(', ');
  p(`| ${cell(n.nazvanie)} | ${cell(n.lead)} | ${cell(bloki)} |`);
}
p(
  '',
  `Под картинкой сюжета у опорной задачи: «${C.OPORNYE10.gdeVstrechaetsya} <название типа>» — ссылка на тип на «О задании».`,
  '',
  '## 5. Теория',
  '',
  'Содержание теории не менялось. Новая только подпись блока «Где на ЕГЭ» в конце раздела',
  '(прежде — «Задание №10, прототипы — нажмите, чтобы потренироваться:», с кодами «П-…» на чипах):',
  '',
  `> **${C.GDE_NA_EGE10.title}.** ${C.GDE_NA_EGE10.lead}`,
  '',
  '## 6. Тренажёр',
  '',
  'Подписи режимов, выбора тем, экрана задачи и итогов — общие с №7 и №6 (`content/treningBanka.ts`), на «ты».',
  '',
  '**Запись ответа — по общему правилу**, как в №8, №3, №7 и №6: засчитывается целое число или десятичная дробь.',
  'Обыкновенная дробь с верным значением («3/4» вместо «0,75») — подсказка, попытка не тратится. Раньше',
  '№10 такую запись засчитывал. Листы и генератор проверяют ответ по-прежнему.',
  '',
  '| Где | Текст |',
  '|---|---|',
  `| Источник задач | ${Object.values(T.vybor.istochniki ?? {})
    .map((x) => `**${x}**`)
    .join(' · ')} |`,
  `| Под условием задачи | «${T.ekran.fipi(37)}» / «${T.ekran.neIzBanka}» / «${T.ekran.neIzBanka} · ${T.ekran.sovremennyy}» |`,
  '',
);

const text = lines.join('\n');
if (process.argv.includes('--check')) {
  const was = fs.existsSync(FILE) ? fs.readFileSync(FILE, 'utf8') : '';
  if (was !== text) {
    console.error(
      'docs/zadanie-10-teksty.md расходится с исходниками: node scripts/build-zadanie-10-teksty.mjs',
    );
    process.exit(1);
  }
  console.log('Тексты №10 для вычитки совпадают с исходниками.');
} else {
  fs.writeFileSync(FILE, text);
  console.log(`Записан ${path.relative(path.join(APP, '..'), FILE)}`);
}
