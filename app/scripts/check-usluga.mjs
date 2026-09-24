#!/usr/bin/env node
/* scripts/check-usluga.mjs — услуга «Материалы под ключ».

   Проверяет:
   1. Формулу цены и срока (lib/usluga/raschet.ts) на утверждённых
      числах: цены четырёх пакетов, минимальный заказ, пример письма
      из §5.2 документа, срочность и её ограничения, пороги предоплаты
      и согласования, сроки в рабочих днях.
   2. Что цены на карточках пакетов совпадают с формулой.
   3. Строку загрузки (lib/usluga/zagruzka.ts): забытый файл не врёт.
   4. Что лимиты формы в content/uchitelyam.ts совпадают с лимитами
      обработчика в public/zakaz/, а у каждого кода ошибки обработчика
      есть текст для учителя.
   5. Синтаксис PHP, если php установлен (в CI он есть).

   Незаполненные реквизиты [[…]] в юридических страницах не роняют
   проверку, а перечисляются предупреждением: без них страницу
   нельзя публиковать, но собирать и смотреть — можно.

   Ненулевой код возврата — что-то разошлось. */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const require0 = createRequire(import.meta.url);

function loadTypeScript() {
  try {
    return require0('typescript');
  } catch {
    return createRequire('/opt/node22/lib/node_modules/typescript/package.json')('typescript');
  }
}

const ts = loadTypeScript();

/** Транспилирует модуль без зависимостей (только import type) и подключает его. */
function load(rel) {
  const src = path.join(root, rel);
  const out = path.join(root, `.${path.basename(rel, '.ts')}.check.cjs`);
  fs.writeFileSync(
    out,
    ts.transpileModule(fs.readFileSync(src, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
  );
  try {
    return require0(out);
  } finally {
    fs.rmSync(out, { force: true });
  }
}

const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const { poschitat, prichinyBezSrochnosti } = load('src/lib/usluga/raschet.ts');
const { prochitat } = load('src/lib/usluga/zagruzka.ts');
const { stavki, sroki } = load('src/content/uchitelyam-stavki.ts');

let failed = 0;
let passed = 0;
function check(name, ok, detail = '') {
  if (ok) {
    passed += 1;
  } else {
    failed += 1;
    console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

const Z = (over = {}) => ({
  zadach: 10,
  uroven: 'otvety',
  variantov: 1,
  rukopis: false,
  slozhnyhChertezhey: 0,
  srochnost: 'bazovyy',
  ...over,
});
const r = (over) => poschitat(Z(over), stavki, sroki);

/* ── 1. Формула ─────────────────────────────────────────────── */

const pakety = {
  nabor: { uroven: 'nabor', variantov: 1, cena: 2000, dney: 5 },
  otvety: { uroven: 'otvety', variantov: 1, cena: 2700, dney: 5 },
  resheniya: { uroven: 'resheniya', variantov: 1, cena: 4000, dney: 7 },
  chetyre: { uroven: 'otvety', variantov: 4, cena: 4500, dney: 7 },
};
for (const [id, p] of Object.entries(pakety)) {
  const x = r({ uroven: p.uroven, variantov: p.variantov });
  check(`пакет ${id}: ${p.cena} ₽`, x.itogo === p.cena, `вышло ${x.itogo}`);
  check(`пакет ${id}: ${p.dney} дней`, x.rabochihDney === p.dney, `вышло ${x.rabochihDney}`);
}

check('меньше 10 задач считается как 10', r({ zadach: 3 }).itogo === r({ zadach: 10 }).itogo);
check('у набора без ответов вариантов нет', r({ uroven: 'nabor', variantov: 4 }).itogo === 2000);

/* Пример письма из §5.2: четыре варианта, 12 задач, рукопись. */
const primer = r({ variantov: 4, zadach: 12, rukopis: true });
check('пример §5.2: 6 120 ₽', primer.itogo === 6120, `вышло ${primer.itogo}`);
check('пример §5.2: 10 рабочих дней', primer.rabochihDney === 10, `вышло ${primer.rabochihDney}`);

check('задача сверх десяти в «Наборе» — 200 ₽', r({ uroven: 'nabor', zadach: 11 }).itogo === 2200);
check(
  'вариант сверх четырёх с ответами — 600 ₽ за 10 задач',
  r({ variantov: 5 }).itogo === 4500 + 600,
);
check(
  'вариант с решениями — 1 000 ₽ за 10 задач',
  r({ uroven: 'resheniya', variantov: 2 }).itogo === 4000 + 1000,
);
check('сложный чертёж — 300 ₽', r({ slozhnyhChertezhey: 2 }).itogo === 2700 + 600);

check('48 часов — +50 %', r({ srochnost: '48' }).itogo === 4050);
check('24 часа — +100 %', r({ srochnost: '24' }).itogo === 5400);
check(
  'срочный срок — в часах',
  r({ srochnost: '24' }).chasov === 24 && r({ srochnost: '24' }).rabochihDney === null,
);

const pr = (over, srok, mesto = true) => prichinyBezSrochnosti(Z(over), srok, mesto);
check('срочно — до 10 задач', pr({ zadach: 11 }, '48').includes('zadach'));
check(
  '48 часов — до 4 вариантов',
  pr({ variantov: 4 }, '48').length === 0 && pr({ variantov: 5 }, '48').includes('variantov'),
);
check(
  '24 часа — до 2 вариантов',
  pr({ variantov: 2 }, '24').length === 0 && pr({ variantov: 3 }, '24').includes('variantov'),
);
check(
  '24 часа — без решений',
  pr({ uroven: 'resheniya' }, '24').includes('resheniya') &&
    pr({ uroven: 'resheniya' }, '48').length === 0,
);
check('срочно — без рукописи', pr({ rukopis: true }, '48').includes('rukopis'));
check('занятое место закрывает срочность', pr({}, '48', false).includes('net-mesta'));

check('5 000 ₽ — оплата целиком', r({ uroven: 'nabor', zadach: 25 }).predoplata === 'polnaya');
check('больше 5 000 ₽ — пополам', r({ uroven: 'nabor', zadach: 26 }).predoplata === 'polovina');
check(
  'от 4 000 ₽ — первая страница на согласование',
  r({ uroven: 'resheniya' }).soglasovanie && !r({}).soglasovanie,
);

check(
  'каждые начатые 10 задач — +2 дня',
  r({ zadach: 11 }).rabochihDney === 7 && r({ zadach: 21 }).rabochihDney === 9,
);
check('вариант сверх четырёх — +1 день', r({ variantov: 6 }).rabochihDney === 9);
check('рукопись — +1 день', r({ rukopis: true }).rabochihDney === 6);

/* ── 2. Карточки пакетов ────────────────────────────────────── */

const content = read('src/content/uchitelyam.ts');
const kartochki = [
  ...content.matchAll(
    /id: '(\w+)',\s*nazvanie: '[^']+',\s*cena: '([^']+)',[\s\S]*?preset: \{ uroven: '(\w+)', variantov: (\d+) \}/g,
  ),
];
check('на странице четыре пакета', kartochki.length === 4, `найдено ${kartochki.length}`);
for (const [, id, cena, uroven, variantov] of kartochki) {
  const chislo = Number(cena.replace(/\D/g, ''));
  const x = r({ uroven, variantov: Number(variantov) });
  check(
    `цена на карточке «${id}» совпадает с формулой`,
    chislo === x.itogo,
    `${chislo} против ${x.itogo}`,
  );
}

/* Опция «решения» у «Четырёх вариантов»: цена на карточке — по формуле.
   Утверждено 24.09: +2 500 ₽, ставки не меняются. */
const opciya = /Решения — опция, \+([\d\u00A0 ]+)₽ за четыре варианта/.exec(content);
const opciyaFormula = r({ uroven: 'resheniya', variantov: 4 }).itogo - r({ variantov: 4 }).itogo;
check('на карточке «Четыре варианта» указана цена решений', opciya !== null);
check(
  'цена решений на карточке совпадает с формулой',
  opciya !== null && Number(opciya[1].replace(/\D/g, '')) === opciyaFormula,
  `${opciya?.[1]} против ${opciyaFormula}`,
);
check('решения к «Четырём вариантам» — +2 500 ₽', opciyaFormula === 2500, `вышло ${opciyaFormula}`);

/* ── 3. Строка загрузки ─────────────────────────────────────── */

const den = new Date(2026, 8, 30); // среда, 30 сентября 2026
check(
  'будущая дата старта показывается',
  prochitat({ nextStart: '2026-10-05', urgentSlot: 'free', weekOf: '2026-09-28' }, den).start !==
    null,
);
check(
  'прошедшая дата старта не показывается',
  prochitat({ nextStart: '2026-09-29', urgentSlot: 'free', weekOf: '2026-09-28' }, den).start ===
    null,
);
check(
  'занято на этой неделе — занято',
  !prochitat({ nextStart: '2026-10-05', urgentSlot: 'taken', weekOf: '2026-09-28' }, den)
    .srochnoeSvobodno,
);
check(
  'занято на прошлой неделе — свободно',
  prochitat({ nextStart: '2026-10-05', urgentSlot: 'taken', weekOf: '2026-09-21' }, den)
    .srochnoeSvobodno,
);
check(
  'неделя задана средой — понимается как её неделя',
  !prochitat({ nextStart: '', urgentSlot: 'taken', weekOf: '2026-10-01' }, den).srochnoeSvobodno,
);

/* ── 4. Лимиты формы и обработчика ──────────────────────────── */

const php = read('public/zakaz/lib/nastroyki.php');
const phpProverka = read('public/zakaz/lib/proverka.php');
const userIni = read('public/zakaz/.user.ini');
const num = (re, text) => Number((re.exec(text) ?? [])[1]);

const faylovTs = num(/faylov: (\d+)/, content);
const faylovPhp = num(/ZAKAZ_MAKS_FAYLOV = (\d+)/, php);
check('не больше файлов: форма и обработчик', faylovTs === faylovPhp, `${faylovTs} и ${faylovPhp}`);
check(
  'max_file_uploads на один больше лимита — лишний файл не пропадает молча',
  num(/max_file_uploads = (\d+)/, userIni) === faylovPhp + 1,
);
check(
  '25 МБ: форма и обработчик',
  /baytVsego: 25 \* 1024 \* 1024/.test(content) && /ZAKAZ_MAKS_BAYT = 25 \* 1024 \* 1024/.test(php),
);
const rasshTs = (/rasshireniya: \[([^\]]+)\]/.exec(content)?.[1] ?? '')
  .match(/\w+/g)
  ?.sort()
  .join(',');
const rasshPhp = [
  ...(/ZAKAZ_RASSHIRENIYA = \[([\s\S]*?)\];/.exec(phpProverka)?.[1] ?? '').matchAll(/'(\w+)' =>/g),
]
  .map((m) => m[1])
  .sort()
  .join(',');
check('расширения: форма и обработчик', rasshTs === rasshPhp, `${rasshTs} и ${rasshPhp}`);

const kody = new Set();
const vsePhp = [
  'public/zakaz/otpravit.php',
  ...fs
    .readdirSync(path.join(root, 'public/zakaz/lib'))
    .filter((f) => f.endsWith('.php'))
    .map((f) => `public/zakaz/lib/${f}`),
];
for (const f of vsePhp) {
  for (const m of read(f).matchAll(/ZakazOshibka\('([a-z_]+)/g)) kody.add(m[1]);
}
for (const m of read('public/zakaz/otpravit.php').matchAll(
  /zakaz_zakonchit\([^,]+, [^,]+, '([a-z_]+)'/g,
))
  kody.add(m[1]);
kody.delete('method');
const prichiny = /prichiny: \{([\s\S]*?)\} as Record/.exec(content)?.[1] ?? '';
for (const kod of kody) {
  check(`у кода «${kod}» есть текст для учителя`, new RegExp(`\\b${kod}:`).test(prichiny));
}

/* ── 5. PHP ─────────────────────────────────────────────────── */

let phpEst = true;
try {
  execFileSync('php', ['-v'], { stdio: 'ignore' });
} catch {
  phpEst = false;
}
const phpFayly = [
  'public/zakaz/otpravit.php',
  ...fs
    .readdirSync(path.join(root, 'public/zakaz/lib'))
    .filter((f) => f.endsWith('.php'))
    .map((f) => `public/zakaz/lib/${f}`),
  'zakaz-config.example.php',
];
if (phpEst) {
  for (const f of phpFayly) {
    try {
      execFileSync('php', ['-l', path.join(root, f)], { stdio: 'pipe' });
      passed += 1;
    } catch (e) {
      failed += 1;
      console.error(`✗ синтаксис PHP: ${f}\n${e.stdout ?? ''}${e.stderr ?? ''}`);
    }
  }
} else {
  console.warn('! php не установлен — синтаксис обработчика не проверен');
}
for (const f of phpFayly.filter((f) => f.includes('/lib/'))) {
  check(`${f} не выполняется сам по себе`, read(f).includes("defined('ZAKAZ') || exit;"));
}

/* ── Предупреждения ─────────────────────────────────────────── */

const dokumenty = read('src/content/uchitelyam-dokumenty.ts');
const pusto = [...new Set([...dokumenty.matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1]))];
if (pusto.length > 0) {
  console.warn(
    `! В юридических страницах не заполнено: ${pusto.join(', ')}. До публикации заполнить.`,
  );
}
if (/uslovno: true/.test(content)) {
  console.warn(
    '! Картинки «было → стало» условные: заменить фотографией рукописного листа и четырьмя его вариантами.',
  );
}
/* Вебвизор записывает ввод в поля — на странице с формой и на юридических
   страницах его быть не должно. Счётчик один на весь сайт, поэтому
   достаточно, чтобы он всегда подключался с webvisor: false. */
const metrika = read('src/components/layout/Metrika.tsx');
check(
  'Метрика подключается с выключенным Вебвизором',
  /webvisor: false/.test(metrika) && !/webvisor: true/.test(metrika),
);
check(
  'счётчик Метрики подключается в одном месте',
  !/mc\.yandex\.ru\/metrika\/tag\.js/.test(
    [
      'src/app/uchitelyam/page.tsx',
      'src/components/uchitelyam/DokumentStranica.tsx',
      'src/app/politika-dannyh/page.tsx',
      'src/app/uchitelyam/oferta/page.tsx',
      'src/app/uchitelyam/soglasie/page.tsx',
    ]
      .map(read)
      .join('\n'),
  ),
);

if (/id: ''/.test(read('src/content/site.ts'))) {
  console.warn('! Номер счётчика Яндекс Метрики не задан: цели не считаются.');
}

console.log(`Услуга «Материалы под ключ»: ${passed} проверок прошло, ${failed} не прошло.`);
process.exit(failed > 0 ? 1 : 0);
