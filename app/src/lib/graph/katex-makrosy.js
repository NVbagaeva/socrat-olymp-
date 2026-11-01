/* graph/katex-makrosy.js — общие макросы KaTeX проекта.

   Подключается побочным импортом там, где берут пакет katex:
   lib/graph/katex.js (через него — Tex, typeset, листы и разборы) и
   редкие места с прямым `import katex from 'katex'`. Скрипты проверок
   с require('katex') вызывают podklyuchitMakrosy(katex): в Node их
   require даёт другой экземпляр пакета, чем ESM-импорт. Макрос
   регистрируется в самом пакете (__defineMacro), поэтому действует
   при любом вызове renderToString после этого импорта.

   \arc{AB} — дуга окружности: знак ∪ перед буквами, как в школьных
   учебниках. Знак — обычный символ (mathord), а не бинарная операция
   или отношение: «\arc{BD} - \arc{AC}» набирается с нормальными
   пробелами вокруг минуса. \arc{} без букв — просто знак дуги.
   Других обозначений дуги (\smile, \frown, ◡, ⌣, ⌒) в контенте нет —
   это проверяет test:math-markup. */

import katexLib from 'katex';

export const MAKROSY = {
  '\\arc': '\\mathord{\\cup}#1',
};

/** Зарегистрировать макросы в экземпляре KaTeX (у скриптов Node их два: ESM и CommonJS). */
export function podklyuchitMakrosy(katex) {
  for (const [imya, telo] of Object.entries(MAKROSY)) katex.__defineMacro(imya, telo);
}

podklyuchitMakrosy(katexLib);
