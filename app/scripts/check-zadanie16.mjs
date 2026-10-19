#!/usr/bin/env node
/* scripts/check-zadanie16.mjs — автотест каркаса задания №16 (неравенства).

   Запуск: pnpm test:zadanie16

   Проверяется:
     — разбор ответа-множества (lib/zadanie16/otvet.ts): промежутки,
       точки, бесконечности, дроби и корни, склейка соседних
       промежутков, «нет решений», ошибки записи;
     — знаки метода интервалов по кратности корней и штриховка
       (lib/zadanie16/chertezh.ts), выколотые нули знаменателя;
     — геометрия чертежей: точки по порядку, знаков на один больше,
       чем точек, кривая параболы в пределах рисунка;
     — чертежи витрины показывают ровно записанный ответ;
     — данные глав (content/teoriya16.ts): id уникальны, в работе
       не больше десяти заданий, каждый ответ разбирается, формулы
       условий набираются KaTeX в строгом режиме.

   Ненулевой код возврата — есть проблемы, они печатаются списком. */

import { createRequire } from 'node:module';
import { requireSrc } from './lib/load-ts.mjs';

const require = createRequire(import.meta.url);
const katex = require('katex');
const O = requireSrc('lib/zadanie16/otvet.ts');
const C = requireSrc('lib/zadanie16/chertezh.ts');
const P = requireSrc('lib/zadanie16/primery.ts');
const T = requireSrc('content/teoriya16.ts');

const problems = [];
let checks = 0;
const ok = (cond, what) => {
  checks += 1;
  if (!cond) problems.push(what);
};

/* ── Разбор ответа ──────────────────────────────────────── */

const verno = [
  ['(-∞; -3] ∪ (2; 5)', '(-\\infty;\\,-3]\\cup(2;\\,5)'],
  ['(-беск;-3]U(2;5)', '(-\\infty;\\,-3]\\cup(2;\\,5)'],
  ['(−inf; −3] u (2; 5)', '(-\\infty;-3]\\cup(2;5)'],
  ['[1;2] ∪ (2;3)', '[1;3)'],
  ['(0,5; 7/2)', '(\\frac{1}{2};\\,3.5)'],
  ['(0.5, 3.5)', '(\\frac{1}{2};\\,\\frac{7}{2})'],
  ['(-√2; √2)', '(-\\sqrt{2};\\,\\sqrt{2})'],
  ['(-sqrt(2);2sqrt(2)]', '(-\\sqrt{2};\\,2\\sqrt{2}]'],
  ['{1} ∪ [4; +∞)', '\\{1\\}\\cup[4;\\,+\\infty)'],
  ['[4;+∞) ∪ {1}', '\\{1\\}\\cup[4;\\,+\\infty)'],
  ['1; 4', '\\{1;\\,4\\}'],
  ['нет решений', '\\varnothing'],
  ['∅', '\\varnothing'],
  ['R', '(-\\infty;\\,+\\infty)'],
  ['x ∈ (-∞; +∞)', '(-\\infty;\\,+\\infty)'],
  ['(-∞;1)∪(1;+∞)', '(-\\infty;\\,1)\\cup(1;\\,+\\infty)'],
  ['[2; 5]', '[2;\\,5]'],
];
for (const [u, e] of verno) {
  ok(
    O.proverit16(u, e) === 'verno',
    `«${u}» должно совпасть с ${e}: ${JSON.stringify(O.proverit16(u, e))}`,
  );
}

const neverno = [
  ['(-∞; -3) ∪ (2; 5)', '(-\\infty;\\,-3]\\cup(2;\\,5)'],
  ['(1;3)', '[1;3)'],
  ['(-∞;1)∪(1;+∞)', '(-\\infty;\\,+\\infty)'],
  ['[2;5]', '[2;\\,6]'],
  ['∅', '\\{0\\}'],
];
for (const [u, e] of neverno) {
  ok(O.proverit16(u, e) === 'neverno', `«${u}» не должно совпасть с ${e}`);
}

for (const u of ['', '(1;', '[-∞; 2)', '(5; 1)', '(1;2;3)', 'абв']) {
  const r = O.proverit16(u, '[2;\\,5]');
  ok(
    typeof r === 'object' && typeof r.oshibka === 'string',
    `«${u}» — ошибка записи, а не ${JSON.stringify(r)}`,
  );
}

/* ── Метод интервалов ───────────────────────────────────── */

const z = C.znakiPoKratnosti([{ x: -3 }, { x: 1, kratnost: 2 }, { x: 4 }], '+');
ok(z.join('') === '+--+', `знаки по кратности: ${z.join('')} вместо +--+`);
const z3 = C.znakiPoKratnosti([{ x: 0, kratnost: 3 }], '+');
ok(z3.join('') === '-+', `кратность 3 меняет знак: ${z3.join('')}`);

const drob = C.metodIntervalov16({
  korni: [
    { x: 2, tex: '2' },
    { x: -5, tex: '-5', znamenatel: true },
  ],
  sprava: '+',
  znak: '<=',
});
ok(
  drob.tochki[0].x === -5 && !drob.tochki[0].zakrashena,
  'нуль знаменателя выколот и отсортирован',
);
ok(drob.tochki[1].zakrashena, 'нуль числителя в нестрогом неравенстве закрашен');

/* ── Геометрия ──────────────────────────────────────────── */

for (const p of P.PRIMERY_CHERTEZHEY_16) {
  let g;
  try {
    g = C.geom16(p.spec);
  } catch (e) {
    problems.push(`${p.id}: ${e.message}`);
    continue;
  }
  const xs = g.tochki.map((t) => t.cx);
  ok(
    xs.every((x, i) => i === 0 || x > xs[i - 1]),
    `${p.id}: точки не по порядку`,
  );
  ok(
    xs.every((x) => x > 0 && x < g.w),
    `${p.id}: точка за краем рисунка`,
  );
  ok(
    g.shtrikh.every((s) => s.x1 < s.x2),
    `${p.id}: пустая штриховка`,
  );
  if (g.krivaya !== undefined) {
    const nums = g.krivaya.match(/-?\d+(?:\.\d+)?/g).map(Number);
    const ys = nums.filter((_, i) => i % 2 === 1);
    ok(
      ys
        .slice(0, 1)
        .concat(ys.slice(-1))
        .every((y) => y >= 0 && y <= g.h),
      `${p.id}: концы ветвей за краем`,
    );
  }
  for (const t of g.tochki) {
    try {
      katex.renderToString(t.tex, { throwOnError: true, strict: 'error' });
    } catch (e) {
      problems.push(`${p.id}: подпись ${t.tex} — ${e.message}`);
    }
  }
  if (p.otvet !== undefined && p.spec.vid === 'pryamaya') {
    const e = O.razobrat16(p.otvet);
    ok(
      e.ok && O.ravny16(C.otvetPryamoy16(p.spec), e.mnozhestvo),
      `${p.id}: чертёж не совпадает с ответом ${p.otvet}`,
    );
  }
}

let bylaOshibka = false;
try {
  C.geomPryamoy({ vid: 'pryamaya', tochki: [{ x: 1, tex: '1', zakrashena: true }], znaki: ['+'] });
} catch {
  bylaOshibka = true;
}
ok(bylaOshibka, 'лишний или недостающий знак — ошибка');

/* ── Данные глав ────────────────────────────────────────── */

const ids = new Set();
const id = (v, gde) => {
  ok(!ids.has(v), `повторный id ${v} (${gde})`);
  ids.add(v);
};
const strogo = (text, gde) => {
  for (const [, f] of String(text).matchAll(/\$([^$]+)\$/g)) {
    try {
      katex.renderToString(f, { throwOnError: true, strict: 'error' });
    } catch (e) {
      problems.push(`${gde}: ${f} — ${e.message}`);
    }
  }
};

ok(T.GLAVY_16.length === 7, `глав ${T.GLAVY_16.length} вместо 7`);
T.GLAVY_16.forEach((g, i) => {
  id(g.id, 'глава');
  const punkty = T.punktyGlavy16(g, i + 1);
  punkty.forEach((p) => id(p.id, `пункт ${p.no}`));
  ok(
    punkty.every((p, k) => p.no === `${i + 1}.${k + 1}`),
    `${g.id}: номера пунктов не по порядку`,
  );
  if (g.skoro) {
    ok((g.temy ?? []).length > 0, `${g.id}: у главы «Скоро» нет тем`);
    return;
  }
  ok(
    punkty.some((p) => p.vid === 'opornye') && punkty.some((p) => p.vid === 'raboty'),
    `${g.id}: нет блока опорных задач или работы`,
  );
  for (const t of g.teoriya) {
    for (const k of t.kartochki) {
      strogo(k.title, `${t.id}`);
      strogo(k.text ?? '', `${t.id}`);
      if (k.chertezh) C.geom16(k.chertezh);
    }
  }
  for (const o of g.opornye) {
    id(o.id, 'опорная');
    strogo(o.uslovie, o.id);
    o.shagi.forEach((s) => strogo(s, o.id));
    ok(O.razobrat16(o.otvet).ok, `${o.id}: ответ ${o.otvet} не разбирается`);
  }
  for (const r of g.raboty) {
    id(r.id, 'работа');
    ok(
      r.zadaniya.length <= T.ZADANIY_V_RABOTE,
      `${r.id}: заданий ${r.zadaniya.length} > ${T.ZADANIY_V_RABOTE}`,
    );
    for (const zd of r.zadaniya) {
      id(zd.id, r.id);
      strogo(zd.uslovie, zd.id);
      ok(O.razobrat16(zd.otvet).ok, `${zd.id}: ответ ${zd.otvet} не разбирается`);
      katex.renderToString(zd.otvet, { throwOnError: true, strict: 'error' });
    }
  }
});
for (const zd of P.PROBNAYA_RABOTA_16) {
  strogo(zd.uslovie, zd.id);
  ok(O.razobrat16(zd.otvet).ok, `витрина ${zd.id}: ответ не разбирается`);
}

if (problems.length > 0) {
  console.error(`Задание №16: ${problems.length} проблем из ${checks} проверок:`);
  for (const p of problems) console.error(`  — ${p}`);
  process.exit(1);
}
console.log(`Задание №16: ${checks} проверок, всё в порядке.`);
