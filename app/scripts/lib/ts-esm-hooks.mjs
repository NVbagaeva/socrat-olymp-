/* scripts/lib/ts-esm-hooks.mjs — модули приложения как ES-модули в Node.

   load-ts.mjs переводит TypeScript в CommonJS, и движок graph/ туда не
   встаёт: его наборы — JSON, подключённые статическим импортом, а Node
   требует для них атрибут type: json. Здесь — хуки загрузчика для
   import(): псевдоним «@/» разрешается в src, .ts и .tsx переводятся
   TypeScript'ом в ES-модуль на лету, JSON становится модулем
   с export default, CSS — пустым модулем.

   Подключение: register('./lib/ts-esm-hooks.mjs', import.meta.url),
   затем import() нужного модуля. Типы не проверяются — это работа
   pnpm typecheck. */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');
const require = createRequire(import.meta.url);
const EXTENSIONS = ['', '.ts', '.tsx', '.js', '/index.ts', '/index.js'];

function existing(base) {
  for (const ext of EXTENSIONS) {
    const file = base + ext;
    if (fs.existsSync(file) && fs.statSync(file).isFile()) { return file; }
  }
  return null;
}

export async function resolve(specifier, context, next) {
  if (specifier.startsWith('@/')) {
    const file = existing(path.join(SRC, specifier.slice(2)));
    if (file) { return { url: pathToFileURL(file).href, shortCircuit: true }; }
  }
  const relative = specifier.startsWith('./') || specifier.startsWith('../');
  if (relative && context.parentURL && context.parentURL.startsWith('file:')) {
    const file = existing(path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier));
    if (file) { return { url: pathToFileURL(file).href, shortCircuit: true }; }
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (!url.startsWith('file:')) { return next(url, context); }
  const file = fileURLToPath(url);
  if (file.endsWith('.json')) {
    return { format: 'module', shortCircuit: true,
             source: 'export default ' + fs.readFileSync(file, 'utf8') + ';' };
  }
  if (file.endsWith('.css')) {
    return { format: 'module', shortCircuit: true, source: 'export default {};' };
  }
  if (file.endsWith('.ts') || file.endsWith('.tsx')) {
    const ts = require('typescript');
    const out = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      fileName: file,
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        verbatimModuleSyntax: false,
      },
    });
    return { format: 'module', shortCircuit: true, source: out.outputText };
  }
  return next(url, context);
}
