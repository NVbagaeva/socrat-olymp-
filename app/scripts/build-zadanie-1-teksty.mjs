#!/usr/bin/env node
/* scripts/build-zadanie-1-teksty.mjs — черновик новых текстов №1 на вычитку
   (docs/zadanie-01-teksty.md) прямо из исходников: content/planimetriya1.ts
   и названия типов движка. Так файл для вычитки не расходится с сайтом.

     node scripts/build-zadanie-1-teksty.mjs          — записать файл
     node scripts/build-zadanie-1-teksty.mjs --check  — сверить, не записывая */

import fs from 'node:fs';
import path from 'node:path';
import { requireSrc, APP } from './lib/load-ts.mjs';

const FILE = path.join(APP, '..', 'docs', 'zadanie-01-teksty.md');

const C = requireSrc('content/planimetriya1.ts');
const { O_ZADANII_1 } = requireSrc('content/zadanie1.ts');
const { PROTOTIPY } = requireSrc('lib/planimetriya/stseny/index.ts');
const { BLOKI } = requireSrc('lib/planimetriya/prep/bloki.ts');

const S = C.SHAPKA1;
const T = C.TRENAZHER1;
const lines = [];
const p = (...xs) => lines.push(...xs);
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const kp = (id) => `p${String(id).padStart(2, '0')}`;

p(
  '# Задание №1 — новые тексты редизайна на вычитку',
  '',
  'Черновик. Всё, что ниже, написано заново для «Стеклянной сцены» и лежит в',
  '`app/src/content/planimetriya1.ts`. Файл собирается из исходников',
  '(`node scripts/build-zadanie-1-teksty.mjs`), поэтому совпадает с сайтом дословно.',
  'Условия задач, ответы, решения, подсказки-вопросы, справочник и прежние тексты',
  '«О задании» (`content/zadanie1.ts`) **не менялись** — их здесь нет.',
  '',
  'Обращение к ученику — на «ты», как в №7 и №6.',
  '',
  '## 1. Шапка «О задании»',
  '',
  '| Где | Текст |',
  '|---|---|',
  `| Надзаголовок | ${cell(S.nadzagolovok)} |`,
  `| Заголовок | ${cell(S.zagolovok)} |`,
  `| Вводка | прежняя: ${cell(O_ZADANII_1.lead)} |`,
  `| Факты | ${S.fakty(PROTOTIPY.length)
    .map((f) => `**${f.znachenie}** ${f.podpis}`)
    .join(' · ')} |`,
  `| Типы задач | ${cell(S.gruppyTitle)}. ${cell(S.gruppyLead)} |`,
  `| Что нужно знать | ${cell(S.znatTitle)}. ${cell(S.znatLead)} |`,
  `| Обложка (описание картинки) | ${cell(S.oblozhkaAlt)} |`,
  '',
  '«≈ 3 минуты» — моя оценка. Поправьте, если даёте другое время.',
  '',
  `«${S.opasnoTitle}» — прежние «${O_ZADANII_1.oshibkiTitle}» (четыре пункта) и «${O_ZADANII_1.format.title}» без правок.`,
  '',
  '## 2. «Где теряют балл» — свой текст у каждого из 75 типов',
  '',
  'Показывается под разобранным примером типа на «О задании».',
  '',
);
for (const t of O_ZADANII_1.tipy) {
  p(`### ${t.blok}. ${t.title}`, '', '| Тип | Где теряют балл |', '|---|---|');
  for (const proto of PROTOTIPY.filter((x) => x.blok === t.blok)) {
    p(`| ${cell(proto.nazvanie)} | ${cell(C.TIPY1_OPASNO[kp(proto.id)] ?? '—')} |`);
  }
  p('');
}
p(
  '## 3. «Что нужно знать»',
  '',
  'Факт и маленький пример к нему. Примеры посчитаны заново, проверьте числа.',
  '',
);
for (const blok of C.FORMULY1) {
  p(`### ${blok.nazvanie}`, '', '| Факт | Пример |', '|---|---|');
  for (const f of blok.formuly) p(`| $${cell(f.tex)}$ | $${cell(f.primer)}$ |`);
  p('');
}
p(
  '## 4. Опорные задачи: навыки',
  '',
  'Девять блоков опорных задач (они сами и их задачи не менялись) сгруппированы по навыкам, как в №3, №7 и №6.',
  '',
  `Вводка вкладки: ${C.OPORNYE1.lead}`,
  '',
  '| Навык | Пояснение | Блоки |',
  '|---|---|---|',
);
for (const n of C.NAVYKI1) {
  const bloki = n.bloki
    .map((b) => BLOKI.find((x) => x.slug === b.slug)?.nazvanie ?? b.slug)
    .join(', ');
  p(`| ${cell(n.nazvanie)} | ${cell(n.lead)} | ${cell(bloki)} |`);
}
p(
  '',
  '## 5. Подписи на экранах',
  '',
  '| Где | Текст |',
  '|---|---|',
  `| Пример типа: чертёж | «${S.chertezhUsloviya}» / «${S.naChertezhe(2)}» / «${S.vsePostroeniya}» · кнопка «${S.svernut}» / «${S.razvernut}» |`,
  `| Пример типа: откуда задача | «${S.zadachaBanka(13)}» / «${S.neIzBanka}» |`,
  `| Тренажёр: источник задач | ${Object.values(T.vybor.istochniki)
    .map((x) => `**${x}**`)
    .join(' · ')} |`,
  `| Тренажёр: чертёж | «${T.ekran.risunok}» / «${T.ekran.risunokPodskazka(1)}» / «${T.ekran.risunokReshenie}» / «${T.ekran.risunokShaga}» |`,
  `| Тренажёр: под условием | «${T.ekran.bank(37)}» / «${T.ekran.neIzBanka}» |`,
  `| Тренажёр: материалы под условием (подписи прежнего тренажёра) | «${T.ekran.povtoritTeoriyu}» · «${T.ekran.layfhak}» · «${T.ekran.opornyy}» · «${T.ekran.razborTipa}» |`,
  `| Опорные задачи | «${C.OPORNYE1.eshchyoVariant}» |`,
  '',
  'Подписи режимов, выбора тем, экрана задачи и итогов — общие с №7 и №6 (`content/treningBanka.ts`), на «ты».',
  '',
  '**Запись ответа — по общему правилу**, как в №8, №3, №7 и №6: засчитывается целое число или',
  'десятичная дробь. Обыкновенная дробь с верным значением («1/2» вместо «0,5») — подсказка, попытка не',
  'тратится. Раньше №1 такую запись засчитывал. Листы и генератор проверяют ответ по-прежнему.',
  '',
);

const text = lines.join('\n');
if (process.argv.includes('--check')) {
  const was = fs.existsSync(FILE) ? fs.readFileSync(FILE, 'utf8') : '';
  if (was !== text) {
    console.error(
      'docs/zadanie-01-teksty.md расходится с исходниками: node scripts/build-zadanie-1-teksty.mjs',
    );
    process.exit(1);
  }
  console.log('Тексты №1 для вычитки совпадают с исходниками.');
} else {
  fs.writeFileSync(FILE, text);
  console.log(`Записан ${path.relative(path.join(APP, '..'), FILE)}`);
}
