#!/usr/bin/env node
/* scripts/check-zhurnal.mjs — журнал решения задач: время и очередь.

   Запуск: pnpm test:zhurnal (сборка не нужна).

   Чистые функции src/lib/zhurnal/aktivnost.ts и model.ts:
     • активное время идёт, пока вкладка видна и есть действия;
     • после двух минут бездействия — пауза до следующего действия;
     • скрытая вкладка не считается; общее время идёт всегда;
     • счётчик продолжается после перезагрузки страницы;
     • очередь: пачка для journal_push, снимок уходит один раз, закрытие —
       только с последними событиями, изменения за время отправки не
       теряются, принятые закрытые записи из очереди уходят. */

import { requireSrc } from './lib/load-ts.mjs';

const A = requireSrc('lib/zhurnal/aktivnost.ts');
const M = requireSrc('lib/zhurnal/model.ts');

let checks = 0;
const failures = [];
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
}
const MIN = 60_000;

/* ── Активное время ─────────────────────────────────────────────── */
{
  const s = A.sozdatAktivnost(0, true);
  s.deystvie(10_000);
  s.deystvie(50_000);
  check(s.aktivnoMs(60_000) === 60_000, `минута работы: ${s.aktivnoMs(60_000)}`);
  check(s.obshcheeMs(60_000) === 60_000, 'общее за минуту');

  /* Бездействие: последний раз трогал на 50-й секунде, прошло 10 минут. */
  check(
    s.aktivnoMs(10 * MIN) === 50_000 + A.PAUZA_MS,
    `пауза через две минуты: ${s.aktivnoMs(10 * MIN)}`,
  );
  check(s.obshcheeMs(10 * MIN) === 10 * MIN, 'общее идёт и в паузе');

  /* Вернулся: счёт продолжается с действия, простой не добавляется. */
  s.deystvie(10 * MIN);
  check(
    s.aktivnoMs(10 * MIN + 30_000) === 50_000 + A.PAUZA_MS + 30_000,
    'после паузы — с действия',
  );
}
{
  /* Ровно на границе: действие через 1:59 паузу не включает. */
  const s = A.sozdatAktivnost(0, true);
  s.deystvie(119_000);
  check(s.aktivnoMs(120_000) === 120_000, 'действие до двух минут — без паузы');
}
{
  /* Скрытая вкладка. */
  const s = A.sozdatAktivnost(0, true);
  s.deystvie(5_000);
  s.vidimost(false, 20_000);
  s.deystvie(30_000);
  check(s.aktivnoMs(5 * MIN) === 20_000, `скрытая вкладка не идёт: ${s.aktivnoMs(5 * MIN)}`);
  s.vidimost(true, 5 * MIN);
  check(s.aktivnoMs(5 * MIN + 10_000) === 30_000, 'вернулся на вкладку — счёт пошёл');
  check(s.obshcheeMs(5 * MIN + 10_000) === 5 * MIN + 10_000, 'общее — всё время от показа');
}
{
  /* Задача открыта в фоновой вкладке: активное время не идёт. */
  const s = A.sozdatAktivnost(0, false);
  check(s.aktivnoMs(MIN) === 0, 'фоновая вкладка с самого начала');
}
{
  /* Перезагрузка страницы: счётчик продолжает с прежнего. */
  const s = A.sozdatAktivnost(0, true);
  s.deystvie(30_000);
  const snimok = s.snimok(40_000);
  const s2 = A.sozdatAktivnost(1_000_000, true, snimok);
  check(s2.aktivnoMs(1_020_000) === 60_000, `после перезагрузки: ${s2.aktivnoMs(1_020_000)}`);
  check(s2.obshcheeMs(1_020_000) === 60_000, 'общее после перезагрузки — без времени вне страницы');
  check(s2.aktivnoMs(1_020_000) <= s2.obshcheeMs(1_020_000), 'активное не больше общего');
}

/* ── Очередь ────────────────────────────────────────────────────── */
function zapis(id, extra = {}) {
  return {
    id,
    klyuch: `k:${id}`,
    opis: { source: 'trainer', taskNo: 8, kind: '8.A', ref: '8.A|42|1' },
    snapshot: { statement: '<p>Условие</p>' },
    startedAt: '2026-11-22T10:00:00.000Z',
    closedAt: null,
    outcome: null,
    vremya: { acc: 0, obshchee: 0 },
    events: [],
    sent: 0,
    created: false,
    dirty: true,
    touchedAt: 0,
    ...extra,
  };
}
{
  const o = { v: 1, user: 'u', zapisi: [zapis('a')], raboty: [] };
  const z = o.zapisi[0];
  M.novoeSobytie(z, 'attempt', '2026-11-22T10:00:10.000Z', 9000, { answer: ' 0,6 ', ok: false });
  M.novoeSobytie(z, 'hint_open', '2026-11-22T10:00:12.000Z', 11000);
  check(z.events.map((e) => e.seq).join() === '1,2', 'номера событий по порядку');
  check(z.events[0].answer === ' 0,6 ', 'ответ — как введён');

  const p1 = M.sobratPachku(o);
  check(
    p1.body.runs.length === 1 && p1.body.runs[0].events.length === 2,
    'первая пачка: задача и два события',
  );
  check(p1.body.runs[0].snapshot !== null, 'снимок уходит с первой пачкой');
  check(p1.body.runs[0].closed_at === null, 'открытая задача уходит открытой');

  /* Пока пачка летела, ученик ответил верно и закрыл задачу. */
  const snimki = new Map([[z.id, M.otpechatok(z)]]);
  M.novoeSobytie(z, 'attempt', '2026-11-22T10:00:30.000Z', 25000, { answer: '0,5', ok: true });
  z.closedAt = '2026-11-22T10:00:30.000Z';
  z.outcome = 'hinted';
  z.vremya = { acc: 25000, obshchee: 30000 };
  M.otmetitPrinyatoe(o, p1, snimki);
  check(
    o.zapisi.length === 1 && z.created && z.sent === 2 && z.dirty,
    'новое за время отправки осталось в очереди',
  );
  check(z.snapshot === null, 'снимок после приёма стёрт');
  check(M.novoeSobytie(z, 'skip', 'x', 0) === null, 'в закрытую задачу события не добавляются');

  const p2 = M.sobratPachku(o);
  check(
    p2.body.runs[0].events.length === 1 && p2.body.runs[0].events[0].seq === 3,
    'вторая пачка — только новое',
  );
  check(p2.body.runs[0].snapshot === null, 'снимок второй раз не уходит');
  check(
    p2.body.runs[0].closed_at !== null && p2.body.runs[0].outcome === 'hinted',
    'закрытие — с последними событиями',
  );
  check(p2.body.runs[0].active_ms === 25000 && p2.body.runs[0].total_ms === 30000, 'время в пачке');
  M.otmetitPrinyatoe(o, p2, new Map([[z.id, M.otpechatok(z)]]));
  check(o.zapisi.length === 0, 'принятая закрытая запись из очереди ушла');
  check(M.sobratPachku(o) === null, 'пустая очередь — пачки нет');
}
{
  /* Много событий: закрытие ждёт последней пачки. */
  const z = zapis('b');
  for (let i = 0; i < 250; i += 1) M.novoeSobytie(z, 'hint_step', 't', 0, { step: i % 50 });
  z.closedAt = 't';
  z.outcome = 'right';
  const o = { v: 1, user: 'u', zapisi: [z], raboty: [] };
  const p1 = M.sobratPachku(o);
  check(
    p1.body.runs[0].events.length === M.PACHKA_SOBYTIY && p1.body.runs[0].closed_at === null,
    'первая часть событий уходит без закрытия',
  );
  M.otmetitPrinyatoe(o, p1, new Map([[z.id, M.otpechatok(z)]]));
  check(o.zapisi.length === 1, 'запись ждёт остаток событий');
  const p2 = M.sobratPachku(o);
  check(
    p2.body.runs[0].events.length === 50 && p2.body.runs[0].closed_at === 't',
    'остаток — с закрытием',
  );
}
{
  /* Предел пачки и тяжёлые снимки. */
  const o = { v: 1, user: 'u', zapisi: [], raboty: [] };
  for (let i = 0; i < 60; i += 1) o.zapisi.push(zapis(`z${i}`));
  check(M.sobratPachku(o).body.runs.length === M.PACHKA_ZADACH, 'в пачке не больше предела задач');
  const t = {
    v: 1,
    user: 'u',
    zapisi: [0, 1, 2].map((i) => zapis(`t${i}`, { snapshot: { statement: 'x'.repeat(400_000) } })),
    raboty: [],
  };
  check(M.sobratPachku(t).body.runs.length === 1, 'тяжёлые снимки — по одному в пачке');

  /* Отказ навсегда: пачка убирается, остальное остаётся. */
  const p = M.sobratPachku(o);
  M.vybrositPachku(o, p);
  check(o.zapisi.length === 60 - M.PACHKA_ZADACH, 'отказанная пачка убрана, остальное на месте');

  /* Забытая открытая запись, уже принятая сервером, уходит через неделю. */
  const s = {
    v: 1,
    user: 'u',
    zapisi: [zapis('old', { created: true, dirty: false, touchedAt: 0 }), zapis('new')],
    raboty: [],
  };
  M.ubratStarye(s, M.SROK_OTKRYTOY_MS + 1);
  check(
    s.zapisi.map((z) => z.id).join() === 'new',
    'старая принятая запись убрана, неотправленная осталась',
  );
}
{
  /* Работа (вариант). */
  const r = {
    id: 'w',
    kind: 'sobrat',
    startedAt: 'a',
    finishedAt: 'b',
    primary: 7,
    max: 12,
    test: 40,
    totalMs: 9,
    activeMs: 8,
    dirty: true,
  };
  const o = { v: 1, user: 'u', zapisi: [], raboty: [r] };
  const p = M.sobratPachku(o);
  check(
    p.body.works.length === 1 && p.body.works[0].primary === 7 && p.body.works[0].test === 40,
    'работа в пачке',
  );
  M.otmetitPrinyatoe(o, p, new Map([[r.id, M.otpechatokRaboty(r)]]));
  check(o.raboty.length === 0, 'принятая работа из очереди ушла');
}

if (failures.length > 0) {
  console.error(`Журнал решения: не прошло ${failures.length} из ${checks}`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`Журнал решения: время и очередь — ${checks} проверок прошли.`);
