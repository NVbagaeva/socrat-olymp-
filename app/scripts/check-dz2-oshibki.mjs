#!/usr/bin/env node
/* scripts/check-dz2-oshibki.mjs — разбор ошибок новой выдачи ДЗ
   (lib/dz2/oshibka.ts): у каждого случая свой текст на экране, а не
   общее «Проверьте связь». Запуск: pnpm test:dz2-oshibki. */

import { requireSrc } from './lib/load-ts.mjs';

const { kodOshibki, prichinaOshibki } = requireSrc('lib/dz2/oshibka.ts');
const { Dz2Error } = requireSrc('lib/dz2/api.ts');
const { DZ2 } = requireSrc('content/dz2.ts');

const chunk = new Error('Loading chunk 4821 failed.\n(error: https://budetege.ru/_next/static/chunks/4821.js)');
chunk.name = 'ChunkLoadError';

const SLUCHAI = [
  ['база: раздел', new Dz2Error('bad_task_no', 'bad_task_no: раздел 7 не подключён к ДЗ'), 'bad_task_no'],
  ['база: ответ', new Dz2Error('bad_answer', 'bad_answer: ответ не в нормальной записи ЕГЭ'), 'bad_answer'],
  ['сайт обновился (webpack)', chunk, 'sayt_obnovilsya'],
  ['сайт обновился (Safari)', new TypeError('Importing a module script failed.'), 'sayt_obnovilsya'],
  ['сайт обновился (Chrome)', new TypeError('Failed to fetch dynamically imported module: https://x/a.js'), 'sayt_obnovilsya'],
  ['вход истёк', new Dz2Error('unknown', 'JWT expired [PGRST301]'), 'sessiya'],
  ['нет сети', new Dz2Error('unknown', 'TypeError: Failed to fetch'), 'set'],
  ['нет сети (fetch)', new TypeError('Failed to fetch'), 'set'],
  ['нет функции', new Dz2Error('unknown', 'Could not find the function public.dz2_save(p) [PGRST202]'), 'unknown'],
  ['не Error', 'что-то', 'unknown'],
];

let oshibok = 0;
const plokho = (s) => {
  oshibok += 1;
  console.log(`  ✗ ${s}`);
};
for (const [chto, e, zhdali] of SLUCHAI) {
  const kod = kodOshibki(e);
  if (kod !== zhdali) plokho(`${chto}: ждали «${zhdali}», получили «${kod}»`);
}

const OBSHCHIY = 'Не получилось. Обновите страницу и попробуйте ещё раз.';
for (const kod of ['sayt_obnovilsya', 'sessiya', 'set', 'bad_answer', 'too_many_tasks', 'no_items', 'not_draft', 'forbidden']) {
  if (DZ2.master.oshibkaBazy(kod) === OBSHCHIY) plokho(`мастер выдачи: у «${kod}» нет своего текста`);
}
for (const kod of ['sayt_obnovilsya', 'sessiya', 'set']) {
  if (DZ2.itogi.oshibka(kod) === OBSHCHIY) plokho(`итоги: у «${kod}» нет своего текста`);
  if (/Проверь связь/.test(DZ2.uchenik.oshibka(kod)) || DZ2.uchenik.oshibka(kod).startsWith('Не получилось.')) {
    plokho(`ученик: у «${kod}» нет своего текста`);
  }
}
if (prichinaOshibki(new Dz2Error('unknown', 'Could not find  the\nfunction')) !== 'Could not find the function') {
  plokho('причина неизвестной ошибки: пробелы и переносы не схлопнуты');
}
if ((prichinaOshibki(new Error('x'.repeat(500))) ?? '').length > 160) plokho('причина длиннее 160 знаков');

console.log(`Ошибки новой выдачи ДЗ: случаев ${SLUCHAI.length}, не прошло ${oshibok}.`);
process.exit(oshibok === 0 ? 0 : 1);
