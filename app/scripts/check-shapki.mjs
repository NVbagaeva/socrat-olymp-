#!/usr/bin/env node
/* scripts/check-shapki.mjs — шапки разделов (SectionHeader).

   Запуск: pnpm test:shapki

   1. У каждого задания действующей структуры есть шапка
      (src/content/shapki.ts): описание, время, картинка, подсказка.
   2. Картинки на месте: 560 и 280 px для каждой шапки.
   3. Описание короткое (до двух строк на компьютере — не длиннее
      100 знаков) и без «мы».
   4. У каждой шапки есть живой чертёж (zhivye/tip.ts) — файл существует
      и не заглушка.
   5. Правило освоения типа (src/lib/shapka/osvoenie.ts): три верных
      подряд без подсказок; подсказка, ошибка и открытое решение рвут
      серию; старые счётчики засчитываются только чистыми. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireSrc } from './lib/load-ts.mjs';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { zadaniyaEge } = requireSrc('content/struktura.js');
const { SHAPKI, kartinkaShapki } = requireSrc('content/shapki.ts');
const { osvoennyeTipy, skolkoOsvoeno } = requireSrc('lib/shapka/osvoenie.ts');

const oshibki = [];
const nado = (uslovie, tekst) => {
  if (!uslovie) oshibki.push(tekst);
};

const tip = fs.readFileSync(path.join(APP, 'src/components/tasks/shapka/zhivye/tip.ts'), 'utf8');

for (const { kod } of zadaniyaEge()) {
  const s = SHAPKI[kod];
  nado(s !== undefined, `нет шапки раздела ${kod} в content/shapki.ts`);
  if (s === undefined) continue;
  const { src560, src280 } = kartinkaShapki(s);
  for (const src of [src560, src280]) {
    nado(fs.existsSync(path.join(APP, 'public', src)), `${kod}: нет картинки ${src}`);
  }
  nado(s.lead.length <= 100, `${kod}: описание длиннее 100 знаков (${s.lead.length})`);
  nado(!/(^|[^а-яё])(мы|нас|наш[а-я]*)([^а-яё]|$)/i.test(s.lead), `${kod}: в описании «мы»`);
  nado(s.minuty > 0 && s.podskazka !== '' && s.opisanie !== '', `${kod}: пустые поля шапки`);
  const m = new RegExp(`case '${kod}':\\s*return import\\('\\./(\\w+)'\\)`).exec(tip);
  nado(m !== null, `${kod}: нет живого чертежа в zhivye/tip.ts`);
  if (m !== null) {
    const f = path.join(APP, 'src/components/tasks/shapka/zhivye', `${m[1]}.tsx`);
    nado(fs.existsSync(f), `${kod}: нет файла ${m[1]}.tsx`);
    if (fs.existsSync(f)) {
      nado(!fs.readFileSync(f, 'utf8').includes('ЗАГЛУШКА'), `${kod}: ${m[1]}.tsx — заглушка`);
    }
  }
}

/* Правило освоения. */
const p = (kind, outcome, at) => ({ id: `${kind}${at}`, task: 't', kind, outcome, seconds: 1, at });
const log = (attempts, archive = {}, folded) => ({
  v: 1,
  attempts,
  archive,
  legacyMistakes: [],
  ...(folded ? { folded } : {}),
});
const sluchai = [
  ['три верных подряд', log([p('a', 'right', 1), p('a', 'right', 2), p('a', 'right', 3)]), ['a']],
  [
    'подсказка рвёт серию',
    log([p('a', 'right', 1), p('a', 'hinted', 2), p('a', 'right', 3), p('a', 'right', 4)]),
    [],
  ],
  [
    'ошибка рвёт серию',
    log([p('a', 'right', 1), p('a', 'right', 2), p('a', 'wrong', 3), p('a', 'right', 4)]),
    [],
  ],
  [
    'освоенный остаётся',
    log([p('a', 'right', 1), p('a', 'right', 2), p('a', 'right', 3), p('a', 'wrong', 4)]),
    ['a'],
  ],
  [
    'чужие типы не мешают',
    log([p('a', 'right', 1), p('b', 'wrong', 2), p('a', 'right', 3), p('a', 'right', 4)]),
    ['a'],
  ],
  ['чистые старые счётчики', log([], { u: { a: { done: 3, right: 3, seconds: 9 } } }), ['a']],
  ['старые с ошибкой — нет', log([], { u: { a: { done: 5, right: 4, seconds: 9 } } }), []],
  [
    'старые с подсказкой — нет',
    log([], { u: { a: { done: 3, right: 3, seconds: 9, hinted: 1 } } }),
    [],
  ],
  ['свёртка', log([], {}, { upTo: 1, kinds: { a: { done: 4, right: 4, seconds: 9 } } }), ['a']],
];
for (const [imya, l, zhdem] of sluchai) {
  const got = [...osvoennyeTipy(l)].sort();
  nado(JSON.stringify(got) === JSON.stringify(zhdem), `освоение «${imya}»: ${got} вместо ${zhdem}`);
}
nado(skolkoOsvoeno(undefined, ['a']) === 0, 'освоение: пустой журнал');

if (oshibki.length > 0) {
  console.error(`Шапки разделов: ${oshibki.length} ошибок`);
  for (const o of oshibki) console.error(`  — ${o}`);
  process.exit(1);
}
console.log(
  `Шапки разделов: ${zadaniyaEge().length} разделов, правило освоения — ${sluchai.length} случаев. Всё в порядке.`,
);
