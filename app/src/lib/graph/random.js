/* graph/random.js — детерминированная случайность генератора.

   Один seed всегда даёт одну и ту же последовательность: на этом
   держится воспроизводимость вариантов и в приложении, и в служебных
   скриптах. Здесь только это: хеш строки, генератор чисел и
   перестановка списка. Предметной математики нет.

   Вынесено из generate.js без изменения алгоритмов: теми же функциями
   пользуется генератор параболы (generate-quadratic.js), а тянуть его
   в generate.js по кругу нельзя.
*/

'use strict';

function hash(text) {
  var h = 2166136261;
  for (var i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seedText) {
  var state = hash(String(seedText)) || 1;
  return function () {
    state |= 0; state = (state + 0x6D2B79F5) | 0;
    var t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Перестановка списка по seed: порядок перебора кандидатов. */
function shuffled(list, random) {
  var copy = list.slice();
  for (var i = copy.length - 1; i > 0; i--) {
    var j = Math.floor(random() * (i + 1));
    var t = copy[i]; copy[i] = copy[j]; copy[j] = t;
  }
  return copy;
}

/* Позиции верного ответа по набору: поровну между вариантами,
   порядок перемешан по seed и одинаков при одном и том же seed.
   Ключ включает набор, seed и число вариантов, поэтому кэш не
   зависит от того, какие наборы загружены. */
var placesCache = {};

function answerPlaces(set, seed, optionCount) {
  var key = set.id + ':' + seed + ':' + optionCount;
  if (placesCache[key]) { return placesCache[key]; }

  var count = (set.tasks || []).length;
  var list = [];
  for (var i = 0; i < count; i++) { list.push((i % optionCount) + 1); }
  placesCache[key] = shuffled(list, rng(key + ':places'));
  return placesCache[key];
}

function resetPlaces() { placesCache = {}; }

const api = { hash: hash, rng: rng, shuffled: shuffled, answerPlaces: answerPlaces,
              resetPlaces: resetPlaces };

export default api;
export { hash, rng, shuffled, answerPlaces, resetPlaces };
