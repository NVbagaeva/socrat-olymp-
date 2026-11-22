#!/usr/bin/env node
/* scripts/check-ege-countdown.mjs — обратный отсчёт до ЕГЭ на главной.

   Проверяет без браузера:
   1. склонения: 1 день / 2 дня / 5 дней … — для дней, часов, минут,
      секунд и глагола «остался / осталось»;
   2. состояния плашки подменой «сейчас»: за 200 дней, за 1 день, за
      5 минут, в день экзамена, после экзамена (переход к следующей
      дате), после всех дат;
   3. на часовом поясе: тот же момент даёт то же число у ученика
      в любом поясе (расчёт идёт от метки времени, а не от местных
      часов) — проверяется запуском под разными TZ;
   4. отрицательных чисел и нулей нет ни в один момент года;
   5. скрипт до загрузки кода (otschyot/doZagruzki.ts) считает то же,
      что lib/egeCountdown.ts, на тысячах моментов;
   6. фразы дня: 20–30 штук, у каждого числа дней есть подходящая.

   Запуск: node scripts/check-ege-countdown.mjs */

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { requireSrc } from './lib/load-ts.mjs';

const { EGE_CELI } = requireSrc('config/ege-countdown.ts');
const L = requireSrc('lib/egeCountdown.ts');
const { EGE_FRAZY, frazaDnya } = requireSrc('content/egeFrazy.ts');
const { RASCHYOT_JS, tochkiCeley } = requireSrc('components/landing/otschyot/doZagruzki.ts');

const problems = [];
const check = (ok, msg) => {
  if (!ok) problems.push(msg);
};
const eq = (got, want, msg) =>
  check(
    JSON.stringify(got) === JSON.stringify(want),
    `${msg}: ждали ${JSON.stringify(want)}, получили ${JSON.stringify(got)}`,
  );

/* ── 1. Склонения ── */
const FORMY = {
  1: ['день', 'час', 'минута', 'секунда', 'остался'],
  2: ['дня', 'часа', 'минуты', 'секунды', 'осталось'],
  5: ['дней', 'часов', 'минут', 'секунд', 'осталось'],
  11: ['дней', 'часов', 'минут', 'секунд', 'осталось'],
  12: ['дней', 'часов', 'минут', 'секунд', 'осталось'],
  14: ['дней', 'часов', 'минут', 'секунд', 'осталось'],
  21: ['день', 'час', 'минута', 'секунда', 'остался'],
  22: ['дня', 'часа', 'минуты', 'секунды', 'осталось'],
  25: ['дней', 'часов', 'минут', 'секунд', 'осталось'],
  101: ['день', 'час', 'минута', 'секунда', 'остался'],
  111: ['дней', 'часов', 'минут', 'секунд', 'осталось'],
};
for (const [n, want] of Object.entries(FORMY)) {
  const k = Number(n);
  eq(
    [L.slovoDney(k), L.slovoChasov(k), L.slovoMinut(k), L.slovoSekund(k), L.ostalos(k)],
    want,
    `склонение для ${n}`,
  );
}

/* ── 2. Состояния ── */
const SEK = 1000;
const MIN = 60 * SEK;
const CHAS = 60 * MIN;
const SUTKI = 24 * CHAS;
const [ege, peresdacha, sleduyushchiy] = EGE_CELI;
const start = L.mskMoment(ege.data, ege.vremya);

eq(new Date(start).toISOString(), '2027-06-07T07:00:00.000Z', 'ЕГЭ — 7 июня 2027, 10:00 МСК');

const za200 = L.sostoyanie(start - 200 * SUTKI - 3 * CHAS - 4 * MIN - 5 * SEK, EGE_CELI);
eq(
  [za200.cel.id, za200.faza, za200.dni, za200.chasy, za200.minuty, za200.sekundy],
  ['ege-2027', 'dni', 200, 3, 4, 5],
  'за 200 дней',
);
eq(L.podpis(za200), 'До ЕГЭ по математике осталось', 'подпись за 200 дней');
check(za200.progress > 0 && za200.progress < 1, 'за 200 дней кольцо года заполнено частично');

const za21 = L.sostoyanie(start - 21 * SUTKI - CHAS, EGE_CELI);
eq(L.podpis(za21), 'До ЕГЭ по математике остался', 'подпись за 21 день');

const za1 = L.sostoyanie(start - SUTKI - 30 * MIN, EGE_CELI);
eq([za1.faza, za1.dni, za1.chasy, za1.minuty], ['dni', 1, 0, 30], 'за 1 день и 30 минут');
eq(L.podpis(za1), 'До ЕГЭ по математике остался', 'подпись за 1 день');

/* Ровно сутки — ещё «1 день»; секундой меньше — последние сутки. */
eq(L.sostoyanie(start - SUTKI, EGE_CELI).faza, 'dni', 'ровно за сутки');
const sutki = L.sostoyanie(start - SUTKI + SEK, EGE_CELI);
eq(
  [sutki.faza, sutki.chasy, sutki.minuty, sutki.sekundy],
  ['sutki', 23, 59, 59],
  'последние сутки',
);
check(sutki.cel.zavtra === 'ЕГЭ завтра!', 'подпись последних суток — «ЕГЭ завтра!»');

/* За 5 минут до начала — уже московский день экзамена. */
const za5 = L.sostoyanie(start - 5 * MIN, EGE_CELI);
eq([za5.cel.id, za5.faza], ['ege-2027', 'segodnya'], 'за 5 минут до начала');
eq(L.slovami(za5), 'Сегодня ЕГЭ. Удачи! Ты готов(а)', 'текст дня экзамена');

/* Вечер накануне, 23:59:59 по Москве — ещё «завтра». */
const nakanune = L.mskMoment(ege.data) - SEK;
eq(L.sostoyanie(nakanune, EGE_CELI).faza, 'sutki', 'накануне в 23:59:59 МСК');
/* Полночь дня экзамена по Москве — «сегодня». */
eq(L.sostoyanie(L.mskMoment(ege.data), EGE_CELI).faza, 'segodnya', 'полночь дня экзамена МСК');
/* Экзамен идёт и уже кончился — до полуночи всё ещё «сегодня». */
eq(L.sostoyanie(start + 6 * CHAS, EGE_CELI).faza, 'segodnya', 'вечер дня экзамена');

/* Следующий день — отсчёт до пересдачи. */
const posle = L.sostoyanie(L.mskMoment(ege.data) + SUTKI, EGE_CELI);
eq([posle.cel.id, posle.faza], ['peresdacha-2027', 'dni'], 'после экзамена — пересдача');
eq(posle.dni, 31, 'на следующий день до пересдачи 31 день');
eq(L.podpis(posle), 'До пересдачи ЕГЭ по математике остался', 'подпись пересдачи, 31 день');
eq(
  L.podpis(L.sostoyanie(L.mskMoment(ege.data) + 2 * SUTKI, EGE_CELI)),
  'До пересдачи ЕГЭ по математике осталось',
  'подпись пересдачи, 30 дней',
);

/* После пересдачи — следующий учебный год. */
const posleP = L.sostoyanie(L.mskMoment(peresdacha.data) + SUTKI, EGE_CELI);
eq(posleP.cel.id, sleduyushchiy.id, 'после пересдачи — следующий год');
check(posleP.progress === 0, 'летом кольцо следующего года пустое');

/* После всех дат плашки нет. */
eq(L.sostoyanie(L.mskMoment(sleduyushchiy.data) + SUTKI, EGE_CELI), null, 'после всех дат');

/* Даты в конфиге идут по порядку. */
for (let i = 1; i < EGE_CELI.length; i += 1) {
  check(EGE_CELI[i - 1].data < EGE_CELI[i].data, `цели не по порядку: ${EGE_CELI[i].id}`);
}
check(ege.proekt === true, 'дата ЕГЭ-2027 — проект: строка под отсчётом должна быть видна');

/* ── 3. Часовой пояс ученика: тот же момент — то же табло ── */
const ZONES = ['UTC', 'Asia/Vladivostok', 'America/Los_Angeles', 'Asia/Kamchatka'];
const moment = start - 3 * SUTKI - 2 * CHAS;
const here = fileURLToPath(import.meta.url);
if (process.argv[2] === '--tz-probe') {
  const s = L.sostoyanie(Number(process.argv[3]), EGE_CELI);
  console.log(JSON.stringify([s.faza, s.dni, s.chasy, s.minuty, s.sekundy, s.den]));
  process.exit(0);
}
const vidy = ZONES.map((tz) =>
  execFileSync(process.execPath, [here, '--tz-probe', String(moment)], {
    env: { ...process.env, TZ: tz },
  })
    .toString()
    .trim(),
);
check(new Set(vidy).size === 1, `табло зависит от часового пояса: ${vidy.join(' | ')}`);

/* ── 4 и 5. Весь год по часу: нет отрицательных и нулевых, скрипт = модуль ── */
const raschyot = new Function(`return ${RASCHYOT_JS}`)();
const tochki = tochkiCeley(EGE_CELI);
const otkuda = L.mskMoment('2026-09-01');
const kuda = L.mskMoment(sleduyushchiy.data) + 2 * SUTKI;
let shagov = 0;
for (let t = otkuda; t < kuda; t += CHAS + 7 * MIN + 13 * SEK) {
  shagov += 1;
  const s = L.sostoyanie(t, EGE_CELI);
  const js = raschyot(t, tochki);
  if (!s) {
    check(js === null, `скрипт до загрузки: ${new Date(t).toISOString()} — ждали null`);
    continue;
  }
  const nums = [s.dni, s.chasy, s.minuty, s.sekundy];
  check(
    nums.every((n) => n >= 0),
    `отрицательное число: ${new Date(t).toISOString()}`,
  );
  if (s.faza === 'dni') check(s.dni >= 1, `ноль дней в фазе «дни»: ${new Date(t).toISOString()}`);
  if (s.faza === 'sutki') {
    check(
      s.dni === 0 && nums.some((n) => n > 0),
      `нули в последние сутки: ${new Date(t).toISOString()}`,
    );
  }
  const want = [s.idx, s.faza, s.dni, s.chasy, s.minuty, s.sekundy];
  check(
    JSON.stringify(js?.slice(0, 6)) === JSON.stringify(want) && Math.abs(js[6] - s.progress) < 1e-9,
    `скрипт до загрузки разошёлся: ${new Date(t).toISOString()} ${JSON.stringify(js)} ≠ ${JSON.stringify(want)}`,
  );
  if (problems.length > 20) break;
}

/* ── 6. Фразы дня ── */
check(EGE_FRAZY.length >= 20 && EGE_FRAZY.length <= 30, `фраз ${EGE_FRAZY.length}, нужно 20–30`);
for (let d = 1; d <= 400; d += 1) {
  const f = frazaDnya(d * 7, d);
  check(f.length > 0, `нет фразы для ${d} дней`);
  check(!/\b0\b|-\d/.test(f), `ноль или минус во фразе для ${d} дней: «${f}»`);
}
eq(frazaDnya(0, 111), 'Это примерно 111 вариантов, если решать по одному в день.', 'первая фраза');
eq(
  EGE_FRAZY[0].tekst(21),
  'Это примерно 21 вариант, если решать по одному в день.',
  'фраза: 21 вариант',
);

if (problems.length) {
  console.error(`Обратный отсчёт: ${problems.length} проблем(ы):`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`Обратный отсчёт: всё сходится (${shagov} моментов, ${ZONES.length} часовых пояса).`);
