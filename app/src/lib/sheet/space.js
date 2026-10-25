/* sheet/space.js — «Место для решения» на листе ученика.

   Одна настройка для всех листов (генераторы разделов 1–13 и «Собрать
   вариант»): нет / пустое место / в клетку, размер — маленький, средний,
   большой (5 / 9 / 14 строк клеток) или «авто» — по длине решения
   учителя к этой задаче. У «Собрать вариант» ещё и по заданиям: свой
   размер или «без места» для отдельного номера.

   Поле стоит под условием и рисунком на всю ширину текста, строка
   «Ответ: ____» — после него. Клетка 5 мм, как в тетради. Сетка — SVG
   (линии, а не фон: фон браузер не печатает), рамка — граница блока.

   Лист раскладывает поле кусками (sheet.js, flowItems): условие, рисунок
   и первые FIRST_ROWS строк — один неделимый кусок; остальные строки —
   по одной, так что перенос на следующую страницу идёт только по
   границе строки клеток; последняя строка и «Ответ:» — один кусок, и
   строка ответа от поля не отрывается.

   Лист учителя и разбор — без поля всегда: настройку применяет только
   сборка листа ученика (applySpace). На задачи настройка не влияет. */

var MODES = ['none', 'blank', 'grid'];
var SIZES = ['S', 'M', 'L', 'auto'];
var ROWS = { S: 5, M: 9, L: 14 };
var AUTO = { min: 5, max: 14, from: 150, perRow: 75 };
var CELL_MM = 5;
/* Сколько строк поля обязаны встать на страницу вместе с условием. */
var FIRST_ROWS = 3;

var DEFAULT = { mode: 'none', size: 'auto', per: {} };

/* ── Код настройки ──────────────────────────────────────────────
   Параметр sp= адреса листа и хвост кода варианта: знаки Crockford
   base32. Первый знак — режим × 4 + размер, дальше пары «номер задания,
   размер» (4 — без места). «нет» без особых номеров — пустая строка. */
var ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function encodeSpace(space) {
  var s = normalizeSpace(space);
  var per = Object.keys(s.per).map(Number).sort(function (a, b) { return a - b; });
  if (s.mode === 'none') { return ''; }
  var out = ALPHABET[MODES.indexOf(s.mode) * 4 + SIZES.indexOf(s.size)];
  per.forEach(function (n) {
    var v = s.per[n];
    out += ALPHABET[n] + ALPHABET[v === 'none' ? 4 : SIZES.indexOf(v)];
  });
  return out;
}

function decodeSpace(token) {
  var text = String(token || '').trim().toUpperCase();
  if (text === '') { return normalizeSpace(null); }
  var head = ALPHABET.indexOf(text[0]);
  if (head < 0 || head >= MODES.length * 4) { return normalizeSpace(null); }
  var per = {};
  for (var i = 1; i + 1 < text.length; i += 2) {
    var n = ALPHABET.indexOf(text[i]);
    var v = ALPHABET.indexOf(text[i + 1]);
    if (n < 1 || v < 0 || v > 4) { continue; }
    per[n] = v === 4 ? 'none' : SIZES[v];
  }
  return normalizeSpace({ mode: MODES[Math.floor(head / 4)], size: SIZES[head % 4], per: per });
}

/** Настройка из чего угодно (хранилище, адрес): только допустимое. */
function normalizeSpace(raw) {
  var r = raw && typeof raw === 'object' ? raw : {};
  var per = {};
  if (r.per && typeof r.per === 'object') {
    Object.keys(r.per).forEach(function (key) {
      var n = Number(key);
      var v = r.per[key];
      if (n >= 1 && n <= 31 && (v === 'none' || SIZES.indexOf(v) >= 0)) { per[n] = v; }
    });
  }
  return {
    mode: MODES.indexOf(r.mode) >= 0 ? r.mode : DEFAULT.mode,
    size: SIZES.indexOf(r.size) >= 0 ? r.size : DEFAULT.size,
    per: per
  };
}

/** Адрес листа ученика с настройкой: sp= добавляется или убирается. */
function withSpace(href, space) {
  var parts = String(href).split('?');
  var params = new URLSearchParams(parts[1] || '');
  var token = encodeSpace(space);
  if (token === '') { params.delete('sp'); } else { params.set('sp', token); }
  var q = params.toString();
  return parts[0] + (q ? '?' + q : '');
}

/* ── Высота поля ────────────────────────────────────────────────── */

/* Длина решения учителя — его текст без разметки и без MathML-копий
   формул (KaTeX кладёт TeX второй раз в annotation). */
function solutionLength(html) {
  if (!html) { return null; }
  return String(html)
    .replace(/<annotation[\s\S]*?<\/annotation>/g, '')
    .replace(/<span class="katex-mathml">[\s\S]*?<\/math><\/span>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim().length;
}

/** Строк клеток при размере size; «авто» — по длине решения учителя. */
function rowsFor(size, length) {
  if (size !== 'auto') { return ROWS[size] || ROWS.M; }
  if (length === null || length === undefined) { return ROWS.M; }
  var rows = Math.round(AUTO.min + (length - AUTO.from) / AUTO.perRow);
  return Math.max(AUTO.min, Math.min(AUTO.max, rows));
}

/**
 * Поле задачи: { mode, rows } или null (без поля).
 * key — номер задания для настройки «по заданиям» (у варианта — номер
 * ЕГЭ), length — длина решения учителя для «авто».
 */
function spaceFor(space, key, length) {
  var s = normalizeSpace(space);
  if (s.mode === 'none') { return null; }
  var own = key === undefined || key === null ? undefined : s.per[key];
  if (own === 'none') { return null; }
  return { mode: s.mode, rows: rowsFor(own || s.size, length) };
}

/* ── Решения учителя для «авто» ─────────────────────────────────── */

/**
 * Длины решений по листу учителя: по id задачи и по номеру на листе.
 * Решение берётся из карточки (solutionHtml) или из куска потока с
 * номером решения (раздел «Ответы» и решения после задач).
 */
function solutionLengths(teacherSpec) {
  var byId = {};
  var byNo = {};
  var lists = teacherSpec && teacherSpec.variants && teacherSpec.variants.length
    ? teacherSpec.variants.map(function (v) { return v.blocks || []; })
    : [teacherSpec && teacherSpec.blocks || []];
  lists.forEach(function (blocks) {
    blocks.forEach(function (block) {
      (block.tasks || []).forEach(function (task) {
        var len = solutionLength(task.solutionHtml);
        if (len !== null) {
          if (task.id) { byId[task.id] = len; }
          if (task.no !== undefined) { byNo[task.no] = len; }
        }
      });
    });
  });
  var pieces = [].concat(teacherSpec && teacherSpec.extraItems || [],
    teacherSpec && teacherSpec.leadItems || []);
  pieces.forEach(function (html) {
    var no = /class="sheet-solution-no"[^>]*>\s*(\d+)\s*</.exec(String(html));
    if (no) { byNo[no[1]] = (byNo[no[1]] || 0) + solutionLength(html); }
  });
  return { byId: byId, byNo: byNo };
}

/**
 * Поставить поля задачам листа ученика (spec для buildDocument).
 * opts.keyOf(task) — номер для настройки по заданиям; opts.lengthOf(task)
 * — длина решения учителя (по умолчанию — из lengths: { byId, byNo }).
 */
function applySpace(spec, space, opts) {
  var s = normalizeSpace(space);
  if (s.mode === 'none' && !Object.keys(s.per).length) { return spec; }
  var o = opts || {};
  var lengths = o.lengths || null;
  var lengthOf = o.lengthOf || function (task) {
    if (!lengths) { return null; }
    var byId = task.id !== undefined ? lengths.byId[task.id] : undefined;
    return byId !== undefined ? byId : (lengths.byNo[task.no] === undefined ? null : lengths.byNo[task.no]);
  };
  var keyOf = o.keyOf || function () { return null; };
  function mark(blocks) {
    return (blocks || []).map(function (block) {
      if (!block.tasks) { return block; }
      return Object.assign({}, block, {
        tasks: block.tasks.map(function (task) {
          var field = spaceFor(s, keyOf(task), lengthOf(task));
          return field === null ? task : Object.assign({}, task, { space: field });
        })
      });
    });
  }
  return Object.assign({}, spec, spec.variants
    ? { variants: spec.variants.map(function (v) { return Object.assign({}, v, { blocks: mark(v.blocks) }); }) }
    : { blocks: mark(spec.blocks) });
}

/* ── Разметка поля ──────────────────────────────────────────────── */

/* Сетка — линии в миллиметрах на SVG шире любой колонки; блок поля
   шириной в целое число клеток (CSS round()) обрезает лишнее.
   Нижняя линия каждой строки стоит внутри строки: на стыке двух кусков
   одна линия, а не две. У последнего куска её заменяет рамка. Верхняя
   линия куска (sheet-space__top) видна, только когда кусок первый на
   странице (space.css): продолжение поля на новой странице начинается
   с закрытой строки клеток. */
var GRID_COLS = 44;
var LINE = 0.2;

function gridSvg(rows, last) {
  var w = GRID_COLS * CELL_MM;
  var h = rows * CELL_MM;
  var d = '';
  for (var x = CELL_MM; x < w; x += CELL_MM) { d += 'M' + x + ' 0V' + h; }
  for (var i = 1; i <= rows; i += 1) {
    if (last && i === rows) { continue; }
    d += 'M0 ' + (i * CELL_MM - LINE / 2) + 'H' + w;
  }
  var stroke = 'stroke="var(--sheet-space-line, #b3b3b3)" stroke-width="' + LINE + '"';
  return '<svg class="sheet-space__grid" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" ' +
    'viewBox="0 0 ' + w + ' ' + h + '" width="' + w + 'mm" height="' + h + 'mm">' +
    '<path d="' + d + '" fill="none" ' + stroke + '/>' +
    '<path class="sheet-space__top" d="M0 ' + LINE / 2 + 'H' + w + '" fill="none" ' + stroke + '/>' +
    '</svg>';
}

/**
 * Кусок поля из rows строк. first / last — верхний и нижний кусок поля:
 * у них рамка сверху и снизу.
 */
function spaceHtml(field, rows, first, last) {
  var grid = field.mode === 'grid';
  return '<div class="sheet-space sheet-space--' + field.mode +
    (first ? ' sheet-space--first' : '') + (last ? ' sheet-space--last' : '') +
    '" data-rows="' + rows + '" style="height:' + rows * CELL_MM + 'mm">' +
    (grid ? gridSvg(rows, last) : '') + '</div>';
}

const api = {
  MODES: MODES, SIZES: SIZES, ROWS: ROWS, AUTO: AUTO, CELL_MM: CELL_MM, FIRST_ROWS: FIRST_ROWS,
  DEFAULT: DEFAULT, encodeSpace: encodeSpace, decodeSpace: decodeSpace,
  normalizeSpace: normalizeSpace, withSpace: withSpace, solutionLength: solutionLength,
  rowsFor: rowsFor, spaceFor: spaceFor, solutionLengths: solutionLengths,
  applySpace: applySpace, spaceHtml: spaceHtml
};

export default api;
export { MODES, SIZES, ROWS, AUTO, CELL_MM, FIRST_ROWS, DEFAULT, encodeSpace, decodeSpace,
         normalizeSpace, withSpace, solutionLength, rowsFor, spaceFor, solutionLengths,
         applySpace, spaceHtml };
