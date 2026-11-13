#!/usr/bin/env node
/* scripts/build-zadanie-6-teksty.mjs — черновик новых текстов №6 на вычитку
   (docs/zadanie-6-teksty.md) прямо из исходников: content/sluchainye6.ts и
   названия типов банка. Так файл для вычитки не расходится с сайтом.

     node scripts/build-zadanie-6-teksty.mjs          — записать файл
     node scripts/build-zadanie-6-teksty.mjs --check  — сверить, не записывая */

import fs from 'node:fs';
import path from 'node:path';
import { requireSrc, APP } from './lib/load-ts.mjs';

const FILE = path.join(APP, '..', 'docs', 'zadanie-6-teksty.md');

const C = requireSrc('content/sluchainye6.ts');
const { GROUPS, prototypesOfGroup, PROTOTYPES } = requireSrc('lib/zadanie6/prototypes/index.ts');
const { BLOKI_OPORNYH } = requireSrc('lib/zadanie6/opornye.ts');

const S = C.SHAPKA6;
const T = C.TRENAZHER6;
const lines = [];
const p = (...xs) => lines.push(...xs);
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

p(
  '# Задание №6 — новые тексты редизайна на вычитку',
  '',
  'Черновик. Всё, что ниже, написано заново для «Стеклянной сцены» и лежит в',
  '`app/src/content/sluchainye6.ts`. Файл собирается из исходников',
  '(`node scripts/build-zadanie-6-teksty.mjs`), поэтому совпадает с сайтом дословно.',
  'Условия задач, ответы, решения, подсказки-вопросы тренажёра и теория **не менялись** — их здесь нет.',
  '',
  'Обращение к ученику — на «ты», как в №7.',
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
  `| Что нужно знать | ${cell(S.znatTitle)}. ${cell(S.znatLead)} |`,
  '',
  '«≈ 4 минуты» — моя оценка (задача длиннее №7: прочитать рисунок или таблицу). Поправьте, если даёте другое время.',
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
    `### ${g.id}. ${g.title} (значок $${C.GRUPPY6_VID[g.id].znak}$)`,
    '',
    '| Тип | Где теряют балл |',
    '|---|---|',
  );
  for (const proto of prototypesOfGroup(g.id)) {
    p(`| ${cell(proto.title)} | ${cell(C.TIPY6_OPASNO[proto.id] ?? '—')} |`);
  }
  p('');
}
p(
  '## 3. «Что нужно знать»',
  '',
  'Формула и маленький пример к ней. Примеры посчитаны заново, проверьте числа.',
  '',
);
for (const blok of C.FORMULY6) {
  p(`### ${blok.nazvanie}`, '', '| Формула | Пример |', '|---|---|');
  for (const f of blok.formuly) p(`| $${cell(f.tex)}$ | $${cell(f.primer)}$ |`);
  p('');
}
p(
  '## 4. Опорные задачи: навыки',
  '',
  'Блоки опорных задач (они сами и их задачи не менялись) сгруппированы по навыкам, как в №3 и №7.',
  '',
  `Вводка вкладки: ${C.OPORNYE6.lead ?? ''}`.trim(),
  '',
  '| Навык | Пояснение | Блоки |',
  '|---|---|---|',
);
for (const n of C.NAVYKI6) {
  const bloki = n.bloki
    .map((b) => BLOKI_OPORNYH.find((x) => x.slug === b.slug)?.nazvanie ?? b.slug)
    .join(', ');
  p(`| ${cell(n.nazvanie)} | ${cell(n.lead)} | ${cell(bloki)} |`);
}
p(
  '',
  '## 5. Тренажёр',
  '',
  'Подписи режимов, выбора тем, экрана задачи и итогов — общие с №7 (`content/treningBanka.ts`), на «ты».',
  '',
  '**Режим «Проверка» стал переключателем «Без подсказок и решений»** (решение владельца): ответ проверяется сразу,',
  'но подсказок и разбора нет до итогов. Незаконченная тренировка в прежнем режиме «Проверка» открывается',
  'с включённым переключателем.',
  '',
  '**Запись ответа — по общему правилу**, как в №8, №3 и №7: засчитывается целое число или десятичная дробь.',
  'Обыкновенная дробь с верным значением («3/4» вместо «0,75») — подсказка, попытка не тратится. Раньше',
  '№6 такую запись засчитывал. Листы и генератор проверяют ответ по-прежнему.',
  '',
  '| Где | Текст |',
  '|---|---|',
  `| Источник задач | ${Object.values(T.vybor.istochniki ?? {})
    .map((x) => `**${x}**`)
    .join(' · ')} |`,
  `| Формулировка | ${T.vybor.stil}: ${Object.values(T.vybor.stili)
    .map((x) => `**${x}**`)
    .join(' · ')} |`,
  `| Под условием задачи | «${T.ekran.demo}» / «${T.ekran.obrazec('Математическое ожидание, №3')}» / «${T.ekran.neIzBanka}» |`,
  '',
);

const text = lines.join('\n');
if (process.argv.includes('--check')) {
  const was = fs.existsSync(FILE) ? fs.readFileSync(FILE, 'utf8') : '';
  if (was !== text) {
    console.error(
      'docs/zadanie-6-teksty.md расходится с исходниками: node scripts/build-zadanie-6-teksty.mjs',
    );
    process.exit(1);
  }
  console.log('Тексты №6 для вычитки совпадают с исходниками.');
} else {
  fs.writeFileSync(FILE, text);
  console.log(`Записан ${path.relative(path.join(APP, '..'), FILE)}`);
}
