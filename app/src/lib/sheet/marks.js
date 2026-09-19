/* sheet/marks.js — знаки листа инлайновым SVG: логотип, иконки
   соцсетей, декоративные дуги.

   Все они красятся токенами темы, поэтому монохромная версия
   логотипа — не отдельный файл, а та же разметка в другой теме:
   в цвете синий квадрат с белым знаком, в печати белый квадрат
   с чёрным контуром и чёрным знаком.

   Сам знак повторяет app/public/icons/logo.svg: те же координаты,
   заново он не рисуется.
*/

/**
 * Знак логотипа. size — сторона в миллиметрах.
 */
function logoMark(size) {
  return '<svg class="sheet-logo-mark" width="' + size + 'mm" height="' + size + 'mm" ' +
    'viewBox="0 0 32 32" aria-hidden="true">' +
    '<rect x="0.75" y="0.75" width="30.5" height="30.5" rx="7.5" ' +
      'fill="var(--sheet-chip-bg)" stroke="var(--sheet-chip-line)" ' +
      'stroke-width="var(--sheet-chip-width)"/>' +
    '<g stroke="var(--sheet-chip-ink)" stroke-width="3" stroke-linecap="round" fill="none">' +
      '<line x1="7" y1="24" x2="25" y2="24"/>' +
      '<line x1="7" y1="24" x2="25" y2="9"/>' +
    '</g></svg>';
}

/** Иконка Telegram: бумажный самолётик в круге. */
function telegramIcon(size) {
  return '<svg width="' + size + 'mm" height="' + size + 'mm" viewBox="0 0 16 16" aria-hidden="true">' +
    '<circle cx="8" cy="8" r="7.25" fill="var(--sheet-chip-bg)" ' +
      'stroke="var(--sheet-chip-line)" stroke-width="var(--sheet-chip-width)"/>' +
    '<path d="M3.9 7.9 11.6 4.7c.4-.16.78.2.66.6l-1.7 5.9c-.1.36-.55.46-.8.18L8.1 9.6l-1.2 1.15a.4.4 0 0 1-.68-.26l-.13-1.7-1.9-.5c-.4-.1-.42-.63-.03-.78Z" ' +
      'fill="var(--sheet-chip-ink)"/>' +
    '<path d="M6.9 9.1 10.6 6" stroke="var(--sheet-chip-bg)" stroke-width="0.5" ' +
      'stroke-linecap="round" fill="none"/>' +
    '</svg>';
}

/** Иконка YouTube: скруглённый прямоугольник с треугольником. */
function youtubeIcon(size) {
  return '<svg width="' + size + 'mm" height="' + size + 'mm" viewBox="0 0 16 16" aria-hidden="true">' +
    '<rect x="0.75" y="2.75" width="14.5" height="10.5" rx="3" fill="var(--sheet-chip-bg)" ' +
      'stroke="var(--sheet-chip-line)" stroke-width="var(--sheet-chip-width)"/>' +
    '<path d="M6.5 5.6 11 8l-4.5 2.4Z" fill="var(--sheet-chip-ink)"/>' +
    '</svg>';
}

var ICONS = { telegram: telegramIcon, youtube: youtubeIcon };

/** Иконка соцсети по имени. Неизвестное имя — без иконки. */
function socialIcon(name, size) {
  var make = ICONS[name];
  return make ? make(size) : '';
}

/**
 * Декоративные тонкие дуги в углах. Очень светлые, лежат под
 * содержимым и в ч/б теме не выводятся вовсе.
 */
function arcs() {
  return '<svg class="sheet-arcs" viewBox="0 0 210 297" preserveAspectRatio="none" aria-hidden="true">' +
    '<circle cx="196" cy="16" r="26"/>' +
    '<circle cx="196" cy="16" r="38"/>' +
    '<circle cx="202" cy="10" r="14"/>' +
    '<circle cx="14" cy="282" r="22"/>' +
    '<circle cx="14" cy="282" r="33"/>' +
    '</svg>';
}

/**
 * Стрелка между формулами краткого решения.
 *
 * Рисуется, а не набирается знаком «→»: в подмножестве Inter его нет,
 * и браузер тянул за ним посторонний системный шрифт — в PDF
 * вшивался лишний гротеск, а стрелка выбивалась из строки.
 * Цвет берётся от текста.
 */
function arrow() {
  return '<svg class="sheet-arrow" width="12" height="8" viewBox="0 0 12 8" ' +
    'aria-hidden="true" focusable="false">' +
    '<path d="M0.5 4H10M7 1l3 3-3 3" fill="none" stroke="currentColor" ' +
      'stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';
}

/**
 * Паттерны штриховки для ч/б печати. Кладутся в документ один раз
 * (spec.defs), а рисунки ссылаются на них по имени: url(#sheet-hatch).
 *
 * Единицы — пространство того рисунка, который штрихуется, поэтому
 * шаг подобран под масштаб рисунков раздела: около миллиметра на
 * бумаге. Цвет штриха — чернила темы.
 *
 *   sheet-hatch        плотная косая штриховка: благоприятная область
 *   sheet-hatch-light  редкая, наклон вправо: область первого условия
 *   sheet-hatch-back   редкая, наклон влево: область второго условия;
 *                      там, где они накладываются, выходит клетка
 */
function hatchDefs() {
  function pattern(id, step, width, angle) {
    return '<pattern id="' + id + '" patternUnits="userSpaceOnUse" width="' + step +
      '" height="' + step + '" patternTransform="rotate(' + angle + ')">' +
      '<line x1="0" y1="0" x2="0" y2="' + step + '" stroke="var(--sheet-ink)" ' +
      'stroke-width="' + width + '"/></pattern>';
  }
  return '<svg class="sheet-defs" width="0" height="0" aria-hidden="true"><defs>' +
    pattern('sheet-hatch', 6, 1.4, 45) +
    pattern('sheet-hatch-light', 9, 1, 45) +
    pattern('sheet-hatch-back', 9, 1, -45) +
    '</defs></svg>';
}

const api = { hatchDefs: hatchDefs, logoMark: logoMark, socialIcon: socialIcon, arcs: arcs, arrow: arrow };

export default api;
export { hatchDefs, logoMark, socialIcon, arcs, arrow };
