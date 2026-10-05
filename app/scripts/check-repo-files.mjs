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
        источника (задачник, тренажёр, курс).

   Исключения — явным списком ALLOWED, у каждого причина.

   Запуск: node scripts/check-repo-files.mjs (из app/ или из корня). */

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/* Где PDF — наши. */
const PDF_HOME = [/^app\/public\/materials\//, /^docs\//];
const PDF_NOT_HOME = [/^docs\/sources\//];

/* Признаки сторонних источников в пути файла: по ним в репозиторий уже
   попадали задачники Е. А. Ширяевой («ЕГЭпроф 2025 … (трен)»,
   egeprof-zadanie-…-trenazher, zadachnik-shiryaeva) и скриншоты курса
   «Фоксфорд». */
const FOREIGN_NAME = [
  /shiryaev/i,
  /ширяев/i,
  /egeprof/i,
  /ЕГЭпроф/i,
  /\(трен\)/i,
  /trenazher\.pdf$/i,
  /foxford/i,
  /фоксфорд/i,
];

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
  }
}

if (problems.length > 0) {
  console.error(`В репозитории файлы, которым здесь не место (${problems.length}):`);
  problems.forEach((p) => console.error('  ' + p));
  console.error(
    'Исходники сторонних авторов храните у себя, в репозиторий — только описание ' +
      '(README рядом). Если файл свой и нужен здесь — добавьте его в ALLOWED в ' +
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
