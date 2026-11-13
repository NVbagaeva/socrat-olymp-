#!/usr/bin/env node
/* scripts/build-zadanie-12-teksty.mjs — черновик новых текстов №12 на вычитку
   (docs/zadanie-12-teksty.md) прямо из исходников: content/zadanie12.ts,
   названия видов функций (data/functionTypes.ts) и типов (content/skills12.ts).
   Так файл для вычитки не расходится с сайтом.

     node scripts/build-zadanie-12-teksty.mjs          — записать файл
     node scripts/build-zadanie-12-teksty.mjs --check  — сверить, не записывая */

import fs from 'node:fs';
import path from 'node:path';
import { requireSrc, APP } from './lib/load-ts.mjs';

const FILE = path.join(APP, '..', 'docs', 'zadanie-12-teksty.md');

const C = requireSrc('content/zadanie12.ts');
const { functionTypes } = requireSrc('data/functionTypes.ts');
const { skillTitle } = requireSrc('content/skills12.ts');
const { podtemaNabora } = requireSrc('lib/ves12/trenazher12.ts');
const { katalog12 } = requireSrc('lib/ves12/trening/katalog.ts');

const S = C.SHAPKA12;
const T = C.TRENAZHER12;
const nabory = Object.keys(katalog12());
const vidNabora = podtemaNabora();
const vidy = functionTypes
  .map((vid) => ({ vid, nabory: nabory.filter((n) => vidNabora[n] === vid.id) }))
  .filter((v) => v.nabory.length > 0);

const lines = [];
const p = (...xs) => lines.push(...xs);
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

p(
  '# Задание №12 — новые тексты редизайна на вычитку',
  '',
  'Черновик. Всё, что ниже, написано заново для «Стеклянной сцены» и лежит в',
  '`app/src/content/zadanie12.ts`. Файл собирается из исходников',
  '(`node scripts/build-zadanie-12-teksty.mjs`), поэтому совпадает с сайтом дословно.',
  'Условия задач, ответы, разборы, подсказки по шагам тренажёра и теория **не менялись** — их здесь нет.',
  '',
  'Обращение к ученику — на «ты», как в №7 и №6.',
  '',
  '## 1. Шапка «О задании» узла',
  '',
  '| Где | Текст |',
  '|---|---|',
  `| Надзаголовок | ${cell(S.nadzagolovok)} |`,
  `| Заголовок | ${cell(S.zagolovok)} |`,
  `| Вводка | ${cell(S.lead)} |`,
  `| Факты | ${S.fakty(nabory.length, vidy.length)
    .map((f) => `**${f.znachenie}** ${f.podpis}`)
    .join(' · ')} |`,
  `| Типы задач | ${cell(S.gruppyTitle)}. ${cell(S.gruppyLead)} |`,
  `| Ссылка на вид | ${cell(S.vidOtkryt('Квадратичная функция'))} |`,
  `| Что нужно знать | ${cell(S.znatTitle)}. ${cell(S.znatLead)} |`,
  '',
  '«≈ 4 минуты» — моя оценка. Поправьте, если даёте другое время.',
  '',
  `### ${S.opasnoTitle}`,
  '',
  ...S.opasno.map((line, i) => `${i + 1}. ${line}`),
  '',
  '## 2. «Где теряют балл» — свой текст у каждого типа',
  '',
  'Показывается под разобранным примером типа на «О задании». Названия типов — прежние (`content/skills12.ts`).',
  '',
);
for (const { vid, nabory: tipy } of vidy) {
  p(`### ${vid.title}`, '', '| Тип | Где теряют балл |', '|---|---|');
  for (const n of tipy) {
    p(`| ${cell(skillTitle[n] ?? n)} | ${cell(C.TIPY12_OPASNO[n] ?? '—')} |`);
  }
  p('');
}
p(
  '## 3. «Что нужно знать»',
  '',
  'Формула и маленький пример к ней — по видам функций. Примеры посчитаны заново, проверьте числа.',
  '',
);
for (const blok of C.FORMULY12) {
  const nazvanie = functionTypes.find((t) => t.id === blok.vid)?.title ?? blok.vid;
  p(`### ${nazvanie}`, '', '| Формула | Пример |', '|---|---|');
  for (const f of blok.formuly) p(`| $${cell(f.tex)}$ | $${cell(f.primer)}$ |`);
  p('');
}
p(
  '## 4. Тренажёр узла',
  '',
  'Подписи режимов, выбора тем, экрана задачи и итогов — общие с №7 и №6 (`content/treningBanka.ts`), на «ты».',
  '',
  '**Режимы прежнего тренажёра:** «Без подсказок» стал переключателем «Без подсказок и решений», «На время» —',
  'таймером (решение владельца). Незаконченная тренировка прежнего тренажёра открывается в новом.',
  '',
  '**Запись ответа — по общему правилу** (`lib/otvet`): засчитывается целое число или десятичная дробь;',
  'обыкновенная дробь с верным значением («1/2» вместо «0,5») — подсказка, попытка не тратится. Раньше',
  '№12 такую запись засчитывал. Листы, генератор и зачётная работа проверяют ответ по-прежнему.',
  '',
  '| Где | Текст |',
  '|---|---|',
  `| Все вперемешку | ${cell(T.rezhimy.mix.zag)}: ${cell(T.rezhimy.mix.lead(10))} |`,
  `| Источник задач | ${Object.values(T.vybor.istochniki)
    .map((x) => `**${x}**`)
    .join(' · ')} |`,
  `| Над подсказкой | ${cell(T.ekran.podskazkaLead)} |`,
  `| Подписи чертежей | ${cell(T.ekran.chertezh)} · ${cell(T.ekran.chertezhShaga)} |`,
  `| Чертёж в примере | ${cell(S.svernut)} · ${cell(S.razvernut)} |`,
  '',
);

const text = lines.join('\n');
if (process.argv.includes('--check')) {
  const was = fs.existsSync(FILE) ? fs.readFileSync(FILE, 'utf8') : '';
  if (was !== text) {
    console.error(
      'docs/zadanie-12-teksty.md расходится с исходниками: node scripts/build-zadanie-12-teksty.mjs',
    );
    process.exit(1);
  }
  console.log('Тексты №12 для вычитки совпадают с исходниками.');
} else {
  fs.writeFileSync(FILE, text);
  console.log(`Записан ${path.relative(path.join(APP, '..'), FILE)}`);
}
