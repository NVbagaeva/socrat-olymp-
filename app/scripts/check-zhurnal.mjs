#!/usr/bin/env node
/* scripts/check-zhurnal.mjs — журнал решения задач в браузере.

   Запуск: pnpm test:zhurnal (сборка не нужна).

   Чистые функции src/lib/zhurnal (docs/kabinet-zhurnal.md):
     • активное время: идёт при видимой вкладке и действиях, после 2 минут
       бездействия — пауза, и эти 2 минуты не засчитываются; скрытая
       вкладка не считается; показ вкладки снова запускает таймер;
     • запись задачи: попытки как есть (до 40 знаков, до 20 попыток),
       неверная запись попытку не тратит, шаги подсказки и ошибки на них,
       «Показать свойство», «Показать решение», «Пропустить»;
     • исход по ходу решения — как у тренажёров;
     • закрытая задача не меняется; активное время не больше общего;
     • id записи из строки: тот же — после перезагрузки, формат UUID;
     • очередь: повтор не плодит записей, отправленная версия снимается, а
       изменённая после отправки остаётся; пачки по пределам базы;
     • разделы флага: №6 не пишется никогда, разделы вне экзамена — тоже. */

import { requireSrc } from './lib/load-ts.mjs';

const A = requireSrc('lib/zhurnal/aktivnoe.ts');
const M = requireSrc('lib/zhurnal/model.ts');
const C = requireSrc('lib/zhurnal/config.ts');

let checks = 0;
const failures = [];
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
}
const SEK = 1000;
const MIN = 60 * SEK;

/* ── Активное время ─────────────────────────────────────────────── */
{
  const t = A.aktivnyyTaymer(0);
  t.deystvie(30 * SEK);
  t.deystvie(60 * SEK);
  check(t.aktivnoe(60 * SEK) === 60 * SEK, 'две минуты с действиями — всё активно');
  check(t.aktivnoe(90 * SEK) === 60 * SEK, 'открытый промежуток входит со следующим действием');
  check(t.idet(170 * SEK), 'через 110 с после действия таймер ещё идёт');
  check(!t.idet(181 * SEK), 'через 2 минуты бездействия — пауза');
  check(t.aktivnoe(10 * MIN) === 60 * SEK, 'бездействие дольше 2 минут не засчитано, включая сами 2 минуты');
  t.deystvie(10 * MIN);
  check(t.aktivnoe(10 * MIN) === 60 * SEK, 'действие после паузы не возвращает паузу');
  t.deystvie(10 * MIN + 20 * SEK);
  check(t.aktivnoe(10 * MIN + 20 * SEK) === 80 * SEK, 'после паузы таймер снова идёт');
}
{
  const t = A.aktivnyyTaymer(0);
  let pred = 0;
  let rastet = true;
  for (let s = 0; s < 400; s += 1) {
    if (s === 50) t.deystvie(s * SEK);
    const v = t.aktivnoe(s * SEK);
    if (v < pred) rastet = false;
    pred = v;
  }
  check(rastet, 'показание не убывает, когда бездействие переходит за 2 минуты');
}
{
  const t = A.aktivnyyTaymer(0);
  t.deystvie(10 * SEK);
  t.vidimost(false, 20 * SEK);
  check(t.aktivnoe(5 * MIN) === 20 * SEK, 'скрытая вкладка не считается');
  t.deystvie(6 * MIN);
  check(t.aktivnoe(6 * MIN) === 20 * SEK, 'действие в скрытой вкладке не считается');
  t.vidimost(true, 7 * MIN);
  t.deystvie(7 * MIN + 30 * SEK);
  check(t.aktivnoe(7 * MIN + 30 * SEK) === 50 * SEK, 'показ вкладки — снова идёт');
}
{
  const t = A.aktivnyyTaymer(0, false);
  check(t.aktivnoe(MIN) === 0 && !t.idet(MIN), 'страница открыта в фоне — время не идёт');
}

/* ── Запись задачи ──────────────────────────────────────────────── */
const meta = { id: M.idIz('8|trenazher|r1|0|8.A|s1|base'), task_no: 8, kind: '8.A', task_ref: '8.A|s1|base',
  place: 'trenazher', place_ref: 'r1', level: 1 };
{
  let z = M.novayaZapis(meta, 0);
  check(z.outcome === null && z.attempts_n === 0, 'новая запись открыта и без попыток');
  z = M.sPopytkoy(z, '1/2', false, 'format', 1000);
  check(z.attempts_n === 0 && z.popytki.length === 1, 'неверная запись: попытка не тратится, но видна');
  z = M.sPopytkoy(z, ' −3,50 ', false, 'answer', 2000);
  check(z.popytki[1].answer === ' −3,50 ' && z.attempts_n === 1, 'ответ хранится как есть');
  z = M.sPopytkoy(z, 'x'.repeat(100), false, 'answer', 3000);
  check(z.popytki[2].answer.length === 40, 'ответ обрезан до 40 знаков');
  for (let i = 0; i < 30; i += 1) z = M.sPopytkoy(z, String(i), false, 'answer', 4000 + i);
  check(z.popytki.length === 20, 'не больше 20 попыток');
  check(z.popytki.every((p, i) => p.n === i + 1), 'попытки пронумерованы по порядку');
}
{
  let z = M.novayaZapis(meta, 0);
  z = M.sShagomPodskazki(z, 1);
  z = M.sShagomPodskazki(z, 3);
  z = M.sShagomPodskazki(z, 2);
  z = M.sOshibkoyPodskazki(z, 2);
  z = M.sOshibkoyPodskazki(z, 2);
  z = M.sOshibkoyPodskazki(z, 1);
  check(z.hint_steps === 3, 'открыто шагов подсказки — наибольший');
  check(JSON.stringify(z.hint_wrong) === '[1,2]', 'ошибки на шагах — без повторов, по порядку');
  z = M.sOtmetkoy(z, 'shown_fact');
  check(z.shown_fact, '«Показать свойство» отмечено');
  z = M.sPopytkoy(z, '5', true, 'answer', 1000);
  check(M.iskhodPoKhodu(z, true) === 'hinted', 'верно с подсказкой — hinted');
}
{
  let z = M.novayaZapis(meta, 0);
  z = M.sPopytkoy(z, '5', true, 'answer', 1000);
  check(M.iskhodPoKhodu(z, true) === 'right', 'верно с первой попытки — right');
  let w = M.novayaZapis(meta, 0);
  w = M.sPopytkoy(w, '4', false, 'answer', 1000);
  w = M.sPopytkoy(w, '5', true, 'answer', 2000);
  check(M.iskhodPoKhodu(w, true) === 'wrong', 'верно со второй попытки — ошибка, как у тренажёров');
  let r = M.sOtmetkoy(M.novayaZapis(meta, 0), 'shown_solution');
  check(M.iskhodPoKhodu(r, false) === 'revealed', 'решение открыто, ответа нет — revealed');
  r = M.sPopytkoy(r, '5', true, 'answer', 1000);
  check(M.iskhodPoKhodu(r, true) === 'revealed', 'верно после открытого решения — revealed');
}
{
  let z = M.novayaZapis(meta, 0);
  z = M.sVremenem(z, 50000, 40000);
  check(z.active_ms === 40000 && z.total_ms === 40000, 'активное время не больше общего');
  z = M.sVremenem(z, 10, 10);
  check(z.active_ms === 40000, 'время не убывает');
  z = M.zakryta(z, 'right', 5000, '0.5');
  check(z.outcome === 'right' && z.answer_key === '0.5' && z.closed_at !== null, 'задача закрыта с верным ответом');
  const again = M.zakryta(z, 'wrong', 9000);
  check(again === z, 'закрытая задача не закрывается второй раз');
  check(M.sPopytkoy(z, '1', false, 'answer', 9000) === z, 'закрытая задача попыток не принимает');
  const skip = M.zakryta(M.novayaZapis(meta, 0), 'skipped', 1000);
  check(skip.skipped && skip.outcome === 'skipped', '«Пропустить» отмечен');
}

/* ── id записи ──────────────────────────────────────────────────── */
{
  const a = M.idIz('8|trenazher|r1|0|8.A|s1|base');
  const b = M.idIz('8|trenazher|r1|0|8.A|s1|base');
  const c = M.idIz('8|trenazher|r1|1|8.A|s1|base');
  check(a === b, 'тот же ключ — тот же id');
  check(a !== c, 'другое место в тренировке — другой id');
  check(/^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(a), `id в формате UUID: ${a}`);
  const set = new Set();
  for (let i = 0; i < 20000; i += 1) set.add(M.idIz(`8|trenazher|r|${i}|8.A|${i}|base`));
  check(set.size === 20000, 'id не совпадают на 20 000 задачах');
  check(M.otpechatokUsloviya('a').length === 16 && M.otpechatokUsloviya('a') !== M.otpechatokUsloviya('b'),
    'отпечаток условия — 16 знаков и различает условия');
}

/* ── Очередь ────────────────────────────────────────────────────── */
{
  let q = M.PUSTAYA_OCHERED;
  let z = M.novayaZapis(meta, 0);
  q = M.vOchered(q, z);
  z = M.sPopytkoy(z, '1', false, 'answer', 1000);
  q = M.vOchered(q, z);
  check(M.razmerOcheredi(q) === 1, 'повтор той же задачи — одна запись в очереди');
  const p = M.pachka(q);
  check(p.zadachi.length === 1 && p.zadachi[0].popytki.length === 1, 'в пачке — свежая запись');
  z = M.sPopytkoy(z, '2', false, 'answer', 2000);
  const q2 = M.vOchered(q, z);
  check(M.razmerOcheredi(M.bezOtpravlennogo(q2, p)) === 1, 'изменённая после отправки запись осталась');
  check(M.razmerOcheredi(M.bezOtpravlennogo(q, p)) === 0, 'отправленная запись снята');
  check(M.pachka(M.PUSTAYA_OCHERED) === null, 'пустая очередь — пачки нет');

  let big = M.PUSTAYA_OCHERED;
  for (let i = 0; i < 120; i += 1) {
    big = M.vOchered(big, M.novayaZapis({ ...meta, id: M.idIz(`k${i}`) }, i * 1000));
  }
  check(M.pachka(big).zadachi.length === 50, 'пачка — не больше 50 задач');
  check(M.pachka(big).zadachi[0].started_at === new Date(0).toISOString(), 'старые записи уходят первыми');
  for (let i = 120; i < 700; i += 1) {
    big = M.vOchered(big, M.novayaZapis({ ...meta, id: M.idIz(`k${i}`) }, i * 1000));
  }
  check(M.razmerOcheredi(big) === M.PREDEL_OCHEREDI, 'очередь не растёт сверх предела');
  check(M.razobratOchered(JSON.parse(JSON.stringify(big))).zadachi !== undefined, 'очередь читается из хранилища');
  check(M.razmerOcheredi(M.razobratOchered({ v: 2 })) === 0, 'чужой формат — пустая очередь');
}

/* ── Вариант ────────────────────────────────────────────────────── */
{
  const V = requireSrc('lib/zhurnal/variant.ts');
  const r = {
    code: 'K7M2-1Z0GH-4F', variant: 2, mode: 'trening', title: 'Вариант 2', source: 'sobrat',
    tasks: [
      { taskNo: 5, taskId: '5:P01:3', prototypeId: '5:P01' },
      { taskNo: 8, taskId: '8.H|s1|advanced', prototypeId: '8.H' },
      { taskNo: 1, taskId: '1.A|s', prototypeId: '1.A' },
    ],
    answers: { 0: '0,25', 1: '3' }, second: { 1: '4' }, v1: { 0: 'right', 1: 'wrong' }, v2: { 1: 'right' },
    hinted: [1], steps: { 1: 2 }, times: { 0: 40000, 1: 90000, 2: 5000 },
    right: [true, false, false], key: ['0.25', '4', '7'], primary: 1, max: 3, test: 6,
    startedAt: 1_700_000_000_000, finishedAt: 1_700_000_600_000, seconds: 500,
  };
  const { variant, zadachi } = V.zapisiVarianta(r);
  check(variant.primary_score === 1 && variant.test_score === 6 && variant.active_ms === 500000,
    'вариант: баллы и активное время');
  check(variant.total_ms === 600000, 'вариант: общее время — от начала до конца');
  check(zadachi.every((z) => z.place === 'variant' && z.place_ref === variant.id), 'задачи ссылаются на вариант');
  check(zadachi[0].outcome === 'right' && zadachi[0].answer_key === '0.25' && zadachi[0].level === 2,
    'задача №5: верно, верный ответ, повышенная сложность');
  check(zadachi[1].outcome === 'wrong' && zadachi[1].popytki.length === 2 && zadachi[1].hint_steps === 2,
    'тренировка: обе попытки и подсказка, в баллы — первая');
  check(zadachi[1].level === 2, '№8 повышенного уровня — повышенная сложность');
  check(zadachi[2].outcome === 'skipped' && zadachi[2].answer_key === '7', 'без ответа — пропущено, ключ есть');
  check(V.zapisiVarianta(r).variant.id === variant.id, 'тот же вариант — тот же id: повтор без дубля');
}

/* ── Разделы флага ──────────────────────────────────────────────── */
{
  check(JSON.stringify(C.razdelyIz('5,8')) === '[5,8]', 'разделы 5,8');
  check(!C.razdelyIz('5,6,8').includes(6), '№6 не пишется, даже если стоит во флаге');
  check(JSON.stringify(C.razdelyIz(' 8 , x, 0, 99, 8')) === '[8]', 'мусор и повторы во флаге отброшены');
  const vse = C.razdelyIz(Array.from({ length: 21 }, (_, i) => i + 1).join(','));
  check(vse.length === 20 && !vse.includes(6), 'все разделы ЕГЭ-2027 — 20 номеров хранения без №6');
}

/* ── Показ: номера ЕГЭ-2027, точность, цвет, выгрузка ─────────────── */
{
  const P = requireSrc('lib/zhurnal/vid.ts');
  const X = requireSrc('lib/zhurnal/vygruzka.ts');
  check(P.podpisRazdela(8).startsWith('№7 · '), `№8 хранения — задание 7 ЕГЭ-2027: ${P.podpisRazdela(8)}`);
  check(P.podpisRazdela(5).startsWith('№5 · '), `№5 — задание 5: ${P.podpisRazdela(5)}`);
  check(JSON.stringify(P.razdelyDlyaPokaza([8, 6, 5, 1])) === '[1,5,8]', 'столбцы карты: без №6, по номерам ЕГЭ');
  check(P.tochnost(2, 2) === null && P.tochnost(2, 3) === 67, 'точность: до трёх задач — «мало»');
  check(P.stupen(0, 0) === 0 && P.stupen(1, 3) === 1 && P.stupen(1, 2) === 2 && P.stupen(7, 10) === 3
    && P.stupen(9, 10) === 4, 'ступени цвета тепловой карты');
  check(P.vremya(45000) === '45 с' && P.vremya(12 * 60000) === '12 мин' && P.vremya(65 * 60000) === '1 ч 05 мин',
    'время словами');
  check(P.sdvig('2026-03-01', 1) === '2026-02-28', 'сдвиг дня через конец февраля');
  check(P.segodnyaMsk(Date.parse('2026-11-22T22:30:00Z')) === '2026-11-23', 'сегодня — по Москве');
  check(P.dneyBez(undefined) === null, 'не заходил ни разу');
  check(P.istochnikVarianta({ source: 'mesyac', set_code: 'EV-02' }) === 'mesyac'
    && P.ISTOCHNIKI_VARIANTA.mesyac === 'Вариант месяца', 'вариант месяца — своя подпись');
  check(P.istochnikVarianta({ source: 'povyshennye', set_code: 'EV-01' }) === 'mesyac',
    'вариант месяца, записанный до миграции «повышенным», узнаётся по коду набора');
  check(P.istochnikVarianta({ source: 'povyshennye', set_code: 'PV-07' }) === 'povyshennye'
    && P.istochnikVarianta({ source: 'sobrat', set_code: 'EV-01' }) === 'sobrat',
    'остальные источники не меняются');
  const rows = X.strokiUchenika([{ id: 'a', task_no: 8, kind: '8.A', task_ref: 'x', place: 'trenazher',
    outcome: 'wrong', verified: false, attempts_n: 2, hint_steps: 1, hint_wrong: [], shown_fact: false,
    shown_solution: true, skipped: false, active_ms: 61000, total_ms: 90000,
    started_at: '2026-11-22T10:00:00Z', last_answer: '−3,5', answer_key: '-3', bystro: true }]);
  check(rows.length === 2 && rows[1][5] === '−3,5' && rows[1][6] === '-3' && rows[1][10] === 61,
    'Excel ученика: ответ как есть, верный ответ, активное время');
  check(!JSON.stringify(rows).includes('быстро'), 'в выгрузке нет пометки «очень быстро»');
  check(X.imyaFayla('Петров/Иван: 11"А"', '2026-11-01', '2026-11-22').endsWith('.xlsx')
    && !/[\\/:*?"<>|]/.test(X.imyaFayla('Петров/Иван: 11"А"', 'a', 'b')), 'имя файла без запрещённых знаков');
}

/* Сложность (В-7, этап 4): одно место на все разделы — lib/zhurnal/uroven.ts.
   Номера хранения; ЕГЭ-2027: первая часть — 1, вторая 13–17 — 2, 18–19 — 3. */
{
  const U = requireSrc('lib/zhurnal/uroven.ts');
  const zhdem = {
    1: 1, 2: 1, 3: 1, 4: 1, 5: 2, 7: 1, 8: 1, 9: 1, 10: 1, 11: 1, 12: 1, 21: 1,
    14: 2, 15: 2, 16: 2, 13: 2, 17: 2, 18: 2, 19: 3, 20: 3,
  };
  for (const [n, u] of Object.entries(zhdem)) {
    check(U.urovenZadachi(Number(n)) === u, `сложность раздела хранения №${n} — ${u} (получили ${U.urovenZadachi(Number(n))})`);
  }
  check(U.urovenZadachi(8, true) === 2 && U.urovenZadachi(7, true) === 1, '№8 повышенного типа — 2, у других признак не влияет');
  check(U.urovenZadachi(999) === 1, 'неизвестный раздел — 1');
}

/* Тренажёр по банку (этап 4б): запись задачи — lib/trening/zhurnalBanka.ts. */
{
  const B = requireSrc('lib/trening/zhurnalBanka.ts');
  const z = { id: '7-P3-12', p: 'P3', text: 'Решите уравнение $x^2=4$.' };
  const a = B.zhurnalBanka('7', z, 'trenazher', 'r1', '0');
  check(a !== null && a.task_no === 7 && a.kind === 'P3' && a.task_ref === '7-P3-12' && a.level === 1
    && a.place === 'trenazher' && a.place_ref === 'r1' && a.uslovie_tex === z.text && a.gen_hash.length > 0,
  'банк: номер, тип, задача, место, сложность, условие');
  check(B.zhurnalBanka('7', z, 'trenazher', 'r1', '0').id === a.id && B.zhurnalBanka('7', z, 'trenazher', 'r1', '1').id !== a.id,
    'банк: id одинаков у той же задачи на том же месте, другой — на другом');
  check(B.zhurnalBanka('13', z, 'trenazher', 'r1', '0').level === 2, 'банк: №13 (ЕГЭ 16) — повышенная');
  check(B.zhurnalBanka('baza-7', z, 'trenazher', 'r1', '0') === null, 'банк: раздел базы не пишется');
  check(B.zhurnalBanka('7', z, 'trenazher', 'r1', '0', '/images/z7.webp').risunok === '/images/z7.webp'
    && B.zhurnalBanka('7', z, 'trenazher', 'r1', '0', 'data:image/svg+xml,x').risunok === undefined,
  'банк: картинка — только файл сайта');
  check(B.zhurnalBanka('7', { ...z, text: 'x'.repeat(2500) }, 'trenazher', 'r1', '0').uslovie_tex === undefined,
    'банк: длинное условие не пишется текстом');
}

console.log(`Журнал решения задач: ${checks} проверок, не прошло ${failures.length}.`);
if (failures.length > 0) {
  for (const f of failures) console.error(`  НЕТ ${f}`);
  process.exit(1);
}
