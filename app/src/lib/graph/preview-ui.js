/* preview-ui.js — служебная страница визуального контроля.

   Собирает разметку в переданный контейнер и ничего не знает
   ни про React, ни про сборщик: страница проекта монтирует её
   в useEffect, простой HTML — вызовом из <script type="module">.

   Наборы и экземпляр KaTeX приходят снаружи: модуль не ходит
   ни в файловую систему, ни в сеть.
*/

import renderer from './renderer.js';
import math from './math.js';
import katexUpgrade from './katex-upgrade.js';
import Triangle from './triangle.js';
import solution from './solution.js';
import animate from './animate.js';
import generate from './generate.js';

/* Разметка страницы: заголовок с переключателями, сетка задач
   и панель разбора. Собирается один раз при монтировании. */
const MARKUP = `<header>
  <h1>Задание №12 · визуальный контроль</h1>

  <label>Раздел
    <select id="mode">
      <option value="prep">Подготовка</option>
      <option value="prototypes">Прототипы</option>
    </select>
  </label>

  <label>Набор <select id="set"></select></label>
  <label>Seed <input id="seed" type="number" step="1"></label>
  <button id="rebuild">Пересобрать</button>

  <div class="counts" id="counts"></div>
</header>

<main>
  <div class="grid" id="grid"></div>

  <aside id="panel">
    <h2>Разбор</h2>
    <p class="hint" id="panel-hint">Выберите задачу слева.</p>
  </aside>
</main>`;

/**
 * @param {HTMLElement} container куда монтировать
 * @param {{ sets: {prep: object[], prototypes: object[]}, katex?: object }} options
 */
export function mountPreview(container, options) {
  const GraphRenderer = renderer;
  const GraphMath = math;
  const GraphKatexUpgrade = katexUpgrade;
  const GraphTriangle = Triangle;
  const GraphSolution = solution;
  const GraphAnimate = animate;
  const GraphGenerate = generate;
  const katexInstance = (options && options.katex) || null;

  container.innerHTML = MARKUP;


  

  /* Тексты уровней — одной константой: формулировку меняют здесь. */
  var LEVEL_LABELS = { lucky: 'повезло', unlucky: 'не повезло' };

  /* Статического списка файлов не избежать: на GitHub Pages нет
     оглавления папки, а сборки в проекте нет. */
  var FILES = {
    prep: ['prep/12/block-1.json', 'prep/12/block-2.json', 'prep/12/block-3.json',
           'prep/12/block-4.json', 'prep/12/block-5.json'],
    prototypes: ['prototypes/12/12-A.json', 'prototypes/12/12-B.json',
                 'prototypes/12/12-C.json', 'prototypes/12/12-D.json']
  };

  var sets = (options && options.sets) || { prep: [], prototypes: [] };
  var current = { mode: 'prep', setId: null, seed: null, taskId: null };
  var player = null;

  var el = {
    mode: container.querySelector('#mode'),
    set: container.querySelector('#set'),
    seed: container.querySelector('#seed'),
    rebuild: container.querySelector('#rebuild'),
    grid: container.querySelector('#grid'),
    panel: container.querySelector('#panel'),
    counts: container.querySelector('#counts')
  };

  /* Наборы уже переданы: страница ничего не загружает. */
  function load() {
    GraphGenerate.setSets(sets);
    return Promise.resolve();
  }

  function counts() {
    var prep = sets.prep.reduce(function (sum, set) { return sum + set.tasks.length; }, 0);
    var proto = sets.prototypes.reduce(function (sum, set) { return sum + set.tasks.length; }, 0);
    /* Два счётчика, и они нигде не складываются. */
    el.counts.innerHTML = 'прототипов ФИПИ: <b>' + proto + '</b><br>подготовка: ' + prep +
      ' (в покрытие не входит)';
  }

  function fillSets() {
    var list = sets[current.mode];
    el.set.innerHTML = list.map(function (set) {
      return '<option value="' + set.id + '">' + set.id + ' · ' + set.title + '</option>';
    }).join('');
    current.setId = list.length ? list[0].id : null;
    syncSeed();
  }

  function activeSet() {
    return sets[current.mode].filter(function (set) { return set.id === current.setId; })[0];
  }

  function syncSeed() {
    var set = activeSet();
    if (set) { el.seed.value = set.seed; current.seed = set.seed; }
  }

  function render() {
    var set = activeSet();
    if (!set) { return; }

    var tasks;
    try { tasks = GraphGenerate.generateSet(set.id, current.seed); }
    catch (error) {
      el.grid.innerHTML = '<p>Набор не собрался: ' + error.message + '</p>';
      return;
    }

    el.grid.innerHTML = tasks.map(function (task, i) {
      var options = task.options ? '<ul class="options">' + task.options.map(function (option) {
        return '<li class="' + (option.number === task.answer ? 'right' : '') + '">' +
          option.number + ') ' + option.html + '</li>';
      }).join('') + '</ul>' : '';

      return '<article class="card" data-id="' + task.id + '">' +
        '<div class="card-head"><span class="card-id">' + (i + 1) + ' · ' + task.id + '</span>' +
        (task.level ? '<span class="badge ' + task.level + '">' + LEVEL_LABELS[task.level] + '</span>' : '') +
        '</div>' +
        (task.svg || '<div class="nochart">без чертежа</div>') +
        '<p class="question">' + task.questionHtml + '</p>' +
        options +
        (task.answerHtml ? '<p class="answer">Ответ: ' + task.answerHtml + '</p>'
                         : '<p class="answer">Верный: №' + task.answer + '</p>') +
        '</article>';
    }).join('');

    katexUpgrade(el.grid);
    if (current.taskId) { markActive(); }
  }

  function markActive() {
    Array.prototype.forEach.call(el.grid.querySelectorAll('.card'), function (card) {
      card.classList.toggle('active', card.getAttribute('data-id') === current.taskId);
    });
  }

  /* ── Разбор ───────────────────────────────────────────────
     Правило: кнопка «Показать разбор» не появляется, пока ученик
     не сделал попытку — ввёл ответ или честно нажал «Не знаю».
     Это относится и к подготовке, и к прототипам. */
  function openTask(id) {
    current.taskId = id;
    markActive();
    player = null;

    var task = GraphGenerate.generate(id, current.seed);
    var analysis = GraphGenerate.analysis(id, current.seed);

    el.panel.innerHTML =
      '<h2>' + task.id + (task.level ? ' · ' + LEVEL_LABELS[task.level] : '') + '</h2>' +
      '<p class="question">' + task.questionHtml + '</p>' +
      (analysis ? GraphRenderer.renderGraph(analysis.scene) : (task.svg || '')) +
      (task.hintHtml ? '<p class="hint">Подсказка: ' + task.hintHtml + '</p>' : '') +
      '<div class="attempt">' +
        (task.options
          ? '<select id="answer">' + task.options.map(function (option) {
              return '<option value="' + option.number + '">' + option.number + ') ' + option.text + '</option>';
            }).join('') + '</select>'
          : '<input id="answer" placeholder="ответ">') +
        '<button id="check" class="primary">Проверить</button>' +
        '<button id="giveup">Не знаю, показать решение</button>' +
      '</div>' +
      '<p class="verdict" id="verdict"></p>' +
      '<div class="controls">' +
        '<button id="show" hidden class="primary">Показать разбор</button>' +
        '<button id="pause" hidden>Пауза</button>' +
        '<button id="next" hidden>Дальше</button>' +
      '</div>' +
      '<p class="steps" id="steps"></p>' +
      '<div class="solution" id="solution" hidden></div>';

    katexUpgrade(el.panel);
    bindPanel(task, analysis);
  }

  function bindPanel(task, analysis) {
    var answer = container.querySelector('#answer');
    var verdict = container.querySelector('#verdict');
    var show = container.querySelector('#show');
    var pause = container.querySelector('#pause');
    var next = container.querySelector('#next');
    var steps = container.querySelector('#steps');
    var solution = container.querySelector('#solution');

    function attemptMade(text, right) {
      verdict.textContent = text;
      verdict.className = 'verdict ' + (right ? 'right' : 'wrong');
      show.hidden = false;
    }

    container.querySelector('#check').addEventListener('click', function () {
      var value = (answer.value || '').trim().replace('.', ',');
      var right = value === task.answer;
      attemptMade(right ? 'Верно.' : 'Неверно. Правильный ответ: ' + task.answer, right);
    });

    container.querySelector('#giveup').addEventListener('click', function () {
      /* Честный выход: считается попыткой без ответа. */
      attemptMade('Засчитано как попытка без ответа: прототип не решён самостоятельно.', false);
    });

    if (!analysis) {
      show.addEventListener('click', function () {
        solution.hidden = false;
        solution.innerHTML = '<p class="solution-line">Для этой задачи разбор с чертежом не строится.</p>';
      });
      return;
    }

    var steps = GraphSolution.build({
      triangle: analysis.triangle,
      line: analysis.line,
      window: analysis.scene.window,
      task: {
        rule: taskRule(task.id),
        answer: task.answer,
        query: task.meta.query,
        probe: task.meta.probe
      }
    });

    show.addEventListener('click', function () {
      solution.hidden = false;
      if (!player) {
        solution.innerHTML = '<div class="solution-steps">' +
          steps.map(stepMarkup).join('') + '</div>';
        katexUpgrade(solution);
        bindDetails(solution);

        player = GraphAnimate.create({
          svg: el.panel.querySelector('svg'),
          triangle: analysis.triangle,
          solutionNodes: solution.querySelectorAll('.solution-step'),
          solutionEl: solution,
          onState: function (state) {
            steps.textContent = 'шаг ' + state.step + ' из ' + state.total +
              (state.instant ? ' · движение отключено в системе' : '');
            pause.hidden = state.instant || !state.playing;
            next.hidden = state.instant || state.finished;
            show.textContent = state.finished ? 'Показать заново' : 'Показать разбор';
            show.hidden = state.playing;
            katexUpgrade(solution);
          }
        });
        player.play();
      } else {
        player.restart();
      }
    });

    pause.addEventListener('click', function () {
      player.pause();
      pause.hidden = true;
      show.hidden = false;
      show.textContent = 'Продолжить';
    });

    next.addEventListener('click', function () { player.next(); });
  }

  /* KaTeX передан приложением обычным импортом. Не передан —
     формулы остаются в исходной записи, страница работает. */
  function katexUpgrade(root) {
    if (katexInstance) { GraphKatexUpgrade.upgrade(root, katexInstance); }
  }

  /* ── Разметка шагов разбора ──────────────────────────────
     Модуль solution.js отдаёт структуру, разметку делает страница. */
  function blockMarkup(block) {
    if (block.type === 'text') { return '<p class="solution-text">' + block.html + '</p>'; }

    if (block.type === 'formula') {
      return '<p class="solution-formula' + (block.feature ? ' feature' : '') + '">' +
        '<span class="math" data-tex="' + escapeAttr(block.tex) + '">' +
        GraphMath.html(texFallback(block.tex)) + '</span></p>';
    }

    if (block.type === 'answer') { return '<p class="solution-answer">' + block.html + '</p>'; }

    if (block.type === 'callout') {
      return '<div class="solution-callout"><p class="solution-callout-title">' + block.title +
        '</p>' + block.blocks.map(blockMarkup).join('') + '</div>';
    }

    if (block.type === 'details') {
      return '<div class="solution-details"><button type="button" class="solution-details-toggle">' +
        block.title + '</button><div class="solution-details-body"><div>' +
        block.blocks.map(blockMarkup).join('') + '</div></div></div>';
    }

    if (block.type === 'scene') { return GraphRenderer.renderGraph(block.scene); }
    return '';
  }

  function stepMarkup(step) {
    return '<section class="solution-step"><div class="solution-number">' + step.number + '</div>' +
      '<div><div class="solution-head"><h3 class="solution-title">' + step.title + '</h3>' +
      (step.arrow ? arrowIcon(step.arrow) : '') + '</div>' +
      step.blocks.map(blockMarkup).join('') + '</div></section>';
  }

  /* Схематичная стрелка направления — без подписей, цветом прямой. */
  function arrowIcon(direction) {
    var up = direction === 'up';
    return '<svg class="solution-arrow" width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">' +
      '<path d="M4 ' + (up ? 17 : 5) + 'L18 ' + (up ? 5 : 17) + '" stroke="var(--color-primary, #1F5FD0)" ' +
      'stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M' + (up ? '12 5H18V11' : '12 17H18V11') + '" fill="none" ' +
      'stroke="var(--color-primary, #1F5FD0)" stroke-width="2.4" stroke-linecap="round" ' +
      'stroke-linejoin="round"/></svg>';
  }

  function escapeAttr(value) {
    return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  /* Пока KaTeX не загружен, формула читается своим набором. */
  function texFallback(tx) {
    return String(tx)
      .replace(/\\operatorname\{tg\}/g, 'tg')
      .replace(/\\dfrac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2')
      .replace(/\\cdot/g, '·')
      .replace(/\\alpha/g, 'α')
      .replace(/\^\\circ/g, '°')
      .replace(/\{,\}/g, ',')
      .replace(/\\,/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* Раскрывающийся блок: плавно, а при выключенном движении — сразу. */
  function bindDetails(root) {
    Array.prototype.forEach.call(root.querySelectorAll('.solution-details'), function (node) {
      node.querySelector('.solution-details-toggle').addEventListener('click', function () {
        node.classList.toggle('open');
      });
    });
  }

  /* Правило ответа берётся из описания задачи. */
  function taskRule(id) {
    var all = sets.prep.concat(sets.prototypes);
    var rule = null;
    all.forEach(function (set) {
      (set.tasks || []).forEach(function (task) { if (task.id === id) { rule = task.answerRule; } });
    });
    return rule;
  }

  /* ── События ──────────────────────────────────────────── */
  el.mode.addEventListener('change', function () {
    current.mode = el.mode.value;
    fillSets();
    render();
  });
  el.set.addEventListener('change', function () {
    current.setId = el.set.value;
    syncSeed();
    render();
  });
  el.seed.addEventListener('change', function () { current.seed = Number(el.seed.value); });
  el.rebuild.addEventListener('click', function () { current.seed = Number(el.seed.value); render(); });
  el.grid.addEventListener('click', function (event) {
    var card = event.target.closest('.card');
    if (card) { openTask(card.getAttribute('data-id')); }
  });

  /* Ссылка вида preview.html#task=P12-1-01&auto=1 открывает задачу
     и сразу запускает разбор: так его удобно смотреть и снимать. */
  function openFromHash() {
    var hash = (location.hash || '').replace('#', '');
    if (!hash) { return; }
    var params = {};
    hash.split('&').forEach(function (pair) {
      var parts = pair.split('=');
      params[parts[0]] = decodeURIComponent(parts[1] || '');
    });
    if (!params.task) { return; }

    var setId = params.task.indexOf('P12-') === 0
      ? params.task.slice(0, params.task.lastIndexOf('-'))
      : params.task.split('-')[0];
    var mode = params.task.indexOf('P12-') === 0 ? 'prep' : 'prototypes';

    current.mode = mode;
    el.mode.value = mode;
    fillSets();
    current.setId = setId;
    el.set.value = setId;
    syncSeed();
    if (params.seed) { current.seed = Number(params.seed); el.seed.value = params.seed; }
    render();
    openTask(params.task);

    /* only=panel — служебный режим: на странице остаётся только разбор.
       Нужен, чтобы снимать анимацию по шагам. */
    if (params.only === 'panel') {
      container.querySelector('header').style.display = 'none';
      el.grid.style.display = 'none';
      container.querySelector('main').style.gridTemplateColumns = 'minmax(0, 1fr)';
      el.panel.style.position = 'static';
    }

    if (params.auto === '1') {
      container.querySelector('#giveup').click();
      container.querySelector('#show').click();
    }

    /* open=1 — развернуть блок «Откуда берётся минус»: нужен для показа. */
    if (params.open === '1') {
      setTimeout(function () {
        Array.prototype.forEach.call(container.querySelectorAll('.solution-details'), function (node) {
          node.classList.add('open');
        });
      }, 50);
    }
  }

  load().then(function () {
    counts();
    fillSets();
    render();
    katexUpgrade(container);
    openFromHash();
  });
}

export default mountPreview;
