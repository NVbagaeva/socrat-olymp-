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
  10: [
    'app/src/data/zadanie10',
    'app/public/data/zadanie10',
    'app/src/lib/zadanie10/prototypes',
    'app/src/lib/zadanie10/bank',
    'app/src/lib/zadanie10/chertezh',
    'app/src/lib/zadanie10/kit.ts',
    'app/src/lib/zadanie10/opornye.ts',
    'app/src/lib/zadanie10/illyustracii.ts',
    'app/src/lib/zadanie10/teoriya-kondensator.ts',
    'app/src/lib/zadanie10/teoriya-stepeni.ts',
    'app/src/lib/zadanie10/teoriya-yakorya.ts',
    'app/src/content/teoriya10.ts',
    'app/src/content/uroki10.ts',
    'app/src/content/kartochki/10-prikladnye.ts',
  ],
  /* №4 и №5: общий банк вероятности — прототипы, варианты, ответы, разборы,
     подсказки, модели рисунков, опорные задачи, методы; теория (тексты в
     content и разметка разделов теории), «О задании», карточки. */
  4: [
    'app/src/lib/veroyatnost/bank4',
    'app/src/lib/veroyatnost/index.ts',
    'app/src/lib/veroyatnost/types.ts',
    'app/src/lib/veroyatnost/model.ts',
    'app/src/lib/veroyatnost/model-zadachi.ts',
    'app/src/lib/veroyatnost/blocks.ts',
    'app/src/lib/veroyatnost/metody4.ts',
    'app/src/lib/veroyatnost/podgotovka4.ts',
    'app/src/lib/veroyatnost/podskazka.ts',
    'app/src/lib/veroyatnost/illyustratsii.ts',
    'app/src/lib/veroyatnost/secret.ts',
    'app/src/lib/veroyatnost/teoriya.ts',
    'app/src/lib/veroyatnost/teoriya-ponimanie.ts',
    'app/src/lib/veroyatnost/teoriya-yakorya.ts',
    'app/src/content/veroyatnost-teoriya.ts',
    'app/src/content/veroyatnost-o-zadanii.ts',
    'app/src/content/veroyatnost-metody.ts',
    'app/src/content/veroyatnost-syuzhety.ts',
    'app/src/content/kartochki/04-veroyatnost.ts',
    'app/src/components/tasks/veroyatnost/teoriya',
  ],
  5: [
    'app/src/lib/veroyatnost/bank5',
    'app/src/lib/veroyatnost/index.ts',
    'app/src/lib/veroyatnost/types.ts',
    'app/src/lib/veroyatnost/model.ts',
    'app/src/lib/veroyatnost/model-zadachi.ts',
    'app/src/lib/veroyatnost/blocks.ts',
    'app/src/lib/veroyatnost/metody5.ts',
    'app/src/lib/veroyatnost/podgotovka5.ts',
    'app/src/lib/veroyatnost/podgotovka5-podskazki.ts',
    'app/src/lib/veroyatnost/labirint.ts',
    'app/src/lib/veroyatnost/podskazka.ts',
    'app/src/lib/veroyatnost/illyustratsii.ts',
    'app/src/lib/veroyatnost/secret.ts',
    'app/src/lib/veroyatnost/teoriya.ts',
    'app/src/lib/veroyatnost/teoriya-ponimanie.ts',
    'app/src/lib/veroyatnost/teoriya-yakorya.ts',
    'app/src/content/veroyatnost-teoriya.ts',
    'app/src/content/veroyatnost-o-zadanii.ts',
    'app/src/content/veroyatnost-metody.ts',
    'app/src/content/kartochki/05-veroyatnost.ts',
    'app/src/components/tasks/veroyatnost/teoriya',
  ],
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
  9: [
    /* Генератор, банк вариантов, движок чертежей, опорные: задачи, ответы,
       разборы, подсказки, рисунки. Тексты прежней «О задании» и «Для
       репетиторов» (content/proizvodnaya.ts), теория, карточки. */
    'app/src/lib/proizvodnaya/prototypes',
    'app/src/lib/proizvodnaya/prep',
    'app/src/lib/proizvodnaya/generate.ts',
    'app/src/lib/proizvodnaya/bank.ts',
    'app/src/lib/proizvodnaya/bankPravila.ts',
    'app/src/lib/proizvodnaya/otkrytyj-bank.ts',
    'app/src/lib/proizvodnaya/render.ts',
    'app/src/lib/proizvodnaya/krivye.ts',
    'app/src/lib/proizvodnaya/spline.ts',
    'app/src/lib/proizvodnaya/chtenie.ts',
    'app/src/lib/proizvodnaya/osDvizheniya.ts',
    'app/src/lib/proizvodnaya/reshit.ts',
    'app/src/lib/proizvodnaya/stseny.ts',
    'app/src/lib/proizvodnaya/stsenyPonyatiya.ts',
    'app/src/lib/proizvodnaya/tex.ts',
    'app/src/lib/proizvodnaya/secret.ts',
    'app/src/lib/proizvodnaya/rng.ts',
    'app/src/lib/proizvodnaya/povyshennye.ts',
    'app/src/lib/proizvodnaya/ezhemesyachnye.ts',
    'app/src/lib/proizvodnaya/generator9.ts',
    'app/src/lib/proizvodnaya/sheet9.ts',
    'app/src/content/proizvodnaya.ts',
    'app/src/content/theoryProizvodnaya.ts',
    'app/src/content/theoryPonyatie9.ts',
    'app/src/content/kartochki/09-proizvodnaya.ts',
  ],
  12: [
    /* Движок графиков: наборы задач (банк), генераторы, подсказки, разборы. */
    'app/src/lib/graph',
    'app/src/data/functionTypes.ts',
    'app/src/content/skills12.ts',
    'app/src/content/prepSkills.ts',
    /* Генератор и зачётная работа. */
    'app/src/lib/ves12/build.ts',
    'app/src/lib/ves12/engine12.ts',
    'app/src/lib/ves12/generator12.ts',
    'app/src/lib/ves12/work.ts',
    'app/src/lib/ves12/fipi.ts',
    'app/src/lib/generator',
    /* Теория и методы видов функций. */
    'app/src/content/theoryLinear.ts',
    'app/src/content/theoryLinearRich.ts',
    'app/src/content/theoryQuadratic.ts',
    'app/src/content/theoryRational.ts',
    'app/src/content/theoryIrrational.ts',
    'app/src/content/theoryExponential.ts',
    'app/src/content/theoryLogarithmic.ts',
    'app/src/content/theoryTrigonometric.ts',
    'app/src/content/quadratic.ts',
    'app/src/content/quadraticBasics.ts',
    'app/src/content/quadraticMetody.ts',
    'app/src/content/quadraticTypes.ts',
    'app/src/content/rational.ts',
    'app/src/content/rationalMetody.ts',
    'app/src/content/irrational.ts',
    'app/src/content/exponential.ts',
    'app/src/content/logarithmic.ts',
    'app/src/content/trigonometric.ts',
    'app/src/content/metody.ts',
    'app/src/components/tasks/theory',
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

/**
 * Правки содержания, одобренные владельцем: ошибка в тексте, о которой
 * сказано в PR редизайна, исправлена отдельным PR. Файл пропускается,
 * только пока он совпадает с одобренной версией (sha256): любая следующая
 * правка снова видна проверке. После слияния в main запись не нужна —
 * образец уже содержит эту версию.
 */
const ODOBRENO = {
  /* №9: определение точки максимума без минимума; «нуль» при одном нуле. */
  'app/src/lib/proizvodnaya/prototypes/po-grafiku-fprime.ts':
    'cf6c9b6b7737e190cb0e7a7bc3adb1b3783f292af1aede97179ac35f9b0e01b9',
  'app/src/lib/proizvodnaya/povyshennye.ts':
    '690f2d8461884b393db2f655aeb20e8c570b4d2bf59355001d29f88f1875413a',
  /* №12: обращение на ты, по решению владельца (подписи наборов). */
  'app/src/lib/graph/data/prototypes/12/12-A.json':
    '67b48eee7e87f8d655050d5ddda7bd38f52f5699089c4499b67eff65a24ad244',
  'app/src/lib/graph/data/prototypes/12/12-B.json':
    '14cd060e2a9bfcd60dd1f2eaefed12007ff765de41a2eee61f563efad6356880',
  'app/src/lib/graph/data/prototypes/12/12-C.json':
    '09f5edf6f48aeb17aebe3e903c59087ee20f9c5f409d2a83938ac3f76593e95e',
  'app/src/lib/graph/data/prototypes/12/12-D.json':
    'f160582c1674d85ed5c37ea3477b8488c960c0ff97ae9a4d8dda0ec309d8fb20',
  'app/src/lib/graph/data/prototypes/12q/12Q-A.json':
    'e1ad4e902222b965c6c6d7b9461f9107817d58e46180964a15e7947f1caf1437',
  'app/src/lib/graph/data/prototypes/12q/12Q-B.json':
    '08fa7582852c4b5bc9aa1c92e3b54e0dcf7202023a77610c6207746fe86b5a8d',
  'app/src/lib/graph/data/prototypes/12q/12Q-C.json':
    '664fb1aa20f7685d853442bad5dc156091ca10c2c9b296f3c93758e493cfca43',
  'app/src/lib/graph/data/prototypes/12q/12Q-D.json':
    'eef958ca9bfb85dd5626286d3402506c40cba4588a61c32a451dd6f9aa17f97f',
  'app/src/lib/graph/data/prototypes/12q/12Q-E.json':
    '3d1f195ee4721c94a106ce8f7398ce7258b480c044a2e81e36fd5771eeeea48f',
  'app/src/lib/graph/data/prototypes/12q/12Q-F.json':
    '48b444ee52953f1b94f123558f25fa0be2942a468431a751906015c9ea909188',
  'app/src/lib/graph/data/prototypes/12q/12Q-G.json':
    '861ef83de7e7625e1811d4403fa80784945a884c8ed5a677880ed51db429e59f',
  'app/src/lib/graph/data/prototypes/12q/12Q-H.json':
    'e285e8137bee4384392028adb08700ea2295af90e663e9733a6a23ecccaad4a9',
  'app/src/lib/graph/data/prototypes/12q/12Q-I.json':
    'e20f537914c09f5aa62bbf90ea91d07d1ebadc95c080ee386bbd1e7c37540954',
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
  const neodobreno = izmeneno
    .split('\n')
    .filter((line) => line.trim() !== '')
    .filter((line) => {
      const file = line.split('\t').at(-1);
      const odobreno = ODOBRENO[file];
      if (odobreno === undefined || !fs.existsSync(path.join(REPO, file))) return true;
      const now = crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.join(REPO, file)))
        .digest('hex');
      return now !== odobreno;
    })
    .join('\n');
  check(neodobreno === '', `банк или содержание раздела №${razdel} изменены:\n${neodobreno}`);
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
