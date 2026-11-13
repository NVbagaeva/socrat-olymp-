#!/usr/bin/env node
/* scripts/build-zadanie-13-teksty.mjs — черновик новых текстов №13 на вычитку
   (docs/zadanie-13-teksty.md) прямо из исходников: content/ekonomicheskie13.ts,
   названия типов движка и задачи-примеры. Так файл для вычитки не расходится
   с сайтом.

     node scripts/build-zadanie-13-teksty.mjs          — записать файл
     node scripts/build-zadanie-13-teksty.mjs --check  — сверить, не записывая */

import fs from 'node:fs';
import path from 'node:path';
import { requireSrc, APP } from './lib/load-ts.mjs';

const FILE = path.join(APP, '..', 'docs', 'zadanie-13-teksty.md');

const C = requireSrc('content/ekonomicheskie13.ts');
const { PROTOTIPY_TRENAZHERA_13, SHEMY_13 } = requireSrc('lib/zadanie13/trening/katalog.ts');
const { TYPE_NAMES } = requireSrc('lib/zadanie13/types.ts');
const { BANK_13 } = requireSrc('lib/zadanie13/bank.ts');
const { O_ZADANII_13, OPORNYE_13 } = requireSrc('content/zadanie13.ts');
const { generate } = requireSrc('lib/zadanie13/generate.ts');

const S = C.SHAPKA13;
const T = C.TRENAZHER13;
const lines = [];
const p = (...xs) => lines.push(...xs);
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

/* Seed примера — как на карте (OZadanii13.seedPrimera). */
const PRIMER_SEED = Object.fromEntries(
  O_ZADANII_13.tipy.map((t) => [t.primer.prototypeId, t.primer.seed]),
);
const seedPrimera = (id) => PRIMER_SEED[id] ?? BANK_13.find(([x]) => x === id)?.[1] ?? 'b1';

p(
  '# Задание №13 — новые тексты редизайна на вычитку',
  '',
  'Черновик. Всё, что ниже, написано заново для «Стеклянной сцены» и лежит в',
  '`app/src/content/ekonomicheskie13.ts`. Файл собирается из исходников',
  '(`node scripts/build-zadanie-13-teksty.mjs`), поэтому совпадает с сайтом дословно.',
  'Условия задач, ответы, решения, подсказки-вопросы и теория **не менялись** — их здесь нет.',
  'Рамка «Важно» про единицы ответа и таблица «Как узнать схему за 10 секунд» — прежние тексты раздела.',
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
  `| Факты | ${S.fakty(PROTOTIPY_TRENAZHERA_13.length)
    .map((f) => `**${f.znachenie}** ${f.podpis}`)
    .join(' · ')} |`,
  `| Типы задач | ${cell(S.gruppyTitle)}. ${cell(S.gruppyLead)} |`,
  `| Что нужно знать | ${cell(S.znatTitle)}. ${cell(S.znatLead)} |`,
  `| Метки типа | «${S.povyshennyy}», «${S.neIzBanka}» |`,
  '',
  '«≈ 12 минут» — моя оценка. Поправьте, если даёте другое время.',
  '',
  `### ${S.opasnoTitle}`,
  '',
  ...S.opasno.map((line, i) => `${i + 1}. ${line}`),
  '',
  '## 2. Схемы (группы)',
  '',
  '| Схема | Значок | Пояснение |',
  '|---|---|---|',
  ...SHEMY_13.map(
    (s) =>
      `| ${cell(TYPE_NAMES[s])} | $${cell(C.GRUPPY13_VID[s].znak)}$ | ${cell(C.GRUPPY13_VID[s].lead)} |`,
  ),
  '',
  '## 3. «Где теряют балл»',
  '',
  'Собирается из двух частей: что спрашивают (тип вопроса задачи-примера), а если вопрос',
  'обычный — ловушка схемы; и в каких единицах ответ. Ниже — части и что вышло у каждого типа.',
  '',
  '### Части: тип вопроса',
  '',
  '| Вопрос | Текст |',
  '|---|---|',
  ...Object.entries(C.OPASNO_VOPROS13).map(([k, v]) => `| ${k} | ${cell(v)} |`),
  '',
  '### Части: схема (если вопрос обычный)',
  '',
  '| Схема | Текст |',
  '|---|---|',
  ...SHEMY_13.map((s) => `| ${cell(TYPE_NAMES[s])} | ${cell(C.OPASNO_SHEMA13[s])} |`),
  '',
  '### Части: единицы ответа',
  '',
  '| Единицы | Текст |',
  '|---|---|',
  ...Object.entries(C.OPASNO_EDINICY13).map(([k, v]) => `| ${k} | ${cell(v)} |`),
  '',
);
for (const s of SHEMY_13) {
  p(`### ${TYPE_NAMES[s]}`, '', '| Тип | Где теряют балл |', '|---|---|');
  for (const proto of PROTOTIPY_TRENAZHERA_13.filter((x) => x.type === s)) {
    const t = generate(proto.id, seedPrimera(proto.id));
    p(`| ${cell(proto.title)} | ${cell(C.opasno13(proto.type, t.vopros, t.units))} |`);
  }
  p('');
}
p(
  '## 4. «Что нужно знать»',
  '',
  'Формула и маленький пример к ней. Формулы и примеры взяты из теории раздела; пример переплаты',
  '($S = 1000$, $n = 3$, $r = 10$) посчитан заново — проверьте числа.',
  '',
);
for (const blok of C.FORMULY13) {
  p(`### ${blok.nazvanie}`, '', '| Формула | Пример |', '|---|---|');
  for (const f of blok.formuly) p(`| $${cell(f.tex)}$ | $${cell(f.primer)}$ |`);
  p('');
}
p(
  '## 5. Опорные задачи',
  '',
  'Блоки и их задачи не менялись. Группы блоков — прежние (`OPORNYE_13.gruppy`), на общих карточках.',
  '',
  `Вводка вкладки: ${C.OPORNYE13.lead}`,
  '',
  `Группы: ${OPORNYE_13.gruppy.map((g) => g.title).join(' · ')}.`,
  '',
  '## 6. Тренажёр',
  '',
  'Подписи режимов, выбора тем, экрана задачи и итогов — общие с №7 и №6 (`content/treningBanka.ts`), на «ты».',
  '',
  '| Где | Текст |',
  '|---|---|',
  `| Пятая карточка режима | **${T.rezhimy.oformlenie.zag}** — ${T.rezhimy.oformlenie.lead(10)} |`,
  `| Выбор тем: как отвечать | ${T.vybor.otvet.title}: ${T.vybor.otvet.varianty.map((v) => `**${v.label}**`).join(' · ')} |`,
  `| Выбор тем: уровень | ${T.vybor.urovni.title}: ${['vse', '1', '2']
    .map((k) => T.vybor.urovni.labels[k])
    .map((x) => `**${x}**`)
    .join(' · ')} |`,
  `| Нет задач уровня | ${cell(T.vybor.urovni.pusto)} |`,
  `| Четвёртая карточка режима | **${T.rezhimy.tip.zag}** — ${T.rezhimy.tip.lead(10)} |`,
  `| Источник задач | ${Object.values(T.vybor.istochniki)
    .map((x) => `**${x}**`)
    .join(' · ')} |`,
  `| Нет задач под источник | ${cell(T.vybor.istochnikPusto)} |`,
  `| Вердикт про единицы | **${T.ekran.edinicy.zag}.** ${cell(T.ekran.edinicy.lead)} |`,
  `| «Определи тип», подпись выбора | ${T.ekran.tipVopros} |`,
  '',
);

const text = lines.join('\n');
if (process.argv.includes('--check')) {
  const was = fs.existsSync(FILE) ? fs.readFileSync(FILE, 'utf8') : '';
  if (was !== text) {
    console.error(
      'docs/zadanie-13-teksty.md расходится с исходниками: node scripts/build-zadanie-13-teksty.mjs',
    );
    process.exit(1);
  }
  console.log('Тексты №13 для вычитки совпадают с исходниками.');
} else {
  fs.writeFileSync(FILE, text);
  console.log(`Записан ${path.relative(path.join(APP, '..'), FILE)}`);
}
