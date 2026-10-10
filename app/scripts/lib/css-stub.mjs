/* scripts/lib/css-stub.mjs — заглушка CSS для ESM-модулей в служебных
   скриптах.

   Перехватчик require в load-ts.mjs подменяет .css пустым модулем, но
   он не действует на ES-модули проекта (lib/graph/katex.js подключает
   katex.min.css импортом): их грузит сам Node и на .css падает с
   ERR_UNKNOWN_FILE_EXTENSION. Этот загрузчик регистрируется через
   module.register и отдаёт вместо любого .css пустой модуль — на
   сервере стили ничего не значат. */

import { readFile } from 'node:fs/promises';

export async function load(url, context, nextLoad) {
  if (url.endsWith('.css')) {
    return { format: 'module', source: 'export default {};', shortCircuit: true };
  }
  /* Наборы движка (data/index.js) импортируются как JSON без атрибута
     — так их собирает Next.js. Node требует атрибут, поэтому здесь
     JSON отдаётся модулем с экспортом по умолчанию. */
  if (url.endsWith('.json') && context.importAttributes?.type !== 'json') {
    const source = await readFile(new URL(url), 'utf8');
    return { format: 'module', source: 'export default ' + source + ';', shortCircuit: true };
  }
  return nextLoad(url, context);
}
