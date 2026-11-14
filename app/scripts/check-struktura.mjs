#!/usr/bin/env node
/* scripts/check-struktura.mjs — структура экзамена и слой соответствия.

   Запуск: pnpm test:struktura

   Проверяет src/content/struktura.js и то, что из него выводится
   (src/content/tasks.ts):

   1. Таблица разделов: коды и номера хранения не повторяются, занятые
      номера хранения (1–20) стоят на своих разделах — на них держатся
      база, ключи прогресса и коды вариантов.
   2. Каждая структура: каждый раздел либо стоит на номере ЕГЭ, либо идёт
      внутри другого, либо записан вне экзамена — и только одно из трёх.
   3. Структура из 20 заданий: номер ЕГЭ совпадает с номером хранения —
      сайт на ней показывает то же, что показывал до появления слоя.
   4. Структура из 19 заданий (ЕГЭ-2027): номера, части и баллы —
      по демоверсии; 32 первичных балла.
   5. Список заданий сайта (tasks.ts) собран по действующей структуре;
      иконка и адрес раздела — по номеру хранения.
   6. Сверка содержания для проверки редизайна (sverka-soderzhaniya.mjs):
      номер из структуры вместо цифры в тексте — то же содержание,
      другая буква, цифра или строка кода — другое. */

import { requireSrc } from './lib/load-ts.mjs';
import { toZheSoderzhanie } from './sverka-soderzhaniya.mjs';

const S = requireSrc('content/struktura.js');
const { RAZDELY, STRUKTURY, STRUKTURA } = S;

const oshibki = [];
let proverok = 0;
function ok(uslovie, chto) {
  proverok += 1;
  if (!uslovie) oshibki.push(chto);
}
function ravno(est, nado, chto) {
  ok(
    JSON.stringify(est) === JSON.stringify(nado),
    `${chto}: ${JSON.stringify(est)} ≠ ${JSON.stringify(nado)}`,
  );
}

/* ── 1. Таблица разделов ─────────────────────────────────────────── */

const kody = RAZDELY.map((r) => r.kod);
const nomera = RAZDELY.map((r) => r.hranenie);
ok(new Set(kody).size === kody.length, 'коды разделов повторяются');
ok(new Set(nomera).size === nomera.length, 'номера хранения повторяются');
ok(
  kody.every((k) => /^[a-z]+(-[a-z]+)*$/.test(k)),
  'код раздела — латиница через дефис: он же часть адреса',
);
ok(
  nomera.every((n) => Number.isInteger(n) && n >= 1 && n <= 99),
  'номер хранения — от 1 до 99: в базе и в кодах он занимает одну-две цифры',
);

/* Занятые номера хранения — навсегда: под ними записаны данные. */
const ZANYATO = {
  1: 'planimetriya',
  2: 'vektory',
  3: 'stereometriya',
  4: 'veroyatnost',
  5: 'slozhnaya-veroyatnost',
  6: 'sluchainye-velichiny',
  7: 'uravneniya',
  8: 'vychisleniya',
  9: 'proizvodnaya',
  10: 'prikladnye-zadachi',
  11: 'tekstovye-zadachi',
  12: 'grafiki-funkciy',
  13: 'ekonomika',
  14: 'uravnenie-s-otborom',
  15: 'stereometriya-dokazatelstvo',
  16: 'neravenstvo',
  17: 'optimizaciya',
  18: 'planimetriya-dokazatelstvo',
  19: 'parametr',
  20: 'chisla',
  21: 'naibolshee-naimenshee',
};
for (const [n, kod] of Object.entries(ZANYATO)) {
  ravno(S.razdel(Number(n)).kod, kod, `номер хранения ${n}`);
  ravno(S.razdel(kod).hranenie, Number(n), `раздел ${kod}`);
}
ok(
  RAZDELY.length === Object.keys(ZANYATO).length,
  'новый раздел: допишите его в ZANYATO этой проверки',
);
let upal = false;
try {
  S.razdel('net-takogo');
} catch {
  upal = true;
}
ok(upal, 'razdel() должен падать на неизвестном коде');
ok(
  S.estRazdel(7) && S.estRazdel('uravneniya') && !S.estRazdel(0) && !S.estRazdel('x'),
  'estRazdel',
);

/* ── 2. Каждая структура закрывает все разделы ───────────────────── */

for (const s of Object.values(STRUKTURY)) {
  const naNomere = s.zadaniya.map(([k]) => k);
  ok(new Set(naNomere).size === naNomere.length, `${s.id}: раздел стоит на двух номерах`);
  ok(s.chast1 > 0 && s.chast1 < s.zadaniya.length, `${s.id}: граница частей`);
  for (const { kod } of RAZDELY) {
    const gde = Number(naNomere.includes(kod)) + Number(kod in s.vnutri) + Number(kod in s.vne);
    ok(gde === 1, `${s.id}: раздел ${kod} должен стоять ровно в одном месте (номер, vnutri, vne)`);
  }
  for (const [vnutri, hozyain] of Object.entries(s.vnutri)) {
    ok(
      naNomere.includes(hozyain),
      `${s.id}: ${vnutri} идёт внутри ${hozyain}, а того нет на номере`,
    );
  }
  for (const [kod, ball] of s.zadaniya) {
    ok(kody.includes(kod), `${s.id}: нет раздела ${kod}`);
    ok(Number.isInteger(ball) && ball >= 1 && ball <= 4, `${s.id}: балл за ${kod}`);
  }
  /* Первая часть — по одному баллу. */
  ok(
    S.zadaniyaEge(s)
      .filter((z) => z.chast === 1)
      .every((z) => z.ball === 1),
    `${s.id}: в первой части по одному баллу`,
  );
  /* Все функции отвечают для каждого раздела и не падают. */
  for (const { kod, hranenie } of RAZDELY) {
    ravno(
      S.nomerEge(kod, s),
      S.nomerEge(hranenie, s),
      `${s.id}: nomerEge по коду и по номеру хранения`,
    );
    ok(S.nomerRazdela(kod, s) >= 1, `${s.id}: nomerRazdela(${kod})`);
    ok([1, 2].includes(S.chastRazdela(kod, s)), `${s.id}: chastRazdela(${kod})`);
    ok(S.maxBall(kod, s) >= 1, `${s.id}: maxBall(${kod})`);
    ravno(
      S.vEkzamene(kod, s),
      S.prichinaSkrytiya(kod, s) === null,
      `${s.id}: vEkzamene и prichinaSkrytiya(${kod})`,
    );
  }
  S.zadaniyaEge(s).forEach((z) => {
    ravno(S.razdelNomera(z.nomer, s).kod, z.kod, `${s.id}: razdelNomera(${z.nomer})`);
    ravno(S.nomerEge(z.kod, s), z.nomer, `${s.id}: nomerEge(${z.kod})`);
  });
}

/* ── 3. Структура из 20 заданий: номер ЕГЭ = номер хранения ──────── */

const S20 = STRUKTURY['2027-20'];
ravno(S20.zadaniya.length, 20, '2027-20: заданий');
for (const { kod, hranenie } of RAZDELY) {
  if (hranenie <= 20) {
    ravno(S.nomerEge(kod, S20), hranenie, `2027-20: номер ЕГЭ раздела ${kod}`);
    ravno(S.nomerRazdela(kod, S20), hranenie, `2027-20: номер для показа ${kod}`);
    ravno(S.chastRazdela(kod, S20), hranenie <= 13 ? 1 : 2, `2027-20: часть ${kod}`);
  }
}
ravno(S.nomerEge('naibolshee-naimenshee', S20), null, '2027-20: нового раздела в экзамене нет');
ravno(
  [14, 15, 16, 17, 18, 19, 20].map((n) => S.maxBall(n, S20)),
  [2, 3, 2, 2, 3, 4, 4],
  '2027-20: баллы второй части',
);
ravno(
  [S.maxPervichnyy(1, S20), S.maxPervichnyy(2, S20), S.maxPervichnyy(undefined, S20)],
  [13, 20, 33],
  '2027-20: максимумы',
);
ravno(
  [S.nomeraChasti(1, S20), S.nomeraChasti(2, S20)],
  ['1–13', '14–20'],
  '2027-20: номера частей',
);

/* ── 4. Структура из 19 заданий: демоверсия ЕГЭ-2027 ─────────────── */

const S19 = STRUKTURY['2027-19'];
const NOMERA_19 = {
  planimetriya: 1,
  vektory: 2,
  stereometriya: 3,
  veroyatnost: 4,
  'slozhnaya-veroyatnost': 5,
  uravneniya: 6,
  vychisleniya: 7,
  proizvodnaya: 8,
  'prikladnye-zadachi': 9,
  'tekstovye-zadachi': 10,
  'grafiki-funkciy': 11,
  'naibolshee-naimenshee': 12,
  'uravnenie-s-otborom': 13,
  'stereometriya-dokazatelstvo': 14,
  neravenstvo: 15,
  ekonomika: 16,
  /* Задачи на оптимизацию идут внутри экономической задачи. */
  optimizaciya: 16,
  'planimetriya-dokazatelstvo': 17,
  parametr: 18,
  chisla: 19,
  'sluchainye-velichiny': null,
};
for (const [kod, nomer] of Object.entries(NOMERA_19)) {
  ravno(S.nomerEge(kod, S19), nomer, `2027-19: номер ЕГЭ раздела ${kod}`);
}
ravno(S19.zadaniya.length, 19, '2027-19: заданий');
ravno(S19.chast1, 12, '2027-19: заданий в первой части');
ravno(
  [13, 14, 15, 16, 17, 18, 19].map((n) => S.maxBall(S.razdelNomera(n, S19).kod, S19)),
  [2, 3, 2, 2, 3, 4, 4],
  '2027-19: баллы второй части по демоверсии',
);
ravno(
  [S.maxPervichnyy(1, S19), S.maxPervichnyy(2, S19), S.maxPervichnyy(undefined, S19)],
  [12, 20, 32],
  '2027-19: максимумы',
);
ravno(
  [S.nomeraChasti(1, S19), S.nomeraChasti(2, S19)],
  ['1–12', '13–19'],
  '2027-19: номера частей',
);
/* Скрытый раздел: номера ЕГЭ нет, но страницы читаются — показывают номер хранения. */
ravno(S.nomerRazdela('sluchainye-velichiny', S19), 6, '2027-19: номер для показа скрытого раздела');
ravno(
  S.prichinaSkrytiya('sluchainye-velichiny', S19),
  'Скрыт — нет в ЕГЭ-2027',
  '2027-19: плашка скрытого раздела',
);
ravno(S.chastRazdela('ekonomika', S19), 2, '2027-19: экономика во второй части');
ravno(S.maxBall('ekonomika', S19), 2, '2027-19: экономика — 2 балла');
ravno(S.maxBall(17, S19), 2, '2027-19: задача на оптимизацию — балл экономической задачи');
ravno(S.slovoChasti('ekonomika', S19), 'вторая часть', '2027-19: слово части');
ravno(S.nomerDvumya('uravneniya', S19), '06', '2027-19: номер двумя цифрами');

/* ── 5. Список заданий сайта ─────────────────────────────────────── */

const { tasks, vseRazdely, taskIconNo, taskName } = requireSrc('content/tasks');
ravno(
  tasks.map((t) => t.kod),
  STRUKTURA.zadaniya.map(([k]) => k),
  'tasks.ts: задания банка — по действующей структуре',
);
ravno(vseRazdely.length, RAZDELY.length, 'tasks.ts: у каждого раздела есть описание');
tasks.forEach((t, i) => {
  ravno(Number(t.no), i + 1, `tasks.ts: номер ЕГЭ задания ${t.kod}`);
  ravno(t.part, S.chastRazdela(t.kod), `tasks.ts: часть задания ${t.kod}`);
});
for (const t of vseRazdely) {
  ravno(t.hranenie, S.razdel(t.kod).hranenie, `tasks.ts: номер хранения ${t.kod}`);
  /* Файл иконки — по номеру хранения; image: null — картинки ещё нет. */
  ravno(
    taskIconNo(t),
    t.image === null ? null : String(t.hranenie).padStart(2, '0'),
    `tasks.ts: файл иконки ${t.kod}`,
  );
  ok(t.name.length > 0, `tasks.ts: название ${t.kod}`);
  ravno(taskName(t.slug), t.name, `tasks.ts: название по адресу ${t.slug}`);
}
if (STRUKTURA.id === '2027-20') {
  /* До переключения: сайт показывает то же, что до появления слоя. */
  ravno(
    tasks.map((t) => `${t.no}:${t.slug}:${t.part}`),
    Array.from({ length: 20 }, (_, i) => {
      const n = i + 1;
      return `${String(n).padStart(2, '0')}:${n}:${n <= 13 ? 1 : 2}`;
    }),
    'tasks.ts: в структуре из 20 заданий номер, адрес и часть — прежние',
  );
}

/* ── 6. Сверка содержания: другая запись — не другое содержание ──── */

{
  const n = S.nomerRazdela('planimetriya');
  const bylo = [
    "import { plural } from '@/lib/plural';",
    '/* Тексты раздела. */',
    'export const TEKSTY = {',
    `  no: '${S.nomerDvumya('planimetriya')}',`,
    `  nomer: ${n},`,
    `  title: 'Задание №${n}. Планиметрия',`,
    `  chast: 'Задание №${n} · ${S.slovoChasti('planimetriya')}',`,
    "  lead: 'Ответ — число, а не \\'слово\\'.',",
    `  podpis: (k: number) => \`№${n} · задача \${k} из \${plural(k)}\`,`,
    '};',
  ].join('\n');
  const stalo = [
    "import { plural } from '@/lib/plural';",
    "import { nomerDvumya, nomerRazdela, slovoChasti } from '@/content/struktura';",
    '',
    '/* Тексты раздела: номер — из структуры экзамена. */',
    'export const TEKSTY = {',
    "  no: nomerDvumya('planimetriya'),",
    "  nomer: nomerRazdela('planimetriya'),",
    "  title: `Задание №${nomerRazdela('planimetriya')}. Планиметрия`,",
    '  chast:',
    "    `Задание №${nomerRazdela('planimetriya')} · ${slovoChasti('planimetriya')}`,",
    '  lead: "Ответ — число, а не \'слово\'.",',
    '  podpis: (k: number) =>',
    "    `№${nomerRazdela('planimetriya')} · задача ${k} из ${plural(k)}`",
    '};',
  ].join('\n');
  const sverka = (novyy) => toZheSoderzhanie(bylo, novyy, 'primer.ts').ravno;
  ok(sverka(bylo), 'сверка содержания: тот же текст');
  ok(sverka(stalo), 'сверка содержания: номер из структуры вместо цифры — то же содержание');
  const porchi = {
    'другая буква в тексте': stalo.replace('Планиметрия', 'Планиметрии'),
    'другой раздел в вызове': stalo.replace(
      "nomerRazdela('planimetriya')",
      "nomerRazdela('vektory')",
    ),
    'другое число': stalo.replace("nomer: nomerRazdela('planimetriya')", `nomer: ${n + 1}`),
    'лишний пробел в строке': stalo.replace('. Планиметрия', '.  Планиметрия'),
    'пропала строка': stalo.replace(/\n {2}lead: [^\n]+/, ''),
    'новая строка кода': stalo.replace('};', "  novoe: 'текст',\n};"),
    'другая вставка в шаблоне': stalo.replace('${plural(k)}', '${plural(k + 1)}'),
    'функция не из структуры': stalo.replace(/nomerRazdela/g, 'drugayaFunkciya'),
  };
  for (const [chto, tekst] of Object.entries(porchi)) {
    ok(tekst !== stalo && !sverka(tekst), `сверка содержания: не замечено — ${chto}`);
  }
}

if (oshibki.length > 0) {
  console.error(`Структура экзамена: ошибок — ${oshibki.length}:\n`);
  for (const o of oshibki) console.error(`  ✗ ${o}`);
  process.exit(1);
}
console.log(
  `Структура экзамена (${STRUKTURA.id}): ${proverok} проверок прошли. ` +
    `Разделов — ${RAZDELY.length}, структур — ${Object.keys(STRUKTURY).length}.`,
);
