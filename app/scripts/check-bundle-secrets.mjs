#!/usr/bin/env node
/* scripts/check-bundle-secrets.mjs — ответы и разборы не уезжают в бандл.

   Запуск: pnpm test:secrets [папка сборки, по умолчанию out]

   Правило проекта: правильный ответ не попадает в разметку и в бандл
   открытым текстом. В тренажёрах ответ закрыт отпечатком, разбор и
   параметры рисунка лежат зашифрованными (см. lib/secret.ts) — но
   всё это бесполезно, если в страницу уехал сам ответ полем
   «answer», разбор со строкой «Ответ: …» или параметры рисунка, по
   которым ответ читается с картинки.

   Проверка идёт по банкам всех разделов с закрытыми ответами — №3,
   №4, №5, №8 и №12: банк читается из исходников, для каждой задачи
   считается её ответ, а потом в собранных страницах ищется окно этой
   задачи (от её идентификатора до следующего) и в окне — сам ответ в
   тех формах, в каких он уезжал раньше: полем JSON, строкой «Ответ:»,
   концом выкладки «= 0,25». Отдельно ищутся поля параметров рисунка
   у №4 и №5, открытый разбор и пометки вариантов у №12, поля ответа
   у №8. Кроме окон задач, во всех кусках сборки ищется след целого
   банка: имена полей прототипа и начала первых шагов разборов.

   Витрина /styleguide/ — единственное исключение: она служебная,
   помечена noindex и показывает ответы намеренно.

   Ненулевой код возврата — в сборке лежит то, чего там быть не должно.
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { requireSrc } from './lib/load-ts.mjs';
import GraphGenerate from '../src/lib/graph/generate.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir, ok) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(full, ok);
    }
    return ok(full) ? [full] : [];
  });
}

/* ── Формы записи ответа ────────────────────────────────────────── */

/** Число в единственной записи — так же, как в secret.ts разделов. */
function canon(value) {
  return String(Math.round(value * 1e9) / 1e9);
}

/**
 * Все записи, в каких число могло уехать: с точкой, с запятой, с
 * минусом клавиатурным и типографским, а у десятичной дроби —
 * ещё и в TeX («0{,}25»).
 */
function formy(otvet) {
  const raw = typeof otvet === 'number' ? canon(otvet) : String(otvet).trim();
  const tochka = raw.replace(/,/g, '.').replace(/−/g, '-');
  const zapyataya = tochka.replace('.', ',');
  const set = new Set([tochka, zapyataya, tochka.replace('.', '{,}')]);
  if (tochka.startsWith('-')) {
    set.add(zapyataya.replace('-', '−'));
  }
  return [...set].filter((s) => s !== '');
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ── Банки ──────────────────────────────────────────────────────── */

/**
 * Задача для проверки: идентификатор окна в странице и ответы всех
 * её вариантов. Окно — от `"id":"<id>"` до следующего `"id":"`.
 */
const zadachi = [];

/* №3: прототип с десятью вариантами, у каждого свой ответ. */
const { BANK: BANK_3 } = requireSrc('lib/zadanie3/index');
for (const prototype of BANK_3) {
  zadachi.push({
    razdel: '№3',
    id: prototype.id,
    variantov: prototype.varianty.length,
    otvety: prototype.varianty.flatMap((v) => formy(prototype.otvet(v.params))),
    polya: [],
  });
}

/* №4 и №5: прототипы банка со всеми вариантами (у №4 это все 102
   задачи задачника плюс новые варианты) и задачи конспекта — у №4
   каждая из них прототип на одиннадцать вариантов, и ответы всех
   вариантов ищутся в окне задачи. Кроме ответа, в окне не должно
   быть полей параметров рисунка: количества за плитками, клетки
   таблицы, вероятности на ветвях, доли групп, границы дуги и
   благоприятной площади. */
const POLYA_RISUNKA = [
  'counts',
  'cells',
  'share',
  'pLabel',
  'favorable',
  'from',
  'to',
  'parametry',
];
const { BANK_4, BANK_5, KONSPEKT_4, PODGOTOVKA_4, PODGOTOVKA_5, otvetUchenika, prepOtvet } =
  requireSrc('lib/veroyatnost/index');
for (const [razdel, bank, podgotovka] of [
  ['№4', BANK_4, PODGOTOVKA_4],
  ['№5', BANK_5, PODGOTOVKA_5],
]) {
  for (const prototype of bank) {
    zadachi.push({
      razdel,
      id: prototype.id,
      variantov: prototype.varianty.length,
      otvety: prototype.varianty.flatMap((v) => formy(otvetUchenika(prototype, v.params))),
      polya: POLYA_RISUNKA,
    });
  }
  for (const blok of podgotovka) {
    for (const zadacha of blok.zadachi) {
      /* Задача конспекта №4 — прототип с вариантами под тем же id:
         в окно задачи идут ответы всех его вариантов. */
      const prototype = KONSPEKT_4.find((k) => k.id === zadacha.id);
      const otvety =
        prototype === undefined
          ? formy(prepOtvet(zadacha))
          : [
              ...formy(prepOtvet(zadacha)),
              ...prototype.varianty.flatMap((v) => formy(otvetUchenika(prototype, v.params))),
            ];
      zadachi.push({
        razdel,
        id: zadacha.id,
        variantov: prototype === undefined ? 1 : prototype.varianty.length,
        otvety: [...new Set(otvety)],
        polya: POLYA_RISUNKA,
      });
    }
  }
}

/* №8: опорные микро-задачи с зафиксированным вариантом и банк
   тренажёра — десять seed на прототип. Банк тренажёра в страницы
   не идёт (задачи считаются в браузере), но искать его ответы всё
   равно надо: раздел проверяется по тому же правилу. */
const { PREP_BLOCKS } = requireSrc('lib/vychisleniya/prep/blocks');
const { fixedSeed, generatePrep } = requireSrc('lib/vychisleniya/prep/generate');
const { BANK: BANK_8 } = requireSrc('lib/vychisleniya/bank');
const { generate: generate8 } = requireSrc('lib/vychisleniya/generate');
const POLYA_8 = ['otvet', 'proverka', 'params'];
for (const blok of PREP_BLOCKS) {
  for (const micro of blok.zadachi) {
    const task = generatePrep(micro.id, fixedSeed(micro));
    zadachi.push({
      razdel: '№8',
      id: micro.id,
      variantov: 1,
      otvety: typeof task.otvet === 'number' ? formy(task.otvet) : [],
      polya: POLYA_8,
    });
  }
}
/* У банка тренажёра №8 окна нет: его ответы ищутся по всем страницам
   раздела целиком. */
const otvety8 = BANK_8.flatMap((entry) =>
  entry.variants.flatMap((v) => formy(generate8(entry.prototype, v.seed, v.level).otvet)),
);

/* №12: наборы движка graph/ по навыкам опорных задач. Ответ — число
   или номер верного варианта; в окне не должно быть ни поля
   «answer», ни открытого разбора, ни пометок вариантов «error». */
const { prepSkills } = requireSrc('content/prepSkills');
const graphData = path.join(root, 'src', 'lib', 'graph', 'data');
const readSets = (dir) =>
  fs
    .readdirSync(path.join(graphData, dir))
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => JSON.parse(fs.readFileSync(path.join(graphData, dir, name), 'utf8')));
GraphGenerate.setSets({ prep: readSets('prep/12'), prototypes: readSets('prototypes/12') });
const POLYA_12 = ['answer', 'error', 'steps'];
for (const skill of prepSkills) {
  for (const task of GraphGenerate.generateSet(skill.setId)) {
    zadachi.push({
      razdel: '№12',
      id: task.id,
      variantov: 1,
      otvety: formy(task.answer),
      polya: POLYA_12,
    });
  }
}

/* ── След целого банка в кусках сборки ──────────────────────────── */

/* Начало первого шага первого варианта: строка длинная и в обычной
   вёрстке не встречается. */
const marks = [...BANK_3, ...BANK_4, ...BANK_5, ...KONSPEKT_4]
  .map((prototype) => {
    const first = prototype.varianty[0];
    const step = prototype.shagi(first.params)[0];
    return { id: prototype.id, text: (step?.text ?? '').replace(/\s+/g, ' ').trim().slice(0, 40) };
  })
  .filter((m) => m.text.length >= 20);

/* Имена полей прототипа: если они есть в куске, уехал весь банк. */
const FIELDS = ['poModeli:', 'perebor:', 'dopustimo:', 'varianty:'];

/* ── Поиск ──────────────────────────────────────────────────────── */

/**
 * Где ответ мог оказаться открытым. `A` — запись ответа.
 *   поле JSON:        "answer":"A" / "otvet":A / "display":"A"
 *   строка разбора:   Ответ: … A   (в пределах четырёхсот знаков)
 *   конец выкладки:   = A  или  = \mathbf{A}  перед концом строки
 */
function shablony(a) {
  const A = escapeRe(a);
  const granitsa = `(?<![\\d.,\\-\\u2212{])${A}(?![\\d.,}])`;
  return [
    ['поле ответа', new RegExp(`"(?:answer|otvet|value|display)":"?${A}"?(?=[,}\\]])`)],
    ['строка «Ответ:»', new RegExp(`Ответ:(?:(?!Ответ:).){0,400}?${granitsa}`, 's')],
    /* Знак равенства с пробелами вокруг, как в выкладке: «=1» из
       адресов и атрибутов вроде initial-scale=1 сюда не попадает. */
    ['конец выкладки', new RegExp(`(?<=\\s)=\\s+(?:\\\\mathbf\\{)?${A}\\}?\\s*(?=\\\\n|"|$)`, 'm')],
  ];
}

/* Поле «p» — вероятность на ветви дерева — ищется только с числом:
   у Next такое же имя носит строка состояния маршрута, `"p":""`. */
function polyaShablon(polya) {
  return polya.length === 0
    ? null
    : new RegExp(`"(?:${polya.join('|')})":${polya === POLYA_RISUNKA ? '|"p":-?\\d' : ''}`);
}

const outDir = path.resolve(root, process.argv[2] ?? 'out');
if (!fs.existsSync(outDir)) {
  console.error(`Папки сборки нет: ${outDir}`);
  process.exit(1);
}

/* Витрина показывает ответы намеренно: она служебная и noindex. */
const allowed = (file) => path.relative(outDir, file).split(path.sep).includes('styleguide');

const files = walk(outDir, (f) => /\.(js|html|txt|json)$/.test(f)).filter((f) => !allowed(f));

/** Разметка с полезной нагрузкой RSC внутри строки JS → как в .txt. */
function raskryt(text) {
  return text.replace(/\\\\/g, '\\').replace(/\\"/g, '"');
}

/**
 * Строка полезной нагрузки RSC по номеру: длинные строки лежат
 * отдельными строками вида `2a:T1f4,<текст>` и в объекте задачи
 * заменены ссылкой «$2a». Берётся от начала строки до начала
 * следующей — этого хватает, чтобы искать в ней ответ.
 */
function stroka(text, nomer) {
  const re = new RegExp(`(?:^|\\n)${nomer}:`);
  const m = re.exec(text);
  if (m === null) {
    return '';
  }
  const from = m.index + m[0].length;
  const next = /\n[0-9a-f]+:/.exec(text.slice(from));
  return text.slice(from, next === null ? text.length : from + next.index);
}

/**
 * Окна задачи в тексте: от её идентификатора до следующего, вместе
 * со строками, на которые окно ссылается.
 */
function okna(text, id) {
  const marker = `"id":"${id}"`;
  const out = [];
  let from = text.indexOf(marker);
  while (from !== -1) {
    const next = text.indexOf('"id":"', from + marker.length);
    const okno = text.slice(from, next === -1 ? text.length : next);
    const ssylki = [...okno.matchAll(/"\$([0-9a-f]+)"/g)].map((m) => stroka(text, m[1]));
    out.push([okno, ...ssylki].join('\n'));
    from = text.indexOf(marker, from + marker.length);
  }
  return out;
}

const bad = [];
let oknaVsego = 0;
for (const file of files) {
  const rel = path.relative(outDir, file);
  const text = raskryt(fs.readFileSync(file, 'utf8'));
  const problemy = [];

  /* След целого банка. */
  const fields = FIELDS.filter((f) => text.includes(f));
  if (fields.length > 0) {
    problemy.push(`поля прототипа: ${fields.join(' ')}`);
  }
  const hits = marks.filter((m) => text.includes(m.text)).map((h) => h.id);
  if (hits.length > 0) {
    problemy.push(
      `разборы прототипов: ${hits.slice(0, 8).join(', ')}${hits.length > 8 ? ` и ещё ${hits.length - 8}` : ''}`,
    );
  }

  /* Окна задач. */
  if (!text.includes('"id":"')) {
    /* Кусок без данных задач: окон нет, дальше искать нечего. */
  } else {
    for (const zadacha of zadachi) {
      const spiski = okna(text, zadacha.id);
      if (spiski.length === 0) {
        continue;
      }
      oknaVsego += spiski.length;
      const polya = polyaShablon(zadacha.polya);
      const naydeno = new Set();
      for (const okno of spiski) {
        const pole = polya === null ? null : polya.exec(okno);
        if (pole !== null) {
          naydeno.add(`${zadacha.razdel} ${zadacha.id}: открытое поле ${pole[0]}`);
        }
        for (const otvet of zadacha.otvety) {
          for (const [chto, re] of shablony(otvet)) {
            const m = re.exec(okno);
            if (m !== null) {
              const kusok = m[0].replace(/\s+/g, ' ').slice(-70);
              naydeno.add(`${zadacha.razdel} ${zadacha.id}: ${chto} «${otvet}» — …${kusok}`);
            }
          }
        }
      }
      problemy.push(...naydeno);
    }
  }

  /* Банк тренажёра №8: по страницам раздела целиком. */
  if (rel.split(path.sep).slice(0, 2).join('/') === 'zadaniya/8') {
    for (const otvet of otvety8) {
      for (const [chto, re] of shablony(otvet)) {
        const m = re.exec(text);
        if (m !== null) {
          problemy.push(`№8 банк тренажёра: ${chto} «${otvet}» — …${m[0].slice(-70)}`);
        }
      }
    }
  }

  if (problemy.length > 0) {
    bad.push({ file: rel, problemy });
  }
}

/* Сводка: записей (прототипов и задач) и вариантов с ответами в
   каждой; у банка тренажёра №8 записи нет — его варианты отдельно. */
const poRazdelam = {};
for (const z of zadachi) {
  const s = poRazdelam[z.razdel] ?? { zapisey: 0, variantov: 0 };
  s.zapisey += 1;
  s.variantov += z.variantov;
  poRazdelam[z.razdel] = s;
}
poRazdelam['№8'].variantov += BANK_8.reduce((s, e) => s + e.variants.length, 0);
console.log(
  `Просмотрено файлов сборки: ${files.length}; окон задач в страницах: ${oknaVsego}.\n` +
    `Проверено записей банков: ${zadachi.length}, вариантов с ответами: ` +
    `${Object.values(poRazdelam).reduce((s, r) => s + r.variantov, 0)} — ` +
    Object.entries(poRazdelam)
      .map(([k, r]) => `${k}: записей ${r.zapisey}, вариантов ${r.variantov}`)
      .join('; ') +
    '.',
);
if (bad.length === 0) {
  console.log('Ответов, разборов и параметров рисунков в бандле нет.');
  process.exit(0);
}

console.error('\nВ сборку уехало то, чего там быть не должно:');
let strok = 0;
for (const row of bad) {
  console.error(`  ${row.file}`);
  for (const p of row.problemy.slice(0, 12)) {
    console.error(`    ${p}`);
  }
  if (row.problemy.length > 12) {
    console.error(`    … и ещё ${row.problemy.length - 12}`);
  }
  strok += row.problemy.length;
}
console.error(`\nФайлов с утечкой: ${bad.length}, находок: ${strok}.`);
process.exit(1);
