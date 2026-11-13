#!/usr/bin/env node
/* scripts/check-redesign.mjs — редизайн раздела ничего не сломал в
   картинках и содержании.

   Запуск: node scripts/check-redesign.mjs <номер раздела> [ветка-образец]
   (после pnpm build; ветка-образец по умолчанию — origin/main).

     1. Картинки. Каждый файл реестра (docs/redesign-kartinki.sha256,
        снят на шаге 0) лежит на месте, и его контрольная сумма та же:
        редизайн не перегенерирует, не пережимает и не обрезает картинки.
     2. Картинки раздела по-прежнему на страницах. Каждое семейство
        картинок раздела (один рисунок в нескольких размерах — одно
        семейство) встречается в собранных страницах раздела или в их
        скриптах: картинка не пропала из вёрстки.
     3. Банк и содержание раздела те же, что в ветке-образце: файлы
        банка, прототипов, опорных задач и теории не изменились ни на
        байт (git). Меняется подача, а не содержание.

   Что считать содержанием раздела — таблица SODERZHANIE ниже: при
   редизайне следующего раздела в неё добавляется строка. */

import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = path.join(APP, '..');
const OUT = path.join(APP, 'out');

const razdel = process.argv[2];
const obrazec = process.argv[3] ?? 'origin/main';
if (!/^\d{1,2}$/.test(razdel ?? '')) {
  console.error('Укажите номер раздела: node scripts/check-redesign.mjs 7');
  process.exit(2);
}

/** Файлы и папки содержания раздела (пути от корня репозитория). */
const SODERZHANIE = {
  1: [
    /* Банк, аналоги, сцены чертежей, решения и подсказки, опорные задачи,
       движок чертежей, генератор и листы, теория и карточки. */
    'app/src/lib/planimetriya/bank',
    'app/src/lib/planimetriya/stseny',
    'app/src/lib/planimetriya/reshenie',
    'app/src/lib/planimetriya/prep',
    'app/src/lib/planimetriya/render.ts',
    'app/src/lib/planimetriya/figury.ts',
    'app/src/lib/planimetriya/geom.ts',
    'app/src/lib/planimetriya/kollizii.ts',
    'app/src/lib/planimetriya/stil.ts',
    'app/src/lib/planimetriya/variant.ts',
    'app/src/lib/planimetriya/secret.ts',
    'app/src/lib/planimetriya/generator1.ts',
    'app/src/lib/planimetriya/sheet1.ts',
    'app/src/lib/planimetriya/uroki.ts',
    'app/src/lib/planimetriya/teoriya.ts',
    'app/src/lib/planimetriya/spravochnik.ts',
    'app/src/lib/planimetriya/spravochnik-chertezhi.ts',
    'app/src/lib/planimetriya/spravochnik-zadachi.ts',
    'app/src/lib/planimetriya/trenazher/zadacha.ts',
    'app/src/content/zadanie1.ts',
    'app/src/content/teoriya1.ts',
    'app/src/content/spravochnik1',
    'app/src/content/generator1.ts',
    'app/src/content/repetitory1.ts',
    'app/src/content/kartochki/01-planimetriya.ts',
  ],
  2: [
    /* Генератор и движок рисунков: задачи, ответы, разборы, рисунки. */
    'app/src/lib/vektory/prototypes',
    'app/src/lib/vektory/generate.ts',
    'app/src/lib/vektory/bank.ts',
    'app/src/lib/vektory/render.ts',
    'app/src/lib/vektory/geometry.ts',
    'app/src/lib/vektory/razmeshchenie.ts',
    'app/src/lib/vektory/troyki.ts',
    'app/src/lib/vektory/tex.ts',
    'app/src/lib/vektory/stseny.ts',
    'app/src/lib/vektory/secret.ts',
    'app/src/lib/vektory/opornye.ts',
    'app/src/lib/vektory/opornye-kosinus.ts',
    'app/src/lib/vektory/prep',
    'app/src/content/theoryVektory.ts',
    'app/src/content/oZadanii2.ts',
    'app/src/content/kartochki/02-vektory.ts',
  ],
  6: [
    'app/src/data/zadanie6',
    'app/public/data/zadanie6',
    'app/src/lib/zadanie6/prototypes',
    'app/src/lib/zadanie6/bank',
    'app/src/lib/zadanie6/kit.ts',
    'app/src/lib/zadanie6/opornye.ts',
    'app/src/lib/zadanie6/otvet.ts',
    'app/src/lib/zadanie6/raspredelenie.ts',
    'app/src/lib/zadanie6/velichiny.ts',
    'app/src/lib/zadanie6/proverka.ts',
    'app/src/content/teoriya6.ts',
    'app/src/content/uroki6.ts',
    'app/src/content/kartochki/06-sluchaynye-velichiny.ts',
  ],
  11: [
    /* Банк, разминка и аналоги, движок подтипов (условия, ответы, разборы,
       таблицы модели, подсказки), генераторы, опорные задачи, теория и
       карточки. public/data/zadanie11 — новые файлы тренажёра, они
       сверяются с банком отдельно (pnpm test:bank-11). */
    'app/src/data/zadanie11',
    'app/src/lib/zadanie11/prototypes',
    'app/src/lib/zadanie11/bank.ts',
    'app/src/lib/zadanie11/analogi.ts',
    'app/src/lib/zadanie11/kit.ts',
    'app/src/lib/zadanie11/num.ts',
    'app/src/lib/zadanie11/sklonenie.ts',
    'app/src/lib/zadanie11/secret.ts',
    'app/src/lib/zadanie11/taxonomy.ts',
    'app/src/lib/zadanie11/types.ts',
    'app/src/lib/zadanie11/gen',
    'app/src/lib/zadanie11/prep',
    'app/src/lib/zadanie11/proporciya',
    'app/src/lib/zadanie11/generator11.ts',
    'app/src/lib/zadanie11/sheet11.ts',
    'app/src/content/teoriya11.ts',
    'app/src/content/teoriya-edinicy.ts',
    'app/src/content/generator11.ts',
    'app/src/content/kartochki/11-tekstovye.ts',
  ],
  7: [
    'app/src/data/zadanie7',
    'app/public/data/zadanie7',
    'app/src/lib/zadanie7/prototypes',
    'app/src/lib/zadanie7/bank',
    'app/src/lib/zadanie7/kit.ts',
    'app/src/lib/zadanie7/trig.ts',
    'app/src/lib/zadanie7/opornye.ts',
    'app/src/lib/zadanie7/otvet.ts',
    'app/src/content/teoriya7.ts',
    'app/src/content/teoriya7-irr.ts',
    'app/src/content/kartochki/07-uravneniya.ts',
  ],
  13: [
    /* Движок задач, банк, генератор листов, опорные блоки: условия,
       ответы, решения, подсказки. opornye/seal.ts и reshenieHtml.ts не в
       списке: в них добавлены функции для шагов сцены (шаги «Определи
       тип» вынесены), а то, что они дают, сверяет test:zadanie13. */
    'app/src/lib/zadanie13/proto',
    'app/src/lib/zadanie13/gen',
    'app/src/lib/zadanie13/bank.ts',
    'app/src/lib/zadanie13/generate.ts',
    'app/src/lib/zadanie13/solver.ts',
    'app/src/lib/zadanie13/drob.ts',
    'app/src/lib/zadanie13/edinicy.ts',
    'app/src/lib/zadanie13/html.ts',
    'app/src/lib/zadanie13/tablica.ts',
    'app/src/lib/zadanie13/bukvy.ts',
    'app/src/lib/zadanie13/plots.ts',
    'app/src/lib/zadanie13/text.ts',
    'app/src/lib/zadanie13/types.ts',
    'app/src/lib/zadanie13/vyrazhenie.ts',
    'app/src/lib/zadanie13/zapolni.ts',
    'app/src/lib/zadanie13/opornye/bloki.ts',
    'app/src/lib/zadanie13/trenazher',
    'app/src/content/zadanie13.ts',
    'app/src/content/teoriya13.ts',
    'app/src/content/generator13.ts',
    'app/src/content/repetitory13.ts',
    'app/src/content/kartochki/13-ekonomicheskie.ts',
  ],
};

/** Какие картинки реестра принадлежат разделу. */
function razdelKartinki(file) {
  const m = /^app\/public\/images\/task-(\d\d)\./.exec(file);
  if (m) return String(Number(m[1]));
  if (file.startsWith('app/public/images/zadanie-01/')) return '1';
  if (/^app\/public\/images\/(veroyatnost\/zadanie-4|veroyatnost-4|zadanie-04)\//.test(file))
    return '4';
  if (/^app\/public\/images\/(veroyatnost\/zadanie-5|veroyatnost-5|zadanie-05)\//.test(file))
    return '5';
  if (file.startsWith('app/public/images/veroyatnost/labirint')) return '5';
  if (file.startsWith('app/public/illustrations/zadanie-10/')) return '10';
  if (file.startsWith('app/public/images/zadanie-11/')) return '11';
  if (/^app\/public\/images\/(razdely|zadaniya|theory)\/12\//.test(file)) return '12';
  return null;
}

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
}

/* ── 1. Контрольные суммы ─────────────────────────────────────── */
const reestr = fs
  .readFileSync(path.join(REPO, 'docs', 'redesign-kartinki.sha256'), 'utf8')
  .split('\n')
  .filter((line) => line.trim() !== '')
  .map((line) => {
    const [sha, file] = line.split(/\s+/);
    return { sha, file };
  });
for (const { sha, file } of reestr) {
  const full = path.join(REPO, file);
  if (!fs.existsSync(full)) {
    check(false, `картинка пропала: ${file}`);
    continue;
  }
  const now = crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');
  check(now === sha, `картинка изменена: ${file}`);
}

/* ── 2. Картинки раздела на страницах ─────────────────────────── */
const svoi = reestr.filter((item) => razdelKartinki(item.file) === razdel);
if (!fs.existsSync(path.join(OUT, 'zadaniya', razdel, 'index.html'))) {
  check(false, `нет сборки раздела №${razdel}: сначала pnpm build`);
} else {
  const walk = (dir, out = []) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full, out);
      else if (/\.(html|txt|js|json)$/.test(entry.name)) out.push(full);
    }
    return out;
  };
  /* Страницы раздела и скрипты сайта: адрес картинки может собираться в коде. */
  const tekst = [
    ...walk(path.join(OUT, 'zadaniya', razdel)),
    ...walk(path.join(OUT, '_next', 'static', 'chunks')),
  ]
    .map((file) => fs.readFileSync(file, 'utf8'))
    .join('\n');
  /* Семейство: «…/hero-480.webp» и «…/hero-1152.png» — один рисунок. */
  const semeystva = new Map();
  for (const { file } of svoi) {
    const publichnyy = file.replace(/^app\/public/, '');
    const klyuch = publichnyy
      .replace(/-(\d{2,4})(?=\.\w+$)/, '')
      .replace(/\.(png|webp|jpe?g|avif)$/, '');
    semeystva.set(klyuch, [...(semeystva.get(klyuch) ?? []), publichnyy]);
  }
  for (const [klyuch, fayly] of semeystva) {
    const imya = path.basename(klyuch);
    const papka = path.dirname(klyuch);
    const est =
      fayly.some((file) => tekst.includes(file)) ||
      /* Адрес собирается в коде: папка и имя файла встречаются порознь. */
      (tekst.includes(`${papka}/`) && tekst.includes(imya));
    check(est, `картинка раздела №${razdel} не используется на страницах: ${klyuch}`);
  }
}

/* ── 3. Банк и содержание ─────────────────────────────────────── */
const puti = SODERZHANIE[razdel];
if (puti === undefined) {
  check(false, `для раздела №${razdel} не описано содержание (таблица SODERZHANIE)`);
} else {
  for (const put of puti) {
    check(fs.existsSync(path.join(REPO, put)), `содержание пропало: ${put}`);
  }
  let izmeneno = '';
  try {
    izmeneno = execFileSync('git', ['diff', '--name-status', obrazec, '--', ...puti], {
      cwd: REPO,
      encoding: 'utf8',
    }).trim();
  } catch (error) {
    check(false, `не удалось сравнить с ${obrazec}: ${String(error).slice(0, 200)}`);
  }
  check(izmeneno === '', `банк или содержание раздела №${razdel} изменены:\n${izmeneno}`);
}

if (failures.length > 0) {
  console.error(`\nРедизайн №${razdel}: ${failures.length} из ${checks} проверок не прошли:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(
  `Редизайн №${razdel}: ${checks} проверок — ${reestr.length} картинок не изменены, ` +
    `картинки раздела (${svoi.length}) на страницах, банк и содержание те же, что в ${obrazec}.`,
);
