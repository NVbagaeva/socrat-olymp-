/* scripts/lib/math-markup.mjs — математика вне KaTeX.

   Одно правило на аудит и на автопроверку (check-math-markup.mjs):
   в тексте, который видит ученик, формула должна быть набрана KaTeX —
   разметкой $…$ в данных или готовой вёрсткой .katex на странице.
   Здесь — признаки «формулы обычным текстом» и разбор HTML без
   зависимостей: текст страницы вне <script>, <style>, чертежей <svg>
   и уже набранных формул.

   Признаки (каждый — отдельное правило с именем, чтобы отчёт говорил,
   что именно нашлось):
     func      f(x), g(−12), y(0)             — запись функции
     relation  k > 0, y = kx, x ≤ 3            — переменная и знак отношения
     fraction  k/x, (kx + a)/(x + b), 3/4      — дробь через косую черту
     product   x · y, 2 × 3                    — умножение
     power     x², a^2                         — степень
     point     A(2; −3), (1; 4)                — точка координатами
     interval  (−∞; 3], [0; 5)                 — промежуток
     greek     α, Δx, π                        — греческие буквы
     variable  «найдите k», «коэффициент a»    — одиночная латинская буква
     minus     −3, x − 2                       — типографский минус в числах
*/

/* Буквы-переменные. Кириллица в \w не входит — и хорошо: «и/или»
   не дробь, а «д/з» не формула. */
const LAT = 'A-Za-z';

export const RULES = [
  { id: 'func', re: /(?<![A-Za-zА-Яа-яЁё])[fghyFG]\s*\(\s*[^()]{0,16}\)/g },
  {
    id: 'relation',
    re: new RegExp(
      `(?<![${LAT}А-Яа-яЁё])[${LAT}α-ωΔ](?:[₀-₉ₐ-ₜ]|_\\w)?\\s*[=<>≤≥≠]\\s*[-−+]?[\\w(α-ωΔ√]`, 'g'),
  },
  { id: 'fraction', re: /(?:[A-Za-z0-9)²](?:[₀-₉])?|\))\s*\/\s*(?:[A-Za-z0-9(√]|\()/g },
  { id: 'product', re: /[A-Za-z0-9)²]\s*[·×]\s*[A-Za-z0-9(−-]/g },
  { id: 'power', re: /[A-Za-z0-9)][²³⁴]|[A-Za-z0-9)]\s*\^\s*[\w({]/g },
  { id: 'point', re: /(?:\b[A-Z]\s*)?\(\s*[-−]?\d+(?:[,.]\d+)?\s*;\s*[-−]?\d+(?:[,.]\d+)?\s*\)/g },
  { id: 'interval', re: /[([]\s*[-−]?(?:\d+(?:,\d+)?|∞)\s*;\s*[-−+]?(?:\d+(?:,\d+)?|∞)\s*[)\]]/g },
  /* Одиночная греческая буква — переменная; слово греческими
     буквами («ὑπερβολή») — просто слово. */
  { id: 'greek', re: /(?<![\u0370-\u03ff\u1f00-\u1fff])[α-ωΔΣΩ](?![\u0370-\u03ff\u1f00-\u1fff])/g },
  {
    /* Одиночная латинская буква словом среди русского текста:
       «найдите k», «точки A и B», «коэффициент a». */
    id: 'variable',
    re: /(?<=(?:^|[\s(«"—,:;]))[A-Za-z](?:[₀-₉])?(?=$|[\s.,:;!?)»"—])/g,
  },
  { id: 'minus', re: /(?<![\d\wА-Яа-яЁё])−\s?[\d\w(]|[\w)]\s−\s[\w(]/g },
];

/* Слова и обозначения, которые не формулы, хотя похожи: латиница в
   названиях, единицы, номера. Сравниваются с найденным куском. */
const NOT_MATH = [
  /^[IVX]$/,            /* римские цифры: раздел I */
  /^(?:PDF|ЕГЭ|ФИПИ)$/,
];

/**
 * Найти математику в обычном тексте. Возвращает [{ rule, match, at }].
 * Текст — уже без формул KaTeX и без разметки $…$.
 */
export function findPlainMath(text) {
  const found = [];
  for (const rule of RULES) {
    rule.re.lastIndex = 0;
    let m = rule.re.exec(text);
    while (m !== null) {
      const piece = m[0].trim();
      if (!NOT_MATH.some((re) => re.test(piece))) {
        found.push({ rule: rule.id, match: piece, at: m.index });
      }
      m = rule.re.exec(text);
    }
  }
  return found.sort((a, b) => a.at - b.at);
}

/** Строка данных: всё, что в $…$ или в готовой заглушке формулы
    <span class="math" data-tex>…</span>, — уже формула; проверяется
    остальное. Прочие теги снимаются. */
export function stripDollarMath(text) {
  return String(text)
    .replace(/\$[^$]*\$/g, ' ')
    .replace(/<span class="math"[^>]*>.*?<\/span>/g, ' ')
    .replace(/<[^>]+>/g, ' ');
}

/* ── Текст страницы ─────────────────────────────────────────────
   Небольшой разбор HTML: теги по порядку, стек «пропускаемых»
   элементов. Внутри <script>, <style>, <svg>, <template>, <code>,
   набранной формулы (.katex, .math, [data-tex]) текст не берётся. */

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
  'meta', 'param', 'source', 'track', 'wbr']);
const SKIP_TAGS = new Set(['script', 'style', 'svg', 'template', 'code', 'pre', 'noscript',
  'textarea', 'math', 'head', 'title']);

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', thinsp: ' ',
  minus: '−', middot: '·', times: '×', laquo: '«', raquo: '»', mdash: '—', ndash: '–' };

function decode(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (all, code) => {
    if (code[0] === '#') {
      const n = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return String.fromCodePoint(n);
    }
    return ENTITIES[code] ?? all;
  });
}

function skippedByAttrs(attrs) {
  if (/\bdata-tex\s*=/.test(attrs)) { return true; }
  const cls = /\bclass\s*=\s*"([^"]*)"/.exec(attrs);
  if (!cls) { return false; }
  /* .math — заглушка формулы движка (data-tex рядом), .katex — готовая
     вёрстка; .no-math-check — явное исключение в разметке. */
  return /(?:^|\s)(?:katex|katex-display|math|no-math-check)(?:\s|$)/.test(cls[1]);
}

/**
 * Куски видимого текста страницы вне формул. Соседние куски внутри
 * одного блока склеиваются, чтобы «k = » и «x · y» не разошлись по
 * разным узлам. Возвращает массив строк.
 */
export function visibleTexts(html) {
  const out = [];
  let buffer = '';
  const stack = [];          /* [{ tag, skip }] */
  let skipDepth = 0;
  const tagRe = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g;
  let last = 0;
  const BLOCK = /^(?:p|div|li|ul|ol|h[1-6]|section|article|header|footer|td|th|tr|table|figcaption|figure|button|a|label|nav|main|aside|dd|dt|blockquote)$/;

  function flush() {
    const text = buffer.replace(/\s+/g, ' ').trim();
    if (text) { out.push(text); }
    buffer = '';
  }

  let m = tagRe.exec(html);
  while (m !== null) {
    if (skipDepth === 0 && m.index > last) { buffer += decode(html.slice(last, m.index)); }
    last = tagRe.lastIndex;
    if (m[0].startsWith('<!--')) { m = tagRe.exec(html); continue; }
    const closing = m[1] === '/';
    const tag = m[2].toLowerCase();
    const selfClose = m[4] === '/' || VOID.has(tag);
    if (!closing) {
      if (BLOCK.test(tag) && skipDepth === 0) { flush(); }
      if (tag === 'br' && skipDepth === 0) { buffer += ' '; }
      if (!selfClose) {
        const skip = SKIP_TAGS.has(tag) || skippedByAttrs(m[3]);
        /* Формулу в тексте заменяем пробелом: «где $k$ — …» не должно
           склеиться в «где— …». */
        if (skip && skipDepth === 0) { buffer += ' ⟨формула⟩ '; }
        stack.push({ tag, skip });
        if (skip) { skipDepth += 1; }
      }
    } else {
      /* Закрываем до совпадающего тега: битая разметка не валит разбор. */
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tag === tag) {
          for (let j = stack.length - 1; j >= i; j--) {
            if (stack[j].skip) { skipDepth -= 1; }
          }
          stack.length = i;
          break;
        }
      }
      if (BLOCK.test(tag) && skipDepth === 0) { flush(); }
    }
    m = tagRe.exec(html);
  }
  if (skipDepth === 0) { buffer += decode(html.slice(last)); }
  flush();
  return out.map((text) => text.replace(/⟨формула⟩/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

/* ── Сырой TeX в видимом тексте ────────────────────────────────
   Формула, которую KaTeX не набрал, видна читателю как есть:
   «от конца $\vec{b}$», «0{,}6», «**жирный**». Признаки ниже ищутся
   в тексте, уже очищенном от набранных формул (visibleTexts), и в
   тексте PDF и листов печати. Любое срабатывание — ошибка: в видимом
   тексте ни знака доллара, ни команды TeX, ни разметки выделения
   быть не должно. */

export const RAW_TEX_RULES = [
  { id: 'dollar', re: /\$/g },
  { id: 'command', re: /\\(?:[A-Za-z]+|[,;:!{}|])/g },
  { id: 'tex-comma', re: /\{,\}/g },
  { id: 'braces', re: /[_^]\{|\}\{/g },
  { id: 'bold-marks', re: /\*\*/g },
];

/** Сырой TeX в тексте. Возвращает [{ rule, match, at }]. */
export function findRawTex(text) {
  const found = [];
  for (const rule of RAW_TEX_RULES) {
    rule.re.lastIndex = 0;
    let m = rule.re.exec(text);
    while (m !== null) {
      found.push({ rule: rule.id, match: m[0], at: m.index });
      m = rule.re.exec(text);
    }
  }
  return found;
}
