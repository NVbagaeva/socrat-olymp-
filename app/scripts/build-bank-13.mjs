#!/usr/bin/env node
/* scripts/build-bank-13.mjs — подбор банка задания №13 «Экономические задачи».

   Запуск: pnpm build:bank-13

   Для каждого прототипа (docs/13-economics/03-prototypes.md) перебирает
   seed «b1», «b2», … и оставляет первые десять вариантов, у которых:
     — числа разные (подпись параметров не повторяется);
     — сюжет другой: не повторяются ни имя (или организация), ни цель;
     — один ответ встречается не больше двух раз.
   Каждый вариант уже проверен генератором: ответ формулы совпал с
   независимым солвером, числа источников исключены.

   Результат: src/lib/zadanie13/bank.ts (только prototypeId и seed —
   ответов в клиентском коде нет) и отчёт docs/13-economics/04-bank.md
   с условиями и ответами для ручной проверки. */

import fs from 'node:fs';
import path from 'node:path';
import { APP, requireSrc } from './lib/load-ts.mjs';

const { generate, prototypes } = requireSrc('lib/zadanie13/generate');

const PER = 10;
const entries = [];
const report = [];
const UNIT = { rub: 'руб.', thous: 'тыс. руб.', mln: 'млн руб.', percent: '%', months: 'мес.', years: 'лет', none: '' };
const TYPE = { A: 'Дифференцированный платёж', B: '«Поломанный» дифференцированный платёж', C: 'Аннуитет', D: 'Вклады' };

let lastType = '';
for (const info of prototypes()) {
  const chosen = [];
  const sigs = new Set();
  const who = new Set();
  const goals = new Set();
  const answers = new Map();
  for (let i = 1; chosen.length < PER && i <= 4000; i++) {
    const seed = `b${i}`;
    let t;
    try {
      t = generate(info.id, seed);
    } catch {
      continue;
    }
    const sig = JSON.stringify(t.params);
    if (sigs.has(sig) || who.has(t.plot.who) || goals.has(t.plot.goal)) continue;
    if ((answers.get(t.answer) ?? 0) >= 2) continue;
    sigs.add(sig);
    who.add(t.plot.who);
    goals.add(t.plot.goal);
    answers.set(t.answer, (answers.get(t.answer) ?? 0) + 1);
    chosen.push(t);
  }
  if (chosen.length < PER) {
    console.error(`${info.id}: набралось только ${chosen.length} вариантов`);
    process.exit(1);
  }
  for (const t of chosen) entries.push([info.id, t.seed]);

  const typeTitle = info.id.startsWith('P') ? 'Подготовительные: таблица руками' : TYPE[info.type];
  if (typeTitle !== lastType) {
    report.push(`\n## ${typeTitle}\n`);
    lastType = typeTitle;
  }
  report.push(`### ${info.id} · ${info.subtype} · ${info.title}\n`);
  report.push(`Источник: ${info.sourceNote ?? (info.source === 'fipi' ? 'ФИПИ' : 'авторская')} · уровень: ${info.difficulty === 'hard' ? 'повышенный' : 'базовый'} · ответ в: ${UNIT[info.units] || '—'}\n`);
  chosen.forEach((t, k) => {
    const cond = t.condition.replace(/\n/g, '<br>');
    const table = t.conditionTable ? `<br>${t.conditionTable.head.join(' · ')}<br>${t.conditionTable.rows.map((r) => r.join(' · ')).join('<br>')}` : '';
    report.push(`${k + 1}. ${cond}${table}<br>**Ответ: ${String(t.answer).replace('.', ',')}** · seed \`${t.seed}\` · ${t.plot.deck}\n`);
  });
}

const bankTs = `/**
 * Банк задания №13: 10 вариантов на прототип.
 *
 * Файл собирается командой pnpm build:bank-13 — руками не править.
 * Хранятся только прототип и seed: задачу, ответ и решение строит
 * generate(prototypeId, seed), ответы в клиентский код не попадают.
 */

export const BANK_13: readonly (readonly [prototypeId: string, seed: string])[] = [
${entries.map(([id, s]) => `  ['${id}', '${s}'],`).join('\n')}
];
`;
fs.writeFileSync(path.join(APP, 'src/lib/zadanie13/bank.ts'), bankTs);

const head = `# Задание №13. Банк задач для проверки

Собран командой \`pnpm build:bank-13\`. ${entries.length} задач: по ${PER} на каждый из ${entries.length / PER} прототипов.
Каждая задача проверена независимым солвером (прямой пересчёт таблицы по периодам). Числа задач из
материалов в банк не попадают; в пределах прототипа не повторяются ни числа, ни имя, ни цель кредита.

Файл с ответами — для учителя; в клиентский код сайта ответы не попадают (там только seed).
`;
fs.writeFileSync(path.join(APP, '..', 'docs/13-economics/04-bank.md'), head + report.join('\n') + '\n');
console.log(`build-bank-13: ${entries.length} задач → src/lib/zadanie13/bank.ts, docs/13-economics/04-bank.md`);
