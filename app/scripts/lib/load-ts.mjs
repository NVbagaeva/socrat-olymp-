/* scripts/lib/load-ts.mjs — банк и компоненты на TypeScript из
   служебного скрипта на Node.

   Банк заданий №4 и №5 и рисунки к нему написаны на TypeScript и TSX
   под Next.js: Node сам их не прочтёт. Здесь ставится перехватчик
   require: файл .ts или .tsx переводится TypeScript'ом в CommonJS
   на лету, псевдоним «@/» разрешается в папку src — так же, как это
   делает tsconfig. Тот же приём, что в check-veroyatnost.mjs, только
   без временной папки: перевод идёт в памяти, и подтягиваются лишь
   те файлы, которые действительно потребовались.

   Типы стираются, проверка типов не делается — это работа
   pnpm typecheck. Скрипту нужен только исполняемый код.

   Импорт CSS внутри компонентов (probability.css подключается
   отдельно) на сервере не нужен и заменяется пустым модулем. */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire, Module } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(HERE, '..', '..');
const SRC = path.join(APP, 'src');

const require = createRequire(import.meta.url);

let installed = false;

function install() {
  if (installed) { return; }
  installed = true;

  const ts = require('typescript');
  const options = {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true,
  };

  const compile = (module, file) => {
    const source = fs.readFileSync(file, 'utf8');
    const out = ts.transpileModule(source, { compilerOptions: options, fileName: file });
    module._compile(out.outputText, file);
  };
  Module._extensions['.ts'] = compile;
  Module._extensions['.tsx'] = compile;
  /* Стили из компонентов: на сервере они ничего не значат. */
  Module._extensions['.css'] = (module) => { module.exports = {}; };

  /* Псевдоним «@/» из tsconfig и импорты без расширения:
     «./types» может лежать как types.ts, types.tsx или types/index.ts. */
  const resolve = Module._resolveFilename;
  Module._resolveFilename = function (request, parent, ...rest) {
    let wanted = request;
    if (wanted.startsWith('@/')) { wanted = path.join(SRC, wanted.slice(2)); }
    if (wanted.startsWith('.') || path.isAbsolute(wanted)) {
      const base = path.isAbsolute(wanted) ? wanted
        : path.join(path.dirname(parent.filename), wanted);
      for (const ext of ['', '.ts', '.tsx', '.js', '.mjs', '/index.ts', '/index.js']) {
        const candidate = base + ext;
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          return resolve.call(this, candidate, parent, ...rest);
        }
      }
    }
    return resolve.call(this, request, parent, ...rest);
  };
}

/**
 * Модуль проекта по пути от папки src: requireSrc('lib/veroyatnost/index').
 * Возвращает то же, что require, — объект с экспортами.
 */
export function requireSrc(relative) {
  install();
  return require(path.join(SRC, relative));
}

export { APP, SRC };
