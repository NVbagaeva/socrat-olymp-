/* scripts/check-dz5.mjs — шаблоны «Домашней работы» и генератора №5.

   Что проверяется:
     1. Каждый из 13 шаблонов — 1000 генераций по разным seed:
        - генерация не падает (годные числа находятся);
        - ответ-вероятность строго в (0; 1), «во сколько раз» — в (0; 1000];
        - точный ответ — конечная дробь не длиннее 4 знаков; округлённый —
          ровно 2 знака, совпадает с независимым округлением числа,
          до спорной «…5» есть запас, а в условии стоит «округлите
          до сотых»;
        - в тексте нет пустых подстановок (undefined, NaN, null, «${»,
          двойных пробелов, пустых скобок), нет «формул обычным
          текстом» и сырого TeX вне $…$;
        - каждая формула условия и решения разбирается KaTeX;
        - у диаграммы Эйлера точек столько, сколько в условии;
        - один seed — одна и та же задача (детерминизм);
        - в генерации встречаются все сюжеты шаблона.
     2. Готовые наборы: ответы исходного ДЗ №9 — как в ключе автора,
        обновлённого — как в таблице проверки.
     3. ДЗ из генератора по плану типов: число задач и типы.

   Запуск: node scripts/check-dz5.mjs  (pnpm test:dz5) */

import katex from 'katex';
import { requireSrc } from './lib/load-ts.mjs';
import { findPlainMath, findRawTex, stripDollarMath } from './lib/math-markup.mjs';

const { SHABLONY_5 } = requireSrc('lib/veroyatnost/dz5/shablony');
const { generirovat, dzIzGeneratora, syuzhetyGeneratora } = requireSrc(
  'lib/veroyatnost/dz5/generator',
);
const { nabory5 } = requireSrc('lib/veroyatnost/dz5/nabory');
const { znakov, zapasOkrugleniya } = requireSrc('lib/veroyatnost/dz5/drob');

const N = Number(process.env.DZ5_N ?? 1000);
const oshibki = [];
const fail = (where, text) => {
  if (oshibki.length < 60) oshibki.push(`${where}: ${text}`);
  else if (oshibki.length === 60) oshibki.push('… дальше не показываю');
};

const json = (x) => JSON.stringify(x, (_, v) => (typeof v === 'bigint' ? String(v) : v));

function formuly(text) {
  return [...String(text).matchAll(/\$([^$]*)\$/g)].map((m) => m[1]);
}

function katexOk(where, tex) {
  try {
    katex.renderToString(tex, { throwOnError: true, strict: 'ignore' });
  } catch (e) {
    fail(where, `KaTeX: ${e.message.split('\n')[0]} в «${tex}»`);
  }
}

const PUSTOE = [/undefined/, /NaN/, /\bnull\b/, /\$\{/, /\[object/, / {2}/, /\(\s*\)/, /\s[,.]/];

function proveritTekst(where, text) {
  for (const re of PUSTOE) {
    if (re.test(text)) fail(where, `пустая подстановка ${re} в «${text.slice(0, 120)}…»`);
  }
  const vne = stripDollarMath(text);
  for (const f of findPlainMath(vne))
    fail(where, `формула обычным текстом (${f.rule}) «${f.match}»`);
  for (const f of findRawTex(vne)) fail(where, `сырой TeX (${f.rule}) «${f.match}»`);
  formuly(text).forEach((tex) => katexOk(where, tex));
}

function proveritZadachu(where, z) {
  proveritTekst(`${where} условие`, z.uslovie);
  z.reshenie.forEach((s, i) => {
    proveritTekst(`${where} шаг ${i + 1}`, s.text);
    if (s.tex !== undefined) katexOk(`${where} шаг ${i + 1}`, s.tex);
  });
  if (z.reshenie.length < 2) fail(where, 'в решении меньше двух шагов');
  for (const c of z.chasti) {
    if (c.znachenie === null) {
      if (!['да', 'нет'].includes(c.otvet)) fail(where, `ответ словом «${c.otvet}»`);
      continue;
    }
    const x = c.znachenie.toNumber();
    if (c.neVeroyatnost) {
      if (!(x > 0 && x <= 1000)) fail(where, `«во сколько раз» = ${x}`);
    } else if (!(x > 0 && x < 1)) {
      fail(where, `вероятность вне (0; 1): ${x}`);
    }
    if (c.okruglen) {
      const nezavisimo = (Math.round(x * 100) / 100).toFixed(2).replace('.', ',');
      if (c.otvet !== nezavisimo) fail(where, `округление ${c.otvet} ≠ ${nezavisimo} (x = ${x})`);
      if (!/^\d+,\d\d$/.test(c.otvet)) fail(where, `округлённый ответ «${c.otvet}» не до сотых`);
      if (!/округлите до сотых/.test(z.uslovie))
        fail(where, 'ответ округлён, а в условии нет «округлите до сотых»');
    } else {
      const k = znakov(c.znachenie);
      if (k === null || k > 4) fail(where, `точный ответ ${c.otvet}: знаков ${k}`);
      if (Number(c.otvet.replace(',', '.')) !== x) fail(where, `запись ${c.otvet} ≠ ${x}`);
    }
    if (!z.otvet.includes(c.otvet))
      fail(where, `ответ части ${c.otvet} не попал в строку «${z.otvet}»`);
  }
  if (z.shablon === 'z5-eyler') {
    const tochek = (z.risunok?.match(/<circle /g) ?? []).length;
    const n = Number(
      /в котором (\d+) равновозможн|эксперименте (\d+) равновозможн/
        .exec(z.uslovie)
        ?.slice(1)
        .find(Boolean),
    );
    if (tochek !== n) fail(where, `на диаграмме ${tochek} точек, в условии ${n}`);
  }
}

/* ── 1. Шаблоны ───────────────────────────────────────────── */
const otchet = [];
for (const sh of SHABLONY_5) {
  proveritTekst(`${sh.id} суть`, sh.sut);
  const syuzhety = new Set();
  const usloviya = new Set();
  let okrugleno = 0;
  for (let i = 0; i < N; i += 1) {
    const seed = `t${i}`;
    let z;
    try {
      z = generirovat(sh.id, seed);
    } catch (e) {
      fail(`${sh.id} seed ${seed}`, e.message);
      continue;
    }
    proveritZadachu(`${sh.id} seed ${seed}`, z);
    syuzhety.add(z.syuzhet);
    usloviya.add(z.uslovie);
    if (z.chasti.some((c) => c.okruglen)) okrugleno += 1;
    if (i < 20 && json(generirovat(sh.id, seed)) !== json(z)) {
      fail(`${sh.id} seed ${seed}`, 'повторная генерация дала другую задачу');
    }
    for (const c of z.chasti) {
      if (c.okruglen && zapasOkrugleniya(c.znachenie, 2) < 0.1)
        fail(`${sh.id} seed ${seed}`, 'спорное округление');
    }
  }
  const vse = syuzhetyGeneratora(sh).map((s) => s.id);
  const net = vse.filter((s) => !syuzhety.has(s));
  if (net.length > 0) fail(sh.id, `сюжеты ни разу не выпали: ${net.join(', ')}`);
  otchet.push(
    `  ${sh.nomer.toString().padStart(2)}. ${sh.id.padEnd(17)} ${String(usloviya.size).padStart(4)} разных условий из ${N}, сюжетов ${syuzhety.size}, с округлением ${okrugleno}`,
  );
}

/* ── 2. Готовые наборы ────────────────────────────────────── */
const KLYUCH = {
  /* Ключ автора к ДЗ №9 (PDF). */
  dz9: [
    '0,85',
    '0,316',
    '4,74',
    '0,778',
    '0,67',
    '0,03',
    'а) нет; б) 0,0345; в) 0,28',
    'а) 0,991; б) 0,69',
    '0,87',
    'а) 0,0552; б) 0,65',
    '0,43',
    '0,63',
    '0,2',
  ],
  /* Обновлённое ДЗ №9: ответы, посчитанные отдельно дробями. */
  'dz9-novoe': [
    '0,835',
    '0,388',
    '3,96',
    '0,765',
    '0,69',
    '0,04',
    'а) нет; б) 0,052; в) 0,52',
    'а) 0,972; б) 0,58',
    '0,97',
    'а) 0,0765; б) 0,63',
    '0,67',
    '0,54',
    '0,25',
  ],
};
for (const nabor of nabory5()) {
  const klyuch = KLYUCH[nabor.id];
  if (klyuch === undefined) {
    fail(nabor.id, 'нет ключа в проверке');
    continue;
  }
  if (nabor.zadachi.length !== klyuch.length)
    fail(nabor.id, `задач ${nabor.zadachi.length}, в ключе ${klyuch.length}`);
  nabor.zadachi.forEach((z, i) => {
    if (z.otvet !== klyuch[i])
      fail(`${nabor.id} №${i + 1}`, `ответ ${z.otvet}, в ключе ${klyuch[i]}`);
    proveritZadachu(`${nabor.id} №${i + 1}`, z);
  });
}

/* ── 3. ДЗ из генератора ──────────────────────────────────── */
const plan = { 'hotya-by': 2, bernulli: 1, polnaya: 3, bayes: 3, kost: 1, eyler: 1 };
for (let i = 0; i < 50; i += 1) {
  const dz = dzIzGeneratora(plan, `plan${i}`);
  if (dz.length !== 11) fail(`план seed plan${i}`, `задач ${dz.length} вместо 11`);
  for (const [tip, n] of Object.entries(plan)) {
    const est = dz.filter((z) => z.tip === tip).length;
    if (est !== n) fail(`план seed plan${i}`, `тип ${tip}: ${est} вместо ${n}`);
  }
  if (new Set(dz.map((z) => z.uslovie)).size !== dz.length)
    fail(`план seed plan${i}`, 'одинаковые условия');
}

console.log(`Шаблоны №5: ${SHABLONY_5.length}, по ${N} генераций`);
console.log(otchet.join('\n'));
if (oshibki.length > 0) {
  console.error(`\nОшибки (${oshibki.length}):\n  ${oshibki.join('\n  ')}`);
  process.exit(1);
}
console.log(
  '\nВсё в порядке: ответы в границах, округление корректно, подстановки полные, наборы совпадают с ключом.',
);
