/* manifest.js — манифест генератора: что реально лежит в данных.

   buildManifest(sets, families) -> { families: [...], orphans: [...] }

   Семейство → навыки → числа → уровни. Ничего не задаётся руками:
   навык — это набор движка (data/prep и data/prototypes), его
   название — поле title набора, число задач — длина tasks, уровни —
   значения поля level у задач. Чего в данных нет, того в манифесте
   нет: у семейства без наборов список навыков пустой.

   Модуль чистый, как и движок graph/: наборы и список семейств
   приходят аргументами, поэтому один код работает и в бандле
   (через manifest.ts), и в служебном скрипте из Node.
*/

'use strict';

/** Уровни в порядке данных: первым идёт тот, что встретился раньше. */
function levelsOf(tasks) {
  var seen = [];
  tasks.forEach(function (task) {
    if (task.level && seen.indexOf(task.level) === -1) { seen.push(task.level); }
  });
  return seen;
}

/** Сколько задач каждого уровня. Без уровня — не считаются. */
function levelCounts(tasks) {
  var counts = {};
  tasks.forEach(function (task) {
    if (task.level) { counts[task.level] = (counts[task.level] || 0) + 1; }
  });
  return counts;
}

function unique(list) {
  return list.filter(function (item, index) { return item && list.indexOf(item) === index; });
}

/** Навык — набор движка, вид сбоку. Только то, что есть в самом наборе. */
function skillOf(set) {
  var tasks = set.tasks || [];
  return {
    id: set.id,
    kind: set.kind,
    title: set.title || set.id,
    subtitle: set.subtitle || '',
    count: tasks.length,
    levels: levelsOf(tasks),
    levelCounts: levelCounts(tasks),
    answerRules: unique(tasks.map(function (task) { return task.answerRule; })),
    answerTypes: unique(tasks.map(function (task) { return task.answerType || 'number'; })),
    /* Есть ли чертёж хотя бы у одной задачи: у P12-5 его нет вовсе. */
    hasChart: tasks.some(function (task) { return !task.noChart; }),
    /* Семейство кривой по данным набора — сверяется с семейством,
       к которому набор приписан конфигом. */
    family: set.family || null,
  };
}

function sum(list, pick) {
  return list.reduce(function (total, item) { return total + pick(item); }, 0);
}

/**
 * Манифест по наборам движка и списку семейств.
 *
 * sets     — { prep: [...], prototypes: [...] }, как в data/index.js.
 * families — список из data/functionTypes.ts: id, title, shortTitle,
 *            status и bank { prep: [id], prototypes: [id] }.
 */
export function buildManifest(sets, families) {
  var prep = (sets && sets.prep) || [];
  var prototypes = (sets && sets.prototypes) || [];
  var byId = {};
  prep.concat(prototypes).forEach(function (set) { byId[set.id] = set; });
  var claimed = {};

  var out = (families || []).map(function (family) {
    var bank = family.bank || { prep: [], prototypes: [] };
    var missing = [];

    function pick(ids, kind) {
      return (ids || []).reduce(function (list, id) {
        var set = byId[id];
        if (!set || set.kind !== kind) { missing.push(id); return list; }
        claimed[id] = true;
        return list.concat([skillOf(set)]);
      }, []);
    }

    var prepSkills = pick(bank.prep, 'prep');
    var protoSkills = pick(bank.prototypes, 'prototype');
    var skills = prepSkills.concat(protoSkills);

    return {
      id: family.id,
      title: family.title,
      shortTitle: family.shortTitle,
      status: family.status,
      skills: skills,
      prep: { sets: prepSkills.length, tasks: sum(prepSkills, function (s) { return s.count; }) },
      prototypes: { sets: protoSkills.length, tasks: sum(protoSkills, function (s) { return s.count; }) },
      total: sum(skills, function (s) { return s.count; }),
      /* Уровни семейства — объединение уровней его навыков. */
      levels: unique(skills.reduce(function (all, s) { return all.concat(s.levels); }, [])),
      /* Наборы, которые конфиг обещает, а в данных их нет. */
      missing: missing,
    };
  });

  /* Наборы, которые есть в данных, но ни одному семейству не приписаны. */
  var orphans = prep.concat(prototypes)
    .filter(function (set) { return !claimed[set.id]; })
    .map(function (set) { return set.id; });

  return { families: out, orphans: orphans };
}

export default { buildManifest: buildManifest };
