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

/* ── Пересечение ────────────────────────────────────────── */

const mn = (t) => {
  const r = O.razobrat16(t);
  if (!r.ok) throw new Error(`${t}: ${r.oshibka}`);
  return r.mnozhestvo;
};
const per = [
  ['(-3;+∞)', '(-∞;2]', '(-3;2]'],
  ['[1;5]', '[5;7)', '{5}'],
  ['(1;5)', '[5;7)', '∅'],
  ['(-∞;0)∪(0;+∞)', '(-3;2]', '(-3;0)∪(0;2]'],
  ['[-1;4]', '(-∞;-1]∪[3;+∞)', '{-1}∪[3;4]'],
];
for (const [a, b, c] of per) {
  ok(O.ravny16(O.peresechenie16(mn(a), mn(b)), mn(c)), `пересечение ${a} и ${b} должно быть ${c}`);
}

/* ── Геометрия ──────────────────────────────────────────── */

const svgChisla = (d) => d.match(/-?\d+(?:\.\d+)?/g).map(Number);

for (const p of P.PRIMERY_CHERTEZHEY_16) {
  let g;
  try {
    g = C.geom16(p.spec);
  } catch (e) {
    problems.push(`${p.id}: ${e.message}`);
    continue;
  }
  for (const r of g.ryady) {
    const xs = r.tochki.map((t) => t.cx);
    ok(
      xs.every((x, i) => i === 0 || x > xs[i - 1]),
      `${p.id}: точки не по порядку`,
    );
    ok(
      xs.every((x) => x > 0 && x < g.w),
      `${p.id}: точка за краем рисунка`,
    );
    ok(
      r.shtrikh.every((s) => s.x1 < s.x2),
      `${p.id}: пустая штриховка`,
    );
  }
  /* Подписи: внутри рисунка и не налезают друг на друга. */
  g.podpisi.forEach((a, i) => {
    ok(
      a.ramka.x1 >= 0 && a.ramka.x2 <= g.w && a.ramka.y1 >= 0 && a.ramka.y2 <= g.h,
      `${p.id}: подпись ${a.tex} за краем`,
    );
    g.podpisi.slice(i + 1).forEach((b) => {
      ok(!C.peresekayutsya16(a.ramka, b.ramka), `${p.id}: подписи ${a.tex} и ${b.tex} налезают`);
    });
    try {
      katex.renderToString(a.tex, { throwOnError: true, strict: 'error' });
    } catch (e) {
      problems.push(`${p.id}: подпись ${a.tex} — ${e.message}`);
    }
  });
  /* Подписи чисел не залезают на кружки точек своей прямой. */
  for (const r of g.ryady) {
    for (const t of r.tochki) {
      const kr = { x1: t.cx - 7, x2: t.cx + 7, y1: r.osY - 7, y2: r.osY + 7 };
      ok(!g.podpisi.some((q) => C.peresekayutsya16(q.ramka, kr)), `${p.id}: подпись на точке`);
    }
  }
  if (g.krivaya !== undefined) {
    const ys = svgChisla(g.krivaya).filter((_, i) => i % 2 === 1);
    ok(
      [ys[0], ys[ys.length - 1]].every((y) => y >= 0 && y <= g.h),
      `${p.id}: концы ветвей за краем`,
    );
  }
  if (p.otvet !== undefined && p.spec.vid === 'pryamaya') {
    ok(
      O.ravny16(C.otvetPryamoy16(p.spec), mn(p.otvet)),
      `${p.id}: чертёж не совпадает с ответом ${p.otvet}`,
    );
  }
  if (p.otvet !== undefined && p.spec.vid === 'sistema') {
    ok(
      O.ravny16(C.reshenieSistemy16(p.spec), mn(p.otvet)),
      `${p.id}: пересечение не совпадает с ответом ${p.otvet}`,
    );
    ok(
      g.ryady.length === p.spec.ryady.length + 1 && g.ryady.at(-1).itog,
      `${p.id}: нет прямой пересечения`,
    );
  }
}

/* Парабола (x−5)²>0 с осью Oy: ось при x = 0 левее вершины, вершина на Ox. */
{
  const spec = P.PRIMERY_CHERTEZHEY_16.find((x) => x.id === 'parabola-oy').spec;
  const g = C.geom16(spec);
  const [, y0, qx, , , y2] = svgChisla(g.krivaya);
  const vershinaX = qx;
  ok(g.oy !== undefined && g.oy.x < vershinaX - 40, 'Oy должна стоять левее вершины в точке 5');
  ok(Math.abs(g.ryady[0].tochki[0].cx - vershinaX) < 1e-6, 'вершина параболы — в точке 5 на оси');
  ok(!g.ryady[0].tochki[0].zakrashena, 'точка 5 выколота');
  ok(y0 < g.ryady[0].osY && y2 < g.ryady[0].osY, 'ветви вверх: концы ветвей над осью Ox');
  ok(
    g.podpisi.some((q) => q.tex === '0') && g.podpisi.some((q) => q.tex === 'y'),
    'подписи 0 и y у оси Oy',
  );
}
{
  const g = C.geom16(P.PRIMERY_CHERTEZHEY_16.find((x) => x.id === 'tesno').spec);
  const chisla = g.podpisi.filter((q) => q.vid === 'chislo');
  ok(new Set(chisla.map((q) => q.ramka.y1)).size > 1, 'тесные подписи уходят строкой ниже');
  const n = C.geom16(P.PRIMERY_CHERTEZHEY_16.find((x) => x.id === 'parabola-oy-ryadom').spec);
  const nol = n.podpisi.find((q) => q.tex === '0');
  ok(nol && nol.ramka.x2 < n.oy.x, 'нуль в начале координат подписан левее оси Oy');
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
  for (const [, f] of String(text ?? '').matchAll(/\$([^$]+)\$/g)) {
    try {
      katex.renderToString(f, { throwOnError: true, strict: 'error' });
    } catch (e) {
      problems.push(`${gde}: ${f} — ${e.message}`);
    }
  }
};
const chertezh = (ch, gde) => {
  try {
    const g = C.geom16(ch);
    g.podpisi.forEach((a, i) =>
      g.podpisi.slice(i + 1).forEach((b) => {
        ok(!C.peresekayutsya16(a.ramka, b.ramka), `${gde}: подписи ${a.tex} и ${b.tex} налезают`);
      }),
    );
  } catch (e) {
    problems.push(`${gde}: ${e.message}`);
  }
};
const otvet = (t, gde) => {
  ok(O.razobrat16(t).ok, `${gde}: ответ ${t} не разбирается`);
  ok(!/\d,\d/.test(t.replace(/\{,\}/g, '')), `${gde}: в ответе разделитель — запятая, нужна «;»`);
  ok(/\\infty|;|\\varnothing|\\\{/.test(t), `${gde}: концы промежутка через «;»`);
  katex.renderToString(`x\\in${t}`, { throwOnError: true, strict: 'error' });
};

ok(T.GLAVY_16.length === 11, `глав ${T.GLAVY_16.length} вместо 11 (6 открытых и 5 «Скоро»)`);
ok(T.GLAVY_16.filter((g) => g.skoro).length === 5, 'глав «Скоро» должно быть пять');
ok(
  T.BLOKI_16.razbor === 'Разбор' && T.BLOKI_16.rabota === 'Тренировочная работа (10 заданий)',
  'подписи вкладок главы',
);
T.GLAVY_16.forEach((g, i) => {
  id(g.id, 'глава');
  const punkty = T.punktyGlavy16(g, i + 1);
  punkty.forEach((p, k) => {
    id(p.id, `пункт ${p.no}`);
    ok(p.no === `${i + 1}.${k + 1}`, `${g.id}: номера пунктов не по порядку`);
  });
  if (g.skoro) {
    ok(g.teoriya.length === 0 && g.raboty.length === 0, `${g.id}: у главы «Скоро» нет содержания`);
    return;
  }
  ok(g.teoriya.length > 0 && g.raboty.length > 0, `${g.id}: нет пунктов теории или работы`);
  for (const t of g.teoriya) {
    for (const k of t.kartochki) {
      const gde = `${t.id} / ${k.metka ?? k.ton}`;
      [k.title, k.text, k.podpis, k.itog, ...(k.shagi ?? [])].forEach((x) => strogo(x, gde));
      for (const pl of k.plitki ?? []) {
        katex.renderToString(pl.tex, { throwOnError: true, strict: 'error' });
        strogo(pl.text, gde);
      }
      if (k.tex)
        katex.renderToString(k.tex, { throwOnError: true, strict: 'error', displayMode: true });
      if (k.chertezh) chertezh(k.chertezh, gde);
      if (k.otvet) otvet(k.otvet, gde);
      for (const v of k.sravnenie ? [k.sravnenie.neverno, k.sravnenie.verno] : []) {
        strogo(v.title, gde);
        strogo(v.text, gde);
        if (v.chertezh) chertezh(v.chertezh, gde);
        if (v.otvet) otvet(v.otvet, gde);
      }
      /* Ответ примера совпадает с тем, что показывает его чертёж. */
      if (k.otvet && k.chertezh?.vid === 'pryamaya') {
        ok(
          O.ravny16(C.otvetPryamoy16(k.chertezh), mn(k.otvet)),
          `${gde}: чертёж не сходится с ответом`,
        );
      }
      if (k.otvet && k.chertezh?.vid === 'sistema') {
        ok(
          O.ravny16(C.reshenieSistemy16(k.chertezh), mn(k.otvet)),
          `${gde}: пересечение не сходится с ответом`,
        );
      }
      if (k.sravnenie?.verno.chertezh?.vid === 'pryamaya' && k.sravnenie.verno.otvet) {
        ok(
          O.ravny16(C.otvetPryamoy16(k.sravnenie.verno.chertezh), mn(k.sravnenie.verno.otvet)),
          `${gde}: верный вариант не сходится с чертежом`,
        );
        ok(
          !O.ravny16(mn(k.sravnenie.neverno.otvet), mn(k.sravnenie.verno.otvet)),
          `${gde}: неверный и верный ответы совпадают`,
        );
      }
    }
  }
  for (const o of g.opornye) {
    id(o.id, 'разбор');
    strogo(o.uslovie, o.id);
    o.shagi.forEach((s) => strogo(s, o.id));
    otvet(o.otvet, o.id);
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
      otvet(zd.otvet, zd.id);
    }
  }
});

/* Исправления макета: кратность нуля и ограничения tg/ctg. */
{
  const kartochki = T.GLAVY_16.flatMap((g) => g.teoriya.flatMap((t) => t.kartochki));
  const kr = kartochki.find((k) => k.title === 'Кратность нуля');
  ok(
    kr && /\(x-3\)\(2x-6\)>0/.test(kr.tex) && /2\(x-3\)\^2>0/.test(kr.tex),
    'кратность нуля: (x−3)(2x−6)>0 → 2(x−3)²>0',
  );
  ok(
    kr && kr.chertezh.znaki.join('') === '++' && !kr.chertezh.tochki[0].zakrashena,
    'кратность нуля: «+» с обеих сторон, точка 3 выколота',
  );
  const odz = kartochki.find((k) => k.ton === 'ogranicheniya');
  const tg = odz?.plitki.find((p) => p.tex.includes('tg'));
  ok(
    tg &&
      tg.text.includes('\\dfrac{\\pi}{2}+\\pi n') &&
      tg.text.includes('x\\ne\\pi n') &&
      tg.text.includes('\\mathbb{Z}'),
    'tg и ctg: x ≠ π/2 + πn и x ≠ πn, n ∈ ℤ',
  );
  const vyvod = kartochki.find((k) => k.ton === 'vyvod');
  ok(
    vyvod && /стандартному виду/.test(vyvod.shagi[0]) && /до конца/.test(vyvod.shagi[0]),
    'вывод: первый шаг — стандартный вид',
  );
  const osh = kartochki.find((k) => k.ton === 'oshibka');
  ok(
    osh?.sravnenie?.neverno.chertezh.znaki.join('') === '+-+',
    'частая ошибка: неверное чередование + − +',
  );
}

for (const zd of P.PROBNAYA_RABOTA_16) {
  strogo(zd.uslovie, zd.id);
  otvet(zd.otvet, `витрина ${zd.id}`);
}

if (problems.length > 0) {
  console.error(`Задание №16: ${problems.length} проблем из ${checks} проверок:`);
  for (const p of problems) console.error(`  — ${p}`);
  process.exit(1);
}
console.log(`Задание №16: ${checks} проверок, всё в порядке.`);
