/**
 * Очистка вёрстки задач ДЗ перед показом.
 *
 * Условия и решения ДЗ набраны KaTeX в браузере репетитора и лежат в
 * базе готовым HTML. Ученик показывает их у себя — поэтому перед показом
 * из вёрстки убирается всё, кроме того, из чего состоит набор KaTeX:
 * теги текста и MathML, SVG корней и скобок, классы и размеры. Скрипты,
 * ссылки, картинки, обработчики событий и url() в стилях не проходят.
 */

const TAGS = new Set([
  // Текст и вёрстка KaTeX.
  'span',
  'p',
  'br',
  'b',
  'strong',
  'i',
  'em',
  'sup',
  'sub',
  'small',
  'div',
  // MathML.
  'math',
  'semantics',
  'annotation',
  'mrow',
  'mi',
  'mo',
  'mn',
  'ms',
  'mtext',
  'mspace',
  'msup',
  'msub',
  'msubsup',
  'mfrac',
  'msqrt',
  'mroot',
  'mover',
  'munder',
  'munderover',
  'mtable',
  'mtr',
  'mtd',
  'mstyle',
  'mpadded',
  'mphantom',
  'menclose',
  // SVG знаков корня и растянутых скобок.
  'svg',
  'path',
  'line',
  'g',
  'rect',
  // Чертежи карточек и задач (движки разделов): только рисунок, без
  // ссылок, скриптов и встроенного HTML.
  'circle',
  'ellipse',
  'polygon',
  'polyline',
  'text',
  'tspan',
  'defs',
  'marker',
  'title',
  'desc',
  // Решения: списки, таблицы, сворачиваемая панель «Считаем с умом».
  'ul',
  'ol',
  'li',
  'table',
  'thead',
  'tbody',
  'tr',
  'td',
  'th',
  'caption',
  'details',
  'summary',
  'figure',
  // Иллюстрации условий №4 и №5: только картинки сайта (src — см. safeSrc).
  'img',
]);

const ATTRS = new Set([
  'class',
  'style',
  'aria-hidden',
  'role',
  'xmlns',
  'encoding',
  'display',
  'mathvariant',
  'stretchy',
  'fence',
  'separator',
  'lspace',
  'rspace',
  'width',
  'height',
  'viewbox',
  'preserveaspectratio',
  'd',
  'x',
  'y',
  'x1',
  'x2',
  'y1',
  'y2',
  'stroke-width',
  'fill',
  'stroke',
  'transform',
  'columnalign',
  'rowspacing',
  'columnspacing',
  'accent',
  'accentunder',
  'linethickness',
  'scriptlevel',
  'displaystyle',
  'minsize',
  'maxsize',
  'movablelimits',
  'notation',
  'depth',
  'voffset',
  // Чертежи.
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'dx',
  'dy',
  'points',
  'text-anchor',
  'font-size',
  'font-weight',
  'font-style',
  'font-family',
  'dominant-baseline',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-opacity',
  'fill-opacity',
  'opacity',
  'marker-start',
  'marker-end',
  'refx',
  'refy',
  'markerwidth',
  'markerheight',
  'orient',
  'id',
  'focusable',
  'aria-label',
  'open',
  'colspan',
  'rowspan',
  'src',
  'alt',
  'loading',
  'decoding',
]);

/** Картинка — только файл сайта из /images/: без чужих адресов и data:. */
function safeSrc(tag: string, value: string): boolean {
  return tag === 'img' && /^\/images\/[\w\-/.]+$/.test(value) && !value.includes('..');
}

/** Стиль без url(), expression() и javascript:. */
function safeStyle(value: string): boolean {
  return !/url\s*\(|expression\s*\(|javascript:|@import|behavior\s*:/i.test(value);
}

function clean(node: Element): void {
  for (const child of Array.from(node.children)) {
    const tag = child.localName.toLowerCase();
    if (!TAGS.has(tag)) {
      child.remove();
      continue;
    }
    for (const attr of Array.from(child.attributes)) {
      const name = attr.name.toLowerCase();
      if (
        !ATTRS.has(name) ||
        (name === 'style' && !safeStyle(attr.value)) ||
        (name === 'src' && !safeSrc(tag, attr.value))
      ) {
        child.removeAttribute(attr.name);
      }
    }
    clean(child);
  }
}

/** Вёрстка, которую можно вставить в страницу. Без браузера — пустая строка. */
export function sanitizeHtml(html: string): string {
  if (typeof document === 'undefined') return '';
  const template = document.createElement('template');
  template.innerHTML = html;
  const root = document.createElement('div');
  root.append(template.content.cloneNode(true));
  clean(root);
  return root.innerHTML;
}
