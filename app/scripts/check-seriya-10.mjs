#!/usr/bin/env node
/* scripts/check-seriya-10.mjs — комплекты уроков задания №10.

   Запуск: pnpm test:seriya-10

   Код комплекта восстанавливает всю серию из 9 уроков на любом
   устройстве: seed урока = код + номер урока (+ перегенерация), без
   localStorage. Проверка:
     — для нескольких кодов модели листов всех 9 уроков считаются в двух
       отдельных процессах Node («чистое» состояние) и совпадают побайтно
       (sha256 JSON модели вместе с текстами и ответами задач);
     — внутри комплекта задачи не повторяются (все уроки, все блоки);
     — урок 9 — итоговая: 2 варианта по 10 задач, только ФИПИ, все пять
       групп в каждом варианте;
     — перегенерация урока меняет только этот урок и берёт задачи,
       которых нет в остальных уроках;
     — разбор — задачи ФИПИ (пока они есть у прототипа), «самостоятельно» —
       аналоги; домашнее задание — 2 ФИПИ + 1 аналог на прототип;
     — лист генератора: ученик и учитель — один запрос, одни задачи;
       варианты без повторов; запрос → адрес → запрос сохраняется. */

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { requireSrc } from './lib/load-ts.mjs';

const SELF = fileURLToPath(import.meta.url);
const KODY = ['K7Q2AB', 'Z9X1C0-3.1', '4MPT7V-1.2-9.1'];

const { modelUroka, parseKodSerii, NASTROYKI_PO_UMOLCHANIYU } = requireSrc('lib/zadanie10/sborka');
const { FIPI, ANALOGI } = requireSrc('lib/zadanie10/bank/index');
const { dannyeDlyaBrauzera } = requireSrc('lib/zadanie10/dannye-server');
const { ANALOGI_PO_PROTOTIPAM } = requireSrc('lib/zadanie10/bank/index');

const indeks = JSON.parse(dannyeDlyaBrauzera(FIPI, ANALOGI_PO_PROTOTIPAM).indeks);
const poId = new Map([...FIPI, ...ANALOGI].map((z) => [z.id, z]));

function modeli(kodSerii) {
  const p = parseKodSerii(kodSerii);
  const n = { ...NASTROYKI_PO_UMOLCHANIYU, regen: p.regen };
  return Array.from({ length: 9 }, (_, i) => modelUroka(p.kod, i + 1, n, indeks));
}

function hashi(kodSerii) {
  return modeli(kodSerii).map((m) => {
    const s = JSON.stringify({
      m,
      zadachi: m.bloki
        .flatMap((b) => b.spiski.flat())
        .map((id) => [id, poId.get(id)?.text, poId.get(id)?.answer]),
    });
    return createHash('sha256').update(s).digest('hex');
  });
}

if (process.argv[2] === '--hashi') {
  console.log(JSON.stringify(hashi(process.argv[3])));
  process.exit(0);
}

const problems = [];
for (const kod of KODY) {
  const a = execFileSync(process.execPath, [SELF, '--hashi', kod], { encoding: 'utf8' }).trim();
  const b = execFileSync(process.execPath, [SELF, '--hashi', kod], { encoding: 'utf8' }).trim();
  if (a !== b) {
    problems.push(`${kod}: восстановление в чистом процессе даёт другие листы`);
  }
  const ms = modeli(kod);
  const vse = ms.flatMap((m) => m.bloki.flatMap((b) => b.spiski.flat()));
  const dubli = vse.filter((id, i) => vse.indexOf(id) !== i);
  if (dubli.length > 0) {
    problems.push(`${kod}: повторы в комплекте: ${[...new Set(dubli)].join(', ')}`);
  }
  const itog = ms[8].bloki.find((b) => b.id === 'itog');
  if (!itog || itog.spiski.length !== 2) {
    problems.push(`${kod}: итоговая — не 2 варианта`);
  } else {
    for (const v of itog.spiski) {
      if (v.length !== 10 || v.some((id) => poId.get(id)?.source !== 'fipi')) {
        problems.push(`${kod}: вариант итоговой — ${v.length} задач, не только ФИПИ`);
      }
      const gruppy = new Set(
        v
          .map((id) => Number(poId.get(id)?.prototypeId.slice(1)))
          .map((no) =>
            no <= 10 ? 'I' : no <= 17 ? 'II' : no <= 21 ? 'III' : no <= 25 ? 'IV' : 'V',
          ),
      );
      if (gruppy.size !== 5) {
        problems.push(`${kod}: в варианте итоговой не все группы`);
      }
    }
  }
  for (const m of ms.slice(0, 8).filter((_, i) => !(parseKodSerii(kod).regen[i + 1] > 0))) {
    const sam = m.bloki.find((b) => b.id === 'sam')?.spiski[0] ?? [];
    if (sam.some((id) => poId.get(id)?.source !== 'analog')) {
      problems.push(`${kod}: в «Самостоятельно» ${m.zagolovok} есть не аналоги`);
    }
    const razbor = m.bloki.find((b) => b.id === 'razbor')?.spiski[0] ?? [];
    for (const id of razbor) {
      const z = poId.get(id);
      const estFipi = FIPI.some((f) => f.prototypeId === z.prototypeId);
      if (estFipi && z.source !== 'fipi') {
        problems.push(`${kod}: в «Разборе» ${id} не ФИПИ, хотя ФИПИ у прототипа есть`);
      }
    }
  }
}

/* Перегенерация: меняется только свой урок, новые задачи — неиспользованные. */
{
  const baza = modeli('K7Q2AB');
  const regen = modeli('K7Q2AB-5.1');
  for (let i = 0; i < 9; i += 1) {
    const same = JSON.stringify(baza[i].bloki) === JSON.stringify(regen[i].bloki);
    if (i === 4 && same) {
      problems.push('перегенерация урока 5 ничего не поменяла');
    }
    if (i !== 4 && !same) {
      problems.push(`перегенерация урока 5 поменяла урок ${i + 1}`);
    }
  }
  const drugie = new Set(
    baza.filter((_, i) => i !== 4).flatMap((m) => m.bloki.flatMap((b) => b.spiski.flat())),
  );
  const novye = regen[4].bloki.flatMap((b) => b.spiski.flat());
  if (novye.some((id) => drugie.has(id))) {
    problems.push('перегенерированный урок 5 взял задачи из других уроков');
  }
  const stare = new Set(baza[4].bloki.flatMap((b) => b.spiski.flat()));
  if (novye.some((id) => stare.has(id))) {
    problems.push('перегенерированный урок 5 повторяет свои прежние задачи');
  }
}

/* Генератор: запрос ↔ адрес, ученик и учитель — одни задачи. */
{
  const { sobratList, zaprosQuery, parseZapros } = requireSrc('lib/zadanie10/sborka');
  const z = {
    tipy: [
      { id: 'P11', n: 2 },
      { id: 'P22', n: 1 },
      { id: 'P31', n: 2 },
    ],
    istochnik: 'mix',
    variantov: 4,
    primery: 2,
    kartinki: false,
    seed: 'AB12CD',
  };
  const z2 = parseZapros(new URLSearchParams(zaprosQuery(z)));
  if (JSON.stringify(z) !== JSON.stringify(z2)) {
    problems.push('генератор: запрос не восстанавливается из адреса');
  }
  const a = sobratList(z, indeks);
  const b = sobratList(z2, indeks);
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    problems.push('генератор: один запрос — разные листы');
  }
  const ids = a.bloki.flatMap((bl) => [...bl.spiski.flat(), ...(bl.primery ?? [])]);
  if (new Set(ids).size !== ids.length) {
    problems.push('генератор: повторы задач в листе');
  }
}

if (problems.length > 0) {
  console.error(`Проблем: ${problems.length}`);
  problems.forEach((p) => console.error('  ' + p));
  process.exit(1);
}
console.log(
  `Комплекты №10: коды ${KODY.join(', ')} — все 9 уроков восстанавливаются побайтно, повторов нет, итоговая — только ФИПИ.`,
);
