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
        банка, прототипов, опорных задач и теории не изменились (git).
        Меняется подача, а не содержание. Если файл изменён, сверяется
        содержание: тексты, числа и код — знак за знаком. Проходит
        только другая запись того же самого: номер задания, который
        подставляет struktura.js вместо цифры в тексте, комментарии,
        отступы и переносы (scripts/sverka-soderzhaniya.mjs).

   Что считать содержанием раздела — таблица SODERZHANIE ниже: при
   редизайне следующего раздела в неё добавляется строка. */

import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { strukturaObrazca, toZheSoderzhanie } from './sverka-soderzhaniya.mjs';

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = path.join(APP, '..');
const OUT = path.join(APP, 'out');

const razdel = process.argv[2];
const obrazec = process.argv[3] ?? 'origin/main';
/* Номера в образце записаны в его нумерации: вызовы struktura.js при
   сверке считаются по структуре, которая действует в образце. */
const STRUKTURA_OBRAZCA = (() => {
  try {
    return strukturaObrazca(
      execFileSync('git', ['show', `${obrazec}:app/src/content/struktura.js`], {
        cwd: REPO,
        encoding: 'utf8',
      }),
    );
  } catch {
    return strukturaObrazca(null);
  }
})();
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
  /* №9, одобрено владельцем 23.11.2026: русское объяснение физического смысла первой и второй производных и схемы к первообразной. */
  'app/src/content/theoryProizvodnaya.ts': 'e3fd8b0581eaebd337d026f49ccbc3b3cf31def6df6c6fb4d35adc87aa58ec39',
  /* №4–5: одобрено владельцем 23.11.2026 — подробные материалы по
     изображению событий и противоположному событию. Зафиксированы только
     версии пяти затронутых файлов; последующие изменения снова проверяются. */
  'app/src/components/tasks/veroyatnost/teoriya/KakIzobrazhatSobytiya.tsx':
    '9b85c72ca8dd7eade200454766cccc15a5b31a83ef2160a8e0ba20025501f409',
  'app/src/components/tasks/veroyatnost/teoriya/ProtivopolozhnoeSobytiye4.tsx':
    '907dbcd064a3de13df1e084cce118d768db30e5ba7fc1aa97b26999bc6bf43ca',
  'app/src/components/tasks/veroyatnost/teoriya/Sobytiya5.tsx':
    'c4e1e698a7171c555ae3a7deb27e17c82670895ce0bccdff490fd29f7816003d',
  'app/src/components/tasks/veroyatnost/teoriya/index.tsx':
    'bc9a702586381afad4fb9aa3d994c8b7dd95e011057cce7efb9f84af5c92c2c8',
  'app/src/content/veroyatnost-teoriya.ts':
    '7421149ede2c6dbaad982983bbf9da08344b08ecbfeaeb6b5ae1dec51b4452ad',
  /* №1, одобрено владельцем 19.11.2026: подсказки (PR #451 — чертёж в
     шаге, буквы, реестр фактов «Показать свойство», тексты вопросов и
     решений) и «чертёж — схема, а не масштабный рисунок» (PR #452 —
     подбор формы skhema.ts, правила разметки, подписи величин). Условия,
     числа и ответы задач те же. Второе одобрение того же дня: подсказки-
     сценарии вопросами, новые карточки справочника и приёмы, новый тип 76
     «три части стороны» с аналогами, опорные P1-2-03/09/10 и P1-4-01,
     генераторы углов без 80°–100°, прототип 68 (A и D не слипаются). */
  /* В дополнение 23.11.2026 одобрены русские формулировки свойств
     треугольника и схемы к ним в блоках и сценариях подготовки. */
  'app/src/content/spravochnik1/fakty.ts':
    'ec1568aae84b2e633c7dac22bf9f95f00f1e57a5b30e4c78df6fc111784343a1',
  'app/src/lib/planimetriya/bank/analogi.ts':
    '4e431aaffc657de2d6bfc04ebd0bed45f9433f072b2e4bbedcabe74fa6e45579',
  'app/src/lib/planimetriya/figury.ts':
    '4e79a42395825e6e0c68d758100b59940ee15c05d2f47dc2fc625208acde200e',
  'app/src/lib/planimetriya/prep/bloki.ts':
    '9ef2ef119e08c71900f1883b7ac8a339bcd93d0e059b9289cc5cb91cc96783c3',
  'app/src/lib/planimetriya/prep/fakty.ts':
    'a85ca2cbffe9ca0a00b46099aa6c3deb2bd6459cd23d01d4fbbb08631baa0af1',
  'app/src/lib/planimetriya/prep/generate.ts':
    '5bc7b49d7b659bacdca9767cc7d17480224b4732751ce885dfd811005a1c3c55',
  'app/src/lib/planimetriya/prep/mikro.ts':
    '3c5be51e89dc5666b6d0b084a1cf55440aa14036c38689fa85eb1cc3c527b44a',
  'app/src/lib/planimetriya/prep/seal.ts':
    'cea9bd3de6ae3de1be3bbf627686b4cd55146b1c5fe3b81583bed76011569d2a',
  'app/src/lib/planimetriya/prep/types.ts':
    '840fb0160c88ec517f776ce2d0c405264fd9d76b73d5a26c8c1a626ffdcfd823',
  'app/src/lib/planimetriya/render.ts':
    'd97366863836bc13c390aa41fe010d89a70ce81ac05a832a941073c3106f0d9e',
  'app/src/lib/planimetriya/reshenie/blok1.ts':
    '1cd8425e4d74066d978bae78458c8fc968cdf5718fa8a9b67a329984f6644e5b',
  'app/src/lib/planimetriya/reshenie/blok2.ts':
    '1a8c17c916cd010ce7282a663e88b4e6a37d5f7ca5074183f3c789f039029d4d',
  'app/src/lib/planimetriya/reshenie/blok3.ts':
    'f2e4297e9a748410543fc617fbe543fddfdf2c37ce05f563709c5c51583ca655',
  'app/src/lib/planimetriya/reshenie/obshchee.ts':
    'ae0d693c12e8cd9a6dd273b99a8ba2ebad8a70525b65de10aa76f0d2f334ad52',
  'app/src/lib/planimetriya/reshenie/types.ts':
    '9be10a150f35ba938859f15ebe112e022790f535e5dd4764763e11d9f66e084f',
  'app/src/lib/planimetriya/spravochnik-chertezhi.ts':
    '3a5cb147888ceb2f835466e9d41ae07c7381225b6e690cba9d620f161ee5a35c',
  'app/src/lib/planimetriya/stil.ts':
    '7eaa8f60ccb158f6f6a3fc868f55d3ae240e530cef89b7901363d8fbceefdbf7',
  'app/src/lib/planimetriya/stseny/blok1.ts':
    '60a4e9dab3e72454d00c4b1f93ed082d370fd309647920a0598431e12da31421',
  'app/src/lib/planimetriya/stseny/blok10.ts':
    'd99011292025b099b311012378ef4512fd013ec5243d2c473bc69ba877253d46',
  'app/src/lib/planimetriya/stseny/blok2.ts':
    'd0a52fb204ddbd35588e29fdca698298bdfbc4b0dbf923330bb6b37aaba4ac2b',
  'app/src/lib/planimetriya/stseny/blok3.ts':
    'b59a3c6d4a63f06ffce75ec0ee9656226d9be1dac12033d75c3806d849a7de37',
  'app/src/lib/planimetriya/stseny/dsl.ts':
    '6100716a6d6b41b5a27ba61fa0fb64e203eb8b9ccd2102ce23f79f6110cbfae7',
  'app/src/lib/planimetriya/teoriya.ts':
    '8f050ec8d238907581aca75f6ae788025ef625fdf1477badceb7800e148991cc',
  'app/src/lib/planimetriya/trenazher/zadacha.ts':
    'd3d9ffc9c8563c412af99d4deb1778cc8c024bb15c6b79ae66ab666c9626ebac',
  /* №7: одобрено владельцем 23.11.2026 — подробная теория линейных и
     квадратных уравнений; остальные файлы банка и теории сверяются как прежде. */
  'app/src/content/teoriya7.ts':
    '4ed092c1bcd909b8e15128dc6f3db46d91b0ea0a196bcca971059d5713f38212',
  /* №16 (экономика) во второй части, одобрено владельцем 15.11.2026: часть,
     вид ответа и баллы из структуры, оптимизация — второй вид задания,
     ответ не в тех единицах — «уже не 2 балла». Банк задач не менялся. */
  'app/src/content/teoriya13.ts':
    '7611b9650740a27f261cac87e002572f85b5d32a224b5bd3048e52fd9b2a95e8',
  'app/src/content/zadanie13.ts':
    'e71b3bcc66bb581a2f10edf83ba6f5bd847f3f0dec10ccc3ffdc5b79ab6f2644',
  /* PR 6 перестройки под ЕГЭ-2027, одобрено владельцем 14.11.2026: номера,
     записанные в нумерации 2026 года («Для задачи №17», «пригодится в
     №13»), и место экономической задачи (часть, вид ответа, балл) теперь
     берутся из структуры — в ЕГЭ-2027 на экране те же числа. Файлы раздела
     №13 (teoriya13, zadanie13) с тех пор одобрены заново — выше, №16. */
  'app/src/content/teoriya1.ts': 'c990431c17d9a5206057da180bfa257d6728b7a1eee798cc02e6182a8a84172c',
  'app/src/content/teoriya7-irr.ts':
    '454b16a168891b91460da08fd106a5a6e152950f404a873d5ab309e6bd743cc8',
  /* Общий генератор (№12 — один из разделов): у раздела может быть
     несколько переключателей «Дополнительно» (GenConfig.extras.flagi,
     GenExtras.flagi) — нужно №18 для «Чертежа к условию». Поле
     необязательное: у №12 его нет, лист и задачи №12 не меняются.
     Одобрено владельцем при слиянии PR №387. */
  'app/src/lib/generator/obshchiy/state.ts':
    'a2d0fe4008fa38fe57ec19bcff513467fb3d6529dcb3b53caf5338393633a343',
  'app/src/lib/generator/obshchiy/types.ts':
    '021fa4e1c05554b4a21c3b3a6fe86d07b79d2e95e48a254bf4fec5989420e461',
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
  /* №10: П-33, порядок максимума по k — по решению владельца. */
  'app/src/lib/zadanie10/prototypes/gruppa5.ts':
    '11ec6178e5483661722a7b8f53f964cbde113bf5b029c7cc6fcd2c2637cb901e',
  'app/src/content/spravochnik1/index.ts':
    '4d79902c8d391d5a5dda2061773c740a9eaa080ecd34b1161d8bdd8789aef14f',
  'app/src/content/spravochnik1/novye-temy.ts':
    '5c55d0fa69f4e2918b39eaea4271fe9d344618713369abc91f0f0e7b96c3bfff',
  /* Число страниц пересобранного PDF справочника (новые карточки №1). */
  'app/src/content/spravochnik1/pdf.json':
    'c968d861ea66c4bee40351f77bc7125d4ccc11c820f11c57dc5d5b20ac332005',
  'app/src/content/spravochnik1/r01-ugly.ts':
    '165a6719391f98c884f4f5e31ea8752dc8739fe9b232fed69840284152791ca9',
  'app/src/content/spravochnik1/r06-ploshchadi.ts':
    'fc337cc0ecbb2a56c1e2caf5b7ee89b7bd3ffb46842f3a221610527fe51e55d0',
  'app/src/content/spravochnik1/r08-chetyrehugolniki.ts':
    'f4e5555c270441857ae220adc5b9c9fab7e2d34487e3918b30271e85923262b6',
  'app/src/content/spravochnik1/r11-fakty.ts':
    'b492ea349439db43669d26c5904a79f1580a1bdf529835958e8718b938f1ecd3',
  'app/src/content/spravochnik1/r12-priemy.ts':
    '7cd6e12254b1983e80ae19dd3b47ab51e5ed3a1766bbc8f5b849bc2510745681',
  'app/src/content/spravochnik1/tipy.ts':
    '3c5b1ba379da8041075eb50faa0d2513afa3fef099a51a43100042e76ef9d7bb',
  'app/src/lib/planimetriya/bank/analogi-dannye.ts':
    '9ee3f59041f3918ea504f6d14331b37004e753cec64dfdcb86f76de10f5c9c6f',
  'app/src/lib/planimetriya/bank/proverka.ts':
    '89b73f65b3aa1bd3c9daee0aa27952043904aca9fe92a7e454f948cf50d95380',
  'app/src/lib/planimetriya/prep/pool.ts':
    '3c519358fd3e2f040978f63c14355f5cabe8a6867977fd690c58ea32b7df145c',
  'app/src/lib/planimetriya/prep/scenarii.ts':
    '63f79ff2c5062651c27b3a86bb73c2c2dd74ed55be369393038102a9bf96ee67',
  /* Подсказки опорных задач №1 вопросами — все 90 задач (одобрено владельцем
     22.11.2026: «Разрешаю, переделай остальные тоже»). Условия и ответы те
     же, кроме P1-1-07: там исправлен угол C (ответ не сходился с суммой). */
  'app/src/lib/planimetriya/prep/scenarii-p1-12.ts':
    '631d61eca926bbcfab9e35e39b8ba9fda539082538426de980f85cea993f2601',
  'app/src/lib/planimetriya/prep/scenarii-p1-3.ts':
    'be86a6a5e719cbd969dd45f73939458d82fe537498aa2b6343122036189d378e',
  'app/src/lib/planimetriya/prep/scenarii-p1-4.ts':
    'e8af459be7ad8389a599b551730172a002db43ea7c140a5aebb7e99ce22c333d',
  'app/src/lib/planimetriya/prep/scenarii-p1-5.ts':
    '070be2ec72f0639a127a78ffa0d64d3ba1bcbc9f3d4bfddfe7975849be0a2608',
  'app/src/lib/planimetriya/prep/scenarii-p1-6.ts':
    '4a8fc1c236e49dfb81b0fdd44c89314501d5611f50e1b009f43bdde6898a0ef4',
  'app/src/lib/planimetriya/prep/scenarii-p1-7.ts':
    '9eda0f8fc1f72c2d0911842e4e650555334434c50ecd6a54d7396343e87dddbc',
  'app/src/lib/planimetriya/prep/scenarii-p1-8.ts':
    'e554a2a231534e80b415bb574be58c0e76c2535c7bc8918822b57f7dc7c2968f',
  'app/src/lib/planimetriya/prep/scenarii-p1-9.ts':
    'dcc512fbd36ac5ea5e77130ddf6a56bad1aad00debfead66140807f056e30f18',
  'app/src/lib/planimetriya/stseny/chasti.ts':
    'b2db181af3ddde18f99d009f9e323ede50f0f7681bd870af5fd31cad007231c9',
  /* №11, одобрено владельцем 23.11.2026: оформление решений — деление
     с чертой справа, подбор корня из дискриминанта, НОК с пояснением,
     совместная производительность, «большее − меньшее = разница» со
     стрелкой в таблице, рисунок к обгону (ПТ-03). */
  'app/src/lib/zadanie11/kartinki.ts':
    '2b9337551c98500226553dabc14517a5457b4abbbaeab3aaa769c1d086a9e2b0',
  'app/src/lib/zadanie11/kit.ts':
    'e987db3499eb42618f41544fd2bc95243e067d16593b1aaff49ebb9205a10fae',
  'app/src/lib/zadanie11/prototypes/dp.ts':
    '5cfd49d062554228747bdab429a65e93ca5c5a000839bb858189cf3fd38b70d8',
  'app/src/lib/zadanie11/prototypes/ezhemesyachnye.ts':
    'e06c939a39575bfa38766e377d0c908dc2a84de47c93400dab7f0f2fef20bfc1',
  'app/src/lib/zadanie11/prototypes/ok.ts':
    '4a2a1750dd3d10b9d97bc65a3ee7d900e6fe85ab10dc08060e7244f79d94a442',
  'app/src/lib/zadanie11/prototypes/pt.ts':
    'ff411db6247acc5693b2d4749a530f5119ed76b76c2d2c980c450251a2429d8b',
  'app/src/lib/zadanie11/prototypes/rb.ts':
    '19f78830c04813e6749d6ec40a286182a703cce1f16f0243177bf116d4daf258',
  'app/src/lib/zadanie11/prototypes/vd.ts':
    'f790fc3f3bd178d23f56bae28d83a187089d76a5f7722b89ff66d24ac284470d',
  'app/src/lib/zadanie11/types.ts':
    '9b1bb8b5f4b057f91d55117ff32376c0d691fb33a3e7d5cd794668c8cff96dc4',
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
/** Файлы, записанные по-другому при том же содержании. */
const inayaZapis = [];
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
  /* Правка, одобренная владельцем (ODOBRENO), проходит как есть. */
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
    });
  /* Изменённый файл: другая запись того же содержания или другое содержание? */
  const plohie = [];
  for (const stroka of neodobreno) {
    const [status, file] = stroka.split('\t');
    if (status !== 'M' || !/\.(ts|tsx|js|mjs)$/.test(file)) {
      plohie.push(stroka);
      continue;
    }
    try {
      const staryy = execFileSync('git', ['show', `${obrazec}:${file}`], {
        cwd: REPO,
        encoding: 'utf8',
        maxBuffer: 256 * 1024 * 1024,
      });
      const novyy = fs.readFileSync(path.join(REPO, file), 'utf8');
      const { ravno, gde } = toZheSoderzhanie(staryy, novyy, file, STRUKTURA_OBRAZCA);
      if (ravno) inayaZapis.push(file);
      else plohie.push(`${stroka}\n      ${gde}`);
    } catch (error) {
      plohie.push(`${stroka}\n      не удалось сравнить: ${String(error).slice(0, 200)}`);
    }
  }
  check(
    plohie.length === 0,
    `банк или содержание раздела №${razdel} изменены:\n${plohie.join('\n')}`,
  );
}

if (failures.length > 0) {
  console.error(`\nРедизайн №${razdel}: ${failures.length} из ${checks} проверок не прошли:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(
  `Редизайн №${razdel}: ${checks} проверок — ${reestr.length} картинок не изменены, ` +
    `картинки раздела (${svoi.length}) на страницах, банк и содержание те же, что в ${obrazec}` +
    (inayaZapis.length > 0
      ? ` (файлов с другой записью того же содержания: ${inayaZapis.length}).`
      : '.'),
);
