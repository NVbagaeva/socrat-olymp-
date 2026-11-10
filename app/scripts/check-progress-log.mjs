#!/usr/bin/env node
/* scripts/check-progress-log.mjs — журнал попыток, закладки и история.

   Запуск: pnpm test:progress-log (сборка не нужна).

   Чистые функции из src/lib/progressLog/model.ts, lib/zakladki/model.ts,
   lib/istoriya/model.ts и слияние для синхронизации
   (lib/accountSync/merge.ts):
     • прогресс по типам: решено / верно / ошибки;
     • «Стоит повторить»: две ошибки и больше в последних пяти задачах;
     • «Мои ошибки»: задача уходит после двух верных аналогов подряд,
       неверный аналог обнуляет счёт и сам в список не попадает;
     • «решено X из 260» считает разные задачи банка, не попытки;
     • перенос старого формата (счётчики) без двойного счёта;
     • слияние двух устройств: ничего не теряется и не удваивается;
     • закладки: снятая на одном устройстве не возвращается с другого;
     • тренировка, завершённая на одном устройстве, не воскресает с другого. */

import { requireSrc } from './lib/load-ts.mjs';

const L = requireSrc('lib/progressLog/model.ts');
const Z = requireSrc('lib/zakladki/model.ts');
const H = requireSrc('lib/istoriya/model.ts');
const M = requireSrc('lib/accountSync/merge.ts');

let checks = 0;
const failures = [];
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
}

let clock = 1_000_000;
function at(log, task, outcome, extra = {}) {
  clock += 1000;
  return L.addAttempt(log, {
    id: `a${clock}`,
    task,
    kind: task.split('|')[0],
    outcome,
    seconds: 30,
    at: clock,
    ...extra,
  });
}
const kindOf = (task) => task.split('|')[0];

/* ── Прогресс по типам и «Стоит повторить» ──────────────────────── */
{
  let log = L.EMPTY_LOG;
  for (const outcome of ['right', 'right', 'wrong', 'right', 'revealed']) {
    log = at(log, `8.A|s${clock}|base`, outcome);
  }
  let s = L.kindStats(log).get('8.A');
  check(s.done === 5 && s.right === 3 && s.mistakes === 2, `счётчики 8.A: ${JSON.stringify(s)}`);
  check(s.repeat === true, 'две ошибки из последних пяти — «Стоит повторить»');
  log = at(log, `8.A|s${clock}|base`, 'right');
  s = L.kindStats(log).get('8.A');
  check(s.recent.length === 5, 'смотрим только последние пять');
  check(s.repeat === true, 'ошибки всё ещё в последних пяти');
  log = at(log, `8.A|s${clock}|base`, 'right');
  log = at(log, `8.A|s${clock}|base`, 'right');
  s = L.kindStats(log).get('8.A');
  check(s.repeat === false, `после трёх верных подряд одна ошибка в пяти — не повторять: ${s.recent}`);
  /* Сведение типов в группы (у №8 — навыки). */
  log = at(log, '8.C|x1|base', 'wrong');
  log = at(log, '8.D|x2|base', 'wrong');
  const groups = L.kindStats(log, (k) => (k === '8.A' || k === '8.C' || k === '8.D' ? 'S1' : k));
  check(groups.get('S1').done === 10, 'группа складывает типы');
  check(groups.get('S1').repeat === true, 'группа: две ошибки в последних пяти задачах навыка');
  const t = L.totals(log);
  check(t.done === 10 && t.right === 6 && t.mistakes === 4, `итого: ${JSON.stringify(t)}`);
}

/* ── «Мои ошибки» и два верных аналога подряд ───────────────────── */
{
  let log = L.EMPTY_LOG;
  log = at(log, '8.A|bad|base', 'wrong');
  log = at(log, '8.B|bad2|base', 'revealed');
  log = at(log, '8.C|ok|base', 'right');
  let open = L.mistakes(log, kindOf);
  check(open.length === 2, `в ошибках две задачи: ${open.map((m) => m.task)}`);
  check(!open.some((m) => m.task === '8.C|ok|base'), 'верная задача в ошибки не попадает');

  log = at(log, '8.A|an1|base', 'right', { fixes: '8.A|bad|base' });
  open = L.mistakes(log, kindOf);
  check(open.find((m) => m.task === '8.A|bad|base')?.streak === 1, 'один верный аналог — счёт 1');
  log = at(log, '8.A|an2|base', 'wrong', { fixes: '8.A|bad|base' });
  open = L.mistakes(log, kindOf);
  check(open.find((m) => m.task === '8.A|bad|base')?.streak === 0, 'неверный аналог — счёт с нуля');
  check(!open.some((m) => m.task === '8.A|an2|base'), 'неверный аналог сам в ошибки не попадает');
  log = at(log, '8.A|an3|base', 'right', { fixes: '8.A|bad|base' });
  check(L.mistakes(log, kindOf).some((m) => m.task === '8.A|bad|base'), 'один верный после неверного — ещё в списке');
  log = at(log, '8.A|an4|base', 'right', { fixes: '8.A|bad|base' });
  open = L.mistakes(log, kindOf);
  check(!open.some((m) => m.task === '8.A|bad|base'), 'два верных аналога подряд — задача ушла');
  check(open.length === 1 && open[0].task === '8.B|bad2|base', 'вторая ошибка осталась');
  /* Верный аналог чужой ошибки ничего не закрывает. */
  log = at(log, '8.B|x|base', 'right');
  log = at(log, '8.B|y|base', 'right');
  check(L.mistakes(log, kindOf).length === 1, 'обычные верные задачи того же типа ошибку не закрывают');
}

/* ── Решено разных задач банка ──────────────────────────────────── */
{
  let log = L.EMPTY_LOG;
  const bank = (task) => task.includes('#');
  log = at(log, '8.A|8.A#1|base', 'right');
  log = at(log, '8.A|8.A#1|base', 'wrong');
  log = at(log, '8.A|8.A#2|advanced', 'wrong');
  log = at(log, '8.A|fresh|base', 'right');
  check(L.distinctSolved(log, bank) === 2, 'две разные задачи банка, хотя попыток три');
  check(L.closedTasks(log).has('8.A|8.A#1|base'), 'закрытые задачи известны: банк их не повторит');
}

/* ── Старый формат ──────────────────────────────────────────────── */
{
  const legacy = { kinds: { '8.A': { done: 7, right: 5, seconds: 210 } }, mistakes: ['8.A|old|any'], outcomes: {} };
  const log = L.fromLegacy(legacy, 'ustroystvo-1');
  const s = L.kindStats(log).get('8.A');
  check(s.done === 7 && s.right === 5 && s.mistakes === 2, `старые счётчики перенесены: ${JSON.stringify(s)}`);
  check(L.mistakes(log, kindOf).some((m) => m.task === '8.A|old|any'), 'старые ошибки перенесены');
  const twice = L.mergeLogs(log, log);
  check(L.kindStats(twice).get('8.A').done === 7, 'одно и то же устройство при слиянии не удваивается');
  const other = L.fromLegacy(legacy, 'ustroystvo-2');
  check(L.kindStats(L.mergeLogs(log, other)).get('8.A').done === 14, 'два устройства со старыми счётчиками — сумма');
  check(L.parseLog(JSON.parse(JSON.stringify(log))).archive['ustroystvo-1']['8.A'].done === 7, 'журнал переживает JSON');
}

/* ── Слияние двух устройств ─────────────────────────────────────── */
{
  let phone = L.EMPTY_LOG;
  let laptop = L.EMPTY_LOG;
  phone = at(phone, '8.A|p1|base', 'right');
  laptop = at(laptop, '8.B|l1|base', 'wrong');
  const shared = at(L.EMPTY_LOG, '8.C|both|base', 'right');
  phone = L.mergeLogs(phone, shared);
  laptop = L.mergeLogs(laptop, shared);
  const merged = L.mergeLogs(phone, laptop);
  check(merged.attempts.length === 3, `слияние: три попытки без дублей, получили ${merged.attempts.length}`);
  check(JSON.stringify(L.mergeLogs(laptop, phone)) === JSON.stringify(merged), 'слияние не зависит от порядка');
  check(L.mergeLogs(merged, merged).attempts.length === 3, 'слияние с собой ничего не меняет');
  /* Мусор не ломает журнал. */
  const parsed = L.parseLog({ attempts: [{ id: 1 }, null, 'x', merged.attempts[0]], archive: 5 });
  check(parsed.attempts.length === 1, 'испорченные записи отбрасываются');
}

/* ── Предел журнала ─────────────────────────────────────────────── */
{
  let log = L.EMPTY_LOG;
  for (let i = 0; i < L.LOG_LIMIT + 20; i += 1) log = at(log, `8.A|t${i}|base`, i % 4 === 0 ? 'wrong' : 'right');
  check(log.attempts.length === L.LOG_LIMIT, 'журнал не растёт выше предела');
  check(L.totals(log).done === L.LOG_LIMIT + 20, 'свёрнутые попытки остаются в счёте');
  const merged = L.mergeLogs(log, log);
  check(L.totals(merged).done === L.LOG_LIMIT + 20, 'свёртка не удваивается при слиянии');
  check(JSON.stringify(log).length < 300000, `журнал помещается в предел базы: ${JSON.stringify(log).length}`);
}

/* ── Закладки ───────────────────────────────────────────────────── */
{
  const item = { id: Z.bookmarkId('8', 'trenazher', '8.A|s|base'), section: '8', place: 'trenazher', ref: '8.A|s|base', title: '№8', href: '/zadaniya/8/trenazher/?zadacha=x' };
  let phone = Z.toggleBookmark(Z.EMPTY_BOOKMARKS, item, 100);
  check(Z.isBookmarked(phone, item.id), 'отложено');
  const laptop = Z.mergeBookmarks(Z.EMPTY_BOOKMARKS, phone);
  phone = Z.toggleBookmark(phone, item, 200);
  check(!Z.isBookmarked(phone, item.id), 'снято');
  const merged = Z.mergeBookmarks(laptop, phone);
  check(!Z.isBookmarked(merged, item.id), 'снятая на телефоне не вернулась с ноутбука');
  const again = Z.toggleBookmark(merged, item, 300);
  check(Z.activeBookmarks(again, '8').length === 1, 'отложить снова');
  const bad = Z.parseBookmarks({ items: [{ ...item, href: 'https://evil.example/' }, { ...item, href: '//evil' }] });
  check(bad.items.length === 0, 'закладка не уводит с сайта');
}

/* ── История и тренировка между устройствами ────────────────────── */
{
  const entry = { id: 's1', scope: '8', at: 10, total: 10, right: 7, hinted: 1, wrong: 2, skipped: 0, seconds: 300, weak: ['Свойства степеней'] };
  let a = H.addHistory(H.EMPTY_HISTORY, entry);
  const b = H.addHistory(H.EMPTY_HISTORY, { ...entry, id: 's2', at: 20, scope: '12:linear' });
  const both = H.mergeHistory(a, b);
  check(both.items.length === 2 && both.items[0].id === 's2', 'история сливается, новые сверху');
  check(H.historyOf(both, '8').length === 1, 'история раздела');
  a = H.mergeHistory(both, both);
  check(a.items.length === 2, 'без дублей');

  const session = (id, updatedAt) => JSON.stringify({ schemaVersion: 2, scope: '8', id, updatedAt, payload: {} });
  check(M.mergeSessionRaw(session('s3', 5), session('s3', 9), new Set()) === session('s3', 9), 'тренировка: новее побеждает');
  check(M.mergeSessionRaw(session('s3', 9), null, new Set()) === session('s3', 9), 'тренировка есть только здесь — остаётся');
  check(M.mergeSessionRaw(null, session('s1', 9), new Set(['s1'])) === null, 'завершённая на другом устройстве не воскресает');
  check(M.mergeSessionRaw('мусор', session('s4', 1), new Set()) === session('s4', 1), 'испорченная запись уступает');
}

/* ── Слияние по ключам ──────────────────────────────────────────── */
{
  const prep = M.mergeValue('budetege:vychisleniya-8:prep:v1', { 'P8-1': [1, 3] }, { 'P8-1': [2, 3], 'P8-2': [5] }, new Set());
  check(JSON.stringify(prep) === JSON.stringify({ 'P8-1': [1, 2, 3], 'P8-2': [5] }), `опорные: объединение ${JSON.stringify(prep)}`);
  check(M.isSyncedKey('budetege:vychisleniya-8:log:v1') && M.isSyncedKey('budetege:trainer:8:session'), 'ключи №8 синхронизируются');
  check(!M.isSyncedKey('budetege-auth') && !M.isSyncedKey('budetege:import:answers'), 'сессия входа и ответы на вопрос не синхронизируются');
}

console.log(`Журнал попыток, закладки, история и слияние: ${checks} проверок, не прошло ${failures.length}.`);
if (failures.length > 0) {
  for (const f of failures) console.error(`  НЕТ ${f}`);
  process.exit(1);
}
