#!/usr/bin/env node
/* scripts/build-zadanie-3-teksty.mjs — тексты задания №3 одним файлом
   для вычитки: docs/zadanie-3-teksty.md.

   Документ собирается из тех же модулей, что и сайт: правка текста —
   в исходнике (content/zadanie3, lib/stereo/razbory3, lib/zadanie3),
   потом заново этот скрипт. Руками файл не правится.

   Запуск: node scripts/build-zadanie-3-teksty.mjs
           node scripts/build-zadanie-3-teksty.mjs --check
   (--check — совпадает ли файл с исходниками) */

import fs from 'node:fs';
import path from 'node:path';
import { requireSrc, APP } from './lib/load-ts.mjs';

const { GRUPPY3, TIPY3, prototipyTipa } = requireSrc('content/zadanie3/gruppy.ts');
const { SHAPKA3, FORMULY3, PODOBIE3 } = requireSrc('content/zadanie3/spravka.ts');
const { NAVYKI3, BLOKI3_NAZVANIYA, OPORNYE3 } = requireSrc('content/zadanie3/navyki.ts');
const { TRENAZHER3 } = requireSrc('content/zadanie3/trenazher.ts');
const { RAZBORY_3 } = requireSrc('lib/stereo/razbory3.ts');
const { prototypeById } = requireSrc('lib/zadanie3/index.ts');
const { shagTekst } = requireSrc('lib/zadanie3/trening/dannye.ts');
const { BLOKI_3 } = requireSrc('lib/stereo/opornye3/bloki.ts');

const out = [];
const p = (line = '') => out.push(line);
const ru = (x) => String(x).replace('.', ',');
const cherez = (list, znak) => list.join(znak);

p('# Задание №3 «Стереометрия»: тексты для вычитки');
p();
p(
  'Файл собран скриптом `app/scripts/build-zadanie-3-teksty.mjs` из тех же исходников, что и сайт. Править нужно исходник, а не этот файл; где лежит каждый текст — указано в начале раздела.',
);
p();
p('Формулы записаны как на сайте: между знаками `$…$` — TeX.');
p();
p(
  'Что здесь черновик автора редизайна и ждёт вычитки: шапка и «Чем опасно», названия групп и типов, строка под названием типа, «Где теряют балл», названия навыков и блоков, подписи тренажёра. Разобранные примеры, решения и подсказки задач банка написаны раньше — они здесь для сверки и чтобы вычитать разбивку шага на подпись и формулу.',
);
p();

p('## 1. Вкладка «О задании»: шапка');
p();
p('Исходник: `app/src/content/zadanie3/spravka.ts`.');
p();
p(`- Надзаголовок: ${SHAPKA3.nadzagolovok}`);
p(`- Заголовок: ${SHAPKA3.zagolovok}`);
p(`- Описание: ${SHAPKA3.lead}`);
p(
  `- Факты: ${cherez(
    SHAPKA3.fakty.map((f) => `${f.znachenie} — ${f.podpis}`),
    '; ',
  )}`,
);
p();
p(`### ${SHAPKA3.opasnoTitle}`);
p();
SHAPKA3.opasno.forEach((line, i) => p(`${i + 1}. ${line}`));
p();
p(`Заголовок блока типов: «${SHAPKA3.gruppyTitle}». Подзаголовок: ${SHAPKA3.gruppyLead}`);
p();

p('## 2. Группы и типы');
p();
p(
  'Исходник названий и текстов типов: `app/src/content/zadanie3/gruppy.ts`. Разобранные примеры: `app/src/lib/stereo/razbory3.ts`. Решения и подсказки задач банка: `app/src/lib/zadanie3/razdel1` … `razdel8`.',
);
p();
let nomerTipa = 0;
for (const g of GRUPPY3) {
  p(`### Группа «${g.nazvanie}»`);
  p();
  p(`Строка под названием: ${g.lead}`);
  p();
  for (const tip of g.tipy) {
    nomerTipa += 1;
    const t = TIPY3[tip];
    const blok = BLOKI_3.find((b) => b.slug === t.opornye);
    p(`#### Тип ${nomerTipa}. ${t.nazvanie}`);
    p();
    p(`- Строка под названием: ${t.lead}`);
    p(`- Где теряют балл: ${t.opasno}`);
    p(
      `- Кнопка «Опорные задачи этого типа» ведёт в блок: «${BLOKI3_NAZVANIYA[t.opornye] ?? blok?.nazvanie}»`,
    );
    p();
    const razbor = RAZBORY_3.find((r) => r.tip === tip);
    if (razbor !== undefined) {
      p('**Разобранный пример**');
      p();
      p(`Условие: ${razbor.uslovie}`);
      p();
      razbor.shagi.forEach((s, i) => {
        p(`${i + 1}. **${s.chto}.** ${cherez(s.zachem, ' ')}`);
        (s.formuly ?? []).forEach((f) => p(`   - $${f}$`));
      });
      p();
      p(`Ответ: ${razbor.otvetTex ?? ru(razbor.otvet)}`);
      p();
    }
    p(
      '**Задачи тренажёра этого типа** (первый вариант каждой задачи банка; код слева — служебный, ученику он не виден)',
    );
    p();
    for (const id of prototipyTipa(tip)) {
      const prototype = prototypeById(id);
      const v = prototype.varianty[0];
      p(`<details><summary>${id} · ${prototype.nazvanie}</summary>`);
      p();
      p(`Условие: ${prototype.uslovie(v.params)}`);
      p();
      const vopros = prototype.podskazka?.(v.params)[0]?.question;
      p(`Подсказка-вопрос: ${vopros ?? '—'}`);
      p();
      p('Решение по шагам:');
      p();
      prototype.shagi(v.params).forEach((step, i) => {
        const s = shagTekst(step);
        p(`${i + 1}. ${s.chto}`);
        if (s.formula !== '') {
          p(`   - ${s.formula}`);
        }
      });
      p();
      p(`Ответ: ${ru(prototype.otvet(v.params))}`);
      p();
      p('</details>');
      p();
    }
  }
}

p('## 3. «Что нужно знать»');
p();
p(
  'Исходник: `app/src/content/zadanie3/spravka.ts`. У каждой рамки — чертёж с подписанными величинами.',
);
p();
for (const blok of FORMULY3) {
  p(`### ${blok.nazvanie}`);
  p();
  blok.formuly.forEach((f) => p(`- $${f.tex}$ — например: $${f.primer}$`));
  p();
}
p(`### ${PODOBIE3.nazvanie}`);
p();
p(PODOBIE3.lead);
p();
PODOBIE3.stroki.forEach((s) => p(`- ${s.chto} — в $${s.vo}$ раз (${PODOBIE3.pri(s.primer)})`));
p();
p(PODOBIE3.primer);
p();

p('## 4. Вкладка «Опорные задачи»: навыки и блоки');
p();
p(
  'Исходник: `app/src/content/zadanie3/navyki.ts`. Сами задачи, подсказки и решения блоков лежат в `app/src/lib/stereo/opornye3` (написаны раньше, здесь не повторяются).',
);
p();
p(`Заголовок: «${OPORNYE3.title}». Подзаголовок: ${OPORNYE3.lead}`);
p();
p('| Навык | Строка под названием | Блоки (было → стало) |');
p('|---|---|---|');
for (const n of NAVYKI3) {
  const bloki = cherez(
    n.bloki.map(
      (slug) => `${BLOKI_3.find((b) => b.slug === slug)?.nazvanie} → **${BLOKI3_NAZVANIYA[slug]}**`,
    ),
    '<br>',
  );
  p(`| ${n.nazvanie} | ${n.lead} | ${bloki} |`);
}
p();

p('## 5. Вкладка «Тренажёр»: подписи');
p();
p('Исходник: `app/src/content/zadanie3/trenazher.ts`.');
p();
const T = TRENAZHER3;
p('**Стартовый экран**');
p();
p(`- Заголовок: ${T.rezhimy.title}`);
p(`- ${T.rezhimy.mix.zag} — ${T.rezhimy.mix.lead(10)}`);
p(`- ${T.rezhimy.temy.zag} — ${T.rezhimy.temy.lead}`);
p(`- ${T.rezhimy.oshibki.zag} — ${T.rezhimy.oshibki.lead(0)}`);
p(`- ${T.rezhimy.oshibki.zag}, когда ошибки есть — ${T.rezhimy.oshibki.lead(3)}`);
p();
p('**Выбор тем**');
p();
p(`- ${T.vybor.title}; ${T.vybor.vse}; ${T.vybor.nichego}`);
p(`- ${T.vybor.skolko}: 5, 10, 20, ${T.vybor.bezKonca}`);
p(`- ${T.vybor.taymer}: ${T.vybor.sTaymerom}; ${T.vybor.bezTaymera}`);
p(`- ${T.vybor.istochnik}: ${cherez(Object.values(T.vybor.istochniki), '; ')}`);
p(`- ${T.vybor.bezPodskazok} — ${T.vybor.bezPodskazokLead}`);
p(`- Кнопка: ${T.vybor.nachat}`);
p(`- Если ничего не выбрано: ${T.vybor.pusto}`);
p(`- Если в источнике нет задач: ${T.vybor.istochnikPusto}`);
p();
p('**Экран задачи**');
p();
p(
  `- Поле: ${T.ekran.otvet}; кнопки: ${cherez([T.ekran.proverit, T.ekran.podskazka, T.ekran.reshenie, T.ekran.pohozhaya, T.ekran.dalshe, T.ekran.itogi], ', ')}`,
);
p(`- Верно: «${T.ekran.verno}» — ${T.ekran.vernoLead(48)}`);
p(`- Неверно: «${T.ekran.neverno}» — ${T.ekran.nevernoLead}`);
p(`- Неверно, ответ дробью: ${T.ekran.nevernoDrob}`);
p(`- С открытым решением: «${T.ekran.sRazborom}» — ${T.ekran.sRazboromLead}`);
p(`- Режим без подсказок: ${T.ekran.bezPodskazok}`);
p(`- Загрузка: ${T.ekran.zagruzka}`);
p(`- Сбой загрузки: ${T.ekran.oshibkaZagruzki}`);
p();
p('**Итоги**');
p();
p(
  `- Заголовок (от 90 %, от 60 %, меньше): ${cherez(
    [0.95, 0.7, 0.3].map((d) => `«${T.itogi.title(d)}»`),
    ', ',
  )}`,
);
p(`- Строка: ${T.itogi.lead(312, 31, 1)}`);
p(`- ${T.itogi.poTipam}; метка у слабой группы: «${T.itogi.prosel}»`);
p(`- ${T.itogi.rabota(2)} — ${T.itogi.rabotaLead}`);
p(`- Отметки задач: ${cherez(Object.values(T.itogi.otmetki), ', ')}`);
p();
p('**Прогресс**');
p();
p(`- ${T.progress.title}; метка: «${T.progress.povtorit}»; ${T.progress.schet(37, 920)}`);
p(`- Пусто: ${T.progress.pusto}`);
p(`- ${T.progress.oshibki}: ${T.progress.oshibokNet}`);
p(`- ${T.progress.otlozhennye}: ${T.progress.otlozhennyhNet}`);
p(`- ${T.progress.istoriya}: ${T.progress.istoriiNet}`);
p(`- ${T.progress.sbros}: ${T.progress.sbrosVopros}`);
p();

const file = path.resolve(APP, '..', 'docs', 'zadanie-3-teksty.md');
const text = `${out.join('\n')}\n`;
if (process.argv.includes('--check')) {
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text) {
    console.error(
      'docs/zadanie-3-teksty.md не совпадает с исходниками: node scripts/build-zadanie-3-teksty.mjs',
    );
    process.exit(1);
  }
  console.log('docs/zadanie-3-teksty.md совпадает с исходниками');
} else {
  fs.writeFileSync(file, text);
  console.log(`docs/zadanie-3-teksty.md: ${out.length} строк`);
}
