#!/usr/bin/env node
/* scripts/check-komplekty.mjs — комплекты печатных листов генераторов.

   Запуск: pnpm test:komplekty [--kits N]   (по умолчанию 200 на генератор)

   Для каждого генератора с печатью (№2, №4, №5, №8, №11 и четыре
   подтемы №12) собирается N комплектов — так же, как их собирает
   экран: seed — код комплекта (lib/komplekt.ts), настройки — случайный
   набор навыков, число задач и вариантов. И проверяется:

     1. Лист ученика чистый. В рисунках условия нет пунктиров
        (stroke-dasharray), заливок (polygon), дуг (команда A в path),
        подписей с «?», безымянных отмеченных точек и точек, которых
        нет в условии; у №12 — по сцене рисунка (режим 'student',
        graph/renderer.js). Исключение одно и задокументировано: у №2
        без сетки координаты концов векторов — пунктирные проекции на
        оси (vp-proj), это данные условия, как в ФИПИ.
     2. Лист ученика и лист учителя одного комплекта: те же задачи в
        том же порядке, те же условия и те же SVG рисунков условия.
     3. Комплект, сохранённый в localStorage и прочитанный обратно,
        собирает побайтно те же условия и ответы; код комплекта
        печатается в колонтитуле.

   Ненулевой код возврата — проверка не прошла. */

import { requireSrc, SRC } from './lib/load-ts.mjs';
import { generatorVersions } from './lib/generator-versions.mjs';

const args = process.argv.slice(2);
const KITS = args.includes('--kits') ? Number(args[args.indexOf('--kits') + 1]) : 200;

/* ── localStorage на Node: строки, как в браузере ─────────────────── */
const memory = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => (memory.has(key) ? memory.get(key) : null),
    setItem: (key, value) => memory.set(key, String(value)),
    removeItem: (key) => memory.delete(key),
    key: (i) => [...memory.keys()][i] ?? null,
    get length() {
      return memory.size;
    },
  },
  addEventListener() {},
  removeEventListener() {},
};

const K = requireSrc('lib/komplekt.ts');
const { buildDocument } = requireSrc('lib/sheet/sheet.js');
const figures12 = requireSrc('lib/sheet/figures12.js');
K.setGeneratorVersions(generatorVersions(SRC));

/* Воспроизводимый случай: прогон в CI и у автора один и тот же. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sample(list, n, random) {
  const pool = [...list];
  const out = [];
  while (out.length < n && pool.length > 0) {
    out.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  }
  return out;
}

/* ── Генераторы: настройки → адреса листов → спецификации ────────── */

const G12 = requireSrc('lib/generatorSheet.ts');
const { manifest } = requireSrc('lib/generator/manifest.ts');
const S2 = requireSrc('lib/vektory/sheet2.ts');
const { PROTOTYPES } = requireSrc('lib/vektory/prototypes/index.ts');
const S4 = requireSrc('lib/veroyatnost/sheet4.ts');
const P4 = requireSrc('lib/veroyatnost/pool.ts');
const { listSlova } = requireSrc('content/veroyatnost.ts');
const S8 = requireSrc('lib/vychisleniya/sheet8.ts');
const { SKILLS: SKILLS8 } = requireSrc('lib/vychisleniya/skills.ts');
const S11 = requireSrc('lib/zadanie11/sheet11.ts');
const { dannyeTrenazhera } = requireSrc('lib/zadanie11/trenazher/dannye.ts');

const query = (href) => new URLSearchParams(href.split('?')[1] ?? '');

const generators = [];

for (const family of manifest.families) {
  const skills = family.skills.map((s) => s.id);
  if (skills.length === 0) continue;
  generators.push({
    name: `№12 ${family.id}`,
    scope: '12',
    settings: (random) => ({
      skills: sample(skills, 1 + Math.floor(random() * Math.min(3, skills.length)), random),
      count: 3 + Math.floor(random() * 6),
      variants: random() < 0.05 ? 2 : 1,
    }),
    hrefs: (s, seed) => {
      const q = G12.sheetQuery({
        skills: s.skills, count: s.count, level: null, seed, theme: 'color', layout: 'single',
        kind: '', date: '', variants: s.variants,
      });
      return { student: `/zadaniya/12/${family.id}/pechat/?${q}`, teacher: `/zadaniya/12/${family.id}/pechat/otvety/?${q}` };
    },
    spec: (href, teacher) => G12.sheetSpec(G12.parseSheetQuery(query(href)), teacher),
  });
}

generators.push({
  name: '№2',
  scope: '2',
  settings: (random) => ({
    prototypes: sample(PROTOTYPES.map((p) => p.id), 1 + Math.floor(random() * 3), random),
    count: 3 + Math.floor(random() * 5),
    variants: random() < 0.05 ? 2 : 1,
  }),
  hrefs: (s, seed) => {
    const q = S2.sheetQuery2({
      prototypes: s.prototypes, count: s.count, variants: s.variants, seed, theme: 'color',
      layout: 'single', kind: '', date: '', bank: false,
    });
    return { student: `/zadaniya/2/pechat/?${q}`, teacher: `/zadaniya/2/pechat/otvety/?${q}` };
  },
  spec: (href, teacher) => S2.sheetSpec2(S2.parseSheetQuery2(query(href)), teacher),
});

for (const zadanie of [4, 5]) {
  const pool = zadanie === 4 ? P4.bank4Pool() : P4.bank5Pool();
  const list = listSlova(zadanie);
  generators.push({
    name: `№${zadanie}`,
    scope: String(zadanie),
    settings: (random) => ({
      skills: sample(pool.kinds.map((k) => k.id), 1 + Math.floor(random() * 3), random),
      count: 3 + Math.floor(random() * 6),
      variants: random() < 0.05 ? 2 : 1,
    }),
    hrefs: (s, seed) => {
      const q = G12.sheetQuery({
        skills: s.skills, count: s.count, level: null, seed, theme: 'color', layout: 'single',
        kind: '', date: '', variants: s.variants,
      });
      return { student: `/zadaniya/${zadanie}/pechat/?${q}`, teacher: `/zadaniya/${zadanie}/pechat/otvety/?${q}` };
    },
    spec: (href, teacher) => S4.sheet4Spec(pool, S4.parseSheet4Query(query(href)), teacher, list),
  });
}

generators.push({
  name: '№8',
  scope: '8',
  settings: (random) => ({
    skills: sample(SKILLS8.map((s) => s.id), 1 + Math.floor(random() * 3), random),
    count: 3 + Math.floor(random() * 6),
  }),
  hrefs: (s, seed) => {
    const q = S8.sheetQuery8({
      skills: s.skills, count: s.count, level: null, seed, theme: 'color', layout: 'single',
      kind: '', date: '',
    });
    return { student: `/zadaniya/8/pechat/?${q}`, teacher: `/zadaniya/8/pechat/otvety/?${q}` };
  },
  spec: (href, teacher) => S8.sheetSpec8(S8.parseSheetQuery8(query(href)), teacher),
});

const bank11 = dannyeTrenazhera().bank;
const SUBTYPES_11 = ['PR-04', 'SM-04', 'DP-07', 'PT-02', 'VD-05', 'OK-01', 'RB-01', 'PG-01'];
generators.push({
  name: '№11',
  scope: '11',
  settings: (random) => ({
    sostav: sample(SUBTYPES_11, 2 + Math.floor(random() * 4), random).map((id) => ({ id, n: 1 })),
    variants: random() < 0.05 ? 2 : 1,
  }),
  hrefs: (s, seed) => {
    const q = S11.sheetQuery11({
      rezhim: 'komplekt', istochnik: 'mix', sostav: s.sostav, variants: s.variants, seed,
      zameny: {}, marshrut: 1, theme: 'color',
    });
    return { student: `/zadaniya/11/pechat/?${q}`, teacher: `/zadaniya/11/pechat/otvety/?${q}` };
  },
  spec: (href, teacher) => {
    const p = S11.parseSheetQuery11(query(href));
    return S11.sheetSpec11(p, S11.sobratList(p, bank11), teacher ? 'uchitel' : 'uchenik');
  },
});

/* ── Проверки ─────────────────────────────────────────────────── */

/* Что нельзя рисовать на листе ученика (SVG рисунка условия). */
function figureProblems(svg, allowProjections) {
  const out = [];
  const dashed = (svg.match(/<[^>]*stroke-dasharray[^>]*>/g) ?? []).filter(
    (tag) => !(allowProjections && /class="vp-proj"/.test(tag)),
  );
  if (dashed.length > 0) out.push(`пунктир: ${dashed[0].slice(0, 80)}`);
  if (/<polygon/.test(svg)) out.push('заливка (polygon)');
  if (/<path[^>]* d="[^"]*A[\d.-]/.test(svg)) out.push('дуга (A в path)');
  const texts = svg.match(/<text[^>]*>[\s\S]*?<\/text>/g) ?? [];
  if (texts.some((t) => /\?/.test(t.replace(/<[^>]*>/g, '')))) out.push('подпись с «?»');
  if (/data-hint|vp-hint-leg|chart-aux|chart-sym/.test(svg)) out.push('построение подсказки');
  return out;
}

/* №12: на рисунке ученика только точки с подписью, и подпись названа
   в условии (A, B, A(2; 3)); безымянных «удобных» узлов и отметки
   искомой точки нет. Рисунок — ровно рисунок условия в режиме
   'student' (sheet/figures12.js). */
function sceneProblems(task) {
  if (!task.scene) return [];
  const scene = figures12.conditionScene(task);
  const out = [];
  for (const point of scene.points ?? []) {
    if (!point.label || /\?/.test(point.label) || !figures12.namedInCondition(point.label, task.question)) {
      out.push(`точка «${point.label ?? ''}» не названа в условии`);
    }
  }
  if ((scene.shapes ?? []).length > 0) out.push('на рисунке условия фигуры построения');
  if ((scene.curves ?? []).some((curve) => curve.style === 'dashed')) out.push('пунктирная кривая (асимптота)');
  if (figures12.conditionSvg(task) !== task.figureSvg) out.push('рисунок условия не в режиме student');
  return out;
}

/* Плашка «откуда задача» у №11 стоит перед условием только на листе
   учителя («новая · аналог ПР-04»): это пометка для учителя, не
   условие. При сравнении условий она снимается. */
const teacherOnly = (html) => String(html ?? '').replace(/^<span class="z11-sheet-badge">[^<]*<\/span>\s*/, '');

const tasksOf = (spec) => K.specTasks(spec);
const problems = [];
let kitsTotal = 0;
let tasksTotal = 0;

for (const gen of generators) {
  const random = rng(0x5eed ^ gen.name.split('').reduce((h, c) => h * 31 + c.charCodeAt(0), 7));
  let kits = 0;
  let failed = 0;
  const started = Date.now();
  const where = (code, what) => problems.push(`${gen.name} ${code}: ${what}`);
  for (let i = 0; i < KITS; i += 1) {
    const settings = gen.settings(random);
    const kit = K.makeKit({
      scope: gen.scope, slot: gen.name, section: gen.name, count: 0, id: K.newKitId(random),
      hrefs: (seed) => gen.hrefs(settings, seed),
    });
    let student;
    let teacher;
    try {
      student = gen.spec(kit.studentHref, false);
      teacher = gen.spec(kit.teacherHref, true);
    } catch (error) {
      failed += 1;
      if (failed <= 3) where(kit.code, `лист не собрался: ${error.message}`);
      continue;
    }
    kits += 1;
    const a = tasksOf(student);
    const b = tasksOf(teacher);
    tasksTotal += a.length;
    if (a.length === 0) where(kit.code, 'на листе нет задач');

    /* 1. Лист ученика чистый. */
    a.forEach((task, n) => {
      if (task.figureSvg) {
        const noGrid = gen.scope === '2' && /class="vp-proj"/.test(task.figureSvg);
        figureProblems(task.figureSvg, noGrid).forEach((p) => where(kit.code, `задача ${n + 1}: ${p}`));
      }
      sceneProblems(task).forEach((p) => where(kit.code, `задача ${n + 1}: ${p}`));
    });

    /* 2. Ученик и учитель — одни задачи, условия и рисунки. */
    if (a.length !== b.length) where(kit.code, `задач у ученика ${a.length}, у учителя ${b.length}`);
    a.forEach((task, n) => {
      const other = b[n];
      if (other === undefined) return;
      if (task.questionHtml !== teacherOnly(other.questionHtml)) {
        where(kit.code, `задача ${n + 1}: условие у учителя другое`);
      }
      if ((task.figureSvg ?? null) !== (other.figureSvg ?? null)) {
        where(kit.code, `задача ${n + 1}: рисунок условия у учителя другой`);
      }
      if (JSON.stringify(task.options ?? null) !== JSON.stringify(other.options ?? null)) {
        where(kit.code, `задача ${n + 1}: варианты ответа у учителя другие`);
      }
    });

    /* 3. Сохранили — прочитали — те же задания и ответы. */
    const fingerprints = { student: K.sheetFingerprint(student), teacher: K.sheetFingerprint(teacher) };
    const saved = K.markDownloaded({ ...kit, fingerprints }, 'student');
    /* Кэш снимков сброшен записью: findKit читает строку из хранилища. */
    const back = K.findKit(saved.code, gen.scope);
    if (back === null) {
      where(kit.code, 'комплект не нашёлся в истории');
    } else {
      const again = gen.spec(back.teacherHref, true);
      const key = (spec) => JSON.stringify(tasksOf(spec).map((t) => [t.questionHtml, t.figureSvg ?? null, t.options ?? null, t.answer ?? null]));
      if (key(again) !== key(teacher)) where(kit.code, 'из сохранённого комплекта собрались другие задания или ответы');
      if (K.sheetFingerprint(gen.spec(back.studentHref, false)) !== back.fingerprints.student ||
          K.sheetFingerprint(again) !== back.fingerprints.teacher) {
        where(kit.code, 'отпечаток сохранённого комплекта не сошёлся');
      }
      const check = K.checkKitSheet(query(back.studentHref), gen.scope, 'student', student);
      if (check.code !== kit.code || check.warning !== null) where(kit.code, `проверка листа: ${check.warning ?? check.code}`);
      const html = buildDocument({ ...student, kit: K.kitFootLabel(check.code) }, {});
      if (!html.includes(`Комплект ${kit.code}`)) where(kit.code, 'кода комплекта нет в колонтитуле');
    }
  }
  kitsTotal += kits;
  console.log(`  ${gen.name.padEnd(16)} комплектов ${kits}/${KITS} · ${((Date.now() - started) / 1000).toFixed(1)} с`);
}

/* Истории — не больше двадцати комплектов. */
if (K.loadKits().length > K.KIT_HISTORY) problems.push(`в истории ${K.loadKits().length} комплектов`);

/* Чужая версия генератора: отпечаток не сошёлся — лист предупреждает. */
{
  const gen = generators[0];
  const kit = K.makeKit({ scope: gen.scope, slot: 'x', section: 'x', count: 0, id: 'AB12', hrefs: (seed) => gen.hrefs({ skills: [manifest.families[0].skills[0].id], count: 4, variants: 1 }, seed) });
  K.rememberKit({ ...kit, fingerprints: { student: 'другой', teacher: null }, downloaded: { student: true, teacher: false } });
  const spec = gen.spec(kit.studentHref, false);
  const check = K.checkKitSheet(query(kit.studentHref), gen.scope, 'student', spec);
  if (check.warning === null) problems.push('лист не предупредил о сменившемся генераторе');
  const old = K.kitCode('AB12', 'ZZ');
  const href = kit.studentHref.replace(kit.code, old);
  const oldCheck = K.checkKitSheet(query(href), gen.scope, 'student', spec);
  if (oldCheck.warning === null) problems.push('лист не предупредил о прежней версии в коде');
}

/* Разбор кода руками. */
for (const [text, want] of [['7k3f-2b', '7K3F-2B'], [' 7K3F 2B ', '7K3F-2B'], ['oi1l-00', '0111-00'], ['7K3F', null], ['UUUU-UU', null]]) {
  const got = K.parseKitCode(text);
  const code = got === null ? null : K.kitCode(got.id, got.version);
  if (code !== want) problems.push(`код «${text}» разобран как ${code}, а не ${want}`);
}

console.log(`комплектов: ${kitsTotal}, задач на листах учеников: ${tasksTotal}`);
if (problems.length > 0) {
  console.log(`\nРАСХОЖДЕНИЯ (${problems.length}):`);
  problems.slice(0, 60).forEach((p) => console.log('  • ' + p));
  process.exit(1);
}
console.log('расхождений: 0 — всё чисто');
