#!/usr/bin/env node
/* scripts/build-zadanie-9-teksty.mjs — черновик новых текстов №9 на вычитку
   (docs/zadanie-9-teksty.md) прямо из исходников: content/proizvodnaya9.ts и
   названия типов генератора. Так файл для вычитки не расходится с сайтом.

     node scripts/build-zadanie-9-teksty.mjs          — записать файл
     node scripts/build-zadanie-9-teksty.mjs --check  — сверить, не записывая */

import fs from 'node:fs';
import path from 'node:path';
import { requireSrc, APP } from './lib/load-ts.mjs';

const FILE = path.join(APP, '..', 'docs', 'zadanie-9-teksty.md');

const C = requireSrc('content/proizvodnaya9.ts');
const { O_ZADANII_9 } = requireSrc('content/proizvodnaya.ts');
const { PROTOTYPES } = requireSrc('lib/proizvodnaya/prototypes/index.ts');
const { prototypesOfGroup } = requireSrc('lib/proizvodnaya/skills.ts');
const { PREP_BLOCKS } = requireSrc('lib/proizvodnaya/prep/blocks.ts');

const S = C.SHAPKA9;
const lines = [];
const p = (...xs) => lines.push(...xs);
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

p(
  '# Задание №9 — новые тексты редизайна на вычитку',
  '',
  'Черновик. Всё, что ниже, написано заново для «Стеклянной сцены» и лежит в',
  '`app/src/content/proizvodnaya9.ts`. Файл собирается из исходников',
  '(`node scripts/build-zadanie-9-teksty.mjs`), поэтому совпадает с сайтом дословно.',
  'Условия задач, ответы, решения, подсказки-вопросы, чертежи и теория **не менялись** — их здесь нет.',
  '',
  'Обращение к ученику — на «ты», как в №7, №6 и №2.',
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
  `| Чертёж примера | ${cell(S.vidy)}: «${S.vidUsloviya}», «${S.vidShag(1)}», «${S.vidVse}»; «${S.svernut}» / «${S.razvernut}» |`,
  '',
  '«≈ 3 минуты» — моя оценка. Поправьте, если даёте другое время.',
  '',
  `### ${S.opasnoTitle}`,
  '',
  'Собрано из прежних «Типичных ошибок» вкладки «О задании» и переписано на «ты».',
  '',
  ...S.opasno.map((line, i) => `${i + 1}. ${line}`),
  '',
  '## 2. «Где теряют балл» — свой текст у каждого типа',
  '',
  'Показывается под разобранным примером типа на «О задании». Названия групп и типов — прежние.',
  '',
);
for (const g of O_ZADANII_9.gruppy) {
  p(
    `### ${g.id}. ${g.title} (значок $${C.GRUPPY9_VID[g.id].znak}$)`,
    '',
    '| Тип | Где теряют балл |',
    '|---|---|',
  );
  for (const proto of prototypesOfGroup(g.id)) {
    p(`| ${cell(proto.nazvanie)} | ${cell(C.TIPY9_OPASNO[proto.id] ?? '—')} |`);
  }
  p('');
}
p(
  '## 3. «Что нужно знать»',
  '',
  'Правило и маленький пример к нему. Примеры взяты из разобранных задач типов, проверьте числа.',
  '',
);
for (const blok of C.ZNAT9) {
  p(`### ${blok.nazvanie}`, '', '| Правило | Пример |', '|---|---|');
  for (const f of blok.formuly) p(`| $${cell(f.tex)}$ | ${cell(f.primer)} |`);
  p('');
}
p(
  '## 4. Опорные задачи: навыки',
  '',
  'Блоки опорных задач (они сами и их задачи не менялись) сгруппированы по навыкам, как в №3, №7 и №6.',
  '',
  `Вводка вкладки: ${C.OPORNYE9.lead}`,
  '',
  '| Навык | Пояснение | Блоки |',
  '|---|---|---|',
);
for (const n of C.NAVYKI9) {
  const bloki = n.bloki
    .map((b) => PREP_BLOCKS.find((x) => x.slug === b.slug)?.nazvanie ?? b.slug)
    .join(', ');
  p(`| ${cell(n.nazvanie)} | ${cell(n.lead)} | ${cell(bloki)} |`);
}
p('', '«Где пригодится этот навык» под блоком — типы задания:', '');
for (const b of PREP_BLOCKS) {
  const tipy = (C.TIPY_BLOKA9[b.slug] ?? [])
    .map((id) => PROTOTYPES.find((x) => x.id === id)?.kratko ?? id)
    .join('; ');
  p(`- **${b.nazvanie}**: ${tipy}`);
}
p(
  '',
  '## 5. Тренажёр',
  '',
  'Подписи режимов, выбора тем, экрана задачи и итогов — общие с №7, №6 и №2 (`content/treningBanka.ts`), на «ты».',
  '',
  '**Режим «Контроль» стал переключателем «Без подсказок и решений»** (решение владельца). «Смешанная» —',
  'карточка «Все типы вперемешку», «Повтор ошибок» — «Работа над ошибками». Незаконченная тренировка',
  'прежнего тренажёра открывается на той же задаче, «Контроль» — с включённым переключателем.',
  '',
  '**Запись ответа — по общему правилу**, как в №8, №3, №7, №6 и №2: засчитывается целое число или',
  'десятичная дробь. Обыкновенная дробь с верным значением («-1/5» вместо «-0,2») — подсказка, попытка',
  'не тратится. Раньше №9 такую запись засчитывал (и в тренажёре, и в опорных). Листы и генератор',
  'проверяют ответ по-прежнему.',
  '',
  'Переключателя источника задач нет: открытый банк №9 пуст, все задачи строит генератор.',
  '',
  '| Где | Текст |',
  '|---|---|',
  `| Подпись чертежа | ${cell(C.TRENAZHER9.ekran.risunok)} |`,
  '',
);

const text = lines.join('\n');
if (process.argv.includes('--check')) {
  const was = fs.existsSync(FILE) ? fs.readFileSync(FILE, 'utf8') : '';
  if (was !== text) {
    console.error(
      'docs/zadanie-9-teksty.md расходится с исходниками: node scripts/build-zadanie-9-teksty.mjs',
    );
    process.exit(1);
  }
  console.log('Тексты №9 для вычитки совпадают с исходниками.');
} else {
  fs.writeFileSync(FILE, text);
  console.log(`Записан ${path.relative(path.join(APP, '..'), FILE)}`);
}
