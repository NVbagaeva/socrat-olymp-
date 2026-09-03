/* График динамики качества знаний: инлайновый SVG без библиотек.
   Четыре когорты, у каждой свой набор учебных лет; пропуск года рисуется
   пунктиром, чтобы не выдавать разрыв за измерение.
   Палитра проверена валидатором (адъяцентные пары, CVD, светлая поверхность);
   контрастный варн снимается прямыми подписями и таблицей с теми же числами. */

(function () {
  'use strict';

  var COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'];

  var W = 820;
  var H = 400;
  var M = { top: 24, right: 196, bottom: 46, left: 46 };
  var Y_MIN = 70;
  var Y_MAX = 100;

  var host = document.getElementById('chart-host');
  var legendHost = document.getElementById('chart-legend');
  var captionHost = document.getElementById('chart-caption');
  var tableHost = document.getElementById('quality-table');

  function esc(value) { return Site.esc(value); }

  function xFor(years, year) {
    var step = (W - M.left - M.right) / Math.max(1, years.length - 1);
    return M.left + years.indexOf(year) * step;
  }

  function yFor(value) {
    var ratio = (value - Y_MIN) / (Y_MAX - Y_MIN);
    return H - M.bottom - ratio * (H - M.top - M.bottom);
  }

  /* Точки серии, разбитые на отрезки подряд идущих лет. */
  function runs(years, points) {
    var result = [];
    var current = [];

    points.forEach(function (point, i) {
      if (i > 0) {
        var prevIndex = years.indexOf(points[i - 1].year);
        var thisIndex = years.indexOf(point.year);
        if (thisIndex - prevIndex > 1) {
          result.push(current);
          current = [];
        }
      }
      current.push(point);
    });

    if (current.length) result.push(current);
    return result;
  }

  function pathFor(years, points) {
    return points.map(function (point, i) {
      return (i ? 'L' : 'M') + xFor(years, point.year).toFixed(1) + ' ' + yFor(point.value).toFixed(1);
    }).join(' ');
  }

  function buildSvg(quality) {
    var years = quality.years;
    var parts = [];

    parts.push('<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" width="100%" ' +
      'style="min-width: 620px; display: block;" ' +
      'aria-label="' + esc(quality.caption) + '">');

    /* Сетка и подписи оси Y */
    for (var value = Y_MIN; value <= Y_MAX; value += 5) {
      var y = yFor(value);
      parts.push('<line x1="' + M.left + '" y1="' + y.toFixed(1) + '" x2="' + (W - M.right) + '" y2="' + y.toFixed(1) +
        '" stroke="#e2ddd2" stroke-width="1"/>');
      parts.push('<text x="' + (M.left - 10) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end" ' +
        'font-size="12" fill="#6b7f96">' + value + '</text>');
    }

    /* Подписи оси X */
    years.forEach(function (year) {
      parts.push('<text x="' + xFor(years, year).toFixed(1) + '" y="' + (H - M.bottom + 24) +
        '" text-anchor="middle" font-size="12" fill="#6b7f96">' + esc(year) + '</text>');
    });

    /* Линии, точки и прямые подписи */
    var endLabels = [];

    quality.series.forEach(function (series, index) {
      var color = COLORS[index % COLORS.length];
      var segments = runs(years, series.points);

      /* Пунктирные перемычки через пропущенные годы. */
      for (var s = 1; s < segments.length; s++) {
        var from = segments[s - 1][segments[s - 1].length - 1];
        var to = segments[s][0];
        parts.push('<path d="' + pathFor(years, [from, to]) + '" fill="none" stroke="' + color +
          '" stroke-width="2" stroke-dasharray="3 5" stroke-linecap="round" opacity="0.55"/>');
      }

      segments.forEach(function (segment) {
        if (segment.length > 1) {
          parts.push('<path d="' + pathFor(years, segment) + '" fill="none" stroke="' + color +
            '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>');
        }
      });

      series.points.forEach(function (point) {
        var cx = xFor(years, point.year);
        var cy = yFor(point.value);
        parts.push('<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="4.5" fill="' + color +
          '" stroke="#ffffff" stroke-width="2"/>');
        parts.push('<circle class="chart__hit" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="14" fill="transparent" ' +
          'data-label="' + esc(series.name + ' · ' + point.grade + ' · ' + point.year) + '" ' +
          'data-value="' + point.value + '%">' +
          '<title>' + esc(series.name + ', ' + point.grade + ', ' + point.year + ': ' + point.value + '%') + '</title>' +
          '</circle>');
      });

      var last = series.points[series.points.length - 1];
      endLabels.push({
        x: xFor(years, last.year),
        y: yFor(last.value),
        name: series.name,
        value: last.value,
        color: color
      });
    });

    /* Разводим подписи по вертикали, чтобы не наезжали друг на друга. */
    endLabels.sort(function (a, b) { return a.y - b.y; });
    for (var i = 1; i < endLabels.length; i++) {
      if (endLabels[i].y - endLabels[i - 1].y < 18) {
        endLabels[i].y = endLabels[i - 1].y + 18;
      }
    }

    endLabels.forEach(function (label) {
      parts.push('<circle cx="' + (label.x + 14) + '" cy="' + (label.y - 4).toFixed(1) + '" r="4" fill="' + label.color + '"/>');
      parts.push('<text x="' + (label.x + 24) + '" y="' + label.y.toFixed(1) + '" font-size="12.5" fill="#3d5470" ' +
        'stroke="#ffffff" stroke-width="3" paint-order="stroke" style="font-weight:500;">' +
        esc(label.name) + ' — ' + label.value + '%</text>');
    });

    parts.push('</svg>');
    return parts.join('');
  }

  function buildLegend(quality) {
    return quality.series.map(function (series, index) {
      return '<span><span class="chart__swatch" style="background:' + COLORS[index % COLORS.length] + '"></span>' +
        esc(series.name) + '</span>';
    }).join('');
  }

  function buildTable(quality) {
    var years = quality.years;

    var head = '<tr><th scope="col">Класс</th>' + years.map(function (year) {
      return '<th scope="col">' + esc(year) + '</th>';
    }).join('') + '</tr>';

    var body = quality.series.map(function (series) {
      var byYear = {};
      series.points.forEach(function (point) { byYear[point.year] = point; });

      var cells = years.map(function (year) {
        var point = byYear[year];
        return '<td>' + (point ? point.value + '% <span style="color: var(--ink-muted);">(' + esc(point.grade) + ')</span>' : '—') + '</td>';
      }).join('');

      return '<tr><th scope="row">' + esc(series.name) + '</th>' + cells + '</tr>';
    }).join('');

    return '<table class="data"><caption>' + esc(quality.caption) + '</caption>' +
      '<thead>' + head + '</thead><tbody>' + body + '</tbody></table>';
  }

  /* Подсказка при наведении на точку. */
  function attachTooltip(container) {
    var tip = document.createElement('div');
    tip.style.cssText = 'position:fixed; z-index:120; pointer-events:none; opacity:0; transition:opacity .12s ease;' +
      'background:#10233a; color:#fff; font-size:12.5px; line-height:1.4; padding:8px 10px; border-radius:8px;' +
      'box-shadow:0 6px 20px rgba(16,35,58,.2); max-width:240px;';
    document.body.appendChild(tip);

    container.addEventListener('pointerover', function (event) {
      var hit = event.target.closest('.chart__hit');
      if (!hit) return;
      tip.innerHTML = '<b>' + hit.dataset.value + '</b><br>' + esc(hit.dataset.label);
      tip.style.opacity = '1';
    });

    container.addEventListener('pointermove', function (event) {
      if (tip.style.opacity !== '1') return;
      tip.style.left = Math.min(event.clientX + 14, window.innerWidth - 250) + 'px';
      tip.style.top = (event.clientY - 12) + 'px';
    });

    container.addEventListener('pointerout', function (event) {
      if (event.target.closest('.chart__hit')) tip.style.opacity = '0';
    });
  }

  function render(quality) {
    if (!host || !quality) return;

    host.innerHTML = buildSvg(quality);
    if (legendHost) legendHost.innerHTML = buildLegend(quality);
    if (captionHost) captionHost.textContent = quality.caption + '. ' + quality.note +
      ' Пунктир — год, за который показатель по этому классу не выставлялся.';
    if (tableHost) tableHost.innerHTML = buildTable(quality);

    attachTooltip(host);
  }

  window.renderQualityChart = render;

  /* Если about.js отработал раньше — забираем данные, которые он отложил. */
  if (window.__qualityData) render(window.__qualityData);
})();
