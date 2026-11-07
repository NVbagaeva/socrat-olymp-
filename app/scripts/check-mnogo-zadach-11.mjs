#!/usr/bin/env node
/* scripts/check-mnogo-zadach-11.mjs — лист №11 на много задач.

   Запуск: node scripts/check-mnogo-zadach-11.mjs

   Для 1, 6, 15, 25, 40 задач и каждого источника («банк + новые»,
   «только банк», «только новые»), с 1 и 3 вариантами: на листе ровно
   столько задач, сколько выбрано (у «только банка» — сколько есть в
   банке, и тогда есть сообщение), условия внутри листа не повторяются.
   Ненулевой код — есть проблемы. */

import { requireSrc } from './lib/load-ts.mjs';

const { sobratList } = requireSrc('lib/zadanie11/sheet11');
const { dannyeTrenazhera } = requireSrc('lib/zadanie11/trenazher/dannye');
const bank = dannyeTrenazhera().bank;

const problems = [];
/* Один тип, все типы раздела, разные разделы. */
const sostavy = {
  'один подтип': (n) => [{ id: 'VD-05', n }],
  смешанный: (n) => {
    const ids = ['PR-04', 'SM-04', 'DP-07', 'PT-02', 'VD-05', 'OK-01', 'RB-01', 'PG-01'];
    return ids
      .map((id, i) => ({ id, n: Math.floor(n / ids.length) + (i < n % ids.length ? 1 : 0) }))
      .filter((x) => x.n > 0);
  },
};
for (const [imya, f] of Object.entries(sostavy)) {
  for (const n of [1, 6, 15, 25, 40]) {
    for (const istochnik of ['mix', 'bank', 'new']) {
      for (const variants of [1, 3]) {
        const p = {
          rezhim: imya === 'один подтип' ? 'otrabotka' : 'komplekt',
          istochnik,
          sostav: f(n),
          variants,
          seed: `t${n}`,
          zameny: {},
          marshrut: 1,
          theme: 'color',
          poKlyucham: true,
        };
        const list = sobratList(p, bank);
        const vse = list.poVariantam.flat();
        const ozhid = n * variants;
        const est = vse.length;
        const tag = `${imya}, ${n} задач, ${istochnik}, вариантов ${variants}`;
        if (istochnik === 'bank') {
          if (est + list.nehvatka !== ozhid)
            problems.push(`${tag}: на листе ${est}, нехватка ${list.nehvatka}, ждали ${ozhid}`);
          if (vse.some((z) => z.poz.vid !== 'bank'))
            problems.push(`${tag}: в «только банке» есть не банковские задачи`);
        } else if (est !== ozhid) problems.push(`${tag}: на листе ${est}, ждали ${ozhid}`);
        const uslovia = vse.map((z) => z.questionHtml);
        const povtory = uslovia.length - new Set(uslovia).size;
        if (povtory > 0) problems.push(`${tag}: повторов условий ${povtory}`);
        if (variants === 1)
          console.log(
            `${tag}: ${est} задач${list.nehvatka ? `, в банке не хватило ${list.nehvatka}` : ''}`,
          );
      }
    }
  }
}
if (problems.length > 0) {
  console.error(`\nПроблемы (${problems.length}):\n` + problems.join('\n'));
  process.exit(1);
}
console.log('\nОК: число задач и без повторов.');
