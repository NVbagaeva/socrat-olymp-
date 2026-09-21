/* scripts/lib/graph-quadratic-checks.mjs — проверки задач о параболе.

   Правила читаемости и состава для наборов семейства quadratic. Их
   зовут и validate-graph.mjs (по наборам из data/), и
   check-graph-quadratic.mjs (по ограничениям наборов до того, как
   тексты утверждены). Ничего не подгоняет: не сошлось — ошибка.

   Ответ пересчитывается независимо от генератора — по коэффициентам
   из meta, а не по тому, что сказала сборка. */

import renderer from '../../src/lib/graph/renderer.js';
import Q from '../../src/lib/graph/families/quadratic.js';
import Line from '../../src/lib/graph/families/line.js';

const EPS = 1e-9;

function near(a, b) {
  return Math.abs(a - b) < 1e-6;
}

/* Ответ бланка: целое или конечная десятичная дробь с запятой. */
function blankAnswer(text) {
  return /^-?\d+(,\d+)?$/.test(String(text));
}

function answerNumber(text) {
  return Number(String(text).replace(',', '.'));
}

function inside(point, win, margin) {
  const m = margin ?? 0;
  return point.x >= win.xmin + m - EPS && point.x <= win.xmax - m + EPS &&
         point.y >= win.ymin + m - EPS && point.y <= win.ymax - m + EPS;
}

function valueOn(curve, x) {
  return curve.kind === 'line' ? curve.k * x + curve.b : curve.a * x * x + curve.b * x + curve.c;
}

function sourceTask(set, task) {
  return (set.tasks || []).find((item) => item.id === task.id) ?? {};
}

/* Пометка задачи, где вершина находится по симметричной паре точек. */
export const SYMMETRY_REASON = 'симметрия — вершина по двум точкам';

/* Кривая из meta в виде части сцены семейства: значение и наклон. */
function partOf(curve) {
  return curve.kind === 'line'
    ? { kind: 'line', line: { kValue: curve.k, bValue: curve.b } }
    : { kind: 'quadratic', curve: { aValue: curve.a, bValue: curve.b, cValue: curve.c } };
}

/* ══════════════════════════════════════════════════════════
   Пересечение двух графиков: одна видимая точка — очевидная,
   скрытая — не угадывается. Каждая проверка отдельно: по ним
   отчёт считает, сколько задач прошло каждую.
   ══════════════════════════════════════════════════════════ */
export const INTERSECTION_CHECKS = [
  ['oneVisible', 'ровно одна точка пересечения в окне'],
  ['visibleMargin', 'видимая точка в узле не ближе двух клеток к рамке'],
  ['hiddenFar', 'скрытая точка за рамкой с запасом'],
  ['answerHidden', 'ответ — о скрытой точке и не совпадает с координатами видимой'],
  ['angle', 'угол в видимой точке не меньше порога'],
  ['gapGrows', 'кривые на видимой части не сходятся снова'],
];

export function intersectionAudit(set, task) {
  const meta = task.meta;
  const cross = meta.intersection;
  const win = meta.window;
  const source = sourceTask(set, task);
  const spec = source.constraints?.intersection ?? {};
  const out = { ok: {}, errors: [] };
  if (!cross || !meta.curves || meta.curves.length !== 2) { return out; }
  const points = cross.points;
  const visible = points.filter((pt) => pt.visible);
  const hidden = points.filter((pt) => !pt.visible);
  const first = partOf(meta.curves[0]);
  const second = partOf(meta.curves[1]);
  const margin = spec.margin ?? Q.RULES.crossMargin;
  const least = spec.offscreenMin ?? Q.RULES.crossOffscreenMin;
  const angleMin = spec.angleMin ?? Q.RULES.crossAngleMin;
  const answer = answerNumber(task.answer);

  out.ok.oneVisible = visible.length === 1;
  if (!out.ok.oneVisible) { out.errors.push(`в окне ${visible.length} точек пересечения, нужна ровно одна`); }

  out.ok.visibleMargin = visible.every((pt) =>
    Number.isInteger(pt.x) && Number.isInteger(pt.y) &&
    Math.abs(pt.x) <= win.xmax - margin + EPS && Math.abs(pt.y) <= win.ymax - margin + EPS);
  if (!out.ok.visibleMargin) { out.errors.push(`видимая точка ближе ${margin} клеток к рамке или не в узле`); }

  out.ok.hiddenFar = hidden.length > 0 && hidden.every((pt) => Q.offscreenBy(pt, win) >= least - EPS);
  if (!out.ok.hiddenFar) {
    out.errors.push(hidden.length === 0 ? 'нет скрытой точки пересечения'
      : `скрытая точка вынесена за рамку меньше чем на ${least} клетки`);
  }

  const asked = cross.asked;
  out.ok.answerHidden = asked.visible === false && visible.every((pt) =>
    !near(answer, pt.x) && !near(answer, pt.y));
  if (!out.ok.answerHidden) { out.errors.push('вопрос должен быть о скрытой точке, ответ не читается с видимой'); }

  const angles = visible.map((pt) => Q.crossAngle(first, second, pt.x));
  out.ok.angle = angles.every((angle) => angle >= angleMin - EPS);
  if (!out.ok.angle) { out.errors.push(`угол в видимой точке ${angles.map((a) => a.toFixed(1)).join(', ')}°, нужно не меньше ${angleMin}°`); }

  out.ok.gapGrows = visible.length === 1 && hidden.length === 1 &&
    Q.gapGrows(first, second, win, visible[0], hidden[0]);
  if (!out.ok.gapGrows) { out.errors.push('на видимой части кривые снова сходятся — вторая точка читается на глаз'); }
  return out;
}

/* ══════════════════════════════════════════════════════════
   Одна задача
   ══════════════════════════════════════════════════════════ */
export function checkQuadraticTask(set, task) {
  const errors = [];
  const where = `${set.id}/${task.id}`;
  const meta = task.meta;
  const source = sourceTask(set, task);
  const fail = (message) => errors.push(`${where}: ${message}`);

  if (!meta || meta.family !== 'quadratic') {
    fail('в meta нет семейства quadratic');
    return errors;
  }
  const win = meta.window;
  renderer.checkWindow(win).forEach((message) => fail(message));
  if (!win) { return errors; }

  const p = Q.exact(meta.aFraction, meta.bFraction, meta.cFraction);
  const abs = Math.abs(meta.a);
  if (abs < Q.RULES.absAMin - EPS || abs > Q.RULES.absAMax + EPS) {
    fail(`|a| = ${abs} вне диапазона ${Q.RULES.absAMin}…${Q.RULES.absAMax}`);
  }

  /* Читаемость: вершина видна с запасом, по узлу сетки на каждой ветви. */
  const margin = source.constraints?.vertexMargin ?? Q.RULES.vertexMargin;
  if (!Q.vertexInside(p, win, margin)) {
    fail(`вершина (${meta.m}; ${meta.n}) ближе ${margin} клетки к рамке окна ±${win.xmax}`);
  }
  const nodes = Q.integerPoints(p, win);
  const left = nodes.filter((pt) => pt.x < meta.m - EPS).length;
  const right = nodes.filter((pt) => pt.x > meta.m + EPS).length;
  const need = source.constraints?.sidePoints ?? Q.RULES.sidePoints;
  if (left < need || right < need) {
    fail(`на ветвях мало узлов сетки: слева ${left}, справа ${right}, нужно по ${need}`);
  }
  /* Вершина — на целых или полуцелых координатах. */
  if (!Number.isInteger(meta.m * 2) || !Number.isInteger(meta.n * 2)) {
    fail(`вершина (${meta.m}; ${meta.n}) не на целых и не на полуцелых координатах`);
  }

  /* Отметки внутри окна и на самой кривой. */
  (meta.points || []).forEach((point) => {
    if (!inside(point, win)) {
      fail(`отмеченная точка (${point.x}; ${point.y}) вне окна`);
    }
    if (point.role !== 'cross' && point.role !== 'second' &&
        !near(valueOn(meta.curves[0], point.x), point.y)) {
      fail(`отмеченная точка (${point.x}; ${point.y}) не лежит на параболе`);
    }
  });

  /* Ответ. */
  if (!task.answer) { fail('пустой ответ'); }
  if (task.answerType === 'number' && !blankAnswer(task.answer)) {
    fail(`ответ «${task.answer}» не записывается целым или конечной десятичной дробью`);
  }
  const answer = task.answerType === 'number' ? answerNumber(task.answer) : null;
  const rule = source.answerRule;

  if (rule === 'a' && !near(answer, meta.a)) { fail(`ответ ${task.answer}, а a = ${meta.a}`); }
  if (rule === 'b' && !near(answer, meta.b)) { fail(`ответ ${task.answer}, а b = ${meta.b}`); }
  if (rule === 'c' && !near(answer, meta.c)) { fail(`ответ ${task.answer}, а c = ${meta.c}`); }

  /* Запрос за пределами окна и независимый пересчёт. */
  if (rule === 'value-at' || rule === 'argument-for') {
    const query = meta.query;
    if (!query) {
      fail('не задан запрос');
    } else {
      if (rule === 'value-at') {
        const expected = meta.a * query.x0 * query.x0 + meta.b * query.x0 + meta.c;
        if (!near(expected, answer)) { fail(`f(${query.x0}) = ${expected}, а ответ ${task.answer}`); }
        if (Math.abs(query.x0) <= win.xmax + EPS && Math.abs(query.y0) <= win.ymax + EPS) {
          fail(`точка (${query.x0}; ${query.y0}) попала внутрь окна ±${win.xmax}`);
        }
      } else {
        const at = meta.a * answer * answer + meta.b * answer + meta.c;
        if (!near(at, query.y0)) { fail(`f(${task.answer}) = ${at}, а в условии ${query.y0}`); }
        if (Math.abs(query.y0) <= win.ymax + EPS) {
          fail(`значение ${query.y0} читается внутри окна ±${win.ymax}`);
        }
        const other = query.other;
        const pick = query.pick;
        const lo = Math.min(answer, other);
        const hi = Math.max(answer, other);
        const wanted = pick === 'larger' ? hi : pick === 'smaller' ? lo
          : pick === 'positive' ? (lo < 0 && hi > 0 ? hi : NaN)
          : pick === 'negative' ? (lo < 0 && hi > 0 ? lo : NaN) : NaN;
        if (!near(wanted, answer)) {
          fail(`корни ${lo} и ${hi}, просили «${pick}», а ответ ${task.answer}`);
        }
      }
      [query.x0, query.y0, answer].forEach((value) => {
        if (Math.abs(value * 10 - Math.round(value * 10)) > 1e-6) {
          fail(`число ${value} не записывается одним знаком после запятой`);
        }
      });
    }
  }

  /* Пересечения: целые точки на обеих кривых, видимость по окну. */
  if (rule === 'intersection-x' || rule === 'intersection-y') {
    const cross = meta.intersection;
    if (!cross || !meta.curves || meta.curves.length !== 2) {
      fail('нет двух кривых с точкой пересечения');
    } else {
      cross.points.forEach((point) => {
        if (!Number.isInteger(point.x) || !Number.isInteger(point.y)) {
          fail(`точка пересечения (${point.x}; ${point.y}) не целая`);
        }
        meta.curves.forEach((curve, index) => {
          if (!near(valueOn(curve, point.x), point.y)) {
            fail(`точка (${point.x}; ${point.y}) не лежит на кривой ${index + 1}`);
          }
        });
        const visible = inside(point, win);
        if (visible !== point.visible) {
          fail(`точка (${point.x}; ${point.y}) помечена ${point.visible ? 'видимой' : 'скрытой'}, а окно ±${win.xmax} говорит обратное`);
        }
      });
      const expected = rule === 'intersection-y' ? cross.asked.y : cross.asked.x;
      if (!near(expected, answer)) { fail(`ответ ${task.answer}, а спрошенная координата ${expected}`); }
      const wantVisible = source.constraints?.intersection?.visible ?? 'both';
      const visibleCount = cross.points.filter((pt) => pt.visible).length;
      if (wantVisible === 'both' && visibleCount !== 2) { fail('обе точки пересечения должны быть видны'); }
      if (wantVisible === 'one') { intersectionAudit(set, task).errors.forEach(fail); }
      const second = meta.curves[1];
      if (second.kind === 'line') {
        const line = Line.create(second.kFraction, second.bFraction);
        if (!Line.slopeReadable(line, {})) { fail(`наклон прямой ${second.k} нечитаем`); }
      } else if (near(second.a, meta.a)) {
        fail('у второй параболы тот же a: уравнение перестаёт быть квадратным');
      }
    }
  }

  /* Симметричная пара отмеченных точек помечена в данных. */
  if (meta.symmetricPair && task.levelReason !== SYMMETRY_REASON) {
    fail(`отмеченные точки симметричны, а levelReason не «${SYMMETRY_REASON}»`);
  }
  if (!meta.symmetricPair && task.levelReason === SYMMETRY_REASON) {
    fail('levelReason обещает симметричную пару, а точки несимметричны');
  }

  /* Варианты ответа. */
  if (task.options) {
    const seen = new Set();
    task.options.forEach((option) => {
      if (seen.has(option.text)) { fail(`вариант «${option.text}» повторяется`); }
      seen.add(option.text);
    });
    const picked = task.options.find((option) => option.number === task.answer);
    if (!picked) {
      fail(`ответ «${task.answer}» не указывает ни на один вариант`);
    } else if (rule === 'equation-choice') {
      const expected = Q.equationText(p, meta.form);
      if (picked.text !== expected) { fail(`верным помечен «${picked.text}», а по чертежу ${expected}`); }
      task.options.forEach((option) => {
        if (option !== picked && !option.error) { fail(`у варианта «${option.text}» нет пояснения`); }
      });
    } else if (rule === 'sign-a') {
      const expected = meta.a > 0 ? '1' : '2';
      if (task.answer !== expected) { fail(`знак a = ${meta.a}, а ответ ${task.answer}`); }
    }
  }

  /* Чертёж: столько кривых, сколько частей, и без мусора. */
  if (task.svg) {
    const curves = (task.svg.match(/class="graph-curve/g) || []).length;
    if (curves !== meta.curves.length) { fail(`на чертеже ${curves} кривых, в задаче ${meta.curves.length}`); }
    if (/NaN|undefined/.test(task.svg)) { fail('в SVG остались NaN или undefined'); }
  } else if (!source.noChart) {
    fail('у задачи нет чертежа');
  }
  return errors;
}

/* ══════════════════════════════════════════════════════════
   Состав набора
   ══════════════════════════════════════════════════════════ */
export function checkQuadraticComposition(set, tasks) {
  const rules = set.composition;
  const where = set.id;
  if (!rules) { return []; }
  const errors = [];
  const fail = (message) => errors.push(`${where}: ${message}`);
  const need = (actual, minimum, what) => {
    if (minimum !== undefined && actual < minimum) {
      fail(`${what} — ${actual}, нужно не меньше ${minimum}`);
    }
  };
  const exactly = (actual, wanted, what) => {
    if (wanted !== undefined && actual !== wanted) {
      fail(`${what} — ${actual}, нужно ровно ${wanted}`);
    }
  };

  if (rules.count !== undefined && tasks.length !== rules.count) {
    fail(`задач ${tasks.length}, по составу нужно ${rules.count}`);
  }

  const as = tasks.map((task) => task.meta.a);
  need(as.filter((a) => a > 0).length, rules.minUp, 'с ветвями вверх');
  need(as.filter((a) => a < 0).length, rules.minDown, 'с ветвями вниз');
  need(as.filter((a) => !Number.isInteger(a)).length, rules.minFractionA, 'с дробным a');
  need(new Set(as.map(String)).size, rules.minDistinctA, 'различных a');

  const cs = tasks.map((task) => task.meta.c);
  need(new Set(cs.map(String)).size, rules.minDistinctC, 'различных c');
  need(cs.filter((c) => c > 0).length, rules.minPositiveC, 'с c > 0');
  need(cs.filter((c) => c < 0).length, rules.minNegativeC, 'с c < 0');

  if (rules.allIntegerB) {
    tasks.forEach((task) => {
      if (!Number.isInteger(task.meta.b)) { fail(`${task.id}: b должен быть целым, а он ${task.meta.b}`); }
    });
  }

  if (rules.uniqueVertices) {
    const seen = new Map();
    tasks.forEach((task) => {
      const key = `${task.meta.m};${task.meta.n}`;
      if (seen.has(key)) { fail(`вершина (${key}) повторяется у ${seen.get(key)} и ${task.id}`); }
      seen.set(key, task.id);
    });
  }

  if (rules.uniqueAnswers) {
    const seen = new Map();
    tasks.forEach((task) => {
      if (seen.has(task.answer)) { fail(`ответ ${task.answer} повторяется у ${seen.get(task.answer)} и ${task.id}`); }
      seen.set(task.answer, task.id);
    });
  }

  if (rules.allChoice !== undefined) {
    tasks.forEach((task) => {
      if (task.answerType !== 'choice') { fail(`${task.id}: ожидался answerType choice`); return; }
      if (!task.options || task.options.length !== rules.allChoice) {
        fail(`${task.id}: вариантов ${task.options ? task.options.length : 0}, нужно ${rules.allChoice}`);
      }
    });
    if (rules.balancedAnswerPlaces) {
      const places = {};
      tasks.forEach((task) => { places[task.answer] = (places[task.answer] || 0) + 1; });
      const low = Math.floor(tasks.length / rules.allChoice);
      const high = Math.ceil(tasks.length / rules.allChoice);
      for (let n = 1; n <= rules.allChoice; n++) {
        const got = places[String(n)] || 0;
        if (got < low || got > high) {
          fail(`верный ответ стоит на месте ${n} ${got} раз, нужно ${low === high ? low : `${low}–${high}`}`);
        }
      }
    }
  }

  if (rules.noAlternatingAnswers) {
    let alternating = tasks.length > 2;
    for (let i = 1; i < tasks.length; i++) {
      if (tasks[i].answer === tasks[i - 1].answer) { alternating = false; break; }
    }
    if (alternating) { fail('ответы идут строгим чередованием'); }
  }

  /* Симметричных пар в наборе не больше двух, если набор не просит
     меньше. */
  const symmetric = tasks.filter((task) => task.meta.symmetricPair).length;
  const maxSymmetric = rules.maxSymmetricPairs ?? 2;
  if (symmetric > maxSymmetric) {
    fail(`симметричных пар отмеченных точек — ${symmetric}, допустимо не больше ${maxSymmetric}`);
  }

  if (rules.knownA !== undefined) {
    const known = tasks.filter((task) => sourceTask(set, task).knownA === true).length;
    exactly(known, rules.knownA, 'задач с известным a');
  }

  if (rules.queryOutsideWindow) {
    tasks.forEach((task) => {
      if (!task.meta.query) { fail(`${task.id}: не задан запрос`); }
    });
  }
  if (rules.minNonIntegerAnswers !== undefined) {
    need(tasks.filter((task) => /,/.test(task.answer)).length, rules.minNonIntegerAnswers, 'нецелых ответов');
  }
  if (rules.picks) {
    Object.keys(rules.picks).forEach((pick) => {
      exactly(tasks.filter((task) => task.meta.query?.pick === pick).length, rules.picks[pick],
        `запросов «${pick}»`);
    });
  }
  if (rules.forms) {
    Object.keys(rules.forms).forEach((form) => {
      exactly(tasks.filter((task) => task.meta.form === form).length, rules.forms[form],
        `задач в записи «${form}»`);
    });
  }
  if (rules.visibleBoth !== undefined || rules.visibleOne !== undefined) {
    const both = tasks.filter((task) =>
      task.meta.intersection && task.meta.intersection.points.every((pt) => pt.visible)).length;
    const one = tasks.filter((task) =>
      task.meta.intersection && task.meta.intersection.points.filter((pt) => pt.visible).length === 1).length;
    exactly(both, rules.visibleBoth, 'задач с двумя видимыми точками пересечения');
    exactly(one, rules.visibleOne, 'задач с одной видимой точкой пересечения');
  }
  return errors;
}
