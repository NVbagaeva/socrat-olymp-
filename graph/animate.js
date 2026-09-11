/* graph/animate.js — анимация разбора.

   Третий слой поверх рендерера. Рендерер остаётся чистым: он уже
   нарисовал треугольник наклона со всеми подписями и проставил
   идентификаторы фигур. Анимация берёт готовый SVG, прячет разметку
   и показывает её по шагам.

   Шаги:
     0  исходный чертёж: сетка, оси, прямая, две опорные точки
        и подпись прямой — её место рассчитано с учётом треугольника,
        поэтому дальше она не двигается и не исчезает;
     1  первый катет прочерчивается, появляется его подпись;
     2  второй катет прочерчивается, появляется его подпись;
     3  треугольник заливается — проявлением, не выездом;
     4  появляется квадратик прямого угла;
     5  появляется дуга угла с подписью α (только у возрастающей);
     6  строка за строкой появляется блок решения.

   У возрастающей порядок катетов «вправо, затем вверх», у убывающей —
   «вниз, затем вправо»: его задаёт triangle.order.
*/

(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.GraphAnimate = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* Длительности из ТЗ. Одно место на весь модуль. */
  var TIMING = {
    leg:          400,
    reveal:       250,
    pause:        150,
    solutionLine: 200,
    solutionRise: 6      /* на сколько пикселей всплывает строка решения */
  };

  var IDS = {
    fill:       'slope-fill',
    legX:       'slope-leg-x',
    legY:       'slope-leg-y',
    labelX:     'slope-label-x',
    labelY:     'slope-label-y',
    rightAngle: 'slope-right-angle',
    arc:        'slope-arc',
    alpha:      'slope-alpha'
  };

  function reducedMotion() {
    return typeof window !== 'undefined' && window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function create(options) {
    var svg = options.svg;
    var triangle = options.triangle;
    var lines = options.lines || [];
    var solutionEl = options.solutionEl || null;
    var onState = options.onState || function () {};

    var parts = {};
    Object.keys(IDS).forEach(function (key) { parts[key] = svg.querySelector('#' + IDS[key]); });

    /* Катеты в порядке построения: у убывающей первым идёт вертикальный. */
    var order = triangle.order || ['horizontal', 'vertical'];
    var legs = order.map(function (which) {
      return which === 'horizontal'
        ? { path: parts.legX, label: parts.labelX }
        : { path: parts.legY, label: parts.labelY };
    });

    var solutionLines = buildSolution(solutionEl, lines);
    var instant = reducedMotion();
    var timers = [];
    var state = { step: 0, total: 0, playing: false, finished: false };

    /* ── подготовка: всё прячем ───────────────────────────── */
    function hide(node) {
      if (!node) { return; }
      node.style.transition = 'none';
      node.style.opacity = '0';
    }

    function prepareLeg(leg) {
      if (!leg.path) { return; }
      var length = leg.path.getTotalLength ? leg.path.getTotalLength() : 0;
      leg.length = length;
      leg.path.style.transition = 'none';
      leg.path.style.opacity = '1';
      leg.path.style.strokeDasharray = length + ' ' + length;
      leg.path.style.strokeDashoffset = String(length);
      hide(leg.label);
    }

    function reset() {
      clearTimers();
      state = { step: 0, total: steps.length, playing: false, finished: false };
      hide(parts.fill);
      hide(parts.rightAngle);
      hide(parts.arc);
      hide(parts.alpha);
      legs.forEach(prepareLeg);
      solutionLines.forEach(function (line) {
        line.style.transition = 'none';
        line.style.opacity = '0';
        line.style.transform = 'translateY(' + TIMING.solutionRise + 'px)';
      });
      notify();
    }

    /* ── показ элементов ───────────────────────────────────── */
    function revealNode(node, duration) {
      if (!node) { return; }
      node.style.transition = duration ? 'opacity ' + duration + 'ms ease' : 'none';
      /* Перечитываем стиль, иначе браузер склеит два присваивания. */
      void node.getBoundingClientRect();
      node.style.opacity = '1';
    }

    function drawLeg(leg, duration) {
      if (!leg.path) { return; }
      /* Прочерчивание — штрихом по длине пути, не масштабированием. */
      leg.path.style.transition = duration ? 'stroke-dashoffset ' + duration + 'ms linear' : 'none';
      void leg.path.getBoundingClientRect();
      leg.path.style.strokeDashoffset = '0';
    }

    function freezeLeg(leg) {
      if (!leg.path) { return; }
      var current = window.getComputedStyle(leg.path).strokeDashoffset;
      leg.path.style.transition = 'none';
      leg.path.style.strokeDashoffset = current;
    }

    function freezeNode(node) {
      if (!node) { return; }
      var current = window.getComputedStyle(node).opacity;
      node.style.transition = 'none';
      node.style.opacity = current;
    }

    /* ── шаги ──────────────────────────────────────────────── */
    var steps = [];

    legs.forEach(function (leg) {
      steps.push({
        id: 'leg',
        duration: TIMING.leg,
        run: function (fast) {
          drawLeg(leg, fast ? 0 : TIMING.leg);
          revealNode(leg.label, fast ? 0 : TIMING.reveal);
        },
        freeze: function () { freezeLeg(leg); freezeNode(leg.label); }
      });
    });

    steps.push({ id: 'fill', duration: TIMING.reveal,
      run: function (fast) { revealNode(parts.fill, fast ? 0 : TIMING.reveal); },
      freeze: function () { freezeNode(parts.fill); } });

    steps.push({ id: 'rightAngle', duration: TIMING.reveal,
      run: function (fast) { revealNode(parts.rightAngle, fast ? 0 : TIMING.reveal); },
      freeze: function () { freezeNode(parts.rightAngle); } });

    /* Дуга и α существуют только у возрастающей прямой. */
    if (parts.arc || parts.alpha) {
      steps.push({ id: 'angle', duration: TIMING.reveal,
        run: function (fast) {
          revealNode(parts.arc, fast ? 0 : TIMING.reveal);
          revealNode(parts.alpha, fast ? 0 : TIMING.reveal);
        },
        freeze: function () { freezeNode(parts.arc); freezeNode(parts.alpha); } });
    }

    if (solutionLines.length) {
      steps.push({
        id: 'solution',
        duration: TIMING.solutionLine * solutionLines.length,
        run: function (fast) {
          solutionLines.forEach(function (line, i) {
            var show = function () {
              line.style.transition = fast ? 'none'
                : 'opacity ' + TIMING.reveal + 'ms ease, transform ' + TIMING.reveal + 'ms ease';
              void line.getBoundingClientRect();
              line.style.opacity = '1';
              line.style.transform = 'translateY(0)';
            };
            if (fast) { show(); } else { timers.push(setTimeout(show, i * TIMING.solutionLine)); }
          });
        },
        freeze: function () {
          solutionLines.forEach(function (line) { freezeNode(line); });
        }
      });
    }

    state.total = steps.length;

    /* ── управление ────────────────────────────────────────── */
    function clearTimers() {
      timers.forEach(clearTimeout);
      timers = [];
    }

    function notify() {
      onState({ step: state.step, total: state.total,
                playing: state.playing, finished: state.finished, instant: instant });
    }

    function runStep(index, fast) {
      steps[index].run(!!fast);
      state.step = index + 1;
      state.finished = state.step >= steps.length;
      notify();
    }

    function scheduleNext() {
      if (!state.playing || state.step >= steps.length) {
        if (state.step >= steps.length) { state.playing = false; notify(); }
        return;
      }
      var index = state.step;
      runStep(index, false);
      timers.push(setTimeout(scheduleNext, steps[index].duration + TIMING.pause));
    }

    function play() {
      if (instant) { return showAll(); }
      if (state.finished) { reset(); }
      state.playing = true;
      notify();
      scheduleNext();
    }

    function pause() {
      if (!state.playing) { return; }
      clearTimers();
      state.playing = false;
      /* Замораживаем текущие переходы, иначе шаг доиграет после паузы. */
      steps.forEach(function (step, i) { if (i < state.step) { step.freeze(); } });
      notify();
    }

    /* «Дальше» — мгновенный переход к следующему шагу: ученик,
       который понял, не должен ждать анимацию. */
    function next() {
      clearTimers();
      var wasPlaying = state.playing;
      state.playing = false;
      if (state.step < steps.length) { runStep(state.step, true); }
      if (wasPlaying && state.step < steps.length) {
        state.playing = true;
        timers.push(setTimeout(scheduleNext, TIMING.pause));
      }
      notify();
    }

    function showAll() {
      clearTimers();
      state.playing = false;
      steps.forEach(function (step, i) { if (i >= state.step) { step.run(true); } });
      state.step = steps.length;
      state.finished = true;
      notify();
    }

    function restart() { reset(); play(); }

    reset();
    /* При включённом «уменьшить движение» всё показывается сразу,
       блок решения — целиком. */
    if (instant) { showAll(); }

    return {
      play: play, pause: pause, next: next, restart: restart, showAll: showAll, reset: reset,
      state: function () { return { step: state.step, total: state.total,
                                    playing: state.playing, finished: state.finished,
                                    instant: instant }; },
      steps: steps.map(function (step) { return step.id; }),
      TIMING: TIMING
    };
  }

  /* Блок решения: строки создаются здесь, набор формул — снаружи,
     через graph/math.js, чтобы модуль не знал про разметку формул. */
  function buildSolution(container, lines) {
    if (!container) { return []; }
    container.innerHTML = '';
    return lines.map(function (line) {
      var node = document.createElement('p');
      node.className = 'solution-line';
      node.setAttribute('data-line', line.id || '');
      node.innerHTML = line.html || line.text;
      container.appendChild(node);
      return node;
    });
  }

  return { create: create, TIMING: TIMING, IDS: IDS };
});
