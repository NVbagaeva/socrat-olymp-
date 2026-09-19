/* scripts/lib/sheet-check.mjs — проверки готового PDF, общие для
   всех сборников листа.

   Проверяется не картинка, а то, что можно проверить машинно по
   самому файлу: вшиты ли шрифты и нет ли посторонних, те ли ссылки
   в подвале, нет ли цвета в ч/б файле. И отдельно — по git: не попал
   ли файл с ответами под версионный контроль.

   Состав, нумерацию и ответы каждый сборник сверяет со своим банком
   сам: здесь про банк ничего не известно. */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';

import outputs from '../../src/lib/sheet/outputs.js';

/* Шрифты, которым место в готовом файле: свои из репозитория и KaTeX.
   Любой другой значит, что какого-то знака в наших шрифтах нет
   и браузер подставил системный — на другой машине он подставит
   другой, и строка поедет. Так в файле учителя однажды оказался
   DejaVuSans: из-за стрелки «→», которой нет в подмножестве Inter. */
export const FONTS_ALLOWED = /^(Inter|Caveat|KaTeX)/;

/** Потоки PDF в распакованном виде: по ним видно цвета и текст. */
export function pdfStreams(data) {
  const out = [];
  const re = /stream\r?\n/g;
  let found;
  while ((found = re.exec(data.toString('latin1')))) {
    const start = found.index + found[0].length;
    const end = data.indexOf('endstream', start, 'latin1');
    if (end < 0) { continue; }
    const raw = data.subarray(start, end);
    try { out.push(zlib.inflateSync(raw).toString('latin1')); }
    catch { out.push(raw.toString('latin1')); }
  }
  return out;
}

/**
 * Сколько в файле страниц. Считаются объекты страниц: /Type /Pages —
 * это узел дерева, а не страница, и слово «Page» в нём длиннее.
 */
export function pdfPages(data) {
  return (data.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length;
}

/**
 * Текст файла: операнды показа текста из содержимого страниц.
 *
 * Читаемых слов здесь нет — шрифты подмножествами, и в потоке лежат
 * номера знаков. Для сравнения двух сборок этого хватает: одно и то
 * же содержимое даёт одну и ту же последовательность, а дата сборки
 * и внутренние идентификаторы, которыми файлы расходятся всегда,
 * в содержимое страниц не попадают.
 */
export function pdfText(data) {
  return pdfStreams(data)
    .filter(soderzhanie)
    .map((stream) =>
      (stream.match(/\bBT\b[\s\S]*?\bET\b/g) || [])
        .map((blok) => (blok.match(/\((?:\\.|[^()\\])*\)|<[0-9A-Fa-f\s]+>/g) || []).join(''))
        .join(''))
    .join('\n');
}

/* Поток с содержимым страницы, а не программа шрифта и не картинка.
   Содержимое — это текст операторов, поэтому смотрим на долю
   печатных знаков: в двоичном потоке она низкая, и случайное «BT»
   внутри него не должно попадать в сравнение. */
function soderzhanie(stream) {
  if (!/\bBT\b/.test(stream) || !/\bT[jJ]\b/.test(stream)) { return false; }
  const pechatnyh = (stream.match(/[\x20-\x7e\r\n\t]/g) || []).length;
  return pechatnyh / stream.length > 0.85;
}

/**
 * Проверка одного файла: шрифты, ссылки, цвет.
 *
 * options:
 *   name         имя для сообщений
 *   mono         ч/б файл: только чёрный, белый и серые
 *   strictFonts  посторонних шрифтов быть не должно (выпускная сборка)
 *   links        адреса, которые должны быть в подвале — и никаких других
 *   fail         куда складывать ошибки
 */
export function checkPdfFile(file, options) {
  const { name, fail } = options;
  if (!fs.existsSync(file)) { fail(name + '.pdf: файла нет'); return null; }
  const data = fs.readFileSync(file);
  const text = data.toString('latin1');

  /* Шрифты вшиты: без FontFile принтер подставит свои. */
  if (!/\/FontFile/.test(text)) { fail(name + ': шрифты не вшиты в PDF'); }

  /* Посторонних шрифтов нет. Проверяется только у выпускной сборки:
     в черновике без KaTeX формулы набирает запасная антиква, и её
     системный шрифт здесь законен. */
  if (options.strictFonts) {
    const used = [...new Set([...text.matchAll(/\/BaseFont\s*\/([A-Za-z0-9+#-]+)/g)]
      .map((m) => m[1].split('+').pop()))];
    const stranger = used.filter((font) => !FONTS_ALLOWED.test(font));
    if (stranger.length) {
      fail(name + ': в файле посторонние шрифты — ' + stranger.join(', ') +
        '. Значит какого-то знака нет в наших шрифтах');
    }
  }

  /* Ссылки — ровно заданные адреса и никаких других. */
  const uris = [...new Set([...text.matchAll(/\/URI\s*\(([^)]*)\)/g)].map((m) => m[1]))].sort();
  if (uris.join('|') !== [...options.links].sort().join('|')) {
    fail(name + ': ссылки в подвале — ' + (uris.join(', ') || 'нет') +
      ', а должно быть ровно ' + options.links.length + ' адреса');
  }

  /* Ч/б файл: только чёрный, белый и серые. */
  if (options.mono) {
    const colored = new Set();
    for (const stream of pdfStreams(data)) {
      for (const m of stream.matchAll(/([\d.]+) ([\d.]+) ([\d.]+) (rg|RG)/g)) {
        const [r, g, b] = [m[1], m[2], m[3]].map(Number);
        if (Math.abs(r - g) > 0.02 || Math.abs(g - b) > 0.02) {
          colored.add([r, g, b].map((v) => v.toFixed(3)).join(' '));
        }
      }
    }
    if (colored.size) {
      fail(name + ': в ч/б файле цветá кроме серых — ' + [...colored].slice(0, 5).join('; '));
    }
  }

  return data;
}

/**
 * Картинок задач на листе нет.
 *
 * Иллюстрации — дело подготовки и тренажёра; на листе задача живёт
 * условием и рисунком метода, а рисунок метода приходит инлайновым
 * SVG. Значит ни тега <img>, ни пути /images/ на листе быть не
 * должно: если они там появились, картинка уедет в PDF — или, хуже,
 * не уедет и оставит пустую рамку.
 *
 * Смотрим разметку листа и описание потока, а стили и служебные
 * скрипты выбрасываем: в исходнике KaTeX лежит своя разметка <img>
 * для \includegraphics, и к листу она отношения не имеет. Описание
 * потока — тот же скрипт, но с данными, поэтому оно возвращается.
 */
export function checkNoTaskImages(html, name, fail) {
  const spec = /<script type="application\/json" id="sheet-spec">([\s\S]*?)<\/script>/.exec(html);
  const list = html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ') + (spec ? spec[1] : '');

  if (/<img\b/i.test(list)) { fail(name + ': на листе есть тег <img>'); }
  if (/\/images\//.test(list)) { fail(name + ': на листе есть путь /images/'); }
}

/**
 * Ответы не лежат в репозитории.
 *
 * Репозиторий публичный, и всё, что попало под версионный контроль,
 * видно всякому — а из app/public ещё и отдаётся сайтом по прямому
 * адресу. Проверка смотрит не на диск, а на git: файл может лежать
 * рядом (его собрали) и при этом не быть в индексе, и это правильное
 * состояние.
 */
export function checkNoAnswersTracked(app, fail) {
  let tracked;
  try {
    tracked = execFileSync('git', ['ls-files', '--', '*.pdf'],
      { cwd: app, encoding: 'utf8' }).split('\n').filter(Boolean);
  } catch {
    console.log('  git недоступен, проверку отслеживаемых файлов пропускаю');
    return;
  }

  const marked = tracked.filter((file) =>
    outputs.ANSWER_MARKS.some((mark) => path.basename(file).includes(mark)));

  if (marked.length) {
    fail('в репозитории лежат файлы с ответами: ' + marked.join(', ') +
      '. Им место в ' + outputs.PRIVATE_DIR.join('/') +
      ', оттуда они уезжают архивом из CI');
    return;
  }
  console.log('  файлов с ответами под версионным контролем нет: ' +
    tracked.length + ' PDF проверено');
}
