#!/usr/bin/env node
/* scripts/check-seriya-9.mjs — серия уроков задания №9 по коду комплекта.

   Запуск: pnpm test:seriya-9

   Код комплекта задаёт всю серию: лист урока u выводится только из кода
   и номера урока (sheet9.ts, seedUroka) — без истории комплектов и без
   localStorage. Проверяется:
   1. «Чистое» устройство: уроки 1…6 считаются здесь по порядку и в
      отдельном процессе Node (пустое состояние модулей, другой порядок —
      от последнего урока к первому). HTML листов ученика и учителя
      совпадает побайтно.
   2. Адрес урока, который строит экран генератора (sheetQuery9),
      разбирается обратно в те же параметры.
   3. Уроки одной серии не повторяют задачи, пока в банке прототипа есть
      неиспользованные варианты. */

import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { requireSrc } from './lib/load-ts.mjs';

const SELF = fileURLToPath(import.meta.url);
const UROKOV = 6;
const KODY = ['7K3F', 'Q9ZD', '0M4X'];
const NASTROYKI = [
  'g=I,II,III,IV,V&n=10&t=print&c=1&r=2',
  'g=II,IV&n=6&t=color&c=2&r=1',
  'g=IV&p=9.4.5&n=10&t=print&c=1&r=0',
];

function params(S9, kod, nastroyki, urok) {
  const q = new URLSearchParams(nastroyki);
  q.set('seed', kod);
  const base = S9.parseSheetQuery9(q);
  /* Как экран генератора: настройки + код + номер урока → адрес → параметры. */
  const href = S9.sheetQuery9({ ...base, urok });
  return { href, params: S9.parseSheetQuery9(new URLSearchParams(href)) };
}

/** Отпечатки листов урока: HTML документа ученика и учителя. */
function otpechatki(order) {
  const S9 = requireSrc('lib/proizvodnaya/sheet9.ts');
  const { buildDocument } = requireSrc('lib/sheet/sheet.js');
  const out = {};
  for (const kod of KODY) {
    for (const nastroyki of NASTROYKI) {
      for (const urok of order) {
        const { params: p } = params(S9, kod, nastroyki, urok);
        const hash = (w) =>
          crypto
            .createHash('sha256')
            .update(buildDocument(S9.printSpec9(S9.sheetSpec9(p, w)), {}))
            .digest('hex');
        out[`${kod}|${nastroyki}|${urok}`] = { uchenik: hash(false), uchitel: hash(true) };
      }
    }
  }
  return out;
}

if (process.argv[2] === '--child') {
  process.stdout.write(JSON.stringify(otpechatki(JSON.parse(process.argv[3]))));
  process.exit(0);
}

const errors = [];
const S9 = requireSrc('lib/proizvodnaya/sheet9.ts');
const { BANK } = requireSrc('lib/proizvodnaya/bank.ts');
const pryamo = [...Array(UROKOV).keys()];

/* 1. Чистое состояние, обратный порядок. */
const zdes = otpechatki(pryamo);
const tam = JSON.parse(
  execFileSync(process.execPath, [SELF, '--child', JSON.stringify([...pryamo].reverse())], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  }),
);
for (const key of Object.keys(zdes)) {
  for (const who of ['uchenik', 'uchitel']) {
    if (zdes[key][who] !== tam[key]?.[who]) {
      errors.push(`${key}: лист ${who === 'uchenik' ? 'ученика' : 'учителя'} на чистом устройстве другой`);
    }
  }
}

/* 2. Адрес урока разбирается обратно. 3. Уроки не повторяют задачи. */
const bankSize = new Map(BANK.map((e) => [e.prototype, e.variants.length]));
let povtorov = 0;
for (const kod of KODY) {
  for (const nastroyki of NASTROYKI) {
    const used = new Map();
    const proto = new Map();
    for (const urok of pryamo) {
      const { href, params: p } = params(S9, kod, nastroyki, urok);
      if (p.urok !== urok || p.seed !== kod) {
        errors.push(`${kod}|${nastroyki}: адрес урока ${urok + 1} «${href}» разобран как урок ${p.urok + 1}`);
      }
      const ids = S9.sheetSpec9(p, false).blocks.flatMap((b) => b.tasks.map((t) => t.id));
      for (const id of ids) {
        const pr = id.split('|')[0];
        proto.set(pr, (proto.get(pr) ?? 0) + 1);
        if (used.has(id)) {
          /* Повтор допустим, только когда банк прототипа уже исчерпан. */
          if (proto.get(pr) <= (bankSize.get(pr) ?? 0)) {
            errors.push(`${kod}|${nastroyki}: урок ${urok + 1} повторяет ${id} из урока ${used.get(id) + 1}, а в банке ещё есть неиспользованные`);
          } else {
            povtorov += 1;
          }
        } else {
          used.set(id, urok);
        }
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`Серия уроков №9: нарушений ${errors.length}`);
  for (const e of errors.slice(0, 40)) console.error('  ' + e);
  process.exit(1);
}
console.log(
  `Серия уроков №9: кодов ${KODY.length} × настроек ${NASTROYKI.length} × уроков ${UROKOV} — ` +
    `на чистом устройстве и в обратном порядке листы ученика и учителя совпадают побайтно; ` +
    `повторов задач до исчерпания банка нет (после исчерпания — ${povtorov}).`,
);
