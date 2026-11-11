#!/usr/bin/env node
/* scripts/check-zadanie3-trening.mjs — тренажёр №3 в «Стеклянной сцене»:
   карта типов, сборка тренировок и данные прототипов.

   Без браузера и без сборки сайта: модули читаются из исходников.

     1. Карта: 7 групп, 15 типов, 92 прототипа — без пропусков и
        повторов; у каждого типа есть тексты и блок опорных задач.
     2. Каталог: ключи задач читаются обратно, источник — по таблице
        открытого банка ФИПИ.
     3. Тренировка по типам: нужное число задач без повторов, только из
        выбранных типов и источника; нерешённые идут раньше решённых.
     4. «Работа над ошибками»: аналоги — другие варианты тех же
        прототипов; задач, в которых была ошибка, среди них нет; аналог
        помнит, какую ошибку закрывает. Ошибки прежнего формата
        («P03-01:3») тоже дают аналоги.
     5. «Похожая задача»: тот же прототип, другой вариант.
     6. Данные прототипа: десять вариантов, ответ банка сходится с
        отпечатком, решение раскрывается отпечатком и его последний шаг
        несёт ответ; подсказка — вопрос; в открытом виде ответа нет.
     7. Запись тренировки: формат читается, чужое отсекается.

   Запуск: node scripts/check-zadanie3-trening.mjs */

import { requireSrc } from './lib/load-ts.mjs';

const { GRUPPY3, TIPY3, TIPY3_ORDER, prototipyTipa, tipPrototipa, tipZadachi, gruppaTipa } =
  requireSrc('content/zadanie3/gruppy.ts');
const { NAVYKI3, BLOKI3_NAZVANIYA } = requireSrc('content/zadanie3/navyki.ts');
const { BANK } = requireSrc('lib/zadanie3/index.ts');
const { FIPI_3 } = requireSrc('lib/zadanie3/fipi.ts');
const { BLOKI_3, zadachiBloka } = requireSrc('lib/stereo/opornye3/bloki.ts');
const S = requireSrc('lib/zadanie3/trening/session.ts');
const D = requireSrc('lib/zadanie3/trening/dannye.ts');
const { openText, readSealed3 } = requireSrc('lib/zadanie3/secret.ts');

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
}

/* 1. Карта. */
check(GRUPPY3.length === 7, `групп ${GRUPPY3.length}, а не 7`);
check(TIPY3_ORDER.length === 15, `типов ${TIPY3_ORDER.length}, а не 15`);
check(new Set(TIPY3_ORDER).size === TIPY3_ORDER.length, 'тип стоит в двух группах');
const vsePrototipy = TIPY3_ORDER.flatMap(prototipyTipa);
check(
  vsePrototipy.length === BANK.length,
  `в карте ${vsePrototipy.length} прототипов, в банке ${BANK.length}`,
);
check(new Set(vsePrototipy).size === vsePrototipy.length, 'прототип стоит в двух типах');
for (const p of BANK) {
  check(tipPrototipa(p.id) !== undefined, `прототип ${p.id} вне карты`);
}
const slugi = new Set(BLOKI_3.map((b) => b.slug));
for (const tip of TIPY3_ORDER) {
  const t = TIPY3[tip];
  check(
    t !== undefined && t.nazvanie !== '' && t.lead !== '' && t.opasno !== '',
    `у типа ${tip} нет текстов`,
  );
  check(
    t !== undefined && slugi.has(t.opornye),
    `у типа ${tip} блок опорных «${t?.opornye}» не существует`,
  );
  check(
    !/P03|прототип/i.test(`${t?.nazvanie} ${t?.lead}`),
    `в названии типа ${tip} — код или слово «прототип»`,
  );
  check(gruppaTipa(tip) !== undefined, `тип ${tip} без группы`);
}
/* Опорные: 7 навыков, 12 блоков по 10 задач, каждый блок — в одном навыке. */
check(NAVYKI3.length === 7, `навыков ${NAVYKI3.length}, а не 7`);
const blokiNavykov = NAVYKI3.flatMap((n) => n.bloki);
check(
  blokiNavykov.length === 12 && new Set(blokiNavykov).size === 12,
  'блоки навыков: не 12 разных',
);
for (const b of BLOKI_3) {
  check(blokiNavykov.includes(b.slug), `блок ${b.slug} не входит ни в один навык`);
  check(zadachiBloka(b.id).length === 10, `в блоке ${b.slug} не 10 задач`);
  check((BLOKI3_NAZVANIYA[b.slug] ?? '') !== '', `у блока ${b.slug} нет названия для ученика`);
  check(!/[$=]/.test(BLOKI3_NAZVANIYA[b.slug] ?? ''), `в названии блока ${b.slug} — формула`);
}

/* 2. Каталог. */
const katalog = D.katalog3();
const vse = Object.entries(katalog).flatMap(([id, k]) => k.n.map((n) => S.klyuchZadachi3(id, n)));
check(vse.length === 920 && new Set(vse).size === vse.length, `в каталоге ${vse.length} задач`);
for (const id of vse) {
  const k = S.razobratKlyuch3(id);
  check(k !== null && S.klyuchZadachi3(k.prototip, k.n) === id, `ключ ${id} не читается обратно`);
  check(
    (FIPI_3[id] !== undefined) === katalog[k.prototip].fipi.includes(k.n),
    `источник ${id} не совпадает с таблицей ФИПИ`,
  );
}
check(
  S.razobratKlyuch3('P03-01|b1') === null && S.razobratKlyuch3('8.A|x|base') === null,
  'чужой ключ прочитан',
);

/* 3. Тренировка по типам. */
for (let run = 0; run < 40; run += 1) {
  const tipy = TIPY3_ORDER.filter(() => Math.random() < 0.4);
  if (tipy.length === 0) continue;
  const istochnik = ['vse', 'fipi', 'new'][run % 3];
  const closed = new Set(vse.filter(() => Math.random() < 0.3));
  const count = [5, 10, 20, 40][run % 4];
  const tasks = S.buildByTipy(katalog, tipy, count, closed, istochnik);
  const est = S.skolkoZadach(katalog, tipy, istochnik);
  check(
    tasks.length === Math.min(count, est),
    `по типам: ${tasks.length} задач вместо ${Math.min(count, est)}`,
  );
  check(new Set(tasks.map((t) => t.id)).size === tasks.length, 'по типам: задача дважды');
  for (const t of tasks) {
    const k = S.razobratKlyuch3(t.id);
    check(tipy.includes(tipZadachi(t.id)), `по типам: ${t.id} не из выбранных типов`);
    const fipi = katalog[k.prototip].fipi.includes(k.n);
    check(
      istochnik === 'vse' || (istochnik === 'fipi') === fipi,
      `по типам: ${t.id} не из источника ${istochnik}`,
    );
  }
  /* Нерешённые — раньше: если нерешённых хватало на всю тренировку, решённых в ней нет. */
  const svobodnye = tipy.map(
    (tip) =>
      prototipyTipa(tip)
        .flatMap((id) => katalog[id].n.map((n) => S.klyuchZadachi3(id, n)))
        .filter((id) => {
          const k = S.razobratKlyuch3(id);
          const fipi = katalog[k.prototip].fipi.includes(k.n);
          return (istochnik === 'vse' || (istochnik === 'fipi') === fipi) && !closed.has(id);
        }).length,
  );
  if (svobodnye.every((n) => n >= count)) {
    check(
      tasks.every((t) => !closed.has(t.id)),
      'по типам: решённая задача при свободных нерешённых',
    );
  }
}

/* 4. Работа над ошибками. */
for (let run = 0; run < 40; run += 1) {
  const oshibki = vse
    .filter(() => Math.random() < 0.01)
    .map((task, i) => ({ task: i % 3 === 0 ? task.replace('#', ':') : task }));
  if (oshibki.length === 0) continue;
  const tasks = S.buildMistakes3(katalog, oshibki, 10);
  check(tasks.length > 0 && tasks.length <= 10, `ошибки: ${tasks.length} задач`);
  const sOshibkoy = new Set(oshibki.map((m) => m.task.replace(':', '#')));
  check(new Set(tasks.map((t) => t.id)).size === tasks.length, 'ошибки: аналог дважды');
  for (const t of tasks) {
    check(!sOshibkoy.has(t.id), `ошибки: выдана та же задача ${t.id}`);
    check(
      t.fixes !== undefined &&
        oshibki.some((m) => m.task === t.fixes) &&
        t.fixes.split(/[#:]/)[0] === t.id.split('#')[0],
      `ошибки: аналог ${t.id} не помнит свою ошибку`,
    );
  }
}

/* 5. Похожая задача и «Работа над ошибками» на итогах. */
for (const id of vse.filter((_, i) => i % 37 === 0)) {
  const a = S.analogOf3(katalog, id);
  check(a !== null && a !== id && a.split('#')[0] === id.split('#')[0], `похожая на ${id}: ${a}`);
}
{
  const payload = {
    tasks: [{ id: 'P03-01#1' }, { id: 'P03-55#2', fixes: 'P03-55#9' }],
    control: false,
  };
  const next = S.similarTrenazher3(katalog, payload, [0, 1]);
  check(
    next !== null &&
      next.tasks.length === 2 &&
      next.tasks[0].fixes === 'P03-01#1' &&
      next.tasks[1].fixes === 'P03-55#9' &&
      next.tasks.every((t) => !payload.tasks.some((old) => old.id === t.id)),
    'итоги: аналоги не новые или потеряли свою ошибку',
  );
}

/* 6. Данные прототипов. */
const num = (x) => String(x).replace('.', ',');
for (const prototype of BANK) {
  const dannye = D.dannyePrototipa(prototype.id);
  check(dannye !== null && dannye.variants.length === 10, `${prototype.id}: не десять вариантов`);
  if (dannye === null) continue;
  const open = JSON.stringify({
    ...dannye,
    variants: dannye.variants.map((v) => ({ ...v, uslovieHtml: '' })),
  });
  JSON.parse(dannye.model);
  for (const v of dannye.variants) {
    const klyuch = S.klyuchZadachi3(prototype.id, v.n);
    const variant = prototype.varianty.find((x) => x.n === v.n);
    const otvet = prototype.otvet(variant.params);
    const r = readSealed3(num(otvet), v.seal, klyuch);
    check(
      r.kind === 'answer' && r.right,
      `${klyuch}: ответ банка ${num(otvet)} не сходится с отпечатком`,
    );
    const mimo = readSealed3(num(otvet + 1), v.seal, klyuch);
    check(mimo.kind === 'answer' && !mimo.right, `${klyuch}: неверный ответ принят`);
    const shagi = JSON.parse(openText(v.reshenie, v.seal));
    check(
      Array.isArray(shagi) && shagi.length >= 2 && shagi.every((s) => s.chto.length > 3),
      `${klyuch}: решение не из шагов с подписью`,
    );
    check(
      shagi.every((s) => s.formula === '' || /^\$[^$]+\$$/.test(s.formula)),
      `${klyuch}: выкладка шага — не одна формула`,
    );
    if (v.podskazka !== null) {
      check(openText(v.podskazka, v.seal).includes('?'), `${klyuch}: подсказка — не вопрос`);
    }
    if (v.model !== null) JSON.parse(v.model);
    check(!v.uslovieHtml.includes('P03-'), `${klyuch}: в условии код прототипа`);
  }
  check(
    !open.includes('"otvet"') && !/"shagi"/.test(open),
    `${prototype.id}: в данных открытое решение`,
  );
}

/* 7. Запись тренировки. */
check(S.isTrenazher3Payload({ tasks: [{ id: 'P03-01#1' }], control: false }), 'запись не читается');
check(
  S.isTrenazher3Payload({
    tasks: [{ id: 'P03-01#1', fixes: 'P03-01:3' }],
    control: true,
    timer: false,
  }),
  'запись с аналогом не читается',
);
for (const bad of [
  null,
  { tasks: [], control: false },
  { tasks: [{ id: '8.A|s|base' }], control: false },
  { tasks: [{ id: 'P03-01#1' }] },
  { v: 1, filtr: '', rezhim: 'podskazki', seed: 'x', items: [{ k: 'P03-01#1' }] },
]) {
  check(!S.isTrenazher3Payload(bad), `чужая запись принята: ${JSON.stringify(bad)}`);
}

if (failures.length > 0) {
  console.error(`check-zadanie3-trening: ${failures.length} из ${checks} проверок не прошли`);
  failures.slice(0, 40).forEach((item) => console.error(` - ${item}`));
  process.exit(1);
}
console.log(`check-zadanie3-trening: ${checks} проверок прошли`);
