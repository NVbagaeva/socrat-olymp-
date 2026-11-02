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
  ok(P.proveritSerii(['(-1)^{k}\\frac{\\pi}{6}+\\pi k'], et).itog === 'verno', 'ядро: (−1)^k не засчитана');
  ok(P.proveritSerii(['\\frac{\\pi}{6}+2\\pi n', '\\frac{5\\pi}{6}+2\\pi n'], et).itog === 'verno', 'ядро: пара серий не засчитана');
  ok(P.proveritSerii(['\\frac{\\pi}{6}+2\\pi k'], et).itog === 'neverno', 'ядро: потеря серии засчитана');
  ok(P.proveritSerii(['\\frac{\\pi}{6}+\\pi k'], et).itog === 'neverno', 'ядро: лишние корни засчитаны');
  const et2 = [U.s(U.u(1, 4), 1, 2)];
  ok(
    P.proveritSerii(['\\frac{\\pi}{4}+\\frac{\\pi k}{2}'], et2).itog === 'verno' &&
      P.proveritSerii(['\\pm\\frac{\\pi}{4}+\\pi k'], et2).itog === 'verno',
    'ядро: серия с шагом π/2 и запись ± не совпали',
  );
  const k = U.korniNaPromezhutke([U.s(U.u(0), 1)], { ot: U.u(-5, 2), do: U.u(-1), vkl: [true, false] });
  ok(k.length === 1 && U.ugolTex(k[0]) === '-2\\pi', 'ядро: полуоткрытый промежуток взял конец');
  ok(P.proveritKorni('-2\\pi', k).itog === 'verno', 'ядро: ответ б не засчитан');
  ok(P.proveritKorni('-\\pi;-2\\pi', k).itog === 'neverno', 'ядро: лишний корень засчитан');
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
    else if (/\\[a-zA-Z]|\^|_\{/.test(k)) problems.push(`${where}: TeX вне долларов «${k.slice(0, 40)}»`);
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
        problems.push(`${gde}: корень x≈${x.toFixed(5)} (${(x / Math.PI).toFixed(4)}π) не входит в серии`);
      }
    }
    if (z.promezhutok) {
      const L = (U.znach(z.promezhutok.do) - U.znach(z.promezhutok.ot)) / Math.PI;
      ok(L <= 3 + 1e-9, `${gde}: промежуток длиннее 3π — больше двух окружностей`);
      const n = U.korniNaPromezhutke(z.serii, z.promezhutok).length;
      const CHISLA = { Ни: 0, Один: 1, Одна: 1, Два: 2, Две: 2, Три: 3, Четыре: 4, Пять: 5, Шесть: 6 };
      z.podskazki.forEach((h, i) => {
        if (!/Сколько.*корн/.test(h.question)) return;
        const t = h.options[h.correct] ?? '';
        const slovo = Object.keys(CHISLA).find((w) => t.startsWith(w));
        const m = /\$(\d+)\$/.exec(t);
        const chislo = slovo !== undefined ? CHISLA[slovo] : m ? Number(m[1]) : null;
        if (chislo !== null) ok(chislo === n, `${gde}: подсказка ${i + 1} говорит «${t}», а корней на промежутке ${n}`);
      });
    }
    if (z.promezhutok) {
      const korni = U.korniNaPromezhutke(z.serii, z.promezhutok);
      ok(korni.length > 0, `${gde}: на промежутке нет корней`);
      if (z.otbor === 'nerav') {
        try {
          O.otborNerav(z.serii, z.promezhutok).forEach((s, i) => strokaOk(s, `${gde}: отбор ${i + 1}`));
        } catch (e) {
          problems.push(`${gde}: отбор неравенством — ${e.message}`);
        }
      }
      for (const spec of H.krugiOtbora(z.serii, z.promezhutok)) proveritKrug(spec, `${gde}: окружность б`);
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
    ok(new Set(h.options).size === h.options.length, `${gde}: подсказка ${i + 1} — одинаковые кнопки`);
    ok(h.correct >= 0 && h.correct < h.options.length, `${gde}: подсказка ${i + 1} — нет верной кнопки`);
    if (h.comment) strokaOk(h.comment, `${gde}: подсказка ${i + 1}, отклик`);
  });
}

function proveritKrug(spec, gde) {
  const g = K.geomKruga(spec);
  g.podpisi.forEach((p, i) => {
    checks += 1;
    if (p.vid !== 'os' && K.naLiniiKruga(p.ramka, 0)) problems.push(`${gde}: подпись «${p.tex}» на линии окружности`);
    g.podpisi.slice(i + 1).forEach((q2) => {
      checks += 1;
      if (K.peresekayutsya(p.ramka, q2.ramka, 0)) problems.push(`${gde}: подписи «${p.tex}» и «${q2.tex}» пересекаются`);
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
        ok(b.primer !== undefined && b.primer.shagi.length > 0, `${w}: рамка без разобранного примера`);
        if (b.primer) proveritPrimer(b.primer, `${w} (пример рамки)`);
      } else if (b.vid === 'primer') proveritPrimer(b.primer, w);
      else if (b.vid === 'risunok') proveritRisunok(b.risunok, w);
      else if (b.vid === 'tablica') [...b.zagolovki, ...b.stroki.flat()].forEach((t) => strokaOk(t, w));
    });
  }
}

if (problems.length) {
  console.error(`check-zadanie14: ${problems.length} проблем из ${checks} проверок:`);
  for (const p of problems.slice(0, 200)) console.error(`  — ${p}`);
  process.exit(1);
}
console.log(`check-zadanie14: ok, ${checks} проверок, задач: ${ids.size}.`);
