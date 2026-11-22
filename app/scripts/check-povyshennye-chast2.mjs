#!/usr/bin/env node
/* scripts/check-povyshennye-chast2.mjs — часть 2 (задания 14–20)
   вариантов повышенной сложности.

   Запуск: pnpm test:povyshennye-chast2 [--json файл]

   Каждый ответ шаблона (он считается формулой) сверяется вторым,
   независимым способом:
     14 — значение исходного выражения из определений функций в точках
          серий и поиск нулей на отрезке перебором с шагом;
     15 — координаты: угол DK с основанием, SK : KC и расстояние между
          прямыми DK и BC по формуле смешанного произведения;
     16 — неравенство на сетке x ∈ [0; 60] с шагом 0,0005;
     17 — максимум A(τ) перебором при нескольких n;
     18 — пятиугольник строится численно (C — подбором касания),
          касание всех сторон, C, O, P на одной прямой, площадь по
          координатам;
     19 — для сетки значений a корни исходного уравнения ищутся
          численно; множество «ровно два корня» сравнивается с ответом;
     20 — полный перебор длин из секций.
   Плюс: версии различаются, баллы и плашки (склонение, сумма 33),
   ссылки на теоремы, чертежи движками без замечаний, формулы KaTeX.
   --json — числа версий для sympy (scripts/check_povyshennye_chast2.py). */

import fs from 'node:fs';
import { requireSrc } from './lib/load-ts.mjs';
import { provB } from './lib/prov-chast2-b.mjs';
import { provK } from './lib/prov-chast2-k.mjs';
import { provL } from './lib/prov-chast2-l.mjs';
import { provM } from './lib/prov-chast2-m.mjs';
import { provN } from './lib/prov-chast2-n.mjs';
import { provX } from './lib/prov-chast2-x.mjs';
import { provY } from './lib/prov-chast2-y.mjs';
import { provA } from './lib/prov-chast2-a.mjs';
import { provP } from './lib/prov-chast2-p.mjs';
import { provQ } from './lib/prov-chast2-q.mjs';
import { provR } from './lib/prov-chast2-r.mjs';
import { provU } from './lib/prov-chast2-u.mjs';
import { provV } from './lib/prov-chast2-v.mjs';
import { provW } from './lib/prov-chast2-w.mjs';
import { provO } from './lib/prov-chast2-o.mjs';
import { provI } from './lib/prov-chast2-i.mjs';
import { provAE } from './lib/prov-chast2-ae.mjs';

const { MAX_BALL, MAX_PART1, MAX_PART2, MAX_TOTAL, ballText } = requireSrc(
  'content/variantOnline/bally',
);
const { GOTOVY, S_CHAST2 } = requireSrc('lib/povyshennye/dannye/index');
const { zadacha2, SHABLONY_2 } = requireSrc('lib/povyshennye/chast2/index');
const { reshenieHtml, uslovieHtml, razborHtml, teoremaHtml, teoremyZadach } = requireSrc(
  'lib/povyshennye/chast2/html',
);
const { TEOREMY, ssylkiV, chertezhTeoremy } = requireSrc('lib/teoremy');
const { proverit } = requireSrc('lib/chast2/sravnenie');
const { kriteriiZadaniya } = requireSrc('content/variantOnline/kriterii');

let failures = 0;
let checks = 0;
function ok(cond, where, message = '') {
  checks += 1;
  if (!cond) {
    failures += 1;
    console.error(`  ✗ ${where}${message ? `: ${message}` : ''}`);
  }
}
const close = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

/* ── Баллы и плашки ──────────────────────────────────────────── */
console.log('Баллы и плашки');
{
  const { STRUKTURA } = requireSrc('content/struktura.js');
  const [a, b, c] = STRUKTURA.id === '2027-19' ? [12, 20, 32] : [13, 20, 33];
  ok(MAX_PART1 === a && MAX_PART2 === b && MAX_TOTAL === c, `максимумы ${a} + ${b} = ${c}`);
}
const max2 = { 14: 2, 15: 3, 16: 2, 17: 2, 18: 3, 19: 4, 20: 4 };
for (const [no, b] of Object.entries(max2)) ok(MAX_BALL[no] === b, `максимум №${no} = ${b}`);
const sklon = {
  1: '1 балл',
  2: '2 балла',
  3: '3 балла',
  4: '4 балла',
  5: '5 баллов',
  11: '11 баллов',
  20: '20 баллов',
  21: '21 балл',
  33: '33 балла',
};
for (const [n, t] of Object.entries(sklon))
  ok(ballText(Number(n)) === t, `«${t}»`, ballText(Number(n)));
for (const no of Object.keys(max2)) {
  const k = kriteriiZadaniya(Number(no));
  ok(
    k[0].ball === MAX_BALL[no] && k[k.length - 1].ball === 0,
    `критерии №${no}: от ${MAX_BALL[no]} до 0`,
  );
}
function nuli(f, lo, hi, N = 60000) {
  const out = [];
  let px = lo;
  let pv = f(lo);
  for (let i = 1; i <= N; i += 1) {
    const x = lo + ((hi - lo) * i) / N;
    const v = f(x);
    if (Math.abs(v) < 1e-13) out.push(x);
    else if (pv * v < 0) {
      let a = px;
      let b = x;
      for (let k = 0; k < 70; k += 1) {
        const m = (a + b) / 2;
        if (f(a) * f(m) <= 0) b = m;
        else a = m;
      }
      out.push((a + b) / 2);
    }
    px = x;
    pv = v;
  }
  const s = out.sort((a, b) => a - b);
  return s.filter((x, i) => i === 0 || x - s[i - 1] > 1e-6);
}

function provC14(p, z) {
  const f = (x) => p.a * Math.sin(2 * x) + p.b * Math.cos(2 * x) - p.c;
  /* Серии: arctg t + πn — корни при разных n. */
  for (const t of z.kontrol.t)
    for (const n of [-4, 0, 3]) {
      const x = Math.atan(t) + Math.PI * n;
      ok(Math.abs(f(x)) < 1e-9, `№14: x = ${x.toFixed(4)} — корень`);
    }
  /* Других корней нет: на периоде π ровно два нуля. */
  ok(nuli(f, 0.001, Math.PI + 0.001).length === 2, '№14: на периоде два корня');
  const kor = nuli(f, z.kontrol.lo, z.kontrol.hi);
  ok(
    kor.length === 2 && kor.every((x, i) => close(x, z.kontrol.korni[i], 1e-7)),
    '№14: корни на отрезке совпали',
    `${kor} vs ${z.kontrol.korni}`,
  );
}

const PROV = {
  ...provB({ ok, close, requireSrc }),
  ...provK({ ok, close, requireSrc }),
  ...provL({ ok, close, requireSrc }),
  ...provM({ ok, close, requireSrc }),
  ...provN({ ok, close, requireSrc }),
  ...provX({ ok, close, requireSrc }),
  ...provY({ ok, close, requireSrc }),
  ...provA({ ok, close, requireSrc }),
  ...provP({ ok, close, requireSrc }),
  ...provQ({ ok, close, requireSrc }),
  ...provR({ ok, close, requireSrc }),
  ...provU({ ok, close }),
  ...provV({ ok, close }),
  ...provW({ ok, close }),
  ...provO({ ok, close, requireSrc }),
  ...provI({ ok, close, requireSrc }),
  ...provAE({ ok, close, requireSrc }),
  'c14.tgPodstanovka': provC14,
};

/* ── Варианты ─────────────────────────────────────────────────── */
const json = [];
for (const k of S_CHAST2) {
  ok(GOTOVY.includes(k), `вариант ${k} с частью 2 есть в GOTOVY`);
  const { VARIANT } = requireSrc(`lib/povyshennye/dannye/v${String(k).padStart(2, '0')}`);
  const versii = VARIANT.chast2 ?? [];
  console.log(`Вариант ${k}: ${versii.length} версий`);
  ok(versii.length === 6, `вариант ${k}: 6 версий части 2`);
  /* Версии различаются: ни одна задача не повторяет параметры другой версии. */
  for (let j = 0; j < 7; j += 1) {
    const ps = versii.map((v) => JSON.stringify(v[j]?.p));
    ok(new Set(ps).size === ps.length, `вариант ${k}, №${14 + j}: версии различаются`);
  }
  versii.forEach((zapisi, vi) => {
    const kv = `${k}.${vi + 1}`;
    ok(zapisi.length === 7, `${kv}: семь задач`);
    const zadachi = [];
    zapisi.forEach((zp, j) => {
      let z;
      try {
        z = zadacha2(zp);
      } catch (err) {
        ok(false, `${kv} №${14 + j}: шаблон собрался`, String(err));
        return;
      }
      zadachi.push(z);
      ok(z.no === 14 + j, `${kv}: №${14 + j} на своём месте`);
      ok(SHABLONY_2[zp.s].no === z.no, `${kv}: шаблон ${zp.s} — для №${z.no}`);
      ok(PROV[zp.s] !== undefined, `${kv}: проверка вторым способом для ${zp.s}`);
      PROV[zp.s]?.(zp.p, z);
      /* Решение по этапам, разбор по шагам, формулы набираются. */
      ok(z.reshenie.length >= 3, `${kv} №${z.no}: решение по этапам`);
      ok(z.razbor.length >= 3, `${kv} №${z.no}: разбор по шагам`);
      for (const html of [uslovieHtml(z.uslovie), reshenieHtml(z, 'ekran'), razborHtml(z)]) {
        ok(
          !html.includes('katex-error') && !/\$[^$]*\$/.test(html.replace(/<[^>]+>/g, '')),
          `${kv} №${z.no}: формулы набраны`,
        );
      }
      /* Ссылки на теоремы — в справочнике; у 15 и 18 они есть. */
      const ids = z.reshenie.flatMap((e) => e.lines.flatMap(ssylkiV));
      for (const id of ids) ok(TEOREMY[id] !== undefined, `${kv} №${z.no}: теорема ${id} есть`);
      if (z.no === 15 || z.no === 18)
        ok(ids.length >= 4, `${kv} №${z.no}: ссылки на теоремы`, String(ids.length));
      /* Верный ответ принимает автопроверка. */
      for (const pt of z.punkty) {
        if (pt.pole === null || pt.pole.vid === 'danet') continue;
        const vvod =
          pt.pole.vid === 'korni' || pt.pole.vid === 'serii' ? pt.pole.verno : pt.pole.verno;
        ok(
          proverit(pt.pole, vvod) === 'sovpadaet',
          `${kv} №${z.no}: верный ответ проходит автопроверку`,
        );
      }
      json.push({ v: kv, s: zp.s, p: zp.p, kontrol: z.kontrol });
    });
    ok(teoremyZadach(zadachi).length >= 6, `${kv}: теоремы для листа учителя`);
  });
}

/* ── Справочник теорем ───────────────────────────────────────── */
console.log('Справочник теорем');
for (const [id, t] of Object.entries(TEOREMY)) {
  ok(t.dokazatelstvo.length >= 2, `теорема ${id}: доказательство по шагам`);
  const svg = chertezhTeoremy(id);
  ok(svg.startsWith('<svg') && !svg.includes('NaN'), `теорема ${id}: чертёж движком`);
  ok(!teoremaHtml(id).includes('katex-error'), `теорема ${id}: формулы`);
}

const iJson = process.argv.indexOf('--json');
if (iJson > 0) fs.writeFileSync(process.argv[iJson + 1], JSON.stringify(json, null, 1));

console.log(`\nПроверок: ${checks}, ошибок: ${failures}`);
process.exit(failures === 0 ? 0 : 1);
