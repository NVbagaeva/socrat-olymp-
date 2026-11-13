#!/usr/bin/env node
/* scripts/build-zadanie-2-teksty.mjs — черновик новых текстов №2 на вычитку
   (docs/zadanie-2-teksty.md) прямо из исходников: content/vektory2.ts и
   названия типов генератора. Так файл для вычитки не расходится с сайтом.

     node scripts/build-zadanie-2-teksty.mjs          — записать файл
     node scripts/build-zadanie-2-teksty.mjs --check  — сверить, не записывая */

import fs from 'node:fs';
import path from 'node:path';
import { requireSrc, APP } from './lib/load-ts.mjs';

const FILE = path.join(APP, '..', 'docs', 'zadanie-2-teksty.md');

const C = requireSrc('content/vektory2.ts');
const { O_ZADANII } = requireSrc('content/vektory.ts');
const { PROTOTYPES } = requireSrc('lib/vektory/prototypes/index.ts');
const { BLOKI } = requireSrc('lib/vektory/prep/bloki.ts');

const S = C.SHAPKA2;
const T = C.TRENAZHER2;
const lines = [];
const p = (...xs) => lines.push(...xs);
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

p(
  '# Задание №2 — новые тексты редизайна на вычитку',
  '',
  'Черновик. Всё, что ниже, написано заново для «Стеклянной сцены» и лежит в',
  '`app/src/content/vektory2.ts`. Файл собирается из исходников',
  '(`node scripts/build-zadanie-2-teksty.mjs`), поэтому совпадает с сайтом дословно.',
  'Условия задач, ответы, разборы, теория, блоки «Что нужно уметь» и «Типичные ошибки» прежней вкладки',
  '(`content/oZadanii2.ts`) **не менялись** — их здесь нет.',
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
  `| Типичные ошибки | ${cell(C.ZNAT2.oshibkiLead)} |`,
  '',
  '«≈ 3 минуты» — моя оценка. Поправьте, если даёте другое время.',
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
for (const g of O_ZADANII.gruppy) {
  p(
    `### ${g.id}. ${g.title} (значок $${C.GRUPPY2_VID[g.id].znak}$)`,
    '',
    '| Тип | Где теряют балл |',
    '|---|---|',
  );
  for (const proto of PROTOTYPES.filter((x) => x.gruppa === g.id)) {
    p(`| ${cell(proto.nazvanie)} | ${cell(C.TIPY2_OPASNO[proto.id] ?? '—')} |`);
  }
  p('');
}
p(
  '## 3. Опорные задачи: навыки',
  '',
  'Блоки опорных задач (они сами и их задачи не менялись) сгруппированы по навыкам, как в №3, №7 и №6.',
  '',
  `Вводка вкладки: ${C.OPORNYE2.lead}`,
  '',
  '| Навык | Пояснение | Блоки |',
  '|---|---|---|',
);
for (const n of C.NAVYKI2) {
  const bloki = n.bloki
    .map((b) => BLOKI.find((x) => x.slug === b.slug)?.nazvanie ?? b.slug)
    .join(', ');
  p(`| ${cell(n.nazvanie)} | ${cell(n.lead)} | ${cell(bloki)} |`);
}
p(
  '',
  `Раздел «${C.OPORNYE2.triZnaka.title}»: ${C.OPORNYE2.triZnaka.lead}`,
  '',
  '## 4. Тренажёр',
  '',
  'Подписи режимов, выбора тем, экрана задачи и итогов — общие с №7 и №6 (`content/treningBanka.ts`), на «ты».',
  'Переключателя «Какие задачи» у №2 нет: все задачи строит генератор.',
  '',
  '**Режим «Контроль» → переключатель «Без подсказок и решений»**, как решено для всех разделов.',
  '',
  '**Запись ответа — по общему правилу**, как в №8, №3, №7 и №6: обыкновенная дробь с верным значением —',
  'подсказка, попытка не тратится. Раньше №2 засчитывал и обыкновенную дробь («3/5» вместо «0,6»).',
  '',
  '| Где | Текст |',
  '|---|---|',
  `| Подсказка | «${T.ekran.shagPodskazki(1, 3)}», кнопка «${T.ekran.sleduyushchiyShag}» |`,
  `| Опорные: кнопка | ${C.OPORNYE2.zadacha.eshcheVariant} |`,
  '',
);

const text = lines.join('\n');
if (process.argv.includes('--check')) {
  const was = fs.existsSync(FILE) ? fs.readFileSync(FILE, 'utf8') : '';
  if (was !== text) {
    console.error(
      'docs/zadanie-2-teksty.md расходится с исходниками: node scripts/build-zadanie-2-teksty.mjs',
    );
    process.exit(1);
  }
  console.log('Тексты №2 для вычитки совпадают с исходниками.');
} else {
  fs.writeFileSync(FILE, text);
  console.log(`Записан ${path.relative(path.join(APP, '..'), FILE)}`);
}
