#!/usr/bin/env node
/* scripts/check-baza.mjs — раздел «Базовая математика».

   Запуск: pnpm test:baza (сборка не нужна).

   1. Уровень экзамена (lib/level.ts): уровень по адресу, пара страницы
      на другом уровне, ключи хранилища — у профиля прежние, у базы свои.
   2. Список заданий базы: ровно 21, номера 01–21 по порядку, адреса
      /baza/zadaniya/N/, у каждого есть паспорт (content/baza/razdely.ts).
   3. Пары «это же задание» профиль ↔ база ведут на существующие номера.
   4. Раздел тренажёра по адресу: у базы свой («baza-5»), не «5».

   5. Проверка ответа четырёх типов: число, последовательность цифр,
      номера утверждений (порядок не важен), любое из допустимых.
   6. Шкала перевода первичного балла базы в отметку.

   7. Наполненные разделы: каждый ответ банка и опорных задач сходится с
      независимым пересчётом, отпечаток принимает верный ответ, подсказки
      и разбор целы.

   Ненулевой код возврата — расхождение, оно печатается. */

import { requireSrc } from './lib/load-ts.mjs';

const { levelOfPath, levelTwin, levelKey, levelInfo } = requireSrc('lib/level.ts');
const { tasks, tasksOf, taskHref, shortTasksOf } = requireSrc('content/tasks.ts');
const { PARY_PROFIL_BAZA } = requireSrc('content/baza/tasks.ts');
const { PASPORTA, VKLADKI_BAZY } = requireSrc('content/baza/razdely.ts');
const { scopeOfPath } = requireSrc('lib/trainerSession/scope.ts');

let checks = 0;
const failures = [];
function eq(got, want, what) {
  checks += 1;
  if (JSON.stringify(got) !== JSON.stringify(want)) {
    failures.push(`${what}: получено ${JSON.stringify(got)}, нужно ${JSON.stringify(want)}`);
  }
}

/* 1. Уровень по адресу. */
for (const [path, level] of [
  ['/', 'profile'],
  ['/zadaniya/', 'profile'],
  ['/zadaniya/4/trenazher/', 'profile'],
  ['/variant/', 'profile'],
  ['/variant/onlayn/', 'profile'],
  ['/povyshennye/', 'profile'],
  ['/baza/', 'base'],
  ['/baza', 'base'],
  ['/baza/zadaniya/', 'base'],
  ['/baza/zadaniya/5/teoriya/', 'base'],
  ['/baza/variant/', 'base'],
  ['/about/', null],
  ['/tarify/', null],
  ['/statistika/', null],
  ['/bazar/', null],
]) {
  eq(levelOfPath(path), level, `уровень адреса ${path}`);
}
for (const [path, to, twin] of [
  ['/', 'base', '/baza/'],
  ['/baza/', 'profile', '/'],
  ['/zadaniya/', 'base', '/baza/zadaniya/'],
  ['/zadaniya/4/teoriya/', 'base', '/baza/zadaniya/'],
  ['/baza/zadaniya/5/', 'profile', '/zadaniya/'],
  ['/variant/', 'base', '/baza/variant/'],
  ['/baza/variant/', 'profile', '/variant/'],
  ['/about/', 'base', '/baza/'],
  ['/about/', 'profile', '/'],
]) {
  eq(levelTwin(path, to), twin, `переключатель с ${path} на ${to}`);
}
eq(levelKey('profile', 'kartochki:5:v1'), 'kartochki:5:v1', 'ключ профиля не меняется');
eq(levelKey('base', 'kartochki:5:v1'), 'baza:kartochki:5:v1', 'ключ базы — со своим префиксом');

/* 2. Список заданий базы. */
const baza = tasksOf('base');
eq(baza.length, 21, 'в базе 21 задание');
eq(shortTasksOf('base').length, levelInfo('base').count, 'все задания базы — с кратким ответом');
baza.forEach((task, i) => {
  const n = i + 1;
  eq(task.no, String(n).padStart(2, '0'), `номер задания ${n}`);
  eq(taskHref(task), `/baza/zadaniya/${n}/`, `адрес задания базы ${n}`);
  eq(task.level, 'base', `уровень задания базы ${n}`);
  eq(typeof PASPORTA[task.slug]?.lead, 'string', `паспорт задания базы ${n}`);
});
eq(tasksOf('profile'), tasks, 'список профиля — прежний');
eq(
  tasks.map((t) => taskHref(t)),
  tasks.map((t) => `/zadaniya/${t.slug}/`),
  'адреса заданий профиля не изменились',
);
eq(VKLADKI_BAZY.map((t) => t.id).length, 6, 'у задания базы шесть вкладок');

/* 3. Пары профиль ↔ база. */
for (const [profil, bazaNo] of Object.entries(PARY_PROFIL_BAZA)) {
  eq(
    tasks.some((t) => t.slug === profil && t.part === 1),
    true,
    `пара: профиль №${profil} есть`,
  );
  eq(
    baza.some((t) => t.slug === bazaNo),
    true,
    `пара: база №${bazaNo} есть`,
  );
}
eq(
  new Set(Object.values(PARY_PROFIL_BAZA)).size,
  Object.keys(PARY_PROFIL_BAZA).length,
  'пары без повторов',
);

/* 4. Раздел тренажёра. */
eq(scopeOfPath('/zadaniya/5/trenazher/'), '5', 'раздел тренажёра профиля');
eq(scopeOfPath('/baza/zadaniya/5/trenazher/'), 'baza-5', 'раздел тренажёра базы');
eq(scopeOfPath('/zadaniya/12/linear/trenazher/'), '12:linear', 'раздел подтемы профиля');

/* 5. Проверка ответа по типу (lib/otvet/tipy.ts). */
const { proverit, normalnyeNomera } = requireSrc('lib/otvet/tipy.ts');
const kind = (input, klyuch, mode) => proverit(input, klyuch, mode).kind;
const chislo = { tip: 'chislo', otvet: '0,25' };
for (const [input, want] of [
  ['0,25', 'right'],
  ['0.25', 'right'],
  [' 0,250 ', 'right'],
  ['0,3', 'wrong'],
  ['1/4', 'fractionRight'],
  ['1/5', 'wrong'],
  ['25%', 'format'],
  ['', 'format'],
  ['abc', 'format'],
])
  eq(kind(input, chislo), want, `число: «${input}»`);
eq(kind('1/4', chislo, 'blank'), 'format', 'число в бланке: дробь — подсказка о формате');
eq(kind('-3', { tip: 'chislo', otvet: '−3' }), 'right', 'число: минус любым знаком');
const cifry = { tip: 'cifry', otvet: '4132' };
for (const [input, want] of [
  ['4132', 'right'],
  [' 4132 ', 'right'],
  ['4123', 'wrong'],
  ['1234', 'wrong'],
  ['413', 'wrong'],
  ['41324', 'wrong'],
  ['4 1 3 2', 'format'],
  ['4,1,3,2', 'format'],
  ['АБВГ', 'format'],
  ['', 'format'],
])
  eq(kind(input, cifry), want, `цифры: «${input}»`);
eq(kind('0132', { tip: 'cifry', otvet: '0132' }), 'right', 'цифры: ведущий ноль сохраняется');
eq(
  kind('132', { tip: 'cifry', otvet: '0132' }),
  'wrong',
  'цифры: без ведущего нуля — другой ответ',
);
const nomera = { tip: 'nomera', otvet: '14' };
for (const [input, want] of [
  ['14', 'right'],
  ['41', 'right'],
  ['1', 'wrong'],
  ['134', 'wrong'],
  ['23', 'wrong'],
  ['114', 'format'],
  ['1 4', 'format'],
  ['1,4', 'format'],
  ['1и4', 'format'],
  ['', 'format'],
])
  eq(kind(input, nomera), want, `номера: «${input}»`);
eq(kind('321', { tip: 'nomera', otvet: '123' }), 'right', 'номера: порядок не важен');
eq(normalnyeNomera('431'), '134', 'номера: нормальная запись — по возрастанию');
const lyuboe = { tip: 'lyuboe', otvet: '132', dopustimye: ['132', '264', '396'] };
for (const [input, want] of [
  ['132', 'right'],
  ['264', 'right'],
  ['396', 'right'],
  ['0264', 'right'],
  ['133', 'wrong'],
  ['132 или 264', 'format'],
  ['', 'format'],
])
  eq(kind(input, lyuboe), want, `любое из допустимых: «${input}»`);
eq(
  kind('132', { tip: 'lyuboe', otvet: '132' }),
  'right',
  'любое: без списка верен образцовый ответ',
);

/* 6. Шкала базы (content/baza/shkala.ts). */
const { otmetkaZa, porog, OTMETKI, BAZA_FORMAT } = requireSrc('content/baza/shkala.ts');
eq(BAZA_FORMAT, { zadaniy: 21, ball: 1, max: 21, minut: 180 }, 'формат экзамена базы');
eq(
  Array.from({ length: 22 }, (_, b) => otmetkaZa(b)).join(''),
  '2222222' + '33333' + '44444' + '55555',
  'шкала: 0–6 → 2, 7–11 → 3, 12–16 → 4, 17–21 → 5',
);
eq([otmetkaZa(-1), otmetkaZa(30)], [2, 5], 'шкала: балл вне диапазона прижат к границе');
eq([porog(3), porog(4), porog(5)], [7, 12, 17], 'пороги отметок');
eq(
  OTMETKI.reduce((n, r) => n + r.do - r.ot + 1, 0),
  22,
  'шкала покрывает 0…21 без дыр и наложений',
);

/* 7. Наполненные разделы: банк, опорные задачи, теория. */
const { napolnennyeRazdely } = requireSrc('lib/baza/razdely.ts');
const { bankRazdela, lite, KLYUCH_BAZY } = requireSrc('lib/baza/bank.ts');
const { prochitat, tipOtpechatka } = requireSrc('lib/baza/secret.ts');
const { normalizeAnswer } = requireSrc('lib/otvet/index.ts');
const { tex: texZapisi } = requireSrc('lib/baza/chisla.ts');
let zadachVsego = 0;
for (const razdel of napolnennyeRazdely()) {
  const N = `база №${razdel.slug}`;
  const prototipy = razdel.prototipy ?? [];
  const gruppy = new Set((razdel.gruppy ?? []).map((g) => g.id));
  const bank = bankRazdela(razdel.slug, prototipy);
  zadachVsego += bank.length;
  eq(new Set(bank.map((z) => z.id)).size, bank.length, `${N}: ключи задач не повторяются`);
  eq(new Set(bank.map((z) => z.text)).size, bank.length, `${N}: условия не повторяются`);
  for (const proto of prototipy) {
    eq(/^P\d\d$/.test(proto.id), true, `${N}: имя прототипа ${proto.id}`);
    eq(gruppy.has(proto.gruppa), true, `${N}, ${proto.id}: группа ${proto.gruppa} есть`);
  }
  for (const z of bank) {
    const proto = prototipy.find((p) => p.id === z.prototypeId);
    const r = proto.solve(z.params);
    const gde = `${N}, ${z.id}`;
    eq(KLYUCH_BAZY.test(z.id), true, `${gde}: ключ`);
    /* Ответ решения против независимого пересчёта. */
    eq(r.otvet, proto.proverka(z.params), `${gde}: ответ сходится с пересчётом`);
    if (z.tip === 'chislo') {
      const n = normalizeAnswer(r.otvet);
      eq(n.ok, true, `${gde}: ответ «${r.otvet}» — запись бланка`);
      if (razdel.slug === '5') {
        const x = Number(n.ok ? n.value : NaN);
        eq(x > 0 && x < 1, true, `${gde}: вероятность ${r.otvet} строго между 0 и 1`);
      }
    }
    /* Ответ есть в последнем шаге разбора. */
    const posledniy = r.etapy[r.etapy.length - 1].lines.join(' ');
    eq(posledniy.includes(texZapisi(r.otvet)), true, `${gde}: разбор заканчивается ответом`);
    /* Отпечаток: верный ответ принят, соседний — нет. */
    const seal = lite(z).seal;
    eq(tipOtpechatka(seal), z.tip, `${gde}: тип в отпечатке`);
    eq(seal.includes(r.otvet), false, `${gde}: ответа в отпечатке нет`);
    eq(prochitat(r.otvet, seal).right, true, `${gde}: верный ответ засчитан`);
    eq(prochitat(`${r.otvet}1`, seal).right, false, `${gde}: неверный ответ не засчитан`);
    /* Подсказки: варианты разные, верный на месте. */
    eq(r.hints.length >= 2, true, `${gde}: подсказок не меньше двух`);
    for (const h of r.hints) {
      eq(
        new Set(h.options).size,
        h.options.length,
        `${gde}: варианты подсказки «${h.question}» разные`,
      );
      eq(
        h.options.length >= 2 && h.correct >= 0 && h.correct < h.options.length,
        true,
        `${gde}: верный вариант подсказки на месте`,
      );
    }
    /* Условие: без «undefined» и сырых шаблонов. */
    eq(/undefined|NaN|\$\{/.test(z.text + JSON.stringify(r)), false, `${gde}: в тексте нет мусора`);
  }
  /* Опорные задачи. */
  const mikro = (razdel.opornye ?? []).flatMap((n) => n.bloki.flatMap((b) => b.zadachi));
  eq(
    new Set(mikro.map((m) => m.id)).size,
    mikro.length,
    `${N}: ключи опорных задач не повторяются`,
  );
  for (const m of mikro) {
    eq(m.otvet, m.proverka(), `${N}, опорная ${m.id}: ответ сходится с пересчётом`);
    eq(
      m.razbor.join(' ').includes(texZapisi(m.otvet)),
      true,
      `${N}, опорная ${m.id}: разбор заканчивается ответом`,
    );
  }
  /* Карточки: ключи, подтемы, якоря теории, ответы вычислений. */
  const koloda = razdel.kartochki;
  if (koloda !== undefined) {
    eq(koloda.level, 'base', `${N}: колода помечена уровнем базы`);
    const ids = koloda.kartochki.map((k) => k.id);
    eq(new Set(ids).size, ids.length, `${N}: ключи карточек не повторяются`);
    const podtemy = new Set(koloda.podtemy.map((t) => t.id));
    const yakorya = new Set((razdel.teoriya ?? []).map((r) => `teoriya-${r.id}`));
    for (const k of koloda.kartochki) {
      eq(podtemy.has(k.topic), true, `${N}, карточка ${k.id}: подтема есть`);
      eq(yakorya.has(k.source), true, `${N}, карточка ${k.id}: раздел теории ${k.source} есть`);
      if (k.type === 'vychislenie') {
        const n = normalizeAnswer(k.otvet);
        eq(n.ok, true, `${N}, карточка ${k.id}: ответ — запись бланка`);
        eq(
          Math.abs(Number(n.ok ? n.value : NaN) - k.proverka()) < 1e-9,
          true,
          `${N}, карточка ${k.id}: ответ ${k.otvet} сходится с пересчётом`,
        );
        eq(k.back.includes(texZapisi(k.otvet)), true, `${N}, карточка ${k.id}: ответ на обороте`);
      }
    }
  }
  /* Теория: ответ примера — в его последнем шаге. */
  for (const r of razdel.teoriya ?? []) {
    for (const b of r.bloki) {
      if (b.vid !== 'primer') continue;
      const shag = b.primer.shagi[b.primer.shagi.length - 1];
      eq(
        shag.includes(texZapisi(b.primer.otvet)),
        true,
        `${N}, теория «${r.title}»: пример заканчивается ответом ${b.primer.otvet}`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error(`База: расхождений ${failures.length} из ${checks}`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`База: проверок ${checks}, задач в банках ${zadachVsego}, расхождений нет.`);
