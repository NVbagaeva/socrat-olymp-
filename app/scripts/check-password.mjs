#!/usr/bin/env node
/* scripts/check-password.mjs — слишком простые пароли (src/lib/auth/password.ts).

   Запуск: pnpm test:password (сборка не нужна). */

import { requireSrc } from './lib/load-ts.mjs';

const { passwordProblem } = requireSrc('lib/auth/password.ts');

const SLUCHAI = [
  ['1234567', '', 'short'],
  ['12345678', '', 'simple'],
  ['87654321', '', 'simple'],
  ['qwertyui', '', 'simple'],
  ['йцукенгш', '', 'simple'],
  ['aaaaaaaa', '', 'simple'],
  ['abababab', '', 'simple'],
  ['12341234', '', 'simple'],
  ['Password123', '', 'simple'],
  ['QWERTY123', '', 'simple'],
  ['ivanov2010', 'ivanov@yandex.ru', 'simple'],
  ['mashamasha', '', 'simple'],
  ['кот-в-сапогах-7', '', null],
  ['zelenyy slon 42', '', null],
  ['Matematika2027!', 'ivanov@yandex.ru', null],
  ['ракета91лето', '', null],
  ['ivan2010x', 'iv@yandex.ru', null],
];

const failures = [];
for (const [parol, pochta, nado] of SLUCHAI) {
  const est = passwordProblem(parol, pochta);
  if (est !== nado) failures.push(`«${parol}»: ждали ${nado}, получили ${est}`);
}
if (failures.length > 0) {
  console.error('Простые пароли: есть ошибки\n' + failures.map((f) => `  - ${f}`).join('\n'));
  process.exit(1);
}
console.log(`Простые пароли: все ${SLUCHAI.length} случаев как надо.`);
