#!/usr/bin/env node
/* scripts/check-zadanie14.mjs — автотест задания №14 (уравнения).

   Запуск: pnpm test:zadanie14

   Проверяется:
     — ядро (lib/zadanie14/ugol.ts, proverka.ts): корни на промежутке,
       равносильные записи серий засчитываются, неверные — нет;
     — каждая задача опорных блоков и банка тренажёра:
         · каждая серия обращает уравнение в ноль (и входит в ОДЗ);
         · других корней на [−2π; 2π] нет: численный поиск минимумов
           |f| — каждый найденный ноль лежит в сериях;
         · у задачи с пунктом б есть хотя бы один корень на промежутке;
         · формулы условия, решения и подсказок набираются KaTeX
           в строгом режиме, кнопки подсказок различны, верная — есть;
     — блоки: 15 блоков по 10 задач, id уникальны на весь раздел;
     — окружности (lib/zadanie14/krug.ts): подписи не пересекаются
       и не лежат на линии окружности — на рисунках всех задач.

   Ненулевой код возврата — есть проблемы, они печатаются списком. */

import { createRequire } from 'node:module';
import { requireSrc } from './lib/load-ts.mjs';

const require = createRequire(import.meta.url);
const katex = require('katex');
requireSrc('lib/graph/katex-makrosy.js').podklyuchitMakrosy(katex);
const U = requireSrc('lib/zadanie14/ugol.ts');
const P = requireSrc('lib/zadanie14/proverka.ts');
const K = requireSrc('lib/zadanie14/krug.ts');
const H = requireSrc('lib/zadanie14/krugHtml.ts');
const O = requireSrc('lib/zadanie14/otbor.ts');
const B = requireSrc('lib/zadanie14/dannye.ts');
const TE = requireSrc('content/teoriya14.ts');

const problems = [];
let checks = 0;
const ok = (cond, what) => {
  checks += 1;
  if (!cond) problems.push(what);
};

/* ── Ядро ───────────────────────────────────────────────── */
{
  const et = [U.s(U.u(1, 6)), U.s(U.u(5, 6))];
  ok(
    P.proveritSerii(['(-1)^{k}\\frac{\\pi}{6}+\\pi k'], et).itog === 'verno',
    'ядро: (−1)^k не засчитана',
  );
  ok(
    P.proveritSerii(['\\frac{\\pi}{6}+2\\pi n', '\\frac{5\\pi}{6}+2\\pi n'], et).itog === 'verno',
    'ядро: пара серий не засчитана',
  );
  ok(
    P.proveritSerii(['\\frac{\\pi}{6}+2\\pi k'], et).itog === 'neverno',
    'ядро: потеря серии засчитана',
  );
  ok(
    P.proveritSerii(['\\frac{\\pi}{6}+\\pi k'], et).itog === 'neverno',
    'ядро: лишние корни засчитаны',
  );
  const et2 = [U.s(U.u(1, 4), 1, 2)];
  ok(
    P.proveritSerii(['\\frac{\\pi}{4}+\\frac{\\pi k}{2}'], et2).itog === 'verno' &&
      P.proveritSerii(['\\pm\\frac{\\pi}{4}+\\pi k'], et2).itog === 'verno',
    'ядро: серия с шагом π/2 и запись ± не совпали',
  );
  const k = U.korniNaPromezhutke([U.s(U.u(0), 1)], {
    ot: U.u(-5, 2),
    do: U.u(-1),
    vkl: [true, false],
  });
  ok(k.length === 1 && U.ugolTex(k[0]) === '-2\\pi', 'ядро: полуоткрытый промежуток взял конец');
  ok(P.proveritKorni('-2\\pi', k).itog === 'verno', 'ядро: ответ б не засчитан');
  ok(P.proveritKorni('-\\pi;-2\\pi', k).itog === 'neverno', 'ядро: лишний корень засчитан');
  {
    const kk = U.korniNaPromezhutke([U.s(U.u(1, 2), 1)], U.otrezok(U.u(0), U.u(2)));
    ok(P.proveritKorni('\\frac{\\pi}{2};\\ \\frac{3\\pi}{2}', kk).itog === 'verno', 'ядро: ответ б, начинающийся с \\frac, не прочитан');
    ok(P.proveritKorni('\\dfrac{3\\pi}{2};\\,\\dfrac{\\pi}{2}', kk).itog === 'verno', 'ядро: ответ б с пробелом TeX после «;» не прочитан');
  }
}

/* ── Формулы ─────────────────────────────────────────────── */
function texOk(tex, where) {
  try {
    katex.renderToString(tex, { throwOnError: true, strict: 'error' });
    return true;
  } catch (e) {
    problems.push(`${where}: KaTeX — ${String(e.message).slice(0, 140)}`);
    return false;
  }
}
function strokaOk(s, where) {
  checks += 1;
  if (typeof s !== 'string' || s.trim() === '') {
    problems.push(`${where}: пустая строка`);
    return;
  }
  const kuski = s.split('$');
  if (kuski.length % 2 === 0) {
    problems.push(`${where}: непарный $`);
    return;
  }
  kuski.forEach((k, i) => {
    if (i % 2 === 1) texOk(k, where);
    else if (/\\[a-zA-Z]|\^|_\{/.test(k))
      problems.push(`${where}: TeX вне долларов «${k.slice(0, 40)}»`);
  });
}

/* ── Корни уравнения ─────────────────────────────────────── */
const LO = -2 * Math.PI;
const HI = 2 * Math.PI;
function nuliF(f, odz) {
  const N = 40000;
  const h = (HI - LO) / N;
  const out = [];
  const g = (x) => {
    if (odz && !odz(x)) return Infinity;
    const v = Math.abs(f(x));
    return Number.isFinite(v) ? v : Infinity;
  };
  let prev = g(LO - h);
  let cur = g(LO);
  for (let i = 1; i <= N + 1; i += 1) {
    const x = LO + i * h;
    const next = g(x);
    const xc = x - h;
    if (cur <= prev && cur <= next && cur < 0.05) {
      /* Уточняем золотым сечением на [xc − h; xc + h]. */
      let a = xc - h;
      let b = xc + h;
      for (let j = 0; j < 80; j += 1) {
        const m1 = a + (b - a) * 0.382;
        const m2 = a + (b - a) * 0.618;
        if (g(m1) < g(m2)) b = m2;
        else a = m1;
      }
      const xm = (a + b) / 2;
      if (g(xm) < 1e-7) out.push(xm);
    }
    prev = cur;
    cur = next;
  }
  return U.unikalnye(out, 1e-5);
}

function proveritZadachu(z, gde) {
  if (z.vid === 'razminka') {
    for (const sr of z.serii) {
      for (let k = -3; k <= 3; k += 1) {
        const x = sr.x0 + sr.h * k;
        checks += 1;
        if (Math.abs(z.f(x)) > 1e-7) problems.push(`${gde}: серия ${sr.tex} при k=${k} не корень`);
      }
    }
    const vse = [];
    for (const sr of z.serii) for (let k = -50; k <= 50; k += 1) vse.push(sr.x0 + sr.h * k);
    const pol = vse.filter((x) => x > 1e-9).sort((a, b) => a - b);
    const otr = vse.filter((x) => x < -1e-9).sort((a, b) => b - a);
    const nado = z.vopros === 'min-pol' ? pol[0] : otr[0];
    ok(Math.abs(nado - z.otvet) < 1e-9, `${gde}: ответ ${z.otvet}, а по сериям ${nado}`);
  } else {
    for (const sr of z.serii) {
      for (let k = -3; k <= 3; k += 1) {
        const x = U.znach(U.sdvig(sr.nach, U.mul(sr.shag, U.q(k))));
        checks += 1;
        const v = z.f(x);
        if (!(Math.abs(v) < 1e-7) || (z.odz && !z.odz(x))) {
          problems.push(`${gde}: x=${U.seriyaTex(sr)} при k=${k} — f=${v}`);
          break;
        }
      }
    }
    const et = U.chislaSeriy(z.serii, LO - 1e-9, HI + 1e-9);
    for (const x of nuliF(z.f, z.odz)) {
      checks += 1;
      if (!et.some((y) => Math.abs(x - y) < 1e-4)) {
        problems.push(
          `${gde}: корень x≈${x.toFixed(5)} (${(x / Math.PI).toFixed(4)}π) не входит в серии`,
        );
      }
    }
    if (z.promezhutok) {
      const L = (U.znach(z.promezhutok.do) - U.znach(z.promezhutok.ot)) / Math.PI;
      ok(L <= 3 + 1e-9, `${gde}: промежуток длиннее 3π — больше двух окружностей`);
      const n = U.korniNaPromezhutke(z.serii, z.promezhutok).length;
      const CHISLA = {
        Ни: 0,
        Один: 1,
        Одна: 1,
        Два: 2,
        Две: 2,
        Три: 3,
        Четыре: 4,
        Пять: 5,
        Шесть: 6,
      };
      z.podskazki.forEach((h, i) => {
        if (!/Сколько.*корн/.test(h.question)) return;
        const t = h.options[h.correct] ?? '';
        const slovo = Object.keys(CHISLA).find((w) => t.startsWith(w));
        const m = /\$(\d+)\$/.exec(t);
        const chislo = slovo !== undefined ? CHISLA[slovo] : m ? Number(m[1]) : null;
        if (chislo !== null)
          ok(
            chislo === n,
            `${gde}: подсказка ${i + 1} говорит «${t}», а корней на промежутке ${n}`,
          );
      });
    }
    if (z.promezhutok) {
      const korni = U.korniNaPromezhutke(z.serii, z.promezhutok);
      ok(korni.length > 0, `${gde}: на промежутке нет корней`);
      if (z.otbor === 'nerav') {
        try {
          O.otborNerav(z.serii, z.promezhutok).forEach((s, i) =>
            strokaOk(s, `${gde}: отбор ${i + 1}`),
          );
        } catch (e) {
          problems.push(`${gde}: отбор неравенством — ${e.message}`);
        }
      }
      for (const spec of H.krugiOtbora(z.serii, z.promezhutok))
        proveritKrug(spec, `${gde}: окружность б`);
    }
    proveritKrug(H.krugSerii(z.serii), `${gde}: окружность а`);
    if (z.zapisA) {
      const it = P.proveritSerii(z.zapisA, z.serii);
      ok(it.itog === 'verno', `${gde}: своя запись ответа а не совпадает с сериями`);
      z.zapisA.forEach((t, i) => texOk(t, `${gde}: запись а ${i + 1}`));
    }
    texOk(U.otvetATex(z.serii), `${gde}: ответ а`);
  }
  texOk(z.uravnenie, `${gde}: уравнение`);
  z.reshenie.forEach((s, i) => strokaOk(s, `${gde}: решение ${i + 1}`));
  ok(z.reshenie.length >= 2, `${gde}: решение короче двух шагов`);
  z.podskazki.forEach((h, i) => {
    strokaOk(h.question, `${gde}: подсказка ${i + 1}`);
    h.options.forEach((o, j) => strokaOk(o, `${gde}: подсказка ${i + 1}, кнопка ${j + 1}`));
    ok(
      new Set(h.options).size === h.options.length,
      `${gde}: подсказка ${i + 1} — одинаковые кнопки`,
    );
    ok(
      h.correct >= 0 && h.correct < h.options.length,
      `${gde}: подсказка ${i + 1} — нет верной кнопки`,
    );
    if (h.comment) strokaOk(h.comment, `${gde}: подсказка ${i + 1}, отклик`);
  });
}

function proveritKrug(spec, gde) {
  const g = K.geomKruga(spec);
  g.podpisi.forEach((p, i) => {
    checks += 1;
    if (p.vid !== 'os' && K.naLiniiKruga(p.ramka, 0))
      problems.push(`${gde}: подпись «${p.tex}» на линии окружности`);
    g.podpisi.slice(i + 1).forEach((q2) => {
      checks += 1;
      if (K.peresekayutsya(p.ramka, q2.ramka, 0))
        problems.push(`${gde}: подписи «${p.tex}» и «${q2.tex}» пересекаются`);
    });
  });
}

/* ── Данные раздела ─────────────────────────────────────── */
const ids = new Set();
const id = (x, gde) => {
  ok(!ids.has(x), `${gde}: повтор id ${x}`);
  ids.add(x);
};
ok(B.BLOKI_14.length === 15, `блоков ${B.BLOKI_14.length}, а не 15`);
for (const b of B.BLOKI_14) {
  ok(b.zadachi.length === 10, `блок ${b.no} «${b.nazvanie}»: задач ${b.zadachi.length}, а не 10`);
  ok(!b.opisanie.includes('$'), `блок ${b.no}: формула на карточке`);
  strokaOk(b.zapomni, `блок ${b.no}: запомни`);
  strokaOk(b.primer, `блок ${b.no}: пример к правилу`);
  b.zadachi.forEach((z) => {
    id(z.id, `блок ${b.no}`);
    ok(z.metody.includes(b.id), `блок ${b.no}, ${z.id}: метод блока не указан`);
    proveritZadachu(z, `блок ${b.no}, ${z.id}`);
  });
}
for (const z of B.BANK_14) {
  id(z.id, 'банк');
  ok(z.vid === 'uravnenie' && z.promezhutok !== undefined, `банк ${z.id}: нет пункта б`);
  proveritZadachu(z, `банк ${z.id}`);
}

/* ── Теория ─────────────────────────────────────────────── */
function proveritRisunok(r, gde) {
  if (r.vid === 'krug') proveritKrug(r.spec, gde);
  else if (r.vid === 'serii') proveritKrug(H.krugSerii(r.serii), gde);
  else if (r.vid === 'otbor') {
    ok(U.korniNaPromezhutke(r.serii, r.promezhutok).length > 0, `${gde}: на промежутке нет корней`);
    for (const spec of H.krugiOtbora(r.serii, r.promezhutok)) proveritKrug(spec, gde);
  }
  if (r.podpis) strokaOk(r.podpis, `${gde}: подпись`);
}
function proveritPrimer(p, gde) {
  strokaOk(p.uslovie, `${gde}: условие`);
  ok(p.shagi.length >= 1, `${gde}: пример без шагов`);
  p.shagi.forEach((sh, i) => strokaOk(sh, `${gde}: шаг ${i + 1}`));
  if (p.risunok) proveritRisunok(p.risunok, `${gde}: рисунок`);
  if (p.otvet) strokaOk(p.otvet, `${gde}: ответ`);
}
const punktIds = new Set();
for (const g of TE.GLAVY_14) {
  for (const pk of g.punkty) {
    const gde = `теория ${pk.no}`;
    ok(!punktIds.has(pk.id), `${gde}: повтор id`);
    punktIds.add(pk.id);
    ok(!pk.title.includes('$'), `${gde}: формула в заголовке пункта (он идёт в содержание)`);
    pk.bloki.forEach((b, i) => {
      const w = `${gde}, блок ${i + 1}`;
      if (b.vid === 'p') strokaOk(b.text, w);
      else if (b.vid === 'formula') texOk(b.tex, w);
      else if (b.vid === 'spisok') b.punkty.forEach((t) => strokaOk(t, w));
      else if (b.vid === 'ramka') {
        strokaOk(b.text, w);
        ok(
          b.primer !== undefined && b.primer.shagi.length > 0,
          `${w}: рамка без разобранного примера`,
        );
        if (b.primer) proveritPrimer(b.primer, `${w} (пример рамки)`);
      } else if (b.vid === 'primer') proveritPrimer(b.primer, w);
      else if (b.vid === 'risunok') proveritRisunok(b.risunok, w);
      else if (b.vid === 'tablica')
        [...b.zagolovki, ...b.stroki.flat()].forEach((t) => strokaOk(t, w));
    });
  }
}

/* ── Тренажёр «Тригонометрическая окружность» ───────────────
   Генератор: каждый режим × уровень × 200 раундов — карточка ровно на
   одной точке режима, дробь несократима, углы не повторяются, на точке
   не больше карточек, чем вмещает ячейка; верная раскладка проходит
   проверку, неверная — нет. Разбор: каждое «=» цепочки верно численно.
   Ячейки: не пересекаются друг с другом, с осями и подписями, не
   задевают окружность и лежат в рисунке. Правила справки: цепочки и
   ответ «точка …» верны численно. */
const OK = requireSrc('lib/zadanie14/okruzhnost.ts');
const OKT = requireSrc('content/okruzhnost14.ts');

/** Численное значение TeX-выражения вида −\dfrac{72\pi}{6}+5\cdot2\pi. */
function chisloTex(tex) {
  let js = tex
    .replace(/\\[,;!: ]/g, '')
    .replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))')
    .replace(/\\cdot/g, '*')
    .replace(/(\d)\s*\\pi/g, '$1*P')
    .replace(/\\pi/g, 'P')
    .replace(/(\d|\))\s*\(/g, '$1*(')
    .replace(/\s+/g, '');
  if (!/^[-+*/().\dP]+$/.test(js)) return NaN;
  return Function('P', `return (${js});`)(Math.PI);
}
function cepochkaVerna(tex, where) {
  const chasti = tex.split('=');
  const v = chasti.map(chisloTex);
  ok(v.every((x) => Number.isFinite(x)), `${where}: не разобрал цепочку ${tex}`);
  ok(
    v.every((x) => Math.abs(x - v[0]) < 1e-7 * Math.max(1, Math.abs(v[0]))),
    `${where}: неверное равенство ${tex}`,
  );
  return v[0];
}
const vKrugeOk = (x) => ((x % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
const odnaTochka = (a, b) => {
  const d = Math.abs(vKrugeOk(a) - vKrugeOk(b));
  return Math.min(d, 2 * Math.PI - d) < 1e-7;
};
const nodOk = (a, b) => (b === 0 ? Math.abs(a) : nodOk(b, a % b));

for (const rz of OK.REZHIMY) {
  for (const ur of rz.urovni) {
    const e = OK.emkost(rz.id, ur);
    for (let seed = 1; seed <= 200; seed += 1) {
      const where = `окружность ${rz.id}/${ur}, зерно ${seed}`;
      const r = OK.raund(rz.id, ur, seed);
      const ozhid = rz.id === 'chetverti' ? 4 : rz.id === 'mix' ? 8 : ur === 'bolshie' ? (rz.id === 'shest' ? 10 : 8) : rz.tochki.length;
      ok(r.kartochki.length === ozhid, `${where}: карточек ${r.kartochki.length}, а нужно ${ozhid}`);
      const naTochke = new Map();
      const vidal = new Set();
      let otric = 0;
      for (const c of r.kartochki) {
        const { n, d } = c.ugol;
        ok([1, 2, 3, 4, 6].includes(d), `${where}: знаменатель ${d}`);
        ok(nodOk(n, d) === 1, `${where}: дробь ${n}/${d} не сокращена`);
        ok(OK.tochkaUgla(c.ugol) === c.k, `${where}: карточка ${n}π/${d} не на своей точке`);
        ok(rz.tochki.includes(c.k), `${where}: точки ${c.k} нет в режиме`);
        ok(!vidal.has(`${n}/${d}`), `${where}: угол ${n}π/${d} повторяется`);
        vidal.add(`${n}/${d}`);
        naTochke.set(c.k, (naTochke.get(c.k) ?? 0) + 1);
        const v = n / d;
        if (n < 0) otric += 1;
        if (ur === 'osnovnye') ok(v >= 0 && v < 2, `${where}: ${n}π/${d} не из [0; 2π)`);
        if (ur === 'otric') ok(v > -2.0001 && v < 2, `${where}: ${n}π/${d} не из [−2π; 2π)`);
        if (ur === 'bolshie') ok(Math.abs(v) >= 2, `${where}: ${n}π/${d} — не больше оборота`);
        const rb = OK.razborUgla(c.ugol);
        if (seed <= 20) {
          texOk(rb.cepochka, `${where}, разбор`);
          strokaOk(rb.poyasnenie, `${where}, пояснение`);
          const v0 = cepochkaVerna(rb.cepochka, `${where}, разбор`);
          ok(Math.abs(v0 - OK.radiany(c.ugol)) < 1e-9, `${where}: цепочка не о том угле`);
          ok(odnaTochka(chisloTex(rb.tochka), OK.radiany(c.ugol)), `${where}: точка разбора не та`);
        }
      }
      ok([...naTochke.values()].every((x) => x <= e), `${where}: на точке больше ${e} карточек`);
      if (ur === 'otric') ok(otric * 2 >= r.kartochki.length, `${where}: отрицательных меньше половины`);
      if (e === 2 && rz.id !== 'chetverti')
        ok([...naTochke.values()].some((x) => x === 2), `${where}: нет точки с двумя углами`);
      const verno = Object.fromEntries(r.kartochki.map((c) => [c.id, c.k]));
      ok(OK.proveritRaskladku(r, verno).vse, `${where}: верная раскладка не принята`);
      const sdvig = Object.fromEntries(
        r.kartochki.map((c) => [c.id, rz.tochki[(rz.tochki.indexOf(c.k) + 1) % rz.tochki.length]]),
      );
      ok(OK.proveritRaskladku(r, sdvig).verno === 0, `${where}: неверная раскладка засчитана`);
      const pusto = { ...verno, [r.kartochki[0].id]: null };
      const it = OK.proveritRaskladku(r, pusto);
      ok(!it.vse && it.otmetki[r.kartochki[0].id] === 'pusto', `${where}: неразложенная карточка не ошибка`);
      ok(OK.raund(rz.id, ur, seed).kartochki.every((c, i) => OK.ravnyUgly(c.ugol, r.kartochki[i].ugol)), `${where}: зерно не повторяет раунд`);
    }
    /* Ячейки и подписи. */
    const g = OK.geomOkruzhnosti(rz.id, e);
    const where = `окружность ${rz.id}, ячейки на ${e}`;
    ok(g.yacheyki.length === rz.tochki.length, `${where}: ячеек не столько, сколько точек`);
    const { w: yw, h: yh } = OK.razmerYacheyki(e);
    const ramki = g.yacheyki.map((y) => y.ramka);
    g.yacheyki.forEach((y, i) => {
      const r = y.ramka;
      ok(Math.abs(r.x2 - r.x1 - yw) < 1e-9 && Math.abs(r.y2 - r.y1 - yh) < 1e-9, `${where}: ячейка ${y.k} не того размера`);
      ok(K.rasstoyaniyaRamki(r).min >= K.R + 6, `${where}: ячейка ${y.k} задевает окружность`);
      ok(!(r.x1 < 2.5 && r.x2 > -2.5 && r.y1 < OK.OS_OK + 4 && r.y2 > -OK.OS_OK - 4), `${where}: ячейка ${y.k} на оси синусов`);
      ok(!(r.y1 < 2.5 && r.y2 > -2.5 && r.x1 < OK.OS_OK + 4 && r.x2 > -OK.OS_OK - 4), `${where}: ячейка ${y.k} на оси косинусов`);
      ok(r.x1 >= g.vb.x && r.x2 <= g.vb.x + g.vb.w && r.y1 >= g.vb.y && r.y2 <= g.vb.y + g.vb.h, `${where}: ячейка ${y.k} за краем рисунка`);
      ramki.forEach((q, j) => {
        if (j > i) ok(!K.peresekayutsya(r, q, 2), `${where}: ячейки ${y.k} и ${g.yacheyki[j].k} пересекаются`);
      });
      g.podpisi.forEach((p) => ok(!K.peresekayutsya(r, p.ramka, 1), `${where}: ячейка ${y.k} на подписи ${p.tex}`));
      /* Выноски не пересекают друг друга. */
      const ot = (c) => [c.x0, c.y0, Math.max(c.ramka.x1, Math.min(c.x0, c.ramka.x2)), Math.max(c.ramka.y1, Math.min(c.y0, c.ramka.y2))];
      g.yacheyki.forEach((z, j) => {
        if (j <= i || !y.vynoska || !z.vynoska) return;
        const [a, b, c, d] = ot(y);
        const [p, q, u, v] = ot(z);
        const cr = (x1, y1, x2, y2, x3, y3) => (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
        const peres = cr(a, b, c, d, p, q) * cr(a, b, c, d, u, v) < 0 && cr(p, q, u, v, a, b) * cr(p, q, u, v, c, d) < 0;
        ok(!peres, `${where}: выноски ${y.k} и ${z.k} пересекаются`);
      });
    });
    for (const p of g.podpisi) {
      texOk(p.tex, `${where}, подпись`);
      ok(!K.naLiniiKruga(p.ramka, 2), `${where}: подпись ${p.tex} на окружности`);
    }
    /* Телефон: рисунок 360 px — карточка не мельче 34 px по высоте. */
    ok((360 / g.vb.w) * OK.KARTA.h >= 34, `${where}: карточка на телефоне мельче 34 px`);
  }
}
/* Справка «Как найти точку для большого угла». */
OKT.PRAVILA_OK14.forEach((pr, i) => {
  const where = `справка окружности, правило ${i + 1}`;
  strokaOk(pr.title, where);
  strokaOk(pr.text, where);
  ok(pr.primery.length >= 3, `${where}: меньше трёх примеров`);
  for (const t of pr.primery) {
    strokaOk(t, where);
    const formuly = t.split('$').filter((_, j) => j % 2 === 1);
    let ugol = null;
    for (const f of formuly) if (f.includes('=')) {
      const v = cepochkaVerna(f, where);
      if (ugol === null && f.includes('\\pi')) ugol = v;
    }
    const m = /точка \$([^$]*)\$/.exec(t);
    if (m && ugol !== null) ok(odnaTochka(chisloTex(m[1]), ugol), `${where}: «точка ${m[1]}» не та — ${t}`);
  }
});
for (const t of ['3005\\pi', '179\\pi']) {
  ok(OKT.PRAVILA_OK14.some((pr) => pr.primery.some((x) => x.includes(t))), `справка окружности: нет примера ${t}`);
}

if (problems.length) {
  console.error(`check-zadanie14: ${problems.length} проблем из ${checks} проверок:`);
  for (const p of problems.slice(0, 200)) console.error(`  — ${p}`);
  process.exit(1);
}
console.log(`check-zadanie14: ok, ${checks} проверок, задач: ${ids.size}.`);
