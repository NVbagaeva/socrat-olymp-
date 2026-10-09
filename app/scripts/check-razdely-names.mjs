#!/usr/bin/env node
/* scripts/check-razdely-names.mjs — названия разделов задания №12
   едины во всех местах сайта.

   Правило: заголовок — название ФУНКЦИИ (поле title подтемы), подпись —
   название ГРАФИКА (поле graphName). Названия лежат в одном месте,
   data/functionTypes.ts; компоненты берут их оттуда.

   Запуск:
     pnpm test:razdely-names --src     без сборки: данные и исходники
     pnpm build && pnpm test:razdely-names --site    собранный сайт

   --src
     — список разделов дословно совпадает с таблицей утверждённых
       названий и идёт в её порядке; адреса (id) прежние;
     — название конфига листа (content/sheet12.js) — то же, что у
       линейной подтемы в списке;
     — в исходниках нет строк-литералов с названиями разделов вне
       списка (комментарии и проза теории не в счёт): каждое место
       берёт название из списка.

   --site
     — на страницах №12 в готовой разметке нет прежних названий
       («Прямая и её наклон», «Иррациональная функция (график корня)»,
       «Обратная пропорциональность» как подпись раздела и др.);
     — пары «название — подпись» в данных страниц идут как в таблице и
       в том же порядке;
     — карточки в разметке (блок «Другие разделы», страница выбора) —
       из таблицы;
     — title, description и Open Graph страниц разделов — из таблицы;
     — на странице листа для печати нет прежних названий. */

import fs from 'node:fs';
import path from 'node:path';
import { APP, SRC, requireSrc } from './lib/load-ts.mjs';

/* Утверждённая таблица. Порядок — порядок разделов везде. Адреса не
   меняются: id остаются прежними (rational — дробно-линейная). */
const TABLE = [
  { id: 'linear', title: 'Линейная функция', graphName: 'График — прямая' },
  { id: 'quadratic', title: 'Квадратичная функция', graphName: 'График — парабола' },
  { id: 'rational', title: 'Дробно-линейная функция', graphName: 'График — гипербола' },
  { id: 'irrational', title: 'Иррациональная функция', graphName: 'График — ветвь параболы' },
  { id: 'exponential', title: 'Показательная функция', graphName: 'График — экспонента' },
  {
    id: 'logarithmic',
    title: 'Логарифмическая функция',
    graphName: 'График — логарифмическая кривая',
  },
  {
    id: 'trigonometric',
    title: 'Тригонометрические функции',
    graphName: 'Графики — синусоида, косинусоида, тангенсоида',
  },
];

/* Прежние названия: нигде в готовом сайте их быть не должно. */
const OLD_NAMES = [
  'Прямая и её наклон',
  'Иррациональная функция (график корня)',
  'График квадратного корня',
  'Квадратичные функции',
  'Линейные функции',
  'Показательные функции',
  'Логарифмические функции',
  'Тригонометрические функции и их графики',
];
/* Прежние подписи, которые легко принять за подпись раздела: ищутся
   только в карточках и данных разделов (в тексте других заданий слова
   «обратная пропорциональность» остаются). */
const OLD_CAPTIONS = [
  'Обратная пропорциональность',
  'Квадратичная функция',
  'Парабола',
  'Гипербола',
];

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) {
    failures.push(what);
  }
}

const mode = process.argv[2];
if (mode !== '--src' && mode !== '--site') {
  console.error('Укажите режим: --src или --site');
  process.exit(2);
}

/* ── --src ───────────────────────────────────────────────────── */
function checkSource() {
  const { functionTypes } = requireSrc('data/functionTypes');

  check(
    functionTypes.length === TABLE.length,
    `разделов в списке ${functionTypes.length}, в таблице ${TABLE.length}`,
  );
  TABLE.forEach((row, index) => {
    const found = functionTypes[index];
    check(found?.id === row.id, `место ${index + 1}: id «${found?.id}», нужен «${row.id}»`);
    check(
      found?.title === row.title,
      `«${row.id}»: название «${found?.title}», нужно «${row.title}»`,
    );
    check(
      found?.graphName === row.graphName,
      `«${row.id}»: подпись «${found?.graphName}», нужна «${row.graphName}»`,
    );
  });

  /* Лист для печати: название в конфиге листа — линейной подтемы. */
  const sheet = requireSrc('content/sheet12.js');
  check(
    sheet.title.text === TABLE[0].title,
    `лист: название «${sheet.title.text}», нужно «${TABLE[0].title}»`,
  );
  check(
    sheet.runner.endsWith(TABLE[0].title),
    `лист: бегунок «${sheet.runner}» не оканчивается на «${TABLE[0].title}»`,
  );

  /* Названия не вписаны руками: в исходниках нет строк-литералов с
     названиями разделов вне списка. Проза теории и тексты «О задании»
     — не названия разделов; они и их исходники в списке исключений. */
  const needles = [
    ...TABLE.flatMap((row) => [row.title, row.graphName]),
    ...OLD_NAMES,
    'Прямая и её наклон',
  ];
  const allowed = new Set([
    'data/functionTypes.ts',
    /* Конфиг листа: значение проверено выше на равенство списку. */
    'content/sheet12.js',
  ]);
  const skipDirs = [
    'lib/graph/',
    'content/theory',
    'components/tasks/theory/',
    'lib/theoryFigures.ts',
    'lib/zadanie11/',
    'components/tasks/zadanie11/',
    'app/styleguide/',
    'lib/zadanie15/',
  ];
  const stringLiteral = /(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g;
  const walk = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return walk(full);
      }
      return /\.(ts|tsx|js|mjs)$/.test(entry.name) ? [full] : [];
    });
  for (const file of walk(SRC)) {
    const rel = path.relative(SRC, file).split(path.sep).join('/');
    if (allowed.has(rel) || skipDirs.some((dir) => rel.startsWith(dir))) {
      continue;
    }
    /* Комментарии убираются: в них названия упоминаются свободно. */
    const code = fs
      .readFileSync(file, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|\s)\/\/.*$/gm, '$1');
    for (const match of code.matchAll(stringLiteral)) {
      const hit = needles.find((needle) => match[2].includes(needle));
      if (hit !== undefined) {
        check(false, `${rel}: в строке «${match[2].slice(0, 60)}» вписано название «${hit}»`);
      }
    }
  }
  checks += 1; // сам обход
}

/* ── --site ──────────────────────────────────────────────────── */
function checkSite() {
  const OUT = path.join(APP, 'out');
  if (!fs.existsSync(OUT)) {
    console.error('Нет папки сборки out: сначала pnpm build');
    process.exit(1);
  }
  const read = (rel) => {
    const file = path.join(OUT, rel, 'index.html');
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  };
  /* В разметке и данных страницы (RSC) кавычки данных экранированы. */
  const decode = (html) =>
    html
      .replace(/\\"/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
  const escaped = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  /* Страницы №12 и всё, где название раздела стоит в данных: корень
     задания, каждая подтема с вкладками и листами. */
  const pages = [];
  const walk = (dir, rel) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), `${rel}/${entry.name}`);
      }
    }
    if (fs.existsSync(path.join(dir, 'index.html'))) {
      pages.push(rel);
    }
  };
  walk(path.join(OUT, 'zadaniya', '12'), 'zadaniya/12');
  walk(path.join(OUT, 'zadaniya', 'index.html').replace(/index\.html$/, ''), 'zadaniya');
  const task12 = pages.filter((rel) => rel === 'zadaniya/12' || rel.startsWith('zadaniya/12/'));
  check(task12.length > 20, `страниц №12 в сборке ${task12.length}`);

  const OLD = [...OLD_NAMES];
  for (const rel of new Set(pages.filter((p) => p === 'zadaniya' || p.startsWith('zadaniya/12')))) {
    const html = decode(read(rel) ?? '');
    for (const old of OLD) {
      check(!html.includes(old), `/${rel}/: прежнее название «${old}»`);
    }
    /* Подписи-карточки раздела — только из таблицы. */
    for (const match of html.matchAll(
      /class="(?:razdel-karta__caption|subtopic__caption|subtopic-card__graph)">([^<]*)</g,
    )) {
      check(
        TABLE.some((row) => row.graphName === match[1]),
        `/${rel}/: подпись карточки «${match[1]}» не из таблицы`,
      );
    }
    for (const match of html.matchAll(
      /class="(?:razdel-karta__title|subtopic__name|subtopic-card__title)">([^<]*)</g,
    )) {
      check(
        TABLE.some((row) => row.title === match[1]),
        `/${rel}/: название карточки «${match[1]}» не из таблицы`,
      );
    }
    for (const caption of OLD_CAPTIONS) {
      check(
        !new RegExp(
          `(?:razdel-karta__caption|subtopic__caption|subtopic-card__graph)">${escaped(caption)}<`,
        ).test(html),
        `/${rel}/: прежняя подпись раздела «${caption}»`,
      );
    }
  }

  /* Данные навигации в странице подтемы: пары как в таблице и в том же порядке. */
  for (const row of TABLE.filter((r) => ['linear', 'irrational'].includes(r.id))) {
    const html = decode(read(`zadaniya/12/${row.id}`) ?? '');
    let from = 0;
    let ordered = true;
    for (const item of TABLE) {
      const pair = `"title":"${item.title}","graphName":"${item.graphName}"`;
      const at = html.indexOf(pair, from);
      if (at === -1) {
        ordered = false;
        check(
          false,
          `/zadaniya/12/${row.id}/: в данных нет пары «${item.title}» → «${item.graphName}» по порядку`,
        );
        break;
      }
      from = at;
    }
    check(ordered, `/zadaniya/12/${row.id}/: порядок разделов в данных не как в таблице`);

    /* Заголовок страницы, описание, Open Graph. */
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
    check(title.startsWith(row.title), `/zadaniya/12/${row.id}/: title «${title}»`);
    const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
    check(
      description.includes(row.title) && description.includes(row.graphName),
      `/zadaniya/12/${row.id}/: description «${description}»`,
    );
    const ogTitle = html.match(/<meta property="og:title" content="([^"]*)"/)?.[1] ?? '';
    const ogDescription =
      html.match(/<meta property="og:description" content="([^"]*)"/)?.[1] ?? '';
    check(ogTitle.startsWith(row.title), `/zadaniya/12/${row.id}/: og:title «${ogTitle}»`);
    check(
      ogDescription.includes(row.graphName),
      `/zadaniya/12/${row.id}/: og:description «${ogDescription}»`,
    );
    /* Шапка: название раздела и под ним название графика. */
    check(
      html.includes(`class="topic-head__graph">${row.graphName}<`),
      `/zadaniya/12/${row.id}/: в шапке нет подписи «${row.graphName}»`,
    );
    /* Крошки: последняя — название раздела. */
    check(
      new RegExp(`aria-current="page">${escaped(row.title)}<`).test(html),
      `/zadaniya/12/${row.id}/: в крошках нет «${row.title}»`,
    );
  }

  /* Страница выбора разделов: все семь, в порядке таблицы. */
  const choose = decode(read('zadaniya/12') ?? '');
  let at = 0;
  for (const row of TABLE) {
    const found = choose.indexOf(`"name":"${row.title}","caption":"${row.graphName}"`, at);
    check(
      found !== -1,
      `страница выбора разделов: нет «${row.title}» → «${row.graphName}» по порядку`,
    );
    if (found !== -1) {
      at = found;
    }
  }
}

if (mode === '--src') {
  checkSource();
} else {
  checkSite();
}

console.log(
  `Названия разделов №12 (${mode.slice(2)}): проверок ${checks}, ошибок ${failures.length}.`,
);
for (const f of failures) {
  console.log(`  ✗ ${f}`);
}
if (failures.length > 0) {
  process.exitCode = 1;
}
