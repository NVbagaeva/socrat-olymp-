/**
 * Очистка вёрстки задач ДЗ перед показом.
 *
 * Условия и решения ДЗ набраны KaTeX в браузере репетитора и лежат в
 * базе готовым HTML. Ученик показывает их у себя — поэтому перед показом
 * из вёрстки убирается всё, кроме того, из чего состоит набор KaTeX:
 * теги текста и MathML, SVG корней и скобок, классы и размеры. Скрипты,
 * ссылки, картинки, обработчики событий и url() в стилях не проходят.
 *
 * Чертежи движков сайта (планиметрия, векторы, графики, мосты №10 и др.)
 * и таблицы условия (график долга, модель задачи) идут в условии ДЗ
 * готовой вёрсткой. В SVG — фигуры, подписи <text>, штриховка
 * <pattern>. Ссылка на штриховку — только своя, url(#id); id — только у
 * <pattern>. Ссылок href и <image> нет.
 */

export const TAGS = new Set([
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
  // Списки шагов разбора (решение задачи «Собрать вариант» в новой выдаче ДЗ).
  'ol',
  'ul',
  'li',
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
  // Таблицы условия (график долга №16, модель текстовой задачи).
  'figure',
  'figcaption',
  'table',
  'caption',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  // Чертежи движков сайта.
  'circle',
  'ellipse',
  'polygon',
  'polyline',
  'text',
  'tspan',
  'defs',
  'pattern',
  'title',
]);

export const ATTRS = new Set([
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
  'colspan',
  'rowspan',
  'scope',
  // Чертежи движков сайта.
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'dx',
  'dy',
  'points',
  'opacity',
  'fill-opacity',
  'stroke-opacity',
  'stroke-linejoin',
  'stroke-linecap',
  'stroke-dasharray',
  'paint-order',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'text-anchor',
  'dominant-baseline',
  'textlength',
  'lengthadjust',
  'aria-label',
  'patternunits',
  'patterntransform',
]);

/** Ссылка в значении атрибута — только на свою штриховку: url(#id). */
function safeValue(value: string): boolean {
  const urls = value.match(/url\s*\([^)]*\)/gi) ?? [];
  return (
    urls.every((u) => /^url\(#[A-Za-z0-9_-]+\)$/.test(u.replace(/\s+/g, ''))) &&
    !/javascript:|expression\s*\(/i.test(value)
  );
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
      /* id — только у штриховки: на неё ссылается fill="url(#id)". */
      const razreshyon = ATTRS.has(name) || (name === 'id' && tag === 'pattern');
      if (!razreshyon || (name === 'style' && !safeStyle(attr.value)) || !safeValue(attr.value)) {
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
