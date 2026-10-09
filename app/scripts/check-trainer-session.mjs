#!/usr/bin/env node
/* scripts/check-trainer-session.mjs — хранилище сессии тренажёров.

   Запуск: pnpm test:trainer-session

   Проверяет lib/trainerSession без браузера, на подмене localStorage:

     - запись → чтение возвращает те же задания, ответы и время;
     - повреждённая запись и запись другой версии схемы сбрасываются,
       чтение не падает, ключ из хранилища убран;
     - соседняя вкладка узнаёт чужую запись по первым полям (peekHead);
     - раздел определяется по адресу так же для ленты и для страницы;
     - хранилище недоступно (приватный режим) — всё работает без ошибок;
     - осторожное чтение состояния экрана не доверяет входу.

   Ненулевой код возврата — нашлось расхождение, список печатается. */

import { requireSrc } from './lib/load-ts.mjs';

const failures = [];
function check(name, ok, extra) {
  if (!ok) {
    failures.push(extra === undefined ? name : `${name}: ${extra}`);
  }
}

class MemoryStorage {
  #data = new Map();
  get length() { return this.#data.size; }
  key(i) { return [...this.#data.keys()][i] ?? null; }
  getItem(k) { return this.#data.has(k) ? this.#data.get(k) : null; }
  setItem(k, v) { this.#data.set(k, String(v)); }
  removeItem(k) { this.#data.delete(k); }
}

globalThis.window = { localStorage: new MemoryStorage(), addEventListener() {} };

const S = requireSrc('lib/trainerSession/store.ts');
const R = requireSrc('lib/trainerSession/restore.ts');
const P = requireSrc('lib/trainerSession/scope.ts');

const head = (over = {}) => ({
  scope: '12:linear', id: 'abc', createdAt: 1, updatedAt: 2, rev: 5, writer: 'tab-1',
  paused: true, activeMs: 12345.6, ...over,
});
const payload = { tasks: [{ id: 't1', questionHtml: '<p>Найдите $x$ «ё»</p>' }], control: false };
const ui = { index: 2, marks: { 0: 'right' }, tried: { 1: true }, order: [2, 0, 1], value: '7' };

/* Запись и чтение. */
check('доступность', S.storageAvailable() === true);
check('запись удалась', S.writeRaw('12:linear', S.encodeSession(head(), JSON.stringify(ui), JSON.stringify(payload))));
const read = S.readSession('12:linear');
check('чтение ok', read.status === 'ok', read.status);
if (read.status === 'ok') {
  const s = read.session;
  check('задания сохранены', JSON.stringify(s.payload) === JSON.stringify(payload));
  check('состояние экрана сохранено', JSON.stringify(s.ui) === JSON.stringify(ui));
  check('пауза и время', s.paused === true && s.activeMs === 12346, String(s.activeMs));
  check('rev и writer', s.rev === 5 && s.writer === 'tab-1');
}
check('ключ с префиксом', window.localStorage.getItem('budetege:trainer:12:linear:session') !== null);

/* Быстрый взгляд соседней вкладки. */
const raw = window.localStorage.getItem(S.sessionKey('12:linear'));
const peeked = S.peekHead(raw);
check('peekHead', peeked && peeked.id === 'abc' && peeked.rev === 5 && peeked.writer === 'tab-1' && peeked.schemaVersion === 1);
check('peekHead мусор', S.peekHead('garbage') === null);


/* Повреждённое и устаревшее. */
window.localStorage.setItem(S.sessionKey('8'), 'не json');
const broken = S.readSession('8');
check('битая запись сброшена', broken.status === 'reset' && broken.reason === 'broken', JSON.stringify(broken));
check('битый ключ убран', window.localStorage.getItem(S.sessionKey('8')) === null);

window.localStorage.setItem(S.sessionKey('8'), JSON.stringify({ schemaVersion: 0, scope: '8' }));
const old = S.readSession('8');
check('старая версия сброшена', old.status === 'reset' && old.reason === 'version', JSON.stringify(old));

window.localStorage.setItem(S.sessionKey('8'), JSON.stringify({ schemaVersion: 1, scope: '8' }));
check('неполная запись сброшена', S.readSession('8').status === 'reset');

window.localStorage.setItem(S.sessionKey('8'), S.encodeSession(head({ scope: '2' }), 'null', '{}'));
check('чужой раздел сброшен', S.readSession('8').status === 'reset');
check('нет записи', S.readSession('11').status === 'none');

/* Раздел по адресу. */
check('раздел 12', P.scopeOfPath('/zadaniya/12/linear/trenazher/') === '12:linear');
check('раздел 8 по базе', P.scopeOfPath('/zadaniya/8') === '8');
check('раздел 8 по вкладке', P.scopeOfPath('/zadaniya/8/trenazher/') === '8');
check('фигура', P.scopeOfPath('/zadaniya/3/konus/trenazher/') === '3:konus');
check('ярлык режима', P.scopeOfPath('/zadaniya/5/trenazher/uznay/') === '5');
check('вне заданий', P.scopeOfPath('/about/') === null);
check('вложенный раздел', P.hasActiveScope(['3:konus'], '3') && !P.hasActiveScope(['31'], '3') && !P.hasActiveScope([], '3'));

/* Осторожное чтение. */
check('asOrder ok', JSON.stringify(R.asOrder([2, 0, 1], 3)) === '[2,0,1]');
check('asOrder повтор', R.asOrder([0, 0], 3) === null);
check('asOrder за пределом', R.asOrder([0, 5], 3) === null);
check('asOrder пусто', R.asOrder([], 3) === null);
check('asMarks фильтр', JSON.stringify(R.asMarks({ 0: 'right', 1: 'bad', x: 'right', 2: 'hinted' })) === '{"0":"right","2":"hinted"}');
check('isBaseUi ok', R.isBaseUi({ index: 0, marks: {}, tried: {}, order: null }));
check('isBaseUi нет index', !R.isBaseUi({ marks: {}, tried: {}, order: null }));
check('isBaseUi мусор', !R.isBaseUi('x') && !R.isBaseUi(null));
const norm = R.normalizeBase({ index: 99, marks: { 0: 'x' }, tried: {}, order: [0, 9] }, 3);
check('normalizeBase', norm.index === 2 && norm.order === null && Object.keys(norm.marks).length === 0, JSON.stringify(norm));
check('asString', R.asString(5, 'z') === 'z' && R.asStringRecord({ a: 'b', c: 1 }).a === 'b');

/* Удаление. */
S.clearSession('12:linear');
check('удалено', S.readSession('12:linear').status === 'none');

/* Хранилища нет: приватный режим. */
globalThis.window = {
  get localStorage() { throw new Error('SecurityError'); },
  addEventListener() {},
};
check('без хранилища: доступность', S.storageAvailable() === false);
check('без хранилища: запись', S.writeRaw('8', '{}') === false);
check('без хранилища: чтение', S.readSession('8').status === 'none');
let threw = false;
try { S.clearSession('8'); } catch { threw = true; }
check('без хранилища: удаление не падает', !threw);

if (failures.length > 0) {
  console.error(`check-trainer-session: ${failures.length} расхождений`);
  failures.forEach((item) => console.error(` - ${item}`));
  process.exit(1);
}
console.log('check-trainer-session: ok');
