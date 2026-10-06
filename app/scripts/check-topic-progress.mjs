#!/usr/bin/env node
/* scripts/check-topic-progress.mjs — расчёт прогресса подтемы.

   Запуск: pnpm test:topic-progress

   Проверяет lib/topicProgress.ts без браузера, на модельных планах
   подтем (те же пункты, что у линейной, квадратичной и гиперболы):

     - чистое хранилище → 0% и мотивирующая подпись, а не «0 из N»;
     - выполненное условие пункта → ровно 1/N, подпись «1 из N»;
     - условие выполнено не до конца → пункт не закрыт;
     - отметки другой подтемы не засчитываются;
     - пустые вкладки в пункты не входят;
     - падеж подписи: «из 1 раздела», «из 4 разделов», «из 21 раздела».

   Ненулевой код возврата — нашлось расхождение, список печатается. */

import { requireSrc } from './lib/load-ts.mjs';

const P = requireSrc('lib/topicProgress.ts');

const LABELS = { theory: 'Теория', methods: 'Методы', prep: 'Опорные задачи', trainer: 'Тренажёр' };
const EMPTY = { theoryRead: [], methodsRead: [], prep: {}, trainer: { kinds: {}, mistakes: [] } };

/* Модельные планы: линейная — без методов, у её теории три раздела
   с текстом; у квадратичной и гиперболы все четыре пункта. */
const linear = {
  theory: ['what', 'inside', 'kinds'],
  methods: [],
  prep: [{ id: 'k', total: 10 }, { id: 'b', total: 10 }],
  trainer: ['12.A', '12.B', '12.C', '12.D'],
};
const rational = {
  theory: ['hyperbola-name', 'hyperbola-basic', 'hyperbola-asymptotes'],
  methods: ['m1', 'm2'],
  prep: [{ id: 'koef-k', total: 10 }, { id: 'znachenie', total: 10 }],
  trainer: ['12R.A', '12R.B'],
};

const failures = [];
let checks = 0;
function expect(what, got, want) {
  checks += 1;
  if (JSON.stringify(got) !== JSON.stringify(want)) {
    failures.push(what + ': получено ' + JSON.stringify(got) + ', ожидалось ' + JSON.stringify(want));
  }
}
const sum = (plan, marks) => P.progressSummary(plan, { ...EMPTY, ...marks }, LABELS);
const range = (n) => Array.from({ length: n }, (_, i) => i + 1);

/* 1. Новый пользователь. */
for (const [name, plan, items] of [['линейная', linear, 3], ['гипербола', rational, 4]]) {
  const s = sum(plan, {});
  expect(name + ': пунктов', s.total, items);
  expect(name + ': чистое хранилище — процент', s.percent, 0);
  expect(name + ': чистое хранилище — подпись', P.progressText(s), 'Начните с теории — здесь появится ваш прогресс');
}

/* 2. Каждый пункт по отдельности даёт ровно 1/N. */
const full = {
  theory: { theoryRead: rational.theory },
  methods: { methodsRead: rational.methods },
  prep: { prep: { 'koef-k': range(10), znachenie: range(6) } },         // 16 из 20 = 80%
  trainer: { trainer: { kinds: { '12R.A': { done: 3, right: 2, seconds: 1 }, '12R.B': { done: 2, right: 2, seconds: 1 } }, mistakes: [] } },
};
for (const [id, marks] of Object.entries(full)) {
  const s = sum(rational, marks);
  expect('пункт «' + id + '»: пройдено', s.done, 1);
  expect('пункт «' + id + '»: процент', s.percent, 25);
  expect('пункт «' + id + '»: подпись', P.progressText(s), 'Вы изучили 1 из 4 разделов');
  expect('пункт «' + id + '»: закрыт именно он', s.items.filter((item) => item.complete).map((item) => item.id), [id]);
}

/* 3. Не до конца — пункт не закрыт. */
expect('теория: два раздела из трёх', sum(rational, { theoryRead: rational.theory.slice(0, 2) }).done, 0);
expect('опорные: 15 из 20 — меньше 80%', sum(rational, { prep: { 'koef-k': range(10), znachenie: range(5) } }).done, 0);
expect('тренажёр: 10 задач одного типа не заменяют второй тип',
  sum(rational, { trainer: { kinds: { '12R.A': { done: 10, right: 10, seconds: 1 } }, mistakes: [] } }).done, 0);
expect('тренажёр: с подсказкой не засчитано (right = 0)',
  sum(rational, { trainer: { kinds: { '12R.A': { done: 5, right: 0, seconds: 1 }, '12R.B': { done: 5, right: 0, seconds: 1 } }, mistakes: [] } }).done, 0);
expect('опорные: номера сверх набора не добирают', sum(rational, { prep: { 'koef-k': range(20) } }).items.find((i) => i.id === 'prep').done, 10);

/* 4. Всё пройдено. */
const all = sum(rational, Object.assign({}, ...Object.values(full)));
expect('всё пройдено — процент', all.percent, 100);
expect('всё пройдено — подпись', P.progressText(all), 'Вы изучили все разделы подтемы');

/* 5. Подтемы не влияют друг на друга: отметки гиперболы в линейной
   не засчитываются, у каждой свои разделы, навыки и типы заданий. */
const rationalDone = Object.assign({}, ...Object.values(full));
expect('отметки гиперболы в линейной', sum(linear, rationalDone).done, 0);
expect('отметки гиперболы в линейной — процент', sum(linear, rationalDone).percent, 0);

/* 6. Пустые вкладки не входят. */
expect('без теории и методов — пункты',
  sum({ theory: [], methods: [], prep: [{ id: 'x', total: 10 }], trainer: [] }, {}).items.map((i) => i.id), ['prep']);
expect('без теории — подпись', P.progressText(sum({ theory: [], methods: [], prep: [{ id: 'x', total: 10 }], trainer: [] }, {})),
  'Начните с первого раздела — здесь появится ваш прогресс');
expect('совсем пустая подтема', P.progressText(sum({ theory: [], methods: [], prep: [], trainer: [] }, {})), 'Материалы подтемы готовятся');

/* 7. Падеж. */
const caseOf = (done, total) => P.progressText({ items: [{ id: 'theory' }], done, total, percent: 0 });
expect('из 1 раздела', P.plural(1, 'раздела', 'разделов', 'разделов'), 'раздела');
expect('из 11 разделов', P.plural(11, 'раздела', 'разделов', 'разделов'), 'разделов');
expect('из 2 разделов', caseOf(1, 2), 'Вы изучили 1 из 2 разделов');
expect('из 5 разделов', caseOf(2, 5), 'Вы изучили 2 из 5 разделов');
expect('из 21 раздела', caseOf(3, 21), 'Вы изучили 3 из 21 раздела');
expect('строка пункта', P.itemDetail({ id: 'theory', unit: 'sections', done: 1, need: 1, total: 1 }), '1 из 1 раздела');
expect('строка опорных', P.itemDetail({ id: 'prep', unit: 'tasks', done: 34, need: 88, total: 110 }), 'Решено 34 из 110 · для зачёта нужно\u00a088');
expect('строка опорных: решено больше нужного', P.itemDetail({ id: 'prep', unit: 'tasks', done: 90, need: 72, total: 90 }), 'Решено 90 из 90 · для зачёта нужно\u00a072');
expect('строка опорных: ноль', P.itemDetail({ id: 'prep', unit: 'tasks', done: 0, need: 72, total: 90 }), 'Решено 0 из 90 · для зачёта нужно\u00a072');

console.log('Проверок расчёта прогресса: ' + checks);
if (failures.length) {
  console.log('Расхождения — ' + failures.length + ':');
  failures.forEach((line) => console.log('  ' + line));
  process.exit(1);
}
console.log('Расхождений нет.');
