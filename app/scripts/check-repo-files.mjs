/* scripts/check-repo-files.mjs — в репозитории нет чужих материалов.

   Задачники, тренажёры и конспекты сторонних авторов в репозиторий не
   кладутся: по ним составляются прототипы, а в content-source/ остаются
   только наши описания (соответствие прототипам, наблюдения,
   исключаемые наборы чисел). Сам исходник — у автора на компьютере.

   Проверка смотрит на файлы под версионным контролем (git ls-files), а
   не на диск: лежащий рядом, но не добавленный файл — правильное
   состояние. Падает, если:

     1. PDF лежит вне мест, где PDF — наши:
          app/public/materials/  — листы для учеников, собирает сайт;
          docs/                  — наши документы, кроме docs/sources/;
     2. в пути файла любого типа есть признак известного стороннего
        источника (задачник, тренажёр, курс);
     3. в ТЕКСТЕ любого текстового файла упомянут сторонний источник по
        имени автора или названию сборника. Описания в content-source/ и
        комментарии пишутся обезличенно: «сторонний задачник 2025 года».

   Исключения — явным списком ALLOWED, у каждого причина.

   Запуск: node scripts/check-repo-files.mjs (из app/ или из корня). */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/* Где PDF — наши. */
const PDF_HOME = [/^app\/public\/materials\//, /^docs\//];
const PDF_NOT_HOME = [/^docs\/sources\//];

/* Признаки сторонних источников. Сами слова записаны кодами символов:
   иначе этот файл находил бы сам себя. Расшифровка — в комментарии к
   каждой строке, без имён: «фамилия автора задачника», «название
   сборника», «название курса». */
const MARKERS = [
  '\u0073\u0068\u0069\u0072\u0079\u0061\u0065\u0076', // фамилия автора задачника, латиницей
  '\u0448\u0438\u0440\u044f\u0435\u0432', // она же кириллицей
  '\u0065\u0067\u0065\u0070\u0072\u006f\u0066', // название сборника, латиницей
  '\u0415\u0413\u042d\u043f\u0440\u043e\u0444', // название сборника кириллицей
  '\u041f\u043e\u043b\u043d\u044b\u0439 \u043a\u0443\u0440\u0441 \u043f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0438', // название двухтомника
  '\u0066\u006f\u0078\u0066\u006f\u0072\u0064', // название онлайн-курса, латиницей
  '\u0444\u043e\u043a\u0441\u0444\u043e\u0440\u0434', // оно же кириллицей
].map((word) => new RegExp(word, 'i'));

/* В пути файла — те же признаки и характерные хвосты имён файлов. */
const FOREIGN_NAME = [...MARKERS, /\(трен\)/i, /trenazher\.pdf$/i];

/* Текстовые файлы, в которых ищутся упоминания: всё, кроме двоичных. */
const BINARY = /\.(?:png|jpe?g|webp|avif|gif|ico|pdf|woff2?|ttf|otf|zip|gz|mp4|webm|mp3|psd|ai)$/i;
const SELF = 'app/scripts/check-repo-files.mjs';

/* Явные исключения: путь → причина. */
const ALLOWED = new Map([
  // Пока пусто. Формат: ['путь/к/файлу.pdf', 'почему ему можно здесь лежать'].
]);

const files = execFileSync('git', ['-c', 'core.quotepath=off', 'ls-files', '-z'], {
  cwd: root,
  encoding: 'utf8',
})
  .split('\0')
  .filter(Boolean);

const problems = [];
for (const file of files) {
  if (ALLOWED.has(file)) {
    continue;
  }
  if (/\.pdf$/i.test(file) && PDF_NOT_HOME.some((re) => re.test(file))) {
    problems.push(
      `${file} — PDF в docs/sources/: туда кладутся только исходники, им место у автора`,
    );
    continue;
  }
  if (/\.pdf$/i.test(file) && !PDF_HOME.some((re) => re.test(file))) {
    problems.push(`${file} — PDF вне app/public/materials/ и docs/`);
    continue;
  }
  /* Признак ищется во всём пути: скриншоты курса лежали как
     foxford-reference/IMG 7636.png — имя файла ничего не выдаёт. */
  if (FOREIGN_NAME.some((re) => re.test(file))) {
    problems.push(`${file} — в пути признак стороннего источника`);
    continue;
  }
  /* Упоминание в тексте: файл свой, но называет чужой источник. */
  if (file !== SELF && !BINARY.test(file)) {
    let text = '';
    try {
      text = fs.readFileSync(path.join(root, file), 'utf8');
    } catch {
      continue;
    }
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      if (MARKERS.some((re) => re.test(lines[i]))) {
        problems.push(`${file}:${i + 1} — в тексте упомянут сторонний источник`);
      }
    }
  }
}

if (problems.length > 0) {
  console.error(`В репозитории файлы, которым здесь не место (${problems.length}):`);
  problems.forEach((p) => console.error('  ' + p));
  console.error(
    'Исходники сторонних авторов храните у себя, в репозиторий — только описание ' +
      '(README рядом), без имени автора и названия сборника. Если файл свой и нужен здесь — добавьте его в ALLOWED в ' +
      'app/scripts/check-repo-files.mjs с причиной.',
  );
  process.exit(1);
}
const left = [...ALLOWED.keys()].filter((f) => files.includes(f));
console.log(
  `Файлы репозитория: ${files.length}, чужих материалов нет` +
    (left.length ? ` (исключения: ${left.join(', ')})` : '') +
    '.',
);
