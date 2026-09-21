/**
 * Глифы для стеклянного кружка GlassBadge.
 *
 * Простые формы на сетке 24×24, белые с прозрачностью из токена
 * (класс glass-glyph). Рисуются здесь, а не берутся из NavIcons: значок
 * в кружке — заливка со скруглениями, а иконки навигации — тонкая обводка,
 * и под стеклом она терялась.
 */

/** Гистограмма: четыре столбика разной высоты на основании. */
export function HistogramGlyph() {
  return (
    <svg className="glass-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="5" y="13" width="2.8" height="6.5" rx="1.4" />
      <rect x="9.1" y="9.5" width="2.8" height="10" rx="1.4" />
      <rect x="13.2" y="4.5" width="2.8" height="15" rx="1.4" />
      <rect x="17.3" y="11" width="2.8" height="8.5" rx="1.4" />
      <rect x="3" y="19" width="18" height="2.4" rx="1.2" />
    </svg>
  );
}
