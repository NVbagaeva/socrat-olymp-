#!/usr/bin/env node
/* scripts/check-seriya-1.mjs — серия уроков «Для репетиторов» №1 по коду.

   1. Код восстанавливает всю серию: для нескольких кодов (в том числе с
      перегенерированными уроками) листы ученика и учителя всех 12
      уроков собираются в двух отдельных процессах — с чистого
      состояния, без браузера и хранилищ — и совпадают байт в байт
      (HTML листа из lib/sheet).
   2. Внутри комплекта задачи не повторяются: ни между уроками, ни
      внутри урока, ни с итоговой работой; то же с настройками учителя
      (другое число задач в блоках).
   3. Итоговая работа — два варианта по 11 задач, по одной на урок
      1–11, только открытый банк.
   4. Перегенерация урока N берёт неиспользованные задачи (пересечение
      с прежним поколением — только когда банк прототипа кончился) и не
      трогает другие уроки, кроме мини-проверки и разминки урока N + 1.

   Запуск: node scripts/check-seriya-1.mjs
   Ненулевой код возврата — есть проблемы, они печатаются списком. */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { requireSrc } from './lib/load-ts.mjs';

const SELF = fileURLToPath(import.meta.url);
const KODY = ['K7Q2AB', 'Z9X1C0-3.1', '4MPT7V-1.2-12.1'];

const S1 = requireSrc('lib/planimetriya/sheet1.ts');
const U = requireSrc('lib/planimetriya/uroki.ts');
const { dannyeTrenazhera1 } = requireSrc('lib/planimetriya/trenazher/dannye.ts');
const sheet = requireSrc('lib/sheet/sheet.js');
const buildDocument = sheet.buildDocument ?? sheet.default?.buildDocument;

const bank = dannyeTrenazhera1().bank;

/** Хэши листов всех уроков серии: урок → [ученик, учитель]. */
function hashiSerii(kod) {
  const out = {};
  for (let urok = 1; urok <= 12; urok += 1) {
    const q = new URLSearchParams(`m=u&i=m&u=${urok}&k=${encodeURIComponent(kod)}&seed=${kod}`);
    const p = S1.parseSheetQuery1(q);
    const list = S1.sobratList(p, bank);
    out[urok] = ['uchenik', 'uchitel'].map((vid) => {
      const spec = S1.sheetSpec1(p, list, vid);
      const html = buildDocument(spec, {});
      return createHash('sha256').update(html).digest('hex');
    });
  }
  return out;
}

/* Режим дочернего процесса: напечатать хэши и выйти. */
if (process.argv[2] === '--hashi') {
  process.stdout.write(JSON.stringify(hashiSerii(process.argv[3])));
  process.exit(0);
}

const problems = [];
const klyuch = U.klyuchPoz;

/* 1. Байт в байт — в двух чистых процессах. */
for (const kod of KODY) {
  const [a, b] = [0, 1].map(() =>
    execFileSync(process.execPath, [SELF, '--hashi', kod], {
      encoding: 'utf8',
      maxBuffer: 1 << 26,
    }),
  );
  if (a !== b) problems.push(`код ${kod}: листы двух чистых сборок различаются`);
  const h = JSON.parse(a);
  if (Object.keys(h).length !== 12)
    problems.push(`код ${kod}: собрано ${Object.keys(h).length} уроков`);
}

/* 2–3. Повторы и итоговая. */
function vseZadachi(s, nastroyki = {}) {
  const out = [];
  for (let n = 1; n <= 12; n += 1) {
    const p = U.planUroka(s, n, nastroyki[n]);
    for (const b of p.bloki)
      for (const z of b.pozicii) out.push({ urok: n, blok: b.id, key: klyuch(z), z });
  }
  return out;
}
let zadach = 0;
for (const kod of KODY) {
  const k = U.parseKodSerii(kod);
  if (k === null || U.kodSeriiText(k) !== kod) problems.push(`код ${kod}: не разбирается обратно`);
  const s = U.seriya(k, bank);
  const vse = vseZadachi(s);
  zadach += vse.length;
  const seen = new Map();
  for (const x of vse) {
    const byl = seen.get(x.key);
    if (byl !== undefined)
      problems.push(
        `код ${kod}: ${x.key} и в уроке ${byl.urok} (${byl.blok}), и в уроке ${x.urok} (${x.blok})`,
      );
    else seen.set(x.key, x);
  }
  const itog = U.planUroka(s, 12).bloki.filter((b) => b.id === 'v1' || b.id === 'v2');
  if (itog.length !== 2 || itog.some((v) => v.pozicii.length !== 11))
    problems.push(`код ${kod}: итоговая не 2 × 11`);
  for (const v of itog) {
    if (v.pozicii.some((z) => z.vid !== 'bank'))
      problems.push(`код ${kod}: в итоговой задача не из банка`);
  }
  /* С настройками учителя: больше задач в блоках — всё равно без повторов. */
  const nast = {};
  for (let n = 1; n <= 11; n += 1) nast[n] = { vykl: [], n: { razbor: 2, sam: 3, dz: 4 } };
  const svoi = vseZadachi(s, nast);
  const keys = svoi.map((x) => x.key);
  const dup = keys.filter((x, i) => keys.indexOf(x) !== i);
  if (dup.length > 0)
    problems.push(`код ${kod}, свои настройки: повторы ${dup.slice(0, 3).join(', ')}`);
}

/* 4. Перегенерация. */
{
  const osnova = 'K7Q2AB';
  const s0 = U.seriya(U.parseKodSerii(osnova), bank);
  for (const n of [3, 7, 11, 12]) {
    const s1 = U.seriya(U.parseKodSerii(`${osnova}-${n}.1`), bank);
    for (let m = 1; m <= 12; m += 1) {
      const a = U.planUroka(s0, m).bloki;
      const b = U.planUroka(s1, m).bloki;
      const sravnit = (bl) =>
        JSON.stringify(bl.filter((x) => x.id !== 'proverka' && x.id !== 'razminka'));
      const mozhno = m === n || m === n + 1;
      if (!mozhno && JSON.stringify(a) !== JSON.stringify(b))
        problems.push(`перегенерация урока ${n} изменила урок ${m}`);
      if (m === n + 1 && sravnit(a) !== sravnit(b))
        problems.push(
          `перегенерация урока ${n} изменила блоки урока ${m} (кроме проверки и разминки)`,
        );
    }
    const stare = new Set(U.planUroka(s0, n).bloki.flatMap((b) => b.pozicii.map(klyuch)));
    const novye = U.planUroka(s1, n).bloki.flatMap((b) => b.pozicii.map(klyuch));
    const obshchie = novye.filter((x) => stare.has(x));
    if (novye.length === 0 || JSON.stringify([...stare]) === JSON.stringify(novye))
      problems.push(`перегенерация урока ${n}: урок не изменился`);
    console.log(
      `перегенерация урока ${n}: ${novye.length} задач, из прежнего поколения ${obshchie.length}`,
    );
  }
}

console.log(
  `серии: ${KODY.length} кода × 12 уроков, задач в сериях ${zadach}, проблем ${problems.length}`,
);
if (problems.length > 0) {
  for (const p of problems.slice(0, 100)) console.log(`  ✗ ${p}`);
  process.exit(1);
}
console.log('ок');
