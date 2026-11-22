#!/usr/bin/env node
/* scripts/check-progress-ekrany.mjs — расчёты экранов прогресса.

   Запуск: pnpm test:progress-ekrany (сборка не нужна).

   Чистые функции src/lib/zhurnal/ekrany.ts и links.ts:
     • период по Москве: 7, 30, 90 дней и учебный год с 1 сентября;
     • время словами, точность, ступень тепловой карты и календаря;
     • «давно не заходил»: больше 7 дней, без записей — от дня связи;
     • задания класса по порядку экзамена, клетка «ученик × задание»;
     • таблицы Excel по классу и по ученику;
     • адреса экранов кончаются на «/» и несут id в строке запроса. */

import { requireSrc } from './lib/load-ts.mjs';

const E = requireSrc('lib/zhurnal/ekrany.ts');
const L = requireSrc('lib/zhurnal/links.ts');

let checks = 0;
const failures = [];
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
}
const eq = (a, b, what) => check(JSON.stringify(a) === JSON.stringify(b), `${what}: ${JSON.stringify(a)}`);

/* ── Период ─────────────────────────────────────────────────────── */
{
  /* 22 ноября 2026, 23:30 по Москве = 20:30 UTC. */
  const now = Date.parse('2026-11-22T20:30:00Z');
  eq(E.denMsk(now), '2026-11-22', 'день по Москве вечером');
  eq(E.denMsk(Date.parse('2026-11-22T21:30:00Z')), '2026-11-23', 'после полуночи по Москве — следующий день');
  eq(E.period('7', now), { from: '2026-11-16', to: '2026-11-22' }, '7 дней включая сегодня');
  eq(E.period('30', now), { from: '2026-10-24', to: '2026-11-22' }, '30 дней');
  eq(E.period('god', now), { from: '2026-09-01', to: '2026-11-22' }, 'учебный год осенью');
  eq(E.period('god', Date.parse('2027-03-10T09:00:00Z')).from, '2026-09-01', 'учебный год весной — с прошлого сентября');
  eq(E.dneyMezhdu('2026-11-15', '2026-11-22'), 7, 'дней между днями');
}

/* ── Время, точность, ступени ───────────────────────────────────── */
{
  eq(E.vremya(0), '—', 'нет времени');
  eq(E.vremya(400), '1 с', 'меньше секунды');
  eq(E.vremya(42_000), '42 с', 'секунды');
  eq(E.vremya(12 * 60_000), '12 мин', 'минуты');
  eq(E.vremya(75 * 60_000), '1 ч 15 мин', 'часы и минуты');
  eq(E.vremya(125 * 60_000), '2 ч 05 мин', 'минуты с нулём');
  eq(E.tochnost(0, 0), null, 'точность без задач');
  eq(E.tochnost(31, 40), 78, 'точность');
  eq([[0, 0], [1, 5], [5, 10], [7, 10], [8, 10], [9, 10], [10, 10]].map(([r, s]) => E.stupenUspeha(r, s)),
    [0, 1, 2, 3, 4, 5, 5], 'ступени тепловой карты');
  eq([0, 5, 15, 45, 90].map((m) => E.stupenDnya(m * 60_000)), [0, 1, 2, 3, 4], 'ступени календаря');
}

/* ── Календарь и «давно не заходил» ─────────────────────────────── */
{
  const dni = [{ day: '2026-11-18', solved: 3, active_ms: 600_000 }];
  const vse = E.dniPerioda('2026-11-16', '2026-11-22', dni);
  check(vse.length === 7 && vse[2].solved === 3 && vse[0].solved === 0, 'календарь — все дни периода');
  check(E.dniPerioda('2026-11-16', '2026-11-22', dni, '2026-11-20').length === 3, 'календарь учителя — с дня связи');

  eq(E.posledniyDen('2026-11-22', '2026-09-01', '2026-11-22'), { dney: 0, davno: false }, 'занимался сегодня');
  eq(E.posledniyDen('2026-11-15', '2026-09-01', '2026-11-22'), { dney: 7, davno: false }, 'ровно 7 дней — ещё не давно');
  eq(E.posledniyDen('2026-11-14', '2026-09-01', '2026-11-22'), { dney: 8, davno: true }, '8 дней — давно');
  eq(E.posledniyDen(undefined, '2026-11-20', '2026-11-22'), { dney: null, davno: false }, 'новичок без записей — не давно');
  eq(E.posledniyDen(undefined, '2026-10-01', '2026-11-22'), { dney: null, davno: true }, 'без записей больше недели — давно');
  eq([0, 1, 2, 5, 11, 21, 22].map(E.dneyNazad),
    ['сегодня', 'вчера', '2 дня назад', '5 дней назад', '11 дней назад', '21 день назад', '22 дня назад'], 'дней назад словами');
}

/* ── Класс ──────────────────────────────────────────────────────── */
const klass = {
  class: { id: 'k1', name: '11 «А»' },
  ucheniki: [
    { id: 'u1', name: 'Аня', s: '2026-09-05', last_day: '2026-11-22', nedelya: { solved: 14, active_ms: 3_000_000, dni: 4 } },
    { id: 'u2', name: 'Боря', s: '2026-09-05', last_day: '2026-11-01', nedelya: { solved: 0, active_ms: 0, dni: 0 },
      ne_nachal_dz: [{ id: 'h1', title: 'ДЗ №3', due_at: null }] },
  ],
  karta: [
    { id: 'u1', task_no: 8, solved: 20, right: 18, active_ms: 1_200_000 },
    { id: 'u1', task_no: 5, solved: 10, right: 4, active_ms: 900_000 },
    { id: 'u2', task_no: 8, solved: 5, right: 5, active_ms: 100_000 },
  ],
  skryto: 0,
};
{
  eq(E.zadaniyaKlassa(klass.karta), [5, 8], 'задания класса — по порядку экзамена');
  eq(E.zadaniyaKlassa([], [8, 5]), [5, 8], 'разделы журнала показываются и без решённого');
  eq(E.kletka(klass.karta, 'u2', 5), { solved: 0, right: 0, active_ms: 0 }, 'пустая клетка');
  check(E.kletka(klass.karta, 'u1', 8).right === 18, 'клетка ученика');
  eq(E.nomerZadaniya(5), '№5', 'номер задания');
  check(E.nomerZadaniya(8) === '№7', 'раздел 8 на экзамене ЕГЭ-2027 — задание 7');

  const t = E.klassXlsx(klass, [5, 8], '2026-10-24', '2026-11-22', '2026-11-22');
  check(t.rows.length === 3 && t.rows[0][0] === 'Ученик', 'Excel класса: заголовок и строка на ученика');
  check(t.rows[0].includes('№5: решено') && t.rows[0].includes('№7: верно, %'), 'Excel класса: столбцы заданий');
  eq(t.rows[1].slice(0, 9), ['Аня', '22.11.2026', 14, 50, 4, 10, 40, 20, 90], 'Excel класса: строка ученика');
  check(String(t.rows[2][1]).includes('давно') && t.rows[2][5] === null && t.rows[2][9] === 'ДЗ №3',
    'Excel класса: давно не заходил, пустая клетка, не начатое ДЗ');
  check(t.widths.length === t.rows[0].length, 'Excel класса: ширина у каждого столбца');
}

/* ── Ученик ─────────────────────────────────────────────────────── */
{
  const uchenik = {
    id: 'u1', name: 'Аня', s: '2026-09-05', progress_allowed: true,
    svodka: {
      active_ms: 4_500_000, total_ms: 6_000_000, solved: 40, right: 31,
      po_zadaniyam: [{ task_no: 5, solved: 12, right: 8, active_ms: 1_500_000 }],
      dni: [], slabye: [],
      varianty: [{ id: 'v1', source: 'sobrat', title: 'Вариант 1', set_code: 'AB', finished_at: '2026-11-20T15:00:00Z',
        primary_score: 9, max_score: 12, test_score: 64, active_ms: 3_600_000, total_ms: 4_000_000 }],
    },
  };
  const lenta = [{ id: 'z1', task_no: 8, kind: '8.A', task_ref: '8.A|42|1', place: 'trenazher', outcome: 'wrong',
    verified: false, attempts_n: 2, hint_steps: 1, hint_wrong: [], shown_fact: false, shown_solution: false,
    skipped: false, active_ms: 95_000, total_ms: 120_000, started_at: '2026-11-22T14:00:00Z', last_answer: '0,6' }];
  const t = E.uchenikXlsx(uchenik, lenta, '2026-10-24', '2026-11-22');
  check(t.rows[0][1] === 'Аня' && t.rows[1][1] === 75 && t.rows[1][5] === 78, 'Excel ученика: имя, минуты, точность');
  check(t.rows.some((r) => r[0] === 'Вариант 1' && r[4] === 64 && r[1] === '20.11.2026'), 'Excel ученика: вариант с тестовым баллом');
  const stroka = t.rows.at(-1);
  eq(stroka, ['2026-11-22 17:00', '№7', '8.A', 'тренажёр', 'с ошибкой', '0,6', 95], 'Excel ученика: строка ленты по Москве');
  check(t.rows.every((r) => r.length === 7), 'Excel ученика: строки одной ширины');
  eq(E.iskhodSlovami({}).text, 'не закончено', 'задача без исхода');
}

/* ── Адреса ─────────────────────────────────────────────────────── */
{
  eq(L.klassProgressHref('k1'), '/kabinet/klass-progress/?id=k1', 'адрес класса');
  eq(L.uchenikHref('u1', 'k1'), '/kabinet/uchenik/?id=u1&klass=k1', 'адрес ученика');
  eq(L.uchenikHref('u1'), '/kabinet/uchenik/?id=u1', 'адрес ученика без класса');
  eq(L.zadachaUchenikaHref('u1', 'z1', null), '/kabinet/uchenik/zadacha/?id=z1&uchenik=u1', 'адрес задачи');
  eq(L.variantUchenikaHref('u1', 'v1', 'k1'), '/kabinet/uchenik/variant/?id=v1&uchenik=u1&klass=k1', 'адрес варианта');
  eq(L.pechatUchenikaHref('u1', '2026-10-24', '2026-11-22'), '/kabinet/uchenik/pechat/?id=u1&s=2026-10-24&po=2026-11-22', 'адрес листа');
  eq(L.statistikaHref(), '/kabinet/statistika/', 'адрес статистики');
}

if (failures.length > 0) {
  console.error(`Экраны прогресса: не прошло ${failures.length} из ${checks}`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`Экраны прогресса: расчёты и адреса — ${checks} проверок прошли.`);
