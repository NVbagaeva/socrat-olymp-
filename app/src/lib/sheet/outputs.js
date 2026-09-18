/* sheet/outputs.js — куда складывать готовые файлы.

   Правило одно и оно жёсткое: **файл с ответами не лежит
   в репозитории**. Репозиторий публичный, и всё, что попало
   в app/public, отдаётся сайтом по прямому адресу — ученику
   достаточно угадать имя. Поэтому:

     без ответов  →  app/public/materials/...   в репозитории,
                                                 отдаётся сайтом
     с ответами   →  app/pdf-private/...         вне репозитория,
                                                 забирается архивом
                                                 со страницы запуска CI

   Модуль нужен затем, чтобы правило нельзя было забыть. Любая
   сборка листа — сборник №12, генератор вариантов, задание №3 —
   спрашивает путь здесь и получает его вместе с проверкой.
   Своих путей сборки не придумывают.

   Папка private намеренно без точки в начале: actions/upload-artifact
   по умолчанию пропускает скрытые файлы, и архив вышел бы пустым.
*/

/** Готовые файлы без ответов: их отдаёт сайт. */
const PUBLIC_DIR = ['public', 'materials'];

/** Файлы с ответами: в репозиторий не попадают, .gitignore их скрывает. */
const PRIVATE_DIR = ['pdf-private'];

/**
 * Путь готового файла.
 *
 * appDir      — папка app/ проекта
 * name        — имя файла без расширения
 * withAnswers — есть ли в файле ответы или решения
 * section     — подпапка внутри materials, например 'zadanie-12'
 *
 * Вернёт { dir, file, published } — published это путь от корня
 * сайта либо null, если файл сайтом не отдаётся.
 */
function target(appDir, options) {
  var join = function (parts) { return parts.join('/'); };
  var name = options.name;
  if (!name) { throw new Error('outputs: имя файла не задано'); }

  if (options.withAnswers) {
    var dir = join([appDir].concat(PRIVATE_DIR));
    return { dir: dir, file: dir + '/' + name + '.pdf', published: null };
  }

  var parts = PUBLIC_DIR.concat(options.section ? [options.section] : []);
  var publicDir = join([appDir].concat(parts));
  return {
    dir: publicDir,
    file: publicDir + '/' + name + '.pdf',
    published: '/' + join(parts.slice(1).concat([name + '.pdf']))
  };
}

/**
 * Страховка для того, кто всё-таки собрал путь сам.
 *
 * Бросает, если файл с ответами оказался внутри public: молча
 * выпустить такой файл нельзя, это утечка ответов ученикам.
 */
function assertSafe(file, withAnswers) {
  var normalized = String(file).split('\\').join('/');
  if (withAnswers && /(^|\/)public\//.test(normalized)) {
    throw new Error(
      'outputs: файл с ответами «' + file + '» попал в app/public.\n' +
      'Всё, что лежит в public, отдаётся сайтом по прямому адресу.\n' +
      'Файлы с ответами собираются в ' + PRIVATE_DIR.join('/') +
      ' и уезжают архивом из CI.'
    );
  }
  return file;
}

/** Имена, по которым видно файл с ответами. Нужны проверке репозитория. */
const ANSWER_MARKS = ['uchitel', 'otvety', 'answers', 'teacher'];

const api = { target: target, assertSafe: assertSafe,
              PUBLIC_DIR: PUBLIC_DIR, PRIVATE_DIR: PRIVATE_DIR,
              ANSWER_MARKS: ANSWER_MARKS };

export default api;
export { target, assertSafe, PUBLIC_DIR, PRIVATE_DIR, ANSWER_MARKS };
