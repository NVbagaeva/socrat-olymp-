#!/usr/bin/env node
/* scripts/check-povyshennye.mjs — раздел «Варианты повышенной сложности».

   Запуск: pnpm test:povyshennye [номера вариантов] [--json файл] [--report]

   Для каждого готового варианта (lib/povyshennye/dannye) собираются
   все шесть версий — так же, как их собирает онлайн-режим и лист, — и
   проверяется:

     1. Детерминизм: набор, собранный второй раз, побайтно тот же.
     2. Задача целая: условие, ответ по правилам бланка ЕГЭ, решение
        учителя и разбор ученика; у №4–6 ответ — конечная десятичная
        дробь, у №4 и №5 — строго между 0 и 1; у №13 — целое число.
     3. Сырого TeX в условии и решениях нет (как test:math-markup).
     4. Второй, независимый счёт ответа шаблона сходится с ответом
        (перебор, подстановка корня, численный счёт, бисекция …).
     5. Внутри варианта шесть версий различаются числами у каждого
        задания; среди всех версий раздела нет одинаковых задач.

   --json файл — выгрузка «шаблон, параметры, ответ» для проверки
   sympy (scripts/check_povyshennye.py) — второй способ из ТЗ.
   --report — таблица «вариант — задание — прототип — откуда».

   Ненулевой код возврата — проверка не прошла. */

import fs from 'node:fs';
import { requireSrc } from './lib/load-ts.mjs';
import { findRawTex, visibleTexts } from './lib/math-markup.mjs';

const args = process.argv.slice(2);
const only = args.filter((a, i) => /^\d+$/.test(a) && args[i - 1] !== '--json').map(Number);
const JSON_OUT = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const REPORT = args.includes('--report');

const { povSetIz } = requireSrc('lib/povyshennye/set');
const { SHABLONY } = requireSrc('lib/povyshennye/shablony');
const { normalizeAnswer } = requireSrc('lib/variant/online/normalize');
const { PV4_NE_MENEE, PV5_DVE_PARTII } = requireSrc('lib/veroyatnost/povyshennye');
const { P03_86 } = requireSrc('lib/zadanie3/razdel8/cilindr');
const { prototype: prototype6 } = requireSrc('lib/zadanie6/prototypes');
const { PV7_KOREN } = requireSrc('lib/zadanie7/prototypes/povyshennye');
const { logObratnyy } = requireSrc('lib/vychisleniya/povyshennye');
const { maxNaOtrezke } = requireSrc('lib/proizvodnaya/povyshennye');
const { kLog } = requireSrc('lib/graph/povyshennye');
const { skalyarnoeKombinatsiy } = requireSrc('lib/vektory/povyshennye');

let failures = 0;
function fail(where, message) {
  failures += 1;
  if (failures <= 80) console.error(`  ✗ ${where}: ${message}`);
}

const num = (s) => Number(String(s).replace(',', '.').replace('−', '-'));
const close = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));

/* ── Второй счёт по шаблону ─────────────────────────────────────── */

const VTOROY = {
  'z01.ravnobedr-koren': (p) => {
    /* Площадь по координатам вершин: стороны √a, угол 30°. */
    const s = Math.sqrt(p.a);
    const A = [0, 0];
    const B = [s, 0];
    const C = [s * Math.cos(Math.PI / 6), s * Math.sin(Math.PI / 6)];
    return Math.abs((B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1])) / 2;
  },
  'z02.skalyar-km': (p) => skalyarnoeKombinatsiy(p).proverka,
  'z03.shar-v-cilindre': (p) => P03_86.poModeli(p),
  'z04.ne-menee': (p) => PV4_NE_MENEE.perebor(p),
  'z05.dve-partii': (p) => PV5_DVE_PARTII.perebor(p),
  'z06.chastoty': (p) => prototype6('P08').pereschet(p),
  'z07.koren': (p) => {
    /* Подстановка корня шаблона в исходное уравнение. */
    const x = PV7_KOREN.solve(p).answer;
    const c = PV7_KOREN.chisla(p);
    return close(c.lhs(x), c.rhs(x)) ? x : NaN;
  },
  'z08.log-obratnyy': (p) => logObratnyy(p).proverka,
  'z09.max-na-otrezke': (p) => maxNaOtrezke(p)?.proverka ?? NaN,
  'z10.vysota': (p) => {
    /* Корни h(t) = H численно, без решателя раздела. */
    const a = -p.g2;
    const b = p.v0;
    const c = p.h0 - p.H;
    const D = b * b - 4 * a * c;
    return Math.abs(Math.sqrt(D) / a);
  },
  'z11.bystryy': (p) => {
    /* Перебор скорости быстрого с шагом 1 км/ч: разница времени — dt минут. */
    for (let v = p.dv + 1; v <= 300; v += 1) {
      if (close(p.S / (v - p.dv) - p.S / v, p.dt / 60)) return v;
    }
    return NaN;
  },
  'z12.k-log': (p) => kLog(p).proverka,
  'z13.dif-summa': (p) => {
    /* Прямой пересчёт по годам в рублях. */
    let dolg = p.S * 1e6;
    const umen = dolg / p.n;
    let vsego = 0;
    for (let i = 0; i < p.n; i += 1) {
      vsego += dolg * (p.r / 100) + umen;
      dolg -= umen;
    }
    return Math.round(vsego * 100) / 100;
  },
};

/* ── Варианты ───────────────────────────────────────────────────── */

const { GOTOVY } = requireSrc('lib/povyshennye/dannye/index');
const nomera = GOTOVY.filter((k) => only.length === 0 || only.includes(k));
const vyhod = [];
const vseZadachi = new Map();
const otchet = [];

for (const k of nomera) {
  const t0 = Date.now();
  const { VARIANT } = requireSrc(`lib/povyshennye/dannye/v${String(k).padStart(2, '0')}`);
  if (VARIANT.k !== k) fail(`вариант ${k}`, `в данных k = ${VARIANT.k}`);
  if (VARIANT.versii.length !== 6) fail(`вариант ${k}`, `версий ${VARIANT.versii.length}, нужно 6`);
  let set;
  try {
    set = povSetIz(k, VARIANT.versii);
  } catch (e) {
    fail(`вариант ${k}`, `не собрался: ${e.stack ?? e}`);
    continue;
  }
  const again = povSetIz(k, VARIANT.versii);
  if (JSON.stringify(set) !== JSON.stringify(again))
    fail(`вариант ${k}`, 'сборка не детерминирована');

  for (let i = 0; i < 13; i += 1) {
    const ege = i + 1;
    const sh = new Set();
    let ok = true;
    for (let v = 0; v < VARIANT.versii.length; v += 1) {
      const z = VARIANT.versii[v][i];
      const t = set.variants[v].tasks[i];
      const kv = `${k}.${v + 1} №${ege}`;
      if (SHABLONY[z.s]?.ege !== ege) {
        fail(kv, `шаблон ${z.s} не для задания ${ege}`);
        ok = false;
        continue;
      }
      const klyuch = `${z.s}|${JSON.stringify(z.p)}`;
      if (sh.has(klyuch)) {
        fail(kv, 'числа совпадают с другой версией варианта');
        ok = false;
      }
      sh.add(klyuch);
      if (vseZadachi.has(klyuch)) {
        fail(kv, `та же задача, что ${vseZadachi.get(klyuch)}`);
        ok = false;
      }
      vseZadachi.set(klyuch, kv);

      const n = normalizeAnswer(t.answer);
      if (!n.ok) {
        fail(kv, `ответ «${t.answer}» не по правилам бланка`);
        ok = false;
      }
      const x = num(t.answer);
      if ([4, 5, 6].includes(ege) && Number.isInteger(x)) fail(kv, `у №${ege} ответ целый: ${x}`);
      if ([4, 5].includes(ege) && !(x > 0 && x < 1)) fail(kv, `вероятность ${x} вне (0; 1)`);
      if (ege === 13 && !Number.isInteger(x)) fail(kv, `сумма не целая: ${x}`);
      if (x === 0) fail(kv, 'ответ 0');
      if (!t.statement || !t.solutionTeacher || !t.solutionStudent) {
        fail(kv, 'нет условия или решения');
        ok = false;
      }
      for (const [chto, html] of [
        ['условие', t.statement],
        ['решение учителя', t.solutionTeacher],
        ['разбор', t.solutionStudent],
      ]) {
        for (const text of visibleTexts(html ?? '')) {
          const raw = findRawTex(text);
          if (raw.length > 0) {
            fail(
              kv,
              `сырой TeX в «${chto}»: ${raw
                .slice(0, 3)
                .map((r) => r.match ?? r)
                .join(' | ')}`,
            );
            ok = false;
          }
        }
      }
      if ([1, 3, 9, 12].includes(ege) && t.figure === null) fail(kv, 'нет рисунка');
      const vtoroy = VTOROY[z.s]?.(z.p);
      if (vtoroy === undefined || !close(vtoroy, x)) {
        fail(kv, `второй счёт ${vtoroy} ≠ ответу ${x}`);
        ok = false;
      }
      vyhod.push({ kv: `${k}.${v + 1}`, ege, s: z.s, p: z.p, answer: x });
    }
    const info = SHABLONY[VARIANT.versii[0][i].s];
    otchet.push({ k, ege, prototip: info?.prototip ?? '?', otkuda: info?.otkuda, ok });
  }
  console.log(`  вариант ${k}: 6 версий × 13 заданий, ${Date.now() - t0} мс`);
}

if (JSON_OUT !== null) {
  fs.writeFileSync(JSON_OUT, JSON.stringify(vyhod, null, 1));
  console.log(`  выгрузка для sympy: ${JSON_OUT} (${vyhod.length} задач)`);
}

if (REPORT) {
  console.log('\n| Вариант | № | Прототип | Генератор | Проверка |');
  console.log('|---|---|---|---|---|');
  for (const r of otchet) {
    console.log(
      `| ${r.k} | ${r.ege} | ${r.prototip} | ${r.otkuda === 'razdel' ? 'переиспользован генератор раздела' : 'новый шаблон в модуле раздела'} | ${r.ok ? 'пройдена' : '**нет**'} |`,
    );
  }
}

if (failures > 0) {
  console.error(`\nРаздел «Варианты повышенной сложности»: ошибок ${failures}`);
  process.exit(1);
}
console.log(`\nРаздел «Варианты повышенной сложности»: ${vyhod.length} задач — всё сходится`);
