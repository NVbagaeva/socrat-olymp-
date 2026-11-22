#!/usr/bin/env node
/* scripts/build-zadanie-5-teksty.mjs — черновик новых текстов №5 на вычитку
   (docs/zadanie-5-teksty.md) прямо из исходников: content/veroyatnost5.ts,
   content/veroyatnost45.ts и названия методов и типов банка. Так файл для
   вычитки не расходится с сайтом.

     node scripts/build-zadanie-5-teksty.mjs          — записать файл
     node scripts/build-zadanie-5-teksty.mjs --check  — сверить, не записывая */

import fs from 'node:fs';
import path from 'node:path';
import { requireSrc, APP } from './lib/load-ts.mjs';

const FILE = path.join(APP, '..', 'docs', 'zadanie-5-teksty.md');

const C = requireSrc('content/veroyatnost5.ts');
const C45 = requireSrc('content/veroyatnost45.ts');
const { BANK_5, PODGOTOVKA_5 } = requireSrc('lib/veroyatnost/index.ts');
const { METODY_5 } = requireSrc('lib/veroyatnost/metody5.ts');

const S = C.SHAPKA5;
const T = C45.tekstyTrenazhera45(5);
const metody = METODY_5.filter((m) => BANK_5.some((p) => p.blok === m.id));
const lines = [];
const p = (...xs) => lines.push(...xs);
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

p(
  '# Задание №5 — новые тексты редизайна на вычитку',
  '',
  'Черновик. Всё, что ниже, написано заново для «Стеклянной сцены» и лежит в',
  '`app/src/content/veroyatnost5.ts` и `app/src/content/veroyatnost45.ts`. Файл собирается из исходников',
  '(`node scripts/build-zadanie-5-teksty.mjs`), поэтому совпадает с сайтом дословно.',
  'Условия задач, ответы, решения, подсказки-вопросы, признаки «Узнай метод», теория, «Ключевые методы решения»',
  'и прежние тексты «О задании» («Что это за задание», «Какие задачи встречаются», «Важно понимать») **не менялись** — их здесь нет.',
  '',
  'Обращение к ученику — на «ты», как в №6 и №7.',
  '',
  '## 1. Шапка «О задании»',
  '',
  '| Где | Текст |',
  '|---|---|',
  `| Надзаголовок | ${cell(S.nadzagolovok)} |`,
  `| Заголовок | ${cell(S.zagolovok)} |`,
  `| Вводка | ${cell(S.lead)} |`,
  `| Факты | ${S.fakty(BANK_5.length)
    .map((f) => `**${f.znachenie}** ${f.podpis}`)
    .join(' · ')} |`,
  `| Типы задач | ${cell(S.gruppyTitle)}. ${cell(S.gruppyLead)} |`,
  `| Что нужно знать | ${cell(S.znatTitle)}. ${cell(S.znatLead)} |`,
  `| Ссылка под формулами | ${cell(S.metodyLink)} |`,
  `| Блок прежних текстов | ${cell(S.obZadanii)} (внутри — «Что это за задание», «Какие задачи встречаются» со списком методов и плашкой про №4, «Важно понимать» — без правок) |`,
  '',
  '«≈ 4 минуты» — моя оценка (несколько действий, часто дерево). Поправьте, если даёте другое время.',
  '',
  `### ${S.opasnoTitle}`,
  '',
  ...S.opasno.map((line, i) => `${i + 1}. ${line}`),
  '',
  '## 2. «Где теряют балл» — свой текст у каждого типа',
  '',
  'Показывается под разобранным примером типа на «О задании». Группа — метод (название из банка).',
  '',
);
for (const m of metody) {
  p(`### ${m.nazvanie}`, '', '| Тип | Где теряют балл |', '|---|---|');
  for (const proto of BANK_5.filter((x) => x.blok === m.id)) {
    p(`| ${cell(proto.nazvanie)} | ${cell(C.TIPY5_OPASNO[proto.id] ?? '—')} |`);
  }
  p('');
}
p(
  '## 3. «Что нужно знать»',
  '',
  'Формула и маленький пример к ней. Примеры посчитаны заново, проверьте числа.',
  '',
);
for (const blok of C.FORMULY5) {
  p(`### ${blok.nazvanie}`, '', '| Формула | Пример |', '|---|---|');
  for (const f of blok.formuly) p(`| $${cell(f.tex)}$ | $${cell(f.primer)}$ |`);
  p('');
}
p(
  '## 4. Опорные задачи: навыки',
  '',
  'Семь блоков опорных задач (они сами и их задачи не менялись) сгруппированы по навыкам, как в №3, №6 и №7.',
  '',
  `Вводка вкладки: ${C.OPORNYE5_LEAD}`,
  '',
  '| Навык | Пояснение | Блоки |',
  '|---|---|---|',
);
for (const n of C.NAVYKI5) {
  const bloki = n.bloki
    .map(({ id }) => PODGOTOVKA_5.find((b) => b.id === id)?.nazvanie ?? id)
    .join(', ');
  p(`| ${cell(n.nazvanie)} | ${cell(n.lead)} | ${cell(bloki)} |`);
}
p(
  '',
  '## 5. Тренажёр',
  '',
  'Подписи выбора тем, экрана задачи и итогов — общие с №7 и №6 (`content/treningBanka.ts`), на «ты».',
  'Свои у №5 и №5 — режимы и «Узнай метод»:',
  '',
  '| Где | Текст |',
  '|---|---|',
  `| Режим 1 | **${T.rezhimy.mix.zag}** — ${cell(T.rezhimy.mix.lead(10))} |`,
  `| Режим 2 | **${T.rezhimy.temy.zag}** — ${cell(T.rezhimy.temy.lead)} |`,
  `| Режим 3 | **${T.rezhimy.oshibki.zag}** — ${cell(T.rezhimy.oshibki.lead(2))} |`,
  `| Режим 4 | **${T.rezhimy.uznay.zag}** — ${cell(T.rezhimy.uznay.lead(10))} |`,
  `| Выбор тем | ${cell(T.vybor.title)} |`,
  `| Источник задач | ${Object.values(T.vybor.istochniki)
    .map((x) => `**${x}**`)
    .join(' · ')} |`,
  `| Над условием | «${cell(T.ekran.istochnik)}»; в «Выбрать методы» с подсказками — название метода |`,
  `| «Узнай метод»: вопрос | ${cell(T.uznay.vopros)} |`,
  `| «Узнай метод»: верно | ${cell(T.uznay.verno)} ${cell(T.uznay.vernoLead)} |`,
  `| «Узнай метод»: неверно | ${cell(T.uznay.neverno)}. ${cell(T.uznay.pravilnyy)} … ${cell(T.uznay.nevernoLead)} |`,
  `| «Узнай метод»: прогресс | ${cell(T.uznay.progress)}; пусто — ${cell(T.uznay.progressPusto)} |`,
  '',
  '**Режим «Узнай метод» — четвёртая карточка режима** (решение владельца), «Повтор ошибок» — «Работа над ошибками»,',
  '«Показывать подсказки» — переключатель «Без подсказок и решений». Незаконченная тренировка прежнего тренажёра',
  'открывается на той же задаче.',
  '',
  '**Запись ответа — по общему правилу**, как в №8, №3, №7 и №6: засчитывается целое число или десятичная дробь.',
  'Обыкновенная дробь с верным значением («11/20» вместо «0,55») — подсказка, попытка не тратится. Раньше',
  '№5 такую запись засчитывал. Листы и генератор проверяют ответ по-прежнему.',
  '',
);

const text = lines.join('\n');
if (process.argv.includes('--check')) {
  const was = fs.existsSync(FILE) ? fs.readFileSync(FILE, 'utf8') : '';
  if (was !== text) {
    console.error(
      'docs/zadanie-5-teksty.md расходится с исходниками: node scripts/build-zadanie-5-teksty.mjs',
    );
    process.exit(1);
  }
  console.log('Тексты №5 для вычитки совпадают с исходниками.');
} else {
  fs.writeFileSync(FILE, text);
  console.log(`Записан ${path.relative(path.join(APP, '..'), FILE)}`);
}
