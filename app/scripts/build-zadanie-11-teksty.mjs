#!/usr/bin/env node
/* scripts/build-zadanie-11-teksty.mjs — черновик новых текстов №11 на
   вычитку (docs/zadanie-11-teksty.md) прямо из исходников:
   content/tekstovye11.ts и названия типов движка. Так файл для вычитки
   не расходится с сайтом.

     node scripts/build-zadanie-11-teksty.mjs          — записать файл
     node scripts/build-zadanie-11-teksty.mjs --check  — сверить, не записывая */

import fs from 'node:fs';
import path from 'node:path';
import { requireSrc, APP } from './lib/load-ts.mjs';

const FILE = path.join(APP, '..', 'docs', 'zadanie-11-teksty.md');

const C = requireSrc('content/tekstovye11.ts');
const { SUBTYPES } = requireSrc('lib/zadanie11/prototypes/index.ts');
const { SECTIONS } = requireSrc('lib/zadanie11/taxonomy.ts');
const { BLOKI } = requireSrc('lib/zadanie11/prep/bloki.ts');

const S = C.SHAPKA11;
const T = C.TRENAZHER11;
const lines = [];
const p = (...xs) => lines.push(...xs);
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

p(
  '# Задание №11 — новые тексты редизайна на вычитку',
  '',
  'Черновик. Всё, что ниже, написано заново для «Стеклянной сцены» и лежит в',
  '`app/src/content/tekstovye11.ts`. Файл собирается из исходников',
  '(`node scripts/build-zadanie-11-teksty.mjs`), поэтому совпадает с сайтом дословно.',
  'Условия задач, ответы, решения, подсказки-вопросы, таблицы модели и теория **не менялись** — их здесь нет.',
  '',
  'Обращение к ученику — на «ты», как в №7 и №6. Кодов типов («ДП-07») в текстах нет.',
  '',
  '## 1. Шапка «О задании»',
  '',
  '| Где | Текст |',
  '|---|---|',
  `| Надзаголовок | ${cell(S.nadzagolovok)} |`,
  `| Заголовок | ${cell(S.zagolovok)} |`,
  `| Вводка | ${cell(S.lead)} |`,
  `| Факты | ${S.fakty(SUBTYPES.length)
    .map((f) => `**${f.znachenie}** ${f.podpis}`)
    .join(' · ')} |`,
  `| Типы задач | ${cell(S.gruppyTitle)}. ${cell(S.gruppyLead)} |`,
  `| Разминка | «${cell(S.razminka)}» — к названию группы |`,
  `| Что нужно знать | ${cell(S.znatTitle)}. ${cell(S.znatLead)} |`,
  '',
  '«≈ 6 минут» — моя оценка (условие длинное, нужно составить и решить уравнение). Поправьте, если даёте другое время.',
  '',
  `### ${S.opasnoTitle}`,
  '',
  ...S.opasno.map((line, i) => `${i + 1}. ${line}`),
  '',
  '## 2. «Где теряют балл» — свой текст у каждого типа',
  '',
  'Показывается под разобранным примером типа на «О задании». Группы — разделы задачи в порядке изучения.',
  '',
);
for (const s of SECTIONS) {
  p(
    `### ${s.nazvanie}${s.razminka ? ` (${S.razminka})` : ''}`,
    '',
    '| Тип | Где теряют балл |',
    '|---|---|',
  );
  for (const st of SUBTYPES.filter((x) => x.section === s.id)) {
    p(`| ${cell(st.title)} | ${cell(C.TIPY11_OPASNO[st.id] ?? '—')} |`);
  }
  p('');
}
p(
  '## 3. «Что нужно знать»',
  '',
  'Формула и маленький пример к ней. Примеры посчитаны заново, проверьте числа.',
  '',
);
for (const blok of C.FORMULY11) {
  p(`### ${blok.nazvanie}`, '', '| Формула | Пример |', '|---|---|');
  for (const f of blok.formuly) p(`| $${cell(f.tex)}$ | $${cell(f.primer)}$ |`);
  p('');
}
p(
  '## 4. Опорные задачи: навыки',
  '',
  'Блоки опорных задач (они сами и их задачи не менялись) сгруппированы по навыкам, как в №3, №7 и №6.',
  '',
  `Вводка вкладки: ${C.OPORNYE11.lead}`,
  '',
  '| Навык | Пояснение | Блоки |',
  '|---|---|---|',
);
for (const n of C.NAVYKI11) {
  const bloki = n.bloki
    .map((b) => BLOKI.find((x) => x.slug === b.slug)?.nazvanie ?? b.slug)
    .join(', ');
  p(`| ${cell(n.nazvanie)} | ${cell(n.lead)} | ${cell(bloki)} |`);
}
p(
  '',
  `Под задачами блока — «${C.OPORNYE11.gde}»: ссылки на группы «О задании», где нужен навык.`,
  '',
  '## 5. Тренажёр',
  '',
  'Подписи режимов, выбора тем, экрана задачи и итогов — общие с №7 и №6 (`content/treningBanka.ts`), на «ты».',
  '',
  '**Режим «Без подсказок»** прежнего тренажёра — переключатель «Без подсказок и решений»; **«На время»** — таймер',
  '(он теперь включается в выборе тем). Незаконченная тренировка в прежних режимах открывается на той же задаче.',
  '',
  '**Запись ответа — по общему правилу**, как в №8, №3, №7 и №6: засчитывается целое число или десятичная дробь.',
  'Обыкновенная дробь с верным значением («3/4» вместо «0,75») — подсказка, попытка не тратится. Раньше',
  '№11 такую запись засчитывал (и в тренажёре, и в опорных задачах). Листы и генератор проверяют ответ по-прежнему.',
  '',
  '| Где | Текст |',
  '|---|---|',
  `| Источник задач | ${T.vybor.istochnik}: ${Object.values(T.vybor.istochniki)
    .map((x) => `**${x}**`)
    .join(' · ')} |`,
  `| Под условием задачи | «${T.ekran.fipi}» / «${T.ekran.razminka}» / «${T.ekran.analog}» |`,
  `| Материалы к задаче | ${T.ekran.layfhak} · ${T.ekran.teoriya} · ${T.ekran.opornyy} |`,
  `| Подсказка | «${T.ekran.tablitsa}» под вопросами. ${cell(T.ekran.tablitsaNote)} |`,
  '',
);

const text = lines.join('\n');
if (process.argv.includes('--check')) {
  const was = fs.existsSync(FILE) ? fs.readFileSync(FILE, 'utf8') : '';
  if (was !== text) {
    console.error(
      'docs/zadanie-11-teksty.md расходится с исходниками: node scripts/build-zadanie-11-teksty.mjs',
    );
    process.exit(1);
  }
  console.log('Тексты №11 для вычитки совпадают с исходниками.');
} else {
  fs.writeFileSync(FILE, text);
  console.log(`Записан ${path.relative(path.join(APP, '..'), FILE)}`);
}
