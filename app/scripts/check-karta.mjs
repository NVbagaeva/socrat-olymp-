#!/usr/bin/env node
/* scripts/check-karta.mjs — «Карта ЕГЭ»: состояния, рекомендация, прогноз.

   Запуск: pnpm test:karta (сборка не нужна).

   Чистые функции src/lib/karta/model.ts на трёх тестовых учениках
   (src/lib/karta/demo.ts): «пусто», «середина», «почти всё» — и на
   отдельных правилах:
     • тип освоен — три верных из последних пяти; подсказка не идёт ни в
       освоение, ни в ошибки; открытое решение — ошибка для «Стоит повторить»;
     • область освоена — не меньше 80 % типов; флажок и кольцо не вместе;
     • «Стоит повторить» — две ошибки из последних пяти или освоенное
       не решалось больше 21 дня;
     • рекомендация и путь; прогноз и порог его показа;
     • карточка пролива по связкам из content/karta/proliv.ts;
     • каталог разделов по действующей структуре экзамена (content/struktura.js):
       область у каждого задания ЕГЭ, остров у каждой области, свободные
       острова — «Будет на ЕГЭ». Запускается и со STRUKTURA_EGE=2027-20. */

import { requireSrc } from './lib/load-ts.mjs';

const K = requireSrc('lib/karta/model.ts');
const L = requireSrc('lib/progressLog/model.ts');
const D = requireSrc('lib/karta/demo.ts');
const C = requireSrc('lib/karta/katalog.ts');
const P = requireSrc('content/karta/proliv.ts');
const KONTURY = requireSrc('content/karta/kontury.json');
const M = requireSrc('lib/karta/mesta.ts');
const S = requireSrc('content/struktura.js');
const ZADANIYA = S.zadaniyaEge();
const CHAST1 = S.STRUKTURA.chast1;
const S19 = S.STRUKTURA.id === '2027-19';

let checks = 0;
const failures = [];
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
}

const DEN = 24 * 60 * 60 * 1000;
const NOW = D.DEMO_NOW;

/** Журнал из строки исходов: r — верно, h — с подсказкой, w — ошибка, v — открыл решение. */
function zhurnal(tipy, shag = 60_000, konec = NOW - DEN) {
  const bukvy = { r: 'right', h: 'hinted', w: 'wrong', v: 'revealed' };
  let log = L.EMPTY_LOG;
  let n = 0;
  const vsego = Object.values(tipy).reduce((s, t) => s + t.length, 0);
  for (const [kind, ishody] of Object.entries(tipy)) {
    for (const b of ishody) {
      n += 1;
      log = L.addAttempt(log, {
        id: `t${n}-${kind}`,
        task: `${kind}|${n}`,
        kind,
        outcome: bukvy[b],
        seconds: 40,
        at: konec - (vsego - n) * shag,
      });
    }
  }
  return log;
}

const RAZDEL = {
  no: 8,
  chast: 1,
  status: 'gotov',
  gruppy: [
    { id: 'a', nazvanie: 'А', tipy: ['a1', 'a2', 'a3'] },
    { id: 'b', nazvanie: 'Б', tipy: ['b1', 'b2'] },
  ],
};
const karta1 = (log, now = NOW) => K.postroitKartu([RAZDEL], { 8: log }, now).oblasti[0];

/* ── Тип ────────────────────────────────────────────────────────── */
{
  const t = (ishody, now = NOW) => K.sostoyaniyaTipov(zhurnal({ x: ishody }), now).get('x');
  check(t('rrr').osvoen === true, 'три верных — тип освоен');
  check(t('rr').osvoen === false, 'два верных — ещё нет');
  check(t('rrwwr').osvoen === true, 'три верных из пяти — освоен');
  check(t('rrrww').povtorit === true, 'две ошибки из последних пяти — стоит повторить');
  check(t('rrrwwrrrr').osvoen === true && t('rrrwwrrrr').povtorit === false, 'смотрим только последние пять');
  check(t('rrhhh').osvoen === false, 'верно с подсказкой в освоение не идёт');
  check(t('rrrhh').povtorit === false, 'подсказка — не ошибка для «Стоит повторить»');
  check(t('rrrvv').povtorit === true, 'открытое решение для «Стоит повторить» — ошибка');
  check(t('rrrvv').osvoen === true, 'но три верных остаются тремя верными');
  check(t('rrr').p === 0.6 && t('rrrrr').p === 1, 'доля верных: недостающие попытки — неверные');
  check(t('rrr', NOW + 19 * DEN).povtorit === false, 'освоенное 20 дней назад — повторять рано');
  check(t('rrr', NOW + 30 * DEN).povtorit === true, 'освоенное не решалось больше 21 дня — повторить');
  check(t('rr', NOW + 30 * DEN).povtorit === false, 'неосвоенное от давности не помечается');

  /* Счётчики старого формата: порядок попыток неизвестен. */
  const staryy = L.fromLegacy({ kinds: { x: { done: 7, right: 5, seconds: 100 } }, mistakes: [] }, 'u');
  const s = K.sostoyaniyaTipov(staryy, NOW).get('x');
  check(s.osvoen === true && s.popytok === 7, `старые счётчики 5 из 7 — освоен: ${JSON.stringify(s)}`);
  check(s.povtorit === false, 'у старых счётчиков нет дат и порядка — «повторить» не ставим');
  const slabyy = L.fromLegacy({ kinds: { x: { done: 6, right: 2, seconds: 100 } }, mistakes: [] }, 'u');
  check(K.sostoyaniyaTipov(slabyy, NOW).get('x').osvoen === false, 'старые счётчики 2 из 6 — не освоен');
}

/* ── Область ────────────────────────────────────────────────────── */
{
  let o = karta1(undefined);
  check(o.sostoyanie === 'ne-nachato' && o.procent === 0 && o.vsego === 5, 'без журнала — не начато');
  o = karta1(zhurnal({ a1: 'w' }));
  check(o.sostoyanie === 'v-processe' && o.procent === 0, 'одна попытка — в процессе, 0 %');
  o = karta1(zhurnal({ a1: 'rrr', a2: 'rrr', a3: 'rrr' }));
  check(o.sostoyanie === 'v-processe' && o.procent === 60, '3 типа из 5 — в процессе, 60 %');
  check(o.gruppy[0].sostoyanie === 'osvoeno' && o.gruppy[0].procent === 100, 'группа А освоена целиком');
  check(o.gruppy[1].sostoyanie === 'ne-nachato' && o.tekushchaya === 'b', 'продолжать с группы Б');
  o = karta1(zhurnal({ a1: 'rrr', a2: 'rrr', a3: 'rrr', b1: 'rrr' }));
  check(o.sostoyanie === 'osvoeno' && o.procent === 80, '4 типа из 5 (80 %) — область освоена');
  o = karta1(zhurnal({ a1: 'rrr', a2: 'rrrww', a3: 'rrr', b1: 'rrr' }));
  check(
    o.sostoyanie === 'osvoeno' && o.povtorit === true && o.povtoritGruppy.join() === 'А',
    'освоенная область с двумя свежими ошибками — метка «Стоит повторить: А»',
  );
  o = karta1(zhurnal({ chuzhoy: 'rrrrr' }));
  check(o.sostoyanie === 'ne-nachato' && o.popytok === 0, 'типы не из каталога в область не идут');
  const bezTrenazhera = K.postroitKartu([{ ...RAZDEL, status: 'pozzhe' }], { 8: zhurnal({ a1: 'rrr' }) }, NOW);
  check(bezTrenazhera.oblasti[0].sostoyanie === 'pozzhe', 'раздел без тренажёра — «прогресс появится позже»');
  const skoro = K.postroitKartu([{ ...RAZDEL, status: 'skoro', gruppy: [] }], {}, NOW);
  check(skoro.oblasti[0].sostoyanie === 'skoro' && skoro.sleduyushchaya === null, 'раздела нет — «Скоро», не рекомендуется');
}

/* ── Рекомендация и путь ────────────────────────────────────────── */
{
  const r = (no, chast = 1) => ({ no, chast, status: 'gotov', gruppy: [{ id: 'g', nazvanie: 'Г', tipy: ['t1', 't2'] }] });
  const razdely = [r(1), r(2), r(3), r(14, 2), { ...r(17, 2), status: 'skoro', gruppy: [] }];
  let k = K.postroitKartu(razdely, {}, NOW);
  check(k.sleduyushchaya === 1 && k.put.join() === '1', 'пусто: начать с №1');
  const osv = zhurnal({ t1: 'rrr', t2: 'rrr' }, 60_000, NOW - 5 * DEN);
  k = K.postroitKartu(razdely, { 1: osv }, NOW);
  check(k.sleduyushchaya === 2 && k.put.join() === '1,2', '№1 освоен — дальше №2, путь 1 → 2');
  k = K.postroitKartu(
    razdely,
    { 1: osv, 2: zhurnal({ t1: 'rw' }, 60_000, NOW - 3 * DEN), 3: zhurnal({ t1: 'r' }, 60_000, NOW - DEN) },
    NOW,
  );
  check(k.sleduyushchaya === 3, 'в процессе две области — та, что решалась позже');
  k = K.postroitKartu(razdely, { 1: osv, 2: osv, 3: osv }, NOW);
  check(k.sleduyushchaya === 14 && k.put.join() === '1,2,3,14', 'часть 1 освоена — первая неначатая части 2');
  check(k.osvoeno === 3 && k.osvoenoChast[1] === 3 && k.vsegoChast[2] === 2, 'счёт освоенных по частям');
  k = K.postroitKartu(razdely, { 1: osv, 2: osv, 3: osv, 14: osv }, NOW);
  check(k.sleduyushchaya === null && k.put.join() === '1,2,3,14', 'всё доступное освоено — рекомендации нет');
}

/* ── Каталог и контуры ──────────────────────────────────────────── */
{
  const razdely = C.KARTA_RAZDELY;
  check(KONTURY.ostrova.length === 20, 'контуров островов — 20');
  check(
    razdely.length === ZADANIYA.length,
    `в каталоге ${ZADANIYA.length} областей — по заданиям ЕГЭ: ${razdely.length}`,
  );
  check(
    razdely.map((r) => r.no).join() === ZADANIYA.map((z) => z.hranenie).join(),
    'области по порядку номеров ЕГЭ',
  );
  check(
    razdely.filter((r) => r.chast === 1).length === CHAST1 &&
      razdely.filter((r) => r.chast === 2).length === ZADANIYA.length - CHAST1,
    `часть 1 — ${CHAST1} областей, часть 2 — ${ZADANIYA.length - CHAST1}`,
  );
  const mesta = razdely.map((r) => M.ostrovRazdela(r.no));
  check(new Set(mesta).size === mesta.length, 'у каждой области свой остров');
  for (const r of razdely) {
    const mesto = M.ostrovRazdela(r.no);
    const o = KONTURY.ostrova.find((x) => x.no === mesto);
    check(o !== undefined && /^M[\d. L-]+Z$/.test(o.d), `№${r.no}: есть контур`);
    check(
      (mesto <= 13) === (r.chast === 1),
      `№${r.no}: остров на материке своей части (место ${mesto})`,
    );
    check(M.nomerNaOstrove(r.no) === S.nomerEge(r.no), `№${r.no}: на острове — номер ЕГЭ`);
    check(typeof r.nazvanie === 'string' && r.nazvanie.length > 0, `№${r.no}: есть название`);
    if (r.status === 'gotov') {
      const tipy = r.gruppy.flatMap((g) => g.tipy);
      check(r.gruppy.length > 0 && tipy.length > 0, `№${r.no}: есть группы и типы`);
      check(new Set(tipy).size === tipy.length, `№${r.no}: тип входит только в одну группу`);
      check(C.KARTA_ZHURNALY[r.no] !== undefined, `№${r.no}: есть ключ журнала`);
      check(r.gruppy.every((g) => typeof C.trenazherHref(r.no, g.id) === 'string'), `№${r.no}: у групп есть ссылка в тренажёр`);
    }
  }
  check(
    M.SVOBODNYE_OSTROVA.join() === (S19 ? '13' : ''),
    `свободные острова («Будет на ЕГЭ»): ${S19 ? '№13' : 'нет'} (вышло ${M.SVOBODNYE_OSTROVA.join() || 'нет'})`,
  );
  check(razdely.find((r) => r.no === 18)?.nazvanie === 'Планиметрия', '№18 «Планиметрия» на месте');
  check(
    razdely.filter((r) => r.status === 'skoro').map((r) => r.no).join() === (S19 ? '20' : '17,20'),
    'неоткрытые земли — по структуре',
  );
  if (S19) {
    check(!razdely.some((r) => r.no === 6), 'скрытый раздел «Случайные величины» — без острова');
    check(!razdely.some((r) => r.no === 17), 'оптимизация (внутри №16) — без своего острова');
    check(M.ostrovRazdela(21) === 12 && M.nomerNaOstrove(21) === 12, 'новый №12 — на двенадцатом острове');
    check(M.ostrovRazdela(14) === 14 && M.nomerNaOstrove(14) === 13, 'часть 2 начинается с острова 14, на нём №13');
  }
}

/* ── Три тестовых ученика ───────────────────────────────────────── */
{
  const karta = (uchenik) => K.postroitKartu(C.KARTA_RAZDELY, D.demoZhurnaly(uchenik), NOW);

  const pusto = karta('pusto');
  check(pusto.osvoeno === 0 && pusto.sleduyushchaya === 1, 'пусто: 0 освоено, начать с №1');
  check(pusto.prognoz.gotov === false, 'пусто: прогноза нет — «Решите ещё немного»');
  check(
    pusto.oblasti.every((o) => ['ne-nachato', 'pozzhe', 'skoro'].includes(o.sostoyanie)),
    'пусто: ни одной начатой области',
  );

  const seredina = karta('seredina');
  const o8 = seredina.oblasti.find((o) => o.no === 8);
  check(
    [1, 2, 3, 4].every((no) => seredina.oblasti.find((o) => o.no === no).sostoyanie === 'osvoeno'),
    'середина: №1–4 освоены',
  );
  check(seredina.osvoeno === 4, `середина: освоено 4 (вышло ${seredina.osvoeno})`);
  check(
    o8.sostoyanie === 'v-processe' && o8.osvoeno === 10 && o8.vsego === 26 && o8.procent === 38,
    `середина: №8 в процессе, 10 из 26 = 38 % (вышло ${o8.osvoeno} из ${o8.vsego}, ${o8.procent} %)`,
  );
  const g8 = Object.fromEntries(o8.gruppy.map((g) => [g.id, g.procent]));
  check(
    g8.stepeni === 100 && g8.korni === 100 && g8.logarifmy === 60 && g8.trigonometriya === 0,
    `середина: полоски №8 — 100 / 100 / 60 / 0 (вышло ${JSON.stringify(g8)})`,
  );
  check(o8.povtorit === true && o8.povtoritGruppy.join() === 'Логарифмы', 'середина: стоит повторить логарифмы');
  check(o8.tekushchaya === 'logarifmy', 'середина: продолжать с логарифмов');
  check(seredina.sleduyushchaya === 8 && seredina.put.join() === '1,2,3,4,8', 'середина: путь 1 → 2 → 3 → 4 → 8');
  check(seredina.prognoz.gotov === true, 'середина: прогноз показан');
  check(
    Math.abs(o8.p - 8.6 / 26) < 1e-9,
    `середина: доля верных по №8 — (3·1 + 4·0,8 + 0,6·3 + 0,4 + 0,2) / 26 = 8,6 / 26 (вышло ${o8.p})`,
  );
  check(
    seredina.prognoz.ball === K.testovyyBall(seredina.prognoz.pervichnyy) && seredina.prognoz.ball > 0,
    'середина: прогноз — перевод первичного балла по шкале сайта',
  );

  const pochti = karta('pochti-vsyo');
  check(pochti.osvoenoChast[1] === CHAST1, `почти всё: часть 1 освоена целиком (вышло ${pochti.osvoenoChast[1]})`);
  check(pochti.osvoeno >= 15 && pochti.osvoeno < 18, `почти всё: освоено ${pochti.osvoeno} из ${ZADANIYA.length}`);
  check(pochti.prognoz.gotov && pochti.prognoz.ball >= 70, `почти всё: прогноз ${pochti.prognoz.ball}`);
  check(
    pochti.oblasti.filter((o) => o.sostoyanie === 'skoro').length === (S19 ? 1 : 2),
    'почти всё: неоткрытые остаются «Скоро»',
  );

  /* Флажок и кольцо не показываются вместе: состояние у области одно. */
  for (const k of [pusto, seredina, pochti]) {
    check(
      k.oblasti.every((o) => !(o.sostoyanie === 'osvoeno' && o.procent < 80)),
      'освоенная область — всегда не меньше 80 %',
    );
    check(k.put.at(-1) === k.sleduyushchaya || k.sleduyushchaya === null, 'путь кончается рекомендованной областью');
  }

  /* Пролив. */
  let p = K.prolivSvodka(seredina);
  check(p.mozhno === false && p.osvoeno === 4 && p.vsego === CHAST1 && p.porog === P.PROLIV_POROG, `пролив (середина): 4 из ${CHAST1}, рано`);
  const z = (no) => p.zadaniya.find((x) => x.no === no);
  check(z(15).gotovo === true && z(18).gotovo === true, 'пролив: №15 (нужен №3) и №18 (нужен №1) — готово');
  check(
    z(14).gotovo === false && z(14).nuzhny.filter((n) => !n.gotovo).map((n) => n.no).join() === '7,8',
    'пролив: №14 — подтянуть №7 и №8',
  );
  check(z(20).nuzhny.length === 0, 'пролив: у №20 связок нет');
  p = K.prolivSvodka(pochti);
  check(p.mozhno === true && p.zadaniya.every((x) => x.gotovo), 'пролив (почти всё): можно начинать, всё готово');
}

/* ── Прогноз ────────────────────────────────────────────────────── */
{
  const max = S.maxPervichnyy();
  check(K.testovyyBall(0) === 0 && K.testovyyBall(max) === 100, `шкала: 0 → 0, ${max} → 100`);
  check(K.testovyyBall(4.4) === K.testovyyBall(4), 'первичный балл округляется');
  const r = (no) => ({ no, chast: 1, status: 'gotov', gruppy: [{ id: 'g', nazvanie: 'Г', tipy: ['t'] }] });
  const malo = K.postroitKartu([r(1), r(2), r(3)], { 1: zhurnal({ t: 'rrrrr' }) }, NOW);
  check(malo.prognoz.gotov === false, 'мало попыток и областей — прогноза нет');
  const mnogo = zhurnal({ t: 'rrrrrrrrrr' });
  const est = K.postroitKartu([r(1), r(2), r(3)], { 1: mnogo, 2: mnogo, 3: mnogo }, NOW);
  check(
    est.prognoz.gotov === true && est.prognoz.pervichnyy === 3 && est.prognoz.ball === K.testovyyBall(3),
    `три задания по одному баллу решаются уверенно — 3 первичных (вышло ${est.prognoz.pervichnyy})`,
  );
}

console.log(`Карта ЕГЭ: ${checks} проверок, не прошло ${failures.length}.`);
if (failures.length > 0) {
  for (const f of failures) console.error(`  НЕТ ${f}`);
  process.exit(1);
}
